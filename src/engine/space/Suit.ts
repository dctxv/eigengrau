import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { decline, leaveHome, suitUp } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import { createUrchi, warmSuitIdle, whenIdle, type HeadPose, type UrchiCharacter } from "@/engine/urchi/character";
import { setAlong } from "@/lib/along";
import type { RoomScene } from "./RoomScene";
import { Tether } from "./Tether";

/**
 * The peg (panel 2, the spacesuit): a 10px ring on Space's left wall, its centre `left` px in and
 * `down` of the way down, and its helmet hanging from it, `helmet` px across (its side discs
 * included), its crown `hang` px below the ring's centre. The tether ties on at the ring's right.
 * Its button is `hit` px square, the ring `ringTop` px down it. On a short phone the head reaches
 * the wall at that height (its lower spikes a few px from the button, a tap meant for it could
 * suit it up): there the peg hangs lower, as little as keeps `clear` px between the button and the
 * head as drawn at rest (RoomScene.clearOfHead; room enough that no turn or tilt brings the two
 * together), and never into the bottom `foot` px, where the caption's band is.
 */
const PEG = { left: 24, down: 0.62, ring: 5, helmet: 36, hang: 3, hit: 44, ringTop: 8, clear: 24, foot: 96 };
/** The helmet's width in mesh units, disc to disc, and its crown above the head's centre (as painted, rim included). */
const HELMET_W = 1132;
const CROWN = -362;
/** The window of the painter's canvas the helmet is shown through, in mesh units from the head's centre: all of it, rim and discs. */
const WIN = { x: -600, y: -380, w: 1200, h: 920 };
/** Where the body is built and the helmet not yet begun (the painter's build: setSuit 0 .. this is the body). */
const BODY = 0.446;
/**
 * Suiting up, seconds from the press (about 2.3s in all; the fog and the blink after). The act
 * looks at the peg and dips (0.2s); the room steps back (`frame`); the body builds from the neck
 * ring outward (`body`: the ears fold in at the end of it); the helmet lifts off the peg (`lift`)
 * and floats to the head on an arc (`fly`, power2.inOut), coming down over it, turned as the head
 * is by then (see TURN), its glass clearing as it comes (see CLEAR), so the eyes are seen through
 * it all the way down. The moment it is down, in that one frame, it hands over to the painted
 * helmet, whole: the same outline to the pixel and, sat on the head, the same glass, so nothing
 * changes but which of the two draws it (one helmet, every frame), and the glass tick and the hiss
 * say it has sealed. The tether draws from the peg to the backpack (`tether`); the float comes in
 * (`float`).
 */
const UP = { frame: 0.12, frameFor: 1, body: 0.2, bodyFor: 0.95, lift: 0.45, liftFor: 0.2, fly: 0.65, flyFor: 0.85, tether: 1.8, tetherFor: 0.5, float: 2.05, done: 2.3 };
/**
 * Leaving it home, the other way round: the tether reels in (`reel`); at the unseal (`unseal`, the
 * hiss rising) the painted helmet hands over, in one frame, to the flying one, and it floats back to
 * the peg (`fly`), the head seen through its glass as it lifts off, darkening again as it leaves;
 * once it is clear of the head the body unbuilds (`body`) and the room steps forward again (`frame`).
 */
const HOME = { reel: 0.6, unseal: 0.5, fly: 0.68, flyFor: 0.9, body: 1.05, bodyFor: 0.8, frame: 0.95, frameFor: 1, done: 2 };
/**
 * The helmet's glass as it flies (see clearGlass): dark inside on the peg and for the first of its
 * arc; from `from` to `to` of the way, before it comes over the head, it clears where the head is
 * (wherever that is under it, all the way down), so the eyes are seen through it as through the
 * worn visor, and nothing of the head's outline: sat on the head it is the worn helmet exactly.
 * Going home, the other way.
 */
const CLEAR = { from: 0.45, to: 0.65 };
/** Reduced motion: the suit fades on or off, 400ms in all (out, the change, back in), and the peg's helmet with it. */
const FADE = 0.2;
/** The glint on the helmet's glass as Urchi looks at it: `seconds` long, at most `alpha` white, a band `width` of the glass wide. */
const GLINT = { seconds: 1, alpha: 0.6, width: 0.28 };
/**
 * The helmet's lift off the peg (px up), its roll in flight (degrees, at its most), and its arc:
 * up off the peg by `arc` of the room's height, and down onto the head from `drop` of it above.
 */
