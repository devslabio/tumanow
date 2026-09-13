import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BranchStatus } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreateBranchInput = {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  status?: BranchStatus;
};

export type UpdateBranchInput = Partial<CreateBranchInput>;

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.branch.findMany({
      where: {
        operatorId: user.operatorId!,
        deletedAt: null,
        ...this.access.branchFilter(user),
      },
      orderBy: { name: "asc" },
    });
  }

  async get(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        operatorId: user.operatorId!,
        deletedAt: null,
      },
    });
    if (!branch) throw new NotFoundException("Branch not found");
    return branch;
  }

  async create(user: TumaNowJwtPayload, input: CreateBranchInput) {
    this.access.assertOperator(user);
    const code = input.code.trim().toUpperCase();
    const clash = await this.prisma.branch.findFirst({
      where: {
        operatorId: user.operatorId!,
        code,
        deletedAt: null,
      },
    });
    if (clash) throw new BadRequestException("Branch code already exists");

    const created = await this.prisma.branch.create({
      data: {
        operatorId: user.operatorId!,
        code,
        name: input.name.trim(),
        email: input.email,
        phone: input.phone,
        addressLine1: input.addressLine1,
        city: input.city,
        country: input.country ?? "RW",
        status: input.status ?? "ACTIVE",
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "branch.create",
      entityType: "Branch",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(user: TumaNowJwtPayload, id: string, input: UpdateBranchInput) {
    this.access.assertOperator(user);
    const existing = await this.get(user, id);

    if (input.code) {
      const code = input.code.trim().toUpperCase();
      const clash = await this.prisma.branch.findFirst({
        where: {
          operatorId: user.operatorId!,
          code,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (clash) throw new BadRequestException("Branch code already exists");
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        code: input.code ? input.code.trim().toUpperCase() : undefined,
        name: input.name?.trim(),
        email: input.email,
        phone: input.phone,
        addressLine1: input.addressLine1,
        city: input.city,
        country: input.country,
        status: input.status,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "branch.update",
      entityType: "Branch",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }
}
