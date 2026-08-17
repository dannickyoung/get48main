import { Suspense } from "react";
import { MediaVideo } from "iconoir-react";
import { format } from "date-fns";
import { getAllClientViews } from "@/lib/data";
import { allDeliveries } from "@/lib/aggregate";
import { todaySGT } from "@/lib/time";
import { parseDateOnly } from "@/lib/retainer/engine";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/admin/FilterBar";
import { QuickLogDelivery } from "@/components/admin/QuickLogDelivery";
import { DeliveriesBoard, deliveryMonthKey } from "@/components/admin/DeliveriesBoard";

type Search = { view?: string; client?: string; month?: string };
const DONE = new Set(["final", "completed"]);

export default async function DeliveriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const view = sp.view === "production" || sp.view === "done" ? sp.view : "all";
  const clientFilter = sp.client ?? "";
  const monthFilter = sp.month ?? "";

  const views = await getAllClientViews();
  const all = allDeliveries(views);
  const clients = views
    .filter((v) => !v.client.archived && v.computation)
    .map((v) => ({ id: v.client.id, name: v.client.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ----- KPIs -----
  const today = todaySGT();
  const thisMonth = format(today, "yyyy-MM");
  const qty = (rows: typeof all) => rows.reduce((s, d) => s + d.quantity, 0);
  const thisMonthRows = all.filter((d) => deliveryMonthKey(d) === thisMonth);
  const inProduction = all.filter((d) => !DONE.has(d.status));
  const completedThisMonth = thisMonthRows.filter((d) => DONE.has(d.status));

  // ----- filters -----
  const months = [...new Set(all.map(deliveryMonthKey))]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((k) => ({ value: k, label: format(parseDateOnly(`${k}-01`), "MMMM yyyy") }));

  const rows = all.filter(
    (d) =>
      (view === "all" || (view === "done" ? DONE.has(d.status) : !DONE.has(d.status))) &&
      (!clientFilter || d.client_id === clientFilter) &&
      (!monthFilter || deliveryMonthKey(d) === monthFilter),
  );
  // Current month (or the newest month present) starts expanded; a chosen month always does.
  const openKeys = new Set<string>(monthFilter ? [monthFilter] : [thisMonth, ...(rows[0] ? [deliveryMonthKey(rows[0])] : [])]);
  if (view === "production") for (const d of rows) openKeys.add(deliveryMonthKey(d));

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Deliveries</h1>
        <p className="mt-1.5 text-[15px] text-muted">Log videos as you deliver them and move each one through V1 → V2 → V3 → Final → Completed.</p>
      </div>

      {clients.length === 0 && all.length === 0 ? (
        <EmptyState
          icon={<MediaVideo width={28} height={28} strokeWidth={1.2} />}
          title="No deliveries yet"
          description="Add a client with a retainer, then log delivered videos here or from the client's page."
          actionHref="/clients/new"
          actionLabel="Add a client"
        />
      ) : (
        <>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Delivered this month" value={qty(thisMonthRows)} sub={format(today, "MMMM yyyy")} accent={qty(thisMonthRows) > 0} />
            <Stat
              label="In production"
              value={<span className={inProduction.length ? "text-warn" : undefined}>{qty(inProduction)}</span>}
              sub={inProduction.length ? "not yet final / completed" : "everything's completed"}
            />
            <Stat label="Completed this month" value={qty(completedThisMonth)} sub="final or completed" />
            <Stat label="All time" value={qty(all)} sub={`${all.length} ${all.length === 1 ? "delivery" : "deliveries"} logged`} />
          </div>

          {clients.length > 0 && <QuickLogDelivery clients={clients} />}

          <Suspense>
            <FilterBar
              tabs={[
                { value: "all", label: "All" },
                { value: "production", label: "In production", count: qty(inProduction), tone: "warn" },
                { value: "done", label: "Completed" },
              ]}
              activeTab={view}
              selects={[
                { name: "client", label: "Client", options: clients.map((c) => ({ value: c.id, label: c.name })), allLabel: "All clients" },
                { name: "month", label: "Month", options: months, allLabel: "All months" },
              ]}
            />
          </Suspense>

          <DeliveriesBoard deliveries={rows} openKeys={openKeys} />
        </>
      )}
    </div>
  );
}
