import type { NextRequest } from "next/server";
import { findSong, MAX_PARAM, onHost, PREVIEW_HOSTS } from "../songs";

export const runtime = "nodejs";

const DAY = 86400;
/** A song no store lists yet is asked about again after this long: new releases fill in within hours. */
const MISS = 3600;
/** How long the preview may take to start: until its headers arrive, since its body then streams at its own pace. */
const AUDIO_MS = 10_000;

const silence = (cache: boolean) =>
  new Response(null, { status: 404, headers: { "Cache-Control": cache ? `public, max-age=${MISS}` : "no-store" } });

/**
 * A song's 30-second preview, found on the keyless stores by artist and title
 * (Apple's iTunes Search API, then Deezer's: see songs.ts) and proxied
 * same-origin, so the site's AudioContext may filter it (through the wall).
 * Only a confident match plays: no match is a 404, because a wrong song
 * through the wall is worse than none, kept an hour, as a song too new for
 * the stores is soon listed. The store's page for the track rides along in
 * X-Preview-Link, for the attribution under the sleeve. A preview is cached
 * for a day. A store taking too long, or the visitor moving off the title,
 * ends the request (and the download) in a silence that is not cached, so
 * the next rest on the title asks again.
 */
export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
  if (!artist || !title || artist.length > MAX_PARAM || title.length > MAX_PARAM) return silence(true);
  try {
    const pick = await findSong(artist, title, "preview", req.signal);
    if (req.signal.aborted) return silence(false);
    if (!pick?.preview) return silence(true);
    const late = new AbortController();
    const timer = setTimeout(() => late.abort(new DOMException("The preview took too long to start", "TimeoutError")), AUDIO_MS);
    // Apple's preview URLs hold, so the file is kept a day; Deezer's are signed to expire, so each is fetched as it comes.
    const audio = await fetch(onHost(pick.preview, PREVIEW_HOSTS)!, {
      ...(pick.from === "apple" ? { next: { revalidate: DAY } } : { cache: "no-store" as const }),
      signal: AbortSignal.any([req.signal, late.signal]),
    }).finally(() => clearTimeout(timer));
    if (!audio.ok || !audio.body) return silence(false);
    const headers = new Headers({
      "Content-Type": audio.headers.get("content-type") ?? "audio/mp4",
      "Cache-Control": `public, max-age=${DAY}`,
    });
    const length = audio.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    if (pick.link) headers.set("X-Preview-Link", pick.link);
    return new Response(audio.body, { headers });
  } catch {
    // A network failure, a TimeoutError or the visitor's AbortError: none of them is the stores' answer.
    return silence(false);
  }
}
