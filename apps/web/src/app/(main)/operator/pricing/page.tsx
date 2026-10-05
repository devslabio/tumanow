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

type PricingRow = {
  id: string;
  name: string;
  deliveryService: string;
  baseFee: string | number;
  perKmFee: string | number;
  perKgFee: string | number;
  fragileSurcharge: string | number;
  expressSurcharge: string | number;
  isActive: boolean;
};

const SERVICES = [
  "STANDARD",
  "EXPRESS",
  "SAME_DAY",
  "NEXT_DAY",
  "SCHEDULED",
  "INTERCITY",
];

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

export default function OperatorPricingPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "pricing.manage");
  const nameId = useId();
  const serviceId = useId();
  const baseId = useId();
  const perKmId = useId();
  const perKgId = useId();
  const fragileId = useId();
  const expressId = useId();

  const [rows, setRows] = useState<PricingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [deliveryService, setDeliveryService] = useState("STANDARD");
  const [baseFee, setBaseFee] = useState("1500");
  const [perKmFee, setPerKmFee] = useState("200");
  const [perKgFee, setPerKgFee] = useState("100");
  const [fragileSurcharge, setFragileSurcharge] = useState("500");
  const [expressSurcharge, setExpressSurcharge] = useState("1000");

  const load = useCallback(async () => {
    const data = await api<PricingRow[]>("/tenant/pricing");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  async function create() {
    setPending(true);
    setError(null);
    try {
      await api("/tenant/pricing", {
        method: "POST",
        json: {
          name,
          deliveryService,
          baseFee: Number(baseFee) || 0,
          perKmFee: Number(perKmFee) || 0,
          perKgFee: Number(perKgFee) || 0,
          fragileSurcharge: Number(fragileSurcharge) || 0,
          expressSurcharge: Number(expressSurcharge) || 0,
        },
      });
      setOpen(false);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pricing"
        subtitle="Instant quote rules for delivery services."
        actions={
          canManage ? (
            <Button onClick={() => setOpen(true)}>Add pricing rule</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "name", title: "Rule" },
          { key: "service", title: "Service" },
          { key: "base", title: "Base" },
          { key: "perKm", title: "Per km" },
          { key: "perKg", title: "Per kg" },
          { key: "status", title: "Status" },
        ]}
        emptyLabel="No pricing rules yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          name: <TablePrimaryCell primary={row.name} />,
          service: row.deliveryService,
          base: money(row.baseFee),
          perKm: money(row.perKmFee),
          perKg: money(row.perKgFee),
          status: (
            <TableBadge tone={row.isActive ? "success" : "neutral"}>
              {row.isActive ? "Active" : "Inactive"}
            </TableBadge>
          ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add pricing rule"
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !name || !baseFee}
              onClick={create}
            >
              {pending ? "Saving…" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={nameId} label="Name">
            <TextInput
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField id={serviceId} label="Delivery service">
            <SelectInput
              id={serviceId}
              value={deliveryService}
              onChange={(e) => setDeliveryService(e.target.value)}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField id={baseId} label="Base fee (RWF)">
            <TextInput
              id={baseId}
              type="number"
              min="0"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
            />
          </FormField>
          <FormField id={perKmId} label="Per km fee">
            <TextInput
              id={perKmId}
              type="number"
              min="0"
              value={perKmFee}
              onChange={(e) => setPerKmFee(e.target.value)}
            />
          </FormField>
          <FormField id={perKgId} label="Per kg fee">
            <TextInput
              id={perKgId}
              type="number"
              min="0"
              value={perKgFee}
              onChange={(e) => setPerKgFee(e.target.value)}
            />
          </FormField>
          <FormField id={fragileId} label="Fragile surcharge">
            <TextInput
              id={fragileId}
              type="number"
              min="0"
              value={fragileSurcharge}
              onChange={(e) => setFragileSurcharge(e.target.value)}
            />
          </FormField>
          <FormField id={expressId} label="Express surcharge">
            <TextInput
              id={expressId}
              type="number"
              min="0"
              value={expressSurcharge}
              onChange={(e) => setExpressSurcharge(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
