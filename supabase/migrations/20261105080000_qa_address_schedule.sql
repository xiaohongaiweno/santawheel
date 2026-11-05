-- SantaWheel: shipping addresses, anonymous Q&A, scheduled draws.
-- Apply after 20261105070000_wishlist_text.sql

-- ============ 1. shipping address (self-serve, like wishlist_text) ============
alter table public.participant
  add column if not exists address_text text;

-- ============ 2. anonymous Q&A between gifter and receiver ============
-- The gifter asks; the receiver answers; neither ever sees the other's
-- identity through this table (identity only lives in participant refs).
create table if not exists public.question (
  id            uuid primary key default gen_random_uuid(),
  exchange_id   uuid not null references public.exchange (id) on delete cascade,
  question_from uuid not null references public.participant (id) on delete cascade,
  receiver_id   uuid not null references public.participant (id) on delete cascade,
  question_text text not null,
  answer_text   text,
  created_at    timestamptz not null default now(),
  answered_at   timestamptz
);

create index if not exists idx_question_exchange
  on public.question (exchange_id);
create index if not exists idx_question_from
  on public.question (question_from);
create index if not exists idx_question_receiver
  on public.question (receiver_id);

alter table public.question enable row level security;

-- ============ 3. scheduled draw (organizer picks a future draw time) ============
alter table public.exchange
  add column if not exists scheduled_at timestamptz;

create index if not exists idx_exchange_scheduled
  on public.exchange (status, scheduled_at);

-- ============ 4. email queue: new job kinds for Q&A notifications ============
alter table public.email_job drop constraint if exists email_job_kind_check;
alter table public.email_job add constraint email_job_kind_check
  check (kind in ('assignment', 'organizer_link', 'reminder', 'question', 'answer'));
