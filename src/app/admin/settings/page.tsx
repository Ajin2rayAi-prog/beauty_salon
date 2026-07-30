import { requireRole, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salon = await prisma.salon.findUnique({ where: { id: await activeSalonId(user) } });
  if (!salon) throw new Error("سالن پیدا نشد");

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-sky-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Settings size={14} /> تنظیمات</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          تنظیمات <span className="text-gradient">سالن</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">اطلاعات عمومی، ساعات کاری و مشخصات سالن.</p>
      </div>
      <SettingsClient salon={JSON.parse(JSON.stringify(salon))} />
    </div>
  );
}
