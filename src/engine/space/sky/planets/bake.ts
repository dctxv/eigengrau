import * as THREE from "three";
import { BAKE_VERT } from "./glsl";

/**
 * A planet's surface, baked: the textures its shader reads (2:1 equirectangular), and the way to
 * let them go.
 */
export type Baked = { maps: Record<string, THREE.Texture>; dispose(): void };

/**
 * A bake about to happen: its materials (compiled ahead, see PlanetBody.create), then `run`, which
 * bakes on the GPU and leaves the renderer as it found it, and `dispose` once it has.
 */
export type Bake = { materials: THREE.ShaderMaterial[]; run(renderer: THREE.WebGLRenderer): Baked; dispose(): void };

/**
 * What makes each kind of planet: its bake, its shader, and the uniforms its look (its part of
 * the sky's planets config, its ranges picked) gives it.
 */
export type Kind<L extends object> = {
  /** Its surface for a seed and a look, `width` texels round. */
  bake(seed: number, look: L, width: number): Bake;
  /** The part of its look that is baked into its surface: when it changes, the surface is baked again. */
  baked(look: L): unknown;
  /** The fragment shader it is drawn with (its uniforms FRAME's and its own). */
  fragment: string;
  /** Its own uniforms, made once. */
  uniforms(): Record<string, THREE.IUniform>;
  /** Its uniforms from its look (again whenever the look changes). */
  look(u: Record<string, THREE.IUniform>, look: L): void;
  /** Anything that turns apart from the ground (a cloud layer), `spin` being the ground's angle and `axis` its whole turn. */
  turn?(u: Record<string, THREE.IUniform>, spin: number, axis: THREE.Matrix4, look: L): void;
  /** How far its square reaches past its disc, a share of its radius (its rim and glow, or a ring). */
  reach(look: L): number;
};

/**
 * Renders `material` over the whole of a new render target, `width` x `height` texels: a baked map,
 * sampled with mipmaps, wrapping round in u (the equirectangular seam) and clamped in v (the poles).
 * The renderer's own target is put back.
 */
export function bakeMap(renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, width: number, height: number, mipmaps = true) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: false,
    generateMipmaps: mipmaps,
    minFilter: mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    colorSpace: THREE.NoColorSpace,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const was = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(quad, BAKE_CAMERA);
  renderer.setRenderTarget(was);
  quad.geometry.dispose();
  return target;
}
/** Any camera: a bake's vertex shader places its square itself. */
const BAKE_CAMERA = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/** A bake's material: its fragment shader over the whole target, nothing blended. */
export function bakeMaterial(fragment: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({ vertexShader: BAKE_VERT, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
}
