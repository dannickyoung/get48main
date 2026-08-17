import { computeRetainer, type Delivery } from "../lib/retainer/engine";
import { assembleClient } from "../lib/retainer/assemble";
import { additionalVideosCharge, isValidAdditionalVideoCost } from "../lib/retainer/additional";
import { buildInvoice } from "../lib/invoice/build";
import { invoiceMoney } from "../lib/invoice/config";
import type { Client, Invoice, Payment, Retainer, RetainerMonth, VideoRow } from "../lib/types";

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

// 3) Allotment first: month 0 unused (5 roll), month 1 deliver 2 → counts against
//    this month's allotment, rollover untouched.
{
  const t = { startDate: "2026-01-01", videosPerMonth: 8, rolloverCap: 5, rolloverWeeks: 8 };
  const d: Delivery[] = [
    { id: "a", deliveredOn: "2026-02-05", quantity: 2 }, // in month 1
  ];
  const c = computeRetainer(t, d, new Date(2026, 1, 20)); // 20 Feb, month index 1
  eq("allotment-first: 2 used from allotment", c.current.usedFromFresh, 2);
  eq("allotment-first: 0 from rollover", c.current.usedFromRollover, 0);
  eq("allotment-first: rollover stays 5", c.current.rollover.available, 5);
}

// 3b) Over allotment dips into rollover: deliver 10 against 8/mo with 5 rollover.
{
  const t = { startDate: "2026-01-01", videosPerMonth: 8, rolloverCap: 5, rolloverWeeks: 8 };
  const d: Delivery[] = [{ id: "a", deliveredOn: "2026-02-05", quantity: 10 }];
  const c = computeRetainer(t, d, new Date(2026, 1, 20));
  eq("over-allotment: 8 from allotment", c.current.usedFromFresh, 8);
  eq("over-allotment: 2 from rollover", c.current.usedFromRollover, 2);
  eq("over-allotment: 3 rollover left", c.current.rollover.available, 3);
  eq("over-allotment: 0 overage (buffer covered it)", c.current.overageThisPeriod, 0);
}

// 4) Not started yet.
{
  const c = computeRetainer(terms, [], new Date(2025, 11, 1));
  eq("not-started state", c.current.state, "not_started");
}

