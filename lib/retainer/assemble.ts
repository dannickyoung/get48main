/**
 * Pure assembly: turn raw rows (client, retainer, videos, payments) into the
 * fully-derived view model the UI renders. No database access here so it can
 * run anywhere and be reasoned about in isolation.
 */
import { addMonths } from "date-fns";
import { computeRetainer, parseDateOnly, type Delivery, type RetainerComputation } from "./engine";
import type { Client, Payment, PaymentKind, Retainer, RetainerMonth, VideoRow } from "@/lib/types";

export type ScheduledPayment = {
  periodIndex: number;
  periodStart: Date;
  kind: PaymentKind;
  /** When this half is due. deposit → period start, balance → period end. */
  dueDate: Date;
  amount: number;
  status: "pending" | "paid";
  paidOn: string | null;
  overdue: boolean;
};

export type HealthStatus =
  | "on_track"
  | "at_risk"
  | "over"
  | "behind"
  | "paused"
  | "ended"
  | "no_retainer";

export type ClientView = {
  client: Client;
  retainer: Retainer | null;
  computation: RetainerComputation | null;
  payments: ScheduledPayment[];
  videos: VideoRow[];
  months: RetainerMonth[];
  outstanding: number;
  health: HealthStatus;
};

export function assembleClient(
  client: Client,
  retainer: Retainer | null,
  videos: VideoRow[],
  payments: Payment[],
  asOf: Date = new Date(),
  months: RetainerMonth[] = [],
): ClientView {
  if (!retainer) {
    return { client, retainer: null, computation: null, payments: [], videos, months, outstanding: 0, health: "no_retainer" };
  }

  const deliveries: Delivery[] = videos.map((v) => ({
    id: v.id,
    deliveredOn: v.delivered_on,
    quantity: v.quantity,
    title: v.title,
  }));

  // Per-month overrides for allotment (engine) and price (payments).
  const videoOverrides: Record<number, number> = {};
  const priceOverrides: Record<number, number> = {};
  for (const m of months) {
    if (m.videos_per_month != null) videoOverrides[m.period_index] = m.videos_per_month;
    if (m.monthly_price != null) priceOverrides[m.period_index] = Number(m.monthly_price);
  }

  const computation = computeRetainer(
    {
      startDate: retainer.start_date,
      videosPerMonth: retainer.videos_per_month,
      rolloverCap: retainer.rollover_cap,
      rolloverWeeks: retainer.rollover_weeks,
      monthlyVideos: videoOverrides,
    },
    deliveries,
    asOf,
  );

  const schedule = buildPaymentSchedule(retainer, payments, computation, asOf, priceOverrides);
  const outstanding = schedule.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return {
    client,
    retainer,
    computation,
    payments: schedule,
    videos,
    months,
    outstanding,
    health: deriveHealth(retainer, computation, schedule),
  };
}

function buildPaymentSchedule(
  retainer: Retainer,
  payments: Payment[],
  computation: RetainerComputation,
  asOf: Date,
  priceOverrides: Record<number, number> = {},
): ScheduledPayment[] {
  const start = parseDateOnly(retainer.start_date);
  const lastIndex = computation.current.state === "active" ? computation.current.periodIndex : -1;

  const stored = new Map<string, Payment>();
  for (const p of payments) stored.set(`${p.period_index}:${p.kind}`, p);

  const rows: ScheduledPayment[] = [];
  for (let k = 0; k <= lastIndex; k++) {
    const periodStart = addMonths(start, k);
    const periodEnd = addMonths(start, k + 1);
    const half = (priceOverrides[k] ?? Number(retainer.monthly_price)) / 2;
    for (const kind of ["deposit", "balance"] as PaymentKind[]) {
      const dueDate = kind === "deposit" ? periodStart : periodEnd;
      const rec = stored.get(`${k}:${kind}`);
      const amount = rec ? Number(rec.amount) : half;
      const status = rec?.status === "paid" ? "paid" : "pending";
      rows.push({
        periodIndex: k,
        periodStart,
        kind,
        dueDate,
        amount,
        status,
        paidOn: rec?.paid_on ?? null,
        overdue: status === "pending" && dueDate < asOf,
      });
    }
  }
  return rows;
}

function deriveHealth(
  retainer: Retainer,
  computation: RetainerComputation,
  schedule: ScheduledPayment[],
): HealthStatus {
  if (retainer.status === "paused") return "paused";
  if (retainer.status === "ended") return "ended";

  const overdue = schedule.some((p) => p.overdue);
  if (overdue) return "behind";

  if (computation.current.overageThisPeriod > 0) return "over";

  const days = computation.current.rollover.daysToNextExpiry;
  if (computation.current.rollover.available > 0 && days !== null && days <= 14) return "at_risk";

  return "on_track";
}

export const HEALTH_META: Record<HealthStatus, { label: string; tone: "good" | "warn" | "bad" | "muted" }> = {
  on_track: { label: "On track", tone: "good" },
  at_risk: { label: "Expiring soon", tone: "warn" },
  over: { label: "Over allotment", tone: "warn" },
  behind: { label: "Payment due", tone: "bad" },
  paused: { label: "Paused", tone: "muted" },
  ended: { label: "Ended", tone: "muted" },
  no_retainer: { label: "No retainer", tone: "muted" },
};
