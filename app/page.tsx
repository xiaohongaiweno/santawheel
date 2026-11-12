import type { Metadata } from "next";
import Link from "next/link";
import DrawForm from "@/components/home/DrawForm";
import CopyButton from "@/components/home/CopyButton";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Secret Santa Generator – Free & No Sign-up" },
  description:
    "A free secret santa generator: paste your list, draw names in one click, set exclusion rules, and email every assignment. No sign-up, up to 100 people.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

// ---------- structured data ----------

const faqs: Array<{
  q: string;
  a: string;
  /** Optional inline link rendered inside the visible answer. The JSON-LD
   * answer text stays the plain `a` string, which contains the anchor text
   * verbatim, so visible text and structured data always match. */
  link?: { href: string; anchor: string };
}> = [
  {
    q: "Is SantaWheel free?",
    a: "Yes. Drawing names, exclusion rules and email delivery are free, with no account and no credit card. An optional $4.99 upgrade per draw adds Excel/CSV import, automatic reminders for anyone who hasn't opened their assignment, and no-repeat draws across years.",
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
    q: "Can I ask my Secret Santa person what they want — without revealing myself?",
    a: "Yes. From your assignment page you can send the person you are drawing an anonymous question — favourite snacks, clothing sizes, anything. They answer through a private link, and the answer comes back to you with no names attached. Even the organizer can't read the messages.",
  },
  {
    q: "Can participants share their shipping address for mailed gifts?",
    a: "Yes. Everyone can add a mailing address on their own assignment page, and only the person drawing them sees it. Great for remote teams and family in other cities — the gift ships straight to their door.",
  },
  {
    q: "Can the draw happen automatically at a set time?",
    a: "Yes. While a draw is collecting participants, pick a time like \"Friday 6 pm\" on your dashboard. When it arrives, the names are drawn automatically within about 5 minutes and everyone is emailed their assignment. You can cancel or draw manually any time before then.",
  },
  {
    q: "How long do you keep participant details?",
    a: "Until the draw is removed. There is no automatic expiry yet. Every email includes a one-click link that removes that person's name and email immediately, and the organizer can delete the entire draw from the dashboard once the exchange is over.",
  },
  {
    q: "How many people can take part?",
    a: "Up to 100 participants per draw, with any number of exclusions. Large lists are drawn in under a second.",
  },
  {
    q: "What are the white elephant rules?",
    a: "In white elephant, play moves in a fixed order: the first player can only unwrap a gift, and every later turn is either unwrapping a new present from the pile or stealing one somebody has already opened. A gift is locked once it has been stolen three times, the player whose gift was stolen immediately unwraps a replacement from the pile, and you cannot steal back a gift that was just taken from you. The full white elephant game rules are written up step by step on the rules page.",
    link: { href: "/white-elephant-rules", anchor: "white elephant game rules" },
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
  applicationCategory: "UtilitiesApplication",
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

/** Renders an FAQ answer, swapping the anchor text for a link when present.
 * The surrounding words come from the same `a` string that feeds the JSON-LD,
 * so the visible text stays verbatim identical to the structured data. */
function FaqAnswer({
  a,
  link,
}: {
  a: string;
  link?: { href: string; anchor: string };
}) {
  const i = link ? a.indexOf(link.anchor) : -1;
  if (!link || i < 0) return <>{a}</>;
  return (
    <>
      {a.slice(0, i)}
      <Link href={link.href} className="text-accent underline">
        {link.anchor}
      </Link>
      {a.slice(i + link.anchor.length)}
    </>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />

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
          <li>Free to draw and send</li>
          <li aria-hidden="true">·</li>
          <li>No sign-up</li>
          <li aria-hidden="true">·</li>
          <li>Up to 100 people</li>
          <li aria-hidden="true">·</li>
          <li>Exclusion rules</li>
          <li aria-hidden="true">·</li>
          <li>Blind mode</li>
          <li aria-hidden="true">·</li>
          <li>White elephant mode</li>
          <li aria-hidden="true">·</li>
          <li>
            <Link href="/features" className="underline hover:text-foreground">
              Anonymous Q&amp;A, wishlists &amp; more
            </Link>
          </li>
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
                private link per person and send it yourself. No email for
                someone on your list? Forward their link by WhatsApp or SMS —
                it works in any group chat. You never have to chase anyone.
              </li>
            </ol>
          </section>

          <section aria-labelledby="name-generator">
            <h2 id="name-generator" className="text-xl font-semibold">
              Also a secret santa name generator
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Underneath the gift exchange, this is a secret santa name
              generator: paste the group, press once, and the pairs are made. You
              draw names once — one person to buy for, never yourself, and nobody
              handed out twice. It is a random name picker with the exclusion
              rules already applied, so the result matches pulling paper slips
              out of a hat, only faster.
            </p>
          </section>

          <section aria-labelledby="private-links">
            <h2 id="private-links" className="text-xl font-semibold">
              Draw names without email — use private links
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Not every group wants to hand over contact details — and for a
              family draw, half of them may not check their inbox anyway. With
              SantaWheel you can draw names without collecting email
              addresses: switch to private links, paste names only, and you
              get one unguessable link per person to share however your group
              already talks. Each link opens that person&apos;s assignment and
              nothing else.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Prefer to keep the pairings to yourself as well? Blind mode hides
              them from the organizer dashboard entirely: you can check delivery
              and resend emails, but you never see who drew whom.
            </p>
          </section>

          <section aria-labelledby="free-no-signup">
            <h2 id="free-no-signup" className="text-xl font-semibold">
              An online secret santa website — no app to install
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              SantaWheel is an online secret santa generator that runs
              entirely in your browser: nothing to download, nothing to
              install, and no account. It works on your phone and your
              computer alike. As a secret santa website generator, it is
              always ready when you are — open the page, paste your list, and
              draw names. That is the whole process.
            </p>
          </section>

          <section aria-labelledby="exclusions">
            <h2 id="exclusions" className="text-xl font-semibold">
              Works with exclusions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Some people should not draw each other. Exclude pairs so spouses,
              partners, or a manager and their direct reports never get
              matched. SantaWheel is a secret santa generator with exclusions
              that work in both directions, and if the rules make a draw
              impossible, it tells you clearly instead of giving a wrong
              result.
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
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Writing the invitation? The{" "}
              <Link
                href="/secret-santa-rules"
                className="text-accent underline"
              >
                Secret Santa rules
              </Link>{" "}
              spell out the budget, the exclusions and what to do when someone
              drops out, and the{" "}
              <Link
                href="/secret-santa-gift-ideas"
                className="text-accent underline"
              >
                gift ideas list
              </Link>{" "}
              covers everyone who has not started shopping yet.
            </p>
          </section>

          <section aria-labelledby="for-family">
            <h2 id="for-family" className="text-xl font-semibold">
              Secret Santa for family and friends
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Set a budget, exclude couples who live together, and let the
              draw handle the rest. Grandparents don&apos;t need an account —
              their assignment simply arrives by email. And when the family
              would rather open and steal presents than draw names, the{" "}
              <Link
                href="/white-elephant-generator"
                className="text-accent underline"
              >
                white elephant
              </Link>{" "}
              mode is one click away.
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
            <p className="mt-2 text-sm leading-relaxed text-muted">
              There is a second play mode on the same site for the pile game.
              Instead of pairing people up it draws a picking order and runs the
              turns — open a wrapped present or steal one somebody already
              opened, with a cap on repeat steals. If that is the game your
              group plays, the{" "}
              <Link
                href="/white-elephant-generator"
                className="text-accent underline"
              >
                white elephant generator
              </Link>{" "}
              page runs it. The same game is called{" "}
              <Link
                href="/yankee-swap-generator"
                className="text-accent underline"
              >
                yankee swap
              </Link>{" "}
              in New England and{" "}
              <Link
                href="/dirty-santa-generator"
                className="text-accent underline"
              >
                dirty Santa
              </Link>{" "}
              in the South, and this site has a dedicated page for each. If your
              group argues about house rules first, each variant also has a
              full{" "}
              <Link
                href="/white-elephant-rules"
                className="text-accent underline"
              >
                white elephant rules
              </Link>{" "}
              page — the{" "}
              <Link
                href="/yankee-swap-rules"
                className="text-accent underline"
              >
                yankee swap rules
              </Link>{" "}
              and{" "}
              <Link
                href="/dirty-santa-rules"
                className="text-accent underline"
              >
                dirty Santa rules
              </Link>{" "}
              cover the regional differences, steal caps and kid-friendly
              variations.
            </p>
          </section>

          <section aria-labelledby="messages">
            <h2 id="messages" className="text-xl font-semibold">
              Secret Santa message ideas
            </h2>
            <p className="mt-3 text-sm text-muted">
              Need a secret santa text generator? These short messages are
              ready to copy — send one along with the assignment. Replace the
              placeholders in braces.
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

          <section aria-labelledby="wishlist-qa-address">
            <h2 id="wishlist-qa-address" className="text-xl font-semibold">
              Wishlists, anonymous questions &amp; shipping addresses
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              After the draw, every participant gets a private page where they
              can leave gift ideas, add their shipping address, and{" "}
              <Link href="/features#anonymous-questions" className="text-accent underline">
                ask the person they are drawing anonymous questions
              </Link>{" "}
              — sizes, snacks, hobbies — with answers coming back without
              either side learning who the other is. It is a secret santa
              generator with wish list support built in: givers see the
              wishlist and address right next to the name, so nobody has to
              guess and nobody has to run a separate spreadsheet.
            </p>
          </section>

          <section aria-labelledby="scheduled-draws">
            <h2 id="scheduled-draws" className="text-xl font-semibold">
              Scheduled draws — set it and forget it
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Share a join link, pick a draw time like &quot;Friday 6 pm&quot;
              on your dashboard, and walk away.{" "}
              <Link href="/features#scheduled-draws" className="text-accent underline">
                When the time comes, the names draw themselves
              </Link>{" "}
              — respecting every exclusion — and each participant is emailed
              their assignment. Cancel or draw manually any time before then.
            </p>
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
                    <FaqAnswer a={f.a} link={f.link} />
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
