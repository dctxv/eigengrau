import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { rawColor } from "@/engine/common/color";
import { faceted, glass, glassEdges, glint, halo, haze, release, type Item } from "./look";

/**
 * How it strikes, as lightning does, in seconds: a faint leader forks its way down from the top over
 * `leader`; the return stroke lights the whole bolt at `flash` for `stroke`; it flickers with a
 * restrike (at `restrike`) at each of `restrikes` after the stroke, each gone in about `flicker`, and fades over
 * `fade`, its branches first; all of it over in under half a second, as lightning is. A
 * dark pause of `gap[0]` to `gap[1]`, and the next strike takes a new path. The whole time it
 * crackles: its forks jump a little `crackle` times a second, by up to `jitter` of the shard's
 * height. Its glass turns once in `turn` seconds.
 */
const STRIKE = { leader: 0.06, flash: 2.6, stroke: 0.04, restrikes: [0.05, 0.11, 0.17], restrike: 1.9, flicker: 0.025, fade: 0.16, gap: [0.3, 1.3] as [number, number], crackle: 30, jitter: 0.012, turn: 26 };

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

/** One run of the bolt, the trunk or a branch: its points, how far along the bolt each is from where it struck, and how wide it is there. */
type Chain = { pts: THREE.Vector3[]; dist: number[]; width: number[]; depth: number };

/**
 * A bolt: a trunk down the shard's length from its top and branches off it, and branches off those,
 * each a run of short pieces whose direction wanders, kept inside the glass. Each point knows how
 * far along the bolt it is from where it struck (a share of `length`, the longest way along it), for
 * the leader's way down.
 */
function bolt(rand: () => number): { chains: Chain[]; length: number } {
  const chains: Chain[] = [];
  const wander = () => new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5);
  const keep = (p: THREE.Vector3) => {
    p.y = Math.min(0.88, Math.max(-0.86, p.y));
    const r = Math.hypot(p.x, p.z), most = inside(p.y);
    if (r > most) p.multiply(new THREE.Vector3(most / r, 1, most / r));
    return p;
  };
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, length: number, width: number, dist: number, depth: number) => {
    const n = depth === 0 ? 10 : 6 - depth * 2, step = length / n;
    const chain: Chain = { pts: [from.clone()], dist: [dist], width: [width], depth };
    chains.push(chain);
    let p = from.clone(), d = dist;
    for (let i = 0; i < n; i++) {
      const q = keep(p.clone().addScaledVector(dir, step).addScaledVector(wander(), step * (depth === 0 ? 0.9 : 1.2)));
      d += p.distanceTo(q);
      chain.pts.push(q);
      chain.dist.push(d);
      chain.width.push(width * (1 - (0.45 * (i + 1)) / n));
      if (depth < 2 && i > 0 && i < n - 1 && rand() < (depth === 0 ? 0.75 : 0.5)) {
        const side = wander().setY(0).normalize().multiplyScalar(depth === 0 ? 1.8 : 1.4);
        grow(q, dir.clone().add(side).normalize(), length * (depth === 0 ? 0.3 : 0.55), width * 0.6, d, depth + 1);
      }
      p = q;
      // (it has reached the bottom of the glass: it grounds there)
      if (q.y < -0.85) break;
    }
  };
  grow(new THREE.Vector3((rand() - 0.5) * 0.1, 0.84, (rand() - 0.5) * 0.1), new THREE.Vector3(0, -1, 0), 1.62, 0.052, 0, 0);
  const most = Math.max(...chains.flatMap((c) => c.dist));
  for (const c of chains) c.dist = c.dist.map((d) => d / most);
  return { chains, length: most };
}

/**
 * Each piece of the bolt a ribbon facing you, as wide as its glow and round past its ends: its core
 * white, its glow pale violet. Where a run bends, the line that halves the bend splits the pixels
 * between its two pieces (each as bright as the other along it), so their light meets once and
 * never doubles. A branch fades in from where it forks, so it does not double its parent's light
 * there either. Light added to what is under it, so it blooms. Only as far down as the leader has
 * reached, round and brightest at its front; its branches dimmer than its trunk as it fades; and
 * every point but where it struck jumps a little with the crackle.
 */
