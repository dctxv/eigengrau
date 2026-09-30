/**
 * Finding a song Last.fm names on the keyless stores that carry it, for its
 * 30-second preview and its sleeve: Apple's iTunes Search API first (artist
 * and title together, then the title alone, which finds what Apple's index
 * ranks out of the pair), then Deezer's, which lists new releases soonest.
 * Only a confident match counts (see confidence): a wrong song through the
 * wall, or the wrong sleeve on the wall, is worse than none. Shared by
 * /api/preview (the song) and /api/now (a sleeve Last.fm has no art for,
 * which it hands on as a cover id /api/cover serves).
 */

import { revalidateTag } from "next/cache";

const ITUNES = "https://itunes.apple.com/search";
const DEEZER = "https://api.deezer.com/search";
/**
 * How long a store's answer is kept, in seconds. Not a day: a song released
 * this morning fills in on the stores within hours, and a search made before
 * it did would otherwise keep saying it is not there.
 */
export const KEEP = 6 * 3600;
/** How long one search may take, the answer and all. */
const SEARCH_MS = 5_000;
/** Nothing Last.fm calls a song or an artist is longer than this. */
export const MAX_PARAM = 200;

/** Where a preview may be fetched from, and a sleeve, and where the link under it may point: only the stores' own hosts, over https. */
export const PREVIEW_HOSTS = ["apple.com", "mzstatic.com", "dzcdn.net"];
export const ART_HOSTS = ["mzstatic.com", "dzcdn.net"];
const LINK_HOSTS = ["apple.com", "deezer.com"];

/** A song as a store lists it (Deezer's with its track id, to ask for a fresh preview by). */
type Listing = { artist: string; title: string; preview: string | null; link: string | null; art: string | null; id?: number };
export type Found = Listing & { from: "apple" | "deezer" };

/**
 * Tags that name the same recording in other words, so they can be dropped
 * before titles are compared: a remaster is still the song, a live take is not.
 */
