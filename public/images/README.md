# Photography — sources, licence, and how to replace it

Two kinds of image live here:

1. **Clinic-supplied product renders** — `hearing-aid-gold.jpg` and
   `hearing-aid-pair.jpg`. These are the client's own artwork, supplied
   directly, and they are the only images here that are ours. They are product
   renders, not photographs of a clinic.
2. **Placeholder stock photography** — everything else, chosen to give the site
   a finished, human feel until the clinic supplies its own photos. They are
   real photographs of real people — not AI-generated faces — because synthetic
   healthcare imagery measurably reduces trust.

## Licence

Every file here comes from [Pexels](https://www.pexels.com/license/) and is
covered by the **Pexels License**:

- Free to use for commercial and non-commercial purposes.
- No attribution required (credits are still recorded below, as good practice).
- May be modified, cropped and resized.

**Brand check before go-live.** The stock photographs show no hearing-aid brand,
so none of them implies a manufacturer relationship or a product claim. The two
client product renders do not carry a legible brand either — but the clinic's
3D clip (`public/video/hearing-aid-3d.mp4`) shows a manufacturer's name on the
shell. Someone at the clinic must confirm that is a brand they fit before that
clip goes public on the homepage. See `public/video/README.md`.

## Files and credits

| File | Pexels source | Photographer credit |
| --- | --- | --- |
| `hero-couple.jpg` | [photo/8871545](https://www.pexels.com/photo/photo-of-elderly-couple-8871545/) | Andrea Piacquadio |
| `family-grandfather.jpg` | [photo/7925193](https://www.pexels.com/photo/an-elderly-man-and-a-girl-sitting-and-smiling-7925193/) | Yan Krukau |
| `home-visit-family.jpg` | [photo/3768131](https://www.pexels.com/photo/joyful-adult-daughter-greeting-happy-surprised-senior-mother-in-garden-3768131/) | Andrea Piacquadio |
| `lifestyle-listening.jpg` | [photo/3783449](https://www.pexels.com/photo/man-in-black-coat-listening-to-music-3783449/) | Andrea Piacquadio |
| `consultation-doctor.jpg` | [photo/39192408](https://www.pexels.com/photo/smiling-doctor-in-an-office-setting-39192408/) | Vitaly Gariev |
| `hearing-test-ear.jpg` | [photo/5206951](https://www.pexels.com/photo/a-patient-having-ear-examination-5206951/) | — |
| `care-support.jpg` | [photo/5206919](https://www.pexels.com/photo/a-close-up-shot-of-a-person-holding-another-person-s-hands-5206919/) | — |
| `hearing-aid-detail.jpg` | [photo/14682242](https://www.pexels.com/photo/grayscale-photo-of-a-man-with-a-hearing-aid-14682242/) | Brett Sayles |
| `home-care.jpg` | [photo/7551686](https://www.pexels.com/photo/a-man-and-a-woman-assisting-an-elderly-man-in-standing-7551686/) | Kampus Production |
| `listening-audio.jpg` | [photo/7983602](https://www.pexels.com/photo/an-elderly-man-watching-on-a-digital-tablet-7983602/) | Kampus Production |
| `booking-help.jpg` | [photo/3823542](https://www.pexels.com/photo/young-positive-lady-showing-photos-on-smartphone-to-senior-man-while-sitting-at-laptop-3823542/) | Andrea Piacquadio |
| `family-sofa.jpg` | [photo/7117615](https://www.pexels.com/photo/elderly-man-sitting-with-a-girl-7117615/) | cottonbro studio |

## Clinic-supplied images

| File | Source | Permission | Where it is used |
| --- | --- | --- | --- |
| `hearing-aid-gold.jpg` | Supplied by QUALITY Hearing Care (WhatsApp, 2026-09-22) | Owned by QUALITY Hearing Care | Poster/fallback still for the homepage device clip |
| `hearing-aid-pair.jpg` | Supplied by QUALITY Hearing Care (WhatsApp, 2026-09-22) | Owned by QUALITY Hearing Care | Hearing-aids page hero card |

Both are JPEGs at around 1250–1340px on the long edge, so they are fine at
the sizes used here but are **not suitable for print or large banners**. Ask the
clinic for the original render files if a bigger size is ever needed.

## Replacing these with the clinic's own photography

The whole site reads its photos from **one place** — `src/lib/images.ts`. No
component references a filename directly.

1. Drop the new file into this folder using the **same filename**, or
2. Change the `src` for that entry in `src/lib/images.ts`, and
3. Update its `alt` text there if the subject changes.

Recommended specs when commissioning photos: landscape **3:2**, at least
**1600px** on the long edge, natural daylight, real clinic environment, and
written consent from any patient who appears. Prefer a genuine photo of the
Kukatpally clinic and the clinic's own team over a stock replacement.
