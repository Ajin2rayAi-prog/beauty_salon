import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  FEATURES, planDefaults, parseOverrides, PLAN_FEATURES,
} from "@/lib/entitlements";
import { FeaturesClient } from "./FeaturesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "قابلیت‌های سالن | مدیریت پلتفرم" };

export default async function SalonFeaturesPage({ params }: { params: { id: string } }) {
  await requireRole([ROLES.PLATFORM]);

  const salon = await prisma.salon.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, slug: true,
      featureOverrides: true,
      tenant: { select: { name: true, licenses: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!salon) notFound();

  const plan = salon.tenant?.licenses?.[0]?.plan ?? "STARTER";
  const defaults = planDefaults(plan);
  const overrides = parseOverrides(salon.featureOverrides);
  const planOnCount = (PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] ?? []).length;

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-plum-500/15" />
      <div className="animate-fade-up">
        <Link href="/platform/tenants" className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
          <ArrowRight size={13} /> بازگشت به کارفرماها
        </Link>
        <span className="eyebrow mt-3"><Sparkles size={13} /> فعال‌سازی قابلیت‌ها</span>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">{salon.name}</h1>
        <p className="mt-2 text-sm text-white/55">
          پلن فعلی: <span className="font-bold text-rose-300">{plan}</span> — {planOnCount} قابلیت پیش‌فرض روشن.
          می‌تونی هر قابلیت رو جدا برای این سالن روشن یا خاموش کنی.
        </p>
      </div>

      <FeaturesClient
        salonId={salon.id}
        features={FEATURES}
        planDefaults={defaults}
        initialOverrides={overrides}
      />
    </div>
  );
}
