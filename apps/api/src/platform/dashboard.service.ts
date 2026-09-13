import { Injectable } from "@nestjs/common";
import { ShipmentStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_DAYS = 14;

function resolveDays(raw?: string | number) {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (n === 7 || n === 14 || n === 30) return n;
  return DEFAULT_DAYS;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      totalOperators,
      activeOperators,
      totalCustomers,
      totalShipments,
      completedShipments,
      failedShipments,
      pendingApprovals,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.operator.count({ where: { deletedAt: null } }),
      this.prisma.operator.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.shipment.count({ where: { deletedAt: null } }),
      this.prisma.shipment.count({
        where: { deletedAt: null, status: { in: ["COMPLETED", "DELIVERED"] } },
      }),
      this.prisma.shipment.count({
        where: { deletedAt: null, status: { in: ["FAILED", "RETURNED"] } },
      }),
      this.prisma.operator.count({
        where: { deletedAt: null, status: "PENDING" },
      }),
      this.prisma.shipment.aggregate({
        where: {
          deletedAt: null,
          status: { in: ["PAID", "COMPLETED", "DELIVERED"] },
        },
        _sum: { finalPrice: true },
      }),
    ]);

    return {
      totalOperators,
      activeOperators,
      pendingApprovals,
      totalCustomers,
      totalShipments,
      completedShipments,
      failedShipments,
      platformVolume: Number(revenueAgg._sum.finalPrice ?? 0),
    };
  }

  async analytics(daysInput?: string | number) {
    const days = resolveDays(daysInput);
    const since = daysAgo(days);
    const shipments = await this.prisma.shipment.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: {
        createdAt: true,
        status: true,
        finalPrice: true,
        operatorId: true,
        operator: {
          select: { tradingName: true, legalName: true, code: true },
        },
      },
    });

    const byDay = emptyDaySeries(days);
    const statusMap = new Map<string, number>();
    const operatorMap = new Map<
      string,
      { name: string; shipments: number; revenue: number }
    >();

    for (const s of shipments) {
      const key = dayKey(s.createdAt);
      if (byDay[key]) {
        byDay[key].shipments += 1;
        byDay[key].revenue += Number(s.finalPrice ?? 0);
      }

      const st = bucketStatus(s.status);
      statusMap.set(st, (statusMap.get(st) ?? 0) + 1);

      if (s.operatorId && s.operator) {
        const name =
          s.operator.tradingName ?? s.operator.legalName ?? s.operator.code;
        const row = operatorMap.get(s.operatorId) ?? {
          name,
          shipments: 0,
          revenue: 0,
        };
        row.shipments += 1;
        row.revenue += Number(s.finalPrice ?? 0);
        operatorMap.set(s.operatorId, row);
      }
    }

    const statusBreakdown = [...statusMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const topOperators = [...operatorMap.values()]
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 6)
      .map((o) => ({
        label: o.name,
        shipments: o.shipments,
        revenue: o.revenue,
      }));

    return {
      periodDays: days,
      shipmentsByDay: Object.values(byDay),
      statusBreakdown:
        statusBreakdown.length > 0
          ? statusBreakdown
          : [{ name: "No data", value: 1 }],
      topOperators,
    };
  }
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  return d;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyDaySeries(days: number) {
  const map: Record<string, { day: string; shipments: number; revenue: number }> =
    {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    map[key] = {
      day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      shipments: 0,
      revenue: 0,
    };
  }
  return map;
}

function bucketStatus(status: ShipmentStatus): string {
  if (["COMPLETED", "DELIVERED"].includes(status)) return "Delivered";
  if (["FAILED", "RETURNED", "CANCELLED", "REJECTED"].includes(status))
    return "Failed";
  if (
    ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)
  )
    return "In transit";
  if (["AWAITING_PAYMENT", "APPROVED", "PAID"].includes(status))
    return "Paid / ready";
  return "Pending";
}
