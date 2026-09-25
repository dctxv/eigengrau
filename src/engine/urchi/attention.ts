import { sfx } from "@/audio/sfx";
import { pointerSeen } from "@/lib/visits";
import type { LookHow, UrchiCharacter } from "./character";
import { clock, type Hours } from "./hours";
import { doze, dozeOff, nod, peek, soundOn, stir, wake } from "./acts";

/**
 * Attention, not tracking (spec S2). Urchi chooses what to look at. Everything
 * that wants its eyes is a target (the pointer, a hovered tab pill, a mote,
 * the spot where the pointer left the window) or a short scripted beat, an
 * act (a look at what is new, reading his caption, the sound coming on, a mote
 * too close to its face). A target pulls with a base weight times a novelty
 * that spikes when something happens to it and fades (a 5s half-life, 2s
 * under wiggling, so it cannot be wound up like a toy); Urchi looks at what
 * pulls hardest, and only switches when something clearly pulls harder, so it
 * never flickers. When nothing does, it gets bored: it looks off to a corner
 * and checks back on you every few seconds, as a cat does. An act, while it
 * runs, has the eyes to itself.
 *
 * It also keeps the creature's state: one alertness value (drowsy .. alert,
 * settling over about 30s) that sets the breath, the blinks and a resting
 * lid; his hours (asleep at night, drowsy late, dozing when nobody moves);
 * listening while he plays something; the bed playing. The character does the
 * moving (character.ts's attention hooks); this only decides.
 */

export type Point = { x: number; y: number };
/** A place to look: a point, or a way to find one each frame (null while it is not there). */
export type Where = Point | (() => Point | null);
/** An act: a generator that yields the seconds to wait before its next step (0: the next frame). */
export type Act = Generator<number, void, void>;
export type Mood = "awake" | "dozing" | "asleep";

export type TargetKind = "pointer" | "pill" | "exit" | "mote";
export type TargetSpec = {
  id: string;
  kind: TargetKind;
  /** How much this kind of thing matters to it. */
  weight: number;
  at: () => Point | null;
  /** A mote's level above eigengrau, of 255: the faintest pulls a little harder. */
  level?: number;
};
type Target = TargetSpec & { novelty: number; spikes: number[]; born: number };

type Running = { name: string; priority: number; gen: Act; wait: number; sleeping: boolean };
type Queued = { name: string; priority: number; make: () => Act; sleeping: boolean; expires: number };

export type AttentionOptions = {
  /** The head's centre, in client px. */
  head(): Point;
  /** How far the head reaches from its centre, in client px (about half its box). */
  reach(): number;
  reducedMotion: boolean;
  /** Its mood changed (asleep, dozing, awake): the host's caption and label follow. */
  onMood?: (mood: Mood) => void;
};

/** What a target pulls with at no novelty at all. */
const FLOOR: Record<TargetKind, number> = { pointer: 0.3, pill: 0.6, exit: 0.65, mote: 0.2 };
const NOVELTY = { halfLife: 5, wiggleHalfLife: 2, habituate: 0.45, recent: 6 };
/** A challenger must pull this much harder, and the current look be this old, before the eyes move. */
const HYSTERESIS = { ratio: 1.2, margin: 0.05, dwell: 0.35 };
const BORED = { below: 0.45, after: 1.5, grace: 4, check: [3, 6] as [number, number], checkFor: 0.9 };
/** The pointer. Speeds in px/s. */
const POINTER = { rest: 0.35, fast: 700, stopAfter: 0.12, motion: 0.25, motionAt: 400, away: 4 };
/**
 * A hovered pill is a pet watching you head for the door: a moment, not a stare. Once the pointer
 * has rested on it `after` seconds its pull fades over `over` seconds to `to` of itself, so a
 * pointer parked on the "1" goes stale like any other and the room's boredom and motes come back.
 */
