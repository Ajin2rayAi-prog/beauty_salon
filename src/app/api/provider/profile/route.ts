import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** A provider edits their own public profile: photo, résumé (bio), title, instagram. */
export async function PATCH(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "پروفایل خدمت‌دهنده پیدا نشد" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl === "" ? null : body.photoUrl;
  if (body.title !== undefined) data.title = body.title === "" ? null : String(body.title).slice(0, 120);
  if (body.instagram !== undefined) data.instagram = body.instagram === "" ? null : String(body.instagram).slice(0, 120);
  if (body.bio !== undefined) data.bio = body.bio === "" ? null : String(body.bio).slice(0, 2000);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشد" }, { status: 400 });
  }

  await prisma.provider.update({ where: { id: provider.id }, data });
  return NextResponse.json({ ok: true });
}
