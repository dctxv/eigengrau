/**
 * What he is listening to, as /api/now reports it: the scrobbling track, if
 * any, and the week's most-played albums. Shared by the route handler and the
 * Space panel, which polls it while the page is visible.
 */
export type NowPlaying = { title: string; artist: string; album: string; coverId: string | null };
export type TopAlbum = { id: string; album: string; artist: string; playcount: number; coverId: string | null };
export type NowResponse = { now: NowPlaying | null; top: TopAlbum[] };

export const EMPTY_NOW: NowResponse = { now: null, top: [] };

/** GET /api/now. Any failure is the empty shape, so the page shows nothing rather than an error. */
export async function fetchNow(signal?: AbortSignal): Promise<NowResponse> {
  try {
    const res = await fetch("/api/now", { signal, cache: "no-store" });
    if (!res.ok) return EMPTY_NOW;
    const body = (await res.json()) as Partial<NowResponse>;
    return { now: body.now ?? null, top: Array.isArray(body.top) ? body.top : [] };
  } catch {
    return EMPTY_NOW;
  }
}

/**
 * Polls /api/now every `everyMs` while the document is visible: once on
 * start, then on the interval, and again when a hidden tab comes back.
 * Returns the stop function.
 */
export function pollNow(onData: (r: NowResponse) => void, everyMs = 60_000): () => void {
  let timer: number | null = null;
  let controller: AbortController | null = null;
  let stopped = false;
  const tick = async () => {
    controller?.abort();
    const mine = (controller = new AbortController());
    const r = await fetchNow(mine.signal);
    if (!stopped && controller === mine && !mine.signal.aborted) onData(r);
  };
  const start = () => {
    if (timer !== null) return;
    void tick();
    timer = window.setInterval(() => void tick(), everyMs);
  };
  const pause = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };
  const onVis = () => (document.visibilityState === "visible" ? start() : pause());
  document.addEventListener("visibilitychange", onVis);
  onVis();
  return () => {
    stopped = true;
    pause();
    controller?.abort();
    document.removeEventListener("visibilitychange", onVis);
  };
}
