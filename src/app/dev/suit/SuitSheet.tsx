"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { URCHI_BOX, URCHI_FRAME, URCHI_HEAD, URCHI_SUIT_FRAME, createUrchi, preloadSuit, suitRigData, type UrchiCharacter, type UrchiDevOptions } from "@/engine/urchi/character";
import { FLOAT, QUIRKS, quirkPose, type Pose, type QuirkName, type RigData, type Side } from "@/engine/urchi/limbs";

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
  layer?: UrchiDevOptions["suitLayer"];
  part?: UrchiDevOptions["suitPart"];
  /** The limbs held in a pose: the `.R` side's, and the `.L` side's (the same if left out). */
  limbs?: [Pose, Pose?];
};
/** A window onto the figure, in mesh units. */
type Win = { x: number; y: number; w: number; h: number };

const FIGURE: Win = { x: -660, y: -400, w: 1320, h: 2000 };
const HELMET: Win = { x: -610, y: -410, w: 1220, h: 1040 };
/** The figure in any pose of the head and any turn of its own: the suit's canvas frame itself, so nothing is ever cut off. */
const WHOLE: Win = { ...URCHI_SUIT_FRAME };
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
    ch = createUrchi({ smooth: shot.smooth ?? true, input: false }, { suitLayer: shot.layer, suitPart: shot.part, turn: shot.turn ?? 0 });
  } finally {
    history.replaceState(history.state, "", was || location.pathname);
  }
  ch.setSuit(shot.suit ?? 1);
  if (shot.limbs) ch.limbs?.hold(shot.limbs[0], shot.limbs[1]);
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

/** A label centred on x, its top at y, `px` tall, or smaller if it would be wider than `fit`. */
function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, fit = Infinity) {
  const font = (size: number) => `500 ${size}px Grotesk, ui-sans-serif, system-ui, sans-serif`;
  g.font = font(px);
  const wide = g.measureText(text).width;
  if (wide > fit) g.font = font(Math.max(6, Math.floor((px * fit) / wide)));
  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillText(text, x, y);
}

/**
 * `n` figures, a window `win` each with a label under it, laid out in whichever number of columns
 * shows them largest on a W x H screen (a short last row centred): for cell i, where its figure
 * goes (top left, width, height) and where its label goes (middle, top, the width it may take).
 */
function tiles(n: number, W: number, H: number, win: Win, labelPx: number) {
  let cols = 1, h = 0;
  for (let c = 1; c <= n; c++) {
    const rows = Math.ceil(n / c), fit = Math.min(H / rows - labelPx * 2.2, ((W / c) * 0.94 * win.h) / win.w);
    if (fit > h) { h = fit; cols = c; }
  }
  const rows = Math.ceil(n / cols), cw = W / cols, rh = H / rows, w = (win.w * h) / win.h;
  return (i: number) => {
    const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols, c = i % cols;
    const mid = (W - inRow * cw) / 2 + (c + 0.5) * cw, y = r * rh + (rh - h - labelPx * 1.8) / 2;
    return { x: mid - w / 2, y, w, h, labelX: mid, labelY: y + h + labelPx * 0.4, fit: cw * 0.96 };
  };
}

/** Each shot painted in its tile, labelled. */
function drawTiles(g: CanvasRenderingContext2D, W: number, H: number, dpr: number, win: Win, shots: [string, Shot][]) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const labelPx = Math.round(12 * dpr), at = tiles(shots.length, W, H, win, labelPx);
  shots.forEach(([name, shot], i) => {
    const t = at(i), ch = still(shot, boxFor(win, t.h));
    blit(g, ch, win, t.x, t.y, t.h);
    ch.dispose();
    label(g, name, t.labelX, t.labelY, labelPx, t.fit);
  });
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

/**
 * The limbs' poses (?view=limbs): the modelled pose, zero gravity's posture and each quirk's pose at
 * its height, facing you; and some of them turned (?turn=35), so what goes in front of what shows.
 */
