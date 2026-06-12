/**
 * Retainer rollover engine — the single source of truth for "how many videos
 * does a client have, how many roll over, and when do they expire".
 *
 * Nothing about balances is stored in the database. We store only facts:
 *   - the retainer terms (start date, videos/month, rollover cap, expiry weeks)
 *   - the individual videos delivered (date + quantity)
 * Everything else is *derived* by replaying the timeline here, so the numbers
 * can never drift out of sync.
 *
 * Rollover rules implemented (defaults match the standard agreement):
 *   1. Up to `rolloverCap` (5) unused videos may roll into the following month.
 *   2. A rolled-over video expires `rolloverWeeks` (8) weeks after the end of the
 *      billing month in which it accrued — then it is gone (no refund/credit).
 *   3. No more than `rolloverCap` (5) rolled-over videos may be held at once;
 *      anything beyond the cap is forfeited at month-end.
 *
 * Consumption order: a delivered video is drawn from the current month's fresh
 * allotment first, then from the rollover buffer (soonest-to-expire first).
 * Anything beyond both is an overage (billable extra).
 */

import { addMonths, addWeeks, differenceInCalendarDays } from "date-fns";

export type RetainerTerms = {
  /** Billing anchor — 'yyyy-MM-dd'. Billing months run from this day each month. */
  startDate: string;
  videosPerMonth: number;
  /** Max videos that may roll over / be held at once. Default 5. */
  rolloverCap: number;
  /** Weeks a rolled-over video survives past its accrual month-end. Default 8. */
  rolloverWeeks: number;
  /** Per-month allotment overrides keyed by 0-based period index. */
  monthlyVideos?: Record<number, number>;
};

export type Delivery = {
  id: string;
  /** 'yyyy-MM-dd' */
  deliveredOn: string;
  quantity: number;
  title?: string | null;
};

/** A finalised (completed) billing month. */
export type PeriodSummary = {
  index: number;
  start: Date;
  end: Date;
  allotment: number;
  /** Rollover credits available at the start of this month. */
  rolledIn: number;
  usedFromFresh: number;
  usedFromRollover: number;
  totalUsed: number;
  overage: number;
  /** Credits that rolled out to the next month (the carried pool). */
  rolledOut: number;
  /** Rollover credits that expired unused inside this month. */
  expired: number;
  /** Unused videos lost to the rollover cap or fresh-allotment cap. */
  forfeited: number;
};

export type LiveRollover = {
  /** Total rollover videos usable right now. THE hero number. */
  available: number;
  /** Soonest expiry among current rollover credits, or null if none. */
  nextExpiry: Date | null;
  /** Videos in the batch that expires next. */
  nextExpiryCount: number;
  /** Days until that next expiry (negative impossible — expired are dropped). */
  daysToNextExpiry: number | null;
};

export type CurrentSnapshot = {
  state: "not_started" | "active";
  periodIndex: number;
  periodStart: Date;
  periodEnd: Date;
  daysLeftInPeriod: number;
  allotment: number;
  /** Fresh allotment used this month. */
  usedFromFresh: number;
  /** Rollover credits used this month. */
  usedFromRollover: number;
  /** Fresh allotment remaining this month. */
  freshRemaining: number;
  /** Total videos delivered this month (fresh + rollover). */
  totalUsedThisPeriod: number;
  overageThisPeriod: number;
  rollover: LiveRollover;
  /** If no more videos are delivered, how many will roll into next month. */
  projectedRollover: number;
};

export type RetainerComputation = {
  terms: Required<RetainerTerms>;
  periods: PeriodSummary[];
  current: CurrentSnapshot;
  totals: {
    delivered: number;
    overage: number;
    expired: number;
    forfeited: number;
  };
};

type Lot = { remaining: number; expiresAt: Date };

/** Parse a 'yyyy-MM-dd' string as a local-midnight Date (TZ-stable). */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const DEFAULT_ROLLOVER_CAP = 5;
export const DEFAULT_ROLLOVER_WEEKS = 8;

