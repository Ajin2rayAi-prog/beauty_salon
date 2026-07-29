import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function myProvider(userId: string) {
  return prisma.provider.findUnique({ where: { userId } });
}

export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;
  const provider = await myProvider(user.id);
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const imageUrl = String(body.imageUrl || "").trim();
  if (!imageUrl) return NextResponse.json({ error: "لینک تصویر الزامی است" }, { status: 400 });

  const item = await prisma.providerPortfolio.create({
    data: { providerId: provider.id, imageUrl, caption: body.caption || null, lineId: body.lineId || null },
    include: { line: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;
  const provider = await myProvider(user.id);
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه ناقص" }, { status: 400 });

  const item = await prisma.providerPortfolio.findUnique({ where: { id } });
  if (!item || item.providerId !== provider.id) {
    return NextResponse.json({ error: "نمونه‌کار پیدا نشد" }, { status: 404 });
  }
  await prisma.providerPortfolio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
