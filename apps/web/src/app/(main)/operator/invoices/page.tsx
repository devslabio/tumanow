"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: "ISSUED" | "PAID" | "VOID";
  currency: string;
  totalAmount: string | number;
  periodStart: string;
  periodEnd: string;
  items?: { id: string }[];
  customer?: { companyName?: string | null; fullName?: string | null };
};

type AccountOption = {
  id: string;
  customerId: string;
  status: string;
  customer?: { companyName?: string | null; fullName?: string | null };
};

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function OperatorInvoicesPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "corporate.manage");
  const customerId = useId();
  const startId = useId();
  const endId = useId();

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [periodStart, setPeriodStart] = useState(firstOfMonthIso());
  const [periodEnd, setPeriodEnd] = useState(todayIso());
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const [invoices, corporateAccounts] = await Promise.all([
      api<InvoiceRow[]>("/tenant/invoices"),
      api<AccountOption[]>("/tenant/corporate-accounts"),
    ]);
    setRows(invoices);
    setAccounts(corporateAccounts.filter((a) => a.status === "ACTIVE"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      await api("/tenant/invoices", {
        method: "POST",
        json: {
          customerId: selectedCustomer,
          periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
          periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
        },
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setPending(false);
    }
  }

  async function markPaid(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/invoices/${id}/pay`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function voidInvoice(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/invoices/${id}/void`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Bill business customers for their corporate-billed shipments."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setSelectedCustomer(accounts[0]?.customerId ?? "");
                setOpen(true);
              }}
              disabled={!accounts.length}
            >
              Generate invoice
            </Button>
          ) : null
        }
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}
      {canManage && !accounts.length ? (
        <Card className="mb-4 text-sm text-[var(--tn-muted)]">
          Set up a corporate account for a business customer first.
        </Card>
      ) : null}

      <DataTable
        columns={[
          { key: "number", title: "Invoice" },
          { key: "customer", title: "Company" },
          { key: "period", title: "Period" },
          { key: "amount", title: "Amount" },
          { key: "status", title: "Status" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="No invoices yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          number: <TablePrimaryCell primary={row.invoiceNumber} secondary={`${row.items?.length ?? 0} shipment(s)`} />,
          customer: row.customer?.companyName ?? row.customer?.fullName ?? "—",
          period: `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`,
          amount: `${money(row.totalAmount)} ${row.currency}`,
          status: (
            <TableBadge tone={row.status === "PAID" ? "success" : row.status === "VOID" ? "neutral" : "warning"}>
              {row.status}
            </TableBadge>
          ),
          actions:
            canManage && row.status === "ISSUED" ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => markPaid(row.id)}
                >
                  Mark paid
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                  disabled={busyId === row.id}
                  onClick={() => voidInvoice(row.id)}
                >
                  Void
                </Button>
              </div>
            ) : null,
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate invoice"
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !selectedCustomer} onClick={generate}>
              {pending ? "Generating…" : "Generate"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <FormField id={customerId} label="Company">
            <SelectInput
              id={customerId}
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.customerId}>
                  {a.customer?.companyName ?? a.customer?.fullName ?? a.customerId}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={startId} label="Period start">
              <TextInput
                id={startId}
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </FormField>
            <FormField id={endId} label="Period end">
              <TextInput
                id={endId}
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </FormField>
          </div>
          <p className="text-xs text-[var(--tn-muted)]">
            Sweeps every delivered, not-yet-invoiced corporate shipment for this company created in that window.
          </p>
        </div>
      </Modal>
    </div>
  );
}
