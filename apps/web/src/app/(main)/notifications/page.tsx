"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TablePrimaryCell } from "@/components/ui/DataTable";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { api } from "@/lib/api";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const data = await api<NotificationRow[]>("/notifications/me");
    setRows(data);
  }

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load notifications"),
    );
  }, []);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await api(`/notifications/${id}/read`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark read");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Shipment and payment events for your account."
      />
      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <DataTable
          columns={[
            { key: "message", title: "Message" },
            { key: "when", title: "When" },
            { key: "actions", title: "" },
          ]}
          rowKeys={rows.map((r) => r.id)}
          stopPropagationOnCellKeys={["actions"]}
          rows={rows.map((row) => ({
            message: (
              <TablePrimaryCell
                primary={row.title}
                secondary={row.body ?? row.type}
              />
            ),
            when: (
              <span className="text-xs text-[var(--tn-muted)]">
                {new Date(row.createdAt).toLocaleString()}
                {row.readAt ? " · Read" : " · Unread"}
              </span>
            ),
            actions: row.readAt ? null : (
              <Button
                variant="ghost"
                className="min-h-8 px-2 text-xs"
                disabled={busyId === row.id}
                onClick={() => markRead(row.id)}
              >
                Mark read
              </Button>
            ),
          }))}
        />
      )}
    </div>
  );
}
