"use client";

import { useState } from "react";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { money } from "@/lib/format";
import type { MonthlyTotal } from "@/lib/aggregate";

export function StudioTrends({ months }: { months: MonthlyTotal[] }) {
  const [metric, setMetric] = useState<"delivered" | "revenue">("delivered");

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">Monthly trend</h2>
        <div className="flex rounded-lg bg-surface-2 p-1 ring-1 ring-border">
          {(["delivered", "revenue"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                metric === m ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
              }`}
            >
              {m === "delivered" ? "Delivered" : "Revenue"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <AreaTrend
          key={metric}
          data={months}
          xKey="label"
          height={260}
          series={[
            {
              key: metric,
              label: metric === "delivered" ? "Videos delivered" : "Revenue",
              color: "var(--color-accent)",
            },
          ]}
          valueFormatter={metric === "revenue" ? (n) => money(n) : (n) => String(n)}
        />
      </div>
    </section>
  );
}
