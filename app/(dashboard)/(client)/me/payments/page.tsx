import { Suspense } from "react";
import { format } from "date-fns";
import { requireClient } from "@/lib/auth";
import { getClientView } from "@/lib/data";
import { todaySGT } from "@/lib/time";
import { money, shortDate } from "@/lib/format";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/admin/FilterBar";
import { PaymentsLedger, monthKey, type LedgerRow } from "@/components/admin/PaymentsLedger";

type Search = { view?: string; month?: string };

export default async function MyPaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const view = sp.view === "paid" || sp.view === "all" ? sp.view : "due";
  const monthFilter = sp.month ?? "";

  const profile = await requireClient();
  const v = await getClientView(profile.client_id!);
  if (!v) return <EmptyState title="Account not ready" description="Please contact the studio." />;

  const all: LedgerRow[] = v.payments.map((p) => ({ ...p, clientId: v.client.id, clientName: v.client.name }));
  const pending = all.filter((p) => p.status === "pending");
  const overdue = pending.filter((p) => p.overdue);
  const nextDue = [...pending].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  const today = todaySGT();
  const year = format(today, "yyyy");
  const paidThisYear = all.filter((p) => p.status === "paid" && p.paidOn?.startsWith(year)).reduce((s, p) => s + p.amount, 0);
  // An invoice counts as paid when every payment row of its month is paid.
  const paidInvoices = v.invoices.filter((inv) => {
    const rows = all.filter((p) => p.periodIndex === inv.period_index);
    return rows.length > 0 && rows.every((p) => p.status === "paid");
  }).length;
  const upfront = v.retainer?.payment_terms === "upfront";
  const price = v.currentTerms?.monthlyPrice ?? v.retainer?.monthly_price ?? 0;

  const months = [...new Set(all.map((p) => monthKey(p.periodStart)))]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((k) => ({ value: k, label: format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1), "MMMM yyyy") }));

  const rows = all.filter(
    (p) =>
      (view === "all" || (view === "paid" ? p.status === "paid" : p.status === "pending")) &&
      (!monthFilter || monthKey(p.periodStart) === monthFilter),
  );

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {upfront
            ? `Full monthly payment at the start of each retainer month${price > 0 ? ` · ${money(price)}` : ""}. Any overage or additional videos are billed at month-end.`
            : `50% deposit at the start of each retainer month, 50% balance at month-end${price > 0 ? ` · ${money(price / 2)} each` : ""}. Any overage or additional videos are added to the balance.`}
        </p>
      </div>

      {all.length === 0 ? (
        <EmptyState title="No billing periods yet" description="Your first payment will appear here once your retainer month starts." />
      ) : (
        <>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Outstanding"
              value={<span className={overdue.length ? "text-bad" : pending.length ? "text-warn" : undefined}>{money(pending.reduce((s, p) => s + p.amount, 0))}</span>}
              sub={overdue.length ? `${overdue.length} overdue` : pending.length ? `${pending.length} due` : "all settled"}
            />
            <Stat
              label="Next due"
              value={nextDue ? money(nextDue.amount) : "—"}
              sub={nextDue ? (nextDue.overdue ? `was due ${shortDate(nextDue.dueDate)}` : `due ${shortDate(nextDue.dueDate)}`) : "nothing scheduled"}
            />
            <Stat label={`Paid in ${year}`} value={money(paidThisYear)} accent={paidThisYear > 0} />
            <Stat label="Paid invoices" value={paidInvoices} accent={paidInvoices > 0} />
          </div>

          <Suspense>
            <FilterBar
              tabs={[
                { value: "due", label: "Outstanding", count: pending.length, tone: overdue.length ? "bad" : "warn" },
                { value: "paid", label: "Paid" },
                { value: "all", label: "All" },
              ]}
              activeTab={view}
              selects={[{ name: "month", label: "Billing month", options: months, allLabel: "All months" }]}
            />
          </Suspense>

          <PaymentsLedger rows={rows} readOnly invoices={v.invoices} forceOpen={Boolean(monthFilter) || view !== "all"} />
        </>
      )}
    </div>
  );
}
