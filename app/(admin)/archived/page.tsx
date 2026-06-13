import { Archive } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { ClientRow } from "@/components/ClientRow";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ArchivedPage() {
  const views = await getAllClientViews();
  const archived = views.filter((v) => v.client.archived);

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Archived</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Paused and stopped retainers. They can still sign in to view their account; open one to reactivate it.
        </p>
      </div>

      {archived.length === 0 ? (
        <EmptyState
          icon={<Archive width={28} height={28} strokeWidth={1.2} />}
          title="Nothing archived"
          description="When you pause or stop a client's retainer, they move here automatically."
        />
      ) : (
        <div className="stagger space-y-3">
          {archived.map((v) => (
            <ClientRow key={v.client.id} view={v} />
          ))}
        </div>
      )}
    </div>
  );
}
