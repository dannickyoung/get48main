import Link from "next/link";
import { Stat } from "@/components/ui/Stat";
import { ClientRow } from "@/components/ClientRow";
import { money } from "@/lib/format";
import type { ClientView } from "@/lib/retainer/assemble";

export function DashboardView({
  views,
  hrefBase = "/clients",
  addHref = "/clients/new",
  preview = false,
}: {
  views: ClientView[];
  hrefBase?: string;
  addHref?: string;
  preview?: boolean;
}) {
  const active = views.filter((v) => !v.client.archived);
  const archived = views.filter((v) => v.client.archived);

  const deliveredThisMonth = active.reduce((s, v) => s + (v.computation?.current.totalUsedThisPeriod ?? 0), 0);
  const rolloverAtRisk = active.reduce((s, v) => {
    const r = v.computation?.current.rollover;
    return s + (r && r.daysToNextExpiry !== null && r.daysToNextExpiry <= 14 ? r.available : 0);
  }, 0);
  const outstanding = active.reduce((s, v) => s + v.outstanding, 0);

  return (
    <div className="rise space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {active.length} active {active.length === 1 ? "retainer" : "retainers"} · live usage & rollovers
          </p>
        </div>
        <Link
          href={addHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          <span className="text-base leading-none">+</span> Add client
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active clients" value={active.length} />
        <Stat label="Delivered this month" value={deliveredThisMonth} sub="across all retainers" />
        <Stat label="Rollover at risk" value={rolloverAtRisk} accent={rolloverAtRisk > 0} sub="expiring within 14 days" />
        <Stat label="Outstanding" value={money(outstanding)} sub="unpaid deposits & balances" />
      </div>

      <section className="space-y-3">
        {active.length === 0 ? (
          <div className="rounded-2xl bg-surface p-12 text-center ring-1 ring-border">
            <h2 className="font-display text-xl font-semibold">No clients yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">
              Add your first retainer client to start tracking video usage, rollovers and payments.
            </p>
            <Link
              href={addHref}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              <span className="text-base leading-none">+</span> Add your first client
            </Link>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {active.map((v) => (
              <ClientRow key={v.client.id} view={v} hrefBase={hrefBase} />
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">Archived</h2>
          <div className="space-y-3 opacity-60">
            {archived.map((v) => (
              <ClientRow key={v.client.id} view={v} hrefBase={hrefBase} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
