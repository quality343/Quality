import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PHOTOS } from "@/lib/images";
import { Reveal } from "@/components/motion/Reveal";
import { CLIENT, homeConsultationHref, WHATSAPP } from "@/lib/client-info";

export const metadata = {
  title: "Hearing Health Blog — QUALITY Hearing Care, Hyderabad",
  description:
    "Practical guidance on hearing health, hearing tests and hearing aids from the QUALITY Hearing Care team in Kukatpally, Hyderabad.",
  alternates: { canonical: "/blog" },
};

// Topics we intend to cover — labelled as upcoming, never faked as published.
const PLANNED_TOPICS = [
  "Signs your hearing has changed (and why it's easy to miss)",
  "What actually happens during a hearing test",
  "Choosing a hearing aid: what matters beyond the price",
  "Caring for hearing aids in Hyderabad's climate",
  "Talking to family about hearing loss",
  "When a home consultation makes sense",
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        photo={PHOTOS.listeningAudio}
        eyebrow="Blog"
        title={
          <>
            Hearing health,{" "}
            <span className="text-gradient-light">explained simply</span>
          </>
        }
        description="Practical, plain-language guidance from our team. We publish nothing until it has been reviewed — so there are no invented articles here, only what's genuinely useful."
        actions={
          <Button
            href="/contact"
            size="lg"
            className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
          >
            <Icon name="mail" className="h-5 w-5" />
            Ask us a question
          </Button>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="rounded-3xl border border-border bg-surface p-8 shadow-card sm:p-10">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="bell" className="h-6 w-6" />
                </span>
                <h2 className="headline mt-6 text-2xl text-ink-900">
                  Articles are being prepared
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                  We&apos;re writing our first guides on hearing health, hearing
                  aids and home care. Nothing gets published until our team has
                  reviewed it — and we won&apos;t publish anything we can&apos;t
                  stand behind.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                  In the meantime, questions are welcome. Message us on WhatsApp
                  on{" "}
                  <a
                    href={WHATSAPP.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                    className="font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {CLIENT.phone}
                  </a>{" "}
                  and we&apos;ll answer directly.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href={homeConsultationHref}
                    size="md"
                    className="btn-lift"
                    aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
                  >
                    <Icon name="home" className="h-4 w-4" />
                    Request Home Consultation
                  </Button>
                  <Button href="/contact" variant="secondary" size="md" className="btn-lift">
                    Send a message
                  </Button>
                </div>
              </div>

              <div>
                <p className="eyebrow text-brand-700">Coming up</p>
                <ul className="mt-5 space-y-3">
                  {PLANNED_TOPICS.map((topic, i) => (
                    <Reveal as="li" key={topic} delay={i * 60}>
                      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-card">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-ink-400">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-ink-600">{topic}</span>
                      </div>
                    </Reveal>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-ink-400">
                  Topics are planned — not yet published. Nothing here is
                  attributed to a named author until it is written and reviewed.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
