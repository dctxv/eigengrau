/**
 * Urchi's limbs, in its suit. The suit's model (suit.json, see urchi/tools/build-suit.mjs) hangs its
 * arms and legs in segments from five joints a side: the shoulder in the middle of its cap, the
 * elbow and the wrist in the middle of their rings, the hip up inside the hips, the ankle in the
 * middle of its cuff. This poses them: ten angles a side, each on a spring toward what it wants,
 * which is a posture (the modelled one, or zero gravity's own), its life afloat on it (a slow sway
 * of every limb and of the whole body, a lift with each breath, a settle now and then; see
 * IDLE_LIFE), what it is doing (a quirk: waving, turning a glove over to look at it, tapping its
 * helmet, swinging its legs...) and what its body's motion does to it (flung, the limbs trail;
 * spun, they fly out; stopped, they swing on).
 *
 * The angles, in degrees in what follows (radians inside), for the `.R` side (x positive, on the
 * viewer's right); the `.L` side takes the same angles as its mirror image:
 *   shFlex   the arm raised forward (toward the viewer) at the shoulder; negative, back
 *   shAbd    the arm raised out to the side (0 hangs a little out, as modelled; 90 is level)
 *   shTwist  the arm turned about its own length: positive swings the forearm out as the elbow bends
 *   elbow    the elbow bent, the forearm brought forward (0 straight)
 *   wrTwist  the hand turned about the forearm (the palm, inward at 0, toward the front as it grows)
 *   wrBend   the hand bent toward the palm
 *   hipFlex  the leg swung forward at the hip; negative, back
 *   hipAbd   the leg swung out to the side
 *   hipTwist the leg turned about its length: the toes out
 *   ankle    the foot turned up at the ankle (toes up); negative points them
 */

export const DOFS = ["shFlex", "shAbd", "shTwist", "elbow", "wrTwist", "wrBend", "hipFlex", "hipAbd", "hipTwist", "ankle"] as const;
export type Dof = (typeof DOFS)[number];
/** Some of the angles, in degrees. */
export type Pose = Partial<Record<Dof, number>>;
/** 0: the `.R` side (x positive), 1: the `.L`. */
export type Side = 0 | 1;
const N = DOFS.length;
const D2R = Math.PI / 180;

/** The rig as the suit's model gives it: per segment its joint, its parent and whether it turns half as far; per joint its pivot, axes and parts. */
export type RigData = {
  segments: [number, number, number][];
  joints: { name: string; pivot: number[]; axis: number[]; out: number[]; up: number[]; parts: number[] }[];
};

/** How far each angle goes, degrees: [least, most]. Past either a stiff spring holds it back. */
const LIMIT: Record<Dof, [number, number]> = {
  shFlex: [-50, 150], shAbd: [-70, 125], shTwist: [-90, 120], elbow: [0, 140], wrTwist: [-90, 90], wrBend: [-45, 50],
  hipFlex: [-35, 70], hipAbd: [-15, 35], hipTwist: [-30, 40], ankle: [-40, 25],
};
/** The middle of each angle's reach, and its span (for choosing between two ways to the same place). */
const MIDDLE = Object.fromEntries(DOFS.map((d) => [d, (LIMIT[d][0] + LIMIT[d][1]) / 2])) as Record<Dof, number>;
const SPAN = Object.fromEntries(DOFS.map((d) => [d, LIMIT[d][1] - LIMIT[d][0]])) as Record<Dof, number>;
/**
 * Each angle's spring: `omega` rad/s and `zeta` of critical. The farther out along a limb, the
 * looser and the less damped (a wrist follows its forearm a little late, and overshoots a little),
 * so a move rolls down the arm rather than all of it at once.
 */
const SPRING: Record<Dof, [number, number]> = {
  shFlex: [6, 0.72], shAbd: [6, 0.72], shTwist: [6.5, 0.75], elbow: [7, 0.66], wrTwist: [8, 0.62], wrBend: [8.5, 0.58],
  hipFlex: [5, 0.74], hipAbd: [5, 0.74], hipTwist: [5.5, 0.76], ankle: [7.5, 0.6],
};

// ------------------------------------------------------------------ the rig's transforms

type M3 = Float64Array;   // 3x3, rows
const m3 = () => new Float64Array(9);
/** The rotation about unit axis k by a (Rodrigues), into o. */
function axisAngle(o: M3, k: ArrayLike<number>, a: number) {
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c, x = k[0], y = k[1], z = k[2];
  o[0] = c + x * x * t; o[1] = x * y * t - z * s; o[2] = x * z * t + y * s;
  o[3] = y * x * t + z * s; o[4] = c + y * y * t; o[5] = y * z * t - x * s;
  o[6] = z * x * t - y * s; o[7] = z * y * t + x * s; o[8] = c + z * z * t;
  return o;
}
/** a b, into o (o may be neither). */
function mul3(o: M3, a: M3, b: M3) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return o;
}
const Z = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0];

/**
 * The rig's transforms for a pose: per segment a 3x4 (rows: the turn and, last in each row, the
 * move) that takes a point of it at rest to where the pose puts it, both in the body's space (the
 * head's, y down). The `.L` side's are the mirror images of what the `.R` side's formulas give for
 * its angles (so the same angles pose the two sides alike).
 */
