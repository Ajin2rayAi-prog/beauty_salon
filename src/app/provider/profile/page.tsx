import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProviderProfileClient } from "./ProviderProfileClient";
import { UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: { salon: { select: { slug: true } }, lines: { include: { line: { select: { name: true } } } } },
  });
  if (!provider) throw new Error("پروفایل خدمت‌دهنده پیدا نشد");

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-plum-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><UserCircle size={14} /> پروفایل عمومی</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          پروفایل و <span className="text-gradient">رزومه</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">
          عکس، عنوان و رزومهٔ خودتان را ویرایش کنید. این اطلاعات در صفحهٔ عمومی شما و اسلایدشوی سایت سالن دیده می‌شود.
        </p>
      </div>
      <ProviderProfileClient
        salonSlug={provider.salon.slug}
        initial={{
          photoUrl: provider.photoUrl ?? "",
          title: provider.title ?? "",
          instagram: provider.instagram ?? "",
          bio: provider.bio ?? "",
          slug: provider.slug,
          name: user.name ?? "",
          lines: provider.lines.map((l) => l.line.name),
        }}
      />
    </div>
  );
}
