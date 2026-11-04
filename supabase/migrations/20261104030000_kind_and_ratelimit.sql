-- SantaWheel: exchange kind (page isolation) + abuse protection.
-- Apply after 20261104020000_premium.sql

-- Which landing page created the exchange (secret santa vs gift exchange).
alter table public.exchange
  add column if not exists kind text not null default 'secret_santa'
    check (kind in ('secret_santa', 'gift_exchange'));

-- Creator IP for rate limiting the anonymous create endpoint.
alter table public.exchange
  add column if not exists created_by_ip text;

create index if not exists idx_exchange_ip_recent
  on public.exchange (created_by_ip, created_at desc);
