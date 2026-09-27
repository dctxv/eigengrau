import { lastVisit } from "@/lib/visits";

/**
 * Urchi taken along (panel 2, the spacesuit): whether the visitor pressed the peg on Space and it
 * wears its suit, and the one registry the pages share with it.
 *
 * The state is `localStorage["eigengrau:along"] = { on, visit }`, every access guarded. `visit` is
 * the visit it was set in, named as visits.ts names a visit (when the last one ended, its `prev`),
 * so it is honoured only within that visit by visits.ts's 30-minute rule: a reload or a return to
 * Space inside the half hour finds it still suited, and a stranger next week gets the site as
 * designed. Private mode keeps it in memory for the page's life instead.
 */

const KEY = "eigengrau:along";

type Stored = { on: boolean; visit: string };

/** What this page knows, whatever storage allows: read once, then kept here. */
let known: boolean | null = null;
const listeners = new Set<(on: boolean) => void>();

/** This visit's name: when the last visit ended, or "first". */
const visitName = () => String(lastVisit() ?? "first");

function read(): boolean {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as Partial<Stored>;
    return v.on === true && v.visit === visitName();
  } catch {
    return false;
  }
}

/** Whether Urchi is along now (suited, and on the other tabs once the companion comes). */
export function alongOn(): boolean {
  if (typeof window === "undefined") return false;
  known ??= read();
  return known;
}

/** Taken along (true) or left home (false): remembered for this visit, and told to whoever listens. */
export function setAlong(on: boolean): void {
  if (typeof window === "undefined") return;
  const was = alongOn();
  known = on;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ on, visit: visitName() } satisfies Stored));
  } catch {
    /* private mode: kept in memory for this page */
  }
  if (was !== on) listeners.forEach((l) => l(on));
}

/** Told when it is taken along or left home; returns the way to stop listening. */
export function onAlong(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ------------------------------------------------------------------ the registry

/**
 * The one registry (the archivist's rule: one, not three). What a page offers the companion that
 * rides along on it, and nothing else: its interest points, its events and its content edge. A
 * page adds what it has when it mounts and takes it away when it goes (every add returns its
 * removal). Nothing reads it yet; the companion is the next packet's.
 *
 * - Interest points: places on the page worth a look (the hovered mark on Projects, a note at the
 *   reading line), each a way to find a client-px point now (null while it is not there) and a
 *   weight, as attention.ts weighs its targets.
 * - Events: one bus, six kinds. `tick` (a Projects crossing, a riffle's tick), `slide` (the pages
 *   sliding), `door` (Music's preview door opening or closing), `type` (a letter typed to find a
 *   note), `fold` (Notes folding or unfolding), `nova` (a supernova's phases: ProjectsPanel says so
 *   with a window CustomEvent "eigengrau:nova" {phase}, which the companion forwards here).
 *   `detail` is the kind's own (a phase, a direction); `big` marks the ones worth leaning in for.
 * - The content edge: one number, the left edge (client px) of the page's `[data-focus]` element,
 *   measured when asked, never cached: how far into the margin an excursion may go. It is not a
 *   keep-out system.
 */

export type Point = { x: number; y: number };
export type Interest = { id: string; at: () => Point | null; weight: number };
export type AlongKind = "tick" | "slide" | "door" | "type" | "fold" | "nova";
export type AlongEvent = { kind: AlongKind; detail?: string; big?: boolean; at: number };

const interests = new Map<string, Interest>();
const hearers = new Set<(e: AlongEvent) => void>();

export const registry = {
  /** Adds a page's interest point (a new one with the same id replaces it); returns its removal. */
  interest(point: Interest): () => void {
    interests.set(point.id, point);
    return () => {
      if (interests.get(point.id) === point) interests.delete(point.id);
    };
  },
  /** The interest points on offer now. */
  interests(): Interest[] {
    return [...interests.values()];
  },
  /** Something happened on the page (performance.now() stamps it). */
  emit(kind: AlongKind, o: { detail?: string; big?: boolean } = {}): void {
    const e: AlongEvent = { kind, ...o, at: performance.now() };
    hearers.forEach((h) => h(e));
  },
  /** Hears every event; returns the way to stop. */
  listen(hearer: (e: AlongEvent) => void): () => void {
    hearers.add(hearer);
    return () => {
      hearers.delete(hearer);
    };
  },
  /** The content edge now: the left edge of the `[data-focus]` element on screen, or null where the page has none. */
  edge(): number | null {
    if (typeof document === "undefined") return null;
    for (const el of document.querySelectorAll<HTMLElement>("[data-focus]")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > 0 && r.left < window.innerWidth) return r.left;
    }
    return null;
  },
};
