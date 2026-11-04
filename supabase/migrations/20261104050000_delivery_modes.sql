-- SantaWheel delivery modes: email delivery vs private links, plus blind mode.
-- Apply after 20261104040000_idempotency.sql
--
-- delivery_mode:
--   'email' - every participant gets an emailed private link (default)
--   'link'  - no participant emails are collected; the organizer copies one
--             private link per participant and shares it however they like
--
-- blind_mode:
--   true    - the organizer dashboard never loads or renders the pairings.
--             Only valid together with delivery_mode = 'email'.

alter table public.exchange
  add column if not exists delivery_mode text not null default 'email'
    check (delivery_mode in ('email', 'link'));

alter table public.exchange
  add column if not exists blind_mode boolean not null default false;

-- Fail closed: a link-mode draw cannot be blind (the organizer holds every
-- link, so the promise would be false).
alter table public.exchange
  drop constraint if exists exchange_blind_requires_email;
alter table public.exchange
  add constraint exchange_blind_requires_email
  check (not blind_mode or delivery_mode = 'email');

-- Link mode collects names only. Postgres allows repeated NULLs in a unique
-- constraint, so `unique (exchange_id, email)` still guards email delivery
-- while letting several link-mode participants have no email at all.
alter table public.participant alter column email drop not null;

-- Rollback (safe, no data loss — link-mode rows keep whatever emails they had):
--   alter table public.exchange drop constraint if exists exchange_blind_requires_email;
--   alter table public.exchange drop column if exists blind_mode;
--   alter table public.exchange drop column if exists delivery_mode;
--   -- only after removing every link-mode participant:
--   -- alter table public.participant alter column email set not null;
