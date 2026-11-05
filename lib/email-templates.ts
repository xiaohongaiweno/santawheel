import { signToken, type TokenPayload } from "@/lib/tokens";

export type ExchangeKind = "secret_santa" | "gift_exchange";

/** Human label used across email copy. */
export function kindLabel(kind?: string): string {
  return kind === "gift_exchange" ? "gift exchange" : "Secret Santa";
}

function footerSentence(kind?: string): string {
  return kind === "gift_exchange"
    ? "This email was sent because you joined a gift exchange organized with SantaWheel"
    : "This email was sent because you joined a Secret Santa group organized with SantaWheel";
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://santawheel.com";
}

function link(payload: TokenPayload, path: string): string {
  return `${baseUrl()}${path}${signToken(payload)}`;
}

export function assignmentLink(exchangeId: string, participantId: string, generation: number): string {
  return link({ t: "a", x: exchangeId, p: participantId, g: generation }, "/a/");
}

/** Absolute private result URL for one participant (link mode hands these out). */
export function assignmentUrl(exchangeId: string, participantId: string, generation: number): string {
  return assignmentLink(exchangeId, participantId, generation);
}

export function removeMeLink(exchangeId: string, participantId: string): string {
  return link({ t: "r", x: exchangeId, p: participantId }, "/remove/");
}

export function manageLink(exchangeId: string): string {
  return link({ t: "o", x: exchangeId }, "/manage/");
}

/** Self-serve join link: participants add themselves while the draw collects. */
export function joinLink(exchangeId: string): string {
  return link({ t: "j", x: exchangeId }, "/j/");
}

/** Direct answer link for one anonymous question (emailed to the receiver). */
export function answerLink(exchangeId: string, questionId: string): string {
  return link({ t: "q", x: exchangeId, q: questionId }, "/q/");
}

/** Shared white elephant draft board (organizer + spectators operate it). */
export function boardLink(exchangeId: string): string {
  return link({ t: "w", x: exchangeId }, "/we/");
}

