import type { MetadataRoute } from "next";

/**
 * Private surfaces are disallowed here *and* marked `noindex` on the pages
 * themselves — robots.txt is advisory and never the only control.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal/",
          "/api/",
          "/login",
          "/booking/",
          "/booking-lookup",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
