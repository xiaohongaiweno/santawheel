import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { enqueueEmails, processDueJobs } from "@/lib/email-queue";
import {
  decideAction,
  foldState,
  normaliseStealLimit,
  validateStart,
  type WeActionRow,
  type WeActionType,
  type WeConfig,
  type WeGiftState,
  type WeMode,
  type WePhase,
  type WeState,
} from "@/lib/white-elephant";

/**
 * White elephant persistence.
 *
 * Rules of the road:
 *  - we_event is the source of truth. Every read re-folds the log, so a
 *    reload can never show a stale board.
 *  - we_game.state is only a cache for cheap reads and realtime payloads.
 *  - A game can never fork: the next `seq` is unique per game, so when two
 *    actions race, one of them loses the insert and gets a 409.
 *  - Secret Santa tables and flows are untouched: a white elephant game is
 *    its own exchange (`play_mode = 'white_elephant'`) with no pair/assignment.
 */

export class WeGameError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "WeGameError";
  }
}

interface GameRow {
  id: string;
  exchange_id: string;
  steal_limit: number;
  started: boolean;
  finished: boolean;
  turn_order: string[];
  state: Record<string, unknown>;
  version: number;
  updated_at: string;
}

interface ExchangeRow {
  id: string;
  title: string;
  play_mode: string;
  status: string;
}

interface GiftRow {
  id: string;
  label: string;
  position: number;
}

interface PersonRow {
  id: string;
  name: string;
  email: string | null;
  removed_at: string | null;
}

export interface WeContext {
  game: GameRow;
  exchange: ExchangeRow;
  gifts: GiftRow[];
  people: PersonRow[];
  events: WeActionRow[];
  config: WeConfig;
  state: WeState;
}

// ---------- reads ----------

function missingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation .*we_(game|gift|event).* does not exist/i.test(error.message ?? "")
  );
}

function migrateError(): WeGameError {
  return new WeGameError(
    "migration_required",
    503,
    "White elephant needs the 20261105090000_white_elephant migration."
  );
}

export async function loadWeContext(exchangeId: string): Promise<WeContext> {
  const db = getSupabaseAdmin();
  const [gameRes, exchangeRes, peopleRes] = await Promise.all([
    db.from("we_game").select("*").eq("exchange_id", exchangeId).maybeSingle(),
    db.from("exchange").select("id, title, play_mode, status").eq("id", exchangeId).maybeSingle(),
    db.from("participant").select("id, name, email, removed_at").eq("exchange_id", exchangeId).order("created_at"),
  ]);

  if (missingTable(gameRes.error)) throw migrateError();
  if (gameRes.error) throw new Error(`loadWeContext failed: ${gameRes.error.message}`);
  if (!exchangeRes.data) throw new WeGameError("not_found", 404, "That game does not exist.");
  if (!gameRes.data) throw new WeGameError("not_white_elephant", 404, "That exchange is not a white elephant game.");

  const game = gameRes.data as unknown as GameRow;

  // Gifts and events are keyed by the game id: never mix in another game's data.
  const [giftRows, eventRows] = await Promise.all([
    db.from("we_gift").select("id, label, position").eq("game_id", game.id).order("position"),
    db.from("we_event").select("seq, type, player_id, gift_id, victim_id").eq("game_id", game.id).order("seq"),
  ]);
  if (giftRows.error) throw new Error(`loadWeContext gifts failed: ${giftRows.error.message}`);
  if (eventRows.error) throw new Error(`loadWeContext events failed: ${eventRows.error.message}`);

  const gifts = (giftRows.data ?? []) as unknown as GiftRow[];
  const events = (eventRows.data ?? []) as unknown as WeActionRow[];

  const config: WeConfig = {
    turnOrder: Array.isArray(game.turn_order) ? game.turn_order : [],
    stealLimit: game.steal_limit,
    gifts: gifts.map((g) => ({ id: g.id, label: g.label })),
    started: game.started,
  };

  return {
    game,
    exchange: exchangeRes.data as unknown as ExchangeRow,
    gifts,
    people: (peopleRes.data ?? []) as unknown as PersonRow[],
    events,
    config,
    state: foldState(config, events),
  };
}

