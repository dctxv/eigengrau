"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { URCHI_BOX, URCHI_FRAME, URCHI_HEAD, URCHI_SUIT_FRAME, createUrchi, type UrchiCharacter, type UrchiOptions } from "@/engine/urchi/character";

/** A pose to hold: the head's angles (degrees), the whole figure's turn, the lids, the suit. */
type Shot = {
  yaw?: number;
  pitch?: number;
  roll?: number;
  turn?: number;
  suit?: number;
  blink?: number;
  rest?: number;
  lids?: [number, number];
  wide?: number;
  smooth?: boolean;
  layer?: UrchiOptions["suitLayer"];
  part?: UrchiOptions["suitPart"];
};
/** A window onto the figure, in mesh units. */
type Win = { x: number; y: number; w: number; h: number };

const FIGURE: Win = { x: -660, y: -400, w: 1320, h: 2000 };
const HELMET: Win = { x: -610, y: -410, w: 1220, h: 1040 };
const INK = "#e9e9e2";
const BG = "#16161d";

/**
 * A character held still in a pose. The head's angles and lids go in through the query knobs
 * every page already has (?yaw, ?pitch, ?roll, ?blink: they fix the head and stop its breath,
 * tilts and darts), set on the address for the moment it is made; the rest through its API.
 */
function still(shot: Shot, boxPx: number): UrchiCharacter {
  const was = location.search;
  const q = new URLSearchParams(was);
  q.set("yaw", String(shot.yaw ?? 0));
  q.set("pitch", String(shot.pitch ?? 0));
  q.set("roll", String(shot.roll ?? 0));
  q.set("blink", String(shot.blink ?? 0));
  history.replaceState(history.state, "", `?${q}`);
  let ch: UrchiCharacter;
  try {
    ch = createUrchi({ smooth: shot.smooth ?? true, input: false, suitLayer: shot.layer, suitPart: shot.part });
  } finally {
    history.replaceState(history.state, "", was || location.pathname);
  }
  ch.setSuit(shot.suit ?? 1);
  ch.setTurn(shot.turn ?? 0);
  if (boxPx > 0) ch.setResolution(boxPx);
  if (shot.rest) ch.setRestLid(shot.rest);
  if (shot.lids) ch.setLids(shot.lids[0], shot.lids[1], 0);
  for (let i = 0; i < 60; i++) ch.update(0.05);
  if (shot.wide) {
    ch.widen(shot.wide, 100);
    for (let i = 0; i < 30; i++) ch.update(0.05);
  }
  return ch;
}

/** Draws a window of a character's canvas into a context, `h` px tall (device px), its top left at (dx, dy). */
function blit(g: CanvasRenderingContext2D, ch: UrchiCharacter, win: Win, dx: number, dy: number, h: number) {
  const f = ch.frame, cell = (f.w / ch.canvas.width + f.h / ch.canvas.height) / 2, s = h / win.h;
  g.drawImage(ch.canvas, (win.x - f.x) / cell, (win.y - f.y) / cell, win.w / cell, win.h / cell, dx, dy, win.w * s, h);
}

/** The box width in canvas px that paints a window `h` device px tall at its own resolution. */
const boxFor = (win: Win, h: number) => (URCHI_BOX.w * h) / win.h;

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, px: number) {
  g.font = `500 ${px}px Grotesk, ui-sans-serif, system-ui, sans-serif`;
  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillText(text, x, y);
}

