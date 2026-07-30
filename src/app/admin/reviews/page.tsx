import { requireRole, requireFeature, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import { ReviewsClient } from "./ReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);
  await requireFeature(salonId, "reviews");

  const reviews = await prisma.review.findMany({
    where: { salonId },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  const list = reviews.map((r) => ({
    id: r.id, authorName: r.authorName, rating: r.rating, text: r.text,
    approved: r.approved, createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-gold-400/20" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Star size={14} /> نظرات مشتریان</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          نظرات <span className="text-gradient">مشتریان</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">نظرهای جدید را تأیید کن تا روی سایت سالن نمایش داده شوند.</p>
      </div>

      <ReviewsClient initial={list} />
    </div>
  );
}
