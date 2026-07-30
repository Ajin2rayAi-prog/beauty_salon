import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, ACTIVE_SALON_COOKIE } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/active-salon — switch the active branch (multi-branch).
export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const b = await req.json().catch(() => ({}));
  const salonId = String(b.salonId || "");
  const salon = await prisma.salon.findFirst({
    where: { id: salonId, tenantId: user.tenantId ?? "__none__" },
    select: { id: true },
  });
  if (!salon) return NextResponse.json({ error: "سالن نامعتبر" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTIVE_SALON_COOKIE, salon.id, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