const FLIGHT = { lift: 8, roll: -12, arc: 0.22, drop: 0.3 };
/** Facing out, level: the helmet on its peg, and on its way off it. */
const LEVEL: HeadPose = { yaw: 0, pitch: 0, roll: 0, shift: 0, rise: 0 };
/**
 * The flying helmet is painted turned as the head is (the head's own pose, see holdPose), so the
 * two are one outline wherever it looks, asleep or awake: coming down, it takes the head's pose
 * over the last of its flight, from `land` of the way; over the head it is the head's, frame by
 * frame; lifted off, it keeps the pose the head had then and turns level again by `level` of the
 * way back from it.
 */
const TURN = { land: 0.7, level: 0.35 };
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a: HeadPose, b: HeadPose, t: number): HeadPose =>
  t <= 0 ? a : t >= 1 ? b : { yaw: a.yaw + (b.yaw - a.yaw) * t, pitch: a.pitch + (b.pitch - a.pitch) * t, roll: a.roll + (b.roll - a.roll) * t, shift: a.shift + (b.shift - a.shift) * t, rise: a.rise + (b.rise - a.rise) * t };

type State = "home" | "suiting" | "suited" | "unsuiting";

export type SuitOptions = {
  room: RoomScene;
  att: Attention;
  /** The positioned panel the peg sits in. */
  panel: HTMLElement;
  /** The peg as a whole (over the panel, hidden until it appears), its button (the ring inside it) and the helmet's canvas. */
  wall: HTMLElement;
  peg: HTMLButtonElement;
  helmet: HTMLCanvasElement;
  reducedMotion: boolean;
  /** Along or not has changed, or will once what is under way is done (the label, the cursor's word). */
  onChange?(along: boolean): void;
  /** Suiting up or leaving it home has begun or is over: while it runs, Urchi's click has nothing to open. */
  onBusy?(busy: boolean): void;
};

/**
 * The spacesuit's life on Space, the home tab (panel 2, stage 1, as Darius changed it: his own
 * low-poly suit). The peg on the left wall with a small version of the helmet hanging from it (the
 * same painter, the helmet alone and empty); pressing it suits Urchi up (the body builds from the
 * neck ring, the helmet floats over from the peg and seals, the tether draws from the peg to the
 * backpack) and the room steps back so the whole astronaut fits; pressing it again leaves it home.
 * Along is remembered for the visit (along.ts), and a return finds it suited at once. The companion
 * on the other tabs is the next packet's: it takes over through RoomScene.handover().
 */
export class Suit {
  private o: SuitOptions;
  private room: RoomScene;
  private att: Attention;
  private reduced: boolean;
  private state: State = "home";
  /** The peg has been asked for (show), and has appeared: painted, and on the wall unless the game is up. */
  private shown = false;
  private up = false;
  /** The game is up (see away), and an appearance held back until it closes (show's `now`), or null. */
  private aside = false;
  private held: boolean | null = null;
  /** Pressed while suiting up or leaving it home: it goes back the other way once that is done (a second press takes it back). */
  private queued = false;
  /** How far down the panel the ring hangs, px (see PEG and layout). */
  private ringY = 0;
  /** The peg's helmet has been painted, and what waits for it (see whenPainted). */
  private ready = false;
  private onPainted: (() => void)[] = [];
  /** The helmet alone and empty, and its glass alone (white), painted by their own painters. */
  private empty: UrchiCharacter | null = null;
  private glass: UrchiCharacter | null = null;
  private ctx: CanvasRenderingContext2D;
  private glintCanvas = document.createElement("canvas");
  /** The helmet's canvas as sized: its unit (css px per mesh unit), screen pixels and rim (mesh units; null, the painter's own). */
  private painted = { unit: 0, dpr: 0, rim: null as number | null };
  /** The pose the empty helmet (and, for the glint, its glass) was last painted at. */
  private pose: HeadPose | null = null;
  private glassPose: HeadPose | null = null;
  /** Going home: the head's pose as the painted helmet left it (the flying one keeps it, turning level on the way). */
  private snap: HeadPose | null = null;
  /** Where the helmet is: 0 on the peg .. 1 on the head (along the arc), off the peg (0..1), how much of it shows, the glint's run. */
  private flight = { p: 0, lift: 0, alpha: 1, glint: -1 };
  private tl: gsap.core.Timeline | null = null;
  private tether: Tether;
  /** The painted suit, tweened through setSuit. */
  private amount = { v: 0 };
  private sealed = false;
  private stopFrame: () => void;
  private wasWatching = false;
  private disposed = false;

