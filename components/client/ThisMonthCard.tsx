import { UsageMeter } from "@/components/ui/UsageMeter";
import { Pill } from "@/components/ui/StatusPill";
import { InfoTip } from "@/components/ui/InfoTip";
import { Section } from "@/components/ui/Section";
import type { RetainerComputation } from "@/lib/retainer/engine";
import { shortDate } from "@/lib/format";

export function ThisMonthCard({ computation }: { computation: RetainerComputation }) {
  const { current } = computation;
  // Videos left this month = unused allotment + rollover still available to use.
  const remaining = current.freshRemaining + current.rollover.available;

  return (
    <Section
      title="This month"
      aside={
        <span className="text-xs text-faint tnum">
          {current.daysLeftInPeriod} {current.daysLeftInPeriod === 1 ? "day" : "days"} left
        </span>
      }
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-display text-4xl font-bold leading-none tnum">
            {current.usedFromFresh}
            <span className="text-xl font-semibold text-faint"> / {current.allotment}</span>
          </div>
          {current.usedFromRollover > 0 && (
            <Pill tone="good">+{current.usedFromRollover} from rollover</Pill>
          )}
        </div>
        <div className="mt-1.5 text-sm text-muted">videos used from this month&apos;s allotment</div>
      </div>

      <div className="mt-5">
        <UsageMeter
          allotment={current.allotment}
          used={current.totalUsedThisPeriod}
          rollover={current.usedFromRollover + current.rollover.available}
          overage={current.overageThisPeriod}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Mini
          label="Remaining"
          value={remaining}
          info={`${current.freshRemaining} from this month's allotment + ${current.rollover.available} rollover still available.`}
        />
        <Mini label="Overage" value={current.overageThisPeriod} tone={current.overageThisPeriod > 0 ? "warn" : undefined} />
        <Mini label="Resets" value={shortDate(current.periodEnd)} small />
      </div>
    </Section>
  );
}

function Mini({
  label,
  value,
  tone,
  small,
  info,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warn";
  small?: boolean;
  info?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3">
      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
        {label}
        {info && <InfoTip text={info} />}
      </div>
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
