import { describe, it, expect } from "vitest";
import {
  decideAction,
  describeTurn,
  foldState,
  validateStart,
  type WeActionRow,
  type WeConfig,
  type WeState,
} from "@/lib/white-elephant";

// ---------- helpers ----------

function config(partial: Partial<WeConfig> = {}): WeConfig {
  return {
    turnOrder: ["p1", "p2", "p3"],
    stealLimit: 3,
    gifts: [
      { id: "g1", label: "Blue box" },
      { id: "g2", label: "Red box" },
      { id: "g3", label: "Green box" },
    ],
    started: true,
    ...partial,
  };
}

/** Apply one action the way the API does: decide, then append to the log. */
function apply(
  cfg: WeConfig,
  log: WeActionRow[],
  input: { type: "pick" | "steal"; giftId: string }
): { state: WeState; log: WeActionRow[] } {
  const state = foldState(cfg, log);
  const decision = decideAction(state, input);
  if (!decision.ok) throw new Error(`rejected: ${decision.reason}`);
  const nextLog = [...log, { ...decision.action, seq: log.length + 1 }];
  return { state: foldState(cfg, nextLog), log: nextLog };
}

function holders(state: WeState): Record<string, string | null> {
  return Object.fromEntries(state.gifts.map((g) => [g.id, g.holderId]));
}

// ---------- 3 people, 3 gifts, one steal ----------

describe("white elephant: 3 players / 3 gifts with one steal", () => {
  const cfg = config();

  it("walks the whole rotation and ends with one gift each", () => {
    let log: WeActionRow[] = [];
    let state = foldState(cfg, log);

    // lobby state before anything happens
    expect(state.phase).toBe("playing");
    expect(state.pendingActorId).toBe("p1");
    expect(state.mode).toBe("choose");
    expect(state.turnIndex).toBe(0);
    expect(state.poolIds).toEqual(["g1", "g2", "g3"]);

    // turn 1: p1 must open from the pool (rule 5)
    expect(decideAction(state, { type: "steal", giftId: "g1" })).toEqual({
      ok: false,
      reason: "first_player_must_pick",
    });
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    expect(holders(state)).toEqual({ g1: "p1", g2: null, g3: null });
    expect(state.pendingActorId).toBe("p2");

    // turn 2: p2 steals p1's gift
    ({ state, log } = apply(cfg, log, { type: "steal", giftId: "g1" }));
    expect(holders(state)).toEqual({ g1: "p2", g2: null, g3: null });
    expect(state.gifts.find((g) => g.id === "g1")!.stolenCount).toBe(1);
    // the victim is up immediately and may only open a new gift (rule 3)
    expect(state.pendingActorId).toBe("p1");
    expect(state.mode).toBe("pick_only");
    expect(decideAction(state, { type: "steal", giftId: "g1" }).ok).toBe(false);

    // turn 3 (forced): p1 opens a fresh gift instead of stealing back
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g2" }));
    expect(log.at(-1)!.type).toBe("repick");
    expect(holders(state)).toEqual({ g1: "p2", g2: "p1", g3: null });
    expect(state.pendingActorId).toBe("p3");
    expect(state.mode).toBe("choose");

    // turn 4: p3 opens the last gift -> rotation complete (rule 6)
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g3" }));
    expect(state.phase).toBe("done");
    expect(state.pendingActorId).toBeNull();
    expect(state.poolIds).toEqual([]);
    expect(holders(state)).toEqual({ g1: "p2", g2: "p1", g3: "p3" });
    expect(log).toHaveLength(4);
    expect(log.map((e) => e.type)).toEqual(["pick", "steal", "repick", "pick"]);

    // nothing may happen after the last turn
    expect(decideAction(state, { type: "pick", giftId: "g1" })).toEqual({
      ok: false,
      reason: "finished",
    });
  });

  it("keeps the turn order exactly as configured", () => {
    const order = ["p3", "p1", "p2"];
    const shuffled = config({ turnOrder: order });
    let log: WeActionRow[] = [];
    let state = foldState(shuffled, log);
    expect(state.pendingActorId).toBe("p3");
    ({ state, log } = apply(shuffled, log, { type: "pick", giftId: "g3" }));
    expect(state.pendingActorId).toBe("p1");
    ({ state, log } = apply(shuffled, log, { type: "pick", giftId: "g1" }));
    expect(state.pendingActorId).toBe("p2");
    ({ state, log } = apply(shuffled, log, { type: "pick", giftId: "g2" }));
    expect(state.phase).toBe("done");
  });
});

// ---------- steal limit ----------

describe("white elephant: steal limit locks a gift", () => {
  it("locks a gift once the limit is reached and refuses further steals", () => {
    const cfg = config({ stealLimit: 1 });
    let log: WeActionRow[] = [];
    let state = foldState(cfg, log);

    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    ({ state, log } = apply(cfg, log, { type: "steal", giftId: "g1" }));

    const g1 = state.gifts.find((g) => g.id === "g1")!;
    expect(g1.stolenCount).toBe(1);
    expect(g1.locked).toBe(true);

    // victim re-opens, then the next player tries to steal the locked gift
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g2" }));
    expect(state.pendingActorId).toBe("p3");
    expect(decideAction(state, { type: "steal", giftId: "g1" })).toEqual({
      ok: false,
      reason: "gift_locked",
    });
    // ...but an unlocked gift can still be stolen
    const stealOther = decideAction(state, { type: "steal", giftId: "g2" });
    expect(stealOther.ok).toBe(true);
  });

  it("treats a limit of 0 as 'no stealing at all'", () => {
    const cfg = config({ stealLimit: 0 });
    let log: WeActionRow[] = [];
    let state = foldState(cfg, log);
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    expect(state.gifts.find((g) => g.id === "g1")!.locked).toBe(true);
    expect(decideAction(state, { type: "steal", giftId: "g1" })).toEqual({
      ok: false,
      reason: "gift_locked",
    });
  });
});

