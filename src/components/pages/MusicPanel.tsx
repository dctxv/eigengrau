"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { numberWord } from "@/content/site";
import { sfx, type Preview } from "@/audio/sfx";
import { CursorLabel } from "@/components/CursorLabel";
import { setFlag } from "@/lib/flags";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { pollNow, type NowResponse, type Playing, type Track, type WeekTrack } from "@/lib/now";

/** The quietest song's opacity: the less it was played, the closer it sits to eigengrau. */
const QUIETEST = 0.28;
/** The stack never shrinks below this share of its size to fit a short window. */
const MIN_FIT = 0.55;
const PHONE = 640;
/** Room kept under the stack on a desktop window: the bottom inset and a breath. */
const FOOT = 64;
/** While he is playing something the page asks more often, so the next song arrives on time. */
const POLL = { live: 20_000, quiet: 60_000 };
/** The state line ("About two minutes in.") is rewritten this often, and never shows seconds. */
const STATE_EVERY = 30_000;
/** Resting on a title this long plays it through the wall. */
const DWELL_MS = 600;
/** The stack's lines leave before the sleeve moves to the middle of the room. */
const FOLD_MS = 560;
/** The sleeve's glide between the week and the room, and how long the words under it wait for it. */
const GLIDE = 0.9;
const AFTER_GLIDE = 0.45;

/** Once per visit, the first hover with sound off says so instead of naming Last.fm. */
let toldSoundOff = false;
function firstSoundOffHover() {
  if (toldSoundOff) return false;
  toldSoundOff = true;
  return true;
}

const keyOf = (t: Track) => `${t.artist}\u0000${t.title}`;
const cover = (id: string) => `/api/cover/${id}`;
const plays = (n: number) => `${numberWord(n)} play${n === 1 ? "" : "s"}`;
const minutes = (n: number) => (n === 1 ? "a minute" : `${numberWord(n).toLowerCase()} minutes`);

/** A guest credit in brackets leaves the title for the stack; the full title stays in the link's name. */
function short(title: string) {
  return title.replace(/\s*[([](?:feat\.?|ft\.?|with)\s[^)\]]*[)\]]\s*$/i, "") || title;
}

