import { Injectable } from "@nestjs/common";
import { ShipmentStatus } from "@prisma/client";

import type { TumaNowJwtPayload } from "../auth/jwt-payload";
import { PrismaService } from "../prisma/prisma.service";
import { TenantAccessService } from "./tenant-access.service";

const DEFAULT_DAYS = 14;

function resolveDays(raw?: string | number) {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (n === 7 || n === 14 || n === 30) return n;
  return DEFAULT_DAYS;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TenantAccessService,
  ) {}

  async summary(user: TumaNowJwtPayload) {
    this.access.assertOperator(user);
    const operatorId = user.operatorId!;

    const [
      pending,
      active,
      completedToday,
      failed,
      driversAvailable,
      driversBusy,
      vehiclesAvailable,
      codPending,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.shipment.count({
        where: {
          operatorId,
          deletedAt: null,
          status: "PENDING_OPERATOR_ACTION",
        },
      }),
      this.prisma.shipment.count({
        where: {
          operatorId,
          deletedAt: null,
          status: {
            in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"],
          },
        },
      }),
      this.prisma.shipment.count({
        where: {
          operatorId,
          deletedAt: null,
          status: { in: ["DELIVERED", "COMPLETED"] },
          updatedAt: { gte: startOfToday() },
        },
      }),
      this.prisma.shipment.count({
        where: {
          operatorId,
          deletedAt: null,
          status: { in: ["FAILED", "RETURNED"] },
        },
      }),
      this.prisma.driver.count({
        where: { operatorId, deletedAt: null, status: "AVAILABLE" },
      }),
      this.prisma.driver.count({
        where: { operatorId, deletedAt: null, status: "BUSY" },
      }),
      this.prisma.vehicle.count({
        where: {
          operatorId,
          deletedAt: null,
          isActive: true,
          status: "AVAILABLE",
        },
      }),
      this.prisma.shipment.count({
        where: {
          operatorId,
          deletedAt: null,
          isCod: true,
          codStatus: { in: ["PENDING", "COLLECTED"] },
        },
      }),
      this.prisma.shipment.aggregate({
        where: {
          operatorId,
          deletedAt: null,
          status: { in: ["PAID", "COMPLETED", "DELIVERED"] },
        },
        _sum: { finalPrice: true },
      }),
    ]);

    return {
      pendingShipments: pending,
      activeDeliveries: active,
      completedToday,
      failedDeliveries: failed,
      driversAvailable,
      driversBusy,
      vehiclesAvailable,
      codOpen: codPending,
      totalRevenue: Number(revenueAgg._sum.finalPrice ?? 0),
    };
  }

  async analytics(user: TumaNowJwtPayload, daysInput?: string | number) {
    this.access.assertOperator(user);
    const operatorId = user.operatorId!;
    const days = resolveDays(daysInput);
    const since = daysAgo(days);

    const shipments = await this.prisma.shipment.findMany({
      where: {
        operatorId,
        deletedAt: null,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        status: true,
        finalPrice: true,
        isCod: true,
        codStatus: true,
        driverId: true,
        driver: { select: { fullName: true } },
      },
    });

    const byDay = emptyDaySeries(days);
    const statusMap = new Map<string, number>();
    const driverMap = new Map<string, { name: string; deliveries: number }>();

    for (const s of shipments) {
      const key = dayKey(s.createdAt);
      if (byDay[key]) {
        byDay[key].shipments += 1;
        byDay[key].revenue += Number(s.finalPrice ?? 0);
      }

      const st = bucketStatus(s.status);
      statusMap.set(st, (statusMap.get(st) ?? 0) + 1);

      if (s.driverId && s.driver) {
        const row = driverMap.get(s.driverId) ?? {
          name: s.driver.fullName,
          deliveries: 0,
        };
        row.deliveries += 1;
        driverMap.set(s.driverId, row);
      }
    }

    const drivers = await this.prisma.driver.groupBy({
      by: ["status"],
      where: { operatorId, deletedAt: null },
      _count: { _all: true },
    });

    return {
      periodDays: days,
      shipmentsByDay: Object.values(byDay),
      statusBreakdown: mapOrPlaceholder(statusMap),
      driverStatus: drivers.map((d) => ({
        name: d.status,
        value: d._count._all,
      })),
      topDrivers: [...driverMap.values()]
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 6)
        .map((d) => ({ label: d.name, shipments: d.deliveries })),
    };
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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

function mapOrPlaceholder(map: Map<string, number>) {
  const rows = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  return rows.length > 0 ? rows : [{ name: "No data", value: 1 }];
}
