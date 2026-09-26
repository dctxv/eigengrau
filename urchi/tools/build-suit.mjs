#!/usr/bin/env node
// Builds Urchi's spacesuit and bakes it into src/engine/urchi/suit.json.
//
//   npm run urchi:suit                    # build, check and bake
//   node urchi/tools/build-suit.mjs --dry # build and check only
//   --verbose                             # the visor's margin by yaw, the tightest part pairs
//
// The suit is modelled in the head's own space (mesh.json: x right, y down, z toward the
// viewer, the same units), after a reference sheet of a chibi low-poly astronaut: a rounded,
// faceted helmet that fits the head closely, with a big visor framed by a thick rim and a comm
// disc on each side; a neck ring; a short chunky torso (chest, belt, hips) with a chest panel,
// its buttons and two lights; hoses from the chest round the hips to a box backpack; shoulders,
// upper arms and forearms with joint rings and big mittens with thumbs; short legs with knee
// pads; chunky boots on dark soles. The sheet was generated, so it is not symmetrical, and its
// helmet has bear ears: this has neither.
//
//  1. Fit. The helmet is sized from the head itself (each half-axis is the reach of the head's
//     core that way and a margin): its faceted shell must hold every vertex of the core (all of
//     the head but the ear tips and the side spikes) with room to spare, and
//     the visor must frame both eyes, a little wider than they ever open, in every pose the
//     head reaches (the yaw, pitch and roll the attention system and its acts add up to). The
//     ears and spikes do not fit: their vertices are tucked in under the shell (baked as
//     `tuck`), and the painter only ever shows the head through the visor.
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
//     body's parts convex and apart, the triangle count per part, the helmet's fit and the
//     eyes' margin inside the visor.
//  4. Bake: vertices, triangles, the plane each belongs to, part and material per vertex, the
//     faces never seen (inside another part, or flat against one), the planes between the body's
//     parts, the head's tucked vertices, and the canvas frame that holds the suited figure in
//     any pose.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HEAD = JSON.parse(readFileSync(resolve(ROOT, 'src/engine/urchi/mesh.json'), 'utf8'));
const OUT = resolve(ROOT, 'src/engine/urchi/suit.json');
const DRY = process.argv.includes('--dry');
const VERBOSE = process.argv.includes('--verbose');

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
//         up to 5 more (5.5 swinging across), a mote's wind-up holds a pose of 5: 52.4 in all.
//         A glance (22) turns against the gaze, so it only adds to a gaze under about 30.
//   pitch up: the gaze 17.5, a tilt 3, a sleeper's breath 3.15 x 1.4, the stretch 9.5, a
//         startle's kick about 4 on the pose's spring (the intro's deep breath, 3 x 3.15, comes
//         only while the head is bare): 38.4. Down: the gaze 15, a tilt 2, the breath 4.4, the
//         asleep dip 7, a nod 4: 32.4.
//   roll  a tilt up to 15 (13 cued), overshooting to 17.5 when it swings across, the owl's bob
//         3 or the listening sway 2.5 on top: 20.5.
const RANGE = { yaw: 56, pitchUp: 42, pitchDown: 34, roll: 22 };
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
const MATERIALS = ['fabric', 'grey', 'dark', 'glass', 'accent'];
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
const MARGIN = { side: 80, top: 102, chin: 64, front: 72, back: 58 };
const H = {
  c: [0, PIVOT_Y - 6, 0],
  a: coreReach(0, 1) + MARGIN.side,
  top: coreReach(1, -1) + (PIVOT_Y - 6) + MARGIN.top,
  bottom: coreReach(1, 1) - (PIVOT_Y - 6) + MARGIN.chin,
  front: coreReach(2, 1) + MARGIN.front,
  back: coreReach(2, -1) + MARGIN.back,
  n: 2.25, m: 2.2,           // horizontal and vertical roundness (2 would be an ellipsoid)
  rings: [21, 43, 65, 88, 111, 133, 152],   // latitudes from the top, degrees; the bottom is flat
  seg: 7,                    // longitudes per half at the equator (staggered rings get one more)
};
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

