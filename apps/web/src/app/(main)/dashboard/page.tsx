"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  getSession,
  isCustomerUser,
  isOperatorUser,
  isPlatformUser,
} from "@/lib/api";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (isPlatformUser(session) && !isOperatorUser(session)) {
      router.replace("/platform/dashboard");
      return;
    }
    if (isOperatorUser(session)) {
      router.replace("/operator/dashboard");
      return;
    }
    if (isCustomerUser(session)) {
      router.replace("/customer/dashboard");
      return;
    }
    router.replace("/track");
  }, [router]);

  return null;
}
