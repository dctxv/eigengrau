import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { facets, halo, haze, part, release, type Item } from "./look";
import { glowLines, type GlowLine } from "./lines";

/**
 * The school, swimming about inside an invisible ball: all through it, toward you and away as much
 * as across, never round and round one way. The first fish leads, as a fish swims: on a heading
 * that turns smoothly, never tighter than a turn `turn` across (item units), wandering (its turning
 * drifts, settling over about `wander.settle` of distance, kicked about by `wander.kick`), and
 * turning back in as it nears the ball's edge: from `edge.from` out from the middle, turning back in
 * takes over from wandering, all of it by `edge.ball`, and it turns toward the inside, slanted
 * `edge.slant` the way it was wandering (so it veers a different way each time, and never goes round
 * and round one way). Its path is swum once, from a seed, and kept (see swim), so where it is is a
 * function of how far it has gone. It goes `pace` a second, and every `dart.every` seconds darts on
 * `dart.far` more in `dart.quick` seconds. Each of the others takes the very path it took, `places`
 * behind it (how far back along it, to the side and up), so they turn where it turned. Their tails
 * wag `wag` times a second, faster as they dart; each leaves a short glowing trail `trail.points`
 * long, a point every `trail.step` seconds (so short as they glide, and drawn out as they dart),
 * `trail.width` wide at its start. (All of these in the units the item fits a sphere of radius 1 in.)
 */
const SCHOOL = {
  turn: 0.36,
  wander: { settle: 0.35, kick: 6 },
  edge: { from: 0.18, ball: 0.44, slant: 0.3 },
  pace: 0.22,
  dart: { every: 2.4, far: 0.45, quick: 0.42 },
  wag: 2.2,
  trail: { points: 10, step: 0.075, width: 0.032 },
};
const PLACES: [number, number, number][] = [
  [0, 0, 0],
  [0.2, 0.13, 0.03],
  [0.21, -0.13, -0.03],
  [0.4, 0.05, 0.1],
  [0.41, -0.06, -0.1],
  [0.58, 0, 0.01],
];
/** How big a fish is (its model is about a third of the item's radius long, nose to tail tip). */
const FISH = 0.72;

/** How far the school has gone at `t` (its clock goes round once an hour): steadily on, and every so often a dart (smooth in and out). */
function progress(t: number) {
  const { every, far, quick } = SCHOOL.dart, u = t % 3600, n = Math.floor(u / every), f = Math.min(1, (u - n * every) / quick);
  return u * SCHOOL.pace + far * (n + f * f * f * (f * (f * 6 - 15) + 10));
}

/** A small seeded generator (mulberry32), so it is the same swim every time. */
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

/**
 * The leader's path, swum a step of `STEP` at a time from a seed and kept, as far as it has been
 * asked for (it starts a little before where the school starts, for those behind): where it is,
 * how far along, and its way on and its turn there (the turn: toward the middle of the turn, as
 * big as the turn is tight).
 */
