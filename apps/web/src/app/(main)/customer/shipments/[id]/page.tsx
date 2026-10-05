"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PayShipmentModal } from "@/components/payments/PayShipmentModal";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/primitives";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";
import {
  shipmentStatusBadgeClass,
  shipmentStatusLabel,
} from "@/lib/shipment-status";

type ShipmentDetail = {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity: string | null;
  deliveryCity: string | null;
  finalPrice: string | number | null;
  quotedPrice: string | number | null;
  deliveryService: string;
  createdAt: string;
  isCod?: boolean;
  codStatus?: string;
  codAmount?: string | number | null;
  operator?: { tradingName?: string | null; legalName?: string | null };
  packages?: Array<{
    description: string | null;
    weightKg: string | number | null;
    isFragile: boolean;
    quantity: number;
  }>;
  events?: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
};

type PaymentRow = {
  id: string;
  method: string;
  status: string;
  amount: string | number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
};

export default function CustomerShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const session = useClientSession();
  const canPay =
    hasPermission(session, "customer.payments.pay") ||
    hasPermission(session, "customer.shipments.create");

  const [row, setRow] = useState<ShipmentDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    const [data, pays] = await Promise.all([
      api<ShipmentDetail>(`/customer/shipments/${params.id}`),
      api<PaymentRow[]>(`/customer/payments?shipmentId=${params.id}`).catch(
        () => [] as PaymentRow[],
      ),
    ]);
    setRow(data);
    setPayments(pays);
  }, [params.id]);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  const amountLabel = row
    ? `${Number(row.finalPrice ?? row.quotedPrice ?? 0).toLocaleString()} RWF`
    : "";

  return (
    <div>
      <PageHeader
        title={row?.trackingNumber ?? "Shipment"}
        subtitle="Shipment details, payment, and timeline."
        actions={
          <div className="flex flex-wrap gap-2">
            {row ? (
              <Link
                href={`/track?number=${encodeURIComponent(row.trackingNumber)}`}
              >
                <Button variant="secondary">Track</Button>
              </Link>
            ) : null}
            <Link href="/customer/shipments">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      {!row ? (
        <Card className="text-sm text-[var(--tn-muted)]">Loading…</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="text-sm text-[var(--tn-muted)]">
                {row.deliveryService}
              </span>
            </div>
            <p className="mt-3 text-sm">
              {row.pickupAddress}
              {row.pickupCity ? `, ${row.pickupCity}` : ""} →{" "}
              {row.deliveryAddress}
              {row.deliveryCity ? `, ${row.deliveryCity}` : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--tn-muted)]">
              {row.operator?.tradingName ?? row.operator?.legalName ?? "Operator"}
            </p>
            <p className="mt-2 font-semibold">{amountLabel || "Price pending"}</p>
            {row.isCod ? (
              <p className="mt-2 text-sm text-[var(--tn-muted)]">
                Pay cash on delivery
                {row.codAmount != null
                  ? ` · ${Number(row.codAmount).toLocaleString()} RWF`
                  : ""}
              </p>
            ) : null}
            {canPay &&
            !row.isCod &&
            ["AWAITING_PAYMENT", "APPROVED"].includes(row.status) ? (
              <Button className="mt-4" onClick={() => setPayOpen(true)}>
                Pay now
              </Button>
            ) : null}
          </Card>

          <Card>
            <p className="text-sm font-semibold">Packages</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(row.packages ?? []).map((pkg, i) => (
                <li key={i} className="text-[var(--tn-muted)]">
                  {pkg.description ?? "Parcel"} · qty {pkg.quantity}
                  {pkg.weightKg != null ? ` · ${pkg.weightKg} kg` : ""}
                  {pkg.isFragile ? " · Fragile" : ""}
                </li>
              ))}
              {(row.packages ?? []).length === 0 ? (
                <li className="text-[var(--tn-muted)]">No package details</li>
              ) : null}
            </ul>

            {payments.length > 0 ? (
              <div className="mt-5 border-t border-[var(--tn-border)] pt-4">
                <p className="text-sm font-semibold">Payments</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="text-[var(--tn-muted)]">
                      {p.method.replace(/_/g, " ")} · {p.status} ·{" "}
                      {Number(p.amount).toLocaleString()} RWF
                      {p.reference ? ` · ${p.reference}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {row.events && row.events.length > 0 ? (
            <Card className="lg:col-span-2">
              <p className="text-sm font-semibold">Timeline</p>
              <ul className="mt-3 space-y-2">
                {row.events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--tn-border)] pb-2 text-sm last:border-0"
                  >
                    <span>
                      {shipmentStatusLabel(ev.status)}
                      {ev.note ? (
                        <span className="text-[var(--tn-muted)]">
                          {" "}
                          — {ev.note}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-[var(--tn-muted)]">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}

      {row ? (
        <PayShipmentModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          shipmentId={row.id}
          trackingNumber={row.trackingNumber}
          amountLabel={amountLabel}
          defaultPhone={session?.phone}
          onPaid={() => {
            load().catch(() => undefined);
          }}
        />
      ) : null}
    </div>
  );
}
