"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { formatPrice, formatNumber, toJalali } from "@/lib/utils";
import { providerAvatar } from "@/lib/images";
import { Scissors, Users, CalendarDays, Clock, CreditCard, Store, Check, Loader2, ChevronRight, Sparkles, ShieldCheck, MessageSquareText, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

type Service = { id: string; name: string; durationMin: number; price: number };
type Line = { id: string; name: string; slug: string; icon: string | null; services: Service[] };
type Provider = {
  id: string; slug: string; title: string | null; photoUrl: string | null;
  user: { name: string } | null;
  lines: { lineId: string; line: { id: string; slug: string } }[];
};

const lineIcons: Record<string, string> = { Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶" };

// next 14 days
function nextDays(n = 14) {
  const out: { date: string; label: string; weekday: string }[] = [];
  const wd = ["یک", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    const irIdx = (d.getDay() + 1) % 7;
    out.push({ date: `${y}-${m}-${day}`, label: `${d.getDate()}`, weekday: wd[irIdx] });
  }
  return out;
}

const STEPS = ["لاین", "خدمت", "خدمت‌دهنده", "روز و ساعت", "اطلاعات و پرداخت"];

export function BookingClient({
  salonId, initialLine, initialService, initialProvider, meName, mePhone, loggedIn, lines, providers,
}: {
  salonId: string; initialLine: string; initialService: string; initialProvider: string;
  meName: string; mePhone: string; loggedIn: boolean; lines: Line[]; providers: Provider[];
}) {
  const router = useRouter();
  const days = useMemo(() => nextDays(14), []);

  const [lineId, setLineId] = useState(() => lines.find((l) => l.slug === initialLine)?.id ?? "");
  const [serviceId, setServiceId] = useState(initialService);
  const [providerId, setProviderId] = useState(() => providers.find((p) => p.slug === initialProvider)?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayOff, setDayOff] = useState(false);

  const [name, setName] = useState(meName);
  const [phone, setPhone] = useState(mePhone);
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<"IN_PERSON" | "ONLINE">("IN_PERSON");
  const [submitting, setSubmitting] = useState(false);

  // auth gate: everyone books as a real account. Server tells us if a session
  // already exists; otherwise the last step shows an inline login/signup panel.
  const [authed, setAuthed] = useState(loggedIn);
  // keep name/phone in sync when the session prop lands (e.g. after router.refresh)
  useEffect(() => { if (meName) setName(meName); }, [meName]);
  useEffect(() => { if (mePhone) setPhone(mePhone); }, [mePhone]);

  const line = lines.find((l) => l.id === lineId);
  const service = line?.services.find((s) => s.id === serviceId);
  // providers that serve the selected line
  const lineProviders = providers.filter((p) => !lineId || p.lines.some((pl) => pl.lineId === lineId));
  const provider = providers.find((p) => p.id === providerId);

  // wizard: user walks one step at a time; forward is automatic on selection.
  // If we arrive with a line (or line+service) pre-selected via query params
  // (e.g. from the line page's "رزرو نوبت"), skip straight to the first
  // step the user still needs to fill instead of re-asking for the line.
  const [current, setCurrent] = useState(() => {
    const hasLine = !!lines.find((l) => l.slug === initialLine);
    if (hasLine && initialService) return 2; // line + service known → provider
    if (hasLine) return 1;                    // line known → service
    return 0;
  });

  // advance to the next step shortly after a selection (so the highlight is visible first)
  function advanceAfter(next: number) {
    window.setTimeout(() => setCurrent((c) => (c < next ? next : c)), 220);
  }
  function goBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }
  // allow jumping back to an already-visited step via the stepper
  function goTo(i: number) {
    if (i <= current) setCurrent(i);
  }

  // reset downstream when upstream changes — but skip on first mount so a
  // deep-linked line/service pre-selection isn't wiped before the user sees it.
  const mounted = useRef(false);
  useEffect(() => { if (!mounted.current) return; setServiceId(""); setProviderId(""); setDate(""); setTime(""); }, [lineId]);
  useEffect(() => { if (!mounted.current) return; setProviderId(""); setDate(""); setTime(""); }, [serviceId]);
  useEffect(() => { if (!mounted.current) return; setDate(""); setTime(""); }, [providerId]);
  useEffect(() => { if (!mounted.current) return; setTime(""); }, [date]);
  useEffect(() => { mounted.current = true; }, []);

  // fetch slots when provider+date chosen
  useEffect(() => {
    if (!providerId || !date) { setSlots([]); return; }
    setSlotsLoading(true);
    fetch(`/api/public/slots?salonId=${salonId}&providerId=${providerId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { setSlots(d.slots ?? []); setDayOff(!!d.dayOff); })
      .catch(() => { setSlots([]); })
      .finally(() => setSlotsLoading(false));
  }, [providerId, date, serviceId, salonId]);

  async function submit() {
    if (!name.trim() || !phone.trim()) { toast.error("نام و موبایل الزامی است"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, lineId, providerId, serviceId: serviceId || null, date, time, name, phone, payMethod, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در رزرو");
      if (data.online) {
        // go to payment gateway
        const pay = await fetch("/api/payment/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authority: data.authority, appointmentId: data.appointmentId }),
        });
        const pd = await pay.json();
        if (pay.ok && pd.url) { window.location.href = pd.url; return; }
        toast.error(pd.error || "درگاه در دسترس نیست؛ نوبت با پرداخت حضوری ثبت شد");
      } else {
        toast.success(data.message || "نوبت ثبت شد");
      }
      router.push(`/s/book/success?id=${data.appointmentId}`);
    } catch (err: any) {
      toast.error(err.message || "خطا در رزرو");
    } finally {
      setSubmitting(false);
    }
  }

  const deposit = service ? Math.round(service.price * 0.3) : 0;

  // called by AuthGate once phone login/signup succeeds
  function onAuthed(authedPhone: string) {
    setAuthed(true);
    if (!phone.trim()) setPhone(authedPhone);
    // pull the fresh session (name/phone) back into props without a full reload
    router.refresh();
    toast.success("خوش آمدید — ادامهٔ رزرو");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* stepper */}
        <div className="card flex flex-wrap gap-2 p-4">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => goTo(i)}
              disabled={i > current}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${i === current ? "bg-rose-gradient text-white" : i < current ? "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25" : "bg-white/[0.05] text-white/40"} ${i <= current ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20 text-[10px]">
                {i < current ? <Check size={11} /> : formatNumber(i + 1)}
              </span>
              {s}
            </button>
          ))}
        </div>

        {/* Step 0: line */}
        {current === 0 && (
        <Section icon={<Scissors size={18} />} title="۱. انتخاب لاین" done={!!lineId}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {lines.map((l) => (
              <button key={l.id} onClick={() => { setLineId(l.id); advanceAfter(1); }}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${lineId === l.id ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08] hover:border-white/20"}`}>
                <span className="text-2xl">{lineIcons[l.icon ?? ""] ?? "💫"}</span>
                <span className="text-sm font-semibold">{l.name}</span>
              </button>
            ))}
          </div>
        </Section>
        )}

        {/* Step 1: service */}
        {current === 1 && (
          <Section icon={<Sparkles size={18} />} title="۲. انتخاب خدمت" done={!!serviceId}>
            <div className="grid gap-2.5">
              {line?.services.map((s) => (
                <button key={s.id} onClick={() => { setServiceId(s.id); advanceAfter(2); }}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-right transition ${serviceId === s.id ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08] hover:border-white/20"}`}>
                  <span>
                    <span className="font-semibold">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-white/45">{formatNumber(s.durationMin)} دقیقه</span>
                  </span>
                  <span className="font-extrabold text-rose-300">{formatPrice(s.price)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Step 2: provider */}
        {current === 2 && (
          <Section icon={<Users size={18} />} title="۳. انتخاب خدمت‌دهنده" done={!!providerId}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {lineProviders.map((p) => (
                <button key={p.id} onClick={() => { setProviderId(p.id); advanceAfter(3); }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${providerId === p.id ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08] hover:border-white/20"}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photoUrl ?? providerAvatar(p.slug)} alt={p.title ?? ""} className="h-full w-full object-cover" />
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="block text-xs text-white/45">{p.user?.name}</span>
                  </span>
                </button>
              ))}
              {lineProviders.length === 0 && <p className="text-sm text-white/40">خدمت‌دهنده‌ای برای این لاین فعال نیست.</p>}
            </div>
          </Section>
        )}

        {/* Step 3: date & time */}
        {current === 3 && (
          <Section icon={<CalendarDays size={18} />} title="۴. انتخاب روز و ساعت" done={!!(date && time)}>
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button key={d.date} onClick={() => setDate(d.date)}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2.5 transition ${date === d.date ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08] hover:border-white/20"}`}>
                    <span className="text-[11px] text-white/50">{d.weekday}</span>
                    <span className="mt-0.5 font-bold">{d.label}</span>
                  </button>
                ))}
              </div>
              {date && (
                <div>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 size={16} className="animate-spin" /> در حال بارگذاری ساعت‌ها…</div>
                  ) : dayOff ? (
                    <p className="text-sm text-amber-400">خدمت‌دهنده در این روز تعطیل است.</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-white/40">ساعت خالی برای این روز وجود ندارد.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {slots.map((t) => (
                        <button key={t} onClick={() => { setTime(t); advanceAfter(4); }}
                          className={`rounded-lg border py-2 text-sm font-semibold transition ${time === t ? "border-rose-400/50 bg-rose-400/20 text-rose-200" : "border-white/[0.08] text-white/70 hover:border-white/20"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Step 4: info & payment */}
        {current === 4 && (
          <Section icon={<CreditCard size={18} />} title="۵. اطلاعات و پرداخت">
            {!authed ? (
              <AuthGate onAuthed={onAuthed} />
            ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">نام و نام خانوادگی</label><input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" /></div>
                <div><label className="label">موبایل</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1.5" dir="ltr" placeholder="09..." /></div>
              </div>
              <div><label className="label">مشکلات یا درخواست‌های شما (اختیاری)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-1.5 min-h-20" placeholder="اگر حساسیت، مشکل پوستی/مویی یا درخواست خاصی دارید بنویسید تا خدمت‌دهنده قبل از نوبت ببیند." /></div>

              <div>
                <label className="label">روش پرداخت</label>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                  <button onClick={() => setPayMethod("IN_PERSON")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${payMethod === "IN_PERSON" ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08]"}`}>
                    <Store size={20} className="text-amber-300" />
                    <span><span className="block font-semibold">حضوری در سالن</span><span className="block text-xs text-white/45">هنگام مراجعه پرداخت کنید</span></span>
                  </button>
                  <button onClick={() => setPayMethod("ONLINE")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${payMethod === "ONLINE" ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08]"}`}>
                    <CreditCard size={20} className="text-sky-300" />
                    <span><span className="block font-semibold">آنلاین (بیعانه)</span><span className="block text-xs text-white/45">{formatPrice(deposit)} بیعانه — باقی در سالن</span></span>
                  </button>
                </div>
              </div>

              <button onClick={submit} disabled={submitting} className="btn-rose w-full py-3.5 text-base">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {payMethod === "ONLINE" ? "پرداخت بیعانه و رزرو" : "ثبت نوبت"}
              </button>
            </div>
            )}
          </Section>
        )}

        {/* wizard navigation — forward is automatic on selection; only "back" is manual */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={current === 0}
            className="btn-outline px-5 py-2.5 text-sm disabled:opacity-40"
          >
            <ChevronRight size={16} /> مرحله قبل
          </button>

          <span className="text-xs text-white/45">
            {current < STEPS.length - 1
              ? "با انتخاب هر گزینه، خودکار به مرحله بعد می‌روید"
              : "برای نهایی‌کردن، دکمه‌ی ثبت را بزنید"}
          </span>
        </div>
      </div>

      {/* summary sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card-glow p-6">
          <h3 className="flex items-center gap-2 text-lg font-black"><Sparkles size={16} className="text-rose-300" /> خلاصه رزرو</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="لاین" value={line?.name} />
            <Row label="خدمت" value={service?.name} />
            <Row label="خدمت‌دهنده" value={provider?.title ?? undefined} />
            <Row label="تاریخ" value={date ? toJalali(date) : undefined} />
            <Row label="ساعت" value={time || undefined} />
            <div className="divider" />
            <Row label="مدت" value={service ? `${formatNumber(service.durationMin)} دقیقه` : undefined} />
            <div className="flex items-center justify-between">
              <span className="text-white/50">مبلغ</span>
              <span className="font-extrabold text-rose-300">{service ? formatPrice(service.price) : "—"}</span>
            </div>
            {payMethod === "ONLINE" && service && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">بیعانه (۳۰٪)</span>
                <span className="font-semibold text-sky-300">{formatPrice(deposit)}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({ icon, title, done, children }: { icon: React.ReactNode; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="card p-6 animate-fade-up">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-300">{icon}</span>
        <h2 className="text-lg font-black">{title}</h2>
        {done && <span className="mr-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-300"><Check size={14} /></span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white/90">{value ?? "—"}</span>
    </div>
  );
}

// Inline login/signup shown before payment for guests. Two paths:
//  • کد پیامکی (OTP): request a code, then sign in with phone+otp (auto-creates
//    the customer account if new).
//  • رمز عبور: sign in with phone+password; if no account exists yet we register
//    it (password must be ≥۸ با حرف کوچک، بزرگ و عدد) then sign in.
function AuthGate({ onAuthed }: { onAuthed: (phone: string) => void }) {
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const phoneOk = /^09\d{9}$/.test(phone.trim());

  async function requestCode() {
    if (!phoneOk) { toast.error("شماره موبایل معتبر نیست"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ارسال کد ناموفق بود");
      setOtpSent(true);
      setCooldown(45);
      if (data.devCode) toast.success(`کد تست: ${data.devCode}`, { duration: 8000 });
      else toast.success("کد ورود پیامک شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ارسال کد");
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    if (code.trim().length < 4) { toast.error("کد را کامل وارد کنید"); return; }
    setBusy(true);
    try {
      const r = await signIn("credentials", { phone: phone.trim(), otp: code.trim(), redirect: false });
      if (r?.ok) onAuthed(phone.trim());
      else toast.error("کد نادرست یا منقضی شده است");
    } finally { setBusy(false); }
  }

  async function passwordAuth() {
    if (!phoneOk) { toast.error("شماره موبایل معتبر نیست"); return; }
    setBusy(true);
    try {
      // existing account? try to sign in directly first
      const r = await signIn("credentials", { phone: phone.trim(), password, redirect: false });
      if (r?.ok) { onAuthed(phone.trim()); return; }
      // otherwise register a new customer (enforces password complexity), then sign in
      const reg = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const rd = await reg.json();
      if (!reg.ok) throw new Error(rd.error || "ثبت‌نام ناموفق بود");
      const r2 = await signIn("credentials", { phone: phone.trim(), password, redirect: false });
      if (r2?.ok) onAuthed(phone.trim());
      else toast.error("ورود ناموفق بود");
    } catch (err: any) {
      toast.error(err.message || "خطا در ورود");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-sm leading-6 text-white/75">
          برای نهایی‌کردن نوبت، ابتدا با موبایل خود وارد شوید یا ثبت‌نام کنید تا نوبت‌هایتان در پروفایل ثبت شود.
        </p>
      </div>

      <div>
        <label className="label">شماره موبایل</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1.5" dir="ltr" placeholder="09..." inputMode="numeric" />
      </div>

      {/* method tabs */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("otp")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${mode === "otp" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
          <MessageSquareText size={14} /> کد پیامکی
        </button>
        <button type="button" onClick={() => setMode("password")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${mode === "password" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
          <KeyRound size={14} /> رمز عبور
        </button>
      </div>

      {mode === "otp" ? (
        <div className="space-y-3">
          {!otpSent ? (
            <button type="button" onClick={requestCode} disabled={busy || !phoneOk} className="btn-rose w-full justify-center py-3 text-sm disabled:opacity-40">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareText size={16} />} ارسال کد ورود
            </button>
          ) : (
            <>
              <div>
                <label className="label">کد ۵ رقمی پیامک‌شده</label>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="input mt-1.5 text-center tracking-[0.5em]" dir="ltr" inputMode="numeric" placeholder="—————" />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={verifyCode} disabled={busy || code.trim().length < 4} className="btn-rose flex-1 justify-center py-3 text-sm disabled:opacity-40">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} تأیید و ورود
                </button>
                <button type="button" onClick={requestCode} disabled={busy || cooldown > 0} className="btn-outline shrink-0 px-4 py-3 text-xs disabled:opacity-40">
                  {cooldown > 0 ? `ارسال مجدد (${formatNumber(cooldown)})` : "ارسال مجدد"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">رمز عبور</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input mt-1.5" dir="ltr" placeholder="••••••••" />
            <p className="mt-1.5 text-[11px] text-white/40">حساب دارید؟ رمزتان را وارد کنید. کاربر جدید؟ رمز دلخواه حداقل ۸ کاراکتر شامل حروف کوچک، بزرگ و عدد بسازید.</p>
          </div>
          <button type="button" onClick={passwordAuth} disabled={busy || !phoneOk || password.length < 6} className="btn-rose w-full justify-center py-3 text-sm disabled:opacity-40">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} ورود / ثبت‌نام
          </button>
        </div>
      )}
    </div>
  );
}
