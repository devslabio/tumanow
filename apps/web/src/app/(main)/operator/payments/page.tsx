"use client";

import { useEffect, useState } from "react";

import {
  DataTable,
  TableBadge,
  TablePrimaryCell,
} from "@/components/ui/DataTable";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type PaymentRow = {
  id: string;
  method: string;
  status: string;
  amount: string | number;
  currency: string;
  reference: string | null;
  createdAt: string;
  shipment?: {
    trackingNumber: string;
    status: string;
    customer?: { fullName?: string | null; phone?: string | null };
  };
};

function money(amount: string | number, currency: string) {
  return `${Number(amount).toLocaleString()} ${currency}`;
}

export default function OperatorPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PaymentRow[]>("/tenant/payments")
      .then(setRows)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load payments"),
      );
  }, []);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Customer payments received for your shipments."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "shipment", title: "Shipment" },
          { key: "method", title: "Method" },
          { key: "amount", title: "Amount" },
          { key: "status", title: "Status" },
          { key: "when", title: "When" },
        ]}
        emptyLabel="No payments yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          shipment: (
            <TablePrimaryCell
              primary={row.shipment?.trackingNumber ?? "—"}
              secondary={
                row.shipment?.customer?.fullName ??
                row.reference ??
                undefined
              }
            />
          ),
          method: row.method,
          amount: money(row.amount, row.currency || "RWF"),
          status: (
            <TableBadge
              tone={
                row.status === "COMPLETED"
                  ? "success"
                  : row.status === "FAILED"
                    ? "danger"
                    : "warning"
              }
            >
              {row.status}
            </TableBadge>
          ),
          when: new Date(row.createdAt).toLocaleString(),
        }))}
      />
    </div>
  );
}
