import { InfoTip } from "@/components/ui/InfoTip";

export function Stat({
  label,
  value,
  sub,
  accent = false,
  info,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  info?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-5 ring-1 ring-border">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-faint">{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div
        className={`mt-2 font-display text-3xl font-semibold tracking-tight tnum ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}
