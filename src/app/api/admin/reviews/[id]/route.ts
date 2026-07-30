import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, assertFeatureApi, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function guard() {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return { response };
  const salonId = await activeSalonId(user);
  const gate = await assertFeatureApi(salonId, "reviews");
  if (gate.response) return { response: gate.response };
  return { salonId };
}

/** Recompute the salon's aggregate rating from its approved reviews. */
async function recomputeRating(salonId: string) {
  const agg = await prisma.review.aggregate({
    where: { salonId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.salon.update({
    where: { id: salonId },
    data: { ratingValue: agg._avg.rating ?? 0, ratingCount: agg._count },
  });
}

// PATCH /api/admin/reviews/[id] — approve / unapprove
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if (g.response) return g.response;
  const salonId = g.salonId!;

  const existing = await prisma.review.findFirst({ where: { id: params.id, salonId } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const approved = !!b.approved;
  const review = await prisma.review.update({ where: { id: params.id }, data: { approved } });
  await recomputeRating(salonId);
  return NextResponse.json({ ok: true, review });
}

// DELETE /api/admin/reviews/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard();
  if (g.response) return g.response;
  const salonId = g.salonId!;

  const existing = await prisma.review.findFirst({ where: { id: params.id, salonId } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  await prisma.review.delete({ where: { id: params.id } });
  await recomputeRating(salonId);
  return NextResponse.json({ ok: true });
}
