import Link from "next/link";
import { format } from "date-fns";
import { PaymentToggle } from "@/components/client/PaymentToggle";
import { InvoiceLine } from "@/components/client/InvoiceLine";
import { MonthGroup } from "@/components/admin/MonthGroup";
import { Pill } from "@/components/ui/StatusPill";
import { money, shortDate } from "@/lib/format";
import type { PaymentWithClient } from "@/lib/aggregate";
import type { Invoice, PaymentKind } from "@/lib/types";

const KIND_LABEL: Record<PaymentKind, string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Upfront",
  overage: "Overage",
};

export type LedgerRow = PaymentWithClient & { invoiceId?: string; invoiceNo?: string };

/** Billing-month key for grouping (yyyy-MM of the period start). */
export const monthKey = (d: Date) => format(d, "yyyy-MM");

/**
 * Payments grouped by billing month, newest first. Each month is a collapsible
 * card; months with anything still owed start open.
 *   readOnly (client view) → status pills instead of the mark-paid toggle, the
 *   client name is omitted, and each month ends with its invoice download.
 */
export function PaymentsLedger({
  rows,
  forceOpen = false,
  readOnly = false,
  invoices = [],
}: {
  rows: LedgerRow[];
  forceOpen?: boolean;
  readOnly?: boolean;
  invoices?: Invoice[];
}) {
  const groups = new Map<string, LedgerRow[]>();
  for (const r of rows) {
    const k = monthKey(r.periodStart);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  const keys = [...groups.keys()].sort((a, b) => (a < b ? 1 : -1));

  if (keys.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
        <p className="text-sm text-faint">Nothing matches these filters.</p>
      </div>
    );
  }

  return (
    <div className="stagger space-y-3">
      {keys.map((k) => {
        const list = groups.get(k)!.sort(
          (a, b) => Number(b.status === "pending") - Number(a.status === "pending") || a.dueDate.getTime() - b.dueDate.getTime(),
        );
        const pending = list.filter((r) => r.status === "pending");
        const overdue = pending.filter((r) => r.overdue);
        const owed = pending.reduce((s, r) => s + r.amount, 0);
        const collected = list.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
        const clients = new Set(list.map((r) => r.clientId)).size;
        // Client view: one client per group → one invoice per group.
        const invoice = readOnly ? invoices.find((i) => i.client_id === list[0].clientId && i.period_index === list[0].periodIndex) : undefined;
        return (
          <MonthGroup
            key={k}
            title={format(list[0].periodStart, "MMMM yyyy")}
            open={forceOpen || pending.length > 0}
            summary={
              readOnly
                ? `Month ${list[0].periodIndex + 1} · ${list.length} ${list.length === 1 ? "payment" : "payments"}${overdue.length ? ` · ${overdue.length} overdue` : ""}`
                : `${list.length} ${list.length === 1 ? "payment" : "payments"} · ${clients} ${clients === 1 ? "client" : "clients"}${
                    overdue.length ? ` · ${overdue.length} overdue` : ""
                  }`
            }
            aside={
              <>
                {owed > 0 && (
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-faint">Owed</div>
                    <div className={`font-display text-sm font-semibold tnum ${overdue.length ? "text-bad" : "text-warn"}`}>{money(owed)}</div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-faint">Collected</div>
                  <div className="font-display text-sm font-semibold tnum text-accent">{money(collected)}</div>
                </div>
              </>
            }
          >
            <ul className="divide-y divide-border">
              {list.map((p) => (
                <li
                  key={`${p.clientId}-${p.periodIndex}-${p.kind}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_120px] sm:px-6"
                >
                  <div className="min-w-0">
                    {readOnly ? (
                      <div className="truncate text-sm font-medium text-foreground">{KIND_LABEL[p.kind]}</div>
                    ) : (
                      <Link href={`/clients/${p.clientId}`} className="truncate text-sm font-medium text-foreground hover:text-accent">
                        {p.clientName}
                      </Link>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-faint tnum">
                      {!readOnly && <span className="font-medium text-muted">{KIND_LABEL[p.kind]}</span>}
                      <span>{readOnly ? "" : "· "}Month {p.periodIndex + 1}</span>
                      {!readOnly && p.invoiceId && (
                        <>
                          <span>·</span>
                          <a href={`/api/invoices/${p.invoiceId}?inline=1`} target="_blank" rel="noreferrer" className="hover:text-accent">
                            {p.invoiceNo}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-start-1 text-xs text-faint tnum sm:col-start-auto">
                    {p.status === "paid" && p.paidOn ? (
                      <>Paid {shortDate(p.paidOn)}</>
                    ) : p.overdue ? (
                      <span className="text-bad">Overdue · due {shortDate(p.dueDate)}</span>
                    ) : (
                      <>Due {shortDate(p.dueDate)}</>
                    )}
                    {(p.overageCount > 0 || p.additionalCount > 0) && (
                      <span className="ml-2 text-warn">
                        incl. {p.overageCount > 0 ? `${p.overageCount} overage` : ""}
                        {p.overageCount > 0 && p.additionalCount > 0 ? " + " : ""}
                        {p.additionalCount > 0 ? `${p.additionalCount} additional` : ""}
                      </span>
                    )}
                  </div>
                  <div className="row-start-1 text-right font-display text-sm font-semibold tnum sm:row-start-auto">{money(p.amount)}</div>
                  <div className="row-start-1 col-start-2 flex justify-end sm:col-start-auto sm:row-start-auto">
                    {p.status === "paid" ? (
                      <span className="inline-flex items-center gap-2">
                        <Pill tone="good">Paid</Pill>
                      </span>
                    ) : readOnly ? (
                      <Pill tone={p.overdue ? "bad" : "muted"}>{p.overdue ? "Overdue" : "Due"}</Pill>
                    ) : (
                      <PaymentToggle
                        clientId={p.clientId}
                        periodIndex={p.periodIndex}
                        periodStart={p.periodStart.toISOString().slice(0, 10)}
                        kind={p.kind}
                        amount={p.amount}
                        paid={false}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {readOnly && invoice && (
              <div className="px-5 pb-4 sm:px-6">
                <InvoiceLine
                  clientId={list[0].clientId}
                  periodIndex={list[0].periodIndex}
                  invoice={invoice}
                  paidCount={list.filter((r) => r.status === "paid").length}
                  rowCount={list.length}
                  readOnly
                />
              </div>
            )}
          </MonthGroup>
        );
      })}
    </div>
  );
}
