"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, Users, CalendarHeart, Sparkles } from "lucide-react";

export type HeroSlide = {
  photo: string;
  name: string;
  /** short line under the name — their role or the line they work in */
  role: string;
  /** small tag (e.g. "مدیریت" or first line name) */
  badge?: string;
};

type Props = {
  slides: HeroSlide[];
  salonName: string;
  eyebrow: string;
  tagline: string;
  openTime: string;
  closeTime: string;
  address?: string | null;
  providerCount: number;
};

const INTERVAL = 5000;

export function HeroSlider({ slides, salonName, eyebrow, tagline, openTime, closeTime, address, providerCount }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(() => setActive((i) => (i + 1) % count), INTERVAL);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, paused]);

  const current = slides[active];

  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Crossfading full-screen photos with a slow Ken-Burns drift */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.photo}
            alt={`${s.name} — ${s.role}`}
            className="h-full w-full object-cover"
            style={{
              transform: i === active ? "scale(1.08)" : "scale(1)",
              transition: `transform ${INTERVAL + 1500}ms linear`,
            }}
          />
        </div>
      ))}

      {/* Legibility overlays: bottom gradient + subtle side vignette + film grain feel */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0410] via-[#0b0410]/40 to-[#0b0410]/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,rgba(11,4,16,0.65)_100%)]" />

      {/* Top identity strip */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pt-24 sm:pt-28">
        <div className="animate-fade-up">
          <span className="eyebrow"><Sparkles size={14} /> {eyebrow}</span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-white drop-shadow sm:text-5xl">{salonName}</h1>
          <p className="mt-2 max-w-md text-sm leading-7 text-white/70 sm:text-base">{tagline}</p>
        </div>
        <div className="flex animate-fade-up flex-wrap gap-2 text-xs delay-2">
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2"><Clock size={14} className="text-rose-300" /> {openTime} تا {closeTime}</span>
          {address && <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2"><MapPin size={14} className="text-plum-300" /> {address}</span>}
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2"><Users size={14} className="text-mint-300" /> {providerCount} متخصص</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom: the changing person caption + booking CTA + slide dots */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10">
        {current && (
          <div key={active} className="animate-fade-up">
            {current.badge && (
              <span className="mb-3 inline-flex rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-100 ring-1 ring-inset ring-rose-300/30 backdrop-blur">
                {current.badge}
              </span>
            )}
            <h2 className="text-2xl font-black text-white drop-shadow sm:text-4xl">{current.name}</h2>
            <p className="mt-1.5 text-sm text-rose-100/85 sm:text-lg">{current.role}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href="#lines" className="btn-rose px-6 py-3 text-sm"><CalendarHeart size={17} /> رزرو نوبت</a>
          {count > 1 && (
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`نمایش ${s.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-rose-400" : "w-2.5 bg-white/30 hover:bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
