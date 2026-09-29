import * as THREE from "three";
import gsap from "gsap";
import { makeRenderer } from "@/engine/common/loader";
import { URCHI_BOX, URCHI_EARS, URCHI_EYES, URCHI_HEAD, URCHI_PIVOT } from "@/engine/urchi/character";
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
 * (the caption under it) leaves it that much room.
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
/**
 * The suited figure (the spacesuit), in mesh units from the head's centre (y down), rim included,
 * as the painter draws it facing you: the helmet's crown, the soles, and half its width, the
 * helmet's side discs (measured on the painted figure).
 */
export const URCHI_FIGURE = { top: -362, bottom: 1491, half: 566 } as const;
/** The figure's middle, mesh units below the head's centre: where it turns, and what the float moves. */
export const FIGURE_MIDDLE = (URCHI_FIGURE.top + URCHI_FIGURE.bottom) / 2;
/**
 * Taken with you, it floats at `share` of the size the whole suited figure stood at in the room
 * when it suited up there (`phoneShare` on a phone, 640px wide or less; wave 4's framing, kept here
 * only to size it): the figure `tall` of the
 * height, and with a turn's reach (`turnRise` above the crown, `turnDrop` below the soles) inside
 * the room between the tab bar's `top` px and the caption's band (`caption`, 64px, or `phoneCaption`
 * on a phone) less `feet`; its eyes no more than `rise` of the height above the bare head's, never
 * smaller than the bare head, never bigger than it was drawn, and `wall` px clear of each side. At
 * 1440 x 900 the figure stood 466px tall, so it floats at about 303; at 390 x 844, about 161.
 */
const FLOAT = { share: 0.65, phoneShare: 0.4, tall: 0.56, turnRise: 90, turnDrop: 26, top: 60, feet: 40, caption: 64, phoneCaption: 80, rise: 0.05, wall: 72 };
/** Taken with you: where the figure's middle is (room px, y up) and how far it has turned (radians, anticlockwise). */
export type FloatPose = { x: number; y: number; angle: number };
/** The dither's cell, CSS px: rounded to whole device pixels, 3 on a 1x screen and about 2.5 on a 2x or 3x one. */
const DITHER_CELL = 2.5;
/**
 * Afloat, the visitor can zoom: Urchi's size against where it floats (1), from `min` (a tenth as
 * big, ten times as far) to `max`, eased toward the level asked for over about `ease` seconds (a
 * time constant, on the logarithm, so in and out go alike). Down to `pixelFrom` it stays smooth;
 * farther, its signal weakens: it is pixelated in square cells of whole device pixels, one device
 * pixel just past `pixelFrom` (hardly to be seen but for its hard edge) and growing a pixel at a
 * time as a power of the distance past it, so that at `min` the figure is `farCells` of them tall.
 * Home it is 1 again.
 */
