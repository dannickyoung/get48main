-- ============================================================================
-- Additional videos per billing month. On top of a month's set allotment
-- (retainer default or the month's videos_per_month override), the admin can
-- add N extra videos at a per-video cost of $0–$1000. The extra videos raise
-- that month's allotment; the charge (quantity × cost) is billed on the
-- month-end payment row (balance for 50/50 split, overage row for upfront).
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.retainer_months
  add column if not exists additional_videos integer not null default 0;
alter table public.retainer_months
  add column if not exists additional_video_cost numeric(10,2) not null default 0;

alter table public.retainer_months drop constraint if exists retainer_months_additional_videos_check;
alter table public.retainer_months
  add constraint retainer_months_additional_videos_check check (additional_videos >= 0);

alter table public.retainer_months drop constraint if exists retainer_months_additional_video_cost_check;
alter table public.retainer_months
  add constraint retainer_months_additional_video_cost_check
  check (additional_video_cost >= 0 and additional_video_cost <= 1000);