const SAME_SONG = /^(?:(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?(?:\s+version)?|(?:\d{4}\s+)?digital\s+remaster|mono|stereo|(?:single|album|lp)\s+version|radio\s+edit|explicit|clean|bonus\s+track|deluxe(?:\s+edition)?|(?:feat|ft|with)\.?\s.*)$/i;
/** Tags that make it a different recording: through the wall, the wrong take is the wrong song. */
const OTHER_TAKE = /\b(?:live|remix|mix|acoustic|demo|instrumental|rework|reprise|unplugged|session|karaoke|cover|edit|orchestral|piano version|sped up|slowed)\b/i;

/** Lower case, accents off, "&" as "and", punctuation to spaces; letters of any script survive. */
function norm(s: string) {
  return s
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** A title split into what it is called and the tags hung on the end: "(Live)", "[2011 Remaster]", "- Radio Edit". */
function parts(title: string) {
  let base = title.trim();
  const tags: string[] = [];
  for (;;) {
    const m = /\s*(?:\(([^()]*)\)|\[([^[\]]*)\]|\s-\s([^-]+))$/.exec(base);
    if (!m || m.index === 0) break;
    tags.unshift((m[1] ?? m[2] ?? m[3]).trim());
    base = base.slice(0, m.index).trim();
  }
  const kept = tags.filter((t) => !SAME_SONG.test(t));
  return { base: norm(base), full: norm([base, ...kept].join(" ")), other: kept.some((t) => OTHER_TAKE.test(t)) };
}

/** A title without the tags hung on its end: the stores' indexes do better on the bare name. */
export function bareTitle(title: string) {
  return title.replace(/\s*(?:\([^()]*\)|\[[^[\]]*\])\s*$/g, "").replace(/\s-\s.*$/, "").trim() || title;
}

/** Every credited artist, the first alone and the whole credit, normalised; a leading "the" does not count. */
function artists(name: string) {
  const bare = (s: string) => norm(s).replace(/^the /, "");
  const each = name.split(/\s*(?:,|&|\bx\b|\band\b|\bfeat\.?|\bft\.?|\bwith\b)\s*/i).map(bare).filter(Boolean);
  return { first: each[0] ?? bare(name), all: new Set([bare(name), ...each]) };
}

/**
 * How sure a listing is: 2 when the titles agree tag for tag, 1 when only the
 * base titles agree and neither is a different take, 0 when it is not the
 * song. The artists agree when Last.fm's first credited artist is one the
 * store credits (or the whole credit is): stores split and order a credit
 * their own way ("A & B" is "A, B" or "B feat. A" elsewhere).
 */
function confidence(want: { artist: string; title: string }, r: Listing): number {
  const ours = artists(want.artist);
  const theirs = artists(r.artist);
  if (!theirs.all.has(ours.first) && ![...ours.all].some((a) => a && theirs.first === a)) return 0;
  const a = parts(want.title);
  const b = parts(r.title);
  if (!a.base || !b.base) return 0;
  if (a.full === b.full) return 2;
  if (a.base === b.base && !a.other && !b.other) return 1;
  return 0;
}

/**
 * A song's name as loosely as it can be told apart: its first credited artist and its title
 * without the tags that name the same recording (a feature, a remaster), normalised; a live take
 * or a remix stays apart. Last.fm's charts correct what was scrobbled ("Song (feat. X)" is "Song"
 * there, "A & B" is "A"), so a chart's song and the play it counts meet here when their exact
 * names do not.
 */
export function songKey(artist: string, title: string) {
  return `${artists(artist).first}\u0000${parts(title).full}`;
}

/** A URL on one of the hosts, over https; null for anything else. */
export function onHost(url: string | null | undefined, hosts: string[]): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * A store turning a request away with a 200: Deezer answers its rate limit (and its other
 * errors) as `{ "error": { "code": 4, ... } }`, which is not a list with nothing in it. Its
 * codes 4 (quota: its limit is per address, and a serverless function shares its address) and
 * 700 (busy) pass within a few seconds.
 */
type Refusal = { error?: { code?: number } };
const refused = (body: unknown) => typeof body === "object" && body !== null && typeof (body as Refusal).error === "object" && (body as Refusal).error !== null;
const busy = (body: unknown) => [4, 700].includes(Number((body as Refusal).error?.code));
/** How long a store that said it is busy is given before it is asked once more (ms). */
const BUSY_WAIT = 1_500;

/** The data cache's tag for a store's URL: a hash of it, as a tag is kept short. */
function tagOf(url: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) h = Math.imul(h ^ url.charCodeAt(i), 0x01000193);
  return `store:${(h >>> 0).toString(36)}:${url.length}`;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((done) => {
    const t = setTimeout(done, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), done()), { once: true });
  });

/**
 * A store's answer, kept KEEP seconds (or not at all); null when it did not answer, not in time,
 * or turned the request away. A refusal is never kept as an answer: the cache only keeps a 200,
 * and a refusal comes as one, so it is dropped from the cache at once, and a store that said it
 * was busy is asked once more a moment later. Kept, a refusal read as "no such song" for hours,
 * and a song new to the week's chart, looked up with the rest of what has no sleeve all at once,
 * was the one it fell on.
 */
async function ask<T>(url: string, signal?: AbortSignal, keep = true): Promise<T | null> {
  const tag = tagOf(url);
  for (let tries = 0; tries < 2; tries++) {
    try {
      const res = await fetch(url, {
        ...(keep && tries === 0 ? { next: { revalidate: KEEP, tags: [tag] } } : { cache: "no-store" as const }),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(SEARCH_MS)]) : AbortSignal.timeout(SEARCH_MS),
      });
      if (!res.ok) return null;
      const body: unknown = await res.json();
      if (!refused(body)) return body as T;
      if (keep && tries === 0) {
        try {
          revalidateTag(tag, { expire: 0 });
        } catch {
          /* outside a request (a script): nothing is kept there anyway */
        }
      }
      if (!busy(body) || signal?.aborted) return null;
      await wait(BUSY_WAIT, signal);
    } catch {
      return null;
    }
  }
  return null;
}

type AppleResult = { kind?: string; artistName?: string; trackName?: string; previewUrl?: string; trackViewUrl?: string; artworkUrl100?: string };

/**
 * Apple's listings for a search, null when it did not answer: its artwork
 * asked for at 600 pixels (it serves any size it is asked for under the same path).
 */
