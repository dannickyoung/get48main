import { Suspense } from "react";
import { CreditCard } from "iconoir-react";
import { format } from "date-fns";
import { getAllClientViews } from "@/lib/data";
import { allPayments } from "@/lib/aggregate";
import { todaySGT } from "@/lib/time";
import { money } from "@/lib/format";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/admin/FilterBar";
import { PaymentsLedger, monthKey, type LedgerRow } from "@/components/admin/PaymentsLedger";

type Search = { view?: string; client?: string; month?: string };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const view = sp.view === "paid" || sp.view === "all" ? sp.view : "due";
  const clientFilter = sp.client ?? "";
  const monthFilter = sp.month ?? "";

  const views = await getAllClientViews();
  const invoiceOf = new Map<string, { id: string; no: string }>();
  for (const v of views) for (const i of v.invoices) invoiceOf.set(`${v.client.id}:${i.period_index}`, { id: i.id, no: i.invoice_no });

  const all: LedgerRow[] = allPayments(views).map((p) => {
    const inv = invoiceOf.get(`${p.clientId}:${p.periodIndex}`);
    return { ...p, invoiceId: inv?.id, invoiceNo: inv?.no };
  });

  // ----- KPIs (always over the full set, so the tiles never lie) -----
  const today = todaySGT();
  const thisMonth = format(today, "yyyy-MM");
  const pending = all.filter((p) => p.status === "pending");
  const overdue = pending.filter((p) => p.overdue);
  const upcoming = pending.filter((p) => !p.overdue);
  const collectedThisMonth = all
    .filter((p) => p.status === "paid" && p.paidOn && p.paidOn.slice(0, 7) === thisMonth)
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = pending.reduce((s, p) => s + p.amount, 0);

  // ----- filters -----
  const clients = [...new Map(all.map((p) => [p.clientId, p.clientName])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const months = [...new Set(all.map((p) => monthKey(p.periodStart)))]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((k) => ({ value: k, label: format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1), "MMMM yyyy") }));

  const rows = all.filter(
    (p) =>
      (view === "all" || (view === "paid" ? p.status === "paid" : p.status === "pending")) &&
      (!clientFilter || p.clientId === clientFilter) &&
      (!monthFilter || monthKey(p.periodStart) === monthFilter),
  );

  return (
    <div className="rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1.5 text-[15px] text-muted">Every deposit, balance and upfront payment across your retainers, by month.</p>
        </div>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={<CreditCard width={28} height={28} strokeWidth={1.2} />}
          title="No payments yet"
          description="Once a client's retainer has started, their deposit and balance will appear here to track."
        />
      ) : (
        <>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Overdue"
              value={<span className={overdue.length ? "text-bad" : undefined}>{money(overdue.reduce((s, p) => s + p.amount, 0))}</span>}
              sub={overdue.length ? `${overdue.length} ${overdue.length === 1 ? "payment" : "payments"} past due` : "nothing past due"}
            />
            <Stat
              label="Upcoming"
              value={money(upcoming.reduce((s, p) => s + p.amount, 0))}
              sub={upcoming.length ? `${upcoming.length} due, not yet late` : "nothing scheduled"}
            />
            <Stat label="Collected this month" value={money(collectedThisMonth)} accent={collectedThisMonth > 0} sub={format(today, "MMMM yyyy")} />
            <Stat label="Outstanding" value={money(outstanding)} sub="all unpaid, all clients" />
          </div>

          <Suspense>
            <FilterBar
              tabs={[
                { value: "due", label: "Outstanding", count: pending.length, tone: overdue.length ? "bad" : "warn" },
                { value: "paid", label: "Paid" },
                { value: "all", label: "All" },
              ]}
              activeTab={view}
              selects={[
                { name: "client", label: "Client", options: clients, allLabel: "All clients" },
                { name: "month", label: "Billing month", options: months, allLabel: "All months" },
              ]}
            />
          </Suspense>

          <PaymentsLedger rows={rows} forceOpen={Boolean(monthFilter) || view === "due"} />
        </>
      )}
    </div>
  );
}
