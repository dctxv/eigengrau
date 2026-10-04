/**
 * Urchi as a base body: the head as it is (mesh.json, untouched) on a body built here in code, part
 * by part, for a game to build many characters from (swapping parts) and for /dev/base to tune.
 * Pure data, no three.js: each part is flat-shaded triangles (a normal per facet) with its pivot,
 * where it would animate from, and its parent. /dev/base paints them; base3d.ts turns them into a
 * three.js scene and a .glb.
 *
 * Space: mesh units (the head is 1012 across its spikes, 890 across its jaw), y up, the ground at
 * y 0, the character facing +z, its left +x (glTF's own convention). Everything is faceted as the
 * head is: flat planes a couple of hundred units across, a shade each.
 */
import MESH_DATA from "./mesh.json";

export type Vec3 = [number, number, number];

/** Everything /dev/base tunes. Lengths in mesh units; widths as a share of the head's jaw (890). */
export type BaseParams = {
  headScale: number;
  /** How far the head comes down over the top of the body (its chin below the body's top). */
  headSink: number;
  bodyTop: number;
  bodyBottom: number;
  bodyHeight: number;
  /** Facets round the body (and so their size). */
  bodyFacets: number;
  ruff: boolean;
  ruffTufts: number;
  ruffLength: number;
  bib: boolean;
  bibColour: string;
  tail: boolean;
  tailLength: number;
  handSize: number;
  /** From the body's side to the hand's (negative: into it). */
  handGap: number;
  /** Up the body, 0 its bottom .. 1 its top. */
  handHeight: number;
  footSize: number;
  /** From the middle to each foot's. */
  footSpacing: number;
};

export const BASE_DEFAULTS: BaseParams = {
  headScale: 1,
  headSink: 0,
  bodyTop: 0.6,
  bodyBottom: 0.74,
  bodyHeight: 420,
  bodyFacets: 9,
  ruff: false,
  ruffTufts: 14,
  ruffLength: 175,
  bib: false,
  bibColour: "#ece4d4",
  tail: false,
  tailLength: 260,
  handSize: 100,
  handGap: 30,
  handHeight: 0.2,
  footSize: 92,
  footSpacing: 110,
};

/** Each tunable number's range and step, in the order /dev/base lists them. */
export const BASE_RANGES: { [K in keyof BaseParams]?: [number, number, number] } = {
  headScale: [0.6, 1.4, 0.01],
  headSink: [0, 300, 1],
  bodyTop: [0.3, 1, 0.01],
  bodyBottom: [0.3, 1.1, 0.01],
  bodyHeight: [200, 700, 1],
  bodyFacets: [5, 16, 1],
  ruffTufts: [6, 30, 1],
  ruffLength: [20, 220, 1],
  tailLength: [80, 520, 1],
  handSize: [30, 140, 1],
  handGap: [-60, 200, 1],
  handHeight: [0, 1, 0.01],
  footSize: [40, 160, 1],
  footSpacing: [40, 240, 1],
};

/** Reads params from anything (a pasted preset): known keys of the right type, clamped; the rest the defaults'. */
export function readParams(raw: unknown): BaseParams {
  const out = { ...BASE_DEFAULTS }, o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const k of Object.keys(BASE_DEFAULTS) as (keyof BaseParams)[]) {
    const v = o[k], d = BASE_DEFAULTS[k];
    if (typeof d === "number" && typeof v === "number" && Number.isFinite(v)) {
      const [lo, hi, step] = BASE_RANGES[k]!;
      (out[k] as number) = Math.min(hi, Math.max(lo, step >= 1 ? Math.round(v) : v));
    } else if (typeof d === "boolean" && typeof v === "boolean") (out[k] as boolean) = v;
    else if (typeof d === "string" && typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) (out[k] as string) = v.toLowerCase();
  }
  return out;
}

export type PartName = "head" | "body" | "ruff" | "bib" | "tail" | "hand_L" | "hand_R" | "foot_L" | "foot_R" | "eye_L" | "eye_R";
/** What a part is painted in: the head's near-black, the bib's colour, or an eye's two colours (its groups). */
export type Material = "skin" | "bib" | "eye";

