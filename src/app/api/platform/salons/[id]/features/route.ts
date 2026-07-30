import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ALL_FEATURE_KEYS, type FeatureKey } from "@/lib/entitlements";

/**
 * PATCH — platform owner sets per-salon feature overrides.
 * Body: { overrides: { [featureKey]: boolean | null } }
 *   - boolean  -> force on/off for this salon (overrides the plan default)
 *   - null     -> remove the override (fall back to plan default)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.PLATFORM]);
  if (!user) return response;

  const body = await req.json().catch(() => ({}));
  const incoming = (body?.overrides ?? {}) as Record<string, boolean | null>;

  const salon = await prisma.salon.findUnique({ where: { id: params.id }, select: { featureOverrides: true } });
  if (!salon) return NextResponse.json({ error: "سالن یافت نشد" }, { status: 404 });

  let current: Partial<Record<FeatureKey, boolean>> = {};
  try {
    current = salon.featureOverrides ? JSON.parse(salon.featureOverrides) : {};
  } catch {
    current = {};
  }

  for (const [k, v] of Object.entries(incoming)) {
    if (!ALL_FEATURE_KEYS.includes(k as FeatureKey)) continue;
    if (v === null) delete current[k as FeatureKey];
    else if (typeof v === "boolean") current[k as FeatureKey] = v;
  }

  const json = Object.keys(current).length ? JSON.stringify(current) : null;
  await prisma.salon.update({ where: { id: params.id }, data: { featureOverrides: json } });

  return NextResponse.json({ ok: true, overrides: current });
}
