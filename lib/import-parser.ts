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
