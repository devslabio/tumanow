import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CommissionType } from "@prisma/client";

import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OperatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.operator.findMany({
      where: { deletedAt: null },
      include: {
        subscriptionPlan: { select: { key: true, name: true } },
        _count: { select: { branches: true, memberships: true, shipments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(id: string) {
    const operator = await this.prisma.operator.findFirst({
      where: { id, deletedAt: null },
      include: {
        branches: { where: { deletedAt: null } },
        subscriptionPlan: true,
      },
    });
    if (!operator) throw new NotFoundException("Operator not found");
    return operator;
  }

  async approve(userId: string, id: string) {
    return this.transition(userId, id, ["PENDING", "SUSPENDED"], "ACTIVE", "operator.approve");
  }

  async reject(userId: string, id: string) {
    return this.transition(userId, id, ["PENDING"], "REJECTED", "operator.reject");
  }

  async suspend(userId: string, id: string) {
    return this.transition(userId, id, ["ACTIVE"], "SUSPENDED", "operator.suspend");
  }

  async reactivate(userId: string, id: string) {
    return this.transition(userId, id, ["SUSPENDED"], "ACTIVE", "operator.reactivate");
  }

  async updateCommission(
    userId: string,
    id: string,
    input: {
      commissionType: CommissionType;
      commissionPercent?: number;
      commissionFixedFee?: number;
    },
  ) {
    const operator = await this.get(id);

    if (
      (input.commissionType === "PERCENTAGE" || input.commissionType === "HYBRID") &&
      (input.commissionPercent == null || input.commissionPercent < 0 || input.commissionPercent > 100)
    ) {
      throw new BadRequestException("commissionPercent must be between 0 and 100");
    }
    if (
      (input.commissionType === "FIXED" || input.commissionType === "HYBRID") &&
      (input.commissionFixedFee == null || input.commissionFixedFee < 0)
    ) {
      throw new BadRequestException("commissionFixedFee must be zero or more");
    }

    const updated = await this.prisma.operator.update({
      where: { id },
      data: {
        commissionType: input.commissionType,
        commissionPercent: input.commissionPercent ?? 0,
        commissionFixedFee: input.commissionFixedFee ?? 0,
      },
    });

    await this.audit.log({
      userId,
      operatorId: id,
      action: "operator.commission.update",
      entityType: "Operator",
      entityId: id,
      before: {
        commissionType: operator.commissionType,
        commissionPercent: operator.commissionPercent,
        commissionFixedFee: operator.commissionFixedFee,
      },
      after: input,
    });

    return updated;
  }

  private async transition(
    userId: string,
    id: string,
    allowedFrom: string[],
    nextStatus: "ACTIVE" | "REJECTED" | "SUSPENDED",
    action: string,
  ) {
    const operator = await this.get(id);
    if (!allowedFrom.includes(operator.status)) {
      throw new BadRequestException(
        `Cannot ${action.split(".")[1]} an operator from status ${operator.status}`,
      );
    }

    const updated = await this.prisma.operator.update({
      where: { id },
      data: { status: nextStatus },
    });

    await this.audit.log({
      userId,
      operatorId: id,
      action,
      entityType: "Operator",
      entityId: id,
      before: { status: operator.status },
      after: { status: nextStatus },
    });

    return updated;
  }
}
