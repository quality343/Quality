import { redirect } from "next/navigation";

/**
 * Staff administration is deferred. Availability is managed through bookable
 * slots (Availability), which is where clinic capacity is actually expressed.
 */
export default function StaffRedirect() {
  redirect("/portal/admin/availability");
}