// The shell: points on the surface at a few latitudes, staggered longitudes (fewer near the
// top), the lowest ring set level for a flat underside; the shell is their convex hull.
const shell = (() => {
  const pts = [add(H.c, [0, -H.top, 0])];
  const last = [];
  H.rings.forEach((deg, k) => {
    const theta = deg * D2R;
    const count = Math.max(3, Math.round(H.seg * Math.sin(theta) + 0.4));
    const phis = k % 2 ? [0, ...Array.from({ length: count }, (_, j) => ((j + 0.5) * Math.PI) / count), Math.PI] : Array.from({ length: count + 1 }, (_, j) => (j * Math.PI) / count);
    const ring = phis.map((phi) => helmetAt(theta, phi));
    if (k === H.rings.length - 1) last.push(...ring); else pts.push(...ring);
  });
  const floor = Math.max(...last.map((p) => p[1]));
  pts.push(...last.map(([x, , z]) => [x, floor, z]));
  return hullPart('helmet', 'fabric', pts, { centre: true, rigid: 'head' });
})();
const HELMET_FLOOR = Math.max(...shell.v.map((p) => p[1]));

// The visor: its outline in the front view (the right half, from the top of the middle round to
// the bottom of the middle), set on the helmet's front. A wide rounded shield, its top gently
// arched and its bottom corners well rounded, framing the eyes with room for every turn.
const VISOR = [[0, -178], [150, -171], [276, -146], [364, -90], [414, 0], [430, 104], [420, 210], [372, 298], [282, 354], [150, 384], [0, 394]];
const VISOR_OUT = 3;   // the glass sits this far out from the smooth surface
const onVisor = ([x, y]) => { const p = helmetFront(x, y); return add(p, mul(helmetNormal(p), VISOR_OUT)); };
const lens = part('visor', 'glass', { centre: true, rigid: 'head' });
{
  const P = lens;
  // the outline, a ring inside it and the middle: facets like the shell's; a shallow cone behind
  const O = VISOR.map(onVisor).map((p) => P.vert(p));
  const I = VISOR.map(([x, y]) => onVisor([x * 0.56, 112 + (y - 112) * 0.6])).map((p) => P.vert(p));
  const c = P.vert(onVisor([0, 108]));
  for (let i = 0; i + 1 < O.length; i++) P.quad(O[i], O[i + 1], I[i + 1], I[i]);
  for (let i = 0; i + 1 < I.length; i++) P.tri(c, I[i], I[i + 1]);
  P.back = P.vert(add(helmetFront(0, 108), [0, 0, -140]));
  for (let i = 0; i + 1 < O.length; i++) P.tri(P.back, O[i + 1], O[i]);
}

// The rim: a thick, rounded band round the visor, sitting on the shell.
const rim = part('rim', 'fabric', { centre: true, rigid: 'head', decal: 1 });
{
  const P = rim;
  const W = 58, UP = 26, BEV = 12, IN = 6, DOWN = 5;
  const rings = VISOR.map(([x, y], i) => {
    const s = helmetFront(x, y), nrm = helmetNormal(s);
    const prev = VISOR[Math.max(0, i - 1)], next = VISOR[Math.min(VISOR.length - 1, i + 1)];
    // the outline runs clockwise on screen: rightward across the top, leftward along the bottom
    let tan = i === 0 ? [1, 0, 0] : i === VISOR.length - 1 ? [-1, 0, 0] : [next[0] - prev[0], next[1] - prev[1], 0];
    tan = unit(sub(tan, mul(nrm, dot(tan, nrm))));
    const out = unit(cross(tan, nrm));   // away from the glass
    const at = (u, h) => add(s, add(mul(out, u), mul(nrm, h)));
    return [at(-IN, -DOWN), at(-IN, UP - BEV), at(-IN + BEV, UP), at(W - IN - 9, UP - 5), at(W - IN + 2, -DOWN)];
  });
  for (const r of [rings[0], rings[rings.length - 1]]) for (const p of r) p[0] = 0;   // square on to the middle
  const ids = rings.map((r) => r.map((p) => P.vert(p)));
  const k6 = ids[0].length;
  for (let k = 0; k + 1 < ids.length; k++) for (let j = 0; j < k6; j++) P.quad(ids[k][j], ids[k][(j + 1) % k6], ids[k + 1][(j + 1) % k6], ids[k + 1][j]);
}

