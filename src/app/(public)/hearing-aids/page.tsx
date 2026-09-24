import Image from "next/image";
import Link from "next/link";
import { Button, Container, Icon, type IconName } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { HearingAidDevice } from "@/components/brand/HearingAidDevice";
import { SocialIcon } from "@/components/brand/SocialIcons";
import { DeviceTypeArt, type DeviceArtType } from "@/components/brand/DeviceTypeArt";
import { Reveal } from "@/components/motion/Reveal";
import { VideoSection } from "@/components/media/VideoSection";
import { VIDEO } from "@/lib/media";
import { deviceTypeLabel, techLevelLabel } from "@/lib/hearing-aids";
import { prisma } from "@/server/db/prisma";
import {
  CLIENT,
  homeConsultationHref,
  WHATSAPP,
  whatsappEnquiry,
} from "@/lib/client-info";

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

/**
 * The six types the clinic supplies, in the order the clinic presents them.
 *
 * Taken from the clinic's own "Types of Hearing Aids" reference. These are the
 * definitions of the formats themselves — nothing here is a specification, a
 * brand or a claim about how well any one device performs.
 */
const DEVICE_TYPES: {
  code: DeviceArtType;
  label: string;
  name: string;
  text: string;
  /** The one format visitors ask about most, so it is called out. */
  highlighted?: boolean;
  badge?: string;
}[] = [
  {
    code: "IIC",
    label: "IIC",
    name: "Invisible in canal",
    text: "Custom-made from an impression of your ear and worn deep in the canal, so it stays out of sight.",
  },
  {
    code: "RIC",
    label: "RIC",
    name: "Receiver in canal",
    text: "The receiver sits inside the canal on a thin wire, while the main body rests discreetly behind the ear.",
  },
  {
    code: "CIC",
    label: "CIC",
    name: "Completely in canal",
    text: "A custom shell that sits entirely within the canal, made to measure from an impression of your ear.",
  },
  {
    code: "RECHARGEABLE",
    label: "Rechargeable",
    name: "Rechargeable hearing aid",
    text: "Charged in their case instead of taking batteries — a format available across several of the styles shown here.",
    highlighted: true,
    badge: "Rechargeable",
  },
  {
    code: "ITC",
    label: "ITC",
    name: "In the canal",
    text: "A slightly larger custom shell that fills the canal opening, with its faceplate where you can reach it.",
  },
  {
    code: "BTE",
    label: "BTE",
    name: "Behind the ear",
    text: "A small body rests behind the ear, joined by a tube to a custom earmould — the largest of the styles.",
  },
];

/**
 * What hearing aids are fitted to help with, in the clinic's own words.
 *
 * The wording is fixed — it is the clinic's copy and the meaning must not
 * drift. Whether any of it applies to a particular visitor is exactly what a
 * hearing test answers, which is what the closing note says.
 */
