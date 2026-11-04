import type { Metadata } from "next";
import Link from "next/link";
import DrawForm from "@/components/home/DrawForm";
import CopyButton from "@/components/home/CopyButton";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Secret Santa Generator – Free & No Sign-up" },
  description:
    "Paste your list, draw names, and each person gets their own assignment by email. Free, no account, up to 100 people, with couple and family exclusions.",
  alternates: {
    canonical: "/",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "Is SantaWheel free?",
    a: "Yes. Drawing names, exclusion rules and email delivery are free, with no account and no credit card. An optional $4.99 upgrade per draw removes the watermark, adds Excel/CSV import, automatic reminders and no-repeat draws across years.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. There is nothing to sign up for and nothing to install. Paste your participants, draw, and your organizer dashboard link is emailed to you.",
  },
  {
    q: "Do participants need an email address?",
    a: "Only in email mode. Switch to private links and you paste names alone — we draw the pairs and give you one private link per person to send however you like. Nothing is emailed to participants in that mode.",
  },
  {
    q: "Can people join by themselves?",
    a: "Yes. Instead of pasting a list, tick \"let people join themselves\" and share one join link in your group chat. Everyone adds their own name, you watch the list fill up on your dashboard, set exclusions, and draw the names when everyone is in.",
  },
  {
    q: "Can I stop couples or family members from drawing each other?",
    a: "Yes. Add as many exclusion pairs as you like — partners, roommates, or a manager and their direct reports. Exclusions work in both directions, and the draw is computed to respect all of them at once.",
  },
  {
    q: "Can the organizer see everyone's assignment?",
    a: "In a normal draw, yes: the dashboard lists who drew whom so you can check the draw worked and resend any email. Turn on blind mode instead and the dashboard never shows the pairings — not even to you. Each participant only ever sees the person they are buying for.",
  },
  {
    q: "How are the names drawn?",
    a: "We compute a random one-to-one pairing where nobody draws themselves and no exclusion rule is broken. The result is checked before it is saved, and if your rules make a valid draw impossible we tell you instead of returning a broken one.",
  },
  {
    q: "Can I redraw the names?",
    a: "Yes. Resetting from the organizer dashboard discards the current pairings, invalidates every link already sent, and emails everyone a fresh assignment. A redraw is rate limited so an accidental double click cannot spam your group.",
  },
  {
    q: "Can I resend an assignment email?",
    a: "Yes. Every participant row on the organizer dashboard has a Resend button, and it shows whether the earlier attempt was sent, pending or failed.",
  },
  {
    q: "How long do you keep participant details?",
    a: "Until the draw is removed. There is no automatic expiry yet. Every email includes a one-click link that removes that person's name and email immediately, and the organizer can delete the entire draw from the dashboard once the exchange is over.",
  },
  {
    q: "How many people can take part?",
    a: "Up to 100 participants per draw, with any number of exclusions. Large lists are drawn in under a second.",
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

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SantaWheel",
  alternateName: "Secret Santa Generator",
  url: site.url,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free secret santa generator. Paste your participants list, draw names, and everyone receives their assignment by email. No sign-up required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const messageIdeas = [
  "You drew {name} for Secret Santa! Keep it a secret until the exchange. Budget: {amount}. Check their wishlist for ideas — happy gifting!",
  "Secret Santa time! Your person is {name}. The budget is {amount}, and their wishlist is attached. Remember: tell no one.",
];

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }]} />

      {/* Above the fold: subtitle + form. LCP element is the textarea. */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Free Secret Santa Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          Paste your group, draw names in one click, and everyone gets their own
          private assignment — by email, or as a link you hand out yourself. No
          account, no app, no chasing people.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
          <li>Free forever</li>
          <li aria-hidden="true">·</li>
          <li>No sign-up</li>
          <li aria-hidden="true">·</li>
          <li>Up to 100 people</li>
          <li aria-hidden="true">·</li>
          <li>Exclusion rules</li>
          <li aria-hidden="true">·</li>
          <li>Blind mode</li>
        </ul>
        <div className="mt-6">
          <DrawForm kind="secret-santa" />
        </div>
      </section>

      {/* Below the fold */}
      <div className="border-t border-border bg-surface">
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
          <section aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-xl font-semibold">
              How it works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                Paste your participants, one per line — names with emails, or
                just names if you would rather hand out links yourself.
                Copy-paste from a spreadsheet works too.
              </li>
              <li>
                Set exclusions if you need them, then draw. Names are paired so
                nobody picks themselves and no exclusion rule is broken.
              </li>
              <li>
                Everyone receives their assignment by email, or you copy one
                private link per person and send it through WhatsApp or
                Messenger. You never have to chase anyone.
              </li>
            </ol>
          </section>

          <section aria-labelledby="private-links">
            <h2 id="private-links" className="text-xl font-semibold">
              No email addresses? Use private links
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Not every group wants to hand over email addresses — and for a
              family draw, half of them may not check their inbox anyway. Switch
              to private links, paste names only, and you get one unguessable
              link per person to share however your group already talks. Each
              link opens that person&apos;s assignment and nothing else.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Prefer to keep the pairings to yourself as well? Blind mode hides
              them from the organizer dashboard entirely: you can check delivery
              and resend emails, but you never see who drew whom.
            </p>
          </section>

          <section aria-labelledby="free-no-signup">
            <h2 id="free-no-signup" className="text-xl font-semibold">
              Free and no sign-up
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              SantaWheel is free to use with no account. There is no sign-up
              to create, nothing to install, and no credit card. Paste your
              list and draw names — that is the whole process.
            </p>
          </section>

          <section aria-labelledby="exclusions">
            <h2 id="exclusions" className="text-xl font-semibold">
              Works with exclusions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Some people should not draw each other. Exclude pairs so spouses,
              partners, or a manager and their direct reports never get
              matched. Exclusions work in both directions, and if the rules
              make a draw impossible, the generator tells you clearly instead
              of giving a wrong result.
            </p>
          </section>

          <section aria-labelledby="for-coworkers">
            <h2 id="for-coworkers" className="text-xl font-semibold">
              Secret Santa for coworkers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Office gift exchanges get big fast. Paste your team roster,
              exclude managers and their reports if needed, and generate in one
              click. Participants join by email, so remote teammates are
              covered without any installs.
            </p>
          </section>

          <section aria-labelledby="for-family">
            <h2 id="for-family" className="text-xl font-semibold">
              Secret Santa for family and friends
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Set a budget, exclude couples who live together, and let the
              draw handle the rest. Grandparents don&apos;t need an account —
              their assignment simply arrives by email.
            </p>
          </section>

          <section aria-labelledby="gift-exchange">
            <h2 id="gift-exchange" className="text-xl font-semibold">
              Gift exchange, not Secret Santa?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The same draw also runs a general gift exchange — an office swap,
              a friends&apos; yankee swap, a family draw where everybody buys for
              everybody. If that is what you are organizing, start from the{" "}
              <Link
                href="/gift-exchange-generator"
                className="text-accent underline"
              >
                gift exchange generator
              </Link>{" "}
              page: same engine, wording that fits a swap rather than a Secret
              Santa.
            </p>
          </section>

          <section aria-labelledby="messages">
            <h2 id="messages" className="text-xl font-semibold">
              Secret Santa message ideas
            </h2>
            <p className="mt-3 text-sm text-muted">
              Short messages you can send along with the assignment. Replace
              the placeholders in braces.
            </p>
            <div className="mt-4 space-y-3">
              {messageIdeas.map((msg) => (
                <div
                  key={msg.slice(0, 24)}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <p className="text-sm leading-relaxed">{msg}</p>
                  <div className="mt-3">
                    <CopyButton text={msg} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="text-xl font-semibold">
              FAQ
            </h2>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
              {faqs.map((f) => (
                <details key={f.q} className="group px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
