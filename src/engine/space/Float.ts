import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { held, homecoming, jolt, shutEyes, swimTo } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import { warmSuitIdle } from "@/engine/urchi/character";
import type { QuirkName } from "@/engine/urchi/limbs";
import { setAlong } from "@/lib/along";
import { FIGURE_MIDDLE, URCHI_FIGURE, type RoomScene } from "./RoomScene";
import { Tether } from "./Tether";

/**
 * What Urchi taken with you is doing: at home; closing its eyes and dissolving (`leaving`); gone a
 * beat (`away`); floating in from the left (`arriving`); floating on its line; flying off the page
 * with its line snapped (`flying`); dithering back home with its eyes shut (`returning`).
 */
export type FloatState = "home" | "leaving" | "away" | "arriving" | "floating" | "flying" | "returning";

/**
 * Taking it, in seconds: its eyes close over `close`; from `dither` it dissolves through the dither
 * over `ditherFor`; the room stays empty a `beat`; then it floats in from the left over `inFor`,
 * easing out, starting `out` of its height past the edge, `drop` of the room lower than where it
 * comes to rest and turned back `tilt` radians. Its own life (the wander, the bob, drifting toward
 * things) comes in over `lifeIn` once it is there. Under reduced motion it dithers in where it rests.
 */
const TAKE = { close: 0.35, dither: 0.3, ditherFor: 1, beat: 0.7, inFor: 3.6, out: 0.35, drop: 0.05, tilt: 0.14, lifeIn: 2.5 };
/** How long floating in takes (s), for what comes in with it (Space's zoom slider). */
export const FLOAT_IN = TAKE.inFor;
/**
 * Home again, in seconds: `gone` after it has left the page (or, under reduced motion, dithered
 * away), long enough for the room to be seen empty, the head at home dithers back over
 * `ditherFor` with its eyes shut; they stay shut `hold` more and open over `open`. A flight that
 * has not left the page after `flightMost` ends anyway.
 */
const HOME = { gone: 2, ditherFor: 1, hold: 0.7, open: 1.8, flightMost: 3 };
/**
 * Where it likes to float at first, its middle as shares of the room (from the left, from the top),
 * or on a phone `phone`, nearer the middle; it swims off from there (see SWIM). The sky's planets
 * keep clear of it.
 */
export const REST = { x: 0.3, y: 0.47, phone: { x: 0.42, y: 0.45 } } as const;
/** The line's root: `out` px past the left edge, `down` of the way down. */
const ROOT = { out: 6, down: 0.56 };
/**
 * The line's length: at the root's height, pulled straight, its middle reaches `wide` of the
 * room's width from the left and no further (the line, plus the clip's offset from the middle,
 * less the root's `out`): 847px at 1440 wide, 1128 at 1920. On a phone (640px wide or less) it
 * reaches `phone` of it: at 60% a phone's line was too short to swim anywhere on, and it hung low
 * in the left corner.
 */
const REACH = { wide: 0.6, phone: 0.85 };
/**
 * Where the line clips on: the left side of the backpack, half way down it, in mesh units from the
 * head's centre (y down), as painted facing you; hidden behind the arm and the torso.
 */
const PACK = { x: -134, y: 616 };
/**
 * The figure for its walls: half its width (the helmet's discs are its widest, and only up there,
 * so a little under them) and half its height, mesh units from its middle.
 */
const HALF = { w: URCHI_FIGURE.half * 0.8, h: (URCHI_FIGURE.bottom - URCHI_FIGURE.top) / 2 };
/** The physics' fixed step (s), whatever the frame rate, and the most steps one frame may take. */
const STEP = 1 / 120;
const STEPS_MOST = 12;
/** Its build: its radius of gyration about its middle, a share of its height. */
const GYRATION = 0.3;
/**
 * Zero gravity, so nothing pulls it down, and the air there is none, but it is kept from drifting
 * forever: velocity falls at `move` and spin at `spin` a second (half-lives about 1.2s and 0.45s);
 * flying off with its line snapped, `flight` of that. Held, its spin falls `held` a second more.
 */
const DRAG = { move: 0.6, spin: 1.5, flight: 0.25, held: 2 };
/** Righting: a weak spring back to upright, rad/s (a tumble rights itself over a few seconds, overshooting a little). */
const RIGHTING = 1;
/**
 * Its own wandering: a push that changes its mind slowly, three sines a direction on periods that
 * never line up (s, their weights `mix`), at most `push` of its height per second squared; a turn
 * the same way, `turn` rad/s²; and a bob, `bob` of its height up and down every `bobEvery` seconds.
 * Asleep, `asleep` of all of it.
 */
const WANDER = { push: 0.1, periods: [9.7, 14.3, 23.1], mix: [1, 0.7, 0.45], turn: 0.3, turnPeriods: [11.3, 17.9, 7.1], bob: 0.025, bobEvery: 5.3, asleep: 0.35 };
/**
 * What it is watching (the pointer at rest, a mote) draws it gently: at most `pull` of its height
 * per second squared, only farther off than `near` of its height, and only once it has been left
 * alone `calm` seconds (no hold, fling or tug). A weak spring (`home`, per second squared) keeps it
 * near where it likes to float.
 */
const DRIFT = { pull: 0.05, near: 0.6, calm: 2, home: 0.02 };
/**
 * The soft walls: the room's edges `side` px in, under the tab bar (`top` px down) and over the
 * caption's band (`bottom`, `phoneBottom` on a phone). They catch it and give nothing back: it does
 * not bounce off (a room with walls to dribble it against would not be space), nor is it spun (a
 * twist against a wall turns into a push off it). Touching one, it stops going that way at once,
 * its spin settles (`still` of it kept each step), and what of its box is past the wall is eased
 * back in by `back` of the way each step, which gives it no speed: it comes to rest against the
 * wall, and its own drift takes it away again. Coming in faster than `bump` of its height a second
 * is a bump, which puts it off its own drifting a while (see DRIFT.calm).
 */
const WALL = { side: 8, top: 56, bottom: 64, phoneBottom: 80, still: 0.85, back: 0.15, bump: 0.2 };
/**
 * The line, per unit mass: pulled past its length, a spring of `k` per second squared (about 20px
 * of give when flung at 1500px/s) and a damper at `zeta` of critical along it, so it takes the
 * strain like a slightly elastic line: it cancels the outward velocity, swings it round the root
 * and sends it back toward it with a little rebound (about an eighth of the speed). It is taut from
 * its length on, slack again `slack` px short of it. Going taut faster than `tug` of the snap speed
 * is a tug (heard with sound on, at most every `tugEvery` seconds). Its pull turns the figure by
 * `turn` of what a pull at a rigid point would (the clip is on a soft pack, and gives).
 */
const LINE = { k: 1800, zeta: 0.55, slack: 2, tug: 0.3, tugEvery: 0.25, turn: 0.5 };
/**
 * The line snaps when jerked taut faster than `base` + `perWidth` times the room's width, px/s, its
 * clip moving straight out along it (3172 at 1440 wide, 3796 at 1920, 4628 at 2560, 1807 at 390): an
 * ordinary push or fling never gets there (a brisk one is half of it), a deliberate hard throw does.
 * Snapped, it tumbles off with `spin` rad/s more (either way), never slower than `exit` of the snap
 * speed. Sent home from the keyboard it is launched at `send` of the snap speed away from the root,
 * and the line snaps at its first pull (or after `sendMost` seconds, whatever is in the way).
 */
const SNAP = { base: 1300, perWidth: 1.3, spin: [1.2, 3] as [number, number], exit: 0.8, send: 1.3, sendMost: 1.2 };
/**
 * Held: a spring from the grab point to the pointer (`omega` rad/s, `zeta` of critical, against the
 * pointer's own velocity, so it follows with a slight lag and no drag behind), pulling at most
 * `most` times the snap speed per second, so a line pulled straight by hand never snaps.
 */
