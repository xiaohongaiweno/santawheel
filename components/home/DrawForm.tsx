"use client";

import { useMemo, useState } from "react";
import {
  parseParticipantImport,
  parseExclusionLines,
} from "@/lib/import-parser";

export type DrawKind = "secret-santa" | "gift-exchange";

interface DeliveryInfo {
  processed: number;
  sent: number;
  failed: number;
  retriable: number;
}

export default function DrawForm({ kind }: { kind: DrawKind }) {
  const label = kind === "gift-exchange" ? "gift exchange" : "Secret Santa";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);

  const parsed = useMemo(() => parseParticipantImport(text), [text]);
  const exclusions = useMemo(
    () => parseExclusionLines(exclusionsText, parsed.participants),
    [exclusionsText, parsed.participants]
  );

  const organizerOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizerEmail.trim());
  const canSubmit =
    !submitting && organizerOk && parsed.participants.length >= 2;

  function toStep2() {
    setError(null);
    if (parsed.participants.length < 2) {
      setError(
        parsed.participants.length === 0
          ? "Paste your participants first — one per line as “Name <email>”."
          : `Add at least 2 participants with emails (you have ${parsed.participants.length}).`
      );
      return;
    }
    if (!title) setTitle(`Our ${label}`);
    setStep(2);
  }

  async function submit() {
    setError(null);
    if (!canSubmit) {
      if (!organizerOk) setError("Enter your email — we send your organizer dashboard link there.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || `Our ${label}`,
          organizerEmail: organizerEmail.trim(),
          participants: parsed.participants,
          exclusions: exclusions.pairs,
          budgetAmount: budget.trim() ? Number(budget) : undefined,
          deadline: deadline || undefined,
          kind,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        delivery?: DeliveryInfo | null;
      };
      if (!res.ok) throw new Error(data.error || "Something went wrong — please try again.");
      setDelivery(data.delivery ?? null);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setText("");
    setTitle("");
    setOrganizerEmail("");
    setBudget("");
    setDeadline("");
    setExclusionsText("");
    setDelivery(null);
    setError(null);
  }

  // ---------- step 3: success ----------
  if (step === 3) {
    return (
      <div className="w-full rounded-xl border border-accent-green/30 bg-accent-green/5 p-6 text-left">
        <h2 className="text-lg font-bold text-accent-green">
          Done — the draw is made!
        </h2>
        <p className="mt-3 text-sm leading-relaxed">
          {parsed.participants.length} participants have been drawn and{" "}
          {delivery?.sent !== undefined ? (
            <>
              <strong>{delivery.sent}</strong> email{delivery.sent === 1 ? "" : "s"}{" "}
              {delivery.sent === 1 ? "was" : "were"} sent
              {delivery.retriable + delivery.failed > 0
                ? ` (${delivery.retriable + delivery.failed} queued and retrying automatically)`
                : ""}
            </>
          ) : (
            "emails are on their way"
          )}
          . Each person gets a private link showing only their own assignment.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          <strong>Check your inbox</strong> ({organizerEmail.trim()}) — we sent
          you the organizer dashboard link. It shows who has been delivered to,
          lets you resend any email, download the pairs as CSV, and reset the
          draw. Save that link: it is the only way back to the dashboard.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
        >
          Create another {label}
        </button>
      </div>
    );
  }

  // ---------- step 2: details & exclusions ----------
  if (step === 2) {
    return (
      <div className="w-full rounded-xl border border-border bg-surface p-5 text-left">
        <h2 className="text-base font-semibold">
          {parsed.participants.length} participants
        </h2>
        <p className="mt-1 text-xs text-muted">
          {parsed.participants.map((p) => p.name).join(", ")}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Draw title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              Your email <span className="text-accent">*</span>
            </span>
            <input
              type="email"
              inputMode="email"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
            />
            <span className="mt-1 block text-xs text-muted">
              We send your organizer dashboard link here.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Budget (optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="25"
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Deadline (optional)</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium">
            Exclusions (optional) — people who must not draw each other
          </span>
          <textarea
            rows={3}
            value={exclusionsText}
            onChange={(e) => setExclusionsText(e.target.value)}
            placeholder={"One pair per line:\nAlice - Bob\nCarol - Dave"}
            spellCheck={false}
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
          {exclusions.pairs.length > 0 && (
            <span className="mt-1 block text-xs text-accent-green">
              {exclusions.pairs.length} exclusion{exclusions.pairs.length === 1 ? "" : "s"} active
            </span>
          )}
          {exclusions.errors.length > 0 && (
            <span className="mt-1 block text-xs text-accent">
              {exclusions.errors[0]}
            </span>
          )}
        </label>

        {parsed.errors.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Skipped from your list: {parsed.errors[0]}
            {parsed.errors.length > 1 ? ` (+${parsed.errors.length - 1} more)` : ""}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="h-12 rounded-lg border border-border bg-surface px-6 text-base font-medium hover:border-accent hover:text-accent"
          >
            Back
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="h-12 flex-1 rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {submitting ? "Drawing…" : `Draw names & send emails`}
          </button>
        </div>
      </div>
    );
  }

  // ---------- step 1: paste the list (first screen) ----------
  return (
    <div id="generate" className="w-full">
      <label
        htmlFor="participants"
        className="mb-2 block text-left text-sm font-medium"
      >
        Paste your participants list
      </label>
      <textarea
        id="participants"
        name="participants"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"One per line, with emails:\nAlice <alice@example.com>\nBob <bob@example.com>"}
        spellCheck={false}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base leading-relaxed outline-none focus:border-accent"
      />
      <p className="mt-1.5 text-left text-xs text-muted" aria-live="polite">
        {parsed.participants.length} participant
        {parsed.participants.length === 1 ? "" : "s"} · one per line · “Name
        &lt;email&gt;”, “Name, email”, or just an email
      </p>

      <button
        type="button"
        onClick={toStep2}
        className="mt-3 h-12 w-full rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong sm:w-auto"
      >
        Generate
      </button>

      {error && (
        <p role="alert" className="mt-3 text-left text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
