"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PayShipmentModal } from "@/components/payments/PayShipmentModal";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";
import {
  shipmentStatusBadgeClass,
  shipmentStatusLabel,
} from "@/lib/shipment-status";

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
  operator?: { tradingName?: string | null; legalName?: string | null };
};

export default function CustomerShipmentsPage() {
  const session = useClientSession();
  const canPay =
    hasPermission(session, "customer.payments.pay") ||
    hasPermission(session, "customer.shipments.create");

  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<ShipmentRow | null>(null);

  const load = useCallback(async () => {
    const data = await api<ShipmentRow[]>("/customer/shipments");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  return (
    <div>
      <PageHeader
        title="My shipments"
        subtitle="Track and manage your delivery requests."
        actions={
          <Link href="/customer/new-shipment">
            <Button>New shipment</Button>
          </Link>
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No shipments yet"
          description="Create your first delivery request to get started."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/customer/shipments/${row.id}`}
                      className="font-semibold hover:underline"
                    >
                      {row.trackingNumber}
                    </Link>
                    <span
                      className={`tn-badge ${shipmentStatusBadgeClass(row.status)}`}
                    >
                      {shipmentStatusLabel(row.status)}
                    </span>
                    {row.isCod ? (
                      <span className="tn-badge tn-badge-warning">
                        COD {row.codStatus ?? "PENDING"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--tn-muted)]">
                    {row.pickupAddress} → {row.deliveryAddress}
                  </p>
                  <p className="mt-1 text-xs text-[var(--tn-muted)]">
                    {row.operator?.tradingName ??
                      row.operator?.legalName ??
                      "Operator"}{" "}
                    ·{" "}
                    {row.finalPrice != null || row.quotedPrice != null
                      ? `${Number(row.finalPrice ?? row.quotedPrice).toLocaleString()} RWF`
                      : "Price pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canPay &&
                  !row.isCod &&
                  ["AWAITING_PAYMENT", "APPROVED"].includes(row.status) ? (
                    <Button onClick={() => setPayTarget(row)}>Pay</Button>
                  ) : null}
                  <Link
                    href={`/track?number=${encodeURIComponent(row.trackingNumber)}`}
                  >
                    <Button variant="secondary">Track</Button>
                  </Link>
                  <Link href={`/customer/shipments/${row.id}`}>
                    <Button variant="ghost">Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {payTarget ? (
        <PayShipmentModal
          open={Boolean(payTarget)}
          onClose={() => setPayTarget(null)}
          shipmentId={payTarget.id}
          trackingNumber={payTarget.trackingNumber}
          amountLabel={`${Number(payTarget.finalPrice ?? payTarget.quotedPrice ?? 0).toLocaleString()} RWF`}
          defaultPhone={session?.phone}
          onPaid={() => {
            load().catch(() => undefined);
          }}
        />
      ) : null}
    </div>
  );
}
