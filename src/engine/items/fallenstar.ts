import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { rawColor } from "@/engine/common/color";
import { facets, faceted, halo, haze, part, release, specks, type Item } from "./look";

/**
 * The star. Its burst: `shards` shards out every way from a white-hot core `core` across, each
 * `long` long (a range) and breathing (`breathe` of its length, as heat does); lit from within at
 * `heat`. Its embers: `embers` of them, each rising `rise` in its life of `life` seconds (a range),
 * wandering `wander` side to side as it goes, cooling from yellow-white to red and fading. Its
 * bloom: an inner halo and an outer, `bloom` strong. The cursor over it heats it (in about `warm`
 * seconds, cooling over `cool`): brighter all over, throbbing `throb` times a second. It tumbles
 * once in `turn` seconds.
 */
const STAR = {
  shards: 13,
  core: 0.17,
  long: [0.34, 0.62],
  breathe: 0.06,
  heat: 0.14,
  embers: 70,
  rise: 0.75,
  life: [2.2, 3.8],
  wander: 0.06,
  bloom: [0.4, 0.2],
  warm: 0.25,
  cool: 0.8,
  throb: 2.5,
  turn: 40,
};

/** A small seeded generator (mulberry32), so it is the same burst every time. */
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

/** A shard: a four-sided spike from just off the core out along +x, widest a third of the way. */
function shardGeometry(long: number, wide: number) {
  const w = wide, pts = [new THREE.Vector3(0.04, 0, 0), new THREE.Vector3(long, 0, 0)];
  for (const [y, z] of [[w, 0], [-w, 0], [0, w * 0.8], [0, -w * 0.8]]) pts.push(new THREE.Vector3(long * 0.34, y, z));
  return faceted(new ConvexGeometry(pts));
}

/**
 * Fallen star (top): a burst of orange and yellow shards out every way from a white-hot core, lit
 * from within, breathing a little as heat does, in a strong bloom, embers drifting up off it and
 * fading as they cool. The cursor over it makes it throb brighter. It tumbles slowly.
 */
export function makeFallenStar(): Item {
  const rand = seeded(20261004);
  const burst = new THREE.Group();
  // the core: white-hot
  const coreMaterial = facets("#ffffff", "#ffe7a6", 0.3);
  coreMaterial.uniforms.uFlashColour.value.set(1, 0.95, 0.8);
  coreMaterial.uniforms.uFlash.value = 0.5;
  burst.add(part(new THREE.IcosahedronGeometry(STAR.core, 0), coreMaterial, 20, 0.2));
  // the shards: out every way (spread evenly over a sphere, a little off), yellow and orange by turns
  const looks = [facets("#ffd84a", "#e8681a", 0.5), facets("#ff9a2e", "#b8300f", 0.5)];
  for (const m of looks) m.uniforms.uFlashColour.value.set(1, 0.6, 0.2);
  const shards = Array.from({ length: STAR.shards }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / STAR.shards, r = Math.sqrt(1 - y * y), a = i * 2.39996 + (rand() - 0.5) * 0.4;
    const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.25)).normalize();
    const long = STAR.long[0] + (STAR.long[1] - STAR.long[0]) * rand();
    const mesh = part(shardGeometry(long, 0.075 + 0.04 * rand()), looks[i % 2], 20, 0.35);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    burst.add(mesh);
    return { mesh, phase: rand() * Math.PI * 2, rate: 1.6 + rand() };
  });
  const body = new THREE.Group();
  body.add(burst);
  // the bloom: white-yellow close in, orange wide
  const inner = halo("#fff0b8", 1.1, STAR.bloom[0]), outer = halo("#ff6a12", 2.3, STAR.bloom[1]);
  // the embers: each its own life, from somewhere in the burst, rising and cooling
  const sparks = specks(STAR.embers, true);
  const embers = Array.from({ length: STAR.embers }, () => ({
    from: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.55),
    life: STAR.life[0] + (STAR.life[1] - STAR.life[0]) * rand(),
    phase: rand(),
    sway: rand() * Math.PI * 2,
    size: 0.03 + 0.03 * rand(),
  }));
  const hot = rawColor("#fff3c2"), warm = rawColor("#ffb347"), cold = rawColor("#e2401c");
  const under = haze("#ffb070", 1.7, 0.08);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, outer.mesh, inner.mesh, body, sparks.points);

  let hovered = false, heat = 0;
  const c = new THREE.Color();
  const place = (t: number) => {
    burst.rotation.set(0.3 + 0.2 * Math.sin(t * 0.13), (Math.PI * 2 * t) / STAR.turn, 0.1 * Math.sin(t * 0.17));
    shards.forEach((s) => s.mesh.scale.setScalar(1 + STAR.breathe * Math.sin(t * s.rate + s.phase)));
    embers.forEach((e, i) => {
      const f = (t / e.life + e.phase) % 1;
      const x = e.from.x + STAR.wander * Math.sin(t * 1.3 + e.sway), y = e.from.y + STAR.rise * f, z = e.from.z + STAR.wander * Math.cos(t * 1.1 + e.sway);
      sparks.positions.set([x, y, z], i * 3);
      // in quickly, out slowly, and smaller as it goes
      sparks.alphas[i] = Math.min(1, f / 0.08) * (1 - f) * (1 - f) * (0.8 + 0.6 * heat);
      sparks.sizes[i] = e.size * (1 - 0.6 * f);
      c.copy(hot).lerp(warm, Math.min(1, f * 2)).lerp(cold, Math.max(0, f * 2 - 1));
      sparks.colours.set([c.r, c.g, c.b], i * 3);
    });
    sparks.changed();
  };
  place(0);

  return {
    object: root,
    point(at) {
      hovered = !!at && Math.hypot(at.x, at.y) < 0.95;
    },
    update(dt, t, still) {
      heat = still ? (hovered ? 1 : 0) : heat + ((hovered ? 1 : 0) - heat) * (1 - Math.exp(-dt / (hovered ? STAR.warm : STAR.cool)));
      place(t);
      // a flicker always; hot, a throb brighter
      const flicker = 0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1), throb = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * STAR.throb);
      const bright = flicker * (1 + heat * (0.6 + 0.6 * throb));
      for (const m of looks) m.uniforms.uFlash.value = STAR.heat * bright;
      coreMaterial.uniforms.uFlash.value = 0.5 + 0.3 * heat * throb;
      inner.strength = STAR.bloom[0] * bright;
      outer.strength = STAR.bloom[1] * bright;
      burst.scale.setScalar(1 + 0.04 * heat * throb);
    },
    dispose() {
      release(root);
    },
  };
}
