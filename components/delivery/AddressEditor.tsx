"use client";

import { useState } from "react";

const MAX_LEN = 500;

/**
 * Self-serve shipping address editor shown on a participant's own assignment
 * page. Saved text is shown to the person drawing them, so gifts can be
 * shipped directly — essential for remote teams and far-away family.
 */
export default function AddressEditor({
  token,
  initialText,
}: {
  token: string;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, addressText: text }),
      });
      if (!res.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Your shipping address (optional)</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        If your gift needs to be mailed, leave your address so your Santa can
        ship it straight to you. Only the person drawing you can see this.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, MAX_LEN));
          if (state === "saved" || state === "error") setState("idle");
        }}
        rows={3}
        maxLength={MAX_LEN}
        placeholder={"12 Holly Lane, Apt 4\nSpringfield, IL 62704\nUnited States"}
        className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {text.length}/{MAX_LEN}
        </span>
        <button
          onClick={save}
          disabled={state === "saving" || text === initialText}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Save address"}
        </button>
      </div>
      {state === "saved" && (
        <p className="mt-2 text-xs text-accent-green">Saved — your Santa can see it now.</p>
      )}
      {state === "error" && (
        <p className="mt-2 text-xs text-accent">
          Could not save. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
