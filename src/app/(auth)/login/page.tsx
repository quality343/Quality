import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/auth/guards";
import { portalHomeFor } from "@/lib/auth/portal-home";
import { CLIENT } from "@/lib/client-info";

// Internal sign-in page — never indexed, never linked from the public site.
export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in → straight to the correct portal.
  const user = await getCurrentUser();
  if (user) redirect(portalHomeFor(user.role));

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-ink-900">Staff sign-in</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        For {CLIENT.name} clinic staff — appointments, availability, services and
        enquiries.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 rounded-lg bg-surface-muted p-3 text-xs leading-relaxed text-ink-500">
        Looking to reach the clinic? No account is needed —{" "}
        <Link
          href="/home-consultation"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          request a home consultation
        </Link>{" "}
        or call{" "}
        <a href={CLIENT.phoneHref} className="font-semibold text-brand-700">
          {CLIENT.phone}
        </a>
        .
      </p>

      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        Locked out or need an account? Staff accounts are created by the clinic —
        call {CLIENT.phone} or email{" "}
        <a href={`mailto:${CLIENT.email}`} className="font-semibold text-brand-700">
          {CLIENT.email}
        </a>
        .
      </p>
    </div>
  );
}
