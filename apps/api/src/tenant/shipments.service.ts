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
import { TenantAccessService } from "./tenant-access.service";

const ALLOWED_OPERATOR_TRANSITIONS: Record<string, string[]> = {
  PENDING_OPERATOR_ACTION: ["APPROVED", "REJECTED", "AWAITING_PAYMENT", "CANCELLED"],
  APPROVED: ["AWAITING_PAYMENT", "ASSIGNED", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "CANCELLED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "RETURNED"],
  DELIVERED: ["COMPLETED", "RETURNED"],
  FAILED: ["RETURNED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  RETURNED: ["COMPLETED"],
};

@Injectable()
export class ShipmentsTenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.shipment.findMany({
      where: { operatorId: user.operatorId!, deletedAt: null },
      include: {
        packages: true,
        customer: { select: { fullName: true, phone: true, email: true } },
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true,
            vehicleId: true,
          },
        },
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
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async get(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, operatorId: user.operatorId!, deletedAt: null },
      include: {
        packages: { include: { packageType: true } },
        events: { orderBy: { createdAt: "asc" } },
        customer: true,
        driver: true,
        vehicle: true,
        payments: true,
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async approve(user: TumaNowJwtPayload, id: string) {
    this.assertPermission(user, "orders.approve");
    const shipment = await this.get(user, id);
    if (shipment.status !== "PENDING_OPERATOR_ACTION") {
      throw new BadRequestException(
        `Cannot approve from ${shipment.status}`,
      );
    }

    const isCod = shipment.isCod;
    const nextStatus = isCod ? "PAID" : "AWAITING_PAYMENT";

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(isCod
          ? {
              codStatus: "PENDING",
              codAmount: shipment.codAmount ?? shipment.finalPrice,
            }
          : {}),
      },
    });

    await this.prisma.shipmentEvent.createMany({
      data: isCod
        ? [
            {
              shipmentId: id,
              status: "APPROVED",
              note: "Approved — cash on delivery",
              actorUserId: user.sub,
            },
            {
              shipmentId: id,
              status: "PAID",
              note: "COD authorized — collect at delivery",
              actorUserId: user.sub,
            },
          ]
        : [
            {
              shipmentId: id,
              status: "APPROVED",
              note: "Approved by operator",
              actorUserId: user.sub,
            },
            {
              shipmentId: id,
              status: "AWAITING_PAYMENT",
              note: "Awaiting customer payment",
              actorUserId: user.sub,
            },
          ],
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.approve",
      entityType: "Shipment",
      entityId: id,
      before: { status: shipment.status },
      after: { status: nextStatus, isCod },
    });

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.approved",
      title: "Shipment approved",
      body: isCod
        ? `Your shipment ${shipment.trackingNumber} was approved. Pay cash on delivery.`
        : `Your shipment ${shipment.trackingNumber} was approved. Please complete payment.`,
      entityType: "Shipment",
      entityId: id,
      operatorId: user.operatorId,
    });

    return updated;
  }

  async reject(user: TumaNowJwtPayload, id: string, note?: string) {
    return this.transition(user, id, "REJECTED", "orders.reject", note);
  }

  async assign(
    user: TumaNowJwtPayload,
    id: string,
    driverId: string,
    vehicleId?: string,
  ) {
    this.assertPermission(user, "orders.assign");
    const shipment = await this.get(user, id);
    if (!["PAID", "APPROVED", "ASSIGNED"].includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot assign from ${shipment.status}. Shipment must be PAID or APPROVED.`,
      );
    }

    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        operatorId: user.operatorId!,
        deletedAt: null,
      },
      include: {
        vehicle: {
          select: { id: true, registrationNo: true, label: true, status: true },
        },
      },
    });
    if (!driver) throw new NotFoundException("Driver not found");

    const resolvedVehicleId = vehicleId ?? driver.vehicleId ?? undefined;
    if (resolvedVehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: resolvedVehicleId,
          operatorId: user.operatorId!,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!vehicle) throw new NotFoundException("Vehicle not found");
      if (["MAINTENANCE", "RETIRED"].includes(vehicle.status)) {
        throw new BadRequestException(
          `Vehicle is ${vehicle.status.toLowerCase()} and cannot be assigned`,
        );
      }
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        driverId,
        vehicleId: resolvedVehicleId ?? null,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        driver: true,
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

    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: "BUSY",
        ...(resolvedVehicleId ? { vehicleId: resolvedVehicleId } : {}),
      },
    });

    if (resolvedVehicleId) {
      await this.prisma.vehicle.update({
        where: { id: resolvedVehicleId },
        data: { status: "IN_USE" },
      });
    }

    const vehicleNote = updated.vehicle
      ? ` on ${updated.vehicle.registrationNo}`
      : "";

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: "ASSIGNED",
        note: `Assigned to ${driver.fullName}${vehicleNote}`,
        actorUserId: user.sub,
        metadata: { driverId, vehicleId: resolvedVehicleId },
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.assign",
      entityType: "Shipment",
      entityId: id,
      before: {
        status: shipment.status,
        driverId: shipment.driverId,
        vehicleId: shipment.vehicleId,
      },
      after: {
        status: "ASSIGNED",
        driverId,
        vehicleId: resolvedVehicleId,
      },
    });

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.assigned",
      title: "Driver assigned",
      body: `${driver.fullName} has been assigned to ${shipment.trackingNumber}.`,
      entityType: "Shipment",
      entityId: id,
      operatorId: user.operatorId,
    });

    return updated;
  }

  async updateStatus(
    user: TumaNowJwtPayload,
    id: string,
    status: ShipmentStatus,
    note?: string,
    failureReason?: string,
  ) {
    this.assertPermission(user, "orders.update_status");
    const shipment = await this.get(user, id);
    const allowed = ALLOWED_OPERATOR_TRANSITIONS[shipment.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${shipment.status} to ${status}`,
      );
    }

    if (status === "FAILED" && !failureReason && !note) {
      throw new BadRequestException("failureReason is required when marking FAILED");
    }

    const data: Record<string, unknown> = { status };
    if (status === "PICKED_UP") data.pickedUpAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
    if (status === "COMPLETED") data.completedAt = new Date();
    if (status === "FAILED" || failureReason) {
      data.failureReason = failureReason ?? note;
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data,
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status,
        note: note ?? `Status changed to ${status}`,
        actorUserId: user.sub,
        metadata: failureReason ? { failureReason } : {},
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.status",
      entityType: "Shipment",
      entityId: id,
      before: { status: shipment.status },
      after: { status, failureReason },
    });

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.status",
      title: `Shipment ${status.toLowerCase().replace(/_/g, " ")}`,
      body: `Tracking ${shipment.trackingNumber}: ${note ?? status}`,
      entityType: "Shipment",
      entityId: id,
      operatorId: user.operatorId,
    });

    return updated;
  }

  async generatePod(user: TumaNowJwtPayload, id: string) {
    this.assertPermission(user, "orders.update_status");
    const shipment = await this.get(user, id);

    const allowedStatuses = [
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ];
    if (!allowedStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot generate POD from status ${shipment.status}`,
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const nextStatus =
      shipment.status === "OUT_FOR_DELIVERY"
        ? "OUT_FOR_DELIVERY"
        : ("OUT_FOR_DELIVERY" as const);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        podOtp: otp,
        podOtpExpiresAt: expiresAt,
        status: nextStatus,
      },
    });

    if (shipment.status !== "OUT_FOR_DELIVERY") {
      await this.prisma.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: "OUT_FOR_DELIVERY",
          note: "Out for delivery — POD OTP generated",
          actorUserId: user.sub,
        },
      });
    } else {
      await this.prisma.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: "OUT_FOR_DELIVERY",
          note: "POD OTP regenerated",
          actorUserId: user.sub,
        },
      });
    }

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.pod.generate",
      entityType: "Shipment",
      entityId: id,
      after: { podOtpExpiresAt: expiresAt },
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
    this.assertPermission(user, "orders.update_status");
    const shipment = await this.get(user, id);

    if (!shipment.podOtp || !shipment.podOtpExpiresAt) {
      throw new BadRequestException("No POD OTP generated for this shipment");
    }
    if (shipment.podOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException("POD OTP has expired");
    }
    if (shipment.podOtp !== otp) {
      throw new BadRequestException("Invalid POD OTP");
    }

    const now = new Date();
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: "DELIVERED",
        deliveredAt: now,
        podVerifiedAt: now,
        podRecipientName: recipientName,
        podOtp: null,
        podOtpExpiresAt: null,
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

    if (shipment.driverId) {
      await this.prisma.driver.update({
        where: { id: shipment.driverId },
        data: { status: "AVAILABLE" },
      });
    }

    if (shipment.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: shipment.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    if (shipment.isCod && shipment.codStatus === "PENDING") {
      await this.prisma.shipment.update({
        where: { id },
        data: {
          codStatus: "COLLECTED",
          codCollectedAt: now,
          codNotes: recipientName
            ? `Collected with POD from ${recipientName}`
            : "Collected with POD",
        },
      });
      await this.prisma.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: "DELIVERED",
          note: `COD collected (${Number(shipment.codAmount ?? shipment.finalPrice ?? 0)} ${shipment.codCurrency})`,
          actorUserId: user.sub,
          metadata: { codStatus: "COLLECTED" },
        },
      });
    }

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.pod.verify",
      entityType: "Shipment",
      entityId: id,
      after: { status: "DELIVERED", podRecipientName: recipientName },
    });

    await this.notifications.notifyCustomer(shipment.customerId, {
      type: "shipment.delivered",
      title: "Shipment delivered",
      body: `Your shipment ${shipment.trackingNumber} was delivered.`,
      entityType: "Shipment",
      entityId: id,
      operatorId: user.operatorId,
    });

    return this.get(user, id);
  }

  async collectCod(
    user: TumaNowJwtPayload,
    id: string,
    amount?: number,
    note?: string,
  ) {
    this.assertPermission(user, "orders.update_status");
    const shipment = await this.get(user, id);
    if (!shipment.isCod) {
      throw new BadRequestException("Shipment is not cash on delivery");
    }
    if (!["PENDING", "FAILED"].includes(shipment.codStatus)) {
      throw new BadRequestException(
        `Cannot collect COD from status ${shipment.codStatus}`,
      );
    }
    if (
      !["OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(shipment.status)
    ) {
      throw new BadRequestException(
        "COD can only be collected when out for delivery or delivered",
      );
    }

    const collectedAmount =
      amount ?? Number(shipment.codAmount ?? shipment.finalPrice ?? 0);
    if (collectedAmount <= 0) {
      throw new BadRequestException("COD amount must be greater than zero");
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        codStatus: "COLLECTED",
        codAmount: collectedAmount,
        codCollectedAt: new Date(),
        codNotes: note,
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: shipment.status,
        note: note ?? `COD collected: ${collectedAmount} ${shipment.codCurrency}`,
        actorUserId: user.sub,
        metadata: { codStatus: "COLLECTED", amount: collectedAmount },
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.cod.collect",
      entityType: "Shipment",
      entityId: id,
      after: { codStatus: "COLLECTED", amount: collectedAmount },
    });

    return updated;
  }

  async settleCod(user: TumaNowJwtPayload, id: string, note?: string) {
    this.assertPermission(user, "payments.manage");
    const shipment = await this.get(user, id);
    if (!shipment.isCod) {
      throw new BadRequestException("Shipment is not cash on delivery");
    }
    if (shipment.codStatus !== "COLLECTED") {
      throw new BadRequestException(
        `Cannot settle COD from status ${shipment.codStatus}`,
      );
    }

    const amount = Number(shipment.codAmount ?? shipment.finalPrice ?? 0);
    if (amount <= 0) {
      throw new BadRequestException("COD amount missing");
    }

    const payment = await this.prisma.payment.create({
      data: {
        shipmentId: id,
        method: "COD",
        status: "COMPLETED",
        amount,
        currency: shipment.codCurrency,
        reference: `COD-${shipment.trackingNumber}`,
        paidAt: new Date(),
      },
    });

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        codStatus: "SETTLED",
        codSettledAt: new Date(),
        codNotes: note ?? shipment.codNotes,
        ...(shipment.status === "DELIVERED" ? { status: "COMPLETED", completedAt: new Date() } : {}),
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: updated.status,
        note: note ?? `COD settled: ${amount} ${shipment.codCurrency}`,
        actorUserId: user.sub,
        metadata: { codStatus: "SETTLED", paymentId: payment.id },
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "shipment.cod.settle",
      entityType: "Shipment",
      entityId: id,
      after: { codStatus: "SETTLED", paymentId: payment.id },
    });

    return { shipment: updated, payment };
  }

  private async transition(
    user: TumaNowJwtPayload,
    id: string,
    nextStatus: ShipmentStatus,
    permission: string,
    note?: string,
  ) {
    this.access.assertOperator(user);
    this.assertPermission(user, permission);

    const shipment = await this.get(user, id);
    const allowed = ALLOWED_OPERATOR_TRANSITIONS[shipment.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${shipment.status} to ${nextStatus}`,
      );
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status: nextStatus },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: nextStatus,
        note: note ?? `Status changed to ${nextStatus}`,
        actorUserId: user.sub,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: `shipment.${nextStatus.toLowerCase()}`,
      entityType: "Shipment",
      entityId: id,
      before: { status: shipment.status },
      after: { status: nextStatus },
    });

    return updated;
  }

  private assertPermission(user: TumaNowJwtPayload, permission: string) {
    if (
      user.platformRoleKeys?.includes("SUPER_ADMIN") ||
      user.permissionCodes?.includes(permission)
    ) {
      return;
    }
    throw new ForbiddenException(`Missing permission: ${permission}`);
  }
}
