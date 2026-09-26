import * as THREE from "three";
import gsap from "gsap";
import { URCHI_BOX, URCHI_FRAME, URCHI_HEAD, createUrchi, type UrchiCharacter } from "./character";

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Pixel paint: every pixel of the canvas is either head or background, so a hard cut keeps its edge. */
const fragPixel = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5) discard;
  gl_FragColor = vec4(c.rgb, uFade);
}`;

/** Smooth paint: the canvas's own anti-aliased edges, premultiplied so they blend without a dark fringe. */
const fragSmooth = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.004) discard;
  gl_FragColor = c * uFade;
}`;

/** A smooth canvas is resized in steps of this many pixels, so a zoom does not rebuild it every frame. */
const RES_STEP = 16;
const RES_MAX = 2048;

/** Where the head's centre (mesh y 0) sits in the canvas's frame, as a fraction of its height from the middle. */
const CENTRE_UP = -(URCHI_FRAME.y + URCHI_FRAME.h / 2) / URCHI_FRAME.h;

export type UrchiHostOptions = {
  /** Write depth, for a perspective scene whose other objects pass in front of and behind it. */
  depth?: boolean;
  reducedMotion?: boolean;
  /** Mesh units per canvas pixel (see UrchiOptions.cell): coarser for a small Urchi, so its rim stays one pixel. */
  cell?: number;
  /**
   * Paint without pixels (the default): the canvas follows the size the host shows it at, from
   * `width`, `zoom` and `pixelRatio`, so Urchi is drawn at the screen's own resolution with
   * smooth edges. false keeps the standalone page's hard pixels at `cell`.
   */
  smooth?: boolean;
};

/**
 * Urchi in a three.js scene: the character paints its canvas each frame and
 * a plane shows it. Smooth (the default), the canvas is kept at the size it
 * is shown at, in device pixels, and sampled linearly; otherwise it is the
 * standalone page's small canvas with nearest-neighbour sampling and hard
 * pixel edges. The host places `mesh` at the head's centre and sets `width`,
 * the mascot's box width in its own units (and, smooth, `pixelRatio`, device
 * pixels per unit); `appear` scales it in from nothing.
 */
export class Urchi {
  readonly character: UrchiCharacter;
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly uniforms: { uMap: { value: THREE.Texture }; uFade: { value: number } };
  /** The mascot's box width in host units. */
  width = 1;
  /** 0 hidden .. 1 full size. */
  appear = 0;
  /** A size for a moment, on top of `appear`: the game's stack shrinks it to fit above the board. */
  zoom = 1;
  /** Device pixels per host unit, which a smooth Urchi paints its canvas to match. */
  pixelRatio = 1;
  private texture: THREE.CanvasTexture;
  private readonly smooth: boolean;
  /** The box's width in canvas pixels, as last set (smooth only). */
  private resolution = 0;

  constructor(o: UrchiHostOptions = {}) {
    this.smooth = o.smooth !== false;
    this.character = createUrchi({ reducedMotion: o.reducedMotion, cell: o.cell, smooth: this.smooth });
    this.texture = this.makeTexture();
    this.uniforms = { uMap: { value: this.texture }, uFade: { value: 1 } };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: this.smooth ? fragSmooth : fragPixel,
      transparent: true,
      premultipliedAlpha: this.smooth,
      depthWrite: !!o.depth,
      depthTest: !!o.depth,
    });
    // The plane covers the canvas's frame; its origin is the head's centre, where hosts put it.
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, CENTRE_UP, 0), material);
    this.mesh.scale.set(1e-4, 1e-4, 1);
  }

  /** A texture over the character's canvas: raw colour, as every texture on the site; smooth or hard pixels when scaled. */
  private makeTexture() {
    const tex = new THREE.CanvasTexture(this.character.canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.magFilter = this.smooth ? THREE.LinearFilter : THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.premultiplyAlpha = this.smooth;
    return tex;
  }

  /** A smooth canvas follows the size it is shown at: a new size resizes it, and the texture is rebuilt to match. */
  private fitResolution() {
    const px = Math.min(RES_MAX, Math.max(RES_STEP, Math.ceil((this.width * this.zoom * this.pixelRatio) / RES_STEP) * RES_STEP));
    if (px === this.resolution) return;
    this.resolution = px;
    this.character.setResolution(px);
    const old = this.texture;
    this.texture = this.makeTexture();
    if (this.uniforms) this.uniforms.uMap.value = this.texture;
    old.dispose();
  }

  /** Host units per mesh unit. */
  private get unit() {
    return this.width / URCHI_BOX.w;
  }

  /** The head's visible height, ear tips to chin, in host units. */
  get headHeight() {
    return (URCHI_HEAD.bottom - URCHI_HEAD.top) * this.unit;
  }

  /** Called from the host's frame, dt in seconds. */
  update(dt: number) {
    if (this.smooth) this.fitResolution();
    this.character.update(dt);
    this.texture.needsUpdate = true;
    const s = Math.max(this.appear * this.zoom, 1e-4);
    this.mesh.scale.set(URCHI_FRAME.w * this.unit * s, URCHI_FRAME.h * this.unit * s, 1);
  }

  /** Whether a point in the mesh's parent space falls on the head or its rim. */
  hit(x: number, y: number) {
    const w = this.mesh.scale.x, h = this.mesh.scale.y;
    if (w < 1e-3 || h < 1e-3) return false;
    const u = (x - this.mesh.position.x) / w + 0.5;
    const v = (y - this.mesh.position.y) / h - CENTRE_UP + 0.5;
    return this.character.alphaAt(u, v);
  }

  /** Scale in from nothing. */
  scaleIn(duration: number, delay = 0) {
    gsap.killTweensOf(this);
    this.appear = 0.001;
    gsap.to(this, { appear: 1, duration, ease: "power3.out", delay });
  }

  /** Already full size; fade in with the room. */
  fadeIn(duration: number) {
    gsap.killTweensOf(this);
    this.appear = 1;
    this.fade(1, duration, 0, 0);
  }

  /** Tween the fade (the dim), from `from` when given. */
  fade(value: number, duration: number, delay = 0, from?: number) {
    const u = this.uniforms.uFade;
    if (from !== undefined) u.value = from;
    gsap.to(u, { value, duration, ease: "power2.out", delay, overwrite: true });
  }

  closeEyes() {
    this.character.closeEyes();
  }

  openEyes(seconds: number) {
    this.character.openEyes(seconds);
  }

  /** Threshold's yes. */
  slowBlink() {
    this.character.slowBlink();
  }

  /** Threshold's no. */
  glance() {
    this.character.glance();
  }

  dispose() {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.uniforms.uFade);
    this.character.dispose();
    this.texture.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
