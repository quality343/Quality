import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resolves the OFFICIAL Quality Hearing Care brand assets in `public/brand/`.
 *
 * SERVER-ONLY (node:fs) — never import from a client component; pass the
 * resolved paths down as props instead.
 *
 * - `logoSrc`     → full lockup (mark + wordmark), for headers on light surfaces
 * - `logoMarkSrc` → the diamond mark alone, for compact spots (mobile bars)
 */
export function getBrandAssets(): { logoSrc: string | null; logoMarkSrc: string | null } {
  const brandDir = path.join(process.cwd(), "public", "brand");
  const logoSrc = existsSync(path.join(brandDir, "logo.png"))
    ? "/brand/logo.png"
    : existsSync(path.join(brandDir, "logo.svg"))
      ? "/brand/logo.svg"
      : null;
  const logoMarkSrc = existsSync(path.join(brandDir, "logo-mark.png"))
    ? "/brand/logo-mark.png"
    : null;
  return { logoSrc, logoMarkSrc };
}
