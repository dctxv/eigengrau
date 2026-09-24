/** Motion tokens (spec 3.4). Durations in seconds for GSAP. */
export const EASE = {
  reveal: "power4.out",
  tab: "power3.out",
  drop: "power3.out",
  slide: "power4.inOut",
  inout: "power2.inOut",
} as const;

export const DUR = {
  reveal: 0.9,
  tab: 0.42,
  tabDelay: 0.19,
  drop: 0.8,
  slide: 1.0,
  slideDelay: 0.2,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Breakpoints from the spec (section 12). */
export const BP = {
  intro: 1025, // side text hidden at or below
  desktop: 1024, // sound chip + cursor labels above this
  phone: 640,
} as const;

export function isCompact(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= BP.desktop;
}
