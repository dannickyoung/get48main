-- ----------------------------------------------------------------------------
-- Replace the video status set with the review-stage workflow:
--   not_started -> v1 -> v2 -> final -> completed   (drop "in_progress")
-- Existing in_progress rows become v1 (their first cut).
-- ----------------------------------------------------------------------------
alter table public.videos drop constraint if exists videos_status_check;

update public.videos set status = 'v1' where status = 'in_progress';

alter table public.videos
  add constraint videos_status_check
  check (status in ('not_started', 'v1', 'v2', 'final', 'completed'));
