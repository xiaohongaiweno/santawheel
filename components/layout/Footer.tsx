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
      </div>
    </footer>
  );
}
