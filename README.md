# get48 — Retainer Control

A dark, lime-accented dashboard for running short-form video retainers. Track
each client's monthly video allotment, **how many unused videos roll over**, when
those rollovers expire, overages, and 50% / 50% payments. You (the studio) are the
single admin; each client gets a **view-only** login scoped to their own account.

Built with **Next.js (App Router) + TypeScript**, **Supabase** (Postgres · Auth ·
Row-Level Security), and **Tailwind CSS v4**.

---

## The rollover rules it enforces

1. Up to **5** unused videos roll into the following month.
2. A rolled-over video expires **8 weeks** after the end of the month it accrued —
   then it's gone (no refund / credit).
3. No more than **5** rolled-over videos may be held at once; the surplus is
   forfeited at month-end.

Deliveries are drawn from soonest-to-expire rollover credits first, then the
current month's fresh allotment; anything beyond that is tracked as an **overage**.
The cap (5) and window (8 weeks) are per-client editable, so different agreements
are supported. Nothing about balances is stored — it's all derived by replaying
the timeline in `lib/retainer/engine.ts`, so the numbers can never drift.

---

## Setup (about 5 minutes)

### 1. Connect your Supabase project — fill in `.env.local`

Open `.env.local` (already created) and paste four values from
**Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=        # Project URL  e.g. https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Project API keys → anon / public
SUPABASE_SERVICE_ROLE_KEY=       # Project API keys → service_role (keep secret)
NEXT_PUBLIC_ADMIN_EMAIL=dannick.young@aelf.io   # the email YOU sign in with
```

These keys are what actually connect this app to your database.

### 2. Create the tables — run the migration

In **Supabase → SQL Editor → New query**, paste the entire contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click
**Run**. This builds the tables, the role-based security rules, and seeds you as
the admin. (Re-running it is safe.)

> The admin email is seeded inside the SQL as `dannick.young@aelf.io`. To use a
> different one, change it there (the `insert into public.admins` line) **and** in
> `.env.local`.

### 3. Turn on magic-link email auth

In **Supabase → Authentication → Providers → Email**, make sure **Email** is
enabled (magic links are on by default). Under **Authentication → URL
Configuration**, add your dev URL `http://localhost:3000` to the redirect allow-list
(and your production URL when you deploy).

### 4. Run it

```bash
npm install      # if you haven't already
npm run dev
```

Open **http://localhost:3000**, enter your admin email, click the magic link in
your inbox → you land on the admin overview.

---

## How accounts work

- **You (admin):** the email in `admins` / `NEXT_PUBLIC_ADMIN_EMAIL`. Full control.
- **Clients:** click **Add client** and enter their email. When they sign in with a
  magic link at `/login`, they're automatically scoped to a **read-only** view of
  their own retainer. If they happen to sign in *before* you add them, they'll see a
  "not set up yet" screen and gain access the moment you add their email.

Row-Level Security enforces this at the database — a client literally cannot read
another client's rows, even via the API.

---

## Project map

```
app/
  (admin)/dashboard         overview: KPIs + every client
  (admin)/clients/new       add a client + retainer
  (admin)/clients/[id]      full client control (editable)
  (client)/me               a client's own read-only view
  login, auth/callback      magic-link sign-in
  actions.ts                admin-guarded server actions (mutations)
lib/
  retainer/engine.ts        the rollover/expiry/overage simulation
  retainer/assemble.ts      raw rows → view model (health, payment schedule)
  data.ts                   Supabase queries
  supabase/                 browser / server / service-role / proxy clients
supabase/migrations/        the SQL to run in Supabase
scripts/engine.test.ts      engine unit tests  →  npm test
```

## Tests

```bash
npm test     # verifies the rollover math (cap, expiry, overage, ordering)
```

## Deploy

Push to GitHub and import into **Vercel**. Add the same four environment variables
in the Vercel project settings, and add your production URL to Supabase's auth
redirect allow-list. That's it.
