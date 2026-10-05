import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "../tenant/tenant-access.service";

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async initiate(
    user: TumaNowJwtPayload,
    shipmentId: string,
    reason: string,
    notes?: string,
  ) {
    const isOperator = Boolean(user.operatorId) && !user.isCustomer;
    let shipment;

    if (user.customerId && (user.isCustomer || !user.operatorId)) {
      shipment = await this.prisma.shipment.findFirst({
        where: {
          id: shipmentId,
          customerId: user.customerId,
          deletedAt: null,
        },
      });
    } else if (user.operatorId) {
      this.access.assertOperator(user);
      shipment = await this.prisma.shipment.findFirst({
        where: {
          id: shipmentId,
          operatorId: user.operatorId,
          deletedAt: null,
        },
      });
    } else {
      throw new NotFoundException("Shipment not found");
    }

    if (!shipment) throw new NotFoundException("Shipment not found");
    if (!["DELIVERED", "FAILED"].includes(shipment.status)) {
      throw new BadRequestException(
        "Returns can only be initiated for DELIVERED or FAILED shipments",
      );
    }
    if (!shipment.operatorId) {
      throw new BadRequestException("Shipment has no operator");
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        shipmentId,
        status: { in: ["REQUESTED", "APPROVED", "IN_PROGRESS"] },
      },
    });
    if (existing) {
      throw new BadRequestException("An active return request already exists");
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        shipmentId,
        operatorId: shipment.operatorId,
        customerId: shipment.customerId,
        reason,
        notes,
        status: "REQUESTED",
      },
    });

    await this.audit.log({
      operatorId: shipment.operatorId,
      userId: user.sub,
      action: "return.initiate",
      entityType: "ReturnRequest",
      entityId: returnRequest.id,
      after: { shipmentId, reason },
    });

    if (!isOperator) {
      await this.notifications.create({
        operatorId: shipment.operatorId,
        type: "return.requested",
        title: "Return requested",
        body: `Return requested for ${shipment.trackingNumber}`,
        entityType: "ReturnRequest",
        entityId: returnRequest.id,
      });
    }

    return returnRequest;
  }

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.returnRequest.findMany({
      where: { operatorId: user.operatorId! },
      include: {
        shipment: {
          select: { id: true, trackingNumber: true, status: true },
        },
        customer: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listForCustomer(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    return this.prisma.returnRequest.findMany({
      where: { customerId: user.customerId },
      include: {
        shipment: {
          select: { id: true, trackingNumber: true, status: true },
        },
        operator: {
          select: { tradingName: true, legalName: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approve(user: TumaNowJwtPayload, id: string) {
    this.access.assertOperator(user);
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { id, operatorId: user.operatorId! },
      include: { shipment: true },
    });
    if (!returnRequest) throw new NotFoundException("Return request not found");
    if (returnRequest.status !== "REQUESTED") {
      throw new BadRequestException("Return request is not awaiting approval");
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await this.prisma.shipment.update({
      where: { id: returnRequest.shipmentId },
      data: { status: "RETURNED" },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: returnRequest.shipmentId,
        status: "RETURNED",
        note: `Return approved: ${returnRequest.reason}`,
        actorUserId: user.sub,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "return.approve",
      entityType: "ReturnRequest",
      entityId: id,
    });

    await this.notifications.notifyCustomer(returnRequest.customerId, {
      type: "return.approved",
      title: "Return approved",
      body: `Return for ${returnRequest.shipment.trackingNumber} was approved`,
      entityType: "ReturnRequest",
      entityId: id,
      operatorId: user.operatorId,
    });

    return updated;
  }
}
