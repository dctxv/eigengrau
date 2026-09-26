/**
 * A record's tone: the one colour a sleeve lends the Music room. Read from the
 * cover's own pixels in OKLab, where distance is how different two colours
 * look, so the numbers below mean the same thing on every hue.
 *
 * - Each cover is read once, from a 32x32 copy, in idle time after its <img>
 *   loads (same-origin through /api/cover, so the canvas may be read). About a
 *   millisecond each, all before anyone rests on a title.
 * - Near-black, near-white and grey pixels say nothing about the record's
 *   colour and are dropped. What is left votes in 24 hue bins, weighted by
 *   chroma squared and by how near mid-lightness it sits. The tone is the
 *   weighted mean of the heaviest bin and its two neighbours, never the
 *   average of everything: the average of a cover is mud.
 * - Too few coloured pixels and the tone is null: a grey record leaves the
 *   room grey.
 * - Cached by cover id in memory and in sessionStorage.
 *
 * Also here: how far eigengrau may bend towards a tone (the caps, the yellow
 * rule, the ink's contrast), and the spring the room's colour moves on.
 */
import { COLOR } from "@/lib/color";

export type Lab = { L: number; a: number; b: number };
/** A cover's strongest hue in OKLab, and how much colour the sleeve really has (`s`, 0-1). */
export type Tone = Lab & { s: number };
/** An sRGB colour, 0-255 per channel, unrounded. */
export type Rgb = [number, number, number];

// ---------------------------------------------------------------- OKLab

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
/** The 256 gamma-encoded levels, linearised once: extraction reads a thousand pixels a cover. */
const LINEAR = Float64Array.from({ length: 256 }, (_, i) => toLinear(i / 255));

function fromLinear(r: number, g: number, b: number): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** 8-bit sRGB to OKLab. */
export function labOf(r: number, g: number, b: number): Lab {
  return fromLinear(LINEAR[r | 0], LINEAR[g | 0], LINEAR[b | 0]);
}

