import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * lastModified is the real content-change date of each page (not the build
 * date). Only bump a page's date when its content actually changes — an
 * untouched page must keep its timestamp across builds.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: "2026-11-12",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${site.url}/features`,
      lastModified: "2026-11-09",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/gift-exchange-generator`,
      lastModified: "2026-11-12",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/white-elephant-rules`,
      lastModified: "2026-11-08",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/yankee-swap-rules`,
      lastModified: "2026-11-05",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/dirty-santa-rules`,
      lastModified: "2026-11-09",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/dirty-santa-rules/printable`,
      lastModified: "2026-11-10",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/white-elephant-generator`,
      lastModified: "2026-11-12",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/yankee-swap-generator`,
      lastModified: "2026-11-05",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${site.url}/dirty-santa-generator`,
      lastModified: "2026-11-09",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${site.url}/secret-santa-rules`,
      lastModified: "2026-11-08",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/secret-santa-gift-ideas`,
      lastModified: "2026-11-08",
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${site.url}/white-elephant-gift-ideas`,
      lastModified: "2026-11-08",
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: "2026-11-05",
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${site.url}/terms`,
      lastModified: "2026-11-05",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
