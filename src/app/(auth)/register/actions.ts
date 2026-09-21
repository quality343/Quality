"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { registerPatient } from "@/server/services/registration";
import { signIn } from "@/server/auth/config";
import { portalHomeFor } from "@/lib/auth/portal-home";

export type RegisterActionState = {
  errors?: Record<string, string>;
};

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const hdrs = await headers();
  const requestMeta = {
    ip: hdrs.get("x-forwarded-for") ?? undefined,
    userAgent: hdrs.get("user-agent") ?? undefined,
  };

  const result = await registerPatient(
    {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    },
    requestMeta,
  );

  if (!result.ok) {
    return { errors: result.errors };
  }

  // Sign the freshly-registered patient in, then send them to their dashboard.
  try {
    await signIn("credentials", {
      identifier: String(formData.get("email")),
      password: String(formData.get("password")),
      redirectTo: portalHomeFor("PATIENT"),
    });
  } catch (error) {
    // signIn throws NEXT_REDIRECT after setting the cookie — that is success.
    if (error instanceof AuthError) {
      // Extremely unlikely right after creation; fall back to the login page.
      redirect("/login?registered=1");
    }
    throw error;
  }

  // Unreachable (signIn/redirect always throw), but keeps TypeScript honest.
  return {};
}