  constructor(o: SuitOptions) {
    this.o = o;
    this.room = o.room;
    this.att = o.att;
    this.reduced = o.reducedMotion;
    this.ctx = o.helmet.getContext("2d")!;
    this.tether = new Tether(o.room, { from: () => this.ringInRoom(PEG.ring - 1), to: () => this.room.backpack(), reducedMotion: o.reducedMotion });
    this.stopFrame = o.room.afterUrchi(() => this.frame());
    this.layout();
  }

  /** Suited, or on its way there. */
  get along() {
    return this.state === "suited" || this.state === "suiting";
  }

  /** Where it will be once what is under way is done: along, unless a press waits to take it back. What the button says. */
  get target() {
    return this.along !== this.queued;
  }

  /** In the middle of suiting up or leaving it home. */
  get busy() {
    return this.state === "suiting" || this.state === "unsuiting";
  }

  /** The peg is on the wall (painted, and not out of the way of the game). */
  get pegShown() {
    return this.up && !this.aside;
  }

  // ---------------------------------------------------------------- the peg

  /** The panel's size and place on screen. */
  private panelRect() {
    return this.o.panel.getBoundingClientRect();
  }

  /** The ring's centre in client px (`dx` to its right). */
  ringAt(dx = 0): Point {
    const r = this.panelRect();
    return { x: r.left + PEG.left + dx, y: r.top + (this.ringY || PEG.down * r.height) };
  }

  private ringInRoom(dx = 0) {
    const c = this.ringAt(dx);
    return this.room.toRoom(c.x, c.y);
  }

  /** The helmet's head's-centre point on the peg, and its unit, in client px. */
  private onPeg() {
    const unit = this.painted.unit && this.state === "home" && this.flight.p === 0 ? this.o.helmet.width / (this.painted.dpr || 1) / WIN.w : PEG.helmet / HELMET_W, ring = this.ringAt();
    return { x: ring.x, y: ring.y + PEG.hang - CROWN * unit, unit };
  }

  /** Where the eyes should look to see the helmet: its glass, wherever it is. */
  helmetAt(): Point | null {
    const at = this.where();
    return { x: at.x, y: at.y + 90 * at.unit };
  }

  /**
   * The button and the helmet laid out for the panel's size: the ring `down` of the way down, or,
   * where the head at rest would come within `clear` of the button (a short phone), as little
   * lower as keeps it that far off, and never into the caption's band.
   */
  layout() {
    const r = this.panelRect(), btn = this.o.peg;
    const hit = (y: number) => {
      const top = r.top + y - PEG.ringTop, left = r.left + PEG.left - PEG.hit / 2;
      return this.room.clearOfHead(left, top, left + PEG.hit, top + PEG.hit);
    };
    let y = Math.round(PEG.down * r.height);
    const lowest = r.height - PEG.foot - PEG.hit + PEG.ringTop;
    while (y < lowest && hit(y) < PEG.clear) y += 2;
    this.ringY = y;
    Object.assign(btn.style, { left: `${PEG.left - PEG.hit / 2}px`, top: `${y - PEG.ringTop}px` });
    if (this.shown) this.place();
  }

  /**
   * Paints the peg's helmet (the model first, the first time), then shows the peg: faded in, or
   * `now` (quicker, and without the helmet settling onto it). With the game up it waits, out of the
   * way, and appears as the game closes (see away). Each step in a moment of its own (whenIdle):
   * the suit's rig (once for the page, a slice at a time: warmSuitIdle), the helmet's painter, its
   * first paint; the glint's painter after it is up.
   */
  show(now = false) {
    if (this.shown || this.disposed) return;
    this.shown = true;
    const step = (fn: () => void) => whenIdle(() => {
      if (!this.disposed) fn();
    });
    const paint = () => step(() => {
      this.makePainter();
      step(() => {
        if (this.state === "home") this.size(this.onPeg().unit, null);
        this.draw();
        this.place();
        if (this.aside) this.held = now;
        else this.appear(now);
        this.ready = true;
        this.onPainted.splice(0).forEach((fn) => fn());
        step(() => this.glassPainter());
      });
    });
    warmSuitIdle().then(
      () => paint(),
      () => {
        this.shown = false; // no model, no peg: it may be tried again
      },
    );
  }

