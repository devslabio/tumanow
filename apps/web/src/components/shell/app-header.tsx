"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { clearSession, type SessionSnapshot } from "@/lib/api";

export function AppHeader({
  session,
  onMenuClick,
}: {
  session: SessionSnapshot;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between gap-2 border-b border-[var(--tn-border-subtle)] bg-[color-mix(in_srgb,white_88%,var(--page-bg))] px-3 backdrop-blur-md sm:px-5 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 hover:bg-black/5 md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {session.fullName ?? session.email}
          </p>
          <p className="truncate text-xs text-[var(--tn-muted)]">
            {session.roleName ?? session.roleKey}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link href="/profile">
          <Button variant="ghost" className="min-h-9 px-3" aria-label="Profile">
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </Link>
        <Link href="/notifications">
          <Button
            variant="ghost"
            className="min-h-9 px-3"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="min-h-9 px-3"
          onClick={() => {
            clearSession();
            window.location.assign("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
