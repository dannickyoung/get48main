import { RefreshDouble } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { allRollovers } from "@/lib/aggregate";
import { RolloversBoard } from "@/components/admin/RolloversBoard";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function RolloversPage() {
  const views = await getAllClientViews();
  const rows = allRollovers(views);
  const atRisk = rows.filter((r) => r.available > 0 && r.days != null && r.days <= 14).reduce((s, r) => s + r.available, 0);

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Rollovers</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Carried-over videos ranked by soonest expiry. Up to 5 roll over, lasting 8 weeks past their accrual
          month{atRisk > 0 ? ` — ${atRisk} expiring within 2 weeks.` : "."}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<RefreshDouble width={28} height={28} strokeWidth={1.2} />}
          title="No active retainers"
          description="Rollover balances appear here once clients have active retainers with unused videos."
        />
      ) : (
        <RolloversBoard rows={rows} />
      )}
    </div>
  );
}
