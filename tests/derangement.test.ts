import { describe, it, expect } from "vitest";
import { buildDraw, validateDraw, UnsolvableDrawError } from "@/lib/draw/derangement";

function expectValidDraw(participants: string[], exclusions: Array<[string, string]>) {
  const pairs = buildDraw(participants, exclusions);
  const check = validateDraw(participants, exclusions, pairs);
  if (!check.ok) throw new Error(`invalid draw: ${check.reason}`);
  return pairs;
}

describe("buildDraw", () => {
  it("normal 10 people: valid derangement, everyone gives and receives exactly once", () => {
    const people = Array.from({ length: 10 }, (_, i) => `P${i}`);
    for (let round = 0; round < 25; round++) {
      const pairs = expectValidDraw(people, []);
      expect(pairs).toHaveLength(10);
      // no fixed points
      for (const { giver, receiver } of pairs) expect(giver).not.toBe(receiver);
      // and it is random-ish: 25 rounds should not all be identical
    }
    const seen = new Set(
      Array.from({ length: 10 }, () => expectValidDraw(people, []).map((p) => p.receiver).join(","))
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it("couples must not draw each other (bidirectional exclusions)", () => {
    const people = [
      "Alice", "Bob", "Carol", "Dave", "Eve",
      "Frank", "Grace", "Heidi", "Ivan", "Judy",
    ];
    const exclusions: Array<[string, string]> = [
      ["Alice", "Bob"], // couple 1
      ["Carol", "Dave"], // couple 2
      ["Eve", "Frank"], // couple 3
    ];
    for (let round = 0; round < 25; round++) {
      expectValidDraw(people, exclusions);
    }
  });

  it("2 people + 1 exclusion: unsolvable, throws a readable error", () => {
    const err = (() => {
      try {
        buildDraw(["Alice", "Bob"], [["Alice", "Bob"]]);
        return null;
      } catch (e) {
        return e as UnsolvableDrawError;
      }
    })();
    expect(err).toBeInstanceOf(UnsolvableDrawError);
    expect(err!.message).toMatch(/No valid draw possible/i);
    expect(err!.message).toContain("Alice");
    expect(err!.message).toContain("Bob");
  });

  it("3 people with every pairing excluded: unsolvable", () => {
    const people = ["A", "B", "C"];
    const exclusions: Array<[string, string]> = [
      ["A", "B"],
      ["A", "C"],
      ["B", "C"],
    ];
    expect(() => buildDraw(people, exclusions)).toThrow(UnsolvableDrawError);
  });

  it("100 people + 20 exclusion constraints: valid result in under 2 seconds", () => {
    const people = Array.from({ length: 100 }, (_, i) => `p${String(i).padStart(3, "0")}`);
    // 20 exclusion constraints: 10 "couples" + 10 random non-adjacent pairs
    const exclusions: Array<[string, string]> = [];
    for (let i = 0; i < 10; i++) exclusions.push([people[2 * i], people[2 * i + 1]]);
    for (let i = 0; i < 10; i++) exclusions.push([people[i], people[i + 50]]);

    const start = performance.now();
    const pairs = expectValidDraw(people, exclusions);
    const elapsed = performance.now() - start;

    expect(pairs).toHaveLength(100);
    expect(elapsed).toBeLessThan(2000);
  });

  it("exclusions are bidirectional: [a,b] also bans b->a", () => {
    // Alice and Bob excluded: build a 4-person draw many times and
    // verify neither direction ever appears.
    const people = ["Alice", "Bob", "Carol", "Dave"];
    for (let round = 0; round < 100; round++) {
      const pairs = expectValidDraw(people, [["Alice", "Bob"]]);
      for (const { giver, receiver } of pairs) {
        expect(`${giver}->${receiver}`).not.toMatch(/^Alice->Bob$|^Bob->Alice$/);
      }
    }
  });

  it("rejects fewer than 2 participants", () => {
    expect(() => buildDraw(["Alice"])).toThrow(UnsolvableDrawError);
    expect(() => buildDraw([])).toThrow(UnsolvableDrawError);
  });
});
