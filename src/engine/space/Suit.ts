import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { decline, leaveHome, suitUp } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import { createUrchi, preloadSuit, type UrchiCharacter } from "@/engine/urchi/character";
import { setAlong } from "@/lib/along";
import type { RoomScene } from "./RoomScene";
import { Tether } from "./Tether";

/**
 * The peg (panel 2, the spacesuit): a 10px ring on Space's left wall, its centre `left` px in and
 * `down` of the way down, and its helmet hanging from it, `helmet` px across (its side discs
 * included), its crown `hang` px below the ring's centre. The tether ties on at the ring's right.
 */
const PEG = { left: 24, down: 0.62, ring: 5, helmet: 36, hang: 3 };
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
 * and floats to the head on an arc (`fly`, power2.inOut), coming down over it; as it settles (from
 * `rise` before it lands: it is a few pixels off by then) the painted helmet rises and seals under
 * it (`sealFor`), hidden by its dark glass; the glass tick and the hiss as it touches down (`seal`
 * from its end), and the flying helmet fades into the painted one (`fade`, from `fadeAt`), so all that changes is
 * the visor clearing onto the eyes, wide; the tether draws from the peg to the backpack
 * (`tether`); the float comes in (`float`).
 */
const UP = { frame: 0.12, frameFor: 1, body: 0.2, bodyFor: 0.95, lift: 0.45, liftFor: 0.2, fly: 0.65, flyFor: 0.85, rise: -0.08, sealFor: 0.14, seal: -0.08, fadeAt: 0.03, fade: 0.24, tether: 1.8, tetherFor: 0.5, float: 2.05, done: 2.3 };
/**
 * Leaving it home, the other way round: the tether reels in (`reel`); the flying helmet fades in
 * over the painted one (`cover`: the visor darkens over the eyes), which sinks away under it
 * (`unseal`, with the hiss rising), and it floats back to the peg (`fly`); once it is clear of the
 * head the body unbuilds (`body`) and the room steps forward again (`frame`).
 */
const HOME = { reel: 0.6, cover: 0.3, coverFor: 0.2, unseal: 0.5, unsealFor: 0.16, fly: 0.68, flyFor: 0.9, body: 1.05, bodyFor: 0.8, frame: 0.95, frameFor: 1, done: 2 };
/** Reduced motion: the suit fades on or off, 400ms in all (out, the change, back in), and the peg's helmet with it. */
const FADE = 0.2;
/** The glint on the helmet's glass as Urchi looks at it: `seconds` long, at most `alpha` white, a band `width` of the glass wide. */
const GLINT = { seconds: 1, alpha: 0.6, width: 0.28 };
/**
 * The helmet's lift off the peg (px up), its roll in flight (degrees, at its most), and its arc:
 * up off the peg by `arc` of the room's height, and down onto the head from `drop` of it above.
 */
