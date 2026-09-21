import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Icon, type IconName } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { SoundBars } from "@/components/brand/SoundWave";
import { Reveal } from "@/components/motion/Reveal";
import { VideoSection } from "@/components/media/VideoSection";
import { VIDEO } from "@/lib/media";
import { CLIENT } from "@/lib/client-info";

export const metadata: Metadata = {
  title: "Home Consultation in Hyderabad — QUALITY Hearing Care",
  description:
    "Prefer care at home? QUALITY Hearing Care offers home consultations in Hyderabad, subject to availability. Request a visit online and our team will call to confirm.",
  alternates: { canonical: "/home-consultation" },
};

const POINTS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "users",
    title: "Who it's for",
    text: "Anyone who finds travelling to the clinic difficult — elderly family members, those with mobility concerns, or simply a preference for being at home.",
  },
  {
    icon: "calendar",
    title: "How it works",
    text: "Request a visit online with your preferred date and time of day. Our team calls you back to confirm a suitable time before anything is finalised.",
  },
  {
    icon: "ear",
    title: "What we bring",
    text: "The same hearing assessments we do at the clinic, along with hearing-aid demos, fitting support and follow-up care where appropriate.",
  },
];

export default function HomeConsultationPage() {
  return (
    <>
      <PageHero
        photo={PHOTOS.homeCare}
        eyebrow="Home Consultation"
        title={
          <>
            Care that comes{" "}
            <span className="text-gradient-light">to you.</span>
          </>
        }
        description="Prefer care at home? QUALITY Hearing Care also offers home consultation services. Book an appointment and our team can coordinate a suitable visit."
        actions={
          <>
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
              href={CLIENT.phoneHref}
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              <Icon name="phone" className="h-5 w-5" />
              Call {CLIENT.phone}
            </Button>
          </>
        }
        aside={
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-8 text-center shadow-glow backdrop-blur-md">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
              <Icon name="home" className="h-9 w-9 text-white" />
            </span>
            <SoundBars className="mx-auto mt-7 h-16 w-full max-w-xs" bars={17} />
            <p className="mt-5 text-sm leading-relaxed text-brand-100/85">
              Home visits are arranged with you directly and confirmed by our
              team. Availability may vary — we never promise a visit before we
              have spoken to you.
            </p>
          </div>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">How home visits work</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              The same standard of care, in your own home
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {POINTS.map((point, i) => (
              <Reveal key={point.title} delay={i * 90}>
                <div className="h-full rounded-3xl border border-border bg-surface p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-100">
                    <Icon name={point.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink-900">
                    {point.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{point.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Video — what a home visit involves. Sits after the reassurances and
          before the request steps, so it answers questions before asking for
          an address. */}
      <VideoSection slot={VIDEO.homeConsultation} tone="tinted" />

      <section className="bg-surface">
        <Container className="py-14 sm:py-20">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
              <div className="grid lg:grid-cols-[1.3fr_1fr]">
                <div className="p-8 sm:p-11">
                  <p className="eyebrow text-accent-600">Request a visit</p>
                  <h2 className="headline mt-3 text-2xl text-ink-900 sm:text-3xl">
                    Three steps, about a minute
                  </h2>
                  <ol className="mt-7 space-y-5">
                    {[
                      "Request online — pick a preferred date and time of day, no account needed",
                      "We call to confirm a suitable visit window with you",
                      "Our team arrives with everything needed for the assessment",
                    ].map((step, i) => (
                      <li key={step} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-sm font-bold text-white">
                          {i + 1}
                        </span>
                        <p className="pt-1 text-sm leading-relaxed text-ink-600">{step}</p>
                      </li>
                    ))}
                  </ol>
                  <Button
                    href="/book-appointment?type=HOME_CONSULTATION"
                    variant="accent"
                    size="lg"
                    className="btn-lift mt-8 w-full sm:w-auto"
                  >
                    <Icon name="home" className="h-5 w-5" />
                    Book Home Consultation
                  </Button>
                  <p className="mt-4 text-xs leading-relaxed text-ink-400">
                    Your address is only ever visible to our authorised clinic
                    team. It is never shown publicly or shared.
                  </p>
                </div>

                <div className="relative flex flex-col justify-center gap-4 border-t border-border bg-gradient-to-br from-brand-50/60 to-surface p-8 sm:p-10 lg:border-l lg:border-t-0">
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                      <Icon name="home" className="h-5 w-5" />
                    </span>
                    <span className="text-sm leading-relaxed text-ink-700">
                      Available in Hyderabad, subject to availability
                    </span>
                  </div>
                  <a
                    href={CLIENT.phoneHref}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon name="phone" className="h-5 w-5" />
                    </span>
                    <span className="font-display font-semibold text-ink-900">
                      {CLIENT.phone}
                    </span>
                  </a>
                  <a
                    href={`mailto:${CLIENT.email}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon name="mail" className="h-5 w-5" />
                    </span>
                    <span className="break-all font-display font-semibold text-ink-900">
                      {CLIENT.email}
                    </span>
                  </a>
                  <p className="text-sm text-ink-500">
                    Looking for a clinic appointment instead?{" "}
                    <Link
                      href="/book-appointment"
                      className="font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Book at our Kukatpally clinic
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
