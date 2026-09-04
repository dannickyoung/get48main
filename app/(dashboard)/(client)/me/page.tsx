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

  const firstName = view.client.name.trim().split(/\s+/)[0] || view.client.name;

  return (
    <div className="rise space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="mt-1 text-[15px] text-muted">Here&apos;s your retainer at a glance.</p>
        </div>
        <StatusPill health={view.health} />
      </header>
      <MyRetainer view={view} />
    </div>
  );
}
