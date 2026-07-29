import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { LicensesClient } from "./LicensesClient";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">لایسنس‌ها</h1>
        <p className="mt-1 text-sm text-white/50">مدیریت پلن، قیمت، محدودیت‌ها و وضعیت لایسنس هر کارفرما</p>
      </div>
      <LicensesClient initialLicenses={licenses as any} />
    </div>
  );
}
