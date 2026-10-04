import { createLimbs, type Limbs, type QuirkName, type RigData, type Side } from "./limbs";
import MESH_DATA from "./mesh.json";
import SUIT_FRAME from "./suit-frame.json";

/**
 * Urchi, the mascot, ported from urchi/index.html so the site's Urchi is the
 * same character as the standalone page: the low-poly head painted into a
 * small canvas, one pixel per 7.5-unit cell, which the host scales up with
 * hard pixel edges; the white rim; the random eye colourway; the cursor
 * follow, breathing, curious head tilt, darting pupils and blinks. Only the
 * page around it is gone (the floor, the hint and its own frame loop: the host
 * calls update(dt)). The site adds its hooks: eyes shut until opened, a slow
 * blink and a glance away, alphaAt for hit tests, and for the Space intro a
 * reveal (the eyes alone, then the head built outward from them), one ordinary
 * blink on cue, a deep breath and a gaze target. Space's attention system
 * (attention.ts) drives the rest of them: eyes that lead the head, fixation,
 * lids of its own for each eye, a resting lid, a breath whose pace and depth
 * it sets, widening, converging, a pose, a sway, an owl's bob and a stretch.
 * With none of them called it behaves exactly as the standalone page (About
 * and the favicon rely on that). The query-string knobs still work on any
 * page.
 *
 * `smooth` paints the same head without the pixels, for the site's Space and
 * About: the canvas follows the size it is shown at (setResolution), edges keep
 * their anti-aliasing, and the white rim is the silhouette's outline, as wide
 * as one art pixel was (or as the host holds it, setRim), instead of the ring
 * of pixels around it. A frame that would draw what is already there is not
 * painted again, so a still Urchi costs its host no upload.
 *
 * The mesh is baked into urchi/index.html by urchi/tools/build-mascot.mjs;
 * `npm run urchi:sync` copies it to mesh.json beside this file.
 *
 * setSuit dresses it in its spacesuit (suit.json, baked by urchi/tools/build-suit.mjs,
 * `npm run urchi:suit`): the helmet turns with the head, the head shows only through the
 * visor (its ears and spikes tucked in under the shell), and the body hangs from the neck
 * ring, following the head's turn and tilt part of the way. Everything is painted as the
 * head is: the same light, the same flat shade per plane, the same rim round the whole
 * figure. With the suit off nothing of it runs, and the head paints exactly as before. The
 * suit's model is loaded the first time it is wanted (preloadSuit, or setSuit), so a visit
 * that never sees it never fetches it.
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];
/** A 2D canvas transform, as setTransform takes it. */
type CanvasTransform6 = [number, number, number, number, number, number];
type EyeSpec = { c: Vec3; dzdx: number; dzdy: number; n: Vec3 };
type Mesh = {
  v: Vec3[];
  f: Vec3[];
  g: number[];
  eye: { rx: number; ry: number; prx: number; pry: number; pin: number };
  eyes?: EyeSpec[];
  pivot: Vec3;
};
const MESH = MESH_DATA as unknown as Mesh;

/**
 * The spacesuit, in the head's space (see urchi/tools/build-suit.mjs), flat: vertices, triangles
 * wound as the head's, the plane each belongs to; per vertex its part and material (a triangle's
 * part is its corners'); faces never seen; the planes between the body's parts; the head's
 * vertices it tucks in; the helmet's middle, `hub` (a disc faces the eye while its own middle,
 * seen from there, does); per vertex of the rim, the helmet's smooth normal under it, `rimN` (a
 * plane of the rim is in the eye's clear view while the surface under each of its corners faces
 * the eye); and per plane how far the growth out from the neck ring has travelled when it comes on
 * as the suit builds itself (baked by the build, see its growthOf: a page would take tens of
 * milliseconds to work it out).
 */
type Suit = {
  v: number[];
  f: number[];
  g: number[];
  vp: number[];
  vm: number[];
  materials: string[];
  /** Per part: its material, what carries it (1 the head), how it lies on the shell, whether convex; the segment it turns in (see limbs.ts; 0 the torso), and whether it is a joint's ball. */
  parts: { name: string; material: number; rigid: number; decal: number; convex: number; seg: number; ball: number }[];
  hidden: number[];
  sep: number[][];
  segments: RigData["segments"];
  joints: RigData["joints"];
  neck: Vec3;
  body: { yaw: number; roll: number };
  tuck: [number, number, number, number][];
  hub: Vec3;
  rimN: number[];
  grow: number[];
};
/** The suit's model, once loaded (it is not part of the page until the suit is first wanted). */
let SUIT: Suit | null = null;
/** The suit's rig (see limbs.ts), once its model is loaded: for the suit's preview sheet's poses. */
export const suitRigData = (): RigData | null => SUIT;
let suitLoad: Promise<void> | null = null;
/**
 * Loads the suit's model (about 30 KB over the wire), once for every Urchi on the page. setSuit
 * loads it too, and the suit shows as soon as it is there; a host that must have it on the first
 * frame (a reveal on cue) awaits this first.
 */
export function preloadSuit(): Promise<void> {
  suitLoad ??= import("./suit.json").then(
    (m) => { SUIT = m.default as unknown as Suit; },
    (e) => { suitLoad = null; throw e; },   // a failed fetch can be tried again
  );
  return suitLoad;
}

// ------------------------------------------------------------------ the suit's rig
// Built the first time a suit is painted (nothing of it exists before), from suit.json, once for
// every painter on the page (the room's Urchi, or the sheet's on /dev/suit): the painter works
// a flat plane at a time, and each plane's outline (its loops of vertices, from the triangles that
// can be seen) is found once here, so a frame walks each plane's corners once. What a frame fills in
// is each painter's own (see suitRig in createUrchi).

/**
 * The suit's colours, per material: the flat shade of a plane runs from `dark` (turned from
 * the light) to `lit` (square on to it) on the head's own curve. The fabric tops out at the
 * site's ink, never white; its shadows are warm light greys. The backpack is a grey of its own,
 * a step darker than the fabric, so it reads as a separate box from behind. The visor's thin rim
 * is a white of its own, a shade brighter than the fabric in any light, so it reads as the frame
 * round the glass rather than more of the shell. The glass is not filled: it is the head behind a
 * smoked tint, with a soft sheen on the facets that face the light.
 */
const SUIT_COLOUR: Record<string, { dark: Vec3; lit: Vec3 }> = {
  fabric: { dark: [150, 145, 136], lit: [233, 233, 226] },
  pack: { dark: [112, 110, 104], lit: [198, 197, 190] },
  grey: { dark: [92, 92, 90], lit: [172, 171, 166] },
  dark: { dark: [34, 34, 37], lit: [88, 88, 92] },
  accent: { dark: [176, 104, 40], lit: [246, 172, 76] },
  glass: { dark: [0, 0, 0], lit: [0, 0, 0] },
  rim: { dark: [178, 178, 174], lit: [252, 252, 249] },
};
/**
 * How the suit builds itself (setSuit between 0 and 1): the body's facets switch on over the
 * first `helmet` of the way, a facet once the suit is past its turn over `over` (so the last is
 * on a little before the suit is whole); then the helmet rises over the head, whole, from the
 * collar to the crown, its top edge a level line with the rim along it (no facet of it ever
 * stands up alone, like an ear or a horn). The ears and spikes fold in over the `tuck` just
 * before it starts: never while any of it is there to be poked through.
 */
const SUIT_BUILD = { helmet: 0.5, over: 1.12, tuck: 0.16 };
/**
 * The body without the suit (UrchiDevOptions.bare): the suit's own figure with none of what makes
 * it a spacesuit (`gear`, by part name; the helmet goes too), every part of it in `skin`, the head's
 * own near-black (its planes run from #040404 to about #1C1C1C on the same curve).
 */
const BARE = {
  gear: /^(backpack|pack |chest panel|slot\.|button\.|light\.|connector\.|hose )/,
  skin: { dark: [4, 4, 4] as Vec3, lit: [28, 28, 28] as Vec3, under: "rgb(16,16,16)" },
};
/**
 * A part's planes, its vertices (first and count), its middle; `decal`: it lies on the shell, drawn
 * as a whole (1, a disc) or plane by plane (2, the rim); `convex`: its outline on screen is the hull
 * of its points.
 */
type SuitPart = { planes: Int32Array; v0: number; vn: number; mid: Vec3; decal: number; rigid: boolean; convex: boolean; material: number };
type SuitModel = {
  data: Suit;
  sv: Float64Array; rigid: Uint8Array;
  /** Per plane: its material, its part, its loops (loop0 .. loop0 + loops in loopAt) and its middle. */
  planeMat: Uint8Array; planePart: Int32Array; loop0: Int32Array; loops: Int32Array; planeMid: Float64Array;
  /** Per loop: where its corners start in `corner` and how many; per corner, the plane across the edge to the next corner (-1: none that is ever drawn). */
  loopAt: Int32Array; loopLen: Int32Array; corner: Int32Array; across: Int32Array;
  /** Per plane: when it switches on as the suit builds itself, 0..1 (see SUIT_BUILD; the helmet's rise is apart). */
  reveal: Float32Array;
  /** The helmet's middle, and per vertex of the rim (from its first) the smooth normal under it (see Suit). */
  hub: Vec3; rimN: Float64Array;
  parts: SuitPart[];
  /** The helmet's shell, glass and rim, its decals (the rim, the discs), and the body's parts. */
  shell: number; glass: number; rim: number; decals: number[]; body: number[];
  /** The planes between the body's parts that turn together: [a, b, nx, ny, nz, d] each, part a on the side n.p < d (at rest). */
  sep: Float64Array;
  /**
   * The rig: per vertex and per part the segment it turns in (0 the torso); per pair of parts (a
   * times the parts' count, plus b) the plane baked between them (its offset in `sep`), or -1, and
   * the joint the two meet at (see limbs.ts: its parent's and child's tubes, its ring and its
   * ball), or -1; and per part whether it is a joint's ball.
   */
  vseg: Uint8Array; partSeg: Int32Array; pairSep: Int32Array; pairJoint: Int32Array; ball: Uint8Array;
  /** Per part, the balls of the joints it is a tube of (either side): what goes before it goes before them too; per part, the joint it is the ball of (-1 none). */
  tubeBalls: number[][]; ballJoint: Int32Array;
  tucked: Vec3[];
  /** The head's planes with a tucked corner: once folded in, painted before the rest of the head, so they never cover an eye. */
  tuckPlanes: Set<number>;
  /** Per material, its shade from turned away to square on to the light, and its underlay (the middle shade). */
  mats: { dark: Vec3; lit: Vec3; under: string }[];
};
let modelOnce: SuitModel | null = null;
let modelBuild: Generator<void, SuitModel, void> | null = null;
/**
 * Builds the page's suit rig ahead of the first suited paint, a slice at a time: for about `budget`
 * ms, then it stops where it is, for the host to carry on in a moment of its own (Space does, in
 * idle time). True once it is built; false if not yet, or if the model is not here. With no
 * budget, all of it now.
 */
export function warmSuit(budget = Infinity): boolean {
  if (modelOnce) return true;
  if (!SUIT) return false;
  modelBuild ??= buildModel(SUIT);
  const end = performance.now() + budget;
  for (;;) {
    const r = modelBuild.next();
    if (r.done) {
      modelOnce = r.value;
      modelBuild = null;
      return true;
    }
    if (performance.now() >= end) return false;
  }
}
/**
 * `fn` in a moment of its own: an idle callback where the browser has them (within `wait` ms at
 * most), else a task soon after this frame. The suit's rig is built in such moments, `slice` ms of
 * it in each, so none of it holds up a frame.
 */
const IDLE = { wait: 250, fallback: 16, slice: 6 };
function whenIdle(fn: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => fn(), { timeout: IDLE.wait });
  else window.setTimeout(fn, IDLE.fallback);
}
let warming: Promise<void> | null = null;
/**
 * The suit's model loaded (preloadSuit) and its rig built in idle moments (see whenIdle), resolving
 * once both are done: a host that will paint the suit soon awaits this rather than preloadSuit, so
 * the frame that first shows it is not the one that pays for it.
 */
export function warmSuitIdle(): Promise<void> {
  warming ??= preloadSuit().then(
    () => new Promise<void>((done) => {
      const slice = () => whenIdle(() => (warmSuit(IDLE.slice) ? done() : slice()));
      slice();
    }),
    (e) => { warming = null; throw e; },   // no model: it may be tried again
  );
  return warming;
}
/** The page's suit rig, built now if it is not yet (the rest of it, if it was begun). */
function suitModel(): SuitModel {
  warmSuit();
  return modelOnce!;
}
/** How many planes' outlines a slice of the rig's build finds before it lets the host stop (see warmSuit). */
const MODEL_SLICE = 96;
function* buildModel(D: Suit): Generator<void, SuitModel, void> {
  const nv = D.v.length / 3, nf = D.f.length / 3, np = Math.max(...D.g) + 1;
  const sv = Float64Array.from(D.v), rigid = new Uint8Array(nv);
  for (let i = 0; i < nv; i++) rigid[i] = D.parts[D.vp[i]].rigid;
  const hidden = new Uint8Array(nf);
  for (const i of D.hidden) hidden[i] = 1;
  const planeMat = new Uint8Array(np), planePart = new Int32Array(np), planeMid = new Float64Array(np * 3);
  const facesOf: number[][] = Array.from({ length: np }, () => []);
  for (let i = 0; i < nf; i++) {
    const g = D.g[i], pi = D.vp[D.f[i * 3]];
    planePart[g] = pi; planeMat[g] = D.parts[pi].material;
    if (!hidden[i]) facesOf[g].push(i);
  }
  // each directed edge's face, to find the plane across a plane's outline
  const edgeFace = new Map<number, number>();
  const corner = (i: number, k: number) => D.f[i * 3 + (k % 3)];
  for (let i = 0; i < nf; i++) for (let k = 0; k < 3; k++) edgeFace.set(corner(i, k) * nv + corner(i, k + 1), i);
  const loop0 = new Int32Array(np), loops = new Int32Array(np), loopAt: number[] = [], loopLen: number[] = [], corners: number[] = [], across: number[] = [];
  yield;
  for (let g = 0; g < np; g++) {
    if (g % MODEL_SLICE === MODEL_SLICE - 1) yield;
    loop0[g] = loopAt.length;
    const fs = facesOf[g];
    if (!fs.length) continue;
    // the middle: the mean of its triangles' middles
    for (const i of fs) for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) planeMid[g * 3 + c] += sv[corner(i, k) * 3 + c] / (3 * fs.length);
    // its outline: the edges of its triangles that no other of them shares, chained into loops
    const own = new Set<number>(), next = new Map<number, number[]>();
    for (const i of fs) for (let k = 0; k < 3; k++) own.add(corner(i, k) * nv + corner(i, k + 1));
    for (const e of own) { const a = Math.floor(e / nv), b = e % nv; if (!own.has(b * nv + a)) (next.get(a) || next.set(a, []).get(a)!).push(b); }
    while (next.size) {
      const start = next.keys().next().value as number;
      loopAt.push(corners.length);
      let a = start, n = 0;
      do {
        const out = next.get(a)!, b = out.pop()!;
        if (!out.length) next.delete(a);
        corners.push(a);
        const f = edgeFace.get(b * nv + a);
        across.push(f === undefined || hidden[f] ? -1 : D.g[f]);
        a = b; n++;
      } while (a !== start && next.has(a));
      loopLen.push(n);
      loops[g]++;
    }
  }
  yield;
  const parts: SuitPart[] = D.parts.map((p) => ({ planes: new Int32Array(0), v0: nv, vn: 0, mid: [0, 0, 0], decal: p.decal, rigid: !!p.rigid, convex: !!p.convex, material: p.material }));
  const lists: number[][] = D.parts.map(() => []);
  for (let g = 0; g < np; g++) if (loops[g]) lists[planePart[g]].push(g);
  lists.forEach((l, pi) => { parts[pi].planes = Int32Array.from(l); });
  for (let i = 0; i < nv; i++) { const p = parts[D.vp[i]]; p.v0 = Math.min(p.v0, i); p.vn++; for (let k = 0; k < 3; k++) p.mid[k] += sv[i * 3 + k]; }
  for (const p of parts) for (let k = 0; k < 3; k++) p.mid[k] /= p.vn;
  const named = (n: string) => D.parts.findIndex((p) => p.name === n);
  const shell = named("helmet");
  // when each of the body's planes switches on: as the growth from the neck ring reaches it (see
  // Suit's grow, baked), the first at once; the helmet's all at once, as it starts to rise (see renderSuit)
  const grown = D.grow, reveal = new Float32Array(np);
  let near = Infinity, far = 0;
  for (let g = 0; g < np; g++) if (loops[g] && !D.parts[planePart[g]].rigid) { near = Math.min(near, grown[g]); far = Math.max(far, grown[g]); }
  for (let g = 0; g < np; g++) reveal[g] = D.parts[planePart[g]].rigid ? SUIT_BUILD.helmet : SUIT_BUILD.helmet * Math.max(0, (grown[g] - near) / (far - near || 1));
  const V = MESH.v, F = MESH.f, G = MESH.g;   // the head's, for its tucked vertices and the planes they touch
  const tucked = V.slice(), tuckPlanes = new Set<number>(), moved = new Set<number>();
  for (const [i, x, y, z] of D.tuck) { tucked[i] = [x, y, z]; moved.add(i); }
  F.forEach((f, fi) => { if (moved.has(f[0]) || moved.has(f[1]) || moved.has(f[2])) tuckPlanes.add(G[fi]); });
  // the rig: what turns with what, and how any two of the body's parts are ordered
  const np2 = D.parts.length, vseg = new Uint8Array(nv), partSeg = Int32Array.from(D.parts, (p) => p.seg), pairSep = new Int32Array(np2 * np2).fill(-1), pairJoint = new Int32Array(np2 * np2).fill(-1);
  for (let i = 0; i < nv; i++) vseg[i] = partSeg[D.vp[i]];
  D.sep.forEach(([a, b], k) => { pairSep[a * np2 + b] = pairSep[b * np2 + a] = k * 6; });
  const tubeBalls: number[][] = D.parts.map(() => []), ballJoint = new Int32Array(np2).fill(-1);
  D.joints.forEach((J, j) => {
    if (J.parts[3] >= 0) ballJoint[J.parts[3]] = j;
    const roles = J.parts.filter((p) => p >= 0);
    for (const a of roles) for (const b of roles) if (a !== b) pairJoint[a * np2 + b] = j;
    const [par, chi, , bal] = J.parts;
    if (bal >= 0) for (const t of [par, chi]) tubeBalls[t].push(bal);
  });
  return {
    vseg, partSeg, pairSep, pairJoint, ball: Uint8Array.from(D.parts, (p) => p.ball), tubeBalls, ballJoint,
    data: D, sv, rigid, planeMat, planePart, loop0, loops, planeMid,
    loopAt: Int32Array.from(loopAt), loopLen: Int32Array.from(loopLen), corner: Int32Array.from(corners), across: Int32Array.from(across),
    reveal, hub: D.hub, rimN: Float64Array.from(D.rimN), parts,
    shell, glass: named("visor"), rim: named("rim"),
    decals: D.parts.flatMap((p, i) => (p.rigid && p.decal ? [i] : [])),
    body: D.parts.flatMap((p, i) => (p.rigid ? [] : [i])),
    sep: Float64Array.from(D.sep.flat()), tucked, tuckPlanes,
    mats: D.materials.map((m) => {
      const { dark, lit } = SUIT_COLOUR[m];
      return { dark, lit, under: `rgb(${dark.map((c, k) => Math.round((c + lit[k]) / 2)).join(",")})` };
    }),
  };
}

