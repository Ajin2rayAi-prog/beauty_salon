import { requireRole, ROLES } from "@/lib/auth-guards";
import { PanelShell, NavItem } from "@/components/PanelShell";
import { LayoutDashboard, CalendarDays, Clock, Camera, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.PROVIDER]);

  const items: NavItem[] = [
    { href: "/provider", label: "داشبورد", icon: LayoutDashboard },
    { href: "/provider/calendar", label: "تقویم نوبت‌ها", icon: CalendarDays },
    { href: "/provider/schedule", label: "ساعات کاری", icon: Clock },
    { href: "/provider/portfolio", label: "نمونه‌کارها", icon: Camera },
    { href: "/provider/earnings", label: "درآمد من", icon: Wallet },
  ];

  return (
    <PanelShell roleLabel="پنل خدمت‌دهنده" items={items} user={{ name: user.name ?? "خدمت‌دهنده", avatar: (user as any).avatar }}>
      {children}
    </PanelShell>
  );
}
