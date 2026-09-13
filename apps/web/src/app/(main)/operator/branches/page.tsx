"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  TableBadge,
  TablePrimaryCell,
} from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SelectInput, TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type BranchRow = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  phone: string | null;
  addressLine1: string | null;
  status: string;
};

export default function OperatorBranchesPage() {
  const session = useClientSession();
  const canCreate = hasPermission(session, "branch.create");
  const canUpdate = hasPermission(session, "branch.update");
  const codeId = useId();
  const nameId = useId();
  const cityId = useId();
  const phoneId = useId();
  const addressId = useId();
  const statusId = useId();

  const [rows, setRows] = useState<BranchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Kigali");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const load = useCallback(async () => {
    const data = await api<BranchRow[]>("/tenant/branches");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setCity("Kigali");
    setPhone("");
    setAddressLine1("");
    setStatus("ACTIVE");
    setOpen(true);
  }

  function openEdit(row: BranchRow) {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setCity(row.city ?? "");
    setPhone(row.phone ?? "");
    setAddressLine1(row.addressLine1 ?? "");
    setStatus(row.status);
    setOpen(true);
  }

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      code,
      name,
      city: city || undefined,
      phone: phone || undefined,
      addressLine1: addressLine1 || undefined,
      status: status as "ACTIVE" | "INACTIVE",
    };
    try {
      if (editing) {
        await api(`/tenant/branches/${editing.id}`, {
          method: "PATCH",
          json: payload,
        });
      } else {
        await api("/tenant/branches", { method: "POST", json: payload });
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Physical locations for this operator."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>Add branch</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "branch", title: "Branch" },
          { key: "city", title: "City" },
          { key: "contact", title: "Contact" },
          { key: "status", title: "Status" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No branches yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          branch: (
            <TablePrimaryCell
              primary={row.name}
              secondary={row.code}
            />
          ),
          city: row.city ?? "—",
          contact: row.phone ?? row.addressLine1 ?? "—",
          status: (
            <TableBadge
              tone={row.status === "ACTIVE" ? "success" : "neutral"}
            >
              {row.status}
            </TableBadge>
          ),
          actions: canUpdate ? (
            <Button
              variant="ghost"
              className="min-h-8 px-2.5 py-1 text-xs"
              onClick={() => openEdit(row)}
            >
              Edit
            </Button>
          ) : (
            "—"
          ),
        }))}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit branch" : "Add branch"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending || !code || !name} onClick={save}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={codeId} label="Code">
            <TextInput
              id={codeId}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={Boolean(editing)}
            />
          </FormField>
          <FormField id={nameId} label="Name">
            <TextInput
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField id={cityId} label="City">
            <TextInput
              id={cityId}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </FormField>
          <FormField id={phoneId} label="Phone">
            <TextInput
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <FormField id={addressId} label="Address">
            <TextInput
              id={addressId}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </FormField>
          {editing ? (
            <FormField id={statusId} label="Status">
              <SelectInput
                id={statusId}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </SelectInput>
            </FormField>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
