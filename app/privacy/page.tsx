import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy" },
  description:
    "What SantaWheel stores when you run a Secret Santa draw, which services process it, and how to have your data removed.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "November 4, 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">The short version</h2>
          <p className="mt-2 text-muted">
            SantaWheel runs Secret Santa and gift exchange draws. In email mode
            we store the names and email addresses of the people in your draw
            and send each of them one email with a private link. In private-link
            mode we store names only — nobody is emailed, and you hand out the
            links yourself. We do not sell data, we do not run advertising
            trackers, and there are no user accounts to sign up for.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <strong>Participant names</strong> — always, because the draw needs
              to know who is taking part.
            </li>
            <li>
              <strong>Participant email addresses</strong> — only in email mode,
              where they are how each person receives their assignment. In
              private-link mode no participant email address is collected at
              all.
            </li>
            <li>
              <strong>Optional wishlist URL</strong> — only if you add one for a
              participant.
            </li>
            <li>
              <strong>Optional wishlist text, shipping address and anonymous
              Q&amp;A</strong> — participants can add these themselves from
              their assignment page. A wishlist or address is shown only to the
              one person drawing them; anonymous questions are visible only to
              the asking pair, with no names attached, and the organizer cannot
              read any of them. All of it is deleted when the participant
              removes their data or the draw is reset or erased.
            </li>
            <li>
              <strong>Organizer email</strong> — used to send you the organizer
              dashboard link. It is optional in private-link mode, where the
              dashboard link is shown to you once at the end instead.
            </li>
            <li>
              <strong>Draw details</strong> — the draw title, optional budget and
              deadline, the delivery mode, whether blind mode is on, and the
              exclusion rules you set.
            </li>
            <li>
              <strong>Delivery records</strong> — in email mode, whether each
              assignment email was sent, when it was first opened, and the error
              message if a send failed.
            </li>
            <li>
              <strong>IP address</strong> — stored with each draw purely to rate
              limit abuse. It is not used for analytics or profiling.
            </li>
            <li>
              <strong>Payment reference</strong> — if you upgrade a draw, we
              store the payment provider&apos;s order reference and whether it
              was a test or live payment. We never see or store card numbers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Why we need names and emails</h2>
          <p className="mt-2 text-muted">
            The draw pairs people up. In email mode the email address is how each
            person receives their own assignment without the organizer having to
            forward anything, and it is also what makes a participant unique in
            a draw. In private-link mode we skip email entirely: the draw only
            needs names, and each person receives a link from the organizer.
            Either way we do not use these addresses for marketing and we do not
            add anyone to a mailing list.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Private links and blind mode</h2>
          <p className="mt-2 text-muted">
            An assignment link is not a database record you can guess your way
            into. Each link carries a signed token that only our server can
            produce, bound to one draw, one participant and one draw round, and
            verified on every request. No token is stored in readable form, and
            results are never put in a URL parameter. Restarting a draw
            invalidates every link issued for the previous round.
          </p>
          <p className="mt-2 text-muted">
            Blind mode is a draw setting for organizers who do not want to see
            the pairings. When it is on, the organizer dashboard never loads or
            renders who drew whom, and the pairing export is disabled. What it
            does not do — and we would rather say this plainly — is hide an
            individual assignment from someone who opens that person&apos;s own
            link. Blind mode is only offered with email delivery, never with
            private links, because in private-link mode the organizer holds
            every link by definition.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">How the emails are sent</h2>
          <p className="mt-2 text-muted">
            In email mode, assignment emails are delivered through{" "}
            <a
              className="text-accent underline"
              href="https://resend.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Resend
            </a>
            , a transactional email service, from the address{" "}
            <span className="whitespace-nowrap">draw@santawheel.com</span>. Resend
            receives the recipient address and the message body. Every email
            contains a one-click link that removes the recipient&apos;s data. In
            private-link mode nothing is sent to participants, so no participant
            address reaches Resend.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Where data is stored</h2>
          <p className="mt-2 text-muted">
            Draw data lives in a Postgres database hosted by{" "}
            <a
              className="text-accent underline"
              href="https://supabase.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Supabase
            </a>
            . The site is served by{" "}
            <a
              className="text-accent underline"
              href="https://vercel.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Vercel
            </a>
            . Premium upgrades are processed by Waffo, which handles the payment
            page and card details directly. These providers process data on our
            behalf and are bound by their own privacy terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cookies and analytics</h2>
          <p className="mt-2 text-muted">
            SantaWheel does not set cookies and does not embed third-party
            trackers or analytics. Nothing is written to your browser&apos;s
            local storage — the site works without it. If we add analytics
            later, this policy will say so before it goes live.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">How long we keep it</h2>
          <p className="mt-2 text-muted">
            Draws stay in the database until they are removed. There is
            currently no automatic expiry — we would rather tell you that than
            promise a deletion schedule we have not built yet. You are not stuck
            waiting for one: the organizer can delete the whole draw at any time
            from their dashboard, and participants can remove themselves from
            any assignment email. When an organizer resets a draw, participants
            who removed themselves are permanently deleted at that point.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Removing your data</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <strong>Participants</strong> — every assignment email has a
              &ldquo;Remove your data&rdquo; link, and the same button appears on
              your assignment page. It immediately replaces your name and email
              with placeholders and cancels any pending mail to you.
            </li>
            <li>
              <strong>Organizers</strong> — open your dashboard and use{" "}
              <strong>Delete this draw</strong> at the bottom of the page. It
              erases the draw, every participant name and email address, the
              pairings and the delivery history immediately, and every link
              issued for that draw stops working. You can also email{" "}
              <a className="text-accent underline" href="mailto:hello@santawheel.com">
                hello@santawheel.com
              </a>{" "}
              and we will remove it for you.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Children</h2>
          <p className="mt-2 text-muted">
            SantaWheel is not directed at children under 13, and we do not
            knowingly collect their personal information. A parent or guardian
            can ask us to delete a child&apos;s details at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Changes</h2>
          <p className="mt-2 text-muted">
            If this policy changes in a way that affects what we store or who we
            share it with, we will update the date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about privacy:{" "}
            <a className="text-accent underline" href="mailto:hello@santawheel.com">
              hello@santawheel.com
            </a>
            . See also our{" "}
            <Link className="text-accent underline" href="/terms">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
