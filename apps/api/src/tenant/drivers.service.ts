import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DriverStatus } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

export type CreateDriverInput = {
  fullName: string;
  phone: string;
  licenseNo?: string;
  branchId?: string;
  userId?: string;
  vehicleId?: string | null;
  status?: DriverStatus;
};

export type UpdateDriverInput = Partial<CreateDriverInput>;

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.driver.findMany({
      where: { operatorId: user.operatorId!, deletedAt: null },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        vehicle: {
          select: {
            id: true,
            registrationNo: true,
            label: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });
  }

  private async assertVehicle(
    operatorId: string,
    vehicleId: string | null | undefined,
  ) {
    if (!vehicleId) return;
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        operatorId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!vehicle) throw new BadRequestException("Vehicle not found");
  }

  async create(user: TumaNowJwtPayload, input: CreateDriverInput) {
    this.access.assertOperator(user);

    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: input.branchId,
          operatorId: user.operatorId!,
          deletedAt: null,
        },
      });
      if (!branch) throw new BadRequestException("Branch not found");
    }

    await this.assertVehicle(user.operatorId!, input.vehicleId);

    const created = await this.prisma.driver.create({
      data: {
        operatorId: user.operatorId!,
        fullName: input.fullName,
        phone: input.phone,
        licenseNo: input.licenseNo,
        branchId: input.branchId,
        userId: input.userId,
        vehicleId: input.vehicleId ?? undefined,
        status: input.status ?? "OFFLINE",
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNo: true,
            label: true,
            type: true,
            status: true,
          },
        },
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "driver.create",
      entityType: "Driver",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(user: TumaNowJwtPayload, id: string, input: UpdateDriverInput) {
    this.access.assertOperator(user);
    const existing = await this.prisma.driver.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Driver not found");

    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: input.branchId,
          operatorId: user.operatorId!,
          deletedAt: null,
        },
      });
      if (!branch) throw new BadRequestException("Branch not found");
    }

    if (input.vehicleId !== undefined) {
      await this.assertVehicle(user.operatorId!, input.vehicleId);
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        licenseNo: input.licenseNo,
        branchId: input.branchId,
        userId: input.userId,
        vehicleId: input.vehicleId === null ? null : input.vehicleId,
        status: input.status,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNo: true,
            label: true,
            type: true,
            status: true,
          },
        },
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "driver.update",
      entityType: "Driver",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async assignVehicle(
    user: TumaNowJwtPayload,
    id: string,
    vehicleId: string | null,
  ) {
    return this.update(user, id, { vehicleId });
  }

  async setStatus(user: TumaNowJwtPayload, id: string, status: DriverStatus) {
    this.access.assertOperator(user);
    const existing = await this.prisma.driver.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Driver not found");

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "driver.set_status",
      entityType: "Driver",
      entityId: id,
      before: { status: existing.status },
      after: { status },
    });

    return updated;
  }
}

