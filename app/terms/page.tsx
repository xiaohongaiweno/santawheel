import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service" },
  description:
    "The rules for using SantaWheel: what the free generator includes, what counts as abuse, and what we can and cannot guarantee about email delivery.",
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
};

const UPDATED = "November 4, 2026";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">What this service is</h2>
          <p className="mt-2 text-muted">
            SantaWheel is a free tool for running a Secret Santa or gift
            exchange: you paste a list of people, we draw the pairs, and each
            person gets their own assignment — either by email or as a private
            link you hand out yourself. By using the site you agree to these
            terms. If you do not agree, please do not use it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">What is free</h2>
          <p className="mt-2 text-muted">
            Creating a draw, drawing names, exclusion rules, email delivery and
            private links are free. A draw supports up to 100 participants.
            Optional paid extras — bulk CSV import, automatic reminders and
            no-repeat draws across years — cost
            $4.99 per draw as a one-time payment, charged through our payment
            provider. It is not a subscription, and nothing renews.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Your responsibilities</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              Only enter details for people who are actually taking part in your
              gift exchange.
            </li>
            <li>
              Tell your group that you are organizing a draw and, in email mode,
              that they will receive one email from SantaWheel.
            </li>
            <li>
              Keep the organizer dashboard link private — it controls the draw
              and can reset it.
            </li>
            <li>
              In private-link mode you hold every participant&apos;s link. Send
              each one only to the person it belongs to, and do not post the
              whole list where the group can see it.
            </li>
            <li>
              You are responsible for the accuracy of the list. We cannot fix a
              mistyped address on your behalf; you can reset the draw and send
              it again.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Acceptable use</h2>
          <p className="mt-2 text-muted">Do not use SantaWheel to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>send unsolicited or bulk email to people who did not join a draw;</li>
            <li>harass, threaten or impersonate anyone;</li>
            <li>
              upload other people&apos;s personal data without their knowledge,
              or any data you have no right to share;
            </li>
            <li>
              probe, scrape, overload or attempt to bypass the service&apos;s
              limits, including automated mass creation of draws.
            </li>
          </ul>
          <p className="mt-2 text-muted">
            Draw creation is rate limited per network, and repeated resends are
            throttled. We may block traffic that abuses the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Email delivery</h2>
          <p className="mt-2 text-muted">
            Emails are sent through a third-party transactional provider. We
            retry failed sends automatically for a period, but we cannot
            guarantee that every message reaches an inbox — spam filters,
            typos and corporate mail servers are outside our control. If an
            email does not arrive, the organizer dashboard can resend it, and
            each participant&apos;s assignment can also be shared as a private
            link.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Availability</h2>
          <p className="mt-2 text-muted">
            The service is provided as-is, without an uptime guarantee. We may
            change, suspend or discontinue features at any time. Draws already
            created remain accessible through their links while the service
            runs, but we recommend keeping your own copy of the participant
            list.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Your content</h2>
          <p className="mt-2 text-muted">
            You keep ownership of the names, addresses and wishlist links you
            enter. You give us permission to store them and to send the emails
            needed to run your draw — nothing more.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Limitation of liability</h2>
          <p className="mt-2 text-muted">
            To the extent permitted by law, SantaWheel is not liable for
            indirect or consequential losses arising from use of the service,
            including a gift that did not arrive, a draw that had to be redone,
            or an email that was filtered as spam. Nothing in these terms
            limits liability that cannot legally be limited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Changes to these terms</h2>
          <p className="mt-2 text-muted">
            We may update these terms as the product changes. The date at the
            top of this page shows the current version; continuing to use the
            site after an update means you accept it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about these terms:{" "}
            <a className="text-accent underline" href="mailto:hello@santawheel.com">
              hello@santawheel.com
            </a>
            . See also our{" "}
            <Link className="text-accent underline" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
