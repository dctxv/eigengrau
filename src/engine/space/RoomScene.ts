import * as THREE from "three";
import gsap from "gsap";
import { makeRenderer } from "@/engine/common/loader";
import type { Attention } from "@/engine/urchi/attention";
import { URCHI_BOX, URCHI_EYES, URCHI_HEAD, urchiLeft, type UrchiCharacter } from "@/engine/urchi/character";
import { Urchi } from "@/engine/urchi/Urchi";

export type RoomOptions = {
  reducedMotion?: boolean;
};

/** Mesh units per art pixel: the character's default cell, the one the room paints with. */
const ART_CELL = 7.5;
/** Urchi's box and head in art pixels: 144 across, about 116 from ear tips to chin. */
const BOX_ART = URCHI_BOX.w / ART_CELL;
const HEAD_ART = (URCHI_HEAD.bottom - URCHI_HEAD.top) / ART_CELL;
/** The eyes' midpoint below the head's centre, and the chin below the eyes, as shares of the head's height. */
const EYES_Y = URCHI_EYES.centres.reduce((s, p) => s + p[1], 0) / (URCHI_EYES.centres.length || 1);
const EYES_DOWN = EYES_Y / (URCHI_HEAD.bottom - URCHI_HEAD.top);
const CHIN_UNDER_EYES = (URCHI_HEAD.bottom - EYES_Y) / (URCHI_HEAD.bottom - URCHI_HEAD.top);
/** The chin below the head's centre, as a share of its height. */
const CHIN_DOWN = URCHI_HEAD.bottom / (URCHI_HEAD.bottom - URCHI_HEAD.top);
/**
 * Urchi's size on a narrow screen (spec S0, and all of it at 640px wide or less): the largest step,
 * up to 3 px per art pixel, whose head fits in 45% of the viewport's height and whose box fits in
 * 80% of its width, never below 1. The room renders at up to 3 device pixels per CSS pixel, so a
 * phone's canvas is not stretched to fit.
 */
const PIXEL = { max: 3, head: 0.45, box: 0.8, maxRatio: 3 };
/**
 * Wider than `narrow`, the head grows with the window instead of stopping at the pixel era's steps:
 * 48% of the height, never over 45% of the width or 600px, and never smaller than its step would
 * have made it. The box is its 1.239 times, as ever.
 */
const SIZE = { narrow: 640, height: 0.48, width: 0.45, max: 600 };
/**
 * How far a head turned to look into a corner reaches past its outline at rest, as shares of its
 * height (measured on the drawn silhouette, rim and roll included): the ear tips rise up to `rise`
 * above where they rest, and the chin drops up to `drop` below. Whatever sits at the head's limits
 * (the caption under it here, the tab bar over the game's stack) leaves it that much room.
 */
export const URCHI_TURN = { rise: 0.15, drop: 0.11 } as const;
/**
 * Where it sits when the head grows: placed by its eyes, at 55% of the height, so about two thirds
 * of the screen stays dark around it. The chin keeps `chin` px clear of the caption's band, the
 * bottom `caption` px (globals.css .space-caption: 20px up, a title, 8px, a line), measured to the
 * outline as drawn, which reaches `outline` px past the mesh's chin at rest (the rim, and
 * perspective's slight swell) and URCHI_TURN.drop of the head further when it looks down into a
 * corner. A head that would not clear it shrinks until it does, though never below the smallest
 * step. Only a window under about 560px tall is short enough for that.
 */
const PLACE = { eyes: 0.55, caption: 64, chin: 64, outline: 4 };
/**
 * Asleep at night the head settles `smaller` (a share of its size) and sinks `sink` of the height,
 * like a head on a pillow: over `down` seconds as the lids close, and back up over `up` as it
 * wakes. It never sinks the chin into the caption's band.
 */
const SETTLE = { smaller: 0.04, sink: 0.02, down: 4, up: 1.2 };
/**
 * Leaning in to answer a rhythm (panel 2, N5): the head comes `closer` (a share of its size) over
 * `in` seconds and goes back over `out`, the act tipping the face a few degrees down with it, so
 * it reads as closeness rather than zoom. Under the 6% the panel allows a lean: the blinks are
 * what it has come closer to show.
 */
