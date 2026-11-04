import { describe, it, expect } from "vitest";
import { exchangePolicy, isValidModeCombination } from "@/lib/exchange-visibility";
import { normalizeParticipants, participantKey } from "@/lib/draw/participants";
import { parseNameList, parseExclusionLines } from "@/lib/import-parser";

describe("exchangePolicy", () => {
  it("treats a draw with no mode columns as a normal email draw", () => {
    const p = exchangePolicy({});
    expect(p.deliveryMode).toBe("email");
    expect(p.blind).toBe(false);
    expect(p.showPairings).toBe(true);
    expect(p.canExportPairs).toBe(true);
    expect(p.sendsEmail).toBe(true);
    expect(p.showsPrivateLinks).toBe(false);
  });

  it("keeps pairings visible and emails on for a private-link draw", () => {
    const p = exchangePolicy({ delivery_mode: "link" });
    expect(p.deliveryMode).toBe("link");
    expect(p.showPairings).toBe(true);
    expect(p.canExportPairs).toBe(true);
    expect(p.sendsEmail).toBe(false);
    expect(p.canResendEmail).toBe(false);
    expect(p.showsPrivateLinks).toBe(true);
  });

  it("hides and blocks pairings in blind mode", () => {
    const p = exchangePolicy({ delivery_mode: "email", blind_mode: true });
    expect(p.blind).toBe(true);
    expect(p.showPairings).toBe(false);
    expect(p.canExportPairs).toBe(false);
    expect(p.sendsEmail).toBe(true);
  });

  it("only allows blind mode together with email delivery", () => {
    expect(isValidModeCombination("email", true)).toBe(true);
    expect(isValidModeCombination("link", true)).toBe(false);
    expect(isValidModeCombination("link", false)).toBe(true);
    expect(isValidModeCombination("email", false)).toBe(true);
  });
});

describe("normalizeParticipants (private-link mode)", () => {
  it("accepts names without emails", () => {
    const list = normalizeParticipants([{ name: "Alice" }, { name: "Bob" }], {
      requireEmail: false,
    });
    expect(list.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(list.every((p) => p.email === undefined)).toBe(true);
  });

  it("drops any email supplied in link mode — nothing is emailed", () => {
    const list = normalizeParticipants(
      [
        { name: "Alice", email: "alice@example.com" },
        { name: "Bob", email: "bob@example.com" },
      ],
      { requireEmail: false }
    );
    expect(list.map((p) => p.email)).toEqual([undefined, undefined]);
  });

  it("rejects a duplicate name in link mode even when emails differ", () => {
    expect(() =>
      normalizeParticipants(
        [
          { name: "Alex", email: "alex1@example.com" },
          { name: "Alex", email: "alex2@example.com" },
        ],
        { requireEmail: false }
      )
    ).toThrow(/Two participants are called/i);
  });

  it("rejects two participants with the same name when there is no email", () => {
    expect(() =>
      normalizeParticipants([{ name: "Alex" }, { name: "alex " }], { requireEmail: false })
    ).toThrow(/Two participants are called/i);
  });

  it("still allows duplicate names when emails differ", () => {
    const list = normalizeParticipants(
      [
        { name: "Alex", email: "alex1@example.com" },
        { name: "Alex", email: "alex2@example.com" },
      ],
      { requireEmail: true }
    );
    expect(list).toHaveLength(2);
  });

  it("requires an email in email mode", () => {
    expect(() =>
      normalizeParticipants([{ name: "Alice" }, { name: "Bob" }], { requireEmail: true })
    ).toThrow(/needs an email address/i);
  });

  it("enforces the participant bounds either way", () => {
    expect(() => normalizeParticipants([{ name: "Solo" }], { requireEmail: false })).toThrow(
      /At least 2/i
    );
    const tooMany = Array.from({ length: 101 }, (_, i) => ({ name: `P${i}` }));
    expect(() => normalizeParticipants(tooMany, { requireEmail: false })).toThrow(/Up to 100/i);
  });
});

describe("participantKey", () => {
  it("keeps two same-named link-mode participants distinct via their id", () => {
    const a = participantKey({ name: "Alex", email: null, id: "id-1" });
    const b = participantKey({ name: "Alex", email: null, id: "id-2" });
    expect(a).not.toBe(b);
  });

  it("prefers the email when there is one", () => {
    expect(participantKey({ name: "Alice", email: "a@example.com", id: "id-1" })).toBe(
      "Alice <a@example.com>"
    );
  });
});

describe("parseNameList", () => {
  it("reads one name per line", () => {
    const { names, errors } = parseNameList("Alice\nBob\nCarol");
    expect(names).toEqual(["Alice", "Bob", "Carol"]);
    expect(errors).toHaveLength(0);
  });

  it("strips emails that were pasted along with the names", () => {
    const { names, errors } = parseNameList(
      "Alice <alice@example.com>\nBob, bob@example.com"
    );
    expect(names).toEqual(["Alice", "Bob"]);
    expect(errors).toHaveLength(0);
  });

  it("reports a duplicate name instead of silently merging two people", () => {
    const { names, errors } = parseNameList("Alice\nBob\nAlice");
    expect(names).toEqual(["Alice", "Bob"]);
    expect(errors[0]).toMatch(/Two participants are called "Alice"/i);
  });
});

describe("parseExclusionLines with names only", () => {
  it("resolves pairs by name when there are no emails", () => {
    const participants = [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }];
    const { pairs, errors } = parseExclusionLines("Alice - Bob", participants);
    expect(pairs).toEqual([["alice", "bob"]]);
    expect(errors).toHaveLength(0);
  });

  it("still resolves by email when emails exist", () => {
    const participants = [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ];
    const { pairs } = parseExclusionLines("alice@example.com, bob@example.com", participants);
    expect(pairs).toEqual([["alice@example.com", "bob@example.com"]]);
  });

  it("flags an unknown name", () => {
    const { pairs, errors } = parseExclusionLines("Alice - Zoe", [{ name: "Alice" }, { name: "Bob" }]);
    expect(pairs).toHaveLength(0);
    expect(errors[0]).toMatch(/unknown participant/i);
  });
});
