import { countWord, plainFact } from "@/lib/now";

/**
 * The week, one honest sentence. A handful of small rules each look for one
 * kind of oddity in the week's scrobbles and say how surprising it is; the
 * most surprising fact becomes the heading on Music. When nothing stands out
 * it is the plain line the page has always had: "Sixty-two plays this week.
 * Mostly Bon Iver." Pure, so the route can call it and a fixture can check it.
 */

/** One scrobble: the song and when it started (unix seconds). */
export type Scrobble = { title: string; artist: string; at: number };

export type WeekInput = {
  /** The window's scrobbles, newest first, as Last.fm lists them. */
  scrobbles: Scrobble[];
  /** Last.fm's count for the window. More than `scrobbles.length` means the list is only the newest part. */
  total: number;
  /** The week's most-played artist, from Last.fm's own chart. */
  artist: string | null;
  /** Now, in unix seconds. */
  now: number;
  /** His IANA zone; null (or one Intl does not know) reads the week in UTC. */
  timeZone: string | null;
  /** Whether a song is playing now, which rules out "Nothing since Thursday." */
  playing: boolean;
};

type Fact = { text: string; score: number };

/** About the width of the heading on a phone before it wraps. */
const MAX_CHARS = 60;
const DAY = 86400;

/**
 * Parts of the day, and roughly how much of anyone's listening each holds, so
 * "mostly after midnight" counts for more than "mostly in the afternoon".
 */
const BANDS = [
  { from: 0, to: 5, words: "after midnight", usual: 0.08 },
  { from: 5, to: 9, words: "early in the morning", usual: 0.1 },
  { from: 9, to: 12, words: "in the morning", usual: 0.15 },
  { from: 12, to: 17, words: "in the afternoon", usual: 0.27 },
  { from: 17, to: 21, words: "in the evening", usual: 0.24 },
  { from: 21, to: 24, words: "late at night", usual: 0.16 },
] as const;

/** A count inside a sentence: "eleven", "no", "sixty-two", "140". */
const count = (n: number) => countWord(n).toLowerCase();
const plays = (n: number) => `${countWord(n)} play${n === 1 ? "" : "s"}`;
const keyOf = (s: { artist: string; title: string }) => `${s.artist}\u0000${s.title}`.toLowerCase();

/** A title as the sentence says it: no guest credit, no remaster tag. */
function said(title: string) {
  return (
    title
      .replace(/\s*[([](?:feat\.?|ft\.?|with)\s[^)\]]*[)\]]\s*$/i, "")
      .replace(/\s*[([][^)\]]*remaster[^)\]]*[)\]]\s*$/i, "")
      .replace(/\s+-\s+[^-]*remaster.*$/i, "")
      .trim() || title
  );
}

type Day = { day: string; weekday: string; hour: number };

/** Reads unix seconds as a calendar day and hour in `zone`, falling back to UTC. */
function reader(zone: string | null): (at: number) => Day {
  let f: Intl.DateTimeFormat;
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "long" };
  try {
    f = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: zone ?? "UTC" });
  } catch {
    f = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" });
  }
  return (at) => {
    const p: Record<string, string> = {};
    for (const part of f.formatToParts(new Date(at * 1000))) p[part.type] = part.value;
    return { day: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, hour: Number(p.hour) % 24 };
  };
}

/**
 * How a day is named from now: "today", "yesterday", "on Tuesday", and "last
 * Thursday" for the day a week ago that shares today's name.
 */
function namer(read: (at: number) => Day, now: number) {
  const today = read(now).day;
  const yesterday = read(now - DAY).day;
  const weekAgo = read(now - 7 * DAY).day;
  return {
    /** Today or yesterday: too recent for "nothing since". */
    recent(d: Day) {
      return d.day === today || d.day === yesterday;
    },
    on(d: Day) {
      if (d.day === today) return "today";
      if (d.day === yesterday) return "yesterday";
      return d.day === weekAgo ? `last ${d.weekday}` : `on ${d.weekday}`;
    },
    since(d: Day) {
      return d.day === weekAgo ? `last ${d.weekday}` : d.weekday;
    },
  };
}

function most<K>(counts: Map<K, number>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const [k, n] of counts) if (!best || n > best[1]) best = [k, n];
  return best;
}

function tally<T, K>(items: T[], key: (t: T) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const t of items) m.set(key(t), (m.get(key(t)) ?? 0) + 1);
  return m;
}

