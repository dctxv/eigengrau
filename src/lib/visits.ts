import { NOTES, TABS, UPDATED, URCHI_NEWS, countWord, fillLine, type TabHref } from "@/content/site";

/**
 * When this browser was last here, and which tab the visitor just left.
 * Shell calls noteVisit on mount and on every route change, so it runs on
 * every page.
 *
 * The storage contract (Notes reads it too): localStorage `eigengrau:visits`
 * holds `{ "prev": number | null, "seen": number }`, ms since the epoch.
 * `seen` is the last activity, refreshed on load, on route changes (at most
 * once a minute) and when the page is hidden. A load more than 30 minutes
 * after `seen` begins a new visit: `prev` becomes that `seen` (when the last
 * visit ended), then `seen` is now. A first-ever visit has `prev` null.
 * "Newer than the last visit" means newer than `prev`.
 *
 * The route left is kept in memory only: it matters for this session alone.
 */

const KEY = "eigengrau:visits";
const NEW_VISIT_MS = 30 * 60 * 1000;
const REFRESH_MS = 60 * 1000;

type Visits = { prev: number | null; seen: number };

/** This page load's visit: when the last one ended, and when `seen` was last written. */
let visit: { prev: number | null; wrote: number } | null = null;
let current: string | null = null;
let left: string | null = null;

function read(): Visits | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Visits>;
    if (typeof v.seen !== "number" || !Number.isFinite(v.seen)) return null;
    return { prev: typeof v.prev === "number" && Number.isFinite(v.prev) ? v.prev : null, seen: v.seen };
  } catch {
    return null;
  }
}

function write(v: Visits) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: every visit is a first */
  }
}

/** The visit begins (once per page load): decide whether it is a new one, and keep `seen` fresh when the page goes. */
function begin(now: number) {
  if (visit) return visit;
  const stored = read();
  const prev = !stored ? null : now - stored.seen > NEW_VISIT_MS ? stored.seen : stored.prev;
  visit = { prev, wrote: now };
  write({ prev, seen: now });
  const flush = () => {
    if (!visit) return;
    visit.wrote = Date.now();
    write({ prev: visit.prev, seen: visit.wrote });
  };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  return visit;
}

/** On mount and on every route change: the visit's clock, and the tab just left. */
export function noteVisit(path: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const v = begin(now);
  if (path !== current) {
    left = current;
    current = path;
  }
  if (now - v.wrote >= REFRESH_MS) {
    v.wrote = now;
    write({ prev: v.prev, seen: now });
  }
}

/** When the previous visit ended (ms), or null on a first visit. */
export function lastVisit(): number | null {
  if (typeof window === "undefined") return null;
  return begin(Date.now()).prev;
}

/** The route the visitor was on before this one, in this session; null on arrival. */
export function leftRoute(): string | null {
  return left;
}

/** A day as YYYY-MM-DD in the visitor's zone, to compare with the content's dates. */
function dayOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "12 September", with the year when it is not this one. */
function sinceText(ms: number, now: Date): string {
  const d = new Date(ms);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-GB", opts);
}

/** Which visit Urchi last pointed out news for (its `prev`), so the look happens once per visit, reloads included. */
const TOLD_KEY = "eigengrau:told";

export function newsTold(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TOLD_KEY) === String(lastVisit());
  } catch {
    return false;
  }
}

export function markNewsTold(): void {
  try {
    window.localStorage.setItem(TOLD_KEY, String(lastVisit()));
  } catch {
    /* private mode */
  }
}

export type News = { href: TabHref; label: string; line: string };

/**
 * What changed since the last visit, for Urchi to look at: the tab with the newest change since
 * `prev` (ties go to the earlier tab), and his line about it: "Two new notes since 12 September."
 * Notes date from the newest note, Projects and About from UPDATED. Null on a first visit or when
 * nothing is newer.
 */
export function whatsNew(prev: number | null = lastVisit(), now = new Date()): News | null {
  if (prev === null) return null;
  const since = dayOf(prev);
  const sinceWords = sinceText(prev, now);
  const fresh = NOTES.filter((n) => n.date > since);
  const newestNote = fresh.reduce((d, n) => (n.date > d ? n.date : d), "");
  const changes: { href: TabHref; date: string }[] = [];
  if (UPDATED.projects > since) changes.push({ href: "/projects", date: UPDATED.projects });
  if (newestNote) changes.push({ href: "/notes", date: newestNote });
  if (UPDATED.about > since) changes.push({ href: "/about", date: UPDATED.about });
  if (!changes.length) return null;
  const order = (h: TabHref) => TABS.findIndex((t) => t.href === h);
  changes.sort((a, b) => (a.date === b.date ? order(a.href) - order(b.href) : a.date > b.date ? -1 : 1));
  const { href } = changes[0];
  const label = TABS.find((t) => t.href === href)!.label;
  const line =
    href === "/notes"
      ? fillLine(fresh.length === 1 ? URCHI_NEWS.note : URCHI_NEWS.notes, { count: countWord(fresh.length), date: sinceWords })
      : fillLine(URCHI_NEWS.changed, { date: sinceWords });
  return { href, label, line };
}