// Comm discs on the helmet's sides, level with the eyes, a little behind the rim.
const DISC = { y: 112, z: 26, r: 102, up: 40, bevel: 16, sides: 10 };
{
  const s = helmetAlong([0, DISC.y, DISC.z], [1, 0, 0]), ax = helmetNormal(s);
  const u = unit(cross(ax, [0, 1, 0])), w = cross(u, ax);
  const pts = [...ring(add(s, mul(ax, -16)), u, w, DISC.r, DISC.r, DISC.sides), ...ring(add(s, mul(ax, DISC.up - DISC.bevel)), u, w, DISC.r, DISC.r, DISC.sides), ...ring(add(s, mul(ax, DISC.up)), u, w, DISC.r - DISC.bevel, DISC.r - DISC.bevel, DISC.sides)];
  hullPart('disc.R', 'grey', pts, { rigid: 'head', decal: 2 });
}

// ------------------------------------------------------------------ 2. the body
// The body hangs from the neck ring; at rest it stands under the helmet. Its parts are convex and
// meet flat on to each other. Heights (y): the neck ring from inside the helmet down to the
// torso's top, 560; the torso to 950; the legs to the boots' tops, 1146; the soles' undersides
// 1380 (all 24 higher once it is seated). A chibi: the helmet is nearly half the figure.
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

// The neck ring: a grey collar from well inside the helmet (so a nod never shows a gap) down to the torso.
hullPart('neck ring', 'grey', [430, 560].flatMap((y) => ring([0, y, 0], X, Z, 210, 174, 10, 0).filter((p) => p[0] >= -1e-9)), { centre: true });

// The torso: rounded-box sections, in three parts, the chest, a grey belt and the hips, flat on to
// each other. Flat where things meet it: the chest (x within 150, y 640 to 790, z 225) for the
// chest panel; each side (x 290, y 585 to 700) for a shoulder; the back (x within 210, y 640 to
// 812, z -200) for the backpack; the underside (y 950) for the legs; the top (y 560) for the
// neck ring. Widest at the shoulders, in a little toward the hips.
//   [y, front flat half-width, front z, side x, side's front z, side's back z, back flat half-width, back z]
const TORSO = [
  [560, 120, 184, 234, 116, -112, 120, -180],
  [585, 150, 206, 290, 120, -116, 176, -192],
  [640, 150, 225, 290, 124, -118, 210, -200],
  [700, 150, 225, 290, 124, -118, 210, -200],
  [790, 150, 225, 288, 122, -118, 210, -200],
  [840, 144, 216, 282, 119, -116, 210, -200],
  [905, 130, 196, 264, 111, -109, 198, -191],
  [950, 156, 156, 246, 114, -114, 176, -156],
];
const sectionAt = (y) => {
  const k = TORSO.findIndex((r) => r[0] >= y), a = TORSO[Math.max(0, k - 1)], b = TORSO[k], t = b[0] === a[0] ? 0 : (y - a[0]) / (b[0] - a[0]);
  return a.map((v, i) => lerp(v, b[i], t));
};
const cornersOf = ([y, fx, zf, a, zsf, zsb, bx, zb]) => [[fx, y, zf], [a, y, zsf], [a, y, zsb], [bx, y, zb]];
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

// The chest panel: a bevelled grey slab flat on the chest, with a few buttons and two lights.
const PANEL = { x: 138, y0: 648, y1: 784, z0: TORSO_FRONT, z1: TORSO_FRONT + 44, bevel: 11 };
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