/** OKLab to linear sRGB, which may fall outside 0-1. */
function linearOf({ L, a, b }: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** OKLab to 8-bit sRGB, unrounded and clipped to the gamut. */
export function rgbOf(c: Lab): Rgb {
  return linearOf(c).map((v) => toGamma(Math.min(1, Math.max(0, v))) * 255) as Rgb;
}

/** Whether sRGB can show the colour: a dark cyan at 0.045 chroma already cannot. */
const inGamut = (c: Lab) => linearOf(c).every((v) => v >= -1e-5 && v <= 1 + 1e-5);

function hex(h: string): Rgb {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const chroma = (c: Lab) => Math.hypot(c.a, c.b);
/** Hue in degrees, 0-360. */
export const hue = (c: Lab) => ((Math.atan2(c.b, c.a) * 180) / Math.PI + 360) % 360;
export const fromLch = (L: number, C: number, h: number): Lab => ({ L, a: C * Math.cos((h * Math.PI) / 180), b: C * Math.sin((h * Math.PI) / 180) });
/** How different two colours look (ΔE in OKLab). */
export const deltaE = (p: Lab, q: Lab) => Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);

/** WCAG relative luminance of an 8-bit sRGB colour. */
function luminance([r, g, b]: Rgb): number {
  return 0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);
}
/** WCAG contrast ratio between two sRGB colours. */
export function contrast(p: Rgb, q: Rgb): number {
  const [hi, lo] = [luminance(p), luminance(q)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The page's ground and its ink, from the same tokens as globals.css. Eigengrau is oklch(0.203 0.014 285). */
export const BG_RGB = hex(COLOR.bg);
export const INK_RGB = hex(COLOR.ink);
export const EIGENGRAU = labOf(...BG_RGB);

// ---------------------------------------------------------------- reading a cover

const SIZE = 32;
const BINS = 24;
/** Too dark, too light or too grey to say anything about the record's colour. */
const DROP = { dark: 0.15, light: 0.93, grey: 0.035 };
/** Fewer coloured pixels than this share of the sleeve and it is a grey record. */
const MIN_SHARE = 0.08;
/** The mean weighted C² at which a sleeve counts as fully coloured. */
const FULL = 0.004;

/**
 * The tone of 32x32 RGBA pixels, or null for a grey record. Pure, so it can
 * be checked without a canvas.
 */
export function toneOfPixels(px: Uint8ClampedArray): Tone | null {
  const n = px.length >> 2;
  const bins = new Float64Array(BINS);
  const bin = new Int8Array(n).fill(-1);
  const w = new Float64Array(n);
  const labs: Lab[] = new Array(n);
  let seen = 0;
  let kept = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    if (px[i * 4 + 3] < 128) continue;
    seen++;
    const c = labOf(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    const C = chroma(c);
    if (c.L < DROP.dark || c.L > DROP.light || C < DROP.grey) continue;
    kept++;
    const weight = C * C * Math.max(0, 1 - Math.abs(c.L - 0.6) / 0.5);
    const k = Math.floor(hue(c) / (360 / BINS)) % BINS;
    bins[k] += weight;
    bin[i] = k;
    w[i] = weight;
    labs[i] = c;
    sum += weight;
  }
  if (!seen || kept / seen < MIN_SHARE || sum <= 0) return null;
  // Smoothed by a bin either side, so a hue on a bin's edge is not split in two.
  let best = 0;
  let most = -1;
  for (let k = 0; k < BINS; k++) {
    const v = bins[(k + BINS - 1) % BINS] + bins[k] + bins[(k + 1) % BINS];
    if (v > most) [most, best] = [v, k];
  }
  const near = (k: number) => k === best || k === (best + 1) % BINS || k === (best + BINS - 1) % BINS;
  let L = 0;
  let a = 0;
  let b = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    if (bin[i] < 0 || !near(bin[i])) continue;
    L += labs[i].L * w[i];
    a += labs[i].a * w[i];
    b += labs[i].b * w[i];
    total += w[i];
  }
  if (total <= 0) return null;
  return { L: L / total, a: a / total, b: b / total, s: Math.min(1, sum / seen / FULL) };
}

let canvas: HTMLCanvasElement | null = null;
let pen: CanvasRenderingContext2D | null = null;

/** Reads a loaded cover; undefined when it cannot be read (not loaded, or another origin's pixels). */
function read(img: HTMLImageElement): Tone | null | undefined {
  if (!img.complete || !img.naturalWidth) return undefined;
  try {
    if (!pen) {
      canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      pen = canvas.getContext("2d", { willReadFrequently: true });
      if (!pen) return undefined;
      pen.imageSmoothingQuality = "high";
    }
    pen.clearRect(0, 0, SIZE, SIZE);
    pen.drawImage(img, 0, 0, SIZE, SIZE);
    return toneOfPixels(pen.getImageData(0, 0, SIZE, SIZE).data);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------- the cache

const STORE = "eigengrau:tones";
const KEEP = 200;
const tones = new Map<string, Tone | null>();
let restored = false;
/** Loaded covers not read yet, and those of them already decoded, which idle time takes in turn. */
const waiting = new Map<string, HTMLImageElement>();
const decoded = new Set<string>();
let idle: number | null = null;
let saveLater: number | null = null;
const listeners = new Set<(id: string) => void>();

/**
 * Sleeves whose strongest hue is only a small accent (a red sticker on a grey
 * photograph): the cover's id (the 32-character hash in /api/cover/<id>), and
 * the hue in degrees the room should take instead, with its chroma and
 * strength if the default is wrong; or null to leave the room grey.
 */
const OVERRIDES: Record<string, { h: number; C?: number; s?: number } | null> = {};

/** A cover id without its extension, as the cache and the override map key it. */
const hash = (id: string) => id.replace(/\.(png|jpg)$/, "");

function restore() {
  if (restored) return;
  restored = true;
  try {
    const raw = window.sessionStorage.getItem(STORE);
    const all = raw ? (JSON.parse(raw) as Record<string, [number, number, number, number] | 0>) : {};
    for (const [id, v] of Object.entries(all)) {
      if (v === 0) tones.set(id, null);
      else if (Array.isArray(v) && v.length === 4 && v.every(Number.isFinite)) tones.set(id, { L: v[0], a: v[1], b: v[2], s: v[3] });
    }
  } catch {
    /* private mode, or a mangled entry: read the covers again */
  }
}

function save() {
  saveLater = null;
  try {
    const out: Record<string, [number, number, number, number] | 0> = {};
    const r = (x: number) => Math.round(x * 1e4) / 1e4;
    [...tones].slice(-KEEP).forEach(([id, t]) => (out[id] = t ? [r(t.L), r(t.a), r(t.b), r(t.s)] : 0));
    window.sessionStorage.setItem(STORE, JSON.stringify(out));
  } catch {
    /* full or private: the memory cache still serves this visit */
  }
}

function learnt(id: string, t: Tone | null) {
  tones.set(id, t);
  waiting.delete(id);
  decoded.delete(id);
  saveLater ??= window.setTimeout(save, 400);
  listeners.forEach((l) => l(id));
}

const whenIdle = (f: (d?: IdleDeadline) => void) =>
  typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f, { timeout: 1500 }) : window.setTimeout(f, 16);

function drain(d?: IdleDeadline) {
  idle = null;
  for (const id of decoded) {
    if (d && d.timeRemaining() < 2 && !d.didTimeout) break;
    const img = waiting.get(id);
    const t = img ? read(img) : undefined;
    if (t !== undefined) learnt(id, t);
    else {
      waiting.delete(id);
      decoded.delete(id);
    }
  }
  if (decoded.size) idle = whenIdle(drain);
}

function overridden(id: string, t: Tone | null | undefined): Tone | null | undefined {
  const o = OVERRIDES[id];
  if (o === undefined) return t;
  if (o === null) return null;
  return { ...fromLch(t?.L ?? 0.6, o.C ?? 0.1, o.h), s: o.s ?? 1 };
}

/** A cover's tone: null for a grey record, undefined while it has not been read yet. */
export function toneOf(id: string | null | undefined): Tone | null | undefined {
  if (!id) return null;
  restore();
  const key = hash(id);
  return overridden(key, tones.get(key));
}

/**
 * The same, read at once from its loaded <img> if idle time has not come
 * round to it yet: a choice should not wait for the idle queue.
 */
export function toneNow(id: string | null | undefined): Tone | null | undefined {
  const known = toneOf(id);
  if (known !== undefined || !id) return known;
  const key = hash(id);
  const img = waiting.get(key);
  const t = img ? read(img) : undefined;
  if (t !== undefined) learnt(key, t);
  return overridden(key, t);
}

/**
 * Call from a cover <img>'s load: it is read in idle time unless it already
 * has been. A sleeve not yet on show is not decoded yet, so it is decoded off
 * the main thread first; drawn undecoded, it would decode in the idle slice.
 */
export function learnTone(id: string, img: HTMLImageElement) {
  restore();
  const key = hash(id);
  if (tones.has(key) || waiting.get(key) === img) return;
  waiting.set(key, img);
  const queue = () => {
    if (waiting.get(key) !== img) return;
    decoded.add(key);
    idle ??= whenIdle(drain);
  };
  if (typeof img.decode === "function") img.decode().then(queue, queue);
  else queue();
}

/** Told each time a cover has been read. Returns the unsubscribe. */
export function onTone(l: (id: string) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// ---------------------------------------------------------------- how far eigengrau bends

/**
 * The caps. A preview borrows a little; his own song, playing now, a little
 * more. Chroma is capped absolutely and as a share of the cover's own.
 */
export const CAPS = {
  preview: { L: 0.215, C: 0.03, share: 0.4 },
  live: { L: 0.235, C: 0.045, share: 0.5 },
} as const;
/** Ink on every tone keeps at least this contrast (it is 14.8:1 on eigengrau). */
export const MIN_CONTRAST = 13.4;

/** 1 inside the yellows (70-115°), easing to 0 over ten degrees either side. */
function yellowness(h: number) {
  if (h < 60 || h > 125) return 0;
  if (h < 70) return (h - 60) / 10;
  if (h > 115) return (125 - h) / 10;
  return 1;
}
/** How far a yellow turns toward amber: up to 20° at 115°, back to none by 135° so the greens are untouched. */
function amberTurn(h: number) {
  if (h <= 70 || h >= 135) return 0;
  if (h <= 115) return (20 * (h - 70)) / 45;
  return (20 * (135 - h)) / 20;
}

/**
 * The room at the tone's full strength: eigengrau lifted toward the cover's
 * hue within the caps. Darkened, a yellow reads as olive, so yellows get 0.7x
 * the chroma and turn toward amber. Lightness follows the cover's (a dark
 * sleeve lifts the room less); chroma gives way where sRGB cannot show it,
 * and lightness wherever ink would fall under 13.4:1. How much of this the
 * room takes is the tone's strength times the door's envelope, applied by the
 * caller.
 */
export function bend(t: Tone, live: boolean): Lab {
  const cap = live ? CAPS.live : CAPS.preview;
  const h = hue(t);
  const y = yellowness(h);
  let C = Math.min(cap.C, cap.share * chroma(t)) * (1 - 0.3 * y);
  let L = EIGENGRAU.L + (cap.L - EIGENGRAU.L) * Math.min(1, Math.max(0, t.L / 0.6));
  let lab = fromLch(L, C, h - amberTurn(h));
  // Out of gamut, clipping would change the hue; giving up chroma keeps it.
  while (!inGamut(lab) && C > 0.001) lab = fromLch(L, (C *= 0.95), h - amberTurn(h));
  while (contrast(INK_RGB, rgbOf(lab)) < MIN_CONTRAST && L > EIGENGRAU.L - 0.02) {
    L -= 0.001;
    lab = { ...lab, L };
  }
  return lab;
}

// ---------------------------------------------------------------- the spring

/**
 * A critically damped spring over any few numbers (the room uses L, a, b and
 * the tone's strength). In OKLab a move between two hues goes straight across,
 * through near-grey, so navy never reaches olive by way of green. It can be
 * retargeted mid-flight and keeps its velocity when it is. tau 0.7s settles
 * in about two seconds.
 */
export class Spring {
  x: number[];
  v: number[];
  to: number[];
  constructor(
    x: number[],
    private tau = 0.7,
  ) {
    this.x = [...x];
    this.v = x.map(() => 0);
    this.to = [...x];
  }
  /** Jump straight there, at rest. */
  snap(x: number[]) {
    this.x = [...x];
    this.to = [...x];
    this.v = x.map(() => 0);
  }
  /** Still moving by more than a twentieth of an 8-bit step at eigengrau's lightness. */
  get moving() {
    return this.x.some((x, i) => Math.abs(x - this.to[i]) > 2e-4 || Math.abs(this.v[i]) > 2e-4);
  }
  /** Advances `dt` seconds exactly (the closed form, so a slow frame cannot overshoot). */
  step(dt: number) {
    const w = 1 / this.tau;
    const e = Math.exp(-w * dt);
    for (let i = 0; i < this.x.length; i++) {
      const y = this.x[i] - this.to[i];
      const k = this.v[i] + w * y;
      this.x[i] = this.to[i] + (y + k * dt) * e;
      this.v[i] = (this.v[i] - w * k * dt) * e;
    }
    if (!this.moving) this.snap(this.to);
  }
}

// ---------------------------------------------------------------- dither

let grain: string | null = null;

/**
 * A 64px tile of noise about 1% either side of the colour under it, so a
 * gradient this faint does not band on an 8-bit panel. White and black at
 * alphas that shift eigengrau by the same amount each way, so the room is no
 * lighter on average. A data URL, made once.
 */
export function dither(): string {
  if (grain) return grain;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (!g) return "none";
    const img = g.createImageData(64, 64);
    // +2.7, +0.9, -0.9 and -2.6 levels on eigengrau
    const levels: [number, number][] = [[255, 3], [255, 1], [0, 9], [0, 27]];
    for (let i = 0; i < 64 * 64; i++) {
      const [v, a] = levels[(Math.random() * 4) | 0];
      img.data.set([v, v, v, a], i * 4);
    }
    g.putImageData(img, 0, 0);
    grain = `url(${c.toDataURL("image/png")})`;
  } catch {
    grain = "none";
  }
  return grain;
}
