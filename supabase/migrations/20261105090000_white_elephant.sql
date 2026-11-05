-- White elephant / yankee swap: a second play mode for the same exchange,
-- participant, private-link and email infrastructure.
--
-- Secret Santa stays exactly as it is: play_mode defaults to 'secret_santa'
-- and no secret-santa code path reads this column. A white elephant game is
-- an exchange with play_mode = 'white_elephant' plus one we_game row, its
-- gift list and an append-only event log (state is a fold of the log, which
-- is what makes "undo last step" and "reload without losing progress" safe).

-- ============ 1. play mode selector ============

alter table public.exchange
  add column if not exists play_mode text not null default 'secret_santa';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exchange_play_mode_check'
  ) then
    alter table public.exchange
      add constraint exchange_play_mode_check
      check (play_mode in ('secret_santa', 'white_elephant'));
  end if;
end $$;

-- ============ 2. white elephant game ============

create table if not exists public.we_game (
  id          uuid primary key default gen_random_uuid(),
  exchange_id uuid not null unique references public.exchange (id) on delete cascade,
  -- how many times one gift may be stolen before it locks (rule 4)
  steal_limit int  not null default 3 check (steal_limit between 0 and 10),
  -- lobby -> playing -> finished, plus finished=true once result emails go out
  started     boolean not null default false,
  finished    boolean not null default false,
  -- draw order: participant ids, random at creation, organizer-editable in lobby
  turn_order  jsonb not null default '[]'::jsonb,
  -- cached fold of the event log (ids only, no names/emails) for cheap reads
  state       jsonb not null default '{}'::jsonb,
  version     int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.we_gift (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.we_game (id) on delete cascade,
  label      text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_we_gift_game on public.we_gift (game_id, position);

-- Append-only action log. `seq` is per game and unique: two concurrent
-- actions compute the same next seq and the unique constraint lets exactly
-- one of them win, so the game can never fork.
create table if not exists public.we_event (
  id         bigint generated always as identity primary key,
  game_id    uuid not null references public.we_game (id) on delete cascade,
  seq        int  not null,
  type       text not null check (type in ('pick', 'steal', 'repick')),
  player_id  uuid not null references public.participant (id) on delete cascade,
  gift_id    uuid not null,
  victim_id  uuid references public.participant (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (game_id, seq)
);
create index if not exists idx_we_event_game on public.we_event (game_id, seq);

alter table public.we_game  enable row level security;
alter table public.we_gift  enable row level security;
alter table public.we_event enable row level security;

-- ============ 3. result email kind ============

alter table public.email_job drop constraint if exists email_job_kind_check;
alter table public.email_job add constraint email_job_kind_check
  check (kind in ('assignment', 'organizer_link', 'reminder', 'question', 'answer', 'we_result'));

-- ============ 4. realtime (optional transport) ============
-- The board falls back to a short poll when no public Supabase key is
-- configured; publishing the table means a realtime channel works as soon as
-- one is added (and an anon SELECT policy is granted deliberately).

do $$
begin
  alter publication supabase_realtime add table public.we_game;
exception
  when others then null; -- already published, or realtime not available
end $$;

-- Rollback:
--   alter publication supabase_realtime drop table public.we_game;
--   alter table public.email_job drop constraint if exists email_job_kind_check;
--   drop table if exists public.we_event;
--   drop table if exists public.we_gift;
--   drop table if exists public.we_game;
--   alter table public.exchange drop column if exists play_mode;
