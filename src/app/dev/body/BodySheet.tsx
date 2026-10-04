"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { URCHI_BOX, createUrchi, preloadSuit, type UrchiCharacter } from "@/engine/urchi/character";

const BG = "#ffffff";
const INK = "#16161d";

/**
 * Urchi without the suit, held still: the head's angles and lids through the query knobs every
 * page already has (they fix the head and stop its breath, tilts and darts), set on the address
 * for the moment it is made; the rest through its API.
 */
function still(q: URLSearchParams, boxPx: number, smooth: boolean): UrchiCharacter {
  const was = location.search, knobs = new URLSearchParams(was);
  for (const k of ["yaw", "pitch", "roll", "blink"]) knobs.set(k, q.get(k) ?? "0");
  history.replaceState(history.state, "", `?${knobs}`);
  let ch: UrchiCharacter;
  try {
    ch = createUrchi({ smooth, input: false }, { bare: true, turn: Number(q.get("turn")) || 0 });
  } finally {
    history.replaceState(history.state, "", was || location.pathname);
  }
  ch.setSuit(1);
  if (boxPx > 0) ch.setResolution(boxPx);
  for (let i = 0; i < 60; i++) ch.update(0.05);
  return ch;
}

/** Where a character's painting reaches, in mesh units: [left, top, right, bottom] (from its canvas's alpha). */
function bounds(ch: UrchiCharacter): [number, number, number, number] {
  const c = ch.canvas, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, f = ch.frame, cell = f.w / c.width;
  let l = c.width, t = c.height, r = 0, b = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (px[(y * c.width + x) * 4 + 3] <= 8) continue;
    if (x < l) l = x;
    if (x > r) r = x;
    if (y < t) t = y;
    b = y;
  }
  return [f.x + l * cell, f.y + t * cell, f.x + (r + 1) * cell, f.y + (b + 1) * cell];
}

/** The figure, as large as the screen allows with a margin round it, centred. */
function draw(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const q = new URLSearchParams(location.search), pixel = q.has("pixel");
  const probe = still(q, 600, true), [l, t, r, b] = bounds(probe);
  probe.dispose();
  // device px per mesh unit: the figure 86% of the screen's height, or of its width if that is less
  const unit = Math.min((H * 0.86) / (b - t), (W * 0.86) / (r - l));
  const ch = still(q, pixel ? 0 : URCHI_BOX.w * unit, !pixel), f = ch.frame;
  g.imageSmoothingEnabled = !pixel;
  g.drawImage(ch.canvas, (W - (r - l) * unit) / 2 - (l - f.x) * unit, (H - (b - t) * unit) / 2 - (t - f.y) * unit, f.w * unit, f.h * unit);
  g.imageSmoothingEnabled = true;
  ch.dispose();
}

/** The turnaround (?view=sides): every 45 degrees of the whole figure's turn, labelled. */
const SIDES: [string, number][] = [
  ["FRONT", 0], ["FRONT 3/4", 45], ["LEFT SIDE", 90], ["BACK 3/4", 135],
  ["BACK", 180], ["BACK 3/4", 225], ["RIGHT SIDE", 270], ["FRONT 3/4", 315],
];

/**
 * The figure from all sides, at one scale (so they compare), four across on a wide screen and two
 * on a tall one, each centred in its cell over its label, standing on one ground line per row.
 */
function drawSides(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const at = (turn: number) => { const q = new URLSearchParams(location.search); q.set("turn", String(turn)); return q; };
  // each view's reach, and the largest of them, from a probe of each
  const reach = SIDES.map(([, turn]) => { const p = still(at(turn), 400, true), b = bounds(p); p.dispose(); return b; });
  const wide = Math.max(...reach.map(([l, , r]) => r - l)), top = Math.min(...reach.map((b) => b[1])), bottom = Math.max(...reach.map((b) => b[3]));
  const cols = W < H ? 2 : 4, rows = SIDES.length / cols, cw = W / cols, rh = H / rows, labelPx = Math.round(13 * dpr);
  const unit = Math.min((rh - labelPx * 3) * 0.9 / (bottom - top), (cw * 0.9) / wide);
  SIDES.forEach(([name, turn], i) => {
    const [l, , r] = reach[i], cx = cw * (i % cols + 0.5), y0 = rh * Math.floor(i / cols) + (rh - labelPx * 3 - (bottom - top) * unit) / 2;
    const ch = still(at(turn), URCHI_BOX.w * unit, true), f = ch.frame;
    g.drawImage(ch.canvas, cx - ((l + r) / 2 - f.x) * unit, y0 - (top - f.y) * unit, f.w * unit, f.h * unit);
    ch.dispose();
    g.font = `500 ${labelPx}px Grotesk, ui-sans-serif, system-ui, sans-serif`;
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText(`${name}  ${turn}°`, cx, y0 + (bottom - top) * unit + labelPx * 0.8);
  });
}

const noSubscribe = () => () => {};

export function BodySheet() {
  const ref = useRef<HTMLCanvasElement>(null);
  // the page's body, once there is one (nothing on the server)
  const host = useSyncExternalStore(noSubscribe, () => document.body, () => null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let alive = true, ready = false;
    const paint = () => {
      if (!alive || !ready) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(innerWidth * dpr);
      c.height = Math.round(innerHeight * dpr);
      const g = c.getContext("2d")!;
      if (new URLSearchParams(location.search).get("view") === "sides") drawSides(g, c.width, c.height, dpr);
      else draw(g, c.width, c.height);
      document.documentElement.dataset.sheet = "ready";
    };
    // after the fonts (the labels are set in the site's own) and the suit's model (the body hangs from its neck)
    Promise.all([document.fonts.ready, preloadSuit()]).then(() => { ready = true; paint(); });
    addEventListener("resize", paint);
    return () => { alive = false; removeEventListener("resize", paint); };
  }, [host]);
  // over the whole page, the tab bar included (the route's own slot sits inside the sliding row)
  const sheet = (
    <div data-body-sheet="" style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: BG }}>
      <canvas ref={ref} style={{ width: "100vw", height: "100vh", display: "block" }} />
    </div>
  );
  return host ? createPortal(sheet, host) : null;
}
