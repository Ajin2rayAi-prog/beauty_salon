import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { providerAvatar } from "@/lib/images";
import { CalendarHeart, ArrowRight, Instagram, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({
  params,
}: {
  params: { salonSlug: string; providerSlug: string };
}) {
  const salon = await prisma.salon.findUnique({ where: { slug: params.salonSlug, active: true } });
  if (!salon) notFound();

  const provider = await prisma.provider.findUnique({
    where: { salonId_slug: { salonId: salon.id, slug: params.providerSlug } },
    include: {
      user: { select: { name: true } },
      lines: { include: { line: true } },
      portfolios: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!provider || !provider.active) notFound();

  // Group portfolios by line (key requirement: نمونه‌کار به‌تفکیک هر لاین)
  const byLine = new Map<string, { lineName: string; lineSlug: string; items: typeof provider.portfolios }>();
  const general: typeof provider.portfolios = [];

  for (const pf of provider.portfolios) {
    if (pf.lineId) {
      const pl = provider.lines.find((l) => l.lineId === pf.lineId);
      const key = pf.lineId;
      if (!byLine.has(key)) {
        byLine.set(key, { lineName: pl?.line.name ?? "لاین", lineSlug: pl?.line.slug ?? "", items: [] });
      }
      byLine.get(key)!.items.push(pf);
    } else {
      general.push(pf);
    }
  }

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

        {/* Portfolio per line */}
        {byLine.size === 0 && general.length === 0 ? (
          <div className="card mt-10 p-12 text-center">
            <Camera size={32} className="mx-auto text-white/30" />
            <p className="mt-3 text-white/45">هنوز نمونه‌کاری ثبت نشده است.</p>
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {[...byLine.entries()].map(([lineId, group]) => (
              <section key={lineId}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="eyebrow"><Camera size={13} /> نمونه‌کار</span>
                  <h2 className="text-2xl font-black text-gradient">{group.lineName}</h2>
                  <span className="badge text-[11px]">{group.items.length} نمونه</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((pf, i) => (
                    <figure key={pf.id} className="card group overflow-hidden p-0 animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="aspect-[3/4] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      </div>
                      {pf.caption && (
                        <figcaption className="p-3 text-xs leading-5 text-white/55">{pf.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            ))}

            {general.length > 0 && (
              <section>
                <h2 className="mb-5 text-2xl font-black text-gradient">نمونه‌کارهای عمومی</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {general.map((pf, i) => (
                    <figure key={pf.id} className="card group overflow-hidden p-0 animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="aspect-[3/4] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      </div>
                      {pf.caption && <figcaption className="p-3 text-xs leading-5 text-white/55">{pf.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
