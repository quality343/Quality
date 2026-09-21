import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Card, Container } from "@/components/ui";
import { getBrandAssets } from "@/lib/logo";

// Authentication screens are not public content.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <div className="py-8">
        <Container className="flex justify-center">
          <BrandLogo
            withHomeLink
            logoSrc={getBrandAssets().logoSrc}
            logoMarkSrc={getBrandAssets().logoMarkSrc}
          />
        </Container>
      </div>
      <main id="main-content" className="flex-1 pb-16">
        <Container className="max-w-md">
          <Card className="p-8">{children}</Card>
        </Container>
      </main>
    </div>
  );
}
