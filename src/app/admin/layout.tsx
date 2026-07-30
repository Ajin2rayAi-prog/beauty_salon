import { requireRole, ROLES, activeSalonId, tenantSalons } from "@/lib/auth-guards";
import { PanelShell, NavItem } from "@/components/PanelShell";
import { prisma } from "@/lib/prisma";
import { getSalonEntitlements } from "@/lib/entitlements";
import { SalonSwitcher } from "@/components/SalonSwitcher";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.ADMIN]);

  const salonId = await activeSalonId(user);
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { name: true },
  });

  const ent = await getSalonEntitlements(salonId);
  const on = (k: Parameters<typeof gate>[1]) => gate(ent?.features, k);

  const salons = on("multiBranch") ? await tenantSalons(user) : [];

  const items: NavItem[] = [
    { href: "/admin", label: "داشبورد", icon: "LayoutDashboard" },
    { href: "/admin/lines", label: "لاین‌ها و خدمات", icon: "Scissors" },
    { href: "/admin/providers", label: "خدمت‌دهنده‌ها", icon: "Users" },
    { href: "/admin/appointments", label: "نوبت‌ها", icon: "CalendarClock" },
    ...(on("customerRecords") ? [{ href: "/admin/customers", label: "پرونده مشتریان", icon: "ClipboardList" } as NavItem] : []),
    ...(on("inventory") ? [{ href: "/admin/inventory", label: "انبار", icon: "Package" } as NavItem] : []),
    ...(on("finance") ? [{ href: "/admin/finance", label: "گزارش مالی", icon: "Wallet" } as NavItem] : []),
    ...(on("reviews") ? [{ href: "/admin/reviews", label: "نظرات مشتریان", icon: "Star" } as NavItem] : []),
    { href: "/admin/content", label: "محتوای سایت", icon: "FileText" },
    { href: "/admin/notifications", label: "اعلان‌ها", icon: "Bell" },
    { href: "/admin/settings", label: "تنظیمات سالن", icon: "Settings" },
  ];

  return (
    <PanelShell
      roleLabel={salon?.name ? `مدیریت • ${salon.name}` : "مدیریت سالن"}
      items={items}
      user={{ name: user.name ?? "مدیر", avatar: (user as any).avatar }}
      topSlot={salons.length > 1 ? <SalonSwitcher salons={salons} activeId={salonId} /> : undefined}
    >
      {children}
    </PanelShell>
  );
}

function gate(features: Record<string, boolean> | undefined, key: string): boolean {
  return !!features?.[key];
}