// The backpack: a bevelled box flat on the back, from under the helmet to the small of the back.
{
  const hw = 210, y0 = 566, y1 = 912, z0 = TORSO_BACK, z1 = -426, b = 34, b2 = 16;
  const face = (z, i) => [[0, y0 + i, z], [hw - i, y0 + i, z], [hw, y0 + i + b2, z], [hw, y1 - i - b2, z], [hw - i, y1 - i, z], [0, y1 - i, z]].map(([x, y, zz]) => [Math.min(x, hw - (i ? b2 : 0)), y, zz]);
  hullPart('backpack', 'fabric', [...face(z0, 0), ...face(z1 + b, 0), ...face(z1, b), [0, y0 + 80, z1 - 26], [0, y1 - 80, z1 - 26]], { centre: true });
}
const PACK = { side: 210, y: 866, z: -308 };

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
const LEG = { x: 140, top: TORSO_FLOOR, bottom: 1146 };
hullPart('leg.R', 'fabric', [...octagon([LEG.x, LEG.top, 0], X, Z, 94, 104, 36), ...octagon([LEG.x, LEG.bottom, 0], X, Z, 90, 100, 34)]);
{
  // the knee pad: flat on the leg's front, which leans back a hair toward the ankle
  const n = unit([0, 4, LEG.bottom - LEG.top]), y0 = 1030, y1 = 1104, hw = 50;
  const onFront = (x, y) => [x, y, 104 - ((y - LEG.top) * 4) / (LEG.bottom - LEG.top)];
  const rect = (i, h) => [[LEG.x - hw + i, y0 + i], [LEG.x + hw - i, y0 + i], [LEG.x + hw - i, y1 - i], [LEG.x - hw + i, y1 - i]].map(([x, y]) => add(onFront(x, y), mul(n, h)));
  hullPart('knee.R', 'grey', [...rect(0, 0), ...rect(6, 15)]);
}
// The boots: chunky and round-toed, the toe running forward and down; on dark soles.
const BOOT = { x: 146, top: LEG.bottom, bottom: LEG.bottom + 186, sole: LEG.bottom + 234 };
{
  // [y, half width, back z, front z, corner]
  const secs = [[BOOT.top, 110, -120, 116, 38], [BOOT.top + 92, 130, -144, 224, 52], [BOOT.bottom, 132, -148, 256, 58]];
  const sec = ([y, hw, zb, zf, c]) => octagon([BOOT.x, y, (zb + zf) / 2], X, Z, hw, (zf - zb) / 2, c);
  hullPart('boot.R', 'fabric', secs.flatMap(sec));
  const s = (i, y) => octagon([BOOT.x, y, 54], X, Z, 138 - i, 208 - i, 60);
  hullPart('sole.R', 'dark', [...s(0, BOOT.bottom), ...s(7, BOOT.sole)]);
}

// Hoses: from under the chest panel's lower corners, down past the belt, out and round the hips
// close to the body, into the backpack's sides. Each is a few straight five-sided segments, joint to joint.
{
  const CONN = { x: 104, y: PANEL.y1, r: 19, h: 22, z: (PANEL.z0 + PANEL.z1) / 2 };
  hullPart('connector.R', 'dark', [...ring([CONN.x, CONN.y, CONN.z], X, Z, CONN.r, CONN.r, 5, 0), ...ring([CONN.x, CONN.y + CONN.h, CONN.z], X, Z, CONN.r, CONN.r, 5, 0)]);
  const PC = { h: 18, r: 25 };   // the connector on the backpack's side
  hullPart('pack connector.R', 'dark', [...ring([PACK.side, PACK.y, PACK.z], Y, Z, PC.r, PC.r, 5, 0), ...ring([PACK.side + PC.h, PACK.y, PACK.z], Y, Z, PC.r, PC.r, 5, 0)]);
  const R = 17;
  // joints and the direction through each: straight down out of the connector, straight in to the pack
  const J = [
    [[CONN.x, CONN.y + CONN.h, CONN.z], Y],
    [[CONN.x + 16, 874, CONN.z + 2], null],
    [[222, 912, 206], null],
    [[298, 928, 72], null],
    [[300, 922, -80], null],
    [[PACK.side + PC.h + 46, PACK.y + 20, PACK.z + 36], null],
    [[PACK.side + PC.h, PACK.y, PACK.z], [-1, 0, 0]],
  ];
  J.forEach((j, k) => { if (!j[1]) j[1] = unit(sub(J[k + 1][0], J[k - 1][0])); });
  // one frame carried along the hose, so its six sides do not twist
  let u = unit(cross(J[0][1], X));
  const rings = J.map(([c, d]) => { u = unit(sub(u, mul(d, dot(u, d)))); return ring(c, u, cross(d, u), R, R, 5); });
  for (let k = 0; k + 1 < J.length; k++) hullPart(`hose ${k + 1}.R`, 'dark', [...rings[k], ...rings[k + 1]]);
}

