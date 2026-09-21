"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger offset in ms — keeps grouped cards cascading in. */
  delay?: number;
  className?: string;
  /** Element to render. Defaults to a div. */
  as?: ElementType;
};

/**
 * Progressive-enhancement scroll reveal.
 *
 * Deliberately not a motion library: this is ~1 KB, runs once per element,
 * disconnects as soon as it fires, and steps aside entirely for
 * `prefers-reduced-motion`. Content is never hidden when JS is unavailable —
 * `globals.css` overrides `.reveal-init` under reduced motion, and
 * `layout.tsx` adds a `<noscript>` override.
 */
export function Reveal({ children, delay = 0, className, as }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Elements already in view on load reveal immediately.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      // `min-w-0`: grid/flex children default to min-width:auto, which lets
      // intrinsic-width media (SVGs, long unbroken strings) push a track wider
      // than the viewport and cause horizontal scroll. Wrappers opt out.
      className={`${shown ? "reveal-in" : "reveal-init"} min-w-0 ${className ?? ""}`}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
