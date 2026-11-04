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

export function RedrawButton({ token }: { token: string }) {
  const { loading, message, error, post } = useApi();

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          if (
            !window.confirm(
              "Reset the draw? Every existing assignment link will stop working and everyone gets a new email."
            )
          ) {
            return;
          }
          post("/api/manage/redraw", { token });
        }}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent-strong disabled:opacity-50"
      >
        {loading ? "Redrawing…" : "Reset & redraw"}
      </button>
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      {!error && message && <p className="mt-1 text-xs text-accent-green">{message}</p>}
    </div>
  );
}
