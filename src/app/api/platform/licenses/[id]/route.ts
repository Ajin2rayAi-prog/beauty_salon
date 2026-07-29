import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Update a license: plan / status / price / limits / end date.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireRoleApi([ROLES.PLATFORM]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { plan, status, priceIrr, maxSalons, maxLines, maxProviders, whiteLabel, endDate } = body as {
    plan?: string; status?: string; priceIrr?: number;
    maxSalons?: number; maxLines?: number; maxProviders?: number;
    whiteLabel?: boolean; endDate?: string | null;
  };

  const existing = await prisma.license.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "لایسنس یافت نشد" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (plan !== undefined) data.plan = plan;
  if (status !== undefined) data.status = status;
  if (priceIrr !== undefined) data.priceIrr = Number(priceIrr) || 0;
  if (maxSalons !== undefined) data.maxSalons = Number(maxSalons) || 0;
  if (maxLines !== undefined) data.maxLines = Number(maxLines) || 0;
  if (maxProviders !== undefined) data.maxProviders = Number(maxProviders) || 0;
  if (whiteLabel !== undefined) data.whiteLabel = !!whiteLabel;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

  const license = await prisma.license.update({
    where: { id: params.id },
    data,
    include: { tenant: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, license });
}
