import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { CLIENT } from "@/lib/client-info";

/**
 * Shared shell for the public policy pages (Terms, Privacy, Appointment
 * Policy). One component keeps the three pages visually identical to the rest
 * of the site and keeps their markup accessible: a real heading hierarchy,
 * anchor links that work without JavaScript, and a jump-list that is plain
 * navigation rather than a custom widget.
 */
export type LegalSection = {
  /** Anchor id — also used to build the `aria-labelledby` reference. */
  id: string;
  title: string;
  content: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Human-readable date string shown under the hero. Never a fake date. */
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
            <nav
              aria-label="On this page"
              className="rounded-3xl border border-border bg-surface p-6 shadow-card lg:sticky lg:top-24"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                On this page
              </h2>
              <ol className="mt-4 space-y-2.5 text-sm">
                {sections.map((section, i) => (
                  <li key={section.id} className="flex gap-2.5">
                    <span
                      className="mt-px w-4 shrink-0 text-right font-mono text-xs text-ink-400"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <a
                      href={`#${section.id}`}
                      className="block py-1 text-ink-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="min-w-0">
              <p className="mb-6 text-xs uppercase tracking-wider text-ink-500">
                Last updated: {lastUpdated}
              </p>

              <div className="space-y-6">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`${section.id}-heading`}
                    className="scroll-mt-28 rounded-3xl border border-border bg-surface p-7 shadow-card sm:p-9"
                  >
                    <h2
                      id={`${section.id}-heading`}
                      className="font-display text-xl font-semibold tracking-tight text-ink-900"
                    >
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-600">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-surface p-7 shadow-card sm:p-8">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                  Questions about this policy?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Call or email the clinic and our team will help. For anything
                  about a specific appointment, please have your appointment
                  number ready.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <li>
                    <a
                      href={CLIENT.phoneHref}
                      aria-label="Call Quality Hearing Care"
                      className="inline-flex items-center gap-2.5 font-semibold text-brand-700 hover:text-brand-800"
                    >
                      <Icon name="phone" className="h-4 w-4 shrink-0" />
                      {CLIENT.phone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${CLIENT.email}`}
                      aria-label="Email Quality Hearing Care"
                      className="inline-flex items-center gap-2.5 break-all font-semibold text-brand-700 hover:text-brand-800"
                    >
                      <Icon name="mail" className="h-4 w-4 shrink-0" />
                      {CLIENT.email}
                    </a>
                  </li>
                  <li>
                    <a
                      href={CLIENT.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                      className="inline-flex items-center gap-2.5 font-semibold text-brand-700 hover:text-brand-800"
                    >
                      <Icon name="map-pin" className="h-4 w-4 shrink-0" />
                      View our clinic on the map
                    </a>
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button href="/" variant="secondary" size="md">
                    <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
                    Back to Home
                  </Button>
                  <Button href="/book-appointment" size="md">
                    <Icon name="calendar" className="h-4 w-4" />
                    Book an Appointment
                  </Button>
                </div>
                <p className="mt-5 text-xs text-ink-500">
                  Looking for something else? See our{" "}
                  <Link
                    href="/terms-and-conditions"
                    className="underline underline-offset-4 hover:text-brand-700"
                  >
                    Terms &amp; Conditions
                  </Link>
                  ,{" "}
                  <Link
                    href="/privacy-policy"
                    className="underline underline-offset-4 hover:text-brand-700"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/appointment-policy"
                    className="underline underline-offset-4 hover:text-brand-700"
                  >
                    Appointment Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Bulleted list with the site's spacing, for policy body copy. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-brand-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Neutral emphasis block. Used wherever the clinic has not supplied an exact
 * policy, so the page can point to the clinic instead of inventing terms.
 */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:p-5">
      {children}
    </div>
  );
}