  /** The painted peg comes onto the wall: faded in (quicker on a return, as the room itself fades in), the helmet settling onto its peg the first time. */
  private appear(now: boolean) {
    this.up = true;
    gsap.fromTo(this.o.wall, { autoAlpha: 0 }, { autoAlpha: 1, duration: now || this.reduced ? 0.6 : 0.9, ease: "power2.out", overwrite: true });
    if (!now && !this.reduced && this.state === "home") {
      this.flight.lift = 1;
      gsap.to(this.flight, { lift: 0, duration: 1.1, ease: "power3.out" });
    }
    this.att.add({ id: "peg", kind: "interest", weight: 0.25, at: () => (this.state === "home" ? this.helmetAt() : this.ringAt()) });
  }

  /**
   * Out of the way while the game is up, as the motes are (the room is cleared for the board), and
   * back after: the peg and, suited, its tether with it, so no line runs to a peg that is not there.
   * A peg due to appear meanwhile (its ten seconds up, or its model late) waits for the game to close.
   */
  away(on: boolean) {
    this.aside = on;
    this.o.peg.inert = on;
    if (this.state === "suited") {
      this.tether.dim(on);
      // stacked above the board it holds still (its soles keep their gap to the plate), and floats again after
      this.room.floatUrchi(!on);
    }
    if (!on && this.held !== null) {
      const now = this.held;
      this.held = null;
      this.appear(now);
      return;
    }
    if (!this.up) return;
    gsap.to(this.o.wall, { autoAlpha: on ? 0 : 1, duration: on ? 0.3 : 0.5, ease: "power2.out", overwrite: true });
  }

  /** A glint on the helmet's glass, as Urchi looks at it. */
  glint() {
    if (this.disposed || this.state !== "home" || this.flight.glint >= 0 || !this.empty || !this.glassPainter()) return;
    gsap.fromTo(this.flight, { glint: 0 }, { glint: 1, duration: GLINT.seconds, ease: "none", onComplete: () => { this.flight.glint = -1; } });
  }

  // ---------------------------------------------------------------- the helmet's painters

  /** The helmet's painter: the helmet alone and empty (the room's suit rig, shared). */
  private makePainter() {
    if (this.empty) return;
    this.empty = createUrchi({ smooth: true, input: false }, { suitPart: "helmet", suitEmpty: true });
    this.empty.setSuit(1);
  }

  /** The glint's painter, its glass alone (made once the peg is up, or at the first glint): whether it is there. */
  private glassPainter() {
    if (!this.glass && this.empty && !this.disposed) {
      this.glass = createUrchi({ smooth: true, input: false }, { suitPart: "helmet", suitLayer: "glass" });
      this.glass.setSuit(1);
      const p = this.painted;
      if (p.unit) {
        this.glass.setResolution(1080 * p.unit * p.dpr);
        this.glass.setRim(p.rim);
      }
      this.glassPose = null;
    }
    return !!this.glass;
  }