const STEP = 0.01, BEFORE = 2;
function swim() {
  const rand = seeded(20261001), kick = () => rand() + rand() + rand() - 1.5;
  const pts: number[] = [];
  const p = new THREE.Vector3(0.1, 0, 0), heading = new THREE.Vector3(-0.3, 0.2, 1).normalize(), spin = new THREE.Vector3();
  const most = 2 / SCHOOL.turn, n = new THREE.Vector3(), steer = new THREE.Vector3(), want = new THREE.Vector3(), turning = new THREE.Vector3();
  const extend = (to: number) => {
    while (pts.length / 3 <= to) {
      pts.push(p.x, p.y, p.z);
      // its turning drifts, and is kicked about
      spin.multiplyScalar(1 - STEP / SCHOOL.wander.settle).add(n.set(kick(), kick(), kick()).multiplyScalar(SCHOOL.wander.kick * Math.sqrt(STEP)));
      // (it only ever turns, never rolls along its way: and never tighter than it can)
      spin.addScaledVector(heading, -spin.dot(heading));
      if (spin.length() > most) spin.setLength(most);
      // near the edge, turning back in takes over: toward the inside, slanted the way it was
      // wandering, the harder the further it points from there
      const r = p.length(), f = Math.min(1, Math.max(0, (r - SCHOOL.edge.from) / (SCHOOL.edge.ball - SCHOOL.edge.from))), w = f * f * (3 - 2 * f);
      turning.copy(spin);
      if (w > 0) {
        want.copy(p).multiplyScalar(-1 / r).addScaledVector(steer.crossVectors(spin, heading), SCHOOL.edge.slant).normalize();
        const off = Math.acos(Math.min(1, Math.max(-1, heading.dot(want))));
        steer.crossVectors(heading, want);
        if (steer.lengthSq() < 1e-12) steer.set(0, 1, 0);
        turning.multiplyScalar(1 - w).addScaledVector(steer.normalize(), most * w * Math.min(1, off / 0.8));
        if (turning.length() > most) turning.setLength(most);
      }
      heading.addScaledVector(n.crossVectors(turning, heading), STEP).normalize();
      p.addScaledVector(heading, STEP);
    }
  };
  const at = (i: number) => new THREE.Vector3(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
  // (the way on and the turn at a kept point, from its neighbours a few steps off, so they are smooth)
  const way = (i: number) => at(i + 2).sub(at(i - 2)).divideScalar(4 * STEP);
  const bend = (i: number) => at(i + 3).add(at(i - 3)).addScaledVector(at(i), -2).divideScalar(9 * STEP * STEP);
  return (gone: number) => {
    const f = (gone + BEFORE) / STEP, i = Math.max(3, Math.floor(f)), k = f - Math.floor(f);
    extend(i + 5);
    return {
      at: at(i).lerp(at(i + 1), k),
      on: way(i).lerp(way(i + 1), k).normalize(),
      turn: bend(i).lerp(bend(i + 1), k),
    };
  };
}

const UP = new THREE.Vector3(0, 1, 0), TOWARD = new THREE.Vector3(0, 0, 1);

/**
 * Fish `i` at `t`, along `path`: where it is, which way it faces (x its nose, y its back, z its
 * side), and how fast it is going against its glide. It banks into its turns, its back leaning
 * toward the turn's middle, as nothing holds it upright out here.
 */
function pose(path: ReturnType<typeof swim>, i: number, t: number) {
  const [back, side, up] = PLACES[i], gone = progress(t) - back;
  const { at, on: nose, turn } = path(gone);
  const inward = turn.clone().addScaledVector(nose, -turn.dot(nose));
  // its back toward up, or (as it heads up or down, where up is no guide) toward you, eased
  // between; and leaning into the turn, the tighter the turn the more (so as a turn one way
  // becomes a turn the other, it comes upright and leans the other way, never flips)
  const vertical = Math.min(1, Math.max(0, (Math.abs(nose.y) - 0.6) / 0.35));
  const hint = UP.clone().lerp(TOWARD, vertical * vertical * (3 - 2 * vertical)).normalize();
  const tight = inward.length();
  if (tight > 1e-6) hint.addScaledVector(inward.normalize(), Math.min(0.8, 0.15 * tight));
  const flank = new THREE.Vector3().crossVectors(nose, hint).normalize(), topside = new THREE.Vector3().crossVectors(flank, nose);
  // its place in the school, and a little way of its own
  at.addScaledVector(flank, side + 0.012 * Math.sin(t * 2.3 + i * 1.7)).addScaledVector(topside, up + 0.012 * Math.sin(t * 1.9 + i * 2.9));
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(nose, topside, flank));
  const speed = (progress(t + 0.01) - progress(t - 0.01)) / 0.02 / SCHOOL.pace;
  return { at, q, speed, gone };
}

/** A fish's body: a spindle, pointed at its nose, narrow at its tail, flattened side to side (nose along +x). */
function bodyGeometry() {
  const profile = [
    [0, 0.155],
    [0.03, 0.125],
    [0.05, 0.07],
    [0.052, 0.01],
    [0.036, -0.05],
    [0.017, -0.095],
    [0, -0.1],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(profile, 6);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, 1, 0.66);
  return g;
}

/** A flat fin from its outline (x forward, y up), both sides drawn. */
function fin(outline: [number, number][]) {
  const g = new THREE.BufferGeometry();
  const tris: number[] = [];
  for (let i = 1; i < outline.length - 1; i++) for (const k of [0, i, i + 1]) tris.push(outline[k][0], outline[k][1], 0);
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris, 3));
  g.computeVertexNormals();
  return g;
}

