import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import type { OceanLook } from "../Planets";
import { rng, type Resolved } from "../tune";
import { bakeMap, bakeMaterial, type Kind } from "./bake";
import { EQUIRECT, FRAME, GLOW_REACH, NOISE, PLANET_MAIN } from "./glsl";

/**
 * Where the clouds are, a quarter of the surface's resolution (it changes slowly): 0 clear sky .. 1
 * the heart of a bank of cloud, so that `cover` of the planet is under some. A soft fractal, pushed
 * about by another (domain warping), so the banks curl.
 */
const COVER = /* glsl */ `
varying vec2 vUv;
uniform vec3 uSeed;
uniform float uCover;
${EQUIRECT}
${NOISE}
void main() {
  vec3 p = sphereAt(vUv);
  vec3 w = p * 1.3 + uSeed.zxy;
  vec3 warp = vec3(snoise(w), snoise(w + 17.1), snoise(w + 41.7));
  float c = fbm(p * 1.8 + warp * 0.4 + uSeed, 4) * 0.5 + 0.5;
  gl_FragColor = vec4(0.0, smoothstep(1.0 - uCover - 0.16, 1.0 - uCover + 0.2, c), 0.0, 1.0);
}`;

/**
 * The surface: r the sea floor's height (0 .. 1: the islands are its peaks, and the shallows round
 * them), g the clouds' height and b, a its slope east and north (0.5 flat, 0 .. 1 a slope of -4 .. 4).
 *
 * The clouds are cumulus as they are drawn in anime: heaps of round puffs. Three layers of domes,
 * each scattered through 3D cells and set on the sphere, as big as the cloud cover under them
 * allows: the biggest only in the heart of a bank, the smaller ones out to its fringes, so a bank
 * is a few big heaps with smaller puffs round them. Where they overlap the tallest wins, and its
 * slope is the dome's own (a hemisphere's), which the planet's shader lights: tops white in the
 * sun, the sides turned from it blue-grey, a crease where one puff meets the next.
 */
