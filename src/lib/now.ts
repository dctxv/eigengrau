/**
 * What he is listening to, as /api/now reports it: the track scrobbling now,
 * the last one that finished, and the week (plays, most-played artist, the
 * ten most-played songs). Shared by the route handler and the Music panel,
 * which polls it while the page is visible.
 */
export type Track = { title: string; artist: string; album: string | null; coverId: string | null; url: string | null };
export type Played = Track & { at: number };
export type WeekTrack = Track & { plays: number };
export type Week = { plays: number; artist: string | null; tracks: WeekTrack[] };
export type NowResponse = { now: Track | null; last: Played | null; week: Week };

export const EMPTY_NOW: NowResponse = { now: null, last: null, week: { plays: 0, artist: null, tracks: [] } };

/** GET /api/now. Any failure is the empty shape, so the page shows nothing rather than an error. */
export async function fetchNow(signal?: AbortSignal): Promise<NowResponse> {
  try {
    const res = await fetch("/api/now", { signal, cache: "no-store" });
    if (!res.ok) return EMPTY_NOW;
    const body = (await res.json()) as Partial<NowResponse>;
    const week = body.week;
    return {
      now: body.now ?? null,
      last: body.last ?? null,
      week: {
        plays: typeof week?.plays === "number" ? week.plays : 0,
        artist: week?.artist ?? null,
        tracks: Array.isArray(week?.tracks) ? week.tracks : [],
      },
    };
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