/** The sheet, laid out as the reference: four views of the figure over four looks of the helmet. */
function drawSheet(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const views: [string, Shot][] = [
    ["FRONT VIEW", {}],
    ["3/4 VIEW", { turn: 35 }],
    ["SIDE VIEW", { turn: 90 }],
    ["BACK VIEW", { turn: 180 }],
  ];
  const looks: [string, Shot][] = [
    ["DEADPAN", { rest: 0.5, part: "helmet", yaw: 12, pitch: 3 }],
    ["WIDE", { wide: 0.12, part: "helmet", yaw: 12, pitch: 3 }],
    ["CLOSED", { lids: [1, 1], part: "helmet", yaw: 12, pitch: 3 }],
    ["HALF-OPEN", { lids: [0.3, 0.3], part: "helmet", yaw: 12, pitch: 3 }],
  ];
  // four across on a wide screen, as the reference; two across on a tall one
  const cols = W < H ? 2 : 4, rows = 4 / cols, colW = W / cols;
  const labelPx = Math.round(Math.min(H * 0.026, colW * 0.09));
  // the figures' rows get 0.64 of the height the close-ups' rows get 0.36 of, less their labels
  const figRowH = (H * 0.62) / rows, lookRowH = (H * 0.38) / rows;
  const figH = Math.min(figRowH - labelPx * 1.8, (colW * 0.96 * FIGURE.h) / FIGURE.w);
  const helmH = Math.min(lookRowH - labelPx * 1.8, (colW * 0.96 * HELMET.h) / HELMET.w);
  const cell = (list: [string, Shot][], win: Win, h: number, rowH: number, top: number) => list.forEach(([name, shot], i) => {
    const x = colW * (i % cols), y = top + rowH * Math.floor(i / cols) + (rowH - h - labelPx * 1.6) / 2;
    const ch = still(shot, boxFor(win, h));
    blit(g, ch, win, x + (colW - (win.w * h) / win.h) / 2, y, h);
    ch.dispose();
    label(g, name, x + colW / 2, y + h + labelPx * 0.35, labelPx);
  });
  cell(views, FIGURE, figH, figRowH, 0);
  cell(looks, HELMET, helmH, lookRowH, H * 0.62);
}

/** Where a character's painting reaches, top to bottom, in mesh units (from its canvas's alpha). */
function reach(ch: UrchiCharacter): [number, number] {
  const c = ch.canvas, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, f = ch.frame, cell = f.h / c.height;
  let top = c.height, bottom = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) { top = Math.min(top, y); bottom = Math.max(bottom, y); break; }
  return [f.y + top * cell, f.y + (bottom + 1) * cell];
}

/**
 * The figure as small as it will be on other tabs: 150, 165 and 180px tall, rim to rim (the
 * helmet then about 64 to 76px), smooth above and in hard pixels below, on eigengrau.
 */
function drawSmall(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const labelPx = Math.round(13 * dpr);
  // the figure's reach and the helmet's, rim to rim, in mesh units, from one large painting
  const probe = still({ yaw: -12 }, 700), [top, bottom] = reach(probe);
  probe.dispose();
  const helmetProbe = still({ yaw: -12, part: "helmet" }, 700), [ht, hb] = reach(helmetProbe);
  helmetProbe.dispose();
  let x = 60 * dpr;
  for (const css of [150, 165, 180]) {
    const unit = (css * dpr) / (bottom - top), h = FIGURE.h * unit, w = FIGURE.w * unit;
    for (const [row, smooth] of [true, false].entries()) {
      const ch = still({ smooth, yaw: -12 }, URCHI_BOX.w * unit);
      g.imageSmoothingEnabled = smooth;
      blit(g, ch, FIGURE, x, (70 + row * 250) * dpr - (top - FIGURE.y) * unit, h);
      g.imageSmoothingEnabled = true;
      ch.dispose();
    }
    label(g, `${css}px (helmet ${Math.round(((hb - ht) * css) / (bottom - top))}px)`, x + w / 2, 30 * dpr, labelPx);
    x += w + 30 * dpr;
  }
}

/**
 * The bare head as big as it is on Space (0.48 of a 900px screen, ear tip to chin) beside the
 * suited figure at the same scale, and the suited figure as tall as that head.
 */
