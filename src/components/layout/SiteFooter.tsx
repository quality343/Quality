import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CLIENT } from "@/lib/client-info";
import { Container, Icon } from "@/components/ui";

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Care",
    links: [
      { href: "/services", label: "Services" },
      { href: "/hearing-tests", label: "Hearing Tests" },
      { href: "/hearing-aids", label: "Hearing Aids" },
      { href: "/book-appointment?type=HOME_CONSULTATION", label: "Home Consultation" },
    ],
  },
  {
    title: "Clinic",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/branches", label: "Branches" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Appointments",
    links: [
      { href: "/book-appointment", label: "Book an Appointment" },
      { href: "/booking-lookup", label: "Find My Booking" },
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
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo inverted logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/80">
            Professional hearing care in Kukatpally, Hyderabad — hearing tests,
            hearing aids, and home consultations.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-brand-100/80">
            <li className="flex items-start gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={CLIENT.phoneHref} className="hover:text-white">
                {CLIENT.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={`mailto:${CLIENT.email}`} className="break-all hover:text-white">
                {CLIENT.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0" />
              <address className="not-italic leading-relaxed">
                {CLIENT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </li>
          </ul>
        </div>

        {SECTIONS.map((section) => (
          <nav key={section.title} aria-label={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-200">
              {section.title}
            </h2>
            <ul className="mt-4 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-100/80 transition-colors hover:text-white"
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
