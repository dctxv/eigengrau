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
/**
 * Urchi's size (spec S0): the largest step, up to 3 px per art pixel, whose head fits in 45% of
 * the viewport's height and whose box fits in 80% of its width, never below 1. The room renders
 * at up to 3 device pixels per CSS pixel, so a phone's canvas is not stretched to fit.
 */
const PIXEL = { max: 3, head: 0.45, box: 0.8, maxRatio: 3 };
const DIM_FADE = 0.15;

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
 * Urchi's room, tab 1: Urchi alone at the centre of a dark, flat room. The
 * camera is orthographic in CSS pixels (origin at the centre, y up), so
 * Urchi's art pixels land on whole screen pixels. The intro's ring and
 * anything else that lives in the room add their objects to `scene` and step
 * them with onFrame.
 */
export class RoomScene {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  readonly urchi: Urchi;
  /** Urchi's size step on this viewport: 3, 2 or 1 (see stepFor). */
  step = PIXEL.max;
  /** CSS px per art pixel at that step (see pixelAt). */
  pixel = PIXEL.max;
  /** Device pixels per CSS pixel, as the room renders. */
  ratio = 1;
  /** Hover and click reach Urchi. Off until the intro hands over (or it is simply shown). */
  interactive = false;
  width = 1;
  height = 1;
  /** How far above the centre Urchi's head sits, in CSS px: the game's stack. Tweened. */
  private lift = 0;
  private opts: RoomOptions;
  private hooks = new Set<(dt: number) => void>();
  private tick: (time: number, dt: number) => void;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, opts: RoomOptions = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.renderer = makeRenderer(canvas);
    this.camera.position.z = 10;
    this.urchi = new Urchi({ reducedMotion: opts.reducedMotion });
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
    this.urchi.width = this.pixel * BOX_ART;
  }

  /** CSS px per art pixel at another step on this screen (the game's stack steps down). */
  pixelAt(step: number) {
    return pixelAt(step, this.ratio);
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
    return { w: this.pixel * BOX_ART, h: this.headAt(this.step) };
  }

  /** The head's height, ear tips to chin, in CSS px at a step. */
  headAt(step: number) {
    return this.pixelAt(step) * HEAD_ART;
  }

  /** The largest step, up to this viewport's, whose head fits in `px` of height; 0 when none does. */
  stepFitting(px: number) {
    for (let k = this.step; k >= 1; k--) if (this.headAt(k) <= px) return k;
    return 0;
  }

  /**
   * Where the eyes sit at rest, in room px: the midpoint between them and how far from it they
   * reach. The intro closes its ring around this before the head is drawn.
   */
  eyes() {
    const unit = this.pixel / ART_CELL;
    const c = URCHI_EYES.centres;
    const mx = c.reduce((s, p) => s + p[0], 0) / (c.length || 1);
    const my = c.reduce((s, p) => s + p[1], 0) / (c.length || 1);
    const reach = Math.max(0, ...c.map(([x, y]) => Math.hypot(x - mx, y - my))) + URCHI_EYES.reach;
    return { x: mx * unit, y: this.lift - my * unit, reach: reach * unit };
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

  /** Urchi rises `px` above the centre (0 brings it back) at `zoom` of its size, for the game's stack. */
  liftUrchi(px: number, duration: number, zoom = 1) {
    gsap.to(this, { lift: px, duration, ease: "power3.inOut", overwrite: true });
    gsap.to(this.urchi, { zoom, duration, ease: "power3.inOut", overwrite: "auto" });
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

  /**
   * The head's centre at the room's centre (or lifted), with the canvas's top-left corner on a
   * whole device pixel, so every art pixel covers the same number of screen pixels.
   */
  private placeUrchi() {
    const size = this.pixel * this.urchi.appear * this.urchi.zoom;
    const snap = (v: number) => Math.round(v * this.ratio) / this.ratio;
    const left = snap(this.width / 2 - FRAME_HALF_W * size);
    const top = snap(this.height / 2 - this.lift - FRAME_TOP * size);
    this.urchi.mesh.position.set(left + FRAME_HALF_W * size - this.width / 2, this.height / 2 - top - FRAME_TOP * size, 0);
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    this.hooks.forEach((fn) => fn(dt));
    this.urchi.update(dt);
    this.placeUrchi();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.urchi);
    this.hooks.clear();
    this.urchi.dispose();
    this.renderer.dispose();
  }
}
