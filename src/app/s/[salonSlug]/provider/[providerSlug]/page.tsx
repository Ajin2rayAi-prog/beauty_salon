import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { providerAvatar } from "@/lib/images";
import { getSalonEntitlements } from "@/lib/entitlements";
import { ReviewForm } from "../../ReviewForm";
import { PortfolioFeed } from "./PortfolioFeed";
import { CalendarHeart, ArrowRight, Instagram, Camera, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({
  params,
}: {
  params: { salonSlug: string; providerSlug: string };
}) {
  const salon = await prisma.salon.findFirst({
    where: { active: true, OR: [{ slug: params.salonSlug }, { subdomain: params.salonSlug }] },
  });
  if (!salon) notFound();

  const provider = await prisma.provider.findUnique({
    where: { salonId_slug: { salonId: salon.id, slug: params.providerSlug } },
    include: {
      user: { select: { name: true } },
      lines: { include: { line: true } },
      portfolios: {
        orderBy: { createdAt: "desc" },
        include: {
          line: { select: { id: true, name: true } },
          comments: { where: { approved: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!provider || !provider.active) notFound();

  // Reviews for THIS provider (moderated) — gated behind the reviews feature.
  const ent = await getSalonEntitlements(salon.id);
  const showReviews = !!ent.features.reviews;
  const reviews = showReviews
    ? await prisma.review.findMany({
        where: { salonId: salon.id, providerId: provider.id, approved: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, authorName: true, rating: true, text: true },
      })
    : [];
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  const posts = JSON.parse(JSON.stringify(provider.portfolios));
  const providerPhoto = provider.photoUrl ?? providerAvatar(provider.slug);
  const providerName = provider.user?.name ?? provider.title ?? "خدمت‌دهنده";

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت</Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-20">
        {/* Profile header */}
        <div className="card-glow relative mt-8 overflow-hidden p-8 animate-fade-up">
          <div className="blob -right-12 -top-12 h-52 w-52 bg-plum-500/25" />
          <div className="blob -bottom-12 left-0 h-44 w-44 bg-rose-500/20" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-[2rem] bg-rose-gradient opacity-70 blur-md" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={provider.photoUrl ?? providerAvatar(provider.slug)} alt={provider.title ?? provider.slug} className="relative h-28 w-28 rounded-3xl border-2 border-white/20 object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="eyebrow"><Camera size={13} /> پروفایل متخصص</span>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{provider.title ?? "خدمت‌دهنده"}</h1>
              <p className="mt-1 text-white/50">{provider.user?.name}</p>
              {provider.bio && <p className="mt-3 max-w-xl leading-7 text-white/60">{provider.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {provider.lines.map((pl) => (
                  <Link key={pl.lineId} href={`/s/${salon.slug}/line/${pl.line.slug}`} className="badge text-xs text-rose-200 hover:border-rose-400/50">{pl.line.name}</Link>
                ))}
              </div>
              {provider.instagram && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-plum-300"><Instagram size={15} /> {provider.instagram}</p>
              )}
            </div>
            <Link href={`/s/${salon.slug}/book?provider=${provider.slug}`} className="btn-rose px-6 py-3.5 text-base">
              <CalendarHeart size={18} /> رزرو نوبت
            </Link>
          </div>
        </div>

        {/* Portfolio — Instagram-style feed (caption + likes + comments) */}
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="eyebrow"><Camera size={13} /> نمونه‌کارها</span>
            <span className="badge text-[11px]">{provider.portfolios.length} پست</span>
          </div>
          {posts.length === 0 ? (
            <div className="card p-12 text-center">
              <Camera size={32} className="mx-auto text-white/30" />
              <p className="mt-3 text-white/45">هنوز پستی منتشر نشده است.</p>
            </div>
          ) : (
            <PortfolioFeed providerName={providerName} providerPhoto={providerPhoto} initialPosts={posts} />
          )}
        </section>

        {/* Reviews for this provider (moderated by the salon manager) */}
        {showReviews && (
          <section className="mt-16">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="eyebrow"><Star size={13} /> نظرات مراجعین</span>
              {avgRating != null && (
                <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
                  <Star size={15} className="fill-gold-300 text-gold-300" />
                  <span className="font-bold text-gold-300">{avgRating.toFixed(1)}</span>
                  <span className="text-white/40">از {reviews.length} نظر</span>
                </span>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="mb-8 columns-1 gap-4 sm:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
                {reviews.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className={i <= r.rating ? "fill-gold-300 text-gold-300" : "text-white/20"} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/75">{r.text}</p>
                    <p className="mt-3 text-xs font-bold text-rose-200">— {r.authorName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-8 text-sm text-white/40">هنوز نظری برای این متخصص ثبت نشده است. اولین نفر باشید.</p>
            )}

            <ReviewForm salonId={salon.id} providerId={provider.id} />
          </section>
        )}
      </main>
    </div>
  );
}
