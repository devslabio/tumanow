"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  TableBadge,
  TablePrimaryCell,
} from "@/components/ui/DataTable";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type OperatorRow = {
  id: string;
  code: string;
  legalName: string;
  tradingName: string | null;
  status: string;
  city: string | null;
  _count: { branches: number; memberships: number; shipments: number };
};

export default function PlatformOperatorsPage() {
  const session = useClientSession();
  const canApprove = hasPermission(session, "platform.operator.approve");
  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api<OperatorRow[]>("/platform/operators");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/platform/operators/${id}/approve`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Operators"
        subtitle="Logistics companies onboarded on TumaNow."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "operator", title: "Operator" },
          { key: "status", title: "Status" },
          { key: "city", title: "City" },
          { key: "branches", title: "Branches" },
          { key: "shipments", title: "Shipments" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No operators yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          operator: (
            <TablePrimaryCell
              primary={row.tradingName ?? row.legalName}
              secondary={row.code}
            />
          ),
          status: (
            <TableBadge
              tone={
                row.status === "ACTIVE"
                  ? "success"
                  : row.status === "PENDING"
                    ? "warning"
                    : "neutral"
              }
            >
              {row.status}
            </TableBadge>
          ),
          city: row.city ?? "—",
          branches: row._count.branches,
          shipments: row._count.shipments,
          actions:
            canApprove && ["PENDING", "APPROVED"].includes(row.status) ? (
              <Button
                className="min-h-8 px-2.5 py-1 text-xs"
                disabled={busyId === row.id}
                onClick={() => approve(row.id)}
              >
                Approve
              </Button>
            ) : (
              "—"
            ),
        }))}
      />
    </div>
  );
}
