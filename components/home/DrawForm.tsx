"use client";

import { useMemo, useState } from "react";
import {
  parseParticipantImport,
  parseNameList,
  parseExclusionLines,
  participantRef,
  type ImportedParticipant,
} from "@/lib/import-parser";
import CopyButton from "@/components/home/CopyButton";
import AssignmentLinks from "@/components/delivery/AssignmentLinks";

export type DrawKind = "secret-santa" | "gift-exchange";
type DeliveryMode = "email" | "link";

interface DeliveryInfo {
  processed: number;
  sent: number;
  failed: number;
  retriable: number;
}

interface ApiLink {
  participantId: string;
  name: string;
  url: string;
}

/** Idempotency key: one per form session, so a retry cannot duplicate a draw. */
function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function DrawForm({ kind }: { kind: DrawKind }) {
  const label = kind === "gift-exchange" ? "gift exchange" : "Secret Santa";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<DeliveryMode>("email");
  const [blind, setBlind] = useState(false);
  const [collect, setCollect] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [requestId, setRequestId] = useState(newRequestId);
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<ApiLink[]>([]);

  const parsed = useMemo((): { participants: ImportedParticipant[]; errors: string[] } => {
    if (mode === "email") return parseParticipantImport(text);
    // Link mode: names only. Any emails in the pasted list are simply dropped.
    const { names, errors } = parseNameList(text);
    return { participants: names.map((name) => ({ name })), errors };
  }, [mode, text]);

  const exclusions = useMemo(
    () => parseExclusionLines(exclusionsText, parsed.participants),
    [exclusionsText, parsed.participants]
  );

  const organizerOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizerEmail.trim());
  // Collect mode: the organizer email is mandatory — the dashboard link and
  // the join link are emailed there, and there are no other links yet.
  const organizerSatisfied = collect
    ? organizerOk
    : mode === "link"
      ? !organizerEmail.trim() || organizerOk
      : organizerOk;
  const canSubmit =
    !submitting && organizerSatisfied && (collect || parsed.participants.length >= 2);

  function switchMode(next: DeliveryMode) {
    setMode(next);
    setError(null);
    if (next === "link") setBlind(false);
  }

  function toStep2() {
    setError(null);
    if (!collect) {
      if (parsed.participants.length < 2) {
        setError(
          parsed.participants.length === 0
            ? mode === "email"
              ? "Paste your participants first — one per line as “Name <email>”."
              : "Paste your participants first — one name per line."
            : `Add at least 2 participants (you have ${parsed.participants.length}).`
        );
        return;
      }
      if (parsed.errors.length > 0 && mode === "link") {
        setError(parsed.errors[0]);
        return;
      }
    }
    if (!title) setTitle(`Our ${label}`);
    setStep(2);
  }

  async function submit() {
    setError(null);
    if (!canSubmit) {
      if (!organizerSatisfied) {
        setError("That email address does not look right — check it and try again.");
      }
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || `Our ${label}`,
          organizerEmail: organizerEmail.trim() || undefined,
          participants: collect ? [] : parsed.participants,
          exclusions: collect ? undefined : exclusions.pairs,
          budgetAmount: budget.trim() ? Number(budget) : undefined,
          deadline: deadline || undefined,
          kind,
          deliveryMode: mode,
          blindMode: blind,
          collect: collect || undefined,
          requestId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        delivery?: DeliveryInfo | null;
        managePath?: string;
        joinPath?: string;
        links?: ApiLink[];
      };
      if (!res.ok) throw new Error(data.error || "Something went wrong — please try again.");
      setDelivery(data.delivery ?? null);
      setLinks(data.links ?? []);
      if (data.managePath) {
        setManageUrl(`${window.location.origin}${data.managePath}`);
      }
      if (data.joinPath) {
        setJoinUrl(`${window.location.origin}${data.joinPath}`);
      }
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
    setManageUrl(null);
    setJoinUrl(null);
    setLinks([]);
    setBlind(false);
    setCollect(false);
    setError(null);
    setRequestId(newRequestId());
  }

  // ---------- step 3: success ----------
  if (step === 3) {
    return (
      <div className="w-full rounded-xl border border-accent-green/30 bg-accent-green/5 p-6 text-left">
        <h2 className="text-lg font-bold text-accent-green">
          {collect ? "Done — your join link is ready!" : "Done — the draw is made!"}
        </h2>

        {collect && joinUrl && (
          <>
            <p className="mt-3 text-sm leading-relaxed">
              Your {label} is set up and collecting participants. Share this
              join link with your group — everyone adds themselves, then you
              draw the names from the dashboard.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium">Join link</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={joinUrl}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-strong"
                >
                  Open join link
                </a>
                <CopyButton text={joinUrl} label="Copy link" />
              </div>
              <p className="mt-2 break-all text-xs text-muted">{joinUrl}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                It was also emailed to <strong>{organizerEmail.trim()}</strong>.
                When everyone has joined, open the dashboard, optionally set
                exclusions, and press &quot;Draw the names&quot;.
              </p>
            </div>
          </>
        )}

        {!collect && mode === "link" ? (
          <>
            <p className="mt-3 text-sm leading-relaxed">
              {parsed.participants.length} names were drawn. Nobody was emailed
              — send each person their own private link below.
            </p>
            <div className="mt-4">
              <AssignmentLinks links={links.map((l) => ({ name: l.name, url: l.url }))} />
            </div>
          </>
        ) : !collect ? (
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
            {blind && " Blind mode is on — your dashboard will not show who drew whom."}
          </p>
        ) : null}

        {!collect &&
          mode === "email" &&
          delivery !== null &&
          delivery.sent === 0 &&
          delivery.retriable + delivery.failed > 0 && (
            <p className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed">
              None of the emails have gone out yet. We keep retrying
              automatically, and your dashboard below lets you resend any of
              them by hand — the draw itself is saved either way.
            </p>
          )}

        {manageUrl && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium">Your organizer dashboard</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {collect
                ? "Open it any time to see who has joined, set exclusions, and draw the names. Save this link — it is the only way back in."
                : mode === "link"
                  ? "Open it any time to re-copy the links, reset the draw, or add premium features. Save this link — it is the only way back in."
                  : "Open it to check delivery, resend an email, download the pairs as CSV, or reset the draw. Save this link — it is the only way back in."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={manageUrl}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold leading-10 text-surface hover:bg-accent-strong"
              >
                Open dashboard
              </a>
              <CopyButton text={manageUrl} label="Copy link" />
            </div>
            <p className="mt-2 break-all text-xs text-muted">{manageUrl}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">
              Optional premium ($4.99 once, per draw): import participants from
              Excel/CSV, send automatic reminders to anyone who hasn&apos;t
              opened their assignment, and draw with no-repeat memory across
              years.{" "}
              <a href={manageUrl} className="font-medium text-accent hover:underline">
                Unlock it on your dashboard
              </a>
              .
            </p>
          </div>
        )}

        {collect ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You did not paste a list — participants add themselves. The draw
            happens from the dashboard when you are ready.
          </p>
        ) : mode === "email" ? (
          <p className="mt-3 text-sm leading-relaxed">
            {delivery !== null && delivery.sent === 0 ? (
              <>
                We will keep trying to email this link to{" "}
                <strong>{organizerEmail.trim()}</strong>. Until it lands, the
                link above is your way back in.
              </>
            ) : (
              <>
                We also emailed this link to{" "}
                <strong>{organizerEmail.trim()}</strong>. If it does not arrive,
                use the link above.
              </>
            )}
          </p>
        ) : (
          !organizerEmail.trim() && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              You did not add your email, so this dashboard link exists only
              here. Copy it now if you want to come back later.
            </p>
          )
        )}

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
        <h2 className="text-base font-semibold">Check before you draw</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="text-xs text-muted">Participants</dt>
            <dd className="font-medium">
              {collect ? "They join via your link" : `${parsed.participants.length} people`}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="text-xs text-muted">Contact details</dt>
            <dd className="font-medium">
              {mode === "email" ? "Email per person" : "None — links only"}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="text-xs text-muted">Exclusion rules</dt>
            <dd className="font-medium">
              {collect
                ? "Set them on the dashboard"
                : exclusions.pairs.length > 0
                  ? `${exclusions.pairs.length} pair${exclusions.pairs.length === 1 ? "" : "s"}`
                  : "None"}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="text-xs text-muted">Delivery</dt>
            <dd className="font-medium">
              {mode === "email"
                ? blind
                  ? "Email · blind to you"
                  : "Email + private link"
                : "Private links you share"}
            </dd>
          </div>
        </dl>

        <details className="mt-3 rounded-lg border border-border bg-background px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            Who is in ({parsed.participants.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {parsed.participants.map((p) => (
              <li key={participantRef(p)} className="truncate">
                {p.name}
                {p.email ? ` · ${p.email}` : ""}
              </li>
            ))}
          </ul>
        </details>

        {exclusions.pairs.length > 0 && (
          <details className="mt-2 rounded-lg border border-border bg-background px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-muted">
              Who cannot draw whom ({exclusions.pairs.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {exclusions.pairs.map(([a, b]) => (
                <li key={`${a}|${b}`}>
                  {parsed.participants.find((p) => participantRef(p) === a)?.name ?? a} &#8596;{" "}
                  {parsed.participants.find((p) => participantRef(p) === b)?.name ?? b}
                </li>
              ))}
            </ul>
          </details>
        )}

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
              Your email {mode === "email" || collect ? <span className="text-accent">*</span> : "(optional)"}
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
              {collect
                ? "We email your join link and dashboard link here."
                : mode === "email"
                  ? "We send your organizer dashboard link here."
                  : "Only used to email you the dashboard link — participants are never contacted."}
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

        {mode === "email" && (
          <label className="mt-3 flex gap-2.5 rounded-lg border border-border bg-background p-3 text-sm">
            <input
              type="checkbox"
              checked={blind}
              onChange={(e) => setBlind(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium">Organizer blind mode</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                Your dashboard will never show who drew whom — not even to you.
                You can still track delivery and resend emails. Recommended when
                participants should not worry about the organizer peeking.
              </span>
            </span>
          </label>
        )}

        {!collect && (
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
        )}

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
            {submitting
              ? collect
                ? "Creating…"
                : "Drawing…"
              : collect
                ? "Create my join link"
                : "Confirm & draw names"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {collect
            ? "Nothing is drawn yet. People join themselves; when you draw later, everyone gets their assignment the usual way."
            : mode === "email"
              ? "Everyone gets one email with a private link that shows only their own assignment. You can reset the draw later from your organizer dashboard — that cancels the old links and re-sends new ones."
              : "The draw happens on our server and nobody is emailed. You get one private link per participant to send however you like; resetting the draw cancels every old link."}
        </p>
      </div>
    );
  }

  // ---------- step 1: paste the list (first screen) ----------
  return (
    <div id="generate" className="w-full">
      <fieldset>
        <legend className="mb-2 block text-left text-sm font-medium">
          How should people get their assignment?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={mode === "email"}
            onClick={() => switchMode("email")}
            className={`rounded-lg border p-3 text-left transition-colors ${
              mode === "email"
                ? "border-accent bg-accent/5"
                : "border-border bg-surface hover:border-accent/60"
            }`}
          >
            <span className="block text-sm font-semibold">Email delivery</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              One email each, sent for you. Needs an email per participant.
            </span>
          </button>
          <button
            type="button"
            aria-pressed={mode === "link"}
            onClick={() => switchMode("link")}
            className={`rounded-lg border p-3 text-left transition-colors ${
              mode === "link"
                ? "border-accent bg-accent/5"
                : "border-border bg-surface hover:border-accent/60"
            }`}
          >
            <span className="block text-sm font-semibold">Private links</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              Names only. You copy each link and send it yourself.
            </span>
          </button>
        </div>
      </fieldset>

      <label className="mt-4 flex gap-2.5 rounded-lg border border-border bg-surface p-3 text-left text-sm">
        <input
          type="checkbox"
          checked={collect}
          onChange={(e) => {
            setCollect(e.target.checked);
            setError(null);
          }}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          <span className="font-medium">Let people join themselves with a link</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            Skip the list — you get one join link to share in your group chat.
            Everyone adds their own name{mode === "email" ? " and email" : ""}, and you
            draw the names from your dashboard when everyone is in.
          </span>
        </span>
      </label>

      {!collect && (
        <>
      <label
        htmlFor="participants"
        className="mb-2 mt-4 block text-left text-sm font-medium"
      >
        {mode === "email" ? "Paste your participants list" : "Paste your participant names"}
      </label>
      <textarea
        id="participants"
        name="participants"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "email"
            ? "One per line, with emails:\nAlice <alice@example.com>\nBob <bob@example.com>"
            : "One name per line:\nAlice\nBob\nCarol"
        }
        spellCheck={false}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base leading-relaxed outline-none focus:border-accent"
      />
      <p className="mt-1.5 text-left text-xs text-muted" aria-live="polite">
        {parsed.participants.length} participant
        {parsed.participants.length === 1 ? "" : "s"} ·{" "}
        {mode === "email"
          ? "one per line · “Name <email>”, “Name, email”, or just an email"
          : "one per line · emails are not needed and are ignored"}
      </p>
        </>
      )}

      <button
        type="button"
        onClick={toStep2}
        className="mt-3 h-12 w-full rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong sm:w-auto"
      >
        Continue
      </button>
      <p className="mt-2 text-xs text-muted">
        Free to draw and send · optional $4.99 organizer upgrades
      </p>

      {error && (
        <p role="alert" className="mt-3 text-left text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