const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: "ear", text: "Hear conversations more clearly" },
  { icon: "chat", text: "Communicate more comfortably" },
  { icon: "phone", text: "Follow phone conversations better" },
  { icon: "video", text: "More comfort while watching TV" },
  { icon: "users", text: "Stay engaged in social gatherings" },
  { icon: "shield", text: "Greater safety while driving or walking" },
  { icon: "heart", text: "Feel more confident in everyday life" },
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
              href={whatsappEnquiry("hearing aids")}
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
              aria-label="Ask about hearing aids on WhatsApp (opens in a new tab)"
            >
              <SocialIcon id="whatsapp" className="h-5 w-5" />
              Ask about hearing aids
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

      {/* Device types — the six formats the clinic supplies, described plainly
          and illustrated with original vector art. No model, manufacturer or
          specification is claimed anywhere in this section. */}
      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">Types of hearing aids</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Six types — which one suits you is decided together
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Comfort, visibility and what you need to hear well all matter — and
              they pull in different directions. These are the formats we fit, and
              we&apos;ll talk through the trade-offs with you in person.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DEVICE_TYPES.map((device, i) => (
              <Reveal key={device.code} delay={(i % 3) * 70}>
                <article
                  className={`flex h-full flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                    device.highlighted
                      ? "border-brand-300 bg-gradient-to-b from-brand-50/80 to-surface shadow-lift ring-2 ring-brand-200"
                      : "border-border bg-surface shadow-card"
                  }`}
                >
                  <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-50 via-surface to-surface-muted">
                    <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />
                    <DeviceTypeArt
                      type={device.code}
                      uid={`type-${device.code}`}
                      className="relative h-36 w-auto"
                    />
                    {device.badge ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-card">
                        <Icon name="bolt" className="h-3.5 w-3.5" />
                        {device.badge}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-5 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                    {device.label}
                  </p>
                  <h3 className="headline mt-2 text-xl text-ink-900">{device.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">
                    {device.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Rechargeable format — called out with its own treatment and the
              clinic's own charging-case photo, since it is the one visitors
              ask about most. */}
          <Reveal delay={80}>
            <div className="mt-6 grid overflow-hidden rounded-3xl border border-brand-200 bg-surface shadow-card lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="p-7 sm:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-800 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Icon name="bolt" className="h-3.5 w-3.5" />
                  Rechargeable
                </span>
                <h3 className="headline mt-5 text-2xl text-ink-900 sm:text-3xl">
                  Charged in a case, not with batteries
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
                  Several of the types above are available in a rechargeable
                  version: the aids sit in their case to charge, so there are no
                  batteries to change. Ask us which formats offer it for your
                  hearing before you decide — we&apos;ll show you both.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href={whatsappEnquiry("rechargeable hearing aids")}
                    size="lg"
                    className="btn-lift"
                    aria-label="Ask about rechargeable hearing aids on WhatsApp (opens in a new tab)"
                  >
                    <SocialIcon id="whatsapp" className="h-5 w-5" />
                    Ask about rechargeable
                  </Button>
                  <Button href="/contact" variant="secondary" size="lg" className="btn-lift">
                    Send us a message
                  </Button>
                </div>
              </div>

              {/* Studio-grey plate so the clinic's photo sits seamlessly, with
                  no crop and no distortion of the case. */}
              <div className="relative flex items-center justify-center bg-[#d9d9d9] p-6 sm:p-8">
                <Image
                  src={PHOTOS.hearingAidChargingCase.src}
                  alt={PHOTOS.hearingAidChargingCase.alt}
                  width={PHOTOS.hearingAidChargingCase.width}
                  height={PHOTOS.hearingAidChargingCase.height}
                  sizes="(min-width: 1024px) 32rem, 90vw"
                  className="h-auto w-full max-w-md object-contain"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-sm leading-relaxed text-ink-500">
              Which of these we recommend depends on your hearing test, the shape
              of your ear canal and how comfortable you are handling a small
              control — never on what happens to be in stock.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* What the devices are for, in the clinic's own words. */}
      <section className="bg-band-soft">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">Everyday life</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Hearing aids can help
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              These are the everyday situations hearing aids are fitted to help
              with. Which of them apply to you is what a hearing assessment
              answers — and if aids are unlikely to help, we will tell you that
              too.
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <Reveal
                as="li"
                key={benefit.text}
                delay={i * 60}
                className={
                  i === BENEFITS.length - 1 ? "sm:col-span-2 lg:col-span-3" : undefined
                }
              >
                <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <Icon name={benefit.icon} className="h-5 w-5" />
                  </span>
                  <p className="font-display text-base font-semibold leading-snug text-ink-900">
                    {benefit.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
                Not everyone who struggles to hear needs a hearing aid. Your
                hearing test tells you which of these situations yours is — and
                that honest answer is part of the appointment, not a sales pitch.
              </p>
              <Button
                href={whatsappEnquiry("a hearing test")}
                size="lg"
                className="btn-lift shrink-0"
                aria-label="Ask about a hearing test on WhatsApp (opens in a new tab)"
              >
                <SocialIcon id="whatsapp" className="h-5 w-5" />
                Ask about a hearing test
              </Button>
            </div>
          </Reveal>
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
                      href={whatsappEnquiry("hearing aids")}
                      size="lg"
                      className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                      aria-label="Ask about hearing aids on WhatsApp (opens in a new tab)"
                    >
                      <SocialIcon id="whatsapp" className="h-5 w-5" />
                      Ask about hearing aids
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
                      Message us on WhatsApp on{" "}
                      <a
                        href={WHATSAPP.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
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
                          href={whatsappEnquiry("hearing aids")}
                          size="sm"
                          className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
                          aria-label="Talk to our team on WhatsApp (opens in a new tab)"
                        >
                          <SocialIcon id="whatsapp" className="h-4 w-4" />
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
                  Ask us about hearing aids
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
                  A hearing test first, then an honest conversation about whether
                  hearing aids would help — and what they&apos;d involve.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Button
                  href={whatsappEnquiry("hearing aids")}
                  size="lg"
                  className="btn-lift"
                  aria-label="Ask about hearing aids on WhatsApp (opens in a new tab)"
                >
                  <SocialIcon id="whatsapp" className="h-5 w-5" />
                  Ask about hearing aids
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
