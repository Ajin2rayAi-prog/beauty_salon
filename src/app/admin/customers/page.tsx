import { requireRole, requireFeature, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ClipboardList } from "lucide-react";
import { CustomersClient } from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);
  await requireFeature(salonId, "customerRecords");

  const customers = await prisma.customer.findMany({
    where: { salonId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, loyaltyTier: true, loyaltyPoints: true,
      hairFormula: true, allergies: true,
      _count: { select: { appointments: true } },
    },
  });

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-plum-500/20" />
      <div className="animate-fade-up">
        <span className="eyebrow"><ClipboardList size={14} /> پرونده مشتریان</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          پرونده <span className="text-gradient">مشتریان</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">سابقه خدمات، فرمول رنگ مو، حساسیت‌ها و امتیاز باشگاه هر مشتری.</p>
      </div>

      <CustomersClient initial={customers} />
    </div>
  );
}
