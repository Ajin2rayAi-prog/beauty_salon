import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { LinesClient } from "./LinesClient";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">لاین‌ها و خدمات</h1>
        <p className="mt-1 text-sm text-white/50">
          حالت قیمت‌گذاری (درصدی یا اجاره ثابت) برای هر لاین را اینجا تنظیم کنید.
        </p>
      </div>
      <LinesClient initialLines={JSON.parse(JSON.stringify(lines))} />
    </div>
  );
}