export type Part = {
  name: PartName;
  parent: PartName | null;
  /** Where it animates from (the head at the neck, the tail at its root, a hand, a foot or an eye at its middle), in the character's space. */
  pivot: Vec3;
  material: Material;
  /** Triangles, three corners each, in the character's space; per corner the facet's normal. */
  position: number[];
  normal: number[];
  /** An eye's: the iris's triangles, then the pupil's (counts of corners). */
  groups?: { iris: number; pupil: number };
};

/** The eyes' colours: terrarium's, the teal (iris fills the eye; the pupil sits in it). */
export const EYE_COLOURS = { iris: "#6ff5d0", pupil: "#106e54" };

// ------------------------------------------------------------------ building facets

/** A facet's normal (Newell's, over its corners in order: anticlockwise seen from outside gives the outward one). */
function newell(pts: Vec3[]): Vec3 {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

class Facets {
  position: number[] = [];
  normal: number[] = [];
  /** A flat facet (convex), fanned into triangles, turned to face away from `inside` (a point within the solid it bounds). */
  poly(pts: Vec3[], inside: Vec3) {
    if (pts.length < 3) return;
    let n = newell(pts);
    const c = pts.reduce<Vec3>((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
    if (n[0] * (c[0] - inside[0]) + n[1] * (c[1] - inside[1]) + n[2] * (c[2] - inside[2]) < 0) { pts = pts.slice().reverse(); n = [-n[0], -n[1], -n[2]]; }
    this.facet(pts, n);
  }
  /** A flat facet as wound (anticlockwise from outside), fanned, with this normal. */
  facet(pts: Vec3[], n: Vec3) {
    for (let i = 1; i + 1 < pts.length; i++) for (const p of [pts[0], pts[i], pts[i + 1]]) { this.position.push(...p); this.normal.push(...n); }
  }
  get corners() { return this.position.length / 3; }
}

/** A ring of a turned solid: its height and its radii across (x) and front to back (z); r 0 is a pole. */
type Ring = { y: number; rx: number; rz: number };

/**
 * A solid turned round the vertical through (cx, cz): rings from top to bottom, `around` facets
 * round (the first facet's middle facing front, at `phase` 0), quads between rings and fans at
 * the poles; each facet turned outward from the solid's middle.
 */
function turned(F: Facets, rings: Ring[], around: number, centre: Vec3, phase = 0.5) {
  const at = (r: Ring, a: number): Vec3 => {
    const th = (2 * Math.PI * (a + phase)) / around;
    return [centre[0] + r.rx * Math.sin(th), r.y, centre[2] + r.rz * Math.cos(th)];
  };
  const mid: Vec3 = [centre[0], (rings[0].y + rings[rings.length - 1].y) / 2, centre[2]];
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k], B = rings[k + 1];
    for (let a = 0; a < around; a++) {
      const pts: Vec3[] = [];
      if (A.rx > 0) pts.push(at(A, a), at(A, a + 1)); else pts.push(at(A, 0));
      if (B.rx > 0) pts.push(at(B, a + 1), at(B, a)); else pts.push(at(B, 0));
      F.poly(pts, mid);
    }
  }
}

// ------------------------------------------------------------------ the head

type Mesh = { v: Vec3[]; f: Vec3[]; g: number[]; eye: { rx: number; ry: number; prx: number; pry: number; pin: number }; eyes: { c: Vec3; dzdx: number; dzdy: number; n: Vec3 }[] };
const MESH = MESH_DATA as unknown as Mesh;
/** The head's own numbers, in its space (y down): its chin, its jaw's half width, where the neck turns inside it. */
export const HEAD = { chin: 435.5, jaw: 445, neck: 380 };

/** The head's mesh into the character's space: y flipped (so each triangle's corners are taken the other way round), scaled, its origin at `o`. */
function headPoint(p: Vec3, s: number, o: Vec3): Vec3 {
  return [o[0] + p[0] * s, o[1] - p[1] * s, o[2] + p[2] * s];
}

/** The head, its planes each one shade (a normal summed over its triangles), as the 2D painter shades it. */
function head(s: number, o: Vec3): { position: number[]; normal: number[] } {
  const V = MESH.v.map((p) => headPoint(p, s, o)), sum = new Map<number, Vec3>();
  const tris = MESH.f.map((f) => [V[f[0]], V[f[2]], V[f[1]]] as Vec3[]);
  tris.forEach((t, i) => {
    const n = newell(t), g = MESH.g[i], was = sum.get(g) ?? [0, 0, 0];
    sum.set(g, [was[0] + n[0], was[1] + n[1], was[2] + n[2]]);
  });
  const F = new Facets();
  tris.forEach((t, i) => { const n = sum.get(MESH.g[i])!, l = Math.hypot(...n) || 1; F.facet(t, [n[0] / l, n[1] / l, n[2] / l]); });
  return F;
}

/** An eye, as the 2D painter draws it open: the iris an ellipse on the eye's plane, the pupil one in it toward the nose, each lifted off the face a little. */
function eye(k: number, s: number, o: Vec3): { position: number[]; normal: number[]; groups: { iris: number; pupil: number }; centre: Vec3 } {
  const e = MESH.eyes[k], E = MESH.eye, side = e.c[0] > 0 ? 1 : -1, STEPS = 28;
  const on = (x: number, y: number, lift: number): Vec3 => {
    const z = e.c[2] + e.dzdx * (x - e.c[0]) + e.dzdy * (y - e.c[1]);
    return headPoint([x + e.n[0] * lift, y + e.n[1] * lift, z + e.n[2] * lift], s, o);
  };
  const F = new Facets(), n = ((): Vec3 => { const m: Vec3 = [e.n[0], -e.n[1], e.n[2]], l = Math.hypot(...m); return [m[0] / l, m[1] / l, m[2] / l]; })();
  const disc = (cx: number, cy: number, rx: number, ry: number, lift: number) => {
    // anticlockwise seen from the front once y is flipped: round the 2D ellipse the other way
    const ring = Array.from({ length: STEPS }, (_, i) => { const t = (-2 * Math.PI * i) / STEPS; return on(cx + rx * Math.cos(t), cy + ry * Math.sin(t), lift); });
    F.facet(ring, n);
  };
  disc(e.c[0], e.c[1], E.rx, E.ry, 6);
  const iris = F.corners;
  disc(e.c[0] - side * E.pin, e.c[1], E.prx, E.pry, 9);
  return { position: F.position, normal: F.normal, groups: { iris, pupil: F.corners - iris }, centre: on(e.c[0], e.c[1], 6) };
}

// ------------------------------------------------------------------ the body

/** The body's shape from its params: its rings top to bottom (poles at either end), front to back `DEPTH` of its width. */
const DEPTH = 0.86;
function bodyRings(p: BaseParams, bottom: number): Ring[] {
  const A = (p.bodyTop * 2 * HEAD.jaw) / 2, B = (p.bodyBottom * 2 * HEAD.jaw) / 2, h = p.bodyHeight, top = bottom + h;
  // a slight pear: narrow shoulders, the widest a quarter of the way up, tucked in under it
  const ring = (t: number, r: number): Ring => ({ y: top - t * h, rx: r, rz: r * DEPTH });
  return [ring(-0.03, 0), ring(0, A * 0.55), ring(0.16, A * 0.94), ring(0.48, A + (B - A) * 0.6), ring(0.8, B), ring(0.96, B * 0.8), ring(1, 0)];
}
/** The body's half width at a height (between its rings, as its facets run). */
function bodyRadius(rings: Ring[], y: number): number {
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k], B = rings[k + 1];
    if (y <= A.y && y >= B.y) return A.rx + ((B.rx - A.rx) * (A.y - y)) / (A.y - B.y || 1);
  }
  return 0;
}

