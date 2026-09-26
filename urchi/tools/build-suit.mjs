#!/usr/bin/env node
// Builds Urchi's spacesuit and bakes it into src/engine/urchi/suit.json.
//
//   npm run urchi:suit                    # build, check and bake
//   node urchi/tools/build-suit.mjs --dry # build and check only
//   --verbose                             # the visor's margin by yaw, the tightest part pairs
//   --quick                               # the visor and rim checked in a few poses only, for trying shapes
//
// The suit is modelled in the head's own space (mesh.json: x right, y down, z toward the
// viewer, the same units), after a reference sheet of a chibi low-poly astronaut: a rounded
// helmet of irregular, chunky facets that fits the head closely, with a big visor framed by a
// thick rim (the helmet's frontmost part, seen side on) and a comm disc on each side; a slim neck
// ring; a short chunky torso (chest, belt, hips) with a chest panel, its buttons and two lights;
// thick hoses from the panel's sides, round the hips and up into the top of a tall box backpack;
// shoulders, upper arms and forearms with joint rings and big mittens with thumbs; short legs
// with knee pads; chunky boots on dark soles. The sheet was generated, so it is not symmetrical,
// and its helmet has bear ears: this has neither.
//
//  1. Fit. The helmet is sized from the head itself (each half-axis is the reach of the head's
//     core that way and a margin): its faceted shell must hold every vertex of the core (all of
//     the head but the ear tips and the side spikes) with room to spare, and
//     the visor must frame both eyes, a little wider than they ever open, in every pose the
//     head reaches (the yaw, pitch and roll the attention system and its acts add up to). The
//     ears and spikes do not fit: their tips are folded flat, under the shell (baked as `tuck`),
//     and the painter only ever shows the head through the visor.
//  2. Parts. Only the right half is modelled. A part that crosses the middle (the helmet, the
//     torso, the backpack) is its right half mirrored onto itself, sharing its vertices on the
//     centre plane; a part on one side (an arm, a boot) is built on the right and mirrored into
//     its left twin. Every part is a closed, consistently wound low-poly surface whose flat
//     planes are about the size of the head's. The body's parts are convex (each is the convex
//     hull of the points that shape it), and those that meet do so flat on to each other, a
//     shoulder on a flat of the torso, a leg on the flat under it: so any two of them have a
//     plane between them, baked, and the painter orders them exactly from any side.
//  3. Checks, printed: exact mirror symmetry (every vertex has a partner at (-x, y, z) and every
//     face a mirrored face), each part closed and consistently wound, no degenerate faces, the
//     body's parts convex and apart, the triangle count per part, the helmet's fit, the eyes'
//     margin inside the visor, the rim whole round the glass in every pose the head reaches, and
//     the rim in front of the glass seen side on.
//  4. Bake: vertices, triangles, the plane each belongs to, part and material per vertex, the
//     faces never seen (inside another part, or flat against one), the planes between the body's
//     parts (mirrored as the parts are), the head's tucked vertices, the visor's window as seen
//     from the helmet's middle and its opening (the glass uncapped), and (beside it, in
//     suit-frame.json) the canvas frame that holds the suited figure in any pose.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HEAD = JSON.parse(readFileSync(resolve(ROOT, 'src/engine/urchi/mesh.json'), 'utf8'));
const OUT = resolve(ROOT, 'src/engine/urchi/suit.json');
// the frame alone, tiny, which the painter needs before the model itself is loaded
const OUT_FRAME = resolve(ROOT, 'src/engine/urchi/suit-frame.json');
const DRY = process.argv.includes('--dry');
const VERBOSE = process.argv.includes('--verbose');
// the visor and rim sweep cut to a few poses (the bake is the same; its checks are not all made)
const QUICK = process.argv.includes('--quick');

// ------------------------------------------------------------------ vectors
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1));
const lerp = (a, b, t) => a + (b - a) * t;
const centroid = (pts) => mul(pts.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / pts.length);
const mirror = (p) => [-p[0], p[1], p[2]];
const D2R = Math.PI / 180;
const fail = (msg) => { throw new Error(msg); };

// ------------------------------------------------------------------ the head
// The painter's pivots (character.ts): yaw and pitch turn about the middle of the head, roll
// about a point TILT_PIVOT lower (a neck), and the eye sits PERSPECTIVE units in front.
const PIVOT_Y = HEAD.pivot[1], TILT_PIVOT = 250, PERSPECTIVE = 2800;
// The protrusions the helmet does not hold: the ear tips and the three spikes on each side.
// Everything else is the core.
const isProtrusion = ([x, y]) => y < -300 || Math.abs(x) > 430;
const CORE = HEAD.v.filter((p) => !isProtrusion(p));

// ------------------------------------------------------------------ poses
// Every pose the head can take on the site, as far as its springs carry it (character.ts,
// attention.ts, acts.ts), rounded out:
//   yaw   the gaze's aim reaches 41.25 (41.9 with the spring's overshoot), a curious tilt turns
//         up to 5 more (5.5 swinging across), a mote's wind-up holds a pose of 5: 52.4 in all
//         (though the wind-up turns away from where it then looks, so it never adds to a gaze).
//         A glance (22) turns against the gaze, so it only adds to a gaze under about 30.
//   pitch up: the gaze 17.5, a tilt 3, a sleeper's breath 3.15 x 1.4, the stretch 9.5, a
//         startle's kick about 4 on the pose's spring (the intro's deep breath, 3 x 3.15, comes
//         only while the head is bare): 38.4. Down: the gaze 15, a tilt 2, the breath 4.4, the
//         asleep dip 7, a nod 4: 32.4.
//   roll  a tilt up to 15 (13 cued), overshooting to 17.5 when it swings across, the owl's bob
//         3 or the listening sway 2.5 on top: 20.5.
const RANGE = { yaw: 56, pitchUp: 42, pitchDown: 34, roll: 22 };
/**
 * What the head reaches together, rather than axis by axis: the gaze at a corner of the screen
 * (41.9 across, 17.5 up or 15 down) with a curious tilt on it (5.5, 3 up or 2 down, 17.5 roll), a
 * breath (3.15), the owl's bob (3), and on top the stretch as it wakes looking at you (9.5 up) or
 * a nod over a pill (4 down). The sleeper's deeper breath and dip come with no gaze to follow, and
 * a startle's kick replaces the stretch, never adds to it. The rim must stay whole all through
 * this, and at every yaw of the sweep with the head about level (LEVEL); past it, at the sweep's
 * far corners where every extra comes at once, the tool measures and reports it.
 */
const REACH = { yaw: 47.4, pitchUp: 33.2, pitchDown: 24.2, roll: 20.5 };
const LEVEL = 6;
const inReach = ({ yaw, pitch, roll }) => (Math.abs(yaw) <= REACH.yaw + 1e-9 && pitch >= -REACH.pitchUp - 1e-9 && pitch <= REACH.pitchDown + 1e-9 && Math.abs(roll) <= RANGE.roll) || Math.abs(pitch) <= LEVEL;
/** The reach's own corners and edges, and every yaw of the sweep with the head level, to add to the sweep. */
function* reachGrid() {
  for (const yaw of [-REACH.yaw, -30, 30, REACH.yaw]) for (const pitch of [-REACH.pitchUp, 0, REACH.pitchDown]) for (const roll of [-REACH.roll, 0, REACH.roll]) yield { yaw, pitch, roll };
  for (const yaw of [-RANGE.yaw, -52, 52, RANGE.yaw]) for (const pitch of [-LEVEL, 0, LEVEL]) for (const roll of [-RANGE.roll, 0, RANGE.roll]) yield { yaw, pitch, roll };
}
function* poseSweep(n) {
  for (const yaw of [-RANGE.yaw, -40, -20, 0, 20, 40, RANGE.yaw])
    for (const pitch of [-RANGE.pitchUp, -25, -10, 0, 12, RANGE.pitchDown])
      for (const roll of [-RANGE.roll, -10, 0, 10, RANGE.roll]) yield { yaw, pitch, roll };
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) yield { yaw: lerp(-RANGE.yaw, RANGE.yaw, rnd()), pitch: lerp(-RANGE.pitchUp, RANGE.pitchDown, rnd()), roll: lerp(-RANGE.roll, RANGE.roll, rnd()) };
}
/** The painter's head projection (degrees in): [x, y] on screen and z toward the viewer. */
function headProjector({ yaw, pitch, roll }) {
  const cy = Math.cos(yaw * D2R), sy = Math.sin(yaw * D2R), cp = Math.cos(pitch * D2R), sp = Math.sin(pitch * D2R), cr = Math.cos(roll * D2R), sr = Math.sin(roll * D2R);
  return ([px, py, pz]) => {
    const x = px, y = py - PIVOT_Y, z = pz;
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
    const xr = x1 * cr - (y2 - TILT_PIVOT) * sr, yr = x1 * sr + (y2 - TILT_PIVOT) * cr + TILT_PIVOT;
    const s = PERSPECTIVE / (PERSPECTIVE - z2);
    return [xr * s, (yr + PIVOT_Y) * s, z2];
  };
}

// ------------------------------------------------------------------ parts
const MATERIALS = ['fabric', 'grey', 'dark', 'glass', 'accent', 'pack'];
const parts = [];
/**
 * A part. `centre` parts cross the middle: built as their right half (x >= 0, the middle exactly
 * on x = 0) and mirrored onto themselves; the others are built on the right as `name.R` and get
 * a `name.L` twin. `rigid`: what carries it, the head (the helmet) or the body. `decal` (helmet
 * only): it lies on the shell and is drawn after the glass where the eye sees it past the shell,
 * face by face (1, the rim) or as a whole while it faces the eye (2, a disc).
 */
function part(name, material, o = {}) {
  const P = { name, material, centre: !!o.centre, rigid: o.rigid || 'body', decal: o.decal || 0, v: [], f: [], hide: new Set(), whole: false };
  P.vert = (p) => {
    let x = p[0];
    if (P.centre) {
      if (x < -1e-6) fail(`${name}: a centre part's half must stay at x >= 0 (got ${x})`);
      if (Math.abs(x) < 1e-6) x = 0;
    } else if (x <= 0) fail(`${name}: a side part must stay right of the middle (got ${x})`);
    P.v.push([x, p[1], p[2]]);
    return P.v.length - 1;
  };
  P.tri = (a, b, c) => { if (a !== b && b !== c && a !== c) P.f.push([a, b, c]); };
  /** A quad as two triangles, cut along its shorter diagonal. */
  P.quad = (a, b, c, d) => {
    if (len(sub(P.v[a], P.v[c])) <= len(sub(P.v[b], P.v[d]))) { P.tri(a, b, c); P.tri(a, c, d); }
    else { P.tri(a, b, d); P.tri(b, c, d); }
  };
  parts.push(P);
  return P;
}

// ------------------------------------------------------------------ convex hulls
/**
 * The convex hull of a set of points: triangles as index triples, wound outward (by the right
 * hand, as the head is). Incremental: a point strictly in front of any face replaces the faces
 * it sees with a fan from their horizon; a point on or inside the hull is left out.
 */
function hull3(pts) {
  const n = pts.length;
  const lo = pts.reduce((m, p) => Math.min(m, ...p), Infinity), hi = pts.reduce((m, p) => Math.max(m, ...p), -Infinity);
  const EPS = 1e-7 * (hi - lo);
  // a first tetrahedron of well spread points
  const i0 = 0;
  let i1 = -1, best = 0;
  pts.forEach((p, i) => { const d = len(sub(p, pts[i0])); if (d > best) { best = d; i1 = i; } });
  let i2 = -1; best = 0;
  pts.forEach((p, i) => { const d = len(cross(sub(pts[i1], pts[i0]), sub(p, pts[i0]))); if (d > best) { best = d; i2 = i; } });
  let i3 = -1; best = 0;
  const n0 = cross(sub(pts[i1], pts[i0]), sub(pts[i2], pts[i0]));
  pts.forEach((p, i) => { const d = Math.abs(dot(n0, sub(p, pts[i0]))); if (d > best) { best = d; i3 = i; } });
  if (i1 < 0 || i2 < 0 || i3 < 0 || best < EPS * len(n0)) fail('hull: the points are flat');
  const faces = [];
  const plane = (f) => { const a = pts[f[0]], nn = unit(cross(sub(pts[f[1]], a), sub(pts[f[2]], a))); return { n: nn, d: dot(nn, a) }; };
  const mk = (a, b, c) => { const f = [a, b, c]; f.pl = plane(f); f.alive = true; faces.push(f); return f; };
  const inner = centroid([pts[i0], pts[i1], pts[i2], pts[i3]]);
  for (const [a, b, c] of [[i0, i1, i2], [i0, i2, i3], [i0, i3, i1], [i1, i3, i2]]) {
    const f = plane([a, b, c]);
    if (dot(f.n, inner) - f.d > 0) mk(a, c, b); else mk(a, b, c);
  }
  for (let p = 0; p < n; p++) {
    if (p === i0 || p === i1 || p === i2 || p === i3) continue;
    const seen = faces.filter((f) => f.alive && dot(f.pl.n, pts[p]) - f.pl.d > EPS);
    if (!seen.length) continue;
    const edges = new Set();
    for (const f of seen) for (let k = 0; k < 3; k++) edges.add(`${f[k]}>${f[(k + 1) % 3]}`);
    for (const f of seen) f.alive = false;
    for (const e of edges) { const [a, b] = e.split('>').map(Number); if (!edges.has(`${b}>${a}`)) mk(a, b, p); }
  }
  return faces.filter((f) => f.alive).map((f) => [f[0], f[1], f[2]]);
}

