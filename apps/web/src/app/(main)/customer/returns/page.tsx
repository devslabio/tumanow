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
import { api } from "@/lib/api";

type ShipmentOption = {
  id: string;
  trackingNumber: string;
  status: string;
};

type ReturnRow = {
  id: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string;
  shipment?: { id: string; trackingNumber: string; status: string };
  operator?: {
    tradingName: string | null;
    legalName: string;
    code: string;
  };
};

export default function CustomerReturnsPage() {
  const reasonId = useId();
  const notesId = useId();
  const shipmentIdField = useId();

  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [shipmentId, setShipmentId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [returns, allShipments] = await Promise.all([
      api<ReturnRow[]>("/customer/returns"),
      api<ShipmentOption[]>("/customer/shipments"),
    ]);
    setRows(returns);
    const eligible = allShipments.filter((s) =>
      ["DELIVERED", "FAILED"].includes(s.status),
    );
    setShipments(eligible);
    setShipmentId((prev) => prev || eligible[0]?.id || "");
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  async function createReturn() {
    setPending(true);
    setError(null);
    try {
      await api("/customer/returns", {
        method: "POST",
        json: {
          shipmentId,
          reason,
          notes: notes || undefined,
        },
      });
      setOpen(false);
      setReason("");
      setNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Returns"
        subtitle="Request returns for delivered or failed shipments."
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={shipments.length === 0}
          >
            Request return
          </Button>
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "shipment", title: "Shipment" },
          { key: "operator", title: "Operator" },
          { key: "reason", title: "Reason" },
          { key: "status", title: "Status" },
        ]}
        emptyLabel="No return requests yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          shipment: (
            <TablePrimaryCell
              primary={row.shipment?.trackingNumber ?? "—"}
              secondary={row.shipment?.status}
            />
          ),
          operator:
            row.operator?.tradingName ??
            row.operator?.legalName ??
            row.operator?.code ??
            "—",
          reason: (
            <span className="text-sm">
              {row.reason}
              {row.notes ? (
                <span className="mt-0.5 block text-xs text-[var(--tn-muted)]">
                  {row.notes}
                </span>
              ) : null}
            </span>
          ),
          status: (
            <TableBadge
              tone={
                row.status === "APPROVED"
                  ? "success"
                  : row.status === "REQUESTED"
                    ? "warning"
                    : "neutral"
              }
            >
              {row.status}
            </TableBadge>
          ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request return"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !shipmentId || !reason}
              onClick={createReturn}
            >
              {pending ? "Submitting…" : "Submit"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={shipmentIdField} label="Shipment">
            <SelectInput
              id={shipmentIdField}
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
            >
              {shipments.length === 0 ? (
                <option value="">No eligible shipments</option>
              ) : (
                shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} ({s.status})
                  </option>
                ))
              )}
            </SelectInput>
          </FormField>
          <FormField id={reasonId} label="Reason">
            <TextInput
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Wrong item / damaged / not needed"
            />
          </FormField>
          <FormField id={notesId} label="Notes">
            <TextInput
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
