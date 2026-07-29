import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProviderCalendar } from "./ProviderCalendar";

export const dynamic = "force-dynamic";

export default async function ProviderCalendarPage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) throw new Error("پروفایل پیدا نشد");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">تقویم نوبت‌ها</h1>
        <p className="mt-1 text-sm text-white/50">نمای هفتگی نوبت‌های شما.</p>
      </div>
      <ProviderCalendar providerId={provider.id} />
    </div>
  );
}
