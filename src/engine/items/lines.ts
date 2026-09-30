import * as THREE from "three";
import { rawColor } from "@/engine/common/color";

/** A glowing line: its points, and how far its glow reaches from it (at each point, or all along it). */
export type GlowLine = { pts: THREE.Vector3[]; width: number | number[] };

export type GlowLinesLook = {
  /** Its core's colour and its glow's. */
  core?: string;
  glow?: string;
  /** How much narrower its core is than its glow. */
  spread?: number;
  /**
   * GLSL, `vec4 bend(vec3 view)`: where a point of a line is drawn (xyz, view space) given where it
   * is, and a number (w) handed on to shade; with its own uniforms declared. By default, where it is.
   */
  bend?: string;
  /**
   * GLSL, `float shade(float along, float line, float bent)`: how bright a line is a share `along`
   * of the way from its start, for line number `line`, `bent` what bend handed on; with its own
   * uniforms declared. By default 1.
   */
  shade?: string;
  /** The uniforms bend and shade declare. */
  uniforms?: Record<string, THREE.IUniform>;
  /** Hidden behind what is in front of it (what writes depth), or drawn over everything. */
  depthTest?: boolean;
};

const vertex = (bend: string) => /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aPrev;
attribute vec3 aNext;
attribute vec2 aJoin;
attribute float aEnd;
attribute float aSide;
attribute vec2 aWidth;
attribute vec2 aAlong;
attribute float aLine;
uniform vec4 uViewport;
varying vec2 vUV;
varying float vLen;
varying float vAlong;
varying float vLine;
varying float vBent;
flat varying vec4 vCutA;
flat varying vec4 vCutB;
flat varying vec2 vJoin;
${bend}
vec3 view(vec3 p) {
  return bend((modelViewMatrix * vec4(p, 1.0)).xyz).xyz;
}
vec2 onScreen(vec3 p) {
  vec4 c = projectionMatrix * vec4(view(p), 1.0);
  return (c.xy / c.w * 0.5 + 0.5) * uViewport.zw + uViewport.xy;
}
// where a line bends at 'at', on its way from 'from' to 'to': the line that halves the bend, as a
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
  vec4 ba = bend((modelViewMatrix * vec4(aA, 1.0)).xyz), bb = bend((modelViewMatrix * vec4(aB, 1.0)).xyz);
  vec2 d = bb.xy - ba.xy;
  float len = length(d), wA = aWidth.x * scale, wB = aWidth.y * scale, w = mix(wA, wB, aEnd), mid = 0.5 * (wA + wB);
  vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0), across = vec2(-dir.y, dir.x);
  vec4 P = vec4(mix(ba.xyz, bb.xyz, aEnd), 1.0);
  P.xy += across * aSide * w + dir * (aEnd * 2.0 - 1.0) * w;
  vLen = len / mid;
  vUV = vec2(aEnd * (vLen + 2.0) - 1.0, aSide);
  vAlong = mix(aAlong.x, aAlong.y, aEnd);
  vLine = aLine;
  vBent = mix(ba.w, bb.w, aEnd);
  vJoin = aJoin;
  vCutA = aJoin.x > 0.5 ? cut(aPrev, aA, aB) : vec4(0.0);
  vCutB = aJoin.y > 0.5 ? cut(aA, aB, aNext) : vec4(0.0);
  gl_Position = projectionMatrix * P;
}`;

const fragment = (shade: string) => /* glsl */ `
uniform vec3 uCore;
uniform vec3 uGlowColour;
uniform float uSpread;
varying vec2 vUV;
varying float vLen;
varying float vAlong;
varying float vLine;
varying float vBent;
flat varying vec4 vCutA;
flat varying vec4 vCutB;
flat varying vec2 vJoin;
${shade}
void main() {
  // (before the bend at its start is the piece before's; past the bend at its end, the next one's)
  if (vJoin.x > 0.5 && dot(gl_FragCoord.xy - vCutA.xy, vCutA.zw) <= 0.0) discard;
  if (vJoin.y > 0.5 && dot(gl_FragCoord.xy - vCutB.xy, vCutB.zw) > 0.0) discard;
  // how far from its line, in its glow's widths (round past its ends)
  float r = length(vec2(max(0.0, max(-vUV.x, vUV.x - vLen)), vUV.y));
  float core = exp(-r * r * uSpread * uSpread * 3.5), glow = exp(-r * r * 3.0) * (1.0 - smoothstep(0.7, 1.0, r));
  gl_FragColor = vec4((uCore * core + uGlowColour * glow * 0.4) * shade(vAlong, vLine, vBent), 1.0);
}`;

/** The lines' pieces, four corners each, each knowing the points either side of it along its line (where it has them), for the bends. */
function geometry(lines: GlowLine[]) {
  const a: number[] = [], b: number[] = [], prev: number[] = [], next: number[] = [], join: number[] = [], end: number[] = [], side: number[] = [];
  const width: number[] = [], along: number[] = [], line: number[] = [], index: number[] = [];
  lines.forEach((l, n) => {
    const m = l.pts.length, run = [0];
    for (let i = 1; i < m; i++) run.push(run[i - 1] + l.pts[i].distanceTo(l.pts[i - 1]));
    const w = (i: number) => (typeof l.width === "number" ? l.width : l.width[i]);
    for (let i = 0; i < m - 1; i++) {
      const A = l.pts[i], B = l.pts[i + 1], P = l.pts[Math.max(0, i - 1)], N = l.pts[Math.min(m - 1, i + 2)], o = a.length / 3;
      for (let k = 0; k < 4; k++) {
        a.push(A.x, A.y, A.z);
        b.push(B.x, B.y, B.z);
        prev.push(P.x, P.y, P.z);
        next.push(N.x, N.y, N.z);
        join.push(i > 0 ? 1 : 0, i + 2 < m ? 1 : 0);
        end.push(k >> 1);
        side.push(k & 1 ? 1 : -1);
        width.push(w(i), w(i + 1));
        along.push(run[i] / run[m - 1], run[i + 1] / run[m - 1]);
        line.push(n);
      }
      index.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
    }
  });
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
  g.setAttribute("aWidth", f(width, 2));
  g.setAttribute("aAlong", f(along, 2));
  g.setAttribute("aLine", f(line, 1));
  g.setIndex(index);
  return g;
}

/**
 * Glowing lines, each piece of each a ribbon facing you, as wide as its glow and round past its
 * ends, its core bright and its glow soft, light added to what is under it (so it blooms). Where a
 * line bends, the line that halves the bend splits the pixels between its two pieces (each as
 * bright as the other along it), so their light meets once and never doubles: no bright beads at
 * its joins. Bend them about and shade them along their length with `look`; move them (lines of
 * the same number of points each as they were made with) with `set`.
 */
export function glowLines(lines: GlowLine[], look: GlowLinesLook = {}) {
  const uniforms = {
    uCore: { value: rawColor(look.core ?? "#ffffff") },
    uGlowColour: { value: rawColor(look.glow ?? "#ffffff") },
    uSpread: { value: look.spread ?? 3.2 },
    uViewport: { value: new THREE.Vector4() },
    ...look.uniforms,
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex(look.bend ?? "vec4 bend(vec3 v) { return vec4(v, 0.0); }"),
    fragmentShader: fragment(look.shade ?? "float shade(float along, float line, float bent) { return 1.0; }"),
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: look.depthTest ?? false,
    blending: THREE.AdditiveBlending,
    // (a ribbon's winding goes either way as it faces you: both sides are drawn)
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry(lines), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  // (where on the drawing buffer it is being drawn, for the bends' lines, which are in its pixels)
  mesh.onBeforeRender = (renderer) => renderer.getCurrentViewport(uniforms.uViewport.value);
  return {
    mesh,
    uniforms,
    set(next: GlowLine[]) {
      const g = geometry(next);
      for (const name of ["position", "aA", "aB", "aPrev", "aNext", "aWidth", "aAlong"]) {
        const to = mesh.geometry.getAttribute(name) as THREE.BufferAttribute;
        (to.array as Float32Array).set(g.getAttribute(name).array as Float32Array);
        to.needsUpdate = true;
      }
      g.dispose();
    },
  };
}
