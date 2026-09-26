/**
 * What he is listening to, as /api/now reports it: the track scrobbling now,
 * the last one that finished, and the week (plays, most-played artist, the
 * ten most-played songs, and the week's one honest sentence). Shared by the
 * route handler and the Music panel, which polls it while the page is visible.
 */
import { countWord } from "@/content/site";

export type Track = { title: string; artist: string; album: string | null; coverId: string | null; url: string | null };
/**
 * The track playing now, with what is known of how far into it he is. All
 * three are optional so an older answer still reads as a plain Track.
 */
export type Playing = Track & {
  /** The song's length in seconds, from Last.fm's track.getInfo; null when Last.fm does not know it. */
  length?: number | null;
  /** Seconds into the song when the answer was made. */
  elapsed?: number | null;
  /**
   * True when the start came from the scrobbles (the previous song's start
   * plus its length); false when it is only when the server first saw this
   * song playing, which is a lower bound and is drawn as one.
   */
  sure?: boolean;
};
export type Played = Track & { at: number };
export type WeekTrack = Track & { plays: number };
export type Week = {
  plays: number;
  artist: string | null;
  tracks: WeekTrack[];
  /** The week's single most unusual fact, in his voice ("Holocene eleven times, nine of them on Tuesday."). */
  fact?: string;
};
export type NowResponse = { now: Playing | null; last: Played | null; week: Week };

export const EMPTY_NOW: NowResponse = { now: null, last: null, week: { plays: 0, artist: null, tracks: [] } };

/** A week of listening runs past twelve: counts here use site.ts's countWord ("Sixty-two plays"). */
export { countWord };

/**
 * The plain line, and the week's heading when nothing stands out: "Sixty-two
 * plays this week. Mostly Bon Iver." The heading never shouts, so an artist
 * whose name carries an exclamation mark is left out of it.
 */
export function plainFact(plays: number, artist: string | null): string {
  const mostly = plays > 0 && artist && !artist.includes("!") ? ` Mostly ${artist}.` : "";
  return `${countWord(plays)} play${plays === 1 ? "" : "s"} this week.${mostly}`;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** GET /api/now. Any failure is the empty shape, so the page shows nothing rather than an error. */
export async function fetchNow(signal?: AbortSignal): Promise<NowResponse> {
  try {
    const res = await fetch("/api/now", { signal, cache: "no-store" });
    if (!res.ok) return EMPTY_NOW;
    const body = (await res.json()) as Partial<NowResponse>;
    const week = body.week;
    const now = body.now ?? null;
    return {
      now: now && { ...now, length: num(now.length), elapsed: num(now.elapsed), sure: now.sure === true },
      last: body.last ?? null,
      week: {
        plays: typeof week?.plays === "number" ? week.plays : 0,
        artist: week?.artist ?? null,
        tracks: Array.isArray(week?.tracks) ? week.tracks : [],
        ...(typeof week?.fact === "string" && week.fact ? { fact: week.fact } : {}),
      },
    };
  } catch {
    return EMPTY_NOW;
  }
}

/**
 * Polls /api/now while the document is visible: once on start, then again
 * after `every` ms, and at once when a hidden tab comes back. `every` may be a
 * function of the last answer, so a page can listen closer while he is
 * playing something. Returns the stop function.
 */
export function pollNow(onData: (r: NowResponse) => void, every: number | ((r: NowResponse) => number) = 60_000): () => void {
  let timer: number | null = null;
  let controller: AbortController | null = null;
  let running = false;
  let stopped = false;
  const tick = async () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    controller?.abort();
    const mine = (controller = new AbortController());
    const r = await fetchNow(mine.signal);
    if (stopped || controller !== mine || mine.signal.aborted) return;
    onData(r);
    if (running) timer = window.setTimeout(() => void tick(), typeof every === "number" ? every : every(r));
  };
  const start = () => {
    if (running) return;
    running = true;
    void tick();
  };
  const pause = () => {
    running = false;
    if (timer !== null) window.clearTimeout(timer);
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