/** The canvas's frame in mesh units (x right, y down): wider and taller than the box, so a tilted head fits. */
export const URCHI_FRAME = { x: -701.25, y: -674, w: 1402.5, h: 1230 } as const;
/** The frame with the suit on: the whole suited figure in any pose (and any turn), head's centre still at y 0 (baked beside the suit). */
export const URCHI_SUIT_FRAME: { readonly x: number; readonly y: number; readonly w: number; readonly h: number } = SUIT_FRAME;
/** The mascot's box, the standalone page's viewBox: what its width is measured by. */
export const URCHI_BOX = { x: -540, y: -500, w: 1080, h: 1056 } as const;
/** The head itself, from ear tips to chin. */
export const URCHI_HEAD = { top: -436, bottom: 435.5 } as const;
/** The ear tips at rest, the highest point of the head each side of its middle, in mesh units (x right, y down): the viewer's left, then right. */
export const URCHI_EARS: [[number, number], [number, number]] = (() => {
  const tip = (side: number): [number, number] => {
    let best: [number, number] = [0, Infinity];
    for (const v of MESH.v) if (v[0] * side > 0 && v[1] < best[1]) best = [v[0], v[1]];
    return best;
  };
  return [tip(-1), tip(1)];
})();
/** The head's pivot for a tilt, in mesh units (y down): low in the head, like a neck. */
export const URCHI_PIVOT: [number, number] = [MESH.pivot[0], MESH.pivot[1]];
/** The eye distance render() uses unless ?ortho asks for none. */
const PERSPECTIVE_AT_REST = 2800;

/**
 * The eyes as drawn at rest (facing front, open, in perspective), in mesh
 * units, x right and y down: where each centre lands, and how far from it the
 * eye reaches. A host that shows the eyes before the head (the Space intro)
 * lays things out around them with this.
 */
export const URCHI_EYES: { centres: [number, number][]; reach: number } = (() => {
  const eyes = MESH.eyes || [];
  const s = (z: number) => PERSPECTIVE_AT_REST / (PERSPECTIVE_AT_REST - z);
  let reach = 0;
  const centres = eyes.map(({ c: [cx, cy, cz], dzdx, dzdy }): [number, number] => {
    const x0 = cx * s(cz), y0 = cy * s(cz);
    for (let k = 0; k < 40; k++) {
      const t = (2 * Math.PI * k) / 40, x = cx + MESH.eye.rx * Math.cos(t), y = cy + MESH.eye.ry * Math.sin(t);
      const z = cz + dzdx * (x - cx) + dzdy * (y - cy);
      reach = Math.max(reach, Math.hypot(x * s(z) - x0, y * s(z) - y0));
    }
    return [x0, y0];
  });
  return { centres, reach };
})();

// ------------------------------------------------------------------ eye colours
// One colourway is drawn at random on every page load, weighted exactly as the LilGuy eyes
// trait sheet: 100 colourways in seven bands (weights 1, .8, .9, .7, .3, .5, .2; total 52.7).
// [name, weight, iris, pupil]  or, for the odd-eyed band, [name, weight, iris, pupil on the
// viewer's left, pupil on the viewer's right]. Only colours change: the eye and pupil shapes
// stay as they are. The iris colour fills the eye (and the closed-lid arc).
//   ?col=denim   force a colourway by name
type Colourway = [string, number, string, string] | [string, number, string, string, string];
const COLOURWAYS: Colourway[] = [
  // Base fourteen: weight 1.0
  ["marmalade", 1.0, "#F99F05", "#6E6123"],
  ["matcha", 1.0, "#C7FBA6", "#5E6E06"],
  ["houseplant", 1.0, "#039442", "#71FF6F"],
  ["terrarium", 1.0, "#6FF5D0", "#106E54"],
  ["whale", 1.0, "#0059A3", "#0095FF"],
  ["frog", 1.0, "#42DE86", "#436A16"],
  ["denim", 1.0, "#6C92F8", "#102A6E"],
  ["petunia", 1.0, "#F8AFFB", "#F006B4"],
  ["lipgloss", 1.0, "#A10180", "#FC609C"],
  ["jawbreaker", 1.0, "#F6759F", "#56031F"],
  ["cherry", 1.0, "#AE0002", "#FF5252"],
  ["pebble", 1.0, "#645252", "#A4A4A4"],
  ["valentine", 1.0, "#DD06CB", "#7B1612"],
  ["plum", 1.0, "#7260E6", "#622058"],
  // Pale-pupil five: weight 0.8
  ["gumball", 0.8, "#F20F07", "#FFFFFF"],
  ["sprinkler", 0.8, "#59BF05", "#FFFFFF"],
  ["pool", 0.8, "#05A8F9", "#FCEEEE"],
  ["moon", 0.8, "#4028FF", "#EBFFFC"],
  ["bubblegum", 0.8, "#F442E7", "#FFFFFF"],
  // Light-iris twelve: weight 0.9
  ["seaglass", 0.9, "#FBFBFB", "#167B61"],
  ["laser", 0.9, "#FFFFFF", "#FF0000"],
  ["snowball", 0.9, "#FFFFFF", "#5A79F3"],
  ["smoothie", 0.9, "#FFECE0", "#CE0959"],
  ["peach", 0.9, "#FDFBE2", "#F76E5D"],
  ["goldfish", 0.9, "#E0F4FB", "#DE9109"],
  ["seashell", 0.9, "#FCD9CF", "#070571"],
  ["hydrangea", 0.9, "#E1BFE1", "#2722DB"],
  ["cupcake", 0.9, "#F9FFB2", "#CA00CA"],
  ["limeade", 0.9, "#EAFCC5", "#09B6CE"],
  ["teacup", 0.9, "#F6E5A5", "#0D73F7"],
  ["candycane", 0.9, "#9CFBD5", "#790C05"],
  // Hard-black five: weight 0.7
  ["ladybug", 0.7, "#C3110E", "#000000"],
  ["avocado", 0.7, "#8BD67C", "#230606"],
  ["submarine", 0.7, "#0F7BA9", "#000000"],
  ["eggplant", 0.7, "#E202E8", "#0A0A0A"],
  ["og", 0.7, "#FFFFFF", "#000000"],
  // Neon thirty-seven: weight 0.3
  ["lobster", 0.3, "#F95320", "#044A5F"],
  ["pumpkin", 0.3, "#E87102", "#55FC6E"],
  ["beachball", 0.3, "#F6FD21", "#1C9DE3"],
  ["glowstick", 0.3, "#E9F905", "#360342"],
  ["cactus", 0.3, "#C4F41D", "#530AEC"],
  ["highlighter", 0.3, "#95F124", "#F50DCF"],
  ["kiwi", 0.3, "#55F927", "#9F7717"],
  ["flytrap", 0.3, "#15F817", "#5E045E"],
  ["junebug", 0.3, "#14DA70", "#3516AF"],
  ["sunset", 0.3, "#AE2400", "#F855FC"],
  ["robin", 0.3, "#15ABF8", "#5E2304"],
  ["jukebox", 0.3, "#024BDE", "#FB4CC3"],
  ["starboy", 0.3, "#7B43F5", "#F6BD49"],
  ["sonar", 0.3, "#126487", "#2EE605"],
  ["guava", 0.3, "#84FB8E", "#F64982"],
  ["blacklight", 0.3, "#6922F0", "#A3F410"],
  ["taffy", 0.3, "#F474DC", "#E8FCA6"],
  ["lilac", 0.3, "#7202FC", "#FDB0CE"],
  ["nightlight", 0.3, "#7768FE", "#55FC87"],
  ["crocus", 0.3, "#D602E8", "#FBF823"],
  ["rosebush", 0.3, "#1E6935", "#FC7AC0"],
  ["parakeet", 0.3, "#018335", "#23FAFB"],
  ["glowworm", 0.3, "#F40DF8", "#19F515"],
  ["spearmint", 0.3, "#9CFBCE", "#790572"],
  ["motel", 0.3, "#FA486F", "#92FABE"],
  ["buoy", 0.3, "#14ABD6", "#EEFA24"],
  ["slushie", 0.3, "#C206AD", "#49F6D9"],
  ["siren", 0.3, "#FD0C0D", "#2905E6"],
  ["ember", 0.3, "#994400", "#00EEFF"],
  ["jelly", 0.3, "#B60080", "#429EFB"],
  ["popsicle", 0.3, "#71FEAE", "#5598FC"],
  ["dragonfruit", 0.3, "#B60053", "#CFFA0F"],
  ["hibiscus", 0.3, "#B6003C", "#05E605"],
  ["jam", 0.3, "#C5013C", "#09CE93"],
  ["candle", 0.3, "#973849", "#F7FBBC"],
  ["calculator", 0.3, "#737373", "#09E151"],
  ["doorbell", 0.3, "#BEBEBE", "#E42D06"],
  // Muted thirteen: weight 0.5
  ["postcard", 0.5, "#BE6A6A", "#76D8EB"],
  ["flowerpot", 0.5, "#CC6262", "#3E4002"],
  ["juicebox", 0.5, "#F6826C", "#95059B"],
  ["mallard", 0.5, "#7B8401", "#0737A7"],
  ["tomato", 0.5, "#60A611", "#B4040F"],
  ["chamomile", 0.5, "#509156", "#F4C524"],
  ["peacock", 0.5, "#02B0B6", "#7923FB"],
  ["sandbox", 0.5, "#B8804A", "#F7F574"],
  ["kite", 0.5, "#7DB5F4", "#C10787"],
  ["puddle", 0.5, "#A7AFF6", "#837605"],
  ["moth", 0.5, "#EC75F6", "#564803"],
  ["strawberry", 0.5, "#FCB7F2", "#069A1E"],
  ["flamingo", 0.5, "#FCB7C3", "#068F9A"],
  // Odd-eyed fourteen: weight 0.2
  ["static", 0.2, "#666666", "#000000", "#FFFFFF"],
  ["eraser", 0.2, "#666666", "#FFEDED", "#000000"],
  ["pinball", 0.2, "#B60207", "#D2F9F9", "#60D105"],
  ["socks", 0.2, "#B865A8", "#76D8EB", "#8F1716"],
  ["koi", 0.2, "#FE6873", "#0A0A0A", "#D0F910"],
  ["marble", 0.2, "#D1D9FA", "#C11207", "#D20ADF"],
  ["stoplight", 0.2, "#34F7FD", "#038C03", "#F91024"],
  ["bumblebee", 0.2, "#FDCB21", "#0A0A0A", "#D10566"],
  ["lilypad", 0.2, "#D1F63B", "#10812B", "#0F91F4"],
  ["popcorn", 0.2, "#EAF66E", "#BB240A", "#0964E7"],
  ["spumoni", 0.2, "#F6EAB9", "#177E39", "#2722DB"],
  ["umbrella", 0.2, "#E7E3E9", "#F65F28", "#4F6BF8"],
  ["sherbet", 0.2, "#E4F4E2", "#4A0A99", "#DB8405"],
  ["neapolitan", 0.2, "#87493B", "#EB76DD", "#B7ABF3"],
];
/** Drawn (or forced) once per page load and shared by every Urchi on the site's pages from then on. */
let drawn: Colourway | null = null;
function colourwayFor(params: URLSearchParams): Colourway {
  const forced = COLOURWAYS.find((c) => c[0] === params.get("col"));
  if (forced) return (drawn = forced);
  if (drawn) return drawn;
  let r = Math.random() * COLOURWAYS.reduce((s, c) => s + c[1], 0);
  for (const c of COLOURWAYS) {
    r -= c[1];
    if (r < 0) return (drawn = c);
  }
  return (drawn = COLOURWAYS[COLOURWAYS.length - 1]);
}

/** This visit's colourway, as drawn (or forced with ?col=) by the first Urchi on the page; null before any Urchi exists. */
export function drawnColourway(): { name: string; iris: string; pupilLeft: string; pupilRight: string } | null {
  if (!drawn) return null;
  return { name: drawn[0], iris: drawn[2], pupilLeft: drawn[3], pupilRight: drawn[4] || drawn[3] };
}

export type UrchiOptions = {
  reducedMotion?: boolean;
  /**
   * Mesh units per canvas pixel: 7.5 (the default) paints the 187 x 164 head of the standalone page.
   * A coarser cell paints a smaller canvas whose rim is still exactly one pixel, for a small Urchi
   * (the About mark, the favicon) that must stay crisp instead of being minified.
   */
  cell?: number;
  /** false: no window listeners, so the gaze never follows the pointer (the favicon). Default true. */
  input?: boolean;
  /**
   * Paint without pixels: anti-aliased edges and a drawn rim, at a resolution the host sets with
   * setResolution (the box's width in canvas pixels). `cell` then only sets the starting size.
   */
  smooth?: boolean;
};

/** Knobs for the suit's preview sheet and its checks (/dev/suit): no Urchi of the site uses them. */
export type UrchiDevOptions = {
  /**
   * The leak check's layers: paint one layer of the suited figure alone, flat white, instead of
   * the figure: "head", the head as the suit shows it (through the visor); "helmet", the helmet's
   * silhouette (shell, visor, rim and discs); "tucked", the head with its ears and spikes tucked in
   * but not clipped; "eyes", the eyes alone; "glass", what of the visor the rim and discs leave to
   * be seen.
   */
  suitLayer?: "head" | "helmet" | "tucked" | "eyes" | "glass";
  /** The close-ups: "helmet" paints the suited figure's helmet alone, without the body. */
  suitPart?: "helmet";
  /**
   * The body without the suit (/dev/body): with the suit on, no helmet and none of the suit's gear,
   * the body in the head's own colour (see BARE), and the bare head, ears and spikes out, over it.
   */
  bare?: boolean;
  /**
   * The whole figure turned about its vertical axis, in degrees (90 shows its left side, 180 its
   * back): a view, not a look, so the head's own turn still comes on top. The sheet's 3/4, side and back views.
   */
  turn?: number;
};

export type UrchiCharacter = {
  /** The painted head, VBW / CELL by VBH / CELL pixels (187 x 164 at the default cell); transparent around the rim. */
  readonly canvas: HTMLCanvasElement;
  /**
   * One frame: steps the springs and repaints, unless nothing it draws has moved since the last
   * paint (the canvas already shows this frame). Returns whether it painted. dt in seconds.
   */
  update(dt: number): boolean;
  /** Eyes shut (the closed-lid arc) until openEyes. */
  closeEyes(): void;
  openEyes(seconds: number): void;
  /** A slow, deliberate blink, a cat's. `hold` keeps it shut longer (a long, patient blink). */
  slowBlink(hold?: number): void;
  /** A look away, head and pupils, for a moment. */
  glance(): void;
  /** One ordinary blink now (never a double); the next random one waits its usual gap after it. */
  blink(): void;
  /**
   * Look at a point instead of the pointer: nx, ny in the pointer's space (the viewport, x right,
   * y down, each -1..1). The pupils go at once and, when the look moves far, the head follows
   * about 80ms later on its usual springs (`how` can make it snap there or turn quickly); the
   * pupils settle toward it with small flicks. Attended, the eyes stay ahead of a head still on
   * its way (EYES_FIRST), and a small turn is quick and a big one slow (TURN_SPEED). lookAt(null)
   * hands the gaze back to the pointer (or straight ahead without one). Reduced motion keeps the
   * head front.
   */
  lookAt(nx: number | null, ny?: number, how?: LookHow): void;
  /**
   * One deep breath: over `inhale` seconds the breath rises from wherever it is to the top of an
   * in-breath `depth` times the usual, then breathes out over `exhale` seconds (a nod of `depth`
   * times 3.15 degrees), and the ordinary loop carries on from the bottom, settling back to its
   * usual depth over about a second.
   */
  deepBreath(inhale: number, exhale: number, depth: number): void;
  /**
   * How much of Urchi is painted, 0..1 (1, the default, is all of it and costs nothing extra).
   * 0 paints the eyes alone, as they would show on the head, on nothing. Between, the head's art
   * pixels switch on in order of their distance from the nearer eye centre, and once the head is
   * whole the white rim switches on in the same order. The curious tilt holds off until it is 1.
   */
  setReveal(r: number): void;
  /** Whether canvas coordinates (u, v in 0..1, v up) fall on the head or its rim. */
  alphaAt(u: number, v: number): boolean;
  /**
   * The canvas's resolution: the mascot's box (URCHI_BOX, 1080 units) this many canvas pixels
   * across. A new size resizes the canvas (hosts showing it as a texture make a new one), and the
   * next update paints it. A smooth Urchi's host keeps this at the size it is shown, in device pixels.
   */
  setResolution(boxPx: number): void;
  /**
   * A smooth rim's width in mesh units, as the host wants it (Space holds it between 2 and 3.5
   * screen px); null is one art pixel, 7.5 units. Never under a canvas pixel and a quarter.
   */
  setRim(units: number | null): void;
  /**
   * The spacesuit, 0 (off: exactly the bare head, as ever) .. 1 (on). On, the canvas covers
   * URCHI_SUIT_FRAME instead of URCHI_FRAME (a host showing it as a texture makes a new one), the
   * head shows only through the visor and alphaAt hits the suited figure. Between, the suit
   * builds itself: first the body, facet by facet outward from the neck ring (the intro's
   * reveal, from the neck instead of the eyes), while the ears and spikes fold in; then the
   * helmet rises, whole, from the collar to the crown, over a head with nothing left to poke
   * through it. The bare head shows under what is not yet there. The first time, the
   * suit's model is loaded (see preloadSuit): until it is there the head paints as if the suit
   * were off, and the frame follows once it is.
   */
  setSuit(amount: number): void;
  /** The suit as set, 0..1 (whether or not its model has arrived). */
  readonly suit: number;
  /**
   * The limbs in the suit (see limbs.ts): null until the suit's model is here. They stay as modelled
   * (arms hanging) until asked for more: zero gravity's posture and its quirks (setMode "float",
   * setLife), a quirk now (play), the body's motion felt (feel). They move only while the suit is on.
   */
  readonly limbs: Limbs | null;
  /** The canvas's frame in mesh units: URCHI_FRAME, or URCHI_SUIT_FRAME while the suit is painted. */
  readonly frame: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

  // ---- attention hooks (Space's attention system drives these; all inert until called)
  /**
   * Something is paying attention for it. Under reduced motion the head still stays front and
   * the breath still, but blinks run and the pupils jump (without easing) to what it looks at,
   * so it still notices things instead of being a picture.
   */
  attend(): void;
  /**
   * The pupils alone, in their own reach (-1..1 each way, a little wider than the darts), while
   * the head keeps to lookAt: reading a line, finding you through one opened eye. null lets them
   * follow the gaze again.
   */
  eyesTo(ex: number | null, ey?: number): void;
  /** Fixed on something: the darts shrink to small flicks, further apart. Interest reads as stillness. */
  fixate(on: boolean): void;
  /** How the pupils move between looks: dart (the default), drift (slow, listening) or still (asleep). */
  setDarts(mode: "dart" | "drift" | "still"): void;
  /** Pupils toward the nose, 0..1: gently cross-eyed at something close. */
  converge(amount: number): void;
  /** The eyes open wider by `amount` (0.06 is 6%) for `seconds`, then settle. */
  widen(amount: number, seconds: number): void;
  /** A quick dip of the pupils' height and back: the small flinch of being woken. */
  dip(): void;
  /** The breath holds where it is for `seconds`: a freeze. */
  pauseBreath(seconds: number): void;
  /** Seconds per breath (4.29 by default); eases there over a couple of breaths. */
  setBreathPeriod(seconds: number): void;
  /** The breath's depth, 1 by default: 1.4 is a sleeper's deeper nod. */
  setBreathDepth(depth: number): void;
  /**
   * The gap between ordinary blinks, in seconds: log-normal, the middle half of the gaps between
   * `min` and `max` (2.5..6 by default), so now and then a pair comes close and now and then a
   * long look goes without one.
   */
  setBlinkGap(min: number, max: number): void;
  /** How long an ordinary blink stays shut (0.15s by default); longer as it gets sleepy. */
  setBlinkHold(seconds: number): void;
  /** A resting lid over both eyes, 0 (open) .. 0.5: drowsiness. Eases there. */
  setRestLid(v: number): void;
  /** Each eye's own lid, 0 open .. 1 shut (the closed arc), eased over `seconds`: one eye can open alone. */
  setLids(left: number, right: number, seconds?: number): void;
  /**
   * The curious tilt, now, toward a side (-1 left, 1 right), at its usual angle or `degrees`.
   * It is cued, so it happens even with the random tilts off (listening): then it holds a moment
   * and the head comes level again.
   */
  tiltToward(dir: number, degrees?: number): void;
  /** The random curious tilts: `[min, max]` seconds apart (4..9 by default), or null for none (it straightens). */
  setTilts(gap: [number, number] | null): void;
  /** A slow sway of the head, roll ±`degrees` on a `period`, eased in and out; 0 stops it. */
  sway(degrees: number, period?: number): void;
  /**
   * An owl's bob: the head side to side three times, about ±3 degrees at 2Hz, judging a distance.
   * It holds off the random tilts while it runs, and is refused (false) while a tilt is still swinging.
   */
  bob(): boolean;
  /** Woken properly: a slow stretch upward, the face tipping up about 9.5 degrees and the head rising, and back, over 1.2s. */
  stretch(): void;
  /** Hold the head off its aim by these angles in degrees (a sleeper's dip, a nod, a wind-up), on a spring of `speed`. */
  pose(yaw: number, pitch: number, roll: number, speed?: number): void;
  /** A small jolt to the pose's springs, in degrees per second: a startle's kick. */
  kick(yaw: number, pitch: number, roll: number): void;
  /** Two blinks, close together. */
  doubleBlink(): void;
  /**
   * The face its eyes make (see UrchiFace). A new one swaps in while the eyes are shut in a blink
   * of its own (into a face whose eyes are shut already, embarrassed or happy, that is the eyes
   * squeezing shut into it); at once with the eyes already shut, or under reduced motion.
   */
  setFace(face: UrchiFace): void;
  /** The face it makes, or is blinking into. */
  readonly face: UrchiFace;
  /** The breath now, -1 .. 1: +1 is the top of an in-breath. */
  readonly breath: number;
  /** How shut the eyes are right now, 0 .. 1 (the more shut of the two). */
  readonly shut: number;
  dispose(): void;
};

