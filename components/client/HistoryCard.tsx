import { Section } from "@/components/ui/Section";
import type { PeriodSummary, RetainerComputation } from "@/lib/retainer/engine";
import { monthLabel } from "@/lib/format";

const VISIBLE = 12;

export function HistoryCard({ computation }: { computation: RetainerComputation }) {
  const periods = [...computation.periods].reverse();
  if (periods.length === 0) {
    return (
      <Section title="Month history">
        <p className="text-center text-sm text-faint">
          No completed months yet. The first month is still in progress.
        </p>
      </Section>
    );
  }

  const recent = periods.slice(0, VISIBLE);
  const older = periods.slice(VISIBLE);

  return (
    <Section title="Month history" aside={<span className="text-xs text-faint tnum">{periods.length} months</span>}>
      <div className="-mx-2 overflow-x-auto">
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
          <tbody className="tnum">{recent.map((p) => <HistoryRow key={p.index} p={p} />)}</tbody>
        </table>
      </div>

      {older.length > 0 && (
        <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
            <span className="transition group-open:rotate-45">+</span>
            <span className="group-open:hidden">Show {older.length} earlier {older.length === 1 ? "month" : "months"}</span>
            <span className="hidden group-open:inline">Hide earlier months</span>
          </summary>
          <div className="mt-2 -mx-2 overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <tbody className="tnum">{older.map((p) => <HistoryRow key={p.index} p={p} />)}</tbody>
            </table>
          </div>
        </details>
      )}
    </Section>
  );
}

function HistoryRow({ p }: { p: PeriodSummary }) {
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-2.5 font-medium text-foreground">{monthLabel(p.start)}</td>
      <td className="px-2 py-2.5 text-right text-muted">
        {p.totalUsed}
        <span className="text-faint"> / {p.allotment}</span>
      </td>
      <td className={`px-2 py-2.5 text-right ${p.overage > 0 ? "text-warn" : "text-faint"}`}>{p.overage || "—"}</td>
      <td className={`px-2 py-2.5 text-right ${p.rolledOut > 0 ? "text-accent" : "text-faint"}`}>{p.rolledOut || "—"}</td>
      <td className={`px-2 py-2.5 text-right ${p.forfeited > 0 ? "text-bad" : "text-faint"}`}>{p.forfeited || "—"}</td>
    </tr>
  );
}