export function createRig(rig: RigData) {
  const nseg = rig.segments.length;
  const out = new Float64Array(nseg * 12);
  const R = m3(), A = m3(), B = m3(), C = m3(), T = m3();
  /** The `.R` side's joints (the first five: shoulder, elbow, wrist, hip, ankle), whose axes both sides' turns are made from. */
  const J = rig.joints;
  /** A joint's turn for a side's angles (the `.R` formula), halved for a ring or a ball, into R. */
  function turn(kind: number, q: ArrayLike<number>, o: number, half: number) {
    const f = half ? 0.5 : 1;
    const j = J[kind];
    if (kind === 0) {   // shoulder: out to the side about the view's axis, forward about the arm's own lateral axis, and a twist about its length
      axisAngle(A, Z, -q[o + 1] * f); axisAngle(B, j.out, q[o] * f); axisAngle(C, j.axis, q[o + 2] * f);
      mul3(T, A, B); mul3(R, T, C);
    } else if (kind === 1) axisAngle(R, j.out, q[o + 3] * f);
    else if (kind === 2) { axisAngle(A, j.axis, q[o + 4] * f); axisAngle(B, Z, q[o + 5] * f); mul3(R, A, B); }
    else if (kind === 3) {
      axisAngle(A, Z, -q[o + 7] * f); axisAngle(B, X, q[o + 6] * f); axisAngle(C, Y, q[o + 8] * f);
      mul3(T, A, B); mul3(R, T, C);
    } else axisAngle(R, X, q[o + 9] * f);
  }
  function update(q: ArrayLike<number>) {
    out.fill(0);
    out[0] = out[5] = out[10] = 1;
    for (let s = 1; s < nseg; s++) {
      const [ji, pi, half] = rig.segments[s], side = ji >= 5 ? 1 : 0, kind = ji % 5, p = rig.joints[ji].pivot;
      turn(kind, q, side * N, half);
      if (side) { R[1] = -R[1]; R[2] = -R[2]; R[3] = -R[3]; R[6] = -R[6]; }   // the mirror's: M R M
      const P = pi * 12, S = s * 12;
      // this segment's turn: its parent's, then its joint's about the pivot
      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) out[S + i * 4 + k] = out[P + i * 4] * R[k] + out[P + i * 4 + 1] * R[3 + k] + out[P + i * 4 + 2] * R[6 + k];
        // the move: the parent's turn of (pivot - R pivot), plus the parent's move
        let m = out[P + i * 4 + 3];
        for (let k = 0; k < 3; k++) {
          const d = p[k] - (R[k * 3] * p[0] + R[k * 3 + 1] * p[1] + R[k * 3 + 2] * p[2]);
          m += out[P + i * 4 + k] * d;
        }
        out[S + i * 4 + 3] = m;
      }
    }
    return out;
  }
  return { transforms: out, update, segments: nseg };
}
export type Rig = ReturnType<typeof createRig>;

// ------------------------------------------------------------------ reaching

/**
 * The arm's angles that put the middle of its hand at a point (the body's space at rest, head space:
 * x right, y down, z toward the viewer; the `.R` side's, or the `.L` side's mirrored onto it), its
 * elbow toward `pole` (a way out from the shoulder: out and down by default), as a pose: the
 * shoulder's three, the elbow. A point beyond its reach gets the arm pointed straight at it. Two
 * bones, solved outright (the law of cosines, then the angles out of the arm's direction and the
 * way its elbow bends), so a quirk can reach for a moving point every frame.
 */
export function reach(rig: RigData, x: number, y: number, z: number, pole: [number, number, number] = [0.6, 0.8, -0.25], out: Pose = {}): Pose {
  const [S, E, W] = rig.joints, a0 = S.axis, o0 = S.out;
  const L1 = Math.hypot(E.pivot[0] - S.pivot[0], E.pivot[1] - S.pivot[1], E.pivot[2] - S.pivot[2]);
  const L2 = Math.hypot(W.pivot[0] - E.pivot[0], W.pivot[1] - E.pivot[1], W.pivot[2] - E.pivot[2]) + HAND;
  let dx = x - S.pivot[0], dy = y - S.pivot[1], dz = z - S.pivot[2];
  const d0 = Math.hypot(dx, dy, dz) || 1, d = Math.max(Math.abs(L1 - L2) + 1, Math.min(L1 + L2 - 0.5, d0));
  dx /= d0; dy /= d0; dz /= d0;
  // the elbow: off the line to the target by the shoulder's angle, toward the pole
  const alpha = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  let px = pole[0], py = pole[1], pz = pole[2];
  const pd = px * dx + py * dy + pz * dz;
  px -= pd * dx; py -= pd * dy; pz -= pd * dz;
  const pl = Math.hypot(px, py, pz) || 1;
  px /= pl; py /= pl; pz /= pl;
  const ux = dx * Math.cos(alpha) + px * Math.sin(alpha), uy = dy * Math.cos(alpha) + py * Math.sin(alpha), uz = dz * Math.cos(alpha) + pz * Math.sin(alpha);
  const ex = S.pivot[0] + ux * L1, ey = S.pivot[1] + uy * L1, ez = S.pivot[2] + uz * L1;
  let fx = S.pivot[0] + dx * d - ex, fy = S.pivot[1] + dy * d - ey, fz = S.pivot[2] + dz * d - ez;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  // the arm's direction u = Rz(-abd) Rout(flex) a0: flex from its depth, abd from its turn on screen;
  // two answers, the arm forward (flex under 90) or over and back (flex over 90, abd half a turn on):
  // the one nearer the middle of what the shoulder does (an arm raised in front goes up, not round)
  const f1 = Math.asin(Math.max(-1, Math.min(1, uz))), a1 = wrap(Math.atan2(a0[1], a0[0]) - Math.atan2(uy, ux));
  const f2 = Math.PI - f1, a2 = wrap(a1 + Math.PI);
  const off = (f: number, a: number) => Math.abs(f / D2R - MIDDLE.shFlex) / SPAN.shFlex + Math.abs(a / D2R - MIDDLE.shAbd) / SPAN.shAbd;
  const [flex, abd] = off(f1, a1) <= off(f2, a2) ? [f1, a1] : [f2, a2];
  // the elbow's bend: the forearm off the arm's line, toward b = cos(twist) P + sin(twist) Q
  const e = Math.acos(Math.max(-1, Math.min(1, ux * fx + uy * fy + uz * fz)));
  let bx = fx - (ux * fx + uy * fy + uz * fz) * ux, by = fy - (ux * fx + uy * fy + uz * fz) * uy, bz = fz - (ux * fx + uy * fy + uz * fz) * uz;
  const bl = Math.hypot(bx, by, bz);
  let twist = 0;
  if (bl > 1e-6) {
    bx /= bl; by /= bl; bz /= bl;
    const c = Math.cos(-abd), s2 = Math.sin(-abd), rz = (v: number[]) => [v[0] * c - v[1] * s2, v[0] * s2 + v[1] * c, v[2]];
    const P = rz([-a0[0] * Math.sin(flex), -a0[1] * Math.sin(flex), Math.cos(flex)]), Q = rz(o0);
    twist = Math.atan2(bx * Q[0] + by * Q[1] + bz * Q[2], bx * P[0] + by * P[1] + bz * P[2]);
  }
  out.shFlex = flex / D2R; out.shAbd = abd / D2R; out.shTwist = twist / D2R; out.elbow = e / D2R;
  return out;
}
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** From the wrist to the middle of the hand, at rest (the mitten's middle, along the arm). */
const HAND = 118;

/** A point at rest taken through a segment's transform, into o at k. */
export function place(M: Float64Array, s: number, x: number, y: number, z: number, o: Float64Array | number[], k = 0) {
  const S = s * 12;
  o[k] = M[S] * x + M[S + 1] * y + M[S + 2] * z + M[S + 3];
  o[k + 1] = M[S + 4] * x + M[S + 5] * y + M[S + 6] * z + M[S + 7];
  o[k + 2] = M[S + 8] * x + M[S + 9] * y + M[S + 10] * z + M[S + 11];
}

// ------------------------------------------------------------------ what it does

/** Minimum jerk from 0 to 1: how a hand moves from rest to rest. */
const mj = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (10 - 15 * u + 6 * u * u));
const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
/** The pose along keys ([time s, pose], in order) at t: each angle eased from one key that sets it to the next. */
function keyed(t: number, keys: [number, Pose][], out: Pose) {
  for (const d of DOFS) {
    let a = -1, b = -1;
    for (let k = 0; k < keys.length; k++) {
      if (keys[k][1][d] === undefined) continue;
      if (keys[k][0] <= t) a = k;
      else { b = k; break; }
    }
    if (a < 0 && b < 0) continue;
    if (a < 0) { out[d] = keys[b][1][d]; continue; }
    if (b < 0) { out[d] = keys[a][1][d]; continue; }
    const u = mj((t - keys[a][0]) / (keys[b][0] - keys[a][0]));
    out[d] = keys[a][1][d]! + (keys[b][1][d]! - keys[a][1][d]!) * u;
  }
  return out;
}
const wave = (t: number, hz: number, phase = 0) => Math.sin(2 * Math.PI * hz * t + phase);