// ------------------------------------------------------------------ 3. mirror and orient
const isBody = (P) => P.rigid === 'body';
const signedVolume = (v, f) => f.reduce((s, [a, b, c]) => s + dot(v[a], cross(v[b], v[c])) / 6, 0);
const HEAD_SIGN = Math.sign(signedVolume(HEAD.v, HEAD.f));
// The body sits a little higher than it was drawn, so the helmet rests close on the shoulders.
const BODY_DY = -24;
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
  for (const f of P.f) { const a = triArea(P.v, f), g = triMinAngle(P.v, f); minArea = Math.min(minArea, a); minAngle = Math.min(minAngle, g); if (a < 1) fail(`${P.name}: degenerate triangle ${f} (area ${a.toFixed(3)})`); }
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
  const groups = [['helmet', ['helmet', 'visor', 'rim', 'disc']], ['torso', ['neck ring', 'torso', 'belt', 'hips', 'chest panel', 'slot', 'button', 'light', 'backpack']], ['hoses', ['connector', 'hose', 'pack connector']], ['arms', ['shoulder', 'upper arm', 'elbow ring', 'forearm', 'cuff', 'glove', 'palm', 'thumb']], ['legs', ['leg', 'knee', 'boot', 'sole']]];
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
  let count = 0;
  F.forEach((f, fi) => {
    const P = all[FP[fi]];
    if (P.back !== undefined && f.some((i) => i - partBase[FP[fi]] === P.back)) { hidden[fi] = 1; count++; return; }
    const pts = [...f.map((i) => V[i]), faceCentre(fi)];
    for (let qi = 0; qi < all.length; qi++) {
      const Q = all[qi];
      if (qi === FP[fi] || Q.rigid !== P.rigid || !Q.planes) continue;
      if (pts.every((p) => Q.planes.every((pl) => dot(pl.n, p) - pl.d < 0.5))) { hidden[fi] = 1; count++; return; }
    }
  });
  report.push(`never seen: ${count} faces lie inside another part or flat against it`);
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
  for (let a = 0; a < info.length; a++) for (let b = a + 1; b < info.length; b++) {
    pairs++;
    if (!overlaps(a, b)) continue;
    const A = info[a], B = info[b];
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
    if (best.gap < worst.gap) worst = { gap: best.gap, a: A.P.name, b: B.P.name };
    if (best.gap < 0.5) touching++;
    tight.push([best.gap, A.P.name, B.P.name]);
    if (best.gap < -0.5) fail(`${A.P.name} and ${B.P.name} overlap by ${(-best.gap).toFixed(1)}: no plane between them`);
    sep.push([A.i, B.i, ...best.n.map((c) => Math.round(c * 1e4) / 1e4), Math.round(best.d * 10) / 10]);
  }
  if (VERBOSE) console.log('  tightest pairs:', tight.sort((p, q) => p[0] - q[0]).slice(0, 16).map(([g, a, b]) => `${a}/${b} ${g.toFixed(1)}`).join(', '));
  report.push(`apart: every two of the body's ${info.length} parts that can overlap on screen (${sep.length} of ${pairs} pairs) have a plane between them; ${touching} pairs meet flat on, the closest others are ${tight.filter((p) => p[0] >= 0.5).sort((p, q) => p[0] - q[0])[0][0].toFixed(1)} apart`);
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
// the protrusions: drawn in along the line from the helmet's middle until CLEAR inside
const tuck = [];
HEAD.v.forEach((p, i) => {
  if (inside(p) >= CLEAR) return;
  if (!isProtrusion(p)) fail(`core vertex ${i} (${p}) would need tucking`);
  const r = sub(p, H.c);
  let lo = 0, hi = 1;
  for (let k = 0; k < 50; k++) { const t = (lo + hi) / 2; if (inside(add(H.c, mul(r, t))) >= CLEAR) lo = t; else hi = t; }
  tuck.push([i, ...add(H.c, mul(r, lo)).map((c) => Math.round(c * 10) / 10)]);
});
report.push(`tucked: ${tuck.length} head vertices (the ear tips and the spikes: ${tuck.map((t) => t[0]).join(', ')}) drawn in under the shell`);

