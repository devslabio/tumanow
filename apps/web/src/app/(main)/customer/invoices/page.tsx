"use client";

import { useEffect, useState } from "react";

import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: "ISSUED" | "PAID" | "VOID";
  currency: string;
  totalAmount: string | number;
  periodStart: string;
  periodEnd: string;
  dueAt: string | null;
  operator?: { tradingName?: string | null; legalName?: string | null };
};

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

export default function CustomerInvoicesPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<InvoiceRow[]>("/customer/invoices")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Statements from couriers billing your company account." />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "number", title: "Invoice" },
          { key: "courier", title: "Courier" },
          { key: "period", title: "Period" },
          { key: "due", title: "Due" },
          { key: "amount", title: "Amount" },
          { key: "status", title: "Status" },
        ]}
        emptyLabel="No invoices yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          number: <TablePrimaryCell primary={row.invoiceNumber} />,
          courier: row.operator?.tradingName ?? row.operator?.legalName ?? "—",
          period: `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`,
          due: row.dueAt ? new Date(row.dueAt).toLocaleDateString() : "—",
          amount: `${money(row.totalAmount)} ${row.currency}`,
          status: (
            <TableBadge tone={row.status === "PAID" ? "success" : row.status === "VOID" ? "neutral" : "warning"}>
              {row.status}
            </TableBadge>
          ),
        }))}
      />
    </div>
  );
}
