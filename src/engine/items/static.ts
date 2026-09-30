import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { haze, release, type Item } from "./look";

/**
 * How it flickers: new static `rate` times a second; every `every` seconds or so (from `every[0]`
 * to `every[1]`) it almost resolves over `resolve` seconds, to `most` of the way at its clearest, its
 * flicker slowing to `slow` of its rate as it does; `cells` of static across its radius.
 */
const FLICKER = { rate: 24, every: [6, 10] as [number, number], resolve: 1.8, most: 0.66, slow: 0.3, cells: 26 };

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
 * A puff of the cloud. The static is laid in the view's plane about the cloud's middle (uCentre,
 * uScale: the cloud in view space), so it reads as a screen's snow, not a pattern on the puffs, and
 * so the shape it almost resolves into stands upright facing you: Urchi's face, its two eyes in a
 * soft round. Its edges go soft (the faces turned from you fade) and break up into the snow.
 */
const fragmentShader = /* glsl */ `
uniform vec3 uCentre;
uniform float uScale;
uniform float uFrame;
uniform float uResolve;
uniform float uCells;
uniform float uTime;
uniform vec3 uDark;
uniform vec3 uLight;
uniform vec3 uTintA;
uniform vec3 uTintB;
varying vec3 vN;
varying vec3 vP;
float hash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
/** Urchi's face as it almost comes through: its two eyes, dark in a soft light round, 0 off it. */
float face(vec2 q) {
  float head = smoothstep(0.75, 0.45, length(q * vec2(1.0, 1.1)));
  float eyes = smoothstep(0.14, 0.1, length(vec2(abs(q.x) - 0.23, q.y * 0.8)));
  return head * (1.0 - 0.85 * eyes);
}
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  vec2 q = (vP.xy - uCentre.xy) / uScale;
  vec2 cell = floor(q * uCells);
  float snow = hash(vec3(cell, uFrame));
  // a faint band rolling down the screen, and a line now and then pushed brighter
  float band = 0.5 + 0.5 * sin(q.y * 3.0 + uTime * 2.3);
  float line = step(0.93, hash(vec3(0.0, cell.y, floor(uFrame / 3.0))));
  float lum = snow * (0.8 + 0.25 * band) + 0.25 * line;
  // almost a picture: the snow leans toward the face, never all the way
  float pic = face(q);
  lum = mix(lum, 0.25 + 0.75 * pic + 0.25 * (snow - 0.5), uResolve);
  vec3 c = mix(uDark, uLight, clamp(lum, 0.0, 1.0));
  // the odd speck of colour, as a set's tube throws up
  float tint = hash(vec3(cell + 17.0, uFrame));
  c = mix(c, hash(vec3(cell - 5.0, uFrame)) > 0.5 ? uTintA : uTintB, step(0.988, tint) * 0.75);
  // soft edges, broken into the snow: the faces turned from you fade out, a cell at a time
  float edge = smoothstep(0.02, 0.75, dot(n, v));
  float a = edge * (0.55 + 0.45 * step(1.0 - edge, hash(vec3(cell, uFrame + 91.0)) + 0.2));
  gl_FragColor = vec4(c * a, a);
}`;

/**
 * Static puff (common): a small soft-edged cloud of grey and white TV static, flickering like a
 * channel with no signal. Every so often the flicker slows and it almost resolves into Urchi's
 * face, then breaks up again. Grey and white, specks of cyan and magenta its accent.
 */
export function makeStatic(): Item {
  const uniforms = {
    uCentre: { value: new THREE.Vector3() },
    uScale: { value: 1 },
    uFrame: { value: 0 },
    uResolve: { value: 0 },
    uCells: { value: FLICKER.cells },
    uTime: { value: 0 },
    uDark: { value: rawColor("#3a3d4a") },
    uLight: { value: rawColor("#f4f4f0") },
    uTintA: { value: rawColor("#5ff2ff") },
    uTintB: { value: rawColor("#ff6bd6") },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, premultipliedAlpha: true });
  const cloud = new THREE.Group();
  // five puffs, a big one in the middle and four round it, flattened a little
  const puffs: [number, number, number, number][] = [
    [0, 0.02, 0, 0.56],
    [-0.46, -0.1, 0.05, 0.38],
    [0.47, -0.06, -0.04, 0.4],
    [-0.16, 0.36, -0.06, 0.36],
    [0.2, -0.3, 0.12, 0.34],
  ];
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  for (const [x, y, z, r] of puffs) {
    const puff = new THREE.Mesh(geometry, material);
    puff.position.set(x, y, z);
    puff.scale.setScalar(r);
    cloud.add(puff);
  }
  cloud.scale.setScalar(1.05);
  // the snow is laid about the cloud's middle in view space, found as it is drawn
  const at = new THREE.Vector3(), size = new THREE.Vector3();
  cloud.children[0].onBeforeRender = (_r, _s, camera) => {
    at.setFromMatrixPosition(cloud.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    uniforms.uCentre.value.copy(at);
    uniforms.uScale.value = size.setFromMatrixScale(cloud.matrixWorld).x;
  };
  const root = new THREE.Group();
  const under = haze("#cfd4e6", 1.8, 0.07);
  under.position.set(0, -0.95, -0.5);
  root.add(under, cloud);

  // its clock's beats: when each near-picture starts, drawn once from a fixed sequence so a held clock holds it
  const starts: number[] = [];
  let next = 3.5, k = 1;
  while (next < 3600) {
    starts.push(next);
    k = (k * 16807) % 2147483647;
    next += FLICKER.every[0] + ((k / 2147483647) * (FLICKER.every[1] - FLICKER.every[0]));
  }
  /** How far it has resolved at time `t`, 0 .. FLICKER.most. */
  const resolved = (t: number) => {
    const s = t % 3600;
    for (const t0 of starts) {
      if (t0 > s) break;
      const p = (s - t0) / FLICKER.resolve;
      if (p < 1) return FLICKER.most * Math.sin(Math.PI * p) ** 2;
    }
    return 0;
  };
  let frame = 0, clock = 0;

  return {
    object: root,
    update(dt, t, still) {
      const r = resolved(t);
      uniforms.uResolve.value = r;
      uniforms.uTime.value = t;
      // new static at its rate, slower as it resolves; held still, it keeps one frame of snow
      if (!still) {
        clock += dt * FLICKER.rate * (1 - (1 - FLICKER.slow) * (r / FLICKER.most));
        frame = Math.floor(clock);
      } else frame = Math.floor(t * FLICKER.rate);
      uniforms.uFrame.value = frame % 997;
      cloud.rotation.set(0.15 * Math.sin(t * 0.21), t * 0.18, 0.08 * Math.sin(t * 0.17));
    },
    dispose() {
      geometry.dispose();
      release(root);
    },
  };
}
