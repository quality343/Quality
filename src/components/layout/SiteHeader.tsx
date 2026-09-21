"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button, Container, Icon } from "@/components/ui";
import { CLIENT } from "@/lib/client-info";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/hearing-tests", label: "Hearing Tests" },
  { href: "/hearing-aids", label: "Hearing Aids" },
  { href: "/home-consultation", label: "Home Consultation" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  logoSrc,
  logoMarkSrc,
}: {
  logoSrc?: string | null;
  logoMarkSrc?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Compact + elevate once the page moves, so the hero reads edge-to-edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation and lock body scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-surface/85 shadow-[0_1px_20px_-12px_rgba(16,35,63,0.35)] backdrop-blur-xl"
          : "border-transparent bg-surface/95 backdrop-blur"
      }`}
    >
      <Container
        className={`flex items-center justify-between gap-4 transition-all duration-300 ${
          scrolled ? "h-16" : "h-[4.5rem]"
        }`}
      >
        <BrandLogo withHomeLink logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />

        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-brand-700"
                    : "text-ink-600 hover:bg-surface-muted hover:text-ink-900"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-700 transition-opacity duration-200 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Phone is desktop-wide only; the drawer carries it on smaller screens. */}
          <a
            href={CLIENT.phoneHref}
            className="hidden items-center gap-2 text-sm font-semibold text-ink-700 transition-colors hover:text-brand-700 2xl:flex"
          >
            <Icon name="phone" className="h-4 w-4" />
            {CLIENT.phone}
          </a>
          <Button href="/book-appointment" size="sm" className="btn-lift">
            <Icon name="calendar" className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 xl:hidden"
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </Container>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-surface shadow-lift xl:hidden"
        >
          <Container className="flex flex-col gap-1 py-5">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-base font-medium ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-700 hover:bg-surface-muted"
                  }`}
                >
                  {item.label}
                  <Icon
                    name="arrow-right"
                    className={`h-4 w-4 ${active ? "text-brand-700" : "text-ink-400"}`}
                  />
                </Link>
              );
            })}

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              <Button href="/book-appointment" size="lg" className="btn-lift w-full">
                <Icon name="calendar" className="h-5 w-5" />
                Book Appointment
              </Button>
              <Button
                href="/book-appointment?type=HOME_CONSULTATION"
                variant="secondary"
                size="lg"
                className="btn-lift w-full"
              >
                <Icon name="home" className="h-5 w-5" />
                Home Consultation
              </Button>
              <a
                href={CLIENT.phoneHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold text-brand-700"
              >
                <Icon name="phone" className="h-5 w-5" />
                {CLIENT.phone}
              </a>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