/** Coplanar neighbouring triangles as polygons: each an outward boundary loop of vertex indices. */
function polygons(v, faces) {
  const pl = faces.map(([a, b, c]) => { const n = unit(cross(sub(v[b], v[a]), sub(v[c], v[a]))); return { n, d: dot(n, v[a]) }; });
  const parent = faces.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const byEdge = new Map();
  faces.forEach((f, fi) => { for (let k = 0; k < 3; k++) byEdge.set(`${f[k]}>${f[(k + 1) % 3]}`, fi); });
  faces.forEach((f, fi) => {
    for (let k = 0; k < 3; k++) {
      const gi = byEdge.get(`${f[(k + 1) % 3]}>${f[k]}`);
      if (gi !== undefined && dot(pl[fi].n, pl[gi].n) > 1 - 1e-9 && Math.abs(pl[fi].d - pl[gi].d) < 1e-6) parent[find(fi)] = find(gi);
    }
  });
  const groups = new Map();
  faces.forEach((_, fi) => { const r = find(fi); (groups.get(r) || groups.set(r, []).get(r)).push(fi); });
  return [...groups.values()].map((fis) => {
    const edges = new Map(), set = new Set();
    for (const fi of fis) for (let k = 0; k < 3; k++) set.add(`${faces[fi][k]}>${faces[fi][(k + 1) % 3]}`);
    for (const e of set) { const [a, b] = e.split('>').map(Number); if (!set.has(`${b}>${a}`)) edges.set(a, b); }
    const start = edges.keys().next().value, loop = [start];
    for (let a = edges.get(start); a !== start; a = edges.get(a)) { loop.push(a); if (loop.length > edges.size) fail('polygons: a broken loop'); }
    return { loop, n: pl[fis[0]].n };
  });
}

/** A convex polygon's loop as triangles, clipping ears that have area (points on an edge stay). */
function earClip(v, loop, n) {
  // a fan from a corner that is neither inside nor at the end of a straight run of points has no
  // flat triangle in it (clipping ears one by one can leave a straight run for last)
  const straight = (a, b, c) => len(cross(sub(v[b], v[a]), sub(v[c], v[a]))) < 1e-6;
  const at = (s, k) => loop[(((s + k) % loop.length) + loop.length) % loop.length];
  for (let s = 0; s < loop.length && loop.length > 3; s++) {
    if (straight(at(s, -1), at(s, 0), at(s, 1)) || straight(at(s, -2), at(s, -1), at(s, 0)) || straight(at(s, 0), at(s, 1), at(s, 2))) continue;
    return Array.from({ length: loop.length - 2 }, (_, k) => [at(s, 0), at(s, k + 1), at(s, k + 2)]);
  }
  const L = loop.slice(), out = [];
  while (L.length > 3) {
    let k = 0;
    for (; k < L.length; k++) {
      const a = v[L[(k + L.length - 1) % L.length]], b = v[L[k]], c = v[L[(k + 1) % L.length]];
      if (dot(cross(sub(b, a), sub(c, a)), n) > 1e-6) break;
    }
    if (k === L.length) fail('earClip: no ear');
    out.push([L[(k + L.length - 1) % L.length], L[k], L[(k + 1) % L.length]]);
    L.splice(k, 1);
  }
  out.push([L[0], L[1], L[2]]);
  return out;
}

/**
 * A convex part's surface from the points that shape it. A side part is the hull itself (its
 * twin is its mirror). A centre part is given its right half: the hull of that and its mirror,
 * with every flat face that crosses the middle cut there and each half's triangles mirrored,
 * so the surface is exactly symmetric.
 */
function hullPart(name, material, pts, o = {}) {
  const P = part(name, material, o);
  P.convex = true;
  if (!P.centre) {
    for (const p of pts) P.vert(p);
    const F = hull3(P.v);
    const used = [...new Set(F.flat())].sort((a, b) => a - b), map = new Map(used.map((i, k) => [i, k]));
    P.v = used.map((i) => P.v[i]);
    P.f = F.map((f) => f.map((i) => map.get(i)));
  } else {
    const key = (p) => p.map((c) => Math.round(c * 1e6)).join(',');
    const right = pts.map((p) => [Math.abs(p[0]) < 1e-6 ? 0 : p[0], p[1], p[2]]);
    if (right.some((p) => p[0] < 0)) fail(`${name}: a centre part's half must stay at x >= 0`);
    const all = [...right, ...right.filter((p) => p[0] > 0).map(mirror)];
    const F = hull3(all);
    const V = [], at = new Map();
    const idx = (p) => { const k = key(p); if (!at.has(k)) { at.set(k, V.length); V.push(p); } return at.get(k); };
    const faces = [];
    for (const pg of polygons(all, F)) {
      const xs = pg.loop.map((i) => all[i][0]);
      if (Math.max(...xs) <= 1e-9) continue;   // a left face: its right twin brings it
      let half;
      if (Math.min(...xs) >= -1e-9) half = pg.loop.map((i) => all[i]);
      else {
        // cut at x = 0: an edge that crosses joins a point and its mirror, so it crosses at their middle
        half = [];
        const L = pg.loop.map((i) => all[i]);
        L.forEach((p, k) => {
          const q = L[(k + 1) % L.length];
          if (p[0] >= -1e-9) half.push(p[0] <= 1e-9 ? [0, p[1], p[2]] : p);
          if ((p[0] > 1e-9 && q[0] < -1e-9) || (p[0] < -1e-9 && q[0] > 1e-9)) {
            if (Math.abs(p[0] + q[0]) > 1e-6 || Math.abs(p[1] - q[1]) > 1e-6 || Math.abs(p[2] - q[2]) > 1e-6) fail(`${name}: a face crosses the middle between points that are not mirrors`);
            half.push([0, p[1], p[2]]);
          }
        });
      }
      const ids = half.map(idx);
      for (const t of earClip(V, ids, pg.n)) {
        faces.push(t);
        const m = t.map((i) => idx(mirror(V[i])));
        faces.push([m[0], m[2], m[1]]);
      }
    }
    P.v = V; P.f = faces; P.whole = true;
  }
  return P;
}

/** A ring of `sides` points round `c`, in the plane of the unit vectors u, w: half-widths ru, rw; `turn` sets where it starts. */
function ring(c, u, w, ru, rw, sides = 8, turn = 0.5) {
  return Array.from({ length: sides }, (_, k) => {
    const a = (2 * Math.PI * (k + turn)) / sides;
    return add(c, add(mul(u, Math.cos(a) * ru), mul(w, Math.sin(a) * rw)));
  });
}
/** A rounded box's section, as an octagon: half-widths ru, rw along u, w, corners cut by `c`. */
function octagon(c0, u, w, ru, rw, c) {
  return [[ru, rw - c], [ru - c, rw], [-(ru - c), rw], [-ru, rw - c], [-ru, -(rw - c)], [-(ru - c), -rw], [ru - c, -rw], [ru, -(rw - c)]].map(([a, b]) => add(c0, add(mul(u, a), mul(w, b))));
}
const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];

// ------------------------------------------------------------------ 1. the helmet
// A superellipsoid, a little boxy (as the head is), centred just above the head's pivot, with its
// own half-axes up and down, front and back, each the head's core's reach that way and a margin:
// close at the chin and the face, roomier in the dome, where the ears fold in. Its faceted shell
// must hold the core with CLEAR to spare: flat facets cut inside the smooth surface, so the check
// is against the facets.
const coreReach = (k, s) => Math.max(...CORE.map((p) => s * p[k]));
const MARGIN = { side: 100, top: 102, chin: 64, front: 92, back: 58 };
const H = {
  c: [0, PIVOT_Y - 6, 0],
  a: coreReach(0, 1) + MARGIN.side,
  top: coreReach(1, -1) + (PIVOT_Y - 6) + MARGIN.top,
  bottom: coreReach(1, 1) - (PIVOT_Y - 6) + MARGIN.chin,
  front: coreReach(2, 1) + MARGIN.front,
  back: coreReach(2, -1) + MARGIN.back,
  n: 2.25, m: 2.2,           // horizontal and vertical roundness (2 would be an ellipsoid)
  rings: [23, 47, 70, 93, 116, 136, 152],   // latitudes from the top, degrees; the bottom is flat
  seg: 7,                    // longitudes per half at the equator (staggered rings get one more)
};
/**
 * How far the shell's points stray from their rings, so its facets come out as irregular, chunky
 * planes of all sizes (as the head's are) rather than rows of equal triangles: up to `theta`
 * degrees up or down and `phi` of the spacing round, drawn from `seed` (the same every build).
 * A point on the middle only moves up or down, and the right half is mirrored, so the shell stays
 * exactly symmetric. `skip`: the chance a point of the upper rings is left out, which makes a
 * bigger plane of its neighbours (never on the middle, never low down, where the fit is close).
 */
const JITTER = { seed: 2417, theta: 7, phi: 0.38, skip: 0.2 };
/** A seeded draw in 0..1, the same sequence every build. */
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const CLEAR = 16;
/** The smooth helmet's radius along a unit direction from its centre. */
function helmetR(d) {
  const b = d[1] < 0 ? H.top : H.bottom, c = d[2] > 0 ? H.front : H.back;
  const F = Math.pow(Math.pow(Math.abs(d[0] / H.a), H.n) + Math.pow(Math.abs(d[2] / c), H.n), H.m / H.n) + Math.pow(Math.abs(d[1] / b), H.m);
  return Math.pow(F, -1 / H.m);
}
const dirOf = (theta, phi) => [Math.sin(theta) * Math.sin(phi), -Math.cos(theta), Math.sin(theta) * Math.cos(phi)];
const helmetAt = (theta, phi) => { const d = dirOf(theta, phi); return add(H.c, mul(d, helmetR(d))); };
const outside = (p) => { const r = sub(p, H.c); return len(r) / helmetR(unit(r)); };   // 1 on the smooth surface
/** The smooth surface's outward normal at a point on (or near) it. */
function helmetNormal(p) {
  const e = 0.5;
  return unit([outside(add(p, [e, 0, 0])) - outside(sub(p, [e, 0, 0])), outside(add(p, [0, e, 0])) - outside(sub(p, [0, e, 0])), outside(add(p, [0, 0, e])) - outside(sub(p, [0, 0, e]))]);
}
/** Where a ray from the helmet's inside along `dir` leaves the smooth surface. */
function helmetAlong(from, dir) {
  let lo = 0, hi = 3000;
  for (let i = 0; i < 60; i++) { const t = (lo + hi) / 2; if (outside(add(from, mul(dir, t))) > 1) hi = t; else lo = t; }
  return add(from, mul(dir, lo));
}
const helmetFront = (x, y) => helmetAlong([x, y, 0], [0, 0, 1]);