/**
 * A quirk: what it does over `dur` seconds, per side (0 the side it does it with, 1 the other;
 * played the other way round, they swap), as poses it wants (degrees; what it leaves out stays with
 * the posture). A hand is put where it goes by `reach` (a point in the `.R` side's terms: x out from
 * the middle, y down, z toward the viewer; the helmet's chin is at about y 470, its side at x 490).
 * Every hand stays clear of the suit and the helmet all through (checked on the rig: its short
 * arms reach the air in front of its chest only out past its middle, and never in front of its
 * helmet, so two hands never meet in front of it).
 * It comes in over `ramp[0]` and lets go over `ramp[1]` (the springs smooth the rest). `stiff`
 * quickens its springs while it holds them (a wave is quicker than a drift); `look`: the head turns
 * to its own hand (side 0's) between those times; `still`: no drift under it.
 */
type Quirk = {
  dur: number;
  ramp: [number, number];
  pose(t: number, side: Side, out: Pose, rig: RigData): Pose;
  stiff?: number;
  look?: [number, number];
  still?: boolean;
};

/** Zero gravity's own posture (as astronauts float, asleep or idle): arms up a little and forward, elbows and hips bent, toes pointed. */
export const FLOAT: Pose = { shFlex: 20, shAbd: 24, shTwist: 12, elbow: 48, wrTwist: 0, wrBend: 10, hipFlex: 12, hipAbd: 7, hipTwist: 5, ankle: -14 };
/** The elbow out and down, as a hand is brought up in front. */
const OUT_DOWN: [number, number, number] = [0.75, 0.6, -0.3];