const HOLD = { omega: 20, zeta: 0.85, most: 10 };
/** Let go, it takes the pointer's velocity over its last `window` seconds, never over `cap` times the snap speed. */
const FLING = { window: 0.09, cap: 2.2, keep: 0.16 };
/**
 * Swimming about: afloat, awake and left alone, it does not stay put. Every `every` seconds (a wait
 * drawn between the two) it picks somewhere else to be and swims there, head first, in slow
 * breaststrokes (not as space works: its strokes push on nothing, and it goes where it likes). The
 * place is somewhere at random at least `far` of the room's width away, its box `margin` px clear
 * of the walls and its clip within `slack` of the line's length of the root (the line is never
 * pulled straight on the way), and never so far below it that head first it would be upside down
 * (its heading within `tilt` rad of upright). It turns toward it on a spring of `turn` rad/s (in
 * place of its righting, its spin damped `spin` a second more, so it does not swing past), looks
 * where it is going, and strokes: `stroke` seconds each, the pull
 * (from `pull[0]` to `pull[1]` of the stroke) pushing it along its heading at up to `thrust` of its
 * height per second squared, with a nudge (`steer` of that) straight at the place, so it gets there
 * however it has turned. Within `arrive` of its height it stops, glides to rest, rights itself and
 * floats there until the next time. A hold, a fling, a tug, a nudge or sleep ends it, as does
 * taking longer than `most` seconds; it is not the first thing it does once it has floated in
 * (`first` seconds after). On a phone the place is also within `band` of the room's height (from
 * the top): a phone is too narrow to swim down at a slant, so free to go higher it would only ever
 * go up, and end its days pinned under the tab bar.
 */
const SWIM = { every: [7, 15] as [number, number], first: 5, far: 0.22, margin: 64, slack: 0.92, tilt: 1.75, turn: 1.6, spin: 1.8, stroke: 2.6, pull: [0.12, 0.45] as [number, number], thrust: 0.6, steer: 0.25, arrive: 0.3, most: 30, band: [0.38, 0.6] as [number, number] };
/** A rough moment (a hard tug, a hard bump) is told at most this often of each kind (s): one impact is one. */
const JOLT_EVERY = 0.5;
/** A nudge from the arrow keys: `speed` of its height per second (it drifts about its own height before it slows), or under reduced motion `step` px. */
const NUDGE = { speed: 0.45, step: 24 };

/**
 * Its limbs (see limbs.ts): zero gravity's posture, its drift and its quirks come in with its own
 * life (asleep or dozing, they drift slower and it starts nothing of its own); they feel its
 * body's motion (flung, they trail; spun, they fly out); and it reacts with them: a wave `hello`
 * seconds after it has floated in, arms and legs thrown out when grabbed or flung faster than
 * `splay` of the snap speed, braced when its line tugs or it bumps a wall faster than `bump` of its
 * height a second (at most every `braceEvery` seconds), curled up as it tumbles off.
 */
const LIMBS = { hello: 0.25, splay: 0.35, bump: 0.8, braceEvery: 1.2 };
/**
 * Curious: the pointer resting near it (still `still` seconds), or a mote it watches, within `near`
 * of its height from its middle but off its body (farther than `off` of it), it reaches for, with the
 * arm on that side, a little in front (`z` mesh units), for `hold` seconds at most; then it lets it be
 * for `rest`. Only floating, awake, left alone, not held and doing nothing else.
 */
const REACH_FOR = { still: 1, near: 1.3, off: 0.42, z: 260, hold: 3.4, rest: 8 };
/**
 * Going for something drifting by (Space's catch, see goFor): it swims to it, head first as it
 * always swims, until its middle is within `arrive` of its height of it; all the way there it is
 * also drawn straight at it (`glide` of its height per second squared, less within `arrive`), so a
 * thing below it, which it will not swim at head down, is still got to; within `reach` of its
 * height it reaches for it with both arms (whatever it is doing, and for as long as it takes; the
 * far arm out on its own side, never across it), and its hands close on it once the nearer is
 * within `touch` of its height of it, or the arms have come all the way out and it is still
 * `stretch` short (a mitten's width: near enough). Caught, it holds it in both hands in front of
 * its middle, at `hold` (head space: the arms come in as near as they go below the helmet, a hand
 * either side of it), and looks at it. Something new it then holds up high in one hand (raise): that
 * arm goes up at `raise` (the `.R` side's terms: up and out past its helmet, further than it
 * reaches, so the arm is straight), the other lets go. Longer than `most` seconds, and it gives up.
 */
