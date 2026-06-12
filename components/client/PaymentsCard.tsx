import { PaymentToggle } from "@/components/client/PaymentToggle";
import { Pill } from "@/components/ui/StatusPill";
import { money, shortDate } from "@/lib/format";
import type { ScheduledPayment } from "@/lib/retainer/assemble";

export function PaymentsCard({
  clientId,
  payments,
  outstanding,
  monthlyPrice,
  readOnly,
}: {
  clientId: string;
  payments: ScheduledPayment[];
  outstanding: number;
  monthlyPrice: number;
  readOnly: boolean;
}) {
  // Group by period, newest first.
  const byPeriod = new Map<number, ScheduledPayment[]>();
  for (const p of payments) {
    const arr = byPeriod.get(p.periodIndex) ?? [];
    arr.push(p);
    byPeriod.set(p.periodIndex, arr);
  }
  const periods = [...byPeriod.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">Payments</h2>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-faint">Outstanding</div>
          <div className={`font-display text-lg font-semibold tnum ${outstanding > 0 ? "text-warn" : "text-accent"}`}>
            {money(outstanding)}
          </div>
        </div>
      </div>

      <p className="mt-1 text-sm text-faint">
        50% deposit at the start of each retainer month, 50% balance at month-end
        {monthlyPrice > 0 ? ` · ${money(monthlyPrice / 2)} each` : ""}.
      </p>

      {periods.length === 0 ? (
        <p className="mt-6 text-center text-sm text-faint">No billing periods have started yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {periods.map(([idx, rows]) => (
            <li key={idx} className="rounded-xl bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground tnum">
                  {shortDate(rows[0].periodStart)}
                </span>
                <span className="text-xs text-faint">Month {idx + 1}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {rows
                  .sort((a, b) => (a.kind === "deposit" ? -1 : 1))
                  .map((p) => (
                    <div key={p.kind} className="rounded-lg bg-background px-3 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                          {p.kind}
                        </span>
                        {readOnly ? (
                          <Pill tone={p.status === "paid" ? "good" : p.overdue ? "bad" : "muted"}>
                            {p.status === "paid" ? "Paid" : p.overdue ? "Overdue" : "Due"}
                          </Pill>
                        ) : (
                          <PaymentToggle
                            clientId={clientId}
                            periodIndex={p.periodIndex}
                            periodStart={p.periodStart.toISOString().slice(0, 10)}
                            kind={p.kind}
                            amount={p.amount}
                            paid={p.status === "paid"}
                          />
                        )}
                      </div>
                      <div className="mt-2 font-display text-lg font-semibold tnum">{money(p.amount)}</div>
                      <div className="text-xs text-faint tnum">
                        {p.status === "paid" && p.paidOn ? `paid ${shortDate(p.paidOn)}` : `due ${shortDate(p.dueDate)}`}
                      </div>
                    </div>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
