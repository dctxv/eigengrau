import * as THREE from "three";
import gsap from "gsap";
import { GL } from "@/engine/common/color";
import type { RoomScene } from "./RoomScene";

type Point = { x: number; y: number };

/**
 * The rope: `nodes` nodes, stepped `fps` times a second (drawn every frame between the last two
 * steps), ink at `alpha`, `width` CSS px, each span drawn as `smooth` pieces of a curve through the
 * nodes. Zero gravity: nothing pulls it down; it keeps its momentum a little (`damping` per step),
 * wanders lazily (`wander` px/s² at most, a slow sway that travels along it as a wave, `wave` of a
 * turn from end to end, so neighbours move together), and while it is slack it is drawn toward a
 * lazy S as long as itself (see depthFor) with a pull of `hold` per second, so the slack lies in
 * curves rather than tangling. It resists bending a little (`bend`: each step every node goes that
 * share of the way to the middle of its neighbours), so however it is pulled about it curves and
 * never kinks. Its spans may bunch but never stretch: pulled to its length, it runs straight.
 */
const ROPE = { nodes: 32, fps: 60, alpha: 0.35, width: 1.5, smooth: 6, damping: 0.95, wander: 14, wave: 0.8, hold: 2.5, bend: 0.2, iterations: 12 };
/** The S is never deeper than this many times the distance between the ends (it then bunches rather than looping out). */
const DEEPEST = 3;
/**
 * Snapped: it breaks `at` of the way from the root. The root's piece recoils toward the root at up
 * to `recoil` px/s (its free end the fastest), its spans shrinking to `shrink` of themselves over
 * `shrinkFor` seconds as the stretch comes out of it, and fades over `fade`; the other piece trails
 * behind Urchi, `damping` per step, until Urchi has gone and the line is hidden.
 */
const SNAP = { at: 0.6, recoil: 2600, shrink: 0.6, shrinkFor: 0.3, fade: 0.7, damping: 0.9 };

/** How the line looks, for what is drawn to match it (Space's zoom slider): its width in CSS px and its ink's opacity. */
export const LINE_LOOK = { width: ROPE.width, alpha: ROPE.alpha } as const;

/** The S the slack lies in: two lobes, the second smaller, so it comes to the backpack nearly straight. */
const lobe = (u: number) => Math.sin(2 * Math.PI * u) * (1 - u);
/** How long the S is, over the distance between its ends, at depths 0 .. DEEPEST in 64 steps. */
const LONG = (() => {
  const out = new Float64Array(65);
  for (let j = 0; j <= 64; j++) {
    const a = (DEEPEST * j) / 64;
    for (let i = 1; i <= 64; i++) out[j] += Math.hypot(1 / 64, a * (lobe(i / 64) - lobe((i - 1) / 64)));
  }
  return out;
})();
/** The S's depth that makes it `ratio` times as long as the distance between its ends (0 when taut). */
function depthFor(ratio: number) {
  if (ratio <= 1) return 0;
  if (ratio >= LONG[64]) return DEEPEST;
  let j = 1;
  while (LONG[j] < ratio) j++;
  return (DEEPEST * (j - 1 + (ratio - LONG[j - 1]) / (LONG[j] - LONG[j - 1]))) / 64;
}

/**
 * Nodes `from` .. `to` of xs, ys (either way round) as a Catmull-Rom curve, ROPE.smooth samples a
 * span: into sx, sy; returns how many.
 */
