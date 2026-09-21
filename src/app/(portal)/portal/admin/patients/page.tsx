import { redirect } from "next/navigation";

/**
 * Patient records are not a module in this product. Contact details for guests
 * and registered patients are searched from the appointments worklist (by name,
 * mobile or appointment number), so old links land there instead of an empty
 * stand-in page.
 */
export default function PatientsRedirect() {
  redirect("/portal/admin/appointments");
}