// The visor: its outline in the front view (the right half, from the top of the middle round to
// the bottom of the middle), set on the helmet's front. A wide rounded shield, its top gently
// arched and its bottom corners well rounded, framing the eyes with room for every turn.
const VISOR = [[0, -182], [150, -176], [258, -154], [326, -106], [368, -16], [384, 104], [368, 224], [320, 294], [250, 348], [140, 384], [0, 396]];
/** A point seen from the helmet's middle: its x and y over its z from there (in front only). */
const toWindow = (p) => [(p[0] - H.c[0]) / (p[2] - H.c[2]), (p[1] - H.c[1]) / (p[2] - H.c[2])];
/** Whether (x, y) lies inside a polygon of [x, y] points (even-odd). */
const inPolygon = (x, y, P) => {
  let inn = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inn = !inn;
  }
  return inn;
};
/** The glass's outline as seen from the helmet's middle, the whole loop. */
const GLASS_WINDOW = (() => {
  const half = VISOR.map(([x, y]) => toWindow(helmetFront(x, y)));
  return [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
})();
/** Whether a point on (or near) the shell lies behind the glass, seen from the helmet's middle. */
const underGlass = (p) => p[2] - H.c[2] > 1 && inPolygon(...toWindow(p), GLASS_WINDOW);
/**
 * How far forward the glass may come at (x, y), and the shell behind it: seen side on, the rim
 * must be the helmet's frontmost part (as the reference's is), yet the smooth surface bulges well
 * past the rim's sides in the middle of the face. So the glass is held back to this cap, a
 * shallow dome in front of the face (the face stays FACE_GAP behind it, checked below), and the
 * shell's points behind the glass another `shell` behind that: the visor is a hole in the shell,
 * and nothing of it may show in front of the rim from the side either. Out of the middle the
 * surface is lower than the cap and nothing changes.
 */
const CAP = { z: 442, y: 165, x1: 0.1, x2: 3.5e-4, y2: 2e-4, down: 0.15, shell: 1.5 };
const glassCap = (x, y) => CAP.z - CAP.x1 * Math.abs(x) - CAP.x2 * x * x - CAP.y2 * (y - CAP.y) ** 2 - CAP.down * Math.max(0, y - CAP.y);
/** Behind the glass, where the cap flattens the shell, its points on a grid this far apart (x, y), so its facets there follow the cap closely. */
const GRID = { x: 90, y: 80 };

// The shell: points on the surface at a few latitudes, staggered longitudes (fewer near the
// top), each jittered (JITTER) and those behind the glass held back to its cap, the lowest ring
// set level for a flat underside; the shell is their convex hull.
const shell = (() => {
  const rnd = seeded(JITTER.seed);
  const jit = (v) => (rnd() - 0.5) * 2 * v;
  const pts = [add(H.c, [0, -H.top, 0])];
  const last = [];
  H.rings.forEach((deg, k) => {
    const lowest = k === H.rings.length - 1;
    const count = Math.max(3, Math.round(H.seg * Math.sin(deg * D2R) + 0.4));
    const phis = k % 2 ? [0, ...Array.from({ length: count }, (_, j) => ((j + 0.5) * Math.PI) / count), Math.PI] : Array.from({ length: count + 1 }, (_, j) => (j * Math.PI) / count);
    const ring = [];
    for (const phi of phis) {
      const middle = phi === 0 || phi === Math.PI;
      // every draw is made whether or not it is used, so a change to one ring leaves the rest alone
      const dt = jit(JITTER.theta), dp = jit(JITTER.phi * (Math.PI / count)), skip = rnd() < JITTER.skip;
      if (!middle && skip && deg < 100) continue;
      const theta = (lowest ? deg : deg + dt) * D2R;
      const p = helmetAt(theta, middle ? phi : phi + dp);
      if (underGlass(p)) p[2] = Math.min(p[2], glassCap(p[0], p[1]) - CAP.shell);
      ring.push(p);
    }
    if (lowest) last.push(...ring); else pts.push(...ring);
  });
  // behind the glass, where the cap flattens the front, a denser grid of points, so the facets
  // there (never seen: the glass covers them) follow the cap closely and keep clear of the face
  for (let x = 0; x <= 360; x += GRID.x) for (let y = -160; y <= 400; y += GRID.y) {
    const p = helmetFront(x, y);
    if (!underGlass(p)) continue;
    p[2] = Math.min(p[2], glassCap(x, y) - CAP.shell);
    pts.push(p);
  }
  const floor = Math.max(...last.map((p) => p[1]));
  pts.push(...last.map(([x, , z]) => [x, floor, z]));
  return hullPart('helmet', 'fabric', pts, { centre: true, rigid: 'head' });
})();
const HELMET_FLOOR = Math.max(...shell.v.map((p) => p[1]));
/** A point on the smooth surface where the line from the helmet's middle through p leaves it, and `h` out along its normal there. */
function onShell(p, h = 0) {
  const s = helmetAlong(H.c, unit(sub(p, H.c)));
  return add(s, mul(helmetNormal(s), h));
}
// The glass sits in the rim, not on it: recessed this far under the smooth surface at its edge,
// and a little more toward its middle, so the rim stands well proud of it and frames it from
// every side, as the reference's does; in the middle of the face it is held back to the cap, so
// side on it stays behind the rim. The face stays well behind it (checked below).
const GLASS = { edge: 14, middle: 6 };
/** The point `h` under the smooth surface in front of (x, y), along its normal. */
const underSurface = ([x, y], h) => { const p = helmetFront(x, y); return add(p, mul(helmetNormal(p), -h)); };
const lens = part('visor', 'glass', { centre: true, rigid: 'head' });
/**
 * The visor's opening: where the glass would lie if it followed the helmet's surface, uncapped
 * (its z at each of the glass's points; x and y are the glass's own). It is never drawn: it says
 * which of the rim is seen across the opening, from the far side (drawn under the head) and which
 * stands in front of it (drawn over), as the glass itself said before it was held back.
 */
const OPENING = new Map();
const openingKey = (p) => `${Math.abs(p[0])},${p[1]}`;
{
  const P = lens;
  /** A point of the glass: under the surface, held back to the cap; its uncapped z kept for the opening. */
  const put = (q, h) => {
    const p = underSurface(q, h), z = p[2];
    p[2] = Math.min(z, glassCap(p[0], p[1]));
    const i = P.vert(p);
    OPENING.set(openingKey(P.v[i]), z);
    return i;
  };
  // the outline, a ring inside it and the middle: facets like the shell's; a shallow cone behind
  const O = VISOR.map((p) => put(p, GLASS.edge));
  const I = VISOR.map(([x, y]) => put([x * 0.56, 112 + (y - 112) * 0.6], GLASS.middle));
  const c = put([0, 108], GLASS.middle);
  for (let i = 0; i + 1 < O.length; i++) P.quad(O[i], O[i + 1], I[i + 1], I[i]);
  for (let i = 0; i + 1 < I.length; i++) P.tri(c, I[i], I[i + 1]);
  P.back = P.vert(add(helmetFront(0, 108), [0, 0, -140]));
  for (let i = 0; i + 1 < O.length; i++) P.tri(P.back, O[i + 1], O[i]);
}

// The rim: a thick, rounded tube round the visor, sitting on the shell. Its section runs from a
// foot inside the glass's edge up a tall inner wall (what frames the glass when the helmet turns),
// over a rounded crown and down a long outer slope to a foot sunk well under the shell's facets
// (so no gap ever opens between the two); each point is wrapped onto the curved surface, so the
// band hugs the helmet all the way round instead of lifting off at the sides. It stands tallest
// at the visor's sides, which frame the glass as the head turns, and lower across the top and
// the bottom, which are seen side on from the side, where a tall crown would stick out like a hook;
// and a touch taller again (LOW) down its lower sides, which side on are what stands in front of
// the glass's lower half.
const RIM = { W: 94, UP: 78, UP_MID: 36, IN: 8, SINK: 1, LOW: 1.08, LOW_Y0: 120, LOW_Y1: 224 };
// [across, up]: across as a fraction of W from the foot inside the glass; up as a fraction of the
// rim's height there (units, if not within -1..1), or 'foot': on the shell's facets, SINK under them
const RIM_SECTION = [[0, -GLASS.edge - 8], [0, 0.55], [0.16, 0.9], [0.42, 1], [0.7, 0.82], [0.93, 0.34], [1, 'foot']];
/** How far a point is inside the faceted shell (negative: outside it). */
const shellInside = (() => {
  const planes = shell.f.map(([a, b, c]) => {
    let n = unit(cross(sub(shell.v[b], shell.v[a]), sub(shell.v[c], shell.v[a]))), d = dot(n, shell.v[a]);
    if (dot(n, H.c) > d) { n = mul(n, -1); d = -d; }
    return { n, d };
  });
  return (p) => Math.min(...planes.map(({ n, d }) => d - dot(n, p)));
})();
/** A point on the smooth surface taken in along its normal until it is `sink` inside the shell's facets. */
function ontoFacets(p, sink) {
  const n = helmetNormal(p);
  let lo = 0, hi = 80;
  for (let k = 0; k < 40; k++) { const t = (lo + hi) / 2; if (shellInside(add(p, mul(n, -t))) >= sink) hi = t; else lo = t; }
  return add(p, mul(n, -hi));
}
const smoothstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The rim's height at a point of the visor's outline: UP at the sides, UP_MID in the middle of the top and bottom. */
const rimUp = (i) => lerp(RIM.UP_MID, RIM.UP, smoothstep(0.2, 0.8, VISOR[i][0] / Math.max(...VISOR.map((p) => p[0])))) * lerp(1, RIM.LOW, smoothstep(RIM.LOW_Y0, RIM.LOW_Y1, VISOR[i][1]));
/** At each point of the visor's outline: where it lies on the smooth surface, the surface's normal there, and the way out from the glass along the surface. */
const VISOR_FRAME = VISOR.map(([x, y], i) => {
  const s = helmetFront(x, y), nrm = helmetNormal(s);
  const prev = VISOR[Math.max(0, i - 1)], next = VISOR[Math.min(VISOR.length - 1, i + 1)];
  // the outline runs clockwise on screen: rightward across the top, leftward along the bottom
  let tan = i === 0 ? [1, 0, 0] : i === VISOR.length - 1 ? [-1, 0, 0] : [next[0] - prev[0], next[1] - prev[1], 0];
  tan = unit(sub(tan, mul(nrm, dot(tan, nrm))));
  return { s, nrm, out: unit(cross(tan, nrm)) };   // out: away from the glass
});
const rim = part('rim', 'fabric', { centre: true, rigid: 'head', decal: 1 });
{
  const P = rim;
  // across in units (a fraction of the width, from the foot inside the glass), up as a fraction of UP (or units, if not in 0..1)
  const rings = VISOR_FRAME.map(({ s, out }, i) => RIM_SECTION.map(([u, h]) => {
    const at = add(s, mul(out, u * RIM.W - RIM.IN));
    return h === 'foot' ? ontoFacets(onShell(at), RIM.SINK) : onShell(at, Math.abs(h) <= 1 ? h * rimUp(i) : h);
  }));
  for (const r of [rings[0], rings[rings.length - 1]]) for (const p of r) p[0] = 0;   // square on to the middle
  const ids = rings.map((r) => r.map((p) => P.vert(p)));
  const k6 = ids[0].length;
  for (let k = 0; k + 1 < ids.length; k++) for (let j = 0; j < k6; j++) P.quad(ids[k][j], ids[k][(j + 1) % k6], ids[k + 1][(j + 1) % k6], ids[k + 1][j]);
}
/**
 * The visor's window on the shell: the glass and the rim's footprint, out to a little past the
 * rim's outer foot, as seen from the helmet's middle: each point of its outline as (x, y) / z
 * from there (a point on the shell is in the window when its own lies inside the loop). A line to
 * the eye that crosses the shell only inside it passes through glass or under the rim, never
 * through the opaque shell: the painter's occlusion test. Seen from the middle, not flattened
 * onto the front view, so the sides of the helmet (which the front view squashes up against the
 * visor's edge) are never taken for the window.
 */
const WINDOW_MARGIN = 14;
const WINDOW = (() => {
  const half = VISOR_FRAME.map(({ s, out }, i) => {
    const q = toWindow(onShell(add(s, mul(out, RIM.W - RIM.IN + WINDOW_MARGIN))));
    return i === 0 || i === VISOR.length - 1 ? [0, q[1]] : q;
  });
  return [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
})();

// Comm discs on the helmet's sides, level with the eyes, a little behind the rim.
const DISC = { y: 112, z: 26, r: 102, up: 40, bevel: 16, sides: 10 };
{
  const s = helmetAlong([0, DISC.y, DISC.z], [1, 0, 0]), ax = helmetNormal(s);
  const u = unit(cross(ax, [0, 1, 0])), w = cross(u, ax);
  // its foot sunk until the whole of it is inside the shell's facets, however they fall there
  let foot = 16;
  while (ring(add(s, mul(ax, -foot)), u, w, DISC.r, DISC.r, DISC.sides).some((p) => shellInside(p) < 2)) foot += 2;
  const pts = [...ring(add(s, mul(ax, -foot)), u, w, DISC.r, DISC.r, DISC.sides), ...ring(add(s, mul(ax, DISC.up - DISC.bevel)), u, w, DISC.r, DISC.r, DISC.sides), ...ring(add(s, mul(ax, DISC.up)), u, w, DISC.r - DISC.bevel, DISC.r - DISC.bevel, DISC.sides)];
  hullPart('disc.R', 'grey', pts, { rigid: 'head', decal: 2 });
}

// ------------------------------------------------------------------ 2. the body
// The body hangs from the neck ring; at rest it stands under the helmet. Its parts are convex and
// meet flat on to each other. Heights (y): the neck ring from inside the helmet down to the
// torso's top, 560; the torso to 950; the legs to the boots' tops, 1146; the soles' undersides
// 1380 (all BODY_DY higher once it is seated). A chibi: the helmet is half the figure.
const NECK = [0, 500, 0];

// The body's transform, as the painter's: the neck carried by the head's roll, the body turned
// about it by 35% of the head's yaw and 50% of its roll (never its pitch). The frame holds the
// suited figure in every pose of the sweep at any turn of the whole figure (the sheet's views).
const BODY = { yaw: 0.35, roll: 0.5 };
function bodyProjector({ yaw, roll }, turn = 0) {
  const anchor = headProjector({ yaw: 0, pitch: 0, roll })(NECK);   // z 0: no perspective in it
  const by = (BODY.yaw * yaw + turn) * D2R, br = BODY.roll * roll * D2R;
  const cy = Math.cos(by), sy = Math.sin(by), cr = Math.cos(br), sr = Math.sin(br);
  return (p) => {
    const x = p[0] - NECK[0], y = p[1] - NECK[1], z = p[2] - NECK[2];
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const s = PERSPECTIVE / (PERSPECTIVE - z1);
    return [(anchor[0] + x1 * cr - y * sr) * s, (anchor[1] + x1 * sr + y * cr) * s, z1];
  };
}

// The neck ring: a slim grey collar from well inside the helmet (so a nod never shows a gap) down to
// the torso; seated, only a modest band of it shows under the helmet, as the reference's does.
const COLLAR = { x: 176, z: 146 };
hullPart('neck ring', 'grey', [430, 560].flatMap((y) => ring([0, y, 0], X, Z, COLLAR.x, COLLAR.z, 10, 0).filter((p) => p[0] >= -1e-9)), { centre: true });

// The torso: rounded-box sections, in three parts, the chest, a grey belt and the hips, flat on to
// each other. Flat where things meet it: the chest (x within 130, y 640 to 790, z 225) for the
// chest panel; each side (x 290, y 590 to 716) for a shoulder; the back (x within 150, from the
// top to y 790, z -200) for the backpack, which stands up to the shoulders; the underside (y 950)
// for the legs; the top (y 560) for the neck ring and the pack's lid. A barrel, as the
// reference's: widest across the chest and shoulders, drawn in to the waist at the belt, a little
// fuller again at the hips.
//   [y, front flat half-width, front z, side x, side's front z, side's back z, back flat half-width, back z]
const TORSO = [
  [560, 110, 182, 256, 112, -110, 150, -200],
  [590, 132, 208, 290, 120, -116, 186, -200],
  [640, 132, 225, 290, 124, -118, 196, -200],
  [716, 132, 225, 290, 124, -118, 196, -200],
  [790, 130, 225, 272, 121, -117, 196, -200],
  [840, 122, 212, 250, 115, -112, 188, -196],
  [905, 118, 198, 254, 111, -109, 178, -189],
  [950, 150, 156, 242, 114, -114, 170, -156],
];
const sectionAt = (y) => {
  const k = TORSO.findIndex((r) => r[0] >= y), a = TORSO[Math.max(0, k - 1)], b = TORSO[k], t = b[0] === a[0] ? 0 : (y - a[0]) / (b[0] - a[0]);
  return a.map((v, i) => lerp(v, b[i], t));
};
/** A section's corners: the flats' ends, and the cut corners between them bowed out a little, so the barrel is round rather than boxy. */
const cornersOf = ([y, fx, zf, a, zsf, zsb, bx, zb]) => {
  const bow = (x0, z0, x1, z1, k) => { const dx = x1 - x0, dz = z1 - z0; return [(x0 + x1) / 2 - dz * k, y, (z0 + z1) / 2 + dx * k]; };
  return [[fx, y, zf], bow(fx, zf, a, zsf, 0.13), [a, y, zsf], [a, y, zsb], bow(a, zsb, bx, zb, 0.11), [bx, y, zb]];
};
const BELT = { top: 812, bottom: 852, out: 10 };
hullPart('torso', 'fabric', [...TORSO.filter((r) => r[0] < BELT.top), sectionAt(BELT.top)].flatMap(cornersOf), { centre: true });
{
  // the belt stands a little proud of both, but flush at the back, where the backpack sits
  const a = sectionAt(BELT.top), b = sectionAt(BELT.bottom), o = BELT.out;
  const sec = (y) => [y, Math.max(a[1], b[1]), Math.max(a[2], b[2]) + o, Math.max(a[3], b[3]) + o, Math.max(a[4], b[4]) + o, Math.min(a[5], b[5]) - o, Math.max(a[6], b[6]), Math.min(a[7], b[7])];
  hullPart('belt', 'grey', [sec(BELT.top), sec(BELT.bottom)].flatMap(cornersOf), { centre: true });
}
hullPart('hips', 'fabric', [sectionAt(BELT.bottom), ...TORSO.filter((r) => r[0] > BELT.bottom)].flatMap(cornersOf), { centre: true });
const TORSO_SIDE = 290, TORSO_FRONT = 225, TORSO_BACK = -200, TORSO_FLOOR = 950;

// The chest panel: a bevelled grey slab flat on the chest, deep enough for the hoses to leave its
// sides, with a few buttons and two lights.
const PANEL = { x: 126, y0: 648, y1: 784, z0: TORSO_FRONT, z1: TORSO_FRONT + 58, bevel: 12 };
{
  const { x, y0, y1, z0, z1, bevel } = PANEL;
  const rect = (i, z) => [[0, y0 + i, z], [x - i, y0 + i, z], [x - i, y1 - i, z], [0, y1 - i, z]];
  hullPart('chest panel', 'grey', [...rect(0, z0), ...rect(0, z1 - bevel), ...rect(bevel, z1)], { centre: true });
}
/** A small block on the panel's face, `up` proud: a box, or a six-sided button. */
function button(name, material, cx, cy, hw, hh, up, round = false) {
  const z = PANEL.z1;
  const shape = (zz) => (round ? ring([cx, cy, zz], X, Y, hw, hh, 6, 0) : [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]].map(([x, y]) => [x, y, zz]));
  return hullPart(name, material, [...shape(z), ...shape(z + up)]);
}
button('slot.R', 'dark', 62, 684, 38, 11, 8);
button('button.R', 'dark', 44, 740, 15, 15, 10, true);
button('light.R', 'accent', 100, 740, 9, 9, 7);

// The backpack: the life-support pack, a tall box of its own standing between the shoulder blades,
// flat on the back from the shoulders' height (the torso's top: nothing of it stands higher, where
// a turn of the body would show it past the collar) to below the belt, narrower than the torso
// and deep, in a grey of its own so it reads as a separate thing from behind. Its back is bevelled
// deep all round, with a raised panel in the middle whose facets slope down to the bevel like a
// low pyramid (the reference's), and a lid across its top (a grey band, a little proud), so from
// behind it shows its depth and catches the light at its top edge.
const PACK = { side: 150, top: 560, lid: 32, bottom: 890, back: -440 };
{
  const hw = PACK.side, y0 = PACK.top + PACK.lid, y1 = PACK.bottom, z0 = TORSO_BACK, z1 = PACK.back, b = 44, b2 = 22;
  const face = (z, i) => [[0, y0 + i, z], [hw - i, y0 + i, z], [hw, y0 + i + b2, z], [hw, y1 - i - b2, z], [hw - i, y1 - i, z], [0, y1 - i, z]].map(([x, y, zz]) => [Math.min(x, hw - (i ? b2 : 0)), y, zz]);
  const panel = (ix, iy, z) => [[0, y0 + iy, z], [hw - ix, y0 + iy, z], [hw - ix, y1 - iy, z], [0, y1 - iy, z]];
  hullPart('backpack', 'pack', [...face(z0, 0), ...face(z1 + b, 0), ...face(z1, b), ...panel(104, 118, z1 - 34)], { centre: true });
  // the lid: flat on the pack's top and the torso's back, a little proud of the pack's back and sides
  const o = 8, lid = (y) => [[0, y, z0], [hw + o - 10, y, z0], [hw + o, y, z0 - 12], [hw + o, y, z1 + b - o], [hw + o - 22, y, z1 - o], [0, y, z1 - o]];
  hullPart('pack lid', 'grey', [...lid(PACK.top), ...lid(y0)], { centre: true });
}

// The arms: a shoulder flat on the torso's side, then along one axis, hanging a little outward:
// the upper arm, a joint ring at the elbow, the forearm, a ring at the cuff, and the mitten.
const ARM_AXIS = unit([0.19, 1, 0]);
const ARM_OUT = unit(cross(ARM_AXIS, Z));   // across the arm, outward (x) in the front view
const ARM_TOP = [376, 700, 0];               // the shoulder's underside, where the upper arm begins
const along = (t) => add(ARM_TOP, mul(ARM_AXIS, t));
const armRing = (t, ru, rw, sides = 8) => ring(along(t), ARM_OUT, Z, ru, rw, sides);
{
  // The shoulder: a rounded cap on the torso's side, its underside square to the arm.
  const clampIn = (p) => (p[0] < TORSO_SIDE ? [TORSO_SIDE, p[1], p[2]] : p);
  const pts = [...armRing(0, 84, 92), ...armRing(-62, 88, 98).map(clampIn), ...armRing(-124, 52, 66).map(clampIn)];
  hullPart('shoulder.R', 'fabric', pts);
}
const ARM = { upper: 104, elbow: 34, fore: 72, cuff: 38 };
hullPart('upper arm.R', 'fabric', [...armRing(0, 82, 90), ...armRing(ARM.upper * 0.5, 86, 94), ...armRing(ARM.upper, 80, 88)]);
/** A grey joint ring from t for h along the arm: a band wider than the arm. */
function jointRing(name, t, h, r, rz) {
  hullPart(name, 'grey', [...armRing(t, r, rz), ...armRing(t + h, r, rz)]);
}
let t = ARM.upper;
jointRing('elbow ring.R', t, ARM.elbow, 96, 104);
t += ARM.elbow;
hullPart('forearm.R', 'fabric', [...armRing(t, 80, 88), ...armRing(t + ARM.fore, 76, 84)]);
t += ARM.fore;
jointRing('cuff.R', t, ARM.cuff, 92, 102);
t += ARM.cuff;
// The mitten: a rounded box, broad at the knuckles, its palm flat on the inside and a flat at the
// front inner corner for the thumb.
const GLOVE = { t, hx: 92, hz: 122, c: 46 };
{
  const sec = (dt, hx, hz, c) => octagon(along(GLOVE.t + dt), ARM_OUT, Z, hx, hz, c);
  const pts = [...octagon(along(GLOVE.t), ARM_OUT, Z, 80, 90, 30), ...sec(40, GLOVE.hx, GLOVE.hz, GLOVE.c), ...sec(136, GLOVE.hx, GLOVE.hz, GLOVE.c), ...sec(198, 48, 74, 26)];
  hullPart('glove.R', 'grey', pts);
}
{
  // the palm: a dark pad flat on the glove's inside
  const c0 = sub(along(GLOVE.t + 84), mul(ARM_OUT, GLOVE.hx));
  const pad = (i, h) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => add(c0, add(mul(ARM_OUT, -h), add(mul(ARM_AXIS, a * (42 - i)), mul(Z, b * (GLOVE.hz - GLOVE.c - 8 - i))))));
  hullPart('palm.R', 'dark', [...pad(0, 0), ...pad(4, 10)]);
  // the thumb: on the flat at the glove's front inner corner, pointing forward, in and down
  const A = sub(along(GLOVE.t + 60), mul(ARM_OUT, GLOVE.hx)), B = add(sub(along(GLOVE.t + 60), mul(ARM_OUT, GLOVE.hx - GLOVE.c)), mul(Z, 0));
  const a0 = add(A, mul(Z, GLOVE.hz - GLOVE.c)), b0 = add(B, mul(Z, GLOVE.hz));
  const mid = mul(add(a0, b0), 0.5), across = unit(sub(b0, a0)), n = unit(cross(ARM_AXIS, across));
  const out = dot(n, sub(mid, along(GLOVE.t + 60))) > 0 ? n : mul(n, -1);
  const dir = unit(add(out, mul(ARM_AXIS, 0.9)));
  const base = ring(mid, across, ARM_AXIS, 28, 34, 5);
  const tipC = add(mid, mul(dir, 62));
  const w2 = unit(cross(dir, across));
  hullPart('thumb.R', 'grey', [...base, ...ring(add(mid, mul(dir, 36)), across, w2, 30, 30, 5), ...ring(tipC, across, w2, 20, 20, 5)]);
}