// 5) Additional videos: month 1 gets +2 extra at $300 each on a 4/mo retainer.
//    Allotment becomes 6, and the $600 lands on the month-end (balance) row.
{
  const client: Client = { id: "c", name: "C", email: "c@x.io", company: null, notes: null, archived: false, created_at: "2026-01-01" };
  const base: Retainer = {
    id: "r", client_id: "c", start_date: "2026-01-01", videos_per_month: 4, monthly_price: 2000, overage_rate: 500,
    rollover_cap: 5, rollover_weeks: 8, payment_terms: "split", status: "active", created_at: "2026-01-01",
  };
  const month = (p: Partial<RetainerMonth>): RetainerMonth => ({
    id: "m", client_id: "c", period_index: 1, videos_per_month: null, monthly_price: null, overage_rate: null,
    additional_videos: 0, additional_video_cost: 0, created_at: "2026-01-01", ...p,
  });
  const vid = (i: number, on: string, quantity = 1): VideoRow => ({
    id: `v${i}`, client_id: "c", delivered_on: on, quantity, title: null, link: null, status: "completed", created_at: on,
  });
  const asOf = new Date(2026, 1, 20); // 20 Feb 2026 → month index 1

  // Deliver 6 in month 1: against 4 set + 2 additional that's exactly the fresh
  // allotment (0 overage, rollover untouched). Without the extra, 2 would be
  // drawn from the 5 videos rolled over from month 0.
  const videos = Array.from({ length: 6 }, (_, i) => vid(i, `2026-02-0${i + 1}`));

  const withExtra = assembleClient(client, base, videos, [], asOf, [
    month({ period_index: 1, additional_videos: 2, additional_video_cost: 300 }),
  ]);
  const cur = withExtra.computation!.current;
  eq("additional: allotment = set 4 + 2 additional", cur.allotment, 6);
  eq("additional: 6 used from fresh (none from rollover)", [cur.usedFromFresh, cur.usedFromRollover], [6, 0]);
  eq("additional: no overage", cur.overageThisPeriod, 0);
  eq("additional: currentTerms keeps set number separate", [withExtra.currentTerms!.videosPerMonth, withExtra.currentTerms!.additionalVideos, withExtra.currentTerms!.additionalVideoCost], [4, 2, 300]);
  const bal = withExtra.payments.find((p) => p.periodIndex === 1 && p.kind === "balance")!;
  const dep = withExtra.payments.find((p) => p.periodIndex === 1 && p.kind === "deposit")!;
  eq("additional: deposit unchanged (half of 2000)", dep.amount, 1000);
  eq("additional: balance = 1000 + 2×300", bal.amount, 1600);
  eq("additional: balance row carries the breakdown", [bal.additionalCount, bal.additionalCharge], [2, 600]);

  // Without the extra: same deliveries → 4 fresh + 2 from the 5 rollover, no charge.
  const plain = assembleClient(client, base, videos, [], asOf, []);
  eq("no-additional: allotment stays 4", plain.computation!.current.allotment, 4);
  eq("no-additional: 2 drawn from rollover", plain.computation!.current.usedFromRollover, 2);
  eq("no-additional: balance = 1000", plain.payments.find((p) => p.periodIndex === 1 && p.kind === "balance")!.amount, 1000);

  // Additional videos stack on top of a month's videos_per_month override.
  const stacked = assembleClient(client, base, [], [], asOf, [
    month({ period_index: 1, videos_per_month: 10, additional_videos: 3, additional_video_cost: 0 }),
  ]);
  eq("additional+override: allotment = 10 + 3", stacked.computation!.current.allotment, 13);
  eq("additional at $0: no charge on balance", stacked.payments.find((p) => p.periodIndex === 1 && p.kind === "balance")!.amount, 1000);

  // Upfront mode: extras go on the month-end 'overage' row, which now appears for additional-only months.
  const upfront = assembleClient(client, { ...base, payment_terms: "upfront" }, [], [], asOf, [
    month({ period_index: 1, additional_videos: 1, additional_video_cost: 1000 }),
  ]);
  const ov = upfront.payments.find((p) => p.periodIndex === 1 && p.kind === "overage");
  eq("upfront: month-end row exists for additional-only month", !!ov, true);
  eq("upfront: month-end row = 1×1000, no overage", [ov?.amount, ov?.overageCount, ov?.additionalCount], [1000, 0, 1]);
  eq("upfront: no month-end row when nothing extra", upfront.payments.some((p) => p.periodIndex === 0 && p.kind === "overage"), false);

  // Cost bounds + charge helper.
  eq("cost bounds: 0 ok", isValidAdditionalVideoCost(0), true);
  eq("cost bounds: 1000 ok", isValidAdditionalVideoCost(1000), true);
  eq("cost bounds: 1000.01 rejected", isValidAdditionalVideoCost(1000.01), false);
  eq("cost bounds: -1 rejected", isValidAdditionalVideoCost(-1), false);
  eq("cost bounds: NaN rejected", isValidAdditionalVideoCost(Number.NaN), false);
  eq("charge: 3 × 250 = 750", additionalVideosCharge(3, 250), 750);
  eq("charge: fractional qty floors", additionalVideosCharge(2.9, 100), 200);
}

