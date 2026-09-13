"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  TableBadge,
  TablePrimaryCell,
} from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type QuotationRow = {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity: string | null;
  deliveryCity: string | null;
  quotedPrice: string | number | null;
  etaHours: number | null;
  terms: string | null;
  details: string | null;
  customer?: { fullName?: string | null; phone?: string | null; email?: string | null };
};

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function OperatorQuotationsPage() {
  const session = useClientSession();
  const canQuote = hasPermission(session, "orders.approve");
  const priceId = useId();
  const etaId = useId();
  const termsId = useId();

  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuotationRow | null>(null);
  const [pending, setPending] = useState(false);
  const [price, setPrice] = useState("");
  const [etaHours, setEtaHours] = useState("24");
  const [terms, setTerms] = useState("");

  const load = useCallback(async () => {
    const data = await api<QuotationRow[]>("/tenant/quotations");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  function openQuote(row: QuotationRow) {
    setActive(row);
    setPrice(row.quotedPrice != null ? String(row.quotedPrice) : "");
    setEtaHours(row.etaHours != null ? String(row.etaHours) : "24");
    setTerms(row.terms ?? "");
    setOpen(true);
  }

  async function submitQuote() {
    if (!active) return;
    setPending(true);
    setError(null);
    try {
      await api(`/tenant/quotations/${active.id}/quote`, {
        method: "POST",
        json: {
          price: Number(price),
          etaHours: etaHours ? Number(etaHours) : undefined,
          terms: terms || undefined,
        },
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Respond to customer RFQ requests."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "customer", title: "Customer" },
          { key: "route", title: "Route" },
          { key: "status", title: "Status" },
          { key: "price", title: "Quoted" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No quotations yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          customer: (
            <TablePrimaryCell
              primary={row.customer?.fullName ?? "Customer"}
              secondary={row.customer?.phone ?? row.customer?.email ?? undefined}
            />
          ),
          route: (
            <span className="text-xs text-[var(--tn-muted)]">
              {row.pickupAddress} → {row.deliveryAddress}
            </span>
          ),
          status: (
            <TableBadge
              tone={
                row.status === "QUOTED"
                  ? "orange"
                  : row.status === "ACCEPTED"
                    ? "success"
                    : row.status === "REQUESTED"
                      ? "warning"
                      : "neutral"
              }
            >
              {row.status}
            </TableBadge>
          ),
          price: money(row.quotedPrice),
          actions:
            canQuote && ["REQUESTED", "QUOTED"].includes(row.status) ? (
              <Button
                className="min-h-8 px-2.5 py-1 text-xs"
                onClick={() => openQuote(row)}
              >
                Quote
              </Button>
            ) : (
              "—"
            ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send quote"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !price} onClick={submitQuote}>
              {pending ? "Sending…" : "Send quote"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {active ? (
            <p className="text-sm text-[var(--tn-muted)]">
              {active.pickupAddress} → {active.deliveryAddress}
              {active.details ? ` · ${active.details}` : ""}
            </p>
          ) : null}
          <FormField id={priceId} label="Price (RWF)">
            <TextInput
              id={priceId}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </FormField>
          <FormField id={etaId} label="ETA (hours)">
            <TextInput
              id={etaId}
              type="number"
              min="0"
              value={etaHours}
              onChange={(e) => setEtaHours(e.target.value)}
            />
          </FormField>
          <FormField id={termsId} label="Terms">
            <TextInput
              id={termsId}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
