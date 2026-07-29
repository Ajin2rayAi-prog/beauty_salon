import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ScheduleClient } from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default async function ProviderSchedulePage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: { schedules: true },
  });
  if (!provider) throw new Error("پروفایل پیدا نشد");

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="blob -right-8 -top-12 h-48 w-48 bg-sky-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow">⏰ برنامه هفتگی</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">ساعات کاری <span className="text-gradient">من</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">بازه کاری هر روز هفته را خودتان تنظیم کنید؛ نوبت‌ها فقط در همین بازه‌ها پیشنهاد می‌شوند.</p>
        </div>
      </div>
      <ScheduleClient providerId={provider.id} initialSchedules={JSON.parse(JSON.stringify(provider.schedules))} />
    </div>
  );
}
