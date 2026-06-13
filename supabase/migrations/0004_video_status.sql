-- ----------------------------------------------------------------------------
-- Production status for each logged video.
-- not_started → in_progress → completed
-- Existing rows are treated as completed (they were already delivered).
-- ----------------------------------------------------------------------------
alter table public.videos
  add column if not exists status text not null default 'completed'
    check (status in ('not_started', 'in_progress', 'completed'));

-- Backfill any pre-existing rows to completed (no-op for new installs).
update public.videos set status = 'completed' where status is null;
