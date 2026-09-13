import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ShipmentStatus } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

const ALLOWED: Record<string, string[]> = {
  ASSIGNED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
};

@Injectable()
export class RiderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertDriver(user: TumaNowJwtPayload) {
    if (!user.driverId) {
      throw new ForbiddenException("Not linked to a driver profile");
    }
    return user.driverId;
  }

  async me(user: TumaNowJwtPayload) {
    const driverId = this.assertDriver(user);
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId, deletedAt: null },
      include: {
        vehicle: true,
        operator: {
          select: { id: true, tradingName: true, legalName: true, code: true },
        },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    if (!driver) throw new NotFoundException("Driver not found");
    return driver;
  }

  async listJobs(user: TumaNowJwtPayload) {
    const driverId = this.assertDriver(user);
    return this.prisma.shipment.findMany({
      where: {
        driverId,
        deletedAt: null,
        status: {
          in: [
            "ASSIGNED",
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
          ],
        },
      },
      include: {
        vehicle: {
          select: { id: true, registrationNo: true, label: true, type: true },
        },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { assignedAt: "desc" },
      take: 50,
    });
  }

  async listHistory(user: TumaNowJwtPayload) {
    const driverId = this.assertDriver(user);
    return this.prisma.shipment.findMany({
      where: {
        driverId,
        deletedAt: null,
        status: { in: ["DELIVERED", "COMPLETED", "FAILED", "RETURNED"] },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
  }

  async getJob(user: TumaNowJwtPayload, id: string) {
    const driverId = this.assertDriver(user);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, driverId, deletedAt: null },
      include: {
        packages: true,
        events: { orderBy: { createdAt: "asc" } },
        vehicle: true,
        customer: { select: { fullName: true, phone: true, email: true } },
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async updateStatus(
    user: TumaNowJwtPayload,
    id: string,
    status: ShipmentStatus,
    note?: string,
  ) {
    const shipment = await this.getJob(user, id);
    const allowed = ALLOWED[shipment.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${shipment.status} to ${status}`,
      );
    }

    const data: Record<string, unknown> = { status };
    if (status === "PICKED_UP") data.pickedUpAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();

    const updated = await this.prisma.shipment.update({
      where: { id },
      data,
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status,
        note: note ?? `Rider updated status to ${status}`,
        actorUserId: user.sub,
      },
    });

    await this.audit.log({
      operatorId: shipment.operatorId ?? undefined,
      userId: user.sub,
      action: "rider.shipment.status",
      entityType: "Shipment",
      entityId: id,
      before: { status: shipment.status },
      after: { status },
    });

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.status",
      title: `Shipment ${status.toLowerCase().replace(/_/g, " ")}`,
      body: `Tracking ${shipment.trackingNumber}: ${note ?? status}`,
      entityType: "Shipment",
      entityId: id,
      operatorId: shipment.operatorId ?? undefined,
    });

    return updated;
  }

  async generatePod(user: TumaNowJwtPayload, id: string) {
    const shipment = await this.getJob(user, id);
    const allowedStatuses = [
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ];
    if (!allowedStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot generate POD from ${shipment.status}`,
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        podOtp: otp,
        podOtpExpiresAt: expiresAt,
        status: "OUT_FOR_DELIVERY",
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: "OUT_FOR_DELIVERY",
        note: "POD OTP generated by rider",
        actorUserId: user.sub,
      },
    });

    return {
      id: updated.id,
      trackingNumber: updated.trackingNumber,
      status: updated.status,
      podOtp: otp,
      podOtpExpiresAt: expiresAt,
    };
  }

  async verifyPod(
    user: TumaNowJwtPayload,
    id: string,
    otp: string,
    recipientName?: string,
  ) {
    const shipment = await this.getJob(user, id);
    if (!shipment.podOtp || !shipment.podOtpExpiresAt) {
      throw new BadRequestException("No POD OTP generated");
    }
    if (shipment.podOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException("POD OTP expired");
    }
    if (shipment.podOtp !== otp) {
      throw new BadRequestException("Invalid POD OTP");
    }

    const now = new Date();
    await this.prisma.shipment.update({
      where: { id },
      data: {
        status: "DELIVERED",
        deliveredAt: now,
        podVerifiedAt: now,
        podRecipientName: recipientName,
        podOtp: null,
        podOtpExpiresAt: null,
        ...(shipment.isCod && shipment.codStatus === "PENDING"
          ? {
              codStatus: "COLLECTED",
              codCollectedAt: now,
              codNotes: recipientName
                ? `Collected with POD from ${recipientName}`
                : "Collected with POD",
            }
          : {}),
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: "DELIVERED",
        note: recipientName
          ? `Delivered — POD verified by ${recipientName}`
          : "Delivered — POD verified",
        actorUserId: user.sub,
      },
    });

    await this.prisma.driver.update({
      where: { id: user.driverId! },
      data: { status: "AVAILABLE" },
    });

    if (shipment.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: shipment.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.delivered",
      title: "Shipment delivered",
      body: `Your shipment ${shipment.trackingNumber} was delivered.`,
      entityType: "Shipment",
      entityId: id,
      operatorId: shipment.operatorId ?? undefined,
    });

    return this.getJob(user, id);
  }

  async collectCod(user: TumaNowJwtPayload, id: string, note?: string) {
    const shipment = await this.getJob(user, id);
    if (!shipment.isCod) {
      throw new BadRequestException("Not a COD shipment");
    }
    if (!["PENDING", "FAILED"].includes(shipment.codStatus)) {
      throw new BadRequestException(`COD status is ${shipment.codStatus}`);
    }
    if (
      !["OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(shipment.status)
    ) {
      throw new BadRequestException("Shipment not ready for COD collection");
    }

    const amount = Number(shipment.codAmount ?? shipment.finalPrice ?? 0);
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        codStatus: "COLLECTED",
        codAmount: amount,
        codCollectedAt: new Date(),
        codNotes: note,
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: shipment.status,
        note: note ?? `COD collected: ${amount} ${shipment.codCurrency}`,
        actorUserId: user.sub,
        metadata: { codStatus: "COLLECTED", amount },
      },
    });

    return updated;
  }

  async setAvailability(
    user: TumaNowJwtPayload,
    status: "AVAILABLE" | "OFFLINE" | "BUSY",
  ) {
    const driverId = this.assertDriver(user);
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { status },
    });
  }
}
