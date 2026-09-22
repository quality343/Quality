# Official brand assets — installed

The official **QUALITY Hearing Care / JOY OF HEARING** logo is installed as PNG:

| File | Contents | Source |
| --- | --- | --- |
| `logo.png` | Full lockup (mark + rule + wordmark + tagline), 1600×533, white background | Client-supplied file (2026-09-22), re-encoded |
| `logo-mark.png` | Diamond mark alone, 408×396 | Cropped from `logo.png` |
| `src/app/icon.png` | Favicon — a byte-copy of `logo-mark.png` | Same crop |

## Notes

- The canvas of `logo.png` is the client's file **unchanged** — only the container
  was re-encoded (JPEG → palette PNG, which drops it from 892 KB to 161 KB with a
  measured mean channel difference of 0.24, i.e. invisible). `logo-mark.png` and
  `src/app/icon.png` are the same bytes; **change them together** or the favicon
  will show the old mark.
- The supplied file is a **lossy WhatsApp JPEG at 1600 px wide**, not the original
  artwork. If the client can provide the vector (SVG/AI) or a transparent-background
  master, replace these files and delete the white-chip handling below.
- `logo.png` has a baked-in white background (no alpha). On dark surfaces (e.g. the
  footer) it mounts inside a white chip automatically — see
  `src/components/brand/BrandLogo.tsx` (`inverted` prop). Do not recolor or
  approximate the logo with icons.
- Colors sampled from the current file: blue `#013194`, red `#c40227`, tagline grey
  `#8c8c8c`. The site tokens in `src/app/globals.css` remain the previously sampled
  `#004898` / `#d01028` — the two are close enough to read as one family, and the
  tokens were deliberately left alone so the logo swap does not restyle the whole
  site. Change colors only in `globals.css`, never in components.
