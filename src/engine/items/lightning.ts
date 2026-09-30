import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { rawColor } from "@/engine/common/color";
import { faceted, glass, glint, halo, haze, release, type Item } from "./look";

/**
 * How it strikes, as lightning does, in seconds: a faint leader forks its way down from the top over
 * `leader`; the return stroke lights the whole bolt at `flash` for `stroke`; it flickers with a
 * restrike at each of `restrikes` (after the stroke), each gone in about `flicker`, and fades over
 * `fade`, its branches first; all of it over in under half a second, as lightning is. A
 * dark pause of `gap[0]` to `gap[1]`, and the next strike takes a new path. The whole time it
 * crackles: its forks jump a little `crackle` times a second, by up to `jitter` of the shard's
 * height. Its glass turns once in `turn` seconds.
 */
const STRIKE = { leader: 0.06, flash: 1.8, stroke: 0.04, restrikes: [0.05, 0.11, 0.17], flicker: 0.025, fade: 0.16, gap: [0.3, 1.3] as [number, number], crackle: 30, jitter: 0.012, turn: 26 };

/** A small seeded generator (mulberry32), so it is the same bolt every time. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How far out from its axis the shard reaches at height y (a little inside it: what is trapped keeps clear of the glass). */
const inside = (y: number) => 0.8 * (y < -0.55 ? 0.38 * Math.max(0, (y + 0.98) / 0.43) : y < 0.35 ? 0.38 : 0.38 * Math.max(0, 1 - (y - 0.35) / 0.62));

/** The shard: the hull of a few points about a long axis, its top broken off at a slant. */
function shardGeometry(rand: () => number) {
  const pts: THREE.Vector3[] = [new THREE.Vector3(0.03, -0.98, 0.02)];
  for (const [y, r, turn] of [[-0.55, 0.42, 0], [0.35, 0.39, 0.4]] as const)
    for (let i = 0; i < 6; i++) {
      const a = turn + (i / 6) * Math.PI * 2 + (rand() - 0.5) * 0.35, k = r * (0.85 + 0.3 * rand());
      pts.push(new THREE.Vector3(Math.cos(a) * k, y + (rand() - 0.5) * 0.12, Math.sin(a) * k));
    }
  pts.push(new THREE.Vector3(-0.16, 0.94, 0.05), new THREE.Vector3(0.2, 0.76, -0.1), new THREE.Vector3(0.02, 0.84, 0.22));
  return { geometry: faceted(new ConvexGeometry(pts)), corners: pts };
}

type Seg = { a: THREE.Vector3; b: THREE.Vector3; da: number; db: number; w: number; depth: number };

/**
 * A bolt: a trunk down the shard's length from its top and branches off it, and branches off those,
 * each a run of short pieces whose direction wanders, kept inside the glass. Each end knows how far
 * along the bolt it is from where it struck, for the leader's way down.
 */
function bolt(rand: () => number): Seg[] {
  const segs: Seg[] = [];
  const wander = () => new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5);
  const keep = (p: THREE.Vector3) => {
    p.y = Math.min(0.88, Math.max(-0.86, p.y));
    const r = Math.hypot(p.x, p.z), most = inside(p.y);
    if (r > most) p.multiply(new THREE.Vector3(most / r, 1, most / r));
    return p;
  };
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, length: number, width: number, dist: number, depth: number) => {
    const n = depth === 0 ? 10 : 6 - depth * 2, step = length / n;
    let p = from.clone(), d = dist;
    for (let i = 0; i < n; i++) {
      const q = keep(p.clone().addScaledVector(dir, step).addScaledVector(wander(), step * (depth === 0 ? 0.9 : 1.2)));
      const len = p.distanceTo(q);
      segs.push({ a: p, b: q, da: d, db: d + len, w: width * (1 - (0.45 * i) / n), depth });
      if (depth < 2 && i > 0 && i < n - 1 && rand() < (depth === 0 ? 0.75 : 0.5)) {
        const side = wander().setY(0).normalize().multiplyScalar(depth === 0 ? 1.8 : 1.4);
        grow(q, dir.clone().add(side).normalize(), length * (depth === 0 ? 0.3 : 0.55), width * 0.6, d + len, depth + 1);
      }
      p = q;
      d += len;
      // (it has reached the bottom of the glass: it grounds there)
      if (q.y < -0.85) break;
    }
  };
  grow(new THREE.Vector3((rand() - 0.5) * 0.1, 0.84, (rand() - 0.5) * 0.1), new THREE.Vector3(0, -1, 0), 1.62, 0.045, 0, 0);
  const most = Math.max(...segs.map((s) => s.db));
  for (const s of segs) {
    s.da /= most;
    s.db /= most;
  }
  return segs;
}

