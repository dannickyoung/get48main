import Link from "next/link";
import { PaymentToggle } from "@/components/client/PaymentToggle";
import { Pill } from "@/components/ui/StatusPill";
import { money, shortDate } from "@/lib/format";
import type { PaymentWithClient } from "@/lib/aggregate";

export function PaymentsBoard({ payments }: { payments: PaymentWithClient[] }) {
  const overdue = payments.filter((p) => p.status === "pending" && p.overdue).sort(byDue);
  const upcoming = payments.filter((p) => p.status === "pending" && !p.overdue).sort(byDue);
  const paid = payments
    .filter((p) => p.status === "paid")
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <Section title="Overdue" tone="bad" rows={overdue} emptyText="Nothing overdue." />
      <Section title="Upcoming" tone="warn" rows={upcoming} emptyText="No upcoming payments." />
      <Section title="Recently paid" tone="good" rows={paid} emptyText="No payments recorded yet." />
    </div>
  );
}

function byDue(a: PaymentWithClient, b: PaymentWithClient) {
  return a.dueDate.getTime() - b.dueDate.getTime();
}

function Section({
  title,
  tone,
  rows,
  emptyText,
}: {
  title: string;
  tone: "good" | "warn" | "bad";
  rows: PaymentWithClient[];
  emptyText: string;
}) {
  const total = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  return (
    <section className="rounded-2xl bg-surface p-5 ring-1 ring-border sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-faint">{title}</h2>
        {total > 0 && <span className="font-display text-sm font-semibold tnum text-foreground">{money(total)}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-surface-2 px-3.5 py-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((p) => (
            <li key={`${p.clientId}-${p.periodIndex}-${p.kind}`} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/clients/${p.clientId}`} className="truncate text-sm font-medium text-foreground hover:text-accent">
                  {p.clientName}
                </Link>
                <div className="text-xs capitalize text-faint tnum">
                  {p.kind} · {p.status === "paid" && p.paidOn ? `paid ${shortDate(p.paidOn)}` : `due ${shortDate(p.dueDate)}`}
                </div>
              </div>
              <div className="font-display text-sm font-semibold tnum">{money(p.amount)}</div>
              <div className="w-24 text-right">
                {p.status === "paid" ? (
                  <Pill tone="good">Paid</Pill>
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
      )}
    </section>
  );
}
