"use client";

import { useEffect, useState } from "react";

import {
  DataTable,
  TablePrimaryCell,
} from "@/components/ui/DataTable";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor?:
    | { type: "user"; fullName?: string | null; email?: string }
    | { type: "api_key"; name: string }
    | null;
};

function actorLabel(actor: AuditRow["actor"]): string {
  if (!actor) return "—";
  if (actor.type === "api_key") return `API key: ${actor.name}`;
  return actor.fullName ?? actor.email ?? "—";
}

export default function OperatorAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AuditRow[]>("/tenant/audit")
      .then(setRows)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load audit log"),
      );
  }, []);

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Operator-scoped activity history."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "when", title: "When" },
          { key: "action", title: "Action" },
          { key: "entity", title: "Entity" },
          { key: "actor", title: "Actor" },
        ]}
        emptyLabel="No audit events yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          when: new Date(row.createdAt).toLocaleString(),
          action: row.action,
          entity: (
            <TablePrimaryCell
              primary={row.entityType}
              secondary={row.entityId ?? undefined}
            />
          ),
          actor: actorLabel(row.actor),
        }))}
      />
    </div>
  );
}
