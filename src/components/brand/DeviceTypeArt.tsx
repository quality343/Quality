/**
 * Vector art for the six hearing-aid types we present publicly.
 *
 * Drawn from the clinic's own "Types of Hearing Aids" reference: the shape and
 * the placement of each type, not a photograph of one. That keeps this section
 * honest on two counts — it depicts no manufacturer's product, and it claims no
 * specification (no battery life, no gain, no fitting range). Everything a
 * visitor might read as a number stays in the copy, where we can vouch for it.
 *
 * Server-safe and dependency-free: inlined SVG, no runtime, no image payload, so
 * six of these cost less than one photograph and stay crisp on any display.
 * `uid` scopes the gradient ids — every instance on a page needs its own so
 * duplicate paint-server ids can't cross-wire.
 */

import type { ReactNode } from "react";

export type DeviceArtType = "IIC" | "RIC" | "CIC" | "RECHARGEABLE" | "ITC" | "BTE";

type Paint = {
  id: (name: string) => string;
  url: (name: string) => string;
};

/** Earmould / receiver dome seen at the entrance of the canal. */
function Dome({ url }: Paint) {
  return (
    <>
      <ellipse cx="100" cy="122" rx="24" ry="21" fill={url("dome")} />
      <ellipse
        cx="100"
        cy="122"
        rx="24"
        ry="21"
        fill="none"
        stroke="#86a8c9"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <g stroke="#5b7fa5" strokeWidth="0.9" opacity="0.35">
        <path d="M77 116h46M77 122h46M77 128h46" />
        <path d="M86 103v38M100 100v44M114 103v38" />
      </g>
      <ellipse cx="92" cy="114" rx="7" ry="4" fill="#ffffff" opacity="0.55" />
    </>
  );
}

/** The pearl shell used by every behind/around-the-ear style. */
function Shell({
  url,
  x,
  y,
  w,
  h,
  rotate,
}: Paint & { x: number; y: number; w: number; h: number; rotate: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={w / 2}
        fill={url("shell")}
        transform={`rotate(${rotate} ${cx} ${cy})`}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={w / 2}
        fill="none"
        stroke={url("rim")}
        strokeWidth="1.6"
        transform={`rotate(${rotate} ${cx} ${cy})`}
      />
      {/* Faceplate — the dark inlay that carries the controls on a real device. */}
      <rect
        x={x + w * 0.24}
        y={y + h * 0.2}
        width={w * 0.5}
        height={h * 0.52}
        rx={w * 0.24}
        fill={url("face")}
        transform={`rotate(${rotate} ${cx} ${cy})`}
      />
      {/* Microphone inlet and the seam where the shell meets the faceplate. */}
      <circle cx={cx + w * 0.02} cy={y + h * 0.13} r="2.4" fill="#93b2d2" opacity="0.75" />
      <path
        d={`M${x + w * 0.26} ${y + h * 0.28} C ${cx + w * 0.1} ${y + h * 0.24} ${cx + w * 0.22} ${y + h * 0.62} ${x + w * 0.3} ${y + h * 0.68}`}
        stroke="#ffffff"
        strokeWidth="1.2"
        opacity="0.35"
        fill="none"
      />
    </>
  );
}

/**
 * The ear canal as a tapering channel, narrowing from the opening (right) to
 * the eardrum end (left). Drawn once and reused by the three in-canal types,
 * which is what lets a visitor see *why* they are discreet: the device is
 * inside the channel, and how far in it sits is the difference between them.
 * It is deliberately schematic — a diagram, not anatomy.
 */
function CanalTube({ url }: Paint) {
  return (
    <>
      <path
        d="M200 44 C156 40 96 56 48 70 C32 78 32 104 48 110 C96 124 156 128 200 126 C208 106 208 64 200 44 Z"
        fill={url("canal")}
      />
      <path
        d="M200 44 C156 40 96 56 48 70 C32 78 32 104 48 110 C96 124 156 128 200 126 C208 106 208 64 200 44 Z"
        fill="none"
        stroke="#a8c2dc"
        strokeWidth="1.4"
        strokeDasharray="5 6"
      />
      {/* Depth cue: the opening catches the light, the far end falls away. */}
      <path
        d="M196 52 C176 54 160 62 152 74 C146 84 146 92 152 100 C160 112 176 118 196 120"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        opacity="0.5"
        strokeLinecap="round"
      />
      <ellipse cx="52" cy="90" rx="10" ry="16" fill="#b9cee2" opacity="0.35" />
    </>
  );
}