// ---------- board view (what the page and the poll endpoint return) ----------

export interface WeBoardView {
  exchangeId: string;
  gameId: string;
  title: string;
  phase: WePhase;
  mode: WeMode;
  stealLimit: number;
  started: boolean;
  finished: boolean;
  turnIndex: number;
  pendingActor: { id: string; name: string } | null;
  turnOrder: Array<{ id: string; name: string }>;
  players: Array<{
    id: string;
    name: string;
    hasEmail: boolean;
    gift: { id: string; label: string; stolenCount: number; locked: boolean } | null;
  }>;
  pool: Array<{ id: string; label: string }>;
  history: Array<{ seq: number; type: WeActionType; player: string; gift: string; victim: string | null }>;
  lastAction: string | null;
  canUndo: boolean;
  canFinish: boolean;
  updatedAt: string;
}

function giftOf(state: WeState, personId: string): WeGiftState | null {
  return state.gifts.find((g) => g.holderId === personId) ?? null;
}

export function toBoardView(ctx: WeContext): WeBoardView {
  const nameOf = new Map(ctx.people.map((p) => [p.id, p.removed_at ? "Removed participant" : p.name]));
  const labelOf = new Map(ctx.state.gifts.map((g) => [g.id, g.label]));
  const seqToAction = (ev: WeActionRow) => ({
    seq: ev.seq,
    type: ev.type,
    player: nameOf.get(ev.player_id) ?? "Unknown",
    gift: labelOf.get(ev.gift_id) ?? "Unknown gift",
    victim: ev.victim_id ? (nameOf.get(ev.victim_id) ?? "Unknown") : null,
  });

  const history = ctx.events
    .slice(-8)
    .reverse()
    .map(seqToAction);

  return {
    exchangeId: ctx.game.exchange_id,
    gameId: ctx.game.id,
    title: ctx.exchange.title,
    phase: ctx.state.phase,
    mode: ctx.state.mode,
    stealLimit: ctx.state.stealLimit,
    started: ctx.game.started,
    finished: ctx.game.finished,
    turnIndex: ctx.state.turnIndex,
    pendingActor: ctx.state.pendingActorId
      ? { id: ctx.state.pendingActorId, name: nameOf.get(ctx.state.pendingActorId) ?? "Unknown" }
      : null,
    turnOrder: ctx.state.turnOrder.map((id) => ({ id, name: nameOf.get(id) ?? "Unknown" })),
    players: ctx.people.map((p) => {
      const gift = giftOf(ctx.state, p.id);
      return {
        id: p.id,
        name: p.removed_at ? "Removed participant" : p.name,
        hasEmail: Boolean(p.email),
        gift: gift
          ? { id: gift.id, label: gift.label, stolenCount: gift.stolenCount, locked: gift.locked }
          : null,
      };
    }),
    pool: ctx.state.poolIds.map((id) => ({ id, label: labelOf.get(id) ?? "Gift" })),
    history: history.slice(0, 8),
    lastAction: history[0]
      ? history[0].type === "steal"
        ? `${history[0].player} stole ${history[0].gift} from ${history[0].victim}`
        : history[0].type === "repick"
          ? `${history[0].player} re-opened ${history[0].gift} after being stolen from`
          : `${history[0].player} opened ${history[0].gift}`
      : null,
    canUndo: ctx.state.eventCount > 0 && !ctx.game.finished,
    canFinish: ctx.state.phase === "done" && !ctx.game.finished,
    updatedAt: ctx.game.updated_at,
  };
}

// ---------- writes ----------

