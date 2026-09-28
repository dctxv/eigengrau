import { lastVisit } from "@/lib/visits";

/**
 * Urchi taken with you (Space): whether the visitor took it out of its room, so it floats there on
 * its line in its suit rather than sitting at home.
 *
 * The state is `localStorage["eigengrau:along"] = { on, visit }`, every access guarded. `visit` is
 * the visit it was set in, named as visits.ts names a visit (when the last one ended, its `prev`),
 * so it is honoured only within that visit by visits.ts's 30-minute rule: a reload or a return to
 * Space inside the half hour finds it still out there, and a stranger next week gets the site as
 * designed. Private mode keeps it in memory for the page's life instead.
 */

const KEY = "eigengrau:along";

type Stored = { on: boolean; visit: string };

/** What this page knows, whatever storage allows: read once, then kept here. */
let known: boolean | null = null;

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

/** Whether Urchi is taken with you now. */
export function alongOn(): boolean {
  if (typeof window === "undefined") return false;
  known ??= read();
  return known;
}

/** Taken with you (true) or back home (false): remembered for this visit. */
export function setAlong(on: boolean): void {
  if (typeof window === "undefined") return;
  known = on;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ on, visit: visitName() } satisfies Stored));
  } catch {
    /* private mode: kept in memory for this page */
  }
}
