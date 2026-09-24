export type SiteRoute = {
  href: "/" | "/music" | "/game" | "/strategy" | "/projects" | "/log";
  label: string;
  /** Digit shown as a serif superscript and used for keyboard navigation. */
  digit: 1 | 2 | 3 | 4 | 5 | 6;
};

export const ROUTES: readonly SiteRoute[] = [
  { href: "/", label: "Space", digit: 1 },
  { href: "/music", label: "Music", digit: 2 },
  { href: "/game", label: "Game", digit: 3 },
  { href: "/strategy", label: "Strategy", digit: 4 },
  { href: "/projects", label: "Projects", digit: 5 },
  { href: "/log", label: "Log", digit: 6 },
] as const;

export const SITE_NAME = "Clay";
export const SITE_LINE = "A portfolio, sort of";

/** Transition types read by the page slide. Forward slides left, back slides right. */
export type SlideDirection = "nav-forward" | "nav-back";

/** Position of a path in the site's left-to-right order. Anything unlisted sits after Log. */
export function routeIndex(pathname: string): number {
  const i = ROUTES.findIndex((route) => route.href === pathname);
  return i === -1 ? ROUTES.length : i;
}

export function slideDirection(from: string, to: string): SlideDirection {
  return routeIndex(to) < routeIndex(from) ? "nav-back" : "nav-forward";
}
