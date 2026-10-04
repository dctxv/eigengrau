import type { UrchiCharacter } from "./character";

/**
 * The head's sleep and wake behaviour, ported from the site's acts.ts and attention.ts with the
 * numbers kept as they are there. Everything that was tied to the Space page is gone: tab pills,
 * motes, the hours of the night, the sound chip, and the listening (music) mode.
 *
 * It only sets what the character already has hooks for (lids, breath, blink gap, pose, tilts), so
 * the head keeps doing its own thing underneath. Call `update(dt)` with the character's, once a frame.
 *
 *   const moods = createMoods(urchi.character);
 *   moods.dozeOff();   // lids close over 4s, breath slows, head sinks to one side as on a pillow
 *   moods.wake();      // a slow stretch, eyes opening with it, then two blinks
 *   moods.wakeGroggy();// a first, heavy wake: lids part way up, slow blink, clears by itself
 *   moods.startle();   // woken (or just spooked) with a pitch kick and a pupil dip
 *   moods.peek(1);     // asleep: one eye opens to a slit, looks, and shuts again
 */

export type Mood = "awake" | "dozing" | "asleep";

/** Asleep for the night, the head tips this far to one side (degrees), as on a pillow. */
export const SLEEP_ROLL = 12;

type Settings = { period: number; depth: number; gap: [number, number]; hold: number; lid: number; tilts: [number, number] | null; darts: "dart" | "still" };
const SETTINGS: Record<Mood, Settings> = {
  awake: { period: 4.3, depth: 1, gap: [2.5, 6], hold: 0.15, lid: 0, tilts: [4, 9], darts: "dart" },
  dozing: { period: 6.2, depth: 1.25, gap: [6, 12], hold: 0.15, lid: 0, tilts: null, darts: "still" },
  asleep: { period: 6.5, depth: 1.4, gap: [6, 12], hold: 0.15, lid: 0, tilts: null, darts: "still" },
};
/** The head's dip on its pillow, in degrees of pitch. */
const DIP: Record<Mood, number> = { awake: 0, dozing: 4, asleep: 7 };
/** Groggy (woken for the first time): a heavy resting lid, slow blinks and breath, no curious tilts, wearing off over `clear` seconds. */
const GROGGY = { for: 24, clear: 14, lid: 0.42, period: 6.6, gap: [4, 8] as [number, number], hold: 0.32, open: 1.6, dip: 4, blink: 0.6 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export type Moods = {
  readonly mood: Mood;
  update(dt: number): void;
  /** Lids over `seconds`, the breath and blinks to the mood's own, the head to the mood's own pose. */
  set(mood: Mood, seconds: number): void;
  /** Sleep taking it: lids close over 4s. */
  dozeOff(): void;
  /** A daytime doze: lids close over 2.2s. */
  doze(): void;
  /** Woken properly: stretch, eyes opening, two blinks. */
  wake(): void;
  /** The first wake: groggy, not cross. */
  wakeGroggy(): void;
  /** Woken without being touched; `startled` adds a pitch kick and a pupil dip. */
  stir(startled?: boolean): void;
  /** Awake: the breath catches, the eyes widen, and the head tilts toward `dir` (-1 left, 1 right). */
  startle(dir?: number): void;
  /** Asleep: one eye (0 the viewer's left, 1 the right) opens to a slit for a moment. */
  peek(eye: 0 | 1): void;
  dispose(): void;
};

export function createMoods(ch: UrchiCharacter, start: Mood = "awake"): Moods {
  let mood: Mood = start;
  let t = 0;
  let groggyUntil = -1;
  const sleepSide: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  let queue: { at: number; fn: () => void }[] = [];
  const later = (seconds: number, fn: () => void) => queue.push({ at: t + seconds, fn });
  const clear = () => { queue = []; };

  const groggy = () => (mood === "awake" ? Math.min(1, Math.max(0, (groggyUntil - t) / GROGGY.clear)) : 0);
  const restPose = (speed = 6) => ch.pose(0, DIP[mood], mood === "asleep" ? SLEEP_ROLL * sleepSide : 0, speed);

  function apply() {
    const s = SETTINGS[mood], g = groggy();
    const lerp = (a: number, b: number) => a + (b - a) * g;
    ch.setBreathPeriod(g ? Math.max(s.period, lerp(s.period, GROGGY.period)) : s.period);
    ch.setBreathDepth(s.depth);
    ch.setBlinkGap(g ? lerp(s.gap[0], GROGGY.gap[0]) : s.gap[0], g ? lerp(s.gap[1], GROGGY.gap[1]) : s.gap[1]);
    ch.setBlinkHold(g ? lerp(s.hold, GROGGY.hold) : s.hold);
    ch.setRestLid(Math.max(s.lid, g * GROGGY.lid));
    ch.setTilts(g > 0.5 ? null : s.tilts);
    ch.sway(0, 3.4);
    ch.setDarts(s.darts);
  }

  function set(next: Mood, seconds: number) {
    mood = next;
    ch.setLids(next === "awake" ? 0 : 1, next === "awake" ? 0 : 1, seconds);
    apply();
    restPose(2);
  }

  apply();
  let lastG = 0;
  return {
    get mood() { return mood; },
    update(dt) {
      t += dt;
      const due = queue.filter((q) => q.at <= t);
      if (due.length) { queue = queue.filter((q) => q.at > t); due.forEach((q) => q.fn()); }
      // groggy wears off by itself: settings follow it, a tenth at a time so they are not resent every frame
      const g = Math.round(groggy() * 10) / 10;
      if (g !== lastG) { lastG = g; apply(); }
    },
    set,
    dozeOff() { clear(); set("asleep", 4); },
    doze() { clear(); set("dozing", 2.2); },
    wake() {
      clear();
      set("awake", 0.7);
      ch.stretch();
      later(1.25, () => ch.doubleBlink());
      later(1.75, () => restPose());
    },
    wakeGroggy() {
      clear();
      groggyUntil = t + GROGGY.for;
      set("awake", GROGGY.open);
      ch.pose(0, GROGGY.dip, 0, 1.5);
      later(2.0, () => ch.slowBlink(GROGGY.blink));
      later(3.4, () => restPose(1.5));
    },
    stir(startled = false) {
      clear();
      set("awake", startled ? 0.22 : 0.9);
      if (startled) { ch.kick(0, -55, 0); ch.dip(); }
    },
    startle(dir = Math.random() < 0.5 ? -1 : 1) {
      if (mood !== "awake") return;
      ch.pauseBreath(0.4);
      ch.widen(0.06, 0.7);
      ch.tiltToward(dir);
    },
    peek(eye) {
      if (mood !== "asleep") return;
      const slit = 0.62;
      ch.setLids(eye === 0 ? slit : 1, eye === 1 ? slit : 1, 0.28);
      later(rand(1.2, 1.8), () => { if (mood === "asleep") ch.setLids(1, 1, 0.35); });
    },
    dispose() { clear(); },
  };
}
