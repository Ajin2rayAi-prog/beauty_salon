import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const pricingMode = body.pricingMode === "RENT" ? "RENT" : "PERCENTAGE";
  const rentAmount = Math.max(0, Math.floor(Number(body.rentAmount) || 0));
  const commissionPercent = Math.min(100, Math.max(0, Number(body.commissionPercent) || 0));

  // scope: only lines belonging to this admin's active salon
  const line = await prisma.line.findUnique({ where: { id: params.id }, select: { salonId: true } });
  if (!line || line.salonId !== (await activeSalonId(user))) {
    return NextResponse.json({ error: "لاین پیدا نشد" }, { status: 404 });
  }

  const updated = await prisma.line.update({
    where: { id: params.id },
    data: { pricingMode, rentAmount, commissionPercent },
    select: { id: true, pricingMode: true, rentAmount: true, commissionPercent: true },
  });

  return NextResponse.json({ ok: true, line: updated });
}
