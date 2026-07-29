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
      <div className="relative overflow-hidden">
        <div className="blob -right-8 -top-12 h-48 w-48 bg-plum-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow">🗓️ برنامه هفتگی</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">تقویم <span className="text-gradient">نوبت‌ها</span></h1>
          <p className="mt-2 text-sm text-white/55">نمای هفتگی نوبت‌های شما.</p>
        </div>
      </div>
      <ProviderCalendar providerId={provider.id} />
    </div>
  );
}
