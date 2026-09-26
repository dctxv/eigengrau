import type { UrchiReaction } from "@/content/site";
import type { Act, Attention, Point, Where } from "./attention";

/**
 * The scripted beats the attention system plays (see attention.ts): each is a
 * generator that yields the seconds to wait before its next step, and has the
 * eyes to itself while it runs. Anything an act changes on the character it
 * puts back in a finally block, because a more important act can cut it off.
 */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** A place on the viewport, as fractions of it. */
const spot = (fx: number, fy: number): (() => Point) => () => ({ x: innerWidth * fx, y: innerHeight * fy });

/** Waits (a frame at a time) until `ok`, for at most `max` seconds. */
function* until(a: Attention, ok: () => boolean, max = Infinity): Act {
  const end = a.t + max;
  while (!ok() && a.t < end) yield 0;
}

// ------------------------------------------------------------------ what's new (S4)

/**
 * Something newer than your last visit: it looks up at that tab's pill, holds, looks back at
 * you, then up again, like a child tugging a sleeve; then his line says what. Reduced motion:
 * the pupils go up once, and the line still comes.
 */
export function* tug(a: Attention, pill: Where, say: () => void): Act {
  try {
    if (a.reduced) {
      a.look(pill);
      yield 1.2;
      say();
      a.look("you");
      yield 0.4;
      return;
    }
    a.look(pill);
    yield 1.1;
    a.look("you");
    yield 0.8;
    a.look(pill);
    yield 0.8;
    say();
    a.look("you");
    yield 0.5;
  } finally {
    a.look(null);
  }
}

/** Back on tab 1: it is still watching the pill of the tab you left (it opens already looking there), and turns to you once the page has settled. */
export function* comeBack(a: Attention, pill: Where, settled: () => boolean): Act {
  a.look(pill, "snap");
  yield* until(a, settled, 3);
  yield 0.8;
  a.look("you");
  yield 0.4;
}

/** While he is listening: a look up at the "4" now and then. */
export function* glanceAt(a: Attention, pill: Where): Act {
  a.look(pill);
  yield rand(1, 1.4);
  a.look("you");
  yield 0.3;
}

/** Hovering the pill it pointed out: a small nod, about 4 degrees. */
export function* nod(a: Attention): Act {
  try {
    a.ch.pose(0, 4, 0, 14);
    yield 0.2;
    a.restPose(9);
    yield 0.3;
  } finally {
    a.restPose();
  }
}

// ------------------------------------------------------------------ reading his caption (S6)

/**
 * His caption rises and it reads it: head down, pupils down, then three to five jumps left to
 * right that land on the words where they are on screen, 200-260ms each. Then it looks up at you
 * and reacts to that line. `words` are the words' centres in client px, in reading order.
 * `done` is told once the last jump has landed: a reading cut off before then has not read the
 * line, so the next hover still gets the whole of it.
 */
export function* read(a: Attention, words: Point[], reaction: UrchiReaction, done?: () => void): Act {
  if (!words.length) return;
  const left = words[0].x, right = words[words.length - 1].x;
  const mid = (left + right) / 2, half = Math.max(40, (right - left) / 2);
  const y = words.reduce((s, w) => s + w.y, 0) / words.length;
  // the line's width maps onto the pupils' reach: the jumps stay readable at any size
  const ex = (x: number) => clamp(((x - mid) / half) * 0.8, -0.85, 0.85);
  const n = Math.min(words.length, 3 + Math.floor(Math.random() * 3));
  const picks = Array.from({ length: n }, (_, i) => words[Math.round((i * (words.length - 1)) / Math.max(1, n - 1))]);
  try {
    a.steady(true);
    a.look({ x: mid, y });
    a.eyes(ex(picks[0].x), 0.85);
    yield 0.42;
    for (const w of picks.slice(1)) {
      a.eyes(ex(w.x), 0.85);
      yield rand(0.2, 0.26);
    }
    done?.();
    a.eyes(null);
    a.look("you");
    a.steady(false);
    yield 0.4;
    yield* react(a, reaction);
  } finally {
    a.steady(false);
    a.eyes(null);
    a.look(null);
  }
}

