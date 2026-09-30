import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { rawColor } from "@/engine/common/color";
import { KEY, faceted, glint, halo, haze, release, type Item } from "./look";

/**
 * The shard and its copies. Apart, it is `copies` faint copies, each `apart` (item units) from where
 * the shard is, drifting about that by `drift` and turned from it by up to `twist` radians, each
 * about `ghost` there. Looked at (the cursor over it, or focus), they come together in about `snap`
 * seconds with a soft flash `flash` seconds long, as one solid bright shard; let go, they drift apart
 * again over about `part` seconds. It turns once in `turn` seconds.
 */
const PHASE = { copies: 4, apart: 0.16, drift: 0.05, twist: 0.16, ghost: 0.5, snap: 0.07, part: 1.6, flash: 0.35, turn: 24 };

/** A small seeded generator (mulberry32), so it is the same shard every time. */
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

/** The shard: a six-sided crystal, a long point on top a little off its axis, a short one below. */
function shardGeometry(rand: () => number) {
  const pts: THREE.Vector3[] = [new THREE.Vector3(0.06, 0.92, -0.02), new THREE.Vector3(-0.02, -0.86, 0.03)];
  for (const [y, r] of [[0.42, 0.3], [-0.5, 0.28]] as const)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + (rand() - 0.5) * 0.2, k = r * (0.88 + 0.24 * rand());
      pts.push(new THREE.Vector3(Math.cos(a) * k, y + (rand() - 0.5) * 0.1, Math.sin(a) * k));
    }
  return { geometry: faceted(new ConvexGeometry(pts)), corners: pts };
}

const vertexShader = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vP = p.xyz;
  vN = normalMatrix * normal;
  gl_Position = projectionMatrix * p;
}`;

/**
 * The solid shard: the family's faceted look (key light from the upper left, a gentle gradient, a
 * cool rim) in a bright pale teal, and as much of it there as `uAlpha`, flashing toward white with
 * `uFlash`.
 */
const solidFragment = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uRim;
uniform vec3 uKey;
uniform float uAlpha;
uniform float uFlash;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  float t = smoothstep(-0.45, 0.9, dot(n, uKey));
  vec3 c = mix(uShade, uLit, t * t * (3.0 - 2.0 * t));
  c += uRim * pow(1.0 - max(dot(n, v), 0.0), 2.6) * 0.6;
  c = mix(c, vec3(1.0), uFlash * 0.7);
  gl_FragColor = vec4(c * uAlpha, uAlpha);
}`;

/** A copy: a faint shell of it, pale teal, most where it is seen at a slant. */
const ghostFragment = /* glsl */ `
uniform vec3 uTint;
uniform vec3 uKey;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  float fres = pow(1.0 - abs(dot(n, v)), 2.0), lit = 0.6 + 0.4 * max(dot(n, uKey), 0.0);
  float a = uAlpha * (0.3 + 0.7 * fres);
  gl_FragColor = vec4(mix(uTint * lit, vec3(1.0), 0.5 * fres) * a, a);
}`;

/**
 * Phase shard (rare): a pale teal crystal that is never quite all there. Apart, it is four faint
 * copies of itself drifting a little way from one another, each half seen through. Looked at (the
 * cursor over it, or focus on it), they snap together into one solid, bright shard with a soft
 * flash; looked away from, they slowly drift apart again. It turns slowly, and catches a small
 * four-point glint at a corner now and then.
 */
