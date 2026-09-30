import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { facets, halo, haze, part, release, type Item } from "./look";
import { glowLines, type GlowLine } from "./lines";

/**
 * The school. It swims a loop (its half sizes across, up and deep) that turns once in `drift`
 * seconds, `pace` of the way round a second, and every `dart.every` seconds darts on `dart.far` more
 * of it in `dart.quick` seconds. The first fish leads; each of the others takes the very path it
 * took, `places` behind it (how far back, to the side and up, in its lengths of loop), so they turn
 * where it turned. Their tails wag `wag` times a second, faster as they dart; each leaves a short
 * glowing trail `trail.points` long, a point every `trail.step` seconds (so short as they glide,
 * and drawn out as they dart), `trail.width` wide at its start. (All of these in the units the item fits a sphere of radius 1 in.)
 */
const SCHOOL = {
  loop: [0.52, 0.28, 0.36],
  drift: 46,
  pace: 0.5,
  dart: { every: 2.4, far: 1.15, quick: 0.42 },
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
/** Loop turned per length behind (about how far round the loop a length of it is). */
const PER_LENGTH = 2.1;

/** How far round its loop the school is at `t`: steadily on, and every so often a dart (smooth in and out). */
function progress(t: number) {
  const { every, far, quick } = SCHOOL.dart, n = Math.floor(t / every), f = Math.min(1, (t - n * every) / quick);
  return t * SCHOOL.pace + far * (n + f * f * f * (f * (f * 6 - 15) + 10));
}

/** The loop, `s` of the way round, and its way on and its bend there. */
function loop(s: number) {
  const [a, b, c] = SCHOOL.loop;
  return {
    at: new THREE.Vector3(a * Math.sin(s), b * Math.sin(2 * s + 0.5), c * Math.cos(s)),
    on: new THREE.Vector3(a * Math.cos(s), 2 * b * Math.cos(2 * s + 0.5), -c * Math.sin(s)),
    bend: new THREE.Vector3(-a * Math.sin(s), -4 * b * Math.sin(2 * s + 0.5), -c * Math.cos(s)),
  };
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Fish `i` at `t`: where it is, which way it faces (x its nose, y its back, z its side), and how
 * fast its tail is going. It banks into its turns, its back leaning toward the turn's middle, as
 * nothing holds it upright out here.
 */
function pose(i: number, t: number) {
  const [back, side, up] = PLACES[i], s = progress(t) - back * PER_LENGTH;
  const turn = new THREE.Quaternion().setFromAxisAngle(UP, (Math.PI * 2 * t) / SCHOOL.drift);
  const { at, on, bend } = loop(s);
  const nose = on.clone().normalize();
  const inward = bend.clone().addScaledVector(nose, -bend.dot(nose));
  const hint = UP.clone().addScaledVector(inward.lengthSq() > 1e-6 ? inward.normalize() : UP, 0.7);
  const flank = new THREE.Vector3().crossVectors(nose, hint).normalize(), topside = new THREE.Vector3().crossVectors(flank, nose);
  // its place in the school, and a little way of its own
  at.addScaledVector(flank, side + 0.012 * Math.sin(t * 2.3 + i * 1.7)).addScaledVector(topside, up + 0.012 * Math.sin(t * 1.9 + i * 2.9));
  const facing = new THREE.Matrix4().makeBasis(nose, topside, flank);
  const q = new THREE.Quaternion().setFromRotationMatrix(facing).premultiply(turn);
  // (how quickly it is going round the loop: its dart, for its tail)
  const speed = (progress(t + 0.01) - progress(t - 0.01)) / 0.02;
  return { at: at.applyQuaternion(turn), q, speed, s };
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
 * swimming as a school as fish swim with nothing holding them up: round a loop that slowly turns,
 * darting on every so often and gliding between, banking into their turns, tails wagging faster as
 * they dart. The first one leads and the rest go exactly where it went (see SCHOOL), so they turn
 * together, a ripple running back through them. Each leaves a short glowing trail, like a comet's.
 */
export function makeMinnows(): Item {
  const school = new THREE.Group();
  const fishes = PLACES.map(() => minnow());
  fishes.forEach((f) => {
    f.fish.scale.setScalar(FISH);
    school.add(f.fish);
  });
  const trailAt = (i: number, t: number): GlowLine => {
    const { points, step, width } = SCHOOL.trail;
    const pts = Array.from({ length: points }, (_, k) => {
      const p = pose(i, t - k * step);
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
      const p = pose(i, t);
      f.fish.position.copy(p.at);
      f.fish.quaternion.copy(p.q);
      // the tail wags (harder and quicker as it darts), the head sways a little against it
      const dart = Math.min(1, (p.speed - SCHOOL.pace) / 2), beat = Math.PI * 2 * SCHOOL.wag * (t + 0.6 * p.s) + i;
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
    update(_dt, t) {
      place(t);
    },
    dispose() {
      release(root);
    },
  };
}