/** The glowing tail: white-cyan at its root, cyan to its tips, lit from within (so it blooms with its trail). */
function tailMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uRoot: { value: rawColor("#c8fdff") }, uTip: { value: rawColor("#3fdcff") } },
    vertexShader: `varying float vOut; void main() { vOut = -position.x / 0.075; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uRoot; uniform vec3 uTip; varying float vOut; void main() { gl_FragColor = vec4(mix(uRoot, uTip, clamp(vOut, 0.0, 1.0)), 1.0); }`,
    side: THREE.DoubleSide,
  });
}

/** One minnow: its body, an eye each side, a small fin on its back, and its tail on a pivot to wag. */
function minnow() {
  const fish = new THREE.Group();
  const sway = new THREE.Group();
  fish.add(sway);
  sway.add(part(bodyGeometry(), facets("#dcebf7", "#3d5f88", 0.7), 25, 0.32));
  const back = new THREE.Mesh(fin([[0.03, 0.03], [-0.04, 0.03], [-0.02, 0.075]]), Object.assign(facets("#c9dcee", "#3a5a82", 0.5), { side: THREE.DoubleSide }));
  sway.add(back);
  for (const z of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.011), facets("#2a3140", "#06080b", 0.3));
    eye.position.set(0.1, 0.014, z * 0.027);
    sway.add(eye);
  }
  const tail = new THREE.Group();
  tail.position.x = -0.098;
  tail.add(new THREE.Mesh(fin([[0, 0], [-0.075, 0.055], [-0.052, 0], [-0.075, -0.055]]), tailMaterial()));
  sway.add(tail);
  return { fish, sway, tail };
}

/**
 * Comet minnows (uncommon, a creature): six tiny silver-blue fish with short glowing cyan tails,
 * swimming as a school as fish swim with nothing holding them up: all about an invisible ball, near
 * and far as much as across, wandering and turning back in at its edge, darting on every so often
 * and gliding between, banking into their turns, tails wagging faster as they dart. The first one leads and the rest go exactly where it went (see SCHOOL), so they turn
 * together, a ripple running back through them. Each leaves a short glowing trail, like a comet's.
 */
export function makeMinnows(): Item {
  const school = new THREE.Group();
  const path = swim();
  const fishes = PLACES.map(() => minnow());
  fishes.forEach((f) => {
    f.fish.scale.setScalar(FISH);
    school.add(f.fish);
  });
  const trailAt = (i: number, t: number): GlowLine => {
    const { points, step, width } = SCHOOL.trail;
    const pts = Array.from({ length: points }, (_, k) => {
      const p = pose(path, i, t - k * step);
      return new THREE.Vector3(-0.1 * FISH, 0, 0).applyQuaternion(p.q).add(p.at);
    });
    return { pts, width: pts.map((_, k) => width * (1 - (0.8 * k) / (points - 1))) };
  };
  const trails = glowLines(
    PLACES.map((_, i) => trailAt(i, 0)),
    {
      core: "#e6ffff",
      glow: "#3fe6ff",
      spread: 2.6,
      depthTest: true,
      // brightest at the tail, gone at its end
      shade: `float shade(float along, float line, float bent) { return 1.2 * pow(1.0 - along, 1.4); }`,
    },
  );
  school.add(trails.mesh);
  const glow = halo("#46d8ff", 1.4, 0.07);
  const under = haze("#8fdcff", 1.6, 0.04);
  under.position.set(0, -1.0, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, school);

  const place = (t: number) => {
    fishes.forEach((f, i) => {
      const p = pose(path, i, t);
      f.fish.position.copy(p.at);
      f.fish.quaternion.copy(p.q);
      // the tail wags (harder and quicker as it darts), the head sways a little against it
      const dart = Math.min(1, (p.speed - 1) / 3), beat = Math.PI * 2 * SCHOOL.wag * (t + 1.5 * p.gone) + i;
      f.tail.rotation.y = (0.35 + 0.3 * dart) * Math.sin(beat);
      f.sway.rotation.y = -(0.08 + 0.06 * dart) * Math.sin(beat - 0.6);
    });
    trails.set(PLACES.map((_, i) => trailAt(i, t)));
    // (a faint glow round the school, wherever it is)
    const middle = fishes.reduce((m, f) => m.add(f.fish.position), new THREE.Vector3()).divideScalar(fishes.length);
    glow.mesh.position.set(middle.x, middle.y, middle.z - 0.3);
  };
  place(0);

  return {
    object: root,
    // a small school in a big ball: Space draws it three times as big, so the fish read
    scale: 3,
    update(_dt, t) {
      place(t);
    },
    dispose() {
      release(root);
    },
  };
}