export const QUIRKS = {
  /** A hello: the hand up beside its helmet, clear of it, waving side to side from the elbow; the other arm out a little for balance. */
  wave: {
    dur: 3.8, ramp: [0.55, 0.7], stiff: 1.5,
    pose(t, side, o, rig) {
      if (side) { o.shAbd = 36; o.elbow = 38; o.shFlex = 14; return o; }
      const w = smooth((t - 0.5) / 0.35) * smooth((3.2 - t) / 0.4), sway = w * wave(t - 0.5, 1.6);
      reach(rig, 620 + 55 * sway, 345 - 10 * Math.abs(sway), 100, [0.55, 0.8, -0.1], o);
      o.wrTwist = 70; o.wrBend = -8 + 16 * w * wave(t - 0.5, 1.6, -0.9);
      return o;
    },
  },
  /** A glove brought up in front of its chest, under its chin, and turned over, back and palm, and on over, to be looked at. */
  inspect: {
    dur: 5.4, ramp: [0.75, 0.8], look: [0.5, 4.7],
    pose(t, side, o, rig) {
      if (side) return o;
      const lift = smooth((t - 0.9) / 0.8) * smooth((4.4 - t) / 0.6);
      reach(rig, 310, 610 - 25 * lift, 345, OUT_DOWN, o);
      return keyed(t, [[0, { wrTwist: -20, wrBend: 10 }], [1.1, { wrTwist: -20 }], [2, { wrTwist: 50, wrBend: -10 }], [3.1, { wrTwist: 50 }], [3.9, { wrTwist: 75, wrBend: 16 }], [4.6, { wrTwist: 70 }]], o);
    },
  },
  /** A few taps on the side of its helmet, low by its chin, thinking. */
  tap: {
    dur: 3.4, ramp: [0.55, 0.6], stiff: 1.4,
    pose(t, side, o, rig) {
      if (side) return o;
      const tap = t > 0.8 && t < 2.6 ? Math.max(0, wave(t - 0.8, 2.4)) : 0;
      reach(rig, 505 + 25 * tap, 410, 170, [0.8, 0.55, -0.2], o);
      o.wrTwist = 40; o.wrBend = 22;
      return o;
    },
  },
  /** A stretch: arms up and out, legs straight and apart, toes pointed; held, and let go. */
  stretch: {
    dur: 3.4, ramp: [0.8, 0.9], still: true,
    pose(t, _side, o) {
      return keyed(t, [[0, {}], [1.1, { shAbd: 96, shFlex: 26, shTwist: 10, elbow: 8, wrBend: -22, hipFlex: -4, hipAbd: 13, ankle: -34 }], [2.2, { shAbd: 100, elbow: 4, ankle: -38 }]], o);
    },
  },
  /** Swimming at the air: a slow breaststroke and a flutter of the legs. */
  swim: {
    dur: 4.6, ramp: [0.6, 0.8], stiff: 1.2,
    pose(t, side, o) {
      const c = ((t - 0.3) / 1.9) % 1, u = Math.max(0, c);
      // a stroke: reach forward, sweep out, pull round and in, glide
      keyed(u, [[0, { shFlex: 72, shAbd: 8, elbow: 24, shTwist: 0 }], [0.35, { shFlex: 44, shAbd: 62, elbow: 30 }], [0.62, { shFlex: 30, shAbd: 30, elbow: 104, shTwist: 20 }], [0.85, { shFlex: 64, shAbd: 4, elbow: 70 }], [1, { shFlex: 72, shAbd: 8, elbow: 24, shTwist: 0 }]], o);
      o.hipFlex = 10 + 15 * wave(t, 1.9, side ? Math.PI : 0);
      o.ankle = -20 + 12 * wave(t, 1.9, (side ? Math.PI : 0) - 0.8);
      return o;
    },
  },
  /** Its legs swung to and fro, one then the other, as if sat on a ledge. */
  swing: {
    dur: 5.4, ramp: [0.8, 0.9],
    pose(t, side, o) {
      const w = smooth(t / 0.8) * smooth((5.4 - t) / 0.9);
      o.hipFlex = 26 + 17 * w * wave(t, 0.75, side ? Math.PI : 0);
      o.ankle = -8 + 12 * w * wave(t, 0.75, (side ? Math.PI : 0) - 1);
      o.hipAbd = 4;
      return o;
    },
  },
  /** Ankles crossed, lounging. */
  cross: {
    dur: 6.5, ramp: [1, 1.1],
    pose(_t, side, o) {
      o.hipAbd = -9; o.hipFlex = side ? 14 : 22; o.hipTwist = -6; o.ankle = -24;
      return o;
    },
  },
  /** Pleased with itself: three pats on its sides, both hands at once. */
  pat: {
    dur: 2.8, ramp: [0.5, 0.6], stiff: 1.8,
    pose(t, _side, o, rig) {
      const pat = t > 0.5 && t < 2.1 ? Math.max(0, wave(t - 0.5, 2.2, Math.PI / 2)) : 0;
      reach(rig, 410 + 40 * pat, 760, 140, [0.9, 0.3, -0.3], o);
      o.wrTwist = -40; o.wrBend = 10 - 20 * pat;
      return o;
    },
  },
  /** Both hands up by its helmet's cheeks, pleased. */
  cheeks: {
    dur: 3.4, ramp: [0.7, 0.8],
    pose(t, _side, o, rig) {
      reach(rig, 525, 420 + 6 * wave(t, 0.8), 175, [0.9, 0.4, -0.2], o);
      o.wrTwist = 50; o.wrBend = 18;
      return o;
    },
  },
  /** Its hands held up in front, fidgeting. */
  fidget: {
    dur: 3.6, ramp: [0.6, 0.7],
    pose(t, side, o, rig) {
      const ph = side ? Math.PI : 0;
      reach(rig, 285 + 14 * wave(t, 1.2, ph), 720 + 12 * wave(t, 1.2, ph + 1.6), 345, [0.8, 0.5, -0.3], o);
      o.wrTwist = 30; o.wrBend = 12 * wave(t, 1.2, ph + 0.8);
      return o;
    },
  },
  /** Its feet wiggled, one then the other. */
  wiggle: {
    dur: 2, ramp: [0.3, 0.4], stiff: 1.6,
    pose(t, side, o) {
      o.ankle = -10 + 22 * wave(t, 2.8, side ? Math.PI : 0);
      o.hipTwist = 12 * wave(t, 1.4, side ? Math.PI : 0);
      return o;
    },
  },
  /** Flung: arms and legs thrown out. */
  splay: {
    dur: 1.6, ramp: [0.12, 0.9], stiff: 1.5,
    pose(_t, _side, o) {
      o.shAbd = 72; o.shFlex = 8; o.elbow = 22; o.wrBend = -14; o.hipAbd = 24; o.hipFlex = 4; o.ankle = -6;
      return o;
    },
  },
  /** Brought up short: arms out in front, legs together. */
  brace: {
    dur: 1.4, ramp: [0.15, 0.8], stiff: 1.4,
    pose(_t, _side, o) {
      o.shFlex = 56; o.shAbd = 18; o.elbow = 28; o.wrBend = -26; o.hipFlex = 12; o.hipAbd = 2; o.ankle = -4;
      return o;
    },
  },
  /** Tumbling off: curled up, knees drawn up and arms in front. */
  curl: {
    dur: 3, ramp: [0.25, 0.6], stiff: 1.3,
    pose(_t, _side, o) {
      o.shFlex = 50; o.shAbd = 0; o.shTwist = 20; o.elbow = 100; o.hipFlex = 50; o.hipAbd = 3; o.ankle = 16;
      return o;
    },
  },
} satisfies Record<string, Quirk>;
export type QuirkName = keyof typeof QUIRKS;
/** A quirk's pose at t seconds in, for a side (0 the side doing it), degrees: for the sheet. */
export function quirkPose(rig: RigData, name: QuirkName, t: number, side: Side): Pose {
  return (QUIRKS[name] as Quirk).pose(t, side, {}, rig);
}

/** The quirks it does of itself, left alone afloat, and how often each is picked (by weight). */
const IDLE: [QuirkName, number][] = [["inspect", 3], ["tap", 2], ["swing", 3], ["cross", 2], ["fidget", 2], ["wiggle", 2], ["cheeks", 1.5], ["stretch", 1], ["swim", 1.5], ["pat", 1], ["wave", 1]];
/** A reach comes in over REACH_IN seconds and lets go over REACH_OUT, its elbow out and down. */
const REACH_IN = 0.7, REACH_OUT = 0.9;
const REACH_POLE: [number, number, number] = [0.7, 0.7, -0.2];
/**
 * Where a reach may aim, so the arm never goes into the helmet or the body: the least x out from the
 * middle (the `.R` side's terms, for a point in front, z about 260) at each height, y from
 * REACH_SAFE.y0 every REACH_SAFE.dy (worked out on the rig, with 10 units to spare). A point up by
 * the helmet, or across in front of the body, is reached for out to that side instead, the arm
 * raised beside the helmet rather than through it.
 */
