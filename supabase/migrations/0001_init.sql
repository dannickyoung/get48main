-- ============================================================================
-- get48 retainer dashboard — schema, auth wiring, and row-level security
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: everything is guarded with "if not exists" / "create or replace".
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Who is the admin? Seed your login email here. (One admin: you.)
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

insert into public.admins (email)
values ('dannyrongda@gmail.com')
on conflict (email) do nothing;

-- ----------------------------------------------------------------------------
-- Clients
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null unique,         -- the email the client logs in with
  company     text,
  notes       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Retainer terms (one per client)
-- ----------------------------------------------------------------------------
create table if not exists public.retainers (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null unique references public.clients(id) on delete cascade,
  start_date       date not null,
  videos_per_month integer not null check (videos_per_month > 0),
  monthly_price    numeric(10,2) not null default 0,
  overage_rate     numeric(10,2) not null default 0,   -- price per extra video
  rollover_cap     integer not null default 5,
  rollover_weeks   integer not null default 8,
  status           text not null default 'active' check (status in ('active','paused','ended')),
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Delivered videos (the raw facts the engine replays)
-- ----------------------------------------------------------------------------
create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  delivered_on date not null,
  quantity     integer not null default 1 check (quantity > 0),
  title        text,
  link         text,
  created_at   timestamptz not null default now()
);
create index if not exists videos_client_idx on public.videos(client_id, delivered_on);

-- ----------------------------------------------------------------------------
-- Payments (50% deposit at month start, 50% balance at month end)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  period_index integer not null,                       -- which billing month (0-based)
  period_start date not null,
  kind         text not null check (kind in ('deposit','balance')),
  amount       numeric(10,2) not null default 0,
  status       text not null default 'pending' check (status in ('pending','paid')),
  paid_on      date,
  created_at   timestamptz not null default now(),
  unique (client_id, period_index, kind)
);
create index if not exists payments_client_idx on public.payments(client_id);

-- ----------------------------------------------------------------------------
-- Profiles — maps an authenticated user to a role (+ client, for client logins)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'pending' check (role in ('admin','client','pending')),
  client_id  uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- New-user handler: assign role on first sign-in.
--   email in admins         -> admin
--   email matches a client  -> client (+ client_id)
--   otherwise               -> pending (no access)
-- ----------------------------------------------------------------------------
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
    select c.id into v_client from public.clients c where lower(c.email) = v_email limit 1;
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If a client is added/updated AFTER they've already signed up, upgrade their
-- waiting 'pending' profile to a scoped 'client' profile automatically.
create or replace function public.link_client_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
     set role = 'client', client_id = new.id
   where lower(p.email) = lower(new.email)
     and p.role <> 'admin';
  return new;
end;
$$;

drop trigger if exists on_client_upsert on public.clients;
create trigger on_client_upsert
  after insert or update of email on public.clients
  for each row execute function public.link_client_profile();

-- ----------------------------------------------------------------------------
-- RLS helper functions
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Row-level security
-- ----------------------------------------------------------------------------
alter table public.admins    enable row level security;
alter table public.clients   enable row level security;
alter table public.retainers enable row level security;
alter table public.videos    enable row level security;
alter table public.payments  enable row level security;
alter table public.profiles  enable row level security;

-- admins is only read by SECURITY DEFINER functions (which bypass RLS); with RLS
-- on and no permissive policy, anon/authenticated keys can't read it directly.
drop policy if exists admins_admin_read on public.admins;
create policy admins_admin_read on public.admins
  for select using (public.is_admin());

-- profiles: a user may read their own; admin may read all.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Generic pattern for the four data tables: admin = full control,
-- client = read-only on their own rows.
do $$
declare t text;
begin
  foreach t in array array['clients','retainers','videos','payments'] loop
    execute format('drop policy if exists %1$s_admin_all on public.%1$s', t);
    execute format('drop policy if exists %1$s_client_read on public.%1$s', t);
  end loop;
end $$;

-- clients
create policy clients_admin_all on public.clients
  for all using (public.is_admin()) with check (public.is_admin());
create policy clients_client_read on public.clients
  for select using (id = public.my_client_id());

-- retainers
create policy retainers_admin_all on public.retainers
  for all using (public.is_admin()) with check (public.is_admin());
create policy retainers_client_read on public.retainers
  for select using (client_id = public.my_client_id());

-- videos
create policy videos_admin_all on public.videos
  for all using (public.is_admin()) with check (public.is_admin());
create policy videos_client_read on public.videos
  for select using (client_id = public.my_client_id());

-- payments
create policy payments_admin_all on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
create policy payments_client_read on public.payments
  for select using (client_id = public.my_client_id());

-- ----------------------------------------------------------------------------
-- Backfill: assign profiles for any users that already exist (e.g. the admin
-- account created via the Admin API before this migration was run). This makes
-- the order of operations flexible — running the migration after the account
-- exists still grants the right role.
-- ----------------------------------------------------------------------------
insert into public.profiles (id, email, role, client_id)
select
  u.id,
  u.email,
  case
    when exists (select 1 from public.admins a where lower(a.email) = lower(u.email)) then 'admin'
    when c.id is not null then 'client'
    else 'pending'
  end,
  c.id
from auth.users u
left join public.clients c on lower(c.email) = lower(u.email)
on conflict (id) do update
  set role = excluded.role,
      client_id = excluded.client_id,
      email = excluded.email;
