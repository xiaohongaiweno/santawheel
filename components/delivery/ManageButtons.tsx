"use client";

import { useState } from "react";

function useApi() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: object, onDone?: (data: unknown) => void) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.delivery ? `Done — sent ${data.delivery.sent}, failed ${data.delivery.failed}` : "Done");
      onDone?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return { loading, message, error, post };
}

export function ResendButton({ token, giverId }: { token: string; giverId?: string }) {
  const { loading, message, error, post } = useApi();

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={loading}
        onClick={() => post("/api/manage/resend", { token, giverId })}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {loading ? "Sending…" : "Resend"}
      </button>
      {error && <p className="mt-1 max-w-52 text-xs text-accent">{error}</p>}
      {!error && message && <p className="mt-1 max-w-52 text-xs text-accent-green">{message}</p>}
    </div>
  );
}

export function RedrawButton({
  token,
  deliveryMode = "email",
}: {
  token: string;
  deliveryMode?: "email" | "link";
}) {
  const { loading, message, error, post } = useApi();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
        <p className="text-sm font-semibold">Reset the draw for everyone?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
          <li>The current pairings are permanently discarded.</li>
          <li>Every link already shared stops working immediately.</li>
          <li>
            {deliveryMode === "email"
              ? "Everyone receives a brand-new assignment email."
              : "New private links are issued — copy and send them again."}
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              post("/api/manage/redraw", { token }, () => setConfirming(false))
            }
            className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-surface hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? "Redrawing…" : "Yes, reset & redraw"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setConfirming(false)}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5 disabled:opacity-50"
      >
        Reset &amp; redraw
      </button>
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      {!error && message && <p className="mt-1 text-xs text-accent-green">{message}</p>}
    </div>
  );
}

/**
 * GDPR: destroy the draw and everything in it. Two gates — an inline warning
 * panel, then typing DELETE — because there is no undo and no backup.
 */
export function DeleteExchangeButton({ token }: { token: string }) {
  const { loading, error, post } = useApi();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold">Draw deleted</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Every participant name, email and pairing has been removed. This link
          no longer works.
        </p>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
        <p className="text-sm font-semibold">Delete this draw permanently?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
          <li>All names and email addresses are erased from our database.</li>
          <li>The pairings and the delivery history are erased too.</li>
          <li>Every assignment link stops working immediately.</li>
          <li>
            <strong>This cannot be undone</strong> — there is no backup to
            restore from.
          </li>
        </ul>
        <label className="mt-3 block text-xs font-medium text-muted">
          Type DELETE to confirm
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || typed !== "DELETE"}
            onClick={() =>
              post("/api/manage/delete", { token, confirm: "DELETE" }, () => setDone(true))
            }
            className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-surface hover:bg-accent-strong disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setConfirming(false);
              setTyped("");
            }}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-accent hover:text-accent"
      >
        Delete this draw
      </button>
      <p className="mt-1 text-xs text-muted">
        Erases every name and email. Cannot be undone.
      </p>
    </div>
  );
}
