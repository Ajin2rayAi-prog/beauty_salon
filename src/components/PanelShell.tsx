"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LucideIcon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Logo";
import NotificationBell from "./NotificationBell";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function PanelShell({
  roleLabel,
  items,
  user,
  children,
}: {
  roleLabel: string;
  items: NavItem[];
  user: { name: string; avatar?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href + "/"));
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            className={cn("nav-link", active && "active")}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-white/[0.06] bg-[#1a0b20]/80 p-5 backdrop-blur lg:flex">
        <Link href="/" className="mb-1 block"><Wordmark /></Link>
        <p className="mb-6 text-[11px] text-white/40">{roleLabel}</p>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <UserCard user={user} />
      </aside>

      {/* Mobile topbar + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#160a1c]/85 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="btn-ghost p-2" aria-label="منو">
            <Menu size={20} />
          </button>
          <Wordmark />
          <NotificationBell />
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-white/10 bg-[#1a0b20] p-5">
              <div className="mb-6 flex items-center justify-between">
                <Wordmark />
                <button onClick={() => setOpen(false)} className="btn-ghost p-2" aria-label="بستن">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{nav}</div>
              <UserCard user={user} />
            </div>
          </div>
        )}

        {/* Desktop topbar */}
        <header className="sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-white/[0.06] bg-[#160a1c]/70 px-8 py-3 backdrop-blur lg:flex">
          <NotificationBell />
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: { name: string; avatar?: string | null } }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-gradient font-bold text-white">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          user.name.charAt(0)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="text-[11px] text-white/40">حساب کاربری</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn-ghost p-2 text-white/60 hover:text-rose-300"
        title="خروج"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
