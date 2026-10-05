"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
};

type DeliveryRow = {
  id: string;
  event: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  attempts: number;
  responseStatus: number | null;
  createdAt: string;
};

export default function OperatorWebhooksPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "integrations.manage");
  const urlId = useId();

  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const [deliveriesFor, setDeliveriesFor] = useState<WebhookRow | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);

  const load = useCallback(async () => {
    const [webhookRows, catalogue] = await Promise.all([
      api<WebhookRow[]>("/tenant/webhooks"),
      api<string[]>("/tenant/webhooks/events"),
    ]);
    setRows(webhookRows);
    setEvents(catalogue);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  async function create() {
    setPending(true);
    setError(null);
    try {
      const res = await api<{ secret: string }>("/tenant/webhooks", {
        method: "POST",
        json: { url, events: selectedEvents },
      });
      setCreatedSecret(res.secret);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(row: WebhookRow) {
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/tenant/webhooks/${row.id}`, {
        method: "PATCH",
        json: { isActive: !row.isActive },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/webhooks/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function viewDeliveries(row: WebhookRow) {
    setDeliveriesFor(row);
    try {
      const data = await api<DeliveryRow[]>(`/tenant/webhooks/${row.id}/deliveries`);
      setDeliveries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deliveries");
    }
  }

  function closeModal() {
    setOpen(false);
    setUrl("");
    setSelectedEvents([]);
    setCreatedSecret(null);
  }

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Get notified automatically when a shipment, payment, or quote changes."
        actions={canManage ? <Button onClick={() => setOpen(true)}>Add webhook</Button> : null}
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "url", title: "Endpoint" },
          { key: "status", title: "Status" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="No webhooks yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          url: (
            <TablePrimaryCell
              primary={row.url}
              secondary={row.events.length ? row.events.join(", ") : "All events"}
            />
          ),
          status: <TableBadge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Active" : "Paused"}</TableBadge>,
          actions: canManage ? (
            <div className="flex gap-2">
              <Button variant="ghost" className="min-h-8 px-2.5 py-1 text-xs" onClick={() => viewDeliveries(row)}>
                Deliveries
              </Button>
              <Button
                variant="ghost"
                className="min-h-8 px-2.5 py-1 text-xs"
                disabled={busyId === row.id}
                onClick={() => toggleActive(row)}
              >
                {row.isActive ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="ghost"
                className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                disabled={busyId === row.id}
                onClick={() => remove(row.id)}
              >
                Delete
              </Button>
            </div>
          ) : null,
        }))}
      />

      <Modal
        open={open}
        onClose={closeModal}
        title="Add webhook"
        maxWidth="max-w-xl"
        footer={
          createdSecret ? (
            <div className="flex justify-end">
              <Button onClick={closeModal}>Done</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button disabled={pending || !url} onClick={create}>
                {pending ? "Saving…" : "Create"}
              </Button>
            </div>
          )
        }
      >
        {createdSecret ? (
          <div className="grid gap-3">
            <p className="text-sm text-[var(--tn-danger)]">
              This is the only time the full signing secret is shown. Copy it now.
            </p>
            <Card className="break-all font-mono text-sm">{createdSecret}</Card>
          </div>
        ) : (
          <div className="grid gap-4">
            <FormField id={urlId} label="Endpoint URL">
              <TextInput
                id={urlId}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-system.example.com/tumanow/webhook"
              />
            </FormField>
            <FormField id="events" label="Events (none selected = all events)">
              <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {events.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </FormField>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deliveriesFor)}
        onClose={() => setDeliveriesFor(null)}
        title={`Recent deliveries — ${deliveriesFor?.url ?? ""}`}
        maxWidth="max-w-2xl"
      >
        <DataTable
          columns={[
            { key: "event", title: "Event" },
            { key: "status", title: "Status" },
            { key: "attempts", title: "Attempts" },
            { key: "when", title: "When" },
          ]}
          emptyLabel="No deliveries yet."
          rowKeys={deliveries.map((d) => d.id)}
          rows={deliveries.map((d) => ({
            event: d.event,
            status: (
              <TableBadge tone={d.status === "SUCCESS" ? "success" : d.status === "FAILED" ? "danger" : "warning"}>
                {d.status}
                {d.responseStatus ? ` (${d.responseStatus})` : ""}
              </TableBadge>
            ),
            attempts: d.attempts,
            when: new Date(d.createdAt).toLocaleString(),
          }))}
        />
      </Modal>
    </div>
  );
}
