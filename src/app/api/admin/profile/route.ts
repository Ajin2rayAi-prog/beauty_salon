import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Update the signed-in salon manager's own profile (photo shown in the site hero). */
export async function PATCH(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.avatar !== undefined) data.avatar = body.avatar === "" ? null : body.avatar;
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشد" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
