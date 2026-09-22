/**
 * Canonical origin of the public website (single source of truth).
 *
 * Used for canonical tags, Open Graph URLs, sitemap.xml, robots.txt and the
 * absolute media URLs in structured data. It is inlined at BUILD time, so
 * changing it means redeploying — not restarting the server.
 *
 * The fallback is the clinic's real domain rather than `localhost`: a build
 * that somehow misses NEXT_PUBLIC_SITE_URL should still hand search engines a
 * reachable origin instead of `http://localhost:3000`. Set the variable only to
 * override it in a different environment (a preview deploy, for example).
 */
export const PRODUCTION_SITE_URL = "https://qualityhearingcarepro.in";

/** Origin with any trailing slash removed, ready to concatenate a path. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_SITE_URL
).replace(/\/+$/, "");
