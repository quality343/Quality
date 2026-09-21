import Link from "next/link";

type BrandLogoProps = {
  /** Full lockup path (server-resolved via getBrandAssets().logoSrc). */
  logoSrc?: string | null;
  /** Mark-only path (server-resolved via getBrandAssets().logoMarkSrc). */
  logoMarkSrc?: string | null;
  /** Visual variant: `full` = lockup, `mark` = mark alone. */
  variant?: "full" | "mark";
  /** Render inside a link to home (headers/sidebars) or standalone (footer). */
  withHomeLink?: boolean;
  /**
   * Light version for dark surfaces. The official PNG has a baked-in white
   * background, so on dark surfaces it mounts inside a white chip.
   */
  inverted?: boolean;
  className?: string;
};

const WORDMARK = "QUALITY";
const TAGLINE = "JOY OF HEARING";

function Wordmark({ inverted }: { inverted?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`text-lg font-bold tracking-tight ${
          inverted ? "text-white" : "text-ink-900"
        }`}
      >
        {WORDMARK}
      </span>
      <span
        className={`mt-1 text-[10px] font-semibold tracking-[0.22em] ${
          inverted ? "text-brand-200" : "text-accent-600"
        }`}
      >
        {TAGLINE}
      </span>
    </span>
  );
}

function Mark({ logoSrc, logoMarkSrc, inverted }: Pick<BrandLogoProps, "logoSrc" | "logoMarkSrc" | "inverted">) {
  if (logoMarkSrc) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${
          inverted ? "bg-white p-1.5" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- official brand asset, fixed-size slot */}
        <img
          src={logoMarkSrc}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
        />
      </span>
    );
  }
  if (logoSrc) {
    return (
      <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${inverted ? "bg-white p-1" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- official brand asset */}
        <img src={logoSrc} alt="" aria-hidden="true" className="h-9 w-auto" />
      </span>
    );
  }
  // Provisional fallback (official assets not found on disk)
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white"
    >
      Q
    </span>
  );
}

function Inner({ logoSrc, logoMarkSrc, variant, inverted }: Omit<BrandLogoProps, "className" | "withHomeLink">) {
  if (variant === "mark") {
    return <Mark logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} inverted={inverted} />;
  }
  if (logoSrc) {
    return (
      <span className={`inline-flex items-center overflow-hidden rounded-xl ${inverted ? "bg-white" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- official brand asset, fixed-size slot */}
        <img
          src={logoSrc}
          alt="QUALITY Hearing Care — JOY OF HEARING"
          className="h-10 w-auto"
        />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-3">
      <Mark logoSrc={null} logoMarkSrc={logoMarkSrc} inverted={inverted} />
      <Wordmark inverted={inverted} />
    </span>
  );
}

export function BrandLogo({
  logoSrc = null,
  logoMarkSrc = null,
  variant = "full",
  withHomeLink = false,
  inverted = false,
  className,
}: BrandLogoProps) {
  if (!withHomeLink) {
    return (
      <span className={className}>
        <Inner logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} variant={variant} inverted={inverted} />
      </span>
    );
  }
  return (
    <Link href="/" aria-label="QUALITY Hearing Care — home" className={className}>
      <Inner logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} variant={variant} inverted={inverted} />
    </Link>
  );
}