/** A line it has read already: only a short glance down at it. */
export function* glanceDown(a: Attention, words: Point[]): Act {
  if (!words.length) return;
  const mid = (words[0].x + words[words.length - 1].x) / 2;
  try {
    a.steady(true);
    a.look({ x: mid, y: words[0].y });
    a.eyes(0, 0.85);
    yield 0.55;
  } finally {
    a.steady(false);
    a.eyes(null);
    a.look(null);
  }
}

/** Each line gets its own reaction. */
function* react(a: Attention, r: UrchiReaction): Act {
  const ch = a.ch;
  if (r === "slowBlink") {
    ch.slowBlink();
    yield 1.1;
  } else if (r === "longBlink") {
    ch.slowBlink(0.9);
    yield 1.8;
  } else if (r === "puzzled") {
    ch.tiltToward(Math.random() < 0.5 ? -1 : 1, 13);
    if (a.reduced) ch.eyesTo(0, -0.6); // no tilt without motion: the pupils roll up instead
    yield 1.6;
  } else if (r === "glanceAway") {
    ch.glance();
    yield 0.9;
  } else {
    // a slow look round the room, then back
    const first = Math.random() < 0.5 ? 0.12 : 0.88;
    a.look(spot(first, 0.2));
    yield 1.1;
    a.look(spot(1 - first, 0.3));
    yield 1.3;
    a.look(spot(0.5, 0.85));
    yield 0.8;
    a.look("you");
    yield 0.3;
  }
}

// ------------------------------------------------------------------ the sound (S2)

/** The sound comes on: a startle and a look at the chip, then a freeze, up-left, up-right, and a tilt, finding where it comes from. */
export function* soundOn(a: Attention, chip: () => Point | null): Act {
  try {
    const c = chip();
    if (c) {
      a.startle(c);
      a.look(c, "quick");
      yield 0.7;
    }
    a.ch.pauseBreath(0.4);
    a.look("hold");
    yield 0.4;
    a.look(spot(0.22, 0.08));
    yield 0.8;
    a.look(spot(0.78, 0.08));
    yield 0.8;
    a.ch.tiltToward(1);
    yield 0.6;
    a.look("you");
    yield 0.3;
  } finally {
    a.look(null);
  }
}

// ------------------------------------------------------------------ his hours (S5)

/** Asleep, and you came near: one eye opens to a slit, finds you, and closes again. */
export function* peek(a: Attention): Act {
  const h = a.head();
  const you = a.you();
  const eye = you && you.x > h.x ? 1 : 0;
  const slit = 0.62;
  try {
    a.ch.setLids(eye === 0 ? slit : 1, eye === 1 ? slit : 1, 0.28);
    const end = a.t + rand(1.2, 1.8);
    while (a.t < end) {
      const p = a.you();
      if (p) a.eyes(clamp((p.x - h.x) / (h.reach * 2), -1, 1), clamp((p.y - h.y) / (h.reach * 2), -1, 1));
      yield 0;
    }
    a.ch.setLids(1, 1, 0.35);
    yield 0.4;
    a.eyes(null);
    yield rand(1.5, 2.5); // it does not open again straight away
  } finally {
    a.eyes(null);
    if (a.mood !== "awake") a.ch.setLids(1, 1, 0.3);
  }
}

/** Woken properly: a slow stretch upward and back, the eyes opening with it, then two blinks. */
export function* wake(a: Attention): Act {
  a.setMood("awake", 0.7);
  a.look("you");
  try {
    a.ch.stretch();
    yield 1.25;
    a.ch.doubleBlink();
    yield 0.5;
  } finally {
    a.restPose();
    a.look(null);
  }
}

/** The gaze drifting from where it is to straight ahead over `seconds`, as the head goes heavy. */
function* settleAhead(a: Attention, seconds: number): Act {
  const from = a.gazeNow;
  const h = a.head();
  const start = a.t;
  if (!from) return;
  a.look(() => {
    const u = Math.min(1, (a.t - start) / seconds), e = u * u * (3 - 2 * u);
    return { x: from.x + (h.x - from.x) * e, y: from.y + (h.y - from.y) * e };
  });
  yield seconds;
}

/** Sleep taking it back (at night, after a long stillness, or after the intro): the lids close over about 4s, the breath slows and the head sinks. */
export function* dozeOff(a: Attention): Act {
  a.setMood("asleep", 4);
  yield* settleAhead(a, 4);
}

