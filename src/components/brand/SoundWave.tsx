/**
 * Decorative hearing visual language — pure SVG/CSS, no external assets.
 *
 * Every component here is `aria-hidden`: they express "hearing" as a brand
 * motif and never carry information a screen-reader user would need.
 */

/** Expanding concentric listening rings. */
export function ListenRings({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const stroke = tone === "light" ? "rgba(255,255,255,0.5)" : "rgba(0,72,152,0.35)";
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            borderColor: stroke,
            opacity: 0,
            animation: `pulse-ring 5s ease-out ${i * 1.6}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Rounded frequency bars — reads as "sound" without claiming a measurement. */
export function SoundBars({
  className = "",
  bars = 21,
  animated = true,
  from = "var(--color-brand-300)",
  to = "var(--color-accent-500)",
}: {
  className?: string;
  bars?: number;
  animated?: boolean;
  from?: string;
  to?: string;
}) {
  const heights = [34, 52, 40, 68, 46, 78, 58, 92, 66, 100, 74, 88, 60, 96, 68, 84, 54, 72, 44, 62, 38];
  return (
    <div
      className={`flex max-w-full items-end gap-[3px] ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {heights.slice(0, bars).map((h, i) => (
        <span
          key={i}
          className="w-1.5 origin-bottom rounded-full"
          style={{
            height: `${h}%`,
            backgroundImage: `linear-gradient(to top, ${from}, ${to})`,
            opacity: 0.9 - Math.abs(i - bars / 2) * 0.02,
            animation: animated ? `bar 2.6s ease-in-out ${(i % 7) * 0.18}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// Frequencies taught on every audiogram — shown as labels, never as results.
const FREQS = ["250", "500", "1k", "2k", "4k", "8k"];

/**
 * Audiogram-shaped explainer graphic.
 *
 * It illustrates *what an audiogram is* — axes, frequency labels, a plotted
 * line. It is explicitly decorative: no data is plotted and no result is
 * implied, so it can never be mistaken for a diagnosis.
 */
export function AudiogramExplainer({ className = "" }: { className?: string }) {
  return (
    <figure className={`relative min-w-0 max-w-full ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 560 260"
        className="h-full w-full max-w-full"
        fill="none"
        role="presentation"
      >
        <defs>
          <linearGradient id="ag-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--color-brand-400)" />
            <stop offset="0.55" stopColor="var(--color-brand-600)" />
            <stop offset="1" stopColor="var(--color-accent-500)" />
          </linearGradient>
          <linearGradient id="ag-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-brand-500)" stopOpacity="0.24" />
            <stop offset="1" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* dB grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`h${i}`}
            x1="56"
            x2="536"
            y1={40 + i * 44}
            y2={40 + i * 44}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}
        {/* frequency grid */}
        {FREQS.map((_, i) => (
          <line
            key={`v${i}`}
            x1={56 + i * 96}
            x2={56 + i * 96}
            y1="24"
            y2="216"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}

        {/* illustrative curve — decorative shape only */}
        <path
          d="M56 74 C 152 86, 200 150, 296 168 S 440 150, 536 116 L536 216 L56 216 Z"
          fill="url(#ag-fill)"
        />
        <path
          d="M56 74 C 152 86, 200 150, 296 168 S 440 150, 536 116"
          stroke="url(#ag-line)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="620"
          strokeDashoffset="0"
          style={{ animation: "dash 5s ease-in-out infinite" }}
        />

        {/* plotted points */}
        {[
          [56, 74],
          [152, 100],
          [248, 158],
          [344, 166],
          [440, 148],
          [536, 116],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            fill="var(--color-surface)"
            stroke="var(--color-brand-600)"
            strokeWidth="3"
            style={{ animation: `fade-up 0.7s ease-out ${0.3 + i * 0.12}s both` }}
          />
        ))}

        {/* axis labels */}
        {FREQS.map((f, i) => (
          <text
            key={f}
            x={56 + i * 96}
            y="240"
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="var(--color-ink-400)"
          >
            {f}
          </text>
        ))}
        {["0", "20", "40", "60", "80"].map((d, i) => (
          <text
            key={d}
            x="44"
            y={44 + i * 44}
            textAnchor="end"
            fontSize="13"
            fontWeight="600"
            fill="var(--color-ink-400)"
          >
            {d}
          </text>
        ))}
      </svg>
    </figure>
  );
}