const boltVertex = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aPrev;
attribute vec3 aNext;
attribute vec2 aJoin;
attribute float aEnd;
attribute float aSide;
attribute vec2 aDist;
attribute vec2 aWidth;
attribute vec2 aFrom;
attribute float aDepth;
uniform float uGlow;
uniform float uCrackle;
uniform float uJitter;
uniform vec3 uRoot;
uniform vec4 uViewport;
varying vec2 vUV;
varying float vLen;
varying float vDist;
varying float vFrom;
varying float vWide;
varying float vDepth;
flat varying vec4 vCutA;
flat varying vec4 vCutB;
flat varying vec2 vJoin;
vec2 jump(vec3 p) {
  vec3 q = fract(p * vec3(12.9898, 78.233, 37.719) + uCrackle * 0.6180339);
  q += dot(q, q.yzx + 19.19);
  return (fract(vec2(q.x * q.y, q.y * q.z)) * 2.0 - 1.0) * step(1e-5, distance(p, uRoot));
}
vec4 view(vec3 p) {
  vec4 v = modelViewMatrix * vec4(p, 1.0);
  v.xy += jump(p) * uJitter * length(modelViewMatrix[0].xyz);
  return v;
}
vec2 onScreen(vec3 p) {
  vec4 c = projectionMatrix * view(p);
  return (c.xy / c.w * 0.5 + 0.5) * uViewport.zw + uViewport.xy;
}
// where a run bends at 'at', on its way from 'from' to 'to': the line that halves the bend, as a
// point on it (drawing buffer px) and the way across it into the later piece. (Both pieces work it
// out from the same three points the same way, so they agree on it to the bit.)
vec4 cut(vec3 from, vec3 at, vec3 to) {
  vec2 a = onScreen(from), b = onScreen(at), c = onScreen(to);
  vec2 u = b - a, v = c - b;
  u = length(u) > 1e-4 ? normalize(u) : vec2(0.0);
  v = length(v) > 1e-4 ? normalize(v) : vec2(0.0);
  vec2 n = u + v;
  return vec4(b, length(n) > 1e-4 ? normalize(n) : vec2(1.0, 0.0));
}
void main() {
  float scale = length(modelViewMatrix[0].xyz);
  vec4 A = view(aA), B = view(aB);
  vec2 d = B.xy - A.xy;
  float len = length(d), wA = aWidth.x * uGlow * scale, wB = aWidth.y * uGlow * scale, w = mix(wA, wB, aEnd), mid = 0.5 * (wA + wB);
  vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0), across = vec2(-dir.y, dir.x);
  vec4 P = mix(A, B, aEnd);
  P.xy += across * aSide * w + dir * (aEnd * 2.0 - 1.0) * w;
  vLen = len / mid;
  vUV = vec2(aEnd * (vLen + 2.0) - 1.0, aSide);
  vDist = mix(aDist.x, aDist.y, aEnd);
  vWide = mix(aWidth.x, aWidth.y, aEnd) * uGlow;
  vFrom = mix(aFrom.x, aFrom.y, aEnd) / vWide;
  vDepth = aDepth;
  vJoin = aJoin;
  vCutA = aJoin.x > 0.5 ? cut(aPrev, aA, aB) : vec4(0.0);
  vCutB = aJoin.y > 0.5 ? cut(aA, aB, aNext) : vec4(0.0);
  gl_Position = projectionMatrix * P;
}`;
const boltFragment = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uGlowColour;
uniform float uGlow;
uniform float uReveal;
uniform float uBright;
uniform float uBranch;
uniform float uLength;
varying vec2 vUV;
varying float vLen;
varying float vDist;
varying float vFrom;
varying float vWide;
varying float vDepth;
flat varying vec4 vCutA;
flat varying vec4 vCutB;
flat varying vec2 vJoin;
void main() {
  // (before the bend at its start is the piece before's; past the bend at its end, the next one's)
  if (vJoin.x > 0.5 && dot(gl_FragCoord.xy - vCutA.xy, vCutA.zw) <= 0.0) discard;
  if (vJoin.y > 0.5 && dot(gl_FragCoord.xy - vCutB.xy, vCutB.zw) > 0.0) discard;
  // how far past where the leader has reached, and how far from its line, in its glow's widths
  // (round past its ends, and round at the leader's front)
  float ahead = max(0.0, vDist - uReveal) * uLength / vWide;
  if (ahead >= 1.0) discard;
  float r = length(vec2(max(max(0.0, max(-vUV.x, vUV.x - vLen)), ahead), vUV.y));
  float core = exp(-r * r * uGlow * uGlow * 3.5), glow = exp(-r * r * 3.0) * (1.0 - smoothstep(0.7, 1.0, r));
  // the leader's front burns brightest; branches fade in from their forks, and go before the trunk as it fades
  float x = (uReveal - vDist) / 0.05;
  float tip = 1.0 + 2.0 * exp(-x * x) * step(uReveal, 1.0);
  float branch = vDepth > 0.5 ? uBranch * smoothstep(0.2, 1.2, vFrom) : 1.0;
  gl_FragColor = vec4((uCore * core + uGlowColour * glow * 0.4) * uBright * tip * branch, 1.0);
}`;