const REACH_SAFE = { y0: -600, dy: 100, x: [1575, 1475, 1350, 1250, 1075, 925, 825, 750, 675, 600, 550, 400, 325, 325, 300, 350, 425, 425, 425, 425, 425, 425, 450] };
const safeX = (y: number) => {
  const X = REACH_SAFE.x, u = Math.min(X.length - 1, Math.max(0, (y - REACH_SAFE.y0) / REACH_SAFE.dy)), i = Math.min(X.length - 2, Math.floor(u));
  return X[i] + (X[i + 1] - X[i]) * (u - i);
};
/** Seconds between quirks, left alone: [least, most]. */
const PACE = { gap: [3.2, 7.5] as [number, number], first: 1.6 };
/**
 * Its life afloat between quirks: never quite still, as a body in zero gravity is not. Each angle
 * sways (`sway`, degrees) on a slow noise, three sines a band apart (`bands`, seconds; `weights`) on
 * periods that never line up: part of it its own; part (`limb`, and which way) its limb's, so an
 * arm drifts up and round as a piece rather than an angle at a time; and part (`body`) the whole
 * body's, curling in a little and opening out again as a sleeper's does, arms and legs together.
 * The limbs lift a little with each in-breath (`breath`, degrees at the top of one; the head's
 * breath, see breathe); and every `every` seconds one limb settles somewhere a little different
 * (`settle`, degrees at most each way) over `over` seconds, and stays there. Big enough to be seen
 * on the page, where the figure is a couple of hundred pixels tall; slow enough to read as
 * drifting, not as doing something.
 */
const IDLE_LIFE = {
  sway: { shFlex: 12, shAbd: 10, shTwist: 10, elbow: 15, wrTwist: 16, wrBend: 11, hipFlex: 11, hipAbd: 5, hipTwist: 9, ankle: 15 } as Record<Dof, number>,
  limb: { shFlex: 0.5, shAbd: 0.45, shTwist: 0.3, elbow: 0.35, wrTwist: 0.2, wrBend: 0.25, hipFlex: 0.45, hipAbd: 0.4, hipTwist: 0.3, ankle: -0.3 } as Record<Dof, number>,
  body: { shFlex: 0.35, shAbd: -0.2, shTwist: 0, elbow: 0.35, wrTwist: 0, wrBend: 0.2, hipFlex: 0.5, hipAbd: 0, hipTwist: 0, ankle: -0.3 } as Record<Dof, number>,
  bands: [[8, 13], [4, 6.5], [2, 3]] as [number, number][],
  weights: [0.4, 0.45, 0.15],
  breath: { shFlex: 2.5, shAbd: 3.5, elbow: -3.5, wrBend: 2.5, hipFlex: 1.5, ankle: -2.5 } as Pose,
  settle: { shFlex: 12, shAbd: 9, shTwist: 12, elbow: 18, wrTwist: 24, wrBend: 12, hipFlex: 10, hipAbd: 3, hipTwist: 9, ankle: 12 } as Record<Dof, number>,
  every: [3, 7] as [number, number],
  over: [1.4, 2.4] as [number, number],
  /** How likely each limb is to be the one that settles: the `.R` arm and leg, the `.L` arm and leg. */
  limbs: [0.3, 0.2, 0.3, 0.2],
  /** Asleep (or dozing): the sway `size` as big and `pace` as quick, eased in and out over `ease` seconds; no quirks, no settles. */
  asleep: { size: 0.6, pace: 0.55, ease: 2 },
};

/**
 * What its body's motion does to the limbs, at most (rad/s² per angle): each limb is a weight on its
 * joint, and what the body's acceleration (and its spin's) leaves behind swings it (see feel).
 * `gain` scales the physics (the springs hold them back as muscles would).
 */
const FEEL = { gain: 0.55, most: 60 };

type Running = { q: Quirk; name: QuirkName; t0: number; flip: boolean; w: number };

export type LimbsMode = "rest" | "float";

/**
 * The limbs' state: the angles (both sides' ten, radians), their springs, the quirk running and the
 * rig's transforms for them. `step` moves it on; `transforms` then has each segment's. `onQuirk`
 * hears each quirk as it starts, and the side doing it (the head joins in: see character.ts).
 */
