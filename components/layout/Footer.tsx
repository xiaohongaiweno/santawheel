import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{site.name}</p>
          <p className="mt-1 text-sm text-muted">
            © {year} {site.name}. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            Secret Santa Generator
          </Link>
          <Link
            href="/gift-exchange-generator"
            className="text-muted hover:text-foreground"
          >
            Gift Exchange Generator
          </Link>
          <Link
            href="/white-elephant-generator"
            className="text-muted hover:text-foreground"
          >
            White Elephant Generator
          </Link>
          <Link
            href="/yankee-swap-generator"
            className="text-muted hover:text-foreground"
          >
            Yankee Swap Generator
          </Link>
          <Link
            href="/dirty-santa-generator"
            className="text-muted hover:text-foreground"
          >
            Dirty Santa Generator
          </Link>
          <Link href="/features" className="text-muted hover:text-foreground">
            Features
          </Link>
          <Link href="/privacy" className="text-muted hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted hover:text-foreground">
            Terms
          </Link>
          <a href={`mailto:hello@santawheel.com`} className="text-muted hover:text-foreground">
            Contact
          </a>
          <a href="/sitemap.xml" className="text-muted hover:text-foreground">
            Sitemap
          </a>
        </nav>
        <a
          href="https://getbannerbid.com/directory"
          target="_blank"
          rel="noopener"
        >
          <img
            src="https://getbannerbid.com/badges/listed-dark.svg"
            alt="Listed on GetBannerBid"
            width={200}
            height={54}
            loading="lazy"
          />
        </a>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-4">
        <a
          href="https://fazier.com"
          target="_blank"
          rel="noopener"
          aria-label="Featured on Fazier"
        >
          <img
            src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light"
            alt="Featured on Fazier"
            width={120}
            height={40}
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  );
}
