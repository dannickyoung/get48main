// All "today" logic runs in Singapore time (SGT, UTC+8), regardless of where
// the server runs (Vercel is UTC). This keeps billing months, days-to-expiry
// and date defaults aligned with the studio's local day.
const SGT = "Asia/Singapore";

/** Today's date in SGT as 'yyyy-MM-dd'. */
export function todaySGTString(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SGT }).format(new Date());
}

/** Today's SGT calendar date as a Date at local midnight (for engine comparisons). */
export function todaySGT(): Date {
  const [y, m, d] = todaySGTString().split("-").map(Number);
  return new Date(y, m - 1, d);
}
