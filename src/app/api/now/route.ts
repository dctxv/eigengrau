import { NextResponse } from "next/server";
import { TIME_ZONE } from "@/content/site";
import { EMPTY_NOW, type NowResponse, type Playing, type Track } from "@/lib/now";
import { weekFact, type Scrobble } from "./fact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://ws.audioscrobbler.com/2.0/";
/** Last.fm's "no art" image, which it serves under a fixed hash. */
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
const WEEK = 7 * 24 * 3600;
const TOP_TRACKS = 10;
/** The week's scrobbles, a page at a time: read for art, and for the week's one honest sentence. */
const WEEK_SCROBBLES = 200;
/** A heavy week is read up to this many pages; past that the sentence only says what a part can prove. */
const WEEK_PAGES = 5;
/**
 * Seconds each answer is cached. What is playing moves fast (the page asks
 * every 20s while he is live), the week's charts do not, and a song's length
 * never changes.
 */
const FRESH = { now: 15, week: 300, info: 86400 };
/** How long past its end a song may still say "now playing" before it is taken as stale. */
const GRACE = 60;
/** With no length to go on, a now-playing this old is stale. */
const UNKNOWN_CAP = 15 * 60;

type Image = { size: string; "#text": string };
type RecentTrack = {
  name: string;
  url?: string;
  artist: { "#text": string };
  album: { "#text": string };
  image?: Image[];
  date?: { uts: string };
  "@attr"?: { nowplaying?: string };
};
type Recent = { recenttracks?: { track?: RecentTrack | RecentTrack[]; "@attr"?: { total?: string; totalPages?: string } } };
type TopTrackRaw = { name: string; url?: string; playcount: string; artist: { name: string } };
type TopArtistRaw = { name: string };
type Info = { track?: { duration?: string | number } };