const SURFACE = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uCoverMap;
uniform vec3 uSeed;
uniform float uPuff;
${EQUIRECT}
${NOISE}
float coverAt(vec3 p) { return texture2D(uCoverMap, equirect(p)).g; }
/** The tallest dome of a layer here, or \`best\` if that is taller: its height, and its 3D gradient. */
vec4 puffs(vec4 best, vec3 p, float size, float most, vec2 grow, float salt) {
  vec3 i = floor(p / size);
  for (int z = -1; z <= 1; z++)
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec3 id = i + vec3(x, y, z);
    vec3 h = hash33(id + salt);
    vec3 c = normalize((id + 0.15 + 0.7 * h) * size);
    float r = most * smoothstep(grow.x, grow.y, coverAt(c)) * (0.6 + 0.4 * hash33(id.zxy + salt * 1.7).x);
    vec3 d = p - c;
    float h2 = r * r - dot(d, d);
    if (h2 > best.x * best.x) {
      float t = sqrt(h2);
      best = vec4(t, -d / max(t, 1e-4));
    }
  }
  return best;
}
void main() {
  vec3 p = sphereAt(vUv);
  float bed = 0.5 + 0.5 * (0.85 * fbm(p * 1.9 + uSeed.yzx, 5) + 0.15 * snoise(p * 6.5 + uSeed));
  float s = uPuff, top = 0.15 * s;
  vec4 m = vec4(0.0);
  m = puffs(m, p, 0.2 * s, top, vec2(0.45, 0.95), 1.0);
  m = puffs(m, p, 0.1 * s, 0.075 * s, vec2(0.22, 0.8), 7.0);
  m = puffs(m, p, 0.05 * s, 0.038 * s, vec2(0.08, 0.55), 13.0);
  vec2 slope = m.x > 0.0 ? clamp(vec2(dot(m.yzw, eastAt(p)), dot(m.yzw, northAt(p))), -4.0, 4.0) : vec2(0.0);
  gl_FragColor = vec4(bed, m.x / top, 0.5 + slope / 8.0);
}`;

/**
 * The ocean world as it is drawn: the sea from its floor (deep, turquoise, pale over the shallows),
 * islands if its look lets any out, the clouds' shadows cast toward the night, a soft
 * sun glint; night, and a warm
 * band at the terminator; the haze where the sea meets the air; then the clouds, their puffs lit
 * by their own slopes against the sun (cel-stepped: white tops, blue-grey underneath), on a layer
 * that turns a little faster than the sea. Last, the thin rim on the lit limb, and its bloom
 * spreading out into space.
 */
const DRAW = /* glsl */ `
uniform sampler2D uMap;
uniform mat3 uClouds;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uShallow;
uniform vec3 uNight;
uniform vec3 uSand;
uniform vec3 uGreen;
uniform float uLand;
uniform float uGlint;
uniform float uGlintPower;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
uniform vec3 uCloudNight;
uniform vec2 uCloudStep;
uniform float uBump;
uniform float uShadow;
uniform float uReach;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uHazePower;
uniform vec3 uDusk;
uniform float uDuskAmount;
uniform vec3 uRim;
uniform float uRimWidth;
uniform vec3 uGlow;
uniform float uGlowWidth;
uniform float uGlowAmount;
${FRAME}
void main() {
${PLANET_MAIN}
  // the sea's own frame and the clouds', and where a cloud's shadow on the sea is cast from
  vec3 ps = uBody * n, pc = uClouds * n;
  vec3 lc = uClouds * uLight;
  vec3 from = normalize(pc + (lc - dot(lc, pc) * pc) * uReach);
  vec4 sea = onSphere(uMap, ps, uBody * nf, cell);
  vec4 sky = onSphere(uMap, pc, uClouds * nf, cell);
  vec4 fall = onSphere(uMap, from, uClouds * nf, cell);

  float ndl = dot(n, uLight);
  float day = smoothstep(-0.08, 0.34, ndl);
  float dusk = smoothstep(-0.18, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.3, ndl));
  float hazeLit = smoothstep(-0.25, 0.55, ndl);
  float limb = pow(1.0 - n.z, uHazePower);

  // the sea, and the islands at the floor's peaks
  float bed = sea.r;
  vec3 col = mix(uDeep, uMid, smoothstep(0.22, 0.7, bed));
  col = mix(col, uShallow, smoothstep(uLand - 0.1, uLand - 0.004, bed));
  float land = smoothstep(uLand, uLand + 0.012, bed);
  col = mix(col, mix(uSand, uGreen, smoothstep(uLand + 0.025, uLand + 0.065, bed)), land);
  float puff = smoothstep(0.02, 0.09, sky.g);
  float shadow = smoothstep(0.02, 0.09, fall.g) * (1.0 - puff);
  col *= 1.0 - uShadow * shadow;
  vec3 half_ = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float glint = pow(max(dot(n, half_), 0.0), uGlintPower) * uGlint * (1.0 - land) * (1.0 - shadow);
  col = mix(uNight, col, day) + glint * day;
  col = mix(col, uDusk, dusk * uDuskAmount * 0.6);
  col = mix(col, uHaze, limb * uHazeAmount * hazeLit);

  // the clouds: each puff lit by its own slope, stepped from blue-grey to white
  vec2 g = (sky.ba * 2.0 - 1.0) * 4.0;
  mat3 back = transpose(uClouds);
  vec3 nc = normalize(n - uBump * (g.x * (back * eastAt(pc)) + g.y * (back * northAt(pc))));
  vec3 cloud = mix(uCloudShade, uCloudLit, smoothstep(uCloudStep.x, uCloudStep.y, dot(nc, uLight)));
  cloud = mix(cloud, uDusk, dusk * uDuskAmount);
  cloud = mix(uCloudNight, cloud, smoothstep(-0.1, 0.32, ndl));
  cloud = mix(cloud, uHaze, limb * uHazeAmount * 0.45 * hazeLit);
  col = mix(col, cloud, puff);

  // the lit limb: a thin rim just inside it, and outside, the rim and its bloom going out into space
  float lit = limbLight(dir, vec2(-0.2, 0.6));
  float rimPx = max(1.2, uRimWidth * uRadius), glowPx = max(2.5, uGlowWidth * uRadius);
  col = mix(col, uRim, exp(-max(0.0, 1.0 - r) * uRadius / rimPx) * lit * 0.7);
  float out_ = max(0.0, r - 1.0) * uRadius, near = exp(-out_ / rimPx);
  float air = lit * (0.85 * near + uGlowAmount * exp(-out_ / glowPx) * glowEnd(out_, glowPx));
  vec3 airCol = mix(uGlow, uRim, near);

  float cov = coverage(r);
  gl_FragColor = (vec4(col, 1.0) * cov + vec4(airCol, 1.0) * clamp(air, 0.0, 1.0) * (1.0 - cov)) * uFade;
}`;

/** The noise's offset for a seed: somewhere else in it for every planet. */
function seedVector(seed: number) {
  const r = rng(seed ^ 0x9e3779b9);
  return new THREE.Vector3(r() * 100, r() * 100, r() * 100);
}

const colour = (hex: string, out: THREE.Color) => out.copy(rawColor(hex));
const TURN = new THREE.Matrix4();

/** The ocean world's look, its ranges picked. */
type Look = Resolved<OceanLook>;

export const OCEAN: Kind<Look> = {
  bake(seed, look, width) {
    const o = look.bake, w = Math.max(64, Math.round(width / 2) * 2), s = seedVector(seed);
    const cover = bakeMaterial(COVER, { uSeed: { value: s }, uCover: { value: o.cover } });
    const surface = bakeMaterial(SURFACE, { uSeed: { value: s }, uPuff: { value: o.puff }, uCoverMap: { value: null } });
    return {
      materials: [cover, surface],
      run(renderer) {
        const bank = bakeMap(renderer, cover, Math.max(16, w / 4), Math.max(8, w / 8), false);
        surface.uniforms.uCoverMap.value = bank.texture;
        const map = bakeMap(renderer, surface, w, w / 2);
        bank.dispose();
        return { maps: { uMap: map.texture }, dispose: () => map.dispose() };
      },
      dispose() {
        cover.dispose();
        surface.dispose();
      },
    };
  },
  baked: (look) => [look.bake.cover, look.bake.puff],
  fragment: DRAW,
  uniforms() {
    const c = () => ({ value: new THREE.Color() });
    return {
      uMap: { value: null },
      uClouds: { value: new THREE.Matrix3() },
      uDeep: c(), uMid: c(), uShallow: c(), uNight: c(), uSand: c(), uGreen: c(),
      uLand: { value: 1 },
      uGlint: { value: 0 },
      uGlintPower: { value: 1 },
      uCloudLit: c(), uCloudShade: c(), uCloudNight: c(),
      uCloudStep: { value: new THREE.Vector2() },
      uBump: { value: 1 },
      uShadow: { value: 0 },
      uReach: { value: 0 },
      uHaze: c(),
      uHazeAmount: { value: 0 },
      uHazePower: { value: 1 },
      uDusk: c(),
      uDuskAmount: { value: 0 },
      uRim: c(),
      uRimWidth: { value: 0 },
      uGlow: c(),
      uGlowWidth: { value: 0 },
      uGlowAmount: { value: 0 },
    };
  },
  look(u, o) {
    colour(o.deep, u.uDeep.value);
    colour(o.mid, u.uMid.value);
    colour(o.shallow, u.uShallow.value);
    colour(o.night, u.uNight.value);
    colour(o.sand, u.uSand.value);
    colour(o.green, u.uGreen.value);
    // islands 0 leaves the floor's every peak under water; 1 lets a good share of it out
    u.uLand.value = 1.1 - 0.46 * o.islands;
    u.uGlint.value = o.glint;
    u.uGlintPower.value = o.glintPower;
    colour(o.clouds.lit, u.uCloudLit.value);
    colour(o.clouds.shade, u.uCloudShade.value);
    colour(o.clouds.night, u.uCloudNight.value);
    u.uCloudStep.value.set(o.clouds.step.from, o.clouds.step.to);
    u.uBump.value = o.clouds.bump;
    u.uShadow.value = o.clouds.shadow;
    u.uReach.value = o.clouds.reach;
    colour(o.haze.colour, u.uHaze.value);
    u.uHazeAmount.value = o.haze.amount;
    u.uHazePower.value = o.haze.power;
    colour(o.dusk.colour, u.uDusk.value);
    u.uDuskAmount.value = o.dusk.amount;
    colour(o.rim.colour, u.uRim.value);
    u.uRimWidth.value = o.rim.width;
    colour(o.glow.colour, u.uGlow.value);
    u.uGlowWidth.value = o.glow.width;
    u.uGlowAmount.value = o.glow.amount;
  },
  turn(u, spin, axis, look) {
    // the cloud layer: the same axis, turned `drift` times as far
    TURN.makeRotationY(spin * (look.clouds.drift - 1)).premultiply(axis);
    u.uClouds.value.setFromMatrix4(TURN).transpose();
  },
  reach: (look) => 0.05 + GLOW_REACH * look.glow.width,
};