/** Daytime: nobody has moved for a minute and a half, so it dozes. */
export function* doze(a: Attention): Act {
  a.setMood("dozing", 2.2);
  yield* settleAhead(a, 2.2);
}

/**
 * Woken without being touched: by a pointer (dozing: a small startle, a pitch kick and a pupil
 * dip) or by him starting to play something (it simply opens its eyes to listen).
 */
export function* stir(a: Attention, startled = false): Act {
  a.setMood("awake", startled ? 0.22 : 0.9);
  if (startled) {
    a.ch.kick(0, -55, 0);
    a.ch.dip();
  }
  a.look("you", "quick");
  yield 0.5;
  a.look(null);
}

// ------------------------------------------------------------------ motes (S3)

/**
 * A mote released where you tapped: it freezes, its eyes widen, a small wind-up turns it the
 * other way, then its head snaps round to the mote and follows it.
 */
export function* windUp(a: Attention, mote: () => Point | null): Act {
  const m = mote();
  if (!m) return;
  const dir = m.x < a.head().x ? -1 : 1;
  try {
    a.look("hold");
    a.ch.pauseBreath(0.55);
    a.ch.widen(0.06, 1);
    yield 0.16;
    a.ch.pose(-dir * 5, -1.5, 0, 16);
    yield 0.2;
    a.restPose(12);
    a.look(mote, "quick");
    a.ch.tiltToward(dir);
    yield 2.4;
  } finally {
    a.restPose();
    a.look(null);
  }
}

/** A mote drifts up to its face: it goes cross-eyed, tilts, slow-blinks, and when the lids open the mote is gone. */
export function* closeBy(a: Attention, mote: () => Point | null, gone: () => void): Act {
  const m = mote();
  if (!m) return;
  try {
    a.look(mote);
    a.ch.converge(1);
    yield 0.6;
    a.ch.tiltToward(m.x < a.head().x ? -1 : 1);
    yield 0.5;
    a.ch.slowBlink();
    yield* until(a, () => a.ch.shut > 0.95, 1);
    gone();
    a.ch.converge(0);
    yield 0.8;
  } finally {
    a.ch.converge(0);
    a.look(null);
  }
}

/** A mote comes to rest on a spike: it looks at it and blinks twice. */
export function* restOn(a: Attention, mote: () => Point | null): Act {
  try {
    a.look(mote);
    yield 0.35;
    a.ch.doubleBlink();
    yield 0.9;
  } finally {
    a.look(null);
  }
}

// ------------------------------------------------------------------ call and response (panel 2, N5)

/** Straight out of the screen: at the person, rather than at the hand on the pointer. */
const face = (a: Attention): (() => Point) => () => {
  const h = a.head();
  return { x: h.x, y: h.y };
};

/**
 * Listening to a rhythm it does not blink, from a tap until this long and a second more after it
 * (holdBlinks): past the 900ms of quiet that ends the rhythm, so an answer (or its slow blink of
 * trust) never opens with an ordinary blink it did not mean.
 */
const HEED_STARE = 0.3;

/**
 * A rhythm being tapped in its room: it watches your hand without blinking, head level (no
 * curious tilts while it concentrates), and each tap lands with the smallest flinch of the
 * pupils. The motes those taps let go are not what it is watching. It runs until the rhythm
 * ends; `taps` counts them.
 */
export function* heed(a: Attention, taps: () => number): Act {
  let seen = taps();
  try {
    a.steady(true);
    a.look("you", "quick");
    a.holdBlinks(HEED_STARE);
    for (;;) {
      if (taps() !== seen) {
        seen = taps();
        a.ch.dip();
        a.holdBlinks(HEED_STARE);
      }
      yield 0;
    }
  } finally {
    a.steady(false);
    a.look(null);
  }
}

/**
 * One blink of an answer: `at` is when the lids meet (performance.now() ms), which is when its pat
 * is heard; `close`, `hold` and `open` are seconds, shortened to fit a quick rhythm. `own` marks
 * the beat it adds itself.
 */
export type Beat = { at: number; close: number; hold: number; open: number; own?: boolean };

