"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api } from "@/lib/api";

type MatchOption = {
  operatorId: string;
  operatorCode: string;
  tradingName: string | null;
  legalName: string;
  currency: string;
  price: number;
  deliveryService: string;
};

const SERVICES = [
  "STANDARD",
  "EXPRESS",
  "SAME_DAY",
  "NEXT_DAY",
  "SCHEDULED",
  "INTERCITY",
];

export default function NewShipmentPage() {
  const router = useRouter();
  const pickupAddressId = useId();
  const pickupCityId = useId();
  const deliveryAddressId = useId();
  const deliveryCityId = useId();
  const weightId = useId();
  const distanceId = useId();
  const serviceId = useId();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [pickupAddress, setPickupAddress] = useState("Kacyiru");
  const [pickupCity, setPickupCity] = useState("Kigali");
  const [deliveryAddress, setDeliveryAddress] = useState("Remera");
  const [deliveryCity, setDeliveryCity] = useState("Kigali");

  const [weightKg, setWeightKg] = useState("1");
  const [isFragile, setIsFragile] = useState(false);
  const [deliveryService, setDeliveryService] = useState("STANDARD");
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState("5");

  const [options, setOptions] = useState<MatchOption[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [isCod, setIsCod] = useState(false);

  async function findOperators() {
    setPending(true);
    setError(null);
    try {
      const results = await api<MatchOption[]>("/customer/quotes/match", {
        method: "POST",
        json: {
          pickupCity,
          deliveryCity,
          weightKg: Number(weightKg) || 1,
          isFragile,
          deliveryService,
          estimatedDistanceKm: Number(estimatedDistanceKm) || 5,
        },
      });
      setOptions(results);
      setSelectedOperatorId(results[0]?.operatorId ?? "");
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Matching failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmShipment() {
    if (!selectedOperatorId) {
      setError("Select an operator");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const shipment = await api<{ trackingNumber: string; id: string }>(
        "/customer/shipments",
        {
          method: "POST",
          json: {
            operatorId: selectedOperatorId,
            pickupAddress,
            pickupCity,
            deliveryAddress,
            deliveryCity,
            deliveryService,
            estimatedDistanceKm: Number(estimatedDistanceKm) || 5,
            isCod,
            packages: [
              {
                description: "General parcel",
                quantity: 1,
                weightKg: Number(weightKg) || 1,
                isFragile,
              },
            ],
          },
        },
      );
      router.push(
        `/customer/shipments/${shipment.id}?tracking=${encodeURIComponent(shipment.trackingNumber)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create shipment");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New shipment"
        subtitle="Match operators with instant pricing, or request a custom quote."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`rounded-[var(--radius-field)] px-3 py-1 ${
              step === n
                ? "bg-[var(--tn-primary)] text-white"
                : step > n
                  ? "bg-[var(--tn-accent)] text-[#1a2332]"
                  : "bg-[var(--tn-field-bg)] text-[var(--tn-muted)]"
            }`}
          >
            Step {n}
          </span>
        ))}
      </div>

      <Card className="max-w-2xl">
        {error ? (
          <p className="mb-4 text-sm text-[var(--tn-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <FormField id={pickupAddressId} label="Pickup address">
              <TextInput
                id={pickupAddressId}
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
            <FormField id={deliveryAddressId} label="Delivery address">
              <TextInput
                id={deliveryAddressId}
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
            <div className="flex justify-end">
              <Button
                disabled={!pickupAddress || !deliveryAddress}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <FormField id={weightId} label="Weight (kg)">
              <TextInput
                id={weightId}
                type="number"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </FormField>
            <FormField id={distanceId} label="Estimated distance (km)">
              <TextInput
                id={distanceId}
                type="number"
                min="0"
                value={estimatedDistanceKm}
                onChange={(e) => setEstimatedDistanceKm(e.target.value)}
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
              />
              Fragile
            </label>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={pending} onClick={findOperators}>
                {pending ? "Matching…" : "Find operators"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {options.length === 0 ? (
              <p className="text-sm text-[var(--tn-muted)]">
                No operators cover this route with current settings. Try another
                city, or request a custom quotation.
              </p>
            ) : (
              <div className="space-y-2">
                {options.map((opt) => {
                  const selected = selectedOperatorId === opt.operatorId;
                  return (
                    <button
                      key={opt.operatorId}
                      type="button"
                      onClick={() => setSelectedOperatorId(opt.operatorId)}
                      className={`w-full rounded-[var(--radius-field)] border px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-[var(--tn-primary)] bg-[color-mix(in_srgb,var(--tn-primary)_8%,white)]"
                          : "border-[var(--tn-border)] hover:bg-[var(--tn-field-bg)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {opt.tradingName ?? opt.legalName}
                          </p>
                          <p className="text-xs text-[var(--tn-muted)]">
                            {opt.operatorCode} · {opt.deliveryService}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums">
                          {opt.price.toLocaleString()} {opt.currency}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/customer/quotations?rfq=1&pickup=${encodeURIComponent(pickupAddress)}&delivery=${encodeURIComponent(deliveryAddress)}&pickupCity=${encodeURIComponent(pickupCity)}&deliveryCity=${encodeURIComponent(deliveryCity)}`}
                >
                  <Button variant="secondary">Request RFQ instead</Button>
                </Link>
                <Button
                  disabled={!selectedOperatorId}
                  onClick={() => setStep(4)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-field)] bg-[var(--tn-field-bg)] p-4 text-sm">
              <p>
                <span className="text-[var(--tn-muted)]">Route:</span>{" "}
                {pickupAddress}, {pickupCity} → {deliveryAddress}, {deliveryCity}
              </p>
              <p className="mt-2">
                <span className="text-[var(--tn-muted)]">Package:</span>{" "}
                {weightKg} kg
                {isFragile ? " · Fragile" : ""} · {deliveryService} · ~
                {estimatedDistanceKm} km
              </p>
              <p className="mt-2">
                <span className="text-[var(--tn-muted)]">Operator:</span>{" "}
                {options.find((o) => o.operatorId === selectedOperatorId)
                  ?.tradingName ??
                  options.find((o) => o.operatorId === selectedOperatorId)
                    ?.legalName ??
                  "—"}
                {" · "}
                {options
                  .find((o) => o.operatorId === selectedOperatorId)
                  ?.price.toLocaleString() ?? "—"}{" "}
                RWF
              </p>
              <p className="mt-2">
                <span className="text-[var(--tn-muted)]">Payment:</span>{" "}
                {isCod ? "Cash on delivery (COD)" : "Pay after approval"}
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={isCod}
                onChange={(e) => setIsCod(e.target.checked)}
              />
              <span>
                <span className="font-medium">Cash on delivery</span>
                <span className="mt-0.5 block text-xs text-[var(--tn-muted)]">
                  Skip upfront payment — recipient pays when the package arrives.
                </span>
              </span>
            </label>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button disabled={pending} onClick={confirmShipment}>
                {pending ? "Creating…" : "Confirm shipment"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
