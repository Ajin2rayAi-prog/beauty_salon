import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "description", "address", "phone", "city", "openTime", "closeTime", "logoUrl", "coverUrl"];
  const data: any = {};
  for (const k of allowed) if (body[k] !== undefined) data[k] = body[k] === "" ? null : body[k];

  const updated = await prisma.salon.update({ where: { id: await activeSalonId(user) }, data });
  return NextResponse.json({ ok: true, salon: { id: updated.id, name: updated.name } });
}
