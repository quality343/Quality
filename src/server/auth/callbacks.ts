import type { UserRole } from "@/lib/rbac/roles";

/**
 * JWT/session callbacks — dependency-free so both the Node runtime auth config
 * and the edge middleware can import them. Parameter types are structural
 * minimums; Auth.js's rich generics assign into them cleanly.
 */
export const jwtCallback = (params: {
  token: Record<string, unknown>;
  user?: { role?: UserRole; phone?: string | null } | null;
  trigger?: "signIn" | "signUp" | "update";
  session?: { name?: string; phone?: string } | null;
}): Record<string, unknown> => {
  const { token, user, trigger, session } = params;
  if (user) {
    token.role = user.role;
    token.phone = user.phone ?? null;
  }
  if (trigger === "update" && session) {
    if (typeof session.name === "string") token.name = session.name;
    if (typeof session.phone === "string") token.phone = session.phone;
  }
  return token;
};

export const sessionCallback = (params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  token: { sub?: string; role?: UserRole; phone?: string | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
  const { session, token } = params;
  if (session?.user) {
    session.user.id = token.sub ?? "";
    session.user.role = token.role;
    session.user.phone = token.phone ?? null;
  }
  return session;
};
