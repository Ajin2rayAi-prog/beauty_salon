import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, assertFeatureApi, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/admin/customers/[id] — update the customer record (پرونده مشتری)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = await activeSalonId(user);
  const gate = await assertFeatureApi(salonId, "customerRecords");
  if (gate.response) return gate.response;

  const existing = await prisma.customer.findFirst({ where: { id: params.id, salonId } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
  if (typeof b.notes === "string") data.notes = b.notes || null;
  if (typeof b.hairFormula === "string") data.hairFormula = b.hairFormula || null;
  if (typeof b.allergies === "string") data.allergies = b.allergies || null;
  if (typeof b.skinNotes === "string") data.skinNotes = b.skinNotes || null;
  if (typeof b.birthday === "string") data.birthday = b.birthday ? new Date(b.birthday) : null;
  if (b.loyaltyPoints !== undefined) data.loyaltyPoints = Math.max(0, Math.round(Number(b.loyaltyPoints) || 0));
  if (typeof b.loyaltyTier === "string" && ["BRONZE", "SILVER", "GOLD"].includes(b.loyaltyTier)) data.loyaltyTier = b.loyaltyTier;

  const customer = await prisma.customer.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, customer });
}
