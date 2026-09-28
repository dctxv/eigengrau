import { sfx } from "@/audio/sfx";
import { answer, drowse, heed, lost, murmur, trust, type Beat } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import type { Motes } from "./Motes";
import type { RoomScene } from "./RoomScene";

/**
 * Call and response (panel 2, N5). Tap a rhythm of three to eight taps in Urchi's empty room
 * (each tap still lets a mote go) and it listens, its eyes on your hand rather than on the motes.
 * After 900ms of quiet it looks up at you, leans in and gives the rhythm back as slow blinks at
 * your intervals, each with a soft low pat when sound is on. The third answer in a visit ends on
 * one beat of its own; tap that version back and it gives a cat's slow blink of trust and stays
 * soft-eyed for 20s. At his night it stirs in its sleep instead (or, if you woke it, gives one
 * heavy blink). The only thing it counts is answers in this visit, in memory, for the third.
 */
const RHYTHM = {
  /** Taps in a rhythm it will answer. */
  min: 3,
  max: 8,
  /** Gaps between presses (ms): closer than the first is one tap bouncing, not two; the second is the quiet that ends a rhythm. */
  gap: [120, 900] as [number, number],
  /** A press held longer than this (ms) is not a tap (the panel's CLICK.ms), so the rhythm is off. */
  press: 600,
};
/** The answer that ends on a beat of its own: the third in a visit. */
const OWN_AT = 3;
/**
 * Tapping its version back: the same number of taps, each gap within 25% of its own or 90ms,
 * whichever is wider. Tapping a rhythm back from memory, people land most gaps within 10-15% of
 * it, and on a short gap the error is nearer a fixed 30-60ms than a share, hence the floor. Any
 * looser and a rhythm of the right length would pass whatever its shape. It counts only as the
 * next rhythm, ended within `within` ms of the answer.
 */
const MATCH = { share: 0.25, ms: 90, within: 15000 };
/** Soft eyes once its version comes back, in seconds. */
const SOFT_FOR = 20;
/**
 * Its blinks: at most the site's slow blink (0.35s closing, 0.2s shut, 0.35s opening), which the
 * first beat's closing and the last beat's shut and opening always are. Between two beats, the
 * lids stay shut for `holdShare` of the gap, never under `holdMin` (a beat has to read as a closed
 * moment, not a flicker) nor over `holdMost` of it; of the time left, a fifth is spent at their
 * most open and the rest opening and closing. Where that is too quick for them to open all the way
 * without moving faster than a full `stroke` in 0.12s, they part only as far as that pace takes
 * them, but always to `partMost` or wider, so that each beat still shows: at the 250-500ms most
 * people tap, a heavy, deliberate flutter rather than a string of quick blinks. Under reduced
 * motion the lids go at once, shut for `reducedShare` of the gap, `reducedMin` to `reducedHold`
 * seconds.
 */
const BLINK = {
  close: 0.35, hold: 0.2, open: 0.35,
  holdShare: 0.3, holdMin: 0.07, holdMost: 0.6, still: 0.2, stroke: 0.12, partMost: 0.5,
  reducedHold: 0.24, reducedMin: 0.06, reducedShare: 0.45,
};
/** From the answer starting to its first blink beginning to close (s): the lean (RoomScene's LEAN.in, and a breath more), or under reduced motion, a beat. */
const LEAD = { lean: 0.5, reduced: 0.35 };
/** How far the face tips down as it leans in (degrees). */
const LEAN_PITCH = 3;

/** The acts a rhythm sets off, after the listening. */
const ACTS = ["answer", "trust", "murmur", "drowse", "lost"];

/** Answers finished this visit, in memory: all it keeps, for the third one's extra beat. */
let answered = 0;

/**
 * The answer's blinks for `gaps` (ms): the lids meet on each beat, the first once it has leaned
 * in, counting from `start` (performance.now() ms). `own` marks the last beat as its own.
 */
export function plan(gaps: number[], start: number, reduced: boolean, own = false): Beat[] {
  const n = gaps.length + 1;
  const beats: Beat[] = [];
  let at = start + (reduced ? LEAD.reduced : LEAD.lean + BLINK.close) * 1000;
  let close = reduced ? 0 : BLINK.close;
  for (let i = 0; i < n - 1; i++) {
    const g = gaps[i] / 1000;
    if (reduced) {
      beats.push({ at, close: 0, hold: Math.min(BLINK.reducedHold, Math.max(BLINK.reducedMin, BLINK.reducedShare * g)), open: 0, part: 0 });
    } else {
      const hold = Math.min(BLINK.hold, Math.max(BLINK.holdMin, BLINK.holdShare * g), BLINK.holdMost * g);
      const move = ((g - hold) * (1 - BLINK.still)) / 2;
      const part = Math.min(BLINK.partMost, Math.max(0, 1 - move / BLINK.stroke));
      beats.push({ at, close, hold, open: Math.min(BLINK.open, move), part });
      close = Math.min(BLINK.close, move);
    }
    at += gaps[i];
  }
  // the last: a whole slow blink, opening all the way
  beats.push({ at, close, hold: reduced ? BLINK.reducedHold : BLINK.hold, open: reduced ? 0 : BLINK.open, part: 0, own });
  return beats;
}

