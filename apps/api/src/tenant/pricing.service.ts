import { Injectable, NotFoundException } from "@nestjs/common";
import { DeliveryService } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreatePricingRuleInput = {
  name: string;
  deliveryService?: DeliveryService;
  packageTypeId?: string;
  baseFee: number;
  perKmFee?: number;
  perKgFee?: number;
  fragileSurcharge?: number;
  expressSurcharge?: number;
  minFee?: number;
  maxWeightKg?: number;
  isActive?: boolean;
};

export type UpdatePricingRuleInput = Partial<CreatePricingRuleInput>;

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.pricingRule.findMany({
      where: { operatorId: user.operatorId!, deletedAt: null },
      include: { packageType: { select: { id: true, code: true, name: true } } },
      orderBy: { name: "asc" },
    });
  }

  async create(user: TumaNowJwtPayload, input: CreatePricingRuleInput) {
    this.access.assertOperator(user);

    if (input.packageTypeId) {
      const pt = await this.prisma.packageType.findFirst({
        where: { id: input.packageTypeId, operatorId: user.operatorId! },
      });
      if (!pt) throw new NotFoundException("Package type not found");
    }

    const created = await this.prisma.pricingRule.create({
      data: {
        operatorId: user.operatorId!,
        name: input.name,
        deliveryService: input.deliveryService ?? "STANDARD",
        packageTypeId: input.packageTypeId,
        baseFee: input.baseFee,
        perKmFee: input.perKmFee ?? 0,
        perKgFee: input.perKgFee ?? 0,
        fragileSurcharge: input.fragileSurcharge ?? 0,
        expressSurcharge: input.expressSurcharge ?? 0,
        minFee: input.minFee,
        maxWeightKg: input.maxWeightKg,
        isActive: input.isActive ?? true,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "pricing.create",
      entityType: "PricingRule",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(
    user: TumaNowJwtPayload,
    id: string,
    input: UpdatePricingRuleInput,
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.pricingRule.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Pricing rule not found");

    if (input.packageTypeId) {
      const pt = await this.prisma.packageType.findFirst({
        where: { id: input.packageTypeId, operatorId: user.operatorId! },
      });
      if (!pt) throw new NotFoundException("Package type not found");
    }

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        name: input.name,
        deliveryService: input.deliveryService,
        packageTypeId: input.packageTypeId,
        baseFee: input.baseFee,
        perKmFee: input.perKmFee,
        perKgFee: input.perKgFee,
        fragileSurcharge: input.fragileSurcharge,
        expressSurcharge: input.expressSurcharge,
        minFee: input.minFee,
        maxWeightKg: input.maxWeightKg,
        isActive: input.isActive,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "pricing.update",
      entityType: "PricingRule",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }
}
