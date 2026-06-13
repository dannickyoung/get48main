import { RingGauge } from "@/components/ui/RingGauge";
import { Section } from "@/components/ui/Section";
import type { RetainerComputation } from "@/lib/retainer/engine";
import { shortDate, relativeDays } from "@/lib/format";

export function RolloverHero({ computation }: { computation: RetainerComputation }) {
  const { current, terms } = computation;
  const { rollover } = current;
  const days = rollover.daysToNextExpiry;
  // Expiry is a "use it or lose it" warning — always red.
  const expiryTone = "tint-bad";

  return (
    <Section title="Rolling over now">
      <div className="flex h-full flex-col items-center justify-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <RingGauge value={rollover.available} max={terms.rolloverCap}>
          <div>
            <div className="font-display text-4xl font-bold leading-none tnum text-accent">
              {rollover.available}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-faint">
              of {terms.rolloverCap}
            </div>
          </div>
        </RingGauge>

        <div className="flex-1 text-center sm:text-left">
          {rollover.available > 0 ? (
            <>
              <p className="text-[15px] leading-relaxed text-muted">
                <span className="font-semibold text-foreground">{rollover.available}</span>{" "}
                carried-over {rollover.available === 1 ? "video" : "videos"} available to use.
              </p>
              {rollover.nextExpiry && (
                <div
                  className={`mt-3 inline-flex flex-col items-center gap-0.5 rounded-xl px-4 py-3 sm:items-start ${expiryTone}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {rollover.nextExpiryCount} {rollover.nextExpiryCount === 1 ? "video" : "videos"} expire
                  </span>
                  <span className="font-display text-lg font-semibold tnum">
                    {shortDate(rollover.nextExpiry)}
                  </span>
                  <span className="text-xs opacity-90">{relativeDays(days)} · no refund after</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-muted">
              No videos are rolling over right now. Unused videos this month —{" "}
              <span className="font-semibold text-foreground">up to {terms.rolloverCap}</span> — will roll
              into next month and stay live for {terms.rolloverWeeks} weeks.
            </p>
          )}

          <div className="mt-4 text-sm text-faint">
            Projected to roll into next month if unused:{" "}
            <span className="font-semibold tnum text-muted">{current.projectedRollover}</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
