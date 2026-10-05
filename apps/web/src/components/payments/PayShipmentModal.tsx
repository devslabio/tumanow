"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api } from "@/lib/api";

const METHODS = [
  { value: "MTN_MOMO", label: "MTN Mobile Money" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "CARD", label: "Card" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  shipmentId: string;
  trackingNumber: string;
  amountLabel: string;
  defaultPhone?: string | null;
  onPaid: () => void;
};

export function PayShipmentModal({
  open,
  onClose,
  shipmentId,
  trackingNumber,
  amountLabel,
  defaultPhone,
  onPaid,
}: Props) {
  const methodId = useId();
  const phoneId = useId();
  const [method, setMethod] = useState<string>("MTN_MOMO");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      await api(`/customer/shipments/${shipmentId}/pay`, {
        method: "POST",
        json: {
          method,
          payerPhone:
            method === "MTN_MOMO" || method === "AIRTEL_MONEY"
              ? phone || undefined
              : undefined,
        },
      });
      onPaid();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pay ${trackingNumber}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Processing…" : `Pay ${amountLabel}`}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-[var(--tn-muted)]">
        Sandbox payments initiate with your provider, then auto-confirm so you
        can continue the delivery flow.
      </p>
      {error ? (
        <p className="mb-3 text-sm text-[var(--tn-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="space-y-4">
        <FormField id={methodId} label="Payment method">
          <SelectInput
            id={methodId}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
        {method === "MTN_MOMO" || method === "AIRTEL_MONEY" ? (
          <FormField id={phoneId} label="Mobile money phone">
            <TextInput
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2507…"
            />
          </FormField>
        ) : null}
      </div>
    </Modal>
  );
}
