"use client";

import { type FormEvent, useId, useState } from "react";
import { Briefcase, Building2, Lock, Mail, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  PasswordToggleButton,
  SelectInput,
  TextInput,
} from "@/components/ui/TextInput";
import { API_BASE, isCustomerUser, setSession } from "@/lib/api";

type RegisterResponse = {
  accessToken?: string;
  user?: { id: string; email: string; fullName?: string | null };
  roleKey?: string;
  roleName?: string;
  platformRoleKeys?: string[];
  permissionCodes?: string[];
  customerId?: string;
  isCustomer?: boolean;
  customerRole?: "OWNER" | "MEMBER";
  customerType?: "INDIVIDUAL" | "BUSINESS";
  message?: string | string[];
};

export function RegisterForm() {
  const fullNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const accountTypeId = useId();
  const companyNameId = useId();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phone || undefined,
          accountType,
          companyName: accountType === "BUSINESS" ? companyName : undefined,
        }),
      });

      let data: RegisterResponse = {};
      try {
        data = (await res.json()) as RegisterResponse;
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = data.message;
        throw new Error(
          Array.isArray(msg) ? msg.join(", ") : msg || `Registration failed (${res.status})`,
        );
      }

      if (!data.accessToken || !data.user) {
        throw new Error("Unexpected registration response");
      }

      const snapshot = {
        userId: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        roleKey: data.roleKey,
        roleName: data.roleName,
        permissionCodes: data.permissionCodes,
        platformRoleKeys: data.platformRoleKeys,
        customerId: data.customerId,
        isCustomer: data.isCustomer,
        customerRole: data.customerRole,
        customerType: data.customerType,
      };

      setSession(data.accessToken, snapshot);
      window.location.assign(isCustomerUser(snapshot) ? "/customer/dashboard" : "/dashboard");
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

      <FormField id={accountTypeId} label="Account type">
        <SelectInput
          id={accountTypeId}
          startIcon={Briefcase}
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as "INDIVIDUAL" | "BUSINESS")}
          disabled={pending}
        >
          <option value="INDIVIDUAL">Individual</option>
          <option value="BUSINESS">Business</option>
        </SelectInput>
      </FormField>

      {accountType === "BUSINESS" ? (
        <FormField id={companyNameId} label="Company name">
          <TextInput
            id={companyNameId}
            type="text"
            placeholder="Acme Logistics Ltd"
            startIcon={Building2}
            value={companyName}
            onChange={(ev) => setCompanyName(ev.target.value)}
            disabled={pending}
            required
          />
        </FormField>
      ) : null}

      <FormField id={fullNameId} label="Full name">
        <TextInput
          id={fullNameId}
          type="text"
          autoComplete="name"
          placeholder="Jane Uwase"
          startIcon={User}
          value={fullName}
          onChange={(ev) => setFullName(ev.target.value)}
          disabled={pending}
          required
        />
      </FormField>

      <FormField id={emailId} label="Email">
        <TextInput
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          startIcon={Mail}
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          disabled={pending}
          required
        />
      </FormField>

      <FormField id={phoneId} label="Phone (optional)">
        <TextInput
          id={phoneId}
          type="tel"
          autoComplete="tel"
          placeholder="+250788123456"
          startIcon={Phone}
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
          disabled={pending}
        />
      </FormField>

      <FormField id={passwordId} label="Password">
        <TextInput
          id={passwordId}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          startIcon={Lock}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          disabled={pending}
          minLength={8}
          required
          endAdornment={
            <PasswordToggleButton
              visible={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
          }
        />
      </FormField>

      <Button type="submit" className="mt-3 w-full min-h-12 py-3.5 text-base font-semibold" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
