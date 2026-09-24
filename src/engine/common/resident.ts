import * as THREE from "three";
import gsap from "gsap";
import { GL } from "@/engine/common/color";

/**
 * The resident: the About object given eyes. One material, hosted by
 * AboutScene over the statement and by CloudScene at the centre of the sphere.
 * Two elliptical cylinders along the view axis are cut out of the chrome body;
 * a ray that lands on the cut shades flat eigengrau, so the eyes are two holes
 * of the page's own colour. The gaze offsets the cut, the lid is a horizontal
 * half-space descending over it. It never speaks and has no moods: it is
 * always awake.
 */

export const residentVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vView;
varying float vUnit;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  // World units per raymarch unit: half the plane's height, breathing included.
  vUnit = length(vec3(modelMatrix[1])) * 0.5;
  gl_Position = projectionMatrix * mv;
}`;

/**
 * The chrome object (spec 10): smin-joined spheres raymarched inside a small
 * plane, lit by a procedural studio (softbox above, dark horizon band, floor
 * bounce). Drift amplitudes are half the old blob's, so the body keeps a front
 * for the eyes to sit in. RESIDENT_DEPTH discards on a miss and writes
 * gl_FragDepth from the march, so cloud pieces sort in front of and behind it.
 * The centres are mirrored in map2d below: keep them in step.
 */
export const residentFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uAspect;
uniform vec2  uTilt;
uniform vec2  uGaze;
uniform float uLid;
uniform float uFade;
uniform vec3  uBg;
uniform mat4  uProj;
varying vec2 vUv;
varying vec3 vView;
varying float vUnit;

const vec2  EYE = vec2(0.16, 0.12);
const vec2  EYE_R = vec2(0.075, 0.095);
const float EYE_CAP = -0.05;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float body(vec3 p) {
  float t = uTime;
  float d = 1e5;
  vec3 c0 = vec3(sin(t * 0.70) * 0.11, 0.30 + cos(t * 0.53) * 0.14, sin(t * 0.61) * 0.09);
  vec3 c1 = vec3(cos(t * 0.47) * 0.12, -0.34 + sin(t * 0.66 + 1.7) * 0.13, cos(t * 0.52) * 0.08);
  vec3 c2 = vec3(sin(t * 0.58 + 3.1) * 0.13, cos(t * 0.44 + 0.6) * 0.17, sin(t * 0.73 + 2.0) * 0.10);
  vec3 c3 = vec3(cos(t * 0.39 + 1.1) * 0.10, sin(t * 0.81 + 2.4) * 0.26, cos(t * 0.46 + 1.3) * 0.06);
  d = smin(d, length(p - c0) - (0.40 + 0.04 * sin(t * 0.9)), 0.32);
  d = smin(d, length(p - c1) - (0.38 + 0.04 * cos(t * 1.1)), 0.32);
  d = smin(d, length(p - c2) - (0.30 + 0.03 * sin(t * 0.7 + 1.0)), 0.32);
  d = smin(d, length(p - c3) - (0.26 + 0.03 * cos(t * 0.8 + 2.0)), 0.32);
  return d;
}

/** One eye: an elliptical cylinder along z, capped behind the front, lidded from above. */
float eye(vec3 p, vec2 c) {
  float ell = (length((p.xy - c) / EYE_R) - 1.0) * min(EYE_R.x, EYE_R.y);
  float lidY = c.y + EYE_R.y * (1.0 - 2.0 * uLid);
  return max(ell, max(EYE_CAP - p.z, p.y - lidY));
}

float eyes(vec3 p) {
  vec2 g = uGaze;
  return min(eye(p, vec2(-EYE.x, EYE.y) + g), eye(p, EYE + g));
}

float map(vec3 p) {
  return max(body(p), -eyes(p));
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

vec3 env(vec3 r) {
  // studio: a softbox overhead, a dark band at the horizon, a bright floor bounce
  float up = r.y;
  float soft = smoothstep(0.05, 0.55, up);                      // softbox overhead
  float horizon = 1.0 - smoothstep(0.0, 0.22, abs(up + 0.1));   // dark band at the horizon
  float floorB = smoothstep(-0.95, -0.45, -up) * 0.5;           // floor bounce, dimmer than the sky
  float side = pow(abs(r.x), 8.0) * 0.7;                        // two rim lights
  float stripe = smoothstep(0.55, 0.6, up) * (1.0 - smoothstep(0.62, 0.67, up)) * 0.6; // a hard edge on the softbox
  float v = 0.04 + soft * 0.96 + floorB + side - horizon * 0.7 - stripe;
  return vec3(clamp(v, 0.02, 1.0));
}

mat3 rot(vec2 t) {
  float cx = cos(t.y), sx = sin(t.y), cy = cos(t.x), sy = sin(t.x);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx);
  mat3 ry = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy);
  return ry * rx;
}

#ifdef RESIDENT_DEPTH
// Depth of the point t along the ray: the eye sits 3 units in front of the plane.
void writeDepth(float t) {
  vec4 clip = uProj * vec4(vView + vec3(0.0, 0.0, (3.0 - t) * vUnit), 1.0);
  gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
}
#endif

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uAspect;
  mat3 R = rot(uTilt);
  vec3 ro = R * vec3(p, 3.0);
  vec3 rd = R * vec3(0.0, 0.0, -1.0);
  float t = 0.0;
  float minD = 1e5;
  bool hit = false;
  vec3 pos;
  for (int i = 0; i < STEPS; i++) {
    pos = ro + rd * t;
    float d = map(pos);
    minD = min(minD, d);
    if (d < 0.0015) { hit = true; break; }
    t += d * 0.9;
    if (t > 7.0) break;
  }
  if (!hit) {
    // The fringe takes the silhouette's own colour (at the edge r == rd), so its
    // coverage alone blends it into whatever background sits behind.
    float aa = 1.0 - smoothstep(0.0, 0.012, minD);
#ifdef RESIDENT_DEPTH
    if (aa < 0.01) discard;
    gl_FragDepth = 1.0; // the fringe covers nothing
#endif
    gl_FragColor = vec4(env(rd), aa * 0.9 * uFade);
    return;
  }
#ifdef RESIDENT_DEPTH
  writeDepth(t);
#endif
  if (eyes(pos) < 0.004) {
    // The cut: flat eigengrau, no environment.
    gl_FragColor = vec4(uBg, uFade);
    return;
  }
  vec3 n = normalAt(pos);
  vec3 v = -rd;
  vec3 r = reflect(-v, n);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 col = env(r) * (0.82 + 0.18 * fres);
  // a crisp highlight from the softbox
  float spec = pow(max(dot(r, normalize(vec3(0.3, 0.9, 0.4))), 0.0), 60.0);
  col += spec * 0.5;
  gl_FragColor = vec4(col, uFade);
}`;

