import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Features – Anonymous Q&A, Wishlists, Address Collection & More" },
  description:
    "Everything SantaWheel does: anonymous questions, wishlist sharing, shipping address collection, scheduled draws, join links, exclusion rules, blind mode, private links and email delivery — free, no sign-up.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    url: "/features",
  },
};

const faqs = [
  {
    q: "How do anonymous questions work in a Secret Santa draw?",
    a: "After the draw, every participant gets a private page where they can ask the person they are drawing a question — favourite snacks, clothing sizes, anything. The question is delivered to their recipient by email with a one-click anonymous answer link. Neither side ever sees who asked or who answered, and no organizer can see the messages either.",
  },
  {
    q: "Can participants share their shipping address?",
    a: "Yes. Everyone can add their mailing address from their own assignment page in one click. Only the person drawing them can see it — perfect for remote teams, far-away family, or anyone who wants the gift shipped directly instead of handed over in person.",
  },
  {
    q: "Can I schedule the draw to happen automatically?",
    a: "Yes. While your draw is collecting participants, pick a date and time on your organizer dashboard — for example Friday at 6 pm when everyone is off work. When the time comes, the names are drawn automatically within about 5 minutes and every assignment is emailed. You can cancel or draw manually at any moment before then.",
  },
  {
    q: "Can participants write their own wishlist?",
    a: "Yes. Each participant can type a few gift ideas on their assignment page, one per line, with links welcome. Their Secret Santa sees the list right next to their name, so nobody has to guess.",
  },
  {
    q: "Do participants need an account?",
    a: "No. Participants open a private link from their email or messaging app and see their assignment instantly. There is nothing to install and nothing to sign up for — for organizers either.",
  },
  {
    q: "Is all of this free?",
    a: "Yes. Draws, join links, exclusions, wishlists, anonymous questions, address collection and scheduled draws are all free. An optional $4.99 one-time upgrade per draw removes the watermark and adds CSV import, automatic reminders and no-repeat draws across years.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const features: Array<{
  id: string;
  title: string;
  tagline: string;
  body: string;
}> = [
  {
    id: "anonymous-questions",
    title: "Anonymous Q&A between Santa and their person",
    tagline: "No more guessing what to buy",
    body: "Every participant can ask the person they are drawing questions from their private page — favourite snacks, clothing sizes, hobbies, anything. The question arrives by email with a one-click anonymous answer link, and the answer comes back without anyone learning who asked. Messages stay between the pair; even the organizer never sees them. It is the difference between a gift they politely smile at and one they actually want.",
  },
  {
    id: "address-collection",
    title: "Shipping address collection built in",
    tagline: "Perfect for remote teams and far-away family",
    body: "Participants add their mailing address in one click on their own assignment page. Only their Secret Santa sees it — never the whole group, never the organizer in blind mode. When your team is spread across cities or the family lives on two continents, the gift ships straight to the doorstep with no awkward group-chat address collecting.",
  },
  {
    id: "scheduled-draws",
    title: "Scheduled draws — set it and forget it",
    tagline: "The names draw themselves on your timeline",
    body: "Share your join link, pick a draw time like \"Friday 6 pm\", and walk away. When the time arrives, SantaWheel draws the names automatically — respecting every exclusion — and emails each participant their assignment. Late joiners are included as long as they arrive before the deadline, and you can cancel the schedule or draw manually at any moment.",
  },
  {
    id: "wishlists",
    title: "Self-serve wishlists",
    tagline: "Ideas right where the Santa is looking",
    body: "Each participant types a few gift ideas on their assignment page — one per line, links welcome. Their Secret Santa sees the list right beside their name, along with any external wishlist URL. Nobody has to interrogate anyone, and gifts stop missing the mark.",
  },
  {
    id: "join-links",
    title: "Join links — participants add themselves",
    tagline: "Stop chasing people for their email addresses",
    body: "Instead of pasting a roster, create a collecting draw and share one join link in your group chat. Everyone adds their own name, you watch the list fill up on your dashboard, set exclusions, and draw when the whole group is in — or let a scheduled draw handle it.",
  },
  {
    id: "exclusions",
    title: "Couple & family exclusions",
    tagline: "Spouses, roommates and managers never draw each other",
    body: "Add as many exclusion pairs as you need. Exclusions work in both directions and are respected in every draw — and if your rules make a valid draw impossible, SantaWheel tells you clearly instead of returning a broken result.",
  },
  {
    id: "budget-deadline",
    title: "Budget and exchange day",
    tagline: "Everyone sees the rules without being told twice",
    body: "Set a budget and an exchange day when you create the draw. Both show up on every assignment page and in every assignment email, so nobody has to scroll back through the group chat to remember the limit or the date.",
  },
  {
    id: "delivery",
    title: "Email or private links — your choice",
    tagline: "Works for groups that hate handing over emails",
    body: "Email mode delivers one private assignment link per participant, with automatic retries and resend buttons for anything that bounces. Private-link mode skips email entirely: you paste names only and hand out one unguessable link per person through WhatsApp, Messenger or carrier pigeon.",
  },
  {
    id: "blind-mode",
    title: "Blind mode",
    tagline: "Even you don't know who drew whom",
    body: "Turn on blind mode and the organizer dashboard never shows the pairings — not in the list, not in the CSV, not anywhere. You can still track delivery and resend emails. Participants see only the person they are buying for.",
  },
  {
    id: "reveal",
    title: "Reveal animation",
    tagline: "A little moment of delight on every page",
    body: "Opening an assignment spins a short, tasteful reveal animation before the name appears — because finding out who you are drawing should feel like a moment, not a database row. It respects reduced-motion settings automatically.",
  },
  {
    id: "privacy",
    title: "Privacy by design",
    tagline: "One click removes a person; one click deletes the whole draw",
    body: "Every email carries a one-click remove-my-data link, the organizer can erase the entire draw from the dashboard when the exchange is over, and assignment links die the moment a draw is reset. No accounts, no tracking, no data resale.",
  },
  {
    id: "premium",
    title: "Premium — one-time, not a subscription",
    tagline: "$4.99 once, and this draw is premium forever",
    body: "Import participants in bulk from Excel or CSV, send automatic reminders to anyone who hasn't opened their assignment, and draw with no-repeat memory so pairs from your previous exchanges don't come back. Watermark removed for everyone. Pay once via checkout — no account, no recurring charge.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ]}
      />

      <section className="mx-auto w-full max-w-2xl px-4 pb-8 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Every feature your gift exchange needs
        </h1>
        <p className="mt-3 text-base text-muted">
          SantaWheel draws names like every Secret Santa generator — then keeps
          going: anonymous questions, wishlist sharing, shipping addresses,
          scheduled draws and join links. Free, no sign-up, up to 100 people.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
          <li>Anonymous Q&amp;A</li>
          <li aria-hidden="true">·</li>
          <li>Address collection</li>
          <li aria-hidden="true">·</li>
          <li>Scheduled draws</li>
          <li aria-hidden="true">·</li>
          <li>Wishlists</li>
          <li aria-hidden="true">·</li>
          <li>Join links</li>
        </ul>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            Draw names now — it&apos;s free
          </Link>
        </div>
      </section>

      <div className="border-t border-border bg-surface">
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
          {features.map((f) => (
            <section key={f.id} aria-labelledby={`f-${f.id}`}>
              <h2 id={`f-${f.id}`} className="text-xl font-semibold">
                {f.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-accent">{f.tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </section>
          ))}

          <section aria-labelledby="features-faq">
            <h2 id="features-faq" className="text-xl font-semibold">
              FAQ
            </h2>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
              {faqs.map((f) => (
                <details key={f.q} className="group px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="features-cta">
            <h2 id="features-cta" className="text-xl font-semibold">
              Ready to draw names?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Paste your group or share a join link — the whole draw takes
              under a minute, and {site.name} does the rest.
            </p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Start your free draw
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