export function computeRetainer(
  termsInput: RetainerTerms,
  deliveries: Delivery[],
  asOf: Date = new Date(),
): RetainerComputation {
  const terms: Required<RetainerTerms> = {
    startDate: termsInput.startDate,
    videosPerMonth: termsInput.videosPerMonth,
    rolloverCap: termsInput.rolloverCap ?? DEFAULT_ROLLOVER_CAP,
    rolloverWeeks: termsInput.rolloverWeeks ?? DEFAULT_ROLLOVER_WEEKS,
    monthlyVideos: termsInput.monthlyVideos ?? {},
  };

  const start = parseDateOnly(terms.startDate);
  const cap = terms.rolloverCap;
  // Per-month allotment (override or the retainer default).
  const videosForPeriod = (k: number) => terms.monthlyVideos[k] ?? terms.videosPerMonth;

  // Sorted deliveries, normalised.
  const sorted = [...deliveries]
    .map((d) => ({ ...d, date: parseDateOnly(d.deliveredOn) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Not started yet.
  if (asOf < start) {
    return {
      terms,
      periods: [],
      current: {
        state: "not_started",
        periodIndex: -1,
        periodStart: start,
        periodEnd: addMonths(start, 1),
        daysLeftInPeriod: differenceInCalendarDays(start, asOf),
        allotment: videosForPeriod(0),
        usedFromFresh: 0,
        usedFromRollover: 0,
        freshRemaining: videosForPeriod(0),
        totalUsedThisPeriod: 0,
        overageThisPeriod: 0,
        rollover: { available: 0, nextExpiry: null, nextExpiryCount: 0, daysToNextExpiry: null },
        projectedRollover: 0,
      },
      totals: { delivered: 0, overage: 0, expired: 0, forfeited: 0 },
    };
  }

  // How many whole billing months have elapsed → current period index.
  let currentIndex = 0;
  while (addMonths(start, currentIndex + 1) <= asOf) currentIndex++;

  const periods: PeriodSummary[] = [];
  let lots: Lot[] = []; // rollover pool carried between months
  const totals = { delivered: 0, overage: 0, expired: 0, forfeited: 0 };

  const periodDeliveries = (pStart: Date, pEnd: Date, until?: Date) =>
    sorted.filter(
      (d) => d.date >= pStart && d.date < pEnd && (!until || d.date <= until),
    );

  // ----- finalise every completed month -----
  for (let k = 0; k < currentIndex; k++) {
    const pStart = addMonths(start, k);
    const pEnd = addMonths(start, k + 1);
    const rolledIn = sumLots(lots);

    let fresh = videosForPeriod(k);
    let usedFromFresh = 0;
    let usedFromRollover = 0;
    let overage = 0;

    for (const d of periodDeliveries(pStart, pEnd)) {
      // Expire lots that lapsed on/before this delivery date.
      totals.expired += dropExpired(lots, d.date);
      let qty = d.quantity;
      // This month's allotment first.
      const takeFresh = Math.min(fresh, qty);
      fresh -= takeFresh;
      qty -= takeFresh;
      usedFromFresh += takeFresh;
      // Then rollover buffer (soonest-expiring first).
      lots.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
      for (const lot of lots) {
        if (qty <= 0) break;
        const take = Math.min(lot.remaining, qty);
        lot.remaining -= take;
        qty -= take;
        usedFromRollover += take;
      }
      lots = lots.filter((l) => l.remaining > 0);
      // Remainder = overage.
      overage += qty;
    }

    const expiredAtEnd = dropExpired(lots, pEnd);
    totals.expired += expiredAtEnd;
    let periodExpired = expiredAtEnd; // (within-period expiries already counted in totals; track per-period below)

    // Roll unused fresh allotment forward (capped).
    const rolledFresh = Math.min(fresh, cap);
    let forfeited = fresh - rolledFresh; // unused fresh beyond what may roll
    if (rolledFresh > 0) {
      lots.push({ remaining: rolledFresh, expiresAt: addWeeks(pEnd, terms.rolloverWeeks) });
    }

    // Cap the total held pool: keep soonest-expiring, forfeit the surplus.
    let carried = sumLots(lots);
    if (carried > cap) {
      lots.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
      let budget = cap;
      const kept: Lot[] = [];
      for (const lot of lots) {
        const take = Math.min(lot.remaining, budget);
        if (take > 0) kept.push({ remaining: take, expiresAt: lot.expiresAt });
        forfeited += lot.remaining - take;
        budget -= take;
      }
      lots = kept;
      carried = cap;
    }

    totals.forfeited += forfeited;
    totals.delivered += usedFromFresh + usedFromRollover;
    totals.overage += overage;

    // Per-period expired = within-period expiries are folded into totals.expired;
    // for the row we report the end-of-period expiry (close enough + meaningful).
    periods.push({
      index: k,
      start: pStart,
      end: pEnd,
      allotment: videosForPeriod(k),
      rolledIn,
      usedFromFresh,
      usedFromRollover,
      totalUsed: usedFromFresh + usedFromRollover,
      overage,
      rolledOut: carried,
      expired: periodExpired,
      forfeited,
    });
  }

  // ----- live (current, unfinished) month -----
  const cStart = addMonths(start, currentIndex);
  const cEnd = addMonths(start, currentIndex + 1);
  let fresh = videosForPeriod(currentIndex);
  let usedFromFresh = 0;
  let usedFromRollover = 0;
  let overageThisPeriod = 0;

  for (const d of periodDeliveries(cStart, cEnd, asOf)) {
    totals.expired += dropExpired(lots, d.date);
    let qty = d.quantity;
    // This month's allotment first.
    const takeFresh = Math.min(fresh, qty);
    fresh -= takeFresh;
    qty -= takeFresh;
    usedFromFresh += takeFresh;
    // Then rollover buffer (soonest-expiring first).
    lots.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    for (const lot of lots) {
      if (qty <= 0) break;
      const take = Math.min(lot.remaining, qty);
      lot.remaining -= take;
      qty -= take;
      usedFromRollover += take;
    }
    lots = lots.filter((l) => l.remaining > 0);
    overageThisPeriod += qty;
  }

  // Expire anything lapsed as of today.
  totals.expired += dropExpired(lots, asOf);
  lots.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

  const available = sumLots(lots);
  const nextLot = lots[0] ?? null;
  const nextExpiry = nextLot ? nextLot.expiresAt : null;
  const nextExpiryCount = nextLot
    ? lots.filter((l) => l.expiresAt.getTime() === nextLot.expiresAt.getTime())
        .reduce((s, l) => s + l.remaining, 0)
    : 0;

  totals.delivered += usedFromFresh + usedFromRollover;
  totals.overage += overageThisPeriod;

  // Projection: if no further deliveries, what rolls into next month.
  const projectedFresh = Math.min(fresh, cap);
  const projectedRollover = Math.min(available + projectedFresh, cap);

  const current: CurrentSnapshot = {
    state: "active",
    periodIndex: currentIndex,
    periodStart: cStart,
    periodEnd: cEnd,
    daysLeftInPeriod: Math.max(0, differenceInCalendarDays(cEnd, asOf)),
    allotment: videosForPeriod(currentIndex),
    usedFromFresh,
    usedFromRollover,
    freshRemaining: fresh,
    totalUsedThisPeriod: usedFromFresh + usedFromRollover,
    overageThisPeriod,
    rollover: {
      available,
      nextExpiry,
      nextExpiryCount,
      daysToNextExpiry: nextExpiry ? differenceInCalendarDays(nextExpiry, asOf) : null,
    },
    projectedRollover,
  };

  return { terms, periods, current, totals };
}

function sumLots(lots: Lot[]): number {
  return lots.reduce((s, l) => s + l.remaining, 0);
}

/** Zero out and return the total remaining of lots that expired on/before `at`. */
function dropExpired(lots: Lot[], at: Date): number {
  let expired = 0;
  for (const lot of lots) {
    if (lot.expiresAt <= at) {
      expired += lot.remaining;
      lot.remaining = 0;
    }
  }
  // Caller filters empties where needed; do it here too for safety.
  for (let i = lots.length - 1; i >= 0; i--) if (lots[i].remaining <= 0) lots.splice(i, 1);
  return expired;
}
