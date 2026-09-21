import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getBrandAssets } from "@/lib/logo";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { logoSrc, logoMarkSrc } = getBrandAssets();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />
    </div>
  );
}
