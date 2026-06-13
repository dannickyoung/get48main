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
  hideTitle = false,
}: {
  clientId: string;
  payments: ScheduledPayment[];
  outstanding: number;
  monthlyPrice: number;
  readOnly: boolean;
  hideTitle?: boolean;
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
    <section className="space-y-4">
      {/* Title + context sit OUTSIDE the card */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="max-w-xl">
          {!hideTitle && (
            <h2 className="font-display text-lg font-semibold tracking-tight">Payments</h2>
          )}
          <p className={`${hideTitle ? "" : "mt-1 "}text-sm text-faint`}>
            50% deposit at the start of each retainer month, 50% balance at month-end
            {monthlyPrice > 0 ? ` · ${money(monthlyPrice / 2)} each` : ""}.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-faint">Outstanding</div>
          <div className={`font-display text-xl font-semibold tnum ${outstanding > 0 ? "text-warn" : "text-accent"}`}>
            {money(outstanding)}
          </div>
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-sm text-faint">No billing periods have started yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
          {periods.map(([idx, rows]) => (
            <div key={idx} className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tnum">{shortDate(rows[0].periodStart)}</span>
                <span className="text-xs text-faint">Month {idx + 1}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                {rows
                  .sort((a, b) => (a.kind === "deposit" ? -1 : 1))
                  .map((p) => (
                    <div key={p.kind} className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-faint">{p.kind}</span>
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
                      <div className="mt-1.5 font-display text-lg font-semibold tnum">{money(p.amount)}</div>
                      <div className="text-xs text-faint tnum">
                        {p.status === "paid" && p.paidOn ? `paid ${shortDate(p.paidOn)}` : `due ${shortDate(p.dueDate)}`}
                      </div>
                      {p.overageCount > 0 && p.overageCharge > 0 && (
                        <div className="mt-1 text-xs font-medium text-warn tnum">
                          incl. {p.overageCount} overage · {money(p.overageCharge)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
