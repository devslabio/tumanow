"use client";

import { useEffect, useState } from "react";

import { getSession, type SessionSnapshot } from "@/lib/api";

/**
 * Read the localStorage session after mount only.
 * Calling getSession() during render breaks hydration (null on server, real on client).
 */
export function useClientSession(): SessionSnapshot | null {
  const [session, setSession] = useState<SessionSnapshot | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  return session;
}