function drawSpace(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const labelPx = Math.round(13 * dpr);
  const unitPx = (0.48 * 900 * dpr) / (URCHI_HEAD.bottom - URCHI_HEAD.top);
  const HEADWIN: Win = { x: -530, y: -520, w: 1060, h: 1060 };
  const top = 30 * dpr;
  let x = 20 * dpr;
  {
    const ch = still({ suit: 0 }, URCHI_BOX.w * unitPx);
    blit(g, ch, HEADWIN, x, top, HEADWIN.h * unitPx);
    ch.dispose();
    label(g, "the head on Space today", x + (HEADWIN.w * unitPx) / 2, 8 * dpr, labelPx);
    x += HEADWIN.w * unitPx + 10 * dpr;
  }
  {
    // the same scale: the helmet the size of today's head, the body running off the bottom
    const ch = still({}, URCHI_BOX.w * unitPx), win = { ...FIGURE, x: -545, w: 1090 };
    blit(g, ch, win, x, top + (FIGURE.y - HEADWIN.y) * unitPx, FIGURE.h * unitPx);
    ch.dispose();
    label(g, "suited, the same scale", x + (win.w * unitPx) / 2, 8 * dpr, labelPx);
    x += win.w * unitPx + 10 * dpr;
  }
  {
    // the whole figure, rim to rim, as tall as today's head, its top level with the ear tips
    const probe = still({ yaw: -12 }, 700), [t0, b0] = reach(probe);
    probe.dispose();
    const unit = (0.48 * 900 * dpr) / (b0 - t0), h = FIGURE.h * unit;
    const ch = still({ yaw: -12 }, URCHI_BOX.w * unit);
    blit(g, ch, FIGURE, x, top + (URCHI_HEAD.top - HEADWIN.y) * unitPx - (t0 - FIGURE.y) * unit, h);
    ch.dispose();
    label(g, "suited, as tall as that head", x + (FIGURE.w * unit) / 2, 8 * dpr, labelPx);
  }
}

/**
 * The three.js host (Urchi.ts) with the suit on: the plane follows the taller frame, the head stays
 * where the host put it, the canvas keeps the host's budget, and hit() finds the suited figure.
 */
async function runHost(W: number, H: number, dpr: number) {
  const THREE = await import("three");
  const { Urchi } = await import("@/engine/urchi/Urchi");
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(W / dpr, H / dpr);
  renderer.setClearColor(BG, 1);
  Object.assign(renderer.domElement.style, { position: "absolute", inset: "0" });
  document.querySelector("[data-suit-sheet]")!.appendChild(renderer.domElement);
  const w = W / dpr, h = H / dpr;
  const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -10, 10);
  const scene = new THREE.Scene();
  const hosts = [[-w / 4, false], [w / 4, true]].map(([x, suited]) => {
    const u = new Urchi({ rim: [2, 3.5] });
    u.width = 300; u.pixelRatio = dpr; u.appear = 1;
    u.mesh.position.set(x as number, h / 2 - 190, 0);
    if (suited) u.setSuit(1);
    scene.add(u.mesh);
    return u;
  });
  for (let i = 0; i < 30; i++) { hosts.forEach((u) => u.update(1 / 30)); }
  renderer.render(scene, camera);
  const suited = hosts[1], head = hosts[0];
  const at = (u: typeof suited, dx: number, dy: number) => u.hit(u.mesh.position.x + dx, u.mesh.position.y + dy);
  const result = {
    headCanvas: `${head.character.canvas.width}x${head.character.canvas.height}`,
    suitCanvas: `${suited.character.canvas.width}x${suited.character.canvas.height}`,
    suitPlane: [Math.round(suited.mesh.scale.x), Math.round(suited.mesh.scale.y)],
    headPlane: [Math.round(head.mesh.scale.x), Math.round(head.mesh.scale.y)],
    // on the helmet, the chest, a boot; and beside the figure, where the bare head's ear would be above
    hits: { helmet: at(suited, 0, 0), chest: at(suited, 0, -195), boot: at(suited, 41, -400), beside: at(suited, 230, -300), bareHeadChest: at(head, 0, -195), bareHeadEar: at(head, 110, 115) },
  };
  (window as unknown as { __host: typeof result }).__host = result;
  return result;
}

