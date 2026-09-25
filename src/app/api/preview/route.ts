import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const SEARCH = "https://itunes.apple.com/search";
const DAY = 86400;
/** Nothing Last.fm calls a song or an artist is longer than this. */
const MAX_PARAM = 200;

type Result = {
  wrapperType?: string;
  kind?: string;
  artistName?: string;
  trackName?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

/**
 * Tags that name the same recording in other words, so they can be dropped
 * before titles are compared: a remaster is still the song, a live take is not.
 */
const SAME_SONG = /^(?:(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?(?:\s+version)?|(?:\d{4}\s+)?digital\s+remaster|mono|stereo|(?:single|album|lp)\s+version|radio\s+edit|explicit|clean|bonus\s+track|deluxe(?:\s+edition)?|(?:feat|ft|with)\.?\s.*)$/i;
/** Tags that make it a different recording: through the wall, the wrong take is the wrong song. */
const OTHER_TAKE = /\b(?:live|remix|mix|acoustic|demo|instrumental|rework|reprise|unplugged|session|karaoke|cover|edit|orchestral|piano version)\b/i;

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

/** The first credited artist, and the whole credit, both normalised; a leading "the" does not count. */
function artists(name: string) {
  const bare = (s: string) => norm(s).replace(/^the /, "");
  const first = name.split(/\s*(?:,|&|\bx\b|\band\b|\bfeat\.?|\bft\.?|\bwith\b)\s*/i)[0] ?? name;
  return new Set([bare(name), bare(first)]);
}

/**
 * How sure a result is: 2 when the titles agree tag for tag, 1 when only the
 * base titles agree and neither is a different take, 0 when it is not the song.
 */
function confidence(want: { artist: string; title: string }, r: Result): number {
  if (!r.trackName || !r.artistName || !r.previewUrl) return 0;
  if (r.kind && r.kind !== "song") return 0;
  const ours = artists(want.artist);
  const theirs = artists(r.artistName);
  if (![...ours].some((a) => a && theirs.has(a))) return 0;
  const a = parts(want.title);
  const b = parts(r.trackName);
  if (!a.base || !b.base) return 0;
  if (a.full === b.full) return 2;
  if (a.base === b.base && !a.other && !b.other) return 1;
  return 0;
}

/** Only Apple's own hosts, over https: this route is not a general proxy. */
function apple(url: string | undefined, hosts: string[]): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ? u.href : null;
  } catch {
    return null;
  }
}

const silence = (cache: boolean) =>
  new Response(null, { status: 404, headers: { "Cache-Control": cache ? `public, max-age=${DAY}` : "no-store" } });

/**
 * A song's 30-second preview, found on the keyless iTunes Search API by
 * artist and title and proxied same-origin, so the site's AudioContext may
 * filter it (through the wall). Only a confident match plays: no match is a
 * 404, because a wrong song through the wall is worse than none. The Apple
 * Music page for the track rides along in X-Preview-Link, for the attribution
 * under the sleeve. Cached for a day.
 */
export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
  if (!artist || !title || artist.length > MAX_PARAM || title.length > MAX_PARAM) return silence(true);
  try {
    // Search on the title without its tags: Apple's index does better on the bare name.
    const bare = title.replace(/\s*(?:\([^()]*\)|\[[^[\]]*\])\s*$/g, "").replace(/\s-\s.*$/, "") || title;
    const q = new URLSearchParams({ term: `${artist} ${bare}`, entity: "song", media: "music", limit: "10" });
    const res = await fetch(`${SEARCH}?${q}`, { next: { revalidate: DAY } });
    if (!res.ok) return silence(false);
    const { results = [] } = (await res.json()) as { results?: Result[] };
    const ranked = results
      .map((r, i) => ({ r, i, c: confidence({ artist, title }, r) }))
      .filter((x) => x.c > 0)
      .sort((x, y) => y.c - x.c || x.i - y.i);
    const pick = ranked.find((x) => apple(x.r.previewUrl, ["apple.com", "mzstatic.com"]));
    if (!pick) return silence(true);
    const audio = await fetch(apple(pick.r.previewUrl, ["apple.com", "mzstatic.com"])!, { next: { revalidate: DAY } });
    if (!audio.ok || !audio.body) return silence(false);
    const headers = new Headers({
      "Content-Type": audio.headers.get("content-type") ?? "audio/mp4",
      "Cache-Control": `public, max-age=${DAY}`,
    });
    const length = audio.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    const link = apple(pick.r.trackViewUrl, ["apple.com"]);
    if (link) headers.set("X-Preview-Link", link);
    return new Response(audio.body, { headers });
  } catch {
    return silence(false);
  }
}
