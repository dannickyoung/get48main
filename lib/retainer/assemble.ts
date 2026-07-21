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
  /** Overage videos billed on this row (balance only) and their charge. */
  overageCount: number;
  overageCharge: number;
};

export type HealthStatus =
  | "on_track"
  | "at_risk"
  | "over"
  | "behind"
  | "paused"
  | "ended"
  | "no_retainer";

export type EffectiveTerms = {
  videosPerMonth: number;
  monthlyPrice: number;
  overageRate: number;
};

export type ClientView = {
  client: Client;
  retainer: Retainer | null;
  computation: RetainerComputation | null;
  payments: ScheduledPayment[];
  videos: VideoRow[];
  months: RetainerMonth[];
  /** The current billing month's effective terms (base merged with its override). */
  currentTerms: EffectiveTerms | null;
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
    return { client, retainer: null, computation: null, payments: [], videos, months, currentTerms: null, outstanding: 0, health: "no_retainer" };
  }

  const deliveries: Delivery[] = videos.map((v) => ({
    id: v.id,
    deliveredOn: v.delivered_on,
    quantity: v.quantity,
    title: v.title,
  }));

  // Per-month overrides for allotment (engine), price + overage rate (payments).
  const videoOverrides: Record<number, number> = {};
  const priceOverrides: Record<number, number> = {};
  const overageRateOverrides: Record<number, number> = {};
  for (const m of months) {
    if (m.videos_per_month != null) videoOverrides[m.period_index] = m.videos_per_month;
    if (m.monthly_price != null) priceOverrides[m.period_index] = Number(m.monthly_price);
    if (m.overage_rate != null) overageRateOverrides[m.period_index] = Number(m.overage_rate);
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

  // Overage videos per billing month → billed on that month's balance.
  const overageByPeriod: Record<number, number> = {};
  for (const p of computation.periods) overageByPeriod[p.index] = p.overage;
  if (computation.current.state === "active") {
    overageByPeriod[computation.current.periodIndex] = computation.current.overageThisPeriod;
  }

  const schedule = buildPaymentSchedule(
    retainer,
    payments,
    computation,
    asOf,
    priceOverrides,
    overageByPeriod,
    overageRateOverrides,
  );
  const outstanding = schedule.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  // The current billing month's effective terms: base retainer merged with any
  // override for that specific month.
  const ci = computation.current.periodIndex;
  const currentTerms: EffectiveTerms = {
    videosPerMonth: videoOverrides[ci] ?? retainer.videos_per_month,
    monthlyPrice: priceOverrides[ci] ?? Number(retainer.monthly_price),
    overageRate: overageRateOverrides[ci] ?? Number(retainer.overage_rate),
  };

  return {
    client,
    retainer,
    computation,
    payments: schedule,
    videos,
    months,
    currentTerms,
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
  overageByPeriod: Record<number, number> = {},
  overageRateOverrides: Record<number, number> = {},
): ScheduledPayment[] {
  const start = parseDateOnly(retainer.start_date);
  const lastIndex = computation.current.state === "active" ? computation.current.periodIndex : -1;
  const upfront = retainer.payment_terms === "upfront";

  const stored = new Map<string, Payment>();
  for (const p of payments) stored.set(`${p.period_index}:${p.kind}`, p);

  const rows: ScheduledPayment[] = [];
  for (let k = 0; k <= lastIndex; k++) {
    const periodStart = addMonths(start, k);
    const periodEnd = addMonths(start, k + 1);
    const fullPrice = priceOverrides[k] ?? Number(retainer.monthly_price);
    const half = fullPrice / 2;
    const overageCount = overageByPeriod[k] ?? 0;
    const overageRate = (overageRateOverrides[k] ?? Number(retainer.overage_rate)) || 0;
    const overageCharge = overageCount * overageRate;

    // upfront: whole price at month start ('full'), overage (if any) at month end
    //          ('overage'). split: 50% deposit at start, 50% balance + overage at end.
    // Distinct kinds per mode so switching a client between modes never leaks old
    // records (e.g. a split 'balance') into the other mode's schedule.
    const kinds: PaymentKind[] = upfront ? ["full", "overage"] : ["deposit", "balance"];
    for (const kind of kinds) {
      const carriesOverage = kind === "balance" || kind === "overage";
      const dueDate = carriesOverage ? periodEnd : periodStart;
      const rec = stored.get(`${k}:${kind}`);
      // The upfront overage row exists only to bill month-end overage — skip it
      // when there's none computed and none recorded.
      if (kind === "overage" && !rec && overageCharge === 0) continue;
      // Pre-overage base for this row, from the month's effective (overridable) price.
      const base = kind === "full" ? fullPrice : kind === "overage" ? 0 : half; // deposit|balance → half
      const paid = rec?.status === "paid";
      // Paid rows keep their recorded amount; pending rows always follow the
      // month's current terms (effective price + any overage).
      const amount = paid ? Number(rec!.amount) : base + (carriesOverage ? overageCharge : 0);
      rows.push({
        periodIndex: k,
        periodStart,
        kind,
        dueDate,
        amount,
        status: paid ? "paid" : "pending",
        paidOn: paid ? rec!.paid_on : null,
        overdue: !paid && dueDate < asOf,
        overageCount: carriesOverage ? overageCount : 0,
        overageCharge: carriesOverage ? overageCharge : 0,
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
