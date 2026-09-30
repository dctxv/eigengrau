import * as THREE from "three";
import type { Item } from "./look";

/** Where a sprite is drawn this frame: its middle (room CSS px from the middle, y up), how big across (CSS px), its cell (device px), how much of it is there and how wrong its signal is (0 .. 1, a forgery's). */
export type SpritePose = { x: number; y: number; size: number; cell: number; fade: number; wrong?: number; most?: number };

/** The room it is drawn in: its size in CSS px, and its drawing buffer's device px per CSS px across and up. */
export type SpriteStage = { width: number; height: number; grid: { x: number; y: number } };

/**
 * A lens as the item sheet's: long (22 degrees), so a chunky item is not distorted, a unit sphere
 * just fitting a view 1.15 of its units either way from its middle.
 */
const FOV = 22;
const SPAN = 1.15;

const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * The picture laid over its square, a texel to a cell. A forgery's signal is wrong (`uWrong`, 0 .. 1):
 * now and then a row of its cells slips sideways a cell or two, its colours fall to a few levels,
 * and its red and blue come apart by a cell, as a bad copy of a picture does.
 */
const quadFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uTexel;
uniform float uFade;
uniform float uWrong;
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  if (uWrong > 0.0) {
    float row = floor(uv.y / uTexel.y), beat = floor(uTime * 7.0);
    float slip = step(1.0 - 0.22 * uWrong, hash(vec2(row, beat))) * (hash(vec2(beat, row)) < 0.5 ? -1.0 : 1.0);
    uv.x += slip * uTexel.x * (1.0 + step(0.7, hash(vec2(row + 3.0, beat))));
  }
  vec4 c = texture2D(uMap, uv);
  if (uWrong > 0.0) {
    float r = texture2D(uMap, uv + vec2(uTexel.x, 0.0)).r, b = texture2D(uMap, uv - vec2(uTexel.x, 0.0)).b;
    c.rgb = mix(c.rgb, vec3(r, c.g, b), uWrong);
    vec3 levels = floor(c.rgb * 4.0 + 0.5) / 4.0;
    c.rgb = min(mix(c.rgb, levels, uWrong), vec3(c.a + 0.25 * uWrong));
  }
  gl_FragColor = c * uFade;
}`;

/**
 * An item (engine/items) drawn in the room's scene, among what is drawn there, rather than over the
 * whole page: its own scene seen through the item sheet's lens, drawn into a picture a cell of it to
 * a device pixel square, then laid over a square in the room at its place, on the grid the room's
 * pixelation snaps to (as Urchi's, the stars' and the planets' cells are), so its cells line up with
 * theirs. What its picture covers it covers, and its glows add to what is behind (see look.ts ADD).
 *
 * The host adds `mesh` to the room's scene, poses it, calls `frame` each frame with the item's clock
 * and `draw` before the room renders, and disposes it. It has no item until `setItem`.
 */
export class ItemSprite {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  item: Item | null = null;
  /** Its item's own clock (s). */
  t = 0;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  private readonly target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  private readonly uniforms = { uMap: { value: this.target.texture as THREE.Texture }, uTexel: { value: new THREE.Vector2(1, 1) }, uFade: { value: 0 }, uWrong: { value: 0 }, uTime: { value: 0 } };
  private readonly clear = new THREE.Color();
  private pose: SpritePose = { x: 0, y: 0, size: 0, cell: 1, fade: 0 };
  private at: { x: number; y: number } | null = null;

  constructor() {
    this.camera.position.set(0, 0, SPAN / Math.tan(((FOV / 2) * Math.PI) / 180));
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: quadVertex,
        fragmentShader: quadFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /** Its item (the sprite owns it from now, and disposes it). */
  setItem(item: Item) {
    if (this.item) {
      this.scene.remove(this.item.object);
      this.item.dispose();
    }
    this.item = item;
    // no haze under it on Space (look.ts haze): it reads as a shadow there
    item.object.traverse((o) => {
      if (o.userData.haze) o.visible = false;
    });
    this.scene.add(item.object);
    item.update(0, this.t, true);
  }

  /** Where it is drawn (see SpritePose). */
  place(pose: SpritePose) {
    this.pose = pose;
  }

  get placed(): Readonly<SpritePose> {
    return this.pose;
  }

  /** The cursor over it, room px (null: not there), for an item that answers it (Item.point). */
  point(at: { x: number; y: number } | null) {
    this.at = at;
  }

  /** How big it is drawn: the size it is placed at, times its item's own scale (Item.scale), never more than the pose's `most` of it. */
  private get drawn() {
    return this.pose.size * Math.min(this.item?.scale ?? 1, this.pose.most ?? Infinity);
  }

  /** Whether a room point is on it: within its item's sphere as drawn. */
  hit(x: number, y: number, margin = 0) {
    const p = this.pose;
    return p.fade > 0.2 && Math.hypot(x - p.x, y - p.y) <= (this.drawn / 2) * (1 / SPAN) + margin;
  }

  /** A frame of its item: `dt` seconds on its clock, or held (`still`, under reduced motion). */
  frame(dt: number, still: boolean) {
    const item = this.item;
    if (!item) return;
    if (!still) this.t += dt;
    this.uniforms.uTime.value += dt;
    if (item.point) {
      const p = this.pose, a = this.at, half = this.drawn / 2;
      item.point(a && half > 0 ? { x: ((a.x - p.x) / half) * SPAN, y: ((a.y - p.y) / half) * SPAN } : null);
    }
    item.update(still ? 0 : dt, this.t, still);
  }

  /**
   * Its item drawn into its picture, and its square put where it goes on the room's grid: before the
   * room renders. Nothing is drawn while none of it is there.
   */
  draw(renderer: THREE.WebGLRenderer, stage: SpriteStage) {
    const p = this.pose, m = this.mesh, size = this.drawn;
    m.visible = !!this.item && p.fade > 0.002 && size >= 1;
    if (!m.visible) return;
    const sx = stage.grid.x, sy = stage.grid.y, cell = Math.max(1, Math.round(p.cell));
    const across = Math.max(1, Math.round((size * sx) / cell)), up = Math.max(1, Math.round((size * sy) / cell));
    if (this.target.width !== across || this.target.height !== up) this.target.setSize(across, up);
    this.uniforms.uTexel.value.set(1 / across, 1 / up);
    this.uniforms.uFade.value = Math.min(1, p.fade);
    this.uniforms.uWrong.value = p.wrong ?? 0;
    const was = renderer.getRenderTarget(), alpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clear);
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(was);
    renderer.setClearColor(this.clear, alpha);
    // its bottom left corner on the grid (the drawing buffer's, from its bottom left), a cell a texel
    const w = (across * cell) / sx, h = (up * cell) / sy;
    const left = Math.round(((p.x - w / 2 + stage.width / 2) * sx) / cell) * cell / sx - stage.width / 2;
    const bottom = Math.round(((p.y - h / 2 + stage.height / 2) * sy) / cell) * cell / sy - stage.height / 2;
    m.position.set(left + w / 2, bottom + h / 2, 0);
    m.scale.set(w, h, 1);
  }

  dispose() {
    if (this.item) {
      this.scene.remove(this.item.object);
      this.item.dispose();
      this.item = null;
    }
    this.mesh.removeFromParent();
    this.target.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
