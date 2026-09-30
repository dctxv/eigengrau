import * as THREE from "three";
import { rawColor } from "@/engine/common/color";

/**
 * The look every item shares, so the set reads as one family: chunky faceted shapes, flat-shaded
 * face by face, under one key light from the upper left with a gentle gradient from lit to shade,
 * a thin cool rim light round the edge turned from you so it stands off the dark, and thin light
 * lines along its hard edges, like the rocks in the references. Two or three main colours and one
 * accent; bright and saturated. Colours are as they land on screen (the site writes raw colour).
 *
 * Everything is a real 3D model in real 3D space, and uses it: it tumbles or turns through depth,
 * and what moves about moves toward and away from you as much as across (a creature swims all
 * through a ball of space round the item's middle, never round a flat ring), nearer things bigger
 * and in front of farther ones.
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
  /**
   * Where the cursor is, for an item that answers it: in the item's own frame (x right and y up from
   * its middle, in the units it fits a sphere of radius 1 in, whatever size the host shows it at), or
   * null when there is none over it. The host calls it before each update.
   */
  point?(at: { x: number; y: number } | null): void;
  /** Its pixel level (common/pixel.ts): the host draws it pixelated in cells that big. None, level 1 (the new zero: never smoother). */
  pixel?: number;
  /**
   * How much bigger Space draws it than the size it is given (in the sky, in Urchi's hands, in the
   * case): for an item that is mostly empty space round something small (the comet minnows' school
   * in its ball). None, 1. The item sheet shows it as it is.
   */
  scale?: number;
  dispose(): void;
};


/**
 * Light added to what is under it (a glow, so it blooms), leaving it as covered as it was: on screen
 * it is plain additive, and drawn into a picture of the item first (to pixelate it), the picture
 * keeps its glows out of what it covers, so what is behind shows through them as it should.
 */
export const ADD = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;

/** The key light, in view space: from the upper left, a little in front. */
export const KEY = new THREE.Vector3(-0.55, 0.7, 0.45).normalize();
/** The rim light's colour, the same on every item. */
const RIM = "#c9e6ff";

const vertexShader = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec3 vNO;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vP = p.xyz;
  vN = normalMatrix * normal;
  vNO = normal;
  gl_Position = projectionMatrix * p;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uRim;
