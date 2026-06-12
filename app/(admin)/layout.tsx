import { requireAdmin } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/nav/AppShell";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/payments", label: "Payments", icon: "payments" },
  { href: "/rollovers", label: "Rollovers", icon: "rollovers" },
  { href: "/deliveries", label: "Deliveries", icon: "deliveries" },
  { href: "/trends", label: "Trends", icon: "trends" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return (
    <AppShell items={NAV} email={profile.email} roleLabel="Studio admin" homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
