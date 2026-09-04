/**
 * Retainer period helpers — billing months run from the retainer's start day,
 * not the calendar month (a retainer starting 15 Jul bills 15 Jul – 14 Aug).
 * These mirror the engine's `addMonths(start, k)` boundaries so UI groupings
 * line up exactly with what the engine bills.
 */
import { addMonths, format, subDays } from "date-fns";
import { parseDateOnly } from "./engine";

/** 0-based period index containing `date` (negative if before the start). */
export function periodIndexFor(start: Date, date: Date): number {
  let k = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  while (addMonths(start, k) > date) k--;
  while (addMonths(start, k + 1) <= date) k++;
  return k;
}

/** Period index for a 'yyyy-MM-dd' date string. */
export function periodIndexForDate(startDate: string, date: string): number {
  return periodIndexFor(parseDateOnly(startDate), parseDateOnly(date));
}

/** [start, end) bounds of period `k`, matching the engine. */
export function periodBounds(start: Date, k: number): { start: Date; end: Date } {
  return { start: addMonths(start, k), end: addMonths(start, k + 1) };
}

/**
 * Human label for period `k`. A cycle anchored on the 1st is a plain calendar
 * month ("July 2026"); any other anchor spans two months ("Jul – Aug 2026",
 * "Dec 2026 – Jan 2027").
 */
export function periodLabel(start: Date, k: number): string {
  const { start: s, end } = periodBounds(start, k);
  if (s.getDate() === 1) return format(s, "MMMM yyyy");
  const last = subDays(end, 1);
  if (s.getFullYear() === last.getFullYear()) return `${format(s, "MMM")} – ${format(last, "MMM yyyy")}`;
  return `${format(s, "MMM yyyy")} – ${format(last, "MMM yyyy")}`;
}

/** Exact inclusive date range of period `k`, e.g. "15 Jul – 14 Aug". */
export function periodRange(start: Date, k: number): string {
  const { start: s, end } = periodBounds(start, k);
  const last = subDays(end, 1);
  const sameYear = s.getFullYear() === last.getFullYear();
  return `${format(s, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(last, "d MMM yyyy")}`;
}
