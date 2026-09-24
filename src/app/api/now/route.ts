import { NextResponse } from "next/server";
import type { NowResponse } from "@/lib/now";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://ws.audioscrobbler.com/2.0/";
/** Last.fm's "no art" image, which it serves under a fixed hash. */
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
const TOP_LIMIT = 5;

type Image = { size: string; "#text": string };
type RecentTrack = {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  image?: Image[];
  "@attr"?: { nowplaying?: string };
};
type TopAlbumRaw = {
  name: string;
  mbid?: string;
  url?: string;
  playcount: string;
  artist: { name: string };
  image?: Image[];
};

const EMPTY: NowResponse = { now: null, top: [] };

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

async function call<T>(key: string, params: Record<string, string>): Promise<T> {
  const q = new URLSearchParams({ ...params, api_key: key, format: "json" });
  const res = await fetch(`${API}?${q}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/**
 * What he is listening to: the scrobbling track, if any, and the week's five
 * most-played albums. Any failure, including missing keys, is the empty shape
 * with a 200 so the page shows nothing rather than an error.
 */
export async function GET() {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;
  if (!key || !user) return NextResponse.json(EMPTY);
  try {
    const [recent, top] = await Promise.all([
      call<{ recenttracks?: { track?: RecentTrack | RecentTrack[] } }>(key, { method: "user.getrecenttracks", user, limit: "1" }),
      call<{ topalbums?: { album?: TopAlbumRaw | TopAlbumRaw[] } }>(key, { method: "user.gettopalbums", user, period: "7day", limit: String(TOP_LIMIT) }),
    ]);
    const track = asArray(recent.recenttracks?.track).find((t) => t["@attr"]?.nowplaying === "true");
    const body: NowResponse = {
      now: track
        ? { title: track.name, artist: track.artist["#text"], album: track.album["#text"], coverId: coverId(track.image) }
        : null,
      top: asArray(top.topalbums?.album)
        .slice(0, TOP_LIMIT)
        .map((a) => ({
          id: a.mbid || a.url || `${a.artist.name} ${a.name}`,
          album: a.name,
          artist: a.artist.name,
          playcount: Number(a.playcount) || 0,
          coverId: coverId(a.image),
        })),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(EMPTY);
  }
}
