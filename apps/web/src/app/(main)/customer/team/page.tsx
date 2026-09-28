"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { api } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type MemberRow = {
  membershipId: string | null;
  userId: string;
  email: string;
  fullName?: string | null;
  role: "OWNER" | "MEMBER";
};

export default function CustomerTeamPage() {
  const session = useClientSession();
  const isBusiness = session?.customerType === "BUSINESS";
  const isOwner = isBusiness && session?.customerRole === "OWNER";
  const emailId = useId();

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const data = await api<MemberRow[]>("/customer/team");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function add() {
    setPending(true);
    setError(null);
    try {
      await api("/customer/team", { method: "POST", json: { email } });
      setOpen(false);
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setPending(false);
    }
  }

  async function remove(membershipId: string) {
    setBusyId(membershipId);
    setError(null);
    try {
      await api(`/customer/team/${membershipId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="People who can create and view shipments on your company's account."
        actions={isOwner ? <Button onClick={() => setOpen(true)}>Add teammate</Button> : null}
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}
      {!isBusiness ? (
        <Card className="mb-4 text-sm text-[var(--tn-muted)]">
          Teams are for business accounts. Register a company account to invite teammates.
        </Card>
      ) : null}

      <DataTable
        columns={[
          { key: "person", title: "Person" },
          { key: "role", title: "Role" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="Just you, for now."
        rowKeys={rows.map((r) => r.membershipId ?? r.userId)}
        rows={rows.map((row) => ({
          person: <TablePrimaryCell primary={row.fullName ?? row.email} secondary={row.email} />,
          role: <TableBadge tone={row.role === "OWNER" ? "success" : "neutral"}>{row.role}</TableBadge>,
          actions:
            isOwner && row.membershipId ? (
              <Button
                variant="ghost"
                className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                disabled={busyId === row.membershipId}
                onClick={() => remove(row.membershipId!)}
              >
                Remove
              </Button>
            ) : null,
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add teammate"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !email} onClick={add}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </div>
        }
      >
        <FormField id={emailId} label="Their TumaNow account email">
          <TextInput
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
          />
        </FormField>
        <p className="mt-2 text-xs text-[var(--tn-muted)]">
          They need to already have a TumaNow account — ask them to register first if they don't.
        </p>
      </Modal>
    </div>
  );
}
