"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SelectField } from "@/components/ui/SelectField";

export type FilterTab = { value: string; label: string; count?: number; tone?: "bad" | "warn" };
export type FilterSelect = { name: string; label: string; options: { value: string; label: string }[]; allLabel: string };

const selectCls =
  "rounded-lg bg-surface px-3 py-2 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";

/**
 * URL-driven filter bar: a segmented status control (links) plus dropdown
 * filters. State lives in the query string so views are shareable and the
 * back button works; the page (a server component) reads `searchParams`.
 */
export function FilterBar({
  tabParam = "view",
  tabs,
  activeTab,
  selects,
}: {
  tabParam?: string;
  tabs: FilterTab[];
  activeTab: string;
  selects: FilterSelect[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 transition-opacity ${pending ? "opacity-70" : ""}`}>
      <div role="tablist" className="inline-flex rounded-xl bg-surface p-1 ring-1 ring-border">
        {tabs.map((t) => {
          const on = t.value === activeTab;
          return (
            <Link
              key={t.value}
              href={withParam(tabParam, t.value)}
              role="tab"
              aria-selected={on}
              scroll={false}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                on ? "bg-surface-3 text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tnum ${
                    t.tone === "bad" ? "tint-bad" : t.tone === "warn" ? "tint-warn" : on ? "tint-accent" : "tint-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selects.map((s) => (
          <label key={s.name} className="flex items-center gap-2 text-xs text-faint">
            <span className="sr-only">{s.label}</span>
            <SelectField
              aria-label={s.label}
              value={params.get(s.name) ?? ""}
              onChange={(e) => start(() => router.replace(withParam(s.name, e.target.value), { scroll: false }))}
              className={selectCls}
            >
              <option value="">{s.allLabel}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </label>
        ))}
      </div>
    </div>
  );
}
