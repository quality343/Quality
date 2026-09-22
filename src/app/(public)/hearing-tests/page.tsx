import Link from "next/link";
import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { AudiogramExplainer } from "@/components/brand/SoundWave";
import { Reveal } from "@/components/motion/Reveal";
import { VideoSection } from "@/components/media/VideoSection";
import { VIDEO } from "@/lib/media";
import { prisma } from "@/server/db/prisma";

export const metadata = {
  title: "Hearing Tests in Hyderabad — QUALITY Hearing Care, Kukatpally",
  description:
    "Hearing tests explained simply: pure tone audiometry, speech audiometry, tympanometry, ABR/BERA and OAE at QUALITY Hearing Care, Kukatpally, Hyderabad. Book online.",
  alternates: { canonical: "/hearing-tests" },
};

const TEST_INFO: Record<string, { what: string; why: string; plain: string }> = {
  "PURE-TONE-AUDIOMETRY": {
    what: "The most common hearing test — you listen for soft beeps at different pitches.",
    why: "Shows the quietest sounds you can hear at each pitch, for each ear.",
    plain:
      "You wear headphones and raise your hand (or press a button) when you hear a beep. Takes about 30 minutes.",
  },
  "SPEECH-AUDIOMETRY": {
    what: "Measures how clearly you understand spoken words, not just tones.",
    why: "Two people can hear the same sounds but understand speech differently — this shows why.",
    plain:
      "You repeat back words spoken at different volumes. It helps explain why some conversations feel harder than others.",
  },
  TYMPANOMETRY: {
    what: "A quick check of how well your middle ear is working.",
    why: "Fluid, pressure problems, or blockages behind the eardrum can affect hearing and are often treatable.",
    plain:
      "A small soft tip sits in your ear and gently changes air pressure. It takes under a minute and needs no responses from you.",
  },
  "ABR-BERA": {
    what: "Records how the hearing nerve responds to sound — no response needed from you.",
    why: "Useful when a standard test isn't possible, or when more detail about the hearing pathway is needed.",
    plain:
      "Small sensors rest on your head while you relax or sleep, and sounds play through earphones. Completely painless.",
  },
  "OAE-SCREENING": {
    what: "Checks the inner ear's natural response to sound.",
    why: "A common, quick way to check inner-ear function — often used for young children too.",
    plain:
      "A tiny probe in the ear plays soft sounds and listens for the ear's echo. Takes a few minutes.",
  },
};

const FALLBACK = {
  what: "A focused assessment carried out by our team.",
  why: "Helps build a complete picture of your hearing.",
  plain: "Our team will explain each step before it happens and answer your questions.",
};

const EXPECT: { title: string; text: string }[] = [
  {
    title: "A short conversation first",
    text: "We ask what you've noticed — noisy places, the television, family voices — so the test answers the right questions.",
  },
  {
    title: "A comfortable, quiet test",
    text: "Nothing is painful and nothing is invasive. Most people find it genuinely relaxing.",
  },
  {
    title: "Results you can understand",
    text: "Your audiogram is explained in plain language, on the day, by the person who tested you.",
  },
];

export default async function HearingTestsPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true, category: { in: ["HEARING_TEST", "DIAGNOSTIC"] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHero
        photo={PHOTOS.hearingTestEar}
        eyebrow="Hearing Tests"
        title={
          <>
            Know your hearing,{" "}
            <span className="text-gradient-light">in plain language</span>
          </>
        }
        description="A hearing test is simple, painless, and usually takes under an hour. Here's what we offer and what each one involves — your results are always explained by our team, never by a machine."
        actions={
          <>
            <Button
              href="/book-appointment"
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
            >
              <Icon name="calendar" className="h-5 w-5" />
              Book a Hearing Test
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              Ask which test I need
            </Button>
          </>
        }
        aside={
          <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 shadow-glow backdrop-blur-md sm:p-6">
            <AudiogramExplainer className="h-44 w-full sm:h-52" />
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-brand-100/60">
              Illustration of how hearing is mapped — not a test result
            </p>
          </div>
        }
      />

      {/* What to expect */}
      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">What to expect</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Three things happen at every appointment
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {EXPECT.map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <div className="h-full rounded-3xl border border-border bg-surface p-7 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-lg font-bold text-white shadow-card">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display font-semibold tracking-tight text-ink-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Video — what an assessment involves, explained before the list of
          tests so a visitor knows what they are choosing between. */}
      <VideoSection slot={VIDEO.hearingTest} tone="tinted" />

      {/* Test catalogue */}
      <section className="bg-band-soft">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">Our tests</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Each test, explained
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              These are descriptions, not diagnoses. Which test is right for you
              is decided in person, after we&apos;ve listened to what you&apos;ve
              noticed.
            </p>
          </Reveal>

          {services.length === 0 ? (
            <Reveal className="mt-10">
              <div className="rounded-3xl border border-border bg-surface-muted p-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="ear" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display font-semibold text-ink-900">
                  Our test list is being finalised
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  Call us and we&apos;ll tell you exactly which assessments are
                  currently available at our Kukatpally clinic.
                </p>
              </div>
            </Reveal>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {services.map((service, i) => {
                const info = TEST_INFO[service.code] ?? FALLBACK;
                return (
                  <Reveal key={service.id} delay={(i % 2) * 90}>
                    <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                          {service.name}
                        </h3>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                          <Icon name="clock" className="h-3.5 w-3.5" />
                          {service.durationMinutes} min
                        </span>
                      </div>

                      <dl className="mt-5 flex-1 space-y-4 text-sm leading-relaxed">
                        {[
                          ["What it is", info.what],
                          ["Why it may be done", info.why],
                          ["What to expect", info.plain],
                        ].map(([label, text]) => (
                          <div key={label}>
                            <dt className="font-display font-semibold text-ink-800">{label}</dt>
                            <dd className="mt-1 text-ink-500">{text}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                        <Button href={`/book-appointment?service=${service.id}`} size="sm" className="btn-lift">
                          <Icon name="calendar" className="h-4 w-4" />
                          Book This Test
                        </Button>
                        <Link
                          href={`/services/${service.code.toLowerCase()}`}
                          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Full details
                          <Icon name="arrow-right" className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <Container className="relative flex flex-col items-start gap-7 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <Reveal>
            <h2 className="headline text-2xl sm:text-3xl">Not sure which test you need?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-100/85">
              You don&apos;t have to decide. Book a consultation and our team will
              recommend the right assessment for you — or call and ask.
            </p>
          </Reveal>
          <Reveal delay={80} className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Button href="/book-appointment" variant="accent" size="lg" className="btn-lift shrink-0">
              Book an Appointment
            </Button>
            <Button
              href="/home-consultation"
              variant="secondary"
              size="lg"
              className="btn-lift shrink-0 !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              <Icon name="home" className="h-5 w-5" />
              Home consultation
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
