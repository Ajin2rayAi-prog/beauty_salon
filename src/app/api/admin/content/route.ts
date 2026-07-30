import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, activeSalonId } from "@/lib/auth-guards";
import {
  getSalonContent,
  saveSalonContent,
  defaultSalonContent,
  type SalonContent,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const content = await getSalonContent(await activeSalonId(user));
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const salonId = await activeSalonId(user);
  const body = (await req.json().catch(() => ({}))) as Partial<SalonContent>;
  // merge over defaults so a partial payload never wipes a section
  const merged: SalonContent = { ...defaultSalonContent, ...(await getSalonContent(salonId)), ...body };
  await saveSalonContent(salonId, merged);
  return NextResponse.json({ ok: true, content: merged });
}
