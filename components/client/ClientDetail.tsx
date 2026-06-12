import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { RolloverHero } from "@/components/client/RolloverHero";
import { ThisMonthCard } from "@/components/client/ThisMonthCard";
import { PaymentsCard } from "@/components/client/PaymentsCard";
import { HistoryCard } from "@/components/client/HistoryCard";
import { UtilizationTrend } from "@/components/client/UtilizationTrend";
import { DeliveriesLog } from "@/components/client/DeliveriesLog";
import { RetainerTermsCard } from "@/components/client/RetainerTermsCard";
import { AdminClientControls } from "@/components/client/AdminClientControls";
import type { ClientView } from "@/lib/retainer/assemble";

export function ClientDetail({
  view,
  readOnly,
  backHref = "/dashboard",
}: {
  view: ClientView;
  readOnly: boolean;
  backHref?: string;
}) {
  const { client, retainer, computation } = view;

  return (
    <div className="rise space-y-6">
      {!readOnly && (
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-faint transition hover:text-foreground">
          <span aria-hidden>←</span> All clients
        </Link>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{client.name}</h1>
            <StatusPill health={view.health} />
          </div>
          <p className="mt-1.5 text-[15px] text-muted">
            {client.company ? `${client.company} · ` : ""}
            <span className="text-faint">{client.email}</span>
          </p>
        </div>
      </header>

      {!retainer || !computation ? (
        <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-muted">No retainer is set up for this client yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <RolloverHero computation={computation} />
            <ThisMonthCard computation={computation} />
          </div>

          <UtilizationTrend computation={computation} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentsCard
              clientId={client.id}
              payments={view.payments}
              outstanding={view.outstanding}
              monthlyPrice={retainer.monthly_price}
              readOnly={readOnly}
            />
            <HistoryCard computation={computation} />
          </div>

          <DeliveriesLog clientId={client.id} videos={view.videos} readOnly={readOnly} />

          <RetainerTermsCard retainer={retainer} readOnly={readOnly} />

          {!readOnly && <AdminClientControls client={client} />}
        </>
      )}
    </div>
  );
}