/** The bolt's pieces, four corners each, each knowing the points either side of it along its run (where it has them), for the bends. */
function boltGeometry(chains: Chain[]) {
  const a: number[] = [], b: number[] = [], prev: number[] = [], next: number[] = [], join: number[] = [], end: number[] = [], side: number[] = [];
  const dist: number[] = [], width: number[] = [], from: number[] = [], depth: number[] = [], index: number[] = [];
  for (const c of chains) {
    const m = c.pts.length, along = [0];
    for (let i = 1; i < m; i++) along.push(along[i - 1] + c.pts[i].distanceTo(c.pts[i - 1]));
    for (let i = 0; i < m - 1; i++) {
      const A = c.pts[i], B = c.pts[i + 1], P = c.pts[Math.max(0, i - 1)], N = c.pts[Math.min(m - 1, i + 2)], o = a.length / 3;
      for (let k = 0; k < 4; k++) {
        a.push(A.x, A.y, A.z);
        b.push(B.x, B.y, B.z);
        prev.push(P.x, P.y, P.z);
        next.push(N.x, N.y, N.z);
        join.push(i > 0 ? 1 : 0, i + 2 < m ? 1 : 0);
        end.push(k >> 1);
        side.push(k & 1 ? 1 : -1);
        dist.push(c.dist[i], c.dist[i + 1]);
        width.push(c.width[i], c.width[i + 1]);
        from.push(along[i], along[i + 1]);
        depth.push(c.depth);
      }
      index.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  const f = (v: number[], n: number) => new THREE.Float32BufferAttribute(v, n);
  g.setAttribute("position", f(a, 3));
  g.setAttribute("aA", f(a, 3));
  g.setAttribute("aB", f(b, 3));
  g.setAttribute("aPrev", f(prev, 3));
  g.setAttribute("aNext", f(next, 3));
  g.setAttribute("aJoin", f(join, 2));
  g.setAttribute("aEnd", f(end, 1));
  g.setAttribute("aSide", f(side, 1));
  g.setAttribute("aDist", f(dist, 2));
  g.setAttribute("aWidth", f(width, 2));
  g.setAttribute("aFrom", f(from, 2));
  g.setAttribute("aDepth", f(depth, 1));
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
    uRoot: { value: new THREE.Vector3() },
    uLength: { value: 1 },
    uViewport: { value: new THREE.Vector4() },
  };
  // (a ribbon's winding goes either way as it faces you: both sides are drawn)
  const material = new THREE.ShaderMaterial({ vertexShader: boltVertex, fragmentShader: boltFragment, uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  // (where on the drawing buffer it is being drawn, for the bends' lines, which are in its pixels)
  mesh.onBeforeRender = (renderer) => renderer.getCurrentViewport(uniforms.uViewport.value);
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
    for (const r of STRIKE.restrikes) if (k >= r) bright = Math.max(bright, STRIKE.restrike * Math.exp(-(k - r) / STRIKE.flicker));
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
 * blooms and crackles while it is lit, and each strike lights everything round it: the glass from
 * inside and along its edges, a violet halo, a burst of light at its brightest and the haze beneath;
 * and the stroke jolts the shard. The glass, clear between strikes, catches the light on a face or
 * two as it turns slowly, and a small four-point glint at its corners now and then.
 */
export function makeLightning(): Item {
  const rand = seeded(20260930);
  const { geometry, corners } = shardGeometry(rand);
  const shard = new THREE.Group();
  const backGlass = glass("#c9d2ff", THREE.BackSide, 0.03, "#b59cff"), frontGlass = glass("#c9d2ff", THREE.FrontSide, 0.04, "#d9ccff");
  const back = new THREE.Mesh(geometry, backGlass);
  const front = new THREE.Mesh(geometry, frontGlass);
  back.renderOrder = 0;
  front.renderOrder = 2;
  const edges = glassEdges(geometry, 0.45, "#e2d8ff", 20, 0.65, 0.07);
  edges.lines.renderOrder = 2;
  const light = boltMesh();
  shard.add(back, light.mesh, front, edges.lines);
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
  // a faint violet halo that flares with each strike, and a wider burst of light only at its brightest
  const glow = halo("#9d7dff", 2.1, 0.05);
  const burst = halo("#cdbfff", 2.3, 0);
  const under = haze("#b9a6ff", 1.7, 0.08);
  const underStrength = (under.material as THREE.ShaderMaterial).uniforms.uStrength;
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, burst.mesh, glow.mesh, body);
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
        const { chains, length } = bolt(seeded(9001 + n * 7919));
        light.mesh.geometry = boltGeometry(chains);
        light.uniforms.uRoot.value.copy(chains[0].pts[0]);
        light.uniforms.uLength.value = length;
      }
      const l = n < 0 ? dark : look(s);
      const u = light.uniforms;
      u.uReveal.value = l.reveal;
      u.uBright.value = l.bright;
      u.uBranch.value = l.branch;
      u.uCrackle.value = Math.floor(t * STRIKE.crackle) % 1000;
      light.mesh.visible = l.bright > 0;
      // it lights everything round it: the glass from inside and its edges, the halo, a burst of
      // light at its brightest, and the haze beneath; between strikes only a trace of the halo is left
      const lit = Math.min(2.6, l.bright);
      backGlass.uniforms.uInner.value = 0.05 * lit;
      frontGlass.uniforms.uInner.value = 0.02 * lit;
      edges.flare = 0.22 * lit;
      glow.strength = 0.05 + 0.2 * lit;
      burst.strength = 0.14 * Math.max(0, l.bright - 1.2);
      underStrength.value = 0.08 + 0.1 * lit;
      // and the stroke jolts the shard, a quick shake that dies away
      const after = n < 0 ? -1 : s - STRIKE.leader, jolt = after < 0 ? 0 : Math.exp(-after / 0.08);
      body.position.set(0.018 * jolt * Math.sin(after * 97), 0.012 * jolt * Math.sin(after * 71 + 1.3), 0);
      body.rotation.z = -0.38 + 0.03 * jolt * Math.sin(after * 83 + 0.6);
      for (const { g, rate, phase } of glints) g.strength = Math.max(0, Math.sin(t * rate + phase)) ** 16;
    },
    dispose() {
      light.mesh.geometry.dispose();
      release(root);
    },
  };
}