const LEAN = { closer: 0.04, in: 0.45, out: 0.7 };
/**
 * Caught halfway through a stretch (panel 2, N3): the head risen by `share` of its height, and
 * drawn `long` taller and `narrow` slimmer from the chin up, as a cat's head goes long when it
 * reaches. The character's own stretch rises too, but only on its way up and down again, and this
 * one is held.
 */
const RISE = { share: 0.03, long: 0.05, narrow: 0.02 };
const DIM_FADE = 0.15;
/**
 * The suited figure at rest (panel 2, the spacesuit), in mesh units from the head's centre (y down),
 * rim included, as the painter draws it facing you: the helmet's crown, the soles, and half its
 * width, the helmet's side discs (measured on the painted figure).
 */
export const URCHI_FIGURE = { top: -362, bottom: 1491, half: 566 } as const;
/** How far past that a turn reaches, mesh units: the crown looking up (a caught stretch's the most), the boots as it turns. */
const FIGURE_TURN = { rise: 90, drop: 26 };
/**
 * Suited, it steps back: the whole astronaut `share` of the height, never bigger than the head was
 * drawn (wave 1's size is what it returns to), standing `feet` px clear of the caption's band (the
 * bottom 64px; about 80 on a phone, where the band sits higher), and under the tab bar's `top` px
 * with room for its turn; and `wall` px clear of each side (the peg is on the left one, and its
 * tether wants a length of rope to show). It stands as low as that lets it, so its eyes rise as
 * little as they can, and the room stays mostly dark round it. Standing on its soles, a taller
 * figure lifts its eyes further, so it is also kept to a size that leaves them no more than `rise`
 * of the window's height above where they were (it steps back rather than jumping up), though it
 * is never drawn smaller than the bare head was.
 */
const SUITED = { share: 0.56, feet: 40, top: 60, phoneCaption: 80, wall: 72, rise: 0.05 };
/**
 * Suited and at rest it floats (zero gravity, on its tether): a slow bob of `bob` of its height
 * and a roll of `roll` degrees, on periods that never line up, coming in over `in` seconds. Its
 * pivot is the figure's middle, so the helmet and the boots swing apart.
 */
