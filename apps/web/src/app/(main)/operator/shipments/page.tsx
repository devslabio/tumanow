"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TablePrimaryCell } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";
import {
  shipmentStatusBadgeClass,
  shipmentStatusLabel,
} from "@/lib/shipment-status";

type DriverOption = {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  vehicleId?: string | null;
  vehicle?: {
    id: string;
    registrationNo: string;
    label: string | null;
  } | null;
};

type VehicleOption = {
  id: string;
  registrationNo: string;
  label: string | null;
  status: string;
  type: string;
};

type ShipmentRow = {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  finalPrice: string | number | null;
  quotedPrice: string | number | null;
  isCod?: boolean;
  codStatus?: string;
  codAmount?: string | number | null;
  customer?: { fullName?: string | null; phone?: string | null };
  driver?: { id: string; fullName: string } | null;
  vehicle?: { id: string; registrationNo: string; label: string | null } | null;
};

const STATUS_OPTIONS = [
  "APPROVED",
  "REJECTED",
  "AWAITING_PAYMENT",
  "PAID",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "RETURNED",
];

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return `${Number(v).toLocaleString()} RWF`;
}

export default function OperatorShipmentsPage() {
  const session = useClientSession();
  const canApprove = hasPermission(session, "orders.approve");
  const canAssign = hasPermission(session, "orders.assign");
  const canUpdateStatus = hasPermission(session, "orders.update_status");
  const canSettle = hasPermission(session, "payments.manage");

  const driverSelectId = useId();
  const vehicleSelectId = useId();
  const statusSelectId = useId();
  const otpId = useId();
  const recipientId = useId();
  const filterId = useId();

  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "cod" | "pending">("all");

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [nextStatus, setNextStatus] = useState("PICKED_UP");
  const [otp, setOtp] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const load = useCallback(async () => {
    const data = await api<ShipmentRow[]>("/tenant/shipments");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load shipments"),
    );
    if (canAssign) {
      Promise.all([
        api<DriverOption[]>("/tenant/drivers"),
        api<VehicleOption[]>("/tenant/vehicles").catch(() => []),
      ])
        .then(([d, v]) => {
          setDrivers(d);
          setVehicles(v.filter((x) => x.status !== "RETIRED"));
        })
        .catch(() => undefined);
    }
  }, [load, canAssign]);

  const visible = useMemo(() => {
    if (filter === "cod") return rows.filter((r) => r.isCod);
    if (filter === "pending")
      return rows.filter((r) => r.status === "PENDING_OPERATOR_ACTION");
    return rows;
  }, [rows, filter]);

  async function runAction(
    id: string,
    action: () => Promise<unknown>,
    successMessage?: string,
  ) {
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      await action();
      if (successMessage) setInfo(successMessage);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  function openAssign(id: string) {
    setActiveId(id);
    const first = drivers[0];
    setDriverId(first?.id ?? "");
    setVehicleId(first?.vehicleId ?? first?.vehicle?.id ?? "");
    setAssignOpen(true);
  }

  function onDriverChange(id: string) {
    setDriverId(id);
    const d = drivers.find((x) => x.id === id);
    setVehicleId(d?.vehicleId ?? d?.vehicle?.id ?? "");
  }

  return (
    <div>
      <PageHeader
        title="Shipments"
        subtitle="Review, approve, assign, COD settle, and manage deliveries."
        actions={
          <div className="flex flex-wrap gap-2">
            <SelectInput
              id={filterId}
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "cod" | "pending")
              }
              className="min-h-9 w-auto min-w-[9rem]"
            >
              <option value="all">All</option>
              <option value="pending">Pending review</option>
              <option value="cod">COD only</option>
            </SelectInput>
          </div>
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}
      {info ? (
        <Card className="mb-4 text-sm text-[var(--tn-primary)]">{info}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "shipment", title: "Shipment" },
          { key: "route", title: "Route" },
          { key: "status", title: "Status" },
          { key: "pay", title: "Pay / COD" },
          { key: "dispatch", title: "Dispatch" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No shipments match this filter."
        rowKeys={visible.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={visible.map((row) => ({
          shipment: (
            <TablePrimaryCell
              primary={row.trackingNumber}
              secondary={
                row.customer?.fullName ?? row.customer?.phone ?? "Customer"
              }
            />
          ),
          route: (
            <span className="line-clamp-2 max-w-[14rem] text-xs text-[var(--tn-muted)] sm:max-w-[18rem]">
              {row.pickupAddress} → {row.deliveryAddress}
            </span>
          ),
          status: (
            <span className={`tn-badge ${shipmentStatusBadgeClass(row.status)}`}>
              {shipmentStatusLabel(row.status)}
            </span>
          ),
          pay: row.isCod ? (
            <span className="text-xs">
              COD {row.codStatus ?? "PENDING"}
              <br />
              <span className="tabular-nums text-[var(--tn-muted)]">
                {money(row.codAmount ?? row.finalPrice)}
              </span>
            </span>
          ) : (
            <span className="text-xs tabular-nums">{money(row.finalPrice ?? row.quotedPrice)}</span>
          ),
          dispatch: (
            <span className="text-xs text-[var(--tn-muted)]">
              {row.driver?.fullName ?? "—"}
              {row.vehicle ? (
                <>
                  <br />
                  {row.vehicle.registrationNo}
                </>
              ) : null}
            </span>
          ),
          actions: (
            <div className="flex max-w-[18rem] flex-wrap gap-1.5 sm:max-w-none">
              {canApprove && row.status === "PENDING_OPERATOR_ACTION" ? (
                <>
                  <Button
                    className="min-h-8 px-2.5 py-1 text-xs"
                    disabled={busyId === row.id}
                    onClick={() =>
                      runAction(row.id, () =>
                        api(`/tenant/shipments/${row.id}/approve`, {
                          method: "POST",
                        }),
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2.5 py-1 text-xs"
                    disabled={busyId === row.id}
                    onClick={() =>
                      runAction(row.id, () =>
                        api(`/tenant/shipments/${row.id}/reject`, {
                          method: "POST",
                          json: { note: "Rejected by operator" },
                        }),
                      )
                    }
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {canAssign &&
              ["APPROVED", "PAID", "ASSIGNED"].includes(row.status) ? (
                <Button
                  variant="secondary"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => openAssign(row.id)}
                >
                  Assign
                </Button>
              ) : null}
              {canUpdateStatus ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => {
                    setActiveId(row.id);
                    setNextStatus(
                      STATUS_OPTIONS.includes(row.status)
                        ? row.status
                        : "PICKED_UP",
                    );
                    setStatusOpen(true);
                  }}
                >
                  Status
                </Button>
              ) : null}
              {canUpdateStatus &&
              ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                row.status,
              ) ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() =>
                    runAction(
                      row.id,
                      async () => {
                        const res = await api<{ podOtpSentTo?: string }>(
                          `/tenant/shipments/${row.id}/pod/generate`,
                          { method: "POST" },
                        );
                        if (res?.podOtpSentTo) {
                          setInfo(`Delivery code sent to ${res.podOtpSentTo}`);
                        }
                      },
                      "Delivery code sent to recipient",
                    )
                  }
                >
                  POD
                </Button>
              ) : null}
              {canUpdateStatus &&
              row.status === "OUT_FOR_DELIVERY" ? (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => {
                    setActiveId(row.id);
                    setOtp("");
                    setRecipientName("");
                    setPodOpen(true);
                  }}
                >
                  Verify
                </Button>
              ) : null}
              {canUpdateStatus &&
              row.isCod &&
              row.codStatus === "PENDING" &&
              ["OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(
                row.status,
              ) ? (
                <Button
                  variant="secondary"
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() =>
                    runAction(
                      row.id,
                      () =>
                        api(`/tenant/shipments/${row.id}/cod/collect`, {
                          method: "POST",
                          json: {},
                        }),
                      "COD collected",
                    )
                  }
                >
                  Collect COD
                </Button>
              ) : null}
              {canSettle && row.isCod && row.codStatus === "COLLECTED" ? (
                <Button
                  className="min-h-8 px-2.5 py-1 text-xs"
                  disabled={busyId === row.id}
                  onClick={() =>
                    runAction(
                      row.id,
                      () =>
                        api(`/tenant/shipments/${row.id}/cod/settle`, {
                          method: "POST",
                          json: {},
                        }),
                      "COD settled",
                    )
                  }
                >
                  Settle COD
                </Button>
              ) : null}
            </div>
          ),
        }))}
      />

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign driver & vehicle"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!activeId || !driverId || busyId === activeId}
              onClick={() => {
                if (!activeId) return;
                void runAction(activeId, () =>
                  api(`/tenant/shipments/${activeId}/assign`, {
                    method: "POST",
                    json: {
                      driverId,
                      vehicleId: vehicleId || undefined,
                    },
                  }),
                ).then(() => setAssignOpen(false));
              }}
            >
              Assign
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={driverSelectId} label="Driver">
            <SelectInput
              id={driverSelectId}
              value={driverId}
              onChange={(e) => onDriverChange(e.target.value)}
            >
              {drivers.length === 0 ? (
                <option value="">No drivers available</option>
              ) : (
                drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.status})
                    {d.vehicle
                      ? ` · ${d.vehicle.registrationNo}`
                      : ""}
                  </option>
                ))
              )}
            </SelectInput>
          </FormField>
          <FormField id={vehicleSelectId} label="Vehicle">
            <SelectInput
              id={vehicleSelectId}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">No vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo}
                  {v.label ? ` · ${v.label}` : ""} ({v.status})
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update status"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!activeId || busyId === activeId}
              onClick={() => {
                if (!activeId) return;
                void runAction(activeId, () =>
                  api(`/tenant/shipments/${activeId}/status`, {
                    method: "POST",
                    json: { status: nextStatus },
                  }),
                ).then(() => setStatusOpen(false));
              }}
            >
              Update
            </Button>
          </div>
        }
      >
        <FormField id={statusSelectId} label="New status">
          <SelectInput
            id={statusSelectId}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {shipmentStatusLabel(s)}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </Modal>

      <Modal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        title="Verify POD"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPodOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!activeId || !otp || busyId === activeId}
              onClick={() => {
                if (!activeId) return;
                void runAction(activeId, () =>
                  api(`/tenant/shipments/${activeId}/pod/verify`, {
                    method: "POST",
                    json: {
                      otp,
                      recipientName: recipientName || undefined,
                    },
                  }),
                ).then(() => setPodOpen(false));
              }}
            >
              Verify
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={otpId} label="OTP">
            <TextInput
              id={otpId}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </FormField>
          <FormField id={recipientId} label="Recipient name">
            <TextInput
              id={recipientId}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
