import { Suspense } from "react";
import { format } from "date-fns";
import { requireClient } from "@/lib/auth";
import { getClientView } from "@/lib/data";
import { todaySGT } from "@/lib/time";
import { parseDateOnly } from "@/lib/retainer/engine";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/admin/FilterBar";
import { DeliveriesBoard, deliveryMonthKey } from "@/components/admin/DeliveriesBoard";
import type { DeliveryWithClient } from "@/lib/aggregate";

type Search = { view?: string; month?: string };
const DONE = new Set(["final", "completed"]);

export default async function MyDeliveriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const view = sp.view === "production" || sp.view === "done" ? sp.view : "all";
  const monthFilter = sp.month ?? "";

  const profile = await requireClient();
  const v = await getClientView(profile.client_id!);
  if (!v) return <EmptyState title="Account not ready" description="Please contact the studio." />;

  const all: DeliveryWithClient[] = v.videos.map((d) => ({ ...d, clientName: v.client.name })).sort((a, b) => (a.delivered_on < b.delivered_on ? 1 : -1));
  const today = todaySGT();
  const thisMonth = format(today, "yyyy-MM");
  const qty = (rows: DeliveryWithClient[]) => rows.reduce((s, d) => s + d.quantity, 0);
  const inProduction = all.filter((d) => !DONE.has(d.status));
  const cur = v.computation?.current;

  const months = [...new Set(all.map(deliveryMonthKey))]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((k) => ({ value: k, label: format(parseDateOnly(`${k}-01`), "MMMM yyyy") }));

  const rows = all.filter(
    (d) =>
      (view === "all" || (view === "done" ? DONE.has(d.status) : !DONE.has(d.status))) &&
      (!monthFilter || deliveryMonthKey(d) === monthFilter),
  );
  const openKeys = new Set<string>(monthFilter ? [monthFilter] : [thisMonth, ...(rows[0] ? [deliveryMonthKey(rows[0])] : [])]);
  if (view === "production") for (const d of rows) openKeys.add(deliveryMonthKey(d));

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Deliveries</h1>
        <p className="mt-1.5 text-[15px] text-muted">Every video on your retainer, month by month — and where each one is in production.</p>
      </div>

      {all.length === 0 ? (
        <EmptyState title="No videos yet" description="Delivered videos will show up here as the studio logs them." />
      ) : (
        <>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="This retainer month"
              value={cur ? `${cur.totalUsedThisPeriod} / ${cur.allotment}` : "—"}
              sub={cur ? `resets ${format(cur.periodEnd, "d MMM")}` : undefined}
              accent
            />
            <Stat
              label="In production"
              value={<span className={inProduction.length ? "text-warn" : undefined}>{qty(inProduction)}</span>}
              sub={inProduction.length ? "being edited right now" : "everything's delivered"}
            />
            <Stat label="Rollover available" value={cur?.rollover.available ?? 0} sub={cur?.rollover.nextExpiry ? `next expiry ${format(cur.rollover.nextExpiry, "d MMM")}` : "none carried over"} />
            <Stat label="All time" value={qty(all)} sub={`${all.length} ${all.length === 1 ? "delivery" : "deliveries"}`} />
          </div>

          <Suspense>
            <FilterBar
              tabs={[
                { value: "all", label: "All" },
                { value: "production", label: "In production", count: qty(inProduction), tone: "warn" },
                { value: "done", label: "Completed" },
              ]}
              activeTab={view}
              selects={[{ name: "month", label: "Month", options: months, allLabel: "All months" }]}
            />
          </Suspense>

          <DeliveriesBoard deliveries={rows} openKeys={openKeys} readOnly />
        </>
      )}
    </div>
  );
}
