/**
 * Resend HTTP API client. Keeps the SDK out of the bundle — a single fetch
 * per email is all we need. API key comes from RESEND_API_KEY (.env).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Sending domain: santawheel.com (verify it in the Resend dashboard). */
export function emailFrom(): string {
  return process.env.EMAIL_FROM || "SantaWheel <draw@santawheel.com>";
}

export async function sendEmail(email: OutgoingEmail): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not configured — copy .env.example to .env.local and set it"
    );
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Resend API error ${res.status}: ${body.slice(0, 300) || res.statusText}`
    );
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return data.id ?? "unknown";
}