/** One figure as large as the screen allows: ?turn= (the whole figure), ?hy= ?hp= ?hr= (the head), ?part=helmet. */
function drawOne(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const q = new URLSearchParams(location.search), num = (k: string) => Number(q.get(k)) || 0;
  const helmet = q.get("part") === "helmet", win = helmet ? HELMET : FIGURE;
  const h = Math.min(H * 0.96, (W * 0.96 * win.h) / win.w);
  const pixel = q.has("pixel");
  const ch = still({ turn: num("turn"), yaw: num("hy"), pitch: num("hp"), roll: num("hr"), part: helmet ? "helmet" : undefined, smooth: !pixel }, pixel ? 0 : boxFor(win, h));
  g.imageSmoothingEnabled = !pixel;
  blit(g, ch, win, (W - (win.w * h) / win.h) / 2, (H - h) / 2, h);
  g.imageSmoothingEnabled = true;
  ch.dispose();
}

/** The suit building itself, setSuit from nothing to all of it: outward from the neck ring, the ears and spikes folding in. */
function drawReveal(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const steps = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
  const cw = W / steps.length, h = Math.min(H * 0.92, (cw * FIGURE.h) / FIGURE.w);
  steps.forEach((suit, i) => {
    const ch = still({ suit, yaw: -10 }, boxFor(FIGURE, h));
    blit(g, ch, FIGURE, i * cw + (cw - (FIGURE.w * h) / FIGURE.h) / 2, 0, h);
    ch.dispose();
    label(g, `setSuit(${suit})`, (i + 0.5) * cw, h, Math.round(11 * dpr));
  });
}

/** The head's looks, and the body following a third of its turn and half its tilt, never its nod. */
function drawFollow(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const looks: Shot[] = [{ yaw: -41, pitch: -8 }, { yaw: -20, pitch: 10, roll: -12 }, { yaw: 0 }, { yaw: 22, pitch: -15, roll: 14 }, { yaw: 41, pitch: 12 }, { yaw: 12, roll: -20 }];
  const cw = W / looks.length, h = Math.min(H * 0.92, (cw * FIGURE.h) / FIGURE.w);
  looks.forEach((p, i) => {
    const ch = still(p, boxFor(FIGURE, h));
    blit(g, ch, FIGURE, i * cw + (cw - (FIGURE.w * h) / FIGURE.h) / 2, 0, h);
    ch.dispose();
    label(g, `yaw ${p.yaw ?? 0} pitch ${p.pitch ?? 0} roll ${p.roll ?? 0}`, (i + 0.5) * cw, h, Math.round(11 * dpr));
  });
}

/** The figure turned all the way round, 30 degrees at a time. */
function drawTurn(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const cols = 6, rows = 2, cw = W / cols, rh = H / rows, h = Math.min(rh * 0.9, (cw * FIGURE.h) / FIGURE.w);
  for (let i = 0; i < 12; i++) {
    const turn = i * 30;
    const ch = still({ turn }, boxFor(FIGURE, h));
    const x = (i % cols) * cw + (cw - (FIGURE.w * h) / FIGURE.h) / 2, y = Math.floor(i / cols) * rh;
    blit(g, ch, FIGURE, x, y, h);
    ch.dispose();
    label(g, `turn ${turn}`, (i % cols + 0.5) * cw, y + h, Math.round(11 * dpr));
  }
}

/** The helmet at the far corners of what the head can do: the eyes stay whole in the visor, nothing pokes out. */
function drawPoses(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const poses: Shot[] = [];
  for (const pitch of [-42, 0, 34]) for (const yaw of [-56, -40, 0, 40, 56]) poses.push({ yaw, pitch, roll: (yaw || 1) * pitch >= 0 ? 22 : -22, wide: 0.12, part: "helmet" });
  const WIN: Win = { x: -660, y: -560, w: 1320, h: 1220 };
  const cols = 5, rows = 3, cw = W / cols, rh = H / rows, h = Math.min(rh * 0.9, (cw * WIN.h) / WIN.w);
  poses.forEach((p, i) => {
    const ch = still(p, boxFor(WIN, h));
    const x = (i % cols) * cw + (cw - (WIN.w * h) / WIN.h) / 2, y = Math.floor(i / cols) * rh;
    blit(g, ch, WIN, x, y, h);
    ch.dispose();
    label(g, `yaw ${p.yaw} pitch ${p.pitch} roll ${p.roll}`, (i % cols + 0.5) * cw, y + h, Math.round(11 * dpr));
  });
}