uniform vec3 uKey;
uniform float uRimAmount;
uniform vec3 uGlowColour;
uniform float uGlowFrom;
uniform float uGlowAmount;
varying vec3 vN;
varying vec3 vP;
varying vec3 vNO;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  // a gentle gradient from shade to lit, soft round the terminator
  float t = smoothstep(-0.45, 0.9, dot(n, uKey));
  vec3 c = mix(uShade, uLit, t * t * (3.0 - 2.0 * t));
  // the rim: the faces turned edge-on to you, strongest on the side away from the key
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6) * (0.55 + 0.45 * smoothstep(0.3, -0.6, dot(n, uKey)));
  c += uRim * rim * uRimAmount;
  // where it glows: the faces turned along its own up and down (its poles), past uGlowFrom
  float g = uGlowFrom > 0.0 ? smoothstep(uGlowFrom, uGlowFrom + 0.15, abs(normalize(vNO).y)) * uGlowAmount : 0.0;
  c = mix(c, uGlowColour, min(g, 1.0)) + uGlowColour * g * 0.4;
  gl_FragColor = vec4(c, 1.0);
}`;

/**
 * A faceted material: `lit` where the key falls, `shade` turned from it. With `glow`, the faces
 * turned along its own up and down (its poles: past `from`, 0 to 1, of the way there) glow in
 * `colour`, at `uniforms.uGlowAmount`.
 */
export function facets(lit: string, shade: string, rim = 0.55, glow?: { colour: string; from: number; amount?: number }) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uLit: { value: rawColor(lit) },
      uShade: { value: rawColor(shade) },
      uRim: { value: rawColor(RIM) },
      uKey: { value: KEY },
      uRimAmount: { value: rim },
      uGlowColour: { value: rawColor(glow?.colour ?? "#ffffff") },
      uGlowFrom: { value: glow?.from ?? 0 },
      uGlowAmount: { value: glow?.amount ?? 1 },
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
  // (marked, so a host that wants none, Space, can leave it out: see sprite.ts)
  mesh.userData.haze = true;
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

/**
 * A small four-point white glint, as crystals and glass catch the light: a billboard in the host's
 * view, `size` across, drawn as light added to what is under it. Set its `strength` (0 .. 1) to
 * make it appear and fade.
 */
export function glint(size = 0.4, colour = "#ffffff") {
  const uniforms = { uColour: { value: rawColor(colour) }, uStrength: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColour; uniform float uStrength; varying vec2 vUv;
      // two thin arms tapering to nothing at the square's edges, and a soft core where they cross
      float arm(float along, float across) { float t = 1.0 - min(abs(along), 1.0); return t * t * t * exp(-across * across / (0.0025 + 0.004 * t)); }
      void main() {
        vec2 q = (vUv - 0.5) * 2.0;
        float a = arm(q.x, q.y) + arm(q.y, q.x) + 0.6 * exp(-dot(q, q) * 40.0);
        a *= uStrength;
        gl_FragColor = vec4(uColour, min(a, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    ...ADD,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.renderOrder = 3;
  // it faces the camera whatever it is fixed to (a corner of a turning shard)
  const q = new THREE.Quaternion();
  mesh.onBeforeRender = (_r, _s, camera) => {
    mesh.parent?.getWorldQuaternion(q);
    mesh.quaternion.copy(q.invert()).multiply(camera.quaternion);
    mesh.updateMatrixWorld();
  };
  return {
    mesh,
    set strength(v: number) {
      uniforms.uStrength.value = v;
    },
  };
}

const glassFragment = /* glsl */ `
uniform vec3 uTint;
uniform vec3 uKey;
uniform float uClear;
uniform vec3 uInnerColour;
uniform float uInner;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  if (!gl_FrontFacing) n = -n;
  float nv = clamp(dot(n, v), 0.0, 1.0);
  // clear face on, whiter the more of a slant a face is seen at
  float fres = 0.5 * pow(1.0 - nv, 4.0);
  // the studio round it, as glass reflects it: a big soft panel up by the key, a thin strip low on
  // the far side, dark between (flat faces, so each face catches all of one or none of it); and a
  // sharp highlight where the key itself is caught
  vec3 r = reflect(-v, n);
  float panel = smoothstep(0.75, 0.92, dot(r, uKey));
  float strip = 0.5 * smoothstep(0.9, 0.97, dot(r, normalize(vec3(0.7, -0.35, 0.6))));
  float spec = pow(max(dot(r, uKey), 0.0), 90.0);
  float shine = clamp(fres + 0.55 * panel + 0.35 * strip + 1.2 * spec, 0.0, 1.0);
  float a = uClear + 0.6 * shine;
  // and lit from inside by what is in it, most where it is seen through at a slant
  vec3 c = mix(uTint, vec3(1.0), shine) * a + uInnerColour * uInner * (0.35 + 0.65 * (1.0 - nv));
  gl_FragColor = vec4(c, a);
}`;

/**
 * Clear glass, faceted: a faint tint of `tint` face on, brighter and whiter toward the faces it is
 * seen at a slant, reflecting a soft studio light (so a face or two flashes bright as it turns) with
 * a sharp highlight where the key light catches a face. One side of it (`side`): a glass thing is
 * drawn back faces first, what is inside it, then its front faces. Light it from inside (a glow in
 * it) with `uniforms.uInner` (0 unlit) in `uniforms.uInnerColour`.
 */
export function glass(tint: string, side: THREE.Side, clear = 0.06, inner = "#ffffff") {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: glassFragment,
    uniforms: { uTint: { value: rawColor(tint) }, uKey: { value: KEY }, uClear: { value: clear }, uInnerColour: { value: rawColor(inner) }, uInner: { value: 0 } },
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    side,
  });
}

const iceVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec3 vO;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vP = p.xyz;
  vN = normalMatrix * normal;
  vO = position;
  gl_Position = projectionMatrix * p;
}`;