const PILL_STALE = { after: 3, over: 1.5, to: 0.3 };
/** Where the pointer left: looked at for up to this long. */
const EXIT_FOR = 20;
/** Motes pull once the pointer has been still this long, ramping up over a second. */
const MOTE_STILL = { after: 3, ramp: 1, bonus: 0.6, faintest: 0.08, bob: [5, 10] as [number, number] };
/** A turn wider than this (degrees) gets a blink mid-turn; the character's look angles per unit. */
const TURN = { blink: 20, yaw: 41.25, pitch: 16, after: 0.14, gap: 1.6 };
const STARTLE = { gap: 2.5, pause: 0.4, widen: 0.06, widenFor: 0.7 };
/** Alertness: where it rests, how fast the stirred part settles (tau, s), and what stillness takes off. */
const ALERT = { base: 0.6, tau: 10, idleFrom: 20, idleOver: 100, idleMax: 0.3, listening: 0.15 };
/** Stillness, in seconds without the pointer: longer blinks from `heavy`, a doze at `doze`; at night, back to sleep at `night`. */
const IDLE = { heavy: 45, doze: 90, night: 40 };
/** Asleep: a pointer within this many px of the head (or a tap) opens one eye. */
const NEAR = 160;
/** Once woken in this session, it stays up for this long across tabs (ms). */
const STAYS_UP = 3 * 60 * 1000;
/** In memory for the session: when it was last woken. */
let wokenAt = -Infinity;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** A tab pill's centre in client px, by its href; null when it is not laid out. */
export function pillAt(href: string): Point | null {
  const el = document.querySelector<HTMLElement>(`.tabs .tab[href="${href}"]`);
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}

/** The sound chip's centre; null where it is hidden (phones). */
function chipAt(): Point | null {
  const r = document.querySelector<HTMLElement>(".sound-chip")?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}

export class Attention {
  readonly ch: UrchiCharacter;
  readonly reduced: boolean;
  /** Seconds since it was made. */
  t = 0;
  mood: Mood = "awake";
  /** Alertness, 0 drowsy .. 1 alert. */
  alertness = ALERT.base;
  hours: Hours = "day";
  listening = false;
  private o: AttentionOptions;
  private started = false;
  private startedAt = 0;
  private paused = false;
  private targets = new Map<string, Target>();
  private current: Target | null = null;
  private currentSince = 0;
  private boredFor = 0;
  private idle = { corner: null as Point | null, next: 0, checkUntil: -1 };
  private act: Running | null = null;
  private queue: Queued[] = [];
  private actGaze: Where | "you" | "hold" | null = null;
  /** How an act's last look should turn (a snap, a quick turn): sent with the next aim, once. */
  private actHow: LookHow | undefined;
  private held: Point | null = null;
  private last = { nx: 0, ny: 0, has: false };
  private blinkAt = -1;
  private lastBlinkCue = -99;
  private lastStartle = -99;
  private arousal = 0;
  private bobNext = 0;
  private nodPill: string | null = null;
  private wokeAt = -99;
  private moodAt = 0;
  private nextClock = 0;
  private applied = "";
  private steadying = false;
  private pointer = {
    x: 0, y: 0, has: false, touch: false, vx: 0, vy: 0, speed: 0,
    /** Last event of any kind, last move, when it left the window, when it last went fast. */
    lastEvent: 0, lastMove: -99, leftAt: -99, fastAt: -99, dirX: 0, reversals: [] as number[], wiggleUntil: -99, lastEvtMs: 0,
  };
  private off: (() => void)[] = [];

  constructor(ch: UrchiCharacter, o: AttentionOptions) {
    this.ch = ch;
    this.o = o;
    this.reduced = o.reducedMotion;
    ch.attend();
    // Back on tab 1 with the pointer resting where it clicked (the "1", or wherever it was for
    // Back): that is where you are, though it has not moved since. A touch has lifted, so a phone
    // (like a keyboard, or a first arrival) starts with nobody there, and "you" is straight ahead.
    const seen = pointerSeen();
    if (seen && !seen.touch) {
      const p = this.pointer;
      p.x = clamp(seen.x, 0, innerWidth);
      p.y = clamp(seen.y, 0, innerHeight);
      p.has = true;
      p.lastMove = -(performance.now() - seen.at) / 1000;
      p.lastEvtMs = seen.at;
    }
    this.targets.set("pointer", { id: "pointer", kind: "pointer", weight: 1, at: () => (this.pointer.has ? { x: this.pointer.x, y: this.pointer.y } : null), novelty: 0, spikes: [], born: 0 });
    this.listen();
  }

  // ---------------------------------------------------------------- the host's side

