import type { Metadata } from "next";
import DrawForm from "@/components/home/DrawForm";
import CopyButton from "@/components/home/CopyButton";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Secret Santa Generator – Free & No Sign-up" },
  description:
    "Paste your list, draw names, and everyone gets their assignment by email. Free secret santa generator — no sign-up, no app, exclusions supported.",
  alternates: {
    canonical: "/",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "Do I need to sign up?",
    a: "No. The generator works without an account. Paste your participants' names and draw — nothing to register and nothing to install.",
  },
  {
    q: "Can I see who drew whom?",
    a: "Yes — as the organizer you see the full list of assignments. Each participant only sees the person they are buying for, so the draw stays secret.",
  },
  {
    q: "Do participants receive an email?",
    a: "Yes. After the draw, every participant automatically gets an email with their assignment. They don't need an account or an app.",
  },
  {
    q: "Can I edit the participant list?",
    a: "Yes, any time before the draw: add, remove, or rename people. Once names are drawn, the result is final and can't be changed.",
  },
  {
    q: "Can I set exclusion rules?",
    a: "Yes. Exclude any two people from drawing each other — for example spouses, roommates, or a manager and their direct reports. Exclusions apply in both directions.",
  },
  {
    q: "How many people can participate?",
    a: "Up to 100 participants per exchange, with any number of exclusions. Large lists are drawn in under a second.",
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
          Secret Santa Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          No sign-up, no app — draw names and everyone gets their assignment by
          email.
        </p>
        <div className="mt-6">
          <DrawForm />
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
                Paste your participants, one name per line. Copy-paste from a
                spreadsheet column works too.
              </li>
              <li>
                Set exclusions if you need them, then generate. Names are drawn
                so nobody picks themselves.
              </li>
              <li>
                Everyone receives their assignment by email automatically. You
                never have to chase anyone.
              </li>
            </ol>
          </section>

          <section aria-labelledby="free-no-signup">
            <h2 id="free-no-signup" className="text-xl font-semibold">
              Free and no sign-up
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              SantaWheel is free and runs in your browser. There is no account
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
