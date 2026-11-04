import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildDraw, UnsolvableDrawError, validateDraw } from "@/lib/draw/derangement";

// ---------- row types ----------

export interface ExchangeRow {
  id: string;
  title: string;
  organizer_email: string;
  budget_amount: string | null;
  deadline: string | null;
  status: "draft" | "drawn";
  created_at: string;
}

export interface ParticipantRow {
  id: string;
  exchange_id: string;
  name: string;
  email: string;
  note: string | null;
  wishlist_url: string | null;
}

export interface AssignedPair {
  giver: Pick<ParticipantRow, "id" | "name" | "email">;
  receiver: Pick<ParticipantRow, "id" | "name" | "email">;
}

// ---------- client ----------

let cached: SupabaseClient | null = null;

/** Server-side client (service role). Callers must keep this off the client bundle. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables. " +
        "Copy .env.example to .env.local and fill them in."
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

// ---------- exchange / participant / exclusion management ----------

export async function createExchange(input: {
  title: string;
  organizerEmail: string;
  budgetAmount?: number;
  deadline?: string; // YYYY-MM-DD
}): Promise<ExchangeRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("exchange")
    .insert({
      title: input.title,
      organizer_email: input.organizerEmail,
      budget_amount: input.budgetAmount ?? null,
      deadline: input.deadline ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createExchange failed: ${error.message}`);
  return data as ExchangeRow;
}

export async function addParticipant(
  exchangeId: string,
  input: { name: string; email: string; note?: string; wishlistUrl?: string }
): Promise<ParticipantRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("participant")
    .insert({
      exchange_id: exchangeId,
      name: input.name,
      email: input.email.toLowerCase(),
      note: input.note ?? null,
      wishlist_url: input.wishlistUrl ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`addParticipant failed: ${error.message}`);
  return data as ParticipantRow;
}

/** Adds a bidirectional exclusion between two participants of the same exchange. */
export async function addExclusion(
  exchangeId: string,
  emailA: string,
  emailB: string
): Promise<void> {
  const a = emailA.toLowerCase();
  const b = emailB.toLowerCase();
  if (a === b) throw new Error("addExclusion: an participant cannot be excluded from themselves");

  const { data, error } = await getSupabaseAdmin()
    .from("participant")
    .select("id, email")
    .eq("exchange_id", exchangeId)
    .in("email", [a, b]);
  if (error) throw new Error(`addExclusion lookup failed: ${error.message}`);
  const found = new Map((data as Pick<ParticipantRow, "id" | "email">[]).map((p) => [p.email, p.id]));
  const idA = found.get(a);
  const idB = found.get(b);
  if (!idA || !idB) {
    throw new Error(`addExclusion: participants not found in exchange ${exchangeId}: ${[a, b].filter((e) => !found.has(e)).join(", ")}`);
  }

  // normalized order required by the DB check constraint
  const [lo, hi] = idA < idB ? [idA, idB] : [idB, idA];
  const { error: insErr } = await getSupabaseAdmin()
    .from("exclusion")
    .upsert(
      { exchange_id: exchangeId, participant_a: lo, participant_b: hi },
      { onConflict: "exchange_id,participant_a,participant_b" }
    );
  if (insErr) throw new Error(`addExclusion failed: ${insErr.message}`);
}

// ---------- draw ----------

function toInputPairs(
  participants: ParticipantRow[],
  exclusions: { participant_a: string; participant_b: string }[]
): { names: string[]; excluded: Array<[string, string]> } {
  const byId = new Map(participants.map((p) => [p.id, `${p.name} <${p.email}>`]));
  return {
    names: participants.map((p) => byId.get(p.id)!),
    excluded: exclusions.map((e) => [byId.get(e.participant_a)!, byId.get(e.participant_b)!]),
  };
}

async function fetchDrawContext(exchangeId: string) {
  const db = getSupabaseAdmin();
  const [exchangeRes, participantsRes, exclusionsRes] = await Promise.all([
    db.from("exchange").select("*").eq("id", exchangeId).maybeSingle(),
    db.from("participant").select("*").eq("exchange_id", exchangeId).order("created_at"),
    db.from("exclusion").select("participant_a, participant_b").eq("exchange_id", exchangeId),
  ]);
  if (exchangeRes.error) throw new Error(`fetchDrawContext failed: ${exchangeRes.error.message}`);
  if (!exchangeRes.data) throw new Error(`Exchange ${exchangeId} not found`);
  if (participantsRes.error) throw new Error(`fetchDrawContext failed: ${participantsRes.error.message}`);
  if (exclusionsRes.error) throw new Error(`fetchDrawContext failed: ${exclusionsRes.error.message}`);
  return {
    exchange: exchangeRes.data as ExchangeRow,
    participants: participantsRes.data as ParticipantRow[],
    exclusions: exclusionsRes.data as { participant_a: string; participant_b: string }[],
  };
}

async function fetchAssignedPairs(exchangeId: string): Promise<AssignedPair[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("pair")
    .select(
      "giver_id, receiver_id, participant!pair_giver_id_fkey(id, name, email), participant!pair_receiver_id_fkey(id, name, email)"
    )
    .eq("exchange_id", exchangeId);
  if (error) throw new Error(`fetchAssignedPairs failed: ${error.message}`);
  type Row = {
    participant: [Pick<ParticipantRow, "id" | "name" | "email">, Pick<ParticipantRow, "id" | "name" | "email">];
  };
  // With two FKs to the same table Postgres/Supabase returns an array per row.
  return (data as unknown as Row[]).map((row) => ({
    giver: row.participant[0],
    receiver: row.participant[1],
  }));
}

/**
 * Run the draw for an exchange and persist it.
 *
 * - If the exchange is already drawn, returns the stored (immutable) result —
 *   repeated calls always return the same assignment.
 * - Throws UnsolvableDrawError (readable message) when no valid draw exists;
 *   nothing is written in that case.
 * - Persistence is atomic via the perform_draw RPC: concurrent callers are
 *   serialized, and exactly one result is stored forever.
 */
export async function runDraw(exchangeId: string): Promise<AssignedPair[]> {
  const { exchange, participants, exclusions } = await fetchDrawContext(exchangeId);

  if (exchange.status === "drawn") {
    return fetchAssignedPairs(exchangeId);
  }

  if (participants.length < 2) {
    throw new UnsolvableDrawError(
      `A draw needs at least 2 participants (exchange "${exchange.title}" has ${participants.length})`
    );
  }

  const { names, excluded } = toInputPairs(participants, exclusions);
  const draw = buildDraw(names, excluded); // throws UnsolvableDrawError if impossible

  // Final guard: never persist a rule-violating result, even on a bug.
  const check = validateDraw(names, excluded, draw);
  if (!check.ok) throw new Error(`internal error: invalid draw rejected (${check.reason})`);

  const idByName = new Map<string, string>(
    participants.map((p) => [`${p.name} <${p.email}>`, p.id])
  );
  const payload = draw.map((p) => ({
    giver: idByName.get(p.giver)!,
    receiver: idByName.get(p.receiver)!,
  }));

  const { error: rpcError } = await getSupabaseAdmin().rpc("perform_draw", {
    p_exchange_id: exchangeId,
    p_pairs: payload,
  });

  if (rpcError) {
    if (rpcError.message.includes("EXCHANGE_ALREADY_DRAWN")) {
      // Another caller won the race — return the stored result.
      return fetchAssignedPairs(exchangeId);
    }
    throw new Error(`perform_draw failed: ${rpcError.message}`);
  }

  return fetchAssignedPairs(exchangeId);
}
