import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

// Roles
export const ROLES = {
  PLATFORM: "PLATFORM",
  ADMIN: "ADMIN",
  PROVIDER: "PROVIDER",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Role-appropriate landing path after login / from /dashboard. */
export function roleHome(role: string): string {
  switch (role) {
    case ROLES.PLATFORM:
      return "/platform";
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.PROVIDER:
      return "/provider";
    default:
      return "/customer";
  }
}

type SessionUser = {
  id: string;
  role: string;
  tenantId?: string | null;
  salonId?: string | null;
};

/**
 * Page/layout guard. Returns the typed session user or redirects to /login
 * (or to a role-appropriate home if the role doesn't match).
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<NonNullable<Awaited<ReturnType<typeof getServerSession>>>["user"]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?from=" + encodeURIComponent(""));

  const role = (session.user as any).role as string;
  if (!allowedRoles.includes(role as Role)) {
    redirect("/"); // wrong role -> to default home
  }
  return session.user as SessionUser;
}

/**
 * API route guard. Returns the session user or a 401/403 NextResponse.
 */
export async function requireRoleApi(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      user: null,
      response: NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 }),
    };
  }
  const role = (session.user as any).role as string;
  if (!allowedRoles.includes(role as Role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 }),
    };
  }
  return { user: session.user as SessionUser, response: null };
}

/**
 * Build the Prisma `where` filter that enforces tenancy isolation.
 * - PLATFORM: no filter (sees everything).
 * - ADMIN: scoped to tenantId (sees all their salons).
 * - PROVIDER/CUSTOMER: scoped to salonId.
 */
export function tenantFilter(user: SessionUser): Record<string, string> {
  if (user.role === ROLES.PLATFORM) return {};
  if (user.role === ROLES.ADMIN && user.tenantId) return { tenantId: user.tenantId };
  if (user.salonId) return { salonId: user.salonId };
  return { salonId: "__none__" }; // denies everything if no salon bound
}

/** Resolve the active salon id for an ADMIN from query or their first salon. */
export function salonScope(user: SessionUser, requestedSalonId?: string) {
  if (user.role === ROLES.PLATFORM) return requestedSalonId ?? null;
  if (user.role === ROLES.ADMIN) return requestedSalonId ?? user.salonId ?? null;
  return user.salonId ?? null;
}
