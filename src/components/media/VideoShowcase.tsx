import { Container, Icon } from "@/components/ui";
import { CLINIC_VIDEO } from "@/lib/media";

/**
 * Homepage video section.
 *
 * Deliberately a server component: a native `<video>` with `controls` needs no
 * JavaScript at all, so this adds nothing to the client bundle and cannot slow
 * the page down. `preload="none"` means zero video bytes are fetched until the
 * visitor presses play — the poster image is the only cost.
 *
 * Behaviour when the clinic has not supplied footage yet:
 * - development → a clearly marked placeholder, so the slot is visible while
 *   working on the page;
 * - production  → the section renders nothing at all. A website shown to real
 *   patients must not carry placeholder furniture.
 *
 * Add the real clip in `src/lib/media.ts` — no component change needed.
 */
export function VideoShowcase() {
  const { src, poster, title, description, duration, captions } = CLINIC_VIDEO;

  const isProduction = process.env.NODE_ENV === "production";

  if (!src && isProduction) return null;

  return (
    <section className="bg-surface" aria-labelledby="video-heading">
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-brand-700">Inside the clinic</p>
          <h2 id="video-heading" className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">{description}</p>
          {duration ? <p className="mt-2 text-sm text-ink-500">Running time: {duration}</p> : null}
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          {src ? (
            <figure className="overflow-hidden rounded-3xl border border-border bg-brand-950 shadow-card">
              <video
                className="aspect-video h-full w-full object-cover"
                controls
                playsInline
                preload="none"
                poster={poster}
                aria-label={title}
              >
                {captions?.map((track) => (
                  <track
                    key={track.src}
                    kind="captions"
                    src={track.src}
                    srcLang={track.srcLang}
                    label={track.label}
                    default={track.default}
                  />
                ))}
                {/* Shown only by browsers that cannot play the file at all. */}
                <p className="p-6 text-sm text-white">
                  Your browser cannot play this video. You can still{" "}
                  <a href="/contact" className="font-semibold underline">
                    contact the clinic
                  </a>{" "}
                  and we&apos;ll answer any questions directly.
                </p>
              </video>

              {captions?.length ? null : (
                <figcaption className="border-t border-white/10 px-5 py-3 text-xs text-brand-100">
                  Captions are added when the clinic supplies the clip.
                </figcaption>
              )}
            </figure>
          ) : (
            /* Development-only placeholder. Dashed and explicitly labelled so it
               can never be mistaken for a real video, and it is stripped from
               production builds by the guard above. */
            <div className="rounded-3xl border-2 border-dashed border-border bg-surface-muted p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <Icon name="video" className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-ink-900">
                  Development placeholder — no clinic video supplied yet
                </p>
                <p className="max-w-md text-sm text-ink-600">
                  This section is the integration point for the QUALITY Hearing Care video. It is
                  hidden in production until footage is supplied, so no stock or fabricated clip is
                  ever shown to patients. Add the file path or hosting URL in{" "}
                  <code className="rounded bg-surface px-1.5 py-0.5 text-xs">src/lib/media.ts</code>.
                </p>
                <div className="mt-1 aspect-video w-full max-w-3xl rounded-2xl border border-border bg-surface">
                  <p className="grid h-full place-items-center text-xs text-ink-500">
                    The player appears here once a video source is configured.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
