/**
 * Mock data for the auth-free /preview. Runs the REAL engine + components, so
 * the preview is a faithful render — only the data is fabricated.
 */
import { assembleClient, type ClientView } from "@/lib/retainer/assemble";
import type { Client, Payment, Retainer, VideoRow } from "@/lib/types";

const PREVIEW_ASOF = new Date(2026, 5, 13); // 13 Jun 2026, matches the build's "today"

type Spec = {
  id: string;
  name: string;
  company: string;
  email: string;
  archived?: boolean;
  retainer: Omit<Retainer, "id" | "client_id" | "created_at">;
  videos: { delivered_on: string; quantity?: number; title?: string }[];
  /** period indices whose deposit+balance are paid; omit for "behind". */
  paidPeriods?: number[];
};

// Dates are explicit so every client lands in a clearly-different state as of
// the preview's "today" (13 Jun 2026).
const SPECS: Spec[] = [
  {
    // On track, carrying a comfortable rollover buffer; all paid.
    id: "northwind",
    name: "Northwind Coffee",
    company: "Northwind Coffee Co.",
    email: "marketing@northwind.coffee",
    retainer: r({ start_date: "2026-02-03", videos_per_month: 8, monthly_price: 4200, overage_rate: 480 }),
    videos: on(
      ["2026-02-05", "2026-02-09", "2026-02-13", "2026-02-18", "2026-02-22", "2026-02-26"], "Spring blend",
    ).concat(
      on(["2026-03-04", "2026-03-09", "2026-03-14", "2026-03-19", "2026-03-24", "2026-03-29"], "Barista series"),
      on(["2026-04-04", "2026-04-09", "2026-04-14", "2026-04-19", "2026-04-24"], "Cold brew launch"),
      on(["2026-05-05", "2026-05-10", "2026-05-15", "2026-05-20", "2026-05-25", "2026-05-30"], "Roastery tour"),
      on(["2026-06-04", "2026-06-08", "2026-06-11"], "Father's Day promo"),
    ),
    paidPeriods: [0, 1, 2, 3, 4],
  },
  {
    // Over allotment this month (9 delivered against 6).
    id: "lumen",
    name: "Lumen Fitness",
    company: "Lumen Fitness",
    email: "social@lumenfit.io",
    retainer: r({ start_date: "2026-05-20", videos_per_month: 6, monthly_price: 3000, overage_rate: 550 }),
    videos: on(
      ["2026-05-21", "2026-05-23", "2026-05-26", "2026-05-29", "2026-06-01", "2026-06-04", "2026-06-07", "2026-06-10", "2026-06-12"],
      "Summer challenge",
    ),
    paidPeriods: [0],
  },
  {
    // Light usage → rollover accrued, and the oldest batch is about to expire.
    id: "atlas",
    name: "Atlas Realty",
    company: "Atlas Realty Group",
    email: "media@atlasrealty.com",
    retainer: r({ start_date: "2026-01-25", videos_per_month: 4, monthly_price: 2600, overage_rate: 600 }),
    videos: on(["2026-02-02", "2026-02-10"], "Listing tour").concat(on(["2026-03-05"], "Neighbourhood reel")),
    paidPeriods: [0, 1, 2, 3, 4],
  },
  {
    // Payment overdue — deposit unpaid past its due date.
    id: "boreal",
    name: "Boreal Skincare",
    company: "Boreal Skincare",
    email: "hello@borealskin.co",
    retainer: r({ start_date: "2026-05-28", videos_per_month: 10, monthly_price: 6500, overage_rate: 500 }),
    videos: on(["2026-06-01", "2026-06-04", "2026-06-08", "2026-06-11"], "Ingredient spotlight"),
    // no paidPeriods → deposit overdue → "Payment due"
  },
  {
    // Paused retainer.
    id: "cobalt",
    name: "Cobalt Studios",
    company: "Cobalt Studios",
    email: "team@cobalt.studio",
    retainer: r({ start_date: "2026-03-10", videos_per_month: 5, monthly_price: 2800, overage_rate: 450, status: "paused" }),
    videos: on(["2026-03-12", "2026-03-18", "2026-03-24"], "Brand film").concat(
      on(["2026-04-06", "2026-04-13", "2026-04-20", "2026-04-27"], "Product series"),
    ),
    paidPeriods: [0, 1],
  },
];

function r(partial: Partial<Retainer> & Pick<Retainer, "start_date" | "videos_per_month">): Omit<Retainer, "id" | "client_id" | "created_at"> {
  return {
    start_date: partial.start_date,
    videos_per_month: partial.videos_per_month,
    monthly_price: partial.monthly_price ?? 0,
    overage_rate: partial.overage_rate ?? 0,
    rollover_cap: partial.rollover_cap ?? 5,
    rollover_weeks: partial.rollover_weeks ?? 8,
    status: partial.status ?? "active",
  };
}

/** Explicit-date deliveries with an optional numbered title. */
function on(dates: string[], title?: string): { delivered_on: string; quantity?: number; title?: string }[] {
  return dates.map((d, i) => ({ delivered_on: d, title: title ? `${title} ${i + 1}` : undefined }));
}

export function getMockViews(): ClientView[] {
  return SPECS.map(specToView);
}

export function getMockView(id: string): ClientView | null {
  const spec = SPECS.find((s) => s.id === id);
  return spec ? specToView(spec) : null;
}

function specToView(spec: Spec): ClientView {
  const client: Client = {
    id: spec.id,
    name: spec.name,
    email: spec.email,
    company: spec.company,
    notes: null,
    archived: spec.archived ?? false,
    created_at: "2026-01-01",
  };
  const retainer: Retainer = { id: `${spec.id}-r`, client_id: spec.id, created_at: "2026-01-01", ...spec.retainer };

  const videos: VideoRow[] = spec.videos.map((v, i) => ({
    id: `${spec.id}-v${i}`,
    client_id: spec.id,
    delivered_on: v.delivered_on,
    quantity: v.quantity ?? 1,
    title: v.title ?? null,
    link: null,
    status: "completed" as const,
    created_at: v.delivered_on,
  }));

  const half = spec.retainer.monthly_price / 2;
  const payments: Payment[] = (spec.paidPeriods ?? []).flatMap((k) =>
    (["deposit", "balance"] as const).map((kind) => ({
      id: `${spec.id}-p${k}-${kind}`,
      client_id: spec.id,
      period_index: k,
      period_start: spec.retainer.start_date,
      kind,
      amount: half,
      status: "paid" as const,
      paid_on: spec.retainer.start_date,
      created_at: spec.retainer.start_date,
    })),
  );

  return assembleClient(client, retainer, videos, payments, PREVIEW_ASOF);
}
