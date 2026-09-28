import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";
import { computeCommission } from "./commission";

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  // --- Platform side ---

  async listForPlatform() {
    return this.prisma.settlement.findMany({
      include: {
        operator: { select: { code: true, tradingName: true, legalName: true } },
      },
      orderBy: { generatedAt: "desc" },
    });
  }

  async getForPlatform(id: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { id },
      include: {
        operator: true,
        items: { include: { shipment: { select: { trackingNumber: true } } } },
      },
    });
    if (!settlement) throw new NotFoundException("Settlement not found");
    return settlement;
  }

  /**
   * Sweeps an operator's completed-and-unsettled shipments (created within
   * the period) into a settlement statement: what TumaNow owes the operator
   * after commission. Every payment method counts the same way here — this
   * doesn't model who currently holds the cash (COD sits with the operator
   * already; a real ledger would net that against the payout instead of
   * including it at face value).
   */
  async generate(
    adminUserId: string,
    operatorId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    if (periodEnd <= periodStart) {
      throw new BadRequestException("periodEnd must be after periodStart");
    }

    const operator = await this.prisma.operator.findFirst({
      where: { id: operatorId, deletedAt: null },
    });
    if (!operator) throw new NotFoundException("Operator not found");

    const shipments = await this.prisma.shipment.findMany({
      where: {
        operatorId,
        settledAt: null,
        status: { in: ["DELIVERED", "COMPLETED"] },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { id: true, trackingNumber: true, finalPrice: true, quotedPrice: true },
    });

    if (!shipments.length) {
      throw new BadRequestException("No unsettled completed shipments found in that period");
    }

    const terms = {
      commissionType: operator.commissionType,
      commissionPercent: operator.commissionPercent ? Number(operator.commissionPercent) : null,
      commissionFixedFee: operator.commissionFixedFee ? Number(operator.commissionFixedFee) : null,
    };

    const items = shipments.map((s) => {
      const gross = Number(s.finalPrice ?? s.quotedPrice ?? 0);
      const commission = computeCommission(gross, terms);
      return {
        shipmentId: s.id,
        grossAmount: gross,
        commissionAmount: commission,
        netAmount: gross - commission,
      };
    });

    const grossAmount = items.reduce((sum, i) => sum + i.grossAmount, 0);
    const commissionAmount = items.reduce((sum, i) => sum + i.commissionAmount, 0);
    const netAmount = items.reduce((sum, i) => sum + i.netAmount, 0);
    const settlementNumber = await this.generateSettlementNumber();

    const settlement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.settlement.create({
        data: {
          settlementNumber,
          operatorId,
          currency: operator.currency,
          periodStart,
          periodEnd,
          grossAmount,
          commissionAmount,
          netAmount,
          items: { create: items },
        },
        include: { items: true },
      });

      await tx.shipment.updateMany({
        where: { id: { in: shipments.map((s) => s.id) } },
        data: { settledAt: new Date() },
      });

      return created;
    });

    await this.audit.log({
      operatorId,
      userId: adminUserId,
      action: "settlement.generate",
      entityType: "Settlement",
      entityId: settlement.id,
      after: { settlementNumber, grossAmount, commissionAmount, netAmount, shipmentCount: shipments.length },
    });

    return settlement;
  }

  async markPaid(adminUserId: string, id: string) {
    const settlement = await this.prisma.settlement.findFirst({ where: { id } });
    if (!settlement) throw new NotFoundException("Settlement not found");
    if (settlement.status !== "PENDING") {
      throw new BadRequestException(`Cannot mark ${settlement.status} settlement as paid`);
    }

    const updated = await this.prisma.settlement.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await this.audit.log({
      operatorId: settlement.operatorId,
      userId: adminUserId,
      action: "settlement.pay",
      entityType: "Settlement",
      entityId: id,
      after: { status: "PAID" },
    });

    return updated;
  }

  async voidSettlement(adminUserId: string, id: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { id },
      include: { items: true },
    });
    if (!settlement) throw new NotFoundException("Settlement not found");
    if (settlement.status !== "PENDING") {
      throw new BadRequestException(`Cannot void a ${settlement.status} settlement`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.settlement.update({ where: { id }, data: { status: "VOID" } });
      await tx.shipment.updateMany({
        where: { id: { in: settlement.items.map((i) => i.shipmentId) } },
        data: { settledAt: null },
      });
    });

    await this.audit.log({
      operatorId: settlement.operatorId,
      userId: adminUserId,
      action: "settlement.void",
      entityType: "Settlement",
      entityId: id,
    });

    return { ok: true };
  }

  // --- Operator (tenant) side — read-only ---

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.settlement.findMany({
      where: { operatorId: user.operatorId! },
      orderBy: { generatedAt: "desc" },
    });
  }

  async getForOperator(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const settlement = await this.prisma.settlement.findFirst({
      where: { id, operatorId: user.operatorId! },
      include: { items: { include: { shipment: { select: { trackingNumber: true } } } } },
    });
    if (!settlement) throw new NotFoundException("Settlement not found");
    return settlement;
  }

  private async generateSettlementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.settlement.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });
    return `STL-${year}-${String(count + 1).padStart(6, "0")}`;
  }
}