/**
 * After an answer's last beat, no ordinary blink for this long and a second more (holdBlinks):
 * the longest gap it answers is 900ms, so a blink 1.6s on is not taken for a beat.
 */
const ANSWER_AFTER = 0.6;

/** Waits, a frame at a time, until performance.now() reaches `ms`: the answer keeps real time, as its pats do. */
function* untilMs(ms: number): Act {
  while (performance.now() < ms) yield 0;
}

/**
 * Its answer: it looks up from your hand to you, leans in (`lean`, with the face tipped `pitch`
 * degrees down), holds its breath and gives your rhythm back as slow blinks. `start` is asked for
 * the beats once it has begun to lean (so a queued answer is timed from when it really starts,
 * and its pats with it); `end` is told when it stops, finished or cut short. On a beat of its own
 * it tips its head a little, as if the last one were its idea. Reduced motion: no lean and no
 * tilt; the lids shut and open on the beats.
 */
export function* answer(a: Attention, start: () => Beat[], o: { lean: (on: boolean) => void; pitch: number; end: (finished: boolean) => void }): Act {
  let finished = false;
  try {
    a.steady(true);
    a.look(face(a), "quick");
    if (!a.reduced) {
      o.lean(true);
      a.ch.pose(0, o.pitch, 0, 5);
    }
    const beats = start();
    const last = beats[beats.length - 1];
    if (beats[0]) a.holdBlinks((beats[0].at - performance.now()) / 1000 + beats[0].hold);
    for (const b of beats) {
      yield* untilMs(b.at - b.close * 1000);
      // a late frame closes them quicker, so the lids still meet on the beat, with its pat
      const left = Math.max(0, (b.at - performance.now()) / 1000);
      // no ordinary blink of its own in the middle of your rhythm, nor so soon after it that it reads as one more beat
      a.holdBlinks(left + b.hold + b.open + (b === last ? ANSWER_AFTER : 0));
      a.ch.pauseBreath(1);
      a.ch.setLids(1, 1, Math.min(b.close, left));
      if (b.own) a.ch.tiltToward(Math.random() < 0.5 ? -1 : 1, 5);
      yield* untilMs(b.at + b.hold * 1000);
      a.ch.setLids(0, 0, b.open);
    }
    finished = true; // every beat given; what follows is only the lean easing off
    if (last) yield* untilMs(last.at + (last.hold + last.open) * 1000 + 450);
  } finally {
    a.ch.setLids(0, 0, 0.12);
    o.lean(false);
    a.restPose(4);
    a.steady(false);
    a.look(null);
    o.end(finished);
  }
}

/**
 * You tapped its version back: a cat's slow blink of trust, the lids closing slowly, resting shut
 * and opening onto soft eyes, which `soften` keeps for a while; a small nod goes with it.
 * Reduced motion: the lids shut and open onto soft eyes, and nothing else moves.
 */
export function* trust(a: Attention, soften: () => void): Act {
  try {
    a.holdBlinks(3.5); // nothing quick before the slow one
    a.steady(true);
    a.look(face(a));
    yield 0.3;
    a.ch.setLids(1, 1, 0.6);
    a.ch.pose(0, 4, 0, 2.5);
    yield 0.6;
    soften(); // under the closed lids, so they open onto soft eyes
    yield 0.7;
    a.ch.setLids(0, 0, 0.9);
    a.restPose(2);
    yield 1.2;
  } finally {
    a.ch.setLids(0, 0, 0.3);
    a.restPose();
    a.steady(false);
    a.look(null);
  }
}

/**
 * At his night a rhythm reaches it in its sleep: the breath catches, the head shifts on its
 * pillow, one eye opens a crack toward the taps and closes again, and a long breath out settles
 * it. No answer and no pats: it is his night. Reduced motion: only the eye.
 */
export function* murmur(a: Attention, from: Point | null): Act {
  const h = a.head();
  const eye = from && from.x > h.x ? 1 : 0;
  const side = eye ? 1 : -1;
  try {
    a.ch.pauseBreath(0.6);
    yield 0.45;
    a.ch.pose(side * 3, 9, side * 4, 2.2);
    a.ch.setLids(eye === 0 ? 0.64 : 1, eye === 1 ? 0.64 : 1, 0.5); // a crack: from 0.78 on, an eye is drawn shut
    yield 1;
    a.ch.setLids(1, 1, 0.6);
    a.ch.deepBreath(1.3, 2.4, 1.6);
    yield 1.4;
    a.restPose(1.5);
    yield 2.4;
  } finally {
    if (a.mood !== "awake") a.ch.setLids(1, 1, 0.3);
    a.restPose();
  }
}