// The legs: short, straight and a little tapered, from the torso's underside to the boots; a
// flat front for the knee pad.
const LEG = { x: 140, top: TORSO_FLOOR, bottom: 1172 };
hullPart('leg.R', 'fabric', [...octagon([LEG.x, LEG.top, 0], X, Z, 94, 104, 36), ...octagon([LEG.x, LEG.bottom, 0], X, Z, 88, 98, 34)]);
{
  // the knee pad: flat on the leg's front, which leans back a hair toward the ankle
  const n = unit([0, 6, LEG.bottom - LEG.top]), y0 = 1040, y1 = 1116, hw = 50;
  const onFront = (x, y) => [x, y, 104 - ((y - LEG.top) * 6) / (LEG.bottom - LEG.top)];
  const rect = (i, h) => [[LEG.x - hw + i, y0 + i], [LEG.x + hw - i, y0 + i], [LEG.x + hw - i, y1 - i], [LEG.x - hw + i, y1 - i]].map(([x, y]) => add(onFront(x, y), mul(n, h)));
  hullPart('knee.R', 'grey', [...rect(0, 0), ...rect(6, 15)]);
}
// The boots: a grey cuff at the ankle, then a short upper and a chunky round toe that runs well
// forward of the leg (the heel only a little behind it), on a dark sole that follows the foot.
const BOOT = { x: 146, cuff: LEG.bottom + 24, bottom: LEG.bottom + 146, sole: LEG.bottom + 188 };
{
  hullPart('ankle cuff.R', 'grey', [...octagon([BOOT.x, LEG.bottom, 0], X, Z, 96, 106, 36), ...octagon([BOOT.x, BOOT.cuff, 0], X, Z, 96, 106, 36)]);
  // [y, half width, back z, front z, corner]: the upper square under the cuff, the toe cap sloping down and forward
  const secs = [[BOOT.cuff, 104, -114, 114, 36], [BOOT.cuff + 40, 116, -128, 158, 44], [BOOT.cuff + 80, 128, -140, 262, 56], [BOOT.bottom, 130, -142, 300, 60]];
  const sec = ([y, hw, zb, zf, c]) => octagon([BOOT.x, y, (zb + zf) / 2], X, Z, hw, (zf - zb) / 2, c);
  hullPart('boot.R', 'fabric', secs.flatMap(sec));
  const s = (i, y) => octagon([BOOT.x, y, 80], X, Z, 136 - i, 228 - i, 66);
  hullPart('sole.R', 'dark', [...s(0, BOOT.bottom), ...s(8, BOOT.sole)]);
}

