import { COLOR } from "@/lib/color";

/**
 * Threshold, the daily game: a just-noticeable-difference test on the page's
 * own background. Five rounds, two boards each, the lighter square finer every
 * round. Everything here is pure or behind try/catch: the boards come from a
 * seed of the UTC date, so everyone gets the same ones on the same day, and
 * the day's result lives in localStorage.
 */

export const ROUNDS = [
  { grid: 2, step: 10 },
  { grid: 3, step: 6 },
  { grid: 4, step: 4 },
  { grid: 5, step: 2 },
  { grid: 6, step: 1 },
] as const;
export const BOARDS_PER_ROUND = 2;

export type Board = {
  round: number;
  grid: number;
  /** How far the one square sits from eigengrau toward ink, of 255. */
  step: number;
  /** Index of that square, row-major. */
  target: number;
};

const STORAGE_KEY = "eigengrau:threshold";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** mulberry32: a small seeded generator, uniform in 0..1. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a of the date string: the day's 32-bit seed. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** YYYY-MM-DD in UTC, so the boards roll over at the same moment everywhere. */
export function todayUTC(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The day's ten boards, in play order. */
export function boardsFor(date: string): Board[] {
  const rng = mulberry32(hash32(date));
  const boards: Board[] = [];
  ROUNDS.forEach(({ grid, step }, round) => {
    for (let b = 0; b < BOARDS_PER_ROUND; b++) boards.push({ round, grid, step, target: Math.floor(rng() * grid * grid) });
  });
  return boards;
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Eigengrau moved `step` of 255 toward ink on every channel, rounded. */
export function squareColor(step: number): string {
  const bg = channels(COLOR.bg);
  const ink = channels(COLOR.ink);
  return `#${bg.map((c, i) => Math.round(c + ((ink[i] - c) * step) / 255).toString(16).padStart(2, "0")).join("")}`;
}

/** A miss on board `index` ends the run at the last round passed: its step, or 0 when none was. */
export function resultAfterMiss(index: number): number {
  const round = Math.floor(index / BOARDS_PER_ROUND);
  return round === 0 ? 0 : ROUNDS[round - 1].step;
}

/** The caption: "Threshold, 24 Sep" over "2/255. Your screen is part of this." */
export function resultCaption(date: string, result: number): { title: string; line: string } {
  const [, m, d] = date.split("-").map(Number);
  return {
    title: `Threshold, ${d} ${MONTHS[m - 1]}`,
    line: `${result > 0 ? `${result}/255.` : "Not today."} Your screen is part of this.`,
  };
}

/** The stored result for `date`, or null when the day has not been played. */
export function readResult(date: string): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { date?: unknown; result?: unknown };
    return v.date === date && typeof v.result === "number" ? v.result : null;
  } catch {
    return null;
  }
}

export function writeResult(date: string, result: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, result }));
  } catch {
    /* private mode */
  }
}
