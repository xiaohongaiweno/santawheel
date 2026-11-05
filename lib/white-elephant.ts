/**
 * White elephant (a.k.a. yankee swap) state machine — pure, no I/O.
 *
 * The game is an append-only log of actions. `foldState()` replays that log
 * into the current board, which is what makes persistence and "undo last
 * step" trivial: reloading is a fold, undoing is dropping the last entry.
 *
 * Rules implemented here:
 *  1. everyone gets a fixed random turn order (organizer may reorder in lobby)
 *  2. on your turn you either open a gift from the pool or steal an opened one
 *  3. being stolen from forces you to immediately open a new gift (no stealing back)
 *  4. a gift locks once it has been stolen `stealLimit` times
 *  5. the first player of the first round can only open from the pool
 *  6. after every turn is used, whoever holds a gift holds the final result
 */

export type WeActionType = "pick" | "steal" | "repick";

/** One entry of the persisted log (we_event). */
export interface WeActionRow {
  seq: number;
  type: WeActionType;
  player_id: string;
  gift_id: string;
  victim_id: string | null;
}

export interface WeGiftDef {
  id: string;
  label: string;
}

export interface WeConfig {
  /** participant ids in play order (length = number of turns in the rotation) */
  turnOrder: string[];
  /** how many times one gift may be stolen; default 3 */
  stealLimit: number;
  gifts: WeGiftDef[];
  /** false until the organizer starts the game; the board stays in the lobby */
  started: boolean;
}

export interface WeGiftState {
  id: string;
  label: string;
  /** null = still wrapped in the pool */
  holderId: string | null;
  stolenCount: number;
  /** true once stolenCount reached the limit: nobody may steal it again */
  locked: boolean;
}

export type WePhase = "lobby" | "playing" | "done";
export type WeMode = "choose" | "pick_only" | "none";

export interface WeState {
  phase: WePhase;
  turnOrder: string[];
  /** index of the next rotation turn; equals turnOrder.length when exhausted */
  turnIndex: number;
  /** who must act right now (rotation player, or the victim of a steal) */
  pendingActorId: string | null;
  /** "choose" = may open or steal, "pick_only" = just got stolen from */
  mode: WeMode;
  gifts: WeGiftState[];
  stealLimit: number;
  /** gifts still wrapped, in board order */
  poolIds: string[];
  lastEvent: WeActionRow | null;
  eventCount: number;
}

export type WeRejectReason =
  | "not_started"
  | "finished"
  | "no_pending_actor"
  | "unknown_gift"
  | "gift_not_in_pool"
  | "gift_not_held"
  | "cannot_steal_own_gift"
  | "gift_locked"
  | "must_pick_new_gift"
  | "first_player_must_pick"
  | "nothing_to_steal";

export type WeDecision =
  | {
      ok: true;
      action: Omit<WeActionRow, "seq">;
    }
  | { ok: false; reason: WeRejectReason };

const DEFAULTS = { stealLimit: 3 } as const;

export function normaliseStealLimit(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULTS.stealLimit;
  return Math.max(0, Math.min(10, Math.trunc(n)));
}

