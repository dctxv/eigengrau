/**
 * Which tab the visitor is on, and the slide taking them there. Shell writes
 * it on arrival and on every route change; whatever should move with the pages
 * reads it or listens. The song left playing in Music's room, for one, is
 * heard from further off as the page slides away from it.
 */
export type Where = {
  /** The route arrived at, or being slid to. */
  path: string;
  /** The route being left; null on arrival. */
  from: string | null;
  /** When the pages start to move (performance.now() ms; a slide waits a moment first). */
  at: number;
  /** How long they take to get there (ms): the slide's length, or 0 for a jump. */
  over: number;
};

let where: Where | null = null;
const listeners = new Set<(w: Where) => void>();

/** The visitor is on `path`, or on their way there: the pages move `delay` ms from now, for `over` ms. */
export function arrive(path: string, from: string | null, delay = 0, over = 0) {
  where = { path, from, at: performance.now() + delay, over };
  listeners.forEach((l) => l(where!));
}

/** Where the visitor is, or null before Shell has said. */
export function whereNow(): Where | null {
  return where;
}

/** Told on every arrival and route change. Returns the unsubscribe. */
export function onWhere(l: (w: Where) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * The tab panels on screen: the one arrived at and, while a slide runs, the
 * one it is leaving. Every tab visited stays mounted (Shell keeps it, hidden,
 * so coming back finds it as it was left: Urchi where it floated, the ball as
 * it was spun, the song still playing); a panel off screen pauses its frames
 * and leaves the keys to the one on screen. Shell keeps this; pages read it.
 */
let shown: ReadonlySet<string> = new Set();
const shownListeners = new Set<(s: ReadonlySet<string>) => void>();

/** Shell: these panels are on screen now. */
export function setShown(paths: string[]) {
  const next = new Set(paths);
  if (next.size === shown.size && [...next].every((p) => shown.has(p))) return;
  shown = next;
  shownListeners.forEach((l) => l(shown));
}

/** Whether a tab's panel is on screen (arrived at, or in a slide). */
export function isShown(path: string): boolean {
  return shown.has(path);
}

/** Told whenever the panels on screen change, and once at once. Returns the unsubscribe. */
export function onShown(l: (s: ReadonlySet<string>) => void): () => void {
  shownListeners.add(l);
  l(shown);
  return () => {
    shownListeners.delete(l);
  };
}
