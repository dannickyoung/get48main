import { CreditCard } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { allPayments } from "@/lib/aggregate";
import { PaymentsBoard } from "@/components/admin/PaymentsBoard";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/lib/format";

export default async function PaymentsPage() {
  const views = await getAllClientViews();
  const payments = allPayments(views);
  const outstanding = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            50% deposit at month start, 50% balance at month-end — across every retainer.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-faint">Outstanding</div>
          <div className={`font-display text-2xl font-semibold tnum ${outstanding > 0 ? "text-warn" : "text-accent"}`}>
            {money(outstanding)}
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard width={28} height={28} strokeWidth={1.2} />}
          title="No payments yet"
          description="Once a client's retainer has started, their deposit and balance will appear here to track."
        />
      ) : (
        <PaymentsBoard payments={payments} />
      )}
    </div>
  );
}
