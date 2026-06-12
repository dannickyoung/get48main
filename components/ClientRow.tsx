import Link from "next/link";
import { NavArrowRight } from "iconoir-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { money, compactDate } from "@/lib/format";
import type { ClientView } from "@/lib/retainer/assemble";

export function ClientRow({ view, hrefBase = "/clients" }: { view: ClientView; hrefBase?: string }) {
  const { client, computation } = view;
  const cur = computation?.current;

  return (
    <Link
      href={`${hrefBase}/${client.id}`}
      className="group grid grid-cols-2 items-center gap-4 rounded-lg bg-surface p-4 ring-1 ring-border transition hover:bg-surface-2 hover:ring-border-strong sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_130px_150px] sm:gap-5 sm:p-5"
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
      <div className="hidden text-sm sm:block">
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
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border pt-3 sm:col-span-1 sm:justify-end sm:border-0 sm:pt-0">
        {view.outstanding > 0 && <span className="text-xs font-semibold text-warn tnum sm:hidden">{money(view.outstanding)} due</span>}
        <StatusPill health={view.health} />
        <span className="text-faint transition group-hover:translate-x-0.5 group-hover:text-foreground">
          <NavArrowRight width={16} height={16} />
        </span>
      </div>
    </Link>
  );
}
