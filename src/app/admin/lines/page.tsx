import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { LinesClient } from "./LinesClient";
import { Scissors } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLinesPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

  const lines = await prisma.line.findMany({
    where: { salonId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { services: true, providers: true, appointments: true } },
      services: { orderBy: { price: "asc" } },
    },
  });

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-plum-500/18" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Scissors size={14} /> لاین‌ها و خدمات</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          مدیریت <span className="text-gradient">لاین‌ها</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">
          حالت قیمت‌گذاری (درصدی یا اجاره ثابت) برای هر لاین را اینجا تنظیم کنید.
        </p>
      </div>
      <LinesClient initialLines={JSON.parse(JSON.stringify(lines))} />
    </div>
  );
}