// Hoses: thick (about a third of the arm across, as the reference's), from a collar on each side
// of the chest panel out and down over the chest and the belt, round the hip close to the body,
// under the arm, then up the back beside the pack and over into a collar high on its side: a loop
// from the front, the side and three quarters, and from behind a ring at each top corner of the
// pack. Each is a few straight six-sided segments, joint to joint, close on the body all the way
// (and clear of the arm where it passes under it), so the outline never rings a sliver of the page
// shut between hose and body.
const HOSE = { r: 24, sides: 6, collar: 28, collarH: 18 };
{
  const C0 = [PANEL.x, 744, (PANEL.z0 + PANEL.z1) / 2];   // on the panel's side
  const C1 = [PACK.side, 636, -300];                        // on the pack's side, high
  const collar = (c) => [...ring(c, Y, Z, HOSE.collar, HOSE.collar, HOSE.sides, 0), ...ring(add(c, [HOSE.collarH, 0, 0]), Y, Z, HOSE.collar, HOSE.collar, HOSE.sides, 0)];
  hullPart('connector.R', 'dark', collar(C0));
  hullPart('pack connector.R', 'dark', collar(C1));
  // the joints, and at the ends the plane each is cut on: flat on the panel's collar, flat on the pack's
  const J = [
    [add(C0, [HOSE.collarH, 0, 0]), X],
    [[196, 768, 240], null],     // out over the chest
    [[252, 822, 226], null],     // down over the belt's corner
    [[274, 884, 150], null],     // round the hip's front corner, clear of the arm
    [[282, 918, 0], null],       // under the arm
    [[280, 896, -126], null],    // round the hip's back corner
    [[262, 800, -222], null],    // up the back, beside the pack
    [[250, 700, -290], null],
    [[236, 640, -300], null],
    [[214, 616, -302], null],    // over the top of the loop, under the lid
    [[190, 626, -301], null],
    [add(C1, [HOSE.collarH, 0, 0]), [-1, 0, 0]],
  ];
  // Mitred, as a pipe is: each segment a straight six-sided tube along its own line, cut at each
  // joint on the plane halfway between its line and the next (at the ends, flat on the collars),
  // its frame turned from one segment to the next by the least turn that takes one line to the
  // other. So each side of a segment is one flat plane, and two segments share their cut exactly.
  const n = J.length, dirs = Array.from({ length: n - 1 }, (_, k) => unit(sub(J[k + 1][0], J[k][0])));
  const cutN = J.map(([, d], k) => d || unit(add(dirs[k - 1], dirs[k])));
  /** The frame (e1, e2) turned by the least rotation that takes the line a to the line b. */
  const turnFrame = ([e1, e2], a, b) => {
    const axis = cross(a, b), s = len(axis), c = dot(a, b);
    if (s < 1e-9) return [e1, e2];
    const k = mul(axis, 1 / s), rot = (v) => add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
    return [rot(e1), rot(e2)];
  };
  let frame = (() => { const e1 = unit(sub(Z, mul(dirs[0], dot(Z, dirs[0])))); return [e1, cross(dirs[0], e1)]; })();
  /** The cut at joint j of the tube along line d with frame f: its circle round the joint, slid along d onto the joint's plane. */
  const cut = (j, d, [e1, e2]) => Array.from({ length: HOSE.sides }, (_, i) => {
    const a = (2 * Math.PI * (i + 0.5)) / HOSE.sides, q = add(J[j][0], add(mul(e1, Math.cos(a) * HOSE.r), mul(e2, Math.sin(a) * HOSE.r)));
    return add(q, mul(d, -dot(sub(q, J[j][0]), cutN[j]) / dot(d, cutN[j])));
  });
  let start = cut(0, dirs[0], frame);
  for (let k = 0; k + 1 < n; k++) {
    const end = cut(k + 1, dirs[k], frame);
    hullPart(`hose ${k + 1}.R`, 'dark', [...start, ...end]);
    if (k + 2 < n) frame = turnFrame(frame, dirs[k], dirs[k + 1]);
    start = end;
  }
}

// ------------------------------------------------------------------ 3. mirror and orient
const isBody = (P) => P.rigid === 'body';
const signedVolume = (v, f) => f.reduce((s, [a, b, c]) => s + dot(v[a], cross(v[b], v[c])) / 6, 0);
const HEAD_SIGN = Math.sign(signedVolume(HEAD.v, HEAD.f));
// The body sits higher than it was drawn, so the helmet rests close on the shoulders over a modest
// band of the collar.
const BODY_DY = -36;
for (const P of parts) if (isBody(P)) for (const p of P.v) p[1] += BODY_DY;
const all = [];
for (const P of parts) {
  if (P.centre) {
    if (!P.whole) {
      // mirrored onto itself: vertices off the plane get a twin, faces a reversed mirror image
      const twin = P.v.map((p, i) => (p[0] === 0 ? i : (P.v.push([-p[0], p[1], p[2]]), P.v.length - 1)));
      const n = P.f.length;
      for (let k = 0; k < n; k++) { const [a, b, c] = P.f[k]; P.f.push([twin[a], twin[c], twin[b]]); }
    }
    if (Math.sign(signedVolume(P.v, P.f)) !== HEAD_SIGN) P.f = P.f.map(([a, b, c]) => [a, c, b]);
    all.push(P);
  } else {
    if (Math.sign(signedVolume(P.v, P.f)) !== HEAD_SIGN) P.f = P.f.map(([a, b, c]) => [a, c, b]);
    const L = { ...P, name: P.name.replace(/\.R$/, '.L'), v: P.v.map(mirror), f: P.f.map(([a, b, c]) => [a, c, b]), hide: new Set() };
    all.push(P, L);
  }
}
const byName = new Map(all.map((P, i) => [P.name, i]));

// ------------------------------------------------------------------ 4. checks
const report = [];
const triArea = (v, [a, b, c]) => len(cross(sub(v[b], v[a]), sub(v[c], v[a]))) / 2;
const triMinAngle = (v, [a, b, c]) => {
  const ang = (p, q, r) => Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(q, p)), unit(sub(r, p)))))) / D2R;
  return Math.min(ang(v[a], v[b], v[c]), ang(v[b], v[c], v[a]), ang(v[c], v[a], v[b]));
};
let minArea = Infinity, minAngle = Infinity;
const rings = [];
for (const P of all) {
  // closed and consistently wound: every directed edge once, and its reverse once
  const dir = new Set();
  for (const f of P.f) for (let k = 0; k < 3; k++) {
    const e = `${f[k]}>${f[(k + 1) % 3]}`;
    if (dir.has(e)) fail(`${P.name}: edge ${e} used twice in the same direction (a fold or inconsistent winding)`);
    dir.add(e);
  }
  for (const e of dir) { const [a, b] = e.split('>'); if (!dir.has(`${b}>${a}`)) fail(`${P.name}: open edge ${a}-${b} (${P.v[a].map(Math.round)}) to (${P.v[b].map(Math.round)})`); }
  const used = new Set(P.f.flat());
  if (used.size !== P.v.length) fail(`${P.name}: ${P.v.length - used.size} unused vertices`);
  const adj = new Map();
  for (const e of dir) { const [a, b] = e.split('>').map(Number); (adj.get(a) || adj.set(a, []).get(a)).push(b); }
  const seen = new Set([P.f[0][0]]), stack = [P.f[0][0]];
  while (stack.length) for (const q of adj.get(stack.pop()) || []) if (!seen.has(q)) { seen.add(q); stack.push(q); }
  if (seen.size !== used.size) fail(`${P.name}: more than one piece`);
  if (Math.sign(signedVolume(P.v, P.f)) !== HEAD_SIGN) fail(`${P.name}: wound inside out`);
  const chi = used.size - dir.size / 2 + P.f.length;
  if (chi !== 2) rings.push(`${P.name} (Euler characteristic ${chi})`);
  for (const f of P.f) { const a = triArea(P.v, f), g = triMinAngle(P.v, f); minArea = Math.min(minArea, a); minAngle = Math.min(minAngle, g); if (a < 1) fail(`${P.name}: degenerate triangle ${f} (area ${a.toFixed(3)}) at ${f.map((i) => P.v[i].map(Math.round).join("/")).join(" ")}`); }
}
report.push(`closed: all ${all.length} parts closed, consistently wound (outward, as the head) and in one piece${rings.length ? '; a ring: ' + rings.join(', ') : ''}; no degenerate faces (smallest ${minArea.toFixed(0)} sq units, smallest angle ${minAngle.toFixed(1)} deg)`);

// the body's parts, and the helmet's shell, are convex: every vertex on or inside every face's plane
const planesOf = (P) => P.f.map(([a, b, c]) => { const n = mul(unit(cross(sub(P.v[b], P.v[a]), sub(P.v[c], P.v[a]))), HEAD_SIGN); return { n, d: dot(n, P.v[a]) }; });
{
  let worst = 0, count = 0;
  for (const P of all) {
    if (!isBody(P) && P.name !== 'helmet' && !P.name.startsWith('disc')) continue;
    count++;
    P.planes = planesOf(P);
    for (const pl of P.planes) for (const p of P.v) { const o = dot(pl.n, p) - pl.d; if (o > 1e-6) { worst = Math.max(worst, o); if (o > 1e-3) fail(`${P.name}: not convex (a vertex ${o.toFixed(3)} outside a face)`); } }
  }
  report.push(`convex: the shell, the discs and all ${count - 3} of the body's parts (no vertex outside any face's plane by more than ${worst.toExponential(1)})`);
}

// one mesh
const V = [], F = [], VP = [], FP = [], VM = [], partBase = [];
all.forEach((P, pi) => {
  const base = V.length;
  partBase.push(base);
  P.v.forEach((p) => { V.push(p.slice()); VP.push(pi); VM.push(MATERIALS.indexOf(P.material)); });
  P.f.forEach(([a, b, c]) => { F.push([a + base, b + base, c + base]); FP.push(pi); });
});
// baked to a tenth, rounded the same way either side of the middle so the mirror stays exact
const r1 = (n) => (Math.sign(n) * Math.round(Math.abs(n) * 10)) / 10 + 0;
for (const p of V) for (let k = 0; k < 3; k++) p[k] = r1(p[k]);
const faceCentre = (fi) => centroid(F[fi].map((i) => V[i]));

// symmetry: every vertex has its mirror partner, every face its mirror face (same part or its twin)
{
  const key = (p) => p.map((c) => Math.sign(c) * Math.round(Math.abs(c) * 1e6) + 0).join(',');
  const at = new Map(V.map((p, i) => [key(p) + '|' + VP[i], i]));
  const twinPart = all.map((P) => byName.get(P.centre ? P.name : P.name.endsWith('.R') ? P.name.replace(/\.R$/, '.L') : P.name.replace(/\.L$/, '.R')));
  let worst = 0;
  const mirrorOf = V.map((p, i) => {
    const j = at.get(key([-p[0], p[1], p[2]]) + '|' + twinPart[VP[i]]);
    if (j === undefined) fail(`symmetry: vertex ${i} (${p.map((c) => c.toFixed(2))}) of ${all[VP[i]].name} has no mirror partner`);
    const d = Math.hypot(V[j][0] + p[0], V[j][1] - p[1], V[j][2] - p[2]);
    worst = Math.max(worst, d);
    if (d > 1e-9) fail(`symmetry: vertex ${i} is ${d} from its partner`);
    if (VM[j] !== VM[i]) fail(`symmetry: vertex ${i} and its partner differ in material`);
    return j;
  });
  const canon = (q) => { const m = Math.min(...q), k = q.indexOf(m); return [q[k], q[(k + 1) % 3], q[(k + 2) % 3]].join(','); };
  const faces = new Set(F.map(canon));
  for (const [a, b, c] of F) if (!faces.has(canon([mirrorOf[a], mirrorOf[c], mirrorOf[b]]))) fail(`symmetry: face ${a},${b},${c} has no mirror face`);
  report.push(`symmetric: all ${V.length} vertices have a partner at (-x, y, z) (largest gap ${worst}, within 1e-9; ${V.filter((p) => p[0] === 0).length} lie on the centre plane and are their own), all ${F.length} faces a mirrored face, materials alike`);
}

