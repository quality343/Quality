# Design System — QUALITY Hearing Care

## 1. Brand

- **Brand:** QUALITY Hearing Care
- **Tagline:** JOY OF HEARING
- **Logo:** the supplied official logo is the only logo — installed at
  `public/brand/logo.png` (full lockup) and `public/brand/logo-mark.png` (mark only), and
  resolved automatically everywhere through `src/lib/logo.ts` → `BrandLogo`. The file has a
  baked-in white background, so `BrandLogo inverted` mounts it in a white chip on dark
  surfaces. **Never** substitute a generic hearing/medical icon as the logo, and never
  re-draw or re-colour it. See `public/brand/README.md`.

## 2. Color tokens (single source: `src/app/globals.css` `@theme`)

> Sampled directly from the official logo file. Change colours **only** in `globals.css` —
> every component consumes tokens and never hardcodes a hex value.

| Token family | Values | Usage |
| --- | --- | --- |
| `--color-brand-50…950` | Blue scale sampled from the logo (base `700 #004898`, deep `800/900`, deepest `950 #001a40`) | Primary actions, links, active states, brand surfaces |
| `--color-accent-50…800` | Red scale sampled from the logo (base `600 #d01028`) | Accent only: highlights, small emphasis, urgent badges — never large surfaces |
| `--color-ink-400…900` | Dark blue-grays (`#7d8ca0` → `#10233f`) | Body text, headings (`ink-900`), secondary text (`ink-500`) |
| `--color-surface` / `--color-surface-muted` | `#ffffff` / `#f6f8fb` | Page background / soft panels |
| `--color-border` | `#e3e9f1` | Soft neutral borders |

Style rules: white/light neutral backgrounds, dark readable text, flat fills over gradients,
accent red used sparingly for warmth and emphasis.

## 3. Typography, radius, shadow tokens

| Token | Value | Notes |
| --- | --- | --- |
| `--font-sans` | Inter (via `next/font`) → system-ui fallback | Body copy, forms, UI controls |
| `--font-display` | Plus Jakarta Sans (via `next/font`) → Inter fallback | Headings only, via the `.headline` utility |
| Scale | Tailwind defaults (`text-sm` body, `text-3xl/4xl` page titles, up to `4.1rem` hero) | `.headline` supplies `-0.028em` tracking and `1.06` leading |
| `--radius-sm…2xl` | `0.375rem → 1.25rem` | Cards `xl`, buttons/inputs `lg`, badges `full` |
| `--shadow-card` | Subtle two-layer diffuse | Resting cards |
| `--shadow-lift` | Slightly stronger | Hover/hero emphasis only |

## 4. Component primitives (`src/components/ui`)

| Component | Contract |
| --- | --- |
| `Container` | Max-width 6xl + responsive gutters — used on every page |
| `Button` | Variants `primary` (brand blue) / `secondary` (outline) / `ghost` / `accent` (red, sparingly); sizes `sm/md/lg`; renders `<Link>` when `href` is passed |
| `Card` | White surface, soft border ring, `shadow-card` |
| `Badge` | Tones `brand` / `neutral` / `accent` |
| `PageHeader` | Eyebrow badge + title + description + actions slot (utility/portal pages) |
| `PageHero` | Dark premium hero band for public pages: eyebrow, display headline, description, CTAs and an optional aside column |
| `PlaceholderNotice` | Dashed panel marking planned modules — the standard "roadmap, not fake data" treatment |
| `Icon` | Inline stroke SVG set (no icon-font dependency) |
| `BrandLogo` | Official-logo slot with automatic fallback monogram |

## 4b. Premium visual language

| Piece | Where | Notes |
| --- | --- | --- |
| `.bg-hero` | `globals.css` | Deep brand backdrop: layered radial light over a `brand-900 → #001130` base. Used by the homepage hero, every public page hero and the closing CTA bands. |
| `.headline` | `globals.css` | Display-face, negative tracking, `1.06` leading. Every large heading uses it so hierarchy stays identical site-wide. |
| `.eyebrow` / `.text-gradient-light` | `globals.css` | Small uppercase kickers and the light gradient used on one emphasised phrase per headline. |
| `.card-lift` / `.btn-lift` / `.product-zoom` | `globals.css` | Micro-interactions: card elevation, button elevation, product-image scale on hover. |
| `.bg-tint-gradient` / `.dot-grid` / `.grid-faint` | `globals.css` | Section tint, dark-band texture, faint light gridding. |
| `HearingAidDevice` | `src/components/brand/` | The product render. Layered vector passes (pearl shell, rim light, brushed faceplate, receiver wire, ear dome). **Server-safe, ~6 KB, no 3D runtime.** Pass a unique `uid` per instance so SVG paint-server ids never collide. |
| `HearingAidHero` | `src/components/brand/` | Client wrapper adding float + pointer parallax to `HearingAidDevice`. |
| `AudiogramExplainer` / `SoundBars` / `ListenRings` | `src/components/brand/SoundWave.tsx` | The hearing visual language. All `aria-hidden` and decorative; the audiogram is explicitly labelled as an illustration, never a result. |
| `Reveal` | `src/components/motion/` | ~1 KB IntersectionObserver scroll reveal. Adds `min-w-0` (grid children default to `min-width:auto`, which lets intrinsic-width media force horizontal scroll). |

### Motion policy

1. No animation library — CSS keyframes plus one tiny observer keep the public bundle small.
2. Everything decorative is `aria-hidden`; motion never carries information.
3. `prefers-reduced-motion` disables all of it, including the scroll reveal (content stays visible).
4. Pointer parallax runs only on `hover: hover` / `pointer: fine` devices, writes CSS variables
   (never React state) so it costs no re-renders, and throttles through `requestAnimationFrame`.
5. Content is readable without JavaScript: `.reveal-init` is neutralised under reduced motion
   and by a `<noscript>` override in the root layout.

### Imagery policy

No stock photography and no third-party product images ship. Product art is original vector work;
where a verified clinic photo or a licensed product image is supplied later, it replaces the
vector art in the same slots. Nothing is ever invented to fill a visual gap — if the client has not
supplied a fact, the surface says so or the element is simply not rendered.

## 5. Layout & responsiveness

- Breakpoints: mobile-first; **desktop ≥1280, laptop ≥1024, tablet ≥640, mobile <640**.
- Header: full nav at ≥1280 (`xl`); between 1024–1279 the logo, Book CTA and menu button show;
  below 1024 the logo and menu button. The drawer carries every link plus both booking CTAs
  and the phone number, so nothing becomes unreachable at any width.
- Portals: persistent sidebar ≥ lg, slide-in drawer below with the same items.
- Grids: `1 → 2 → 3` columns (services), `1 → 2` (portal cards). No fixed pixel widths,
  no horizontal scroll, touch targets ≥ 40px.

## 6. Accessibility & tone

- Semantic landmarks (`header/nav/main/footer`), one `h1` per page, logical heading order.
- Visible focus rings (`:focus-visible`, brand blue) — never removed.
- Contrast: body text `ink-900/ink-500` on white passes WCAG AA; white on `brand-700` passes AA.
- `prefers-reduced-motion` respected globally; no autoplaying carousels or flashy animation.
- Tone: professional, warm, plain language. No stock-jargon, no cartoon medical illustrations,
  no fear-based marketing copy.
