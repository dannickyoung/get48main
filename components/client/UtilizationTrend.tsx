import type { RetainerComputation } from "@/lib/retainer/engine";
import { format } from "date-fns";

type Bar = { label: string; used: number; allot: number; over: number; current?: boolean };

export function UtilizationTrend({ computation }: { computation: RetainerComputation }) {
  const bars: Bar[] = [
    ...computation.periods.map((p) => ({
      label: format(p.start, "MMM"),
      used: p.totalUsed,
      allot: p.allotment,
      over: p.overage,
    })),
    {
      label: format(computation.current.periodStart, "MMM"),
      used: computation.current.totalUsedThisPeriod,
      allot: computation.current.allotment,
      over: computation.current.overageThisPeriod,
      current: true,
    },
  ].slice(-12);

  const maxVal = Math.max(1, ...bars.map((b) => Math.max(b.allot, b.used + b.over)));

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">Utilization</h2>
        <span className="text-xs text-faint">used vs allotment · last {bars.length} months</span>
      </div>

      <div className="mt-6 flex items-end gap-2 sm:gap-3" style={{ height: 128 }}>
        {bars.map((b, i) => {
          const usedH = (Math.min(b.used, b.allot) / maxVal) * 100;
          const overH = (b.over / maxVal) * 100;
          const allotMark = (b.allot / maxVal) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full max-w-9 flex-1 items-end overflow-hidden rounded-md bg-surface-3">
                {/* allotment reference line */}
                <div
                  className="absolute inset-x-0 border-t border-dashed border-border-strong/70"
                  style={{ bottom: `${allotMark}%` }}
                />
                <div className="flex w-full flex-col justify-end">
                  {overH > 0 && <div style={{ height: `${overH}%`, background: "var(--color-bad)" }} />}
                  <div
                    className={b.current ? "bg-accent" : "bg-accent/70"}
                    style={{ height: `${usedH}%`, minHeight: b.used > 0 ? 3 : 0 }}
                  />
                </div>
              </div>
              <span className={`text-[10px] tnum ${b.current ? "font-semibold text-muted" : "text-faint"}`}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-faint">
        <Legend swatch="bg-accent" label="Delivered" />
        <Legend swatch="bg-[var(--color-bad)]" label="Overage" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-3 border-t border-dashed border-border-strong" /> Allotment
        </span>
      </div>
    </section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${swatch}`} /> {label}
    </span>
  );
}
