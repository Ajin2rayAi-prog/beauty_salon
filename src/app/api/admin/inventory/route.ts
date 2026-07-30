import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, assertFeatureApi, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/inventory — create a product/consumable
export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = await activeSalonId(user);
  const gate = await assertFeatureApi(salonId, "inventory");
  if (gate.response) return gate.response;

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "نام محصول الزامی است" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      salonId,
      name,
      unit: String(b.unit || "عدد"),
      stock: Number(b.stock) || 0,
      minStock: Number(b.minStock) || 0,
      cost: Math.round(Number(b.cost) || 0),
      price: Math.round(Number(b.price) || 0),
    },
  });
  return NextResponse.json({ ok: true, product });
}