// 6) Invoice builder: same numbers as the payments schedule, correct status/labels.
{
  const client: Client = { id: "c", name: "Judy Tay", email: "judy@dfrnt.sg", company: "The DFRNT Agency", notes: null, archived: false, created_at: "2026-01-01" };
  const base: Retainer = {
    id: "r", client_id: "c", start_date: "2026-06-12", videos_per_month: 15, monthly_price: 2400, overage_rate: 0,
    rollover_cap: 5, rollover_weeks: 8, payment_terms: "split", status: "active", created_at: "2026-01-01",
  };
  const invoice: Invoice = { id: "i", client_id: "c", period_index: 0, invoice_no: "GET48RET001", issue_date: "2026-06-12", created_at: "" };
  const asOf = new Date(2026, 5, 20);

  // Unpaid — matches the original invoice: 1 line, S$2,400, 50/50 = S$1,200 each.
  const unpaid = buildInvoice(assembleClient(client, base, [], [], asOf), invoice)!;
  eq("invoice: number + period", [unpaid.number, unpaid.billingPeriod], ["GET48RET001", "June 2026"]);
  eq("invoice: single retainer line at monthly price", [unpaid.lines.length, unpaid.lines[0].qty, unpaid.lines[0].rate, unpaid.lines[0].amount], [1, 1, 2400, 2400]);
  eq("invoice: description carries videos/month + period", unpaid.lines[0].description.startsWith("15 short-form video edits") && unpaid.lines[0].description.endsWith("Billing period: June 2026."), true);
  eq("invoice: subtotal/tax/total", [unpaid.subtotal, unpaid.tax, unpaid.total], [2400, 0, 2400]);
  eq("invoice: 50/50 schedule", unpaid.schedule.map((s) => [s.amount, s.status]), [[1200, "pending"], [1200, "pending"]]);
  eq("invoice: unpaid status", unpaid.status, "unpaid");
  eq("invoice: deposit note names both halves", unpaid.paymentNote[0].includes("**S$1,200.00** deposit") && unpaid.paymentNote[0].includes("remaining **S$1,200.00**"), true);
  eq("invoice: note quotes the number", unpaid.paymentNote[1].includes("**GET48RET001**"), true);
  eq("invoice: file name", unpaid.fileName, "Get48-Invoice-GET48RET001.pdf");
  eq("invoice: money format", invoiceMoney(2400), "S$2,400.00");

  // Deposit paid → partial; balance still pending.
  const dep: Payment = { id: "p", client_id: "c", period_index: 0, period_start: "2026-06-12", kind: "deposit", amount: 1200, status: "paid", paid_on: "2026-06-13", created_at: "" };
  const partial = buildInvoice(assembleClient(client, base, [], [dep], asOf), invoice)!;
  eq("invoice: partial status", partial.status, "partial");
  eq("invoice: partial schedule keeps paid date", partial.schedule[0].paidOn, "2026-06-13");
  eq("invoice: partial note asks for balance only", partial.paymentNote[0].includes("Deposit of **S$1,200.00** received") && partial.paymentNote[0].includes("remaining **S$1,200.00** balance"), true);

  // Both paid → paid.
  const bal: Payment = { ...dep, id: "p2", kind: "balance", paid_on: "2026-07-10" };
  const paid = buildInvoice(assembleClient(client, base, [], [dep, bal], asOf), invoice)!;
  eq("invoice: paid status", paid.status, "paid");
  eq("invoice: paid note", paid.paymentNote[0].startsWith("This invoice has been paid in full"), true);

  // Additional videos + overage become their own lines and land on the balance.
  const months: RetainerMonth[] = [{ id: "m", client_id: "c", period_index: 0, videos_per_month: null, monthly_price: null, overage_rate: 100, additional_videos: 2, additional_video_cost: 300, created_at: "" }];
  const vids: VideoRow[] = Array.from({ length: 18 }, (_, i) => ({ id: `v${i}`, client_id: "c", delivered_on: "2026-06-15", quantity: 1, title: null, link: null, status: "completed", created_at: "" }));
  const extras = buildInvoice(assembleClient(client, base, vids, [], asOf, months), invoice)!;
  eq("invoice: extras → 3 lines", extras.lines.map((l) => [l.title, l.qty, l.amount]), [["Monthly Video Editing Retainer", 1, 2400], ["Additional videos", 2, 600], ["Overage videos", 1, 100]]);
  eq("invoice: total includes extras", extras.total, 3100);
  eq("invoice: balance carries extras", extras.schedule[1].amount, 1200 + 600 + 100);
  eq("invoice: total equals schedule sum", extras.total, extras.schedule.reduce((s, r) => s + r.amount, 0));
  eq("invoice: balance label mentions extras", extras.schedule[1].label.startsWith("50% balance + extras"), true);

  // Upfront: 100% row; month-end row only when extras exist.
  const up = buildInvoice(assembleClient(client, { ...base, payment_terms: "upfront" }, [], [], asOf), invoice)!;
  eq("invoice: upfront single row", up.schedule.map((s) => [s.label.startsWith("100% payment"), s.amount]), [[true, 2400]]);
  eq("invoice: upfront note", up.paymentNote[0].includes("to pay **S$2,400.00**"), true);

  // Month not yet reached → null.
  eq("invoice: future month → null", buildInvoice(assembleClient(client, base, [], [], asOf), { ...invoice, period_index: 3 }), null);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
