"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { DOOR_CLOSE, DOOR_OPEN, DOOR_WAIT, WALL_IN, sfx, type Preview } from "@/audio/sfx";
import { CursorLabel } from "@/components/CursorLabel";
import { setFlag } from "@/lib/flags";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { countWord, plainFact, pollNow, type NowResponse, type Playing, type Track, type WeekTrack } from "@/lib/now";
import { onWhere } from "@/lib/where";
import { EIGENGRAU, Spring, bend, deltaE, dither, learnTone, missTone, onTone, rgbOf, toneNow, toneOf, type Tone } from "@/lib/tone";

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
/** A pointer this near the tab bar's row (px) is at the room's door. */
const DOOR_BAND = 12;
/** A pointer still this long (ms), or a keyboard, has come to rest, rather than being on its way somewhere. */
const SETTLE_MS = 300;
/** The stack's lines leave before the sleeve moves to the middle of the room. */
const FOLD_MS = 560;
/** The sleeve's glide between the week and the room, and how long the words under it wait for it. */
const GLIDE = 0.9;
const AFTER_GLIDE = 0.45;
/**
 * The server's stale cap, kept here too: how long past its end a song may
 * still say "now playing", and the cap when its length is unknown.
 */
const GRACE = 60;
const UNKNOWN_CAP = 15 * 60;
/** A song missing from the answers this long (seconds) is a new play when it comes back. */
const FORGET = 180;

/**
 * The last song heard through the wall, and whose it is. The song lives in
 * sfx and outlasts this page: leave Music with its door open and it plays on
 * in the room, so the page that mounts on the way back picks it up where it is.
 */
let carried: { preview: Preview; key: string; cover: string | null } | null = null;

/** Once per visit, the first hover with sound off says so instead of naming Last.fm. */
let toldSoundOff = false;
function firstSoundOffHover() {
  if (toldSoundOff) return false;
  toldSoundOff = true;
  return true;
}

/** Whether a focus was a keyboard's (a browser too old to say counts it as one). */
function keyed(el: Element) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

const keyOf = (t: Track) => `${t.artist}\u0000${t.title}`;
const cover = (id: string) => `/api/cover/${id}`;
const plays = (n: number) => `${countWord(n)} play${n === 1 ? "" : "s"}`;
const minutes = (n: number) => (n === 1 ? "a minute" : `${countWord(n).toLowerCase()} minutes`);

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
 * restarted or different server forgets; a sure one holds still unless it
 * really moved.
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
 * Past its end and a minute (a quarter of an hour when its length is
 * unknown), a now-playing is a scrobbler that forgot to stop. The server
 * caps this too, but a server that has only just seen the song thinks it
 * began then; the page's earliest sighting knows better.
 */
const stale = (t: Timing, at: number) => at - t.start > (t.length ?? UNKNOWN_CAP) + GRACE;

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

// ---------------------------------------------------------------- the room's colour

/** Behind the wall the room takes this share of the record's colour; with the door open, all of it. */
const WALL_SHARE = 0.35;
/** At most one new colour this often (ms); the newest choice waiting wins. */
const COLOUR_EVERY = 1200;
/** Crossing the gap between two titles is not leaving (ms). */
const GRACE_MS = 250;
/** A new colour this near the one showing (ΔE in OKLab) carries on with its move instead of restarting it. */
const SAME_TONE = 0.015;
/** His song's colour fades in over this (s) on the first answer, and out again when he stops. */
const LIVE_IN = 1.6;
/** A new song's colour crosses over this (s), from when its sleeve begins to rise. */
const LIVE_CROSS = 2.4;
const LIVE_RISE = 0.35;
/** Over a song's last 30s ("Nearly over.") its colour eases down to 60%, like a run-out groove. */
const RUN_OUT = 30;
const RUN_OUT_TO = 0.6;
/** Reduced motion: the same gates, and every change a linear crossfade of 0.6 to 1.2s. */
const PLAIN = { short: 0.6, long: 1.2 };
/** The light reaches 0.9 sleeve-widths past the sleeve behind the wall; open, 75% of the way to the farthest corner. */
const WALL_REACH = 0.9;
const OPEN_REACH = 0.75;

