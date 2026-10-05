"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, TableBadge, TablePrimaryCell } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "ACTIVE" | "REVOKED";
  lastUsedAt: string | null;
  createdAt: string;
};

export default function OperatorApiKeysPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "integrations.manage");
  const nameId = useId();

  const [rows, setRows] = useState<KeyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api<KeyRow[]>("/tenant/api-keys");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function create() {
    setPending(true);
    setError(null);
    try {
      const res = await api<{ key: string }>("/tenant/api-keys", {
        method: "POST",
        json: { name },
      });
      setCreatedKey(res.key);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/tenant/api-keys/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setBusyId(null);
    }
  }

  function closeModal() {
    setOpen(false);
    setCreatedKey(null);
    setName("");
  }

  return (
    <div>
      <PageHeader
        title="API keys"
        subtitle="Let your own systems call TumaNow directly, using your current permissions."
        actions={canManage ? <Button onClick={() => setOpen(true)}>Create API key</Button> : null}
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "name", title: "Name" },
          { key: "status", title: "Status" },
          { key: "lastUsed", title: "Last used" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="No API keys yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          name: <TablePrimaryCell primary={row.name} secondary={`${row.keyPrefix}…`} />,
          status: (
            <TableBadge tone={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status}</TableBadge>
          ),
          lastUsed: row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : "Never",
          actions:
            canManage && row.status === "ACTIVE" ? (
              <Button
                variant="ghost"
                className="min-h-8 px-2.5 py-1 text-xs text-[var(--tn-danger)]"
                disabled={busyId === row.id}
                onClick={() => revoke(row.id)}
              >
                Revoke
              </Button>
            ) : null,
        }))}
      />

      <Modal
        open={open}
        onClose={closeModal}
        title="Create API key"
        maxWidth="max-w-lg"
        footer={
          createdKey ? (
            <div className="flex justify-end">
              <Button onClick={closeModal}>Done</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button disabled={pending || !name} onClick={create}>
                {pending ? "Creating…" : "Create"}
              </Button>
            </div>
          )
        }
      >
        {createdKey ? (
          <div className="grid gap-3">
            <p className="text-sm text-[var(--tn-danger)]">
              This is the only time the full key is shown. Copy it now.
            </p>
            <Card className="break-all font-mono text-sm">{createdKey}</Card>
          </div>
        ) : (
          <FormField id={nameId} label="Name">
            <TextInput
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Warehouse system"
            />
          </FormField>
        )}
      </Modal>
    </div>
  );
}
