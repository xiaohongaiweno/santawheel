-- SantaWheel draw storage (Supabase Postgres)
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

-- ============ tables ============

create table if not exists public.exchange (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  organizer_email text not null,
  budget_amount   numeric(12, 2),
  deadline        date,
  status          text not null default 'draft'
                  check (status in ('draft', 'drawn')),
  created_at      timestamptz not null default now()
);

create table if not exists public.participant (
  id           uuid primary key default gen_random_uuid(),
  exchange_id  uuid not null references public.exchange (id) on delete cascade,
  name         text not null,
  email        text not null,
  note         text,
  wishlist_url text,
  created_at   timestamptz not null default now(),
  unique (exchange_id, email),
  unique (exchange_id, id)  -- enables composite FKs below
);

create table if not exists public.exclusion (
  exchange_id    uuid not null references public.exchange (id) on delete cascade,
  participant_a  uuid not null,
  participant_b  uuid not null,
  created_at     timestamptz not null default now(),
  primary key (exchange_id, participant_a, participant_b),
  foreign key (exchange_id, participant_a)
    references public.participant (exchange_id, id) on delete cascade,
  foreign key (exchange_id, participant_b)
    references public.participant (exchange_id, id) on delete cascade,
  check (participant_a <> participant_b),
  check (participant_a < participant_b)  -- callers normalize order
);

create table if not exists public.pair (
  exchange_id uuid not null references public.exchange (id) on delete cascade,
  giver_id    uuid not null,
  receiver_id uuid not null,
  created_at  timestamptz not null default now(),
  primary key (exchange_id, giver_id),      -- each participant gives once
  unique (exchange_id, receiver_id),        -- ...and receives once
  foreign key (exchange_id, giver_id)
    references public.participant (exchange_id, id) on delete cascade,
  foreign key (exchange_id, receiver_id)
    references public.participant (exchange_id, id) on delete cascade,
  check (giver_id <> receiver_id)
);

create index if not exists idx_pair_exchange on public.pair (exchange_id);

-- ============ immutability: draw results can never be changed ============

create or replace function public.forbid_pair_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'DRAW_RESULTS_ARE_IMMUTABLE';
end;
$$;

drop trigger if exists pair_immutable on public.pair;
create trigger pair_immutable
  before update or delete on public.pair
  for each row execute function public.forbid_pair_mutation();

-- ============ atomic draw persistence ============
-- The application computes the draw, then persists it atomically:
-- locks the exchange, rejects if already drawn, inserts all pairs,
-- flips status. All-or-nothing, race-safe.

create or replace function public.perform_draw(
  p_exchange_id uuid,
  p_pairs jsonb   -- [{"giver": "<participant uuid>", "receiver": "<uuid>"}, ...]
)
returns void
language plpgsql
as $$
declare
  v_status     text;
  v_participant_count int;
begin
  select status into v_status
  from public.exchange
  where id = p_exchange_id
  for update;  -- serialize concurrent draws

  if not found then
    raise exception 'EXCHANGE_NOT_FOUND';
  end if;

  if v_status = 'drawn' then
    raise exception 'EXCHANGE_ALREADY_DRAWN';
  end if;

  select count(*) into v_participant_count
  from public.participant where exchange_id = p_exchange_id;

  if v_participant_count <> jsonb_array_length(p_pairs) then
    raise exception 'PAIR_COUNT_MISMATCH';
  end if;

  insert into public.pair (exchange_id, giver_id, receiver_id)
  select p_exchange_id,
         (elem ->> 'giver')::uuid,
         (elem ->> 'receiver')::uuid
  from jsonb_array_elements(p_pairs) as elem;

  update public.exchange
  set status = 'drawn'
  where id = p_exchange_id;
end;
$$;

-- ============ security ============
-- The Next.js server uses the service-role key (which bypasses RLS);
-- no anon/authenticated policies are granted, so clients cannot read
-- pair results or tamper with draws directly.
alter table public.exchange    enable row level security;
alter table public.participant enable row level security;
alter table public.exclusion   enable row level security;
alter table public.pair        enable row level security;
