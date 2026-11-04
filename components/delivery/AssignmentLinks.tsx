"use client";

import { useState } from "react";

export interface PrivateLinkItem {
  name: string;
  url: string;
}

/**
 * Private-link hand-out list (link mode). Each participant gets one
 * unguessable link; the organizer copies them into WhatsApp, Messenger or
 * whatever the group already uses. Nothing is emailed in this mode.
 */
export default function AssignmentLinks({ links }: { links: PrivateLinkItem[] }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const allText = links.map((l) => `${l.name}: ${l.url}`).join("\n");

  async function copy(text: string, index: number | null) {
    try {
      await navigator.clipboard.writeText(text);
      if (index === null) {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      } else {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch {
      // clipboard blocked (http, permissions) — the URL is visible to select
    }
  }

  if (links.length === 0) {
    return (
      <p className="text-sm text-muted">
        No links yet — the draw has not been run for this exchange.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-sm font-medium">
          {links.length} private link{links.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => copy(allText, null)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
        >
          {copiedAll ? "Copied all" : "Copy all"}
        </button>
      </div>
      <ul className="divide-y divide-border">
        {links.map((l, i) => (
          <li key={l.url} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.name}</p>
              <p className="truncate text-xs text-muted">{l.url}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(l.url, i)}
              aria-label={`Copy the private link for ${l.name}`}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
            >
              {copiedIndex === i ? "Copied" : "Copy"}
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
        Send each link privately to the person it belongs to. Anyone holding a
        link can open that one assignment, so avoid posting the list in a group
        chat.
      </p>
    </div>
  );
}
