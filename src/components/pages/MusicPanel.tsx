"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { numberWord } from "@/content/site";
import { CursorLabel } from "@/components/CursorLabel";
import { setFlag } from "@/lib/flags";
import { pollNow, type NowResponse, type Track, type WeekTrack } from "@/lib/now";

/** The quietest song's opacity: the less it was played, the closer it sits to eigengrau. */
const QUIETEST = 0.28;
/** The stack never shrinks below this share of its size to fit a short window. */
const MIN_FIT = 0.55;
const PHONE = 640;
/** Room kept under the stack on a desktop window: the bottom inset and a breath. */
const FOOT = 64;

const keyOf = (t: Track) => `${t.artist}\u0000${t.title}`;
const cover = (id: string) => `/api/cover/${id}`;
const plays = (n: number) => `${numberWord(n)} play${n === 1 ? "" : "s"}`;

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

type Shown = { mode: "now" | "last" | "song" | "quiet"; track: Track | null; state: string };

/**
 * Music: plain DOM inside the sliding panel, like Notes. A sleeve holds what
 * is playing, or what played last; beside it the week's ten most-played songs
 * stand in one stack, each set as loud as it was played: size and brightness
 * follow the play count, so the quiet ones sink toward eigengrau. The count
 * rides each title the way the tab numbers ride the pills. Hovering a song
 * turns the sleeve to its album. Polled while the page is visible.
 */
export function MusicPanel() {
  const stage = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const cursor = useRef<CursorLabel | null>(null);
  /** The latest answer and when it arrived (unix seconds), which "a minute ago" is measured from. */
  const [latest, setLatest] = useState<{ data: NowResponse; at: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setFlag("pageReady", true);
    cursor.current = new CursorLabel(label.current!, stage.current!);
    const stop = pollNow((data) => setLatest({ data, at: Date.now() / 1000 }));
    return () => {
      stop();
      cursor.current?.destroy();
      cursor.current = null;
    };
  }, []);

  const data = latest?.data ?? null;
  const tracks = data?.week.tracks ?? [];
  const loudest = Math.max(1, ...tracks.map((t) => t.plays));
  const stackKey = tracks.map((t) => `${keyOf(t)}:${t.plays}`).join("|");

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
  }, [stackKey]);

  const song = tracks.find((t) => keyOf(t) === active) ?? null;
  const shown: Shown = song
    ? { mode: "song", track: song, state: `${plays(song.plays)} this week` }
    : data?.now
      ? { mode: "now", track: data.now, state: "Now playing" }
      : data?.last && latest
        ? { mode: "last", track: data.last, state: `Last played, ${ago(data.last.at, latest.at)}` }
        : { mode: "quiet", track: null, state: "Quiet" };
  const covers = [...new Set([data?.now?.coverId, data?.last?.coverId, ...tracks.map((t) => t.coverId)].filter((id): id is string => !!id))];

  const enter = (t: WeekTrack) => {
    setActive(keyOf(t));
    cursor.current?.set("Last.fm");
  };
  const leave = () => {
    setActive(null);
    cursor.current?.set(null);
  };

  return (
    <section ref={stage} className="stage stage-music">
      <div ref={scroll} className="music-scroll">
        {data && (
          <div className="music">
            <p className="music-heading mask">
              <span>
                <span className="music-lead">Music</span>
                {`${plays(data.week.plays)} this week.`}
                {data.week.plays > 0 && data.week.artist ? ` Mostly ${data.week.artist}.` : ""}
              </span>
            </p>

            <div className="music-body">
              <div className="music-side">
                <div className="music-sleeve" aria-hidden="true">
                  {covers.map((id) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={id}
                      src={cover(id)}
                      alt=""
                      data-on={id === shown.track?.coverId ? "" : undefined}
                      onLoad={(e) => e.currentTarget.setAttribute("data-loaded", "")}
                    />
                  ))}
                </div>
                {/* Keyed by what it names, so a new track rises in; the "ago" ticks over in place. */}
                <div className="music-now" key={`${shown.mode}:${shown.track ? keyOf(shown.track) : ""}`}>
                  <p className="music-state mask">
                    <span>
                      {shown.mode !== "song" && <i className="music-dot" data-still={shown.mode === "now" ? undefined : ""} aria-hidden="true" />}
                      {shown.state}
                    </span>
                  </p>
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

              <ol ref={list} className="music-list" data-active={song ? "" : undefined} onPointerLeave={leave} aria-label="Most played this week">
                {tracks.map((t, i) => {
                  const k = t.plays / loudest;
                  const style = { "--k": k, "--level": QUIETEST + (1 - QUIETEST) * k, "--d": `${0.15 + i * 0.05}s` } as CSSProperties;
                  return (
                    <li key={keyOf(t)} style={style}>
                      <a
                        href={t.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-on={keyOf(t) === active ? "" : undefined}
                        aria-label={`${t.title}, ${t.artist}, ${plays(t.plays).toLowerCase()} this week`}
                        onPointerEnter={() => enter(t)}
                        onFocus={() => enter(t)}
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
