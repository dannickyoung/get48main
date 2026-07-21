-- ============================================================================
-- Per-client payment terms: 50/50 split (default) vs 100% upfront.
--   'split'   → 50% deposit at month start, 50% balance at month end (existing)
--   'upfront' → full monthly price at month start; overage still billed at end
-- Also widen payments.kind to allow the single upfront charge ('full').
-- Safe to re-run.
-- ============================================================================

alter table public.retainers
  add column if not exists payment_terms text not null default 'split'
  check (payment_terms in ('split', 'upfront'));

-- payments.kind gains 'full' for the single upfront charge. The inline column
-- check from 0001_init is named payments_kind_check; replace it.
alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments
  add constraint payments_kind_check check (kind in ('deposit', 'balance', 'full'));
