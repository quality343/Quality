import { Container } from "@/components/ui";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { Reveal } from "@/components/motion/Reveal";
import { approvedTestimonials } from "@/lib/media";

/**
 * Patient testimonial videos.
 *
 * Renders **nothing** until the list in `src/lib/media.ts` holds at least one
 * entry whose `consent.patientApproved` is true. That filter is the whole point
 * of this component: a testimonial is a real person's medical experience, and
 * it may only be shown with their recorded permission.
 *
 * This is not a placeholder waiting to be filled with something plausible. There
 * is deliberately no invented patient, no invented quote, and no stock "happy
 * customer" standing in — a fabricated testimonial shown to someone worried
 * about their hearing is a lie that costs them trust they came here to find.
 */
export function TestimonialVideos() {
  const testimonials = approvedTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-surface" aria-labelledby="testimonials-heading">
      <Container className="py-16 sm:py-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-brand-700">In their words</p>
          <h2 id="testimonials-heading" className="headline mt-3 text-3xl text-ink-900 sm:text-4xl">
            What our patients say
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
              <figure className="flex h-full flex-col gap-5">
                <VideoPlayer
                  title={`Testimonial from ${t.patientName}`}
                  poster={t.poster}
                  clip={t.clip}
                  aspect="video"
                  sizes="(min-width: 768px) 46vw, 100vw"
                />
                <blockquote className="text-base leading-relaxed text-ink-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-auto text-sm text-ink-500">
                  {t.patientName} — shared with permission
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
