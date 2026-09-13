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

export type CreateQuotationInput = {
  operatorId: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity?: string;
  deliveryCity?: string;
  details?: string;
};

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async createForCustomer(user: TumaNowJwtPayload, input: CreateQuotationInput) {
    if (!user.customerId) {
      throw new NotFoundException("Customer profile not found");
    }

    const operator = await this.prisma.operator.findFirst({
      where: { id: input.operatorId, deletedAt: null, status: "ACTIVE" },
    });
    if (!operator) throw new BadRequestException("Operator not available");

    const quotation = await this.prisma.quotation.create({
      data: {
        operatorId: operator.id,
        customerId: user.customerId,
        status: "REQUESTED",
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        pickupCity: input.pickupCity,
        deliveryCity: input.deliveryCity,
        details: input.details,
        currency: operator.currency,
      },
    });

    await this.audit.log({
      operatorId: operator.id,
      userId: user.sub,
      action: "quotation.create",
      entityType: "Quotation",
      entityId: quotation.id,
    });

    await this.notifications.create({
      operatorId: operator.id,
      type: "quotation.requested",
      title: "New RFQ",
      body: `RFQ from ${input.pickupCity ?? "pickup"} → ${input.deliveryCity ?? "delivery"}`,
      entityType: "Quotation",
      entityId: quotation.id,
    });

    return quotation;
  }

  async listForCustomer(user: TumaNowJwtPayload) {
    if (!user.customerId) {
      throw new NotFoundException("Customer profile not found");
    }
    return this.prisma.quotation.findMany({
      where: { customerId: user.customerId },
      include: {
        operator: {
          select: { id: true, code: true, tradingName: true, legalName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptForCustomer(user: TumaNowJwtPayload, id: string) {
    if (!user.customerId) {
      throw new NotFoundException("Customer profile not found");
    }

    const quotation = await this.prisma.quotation.findFirst({
      where: { id, customerId: user.customerId },
    });
    if (!quotation) throw new NotFoundException("Quotation not found");
    if (quotation.status !== "QUOTED") {
      throw new BadRequestException("Only quoted RFQs can be accepted");
    }
    if (!quotation.quotedPrice) {
      throw new BadRequestException("Quotation has no price");
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.shipment.count({
      where: {
        createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) },
      },
    });
    const trackingNumber = `TN-${year}-${String(count + 1).padStart(8, "0")}`;

    const shipment = await this.prisma.shipment.create({
      data: {
        trackingNumber,
        operatorId: quotation.operatorId,
        customerId: user.customerId,
        status: "AWAITING_PAYMENT",
        pickupAddress: quotation.pickupAddress,
        pickupCity: quotation.pickupCity,
        deliveryAddress: quotation.deliveryAddress,
        deliveryCity: quotation.deliveryCity,
        quotedPrice: quotation.quotedPrice,
        finalPrice: quotation.quotedPrice,
        requiresRfq: true,
        currency: quotation.currency,
        events: {
          create: [
            {
              status: "CREATED",
              note: "Created from accepted quotation",
              actorUserId: user.sub,
            },
            {
              status: "AWAITING_PAYMENT",
              note: "Awaiting payment after RFQ acceptance",
              actorUserId: user.sub,
            },
          ],
        },
      },
    });

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        shipmentId: shipment.id,
      },
      include: { shipment: true },
    });

    await this.audit.log({
      operatorId: quotation.operatorId,
      userId: user.sub,
      action: "quotation.accept",
      entityType: "Quotation",
      entityId: id,
      after: { shipmentId: shipment.id },
    });

    return updated;
  }

  async listForOperator(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    return this.prisma.quotation.findMany({
      where: { operatorId: user.operatorId! },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async quote(
    user: TumaNowJwtPayload,
    id: string,
    input: { price: number; etaHours?: number; terms?: string },
  ) {
    this.access.assertOperator(user);
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, operatorId: user.operatorId! },
    });
    if (!quotation) throw new NotFoundException("Quotation not found");
    if (!["REQUESTED", "QUOTED"].includes(quotation.status)) {
      throw new BadRequestException(
        `Cannot quote quotation in status ${quotation.status}`,
      );
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: "QUOTED",
        quotedPrice: input.price,
        etaHours: input.etaHours,
        terms: input.terms,
        expiresAt,
      },
    });

    await this.audit.log({
      operatorId: user.operatorId,
      userId: user.sub,
      action: "quotation.quote",
      entityType: "Quotation",
      entityId: id,
      after: { price: input.price, etaHours: input.etaHours },
    });

    await this.notifications.notifyCustomer(quotation.customerId, {
      type: "quotation.quoted",
      title: "Quote received",
      body: `You received a quote of ${input.price} ${quotation.currency}`,
      entityType: "Quotation",
      entityId: id,
      operatorId: user.operatorId,
    });

    return updated;
  }
}
