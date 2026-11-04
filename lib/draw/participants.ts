/**
 * Participant input normalisation — pure functions, no I/O.
 *
 * Kept separate from the Supabase layer so the exact rules the API enforces
 * (email format, dedupe, size limits) can be unit-tested without a database.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 100;
/** Upper bound for a name; keeps DB rows and emails sane. */
export const MAX_NAME_LENGTH = 80;

export interface IncomingParticipant {
  name: string;
  /** Absent in private-link mode, where participants never give an email. */
  email?: string;
  note?: string;
  wishlistUrl?: string;
}

/**
 * Validate and normalise a participant list.
 *
 * - names are trimmed and required
 * - emails are trimmed, lowercased and format-checked
 * - duplicate emails are rejected (they would make delivery ambiguous)
 * - duplicate *names* are allowed in email mode — identity is the email —
 *   but rejected in link mode, where the name is all we have to tell two
 *   people apart
 *
 * Throws a readable Error (the API maps these to 400) when the input is
 * unusable. Never silently drops a participant.
 */
export function normalizeParticipants(
  participants: IncomingParticipant[] | undefined,
  opts: { requireEmail?: boolean } = {}
): IncomingParticipant[] {
  const requireEmail = opts.requireEmail !== false;
  if (!Array.isArray(participants)) throw new Error("participants must be an array");

  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const list: IncomingParticipant[] = [];

  for (const p of participants) {
    const name = (p?.name ?? "").trim();
    const rawEmail = (p?.email ?? "").toLowerCase().trim();
    if (!name) throw new Error("Every participant needs a name");
    if (name.length > MAX_NAME_LENGTH) {
      throw new Error(`Participant names must be ${MAX_NAME_LENGTH} characters or fewer`);
    }

    // Link mode never keeps an address: nothing is emailed, so holding one
    // would be data we do not need and could not honour.
    const email = requireEmail ? rawEmail : "";

    if (email) {
      if (!EMAIL_RE.test(email)) throw new Error(`Invalid email for participant "${name}"`);
      if (seenEmails.has(email)) throw new Error(`Duplicate participant email: ${email}`);
      seenEmails.add(email);
    } else if (requireEmail) {
      throw new Error(`Participant "${name}" needs an email address`);
    }

    if (!email) {
      // Link mode: the name is the only identifier, so it must be unique.
      const key = name.toLowerCase();
      if (seenNames.has(key)) {
        throw new Error(
          `Two participants are called "${name}" — add a last name or initial so their links stay separate`
        );
      }
      seenNames.add(key);
    }

    list.push({
      name,
      email: email || undefined,
      note: p.note?.trim() || undefined,
      wishlistUrl: p.wishlistUrl?.trim() || undefined,
    });
  }

  if (list.length < MIN_PARTICIPANTS) {
    throw new Error(`At least ${MIN_PARTICIPANTS} participants are required`);
  }
  if (list.length > MAX_PARTICIPANTS) {
    throw new Error(`Up to ${MAX_PARTICIPANTS} participants are supported`);
  }
  return list;
}

/**
 * Stable draw identity for a participant.
 *
 * Emails are unique within an exchange, so they identify a person in email
 * mode; link mode has no email, so the row id takes over. Either way two
 * people with the same name stay distinct — the draw never merges them.
 */
export function participantKey(p: {
  name: string;
  email?: string | null;
  id?: string | null;
}): string {
  const discriminator = p.email?.trim() || p.id;
  return discriminator ? `${p.name} <${discriminator}>` : p.name;
}
