import { ELSEWHERE, ITEMS } from "@/content/site";

/**
 * What Urchi has caught (Space): the items it brought back on its line, each once, and when. They
 * hang in the sky behind it afloat (sky/Found.ts), on every visit after.
 *
 * The state is `localStorage["eigengrau:found"] = { items, forged, sum }`, every access guarded:
 * `items` each caught item's id and when it was first caught (ms since the epoch), `forged` the ids
 * it holds only as forgeries, and `sum` a checksum over both. The sum is not security (it is in the
 * page's own source, for anyone who reads it): it tells a list Urchi wrote from one written for it.
 * A list that does not add up is a forgery, and is kept as one: Urchi hands its forger a copy of
 * one of the things it claims (see Catch.ts), and after that every item it claimed hangs in their
 * sky as a forgery until the real one is caught. Private mode keeps it in memory for the page's life.
 */

const KEY = "eigengrau:found";
/** What the sum is salted with. Changing it makes every list kept so far a forgery. */
const SALT = "eigengrau/urchi/found/1";

type Stored = { items: Record<string, number>; forged?: string[]; sum: string };

/** What Urchi has: each item it caught and when, the ones it holds only as forgeries, and whether a forged list is waiting to be answered. */
export type Found = { items: Map<string, number>; forged: Set<string>; tampered: boolean };

/** Every item's id there is (site.ts ITEMS): a list names no others. */
const KNOWN = new Set(Object.values(ITEMS).flatMap((tier) => tier.map((i) => i.id)));

/** 53 bits of a string, as two 32-bit halves in hex (cyrb53): enough that a changed list never adds up by chance. */
function hash(s: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

/** The sum of a list: its items in order of their ids, each with its time, then its forgeries. */
function sumOf(items: Map<string, number>, forged: Set<string>) {
  const list = [...items].sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, at]) => `${id}:${at}`);
  return hash(`${SALT}|${list.join(",")}|${[...forged].sort().join(",")}`);
}

/** What this page knows, whatever storage allows: read once, then kept here. */
let known: Found | null = null;
const listeners = new Set<(f: Found) => void>();

function read(): Found {
  const empty: Found = { items: new Map(), forged: new Set(), tampered: false };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return empty;
  }
  if (!raw) return empty;
  let v: Partial<Stored> | null = null;
  try {
    v = JSON.parse(raw) as Partial<Stored>;
  } catch {
    /* not even a list: a forgery of nothing */
  }
  // what it claims, whatever shape it is in: the ids it names that are items, and when
  const items = new Map<string, number>();
  const forged = new Set<string>();
  if (v && typeof v.items === "object" && v.items) {
    for (const [id, at] of Object.entries(v.items)) if (KNOWN.has(id)) items.set(id, Number.isFinite(at) ? Number(at) : 0);
  }
  if (v && Array.isArray(v.forged)) for (const id of v.forged) if (typeof id === "string" && items.has(id)) forged.add(id);
  const whole = !!v && typeof v.items === "object" && !!v.items && Object.keys(v.items).length === items.size && Object.values(v.items).every((at) => Number.isFinite(at));
  if (whole && typeof v?.sum === "string" && v.sum === sumOf(items, forged)) return { items, forged, tampered: false };
  return { items, forged, tampered: true };
}

function write(f: Found) {
  const stored: Stored = { items: Object.fromEntries(f.items), sum: sumOf(f.items, f.forged) };
  if (f.forged.size) stored.forged = [...f.forged];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* private mode: kept in memory for this page */
  }
}

/** What Urchi has (see Found). A forged list's items are all it has until the forgery is answered; the sky shows none of them before then. */
export function found(): Found {
  if (typeof window === "undefined") return { items: new Map(), forged: new Set(), tampered: false };
  known ??= read();
  return known;
}

/** Tells `fn` whenever what Urchi has changes (a catch, a forgery answered); returns the way to stop. */
export function onFound(fn: (f: Found) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function changed(f: Found) {
  known = f;
  write(f);
  listeners.forEach((fn) => fn(f));
}

/** Caught for real: kept from now (when it was first caught stays, and a forgery of it is a forgery no more). */
export function keepFound(id: string) {
  const f = found(), items = new Map(f.items), forged = new Set(f.forged);
  if (!items.has(id) || forged.has(id)) items.set(id, Date.now());
  forged.delete(id);
  changed({ items, forged, tampered: f.tampered });
}

/**
 * A forged list answered: Urchi has handed over its forgery (a copy of `id`), so every item the list
 * claimed is kept as a forgery, that one too (see the top of this file), and the list is Urchi's own
 * again, adding up.
 */
export function keepForged(id: string) {
  const f = found(), items = new Map(f.items);
  if (!items.has(id)) items.set(id, Date.now());
  changed({ items, forged: new Set(items.keys()), tampered: false });
}

/** Whether it has an item for real (not only as a forgery). */
export function hasFound(id: string) {
  const f = found();
  return f.items.has(id) && !f.forged.has(id);
}

/** The console's word to whoever reads it, once a page: the hint, and once a list is forged, the answer. */
let hinted = false;
let answered = false;
const INK = "font: 12px/1.5 ui-monospace, monospace; color: #9aa0b4";

/** The hint, for whoever opens the console on Space. */
export function hintFound() {
  if (hinted || typeof console === "undefined") return;
  hinted = true;
  console.info(`%cUrchi keeps what it catches in this browser (localStorage, "${KEY}"). It can tell a catch from a copy.`, INK);
}

/** The answer to a forged list, the first time one is caught out. */
export function answerForged() {
  if (answered || typeof console === "undefined") return;
  answered = true;
  const mail = ELSEWHERE.find((l) => "copy" in l);
  const email = mail && "copy" in mail ? mail.copy : null;
  console.info(`%cYou made that list. Studying how systems break? So is he. The sum is in the source, if you want to do it properly${email ? `, or write to ${email}` : ""}.`, INK);
}
