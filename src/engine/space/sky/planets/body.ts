import * as THREE from "three";
import type { PlanetKind, PlanetLooks } from "../Planets";
import type { Resolved } from "../tune";
import type { Bake, Baked, Kind } from "./bake";
import { PLANET_VERT } from "./glsl";
import { OCEAN } from "./ocean";

/** Every kind of planet there is, and what makes it. */
const KINDS: { [K in PlanetKind]: Kind<Resolved<PlanetLooks[K]>> } = { ocean: OCEAN };

/** How a planet is drawn this frame: where (room CSS px from the middle, y up), how big and how it is turned. */
export type Pose = {
  x: number;
  y: number;
  /** Its radius, CSS px. */
  radius: number;
  /** Pixelated: the cell, device px (0 smooth). */
  cell: number;
  /** 0 gone .. 1 there. */
  fade: number;
  /** How far it has turned (radians), its axis's lean in the screen's plane and toward you (radians). */
  spin: number;
  tilt: number;
  tip: number;
};

/** The room it is drawn in: its size in CSS px, and its drawing buffer's device px per CSS px across and up. */
export type Stage = { width: number; height: number; grid: { x: number; y: number } };

/**
 * One planet: its surface baked for its seed, and a square in the room's scene that it is traced
 * on. The host adds `mesh` to the scene, gives it its look, and poses it every frame. Make it with
 * PlanetBody.create, which compiles its shaders without holding up a frame (where the browser can)
 * before it bakes.
 */
export class PlanetBody {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly def: Kind<object>;
  private readonly uniforms: Record<string, THREE.IUniform>;
  private baked: Baked | null = null;
  /** Its look as last given, and what of it its surface was baked from. */
  private current: object;
  private bakedFrom = "";
  private axis = new THREE.Matrix4();
  private m = new THREE.Matrix4();
  private disposed = false;

  private constructor(
    readonly kind: PlanetKind,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly seed: number,
    look: object,
    private readonly width: number,
  ) {
    this.def = KINDS[kind] as Kind<object>;
    this.current = look;
    this.uniforms = {
      uCentre: { value: new THREE.Vector2() },
      uRadius: { value: 1 },
      uPix: { value: 0 },
      uFade: { value: 0 },
      uLight: { value: new THREE.Vector3(0, 0, 1) },
      uBody: { value: new THREE.Matrix3() },
      ...this.def.uniforms(),
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: this.def.fragment,
      uniforms: this.uniforms,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
  }

  /**
   * A planet of `kind` for `seed` in `look` (its kind's part of the sky's planets config, its
   * ranges picked), its shaders compiled (in parallel where the browser can) and its surface baked
   * `width` texels round; `camera` is the one it will be seen through.
   */
  static async create<K extends PlanetKind>(kind: K, renderer: THREE.WebGLRenderer, seed: number, look: Resolved<PlanetLooks[K]>, width: number, camera: THREE.Camera) {
    const body = new PlanetBody(kind, renderer, seed, look, width);
    const bake = body.def.bake(seed, look, width);
    const holder = new THREE.Scene();
    const squares = bake.materials.map((m) => new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
    holder.add(...squares, body.mesh);
    try {
      await renderer.compileAsync(holder, camera);
    } finally {
      holder.remove(body.mesh);
      squares.forEach((q) => q.geometry.dispose());
    }
    if (!body.disposed) body.bakeWith(bake, look);
    bake.dispose();
    return body;
  }

  /** Its surface baked by `bake`, in place of any it had. */
  private bakeWith(bake: Bake, look: object) {
    this.bakedFrom = JSON.stringify(this.def.baked(look));
    this.baked?.dispose();
    this.baked = bake.run(this.renderer);
    for (const [k, t] of Object.entries(this.baked.maps)) (this.uniforms[k] ??= { value: null }).value = t;
  }

  /**
   * Its look (its kind's config, its ranges picked) and the sun (a direction in view space): its
   * uniforms follow, and its surface is baked again if what is baked into it has changed (the
   * debug panel tuning it).
   */
  setLook(look: object, light: { x: number; y: number; z: number }) {
    if (this.disposed) return;
    this.current = look;
    if (JSON.stringify(this.def.baked(look)) !== this.bakedFrom) {
      const bake = this.def.bake(this.seed, look, this.width);
      this.bakeWith(bake, look);
      bake.dispose();
    }
    this.uniforms.uLight.value.set(light.x, light.y, light.z).normalize();
    this.def.look(this.uniforms, look);
  }

  /** How far past its radius its square reaches (a share of it). */
  get reach() {
    return this.def.reach(this.current);
  }

  /** Posed for this frame (see Pose and Stage). Gone (fade 0), it is not drawn at all. */
  pose(p: Pose, s: Stage) {
    if (this.disposed) return;
    const on = p.fade > 0 && p.radius > 0;
    this.mesh.visible = on;
    if (!on) return;
    const u = this.uniforms, sx = s.grid.x, sy = s.grid.y;
    // its middle in the drawing buffer's pixels; pixelated, on a corner of the cells, so its disc
    // cuts the same cells every frame whatever fraction of a cell it has drifted
    let cx = (p.x + s.width / 2) * sx, cy = (p.y + s.height / 2) * sy;
    if (p.cell > 0) {
      cx = Math.round(cx / p.cell) * p.cell;
      cy = Math.round(cy / p.cell) * p.cell;
    }
    u.uCentre.value.set(cx, cy);
    u.uRadius.value = p.radius * sx;
    u.uPix.value = p.cell;
    u.uFade.value = p.fade;
    // its axis: turned `spin` about its own pole, the pole tipped toward you and leant in the screen's plane
    this.axis.makeRotationZ(p.tilt).multiply(this.m.makeRotationX(p.tip)).multiply(this.m.makeRotationY(p.spin));
    u.uBody.value.setFromMatrix4(this.axis).transpose();
    this.def.turn?.(u, p.spin, this.axis, this.current);
    // the square: over the disc and its reach (and a small one's glow, which is never under a few
    // pixels), a cell more when pixelated, where the middle now is
    const half = p.radius * (1 + this.reach) + 6 + (p.cell > 0 ? p.cell / sx : 0);
    this.mesh.position.set(cx / sx - s.width / 2, cy / sy - s.height / 2, 0);
    this.mesh.scale.set(2 * half, 2 * half, 1);
  }

  dispose() {
    this.disposed = true;
    this.baked?.dispose();
    this.baked = null;
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
