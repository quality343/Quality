/**
 * JSON helpers for columns that store encoded text.
 *
 * Turso (libSQL/SQLite) has no `Json` column type in Prisma, so fields that used
 * to be real JSON — test/audiogram payloads, report content, audit metadata —
 * are text. This decoder is the read-side counterpart to `JSON.stringify()`.
 *
 * It deliberately tolerates input that is already decoded, because a value may
 * arrive either straight from the database (text) or from an earlier decode
 * (object), and callers should not have to care which.
 */
export function parseJsonSafe(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    // Malformed or legacy data must not crash a page render.
    return null;
  }
}