/** Each quirk's pose part way through (seconds), over zero gravity's posture, its doing side the `.R` one. */
const LIMB_AT: [QuirkName, number][] = [["wave", 1.3], ["inspect", 2.6], ["tap", 1.3], ["stretch", 1.8], ["clap", 0.95], ["cheeks", 1.5], ["fidget", 1.5], ["cross", 3], ["swing", 1.3], ["swim", 1.1], ["splay", 0.8], ["brace", 0.7], ["curl", 1]];
const limbPoses = (rig: RigData): [string, Pose, Pose?][] => [
  ["REST", {}],
  ["FLOAT", FLOAT],
  ...LIMB_AT.map(([n, t]): [string, Pose, Pose] => [n.toUpperCase(), { ...FLOAT, ...quirkPose(rig, n, t, 0) }, { ...FLOAT, ...quirkPose(rig, n, t, 1) }]),
  ["BACK", { shFlex: -45, shAbd: 20, elbow: 30, hipFlex: -30, ankle: -30 }],
];
function drawLimbs(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const q = new URLSearchParams(location.search), turn = Number(q.get("turn")) || 0, only = q.get("pose");
  const all = limbPoses(suitRigData()!), list = only ? all.filter(([n]) => n === only.toUpperCase()) : all;
  const cols = Math.min(list.length, Math.max(1, Math.round(Math.sqrt((list.length * W) / H * (WHOLE.h / WHOLE.w))))), rows = Math.ceil(list.length / cols);
  const labelPx = Math.round(12 * dpr), cellW = W / cols, cellH = H / rows, h = Math.min(cellH - labelPx * 2, (cellW * WHOLE.h) / WHOLE.w);
  list.forEach(([name, R, L], i) => {
    const x = cellW * (i % cols), y = cellH * Math.floor(i / cols);
    const ch = still({ turn, limbs: [R, L] }, boxFor(WHOLE, h));
    blit(g, ch, WHOLE, x + (cellW - (WHOLE.w * h) / WHOLE.h) / 2, y, h);
    ch.dispose();
    label(g, name, x + cellW / 2, y + h + labelPx * 0.2, labelPx);
  });
}

/**
 * A quirk as a film strip (?view=strip&quirk=wave&side=0&every=0.25&n=16&turn=0): the limbs afloat,
 * the quirk played at 0.5s, a frame every `every` seconds, stepped at 60Hz, left to right and down;
 * the head held facing you, or (?free) left to breathe and look where it looks.
 * ?push=ax,ay,for[,spin]: from 0.5s the body is felt accelerating that much (mesh units/s², its own
 * frame, y down) for `for` seconds (and spinning, rad/s), as a fling or a stop would.
 */
function drawStrip(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const q = new URLSearchParams(location.search), quirk = (q.get("quirk") || "wave") as QuirkName, side = (Number(q.get("side")) || 0) as Side;
  const every = Number(q.get("every")) || 0.25, n = Number(q.get("n")) || 16, turn = Number(q.get("turn")) || 0;
  const cols = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * W) / H * (WHOLE.h / WHOLE.w))))), rows = Math.ceil(n / cols);
  const labelPx = Math.round(11 * dpr), cellW = W / cols, cellH = H / rows, h = Math.min(cellH - labelPx * 2, (cellW * WHOLE.h) / WHOLE.w);
  // the head held facing you (?yaw=0: no breath, no look), the limbs left to move; ?free leaves the head its own
  const was = location.search, qq = new URLSearchParams(was);
  if (!qq.has("free")) { qq.set("yaw", "0"); qq.set("pitch", "0"); }
  history.replaceState(history.state, "", `?${qq}`);
  let ch: UrchiCharacter;
  try {
    ch = createUrchi({ smooth: true, input: false }, { turn });
  } finally {
    history.replaceState(history.state, "", was || location.pathname);
  }
  ch.setSuit(1);
  ch.setResolution(boxFor(WHOLE, h));
  const L = ch.limbs!;
  L.setMode("float");
  L.setLife(1);
  const [pax, pay, pfor, pspin] = (q.get("push") || "0,0,0,0").split(",").map(Number);
  let t = 0;
  const run = (to: number) => {
    while (t < to - 1e-9) {
      if (t >= 0.5 && t < 0.5 + (pfor || 0)) L.feel(pax || 0, pay || 0, 0, pspin || 0, 565);
      ch.update(1 / 60);
      t += 1 / 60;
    }
  };
  run(0.5);
  if (quirk in QUIRKS) L.play(quirk, side);
  for (let i = 0; i < n; i++) {
    run(0.5 + i * every);
    const x = cellW * (i % cols), y = cellH * Math.floor(i / cols);
    blit(g, ch, WHOLE, x + (cellW - (WHOLE.w * h) / WHOLE.h) / 2, y, h);
    label(g, `${(i * every).toFixed(2)}s`, x + cellW / 2, y + h + labelPx * 0.2, labelPx);
  }
  ch.dispose();
}

