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

type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "SUSPENDED";

type VehicleOption = {
  id: string;
  registrationNo: string;
  label: string | null;
  status: string;
};

type DriverRow = {
  id: string;
  fullName: string;
  phone: string;
  licenseNo: string | null;
  status: DriverStatus;
  vehicleId?: string | null;
  branch?: { name: string; code: string } | null;
  vehicle?: {
    id: string;
    registrationNo: string;
    label: string | null;
    type: string;
    status: string;
  } | null;
};

const STATUS_TONES: Record<
  DriverStatus,
  "success" | "warning" | "neutral" | "danger"
> = {
  AVAILABLE: "success",
  BUSY: "warning",
  OFFLINE: "neutral",
  SUSPENDED: "danger",
};

const STATUS_OPTIONS: DriverStatus[] = [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
  "SUSPENDED",
];

export default function OperatorDriversPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "drivers.manage");
  const nameId = useId();
  const phoneId = useId();
  const licenseId = useId();
  const vehicleIdField = useId();
  const assignVehicleId = useId();

  const [rows, setRows] = useState<DriverRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState<string | null>(null);
  const [assignVehicle, setAssignVehicle] = useState("");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const load = useCallback(async () => {
    const [drivers, fleet] = await Promise.all([
      api<DriverRow[]>("/tenant/drivers"),
      api<VehicleOption[]>("/tenant/vehicles").catch(() => []),
    ]);
    setRows(drivers);
    setVehicles(fleet);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load drivers"),
    );
  }, [load]);

  async function createDriver() {
    setPending(true);
    setError(null);
    try {
      await api("/tenant/drivers", {
        method: "POST",
        json: {
          fullName,
          phone,
          licenseNo: licenseNo || undefined,
          vehicleId: vehicleId || undefined,
        },
      });
      setOpen(false);
      setFullName("");
      setPhone("");
      setLicenseNo("");
      setVehicleId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function setStatus(id: string, status: DriverStatus) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/drivers/${id}/status`, {
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

  async function saveVehicleAssign() {
    if (!assignDriverId) return;
    setPending(true);
    setError(null);
    try {
      await api(`/tenant/drivers/${assignDriverId}/vehicle`, {
        method: "POST",
        json: { vehicleId: assignVehicle || null },
      });
      setAssignOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vehicle assign failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Manage driver profiles, availability, and assigned vehicles."
        actions={
          canManage ? (
            <Button onClick={() => setOpen(true)}>Add driver</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "driver", title: "Driver" },
          { key: "vehicle", title: "Vehicle" },
          { key: "license", title: "License" },
          { key: "status", title: "Status" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No drivers yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          driver: (
            <TablePrimaryCell primary={row.fullName} secondary={row.phone} />
          ),
          vehicle: row.vehicle ? (
            <TablePrimaryCell
              primary={row.vehicle.registrationNo}
              secondary={row.vehicle.label ?? row.vehicle.type}
            />
          ) : (
            "—"
          ),
          license: row.licenseNo ?? "—",
          status: (
            <TableBadge tone={STATUS_TONES[row.status]}>
              {row.status}
            </TableBadge>
          ),
          actions: canManage ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="secondary"
                className="min-h-8 px-2.5 py-1 text-xs"
                disabled={busyId === row.id}
                onClick={() => {
                  setAssignDriverId(row.id);
                  setAssignVehicle(row.vehicleId ?? row.vehicle?.id ?? "");
                  setAssignOpen(true);
                }}
              >
                Vehicle
              </Button>
              {STATUS_OPTIONS.filter((s) => s !== row.status).map((status) => (
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
        title="Add driver"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !fullName || !phone}
              onClick={createDriver}
            >
              {pending ? "Saving…" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={nameId} label="Full name">
            <TextInput
              id={nameId}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </FormField>
          <FormField id={phoneId} label="Phone">
            <TextInput
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </FormField>
          <FormField id={licenseId} label="License number">
            <TextInput
              id={licenseId}
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
            />
          </FormField>
          <FormField id={vehicleIdField} label="Vehicle">
            <SelectInput
              id={vehicleIdField}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo}
                  {v.label ? ` · ${v.label}` : ""}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign vehicle"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending} onClick={saveVehicleAssign}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <FormField id={assignVehicleId} label="Vehicle">
          <SelectInput
            id={assignVehicleId}
            value={assignVehicle}
            onChange={(e) => setAssignVehicle(e.target.value)}
          >
            <option value="">Unassigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNo}
                {v.label ? ` · ${v.label}` : ""} ({v.status})
              </option>
            ))}
          </SelectInput>
        </FormField>
      </Modal>
    </div>
  );
}
