/**
 * Premium hearing-aid render — a modern behind-the-ear / receiver-in-canal
 * device, drawn as layered vector passes (pearl shell, rim light, brushed
 * metal faceplate, receiver wire, ear dome).
 *
 * Server-safe and dependency-free: ~6 KB of inlined SVG with no 3D runtime,
 * so it renders crisply on every device and costs no JavaScript. `uid` scopes
 * the gradient/filter ids — every instance on a page needs its own so
 * duplicate ids can't cross-wire the paint servers.
 *
 * It illustrates a device in general; it is not a depiction of a specific
 * manufacturer's product and carries no specification claims.
 */

/** Shell silhouette, shared with the interactive 3D viewer so both draw the
 *  same device rather than two lookalikes. */
export const SHELL_PATH =
  "M278 86 C346 86 394 132 394 198 C394 250 372 296 340 332 C320 354 300 368 278 368 " +
  "C246 368 216 346 200 314 C186 286 178 250 178 214 C178 138 220 86 278 86 Z";

export function HearingAidDevice({
  className = "h-40 w-auto",
  uid = "dev",
  animated = true,
}: {
  className?: string;
  /** Unique per instance — scopes SVG paint-server ids. */
  uid?: string;
  /** Slow specular sweep across the shell. Off for dense grids. */
  animated?: boolean;
}) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg viewBox="0 0 520 560" className={className} fill="none" aria-hidden="true">
      <defs>
        {/* Pearl shell — cool white through to a soft steel blue. */}
        <linearGradient id={id("shell")} x1="190" y1="88" x2="390" y2="370" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fdfeff" />
          <stop offset="0.3" stopColor="#eaf2fb" />
          <stop offset="0.62" stopColor="#c2d6ec" />
          <stop offset="0.86" stopColor="#9ab7d5" />
          <stop offset="1" stopColor="#7796b9" />
        </linearGradient>
        {/* Rim light: bright top-left edge fading to nothing. */}
        <linearGradient id={id("rim")} x1="190" y1="88" x2="386" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#7ea6cc" stopOpacity="0" />
        </linearGradient>
        {/* Dark metallic faceplate with a blue sheen. */}
        <linearGradient id={id("face")} x1="236" y1="122" x2="352" y2="288" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1a4d80" />
          <stop offset="0.42" stopColor="#0d2e55" />
          <stop offset="1" stopColor="#03142a" />
        </linearGradient>
        <linearGradient id={id("faceSheen")} x1="240" y1="130" x2="300" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("wire")} x1="228" y1="358" x2="262" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dfeaf6" />
          <stop offset="1" stopColor="#93aecb" />
        </linearGradient>
        <radialGradient id={id("dome")} cx="0.34" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="0.75" stopColor="#cfe0f2" stopOpacity="0.85" />
          <stop offset="1" stopColor="#9fc0e0" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00112e" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#00112e" stopOpacity="0.18" />
          <stop offset="1" stopColor="#00112e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("led")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff8090" />
          <stop offset="0.5" stopColor="#d01028" />
          <stop offset="1" stopColor="#d01028" stopOpacity="0" />
        </radialGradient>
        <filter id={id("soft")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={id("blurSm")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>

        <clipPath id={id("clip")}>
          <path d={SHELL_PATH} />
        </clipPath>
        <clipPath id={id("faceClip")}>
          <rect x="230" y="118" width="134" height="150" rx="56" transform="rotate(-7 297 193)" />
        </clipPath>
      </defs>

      {/* contact shadow on the "floor" */}
      <ellipse cx="262" cy="522" rx="150" ry="28" fill={url("shadow")} />

      {/* cool bounce light under the device */}
      <ellipse cx="250" cy="532" rx="110" ry="20" fill="#4d8bcb" opacity="0.2" filter={url("soft")} />

      {/* sound arcs leaving the dome */}
      <g stroke="#84aede" strokeLinecap="round" fill="none">
        {[
          { d: "M320 474c13 10 13 32 0 42", o: 0.7, w: 3.6 },
          { d: "M338 462c21 17 21 52 0 69", o: 0.45, w: 3 },
          { d: "M358 450c29 25 29 72 0 97", o: 0.26, w: 2.4 },
        ].map((arc, i) => (
          <path
            key={i}
            d={arc.d}
            strokeWidth={arc.w}
            opacity={arc.o}
            style={animated ? { animation: `sheen 4.2s ease-in-out ${i * 0.5}s infinite` } : undefined}
          />
        ))}
      </g>

      {/* Receiver tube (behind the shell, in front of the dome). Kept short and
          thick: a long thin run reads as a balloon string, not a device. */}
      <path
        d="M244 344 C 230 384 226 418 242 446"
        stroke={url("wire")}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M244 344 C 230 384 226 418 242 446"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />

      {/* ear dome */}
      <ellipse cx="248" cy="466" rx="28" ry="24" fill={url("dome")} />
      <ellipse cx="248" cy="466" rx="28" ry="24" stroke="#86a8c9" strokeWidth="1.3" opacity="0.75" />
      <g stroke="#5b7fa5" strokeWidth="1" opacity="0.4">
        <path d="M221 459h55M221 466h55M221 473h55" />
        <path d="M231 444v45M245 441v51M259 444v45" />
      </g>
      <ellipse cx="238" cy="456" rx="8" ry="5" fill="#ffffff" opacity="0.6" filter={url("blurSm")} />

      {/* shell */}
      <path d={SHELL_PATH} fill={url("shell")} />
      <path d={SHELL_PATH} fill="none" stroke={url("rim")} strokeWidth="2" />

      <g clipPath={url("clip")}>
        <ellipse
          cx="226"
          cy="180"
          rx="46"
          ry="98"
          fill="#ffffff"
          opacity="0.45"
          filter={url("soft")}
          style={animated ? { animation: "sheen 7s ease-in-out infinite" } : undefined}
        />
        {/* tight highlight following the upper-left contour */}
        <path
          d="M196 244c-8-56 18-114 70-140"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.7"
          fill="none"
          filter={url("blurSm")}
        />
        {/* seam where the faceplate meets the shell */}
        <path
          d="M232 120 C 300 118 360 150 372 214"
          stroke="#8fadcb"
          strokeWidth="1.4"
          opacity="0.5"
          fill="none"
        />
        {/* environment bounce light */}
        <ellipse cx="340" cy="330" rx="80" ry="36" fill="#4d8bcb" opacity="0.3" filter={url("soft")} />
      </g>

      {/* faceplate */}
      <rect
        x="230"
        y="118"
        width="134"
        height="150"
        rx="56"
        transform="rotate(-7 297 193)"
        fill={url("face")}
      />
      <g clipPath={url("faceClip")}>
        <rect x="230" y="118" width="134" height="150" fill={url("faceSheen")} />
        {/* brushed metal micro-texture */}
        <g stroke="#7ea6cc" strokeWidth="0.7" opacity="0.16">
          <path d="M236 132h124M234 152h128M236 172h124M238 192h120M240 212h116M242 232h112M244 252h108" />
        </g>
        <ellipse cx="258" cy="168" rx="30" ry="52" fill="#ffffff" opacity="0.16" filter={url("soft")} />
      </g>
      <rect
        x="230"
        y="118"
        width="134"
        height="150"
        rx="56"
        transform="rotate(-7 297 193)"
        fill="none"
        stroke="#4d8bcb"
        strokeOpacity="0.4"
        strokeWidth="1.3"
      />

      {/* microphone array — a tight grille on the shell above the faceplate */}
      <g fill="#061a30" opacity="0.82">
        {[268, 279, 290].map((cx) => (
          <circle key={`m1-${cx}`} cx={cx} cy={105} r="2.7" />
        ))}
        {[273, 284].map((cx) => (
          <circle key={`m2-${cx}`} cx={cx} cy={113} r="2.2" />
        ))}
      </g>

      {/* vertical volume rocker on the right of the faceplate */}
      <rect x="329" y="166" width="10" height="58" rx="5" fill="#0a2444" />
      <rect x="331" y="169" width="6" height="52" rx="3" fill="#1e4f83" opacity="0.9" />
      <g stroke="#6f9cc7" strokeWidth="1" opacity="0.45">
        <path d="M331 186h6M331 196h6M331 206h6" />
      </g>

      {/* round multi-function button */}
      <circle cx="268" cy="229" r="14" fill="#0a2444" />
      <circle cx="268" cy="229" r="11" fill="#1e4f83" />
      <circle cx="268" cy="229" r="7.5" fill="#265c93" opacity="0.7" />
      <circle cx="264" cy="224" r="3.4" fill="#8fb6dc" opacity="0.4" />

      {/* program selector — three slim buttons */}
      <g>
        {[212, 226, 240].map((cy) => (
          <rect key={cy} x="300" y={cy} width="16" height="7" rx="3.5" fill="#0a2444" />
        ))}
        <g fill="#1e4f83">
          {[213.2, 227.2, 241.2].map((cy) => (
            <rect key={cy} x="301.5" y={cy} width="13" height="5" rx="2.5" />
          ))}
        </g>
      </g>

      {/* status LED inside the faceplate, with a soft bloom */}
      <circle cx="318" cy="140" r="10" fill={url("led")} opacity="0.45" />
      <circle cx="318" cy="140" r="3.2" fill="#e65466" />
      <circle cx="318" cy="140" r="1.2" fill="#ffe1e4" />

      {/* red accent hairline along the faceplate's lower-left edge */}
      <path
        d="M240 250 C 246 262 254 270 264 275"
        stroke="#d01028"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.75"
        fill="none"
      />
    </svg>
  );
}
