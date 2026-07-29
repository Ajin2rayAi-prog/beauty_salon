import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT /api/provider/schedule { providerId, schedules: [{dayOfWeek,startTime,endTime,isOff}] }
// Replaces the provider's weekly schedule (only for the logged-in provider).
export async function PUT(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const schedules = Array.isArray(body.schedules) ? body.schedules : [];

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });
  if (body.providerId && body.providerId !== provider.id) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  const valid = schedules
    .filter((s: any) => s.dayOfWeek >= 0 && s.dayOfWeek <= 6)
    .map((s: any) => ({
      providerId: provider.id,
      dayOfWeek: s.dayOfWeek,
      startTime: String(s.startTime || "10:00"),
      endTime: String(s.endTime || "20:00"),
      isOff: !!s.isOff,
    }));

  await prisma.$transaction([
    prisma.providerSchedule.deleteMany({ where: { providerId: provider.id } }),
    prisma.providerSchedule.createMany({ data: valid }),
  ]);

  return NextResponse.json({ ok: true });
}
