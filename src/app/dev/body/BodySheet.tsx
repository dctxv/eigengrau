"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { URCHI_BOX, createUrchi, preloadSuit, type UrchiCharacter } from "@/engine/urchi/character";

const BG = "#ffffff";

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
      draw(c.getContext("2d")!, c.width, c.height);
      document.documentElement.dataset.sheet = "ready";
    };
    preloadSuit().then(() => { ready = true; paint(); });
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
