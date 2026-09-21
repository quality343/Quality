import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

/**
 * Prisma client for CLI scripts — the same libSQL adapter the application uses.
 *
 * Scripts must not call `new PrismaClient()` on its own any more: without the
 * adapter the client falls back to the datasource URL (`file:./dev.db`) and
 * silently queries an empty local file instead of Turso. That failure mode looks
 * like "table does not exist", which is easy to misread as a missing migration.
 *
 * Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from the environment (or .env).
 */
export function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set. See docs/DEPLOYMENT.md.");
  }
  if (!url.startsWith("file:") && !authToken) {
    throw new Error("TURSO_AUTH_TOKEN is not set, but TURSO_DATABASE_URL is remote.");
  }

  return new PrismaClient({
    adapter: new PrismaLibSQL(authToken ? { url, authToken } : { url }),
  });
}
