-- ============================================================================
-- Retainer end date. The last day of service (inclusive). Set when a retainer
-- is stopped; billing months, payments and invoices are never generated past
-- it. null → open-ended.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.retainers add column if not exists end_date date;
