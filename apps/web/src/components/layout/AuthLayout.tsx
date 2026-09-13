"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { AuthHeroPanel } from "@/components/layout/AuthHeroPanel";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="auth-page flex min-h-dvh w-full flex-col lg:flex-row">
      {/* Form column — sacco-style ~40% / min 500px */}
      <section className="auth-login-section flex w-full min-h-dvh flex-col items-center bg-white px-5 py-8 sm:px-8 lg:w-[42%] lg:min-w-[520px] lg:max-w-[640px] lg:px-10 lg:py-10">
        <div className="flex w-full max-w-[480px] flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center py-6">
            <div className="mb-8 text-center sm:mb-10">
              <Link href="/" className="inline-flex flex-col items-center gap-3">
                <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-[var(--tn-primary)] text-[1.65rem] font-bold text-white shadow-[0_10px_28px_rgba(232,93,4,0.28)]">
                  TN
                </span>
                <span
                  className="text-base font-semibold tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  TumaNow
                </span>
              </Link>
            </div>

            <h1
              className="mb-2 text-center text-[1.75rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.9rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mb-8 text-center text-[0.95rem] leading-relaxed text-[var(--tn-muted)]">
                {subtitle}
              </p>
            ) : null}

            {children}
          </div>

          <footer className="shrink-0 pt-8 pb-2 text-left text-[0.85rem] leading-relaxed text-[var(--tn-muted)]">
            <p>© {new Date().getFullYear()} TumaNow</p>
            <p className="mt-0.5 text-[0.8rem] text-[var(--tn-muted)]/80">
              Courier & delivery platform
            </p>
          </footer>
        </div>
      </section>

      {/* Cover image — remaining width, full height */}
      <section className="auth-hero-section relative hidden min-h-0 flex-1 overflow-hidden lg:block">
        <AuthHeroPanel />
      </section>
    </div>
  );
}
