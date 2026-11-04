import type { Metadata } from "next";
import DrawForm from "@/components/home/DrawForm";
import CopyButton from "@/components/home/CopyButton";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: { absolute: "Gift Exchange Generator – Free Random Pairing" },
  description:
    "Paste your list and draw random pairs for your gift exchange. Free, no sign-up — supports exclusions for white elephant, yankee swap and office gift swaps.",
  alternates: {
    canonical: "/gift-exchange-generator",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "What does the gift exchange generator do?",
    a: "It randomly pairs everyone in your group. Each person draws someone else to give a gift to, and nobody ever draws themselves.",
  },
  {
    q: "Do participants need an account?",
    a: "No. Paste names and draw — nothing to register, nothing to install.",
  },
  {
    q: "Can I stop certain people from drawing each other?",
    a: "Yes. Exclude any two people — spouses, roommates, or a manager and their direct reports. Exclusions apply in both directions, and the draw never breaks them.",
  },
  {
    q: "Can I use it for a white elephant or yankee swap?",
    a: "Yes. Draw who each person is buying for ahead of time, or draw the picking order for the swap itself. The random pairing works for any gift exchange format.",
  },
  {
    q: "How many people can join a gift exchange?",
    a: "Up to 100 participants per draw, with any number of exclusions. Large groups are drawn in under a second.",
  },
  {
    q: "Is the pairing really random?",
    a: "Yes. Every valid pairing is possible, the draw is freshly random each time, and nobody can draw themselves or an excluded person.",
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
  alternateName: "Gift Exchange Generator",
  url: "https://santawheel.com/gift-exchange-generator",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free gift exchange generator. Paste your participant list and draw random pairs for white elephant, yankee swap or office gift exchanges. No sign-up required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const pickingOrderIdeas = [
  "Picking order for the swap: {names in drawn order}. Lowest number picks first — good luck!",
  "You are buying for {name} in our gift exchange. Budget is {amount}. Keep it a surprise until the swap!",
];

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
          No sign-up, no app — paste names and draw random pairs for your gift
          exchange.
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
              How it works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                Paste your participant list, one name per line. Copy-paste from
                a spreadsheet column works too.
              </li>
              <li>
                Add exclusions if some people shouldn&apos;t draw each other,
                then generate. Names are drawn so nobody picks themselves.
              </li>
              <li>
                Share the pairs with your group and start the exchange. Redraw
                as many times as you like.
              </li>
            </ol>
          </section>

          <section aria-labelledby="free-random-pairing">
            <h2 id="free-random-pairing" className="text-xl font-semibold">
              Free random pairing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The generator is free with no limits. No account, no app, nothing
              to pay. Paste your list and get a fresh random draw instantly —
              run it again any time for a new pairing.
            </p>
          </section>

          <section aria-labelledby="exclusions">
            <h2 id="exclusions" className="text-xl font-semibold">
              Works with exclusions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Some people should not draw each other. Exclude pairs so spouses,
              roommates, or a manager and their direct reports never get
              matched. Exclusions work in both directions, and if the rules
              make a draw impossible, the generator tells you clearly instead
              of producing a wrong result.
            </p>
          </section>

          <section aria-labelledby="white-elephant">
            <h2 id="white-elephant" className="text-xl font-semibold">
              For white elephant and yankee swap
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Running a white elephant or yankee swap? Draw the picking order
              for the swap itself, or draw who each person is buying for before
              the party. Either way, the pairing is random and nobody is left
              out.
            </p>
            <div className="mt-4 space-y-3">
              {pickingOrderIdeas.map((msg) => (
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

          <section aria-labelledby="office-swaps">
            <h2 id="office-swaps" className="text-xl font-semibold">
              For office gift swaps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Department-wide swaps, remote teams, big groups — paste your
              roster and draw in one click. Exclusions keep managers and their
              direct reports apart, and the draw handles 100 people in under a
              second.
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
        </div>
      </div>
    </>
  );
}
