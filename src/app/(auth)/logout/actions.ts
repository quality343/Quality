"use server";

import { signOut } from "@/server/auth/config";
import { getCurrentUser } from "@/lib/auth/guards";
import { recordAuditEventSafe } from "@/lib/audit";

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await recordAuditEventSafe({
      action: "auth.logout",
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
    });
  }
  // JWT strategy: clearing the cookie invalidates the session client-side;
  // server-side revocation arrives with the session-duration hardening pass.
  await signOut({ redirectTo: "/" });
}
