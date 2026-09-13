"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { api, getSession, patchSession } from "@/lib/api";

type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
};

export default function ProfilePage() {
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();

  // Empty defaults — do not seed from localStorage (SSR/client mismatch).
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Profile>("/auth/me")
      .then((me) => {
        setFullName(me.fullName ?? "");
        setPhone(me.phone ?? "");
        setEmail(me.email);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load profile"),
      );
  }, []);

  async function save() {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await api<Profile>("/auth/me", {
        method: "PATCH",
        json: {
          fullName: fullName || undefined,
          phone: phone || undefined,
        },
      });
      const current = getSession();
      if (current) {
        patchSession({
          fullName: updated.fullName,
          phone: updated.phone,
        });
      }
      setInfo("Profile updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Update your name and phone number."
      />

      <Card className="max-w-lg">
        {error ? (
          <p className="mb-4 text-sm text-[var(--tn-danger)]">{error}</p>
        ) : null}
        {info ? (
          <p className="mb-4 text-sm text-[var(--tn-primary)]">{info}</p>
        ) : null}

        <div className="space-y-4">
          <FormField id={emailId} label="Email">
            <TextInput id={emailId} value={email} disabled />
          </FormField>
          <FormField id={nameId} label="Full name">
            <TextInput
              id={nameId}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>
          <FormField id={phoneId} label="Phone">
            <TextInput
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={save}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
