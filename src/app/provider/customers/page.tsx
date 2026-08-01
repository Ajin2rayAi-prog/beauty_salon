import { requireRole, requireFeature, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { ProviderCustomersClient } from "./ProviderCustomersClient";

export const dynamic = "force-dynamic";

export default async function ProviderCustomersPage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) throw new Error("پروفایل پیدا نشد");
  await requireFeature(provider.salonId, "customerRecords", "/provider");

  // Only customers this provider has actually served.
  const customers = await prisma.customer.findMany({
    where: { salonId: provider.salonId, appointments: { some: { providerId: provider.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      appointments: { where: { providerId: provider.id }, orderBy: { startAt: "desc" }, select: { startAt: true } },
      _count: { select: { visitNotes: true } },
    },
  });

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    visits: c.appointments.length,
    lastVisit: c.appointments[0]?.startAt.toISOString() ?? null,
    notes: c._count.visitNotes,
    hasRecord: !!(c.hairFormula || c.allergies || c.skinNotes),
  }));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="blob -right-8 -top-12 h-48 w-48 bg-plum-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow"><Users size={14} /> پروندهٔ مشتریان</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">مشتریان <span className="text-gradient">من</span></h1>
          <p className="mt-2 text-sm text-white/55">پروندهٔ مشتریانی که به آن‌ها خدمت داده‌اید؛ فرمول‌ها، حساسیت‌ها و یادداشت هر ویزیت را ثبت کنید تا برای مدیریت هم ثبت شود.</p>
        </div>
      </div>
      <ProviderCustomersClient rows={rows} />
    </div>
  );
}
