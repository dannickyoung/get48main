import { format } from "date-fns";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { Section } from "@/components/ui/Section";
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
    <Section
      title="Utilization"
      aside={<span className="text-xs text-faint">videos delivered · last {rows.length} months</span>}
    >
      <div>
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
    </Section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: swatch }} /> {label}
    </span>
  );
}