async function saveSnapshot(
  game: GameRow,
  state: WeState,
  patch: Record<string, unknown> = {}
): Promise<void> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("we_game")
    .update({
      state: state as unknown as Record<string, unknown>,
      version: game.version + 1,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", game.id)
    .eq("version", game.version)
    .select("id");
  if (error) throw new Error(`saveSnapshot failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new WeGameError("conflict", 409, "Someone else moved first — reload the board.");
  }
}

export async function actOnGame(
  exchangeId: string,
  input: { type: "pick" | "steal"; giftId: string }
): Promise<WeBoardView> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.exchange.play_mode !== "white_elephant") {
    throw new WeGameError("not_white_elephant", 404, "That exchange is not a white elephant game.");
  }
  if (ctx.game.finished) {
    throw new WeGameError("finished", 409, "This game is over — results were already emailed.");
  }

  const decision = decideAction(ctx.state, input);
  if (!decision.ok) {
    throw new WeGameError(decision.reason, 409, rejectionMessage(decision.reason));
  }

  const nextSeq = ctx.state.eventCount + 1;
  const db = getSupabaseAdmin();
  const { error } = await db.from("we_event").insert({
    game_id: ctx.game.id,
    seq: nextSeq,
    type: decision.action.type,
    player_id: decision.action.player_id,
    gift_id: decision.action.gift_id,
    victim_id: decision.action.victim_id,
  });
  if (error) {
    if (error.code === "23505") {
      throw new WeGameError("conflict", 409, "Someone else moved first — reload the board.");
    }
    throw new Error(`actOnGame failed: ${error.message}`);
  }

  const nextState = foldState(ctx.config, [
    ...ctx.events,
    { ...decision.action, seq: nextSeq },
  ]);
  await saveSnapshot(ctx.game, nextState);
  return toBoardView(await loadWeContext(exchangeId));
}

export async function undoLastAction(exchangeId: string): Promise<WeBoardView> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.game.finished) {
    throw new WeGameError("finished", 409, "Results were already emailed — undo is closed.");
  }
  if (ctx.events.length === 0) {
    throw new WeGameError("nothing_to_undo", 409, "There is nothing to undo yet.");
  }

  const last = ctx.events.reduce((a, b) => (a.seq > b.seq ? a : b));
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("we_event")
    .delete()
    .eq("game_id", ctx.game.id)
    .eq("seq", last.seq);
  if (error) throw new Error(`undoLastAction failed: ${error.message}`);

  const nextState = foldState(
    ctx.config,
    ctx.events.filter((e) => e.seq !== last.seq)
  );
  await saveSnapshot(ctx.game, nextState);
  return toBoardView(await loadWeContext(exchangeId));
}

export async function startGame(exchangeId: string, order?: string[]): Promise<WeBoardView> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.game.started) throw new WeGameError("already_started", 409, "This game already started.");
  if (ctx.state.eventCount > 0) {
    throw new WeGameError("already_started", 409, "This game already has turns recorded.");
  }

  const turnOrder = order ?? ctx.config.turnOrder;
  const config: WeConfig = { ...ctx.config, turnOrder };
  const problem = validateStart(config, ctx.people.map((p) => p.id));
  if (problem) throw new WeGameError("invalid_start", 409, problem);

  const db = getSupabaseAdmin();
  const nextState = foldState({ ...config, started: true }, ctx.events);
  const { data, error } = await db
    .from("we_game")
    .update({
      started: true,
      turn_order: turnOrder,
      state: nextState as unknown as Record<string, unknown>,
      version: ctx.game.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.game.id)
    .eq("version", ctx.game.version)
    .select("id");
  if (error) throw new Error(`startGame failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new WeGameError("conflict", 409, "Someone else moved first — reload the board.");
  }
  return toBoardView(await loadWeContext(exchangeId));
}

export async function setStealLimit(exchangeId: string, limit: unknown): Promise<WeBoardView> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.game.finished) throw new WeGameError("finished", 409, "This game is over.");
  const value = normaliseStealLimit(limit);
  // Changing the limit re-derives which gifts are locked, so rewrite the cache too.
  const nextState = foldState({ ...ctx.config, stealLimit: value }, ctx.events);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("we_game")
    .update({
      steal_limit: value,
      state: nextState as unknown as Record<string, unknown>,
      version: ctx.game.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.game.id)
    .eq("version", ctx.game.version)
    .select("id");
  if (error) throw new Error(`setStealLimit failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new WeGameError("conflict", 409, "Someone else moved first — reload the board.");
  }
  return toBoardView(await loadWeContext(exchangeId));
}

export async function setTurnOrder(exchangeId: string, order: unknown): Promise<WeBoardView> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.game.started) {
    throw new WeGameError("already_started", 409, "The draw order is locked once the game starts.");
  }
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    throw new WeGameError("invalid_order", 400, "The draw order must be a list of participant ids.");
  }
  const known = new Set(ctx.people.map((p) => p.id));
  const next = order as string[];
  if (next.length !== known.size || new Set(next).size !== next.length || next.some((id) => !known.has(id))) {
    throw new WeGameError("invalid_order", 400, "The draw order must list every participant exactly once.");
  }
  const db = getSupabaseAdmin();
  const nextState = foldState({ ...ctx.config, turnOrder: next }, ctx.events);
  const { data, error } = await db
    .from("we_game")
    .update({
      turn_order: next,
      state: nextState as unknown as Record<string, unknown>,
      version: ctx.game.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.game.id)
    .eq("version", ctx.game.version)
    .select("id");
  if (error) throw new Error(`setTurnOrder failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new WeGameError("conflict", 409, "Someone else moved first — reload the board.");
  }
  return toBoardView(await loadWeContext(exchangeId));
}

