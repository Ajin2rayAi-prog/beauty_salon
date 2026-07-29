"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnread(0);
    setItems((it) => it.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost relative p-2"
        aria-label="اعلان‌ها"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-[#201028] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <p className="text-sm font-bold">اعلان‌ها</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] text-rose-300 hover:text-rose-200">
                خواندن همه
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/40">اعلانی ندارید</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-white/[0.04] px-4 py-3 last:border-0 ${
                    n.read ? "opacity-60" : "bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-5">{n.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-white/55">{n.body}</p>
                      {n.link && (
                        <Link href={n.link} onClick={() => setOpen(false)} className="mt-1 inline-block text-[11px] text-rose-300 hover:text-rose-200">
                          مشاهده
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
