/**
 * Urchi's own body, without the spacesuit (/dev/body): a plush's, small under the big head. A
 * round torso tucked up under the chin, wider below than above; two stubby legs; and a round ball
 * of a hand at each side, no arm to it. Built here as low-poly solids, faceted as the head is
 * (a few dozen flat planes each), in the head's space: x right, y down, z toward the eye, the
 * neck where the suit's neck ring is (the body hangs from it and follows the head as the suit's
 * does). Each plane is a loop of vertex indices, wound so that it runs the positive way round on
 * screen (as the head's triangles do) while it faces the eye.
 */

type Vec3 = [number, number, number];

/** A solid: its middle, its radii, how many facets round and from top to bottom, and how much wider it is at the bottom than the top (0 an ellipsoid). */
type Solid = { c: Vec3; r: Vec3; around: number; down: number; pear?: number };

/**
 * The parts, in mesh units (the head is 1012 across its spikes, 890 across its face, 871 from ear
 * tip to chin; its chin is at y 435.5). The torso's top hides behind the chin; the legs come out
 * of its bottom, a notch between them; the hands rest against its sides, a little forward.
 */
export const BARE_PARTS: Record<string, Solid> = {
  torso: { c: [0, 565, 0], r: [215, 195, 170], around: 10, down: 6, pear: 0.3 },
  "leg.R": { c: [90, 778, 12], r: [84, 118, 96], around: 8, down: 5 },
  "leg.L": { c: [-90, 778, 12], r: [84, 118, 96], around: 8, down: 5 },
  "hand.R": { c: [272, 690, 64], r: [104, 102, 98], around: 8, down: 5 },
  "hand.L": { c: [-272, 690, 64], r: [104, 102, 98], around: 8, down: 5 },
};

export type BareBody = {
  /** Vertices, flat: x, y, z each. */
  v: Float64Array;
  /** Per plane, its loop of vertex indices. */
  planes: Int32Array[];
};

/**
 * A solid as rings of vertices from top to bottom, a pole at each end: triangles round the poles,
 * flat quads between the rings (a ring is level, so each quad lies in one plane).
 */
function solid(s: Solid, v: number[], planes: Int32Array[]) {
  const { c, r, around, down } = s, pear = s.pear ?? 0;
  const push = (x: number, y: number, z: number) => { v.push(c[0] + x, c[1] + y, c[2] + z); return v.length / 3 - 1; };
  const top = push(0, -r[1], 0);
  const rings: number[][] = [];
  for (let k = 1; k < down; k++) {
    const phi = (Math.PI * k) / down, y = -Math.cos(phi), w = Math.sin(phi) * (1 + pear * y);
    const ring: number[] = [];
    for (let a = 0; a < around; a++) {
      const th = (2 * Math.PI * a) / around;
      ring.push(push(r[0] * w * Math.sin(th), r[1] * y, r[2] * w * Math.cos(th)));
    }
    rings.push(ring);
  }
  const bottom = push(0, r[1], 0);
  const faces: number[][] = [];
  const first = rings[0], last = rings[rings.length - 1];
  for (let a = 0; a < around; a++) faces.push([top, first[a], first[(a + 1) % around]]);
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k], B = rings[k + 1];
    for (let a = 0; a < around; a++) { const a1 = (a + 1) % around; faces.push([A[a], B[a], B[a1], A[a1]]); }
  }
  for (let a = 0; a < around; a++) faces.push([bottom, last[(a + 1) % around], last[a]]);
  // wound to run the positive way round on screen while facing out (see the module's note): the
  // cross of its first two edges points away from the middle
  const P = (i: number): Vec3 => [v[i * 3], v[i * 3 + 1], v[i * 3 + 2]];
  for (const f of faces) {
    const [a, b, d] = f.map(P), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const out = (a[0] + b[0] + d[0]) / 3 - c[0], up = (a[1] + b[1] + d[1]) / 3 - c[1], fwd = (a[2] + b[2] + d[2]) / 3 - c[2];
    planes.push(Int32Array.from(n[0] * out + n[1] * up + n[2] * fwd > 0 ? f : f.slice().reverse()));
  }
}

let built: BareBody | null = null;
/** The body, built the first time it is wanted. */
export function bareBody(): BareBody {
  if (built) return built;
  const v: number[] = [], planes: Int32Array[] = [];
  for (const s of Object.values(BARE_PARTS)) solid(s, v, planes);
  return (built = { v: Float64Array.from(v), planes });
}
