import { describe, it, expect } from "vitest";
import { buildDraw, validateDraw, UnsolvableDrawError } from "@/lib/draw/derangement";
import {
  normalizeParticipants,
  participantKey,
  MAX_PARTICIPANTS,
  type IncomingParticipant,
} from "@/lib/draw/participants";
import { normalizeRequestId } from "@/lib/draw/request-id";

/** Draw and assert the result satisfies every rule. */
function drawAndCheck(people: string[], exclusions: Array<[string, string]> = []) {
  const pairs = buildDraw(people, exclusions);
  const check = validateDraw(people, exclusions, pairs);
  if (!check.ok) throw new Error(`invalid draw: ${check.reason}`);
  expect(pairs).toHaveLength(new Set(people).size);
  return pairs;
}

function person(i: number): IncomingParticipant {
  return { name: `Person ${i}`, email: `person${i}@example.com` };
}

describe("draw sizes", () => {
  for (const n of [2, 3, 4, 5, 10, 50, 100]) {
    it(`${n} participants: one valid draw per run`, () => {
      const people = Array.from({ length: n }, (_, i) => `p${i}`);
      for (let round = 0; round < (n >= 50 ? 5 : 30); round++) {
        drawAndCheck(people);
      }
    });
  }

  it("each giver gives once and each receiver receives once", () => {
    const people = Array.from({ length: 12 }, (_, i) => `p${i}`);
    const pairs = drawAndCheck(people);
    expect(new Set(pairs.map((p) => p.giver)).size).toBe(12);
    expect(new Set(pairs.map((p) => p.receiver)).size).toBe(12);
    expect(pairs.some((p) => p.giver === p.receiver)).toBe(false);
  });
});

describe("exclusion rules", () => {
  it("couples never draw each other, in either direction", () => {
    const people = ["A", "B", "C", "D", "E", "F"];
    const couples: Array<[string, string]> = [
      ["A", "B"],
      ["C", "D"],
      ["E", "F"],
    ];
    for (let round = 0; round < 100; round++) {
      const pairs = drawAndCheck(people, couples);
      for (const { giver, receiver } of pairs) {
        const banned = couples.some(
          ([x, y]) => (x === giver && y === receiver) || (x === receiver && y === giver)
        );
        expect(banned).toBe(false);
      }
    }
  });

  it("multiple exclusion groups are all honoured at once", () => {
    const people = Array.from({ length: 8 }, (_, i) => `p${i}`);
    const exclusions: Array<[string, string]> = [
      ["p0", "p1"],
      ["p2", "p3"],
      ["p4", "p5"],
      ["p0", "p2"],
      ["p1", "p7"],
    ];
    for (let round = 0; round < 50; round++) {
      drawAndCheck(people, exclusions);
    }
  });

  it("a 100-person draw with 30 exclusions stays valid and fast", () => {
    const people = Array.from({ length: 100 }, (_, i) => `p${String(i).padStart(3, "0")}`);
    const exclusions: Array<[string, string]> = [];
    for (let i = 0; i < 15; i++) exclusions.push([people[2 * i], people[2 * i + 1]]);
    for (let i = 0; i < 15; i++) exclusions.push([people[i], people[i + 60]]);

    const started = performance.now();
    for (let round = 0; round < 5; round++) drawAndCheck(people, exclusions);
    expect(performance.now() - started).toBeLessThan(3000);
  });

  it("treats exclusions as symmetric even when given one way round", () => {
    const people = ["A", "B", "C", "D"];
    const pairs = drawAndCheck(people, [["B", "A"]]);
    const seen = pairs.map((p) => `${p.giver}->${p.receiver}`);
    expect(seen).not.toContain("A->B");
    expect(seen).not.toContain("B->A");
  });
});

