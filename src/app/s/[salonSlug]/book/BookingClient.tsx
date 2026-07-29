"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatNumber, toJalali } from "@/lib/utils";
import { Scissors, Users, CalendarDays, Clock, CreditCard, Store, Check, Loader2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  salonId, initialLine, initialService, initialProvider, meName, mePhone, lines, providers,
}: {
  salonId: string; initialLine: string; initialService: string; initialProvider: string;
  meName: string; mePhone: string; lines: Line[]; providers: Provider[];
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

  const line = lines.find((l) => l.id === lineId);
  const service = line?.services.find((s) => s.id === serviceId);
  // providers that serve the selected line
  const lineProviders = providers.filter((p) => !lineId || p.lines.some((pl) => pl.lineId === lineId));
  const provider = providers.find((p) => p.id === providerId);

  // wizard: user walks one step at a time (no long scroll)
  const [current, setCurrent] = useState(0);
  const stepValid = [!!lineId, !!serviceId, !!providerId, !!(date && time), true];
  const canNext = stepValid[current];

  function goNext() {
    if (canNext && current < STEPS.length - 1) setCurrent((c) => c + 1);
  }
  function goBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }
  // allow jumping back to an already-visited step via the stepper
  function goTo(i: number) {
    if (i <= current) setCurrent(i);
  }

  // reset downstream when upstream changes
  useEffect(() => { setServiceId(""); setProviderId(""); setDate(""); setTime(""); }, [lineId]);
  useEffect(() => { setProviderId(""); setDate(""); setTime(""); }, [serviceId]);
  useEffect(() => { setDate(""); setTime(""); }, [providerId]);
  useEffect(() => { setTime(""); }, [date]);

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
              <button key={l.id} onClick={() => setLineId(l.id)}
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
                <button key={s.id} onClick={() => setServiceId(s.id)}
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
                <button key={p.id} onClick={() => setProviderId(p.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${providerId === p.id ? "border-rose-400/60 bg-rose-500/15 shadow-[0_10px_30px_-14px_rgba(255,77,151,0.7)]" : "border-white/[0.08] hover:border-white/20"}`}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photoUrl ?? `https://picsum.photos/seed/${p.slug}/120/120`} alt={p.title ?? ""} className="h-full w-full object-cover" />
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
                        <button key={t} onClick={() => setTime(t)}
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
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">نام و نام خانوادگی</label><input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" /></div>
                <div><label className="label">موبایل</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1.5" dir="ltr" placeholder="09..." /></div>
              </div>
              <div><label className="label">یادداشت (اختیاری)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-1.5 min-h-20" placeholder="توضیح خاصی دارید؟" /></div>

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
          </Section>
        )}

        {/* wizard navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={current === 0}
            className="btn-outline px-5 py-2.5 text-sm disabled:opacity-40"
          >
            <ChevronRight size={16} /> مرحله قبل
          </button>

          {current < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className="btn-rose px-6 py-2.5 text-sm"
            >
              مرحله بعد <ChevronLeft size={16} />
            </button>
          ) : (
            <span className="text-xs text-white/45">برای نهایی‌کردن، دکمه‌ی ثبت را بزنید</span>
          )}
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
