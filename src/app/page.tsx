import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getPlatformContent } from "@/lib/content";
import { lineImage, providerAvatar, HERO_IMAGES } from "@/lib/images";
import {
  CalendarHeart, Sparkles, Users, ShieldCheck, Clock, ArrowLeft, Instagram,
  Star, BellRing, Wallet, Repeat2, MapPin, Phone, Quote, Check, Heart, Scissors,
  Bell, type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  CalendarHeart, Wallet, Users, Bell, Sparkles, Scissors, Repeat2, BellRing, ShieldCheck, Clock, Heart, Star,
};

const LINE_EMOJI: Record<string, string> = {
  Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
};
const FEATURE_TONES = ["text-rose-300", "text-plum-300", "text-coral-300", "text-mint-300", "text-gold-300", "text-sky-300"];

async function getSalon() {
  return prisma.salon.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      lines: { where: { active: true }, orderBy: { order: "asc" } },
      providers: {
        where: { active: true },
        include: {
          lines: { include: { line: true } },
          portfolios: { take: 3, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
}

export default async function Home() {
  const salon = await getSalon();
  const content = await getPlatformContent();

  if (!salon) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <Wordmark className="justify-center" />
          <p className="mt-6 text-white/60">هنوز سالنی ثبت نشده است. مدیر پلتفرم وارد شود و سالن بسازد.</p>
          <Link href="/login" className="btn-rose mt-6 inline-flex">ورود مدیریت پلتفرم</Link>
        </div>
      </div>
    );
  }

  const gallery = salon.providers
    .flatMap((p) => p.portfolios.map((pf) => ({ ...pf, provider: p.title ?? p.slug })))
    .slice(0, 8);

  const h = content.hero;
  return (
    <div className="relative min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/"><Wordmark /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#lines" className="nav-link">لاین‌ها</a>
            <a href="#features" className="nav-link">چرا ما</a>
            <a href="#providers" className="nav-link">متخصص‌ها</a>
            <a href="#gallery" className="nav-link">نمونه‌کار</a>
            <a href="#contact" className="nav-link">تماس</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost px-3 py-2 text-sm">ورود</Link>
            <Link href={`/s/${salon.slug}`} className="btn-rose px-4 py-2 text-sm">
              <CalendarHeart size={16} /> {h.ctaPrimary}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — editorial: real image collage on the right, headline ribbon on the left */}
      <section className="relative overflow-hidden">
        <div className="blob animate-float -right-16 top-0 h-72 w-72 bg-rose-500/25" />
        <div className="blob animate-float delay-3 left-0 top-24 h-72 w-72 bg-plum-500/20" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10">
            <span className="eyebrow animate-fade-up"><Sparkles size={14} /> {h.eyebrow}</span>
            <h1 className="mt-5 animate-fade-up delay-1 text-4xl font-black leading-[1.12] sm:text-6xl">
              {h.title} <span className="text-gradient">{h.highlight}</span>
            </h1>
            <p className="mt-6 max-w-lg animate-fade-up delay-2 text-lg leading-8 text-white/65">{h.subtitle}</p>
            <div className="mt-8 flex animate-fade-up delay-3 flex-wrap gap-3">
              <Link href={`/s/${salon.slug}`} className="btn-rose px-7 py-3.5 text-base"><CalendarHeart size={19} /> {h.ctaPrimary}</Link>
              <a href="#lines" className="btn-outline px-7 py-3.5 text-base">{h.ctaSecondary} <ArrowLeft size={17} /></a>
            </div>
            <div className="mt-10 flex animate-fade-up delay-4 flex-wrap gap-x-8 gap-y-4">
              {content.stats.map((s) => (
                <div key={s.label} className="border-r-2 border-rose-400/40 pr-3">
                  <p className="text-2xl font-black text-gradient">{s.value}</p>
                  <p className="text-[11px] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* collage */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-rose-500/25 via-coral-500/15 to-plum-500/25 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-3.5">
              {/* eslint-disable @next/next/no-img-element */}
              <img src={HERO_IMAGES[0]} alt="سالن زیبایی" className="animate-fade-up delay-1 col-span-1 aspect-[3/4] w-full rounded-[1.6rem] border border-white/10 object-cover shadow-2xl" />
              <img src={HERO_IMAGES[2]} alt="میکاپ" className="animate-fade-up delay-2 mt-10 aspect-[3/4] w-full rounded-[1.6rem] border border-white/10 object-cover shadow-2xl" />
              <img src={HERO_IMAGES[3]} alt="ناخن" className="animate-fade-up delay-3 -mt-4 aspect-[4/3] w-full rounded-[1.6rem] border border-white/10 object-cover shadow-2xl" />
              <img src={HERO_IMAGES[1]} alt="پوست" className="animate-fade-up delay-4 aspect-[4/3] w-full rounded-[1.6rem] border border-white/10 object-cover shadow-2xl" />
              {/* eslint-enable @next/next/no-img-element */}
            </div>
            <div className="glass absolute bottom-6 -left-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl animate-float">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-gradient text-xs font-black text-white ring-2 ring-[#0f0716]">۴٫۹</span>
              <div className="text-xs"><p className="font-bold">رضایت مشتریان</p><p className="text-white/50">از ۵ ستاره</p></div>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="border-y border-white/[0.06] bg-white/[0.02] py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-white/45">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint-400" /> رزرو بدون تماس</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint-400" /> یادآوری خودکار</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint-400" /> صف جایگزین</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint-400" /> پرداخت امن</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-mint-400" /> نمونه‌کار متخصص‌ها</span>
          </div>
        </div>
      </section>
      {/* Lines — real image cover cards */}
      <section id="lines" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow"><Scissors size={14} /> خدمات ما</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">لاین‌های <span className="text-gradient">زیبایی</span></h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/50">هر لاین متخصص‌ها و خدمات مخصوص خودش را دارد؛ روی هرکدام بزن و رزرو کن.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {salon.lines.map((line, i) => (
            <Link
              key={line.id}
              href={`/s/${salon.slug}/line/${line.slug}`}
              className="group relative overflow-hidden rounded-[1.6rem] border border-white/[0.08] transition duration-300 hover:-translate-y-1.5 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lineImage(line.slug, 11 + i)} alt={line.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  {LINE_EMOJI[line.icon ?? ""] ?? "💫"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-xl font-black text-white">{line.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/70">{line.description}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-rose-200">
                  مشاهده و رزرو <ArrowLeft size={15} className="transition group-hover:-translate-x-1.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <span className="eyebrow"><Heart size={14} /> چرا {content.brandName}</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">تجربه‌ای که <span className="text-gradient">دوستش داری</span></h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Sparkles;
            return (
              <div key={i} className="card animate-fade-up p-6" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] ${FEATURE_TONES[i % FEATURE_TONES.length]}`}>
                  <Icon size={24} />
                </div>
                <h3 className="mt-5 text-lg font-black">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card-glow relative overflow-hidden p-8 sm:p-12">
          <div className="blob right-10 top-0 h-48 w-48 bg-plum-500/25" />
          <div className="relative mb-10 text-center">
            <span className="eyebrow"><Clock size={14} /> فقط چند قدم</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">رزرو در چند ثانیه</h2>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-3">
            {content.steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-gradient text-2xl font-black text-white shadow-lg animate-pulse-glow">
                  {["۱", "۲", "۳", "۴", "۵"][i] ?? i + 1}
                </div>
                <h3 className="mt-5 text-lg font-black">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Providers */}
      <section id="providers" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <span className="eyebrow"><Users size={14} /> تیم ما</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">متخصص‌های <span className="text-gradient">حرفه‌ای</span></h2>
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
                <img src={p.photoUrl ?? providerAvatar(p.slug)} alt={p.title ?? p.slug} className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover" />
              </div>
              <h3 className="mt-4 text-lg font-black">{p.title ?? "خدمت‌دهنده"}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">{p.bio}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {p.lines.map((pl) => (
                  <span key={pl.lineId} className="badge text-[11px] text-rose-200">{pl.line.name}</span>
                ))}
              </div>
              {p.instagram && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-plum-300"><Instagram size={13} /> {p.instagram}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <span className="eyebrow"><Sparkles size={14} /> نمونه‌کارها</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">هنر دست <span className="text-gradient">متخصص‌های ما</span></h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((g, i) => (
              <div key={g.id} className={`group relative overflow-hidden rounded-2xl border border-white/10 ${i % 3 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.caption ?? "نمونه‌کار"} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-semibold text-white">{g.caption ?? g.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <span className="eyebrow"><Star size={14} /> نظر مشتری‌ها</span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">آن‌ها <span className="text-gradient">عاشقمان</span> شدند</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {content.testimonials.map((t, i) => (
              <div key={i} className="card animate-fade-up p-6" style={{ animationDelay: `${i * 0.06}s` }}>
                <Quote size={26} className="text-rose-400/50" />
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} className="fill-gold-400 text-gold-400" />)}
                </div>
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

      {/* Contact / CTA */}
      <section id="contact" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card-glow relative overflow-hidden p-8 sm:p-12">
          <div className="blob -left-10 -top-10 h-52 w-52 bg-rose-500/30" />
          <div className="blob -bottom-10 right-0 h-52 w-52 bg-plum-500/25" />
          <div className="relative grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">با ما در تماس باش 💌</h2>
              <p className="mt-4 leading-7 text-white/60">{salon.address}</p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-300"><Clock size={16} /></span> ساعت کار: {salon.openTime} تا {salon.closeTime}</p>
                <p className="flex items-center gap-3" dir="ltr"><span className="grid h-9 w-9 place-items-center rounded-xl bg-plum-500/15 text-plum-300"><Phone size={16} /></span> {salon.phone}</p>
                <p className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-mint-500/15 text-mint-300"><MapPin size={16} /></span> {salon.city}</p>
              </div>
            </div>
            <div className="flex flex-col items-start justify-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-xl font-bold leading-8">آماده‌ای برای <span className="text-gradient">درخشیدن</span>؟ همین حالا نوبتت را بگیر.</p>
              <Link href={`/s/${salon.slug}`} className="btn-rose px-7 py-3.5 text-base"><CalendarHeart size={19} /> {h.ctaPrimary}</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10 text-center">
        <Wordmark className="justify-center" />
        <p className="mt-3 text-sm text-white/40">© {new Date().getFullYear()} — {content.footerNote} · <span className="text-rose-300">{content.brandName}</span></p>
      </footer>
    </div>
  );
}
