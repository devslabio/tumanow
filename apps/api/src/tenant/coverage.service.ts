import { Injectable, NotFoundException } from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreateCoverageInput = {
  name: string;
  level: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
};

export type UpdateCoverageInput = Partial<CreateCoverageInput>;

@Injectable()
export class CoverageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.coverageArea.findMany({
      where: { operatorId: user.operatorId!, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async create(user: TumaNowJwtPayload, input: CreateCoverageInput) {
    this.access.assertOperator(user);
    const created = await this.prisma.coverageArea.create({
      data: {
        operatorId: user.operatorId!,
        name: input.name,
        level: input.level,
        config: (input.config ?? {}) as object,
        isActive: input.isActive ?? true,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "coverage.create",
      entityType: "CoverageArea",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(user: TumaNowJwtPayload, id: string, input: UpdateCoverageInput) {
    this.access.assertOperator(user);
    const existing = await this.prisma.coverageArea.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Coverage area not found");

    const updated = await this.prisma.coverageArea.update({
      where: { id },
      data: {
        name: input.name,
        level: input.level,
        config: input.config as object | undefined,
        isActive: input.isActive,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "coverage.update",
      entityType: "CoverageArea",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }
}
