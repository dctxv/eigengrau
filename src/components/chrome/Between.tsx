"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { TABS } from "@/content/site";
import { COLOR } from "@/lib/color";
import { mulberry32 } from "@/lib/threshold";
import { lastVisit } from "@/lib/visits";

/**
 * The space between the tabs (panel 2, N16). While the pages slide, and only
 * then, a sparse field of one-pixel stars a few levels above eigengrau goes by
 * at 0.35 of the row's motion: further off, so slower. It is a place, not an
 * effect. The tabs sit along one strip of sky, 0.35 of a screen apart, and a
 * slide shows the stretch of it between the two tabs it joins, seeded by the
 * visit, so the same stars pass every time and pass back the other way on the
 * way back.
 *
 * It lies over the row, because every stage paints its own opaque ground, and
 * under the tab bar, keeping out of its band. At rest the canvas is empty,
 * hidden and its pixels are given back: nothing runs, and Shell drives every
 * frame from the slide's own tween, so there is no loop of its own either.
 */

/** How far off: the stars move this share of the row's motion. */
const DEPTH = 0.35;
/** About this many in view at 1440 x 900; fewer on a small screen, a few more on a big one. */
const STARS = { count: 60, area: 1440 * 900, curve: 0.7, min: 16, max: 90 };
/**
 * How far above eigengrau each star lifts the pixel it is on, in levels of 255, with their
 * weights. About 9 is the least an ordinary LCD shows, so most sit either side of it and a thin
 * tail goes fainter for depth: on a good screen all of them, on a plain one still a field of
 * stars rather than a stray few. Nothing above 10, so it stays faint.
 */
const LEVELS: readonly (readonly [level: number, weight: number])[] = [
  [5, 0.5],
  [6, 1],
  [7, 2],
  [8, 2.5],
  [9, 2.5],
  [10, 1.5],
];
/**
 * A star is white at the alpha that lifts eigengrau by exactly its level. At alphas this small,
 * white is the colour that survives the canvas's 8-bit premultiplied store: ink would round its
 * steps out of order. The lift per unit of alpha is what eigengrau leaves below white.
 */
const LIFT = (255 - parseInt(COLOR.bg.slice(1, 3), 16)) / 255;
/**
 * The field comes up over this share of the row's travel and goes over the same share at its end,
 * so it is only there while the pages visibly move: never a sky standing over a page at rest.
 */
const FADE = 0.025;
/** Clear of the tab bar by the gutter (CSS px). */
const CLEAR = 8;
/** Best-candidate tries per star: a little evenness, so no two stars clump into one blob. */
const TRIES = 4;

export type BetweenHandle = {
  /** A slide is about to start from tab `from` to tab `to` (indices); the row will travel `travel` px. */
  begin(from: number, to: number, travel: number): void;
  /** A frame of it: the row has moved `shift` px so far (negative leftward). */
  step(shift: number): void;
  /** Over, or cut short by another tab: nothing stays. */
  end(): void;
};

/** A strip of sky in CSS px: x from the first tab's place, y from the viewport's top, and each star's level. */
type Sky = { x: Float32Array; y: Float32Array; level: Uint8Array };

type Run = {
  ctx: CanvasRenderingContext2D;
  /** Stars in device px, sorted by level, and where each level's run starts. */
  x: Int32Array;
  y: Int32Array;
  runs: { level: number; from: number; to: number }[];
  /** The view's left edge on the strip when the row has not yet moved (CSS px), and the row's whole travel. */
  start: number;
  travel: number;
  dpr: number;
  size: number;
  /** What the last frame drew: the view's offset (device px) and the fade, so a frame that changes nothing draws nothing. */
  drawn: { off: number; fade: number };
  /** Stops listening for a resized window or a new screen: the stars were laid out for the old ones. */
  unwatch: () => void;
};

/** The visit's number: when the last visit ended, which stays put for the whole visit, reloads included. */
function visitSeed(): number {
  const s = String(lastVisit() ?? "first");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** How many are in view at once for this screen. */
function inView(w: number, h: number): number {
  const n = STARS.count * Math.pow((w * h) / STARS.area, STARS.curve);
  return Math.round(Math.min(STARS.max, Math.max(STARS.min, n)));
}

function pickLevel(r: number): number {
  const total = LEVELS.reduce((s, [, wt]) => s + wt, 0);
  let acc = 0;
  for (const [level, wt] of LEVELS) {
    acc += wt / total;
    if (r < acc) return level;
  }
  return LEVELS[LEVELS.length - 1][0];
}

/**
 * The visit's strip of sky for a screen `w` x `h`: long enough for the view to travel from the
 * first tab's place to the last one's, the same stars for the same seed and size.
 */
function makeSky(seed: number, w: number, h: number): Sky {
  const length = (TABS.length - 1) * DEPTH * w + w;
  const tall = Math.max(1, h - 1);
  const n = Math.round((inView(w, h) * length) / w);
  const rng = mulberry32(seed);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const level = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let bx = 0;
    let by = 0;
    let best = -1;
    for (let k = 0; k < TRIES; k++) {
      const cx = rng() * length;
      const cy = rng() * tall;
      let near = Infinity;
      for (let j = 0; j < i; j++) {
        const d = (x[j] - cx) ** 2 + (y[j] - cy) ** 2;
        if (d < near) near = d;
      }
      if (near > best) {
        best = near;
        bx = cx;
        by = cy;
      }
    }
    x[i] = bx;
    y[i] = by;
    level[i] = pickLevel(rng());
  }
  return { x, y, level };
}

