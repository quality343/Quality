import { Button, Container } from "@/components/ui";
import { Photo } from "@/components/media/Photo";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { Reveal } from "@/components/motion/Reveal";
import { VIDEO_ASPECT, type VideoSlot } from "@/lib/media";
import { SITE_URL } from "@/lib/site-url";

/**
 * The one reusable video section.
 *
 * Every video on the public site is rendered through here, so there is exactly
 * one place that knows how a video section looks, one place that decides what
 * happens when footage is missing, and one place that emits the structured data
 * search engines read. Pages differ only by which slot they pass in.
 *
 * The missing-footage case is the important one. This section is written to be
 * *complete without a video*: heading, description, poster photograph and call
 * to action all stand on their own, and the play button simply is not rendered.
 * That is deliberate — a play button that does nothing is worse than no play
 * button, because it makes the clinic look broken. When the clinic supplies a
 * clip, `src/lib/media.ts` is the only file that changes.
 */

const TONE = {
  surface: "bg-surface",
  tinted: "bg-tint-gradient",
  muted: "bg-surface-muted",
} as const;

/** Absolute URL for structured data, matching robots.ts / sitemap.ts. */
function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * VideoObject markup — emitted **only** when a slot actually has footage. No
 * invented `uploadDate`, and no markup for a video that does not exist, because
 * structured data describing a non-existent video is a lie to search engines.
 */
function videoJsonLd(slot: VideoSlot) {
  if (!slot.clip) return null;

  const contentUrl =
    slot.clip.kind === "file"
      ? absolute(slot.clip.src)
      : absolute(`/`); /* Embeds carry their own canonical page; see embedUrl. */

  const embedUrl =
    slot.clip.kind === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${slot.clip.id}`
      : slot.clip.kind === "vimeo"
        ? `https://player.vimeo.com/video/${slot.clip.id}`
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${absolute("/")}#${slot.id}`,
    name: slot.title,
    description: slot.description,
    thumbnailUrl: [absolute(slot.poster.src)],
    ...(slot.clip.kind === "file" ? { contentUrl } : {}),
    ...(embedUrl ? { embedUrl } : {}),
    ...(slot.duration ? { duration: slot.duration } : {}),
  };
}

export function VideoSection({
  slot,
  tone = "surface",
  priority = false,
}: {
  slot: VideoSlot;
  tone?: keyof typeof TONE;
  /** Set only when the section is above the fold. */
  priority?: boolean;
}) {
  const configured = slot.clip !== null;
  const aspect = VIDEO_ASPECT[slot.aspect ?? "video"];
  const headingId = `${slot.id}-heading`;
  const jsonLd = videoJsonLd(slot);

  return (
    <section className={TONE[tone]} aria-labelledby={headingId}>
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          {/* Copy column */}
          <Reveal>
            <p className="eyebrow text-brand-700">{slot.eyebrow}</p>
            <h2
              id={headingId}
              className="headline mt-3 text-balance text-3xl text-ink-900 sm:text-4xl"
            >
              {slot.title}
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
              {slot.description}
            </p>
            {slot.duration ? (
              <p className="mt-3 text-sm text-ink-500">Running time: {slot.duration}</p>
            ) : null}

            {slot.cta || slot.secondaryCta ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {slot.cta ? (
                  <Button href={slot.cta.href} size="lg" className="btn-lift">
                    {slot.cta.label}
                  </Button>
                ) : null}
                {slot.secondaryCta ? (
                  <Button
                    href={slot.secondaryCta.href}
                    variant="secondary"
                    size="lg"
                    className="btn-lift"
                  >
                    {slot.secondaryCta.label}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Reveal>

          {/* Media column */}
          <Reveal delay={90}>
            {configured ? (
              <VideoPlayer
                title={slot.title}
                poster={slot.poster}
                clip={slot.clip}
                aspect={slot.aspect}
                captions={slot.captions}
                sizes="(min-width: 1024px) 54vw, 100vw"
                priority={priority}
              />
            ) : (
              /* No footage yet: the same frame, filled with the poster still and
                 no play affordance at all. */
              <div
                className={`relative isolate overflow-hidden rounded-3xl border border-border bg-brand-950 shadow-float ${aspect}`}
              >
                <Photo
                  source={slot.poster}
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  priority={priority}
                  overlay
                  scrim="medium"
                />
                {process.env.NODE_ENV !== "production" ? (
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-dashed border-white/45 bg-brand-950/75 p-4 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                      Video slot · {slot.id}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-100/85">
                      No clip configured — visitors see this still, not a play button. Set{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5">clip</code> and{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5">licence</code> in{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5">src/lib/media.ts</code>.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Attribution/illustration note — required whenever the footage is
                not our own, and the reason this text is part of the slot. */}
            {slot.footageNote ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-500">{slot.footageNote}</p>
            ) : null}

            {configured && !slot.captions?.length ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-500">
                This clip is illustrative and carries no information you need from it — everything
                explained on this page is in the text above.
              </p>
            ) : null}

            {/* Driven by the licence, not the delivery method: any clip that
                requires a credit gets one, file or embed alike. */}
            {configured && slot.licence.attributionRequired ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-500">
                Video: {slot.licence.source}. Used under {slot.licence.licence}.
                {slot.licence.url ? (
                  <>
                    {" "}
                    <a
                      href={slot.licence.url}
                      className="underline underline-offset-2"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Source
                    </a>
                    .
                  </>
                ) : null}
              </p>
            ) : null}
          </Reveal>
        </div>
      </Container>

      {jsonLd ? (
        <script
          type="application/ld+json"
          // Serialising our own object, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </section>
  );
}
