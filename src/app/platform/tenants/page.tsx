import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { TenantsClient } from "./TenantsClient";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">کارفرماها و سالن‌ها</h1>
        <p className="mt-1 text-sm text-white/50">ثبت کارفرمای جدید همراه با سالن، مدیر و لایسنس اولیه</p>
      </div>
      <TenantsClient initialTenants={tenants as any} />
    </div>
  );
}