/** Replay the log into the current board state. Total function: never throws. */
export function foldState(config: WeConfig, actions: readonly WeActionRow[]): WeState {
  const stealLimit = normaliseStealLimit(config.stealLimit);
  const gifts = new Map<string, WeGiftState>(
    config.gifts.map((g) => [
      g.id,
      { id: g.id, label: g.label, holderId: null, stolenCount: 0, locked: false },
    ])
  );

  let turnIndex = 0;
  let pendingActorId: string | null = config.turnOrder[0] ?? null;
  let mode: WeMode = pendingActorId ? "choose" : "none";
  let lastEvent: WeActionRow | null = null;

  const ordered = [...actions].sort((a, b) => a.seq - b.seq);
  for (const ev of ordered) {
    const gift = gifts.get(ev.gift_id);
    lastEvent = ev;
    if (!gift) continue; // defensive: an unknown gift must not break the replay

    if (ev.type === "pick" || ev.type === "repick") {
      gift.holderId = ev.player_id;
      // only a regular turn advances the rotation; a forced re-pick does not
      if (ev.type === "pick") turnIndex += 1;
      pendingActorId = config.turnOrder[turnIndex] ?? null;
      mode = pendingActorId ? "choose" : "none";
    } else {
      gift.holderId = ev.player_id;
      gift.stolenCount += 1;
      turnIndex += 1;
      // the victim is up next and may only open a new gift
      pendingActorId = ev.victim_id;
      mode = pendingActorId ? "pick_only" : "none";
    }
  }

  for (const gift of gifts.values()) gift.locked = gift.stolenCount >= stealLimit;

  const rotationComplete = turnIndex >= config.turnOrder.length && pendingActorId === null;
  const phase: WePhase = !config.started
    ? "lobby"
    : rotationComplete
      ? "done"
      : "playing";

  return {
    phase,
    turnOrder: [...config.turnOrder],
    turnIndex,
    pendingActorId,
    mode,
    gifts: [...gifts.values()],
    stealLimit,
    poolIds: [...gifts.values()].filter((g) => g.holderId === null).map((g) => g.id),
    lastEvent,
    eventCount: ordered.length,
  };
}

/**
 * Decide what the pending player's action means, or why it is illegal.
 * The returned action still has no `seq` — the caller assigns it.
 */
export function decideAction(
  state: WeState,
  input: { type: "pick" | "steal"; giftId: string }
): WeDecision {
  if (state.phase === "lobby") return { ok: false, reason: "not_started" };
  if (state.phase === "done") return { ok: false, reason: "finished" };

  const playerId = state.pendingActorId;
  if (!playerId) return { ok: false, reason: "no_pending_actor" };

  const gift = state.gifts.find((g) => g.id === input.giftId);
  if (!gift) return { ok: false, reason: "unknown_gift" };

  if (input.type === "pick") {
    if (gift.holderId !== null) return { ok: false, reason: "gift_not_in_pool" };
    return {
      ok: true,
      action: {
        // a victim opening a new gift is a forced re-pick, not a rotation turn
        type: state.mode === "pick_only" ? "repick" : "pick",
        player_id: playerId,
        gift_id: gift.id,
        victim_id: null,
      },
    };
  }

  // ---- steal ----
  if (state.mode === "pick_only") return { ok: false, reason: "must_pick_new_gift" };
  // Rule 5: the very first player of the first round may only open from the pool.
  if (state.turnIndex === 0) return { ok: false, reason: "first_player_must_pick" };
  if (gift.holderId === null) return { ok: false, reason: "gift_not_held" };
  if (gift.holderId === playerId) return { ok: false, reason: "cannot_steal_own_gift" };
  if (gift.locked) return { ok: false, reason: "gift_locked" };
  if (!state.gifts.some((g) => g.holderId !== null && !g.locked)) {
    return { ok: false, reason: "nothing_to_steal" };
  }

  return {
    ok: true,
    action: { type: "steal", player_id: playerId, gift_id: gift.id, victim_id: gift.holderId },
  };
}

/**
 * Configuration sanity for starting a game. Returns an error message, or null
 * when the game is playable.
 */
export function validateStart(
  config: WeConfig,
  participantIds: readonly string[]
): string | null {
  const order = config.turnOrder;
  if (order.length === 0) return "Add at least one participant before starting.";
  if (new Set(order).size !== order.length) return "The draw order contains duplicates.";
  const known = new Set(participantIds);
  if (order.some((id) => !known.has(id))) return "The draw order contains an unknown participant.";
  if (order.length !== participantIds.length) {
    return "The draw order must list every participant exactly once.";
  }
  if (config.gifts.length < order.length) {
    return "Every participant needs a gift in the pool: add more gifts before starting.";
  }
  return null;
}

/** The board's "what happens now" line, kept out of the React component. */
export function describeTurn(state: WeState): string {
  if (state.phase === "lobby") return "Draw order is being set up — no turns yet.";
  if (state.phase === "done") return "Every turn is used. These are the final gifts.";
  if (state.mode === "pick_only") {
    return "Just had a gift taken — must open a new one from the pool.";
  }
  if (state.turnIndex === 0) return "First player of the first round — open a gift from the pool.";
  return "Open a new gift, or steal one that is already open.";
}
