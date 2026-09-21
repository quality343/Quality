import { redirect } from "next/navigation";

/**
 * Legacy clinical-scope route — folded into the database-driven service
 * catalogue (single source of truth) rather than duplicated as hardcoded copy.
 */
export default function CochlearImplantPage() {
  redirect("/services");
}
