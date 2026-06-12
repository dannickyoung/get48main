import { computeRetainer, type Delivery } from "../lib/retainer/engine";

let pass = 0;
let fail = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
}

const terms = { startDate: "2026-01-01", videosPerMonth: 8, rolloverCap: 5, rolloverWeeks: 8 };

// 1) No deliveries → rollover should cap at 5 carried into month 3.
{
  const c = computeRetainer(terms, [], new Date(2026, 2, 15)); // 15 Mar 2026
  eq("no-deliveries: rollover available capped at 5", c.current.rollover.available, 5);
  eq("no-deliveries: projected rollover = 5", c.current.projectedRollover, 5);
  eq("no-deliveries: current period index = 2", c.current.periodIndex, 2);
}

// 2) Overage: 6 delivered against 4/month in the first month.
{
  const t = { startDate: "2026-06-01", videosPerMonth: 4, rolloverCap: 5, rolloverWeeks: 8 };
  const d: Delivery[] = Array.from({ length: 6 }, (_, i) => ({
    id: String(i),
    deliveredOn: `2026-06-1${i}`,
    quantity: 1,
  }));
  const c = computeRetainer(t, d, new Date(2026, 5, 25));
  eq("overage: used 4 of allotment", c.current.usedFromFresh, 4);
  eq("overage: 2 over", c.current.overageThisPeriod, 2);
  eq("overage: 0 rolling", c.current.rollover.available, 0);
}

// 3) Rollover consumed first: month 0 unused (5 roll), month 1 deliver 2 → drawn from rollover.
{
  const t = { startDate: "2026-01-01", videosPerMonth: 8, rolloverCap: 5, rolloverWeeks: 8 };
  const d: Delivery[] = [
    { id: "a", deliveredOn: "2026-02-05", quantity: 2 }, // in month 1
  ];
  const c = computeRetainer(t, d, new Date(2026, 1, 20)); // 20 Feb, month index 1
  eq("consume-rollover-first: 2 used from rollover", c.current.usedFromRollover, 2);
  eq("consume-rollover-first: 0 fresh used", c.current.usedFromFresh, 0);
  eq("consume-rollover-first: 3 rollover left", c.current.rollover.available, 3);
}

// 4) Not started yet.
{
  const c = computeRetainer(terms, [], new Date(2025, 11, 1));
  eq("not-started state", c.current.state, "not_started");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
