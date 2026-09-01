import type { MetadataRoute } from "next";

import { profile, SLUGS } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.siteUrl;
  return [
    { url: base, priority: 1 },
    ...SLUGS.map((slug) => ({ url: `${base}/s/${slug}`, priority: 0.8 })),
    { url: `${base}/work`, priority: 0.6 },
    { url: `${base}/about`, priority: 0.6 },
  ];
}
