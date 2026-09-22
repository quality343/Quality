# Video — sources, licence, and how to replace this footage

One clip here is the **clinic's own**: `hearing-aid-3d.mp4`, supplied directly
by QUALITY Hearing Care and used on the homepage hearing-aid showcase. It carries
no illustration note because it is genuinely ours.

Every other clip is **stock under the Pexels License**, the same licence as the
photographs in `public/images/`. They are placeholders standing in until the
clinic supplies the rest of its own footage, and every one of them is labelled
as illustrative on the page it appears on.

The single source of truth for what the site plays is **`src/lib/media.ts`**. No
component references a video URL directly.

## Licence

Every file here comes from [Pexels](https://www.pexels.com/license/) and is
covered by the **Pexels License**:

- Free to use for commercial and non-commercial purposes.
- **No attribution required** (credits are still recorded below, as good practice).
- May be modified, cropped, re-encoded and resized.

## Files, sources and licence record

| Slot (`src/lib/media.ts`) | File | Source | Photographer | Licence | Attribution | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `deviceShowcase` | `hearing-aid-3d.mp4` | **Supplied by QUALITY Hearing Care** (WhatsApp, 2026-09-21) | — | **Owned by QUALITY Hearing Care** | not required | 1280×720, H.264 + AAC, ~10 s loop, 2.8 MB |
| `heroBackground` | `hero-couple-talking.mp4` | [video/8971243](https://www.pexels.com/video/an-elderly-couple-talking-to-each-other-8971243/) | not stated on source page | Pexels License | not required | 540p (~1.6 MB) |
| `hearingCareMatters` | `couple-holding-hands.mp4` | [video/8164677](https://www.pexels.com/video/elderly-couple-holding-hands-on-the-table-8164677/) | not stated on source page | Pexels License | not required | 720p (~2.8 MB) |
| `hearingTest` | `consultation.mp4` | [video/8375654](https://www.pexels.com/video/a-senior-doctor-having-an-online-consultation-8375654/) | Tima Miroshnichenko | Pexels License | not required | 506p (~2.3 MB) |
| `hearingAids` | `ear-close-up.mp4` | [video/6620878](https://www.pexels.com/video/close-up-video-of-a-person-ear-6620878/) | not stated on source page | Pexels License | not required | 720p (~2.3 MB) |
| `homeConsultation` | `home-checkup.mp4` | [video/8944262](https://www.pexels.com/video/elderly-woman-having-a-check-up-8944262/) | Kampus Production | Pexels License | not required | 720p (~3.7 MB) |
| `finalCta` | `couple-in-park.mp4` | [video/8970846](https://www.pexels.com/video/an-elderly-couple-having-conversation-at-the-park-8970846/) | SHVETS production | Pexels License | not required | 540p (~3.5 MB) |

**The six Pexels clips have not been viewed by the developer who wired them in.**
They were selected from Pexels' own titles and search metadata. Someone at the
clinic must watch all six before go-live and confirm each is appropriate and
matches what the copy claims about it. See "Review checklist" below.

**`hearing-aid-3d.mp4` is different, and needs one decision.** It is the clinic's
own render and its first frames show a manufacturer's name on the device shell
(legible as "…AK" when zoomed). Nobody outside the clinic can confirm whether
that is a brand they fit. Confirm it before this stays on the homepage: if the
clinic does not fit that brand, the clip must be replaced, or re-exported with
the marking cropped or covered. The homepage caption deliberately makes no claim
about a specific model, but a visible competitor name on the page is a different
problem from a caption.

## Review checklist before go-live

1. Watch each clip end to end.
2. Confirm it does not imply the people shown are QUALITY Hearing Care patients
   (the visible `footageNote` on each section says they are not).
3. Confirm no clip shows a competing clinic name, logo or hearing-aid brand.
4. Confirm the clip does not contradict the section copy — the `hearingAids` note
   promises no product is shown.
5. Replace with clinic footage where possible; keep the file names or update the
   `clip.src` values in `src/lib/media.ts`.

## Replacing a clip with the clinic's own footage

1. Drop the file in this folder (export H.264 MP4, 1080p, ~8–20 Mbps, ideally under
   ~8 MB), or use a hosting/CDN URL, or a YouTube/Vimeo id — all three are supported.
2. Point the slot's `clip` at it in `src/lib/media.ts`.
3. Set that slot's `licence` to the clinic's own material, e.g.
   `{ source: "Client-supplied", licence: "Owned by QUALITY Hearing Care", attributionRequired: false }`.
4. If anyone speaks on camera, add a WebVTT file here and list it in `captions` —
   captions are an accessibility requirement, not a nicety.
5. Update the table above and remove the `footageNote` once the footage is genuine.

## Sources considered and rejected

Recorded so nobody re-adds these by mistake:

- **Mixkit** — reachable, but their library is now almost entirely under the
  **Mixkit Restricted License, which permits personal projects only**. Of 120
  relevant candidates checked via the per-clip `copyrightNotice` field, only 2
  were under their commercial "Free" licence. Downloaded clips were deleted
  rather than shipped. Do not use Mixkit clips here without checking
  `copyrightNotice` on the individual clip page.
- **Pixabay and Videvo** — both refuse requests from this environment (HTTP 403).
- **hear.com, Andhra Hearing Care, Amplifon and other clinics** — never. Publicly
  viewable is not licensed.

## Fetching from Pexels (for future clips)

Pexels' pages and CDN reject requests that do not look like a browser. A working
recipe:

```bash
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36" \
  -H "Referer: https://www.pexels.com/" -H "Accept: */*" \
  "https://www.pexels.com/download/video/<ID>/" -o probe.mp4
```

The redirect target reveals the CDN filename, which encodes dimensions and fps,
e.g. `https://videos.pexels.com/video-files/8971243/8971243-hd_1280_720_25fps.mp4`.
The endpoint itself serves the **UHD master** (tens of MB) — always step down to
the `hd_1280_*` or `sd_960_*` variant instead of shipping the master.

## What we will not do

- **No footage copied from another clinic or manufacturer.**
- **No clip carrying another company's branding.**
- **No fabricated testimonials.** `TESTIMONIAL_VIDEOS` in `src/lib/media.ts` stays
  empty until the clinic supplies a recording *and* the patient has approved its
  use. There are no invented names, quotes or patient stories.
- **No claims attached to footage.** A clip may show an ear; it may not imply
  hearing aids suit everyone, that a patient was "cured", or that anyone will
  "hear perfectly".

## Performance

The player is a facade: the poster image is the only cost until a visitor presses
play, so a page with several video sections still loads like a page of images.
`heroBackground` is the sole autoplaying clip — muted, looping, attached after
mount, skipped under `prefers-reduced-motion`, and deliberately 540p because it
is the one file a visitor cannot avoid downloading.
