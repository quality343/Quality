import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Display face for headings: warmer and more premium than Inter alone.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
});

// TODO: set canonical production URL via NEXT_PUBLIC_SITE_URL at deploy time.
export const metadata: Metadata = {
  title: {
    default: "QUALITY Hearing Care — JOY OF HEARING",
    template: "%s · QUALITY Hearing Care",
  },
  description:
    "Hearing tests, hearing aids and home consultations at QUALITY Hearing Care — a professional hearing clinic in Kukatpally (KPHB), Hyderabad.",
  openGraph: {
    siteName: "QUALITY Hearing Care",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable}`}>
        {/* Scroll-reveal content stays visible when scripts are unavailable. */}
        <noscript>
          <style>{`.reveal-init{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
