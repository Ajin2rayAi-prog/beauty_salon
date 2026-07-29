import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const provider = await prisma.provider.findUnique({ where: { id: params.id }, select: { salonId: true } });
  if (!provider || provider.salonId !== user.salonId) {
    return NextResponse.json({ error: "خدمت‌دهنده پیدا نشد" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.title !== undefined) data.title = body.title;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.instagram !== undefined) data.instagram = body.instagram;
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl;

  const updated = await prisma.provider.update({ where: { id: params.id }, data, select: { id: true, active: true } });
  return NextResponse.json({ ok: true, provider: updated });
}
