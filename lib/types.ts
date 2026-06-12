export type Role = "admin" | "client" | "pending";
export type RetainerStatus = "active" | "paused" | "ended";
export type PaymentKind = "deposit" | "balance";
export type PaymentStatus = "pending" | "paid";

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  notes: string | null;
  archived: boolean;
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
  status: RetainerStatus;
  created_at: string;
};

export type VideoRow = {
  id: string;
  client_id: string;
  delivered_on: string;
  quantity: number;
  title: string | null;
  link: string | null;
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
