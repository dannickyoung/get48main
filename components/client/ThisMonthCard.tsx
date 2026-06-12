import { UsageMeter } from "@/components/ui/UsageMeter";
import { Pill } from "@/components/ui/StatusPill";
import type { RetainerComputation } from "@/lib/retainer/engine";
import { shortDate } from "@/lib/format";

export function ThisMonthCard({ computation }: { computation: RetainerComputation }) {
  const { current } = computation;
  const remaining = Math.max(0, current.allotment - current.usedFromFresh);

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-faint">
          This month
        </h2>
        <span className="text-xs text-faint tnum">
          {current.daysLeftInPeriod} {current.daysLeftInPeriod === 1 ? "day" : "days"} left
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="font-display text-4xl font-bold leading-none tnum">
            {current.usedFromFresh}
            <span className="text-xl font-semibold text-faint"> / {current.allotment}</span>
          </div>
          <div className="mt-1.5 text-sm text-muted">videos used from this month&apos;s allotment</div>
        </div>
        {current.usedFromRollover > 0 && (
          <Pill tone="good">+{current.usedFromRollover} from rollover</Pill>
        )}
      </div>

      <div className="mt-5">
        <UsageMeter allotment={current.allotment} used={current.usedFromFresh} overage={current.overageThisPeriod} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Mini label="Remaining" value={remaining} />
        <Mini label="Overage" value={current.overageThisPeriod} tone={current.overageThisPeriod > 0 ? "warn" : undefined} />
        <Mini label="Resets" value={shortDate(current.periodEnd)} small />
      </div>
    </section>
  );
}

function Mini({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warn";
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</div>
      <div
        className={`mt-1 font-display font-semibold tnum ${small ? "text-base" : "text-2xl"} ${
          tone === "warn" ? "text-warn" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
