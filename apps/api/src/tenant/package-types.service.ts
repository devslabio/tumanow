import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreatePackageTypeInput = {
  code: string;
  name: string;
  description?: string;
  maxWeightKg?: number;
  maxLengthCm?: number;
  maxWidthCm?: number;
  maxHeightCm?: number;
  isFragile?: boolean;
  isPerishable?: boolean;
  isActive?: boolean;
};

export type UpdatePackageTypeInput = Partial<CreatePackageTypeInput>;

@Injectable()
export class PackageTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.packageType.findMany({
      where: { operatorId: user.operatorId! },
      orderBy: { name: "asc" },
    });
  }

  async create(user: TumaNowJwtPayload, input: CreatePackageTypeInput) {
    this.access.assertOperator(user);
    const existing = await this.prisma.packageType.findUnique({
      where: {
        operatorId_code: {
          operatorId: user.operatorId!,
          code: input.code,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`Package type code '${input.code}' already exists`);
    }

    const created = await this.prisma.packageType.create({
      data: {
        operatorId: user.operatorId!,
        code: input.code,
        name: input.name,
        description: input.description,
        maxWeightKg: input.maxWeightKg,
        maxLengthCm: input.maxLengthCm,
        maxWidthCm: input.maxWidthCm,
        maxHeightCm: input.maxHeightCm,
        isFragile: input.isFragile ?? false,
        isPerishable: input.isPerishable ?? false,
        isActive: input.isActive ?? true,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "package_type.create",
      entityType: "PackageType",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(
    user: TumaNowJwtPayload,
    id: string,
    input: UpdatePackageTypeInput,
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.packageType.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!existing) throw new NotFoundException("Package type not found");

    if (input.code && input.code !== existing.code) {
      const clash = await this.prisma.packageType.findUnique({
        where: {
          operatorId_code: {
            operatorId: user.operatorId!,
            code: input.code,
          },
        },
      });
      if (clash) {
        throw new BadRequestException(`Package type code '${input.code}' already exists`);
      }
    }

    const updated = await this.prisma.packageType.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        maxWeightKg: input.maxWeightKg,
        maxLengthCm: input.maxLengthCm,
        maxWidthCm: input.maxWidthCm,
        maxHeightCm: input.maxHeightCm,
        isFragile: input.isFragile,
        isPerishable: input.isPerishable,
        isActive: input.isActive,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "package_type.update",
      entityType: "PackageType",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }
}
