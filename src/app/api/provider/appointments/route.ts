import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/provider/appointments?from=ISO&to=ISO
export async function GET(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "پروفایل پیدا نشد" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 7 * 86400000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(Date.now() + 14 * 86400000);

  const appointments = await prisma.appointment.findMany({
    where: { providerId: provider.id, startAt: { gte: from, lt: to } },
    orderBy: { startAt: "asc" },
    include: { customer: { select: { name: true, phone: true } }, service: { select: { name: true } }, line: { select: { name: true } } },
  });

  return NextResponse.json({ appointments });
}