// planes: neighbouring triangles of a part within half a degree of each other are one plane
const G = new Array(F.length);
const faceNormal = (fi) => { const [a, b, c] = F[fi].map((i) => V[i]); return mul(unit(cross(sub(b, a), sub(c, a))), HEAD_SIGN); };
{
  const nrm = F.map((_, fi) => faceNormal(fi));
  const byEdge = new Map();
  F.forEach((f, fi) => { for (let k = 0; k < 3; k++) { const a = f[k], b = f[(k + 1) % 3], key = a < b ? `${a}|${b}` : `${b}|${a}`; (byEdge.get(key) || byEdge.set(key, []).get(key)).push(fi); } });
  const parent = F.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const fs of byEdge.values()) if (fs.length === 2 && FP[fs[0]] === FP[fs[1]] && dot(nrm[fs[0]], nrm[fs[1]]) > Math.cos(0.5 * D2R)) parent[find(fs[0])] = find(fs[1]);
  const ids = new Map();
  F.forEach((_, i) => { const r = find(i); if (!ids.has(r)) ids.set(r, ids.size); G[i] = ids.get(r); });
  report.push(`planes: ${ids.size} flat planes from ${F.length} triangles`);
}

// counts per part
{
  const groups = [['helmet', ['helmet', 'visor', 'rim', 'disc']], ['torso', ['neck ring', 'torso', 'belt', 'hips', 'chest panel', 'slot', 'button', 'light', 'backpack', 'pack lid']], ['hoses', ['connector', 'hose', 'pack connector']], ['arms', ['shoulder', 'upper arm', 'elbow ring', 'forearm', 'cuff', 'glove', 'palm', 'thumb']], ['legs', ['leg', 'knee', 'ankle cuff', 'boot', 'sole']]];
  const count = (P) => P.f.length;
  const line = groups.map(([g, names]) => {
    const ps = all.filter((P) => names.some((n) => P.name.replace(/ \d+/, '').replace(/\.[RL]$/, '') === n) && !P.name.endsWith('.L'));
    const each = ps.map((P) => `${P.name.replace(/\.R$/, '')} ${count(P)}${P.centre ? '' : ' x2'}`);
    return `${g} ${ps.reduce((s, P) => s + count(P) * (P.centre ? 1 : 2), 0)} (${each.join(', ')})`;
  });
  report.push(`triangles: ${F.length} in all: ${line.join('; ')}`);
}

// ------------------------------------------------------------------ 5. what is never seen
// A face inside another convex part carried by the same thing, or flat against one of its faces
// (a leg's top on the torso's underside, a disc's foot inside the shell), is never drawn; nor is
// the glass's back.
const hidden = new Array(F.length).fill(0);
{
  let count = 0, behindGlass = 0;
  F.forEach((f, fi) => {
    const P = all[FP[fi]];
    if (P.back !== undefined && f.some((i) => i - partBase[FP[fi]] === P.back)) { hidden[fi] = 1; count++; return; }
    if (P.name === 'visor') return;   // the glass is recessed into the shell, and always drawn where it faces the eye
    // the rim's underside, its feet sunk under the smooth surface: in the helmet's wall
    if (P.name === 'rim' && f.every((i) => outside(V[i]) < 1 - 1e-6)) { hidden[fi] = 1; count++; return; }
    // the shell behind the glass (the visor's hole in it), which the glass always covers; the
    // painter still takes its planes for the shell's, which is convex
    if (P.name === 'helmet' && f.every((i) => underGlass(V[i]))) { hidden[fi] = 1; count++; behindGlass++; return; }
    const pts = [...f.map((i) => V[i]), faceCentre(fi)];
    for (let qi = 0; qi < all.length; qi++) {
      const Q = all[qi];
      if (qi === FP[fi] || Q.rigid !== P.rigid || !Q.planes) continue;
      if (pts.every((p) => Q.planes.every((pl) => dot(pl.n, p) - pl.d < 0.5))) { hidden[fi] = 1; count++; return; }
    }
  });
  report.push(`never seen: ${count} faces lie inside another part or flat against it, or behind the glass (${behindGlass} of the shell's)`);
}

// how many of them the painter draws in the front view at rest: facing the eye, and ever seen
{
  const hp = headProjector({ yaw: 0, pitch: 0, roll: 0 }), bp = bodyProjector({ yaw: 0, roll: 0 });
  const q = V.map((p, i) => (all[VP[i]].rigid === 'head' ? hp(p) : bp(p)));
  const facing = F.filter((f, fi) => { if (hidden[fi]) return false; let a = 0; for (let k = 0; k < 3; k++) { const p = q[f[k]], r = q[f[(k + 1) % 3]]; a += p[0] * r[1] - r[0] * p[1]; } return a > 0; });
  const planesSeen = new Set(F.map((_, fi) => fi).filter((fi) => facing.includes(F[fi])).map((fi) => G[fi]));
  report.push(`drawn: in the front view at rest ${facing.length} of them (${planesSeen.size} flat planes) face the eye`);
}

// ------------------------------------------------------------------ 6. the planes between the body's parts
// Two convex parts that do not overlap have a plane between them (a face of one, or the plane
// through an edge of each): the painter draws the one on the far side of it from the eye first.
// Only pairs that can overlap on screen are kept: any turn of the figure, its roll, its sway.
const sep = [];
{
  const body = all.map((P, i) => ({ P, i })).filter(({ P }) => isBody(P));
  const edgesOf = (P) => { const s = new Map(); for (const f of P.f) for (let k = 0; k < 3; k++) { const a = f[k], b = f[(k + 1) % 3]; const d = unit(sub(P.v[b], P.v[a])); s.set(a < b ? `${a}|${b}` : `${b}|${a}`, d); } return [...s.values()]; };
  const info = body.map(({ P, i }) => ({ P, i, pts: P.v, normals: P.planes.map((pl) => pl.n), edges: edgesOf(P) }));
  // screen boxes over the views the body can be seen from
  const views = [];
  for (let turn = 0; turn < 360; turn += 10) for (const roll of [-12, 0, 12]) views.push({ turn, roll });
  const boxes = info.map(({ pts }) => views.map(({ turn, roll }) => {
    const pr = bodyProjector({ yaw: 0, roll: roll * 2 }, turn);
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of pts) { const q = pr(p); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }
    return b;
  }));
  const PAD = 12;
  const overlaps = (a, b) => views.some((_, k) => boxes[a][k][0] - PAD < boxes[b][k][2] && boxes[b][k][0] - PAD < boxes[a][k][2] && boxes[a][k][1] - PAD < boxes[b][k][3] && boxes[b][k][1] - PAD < boxes[a][k][3]);
  let worst = { gap: Infinity }, touching = 0, pairs = 0;
  const tight = [];
  // a pair's mirror twin takes the mirror of its plane, so the painter orders the two sides alike
  const twinOf = all.map((P) => byName.get(P.centre ? P.name : P.name.endsWith('.R') ? P.name.replace(/\.R$/, '.L') : P.name.replace(/\.L$/, '.R')));
  const planeOf = new Map();
  for (let a = 0; a < info.length; a++) for (let b = a + 1; b < info.length; b++) {
    pairs++;
    if (!overlaps(a, b)) continue;
    const A = info[a], B = info[b];
    const ta = twinOf[A.i], tb = twinOf[B.i], m = planeOf.get(`${ta}|${tb}`) || (planeOf.has(`${tb}|${ta}`) && (({ n, d }) => ({ n: mul(n, -1), d: -d }))(planeOf.get(`${tb}|${ta}`)));
    // the gap along a plane between the two (n.p < d on A's side), to check it and report the closest
    const gapAlong = (n, d) => Math.min(...B.pts.map((p) => dot(n, p) - d)) + Math.min(...A.pts.map((p) => d - dot(n, p)));
    const keep = (n, d) => {
      const gap = gapAlong(n, d);
      if (gap < -0.5) fail(`${A.P.name} and ${B.P.name} overlap by ${(-gap).toFixed(1)}: no plane between them`);
      if (gap < worst.gap) worst = { gap, a: A.P.name, b: B.P.name };
      if (gap < 0.5) touching++;
      tight.push([gap, A.P.name, B.P.name]);
      planeOf.set(`${A.i}|${B.i}`, { n, d });
      sep.push([A.i, B.i, ...n, d]);
    };
    if (m) { keep([-m.n[0] + 0, m.n[1], m.n[2]], m.d); continue; }
    // a part and its own twin (a side part lies wholly right of the middle): the middle plane
    if (ta === B.i) { keep(A.P.name.endsWith('.R') ? [-1, 0, 0] : [1, 0, 0], 0); continue; }
    const cands = [...A.normals, ...B.normals];
    for (const ea of A.edges) for (const eb of B.edges) { const c = cross(ea, eb); if (len(c) > 1e-3) cands.push(unit(c)); }
    let best = null;
    for (const n of cands) {
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const p of A.pts) { const s = dot(n, p); a0 = Math.min(a0, s); a1 = Math.max(a1, s); }
      for (const p of B.pts) { const s = dot(n, p); b0 = Math.min(b0, s); b1 = Math.max(b1, s); }
      if (!best || b0 - a1 > best.gap) best = { gap: b0 - a1, n, d: (a1 + b0) / 2 };
      if (a0 - b1 > best.gap) best = { gap: a0 - b1, n: mul(n, -1), d: -(a0 + b1) / 2 };
    }
    if (best.gap < -0.5) fail(`${A.P.name} and ${B.P.name} overlap by ${(-best.gap).toFixed(1)}: no plane between them`);
    keep(best.n.map((c) => Math.round(c * 1e4) / 1e4 + 0), Math.round(best.d * 10) / 10 + 0);
  }
  if (VERBOSE) console.log('  tightest pairs:', tight.sort((p, q) => p[0] - q[0]).slice(0, 16).map(([g, a, b]) => `${a}/${b} ${g.toFixed(1)}`).join(', '));
  // and the planes mirror as the parts do
  for (const [a, b, nx, ny, nz, d] of sep) {
    const m = planeOf.get(`${twinOf[a]}|${twinOf[b]}`), w = planeOf.get(`${twinOf[b]}|${twinOf[a]}`);
    const ok = (m && m.n[0] === -nx && m.n[1] === ny && m.n[2] === nz && m.d === d) || (w && w.n[0] === nx && w.n[1] === -ny && w.n[2] === -nz && w.d === -d) || (w && twinOf[a] === b && w.n[0] === nx && w.n[1] === -ny && w.n[2] === -nz && w.d === -d);
    if (!ok) fail(`symmetry: the plane between ${all[a].name} and ${all[b].name} has no mirror`);
  }
  report.push(`apart: every two of the body's ${info.length} parts that can overlap on screen (${sep.length} of ${pairs} pairs) have a plane between them, mirrored as the parts are; ${touching} pairs meet flat on, the closest others are ${tight.filter((p) => p[0] >= 0.5).sort((p, q) => p[0] - q[0])[0][0].toFixed(1)} apart`);
}

