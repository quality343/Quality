import { redirect } from "next/navigation";

/**
 * Account provisioning is deferred in this product (there are no portals beyond
 * clinic operations). Staff accounts are created from the operations tooling in
 * a later phase — no empty module is shown in the meantime.
 */
export default function UsersRedirect() {
  redirect("/portal/admin");
}
