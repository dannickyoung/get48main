import type { RetainerComputation } from "@/lib/retainer/engine";
import { monthLabel } from "@/lib/format";

export function HistoryCard({ computation }: { computation: RetainerComputation }) {
  const periods = [...computation.periods].reverse();
  if (periods.length === 0) {
    return (
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
        <h2 className="font-display text-lg font-semibold tracking-tight">Month history</h2>
        <p className="mt-4 text-center text-sm text-faint">
          No completed months yet. The first month is still in progress.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <h2 className="font-display text-lg font-semibold tracking-tight">Month history</h2>
      <div className="mt-4 -mx-2 overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-faint">
              <th className="px-2 py-2 font-semibold">Month</th>
              <th className="px-2 py-2 text-right font-semibold">Used</th>
              <th className="px-2 py-2 text-right font-semibold">Overage</th>
              <th className="px-2 py-2 text-right font-semibold">Rolled out</th>
              <th className="px-2 py-2 text-right font-semibold">Forfeited</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {periods.map((p) => (
              <tr key={p.index} className="border-t border-border">
                <td className="px-2 py-2.5 font-medium text-foreground">{monthLabel(p.start)}</td>
                <td className="px-2 py-2.5 text-right text-muted">
                  {p.totalUsed}
                  <span className="text-faint"> / {p.allotment}</span>
                </td>
                <td className={`px-2 py-2.5 text-right ${p.overage > 0 ? "text-warn" : "text-faint"}`}>
                  {p.overage || "—"}
                </td>
                <td className={`px-2 py-2.5 text-right ${p.rolledOut > 0 ? "text-accent" : "text-faint"}`}>
                  {p.rolledOut || "—"}
                </td>
                <td className={`px-2 py-2.5 text-right ${p.forfeited > 0 ? "text-bad" : "text-faint"}`}>
                  {p.forfeited || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
