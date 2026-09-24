import { NextResponse } from "next/server";
import { EMPTY_NOW, type NowResponse, type Track } from "@/lib/now";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://ws.audioscrobbler.com/2.0/";
/** Last.fm's "no art" image, which it serves under a fixed hash. */
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
const WEEK = 7 * 24 * 3600;
const TOP_TRACKS = 10;
/** The week's scrobbles read for art: a top track's own image is almost always the placeholder. */
const WEEK_SCROBBLES = 200;
/** Seconds each answer is cached: what is playing moves fast, the week's charts do not. */
const FRESH = { now: 60, week: 300 };

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
type Recent = { recenttracks?: { track?: RecentTrack | RecentTrack[]; "@attr"?: { total?: string } } };
type TopTrackRaw = { name: string; url?: string; playcount: string; artist: { name: string } };
type TopArtistRaw = { name: string };

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

function track(t: RecentTrack): Track {
  return { title: t.name, artist: t.artist["#text"], album: t.album["#text"] || null, coverId: coverId(t.image), url: t.url ?? null };
}

async function call<T>(key: string, params: Record<string, string>, revalidate: number): Promise<T> {
  const q = new URLSearchParams({ ...params, api_key: key, format: "json" });
  const res = await fetch(`${API}?${q}`, { next: { revalidate } });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/**
 * What he is listening to: the track scrobbling now, the last one that
 * finished, and the week: its play count, its most-played artist and its ten
 * most-played songs, each with the album art found among the week's
 * scrobbles. Any failure, including missing keys, is the empty shape with a
 * 200 so the page shows nothing rather than an error.
 */
export async function GET() {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;
  if (!key || !user) return NextResponse.json(EMPTY_NOW);
  try {
    // The week starts on the hour, so its URL, and the cached answer, hold for an hour at a time.
    const from = Math.floor(Date.now() / 3_600_000) * 3600 - WEEK;
    const [recent, week, top, artists] = await Promise.all([
      call<Recent>(key, { method: "user.getrecenttracks", user, limit: "1" }, FRESH.now),
      call<Recent>(key, { method: "user.getrecenttracks", user, limit: String(WEEK_SCROBBLES), from: String(from) }, FRESH.week),
      call<{ toptracks?: { track?: TopTrackRaw | TopTrackRaw[] } }>(key, { method: "user.gettoptracks", user, period: "7day", limit: String(TOP_TRACKS) }, FRESH.week),
      call<{ topartists?: { artist?: TopArtistRaw | TopArtistRaw[] } }>(key, { method: "user.gettopartists", user, period: "7day", limit: "1" }, FRESH.week),
    ]);
    const latest = asArray(recent.recenttracks?.track);
    const playing = latest.find((t) => t["@attr"]?.nowplaying === "true");
    const finished = latest.find((t) => t.date?.uts);
    // The newest scrobble of each song carries its album and art.
    const scrobbles = asArray(week.recenttracks?.track);
    const seen = new Map<string, RecentTrack>();
    scrobbles.forEach((t) => {
      const k = keyOf(t.artist["#text"], t.name);
      if (!seen.has(k)) seen.set(k, t);
    });
    const tracks = asArray(top.toptracks?.track)
      .slice(0, TOP_TRACKS)
      .map((t) => {
        const s = seen.get(keyOf(t.artist.name, t.name));
        return { title: t.name, artist: t.artist.name, album: s?.album["#text"] || null, coverId: s ? coverId(s.image) : null, url: t.url ?? null, plays: Number(t.playcount) || 0 };
      });
    const total = Number(week.recenttracks?.["@attr"]?.total);
    const body: NowResponse = {
      now: playing ? track(playing) : null,
      last: finished ? { ...track(finished), at: Number(finished.date!.uts) } : null,
      week: {
        plays: Number.isFinite(total) ? total : tracks.reduce((n, t) => n + t.plays, 0),
        artist: asArray(artists.topartists?.artist)[0]?.name ?? null,
        tracks,
      },
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(EMPTY_NOW);
  }
}