const SHAPES: Record<DeviceArtType, (p: Paint) => ReactNode> = {
  /** BTE — body behind the ear, joined by a tube to a custom earmould. */
  BTE: (p) => (
    <>
      <path
        d="M150 32 C120 18 92 26 84 52 C76 80 84 106 104 124"
        stroke={p.url("wire")}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M150 32 C120 18 92 26 84 52"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />
      <Dome {...p} />
      <Shell {...p} url={p.url} x={136} y={30} w={62} h={100} rotate={-6} />
    </>
  ),

  /** RIC — the receiver rides in the canal on a thin wire; body sits behind the ear. */
  RIC: (p) => (
    <>
      <path
        d="M168 92 C168 116 156 130 140 140"
        stroke={p.url("wire")}
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="134" cy="146" rx="15" ry="12" fill={p.url("dome")} />
      <ellipse
        cx="134"
        cy="146"
        rx="15"
        ry="12"
        fill="none"
        stroke="#86a8c9"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <g stroke="#5b7fa5" strokeWidth="0.9" opacity="0.35">
        <path d="M120 142h28M120 146h28M120 150h28" />
      </g>
      <rect
        x="138"
        y="26"
        width="56"
        height="92"
        rx="28"
        fill={p.url("shell")}
      />
      <rect
        x="138"
        y="26"
        width="56"
        height="92"
        rx="28"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.6"
      />
      <rect x="151" y="42" width="30" height="48" rx="15" fill={p.url("face")} />
      <circle cx="166" cy="34" r="2.4" fill="#93b2d2" opacity="0.75" />
    </>
  ),

  /** CIC — a complete custom shell that fills the canal, made to measure. */
  CIC: (p) => (
    <>
      <CanalTube {...p} />
      {/* Sits deeper than an ITC, closer to the opening than an IIC. */}
      <ellipse cx="104" cy="92" rx="22" ry="17" fill={p.url("shell")} />
      <ellipse
        cx="104"
        cy="92"
        rx="22"
        ry="17"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.5"
      />
      <rect x="94" y="84" width="21" height="15" rx="7" fill={p.url("face")} />
      <circle cx="118" cy="102" r="2.6" fill="#0b2340" opacity="0.45" />
      {/* Short pull cord, the way a CIC is removed. */}
      <path
        d="M124 98 C140 104 148 116 144 130"
        stroke={p.url("wire")}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="143" cy="131" r="2.4" fill="#8fadcb" />
    </>
  ),

  /** IIC — the smallest custom shell, sitting deepest, with a long cord. */
  IIC: (p) => (
    <>
      <CanalTube {...p} />
      <ellipse cx="86" cy="92" rx="16" ry="12.5" fill={p.url("shell")} />
      <ellipse
        cx="86"
        cy="92"
        rx="16"
        ry="12.5"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.4"
      />
      <rect x="79" y="87" width="15" height="11" rx="5" fill={p.url("face")} />
      <path
        d="M100 96 C126 102 142 114 146 130"
        stroke={p.url("wire")}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="145" cy="131" r="2.2" fill="#8fadcb" />
    </>
  ),

  /** ITC — a slightly larger custom shell, seated at the canal opening. */
  ITC: (p) => (
    <>
      <CanalTube {...p} />
      <path
        d="M146 62 C170 62 186 76 186 94 C186 112 170 124 146 124 C126 124 112 112 112 94 C112 76 126 62 146 62 Z"
        fill={p.url("shell")}
      />
      <path
        d="M146 62 C170 62 186 76 186 94 C186 112 170 124 146 124 C126 124 112 112 112 94 C112 76 126 62 146 62 Z"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.5"
      />
      {/* Faceplate: controls sit on the outward-facing plate. */}
      <rect x="140" y="72" width="34" height="26" rx="13" fill={p.url("face")} />
      <circle cx="150" cy="81" r="2.2" fill="#9fc0e0" opacity="0.75" />
      <circle cx="164" cy="90" r="3" fill="#0b2340" opacity="0.4" />
      {/* Vent and grip — the details you notice on a custom shell. */}
      <path d="M126 112 C132 114 135 118 134 122" stroke="#9ab7d5" strokeWidth="1.8" fill="none" />
      <circle cx="158" cy="60" r="2" fill="#9ab7d5" opacity="0.6" />
    </>
  ),

  /** Rechargeable — devices docked in an open charging case instead of batteries. */
  RECHARGEABLE: (p) => (
    <>
      {/* Open lid, standing behind the tray. */}
      <rect x="58" y="26" width="124" height="58" rx="26" fill={p.url("shell")} opacity="0.9" />
      <rect
        x="58"
        y="26"
        width="124"
        height="58"
        rx="26"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.4"
        opacity="0.8"
      />
      {/* Tray. */}
      <rect x="48" y="74" width="144" height="58" rx="27" fill={p.url("shell")} />
      <rect
        x="48"
        y="74"
        width="144"
        height="58"
        rx="27"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.6"
      />
      {/* Docking cavity. */}
      <rect x="64" y="66" width="112" height="34" rx="17" fill="#dbe7f4" />
      {/* Two devices, seated — the colour pairing echoes the clinic's own case. */}
      <rect x="80" y="40" width="34" height="62" rx="17" fill={p.url("shell")} />
      <rect x="80" y="40" width="34" height="62" rx="17" fill="none" stroke={p.url("rim")} strokeWidth="1.4" />
      <rect x="87" y="52" width="20" height="30" rx="10" fill="#1f5fa8" opacity="0.85" />
      <rect x="126" y="40" width="34" height="62" rx="17" fill={p.url("shell")} />
      <rect x="126" y="40" width="34" height="62" rx="17" fill="none" stroke={p.url("rim")} strokeWidth="1.4" />
      <rect x="133" y="52" width="20" height="30" rx="10" fill="#b3243a" opacity="0.8" />
      {/* Front lip closes the tray over the docking recess. */}
      <rect x="48" y="96" width="144" height="36" rx="26" fill={p.url("shell")} />
      <rect
        x="48"
        y="96"
        width="144"
        height="36"
        rx="26"
        fill="none"
        stroke={p.url("rim")}
        strokeWidth="1.4"
      />
      {/* Charging indicator. */}
      <circle cx="120" cy="114" r="11" fill="#eaf1f9" stroke="#c3d5e8" strokeWidth="1" />
      <path
        d="M122 106 l-7 10h5l-1 6 7-10h-5z"
        fill="#004898"
        stroke="#004898"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </>
  ),
};