export type ResidentMaterialOptions = {
  /** Plane width / height. */
  aspect: number;
  /** March steps: 72 on About, 48 on Space. */
  steps: number;
  /** Discard on a miss and write gl_FragDepth, for a perspective scene with other objects. */
  depth?: boolean;
};

export type ResidentUniforms = {
  uTime: { value: number };
  uAspect: { value: number };
  uTilt: { value: THREE.Vector2 };
  uGaze: { value: THREE.Vector2 };
  uLid: { value: number };
  uFade: { value: number };
  uBg: { value: THREE.Color };
  uProj: { value: THREE.Matrix4 };
};

export function makeResidentMaterial(o: ResidentMaterialOptions): THREE.ShaderMaterial {
  const uniforms: ResidentUniforms = {
    uTime: { value: 0 },
    uAspect: { value: o.aspect },
    uTilt: { value: new THREE.Vector2() },
    uGaze: { value: new THREE.Vector2() },
    uLid: { value: 0 },
    uFade: { value: 1 },
    uBg: { value: GL.bg },
    uProj: { value: new THREE.Matrix4() },
  };
  const defines: Record<string, string | number> = { STEPS: Math.round(o.steps) };
  if (o.depth) defines.RESIDENT_DEPTH = 1;
  return new THREE.ShaderMaterial({
    uniforms,
    defines,
    vertexShader: residentVert,
    fragmentShader: residentFrag,
    transparent: true,
    depthWrite: !!o.depth,
    depthTest: !!o.depth,
  });
}

