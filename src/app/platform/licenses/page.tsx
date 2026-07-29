import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { LicensesClient } from "./LicensesClient";
import { BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "لایسنس‌ها | مدیریت پلتفرم" };

export default async function LicensesPage() {
  await requireRole([ROLES.PLATFORM]);

  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { name: true, _count: { select: { salons: true } } } },
    },
  });

  return (
    <div className="relative space-y-6">
      <div className="blob -left-10 -top-16 h-60 w-60 bg-emerald-500/12" />
      <div className="animate-fade-up">
        <span className="eyebrow"><BadgeCheck size={13} /> اشتراک‌ها</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">مدیریت <span className="text-gradient">لایسنس‌ها</span></h1>
        <p className="mt-2 text-sm text-white/55">مدیریت پلن، قیمت، محدودیت‌ها و وضعیت لایسنس هر کارفرما</p>
      </div>
      <LicensesClient initialLicenses={licenses as any} />
    </div>
  );
}
