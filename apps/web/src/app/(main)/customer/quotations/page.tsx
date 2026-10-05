"use client";

import Link from "next/link";
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
import { API_BASE, api, hasPermission } from "@/lib/api";
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
  shipmentId: string | null;
  operator?: {
    id: string;
    tradingName?: string | null;
    legalName?: string;
  };
};

type OperatorOption = {
  id: string;
  code: string;
  tradingName: string | null;
  legalName: string;
};

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function CustomerQuotationsPage() {
  const session = useClientSession();
  const canCreate = hasPermission(session, "customer.shipments.create");

  const operatorIdField = useId();
  const pickupId = useId();
  const deliveryId = useId();
  const pickupCityId = useId();
  const deliveryCityId = useId();
  const detailsId = useId();

  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [operatorId, setOperatorId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("Kigali");
  const [deliveryCity, setDeliveryCity] = useState("Kigali");
  const [details, setDetails] = useState("");

  const load = useCallback(async () => {
    const data = await api<QuotationRow[]>("/customer/quotations");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
    fetch(`${API_BASE}/public/operators`)
      .then((res) => res.json())
      .then((list: OperatorOption[]) => {
        setOperators(list);
        if (list[0]) setOperatorId(list[0].id);
      })
      .catch(() => undefined);

    if (!canCreate || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("rfq") !== "1") return;
    setPickupAddress(params.get("pickup") ?? "");
    setDeliveryAddress(params.get("delivery") ?? "");
    setPickupCity(params.get("pickupCity") ?? "Kigali");
    setDeliveryCity(params.get("deliveryCity") ?? "Kigali");
    setOpen(true);
  }, [load, canCreate]);

  async function createRfq() {
    setPending(true);
    setError(null);
    try {
      await api("/customer/quotations", {
        method: "POST",
        json: {
          operatorId,
          pickupAddress,
          deliveryAddress,
          pickupCity,
          deliveryCity,
          details: details || undefined,
        },
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function accept(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/customer/quotations/${id}/accept`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Custom RFQ requests and operator quotes."
        actions={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>Request quote</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "operator", title: "Operator" },
          { key: "route", title: "Route" },
          { key: "status", title: "Status" },
          { key: "price", title: "Quote" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No quotations yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          operator: (
            <TablePrimaryCell
              primary={
                row.operator?.tradingName ??
                row.operator?.legalName ??
                "Operator"
              }
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
          price: (
            <span>
              {money(row.quotedPrice)}
              {row.etaHours != null ? (
                <span className="block text-xs text-[var(--tn-muted)]">
                  ETA {row.etaHours}h
                </span>
              ) : null}
            </span>
          ),
          actions:
            canCreate && row.status === "QUOTED" ? (
              <Button
                className="min-h-8 px-2.5 py-1 text-xs"
                disabled={busyId === row.id}
                onClick={() => accept(row.id)}
              >
                Accept
              </Button>
            ) : row.shipmentId ? (
              <Link href="/customer/shipments">
                <Button variant="ghost" className="min-h-8 px-2.5 py-1 text-xs">
                  View shipments
                </Button>
              </Link>
            ) : (
              "—"
            ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request quotation"
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                pending || !operatorId || !pickupAddress || !deliveryAddress
              }
              onClick={createRfq}
            >
              {pending ? "Submitting…" : "Submit RFQ"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={operatorIdField} label="Operator">
            <SelectInput
              id={operatorIdField}
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            >
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.tradingName ?? o.legalName}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField id={pickupId} label="Pickup address">
            <TextInput
              id={pickupId}
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
            />
          </FormField>
          <FormField id={pickupCityId} label="Pickup city">
            <TextInput
              id={pickupCityId}
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
            />
          </FormField>
          <FormField id={deliveryId} label="Delivery address">
            <TextInput
              id={deliveryId}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </FormField>
          <FormField id={deliveryCityId} label="Delivery city">
            <TextInput
              id={deliveryCityId}
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
            />
          </FormField>
          <FormField id={detailsId} label="Details">
            <TextInput
              id={detailsId}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Large item, special handling, etc."
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
