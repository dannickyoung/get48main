import Link from "next/link";
import { NavArrowRight } from "iconoir-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { compactDate } from "@/lib/format";
import type { ClientView } from "@/lib/retainer/assemble";

export function ClientRow({ view, hrefBase = "/clients" }: { view: ClientView; hrefBase?: string }) {
  const { client, computation } = view;
  const cur = computation?.current;

  return (
    <Link
      href={`${hrefBase}/${client.id}`}
      className="group flex flex-col gap-3 rounded-lg bg-surface p-4 ring-1 ring-border transition hover:bg-surface-2 hover:ring-border-strong sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_16px] sm:items-center sm:gap-x-8 sm:p-5"
    >
      {/* Identity */}
      <div className="min-w-0">
        <div className="truncate font-display text-[17px] font-semibold tracking-tight">{client.name}</div>
        <div className="truncate text-xs text-faint">{client.company || client.email}</div>
      </div>

      {/* This month */}
      <div className="min-w-0">
        {cur ? (
          <>
            <div className="mb-1.5 text-xs font-medium text-muted tnum">
              {cur.usedFromFresh}/{cur.allotment} this month
            </div>
            <UsageMeter allotment={cur.allotment} used={cur.usedFromFresh} variant="bar" size="sm" />
          </>
        ) : (
          <span className="text-xs text-faint">No retainer</span>
        )}
      </div>

      {/* Rollover OR overage (mutually exclusive) */}
      <div className="min-w-0 text-sm">
        {cur && cur.rollover.available > 0 ? (
          <>
            <div className="font-display font-semibold tnum text-accent">{cur.rollover.available} rolling</div>
            <div className="text-xs text-faint tnum">exp {compactDate(cur.rollover.nextExpiry)}</div>
          </>
        ) : cur && cur.overageThisPeriod > 0 ? (
          <>
            <div className="font-display font-semibold tnum text-warn">+{cur.overageThisPeriod} over</div>
            <div className="text-xs text-faint">above allotment</div>
          </>
        ) : (
          <span className="text-xs text-faint">—</span>
        )}
      </div>

      {/* Status */}
      <div className="min-w-0">
        <StatusPill health={view.health} />
      </div>

      {/* Chevron */}
      <span className="hidden text-faint transition group-hover:translate-x-0.5 group-hover:text-foreground sm:block">
        <NavArrowRight width={16} height={16} />
      </span>
    </Link>
  );
}