/** Whether `tapped` is `version` tapped back (see MATCH). */
export function matches(tapped: number[], version: number[]) {
  return tapped.length === version.length && tapped.every((g, i) => Math.abs(g - version[i]) <= Math.max(MATCH.share * version[i], MATCH.ms));
}

export class Call {
  /** The last answer's beats, for headless QA. */
  plan: Beat[] = [];
  private room: RoomScene;
  private att: Attention;
  private motes: Motes;
  private reduced: boolean;
  /** This rhythm's taps, as the performance.now() ms of each press; where the last one was; the first one's mote. */
  private taps: number[] = [];
  private where: Point | null = null;
  private firstMote: string | null = null;
  /** More taps than it can follow: it has let this rhythm go. */
  private lost = false;
  /** When a press began that has not come up as a tap yet (performance.now() ms), or -1. */
  private pressAt = -1;
  /** Its own version, after the answer with a beat of its own: the gaps (ms), and until when tapping them back counts. */
  private version: { gaps: number[]; until: number } | null = null;
  /** The answer's pats, to take back if it is cut short. */
  private pats: (() => void)[] = [];
  /** The timer that waits for the quiet after a tap (or for a press to have been held too long). */
  private quiet = 0;
  /**
   * The rhythm the timer last closed, as it was: a tap stamped inside it that turns up afterwards
   * (a busy page can hold taps back past the timer) reopens it.
   */
  private closed: { taps: number[]; lost: boolean; version: Call["version"] } | null = null;

  constructor(room: RoomScene, att: Attention, motes: Motes, o: { reducedMotion: boolean }) {
    this.room = room;
    this.att = att;
    this.motes = motes;
    this.reduced = o.reducedMotion;
  }

  /** Listening to a rhythm or answering one (at night, stirring at one), so nothing else should take its eyes. */
  get busy() {
    return this.taps.length > 0 || ACTS.some((name) => this.att.has(name));
  }

  /** A press began on the room, at `at` (performance.now() ms): while a rhythm is going, it may be its next tap. */
  press(at: number) {
    if (!this.taps.length) return;
    this.pressAt = at;
    this.listen(at + RHYTHM.press);
  }

  /** Not a tap on the empty room after all (a drag, a long press, Urchi itself, the game): the rhythm is off. */
  abort() {
    this.pressAt = -1;
    this.closed = null;
    window.clearTimeout(this.quiet);
    if (!this.taps.length) return;
    this.taps = [];
    this.lost = false;
    this.att.cancel("heed");
  }

  /** The page went out of sight: a rhythm half tapped is dropped, and an answer stops, its pats with it (nobody is there to see the blinks). */
  stop() {
    this.abort();
    this.att.cancel("answer");
  }

  /** A tap on the empty room, pressed at `at` (performance.now() ms): a mote goes there, and it may be part of a rhythm. */
  tap(clientX: number, clientY: number, at: number) {
    this.pressAt = -1;
    const closed = this.closed;
    this.closed = null;
    if (!this.taps.length && closed && at - closed.taps[closed.taps.length - 1] <= RHYTHM.gap[1]) {
      // closed too soon: this tap was made inside the rhythm and held back, so the rhythm goes on,
      // and whatever the closing set off (an answer not a frame old) is taken back
      ACTS.forEach((name) => this.att.cancel(name));
      this.taps = closed.taps;
      this.lost = closed.lost;
      this.version = closed.version;
    }
    // tapping over its answer (or one about to start) cuts it short: you are talking again
    if (this.att.has("answer")) this.att.cancel("answer");
    const last = this.taps[this.taps.length - 1];
    if (last !== undefined && at - last > RHYTHM.gap[1]) this.end(); // the timer would have, had the page not been busy
    const prev = this.taps[this.taps.length - 1];
    if (prev !== undefined && at - prev < RHYTHM.gap[0]) {
      this.motes.release(clientX, clientY, true);
      return;
    }
    this.taps.push(at);
    this.where = { x: clientX, y: clientY };
    this.listen(at + RHYTHM.gap[1]);
    const n = this.taps.length;
    const mote = this.motes.release(clientX, clientY, n > 1);
    if (n === 1) {
      this.firstMote = mote;
      return;
    }
    if (n === 2) {
      // a rhythm: the first mote is no longer the point, you are
      if (this.firstMote) this.att.quiet(this.firstMote);
      this.att.cancel("windUp");
    }
    if (this.lost) return;
    // its own version of an eight-tap rhythm is nine: tapping that back is not too many
    const v = this.version;
    const most = v && at < v.until ? Math.max(RHYTHM.max, v.gaps.length + 1) : RHYTHM.max;
    if (n > most) {
      this.lost = true;
      this.att.cancel("heed");
      this.att.play("lost", 5, () => lost(this.att));
      return;
    }
    if (!this.att.has("heed")) this.att.play("heed", 5, () => heed(this.att, () => this.taps.length), { queue: 1 });
  }

