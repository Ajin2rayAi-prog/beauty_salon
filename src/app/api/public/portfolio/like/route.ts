import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Anonymous like toggle for a portfolio post. The client guards against
// double-liking via localStorage; the server just adjusts the counter.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const liked = body.liked !== false; // default: like (true)
  if (!id) return NextResponse.json({ error: "شناسه ناقص" }, { status: 400 });

  const post = await prisma.providerPortfolio.findUnique({ where: { id }, select: { likes: true } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  // clamp so unlikes never push the counter below zero
  const next = liked ? post.likes + 1 : Math.max(0, post.likes - 1);
  const updated = await prisma.providerPortfolio.update({
    where: { id },
    data: { likes: next },
    select: { likes: true },
  });
  return NextResponse.json({ ok: true, likes: updated.likes });
}