async function apple(params: Record<string, string>, signal?: AbortSignal): Promise<Listing[] | null> {
  const q = new URLSearchParams({ ...params, entity: "song", media: "music", limit: "25" });
  const body = await ask<{ results?: AppleResult[] }>(`${ITUNES}?${q}`, signal);
  if (!body) return null;
  return (body.results ?? [])
    .filter((r) => r.trackName && r.artistName && (!r.kind || r.kind === "song"))
    .map((r) => ({
      artist: r.artistName!,
      title: r.trackName!,
      preview: r.previewUrl ?? null,
      link: r.trackViewUrl ?? null,
      art: r.artworkUrl100 ? r.artworkUrl100.replace(/\/[^/]+$/, "/600x600bb.jpg") : null,
    }));
}

type DeezerResult = { id?: number; title?: string; preview?: string; link?: string; artist?: { name?: string }; album?: { cover_big?: string; cover_xl?: string } };

/** Deezer's listings for a search, null when it did not answer. */
async function deezer(q: string, signal?: AbortSignal): Promise<Listing[] | null> {
  const body = await ask<{ data?: DeezerResult[] }>(`${DEEZER}?${new URLSearchParams({ q, limit: "25" })}`, signal);
  if (!body) return null;
  return (body.data ?? [])
    .filter((r) => r.title && r.artist?.name)
    .map((r) => ({ artist: r.artist!.name!, title: r.title!, preview: r.preview || null, link: r.link ?? null, art: r.album?.cover_big ?? r.album?.cover_xl ?? null, id: r.id }));
}

/**
 * A Deezer track's preview asked for afresh: its preview URLs are signed to
 * expire within the hour, so one out of a search kept for hours may be dead.
 */
async function deezerPreview(id: number, signal?: AbortSignal): Promise<string | null> {
  const body = await ask<DeezerResult>(`https://api.deezer.com/track/${id}`, signal, false);
  return body?.preview || null;
}

/**
 * The song on the first store that lists it confidently with what is wanted
 * (a preview, or a sleeve), or null. The searches go in turn, each only if
 * the one before found nothing: Apple on artist and title, Apple on the title
 * alone, Deezer on artist and title as fields, Deezer as plain words. When
 * none lists it but one of them did not answer, that is no answer: it throws,
 * so the miss is not kept.
 */
export async function findSong(artist: string, title: string, want: "preview" | "art", signal?: AbortSignal): Promise<Found | null> {
  const bare = bareTitle(title);
  const plain = (s: string) => s.replace(/"/g, " ").trim();
  const searches: [Found["from"], () => Promise<Listing[] | null>][] = [
    ["apple", () => apple({ term: `${artist} ${bare}` }, signal)],
    ["apple", () => apple({ term: bare, attribute: "songTerm" }, signal)],
    ["deezer", () => deezer(`artist:"${plain(artist)}" track:"${plain(bare)}"`, signal)],
    ["deezer", () => deezer(`${artist} ${bare}`, signal)],
  ];
  let unanswered = false;
  for (const [from, search] of searches) {
    if (signal?.aborted) return null;
    const listed = await search();
    if (!listed) unanswered = true;
    const ranked = (listed ?? [])
      .map((r, i) => ({ r, i, c: confidence({ artist, title }, r) }))
      .filter((x) => x.c > 0)
      .sort((x, y) => y.c - x.c || x.i - y.i);
    for (const { r } of ranked) {
      let preview = onHost(r.preview, PREVIEW_HOSTS);
      const art = onHost(r.art, ART_HOSTS);
      if (want === "preview" ? !preview : !art) continue;
      if (want === "preview" && from === "deezer" && r.id) preview = onHost(await deezerPreview(r.id, signal), PREVIEW_HOSTS) ?? preview;
      return { ...r, preview, art, link: onHost(r.link, LINK_HOSTS), from };
    }
  }
  if (unanswered) throw new Error("A store did not answer");
  return null;
}

/**
 * A sleeve from a store as a cover id: its URL, base64url, after "x-" (a
 * Last.fm sleeve's id is its bare hash). /api/cover takes it back, and serves
 * it only from the stores' own hosts.
 */
export const artId = (url: string) => `x-${Buffer.from(url).toString("base64url")}`;
export function artUrl(id: string): string | null {
  const m = /^x-([A-Za-z0-9_-]{8,700})$/.exec(id);
  return m ? onHost(Buffer.from(m[1], "base64url").toString("utf8"), ART_HOSTS) : null;
}
