"use client";

import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title={
        <>
          Create your{" "}
          <span className="font-bold text-[var(--tn-primary)]">TumaNow</span>{" "}
          account
        </>
      }
      subtitle="Ship as an individual, or register your company for team access and postpaid billing."
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-[var(--tn-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--tn-primary)]">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