/**
 * Send the final "you ended up with X" email to everyone holding a gift.
 * Claiming `finished` first keeps a double click from emailing twice.
 */
export async function finishGame(exchangeId: string): Promise<{
  view: WeBoardView;
  queued: number;
  delivery: { sent: number; failed: number; retriable: number } | null;
}> {
  const ctx = await loadWeContext(exchangeId);
  if (ctx.state.phase !== "done") {
    throw new WeGameError("not_done", 409, "Finish every turn before sending the results.");
  }
  if (ctx.game.finished) {
    return { view: toBoardView(ctx), queued: 0, delivery: null };
  }

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: claimed } = await db
    .from("we_game")
    .update({ finished: true, updated_at: now })
    .eq("id", ctx.game.id)
    .eq("finished", false)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return { view: toBoardView(await loadWeContext(exchangeId)), queued: 0, delivery: null };
  }

  const labelOf = new Map(ctx.state.gifts.map((g) => [g.id, g.label]));
  const jobs = ctx.people
    .filter((p) => Boolean(p.email) && !p.removed_at)
    .map((p) => ({
      person: p,
      gift: giftOf(ctx.state, p.id),
    }))
    .filter((row) => row.gift !== null);

  try {
    await enqueueEmails(
      jobs.map((row) => ({
        exchangeId,
        kind: "we_result" as const,
        giverId: row.person.id,
        toEmail: row.person.email as string,
        subject: `Your white elephant gift: ${labelOf.get(row.gift!.id) ?? "your present"}`,
        payload: {
          name: row.person.name,
          gift: labelOf.get(row.gift!.id) ?? "your present",
          title: ctx.exchange.title,
          kind: "gift_exchange",
        },
      }))
    );
  } catch (e) {
    await db.from("we_game").update({ finished: false }).eq("id", ctx.game.id);
    throw e;
  }

  const delivery = await processDueJobs({ exchangeId, limit: 100 }).catch(() => null);
  return {
    view: toBoardView(await loadWeContext(exchangeId)),
    queued: jobs.length,
    // retriable matters: a provider hiccup leaves the email queued, not failed,
    // and the board must not claim "0 delivered" in that case.
    delivery: delivery
      ? { sent: delivery.sent, failed: delivery.failed, retriable: delivery.retriable }
      : null,
  };
}

function rejectionMessage(reason: string): string {
  switch (reason) {
    case "not_started":
      return "Start the game before taking turns.";
    case "finished":
      return "Every turn is already used.";
    case "no_pending_actor":
      return "Nobody is up right now.";
    case "unknown_gift":
      return "That gift is not part of this game.";
    case "gift_not_in_pool":
      return "That gift is already open — steal it instead of picking it.";
    case "gift_not_held":
      return "Only an open gift can be stolen.";
    case "cannot_steal_own_gift":
      return "You cannot steal a gift you are already holding.";
    case "gift_locked":
      return "That gift reached its steal limit and is locked.";
    case "must_pick_new_gift":
      return "You just had a gift taken — open a new one from the pool (no stealing back).";
    case "first_player_must_pick":
      return "The first player of the first round must open a gift from the pool.";
    case "nothing_to_steal":
      return "There is no open gift left to steal — open one from the pool.";
    default:
      return "That move is not allowed.";
  }
}

