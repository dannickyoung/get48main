import { requireClient } from "@/lib/auth";
import { getClientView } from "@/lib/data";
import { MyRetainer } from "@/components/client/MyRetainer";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MyRetainerPage() {
  const profile = await requireClient();
  const view = await getClientView(profile.client_id!);

  if (!view) {
    return (
      <EmptyState title="Account not ready" description="Your account isn't fully set up yet. Please contact the studio." />
    );
  }

  return (
    <div className="rise space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{view.client.name}</h1>
          <p className="mt-1 text-[15px] text-muted">Your retainer at a glance.</p>
        </div>
        <StatusPill health={view.health} />
      </header>
      <MyRetainer view={view} />
    </div>
  );
}
