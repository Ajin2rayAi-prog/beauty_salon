import { requireRole, ROLES, activeSalonId } from "@/lib/auth-guards";
import { getSalonContent } from "@/lib/content";
import { ContentClient } from "./ContentClient";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const content = await getSalonContent(await activeSalonId(user));

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-rose-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><FileText size={14} /> مدیریت محتوا</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          محتوای <span className="text-gradient">صفحه سالن</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">متن‌های صفحه عمومی سالن؛ معرفی، ویژگی‌ها، نظرات مشتریان و شبکه‌های اجتماعی.</p>
      </div>
      <ContentClient initial={JSON.parse(JSON.stringify(content))} />
    </div>
  );
}
