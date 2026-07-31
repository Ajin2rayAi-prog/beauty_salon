import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Add a public comment to a portfolio post (Instagram-style — posts immediately).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const portfolioId = String(body.portfolioId || "");
  const authorName = String(body.authorName || "").trim().slice(0, 60);
  const text = String(body.text || "").trim().slice(0, 500);

  if (!portfolioId || !text) {
    return NextResponse.json({ error: "متن دیدگاه الزامی است" }, { status: 400 });
  }

  const post = await prisma.providerPortfolio.findUnique({ where: { id: portfolioId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  const comment = await prisma.portfolioComment.create({
    data: { portfolioId, authorName: authorName || "مهمان", text },
  });
  return NextResponse.json({ ok: true, comment });
}
