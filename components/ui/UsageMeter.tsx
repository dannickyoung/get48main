/**
 * Allotment meter. In pip mode (detail view) it shows one pip per available
 * video this month: the monthly allotment, then any rolled-over videos (faint
 * lime when still available), then overage pips in orange. Used pips are solid
 * lime, filling allotment first then rollover. In bar mode (dense rows) it's a
 * slim continuous bar of allotment usage only.
 */
export function UsageMeter({
  allotment,
  used,
  rollover = 0,
  overage = 0,
  size = "md",
  variant = "pips",
}: {
  allotment: number;
  used: number;
  rollover?: number;
  overage?: number;
  size?: "sm" | "md";
  variant?: "pips" | "bar";
}) {
  const totalSlots = allotment + rollover;

  if (variant === "bar" || totalSlots > 28) {
    const h = size === "sm" ? "h-1.5" : "h-2";
    const usedFresh = Math.min(used, allotment);
    const pct = allotment > 0 ? Math.min(100, (usedFresh / allotment) * 100) : 0;
    return (
      <div className={`relative w-full overflow-hidden rounded-full bg-surface-3 ${h}`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    );
  }

  const pip = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <div className="flex flex-wrap content-start gap-1.5" aria-label={`${used} of ${totalSlots} used, ${overage} over`}>
      {/* Monthly allotment */}
      {Array.from({ length: allotment }).map((_, i) => (
        <span key={`a${i}`} className={`${pip} rounded-[5px] transition-colors ${i < used ? "bg-accent" : "bg-surface-3"}`} />
      ))}
      {/* Rolled-over videos (available = faint lime, used = solid lime) */}
      {Array.from({ length: rollover }).map((_, j) => {
        const filled = allotment + j < used;
        return (
          <span
            key={`r${j}`}
            className={`${pip} rounded-[5px] transition-colors ${filled ? "bg-accent" : "bg-accent/25"}`}
            title="rollover"
          />
        );
      })}
      {/* Overage — orange, matches the "+N over" figure */}
      {Array.from({ length: overage }).map((_, i) => (
        <span key={`o${i}`} className={`${pip} rounded-[5px]`} style={{ background: "var(--color-warn)" }} />
      ))}
    </div>
  );
}
