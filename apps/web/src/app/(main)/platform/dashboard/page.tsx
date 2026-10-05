"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Package,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { HorizontalBarChart } from "@/components/dashboard/HorizontalBarChart";
import {
  PeriodPicker,
  type PeriodOption,
} from "@/components/dashboard/PeriodPicker";
import { ShipmentsAreaChart } from "@/components/dashboard/ShipmentsAreaChart";
import { DashboardStatCard } from "@/components/dashboard/StatCard";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type Summary = {
  totalOperators: number;
  activeOperators: number;
  pendingApprovals: number;
  totalCustomers: number;
  totalShipments: number;
  completedShipments: number;
  failedShipments: number;
  platformVolume: number;
};

type Analytics = {
  periodDays: number;
  shipmentsByDay: { day: string; shipments: number; revenue: number }[];
  statusBreakdown: { name: string; value: number }[];
  topOperators: { label: string; shipments: number; revenue: number }[];
};

function money(v: number | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<PeriodOption>(14);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (days: PeriodOption) => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        api<Summary>("/platform/dashboard/summary"),
        api<Analytics>(`/platform/dashboard/analytics?days=${days}`),
      ]);
      setSummary(s);
      setAnalytics(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform dashboard"
        subtitle="Operators, volume, and network health across TumaNow."
        actions={<PeriodPicker value={period} onChange={setPeriod} />}
      />

      {error ? (
        <Card className="text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardStatCard
          title="Operators"
          value={summary?.totalOperators ?? "—"}
          hint={
            summary
              ? `${summary.activeOperators} active · ${summary.pendingApprovals} pending`
              : loading
                ? "Loading…"
                : undefined
          }
          icon={<Building2 />}
        />
        <DashboardStatCard
          title="Customers"
          value={summary?.totalCustomers ?? "—"}
          icon={<Users />}
        />
        <DashboardStatCard
          title="Shipments"
          value={summary?.totalShipments ?? "—"}
          icon={<Package />}
        />
        <DashboardStatCard
          title="Completed"
          value={summary?.completedShipments ?? "—"}
          icon={<CheckCircle2 />}
        />
        <DashboardStatCard
          title="Failed / returned"
          value={summary?.failedShipments ?? "—"}
          icon={<TriangleAlert />}
        />
        <DashboardStatCard
          title="Network volume"
          value={summary ? money(summary.platformVolume) : "—"}
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

      <ChartCard
        title="Top operators"
        subtitle="By shipment volume in the period"
      >
        {(analytics?.topOperators.length ?? 0) === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--tn-muted)]">
            No operator volume yet.
          </p>
        ) : (
          <HorizontalBarChart data={analytics?.topOperators ?? []} />
        )}
      </ChartCard>
    </div>
  );
}
