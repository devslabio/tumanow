"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Package,
  Plus,
  Truck,
  Wallet,
} from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { ShipmentsAreaChart } from "@/components/dashboard/ShipmentsAreaChart";
import { DashboardStatCard } from "@/components/dashboard/StatCard";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import {
  shipmentStatusBadgeClass,
  shipmentStatusLabel,
} from "@/lib/shipment-status";

type Summary = {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  awaitingPayment: number;
  totalSpend: number;
  recent: {
    trackingNumber: string;
    status: string;
    amount: number;
    isCod: boolean;
  }[];
  shipmentsByDay: { day: string; shipments: number }[];
};

function money(v: number | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function CustomerDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Summary>("/customer/dashboard/summary")
      .then(setSummary)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load dashboard"),
      );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My dashboard"
        subtitle="Track activity and jump back into your shipments."
        actions={
          <Link
            href="/customer/new-shipment"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius-field)] bg-[var(--tn-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--tn-primary-dark)]"
          >
            <Plus className="h-4 w-4" />
            New shipment
          </Link>
        }
      />

      {error ? (
        <Card className="text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total shipments"
          value={summary?.totalShipments ?? "—"}
          icon={<Package />}
        />
        <DashboardStatCard
          title="In progress"
          value={summary?.activeShipments ?? "—"}
          hint={
            summary?.awaitingPayment
              ? `${summary.awaitingPayment} awaiting payment`
              : undefined
          }
          icon={<Truck />}
        />
        <DashboardStatCard
          title="Delivered"
          value={summary?.deliveredShipments ?? "—"}
          icon={<CheckCircle2 />}
        />
        <DashboardStatCard
          title="Spend"
          value={summary ? money(summary.totalSpend) : "—"}
          icon={<Wallet />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Your shipments"
          subtitle="Last 14 days"
        >
          <ShipmentsAreaChart data={summary?.shipmentsByDay ?? []} />
        </ChartCard>

        <Card className="flex flex-col">
          <h3
            className="text-sm font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recent
          </h3>
          <p className="mt-1 text-sm text-[var(--tn-muted)]">
            Latest shipment activity
          </p>
          <ul className="mt-4 flex-1 space-y-3">
            {(summary?.recent.length ?? 0) === 0 ? (
              <li className="py-8 text-center text-sm text-[var(--tn-muted)]">
                No shipments yet.
              </li>
            ) : (
              summary?.recent.map((row) => (
                <li
                  key={row.trackingNumber}
                  className="flex items-start justify-between gap-3 border-b border-[var(--tn-border-subtle)] pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.trackingNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--tn-muted)]">
                      {money(row.amount)}
                      {row.isCod ? " · COD" : ""}
                    </p>
                  </div>
                  <span
                    className={`tn-badge shrink-0 ${shipmentStatusBadgeClass(row.status)}`}
                  >
                    {shipmentStatusLabel(row.status)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/customer/shipments"
            className="mt-4 text-sm font-medium text-[var(--tn-primary)] hover:text-[var(--tn-primary-dark)]"
          >
            View all shipments →
          </Link>
        </Card>
      </div>
    </div>
  );
}
