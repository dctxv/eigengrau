import * as THREE from "three";
import { rawColor } from "@/engine/common/color";

/**
 * The look every item shares, so the set reads as one family: chunky faceted shapes, flat-shaded
 * face by face, under one key light from the upper left with a gentle gradient from lit to shade,
 * a thin cool rim light round the edge turned from you so it stands off the dark, and thin light
 * lines along its hard edges, like the rocks in the references. Two or three main colours and one
 * accent; bright and saturated. Colours are as they land on screen (the site writes raw colour).
 *
 * An item is a unit of this: a root the host places and scales (it fits a sphere of radius 1), and
 * each frame's update. No ground shadow (it is space): a bright item has a faint haze beneath it.
 */
export type Item = {
  /** What the host adds to its scene: fits a sphere of radius 1 about its origin, facing +z. */
  object: THREE.Object3D;
  /**
   * A frame: `dt` seconds since the last, `t` its own clock. What it does is a function of `t` where
   * it can be, so a host holding the clock (reduced motion, a still) holds it; `still` says the clock
   * is held, for what moves on its own (a flicker, a glint).
   */
  update(dt: number, t: number, still: boolean): void;
  dispose(): void;
};

/** The key light, in view space: from the upper left, a little in front. */
export const KEY = new THREE.Vector3(-0.55, 0.7, 0.45).normalize();
/** The rim light's colour, the same on every item. */
const RIM = "#c9e6ff";

const vertexShader = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vP = p.xyz;
  vN = normalMatrix * normal;
  gl_Position = projectionMatrix * p;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uRim;
uniform vec3 uKey;
uniform float uRimAmount;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  // a gentle gradient from shade to lit, soft round the terminator
  float t = smoothstep(-0.45, 0.9, dot(n, uKey));
  vec3 c = mix(uShade, uLit, t * t * (3.0 - 2.0 * t));
  // the rim: the faces turned edge-on to you, strongest on the side away from the key
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6) * (0.55 + 0.45 * smoothstep(0.3, -0.6, dot(n, uKey)));
  c += uRim * rim * uRimAmount;
  gl_FragColor = vec4(c, 1.0);
}`;

/** A faceted material: `lit` where the key falls, `shade` turned from it. */
export function facets(lit: string, shade: string, rim = 0.55) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uLit: { value: rawColor(lit) },
      uShade: { value: rawColor(shade) },
      uRim: { value: rawColor(RIM) },
      uKey: { value: KEY },
      uRimAmount: { value: rim },
    },
    // pushed back a hair, so the edge lines over it are never lost in it
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

/** A geometry made faceted: every face its own flat normal. */
export function faceted(g: THREE.BufferGeometry) {
  const f = g.index ? g.toNonIndexed() : g;
  if (f !== g) g.dispose();
  f.computeVertexNormals();
  return f;
}

/**
 * A mesh of a faceted geometry in a material, with thin light lines along its edges sharper than
 * `angle` degrees (the highlights on the facets' edges), at `strength`.
 */
export function part(g: THREE.BufferGeometry, material: THREE.Material, angle = 28, strength = 0.42) {
  const mesh = new THREE.Mesh(faceted(g), material);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, angle),
    new THREE.LineBasicMaterial({ color: rawColor("#ffffff"), transparent: true, opacity: strength, depthWrite: false }),
  );
  mesh.add(edges);
  return mesh;
}

/** A faint haze under a bright item (space has no ground to cast a shadow on), in the host's view: `size` across, `strength` at its middle. */
export function haze(colour: string, size = 1.8, strength = 0.1) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColour: { value: rawColor(colour) }, uStrength: { value: strength } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColour; uniform float uStrength; varying vec2 vUv;
      void main() { vec2 q = (vUv - 0.5) * 2.0; float a = exp(-3.0 * dot(q, q)) * uStrength; gl_FragColor = vec4(uColour * a, a); }`,
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.4), material);
  mesh.renderOrder = -1;
  return mesh;
}

/** Everything under `root` let go: geometries and materials. */
export function release(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((x) => x.dispose());
  });
}

/** `group` scaled and moved so its bounds fit a sphere of radius `r` about the origin. */
export function fit(group: THREE.Object3D, r = 1) {
  const box = new THREE.Box3().setFromObject(group), sphere = box.getBoundingSphere(new THREE.Sphere());
  const k = r / sphere.radius;
  group.scale.multiplyScalar(k);
  group.position.sub(sphere.center.multiplyScalar(k));
}
