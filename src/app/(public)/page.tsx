import Link from "next/link";
import { Badge, Button, Container, Icon, type IconName } from "@/components/ui";
import { ProductViewer } from "@/components/brand/ProductViewer";
import { HearingAidDevice } from "@/components/brand/HearingAidDevice";
import { AudiogramExplainer } from "@/components/brand/SoundWave";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/media/Photo";
import { VideoShowcase } from "@/components/media/VideoShowcase";
import { HearingSelfCheck } from "@/components/hearing/HearingSelfCheck";
import { CLIENT } from "@/lib/client-info";
import { PHOTOS } from "@/lib/images";
import { deviceTypeLabel } from "@/lib/hearing-aids";
import { listBranches, listServices } from "@/server/services/queries";
import { prisma } from "@/server/db/prisma";

export const metadata = {
  title: "QUALITY Hearing Care — Hearing Clinic in Kukatpally, Hyderabad",
  description:
    "Hearing tests, hearing aids and home consultations at QUALITY Hearing Care, KPHB Phase 1, Kukatpally, Hyderabad. Book an appointment online — no account needed.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "QUALITY Hearing Care — JOY OF HEARING",
    description:
      "Professional hearing care in Kukatpally, Hyderabad: hearing tests, hearing aids, and home consultations. Book online.",
    type: "website",
  },
};

/* ── Verified, non-promotional content only ────────────────────
 * No years of experience, patient counts, awards or success
 * rates: the client has not supplied any, so none are claimed. */

const TRUST: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "ear",
    title: "Professional hearing care",
    text: "Thorough assessments on calibrated equipment, run by qualified hearing-care professionals.",
  },
  {
    icon: "users",
    title: "Personalised attention",
    text: "One-to-one appointments with results explained in plain language — never rushed.",
  },
  {
    icon: "sparkles",
    title: "Modern hearing solutions",
    text: "Current-generation hearing aids, fitted and programmed precisely for your hearing.",
  },
  {
    icon: "calendar",
    title: "Convenient appointments",
    text: "Book online in about a minute at our Kukatpally clinic — or request a home visit.",
  },
];

const HOME_STYLES: { name: string; text: string }[] = [
  {
    name: "Behind-the-ear",
    text: "The most room for powerful electronics — also the easiest style to handle.",
  },
  {
    name: "Receiver-in-canal",
    text: "Discreet, with a natural open sound — the style we fit most often.",
  },
  {
    name: "In-the-ear & in-the-canal",
    text: "Custom-moulded to sit inside your ear, for minimal visibility.",
  },
];

const PROCESS: { title: string; text: string; icon: IconName }[] = [
  {
    icon: "calendar",
    title: "Book online",
    text: "Choose a clinic visit or a home consultation and pick a time that suits you. No account needed.",
  },
  {
    icon: "ear",
    title: "Get your hearing checked",
    text: "A comfortable assessment at our KPHB clinic — or in your own home if visiting is difficult.",
  },
  {
    icon: "clipboard",
    title: "Understand your results",
    text: "We explain what your results mean in plain language, and what your options are.",
  },
  {
    icon: "check",
    title: "Move forward with confidence",
    text: "If hearing aids could help, you demo and trial them first. If they can't, we'll tell you.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need an account to book?",
    a: "No. Booking takes about a minute and needs only your name and mobile number, plus an email if you'd like one. You'll receive a booking reference you can use any time to view or cancel your appointment.",
  },
  {
    q: "How long does a hearing test take?",
    a: "Most hearing assessments take 30–45 minutes, including time to talk through your results. The exact duration is shown for each service when you book.",
  },
  {
    q: "Do you offer home visits?",
    a: "Yes — home consultation is available in Hyderabad, subject to availability. Request one online and our team will contact you to arrange a suitable time.",
  },
  {
    q: "Will I have to buy a hearing aid?",
    a: "No. If hearing aids could help, we'll explain your options and let you demo and trial devices first. If your hearing doesn't need them, we'll tell you that too.",
  },
  {
    q: "Where are you located?",
    a: "Our clinic is in KPHB Phase 1, Kukatpally, Hyderabad — MIG 215, above RK Collections. Directions and contact details are on our Contact page.",
  },
];

