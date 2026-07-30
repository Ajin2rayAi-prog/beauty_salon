import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { getSalonEntitlements, type FeatureKey } from "./entitlements";

export const ACTIVE_SALON_COOKIE = "active_salon";

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
  name?: string | null;
  email?: string | null;
  role: string;
  avatar?: string | null;
  tenantId?: string | null;
  salonId?: string | null;
};

/**
 * Page/layout guard. Returns the typed session user or redirects to /login
 * (or to a role-appropriate home if the role doesn't match).
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<SessionUser> {
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

/**
 * Feature guard for pages/layouts. Redirects to the salon's admin home with a
 * `?blocked=<key>` flag when the feature is off for that salon (or the license
 * is invalid). PLATFORM bypasses gating.
 */
export async function requireFeature(
  salonId: string | null | undefined,
  key: FeatureKey,
  redirectTo = "/admin"
): Promise<void> {
  if (!salonId) redirect(redirectTo);
  const ent = await getSalonEntitlements(salonId!);
  if (!ent.features[key]) redirect(`${redirectTo}?blocked=${key}`);
}

/** Feature guard for API routes. Returns a 403 response when the feature is off. */
export async function assertFeatureApi(salonId: string | null | undefined, key: FeatureKey) {
  if (!salonId) {
    return { ok: false as const, response: NextResponse.json({ error: "سالن نامعتبر" }, { status: 400 }) };
  }
  const ent = await getSalonEntitlements(salonId);
  if (!ent.features[key]) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "این قابلیت برای سالن شما فعال نیست" }, { status: 403 }),
    };
  }
  return { ok: true as const, response: null };
}

/**
 * Resolve the ADMIN's currently-active salon (multi-branch switcher).
 * Reads the `active_salon` cookie and validates it belongs to the admin's
 * tenant; otherwise falls back to their home salon. This keeps every write
 * inside the tenant even if the cookie is tampered with.
 */
export async function activeSalonId(user: SessionUser): Promise<string> {
  const home = user.salonId ?? "__none__";
  const picked = cookies().get(ACTIVE_SALON_COOKIE)?.value;
  if (!picked || picked === home) return home;
  const salon = await prisma.salon.findFirst({
    where: { id: picked, tenantId: user.tenantId ?? "__none__" },
    select: { id: true },
  });
  return salon?.id ?? home;
}

/** List the salons an ADMIN can manage (their tenant's salons). */
export async function tenantSalons(user: SessionUser) {
  if (!user.tenantId) return [];
  return prisma.salon.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, active: true },
  });
}
