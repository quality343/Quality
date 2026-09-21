import { redirect } from "next/navigation";

/**
 * Clinical and organisational reporting belongs to the deferred clinical
 * module. The clinic's operational numbers live on the dashboard.
 */
export default function ReportsRedirect() {
  redirect("/portal/admin");
}
