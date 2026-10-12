import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { accessDaysLeft } from "@/lib/retainer/access";
import { parseDateOnly } from "@/lib/retainer/engine";
import { shortDate } from "@/lib/format";
import { todaySGTString } from "@/lib/time";
import { AppShell, type NavItem } from "@/components/nav/AppShell";

const NAV: NavItem[] = [
  { href: "/me", label: "My retainer", icon: "retainer" },
  { href: "/me/deliveries", label: "Deliveries", icon: "deliveries" },
  { href: "/me/payments", label: "Payments", icon: "payments" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireClient();
  const supabase = await createClient();
  const { data: retainer } = await supabase
    .from("retainers")
    .select("status, end_date, access_until")
    .eq("client_id", profile.client_id!)
    .maybeSingle();
  const daysLeft = accessDaysLeft(retainer, todaySGTString());

  return (
    <AppShell items={NAV} email={profile.email} roleLabel="Client view" homeHref="/me">
      {daysLeft !== null && retainer && (
        <div role="status" className="mb-6 rounded-2xl bg-surface p-5 ring-1 ring-warn/40">
          <p className="text-sm font-semibold text-warn">Your retainer has ended</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {retainer.end_date ? `Your retainer ended on ${shortDate(parseDateOnly(retainer.end_date))}. ` : ""}
            Your account will only be available for another {daysLeft} {daysLeft === 1 ? "day" : "days"}, until{" "}
            <span className="font-medium text-foreground">{shortDate(parseDateOnly(retainer.access_until!))}</span>. After
            that it will be closed and your login removed, so please save anything you need before then.
          </p>
        </div>
      )}
      {children}
    </AppShell>
  );
}
