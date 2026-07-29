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
      <div>
        <h1 className="text-2xl font-extrabold">ساعات کاری من</h1>
        <p className="mt-1 text-sm text-white/50">بازه کاری هر روز هفته را خودتان تنظیم کنید؛ نوبت‌ها فقط در همین بازه‌ها پیشنهاد می‌شوند.</p>
      </div>
      <ScheduleClient providerId={provider.id} initialSchedules={JSON.parse(JSON.stringify(provider.schedules))} />
    </div>
  );
}
