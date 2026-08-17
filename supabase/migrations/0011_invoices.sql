-- ============================================================================
-- Invoices: one per client per billing month. The invoice PDF itself is
-- rendered on demand from the live retainer/payment data; this table only
-- records the durable facts — the invoice number and issue date — so a month's
-- invoice keeps the same number forever and numbering is sequential across all
-- clients (GET48RET001, GET48RET002, ...).
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- Global running counter used for invoice numbers. If you've already issued
-- invoices by hand, move it past your last number, e.g.:
--   select setval('public.invoice_seq', 3);   -- next invoice becomes 004
create sequence if not exists public.invoice_seq start with 1;

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  period_index integer not null,                         -- 0-based billing month
  invoice_no   text not null unique,                     -- e.g. GET48RET001
  issue_date   date not null default (now() at time zone 'Asia/Singapore')::date,
  created_at   timestamptz not null default now(),
  unique (client_id, period_index)
);
create index if not exists invoices_client_idx on public.invoices(client_id);

-- Allocate the next sequential invoice number. Called by the app on creation.
create or replace function public.next_invoice_no(prefix text default 'GET48RET')
returns text
language sql
volatile
as $$
  select prefix || lpad(nextval('public.invoice_seq')::text, 3, '0');
$$;

alter table public.invoices enable row level security;

drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists invoices_client_read on public.invoices;
create policy invoices_client_read on public.invoices
  for select using (client_id = public.my_client_id());
