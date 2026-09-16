import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async trackPublic(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber, deletedAt: null },
      include: {
        events: { orderBy: { createdAt: "asc" } },
        operator: { select: { tradingName: true, legalName: true } },
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");

    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      deliveryService: shipment.deliveryService,
      operatorName:
        shipment.operator?.tradingName ?? shipment.operator?.legalName ?? null,
      pickupCity: shipment.pickupCity,
      deliveryCity: shipment.deliveryCity,
      estimatedDelivery: null,
      deliveredAt: shipment.deliveredAt,
      completedAt: shipment.completedAt,
      timeline: shipment.events.map((e) => ({
        status: e.status,
        note: e.note,
        at: e.createdAt,
      })),
    };
  }
}
