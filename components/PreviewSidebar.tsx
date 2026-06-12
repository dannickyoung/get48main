"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icons, type IconName } from "@/components/nav/Icons";

const ADMIN_NAV: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "overview" },
  { label: "Clients", icon: "clients" },
  { label: "Payments", icon: "payments" },
  { label: "Rollovers", icon: "rollovers" },
  { label: "Deliveries", icon: "deliveries" },
  { label: "Trends", icon: "trends" },
  { label: "Settings", icon: "settings" },
];

const CLIENT_NAV: { label: string; icon: IconName }[] = [
  { label: "My retainer", icon: "retainer" },
  { label: "Deliveries", icon: "deliveries" },
  { label: "Payments", icon: "payments" },
];

export function PreviewSidebar() {
  const pathname = usePathname();
  const isClient = pathname === "/preview/client";
  const nav = isClient ? CLIENT_NAV : ADMIN_NAV;

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface/60 px-4 py-6 lg:flex">
      <Link href="/preview" className="px-2">
        <Logo />
      </Link>

      {/* Admin / Client toggle */}
      <div className="mt-6 flex rounded-lg bg-surface-2 p-1 ring-1 ring-border">
        <Link
          href="/preview"
          className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition ${
            !isClient ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
          }`}
        >
          Admin
        </Link>
        <Link
          href="/preview/client"
          className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition ${
            isClient ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
          }`}
        >
          Client
        </Link>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {nav.map((item, i) => {
          const Icon = Icons[item.icon];
          const active = i === 0;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? "tint-accent" : "text-muted"
              }`}
            >
              <span className={active ? "text-accent" : "text-faint"}>
                <Icon />
              </span>
              {item.label}
            </div>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl bg-surface-2 p-3">
        <div className="text-[13px] font-medium text-foreground">Preview mode</div>
        <div className="mt-0.5 text-[11px] uppercase tracking-wider text-faint">Sample data</div>
        <Link
          href="/"
          className="mt-3 block rounded-lg bg-background px-3 py-2 text-center text-xs font-semibold text-muted ring-1 ring-border transition hover:text-foreground hover:ring-border-strong"
        >
          Exit preview
        </Link>
      </div>
    </aside>
  );
}
