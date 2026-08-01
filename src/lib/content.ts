/**
 * Site content (CMS) — flexible JSON content blocks stored in the SiteSetting
 * key/value table.
 *
 *  - PLATFORM content (the marketing landing page)  -> key "platform:content"
 *  - per-salon content (public salon page)          -> key `salon:${salonId}:content`
 *
 * Stored value is a JSON string; readers merge it over typed defaults so a
 * missing/partial record still renders a complete page. Safe to import from
 * server components and API routes (touches prisma only inside the async fns).
 */
import { prisma } from "./prisma";

// ── Platform (landing) content ──────────────────────────────────────────────
export type PlatformStat = { label: string; value: string };
export type PlatformFeature = { icon: string; title: string; text: string };
export type PlatformStep = { title: string; text: string };
export type Testimonial = { name: string; role: string; text: string };

export type PlatformContent = {
  brandName: string;
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: PlatformStat[];
  features: PlatformFeature[];
  steps: PlatformStep[];
  testimonials: Testimonial[];
  contact: { phone: string; email: string; address: string; instagram: string };
  footerNote: string;
};

export const defaultPlatformContent: PlatformContent = {
  brandName: "سالن‌پرو",
  hero: {
    eyebrow: "پلتفرم نوبت‌دهی سالن‌های زیبایی",
    title: "سالن زیباییت رو",
    highlight: "آنلاین کن",
    subtitle:
      "رزرو نوبت ۲۴ ساعته، مدیریت خدمت‌دهنده‌ها، گزارش مالی هر لاین و نمونه‌کارهای حرفه‌ای — همه در یک داشبورد فارسی و ساده.",
    ctaPrimary: "شروع رایگان",
    ctaSecondary: "دیدن دموی سالن",
  },
  stats: [
    { label: "سالن فعال", value: "۲٫۵ک+" },
    { label: "نوبت موفق", value: "۱۸۰ک+" },
    { label: "رضایت مشتری", value: "۴٫۹" },
    { label: "خدمت‌دهنده", value: "۹ک+" },
  ],
  features: [
    { icon: "CalendarHeart", title: "رزرو ۲۴ ساعته", text: "مشتری هر ساعت شبانه‌روز نوبت خالی رو می‌بینه و همون‌جا رزرو می‌کنه." },
    { icon: "Wallet", title: "گزارش مالی هر لاین", text: "درآمد، سهم سالن و سهم خدمت‌دهنده به تفکیک لاین و ماه." },
    { icon: "Users", title: "پنل خدمت‌دهنده", text: "هر متخصص تقویم، نوبت‌ها و نمونه‌کارهای خودش رو مدیریت می‌کنه." },
    { icon: "Bell", title: "یادآوری و جایگزین", text: "پیامک یادآوری و صف انتظار خودکار برای نوبت‌های لغوشده." },
  ],
  steps: [
    { title: "سالن رو بساز", text: "لاین‌ها، خدمت‌ها و خدمت‌دهنده‌ها رو در چند دقیقه اضافه کن." },
    { title: "لینک رو بفرست", text: "لینک اختصاصی سالن رو در اینستاگرام و بایو بذار." },
    { title: "نوبت‌ها بیان", text: "رزروها مستقیم میان تو داشبورد و تقویم خدمت‌دهنده." },
  ],
  testimonials: [
    { name: "نگار محمدی", role: "مدیر سالن رز", text: "از وقتی نوبت‌دهی آنلاین شد، دیگه پشت تلفن نمی‌مونیم و نوبت‌های خالی پر شدن." },
    { name: "سارا کریمی", role: "میکاپ‌آرتیست", text: "نمونه‌کارهام رو مشتری قبل از رزرو می‌بینه؛ کیفیت مشتری‌ها خیلی بهتر شده." },
    { name: "مریم رضایی", role: "مدیر سالن گلایل", text: "گزارش مالی هر لاین رو جدا می‌بینم و تسویه با خانم‌ها شفاف شده." },
  ],
  contact: {
    phone: "۰۲۱-۹۱۰۰۰۰۰۰",
    email: "hello@salonpro.ir",
    address: "تهران، خیابان ولیعصر",
    instagram: "@salonpro.ir",
  },
  footerNote: "رزرو آنلاین سالن‌های زیبایی",
};

// ── Salon (public page) content ─────────────────────────────────────────────
export type SalonHighlight = { icon: string; title: string; text: string };
// Banner slide managed from the admin CMS — full-bleed hero slideshow images
// that management can swap daily/monthly, each with an optional title/subtitle.
export type SalonBanner = { image: string; title: string; subtitle: string };

export type SalonContent = {
  hero: { eyebrow: string; tagline: string };
  banners: SalonBanner[];
  about: { title: string; body: string };
  highlights: SalonHighlight[];
  testimonials: Testimonial[];
  social: { instagram: string; telegram: string; whatsapp: string };
  galleryTitle: string;
};

export const defaultSalonContent: SalonContent = {
  hero: { eyebrow: "به سالن ما خوش اومدی", tagline: "زیبایی تخصصی، در فضایی آرام و حرفه‌ای" },
  banners: [],
  about: {
    title: "درباره ما",
    body: "تیم ما با سال‌ها تجربه در خدمت شماست؛ از فیشیال و پاکسازی پوست تا میکاپ عروس، رنگ مو و طراحی ناخن. کیفیت، بهداشت و رضایت شما اولویت ماست.",
  },
  highlights: [
    { icon: "Sparkles", title: "متریال درجه‌یک", text: "استفاده از برندهای معتبر و اصل در همه خدمات." },
    { icon: "Clock", title: "وقت‌شناسی", text: "نوبت‌ها دقیق و بدون معطلی برگزار می‌شن." },
    { icon: "Heart", title: "محیط آرام", text: "فضایی دلنشین و خصوصی مخصوص بانوان." },
  ],
  testimonials: [
    { name: "الهه ح.", role: "مشتری", text: "برخورد عالی و کار تمیز. حتماً دوباره میام." },
    { name: "باران ر.", role: "مشتری", text: "میکاپ عروسم فوق‌العاده بود، همه تعریف کردن." },
  ],
  social: { instagram: "", telegram: "", whatsapp: "" },
  galleryTitle: "نمونه‌کارهای ما",
};

// ── Readers / writers ────────────────────────────────────────────────────────
function merge<T>(base: T, patch: Partial<T> | null): T {
  if (!patch || typeof patch !== "object") return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k of Object.keys(patch)) {
    const bv = (base as any)[k];
    const pv = (patch as any)[k];
    if (pv && typeof pv === "object" && !Array.isArray(pv) && bv && typeof bv === "object" && !Array.isArray(bv)) {
      out[k] = merge(bv, pv);
    } else if (pv !== undefined && pv !== null) {
      out[k] = pv;
    }
  }
  return out;
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return merge(fallback, JSON.parse(row.value));
  } catch {
    return fallback;
  }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: json },
    create: { key, value: json },
  });
}

const PLATFORM_KEY = "platform:content";
const salonKey = (salonId: string) => `salon:${salonId}:content`;

export const getPlatformContent = () => readSetting(PLATFORM_KEY, defaultPlatformContent);
export const savePlatformContent = (c: PlatformContent) => writeSetting(PLATFORM_KEY, c);

export const getSalonContent = (salonId: string) => readSetting(salonKey(salonId), defaultSalonContent);
export const saveSalonContent = (salonId: string, c: SalonContent) => writeSetting(salonKey(salonId), c);
