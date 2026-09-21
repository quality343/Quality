"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SHELL_PATH } from "./HearingAidDevice";

/**
 * Interactive 3D product viewer.
 *
 * The device is built as four real depth planes inside a `preserve-3d` stage —
 * body, faceplate, receiver wire and a ground-plane glow — then rotated by
 * dragging (pointer), by arrow keys (keyboard), or gently on its own when left
 * alone. Because the layers sit at different `translateZ`, rotating the stage
 * produces genuine parallax between the shell, its faceplate and the wire
 * trailing into the ear: the visual reads as a solid object, not a flat card.
 *
 * Why layering instead of WebGL: a real Three.js scene would add ~600 KB of
 * JavaScript and, with no licensed 3D model available, would have to be built
 * from primitives — which looks like a toy. Layered vector planes give the
 * same depth cue at a fraction of a kilobyte and stay crisp at any size.
 *
 * Motion policy:
 *   - auto-rotation and float are disabled under `prefers-reduced-motion`
 *   - dragging is user-initiated, so it stays available either way
 *   - arrow keys drive the same rotation for keyboard users
 */

const BASE_Y = -16;
const BASE_X = 6;
const MIN_Y = -46;
const MAX_Y = 34;
const MIN_X = -14;
const MAX_X = 20;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ProductViewer({
  className = "",
  /** Rendered scale hint; the component fills its container. */
  label = "Interactive view of a behind-the-ear hearing aid. Use the arrow keys to rotate it.",
}: {
  className?: string;
  label?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [engaged, setEngaged] = useState(false);
  const state = useRef({
    y: BASE_Y,
    x: BASE_X,
    targetY: BASE_Y,
    targetX: BASE_X,
    dragging: false,
    lastX: 0,
    lastY: 0,
    idle: 0,
    reduced: false,
  });

  /* Rotation loop. One rAF for the whole lifetime: it eases the current
     rotation toward its target and, when the viewer is idle, drifts the target
     itself so the device turns slowly on its own. */
  useEffect(() => {
    const s = state.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;

      if (!s.dragging) {
        if (s.reduced) {
          s.targetY = BASE_Y;
          s.targetX = BASE_X;
        } else {
          s.idle += dt;
          s.targetY = BASE_Y + Math.sin(s.idle * 0.42) * 9;
          s.targetX = BASE_X + Math.sin(s.idle * 0.31) * 3.4;
        }
      }

      // Critically-damped-ish easing — settles fast without overshoot.
      const k = 1 - Math.pow(0.0016, dt);
      s.y += (s.targetY - s.y) * k;
      s.x += (s.targetX - s.x) * k;

      const el = stageRef.current;
      if (el) {
        el.style.transform = `rotateX(${s.x.toFixed(2)}deg) rotateY(${s.y.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.dragging = true;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    setEngaged(true);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = event.clientX - s.lastX;
    const dy = event.clientY - s.lastY;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    s.targetY = clamp(s.targetY + dx * 0.42, MIN_Y, MAX_Y);
    s.targetX = clamp(s.targetX - dy * 0.3, MIN_X, MAX_X);
  }, []);

  const endDrag = useCallback(() => {
    state.current.dragging = false;
  }, []);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const s = state.current;
    const step = 7;
    if (event.key === "ArrowLeft") s.targetY = clamp(s.targetY - step, MIN_Y, MAX_Y);
    else if (event.key === "ArrowRight") s.targetY = clamp(s.targetY + step, MIN_Y, MAX_Y);
    else if (event.key === "ArrowUp") s.targetX = clamp(s.targetX - step, MIN_X, MAX_X);
    else if (event.key === "ArrowDown") s.targetX = clamp(s.targetX + step, MIN_X, MAX_X);
    else return;
    event.preventDefault();
    setEngaged(true);
    s.idle = 0;
  }, []);

  const layer = (z: number): CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translateZ(${z}px)`,
    transformStyle: "preserve-3d",
    willChange: "transform",
  });

  return (
    <div
      className={`relative select-none ${className}`}
      role="img"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onKeyDown={onKeyDown}
      style={{ perspective: "1500px", touchAction: "pan-y", cursor: "grab" }}
    >
      {/* Halo behind everything — does not rotate, keeps the composition calm. */}
      <div
        className="pointer-events-none absolute -inset-x-10 -inset-y-12 rounded-[3rem] blur-3xl"
        style={{
          backgroundImage:
            "radial-gradient(38% 34% at 62% 32%, rgba(255,255,255,0.30), transparent 70%)," +
            "radial-gradient(42% 42% at 26% 74%, rgba(32,105,180,0.55), transparent 72%)," +
            "radial-gradient(30% 30% at 80% 84%, rgba(220,38,56,0.22), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Orbiting listening rings. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg viewBox="0 0 520 560" className="h-full w-full" fill="none">
          <g style={{ transformOrigin: "260px 280px", animation: "turn 34s linear infinite" }}>
            <circle cx="260" cy="280" r="236" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" strokeDasharray="3 12" />
            <circle cx="260" cy="44" r="4.5" fill="rgba(255,255,255,0.5)" />
          </g>
          <g style={{ transformOrigin: "260px 280px", animation: "turn-reverse 48s linear infinite" }}>
            <circle cx="260" cy="280" r="196" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" strokeDasharray="2 9" />
            <circle cx="260" cy="84" r="3.5" fill="rgba(132,174,222,0.7)" />
          </g>
          <circle cx="260" cy="280" r="150" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        </svg>
      </div>

      {/* The 3D stage. Everything inside rotates together. The stage stops
          short of the bottom so the device never sits under the "drag to
          rotate" affordance. */}
      <div
        className="absolute inset-x-0 bottom-10 top-0"
        style={{ transformStyle: "preserve-3d", animation: "float 11s ease-in-out infinite" }}
      >
        <div ref={stageRef} className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          {/* ── Ground-plane glow: lies flat, stays put as the device turns ── */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "6%",
              right: "6%",
              bottom: "2%",
              height: "26%",
              transform: "translateZ(-60px) rotateX(74deg)",
              backgroundImage:
                "radial-gradient(closest-side, rgba(255,255,255,0.30), rgba(77,139,203,0.22) 55%, transparent 100%)",
              filter: "blur(14px)",
            }}
          />

          {/* ── Wire + ear dome, trailing behind the shell ─────────────────── */}
          <div style={layer(-34)} aria-hidden="true">
            <svg viewBox="0 0 520 560" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="pv-wire" x1="228" y1="358" x2="262" y2="500" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#dfeaf6" />
                  <stop offset="1" stopColor="#8aa4c2" />
                </linearGradient>
                <radialGradient id="pv-dome" cx="0.34" cy="0.3" r="0.8">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="0.75" stopColor="#cfe0f2" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#9fc0e0" stopOpacity="0.7" />
                </radialGradient>
                <radialGradient id="pv-shadow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#00112e" stopOpacity="0.55" />
                  <stop offset="0.6" stopColor="#00112e" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#00112e" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="262" cy="532" rx="150" ry="26" fill="url(#pv-shadow)" />

              <g stroke="#84aede" strokeLinecap="round" fill="none">
                <path d="M320 474c13 10 13 32 0 42" strokeWidth="3.6" opacity="0.7" style={{ animation: "sheen 4.2s ease-in-out infinite" }} />
                <path d="M338 462c21 17 21 52 0 69" strokeWidth="3" opacity="0.45" style={{ animation: "sheen 4.2s ease-in-out 0.5s infinite" }} />
                <path d="M358 450c29 25 29 72 0 97" strokeWidth="2.4" opacity="0.26" style={{ animation: "sheen 4.2s ease-in-out 1s infinite" }} />
              </g>

              {/* Receiver tube: a short, thick, softly-curved run into the ear —
                  a long thin line reads as a balloon string instead of a device. */}
              <path d="M244 344 C 230 384 226 418 242 446" stroke="url(#pv-wire)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <path d="M244 344 C 230 384 226 418 242 446" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.45" fill="none" />

              <ellipse cx="248" cy="466" rx="28" ry="24" fill="url(#pv-dome)" />
              <ellipse cx="248" cy="466" rx="28" ry="24" stroke="#86a8c9" strokeWidth="1.3" opacity="0.75" />
              <g stroke="#5b7fa5" strokeWidth="1" opacity="0.4">
                <path d="M221 459h55M221 466h55M221 473h55" />
                <path d="M231 444v45M245 441v51M259 444v45" />
              </g>
              <ellipse cx="238" cy="456" rx="8" ry="5" fill="#ffffff" opacity="0.6" />
            </svg>
          </div>

          {/* ── Body: the pearl shell ──────────────────────────────────────── */}
          <div style={layer(0)} aria-hidden="true">
            <svg viewBox="0 0 520 560" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="pv-shell" x1="190" y1="88" x2="390" y2="370" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#fdfeff" />
                  <stop offset="0.3" stopColor="#eaf2fb" />
                  <stop offset="0.62" stopColor="#c2d6ec" />
                  <stop offset="0.86" stopColor="#9ab7d5" />
                  <stop offset="1" stopColor="#7796b9" />
                </linearGradient>
                <linearGradient id="pv-rim" x1="190" y1="88" x2="386" y2="330" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#7ea6cc" stopOpacity="0" />
                </linearGradient>
                <filter id="pv-soft" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
                <filter id="pv-blurSm" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.5" />
                </filter>
                <clipPath id="pv-clip">
                  <path d={SHELL_PATH} />
                </clipPath>
              </defs>

              <path d={SHELL_PATH} fill="url(#pv-shell)" />
              <path d={SHELL_PATH} fill="none" stroke="url(#pv-rim)" strokeWidth="2" />

              <g clipPath="url(#pv-clip)">
                <ellipse cx="226" cy="180" rx="46" ry="98" fill="#ffffff" opacity="0.45" filter="url(#pv-soft)" style={{ animation: "sheen 7s ease-in-out infinite" }} />
                <path d="M196 244c-8-56 18-114 70-140" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity="0.7" fill="none" filter="url(#pv-blurSm)" />
                <path d="M232 120 C 300 118 360 150 372 214" stroke="#8fadcb" strokeWidth="1.4" opacity="0.5" fill="none" />
                <ellipse cx="340" cy="330" rx="80" ry="36" fill="#4d8bcb" opacity="0.3" filter="url(#pv-soft)" />
              </g>

              {/* microphone array */}
              <g fill="#061a30" opacity="0.82">
                <circle cx="268" cy="105" r="2.7" />
                <circle cx="279" cy="105" r="2.7" />
                <circle cx="290" cy="105" r="2.7" />
                <circle cx="273" cy="113" r="2.2" />
                <circle cx="284" cy="113" r="2.2" />
              </g>
            </svg>
          </div>

          {/* ── Faceplate: sits proud of the shell, so it parallaxes ───────── */}
          <div style={layer(30)} aria-hidden="true">
            <svg viewBox="0 0 520 560" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="pv-face" x1="236" y1="122" x2="352" y2="288" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#1a4d80" />
                  <stop offset="0.42" stopColor="#0d2e55" />
                  <stop offset="1" stopColor="#03142a" />
                </linearGradient>
                <linearGradient id="pv-faceSheen" x1="240" y1="130" x2="300" y2="250" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <filter id="pv-softF" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
                <clipPath id="pv-faceClip">
                  <rect x="230" y="118" width="134" height="150" rx="56" transform="rotate(-7 297 193)" />
                </clipPath>
              </defs>

              <rect x="230" y="118" width="134" height="150" rx="56" transform="rotate(-7 297 193)" fill="url(#pv-face)" />
              <g clipPath="url(#pv-faceClip)">
                <rect x="230" y="118" width="134" height="150" fill="url(#pv-faceSheen)" />
                <g stroke="#7ea6cc" strokeWidth="0.7" opacity="0.16">
                  <path d="M236 132h124M234 152h128M236 172h124M238 192h120M240 212h116M242 232h112M244 252h108" />
                </g>
                <ellipse cx="258" cy="168" rx="30" ry="52" fill="#ffffff" opacity="0.16" filter="url(#pv-softF)" />
              </g>
              <rect x="230" y="118" width="134" height="150" rx="56" transform="rotate(-7 297 193)" fill="none" stroke="#4d8bcb" strokeOpacity="0.4" strokeWidth="1.3" />

              <rect x="329" y="166" width="10" height="58" rx="5" fill="#0a2444" />
              <rect x="331" y="169" width="6" height="52" rx="3" fill="#1e4f83" opacity="0.9" />
              <g stroke="#6f9cc7" strokeWidth="1" opacity="0.45">
                <path d="M331 186h6M331 196h6M331 206h6" />
              </g>

              <circle cx="268" cy="229" r="14" fill="#0a2444" />
              <circle cx="268" cy="229" r="11" fill="#1e4f83" />
              <circle cx="268" cy="229" r="7.5" fill="#265c93" opacity="0.7" />
              <circle cx="264" cy="224" r="3.4" fill="#8fb6dc" opacity="0.4" />

              <g>
                <rect x="300" y="212" width="16" height="7" rx="3.5" fill="#0a2444" />
                <rect x="300" y="226" width="16" height="7" rx="3.5" fill="#0a2444" />
                <rect x="300" y="240" width="16" height="7" rx="3.5" fill="#0a2444" />
                <rect x="301.5" y="213.2" width="13" height="5" rx="2.5" fill="#1e4f83" />
                <rect x="301.5" y="227.2" width="13" height="5" rx="2.5" fill="#1e4f83" />
                <rect x="301.5" y="241.2" width="13" height="5" rx="2.5" fill="#1e4f83" />
              </g>

              <radialGradient id="pv-led" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#ff8090" />
                <stop offset="0.5" stopColor="#d01028" />
                <stop offset="1" stopColor="#d01028" stopOpacity="0" />
              </radialGradient>
              <circle cx="318" cy="140" r="10" fill="url(#pv-led)" opacity="0.45" />
              <circle cx="318" cy="140" r="3.2" fill="#e65466" />
              <circle cx="318" cy="140" r="1.2" fill="#ffe1e4" />

              <path d="M240 250 C 246 262 254 270 264 275" stroke="#d01028" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" fill="none" />
            </svg>
          </div>

          {/* ── Specular sweep: closest plane, sells the glass surface ─────── */}
          <div style={layer(52)} aria-hidden="true">
            <svg viewBox="0 0 520 560" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="pv-spec" x1="180" y1="120" x2="300" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <ellipse cx="250" cy="196" rx="26" ry="62" fill="url(#pv-spec)" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Interaction affordance — disappears once the viewer is used. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-1 flex justify-center transition-opacity duration-500 ${
          engaged ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-100 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to rotate
        </span>
      </div>
    </div>
  );
}
