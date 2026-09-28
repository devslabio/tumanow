"use client";

import Link from "next/link";

import { DemoAccountsHint } from "@/components/auth/DemoAccountsHint";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title={
        <>
          Log in to{" "}
          <span className="font-bold text-[var(--tn-primary)]">TumaNow</span>
        </>
      }
      subtitle="Courier & delivery platform — your menu depends on role and permissions."
    >
      <LoginForm />
      <p className="mt-6 text-center text-sm text-[var(--tn-muted)]">
        New here?{" "}
        <Link href="/register" className="font-semibold text-[var(--tn-primary)]">
          Create an account
        </Link>
      </p>
      <DemoAccountsHint />
    </AuthLayout>
  );
}
