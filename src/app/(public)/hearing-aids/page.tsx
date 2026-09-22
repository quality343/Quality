import Image from "next/image";
import Link from "next/link";
import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { HearingAidDevice } from "@/components/brand/HearingAidDevice";
import { Reveal } from "@/components/motion/Reveal";
import { VideoSection } from "@/components/media/VideoSection";
import { VIDEO } from "@/lib/media";
import { deviceTypeLabel, techLevelLabel } from "@/lib/hearing-aids";
import { prisma } from "@/server/db/prisma";
import { CLIENT } from "@/lib/client-info";

export const metadata = {
  title: "Hearing Aids in Hyderabad — QUALITY Hearing Care, Kukatpally",
  description:
    "Hearing-aid styles, technology levels and what fitting involves at QUALITY Hearing Care, Kukatpally, Hyderabad. Every recommendation starts with a hearing test, a demo and a trial.",
  alternates: { canonical: "/hearing-aids" },
};

/**
 * Public catalogue query.
 *
 * Only ACTIVE (client-approved) models are ever published. Seed/demo rows are
 * intentionally kept out of ACTIVE state, so this returns nothing until real
 * products are added — the page then shows an honest, useful section instead of
 * inventing brands, specifications or prices.
 */
function listPublicModels() {
  return prisma.hearingAidModel.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ isFeatured: "desc" }, { modelName: "asc" }],
    include: { brand: { select: { name: true } } },
    take: 12,
  });
}

const STYLES: { name: string; text: string; points: string[] }[] = [
  {
    name: "Behind-the-ear",
    text: "A small unit sits behind the ear with a thin wire leading into the canal.",
    points: ["Room for the most powerful electronics", "Easiest to handle and adjust"],
  },
  {
    name: "Receiver-in-canal",
    text: "The smallest parts sit right in the ear canal, with the body tucked behind the ear.",
    points: ["Discreet and very widely fitted", "Natural, open sound quality"],
  },
  {
    name: "In-the-ear & in-the-canal",
    text: "Custom-moulded to sit inside your ear, made from an impression of your canal.",
    points: ["Minimal visibility", "Suits certain hearing profiles best"],
  },
];

const LIFECYCLE: { step: string; text: string }[] = [
  {
    step: "Consultation",
    text: "A hearing test and a conversation about the situations you find difficult.",
  },
  {
    step: "Recommendation",
    text: "Options matched to your hearing and lifestyle — never an automatic prescription.",
  },
  {
    step: "Demo & trial",
    text: "Try devices in real situations before deciding anything.",
  },
  {
    step: "Fitting",
    text: "Programmed precisely to your hearing, and verified with you.",
  },
  {
    step: "Aftercare",
    text: "Follow-ups, servicing and support for the life of your device.",
  },
];

