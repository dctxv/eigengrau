import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { rawColor } from "@/engine/common/color";
import { faceted, glass, glint, halo, haze, release, type Item } from "./look";

/**
 * Its beat: a pulse every `every` seconds runs from the trunk out to the tips over `run`, a band
 * `band` of the tree's length wide; the tree glows at `rest` between pulses and flares by `flare`
 * as one passes. Its glass turns once in `turn` seconds.
 */
const BEAT = { every: 3.4, run: 1.1, band: 0.09, rest: 0.55, flare: 0.9, turn: 26 };

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

type Seg = { a: THREE.Vector3; b: THREE.Vector3; da: number; db: number; w: number };

/**
 * The lightning: a trunk up the shard's length and branches off it, and branches off those, each a
 * run of short pieces whose direction wanders, kept inside the glass. Each end knows how far along
 * the tree it is from the trunk's root, for the pulse.
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
      segs.push({ a: p, b: q, da: d, db: d + len, w: width * (1 - (0.45 * i) / n) });
      if (depth < 2 && i > 0 && i < n - 1 && rand() < (depth === 0 ? 0.75 : 0.5)) {
        const side = wander().setY(0).normalize().multiplyScalar(depth === 0 ? 1.8 : 1.4);
        grow(q, dir.clone().add(side).normalize(), length * (depth === 0 ? 0.3 : 0.55), width * 0.6, d + len, depth + 1);
      }
      p = q;
      d += len;
    }
  };
  grow(new THREE.Vector3(0.02, -0.8, 0), new THREE.Vector3(0, 1, 0), 1.62, 0.045, 0, 0);
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
 * it blooms; brighter where the pulse is.
 */
const boltVertex = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute float aEnd;
attribute float aSide;
attribute vec2 aDist;
attribute float aWidth;
uniform float uGlow;
varying vec2 vUV;
varying float vLen;
varying float vDist;
void main() {
  vec4 A = modelViewMatrix * vec4(aA, 1.0), B = modelViewMatrix * vec4(aB, 1.0);
  float scale = length(modelViewMatrix[0].xyz), w = aWidth * uGlow * scale;
  vec2 d = B.xy - A.xy;
  float len = length(d);
  vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0), across = vec2(-dir.y, dir.x);
  vec4 P = mix(A, B, aEnd);
  P.xy += across * aSide * w + dir * (aEnd * 2.0 - 1.0) * w;
  vLen = len / w;
  vUV = vec2(aEnd * (vLen + 2.0) - 1.0, aSide);
  vDist = mix(aDist.x, aDist.y, aEnd);
  gl_Position = projectionMatrix * P;
}`;
const boltFragment = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uGlowColour;
uniform float uGlow;
uniform float uRest;
uniform float uPulse;
uniform float uBand;
uniform float uFlare;
varying vec2 vUV;
varying float vLen;
varying float vDist;
void main() {
  // how far from the piece's own line, in its glow's widths (round at its ends)
  float r = length(vec2(max(0.0, max(-vUV.x, vUV.x - vLen)), vUV.y));
  float core = exp(-r * r * uGlow * uGlow * 3.5), glow = exp(-r * r * 3.0) * (1.0 - smoothstep(0.7, 1.0, r));
  float x = (vDist - uPulse) / uBand, pulse = exp(-x * x);
  float bright = uRest + uFlare * pulse;
  vec3 c = (uCore * core + uGlowColour * glow * 0.4) * bright;
  gl_FragColor = vec4(c, 1.0);
}`;

function boltMesh(segs: Seg[]) {
  const n = segs.length, A = new Float32Array(n * 12), B = new Float32Array(n * 12), end = new Float32Array(n * 4), side = new Float32Array(n * 4);
  const dist = new Float32Array(n * 8), width = new Float32Array(n * 4), index: number[] = [];
  segs.forEach((s, i) => {
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      A.set([s.a.x, s.a.y, s.a.z], v * 3);
      B.set([s.b.x, s.b.y, s.b.z], v * 3);
      end[v] = k >> 1;
      side[v] = k & 1 ? 1 : -1;
      dist.set([s.da, s.db], v * 2);
      width[v] = s.w;
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
  g.setIndex(index);
  const uniforms = {
    uCore: { value: rawColor("#ffffff") },
    uGlowColour: { value: rawColor("#b89cff") },
    uGlow: { value: 3.2 },
    uRest: { value: BEAT.rest },
    uPulse: { value: -1 },
    uBand: { value: BEAT.band },
    uFlare: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: boltVertex, fragmentShader: boltFragment, uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return { mesh, uniforms };
}

/**
 * Frozen lightning (uncommon): branching light in pale violet and white, trapped inside a clear
 * glass shard; every few seconds a bright pulse runs from the trunk out to the tips. The light
 * blooms, with a faint violet halo round it that swells with the pulse, and the glass catches a
 * small four-point glint at its corners now and then. It turns slowly.
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
  const light = boltMesh(bolt(rand));
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
  const glow = halo("#9d7dff", 1.9, 0.2);
  const under = haze("#b9a6ff", 1.7, 0.08);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);

  return {
    object: root,
    update(_dt, t) {
      shard.rotation.set(0.18 * Math.sin(t * 0.23), (Math.PI * 2 * t) / BEAT.turn, 0.08 * Math.sin(t * 0.31));
      // the pulse: out from the trunk's root past the farthest tip, then quiet until the next
      const p = (t % BEAT.every) / BEAT.run;
      const on = p < 1;
      light.uniforms.uPulse.value = on ? -0.15 + 1.4 * p : -1;
      light.uniforms.uFlare.value = on ? BEAT.flare : 0;
      glow.strength = 0.16 + (on ? 0.22 * Math.sin(Math.PI * p) : 0);
      for (const { g, rate, phase } of glints) g.strength = Math.max(0, Math.sin(t * rate + phase)) ** 16;
    },
    dispose() {
      release(root);
    },
  };
}