  /**
   * It starts paying attention (after the intro's first look, or on arrival). At night it is
   * asleep when you arrive, unless you woke it in the last few minutes; after the intro, which
   * opened its eyes, it goes back to sleep.
   */
  start(o: { afterIntro?: boolean } = {}) {
    if (this.started) return;
    this.started = true;
    this.startedAt = this.t;
    this.hours = clock().hours;
    this.nextClock = this.t + 20;
    this.pointer.lastEvent = this.t;
    if (this.hours === "night" && !this.listening && Date.now() - wokenAt > STAYS_UP) {
      if (o.afterIntro) this.play("dozeOff", 8, () => dozeOff(this), { sleeping: true });
      else {
        this.setMood("asleep", 0);
        this.ch.pose(0, 7, 0, 60); // already sunk when you arrive
      }
    }
    this.apply(true);
  }

  /** The game is up: it just watches the pointer, and nothing else happens until it closes (nor after: what was waiting is dropped). */
  pause(on: boolean) {
    this.paused = on;
    if (on) {
      this.stopAct();
      this.queue = [];
    }
  }

  /** He is playing something now (or not). */
  setListening(on: boolean) {
    if (on === this.listening) return;
    this.listening = on;
    if (on && this.mood !== "awake") this.play("stir", 8, () => stir(this), { sleeping: true });
  }

  /** The pill whose hover gets a nod (the tab it pointed out as new). */
  nodAt(href: string | null) {
    this.nodPill = href;
  }

  /**
   * A click or tap on Urchi. Asleep (or dozing, or just woken by this same press), it wakes and
   * the click is spent; returns whether it was.
   */
  wake(): boolean {
    if (this.mood === "awake") return this.t - this.wokeAt < 0.8;
    wokenAt = Date.now();
    this.play("wake", 9, () => wake(this), { sleeping: true });
    return true;
  }

  /** Asleep or dozing: a click would wake it. (Only "asleep" is the night's sleep.) */
  get asleep() {
    return this.mood !== "awake";
  }

  /**
   * The pointer came onto it. Dozing, it stirs now rather than on the next frame, so the host
   * decides its caption with it awake (and does not raise a sleeping line in daylight first).
   */
  rouse() {
    if (this.mood === "dozing" && this.canStir()) this.play("stir", 8, () => stir(this, true), { sleeping: true });
  }

  /** A doze can be broken once it has settled (not while its lids are still closing). */
  private canStir() {
    return this.started && !this.paused && !this.act?.sleeping && this.t - this.moodAt > 1;
  }

  // ---------------------------------------------------------------- targets

  add(spec: TargetSpec, novelty = 0) {
    this.targets.set(spec.id, { ...spec, novelty, spikes: novelty > 0 ? [this.t] : [], born: this.t });
  }

  remove(id: string) {
    this.targets.delete(id);
    if (this.current?.id === id) this.current = null;
  }

  /** Something happened to a target: its novelty jumps (less each time it repeats). A startle for something new. */
  spike(id: string, amount: number, startle = false) {
    const tg = this.targets.get(id);
    if (!tg) return;
    tg.spikes = tg.spikes.filter((s) => this.t - s < NOVELTY.recent);
    let mag = amount / (1 + NOVELTY.habituate * tg.spikes.length);
    if (this.t < this.pointer.wiggleUntil) mag *= 0.5;
    tg.spikes.push(this.t);
    tg.novelty = Math.min(1.5, tg.novelty + mag);
    this.arousal = Math.min(0.45, this.arousal + 0.2 * mag);
    const at = tg.at();
    if (startle && at) this.startle(at);
  }

  /** A target's novelty spent (a tap that became a mote: the mote has it now). */
  quiet(id: string) {
    const tg = this.targets.get(id);
    if (tg) tg.novelty *= 0.2;
  }

  /** Whether the eyes are on this target right now, of their own accord. */
  watching(id: string) {
    return !this.act && this.current?.id === id && this.boredFor < BORED.after;
  }

  /** Where it is looking now, in client px, or null before it has looked anywhere. */
  get gazeNow(): Point | null {
    return this.last.has ? { x: ((this.last.nx + 1) / 2) * innerWidth, y: ((this.last.ny + 1) / 2) * innerHeight } : null;
  }

  /** The pointer, as a place: you. */
  you(): Point | null {
    return this.pointer.has ? { x: this.pointer.x, y: this.pointer.y } : null;
  }

