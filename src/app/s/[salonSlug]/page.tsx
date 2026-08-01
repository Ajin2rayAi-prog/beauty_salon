import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CalendarHeart, Clock, Instagram, ArrowLeft, LogIn, MapPin, Sparkles, Users, Heart, Star, Shield, Award, Quote, Send, MessageCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSalonContent } from "@/lib/content";
import { providerAvatar } from "@/lib/images";
import { getSalonEntitlements } from "@/lib/entitlements";
import { ReviewForm } from "./ReviewForm";
import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { salonSlug: string } }): Promise<Metadata> {
  const salon = await prisma.salon.findFirst({
    where: { active: true, OR: [{ slug: params.salonSlug }, { subdomain: params.salonSlug }] },
    select: { id: true, name: true, description: true, city: true, metaTitle: true, metaDesc: true, ogImage: true, coverUrl: true, slug: true },
  });
  if (!salon) return { title: "سالن پیدا نشد" };

  const ent = await getSalonEntitlements(salon.id);
  if (!ent.licensed) return { title: "سالن پیدا نشد", robots: { index: false, follow: false } };

  // Without the SEO feature we still emit a sensible title but no rich social tags.
  const title = salon.metaTitle || `${salon.name}${salon.city ? ` — ${salon.city}` : ""}`;
  const description = salon.metaDesc || salon.description || `رزرو آنلاین نوبت در ${salon.name}`;
  if (!ent.features.seo) return { title, description };

  const image = salon.ogImage || salon.coverUrl || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/s/${salon.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      siteName: salon.name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

/** Normalize a WhatsApp number into a wa.me link (digits only, keep country code). */
function waLink(v: string): string {
  const digits = v.replace(/[^\d]/g, "").replace(/^0/, "98");
  return `https://wa.me/${digits}`;
}
/** Instagram handle → profile URL (accepts @handle, handle, or full URL). */
function igLink(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}
/** Telegram handle → t.me URL. */
function tgLink(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://t.me/${v.replace(/^@/, "")}`;
}

const LINE_THEMES = [
  "from-rose-500 to-plum-500", "from-coral-500 to-rose-500", "from-plum-500 to-sky-500",
  "from-mint-500 to-sky-500", "from-gold-400 to-coral-500", "from-sky-500 to-plum-500",
];

export default async function SalonPage({ params }: { params: { salonSlug: string } }) {
  const session = await getServerSession(authOptions);
  // The path segment may be a slug OR a subdomain label (middleware rewrites
  // `{sub}.domain` → `/s/{sub}`), so match either.
  const salon = await prisma.salon.findFirst({
    where: { active: true, OR: [{ slug: params.salonSlug }, { subdomain: params.salonSlug }] },
    include: {
      lines: { where: { active: true }, orderBy: { order: "asc" } },
      providers: {
        where: { active: true },
        include: {
          user: { select: { name: true } },
          lines: { include: { line: true } },
        },
      },
    },
  });
  if (!salon) notFound();

  // License gate — a suspended/expired tenant's site goes dark.
  const ent = await getSalonEntitlements(salon.id);
  if (!ent.licensed) notFound();
  const showSocial = !!ent.features.socialCta;
  const whiteLabel = ent.plan === "WHITELABEL";
  const showReviews = !!ent.features.reviews;

  const reviews = showReviews
    ? await prisma.review.findMany({
        where: { salonId: salon.id, approved: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, authorName: true, rating: true, text: true },
      })
    : [];

  const content = await getSalonContent(salon.id);
  const HL_ICONS: Record<string, any> = { Sparkles, Clock, Heart, Star, Shield, Award };

  // Salon management (ADMIN users) — shown first in the hero slideshow.
  const managers = await prisma.user.findMany({
    where: { salonId: salon.id, role: "ADMIN", active: true },
    select: { id: true, name: true, avatar: true },
  });

  // Full-screen hero slides: management-curated banners first (if any), then
  // management users, then every provider. The caption under each name is their
  // job title, or the lines they work in.
  const heroSlides: HeroSlide[] = [
    ...(content.banners ?? [])
      .filter((b) => b.image)
      .map((b) => ({
        photo: b.image,
        name: b.title || salon.name,
        role: b.subtitle || "",
        badge: undefined,
      })),
    ...managers.map((m) => ({
      photo: m.avatar || providerAvatar("mgr-" + m.id, 1000),
      name: m.name,
      role: "مدیریت سالن",
      badge: "مدیریت",
    })),
    ...salon.providers.map((p) => ({
      photo: p.photoUrl ?? providerAvatar(p.slug, 1000),
      name: p.user?.name || p.title || "خدمت‌دهنده",
      role: p.title || p.lines.map((pl) => pl.line.name).join(" • ") || "خدمت‌دهنده",
      badge: p.lines[0]?.line.name,
    })),
  ];

  const lineIcons: Record<string, string> = {
    Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
  };

  // JSON-LD (schema.org BeautySalon) — only when the SEO feature is enabled.
  const jsonLd = ent.features.seo
    ? {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        name: salon.name,
        description: salon.metaDesc || salon.description || undefined,
        image: salon.ogImage || salon.coverUrl || undefined,
        telephone: salon.phone || undefined,
        address: salon.address ? { "@type": "PostalAddress", streetAddress: salon.address, addressLocality: salon.city || undefined } : undefined,
        geo: salon.lat != null && salon.lng != null ? { "@type": "GeoCoordinates", latitude: salon.lat, longitude: salon.lng } : undefined,
        openingHours: `Mo-Su ${salon.openTime}-${salon.closeTime}`,
        aggregateRating: salon.ratingCount > 0 ? { "@type": "AggregateRating", ratingValue: salon.ratingValue, reviewCount: salon.ratingCount } : undefined,
      }
    : null;

  return (
    <div className="relative min-h-screen">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/">{whiteLabel ? <span className="font-black text-gradient">{salon.name}</span> : <Wordmark />}</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard" className="btn-outline px-3 py-2 text-sm">داشبورد من</Link>
            ) : (
              <Link href="/login" className="btn-ghost px-3 py-2 text-sm"><LogIn size={15} /> ورود</Link>
            )}
            <a href="#lines" className="btn-rose px-4 py-2 text-sm"><CalendarHeart size={16} /> رزرو نوبت</a>
          </div>
        </div>
      </header>

      {/* Hero — full-screen slideshow of management & staff */}
      {heroSlides.length > 0 ? (
        <HeroSlider
          slides={heroSlides}
          salonName={salon.name}
          eyebrow={content.hero.eyebrow}
          tagline={content.hero.tagline}
          openTime={salon.openTime}
          closeTime={salon.closeTime}
          address={salon.address}
          providerCount={salon.providers.length}
        />
      ) : (
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="blob animate-float -right-16 top-0 h-72 w-72 bg-rose-500/25" />
          <div className="blob animate-float delay-3 -left-10 top-10 h-64 w-64 bg-plum-500/25" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 text-center">
            <span className="eyebrow animate-fade-up"><Sparkles size={14} /> {content.hero.eyebrow}</span>
            <h1 className="mt-5 animate-fade-up delay-1 text-4xl font-black sm:text-5xl">{salon.name}</h1>
            <p className="mx-auto mt-3 max-w-xl animate-fade-up delay-2 text-rose-200/80">{content.hero.tagline}</p>
            <p className="mx-auto mt-4 max-w-xl animate-fade-up delay-2 leading-8 text-white/60">{salon.description}</p>
            <div className="mt-6 flex animate-fade-up delay-3 flex-wrap justify-center gap-3 text-sm">
              <span className="glass flex items-center gap-2 rounded-full px-4 py-2"><Clock size={15} className="text-rose-300" /> {salon.openTime} تا {salon.closeTime}</span>
              {salon.address && <span className="glass flex items-center gap-2 rounded-full px-4 py-2"><MapPin size={15} className="text-plum-300" /> {salon.address}</span>}
              <span className="glass flex items-center gap-2 rounded-full px-4 py-2"><Users size={15} className="text-mint-300" /> {salon.providers.length} متخصص</span>
            </div>
          </div>
        </section>
      )}

      <main className="relative mx-auto max-w-5xl px-4 pb-20">
        {/* About + highlights */}
        <section className="grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> {content.about.title}</span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">{content.about.title}</h2>
            <p className="mt-4 leading-8 text-white/60">{content.about.body}</p>
            {showSocial && (content.social.instagram || content.social.telegram || content.social.whatsapp) && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {content.social.instagram && <a href={igLink(content.social.instagram)} target="_blank" rel="noopener noreferrer" className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-plum-200 transition hover:bg-white/[0.08] hover:text-plum-100"><Instagram size={14} /> {content.social.instagram}</a>}
                {content.social.telegram && <a href={tgLink(content.social.telegram)} target="_blank" rel="noopener noreferrer" className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-sky-200 transition hover:bg-white/[0.08] hover:text-sky-100"><Send size={14} /> {content.social.telegram}</a>}
                {content.social.whatsapp && <a href={waLink(content.social.whatsapp)} target="_blank" rel="noopener noreferrer" className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-mint-200 transition hover:bg-white/[0.08] hover:text-mint-100" dir="ltr"><MessageCircle size={14} /> {content.social.whatsapp}</a>}
              </div>
            )}
          </div>
          <div className="grid gap-3">
            {content.highlights.map((hl, i) => {
              const Icon = HL_ICONS[hl.icon] ?? Sparkles;
              return (
                <div key={i} className="card flex items-start gap-3 p-4 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300"><Icon size={18} /></span>
                  <div><p className="font-bold">{hl.title}</p><p className="mt-0.5 text-xs leading-5 text-white/50">{hl.text}</p></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Lines */}
        <section id="lines" className="scroll-mt-20 py-14">
          <div className="mb-8 text-center">
            <span className="eyebrow"><Sparkles size={14} /> خدمات</span>
            <h2 className="mt-3 text-3xl font-black">لاین‌های <span className="text-gradient">زیبایی</span></h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {salon.lines.map((line, i) => (
              <Link
                key={line.id}
                href={`/s/${salon.slug}/line/${line.slug}`}
                className="card group relative overflow-hidden border-transparent p-6 transition duration-300 hover:-translate-y-1.5 animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${LINE_THEMES[i % LINE_THEMES.length]} text-2xl shadow-lg`}>
                  {lineIcons[line.icon ?? ""] ?? "💫"}
                </div>
                <h3 className="mt-4 text-lg font-black">{line.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">{line.description}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-300">
                  رزرو و مشاهده <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Providers */}
        <section className="py-4">
          <div className="mb-8 text-center">
            <span className="eyebrow"><Users size={14} /> تیم ما</span>
            <h2 className="mt-3 text-3xl font-black">متخصص‌های <span className="text-gradient">حرفه‌ای</span></h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {salon.providers.map((p, i) => (
              <Link
                key={p.id}
                href={`/s/${salon.slug}/provider/${p.slug}`}
                className="card group flex flex-col items-center p-6 text-center transition duration-300 hover:-translate-y-1.5 animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full bg-rose-gradient opacity-70 blur-sm transition group-hover:opacity-100" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl ?? providerAvatar(p.slug)} alt={p.title ?? p.slug} className="relative h-20 w-20 rounded-full border-2 border-white/20 object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-black">{p.title ?? "خدمت‌دهنده"}</h3>
                <p className="mt-0.5 text-xs text-white/45">{p.user?.name}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{p.bio}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {p.lines.map((pl) => (
                    <span key={pl.lineId} className="badge text-[10px] text-rose-200">{pl.line.name}</span>
                  ))}
                </div>
                {p.instagram && (
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-plum-300"><Instagram size={12} /> {p.instagram}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
        {/* Testimonials */}
        {content.testimonials.length > 0 && (
          <section className="py-14">
            <div className="mb-8 text-center">
              <span className="eyebrow"><Star size={14} /> نظر مشتری‌ها</span>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">تجربه‌ی <span className="text-gradient">مراجعه‌کننده‌ها</span></h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.testimonials.map((t, i) => (
                <div key={i} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <Quote size={24} className="text-rose-400/50" />
                  <p className="mt-3 text-sm leading-7 text-white/70">«{t.text}»</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-gradient font-bold text-white">{t.name.charAt(0)}</div>
                    <div><p className="text-sm font-bold">{t.name}</p><p className="text-xs text-white/45">{t.role}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Customer reviews (real, moderated) */}
        {showReviews && (
          <section className="py-14">
            <div className="mb-8 text-center">
              <span className="eyebrow"><Star size={14} /> نظرات واقعی</span>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">امتیاز <span className="text-gradient">مراجعه‌کننده‌ها</span></h2>
              {salon.ratingCount > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/60">
                  <Star size={15} className="fill-gold-300 text-gold-300" />
                  <span className="font-bold text-gold-300">{salon.ratingValue?.toFixed(1)}</span>
                  از {salon.ratingCount} نظر
                </p>
              )}
            </div>
            {reviews.length > 0 && (
              <div className="mb-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
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
            )}
            <ReviewForm salonId={salon.id} />
          </section>
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/40">
        {whiteLabel ? (
          <p className="font-bold text-white/60">{salon.name}</p>
        ) : (
          <>
            <Wordmark className="justify-center" />
            <p className="mt-2">رزرو آنلاین با <span className="text-rose-300">سالن‌پرو</span></p>
          </>
        )}
      </footer>
    </div>
  );
}
