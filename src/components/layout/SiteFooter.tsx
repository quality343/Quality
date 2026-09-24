import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SocialIcon, SocialLinks } from "@/components/brand/SocialIcons";
import { CLIENT, FACEBOOK_PAGES, WHATSAPP } from "@/lib/client-info";
import { Container, Icon } from "@/components/ui";

/**
 * The booking engine is gone, so the footer's job is contact, not conversion:
 * every route to the clinic — WhatsApp, phone, email, map, social — is here and
 * each one says out loud what it does. Which matters, because this is the
 * surface older visitors scroll to when they cannot find a button.
 */
const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/services", label: "Services" },
      { href: "/hearing-tests", label: "Hearing Tests" },
      { href: "/hearing-aids", label: "Hearing Aids" },
      { href: "/home-consultation", label: "Home Consultation" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms-and-conditions", label: "Terms & Conditions" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/appointment-policy", label: "Appointment Policy" },
    ],
  },
];

export function SiteFooter({
  logoSrc,
  logoMarkSrc,
}: {
  logoSrc?: string | null;
  logoMarkSrc?: string | null;
}) {
  return (
    <footer className="bg-brand-950 text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <BrandLogo inverted logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/80">
            Professional hearing care in Kukatpally, Hyderabad — hearing tests,
            hearing aids, and home consultations.
          </p>

          <ul className="mt-5 space-y-2.5 text-sm text-brand-100/80">
            <li className="flex items-start gap-2">
              <SocialIcon id="whatsapp" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <a
                  href={WHATSAPP.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${CLIENT.name} on WhatsApp (opens in a new tab)`}
                  className="font-semibold text-white underline-offset-4 hover:underline"
                >
                  {CLIENT.phone}
                </a>
                <span className="block text-xs text-brand-100/60">
                  WhatsApp — usually the quickest reply
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" />
              <a
                href={CLIENT.phoneHref}
                aria-label="Call Quality Hearing Care"
                className="hover:text-white"
              >
                Call {CLIENT.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0" />
              <a
                href={`mailto:${CLIENT.email}`}
                aria-label="Email Quality Hearing Care"
                className="break-all hover:text-white"
              >
                {CLIENT.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0" />
              {/* The whole address is the map link — the largest, easiest
                  target for older visitors, and it reads naturally aloud. */}
              <a
                href={CLIENT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                className="leading-relaxed underline-offset-4 hover:text-white hover:underline"
              >
                <address className="not-italic">
                  {CLIENT.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </a>
            </li>
            <li className="pt-1">
              <a
                href={CLIENT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                className="inline-flex items-center gap-1.5 font-semibold text-brand-100 underline-offset-4 hover:text-white hover:underline"
              >
                View on Map
                <Icon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
          </ul>
        </div>

        {SECTIONS.map((section) => (
          <nav key={section.title} aria-label={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-200">
              {section.title}
            </h2>
            {/* `block py-2` rather than a bare inline link: it gives every
                footer link a ~36px touch target, which matters for the older
                visitors this clinic serves. */}
            <ul className="mt-3 space-y-0.5">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2 text-sm text-brand-100/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* "Stay Connected" lives in the footer so every page carries the same
            official accounts — one place to verify, never duplicated per page. */}
        <section aria-labelledby="stay-connected">
          <h2
            id="stay-connected"
            className="text-sm font-semibold uppercase tracking-wider text-brand-200"
          >
            Stay Connected
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-100/70">
            Follow {CLIENT.name} for hearing-care tips, clinic updates and
            appointment information.
          </p>
          <SocialLinks className="mt-4 gap-2" />
          {/* The manager supplied a second Facebook page. It is listed
              separately rather than as a duplicate glyph in the row above. */}
          <ul className="mt-3 space-y-0.5">
            {FACEBOOK_PAGES.slice(1).map((page) => (
              <li key={page.href}>
                <a
                  href={page.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${page.label} (opens in a new tab)`}
                  className="block py-2 text-sm text-brand-100/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {page.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-brand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CLIENT.name} · {CLIENT.tagline}. All rights reserved.
          </p>
          <p>
            Home consultation available —{" "}
            <a
              href={WHATSAPP.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with ${CLIENT.name} on WhatsApp (opens in a new tab)`}
              className="font-semibold text-brand-100 underline-offset-4 hover:text-white hover:underline"
            >
              message us on WhatsApp
            </a>{" "}
            or{" "}
            <a
              href={CLIENT.phoneHref}
              aria-label="Call Quality Hearing Care"
              className="font-semibold text-brand-100 underline-offset-4 hover:text-white hover:underline"
            >
              call {CLIENT.phone}
            </a>
            .
          </p>
        </Container>
      </div>
    </footer>
  );
}
