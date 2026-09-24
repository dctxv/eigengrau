import * as THREE from "three";
import gsap from "gsap";
import { URCHI_BOX, URCHI_FRAME, URCHI_HEAD, createUrchi, type UrchiCharacter } from "./character";

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Every pixel of the canvas is either head or background, so a hard cut keeps its edge. */
const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5) discard;
  gl_FragColor = vec4(c.rgb, uFade);
}`;

/** Where the head's centre (mesh y 0) sits in the canvas's frame, as a fraction of its height from the middle. */
const CENTRE_UP = -(URCHI_FRAME.y + URCHI_FRAME.h / 2) / URCHI_FRAME.h;

export type UrchiHostOptions = {
  /** Write depth, for a perspective scene whose other objects pass in front of and behind it. */
  depth?: boolean;
  reducedMotion?: boolean;
};

/**
 * Urchi in a three.js scene: the character paints its canvas each frame and
 * a plane shows it with nearest-neighbour sampling, the standalone page's
 * hard pixel edges. The host places `mesh` at the head's centre and sets
 * `width`, the mascot's box width in its own units; `appear` scales it in
 * from nothing.
 */
export class Urchi {
  readonly character: UrchiCharacter;
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly uniforms: { uMap: { value: THREE.Texture }; uFade: { value: number } };
  /** The mascot's box width in host units. */
  width = 1;
  /** 0 hidden .. 1 full size. */
  appear = 0;
  private texture: THREE.CanvasTexture;

  constructor(o: UrchiHostOptions = {}) {
    this.character = createUrchi({ reducedMotion: o.reducedMotion });
    const tex = new THREE.CanvasTexture(this.character.canvas);
    // Raw colour, as every texture on the site, and hard pixels when scaled up.
    tex.colorSpace = THREE.NoColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    this.texture = tex;
    this.uniforms = { uMap: { value: tex }, uFade: { value: 1 } };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: !!o.depth,
      depthTest: !!o.depth,
    });
    // The plane covers the canvas's frame; its origin is the head's centre, where hosts put it.
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, CENTRE_UP, 0), material);
    this.mesh.scale.set(1e-4, 1e-4, 1);
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
    this.character.update(dt);
    this.texture.needsUpdate = true;
    const s = Math.max(this.appear, 1e-4);
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
