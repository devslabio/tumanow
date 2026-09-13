"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import type { SessionSnapshot } from "@/lib/api";

export function AppShell({
  session,
  children,
}: {
  session: SessionSnapshot;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-[var(--page-bg)] text-[var(--foreground)]">
      <AppSidebar
        session={session}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-h-dvh min-w-0 flex-col md:pl-[var(--sidebar-width)]">
        <AppHeader
          session={session}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
