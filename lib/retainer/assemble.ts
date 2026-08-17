/**
 * Pure assembly: turn raw rows (client, retainer, videos, payments) into the
 * fully-derived view model the UI renders. No database access here so it can
 * run anywhere and be reasoned about in isolation.
 */
import { addMonths } from "date-fns";
import { computeRetainer, parseDateOnly, type Delivery, type RetainerComputation } from "./engine";
import type { Client, Invoice, Payment, PaymentKind, Retainer, RetainerMonth, VideoRow } from "@/lib/types";

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
  /** Overage videos billed on this row (month-end rows only) and their charge. */
  overageCount: number;
  overageCharge: number;
  /** Additional (purchased) videos billed on this row (month-end rows only) and their charge. */
  additionalCount: number;
  additionalCharge: number;
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
  /** The month's set allotment (retainer default or the month's override) — excludes additional videos. */
  videosPerMonth: number;
  monthlyPrice: number;
  overageRate: number;
  /** Extra videos added to this month on top of videosPerMonth. */
  additionalVideos: number;
  /** Price per additional video (0–1000). */
  additionalVideoCost: number;
};

/** Additional videos bought for one billing month. */
export type AdditionalVideos = { count: number; costPerVideo: number };

export type ClientView = {
  client: Client;
  retainer: Retainer | null;
  computation: RetainerComputation | null;
  payments: ScheduledPayment[];
  videos: VideoRow[];
  months: RetainerMonth[];
  /** Issued invoices, one per billing month (number + issue date). */
  invoices: Invoice[];
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
  invoices: Invoice[] = [],
): ClientView {
  if (!retainer) {
    return { client, retainer: null, computation: null, payments: [], videos, months, invoices, currentTerms: null, outstanding: 0, health: "no_retainer" };
  }

  const deliveries: Delivery[] = videos.map((v) => ({
    id: v.id,
    deliveredOn: v.delivered_on,
    quantity: v.quantity,
    title: v.title,
  }));

  // Per-month overrides for allotment (engine), price + overage rate (payments),
  // plus any additional videos bought for a month (allotment + billing).
  const videoOverrides: Record<number, number> = {};
  const priceOverrides: Record<number, number> = {};
  const overageRateOverrides: Record<number, number> = {};
  const additionalByPeriod: Record<number, AdditionalVideos> = {};
  for (const m of months) {
    if (m.videos_per_month != null) videoOverrides[m.period_index] = m.videos_per_month;
    if (m.monthly_price != null) priceOverrides[m.period_index] = Number(m.monthly_price);
    if (m.overage_rate != null) overageRateOverrides[m.period_index] = Number(m.overage_rate);
    const extra = Math.max(0, Math.floor(Number(m.additional_videos ?? 0)));
    if (extra > 0) {
      additionalByPeriod[m.period_index] = { count: extra, costPerVideo: Number(m.additional_video_cost ?? 0) };
    }
  }

  // The engine sees one allotment per month: the set number (override or
  // default) plus any additional videos bought for that month.
  const engineAllotments: Record<number, number> = { ...videoOverrides };
  for (const [k, a] of Object.entries(additionalByPeriod)) {
    const idx = Number(k);
    engineAllotments[idx] = (videoOverrides[idx] ?? retainer.videos_per_month) + a.count;
  }

  const computation = computeRetainer(
    {
      startDate: retainer.start_date,
      videosPerMonth: retainer.videos_per_month,
      rolloverCap: retainer.rollover_cap,
      rolloverWeeks: retainer.rollover_weeks,
      monthlyVideos: engineAllotments,
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
    additionalByPeriod,
  );
  const outstanding = schedule.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  // The current billing month's effective terms: base retainer merged with any
  // override for that specific month.
  const ci = computation.current.periodIndex;
  const currentTerms: EffectiveTerms = {
    videosPerMonth: videoOverrides[ci] ?? retainer.videos_per_month,
    monthlyPrice: priceOverrides[ci] ?? Number(retainer.monthly_price),
    overageRate: overageRateOverrides[ci] ?? Number(retainer.overage_rate),
    additionalVideos: additionalByPeriod[ci]?.count ?? 0,
    additionalVideoCost: additionalByPeriod[ci]?.costPerVideo ?? 0,
  };

  return {
    client,
    retainer,
    computation,
    payments: schedule,
    videos,
    months,
    invoices,
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
  additionalByPeriod: Record<number, AdditionalVideos> = {},
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
    const additionalCount = additionalByPeriod[k]?.count ?? 0;
    const additionalCharge = additionalCount * (additionalByPeriod[k]?.costPerVideo ?? 0);
    // Everything billed at month-end on top of the base price.
    const extrasCharge = overageCharge + additionalCharge;

    // upfront: whole price at month start ('full'), overage + additional videos
    //          (if any) at month end ('overage'). split: 50% deposit at start,
    //          50% balance + overage + additional videos at end.
    // Distinct kinds per mode so switching a client between modes never leaks old
    // records (e.g. a split 'balance') into the other mode's schedule.
    const kinds: PaymentKind[] = upfront ? ["full", "overage"] : ["deposit", "balance"];
    for (const kind of kinds) {
      const carriesOverage = kind === "balance" || kind === "overage";
      const dueDate = carriesOverage ? periodEnd : periodStart;
      const rec = stored.get(`${k}:${kind}`);
      // The upfront overage row exists only to bill month-end extras (overage +
      // additional videos) — skip it when there's none computed and none recorded.
      if (kind === "overage" && !rec && extrasCharge === 0) continue;
      // Pre-overage base for this row, from the month's effective (overridable) price.
      const base = kind === "full" ? fullPrice : kind === "overage" ? 0 : half; // deposit|balance → half
      const paid = rec?.status === "paid";
      // Paid rows keep their recorded amount; pending rows always follow the
      // month's current terms (effective price + any overage).
      const amount = paid ? Number(rec!.amount) : base + (carriesOverage ? extrasCharge : 0);
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
        additionalCount: carriesOverage ? additionalCount : 0,
        additionalCharge: carriesOverage ? additionalCharge : 0,
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
