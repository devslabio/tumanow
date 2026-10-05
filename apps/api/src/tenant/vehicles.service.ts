import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { VehicleStatus, VehicleType } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreateVehicleInput = {
  registrationNo: string;
  label?: string;
  type?: VehicleType;
  status?: VehicleStatus;
  maxWeightKg?: number;
  maxVolumeM3?: number;
  isActive?: boolean;
};

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.vehicle.findMany({
      where: { operatorId: user.operatorId!, deletedAt: null },
      include: {
        drivers: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { registrationNo: "asc" },
    });
  }

  async create(user: TumaNowJwtPayload, input: CreateVehicleInput) {
    this.access.assertOperator(user);

    const existing = await this.prisma.vehicle.findFirst({
      where: {
        operatorId: user.operatorId!,
        registrationNo: input.registrationNo.trim().toUpperCase(),
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException("Registration number already in use");
    }

    const created = await this.prisma.vehicle.create({
      data: {
        operatorId: user.operatorId!,
        registrationNo: input.registrationNo.trim().toUpperCase(),
        label: input.label,
        type: input.type ?? "MOTORCYCLE",
        status: input.status ?? "AVAILABLE",
        maxWeightKg: input.maxWeightKg,
        maxVolumeM3: input.maxVolumeM3,
        isActive: input.isActive ?? true,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "vehicle.create",
      entityType: "Vehicle",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(
    user: TumaNowJwtPayload,
    id: string,
    input: UpdateVehicleInput,
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.vehicle.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Vehicle not found");

    if (input.registrationNo) {
      const clash = await this.prisma.vehicle.findFirst({
        where: {
          operatorId: user.operatorId!,
          registrationNo: input.registrationNo.trim().toUpperCase(),
          deletedAt: null,
          NOT: { id },
        },
      });
      if (clash) {
        throw new BadRequestException("Registration number already in use");
      }
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNo: input.registrationNo
          ? input.registrationNo.trim().toUpperCase()
          : undefined,
        label: input.label,
        type: input.type,
        status: input.status,
        maxWeightKg: input.maxWeightKg,
        maxVolumeM3: input.maxVolumeM3,
        isActive: input.isActive,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "vehicle.update",
      entityType: "Vehicle",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async setStatus(
    user: TumaNowJwtPayload,
    id: string,
    status: VehicleStatus,
  ) {
    this.access.assertOperator(user);
    const existing = await this.prisma.vehicle.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Vehicle not found");

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status,
        isActive: status !== "RETIRED",
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "vehicle.set_status",
      entityType: "Vehicle",
      entityId: id,
      before: { status: existing.status },
      after: { status },
    });

    return updated;
  }
}
