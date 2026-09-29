/**
 * Tunable values for the sky's layers. Any number or colour in a layer's config may be a fixed
 * value or a range: each sky's seed picks within the range, so no two skies are alike but every
 * one stays inside what was approved. A range with a `lock` holds that value whatever the seed
 * (the ?debug=1 panel's lock, kept when its config is copied back as the defaults).
 */
export type Range<T> = { range: [T, T]; lock?: T };
/** A number, fixed or picked by the seed. */
export type Num = number | Range<number>;
/** A colour (#rrggbb), fixed or picked by the seed between two. */
export type Colour = string | Range<string>;

/** A config with its values picked: every range replaced by the number or colour the seed chose. */
export type Resolved<T> =
  T extends Range<infer V>
    ? V
    : T extends number | string | boolean | null | undefined
      ? T
      : T extends readonly (infer E)[]
        ? Resolved<E>[]
        : { [K in keyof T]: Resolved<T[K]> };

/** Part of a config, laid over it (a variant's changes): objects merge key by key; values, ranges and lists are replaced whole. */
export type Patch<T> = T extends Range<unknown> | number | string | boolean | null | undefined | readonly unknown[] ? T : { [K in keyof T]?: Patch<T[K]> };

export function isRange(v: unknown): v is Range<number | string> {
  return typeof v === "object" && v !== null && Array.isArray((v as { range?: unknown }).range);
}

/** A plain object to merge into: not a list, not a range. */
function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !isRange(v);
}

/**
 * `patch` laid over `base` (see Patch); neither is changed. A value locked in `base` holds against
 * the patch: a lock keeps its value whichever variant a reroll draws.
 */
export function merge<T>(base: T, patch: Patch<T> | undefined): T {
  if (patch === undefined) return base;
  if (isRange(base) && base.lock !== undefined) return base;
  if (!isPlain(base) || !isPlain(patch)) return patch as T;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) out[k] = merge(base[k], (patch as Record<string, unknown>)[k] as never);
  return out as T;
}

/** Whether anything in a config (or a part of one) is locked. */
export function hasLock(v: unknown): boolean {
  if (isRange(v)) return v.lock !== undefined;
  if (typeof v !== "object" || v === null) return false;
  return Object.values(v).some(hasLock);
}

// ---------------------------------------------------------------- seeds

/** A seed (any string) as 32 bits: FNV-1a. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 32 bits stirred (murmur3's finaliser): nearby inputs land far apart. */
function stir(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** A seed for one purpose (a layer, a band): the same seed and name always give the same one. */
export function subSeed(seed: number, name: string): number {
  return stir(seed ^ hashSeed(name));
}

/** A number in 0 .. 1 for one purpose of a seed (see subSeed). */
export function unitOf(seed: number, name: string): number {
  return subSeed(seed, name) / 4294967296;
}

/** mulberry32: a small seeded generator, uniform in 0 .. 1, so a seed always lays the same sky. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- picking

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) || 0);

/** Two #rrggbb colours mixed, `t` of the way from `a` to `b`. */
export function mixColour(a: string, b: string, t: number): string {
  const x = hex(a), y = hex(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** A range's value for a seed: its lock, or a point within it the seed picks for this place in the config (`path`). */
function pick(r: Range<number | string>, seed: number, path: string): number | string {
  if (r.lock !== undefined) return r.lock;
  const [a, b] = r.range, t = unitOf(seed, path);
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  return mixColour(String(a), String(b), t);
}

/**
 * A config with every range picked by the seed. Each value is picked by its own place in the
 * config, so locking one, or adding another, leaves the rest of the sky as it was.
 */
export function resolve<T>(config: T, seed: number, path = ""): Resolved<T> {
  if (isRange(config)) return pick(config, seed, path) as Resolved<T>;
  if (Array.isArray(config)) return config.map((v, i) => resolve(v, seed, `${path}.${i}`)) as Resolved<T>;
  if (isPlain(config)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(config)) out[k] = resolve(v, seed, path ? `${path}.${k}` : k);
    return out as Resolved<T>;
  }
  return config as Resolved<T>;
}

/** One of `weights`' keys, drawn by `u` (0 .. 1) in proportion to its weight; the first when none weighs anything. */
export function pickWeighted(weights: Record<string, number>, u: number): string {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + Math.max(0, weights[k]), 0);
  if (total <= 0) return keys[0] ?? "";
  let r = u * total;
  for (const k of keys) {
    r -= Math.max(0, weights[k]);
    if (r < 0) return k;
  }
  return keys[keys.length - 1];
}