/** Eased in and out: 0 at either end of the row's travel (`p`, 0 to 1), 1 through its middle. */
function fadeAt(p: number): number {
  const u = Math.min(1, Math.max(0, Math.min(p, 1 - p) / FADE));
  return u * u * (3 - 2 * u);
}

export function Between({ ref }: { ref: Ref<BetweenHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const skyRef = useRef<{ key: string; sky: Sky } | null>(null);

  useImperativeHandle(ref, () => {
    const end = () => {
      const canvas = canvasRef.current;
      const r = runRef.current;
      runRef.current = null;
      r?.unwatch();
      if (!canvas) return;
      canvas.removeAttribute("data-on");
      // give the pixels back: at rest there is nothing here at all
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.width = "";
      canvas.style.height = "";
    };

    const begin = (from: number, to: number, travel: number) => {
      end();
      const canvas = canvasRef.current;
      const box = canvas?.parentElement;
      if (!canvas || !box || from < 0 || to < 0 || from === to) return;
      const { width: w, height: h } = box.getBoundingClientRect();
      const key = `${w}x${h}`;
      if (skyRef.current?.key !== key) skyRef.current = { key, sky: makeSky(visitSeed(), w, h) };
      const sky = skyRef.current.sky;
      // The tab bar's band stays clear: the sky goes on behind it, unseen.
      const nav = document.querySelector<HTMLElement>("[data-navbar]");
      const top = nav ? nav.offsetTop + nav.offsetHeight + CLEAR : 0;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // Shown at exactly its backing's size from the viewport's corner, so each of its pixels is one
      // of the screen's. Stretched to the box instead, 899 CSS px at 150% (1348.5 device px) would
      // resample the whole canvas and smear every star across two rows at mixed levels.
      canvas.style.width = `${canvas.width / dpr}px`;
      canvas.style.height = `${canvas.height / dpr}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return end();
      ctx.fillStyle = "#fff";

      // Each star on whole device pixels once, so the field moves as one and stays crisp; none on
      // the last row when the screen covers only part of it (899 CSS px at 150% ends mid-pixel).
      const size = Math.max(1, Math.round(dpr));
      const floor = Math.floor(h * dpr) - size;
      const order = Array.from(sky.level.keys())
        .filter((i) => sky.y[i] >= top && Math.round(sky.y[i] * dpr) <= floor)
        .sort((a, b) => sky.level[a] - sky.level[b]);
      const x = new Int32Array(order.length);
      const y = new Int32Array(order.length);
      const runs: Run["runs"] = [];
      order.forEach((i, k) => {
        x[k] = Math.round(sky.x[i] * dpr);
        y[k] = Math.round(sky.y[i] * dpr);
        const level = sky.level[i];
        const last = runs[runs.length - 1];
        if (last?.level === level) last.to = k + 1;
        else runs.push({ level, from: k, to: k + 1 });
      });

      // The view travels DEPTH of the row's travel, centred between the two tabs' places on the
      // strip: next door, it ends where the next slide on starts; further, it passes the middle.
      const mid = ((from + to) / 2) * DEPTH * w;
      const dir = Math.sign(to - from);
      // Resized, zoomed or dragged to another screen mid-slide, the field no longer fits (its size,
      // the tab bar's clearance, the device pixels): that slide finishes without it. Rare, so no
      // relayout. A new screen changes the pixel ratio without a resize, hence the media query.
      const moved = () => {
        const now = box.getBoundingClientRect();
        if (now.width !== w || now.height !== h || (window.devicePixelRatio || 1) !== dpr) end();
      };
      const ratio = window.matchMedia(`(resolution: ${dpr}dppx)`);
      window.addEventListener("resize", moved);
      ratio.addEventListener("change", moved);
      runRef.current = {
        ctx,
        x,
        y,
        runs,
        start: mid - (dir * DEPTH * travel) / 2,
        travel,
        dpr,
        size,
        drawn: { off: NaN, fade: -1 },
        unwatch: () => {
          window.removeEventListener("resize", moved);
          ratio.removeEventListener("change", moved);
        },
      };
      canvas.setAttribute("data-on", "");
    };

    const step = (shift: number) => {
      const r = runRef.current;
      if (!r) return;
      const off = Math.round((r.start - DEPTH * shift) * r.dpr);
      const fade = fadeAt(Math.abs(shift) / r.travel);
      if (off === r.drawn.off && fade === r.drawn.fade) return;
      r.drawn = { off, fade };
      const { ctx, x, y, size } = r;
      const cw = ctx.canvas.width;
      ctx.clearRect(0, 0, cw, ctx.canvas.height);
      if (fade <= 0) return;
      for (const run of r.runs) {
        // whole steps of the 8-bit alpha, so each level lands where it says
        const a = Math.round((run.level * fade) / LIFT);
        if (a <= 0) continue;
        ctx.globalAlpha = a / 255;
        for (let k = run.from; k < run.to; k++) {
          const sx = x[k] - off;
          if (sx > -size && sx < cw) ctx.fillRect(sx, y[k], size, size);
        }
      }
    };

    return { begin, step, end };
  }, []);

  return <canvas ref={canvasRef} className="between" width={0} height={0} aria-hidden="true" />;
}