/**
 * Each piece of the bolt a ribbon facing you, as wide as its glow: its core white, its glow pale
 * violet, fading to nothing round its ends so the pieces join. Light added to what is under it, so
 * it blooms. Only as far down as the leader has reached, brightest at its tip; its branches dimmer
 * than its trunk as it fades; and every end jumps a little with the crackle (the same jump for the
 * two pieces an end joins, so they stay joined).
 */
const boltVertex = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute float aEnd;
attribute float aSide;
attribute vec2 aDist;
attribute float aWidth;
attribute float aDepth;
uniform float uGlow;
uniform float uCrackle;
uniform float uJitter;
varying vec2 vUV;
varying float vLen;
varying float vDist;
varying float vDepth;
vec2 jump(vec3 p) {
  vec3 q = fract(p * vec3(12.9898, 78.233, 37.719) + uCrackle * 0.6180339);
  q += dot(q, q.yzx + 19.19);
  return fract(vec2(q.x * q.y, q.y * q.z)) * 2.0 - 1.0;
}
void main() {
  vec4 A = modelViewMatrix * vec4(aA, 1.0), B = modelViewMatrix * vec4(aB, 1.0);
  float scale = length(modelViewMatrix[0].xyz), w = aWidth * uGlow * scale;
  // (where it struck from holds still; every other end jumps)
  A.xy += jump(aA) * uJitter * scale * step(0.001, aDist.x);
  B.xy += jump(aB) * uJitter * scale;
  vec2 d = B.xy - A.xy;
  float len = length(d);
  vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0), across = vec2(-dir.y, dir.x);
  vec4 P = mix(A, B, aEnd);
  P.xy += across * aSide * w + dir * (aEnd * 2.0 - 1.0) * w;
  vLen = len / w;
  vUV = vec2(aEnd * (vLen + 2.0) - 1.0, aSide);
  vDist = mix(aDist.x, aDist.y, aEnd);
  vDepth = aDepth;
  gl_Position = projectionMatrix * P;
}`;
const boltFragment = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uGlowColour;
uniform float uGlow;
uniform float uReveal;
uniform float uBright;
uniform float uBranch;
varying vec2 vUV;
varying float vLen;
varying float vDist;
varying float vDepth;
void main() {
  if (vDist > uReveal) discard;
  // how far from the piece's own line, in its glow's widths (round at its ends)
  float r = length(vec2(max(0.0, max(-vUV.x, vUV.x - vLen)), vUV.y));
  float core = exp(-r * r * uGlow * uGlow * 3.5), glow = exp(-r * r * 3.0) * (1.0 - smoothstep(0.7, 1.0, r));
  // the leader's tip burns brightest; branches go before the trunk as it fades
  float x = (uReveal - vDist) / 0.05;
  float tip = 1.0 + 2.0 * exp(-x * x) * step(uReveal, 1.0);
  float bright = uBright * tip * (vDepth > 0.5 ? uBranch : 1.0);
  gl_FragColor = vec4((uCore * core + uGlowColour * glow * 0.4) * bright, 1.0);
}`;

function boltGeometry(segs: Seg[]) {
  const n = segs.length, A = new Float32Array(n * 12), B = new Float32Array(n * 12), end = new Float32Array(n * 4), side = new Float32Array(n * 4);
  const dist = new Float32Array(n * 8), width = new Float32Array(n * 4), depth = new Float32Array(n * 4), index: number[] = [];
  segs.forEach((s, i) => {
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      A.set([s.a.x, s.a.y, s.a.z], v * 3);
      B.set([s.b.x, s.b.y, s.b.z], v * 3);
      end[v] = k >> 1;
      side[v] = k & 1 ? 1 : -1;
      dist.set([s.da, s.db], v * 2);
      width[v] = s.w;
      depth[v] = s.depth;
    }
    const o = i * 4;
    index.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(A, 3));
  g.setAttribute("aA", new THREE.BufferAttribute(A, 3));
  g.setAttribute("aB", new THREE.BufferAttribute(B, 3));
  g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  g.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  g.setAttribute("aDist", new THREE.BufferAttribute(dist, 2));
  g.setAttribute("aWidth", new THREE.BufferAttribute(width, 1));
  g.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
  g.setIndex(index);
  return g;
}