/** The hash from the extralarge image URL's last segment (…/<hash>.png); null for no art. */
function coverId(images: Image[] | undefined): string | null {
  const url = images?.find((i) => i.size === "extralarge")?.["#text"] ?? images?.at(-1)?.["#text"] ?? "";
  const m = /\/([a-f0-9]{32})(?:\.(?:png|jpg))?$/i.exec(url);
  if (!m) return null;
  const id = m[1].toLowerCase();
  return id === PLACEHOLDER ? null : id;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

const keyOf = (artist: string, title: string) => `${artist}\u0000${title}`.toLowerCase();
const recentKey = (t: RecentTrack) => keyOf(t.artist["#text"], t.name);

function track(t: RecentTrack): Track {
  return { title: t.name, artist: t.artist["#text"], album: t.album["#text"] || null, coverId: coverId(t.image), url: t.url ?? null };
}

async function call<T>(key: string, params: Record<string, string>, revalidate: number): Promise<T> {
  const q = new URLSearchParams({ ...params, api_key: key, format: "json" });
  const res = await fetch(`${API}?${q}`, { next: { revalidate } });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/** A song's length in seconds from track.getInfo, cached for a day; null when Last.fm does not know it. */
async function lengthOf(key: string, t: RecentTrack): Promise<number | null> {
  try {
    const info = await call<Info>(key, { method: "track.getInfo", artist: t.artist["#text"], track: t.name, autocorrect: "1" }, FRESH.info);
    const ms = Number(info.track?.duration);
    return ms > 0 ? Math.round(ms / 1000) : null;
  } catch {
    return null;
  }
}

/**
 * When this server first saw the song that is playing. Only the current song
 * is remembered: a different one replaces it. On a cold start it is simply
 * now, which is why a start from here is never called sure.
 */
let firstSeen: { key: string; at: number } | null = null;
function seenAt(key: string, now: number) {
  if (firstSeen?.key !== key) firstSeen = { key, at: now };
  return firstSeen.at;
}

/**
 * How far into the playing song he is. Last.fm dates a scrobble by when the
 * song started, so the song before this one ended at its start plus its
 * length, which is when this one began; and once this song has scrobbled
 * itself (halfway through), its own date is its start. Either is believed
 * only when it lands inside this song's length. Otherwise the start is when
 * this server first saw it playing, a lower bound, and says so.
 */
function timing(now: number, playing: RecentTrack, previous: RecentTrack | undefined, length: number | null, previousLength: number | null) {
  const seen = seenAt(recentKey(playing), now);
  const limit = (length ?? UNKNOWN_CAP) + GRACE;
  const starts: number[] = [];
  const prevAt = Number(previous?.date?.uts);
  if (previous && Number.isFinite(prevAt)) {
    if (recentKey(previous) === recentKey(playing)) starts.push(prevAt);
    if (previousLength) starts.push(prevAt + previousLength);
  }
  // A start a few seconds ahead is two clocks disagreeing; any further ahead is not this play.
  const fits = starts.filter((s) => s - now < 5 && now - s <= limit).map((s) => Math.min(s, now));
  if (fits.length) return { started: Math.max(...fits), sure: true };
  return { started: seen, sure: false };
}

/**
 * What he is listening to: the track scrobbling now (with how far into it he
 * is), the last one that finished, and the week: its play count, its
 * most-played artist, its ten most-played songs, each with the album art found
 * among the week's scrobbles, and its most unusual fact. Any failure,
 * including missing keys, is the empty shape with a 200 so the page shows
 * nothing rather than an error.
 */
export async function GET() {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;
  if (!key || !user) return NextResponse.json(EMPTY_NOW);
  try {
    // The week starts on the hour, so its URLs, and the cached answers, hold for an hour at a time.
    const from = Math.floor(Date.now() / 3_600_000) * 3600 - WEEK;
    const weekPage = (page: number) =>
      call<Recent>(key, { method: "user.getrecenttracks", user, limit: String(WEEK_SCROBBLES), from: String(from), page: String(page) }, FRESH.week);
    const [recent, week, top, artists] = await Promise.all([
      call<Recent>(key, { method: "user.getrecenttracks", user, limit: "1" }, FRESH.now),
      weekPage(1),
      call<{ toptracks?: { track?: TopTrackRaw | TopTrackRaw[] } }>(key, { method: "user.gettoptracks", user, period: "7day", limit: String(TOP_TRACKS) }, FRESH.week),
      call<{ topartists?: { artist?: TopArtistRaw | TopArtistRaw[] } }>(key, { method: "user.gettopartists", user, period: "7day", limit: "1" }, FRESH.week),
    ]);
    const latest = asArray(recent.recenttracks?.track);
    const playing = latest.find((t) => t["@attr"]?.nowplaying === "true");
    const finished = latest.find((t) => t.date?.uts);
    const now = Date.now() / 1000;

    // A heavy week runs to more pages; read a few more so the sentence is about the whole week.
    const pages = Math.min(WEEK_PAGES, Number(week.recenttracks?.["@attr"]?.totalPages) || 1);
    const more = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => weekPage(i + 2).catch(() => null))) : [];
    const scrobbles = [week, ...more].flatMap((p) => asArray(p?.recenttracks?.track)).filter((t) => t.date?.uts);

    // The newest scrobble of each song carries its album and art.
    const seen = new Map<string, RecentTrack>();
    scrobbles.forEach((t) => {
      const k = recentKey(t);
      if (!seen.has(k)) seen.set(k, t);
    });
    const tracks = asArray(top.toptracks?.track)
      .slice(0, TOP_TRACKS)
      .map((t) => {
        const s = seen.get(keyOf(t.artist.name, t.name));
        return { title: t.name, artist: t.artist.name, album: s?.album["#text"] || null, coverId: s ? coverId(s.image) : null, url: t.url ?? null, plays: Number(t.playcount) || 0 };
      });

    let nowPlaying: Playing | null = null;
    if (playing) {
      const sameAsFinished = finished && recentKey(finished) === recentKey(playing);
      const [length, previousLength] = await Promise.all([
        lengthOf(key, playing),
        finished && !sameAsFinished ? lengthOf(key, finished) : Promise.resolve(null),
      ]);
      const { started, sure } = timing(now, playing, finished, length, sameAsFinished ? length : previousLength);
      const elapsed = Math.max(0, now - started);
      // A scrobbler can leave "now playing" up long after the song; past its end and a minute, it is not.
      const stale = elapsed > (length ?? UNKNOWN_CAP) + GRACE;
      if (!stale) nowPlaying = { ...track(playing), length, elapsed: Math.round(elapsed), sure };
    }

    const total = Number(week.recenttracks?.["@attr"]?.total);
    const plays = Number.isFinite(total) ? total : tracks.reduce((n, t) => n + t.plays, 0);
    const artist = asArray(artists.topartists?.artist)[0]?.name ?? null;
    const list: Scrobble[] = scrobbles.map((t) => ({ title: t.name, artist: t.artist["#text"], at: Number(t.date!.uts) }));
    const body: NowResponse = {
      now: nowPlaying,
      last: finished ? { ...track(finished), at: Number(finished.date!.uts) } : null,
      week: {
        plays,
        artist,
        tracks,
        fact: weekFact({ scrobbles: list, total: plays, artist, now, timeZone: TIME_ZONE, playing: !!nowPlaying }),
      },
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(EMPTY_NOW);
  }
}
