import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * Private surfaces are disallowed here *and* marked `noindex` on the pages
 * themselves — robots.txt is advisory and never the only control.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/", "/api/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