const FLIGHT = { lift: 8, roll: -12, arc: 0.22, drop: 0.3 };

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
  /** Along or not has changed (the label, the cursor's word). */
  onChange?(along: boolean): void;
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
  private shown = false;
  /** The helmet alone and empty, and its glass alone (white), painted by their own painters. */
  private empty: UrchiCharacter | null = null;
  private glass: UrchiCharacter | null = null;
  private ctx: CanvasRenderingContext2D;
  private glintCanvas = document.createElement("canvas");
  /** The helmet's canvas as painted: its unit (css px per mesh unit) and pose. */
  private painted = { unit: 0, nx: 0, ny: 0, dpr: 0 };
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

  /** In the middle of suiting up or leaving it home. */
  get busy() {
    return this.state === "suiting" || this.state === "unsuiting";
  }

  /** The peg is on the wall. */
  get pegShown() {
    return this.shown;
  }

  // ---------------------------------------------------------------- the peg

  /** The panel's size and place on screen. */
  private panelRect() {
    return this.o.panel.getBoundingClientRect();
  }

  /** The ring's centre in client px (`dx` to its right). */
  ringAt(dx = 0): Point {
    const r = this.panelRect();
    return { x: r.left + PEG.left + dx, y: r.top + PEG.down * r.height };
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

  /** The button and the helmet laid out for the panel's size. */
  layout() {
    const r = this.panelRect(), btn = this.o.peg;
    const y = PEG.down * r.height;
    Object.assign(btn.style, { left: `${PEG.left - 22}px`, top: `${y - PEG.ring - 3}px` });
    if (this.shown) this.place();
  }

  /** Paints the peg's helmet (the model first, the first time), then shows the peg: faded in, or `now`. */
  show(now = false) {
    if (this.shown || this.disposed) return;
    this.shown = true;
    preloadSuit().then(
      () => {
        if (this.disposed) return;
        this.makePainters();
        if (this.state === "home") this.paint(this.onPeg().unit, 0, 0);
        this.place();
        // faded in (at once on a return, as the room itself fades in); the helmet settling onto its peg
        gsap.fromTo(this.o.wall, { autoAlpha: 0 }, { autoAlpha: 1, duration: now ? 0.6 : this.reduced ? 0.6 : 0.9, ease: "power2.out" });
        if (!now && !this.reduced && this.state === "home") {
          this.flight.lift = 1;
          gsap.to(this.flight, { lift: 0, duration: 1.1, ease: "power3.out" });
        }
        this.att.add({ id: "peg", kind: "interest", weight: 0.25, at: () => (this.state === "home" ? this.helmetAt() : this.ringAt()) });
      },
      () => {
        this.shown = false; // no model, no peg: it may be tried again
      },
    );
  }

  /**
   * Out of the way while the game is up, as the motes are (the room is cleared for the board), and
   * back after: the peg and, suited, its tether with it, so no line runs to a peg that is not there.
   */
  away(on: boolean) {
    this.o.peg.inert = on;
    if (this.state === "suited") this.tether.dim(on);
    if (!this.shown) return;
    gsap.to(this.o.wall, { autoAlpha: on ? 0 : 1, duration: on ? 0.3 : 0.5, ease: "power2.out", overwrite: true });
  }

  /** A glint on the helmet's glass, as Urchi looks at it. */
  glint() {
    if (this.disposed || this.state !== "home" || this.flight.glint >= 0 || !this.empty) return;
    gsap.fromTo(this.flight, { glint: 0 }, { glint: 1, duration: GLINT.seconds, ease: "none", onComplete: () => { this.flight.glint = -1; } });
  }

  // ---------------------------------------------------------------- the helmet's painters

  private makePainters() {
    if (this.empty) return;
    this.empty = createUrchi({ smooth: true, input: false }, { suitPart: "helmet", suitEmpty: true });
    this.glass = createUrchi({ smooth: true, input: false }, { suitPart: "helmet", suitLayer: "glass" });
    for (const ch of [this.empty, this.glass]) ch.setSuit(1);
  }

  /** Both painters at `unit` css px per mesh unit (at this screen's pixels), turned to a look (nx, ny) as the head would be. */
  private paint(unit: number, nx: number, ny: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), p = this.painted;
    if (!this.empty || !this.glass || (p.unit === unit && p.nx === nx && p.ny === ny && p.dpr === dpr)) return;
    Object.assign(p, { unit, nx, ny, dpr });
    for (const ch of [this.empty, this.glass]) {
      ch.setResolution(1080 * unit * dpr);
      ch.lookAt(nx, ny, "snap");
      ch.update(0.001);
    }
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

  /** What the helmet's canvas shows now, as a key: it is only drawn again when that changes. */
  private drawn = "";

  /** The helmet into its canvas: the empty helmet, and the glint on its glass. */
  private draw() {
    const { glint } = this.flight, key = glint.toFixed(3);
    if (!this.empty || !this.glass || key === this.drawn) return;
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
    if (glint >= 0 && glint <= 1) {
      // a band of light across the glass, upper left to lower right, only where the glass is
      const s = this.glintCanvas.getContext("2d")!, W = c.width, H = c.height;
      s.globalCompositeOperation = "source-over";
      s.clearRect(0, 0, W, H);
      const at = -GLINT.width + glint * (1 + 2 * GLINT.width), a = GLINT.alpha * Math.sin(Math.PI * glint);
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

  /** Pressed: suits up, leaves it home, or (asleep at his night) it half wakes and glances away. */
  press() {
    if (this.busy || !this.shown || this.disposed) return;
    if (this.state === "suited") return this.goHome();
    if (this.att.mood === "asleep") {
      this.att.play("decline", 6, () => decline(this.att, this.helmetAt()), { sleeping: true });
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

  private suitUp() {
    this.state = "suiting";
    setAlong(true);
    this.o.onChange?.(true);
    this.att.setAlong(true);
    this.sealed = false;
    const room = this.room, f = this.flight;
    const act = () =>
      suitUp(this.att, {
        peg: () => this.helmetAt(),
        helmet: () => (f.p > 0 ? this.helmetAt() : null),
        landing: () => f.p > 0.8,
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
    const nx = 0, ny = this.faceLook();
    tl.call(() => room.frameSuited(true, UP.frameFor), [], UP.frame);
    tl.to(this.amount, { v: BODY, duration: UP.bodyFor, ease: "sine.inOut", onUpdate: () => room.urchi.setSuit(this.amount.v) }, UP.body);
    // off the peg, at the size it will land at (painted once, turned as the head will be)
    tl.call(() => this.paint(room.unitAt(true), nx, ny), [], UP.lift - 0.01);
    tl.to(f, { lift: 1, duration: UP.liftFor, ease: "power2.out" }, UP.lift);
    tl.to(f, { p: 1, duration: UP.flyFor, ease: "power2.inOut" }, UP.fly);
    const land = UP.fly + UP.flyFor;
    tl.to(this.amount, { v: 1, duration: UP.sealFor, ease: "power1.out", onUpdate: () => room.urchi.setSuit(this.amount.v) }, land + UP.rise);
    tl.call(() => { this.sealed = true; sfx.seal(true); }, [], land + UP.seal);
    tl.to(f, { alpha: 0, duration: UP.fade, ease: "power1.inOut" }, land + UP.fadeAt);
    tl.call(() => this.tether.draw(UP.tetherFor), [], UP.tether);
    tl.call(() => room.floatUrchi(true), [], UP.float);
    tl.to({}, { duration: 0.01 }, UP.done);
  }

  private goHome() {
    this.state = "unsuiting";
    setAlong(false);
    this.o.onChange?.(false);
    this.att.setAlong(false);
    const room = this.room, f = this.flight;
    if (this.att.mood === "awake") {
      this.att.play("leaveHome", 7, () => leaveHome(this.att, { peg: () => this.ringAt(), helmet: () => (f.p < 1 && f.p > 0 ? this.helmetAt() : null), done: () => this.state === "home" }), { queue: 2 });
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
        this.paint(this.onPeg().unit, 0, 0);
        room.urchi.fade(1, FADE);
        gsap.to(f, { alpha: 1, duration: FADE * 2, ease: "power2.out" });
      }, [], FADE);
      tl.to({}, { duration: FADE }, FADE);
      return;
    }
    this.tether.reel(HOME.reel);
    // the flying helmet over the painted one, where it is, turned as the head is when it looks out
    tl.call(() => {
      this.paint(room.headOnScreen().unit, 0, this.faceLook());
      f.p = 1; f.lift = 1;
    }, [], HOME.cover - 0.01);
    tl.fromTo(f, { alpha: 0 }, { alpha: 1, duration: HOME.coverFor, ease: "power1.inOut" }, HOME.cover);
    tl.call(() => sfx.seal(false), [], HOME.unseal);
    tl.to(this.amount, { v: BODY, duration: HOME.unsealFor, ease: "power1.in", onUpdate: () => room.urchi.setSuit(this.amount.v) }, HOME.unseal);
    tl.to(f, { p: 0, duration: HOME.flyFor, ease: "power2.inOut" }, HOME.fly);
    tl.to(f, { lift: 0, duration: 0.25, ease: "power2.inOut" }, HOME.fly + HOME.flyFor - 0.1);
    tl.call(() => this.paint(this.onPeg().unit, 0, 0), [], HOME.fly + HOME.flyFor + 0.16);
    tl.to(this.amount, { v: 0, duration: HOME.bodyFor, ease: "sine.inOut", onUpdate: () => room.urchi.setSuit(this.amount.v) }, HOME.body);
    tl.call(() => room.frameSuited(false, HOME.frameFor), [], HOME.frame);
    tl.to({}, { duration: 0.01 }, HOME.done);
  }

  /** The look (the pointer's space, y) that faces you from the suited head once it has stepped back: what the flying helmet is turned to. */
  private faceLook() {
    const r = this.room.canvas.getBoundingClientRect(), e = this.room.eyesAt(true);
    return Math.max(-1, Math.min(1, ((r.top + r.height / 2 - e.y) / innerHeight) * 2 - 1));
  }

  private settled(state: State) {
    this.tl = null;
    this.state = state;
    if (state === "home") {
      this.room.urchi.setSuit(0);
      this.flight.alpha = 1;
    }
  }

  dispose() {
    this.disposed = true;
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
