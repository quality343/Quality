/**
 * Minimal fixed-window rate limiter (in-memory, per instance).
 *
 * SCOPE: adequate for a single-instance clinic deployment. Multi-instance
 * deployments should swap this for a shared store (e.g. Redis) — the call
 * sites only depend on `hit()` returning whether the request is allowed.
 * Not a substitute for an edge/CDN-level WAF in production.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Record a hit for `key`; returns false when the window quota is exceeded. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client identity for rate limiting (never logged with PII). */
export function clientKey(request: Request, scope: string): string {
  const fwd =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${fwd}`;
}

/** Occasionally drop expired buckets so the map cannot grow unbounded. */
export function sweep(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