  /** The pointer's velocity in px/s, and whether it is there: the air that pushes a mote. */
  air() {
    const p = this.pointer;
    return { has: p.has && !p.touch, x: p.x, y: p.y, vx: p.vx, vy: p.vy };
  }

  /** Seconds since the pointer last moved or pressed. */
  get stillFor() {
    return this.t - this.pointer.lastEvent;
  }

  // ---------------------------------------------------------------- acts

  /**
   * Run a scripted beat. A higher priority interrupts what is running (its finally blocks run);
   * otherwise it waits in line for up to `queue` seconds (Infinity: until cancelled), or is
   * dropped. Before it has started (the intro still has its eyes) an act can only wait. Asleep,
   * only acts marked `sleeping` run.
   */
  play(name: string, priority: number, make: () => Act, o: { queue?: number; sleeping?: boolean } = {}): boolean {
    if (this.paused) return false;
    const sleeping = !!o.sleeping;
    if (this.mood !== "awake" && !sleeping) return false;
    if (!this.started || (this.act && this.act.priority >= priority)) {
      if (o.queue) this.queue.push({ name, priority, make, sleeping, expires: this.t + o.queue });
      return !!o.queue;
    }
    this.stopAct();
    this.act = { name, priority, gen: make(), wait: 0, sleeping };
    this.stepAct(0);
    return true;
  }

  /** The act running now, by name. */
  get acting(): string | null {
    return this.act?.name ?? null;
  }

  /** Whether an act by this name is running or waiting. */
  has(name: string): boolean {
    return this.act?.name === name || this.queue.some((q) => q.name === name);
  }

  /** Stops an act by name, running or waiting (the caption it was reading has gone). */
  cancel(name: string) {
    this.queue = this.queue.filter((q) => q.name !== name);
    if (this.act?.name === name) this.stopAct();
  }

  /**
   * For acts: where the eyes go ("you": the pointer; "hold": where they are now; null: their own
   * choice). `how` shapes this one turn (a snap, a quick turn) and is spent on the next frame's
   * aim, even if the act has moved on to its next step by then.
   */
  look(where: Where | "you" | "hold" | null, how?: LookHow) {
    this.actGaze = where;
    if (how) this.actHow = how;
    this.held = where === "hold" ? this.gazeNow : null;
  }

  /** For acts: the pupils alone (see character eyesTo). */
  eyes(ex: number | null, ey = 0) {
    this.ch.eyesTo(ex, ey);
  }

  /** For acts: something new over there. The breath stops, the eyes widen, and the tilt goes toward it. */
  startle(at: Point) {
    if (this.t - this.lastStartle < STARTLE.gap || this.mood !== "awake") return;
    this.lastStartle = this.t;
    this.arousal = Math.min(0.45, this.arousal + 0.3);
    this.ch.pauseBreath(STARTLE.pause);
    this.ch.widen(STARTLE.widen, STARTLE.widenFor);
    if (!this.steadying) this.ch.tiltToward(at.x < this.o.head().x ? -1 : 1); // reading keeps its head level
  }

  /** For acts: no curious tilts while it concentrates (reading); the head comes level. */
  steady(on: boolean) {
    if (on === this.steadying) return;
    this.steadying = on;
    this.apply(true);
  }

  /** For acts: the head back to the mood's own pose (level awake, dipped asleep). */
  restPose(speed = 6) {
    const dip = this.mood === "asleep" ? 7 : this.mood === "dozing" ? 4 : 0;
    this.ch.pose(0, dip, 0, speed);
  }

  /** For acts: the mood changes (lids over `seconds`). */
  setMood(mood: Mood, seconds: number) {
    this.mood = mood;
    this.moodAt = this.t;
    if (mood === "awake") {
      this.wokeAt = this.t;
      this.pointer.lastEvent = this.t;
      this.ch.setLids(0, 0, seconds);
    } else this.ch.setLids(1, 1, seconds);
    this.apply(true);
    this.restPose(2);
    this.o.onMood?.(mood);
  }

  /** The head's centre, and how far it reaches. */
  head() {
    return { ...this.o.head(), reach: this.o.reach() };
  }