function curve(xs: Float64Array, ys: Float64Array, from: number, to: number, sx: Float64Array, sy: Float64Array) {
  const count = Math.abs(to - from) + 1, dir = to >= from ? 1 : -1;
  const S = ROPE.smooth, node = (i: number) => from + dir * Math.min(count - 1, Math.max(0, i));
  for (let i = 0; i < count - 1; i++) {
    const i0 = node(i - 1), i1 = node(i), i2 = node(i + 1), i3 = node(i + 2);
    for (let s = 0; s < S; s++) {
      const u = s / S, u2 = u * u, u3 = u2 * u;
      const c = (p0: number, p1: number, p2: number, p3: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
      sx[i * S + s] = c(xs[i0], xs[i1], xs[i2], xs[i3]);
      sy[i * S + s] = c(ys[i0], ys[i1], ys[i2], ys[i3]);
    }
  }
  const samples = (count - 1) * S + 1, last = node(count - 1);
  sx[samples - 1] = xs[last];
  sy[samples - 1] = ys[last];
  return samples;
}

/** A curve through some of the nodes, drawn as a ribbon ROPE.width wide, in the room's scene behind Urchi. */
class Ribbon {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private positions: Float32Array;
  private sx: Float64Array;
  private sy: Float64Array;

  constructor(scene: THREE.Scene, nodes: number) {
    const most = (nodes - 1) * ROPE.smooth + 1;
    this.positions = new Float32Array(most * 2 * 3);
    this.sx = new Float64Array(most);
    this.sy = new Float64Array(most);
    const index: number[] = [];
    for (let i = 0; i < most - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(index);
    const material = new THREE.MeshBasicMaterial({ color: GL.ink, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.renderOrder = -0.5; // behind Urchi, over the motes
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /** Nodes `from` .. `to` of xs, ys (either way round) as a Catmull-Rom curve, at `opacity` of the rope's ink. */
  draw(xs: Float64Array, ys: Float64Array, from: number, to: number, opacity: number) {
    const count = Math.abs(to - from) + 1;
    this.mesh.visible = opacity > 0 && count > 1;
    if (!this.mesh.visible) return;
    this.mesh.material.opacity = ROPE.alpha * opacity;
    const sx = this.sx, sy = this.sy, samples = curve(xs, ys, from, to, sx, sy);
    const P = this.positions, half = ROPE.width / 2;
    for (let i = 0; i < samples; i++) {
      // the ribbon's width across the curve here
      const j = Math.min(samples - 1, i + 1), h = Math.max(0, i - 1);
      let tx = sx[j] - sx[h], ty = sy[j] - sy[h];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      P[i * 6] = sx[i] - ty * half; P[i * 6 + 1] = sy[i] + tx * half; P[i * 6 + 2] = 0;
      P[i * 6 + 3] = sx[i] + ty * half; P[i * 6 + 4] = sy[i] - tx * half; P[i * 6 + 5] = 0;
    }
    this.mesh.geometry.setDrawRange(0, (samples - 1) * 6);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/** The room's pixelation grid: its cell in device px, device px per CSS px across and up, and the room's size (CSS px). */
type Grid = { cell: number; sx: number; sy: number; w: number; h: number };

/**
 * The same curve pixelated (Urchi zoomed out afloat, see RoomScene's ZOOM): drawn in whole cells of
 * the room's pixelation grid, the one gl_FragCoord cuts the screen into from its bottom left, so
 * Urchi's own. A cell is drawn if its centre is within half a cell of the curve, which makes a line
 * a cell thick, and each is drawn once, however the curve doubles back.
 */
class Cells {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private positions = new Float32Array(0);
  private sx: Float64Array;
  private sy: Float64Array;
  /** The cells drawn this frame, as keys (see key). */
  private on = new Set<number>();

  constructor(scene: THREE.Scene, nodes: number) {
    const most = (nodes - 1) * ROPE.smooth + 1;
    this.sx = new Float64Array(most);
    this.sy = new Float64Array(most);
    const material = new THREE.MeshBasicMaterial({ color: GL.ink, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.mesh.renderOrder = -0.5; // where the ribbon is: behind Urchi, over the motes
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.fit(256);
    scene.add(this.mesh);
  }

  /** Room for `cells` squares. */
  private fit(cells: number) {
    this.positions = new Float32Array(cells * 4 * 3);
    const index = new Uint32Array(cells * 6);
    for (let k = 0; k < cells; k++) index.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3], k * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
  }

  /** A cell's key, from its column and row (a room a few thousand cells across, the root's just past its left edge). */
  private static key = (i: number, j: number) => (i + 1024) * 8192 + (j + 1024);

  /** Nodes `from` .. `to` of xs, ys (either way round), the curve as the ribbon has it, in cells of `g`, at `opacity` of the rope's ink. */
  draw(xs: Float64Array, ys: Float64Array, from: number, to: number, opacity: number, g: Grid) {
    this.mesh.visible = opacity > 0 && from !== to;
    if (!this.mesh.visible) return;
    this.mesh.material.opacity = ROPE.alpha * opacity;
    // a cell thick, but never thinner than the line is smooth (the finest cells are a device pixel)
    const n = curve(xs, ys, from, to, this.sx, this.sy), c = g.cell, half = Math.max(c, LINE_LOOK.width * g.sx) / 2, on = this.on;
    on.clear();
    // each piece of the curve, in device px from the bottom left: the cells whose centres are near it
    const X = (k: number) => (this.sx[k] + g.w / 2) * g.sx, Y = (k: number) => (this.sy[k] + g.h / 2) * g.sy;
    let ax = X(0), ay = Y(0);
    for (let k = 1; k < n; k++) {
      const bx = X(k), by = Y(k), dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      const i0 = Math.ceil((Math.min(ax, bx) - half) / c - 0.5), i1 = Math.floor((Math.max(ax, bx) + half) / c - 0.5);
      const j0 = Math.ceil((Math.min(ay, by) - half) / c - 0.5), j1 = Math.floor((Math.max(ay, by) + half) / c - 0.5);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const cx = (i + 0.5) * c, cy = (j + 0.5) * c;
          const t = l2 > 0 ? Math.min(1, Math.max(0, ((cx - ax) * dx + (cy - ay) * dy) / l2)) : 0;
          if (Math.hypot(cx - ax - t * dx, cy - ay - t * dy) <= half) on.add(Cells.key(i, j));
        }
      }
      ax = bx;
      ay = by;
    }
    if (on.size * 12 > this.positions.length) this.fit(Math.max(on.size, (this.positions.length / 12) * 2));
    // the squares, back in room px
    const P = this.positions, w = c / g.sx, h = c / g.sy;
    let q = 0;
    for (const key of on) {
      const x = (Math.floor(key / 8192) - 1024) * w - g.w / 2, y = ((key % 8192) - 1024) * h - g.h / 2;
      P.set([x, y, 0, x + w, y, 0, x, y + h, 0, x + w, y + h, 0], q * 12);
      q++;
    }
    this.mesh.geometry.setDrawRange(0, q * 6);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/**
 * Urchi's line (Space, taken with you): from its root just past the left edge to the clip on the
 * backpack, a rope `length` long, a 1.5px ink line at 35% in the room's own scene, behind Urchi, so
 * the figure covers the end that clips on. A zero-gravity verlet rope: slack, it lies in lazy
 * curves; pulled to its length it runs straight (the float gives the pull its give, see Float.ts).
 * Snapped, it is two ropes: the root's end recoils away off the left edge and fades, and the other
 * end trails behind Urchi. Under reduced motion it holds its curve still, and a snap takes it away.
 * While Urchi is pixelated (zoomed out afloat) it is drawn in the same cells (see Cells).
 */
export class Tether {
  private room: RoomScene;
  private root: () => Point;
  private clip: () => Point | null;
  private length: () => number;
  private reduced: boolean;
  private n = ROPE.nodes;
  private x = new Float64Array(ROPE.nodes);
  private y = new Float64Array(ROPE.nodes);
  private px = new Float64Array(ROPE.nodes);
  private py = new Float64Array(ROPE.nodes);
  /** Where each node would lie in the S (or, drawing, where it is between steps). */
  private tx = new Float64Array(ROPE.nodes);
  private ty = new Float64Array(ROPE.nodes);
  private phase = new Float64Array(ROPE.nodes);
  /** Scratch for the bending pass. */
  private bx = new Float64Array(ROPE.nodes);
  private by = new Float64Array(ROPE.nodes);
  /** Which way the S bends: laid at random each time. */
  private side = 1;
  private laid = false;
  private acc = 0;
  private t = 0;
  /** How much of it shows, 0 .. 1. Tweened. */
  private shown = { v: 0 };
  /** Snapped: the root's piece is nodes 0 .. k and Urchi's k + 1 .. the last; their spans (a share of the whole's), and how much of the root's piece shows. */
  private broken: { k: number; span: { v: number }; fade: { v: number } } | null = null;
  private line: Ribbon;
  private rootEnd: Ribbon;
  /** The two pieces again, pixelated. */
  private lineCells: Cells;
  private rootCells: Cells;
  private stop: () => void;

  constructor(room: RoomScene, o: { root: () => Point; clip: () => Point | null; length: () => number; reducedMotion: boolean }) {
    this.room = room;
    this.root = o.root;
    this.clip = o.clip;
    this.length = o.length;
    this.reduced = o.reducedMotion;
    this.line = new Ribbon(room.scene, ROPE.nodes);
    this.rootEnd = new Ribbon(room.scene, ROPE.nodes);
    this.lineCells = new Cells(room.scene, ROPE.nodes);
    this.rootCells = new Cells(room.scene, ROPE.nodes);
    const p0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < this.n; i++) this.phase[i] = p0 + (2 * Math.PI * ROPE.wave * i) / (this.n - 1);
    this.stop = room.afterUrchi((dt) => this.frame(dt));
  }

  /** Whether it is broken (snapped, and not yet hidden). */
  get snapped() {
    return this.broken !== null;
  }

  /** Laid along its S between its ends (at once, if not already), and shown over `seconds`. */
  show(seconds: number) {
    this.laid = false;
    this.broken = null;
    gsap.killTweensOf(this.shown);
    if (seconds <= 0) this.shown.v = 1;
    else gsap.to(this.shown, { v: 1, duration: seconds, ease: "power2.out" });
  }

  /** Hidden over `seconds` (0 at once); gone, it is whole again, to be laid afresh when next shown. */
  hide(seconds: number) {
    gsap.killTweensOf(this.shown);
    const gone = () => {
      this.shown.v = 0;
      this.laid = false;
      this.broken = null;
    };
    if (seconds <= 0) gone();
    else gsap.to(this.shown, { v: 0, duration: seconds, ease: "power2.out", onComplete: gone });
  }

  /**
   * It breaks (see SNAP): the root's piece recoils off the left edge and fades, and Urchi's trails
   * behind it. Under reduced motion both simply fade.
   */
  snap() {
    if (this.broken || !this.laid) return;
    if (this.reduced) {
      this.hide(0.3);
      return;
    }
    const n = this.n, k = Math.round(SNAP.at * (n - 1)), a = this.root(), h = 1 / ROPE.fps;
    const b = { k, span: { v: 1 }, fade: { v: 1 } };
    this.broken = b;
    gsap.to(b.span, { v: SNAP.shrink, duration: SNAP.shrinkFor, ease: "power2.out" });
    gsap.to(b.fade, { v: 0, duration: SNAP.fade, ease: "power1.in" });
    // the root's piece: back toward the root, its free end fastest (verlet: a velocity is where it was)
    for (let i = 1; i <= k; i++) {
      const dx = a.x - this.x[i], dy = a.y - this.y[i], d = Math.hypot(dx, dy) || 1, v = (SNAP.recoil * i) / k;
      this.px[i] = this.x[i] - (dx / d) * v * h;
      this.py[i] = this.y[i] - (dy / d) * v * h;
    }
  }

  /** The node's places along the S between a and b, the rope `long` px: into xs, ys. */
  private target(a: Point, b: Point, long: number, xs: Float64Array, ys: Float64Array) {
    const dx = b.x - a.x, dy = b.y - a.y, n = this.n;
    const s = this.side * depthFor(long / (Math.hypot(dx, dy) || 1));
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), off = s * lobe(u);
      xs[i] = a.x + dx * u - dy * off;
      ys[i] = a.y + dy * u + dx * off;
    }
  }

  /** Laid along its S now, at rest. */
  private lay(a: Point, b: Point) {
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.target(a, b, this.length(), this.x, this.y);
    this.px.set(this.x);
    this.py.set(this.y);
    this.laid = true;
  }

  /** Spans from `from` to `to` (a chain, `from` held where it is) no longer than `span`: corrections from the held end outward. */
  private keep(from: number, to: number, span: number, held: number[]) {
    const x = this.x, y = this.y, dir = to >= from ? 1 : -1;
    for (let i = from; i !== to; i += dir) {
      const j = i + dir, dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1e-6;
      if (d <= span) continue;
      const f = (d - span) / d, hi = held.includes(i), hj = held.includes(j);
      const wi = hi ? 0 : hj ? 1 : 0.5, wj = hj ? 0 : hi ? 1 : 0.5;
      x[i] += dx * f * wi; y[i] += dy * f * wi;
      x[j] -= dx * f * wj; y[j] -= dy * f * wj;
    }
  }

  /** Its resistance to bending: each node from `from` to `to` (inside a piece, its ends held) a share of the way to the middle of its neighbours. */
  private unbend(from: number, to: number) {
    const x = this.x, y = this.y, bx = this.bx, by = this.by;
    for (let i = from; i <= to; i++) {
      bx[i] = x[i] + ((x[i - 1] + x[i + 1]) / 2 - x[i]) * ROPE.bend;
      by[i] = y[i] + ((y[i - 1] + y[i + 1]) / 2 - y[i]) * ROPE.bend;
    }
    for (let i = from; i <= to; i++) {
      x[i] = bx[i];
      y[i] = by[i];
    }
  }

  /** One step of the rope, h seconds: zero-g verlet with its ends held, the lazy wander and, slack, the pull toward its S. */
  private step(a: Point, b: Point, h: number) {
    const n = this.n, x = this.x, y = this.y, px = this.px, py = this.py, long = this.length(), span = long / (n - 1);
    const br = this.broken;
    this.t += h;
    if (!br) this.target(a, b, long, this.tx, this.ty);
    for (let i = 0; i < n; i++) {
      const vx = (x[i] - px[i]) * (br ? SNAP.damping : ROPE.damping), vy = (y[i] - py[i]) * (br ? SNAP.damping : ROPE.damping);
      px[i] = x[i];
      py[i] = y[i];
      let ax = 0, ay = 0;
      if (!br) {
        const w = ROPE.wander * h * h, p = this.phase[i];
        ax = w * Math.sin(this.t * 0.7 + p) + (this.tx[i] - x[i]) * ROPE.hold * h;
        ay = w * Math.cos(this.t * 0.53 + p * 1.3) + (this.ty[i] - y[i]) * ROPE.hold * h;
      }
      x[i] += vx + ax;
      y[i] += vy + ay;
    }
    if (!br) {
      x[0] = a.x; y[0] = a.y; x[n - 1] = b.x; y[n - 1] = b.y;
      this.unbend(1, n - 2);
      for (let k = 0; k < ROPE.iterations; k++) {
        this.keep(0, n - 1, span, [0, n - 1]);
        this.keep(n - 1, 0, span, [0, n - 1]);
      }
      return;
    }
    // snapped: two pieces, each held at its own end, their spans shrinking as the stretch comes out
    x[0] = a.x; y[0] = a.y; x[n - 1] = b.x; y[n - 1] = b.y;
    this.unbend(1, br.k - 1);
    this.unbend(br.k + 2, n - 2);
    const s = span * br.span.v;
    for (let k = 0; k < ROPE.iterations; k++) {
      this.keep(0, br.k, s, [0]);
      this.keep(n - 1, br.k + 1, s, [n - 1]);
    }
  }

  private frame(dt: number) {
    const on = this.shown.v > 0;
    const b = on ? this.clip() : null;
    if (!b) {
      this.line.mesh.visible = this.rootEnd.mesh.visible = this.lineCells.mesh.visible = this.rootCells.mesh.visible = false;
      return;
    }
    const a = this.root(), n = this.n;
    if (!this.laid) this.lay(a, b);
    let k = 1;
    if (this.reduced) {
      // still: its S, laid again where its ends are
      this.target(a, b, this.length(), this.x, this.y);
      this.px.set(this.x);
      this.py.set(this.y);
    } else {
      const H = 1 / ROPE.fps;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= H && steps < 4) {
        this.step(a, b, H);
        this.acc -= H;
        steps++;
      }
      if (steps === 4) this.acc = 0;
      k = this.acc / H;
    }
    // the nodes between the last two steps, the held ends where they are this frame
    const nx = this.tx, ny = this.ty;
    for (let i = 0; i < n; i++) {
      nx[i] = this.px[i] + (this.x[i] - this.px[i]) * k;
      ny[i] = this.py[i] + (this.y[i] - this.py[i]) * k;
    }
    nx[0] = a.x; ny[0] = a.y; nx[n - 1] = b.x; ny[n - 1] = b.y;
    const br = this.broken, cell = this.room.pixelCell;
    if (cell > 0) {
      // Urchi pixelated: the line in its cells
      const c = this.room.canvas, room = this.room;
      const g: Grid = { cell, sx: c.width / room.width, sy: c.height / room.height, w: room.width, h: room.height };
      this.line.mesh.visible = this.rootEnd.mesh.visible = false;
      if (!br) {
        this.lineCells.draw(nx, ny, 0, n - 1, this.shown.v, g);
        this.rootCells.mesh.visible = false;
      } else {
        this.lineCells.draw(nx, ny, n - 1, br.k + 1, this.shown.v, g);
        this.rootCells.draw(nx, ny, 0, br.k, this.shown.v * br.fade.v, g);
      }
      return;
    }
    this.lineCells.mesh.visible = this.rootCells.mesh.visible = false;
    if (!br) {
      this.line.draw(nx, ny, 0, n - 1, this.shown.v);
      this.rootEnd.mesh.visible = false;
    } else {
      this.line.draw(nx, ny, n - 1, br.k + 1, this.shown.v);
      this.rootEnd.draw(nx, ny, 0, br.k, this.shown.v * br.fade.v);
    }
  }

  dispose() {
    this.stop();
    gsap.killTweensOf(this.shown);
    if (this.broken) {
      gsap.killTweensOf(this.broken.span);
      gsap.killTweensOf(this.broken.fade);
    }
    this.line.dispose(this.room.scene);
    this.rootEnd.dispose(this.room.scene);
    this.lineCells.dispose(this.room.scene);
    this.rootCells.dispose(this.room.scene);
  }
}
