/**
 * Post-retainer access window. When a retainer is stopped the client keeps
 * dashboard access for CLIENT_ACCESS_DAYS (counting the stop day), then is
 * locked out and their logins are deleted.
 */
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { parseDateOnly } from "./engine";
import type { Retainer } from "@/lib/types";

export const CLIENT_ACCESS_DAYS = 10;

/** Last day (inclusive, 'yyyy-MM-dd') a client stopped on `stoppedOn` can still sign in. */
export function accessUntilFor(stoppedOn: string): string {
  return format(addDays(parseDateOnly(stoppedOn), CLIENT_ACCESS_DAYS - 1), "yyyy-MM-dd");
}

type AccessFields = Pick<Retainer, "status" | "access_until">;

/** True once an ended retainer's access window has passed. */
export function accessClosed(retainer: AccessFields | null | undefined, today: string): boolean {
  return retainer?.status === "ended" && !!retainer.access_until && today > retainer.access_until;
}

/** Days of access left including today (≥ 1 while open), or null if no window applies. */
export function accessDaysLeft(retainer: AccessFields | null | undefined, today: string): number | null {
  if (retainer?.status !== "ended" || !retainer.access_until || today > retainer.access_until) return null;
  return differenceInCalendarDays(parseDateOnly(retainer.access_until), parseDateOnly(today)) + 1;
}
