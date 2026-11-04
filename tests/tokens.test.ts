import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken } from "@/lib/tokens";

beforeAll(() => {
  process.env.APP_TOKEN_SECRET = "test-secret-for-vitest";
});

describe("signed tokens", () => {
  it("round-trips an assignment token", () => {
    const token = signToken({ t: "a", x: "ex-1", p: "p-1", g: 3 });
    const parsed = verifyToken(token);
    expect(parsed).toEqual({ t: "a", x: "ex-1", p: "p-1", g: 3 });
  });

  it("round-trips organizer and removal tokens", () => {
    expect(verifyToken(signToken({ t: "o", x: "ex-2" }))).toEqual({ t: "o", x: "ex-2" });
    expect(verifyToken(signToken({ t: "r", x: "ex-2", p: "p-9" }))).toEqual({
      t: "r",
      x: "ex-2",
      p: "p-9",
    });
  });

  it("rejects tampered signatures and bodies", () => {
    const token = signToken({ t: "a", x: "ex-1", p: "p-1", g: 1 });
    const [body, sig] = token.split(".");

    expect(verifyToken(`${body}.${sig.slice(0, -2)}xx`)).toBeNull();
    // swap the payload, keep the signature
    const forgedBody = Buffer.from(
      JSON.stringify({ t: "a", x: "ex-1", p: "p-2", g: 1 })
    ).toString("base64url");
    expect(verifyToken(`${forgedBody}.${sig}`)).toBeNull();
    expect(verifyToken("garbage")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });

  it("does not accept a token signed with a different secret", async () => {
    const token = signToken({ t: "o", x: "ex-1" });
    process.env.APP_TOKEN_SECRET = "another-secret";
    expect(verifyToken(token)).toBeNull();
    process.env.APP_TOKEN_SECRET = "test-secret-for-vitest";
  });
});
