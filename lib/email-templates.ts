import { signToken, type TokenPayload } from "@/lib/tokens";

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://santawheel.com";
}

function link(payload: TokenPayload, path: string): string {
  return `${baseUrl()}${path}${signToken(payload)}`;
}

export function assignmentLink(exchangeId: string, participantId: string, generation: number): string {
  return link({ t: "a", x: exchangeId, p: participantId, g: generation }, "/a/");
}

export function removeMeLink(exchangeId: string, participantId: string): string {
  return link({ t: "r", x: exchangeId, p: participantId }, "/remove/");
}

export function manageLink(exchangeId: string): string {
  return link({ t: "o", x: exchangeId }, "/manage/");
}

const FOOTER_SENTENCE =
  "This email was sent because you joined a Secret Santa group organized with SantaWheel";

function wrap(bodyHtml: string, removeUrl: string | null): string {
  const removeLine = removeUrl
    ? `<p style="margin:12px 0 0">Don't want to take part? <a href="${removeUrl}" style="color:#b3402a">Remove your data</a>.</p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fdfaf5;font-family:Arial,Helvetica,sans-serif;color:#2a2320">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ece4da;border-radius:12px;padding:28px">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #ece4da;margin:24px 0 12px" />
    <p style="margin:0;font-size:12px;color:#7a6f68">${FOOTER_SENTENCE}.${removeLine}</p>
  </div>
</body></html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderAssignmentEmail(p: {
  name: string;
  assignmentToken: string;
  removeToken: string;
}): RenderedEmail {
  const url = `${baseUrl()}/a/${p.assignmentToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 20px">Your Secret Santa draw is ready. Open your private link to see who you are drawing for:</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open my assignment</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">This link is yours alone — keep it private. It stays valid until the organizer resets the draw.</p>`;

  return {
    subject: "Your Secret Santa assignment",
    html: wrap(body, removeUrl),
    text: [
      `Hi ${p.name},`,
      "",
      "Your Secret Santa draw is ready. Open your private link to see who you are drawing for:",
      url,
      "",
      "This link is yours alone — keep it private.",
      "",
      `${FOOTER_SENTENCE}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
    ].join("\n"),
  };
}

export function renderOrganizerEmail(p: {
  title: string;
  manageToken: string;
}): RenderedEmail {
  const url = `${baseUrl()}/manage/${p.manageToken}`;

  const body = `
    <p style="margin:0 0 16px">Your draw for "${escapeHtml(p.title)}" is ready and every participant has been emailed.</p>
    <p style="margin:0 0 20px">Use your private organizer link to track delivery, resend emails, download the pairs as CSV, or reset the draw:</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open organizer dashboard</a>
    </p>
    <p style="margin:0;font-size:13px;color:#7a6f68">This link is the only way to manage the draw — save it somewhere safe. It does not expire.</p>`;

  return {
    subject: "Your SantaWheel draw is ready",
    html: wrap(body, null),
    text: [
      `Your draw for "${p.title}" is ready and every participant has been emailed.`,
      "",
      `Organizer dashboard (save this link, it does not expire):`,
      url,
    ].join("\n"),
  };
}

export function renderReminderEmail(p: {
  name: string;
  assignmentToken: string;
  removeToken: string;
}): RenderedEmail {
  const url = `${baseUrl()}/a/${p.assignmentToken}`;
  const removeUrl = `${baseUrl()}/remove/${p.removeToken}`;

  const body = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(p.name)},</p>
    <p style="margin:0 0 20px">A quick reminder: you haven't opened your Secret Santa assignment yet. It takes one click:</p>
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#b3402a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open my assignment</a>
    </p>`;

  return {
    subject: "Reminder: your Secret Santa assignment",
    html: wrap(body, removeUrl),
    text: [
      `Hi ${p.name},`,
      "",
      "A quick reminder: you haven't opened your Secret Santa assignment yet:",
      url,
      "",
      `${FOOTER_SENTENCE}.`,
      `Don't want to take part? Remove your data: ${removeUrl}`,
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
