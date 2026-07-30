import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import {
  getPlatformContent,
  savePlatformContent,
  defaultPlatformContent,
  type PlatformContent,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireRoleApi([ROLES.PLATFORM]);
  if (response) return response;
  const content = await getPlatformContent();
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  const { response } = await requireRoleApi([ROLES.PLATFORM]);
  if (response) return response;

  const body = (await req.json().catch(() => ({}))) as Partial<PlatformContent>;
  const merged: PlatformContent = { ...defaultPlatformContent, ...(await getPlatformContent()), ...body };
  await savePlatformContent(merged);
  return NextResponse.json({ ok: true, content: merged });
}
