import { Button, Container, Icon, type IconName } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { SoundBars } from "@/components/brand/SoundWave";
import { Reveal } from "@/components/motion/Reveal";
import { TestimonialVideos } from "@/components/media/TestimonialVideos";
import { CLIENT } from "@/lib/client-info";

export const metadata = {
  title: "About Us — QUALITY Hearing Care, Kukatpally, Hyderabad",
  description:
    "QUALITY Hearing Care provides professional hearing tests, hearing aids and home consultations in KPHB Phase 1, Kukatpally, Hyderabad.",
  alternates: { canonical: "/about" },
};

const VALUES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "users",
    title: "We listen first",
    text: "Every appointment starts with what you've noticed, not with a machine.",
  },
  {
    icon: "shield",
    title: "Honest recommendations",
    text: "We suggest only what your results support — and we'll say when you don't need hearing aids.",
  },
  {
    icon: "sparkles",
    title: "Trial before you decide",
    text: "Hearing aids are demoed and trialled properly before any decision is made.",
  },
  {
    icon: "heart",
    title: "Aftercare that continues",
    text: "Fittings are checked, adjusted and supported long after the first appointment.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        photo={PHOTOS.consultationDoctor}
        eyebrow="About Us"
        title={
          <>
            Care built around the{" "}
            <span className="text-gradient-light">listener</span>
          </>
        }
        description={`${CLIENT.name} — ${CLIENT.tagline}. Professional hearing care, explained clearly and delivered with patience, at our clinic in Kukatpally, Hyderabad.`}
        actions={
          <>
            <Button
              href="/book-appointment"
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
            >
              <Icon name="calendar" className="h-5 w-5" />
              Book an Appointment
            </Button>
            <Button
              href="/services"
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
            >
              Explore Services
            </Button>
          </>
        }
        aside={
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-8 shadow-glow backdrop-blur-md">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
              <Icon name="ear" className="h-8 w-8 text-white" />
            </span>
            <p className="headline mt-6 text-xl">
              Hearing well enough to enjoy everyday life again.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-100/85">
              Conversations across a table. A grandchild&apos;s voice. The
              television at a normal volume. That&apos;s what we work towards.
            </p>
            <SoundBars className="mt-7 h-14 w-full" bars={19} />
          </div>
        }
      />

      {/* Story */}
      <section className="bg-surface-muted">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <p className="eyebrow text-brand-700">Our approach</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              Time is the part most clinics skip
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-600">
              <p>
                Hearing loss rarely announces itself. It creeps in — you ask
                people to repeat themselves, the television gets louder, group
                conversations start to feel like hard work. By the time someone
                books a test, they&apos;ve often been living with it for years.
              </p>
              <p>
                So we don&apos;t rush the appointment. We test properly, on
                calibrated equipment, and then we sit down and explain what the
                results mean for your daily life — not just what they are.
              </p>
              <p>
                If a hearing aid could help, you&apos;ll demo and trial devices
                before deciding. If your hearing doesn&apos;t need them, we&apos;ll
                tell you that plainly.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="grid gap-4 sm:grid-cols-2">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={value.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display font-semibold tracking-tight text-ink-900">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{value.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Patient testimonial videos. Renders nothing until the clinic supplies
          a recording and the patient has approved its use — there are no
          invented patients here, and there never will be. */}
      <TestimonialVideos />

      {/* Clinic + contact */}
      <section className="bg-band-soft">
        <Container className="py-14 sm:py-20">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-brand-700">Our clinic</p>
            <h2 className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
              One clinic, in the heart of Kukatpally
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Every clinic appointment happens at our KPHB Phase 1 clinic. If
              travelling is difficult, home consultation is available and
              arranged directly with you.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Reveal>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="map-pin" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display font-semibold text-ink-900">Where we are</h3>
                <a
                  href={CLIENT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                  className="mt-3 flex-1"
                >
                  <address className="space-y-1 not-italic text-sm leading-relaxed text-ink-600 underline-offset-4 hover:text-brand-700 hover:underline">
                    {CLIENT.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </a>
                <a
                  href={CLIENT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Get Directions
                  <Icon name="arrow-right" className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="phone" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display font-semibold text-ink-900">Talk to us</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">
                  The quickest way to get an answer is to call. For anything
                  non-urgent, email works too — we reply as soon as we can.
                </p>
                <div className="mt-4 space-y-2 text-sm font-semibold">
                  <a
                    href={CLIENT.phoneHref}
                    className="block text-brand-700 hover:text-brand-800"
                  >
                    {CLIENT.phone}
                  </a>
                  <a
                    href={`mailto:${CLIENT.email}`}
                    className="block break-all text-brand-700 hover:text-brand-800"
                  >
                    {CLIENT.email}
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="flex h-full flex-col rounded-3xl border border-accent-100 bg-gradient-to-br from-accent-50/70 to-surface p-7 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-white">
                  <Icon name="home" className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display font-semibold text-ink-900">
                  Home consultations
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">
                  Available in Hyderabad on request. Book online and our team
                  will contact you to arrange a suitable time — subject to
                  availability.
                </p>
                <Button
                  href="/book-appointment?type=HOME_CONSULTATION"
                  variant="accent"
                  size="sm"
                  className="btn-lift mt-4 self-start"
                >
                  Book Home Consultation
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
