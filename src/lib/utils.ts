import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jalaali from "jalaali-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount || 0) + " تومان";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n || 0);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(d);
}

/** Convert a Gregorian Date to a Persian (Jalali) label like "1403/05/12". */
export function toJalali(date: Date | string): string {
  const d = new Date(date);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${j.jy}/${p(j.jm)}/${p(j.jd)}`;
}

/** Persian weekday name (Iranian week: Saturday=first). */
const FA_DAYS = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
/** JS getDay(): Sun=0..Sat=6 — map to Iranian order Sat=0..Fri=6. */
export function iranianDayIndex(date: Date | string): number {
  const js = new Date(date).getDay(); // 0=Sun
  return (js + 1) % 7; // Sat(6)->0, Sun(0)->1 ... Fri(5)->6
}
export const DAY_LABELS = FA_DAYS;

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(date)
  );
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${formatNumber(mins)} دقیقه پیش`;
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`;
  if (days < 7) return `${formatNumber(days)} روز پیش`;
  return formatDate(date);
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    PLATFORM: "مدیر پلتفرم",
    ADMIN: "مدیر سالن",
    PROVIDER: "خدمات‌دهنده",
    CUSTOMER: "مشتری",
  };
  return map[role] || role;
}

export function statusLabel(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "در انتظار", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    CONFIRMED: { label: "تأیید شده", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    DONE: { label: "انجام شد", cls: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    CANCELLED: { label: "لغو شده", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    NO_SHOW: { label: "غیبت", cls: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
    WAITING: { label: "در انتظار", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    OFFERED: { label: "پیشنهاد شده", cls: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    CLAIMED: { label: "پذیرفته شد", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    EXPIRED: { label: "منقضی", cls: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
    PAID: { label: "پرداخت‌شده", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    UNPAID: { label: "پرداخت‌نشده", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    DEPOSIT: { label: "بیعانه", cls: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    ACTIVE: { label: "فعال", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    EXPIRED_L: { label: "منقضی", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    SUSPENDED: { label: "معلق", cls: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
  };
  return map[status] || { label: status, cls: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" };
}

export function payMethodLabel(m: string): string {
  return m === "ONLINE" ? "آنلاین" : "حضوری";
}

export function pricingModeLabel(m: string): string {
  return m === "RENT" ? "اجاره ثابت" : "درصدی";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}

/** Compute the salon/provider revenue split for a captured amount. */
export function splitRevenue(
  amount: number,
  pricingMode: string,
  commissionPercent: number
): { salonShare: number; providerShare: number } {
  if (pricingMode === "RENT") {
    // provider pays fixed rent separately; service revenue fully theirs
    return { salonShare: 0, providerShare: amount };
  }
  // PERCENTAGE: salon takes commissionPercent%
  const salonShare = Math.round((amount * (commissionPercent || 0)) / 100);
  return { salonShare, providerShare: amount - salonShare };
}
