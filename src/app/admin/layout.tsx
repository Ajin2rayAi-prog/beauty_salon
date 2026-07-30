import { requireRole, ROLES } from "@/lib/auth-guards";
import { PanelShell, NavItem } from "@/components/PanelShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.ADMIN]);

  const salon = await prisma.salon.findUnique({
    where: { id: user.salonId ?? "__none__" },
    select: { name: true },
  });

  const items: NavItem[] = [
    { href: "/admin", label: "داشبورد", icon: "LayoutDashboard" },
    { href: "/admin/lines", label: "لاین‌ها و خدمات", icon: "Scissors" },
    { href: "/admin/providers", label: "خدمت‌دهنده‌ها", icon: "Users" },
    { href: "/admin/appointments", label: "نوبت‌ها", icon: "CalendarClock" },
    { href: "/admin/finance", label: "گزارش مالی", icon: "Wallet" },
    { href: "/admin/content", label: "محتوای سایت", icon: "FileText" },
    { href: "/admin/notifications", label: "اعلان‌ها", icon: "Bell" },
    { href: "/admin/settings", label: "تنظیمات سالن", icon: "Settings" },
  ];

  return (
    <PanelShell roleLabel={salon?.name ? `مدیریت • ${salon.name}` : "مدیریت سالن"} items={items} user={{ name: user.name ?? "مدیر", avatar: (user as any).avatar }}>
      {children}
    </PanelShell>
  );
}