/** A colour and how much of it the room takes: OKLab L, a, b, and the tone's strength (0 for none). */
type Shade = [number, number, number, number];
const NONE: Shade = [EIGENGRAU.L, EIGENGRAU.a, EIGENGRAU.b, 0];
function shade(t: Tone | null, live: boolean): Shade {
  if (!t) return NONE;
  const c = bend(t, live);
  return [c.L, c.a, c.b, t.s];
}
const labOf = (s: Shade) => ({ L: s[0], a: s[1], b: s[2] });
/** Between two shades: the colour moves straight across OKLab; from or to nothing, only the amount moves. */
function between(p: Shade, q: Shade, k: number): Shade {
  const hold = p[3] <= 0 ? q : q[3] <= 0 ? p : null;
  const c = (i: number) => (hold ? hold[i] : p[i] + (q[i] - p[i]) * k);
  return [c(0), c(1), c(2), p[3] + (q[3] - p[3]) * k];
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const linear = (k: number) => k;
/** A timed move between two shades; `t0` (ms) may be ahead, so it can wait for a sleeve to rise. */
type Move = { from: Shade; to: Shade; t0: number; over: number; ease: (k: number) => number };
const moved = (m: Move, now: number) => now >= m.t0 + m.over * 1000;

/**
 * The preview's colour, kept as the two shades it is moving between and how
 * far across it is, rather than as the colour of the moment: the room paints
 * each shade once and shows every step between them with an opacity. How far
 * rides a critically damped spring (tau 0.7s, as the colour's own did), which
 * keeps its speed when a new colour is chosen mid-flight; the move starts
 * again from the colour showing, so it still goes straight across, through
 * near-grey between hues. Reduced motion crosses linearly instead.
 */
class Blend {
  from: Shade;
  to: Shade;
  private k = new Spring([1]);
  private plainMove: number | null = null;

  constructor(
    s: Shade,
    private plain: boolean,
  ) {
    this.from = [...s];
    this.to = [...s];
  }

  /** How far across, 0 to 1. */
  get at() {
    return this.k.x[0];
  }

  /** The shade showing now. */
  now(): Shade {
    return between(this.from, this.to, this.at);
  }

  snap(s: Shade) {
    this.from = [...s];
    this.to = [...s];
    this.k.snap([1]);
    this.plainMove = null;
  }

  /** Heads for `s` from wherever the colour is. */
  aim(s: Shade, now: number) {
    const here = this.now();
    const was = [0, 1, 2].map((i) => this.to[i] - this.from[i]);
    const next = [0, 1, 2].map((i) => s[i] - here[i]);
    const far = next.reduce((sum, d) => sum + d * d, 0);
    // The speed it had, along the new way: a turn mid-flight keeps what it can of its momentum.
    const speed = far > 1e-12 ? (this.k.v[0] * was.reduce((sum, d, i) => sum + d * next[i], 0)) / far : 0;
    this.from = here;
    this.to = [...s];
    this.k.snap([0]);
    this.k.to = [1];
    this.k.v = [this.plain ? 0 : speed];
    this.plainMove = this.plain ? now : null;
  }

  step(now: number, dt: number) {
    if (this.plainMove !== null) {
      const k = clamp01((now - this.plainMove) / (PLAIN.short * 1000));
      this.k.x = [k];
      if (k >= 1) this.plainMove = null;
      return;
    }
    if (!this.moving) return;
    this.k.step(dt);
    if (!this.moving) this.k.snap([1]);
  }

  /** Still moving by more than a twentieth of an 8-bit step, as the spring it replaces counted it. */
  get moving() {
    if (this.plainMove !== null) return true;
    const span = Math.max(...this.to.map((v, i) => Math.abs(v - this.from[i])));
    return span * Math.max(Math.abs(1 - this.at), Math.abs(this.k.v[0])) > 2e-4;
  }
}

/** A spill's radius as drawn (px). A transform sizes it to its reach; the falloff is smooth, so it scales cleanly. */
const SPILL_R = 512;
/**
 * A colour's move is drawn in this many straight pieces of its way through
 * OKLab. Crossed by an opacity, each piece runs straight in sRGB instead,
 * which strays from the OKLab line by up to 7.6 levels in one piece at the
 * live caps (a dark red to a teal); in six it strays 0.6 at most.
 */
const PIECES = 6;
const cssOf = (s: Shade) => `rgb(${rgbOf(labOf(s))
  .map((v) => v.toFixed(2))
  .join(" ")})`;

/**
 * One spill of light, on its own layer: a circle masked (in the CSS) to the
 * light's falloff, carried to the sleeve and sized to its reach by a
 * transform, its strength an opacity. Its colour is two solid shades, its own
 * and its child's laid over it, crossed by the child's opacity: the ends of
 * the piece of a colour's move it is on. The shades repaint only as a move
 * passes from one piece to the next (six times in a move); every frame
 * between is a transform and two opacities, which the compositor does alone.
 */
class Spill {
  private top: HTMLElement;
  private written = new Map<string, string>();

  constructor(private el: HTMLElement) {
    this.top = el.firstElementChild as HTMLElement;
  }

  /** Paints the piece of the move from `from` to `to` that `k` has reached, and says how far across that piece it is. */
  paint(from: Shade, to: Shade, k: number): number {
    const along = clamp01(k) * PIECES;
    const piece = Math.min(PIECES - 1, Math.floor(along));
    this.set(this.el, "background-color", cssOf(between(from, to, piece / PIECES)));
    this.set(this.top, "background-color", cssOf(between(from, to, (piece + 1) / PIECES)));
    return along - piece;
  }

  draw(x: number, y: number, reach: number, alpha: number, across: number) {
    // A spill with no light in it need not follow the sleeve until it has some.
    if (alpha < 5e-5) return this.set(this.el, "opacity", "0");
    this.set(this.el, "transform", `translate3d(${(x - SPILL_R).toFixed(1)}px, ${(y - SPILL_R).toFixed(1)}px, 0) scale(${(reach / SPILL_R).toFixed(4)})`);
    this.set(this.el, "opacity", alpha.toFixed(4));
    this.set(this.top, "opacity", across.toFixed(4));
  }

  private set(el: HTMLElement, name: string, value: string) {
    const key = `${el === this.el ? "" : ">"}${name}`;
    if (this.written.get(key) === value) return;
    this.written.set(key, value);
    el.style.setProperty(name, value);
  }
}

/**
 * The door's envelope as colour: the share of the record's colour the room
 * takes `t` seconds after its song is first heard. It rises to 35% as the
 * song fades up behind the wall, holds while it waits, and opens to all of it
 * as the lowpass opens.
 */
function doorShare(t: number, plain: boolean): number {
  if (t <= 0) return 0;
  if (t < WALL_IN) return (WALL_SHARE * t) / WALL_IN;
  t -= WALL_IN + DOOR_WAIT;
  if (t < 0) return WALL_SHARE;
  const open = plain ? PLAIN.long : DOOR_OPEN;
  return t < open ? WALL_SHARE + ((1 - WALL_SHARE) * t) / open : 1;
}
/**
 * The same, for a colour that starts from `from` rather than from nothing,
 * and perhaps `late` seconds after its song was first heard (the 1.2s limit
 * held it): it goes straight from where the room is to where the door will
 * be, at the wall's own pace, and from there keeps the sound's clock, so the
 * colour still opens as the door does.
 */
function door(t: number, from: number, late: number, plain: boolean): number {
  if (t <= late) return from;
  const meet = late + WALL_IN;
  return t >= meet ? doorShare(t, plain) : from + ((doorShare(meet, plain) - from) * (t - late)) / WALL_IN;
}
const doorLength = (plain: boolean) => WALL_IN + DOOR_WAIT + (plain ? PLAIN.long : DOOR_OPEN);
/** How far into `doorShare` (s) the room holds `share`: where a move that carries on picks it up. */
function doorTime(share: number, plain: boolean): number {
  if (share <= WALL_SHARE) return (WALL_IN * share) / WALL_SHARE;
  return WALL_IN + DOOR_WAIT + ((plain ? PLAIN.long : DOOR_OPEN) * (share - WALL_SHARE)) / (1 - WALL_SHARE);
}

type Chosen = { key: string; cover: string | null };
/** The colour a preview gave the room: whose it is, which preview (so its end can close the door; 0 for none), and its shade (null for a grey record). */
type Owner = Chosen & { n: number; shade: Shade | null };
/** A choice whose gate has opened but whose colour waits (for the 1.2s limit, or for its cover): which preview, and when its song was heard. */
type Pending = Chosen & { n: number; heard: number };

/**
 * The room takes the record's colour. The thing you touch answers now; the
 * room answers when you stay, on the door's clock: muffled sound, muted
 * colour; the door opens, the colour opens. Scrubbing across the titles never
 * rests long enough to start anything, so the room does not move.
 *
 * Two lights share the sleeve's centre. His song, playing now, is the resting
 * state. A preview rides over it: it commits only when its song is heard (or,
 * with sound off, after the same dwell), at most one new colour each 1.2s,
 * and leaving counts only after 250ms. A song left playing in the room while
 * the visitor was away opens again with its door as they come back. Which
 * colour moves on a critically damped spring in OKLab; how much of it keeps
 * the door's envelope. Each light is its own layer in the stage (see Spill),
 * written only while something moves, so it slides away with the panel and a
 * move or a scroll costs no painting.
 */
class RoomLight {
  /** The preview's colour on its way. */
  private tone: Blend;
  private owner: Owner | null = null;
  private choice: Chosen | null = null;
  /**
   * The preview's door: on the clock of its song, heard at `t0` (ms), rising
   * from `from` since `late` seconds after that; or closing since `t0` from `from`.
   */
  private rise: { t0: number; from: number; late: number } | null = null;
  private shut: { t0: number; from: number } | null = null;
  /** The door reopening on a song that played on while the visitor was away: from `from` at `t0` (ms), all of it `over` seconds later. */
  private back: { t0: number; from: number; over: number } | null = null;
  private lastNew = -Infinity;
  private queued: Pending | null = null;
  private queueTimer: number | null = null;
  private graceTimer: number | null = null;
  /** A choice whose cover has not been read yet: it commits once it has. */
  private unread: Pending | null = null;

  private liveKey: string | null = null;
  private liveCover: string | null = null;
  private liveShade: Shade = NONE;
  private liveMove: Move | null = null;
  private liveWaiting = false;
  private liveSince = 0;
  private liveSwap = false;
  /** When his song ends, on the page's clock (unix seconds), when that is known for sure. */
  private liveEnd: number | null = null;

  private geo = { x: 0, y: 0, w: 0, W: 0, H: 0 };
  private followUntil = 0;
  private raf = 0;
  private later: number | null = null;
  private last = 0;
  private lit = false;
  private spills: { live: Spill; tone: Spill };
  private watched = new Set<Element>();
  private ro: ResizeObserver | null;
  private offTone: () => void;

  constructor(
    private stage: HTMLElement,
    box: HTMLElement,
    private sleeve: () => HTMLElement | null,
    private plain: boolean,
  ) {
    this.tone = new Blend(NONE, plain);
    const [live, tone] = Array.from(box.querySelectorAll<HTMLElement>(".music-spill"), (el) => new Spill(el));
    this.spills = { live, tone };
    box.querySelector<HTMLElement>(".music-grain")?.style.setProperty("background-image", dither());
    this.ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.place()) : null;
    this.watch(stage);
    this.offTone = onTone((id) => {
      const u = this.unread;
      if (u && u.cover === id) {
        this.unread = null;
        if (u.key === this.choice?.key) this.apply(u, u.heard, u.n);
      }
      if (this.liveWaiting && this.liveCover === id) this.settleLive();
    });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    [this.later, this.queueTimer, this.graceTimer].forEach((t) => t !== null && window.clearTimeout(t));
    this.ro?.disconnect();
    this.offTone();
  }

  // ---- his song

  /** His song playing now (null when he is not), and when it ends if that is known for sure. */
  live(key: string | null, cover: string | null, end: number | null) {
    this.liveEnd = end;
    if (key !== this.liveKey) {
      this.liveSwap = !!key && !!this.liveKey;
      this.liveSince = performance.now();
      this.liveKey = key;
      this.liveCover = key ? cover : null;
      this.settleLive();
    }
    this.kick();
  }

  private settleLive() {
    const t = this.liveCover ? toneNow(this.liveCover) : null;
    // A cover not read yet is waited for, but not with the last record's colour: a new song still crosses on
    // time, towards none, and turns to its own colour when its cover is read. One that never loads leaves eigengrau.
    this.liveWaiting = t === undefined;
    const now = performance.now();
    const from = this.liveAt(now);
    const to = shade(t ?? null, true);
    if (to[3] <= 0 && from[3] <= 0) return;
    // Already on its way there (a cover that failed while the room was crossing towards none): let it carry on.
    if (this.liveMove?.to.every((v, i) => v === to[i])) return;
    // A new song crosses as its sleeve begins to rise; the first answer, or his stopping, simply fades.
    const over = this.plain ? PLAIN.long : this.liveSwap ? LIVE_CROSS : LIVE_IN;
    const t0 = this.liveSwap && !this.plain ? Math.max(now, this.liveSince + LIVE_RISE * 1000) : now;
    this.liveMove = { from, to, t0, over, ease: this.plain ? linear : inOut };
    this.kick();
  }

  /** His song's light now: the two shades it is between and how far across (both the same at rest). */
  private liveLook(now: number): { from: Shade; to: Shade; k: number } {
    const m = this.liveMove;
    if (m && !moved(m, now)) return { from: m.from, to: m.to, k: m.ease(clamp01((now - m.t0) / (m.over * 1000))) };
    if (m) {
      this.liveMove = null;
      this.liveShade = m.to;
    }
    return { from: this.liveShade, to: this.liveShade, k: 1 };
  }

  private liveAt(now: number): Shade {
    const l = this.liveLook(now);
    return between(l.from, l.to, l.k);
  }

  /** 1, easing to 60% over the song's last 30 seconds. */
  private runOut(): number {
    if (this.liveEnd === null) return 1;
    const left = this.liveEnd - Date.now() / 1000;
    return left >= RUN_OUT ? 1 : 1 - (1 - RUN_OUT_TO) * inOut(clamp01(1 - left / RUN_OUT));
  }

  // ---- a preview

  /** Whether `key`'s colour is in the room (or on its way), not leaving it. */
  showing(key: string) {
    return this.owner?.key === key && !this.shut;
  }

  /** The visitor's choice (a title under the pointer, focused or tapped), or null when they leave. */
  choose(key: string | null, cover: string | null) {
    this.choice = key ? { key, cover } : null;
    if (this.queued && this.queued.key !== key) this.queued = null;
    if (this.unread && this.unread.key !== key) this.unread = null;
    const o = this.owner;
    if (!o || this.shut) return;
    if (key === o.key) return this.clearGrace();
    // The same colour on another title (an album-mate) carries on as it was.
    const t = key ? toneOf(cover) : undefined;
    if (key && t && o.shade && deltaE(labOf(shade(t, false)), labOf(o.shade)) < SAME_TONE) {
      this.owner = { key, cover, n: 0, shade: o.shade };
      return this.clearGrace();
    }
    this.graceTimer ??= window.setTimeout(() => {
      this.graceTimer = null;
      if (this.owner && this.choice?.key !== this.owner.key) this.close();
    }, GRACE_MS);
  }

  /**
   * A choice's gate has opened: its song is heard from `heard` (performance.now
   * ms), or with sound off the dwell has passed, or a phone tapped it. `n`
   * names the preview, so its end can close the door.
   */
  commit(key: string, cover: string | null, heard = performance.now(), n = 0) {
    if (key !== this.choice?.key) return;
    const now = performance.now();
    if (this.carriesOn(cover) || now - this.lastNew >= COLOUR_EVERY) return this.apply({ key, cover }, heard, n);
    // Held back, it keeps the time its song was heard, so its door still opens with the sound's.
    this.queued = { key, cover, n, heard };
    if (this.queueTimer !== null) window.clearTimeout(this.queueTimer);
    this.queueTimer = window.setTimeout(() => {
      this.queueTimer = null;
      const q = this.queued;
      this.queued = null;
      if (q && q.key === this.choice?.key) this.apply(q, q.heard, q.n);
    }, this.lastNew + COLOUR_EVERY - now);
  }

  /**
   * A song that played on in the room while the visitor was away (preview
   * `n`): its door reopens over `over` seconds from `at` (performance.now()
   * ms, perhaps a little ahead), and the colour opens with it, from wherever
   * the room is.
   */
  reopen(key: string, cover: string | null, n: number, at: number, over: number) {
    const t = toneNow(cover);
    const now = performance.now();
    const amount = this.amountAt(now);
    this.clearGrace();
    this.rise = null;
    this.shut = null;
    this.back = null;
    this.owner = { key, cover, n, shade: t ? shade(t, false) : null };
    // A grey record, or a cover never read: the room stays as it is.
    if (!t) return this.close();
    const to = shade(t, false);
    if (amount <= 0.001) this.tone.snap(to);
    else this.tone.aim(to, now);
    this.lastNew = now;
    this.back = { t0: at, from: amount, over: this.plain ? Math.min(over, PLAIN.long) : over };
    this.kick();
  }

  /** The preview `n` has ended (its thirty seconds, or its door closed): the colour goes with it. */
  ended(n: number) {
    if (n && this.owner?.n === n && !this.shut) this.close();
  }

  private carriesOn(cover: string | null) {
    const t = toneOf(cover);
    const o = this.owner;
    return !!t && !!o?.shade && this.amountAt(performance.now()) > 0 && deltaE(labOf(shade(t, false)), labOf(o.shade)) < SAME_TONE;
  }

  private apply(c: Chosen, heard: number, n: number) {
    const t = toneNow(c.cover);
    if (t === undefined) {
      this.unread = { key: c.key, cover: c.cover, n, heard };
      return;
    }
    const now = performance.now();
    const to = t ? shade(t, false) : null;
    const amount = this.amountAt(now);
    const o = this.owner;
    this.clearGrace();
    if (to && o?.shade && amount > 0 && deltaE(labOf(to), labOf(o.shade)) < SAME_TONE) {
      this.owner = { key: c.key, cover: c.cover, n, shade: o.shade };
      if (this.shut) {
        // It was leaving: the door picks up again from where the colour is, instead of from the wall.
        this.shut = null;
        this.back = null;
        this.rise = { t0: now - doorTime(amount, this.plain) * 1000, from: 0, late: 0 };
      }
      return this.kick();
    }
    this.lastNew = now;
    this.owner = { key: c.key, cover: c.cover, n, shade: to };
    // A grey record leaves the room grey.
    if (!to) return this.close();
    if (amount <= 0.001) this.tone.snap(to);
    else this.tone.aim(to, now);
    this.shut = null;
    this.back = null;
    // The door keeps its song's clock. A colour let in late catches up with it; one very late (its cover read long
    // after the song began) lags it by the rest, rather than leaping to where the door has got to.
    const late = Math.min(Math.max(0, now - heard), COLOUR_EVERY) / 1000;
    this.rise = { t0: heard > now ? heard : now - late * 1000, from: amount, late };
    this.kick();
  }

  private close() {
    this.clearGrace();
    const now = performance.now();
    const amount = this.amountAt(now);
    this.rise = null;
    this.back = null;
    this.shut = amount > 0 ? { t0: now, from: amount } : null;
    if (!this.shut) this.owner = null;
    this.kick();
  }

  private clearGrace() {
    if (this.graceTimer !== null) window.clearTimeout(this.graceTimer);
    this.graceTimer = null;
  }

  private amountAt(now: number): number {
    if (this.shut) {
      const k = (now - this.shut.t0) / ((this.plain ? PLAIN.long : DOOR_CLOSE) * 1000);
      return k >= 1 ? 0 : this.shut.from * (1 - k);
    }
    if (this.back) {
      const b = this.back;
      return b.over > 0 ? b.from + (1 - b.from) * clamp01((now - b.t0) / (b.over * 1000)) : 1;
    }
    return this.rise ? door((now - this.rise.t0) / 1000, this.rise.from, this.rise.late, this.plain) : 0;
  }

  // ---- where the sleeve is

  /** Keeps an eye on an element whose size moves the sleeve (the stage, the sleeve's column). */
  watch(el: Element | null) {
    if (!el || !this.ro || this.watched.has(el)) return;
    this.watched.add(el);
    this.ro.observe(el);
  }

  /** The sleeve may have moved (a layout change, a scroll): the light's centre goes with it. */
  place() {
    this.measure();
    this.kick();
  }

  /** The sleeve glides for `ms`: the light follows it frame by frame. Reduced motion has no glide to follow. */
  follow(ms: number) {
    if (this.plain) return;
    this.followUntil = performance.now() + ms;
    this.kick();
  }

  private measure() {
    const el = this.sleeve();
    if (!el) return;
    const s = this.stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width || !s.width) return;
    this.geo = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, w: r.width, W: s.width, H: s.height };
  }

  // ---- painting

  private kick() {
    if (this.later !== null) window.clearTimeout(this.later);
    this.later = null;
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    // Real time, however slow the frames: the spring's closed form is exact at any step, and the door keeps the clock.
    const dt = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    if (now < this.followUntil) this.measure();
    this.tone.step(now, dt);
    const amount = this.amountAt(now);
    if (this.shut && amount <= 0) {
      this.shut = null;
      this.owner = null;
    }
    const tone = this.tone;
    const toneA = amount * (tone.from[3] + (tone.to[3] - tone.from[3]) * tone.at);
    const live = this.liveLook(now);
    const liveA = between(live.from, live.to, live.k)[3] * this.runOut();
    // Nothing to draw until the sleeve has been found: a light at the corner would be worse than a late one.
    const lit = (toneA > 0.0005 || liveA > 0.0005) && this.geo.W > 0;
    if (lit !== this.lit) {
      this.lit = lit;
      this.stage.toggleAttribute("data-lit", lit);
    }
    if (lit) {
      const { x, y, w, W, H } = this.geo;
      const far = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
      const wall = w * (0.5 + WALL_REACH);
      const open = Math.max(wall, far * OPEN_REACH);
      const toneAcross = this.spills.tone.paint(tone.from, tone.to, tone.at);
      this.spills.tone.draw(x, y, wall + (open - wall) * clamp01((amount - WALL_SHARE) / (1 - WALL_SHARE)), toneA, toneAcross);
      this.spills.live.draw(x, y, open, liveA, this.spills.live.paint(live.from, live.to, live.k));
    }
    const moving =
      now < this.followUntil ||
      tone.moving ||
      !!this.shut ||
      (!!this.back && now < this.back.t0 + this.back.over * 1000) ||
      (!!this.rise && now < this.rise.t0 + doorLength(this.plain) * 1000) ||
      !!this.liveMove;
    if (moving) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    // Only the run-out moves, and slowly: a look four times a second is plenty. Before it, wait for it.
    if (this.liveEnd === null || liveA <= 0) return;
    const left = this.liveEnd - Date.now() / 1000;
    if (left <= 0) return;
    this.later = window.setTimeout(() => this.kick(), left > RUN_OUT ? (left - RUN_OUT) * 1000 : 250);
  };
}

