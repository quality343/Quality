import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/server/db/prisma";
import { CLIENT } from "@/lib/client-info";

type Params = Promise<{ slug: string }>;

const CATEGORY_LABEL: Record<string, string> = {
  DIAGNOSTIC: "Diagnostic",
  HEARING_TEST: "Hearing test",
  HEARING_AID: "Hearing aid",
  THERAPY: "Therapy",
  COCHLEAR: "Cochlear implant",
};

async function getService(slug: string) {
  // Services are keyed by code in the catalogue; accept case-insensitive code.
  return prisma.service.findFirst({
    where: { code: slug.toUpperCase(), isActive: true },
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: `${service.name} — QUALITY Hearing Care, Hyderabad`,
    description:
      service.description?.slice(0, 155) ??
      `${service.name} at QUALITY Hearing Care, Kukatpally, Hyderabad.`,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  return (
    <>
      <PageHero
        photo={PHOTOS.homeVisitFamily}
        eyebrow={CATEGORY_LABEL[service.category] ?? service.category}
        title={service.name}
        description={service.description ?? undefined}
        actions={
          <>
            <Button
              href={`/book-appointment?service=${service.id}`}
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
            >
              <Icon name="calendar" className="h-5 w-5" />
              Book This Service
            </Button>
            <Button
              href="/services"
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              All services
            </Button>
          </>
        }
        aside={
          <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-7 shadow-glow backdrop-blur-md">
            <dl className="space-y-5">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                  Approximate duration
                </dt>
                <dd className="headline mt-1 text-4xl">
                  {service.durationMinutes}
                  <span className="ml-1.5 text-base font-semibold text-brand-100/70">min</span>
                </dd>
              </div>
              <div className="border-t border-white/10 pt-5">
                <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">Where</dt>
                <dd className="mt-1 text-sm leading-relaxed text-brand-100/90">
                  Our Kukatpally clinic in KPHB Phase 1, Hyderabad. Home
                  consultation can be arranged on request.
                </dd>
              </div>
              <div className="border-t border-white/10 pt-5">
                <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">Booking</dt>
                <dd className="mt-1 text-sm leading-relaxed text-brand-100/90">
                  Online in about a minute — no account required.
                </dd>
              </div>
            </dl>
          </div>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface p-8 shadow-card sm:p-10">
                <h2 className="headline text-2xl text-ink-900">
                  What happens at this appointment
                </h2>
                <ol className="mt-7 space-y-6">
                  {[
                    {
                      title: "A conversation first",
                      text: "We ask what you've noticed in daily life, so the appointment answers the questions that actually matter to you.",
                    },
                    {
                      title: "The assessment itself",
                      text: `Carried out in person by our team, taking roughly ${service.durationMinutes} minutes. Nothing is painful, and every step is explained before it happens.`,
                    },
                    {
                      title: "Your results, in plain language",
                      text: "We go through what the findings mean and what your options are. If nothing needs to change, we'll say so.",
                    },
                    {
                      title: "A clear next step",
                      text: "Whether that's a follow-up, a hearing-aid demo and trial, or simply reassurance — you'll leave knowing what comes next.",
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-display font-semibold tracking-tight text-ink-900">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                          {step.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-surface p-8 shadow-card">
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    Book this service
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Pick a date and time that suits you at our Kukatpally
                    clinic. You&apos;ll get an appointment reference to manage
                    your booking.
                  </p>
                  <Button
                    href={`/book-appointment?service=${service.id}`}
                    size="lg"
                    className="btn-lift mt-5 w-full"
                  >
                    <Icon name="calendar" className="h-5 w-5" />
                    Book This Service
                  </Button>
                  <a
                    href={CLIENT.phoneHref}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-semibold text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    <Icon name="phone" className="h-4 w-4" />
                    Call {CLIENT.phone}
                  </a>
                </div>

                <div className="rounded-3xl border border-accent-100 bg-gradient-to-br from-accent-50/70 to-surface p-8 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-600 text-white">
                    <Icon name="home" className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display font-semibold text-ink-900">
                    Can&apos;t come to the clinic?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    Home consultation is available in Hyderabad on request. Our
                    team will contact you to confirm a suitable time.
                  </p>
                  <Link
                    href="/book-appointment?type=HOME_CONSULTATION"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800"
                  >
                    Request a home visit
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