// ---------- creation (shared by the internal test page and future UI) ----------

export interface CreateWeInput {
  title: string;
  organizerEmail?: string | null;
  /** display names in sign-up order; the play order is shuffled separately */
  participants: Array<{ name: string; email?: string | null }>;
  /** one label per gift; defaults to "Gift 1..N" */
  gifts?: string[];
  stealLimit?: number;
  createdByIp?: string | null;
}

export interface CreateWeResult {
  exchangeId: string;
  gameId: string;
  turnOrder: string[];
}

export async function createWhiteElephantGame(input: CreateWeInput): Promise<CreateWeResult> {
  const db = getSupabaseAdmin();

  const participants = input.participants
    .map((p) => ({ name: p.name.trim(), email: (p.email ?? "").trim().toLowerCase() }))
    .filter((p) => p.name.length > 0);
  if (participants.length === 0) {
    throw new WeGameError("invalid_input", 400, "Add at least one participant.");
  }
  if (participants.length > 100) {
    throw new WeGameError("invalid_input", 400, "A white elephant game supports up to 100 participants.");
  }
  if (new Set(participants.map((p) => p.email).filter(Boolean)).size !== participants.filter((p) => p.email).length) {
    throw new WeGameError("invalid_input", 400, "Two participants share the same email address.");
  }

  const giftLabels =
    input.gifts && input.gifts.length > 0
      ? input.gifts.map((g) => g.trim()).filter(Boolean)
      : participants.map((_, i) => `Gift ${i + 1}`);
  if (giftLabels.length < participants.length) {
    throw new WeGameError("invalid_input", 400, "Give every participant one gift in the pool.");
  }

  const { data: exchange, error: exErr } = await db
    .from("exchange")
    .insert({
      title: input.title.trim() || "White elephant",
      organizer_email: input.organizerEmail ?? "",
      kind: "gift_exchange",
      status: "draft",
      delivery_mode: "link",
      blind_mode: false,
      play_mode: "white_elephant",
      created_by_ip: input.createdByIp ?? null,
    })
    .select("id")
    .single();
  if (exErr) {
    // Deploy-order safety: the column arrives with the white elephant migration.
    if (exErr.code === "PGRST204" || /play_mode/i.test(exErr.message)) throw migrateError();
    throw new Error(`createWhiteElephantGame exchange failed: ${exErr.message}`);
  }
  const exchangeId = (exchange as { id: string }).id;

  try {
    const { data: people, error: pErr } = await db
      .from("participant")
      .insert(
        participants.map((p) => ({
          exchange_id: exchangeId,
          name: p.name,
          email: p.email || null,
        }))
      )
      .select("id, name");
    if (pErr) throw new Error(`createWhiteElephantGame participants failed: ${pErr.message}`);

    const ids = (people as Array<{ id: string }>).map((p) => p.id);
    const turnOrder = shuffle(ids);

    const { data: game, error: gErr } = await db
      .from("we_game")
      .insert({
        exchange_id: exchangeId,
        steal_limit: normaliseStealLimit(input.stealLimit),
        turn_order: turnOrder,
      })
      .select("id")
      .single();
    if (gErr) throw new Error(`createWhiteElephantGame game failed: ${gErr.message}`);

    const gameId = (game as { id: string }).id;
    const { error: giftErr } = await db.from("we_gift").insert(
      giftLabels.map((label, i) => ({ game_id: gameId, label, position: i }))
    );
    if (giftErr) throw new Error(`createWhiteElephantGame gifts failed: ${giftErr.message}`);

    return { exchangeId, gameId, turnOrder };
  } catch (e) {
    // Never leave a half-built game behind.
    await Promise.resolve(db.rpc("purge_exchange", { p_exchange_id: exchangeId })).catch(
      () => null
    );
    throw e;
  }
}

/** Fisher-Yates on a copy; the order must be random but stable once written. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