  /** Looks again at `ms` (performance.now() ms), or a moment from now if that has gone. */
  private listen(ms: number) {
    window.clearTimeout(this.quiet);
    this.quiet = window.setTimeout(() => this.check(), Math.max(0, ms - performance.now()) + 1);
  }

  /**
   * Is it quiet yet? After 900ms with no tap, the rhythm is over and answered; a press still down
   * waits for the press limit instead (a tap may be on its way), and past it the rhythm is off.
   * Either way it can be reopened (see `closed`): a page busy painting can hold taps back past
   * this timer, and the order it runs them in is not to be relied on.
   */
  private check() {
    if (!this.taps.length) return;
    const held = this.pressAt >= 0;
    const due = held ? this.pressAt + RHYTHM.press : this.taps[this.taps.length - 1] + RHYTHM.gap[1];
    if (performance.now() < due) {
      this.listen(due);
      return;
    }
    this.closed = { taps: this.taps, lost: this.lost, version: this.version };
    if (!held) {
      this.end();
      return;
    }
    this.taps = [];
    this.lost = false;
    this.pressAt = -1;
    this.att.cancel("heed");
  }

  /** The quiet after a rhythm: answer it, if it was one. */
  private end() {
    const taps = this.taps;
    const gaveUp = this.lost;
    this.taps = [];
    this.lost = false;
    this.pressAt = -1;
    window.clearTimeout(this.quiet);
    this.att.cancel("heed");
    if (gaveUp || taps.length < RHYTHM.min) return;
    this.respond(
      taps.slice(1).map((t, i) => t - taps[i]),
      this.where,
    );
  }

  private respond(gaps: number[], where: Point | null) {
    const att = this.att;
    const version = this.version;
    this.version = null;
    // his night: it does not perform
    if (att.hours === "night") {
      if (att.mood === "asleep") att.play("murmur", 5, () => murmur(att, where), { sleeping: true });
      else if (att.mood === "awake") att.play("drowse", 5, () => drowse(att));
      return;
    }
    if (att.mood !== "awake") return;
    if (version && performance.now() < version.until && matches(gaps, version.gaps)) {
      att.play("trust", 5, () => trust(att, () => att.soften(SOFT_FOR)));
      return;
    }
    const own = answered + 1 === OWN_AT;
    // its own beat comes after the rhythm's longest gap: a pause, then one more on the grid you set
    const all = own ? [...gaps, Math.max(...gaps)] : gaps;
    att.play(
      "answer",
      5,
      () => answer(att, () => this.begin(all, own), { lean: (on) => this.room.leanUrchi(on), pitch: LEAN_PITCH, end: (done) => this.finish(done, own, all) }),
      { queue: 1 },
    );
  }

  /** The answer has begun: its beats from now, and a pat heard on each (with sound on). */
  private begin(gaps: number[], own: boolean): Beat[] {
    const beats = plan(gaps, performance.now(), this.reduced, own);
    this.pats.forEach((stop) => stop());
    this.pats = beats.map((b) => sfx.pat(b.at, !!b.own));
    this.plan = beats;
    return beats;
  }

  /** The answer stopped: `done` if every beat was given. Cut short, its pats still to come are taken back. */
  private finish(done: boolean, own: boolean, gaps: number[]) {
    if (!done) this.pats.forEach((stop) => stop());
    this.pats = [];
    if (!done) return;
    answered++;
    if (own) this.version = { gaps, until: performance.now() + MATCH.within };
  }

  dispose() {
    window.clearTimeout(this.quiet);
    this.pats.forEach((stop) => stop());
    this.pats = [];
  }
}
