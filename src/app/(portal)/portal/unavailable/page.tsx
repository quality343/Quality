import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PortalSignOut } from "@/components/layout/PortalSignOut";
import { requireAuth } from "@/lib/auth/guards";
import { isClinicOpsRole } from "@/lib/auth/portal-home";
import { ROLE_LABEL } from "@/lib/auth/role-labels";
import { CLIENT } from "@/lib/client-info";

export const metadata = { title: "Portal not available" };

/**
 * Landing page for signed-in users whose portal is deferred in this release
 * (patient accounts, clinical records, therapy, platform administration).
 * It states the product scope plainly and offers the paths that DO exist —
 * no dead dashboards, no invented features.
 */
export default async function DeferredPortalPage() {
  const user = await requireAuth();
  const clinicOps = isClinicOpsRole(user.role);

  return (
    <div className="mx-auto max-w-xl py-4">
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {ROLE_LABEL[user.role]} account
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
          This portal is not part of the current release
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          QUALITY Hearing Care currently runs as a public clinic website with
          online appointment booking and a single clinic-operations portal.
          Clinical records, therapy, patient accounts and platform
          administration are deferred — your account is intact, but there is
          nothing for it to open yet.
        </p>

        <div className="mt-6 space-y-2">
          <Link
            href="/book-appointment"
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Book an appointment
          </Link>
          {clinicOps ? (
            <Link
              href="/portal/admin"
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-ink-700 hover:border-brand-300"
            >
              Open clinic operations
            </Link>
          ) : null}
          <Link
            href="/"
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-ink-700 hover:border-brand-300"
          >
            Back to the website
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-500">
          Need something changed on your account? Call{" "}
          <a href={CLIENT.phoneHref} className="font-semibold text-brand-700">
            {CLIENT.phone}
          </a>{" "}
          or email{" "}
          <a href={`mailto:${CLIENT.email}`} className="font-semibold text-brand-700">
            {CLIENT.email}
          </a>
          .
        </p>

        <div className="mt-6 border-t border-border pt-4">
          <PortalSignOut />
        </div>
      </Card>
    </div>
  );
}
