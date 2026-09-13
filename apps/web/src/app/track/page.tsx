"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { API_BASE } from "@/lib/api";
import {
  shipmentStatusBadgeClass,
  shipmentStatusLabel,
} from "@/lib/shipment-status";

type TrackingResult = {
  trackingNumber: string;
  status: string;
  deliveryService: string;
  operatorName: string | null;
  pickupCity: string | null;
  deliveryCity: string | null;
  timeline: { status: string; note: string | null; at: string }[];
};

function TrackContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("number") ?? "TN-2026-00001234";
  const [trackingNumber, setTrackingNumber] = useState(initial);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function track(number = trackingNumber) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tracking/${encodeURIComponent(number)}`);
      if (!res.ok) throw new Error("Shipment not found");
      setResult((await res.json()) as TrackingResult);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Tracking failed");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initial) track(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tn-primary)] text-sm font-bold text-white">
              TN
            </span>
            <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
              TumaNow
            </span>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </div>

        <PageHeader
          title="Track shipment"
          subtitle="Enter a tracking number to see safe, non-sensitive shipment status."
        />

        <Card>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              track();
            }}
          >
            <TextInput
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="TN-2026-00001234"
              startIcon={Search}
            />
            <Button type="submit" disabled={pending} className="sm:min-w-[120px]">
              {pending ? "Searching…" : "Track"}
            </Button>
          </form>
        </Card>

        {error ? (
          <Card className="mt-4 text-sm text-[var(--tn-danger)]">{error}</Card>
        ) : null}

        {result ? (
          <Card className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">{result.trackingNumber}</p>
              <span className={`tn-badge ${shipmentStatusBadgeClass(result.status)}`}>
                {shipmentStatusLabel(result.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--tn-muted)]">
              {result.operatorName ?? "Operator"} · {result.pickupCity ?? "Pickup"} →{" "}
              {result.deliveryCity ?? "Delivery"}
            </p>

            <ol className="mt-6 space-y-4 border-l border-[var(--tn-border)] pl-4">
              {result.timeline.map((event, idx) => (
                <li key={`${event.at}-${idx}`} className="relative">
                  <span className="absolute -left-[1.33rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--tn-primary)]" />
                  <p className="text-sm font-medium">
                    {shipmentStatusLabel(event.status)}
                  </p>
                  {event.note ? (
                    <p className="text-xs text-[var(--tn-muted)]">{event.note}</p>
                  ) : null}
                  <p className="text-[11px] text-[var(--tn-muted)]">
                    {new Date(event.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--tn-muted)]">Loading…</div>}>
      <TrackContent />
    </Suspense>
  );
}
