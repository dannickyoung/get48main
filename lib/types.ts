export type Role = "admin" | "client" | "pending";
export type RetainerStatus = "active" | "paused" | "ended";
export type PaymentKind = "deposit" | "balance" | "full" | "overage";
export type PaymentStatus = "pending" | "paid";
/** How a client pays each retainer month. split = 50/50, upfront = 100% at start. */
export type PaymentMode = "split" | "upfront";

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
};

/** An additional person who can sign in and view a client's dashboard. */
export type ClientMember = {
  id: string;
  client_id: string;
  email: string;
  created_at: string;
};

export type Retainer = {
  id: string;
  client_id: string;
  start_date: string;
  videos_per_month: number;
  monthly_price: number;
  overage_rate: number;
  rollover_cap: number;
  rollover_weeks: number;
  payment_terms: PaymentMode;
  status: RetainerStatus;
  /** Last day of service (inclusive, 'yyyy-MM-dd'). null → open-ended. */
  end_date: string | null;
  /** Last day (inclusive) an ended client can still sign in. null → no limit. */
  access_until: string | null;
  created_at: string;
};

export type VideoStatus = "not_started" | "v1" | "v2" | "v3" | "final" | "completed";

export type VideoRow = {
  id: string;
  client_id: string;
  delivered_on: string;
  quantity: number;
  title: string | null;
  link: string | null;
  status: VideoStatus;
  created_at: string;
};

export type Payment = {
  id: string;
  client_id: string;
  period_index: number;
  period_start: string;
  kind: PaymentKind;
  amount: number;
  status: PaymentStatus;
  paid_on: string | null;
  created_at: string;
};

export type RetainerMonth = {
  id: string;
  client_id: string;
  period_index: number;
  videos_per_month: number | null;
  monthly_price: number | null;
  overage_rate: number | null;
  /** Extra videos added on top of this month's set allotment (0 = none). */
  additional_videos: number;
  /** Price per additional video, 0–1000. Billed as quantity × cost at month-end. */
  additional_video_cost: number;
  created_at: string;
};

/** A month's invoice record. Amounts are derived live; only number + date are stored. */
export type Invoice = {
  id: string;
  client_id: string;
  period_index: number;
  invoice_no: string;
  issue_date: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  role: Role;
  client_id: string | null;
  created_at: string;
};

export type ClientWithRetainer = Client & { retainer: Retainer | null };
