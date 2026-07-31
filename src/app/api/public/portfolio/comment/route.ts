import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Add a public comment to a portfolio post (Instagram-style).
//  - logged-in user  -> posts under their real name, auto-approved (shows now)
//  - anonymous guest  -> stays hidden (approved=false) until the provider approves
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string } | undefined;

  const body = await req.json().catch(() => ({}));
  const portfolioId = String(body.portfolioId || "");
  const guestName = String(body.authorName || "").trim().slice(0, 60);
  const text = String(body.text || "").trim().slice(0, 500);

  if (!portfolioId || !text) {
    return NextResponse.json({ error: "متن دیدگاه الزامی است" }, { status: 400 });
  }

  const post = await prisma.providerPortfolio.findUnique({ where: { id: portfolioId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  const isMember = !!user?.id;
  const authorName = isMember ? (user!.name || "کاربر") : (guestName || "مهمان");

  const comment = await prisma.portfolioComment.create({
    data: {
      portfolioId,
      authorName,
      authorId: isMember ? user!.id : null,
      text,
      approved: isMember, // members show immediately; guests await moderation
    },
  });

  // Guests get a pending flag so the client can inform them instead of rendering.
  return NextResponse.json({ ok: true, comment, pending: !isMember });
}
