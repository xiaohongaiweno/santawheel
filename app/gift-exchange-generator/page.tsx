import type { Metadata } from "next";
import Link from "next/link";
import DrawForm from "@/components/home/DrawForm";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: { absolute: "Gift Exchange Generator – Free Random Pairing" },
  description:
    "Draw random gift exchange pairs for an office swap, a family draw or a friends' exchange. Free, no sign-up, names only if you prefer — with exclusion rules and private links.",
  alternates: {
    canonical: "/gift-exchange-generator",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "What does the gift exchange generator do?",
    a: "It pairs everyone in your group at random. Each person is assigned one other person to buy a gift for, nobody is assigned themselves, and everybody is assigned exactly once.",
  },
  {
    q: "Do participants need an account or an email address?",
    a: "No account, ever. Email addresses are optional: use email delivery and we message everyone for you, or choose private links and paste names only — we hand you one link per person to send yourself.",
  },
  {
    q: "Can I stop certain people from drawing each other?",
    a: "Yes. Exclude any two people — spouses, roommates, or a manager and their direct reports. Exclusions apply in both directions, and if your rules make a valid draw impossible we say so instead of producing a broken one.",
  },
  {
    q: "Is this a white elephant or yankee swap game?",
    a: "No. Those games are played in a picking order with stealing, and we do not run that format yet. What this does is the draw behind a “buy for one person” exchange, which is what most office swaps and family exchanges actually use.",
  },
  {
    q: "How many people can join a gift exchange?",
    a: "Up to 100 participants per draw, with any number of exclusions. Large groups are drawn in well under a second.",
  },
  {
    q: "Is the pairing really random?",
    a: "Yes. The pairing is generated on our server from a cryptographically secure random source, then checked against every rule before it is saved. Resetting the draw produces a genuinely new pairing, not the same one reshuffled.",
  },
  {
    q: "Can I see who everyone is buying for?",
    a: "In a normal draw the organizer dashboard lists the pairs. If you would rather not know, turn on blind mode when you create the draw: the pairings are then never shown in your dashboard and cannot be exported.",
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
  name: "SantaWheel Gift Exchange Generator",
  alternateName: "Gift Exchange Generator",
  url: "https://santawheel.com/gift-exchange-generator",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free gift exchange generator. Paste your participant list and draw random pairs for an office swap, a family draw or a friends' exchange. No sign-up required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function GiftExchangeGenerator() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Gift Exchange Generator", path: "/gift-exchange-generator" },
        ]}
      />

      {/* Above the fold */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Gift Exchange Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          Draw random pairs for an office swap, a family draw or a friends&apos;
          exchange. Free, no sign-up, and you can skip email addresses entirely.
        </p>
        <div className="mt-6">
          <DrawForm kind="gift-exchange" />
        </div>
      </section>

      {/* Below the fold */}
      <div className="border-t border-border bg-surface">
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
          <section aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-xl font-semibold">
              How a gift exchange draw works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                Paste the group — one name per line, or names with emails if you
                want us to message everyone.
              </li>
              <li>
                Add exclusions if two people should not be paired, then draw.
                Everyone is assigned exactly one person, and nobody gets
                themselves.
              </li>
              <li>
                Deliver it: one email each, or a set of private links you copy
                and send through WhatsApp, Slack, Messenger or a group chat.
              </li>
            </ol>
          </section>

          <section aria-labelledby="office-swaps">
            <h2 id="office-swaps" className="text-xl font-semibold">
              Office gift exchanges
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Department swaps get awkward when someone is paired with their own
              manager, or with the person they carpool with. Add those pairs as
              exclusions and the draw works around them. A hundred-person roster
              is drawn instantly, and remote teammates need nothing installed —
              they just open a link.
            </p>
          </section>

          <section aria-labelledby="family-exchanges">
            <h2 id="family-exchanges" className="text-xl font-semibold">
              Family gift exchanges
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Big families usually need two things: couples who live together
              should not draw each other, and nobody should have to explain how
              to use an app to Grandma. Exclude the couples, set a budget if you
              want one shown with the draw, and choose private links so you can
              text each person their own link.
            </p>
          </section>

          <section aria-labelledby="name-picker">
            <h2 id="name-picker" className="text-xl font-semibold">
              A name picker that respects your rules
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A plain random shuffle is easy to write and easy to get wrong: it
              often produces an invalid pairing, then reruns until something
              sticks — or gives up and reports “no solution” when a valid draw
              exists. This generator instead computes a real one-to-one
              assignment that satisfies every exclusion, and verifies the result
              before saving it. If your rules genuinely make a draw impossible —
              say three people where two may not draw each other — you get a
              clear message instead of a broken pairing.
            </p>
          </section>

          <section aria-labelledby="no-emails">
            <h2 id="no-emails" className="text-xl font-semibold">
              Without collecting email addresses
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Some groups would rather not hand over a list of addresses. Switch
              to private links and we only store names: the draw runs the same
              way, and you get one unguessable link per participant to share
              however your group already talks. Each link opens that
              person&apos;s assignment and nothing else, and resetting the draw
              cancels every link issued before it.
            </p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="text-xl font-semibold">
              FAQ
            </h2>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
              {faqs.map((f) => (
                <details key={f.q} className="px-4 py-3">
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

          <section aria-labelledby="secret-santa">
            <h2 id="secret-santa" className="text-xl font-semibold">
              Running a Secret Santa instead?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If each person buys for one mystery recipient and nobody knows who
              has them, that is a Secret Santa — head to the{" "}
              <Link href="/" className="text-accent underline">
                free Secret Santa generator
              </Link>
              . Same engine, wording that fits the Christmas version.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
