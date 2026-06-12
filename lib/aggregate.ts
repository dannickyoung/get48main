import { format, startOfMonth, subMonths } from "date-fns";
import type { ClientView, ScheduledPayment } from "@/lib/retainer/assemble";
import type { VideoRow } from "@/lib/types";

export type PaymentWithClient = ScheduledPayment & { clientId: string; clientName: string };
export type DeliveryWithClient = VideoRow & { clientName: string };
export type RolloverRow = {
  clientId: string;
  clientName: string;
  available: number;
  cap: number;
  nextExpiry: Date | null;
  days: number | null;
};

export function allPayments(views: ClientView[]): PaymentWithClient[] {
  return views
    .filter((v) => !v.client.archived)
    .flatMap((v) => v.payments.map((p) => ({ ...p, clientId: v.client.id, clientName: v.client.name })));
}

export function allDeliveries(views: ClientView[]): DeliveryWithClient[] {
  return views
    .flatMap((v) => v.videos.map((vid) => ({ ...vid, clientName: v.client.name })))
    .sort((a, b) => (a.delivered_on < b.delivered_on ? 1 : -1));
}

export type MonthlyTotal = { key: string; label: string; delivered: number; revenue: number };

/** Studio-wide totals per calendar month (videos delivered + revenue collected). */
export function monthlyStudioTotals(
  views: ClientView[],
  monthsBack = 12,
  asOf: Date = new Date(),
): MonthlyTotal[] {
  const buckets = new Map<string, MonthlyTotal>();
  const start = startOfMonth(subMonths(asOf, monthsBack - 1));
  for (let i = 0; i < monthsBack; i++) {
    const d = startOfMonth(subMonths(asOf, monthsBack - 1 - i));
    buckets.set(format(d, "yyyy-MM"), { key: format(d, "yyyy-MM"), label: format(d, "MMM"), delivered: 0, revenue: 0 });
  }

  for (const v of views) {
    for (const vid of v.videos) {
      const k = vid.delivered_on.slice(0, 7);
      const b = buckets.get(k);
      if (b) b.delivered += vid.quantity;
    }
    for (const p of v.payments) {
      if (p.status === "paid" && p.paidOn) {
        const b = buckets.get(p.paidOn.slice(0, 7));
        if (b) b.revenue += p.amount;
      }
    }
  }

  void start;
  return [...buckets.values()];
}

export function allRollovers(views: ClientView[]): RolloverRow[] {
  return views
    .filter((v) => !v.client.archived && v.computation)
    .map((v) => {
      const r = v.computation!.current.rollover;
      return {
        clientId: v.client.id,
        clientName: v.client.name,
        available: r.available,
        cap: v.computation!.terms.rolloverCap,
        nextExpiry: r.nextExpiry,
        days: r.daysToNextExpiry,
      };
    })
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
}