/**
 * The ruff: a ring of short sharp tufts round the neck, a cat's mane, angular as the head's spikes:
 * each a blade, taller than it is thick, from a base on the ring out over the shoulders and down,
 * every other one shorter, dropping more and set a little lower, so they read as fur rather than
 * a gear. The ring sits at the shoulders' width, so the tufts break the body's outline.
 */
function ruff(p: BaseParams, y: number, r: number, F: Facets) {
  const n = p.ruffTufts, len = p.ruffLength;
  for (let i = 0; i < n; i++) {
    const odd = i % 2 === 1, th = (2 * Math.PI * (i + (odd ? 0.06 : 0))) / n, l = len * (odd ? 0.72 : 1);
    const out: Vec3 = [Math.sin(th), 0, Math.cos(th) * DEPTH], tan: Vec3 = [Math.cos(th), 0, -Math.sin(th) * DEPTH];
    const w = ((Math.PI * 2 * r) / n) * 0.3, hgt = Math.max(30, l * 0.6), drop = odd ? 0.55 : 0.26, ry = y - (odd ? hgt * 0.4 : 0);
    const c: Vec3 = [out[0] * r * 0.82, ry, out[2] * r * 0.82];
    const tip: Vec3 = [c[0] + out[0] * l, ry - l * drop, c[2] + out[2] * l];
    // the base a diamond: thin across, tall; its top corner pulled out a little, so the blade's upper edge runs straight to the tip
    const base: Vec3[] = [[0, hgt / 2, 0.25], [w, 0, 0], [0, -hgt / 2, 0], [-w, 0, 0]].map(([u, v, o]) => [c[0] + tan[0] * u + out[0] * o * l, c[1] + v, c[2] + tan[2] * u + out[2] * o * l]);
    const mid: Vec3 = [(c[0] * 3 + tip[0]) / 4, (c[1] * 3 + tip[1]) / 4, (c[2] * 3 + tip[2]) / 4];
    for (let k = 0; k < 4; k++) F.poly([base[k], base[(k + 1) % 4], tip], mid);
  }
}