// ------------------------------------------------------------------ 8. the eyes in the visor
// The painter draws a plane of the rim after the glass when the line from its middle to the eye
// passes clear of the shell, and a disc after the glass while its axis faces the eye; otherwise
// before the shell (which then covers what of them is behind). So a decal face covers the eyes
// only if it faces the eye and is drawn after the glass. For every pose: each point of each eye's outline (as wide as it
// ever opens), and a ring of points round it, must fall inside the visor's front-facing glass
// and outside every such face. Eyes the painter hides (turned too far) are skipped.
//   POSE=yaw,pitch,roll node urchi/tools/build-suit.mjs --dry   checks that one pose alone
/** Whether the line from p to the eye e passes clear of the shell (convex: clip it to every facet's plane). */
function clearOfShell(p, e) {
  const d = sub(e, p);
  let t0 = 0, t1 = 1;
  for (const pl of shellP.planes) {
    const a = dot(pl.n, p) - pl.d, b = dot(pl.n, d);
    if (Math.abs(b) < 1e-12) { if (a > 0) return true; continue; }
    const t = -a / b;
    if (b < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t1 - t0 < 1e-4) return true;
  }
  return false;
}
// each plane's middle: the mean of the middles of its triangles that can be seen, as the painter takes it
const planeMid = (() => {
  const sum = new Map(), n = new Map();
  F.forEach((_, fi) => { if (hidden[fi]) return; const g = G[fi]; sum.set(g, add(sum.get(g) || [0, 0, 0], faceCentre(fi))); n.set(g, (n.get(g) || 0) + 1); });
  return Object.fromEntries([...sum].map(([g, v]) => [g, mul(v, 1 / n.get(g))]));
})();
{
  const glassF = F.map((_, fi) => fi).filter((fi) => FP[fi] === byName.get('visor') && !hidden[fi]);
  const coverF = F.map((_, fi) => fi).filter((fi) => all[FP[fi]].decal && !hidden[fi]);
  const inTri = (p, a, b, c) => {
    const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
    const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  let worstM = Infinity, worstPose = null, poses = 0;
  const byYaw = new Map();
  const only = process.env.POSE ? [Object.fromEntries(['yaw', 'pitch', 'roll'].map((k, i) => [k, Number(process.env.POSE.split(',')[i])]))] : null;
  for (const pose of only || poseSweep(600)) {
    poses++;
    const pr = headProjector(pose);
    const Q = V.map(() => null), q = (i) => Q[i] || (Q[i] = pr(V[i]));
    const vis = (fi) => { const P3 = F[fi].map(q); let area = 0; for (let k = 0; k < 3; k++) { const a = P3[k], b = P3[(k + 1) % 3]; area += a[0] * b[1] - b[0] * a[1]; } return area > 0 ? P3 : null; };
    // the eye, back in the head's space
    const cy = Math.cos(pose.yaw * D2R), sy = Math.sin(pose.yaw * D2R), cp = Math.cos(pose.pitch * D2R), sp = Math.sin(pose.pitch * D2R), cr = Math.cos(pose.roll * D2R), sr = Math.sin(pose.roll * D2R);
    let E;
    {
      const ex0 = 0, ey0 = -PIVOT_Y, ez0 = PERSPECTIVE;
      const x1 = ex0 * cr + (ey0 - TILT_PIVOT) * sr, y2 = -ex0 * sr + (ey0 - TILT_PIVOT) * cr + TILT_PIVOT;
      const y = y2 * cp - ez0 * sp, z1 = y2 * sp + ez0 * cp;
      E = [x1 * cy - z1 * sy, y + PIVOT_Y, x1 * sy + z1 * cy];
    }
    const near = (fi) => {
      const P = all[FP[fi]];
      if (P.decal === 1) return clearOfShell(planeMid[G[fi]], E);
      const c = P.centre3 || (P.centre3 = centroid(P.v));
      return dot(sub(c, H.c), sub(E, c)) > 0;
    };
    const glass = glassF.map(vis).filter(Boolean), cover = coverF.filter(near).map(vis).filter(Boolean);
    const seen = (p) => glass.some(([a, b, c]) => inTri(p, a, b, c)) && !cover.some(([a, b, c]) => inTri(p, a, b, c));
    for (const e of HEAD.eyes) {
      if (-e.n[1] * sp + (-e.n[0] * sy + e.n[2] * cy) * cp < 0.15) continue;
      for (const p of eyeRing(e, EYE_GROW, 32)) {
        const s = pr(p);
        let lo = 0, hi = 80;
        if (!seen(s)) lo = -1;
        else for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; if (Array.from({ length: 12 }, (_, j) => [s[0] + m * Math.cos((j * Math.PI) / 6), s[1] + m * Math.sin((j * Math.PI) / 6)]).every(seen)) lo = m; else hi = m; }
        if (lo < worstM) { worstM = lo; worstPose = { ...pose, eye: e.c[0] > 0 ? 'right' : 'left', at: p.map(Math.round) }; }
        const kb = Math.round(pose.yaw / 20) * 20; byYaw.set(kb, Math.min(byYaw.get(kb) ?? Infinity, lo));
      }
    }
  }
  const fmt = (p) => `yaw ${p.yaw.toFixed(0)}, pitch ${p.pitch.toFixed(0)}, roll ${p.roll.toFixed(0)}, the ${p.eye} eye at (${p.at})`;
  if (VERBOSE || only) console.log('  visor margin by yaw:', [...byYaw].sort((a, b) => a[0] - b[0]).map(([k, m]) => `${k}: ${m.toFixed(0)}`).join(', '));
  if (worstM < 12) fail(`the visor does not frame the eyes: margin ${worstM.toFixed(1)} at ${fmt(worstPose)}`);
  report.push(`visor: both eyes (${EYE_GROW}x as wide as drawn) whole inside the glass and clear of the rim and discs in all ${poses} poses of the sweep (yaw to ${RANGE.yaw}, pitch ${RANGE.pitchUp} up to ${RANGE.pitchDown} down, roll to ${RANGE.roll}); least margin ${worstM.toFixed(0)} units (${fmt(worstPose)})`);
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
  parts: all.map((P) => ({ name: P.name, material: MATERIALS.indexOf(P.material), rigid: P.rigid === 'head' ? 1 : 0, decal: P.decal })),
  // faces never seen (inside another part, or flat against one)
  hidden: hidden.flatMap((h, fi) => (h ? [fi] : [])),
  // the planes between the body's parts that can overlap: [a, b, nx, ny, nz, d], part a on the side n.p < d
  sep,
  neck: NECK,
  body: BODY,
  tuck,
  frame,
};
if (!DRY) writeFileSync(OUT, JSON.stringify(suit) + '\n');
report.forEach((l) => console.log('  ' + l));
console.log(DRY ? 'checked (a dry run: nothing written)' : `baked ${V.length} vertices, ${F.length} triangles, ${all.length} parts into src/engine/urchi/suit.json (${Math.round(JSON.stringify(suit).length / 1024)} KB)`);
