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

type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
type VehicleType = "MOTORCYCLE" | "CAR" | "VAN" | "PICKUP" | "TRUCK";

type VehicleRow = {
  id: string;
  registrationNo: string;
  label: string | null;
  type: VehicleType;
  status: VehicleStatus;
  maxWeightKg: string | number | null;
  isActive: boolean;
  drivers?: { id: string; fullName: string; status: string }[];
};

const STATUS_TONES: Record<
  VehicleStatus,
  "success" | "warning" | "neutral" | "danger"
> = {
  AVAILABLE: "success",
  IN_USE: "warning",
  MAINTENANCE: "neutral",
  RETIRED: "danger",
};

const TYPES: VehicleType[] = ["MOTORCYCLE", "CAR", "VAN", "PICKUP", "TRUCK"];
const STATUSES: VehicleStatus[] = [
  "AVAILABLE",
  "IN_USE",
  "MAINTENANCE",
  "RETIRED",
];

export default function OperatorVehiclesPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "fleet.manage");
  const regId = useId();
  const labelId = useId();
  const typeId = useId();
  const weightId = useId();

  const [rows, setRows] = useState<VehicleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [registrationNo, setRegistrationNo] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<VehicleType>("MOTORCYCLE");
  const [maxWeightKg, setMaxWeightKg] = useState("");

  const load = useCallback(async () => {
    const data = await api<VehicleRow[]>("/tenant/vehicles");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load vehicles"),
    );
  }, [load]);

  async function createVehicle() {
    setPending(true);
    setError(null);
    try {
      await api("/tenant/vehicles", {
        method: "POST",
        json: {
          registrationNo,
          label: label || undefined,
          type,
          maxWeightKg: maxWeightKg ? Number(maxWeightKg) : undefined,
        },
      });
      setOpen(false);
      setRegistrationNo("");
      setLabel("");
      setType("MOTORCYCLE");
      setMaxWeightKg("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function setStatus(id: string, status: VehicleStatus) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/vehicles/${id}/status`, {
        method: "POST",
        json: { status },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fleet"
        subtitle="Vehicles available for dispatch and driver assignment."
        actions={
          canManage ? (
            <Button onClick={() => setOpen(true)}>Add vehicle</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "vehicle", title: "Vehicle" },
          { key: "type", title: "Type" },
          { key: "capacity", title: "Capacity" },
          { key: "drivers", title: "Assigned" },
          { key: "status", title: "Status" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No vehicles yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          vehicle: (
            <TablePrimaryCell
              primary={row.registrationNo}
              secondary={row.label ?? undefined}
            />
          ),
          type: row.type,
          capacity:
            row.maxWeightKg != null ? `${Number(row.maxWeightKg)} kg` : "—",
          drivers:
            row.drivers && row.drivers.length > 0
              ? row.drivers.map((d) => d.fullName).join(", ")
              : "—",
          status: (
            <TableBadge tone={STATUS_TONES[row.status]}>
              {row.status}
            </TableBadge>
          ),
          actions: canManage ? (
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.filter((s) => s !== row.status).map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => setStatus(row.id, status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          ) : (
            "—"
          ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add vehicle"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !registrationNo}
              onClick={createVehicle}
            >
              {pending ? "Saving…" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={regId} label="Registration number">
            <TextInput
              id={regId}
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="RAD 101 A"
              required
            />
          </FormField>
          <FormField id={labelId} label="Label">
            <TextInput
              id={labelId}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Moto — Kacyiru"
            />
          </FormField>
          <FormField id={typeId} label="Type">
            <SelectInput
              id={typeId}
              value={type}
              onChange={(e) => setType(e.target.value as VehicleType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField id={weightId} label="Max weight (kg)">
            <TextInput
              id={weightId}
              type="number"
              min="0"
              value={maxWeightKg}
              onChange={(e) => setMaxWeightKg(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
