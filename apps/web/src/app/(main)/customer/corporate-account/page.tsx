"use client";

import { useEffect, useState } from "react";

import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type AccountRow = {
  id: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  creditLimit: string | number;
  currentBalance: string | number;
  currency: string;
  operator?: { tradingName?: string | null; legalName?: string | null; code?: string };
};

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

export default function CustomerCorporateAccountPage() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AccountRow[]>("/customer/corporate-accounts")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <div>
      <PageHeader
        title="Corporate account"
        subtitle="Postpaid credit terms your couriers have set up for your company."
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "operator", title: "Courier" },
          { key: "status", title: "Status" },
          { key: "balance", title: "Balance / limit" },
        ]}
        emptyLabel="No courier has set up postpaid terms for your company yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          operator: (
            <TablePrimaryCell
              primary={row.operator?.tradingName ?? row.operator?.legalName ?? "—"}
            />
          ),
          status: (
            <TableBadge tone={row.status === "ACTIVE" ? "success" : row.status === "SUSPENDED" ? "danger" : "neutral"}>
              {row.status}
            </TableBadge>
          ),
          balance: `${money(row.currentBalance)} / ${money(row.creditLimit)} ${row.currency}`,
        }))}
      />
    </div>
  );
}
