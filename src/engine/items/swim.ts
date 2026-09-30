import * as THREE from "three";

/** A small seeded generator (mulberry32), so it is the same swim every time. */
export function seeded(seed: number) {
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
 * How a creature swims about an invisible ball round the item's middle, as a fish swims: on a
 * heading that turns smoothly, never tighter than a turn `turn` across (item units), wandering (its
 * turning drifts, settling over about `wander.settle` of distance, kicked about by `wander.kick`),
 * and turning back in as it nears the ball's edge: from `edge.from` out from the middle, turning
 * back in takes over from wandering, all of it by `edge.ball`, and it turns toward the inside,
 * slanted `edge.slant` the way it was wandering (so it veers a different way each time, and never
 * goes round and round one way). From `seed`, starting at `from` heading `heading`.
 */
export type SwimWay = {
  turn: number;
  wander: { settle: number; kick: number };
  edge: { from: number; ball: number; slant: number };
  seed: number;
  from: [number, number, number];
  heading: [number, number, number];
};

/**
 * Its path, swum a step of `STEP` at a time and kept, as far as it has been asked for (it starts
 * `BEFORE` before where it starts, for those behind it): where it is how far along, and its way on
 * and its turn there (the turn: toward the middle of the turn, as big as the turn is tight).
 */
const STEP = 0.01, BEFORE = 2;
export function swim(way: SwimWay) {
  const rand = seeded(way.seed), kick = () => rand() + rand() + rand() - 1.5;
  const pts: number[] = [];
  const p = new THREE.Vector3(...way.from), heading = new THREE.Vector3(...way.heading).normalize(), spin = new THREE.Vector3();
  const most = 2 / way.turn, n = new THREE.Vector3(), steer = new THREE.Vector3(), want = new THREE.Vector3(), turning = new THREE.Vector3();
  const extend = (to: number) => {
    while (pts.length / 3 <= to) {
      pts.push(p.x, p.y, p.z);
      // its turning drifts, and is kicked about
      spin.multiplyScalar(1 - STEP / way.wander.settle).add(n.set(kick(), kick(), kick()).multiplyScalar(way.wander.kick * Math.sqrt(STEP)));
      // (it only ever turns, never rolls along its way: and never tighter than it can)
      spin.addScaledVector(heading, -spin.dot(heading));
      if (spin.length() > most) spin.setLength(most);
      // near the edge, turning back in takes over: toward the inside, slanted the way it was
      // wandering, the harder the further it points from there
      const r = p.length(), f = Math.min(1, Math.max(0, (r - way.edge.from) / (way.edge.ball - way.edge.from))), w = f * f * (3 - 2 * f);
      turning.copy(spin);
      if (w > 0) {
        want.copy(p).multiplyScalar(-1 / r).addScaledVector(steer.crossVectors(spin, heading), way.edge.slant).normalize();
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
  const onward = (i: number) => at(i + 2).sub(at(i - 2)).divideScalar(4 * STEP);
  const bend = (i: number) => at(i + 3).add(at(i - 3)).addScaledVector(at(i), -2).divideScalar(9 * STEP * STEP);
  return (gone: number) => {
    const f = (gone + BEFORE) / STEP, i = Math.max(3, Math.floor(f)), k = f - Math.floor(f);
    extend(i + 5);
    return {
      at: at(i).lerp(at(i + 1), k),
      on: onward(i).lerp(onward(i + 1), k).normalize(),
      turn: bend(i).lerp(bend(i + 1), k),
    };
  };
}

export type Swim = ReturnType<typeof swim>;

const UP = new THREE.Vector3(0, 1, 0), TOWARD = new THREE.Vector3(0, 0, 1);

/**
 * Which way a creature on `path` faces, `gone` along it: x its nose, y its back, z its side (as a
 * matrix's basis). Its back is toward up, or (as it heads up or down, where up is no guide) toward
 * you, eased between; and it banks into its turns, its back leaning toward the turn's middle, the
 * tighter the turn the more (`bank` of it, up to `most`), so as a turn one way becomes a turn the
 * other it comes upright and leans the other way, never flips.
 */
export function facing(nose: THREE.Vector3, turn: THREE.Vector3, bank = 0.15, most = 0.8) {
  const inward = turn.clone().addScaledVector(nose, -turn.dot(nose));
  const vertical = Math.min(1, Math.max(0, (Math.abs(nose.y) - 0.6) / 0.35));
  const hint = UP.clone().lerp(TOWARD, vertical * vertical * (3 - 2 * vertical)).normalize();
  const tight = inward.length();
  if (tight > 1e-6) hint.addScaledVector(inward.normalize(), Math.min(most, bank * tight));
  const flank = new THREE.Vector3().crossVectors(nose, hint).normalize(), topside = new THREE.Vector3().crossVectors(flank, nose);
  return { nose, topside, flank };
}
