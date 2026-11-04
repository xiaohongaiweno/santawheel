-- SantaWheel premium tier: one-time payment, watermark removal, CSV import,
-- reminder emails, no-repeat pair history.
-- Apply after 20261104010000_delivery.sql

-- ============ payment state (server-side only; never trust the client) ============
alter table public.exchange
  add column if not exists paid        boolean not null default false,
  add column if not exists paid_at     timestamptz,
  add column if not exists payment_ref text,      -- Waffo orderId
  add column if not exists payment_mode text;     -- 'test' | 'prod'

-- ============ reminders (premium): ping participants who never opened ============
alter table public.exchange
  add column if not exists reminder_at   timestamptz,
  add column if not exists reminder_sent boolean not null default false;

alter table public.assignment
  add column if not exists viewed_at timestamptz;

-- reminder emails go through the same retry queue
alter table public.email_job
  drop constraint if exists email_job_kind_check;
alter table public.email_job
  add constraint email_job_kind_check
  check (kind in ('assignment', 'organizer_link', 'reminder'));

-- ============ pair history for no-repeat draws (premium) ============
-- One row per delivered pairing, keyed by the organizer's email so a new
-- exchange from the same organizer can exclude last year's pairs.
create table if not exists public.pair_history (
  id             uuid primary key default gen_random_uuid(),
  organizer_email text not null,
  giver_email    text not null,
  receiver_email text not null,
  exchange_id    uuid not null,
  created_at     timestamptz not null default now(),
  unique (exchange_id, giver_email, receiver_email)
);
create index if not exists idx_pair_history_org
  on public.pair_history (organizer_email);

alter table public.pair_history enable row level security;
