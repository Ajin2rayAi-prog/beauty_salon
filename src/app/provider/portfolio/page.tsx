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
      <div className="relative overflow-hidden">
        <div className="blob -right-8 -top-12 h-48 w-48 bg-coral-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow">📸 گالری کارها</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">نمونه‌کارهای <span className="text-gradient">من</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">نمونه‌کارها را به‌تفکیک هر لاین آپلود و مدیریت کنید؛ در پروفایل عمومی شما نمایش داده می‌شود.</p>
        </div>
      </div>
      <PortfolioClient
        providerId={provider.id}
        lines={provider.lines.map((pl) => pl.line)}
        initialItems={JSON.parse(JSON.stringify(provider.portfolios))}
      />
    </div>
  );
}
