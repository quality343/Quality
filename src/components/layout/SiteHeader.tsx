"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SocialIcon } from "@/components/brand/SocialIcons";
import { Button, Container, Icon } from "@/components/ui";
import { CLIENT, homeConsultationHref, WHATSAPP } from "@/lib/client-info";

/**
 * Primary navigation.
 *
 * Hearing tests and hearing aids are *services*, not separate destinations, so
 * they live under Services rather than beside it. Both keep their own routes
 * and pages — this only changes where they are listed.
 *
 * The clinic no longer takes online bookings, so the header's single action is
 * the contact route: WhatsApp. The number is labelled, never a bare icon, so it
 * is obvious where a tap leads.
 *
 * The desktop dropdown is stateful rather than CSS-only. Hover and focus only
 * *set* the open panel; it is cleared on selection, on route change, on an
 * outside click and on Escape. The earlier pure-CSS version (`group-hover` +
 * `group-focus-within`) could not be closed on navigation: the pointer was
 * still parked over the panel's slot and the clicked link kept focus, so the
 * panel reappeared on the destination page. Services stays a real `<Link>`
 * either way, so `/services` remains crawlable and a working tap target.
 */
type NavChild = { href: string; label: string; description: string };
type NavItem = { href: string; label: string; children?: NavChild[] };

const SERVICES: NavChild[] = [
  {
    href: "/hearing-tests",
    label: "Hearing Tests",
    description: "What an assessment involves, and which test you may need.",
  },
  {
    href: "/hearing-aids",
    label: "Hearing Aids",
    description: "Styles, technology levels, and how fitting works.",
  },
];

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services", children: SERVICES },
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
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  /** Desktop Services dropdown: the href of the open panel, or none. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Compact + elevate once the page moves, so the hero reads edge-to-edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer and any open dropdown on navigation and lock body scroll
  // while it is open.
  useEffect(() => {
    setOpen(false);
    setOpenSection(null);
    setOpenMenu(null);
  }, [pathname]);

  // Dismiss the desktop dropdown when the click lands anywhere outside it, and
  // on Escape for keyboard users.
  useEffect(() => {
    const onPointerDown = (event: Event) => {
      if (!navRef.current) return;
      if (event.target instanceof Node && navRef.current.contains(event.target)) {
        return;
      }
      setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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

  /** Services stays lit while a visitor is on one of its child pages. */
  const isSectionActive = (item: NavItem) =>
    isActive(item.href) ||
    (item.children?.some((child) => isActive(child.href)) ?? false);

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

        <nav
          ref={navRef}
          aria-label="Primary"
          className="hidden items-center gap-0.5 xl:flex"
        >
          {NAV.map((item) => {
            const active = isSectionActive(item);

            if (!item.children) {
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
            }

            const menuOpen = openMenu === item.href;
            const closeIfMine = () =>
              setOpenMenu((current) => (current === item.href ? null : current));

            return (
              <div
                key={item.href}
                className="group relative"
                onMouseEnter={() => setOpenMenu(item.href)}
                onMouseLeave={closeIfMine}
                onFocus={() => setOpenMenu(item.href)}
                onBlur={(event) => {
                  // Only close once focus has left the whole trigger+panel group.
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    closeIfMine();
                  }
                }}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "text-brand-700"
                      : "text-ink-600 hover:bg-surface-muted hover:text-ink-900"
                  }`}
                >
                  {item.label}
                  <Icon
                    name="chevron-down"
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5 group-focus-within:translate-y-0.5"
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-700 transition-opacity duration-200 ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>

                {/* `pt-2` is padding rather than a gap on purpose: it is the
                    hover bridge, so the pointer can cross the space between the
                    trigger and the panel without the menu closing. */}
                <div
                  className={`absolute left-0 top-full z-50 w-80 pt-2 transition-[opacity,transform] duration-200 ${
                    menuOpen ? "visible opacity-100" : "invisible opacity-0"
                  }`}
                >
                  <div className="rounded-2xl border border-border bg-surface p-2 shadow-lift">
                    <Link
                      href={item.href}
                      onClick={closeIfMine}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                    >
                      All services
                      <Icon name="arrow-right" className="h-4 w-4" />
                    </Link>
                    <div className="my-1 h-px bg-border" aria-hidden="true" />
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={closeIfMine}
                        aria-current={isActive(child.href) ? "page" : undefined}
                        className={`block rounded-xl px-3 py-2.5 transition-colors ${
                          isActive(child.href)
                            ? "bg-brand-50"
                            : "hover:bg-surface-muted"
                        }`}
                      >
                        <span className="block text-sm font-medium text-ink-900">
                          {child.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                          {child.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {/* The number is desktop-wide only; the drawer carries it on smaller
              screens. It opens WhatsApp, which is how the clinic prefers to be
              reached — the call-back number stays available in the footer. */}
          <a
            href={WHATSAPP.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with ${CLIENT.name} on WhatsApp (opens in a new tab)`}
            className="hidden items-center gap-2 text-sm font-semibold text-ink-700 transition-colors hover:text-brand-700 2xl:flex"
          >
            <SocialIcon id="whatsapp" className="h-4 w-4 text-brand-700" />
            {CLIENT.phone}
          </a>
          <Button
            href={homeConsultationHref}
            size="sm"
            className="btn-lift"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
          >
            <Icon name="home" className="h-4 w-4" />
            Request Home Consultation
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
              const active = isSectionActive(item);

              /* Services expands in place rather than navigating away: on a
                 phone the sub-items are the useful part, and a tap that both
                 navigated and expanded would be a guessing game. */
              if (item.children) {
                const expanded = openSection === item.href;
                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection(expanded ? null : item.href)
                      }
                      aria-expanded={expanded}
                      aria-controls="mobile-services"
                      className={`flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-base font-medium ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-700 hover:bg-surface-muted"
                      }`}
                    >
                      {item.label}
                      <Icon
                        name="chevron-down"
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expanded
                            ? "rotate-180"
                            : active
                              ? "text-brand-700"
                              : "text-ink-400"
                        }`}
                      />
                    </button>

                    {expanded ? (
                      <div
                        id="mobile-services"
                        className="mt-1 space-y-1 border-l border-border pl-3"
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            setOpen(false);
                            setOpenSection(null);
                          }}
                          className="flex min-h-11 items-center justify-between rounded-xl px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          All services
                          <Icon name="arrow-right" className="h-4 w-4" />
                        </Link>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              setOpen(false);
                              setOpenSection(null);
                            }}
                            aria-current={
                              isActive(child.href) ? "page" : undefined
                            }
                            className={`block min-h-11 rounded-xl px-4 py-3 ${
                              isActive(child.href)
                                ? "bg-brand-50"
                                : "hover:bg-surface-muted"
                            }`}
                          >
                            <span className="block text-sm font-medium text-ink-800">
                              {child.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                              {child.description}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

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
              <Button
                href={homeConsultationHref}
                size="lg"
                className="btn-lift w-full"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
              >
                <Icon name="home" className="h-5 w-5" />
                Request Home Consultation
              </Button>
              <Button
                href={WHATSAPP.href}
                variant="secondary"
                size="lg"
                className="btn-lift w-full"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
              >
                <SocialIcon id="whatsapp" className="h-5 w-5 text-brand-700" />
                WhatsApp us
              </Button>
              <a
                href={CLIENT.phoneHref}
                aria-label="Call Quality Hearing Care"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold text-brand-700"
              >
                <Icon name="phone" className="h-5 w-5" />
                Call {CLIENT.phone}
              </a>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
