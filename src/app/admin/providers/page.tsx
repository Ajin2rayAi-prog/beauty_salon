import { requireRole, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProvidersClient } from "./ProvidersClient";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);

  const [providers, lines] = await Promise.all([
    prisma.provider.findMany({
      where: { salonId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        lines: { include: { line: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { appointments: true, portfolios: true } },
      },
    }),
    prisma.line.findMany({ where: { salonId, active: true }, orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-coral-500/18" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Users size={14} /> تیم سالن</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          خدمت‌دهنده‌های <span className="text-gradient">حرفه‌ای</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">خدمت‌دهنده جدید بسازید، لاین‌ها را به آن‌ها نسبت دهید و فعال/غیرفعال کنید.</p>
      </div>
      <ProvidersClient initialProviders={JSON.parse(JSON.stringify(providers))} lines={lines} />
    </div>
  );
}