type Latest = { data: NowResponse; at: number; timing: Timing | null };
type Shown = { mode: "now" | "last" | "song" | "quiet"; track: Track | null; state: string };
/**
 * A song coming through the wall: which one, where Apple keeps it, how long
 * it runs, when it was first heard (performance.now() ms), and whether the
 * door is closing.
 */
type Hearing = { key: string; link: string | null; duration: number; at: number; n: number; closing: boolean };
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
  const body = useRef<HTMLDivElement>(null);
  const coverBox = useRef<HTMLDivElement>(null);
  const sleeve = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLElement>(null);
  const listenLine = useRef<HTMLElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const foldButton = useRef<HTMLButtonElement>(null);
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

  /** The visitor unfolded the week while he is live; forgotten when he stops, so his next song is the room again. */
  const openRef = useRef(false);
  const liveRef = useRef(false);
  /** The layout being headed for, which may be ahead of `room` while the stack leaves. */
  const targetRef = useRef(false);
  const foldTimer = useRef<number | null>(null);
  const firstPlace = useRef<Place | null>(null);
  /** The last song heard playing, when it began, and when it was last reported, kept through an answer or two without it. */
  const memo = useRef<(Timing & { seen: number }) | null>(null);
  /** A title had keyboard focus when the stack folded away; the heading takes it. */
  const refocus = useRef(false);
  /** The pointer is on the heading's button, whose label must go with it. */
  const onHeading = useRef(false);
  const liveCover = useRef<{ key: string | null; cover: string | null }>({ key: null, cover: null });
  const dwell = useRef<number | null>(null);
  const asking = useRef<AbortController | null>(null);
  const voice = useRef<Preview | null>(null);
  const heardN = useRef(0);
  const touch = useRef(false);
  const armed = useRef<string | null>(null);
  const pinned = useRef(false);
  /** The visitor is at the room's door or may be on the way: the pointer on the tab bar, a keyboard's focus in the chrome, or either still moving (see Preview.atDoor). */
  const door = useRef(false);
  /** The room's colour; none under prefers-contrast: more, which keeps the room eigengrau. */
  const light = useRef<RoomLight | null>(null);
  const lightBox = useRef<HTMLDivElement>(null);

  /** The cover's place in the scrolled content, which does not move when the page scrolls. */
  const measure = useCallback((): Place | null => {
    const el = coverBox.current;
    const sc = scroll.current;
    if (!el || !sc) return null;
    const r = el.getBoundingClientRect();
    const o = sc.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top + sc.scrollTop, w: r.width };
  }, []);

  // ---------------------------------------------------------------- the song through the wall

  /** Leave: the door closes over 1.2s and the song goes back into the bed, unless the visitor is on their way out (see Preview.stop). */
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

  /** Off a title (or a tap elsewhere): the stack is whole again and the song goes back through the wall. */
  const leave = useCallback(() => {
    setActive(null);
    setGlided(false);
    cursor.current?.set(null);
    armed.current = null;
    light.current?.choose(null, null);
    hush();
  }, [hush]);

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
      if (toRoom) {
        // Whatever was resting on a title belongs to the week: the room is his song. The stack
        // goes without a pointerleave or a blur, so let go of it here, and hand a keyboard's
        // place to the heading that brings the stack back.
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && list.current?.contains(focused)) {
          refocus.current = true;
          focused.blur();
        }
        pinned.current = false;
        leave();
      } else refocus.current = false;
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
    [measure, leave],
  );

  /** When a song heard (or picked up again) ends: the colour goes with it, and the attribution unless it is rested on. */
  const onEnd = useCallback((v: Preview, n: number) => {
    void v.ended.then(() => {
      light.current?.ended(n);
      if (voice.current === v) voice.current = null;
      // Its thirty seconds, and the decoded song under them, are nobody's to keep now.
      if (carried?.preview === v) carried = null;
      // Resting on the attribution keeps it until the pointer leaves it. The song showing is always the latest heard,
      // so the number says whether it is this one; a plain value, not an updater made in here, which React may keep a
      // while, and with it this song's decoded thirty seconds.
      if (!pinned.current && heardN.current === n) setHearing(null);
    });
  }, []);

  const listen = useCallback((t: WeekTrack) => {
    const controller = new AbortController();
    asking.current?.abort();
    asking.current = controller;
    const url = `/api/preview?${new URLSearchParams({ artist: t.artist, title: t.title })}`;
    void sfx.preview(url, controller.signal).then((v) => {
      const current = !controller.signal.aborted && asking.current === controller;
      // No preview, or a context no gesture has woken yet: the room still answers, silently.
      if (!v) {
        if (current) light.current?.commit(keyOf(t), t.coverId);
        return;
      }
      if (!current) {
        v.stop();
        return;
      }
      asking.current = null;
      voice.current = v;
      v.atDoor(door.current);
      carried = { preview: v, key: keyOf(t), cover: t.coverId };
      const n = ++heardN.current;
      setHearing({ key: keyOf(t), link: v.link, duration: v.duration, at: v.heardAt, n, closing: false });
      // The colour keys to the song being heard, not to the dwell: fetch and decode can take a second.
      light.current?.commit(keyOf(t), t.coverId, v.heardAt, n);
      onEnd(v, n);
    });
  }, [onEnd]);

  useEffect(() => {
    setFlag("pageReady", true);
    cursor.current = new CursorLabel(label.current!, stage.current!);
    if (!window.matchMedia("(prefers-contrast: more)").matches) light.current = new RoomLight(stage.current!, lightBox.current!, () => sleeve.current, reduced);
    // Back in the room with its song still playing: the door is reopening, and the page picks the song up where it
    // is. The week stays out, with the song on it, even while he is live: it is what the visitor left playing.
    const back = carried?.preview.sounding ? carried : null;
    if (back) {
      const v = back.preview;
      const n = ++heardN.current;
      const door = v.back ?? { at: performance.now(), over: 0 };
      voice.current = v;
      openRef.current = true;
      setHearing({ key: back.key, link: v.link, duration: v.duration, at: v.heardAt, n, closing: false });
      light.current?.reopen(back.key, back.cover, n, door.at, door.over);
      onEnd(v, n);
    }
    // The tab bar is the room's door. A pointer on its row, or a focus out in the chrome (the pills, the sound
    // chip), is on its way out, and a visitor still moving may be: a pointer, or keys walking the focus back past
    // the titles. So a song whose door is shutting waits at the wall for the slide instead of going into the bed;
    // one come to rest in the room lets it go.
    const nav = document.querySelector<HTMLElement>("nav[data-navbar]");
    let band: [number, number] | null = null;
    let pointerThere = false;
    let focusThere = false;
    let moving = false;
    let settle: number | null = null;
    const tell = () => {
      door.current = pointerThere || focusThere || moving;
      voice.current?.atDoor(door.current);
    };
    const settled = () => {
      settle = null;
      moving = false;
      tell();
    };
    const stir = () => {
      if (settle !== null) window.clearTimeout(settle);
      settle = window.setTimeout(settled, SETTLE_MS);
      moving = true;
    };
    // A key pressed means the next focus is a keyboard's, even on a touch screen: it chooses as a pointer's rest does.
    const onKey = () => {
      touch.current = false;
      stir();
      tell();
    };
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType === "touch" || !nav) return;
      if (!band) {
        const r = nav.getBoundingClientRect();
        band = [r.top - DOOR_BAND, r.bottom + DOOR_BAND];
      }
      stir();
      pointerThere = e.clientY >= band[0] && e.clientY <= band[1];
      tell();
    };
    // Only a keyboard's focus: a click on the sound chip or a pill leaves the focus there, and the pointer says where it went.
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      focusThere = e.type === "focusin" && el instanceof Element && el !== document.body && !stage.current?.contains(el) && keyed(el);
      tell();
    };
    const onResize = () => {
      band = null;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    // Leaving Music, the page stops asking for songs as the slide begins; the song already playing is sfx's to keep or close.
    const offWhere = onWhere((w) => {
      if (w.path === "/music") return;
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      dwell.current = null;
      asking.current?.abort();
      asking.current = null;
    });
    let first = true;
    const stop = pollNow(
      (answer) => {
        const at = Date.now() / 1000;
        const before = memo.current && at - memo.current.seen < FORGET ? memo.current : null;
        const heard = timingOf(answer.now, at, before);
        if (heard) memo.current = { ...heard, seen: at };
        const over = !!heard && stale(heard, at);
        const data = over ? { ...answer, now: null } : answer;
        const timing = over ? null : heard;
        // A new song while he is live: the old sleeve drops out and the next one rises.
        const key = data.now ? keyOf(data.now) : null;
        const was = liveCover.current;
        if (!first && key && was.key && key !== was.key) setSwap({ from: was.cover, to: data.now!.coverId, n: at });
        liveCover.current = { key, cover: data.now?.coverId ?? null };
        liveRef.current = !!data.now;
        light.current?.live(key, data.now?.coverId ?? null, timing?.sure && timing.length ? timing.start + timing.length : null);
        // He stopped: the next time he plays something, the page turns to it again.
        if (!data.now) openRef.current = false;
        setLatest({ data, at, timing });
        setClock(at);
        go(!!data.now && !openRef.current, !first && !reduced);
        first = false;
      },
      () => (liveRef.current ? POLL.live : POLL.quiet),
    );
    return () => {
      stop();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      if (settle !== null) window.clearTimeout(settle);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
      offWhere();
      if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      asking.current?.abort();
      // The song is not the page's to stop: it lives in sfx, which closes it or keeps it in the room as the visitor goes.
      cursor.current?.destroy();
      cursor.current = null;
      light.current?.destroy();
      light.current = null;
    };
  }, [go, reduced, onEnd]);

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
    light.current?.follow(GLIDE * 1000 + 50);
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [room, measure]);

  // After every render the light finds the sleeve again; a change in the column's size (fonts, the stack's fit) does too.
  useLayoutEffect(() => {
    light.current?.watch(body.current);
    light.current?.place();
  });

  // A keyboard that was on a title when the stack folded away lands on the heading, which brings it back.
  useEffect(() => {
    if (!room || !refocus.current) return;
    refocus.current = false;
    if (document.activeElement === document.body || document.activeElement === null) foldButton.current?.focus({ preventScroll: true });
  }, [room]);

  // He stopped with the pointer on the heading: the button goes, and so does its word.
  useEffect(() => {
    if (live || !onHeading.current) return;
    onHeading.current = false;
    cursor.current?.set(null);
  }, [live]);

  // A new song: the old sleeve drops out through the sleeve's edge and the next one rises in.
  useLayoutEffect(() => {
    const box = sleeve.current;
    if (!swap || !box || reduced || swap.from === swap.to) return;
    const img = (id: string | null) => (id ? box.querySelector<HTMLImageElement>(`img[data-id="${id}"]`) : null);
    const out = img(swap.from);
    const next = img(swap.to);
    if (!out && !next) return;
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

  // The room is his song alone: a title still sounding as the week leaves has no say in it.
  const song = room || folding ? null : (tracks.find((t) => keyOf(t) === (active ?? hearing?.key)) ?? null);
  const heard = song && hearing?.key === keyOf(song) ? hearing : null;
  const shown: Shown = song
    ? { mode: "song", track: song, state: heard ? `Preview from ${heard.link?.includes("deezer.com") ? "Deezer" : "Apple Music"}` : `${plays(song.plays)} this week` }
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
  const hearAt = hearing?.at ?? 0;
  const drawn = !!data;
  useEffect(() => {
    const el = listenLine.current;
    if (!el || !hearN) return;
    if (reduced) {
      gsap.set(el, { scaleX: 1 });
      return;
    }
    // A song come back to is partway through already: the line starts from there.
    const done = clamp01((performance.now() - hearAt) / 1000 / hearFor);
    const tween = gsap.fromTo(el, { scaleX: done }, { scaleX: 1, duration: hearFor * (1 - done), ease: "none" });
    return () => {
      tween.kill();
    };
  }, [hearN, hearFor, hearAt, drawn, reduced]);

  const enter = (t: WeekTrack, viaTouch: boolean) => {
    // The stack is on its way out to the room.
    if (targetRef.current) return;
    // On a phone only a tap chooses (see `tap`): a finger that lands on a title to scroll the list changes
    // nothing, so the song that was tapped keeps its sleeve, its colour and its sound, and a second tap on it
    // still means Last.fm.
    if (viaTouch) return;
    const key = keyOf(t);
    // A song still sounding on this title (one come back to, not yet touched) is already its own: resting on it keeps it.
    const sounding = !!hearing && !hearing.closing && hearing.key === key;
    if (key !== active && !sounding) hush();
    if (key !== armed.current) armed.current = null;
    setActive(key);
    setGlided(false);
    cursor.current?.set(!sfx.enabled && firstSoundOffHover() ? "Sound is off" : "Last.fm");
    light.current?.choose(key, t.coverId);
    // A song whose door is still closing (back on it within the second) plays again after the dwell.
    if (sfx.enabled && !sounding) {
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      dwell.current = window.setTimeout(() => {
        dwell.current = null;
        listen(t);
      }, DWELL_MS);
    } else if (!sfx.enabled && !light.current?.showing(key)) {
      // With sound off there is no song to wait for: the colour keeps the same dwell on its own.
      if (dwell.current !== null) window.clearTimeout(dwell.current);
      dwell.current = window.setTimeout(() => {
        dwell.current = null;
        light.current?.commit(key, t.coverId);
      }, DWELL_MS);
    }
  };
  /**
   * A phone's first tap on a title chooses it: the sleeve, the room's colour
   * and, with sound on, the song through the wall, without the dwell. The
   * second tap on the same title opens Last.fm.
   */
  const tap = (e: MouseEvent, t: WeekTrack) => {
    if (e.detail === 0 || !touch.current) return;
    const key = keyOf(t);
    if (armed.current === key) return;
    e.preventDefault();
    // A song come back to, still sounding, is chosen already: this tap only readies the second.
    const sounding = !!hearing && !hearing.closing && hearing.key === key;
    if (!sounding) hush();
    armed.current = key;
    setActive(key);
    light.current?.choose(key, t.coverId);
    if (sounding) return;
    if (sfx.enabled) listen(t);
    else light.current?.commit(key, t.coverId);
  };
  const down = (e: PointerEvent) => {
    touch.current = e.pointerType === "touch";
  };
  /** A tap elsewhere lets go of the chosen song; a finger that only scrolls the page, wherever it lands, does not. */
  const tapAway = (e: MouseEvent) => {
    if (touch.current && active && !(e.target as Element).closest(".music-list a, .music-state a")) leave();
  };

  const fold = () => {
    openRef.current = targetRef.current;
    sfx.play(openRef.current ? "close" : "focus");
    go(liveRef.current && !openRef.current, !reduced);
    // After the turn, which lets go of any title: the word says what the next click does.
    cursor.current?.set(openRef.current ? "Now playing" : "The week");
  };

  return (
    <section ref={stage} className="stage stage-music" onPointerDown={down} onClick={tapAway}>
      {/* The room's light (see RoomLight and Spill): his song's spill, a preview's over it, the grain, and the fades. */}
      <div ref={lightBox} className="music-light" aria-hidden="true">
        <i className="music-spill">
          <i />
        </i>
        <i className="music-spill">
          <i />
        </i>
        <i className="music-grain" />
        <i className="music-fade music-fade-top" />
        <i className="music-fade music-fade-bottom" />
      </div>
      <div ref={scroll} className="music-scroll" onScroll={() => light.current?.place()}>
        {data && (
          <div className="music" data-room={room ? "" : undefined} data-folding={folding ? "" : undefined} style={{ "--after": glided ? `${AFTER_GLIDE}s` : "0s" } as CSSProperties}>
            <p className="music-heading mask" key={fact}>
              <span>
                {live ? (
                  <button
                    ref={foldButton}
                    type="button"
                    className="music-fold"
                    aria-expanded={!room}
                    aria-controls={room ? undefined : "music-week"}
                    onClick={fold}
                    onPointerEnter={() => {
                      onHeading.current = true;
                      cursor.current?.set(targetRef.current ? "The week" : "Now playing");
                    }}
                    onPointerLeave={() => {
                      onHeading.current = false;
                      cursor.current?.set(null);
                    }}
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

            <div ref={body} className="music-body">
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
                        onLoad={(e) => {
                          e.currentTarget.setAttribute("data-loaded", "");
                          learnTone(id, e.currentTarget);
                        }}
                        onError={() => missTone(id)}
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
                  inert={folding}
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
