"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icons, type IconName } from "@/components/nav/Icons";

export type NavItem = { href: string; label: string; icon: IconName };

export function AppShell({
  items,
  email,
  roleLabel,
  homeHref,
  children,
}: {
  items: NavItem[];
  email: string;
  roleLabel: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === homeHref ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface/60 px-4 py-6 lg:flex">
        <Link href={homeHref} className="px-2">
          <Logo />
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const Icon = Icons[item.icon];
            const on = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  on ? "tint-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span className={on ? "text-accent" : "text-faint group-hover:text-muted"}>
                  <Icon />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl bg-surface-2 p-3">
          <div className="truncate text-[13px] font-medium text-foreground">{email}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-faint">{roleLabel}</div>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="w-full rounded-lg bg-background px-3 py-2 text-xs font-semibold text-muted ring-1 ring-border transition hover:text-foreground hover:ring-border-strong">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar + scrollable nav */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-5">
            <Link href={homeHref}>
              <Logo />
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-faint transition hover:text-foreground">Sign out</button>
            </form>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {items.map((item) => {
              const on = active(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    on ? "tint-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
