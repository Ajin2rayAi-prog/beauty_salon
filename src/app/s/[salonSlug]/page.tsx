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

export const dynamic = "force-dynamic";

const LINE_THEMES = [
  "from-rose-500 to-plum-500", "from-coral-500 to-rose-500", "from-plum-500 to-sky-500",
  "from-mint-500 to-sky-500", "from-gold-400 to-coral-500", "from-sky-500 to-plum-500",
];

export default async function SalonPage({ params }: { params: { salonSlug: string } }) {
  const session = await getServerSession(authOptions);
  const salon = await prisma.salon.findUnique({
    where: { slug: params.salonSlug, active: true },
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

  const content = await getSalonContent(salon.id);
  const HL_ICONS: Record<string, any> = { Sparkles, Clock, Heart, Star, Shield, Award };

  const lineIcons: Record<string, string> = {
    Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
  };

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
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

      {/* Banner */}
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

      <main className="relative mx-auto max-w-5xl px-4 pb-20">
        {/* About + highlights */}
        <section className="grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> {content.about.title}</span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">{content.about.title}</h2>
            <p className="mt-4 leading-8 text-white/60">{content.about.body}</p>
            {(content.social.instagram || content.social.telegram || content.social.whatsapp) && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {content.social.instagram && <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-plum-200"><Instagram size={14} /> {content.social.instagram}</span>}
                {content.social.telegram && <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-sky-200"><Send size={14} /> {content.social.telegram}</span>}
                {content.social.whatsapp && <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-mint-200" dir="ltr"><MessageCircle size={14} /> {content.social.whatsapp}</span>}
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
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/40">
        <Wordmark className="justify-center" />
        <p className="mt-2">رزرو آنلاین با <span className="text-rose-300">سالن‌پرو</span></p>
      </footer>
    </div>
  );
}
