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
  email: string;
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

/**
 * Parse exclusion rules typed by the organizer: one pair per line,
 * e.g. "Alice - Bob" or "Alice, Bob". Names or emails are matched against
 * the parsed participant list (case-insensitive).
 * Returns email pairs ready for the create API; unknown names go to errors.
 */
export function parseExclusionLines(
  text: string,
  participants: ImportedParticipant[]
): { pairs: Array<[string, string]>; errors: string[] } {
  const pairs: Array<[string, string]> = [];
  const errors: string[] = [];

  const byName = new Map(participants.map((p) => [p.name.toLowerCase(), p.email]));
  const byEmail = new Map(participants.map((p) => [p.email.toLowerCase(), p.email]));

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
