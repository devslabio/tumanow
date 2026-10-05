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
import { TextInput } from "@/components/ui/TextInput";
import { api, hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

type PackageTypeRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxWeightKg: string | number | null;
  isFragile: boolean;
  isPerishable: boolean;
  isActive: boolean;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  maxWeightKg: string;
  isFragile: boolean;
  isPerishable: boolean;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  maxWeightKg: "",
  isFragile: false,
  isPerishable: false,
  isActive: true,
};

export default function OperatorPackageTypesPage() {
  const session = useClientSession();
  const canManage = hasPermission(session, "package_type.manage");
  const codeId = useId();
  const nameId = useId();
  const descId = useId();
  const weightId = useId();

  const [rows, setRows] = useState<PackageTypeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PackageTypeRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const data = await api<PackageTypeRow[]>("/tenant/package-types");
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: PackageTypeRow) {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description ?? "",
      maxWeightKg: row.maxWeightKg != null ? String(row.maxWeightKg) : "",
      isFragile: row.isFragile,
      isPerishable: row.isPerishable,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      maxWeightKg: form.maxWeightKg ? Number(form.maxWeightKg) : undefined,
      isFragile: form.isFragile,
      isPerishable: form.isPerishable,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api(`/tenant/package-types/${editing.id}`, {
          method: "PATCH",
          json: payload,
        });
      } else {
        await api("/tenant/package-types", { method: "POST", json: payload });
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
        title="Package types"
        subtitle="Define parcel categories for pricing and matching."
        actions={
          canManage ? (
            <Button onClick={openCreate}>Add package type</Button>
          ) : null
        }
      />

      {error ? (
        <Card className="mb-4 text-sm text-[var(--tn-danger)]">{error}</Card>
      ) : null}

      <DataTable
        columns={[
          { key: "name", title: "Type" },
          { key: "weight", title: "Max kg" },
          { key: "flags", title: "Flags" },
          { key: "status", title: "Status" },
          { key: "actions", title: "Actions" },
        ]}
        emptyLabel="No package types yet."
        rowKeys={rows.map((r) => r.id)}
        stopPropagationOnCellKeys={["actions"]}
        rows={rows.map((row) => ({
          name: (
            <TablePrimaryCell primary={row.name} secondary={row.code} />
          ),
          weight: row.maxWeightKg != null ? String(row.maxWeightKg) : "—",
          flags: (
            <span className="text-xs text-[var(--tn-muted)]">
              {[
                row.isFragile ? "Fragile" : null,
                row.isPerishable ? "Perishable" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </span>
          ),
          status: (
            <TableBadge tone={row.isActive ? "success" : "neutral"}>
              {row.isActive ? "Active" : "Inactive"}
            </TableBadge>
          ),
          actions: canManage ? (
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
        title={editing ? "Edit package type" : "Add package type"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !form.code || !form.name}
              onClick={save}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField id={codeId} label="Code">
            <TextInput
              id={codeId}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </FormField>
          <FormField id={nameId} label="Name">
            <TextInput
              id={nameId}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField id={descId} label="Description">
            <TextInput
              id={descId}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </FormField>
          <FormField id={weightId} label="Max weight (kg)">
            <TextInput
              id={weightId}
              type="number"
              min="0"
              value={form.maxWeightKg}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxWeightKg: e.target.value }))
              }
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFragile}
              onChange={(e) =>
                setForm((f) => ({ ...f, isFragile: e.target.checked }))
              }
            />
            Fragile
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPerishable}
              onChange={(e) =>
                setForm((f) => ({ ...f, isPerishable: e.target.checked }))
              }
            />
            Perishable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
