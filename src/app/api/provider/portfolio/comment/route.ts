import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Provider deletes a comment on one of their own posts (moderation).
export async function DELETE(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه ناقص" }, { status: 400 });

  const comment = await prisma.portfolioComment.findUnique({
    where: { id },
    include: { portfolio: { select: { providerId: true } } },
  });
  if (!comment || comment.portfolio.providerId !== provider.id) {
    return NextResponse.json({ error: "دیدگاه پیدا نشد" }, { status: 404 });
  }

  await prisma.portfolioComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Provider approves a pending (guest) comment on one of their own posts.
export async function PATCH(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "شناسه ناقص" }, { status: 400 });

  const comment = await prisma.portfolioComment.findUnique({
    where: { id },
    include: { portfolio: { select: { providerId: true } } },
  });
  if (!comment || comment.portfolio.providerId !== provider.id) {
    return NextResponse.json({ error: "دیدگاه پیدا نشد" }, { status: 404 });
  }

  const updated = await prisma.portfolioComment.update({ where: { id }, data: { approved: true } });
  return NextResponse.json({ ok: true, comment: updated });
}
