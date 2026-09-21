import { redirect } from "next/navigation";

/**
 * Legacy route. No verified clinic photography has been supplied, so this page
 * showed placeholder frames; it now points at the clinic's real information.
 */
export default function GalleryPage() {
  redirect("/about");
}