/**
 * The leak check: over a sweep of poses across everything the head can do (and past it), paints
 * the head as the suit shows it and the helmet's silhouette, each alone, and counts head pixels
 * outside the helmet (must be none); the same for the head with its ears and spikes tucked but
 * not clipped (the fit itself), and for the eyes against the glass the rim and discs leave (the
 * visor frames them whole).
 */
function runLeak(g: CanvasRenderingContext2D, W: number, H: number) {
  const poses: Shot[] = [];
  for (const yaw of [-56, -40, -20, 0, 20, 40, 56]) for (const pitch of [-42, -25, -10, 0, 12, 34]) for (const roll of [-22, 0, 22]) poses.push({ yaw, pitch, roll });
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 110; i++) poses.push({ yaw: -56 + 112 * rnd(), pitch: -42 + 76 * rnd(), roll: -22 + 44 * rnd(), blink: rnd() < 0.3 ? rnd() : 0, wide: rnd() < 0.3 ? 0.12 : 0 });
  const box = 520;
  const count = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
    let n = 0, total = 0;
    for (let k = 3; k < a.length; k += 4) if (a[k] > 0) { total++; if (b[k] === 0) n++; }
    return [n, total];
  };
  const pixels = (shot: Shot) => {
    const ch = still(shot, box);
    const c = ch.canvas, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    ch.dispose();
    return px;
  };
  const out = {
    poses: poses.length,
    clipped: { leaks: 0, worst: 0, headPixels: 0 },
    tucked: { leaks: 0, worst: 0 },
    eyes: { outside: 0, worst: 0, eyePixels: 0 },
    fails: [] as string[],
    // controls, which must find leaks, or the check proves nothing: the bare head (ears and spikes
    // not tucked, not clipped; half a suit tucks nothing) and a helmet half built
    controls: { bareHead: 0, halfHelmet: 0, poses: 0 },
  };
  poses.forEach((p) => {
    const helmet = pixels({ ...p, layer: "helmet" });
    const [n, total] = count(pixels({ ...p, layer: "head" }), helmet);
    out.clipped.leaks += n; out.clipped.worst = Math.max(out.clipped.worst, n); out.clipped.headPixels += total;
    const [m] = count(pixels({ ...p, layer: "tucked" }), helmet);
    out.tucked.leaks += m; out.tucked.worst = Math.max(out.tucked.worst, m);
    const [e, et] = count(pixels({ ...p, layer: "eyes" }), pixels({ ...p, layer: "glass" }));
    out.eyes.outside += e; out.eyes.worst = Math.max(out.eyes.worst, e); out.eyes.eyePixels += et;
    if (out.controls.poses < 24) {
      out.controls.poses++;
      out.controls.bareHead += count(pixels({ ...p, suit: 0.5, layer: "tucked" }), helmet)[0];
      out.controls.halfHelmet += count(pixels({ ...p, layer: "head" }), pixels({ ...p, suit: 0.5, layer: "helmet" }))[0];
    }
    if (n || e) out.fails.push(`yaw ${p.yaw!.toFixed(1)} pitch ${p.pitch!.toFixed(1)} roll ${p.roll!.toFixed(1)}: ${n} head px outside the helmet, ${e} eye px off the glass`);
  });
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  (window as unknown as { __leak: typeof out }).__leak = out;
  return out;
}

/**
 * Paint time: many frames of a figure that moves (breath, drift, a turning head), in smooth paint.
 * `paint` is update() alone (the springs, the geometry and the canvas calls, which the browser
 * records); `flushed` adds a one-pixel read, so the canvas is rasterised inside the timing too.
 */
