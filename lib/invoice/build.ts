/**
 * Pure invoice assembly: turn a client's assembled view + the month's invoice
 * record into the exact content printed on the PDF. No I/O here — it's the same
 * numbers the Payments card shows (monthly price, additional videos, overage,
 * paid/unpaid state), so the invoice can never disagree with the dashboard.
 */
import { addMonths, format } from "date-fns";
import { parseDateOnly } from "@/lib/retainer/engine";
import { additionalVideosCharge } from "@/lib/retainer/additional";
import type { ClientView, ScheduledPayment } from "@/lib/retainer/assemble";
import type { Invoice } from "@/lib/types";
import { INVOICE_BUSINESS, invoiceMoney } from "./config";

export type InvoiceLine = {
  title: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

export type InvoiceScheduleRow = {
  label: string;
  amount: number;
  status: "paid" | "pending";
  paidOn: string | null;
  dueDate: Date;
};

export type InvoiceStatus = "unpaid" | "partial" | "paid";

export type InvoiceData = {
  number: string;
  issueDate: Date;
  dueDateLabel: string;
  /** e.g. "June 2026" */
  billingPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  from: { name: string; contact: string; email: string; location: string; subtitle: string };
  billTo: { name: string; company: string | null; email: string };
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
  schedule: InvoiceScheduleRow[];
  status: InvoiceStatus;
  /** Sentences under the PayNow QR, in order. Bold segments are marked with **…**. */
  paymentNote: string[];
  fileName: string;
};

/** Human label for a billing month, e.g. "June 2026". */
export function billingPeriodLabel(d: Date): string {
  return format(d, "MMMM yyyy");
}

/**
 * Build the invoice for one billing month. Returns null when the month hasn't
 * been scheduled (e.g. index beyond the current period).
 */
export function buildInvoice(view: ClientView, invoice: Invoice, periodIndex = invoice.period_index): InvoiceData | null {
  const { client, retainer, computation, months } = view;
  if (!retainer || !computation) return null;
  // Only months that have started can be invoiced.
  if (computation.current.state !== "active" || periodIndex < 0 || periodIndex > computation.current.periodIndex) return null;

  const start = parseDateOnly(retainer.start_date);
  const periodStart = addMonths(start, periodIndex);
  const periodEnd = addMonths(start, periodIndex + 1);
  const period = billingPeriodLabel(periodStart);

  // Effective terms for this month (base retainer merged with its override).
  const override = months.find((m) => m.period_index === periodIndex);
  const videosPerMonth = override?.videos_per_month ?? retainer.videos_per_month;
  const monthlyPrice = override?.monthly_price != null ? Number(override.monthly_price) : Number(retainer.monthly_price);
  const overageRate = override?.overage_rate != null ? Number(override.overage_rate) : Number(retainer.overage_rate);
  const additional = Math.max(0, Number(override?.additional_videos ?? 0));
  const additionalCost = Number(override?.additional_video_cost ?? 0);

  // Overage videos in this month (finalised or live).
  const finished = computation.periods.find((p) => p.index === periodIndex);
  const overageCount =
    finished?.overage ??
    (computation.current.state === "active" && computation.current.periodIndex === periodIndex
      ? computation.current.overageThisPeriod
      : 0);

  const lines: InvoiceLine[] = [
    {
      title: "Monthly Video Editing Retainer",
      description: `${videosPerMonth} short-form video edits (Basic & Standard) — TikTok, Instagram Reels, YouTube Shorts. Billing period: ${period}.`,
      qty: 1,
      rate: monthlyPrice,
      amount: monthlyPrice,
    },
  ];
  if (additional > 0) {
    lines.push({
      title: "Additional videos",
      description: `${additional} extra ${additional === 1 ? "video" : "videos"} added on top of the monthly allotment for ${period}.`,
      qty: additional,
      rate: additionalCost,
      amount: additionalVideosCharge(additional, additionalCost),
    });
  }
  if (overageCount > 0 && overageRate > 0) {
    lines.push({
      title: "Overage videos",
      description: `${overageCount} ${overageCount === 1 ? "video" : "videos"} delivered beyond the monthly allotment (incl. rollover) in ${period}.`,
      qty: overageCount,
      rate: overageRate,
      amount: overageCount * overageRate,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  // Payment schedule straight from the dashboard's rows for this month.
  const rows = view.payments.filter((p) => p.periodIndex === periodIndex).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const upfront = retainer.payment_terms === "upfront";
  const schedule: InvoiceScheduleRow[] = rows.map((r) => ({
    label: scheduleLabel(r, upfront),
    amount: r.amount,
    status: r.status,
    paidOn: r.paidOn,
    dueDate: r.dueDate,
  }));

  const paidCount = schedule.filter((r) => r.status === "paid").length;
  const status: InvoiceStatus =
    schedule.length > 0 && paidCount === schedule.length ? "paid" : paidCount > 0 ? "partial" : "unpaid";

  return {
    number: invoice.invoice_no,
    issueDate: parseDateOnly(invoice.issue_date),
    dueDateLabel: INVOICE_BUSINESS.dueDateLabel,
    billingPeriod: period,
    periodStart,
    periodEnd,
    from: {
      name: INVOICE_BUSINESS.name,
      contact: INVOICE_BUSINESS.contact,
      email: INVOICE_BUSINESS.email,
      location: INVOICE_BUSINESS.location,
      subtitle: INVOICE_BUSINESS.subtitle,
    },
    billTo: { name: client.name, company: client.company, email: client.email },
    lines,
    subtotal,
    tax,
    total,
    schedule,
    status,
    paymentNote: paymentNote(schedule, status, invoice.invoice_no, upfront),
    fileName: `${INVOICE_BUSINESS.name}-Invoice-${invoice.invoice_no}.pdf`,
  };
}

function scheduleLabel(r: ScheduledPayment, upfront: boolean): string {
  switch (r.kind) {
    case "deposit":
      return "50% deposit — due on receipt to reserve your slot";
    case "balance":
      return r.overageCount > 0 || r.additionalCount > 0
        ? "50% balance + extras — due on delivery of this month's videos"
        : "50% balance — due on delivery of this month's videos";
    case "full":
      return "100% payment — due on receipt to reserve your slot";
    case "overage":
      return upfront && r.overageCount === 0 && r.additionalCount > 0
        ? "Additional videos — due on delivery of this month's videos"
        : "Overage — due on delivery of this month's videos";
  }
}

/** The sentences under the PayNow QR. `**bold**` marks emphasised amounts. */
function paymentNote(schedule: InvoiceScheduleRow[], status: InvoiceStatus, number: string, upfront: boolean): string[] {
  const money = (n: number) => `**${invoiceMoney(n)}**`;
  const quote = `Please quote invoice number **${number}** in the payment reference.`;
  if (status === "paid") {
    const last = [...schedule].filter((r) => r.paidOn).sort((a, b) => (a.paidOn! < b.paidOn! ? 1 : -1))[0];
    const when = last?.paidOn ? ` Final payment received ${format(parseDateOnly(last.paidOn), "d MMM yyyy")}.` : "";
    return [`This invoice has been paid in full — thank you.${when}`, `Reference: **${number}**.`];
  }
  const pending = schedule.filter((r) => r.status === "pending");
  const paid = schedule.filter((r) => r.status === "paid");
  const first = pending[0];
  if (!first) return [quote];

  if (upfront) {
    const paidLine = paid.length ? `${money(paid.reduce((s, r) => s + r.amount, 0))} received. ` : "";
    return [
      `${paidLine}Scan the PayNow QR with your banking app to pay ${money(first.amount)}${pending.length > 1 ? ` now; the remaining ${money(pending.slice(1).reduce((s, r) => s + r.amount, 0))} is due on delivery` : ""}.`,
      quote,
    ];
  }
  if (status === "partial") {
    return [
      `Deposit of ${money(paid.reduce((s, r) => s + r.amount, 0))} received. Scan the PayNow QR with your banking app to pay the remaining ${money(first.amount)} balance.`,
      quote,
    ];
  }
  const rest = pending.slice(1).reduce((s, r) => s + r.amount, 0);
  return [
    `Scan the PayNow QR with your banking app to pay the ${money(first.amount)} deposit and reserve your slot.${rest > 0 ? ` The remaining ${money(rest)} is due on delivery.` : ""}`,
    quote,
  ];
}
