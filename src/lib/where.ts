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
