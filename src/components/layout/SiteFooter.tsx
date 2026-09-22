import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CLIENT } from "@/lib/client-info";
import { Container, Icon } from "@/components/ui";

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/services", label: "Services" },
      { href: "/hearing-tests", label: "Hearing Tests" },
    ],
  },
  {
    title: "Clinic",
    links: [
      { href: "/hearing-aids", label: "Hearing Aids" },
      { href: "/branches", label: "Branches" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Appointments",
    links: [
      { href: "/book-appointment", label: "Book an Appointment" },
      { href: "/book-appointment?type=HOME_CONSULTATION", label: "Home Consultation" },
      { href: "/booking-lookup", label: "Find My Booking" },
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
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <BrandLogo inverted logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/80">
            Professional hearing care in Kukatpally, Hyderabad — hearing tests,
            hearing aids, and home consultations.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-brand-100/80">
            <li className="flex items-start gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" />
              <a
                href={CLIENT.phoneHref}
                aria-label="Call Quality Hearing Care"
                className="hover:text-white"
              >
                {CLIENT.phone}
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
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-brand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CLIENT.name} · {CLIENT.tagline}. All rights reserved.
          </p>
          <p>Home consultation available — book online or call.</p>
        </Container>
      </div>
    </footer>
  );
}
