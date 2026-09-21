"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/server/auth/config";
import { getCurrentUser } from "@/lib/auth/guards";
import { portalHomeFor } from "@/lib/auth/portal-home";

export type LoginActionState = {
  error?: "credentials" | "inactive" | "generic";
  identifier?: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "credentials", identifier };
  }

  try {
    await signIn("credentials", { identifier, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // One generic message for wrong identifier / wrong password / inactive
      // (see authorize()): prevents user enumeration.
      return { error: "credentials", identifier };
    }
    throw error;
  }

  // Redirect server-side based on the DB-backed role — never client-supplied.
  const user = await getCurrentUser();
  redirect(user ? portalHomeFor(user.role) : "/login");
}
