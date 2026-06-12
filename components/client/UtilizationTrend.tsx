import { format } from "date-fns";
import { AreaTrend } from "@/components/charts/AreaTrend";
import type { RetainerComputation } from "@/lib/retainer/engine";

export function UtilizationTrend({ computation }: { computation: RetainerComputation }) {
  const rows = [
    ...computation.periods.map((p) => ({
      label: format(p.start, "MMM"),
      used: p.usedFromFresh,
      rollover: p.usedFromRollover,
      over: p.overage,
    })),
    {
      label: format(computation.current.periodStart, "MMM"),
      used: computation.current.usedFromFresh,
      rollover: computation.current.usedFromRollover,
      over: computation.current.overageThisPeriod,
    },
  ].slice(-12);

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">Utilization</h2>
        <span className="text-xs text-faint">videos delivered · last {rows.length} months</span>
      </div>

      <div className="mt-5">
        <AreaTrend
          data={rows}
          xKey="label"
          height={220}
          series={[
            { key: "used", label: "From allotment", color: "var(--color-accent)" },
            { key: "rollover", label: "From rollover", color: "var(--color-accent-dim)" },
            { key: "over", label: "Overage", color: "var(--color-warn)" },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-faint">
        <Legend swatch="var(--color-accent)" label="From allotment" />
        <Legend swatch="var(--color-accent-dim)" label="From rollover" />
        <Legend swatch="var(--color-warn)" label="Overage" />
      </div>
    </section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: swatch }} /> {label}
    </span>
  );
}