// ------------------------------------------------------------------ 7. fit
// The shell is convex: a point is inside it by the least of its distances to the facets' planes.
const shellP = all[byName.get('helmet')];
const inside = (p) => Math.min(...shellP.planes.map((pl) => pl.d - dot(pl.n, p)));   // > 0 inside, by that much
let coreClear = Infinity, worst = null;
for (const p of CORE) { const c = inside(p); if (c < coreClear) { coreClear = c; worst = p; } }
const EYE_GROW = 1.06;   // as wide as the eyes ever open (the startle widens them 6%)
const eyeRing = (e, s = EYE_GROW, steps = 48) => Array.from({ length: steps }, (_, k) => {
  const t = (2 * Math.PI * k) / steps, x = e.c[0] + HEAD.eye.rx * s * Math.cos(t), y = e.c[1] + HEAD.eye.ry * s * Math.sin(t);
  return [x, y, e.c[2] + e.dzdx * (x - e.c[0]) + e.dzdy * (y - e.c[1])];
});
const eyeClear = Math.min(...HEAD.eyes.flatMap((e) => eyeRing(e).map(inside)));
if (coreClear < CLEAR) fail(`the helmet does not hold the head's core: (${worst.map(Math.round)}) is ${coreClear.toFixed(1)} inside its facets (want ${CLEAR})`);
if (eyeClear < CLEAR) fail(`the helmet does not hold the eyes: ${eyeClear.toFixed(1)} inside (want ${CLEAR})`);
{
  // how close: the core's farthest reach in each direction against the shell's
  const ext = (pts, k, s) => Math.max(...pts.map((p) => s * p[k]));
  const gaps = [['sides', 0, 1], ['top', 1, -1], ['chin', 1, 1], ['front', 2, 1], ['back', 2, -1]].map(([n, k, s]) => `${n} ${Math.round(ext(shellP.v, k, s) - ext(CORE, k, s))}`);
  report.push(`fit: the shell holds the head's core ${coreClear.toFixed(0)} units inside its facets at the closest (${worst.map(Math.round)}), the eyes ${eyeClear.toFixed(0)}; shell beyond the core: ${gaps.join(', ')}`);
}
// The protrusions: each tip folded flat, down to the middle of the points round it (so while the
// helmet is still building itself over the head, no stub of an ear or a spike stands out of its
// outline), and further in along the line from the helmet's middle should that not be CLEAR inside.
const tuck = [];
const around = HEAD.v.map(() => new Set());
for (const [a, b, c] of HEAD.f) { around[a].add(b).add(c); around[b].add(a).add(c); around[c].add(a).add(b); }
HEAD.v.forEach((p, i) => {
  if (inside(p) >= CLEAR) return;
  if (!isProtrusion(p)) fail(`core vertex ${i} (${p}) would need tucking`);
  const flat = centroid([...around[i]].map((j) => HEAD.v[j]));
  const r = sub(flat, H.c);
  let lo = 0, hi = 1;
  if (inside(flat) < CLEAR) for (let k = 0; k < 50; k++) { const t = (lo + hi) / 2; if (inside(add(H.c, mul(r, t))) >= CLEAR) lo = t; else hi = t; }
  else lo = 1;
  tuck.push([i, ...add(H.c, mul(r, lo)).map((c) => Math.round(c * 10) / 10)]);
});
report.push(`tucked: ${tuck.length} head vertices (the ear tips and the spikes: ${tuck.map((t) => t[0]).join(', ')}) folded flat, under the shell`);

// ------------------------------------------------------------------ 8. the eyes in the visor, the rim round it
// How the painter draws a plane of the rim, by the lines from its corners and its middle to the
// eye (a disc goes after the glass while its axis faces the eye, before the shell while it does not):
//  - behind: any of them crosses the opaque shell (anywhere outside the visor's window, which is
//    the glass and the rim's footprint as seen from the helmet's middle): drawn before the shell,
//    which covers what of it is behind (what sticks out past the shell's outline still shows);
//  - through the glass: the line from its middle crosses the visor's opening (the glass as it
//    would follow the helmet's surface, uncapped: the far side of the rim, seen across the inside
//    of the helmet): drawn in the glass, after the helmet's dark inside and before the head, so
//    the head covers it where it is nearer;
//  - in front: clear of the opening: drawn after the glass, over the head.
// So only the rim in front, and a disc facing the eye, can cover the eyes. For every pose of the sweep:
//  - each point of each eye's outline (as wide as it ever opens), and a ring of points round it,
//    must fall inside the visor's front-facing glass and outside every face that covers the eyes
//    (eyes the painter hides, turned too far, are skipped);
//  - the rim stays whole, in every pose within the head's reach (REACH, LEVEL: the sweep's poses
//    in it and the reach's own corners): round every point of the edge of the glass that faces
//    the eye (its outline, or where it turns away) there is only glass or rim, so the glass never
//    meets the shell or the helmet's outline and the band round it never breaks. Past the reach,
//    at the sweep's far corners, how much of the glass shows past the rim is measured and reported.
//   POSE=yaw,pitch,roll node urchi/tools/build-suit.mjs --dry   checks that one pose alone
const inWindow = (p) => p[2] - H.c[2] > 1 && inPolygon(...toWindow(p), WINDOW);
/** Where the line p + t (e - p), t in 0..1, is inside a convex solid (outward planes): [t0, t1], or null. */
function clipLine(planes, p, e) {
  const d = sub(e, p);
  let t0 = 0, t1 = 1;
  for (const pl of planes) {
    const a = dot(pl.n, p) - pl.d, b = dot(pl.n, d);
    if (Math.abs(b) < 1e-12) { if (a > 0) return null; continue; }
    const t = -a / b;
    if (b < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t1 - t0 < 1e-4) return null;
  }
  return [t0, t1];
}
/** The visor's opening (OPENING) at each vertex of the glass: its z uncapped, rounded as the bake rounds; its own z elsewhere. */
const openZ = V.map((p, i) => (VP[i] === byName.get('visor') && OPENING.has(openingKey(all[VP[i]].v[i - partBase[VP[i]]])) ? r1(OPENING.get(openingKey(all[VP[i]].v[i - partBase[VP[i]]]))) : p[2]));
/** The opening's facets (the glass's, not its hidden back, uncapped), as triangles of points. */
const glassTris = F.flatMap((f, fi) => (FP[fi] === byName.get('visor') && !hidden[fi] ? [f.map((i) => [V[i][0], V[i][1], openZ[i]])] : []));
/** Whether the segment from p to e crosses a triangle (Moller and Trumbore's test). */
function crosses(p, e, [a, b, c]) {
  const d = sub(e, p), e1 = sub(b, a), e2 = sub(c, a), h = cross(d, e2), det = dot(e1, h);
  if (Math.abs(det) < 1e-12) return false;
  const s = sub(p, a), u = dot(s, h) / det;
  if (u < 0 || u > 1) return false;
  const q = cross(s, e1), v = dot(d, q) / det;
  if (v < 0 || u + v > 1) return false;
  const t = dot(e2, q) / det;
  return t > 1e-6 && t < 1;
}
/** Whether the opaque shell stands between p and the eye e: the line crosses it, and not only in the visor's window. */
function behindShell(p, e) {
  const s = clipLine(shellP.planes, p, e);
  return !!s && !(inWindow(add(p, mul(sub(e, p), s[0]))) && inWindow(add(p, mul(sub(e, p), s[1]))));
}
/**
 * How the painter draws a rim plane, the eye at e: 0 behind the shell (any of its corners, or its
 * middle), 1 through the glass (the line from its middle to the eye crosses the visor's opening), 2 in front.
 */
