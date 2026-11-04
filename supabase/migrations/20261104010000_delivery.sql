-- SantaWheel delivery layer: assignment links, email queue, resettable draws.
-- Apply after 20261104000000_init_draw.sql

-- ============ columns ============

-- Incremented on every reset; tokens embed the generation they were issued
-- for, so resetting a draw instantly revokes all previously issued links.
alter table public.exchange
  add column if not exists draw_generation integer not null default 1;

-- GDPR: soft-removed participants are redacted immediately and hard-deleted
-- on the next draw reset.
alter table public.participant
  add column if not exists removed_at timestamptz;

-- ============ assignment delivery state ============
-- pair rows stay immutable; mutable per-recipient delivery state lives here.
create table if not exists public.assignment (
  exchange_id     uuid not null,
  giver_id        uuid not null,
  draw_generation integer not null default 1,
  email_status    text not null default 'pending'
                  check (email_status in ('pending', 'sent', 'failed', 'cancelled')),
  attempts        integer not null default 0,
  last_error      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  primary key (exchange_id, giver_id),
  foreign key (exchange_id, giver_id)
    references public.pair (exchange_id, giver_id) on delete cascade
);

-- ============ email retry queue ============
create table if not exists public.email_job (
  id              uuid primary key default gen_random_uuid(),
  exchange_id     uuid not null references public.exchange (id) on delete cascade,
  kind            text not null check (kind in ('assignment', 'organizer_link')),
  giver_id        uuid references public.participant (id) on delete cascade,
  to_email        text not null,
  subject         text not null,
  payload         jsonb not null,   -- self-contained: tokens + names for rendering
  status          text not null default 'pending'
                  check (status in ('pending', 'sent', 'failed')),
  attempts        integer not null default 0,
  max_attempts    integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_email_job_due
  on public.email_job (status, next_attempt_at);
create index if not exists idx_email_job_exchange
  on public.email_job (exchange_id, status);

-- ============ immutability with a reset bypass ============
-- The reset RPC below runs with app.allow_pair_reset = 'on' (transaction-
-- scoped), which is the only way pairs can ever be removed.
create or replace function public.forbid_pair_mutation()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_pair_reset', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'DRAW_RESULTS_ARE_IMMUTABLE';
end;
$$;

-- ============ organizer reset (revokes all issued links) ============
-- Deletes pairs + assignments, hard-deletes redacted (GDPR-removed)
-- participants, cancels pending emails, bumps draw_generation so every
-- previously issued token stops working.
create or replace function public.reset_draw(p_exchange_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('app.allow_pair_reset', 'on', true);

  delete from public.pair where exchange_id = p_exchange_id;
  delete from public.participant
    where exchange_id = p_exchange_id and removed_at is not null;
  delete from public.email_job
    where exchange_id = p_exchange_id and status = 'pending';

  update public.exchange
  set status = 'draft',
      draw_generation = draw_generation + 1
  where id = p_exchange_id;
end;
$$;

-- ============ security ============
alter table public.assignment enable row level security;
alter table public.email_job  enable row level security;
