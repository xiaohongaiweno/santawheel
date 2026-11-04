import { site } from "@/lib/site";

/**
 * Site-wide Organization + WebSite structured data.
 * Rendered once in the root layout so every page carries it.
 * Note: deliberately no SearchAction (the site has no search results page)
 * and no aggregateRating (we never fabricate reviews).
 */
export default function SiteJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      inLanguage: site.lang,
      publisher: { "@type": "Organization", name: site.name, url: site.url },
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
