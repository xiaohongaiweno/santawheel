import { describe, it, expect } from "vitest";
import { parseParticipantImport, parseExclusionLines } from "@/lib/import-parser";

describe("parseParticipantImport", () => {
  it("parses CSV rows with name, email and optional wishlist", () => {
    const result = parseParticipantImport(
      "Alice,alice@example.com\nBob,bob@example.com,https://example.com/bob"
    );
    expect(result.participants).toEqual([
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com", wishlistUrl: "https://example.com/bob" },
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it("parses Excel tab-pasted rows and skips the header", () => {
    const result = parseParticipantImport(
      "Name\tEmail\tWishlist\nAlice\talice@example.com\nBob\tbob@example.com"
    );
    expect(result.participants).toHaveLength(2);
    expect(result.participants[0]).toMatchObject({ name: "Alice", email: "alice@example.com" });
  });

  it("accepts email-only lines and Name <email> format", () => {
    const result = parseParticipantImport(
      "alice@example.com\nBob <bob@example.com>"
    );
    expect(result.participants).toEqual([
      { name: "alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ]);
  });

  it("reports invalid rows without failing the import", () => {
    const result = parseParticipantImport(
      "Alice,alice@example.com\nnot-an-email\nBob,bob@example.com"
    );
    expect(result.participants).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Line 2");
  });

  it("deduplicates by email", () => {
    const result = parseParticipantImport(
      "Alice,alice@example.com\nAlice Two,alice@example.com"
    );
    expect(result.participants).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
});

describe("parseExclusionLines", () => {
  const participants = parseParticipantImport(
    "Alice <alice@example.com>\nBob <bob@example.com>\nCarol <carol@example.com>"
  ).participants;

  it("matches names case-insensitively with dash or comma separators", () => {
    const r = parseExclusionLines("alice - BOB\ncarol, bob", participants);
    expect(r.pairs).toEqual([
      ["alice@example.com", "bob@example.com"],
      ["carol@example.com", "bob@example.com"],
    ]);
    expect(r.errors).toHaveLength(0);
  });

  it("matches by email too and dedups bidirectionally", () => {
    const r = parseExclusionLines(
      "alice@example.com - bob@example.com\nbob - alice",
      participants
    );
    expect(r.pairs).toEqual([["alice@example.com", "bob@example.com"]]);
  });

  it("reports unknown names with a readable error", () => {
    const r = parseExclusionLines("Alice - Zed", participants);
    expect(r.pairs).toHaveLength(0);
    expect(r.errors[0]).toContain("Zed");
  });

  it("flags malformed lines and ignores self-pairs", () => {
    const r = parseExclusionLines("justoneword\nAlice - alice", participants);
    expect(r.pairs).toHaveLength(0);
    expect(r.errors[0]).toContain("one pair per line");
  });
});