/** How long ago `at` (unix seconds) was, seen from `now`. */
function ago(at: number, now: number) {
  const m = Math.round(Math.max(0, now - at) / 60);
  if (m < 1) return "just now";
  if (m < 60) return m === 1 ? "a minute ago" : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** When the song playing began, on this page's clock, and how much of that is known. */
type Timing = { key: string; start: number; sure: boolean; length: number | null };

/**
 * The server says how far in he is; this turns it into a start on the page's
 * own clock, so the two clocks never need to agree. A start the server only
 * guessed (when it first saw the song) keeps the earliest guess, since a
 * restarted server forgets; a sure one holds still unless it really moved.
 */
function timingOf(now: Playing | null, at: number, before: Timing | null): Timing | null {
  if (!now || typeof now.elapsed !== "number") return null;
  const key = keyOf(now);
  const sure = now.sure === true;
  let start = at - now.elapsed;
  if (before?.key === key && before.sure === sure) {
    if (!sure) start = Math.min(start, before.start);
    else if (Math.abs(start - before.start) < 3) start = before.start;
  }
  return { key, start, sure, length: now.length ?? null };
}

/**
 * The honest state line. With a start from the scrobbles, roughly how far in;
 * with only a first sighting, a lower bound; never seconds.
 */
function whereIn(t: Timing, now: number): string {
  const e = Math.max(0, now - t.start);
  if (!t.sure) return e < 60 ? "Not sure how far in." : `At least ${minutes(Math.floor(e / 60))} in.`;
  if (t.length && t.length - e <= 30) return "Nearly over.";
  if (e < 45) return "Just started.";
  return `About ${minutes(Math.max(1, Math.round(e / 60)))} in.`;
}

/** The plain line, for an answer that came without its sentence. */
const plainFact = (plays: number, artist: string | null) =>
  `${numberWord(plays)} play${plays === 1 ? "" : "s"} this week.${plays > 0 && artist ? ` Mostly ${artist}.` : ""}`;

type Latest = { data: NowResponse; at: number; timing: Timing | null };
type Shown = { mode: "now" | "last" | "song" | "quiet"; track: Track | null; state: string };
/** A song coming through the wall: which one, where Apple keeps it, how long it runs, and whether the door is closing. */
type Hearing = { key: string; link: string | null; duration: number; n: number; closing: boolean };
/** A new song while he is live: the old sleeve drops out and the new one rises. */
type Swap = { from: string | null; to: string | null; n: number };
type Place = { x: number; y: number; w: number };

/**
 * Music: plain DOM inside the sliding panel, like Notes. When he is listening
 * right now, the page is that moment: the sleeve alone in the middle, how far
 * into the song he is, and the week folded into its heading, which is a
 * button that brings the stack back. When he is not, it is the week: a sleeve
 * for what played last, and beside it the ten most-played songs in one stack,
 * each as loud as it was played. The heading is the week's one honest
 * sentence. With sound on, resting on a title plays it from the next room.
 */
export function MusicPanel() {
  const stage = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const coverBox = useRef<HTMLDivElement>(null);
  const sleeve = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLElement>(null);
  const listenLine = useRef<HTMLElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const cursor = useRef<CursorLabel | null>(null);

  /** The latest answer, when it arrived (unix seconds, which "a minute ago" is measured from), and its timing. */
  const [latest, setLatest] = useState<Latest | null>(null);
  const [active, setActive] = useState<string | null>(null);
  /** The room layout (live, the stack folded) as drawn; it follows the target once the stack has left. */
  const [room, setRoom] = useState(false);
  const [folding, setFolding] = useState(false);
  const [glided, setGlided] = useState(false);
  const [clock, setClock] = useState(0);
  const [hearing, setHearing] = useState<Hearing | null>(null);
  const [swap, setSwap] = useState<Swap | null>(null);
  /** The panel only mounts in the browser, so the preference can be read on the first render. */
  const [reduced] = useState(prefersReducedMotion);

  /** The visitor unfolded the week while he is live. */
  const openRef = useRef(false);
  const liveRef = useRef(false);
  /** The layout being headed for, which may be ahead of `room` while the stack leaves. */
  const targetRef = useRef(false);
  const foldTimer = useRef<number | null>(null);
  const firstPlace = useRef<Place | null>(null);
  const timingRef = useRef<Timing | null>(null);
  const liveCover = useRef<{ key: string | null; cover: string | null }>({ key: null, cover: null });
  const dwell = useRef<number | null>(null);
  const asking = useRef<AbortController | null>(null);
  const voice = useRef<Preview | null>(null);
  const heardN = useRef(0);
  const touch = useRef(false);
  const armed = useRef<string | null>(null);
  const pinned = useRef(false);

  /** The cover's place in the scrolled content, which does not move when the page scrolls. */
  const measure = useCallback((): Place | null => {
    const el = coverBox.current;
    const sc = scroll.current;
    if (!el || !sc) return null;
    const r = el.getBoundingClientRect();
    const o = sc.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top + sc.scrollTop, w: r.width };
  }, []);

  /**
   * Turns the page to the room (true) or the week. Into the room, the stack's
   * lines leave first and then the sleeve glides to the middle; back to the
   * week, the sleeve glides home and the stack rises. `animate` is off for the
   * first answer and under reduced motion.
   */
  const go = useCallback(
    (toRoom: boolean, animate: boolean) => {
      if (toRoom === targetRef.current) return;
      targetRef.current = toRoom;
      if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
      foldTimer.current = null;
      const commit = () => {
        foldTimer.current = null;
        firstPlace.current = animate ? measure() : null;
        setGlided(animate);
        setFolding(false);
        setRoom(toRoom);
      };
      if (toRoom && animate && list.current) {
        setFolding(true);
        foldTimer.current = window.setTimeout(commit, FOLD_MS);
      } else commit();
    },
    [measure],
  );

  // ---------------------------------------------------------------- the song through the wall

  /** Leave: the door closes over 1.2s and the song goes back into the bed. */
  const hush = useCallback(() => {
    if (dwell.current !== null) window.clearTimeout(dwell.current);
    dwell.current = null;
    asking.current?.abort();
    asking.current = null;
    if (voice.current) {
      voice.current.stop();
      setHearing((h) => (h ? { ...h, closing: true } : h));
    }
  }, []);

  const listen = useCallback((t: WeekTrack) => {
    const controller = new AbortController();
    asking.current?.abort();
    asking.current = controller;
    const url = `/api/preview?${new URLSearchParams({ artist: t.artist, title: t.title })}`;
    void sfx.preview(url, controller.signal).then((v) => {
      if (!v) return;
      if (controller.signal.aborted || asking.current !== controller) {
        v.stop();
        return;
      }
      asking.current = null;
      voice.current = v;
      const n = ++heardN.current;
      setHearing({ key: keyOf(t), link: v.link, duration: v.duration, n, closing: false });
      void v.ended.then(() => {
        if (voice.current === v) voice.current = null;
        // Resting on the attribution keeps it until the pointer leaves it.
        if (!pinned.current) setHearing((h) => (h?.n === n ? null : h));
      });
    });
  }, []);

  useEffect(() => {
    setFlag("pageReady", true);
    cursor.current = new CursorLabel(label.current!, stage.current!);
    let first = true;
    const stop = pollNow(
      (data) => {
        const at = Date.now() / 1000;
        const timing = timingOf(data.now, at, timingRef.current);
        timingRef.current = timing;
        // A new song while he is live: the old sleeve drops out and the next one rises.
        const key = data.now ? keyOf(data.now) : null;
        const was = liveCover.current;
        if (!first && key && was.key && key !== was.key) setSwap({ from: was.cover, to: data.now!.coverId, n: at });
        liveCover.current = { key, cover: data.now?.coverId ?? null };
        liveRef.current = !!data.now;
        setLatest({ data, at, timing });
        setClock(at);
        go(!!data.now && !openRef.current, !first && !reduced);
        first = false;
      },
      (r) => (r.now ? POLL.live : POLL.quiet),
    );
    return () => {
      stop();
      if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      asking.current?.abort();
      voice.current?.stop();
      cursor.current?.destroy();
      cursor.current = null;
    };
  }, [go, reduced]);

  const data = latest?.data ?? null;
  const live = !!data?.now;
  const timing = latest?.timing ?? null;
  const tracks = data?.week.tracks ?? [];
  const loudest = Math.max(1, ...tracks.map((t) => t.plays));
  const stackKey = tracks.map((t) => `${keyOf(t)}:${t.plays}`).join("|");
  const fact = data ? (data.week.fact ?? plainFact(data.week.plays, data.week.artist)) : "";

  // The state line is rewritten every 30s while he is live.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setClock(Date.now() / 1000), STATE_EVERY);
    return () => window.clearInterval(id);
  }, [live]);

  // On a desktop window the stack fits the room under the heading; a phone simply scrolls.
  useLayoutEffect(() => {
    const scrollEl = scroll.current;
    const listEl = list.current;
    if (!scrollEl || !listEl) return;
    let alive = true;
    const fit = () => {
      listEl.style.setProperty("--vol-fit", "1");
      if (window.innerWidth <= PHONE) return;
      const top = listEl.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
      const room = scrollEl.clientHeight - top - FOOT;
      const natural = listEl.offsetHeight;
      if (natural > room) listEl.style.setProperty("--vol-fit", String(Math.max(MIN_FIT, room / natural)));
    };
    fit();
    document.fonts?.ready.then(() => alive && fit());
    window.addEventListener("resize", fit);
    return () => {
      alive = false;
      window.removeEventListener("resize", fit);
    };
  }, [stackKey, room]);

  // The sleeve glides between its two places: from where it was drawn to where it is now.
  useLayoutEffect(() => {
    const first = firstPlace.current;
    firstPlace.current = null;
    const el = coverBox.current;
    const last = measure();
    if (!first || !el || !last || !last.w) return;
    const tween = gsap.fromTo(
      el,
      { x: first.x - last.x, y: first.y - last.y, scale: first.w / last.w, transformOrigin: "0 0" },
      { x: 0, y: 0, scale: 1, duration: GLIDE, ease: EASE.slide, clearProps: "transform" },
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [room, measure]);

  // A new song: the old sleeve drops out through the sleeve's edge and the next one rises in.
  useLayoutEffect(() => {
    const box = sleeve.current;
    if (!swap || !box || reduced || swap.from === swap.to) return;
    const img = (id: string | null) => (id ? box.querySelector<HTMLImageElement>(`img[data-id="${id}"]`) : null);
    const out = img(swap.from);
    const next = img(swap.to);
    // Only when the sleeve is showing the new song: a hovered one keeps the sleeve to itself.
    const onShow = box.querySelector("img[data-on]");
    if (onShow && onShow !== next) return;
    const tl = gsap.timeline();
    if (out) {
      tl.set(out, { transition: "none", opacity: 1, zIndex: 1 });
      tl.to(out, { yPercent: 100, duration: 0.5, ease: "power2.in" }, 0);
      tl.set(out, { opacity: 0 });
    }
    if (next) tl.fromTo(next, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: EASE.reveal }, out ? 0.35 : 0);
    const els = [out, next].filter((e): e is HTMLImageElement => !!e);
    tl.eventCallback("onComplete", () => {
      gsap.set(els, { clearProps: "transform,opacity,transition,zIndex" });
    });
    return () => {
      tl.kill();
      gsap.set(els, { clearProps: "transform,opacity,transition,zIndex" });
    };
  }, [swap, reduced]);

  const song = tracks.find((t) => keyOf(t) === (active ?? hearing?.key)) ?? null;
  const heard = song && hearing?.key === keyOf(song) ? hearing : null;
  const shown: Shown = song
    ? { mode: "song", track: song, state: heard ? "Preview from Apple Music" : `${plays(song.plays)} this week` }
    : data?.now
      ? { mode: "now", track: data.now, state: "Now playing" }
      : data?.last && latest
        ? { mode: "last", track: data.last, state: `Last played, ${ago(data.last.at, latest.at)}` }
        : { mode: "quiet", track: null, state: "Quiet" };
  const covers = [...new Set([data?.now?.coverId, data?.last?.coverId, ...tracks.map((t) => t.coverId)].filter((id): id is string => !!id))];
  const nowKey = `${room ? "room" : "week"}:${shown.mode}:${shown.track ? keyOf(shown.track) : ""}`;
  const showTiming = shown.mode === "now" && timing && timing.key === keyOf(shown.track!) ? timing : null;
  const seen = Math.max(clock, latest?.at ?? 0);
  const where = showTiming ? whereIn(showTiming, seen) : null;

  // The hairline crawls over the song's length from where he is now; reduced motion steps it with the state line.
  // It is clipped rather than scaled (--p), so a dotted line keeps its dots.
  const tKey = showTiming?.key ?? null;
  const tStart = showTiming?.start ?? 0;
  const tLength = showTiming?.length ?? 0;
  useEffect(() => {
    const el = progress.current;
    if (!el || !tKey || !tLength) return;
    const f = Math.min(1, Math.max(0, (Date.now() / 1000 - tStart) / tLength));
    if (reduced) {
      gsap.set(el, { "--p": f });
      return;
    }
    const tween = gsap.fromTo(el, { "--p": f }, { "--p": 1, duration: (1 - f) * tLength, ease: "none" });
    return () => {
      tween.kill();
    };
  }, [tKey, tStart, tLength, nowKey, clock, reduced]);

  // A line runs along the sleeve's bottom edge for the preview's length.
  const hearN = hearing && !hearing.closing ? hearing.n : 0;
  const hearFor = hearing?.duration ?? 0;
  useEffect(() => {
    const el = listenLine.current;
    if (!el || !hearN) return;
    if (reduced) {
      gsap.set(el, { scaleX: 1 });
      return;
    }
    const tween = gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: hearFor, ease: "none" });
    return () => {
      tween.kill();
    };
  }, [hearN, hearFor, reduced]);

  const enter = (t: WeekTrack, viaTouch: boolean) => {
    const key = keyOf(t);
    if (key !== active) hush();
    setActive(key);
    setGlided(false);
    cursor.current?.set(!sfx.enabled && !viaTouch && firstSoundOffHover() ? "Sound is off" : "Last.fm");
    if (sfx.enabled && !viaTouch && hearing?.key !== key) {
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      dwell.current = window.setTimeout(() => {
        dwell.current = null;
        listen(t);
      }, DWELL_MS);
    }
  };
  const leave = () => {
    setActive(null);
    setGlided(false);
    cursor.current?.set(null);
    armed.current = null;
    hush();
  };
  /** A phone's first tap on a title plays it through the wall (sound on); the second opens Last.fm as before. */
  const tap = (e: MouseEvent, t: WeekTrack) => {
    if (e.detail === 0 || !touch.current || !sfx.enabled) return;
    const key = keyOf(t);
    if (armed.current === key) return;
    e.preventDefault();
    hush();
    armed.current = key;
    setActive(key);
    listen(t);
  };
  const down = (e: PointerEvent) => {
    touch.current = e.pointerType === "touch";
    if (touch.current && active && !(e.target as Element).closest(".music-list a, .music-state a")) leave();
  };

  const fold = () => {
    openRef.current = targetRef.current;
    sfx.play(openRef.current ? "close" : "focus");
    cursor.current?.set(openRef.current ? "Now playing" : "The week");
    go(liveRef.current && !openRef.current, !reduced);
  };

  return (
    <section ref={stage} className="stage stage-music" onPointerDown={down}>
      <div ref={scroll} className="music-scroll">
        {data && (
          <div className="music" data-room={room ? "" : undefined} data-folding={folding ? "" : undefined} style={{ "--after": glided ? `${AFTER_GLIDE}s` : "0s" } as CSSProperties}>
            <p className="music-heading mask" key={fact}>
              <span>
                {live ? (
                  <button
                    type="button"
                    className="music-fold"
                    aria-expanded={!room}
                    aria-controls={room ? undefined : "music-week"}
                    onClick={fold}
                    onPointerEnter={() => cursor.current?.set(room ? "The week" : "Now playing")}
                    onPointerLeave={() => cursor.current?.set(null)}
                  >
                    <span className="music-lead">Music</span>
                    <span className="music-fact">{fact}</span>
                    <span className="sr-only">{room ? " Show the week's songs." : " Fold the week away."}</span>
                  </button>
                ) : (
                  <>
                    <span className="music-lead">Music</span>
                    {fact}
                  </>
                )}
              </span>
            </p>

            <div className="music-body">
              <div className="music-side">
                <div ref={coverBox} className="music-cover">
                  <div ref={sleeve} className="music-sleeve" aria-hidden="true">
                    {covers.map((id) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={id}
                        src={cover(id)}
                        alt=""
                        data-id={id}
                        data-on={id === shown.track?.coverId ? "" : undefined}
                        onLoad={(e) => e.currentTarget.setAttribute("data-loaded", "")}
                      />
                    ))}
                  </div>
                  <i ref={listenLine} className="music-listen" data-on={hearN ? "" : undefined} aria-hidden="true" />
                </div>
                {/* Keyed by what it names, so a new track rises in; the "ago" ticks over in place. */}
                <div className="music-now" key={nowKey}>
                  {showTiming && (
                    <div className="music-progress" data-guess={showTiming.sure ? undefined : ""} data-unknown={showTiming.length ? undefined : ""} aria-hidden="true">
                      <i ref={progress} />
                    </div>
                  )}
                  <div className="music-meta">
                    <p className="music-state mask" key={shown.state}>
                      <span>
                        {shown.mode !== "song" && <i className="music-dot" data-still={shown.mode === "now" ? undefined : ""} aria-hidden="true" />}
                        {heard?.link ? (
                          <a
                            href={heard.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onPointerEnter={() => (pinned.current = true)}
                            onPointerLeave={() => {
                              pinned.current = false;
                              if (!voice.current) setHearing(null);
                            }}
                          >
                            {shown.state}
                          </a>
                        ) : (
                          shown.state
                        )}
                      </span>
                    </p>
                    {where && (
                      <p className="music-where mask" key={where}>
                        <span>{where}</span>
                      </p>
                    )}
                  </div>
                  {shown.track && (
                    <>
                      <p className="music-title mask">
                        <span>{shown.track.title}</span>
                      </p>
                      <p className="music-by mask">
                        <span>{[shown.track.artist, shown.track.album].filter(Boolean).join(", ")}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!room && (
                <ol
                  ref={list}
                  id="music-week"
                  className="music-list"
                  data-active={song ? "" : undefined}
                  data-leaving={folding ? "" : undefined}
                  onPointerLeave={(e) => e.pointerType !== "touch" && leave()}
                  aria-label="Most played this week"
                >
                  {tracks.map((t, i) => {
                    const k = t.plays / loudest;
                    const style = { "--k": k, "--level": QUIETEST + (1 - QUIETEST) * k, "--d": `${0.15 + i * 0.05}s`, "--i": i } as CSSProperties;
                    return (
                      <li key={keyOf(t)} style={style}>
                        <a
                          href={t.url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-on={keyOf(t) === (active ?? hearing?.key) ? "" : undefined}
                          data-hearing={hearing && !hearing.closing && hearing.key === keyOf(t) ? "" : undefined}
                          aria-label={`${t.title}, ${t.artist}, ${plays(t.plays).toLowerCase()} this week`}
                          onPointerEnter={(e) => enter(t, e.pointerType === "touch")}
                          onClick={(e) => tap(e, t)}
                          onFocus={() => enter(t, touch.current)}
                          onBlur={leave}
                        >
                          <span className="mask">
                            <span>
                              {short(t.title)}
                              <sup className="music-plays">{t.plays}</sup>
                            </span>
                          </span>
                          <span className="music-artist">{t.artist}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="music-rim music-rim-top" aria-hidden="true" />
      <div className="music-rim music-rim-bottom" aria-hidden="true" />
      <div ref={label} className="cursor-label" />
    </section>
  );
}
