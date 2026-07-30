import { requireRole, ROLES } from "@/lib/auth-guards";
import { getPlatformContent } from "@/lib/content";
import { PlatformContentClient } from "./PlatformContentClient";
import { LayoutTemplate } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformContentPage() {
  await requireRole([ROLES.PLATFORM]);
  const content = await getPlatformContent();

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-plum-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><LayoutTemplate size={14} /> مدیریت محتوا</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          محتوای <span className="text-gradient">صفحه اصلی</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">متن‌ها، آمار، ویژگی‌ها و نظرات صفحه فرود پلتفرم.</p>
      </div>
      <PlatformContentClient initial={JSON.parse(JSON.stringify(content))} />
    </div>
  );
}
