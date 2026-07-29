import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { TenantsClient } from "./TenantsClient";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "کارفرماها | مدیریت پلتفرم" };

export default async function TenantsPage() {
  await requireRole([ROLES.PLATFORM]);

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { salons: true, users: true } },
      salons: { select: { id: true, name: true, slug: true, active: true }, orderBy: { createdAt: "asc" } },
      licenses: { select: { id: true, plan: true, status: true, priceIrr: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-plum-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Building2 size={13} /> کارفرماها</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">کارفرماها و <span className="text-gradient">سالن‌ها</span></h1>
        <p className="mt-2 text-sm text-white/55">ثبت کارفرمای جدید همراه با سالن، مدیر و لایسنس اولیه</p>
      </div>
      <TenantsClient initialTenants={tenants as any} />
    </div>
  );
}
