import { Button, Container, Icon } from "@/components/ui";
import { PageHero } from "@/components/layout/PageHero";
import { SocialIcon } from "@/components/brand/SocialIcons";
import { PHOTOS } from "@/lib/images";
import { Reveal } from "@/components/motion/Reveal";
import { listBranches } from "@/server/services/queries";
import { CLIENT, homeConsultationHref, WHATSAPP } from "@/lib/client-info";

export const metadata = {
  title: "Our Clinic in Kukatpally, Hyderabad — QUALITY Hearing Care",
  description:
    "Visit QUALITY Hearing Care at KPHB Phase 1, Kukatpally, Hyderabad. Get directions, call us, or message us on WhatsApp — home consultation available on request.",
  alternates: { canonical: "/branches" },
};

export default async function BranchesPage() {
  const branches = await listBranches();

  return (
    <>
      <PageHero
        photo={PHOTOS.careSupport}
        eyebrow="Our Clinic"
        title={
          <>
            One clinic,{" "}
            <span className="text-gradient-light">right here in Hyderabad</span>
          </>
        }
        description="QUALITY Hearing Care operates a single clinic in KPHB Phase 1, Kukatpally. All clinic appointments take place here — no confusing branch network, no long travel."
        actions={
          <>
            <Button
              href={WHATSAPP.href}
              size="lg"
              className="btn-lift !bg-white !text-brand-800 hover:!bg-brand-50"
              aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
            >
              <SocialIcon id="whatsapp" className="h-5 w-5" />
              Message us on WhatsApp
            </Button>
            <Button
              href={CLIENT.mapsUrl}
              variant="secondary"
              size="lg"
              className="btn-lift !border-white/25 !bg-white/[0.08] !text-white hover:!border-white/50 hover:!text-white"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
            >
              <Icon name="map-pin" className="h-5 w-5" />
              Get Directions
            </Button>
          </>
        }
        aside={
          <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-7 shadow-glow backdrop-blur-md">
            <p className="eyebrow text-brand-200">Clinic address</p>
            <a
              href={CLIENT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
              className="mt-3 block"
            >
              <address className="space-y-1 not-italic leading-relaxed text-brand-100/90 underline-offset-4 hover:text-white hover:underline">
                {CLIENT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </a>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm">
              <a
                href={WHATSAPP.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                className="inline-flex items-center gap-2 font-semibold text-white underline-offset-4 hover:underline"
              >
                <SocialIcon id="whatsapp" className="h-4 w-4 text-brand-200" />
                {CLIENT.phone}
              </a>
              <a
                href={`mailto:${CLIENT.email}`}
                className="inline-flex items-center gap-2 break-all font-semibold text-white underline-offset-4 hover:underline"
              >
                <Icon name="mail" className="h-4 w-4 text-brand-200" />
                {CLIENT.email}
              </a>
            </div>
          </div>
        }
      />

      <section className="bg-surface-muted">
        <Container className="py-14 sm:py-20">
          {branches.length === 0 ? (
            <Reveal>
              <div className="rounded-3xl border border-border bg-surface p-12 text-center shadow-card">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="map-pin" className="h-6 w-6" />
                </span>
                <h2 className="headline mt-5 text-2xl text-ink-900">
                  Clinic details are being confirmed
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
                  and we&apos;ll share our address and directions directly.
                </p>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-6">
              {branches.map((branch, i) => (
                <Reveal key={branch.id} delay={i * 90}>
                  <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
                    <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
                      <div className="p-8 sm:p-10">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-card">
                            <Icon name="map-pin" className="h-6 w-6" />
                          </span>
                          <div>
                            <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">
                              {branch.name}
                            </h2>
                            {branch.city ? (
                              <p className="text-sm text-ink-500">{branch.city}</p>
                            ) : null}
                          </div>
                          {/* The "online booking open / call to book" badge was
                              tied to the retired booking engine — every clinic
                              now takes enquiries the same way. */}
                          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-500">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-brand-600"
                              aria-hidden="true"
                            />
                            Appointments by phone or WhatsApp
                          </span>
                        </div>

                        {branch.address ? (
                          <address className="mt-6 not-italic text-sm leading-relaxed text-ink-600">
                            {branch.address}
                          </address>
                        ) : null}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <Button
                            href={WHATSAPP.href}
                            size="md"
                            className="btn-lift"
                            aria-label="Chat with Quality Hearing Care on WhatsApp (opens in a new tab)"
                          >
                            <SocialIcon id="whatsapp" className="h-4 w-4" />
                            Message us on WhatsApp
                          </Button>
                          <Button
                            href={`/branches/${branch.code.toLowerCase()}`}
                            variant="secondary"
                            size="md"
                            className="btn-lift"
                          >
                            Clinic details
                          </Button>
                        </div>
                      </div>

                      <div className="relative flex flex-col justify-center gap-3 border-t border-border bg-gradient-to-br from-brand-50/60 to-surface p-8 lg:border-l lg:border-t-0">
                        {branch.phone ? (
                          <a
                            href={`tel:${branch.phone.replace(/\s/g, "")}`}
                            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm font-semibold text-ink-900 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                              <Icon name="phone" className="h-5 w-5" />
                            </span>
                            {branch.phone}
                          </a>
                        ) : null}
                        <a
                          href={CLIENT.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open Quality Hearing Care location in Google Maps (opens in a new tab)"
                          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm font-semibold text-ink-900 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            <Icon name="map-pin" className="h-5 w-5" />
                          </span>
                          Get Directions
                        </a>
                        <div className="flex items-center gap-3 rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm font-semibold text-ink-900">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white">
                            <Icon name="home" className="h-5 w-5" />
                          </span>
                          <span>
                            Home consultation
                            <span className="mt-0.5 block text-xs font-normal text-ink-500">
                              Available in Hyderabad on request
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={120}>
            <p className="mt-8 text-sm leading-relaxed text-ink-500">
              Can&apos;t travel to the clinic?{" "}
              <a
                href={homeConsultationHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Request a home consultation on WhatsApp (opens in a new tab)"
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                Request a home consultation on WhatsApp
              </a>{" "}
              and our team will contact you to arrange a suitable time.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
