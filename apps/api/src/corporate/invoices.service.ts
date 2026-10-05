import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

const NET_TERMS_DAYS = 14;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.invoice.findMany({
      where: { operatorId: user.operatorId! },
      include: {
        customer: { select: { companyName: true, fullName: true } },
        items: true,
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async getForOperator(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, operatorId: user.operatorId! },
      include: {
        customer: true,
        items: { include: { shipment: { select: { trackingNumber: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  /**
   * Sweeps a business customer's un-invoiced corporate-billed shipments
   * (created within the given period) into a new invoice. Doesn't touch
   * CorporateAccount.currentBalance — that was already incremented when
   * each shipment was approved; the balance only comes back down when the
   * invoice is marked paid.
   */
  async generate(
    user: TumaNowJwtPayload,
    customerId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    this.access.assertOperator(user);
    if (periodEnd <= periodStart) {
      throw new BadRequestException("periodEnd must be after periodStart");
    }

    const account = await this.prisma.corporateAccount.findFirst({
      where: { operatorId: user.operatorId!, customerId },
    });
    if (!account) {
      throw new NotFoundException("No corporate account for this customer");
    }

    const shipments = await this.prisma.shipment.findMany({
      where: {
        operatorId: user.operatorId!,
        customerId,
        isCorporate: true,
        invoicedAt: null,
        // Only successfully completed deliveries are billable — a cancelled
        // corporate shipment has its accrued charge reversed off the
        // account balance instead (see tenant/shipments.service.ts).
        status: { in: ["DELIVERED", "COMPLETED"] },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { id: true, trackingNumber: true, finalPrice: true, quotedPrice: true },
    });

    if (!shipments.length) {
      throw new BadRequestException(
        "No un-invoiced corporate shipments found in that period",
      );
    }

    const items = shipments.map((s) => ({
      shipmentId: s.id,
      description: `Shipment ${s.trackingNumber}`,
      amount: Number(s.finalPrice ?? s.quotedPrice ?? 0),
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const invoiceNumber = await this.generateInvoiceNumber();
    const dueAt = new Date(Date.now() + NET_TERMS_DAYS * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          operatorId: user.operatorId!,
          customerId,
          corporateAccountId: account.id,
          currency: account.currency,
          periodStart,
          periodEnd,
          totalAmount,
          dueAt,
          items: { create: items },
        },
        include: { items: true },
      });

      await tx.shipment.updateMany({
        where: { id: { in: shipments.map((s) => s.id) } },
        data: { invoicedAt: new Date() },
      });

      return created;
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "invoice.generate",
      entityType: "Invoice",
      entityId: invoice.id,
      after: { invoiceNumber, totalAmount, shipmentCount: shipments.length },
    });

    return invoice;
  }

  /** Marks an invoice paid, releases the credit it covered, and records a Payment per shipment. */
  async markPaid(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, operatorId: user.operatorId! },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "ISSUED") {
      throw new BadRequestException(`Cannot mark ${invoice.status} invoice as paid`);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt: now },
      });

      await tx.corporateAccount.update({
        where: { id: invoice.corporateAccountId },
        data: { currentBalance: { decrement: invoice.totalAmount } },
      });

      for (const item of invoice.items) {
        if (!item.shipmentId) continue;
        const shipment = await tx.shipment.findUnique({
          where: { id: item.shipmentId },
          select: { status: true },
        });
        if (!shipment) continue;

        // Mirrors settleCod(): paying off a delivered shipment closes it out.
        const finalStatus = shipment.status === "DELIVERED" ? "COMPLETED" : shipment.status;
        if (finalStatus !== shipment.status) {
          await tx.shipment.update({
            where: { id: item.shipmentId },
            data: { status: finalStatus, completedAt: now },
          });
        }

        await tx.payment.create({
          data: {
            shipmentId: item.shipmentId,
            method: "CORPORATE",
            status: "COMPLETED",
            amount: item.amount,
            currency: invoice.currency,
            reference: invoice.invoiceNumber,
            paidAt: now,
          },
        });
        await tx.shipmentEvent.create({
          data: {
            shipmentId: item.shipmentId,
            status: finalStatus,
            note: `Invoice ${invoice.invoiceNumber} paid`,
            actorUserId: user.sub,
            metadata: { invoiceId: id },
          },
        });
      }
    });

    // A negative balance shouldn't be possible, but guard against drift.
    await this.prisma.corporateAccount.updateMany({
      where: { id: invoice.corporateAccountId, currentBalance: { lt: 0 } },
      data: { currentBalance: 0 },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "invoice.pay",
      entityType: "Invoice",
      entityId: id,
      after: { status: "PAID" },
    });

    return this.getForOperator(user, id);
  }

  async voidInvoice(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, operatorId: user.operatorId! },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "ISSUED") {
      throw new BadRequestException(`Cannot void a ${invoice.status} invoice`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id }, data: { status: "VOID" } });
      // Free the shipments back up so a corrected invoice can include them.
      await tx.shipment.updateMany({
        where: { id: { in: invoice.items.map((i) => i.shipmentId).filter((v): v is string => !!v) } },
        data: { invoicedAt: null },
      });
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "invoice.void",
      entityType: "Invoice",
      entityId: id,
    });

    return { ok: true };
  }

  async listForCustomer(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    return this.prisma.invoice.findMany({
      where: { customerId: user.customerId },
      include: {
        operator: { select: { tradingName: true, legalName: true, code: true } },
        items: true,
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async getForCustomer(user: TumaNowJwtPayload, id: string) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, customerId: user.customerId },
      include: {
        operator: { select: { tradingName: true, legalName: true } },
        items: { include: { shipment: { select: { trackingNumber: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });
    return `INV-${year}-${String(count + 1).padStart(6, "0")}`;
  }
}
