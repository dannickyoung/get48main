import { requireClient } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/nav/AppShell";

const NAV: NavItem[] = [
  { href: "/me", label: "My retainer", icon: "retainer" },
  { href: "/me/deliveries", label: "Deliveries", icon: "deliveries" },
  { href: "/me/payments", label: "Payments", icon: "payments" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireClient();
  return (
    <AppShell items={NAV} email={profile.email} roleLabel="Client view" homeHref="/me">
      {children}
    </AppShell>
  );
}