/**
 * A film of it afloat (?view=film&seed=7&fps=30&turn=0): from a seeded start (every draw of its own
 * and its head's the same each time), stepped at 60Hz, a frame every 1/fps seconds, drawn on the
 * sheet and handed over as a JPEG by window.__filmFrame(); the head its own (breathing, blinking,
 * tilting, looking ahead), the limbs zero gravity's posture, its drift and the quirks it picks.
 */
function runFilm(g: CanvasRenderingContext2D, W: number, H: number) {
  const q = new URLSearchParams(location.search), fps = Number(q.get("fps")) || 30, turn = Number(q.get("turn")) || 0;
  let seed = Number(q.get("seed")) || 7;
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const h = Math.min(H * 0.94, (W * 0.94 * WHOLE.h) / WHOLE.w);
  const ch = createUrchi({ smooth: true, input: false }, { turn });
  ch.setSuit(1);
  ch.setResolution(boxFor(WHOLE, h));
  const L = ch.limbs!;
  L.setMode("float");
  L.setLife(1);
  let t = 0, frame = 0;
  (window as unknown as { __filmFrame: () => string }).__filmFrame = () => {
    const to = frame++ / fps;
    while (t < to - 1e-9) { ch.update(1 / 60); t += 1 / 60; }
    g.fillStyle = BG;
    g.fillRect(0, 0, W, H);
    blit(g, ch, WHOLE, (W - (WHOLE.w * h) / WHOLE.h) / 2, (H - h) / 2, h);
    return g.canvas.toDataURL("image/jpeg", 0.9);
  };
}

/**
 * Every quirk over its time (?view=quirks&cols=7&turn=0): a row each, a frame at even steps from
 * its start to its end, afloat, stepped at 60Hz from zero gravity's posture.
 */
function drawQuirks(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const q = new URLSearchParams(location.search), cols = Number(q.get("cols")) || 7, turn = Number(q.get("turn")) || 0;
  const names = (q.get("only")?.split(",") ?? Object.keys(QUIRKS)) as QuirkName[];
  const labelPx = Math.round(10 * dpr), cellW = W / (cols + 1), cellH = H / names.length, h = Math.min(cellH - 2, (cellW * WHOLE.h) / WHOLE.w);
  names.forEach((name, row) => {
    const was = location.search, qq = new URLSearchParams(was);
    qq.set("yaw", "0"); qq.set("pitch", "0");
    history.replaceState(history.state, "", `?${qq}`);
    let ch: UrchiCharacter;
    try { ch = createUrchi({ smooth: true, input: false }, { turn }); } finally { history.replaceState(history.state, "", was || location.pathname); }
    ch.setSuit(1);
    ch.setResolution(boxFor(WHOLE, h));
    const L = ch.limbs!;
    L.setMode("float");
    L.setLife(1);
    let t = 0;
    const run = (to: number) => { while (t < to - 1e-9) { ch.update(1 / 60); t += 1 / 60; } };
    run(0.6);
    L.play(name, 0);
    const dur = QUIRKS[name].dur, y = cellH * row;
    label(g, name.toUpperCase(), cellW / 2, y + cellH / 2 - labelPx / 2, labelPx);
    for (let k = 0; k < cols; k++) {
      run(0.6 + (dur * (k + 0.5)) / cols);
      blit(g, ch, WHOLE, cellW * (k + 1) + (cellW - (WHOLE.w * h) / WHOLE.h) / 2, y + (cellH - h) / 2, h);
    }
    ch.dispose();
  });
}

/** Where a character's painting reaches, left to right, in mesh units (from its canvas's alpha). */
function across(ch: UrchiCharacter): [number, number] {
  const c = ch.canvas, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, f = ch.frame, cell = f.w / c.width;
  let l = c.width, r = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) { l = Math.min(l, x); r = Math.max(r, x); }
  return [f.x + l * cell, f.x + (r + 1) * cell];
}

