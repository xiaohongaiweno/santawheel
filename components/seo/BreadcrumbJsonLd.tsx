import { site } from "@/lib/site";

interface Crumb {
  name: string;
  path: string;
}

/**
 * BreadcrumbList JSON-LD. Renders an invisible <span> wrapper; the structured
 * data mirrors the site's real navigation (Header logo -> home).
 */
export default function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.path === "/" ? site.url : `${site.url}${c.path}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