  /**
   * The painters at `unit` css px per mesh unit (at this screen's pixels), outlined `rim` mesh
   * units wide: over the head, the rim the room holds for it there, so neither outline shows past
   * the other; on the peg, null (the painter's own, a hairline at that size).
   */
  private size(unit: number, rim: number | null) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), p = this.painted;
    if (!this.empty || (p.unit === unit && p.dpr === dpr && p.rim === rim)) return;
    Object.assign(p, { unit, dpr, rim });
    for (const ch of [this.empty, this.glass]) {
      if (!ch) continue;
      ch.setResolution(1080 * unit * dpr);
      ch.setRim(rim);
    }
    this.pose = this.glassPose = null;
    const c = this.o.helmet;
    // whole device pixels, and the css box exactly their size, so nothing resamples it at rest
    c.width = Math.ceil(WIN.w * unit * dpr);
    c.height = Math.ceil(WIN.h * unit * dpr);
    c.style.width = `${c.width / dpr}px`;
    c.style.height = `${c.height / dpr}px`;
    this.glintCanvas.width = c.width;
    this.glintCanvas.height = c.height;
    this.drawn = "";
  }

  /** A painter turned to a pose and painted, unless it shows that pose already (then false; `anyway`, painted whatever). */
  private static turn(ch: UrchiCharacter, was: HeadPose | null, pose: HeadPose, anyway = false) {
    if (!anyway && was && Math.abs(was.yaw - pose.yaw) < 1e-5 && Math.abs(was.pitch - pose.pitch) < 1e-5 && Math.abs(was.roll - pose.roll) < 1e-5 && Math.abs(was.shift - pose.shift) < 1e-3 && Math.abs(was.rise - pose.rise) < 1e-3) return false;
    ch.holdPose(pose);
    ch.update(0.001);
    return true;
  }

  /**
   * How clear the helmet's glass is now (see CLEAR), and where the head is under it: its middle in
   * the helmet's own mesh units (its canvas turned with it), and its size against the helmet's.
   */
  private clearNow(): [number, { x: number; y: number; k: number }] {
    const p = this.flight.p;
    if (p <= 0) return [0, { x: 0, y: 0, k: 1 }];
    const at = this.where(), head = this.room.headOnScreen(), r = (-at.roll * Math.PI) / 180;
    const dx = head.x - at.x, dy = head.y - at.y;
    return [smooth(CLEAR.from, CLEAR.to, p), { x: (dx * Math.cos(r) - dy * Math.sin(r)) / at.unit, y: (dx * Math.sin(r) + dy * Math.cos(r)) / at.unit, k: head.unit / at.unit }];
  }

  /** The pose the helmet is turned to now: level on and off its peg; the head's as it comes down over it, sits on it and leaves it (see TURN). */
  private posed(): HeadPose {
    const f = this.flight;
    if (f.p <= 0) return LEVEL;
    const live = this.room.urchi.character.headPose;
    if (this.state === "suiting") return mix(LEVEL, live, smooth(TURN.land, 1, f.p));
    if (this.state === "unsuiting") {
      // off the head (the painted helmet has gone from it by then): the pose it had, turning level
      if (f.p < 1 && !this.snap) this.snap = live;
      return this.snap ? mix(LEVEL, this.snap, smooth(TURN.level, 1, f.p)) : live;
    }
    return live;
  }

  /** What the helmet's canvas shows now, as a key: it is only drawn again when that changes. */
  private drawn = "";
  /** How clear the empty helmet's glass was last painted, and where the head under it was (see clearNow). */
  private clear = { v: 0, x: 0, y: 0, k: 1 };

  /** The helmet into its canvas: the empty helmet, and the glint on its glass. */
  private draw() {
    const { glint } = this.flight;
    if (!this.empty) return;
    if (this.flight.alpha > 0) {
      const pose = this.posed(), [clear, under] = this.clearNow(), was = this.clear;
      // (the head's place under it to a tenth of a mesh unit: finer is no difference in its canvas)
      const cleared = Math.abs(clear - was.v) > 1e-4 || (clear > 0 && (Math.abs(under.x - was.x) > 0.1 || Math.abs(under.y - was.y) > 0.1 || Math.abs(under.k - was.k) > 1e-4));
      if (cleared) {
        this.empty.clearGlass(clear, under);
        this.clear = { v: clear, ...under };
      }
      if (Suit.turn(this.empty, this.pose, pose, cleared)) {
        this.pose = pose;
        this.drawn = "";
      }
      // its glass only for the glint (on the peg)
      if (glint >= 0 && this.glass && Suit.turn(this.glass, this.glassPose, pose)) {
        this.glassPose = pose;
        this.drawn = "";
      }
    }
    const key = glint.toFixed(3);
    if (key === this.drawn) return;
    this.drawn = key;
    const g = this.ctx, c = this.o.helmet;
    const blit = (to: CanvasRenderingContext2D, ch: UrchiCharacter) => {
      const f = ch.frame, cell = f.w / ch.canvas.width;
      to.drawImage(ch.canvas, (WIN.x - f.x) / cell, (WIN.y - f.y) / cell, WIN.w / cell, WIN.h / cell, 0, 0, c.width, c.height);
    };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.clearRect(0, 0, c.width, c.height);
    blit(g, this.empty);
    if (glint >= 0 && glint <= 1 && this.glass) {
      // a band of light across the glass, upper left to lower right, only where the glass is
      const s = this.glintCanvas.getContext("2d")!, W = c.width, H = c.height;
      s.globalCompositeOperation = "source-over";
      s.clearRect(0, 0, W, H);
      // (under reduced motion it does not sweep: it brightens where it is and fades)
      const at = this.reduced ? 0.45 : -GLINT.width + glint * (1 + 2 * GLINT.width), a = GLINT.alpha * Math.sin(Math.PI * glint);
      const band = s.createLinearGradient(W * (at - GLINT.width), H * (at - GLINT.width) * 0.6, W * (at + GLINT.width), H * (at + GLINT.width) * 0.6);
      band.addColorStop(0, "rgba(233, 233, 226, 0)");
      band.addColorStop(0.5, `rgba(233, 233, 226, ${a.toFixed(3)})`);
      band.addColorStop(1, "rgba(233, 233, 226, 0)");
      s.fillStyle = band;
      s.fillRect(0, 0, W, H);
      s.globalCompositeOperation = "destination-in";
      blit(s, this.glass);
      g.drawImage(this.glintCanvas, 0, 0);
    }
  }

  /** The helmet's head's-centre point in client px, its unit and roll: on the peg, lifting off it, or along its arc to the head. */
  private where() {
    const peg = this.onPeg(), f = this.flight;
    const from = { x: peg.x, y: peg.y - FLIGHT.lift * f.lift, unit: peg.unit, roll: (FLIGHT.roll / 3) * f.lift };
    if (f.p <= 0) return from;
    const head = this.room.headOnScreen(), p = f.p, H = this.panelRect().height;
    // an arc: up off the peg and over, and straight down onto the head (a cubic: its last pull is from above the head)
    const x1 = from.x + (head.x - from.x) * 0.3, y1 = from.y - FLIGHT.arc * H;
    const x2 = head.x, y2 = head.y - FLIGHT.drop * H;
    const q = 1 - p, a = q * q * q, b = 3 * q * q * p, c = 3 * q * p * p, d = p * p * p;
    return {
      x: a * from.x + b * x1 + c * x2 + d * head.x,
      y: a * from.y + b * y1 + c * y2 + d * head.y,
      unit: from.unit * Math.pow(head.unit / from.unit, p),
      roll: from.roll * q + FLIGHT.roll * 4 * p * q * q + ((head.roll * 180) / Math.PI) * p,
    };
  }

  /** The helmet's canvas moved to where the helmet is. */
  private place() {
    const at = this.where(), r = this.panelRect(), c = this.o.helmet, dpr = this.painted.dpr || 1;
    // the unit the canvas holds (its pixels are whole, so a hair more than it was painted for)
    const u0 = this.painted.unit ? c.width / dpr / WIN.w : at.unit;
    const k = at.unit / u0, x = at.x - r.left, y = at.y - r.top;
    if (Math.abs(k - 1) < 1e-6 && Math.abs(at.roll) < 1e-6) {
      // at rest: its corner on a whole device pixel
      const snap = (v: number) => Math.round(v * dpr) / dpr;
      c.style.transform = `translate(${snap(x + WIN.x * u0)}px, ${snap(y + WIN.y * u0)}px)`;
    } else c.style.transform = `translate(${x}px, ${y}px) rotate(${at.roll}deg) scale(${k}) translate(${WIN.x * u0}px, ${WIN.y * u0}px)`;
    c.style.opacity = String(this.flight.alpha);
  }

  private frame() {
    if (!this.shown || !this.empty) return;
    const watching = this.att.watching("peg");
    if (watching && !this.wasWatching && this.state === "home") this.glint();
    this.wasWatching = watching;
    this.draw();
    this.place();
  }

  // ---------------------------------------------------------------- along

  /**
   * Pressed: suits up, leaves it home, or (asleep at his night) it half wakes and glances away.
   * Pressed while it is suiting up or leaving it home, it goes back the other way once that is done,
   * and the button says so at once (a second press takes that back): every press is answered, and
   * what the button says is always where it will end up. Asleep, it never goes along, so a press
   * as the helmet comes off it in its sleep has nothing to queue.
   */
  press() {
    if (!this.pegShown || this.disposed) return;
    if (this.busy) {
      if (this.state === "unsuiting" && !this.queued && this.att.mood === "asleep") return;
      this.queued = !this.queued;
      setAlong(this.target);
      this.o.onChange?.(this.target);
      return;
    }
    if (this.state === "suited") return this.goHome();
    this.leave();
  }

  /** Leaving home, awake: suited up. Asleep it half wakes and glances away instead, and stays (and says it stays). */
  private leave() {
    if (this.att.mood === "asleep") {
      this.att.play("decline", 6, () => decline(this.att, this.helmetAt()), { sleeping: true });
      setAlong(false);
      this.o.onChange?.(false);
      return;
    }
    if (this.att.mood === "dozing") this.att.rouse();
    this.suitUp();
  }

  /** Already along when Space mounts (within the visit): suited and tethered, no animation. The model must be loaded. */
  restore() {
    this.state = "suited";
    this.amount.v = 1;
    this.room.urchi.setSuit(1);
    this.room.frameSuited(true, 0);
    this.room.floatUrchi(true, true);
    this.att.setAlong(true);
    this.flight.p = 1;
    this.flight.alpha = 0;
    // the tether once Urchi has been placed (its backpack is somewhere), fading in with it
    const stop = this.room.afterUrchi(() => {
      stop();
      if (this.state === "suited") this.tether.fade(true, 0.6);
    });
  }

  /**
   * Along, but its model came too late for it to arrive suited (see the panel's SUIT_WAIT): now it
   * is here, it suits up as if the peg had been pressed. Asleep, it stays home.
   */
  resume() {
    // (once the peg's helmet is painted: it is the one that flies)
    this.whenPainted(() => {
      if (this.state !== "home" || this.disposed) return;
      if (this.att.mood === "asleep") {
        setAlong(false);
        this.o.onChange?.(false);
        return;
      }
      if (this.att.mood === "dozing") this.att.rouse();
      this.suitUp();
    });
  }

  /** `fn` once the peg's helmet has been painted (at once if it has): see show. */
  private whenPainted(fn: () => void) {
    if (this.ready) fn();
    else this.onPainted.push(fn);
  }

  private suitUp() {
    this.state = "suiting";
    setAlong(true);
    this.o.onChange?.(true);
    this.o.onBusy?.(true);
    this.att.setAlong(true);
    this.sealed = false;
    const room = this.room, f = this.flight;
    const act = () =>
      suitUp(this.att, {
        peg: () => this.helmetAt(),
        helmet: () => (f.p > 0 ? this.helmetAt() : null),
        coming: () => f.p > 0.45,
        landing: () => f.p > 0.85,
        sealed: () => this.sealed,
        fog: () => room.urchi.character.fog(1),
      });
    this.att.play("suitUp", 7, act, { queue: 2 });
    const tl = (this.tl = gsap.timeline({ onComplete: () => this.settled("suited") }));
    if (this.reduced) {
      // a 400ms fade: out, the suit on and the helmet gone from the peg, back in
      room.urchi.fade(0, FADE, 0, 1);
      gsap.to(f, { alpha: 0, duration: FADE * 2, ease: "power2.out" });
      tl.call(() => {
        room.urchi.setSuit(1);
        room.frameSuited(true, 0);
        this.sealed = true;
        sfx.seal(true);
        this.tether.fade(true, FADE);
        room.urchi.fade(1, FADE);
      }, [], FADE);
      tl.to({}, { duration: FADE }, FADE);
      return;
    }
    tl.call(() => room.frameSuited(true, UP.frameFor), [], UP.frame);
    tl.to(this.amount, { v: BODY, duration: UP.bodyFor, ease: "sine.inOut", onUpdate: () => room.urchi.setSuit(this.amount.v) }, UP.body);
    // off the peg, at the size it will land at, and with the rim it will have there
    tl.call(() => this.size(room.unitAt(true), room.urchi.rimFor(room.unitAt(true))), [], UP.lift - 0.01);
    tl.to(f, { lift: 1, duration: UP.liftFor, ease: "power2.out" }, UP.lift);
    tl.to(f, { p: 1, duration: UP.flyFor, ease: "power2.inOut" }, UP.fly);
    const land = UP.fly + UP.flyFor;
    // down: the painted helmet, whole, in its place in the same frame (it never rises under it: no
    // edge of it to show through the glass), and sealed
    tl.call(() => {
      this.amount.v = 1;
      room.urchi.setSuit(1);
      f.alpha = 0;
      this.sealed = true;
      sfx.seal(true);
    }, [], land);
    tl.call(() => this.tether.draw(UP.tetherFor), [], UP.tether);
    tl.call(() => room.floatUrchi(true), [], UP.float);
    tl.to({}, { duration: 0.01 }, UP.done);
  }

  private goHome() {
    this.state = "unsuiting";
    this.snap = null;
    setAlong(false);
    this.o.onChange?.(false);
    this.o.onBusy?.(true);
    this.att.setAlong(false);
    const room = this.room, f = this.flight;
    // What is left of suiting up (the fog, the satisfied blink) gives way to it; a doze is broken, as
    // a press to suit up breaks one; asleep, it sleeps on, and the helmet comes off it as it lies.
    this.att.cancel("suitUp");
    if (this.att.mood === "dozing") this.att.rouse();
    if (this.att.mood === "awake") {
      this.att.play("leaveHome", 8, () => leaveHome(this.att, { peg: () => this.ringAt(), helmet: () => (f.p < 1 && f.p > 0 ? this.helmetAt() : null), done: () => this.state === "home" }), { queue: 1 });
    }
    const tl = (this.tl = gsap.timeline({ onComplete: () => this.settled("home") }));
    room.floatUrchi(false);
    if (this.reduced) {
      room.urchi.fade(0, FADE, 0, 1);
      this.tether.fade(false, FADE);
      tl.call(() => {
        room.urchi.setSuit(0);
        this.amount.v = 0;
        room.frameSuited(false, 0);
        f.p = 0; f.lift = 0;
        this.size(this.onPeg().unit, null);
        room.urchi.fade(1, FADE);
        gsap.to(f, { alpha: 1, duration: FADE * 2, ease: "power2.out" });
      }, [], FADE);
      tl.to({}, { duration: FADE }, FADE);
      return;
    }
    this.tether.reel(HOME.reel);
    // the flying helmet sized for the head (unseen yet), then in one frame it takes over from the
    // painted one, where it is and turned as it is (see posed), and the head, its ears still folded,
    // is under it: unsealed
    tl.call(() => {
      const u = room.headOnScreen().unit;
      this.size(u, room.urchi.rimFor(u));
    }, [], HOME.unseal - 0.01);
    tl.call(() => {
      f.p = 1; f.lift = 1; f.alpha = 1;
      this.amount.v = BODY;
      room.urchi.setSuit(BODY);
      sfx.seal(false);
    }, [], HOME.unseal);
    tl.to(f, { p: 0, duration: HOME.flyFor, ease: "power2.inOut" }, HOME.fly);
    tl.to(f, { lift: 0, duration: 0.25, ease: "power2.inOut" }, HOME.fly + HOME.flyFor - 0.1);
    tl.call(() => this.size(this.onPeg().unit, null), [], HOME.fly + HOME.flyFor + 0.16);
    tl.to(this.amount, { v: 0, duration: HOME.bodyFor, ease: "sine.inOut", onUpdate: () => room.urchi.setSuit(this.amount.v) }, HOME.body);
    tl.call(() => room.frameSuited(false, HOME.frameFor), [], HOME.frame);
    tl.to({}, { duration: 0.01 }, HOME.done);
  }

  private settled(state: State) {
    this.tl = null;
    this.state = state;
    if (state === "home") {
      this.room.urchi.setSuit(0);
      this.flight.alpha = 1;
    }
    // pressed meanwhile: back the other way now
    if (this.queued) {
      this.queued = false;
      if (state === "suited") return this.goHome();
      this.leave();
      if (this.busy) return;
    }
    this.o.onBusy?.(false);
  }

  dispose() {
    this.disposed = true;
    this.queued = false;
    this.tl?.kill();
    gsap.killTweensOf(this.flight);
    gsap.killTweensOf(this.amount);
    gsap.killTweensOf(this.o.wall);
    gsap.set(this.o.wall, { autoAlpha: 0 });
    this.o.peg.inert = false;
    this.stopFrame();
    this.tether.dispose();
    this.att.remove("peg");
    this.empty?.dispose();
    this.glass?.dispose();
  }
}
