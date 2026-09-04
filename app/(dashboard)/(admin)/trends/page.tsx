import { GraphUp } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { monthlyStudioTotals } from "@/lib/aggregate";
import { StudioTrends } from "@/components/admin/StudioTrends";
import { Stat } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/lib/format";

export default async function TrendsPage() {
  const views = await getAllClientViews();
  const months = monthlyStudioTotals(views, 12);
  const totalDelivered = months.reduce((s, m) => s + m.delivered, 0);
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const hasData = totalDelivered > 0 || totalRevenue > 0;

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Trends</h1>
        <p className="mt-1.5 text-[15px] text-muted">Studio-wide delivery and revenue, month by month.</p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={<GraphUp width={28} height={28} strokeWidth={1.2} />}
          title="No data to chart yet"
          description="Once you've logged deliveries and recorded payments, monthly trends will build here automatically."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Delivered · 12 mo" value={totalDelivered} sub="videos across all clients" />
            <Stat label="Revenue · 12 mo" value={money(totalRevenue)} sub="payments marked paid" />
          </div>
          <StudioTrends months={months} />
        </>
      )}
    </div>
  );
}
