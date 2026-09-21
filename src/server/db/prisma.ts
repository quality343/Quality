import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

/**
 * Database client — Turso, reached through Prisma's libSQL driver adapter.
 *
 * Turso is libSQL (SQLite-compatible), which is why the schema no longer uses
 * enums, `Json` columns or PostgreSQL native types. See docs/DATABASE.md.
 *
 * Two connection shapes are supported:
 * - `libsql://…turso.io` (or `https://…`) with `TURSO_AUTH_TOKEN` — Turso Cloud,
 *   used in production and for shared development;
 * - `file:./local.db` with no token — a local scratch database, useful for
 *   offline work and for generating SQL without touching the real data.
 *
 * The URL and token are read from the environment only. Nothing here is
 * hardcoded, and neither value is ever exposed to the browser (no NEXT_PUBLIC_
 * prefix), because the token grants read-write access to the clinic's data.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Locally, copy .env.example to .env and fill in the " +
        "Turso values; on Netlify, add them under Site configuration → Environment variables. " +
        "See docs/DEPLOYMENT.md.",
    );
  }

  const isLocalFile = url.startsWith("file:");
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!isLocalFile && !authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is not set, but TURSO_DATABASE_URL points at a remote Turso database. " +
        "Both values are required together.",
    );
  }

  const adapter = new PrismaLibSQL(authToken ? { url, authToken } : { url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across hot reloads in development instead of opening a new
// connection on every render.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
