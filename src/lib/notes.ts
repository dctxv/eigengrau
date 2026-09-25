import { NOTES, NOTES_FOLD_AFTER, numberWord, type Note } from "@/content/site";

/**
 * The Notes column's data and copy: the order, the anchors, the index sentence, the sediment's
 * months and years, and the visitor's last visit. No DOM here; the panel does the moving.
 */

/** Newest first; entries on the same day keep their order in NOTES. */
export const ENTRIES: Note[] = [...NOTES].sort((a, b) => b.date.localeCompare(a.date));

/** The hash anchor is the date; a second entry on the same day falls back to its id. */
export const ANCHORS = new Map<string, string>();
{
  const days = new Set<string>();
  ENTRIES.forEach((n) => {
    ANCHORS.set(n.id, days.has(n.date) ? n.id : n.date);
    days.add(n.date);
  });
}

/** The entry an anchor names, if any. */
export function byAnchor(anchor: string): Note | null {
  if (!anchor) return null;
  return ENTRIES.find((n) => ANCHORS.get(n.id) === anchor) ?? null;
}

export const dot = (date: string) => date.replaceAll("-", ".");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON = MONTHS.map((m) => m.slice(0, 3));
const pad = (n: number) => String(n).padStart(2, "0");

/** A moment as a YYYY-MM-DD day in the visitor's own zone, the form the notes are dated in. */
export function localDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const TEENS = ["Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** numberWord, carried on to ninety-nine so a year can hold "Eighty-one notes"; digits after that. */
export function countWord(n: number): string {
  if (n <= 12) return numberWord(n);
  if (n < 20) return TEENS[n - 13];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${numberWord(n % 10).toLowerCase()}` : "");
  return String(n);
}
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export type Category = { tag: string; count: number };

/**
 * The tags by how often he uses them. Among equals the one he reached for first comes first, and
 * the site's own log goes last: it is the site talking about itself.
 */
export function categories(entries: readonly Note[]): Category[] {
  const count = new Map<string, number>();
  const first = new Map<string, number>();
  let k = 0;
  entries.forEach((n) =>
    n.tags.forEach((t) => {
      count.set(t, (count.get(t) ?? 0) + 1);
      if (!first.has(t)) first.set(t, k++);
    }),
  );
  return [...count]
    .map(([tag, c]) => ({ tag, count: c }))
    .sort((a, b) => b.count - a.count || Number(a.tag === "site") - Number(b.tag === "site") || first.get(a.tag)! - first.get(b.tag)!);
}

export const CATEGORIES = categories(ENTRIES);
const RANK = new Map(CATEGORIES.map((c, i) => [c.tag, i]));

/** How a count names its tag, split so the tag word itself can be the button: "on psychology", "random", "about the site". */
function onTag(tag: string): [string, string] {
  if (tag === "site") return ["about the", "site"];
  if (tag === "random") return ["", "random"];
  return ["on", tag];
}

/** Whether there is more than the last sixty days to fold. */
export const SETTLES = ENTRIES.length > NOTES_FOLD_AFTER;

/* ------------------------------------------------------------------ */
/* Sentences, written as pieces so the panel can make words buttons    */
/* and rise only the words that changed.                               */
/* ------------------------------------------------------------------ */

export type Piece =
  | { kind: "word"; key: string; text: string; glue?: boolean }
  | { kind: "tag"; key: string; tag: string; glue?: boolean }
  | { kind: "more"; key: string; text: string; glue?: boolean }
  | { kind: "all"; key: string; glue?: boolean }
  | { kind: "field"; key: string; glue?: boolean; end: string };

class Writer {
  out: Piece[] = [];
  /** Words, each its own piece; `glue` sits the first against what came before ("psychology,"). */
  say(key: string, text: string, glue = false) {
    text
      .split(" ")
      .filter(Boolean)
      .forEach((w, i) => this.out.push({ kind: "word", key: `${key}.${i}:${w}`, text: w, glue: glue && i === 0 }));
    return this;
  }
  tag(tag: string) {
    this.out.push({ kind: "tag", key: `tag:${tag}`, tag });
    return this;
  }
}

/** "since August", with the year once it is not this one. */
function since(oldest: string, today: string): string {
  const month = MONTHS[+oldest.slice(5, 7) - 1];
  return oldest.slice(0, 4) === today.slice(0, 4) ? month : `${month} ${oldest.slice(0, 4)}`;
}

/** Names at most this many categories before "and four more". */
const NAMED = 4;

/** "Nine since August: three on psychology, three on ai, three random, three about the site." */
export function indexSentence(today: string, more: boolean): Piece[] {
  const w = new Writer();
  w.say("n", `${countWord(ENTRIES.length)} since ${since(ENTRIES[ENTRIES.length - 1].date, today)}:`);
  // Five fit; past that the top four stand for the rest until asked.
  const shown = CATEGORIES.length > NAMED + 1 && !more ? CATEGORIES.slice(0, NAMED) : CATEGORIES;
  shown.forEach((c, i) => {
    const [pre] = onTag(c.tag);
    w.say(`c:${c.tag}`, `${lower(countWord(c.count))} ${pre}`).tag(c.tag);
    const last = i === shown.length - 1;
    if (last && shown.length < CATEGORIES.length) {
      w.say("and", "and");
      w.out.push({ kind: "more", key: "more", text: `${lower(countWord(CATEGORIES.length - shown.length))} more` });
      w.say("end", ".", true);
    } else {
      w.say(`p:${c.tag}`, last ? "." : ",", true);
    }
  });
  return w.out;
}

/** "Three on psychology, newest first. All notes." */
export function tagSentence(tag: string, count: number): Piece[] {
  const w = new Writer();
  const [pre, word] = onTag(tag);
  w.say("n", `${countWord(count)} ${pre} ${word}${count > 1 ? "," : "."}`);
  if (count > 1) w.say("f", "newest first.");
  w.out.push({ kind: "all", key: "all" });
  return w.out;
}

/** "containing ‘cache’. One." and, inside a tag, "containing ‘cache’. One on psychology. All notes." */
export function findSentence(query: string, count: number, tag: string | null): Piece[] {
  const w = new Writer();
  const asked = query.trim() !== "";
  w.say("c", "containing");
  w.out.push({ kind: "field", key: "field", end: asked ? "’." : "’" });
  if (asked) {
    const n = count === 0 ? "None" : countWord(count);
    if (tag) {
      const [pre, word] = onTag(tag);
      w.say("n", `${n} ${pre} ${word}.`);
    } else {
      w.say("n", `${n}.`);
    }
  }
  if (tag) w.out.push({ kind: "all", key: "all" });
  return w.out;
}

/** The pieces as plain text, for the live region. */
export function plain(pieces: readonly Piece[], query: string): string {
  let s = "Notes";
  for (const p of pieces) {
    const text = p.kind === "word" ? p.text : p.kind === "tag" ? p.tag : p.kind === "more" ? p.text : p.kind === "all" ? "All notes." : `‘${query}${p.end}`;
    s += (p.glue ? "" : " ") + text;
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Finding                                                             */
/* ------------------------------------------------------------------ */

const flat = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const HAYSTACK = new Map(ENTRIES.map((n) => [n.id, flat(n.body)]));

/** What a note has to have to stay open: the tag, and the letters in its body or its tags. */
export function matcher(tag: string | null, query: string): (n: Note) => boolean {
  const q = flat(query.trim());
  return (n) => (!tag || n.tags.includes(tag)) && (!q || HAYSTACK.get(n.id)!.includes(q) || n.tags.some((t) => flat(t).includes(q)));
}

/** A folded run for the cursor label: "Eleven notes, Jun to Aug 2026", or "One note, 14 Sep 2026". */
export function runLabel(run: readonly Note[]): string {
  const newest = run[0].date;
  const oldest = run[run.length - 1].date;
  const count = `${countWord(run.length)} note${run.length === 1 ? "" : "s"}`;
  const ym = (d: string) => [d.slice(0, 4), MON[+d.slice(5, 7) - 1]] as const;
  const [ny, nm] = ym(newest);
  const [oy, om] = ym(oldest);
  if (run.length === 1) return `${count}, ${+newest.slice(8)} ${nm} ${ny}`;
  if (newest.slice(0, 7) === oldest.slice(0, 7)) return `${count}, ${nm} ${ny}`;
  if (ny === oy) return `${count}, ${om} to ${nm} ${ny}`;
  return `${count}, ${om} ${oy} to ${nm} ${ny}`;
}

/* ------------------------------------------------------------------ */
/* Sediment                                                            */
/* ------------------------------------------------------------------ */

export type Month = { id: string; label: string; year: string | null; entries: Note[] };
export type Year = { id: string; label: string; months: Month[]; entries: Note[] };
export type Settled = { recent: Note[]; months: Month[]; years: Year[] };

const RECENT_DAYS = 60;

/**
 * The column as sediment: the last sixty days in full, each older month as one line, and whole
 * years older than a year as one line each, which open into their months. With no notes in the
 * last sixty days the newest month stays open, so the top of the column is never only summaries.
 */
export function settle(today: Date): Settled {
  if (!SETTLES) return { recent: ENTRIES, months: [], years: [] };
  const back = new Date(today);
  back.setDate(back.getDate() - RECENT_DAYS);
  let from = localDay(back.getTime());
  if (!ENTRIES.some((n) => n.date >= from)) from = `${ENTRIES[0].date.slice(0, 7)}-01`;
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  // Only a whole year folds into one line, so no year is ever split between a line and its months.
  const foldBefore = yearAgo.getFullYear();

  const recent: Note[] = [];
  const months = new Map<string, Month>();
  const years = new Map<string, Year>();
  for (const n of ENTRIES) {
    if (n.date >= from) {
      recent.push(n);
      continue;
    }
    const m = n.date.slice(0, 7);
    const y = n.date.slice(0, 4);
    const inYear = +y < foldBefore;
    let month = months.get(m);
    if (!month) {
      month = { id: m, label: dot(m), year: inYear ? y : null, entries: [] };
      months.set(m, month);
      if (inYear) {
        let year = years.get(y);
        if (!year) years.set(y, (year = { id: y, label: y, months: [], entries: [] }));
        year.months.push(month);
      }
    }
    month.entries.push(n);
    if (inYear) years.get(y)!.entries.push(n);
  }
  return { recent, months: [...months.values()].filter((m) => !m.year), years: [...years.values()] };
}

/** The groups a note sits in, outermost first, so a deep link can open them. */
export function groupsOf(n: Note, settled: Settled): string[] {
  if (settled.recent.includes(n)) return [];
  const m = n.date.slice(0, 7);
  return settled.years.some((y) => y.id === n.date.slice(0, 4)) ? [n.date.slice(0, 4), m] : [m];
}

/**
 * A folded month or year in words. At rest: "Eleven notes. Mostly ai." With a tag the count follows
 * it ("Twenty on psychology."), and while finding it counts matches. `none` dims a line with nothing in it.
 */
export function summary(entries: readonly Note[], tag: string | null, query: string, match: (n: Note) => boolean): { pieces: Piece[]; none: boolean } {
  const w = new Writer();
  if (query.trim()) {
    const m = entries.filter(match).length;
    w.say("q", `${m === 0 ? "No" : countWord(m)} ${m === 1 ? "match" : "matches"}.`);
    return { pieces: w.out, none: m === 0 };
  }
  if (tag) {
    const m = entries.filter(match).length;
    const [pre, word] = onTag(tag);
    w.say("t", `${m === 0 ? "None" : countWord(m)} ${pre} ${word}.`);
    return { pieces: w.out, none: m === 0 };
  }
  const count = new Map<string, number>();
  entries.forEach((n) => n.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
  const [top, c] = [...count].sort((a, b) => b[1] - a[1] || (RANK.get(a[0]) ?? 0) - (RANK.get(b[0]) ?? 0))[0];
  const [pre] = onTag(top);
  if (entries.length === 1) w.say("s", `One note, ${pre}`).tag(top).say("e", ".", true);
  else if (c === entries.length) w.say("s", `${countWord(entries.length)} notes, all ${pre}`).tag(top).say("e", ".", true);
  else w.say("s", `${countWord(entries.length)} notes. Mostly ${top === "site" ? "about the" : ""}`).tag(top).say("e", ".", true);
  return { pieces: w.out, none: false };
}

/* ------------------------------------------------------------------ */
/* The last visit                                                      */
/* ------------------------------------------------------------------ */

/** Written by the Space work on every page: { prev, seen } in ms; prev is when the previous visit ended. */
const VISITS_KEY = "eigengrau:visits";
/** The same gap that starts a new visit there. */
const NEW_VISIT_AFTER = 30 * 60 * 1000;

/**
 * The day the visitor's previous visit ended, in their own zone, or null for a first visit or no
 * memory. Read before this visit has been counted, `seen` is still when that visit ended.
 */
export function lastVisitDay(now: number): string | null {
  try {
    const raw = window.localStorage.getItem(VISITS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { prev?: unknown; seen?: unknown };
    const prev = typeof v.prev === "number" ? v.prev : null;
    const seen = typeof v.seen === "number" ? v.seen : null;
    const ended = seen !== null && now - seen > NEW_VISIT_AFTER ? seen : prev;
    return ended === null ? null : localDay(ended);
  } catch {
    return null;
  }
}
