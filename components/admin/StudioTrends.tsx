import { money } from "@/lib/format";
import type { MonthlyTotal } from "@/lib/aggregate";

export function StudioTrends({ months }: { months: MonthlyTotal[] }) {
  const maxDelivered = Math.max(1, ...months.map((m) => m.delivered));
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

  return (
    <div className="space-y-6">
      <Chart
        title="Videos delivered"
        months={months}
        max={maxDelivered}
        value={(m) => m.delivered}
        label={(m) => String(m.delivered)}
        accent
      />
      <Chart
        title="Revenue collected"
        months={months}
        max={maxRevenue}
        value={(m) => m.revenue}
        label={(m) => (m.revenue > 0 ? money(m.revenue) : "")}
      />
    </div>
  );
}

function Chart({
  title,
  months,
  max,
  value,
  label,
  accent = false,
}: {
  title: string;
  months: MonthlyTotal[];
  max: number;
  value: (m: MonthlyTotal) => number;
  label: (m: MonthlyTotal) => string;
  accent?: boolean;
}) {
  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-6 flex items-end gap-2 sm:gap-3" style={{ height: 132 }}>
        {months.map((m) => {
          const h = (value(m) / max) * 100;
          return (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full max-w-10 flex-1 items-end overflow-hidden rounded-md bg-surface-3">
                <div
                  className={`w-full ${accent ? "bg-accent" : "bg-accent/45"}`}
                  style={{ height: `${h}%`, minHeight: value(m) > 0 ? 3 : 0 }}
                />
              </div>
              <span className="text-[10px] tnum text-faint">{m.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2 sm:gap-3 text-center">
        {months.map((m) => (
          <span key={m.key} className="flex-1 truncate text-[10px] tnum text-muted">
            {label(m)}
          </span>
        ))}
      </div>
    </section>
  );
}
