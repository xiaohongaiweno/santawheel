/**
 * Idempotency key validation for exchange creation.
 *
 * The browser generates one random key per form session; the API rejects
 * anything that does not look like one (so a client cannot smuggle arbitrary
 * length or characters into the unique index).
 */

export const REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function normalizeRequestId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (!REQUEST_ID_RE.test(value)) {
    throw new Error("requestId must be 8–64 characters of letters, digits, - or _");
  }
  return value;
}
