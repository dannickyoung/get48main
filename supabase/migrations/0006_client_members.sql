-- ============================================================================
-- Multiple people per client. The clients.email stays the PRIMARY contact;
-- additional teammates live here. Any of them can sign in (email + OTP) and
-- see the same client dashboard (their profile.client_id points at this client).
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================
create table if not exists public.client_members (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists client_members_client_idx on public.client_members(client_id);

alter table public.client_members enable row level security;

drop policy if exists client_members_admin_all on public.client_members;
create policy client_members_admin_all on public.client_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists client_members_client_read on public.client_members;
create policy client_members_client_read on public.client_members
  for select using (client_id = public.my_client_id());

-- Resolve a client_id for an email from EITHER the primary client row or the
-- members list. Used by the new-user handler.
create or replace function public.client_id_for_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clients where lower(email) = lower(p_email)
  union all
  select client_id from public.client_members where lower(email) = lower(p_email)
  limit 1;
$$;

-- New-user handler now also considers client_members.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(new.email);
  v_role  text := 'pending';
  v_client uuid := null;
begin
  if exists (select 1 from public.admins a where lower(a.email) = v_email) then
    v_role := 'admin';
  else
    v_client := public.client_id_for_email(v_email);
    if v_client is not null then
      v_role := 'client';
    end if;
  end if;

  insert into public.profiles (id, email, role, client_id)
  values (new.id, new.email, v_role, v_client)
  on conflict (id) do update
    set role = excluded.role,
        client_id = excluded.client_id,
        email = excluded.email;
  return new;
end;
$$;

-- When a member is added AFTER they've already signed up, upgrade their waiting
-- 'pending' profile to a scoped 'client' profile for that client.
create or replace function public.link_member_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
     set role = 'client', client_id = new.client_id
   where lower(p.email) = lower(new.email)
     and p.role <> 'admin';
  return new;
end;
$$;

drop trigger if exists on_client_member_insert on public.client_members;
create trigger on_client_member_insert
  after insert on public.client_members
  for each row execute function public.link_member_profile();
