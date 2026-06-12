import Link from "next/link";
import { NavArrowRight } from "iconoir-react";
import { Pill } from "@/components/ui/StatusPill";
import { shortDate, relativeDays } from "@/lib/format";
import type { RolloverRow } from "@/lib/aggregate";

export function RolloversBoard({ rows }: { rows: RolloverRow[] }) {
  const holders = rows.filter((r) => r.available > 0);
  const none = rows.filter((r) => r.available === 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-border sm:p-6">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-faint">
          Carrying rollover
        </h2>
        {holders.length === 0 ? (
          <p className="rounded-lg bg-surface-2 px-3.5 py-3 text-sm text-muted">No clients are carrying rollover right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {holders.map((r) => {
              const urgent = r.days != null && r.days <= 14;
              return (
                <li key={r.clientId}>
                  <Link href={`/clients/${r.clientId}`} className="group flex items-center gap-4 py-3.5">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
                      <span className="font-display text-base font-bold leading-none tnum text-accent">{r.available}</span>
                      <span className="text-[10px] text-faint">/ {r.cap}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground group-hover:text-accent">{r.clientName}</div>
                      <div className="text-xs text-faint tnum">
                        {r.available} {r.available === 1 ? "video" : "videos"} · expires {shortDate(r.nextExpiry)}
                      </div>
                    </div>
                    {urgent ? <Pill tone="warn">{relativeDays(r.days)}</Pill> : <span className="text-xs text-faint">{relativeDays(r.days)}</span>}
                    <span className="text-faint transition group-hover:translate-x-0.5 group-hover:text-foreground">
                      <NavArrowRight width={16} height={16} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {none.length > 0 && (
        <section className="rounded-2xl bg-surface p-5 ring-1 ring-border sm:p-6">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-faint">No rollover</h2>
          <div className="flex flex-wrap gap-2">
            {none.map((r) => (
              <Link
                key={r.clientId}
                href={`/clients/${r.clientId}`}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted ring-1 ring-border transition hover:text-foreground hover:ring-border-strong"
              >
                {r.clientName}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
