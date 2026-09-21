import { redirect } from "next/navigation";

/**
 * Legacy route. Brands are read from the catalogue, which only publishes
 * client-approved products — so there is no separate brand list to maintain.
 */
export default function HearingAidBrandsPage() {
  redirect("/hearing-aids");
}
