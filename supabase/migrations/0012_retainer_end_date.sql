-- ============================================================================
-- Retainer end date + post-retainer access window.
--   end_date     last day of service (inclusive). Set when a retainer is
--                stopped; billing months, payments and invoices are never
--                generated past it. null → open-ended.
--   access_until last day (inclusive) the client can still sign in after the
--                retainer is stopped. After it they're locked out and their
--                logins are deleted by the daily cron.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.retainers add column if not exists end_date date;
alter table public.retainers add column if not exists access_until date;
