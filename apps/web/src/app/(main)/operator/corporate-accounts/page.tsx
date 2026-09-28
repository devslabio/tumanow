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

type AccountRow = {
  id: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  creditLimit: string | number;
  currentBalance: string | number;
  currency: string;
  customer?: { companyName?: string | null; fullName?: string | null; email?: string | null };
};

type FoundCustomer = { id: string; companyName?: string | null; fullName?: string | null; email: string };

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

export default function OperatorCorporateAccountsPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "corporate.manage");
  const emailId = useId();
  const limitId = useId();

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [creditLimit, setCreditLimit] = useState("500000");
  const [found, setFound] = useState<FoundCustomer | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const data = await api<AccountRow[]>("/tenant/corporate-accounts");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  function resetModal() {
    setEmail("");
    setCreditLimit("500000");
    setFound(null);
    setSearchError(null);
  }

  async function search() {
    setSearching(true);
    setSearchError(null);
    setFound(null);
    try {
      const customer = await api<FoundCustomer>(
        `/tenant/corporate-accounts/search?email=${encodeURIComponent(email.trim())}`,
      );
      setFound(customer);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function create() {
    if (!found) return;
    setPending(true);
    setError(null);
    try {
      await api("/tenant/corporate-accounts", {
        method: "POST",
        json: { customerId: found.id, creditLimit: Number(creditLimit) || 0 },
      });
      setOpen(false);
      resetModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function toggleStatus(row: AccountRow) {
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/tenant/corporate-accounts/${row.id}/status`, {
        method: "PATCH",
        json: { status: row.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Corporate accounts"
        subtitle="Postpaid credit terms for business customers — they ship now, you invoice later."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                resetModal();
                setOpen(true);
              }}
            >
              Add corporate account
            </Button>
          ) : null
        }
      />

      {error ? <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card> : null}

      <DataTable
        columns={[
          { key: "company", title: "Company" },
          { key: "status", title: "Status" },
          { key: "balance", title: "Balance / limit" },
          { key: "actions", title: "" },
        ]}
        emptyLabel="No corporate accounts yet."
        rowKeys={rows.map((r) => r.id)}
        rows={rows.map((row) => ({
          company: (
            <TablePrimaryCell
              primary={row.customer?.companyName ?? row.customer?.fullName ?? "—"}
              secondary={row.customer?.email ?? undefined}
            />
          ),
          status: (
            <TableBadge tone={row.status === "ACTIVE" ? "success" : row.status === "SUSPENDED" ? "danger" : "neutral"}>
              {row.status}
            </TableBadge>
          ),
          balance: `${money(row.currentBalance)} / ${money(row.creditLimit)} ${row.currency}`,
          actions:
            canManage && row.status !== "PENDING" ? (
              <Button
                variant="ghost"
                className="min-h-8 px-2.5 py-1 text-xs"
                disabled={busyId === row.id}
                onClick={() => toggleStatus(row)}
              >
                {row.status === "ACTIVE" ? "Suspend" : "Activate"}
              </Button>
            ) : null,
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add corporate account"
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !found || !creditLimit} onClick={create}>
              {pending ? "Saving…" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <FormField id={emailId} label="Business customer's email">
            <div className="flex gap-2">
              <TextInput
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFound(null);
                }}
                placeholder="billing@acme.rw"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!email || searching}
                onClick={search}
              >
                {searching ? "…" : "Find"}
              </Button>
            </div>
          </FormField>

          {searchError ? (
            <p className="text-sm text-[var(--tn-danger)]">{searchError}</p>
          ) : null}
          {found ? (
            <Card className="text-sm">
              Found: <strong>{found.companyName ?? found.fullName}</strong> ({found.email})
            </Card>
          ) : null}

          <FormField id={limitId} label="Credit limit (RWF)">
            <TextInput
              id={limitId}
              type="number"
              min="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
