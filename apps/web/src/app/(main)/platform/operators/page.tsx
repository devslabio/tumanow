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
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type OperatorRow = {
  id: string;
  code: string;
  legalName: string;
  tradingName: string | null;
  status: string;
  city: string | null;
  commissionType: "PERCENTAGE" | "FIXED" | "HYBRID";
  commissionPercent: string | number | null;
  commissionFixedFee: string | number | null;
  _count: { branches: number; memberships: number; shipments: number };
};

export default function PlatformOperatorsPage() {
  const session = useClientSession();
  const canApprove = hasPermission(session, "platform.operator.approve");
  const canSuspend = hasPermission(session, "platform.operator.suspend");
  const canUpdate = hasPermission(session, "platform.operator.update");
  const commissionTypeId = useId();
  const commissionPercentId = useId();
  const commissionFixedId = useId();

  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [commissionFor, setCommissionFor] = useState<OperatorRow | null>(null);
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED" | "HYBRID">("PERCENTAGE");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [commissionFixedFee, setCommissionFixedFee] = useState("0");
  const [savingCommission, setSavingCommission] = useState(false);

  const load = useCallback(async () => {
    const data = await api<OperatorRow[]>("/platform/operators");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  async function runAction(id: string, action: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/platform/operators/${id}/${action}`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setBusyId(null);
    }
  }

  function openCommission(row: OperatorRow) {
    setCommissionFor(row);
    setCommissionType(row.commissionType);
    setCommissionPercent(String(row.commissionPercent ?? 0));
    setCommissionFixedFee(String(row.commissionFixedFee ?? 0));
  }

  async function saveCommission() {
    if (!commissionFor) return;
    setSavingCommission(true);
    setError(null);
    try {
      await api(`/platform/operators/${commissionFor.id}/commission`, {
        method: "PATCH",
        json: {
          commissionType,
          commissionPercent: Number(commissionPercent) || 0,
          commissionFixedFee: Number(commissionFixedFee) || 0,
        },
      });
      setCommissionFor(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingCommission(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Operators"
        subtitle="Logistics companies onboarded on TumaNow."
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "operator", title: "Operator" },
          { key: "status", title: "Status" },
          { key: "city", title: "City" },
          { key: "commission", title: "Commission" },
          { key: "shipments", title: "Shipments" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No operators yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          operator: (
            <TablePrimaryCell
              primary={row.tradingName ?? row.legalName}
              secondary={row.code}
            />
          ),
          status: (
            <TableBadge
              tone={
                row.status === "ACTIVE"
                  ? "success"
                  : row.status === "PENDING"
                    ? "warning"
                    : row.status === "SUSPENDED" || row.status === "REJECTED"
                      ? "danger"
                      : "neutral"
              }
            >
              {row.status}
            </TableBadge>
          ),
          city: row.city ?? "—",
          commission:
            row.commissionType === "PERCENTAGE"
              ? `${row.commissionPercent}%`
              : row.commissionType === "FIXED"
                ? `${row.commissionFixedFee} flat`
                : `${row.commissionPercent}% + ${row.commissionFixedFee}`,
          shipments: row._count.shipments,
          actions: (
            <div className="flex flex-wrap gap-2">
              {canApprove && row.status === "PENDING" ? (
                <>
                  <Button
                    className="min-h-8 px-2.5 py-1 text-xs"
                    disabled={busyId === row.id}
                    onClick={() => runAction(row.id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                    disabled={busyId === row.id}
                    onClick={() => runAction(row.id, "reject")}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {canSuspend && row.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                  disabled={busyId === row.id}
                  onClick={() => runAction(row.id, "suspend")}
                >
                  Suspend
                </Button>
              ) : null}
              {canSuspend && row.status === "SUSPENDED" ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => runAction(row.id, "reactivate")}
                >
                  Reactivate
                </Button>
              ) : null}
              {canUpdate ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  onClick={() => openCommission(row)}
                >
                  Commission
                </Button>
              ) : null}
            </div>
          ),
        }))}
      />

      <Modal
        open={Boolean(commissionFor)}
        onClose={() => setCommissionFor(null)}
        title={`Commission — ${commissionFor?.tradingName ?? commissionFor?.legalName ?? ""}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCommissionFor(null)}>
              Cancel
            </Button>
            <Button disabled={savingCommission} onClick={saveCommission}>
              {savingCommission ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <FormField id={commissionTypeId} label="Type">
            <SelectInput
              id={commissionTypeId}
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as typeof commissionType)}
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed fee</option>
              <option value="HYBRID">Percentage + fixed fee</option>
            </SelectInput>
          </FormField>
          {commissionType !== "FIXED" ? (
            <FormField id={commissionPercentId} label="Percent (%)">
              <TextInput
                id={commissionPercentId}
                type="number"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
              />
            </FormField>
          ) : null}
          {commissionType !== "PERCENTAGE" ? (
            <FormField id={commissionFixedId} label="Fixed fee (RWF)">
              <TextInput
                id={commissionFixedId}
                type="number"
                min="0"
                value={commissionFixedFee}
                onChange={(e) => setCommissionFixedFee(e.target.value)}
              />
            </FormField>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
