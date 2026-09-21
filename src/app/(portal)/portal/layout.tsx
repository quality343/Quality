import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";

// Every portal page contains staff or patient data: never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Portal root: guards the whole /portal subtree server-side (defense in depth
 * alongside middleware). Role-area layouts below render the real shell.
 */
export default async function PortalRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAuth();
  return <>{children}</>;
}
