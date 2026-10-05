"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import {
  api,
  getSession,
  getToken,
  setSession,
  type SessionSnapshot,
} from "@/lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
  };
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
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSessionState] = useState<SessionSnapshot | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSessionState(s);

    api<MeResponse>("/auth/me")
      .then((data) => {
        const token = getToken();
        if (!token) return;
        const next: SessionSnapshot = {
          ...s,
          userId: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          phone: data.user.phone,
          roleKey: data.roleKey ?? s.roleKey,
          roleName: data.roleName ?? s.roleName,
          permissionCodes: data.permissionCodes ?? s.permissionCodes,
          platformRoleKeys: data.platformRoleKeys ?? s.platformRoleKeys,
          operatorId: data.operatorId ?? s.operatorId,
          operatorName: data.operatorName ?? s.operatorName,
          membershipId: data.membershipId ?? s.membershipId,
          accessScope: data.accessScope ?? s.accessScope,
          branchIds: data.branchIds ?? s.branchIds,
          customerId: data.customerId ?? s.customerId,
          isCustomer: data.isCustomer ?? s.isCustomer,
        };
        setSession(token, next);
        setSessionState(next);
      })
      .catch(() => {
        /* keep local session */
      });
  }, [router]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--tn-muted)]">
        Loading…
      </div>
    );
  }

  return <AppShell session={session}>{children}</AppShell>;
}
