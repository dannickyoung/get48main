-- ============================================================================
-- Per-month retainer overrides. Each billing month can override the retainer's
-- default videos/month and price (e.g. the client scales up for one month).
-- A row is only needed for months that DIFFER from the retainer default.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create table if not exists public.retainer_months (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  period_index  integer not null,                 -- 0-based billing month
  videos_per_month integer,                        -- null → use retainer default
  monthly_price numeric(10,2),                      -- null → use retainer default
  overage_rate  numeric(10,2),                      -- null → use retainer default
  created_at    timestamptz not null default now(),
  unique (client_id, period_index)
);
-- If the table already existed without overage_rate, add it.
alter table public.retainer_months add column if not exists overage_rate numeric(10,2);
create index if not exists retainer_months_client_idx on public.retainer_months(client_id);

alter table public.retainer_months enable row level security;

drop policy if exists retainer_months_admin_all on public.retainer_months;
create policy retainer_months_admin_all on public.retainer_months
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists retainer_months_client_read on public.retainer_months;
create policy retainer_months_client_read on public.retainer_months
  for select using (client_id = public.my_client_id());