export function createLimbs(data: RigData, o: { reducedMotion: boolean; onQuirk?(name: QuirkName, side: Side): void }) {
  const rig = createRig(data);
  const q = new Float64Array(2 * N), vel = new Float64Array(2 * N), target = new Float64Array(2 * N);
  const stiff = new Float64Array(2 * N);
  let mode: LimbsMode = "rest", life = 0, t = 0;
  let held: Float64Array | null = null;
  const running: Running[] = [];
  let next = PACE.first, last: QuirkName | null = null;
  // its life afloat (IDLE_LIFE): a noise for each angle (both sides' ten), for each limb (the `.R`
  // arm and leg, the `.L` arm and leg, after them) and for the whole body (last), three sines each
  // on their own periods and phases; the breath now; and each limb's settle, from where to where
  // (degrees, per angle) and when
  const LIMB0 = 2 * N, BODY = LIMB0 + 4, bands = IDLE_LIFE.bands, weights = IDLE_LIFE.weights, NORM = Math.hypot(...weights);
  const nPeriod = new Float64Array((BODY + 1) * 3), nPhase = new Float64Array((BODY + 1) * 3);
  for (let c = 0; c <= BODY; c++) for (let k = 0; k < 3; k++) {
    nPeriod[c * 3 + k] = bands[k][0] + Math.random() * (bands[k][1] - bands[k][0]);
    nPhase[c * 3 + k] = Math.random() * Math.PI * 2;
  }
  /** A noise now, about -1..1 (as loud as a sine of 1, at times a little more), on its own clock (slower asleep). */
  const noise = (c: number) => {
    let v = 0;
    for (let k = 0; k < 3; k++) v += weights[k] * Math.sin((2 * Math.PI * tn) / nPeriod[c * 3 + k] + nPhase[c * 3 + k]);
    return v / NORM;
  };
  const limbNoise = new Float64Array(4);
  /** The noises' clock, and how far asleep it is (0..1, eased), and whether it is. */
  let tn = 0, sleep = 0, asleep = false;
  let breath = 0;
  const settleFrom = new Float64Array(2 * N), settleTo = new Float64Array(2 * N);
  const settleT0 = [0, 0, 0, 0], settleFor = [1, 1, 1, 1];
  let nextSettle = IDLE_LIFE.every[0];
  /** The limb an angle is part of (0..3: the `.R` arm and leg, the `.L` arm and leg). */
  const limbOf = (i: number) => 2 * Math.floor(i / N) + (i % N < 6 ? 0 : 1);
  /** Where an angle has settled now (degrees), on its way from one settle to the next. */
  const settled = (i: number) => {
    const L = limbOf(i);
    return settleFrom[i] + (settleTo[i] - settleFrom[i]) * mj((t - settleT0[L]) / settleFor[L]);
  };
  /** One limb, picked by IDLE_LIFE.limbs, settles somewhere new: each of its angles a little way from the posture (most of them nearer it than not). */
  function settle() {
    let r = Math.random(), L = 0;
    while (L < 3 && (r -= IDLE_LIFE.limbs[L]) > 0) L++;
    for (let i = 0; i < 2 * N; i++) {
      if (limbOf(i) !== L) continue;
      settleFrom[i] = settled(i);
      settleTo[i] = (Math.random() + Math.random() - 1) * IDLE_LIFE.settle[DOFS[i % N]];
    }
    settleT0[L] = t;
    settleFor[L] = IDLE_LIFE.over[0] + Math.random() * (IDLE_LIFE.over[1] - IDLE_LIFE.over[0]);
    nextSettle = t + IDLE_LIFE.every[0] + Math.random() * (IDLE_LIFE.every[1] - IDLE_LIFE.every[0]);
  }
  /** What the body's motion did this frame, per angle (rad/s²), and its spin for the next. */
  const push = new Float64Array(2 * N);
  let version = 0;
  const scratch: Pose = {};
  /**
   * Reaching for something (reachFor): which side's arm, the point (the body's space, the `.R`
   * side's terms), and how far the reach has come in (eased toward 1 while on, 0 once let go).
   */
  const reaching = { on: false, side: 0 as Side, x: 0, y: 0, z: 0, w: 0 };
  const reachPose: Pose = {};
  const lim = DOFS.map((d) => LIMIT[d].map((v) => v * D2R) as [number, number]);

  rig.update(q);

  /** Plays a quirk now (over whatever runs, which lets go), on a side (0 its `.R`), or a random one. */
  function play(name: QuirkName, side?: Side) {
    if (o.reducedMotion) return false;
    const Q = QUIRKS[name] as Quirk;
    for (const r of running) r.q = { ...r.q, dur: Math.min(r.q.dur, t - r.t0 + r.q.ramp[1]) };
    const flip = side === undefined ? Math.random() < 0.5 : side === 1;
    running.push({ q: Q, name, t0: t, flip, w: 0 });
    last = name;
    o.onQuirk?.(name, flip ? 1 : 0);
    // nothing of its own accord until a while after it
    next = Math.max(next, t + Q.dur + PACE.gap[0] + Math.random() * (PACE.gap[1] - PACE.gap[0]));
    return true;
  }

  /** The targets now: the posture, its life afloat and what runs. */
  function aim() {
    const float = mode === "float";
    let calm = 1;
    for (const r of running) if (r.q.still) calm = Math.min(calm, 1 - r.w);
    const alive = float && !o.reducedMotion ? life * calm : 0, body = alive > 0 ? noise(BODY) : 0;
    const size = 1 + (IDLE_LIFE.asleep.size - 1) * sleep;
    if (alive > 0) for (let L = 0; L < 4; L++) limbNoise[L] = noise(LIMB0 + L);
    for (let s = 0; s < 2; s++) for (let k = 0; k < N; k++) {
      const d = DOFS[k], i = s * N + k;
      const base = float ? (FLOAT[d] ?? 0) * life : 0;
      let own = 0;
      if (alive > 0) {
        const l = IDLE_LIFE.limb[d], b = IDLE_LIFE.body[d];
        own = alive * (IDLE_LIFE.sway[d] * size * (b * body + l * limbNoise[limbOf(i)] + Math.sqrt(Math.max(0, 1 - l * l - b * b)) * noise(i)) + (IDLE_LIFE.breath[d] ?? 0) * breath + settled(i));
      }
      target[i] = (base + own) * D2R;
      stiff[i] = 1;
    }
    for (let n = running.length - 1; n >= 0; n--) {
      const r = running[n], u = t - r.t0, Q = r.q;
      if (u >= Q.dur) { running.splice(n, 1); continue; }
      r.w = smooth(u / Q.ramp[0]) * smooth((Q.dur - u) / Q.ramp[1]);
    }
    for (const r of running) {
      const u = t - r.t0;
      for (let s = 0; s < 2; s++) {
        for (const d of DOFS) delete scratch[d];
        const own = (r.flip ? 1 - s : s) as Side;
        r.q.pose(u, own, scratch, data);
        for (let k = 0; k < N; k++) {
          const v = scratch[DOFS[k]];
          if (v === undefined) continue;
          const i = s * N + k;
          target[i] += (v * D2R - target[i]) * r.w;
          stiff[i] = 1 + ((r.q.stiff ?? 1) - 1) * r.w;
        }
      }
    }
  }

  /** The reach, over the rest (see reachFor): the arm's angles for the point, its hand turned palm out. */
  function aimReach() {
    if (reaching.w <= 0) return;
    for (const d of DOFS) delete reachPose[d];
    reach(data, Math.max(reaching.x, safeX(reaching.y)), reaching.y, reaching.z, REACH_POLE, reachPose);
    reachPose.wrTwist = 35; reachPose.wrBend = -12;
    const w = smooth(reaching.w);
    for (let k = 0; k < 6; k++) {
      const v = reachPose[DOFS[k]];
      if (v === undefined) continue;
      const i = reaching.side * N + k;
      target[i] += (v * D2R - target[i]) * w;
    }
  }

  /** On `dt` seconds: the springs toward the targets, what the body's motion did, the joints' limits. */
  function step(dt: number) {
    t += dt;
    sleep = Math.max(0, Math.min(1, sleep + (asleep ? dt : -dt) / IDLE_LIFE.asleep.ease));
    tn += dt * (1 + (IDLE_LIFE.asleep.pace - 1) * sleep);
    if (held) {
      q.set(held);
      vel.fill(0);
      rig.update(q);
      return;
    }
    if (mode === "float" && !o.reducedMotion && !asleep && life > 0.5 && t >= next && !running.length && reaching.w === 0) {
      let total = 0;
      for (const [n, w] of IDLE) if (n !== last) total += w;
      let r = Math.random() * total, pick: QuirkName = IDLE[0][0];
      for (const [n, w] of IDLE) { if (n === last) continue; r -= w; if (r <= 0) { pick = n; break; } }
      play(pick);
    }
    if (mode === "float" && !o.reducedMotion && !asleep && life > 0.5 && t >= nextSettle) settle();
    reaching.w = Math.max(0, Math.min(1, reaching.w + (reaching.on ? dt / REACH_IN : -dt / REACH_OUT)));
    aim();
    aimReach();
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    let moved = 0;
    for (let i = 0; i < 2 * N; i++) {
      const [w0, z] = SPRING[DOFS[i % N]], w = w0 * stiff[i], [lo, hi] = lim[i % N];
      const before = q[i];
      vel[i] += Math.max(-FEEL.most, Math.min(FEEL.most, push[i])) * dt;
      for (let k = 0; k < n; k++) {
        let a = -w * w * (q[i] - target[i]) - 2 * z * w * vel[i];
        // past a limit, a stiff spring and a damper hold it back
        if (q[i] < lo) a += 400 * (lo - q[i]) - 30 * Math.min(0, vel[i]);
        if (q[i] > hi) a -= 400 * (q[i] - hi) + 30 * Math.max(0, vel[i]);
        vel[i] += a * h;
        q[i] += vel[i] * h;
      }
      moved = Math.max(moved, Math.abs(q[i] - before));
    }
    push.fill(0);
    if (moved > 1e-5) version++;
    rig.update(q);
  }

  // ---- the body's motion felt
  const JOINT_OF = [0, 0, 0, 1, 2, 2, 3, 3, 3, 4];   // which joint each angle turns at
  const pivot = new Float64Array(3), com = new Float64Array(3), axis = new Float64Array(3);
  /** Each joint's weight beyond it, where it is at rest (the body's space, `.R` side): the arm's, the forearm and hand's, the hand's, the leg's, the foot's. */
  const beyond = (() => {
    const j = data.joints, along = (k: number, t2: number) => j[k].pivot.map((c, i) => c + j[k].axis[i] * t2);
    const hand = along(2, HAND), foot = [j[4].pivot[0], j[4].pivot[1] + 88, 64];
    const mid = (a: number[], b: number[], wa: number, wb: number) => a.map((c, i) => (c * wa + b[i] * wb) / (wa + wb));
    const fore = mid(j[1].pivot, j[2].pivot, 1, 1), upper = mid(j[0].pivot, j[1].pivot, 1, 1), leg = mid(j[3].pivot, j[4].pivot, 1, 1);
    const arm = [0, 1, 2].map((i) => (upper[i] * 1 + fore[i] * 0.8 + hand[i] * 1.2) / 3);
    const lower = [0, 1, 2].map((i) => (fore[i] * 0.8 + hand[i] * 1.2) / 2);
    return [arm, lower, hand, [0, 1, 2].map((i) => (leg[i] * 1.4 + foot[i]) / 2.4), foot];
  })();
  /** Which segment carries each joint's weight, `.R` side: the upper arm, the forearm, the hand, the leg, the foot. */
  const CARRIER = [1, 3, 5, 6, 9];
  /**
   * The body's motion this frame, for the limbs to feel: its acceleration (mesh units/s², its own
   * frame: x right, y down), its turn's acceleration and its spin (rad/s and rad/s², clockwise as
   * seen), about its middle at `cy` (mesh units down from the head's centre). Each limb is a weight on
   * its joint: what the motion leaves behind of it (the acceleration's opposite, the spin's fling)
   * swings it about each of the joint's axes by as much as that axis can take it.
   */
  function feel(ax: number, ay: number, spinAcc: number, spin: number, cy: number) {
    if (o.reducedMotion || held) return;
    const M = rig.transforms;
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < N; k++) {
        const jk = JOINT_OF[k], i = s * N + k;
        // where the joint and its weight are now (the `.R` side's formulas: the `.L` side feels the mirrored motion)
        const seg = CARRIER[jk], parentSeg = data.segments[seg][1];
        const jp = data.joints[jk + s * 5].pivot, rest = beyond[jk];
        place(M, parentSeg + (s && parentSeg ? 9 : 0), jp[0], jp[1], jp[2], pivot);
        place(M, seg + (s ? 9 : 0), s ? -rest[0] : rest[0], rest[1], rest[2], com);
        // the motion left behind at the weight: minus the acceleration, the turn's and the spin's (outward)
        const rx = com[0], ry = com[1] - cy;
        let gx = -ax + spinAcc * ry + spin * spin * rx;
        const gy = -ay - spinAcc * rx + spin * spin * ry;
        if (s) { pivot[0] = -pivot[0]; com[0] = -com[0]; gx = -gx; }
        // the angle's axis now, about which a turn of it swings the weight (by the angle's own formula, see createRig)
        angleAxis(k, s, axis);
        const r0 = com[0] - pivot[0], r1 = com[1] - pivot[1], r2 = com[2] - pivot[2];
        // the torque about the axis, over the weight's reach from it squared (a point weight)
        const tq = axis[0] * (r1 * 0 - r2 * gy) + axis[1] * (r2 * gx - r0 * 0) + axis[2] * (r0 * gy - r1 * gx);
        const kr = axis[0] * r0 + axis[1] * r1 + axis[2] * r2, reach = Math.max(r0 * r0 + r1 * r1 + r2 * r2 - kr * kr, 60 * 60);
        push[i] += (FEEL.gain * tq) / reach;
      }
    }
  }
  const tA = m3(), tB = m3(), tT = m3();
  /** The axis an angle turns about now (body space, as the `.R` side's formulas give it for that side's angles), into o. */
  function angleAxis(k: number, s: number, o3: Float64Array) {
    const j = data.joints, qo = s * N, M = rig.transforms;
    let v: ArrayLike<number>, seg = 0;
    const rot = (m: M3, a: ArrayLike<number>) => { o3[0] = m[0] * a[0] + m[1] * a[1] + m[2] * a[2]; o3[1] = m[3] * a[0] + m[4] * a[1] + m[5] * a[2]; o3[2] = m[6] * a[0] + m[7] * a[1] + m[8] * a[2]; };
    if (k === 1 || k === 7) { o3[0] = 0; o3[1] = 0; o3[2] = -1; return; }   // out to the side: about the view's axis, backward
    if (k === 0) { axisAngle(tA, Z, -q[qo + 1]); rot(tA, j[0].out); return; }
    if (k === 2) { axisAngle(tA, Z, -q[qo + 1]); axisAngle(tB, j[0].out, q[qo]); mul3(tT, tA, tB); rot(tT, j[0].axis); return; }
    if (k === 6) { axisAngle(tA, Z, -q[qo + 7]); rot(tA, X); return; }
    if (k === 8) { axisAngle(tA, Z, -q[qo + 7]); axisAngle(tB, X, q[qo + 6]); mul3(tT, tA, tB); rot(tT, Y); return; }
    // the rest turn in their parent's frame: the upper arm's (the elbow), the forearm's (the wrist), the leg's (the ankle)
    if (k === 3) { v = j[1].out; seg = 1; }
    else if (k === 4) { v = j[2].axis; seg = 3; }
    else if (k === 5) { axisAngle(tA, j[2].axis, q[qo + 4]); rot(tA, Z); v = [o3[0], o3[1], o3[2]]; seg = 3; }
    else { v = X; seg = 6; }
    // the parent's turn, unmirrored (the `.L` side's transforms are mirrors: M T M)
    const S = (seg + (s ? 9 : 0)) * 12, m = (i: number, c: number) => M[S + i * 4 + c] * (s && (i === 0) !== (c === 0) ? -1 : 1);
    const a0 = v[0], a1 = v[1], a2 = v[2];
    o3[0] = m(0, 0) * a0 + m(0, 1) * a1 + m(0, 2) * a2; o3[1] = m(1, 0) * a0 + m(1, 1) * a1 + m(1, 2) * a2; o3[2] = m(2, 0) * a0 + m(2, 1) * a1 + m(2, 2) * a2;
  }

  return {
    /** Each segment's transform now (see createRig). */
    get transforms() { return rig.transforms; },
    /** Bumped whenever an angle moves: a painter repaints on a new one. */
    get version() { return version; },
    /** The posture: "rest" (as modelled, arms hanging), or "float" (zero gravity's, with its drift and quirks). */
    setMode(m: LimbsMode) { if (m !== mode) { mode = m; if (m === "float") next = t + PACE.first; } },
    /** How much of its own life it has afloat, 0..1: the posture, the drift and the quirks come in with it. */
    setLife(v: number) { life = Math.max(0, Math.min(1, v)); },
    /** Its breath now (the head's): 1 at the top of an in-breath, -1 at the bottom of an out-breath; afloat, the limbs lift a little with it. */
    breathe(w: number) { breath = Math.max(-1.5, Math.min(1.5, w)); },
    /** Asleep or dozing: its limbs drift smaller and slower (see IDLE_LIFE.asleep), and it starts nothing of its own accord. */
    setAsleep(v: boolean) {
      if (v === asleep) return;
      // dozing off, it lets go of what it was doing; woken, it does not go straight into something
      if (v) for (const r of running) r.q = { ...r.q, dur: Math.min(r.q.dur, t - r.t0 + r.q.ramp[1]) };
      else next = Math.max(next, t + PACE.first);
      asleep = v;
    },
    play,
    /**
     * Reach for a point (the body's space at rest: head space, mesh units, y down), with the arm on
     * `side` (0 the `.R`, on the viewer's right); the arm points at it if it is out of reach. It
     * comes in over a moment and holds the point as it moves; null lets it go. Nothing of itself
     * starts while it reaches.
     */
    reachFor(p: [number, number, number] | null, side: Side = 0) {
      if (o.reducedMotion) return;
      if (!p) { reaching.on = false; return; }
      if (reaching.w > 0 && side !== reaching.side) return;   // the other arm is still coming down
      reaching.on = true; reaching.side = side;
      reaching.x = side ? -p[0] : p[0]; reaching.y = p[1]; reaching.z = p[2];
    },
    /** Reaching for something (or coming back from it). */
    get reaching() { return reaching.w > 0; },
    /** Whatever runs lets go (over its own ramp out). */
    calm() { for (const r of running) r.q = { ...r.q, dur: Math.min(r.q.dur, t - r.t0 + r.q.ramp[1]) }; },
    /** The quirk running (the last begun), or null. */
    get doing(): QuirkName | null { return running.length ? running[running.length - 1].name : null; },
    /** Its head to its own hand: the side's (0 `.R`), while a quirk running asks it to; null otherwise. */
    get lookHand(): Side | null {
      for (let n = running.length - 1; n >= 0; n--) {
        const r = running[n], L = r.q.look, u = t - r.t0;
        if (L && u >= L[0] && u <= L[1]) return r.flip ? 1 : 0;
      }
      return null;
    },
    feel,
    /** A pose held exactly (both sides, degrees; the sheet's), or null to let the springs have it again. */
    hold(R: Pose | null, L?: Pose) {
      if (!R) { held = null; return; }
      held = new Float64Array(2 * N);
      DOFS.forEach((d, k) => { held![k] = (R[d] ?? 0) * D2R; held![N + k] = ((L ?? R)[d] ?? 0) * D2R; });
      q.set(held);
      version++;
      rig.update(q);
    },
    step,
    /** The angles now, radians (both sides' ten). */
    angles: q,
  };
}
export type Limbs = ReturnType<typeof createLimbs>;
