import { RolloverHero } from "@/components/client/RolloverHero";
import { ThisMonthCard } from "@/components/client/ThisMonthCard";
import { HistoryCard } from "@/components/client/HistoryCard";
import { RetainerTermsCard } from "@/components/client/RetainerTermsCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ClientView } from "@/lib/retainer/assemble";

export function MyRetainer({ view }: { view: ClientView }) {
  const { retainer, computation } = view;

  if (!retainer || !computation) {
    return (
      <EmptyState
        title="Your retainer is being set up"
        description="Your studio hasn't finished configuring your retainer yet. Check back shortly."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <RolloverHero computation={computation} />
        <ThisMonthCard computation={computation} />
      </div>
      <HistoryCard computation={computation} />
      <RetainerTermsCard retainer={retainer} readOnly />
    </div>
  );
}