export function makePhaseShard(): Item {
  const rand = seeded(20261002);
  const { geometry, corners } = shardGeometry(rand);
  const edges = new THREE.EdgesGeometry(geometry, 20);
  const shard = new THREE.Group();

  // the solid shard, there only as they come together
  const solidU = { uLit: { value: rawColor("#b4fbf0") }, uShade: { value: rawColor("#1f7079") }, uRim: { value: rawColor("#d8fffa") }, uKey: { value: KEY }, uAlpha: { value: 0 }, uFlash: { value: 0 } };
  const solid = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ vertexShader, fragmentShader: solidFragment, uniforms: solidU, transparent: true, premultipliedAlpha: true }));
  const solidEdges = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: rawColor("#ffffff"), transparent: true, opacity: 0, depthWrite: false }));
  solid.renderOrder = 0;
  solidEdges.renderOrder = 1;
  shard.add(solid, solidEdges);

  // the copies: each its own way off, its own drift and its own twist
  const ghosts = Array.from({ length: PHASE.copies }, (_, i) => {
    const u = { uTint: { value: rawColor(i % 2 ? "#6fe0d4" : "#8ceee0") }, uKey: { value: KEY }, uAlpha: { value: PHASE.ghost } };
    const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ vertexShader, fragmentShader: ghostFragment, uniforms: u, transparent: true, premultipliedAlpha: true, depthWrite: false }));
    const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: rawColor("#dffffa"), transparent: true, opacity: 0.12, depthWrite: false }));
    mesh.renderOrder = 2;
    lines.renderOrder = 3;
    mesh.add(lines);
    shard.add(mesh);
    // spread about it: ways off it roughly evenly round, and a little up or down
    const a = (i / PHASE.copies) * Math.PI * 2 + rand() * 0.6;
    const off = new THREE.Vector3(Math.cos(a), (rand() - 0.5) * 0.8, Math.sin(a)).normalize().multiplyScalar(PHASE.apart);
    const twist = new THREE.Euler((rand() - 0.5) * 2 * PHASE.twist, (rand() - 0.5) * 2 * PHASE.twist, (rand() - 0.5) * 2 * PHASE.twist);
    return { mesh, lines, u, off, twist, phase: rand() * 10, rate: 0.35 + 0.25 * rand() };
  });

  const glints = [2, 9].map((i, k) => {
    const g = glint(0.3);
    g.mesh.position.copy(corners[i]);
    shard.add(g.mesh);
    return { g, rate: 0.8 + 0.43 * k, phase: k * 2.7 };
  });
  const body = new THREE.Group();
  body.add(shard);
  body.rotation.z = 0.3;
  const glow = halo("#5fe8d6", 2.0, 0.04);
  const under = haze("#9ff0e4", 1.6, 0.05);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);

  // looked at, by the cursor or by focus; how together they are (0 apart, 1 one), and the flash
  let hovered = false, focused = false, together = 0, flash = 0;
  const q = new THREE.Quaternion(), e = new THREE.Euler();

  return {
    object: root,
    point(at) {
      hovered = !!at && Math.hypot(at.x, at.y) < 0.95;
    },
    focus(on) {
      focused = on;
    },
    update(dt, t, still) {
      shard.rotation.set(0.12 * Math.sin(t * 0.21), (Math.PI * 2 * t) / PHASE.turn, 0.06 * Math.sin(t * 0.33));
      const looked = hovered || focused, was = together;
      if (still) together = looked ? 1 : 0;
      // quick together, slow apart
      else together += ((looked ? 1 : 0) - together) * (1 - Math.exp(-dt / (looked ? PHASE.snap : PHASE.part)));
      if (was < 0.9 && together >= 0.9 && !still) flash = 1;
      flash *= Math.exp(-dt / PHASE.flash);
      const one = Math.min(1, Math.max(0, (together - 0.82) / 0.16)), apart = 1 - together;
      ghosts.forEach((g) => {
        // each drifts about its place off the shard, as far off as they are apart
        const d = PHASE.drift;
        g.mesh.position.copy(g.off).add(new THREE.Vector3(Math.sin(t * g.rate + g.phase) * d, Math.sin(t * g.rate * 1.3 + g.phase * 2) * d, Math.cos(t * g.rate * 0.9 + g.phase) * d)).multiplyScalar(apart);
        e.set(g.twist.x * apart, g.twist.y * apart, g.twist.z * apart);
        g.mesh.quaternion.copy(q.setFromEuler(e));
        g.u.uAlpha.value = PHASE.ghost * (1 - one);
        (g.lines.material as THREE.LineBasicMaterial).opacity = 0.12 * (1 - one);
        g.mesh.visible = one < 0.999;
      });
      solidU.uAlpha.value = one;
      solidU.uFlash.value = flash;
      (solidEdges.material as THREE.LineBasicMaterial).opacity = 0.45 * one;
      solid.visible = solidEdges.visible = one > 0.001;
      // the halo: faint apart, brighter as one, and the flash
      glow.strength = 0.04 + 0.08 * one + 0.3 * flash;
      for (const { g, rate, phase } of glints) g.strength = one * Math.max(0, Math.sin(t * rate + phase)) ** 16 + 0.8 * flash;
    },
    dispose() {
      edges.dispose();
      release(root);
    },
  };
}
