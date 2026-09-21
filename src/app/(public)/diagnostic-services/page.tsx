import { redirect } from "next/navigation";

/**
 * Legacy clinical-scope route.
 *
 * Diagnostics are part of the service catalogue now, which is the single
 * source of truth for what the clinic offers. This URL is kept working and
 * permanently points there instead of hardcoding a second, unconfirmed list.
 */
export default function DiagnosticServicesPage() {
  redirect("/hearing-tests");
}
