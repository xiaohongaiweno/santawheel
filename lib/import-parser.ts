/**
 * Parser for bulk participant import (premium feature).
 * Accepts pasted text or CSV/TSV file contents:
 *   - one participant per line
 *   - separators: tab (Excel paste), comma, or semicolon — auto-detected per line
 *   - columns: name, email[, wishlist url] — also accepts email-only lines
 *   - an optional header row ("name, email, wishlist") is detected and skipped
 */

export interface ImportedParticipant {
  name: string;
  /** Absent for names-only lists (private-link mode). */
  email?: string;
  wishlistUrl?: string;
}

export interface ImportResult {
  participants: ImportedParticipant[];
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER_HINTS = /^(name|nom|nombre)[\s,;\t]*(email|e-mail|mail)[\s,;\t]*/i;

function splitLine(line: string): string[] {
  if (line.includes("\t")) return line.split("\t");
  if (line.includes(";")) return line.split(";");
  return line.split(",");
}

export function parseParticipantImport(text: string): ImportResult {
  const participants: ImportedParticipant[] = [];
  const errors: string[] = [];
  const seen = new Map<string, ImportedParticipant>();
  let headerSkipped = false;

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip a single leading header row like "name,email,wishlist"
    if (!headerSkipped && HEADER_HINTS.test(line)) {
      headerSkipped = true;
      continue;
    }
    headerSkipped = true;

    const cells = splitLine(line).map((c) => c.trim().replace(/^"|"$/g, ""));
    const [first, second, third] = cells;

    // Email-only line ("alice@example.com" or "Alice <alice@example.com>")
    let name = first;
    let email: string | undefined = second;
    let wishlist: string | undefined = third;
    const angle = first?.match(/^(.*)<([^\s@]+@[^\s@]+\.[^\s@]+)>$/);
    if (angle) {
      name = angle[1].trim() || angle[2];
      email = angle[2];
      wishlist = second;
    } else if (!second && EMAIL_RE.test(first ?? "")) {
      name = first.split("@")[0];
      email = first;
      wishlist = undefined;
    }

    email = (email ?? "").toLowerCase();
    if (!name || !EMAIL_RE.test(email)) {
      errors.push(`Line ${i + 1}: "${line.slice(0, 80)}" — need a name and a valid email`);
      continue;
    }
    if (seen.has(email)) {
      errors.push(`Line ${i + 1}: duplicate email ${email} — skipped`);
      continue;
    }
    const participant: ImportedParticipant = {
      name,
      email,
      wishlistUrl: wishlist || undefined,
    };
    seen.set(email, participant);
    participants.push(participant);
  }

  return { participants, errors };
}

/** A participant as typed by the organizer, with or without an email. */
export interface NamedParticipant {
  name: string;
  email?: string;
}

/**
 * How one participant is referenced in exclusion rules and in the UI.
 * Email when we have one, otherwise the lowercased name (link mode).
 */
export function participantRef(p: NamedParticipant): string {
  return (p.email?.trim().toLowerCase() || p.name.trim().toLowerCase()) as string;
}

/**
 * Parse a names-only list for private-link mode.
 *
 * Accepts plain one-name-per-line input, and also tolerates a list copied from
 * a spreadsheet ("Name, email" / "Name <email>") — the emails are simply
 * discarded, because in this mode nobody is emailed. Leading numbering
 * ("1. Alice") is stripped. Duplicate names are reported rather than silently
 * merged, since the name is the only way to tell two links apart.
 */
export function parseNameList(text: string): { names: string[]; errors: string[] } {
  const names: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let headerSkipped = false;

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    // A leading header row ("Name" / "Name, email") is not a participant.
    if (!headerSkipped && /^(name|nom|nombre)\b[\s,;\t]*$/i.test(line)) {
      headerSkipped = true;
      continue;
    }
    if (!headerSkipped && /^(name|nom|nombre)[\s,;\t]+(email|e-mail|mail)/i.test(line)) {
      headerSkipped = true;
      continue;
    }
    headerSkipped = true;

    // "1. Alice" / "2) Bob"
    line = line.replace(/^\d+[.)]\s*/, "");

    let name = line;
    const angle = line.match(/^(.*)<[^>]*>$/);
    if (angle) {
      name = angle[1].trim();
    } else if (/[,;\t]/.test(line)) {
      const first = line.split(/[,;\t]/)[0].trim().replace(/^"|"$/g, "");
      name = first;
    }
    name = name.trim().replace(/^"|"$/g, "");
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) {
      const msg = `Two participants are called "${name}" — add a last name or initial so their links stay separate.`;
      if (!errors.includes(msg)) errors.push(msg);
      continue;
    }
    seen.add(key);
    names.push(name);
  }

  return { names, errors };
}

/**
 * Parse exclusion rules typed by the organizer: one pair per line,
 * e.g. "Alice - Bob" or "Alice, Bob". Names or emails are matched against
 * the parsed participant list (case-insensitive).
 * Returns participant refs ready for the create API; unknown names go to errors.
 */
export function parseExclusionLines(
  text: string,
  participants: NamedParticipant[]
): { pairs: Array<[string, string]>; errors: string[] } {
  const pairs: Array<[string, string]> = [];
  const errors: string[] = [];

  const byName = new Map(participants.map((p) => [p.name.toLowerCase(), participantRef(p)]));
  const byEmail = new Map(
    participants.filter((p) => p.email).map((p) => [p.email!.toLowerCase(), participantRef(p)])
  );

  const resolve = (raw: string): string | null => {
    const s = raw.trim().toLowerCase();
    return byEmail.get(s) ?? byName.get(s) ?? null;
  };

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+[-–—]\s+|,\s*|\t/).filter(Boolean);
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: "${line.slice(0, 80)}" — write one pair per line, e.g. "Alice - Bob"`);
      continue;
    }
    const a = resolve(parts[0]);
    const b = resolve(parts[1]);
    if (a === null || b === null) {
      const unknown = [a === null ? parts[0] : null, b === null ? parts[1] : null]
        .filter(Boolean) as string[];
      errors.push(`Line ${i + 1}: unknown participant "${unknown.join('", "')}" — use the exact name or email from your list`);
      continue;
    }
    if (a === b) continue;
    if (!pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
      pairs.push([a, b]);
    }
  }

  return { pairs, errors };
}