function boltMesh() {
  const uniforms = {
    uCore: { value: rawColor("#ffffff") },
    uGlowColour: { value: rawColor("#b89cff") },
    uGlow: { value: 3.2 },
    uCrackle: { value: 0 },
    uJitter: { value: STRIKE.jitter },
    uReveal: { value: 0 },
    uBright: { value: 0 },
    uBranch: { value: 1 },
  };
  // (a ribbon's winding goes either way as it faces you: both sides are drawn)
  const material = new THREE.ShaderMaterial({ vertexShader: boltVertex, fragmentShader: boltFragment, uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return { mesh, uniforms };
}

/**
 * The strikes, from the clock: when each starts (a fixed sequence, so a held clock holds it), and
 * how a strike looks `s` seconds in: how far down its leader has reached (past 1, all of it), how
 * bright it is, and how bright its branches are against its trunk.
 */
function strikes() {
  const last = STRIKE.restrikes[STRIKE.restrikes.length - 1];
  const starts: number[] = [];
  let at = 0.3, k = 7;
  while (at < 3600) {
    starts.push(at);
    k = (k * 16807) % 2147483647;
    at += STRIKE.leader + STRIKE.stroke + last + 0.03 + STRIKE.fade + STRIKE.gap[0] + (k / 2147483647) * (STRIKE.gap[1] - STRIKE.gap[0]);
  }
  const which = (t: number) => {
    const u = t % 3600;
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= u) lo = mid;
      else hi = mid - 1;
    }
    return starts[lo] <= u ? { n: lo, s: u - starts[lo] } : { n: -1, s: 0 };
  };
  const dark = { reveal: 0, bright: 0, branch: 0 };
  const look = (s: number) => {
    if (s < STRIKE.leader) return { reveal: (s / STRIKE.leader) ** 0.7, bright: 0.45, branch: 1 };
    const after = s - STRIKE.leader;
    if (after < STRIKE.stroke) return { reveal: 2, bright: STRIKE.flash, branch: 1 };
    const k = after - STRIKE.stroke;
    // the restrikes: sharp flares on a dying glow, and an afterglow under them that the fade takes
    let bright = Math.max(0.9 * Math.exp(-k / 0.06), 0.32 * Math.exp(-k / 0.2));
    for (const r of STRIKE.restrikes) if (k >= r) bright = Math.max(bright, 1.4 * Math.exp(-(k - r) / STRIKE.flicker));
    if (k < last + 0.03) return { reveal: 2, bright, branch: Math.exp(-k / 0.1) };
    const f = (k - last - 0.03) / STRIKE.fade;
    return f < 1 ? { reveal: 2, bright: bright * (1 - f), branch: Math.max(0, 0.4 * (1 - 2 * f)) } : dark;
  };
  return { which, look, dark };
}

/**
 * Frozen lightning (uncommon): lightning in pale violet and white, trapped inside a clear glass
 * shard, striking over and over as lightning does (see STRIKE): a leader forking down from the top,
 * the flash of the return stroke, a flicker of restrikes, a fade, a dark pause, and a new path. It
 * blooms, with a faint violet halo that flares with each strike, crackles while it is lit, and the
 * glass catches a small four-point glint at its corners now and then. It turns slowly.
 */
export function makeLightning(): Item {
  const rand = seeded(20260930);
  const { geometry, corners } = shardGeometry(rand);
  const shard = new THREE.Group();
  const back = new THREE.Mesh(geometry, glass("#c9d2ff", THREE.BackSide, 0.05));
  const front = new THREE.Mesh(geometry, glass("#c9d2ff", THREE.FrontSide, 0.07));
  back.renderOrder = 0;
  front.renderOrder = 2;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 20), new THREE.LineBasicMaterial({ color: rawColor("#ffffff"), transparent: true, opacity: 0.35, depthWrite: false }));
  edges.renderOrder = 2;
  const light = boltMesh();
  shard.add(back, light.mesh, front, edges);
  // glints on three of its corners, each on a beat of its own
  const glints = [1, 8, 14].map((i, k) => {
    const g = glint(0.34);
    g.mesh.position.copy(corners[i]);
    shard.add(g.mesh);
    return { g, rate: 0.9 + 0.37 * k, phase: k * 2.1 };
  });
  const body = new THREE.Group();
  body.add(shard);
  body.rotation.z = -0.38;
  const glow = halo("#9d7dff", 2.1, 0.05);
  const under = haze("#b9a6ff", 1.7, 0.08);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);
  const { which, look, dark } = strikes();
  let shown = -2;

  return {
    object: root,
    update(_dt, t) {
      shard.rotation.set(0.18 * Math.sin(t * 0.23), (Math.PI * 2 * t) / STRIKE.turn, 0.08 * Math.sin(t * 0.31));
      // each strike its own bolt, drawn afresh from its number
      const { n, s } = which(t);
      if (n !== shown) {
        shown = n;
        light.mesh.geometry.dispose();
        light.mesh.geometry = boltGeometry(bolt(seeded(9001 + n * 7919)));
      }
      const l = n < 0 ? dark : look(s);
      const u = light.uniforms;
      u.uReveal.value = l.reveal;
      u.uBright.value = l.bright;
      u.uBranch.value = l.branch;
      u.uCrackle.value = Math.floor(t * STRIKE.crackle) % 1000;
      light.mesh.visible = l.bright > 0;
      // the halo flares with the strike; between strikes only a trace of it is left
      glow.strength = 0.05 + 0.16 * Math.min(1.5, l.bright);
      for (const { g, rate, phase } of glints) g.strength = Math.max(0, Math.sin(t * rate + phase)) ** 16;
    },
    dispose() {
      light.mesh.geometry.dispose();
      release(root);
    },
  };
}
