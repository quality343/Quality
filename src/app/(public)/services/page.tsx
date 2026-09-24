import Link from "next/link";
import { Button, Container, Icon, type IconName } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { SocialIcon } from "@/components/brand/SocialIcons";
import { PHOTOS } from "@/lib/images";
import { Reveal } from "@/components/motion/Reveal";
import { listServices } from "@/server/services/queries";
import {
  CLIENT,
  homeConsultationHref,
  WHATSAPP,
  whatsappEnquiry,
} from "@/lib/client-info";

export const metadata = {
  title: "Hearing Services in Kukatpally, Hyderabad — QUALITY Hearing Care",
  description:
    "Hearing assessments, audiologist consultation, hearing-aid fitting and programming, maintenance, follow-up care and home consultation at QUALITY Hearing Care, Hyderabad.",
  alternates: { canonical: "/services" },
};

const CATEGORY_LABEL: Record<string, string> = {
  DIAGNOSTIC: "Diagnostic",
  HEARING_TEST: "Hearing test",
  HEARING_AID: "Hearing aid",
  THERAPY: "Therapy",
  COCHLEAR: "Cochlear implant",
};

const CATEGORY_ICON: Record<string, IconName> = {
  HEARING_TEST: "ear",
  DIAGNOSTIC: "sparkles",
  HEARING_AID: "sparkles",
  THERAPY: "heart",
  COCHLEAR: "shield",
};

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <>
      <PageHero
        photo={PHOTOS.lifestyleListening}
        eyebrow="What we offer"
        title={
          <>
            Complete hearing care,{" "}
            <span className="text-gradient-light">under one roof</span>
          </>
        }
        description="Every service below is delivered in person at our Kukatpally clinic by our hearing-care team — or arranged as a home consultation where that's easier for you."
        actions={
          <>
            <Button
              href={homeConsultationHref}
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
              aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
            >
              <Icon name="home" className="h-5 w-5" />
              Request Home Consultation
            </Button>
            <Button
              href="/hearing-tests"
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              Hearing tests explained
            </Button>
          </>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          {services.length === 0 ? (
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface p-12 text-center shadow-card">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="ear" className="h-6 w-6" />
                </span>
                <h2 className="headline mt-5 text-2xl text-ink-900">
                  Our service list is being finalised
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                  Message us on WhatsApp on{" "}
                  <a
                    href={WHATSAPP.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                    className="font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {CLIENT.phone}
                  </a>{" "}
                  and we&apos;ll tell you exactly what&apos;s available at our
                  Kukatpally clinic right now.
                </p>
              </div>
            </Reveal>
          ) : (
            <>
              {/* Editorial layout: the first service gets a large panel. */}
              {services[0] ? (
                <Reveal>
                  <article className="bg-hero relative overflow-hidden rounded-3xl text-white shadow-float">
                    <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
                    <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                      <div>
                        <span className="eyebrow text-brand-200">
                          Most requested
                        </span>
                        <h2 className="headline mt-3 text-3xl sm:text-4xl">
                          {services[0].name}
                        </h2>
                        {services[0].description ? (
                          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100/85">
                            {services[0].description}
                          </p>
                        ) : null}
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                          <Button
                            href={whatsappEnquiry(services[0].name)}
                            size="lg"
                            className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                            aria-label={`Ask about ${services[0].name} on WhatsApp (opens in a new tab)`}
                          >
                            <SocialIcon id="whatsapp" className="h-5 w-5" />
                            Ask about this service
                          </Button>
                          <Button
                            href={`/services/${services[0].code.toLowerCase()}`}
                            variant="secondary"
                            size="lg"
                            className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                          >
                            Full details
                          </Button>
                        </div>
                      </div>
                      <dl className="rounded-2xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-sm">
                        <div>
                          <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                            Approximate duration
                          </dt>
                          <dd className="headline mt-1 text-3xl">
                            {services[0].durationMinutes}
                            <span className="ml-1 text-base font-semibold text-brand-100/70">
                              min
                            </span>
                          </dd>
                        </div>
                        <div className="mt-5 border-t border-white/10 pt-5">
                          <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                            Available at
                          </dt>
                          <dd className="mt-1 text-sm text-brand-100/90">
                            Our Kukatpally clinic — home visits on request
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </Reveal>
              ) : null}

              {/* Supporting services */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.slice(1).map((service, i) => (
                  <Reveal key={service.id} delay={(i % 3) * 70}>
                    <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-100">
                        <Icon
                          name={CATEGORY_ICON[service.category] ?? "ear"}
                          className="h-5 w-5"
                        />
                      </span>
                      <p className="eyebrow mt-5 text-ink-400">
                        {CATEGORY_LABEL[service.category] ?? service.category}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-ink-900">
                        {service.name}
                      </h3>
                      {service.description ? (
                        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-500">
                          {service.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400">
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        Approx. {service.durationMinutes} minutes
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                        <Button
                          href={whatsappEnquiry(service.name)}
                          size="sm"
                          className="btn-lift"
                          aria-label={`Ask about ${service.name} on WhatsApp (opens in a new tab)`}
                        >
                          Ask on WhatsApp
                        </Button>
                        <Link
                          href={`/services/${service.code.toLowerCase()}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Learn more
                          <Icon name="arrow-right" className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="bg-band-soft">
        <Container className="py-14 sm:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-surface p-8 shadow-card sm:p-12">
              <div className="grid gap-7 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                <div>
                  <h2 className="headline text-2xl text-ink-900 sm:text-3xl">
                    Not sure where to start?
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
                    Most people begin with a hearing assessment. Ask us about
                    one and our team will guide you from there — no account
                    needed, and no obligation.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button
                    href={homeConsultationHref}
                    size="lg"
                    className="btn-lift"
                    aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
                  >
                    <Icon name="home" className="h-5 w-5" />
                    Request Home Consultation
                  </Button>
                  <Button href={CLIENT.phoneHref} variant="secondary" size="lg" className="btn-lift">
                    <Icon name="phone" className="h-5 w-5" />
                    Call {CLIENT.phone}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
