-- ============================================================================
-- Daily rollover-expiry email reminder, scheduled inside Supabase (pg_cron).
-- Postgres calls the app's reminder endpoint every day; the endpoint computes
-- who's expiring and sends the digest via Gmail.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.
-- If you change CRON_SECRET, update it here too and re-run.
-- ============================================================================

-- Scheduler + outbound HTTP, both supported on Supabase.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous version of this job before re-creating it.
do $$
begin
  perform cron.unschedule('expiry-reminders-daily');
exception
  when others then null; -- job didn't exist yet
end $$;

-- Every day at 09:00 UTC, hit the reminder endpoint with the shared secret.
select cron.schedule(
  'expiry-reminders-daily',
  '0 9 * * *',
  $$
  select net.http_get(
    url     := 'https://get48.io/api/cron/expiry-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer get48_cron_8f3a91c4e7b240d5a6f1'
    )
  );
  $$
);

-- Handy checks:
--   select * from cron.job;                                  -- see the schedule
--   select * from cron.job_run_details order by start_time desc limit 5;  -- run history
--   select * from net._http_response order by created desc limit 5;       -- HTTP responses
