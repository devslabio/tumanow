export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:3345/v1";

const TOKEN_KEY = "tumanow_access_token";
const SESSION_KEY = "tumanow_session";

export type SessionSnapshot = {
  userId?: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
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

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, session: SessionSnapshot) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function patchSession(partial: Partial<SessionSnapshot>) {
  const current = getSession();
  const token = getToken();
  if (!current || !token) return;
  setSession(token, { ...current, ...partial });
}

export function getSession(): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function hasPermission(
  session: SessionSnapshot | null | undefined,
  code: string,
): boolean {
  if (!session) return false;
  if (session.platformRoleKeys?.includes("SUPER_ADMIN")) return true;
  return session.permissionCodes?.includes(code) ?? false;
}

export function isPlatformUser(session: SessionSnapshot | null | undefined) {
  if (!session) return false;
  return (
    session.platformRoleKeys?.some((k) => k !== "CUSTOMER") ||
    hasPermission(session, "platform.dashboard.view")
  );
}

export function isOperatorUser(session: SessionSnapshot | null | undefined) {
  return Boolean(session?.operatorId && session?.membershipId);
}

export function isCustomerUser(session: SessionSnapshot | null | undefined) {
  return Boolean(session?.isCustomer || session?.customerId);
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(err.message)) message = err.message.join(", ");
      else if (err.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
