import {
  buildDraw,
  validateDraw,
} from "@/lib/draw/derangement";
import { signToken } from "@/lib/tokens";
import { assignmentLink, manageLink, kindLabel, type ExchangeKind } from "@/lib/email-templates";
import { enqueueEmails } from "@/lib/email-queue";
import { getSupabaseAdmin, type ParticipantRow } from "@/lib/supabase/draw-service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PARTICIPANTS = 100;

export interface IncomingParticipant {
  name: string;
  email: string;
  note?: string;
  wishlistUrl?: string;
}

export interface CreateExchangeInput {
  title: string;
  organizerEmail: string;
  participants: IncomingParticipant[];
  /** [emailA, emailB] pairs that must not draw each other (bidirectional). */
  exclusions?: Array<[string, string]>;
  budgetAmount?: number;
  deadline?: string; // YYYY-MM-DD
  /** Landing page origin — switches email copy and keeps page data separate. */
  kind?: ExchangeKind;
  /** Creator IP, stored for abuse rate limiting. */
  createdByIp?: string;
}

/** Full pipeline: validate -> persist -> draw -> persist pairs -> enqueue emails. */
export async function createAndDeliverExchange(
  input: CreateExchangeInput
): Promise<{ exchangeId: string }> {
  const title = input.title?.trim();
  if (!title) throw new Error("Title is required");
  if (!EMAIL_RE.test(input.organizerEmail || "")) {
    throw new Error("A valid organizerEmail is required");
  }
  const participants = normalizeParticipants(input.participants);
  const organizerEmail = input.organizerEmail.toLowerCase();
  const kind: ExchangeKind = input.kind ?? "secret_santa";

  const db = getSupabaseAdmin();

  const { data: exchange, error } = await db
    .from("exchange")
    .insert({
      title,
      organizer_email: organizerEmail,
      budget_amount: input.budgetAmount ?? null,
      deadline: input.deadline ?? null,
      kind,
      created_by_ip: input.createdByIp ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createExchange failed: ${error.message}`);
  const exchangeId = exchange.id as string;

  try {
    const { data: participantRows, error: perr } = await db
      .from("participant")
      .insert(
        participants.map((p) => ({
          exchange_id: exchangeId,
          name: p.name,
          email: p.email,
          note: p.note ?? null,
          wishlist_url: p.wishlistUrl ?? null,
        }))
      )
      .select("*");
    if (perr) throw new Error(`addParticipants failed: ${perr.message}`);

    const rows = participantRows as ParticipantRow[];
    const exclusionPairs = await insertExclusions(exchangeId, rows, input.exclusions ?? []);

    await drawAndDeliver(exchangeId, rows, exclusionPairs, organizerEmail, title, kind);
    return { exchangeId };
  } catch (e) {
    // Roll back the half-built exchange so no orphan rows linger.
    await db.from("exchange").delete().eq("id", exchangeId);
    throw e;
  }
}

/** Reset (revokes all links) then draw again with the current non-removed participants. */
export async function redrawExchange(exchangeId: string): Promise<{ generation: number }> {
  const db = getSupabaseAdmin();

  const { data: exchange } = await db
    .from("exchange")
    .select("id, title, organizer_email, kind")
    .eq("id", exchangeId)
    .maybeSingle();
  if (!exchange) throw new Error("Exchange not found");

  const { error: resetErr } = await db.rpc("reset_draw", { p_exchange_id: exchangeId });
  if (resetErr) throw new Error(`reset_draw failed: ${resetErr.message}`);

  const { data: fresh } = await db
    .from("exchange")
    .select("draw_generation")
    .eq("id", exchangeId)
    .single();
  if (!fresh) throw new Error("Exchange disappeared during reset");
  const generation = fresh.draw_generation as number;

  const { data: participants, error: perr } = await db
    .from("participant")
    .select("*")
    .eq("exchange_id", exchangeId)
    .is("removed_at", null);
  if (perr) throw new Error(`fetchParticipants failed: ${perr.message}`);
  const rows = participants as ParticipantRow[];

  const { data: exclusionRows } = await db
    .from("exclusion")
    .select("participant_a, participant_b")
    .eq("exchange_id", exchangeId);
  const ids = new Set(rows.map((r) => r.id));
  const exclusionPairs: Array<[string, string]> = (exclusionRows ?? [])
    .filter((e) => ids.has(e.participant_a) && ids.has(e.participant_b))
    .map((e) => [`${e.participant_a}`, `${e.participant_b}`]);

  await drawAndDeliver(
    exchangeId,
    rows,
    exclusionPairs,
    exchange.organizer_email as string,
    exchange.title as string,
    (exchange.kind as ExchangeKind) ?? "secret_santa"
  );
  return { generation };
}

async function drawAndDeliver(
  exchangeId: string,
  participants: ParticipantRow[],
  exclusionIds: Array<[string, string]>,
  organizerEmail: string,
  title: string,
  kind: ExchangeKind
): Promise<void> {
  const db = getSupabaseAdmin();
  const label = kindLabel(kind);

  const { data: exchangeRow } = await db
    .from("exchange")
    .select("paid")
    .eq("id", exchangeId)
    .single();
  const paid = Boolean(exchangeRow?.paid);

  // Draw is computed over stable display keys, then mapped back to ids.
  const keyOf = (p: ParticipantRow) => `${p.name} <${p.email}>`;
  const idByKey = new Map(participants.map((p) => [keyOf(p), p.id] as const));
  const names = participants.map(keyOf);
  const exclusions = exclusionIds.map(([a, b]) => {
    const pa = participants.find((p) => p.id === a);
    const pb = participants.find((p) => p.id === b);
    return [keyOf(pa!), keyOf(pb!)] as [string, string];
  });

  // Premium: no-repeat draws — previous pairings from this organizer become
  // extra exclusion constraints.
  if (paid) {
    const { data: history } = await db
      .from("pair_history")
      .select("giver_email, receiver_email")
      .eq("organizer_email", organizerEmail);
    const emailToKey = new Map(participants.map((p) => [p.email, keyOf(p)] as const));
    for (const h of (history ?? []) as Array<{ giver_email: string; receiver_email: string }>) {
      const g = emailToKey.get(h.giver_email);
      const r = emailToKey.get(h.receiver_email);
      if (g && r) exclusions.push([g, r]);
    }
  }

  const draw = buildDraw(names, exclusions); // throws UnsolvableDrawError when impossible
  const check = validateDraw(names, exclusions, draw);
  if (!check.ok) throw new Error(`internal error: invalid draw rejected (${check.reason})`);

  const pairs = draw.map((d) => ({
    giver: idByKey.get(d.giver)!,
    receiver: idByKey.get(d.receiver)!,
  }));

  const { error: rpcErr } = await db.rpc("perform_draw", {
    p_exchange_id: exchangeId,
    p_pairs: pairs,
  });
  if (rpcErr) throw new Error(`perform_draw failed: ${rpcErr.message}`);

  const { data: ex, error: exErr } = await db
    .from("exchange")
    .select("draw_generation")
    .eq("id", exchangeId)
    .single();
  if (exErr) throw new Error(`fetchGeneration failed: ${exErr.message}`);
  const generation = ex.draw_generation as number;

  const { error: aErr } = await db.from("assignment").insert(
    pairs.map((p) => ({
      exchange_id: exchangeId,
      giver_id: p.giver,
      draw_generation: generation,
    }))
  );
  if (aErr) throw new Error(`insertAssignments failed: ${aErr.message}`);

  // Record history so future paid draws can avoid repeating pairs.
  const byId = new Map(participants.map((p) => [p.id, p] as const));
  const { error: hErr } = await db.from("pair_history").upsert(
    pairs.map((p) => ({
      organizer_email: organizerEmail,
      giver_email: byId.get(p.giver)!.email,
      receiver_email: byId.get(p.receiver)!.email,
      exchange_id: exchangeId,
    })),
    { onConflict: "exchange_id,giver_email,receiver_email" }
  );
  if (hErr) throw new Error(`recordPairHistory failed: ${hErr.message}`);

  // Reset reminder scheduling for the new draw.
  const { error: rErr } = await db
    .from("exchange")
    .update({
      reminder_sent: false,
      reminder_at: paid ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .eq("id", exchangeId);
  if (rErr) throw new Error(`resetReminder failed: ${rErr.message}`);

  await enqueueEmails([
    ...participants.map((p) => ({
      exchangeId,
      kind: "assignment" as const,
      giverId: p.id,
      toEmail: p.email,
      subject: `Your ${label} assignment`,
      payload: {
        name: p.name,
        kind,
        token: signToken({ t: "a", x: exchangeId, p: p.id, g: generation }),
        removeToken: signToken({ t: "r", x: exchangeId, p: p.id }),
        assignmentUrl: assignmentLink(exchangeId, p.id, generation),
      },
    })),
    {
      exchangeId,
      kind: "organizer_link" as const,
      giverId: null,
      toEmail: organizerEmail,
      subject: "Your SantaWheel draw is ready",
      payload: {
        title,
        kind,
        token: signToken({ t: "o", x: exchangeId }),
        manageUrl: manageLink(exchangeId),
      },
    },
  ]);
}

async function insertExclusions(
  exchangeId: string,
  participants: ParticipantRow[],
  exclusions: Array<[string, string]>
): Promise<Array<[string, string]>> {
  if (exclusions.length === 0) return [];
  const byEmail = new Map(participants.map((p) => [p.email, p.id] as const));

  const rows: Array<{ exchange_id: string; participant_a: string; participant_b: string }> = [];
  const validPairs: Array<[string, string]> = [];
  for (const [a, b] of exclusions) {
    const ea = a.toLowerCase().trim();
    const eb = b.toLowerCase().trim();
    if (ea === eb) continue;
    const idA = byEmail.get(ea);
    const idB = byEmail.get(eb);
    if (!idA || !idB) {
      throw new Error(
        `Exclusion references unknown participant(s): ${[ea, eb].filter((e) => !byEmail.has(e)).join(", ")}`
      );
    }
    const [lo, hi] = idA < idB ? [idA, idB] : [idB, idA];
    rows.push({ exchange_id: exchangeId, participant_a: lo, participant_b: hi });
    validPairs.push([idA, idB]);
  }
  if (rows.length > 0) {
    const { error } = await getSupabaseAdmin()
      .from("exclusion")
      .upsert(rows, { onConflict: "exchange_id,participant_a,participant_b" });
    if (error) throw new Error(`insertExclusions failed: ${error.message}`);
  }
  return validPairs;
}

function normalizeParticipants(participants: IncomingParticipant[]): IncomingParticipant[] {
  if (!Array.isArray(participants)) throw new Error("participants must be an array");
  const seen = new Map<string, IncomingParticipant>();
  for (const p of participants) {
    const name = p.name?.trim();
    const email = p.email?.toLowerCase().trim();
    if (!name) throw new Error("Every participant needs a name");
    if (!email || !EMAIL_RE.test(email)) {
      throw new Error(`Invalid email for participant "${name}"`);
    }
    if (seen.has(email)) throw new Error(`Duplicate participant email: ${email}`);
    seen.set(email, {
      name,
      email,
      note: p.note?.trim() || undefined,
      wishlistUrl: p.wishlistUrl?.trim() || undefined,
    });
  }
  const list = [...seen.values()];
  if (list.length < 2) throw new Error("At least 2 participants are required");
  if (list.length > MAX_PARTICIPANTS) {
    throw new Error(`Up to ${MAX_PARTICIPANTS} participants are supported`);
  }
  return list;
}

/** GDPR: redact a participant immediately; hard deletion happens on next reset. */
export async function redactParticipant(exchangeId: string, participantId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await db
    .from("participant")
    .update({
      name: "Removed participant",
      email: `removed.${participantId}@invalid`,
      note: null,
      wishlist_url: null,
      removed_at: now,
    })
    .eq("exchange_id", exchangeId)
    .eq("id", participantId);
  if (error) throw new Error(`redactParticipant failed: ${error.message}`);

  // Stop any scheduled mail for them; their delivered assignment becomes void.
  await db
    .from("assignment")
    .update({ email_status: "cancelled", last_error: "participant removed their data" })
    .eq("exchange_id", exchangeId)
    .eq("giver_id", participantId);
  await db
    .from("email_job")
    .delete()
    .eq("exchange_id", exchangeId)
    .eq("giver_id", participantId)
    .eq("status", "pending");
}

/** Premium: bulk-add participants to an existing exchange (dedup by email). */
export async function importParticipants(
  exchangeId: string,
  incoming: Array<{ name: string; email: string; wishlistUrl?: string }>
): Promise<{ added: number; skipped: number; invalid: string[] }> {
  const db = getSupabaseAdmin();
  const { data: existing } = await db
    .from("participant")
    .select("email")
    .eq("exchange_id", exchangeId);
  const known = new Set(((existing ?? []) as Array<{ email: string }>).map((e) => e.email));

  const invalid: string[] = [];
  const rows: Array<{ exchange_id: string; name: string; email: string; wishlist_url: string | null }> = [];
  for (const p of incoming) {
    const name = p.name?.trim();
    const email = p.email?.toLowerCase().trim();
    if (!name || !EMAIL_RE.test(email ?? "")) {
      invalid.push(`${name || email || "row"} — need a name and a valid email`);
      continue;
    }
    if (known.has(email)) continue; // already in the exchange
    known.add(email); // dedup within the batch
    rows.push({
      exchange_id: exchangeId,
      name,
      email,
      wishlist_url: p.wishlistUrl ?? null,
    });
  }

  if (rows.length > 0) {
    const { error } = await db.from("participant").insert(rows);
    if (error) throw new Error(`importParticipants failed: ${error.message}`);
  }
  return { added: rows.length, skipped: incoming.length - rows.length - invalid.length, invalid };
}
