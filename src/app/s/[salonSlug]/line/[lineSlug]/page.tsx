import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CalendarHeart, ArrowRight, Clock, Instagram } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LinePage({
  params,
}: {
  params: { salonSlug: string; lineSlug: string };
}) {
  const salon = await prisma.salon.findUnique({ where: { slug: params.salonSlug, active: true } });
  if (!salon) notFound();

  const line = await prisma.line.findUnique({
    where: { salonId_slug: { salonId: salon.id, slug: params.lineSlug } },
    include: {
      services: { where: { active: true }, orderBy: { price: "asc" } },
      providers: {
        where: { provider: { active: true } },
        include: {
          provider: {
            include: {
              user: { select: { name: true } },
              portfolios: { orderBy: { createdAt: "desc" }, take: 4 },
            },
          },
        },
      },
    },
  });
  if (!line || !line.active) notFound();

  const lineIcons: Record<string, string> = {
    Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
  };

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت به سالن</Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-20 pt-10">
        {/* Line header */}
        <div className="card-glow relative overflow-hidden p-8 animate-fade-up">
          <div className="blob -left-10 -top-10 h-48 w-48 bg-rose-500/25" />
          <div className="blob -bottom-12 right-0 h-44 w-44 bg-plum-500/20" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-rose-gradient text-4xl shadow-xl">
              {lineIcons[line.icon ?? ""] ?? "💫"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="eyebrow"><CalendarHeart size={13} /> لاین تخصصی</span>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{line.name}</h1>
              <p className="mt-2 leading-7 text-white/60">{line.description}</p>
            </div>
            <Link href={`/s/${salon.slug}/book?line=${line.slug}`} className="btn-rose px-6 py-3.5 text-base">
              <CalendarHeart size={18} /> رزرو این لاین
            </Link>
          </div>
        </div>

        {/* Services */}
        <section className="mt-14">
          <div className="mb-6">
            <span className="eyebrow"><Clock size={13} /> منوی خدمات</span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">خدمات و <span className="text-gradient">قیمت‌ها</span></h2>
          </div>
          <div className="grid gap-3">
            {line.services.map((svc, i) => (
              <div key={svc.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="min-w-0">
                  <p className="text-lg font-bold">{svc.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45"><Clock size={13} /> حدود {svc.durationMin} دقیقه</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-rose-300">{formatPrice(svc.price)}</span>
                  <Link href={`/s/${salon.slug}/book?line=${line.slug}&service=${svc.id}`} className="btn-rose px-4 py-2 text-xs">رزرو</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Providers in this line + portfolio preview */}
        <section className="mt-14">
          <div className="mb-6">
            <span className="eyebrow"><Instagram size={13} /> متخصص‌ها</span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">خدمت‌دهنده‌های <span className="text-gradient">{line.name}</span></h2>
          </div>
          <div className="space-y-5">
            {line.providers.map(({ provider }, i) => (
              <div key={provider.id} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-rose-gradient opacity-60 blur-sm" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={provider.photoUrl ?? `https://picsum.photos/seed/${provider.slug}/200/200`} alt={provider.title ?? provider.slug} className="relative h-16 w-16 rounded-full border-2 border-white/20 object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold">{provider.title ?? "خدمت‌دهنده"}</h3>
                    <p className="text-xs text-white/45">{provider.user?.name}</p>
                    {provider.instagram && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-plum-300"><Instagram size={11} /> {provider.instagram}</p>
                    )}
                  </div>
                  <Link href={`/s/${salon.slug}/provider/${provider.slug}`} className="btn-outline px-4 py-2 text-sm">پروفایل و نمونه‌کار</Link>
                </div>
                {provider.portfolios.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2.5">
                    {provider.portfolios.map((pf) => (
                      <div key={pf.id} className="group aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
