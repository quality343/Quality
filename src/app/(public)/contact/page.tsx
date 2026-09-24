import Link from "next/link";
import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { SocialIcon } from "@/components/brand/SocialIcons";
import { PHOTOS } from "@/lib/images";
import { Reveal } from "@/components/motion/Reveal";
import { CLIENT, homeConsultationHref, WHATSAPP } from "@/lib/client-info";
import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "Contact — QUALITY Hearing Care, Kukatpally, Hyderabad",
  description:
    "Call 9966111188 or email qualityhearing.pro@gmail.com. Visit us at KPHB Phase 1, Kukatpally, Hyderabad. Send us a message and our team will get back to you.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        photo={PHOTOS.bookingHelp}
        eyebrow="Contact"
        title={
          <>
            Talk to our <span className="text-gradient-light">team</span>
          </>
        }
        description="Questions about hearing tests, hearing aids, or home consultations? Call, email, or send us a message — we're happy to help you work out what you need."
        actions={
          <>
            <Button
              href={CLIENT.phoneHref}
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
            >
              <Icon name="phone" className="h-5 w-5" />
              Call {CLIENT.phone}
            </Button>
            <Button
              href={homeConsultationHref}
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
              aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
            >
              <Icon name="home" className="h-5 w-5" />
              Request Home Consultation
            </Button>
          </>
        }
        aside={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <a
              href={CLIENT.phoneHref}
              className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-md transition-colors hover:border-white/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Icon name="phone" className="h-5 w-5 text-white" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold text-white">
                  {CLIENT.phone}
                </span>
                <span className="block text-xs text-brand-100/70">
                  Tap to call — quickest answer
                </span>
              </span>
            </a>
            <a
              href={`mailto:${CLIENT.email}`}
              className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-md transition-colors hover:border-white/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Icon name="mail" className="h-5 w-5 text-white" />
              </span>
              <span className="min-w-0">
                <span className="block break-all font-display text-sm font-semibold text-white">
                  {CLIENT.email}
                </span>
                <span className="block text-xs text-brand-100/70">
                  We reply as soon as we can
                </span>
              </span>
            </a>
          </div>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface p-8 shadow-card sm:p-10">
                <h2 className="headline text-2xl text-ink-900">Send us a message</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  We read every message. For the fastest answer, message us on
                  WhatsApp on{" "}
                  <a
                    href={WHATSAPP.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                    className="font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {CLIENT.phone}
                  </a>
                  .
                </p>
                <ContactForm />
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-surface p-7 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Icon name="map-pin" className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display font-semibold text-ink-900">Visit us</h2>
                  {/* The address itself opens Google Maps, not just the button
                      below it — people reach for the words, not the control. */}
                  <a
                    href={CLIENT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                    className="mt-3 block"
                  >
                    <address className="space-y-1 not-italic text-sm leading-relaxed text-ink-600 underline-offset-4 hover:text-brand-700 hover:underline">
                      {CLIENT.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </a>
                  <Button
                    href={CLIENT.mapsUrl}
                    variant="secondary"
                    size="md"
                    className="btn-lift mt-5"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                  >
                    <Icon name="map-pin" className="h-4 w-4" />
                    Get Directions
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-border bg-brand-950 p-7 text-white shadow-card">
                  <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
                  <div className="relative">
                    <h2 className="font-display text-lg font-semibold tracking-tight">
                      Message us instead
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-brand-100/80">
                      Know what you need? Send us a message on WhatsApp and our
                      team will take it from there. No account required.
                    </p>
                    <div className="mt-5 flex flex-col gap-3">
                      <Button
                        href={homeConsultationHref}
                        size="md"
                        className="btn-lift w-full !bg-white !text-brand-800 hover:!bg-brand-50"
                        aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
                      >
                        <Icon name="home" className="h-4 w-4" />
                        Request Home Consultation
                      </Button>
                      <Button
                        href={WHATSAPP.href}
                        variant="secondary"
                        size="md"
                        className="btn-lift w-full !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                        aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                      >
                        <SocialIcon id="whatsapp" className="h-4 w-4" />
                        WhatsApp us
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-accent-100 bg-gradient-to-br from-accent-50/70 to-surface p-7 shadow-card">
                  <h2 className="font-display font-semibold text-ink-900">
                    Home consultation
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    Prefer care at home? QUALITY Hearing Care also offers home
                    consultation services. Message us on WhatsApp and our team
                    can coordinate a suitable visit.
                  </p>
                  <Link
                    href="/home-consultation"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800"
                  >
                    How home visits work
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
