import { MediaVideo } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { allDeliveries } from "@/lib/aggregate";
import { DeliveriesFeed } from "@/components/admin/DeliveriesFeed";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DeliveriesPage() {
  const views = await getAllClientViews();
  const deliveries = allDeliveries(views);
  const clients = views
    .filter((v) => !v.client.archived && v.computation)
    .map((v) => ({ id: v.client.id, name: v.client.name }));

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Deliveries</h1>
        <p className="mt-1.5 text-[15px] text-muted">Log and review every video delivered across your clients.</p>
      </div>

      {clients.length === 0 && deliveries.length === 0 ? (
        <EmptyState
          icon={<MediaVideo width={28} height={28} strokeWidth={1.2} />}
          title="No deliveries yet"
          description="Add a client with a retainer, then log delivered videos here or from the client's page."
          actionHref="/clients/new"
          actionLabel="Add a client"
        />
      ) : (
        <DeliveriesFeed deliveries={deliveries} clients={clients} />
      )}
    </div>
  );
}