const iceFragment = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uKey;
uniform float uBody;
uniform float uFrost;
uniform vec3 uInnerColour;
uniform float uInner;
varying vec3 vN;
varying vec3 vP;
varying vec3 vO;
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1) * 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  bool within = !gl_FrontFacing;
  if (within) n = -n;
  float nv = clamp(dot(n, v), 0.0, 1.0);
  // its own colour, face by face: pale where the key falls, a deep cold blue turned from it
  float t = smoothstep(-0.5, 0.9, dot(n, uKey));
  vec3 c = mix(uShade, uLit, t);
  // frost in patches on its faces (fixed to it, so it turns with it), and whiter toward the faces seen at a slant
  float frost = uFrost * smoothstep(0.45, 0.75, 0.5 * noise(vO * 5.0) + 0.3 * noise(vO * 10.3 + 1.7) + 0.2 * noise(vO * 21.0 + 3.1));
  float fres = pow(1.0 - nv, 3.0);
  // wet: a sharp highlight where the key is caught, and a soft sheen of the light up by it
  vec3 r = reflect(-v, n);
  float spec = pow(max(dot(r, uKey), 0.0), 70.0), sheen = 0.3 * smoothstep(0.7, 0.92, dot(r, uKey));
  float white = clamp(0.8 * frost + 0.5 * fres + sheen + 1.4 * spec, 0.0, 1.0);
  float a = clamp(within ? uBody : uBody + 0.35 * frost + 0.3 * fres + 0.5 * sheen + 0.5 * spec, 0.0, 1.0);
  if (within) white *= 0.3;
  // (frost and a slant whiten it toward a cold pale blue; only the highlight is pure white)
  vec3 pale = mix(vec3(0.84, 0.95, 1.0), vec3(1.0), clamp(1.4 * spec, 0.0, 1.0));
  // and lit through by what is in it, as ice lets light through: all of it glows, most seen at a slant
  gl_FragColor = vec4(mix(c, pale, white) * a + uInnerColour * uInner * (0.5 + 0.5 * (1.0 - nv)), a);
}`;

/**
 * Ice, faceted: cloudy, `lit` where the key falls and `shade` turned from it, frosted in patches
 * (`frost`, 0 none) and whiter toward the faces seen at a slant, wet with a sharp highlight where the
 * key catches it. `body` is how cloudy it is (0 clear). One side of it (`side`): an ice thing is
 * drawn back faces first (its depths), what is inside it, then its front faces. Light shines
 * through it from what is inside with `uniforms.uInner` (0 unlit) in `uniforms.uInnerColour`.
 */
export function ice(lit: string, shade: string, side: THREE.Side, body = 0.22, frost = 1, inner = "#ffffff") {
  return new THREE.ShaderMaterial({
    vertexShader: iceVertex,
    fragmentShader: iceFragment,
    uniforms: {
      uLit: { value: rawColor(lit) },
      uShade: { value: rawColor(shade) },
      uKey: { value: KEY },
      uBody: { value: body },
      uFrost: { value: frost },
      uInnerColour: { value: rawColor(inner) },
      uInner: { value: 0 },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    side,
  });
}

/**
 * The thin light lines along a glass or ice thing's edges: bright on the side toward you, faint on
 * the far side seen through it (so it reads as a solid, not a wire frame); `reach` is how far its
 * edges lie from its middle, near and far. Flare them (a light in it) with `flare`, 0 not at all.
 */
export function glassEdges(geometry: THREE.BufferGeometry, reach: number, flareColour = "#ffffff", angle = 20, near = 0.55, far = 0.07) {
  const uniforms = { uReach: { value: reach }, uNear: { value: near }, uFar: { value: far }, uFlareColour: { value: rawColor(flareColour) }, uFlare: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `uniform float uReach; varying float vNear;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0), o = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vNear = clamp((p.z - o.z) / (uReach * length(modelViewMatrix[0].xyz)) * 0.5 + 0.5, 0.0, 1.0);
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: `uniform float uNear; uniform float uFar; uniform vec3 uFlareColour; uniform float uFlare; varying float vNear;
      void main() {
        float a = mix(uFar, uNear, smoothstep(0.3, 0.7, vNear));
        gl_FragColor = vec4(vec3(a) + uFlareColour * uFlare * (0.35 + 0.65 * vNear), a);
      }`,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, angle), material);
  return {
    lines,
    set flare(v: number) {
      uniforms.uFlare.value = v;
    },
  };
}

/** A soft halo round what glows, in the host's view, `size` across: light added round it. Set its `strength` as it glows. */
export function halo(colour: string, size = 2, strength = 0.2) {
  const uniforms = { uColour: { value: rawColor(colour) }, uStrength: { value: strength } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColour; uniform float uStrength; varying vec2 vUv;
      void main() { vec2 q = (vUv - 0.5) * 2.0; float a = exp(-4.0 * dot(q, q)) * (1.0 - smoothstep(0.8, 1.0, length(q))) * uStrength; gl_FragColor = vec4(uColour, a); }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    ...ADD,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.renderOrder = -0.5;
  return {
    mesh,
    set strength(v: number) {
      uniforms.uStrength.value = v;
    },
  };
}