/** A faceted gem of a ball: a hand. */
function hand(F: Facets, c: Vec3, s: number) {
  const ring = (dy: number, r: number): Ring => ({ y: c[1] + dy * s, rx: r * s, rz: r * s });
  turned(F, [ring(1, 0), ring(0.6, 0.78), ring(0, 1), ring(-0.6, 0.78), ring(-1, 0)], 6, c, 0);
}

/** A foot: a faceted pad, longer than it is wide, flat underneath. */
function foot(F: Facets, c: Vec3, s: number) {
  const ring = (dy: number, r: number): Ring => ({ y: c[1] + dy * s * 0.55, rx: r * s * 0.8, rz: r * s * 1.1 });
  turned(F, [ring(1, 0), ring(0.55, 0.72), ring(0, 1), ring(-0.75, 0.86), ring(-1, 0)], 7, c, 0);
}

/**
 * The character from its params: every part, each with its pivot and parent. The feet stand on
 * the ground, the body sits on them, the head comes down `headSink` over the body's top (the ruff
 * round the neck just under its chin), the hands float at its sides.
 */
export function buildBase(p: BaseParams): Part[] {
  const parts: Part[] = [];
  const add = (name: PartName, parent: PartName | null, pivot: Vec3, F: { position: number[]; normal: number[] }, material: Material = "skin") =>
    parts.push({ name, parent, pivot, material, position: F.position, normal: F.normal });

  // the feet on the ground, the body on them
  const footH = p.footSize * 0.55, bottom = footH * 1.15;
  for (const [name, side] of [["foot_L", 1], ["foot_R", -1]] as const) {
    const F = new Facets(), c: Vec3 = [side * p.footSpacing, footH, p.footSize * 0.3];
    foot(F, c, p.footSize);
    add(name, null, c, F);
  }
  const rings = bodyRings(p, bottom), top = bottom + p.bodyHeight;
  const body = new Facets();
  turned(body, rings, Math.round(p.bodyFacets), [0, 0, 0]);
  add("body", null, [0, bottom, 0], body);

  // the head: its chin headSink below the body's top, its pivot at the neck inside it
  const s = p.headScale, chin = top - p.headSink, o: Vec3 = [0, chin + HEAD.chin * s, 0];
  add("head", "body", [0, o[1] - HEAD.neck * s, 0], head(s, o));
  for (let k = 0; k < MESH.eyes.length; k++) {
    const E = eye(k, s, o);
    // eye_L is the character's own left, +x
    parts.push({ name: E.centre[0] > 0 ? "eye_L" : "eye_R", parent: "head", pivot: E.centre, material: "eye", position: E.position, normal: E.normal, groups: E.groups });
  }

  // the ruff round the neck, just under the chin
  if (p.ruff) {
    const y = chin + 24, F = new Facets(), shoulders = rings[2].rx;
    ruff(p, y, Math.max(bodyRadius(rings, Math.min(y, top - 1)), shoulders), F);
    add("ruff", "body", [0, y, 0], F);
  }

  // the hands at its sides
  for (const [name, side] of [["hand_L", 1], ["hand_R", -1]] as const) {
    const y = bottom + p.handHeight * p.bodyHeight, c: Vec3 = [side * (bodyRadius(rings, y) + p.handGap + p.handSize * 0.9), y, p.handSize * 0.5];
    const F = new Facets();
    hand(F, c, p.handSize);
    add(name, "body", c, F);
  }
  return parts;
}
