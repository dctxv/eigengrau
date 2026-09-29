import { lastVisit } from "@/lib/visits";

/**
 * The sky's seed for the visit: rolled at random the first time a visit asks, and kept for the
 * rest of it, so a reload (or a return to Space) finds the same sky, and the next visit a new one.
 *
 * The state is `localStorage["eigengrau:sky"] = { seed, visit }`, every access guarded. `visit` is
 * the visit it was rolled in, named as visits.ts names a visit (when the last one ended), so it is
 * honoured only within that visit by visits.ts's 30-minute rule, as along.ts keeps Urchi out on its
 * line. Private mode keeps it in memory for the page's life instead.
 */

const KEY = "eigengrau:sky";

type Stored = { seed: string; visit: string };

/** What this page knows, whatever storage allows. */
let known: string | null = null;

/** This visit's name: when the last visit ended, or "first". */
const visitName = () => String(lastVisit() ?? "first");

/** A new seed: six base-36 characters, short enough to share (?sky=k3x9q2). */
export function rollSeed(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += Math.floor(Math.random() * 36).toString(36);
  return s;
}

/** The seed the address asks for (?sky=<seed>), or null. Any string will do. */
export function urlSeed(): string | null {
  if (typeof window === "undefined") return null;
  const s = new URLSearchParams(window.location.search).get("sky")?.trim();
  return s ? s.slice(0, 64) : null;
}

/** This visit's seed: the one rolled earlier in the visit, or a new one, kept. */
export function visitSeed(): string {
  if (known) return known;
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
    if (v && typeof v.seed === "string" && v.seed && v.visit === visitName()) return (known = v.seed);
  } catch {
    /* unreadable: a new one */
  }
  return keepSeed(rollSeed());
}

/** Keep `seed` as this visit's sky. */
export function keepSeed(seed: string): string {
  known = seed;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ seed, visit: visitName() } satisfies Stored));
  } catch {
    /* private mode: kept in memory for this page */
  }
  return seed;
}