function rimView(g, e) {
  if (planeCorners[g].some((i) => behindShell(V[i], e)) || behindShell(planeMid[g], e)) return 0;
  return glassTris.some((t) => crosses(planeMid[g], e, t)) ? 1 : 2;
}
// each plane's middle: the mean of the middles of its triangles that can be seen, as the painter takes it
const planeMid = (() => {
  const sum = new Map(), n = new Map();
  F.forEach((_, fi) => { if (hidden[fi]) return; const g = G[fi]; sum.set(g, add(sum.get(g) || [0, 0, 0], faceCentre(fi))); n.set(g, (n.get(g) || 0) + 1); });
  return Object.fromEntries([...sum].map(([g, v]) => [g, mul(v, 1 / n.get(g))]));
})();
// and its corners, from the same triangles
const planeCorners = (() => {
  const c = {};
  F.forEach((f, fi) => { if (!hidden[fi]) (c[G[fi]] ||= new Set()); if (!hidden[fi]) f.forEach((i) => c[G[fi]].add(i)); });
  return Object.fromEntries(Object.entries(c).map(([g, set]) => [g, [...set]]));
})();
/** The eye, in the head's space, for a pose (degrees). */
function eyeFor(pose) {
  const cy = Math.cos(pose.yaw * D2R), sy = Math.sin(pose.yaw * D2R), cp = Math.cos(pose.pitch * D2R), sp = Math.sin(pose.pitch * D2R), cr = Math.cos(pose.roll * D2R), sr = Math.sin(pose.roll * D2R);
  const ex0 = 0, ey0 = -PIVOT_Y, ez0 = PERSPECTIVE;
  const x1 = ex0 * cr + (ey0 - TILT_PIVOT) * sr, y2 = -ex0 * sr + (ey0 - TILT_PIVOT) * cr + TILT_PIVOT;
  const y = y2 * cp - ez0 * sp, z1 = y2 * sp + ez0 * cp;
  return [x1 * cy - z1 * sy, y + PIVOT_Y, x1 * sy + z1 * cy];
}
const glassF = F.map((_, fi) => fi).filter((fi) => FP[fi] === byName.get('visor') && !hidden[fi]);
// the head as the suit paints it (tucked)
const tuckedHead = HEAD.v.map((p, i) => { const t = tuck.find((r) => r[0] === i); return t ? t.slice(1) : p; });
{
  const coverF = F.map((_, fi) => fi).filter((fi) => all[FP[fi]].decal && !hidden[fi]);
  const inTri = (p, t) => {
    const [a, b, c] = t;
    const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
    const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  /** Triangles on screen with their boxes, and the ones whose box comes within r of a point. */
  const boxed = (tris) => tris.map((t) => ({ t, x0: Math.min(t[0][0], t[1][0], t[2][0]), x1: Math.max(t[0][0], t[1][0], t[2][0]), y0: Math.min(t[0][1], t[1][1], t[2][1]), y1: Math.max(t[0][1], t[1][1], t[2][1]) }));
  const nearTo = (list, s, r) => list.filter((b) => b.x0 - r <= s[0] && s[0] <= b.x1 + r && b.y0 - r <= s[1] && s[1] <= b.y1 + r).map((b) => b.t);
  const inAny = (tris, p) => tris.some((t) => inTri(p, t));
  /** Whether p is within r of a triangle (inside it, or near one of its edges). */
  const nearAny = (tris, p, r) => tris.some((t) => inTri(p, t) || [0, 1, 2].some((k) => { const a = t[k], b = t[(k + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(a[0] + dx * u - p[0], a[1] + dy * u - p[1]) <= r; }));
  /** The largest radius (up to hi) whose ring of `n` points round s passes the test, -1 if s itself fails. */
  const room = (s, ok, hi, n, steps) => {
    if (!ok(s)) return -1;
    let lo = 0;
    for (let k = 0; k < steps; k++) { const m = (lo + hi) / 2; if (Array.from({ length: n }, (_, j) => [s[0] + m * Math.cos((2 * j * Math.PI) / n), s[1] + m * Math.sin((2 * j * Math.PI) / n)]).every(ok)) lo = m; else hi = m; }
    return lo;
  };
  // the glass's edges: each directed edge of a glass face, and the glass face across it (if any)
  const glassSet = new Set(glassF), across = new Map();
  for (const fi of glassF) for (let k = 0; k < 3; k++) across.set(`${F[fi][k]}>${F[fi][(k + 1) % 3]}`, fi);
  const RIM_ROOM = 1;   // the rim borders each point of the glass's edge with this much to spare round it
  // glass reaching past the rim by no more than the dark base line (1.5 units) that runs round the whole figure reads as that line
  const SLOP = 1.5;
  let worstM = Infinity, worstPose = null, poses = 0, rimSamples = 0, rimWorst = Infinity, rimWorstPose = null, reachPoses = 0, farRim = Infinity, farPose = null, farOpen = 0, farPoses = 0, farYaw = Infinity, farPitch = Infinity;
  const byYaw = new Map(), rimByYaw = new Map(), views = [0, 0, 0];
  const failing = [];
  const only = process.env.POSE ? [Object.fromEntries(['yaw', 'pitch', 'roll'].map((k, i) => [k, Number(process.env.POSE.split(',')[i])]))] : null;
  for (const pose of only || (QUICK ? [...poseSweep(0)].filter((p, i) => i % 7 === 0) : [...poseSweep(600), ...reachGrid()])) {
    poses++;
    const pr = headProjector(pose);
    const Q = V.map(() => null), q = (i) => Q[i] || (Q[i] = pr(V[i]));
    const vis = (fi) => { const P3 = F[fi].map(q); let area = 0; for (let k = 0; k < 3; k++) { const a = P3[k], b = P3[(k + 1) % 3]; area += a[0] * b[1] - b[0] * a[1]; } return area > 0 ? P3 : null; };
    const sp = Math.sin(pose.pitch * D2R), cp = Math.cos(pose.pitch * D2R), sy = Math.sin(pose.yaw * D2R), cy = Math.cos(pose.yaw * D2R);
    const E = eyeFor(pose);
    // the decal faces facing the eye: those drawn over the head, and the rim's seen through the glass
    const front = [], through = [], viewOf = new Map();
    for (const fi of coverF) {
      const t = vis(fi);
      if (!t) continue;
      const P = all[FP[fi]];
      if (P.decal === 1) { if (!viewOf.has(G[fi])) viewOf.set(G[fi], rimView(G[fi], E)); const v = viewOf.get(G[fi]); views[v]++; if (v === 2) front.push(t); else if (v === 1) through.push(t); }
      else { const c = P.centre3 || (P.centre3 = centroid(P.v)); if (dot(sub(c, H.c), sub(E, c)) > 0) front.push(t); }
    }
    const facing = new Set(glassF.filter((fi) => vis(fi)));
    const glass = boxed([...facing].map(vis)), cover = boxed(front), behind = boxed(through);
    const kb = Math.round(pose.yaw / 20) * 20;
    let poseEye = Infinity, poseRim = Infinity;
    for (const e of HEAD.eyes) {
      if (-e.n[1] * sp + (-e.n[0] * sy + e.n[2] * cy) * cp < 0.15) continue;
      for (const p of eyeRing(e, EYE_GROW, 32)) {
        const s = pr(p), G2 = nearTo(glass, s, 80), C2 = nearTo(cover, s, 80);
        const lo = room(s, (x) => inAny(G2, x) && !inAny(C2, x), 80, 12, 10);
        if (lo < worstM) { worstM = lo; worstPose = { ...pose, eye: e.c[0] > 0 ? 'right' : 'left', at: p.map(Math.round) }; }
        byYaw.set(kb, Math.min(byYaw.get(kb) ?? Infinity, lo));
        poseEye = Math.min(poseEye, lo);
      }
    }
    // the rim round the glass: the edge of what of the glass faces the eye, every few units
    for (const fi of facing) for (let k = 0; k < 3; k++) {
      const a = F[fi][k], b = F[fi][(k + 1) % 3], other = across.get(`${b}>${a}`);
      if (other !== undefined && glassSet.has(other) && facing.has(other)) continue;
      const A = q(a), B = q(b), n = Math.max(2, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 6));
      for (let j = 0; j <= n; j++) {
        // on the edge, a hair inside its own triangle (toward its middle), so it counts as glass
        const T = vis(fi), mx = (T[0][0] + T[1][0] + T[2][0]) / 3, my = (T[0][1] + T[1][1] + T[2][1]) / 3, e0 = [lerp(A[0], B[0], j / n), lerp(A[1], B[1], j / n)], el = Math.hypot(mx - e0[0], my - e0[1]) || 1;
        const s = [e0[0] + ((mx - e0[0]) / el) * 0.05, e0[1] + ((my - e0[1]) / el) * 0.05];
        const C2 = nearTo(cover, s, 40), T2 = nearTo(behind, s, 40), G2 = nearTo(glass, s, 40);
        rimSamples++;
        const lo = room(s, (x) => inAny(G2, x) || nearAny(C2, x, SLOP) || nearAny(T2, x, SLOP), 40, 16, 7);
        if (!inReach(pose) && !only) { if (lo < farRim) { farRim = lo; farPose = { ...pose, at: s.map(Math.round) }; } }
        else if (lo < rimWorst) { rimWorst = lo; rimWorstPose = { ...pose, at: s.map(Math.round) }; }
        rimByYaw.set(kb, Math.min(rimByYaw.get(kb) ?? Infinity, lo));
        poseRim = Math.min(poseRim, lo);
      }
    }
    failing.push([pose.yaw, pose.pitch, pose.roll, poseEye, poseRim]);
    if (inReach(pose)) reachPoses++;
    else { farPoses++; if (poseRim < RIM_ROOM) { farOpen++; farYaw = Math.min(farYaw, Math.abs(pose.yaw)); farPitch = Math.min(farPitch, Math.abs(pose.pitch)); } }
  }
  const fmt = (p) => `yaw ${p.yaw.toFixed(0)}, pitch ${p.pitch.toFixed(0)}, roll ${p.roll.toFixed(0)}, the ${p.eye} eye at (${p.at})`;
  const fmtRim = (p) => `yaw ${p.yaw.toFixed(0)}, pitch ${p.pitch.toFixed(0)}, roll ${p.roll.toFixed(0)}, at (${p.at}) on screen`;
  const byYawText = (m) => [...m].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}: ${v.toFixed(0)}`).join(', ');
  if (VERBOSE) { const bad = failing.filter((f) => f[3] < 12 || (f[4] < RIM_ROOM && inReach({ yaw: f[0], pitch: f[1], roll: f[2] }))); console.log(`  poses failing: ${bad.length} of ${failing.length}:`, bad.slice(0, 40).map((f) => `[${f.slice(0, 3).map((v) => v.toFixed(0))}] eye ${f[3].toFixed(0)} rim ${f[4].toFixed(0)}`).join("; ")); }
  if (VERBOSE || only) console.log('  visor margin by yaw:', byYawText(byYaw), '\n  rim cover by yaw:', byYawText(rimByYaw), '\n  rim faces drawn behind / through the glass / in front:', views.join(' / '));
  if (worstM < 12) (process.env.DRAFT ? console.log : fail)(`the visor does not frame the eyes: margin ${worstM.toFixed(1)} at ${fmt(worstPose)}`);
  if (rimWorst < RIM_ROOM) (process.env.DRAFT ? console.log : fail)(`the rim breaks: the glass's edge is ${rimWorst < 0 ? 'bare' : `covered by only ${rimWorst.toFixed(1)}`} at ${fmtRim(rimWorstPose)}`);
  report.push(`visor: both eyes (${EYE_GROW}x as wide as drawn) whole inside the glass and clear of the rim and discs in all ${poses} poses of the sweep (yaw to ${RANGE.yaw}, pitch ${RANGE.pitchUp} up to ${RANGE.pitchDown} down, roll to ${RANGE.roll}); least margin ${worstM.toFixed(0)} units (${fmt(worstPose)})`);
  report.push(`rim: whole round the glass in all ${reachPoses} poses within the head's reach (yaw to ${REACH.yaw}, pitch ${REACH.pitchUp} up to ${REACH.pitchDown} down, roll to ${RANGE.roll}; and every yaw to ${RANGE.yaw} with the head within ${LEVEL} of level): round every point of the glass's visible edge (${rimSamples} in all) only glass or rim, the rim at least ${rimWorst.toFixed(1)} units wide (${fmtRim(rimWorstPose)})`);
  if (farPoses) report.push(`rim, past the reach (${farPoses} poses of the sweep, where it adds every extra at once): whole in ${farPoses - farOpen}; in ${farOpen}, all with yaw ${farYaw.toFixed(0)} or more and pitch ${farPitch.toFixed(0)} or more, a sliver of glass shows past the far rim${farOpen ? ` (the worst at ${fmtRim(farPose)})` : ''}`);
}
// The face stays behind the glass: every vertex of the head (as painted, tucked) under the glass
// in the front view is at least FACE_GAP behind it, so nothing of the head is ever in front of it.
const FACE_GAP = 16;
{
  let least = Infinity, at = null;
  for (const p of tuckedHead) {
    if (p[2] <= 0) continue;
    for (const fi of glassF) {
      const [a, b, c] = F[fi].map((i) => V[i]);
      const d = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1])) / d, v = ((b[0] - a[0]) * (p[1] - a[1]) - (p[0] - a[0]) * (b[1] - a[1])) / d;
      if (u < 0 || v < 0 || u + v > 1) continue;
      const gap = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]) - p[2];
      if (gap < least) { least = gap; at = p; }
    }
  }
  if (least < FACE_GAP) fail(`the face comes through the glass: (${at.map(Math.round)}) is ${least.toFixed(1)} behind it (want ${FACE_GAP})`);
  report.push(`glass: recessed ${GLASS.edge} (at its edge) to ${GLASS.middle} units under the helmet's surface, inside the rim, and held back to the cap in the middle (at most ${Math.round(Math.max(...glassF.flatMap((fi) => F[fi].map((i) => V[i][2]))))} forward); the face at least ${least.toFixed(0)} behind it (${at.map(Math.round)})`);
}
// Side on, the rim is the helmet's frontmost part, as the reference's is: with the whole figure
// turned (the sheet's side view, and the turns either side of it), row by row across the screen,
// how far the glass, or the shell behind it, reaches in front of the rim. None of it at 90.
{
  const rowFront = (tris, y) => {
    let m = -Infinity;
    for (const T of tris) for (let k = 0; k < 3; k++) {
      const p = T[k], q = T[(k + 1) % 3];
      if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) m = Math.max(m, p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    return m;
  };
  const past = [];
  for (const turn of [60, 65, 70, 75, 80, 85, 90]) {
    const pr = headProjector({ yaw: turn, pitch: 0, roll: 0 }), Q = V.map((p) => pr(p));
    const trisOf = (keep) => F.flatMap((f, fi) => (!hidden[fi] && keep(FP[fi], f) ? [f.map((i) => Q[i])] : []));
    const glass = trisOf((pi) => pi === byName.get('visor')), front = trisOf((pi, f) => pi === byName.get('helmet') && f.every((i) => underGlass(V[i]))), rimT = trisOf((pi) => pi === byName.get('rim'));
    let worst = 0;
    for (let y = -300; y <= 520; y += 2) { const r = rowFront(rimT, y); for (const T of [glass, front]) { const g = rowFront(T, y); if (g > -Infinity) worst = Math.max(worst, g - (r > -Infinity ? r : -1e9)); } }
    past.push([turn, worst]);
  }
  const at90 = past.find(([t]) => t === 90)[1];
  if (at90 > 0) (process.env.DRAFT ? console.log : fail)(`side on, the glass stands ${at90.toFixed(1)} in front of the rim`);
  report.push(`side on: the rim the helmet's frontmost part with the figure turned 90 (the glass and the shell behind it ${at90 > 0 ? at90.toFixed(1) + ' in front' : 'wholly behind it'}); how far in front of the rim they reach, turned ${past.map(([t, w]) => `${t}: ${w.toFixed(0)}`).join(', ')}`);
}
// ------------------------------------------------------------------ 9. the frame
// It holds the suited figure in every pose of the sweep at any turn of the whole figure (the sheet's views).
let frame;
{
  const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  const turns = Array.from({ length: 24 }, (_, k) => k * 15);
  for (const pose of poseSweep(80)) for (const turn of turns) {
    const hp = headProjector({ ...pose, yaw: pose.yaw + turn }), bp = bodyProjector(pose, turn);
    V.forEach((p, i) => { const q = all[VP[i]].rigid === 'head' ? hp(p) : bp(p); b.x0 = Math.min(b.x0, q[0]); b.x1 = Math.max(b.x1, q[0]); b.y0 = Math.min(b.y0, q[1]); b.y1 = Math.max(b.y1, q[1]); });
  }
  // room for the head's shift (the owl's bob, 10) and rise (breath and stretch, about 24), the
  // body's sway and the widest rim (a canvas pixel and a quarter on a small figure)
  const PAD = 64, step = (v) => Math.ceil(v / 7.5) * 7.5;   // whole art pixels, as the head's frame
  const X = step(Math.max(-b.x0, b.x1) + PAD), top = step(-b.y0 + PAD), bottom = step(b.y1 + PAD);
  frame = { x: -X, y: -top, w: 2 * X, h: top + bottom };
  const figure = Math.max(...V.map((p) => p[1])) - Math.min(...shellP.v.map((p) => p[1]));
  report.push(`proportions: the figure ${Math.round(figure)} units tall at rest, the helmet ${Math.round(HELMET_FLOOR - Math.min(...shellP.v.map((p) => p[1])))} of it (${Math.round((100 * (HELMET_FLOOR - Math.min(...shellP.v.map((p) => p[1])))) / figure)}%)`);
  report.push(`frame: x ${frame.x}..${frame.x + frame.w}, y ${frame.y}..${frame.y + frame.h} (${frame.w} x ${frame.h} units; the head's alone is 1402.5 x 1230)`);
}

// ------------------------------------------------------------------ bake
const flat = (a) => a.flat();
const suit = {
  // vertices in the head's space, flat [x, y, z, ...]; triangles wound as the head's (outward), flat; the plane of each
  v: flat(V),
  f: flat(F),
  g: G,
  // per vertex its part and material (a triangle's part is its corners')
  vp: VP,
  vm: VM,
  materials: MATERIALS,
  // per part: its material, what carries it (1 the head), how it lies on the shell (1 plane by plane, 2 as a whole), and whether it is convex
  parts: all.map((P) => ({ name: P.name, material: MATERIALS.indexOf(P.material), rigid: P.rigid === 'head' ? 1 : 0, decal: P.decal, convex: P.convex ? 1 : 0 })),
  // faces never seen (inside another part, or flat against one)
  hidden: hidden.flatMap((h, fi) => (h ? [fi] : [])),
  // the planes between the body's parts that can overlap: [a, b, nx, ny, nz, d], part a on the side n.p < d
  sep,
  neck: NECK,
  body: BODY,
  tuck,
  // the visor's window on the shell as seen from the helmet's middle `hub` (each point's x and y over
  // its z from there, flat, the whole loop): a line to the eye that crosses the shell only inside it
  // passes through glass or under the rim (the occlusion test)
  hub: H.c,
  // the visor's opening: per vertex of the glass (in order), its z were it not held back to the cap
  opening: openZ.filter((_, i) => VP[i] === byName.get('visor')),
  window: WINDOW.flatMap(([x, y]) => [x, y].map((c) => Math.round(c * 1e5) / 1e5 + 0)),
};
if (!DRY) {
  writeFileSync(OUT, JSON.stringify(suit) + '\n');
  writeFileSync(OUT_FRAME, JSON.stringify(frame) + '\n');
}
report.forEach((l) => console.log('  ' + l));
console.log(DRY ? 'checked (a dry run: nothing written)' : `baked ${V.length} vertices, ${F.length} triangles, ${all.length} parts into src/engine/urchi/suit.json (${Math.round(JSON.stringify(suit).length / 1024)} KB), and its frame into suit-frame.json`);
