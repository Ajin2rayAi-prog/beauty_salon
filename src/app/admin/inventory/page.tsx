import { requireRole, requireFeature, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { InventoryClient } from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);
  await requireFeature(salonId, "inventory");

  const products = await prisma.product.findMany({
    where: { salonId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-mint-500/20" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Package size={14} /> انبار</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          انبار <span className="text-gradient">محصولات و مواد مصرفی</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">موجودی، هشدار کمبود و قیمت خرید/فروش هر قلم را مدیریت کن.</p>
      </div>

      <InventoryClient initial={products} />
    </div>
  );
}