function runPerf() {
  type Stat = { median: number; p95: number };
  const res: Record<string, { paint: Stat; flushed: Stat; canvas: string }> = {};
  const stat = (t: number[]): Stat => { t.sort((a, b) => a - b); return { median: +t[t.length >> 1].toFixed(2), p95: +t[Math.floor(t.length * 0.95)].toFixed(2) }; };
  const measure = (name: string, suit: number, box: number) => {
    const ch = createUrchi({ smooth: true, input: false });
    ch.setSuit(suit);
    ch.setResolution(box);
    const g = ch.canvas.getContext("2d")!;
    const paint: number[] = [], flushed: number[] = [];
    for (let i = 0; i < 480; i++) {
      ch.lookAt(Math.sin(i / 20), Math.cos(i / 31) * 0.5);
      const t0 = performance.now();
      const painted = ch.update(1 / 60);
      const t1 = performance.now();
      g.getImageData(0, 0, 1, 1);
      const t2 = performance.now();
      if (painted && i >= 40) { paint.push(t1 - t0); flushed.push(t2 - t0); }
    }
    ch.dispose();
    res[name] = { paint: stat(paint), flushed: stat(flushed), canvas: `${ch.canvas.width}x${ch.canvas.height}` };
  };
  const long = Math.max(URCHI_SUIT_FRAME.w, URCHI_SUIT_FRAME.h);
  measure("head alone, box 1400 (the host's cap)", 0, 1400);
  measure("suited, canvas's long side 1400", 1, (1400 * URCHI_BOX.w) / long);
  measure("suited, the host's cap (long side as the head's at 1400)", 1, (1400 * Math.max(URCHI_FRAME.w, URCHI_FRAME.h)) / long);
  measure("suited, box 1400 (uncapped)", 1, 1400);
  (window as unknown as { __perf: typeof res }).__perf = res;
  return res;
}

const noSubscribe = () => () => {};

export function SuitSheet() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");
  // the page's body, once there is one (nothing on the server)
  const host = useSyncExternalStore(noSubscribe, () => document.body, () => null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    const view = new URLSearchParams(location.search).get("view") || "sheet";
    let alive = true;
    // after the fonts, so the labels are set in the site's own
    document.fonts.ready.then(() => {
      if (!alive) return;
      if (view === "small") drawSmall(g, W, H, dpr);
      else if (view === "space") drawSpace(g, W, H, dpr);
      else if (view === "poses") drawPoses(g, W, H, dpr);
      else if (view === "turn") drawTurn(g, W, H, dpr);
      else if (view === "follow") drawFollow(g, W, H, dpr);
      else if (view === "reveal") drawReveal(g, W, H, dpr);
      else if (view === "one") drawOne(g, W, H);
      else if (view === "host") { c.style.display = "none"; void runHost(W, H, dpr).then((r) => { setText(JSON.stringify(r, null, 2)); document.documentElement.dataset.sheet = "ready"; }); return; }
      else if (view === "leak") setText(JSON.stringify(runLeak(g, W, H), null, 2));
      else if (view === "perf") setText(JSON.stringify(runPerf(), null, 2));
      else if (view === "blank") (window as unknown as { __profileSuit: (n: number) => number }).__profileSuit = (n: number) => {
        const ch = createUrchi({ smooth: true, input: false });
        ch.setSuit(1);
        ch.setResolution((1400 * Math.max(URCHI_FRAME.w, URCHI_FRAME.h)) / Math.max(URCHI_SUIT_FRAME.w, URCHI_SUIT_FRAME.h));
        let t = 0;
        for (let i = 0; i < n; i++) { ch.lookAt(Math.sin(i / 20), Math.cos(i / 31) * 0.5); const t0 = performance.now(); ch.update(1 / 60); t += performance.now() - t0; }
        ch.dispose();
        return t / n;
      };
      else drawSheet(g, W, H);
      document.documentElement.dataset.sheet = "ready";
    });
    return () => { alive = false; };
  }, [host]);
  // over the whole page, the tab bar included (the route's own slot sits inside the sliding row)
  const sheet = (
    <div data-suit-sheet="" style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: BG }}>
      <canvas ref={ref} style={{ width: "100vw", height: "100vh", display: "block" }} />
      {text && <pre style={{ position: "absolute", left: 24, top: 24, color: INK, font: "12px/1.4 ui-monospace, monospace", whiteSpace: "pre-wrap", maxWidth: "90vw" }}>{text}</pre>}
    </div>
  );
  return host ? createPortal(sheet, host) : null;
}