export function DeviceTypeArt({
  type,
  className = "h-32 w-auto",
  uid = "type",
}: {
  type: DeviceArtType;
  className?: string;
  /** Unique per instance — scopes SVG paint-server ids. */
  uid?: string;
}) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const paint: Paint = { id, url };

  return (
    <svg
      viewBox="0 0 240 164"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id("shell")} x1="70" y1="26" x2="190" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.32" stopColor="#eef4fc" />
          <stop offset="0.64" stopColor="#cadcf0" />
          <stop offset="0.88" stopColor="#a3bedb" />
          <stop offset="1" stopColor="#86a3c4" />
        </linearGradient>
        <linearGradient id={id("rim")} x1="70" y1="26" x2="180" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#7ea6cc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("face")} x1="130" y1="34" x2="176" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1a4d80" />
          <stop offset="0.45" stopColor="#0d2e55" />
          <stop offset="1" stopColor="#04162c" />
        </linearGradient>
        <linearGradient id={id("wire")} x1="140" y1="20" x2="120" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e4eef8" />
          <stop offset="1" stopColor="#93aec9" />
        </linearGradient>
        <radialGradient id={id("dome")} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="0.75" stopColor="#cfe0f2" stopOpacity="0.88" />
          <stop offset="1" stopColor="#9fc0e0" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id={id("canal")} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#e7eff8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#cfe0f2" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00112e" stopOpacity="0.34" />
          <stop offset="0.6" stopColor="#00112e" stopOpacity="0.12" />
          <stop offset="1" stopColor="#00112e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="152" rx="72" ry="9" fill={url("shadow")} />
      {SHAPES[type](paint)}
    </svg>
  );
}
