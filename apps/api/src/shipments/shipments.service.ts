import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { AuditService } from "../common/audit.service";
import { WebhookDispatchService } from "../integrations/webhook-dispatch.service";
import { MatchingService } from "../matching/matching.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShipmentDto } from "./dto/create-shipment.dto";

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly matching: MatchingService,
    private readonly webhooks: WebhookDispatchService,
  ) {}

  async listForCustomer(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    return this.prisma.shipment.findMany({
      where: { customerId: user.customerId, deletedAt: null },
      include: {
        packages: true,
        operator: { select: { tradingName: true, legalName: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getForCustomer(user: TumaNowJwtPayload, id: string) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, customerId: user.customerId, deletedAt: null },
      include: {
        packages: { include: { packageType: true } },
        events: { orderBy: { createdAt: "asc" } },
        operator: { select: { tradingName: true, legalName: true } },
        customer: {
          select: {
            fullName: true,
            companyName: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async dashboardSummary(user: TumaNowJwtPayload) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");

    const shipments = await this.prisma.shipment.findMany({
      where: { customerId: user.customerId, deletedAt: null },
      select: {
        status: true,
        finalPrice: true,
        quotedPrice: true,
        createdAt: true,
        isCod: true,
        trackingNumber: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const active = shipments.filter((s) =>
      [
        "PENDING_OPERATOR_ACTION",
        "APPROVED",
        "AWAITING_PAYMENT",
        "PAID",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
      ].includes(s.status),
    ).length;
    const delivered = shipments.filter((s) =>
      ["DELIVERED", "COMPLETED"].includes(s.status),
    ).length;
    const awaitingPayment = shipments.filter(
      (s) => s.status === "AWAITING_PAYMENT" && !s.isCod,
    ).length;
    const spend = shipments
      .filter((s) => ["PAID", "DELIVERED", "COMPLETED"].includes(s.status))
      .reduce((sum, s) => sum + Number(s.finalPrice ?? s.quotedPrice ?? 0), 0);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);
    const byDayMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      byDayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of shipments) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (byDayMap.has(key)) {
        byDayMap.set(key, (byDayMap.get(key) ?? 0) + 1);
      }
    }

    const shipmentsByDay = [...byDayMap.entries()].map(([iso, count]) => {
      const d = new Date(`${iso}T12:00:00.000Z`);
      return {
        day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        shipments: count,
      };
    });

    return {
      totalShipments: shipments.length,
      activeShipments: active,
      deliveredShipments: delivered,
      awaitingPayment,
      totalSpend: spend,
      recent: shipments.slice(0, 5).map((s) => ({
        trackingNumber: s.trackingNumber,
        status: s.status,
        amount: Number(s.finalPrice ?? s.quotedPrice ?? 0),
        isCod: s.isCod,
      })),
      shipmentsByDay,
    };
  }

  async create(user: TumaNowJwtPayload, dto: CreateShipmentDto) {
    if (!user.customerId) throw new NotFoundException("Customer profile not found");

    const operator = await this.prisma.operator.findFirst({
      where: { id: dto.operatorId, deletedAt: null, status: "ACTIVE" },
    });
    if (!operator) throw new BadRequestException("Operator not available");

    const totalWeight = dto.packages.reduce(
      (sum, p) => sum + (p.weightKg ?? 0) * (p.quantity ?? 1),
      0,
    );
    const isFragile = dto.packages.some((p) => p.isFragile);
    const isPerishable = dto.packages.some((p) => p.isPerishable);
    const packageTypeId = dto.packages.find((p) => p.packageTypeId)?.packageTypeId;
    const maxLength = Math.max(0, ...dto.packages.map((p) => p.lengthCm ?? 0));
    const maxWidth = Math.max(0, ...dto.packages.map((p) => p.widthCm ?? 0));
    const maxHeight = Math.max(0, ...dto.packages.map((p) => p.heightCm ?? 0));
    const totalDeclaredValue = dto.packages.reduce(
      (sum, p) => sum + (p.declaredValue ?? 0) * (p.quantity ?? 1),
      0,
    );

    const finalPrice = await this.matching.priceForOperator(operator.id, {
      pickupCity: dto.pickupCity ?? "",
      deliveryCity: dto.deliveryCity ?? "",
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      deliveryLat: dto.deliveryLat,
      deliveryLng: dto.deliveryLng,
      weightKg: totalWeight || 1,
      lengthCm: maxLength || undefined,
      widthCm: maxWidth || undefined,
      heightCm: maxHeight || undefined,
      declaredValue: totalDeclaredValue || undefined,
      isFragile,
      isPerishable,
      deliveryService: dto.deliveryService ?? "STANDARD",
      estimatedDistanceKm: dto.estimatedDistanceKm ?? 5,
      packageTypeId,
    });

    const trackingNumber = await this.generateTrackingNumber();

    const shipment = await this.prisma.shipment.create({
      data: {
        trackingNumber,
        operatorId: operator.id,
        customerId: user.customerId,
        status: "PENDING_OPERATOR_ACTION",
        deliveryService: dto.deliveryService ?? "STANDARD",
        pickupAddress: dto.pickupAddress,
        pickupCity: dto.pickupCity,
        pickupContactName: dto.pickupContactName,
        pickupContactPhone: dto.pickupContactPhone,
        pickupInstructions: dto.pickupInstructions,
        pickupLatitude: dto.pickupLat,
        pickupLongitude: dto.pickupLng,
        deliveryAddress: dto.deliveryAddress,
        deliveryCity: dto.deliveryCity,
        deliveryContactName: dto.deliveryContactName,
        deliveryContactPhone: dto.deliveryContactPhone,
        deliveryInstructions: dto.deliveryInstructions,
        deliveryLatitude: dto.deliveryLat,
        deliveryLongitude: dto.deliveryLng,
        quotedPrice: finalPrice,
        finalPrice,
        isCod: dto.isCod ?? false,
        codAmount: dto.isCod
          ? (dto.codAmount ?? finalPrice)
          : undefined,
        codStatus: dto.isCod ? "PENDING" : "NONE",
        packages: {
          create: dto.packages.map((p) => ({
            description: p.description,
            quantity: p.quantity ?? 1,
            weightKg: p.weightKg,
            lengthCm: p.lengthCm,
            widthCm: p.widthCm,
            heightCm: p.heightCm,
            declaredValue: p.declaredValue,
            isFragile: p.isFragile ?? false,
            isPerishable: p.isPerishable ?? false,
            packageTypeId: p.packageTypeId,
          })),
        },
        events: {
          create: {
            status: "CREATED",
            note: dto.isCod
              ? "COD shipment created by customer"
              : "Shipment created by customer",
            actorUserId: user.sub,
          },
        },
      },
      include: { packages: true },
    });

    await this.audit.log({
      operatorId: operator.id,
      userId: user.sub,
      action: "shipment.create",
      entityType: "Shipment",
      entityId: shipment.id,
      after: { trackingNumber, status: shipment.status, finalPrice },
    });

    this.webhooks.emit(operator.id, "shipment.created", {
      shipmentId: shipment.id,
      trackingNumber,
      status: shipment.status,
      finalPrice,
    });

    return shipment;
  }

  private async generateTrackingNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.shipment.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
        },
      },
    });
    const seq = String(count + 1).padStart(8, "0");
    return `TN-${year}-${seq}`;
  }
}
