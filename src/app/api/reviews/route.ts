import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSalonEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

// POST /api/reviews — public review submission (moderated: approved=false)
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const salonId = String(b.salonId || "");
  const authorName = String(b.authorName || "").trim();
  const text = String(b.text || "").trim();
  const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating) || 5)));
  const providerId = b.providerId ? String(b.providerId) : null;

  if (!salonId || !authorName || !text) {
    return NextResponse.json({ error: "نام، متن و امتیاز الزامی است" }, { status: 400 });
  }
  if (text.length > 600) {
    return NextResponse.json({ error: "متن نظر بیش از حد طولانی است" }, { status: 400 });
  }

  // salon must be licensed AND have the reviews feature enabled
  const ent = await getSalonEntitlements(salonId);
  if (!ent.licensed || !ent.features.reviews) {
    return NextResponse.json({ error: "ثبت نظر برای این سالن فعال نیست" }, { status: 403 });
  }

  // If the review targets a provider, that provider must belong to this salon.
  if (providerId) {
    const p = await prisma.provider.findFirst({ where: { id: providerId, salonId }, select: { id: true } });
    if (!p) return NextResponse.json({ error: "خدمت‌دهنده نامعتبر است" }, { status: 400 });
  }

  await prisma.review.create({
    data: { salonId, providerId, authorName, rating, text, approved: false },
  });
  // Not shown until an admin approves it.
  return NextResponse.json({ ok: true });
}
