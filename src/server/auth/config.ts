import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { loginSchema, isEmailIdentifier } from "@/lib/validation/auth";
import { recordAuditEventSafe } from "@/lib/audit";
import { jwtCallback, sessionCallback } from "@/server/auth/callbacks";

/** bcrypt cost factor for password hashing (see src/server/auth/password.ts). */
export const BCRYPT_ROUNDS = 12;
/**bcrypt hash of a random string — used to equalize timing when the user row
 * doesn't exist (prevents user-enumeration via response timing). */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.6uIz3lFVSdN0AmBBy0QulnFvU0ZPBhO";

export const providers: Provider[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      identifier: { label: "Email or mobile number" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { identifier, password } = parsed.data;
      const viaEmail = isEmailIdentifier(identifier);

      const user = await prisma.user.findFirst({
        where: viaEmail ? { email: identifier } : { phone: identifier },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          passwordHash: true,
        },
      });

      // Same generic failure for unknown identifier vs wrong password; the
      // dummy compare keeps timing roughly constant.
      const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) {
        await recordAuditEventSafe({
          action: "auth.login.failure",
          entityType: "User",
          metadata: { via: viaEmail ? "email" : "phone" },
          ip: request?.headers?.get("x-forwarded-for") ?? undefined,
          userAgent: request?.headers?.get("user-agent") ?? undefined,
        });
        return null;
      }

      if (!user.isActive) {
        await recordAuditEventSafe({
          action: "auth.login.blocked_inactive",
          entityType: "User",
          entityId: user.id,
          ip: request?.headers?.get("x-forwarded-for") ?? undefined,
          userAgent: request?.headers?.get("user-agent") ?? undefined,
        });
        return null;
      }

      await recordAuditEventSafe({
        action: "auth.login.success",
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        ip: request?.headers?.get("x-forwarded-for") ?? undefined,
        userAgent: request?.headers?.get("user-agent") ?? undefined,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as UserRole,
      };
    },
  }),
];

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    jwt: jwtCallback as NextAuthConfig["callbacks"] extends { jwt: infer T } ? T : never,
    session: sessionCallback as NextAuthConfig["callbacks"] extends { session: infer T }
      ? T
      : never,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
