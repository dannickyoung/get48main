"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export type Series = { key: string; label: string; color: string };

export function AreaTrend({
  data,
  xKey,
  series,
  height = 240,
  valueFormatter = (n: number) => String(n),
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  valueFormatter?: (n: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={16}
          tick={{ fill: "var(--color-faint)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            name={s.label}
            type="natural"
            stackId="a"
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#area-${s.key})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

type TooltipPayload = { dataKey: string; name: string; value: number; color: string };

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valueFormatter: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-surface-3 px-3 py-2 text-xs shadow-xl ring-1 ring-border-strong">
      <div className="mb-1.5 font-semibold text-foreground">{label}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto pl-4 font-semibold tnum text-foreground">{valueFormatter(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
