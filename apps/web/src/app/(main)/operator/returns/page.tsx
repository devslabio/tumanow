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

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  notes: string | null;
  createdAt: string;
  customer?: { fullName?: string | null; phone?: string | null };
  shipment?: { trackingNumber: string; status: string };
};

export default function OperatorReturnsPage() {
  const session = useClientSession();
  const canApprove = hasPermission(session, "orders.update_status");

  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api<ReturnRow[]>("/tenant/returns");
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
      await api(`/tenant/returns/${id}/approve`, { method: "POST" });
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
        title="Returns"
        subtitle="Review and approve return requests."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "shipment", title: "Shipment" },
          { key: "customer", title: "Customer" },
          { key: "reason", title: "Reason" },
          { key: "status", title: "Status" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No returns yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          shipment: (
            <TablePrimaryCell
              primary={row.shipment?.trackingNumber ?? "—"}
              secondary={new Date(row.createdAt).toLocaleString()}
            />
          ),
          customer: row.customer?.fullName ?? row.customer?.phone ?? "—",
          reason: (
            <span className="text-xs">
              {row.reason}
              {row.notes ? (
                <span className="block text-[var(--tn-muted)]">{row.notes}</span>
              ) : null}
            </span>
          ),
          status: (
            <TableBadge
              tone={
                row.status === "APPROVED"
                  ? "success"
                  : row.status === "REQUESTED" || row.status === "PENDING"
                    ? "warning"
                    : "neutral"
              }
            >
              {row.status}
            </TableBadge>
          ),
          actions:
            canApprove &&
            !["APPROVED", "COMPLETED", "CANCELLED", "REJECTED"].includes(
              row.status,
            ) ? (
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