export const ZOOM = { min: 0.1, max: 2, ease: 0.12, farCells: 7.5, pixelFrom: 0.4 } as const;

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
  /** The night's settle, 0 awake .. 1 on its pillow. Tweened. */
  private settle = { v: 0 };
  /** Leaning in, 0 .. 1. Tweened. */
  private lean = { v: 0 };
  /** Risen in a stretch, 0 .. 1. Tweened. */
  private risen = { v: 0 };
  /** Taken with you: its size against the head's rest (see FLOAT). */
  floatZoom = 1;
  /** Taken with you: where the float has the figure this frame (Float.ts sets it every frame); null at home. */
  float: FloatPose | null = null;
  /** Afloat, the visitor's zoom (see ZOOM): where it is this frame, and the level it eases to. */
  private lens = { v: 1, to: 1 };
  /** The pixelation's cell this frame, device px, 0 for none: afloat and zoomed out (what follows the figure takes it up too). */
  pixelCell = 0;
  private opts: RoomOptions;
  private hooks = new Set<(dt: number) => void>();
  private afterHooks = new Set<(dt: number) => void>();
  private tick: (time: number, dt: number) => void;
  private disposed = false;
  /** Off screen (its tab kept but not shown): no frames at all, so it picks up where it was when shown again. */
  paused = false;

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
    this.tick = (_t, dtMs) => {
      if (!this.paused) this.frame(Math.min(dtMs, 64) / 1000);
    };
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
    this.urchi.uniforms.uCell.value = Math.max(1, Math.round(DITHER_CELL * this.ratio));
    this.fitFloat(w, h);
  }

  /** The float's size for this viewport: FLOAT.share of the suited figure as it stood in the room (see FLOAT). */
  private fitFloat(w: number, h: number) {
    const unit = this.pixel / ART_CELL; // css px per mesh unit at rest
    const tall = URCHI_FIGURE.bottom - URCHI_FIGURE.top, turned = tall + FLOAT.turnRise + FLOAT.turnDrop;
    const caption = w > SIZE.narrow ? FLOAT.caption : FLOAT.phoneCaption;
    const room = Math.max(1, h - caption - FLOAT.feet - FLOAT.top);
    let figure = Math.min(FLOAT.tall * h, (room * tall) / turned);
    // its eyes no more than FLOAT.rise of the height above the bare head's (soles on their line), unless that drew it smaller than the head
    const eyesWere = this.home - EYES_Y * unit;
    const most = (FLOAT.rise * h + eyesWere + h / 2 - caption - FLOAT.feet) / (URCHI_FIGURE.bottom + FLOAT.turnDrop - EYES_Y);
    figure = Math.min(figure, Math.max(most * tall, HEAD_ART * this.pixel));
    const stood = Math.min(1, figure / (tall * unit), Math.max(0.1, w / 2 - FLOAT.wall) / (URCHI_FIGURE.half * unit));
    this.floatZoom = (w > SIZE.narrow ? FLOAT.share : FLOAT.phoneShare) * stood;
  }

  /** Runs `fn(dt)` every frame, before Urchi and the render; returns the way to stop it. */
  onFrame(fn: (dt: number) => void) {
    this.hooks.add(fn);
    return () => {
      this.hooks.delete(fn);
    };
  }

  /** Runs `fn(dt)` every frame once Urchi is placed, before the render (what follows the figure); returns the way to stop it. */
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

  /** CSS px per mesh unit as the float draws the figure (leaning in aside), the visitor's zoom included. */
  get floatUnit() {
    return (this.pixel / ART_CELL) * this.floatZoom * this.lens.v;
  }

  /** The size Urchi is shown at against the head's rest: 1 at home, smaller afloat. What distances measured by urchiSize scale by. */
  get shown() {
    return this.float ? this.floatZoom * this.lens.v : 1;
  }

  /** The zoom level asked for (see ZOOM): 1 as it floats. */
  get zoomLevel() {
    return this.lens.to;
  }

  /** Zoom to `level`, held within ZOOM.min .. ZOOM.max; eased there, or there at once under reduced motion. */
  zoomTo(level: number) {
    if (!Number.isFinite(level)) return;
    this.lens.to = clamp(level, ZOOM.min, ZOOM.max);
    if (this.opts.reducedMotion) this.lens.v = this.lens.to;
  }

  /** Back to how it floats, at once (it has come home). */
  resetZoom() {
    this.lens.v = this.lens.to = 1;
  }

  /** The zoom eased a frame's way toward its level: on the logarithm, and there once it is close. */
  private easeZoom(dt: number) {
    const l = this.lens;
    if (l.v === l.to) return;
    const at = Math.log(l.v), to = Math.log(l.to), next = at + (to - at) * (1 - Math.exp(-dt / ZOOM.ease));
    l.v = Math.abs(to - next) < 1e-3 ? l.to : Math.exp(next);
  }

  /**
   * The pixelation's cell for a zoom, whole device px: none down to ZOOM.pixelFrom; past it one
   * device pixel, growing as a power of the distance past it to the cell that has the figure
   * ZOOM.farCells tall at ZOOM.min (see ZOOM).
   */
  private cellFor(zoom: number) {
    if (zoom >= ZOOM.pixelFrom) return 0;
    const device = this.renderer.domElement.width / this.width;
    const tall = (URCHI_FIGURE.bottom - URCHI_FIGURE.top) * (this.pixel / ART_CELL) * this.floatZoom * device;
    const far = Math.max(1, (tall * ZOOM.min) / ZOOM.farCells);
    const grow = Math.log(far) / Math.log(ZOOM.pixelFrom / ZOOM.min);
    return Math.max(1, Math.round((ZOOM.pixelFrom / zoom) ** grow));
  }

  /**
   * A room point snapped onto the pixelation's grid of `cell` device px: the grid gl_FragCoord cuts
   * the drawing buffer into, from its bottom left corner (so the dither's grid too).
   */
  private onGrid(x: number, y: number, cell: number) {
    const c = this.renderer.domElement, sx = c.width / this.width, sy = c.height / this.height;
    return {
      x: (Math.round(((x + this.width / 2) * sx) / cell) * cell) / sx - this.width / 2,
      y: (Math.round(((y + this.height / 2) * sy) / cell) * cell) / sy - this.height / 2,
    };
  }

  /** The head at home, awake and facing out: its centre in room px and its box (the head's width and height), what its control covers. */
  get homeBox() {
    return { x: 0, y: this.home, w: this.urchiSize.w, h: this.urchiSize.h };
  }

  /**
   * Where the eyes are now, in room px: the midpoint between them and how far from it they reach,
   * wherever the head sits and at whatever size (the night's settle, leaning in), or afloat, wherever
   * the float has the figure and however it has turned. The intro closes its ring around this before
   * the head is drawn, and attention looks out from it.
   */
  eyes() {
    const c = URCHI_EYES.centres;
    const mx = c.reduce((s, p) => s + p[0], 0) / (c.length || 1);
    const my = c.reduce((s, p) => s + p[1], 0) / (c.length || 1);
    const reach = Math.max(0, ...c.map(([x, y]) => Math.hypot(x - mx, y - my))) + URCHI_EYES.reach;
    if (this.float) {
      const unit = this.floatUnit * (1 + LEAN.closer * this.lean.v);
      return { ...this.floatPoint(this.float, mx, my, unit), reach: reach * unit };
    }
    const { y, zoom } = this.pose();
    const unit = (this.pixel * this.urchi.appear * zoom) / ART_CELL;
    return { x: mx * unit, y: y - my * unit, reach: reach * unit };
  }

  /**
   * The ear tips at home, in room px (y up): the viewer's left, then right, the head tipped `roll`
   * degrees (positive its top to the right) about its neck, as the painter tips it. Null afloat.
   */
  earTips(roll = 0): [{ x: number; y: number }, { x: number; y: number }] | null {
    if (this.float) return null;
    const { y, zoom } = this.pose(), unit = (this.pixel * this.urchi.appear * zoom) / ART_CELL;
    const px = URCHI_PIVOT[0] * unit, py = y - URCHI_PIVOT[1] * unit, a = (-roll * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const at = ([ex, ey]: [number, number]) => {
      const dx = ex * unit - px, dy = y - ey * unit - py;
      return { x: px + dx * c - dy * s, y: py + dx * s + dy * c };
    };
    return [at(URCHI_EARS[0]), at(URCHI_EARS[1])];
  }

  /** A point of the figure (mesh units from the head's centre, y down) where a float pose puts it, `unit` css px per mesh unit: room px. */
  private floatPoint(p: FloatPose, mx: number, my: number, unit: number) {
    const c = Math.cos(p.angle), s = Math.sin(p.angle), x = mx * unit, y = (FIGURE_MIDDLE - my) * unit;
    return { x: p.x + x * c - y * s, y: p.y + x * s + y * c };
  }

  /** A point of the figure (mesh units from the head's centre, y down, as painted facing you) where it is drawn this frame, in room px. */
  onFigure(mx: number, my: number) {
    const m = this.urchi.mesh, u = this.urchi.shownUnit, c = Math.cos(m.rotation.z), s = Math.sin(m.rotation.z);
    const x = mx * u, y = -my * u;
    return { x: m.position.x + x * c - y * s, y: m.position.y + x * s + y * c };
  }

  /** Whether a room point (px, y up) falls within the floating figure's box, `margin` px round it; never at home. */
  nearUrchi(x: number, y: number, margin: number) {
    const p = this.float;
    if (!p) return false;
    const u = this.floatUnit, c = Math.cos(p.angle), s = Math.sin(p.angle), dx = x - p.x, dy = y - p.y;
    const bx = dx * c + dy * s, by = -dx * s + dy * c;
    return Math.abs(bx) < URCHI_FIGURE.half * u + margin && Math.abs(by) < ((URCHI_FIGURE.bottom - URCHI_FIGURE.top) / 2) * u + margin;
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

  /** Whether a client point is on Urchi: its drawn pixels, rim included (not while it is dithered away). */
  urchiHit(clientX: number, clientY: number): boolean {
    if (!this.interactive) return false;
    const u = this.urchi.uniforms;
    if (this.urchi.appear < 0.5 || u.uFade.value < 0.5 || u.uDither.value >= 0.5) return false;
    const p = this.toRoom(clientX, clientY);
    return this.urchi.hit(p.x, p.y);
  }

  /** The head's centre above the room's centre, and its size against rest: home (settled, at night), leaning in or not, risen or not. */
  private pose() {
    const s = this.settle.v;
    const rest = this.home - this.sink * s;
    const zoom = (1 - SETTLE.smaller * s) * (1 + LEAN.closer * this.lean.v);
    // risen, and taller about the head's centre: lifted by half of that too, so the chin stays put
    const risen = (RISE.share + RISE.long / 2) * this.pixel * HEAD_ART * zoom * this.risen.v;
    return { y: rest + risen, zoom };
  }

  /**
   * The head's centre where it sits, with the canvas's top-left corner on a whole device pixel,
   * so its edges land the same way on the screen's pixels from frame to frame.
   */
  private placeUrchi(y: number) {
    const size = this.pixel * this.urchi.appear * this.urchi.zoom;
    // the canvas's edges from the head's centre, in art pixels
    const f = this.urchi.character.frame, halfW = -f.x / ART_CELL, frameTop = -f.y / ART_CELL;
    const snap = (v: number) => Math.round(v * this.ratio) / this.ratio;
    const left = snap(this.width / 2 - halfW * size);
    const top = snap(this.height / 2 - y - frameTop * size);
    this.urchi.mesh.position.set(left + halfW * size - this.width / 2, this.height / 2 - top - frameTop * size, 0);
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    // (the zoom first: the float's physics this frame goes by the size it is drawn at)
    this.easeZoom(dt);
    this.hooks.forEach((fn) => fn(dt));
    const m = this.urchi.mesh;
    if (this.float) {
      // afloat: its middle where the float has it and the whole figure turned about it (the plane
      // turns; nothing is painted again for that), leaning in as at home, zoomed as the visitor has
      // it; not snapped to pixels unless it is pixelated, and then onto the pixelation's grid
      const p = this.float, cell = this.cellFor(this.lens.v);
      this.pixelCell = this.urchi.pixelCell = cell;
      this.urchi.zoom = this.floatZoom * this.lens.v * (1 + LEAN.closer * this.lean.v);
      this.urchi.update(dt);
      const u = this.urchi.shownUnit, c = FIGURE_MIDDLE * u, cos = Math.cos(p.angle), sin = Math.sin(p.angle);
      let mx = p.x, my = p.y;
      if (cell) {
        // its middle moved so the canvas's top left corner would be on the grid were it upright: each
        // of its pixels then covers a cell upright, and a turn (about the middle) never jumps it a cell
        const f = this.urchi.cover, vx = f.x * u, vy = c - f.y * u, g = this.onGrid(mx + vx, my + vy, cell);
        mx = g.x - vx;
        my = g.y - vy;
      }
      m.position.set(mx - sin * c, my + cos * c, 0);
      m.rotation.z = p.angle;
    } else {
      // home: never pixelated
      this.pixelCell = this.urchi.pixelCell = 0;
      const { y, zoom } = this.pose();
      this.urchi.zoom = zoom;
      this.urchi.update(dt);
      const v = this.risen.v;
      if (v > 0) {
        m.scale.y *= 1 + RISE.long * v;
        m.scale.x *= 1 - RISE.narrow * v;
      }
      this.placeUrchi(y);
      m.rotation.z = 0;
    }
    this.afterHooks.forEach((fn) => fn(dt));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.killTweensOf(this.settle);
    gsap.killTweensOf(this.lean);
    gsap.killTweensOf(this.risen);
    gsap.killTweensOf(this.urchi);
    this.hooks.clear();
    this.afterHooks.clear();
    this.urchi.dispose();
    this.renderer.dispose();
  }
}
