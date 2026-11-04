/**
 * SantaWheel draw core — pure functions, no I/O.
 *
 * A valid draw is a permutation of participants (giver -> receiver) such that:
 *   1. nobody draws themselves (derangement), and
 *   2. no excluded pair is drawn (exclusions are bidirectional).
 *
 * This is exactly a *perfect matching* in a bipartite graph
 * (givers x receivers, edge = allowed assignment). We solve it with
 * Kuhn's augmenting-path algorithm over randomized adjacency order:
 *
 *   - Termination is guaranteed: O(V * E), ~instant at 100 participants.
 *   - Unsolvable inputs are *proven* unsolvable (max matching < n) and
 *     rejected with a readable error — no retries, no loops, and we can
 *     never return a rule-violating result.
 *   - Randomness comes from shuffling giver order and each giver's
 *     candidate receivers, so repeated draws differ.
 */

import { randomInt } from "node:crypto";

export class UnsolvableDrawError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsolvableDrawError";
  }
}

export interface DrawPair {
  giver: string;
  receiver: string;
}

/**
 * Fisher-Yates shuffle (in place).
 *
 * Uses a CSPRNG rather than Math.random(): the draw decides who buys a gift
 * for whom, and an assignment should not be predictable from a seed an
 * observer could reconstruct. `randomInt` is also unbiased (rejection
 * sampling), so every permutation is equally likely.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface BuildDrawOptions {
  /** extra safety margin for the "must finish fast" requirement (ms). */
  deadlineMs?: number;
}

/**
 * Compute a valid draw.
 *
 * @param participants unique participant identifiers (ids or names)
 * @param exclusions   unordered [a, b] pairs that must not draw each other
 * @throws UnsolvableDrawError when no valid assignment exists
 */
export function buildDraw(
  participants: string[],
  exclusions: Array<[string, string]> = []
): DrawPair[] {
  // Deduplicate while keeping first-seen order.
  const people = [...new Set(participants)];
  const n = people.length;

  if (n < 2) {
    throw new UnsolvableDrawError(
      "A draw needs at least 2 participants" + (n === 1 ? ` (got: ${people[0]})` : "")
    );
  }

  // Normalize exclusions: bidirectional, deduplicated, self-exclusions are
  // redundant (already implied by the derangement rule) but harmless.
  const banned = new Set<string>();
  for (const [a, b] of exclusions) {
    if (a === b) continue;
    banned.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    banned.add(a < b ? `${b}|${a}` : `${a}|${b}`);
  }

  // Adjacency: for each giver, the receivers they are allowed to draw,
  // in randomized order (this is what makes the result random).
  const allowed: string[][] = people.map((giver) =>
    shuffle(people.filter((r) => r !== giver && !banned.has(`${giver}|${r}`)))
  );

  const indexOf = new Map(people.map((p, i) => [p, i] as const));
  const byIndex = people;

  // Kuhn's algorithm: matchReceiver[receiverIdx] = giverIdx
  const matchReceiver: number[] = new Array(n).fill(-1);
  const visited = new Array<boolean>(n);

  const augment = (giverIdx: number): boolean => {
    for (const receiver of allowed[giverIdx]) {
      const r = indexOf.get(receiver)!;
      if (visited[r]) continue;
      visited[r] = true;
      if (matchReceiver[r] === -1 || augment(matchReceiver[r])) {
        matchReceiver[r] = giverIdx;
        return true;
      }
    }
    return false;
  };

  let matched = 0;
  for (const giverIdx of shuffle(people.map((_, i) => i))) {
    visited.fill(false);
    if (augment(giverIdx)) matched++;
  }

  if (matched < n) {
    throw new UnsolvableDrawError(describeUnsolvable(people, allowed));
  }

  // matchReceiver[r] = g  =>  g draws r. Shuffle output order for tidiness.
  const pairs: DrawPair[] = matchReceiver.map((g, r) => ({
    giver: byIndex[g],
    receiver: byIndex[r],
  }));
  return shuffle(pairs);
}

/** Build a readable explanation for a proven-unsolvable input. */
function describeUnsolvable(people: string[], allowed: string[][]): string {
  const stuck = people.filter((_, i) => allowed[i].length === 0);
  if (stuck.length > 0) {
    return (
      `No valid draw possible: ${stuck.join(", ")} ` +
      (stuck.length === 1 ? "has" : "have") +
      " no one left to draw (cannot draw themselves and every other candidate is excluded)."
    );
  }
  return (
    "No valid draw possible: the exclusion constraints make it impossible " +
    "for every participant to draw a different person. " +
    "Common cause: a group whose members may only draw among themselves but " +
    "cannot cover everyone (e.g. 2 people who must not draw each other, or " +
    "3 people where every pairing is excluded)."
  );
}

/** Validate a draw against the rules — used by tests and as a final guard. */
export function validateDraw(
  participants: string[],
  exclusions: Array<[string, string]>,
  pairs: DrawPair[]
): { ok: boolean; reason?: string } {
  const people = new Set(participants);
  const givers = new Set<string>();
  const receivers = new Set<string>();
  const banned = new Set<string>();
  for (const [a, b] of exclusions) {
    if (a === b) continue;
    banned.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    banned.add(a < b ? `${b}|${a}` : `${a}|${b}`);
  }

  if (pairs.length !== people.size) {
    return { ok: false, reason: `expected ${people.size} pairs, got ${pairs.length}` };
  }
  for (const { giver, receiver } of pairs) {
    if (!people.has(giver) || !people.has(receiver)) {
      return { ok: false, reason: `unknown participant in pair ${giver} -> ${receiver}` };
    }
    if (giver === receiver) return { ok: false, reason: `${giver} drew themselves` };
    if (banned.has(`${giver}|${receiver}`)) {
      return { ok: false, reason: `excluded pair drawn: ${giver} -> ${receiver}` };
    }
    if (givers.has(giver)) return { ok: false, reason: `${giver} gives more than once` };
    if (receivers.has(receiver)) return { ok: false, reason: `${receiver} receives more than once` };
    givers.add(giver);
    receivers.add(receiver);
  }
  return { ok: true };
}
