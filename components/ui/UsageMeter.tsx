/**
 * Allotment meter with two looks:
 *  - variant "pips"  → one fixed pip per video, left-aligned heatmap (detail view)
 *  - variant "bar"   → a slim continuous bar (dense list rows; aligns cleanly)
 * Overage is rendered as red pips in pip mode; in bar mode it's surfaced as text
 * by the caller (keeps rows tidy and perfectly aligned).
 */
export function UsageMeter({
  allotment,
  used,
  overage = 0,
  size = "md",
  variant = "pips",
}: {
  allotment: number;
  used: number;
  overage?: number;
  size?: "sm" | "md";
  variant?: "pips" | "bar";
}) {
  const usedFresh = Math.min(used, allotment);

  if (variant === "bar" || allotment > 24) {
    const h = size === "sm" ? "h-1.5" : "h-2";
    const pct = allotment > 0 ? Math.min(100, (usedFresh / allotment) * 100) : 0;
    return (
      <div className={`relative w-full overflow-hidden rounded-full bg-surface-3 ${h}`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    );
  }

  const pip = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <div className="flex flex-wrap content-start gap-1.5" aria-label={`${used} of ${allotment} videos used`}>
      {Array.from({ length: allotment }).map((_, i) => (
        <span key={i} className={`${pip} rounded-[5px] transition-colors ${i < usedFresh ? "bg-accent" : "bg-surface-3"}`} />
      ))}
      {Array.from({ length: overage }).map((_, i) => (
        <span key={`o${i}`} className={`${pip} rounded-[5px]`} style={{ background: "var(--color-bad)" }} />
      ))}
    </div>
  );
}
