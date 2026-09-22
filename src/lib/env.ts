import { z } from "zod";
import { PRODUCTION_SITE_URL } from "./site-url";

/**
 * Server-side environment access. Import `serverEnv` only from server code
 * (route handlers, server actions, services) — never from client components.
 * Client-visible values must be explicitly listed in `publicEnv` below.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32).optional(), // required from Phase 1
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default(PRODUCTION_SITE_URL),
});

const parsedServer = serverSchema.safeParse(process.env);
if (!parsedServer.success) {
  // Fail fast with a readable message rather than mysterious runtime errors.
  console.error(
    "Invalid server environment variables:",
    parsedServer.error.flatten().fieldErrors,
  );
}

export const serverEnv = parsedServer.success
  ? parsedServer.data
  : ({ DATABASE_URL: process.env.DATABASE_URL ?? "", NODE_ENV: process.env.NODE_ENV ?? "development" } as z.infer<typeof serverSchema>);

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
