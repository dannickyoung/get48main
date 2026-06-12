import type { HealthStatus } from "@/lib/retainer/assemble";
import { HEALTH_META } from "@/lib/retainer/assemble";

const TONE: Record<string, string> = {
  good: "tint-accent",
  warn: "tint-warn",
  bad: "tint-bad",
  muted: "tint-muted",
};

export function StatusPill({ health }: { health: HealthStatus }) {
  const meta = HEALTH_META[health];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[meta.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {meta.label}
    </span>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}>
      {children}
    </span>
  );
}
