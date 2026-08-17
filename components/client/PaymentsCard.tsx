import { PaymentToggle } from "@/components/client/PaymentToggle";
import { PaidDateEditor } from "@/components/client/PaidDateEditor";
import { InvoiceLine } from "@/components/client/InvoiceLine";
import { MonthGroup } from "@/components/admin/MonthGroup";
import { Pill } from "@/components/ui/StatusPill";
import { money, shortDate } from "@/lib/format";
import type { ScheduledPayment } from "@/lib/retainer/assemble";
import type { Invoice, PaymentKind, PaymentMode } from "@/lib/types";

const KIND_LABEL: Record<PaymentKind, string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Upfront",
  overage: "Overage",
};

/** Row label; the upfront month-end row is named for what it actually bills. */
function rowLabel(p: ScheduledPayment): string {
  if (p.kind === "overage") {
    if (p.overageCount > 0 && p.additionalCount > 0) return "Extras";
    if (p.additionalCount > 0) return "Additional videos";
  }
  return KIND_LABEL[p.kind];
}

/**
 * A client's payments, one collapsible group per billing month (newest first).
 * Months with anything owed start open; settled months are collapsed to a
 * one-line summary so the card stays short as history grows.
 */
export function PaymentsCard({
  clientId,
  payments,
  outstanding,
  monthlyPrice,
  paymentTerms = "split",
  readOnly,
  hideTitle = false,
  showSchedule = false,
  invoices = [],
}: {
  clientId: string;
  payments: ScheduledPayment[];
  outstanding: number;
  monthlyPrice: number;
  paymentTerms?: PaymentMode;
  readOnly: boolean;
  hideTitle?: boolean;
  showSchedule?: boolean;
  /** Issued invoices for this client (one per billing month). */
  invoices?: Invoice[];
}) {
  const invoiceByPeriod = new Map(invoices.map((i) => [i.period_index, i]));

  // Group by period, newest first.
  const byPeriod = new Map<number, ScheduledPayment[]>();
  for (const p of payments) {
    const arr = byPeriod.get(p.periodIndex) ?? [];
    arr.push(p);
    byPeriod.set(p.periodIndex, arr);
  }
  const periods = [...byPeriod.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <section className="flex h-full flex-col gap-3">
      {!hideTitle && (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">Payments</h2>
          {periods.length > 0 && (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-faint">Outstanding</div>
              <div className={`font-display text-lg font-semibold tnum ${outstanding > 0 ? "text-warn" : "text-accent"}`}>{money(outstanding)}</div>
            </div>
          )}
        </div>
      )}

      {periods.length === 0 ? (
        <div className="flex-1 rounded-2xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-sm text-faint">No billing periods have started yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {showSchedule && (
            <p className="max-w-md text-sm text-faint">
              {paymentTerms === "upfront" ? (
                <>
                  Full monthly payment at the start of each retainer month
                  {monthlyPrice > 0 ? ` · ${money(monthlyPrice)}` : ""}. Any overage or additional videos are billed at month-end.
                </>
              ) : (
                <>
                  50% deposit at the start of each retainer month, 50% balance at month-end
                  {monthlyPrice > 0 ? ` · ${money(monthlyPrice / 2)} each` : ""}. Any overage or additional videos are added to the balance.
                </>
              )}
            </p>
          )}

          {periods.map(([idx, rows], i) => {
            const sorted = [...rows].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
            const total = sorted.reduce((s, p) => s + p.amount, 0);
            const owed = sorted.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
            const overdue = sorted.some((p) => p.status === "pending" && p.overdue);
            const paidCount = sorted.filter((p) => p.status === "paid").length;
            const settled = owed === 0;
            return (
              <MonthGroup
                key={idx}
                title={shortDate(sorted[0].periodStart)}
                summary={`Month ${idx + 1} · ${sorted.map((p) => `${rowLabel(p)} ${money(p.amount)}`).join(" + ")}`}
                open={!settled || i === 0}
                aside={
                  <>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-faint">{settled ? "Total" : "Owed"}</div>
                      <div className={`font-display text-sm font-semibold tnum ${settled ? "text-foreground" : overdue ? "text-bad" : "text-warn"}`}>
                        {money(settled ? total : owed)}
                      </div>
                    </div>
                    <Pill tone={settled ? "good" : overdue ? "bad" : "muted"}>{settled ? "Paid" : overdue ? "Overdue" : paidCount > 0 ? "Part paid" : "Due"}</Pill>
                  </>
                }
              >
                <div className="px-5 py-4 sm:px-6">
                  <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                    {sorted.map((p) => (
                      <div key={p.kind} className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-faint">{rowLabel(p)}</span>
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
                        {!readOnly && p.status === "paid" && p.paidOn ? (
                          <div className="mt-0.5">
                            <PaidDateEditor
                              clientId={clientId}
                              periodIndex={p.periodIndex}
                              periodStart={p.periodStart.toISOString().slice(0, 10)}
                              kind={p.kind}
                              amount={p.amount}
                              paidOn={p.paidOn}
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-faint tnum">
                            {p.status === "paid" && p.paidOn ? `paid ${shortDate(p.paidOn)}` : `due ${shortDate(p.dueDate)}`}
                          </div>
                        )}
                        {p.overageCount > 0 && p.overageCharge > 0 && (
                          <div className="mt-1 text-xs font-medium text-warn tnum">
                            incl. {p.overageCount} overage · {money(p.overageCharge)}
                          </div>
                        )}
                        {p.additionalCount > 0 && (
                          <div className="mt-1 text-xs font-medium text-accent tnum">
                            incl. {p.additionalCount} additional {p.additionalCount === 1 ? "video" : "videos"} · {money(p.additionalCharge)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <InvoiceLine
                    clientId={clientId}
                    periodIndex={idx}
                    invoice={invoiceByPeriod.get(idx)}
                    paidCount={paidCount}
                    rowCount={sorted.length}
                    readOnly={readOnly}
                  />
                </div>
              </MonthGroup>
            );
          })}
        </div>
      )}
    </section>
  );
}
