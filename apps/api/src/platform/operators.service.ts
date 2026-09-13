import { Injectable, NotFoundException } from "@nestjs/common";

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
    const operator = await this.get(id);
    const updated = await this.prisma.operator.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await this.audit.log({
      userId,
      action: "operator.approve",
      entityType: "Operator",
      entityId: id,
      before: { status: operator.status },
      after: { status: "ACTIVE" },
    });
    return updated;
  }
}
