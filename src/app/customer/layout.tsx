import { requireRole, ROLES } from "@/lib/auth-guards";
import { PanelShell, NavItem } from "@/components/PanelShell";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.CUSTOMER]);

  const items: NavItem[] = [
    { href: "/customer", label: "نوبت‌های من", icon: "CalendarHeart" },
    { href: "/", label: "رزرو جدید", icon: "LayoutDashboard" },
  ];

  return (
    <PanelShell roleLabel="پنل مشتری" items={items} user={{ name: user.name ?? "مشتری", avatar: (user as any).avatar }}>
      {children}
    </PanelShell>
  );
}
