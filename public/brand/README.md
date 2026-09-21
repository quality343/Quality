# Official brand assets — installed

The official **QUALITY Hearing Care / JOY OF HEARING** logo is now installed:

| File | Contents | Source |
| --- | --- | --- |
| `logo.png` | Full lockup (mark + wordmark + tagline), 2172×724, white background | Supplied official file (unmodified) |
| `logo-mark.png` | Diamond mark alone, 522×518 (cropped from the official file) | Derived crop of the official file |

## Notes

- `logo.png` has a baked-in white background (no transparency). On dark surfaces
  (e.g. the footer) it mounts inside a white chip automatically — see
  `src/components/brand/BrandLogo.tsx` (`inverted` prop). Do not recolor or
  approximate the logo with icons.
- Brand colors were **sampled from this file** and live as tokens in
  `src/app/globals.css`: brand blue base `#004898` (deep `#003078`), accent red
  `#d01028`. Change colors only there, never in components.
- If a transparent-background or vector version of the official logo is provided
  later, replace `logo.png` (same filename) and delete the white-chip handling.
