"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Package,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { HorizontalBarChart } from "@/components/dashboard/HorizontalBarChart";
import {
  PeriodPicker,
  type PeriodOption,
} from "@/components/dashboard/PeriodPicker";
import { RevenueLineChart } from "@/components/dashboard/RevenueLineChart";
import { ShipmentsAreaChart } from "@/components/dashboard/ShipmentsAreaChart";
import { DashboardStatCard } from "@/components/dashboard/StatCard";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type Summary = {
  pendingShipments: number;
  activeDeliveries: number;
  completedToday: number;
  failedDeliveries: number;
  driversAvailable: number;
  driversBusy: number;
  vehiclesAvailable: number;
  codOpen: number;
  totalRevenue: number;
};

type Analytics = {
  periodDays: number;
  shipmentsByDay: { day: string; shipments: number; revenue: number }[];
  statusBreakdown: { name: string; value: number }[];
  driverStatus: { name: string; value: number }[];
  topDrivers: { label: string; shipments: number }[];
};

function money(v: number | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function OperatorDashboardPage() {
  const session = useClientSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<PeriodOption>(14);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days: PeriodOption) => {
    setError(null);
    try {
      const [s, a] = await Promise.all([
        api<Summary>("/tenant/dashboard/summary"),
        api<Analytics>(`/tenant/dashboard/analytics?days=${days}`),
      ]);
      setSummary(s);
      setAnalytics(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={session?.operatorName ?? "Operator dashboard"}
        subtitle="Operations, fleet, and revenue at a glance."
        actions={<PeriodPicker value={period} onChange={setPeriod} />}
      />

      {error ? (
        <Card className="text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardStatCard
          title="Pending review"
          value={summary?.pendingShipments ?? "—"}
          footer={
            <Link
              href="/operator/shipments"
              className="text-[var(--tn-primary)] hover:underline"
            >
              Open shipments
            </Link>
          }
          icon={<Package />}
        />
        <DashboardStatCard
          title="Active deliveries"
          value={summary?.activeDeliveries ?? "—"}
          footer={
            summary
              ? `${summary.driversBusy} drivers busy · ${summary.vehiclesAvailable} vehicles free`
              : undefined
          }
          icon={<Truck />}
        />
        <DashboardStatCard
          title="Completed today"
          value={summary?.completedToday ?? "—"}
          icon={<CheckCircle2 />}
        />
        <DashboardStatCard
          title="Failed / returned"
          value={summary?.failedDeliveries ?? "—"}
          icon={<TriangleAlert />}
        />
        <DashboardStatCard
          title="Drivers available"
          value={summary?.driversAvailable ?? "—"}
          icon={<Users />}
        />
        <DashboardStatCard
          title="Open COD"
          value={summary?.codOpen ?? "—"}
          hint="Pending or collected, not settled"
          footer={
            <Link
              href="/operator/shipments"
              className="text-[var(--tn-primary)] hover:underline"
            >
              Manage COD
            </Link>
          }
          icon={<Banknote />}
        />
        <DashboardStatCard
          title="Revenue"
          value={summary ? money(summary.totalRevenue) : "—"}
          footer="Paid + delivered shipments"
          icon={<Wallet />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Shipments created"
          subtitle={`Last ${analytics?.periodDays ?? period} days`}
        >
          <ShipmentsAreaChart data={analytics?.shipmentsByDay ?? []} />
        </ChartCard>
        <ChartCard title="Status mix" subtitle="Created in period">
          <StatusDonutChart data={analytics?.statusBreakdown ?? []} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue trend" subtitle="Quoted / final price by day">
          <RevenueLineChart data={analytics?.shipmentsByDay ?? []} />
        </ChartCard>
        <ChartCard title="Driver workload" subtitle="Assignments in period">
          {(analytics?.topDrivers.length ?? 0) === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-[var(--tn-muted)]">
              No assigned deliveries yet.
            </p>
          ) : (
            <HorizontalBarChart
              data={analytics?.topDrivers ?? []}
              valueLabel="Deliveries"
            />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Fleet availability" subtitle="Current driver status">
        <StatusDonutChart
          data={analytics?.driverStatus ?? []}
          centerTitle="Drivers"
          colors={["var(--tn-primary)", "#c44d12", "#6b7280", "#b42318"]}
        />
      </ChartCard>
    </div>
  );
}
