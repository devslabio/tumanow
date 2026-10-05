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

type SettlementRow = {
  id: string;
  settlementNumber: string;
  status: "PENDING" | "PAID" | "VOID";
  currency: string;
  grossAmount: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
  periodStart: string;
  periodEnd: string;
  operator?: { tradingName?: string | null; legalName?: string | null; code?: string };
};

type OperatorOption = { id: string; code: string; legalName: string; tradingName: string | null };

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

export default function PlatformSettlementsPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "platform.settlements.manage");
  const operatorId = useId();
  const startId = useId();
  const endId = useId();

  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [periodStart, setPeriodStart] = useState(firstOfMonthIso());
  const [periodEnd, setPeriodEnd] = useState(todayIso());
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const [settlements, operatorRows] = await Promise.all([
      api<SettlementRow[]>("/platform/settlements"),
      api<OperatorOption[]>("/platform/operators"),
    ]);
    setRows(settlements);
    setOperators(operatorRows);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      await api("/platform/settlements", {
        method: "POST",
        json: {
          operatorId: selectedOperator,
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
      await api(`/platform/settlements/${id}/pay`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function voidSettlement(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/platform/settlements/${id}/void`, { method: "POST" });
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
        title="Settlements"
        subtitle="What TumaNow owes each operator after commission."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setSelectedOperator(operators[0]?.id ?? "");
                setOpen(true);
              }}
              disabled={!operators.length}
            >
              Generate settlement
            </Button>
          ) : null
        }
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "number", title: "Settlement" },
          { key: "operator", title: "Operator" },
          { key: "period", title: "Period" },
          { key: "gross", title: "Gross" },
          { key: "commission", title: "Commission" },
          { key: "net", title: "Net payout" },
          { key: "status", title: "Status" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="No settlements yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          number: <TablePrimaryCell primary={row.settlementNumber} />,
          operator: row.operator?.tradingName ?? row.operator?.legalName ?? "—",
          period: `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`,
          gross: `${money(row.grossAmount)} ${row.currency}`,
          commission: `${money(row.commissionAmount)} ${row.currency}`,
          net: `${money(row.netAmount)} ${row.currency}`,
          status: (
            <TableBadge tone={row.status === "PAID" ? "success" : row.status === "VOID" ? "neutral" : "warning"}>
              {row.status}
            </TableBadge>
          ),
          actions:
            canManage && row.status === "PENDING" ? (
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
                  onClick={() => voidSettlement(row.id)}
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
        title="Generate settlement"
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !selectedOperator} onClick={generate}>
              {pending ? "Generating…" : "Generate"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <FormField id={operatorId} label="Operator">
            <SelectInput
              id={operatorId}
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.tradingName ?? o.legalName} ({o.code})
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
            Sweeps every delivered, not-yet-settled shipment for this operator created in that window.
          </p>
        </div>
      </Modal>
    </div>
  );
}
