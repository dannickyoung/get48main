import { getMockView } from "@/lib/mock";
import { MyRetainer } from "@/components/client/MyRetainer";
import { DeliveriesLog } from "@/components/client/DeliveriesLog";
import { PaymentsCard } from "@/components/client/PaymentsCard";
import { StatusPill } from "@/components/ui/StatusPill";

export default function PreviewClient() {
  // Show a rich sample client (the one carrying rollover) as the client sees it.
  const view = getMockView("northwind")!;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        This is the read-only view a <span className="text-foreground">client</span> sees of their own account —
        no editing, scoped to just their retainer.
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{view.client.name}</h1>
          <p className="mt-1 text-[15px] text-muted">Your retainer at a glance.</p>
        </div>
        <StatusPill health={view.health} />
      </header>

      <MyRetainer view={view} />

      <PaymentsCard
        clientId={view.client.id}
        payments={view.payments}
        outstanding={view.outstanding}
        monthlyPrice={view.retainer?.monthly_price ?? 0}
        readOnly
      />

      <DeliveriesLog clientId={view.client.id} videos={view.videos} readOnly />
    </div>
  );
}