const FETCH = { arrive: 0.35, glide: 0.3, reach: 1.25, touch: 0.12, stretch: 0.3, hold: [0, 780, 300] as [number, number, number], raise: [900, -250, 120] as [number, number, number], most: 14 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** An angle brought within -pi .. pi: upright the short way round. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export type FloatOptions = {
  room: RoomScene;
  att: Attention;
  reducedMotion: boolean;
  /** Its state changed: the cursor's word and the control's name follow. */
  onState?(state: FloatState): void;
  /** Handled roughly: its line tugged hard, or a hard bump against a wall (at most every JOLT_EVERY seconds each). */
  onJolt?(kind: "tug" | "bump"): void;
};

/**
 * Urchi taken with you (Space, Darius's "take with you"). Clicked at home, it closes its eyes and
 * dissolves through the dither; a beat later it floats in from the left in its suit, at 65% of the
 * size the whole suited figure stood at in the room (40% on a phone), on a line from a root just
 * past the left edge.
 * There it floats in zero gravity: it drifts, bobs, turns and rights itself, looks at what it looks
 * at (its attention carries on) and drifts gently toward it. The pointer, or a finger, can hold it
 * where it is drawn, drag it (it follows with a slight lag, and a grab off its middle turns it) and
 * fling it; it keeps its momentum with a little drag and tumbles. The line is a rope: slack in lazy
 * curves, and pulled straight it gives like a slightly elastic line and swings it round and back.
 * Thrown hard enough, the line snaps: it flies off the page with its spin, and the head comes back
 * home through the same dither, eyes shut, and opens them slowly. Taken is remembered for the visit
 * (along.ts): a reload, or a return to Space, finds it floating in again.
 *
 * The physics runs at a fixed 120 steps a second in room px (y up), mass 1, so it behaves the same
 * at 60 and 120Hz, and each frame is drawn between the last two steps. The figure turns as a whole
 * by turning its plane: nothing is painted again for that.
 */
export class Float {
  state: FloatState = "home";
  private o: FloatOptions;
  private room: RoomScene;
  private att: Attention;
  private reduced: boolean;
  private tether: Tether;
  /** The body: its middle (room px, y up) and velocity (px/s), its turn (radians, anticlockwise) and spin (rad/s). */
  private b = { x: 0, y: 0, vx: 0, vy: 0, a: 0, w: 0 };
  /** Where it was a step ago: each frame is drawn between the two. */
  private prev = { x: 0, y: 0, a: 0 };
  private acc = 0;
  /** Its own clock (s), the wander's, and the wander's phases (two directions and the turn, three sines each). */
  private t = 0;
  private phases = Array.from({ length: 9 }, () => rand(0, Math.PI * 2));
  /** How much of its own life it has (see TAKE.lifeIn), 0 .. 1. Tweened. */
  private life = { v: 0 };
  /** Floating in: when it began (its clock), and from where to where (room px). */
  private arrival: { t0: number; from: Point; to: Point } | null = null;
  /** Held: the grab point (mesh units from the middle, y up, so a resize keeps it), and the pointer's place (room px) and smoothed velocity. */
  private hold: { gx: number; gy: number; x: number; y: number; vx: number; vy: number } | null = null;
  /** The pointer's last few places while held (client px, performance.now() ms), for the fling. */
  private samples: { t: number; x: number; y: number }[] = [];
  /** The line is pulled straight; when it last tugged; sent home (and when), it snaps at its first pull. */
  private taut = false;
  private tugAt = -Infinity;
  private sending = false;
  private sentAt = 0;
  /** Left alone since then (its clock): no hold, fling, nudge or tug. */
  private calmAt = 0;
  private flightFor = 0;
  /** Its velocity and spin as the last frame left them (for what its limbs feel), and when they last braced. */
  private felt = { vx: 0, vy: 0, w: 0 };
  private bracedAt = -Infinity;
  /** Its hello, waiting (see settle). */
  private hello: gsap.core.Tween | null = null;
  /** Reaching for what it watches since (its clock; -1 not), and not again before. */
  private reachSince = -1;
  private reachAgain = 0;
  /** Swimming: where to (shares of the room, from the left and the top, so a resize keeps it), and since when (its clock). */
  private swim: { x: number; y: number; t0: number } | null = null;
  /** When it may next swim off (its clock), and where it floats meanwhile (shares of the room; null: REST). */
  private swimAt = 0;
  private stay: Point | null = null;
  /**
   * Going for something (see FETCH): where it is now (room px), which arm reaches for it (chosen as
   * it first reaches), since when (its clock), whether its hand has closed on it, and what the page
   * is told: caught, or lost (held, flung, asleep, gone home, or too long).
   */
  private fetch: { to: () => Point | null; side: 0 | 1 | null; t0: number; caught: boolean; raised?: [number, number, number] | null; on: { caught(): void; lost(): void } } | null = null;
  /** Pointing at something (see pointAt): where it is now (room px), and until when (its clock). */
  private pointing: { to: () => Point | null; until: number } | null = null;
  private tl: gsap.core.Timeline | null = null;
  private stopFrame: () => void;
  private disposed = false;

  constructor(o: FloatOptions) {
    this.o = o;
    this.room = o.room;
    this.att = o.att;
    this.reduced = o.reducedMotion;
    this.tether = new Tether(o.room, {
      root: () => this.seen(this.root()),
      clip: () => (this.room.float ? this.room.onFigure(PACK.x, PACK.y) : null),
      length: () => this.length,
      reducedMotion: o.reducedMotion,
    });
    this.stopFrame = o.room.onFrame((dt) => this.frame(dt));
  }

  /** Afloat: floating in, or floating (it can be held, nudged and sent home). */
  get afloat() {
    return this.state === "arriving" || this.state === "floating";
  }

  /** On its way somewhere: leaving, gone, flying off or coming back. Nothing it is clicked for can happen now. */
  get busy() {
    return this.state === "leaving" || this.state === "away" || this.state === "flying" || this.state === "returning";
  }

  /** Its last flight home was a throw (its line snapped under it), not the keyboard sending it. */
  thrown = false;

  /** Being held. */
  get holding() {
    return this.hold !== null;
  }

  // ---------------------------------------------------------------- its measures

  /** Its limbs, once its suit's model is here (and never under reduced motion, where they hold still). */
  private get limbs() {
    return this.reduced ? null : this.room.urchi.character.limbs;
  }

  /** CSS px per mesh unit as it floats. */
  private get unit() {
    return this.room.floatUnit;
  }

  /** Its height, crown to soles (px). */
  private get tall() {
    return (URCHI_FIGURE.bottom - URCHI_FIGURE.top) * this.unit;
  }

  /** A phone's room: 640px wide or less. */
  private get phone() {
    return this.room.width <= 640;
  }

  /**
   * The view's pan (RoomScene's PAN): its body is in the world the view pans over, so it is drawn
   * that much the other way; what is fixed to the page (the line's root, the walls, where it likes
   * to float) is moved with the view, so a pan pulls it along on its line, late, as a body would be.
   */
  private get pan() {
    return this.room.pan;
  }

  /** The line's root, room px at its depth: just past the page's left edge, wherever the view has panned. */
  private root(): Point {
    return { x: -this.room.width / 2 - ROOT.out + this.pan.x, y: this.room.height / 2 - ROOT.down * this.room.height + this.pan.y };
  }

  /** A point at its depth where the page shows it (room px). */
  private seen(p: Point): Point {
    return { x: p.x - this.pan.x, y: p.y - this.pan.y };
  }

  /** The clip from its middle, px, as it floats upright (y up). */
  private clipOffset(): Point {
    const u = this.unit;
    return { x: PACK.x * u, y: (FIGURE_MIDDLE - PACK.y) * u };
  }

  /** The line's length (see REACH). */
  private get length() {
    const c = this.clipOffset();
    return (this.phone ? REACH.phone : REACH.wide) * this.room.width + ROOT.out - Math.hypot(c.x, c.y);
  }

  /** The speed a jerk on the line snaps it at, px/s (see SNAP). */
  private get breakSpeed() {
    return SNAP.base + SNAP.perWidth * this.room.width;
  }

  /** Where it likes to float: its middle, room px (where it last swam to, or REST). */
  private rest(): Point {
    const s = this.stay ?? (this.phone ? REST.phone : REST);
    return this.at(s.x, s.y);
  }

  /** A place given as shares of the page (from the left, from the top), room px at its depth. */
  private at(fx: number, fy: number): Point {
    return { x: (fx - 0.5) * this.room.width + this.pan.x, y: (0.5 - fy) * this.room.height + this.pan.y };
  }

  /** A place at its depth as shares of the page (from the left, from the top): what `at` takes. */
  private share(p: Point): Point {
    return { x: (p.x - this.pan.x) / this.room.width + 0.5, y: 0.5 - (p.y - this.pan.y) / this.room.height };
  }

  /** The walls, room px at its depth: the page's edges, wherever the view has panned. */
  private walls() {
    const W = this.room.width / 2, H = this.room.height / 2, x = this.pan.x, y = this.pan.y;
    return { left: -W + WALL.side + x, right: W - WALL.side + x, top: H - WALL.top + y, bottom: -H + (this.phone ? WALL.phoneBottom : WALL.bottom) + y };
  }

  /** How far its box reaches from its middle, across and up, turned as it is. */
  private extent(a = this.b.a) {
    const u = this.unit, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return { x: c * HALF.w * u + s * HALF.h * u, y: s * HALF.w * u + c * HALF.h * u };
  }

  // ---------------------------------------------------------------- what the page asks of it

  /**
   * Goes for something drifting by (Space's catch): swims to where `to` says it is (room px, y up;
   * null once it is not there), reaches for it and closes its hand on it (see FETCH). `on.caught` is
   * told as the hand closes (the hand then holds it up in front to be looked at, until openHand);
   * `on.lost` if it never gets there. Only floating, awake, not held and not under reduced motion,
   * where nothing of it moves: returns whether it goes.
   */
  goFor(to: () => Point | null, on: { caught(): void; lost(): void }) {
    if (this.state !== "floating" || this.hold || this.att.asleep || this.reduced || this.disposed || !this.limbs) return false;
    this.dropFetch(false);
    const p = to();
    if (!p) return false;
    this.fetch = { to, side: null, t0: this.t, caught: false, on };
    // it floats there once it has it, rather than drifting back to where it was
    this.stay = this.share(p);
    this.calmAt = Math.min(this.calmAt, this.t);
    this.limbs.calm();
    return true;
  }

  /**
   * Points at something for `seconds` (Space's catch: a glint it has noticed): the arm on that side
   * held out toward where `to` says it is (room px, y up), as far as it goes. Only floating, awake,
   * not held and not going for something; not under reduced motion, where nothing of it moves.
   */
  pointAt(to: () => Point | null, seconds: number) {
    if (this.state !== "floating" || this.hold || this.fetch || this.att.asleep || !this.limbs) return;
    this.pointing = { to, until: this.t + seconds };
    this.limbs.calm();
  }

  /**
   * Holding what it caught in both hands: it holds it up high in one (see FETCH.raise), or wherever
   * `at` says (head space, the `.R` side's terms: as far as the arm goes), the arm on the side toward
   * the page's middle, where there is room to hold it up (either hand has it).
   */
  raise(at: [number, number, number] = FETCH.raise) {
    const f = this.fetch, p = this.room.float;
    if (!f?.caught || !p) return;
    f.raised = at;
    // (in its own frame: which way the page's middle is from it, turned as it is)
    const bx = -p.x * Math.cos(p.angle) - p.y * Math.sin(p.angle);
    f.side = bx >= 0 ? 0 : 1;
  }

  /** Held up in one hand: back in both. */
  lower() {
    if (this.fetch) this.fetch.raised = null;
  }

  /**
   * Given something (Space's items, handed back): it takes it in both hands where they are, and holds
   * it in front of it (see FETCH.hold) until openHand. `lost` is told if it cannot hold on to it (held,
   * flung, asleep, gone home). Only floating, awake, not held, not going for anything, and not under
   * reduced motion, where nothing of it moves: returns whether it takes it.
   */
  receive(lost: () => void) {
    if (this.state !== "floating" || this.hold || this.fetch || this.att.asleep || this.reduced || !this.limbs) return false;
    this.pointing = null;
    this.fetch = { to: () => null, side: null, t0: this.t, caught: true, on: { caught: () => {}, lost } };
    this.limbs.calm();
    this.limbs.grip(true);
    return true;
  }

  /**
   * Drawn toward something (the magnet stone, near it): toward `at` (room px at its depth), at most
   * `strength` of its height per second squared, less as it comes within half its height of it; null
   * lets it go. Not while it is held, flying off or under reduced motion.
   */
  attract(at: Point | null, strength = 0) {
    this.pull = at && strength > 0 ? { x: at.x, y: at.y, k: strength } : null;
  }
  private pull: { x: number; y: number; k: number } | null = null;

  /** One of its limbs' quirks (limbs.ts QUIRKS: a wave back, a brace), now, if it is free to: floating, awake, not held and holding nothing. */
  gesture(name: QuirkName) {
    if (this.state !== "floating" || this.hold || this.fetch || this.att.asleep) return false;
    return !!this.limbs?.play(name);
  }

  /** Whatever is in its hand let go: the hand opens and the arm comes back to it. */
  openHand() {
    const f = this.fetch;
    this.fetch = null;
    this.limbs?.grip(false);
    this.limbs?.reachFor(null);
    if (f && !f.caught) f.on.lost();
    this.reachAgain = this.t + REACH_FOR.rest;
  }

  /** The going for it ended (`caught` false: lost, and the page told so). */
  private dropFetch(caught: boolean) {
    const f = this.fetch;
    if (!f) return;
    this.fetch = null;
    if (this.swim) this.endSwim();
    this.limbs?.grip(false);
    this.limbs?.reachFor(null);
    if (!caught && !f.caught) f.on.lost();
  }

  /** Going for something, or holding what it caught. */
  get fetching() {
    return this.fetch !== null;
  }

  /**
   * The middle of the nearer hand reaching for something, room px; holding what it caught in both
   * hands, the point between them (and how far apart they are, px). Null when no hand is.
   */
  handAt(): (Point & { apart?: number }) | null {
    const L = this.limbs, f = this.fetch, side = L?.reachSide ?? f?.side ?? null;
    if (!L || side === null || !this.room.float) return null;
    if (f?.caught && f.raised) {
      const [x, y] = L.hand(f.side ?? 0);
      return this.room.onFigure(x, y);
    }
    if (f?.caught) {
      const [ax, ay] = L.hand(0), [bx, by] = L.hand(1), a = this.room.onFigure(ax, ay), b = this.room.onFigure(bx, by);
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, apart: Math.hypot(a.x - b.x, a.y - b.y) };
    }
    const [x, y] = L.hand(side);
    return this.room.onFigure(x, y);
  }

  /**
   * Whether it could go for something at a room point (px, y up) and get there: inside the walls
   * with room for itself round it, clear of the zoom slider on the right, and within its line's reach
   * of the root (its middle can be there with the line not quite straight).
   */
  canReach(p: Point) {
    const w = this.walls(), e = this.extent(0), r = this.root(), side = Math.min(e.x, e.y) * 0.6;
    if (p.x < w.left + side || p.x > w.right - Math.max(side, 72) || p.y < w.bottom + side || p.y > w.top - side) return false;
    const c = this.clipOffset();
    return Math.hypot(p.x + c.x - r.x, p.y + c.y - r.y) <= this.length * SWIM.slack;
  }

  /** Taken with you, from home (awake: the page wakes it first). */
  take() {
    if (this.state !== "home" || this.disposed) return;
    setAlong(true);
    this.set("leaving");
    warmSuitIdle().catch(() => {}); // loading while it goes, so it is here by the time it is wanted
    // (above everything, a wake still under way included: its eyes close whatever it was doing)
    this.att.play("shutEyes", 10, () => shutEyes(this.att, TAKE.close));
    const gone = TAKE.dither + TAKE.ditherFor;
    this.tl = gsap
      .timeline()
      .call(() => this.room.urchi.dither(1, TAKE.ditherFor), [], TAKE.dither)
      .call(() => {
        this.att.cancel("shutEyes");
        this.set("away");
      }, [], gone)
      .call(() => this.whenSuited(), [], gone + TAKE.beat);
  }

  /** Already taken when Space mounts (within the visit): the head never shows at home, and it floats in from the left once its suit is here. */
  restore() {
    if (this.state !== "home" || this.disposed) return;
    this.room.urchi.uniforms.uDither.value = 1;
    this.set("away");
    this.whenSuited();
  }

  /** Sent home (the keyboard, or a double click or tap under reduced motion): its line snaps and it goes. */
  sendHome() {
    if (!this.afloat || this.disposed) return;
    this.thrown = false;
    if (this.hold) this.letGo();
    if (this.reduced) {
      this.set("flying");
      setAlong(false);
      this.tether.snap();
      this.room.urchi.dither(1, TAKE.ditherFor, () => this.comeHome());
      return;
    }
    if (this.state === "arriving") this.settle();
    // launched away from the root, faster than the line can hold: it snaps at its first pull
    const b = this.b, r = this.root();
    let dx = b.x - r.x, dy = b.y - r.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const v = SNAP.send * this.breakSpeed;
    b.vx = dx * v;
    b.vy = dy * v;
    this.sending = true;
    this.sentAt = this.t;
  }

  /**
   * A press at a client point: if it is on the floating figure, it is held from there. Returns
   * whether it was. `t` is the press's time (performance.now() ms).
   */
  grab(clientX: number, clientY: number, t: number) {
    if (!this.afloat || !this.room.urchiHit(clientX, clientY)) return false;
    if (this.state === "arriving") this.settle();
    const p = this.room.toWorld(clientX, clientY), b = this.b, u = this.unit, c = Math.cos(b.a), s = Math.sin(b.a);
    // the point under the pointer, into the figure's own frame
    const dx = p.x - b.x, dy = p.y - b.y;
    this.hold = { gx: (dx * c + dy * s) / u, gy: (-dx * s + dy * c) / u, x: p.x, y: p.y, vx: 0, vy: 0 };
    this.samples = [{ t, x: clientX, y: clientY }];
    this.calmAt = Infinity;
    this.att.play("held", 6, () => held(this.att));
    this.limbs?.play("splay");
    return true;
  }

  /** The held pointer moved to a client point, at `t` (performance.now() ms). */
  drag(clientX: number, clientY: number, t: number) {
    const h = this.hold;
    if (!h) return;
    const p = this.room.toWorld(clientX, clientY), last = this.samples[this.samples.length - 1];
    const dt = last ? (t - last.t) / 1000 : 0;
    if (dt > 0.001) {
      // the pointer's own velocity, smoothed a little: what the hold's damping follows
      const k = Math.min(1, dt / 0.03);
      h.vx += ((p.x - h.x) / dt - h.vx) * k;
      h.vy += ((p.y - h.y) / dt - h.vy) * k;
    }
    h.x = p.x;
    h.y = p.y;
    this.samples.push({ t, x: clientX, y: clientY });
    while (this.samples.length > 2 && t - this.samples[0].t > FLING.keep * 1000) this.samples.shift();
    if (this.reduced) this.follow();
  }

  /**
   * Let go at `t` (performance.now() ms): flung with the pointer's recent velocity. Under reduced
   * motion it stays where it was left; a hold taken away (`fling` false: the system took the
   * pointer) leaves it moving as it was.
   */
  release(t: number, fling = true) {
    if (!this.hold) return;
    const v = this.flingVelocity(t);
    this.letGo();
    const b = this.b;
    this.calmAt = this.t + DRIFT.calm;
    if (this.reduced) {
      b.vx = b.vy = b.w = 0;
      return;
    }
    if (!fling) return;
    b.vx = v.x;
    b.vy = v.y;
    if (Math.hypot(v.x, v.y) > LIMBS.splay * this.breakSpeed) this.limbs?.play("splay");
  }

  /** The arrow keys: a nudge that way (dx, dy each -1 .. 1, y down, as the screen is). */
  nudge(dx: number, dy: number) {
    if (!this.afloat || this.hold) return;
    const b = this.b;
    if (this.reduced) {
      b.x += dx * NUDGE.step;
      b.y -= dy * NUDGE.step;
      this.keepIn();
      this.show();
      return;
    }
    if (this.state === "arriving") this.settle();
    b.vx += dx * NUDGE.speed * this.tall;
    b.vy -= dy * NUDGE.speed * this.tall;
    this.calmAt = this.t + DRIFT.calm;
  }

  /** Where it looks from, afloat (see AttentionOptions.origin): its eyes in client px and its turn; null at home. */
  lookFrom(): { x: number; y: number; angle: number } | null {
    const p = this.room.float;
    if (!p) return null;
    const e = this.room.eyes(), r = this.room.canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2 + e.x, y: r.top + r.height / 2 - e.y, angle: p.angle };
  }

  /** Its box afloat, for the control over it: its middle (room px), width, height and turn (radians, anticlockwise); null at home. */
  box(): { x: number; y: number; w: number; h: number; angle: number } | null {
    const p = this.room.float;
    return p && { x: p.x, y: p.y, w: 2 * URCHI_FIGURE.half * this.unit, h: this.tall, angle: p.angle };
  }

  /** The room changed size: it is kept inside it, and within its line's reach (floating in, it comes to rest where it now should). */
  resize() {
    if (!this.room.float) return;
    if (this.arrival) {
      this.arrival.to = this.rest();
      return;
    }
    this.keepIn();
    this.prev = { x: this.b.x, y: this.b.y, a: this.b.a };
    this.show();
  }

  // ---------------------------------------------------------------- going and coming

  private set(state: FloatState) {
    if (state === this.state) return;
    if (state !== "floating") this.dropFetch(false);
    this.state = state;
    this.o.onState?.(state);
  }

  /** Once its suit's model and rig are here: it floats in. With no model to wear, it comes home. */
  private whenSuited() {
    warmSuitIdle().then(
      () => {
        if (!this.disposed && this.state === "away") this.arrive();
      },
      () => {
        if (this.disposed || this.state !== "away") return;
        setAlong(false);
        this.comeHome(0);
      },
    );
  }

  /** In its suit at once (no build-up), at its size, floating in from the left (or, under reduced motion, dithering in where it rests). */
  private arrive() {
    const room = this.room, b = this.b, to = this.rest();
    room.urchi.setSuit(1);
    room.urchi.character.limbs?.setMode("float");
    this.felt.vx = NaN;   // (it comes in already moving: nothing to feel on its first frame)
    b.vx = b.vy = b.w = 0;
    this.taut = this.sending = false;
    this.calmAt = 0;
    this.life.v = 0;
    if (this.reduced) {
      b.x = to.x;
      b.y = to.y;
      b.a = 0;
      this.arrival = null;
      room.urchi.uniforms.uDither.value = 1;
      room.urchi.dither(0, TAKE.ditherFor, () => this.settle());
    } else {
      const from = { x: -room.width / 2 - this.extent(TAKE.tilt).x - TAKE.out * this.tall, y: to.y - TAKE.drop * room.height };
      // (it comes in already drifting, and slows to a stop: a sine's ease out, so it is not flung in)
      b.x = from.x;
      b.y = from.y;
      b.a = TAKE.tilt;
      this.arrival = { t0: this.t, from, to };
      room.urchi.uniforms.uDither.value = 0;
    }
    this.prev = { x: b.x, y: b.y, a: b.a };
    this.show();
    this.tether.show(this.reduced ? TAKE.ditherFor : 0);
    this.set("arriving");
  }

  /** Floating in is over (or cut short by a hand or a key, `all` false): it floats, its own life comes in, and (all the way in) it waves hello. */
  private settle(all = false) {
    this.arrival = null;
    if (all) {
      this.stay = null;
      this.swim = null;
      this.swimAt = this.t + SWIM.first;
    }
    this.set("floating");
    if (all) this.hello = gsap.delayedCall(LIMBS.hello, () => { if (this.state === "floating" && !this.hold) this.limbs?.play("wave", 0); });
    gsap.killTweensOf(this.life);
    if (!this.reduced) gsap.to(this.life, { v: 1, duration: TAKE.lifeIn, ease: "sine.inOut" });
  }

  /** Its line snaps: it flies off with its momentum and a tumble, the line breaking behind it. */
  private snap() {
    const b = this.b;
    this.thrown = !this.sending;
    this.set("flying");
    setAlong(false);
    this.taut = this.sending = false;
    this.flightFor = 0;
    this.tether.snap();
    sfx.snap();
    this.att.play("jolt", 8, () => jolt(this.att, 1));
    this.limbs?.play("curl");
    b.w += (Math.random() < 0.5 ? -1 : 1) * rand(...SNAP.spin);
    const v = Math.hypot(b.vx, b.vy), exit = SNAP.exit * this.breakSpeed;
    if (v < exit) {
      const r = this.root(), dx = b.x - r.x, dy = b.y - r.y, d = Math.hypot(dx, dy) || 1;
      const ux = v > 1 ? b.vx / v : dx / d, uy = v > 1 ? b.vy / v : dy / d;
      b.vx = ux * exit;
      b.vy = uy * exit;
    }
  }

  /** Gone off the page (or dissolved): the head comes back home through the dither, eyes shut, and opens them slowly. */
  private comeHome(after = HOME.gone) {
    const room = this.room;
    this.set("returning");
    this.hold = null;
    this.arrival = null;
    this.swim = null;
    this.limbs?.swim(null);
    room.float = null;
    room.resetZoom(); // (zoomed or not, it comes home as it was)
    room.panHome(); // (and seen from where the room is)
    this.hello?.kill();
    room.urchi.character.limbs?.setMode("rest");
    room.urchi.setSuit(0);
    room.urchi.uniforms.uDither.value = 1;
    this.tether.hide(0);
    gsap.killTweensOf(this.life);
    this.life.v = 0;
    const shut = HOME.ditherFor + HOME.hold;
    this.tl?.kill();
    this.tl = gsap
      .timeline()
      .call(() => {
        this.att.play("homecoming", 10, () => homecoming(this.att, shut, HOME.open), { sleeping: true });
        room.urchi.dither(0, HOME.ditherFor);
      }, [], after)
      .call(() => this.set("home"), [], after + shut + HOME.open);
  }

  private letGo() {
    this.hold = null;
    this.samples = [];
    this.att.cancel("held");
  }

  /** The pointer's velocity over its last FLING.window seconds, in room px/s (y up), capped. */
  private flingVelocity(t: number): Point {
    const s = this.samples, last = s[s.length - 1];
    if (!last || t - last.t > FLING.window * 1000) return { x: 0, y: 0 };
    let first = last;
    for (let i = s.length - 1; i >= 0 && last.t - s[i].t <= FLING.window * 1000; i--) first = s[i];
    const dt = (last.t - first.t) / 1000;
    if (dt < 0.008) return { x: 0, y: 0 };
    let vx = (last.x - first.x) / dt, vy = -(last.y - first.y) / dt;
    const v = Math.hypot(vx, vy), cap = FLING.cap * this.breakSpeed;
    if (v > cap) {
      vx *= cap / v;
      vy *= cap / v;
    }
    return { x: vx, y: vy };
  }

  /** Reduced motion's hold: the grab point simply goes where the pointer is, kept inside the room and the line's reach. */
  private follow() {
    const h = this.hold, b = this.b;
    if (!h) return;
    const u = this.unit, c = Math.cos(b.a), s = Math.sin(b.a);
    b.x = h.x - (h.gx * u * c - h.gy * u * s);
    b.y = h.y - (h.gx * u * s + h.gy * u * c);
    this.keepIn();
    this.show();
  }

  /** Inside the walls, and its clip within the line's length of the root. */
  private keepIn() {
    const b = this.b, w = this.walls(), e = this.extent();
    b.x = clamp(b.x, w.left + e.x, Math.max(w.left + e.x, w.right - e.x));
    b.y = clamp(b.y, Math.min(w.top - e.y, w.bottom + e.y), w.top - e.y);
    const c = this.clipOffset(), cos = Math.cos(b.a), sin = Math.sin(b.a), r = this.root();
    const cx = b.x + c.x * cos - c.y * sin, cy = b.y + c.x * sin + c.y * cos, dx = cx - r.x, dy = cy - r.y, d = Math.hypot(dx, dy), L = this.length;
    if (d > L) {
      b.x -= (dx * (d - L)) / d;
      b.y -= (dy * (d - L)) / d;
    }
  }

  /** The body, drawn where it is now. */
  private show() {
    const b = this.b;
    this.prev = { x: b.x, y: b.y, a: b.a };
    this.room.float = { x: b.x - this.pan.x, y: b.y - this.pan.y, angle: b.a };
  }

  // ---------------------------------------------------------------- the physics

  /** Arriving, floating or flying: the physics runs. */
  private get moving() {
    return this.state === "arriving" || this.state === "floating" || this.state === "flying";
  }

  private frame(dt: number) {
    if (this.disposed || !this.moving) return;
    if (this.reduced) return; // still: only a hand, a key or a dither moves it (see follow, nudge, sendHome)
    this.acc += dt;
    let n = 0;
    while (this.acc >= STEP && n < STEPS_MOST && this.moving) {
      this.prev = { x: this.b.x, y: this.b.y, a: this.b.a };
      this.step(STEP);
      this.acc -= STEP;
      n++;
    }
    if (n === STEPS_MOST) this.acc = 0;
    if (!this.room.float) return;
    const k = this.acc / STEP, b = this.b, p = this.prev;
    this.room.float = { x: p.x + (b.x - p.x) * k - this.pan.x, y: p.y + (b.y - p.y) * k - this.pan.y, angle: p.a + (b.a - p.a) * k };
    this.feel(dt);
    if (this.state === "flying") {
      this.flightFor += dt;
      if (this.offPage() || this.flightFor > HOME.flightMost) this.comeHome();
    }
  }

  /** A rough moment told to the page (see FloatOptions.onJolt), not more often than JOLT_EVERY of each kind. */
  private jolt(kind: "tug" | "bump") {
    if (this.t - this.joltAt[kind] < JOLT_EVERY) return;
    this.joltAt[kind] = this.t;
    this.o.onJolt?.(kind);
  }
  private joltAt = { tug: -Infinity, bump: -Infinity };

  /** Its limbs braced (a tug, a bump), not more often than LIMBS.braceEvery. */
  private brace() {
    if (this.t - this.bracedAt < LIMBS.braceEvery) return;
    this.bracedAt = this.t;
    this.limbs?.play("brace");
  }

  /**
   * What its limbs feel this frame: their posture and quirks come in with its own life (half of it
   * while it floats in), and its body's acceleration and spin, from how its velocity changed since
   * the last frame, into its own frame (mesh units, y down, turned with it; clockwise as seen).
   */
  private feel(dt: number) {
    const L = this.limbs, b = this.b, f = this.felt;
    if (L && dt > 0 && !Number.isNaN(f.vx)) {
      const u = this.unit, c = Math.cos(b.a), s = Math.sin(b.a);
      const ax = (b.vx - f.vx) / dt, ay = (b.vy - f.vy) / dt, al = (b.w - f.w) / dt;
      L.setLife(this.state === "flying" ? 0 : Math.max(this.life.v, this.arrival ? 0.5 : 0));
      L.setAsleep(this.att.asleep);
      L.swim(this.swim ? this.strokePhase(this.swim) : null);
      L.feel((ax * c + ay * s) / u, -(-ax * s + ay * c) / u, -al, -b.w, FIGURE_MIDDLE);
      this.reachOut(L);
    }
    f.vx = b.vx;
    f.vy = b.vy;
    f.w = b.w;
  }

  /** Going for something (see FETCH): reaching for it once it is near, the hand closing on it; caught, holding it up in front. */
  private reachFetch(L: NonNullable<Float["limbs"]>) {
    const f = this.fetch!, p = this.room.float;
    if (!p) return;
    if (f.caught) {
      const s = f.side ?? 0, r = f.raised;
      if (r) L.reachFor([s ? -r[0] : r[0], r[1], r[2]], s);
      else L.reachFor(FETCH.hold, s, true);
      return;
    }
    const to = f.to();
    if (!to) {
      this.dropFetch(false);
      return;
    }
    // into its own frame: mesh units from the head's centre, y down
    // (it is where the view shows it; what it goes for is at its depth)
    const u = this.unit, c = Math.cos(p.angle), s = Math.sin(p.angle), dx = to.x - this.pan.x - p.x, dy = to.y - this.pan.y - p.y;
    const bx = (dx * c + dy * s) / u, by = (-dx * s + dy * c) / u;
    if (Math.hypot(dx, dy) > FETCH.reach * this.tall) {
      if (f.side !== null) L.reachFor(null);
      return;
    }
    f.side ??= bx >= 0 ? 0 : 1;
    L.reachFor([bx, FIGURE_MIDDLE - by, REACH_FOR.z], f.side, true);
    const hand = this.handAt();
    if (!hand || L.reached < 0.5) return;
    const gap = Math.hypot(hand.x + this.pan.x - to.x, hand.y + this.pan.y - to.y) / this.tall;
    if (gap < FETCH.touch || (L.reached > 0.98 && gap < FETCH.stretch)) {
      f.caught = true;
      L.grip(true);
      if (this.swim) this.endSwim();
      f.on.caught();
    }
  }

  /** Going for something (see FETCH): it swims there until it is near, or gives up. */
  private fetchStep() {
    const f = this.fetch!, b = this.b;
    if (this.hold || this.att.asleep || this.state !== "floating") {
      this.dropFetch(false);
      return;
    }
    if (f.caught) return;
    const to = f.to();
    if (!to || this.t - f.t0 > FETCH.most) {
      this.dropFetch(false);
      return;
    }
    const near = Math.hypot(to.x - b.x, to.y - b.y) < FETCH.arrive * this.tall;
    if (!near) {
      const { x, y } = this.share(to);
      if (this.swim) Object.assign(this.swim, { x, y });
      else this.swim = { x, y, t0: this.t };
    } else if (this.swim) this.endSwim();
  }

  /** Curious: reaching for what it watches, near it (see REACH_FOR). */
  private reachOut(L: NonNullable<Float["limbs"]>) {
    if (this.fetch) {
      this.pointing = null;
      this.reachFetch(L);
      return;
    }
    const pt = this.pointing, fp = this.room.float, to = pt?.to();
    if (pt) {
      if (!fp || !to || this.t > pt.until || this.hold || this.state !== "floating" || this.att.asleep) {
        this.pointing = null;
        L.reachFor(null);
        this.reachAgain = this.t + REACH_FOR.rest;
        return;
      }
      // into its own frame, and the arm on that side out toward it (pointing, if it is beyond reach)
      const u = this.unit, c = Math.cos(fp.angle), s = Math.sin(fp.angle), dx = to.x - this.pan.x - fp.x, dy = to.y - this.pan.y - fp.y;
      const bx = (dx * c + dy * s) / u, by = (-dx * s + dy * c) / u;
      L.reachFor([bx, FIGURE_MIDDLE - by, REACH_FOR.z], bx >= 0 ? 0 : 1);
      return;
    }
    const f = this.att.focus, you = this.att.you(), p = this.room.float;
    const thing = f?.kind === "mote" ? f.at : you && this.att.stillFor > REACH_FOR.still ? you : null;
    let at: [number, number, number] | null = null;
    if (p && thing && this.state === "floating" && !this.hold && !this.swim && !this.att.asleep && this.t >= this.calmAt && this.life.v > 0.9) {
      // into its own frame: mesh units from the head's centre, y down
      const q = this.room.toRoom(thing.x, thing.y), u = this.unit, c = Math.cos(p.angle), s = Math.sin(p.angle), dx = q.x - p.x, dy = q.y - p.y;
      const bx = (dx * c + dy * s) / u, by = (-dx * s + dy * c) / u;
      const d = (Math.hypot(bx, by) * u) / this.tall;
      if (d < REACH_FOR.near && d > REACH_FOR.off) at = [bx, FIGURE_MIDDLE - by, REACH_FOR.z];
    }
    const reaching = this.reachSince >= 0;
    if (at && !reaching && this.t >= this.reachAgain && !L.doing) this.reachSince = this.t;
    if (this.reachSince >= 0 && (!at || this.t - this.reachSince > REACH_FOR.hold)) {
      L.reachFor(null);
      this.reachSince = -1;
      this.reachAgain = this.t + REACH_FOR.rest;
    } else if (this.reachSince >= 0 && at) L.reachFor(at, at[0] >= 0 ? 0 : 1);
  }

  /**
   * Swimming (see SWIM): set off somewhere now, if it is free to and the time has come; or, swimming,
   * whether it is there, or has been stopped. Where it ends up, it floats until it swims off again.
   */
  private swimStep() {
    if (this.fetch) {
      this.fetchStep();
      return;
    }
    const sw = this.swim, L = this.limbs;
    const free = this.state === "floating" && !this.hold && !this.sending && !this.taut && !this.att.asleep && this.life.v > 0.9 && this.t >= this.calmAt && this.reachSince < 0 && !this.pointing;
    if (sw) {
      const to = this.at(sw.x, sw.y), b = this.b, there = Math.hypot(to.x - b.x, to.y - b.y) < SWIM.arrive * this.tall;
      if (there || !free || this.t - sw.t0 > SWIM.most) this.endSwim();
      return;
    }
    if (!free || this.t < this.swimAt || !L || L.doing || L.reaching) return;
    const to = this.pickSwim();
    if (!to) {
      this.swimAt = this.t + 2;
      return;
    }
    this.swim = { ...to, t0: this.t };
    L.calm();
    this.att.play("swimTo", 1, () => swimTo(this.att, () => this.client(this.at(to.x, to.y)), () => this.swim === null));
  }

  /** The swim ends (there, or stopped): it floats where it is now until the next. */
  private endSwim() {
    const b = this.b;
    this.swim = null;
    this.stay = this.share(b);
    this.swimAt = this.t + rand(...SWIM.every);
    this.limbs?.swim(null);
  }

  /** Somewhere to swim to (see SWIM), as shares of the room; null if nowhere will do. */
  private pickSwim(): Point | null {
    const w = this.walls(), e = this.extent(0), m = SWIM.margin, b = this.b, W = this.room.width, H = this.room.height;
    const x0 = w.left + e.x + m, x1 = w.right - e.x - m;
    let y0 = w.bottom + e.y + m, y1 = w.top - e.y - m;
    if (this.phone) {
      y0 = Math.max(y0, (0.5 - SWIM.band[1]) * H);
      y1 = Math.min(y1, (0.5 - SWIM.band[0]) * H);
    }
    if (x1 <= x0 || y1 <= y0) return null;
    const c = this.clipOffset(), r = this.root(), L = this.length * SWIM.slack;
    for (let k = 0; k < 40; k++) {
      const x = rand(x0, x1), y = rand(y0, y1), dx = x - b.x, dy = y - b.y;
      if (Math.hypot(dx, dy) < SWIM.far * W || Math.abs(Math.atan2(-dx, dy)) > SWIM.tilt) continue;
      if (Math.hypot(x + c.x - r.x, y + c.y - r.y) > L) continue;
      return { x: x / W + 0.5, y: 0.5 - y / H };
    }
    return null;
  }

  /** The way it swims, head first toward the place: its turn (radians, anticlockwise from upright), never past SWIM.tilt. */
  private heading(sw: { x: number; y: number }) {
    const to = this.at(sw.x, sw.y), b = this.b;
    return clamp(Math.atan2(-(to.x - b.x), to.y - b.y), -SWIM.tilt, SWIM.tilt);
  }

  /** Where it is in its stroke, 0 .. 1. */
  private strokePhase(sw: { t0: number }) {
    return ((this.t - sw.t0) / SWIM.stroke) % 1;
  }

  /** A room point (px, y up) as a client point. */
  private client(p: Point): Point {
    const r = this.room.canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2 + p.x, y: r.top + r.height / 2 - p.y };
  }

  /** Flying: its box is past an edge of the page, all of it. */
  private offPage() {
    const b = this.seen(this.b), e = this.extent(), W = this.room.width / 2 + 16, H = this.room.height / 2 + 16;
    return b.x - e.x > W || b.x + e.x < -W || b.y - e.y > H || b.y + e.y < -H;
  }

  /** One step of `h` seconds: the forces on it, then its velocity and place (semi-implicit Euler). */
  private step(h: number) {
    this.t += h;
    const b = this.b, tall = this.tall, I = (GYRATION * tall) ** 2, flying = this.state === "flying";
    const cos = Math.cos(b.a), sin = Math.sin(b.a);
    let ax = 0, ay = 0, al = 0;
    /** A force (per unit mass) at an offset from the middle (px): it moves it, and turns it by its lever. */
    const push = (fx: number, fy: number, rx: number, ry: number, turn = 1) => {
      ax += fx;
      ay += fy;
      al += (turn * (rx * fy - ry * fx)) / I;
    };

    // swimming somewhere, or setting off (see SWIM)
    if (!flying) this.swimStep();
    const sw = this.swim;
    // its own life: the wander, the bob, the turn, and a drift toward what it watches (swimming, the
    // wander goes on under the strokes, a little, and it drifts toward nothing but where it swims)
    const life = this.hold || flying ? 0 : this.life.v * (this.att.asleep ? WANDER.asleep : 1) * (sw ? 0.35 : 1);
    const turnIn = this.arrival ? Math.min(1, (this.t - this.arrival.t0) / TAKE.inFor) : 1;
    const turnLife = this.hold || flying ? 0 : Math.max(life, 0.5 * turnIn) * (this.att.asleep ? WANDER.asleep : 1);
    if (life > 0 || turnLife > 0) {
      const TAU = 2 * Math.PI, mix = WANDER.mix, sum = mix[0] + mix[1] + mix[2];
      const wave = (k: number, periods: number[]) => (mix[0] * Math.sin((TAU * this.t) / periods[0] + this.phases[k * 3]) + mix[1] * Math.sin((TAU * this.t) / periods[1] + this.phases[k * 3 + 1]) + mix[2] * Math.sin((TAU * this.t) / periods[2] + this.phases[k * 3 + 2])) / sum;
      const bobW = TAU / WANDER.bobEvery;
      ax += life * WANDER.push * tall * wave(0, WANDER.periods);
      ay += life * (WANDER.push * tall * wave(1, WANDER.periods) - WANDER.bob * tall * bobW * bobW * Math.sin(bobW * this.t));
      al += turnLife * WANDER.turn * wave(2, WANDER.turnPeriods);
    }
    if (life > 0 && !sw) {
      const f = this.att.focus;
      if (f && this.t >= this.calmAt && (f.kind === "mote" || f.kind === "glint" || (f.kind === "pointer" && this.att.stillFor > 0.8))) {
        const at = this.room.toWorld(f.at.x, f.at.y), dx = at.x - b.x, dy = at.y - b.y, d = Math.hypot(dx, dy), near = DRIFT.near * tall;
        if (d > near) {
          const pull = life * DRIFT.pull * tall * Math.min(1, (d - near) / tall);
          ax += (dx / d) * pull;
          ay += (dy / d) * pull;
        }
      }
      const r = this.rest();
      ax -= life * DRIFT.home * (b.x - r.x);
      ay -= life * DRIFT.home * (b.y - r.y);
    }

    // zero-g drag, and a weak righting
    const drag = flying ? DRAG.flight : 1;
    ax -= DRAG.move * drag * b.vx;
    ay -= DRAG.move * drag * b.vy;
    al -= (DRAG.spin + (this.hold ? DRAG.held : 0) + (sw ? SWIM.spin : 0)) * b.w;
    if (!flying) {
      // upright, or swimming, head first the way it goes
      const k = sw ? SWIM.turn : RIGHTING;
      al -= k * k * wrap(b.a - (sw ? this.heading(sw) : 0));
    }
    if (sw) {
      // the pull of each stroke pushes it along its heading (once it has turned that way), and a little straight at the place
      const ph = this.strokePhase(sw), [p0, p1] = SWIM.pull;
      if (ph > p0 && ph < p1) {
        const turned = Math.max(0, 1 - Math.abs(wrap(b.a - this.heading(sw))) / 0.8);
        const f = SWIM.thrust * tall * Math.sin((Math.PI * (ph - p0)) / (p1 - p0)) * turned * turned * (3 - 2 * turned);
        const to = this.at(sw.x, sw.y), dx = to.x - b.x, dy = to.y - b.y, d = Math.hypot(dx, dy) || 1;
        ax += f * (-Math.sin(b.a) + (SWIM.steer * dx) / d);
        ay += f * (Math.cos(b.a) + (SWIM.steer * dy) / d);
      }
    }

    // drawn toward the magnet stone (see attract)
    const pl = this.pull;
    if (pl && !flying && !this.hold && !this.reduced) {
      const dx = pl.x - b.x, dy = pl.y - b.y, d = Math.hypot(dx, dy) || 1, k = pl.k * tall * Math.min(1, d / (0.5 * tall));
      ax += (dx / d) * k;
      ay += (dy / d) * k;
    }

    // going for something: drawn straight at it, as well as swimming there (see FETCH)
    const fe = this.fetch, goal = fe && !fe.caught && !flying && !this.hold ? fe.to() : null;
    if (goal) {
      const dx = goal.x - b.x, dy = goal.y - b.y, d = Math.hypot(dx, dy) || 1, k = FETCH.glide * tall * Math.min(1, d / (FETCH.arrive * tall));
      ax += (dx / d) * k;
      ay += (dy / d) * k;
    }

    if (!flying && !this.arrival) {
      this.linePull(push, cos, sin);
      // sent home but kept from its line's end (a wall in the way, say): it snaps anyway
      if (this.sending && this.t - this.sentAt > SNAP.sendMost) this.snap();
    }

    // held: a spring from the grab point to the pointer
    const hd = this.hold;
    if (hd) {
      const u = this.unit, gx = hd.gx * u, gy = hd.gy * u, rx = gx * cos - gy * sin, ry = gx * sin + gy * cos;
      const vgx = b.vx - b.w * ry, vgy = b.vy + b.w * rx;
      const k = HOLD.omega * HOLD.omega, c = 2 * HOLD.zeta * HOLD.omega, most = HOLD.most * this.breakSpeed;
      let fx = k * (hd.x - (b.x + rx)) + c * (hd.vx - vgx), fy = k * (hd.y - (b.y + ry)) + c * (hd.vy - vgy);
      const f = Math.hypot(fx, fy);
      if (f > most) {
        fx *= most / f;
        fy *= most / f;
      }
      push(fx, fy, rx, ry);
    }

    if (this.arrival) {
      // floating in: carried along its path (easing out), turning by itself
      const { t0, from, to } = this.arrival, u = Math.min(1, (this.t - t0) / TAKE.inFor), e = Math.sin((u * Math.PI) / 2), de = ((Math.PI / 2) * Math.cos((u * Math.PI) / 2)) / TAKE.inFor;
      b.x = from.x + (to.x - from.x) * e;
      b.y = from.y + (to.y - from.y) * e;
      b.vx = (to.x - from.x) * de;
      b.vy = (to.y - from.y) * de;
      if (u >= 1) this.settle(true);
    } else {
      b.vx += ax * h;
      b.vy += ay * h;
      b.w += al * h;
      if (!flying) this.wallsHold(cos, sin);
      b.x += b.vx * h;
      b.y += b.vy * h;
      b.a += b.w * h;
      return;
    }
    b.w += al * h;
    b.a += b.w * h;
  }

  /**
   * The walls (see WALL): past one, it stops going through it, its spin settles, and its box is eased
   * back in without being given any speed. Once a wall, however many corners are past it.
   */
  private wallsHold(cos: number, sin: number) {
    const b = this.b, u = this.unit, w = this.walls(), hw = HALF.w * u, hh = HALF.h * u;
    // per wall (left, right, bottom, top): how far past it the deepest corner is
    const deep = [0, 0, 0, 0];
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = b.x + sx * hw * cos - sy * hh * sin, py = b.y + sx * hw * sin + sy * hh * cos;
      const d = [w.left - px, px - w.right, w.bottom - py, py - w.top];
      for (let i = 0; i < 4; i++) deep[i] = Math.max(deep[i], d[i]);
    }
    for (let i = 0; i < 4; i++) {
      if (deep[i] <= 0) continue;
      // the way back in, and its speed out through the wall
      const nx = i === 0 ? 1 : i === 1 ? -1 : 0, ny = i === 2 ? 1 : i === 3 ? -1 : 0;
      const vout = -(b.vx * nx + b.vy * ny);
      if (vout > 0) {
        b.vx += nx * vout;
        b.vy += ny * vout;
        if (vout > LIMBS.bump * this.tall) {
          this.brace();
          this.jolt("bump");
        }
        // a bump puts it off its own drifting (and a swim) a while; brushing the wall as it turns does not
        if (vout > WALL.bump * this.tall) this.calmAt = Math.max(this.calmAt, this.t + DRIFT.calm);
      }
      b.w *= WALL.still;
      b.x += nx * deep[i] * WALL.back;
      b.y += ny * deep[i] * WALL.back;
    }
  }

  /**
   * The line: past its length, a spring and a damper along it from the clip toward the root. Jerked
   * taut faster than the snap speed (not by hand), or sent home, it snaps instead.
   */
  private linePull(push: (fx: number, fy: number, rx: number, ry: number, turn?: number) => void, cos: number, sin: number) {
    const b = this.b, c = this.clipOffset(), r = this.root(), L = this.length;
    const rx = c.x * cos - c.y * sin, ry = c.x * sin + c.y * cos;
    const dx = b.x + rx - r.x, dy = b.y + ry - r.y, d = Math.hypot(dx, dy);
    if (d <= L) {
      if (d < L - LINE.slack) this.taut = false;
      return;
    }
    const nx = dx / d, ny = dy / d;
    // the clip's velocity along the line, outward
    const vn = (b.vx - b.w * ry) * nx + (b.vy + b.w * rx) * ny, snap = this.breakSpeed;
    if ((vn > snap && !this.hold) || this.sending) {
      this.snap();
      return;
    }
    if (!this.taut) {
      this.taut = true;
      if (vn > LINE.tug * snap && this.t - this.tugAt > LINE.tugEvery) {
        this.tugAt = this.t;
        const strength = Math.min(1, vn / snap);
        sfx.tug(strength);
        this.jolt("tug");
        this.att.play("jolt", 7, () => jolt(this.att, strength));
        this.brace();
        this.calmAt = this.t + DRIFT.calm;
      }
    }
    const T = LINE.k * (d - L) + 2 * LINE.zeta * Math.sqrt(LINE.k) * vn;
    if (T > 0) push(-T * nx, -T * ny, rx, ry, LINE.turn);
  }

  dispose() {
    this.disposed = true;
    this.tl?.kill();
    this.hello?.kill();
    gsap.killTweensOf(this.life);
    this.stopFrame();
    this.tether.dispose();
  }
}
