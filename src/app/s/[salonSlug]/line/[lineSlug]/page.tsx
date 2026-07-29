import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت به سالن</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        {/* Line header */}
        <div className="card relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-gradient text-3xl">
              {lineIcons[line.icon ?? ""] ?? "💫"}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{line.name}</h1>
              <p className="mt-1.5 text-white/55">{line.description}</p>
            </div>
            <Link href={`/s/${salon.slug}/book?line=${line.slug}`} className="btn-rose px-5 py-3">
              <CalendarHeart size={18} /> رزرو این لاین
            </Link>
          </div>
        </div>

        {/* Services */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold">خدمات و قیمت‌ها</h2>
          <div className="mt-5 grid gap-3">
            {line.services.map((svc) => (
              <div key={svc.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{svc.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45"><Clock size={13} /> حدود {svc.durationMin} دقیقه</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-rose-300">{formatPrice(svc.price)}</span>
                  <Link href={`/s/${salon.slug}/book?line=${line.slug}&service=${svc.id}`} className="btn-outline px-3 py-1.5 text-xs">رزرو</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Providers in this line + portfolio preview */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold">خدمت‌دهنده‌های {line.name}</h2>
          <div className="mt-5 space-y-5">
            {line.providers.map(({ provider }) => (
              <div key={provider.id} className="card p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-plum-400/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={provider.photoUrl ?? `https://picsum.photos/seed/${provider.slug}/200/200`} alt={provider.title ?? provider.slug} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{provider.title ?? "خدمت‌دهنده"}</h3>
                    <p className="text-xs text-white/45">{provider.user?.name}</p>
                    {provider.instagram && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-plum-300"><Instagram size={11} /> {provider.instagram}</p>
                    )}
                  </div>
                  <Link href={`/s/${salon.slug}/provider/${provider.slug}`} className="btn-outline px-4 py-2 text-sm">پروفایل و نمونه‌کار</Link>
                </div>
                {provider.portfolios.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {provider.portfolios.map((pf) => (
                      <div key={pf.id} className="aspect-[3/4] overflow-hidden rounded-lg border border-white/[0.06]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition hover:scale-105" />
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