/** Awake at his night (you woke it) and tapped at: one long, heavy blink, and no more than that. */
export function* drowse(a: Attention): Act {
  try {
    a.look(face(a));
    yield 0.3;
    a.ch.slowBlink(0.9);
    a.ch.pose(0, 3, 0, 2);
    yield 1.8;
  } finally {
    a.restPose();
    a.look(null);
  }
}

/** More taps than it can follow: a puzzled tilt, and it lets the rhythm go. */
export function* lost(a: Attention): Act {
  try {
    a.look("you");
    a.ch.tiltToward(Math.random() < 0.5 ? -1 : 1, 11);
    if (a.reduced) a.eyes(0, -0.6); // no tilt without motion: the pupils roll up instead
    yield 1.4;
  } finally {
    a.eyes(null);
    a.look(null);
  }
}

// ------------------------------------------------------------------ caught in the act (panel 2, N3)

/**
 * A blink it was part way through when the tab went away (a hidden page draws nothing, so it is
 * still under way on return) may hold the pose up this much longer (s): the hold is of open eyes.
 */
const CAUGHT_BLINK_LATE = 0.45;

/**
 * Waits until the eyes have been open (under 0.6 shut: past any resting lid, which stops at half)
 * for `seconds` in all, or `late` seconds more than that have gone by.
 */
function* openFor(a: Attention, seconds: number, late: number): Act {
  const end = a.t + seconds + late;
  let open = 0, last = a.t;
  while (open < seconds && a.t < end) {
    yield 0;
    if (a.ch.shut < 0.6) open += a.t - last;
    last = a.t;
  }
}

/** What it was found doing: facing into a corner, staring up at a pill, or halfway through a stretch. */
export type Caught = { kind: "corner" | "pill"; at: Where } | { kind: "stretch"; roll: number };

/**
 * Back after a while away, you find it doing something it would not do while watched. It is
 * already there on the first frame, and holds it for 350-500ms of open eyes (the stretch's are
 * shut) so the eye can land on it; then it startles, turns to you (blinking as it turns, as any
 * wide turn does) and carries on.
 * Reduced motion: the pose (the pupils off at the corner or the pill), then a cut to you.
 */
export function* caught(a: Attention, pose: Caught): Act {
  const hold = rand(0.35, 0.5);
  try {
    a.holdBlinks(hold + CAUGHT_BLINK_LATE); // no blink of its own over the pose: the eye has to land on it
    if (pose.kind === "stretch") {
      // at the top of a stretch: face tipped up, eyes squeezed shut, a little off level
      a.look(face(a), "snap");
      a.ch.pose(0, -13, pose.roll, 60);
      a.ch.setLids(1, 1, 0);
    } else {
      a.look(pose.at, "snap");
      // Reduced motion keeps the head front, so the pupils go as far as they reach that way on their own.
      const p = typeof pose.at === "function" ? pose.at() : pose.at;
      if (a.reduced && p) {
        const h = a.head();
        const dx = (p.x - h.x) / innerWidth, dy = (p.y - h.y) / innerHeight;
        const k = 1 / Math.max(Math.abs(dx), Math.abs(dy), 1e-3);
        a.eyes(clamp(dx * k, -1, 1), clamp(dy * k, -1, 1));
      }
    }
    if (pose.kind === "stretch") yield hold;
    else yield* openFor(a, hold, CAUGHT_BLINK_LATE);
    a.eyes(null);
    const you = a.you();
    if (you) a.startle(you);
    else a.ch.pauseBreath(0.4);
    if (pose.kind === "stretch") {
      a.ch.setLids(0, 0, 0.1);
      a.restPose(14);
    }
    a.look("you", "quick");
    yield 1;
  } finally {
    if (a.mood === "awake") a.ch.setLids(0, 0, 0.1);
    a.eyes(null);
    a.restPose();
    a.look(null);
  }
}
