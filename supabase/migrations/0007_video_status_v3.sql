-- ----------------------------------------------------------------------------
-- Add "v3" review stage between v2 and final:
--   not_started -> v1 -> v2 -> v3 -> final -> completed
-- The TypeScript types/UI already include v3; this widens the DB constraint
-- so saving status = 'v3' no longer violates videos_status_check.
-- ----------------------------------------------------------------------------
alter table public.videos drop constraint if exists videos_status_check;

alter table public.videos
  add constraint videos_status_check
  check (status in ('not_started', 'v1', 'v2', 'v3', 'final', 'completed'));
