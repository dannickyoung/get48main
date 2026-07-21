-- ============================================================================
-- Give upfront-mode month-end overage its own payment kind ('overage'), so a
-- client switching between 50/50 split and 100% upfront never has a split
-- 'balance' record collide with an upfront overage charge. Safe to re-run.
-- ============================================================================

alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments
  add constraint payments_kind_check check (kind in ('deposit', 'balance', 'full', 'overage'));