export default async function HomePage() {
  const [featuredFlagged, services, branches] = await Promise.all([
    prisma.hearingAidModel.findMany({
      where: { status: "ACTIVE", isFeatured: true },
      orderBy: { modelName: "asc" },
      include: { brand: { select: { name: true } } },
      take: 3,
    }),
    listServices(),
    listBranches(),
  ]);

  const featured =
    featuredFlagged.length > 0
      ? featuredFlagged
      : await prisma.hearingAidModel.findMany({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          include: { brand: { select: { name: true } } },
          take: 3,
        });

  // One physical clinic — read from the database, never hardcoded per component.
  const clinic = branches[0] ?? null;

  return (
    <>
      {/* ══ 1. HERO ═══════════════════════════════════════════════════ */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              {CLIENT.tagline} · Kukatpally, Hyderabad
            </span>

            <h1 className="headline mt-6 text-[2.6rem] sm:text-6xl lg:text-[4.2rem]">
              Experience the joy of{" "}
              <span className="text-gradient-light">hearing clearly</span>.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              Professional hearing care in Kukatpally, Hyderabad. From thorough
              hearing assessments to modern hearing aids fitted properly — and
              home consultations when visiting the clinic is difficult.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                href="/book-appointment"
                size="lg"
                className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
              >
                <Icon name="calendar" className="h-5 w-5" />
                Book an Appointment
              </Button>
              <Button
                href="/hearing-aids"
                variant="secondary"
                size="lg"
                className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!bg-white/15 hover:!text-white"
              >
                Explore Hearing Care
                <Icon name="arrow-right" className="h-5 w-5" />
              </Button>
            </div>

            <dl className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-brand-100/85">
              <div className="flex items-center gap-2.5">
                <Icon name="phone" className="h-4 w-4 text-brand-200" />
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a
                    href={CLIENT.phoneHref}
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    {CLIENT.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon name="map-pin" className="h-4 w-4 text-brand-200" />
                <dt className="sr-only">Clinic</dt>
                <dd>KPHB Phase 1, Kukatpally, Hyderabad</dd>
              </div>
            </dl>
          </div>

          {/* Product centrepiece + overlapping portrait for human warmth. */}
          <div className="relative animate-fade-up" style={{ animationDelay: "140ms" }}>
            <div className="relative mx-auto h-[21rem] w-full max-w-[26rem] sm:h-[26rem] lg:h-[31rem] lg:max-w-[30rem]">
              <ProductViewer className="h-full w-full" />
            </div>

            {/* Portrait chip — overlaps the render on large screens, sits
                beneath it on small ones so mobile keeps a human moment. */}
            <div className="mx-auto mt-5 w-full max-w-[26rem] lg:absolute lg:bottom-2 lg:-left-4 lg:mt-0 lg:w-40 xl:w-44">
              <Photo
                source={PHOTOS.heroCouple}
                sizes="(min-width: 1024px) 11rem, (min-width: 640px) 26rem, 100vw"
                className="aspect-[16/10] w-full rounded-2xl ring-1 ring-white/20 shadow-product lg:aspect-[3/4] lg:rounded-3xl"
                scrim="bottom"
              >
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[11px] font-semibold leading-snug text-white">
                    Conversations, family, everyday life.
                  </p>
                </div>
              </Photo>
            </div>
          </div>
        </Container>

        {/* Soft transition into the light sections below. */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-surface-muted"
          aria-hidden="true"
        />
      </section>

      {/* ══ 2. TRUST HIGHLIGHTS ═══════════════════════════════════════ */}
      <section className="bg-surface-muted">
        <Container className="pb-16 pt-6 sm:pb-20">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-card sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item, i) => (
              <Reveal key={item.title} delay={i * 70} className="bg-surface p-7 sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-100">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h2 className="mt-5 font-display font-semibold tracking-tight text-ink-900">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ══ 3. PHOTOGRAPHIC BAND — the human reason ═══════════════════ */}
      <section className="bg-surface-muted pb-16 sm:pb-20">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] shadow-float">
              <Photo
                source={PHOTOS.familyGrandfather}
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[21/9]"
                scrim="medium"
              >
                <div className="flex h-full flex-col justify-end p-8 sm:p-12 lg:p-14">
                  <div className="max-w-2xl">
                    <p className="eyebrow text-brand-200">Why hearing care matters</p>
                    <h2 className="headline mt-3 text-3xl text-white sm:text-4xl lg:text-[3rem]">
                      Hear the people who matter most.
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-50/90">
                      Hearing loss rarely arrives all at once. It shows up as
                      missed words, repeated questions and conversations you
                      quietly step away from. An assessment tells you exactly
                      where you stand — and what can be done about it.
                    </p>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <Button
                        href="/book-appointment"
                        size="lg"
                        className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                      >
                        <Icon name="calendar" className="h-5 w-5" />
                        Book an Appointment
                      </Button>
                      <Button
                        href="/hearing-tests"
                        variant="secondary"
                        size="lg"
                        className="btn-lift !border-white/30 !bg-white/[0.08] !text-white hover:!border-white/60 hover:!text-white"
                      >
                        What a test involves
                      </Button>
                    </div>
                  </div>
                </div>
              </Photo>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ══ 4. HEARING TESTS & SERVICES (editorial) ═══════════════════ */}
      <section className="bg-tint-gradient">
        <Container className="py-16 sm:py-24">
          <Reveal className="max-w-3xl">
            <p className="eyebrow text-brand-700">Hearing tests &amp; services</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl lg:text-[2.9rem]">
              Understand your hearing, one clear step at a time
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">
              Every assessment starts with a conversation. Tests are explained
              before they begin, and results are shared with you in plain
              language — not jargon.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
            {/* Featured panel — the audiogram explainer */}
            <Reveal className="h-full">
              <div className="bg-hero relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-900/20 p-7 text-white shadow-float sm:p-9">
                <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
                <div className="relative">
                  <Badge tone="brand" className="!bg-white/10 !text-brand-100 !ring-white/20">
                    How we assess hearing
                  </Badge>
                  <h3 className="headline mt-4 text-2xl sm:text-3xl">
                    What a hearing test actually measures
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-100/85">
                    A hearing assessment maps how softly you can hear across the
                    pitch range — from low, rumbling sounds to high, delicate
                    ones. The chart below is an illustration of that idea, not a
                    result. Your real results always come from a test in person.
                  </p>
                </div>

                <div className="relative mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                  <AudiogramExplainer className="h-40 w-full sm:h-48" />
                  <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-brand-100/60">
                    Illustration only — not a hearing test result
                  </p>
                </div>

                <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href="/book-appointment"
                    size="lg"
                    className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                  >
                    Book a Hearing Test
                  </Button>
                  <Button
                    href="/hearing-tests"
                    variant="secondary"
                    size="lg"
                    className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                  >
                    Which test do I need?
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* Supporting column: a real assessment photo + service links */}
            <Reveal delay={90} className="h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="product-zoom relative overflow-hidden rounded-2xl shadow-card">
                  <Photo
                    source={PHOTOS.hearingTestEar}
                    sizes="(min-width: 1024px) 38vw, 100vw"
                    className="aspect-[16/9] w-full"
                    scrim="soft"
                  >
                    <p className="absolute inset-x-4 bottom-3 text-xs font-medium text-white/90">
                      A comfortable, painless examination — usually under an hour.
                    </p>
                  </Photo>
                </div>

                {services.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/services/${s.code.toLowerCase()}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift sm:p-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                      <Icon name="ear" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-900">{s.name}</span>
                      {s.description ? (
                        <span className="mt-0.5 block truncate text-sm text-ink-500">
                          {s.description}
                        </span>
                      ) : null}
                    </span>
                    <Icon
                      name="arrow-right"
                      className="h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-700"
                    />
                  </Link>
                ))}

                {services.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-500 shadow-card">
                    Our service catalogue is being finalised. Please call{" "}
                    <a href={CLIENT.phoneHref} className="font-semibold text-brand-700">
                      {CLIENT.phone}
                    </a>{" "}
                    for current availability.
                  </div>
                ) : null}

                <Link
                  href="/services"
                  className="mt-auto inline-flex items-center gap-2 self-start px-1 pt-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  See every service
                  <Icon name="arrow-right" className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ══ CLINIC VIDEO ═════════════════════════════════════════════
          Placed after the services section and before the product
          showcase. Renders nothing in production until the clinic
          supplies a clip — see src/lib/media.ts. */}
      <VideoShowcase />

      {/* ══ 5. HEARING-AID SHOWCASE ══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 h-72 opacity-70 blur-3xl"
          style={{
            backgroundImage:
              "radial-gradient(30% 60% at 20% 0%, rgba(32,105,180,0.5), transparent 70%), radial-gradient(30% 60% at 80% 0%, rgba(220,38,56,0.22), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <Container className="relative py-16 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow text-brand-200">Hearing aids</p>
              <h2 className="headline mt-3 text-3xl sm:text-4xl lg:text-[2.9rem]">
                Modern devices, professionally fitted
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-100/80">
                A hearing aid is only as good as its fitting. Every device we
                supply is demoed, precisely programmed and supported in person
                at our Hyderabad clinic.
              </p>
            </div>
            <Link
              href="/hearing-aids"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              See how fitting works
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </Reveal>

          {featured.length === 0 ? (
            /* No client-approved models published yet: explain what we fit
               and how fitting works instead of inventing products. */
            <Reveal className="mt-10">
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div className="relative mx-auto h-80 w-full max-w-md sm:h-96">
                  <div
                    className="absolute inset-0 blur-3xl"
                    style={{
                      backgroundImage:
                        "radial-gradient(closest-side, rgba(255,255,255,0.28), rgba(77,139,203,0.18) 60%, transparent)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 animate-float-slow">
                    <HearingAidDevice
                      className="h-full w-full drop-shadow-2xl"
                      uid="homeShowcase"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="headline text-2xl sm:text-3xl">
                    Behind the ear, in the ear — or somewhere in between
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-brand-100/80">
                    We work with several manufacturers and technology levels.
                    The right choice depends on your hearing, the places you
                    actually find difficult, and how comfortable you are
                    handling small controls — so we decide it together, after
                    testing your hearing.
                  </p>

                  <ul className="mt-7 space-y-4">
                    {HOME_STYLES.map((style) => (
                      <li key={style.name} className="flex gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                          <Icon name="ear" className="h-4 w-4 text-white" />
                        </span>
                        <span>
                          <span className="block font-display font-semibold tracking-tight">
                            {style.name}
                          </span>
                          <span className="mt-0.5 block text-sm leading-relaxed text-brand-100/75">
                            {style.text}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      href="/hearing-aids"
                      size="lg"
                      className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                    >
                      Explore Hearing Aids
                      <Icon name="arrow-right" className="h-5 w-5" />
                    </Button>
                    <Button
                      href="/book-appointment"
                      size="lg"
                      variant="secondary"
                      className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                    >
                      <Icon name="calendar" className="h-5 w-5" />
                      Book a Consultation
                    </Button>
                  </div>

                  <p className="mt-6 text-sm leading-relaxed text-brand-100/70">
                    Models, specifications and prices are never published
                    online — they&apos;re explained in person, after your
                    hearing test.
                  </p>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {featured.map((model, i) => (
                  <Reveal key={model.id} delay={i * 90}>
                    <article className="product-zoom group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-glow backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25">
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
                          className="relative h-44 w-auto drop-shadow-2xl"
                          uid={`home-${model.modelCode}`}
                          animated={false}
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <p className="eyebrow text-brand-300">
                          {model.brand.name} · {deviceTypeLabel(model.deviceType)}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
                          {model.modelName}
                        </h3>
                        {model.description ? (
                          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-100/75">
                            {model.description}
                          </p>
                        ) : (
                          <div className="flex-1" />
                        )}
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button
                            href={`/hearing-aids#${model.modelCode}`}
                            size="sm"
                            className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                          >
                            View details
                          </Button>
                          <Button
                            href="/book-appointment"
                            size="sm"
                            variant="secondary"
                            className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
                          >
                            Book a consultation
                          </Button>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>

              <p className="mt-8 max-w-3xl text-sm leading-relaxed text-brand-100/70">
                Devices shown are examples from our catalogue. Your
                recommendation always begins with a hearing assessment and a
                conversation —{" "}
                <Link
                  href="/hearing-aids"
                  className="font-semibold text-white underline-offset-4 hover:underline"
                >
                  see how fitting works
                </Link>
                .
              </p>
            </>
          )}

          {/* Detail photograph — a real device on a real ear. */}
          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <Photo
                source={PHOTOS.hearingAidDetail}
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="aspect-[16/10] w-full sm:aspect-[21/9]"
                scrim="medium"
              >
                <div className="flex h-full items-end p-7 sm:p-10">
                  <div className="max-w-lg">
                    <h3 className="headline text-xl text-white sm:text-2xl">
                      Fitted to your ear, programmed to your hearing
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-brand-50/85">
                      The fit matters as much as the device. We take the time to
                      shape, program and re-check it — then adjust again as your
                      ears adapt.
                    </p>
                  </div>
                </div>
              </Photo>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ══ 6. HOME CONSULTATION (warm accent band) ══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-50 via-surface to-brand-50">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-float">
              <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="relative p-8 sm:p-12">
                  <span className="eyebrow text-accent-600">Home consultation</span>
                  <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
                    Care that comes to you.
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
                    Prefer care at home? QUALITY Hearing Care also offers home
                    consultation services. Book an appointment and our team can
                    coordinate a suitable visit.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-ink-600">
                    {[
                      "Same team, same standard of care",
                      "Ideal when travelling to the clinic is difficult",
                      "Home visits are confirmed by our team in advance",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                          <Icon name="check" className="h-3 w-3" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      href="/book-appointment?type=HOME_CONSULTATION"
                      variant="accent"
                      size="lg"
                      className="btn-lift"
                    >
                      <Icon name="home" className="h-5 w-5" />
                      Book Home Consultation
                    </Button>
                    <Button
                      href="/home-consultation"
                      variant="secondary"
                      size="lg"
                      className="btn-lift"
                    >
                      How it works
                    </Button>
                  </div>
                </div>

                <div className="relative min-h-[20rem]">
                  <Photo
                    source={PHOTOS.homeVisitFamily}
                    sizes="(min-width: 1024px) 46vw, 100vw"
                    className="h-full w-full"
                    scrim="bottom"
                    overlay
                  >
                    <div className="flex h-full items-end p-7 sm:p-8">
                      <p className="text-sm leading-relaxed text-white/95">
                        Home visits are arranged with you directly and confirmed
                        by our team — availability may vary.
                      </p>
                    </div>
                  </Photo>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ══ 7. SHARED SIGNS — interactive self-check ═════════════════ */}
      <section className="bg-surface">
        <Container className="py-16 sm:py-24">
          <Reveal className="max-w-3xl">
            <p className="eyebrow text-brand-700">Signs to look out for</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl lg:text-[2.9rem]">
              Does any of this sound familiar?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">
              Tick anything you recognise. It isn&apos;t a test and nothing is
              sent anywhere — it&apos;s simply a way to put words to what
              you&apos;ve been noticing.
            </p>
          </Reveal>

          <Reveal delay={90} className="mt-10">
            <HearingSelfCheck />
          </Reveal>
        </Container>
      </section>

      {/* ══ 8. THE PROCESS ═══════════════════════════════════════════ */}
      <section className="bg-surface-muted">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <div>
              <Reveal className="max-w-2xl">
                <p className="eyebrow text-brand-700">The process</p>
                <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
                  What happens after you book
                </h2>
              </Reveal>

              <ol className="mt-12 grid gap-8 sm:grid-cols-2">
                {PROCESS.map((step, i) => (
                  <Reveal as="li" key={step.title} delay={i * 90} className="relative">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-card">
                      <Icon name={step.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-4 block font-display text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                      Step {i + 1}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.text}</p>
                  </Reveal>
                ))}
              </ol>
            </div>

            <Reveal delay={140} className="lg:pt-16">
              <div className="product-zoom overflow-hidden rounded-3xl shadow-float">
                <Photo
                  source={PHOTOS.bookingHelp}
                  sizes="(min-width: 1024px) 34vw, 100vw"
                  className="aspect-[4/5] w-full"
                  scrim="bottom"
                >
                  <div className="flex h-full flex-col justify-end p-7">
                    <p className="eyebrow text-brand-200">No account needed</p>
                    <p className="mt-2 font-display text-lg font-semibold leading-snug text-white">
                      Booking takes about a minute — a name and a mobile number
                      is all it takes.
                    </p>
                  </div>
                </Photo>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ══ 9. ABOUT ═════════════════════════════════════════════════ */}
      <section className="bg-tint-gradient">
        <Container className="grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <Reveal>
            <p className="eyebrow text-brand-700">About the clinic</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl lg:text-[2.9rem]">
              Hearing care built around people, not equipment
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-600">
              QUALITY Hearing Care exists for one reason: to help people hear
              well enough to enjoy everyday life again — conversations across a
              table, a grandchild&apos;s voice, the television at a normal
              volume.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              That means time. Time to listen to what you&apos;ve noticed, time
              to test properly, and time to explain what the results mean for
              you — whether that ends in hearing aids or simply reassurance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/about" size="lg" className="btn-lift">
                More about us
              </Button>
              <Button href="/contact" variant="secondary" size="lg" className="btn-lift">
                <Icon name="phone" className="h-5 w-5" />
                Talk to our team
              </Button>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="product-zoom overflow-hidden rounded-3xl shadow-float">
              <Photo
                source={PHOTOS.consultationDoctor}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="aspect-[4/3] w-full"
                scrim="bottom"
              >
                <p className="absolute inset-x-6 bottom-5 text-sm font-medium text-white/95">
                  Every result is explained in person, in plain language.
                </p>
              </Photo>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ══ 10. FAQ ══════════════════════════════════════════════════ */}
      <section className="bg-surface">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.35fr] lg:items-start">
            <Reveal>
              <p className="eyebrow text-brand-700">Questions</p>
              <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
                Everything you might be wondering
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                Still unsure? Call us on{" "}
                <a
                  href={CLIENT.phoneHref}
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  {CLIENT.phone}
                </a>{" "}
                or{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  send a message
                </Link>
                . We&apos;re happy to talk it through.
              </p>
            </Reveal>

            <Reveal delay={90}>
              <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
                {FAQS.map((faq, i) => (
                  <details key={faq.q} className="group px-6 py-5 sm:px-7" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display font-semibold tracking-tight text-ink-900 [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-200 group-open:rotate-45">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 pr-10 text-sm leading-relaxed text-ink-500">{faq.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ══ 11. CONTACT & LOCATION ═══════════════════════════════════ */}
      <section className="bg-surface-muted">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
              <div className="grid lg:grid-cols-2">
                <div className="order-2 relative min-h-[16rem] lg:order-1">
                  <Photo
                    source={PHOTOS.careSupport}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="h-full w-full"
                    scrim="medium"
                    overlay
                  >
                    <div className="flex h-full flex-col justify-end p-8 sm:p-10">
                      <p className="eyebrow text-brand-200">Our Hyderabad clinic</p>
                      <p className="mt-2 font-display text-xl font-semibold leading-snug text-white">
                        One clinic, one team — and home visits across the city.
                      </p>
                    </div>
                  </Photo>
                </div>

                <div className="order-1 p-8 sm:p-10 lg:order-2">
                  <p className="eyebrow text-brand-700">Visit us</p>
                  <h2 className="headline mt-3 text-2xl text-ink-900 sm:text-3xl">
                    Kukatpally, Hyderabad
                  </h2>
                  <address className="mt-5 space-y-1 not-italic leading-relaxed text-ink-600">
                    {CLIENT.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button href={CLIENT.mapsUrl} variant="secondary" className="btn-lift">
                      <Icon name="map-pin" className="h-4 w-4" />
                      Get Directions
                    </Button>
                    <Button href="/contact" variant="ghost" className="btn-lift">
                      Contact details
                    </Button>
                  </div>
                  {clinic ? (
                    <p className="mt-7 rounded-xl bg-surface-muted p-4 text-xs leading-relaxed text-ink-500">
                      {clinic.name} is our one and only clinic — every clinic
                      appointment happens here.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
                <a
                  href={CLIENT.phoneHref}
                  className="flex items-center gap-4 bg-surface p-6 transition-colors hover:bg-brand-50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="phone" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-semibold text-ink-900">
                      {CLIENT.phone}
                    </span>
                    <span className="block text-xs text-ink-400">
                      Call for bookings &amp; enquiries
                    </span>
                  </span>
                </a>
                <a
                  href={`mailto:${CLIENT.email}`}
                  className="flex items-center gap-4 bg-surface p-6 transition-colors hover:bg-brand-50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block break-all font-display font-semibold text-ink-900">
                      {CLIENT.email}
                    </span>
                    <span className="block text-xs text-ink-400">
                      We reply as soon as we can
                    </span>
                  </span>
                </a>
                <a
                  href="/book-appointment?type=HOME_CONSULTATION"
                  className="flex items-center gap-4 bg-surface p-6 transition-colors hover:bg-accent-50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white">
                    <Icon name="home" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-semibold text-ink-900">
                      Home consultation
                    </span>
                    <span className="block text-xs text-ink-500">
                      Available in Hyderabad — subject to availability
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ══ 12. FINAL CTA ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden text-white">
        <Photo source={PHOTOS.lifestyleListening} sizes="100vw" className="h-full w-full" overlay />
        {/* Directional scrim — dense where the copy sits, clearing across the
            frame so the photograph still reads. A flat overlay plus a tint
            turned this into a muddy grey band. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-950/92 via-brand-950/82 to-brand-950/95 lg:bg-gradient-to-r lg:from-brand-950 lg:via-brand-950/90 lg:to-brand-950/30"
          aria-hidden="true"
        />

        <Container className="relative flex flex-col items-start gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <Reveal>
            <h2 className="headline text-3xl sm:text-4xl">Ready to hear better?</h2>
            <p className="mt-3 max-w-xl text-brand-100/90">
              Book a hearing assessment at our Kukatpally clinic, or request a
              home consultation. It takes about a minute — and you don&apos;t
              need an account.
            </p>
          </Reveal>
          <Reveal delay={90} className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Button href="/book-appointment" variant="accent" size="lg" className="btn-lift shrink-0">
              <Icon name="calendar" className="h-5 w-5" />
              Book Appointment
            </Button>
            <Button
              href={CLIENT.phoneHref}
              variant="secondary"
              size="lg"
              className="btn-lift shrink-0 !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              <Icon name="phone" className="h-5 w-5" />
              Call {CLIENT.phone}
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
