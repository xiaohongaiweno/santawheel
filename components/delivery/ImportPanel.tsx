"use client";

import { useState } from "react";

export default function ImportPanel({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setText(await file.text());
  }

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    setErrors([]);
    try {
      const res = await fetch("/api/manage/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(
        `Added ${data.added} participant${data.added === 1 ? "" : "s"}` +
          (data.skipped > 0 ? `, skipped ${data.skipped} already in the list` : "") +
          ". Run Reset & redraw to include them."
      );
      setErrors(data.lineErrors ?? []);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold">Import participants (Excel / CSV)</h3>
      <p className="mt-1 text-xs text-muted">
        Paste rows or upload a .csv — columns: name, email, wishlist (optional).
        Copy-pasting straight from Excel works too.
      </p>
      <input
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-border/40 file:px-3 file:py-1.5 file:text-xs file:font-medium"
      />
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Alice,alice@example.com\nBob,bob@example.com,https://…"}
        className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={submit}
        disabled={loading || !text.trim()}
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import"}
      </button>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      {result && <p className="mt-2 text-xs text-accent-green">{result}</p>}
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
