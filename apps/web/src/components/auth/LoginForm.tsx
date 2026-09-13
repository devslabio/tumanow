"use client";

import { type FormEvent, useId, useState } from "react";
import { Building2, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  PasswordToggleButton,
  SelectInput,
  TextInput,
} from "@/components/ui/TextInput";
import {
  API_BASE,
  isCustomerUser,
  isOperatorUser,
  isPlatformUser,
  setSession,
} from "@/lib/api";

type LoginResponse = {
  accessToken?: string;
  requiresOperatorSelection?: boolean;
  operators?: { id: string; code: string; name: string; roleKey: string }[];
  user?: { id: string; email: string; fullName?: string | null };
  roleKey?: string;
  roleName?: string;
  permissionCodes?: string[];
  platformRoleKeys?: string[];
  operatorId?: string;
  operatorName?: string;
  membershipId?: string;
  accessScope?: "ALL_BRANCHES" | "SELECTED";
  branchIds?: string[];
  customerId?: string;
  isCustomer?: boolean;
  message?: string | string[];
};

function resolveLanding(session: LoginResponse) {
  const snapshot = {
    userId: session.user?.id,
    email: session.user?.email ?? "",
    fullName: session.user?.fullName,
    roleKey: session.roleKey,
    roleName: session.roleName,
    permissionCodes: session.permissionCodes,
    platformRoleKeys: session.platformRoleKeys,
    operatorId: session.operatorId,
    operatorName: session.operatorName,
    membershipId: session.membershipId,
    accessScope: session.accessScope,
    branchIds: session.branchIds,
    customerId: session.customerId,
    isCustomer: session.isCustomer,
  };

  if (isPlatformUser(snapshot) && !isOperatorUser(snapshot)) {
    return "/platform/dashboard";
  }
  if (isOperatorUser(snapshot)) {
    return "/operator/dashboard";
  }
  if (isCustomerUser(snapshot)) {
    return "/customer/dashboard";
  }
  return "/dashboard";
}

export function LoginForm() {
  const identifierId = useId();
  const passwordId = useId();
  const operatorIdField = useId();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [operatorId, setOperatorId] = useState("");
  const [operators, setOperators] = useState<LoginResponse["operators"]>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          operatorId: operatorId || undefined,
        }),
      });

      let data: LoginResponse = {};
      try {
        data = (await res.json()) as LoginResponse;
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = data.message;
        throw new Error(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || `Sign-in failed (${res.status})`,
        );
      }

      if (data.requiresOperatorSelection && data.operators) {
        setOperators(data.operators);
        return;
      }

      if (!data.accessToken || !data.user) {
        throw new Error("Unexpected login response");
      }

      const snapshot = {
        userId: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        roleKey: data.roleKey,
        roleName: data.roleName,
        permissionCodes: data.permissionCodes,
        platformRoleKeys: data.platformRoleKeys,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        membershipId: data.membershipId,
        accessScope: data.accessScope,
        branchIds: data.branchIds,
        customerId: data.customerId,
        isCustomer: data.isCustomer,
      };

      setSession(data.accessToken, snapshot);
      window.location.assign(resolveLanding(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot reach the API. Is it running on port 3345?",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error ? (
        <div
          className="mb-4 rounded-[var(--radius-field)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <FormField id={identifierId} label="Email or username">
        <TextInput
          id={identifierId}
          type="text"
          autoComplete="username"
          placeholder="you@example.com"
          startIcon={User}
          value={identifier}
          onChange={(ev) => setIdentifier(ev.target.value)}
          disabled={pending}
          required
        />
      </FormField>

      <FormField id={passwordId} label="Password">
        <TextInput
          id={passwordId}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Password"
          startIcon={Lock}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          disabled={pending}
          required
          endAdornment={
            <PasswordToggleButton
              visible={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
          }
        />
      </FormField>

      {operators?.length ? (
        <FormField id={operatorIdField} label="Operator">
          <SelectInput
            id={operatorIdField}
            startIcon={Building2}
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            disabled={pending}
            required
          >
            <option value="">Select operator…</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code})
              </option>
            ))}
          </SelectInput>
        </FormField>
      ) : null}

      <Button type="submit" className="mt-3 w-full min-h-12 py-3.5 text-base font-semibold" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
