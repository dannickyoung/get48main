import Link from "next/link";
import { Group } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { allRollovers, allPayments } from "@/lib/aggregate";
import { Stat } from "@/components/ui/Stat";
import { AttentionCard, type AttentionItem } from "@/components/admin/AttentionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { money, shortDate, relativeDays } from "@/lib/format";

export default async function OverviewPage() {
  const views = await getAllClientViews();
  const active = views.filter((v) => !v.client.archived);

  if (active.length === 0) {
    return (
      <div className="rise space-y-8">
        <Header />
        <EmptyState
          icon={<Group width={28} height={28} strokeWidth={1.2} />}
          title="No clients yet"
          description="Add your first retainer client to start tracking video usage, rollovers and payments."
          actionHref="/clients/new"
          actionLabel="Add your first client"
        />
      </div>
    );
  }

  const deliveredThisMonth = active.reduce((s, v) => s + (v.computation?.current.totalUsedThisPeriod ?? 0), 0);
  const rolloverAtRisk = active.reduce((s, v) => {
    const r = v.computation?.current.rollover;
    return s + (r && r.daysToNextExpiry != null && r.daysToNextExpiry <= 14 ? r.available : 0);
  }, 0);
  const outstanding = active.reduce((s, v) => s + v.outstanding, 0);

  const expiring: AttentionItem[] = allRollovers(views)
    .filter((r) => r.available > 0 && r.days != null && r.days <= 21)
    .slice(0, 5)
    .map((r) => ({
      href: `/clients/${r.clientId}`,
      primary: r.clientName,
      secondary: `${r.available} rolling · expires ${shortDate(r.nextExpiry)}`,
      value: relativeDays(r.days),
      tone: r.days != null && r.days <= 14 ? "warn" : "muted",
    }));

  const duePayments: AttentionItem[] = allPayments(views)
    .filter((p) => p.status === "pending")
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5)
    .map((p) => ({
      href: `/clients/${p.clientId}`,
      primary: p.clientName,
      secondary: `${p.kind} · due ${shortDate(p.dueDate)}`,
      value: money(p.amount),
      tone: p.overdue ? "bad" : "warn",
    }));

  const over: AttentionItem[] = active
    .filter((v) => (v.computation?.current.overageThisPeriod ?? 0) > 0)
    .map((v) => ({
      href: `/clients/${v.client.id}`,
      primary: v.client.name,
      secondary: `${v.computation!.current.totalUsedThisPeriod} delivered of ${v.computation!.current.allotment}`,
      value: `+${v.computation!.current.overageThisPeriod}`,
      tone: "warn" as const,
    }));

  return (
    <div className="rise space-y-8">
      <Header />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active clients" value={active.length} info="Clients with a live (non-archived) retainer." />
        <Stat
          label="Delivered this month"
          value={deliveredThisMonth}
          sub="across all retainers"
          info="Total videos delivered this billing month across every active client, including ones drawn from rollover."
        />
        <Stat
          label="Rollover at risk"
          value={rolloverAtRisk}
          accent={rolloverAtRisk > 0}
          sub="expiring within 14 days"
          info="Carried-over videos that will expire within 14 days. Rolled-over videos last 8 weeks past the month they accrued, then expire with no refund."
        />
        <Stat
          label="Outstanding"
          value={money(outstanding)}
          sub="unpaid deposits & balances"
          info="Sum of unpaid 50% deposits and 50% balances across all active retainers."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionCard title="Rollover expiring" items={expiring} emptyText="Nothing expiring in the next 3 weeks." />
        <AttentionCard title="Payments outstanding" items={duePayments} emptyText="Everyone's paid up." />
        <AttentionCard title="Over allotment" items={over} emptyText="No one's over this month." />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1.5 text-[15px] text-muted">Live usage, rollovers and payments across your studio.</p>
      </div>
      <Link
        href="/clients/new"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
      >
        <span className="text-base leading-none">+</span> Add client
      </Link>
    </div>
  );
}
