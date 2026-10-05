"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { filterNav, APP_NAV } from "@/config/shell-navigation";
import type { SessionSnapshot } from "@/lib/api";
import { cn } from "@/lib/cn";

export function AppSidebar({
  session,
  mobileOpen,
  onCloseMobile,
}: {
  session: SessionSnapshot;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const groups = filterNav(APP_NAV, session);

  const content = (
    <div className="flex h-full flex-col text-[var(--tn-sidebar-fg)]">
      <div className="flex items-center justify-between px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-[var(--tn-sidebar-fg)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tn-primary)] text-sm font-bold text-white">
            TN
          </span>
          <div>
            <p
              className="text-sm font-bold text-[var(--tn-sidebar-fg)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TumaNow
            </p>
            <p className="text-[11px] text-[var(--tn-sidebar-muted)]">
              {session.operatorName ?? session.roleName ?? "Delivery platform"}
            </p>
          </div>
        </Link>
        <button
          type="button"
          className="rounded p-1 text-[var(--tn-sidebar-muted)] hover:bg-white/10 hover:text-white md:hidden"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="nav-group-label mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        "nav-link flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active && "is-active",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 opacity-95" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] md:block">
        {content}
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu backdrop"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-50 w-[min(88vw,280px)] transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content}
      </aside>
    </>
  );
}
