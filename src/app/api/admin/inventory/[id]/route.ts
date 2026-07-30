import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, assertFeatureApi, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/admin/inventory/[id] — update fields (incl. stock adjust)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = await activeSalonId(user);
  const gate = await assertFeatureApi(salonId, "inventory");
  if (gate.response) return gate.response;

  const existing = await prisma.product.findFirst({ where: { id: params.id, salonId } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof b.name === "string") data.name = b.name.trim();
  if (typeof b.unit === "string") data.unit = b.unit;
  if (b.stock !== undefined) data.stock = Number(b.stock) || 0;
  if (b.minStock !== undefined) data.minStock = Number(b.minStock) || 0;
  if (b.cost !== undefined) data.cost = Math.round(Number(b.cost) || 0);
  if (b.price !== undefined) data.price = Math.round(Number(b.price) || 0);
  if (typeof b.active === "boolean") data.active = b.active;
  // relative stock move (+/-) when adjust is supplied
  if (b.adjust !== undefined) data.stock = Math.max(0, existing.stock + Number(b.adjust));

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, product });
}

// DELETE /api/admin/inventory/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = await activeSalonId(user);
  const gate = await assertFeatureApi(salonId, "inventory");
  if (gate.response) return gate.response;

  const existing = await prisma.product.findFirst({ where: { id: params.id, salonId } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
