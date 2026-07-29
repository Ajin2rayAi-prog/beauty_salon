import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PortfolioClient } from "./PortfolioClient";

export const dynamic = "force-dynamic";

export default async function ProviderPortfolioPage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: {
      lines: { include: { line: { select: { id: true, name: true } } } },
      portfolios: { orderBy: { createdAt: "desc" }, include: { line: { select: { id: true, name: true } } } },
    },
  });
  if (!provider) throw new Error("پروفایل پیدا نشد");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">نمونه‌کارهای من</h1>
        <p className="mt-1 text-sm text-white/50">نمونه‌کارها را به‌تفکیک هر لاین آپلود و مدیریت کنید؛ در پروفایل عمومی شما نمایش داده می‌شود.</p>
      </div>
      <PortfolioClient
        providerId={provider.id}
        lines={provider.lines.map((pl) => pl.line)}
        initialItems={JSON.parse(JSON.stringify(provider.portfolios))}
      />
    </div>
  );
}
