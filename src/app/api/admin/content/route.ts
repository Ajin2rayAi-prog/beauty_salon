import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
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
  const content = await getSalonContent(user.salonId!);
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;

  const body = (await req.json().catch(() => ({}))) as Partial<SalonContent>;
  // merge over defaults so a partial payload never wipes a section
  const merged: SalonContent = { ...defaultSalonContent, ...(await getSalonContent(user.salonId!)), ...body };
  await saveSalonContent(user.salonId!, merged);
  return NextResponse.json({ ok: true, content: merged });
}