const DRIFT = { bob: 0.008, roll: 1.4, periods: [7.7, 11.3] as const, in: 2.5, out: 0.8 };
/** Where the tether clips on: the left side of the backpack, half way down it, on screen at rest (mesh units, perspective in; hidden behind the arm and the torso). */
const PACK = { x: -134, y: 616 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * CSS px per art pixel at a step: the step itself on a 1x, 2x or 3x screen; elsewhere (a 1.25x
 * or 1.5x laptop) rounded to whole device pixels, so every art pixel is the same number of them.
 */
export function pixelAt(step: number, ratio: number) {
  return Math.max(1, Math.round(step * ratio)) / ratio;
}

/** The step for a viewport: 3 (a 432px box), 2 (288px) or 1 (144px). */
export function stepFor(width: number, height: number, ratio: number) {
  let k = PIXEL.max;
  while (k > 1 && (pixelAt(k, ratio) * HEAD_ART > PIXEL.head * height || pixelAt(k, ratio) * BOX_ART > PIXEL.box * width)) k--;
  return k;
}

/**
 * Urchi's room, tab 1: Urchi alone in a dark, flat room. The camera is
 * orthographic in CSS pixels (origin at the centre, y up), so Urchi sits on
 * whole screen pixels at a steady size. The intro's ring and anything else
 * that lives in the room add their objects to `scene` and step them with
 * onFrame.
 */
export class RoomScene {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  readonly urchi: Urchi;
  /** Urchi's size step on this viewport: 3, 2 or 1 (see stepFor). The head is at least this big. */
  step = PIXEL.max;
  /** CSS px per art pixel at rest: the step's (see pixelAt) on a narrow screen, anything above it on a wider one. */
  pixel = PIXEL.max;
  /** Device pixels per CSS pixel, as the room renders. */
  ratio = 1;
  /** Hover and click reach Urchi. Off until the intro hands over (or it is simply shown). */
  interactive = false;
  width = 1;
  height = 1;
  /** Where the head's centre rests above the room's centre (CSS px): its eyes at 55% of the height, or the centre on a narrow screen. */
  private home = 0;
  /** How far the settled head sinks (CSS px). */
  private sink = 0;
  /** The game's stack: how far into it (0 home, 1 stacked), the head's centre above the room's centre there, and its size. Tweened. */
  private stack = { k: 0, y: 0, zoom: 1 };
  /** The night's settle, 0 awake .. 1 on its pillow. Tweened. */
  private settle = { v: 0 };
  /** Leaning in, 0 .. 1. Tweened. */
  private lean = { v: 0 };
  /** Risen in a stretch, 0 .. 1. Tweened. */
  private risen = { v: 0 };
  /** Suited framing, 0 (wave 1's head) .. 1 (the whole astronaut): its size against rest there, and its head's centre above the room's centre. Tweened. */
  private suited = { v: 0 };
  private fitZoom = 1;
  private fitY = 0;
  /** The zero-g drift: how much of it (0 .. 1, tweened), its clock, and this frame's bob (px) and roll (radians). */
  private drift = { amp: 0, t: 0, bob: 0, roll: 0 };
  /**
   * The Attention that looks out through this Urchi (the panel's), for the companion to take over
   * with the same character when it leaves Space (see handover).
   */
  attention: Attention | null = null;
  private opts: RoomOptions;
  private hooks = new Set<(dt: number) => void>();
  private afterHooks = new Set<(dt: number) => void>();
  private tick: (time: number, dt: number) => void;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, opts: RoomOptions = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.renderer = makeRenderer(canvas);
    this.camera.position.z = 10;
    // The rim: one art pixel of the head as shown, but between 2 and 3.5 screen px, so a big head is not outlined like a sticker.
    this.urchi = new Urchi({ reducedMotion: opts.reducedMotion, rim: [2, 3.5] });
    this.urchi.mesh.renderOrder = 0;
    this.scene.add(this.urchi.mesh);
    this.resize();
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.tick);
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.width = w;
    this.height = h;
    this.ratio = Math.min(window.devicePixelRatio || 1, PIXEL.maxRatio);
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.setSize(w, h, false);
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    this.step = stepFor(w, h, this.ratio);
    this.pixel = pixelAt(this.step, this.ratio);
    this.home = 0;
    if (w > SIZE.narrow) {
      const grown = Math.max(this.pixel * HEAD_ART, Math.min(SIZE.height * h, SIZE.width * w, SIZE.max));
      // The chin, CHIN_UNDER_EYES heads below eyes at 55% down (and a turn's drop lower), keeps clear of the caption.
      const clear = (h * (1 - PLACE.eyes) - PLACE.caption - PLACE.chin - PLACE.outline) / (CHIN_UNDER_EYES + URCHI_TURN.drop);
      const head = Math.min(grown, Math.max(clear, this.minHead));
      this.pixel = head / HEAD_ART;
      this.home = h / 2 - PLACE.eyes * h + EYES_DOWN * head;
    }
    // Settled, it sinks as far as the chin may go (its size already settled). Asleep it faces
    // ahead, so its outline at rest is all the room it needs.
    const head = this.pixel * HEAD_ART;
    const chin = h / 2 - this.home + (1 - SETTLE.smaller) * CHIN_DOWN * head;
    this.sink = clamp(h - PLACE.caption - PLACE.chin - PLACE.outline - chin, 0, SETTLE.sink * h);
    this.urchi.width = this.pixel * BOX_ART;
    this.urchi.pixelRatio = this.ratio;
    this.fitSuited(w, h);
  }

  /**
   * The suited framing for this viewport (see SUITED): the figure's height, as a size against the
   * head's rest, and where the head's centre goes so the soles stand clear of the caption.
   */
  private fitSuited(w: number, h: number) {
    const unit = (this.pixel * HEAD_ART) / (URCHI_HEAD.bottom - URCHI_HEAD.top); // css px per mesh unit at rest
    const tall = URCHI_FIGURE.bottom - URCHI_FIGURE.top, turned = tall + FIGURE_TURN.rise + FIGURE_TURN.drop;
    const caption = w > SIZE.narrow ? PLACE.caption : SUITED.phoneCaption;
    const room = Math.max(1, h - caption - SUITED.feet - SUITED.top);
    // its height at rest, and turned, within the room between the tab bar and the caption
    let figure = Math.min(SUITED.share * h, (room * tall) / turned);
    // and its eyes no more than SUITED.rise of the height above wave 1's (room px, y up), unless
    // that would draw it smaller than the bare head: soles on their line, eyes this far above them
    const eyesWere = this.home - EYES_Y * unit;
    const most = (SUITED.rise * h + eyesWere + h / 2 - caption - SUITED.feet) / (URCHI_FIGURE.bottom + FIGURE_TURN.drop - EYES_Y);
    figure = Math.min(figure, Math.max(most * tall, HEAD_ART * this.pixel));
    this.fitZoom = Math.min(1, figure / (tall * unit), Math.max(0.1, w / 2 - SUITED.wall) / (URCHI_FIGURE.half * unit));
    const u = unit * this.fitZoom;
    // the soles (and a turn's drop) on the line above the caption's band
    this.fitY = -h / 2 + caption + SUITED.feet + (URCHI_FIGURE.bottom + FIGURE_TURN.drop) * u;
  }

  /** Runs `fn(dt)` every frame, before Urchi and the render; returns the way to stop it. */
  onFrame(fn: (dt: number) => void) {
    this.hooks.add(fn);
    return () => {
      this.hooks.delete(fn);
    };
  }

  /** Runs `fn(dt)` every frame once Urchi is placed, before the render (what follows the figure: the tether); returns the way to stop it. */
  afterUrchi(fn: (dt: number) => void) {
    this.afterHooks.add(fn);
    return () => {
      this.afterHooks.delete(fn);
    };
  }

  /** A client point in the room's own coordinates: CSS px from the centre, y up. */
  toRoom(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: r.height / 2 - (clientY - r.top) };
  }

  // ---------------------------------------------------------------- Urchi

  /** Urchi at rest, in CSS px: its box width and the head's height from ear tips to chin. */
  get urchiSize() {
    return { w: this.pixel * BOX_ART, h: this.pixel * HEAD_ART };
  }

  /** The smallest head the room draws, in CSS px: one screen pixel per art pixel, about 116. */
  get minHead() {
    return pixelAt(1, this.ratio) * HEAD_ART;
  }

  /** How far into the suited framing it is: 0 wave 1's head, 1 the whole astronaut (between, stepping back or forward). */
  get suitedness() {
    return this.suited.v;
  }

  /** The size Urchi is shown at against wave 1's rest, by the suited framing alone (1 unsuited): what distances measured by urchiSize scale by. */
  get fit() {
    return 1 + (this.fitZoom - 1) * this.suited.v;
  }

  /**
   * What the game's stack stacks, in CSS px at rest: the head (ear tips to chin) or, suited, the
   * whole figure (crown to soles), how far down it the head's centre is (a share of it), how far a
   * turn lifts its top (a share), the smallest it may be drawn, and what it dims to where not even
   * that fits. Suited, the whole figure may be drawn as small as the bare head's smallest (wave 4
   * shows it smaller still, docked), so it stacks wherever the head would, on a short laptop too;
   * where neither fits it fades right out behind the board, as at the head's 15% its helmet and
   * boots would show round the plate.
   */
  stackShape() {
    const unit = (this.pixel * HEAD_ART) / (URCHI_HEAD.bottom - URCHI_HEAD.top);
    if (this.suited.v < 0.5) return { h: this.urchiSize.h, centre: 0.5, rise: URCHI_TURN.rise, min: this.minHead, dim: DIM_FADE };
    const tall = URCHI_FIGURE.bottom - URCHI_FIGURE.top;
    return { h: tall * unit * this.fitZoom, centre: -URCHI_FIGURE.top / tall, rise: FIGURE_TURN.rise / tall, min: this.minHead, dim: 0 };
  }

  /** Into the suited framing (true) or back to wave 1's head (false), over `seconds` (0 at once). */
  frameSuited(on: boolean, seconds: number, ease = "power2.inOut") {
    gsap.killTweensOf(this.suited);
    if (seconds <= 0) this.suited.v = on ? 1 : 0;
    else gsap.to(this.suited, { v: on ? 1 : 0, duration: seconds, ease });
  }

  /** The zero-g drift in (true) or out (false); never under reduced motion. `now`: at once. */
  floatUrchi(on: boolean, now = false) {
    gsap.killTweensOf(this.drift);
    const amp = on && !this.opts.reducedMotion ? 1 : 0;
    if (now) this.drift.amp = amp;
    else gsap.to(this.drift, { amp, duration: on ? DRIFT.in : DRIFT.out, ease: "sine.inOut" });
  }

  /** CSS px per mesh unit as Urchi is drawn this frame. */
  private get unitNow() {
    return this.urchi.mesh.scale.x / this.urchi.character.frame.w;
  }

  /** A point of the figure (mesh units from the head's centre, y down, as painted facing you) where it is on screen this frame, in room px (y up): the drift's roll and bob included. */
  onFigure(mx: number, my: number) {
    const u = this.unitNow, m = this.urchi.mesh, c = Math.cos(this.drift.roll), s = Math.sin(this.drift.roll);
    const x = mx * u, y = -my * u;
    return { x: m.position.x + x * c - y * s, y: m.position.y + x * s + y * c };
  }

  /** Where the tether clips onto the backpack this frame, in room px. */
  backpack() {
    return this.onFigure(PACK.x, PACK.y);
  }

  /** The head's centre and the mesh units' size on screen this frame, in client px: where a helmet brought to it must land. */
  headOnScreen() {
    const r = this.canvas.getBoundingClientRect(), m = this.urchi.mesh;
    return { x: r.left + r.width / 2 + m.position.x, y: r.top + r.height / 2 - m.position.y, unit: this.unitNow, roll: this.drift.roll };
  }

  /** The suited figure's rect on screen now, in client px (the drift's roll taken in); unsuited, the head's box. */
  figureRect(): DOMRect {
    const r = this.canvas.getBoundingClientRect();
    const suited = this.urchi.character.suit > 0;
    const [x0, x1, y0, y1] = suited ? [-URCHI_FIGURE.half, URCHI_FIGURE.half, URCHI_FIGURE.top, URCHI_FIGURE.bottom] : [URCHI_BOX.x, URCHI_BOX.x + URCHI_BOX.w, URCHI_HEAD.top, URCHI_HEAD.bottom];
    const pts = [this.onFigure(x0, y0), this.onFigure(x1, y0), this.onFigure(x0, y1), this.onFigure(x1, y1)];
    const xs = pts.map((p) => r.left + r.width / 2 + p.x), ys = pts.map((p) => r.top + r.height / 2 - p.y);
    return new DOMRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }

  /**
   * What the companion takes over from the room as the slide starts (the next packet builds it):
   * the figure's rect on screen, the same character and attention (never a second Urchi), and what
   * to bring it back to on tab 1, wave 1's rest: its size (urchiSize) and where its eyes are there.
   */
  handover(): { rect: DOMRect; character: UrchiCharacter; attention: Attention | null; home: { size: { w: number; h: number }; eyes: { x: number; y: number; reach: number } } } {
    return { rect: this.figureRect(), character: this.urchi.character, attention: this.attention, home: { size: this.urchiSize, eyes: this.eyesAt(false) } };
  }

  /** CSS px per mesh unit at rest (awake, not stacked): wave 1's head, or suited. */
  unitAt(suited: boolean) {
    return (this.pixel / ART_CELL) * (suited ? this.fitZoom : 1);
  }

  /** Where the eyes are at rest (awake, not stacked), in room px: at wave 1's size (what a return lands on), or suited. */
  eyesAt(suited: boolean) {
    const unit = this.unitAt(suited);
    const c = URCHI_EYES.centres;
    const mx = c.reduce((s, p) => s + p[0], 0) / (c.length || 1);
    const my = c.reduce((s, p) => s + p[1], 0) / (c.length || 1);
    const reach = Math.max(0, ...c.map(([x, y]) => Math.hypot(x - mx, y - my))) + URCHI_EYES.reach;
    return { x: mx * unit, y: (suited ? this.fitY : this.home) - my * unit, reach: reach * unit };
  }

  /**
   * How far a client rect on the head's left is from the head as drawn at rest (wave 1's size and
   * place, awake, facing out), in CSS px to the outside of its rim, at its widest: 0 or less where
   * they touch. Space's peg keeps its button clear of it (Suit.layout).
   */
  clearOfHead(left: number, top: number, right: number, bottom: number) {
    const c = this.canvas.getBoundingClientRect(), u = this.unitAt(false), R = urchiLeft();
    const cx = c.left + c.width / 2, cy = c.top + c.height / 2 - this.home;
    let near = Infinity;
    for (let i = 0; i < R.left.length; i++) {
      const x = R.left[i];
      if (x === Infinity) continue;
      // the head on this row runs from here rightward
      const px = cx + x * u, py = cy + (R.top + i * R.step) * u;
      near = Math.min(near, Math.hypot(Math.max(0, px - right), Math.max(0, top - py, py - bottom)));
    }
    return near - (this.urchi.rimFor(u) ?? ART_CELL) * u;
  }

  /** Whether a room point (px, y up) falls within the suited figure's box, `margin` px round it; never unsuited. */
  nearFigure(x: number, y: number, margin: number) {
    if (this.urchi.character.suit <= 0) return false;
    const r = this.figureRect(), c = this.canvas.getBoundingClientRect();
    const cx = c.left + c.width / 2 + x, cy = c.top + c.height / 2 - y;
    return cx > r.left - margin && cx < r.right + margin && cy > r.top - margin && cy < r.bottom + margin;
  }

  /**
   * Where the eyes are now, in room px: the midpoint between them and how far from it they reach,
   * wherever the head sits and at whatever size (the stack, the night's settle). The intro closes
   * its ring around this before the head is drawn, and attention looks out from it.
   */
  eyes() {
    const { y, zoom } = this.pose();
    const unit = (this.pixel * this.urchi.appear * zoom) / ART_CELL;
    const c = URCHI_EYES.centres;
    const mx = c.reduce((s, p) => s + p[0], 0) / (c.length || 1);
    const my = c.reduce((s, p) => s + p[1], 0) / (c.length || 1);
    const reach = Math.max(0, ...c.map(([x, y]) => Math.hypot(x - mx, y - my))) + URCHI_EYES.reach;
    return { x: mx * unit, y: y - my * unit, reach: reach * unit };
  }

  /** The intro's start: Urchi full size but unseen, eyes shut, only its eyes to be painted, looking ahead. */
  hideUrchi() {
    this.interactive = false;
    this.urchi.appear = 1;
    this.urchi.uniforms.uFade.value = 0;
    this.urchi.closeEyes();
    this.urchi.character.setReveal(0);
    this.urchi.character.lookAt(0, 0);
  }

  /** No intro: all of it, eyes open, fading in (at once under reduced motion). */
  showUrchi(fadeSeconds: number) {
    this.urchi.character.setReveal(1);
    this.urchi.character.lookAt(null);
    this.urchi.openEyes(0);
    this.urchi.fadeIn(this.opts.reducedMotion ? 0 : fadeSeconds);
    this.interactive = true;
  }

  /**
   * For the game's stack: the head's centre rises to `px` above the room's centre at `zoom` of its
   * size. null takes it home again, full size.
   */
  liftUrchi(px: number | null, duration: number, zoom = 1) {
    if (px !== null) this.stack.y = px;
    gsap.to(this.stack, { k: px === null ? 0 : 1, zoom: px === null ? 1 : zoom, duration, ease: "power3.inOut", overwrite: true });
  }

  /** Asleep for the night it settles onto its pillow; awake, it rises again (`now`: already there, as on arrival). */
  settleUrchi(asleep: boolean, now = false) {
    const duration = now || this.opts.reducedMotion ? 0 : asleep ? SETTLE.down : SETTLE.up;
    gsap.to(this.settle, { v: asleep ? 1 : 0, duration, ease: "sine.inOut", overwrite: true });
  }

  /** Leaning in to answer (true) or back (false); not under reduced motion, where the answer is the lids alone. */
  leanUrchi(on: boolean) {
    if (this.opts.reducedMotion) return;
    gsap.to(this.lean, { v: on ? 1 : 0, duration: on ? LEAN.in : LEAN.out, ease: "sine.inOut", overwrite: true });
  }

  /** Risen in a stretch (true) or back down (false) over `seconds`, 0 at once; not under reduced motion, where the head stays put. */
  riseUrchi(on: boolean, seconds: number) {
    if (this.opts.reducedMotion) return;
    gsap.killTweensOf(this.risen);
    if (seconds <= 0) this.risen.v = on ? 1 : 0; // already there on the next frame drawn
    else gsap.to(this.risen, { v: on ? 1 : 0, duration: seconds, ease: "sine.inOut" });
  }

  /** On a short viewport Urchi dims instead of rising: to `to` (the head's 15%, unless the stack's shape says otherwise). */
  dimUrchi(on: boolean, to = DIM_FADE) {
    this.urchi.fade(on ? to : 1, 0.6, on ? 0 : 0.2);
  }

  /** Whether a client point is on Urchi: its drawn pixels, rim included. */
  urchiHit(clientX: number, clientY: number): boolean {
    if (!this.interactive) return false;
    if (this.urchi.appear < 0.5 || this.urchi.uniforms.uFade.value < 0.5) return false;
    const p = this.toRoom(clientX, clientY);
    return this.urchi.hit(p.x, p.y);
  }

  /** The head's centre above the room's centre, and its size against rest: home (settled, at night) blended into the stack, leaning in or not, risen or not. */
  private pose() {
    const s = this.settle.v, k = this.stack.k, f = this.suited.v;
    // suited, it stands where the whole figure fits (and does not sink on its pillow: its soles are on their line)
    const rest = f > 0 ? this.home + (this.fitY - this.home) * f - this.sink * s * (1 - f) : this.home - this.sink * s;
    const zoom = this.stack.zoom * (1 - SETTLE.smaller * s) * (1 + LEAN.closer * this.lean.v) * (f > 0 ? 1 + (this.fitZoom - 1) * f : 1);
    // risen, and taller about the head's centre: lifted by half of that too, so the chin stays put
    const risen = (RISE.share + RISE.long / 2) * this.pixel * HEAD_ART * zoom * this.risen.v;
    return { y: rest + (this.stack.y - rest) * k + risen, zoom };
  }

  /**
   * The head's centre where it sits, with the canvas's top-left corner on a whole device pixel,
   * so its edges land the same way on the screen's pixels from frame to frame.
   */
  private placeUrchi(y: number) {
    const size = this.pixel * this.urchi.appear * this.urchi.zoom;
    // the canvas's edges from the head's centre, in art pixels (the suit's frame is taller): half its width, and its top
    const f = this.urchi.character.frame, halfW = -f.x / ART_CELL, frameTop = -f.y / ART_CELL;
    const snap = (v: number) => Math.round(v * this.ratio) / this.ratio;
    const left = snap(this.width / 2 - halfW * size);
    const top = snap(this.height / 2 - y - frameTop * size);
    this.urchi.mesh.position.set(left + halfW * size - this.width / 2, this.height / 2 - top - frameTop * size, 0);
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    this.hooks.forEach((fn) => fn(dt));
    const { y, zoom } = this.pose();
    this.urchi.zoom = zoom;
    this.urchi.update(dt);
    const v = this.risen.v;
    if (v > 0) {
      this.urchi.mesh.scale.y *= 1 + RISE.long * v;
      this.urchi.mesh.scale.x *= 1 - RISE.narrow * v;
    }
    const d = this.drift;
    if (d.amp > 0) {
      d.t += dt;
      const tall = (URCHI_FIGURE.bottom - URCHI_FIGURE.top) * this.unitNow;
      d.bob = d.amp * DRIFT.bob * tall * Math.sin((2 * Math.PI * d.t) / DRIFT.periods[0]);
      d.roll = ((d.amp * DRIFT.roll * Math.PI) / 180) * Math.sin((2 * Math.PI * d.t) / DRIFT.periods[1] + 1);
    } else d.bob = d.roll = 0;
    this.placeUrchi(y + d.bob);
    const m = this.urchi.mesh;
    m.rotation.z = d.roll;
    if (d.roll) {
      // about the figure's middle, so the helmet and the boots swing apart
      const c = ((URCHI_FIGURE.top + URCHI_FIGURE.bottom) / 2) * this.unitNow;
      m.position.x += c * Math.sin(d.roll);
      m.position.y += c - c * Math.cos(d.roll);
    }
    this.afterHooks.forEach((fn) => fn(dt));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.killTweensOf(this.stack);
    gsap.killTweensOf(this.settle);
    gsap.killTweensOf(this.lean);
    gsap.killTweensOf(this.risen);
    gsap.killTweensOf(this.suited);
    gsap.killTweensOf(this.drift);
    gsap.killTweensOf(this.urchi);
    this.hooks.clear();
    this.afterHooks.clear();
    this.urchi.dispose();
    this.renderer.dispose();
  }
}