  private stopAct() {
    const a = this.act;
    this.act = null;
    this.actGaze = null;
    this.actHow = undefined;
    this.held = null;
    if (a) {
      a.gen.return();
      this.ch.eyesTo(null);
    }
  }

  private stepAct(dt: number) {
    if (!this.act) {
      this.queue = this.queue.filter((q) => q.expires > this.t && (q.sleeping || this.mood === "awake"));
      const next = this.queue.sort((a, b) => b.priority - a.priority).shift();
      if (!next) return;
      this.act = { name: next.name, priority: next.priority, gen: next.make(), wait: 0, sleeping: next.sleeping };
    }
    const a = this.act;
    a.wait -= dt;
    while (this.act === a && a.wait <= 0) {
      const r = a.gen.next();
      if (r.done) {
        if (this.act === a) this.stopAct();
        return;
      }
      a.wait = r.value;
      if (a.wait <= 0) break; // the next frame
    }
  }

  // ---------------------------------------------------------------- senses

  private listen() {
    const p = this.pointer;
    const now = () => this.t;
    const onWin = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(type, fn, { passive: true });
      this.off.push(() => window.removeEventListener(type, fn));
    };
    const came = (e: PointerEvent) => {
      const back = !p.has;
      const awayFor = now() - p.leftAt;
      p.touch = e.pointerType === "touch";
      p.has = true;
      if (back) {
        this.remove("exit");
        if (p.leftAt > 0) this.spike("pointer", 0.8, awayFor > POINTER.away);
      }
    };
    onWin("pointermove", (e) => {
      const t = now();
      const ms = e.timeStamp || performance.now();
      const dtE = Math.max(0.004, (ms - p.lastEvtMs) / 1000);
      const wasStill = t - p.lastMove > POINTER.rest;
      came(e);
      if (!wasStill) {
        const ivx = clamp((e.clientX - p.x) / dtE, -6000, 6000), ivy = clamp((e.clientY - p.y) / dtE, -6000, 6000);
        p.vx += (ivx - p.vx) * 0.35;
        p.vy += (ivy - p.vy) * 0.35;
      } else {
        p.vx = p.vy = 0;
      }
      p.lastEvtMs = ms;
      p.x = e.clientX;
      p.y = e.clientY;
      p.speed = Math.hypot(p.vx, p.vy);
      if (p.speed > POINTER.fast) p.fastAt = t;
      // wiggling: the pointer turning back and forth
      if (Math.abs(p.vx) > 150) {
        const dir = Math.sign(p.vx);
        if (p.dirX && dir !== p.dirX) {
          p.reversals = p.reversals.filter((r) => t - r < 2.5);
          p.reversals.push(t);
          if (p.reversals.length >= 4) p.wiggleUntil = t + 2;
        }
        p.dirX = dir;
      }
      if (wasStill) this.spike("pointer", 0.6, t - p.lastMove > 8 && this.stillFor > 8);
      p.lastMove = t;
      p.lastEvent = t;
    });
    onWin("pointerdown", (e) => {
      came(e);
      p.x = e.clientX;
      p.y = e.clientY;
      p.lastEvtMs = e.timeStamp || performance.now();
      p.lastEvent = now();
      p.lastMove = now();
      this.spike("pointer", 1);
    });
    onWin("pointerout", (e) => {
      if (e.relatedTarget || e.pointerType === "touch") return;
      this.left();
    });
    onWin("blur", () => this.left());
    // a hovered tab pill: it looks up at it, like a pet watching you head for the door
    const over = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const tab = (e.target as Element | null)?.closest?.(".tabs .tab") as HTMLAnchorElement | null;
      if (!tab) return;
      const href = tab.getAttribute("href") ?? "";
      const id = `pill:${href}`;
      if (!this.targets.has(id)) {
        this.add({ id, kind: "pill", weight: 1.3, at: () => pillAt(href) });
        this.spike(id, 1);
        if (href === this.nodPill) this.play("nod", 2, () => nod(this), { queue: 0.8 });
      }
    };
    const out = (e: PointerEvent) => {
      const tab = (e.target as Element | null)?.closest?.(".tabs .tab");
      if (!tab || tab.contains(e.relatedTarget as Node | null)) return;
      this.remove(`pill:${tab.getAttribute("href") ?? ""}`);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    this.off.push(() => document.removeEventListener("pointerover", over), () => document.removeEventListener("pointerout", out));
    // the sound coming on: a startle, a look at the chip, then listening for where it comes from
    let was = sfx.enabled;
    this.off.push(
      sfx.onChange((on) => {
        if (on && !was) this.play("sound", 4, () => soundOn(this, chipAt), { queue: 1.5 });
        was = on;
        this.apply(true);
      }),
    );
  }

  /** The pointer left the window: it keeps looking where it went, for a while. */
  private left() {
    const p = this.pointer;
    if (!p.has || p.touch) return;
    p.has = false;
    p.leftAt = this.t;
    const at = { x: clamp(p.x, 0, innerWidth), y: clamp(p.y, 0, innerHeight) };
    this.add({ id: "exit", kind: "exit", weight: 0.8, at: () => at }, 1);
  }

  // ---------------------------------------------------------------- the frame

  /** Called every frame before the character's own, dt in seconds. */
  update(dt: number) {
    this.t += dt;
    if (!this.started) return;
    this.sense(dt);
    this.moodStep();
    if (this.paused) {
      this.aim(this.you(), false);
      return;
    }
    this.stepAct(dt);
    let gaze: Point | null;
    let fixate = true;
    if (this.act && this.actGaze !== null) {
      gaze = this.resolve(this.actGaze);
    } else if (this.mood !== "awake") {
      gaze = null; // asleep: ahead, still
    } else {
      const c = this.choose(dt);
      gaze = c.at;
      fixate = c.fixate;
    }
    // an act's snap or quick turn goes with this aim and is spent: a quick turn stiffens the head
    // for that turn only, and a snap is already there
    const how = this.act && this.actGaze !== null ? this.actHow : undefined;
    this.actHow = undefined;
    this.aim(gaze, fixate, how);
  }

  private resolve(w: Where | "you" | "hold"): Point | null {
    if (w === "you") return this.you() ?? this.ahead();
    if (w === "hold") return this.held;
    return typeof w === "function" ? w() : w;
  }

  /** Straight ahead: out of the screen at you. */
  private ahead(): Point {
    const h = this.o.head();
    return { x: h.x, y: h.y };
  }

  private sense(dt: number) {
    const p = this.pointer;
    // the pointer's speed dies away between events; a fast move that ends is a sudden stop
    if (this.t - p.lastMove > 0.05) {
      const k = Math.exp(-dt / 0.08);
      p.vx *= k;
      p.vy *= k;
      p.speed = Math.hypot(p.vx, p.vy);
    }
    if (p.fastAt > 0 && this.t - p.lastMove > POINTER.stopAfter && p.fastAt >= p.lastMove - 0.2) {
      p.fastAt = -99;
      this.spike("pointer", 0.5);
    }
    // novelty fades: a 5s half-life, 2s while the pointer is being wiggled
    const wiggling = this.t < p.wiggleUntil;
    for (const tg of this.targets.values()) {
      const hl = tg.kind === "pointer" && wiggling ? NOVELTY.wiggleHalfLife : NOVELTY.halfLife;
      tg.novelty *= Math.pow(0.5, dt / hl);
    }
    const exit = this.targets.get("exit");
    if (exit && this.t - exit.born > EXIT_FOR) this.remove("exit");
    this.arousal *= Math.exp(-dt / ALERT.tau);
    const idle = clamp((this.stillFor - ALERT.idleFrom) / ALERT.idleOver, 0, 1) * ALERT.idleMax;
    const target = clamp(ALERT.base + this.arousal - idle + (this.listening ? ALERT.listening : 0), 0, 1);
    this.alertness += (target - this.alertness) * (1 - Math.exp(-dt / 1.5));
    if (this.blinkAt > 0 && this.t >= this.blinkAt) {
      this.blinkAt = -1;
      this.ch.blink();
    }
  }

  /** How hard a target pulls right now. */
  private salience(tg: Target, faintest: number): number {
    let s = tg.weight * (FLOOR[tg.kind] + tg.novelty);
    if (tg.kind === "pointer") s += POINTER.motion * Math.min(1, this.pointer.speed / POINTER.motionAt);
    if (tg.kind === "exit") s *= 1 - Math.pow((this.t - tg.born) / EXIT_FOR, 3);
    if (tg.kind === "pill") s *= lerp(1, PILL_STALE.to, clamp((this.stillFor - PILL_STALE.after) / PILL_STALE.over, 0, 1));
    if (tg.kind === "mote") {
      // once you have been still a while (or gone a while), the faint things in the room get interesting
      // (not while it is still watching the spot where you left)
      const gone = !this.pointer.has && !this.targets.has("exit");
      const still = gone ? 1 : this.pointer.has ? clamp((this.stillFor - MOTE_STILL.after) / MOTE_STILL.ramp, 0, 1) : 0;
      s += MOTE_STILL.bonus * still + (tg.level === faintest ? MOTE_STILL.faintest : 0);
    }
    return s;
  }

  private choose(dt: number): { at: Point | null; fixate: boolean } {
    let faintest = Infinity;
    for (const tg of this.targets.values()) if (tg.kind === "mote" && tg.level !== undefined) faintest = Math.min(faintest, tg.level);
    let best: Target | null = null;
    let bestS = 0;
    let curS = 0;
    let curAt: Point | null = null;
    for (const tg of this.targets.values()) {
      const at = tg.at();
      if (!at) continue;
      const s = this.salience(tg, faintest);
      if (tg === this.current) {
        curS = s;
        curAt = at;
      }
      if (s > bestS) {
        best = tg;
        bestS = s;
      }
    }
    if (best && best !== this.current) {
      const clearly = bestS > curS * HYSTERESIS.ratio + HYSTERESIS.margin && this.t - this.currentSince > HYSTERESIS.dwell;
      if (!curAt || clearly) {
        this.current = best;
        this.currentSince = this.t;
        curS = bestS;
        curAt = best.at();
        if (best.kind === "mote") this.bobNext = this.t + rand(2, 4);
      }
    }
    // bored: nothing pulls much, so it looks off somewhere and checks back on you now and then
    this.boredFor = curS < BORED.below && this.t - this.startedAt > BORED.grace ? this.boredFor + dt : 0;
    if (!curAt && this.t - this.startedAt < BORED.grace) return { at: this.ahead(), fixate: true }; // just arrived: out at you
    if (this.boredFor > BORED.after || !curAt) return { at: this.wander(), fixate: true };
    this.idle.corner = null;
    const cur = this.current!;
    if (cur.kind === "mote" && this.t > this.bobNext && this.t - this.currentSince > 2) {
      this.ch.bob();
      this.bobNext = this.t + rand(...MOTE_STILL.bob);
    }
    const settled = cur.kind !== "pointer" || this.t - this.pointer.lastMove > 0.5;
    return { at: curAt, fixate: settled };
  }

  /** Boredom's gaze: a corner (the bottom centre on a phone, where the thumb lives), and back on you every 3-6s. */
  private wander(): Point {
    const w = innerWidth, h = innerHeight, i = this.idle;
    const you = this.you();
    if (i.checkUntil > this.t && you) return you;
    if (!i.corner || this.t >= i.next) {
      if (i.corner && you && i.checkUntil < this.t && Math.random() < 0.8) {
        i.checkUntil = this.t + BORED.checkFor; // a check on you first
        i.next = this.t + BORED.checkFor;
        i.corner = Math.random() < 0.5 ? i.corner : null;
        return you;
      }
      const phone = this.pointer.touch || matchMedia("(hover: none)").matches;
      const corners = phone
        ? [{ x: w / 2, y: h * 0.94 }]
        : [
            { x: w * 0.16, y: h * 0.14 },
            { x: w * 0.84, y: h * 0.14 },
            { x: w * 0.18, y: h * 0.86 },
            { x: w * 0.82, y: h * 0.86 },
          ];
      const others = corners.filter((c) => !i.corner || c.x !== i.corner.x || c.y !== i.corner.y);
      i.corner = i.corner && phone ? i.corner : (others.length ? others : corners)[Math.floor(Math.random() * (others.length || corners.length))];
      i.next = this.t + rand(...BORED.check);
    }
    return i.corner;
  }

  /** Sends the gaze to the character; a wide turn gets a blink in the middle of it. */
  private aim(p: Point | null, fixate: boolean, how?: LookHow) {
    const nx = p ? clamp((p.x / innerWidth) * 2 - 1, -1, 1) : 0;
    const ny = p ? clamp((p.y / innerHeight) * 2 - 1, -1, 1) : 0;
    if (this.last.has && how !== "snap") {
      const turn = Math.hypot((nx - this.last.nx) * TURN.yaw, (ny - this.last.ny) * TURN.pitch);
      if (turn > TURN.blink && this.t - this.lastBlinkCue > TURN.gap && this.mood === "awake") {
        this.lastBlinkCue = this.t;
        this.blinkAt = this.t + TURN.after;
      }
    }
    this.last = { nx, ny, has: true };
    this.ch.lookAt(nx, ny, how);
    this.ch.fixate(fixate);
  }

  // ---------------------------------------------------------------- mood

  private moodStep() {
    if (this.t >= this.nextClock) {
      this.nextClock = this.t + 20;
      const h = clock().hours;
      if (h !== this.hours) {
        this.hours = h;
        this.applied = "";
      }
    }
    if (this.paused || this.act?.sleeping) return this.apply();
    const still = this.stillFor;
    if (this.mood === "awake" && !this.listening && this.t - this.wokeAt > 2) {
      if (this.hours === "night" && still > IDLE.night) this.play("dozeOff", 8, () => dozeOff(this), { sleeping: true });
      else if (this.hours !== "night" && still > IDLE.doze) this.play("doze", 8, () => doze(this), { sleeping: true });
    } else if (this.mood === "dozing" && still < 0.5 && this.canStir()) {
      this.play("stir", 8, () => stir(this, true), { sleeping: true });
    } else if (this.mood === "asleep") {
      const you = this.you();
      const h = this.o.head();
      const near = you && Math.hypot(you.x - h.x, you.y - h.y) - this.o.reach() < NEAR && still < 1;
      if (near && !this.act) this.play("peek", 5, () => peek(this), { sleeping: true });
    }
    this.apply();
  }

  /** The mood, the hours, listening, the bed and alertness, turned into the character's settings. */
  apply(force = false) {
    const ch = this.ch;
    const a = this.alertness;
    const asleep = this.mood !== "awake";
    const late = this.hours === "late" || this.hours === "night";
    const drowsy = 1 - a;
    const heavy = !this.listening && this.mood === "awake" ? clamp((this.stillFor - IDLE.heavy) / (IDLE.doze - IDLE.heavy), 0, 1) : 0;
    let period = 3.6 + 3.4 * Math.pow(drowsy, 1.6);
    if (late) period = Math.max(period, 5.8);
    if (sfx.enabled) period = Math.max(period, 5.2);
    let lid = 0.15 * clamp((0.5 - a) / 0.5, 0, 1);
    if (late || this.listening) lid = Math.max(lid, this.reduced ? 0.45 : 0.2);
    const s = asleep
      ? { period: this.mood === "asleep" ? 6.5 : 6.2, depth: this.mood === "asleep" ? 1.4 : 1.25, gap: [6, 12], hold: 0.15, lid: 0, tilts: null, sway: 0, darts: "still" as const }
      : {
          period,
          depth: 1,
          gap: [lerp(2.5, 5, drowsy), lerp(5.5, 9, drowsy)],
          hold: lerp(0.15, 0.6, heavy),
          lid,
          tilts: this.listening || this.steadying ? null : late ? [8, 14] : [4, 9],
          sway: this.listening ? 2.5 : 0,
          darts: this.listening ? ("drift" as const) : ("dart" as const),
        };
    // only what changed goes to the character (rounded, so alertness drifting does not resend every frame)
    const key = JSON.stringify([s.period.toFixed(1), s.depth, s.gap.map((g) => g.toFixed(1)), s.hold.toFixed(2), s.lid.toFixed(2), s.tilts, s.sway, s.darts]);
    if (!force && key === this.applied) return;
    this.applied = key;
    ch.setBreathPeriod(s.period);
    ch.setBreathDepth(s.depth);
    ch.setBlinkGap(s.gap[0], s.gap[1]);
    ch.setBlinkHold(s.hold);
    ch.setRestLid(s.lid);
    ch.setTilts(s.tilts as [number, number] | null);
    ch.sway(s.sway, 3.4);
    ch.setDarts(s.darts);
  }

  dispose() {
    this.stopAct();
    this.off.forEach((f) => f());
    this.off = [];
    this.targets.clear();
  }
}
