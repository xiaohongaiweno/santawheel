-- SantaWheel reliability: idempotent exchange creation.
-- Apply after 20261104030000_kind_and_ratelimit.sql
--
-- The creation form generates a random request id per session and sends it
-- with the create request. A retry (double click, flaky network, page refresh
-- on the success screen) resolves to the exchange created by the first
-- attempt instead of drawing — and emailing everyone — a second time.

alter table public.exchange
  add column if not exists client_request_id text;

-- Partial unique index: only enforce uniqueness for requests that sent an id
-- (older rows and API callers without an id stay valid).
create unique index if not exists uniq_exchange_client_request
  on public.exchange (client_request_id)
  where client_request_id is not null;

-- Rollback (safe: no data loss, ids simply stop being deduplicated):
--   drop index if exists public.uniq_exchange_client_request;
--   alter table public.exchange drop column if exists client_request_id;
