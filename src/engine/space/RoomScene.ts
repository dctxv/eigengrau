import * as THREE from "three";
import gsap from "gsap";
import { makeRenderer } from "@/engine/common/loader";
import { URCHI_BOX, URCHI_EYES, URCHI_FRAME, URCHI_HEAD } from "@/engine/urchi/character";
import { Urchi } from "@/engine/urchi/Urchi";

export type RoomOptions = {
  reducedMotion?: boolean;
};

/** Mesh units per art pixel: the character's default cell, the one the room paints with. */
const ART_CELL = 7.5;
/** Urchi's box and head in art pixels: 144 across, about 116 from ear tips to chin. */
const BOX_ART = URCHI_BOX.w / ART_CELL;
const HEAD_ART = (URCHI_HEAD.bottom - URCHI_HEAD.top) / ART_CELL;
/** The canvas's edges from the head's centre, in art pixels: half its width, and its top (up is +y here). */
const FRAME_HALF_W = URCHI_FRAME.w / 2 / ART_CELL;
const FRAME_TOP = -URCHI_FRAME.y / ART_CELL;
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
const DIM_FADE = 0.15;

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
  private opts: RoomOptions;
  private hooks = new Set<(dt: number) => void>();
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
  }

  /** Runs `fn(dt)` every frame, before Urchi and the render; returns the way to stop it. */
  onFrame(fn: (dt: number) => void) {
    this.hooks.add(fn);
    return () => {
      this.hooks.delete(fn);
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

  /** On a short viewport Urchi dims instead of rising. */
  dimUrchi(on: boolean) {
    this.urchi.fade(on ? DIM_FADE : 1, 0.6, on ? 0 : 0.2);
  }

  /** Whether a client point is on Urchi: its drawn pixels, rim included. */
  urchiHit(clientX: number, clientY: number): boolean {
    if (!this.interactive) return false;
    if (this.urchi.appear < 0.5 || this.urchi.uniforms.uFade.value < 0.5) return false;
    const p = this.toRoom(clientX, clientY);
    return this.urchi.hit(p.x, p.y);
  }

  /** The head's centre above the room's centre, and its size against rest: home (settled, at night) blended into the stack. */
  private pose() {
    const s = this.settle.v, k = this.stack.k;
    const rest = this.home - this.sink * s;
    return { y: rest + (this.stack.y - rest) * k, zoom: this.stack.zoom * (1 - SETTLE.smaller * s) };
  }

  /**
   * The head's centre where it sits, with the canvas's top-left corner on a whole device pixel,
   * so its edges land the same way on the screen's pixels from frame to frame.
   */
  private placeUrchi(y: number) {
    const size = this.pixel * this.urchi.appear * this.urchi.zoom;
    const snap = (v: number) => Math.round(v * this.ratio) / this.ratio;
    const left = snap(this.width / 2 - FRAME_HALF_W * size);
    const top = snap(this.height / 2 - y - FRAME_TOP * size);
    this.urchi.mesh.position.set(left + FRAME_HALF_W * size - this.width / 2, this.height / 2 - top - FRAME_TOP * size, 0);
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    this.hooks.forEach((fn) => fn(dt));
    const { y, zoom } = this.pose();
    this.urchi.zoom = zoom;
    this.urchi.update(dt);
    this.placeUrchi(y);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.killTweensOf(this.stack);
    gsap.killTweensOf(this.settle);
    gsap.killTweensOf(this.urchi);
    this.hooks.clear();
    this.urchi.dispose();
    this.renderer.dispose();
  }
}