/**
 * The faces its eyes make: its own (neutral); angry, the lids down at a slant toward the nose and a
 * dark pupil grown; embarrassed, a chevron each, "><"; happy, shut and arched up (listening).
 */
export type UrchiFace = "neutral" | "angry" | "embarrassed" | "happy";

/** How the gaze turns when lookAt moves it: "snap" is already there; "quick" turns faster than usual. */
export type LookHow = "snap" | "quick";

export function createUrchi(o: UrchiOptions = {}, dev: UrchiDevOptions = {}): UrchiCharacter {
  const D2R = Math.PI / 180;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  // Local debug knobs (ignored when there is no query string):
  //   ?still            freeze breathing and the cursor follow (stable screenshots)
  //   ?look=0.6,-0.3    fix the gaze target (x right, y down, each -1..1)
  //   ?yaw=90&pitch=0   fix the head's angles in degrees (90 = right side view)
  //   ?ortho            no perspective (for comparing against the reference views)
  //   ?blink=0.5        fix how far the eyes are shut (0 open .. 1 closed)
  //   ?roll=12          fix the head tilt in degrees (positive tips the top to the right)
  const params = new URLSearchParams(location.search);
  const STILL = params.has("still");
  const reduceMotion = STILL || !!o.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (STILL) document.documentElement.dataset.still = "";

  const colourway = colourwayFor(params);
  const EYE_COLOUR = { iris: colourway[2], pupilLeft: colourway[3], pupilRight: colourway[4] || colourway[3] };
  document.documentElement.dataset.eyes = colourway[0];

  // ------------------------------------------------------------------ mesh
  const V = MESH.v, F = MESH.f, G = MESH.g;   // triangles, and the drawn plane each belongs to
  /** The head's vertices as painted: the mesh's own, or with the suit on its ears and spikes tucked in. */
  let HV: Vec3[] = V;
  const GN = new Float64Array((Math.max(...G) + 1) * 3), tarea = new Float64Array(F.length);
  const EYES = MESH.eyes || [];
  // canvas in the SVG's coordinates, one pixel per CELL units; it covers x -701.25..701.25 and
  // y -674..556, wider and taller than the SVG's viewBox so a tilted head never gets cut off
  let VBX: number = URCHI_FRAME.x, VBY: number = URCHI_FRAME.y, VBW: number = URCHI_FRAME.w, VBH: number = URCHI_FRAME.h;
  let CELL = o.cell && o.cell > 0 ? o.cell : 7.5;
  const SMOOTH = !!o.smooth;
  const canvas = document.createElement("canvas");
  // The pixel pass reads the frame back every time; a smooth frame is never read, so it can stay on the GPU.
  const ctx = (SMOOTH ? canvas.getContext("2d") : canvas.getContext("2d", { willReadFrequently: true }))!;
  canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
  const COLOR = { base: "#040404" };
  const BASE = 1.5;   // dark base grown beyond the silhouette (units), so joins between planes show dark
  let rimMask = new Uint8Array(canvas.width * canvas.height);
  /** The last frame's pixels, for alphaAt. */
  let lastPx: Uint8ClampedArray | null = null;
  /** A smooth frame's silhouette and its canvas transform, for alphaAt. */
  let lastHead: Path2D | null = null;
  let lastToCanvas: CanvasTransform6 | null = null;
  /** The host's rim, in mesh units (setRim); null for one art pixel. */
  let rim: number | null = null;
  /** A smooth rim's width in mesh units: one art pixel (7.5) or the host's, and never under a canvas pixel and a quarter. */
  const rimWidth = () => Math.max(rim ?? 7.5, 1.25 * CELL);

  // ------------------------------------------------------------------ look
  // the cursor at a screen edge turns the head about 41 degrees (up/down 17.5 / 15)
  const LOOK = { yaw: 41.25 * D2R, pitchUp: 17.5 * D2R, pitchDown: 15 * D2R };
  const LIGHT = (() => { const l = [0.18, 0.88, 0.44], n = Math.hypot(...l); return l.map(v => v / n); })();   // view space: x right, y up, z toward viewer
  const FORCED_ROLL = params.has("roll") ? (Number(params.get("roll")) || 0) * D2R : null;
  const FORCED_BLINK = params.has("blink") ? Math.min(1, Math.max(0, Number(params.get("blink")) || 0)) : null;
  const PERSPECTIVE = params.has("ortho") ? Infinity : PERSPECTIVE_AT_REST;                             // eye distance in mesh units
  const PIVOT_Y = MESH.pivot[1];                                                                        // turn about the middle of the head
  const FORCED = params.has("yaw") || params.has("pitch") ? [Number(params.get("yaw")) || 0, Number(params.get("pitch")) || 0].map(v => v * D2R) : null;
  type Spring = { v: number; vel: number; target: number };
  const spring = (v = 0): Spring => ({ v, vel: 0, target: v });
  const S = { yaw: spring(), pitch: spring(), pointer: { nx: 0, ny: 0, has: false }, t: 0, lastMove: -99 };
  if (params.get("look")) {
    const [nx, ny] = params.get("look")!.split(",").map(Number);
    Object.assign(S.pointer, { nx: clamp(nx || 0, -1, 1), ny: clamp(ny || 0, -1, 1), has: true });
  }
  function stepSpring(s: Spring, dt: number, omega = 9, zeta = 0.8) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) { const acc = -omega * omega * (s.v - s.target) - 2 * zeta * omega * s.vel; s.vel += acc * h; s.v += s.vel * h; }
  }

  // ------------------------------------------------------------------ input
  const P = S.pointer;
  const listeners: [string, EventListener, AddEventListenerOptions | undefined][] = [];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    window.addEventListener(type, fn as EventListener, opts);
    listeners.push([type, fn as EventListener, opts]);
  };
  function pointerAt(e: PointerEvent) {
    P.nx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1);
    P.ny = clamp(e.clientY / innerHeight * 2 - 1, -1, 1);
    P.has = true; S.lastMove = S.t;
  }
  let release = 0;
  if (!reduceMotion && o.input !== false) {
    on("pointermove", pointerAt, { passive: true });
    on("pointerdown", pointerAt, { passive: true });
    // a touch has no hover: hold the gaze where the finger was for a moment, then drift back
    on("pointerdown", () => clearTimeout(release));
    on("pointerup", e => { if (e.pointerType === "touch") release = window.setTimeout(() => { P.has = false; }, 1400); });
    on("pointerout", e => { if (!e.relatedTarget && e.pointerType !== "touch") P.has = false; });
    on("blur", () => { P.has = false; });
  }

  // ------------------------------------------------------------------ breathing
  // A slow loop: the head tips up as it rises and down as it settles, like a gentle nod.
  // The loop is a phase that advances with time, times a depth, so a scripted breath (the
  // intro's first) can take it over and hand it back without a jump.
  const BREATH = { period: 4.29, nod: 3.15 * D2R, rise: 5.25, settle: 0.8 };   // seconds per breath, nod amplitude, rise in SVG units (~1.75px), seconds to settle after a deep one
  type DeepBreath = { start: number; inhale: number; exhale: number; depth: number; from: number };
  // `period` eases toward `toPeriod` and `depth` settles toward `base`, so the attention hooks can
  // slow it (drowsy, asleep, the bed playing) without a jump; `hold` pauses it (a freeze).
  const breath = { phase: 0, depth: 1, base: 1, w: 0, period: BREATH.period, toPeriod: BREATH.period, hold: -1, deep: null as DeepBreath | null };
  let rise = 0;
  function breathe(dt: number) {
    let w = 0;   // +depth at the top of the in-breath
    const deep = breath.deep;
    breath.period += (breath.toPeriod - breath.period) * (1 - Math.exp(-dt / 2));
    if (reduceMotion || FORCED) {
      w = 0;
    } else if (deep && S.t - deep.start < deep.inhale + deep.exhale) {
      const e = S.t - deep.start;
      if (e < deep.inhale) { const u = e / deep.inhale; w = deep.from + (deep.depth - deep.from) * u * u * (3 - 2 * u); }
      else { breath.phase = Math.PI / 2 + Math.PI * (e - deep.inhale) / deep.exhale; w = Math.sin(breath.phase) * deep.depth; }
    } else if (S.t < breath.hold) {
      w = breath.w;   // frozen mid-breath
    } else {
      if (deep) { breath.deep = null; breath.phase = 1.5 * Math.PI; breath.depth = deep.depth; }   // on from the bottom of the out-breath
      breath.phase = (breath.phase + 2 * Math.PI * dt / breath.period) % (2 * Math.PI);
      breath.depth += (breath.base - breath.depth) * (1 - Math.exp(-dt / BREATH.settle));
      w = Math.sin(breath.phase) * breath.depth;
    }
    breath.w = w;
    rise = -BREATH.rise * w;
    return -BREATH.nod * w;   // negative pitch tips the face up
  }

  // ------------------------------------------------------------------ curious head tilt
  // A random sequence of head moves, usually 4-9s apart (about one in ten comes sooner, after
  // 1.5-2.5s, so there is no steady beat; after straightening it may rest up to 10s).
  //   from level:  tilt to a random side, but never more than two tilts in a row to one side
  //   from a tilt: straighten (35%), swing across to the other side (30%), or re-settle on the
  //                same side at a new angle (35%, never twice in a row)
  // Each move picks its own angle (usually 6-15 degrees, about one in four a small 3-6), its
  // own pace (slow lean to quick perk), a slight turn toward that side and a small look up or
  // down. The tilt pivots low in the head, like a neck, through a soft spring.
  const TILT = { pivot: 250, maxSameSide: 2 };
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  // `at`: when the last move began (the owl's bob waits for a tilt to finish swinging)
  const tilt = { roll: spring(), yaw: spring(), pitch: spring(), speed: 5.5, side: 0, lastSide: 0, streak: 0, next: rand(2, 5), resettled: false, at: -99 };
  /** The gap between moves (the attention hooks can stretch it, or stop the tilts: `on` false). */
  const tilts = { on: true, min: 4, max: 9 };
  /** With the random tilts off, how long a cued tilt holds before the head comes level. */
  const CUED_HOLD: Vec2 = [1.3, 1.8];
  let cuedUntil = -1;
  function level() {
    tilt.side = 0; tilt.roll.target = 0; tilt.yaw.target = 0; tilt.pitch.target = 0;
  }
  function tiltTo(dir: number, degrees?: number) {
    const small = Math.random() < 0.25;
    tilt.roll.target = dir * (degrees ?? rand(small ? 3 : 6, small ? 6 : 15)) * D2R;
    tilt.yaw.target = dir * rand(1, 5) * D2R;
    tilt.pitch.target = rand(-3, 2) * D2R;   // mostly a slight look up, sometimes down
    tilt.side = dir;
  }
  function newTilt(dir: number) {                     // a fresh tilt to a side: counts toward the same-side limit
    if (dir === tilt.lastSide && tilt.streak >= TILT.maxSameSide) dir = -dir;
    tilt.streak = dir === tilt.lastSide ? tilt.streak + 1 : 1;
    tilt.lastSide = dir;
    tiltTo(dir);
  }
  function stepTilt(t: number, dt: number) {
    if (reveal < 1) {                                  // a head not yet drawn holds level, so the eyes stay where the host put them
      level();
      tilt.next = Math.max(tilt.next, t + rand(2, 4));
    } else if (!tilts.on) {                            // no random tilts: level, once a cued one has had its moment
      if (t >= cuedUntil) { level(); tilt.next = Math.max(tilt.next, t + rand(2, 4)); }
    } else if (t >= tilt.next) {
      let rest = false;
      const wasResettled = tilt.resettled; tilt.resettled = false;
      if (tilt.side === 0) newTilt(Math.random() < 0.5 ? 1 : -1);
      else {
        const r = Math.random();
        if (r < 0.35) { tilt.side = 0; tilt.roll.target = 0; tilt.yaw.target = 0; tilt.pitch.target = 0; rest = true; }
        else if (r < 0.65 || wasResettled) newTilt(-tilt.side);
        else { tiltTo(tilt.side); tilt.resettled = true; }   // same side, new angle (once in a row): not a new tilt
      }
      tilt.speed = rand(3.5, 8);                // this move's pace: slow lean .. quick perk
      tilt.at = t;
      const sooner = tilts.min <= 4 && Math.random() < 0.1;   // no early ones when the tilts are spaced out (drowsy)
      tilt.next = t + (sooner ? rand(1.5, 2.5) : rand(tilts.min, rest ? tilts.max + 1 : tilts.max));
    }
    stepSpring(tilt.roll, dt, tilt.speed, 0.62); stepSpring(tilt.yaw, dt, tilt.speed, 0.7); stepSpring(tilt.pitch, dt, tilt.speed, 0.7);
  }

  // ------------------------------------------------------------------ pupil movement
  // The pupils move as a pair, separately from the eye whites: small, smooth darts up, down,
  // left and right, and now and then a quick dip to 95% height and back. A new change comes
  // every 0.2-0.8s (with the dips' returns, 2.5 changes a second on average); each eases into place over about 0.2s.
  // With a gaze target (lookAt) the darts centre on it and shrink to small flicks.
  // The attention hooks: fixed on something, the flicks shrink to ±2 every 0.6-1.4s; drifting
  // (listening), the pupils wander slowly every 1.2-2.4s; still (asleep), they stay put. eyesTo
  // steers the pupils alone, over a slightly wider reach, with quicker jumps (reading).
  const GAZE = { minGap: 0.2, maxGap: 0.8, x: 10, y: 9, dip: 0.95, dipChance: 0.25, dipHold: [0.25, 0.45] as Vec2, flick: 3 };
  const FIX = { flick: 2, gap: [0.6, 1.4] as Vec2 };
  const DRIFT = { gap: [1.2, 2.4] as Vec2, omega: 6 };
  const EYES_REACH = { x: 20, y: 16, omega: 34 };
  /**
   * Eyes first (attended looks): while the head is still turning, the pupils are further round than
   * they rest, by `lead` of the turn still to go, up to their own reach (EYES_REACH), and they come
   * back as the head arrives, as eyes do when the head catches up with them.
   */
  const EYES_FIRST = { lead: 0.8 };
  /** Pupils toward the nose at full convergence, in mesh units. */
  const CONVERGE = 16;
  const gaze = { x: spring(), y: spring(), h: spring(1), conv: spring(), next: 0.5, undip: -1, fixed: false, darts: "dart" as "dart" | "drift" | "still", instant: false };
  // the target, this moment's flick about it, and where the head aims (it follows the pupils after a lead)
  const look = { on: false, nx: 0, ny: 0, fx: 0, fy: 0, hx: 0, hy: 0, headAt: -1, quick: -1 };
  const eyes = { on: false, x: 0, y: 0 };
  function stepGaze(t: number, dt: number) {
    if (gaze.undip >= 0 && t >= gaze.undip) { gaze.h.target = 1; gaze.undip = -1; }
    if (t >= gaze.next) {
      const drift = gaze.darts === "drift";
      if (gaze.darts === "still" || eyes.on) {
        look.fx = look.fy = 0;
      } else if (!gaze.fixed && !drift && Math.random() < GAZE.dipChance && gaze.undip < 0) {
        gaze.h.target = GAZE.dip; gaze.undip = t + rand(...GAZE.dipHold);
      } else if (look.on) {
        const f = gaze.fixed ? FIX.flick : GAZE.flick;
        look.fx = rand(-f, f); look.fy = rand(-f, f);
      } else {
        const k = drift ? 0.6 : 1;
        gaze.x.target = rand(-GAZE.x, GAZE.x) * k;
        gaze.y.target = rand(-GAZE.y, GAZE.y) * k;
      }
      gaze.next = t + (gaze.fixed ? rand(...FIX.gap) : drift ? rand(...DRIFT.gap) : rand(GAZE.minGap, GAZE.maxGap));
    }
    if (selfAim) {   // its own hand, held up to be looked at
      gaze.x.target = clamp(selfAim[0] * GAZE.x + look.fx * 0.5, -GAZE.x, GAZE.x);
      gaze.y.target = clamp(selfAim[1] * GAZE.y + look.fy * 0.5, -GAZE.y, GAZE.y);
    } else if (eyes.on) {
      gaze.x.target = eyes.x * EYES_REACH.x; gaze.y.target = eyes.y * EYES_REACH.y;
    } else if (look.on) {   // kept on the target as it moves, and ahead of a head still turning there
      const [ax, ay] = attended && !reduceMotion ? eyesAhead() : [0, 0];
      gaze.x.target = clamp(clamp(look.nx * GAZE.x + look.fx, -GAZE.x, GAZE.x) + ax, -EYES_REACH.x, EYES_REACH.x);
      gaze.y.target = clamp(clamp(look.ny * GAZE.y + look.fy, -GAZE.y, GAZE.y) + ay, -EYES_REACH.y, EYES_REACH.y);
    } else if (gaze.darts === "still") {
      gaze.x.target = gaze.y.target = 0;
    }
    if (t < away.eyesUntil) { gaze.x.target = away.eyes * GAZE.x; gaze.y.target = 0; }   // the glance's pupils, whatever the gaze
    if (gaze.instant) {   // reduced motion, attended: jumps without easing
      gaze.x.v = gaze.x.target; gaze.y.v = gaze.y.target; gaze.h.v = 1; gaze.conv.v = gaze.conv.target;
      return;
    }
    const w = eyes.on ? EYES_REACH.omega : gaze.darts === "drift" ? DRIFT.omega : 22;
    stepSpring(gaze.x, dt, w, 0.9); stepSpring(gaze.y, dt, w, 0.9); stepSpring(gaze.h, dt, 22, 0.9); stepSpring(gaze.conv, dt, 6, 0.9);
  }
  /** How much further round the pupils are than they rest (mesh units), for the turn the head has still to make to the look (see EYES_FIRST). */
  function eyesAhead(): Vec2 {
    const [yaw, pitch] = headAim(look.nx, look.ny);
    return [EYES_FIRST.lead * ((yaw - S.yaw.v) / LOOK.yaw) * GAZE.x, EYES_FIRST.lead * (lookOfPitch(pitch) - lookOfPitch(S.pitch.v)) * GAZE.y];
  }

  // ------------------------------------------------------------------ eyes + blink
  // Open: an oval ring with an oval pupil hole (pupil nudged toward the nose). Blinking: the
  // ring squashes shut from the top toward a pivot low in the eye, then snaps to the closed
  // look, a thin arc curving down like a relaxed lid, and reopens the same way.
  const EYE = MESH.eye, STEPS = 40, ARC = 24;
  let blinkAmount = 0;   // 0 open .. 1 shut
  /** How wide the eyes are (1 as drawn): the startle's widening. */
  const wide = spring(1);
  let wideUntil = -1;

  // ------------------------------------------------------------------ faces
  // Angry: the lid's edge at `lift` of the eye's height above its centre (below it, negative),
  // slanting down toward the nose by `slope` (mesh units per unit across), and the pupil `pupil`
  // times as big, but only where it is the darker of the two: a light pupil is what reads as the
  // eye, and grown it would look bigger, not narrower. Embarrassed: a chevron each, `wide` of the
  // eye's width either side of its middle and `high` of its height, pointing in toward the nose,
  // moved `closer` to it (mesh units), its arms `arm` thick. Happy: the closed arc turned over,
  // `rise` of the eye's height up, `top` and `bottom` its edges' arch.
  const FACE = {
    angry: { lift: -0.1, slope: 0.42, pupil: 1.35 },
    shy: { wide: 0.85, high: 0.62, closer: 30, arm: 27 },
    happy: { rise: 0.1, top: 0.26, bottom: 0.48 },
  };
  const FACES: UrchiFace[] = ["neutral", "angry", "embarrassed", "happy"];
  /** The face it makes, and the one it swaps to once its eyes are shut (see setFace). */
  const faces = { now: "neutral" as UrchiFace, next: null as UrchiFace | null };
  const luma = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
  /** Each eye's pupil (the viewer's left, then right) is the darker of its two colours. */
  const pupilDark = [luma(EYE_COLOUR.pupilLeft) <= luma(EYE_COLOUR.iris), luma(EYE_COLOUR.pupilRight) <= luma(EYE_COLOUR.iris)];
  const oval = (x: number, y: number, rx: number, ry: number) => Array.from({ length: STEPS }, (_, k): Vec2 => { const t = 2 * Math.PI * k / STEPS; return [x + rx * Math.cos(t), y + ry * Math.sin(t)]; });
  /** A ring kept below a line (y down): `line` is the edge's y at x. */
  function below(ring: Vec2[], line: (x: number) => number): Vec2[] {
    const out: Vec2[] = [];
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length], fp = p[1] - line(p[0]), fq = q[1] - line(q[0]);
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }

  /**
   * An eye's shape with a blink `b` over it, in the face it makes. Angry shuts as its own eye does
   * (the same closed arc); embarrassed and happy are shut already, so a blink changes nothing: its
   * eyes squeeze shut into them, and open again out of them (see setFace).
   */
  function eyeShape(e: EyeSpec, b: number): { white: Vec2[]; pupil: Vec2[] | null } {
    const f = faces.now;
    if (f === "neutral") return ownEye(e, b);
    const [cx, cy] = e.c, side = cx > 0 ? 1 : -1;
    if (f === "angry") {
      const base = ownEye(e, b);
      if (!base.pupil) return base;
      // its lid's edge squashes shut toward the same pivot as the eye does
      const pivot = cy + 0.3 * EYE.ry, open = 1 - b, squash = (y: number) => pivot + (y - pivot) * open;
      const A = FACE.angry, big = pupilDark[cx < 0 ? 0 : 1] ? A.pupil : 1, pin = EYE.pin / big;
      return {
        white: below(base.white, (x) => squash(cy - A.lift * EYE.ry - A.slope * (x - cx) * side)),
        pupil: oval(cx - side * (pin + CONVERGE * gaze.conv.v) + gaze.x.v, cy + gaze.y.v, EYE.prx * big, EYE.pry * big * gaze.h.v),
      };
    }
    if (f === "embarrassed") {
      const shy = FACE.shy, dir = -side, h = shy.high * EYE.ry, len = shy.wide * EYE.rx, mx = cx - side * shy.closer;
      const bx = mx - dir * len, tx = mx + dir * len, arm = Math.hypot(2 * len, h), s = (shy.arm * arm) / h, s2 = (shy.arm * arm) / (2 * len);
      return { white: [[bx, cy - h], [tx, cy], [bx, cy + h], [bx, cy + h - s2], [tx - dir * s, cy], [bx, cy - h + s2]], pupil: null };
    }
    // happy: shut, arched up
    const H = FACE.happy, y0 = cy + H.rise * EYE.ry, x0 = cx - 1.02 * EYE.rx, w = 2.04 * EYE.rx, top = H.top * EYE.ry, bottom = H.bottom * EYE.ry;
    const upper = Array.from({ length: ARC + 1 }, (_, k): Vec2 => { const t = k / ARC; return [x0 + t * w, y0 - 4 * bottom * t * (1 - t)]; });
    const lower = Array.from({ length: ARC - 1 }, (_, k): Vec2 => { const t = 1 - (k + 1) / ARC; return [x0 + t * w, y0 - 4 * top * t * (1 - t)]; });
    return { white: [...upper, ...lower], pupil: null };
  }
  /** Its own eye (neutral): open, squashing shut with the blink, or the closed arc. */
  function ownEye(e: EyeSpec, b: number): { white: Vec2[]; pupil: Vec2[] | null } {
    const [cx, cy] = e.c, side = cx > 0 ? 1 : -1;
    const open = 1 - b;
    const ellipse = (x: number, y: number, rx: number, ry: number) => Array.from({ length: STEPS }, (_, k): Vec2 => { const t = 2 * Math.PI * k / STEPS; return [x + rx * Math.cos(t), y + ry * Math.sin(t)]; });
    // the pupil is its own layer: blinking never changes it (the lid just covers it); only the
    // pupil movement below moves it and briefly shortens it (and converging draws each toward the nose)
    const pupil = ellipse(cx - side * (EYE.pin + CONVERGE * gaze.conv.v) + gaze.x.v, cy + gaze.y.v, EYE.prx, EYE.pry * gaze.h.v);   // same offset for both: they move as a pair
    if (open > 0.22) {
      // the white opening: the eye outline squashed from the top toward a pivot low in the eye
      const pivot = cy + 0.3 * EYE.ry, w = wide.v;
      const white = ellipse(cx, cy, EYE.rx * w, EYE.ry * w).map(([x, y]): Vec2 => [x, pivot + (y - pivot) * open]);
      return { white, pupil };
    }
    // closed: tapered crescent, ends level, sagging down in the middle; no pupil
    const y0 = cy + 0.16 * EYE.ry, x0 = cx - 1.02 * EYE.rx, w = 2.04 * EYE.rx, top = 0.2 * EYE.ry, bottom = top + 0.2 * EYE.ry;
    const upper = Array.from({ length: ARC + 1 }, (_, k): Vec2 => { const t = k / ARC; return [x0 + t * w, y0 + 4 * top * t * (1 - t)]; });
    const lower = Array.from({ length: ARC - 1 }, (_, k): Vec2 => { const t = 1 - (k + 1) / ARC; return [x0 + t * w, y0 + 4 * bottom * t * (1 - t)]; });
    return { white: [...upper, ...lower], pupil: null };
  }
  // A calm, deliberate blink: ~90ms to close, 150ms fully shut, ~140ms to open (opening is slower),
  // the middle half of them 2.5-6s apart, now and then twice in a row.
  type BlinkTiming = { close: number; hold: number; open: number };
  const BLINK: BlinkTiming = { close: 0.09, hold: 0.15, open: 0.14 };
  /** The site's slow blink: the same curves, drawn out. */
  const SLOW_BLINK: BlinkTiming = { close: 0.35, hold: 0.2, open: 0.35 };
  const blink = { start: -1, next: 1.2 + Math.random() * 2, double: false, timing: BLINK, cued: false, twice: false, gap: [2.5, 6] as Vec2 };
  /**
   * The gap to the next ordinary blink is log-normal, as people's are, so there is no beat to it:
   * most gaps near the middle of `blink.gap`, now and then two blinks close together or a long
   * look without one. The gap's two ends are its quartiles (the middle half of the gaps falls
   * between them); no gap is under `min` seconds or over `most` times the gap's top.
   */
  const BLINK_GAP = { min: 0.8, most: 2.5 };
  function blinkGap() {
    const [lo, hi] = blink.gap, sigma = Math.log(hi / lo) / 1.349;   // a normal's quartiles are 1.349 sigmas apart
    const z = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
    return clamp(Math.sqrt(lo * hi) * Math.exp(sigma * z), BLINK_GAP.min, hi * BLINK_GAP.most);
  }
  function stepBlink(t: number) {
    if (blink.start < 0) { if (t >= blink.next) blink.start = t; else return 0; }
    const e = t - blink.start, { close, hold, open } = blink.timing;
    if (e < close) { const u = e / close; return u * u * (3 - 2 * u); }   // lid eases down, deliberate rather than a snap
    if (e < close + hold) return 1;
    if (e < close + hold + open) { const u = (e - close - hold) / open; return 1 - (1 - (1 - u) * (1 - u)); }   // eases open
    const lone = blink.timing !== BLINK || blink.cued;   // a slow blink or one on cue is never doubled
    blink.start = -1; blink.timing = BLINK; blink.cued = false;
    blink.double = blink.twice || (!lone && !blink.double && Math.random() < 0.18);   // at most two in a row
    blink.twice = false;
    blink.next = t + (blink.double ? 0.12 : blinkGap());
    return 0;
  }

  // ------------------------------------------------------------------ the site's hooks
  // The lid over everything else: 1 keeps the eyes shut (the intro hands over to a sleeping
  // Urchi), and it lifts on openEyes with the blink's own opening curve.
  const lid = { v: 0, from: 0, start: -1, dur: 0 };
  function stepLid(t: number) {
    if (lid.start < 0) return lid.v;
    const u = lid.dur > 0 ? Math.min(1, (t - lid.start) / lid.dur) : 1;
    lid.v = lid.from * (1 - u) * (1 - u);
    if (u >= 1) lid.start = -1;
    return lid.v;
  }
  // The glance away: the head turns off and the pupils follow for a moment.
  const GLANCE = { yaw: 22 * D2R, hold: 0.6 };
  const away = { turn: spring(), until: -1, eyes: 0, eyesUntil: -1 };
  // No stray blink straight after the eyes open: the first comes at least this long after the lids are up.
  const WAKE_BLINK_GAP = 1;

  // The attention hooks' lids: one per eye (the viewer's left, then right), each eased from where
  // it is to where it is sent, and a resting lid over both (drowsiness). An eye shows the most
  // shut of these and the blink, so a blink still closes a heavy eye and a shut eye stays shut.
  type Ease = { v: number; from: number; to: number; start: number; dur: number };
  const ease = (v = 0): Ease => ({ v, from: v, to: v, start: -1, dur: 0 });
  const eyeLids: [Ease, Ease] = [ease(), ease()];
  const restLid = ease();
  function easeTo(e: Ease, to: number, seconds: number) {
    e.from = e.v; e.to = to; e.start = S.t; e.dur = Math.max(0, seconds);
  }
  function stepEase(e: Ease, t: number) {
    if (e.start < 0) return e.v;
    const u = e.dur > 0 ? Math.min(1, (t - e.start) / e.dur) : 1;
    e.v = e.from + (e.to - e.from) * u * u * (3 - 2 * u);
    if (u >= 1) e.start = -1;
    return e.v;
  }
  // The pose: angles the head holds off its aim (a sleeper's dip, a stretch, a nod), on springs.
  const pose = { yaw: spring(), pitch: spring(), roll: spring(), speed: 6 };
  // The sway (listening): roll on a slow sine whose depth eases in and out.
  const swaying = { amp: spring(), period: 3.4, phase: 0 };
  // The owl's bob: three swings side to side at 2Hz. It keeps clear of the curious tilt: not within
  // `clear` seconds of a tilt's start or while the tilt is more than `settled` from where it is
  // going, and no random tilt until `after` seconds past its end, so it reads as a gesture of its own.
  const BOB = { roll: 3 * D2R, shift: 10, hz: 2, cycles: 3, clear: 1, settled: 1.5 * D2R, after: 0.6 };
  let bobStart = -1, shift = 0;
  // The stretch: one slow hump up and back.
  const STRETCH = { seconds: 1.2, pitch: 9.5 * D2R, rise: 16 };
  let stretchStart = -1;
  /** Reduced motion, with attention: blinks and pupil jumps run, nothing else moves. */
  let attended = false;

  // The reveal (the intro's "eyes first"). While it is under 1, render() also paints the eyes as
  // they show on the head into a mask, and its pixel pass (after the alpha snap and the rim) turns
  // off every head pixel beyond the sweep: the head's pixels switch on in order of distance from
  // the nearer eye centre over the first REVEAL.head of the way, the rim's over the rest.
  const REVEAL = { head: 0.72 };
  let reveal = 1;
  let revealMask: CanvasRenderingContext2D | null = null;
  let revealDist: Float32Array | null = null;
  const eyeAt = new Float64Array(EYES.length * 2);   // the eye centres this frame, in canvas pixels
  /** The eyes' reach, in canvas pixels: the head's sweep starts at their edge rather than their centre. */
  const eyeReach = () => URCHI_EYES.reach / CELL;
  function maskContext() {
    if (!revealMask) {
      const c = document.createElement("canvas");
      c.width = canvas.width; c.height = canvas.height;
      revealMask = c.getContext("2d", { willReadFrequently: true })!;
      revealDist = new Float32Array(c.width * c.height);
    }
    return revealMask;
  }
  /** The reveal's pixel pass over the snapped, rimmed frame: what the sweep has not reached goes transparent. */
  function hideUnrevealed(px: Uint8ClampedArray, eyes: Uint8ClampedArray, W: number, H: number) {
    const dist = revealDist!, EYE_REACH = eyeReach();
    let farHead = EYE_REACH, nearRim = Infinity, farRim = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!px[i * 4 + 3]) continue;
      let d = Infinity;
      for (let k = 0; k < eyeAt.length; k += 2) d = Math.min(d, Math.hypot(x + 0.5 - eyeAt[k], y + 0.5 - eyeAt[k + 1]));
      dist[i] = d;
      if (!rimMask[i]) farHead = Math.max(farHead, d);
      else { nearRim = Math.min(nearRim, d); farRim = Math.max(farRim, d); }
    }
    const u = reveal / REVEAL.head, v = (reveal - REVEAL.head) / (1 - REVEAL.head);
    const headR = reveal <= 0 ? -1 : EYE_REACH + Math.min(1, u) * (farHead - EYE_REACH);
    const rimR = v <= 0 ? -1 : nearRim + Math.min(1, v) * (farRim - nearRim);
    for (let i = 0; i < W * H; i++) {
      if (!px[i * 4 + 3]) continue;
      const on = rimMask[i] ? dist[i] <= rimR : eyes[i * 4 + 3] >= 128 || dist[i] <= headR;
      if (!on) px[i * 4 + 3] = 0;
    }
  }

  // ------------------------------------------------------------------ render
  const proj = new Float64Array(V.length * 3);   // rotated x, y (screen, y down) and z (toward viewer) per vertex
  const depth = new Float64Array(F.length);

  type Plane = { z: number; n: number; path: Path2D; color: string };
  type Item = { z: number; plane?: Plane; eye?: { white: Path2D; pupil: Path2D | null; left: boolean } };

  /**
   * With the suit on, the head's own outline (the mesh's, not tucked), for the eyes: the ears and
   * spikes are folded in only so they never show through the visor, and the eyes are still cut
   * exactly where the bare head cuts them, so they look just as they do without the suit.
   */
  function untuckedOutline(project: (p: Vec3) => Vec3): Path2D {
    const out = new Path2D(), q = (untucked ??= new Float64Array(V.length * 2));
    for (let i = 0; i < V.length; i++) { const r = project(V[i]); q[i * 2] = r[0]; q[i * 2 + 1] = r[1]; }
    for (const [a, b, c] of F) {
      const area = (q[a * 2] * q[b * 2 + 1] - q[b * 2] * q[a * 2 + 1]) + (q[b * 2] * q[c * 2 + 1] - q[c * 2] * q[b * 2 + 1]) + (q[c * 2] * q[a * 2 + 1] - q[a * 2] * q[c * 2 + 1]);
      if (!(area > 0)) continue;
      out.moveTo(q[a * 2], q[a * 2 + 1]); out.lineTo(q[b * 2], q[b * 2 + 1]); out.lineTo(q[c * 2], q[c * 2 + 1]); out.closePath();
    }
    return out;
  }
  let untucked: Float64Array | null = null;

  function render(yaw: number, pitch: number, roll = 0) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), RP = TILT.pivot;
    const project = ([px, py, pz]: Vec3): Vec3 => {
      const x = px, y = py - PIVOT_Y, z = pz;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
      // roll (the head tilt) about the view axis, pivoting low in the head; positive tips the top to the right
      const xr = x1 * cr - (y2 - RP) * sr, yr = x1 * sr + (y2 - RP) * cr + RP;
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - z2);
      return [xr * s, (yr + PIVOT_Y) * s, z2];
    };
    for (let i = 0; i < HV.length; i++) {
      const x = HV[i][0], y = HV[i][1] - PIVOT_Y, z = HV[i][2];
      // yaw about the vertical axis (positive turns the face to the viewer's right), then
      // pitch about the horizontal axis (positive tips the face down; y points down here)
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
      const xr = x1 * cr - (y2 - RP) * sr, yr = x1 * sr + (y2 - RP) * cr + RP;
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - z2);
      proj[i * 3] = xr * s; proj[i * 3 + 1] = (yr + PIVOT_Y) * s; proj[i * 3 + 2] = z2;
    }
    // 1. per triangle: screen winding (visibility), depth, and its normal summed into its plane
    GN.fill(0);
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi];
      let area = 0, nx = 0, ny = 0, nz = 0, zsum = 0;
      for (let k = 0; k < 3; k++) {
        const a = f[k], b = f[(k + 1) % 3];
        const ax = proj[a * 3], ay = -proj[a * 3 + 1], az = proj[a * 3 + 2];
        const bx = proj[b * 3], by = -proj[b * 3 + 1], bz = proj[b * 3 + 2];
        area += proj[a * 3] * proj[b * 3 + 1] - proj[b * 3] * proj[a * 3 + 1];
        nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by);
        zsum += az;
      }
      depth[fi] = zsum / 3; tarea[fi] = area;
      const g = G[fi]; GN[g * 3] += nx; GN[g * 3 + 1] += ny; GN[g * 3 + 2] += nz;
    }
    // 2. visible triangles, merged per plane into one shape (so no seams show inside a plane),
    //    each plane taking its one shade; the silhouette is the union of everything
    const planes = new Map<number, Plane>(), head = new Path2D();
    for (let fi = 0; fi < F.length; fi++) {
      if (!(tarea[fi] > 0)) continue;
      const g = G[fi], f = F[fi];
      let pl = planes.get(g);
      if (!pl) {
        let nx = GN[g * 3], ny = GN[g * 3 + 1], nz = GN[g * 3 + 2];
        const l = Math.hypot(nx, ny, nz) || 1;
        if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const i = Math.pow(Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l), 1.2);
        const c = Math.round(4 + 24 * i);   // near-black: planes range from #040404 to about #1C1C1C
        pl = { z: 0, n: 0, path: new Path2D(), color: `rgb(${c},${c},${c})` };
        planes.set(g, pl);
      }
      const tri = new Path2D();
      tri.moveTo(proj[f[0] * 3], proj[f[0] * 3 + 1]); tri.lineTo(proj[f[1] * 3], proj[f[1] * 3 + 1]); tri.lineTo(proj[f[2] * 3], proj[f[2] * 3 + 1]); tri.closePath();
      pl.path.addPath(tri); head.addPath(tri);
      pl.z += depth[fi]; pl.n++;
    }
    const items: Item[] = [];
    // with the suit on and the ears and spikes folded in, their planes go first, under the rest of the head, so none ever covers an eye
    const tucked = rig && HV === rig.tucked ? rig.tuckPlanes : null;
    for (const [g, pl] of planes) items.push({ z: tucked && tucked.has(g) ? pl.z / pl.n - 1e9 : pl.z / pl.n, plane: pl });
    // 3. eyes: drawn on their face plane, hidden once that face turns away, and sorted just in
    //    front of what they lie on so nearer parts of the head cover them
    EYES.forEach(e => {
      const n = e.n, nz1 = -n[0] * sy + n[2] * cy, nz2 = -n[1] * sp + nz1 * cp;
      if (nz2 < 0.15) return;
      const onPlane = ([x, y]: Vec2): Vec3 => [x, y, e.c[2] + e.dzdx * (x - e.c[0]) + e.dzdy * (y - e.c[1])];
      let zmax = -Infinity;
      const path = (ring: Vec2[]) => { const p = new Path2D(); ring.forEach(([x, y], k) => { const q = project(onPlane([x, y])); if (q[2] > zmax) zmax = q[2]; if (k) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; };
      const shape = eyeShape(e, lidOf(e.c[0] < 0 ? 0 : 1));
      items.push({ z: 0, eye: { white: path(shape.white), pupil: shape.pupil && path(shape.pupil), left: e.c[0] < 0 } });
      items[items.length - 1].z = zmax + 10;
    });
    items.sort((a, b) => a.z - b.z);   // painter's order: far first

    // 4. paint: dark base (silhouette grown by BASE, so joins between planes show dark), the
    //    planes and eyes far-to-near, then snap the edge to whole pixels and add the rim.
    //    During a reveal the eyes also go into a mask, and planes nearer than an eye cut it.
    const toCanvas: CanvasTransform6 = [1 / CELL, 0, 0, 1 / CELL, (shift - VBX) / CELL, (rise - VBY) / CELL];
    if (suited()) {
      renderSuit(yaw, pitch, roll, head, HV !== V ? untuckedOutline(project) : head, items, toCanvas);
      return;
    }
    if (SMOOTH) {
      paintSmooth(head, items, toCanvas, reveal < 1 ? EYES.map((e) => project(e.c)) : null);
      return;
    }
    const mask = reveal < 1 ? maskContext() : null;
    if (mask) {
      mask.setTransform(1, 0, 0, 1, 0, 0);
      mask.clearRect(0, 0, canvas.width, canvas.height);
      mask.setTransform(...toCanvas);
      mask.lineJoin = "round"; mask.lineWidth = CELL; mask.fillStyle = mask.strokeStyle = "#fff";
      EYES.forEach((e, k) => { const q = project(e.c); eyeAt[k * 2] = (q[0] + shift - VBX) / CELL; eyeAt[k * 2 + 1] = (q[1] + rise - VBY) / CELL; });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
    ctx.lineWidth = CELL;   // one canvas pixel
    for (const it of items) {
      // one-pixel stroke in the plane's own colour closes the anti-aliasing gap to its neighbours
      if (it.plane) {
        ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path);
        if (mask) { mask.globalCompositeOperation = "destination-out"; mask.fill(it.plane.path); mask.stroke(it.plane.path); }
        continue;
      }
      const eye = it.eye!;
      ctx.save(); ctx.clip(head);                                     // a turned-away eye never sticks out past the head
      ctx.fillStyle = EYE_COLOUR.iris; ctx.fill(eye.white);
      if (eye.pupil) { ctx.clip(eye.white); ctx.fillStyle = eye.left ? EYE_COLOUR.pupilLeft : EYE_COLOUR.pupilRight; ctx.fill(eye.pupil); }   // the lid covers the pupil
      ctx.restore();
      if (mask) { mask.save(); mask.globalCompositeOperation = "source-over"; mask.clip(head); mask.fill(eye.white); mask.restore(); }
    }
    pixelFinish(mask);
  }

  /**
   * The pixel paint's last pass: a hard pixel edge against the page (each pixel is head or
   * background), then the white rim: every background pixel touching the head (8 neighbours)
   * turns white, one art pixel wide. During a reveal, what the sweep has not reached goes.
   */
  function pixelFinish(mask: CanvasRenderingContext2D | null) {
    const W = canvas.width, H = canvas.height;
    const img = ctx.getImageData(0, 0, W, H), px = img.data;
    for (let k = 3; k < px.length; k += 4) px[k] = px[k] < 128 ? 0 : 255;
    rimMask.fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3]) continue;
      let touch = false;
      for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && px[(ny * W + nx) * 4 + 3]) { touch = true; break; }
      }
      if (touch) rimMask[y * W + x] = 1;
    }
    for (let i = 0; i < rimMask.length; i++) if (rimMask[i]) { const k = i * 4; px[k] = px[k + 1] = px[k + 2] = 255; px[k + 3] = 255; }
    if (mask) hideUnrevealed(px, mask.getImageData(0, 0, W, H).data, W, H);
    ctx.putImageData(img, 0, 0);
    lastPx = px;
  }

  /**
   * The smooth paint: the rim first, as the silhouette's outline (its inner half is covered by
   * what follows), then the dark base, the planes and the eyes far to near, all anti-aliased.
   * During a reveal, circles about the eye centres (in mesh units) grow over the head and then
   * over the rim, in the pixel pass's order, and the eyes show on their own over whatever is there.
   */
  function paintSmooth(head: Path2D, items: Item[], toCanvas: CanvasTransform6, eyeC: Vec3[] | null) {
    const RIM = rimWidth();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    let headR = Infinity, rimR = Infinity;
    if (eyeC) {
      let far = URCHI_EYES.reach;
      for (let i = 0; i < V.length; i++) {
        let d = Infinity;
        for (const c of eyeC) d = Math.min(d, Math.hypot(proj[i * 3] - c[0], proj[i * 3 + 1] - c[1]));
        far = Math.max(far, d);
      }
      far += BASE;
      const u = reveal / REVEAL.head, v = (reveal - REVEAL.head) / (1 - REVEAL.head), near = far * 0.55;
      headR = reveal <= 0 ? -1 : URCHI_EYES.reach + Math.min(1, u) * (far - URCHI_EYES.reach);
      rimR = v <= 0 ? -1 : near + Math.min(1, v) * (far + RIM - near);
    }
    const circles = (r: number) => {
      const p = new Path2D();
      eyeC!.forEach(([x, y]) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); });
      return p;
    };
    if (rimR > 0) {
      ctx.save();
      if (eyeC) ctx.clip(circles(rimR));
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * (RIM + BASE); ctx.stroke(head);
      ctx.restore();
    }
    if (headR > 0) {
      ctx.save();
      if (eyeC) ctx.clip(circles(headR));
      ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
      ctx.lineWidth = CELL;   // one canvas pixel in the plane's own colour closes the gaps to its neighbours
      for (const it of items) {
        if (it.plane) { ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path); }
        else if (!eyeC) paintEye(it.eye!, head);
      }
      ctx.restore();
    }
    if (eyeC) for (const it of items) if (it.eye) paintEye(it.eye, head);
    lastHead = head; lastToCanvas = toCanvas;
  }
  function paintEye(eye: NonNullable<Item["eye"]>, head: Path2D) {
    ctx.save(); ctx.clip(head);                                       // a turned-away eye never sticks out past the head
    ctx.fillStyle = EYE_COLOUR.iris; ctx.fill(eye.white);
    if (eye.pupil) { ctx.clip(eye.white); ctx.fillStyle = eye.left ? EYE_COLOUR.pupilLeft : EYE_COLOUR.pupilRight; ctx.fill(eye.pupil); }   // the lid covers the pupil
    ctx.restore();
  }

  // ------------------------------------------------------------------ the suit
  // The page's suit model is shared (suitModel); what a frame fills in (the points, the planes
  // drawn, the lists, its scratch) is this painter's, kept between frames, so a suited frame makes
  // next to nothing new.
  /** This painter's rig: the page's suit model (suitModel) and what its frames fill in, kept between them. */
  type SuitRig = SuitModel & {
    /** Per frame: the points, the planes' normals and depths, and which are drawn. */
    post: Float64Array; normals: Float64Array; planeZ: Float64Array; on: Uint8Array;
    /** The planes drawn this frame; per part those in front and behind (a disc turned away, the rim beyond the helmet's edge). */
    drawn: number[]; front: number[][]; behind: number[][];
    box: Float64Array; colours: Map<number, string>;
    // scratch: the eyes on screen, the body's parts drawn and their order, the decals in order, the sheen's steps
    eyeAt: Float64Array; bodyNow: number[]; order: number[]; deg: Int32Array; slot: Int32Array; after: number[][]; partZ: Float64Array; done: Uint8Array;
    decalNow: number[]; level: Int32Array; byLevel: number[];
    /**
     * The limbs, this frame: every point in view space (x right, y down, z toward the eye, before the
     * perspective), the eye in each segment's own space at rest, per joint where it is and which ways
     * its parent and its child point (see orderBody), and the parts in front of the helmet.
     */
    view: Float64Array; segEye: Float64Array; jointNow: Float64Array; late: Uint8Array;
    /** The gloves' parts, `.R` and `.L` (the hands a head looks at). */
    gloves: [number, number];
    /** Per segment, its limb (the segment hung from the torso it comes down from; the torso's own, 0); and scratch, the balls' orders to add. */
    chain: Int32Array; inherit: number[];
    /** Scratch: the orders found between parts posed apart, by a plane and (pressed together) by depth, [first, then, ...]. */
    found: number[]; pressed: number[];
  };
  let rig: SuitRig | null = null;
  function suitRig(): SuitRig {
    if (rig) return rig;
    const M = suitModel(), D = M.data, nv = M.sv.length / 3, np = M.planeMat.length;
    rig = {
      ...M,
      post: new Float64Array(nv * 3), normals: new Float64Array(np * 3), planeZ: new Float64Array(np), on: new Uint8Array(np),
      drawn: [], front: D.parts.map(() => []), behind: D.parts.map(() => []),
      box: new Float64Array(D.parts.length * 4), colours: new Map(),
      eyeAt: new Float64Array(EYES.length * 2), bodyNow: [], order: [], deg: new Int32Array(D.parts.length), slot: new Int32Array(D.parts.length),
      after: D.parts.map(() => []), partZ: new Float64Array(D.parts.length), done: new Uint8Array(D.parts.length),
      decalNow: [], level: new Int32Array(np), byLevel: [],
      view: new Float64Array(nv * 3), segEye: new Float64Array(D.segments.length * 3), jointNow: new Float64Array(D.joints.length * 9), late: new Uint8Array(D.parts.length), gloves: [0, 0],
      chain: Int32Array.from(D.segments, (_, s) => { let c = s; while (c > 0 && D.segments[c][1] > 0) c = D.segments[c][1]; return c; }), inherit: [], found: [], pressed: [],
    };
    D.segments.forEach(([j], s) => { if (j >= 0 && /^(shoulder|elbow|wrist)\./.test(D.joints[j].name)) ARM_SEGMENT.add(s); });
    rig.gloves = [D.parts.findIndex((p) => p.name === "glove.R"), D.parts.findIndex((p) => p.name === "glove.L")];
    return rig;
  }
  /** Something a plane's outline can be traced into: a Path2D, or the context's own path. */
  type Tracer = Pick<Path2D, "moveTo" | "lineTo" | "closePath">;
  /** A plane's loops, into a path, at the points in P. */
  function planeInto(R: SuitRig, path: Tracer, g: number, P: Float64Array) {
    for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
      const at = R.loopAt[l], n = R.loopLen[l];
      for (let k = 0; k < n; k++) { const v = R.corner[at + k] * 3; if (k) path.lineTo(P[v], P[v + 1]); else path.moveTo(P[v], P[v + 1]); }
      path.closePath();
    }
  }
  /**
   * A convex part's outline on screen (the hull of its points, as it is convex), into the context's
   * path: gift wrapping from its leftmost point, each step to the point with every other on its left.
   */
  function hullInto(R: SuitRig, P: SuitPart) {
    const Q = R.post, v0 = P.v0, v1 = P.v0 + P.vn;
    let start = v0;
    for (let v = v0 + 1; v < v1; v++) if (Q[v * 3] < Q[start * 3] || (Q[v * 3] === Q[start * 3] && Q[v * 3 + 1] < Q[start * 3 + 1])) start = v;
    let at = start;
    for (let n = 0; n <= P.vn; n++) {
      const ax = Q[at * 3], ay = Q[at * 3 + 1];
      if (n) ctx.lineTo(ax, ay); else ctx.moveTo(ax, ay);
      let next = at === v0 ? v0 + 1 : v0;
      for (let v = v0; v < v1; v++) {
        if (v === at) continue;
        const cr = (Q[next * 3] - ax) * (Q[v * 3 + 1] - ay) - (Q[next * 3 + 1] - ay) * (Q[v * 3] - ax);
        // v turns further than next (or lies on the same line, farther): it is the next corner so far
        if (cr < 0 || (cr === 0 && (Q[v * 3] - ax) ** 2 + (Q[v * 3 + 1] - ay) ** 2 > (Q[next * 3] - ax) ** 2 + (Q[next * 3 + 1] - ay) ** 2)) next = v;
      }
      at = next;
      if (at === start) break;
    }
    ctx.closePath();
  }

  /**
   * The visor: the helmet's dark inside, a smoke over the head, and per facet a sheen that grows
   * with its light (so the glass reads as faceted glass); on the facets most square to the light,
   * one soft highlight, which is kept off any facet that comes within `clear` of an eye's reach of
   * an eye's centre on screen, so it never washes the eyes out. The sheen goes in steps of `step`.
   */
  const VISOR = { inside: "#060608", tint: "rgba(18, 20, 30, 0.1)", sheen: "196, 200, 226", base: 0.06, grow: 0.3, glint: [0.4, 0.72, 0.42] as Vec3, clear: 1.2, step: 0.012 };
  /** The arms' segments (all that can come up in front of the helmet): those hung from a shoulder, an elbow or a wrist. */
  const ARM_SEGMENT = new Set<number>();
  /** The body's share of a breath's rise (the chest lifts a hair with it) and its zero-g drift under the head. */
  const SUIT_BODY = { rise: 0.5, drift: { roll: 1.3 * D2R, yaw: 2 * D2R, lift: 5, periods: [7.3, 9.1, 6.1] as Vec3 } };
  let suit = 0;
  /**
   * The limbs in the suit (see limbs.ts), once its model is here: posed as modelled (arms hanging)
   * until a host asks for more (Space's float, for zero gravity's posture and its quirks).
   */
  let limbs: Limbs | null = null;
  const limbsNow = () => (limbs ??= SUIT ? createLimbs(SUIT, { reducedMotion: reduceMotion, onQuirk: (q, side) => headJoins(q, side) }) : null);
  const turn = (dev.turn ?? 0) * D2R;
  /** The suit is painted: wanted, and its model is here. */
  const suited = () => suit > 0 && SUIT !== null;
  /**
   * The last suited frame, for alphaAt: its drawn planes and points (the rig's own, replaced by the
   * next frame), its outline, the bare head under a suit still building; and while the helmet
   * rises, the level it has risen to (on screen, mesh units) and the helmet's own outline.
   */
  let suitHit: { planes: number[]; post: Float64Array; outline: Path2D; head: Path2D | null; level: number; helmetLine: Path2D | null; shape: Path2D | null; helmet: Path2D | null } | null = null;
  /** The body's drift this frame: roll and yaw in radians, lift in mesh units. */
  const drift = { roll: 0, yaw: 0, lift: 0 };
  /** The frame the canvas covers, as it was last sized. */
  const frameNow = () => (suited() ? URCHI_SUIT_FRAME : URCHI_FRAME);
  function fitFrame() {
    const f = frameNow();
    if (f.x === VBX && f.y === VBY && f.w === VBW && f.h === VBH) return;
    VBX = f.x; VBY = f.y; VBW = f.w; VBH = f.h;
    canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
    rimMask = new Uint8Array(canvas.width * canvas.height);
    revealMask = null; revealDist = null; lastPx = null; lastHead = null; lastDrawn = null; suitHit = null;
  }
  const smooth01 = (a: number, b: number, v: number) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  /**
   * Whether a plane of the rim is in the eye's clear view (the eye at ex ey ez, in the head's
   * space): the helmet's surface under each of its corners faces the eye. The rim stands on the
   * convex helmet, so then nothing of the helmet is in front of it: it goes over the glass. Else
   * it is beyond the helmet's edge as seen, and goes before the shell, which covers what of it is
   * behind; what stands up past the helmet's outline still shows.
   */
  function rimClear(R: SuitRig, g: number, ex: number, ey: number, ez: number) {
    const SV = R.sv, N = R.rimN, v0 = R.parts[R.rim].v0;
    for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
      const at = R.loopAt[l], n = R.loopLen[l];
      for (let k = 0; k < n; k++) {
        const v = R.corner[at + k], j = (v - v0) * 3;
        if (N[j] * (ex - SV[v * 3]) + N[j + 1] * (ey - SV[v * 3 + 1]) + N[j + 2] * (ez - SV[v * 3 + 2]) < 0) return false;
      }
    }
    return true;
  }

  /**
   * One suited frame. The helmet turns with the head (the same projection, point for point); the
   * body hangs from the neck ring, which the head's roll carries, turned by part of the head's yaw
   * and roll (never its pitch) and drifting a little; its limbs posed first, each part where its
   * segment's transform puts it (see limbs.ts).
   *
   * Order, far to near. The body first: its parts are convex, and every two that overlap on screen
   * are put in order (see orderBody): by the plane baked between them, their joint, or a plane found
   * between them as they are posed. An arm's parts in front of the helmet (a glove held up to the
   * chin) go last of all, after the helmet. Then
   * the helmet: the rim's planes the helmet stands in front of and a disc turned away (so the shell
   * covers what of them is behind it); the shell; the glass, flush with it: the helmet's dark
   * inside, the head as ever (clipped to the glass, so no ear, spike or pixel of it can show
   * anywhere else), the smoked tint and the sheen; last the rim in the eye's clear view and the
   * discs that face the eye. Under each part's planes goes an underlay of its middle shade, so
   * the anti-aliased joins between its planes (and against its neighbours) close up instead of
   * letting the page show through as seams.
   */
  function renderSuit(yaw: number, pitch: number, roll: number, head: Path2D, eyeClip: Path2D, items: Item[], toCanvas: CanvasTransform6) {
    const R = suitRig(), D = R.data, POST = R.post, SV = R.sv, RP = TILT.pivot, nv = SV.length / 3, whole = suit >= 1;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // the neck, where the head's roll carries it, and the body's own turn about it
    const [NX, NY, NZ] = D.neck, ny0 = NY - PIVOT_Y;
    const ax = -(ny0 - RP) * sr, ay = (ny0 - RP) * cr + RP + PIVOT_Y;
    const bYaw = D.body.yaw * (yaw - turn) + turn + drift.yaw, bRoll = D.body.roll * roll + drift.roll;
    const cby = Math.cos(bYaw), sby = Math.sin(bYaw), cbr = Math.cos(bRoll), sbr = Math.sin(bRoll);
    const lift = (SUIT_BODY.rise - 1) * rise - drift.lift;
    // the limbs as posed: each segment's transform (at rest, none)
    const T = limbs && whole ? limbs.transforms : null, VIEW = R.view, VS = R.vseg;
    for (let i = 0; i < nv; i++) {
      let X: number, Y: number, Z: number;
      if (R.rigid[i]) {
        const x = SV[i * 3], y = SV[i * 3 + 1] - PIVOT_Y, z = SV[i * 3 + 2];
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        const y2 = y * cp + z1 * sp; Z = -y * sp + z1 * cp;
        X = x1 * cr - (y2 - RP) * sr; Y = x1 * sr + (y2 - RP) * cr + RP + PIVOT_Y;
      } else {
        let x = SV[i * 3], y = SV[i * 3 + 1], z = SV[i * 3 + 2];
        const g = VS[i] * 12;
        if (T && g) { const px = x, py = y, pz = z; x = T[g] * px + T[g + 1] * py + T[g + 2] * pz + T[g + 3]; y = T[g + 4] * px + T[g + 5] * py + T[g + 6] * pz + T[g + 7]; z = T[g + 8] * px + T[g + 9] * py + T[g + 10] * pz + T[g + 11]; }
        x -= NX; y -= NY; z -= NZ;
        const x1 = x * cby + z * sby; Z = -x * sby + z * cby;
        X = ax + x1 * cbr - y * sbr; Y = ay + x1 * sbr + y * cbr;
      }
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - Z);
      POST[i * 3] = X * s; POST[i * 3 + 1] = Y * s + (R.rigid[i] ? 0 : lift); POST[i * 3 + 2] = Z;
      VIEW[i * 3] = X; VIEW[i * 3 + 1] = Y; VIEW[i * 3 + 2] = Z;
    }
    poseJoints(R, T);
    // the eyes' centres on screen (the highlight keeps off them), as the helmet's points
    const eyeAt = R.eyeAt;
    EYES.forEach(({ c: [ex, ey0, ez] }, k) => {
      const y = ey0 - PIVOT_Y, x1 = ex * cy + ez * sy, z1 = -ex * sy + ez * cy, y2 = y * cp + z1 * sp, Z = -y * sp + z1 * cp;
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - Z);
      eyeAt[k * 2] = (x1 * cr - (y2 - RP) * sr) * s; eyeAt[k * 2 + 1] = (x1 * sr + (y2 - RP) * cr + RP + PIVOT_Y) * s;
    });
    // the eye, taken back into the head's space and into the body's
    const EZ = PERSPECTIVE === Infinity ? 1e7 : PERSPECTIVE;
    let ehx: number, ehy: number, ehz: number, ebx: number, eby: number, ebz: number;
    {
      const x1 = -(PIVOT_Y + RP) * sr, y2 = -(PIVOT_Y + RP) * cr + RP;
      const y = y2 * cp - EZ * sp, z1 = y2 * sp + EZ * cp;
      ehx = x1 * cy - z1 * sy; ehy = y + PIVOT_Y; ehz = x1 * sy + z1 * cy;
      const u = -ax, v = -ay, bx1 = u * cbr + v * sbr;
      ebx = bx1 * cby - EZ * sby + NX; eby = -u * sbr + v * cbr + NY; ebz = bx1 * sby + EZ * cby + NZ;
    }
    const shown = whole ? Infinity : suit * SUIT_BUILD.over;
    // how far the helmet has risen, 0..1, and the level (on screen) below which it is there
    const risen = whole ? 1 : clamp((shown - SUIT_BUILD.helmet) / (1 - SUIT_BUILD.helmet), 0, 1);
    let level = -Infinity;
    if (risen > 0 && risen < 1) {
      let top = Infinity, bottom = -Infinity;
      for (let i = 0; i < nv; i++) if (R.rigid[i]) { const y = POST[i * 3 + 1]; if (y < top) top = y; if (y > bottom) bottom = y; }
      level = bottom - risen * (bottom - top);
    }
    const N = R.normals, PZ = R.planeZ, on = R.on, drawn = R.drawn, front = R.front, behind = R.behind;
    on.fill(0);
    drawn.length = 0;
    for (const l of front) l.length = 0;
    for (const l of behind) l.length = 0;
    const visor = new Path2D();
    // while the suit builds itself, the visor's opening is there from the start (the head shows
    // through all of it), and the glass's dark inside and smoke come in as its facets do
    const opening = whole ? visor : new Path2D();
    let glassAll = 0, glassOn = 0;
    const hub = R.hub;
    R.parts.forEach((P, pi) => {
      if (dev.suitPart === "helmet" && !P.rigid) return;
      if (dev.bare && (P.rigid || BARE.gear.test(D.parts[pi].name))) return;
      // a disc goes after the glass while it faces the eye, and before the shell while it does not;
      // a plane of the rim, while it is in the eye's clear view (see rimClear)
      const [mx, my, mz] = P.mid;
      const farPart = P.decal === 1 && (mx - hub[0]) * (ehx - mx) + (my - hub[1]) * (ehy - my) + (mz - hub[2]) * (ehz - mz) < 0;
      const rim = P.decal === 2;
      const ball = R.ball[pi] === 1;
      for (const g of P.planes) {
        const unrevealed = P.rigid ? risen <= 0 : R.reveal[g] > shown;
        if (unrevealed && pi !== R.glass) continue;
        if (ball && !ballPlaneShows(R, pi, g, T)) continue;
        // facing the eye: the plane's outline runs the right way round on screen; its normal as the
        // head's, summed over its outline (the same sum as over its triangles: inside edges cancel)
        let area = 0, nx = 0, ny = 0, nz = 0, z = 0, count = 0;
        for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
          const at = R.loopAt[l], n = R.loopLen[l];
          for (let k = 0; k < n; k++) {
            const p = R.corner[at + k] * 3, q = R.corner[at + (k + 1) % n] * 3;
            const px = POST[p], py = POST[p + 1], pz = POST[p + 2], qx = POST[q], qy = POST[q + 1], qz = POST[q + 2];
            area += px * qy - qx * py;
            nx += (qy - py) * (pz + qz); ny += (pz - qz) * (px + qx); nz += (px - qx) * (qy + py);
            z += pz; count++;
          }
        }
        if (!(area > 0)) continue;
        if (pi === R.glass) { glassAll++; if (!whole) planeInto(R, opening, g, POST); }
        if (unrevealed) continue;
        N[g * 3] = nx; N[g * 3 + 1] = ny; N[g * 3 + 2] = -nz;
        PZ[g] = z / count;
        on[g] = 1; drawn.push(g);
        if (pi === R.glass) { glassOn++; planeInto(R, visor, g, POST); }
        ((rim ? !rimClear(R, g, ehx, ehy, ehz) : farPart) ? behind : front)[pi].push(g);
      }
    });
    // the body's order: every pair that overlaps on screen goes far side of its plane first
    const body = R.bodyNow, box = R.box;
    body.length = 0;
    for (const pi of R.body) {
      if (!front[pi].length) continue;
      body.push(pi);
      const P = R.parts[pi];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let v = P.v0; v < P.v0 + P.vn; v++) { const x = POST[v * 3], y = POST[v * 3 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      box[pi * 4] = x0; box[pi * 4 + 1] = y0; box[pi * 4 + 2] = x1; box[pi * 4 + 3] = y1;
    }
    const order = orderBody(R, body, box, ebx, eby, ebz, T);
    // an arm's parts in front of the helmet go after it (a hand held up to the visor): those with a
    // plane between them and the shell, the eye on their side; and so, then, does whatever goes after
    // one of them where they overlap
    const late = R.late;
    late.fill(0);
    let lateAny = false;
    if (T && !dev.suitPart && !dev.bare) {
      const P = R.parts[R.shell];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, zs = 0;
      for (let v = P.v0; v < P.v0 + P.vn; v++) { const x = POST[v * 3], y = POST[v * 3 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; zs += POST[v * 3 + 2]; }
      R.partZ[R.shell] = zs / P.vn;
      for (const pi of order) {
        if (!ARM_SEGMENT.has(R.partSeg[pi]) || box[pi * 4] > x1 || box[pi * 4 + 2] < x0 || box[pi * 4 + 1] > y1 || box[pi * 4 + 3] < y0) continue;
        if (apart(R, pi, R.shell) === R.shell) { late[pi] = 1; lateAny = true; }   // (pressed into it: behind)
      }
      if (lateAny) for (const pi of order) if (late[pi]) for (const q of R.after[R.slot[pi]]) late[q] = 1;
    }
    const light = (g: number) => {
      let nx = N[g * 3], ny = N[g * 3 + 1], nz = N[g * 3 + 2];
      const l = Math.hypot(nx, ny, nz) || 1;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      return Math.pow(Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l), 1.2);
    };
    // each plane traced straight into the context's path, filled and stroked (a canvas pixel in
    // its own colour closes the anti-aliasing gap to its neighbours), in its material's shade
    const fillPlane = (g: number) => {
      const m = dev.bare ? BARE.skin : R.mats[R.planeMat[g]], i = light(g);
      const r = Math.round(m.dark[0] + (m.lit[0] - m.dark[0]) * i), gr = Math.round(m.dark[1] + (m.lit[1] - m.dark[1]) * i), b = Math.round(m.dark[2] + (m.lit[2] - m.dark[2]) * i);
      const key = (r << 16) | (gr << 8) | b;
      let col = R.colours.get(key);
      if (!col) R.colours.set(key, (col = `rgb(${r},${gr},${b})`));
      ctx.fillStyle = ctx.strokeStyle = col;
      ctx.beginPath(); planeInto(R, ctx, g, POST); ctx.fill(); ctx.stroke();
    };
    // a part's underlay: its middle shade over its outline (a convex part's hull on screen, or the
    // planes it draws now), laid before its planes; not while the suit builds itself
    const underlay = (pi: number, planes: number[]) => {
      const P = R.parts[pi];
      if (!whole || !planes.length) return;
      ctx.fillStyle = dev.bare ? BARE.skin.under : R.mats[P.material].under;
      ctx.beginPath();
      if (P.convex) hullInto(R, P); else for (const g of planes) planeInto(R, ctx, g, POST);
      ctx.fill();
    };
    const byDepth = (p: number, q: number) => PZ[p] - PZ[q];
    /** The decals in one of the lists, far to near, each part's underlay first. */
    const decals = (lists: number[][]) => {
      const now = R.decalNow;
      now.length = 0;
      for (const pi of R.decals) { underlay(pi, lists[pi]); for (const g of lists[pi]) now.push(g); }
      now.sort(byDepth);
      for (const g of now) fillPlane(g);
    };
    // The figure's outline: the edges of drawn planes whose neighbour is not drawn. The rim and the
    // dark base are strokes of it (with round ends, as round joins), not of every plane: all that
    // shows of either is outside the figure, where only these edges reach.
    // While the helmet rises, its outline is apart (cut at the level) and the level line across it
    // takes the rim too, from one side of its outline to the other.
    const outline = new Path2D(), rising = level > -Infinity, helmetLine = rising ? new Path2D() : outline;
    let left = Infinity, right = -Infinity;
    for (const g of drawn) {
      const onHelmet = rising && R.parts[R.planePart[g]].rigid, into = onHelmet ? helmetLine : outline;
      for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
        const at = R.loopAt[l], n = R.loopLen[l];
        for (let k = 0; k < n; k++) {
          const p = R.corner[at + k] * 3, q = R.corner[at + (k + 1) % n] * 3;
          if (onHelmet && (POST[p + 1] - level) * (POST[q + 1] - level) <= 0 && POST[p + 1] !== POST[q + 1]) {
            const x = POST[p] + ((level - POST[p + 1]) / (POST[q + 1] - POST[p + 1])) * (POST[q] - POST[p]);
            if (x < left) left = x;
            if (x > right) right = x;
          }
          const nb = R.across[at + k];
          if (nb >= 0 && on[nb]) continue;
          into.moveTo(POST[p], POST[p + 1]); into.lineTo(POST[q], POST[q + 1]);
        }
      }
    }
    /** Only what is below the level: the helmet as far as it has risen. */
    const belowLevel = () => { ctx.beginPath(); ctx.rect(-1e5, level, 2e5, 1e5); ctx.clip(); };
    /** The figure's outline stroked (the rim or the dark base): the helmet's cut at the level, and the level line across it with the rim. */
    const strokeOutline = (withLevel: boolean) => {
      ctx.lineCap = "round";
      ctx.stroke(outline);
      if (rising) {
        ctx.save(); belowLevel(); ctx.stroke(helmetLine); ctx.restore();
        if (withLevel && right > left) { ctx.beginPath(); ctx.moveTo(left, level); ctx.lineTo(right, level); ctx.stroke(); }
      }
      ctx.lineCap = "butt";
    };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    suitHit = { planes: drawn, post: POST, outline, head: whole ? null : head, level, helmetLine: rising ? helmetLine : null, shape: null, helmet: null };
    lastHead = null;
    lastToCanvas = toCanvas;
    if (dev.suitLayer) {
      // the leak check's layers: flat white, nothing else
      ctx.fillStyle = "#fff";
      if (dev.suitLayer === "helmet") {
        ctx.save();
        if (rising) belowLevel();
        ctx.beginPath();
        for (const g of drawn) if (R.parts[R.planePart[g]].rigid) planeInto(R, ctx, g, POST);
        ctx.fill();
        ctx.restore();
      }
      else if (dev.suitLayer === "head") { ctx.save(); ctx.clip(visor); ctx.fill(head); for (const it of items) if (it.eye) { ctx.save(); ctx.clip(eyeClip); ctx.fill(it.eye.white); ctx.restore(); } ctx.restore(); }
      else if (dev.suitLayer === "tucked") ctx.fill(head);
      else if (dev.suitLayer === "eyes") { for (const it of items) if (it.eye) { ctx.save(); ctx.clip(eyeClip); ctx.fill(it.eye.white); ctx.restore(); } }
      else {
        ctx.fill(visor);
        ctx.globalCompositeOperation = "destination-out";
        for (const pi of R.decals) for (const g of front[pi]) { ctx.beginPath(); planeInto(R, ctx, g, POST); ctx.fill(); }
        ctx.globalCompositeOperation = "source-over";
      }
      if (!SMOOTH) pixelFinish(null);
      return;
    }
    const RIM = rimWidth();
    if (SMOOTH) {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * (RIM + BASE);
      strokeOutline(true);
      if (!whole || dev.bare) ctx.stroke(head);
    }
    // the bare head under a suit still building itself (its own rim, drawn with the suit's)
    const headItems = () => {
      ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
      ctx.lineWidth = CELL;
      for (const it of items) {
        if (it.plane) { ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path); }
        else paintEye(it.eye!, eyeClip);
      }
    };
    if (!whole) headItems();
    ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE;
    strokeOutline(false);
    ctx.lineWidth = CELL;
    for (const pi of order) { if (late[pi]) continue; underlay(pi, front[pi]); for (const g of front[pi]) fillPlane(g); }
    // without the suit: the bare head over the body, and nothing else
    if (dev.bare) {
      headItems();
      if (!SMOOTH) pixelFinish(null);
      return;
    }
    // the helmet, as far as it has risen
    ctx.save();
    if (rising) belowLevel();
    decals(behind);
    underlay(R.shell, front[R.shell]);
    for (const g of front[R.shell]) fillPlane(g);
    if (glassAll) {
      // through the visor: the helmet's dark inside, the head, the smoked glass
      const glass = glassOn / glassAll;
      ctx.save(); ctx.clip(opening);
      ctx.globalAlpha = glass; ctx.fillStyle = VISOR.inside; ctx.fill(opening); ctx.globalAlpha = 1;
      headItems();
      ctx.globalAlpha = glass; ctx.fillStyle = VISOR.tint; ctx.fill(opening); ctx.globalAlpha = 1;
      sheen(R, front[R.glass], light, eyeAt);
      ctx.restore();
      ctx.lineWidth = CELL;
    }
    decals(front);
    ctx.restore();
    if (lateAny) for (const pi of order) { if (!late[pi]) continue; underlay(pi, front[pi]); for (const g of front[pi]) fillPlane(g); }
    if (!SMOOTH) pixelFinish(null);
  }

  /**
   * The glass's sheen: per facet an alpha that grows with its light, plus the soft highlight on
   * those most square to it (never on a facet near an eye, where it would wash it out). From the
   * highest step down, each fill covers every facet at or above its step (the context's path
   * grows by that step's facets), with the alpha that brings each facet to its own in the end: so
   * every facet is under the lowest fill whole, and no seam of what is behind ever shows between two.
   */
  function sheen(R: SuitRig, planes: number[], light: (g: number) => number, eyeAt: Float64Array) {
    const n = planes.length;
    if (!n) return;
    const P = R.post, clear = VISOR.clear * URCHI_EYES.reach, level = R.level, byLevel = R.byLevel;
    /** Whether a facet comes within `clear` of an eye's centre on screen (inside it, or near an edge). */
    const overEye = (g: number) => {
      for (let e = 0; e < eyeAt.length; e += 2) {
        const ex = eyeAt[e], ey = eyeAt[e + 1];
        let inside = false, near = false;
        for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g] && !near; l++) {
          const at = R.loopAt[l], m = R.loopLen[l];
          for (let k = 0; k < m; k++) {
            const a = R.corner[at + k] * 3, b = R.corner[at + (k + 1) % m] * 3, ax = P[a], ay = P[a + 1], bx = P[b], by = P[b + 1];
            if (ay > ey !== by > ey && ex < ((bx - ax) * (ey - ay)) / (by - ay) + ax) inside = !inside;
            const dx = bx - ax, dy = by - ay, t = clamp(((ex - ax) * dx + (ey - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
            if (Math.hypot(ax + dx * t - ex, ay + dy * t - ey) < clear) { near = true; break; }
          }
        }
        if (inside || near) return true;
      }
      return false;
    };
    byLevel.length = 0;
    for (const g of planes) {
      const i = light(g), glint = VISOR.glint[2] * smooth01(VISOR.glint[0], VISOR.glint[1], i);
      const a = VISOR.base + VISOR.grow * i + (glint > 0 && !overEye(g) ? glint : 0);
      level[g] = Math.max(1, Math.round(a / VISOR.step));
      byLevel.push(g);
    }
    byLevel.sort((p, q) => level[q] - level[p]);
    ctx.beginPath();
    for (let k = 0; k < n; ) {
      const lv = level[byLevel[k]];
      while (k < n && level[byLevel[k]] === lv) planeInto(R, ctx, byLevel[k++], P);
      const a = lv * VISOR.step, below = k < n ? level[byLevel[k]] * VISOR.step : 0;
      ctx.fillStyle = `rgba(${VISOR.sheen}, ${(1 - (1 - a) / (1 - below)).toFixed(4)})`;
      ctx.fill();
    }
  }

  /**
   * The body's parts in painting order, far to near: every two drawn parts whose boxes on screen
   * overlap are put in order, and then among the parts free to go the farthest goes (should the
   * orders ever run in a loop, the farthest part left breaks it). Two that turn together (one
   * segment, see limbs.ts) have a plane baked between them: the one on its far side from the eye
   * first (the eye taken into the segment's own space at rest). Two that meet at a joint go by the
   * joint (see jointFirst). Any other two are posed apart: a plane is found between them as they are
   * (see apart). The eye is (ex, ey, ez) in the body's space.
   */
  function orderBody(R: SuitRig, body: number[], box: Float64Array, ex: number, ey: number, ez: number, T: Float64Array | null): number[] {
    const S = R.sep, deg = R.deg, after = R.after, slot = R.slot, z = R.partZ, done = R.done, out = R.order, n = R.parts.length, D = R.data;
    deg.fill(0); slot.fill(-1); done.fill(0); out.length = 0;
    body.forEach((pi, k) => { slot[pi] = k; after[k].length = 0; });
    for (const pi of body) { const P = R.parts[pi]; let s = 0; for (let v = P.v0; v < P.v0 + P.vn; v++) s += R.post[v * 3 + 2]; z[pi] = s / P.vn; }
    // the eye in each segment's own space at rest
    const E = R.segEye;
    for (let s = 0; s < D.segments.length; s++) {
      const g = s * 12;
      if (!T || !s) { E[s * 3] = ex; E[s * 3 + 1] = ey; E[s * 3 + 2] = ez; continue; }
      const dx = ex - T[g + 3], dy = ey - T[g + 7], dz = ez - T[g + 11];
      E[s * 3] = T[g] * dx + T[g + 4] * dy + T[g + 8] * dz; E[s * 3 + 1] = T[g + 1] * dx + T[g + 5] * dy + T[g + 9] * dz; E[s * 3 + 2] = T[g + 2] * dx + T[g + 6] * dy + T[g + 10] * dz;
    }
    const inherit = R.inherit, found = R.found, pressed = R.pressed, seen = R.done;
    inherit.length = found.length = pressed.length = 0;
    /** Whether `to` is after `from`, however far along. */
    const reaches = (from: number, to: number) => {
      seen.fill(0);
      const stack = [from];
      while (stack.length) {
        const p = stack.pop()!;
        if (p === to) return true;
        if (seen[p]) continue;
        seen[p] = 1;
        for (const q of after[slot[p]]) if (!seen[q]) stack.push(q);
      }
      return false;
    };
    for (let x = 0; x < body.length; x++) {
      const a = body[x];
      for (let y = x + 1; y < body.length; y++) {
        const b = body[y];
        if (box[a * 4] > box[b * 4 + 2] || box[b * 4] > box[a * 4 + 2] || box[a * 4 + 1] > box[b * 4 + 3] || box[b * 4 + 1] > box[a * 4 + 3]) continue;
        let first: number;
        const k = R.pairSep[a * n + b], j = R.pairJoint[a * n + b];
        // two that turn apart and whose shapes on screen do not overlap (only their boxes do) need no order
        if (k < 0 && R.partSeg[a] !== R.partSeg[b] && apartOnScreen(R, a, b)) continue;
        if (k >= 0) {
          const e = R.partSeg[a] * 3;
          // the eye on the second's side of the plane: the first first
          first = S[k + 2] * E[e] + S[k + 3] * E[e + 1] + S[k + 4] * E[e + 2] - S[k + 5] > 0 ? S[k] : S[k + 1];
        } else if (j >= 0) first = jointFirst(R, j, a, b, ex, ey, ez);
        else if (R.partSeg[a] === R.partSeg[b] || R.ball[a] || R.ball[b]) continue;   // turning together with no plane between them, they never overlap; a ball goes by its tubes (below)
        else {
          // posed apart: a plane found between them as they are, or (pressed into each other) their depths; after the rest (below)
          const f = apart(R, a, b);
          if (f !== PRESSED) found.push(f, f === a ? b : a);
          else if (R.partZ[a] <= R.partZ[b]) pressed.push(a, b);
          else pressed.push(b, a);
          continue;
        }
        const then = first === a ? b : a;
        after[slot[first]].push(then); deg[then]++;
        // a joint's ball is inside its tubes: what goes before either of them from outside its limb goes before it (below)
        if (!R.ball[first] && R.chain[R.partSeg[first]] !== R.chain[R.partSeg[then]]) for (const B of R.tubeBalls[then]) if (slot[B] >= 0) inherit.push(first, B);
      }
    }
    // Then the orders of parts posed apart: a plane's, then a depth's (pressed together), then a
    // ball's (only where it overlaps the ball on screen: it is seen only in the wedge a bend opens);
    // each only if it does not close a loop with what is already ordered (a joint's orders are its
    // own and come first: two parts that turn apart meet in a loop only where they are pressed into
    // each other, or nearly, and there the joint knows better)
    const add = (list: number[], ball: boolean) => {
      for (let i = 0; i < list.length; i += 2) {
        const x = list[i], y = list[i + 1];
        if (ball && (box[y * 4] > box[x * 4 + 2] || box[x * 4] > box[y * 4 + 2] || box[y * 4 + 1] > box[x * 4 + 3] || box[x * 4 + 1] > box[y * 4 + 3])) continue;
        if (reaches(y, x)) continue;
        after[slot[x]].push(y); deg[y]++;
        if (!ball && !R.ball[x]) for (const B of R.tubeBalls[y]) if (slot[B] >= 0 && R.chain[R.partSeg[x]] !== R.chain[R.partSeg[y]]) inherit.push(x, B);
      }
    };
    add(found, false); add(pressed, false); add(inherit, true);
    done.fill(0);
    while (out.length < body.length) {
      let pick = -1;
      for (const pi of body) if (!done[pi] && deg[pi] === 0 && (pick < 0 || z[pi] < z[pick])) pick = pi;
      // a loop (none should be left): the part waiting on the fewest, then the farthest
      if (pick < 0) for (const pi of body) if (!done[pi] && (pick < 0 || deg[pi] < deg[pick] || (deg[pi] === deg[pick] && z[pi] < z[pick]))) pick = pi;
      done[pick] = 1; out.push(pick);
      for (const q of after[slot[pick]]) deg[q]--;
    }
    return out;
  }
  /** Each joint as posed (see orderBody): where it is, its parent's way back from it and its child's way out, the body's space. */
  function poseJoints(R: SuitRig, T: Float64Array | null) {
    const JN = R.jointNow;
    R.data.joints.forEach((J, j) => {
      const ps = (J.parts[0] >= 0 ? R.partSeg[J.parts[0]] : 0) * 12, cs = R.partSeg[J.parts[1]] * 12, o = j * 9, [px, py, pz] = J.pivot;
      if (!T) { JN.set(J.pivot, o); JN.set(J.up, o + 3); JN.set(J.axis, o + 6); return; }
      JN[o] = T[ps] * px + T[ps + 1] * py + T[ps + 2] * pz + T[ps + 3]; JN[o + 1] = T[ps + 4] * px + T[ps + 5] * py + T[ps + 6] * pz + T[ps + 7]; JN[o + 2] = T[ps + 8] * px + T[ps + 9] * py + T[ps + 10] * pz + T[ps + 11];
      const [ux, uy, uz] = J.up, [ax, ay, az] = J.axis;
      JN[o + 3] = T[ps] * ux + T[ps + 1] * uy + T[ps + 2] * uz; JN[o + 4] = T[ps + 4] * ux + T[ps + 5] * uy + T[ps + 6] * uz; JN[o + 5] = T[ps + 8] * ux + T[ps + 9] * uy + T[ps + 10] * uz;
      JN[o + 6] = T[cs] * ax + T[cs + 1] * ay + T[cs + 2] * az; JN[o + 7] = T[cs + 4] * ax + T[cs + 5] * ay + T[cs + 6] * az; JN[o + 8] = T[cs + 8] * ax + T[cs + 9] * ay + T[cs + 10] * az;
    });
  }
  /**
   * Whether a joint's ball has anything to show: its joint bent more than `least` (below that its
   * tubes and ring cover it), and of it only the planes facing out of the bend, into the wedge
   * (those facing into the bend are inside its tubes, whatever the eye sees). A plane's way out is
   * taken from its middle, as the ball is round. The way into the bend is its tubes' ways out of the
   * joint added (they point apart, straight: their sum grows toward the inside as it bends).
   */
  const BALL = { least: 0.12, inward: 0.3 };
  function ballPlaneShows(R: SuitRig, pi: number, g: number, T: Float64Array | null) {
    const j = R.ballJoint[pi], JN = R.jointNow, o = j * 9;
    const ix = JN[o + 3] + JN[o + 6], iy = JN[o + 4] + JN[o + 7], iz = JN[o + 5] + JN[o + 8], il = Math.hypot(ix, iy, iz);
    if (!T || il < BALL.least) return false;
    const M = R.planeMid, P = R.data.joints[j].pivot, s = R.partSeg[pi] * 12;
    const dx = M[g * 3] - P[0], dy = M[g * 3 + 1] - P[1], dz = M[g * 3 + 2] - P[2];
    const wx = T[s] * dx + T[s + 1] * dy + T[s + 2] * dz, wy = T[s + 4] * dx + T[s + 5] * dy + T[s + 6] * dz, wz = T[s + 8] * dx + T[s + 9] * dy + T[s + 10] * dz;
    return wx * ix + wy * iy + wz * iz < BALL.inward * il * Math.hypot(wx, wy, wz);
  }
  /**
   * How a joint's parts go (see limbs.ts): its ball first, as it is inside all of them. A ring and a
   * tube meeting it: a tube stands on the ring's end, so it goes after the ring where the eye is on
   * its side of the joint (it pointing the eye's way, the ring's end on its side faces the eye) and
   * before it where not (the ring's side then in front of the tube's end). The parent's and the
   * child's tubes: by the plane through the joint that halves its bend, the one on its far side first.
   * A joint with no ring (the hip) has its parent over the child's top, always.
   */
  function jointFirst(R: SuitRig, j: number, a: number, b: number, ex: number, ey: number, ez: number) {
    const [par, , cov, bal] = R.data.joints[j].parts, JN = R.jointNow, o = j * 9;
    if (a === bal || b === bal) return a === bal ? a : b;
    const other = a === par ? b : a;
    if (cov < 0) return other;
    const vx = ex - JN[o], vy = ey - JN[o + 1], vz = ez - JN[o + 2];
    if (a === cov || b === cov) {
      const tube = a === cov ? b : a, u = tube === par ? o + 3 : o + 6;
      return JN[u] * vx + JN[u + 1] * vy + JN[u + 2] * vz > 0 ? cov : tube;
    }
    return (JN[o + 6] - JN[o + 3]) * vx + (JN[o + 7] - JN[o + 4]) * vy + (JN[o + 8] - JN[o + 5]) * vz > 0 ? par : other;
  }
  /**
   * Which of two parts posed apart goes first: a plane between them as they are (view space), and
   * the one on its far side from the eye. Found by Gilbert's walk toward the point of their
   * difference nearest the origin, stopping at the first direction that has all of one on one side
   * of all of the other (at once, mostly, for parts well apart); after `steps` without one, they are
   * pressed into each other (PRESSED).
   */
  const APART = { steps: 24 };
  /** apart's answer for two pressed into each other: no plane between them. */
  const PRESSED = -1;
  /** Whether two parts' shapes on screen are apart (the same walk as apart, in the screen's plane). */
  function apartOnScreen(R: SuitRig, a: number, b: number) {
    const V = R.post, A = R.parts[a], B = R.parts[b];
    let wx = 0, wy = 0;
    for (let v = B.v0; v < B.v0 + B.vn; v++) { wx += V[v * 3] / B.vn; wy += V[v * 3 + 1] / B.vn; }
    for (let v = A.v0; v < A.v0 + A.vn; v++) { wx -= V[v * 3] / A.vn; wy -= V[v * 3 + 1] / A.vn; }
    for (let step = 0; step < APART.steps; step++) {
      let most = -Infinity, least = Infinity, ai = A.v0, bi = B.v0;
      for (let v = A.v0; v < A.v0 + A.vn; v++) { const d = wx * V[v * 3] + wy * V[v * 3 + 1]; if (d > most) { most = d; ai = v; } }
      for (let v = B.v0; v < B.v0 + B.vn; v++) { const d = wx * V[v * 3] + wy * V[v * 3 + 1]; if (d < least) { least = d; bi = v; } }
      if (least > most) return true;
      const dx = V[bi * 3] - V[ai * 3] - wx, dy = V[bi * 3 + 1] - V[ai * 3 + 1] - wy, dd = dx * dx + dy * dy;
      if (dd < 1e-9) return false;
      const t = clamp(-(wx * dx + wy * dy) / dd, 0, 1);
      wx += t * dx; wy += t * dy;
      if (wx * wx + wy * wy < 1e-6) return false;
    }
    return false;
  }
  function apart(R: SuitRig, a: number, b: number) {
    const V = R.view, A = R.parts[a], B = R.parts[b], EZ = PERSPECTIVE === Infinity ? 1e7 : PERSPECTIVE;
    let wx = 0, wy = 0, wz = 0;
    for (let v = B.v0; v < B.v0 + B.vn; v++) { wx += V[v * 3] / B.vn; wy += V[v * 3 + 1] / B.vn; wz += V[v * 3 + 2] / B.vn; }
    for (let v = A.v0; v < A.v0 + A.vn; v++) { wx -= V[v * 3] / A.vn; wy -= V[v * 3 + 1] / A.vn; wz -= V[v * 3 + 2] / A.vn; }
    for (let step = 0; step < APART.steps; step++) {
      let most = -Infinity, least = Infinity, ai = A.v0, bi = B.v0;
      for (let v = A.v0; v < A.v0 + A.vn; v++) { const d = wx * V[v * 3] + wy * V[v * 3 + 1] + wz * V[v * 3 + 2]; if (d > most) { most = d; ai = v; } }
      for (let v = B.v0; v < B.v0 + B.vn; v++) { const d = wx * V[v * 3] + wy * V[v * 3 + 1] + wz * V[v * 3 + 2]; if (d < least) { least = d; bi = v; } }
      // all of b beyond all of a along w: the eye on b's side of the plane between puts a first
      if (least > most) return wz * EZ > (most + least) / 2 ? a : b;
      const dx = V[bi * 3] - V[ai * 3] - wx, dy = V[bi * 3 + 1] - V[ai * 3 + 1] - wy, dz = V[bi * 3 + 2] - V[ai * 3 + 2] - wz, dd = dx * dx + dy * dy + dz * dz;
      if (dd < 1e-9) break;
      const t = clamp(-(wx * dx + wy * dy + wz * dz) / dd, 0, 1);
      wx += t * dx; wy += t * dy; wz += t * dz;
      if (wx * wx + wy * wy + wz * wz < 1e-6) break;
    }
    return PRESSED;
  }
  /** The head's vertices for a suit this far on: the ears and spikes fold in, all the way before the helmet starts to rise. */
  function headFor(amount: number): Vec3[] {
    if (amount <= 0 || !SUIT || dev.bare) return V;
    const end = SUIT_BUILD.helmet / SUIT_BUILD.over - 0.005;
    const t = smooth01(end - SUIT_BUILD.tuck, end, amount), T = suitRig().tucked;
    if (t >= 1) return T;
    return V.map((p, i) => (T[i] === p ? p : [p[0] + (T[i][0] - p[0]) * t, p[1] + (T[i][1] - p[1]) * t, p[2] + (T[i][2] - p[2]) * t]));
  }

  // ------------------------------------------------------------------ frame
  // Eyes lead, head follows: when a look moves far, the pupils go at once and the head's aim
  // catches up this much later (a quick turn stiffens the head's springs for a moment).
  const LEAD = { seconds: 0.08, jump: 0.05, quick: 0.6 };
  const HEAD = { omega: 9, quick: 16 };
  /**
   * How fast the head turns, by how far (attended only: the host's looks): a small turn is quick
   * and a big one slow, as a neck's are. A new turn (its aim moving `jump` degrees or more) sets
   * the head's spring for itself from the turn it has to make: HEAD.omega at `ref` degrees, and as
   * the square root of `ref` over the turn, so a turn's top speed grows only as its square root and
   * its time with it (3 degrees in about 0.17s, 40 in about 0.6s); never stiffer than `fast` nor
   * softer than `slow`.
   */
  const TURN_SPEED = { ref: 12, fast: 18, slow: 4.5, jump: 1 };
  /** The head's spring as the current turn has it, and the aim that turn was for (radians). */
  const turning = { omega: HEAD.omega, yaw: 0, pitch: 0 };
  /** The head's angles for an aim in the pointer's space. */
  const headAim = (nx: number, ny: number): Vec2 => [nx * LOOK.yaw, ny > 0 ? ny * LOOK.pitchDown : ny * LOOK.pitchUp];
  /** A head pitch back in the pointer's space: headAim's own, the other way. */
  const lookOfPitch = (pitch: number) => (pitch > 0 ? pitch / LOOK.pitchDown : pitch / LOOK.pitchUp);
  /** Shut enough for a face to swap unseen: the closed arc. */
  const SHUT = 0.97;
  /** Blinks and pupil moves run: always, except under reduced motion with nothing attending (or ?still). */
  const lively = () => !reduceMotion || (attended && !STILL);
  /** Each eye's lid this frame (0 the viewer's left, 1 the right): the most shut of the blink, its own lid and the resting lid. */
  function lidOf(i: 0 | 1) {
    return Math.max(blinkAmount, eyeLids[i].v, restLid.v);
  }

  /**
   * What render() read for the last paint. A frame whose every input is within DRAWN_EPS of it
   * would draw the same picture (a hundredth of a canvas pixel at most), so the canvas keeps it
   * and a host can skip its upload. Null paints the next frame whatever (a new size, the first).
   */
  let lastDrawn: number[] | null = null;
  const DRAWN_EPS = 1e-5;
  function paint(yaw: number, pitch: number, roll: number): boolean {
    const now = [yaw, pitch, roll, lidOf(0), lidOf(1), gaze.x.v, gaze.y.v, gaze.h.v, gaze.conv.v, wide.v, shift, rise, reveal, CELL, rimWidth(), FACES.indexOf(faces.now)];
    if (suit > 0 || turn !== 0) now.push(suit, turn, drift.roll, drift.yaw, drift.lift, limbs ? limbs.version : 0);
    const was = lastDrawn;
    if (was && was.length === now.length && now.every((v, i) => Math.abs(v - was[i]) < DRAWN_EPS)) return false;
    lastDrawn = now;
    render(turn !== 0 ? yaw + turn : yaw, pitch, roll);
    return true;
  }

  // The standalone page's frame, called by the host's ticker instead of its own.
  function frame(dtSeconds: number): boolean {
    const dt = Math.min(0.05, Math.max(0.001, dtSeconds));
    S.t += dt;
    let tx = 0, ty = 0;   // a gaze target outranks the pointer, and its own hand held up to be looked at outranks both
    const hand = limbs && suit >= 1 && !reduceMotion && !FORCED ? limbs.lookHand : null;
    selfAim = hand === null ? null : handAim(hand);
    if (selfAim) [tx, ty] = selfAim;
    else if (look.on && !reduceMotion) {
      if (look.headAt < 0 || S.t >= look.headAt) { look.hx = look.nx; look.hy = look.ny; look.headAt = -1; }
      tx = look.hx; ty = look.hy;
    } else if (P.has) { tx = P.nx; ty = P.ny; }
    [S.yaw.target, S.pitch.target] = headAim(tx, ty);
    if (!attended) turning.omega = HEAD.omega;
    else if (Math.hypot(S.yaw.target - turning.yaw, S.pitch.target - turning.pitch) >= TURN_SPEED.jump * D2R) {
      // a new turn: its spring from how far the head has to go (see TURN_SPEED)
      const far = Math.max(1e-3, Math.hypot(S.yaw.target - S.yaw.v, S.pitch.target - S.pitch.v) / D2R);
      turning.omega = clamp(HEAD.omega * Math.sqrt(TURN_SPEED.ref / far), TURN_SPEED.slow, TURN_SPEED.fast);
      turning.yaw = S.yaw.target; turning.pitch = S.pitch.target;
    }
    const omega = S.t < look.quick ? Math.max(HEAD.quick, turning.omega) : turning.omega;
    stepSpring(S.yaw, dt, omega); stepSpring(S.pitch, dt, omega);
    if (STILL) { S.yaw.v = S.yaw.target; S.pitch.v = S.pitch.target; }
    if (FORCED) { S.yaw.v = FORCED[0]; S.pitch.v = FORCED[1]; }
    blinkAmount = Math.max(FORCED_BLINK ?? (lively() ? stepBlink(S.t) : 0), stepLid(S.t));
    stepEase(eyeLids[0], S.t); stepEase(eyeLids[1], S.t); stepEase(restLid, S.t);
    // a new face swaps in once the eyes are shut (see setFace)
    if (faces.next && Math.max(lidOf(0), lidOf(1)) >= SHUT) { faces.now = faces.next; faces.next = null; }
    const nod = breathe(dt);
    if (!reduceMotion && !FORCED) { stepTilt(S.t, dt); stepGaze(S.t, dt); }
    else if (lively() && !FORCED) stepGaze(S.t, dt);   // reduced motion, attended: the pupils still jump
    if (away.until >= 0 && S.t >= away.until) { away.turn.target = 0; away.until = -1; }
    stepSpring(away.turn, dt, 12, 0.8);
    if (wideUntil >= 0 && S.t >= wideUntil) { wide.target = 1; wideUntil = -1; }
    stepSpring(wide, dt, 18, 0.7);
    // what the attention hooks add: a held pose, the sway and the owl's bob (none of it under reduced motion)
    stepSpring(pose.yaw, dt, pose.speed, 0.85); stepSpring(pose.pitch, dt, pose.speed, 0.85); stepSpring(pose.roll, dt, pose.speed, 0.85);
    swaying.phase = (swaying.phase + 2 * Math.PI * dt / swaying.period) % (2 * Math.PI);
    stepSpring(swaying.amp, dt, 1.4, 1);
    let bobRoll = 0;
    shift = 0;
    if (bobStart >= 0) {
      const e = S.t - bobStart, dur = BOB.cycles / BOB.hz;
      if (e >= dur) bobStart = -1;
      else { const env = Math.sin(Math.PI * e / dur), s = Math.sin(2 * Math.PI * BOB.hz * e) * env; bobRoll = BOB.roll * s; shift = BOB.shift * s; }
    }
    let reach = 0;
    if (stretchStart >= 0) {
      const u = (S.t - stretchStart) / STRETCH.seconds;
      if (u >= 1) stretchStart = -1;
      else reach = Math.sin(Math.PI * u) ** 2;
    }
    if (reduceMotion || FORCED) { shift = 0; reach = 0; }
    rise -= STRETCH.rise * reach;
    const extra = reduceMotion || FORCED ? { yaw: 0, pitch: 0, roll: 0 } : { yaw: pose.yaw.v, pitch: pose.pitch.v - STRETCH.pitch * reach, roll: pose.roll.v + swaying.amp.v * Math.sin(swaying.phase) + bobRoll };
    const roll = FORCED_ROLL ?? tilt.roll.v + extra.roll;
    if (suit > 0 && !reduceMotion && !FORCED) {
      const [p0, p1, p2] = SUIT_BODY.drift.periods, TAU = 2 * Math.PI;
      drift.roll = SUIT_BODY.drift.roll * Math.sin((TAU * S.t) / p0);
      drift.yaw = SUIT_BODY.drift.yaw * Math.sin((TAU * S.t) / p1 + 1.3);
      drift.lift = SUIT_BODY.drift.lift * Math.sin((TAU * S.t) / p2 + 0.6);
    } else drift.roll = drift.yaw = drift.lift = 0;
    if (suit >= 1 && SUIT) {
      const L = limbsNow()!;
      L.breathe(breath.w);
      L.step(dt);
    }
    return paint(S.yaw.v + tilt.yaw.v + away.turn.v + extra.yaw, S.pitch.v + tilt.pitch.v + nod + extra.pitch, roll);
  }
  /** Where the head looks while it looks at its own hand, in the pointer's terms (see headAim); null while it does not. */
  let selfAim: Vec2 | null = null;
  /**
   * Where a hand is, for its head to look at it, in the pointer's terms: the glove's middle as last
   * painted (view space), from a little in front of the head's middle, where it looks from.
   */
  function handAim(side: 0 | 1): Vec2 | null {
    const R = rig;
    if (!R) return null;
    const P = R.parts[R.gloves[side]], V = R.view;
    let x = 0, y = 0, z = 0;
    for (let v = P.v0; v < P.v0 + P.vn; v++) { x += V[v * 3]; y += V[v * 3 + 1]; z += V[v * 3 + 2]; }
    x /= P.vn; y /= P.vn; z /= P.vn;
    const dz = Math.max(1, z - HAND_LOOK.from), yaw = Math.atan2(x, dz), pitch = Math.atan2(y - PIVOT_Y, Math.hypot(x, dz));
    return [clamp(yaw / LOOK.yaw, -1, 1), clamp(pitch / (pitch > 0 ? LOOK.pitchDown : LOOK.pitchUp), -1, 1)];
  }
  /** Its hand looked at from this far in front of the head's middle (about where the eyes are). */
  const HAND_LOOK = { from: 250 };
  // ---- head moves (the attention hooks' own, and the limbs' quirks ask for some)
  function slowBlink(hold?: number) {
    if (!lively() || lid.v > 0) return;
    blink.start = S.t; blink.timing = hold === undefined ? SLOW_BLINK : { ...SLOW_BLINK, hold };
  }
  function widen(amount: number, seconds: number) {
    if (reduceMotion) return;
    wide.target = 1 + amount; wideUntil = S.t + seconds;
  }
  function tiltToward(dir: number, degrees?: number) {
    if (reduceMotion || reveal < 1) return;
    const side = dir < 0 ? -1 : 1;
    tilt.streak = side === tilt.lastSide ? tilt.streak + 1 : 1; tilt.lastSide = side;
    tiltTo(side, degrees); tilt.resettled = false;
    tilt.speed = rand(6, 8);   // a perk rather than a lean
    tilt.at = S.t;
    if (tilts.on) tilt.next = S.t + rand(tilts.min, tilts.max);
    else cuedUntil = S.t + rand(...CUED_HOLD);
  }
  function stretch() {
    if (reduceMotion) return;
    stretchStart = S.t;
  }
  /**
   * The head joins in with what the limbs do (see limbs.ts), by the quirk and the side doing it (0
   * the `.R`, on the viewer's right): a wave comes with a tilt toward the hand, taps on the helmet
   * with a thinking tilt toward them, hands on its cheeks with a slow, pleased blink, a clap with
   * its eyes widened a moment, a stretch with its own stretch.
   */
  function headJoins(quirk: QuirkName, side: Side) {
    const toward = side === 0 ? 1 : -1;
    if (quirk === "wave") tiltToward(toward, 9);
    else if (quirk === "tap") tiltToward(toward, 12);
    else if (quirk === "cheeks") slowBlink(0.35);
    else if (quirk === "pat") widen(0.08, 1.4);
    else if (quirk === "stretch") stretch();
  }
  /** Until dispose: a suit model arriving after it has nothing to repaint. */
  let alive = true;
  blinkAmount = FORCED_BLINK ?? 0;
  breathe(0);
  render(FORCED ? FORCED[0] : 0, FORCED ? FORCED[1] : 0, FORCED_ROLL ?? 0);

  return {
    canvas,
    update: frame,
    closeEyes() {
      lid.v = 1; lid.start = -1;
    },
    openEyes(seconds) {
      lid.from = lid.v; lid.start = S.t; lid.dur = reduceMotion ? 0 : seconds;
      if (blink.start < 0) blink.next = Math.max(blink.next, S.t + lid.dur + WAKE_BLINK_GAP);
    },
    slowBlink,
    glance() {
      if (!lively()) return;
      const dir = S.yaw.v + tilt.yaw.v > 0 ? -1 : 1;   // away from where it was looking
      if (!reduceMotion) { away.turn.target = dir * GLANCE.yaw; away.until = S.t + GLANCE.hold; }
      away.eyes = dir; away.eyesUntil = S.t + GLANCE.hold;
      gaze.x.target = dir * GAZE.x; gaze.next = S.t + GLANCE.hold;
    },
    blink() {
      if (!lively() || lid.v > 0 || blink.start >= 0) return;
      blink.start = S.t; blink.timing = BLINK; blink.cued = true; blink.double = false;
    },
    lookAt(nx, ny = 0, how) {
      if (nx === null) { look.on = false; look.headAt = -1; gaze.next = S.t; return; }
      if (!look.on) {   // the head was on the pointer (or ahead): the lead starts from where it has got to
        look.fx = look.fy = 0;
        look.hx = S.yaw.v / LOOK.yaw; look.hy = lookOfPitch(S.pitch.v);
      }
      look.on = true; look.nx = clamp(nx, -1, 1); look.ny = clamp(ny, -1, 1);   // the pupils go at once; the head follows on its springs
      if (how === "snap") {   // already there: head, pupils and all
        look.hx = look.nx; look.hy = look.ny; look.headAt = -1;
        if (!reduceMotion) { [S.yaw.v, S.pitch.v] = headAim(look.nx, look.ny); S.yaw.vel = S.pitch.vel = 0; }
        gaze.x.v = gaze.x.target = look.nx * GAZE.x; gaze.y.v = gaze.y.target = look.ny * GAZE.y;
        return;
      }
      if (look.headAt < 0 && Math.hypot(look.nx - look.hx, look.ny - look.hy) > LEAD.jump) look.headAt = S.t + LEAD.seconds;
      if (how === "quick") look.quick = S.t + LEAD.quick;
    },
    deepBreath(inhale, exhale, depth) {
      breath.deep = { start: S.t, inhale: Math.max(0.05, inhale), exhale: Math.max(0.05, exhale), depth, from: breath.w };
    },
    setReveal(r) {
      reveal = clamp(r, 0, 1);
    },
    setResolution(boxPx) {
      const next = URCHI_BOX.w / Math.max(8, boxPx);
      if (Math.abs(next - CELL) < 1e-9) return;
      CELL = next;
      canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
      rimMask = new Uint8Array(canvas.width * canvas.height);
      revealMask = null; revealDist = null; lastPx = null; lastHead = null; lastDrawn = null; suitHit = null;
    },
    setRim(units) {
      rim = units === null ? null : Math.max(0, units);
    },
    setSuit(amount) {
      const next = clamp(amount, 0, 1);
      if (next === suit) return;
      suit = next;
      // the first time, the model comes after: the head paints bare until it is here, then the suit shows
      if (suit > 0 && !SUIT) preloadSuit().then(() => { if (alive) { HV = headFor(suit); fitFrame(); lastDrawn = null; } }, () => {});
      HV = headFor(suit);
      fitFrame();
      lastDrawn = null;
    },
    get suit() {
      return suit;
    },
    get limbs() {
      return limbsNow();
    },
    get frame() {
      return frameNow();
    },
    alphaAt(u, v) {
      if (SMOOTH && suited()) {
        const h = suitHit;
        if (!h || !lastToCanvas) return false;
        if (!h.shape) {
          // while the helmet rises, apart from the rest: only what of it is below the level counts
          const R = suitRig(), shape = (h.shape = new Path2D()), helmet = (h.helmet = h.helmetLine ? new Path2D() : shape);
          for (const g of h.planes) planeInto(R, R.parts[R.planePart[g]].rigid ? helmet : shape, g, h.post);
        }
        // (the rim along the level line reaches that far above it)
        const x = u * canvas.width, y = (1 - v) * canvas.height, risen = (y - lastToCanvas[5]) / lastToCanvas[3] >= h.level - rimWidth() - BASE;
        ctx.save();
        ctx.setTransform(...lastToCanvas);
        ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = 2 * (rimWidth() + BASE);
        const on = ctx.isPointInPath(h.shape, x, y) || ctx.isPointInStroke(h.outline, x, y) || (!!h.head && (ctx.isPointInPath(h.head, x, y) || ctx.isPointInStroke(h.head, x, y)))
          || (!!h.helmetLine && risen && (ctx.isPointInPath(h.helmet!, x, y) || ctx.isPointInStroke(h.helmetLine, x, y)));
        ctx.restore();
        return on;
      }
      if (SMOOTH) {
        if (!lastHead || !lastToCanvas) return false;
        const x = u * canvas.width, y = (1 - v) * canvas.height;
        ctx.save();
        ctx.setTransform(...lastToCanvas);
        ctx.lineJoin = "round"; ctx.lineWidth = 2 * (rimWidth() + BASE);
        const on = ctx.isPointInPath(lastHead, x, y) || ctx.isPointInStroke(lastHead, x, y);
        ctx.restore();
        return on;
      }
      if (!lastPx) return false;
      const x = Math.floor(u * canvas.width), y = Math.floor((1 - v) * canvas.height);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false;
      return lastPx[(y * canvas.width + x) * 4 + 3] > 0;
    },

    // ---- attention hooks
    attend() {
      attended = true;
      gaze.instant = reduceMotion && !STILL;
    },
    eyesTo(ex, ey = 0) {
      if (ex === null) { eyes.on = false; gaze.next = S.t; return; }
      eyes.on = true; eyes.x = clamp(ex, -1, 1); eyes.y = clamp(ey, -1, 1);
    },
    fixate(on) {
      if (on === gaze.fixed) return;
      gaze.fixed = on;
      if (on) { look.fx *= FIX.flick / GAZE.flick; look.fy *= FIX.flick / GAZE.flick; gaze.next = S.t + rand(...FIX.gap); }
    },
    setDarts(mode) {
      if (mode === gaze.darts) return;
      gaze.darts = mode; gaze.next = S.t;
    },
    converge(amount) {
      gaze.conv.target = clamp(amount, 0, 1);
    },
    widen,
    dip() {
      if (!lively()) return;
      gaze.h.target = 0.9; gaze.undip = S.t + 0.3;
    },
    pauseBreath(seconds) {
      breath.hold = Math.max(breath.hold, S.t + seconds);
    },
    setBreathPeriod(seconds) {
      breath.toPeriod = Math.max(1, seconds);
    },
    setBreathDepth(depth) {
      breath.base = Math.max(0, depth);
    },
    setBlinkGap(min, max) {
      blink.gap = [Math.max(0.2, min), Math.max(min, max)];
      // a blink already drawn waits its gap, unless it is longer than any the new gap allows
      if (blink.start < 0 && !blink.double) blink.next = Math.min(blink.next, S.t + blink.gap[1] * BLINK_GAP.most);
    },
    setBlinkHold(seconds) {
      BLINK.hold = clamp(seconds, 0.05, 2);
    },
    setRestLid(v) {
      const to = clamp(v, 0, 0.5);
      if (Math.abs(to - restLid.to) > 1e-3) easeTo(restLid, to, reduceMotion ? 0 : 1.2);
    },
    setLids(left, right, seconds = 0) {
      const dur = reduceMotion ? 0 : seconds;
      easeTo(eyeLids[0], clamp(left, 0, 1), dur); easeTo(eyeLids[1], clamp(right, 0, 1), dur);
    },
    tiltToward,
    setTilts(gap) {
      tilts.on = !!gap;
      if (gap) { tilts.min = gap[0]; tilts.max = Math.max(gap[0], gap[1]); tilt.next = Math.min(tilt.next, S.t + tilts.max); cuedUntil = -1; }
    },
    sway(degrees, period = 3.4) {
      swaying.amp.target = Math.abs(degrees) * D2R; swaying.period = Math.max(0.5, period);
    },
    bob() {
      // Not over a tilt still swinging: its 6-15 degrees would swamp the bob's 3.
      const swinging = S.t - tilt.at < BOB.clear || Math.abs(tilt.roll.v - tilt.roll.target) > BOB.settled;
      if (reduceMotion || bobStart >= 0 || swinging) return false;
      bobStart = S.t;
      // and no random tilt starts while it judges the distance
      tilt.next = Math.max(tilt.next, S.t + BOB.cycles / BOB.hz + BOB.after);
      return true;
    },
    stretch,
    pose(yaw, pitch, roll, speed = 6) {
      pose.yaw.target = yaw * D2R; pose.pitch.target = pitch * D2R; pose.roll.target = roll * D2R; pose.speed = speed;
    },
    kick(yaw, pitch, roll) {
      pose.yaw.vel += yaw * D2R; pose.pitch.vel += pitch * D2R; pose.roll.vel += roll * D2R;
    },
    doubleBlink() {
      if (!lively() || lid.v > 0) return;
      blink.start = S.t; blink.timing = BLINK; blink.cued = false; blink.double = false; blink.twice = true;
    },
    setFace(f) {
      if (f === (faces.next ?? faces.now)) return;
      // shut already, or no blinks to hide it in: at once
      if (reduceMotion || !lively() || Math.max(lidOf(0), lidOf(1)) >= SHUT) {
        faces.now = f; faces.next = null;
        return;
      }
      faces.next = f;
      // (a blink under way hides it as well)
      if (blink.start < 0) { blink.start = S.t; blink.timing = BLINK; blink.cued = true; blink.double = false; }
    },
    get face() {
      return faces.next ?? faces.now;
    },
    get breath() {
      return breath.w;
    },
    get shut() {
      return Math.max(lidOf(0), lidOf(1));
    },
    dispose() {
      alive = false;
      listeners.forEach(([type, fn, opts]) => window.removeEventListener(type, fn, opts));
      listeners.length = 0;
      clearTimeout(release);
    },
  };
}
