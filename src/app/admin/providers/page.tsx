import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProvidersClient } from "./ProvidersClient";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">خدمت‌دهنده‌ها</h1>
        <p className="mt-1 text-sm text-white/50">خدمت‌دهنده جدید بسازید، لاین‌ها را به آن‌ها نسبت دهید و فعال/غیرفعال کنید.</p>
      </div>
      <ProvidersClient initialProviders={JSON.parse(JSON.stringify(providers))} lines={lines} />
    </div>
  );
}