describe("unsolvable input is reported, never silently broken", () => {
  it("2 people who are excluded from each other", () => {
    expect(() => buildDraw(["A", "B"], [["A", "B"]])).toThrow(UnsolvableDrawError);
  });

  it("one person excluded from everyone else has nowhere to go", () => {
    expect(() =>
      buildDraw(["A", "B", "C", "D"], [
        ["A", "B"],
        ["A", "C"],
        ["A", "D"],
      ])
    ).toThrow(UnsolvableDrawError);
  });

  it("everyone excludes everyone else", () => {
    const people = ["A", "B", "C", "D"];
    const exclusions: Array<[string, string]> = [];
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) exclusions.push([people[i], people[j]]);
    }
    const err = (() => {
      try {
        buildDraw(people, exclusions);
        return null;
      } catch (e) {
        return e as Error;
      }
    })();
    expect(err).toBeInstanceOf(UnsolvableDrawError);
    expect(err!.message).toMatch(/No valid draw possible/i);
    expect(err!.message).toMatch(/A|B|C|D/);
  });

  it("one participant is not enough", () => {
    expect(() => buildDraw(["Solo"])).toThrow(UnsolvableDrawError);
    expect(() => buildDraw([])).toThrow(UnsolvableDrawError);
  });
});

describe("participant validation", () => {
  it("accepts duplicate names when the emails differ", () => {
    const list = normalizeParticipants([
      { name: "Alex", email: "alex@one.com" },
      { name: "Alex", email: "alex@two.com" },
    ]);
    expect(list).toHaveLength(2);
    // identity keys differ, so the draw can tell them apart
    expect(new Set(list.map(participantKey)).size).toBe(2);
  });

  it("rejects an empty name", () => {
    expect(() => normalizeParticipants([{ name: "   ", email: "a@b.com" }])).toThrow(/needs a name/i);
  });

  it("rejects duplicate emails", () => {
    expect(() =>
      normalizeParticipants([
        { name: "A", email: "same@example.com" },
        { name: "B", email: "SAME@example.com" },
      ])
    ).toThrow(/Duplicate participant email/i);
  });

  it("rejects malformed emails", () => {
    for (const email of ["not-an-email", "a@b", "a b@c.com", "@example.com"]) {
      expect(() => normalizeParticipants([{ name: "A", email }])).toThrow(/Invalid email/i);
    }
  });

  it("treats a blank email as missing in email mode", () => {
    expect(() => normalizeParticipants([{ name: "A", email: "" }])).toThrow(
      /needs an email address/i
    );
  });

  it("enforces the 2..100 range", () => {
    expect(() => normalizeParticipants([person(1)])).toThrow(/At least 2/i);
    expect(() => normalizeParticipants(Array.from({ length: MAX_PARTICIPANTS + 1 }, (_, i) => person(i))))
      .toThrow(/Up to 100/i);
    expect(normalizeParticipants(Array.from({ length: MAX_PARTICIPANTS }, (_, i) => person(i))))
      .toHaveLength(MAX_PARTICIPANTS);
  });

  it("trims and lowercases input before storing", () => {
    const [p] = normalizeParticipants([
      { name: "  Alice  ", email: "  ALICE@Example.COM " },
      { name: "Bob", email: "bob@example.com" },
    ]);
    expect(p.name).toBe("Alice");
    expect(p.email).toBe("alice@example.com");
  });
});

describe("idempotency key", () => {
  it("accepts browser-style keys", () => {
    expect(normalizeRequestId("9f2c1d7ab34e4c0e8b1a2d3f4e5a6b7c")).toHaveLength(32);
    expect(normalizeRequestId("abc-DEF_123456")).toBe("abc-DEF_123456");
  });

  it("treats missing keys as absent", () => {
    expect(normalizeRequestId(undefined)).toBeNull();
    expect(normalizeRequestId("   ")).toBeNull();
  });

  it("rejects keys that could break the unique index", () => {
    expect(() => normalizeRequestId("short")).toThrow(/requestId/);
    expect(() => normalizeRequestId("has space inside")).toThrow(/requestId/);
    expect(() => normalizeRequestId("x".repeat(65))).toThrow(/requestId/);
  });
});

describe("simulation: many random draws, all legal", () => {
  it("300 runs over 14 people with 3 couples stay valid and vary", () => {
    const people = Array.from({ length: 14 }, (_, i) => `p${i}`);
    const exclusions: Array<[string, string]> = [
      ["p0", "p1"],
      ["p2", "p3"],
      ["p4", "p5"],
    ];
    const receiversForP6 = new Set<string>();
    for (let round = 0; round < 300; round++) {
      const pairs = drawAndCheck(people, exclusions);
      const p6 = pairs.find((p) => p.giver === "p6");
      expect(p6).toBeDefined();
      receiversForP6.add(p6!.receiver);
    }
    // randomness: one giver must not always draw the same person
    expect(receiversForP6.size).toBeGreaterThan(3);
  });
});
