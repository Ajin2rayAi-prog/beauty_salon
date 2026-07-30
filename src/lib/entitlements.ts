/**
 * Entitlements / feature-flags — platform-owner-controlled capability gating.
 *
 * Two layers combine to decide whether a salon has a feature:
 *   1) PLAN default   — each license plan (STARTER/PRO/WHITELABEL) turns on a
 *                       default bundle of features (PLAN_FEATURES below).
 *   2) per-salon override — the PLATFORM owner can flip any single feature
 *                       on/off for one salon, stored as JSON on Salon.featureOverrides.
 *
 * Effective value:  override[key]  ??  planDefault(plan, key)
 *
 * License status also gates everything: a SUSPENDED/EXPIRED license (or one
 * past its endDate) disables the whole salon (all features off + `licensed:false`).
 */
import { prisma } from "./prisma";

// ── Feature catalogue (order = display order in the platform toggle grid) ─────
export type FeatureKey =
  | "onlineBooking"
  | "lineIntro"
  | "providerPanel"
  | "finance"
  | "customerRecords"
  | "reminders"
  | "inventory"
  | "multiBranch"
  | "reviews"
  | "socialCta"
  | "loyalty"
  | "seo"
  | "subdomainSite";

export type FeatureMeta = { key: FeatureKey; label: string; desc: string };

export const FEATURES: FeatureMeta[] = [
  { key: "onlineBooking", label: "رزرو آنلاین", desc: "رزرو نوبت آنلاین توسط مشتری (لاین → خدمت → خدمت‌دهنده → ساعت → پرداخت)" },
  { key: "lineIntro", label: "معرفی لاین‌ها", desc: "صفحه اختصاصی هر لاین با خدمات، قیمت و خدمت‌دهنده‌ها" },
  { key: "providerPanel", label: "پنل خدمت‌دهنده", desc: "داشبورد، تقویم، ساعات کاری و نمونه‌کار مخصوص هر خدمت‌دهنده" },
  { key: "finance", label: "گزارش مالی", desc: "گزارش درآمد به تفکیک لاین/خدمت‌دهنده/سالن + کمیسیون خودکار" },
  { key: "customerRecords", label: "پرونده مشتری", desc: "سابقه خدمات، فرمول رنگ مو، حساسیت‌ها و یادداشت‌های هر مشتری" },
  { key: "reminders", label: "یادآوری خودکار", desc: "یادآوری پیامکی نوبت + دکمه واتساپ برای پیام دستی" },
  { key: "inventory", label: "انبار و مواد مصرفی", desc: "مدیریت موجودی محصولات و مواد مصرفی سالن" },
  { key: "multiBranch", label: "مدیریت چندشعبه", desc: "مدیریت چند سالن/شعبه از یک پنل مدیریت" },
  { key: "reviews", label: "نظرات مشتریان", desc: "ثبت و نمایش نظر و امتیاز مشتریان روی سایت سالن" },
  { key: "socialCta", label: "دکمه‌های تماس/سوشال", desc: "دکمه واتساپ، تماس و اینستاگرام روی سایت عمومی سالن" },
  { key: "loyalty", label: "باشگاه مشتریان", desc: "امتیاز وفاداری، سطح مشتری و کد تخفیف" },
  { key: "seo", label: "سئو و گوگل", desc: "متادیتای هر سالن، sitemap، داده ساختاریافته و فیلدهای گوگل بیزینس" },
  { key: "subdomainSite", label: "سایت اختصاصی (ساب‌دامین)", desc: "سایت مستقل سالن روی ساب‌دامین اختصاصی" },
];

export const ALL_FEATURE_KEYS = FEATURES.map((f) => f.key);

// ── Plan default bundles ──────────────────────────────────────────────────────
export type Plan = "STARTER" | "PRO" | "WHITELABEL";

export const PLAN_FEATURES: Record<Plan, FeatureKey[]> = {
  STARTER: ["onlineBooking", "lineIntro", "providerPanel", "finance", "socialCta"],
  PRO: [
    "onlineBooking", "lineIntro", "providerPanel", "finance", "customerRecords",
    "reminders", "reviews", "socialCta", "loyalty", "seo", "subdomainSite",
  ],
  WHITELABEL: [...ALL_FEATURE_KEYS], // everything
};

export function planDefaults(plan: string): Record<FeatureKey, boolean> {
  const on = new Set(PLAN_FEATURES[(plan as Plan)] ?? PLAN_FEATURES.STARTER);
  const map = {} as Record<FeatureKey, boolean>;
  for (const k of ALL_FEATURE_KEYS) map[k] = on.has(k);
  return map;
}

/** Parse the per-salon override JSON safely. */
export function parseOverrides(json?: string | null): Partial<Record<FeatureKey, boolean>> {
  if (!json) return {};
  try {
    const o = JSON.parse(json);
    if (o && typeof o === "object") return o;
  } catch {}
  return {};
}

/** Merge plan defaults with per-salon overrides into an effective map. */
export function effectiveFeatures(plan: string, overridesJson?: string | null): Record<FeatureKey, boolean> {
  const base = planDefaults(plan);
  const ov = parseOverrides(overridesJson);
  for (const k of ALL_FEATURE_KEYS) if (typeof ov[k] === "boolean") base[k] = ov[k]!;
  return base;
}

export type SalonEntitlements = {
  licensed: boolean; // false = license missing/suspended/expired -> salon disabled
  plan: string;
  features: Record<FeatureKey, boolean>;
};

const ALL_OFF = (): Record<FeatureKey, boolean> => {
  const m = {} as Record<FeatureKey, boolean>;
  for (const k of ALL_FEATURE_KEYS) m[k] = false;
  return m;
};

/** Is a license currently valid (active + not past endDate)? */
export function isLicenseValid(lic?: { status: string; endDate?: Date | null } | null): boolean {
  if (!lic) return false;
  if (lic.status !== "ACTIVE") return false;
  if (lic.endDate && lic.endDate.getTime() < Date.now()) return false;
  return true;
}

/**
 * Resolve a salon's entitlements from DB: latest license on its tenant + the
 * salon's own override JSON. Used by server guards and public rendering.
 */
export async function getSalonEntitlements(salonId: string): Promise<SalonEntitlements> {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: {
      featureOverrides: true,
      active: true,
      tenant: { select: { licenses: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!salon) return { licensed: false, plan: "STARTER", features: ALL_OFF() };
  const lic = salon.tenant?.licenses?.[0] ?? null;
  const plan = lic?.plan ?? "STARTER";
  if (!salon.active || !isLicenseValid(lic)) {
    return { licensed: false, plan, features: ALL_OFF() };
  }
  return { licensed: true, plan, features: effectiveFeatures(plan, salon.featureOverrides) };
}