export default async function HearingAidsPage() {
  const models = await listPublicModels();

  return (
    <>
      <PageHero
        photo={PHOTOS.hearingAidDetail}
        eyebrow="Hearing aids"
        title={
          <>
            The right device,{" "}
            <span className="text-gradient-light">fitted properly</span>, cared
            for long-term
          </>
        }
        description="We match technology to your hearing, your lifestyle and your budget — and every recommendation begins with a demo and a trial. No pressure, and no automatic prescriptions."
        actions={
          <>
            <Button
              href="/book-appointment"
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
            >
              <Icon name="calendar" className="h-5 w-5" />
              Book a Consultation
            </Button>
            <Button
              href="/book-appointment?type=HOME_CONSULTATION"
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              <Icon name="home" className="h-5 w-5" />
              Home Consultation
            </Button>
          </>
        }
        aside={
          <div className="relative flex flex-col items-center rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-glow backdrop-blur-md sm:p-8">
            {/* The clinic's own product render, mounted on a light card so the
                pair reads clearly against the dark hero. */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-float">
              <Image
                src={PHOTOS.hearingAidPair.src}
                alt={PHOTOS.hearingAidPair.alt}
                width={PHOTOS.hearingAidPair.width}
                height={PHOTOS.hearingAidPair.height}
                sizes="(min-width: 640px) 26rem, 80vw"
                className="h-56 w-full object-contain sm:h-64"
              />
            </div>
            <p className="mt-3 text-center text-sm text-brand-100/85">
              Demoed and trialled before you decide — every single time.
            </p>
          </div>
        }
      />

      {/* Styles we fit — editorial, no product claims */}
      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">Styles we fit</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Which style suits you is decided together
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Comfort, visibility and what you need to hear well all matter — and
              they pull in different directions. We&apos;ll talk through the
              trade-offs with you in person.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-card md:grid-cols-3">
            {STYLES.map((style, i) => (
              <Reveal key={style.name} delay={i * 80} className="bg-surface p-8">
                <span className="font-display text-xs font-bold tracking-[0.2em] text-brand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="headline mt-4 text-xl text-ink-900">{style.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{style.text}</p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm text-ink-600">
                  {style.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Catalogue — only ever shows client-approved models */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 h-72 opacity-70 blur-3xl"
          style={{
            backgroundImage:
              "radial-gradient(30% 60% at 18% 0%, rgba(32,105,180,0.5), transparent 70%), radial-gradient(28% 55% at 84% 0%, rgba(220,38,56,0.2), transparent 72%)",
          }}
          aria-hidden="true"
        />
        <Container className="relative py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-200">Catalogue</p>
            <h2 className="headline mt-3 text-3xl sm:text-4xl">
              Devices available at our clinic
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100/80">
              We don&apos;t publish specifications, models or prices we
              can&apos;t stand behind — everything about your options is
              confirmed face to face.
            </p>
          </Reveal>

          {models.length === 0 ? (
            <Reveal className="mt-10">
              <div className="grid gap-8 rounded-3xl border border-white/12 bg-white/[0.05] p-8 backdrop-blur-sm sm:p-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Icon name="sparkles" className="h-6 w-6 text-white" />
                  </span>
                  <h3 className="headline mt-6 text-2xl">
                    Every recommendation starts with your hearing test
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100/80">
                    We work with several manufacturers and technology levels, and
                    we fit what suits you — not what happens to be in stock. Your
                    options, specifications and costs are explained in person,
                    after we&apos;ve tested your hearing and understood your
                    daily life.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button
                      href="/book-appointment"
                      size="lg"
                      className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                    >
                      <Icon name="calendar" className="h-5 w-5" />
                      Book a Consultation
                    </Button>
                    <Button
                      href="/contact"
                      variant="secondary"
                      size="lg"
                      className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                    >
                      Ask us a question
                    </Button>
                  </div>
                </div>

                <dl className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                      Before you buy
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-brand-100/85">
                      A hearing test, then a demo and a trial in real
                      situations.
                    </dd>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                      Getting advice
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-brand-100/85">
                      Call{" "}
                      <a
                        href={CLIENT.phoneHref}
                        className="font-semibold text-white underline-offset-4 hover:underline"
                      >
                        {CLIENT.phone}
                      </a>{" "}
                      — we&apos;ll tell you honestly whether aids are likely to
                      help.
                    </dd>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <dt className="text-xs uppercase tracking-[0.16em] text-brand-200">
                      Already wearing aids?
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-brand-100/85">
                      We service and re-programme existing devices too.
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model, i) => (
                <Reveal key={model.id} delay={(i % 3) * 80}>
                  <article
                    id={model.modelCode}
                    className="product-zoom group flex h-full scroll-mt-24 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-glow backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
                  >
                    <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-brand-800/70 via-brand-900/60 to-brand-950">
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          backgroundImage:
                            "radial-gradient(50% 50% at 50% 45%, rgba(255,255,255,0.22), transparent 70%)",
                        }}
                        aria-hidden="true"
                      />
                      <HearingAidDevice
                        className="relative h-44 w-auto"
                        uid={`cat-${model.modelCode}`}
                        animated={false}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="eyebrow text-brand-300">
                        {model.brand.name} · {deviceTypeLabel(model.deviceType)}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">
                        {model.modelName}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-brand-100/90">
                          {techLevelLabel(model.technologyLevel)}
                        </span>
                        {model.warrantyMonths ? (
                          <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-brand-100/90">
                            {model.warrantyMonths}-month warranty
                          </span>
                        ) : null}
                      </div>

                      {model.description ? (
                        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-100/75">
                          {model.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                        <Button
                          href="/book-appointment"
                          size="sm"
                          className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                        >
                          Talk to our team
                        </Button>
                        <Button
                          href="/contact"
                          size="sm"
                          variant="secondary"
                          className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                        >
                          Ask a question
                        </Button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Video — what the devices are actually like, placed after the catalogue
          and before the fitting steps. Educational only: it recommends nothing. */}
      <VideoSection slot={VIDEO.hearingAids} tone="muted" />

      {/* Fitting journey */}
      <section className="bg-band-soft">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">How fitting works</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Five steps, no surprises
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {LIFECYCLE.map((item, i) => (
              <Reveal as="li" key={item.step} delay={i * 80} className="relative">
                <span
                  className="absolute left-12 top-5 hidden h-px w-[calc(100%-3.5rem)] bg-gradient-to-r from-brand-200 to-transparent lg:block"
                  aria-hidden="true"
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-lg font-bold text-white shadow-card">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display font-semibold tracking-tight text-ink-900">
                  {item.step}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.text}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={120}>
            <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-surface p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="headline text-xl text-ink-900 sm:text-2xl">
                  Book a hearing-aid consultation
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
                  A hearing test first, then an honest conversation about whether
                  hearing aids would help — and what they&apos;d involve.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Button href="/book-appointment" size="lg" className="btn-lift">
                  <Icon name="calendar" className="h-5 w-5" />
                  Book a Consultation
                </Button>
                <Button href="/contact" variant="secondary" size="lg" className="btn-lift">
                  Ask us first
                </Button>
              </div>
            </div>
          </Reveal>

          <p className="sr-only">
            Looking for hearing tests instead?{" "}
            <Link href="/hearing-tests">Read about our hearing tests</Link>.
          </p>
        </Container>
      </section>
    </>
  );
}