// ---------- undo ----------

describe("white elephant: undo the last step", () => {
  it("restores holders and the pending player from before the steal", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    let state = foldState(cfg, log);
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    ({ state, log } = apply(cfg, log, { type: "steal", giftId: "g1" }));
    const afterSteal = state;

    // undo = drop the last event and replay
    const undone = foldState(cfg, log.slice(0, -1));
    expect(holders(undone)).toEqual({ g1: "p1", g2: null, g3: null });
    expect(undone.pendingActorId).toBe("p2");
    expect(undone.mode).toBe("choose");
    expect(undone.turnIndex).toBe(1);
    expect(undone.gifts.find((g) => g.id === "g1")!.stolenCount).toBe(0);
    expect(undone.eventCount).toBe(1);

    // the steal can then be redone differently (p2 opens instead)
    const alternative = apply(cfg, log.slice(0, -1), { type: "pick", giftId: "g2" });
    expect(holders(alternative.state)).toEqual({ g1: "p1", g2: "p2", g3: null });
    expect(afterSteal.pendingActorId).toBe("p1");
  });

  it("undoes back to the lobby when the only event is removed", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    const first = apply(cfg, log, { type: "pick", giftId: "g1" });
    log = first.log;
    const empty = foldState(cfg, []);
    expect(empty.pendingActorId).toBe("p1");
    expect(empty.gifts.every((g) => g.holderId === null)).toBe(true);
    expect(empty.eventCount).toBe(0);
  });

  it("makes a finished game playable again after undo", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g2" }));
    const finished = apply(cfg, log, { type: "pick", giftId: "g3" });
    expect(finished.state.phase).toBe("done");
    expect(finished.log).toHaveLength(3);

    const back = foldState(cfg, finished.log.slice(0, -1));
    expect(back.phase).toBe("playing");
    expect(back.pendingActorId).toBe("p3");
  });
});

// ---------- persistence: reload is a fold ----------

describe("white elephant: progress survives a reload", () => {
  it("recomputes the identical board from the stored log", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    ({ log } = apply(cfg, log, { type: "steal", giftId: "g1" }));
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g2" }));
    const live = foldState(cfg, log);

    // what the database round-trip looks like: jsonb in, jsonb out
    const persisted = JSON.parse(JSON.stringify(log)) as WeActionRow[];
    expect(foldState(cfg, persisted)).toEqual(live);

    // replaying a prefix must equal the earlier snapshot too
    const afterSecond = foldState(cfg, log.slice(0, 2));
    expect(afterSecond.pendingActorId).toBe("p1");
    expect(afterSecond.mode).toBe("pick_only");
    expect(afterSecond.lastEvent?.type).toBe("steal");
  });

  it("is insensitive to the order rows come back in", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    ({ log } = apply(cfg, log, { type: "pick", giftId: "g2" }));
    const shuffled = [log[1], log[0]];
    expect(foldState(cfg, shuffled)).toEqual(foldState(cfg, log));
  });
});

// ---------- edge cases ----------

describe("white elephant: edge cases", () => {
  it("handles a single participant", () => {
    const solo = config({ turnOrder: ["p1"], gifts: [{ id: "g1", label: "Only box" }] });
    const lobby = foldState({ ...solo, started: false }, []);
    expect(lobby.phase).toBe("lobby");
    expect(decideAction(lobby, { type: "pick", giftId: "g1" })).toEqual({
      ok: false,
      reason: "not_started",
    });

    const start = foldState(solo, []);
    expect(start.pendingActorId).toBe("p1");
    expect(decideAction(start, { type: "steal", giftId: "g1" })).toEqual({
      ok: false,
      reason: "first_player_must_pick",
    });

    const done = apply(solo, [], { type: "pick", giftId: "g1" }).state;
    expect(done.phase).toBe("done");
    expect(holders(done)).toEqual({ g1: "p1" });
    expect(done.pendingActorId).toBeNull();
  });

  it("stops a rotation player from stealing a gift that is still wrapped", () => {
    const cfg = config();
    let log: WeActionRow[] = [];
    let state = foldState(cfg, log);
    ({ state, log } = apply(cfg, log, { type: "pick", giftId: "g1" }));
    expect(decideAction(state, { type: "steal", giftId: "g3" })).toEqual({
      ok: false,
      reason: "gift_not_held",
    });
    expect(decideAction(state, { type: "pick", giftId: "g1" })).toEqual({
      ok: false,
      reason: "gift_not_in_pool",
    });
  });

  it("refuses a start when the gifts or the order do not cover the group", () => {
    expect(validateStart(config(), ["p1", "p2", "p3"])).toBeNull();
    expect(validateStart(config({ gifts: [{ id: "g1", label: "a" }] }), ["p1", "p2", "p3"])).toContain(
      "Every participant needs a gift"
    );
    expect(validateStart(config({ turnOrder: ["p1", "p2"] }), ["p1", "p2", "p3"])).toContain(
      "exactly once"
    );
    expect(validateStart(config({ turnOrder: ["p1", "p1", "p2"] }), ["p1", "p2"])).toContain(
      "duplicates"
    );
  });

  it("describes the pending action for the board", () => {
    expect(describeTurn(foldState({ ...config(), started: false }, []))).toContain("Draw order");
    expect(describeTurn(foldState(config(), []))).toContain("First player");
  });
});