function smin(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

/**
 * The body's silhouette in the plane, in march units, with the z terms
 * dropped: the same centres and radii as the shader, joined the same way.
 */
function map2d(x: number, y: number, t: number) {
  let d = 1e5;
  d = smin(d, Math.hypot(x - Math.sin(t * 0.7) * 0.11, y - (0.3 + Math.cos(t * 0.53) * 0.14)) - (0.4 + 0.04 * Math.sin(t * 0.9)), 0.32);
  d = smin(d, Math.hypot(x - Math.cos(t * 0.47) * 0.12, y - (-0.34 + Math.sin(t * 0.66 + 1.7) * 0.13)) - (0.38 + 0.04 * Math.cos(t * 1.1)), 0.32);
  d = smin(d, Math.hypot(x - Math.sin(t * 0.58 + 3.1) * 0.13, y - Math.cos(t * 0.44 + 0.6) * 0.17) - (0.3 + 0.03 * Math.sin(t * 0.7 + 1.0)), 0.32);
  d = smin(d, Math.hypot(x - Math.cos(t * 0.39 + 1.1) * 0.1, y - Math.sin(t * 0.81 + 2.4) * 0.26) - (0.26 + 0.03 * Math.cos(t * 0.8 + 2.0)), 0.32);
  return d;
}

/**
 * Whether plane coordinates (u, v in 0..1, v up) fall on the body at `time`,
 * so hover and click test the silhouette rather than the plane's corners.
 */
export function hitTest(u: number, v: number, aspect: number, time: number): boolean {
  return map2d((u - 0.5) * 2 * aspect, (v - 0.5) * 2, time) < 0.01;
}

const GAZE = 0.05;
const BREATH = 0.015;
const BREATH_HZ = 0.25;
const BLINK = 0.12;
const RELAX_AFTER = 3; // seconds idle before the gaze starts back to centre
const RELAX_TAU = 5; // e-folding time of that drift: centred by about 20s

export type ResidentOptions = ResidentMaterialOptions & { reducedMotion?: boolean };

/**
 * Owns the uniforms and the idle behaviour: gaze follows the pointer and
 * relaxes to centre, one blink every 4 to 6 seconds, breathing on the host
 * mesh. Reduced motion keeps the gaze and drops the rest. The host positions
 * the mesh and sets `base` (its plane size in host units); `appear` scales it
 * in from nothing.
 */
export class Resident {
  readonly material: THREE.ShaderMaterial;
  readonly uniforms: ResidentUniforms;
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  /** uTilt's value, for the host to drive. */
  readonly tilt: THREE.Vector2;
  /** Plane size in the host's units; the mesh scale follows it every frame. */
  readonly base = new THREE.Vector2(1, 1);
  /** 0 hidden .. 1 full size. */
  appear = 0;
  private aspect: number;
  private reducedMotion: boolean;
  private time = 0;
  private gaze = new THREE.Vector2();
  private target = new THREE.Vector2();
  private glance = new THREE.Vector2();
  private idle = 0;
  private nextBlink = 0;
  private busy = false;
  private closed = false;

  constructor(o: ResidentOptions) {
    this.aspect = o.aspect;
    this.reducedMotion = !!o.reducedMotion;
    this.material = makeResidentMaterial(o);
    this.uniforms = this.material.uniforms as ResidentUniforms;
    this.tilt = this.uniforms.uTilt.value;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.mesh.scale.set(1e-4, 1e-4, 1);
    this.scheduleBlink();
  }

  private scheduleBlink() {
    this.nextBlink = this.time + 4 + Math.random() * 2;
  }

  /** Pointer as a normalised viewport position (0..1, y down). */
  setPointer(nx: number, ny: number) {
    this.target.set((nx - 0.5) * 2 * GAZE, -(ny - 0.5) * 2 * GAZE);
    this.idle = 0;
  }

  /** Called from the host's frame. */
  update(dt: number) {
    if (!this.reducedMotion) this.time += dt;
    this.uniforms.uTime.value = this.time;
    this.idle += dt;
    if (this.idle > RELAX_AFTER) this.target.multiplyScalar(Math.exp(-dt / RELAX_TAU));
    this.gaze.lerp(this.target, 1 - Math.pow(0.02, dt));
    const g = this.uniforms.uGaze.value;
    g.copy(this.gaze).add(this.glance);
    g.x = THREE.MathUtils.clamp(g.x, -GAZE, GAZE);
    g.y = THREE.MathUtils.clamp(g.y, -GAZE, GAZE);
    if (!this.reducedMotion && !this.busy && !this.closed && this.time >= this.nextBlink) {
      this.blink(BLINK / 2, 0, BLINK / 2);
      this.scheduleBlink();
    }
    const breath = this.reducedMotion ? 1 : 1 + BREATH * Math.sin(2 * Math.PI * BREATH_HZ * this.time);
    const s = Math.max(this.appear, 1e-4);
    this.mesh.scale.set(this.base.x * s, this.base.y * s * breath, 1);
  }

  private blink(close: number, hold: number, open: number) {
    this.busy = true;
    const lid = this.uniforms.uLid;
    gsap.killTweensOf(lid);
    gsap
      .timeline({ onComplete: () => (this.busy = false) })
      .to(lid, { value: 1, duration: close, ease: "power2.in" })
      .to(lid, { value: 0, duration: open, ease: "power2.out" }, `+=${hold}`);
  }

  /** Scale in from nothing: the About object's own entrance. */
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

  /** Tween uFade (the dim), from `from` when given. */
  fade(value: number, duration: number, delay = 0, from?: number) {
    const u = this.uniforms.uFade;
    if (from !== undefined) u.value = from;
    gsap.to(u, { value, duration, ease: "power2.out", delay, overwrite: true });
  }

  closeEyes() {
    gsap.killTweensOf(this.uniforms.uLid);
    this.closed = true;
    this.busy = false;
    this.uniforms.uLid.value = 1;
  }

  openEyes(duration: number) {
    gsap.killTweensOf(this.uniforms.uLid);
    gsap.to(this.uniforms.uLid, {
      value: 0, duration, ease: "power2.out",
      onComplete: () => {
        this.closed = false;
        this.scheduleBlink();
      },
    });
  }

  /** The game's "yes": one slow blink. */
  blinkSlow() {
    if (this.closed) return;
    this.blink(0.35, 0.2, 0.35);
  }

  /** The game's "no": a glance to the side for 0.6s, away from where it was looking. */
  glanceAside() {
    gsap.killTweensOf(this.glance);
    const x = this.gaze.x > 0 ? -GAZE : GAZE;
    gsap
      .timeline()
      .to(this.glance, { x, duration: 0.12, ease: "power2.out" })
      .to(this.glance, { x: 0, duration: 0.25, ease: "power2.inOut" }, "+=0.6");
  }

  /** Plane coordinates (0..1, v up) against the body's silhouette now. */
  hitTest(u: number, v: number): boolean {
    return hitTest(u, v, this.aspect, this.time);
  }

  dispose() {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.glance);
    gsap.killTweensOf(this.uniforms.uLid);
    gsap.killTweensOf(this.uniforms.uFade);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