function wrap(bodyHtml: string, removeUrl: string | null, kind?: string): string {
  const removeLine = removeUrl
    ? `<p style="margin:12px 0 0">Don't want to take part? <a href="${removeUrl}" style="color:#b3402a">Remove your data</a>.</p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fdfaf5;font-family:Arial,Helvetica,sans-serif;color:#2a2320">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ece4da;border-radius:12px;padding:28px">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #ece4da;margin:24px 0 12px" />
    <p style="margin:0;font-size:12px;color:#7a6f68">${footerSentence(kind)}.${removeLine}</p>
  </div>
</body></html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** "20" -> "$20"; passes through values that already look formatted. */
export function budgetLabel(budget: unknown): string | null {
  const n = Number(budget);
  if (budget == null || !Number.isFinite(n) || n <= 0) return null;
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

/** "2026-12-20" -> "Sat, Dec 20" (local time); null for anything else. */
export function deadlineLabel(d: unknown): string | null {
  if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function renderAssignmentEmail(p: {
  name: string;
  assignmentToken: string;
  removeToken: string;
  kind?: ExchangeKind;
  budget?: string | null;
  deadline?: string | null;
}): RenderedEmail {
  const url = `${baseUrl()}/a/${p.assignmentToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;
  const label = kindLabel(p.kind);
  const subject = `Your ${label} assignment`;

  const details = [
    p.budget ? `Budget: ${p.budget}` : null,
    p.deadline ? `Exchange day: ${p.deadline}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const detailLine = details
    ? `<p style="margin:0 0 20px;font-size:14px"><strong>${escapeHtml(details)}</strong></p>`
    : "";

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 20px">Your ${label} draw is ready. Open your private link to see who you are drawing for:</p>
    ${detailLine}
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open my assignment</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">This link is yours alone — keep it private. It stays valid until the organizer resets the draw.</p>`;

  return {
    subject,
    html: wrap(body, removeUrl, p.kind),
    text: [
      `Hi ${p.name},`,
      "",
      `Your ${label} draw is ready. Open your private link to see who you are drawing for:`,
      ...(details ? ["", details] : []),
      "",
      url,
      "",
      "This link is yours alone — keep it private.",
      "",
      `${footerSentence(p.kind)}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
    ].join("\n"),
  };
}

export function renderCollectingEmail(p: {
  title: string;
  joinUrl: string;
  manageUrl: string;
  kind?: ExchangeKind;
  deadline?: string | null;
}): RenderedEmail {
  const label = kindLabel(p.kind);
  const subject = `Your ${label} is set up — share your join link`;

  const body = `
    <p style="margin:0 0 16px">Your ${label} draw for &quot;${escapeHtml(p.title)}&quot; is set up and collecting participants.</p>
    ${p.deadline ? `<p style="margin:0 0 16px;font-size:14px"><strong>Exchange day: ${escapeHtml(p.deadline)}</strong></p>` : ""}
    <p style="margin:0 0 20px">Share this join link with your group — everyone adds themselves:</p>
    <p style="margin:0 0 16px">
      <a href="${p.joinUrl}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open the join link</a>
    </p>
    <p style="margin:0 0 16px;font-size:13px;color:#7a6f68">Or copy it: ${p.joinUrl}</p>
    <p style="margin:0 0 16px">
      <a href="${p.manageUrl}" style="color:#b3402a">Open your organizer dashboard</a> to see who has joined, set exclusions, and draw the names when everyone is in.
    </p>`;

  return {
    subject,
    html: wrap(body, null, p.kind),
    text: [
      `Your ${label} draw for "${p.title}" is set up and collecting participants.`,
      ...(p.deadline ? ["", `Exchange day: ${p.deadline}`] : []),
      "",
      "Share this join link with your group — everyone adds themselves:",
      p.joinUrl,
      "",
      `Open your organizer dashboard to see who has joined, set exclusions, and draw the names when everyone is in: ${p.manageUrl}`,
    ].join("\n"),
  };
}

export function renderOrganizerEmail(p: {
  title: string;
  manageToken: string;
  kind?: ExchangeKind;
  /** Blind mode: the dashboard deliberately never shows the pairings. */
  blind?: boolean;
  deliveryMode?: "email" | "link";
}): RenderedEmail {
  const url = `${baseUrl()}/manage/${p.manageToken}`;
  const linkMode = p.deliveryMode === "link";

  const intro = linkMode
    ? `Your draw for "${escapeHtml(p.title)}" is ready. Nobody was emailed — this draw delivers private links, one per participant.`
    : `Your draw for "${escapeHtml(p.title)}" is ready and every participant has been emailed.`;
  const whatFor = linkMode
    ? "Open your dashboard to copy each participant's private link and share it however you like. Old links stop working if you reset the draw."
    : p.blind
      ? "Open your dashboard to track delivery and resend an email. Because this draw is blind, the dashboard never shows who drew whom."
      : "Use your private organizer link to track delivery, resend emails, download the pairs as CSV, or reset the draw:";

  const body = `
    <p style="margin:0 0 16px">${intro}</p>
    <p style="margin:0 0 20px">${whatFor}:</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open organizer dashboard</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">This link is the only way to manage the draw — save it somewhere safe. It does not expire.</p>`;

  return {
    subject: p.blind ? "Your SantaWheel draw is ready — blind mode" : "Your SantaWheel draw is ready",
    html: wrap(body, null, p.kind),
    text: [
      intro,
      "",
      `${whatFor}:`,
      url,
    ].join("\n"),
  };
}

export function renderReminderEmail(p: {
  name: string;
  assignmentToken: string;
  removeToken: string;
  kind?: ExchangeKind;
  budget?: string | null;
  deadline?: string | null;
}): RenderedEmail {
  const url = `${baseUrl()}/a/${p.assignmentToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;
  const label = kindLabel(p.kind);
  const subject = `Reminder: your ${label} assignment`;

  const details = [
    p.budget ? `Budget: ${p.budget}` : null,
    p.deadline ? `Exchange day: ${p.deadline}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const detailLine = details
    ? `<p style="margin:0 0 16px;font-size:14px"><strong>${escapeHtml(details)}</strong></p>`
    : "";

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 20px">A quick reminder: you haven't opened your ${label} assignment yet. It takes one click:</p>
    ${detailLine}
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open my assignment</a>
    </p>`;

  return {
    subject,
    html: wrap(body, removeUrl, p.kind),
    text: [
      `Hi ${p.name},`,
      "",
      `A quick reminder: you haven't opened your ${label} assignment yet:`,
      ...(details ? ["", details] : []),
      "",
      url,
      "",
      `${footerSentence(p.kind)}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
    ].join("\n"),
  };
}

export function renderQuestionEmail(p: {
  name: string;
  questionText: string;
  answerToken: string;
  removeToken: string;
  kind?: ExchangeKind;
  title?: string;
}): RenderedEmail {
  const url = `${baseUrl()}/q/${p.answerToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;
  const label = kindLabel(p.kind);
  const subject = `Anonymous question from your ${label}`;

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 16px">Someone in your ${label}${p.title ? ` (${escapeHtml(p.title)})` : ""} — the person who is drawing you — sent you an anonymous question:</p>
    <p style="margin:0 0 20px;border-left:3px solid #ece4da;padding-left:12px;font-style:italic">&quot;${escapeHtml(p.questionText)}&quot;</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Answer anonymously</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">Your answer is delivered to them anonymously — they never see who asked or answered.</p>`;

  return {
    subject,
    html: wrap(body, removeUrl, p.kind),
    text: [
      `Hi ${p.name},`,
      "",
      `Someone in your ${label} — the person who is drawing you — sent you an anonymous question:`,
      "",
      `"${p.questionText}"`,
      "",
      `Answer anonymously: ${url}`,
      "",
      "Your answer is delivered to them anonymously.",
      "",
      `${footerSentence(p.kind)}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
    ].join("\n"),
  };
}

export function renderAnswerEmail(p: {
  name: string;
  questionText: string;
  answerText: string;
  assignmentToken: string;
  removeToken: string;
  kind?: ExchangeKind;
}): RenderedEmail {
  const url = `${baseUrl()}/a/${p.assignmentToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;
  const label = kindLabel(p.kind);
  const subject = `Your anonymous ${label} question was answered`;

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 12px">Your anonymous question was answered:</p>
    <p style="margin:0 0 12px;border-left:3px solid #ece4da;padding-left:12px;font-style:italic">&quot;${escapeHtml(p.questionText)}&quot;</p>
    <p style="margin:0 0 20px;border-left:3px solid #b3402a;padding-left:12px">&quot;${escapeHtml(p.answerText)}&quot;</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open my assignment</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">You can keep asking anonymous questions from your assignment page.</p>`;

  return {
    subject,
    html: wrap(body, removeUrl, p.kind),
    text: [
      `Hi ${p.name},`,
      "",
      "Your anonymous question was answered:",
      "",
      `Q: ${p.questionText}`,
      `A: ${p.answerText}`,
      "",
      url,
      "",
      `${footerSentence(p.kind)}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
    ].join("\n"),
  };
}

export function renderWeResultEmail(p: {
  name: string;
  gift: string;
  title?: string;
  kind?: ExchangeKind;
}): RenderedEmail {
  const label = kindLabel(p.kind);
  const subject = `You ended up with: ${p.gift}`;

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 12px">The ${label}${p.title ? ` &quot;${escapeHtml(p.title)}&quot;` : ""} is over. Here is what you took home:</p>
    <p style="margin:0 0 20px;border-left:3px solid #b3402a;padding-left:12px;font-size:18px"><strong>${escapeHtml(p.gift)}</strong></p>
    <p style="margin:0;font-size:13px;color:#7a6f68">Swaps are final once the last turn is played. Enjoy your gift.</p>`;

  return {
    subject,
    html: wrap(body, null, p.kind),
    text: [
      `Hi ${p.name},`,
      "",
      `The ${label}${p.title ? ` "${p.title}"` : ""} is over. Here is what you took home:`,
      "",
      p.gift,
      "",
      "Swaps are final once the last turn is played. Enjoy your gift.",
    ].join("\n"),
  };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