/** Where a character's painting reaches, top to bottom, in mesh units (from its canvas's alpha). */
function reach(ch: UrchiCharacter): [number, number] {
  const c = ch.canvas, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, f = ch.frame, cell = f.h / c.height;
  let top = c.height, bottom = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) { top = Math.min(top, y); bottom = Math.max(bottom, y); break; }
  return [f.y + top * cell, f.y + (bottom + 1) * cell];
}

/**
 * The figure as small as it will be on other tabs: 150, 165 and 180px tall, rim to rim, turned to
 * you and turned 41 degrees (the gaze's reach), smooth and in hard pixels, on eigengrau, each at
 * its own size (never scaled), a row to each size, wrapped to the screen; on a screen too small
 * for them all, the hard pixels are left out.
 */
function drawSmall(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, W, H);
  const labelPx = Math.round(11 * dpr), gap = 24 * dpr, margin = 16 * dpr;
  const kinds: [string, Shot][] = [["", { yaw: 0 }], [", yaw 41", { yaw: 41 }], [", pixels", { yaw: 0, smooth: false }], [", yaw 41, pixels", { yaw: 41, smooth: false }]];
  // each look's reach rim to rim (top, bottom, left, right, in mesh units), from one large painting
  const reaches = kinds.map(([, shot]) => { const p = still({ ...shot, smooth: true }, 700), r = [...reach(p), ...across(p)]; p.dispose(); return r; });
  const helmetProbe = still({ part: "helmet" }, 700), [ht, hb] = reach(helmetProbe);
  helmetProbe.dispose();
  const place = (only: number) => {
    const cells: { css: number; k: number; x: number; y: number; w: number; h: number }[] = [];
    let x = margin, y = margin, rowH = 0, row: typeof cells = [];
    const endRow = () => { const spare = W - margin - (x - gap); for (const c of row) c.x += spare / 2; y += rowH + labelPx * 2.4 + gap / 2; x = margin; rowH = 0; row = []; };
    for (const css of [150, 165, 180]) for (let k = 0; k < only; k++) {
      const [top, bottom, left, right] = reaches[k], h = css * dpr, w = ((right - left) * h) / (bottom - top);
      // a row to each size, wrapped if it will not fit
      if (row.length && (k === 0 || x + w > W - margin)) endRow();
      const c = { css, k, x, y, w, h };
      cells.push(c); row.push(c);
      x += w + gap; rowH = Math.max(rowH, h);
    }
    endRow();
    return { cells, height: y };
  };
  let plan = place(4);
  if (plan.height > H) plan = place(2);
  for (const { css, k, x, y, w, h } of plan.cells) {
    const [top, bottom, left] = reaches[k], unit = h / (bottom - top), shot = kinds[k][1];
    const ch = still(shot, URCHI_BOX.w * unit);
    g.imageSmoothingEnabled = shot.smooth !== false;
    blit(g, ch, WHOLE, x - (left - WHOLE.x) * unit, y - (top - WHOLE.y) * unit, WHOLE.h * unit);
    g.imageSmoothingEnabled = true;
    ch.dispose();
    label(g, `${css}px${kinds[k][0]}`, x + w / 2, y + h + labelPx * 0.5, labelPx, w + gap * 0.9);
    if (k === 0) label(g, `helmet ${Math.round(((hb - ht) * css) / (bottom - top))}px`, x + w / 2, y + h + labelPx * 1.6, Math.round(labelPx * 0.85), w + gap * 0.9);
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
  const HEADWIN: Win = { x: -520, y: -520, w: 1040, h: 1060 };
  const top = 30 * dpr;
  let x = 12 * dpr;
  {
    const ch = still({ suit: 0 }, URCHI_BOX.w * unitPx);
    blit(g, ch, HEADWIN, x, top, HEADWIN.h * unitPx);
    ch.dispose();
    label(g, "the head on Space today", x + (HEADWIN.w * unitPx) / 2, 8 * dpr, labelPx);
    x += HEADWIN.w * unitPx + 6 * dpr;
  }
  {
    // the same scale: the helmet the size of today's head, the body running off the bottom
    const ch = still({}, URCHI_BOX.w * unitPx), win = { ...FIGURE, x: -585, w: 1170 };
    blit(g, ch, win, x, top + (FIGURE.y - HEADWIN.y) * unitPx, FIGURE.h * unitPx);
    ch.dispose();
    label(g, "suited, the same scale", x + (win.w * unitPx) / 2, 8 * dpr, labelPx);
    x += win.w * unitPx + 6 * dpr;
  }
  {
    // the whole figure, rim to rim, as tall as today's head, its top level with the ear tips
    const probe = still({ yaw: -12 }, 700), [t0, b0] = reach(probe);
    probe.dispose();
    const unit = (0.48 * 900 * dpr) / (b0 - t0), h = FIGURE.h * unit;
    const ch = still({ yaw: -12 }, URCHI_BOX.w * unit), win = { ...FIGURE, x: -600, w: 1200 };
    blit(g, ch, win, x, top + (URCHI_HEAD.top - HEADWIN.y) * unitPx - (t0 - FIGURE.y) * unit, h);
    ch.dispose();
    label(g, "suited, as tall as that head", x + (win.w * unit) / 2, 8 * dpr, labelPx);
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

/**
 * The suit building itself, setSuit from a tenth to all of it: the body outward from the neck ring
 * while the ears and spikes fold in, then the helmet rising over the head.
 */
function drawReveal(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  const steps = Array.from({ length: 10 }, (_, i) => (i + 1) / 10);
  drawTiles(g, W, H, dpr, WHOLE, steps.map((suit) => [`setSuit(${suit})`, { suit, yaw: -10 }]));
}

/** The head's looks, and the body following a third of its turn and half its tilt, never its nod. */
function drawFollow(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  const looks: Shot[] = [{ yaw: -41, pitch: -8 }, { yaw: -20, pitch: 10, roll: -12 }, { yaw: 0 }, { yaw: 22, pitch: -15, roll: 14 }, { yaw: 41, pitch: 12 }, { yaw: 12, roll: -20 }];
  drawTiles(g, W, H, dpr, WHOLE, looks.map((p) => [`yaw ${p.yaw ?? 0} pitch ${p.pitch ?? 0} roll ${p.roll ?? 0}`, p]));
}

/** The figure turned all the way round, 30 degrees at a time. */
function drawTurn(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  drawTiles(g, W, H, dpr, WHOLE, Array.from({ length: 12 }, (_, i) => [`turn ${i * 30}`, { turn: i * 30 }]));
}

/** The helmet at the far corners of what the head can do: the eyes stay whole in the visor, nothing pokes out. */
function drawPoses(g: CanvasRenderingContext2D, W: number, H: number, dpr: number) {
  const poses: Shot[] = [];
  for (const pitch of [-42, 0, 34]) for (const yaw of [-56, -40, 0, 40, 56]) poses.push({ yaw, pitch, roll: (yaw || 1) * pitch >= 0 ? 22 : -22, wide: 0.12, part: "helmet" });
  drawTiles(g, W, H, dpr, { x: -660, y: -560, w: 1320, h: 1220 }, poses.map((p) => [`yaw ${p.yaw} pitch ${p.pitch} roll ${p.roll}`, p]));
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
    // not tucked, not clipped; a fifth of a suit tucks nothing yet) and a helmet half risen
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
      out.controls.bareHead += count(pixels({ ...p, suit: 0.2, layer: "tucked" }), helmet)[0];
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
    ch.update(1 / 60);
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
    // after the fonts, so the labels are set in the site's own, and the suit's model
    Promise.all([document.fonts.ready, preloadSuit()]).then(() => {
      if (!alive) return;
      if (view === "small") drawSmall(g, W, H, dpr);
      else if (view === "limbs") drawLimbs(g, W, H, dpr);
      else if (view === "strip") drawStrip(g, W, H, dpr);
      else if (view === "quirks") drawQuirks(g, W, H, dpr);
      else if (view === "space") drawSpace(g, W, H, dpr);
      else if (view === "poses") drawPoses(g, W, H, dpr);
      else if (view === "turn") drawTurn(g, W, H, dpr);
      else if (view === "follow") drawFollow(g, W, H, dpr);
      else if (view === "reveal") drawReveal(g, W, H, dpr);
      else if (view === "one") drawOne(g, W, H);
      else if (view === "film") runFilm(g, W, H);
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
