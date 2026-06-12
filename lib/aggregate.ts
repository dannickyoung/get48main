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
