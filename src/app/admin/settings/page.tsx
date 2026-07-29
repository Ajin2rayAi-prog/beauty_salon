import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salon = await prisma.salon.findUnique({ where: { id: user.salonId! } });
  if (!salon) throw new Error("سالن پیدا نشد");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">تنظیمات سالن</h1>
        <p className="mt-1 text-sm text-white/50">اطلاعات عمومی، ساعات کاری و مشخصات سالن.</p>
      </div>
      <SettingsClient salon={JSON.parse(JSON.stringify(salon))} />
    </div>
  );
}
