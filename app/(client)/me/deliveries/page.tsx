import { requireClient } from "@/lib/auth";
import { getClientView } from "@/lib/data";
import { DeliveriesLog } from "@/components/client/DeliveriesLog";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MyDeliveriesPage() {
  const profile = await requireClient();
  const view = await getClientView(profile.client_id!);
  if (!view) return <EmptyState title="Account not ready" description="Please contact the studio." />;

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Deliveries</h1>
        <p className="mt-1.5 text-[15px] text-muted">Every video delivered on your retainer.</p>
      </div>
      <DeliveriesLog clientId={view.client.id} videos={view.videos} readOnly />
    </div>
  );
}
