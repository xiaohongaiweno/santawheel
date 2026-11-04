-- SantaWheel: hard-delete a whole exchange (organizer-initiated, GDPR).
-- Apply after 20261104050000_delivery_modes.sql
--
-- The privacy policy tells organizers they can ask us to delete the whole
-- draw, but until now there was no code path for it: participants could only
-- be redacted one at a time, and the immutability triggers block any direct
-- delete of pairs. This function is that path.

create or replace function public.purge_exchange(p_exchange_id uuid)
returns void
language plpgsql
as $$
begin
  -- The same transaction-scoped bypass reset_draw() uses; without it the
  -- pair/participant immutability triggers raise DRAW_RESULTS_ARE_IMMUTABLE.
  perform set_config('app.allow_pair_reset', 'on', true);

  delete from public.email_job    where exchange_id = p_exchange_id;  -- outbound queue
  delete from public.assignment  where exchange_id = p_exchange_id;  -- delivery state
  delete from public.pair        where exchange_id = p_exchange_id;  -- the draw itself
  delete from public.participant where exchange_id = p_exchange_id;  -- names + emails
  delete from public.pair_history where exchange_id = p_exchange_id; -- no-repeat history
  delete from public.exchange    where id = p_exchange_id;           -- the record
end;
$$;

-- Only the server (service role) may call this. Anonymous callers must never
-- be able to delete someone else's draw.
revoke all on function public.purge_exchange(uuid) from public;
revoke all on function public.purge_exchange(uuid) from anon;
revoke all on function public.purge_exchange(uuid) from authenticated;
grant execute on function public.purge_exchange(uuid) to service_role;

-- Rollback:
--   drop function if exists public.purge_exchange(uuid);