/**
 * A sentence as the heading says it. It starts with a capital, as sentences
 * do ("Iris five times", though a title shaped like "eBay" keeps its shape),
 * and it never carries an exclamation mark, not even a song's own: that fact
 * gives way to the next one.
 */
function heading(text: string): string | null {
  if (text.includes("!")) return null;
  return /^\p{Ll}(?!\p{Lu})/u.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function weekFact(input: WeekInput): string {
  const { now, playing, total } = input;
  const scrobbles = input.scrobbles.filter((s) => s.at <= now + 60).sort((a, b) => b.at - a.at);
  const fallback = plainFact(total, input.artist);
  if (!scrobbles.length) return fallback;

  const read = reader(input.timeZone);
  const name = namer(read, now);
  const days = scrobbles.map((s) => read(s.at));
  // Counts and shares only mean something when the list is the whole week.
  const whole = scrobbles.length >= total;
  const n = scrobbles.length;
  const facts: Fact[] = [];

  // A gap up to now, nothing yesterday or today: the most honest thing a quiet week can say.
  if (!playing && !name.recent(days[0])) {
    facts.push({ text: `Nothing since ${name.since(days[0])}.`, score: 10 + (now - scrobbles[0].at) / DAY });
  }

  // One song over and over. A run that reaches the oldest scrobble of a cut-off list may be longer than it looks.
  let run = 1;
  let best = { len: 1, at: 0 };
  for (let i = 1; i <= n; i++) {
    if (i < n && keyOf(scrobbles[i]) === keyOf(scrobbles[i - 1])) run++;
    else {
      const reachesEdge = i === n && !whole;
      if (run > best.len && !reachesEdge) best = { len: run, at: i - 1 };
      run = 1;
    }
  }
  if (best.len >= 4) {
    facts.push({ text: `${said(scrobbles[best.at].title)} ${count(best.len)} times in a row.`, score: 1 + (best.len - 3) * 0.6 });
  }

  if (whole && n >= 5) {
    // One song, mostly on one day.
    const songs = new Map<string, number[]>();
    scrobbles.forEach((s, i) => {
      const k = keyOf(s);
      const list = songs.get(k);
      if (list) list.push(i);
      else songs.set(k, [i]);
    });
    for (const idx of songs.values()) {
      const c = idx.length;
      if (c < 5) continue;
      const top = most(tally(idx, (i) => days[i].day));
      if (!top) continue;
      const [day, d] = top;
      if (d < 4 || d / c < 0.6) continue;
      const when = name.on(days[idx.find((i) => days[i].day === day)!]);
      const title = said(scrobbles[idx[0]].title);
      const text = d === c ? `${title} ${count(c)} times, all ${when}.` : `${title} ${count(c)} times, ${count(d)} of them ${when}.`;
      facts.push({ text, score: (d / c) * Math.log2(d) });
    }

    // The whole week, mostly on one day.
    const topDay = most(tally(days, (d) => d.day));
    if (topDay && n >= 12 && topDay[1] / n >= 0.5) {
      const when = name.on(days.find((d) => d.day === topDay[0])!);
      const text = topDay[1] === n ? `${plays(n)}, all ${when}.` : `${plays(n)}, ${count(topDay[1])} of them ${when}.`;
      facts.push({ text, score: Math.log2((topDay[1] / n) * 7) * 0.9 });
    }

    // One artist and little else.
    const topArtist = most(tally(scrobbles, (s) => s.artist));
    const artistShare = topArtist ? topArtist[1] / n : 0;
    if (topArtist && n >= 10 && artistShare >= 0.75) {
      const text = artistShare >= 0.95 ? `Nothing but ${topArtist[0]}.` : `${topArtist[0]}, and not much else.`;
      facts.push({ text, score: 1.2 + (artistShare - 0.75) * 6 });
    }

    // Listening gathered into one part of the day.
    if (n >= 10) {
      const band = most(tally(days, (d) => BANDS.findIndex((b) => d.hour >= b.from && d.hour < b.to)));
      if (band && band[1] / n >= 0.5) {
        const b = BANDS[band[0]];
        const share = band[1] / n;
        const who = topArtist && artistShare >= 0.3 ? `Mostly ${topArtist[0]}` : plays(n);
        facts.push({ text: `${who}, mostly ${b.words}.`, score: Math.log2(share / b.usual) });
      }
    }
  }

  const fits = facts
    .map((f) => ({ score: f.score, text: heading(f.text) ?? "" }))
    .filter((f) => f.text && f.text.length <= MAX_CHARS && f.score > 1);
  fits.sort((a, b) => b.score - a.score);
  return fits[0]?.text ?? fallback;
}
