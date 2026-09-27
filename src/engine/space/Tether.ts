import * as THREE from "three";
import gsap from "gsap";
import { GL } from "@/engine/common/color";
import type { RoomScene } from "./RoomScene";

type Point = { x: number; y: number };

/**
 * The rope: `nodes` nodes, `slack` longer than the straight line between its ends, stepped `fps`
 * times a second (drawn every frame between the last two steps). It is ink at `alpha`, `width` CSS
 * px, each span drawn as `smooth` pieces of a curve through the nodes. Zero gravity: nothing pulls
 * it down; it keeps its momentum a little (`damping` per step), wanders lazily (`wander` px/s² at
 * most, a slow different sway for each node), and is drawn back toward the lazy S it was laid in
 * with a pull of `hold` per second, so it never tangles or strays into the tab bar. It bends
 * gently: two spans apart, its nodes stay at least `bend` spans from each other (no sharp kinks).
 */
const ROPE = { nodes: 12, slack: 0.15, fps: 30, alpha: 0.35, width: 1, smooth: 4, damping: 0.96, wander: 14, hold: 0.6, iterations: 10, bend: 1.6 };

/**
 * The tether (panel 2, the spacesuit): from the ring peg on Space's left wall to Urchi's backpack
 * while it is suited, a 1px ink line at 35% in the room's own scene, behind Urchi, so the figure
 * covers the end that clips on. A zero-gravity verlet rope lying in lazy curves. It draws on from
 * the peg to the backpack, and reels back into the peg. Under reduced motion it is straight and still.
 */
export class Tether {
  private room: RoomScene;
  private from: () => Point | null;
  private to: () => Point | null;
  private reduced: boolean;
  private n = ROPE.nodes;
  private x = new Float64Array(ROPE.nodes);
  private y = new Float64Array(ROPE.nodes);
  private px = new Float64Array(ROPE.nodes);
  private py = new Float64Array(ROPE.nodes);
  /** The lazy S it was laid in: each node's offset across the line, as a share of the line's length. */
  private shape = new Float64Array(ROPE.nodes);
  private phase = new Float64Array(ROPE.nodes);
  private laid = false;
  private acc = 0;
  private t = 0;
  /** How much of it shows, from the peg: 0 .. 1. Tweened. */
  private shown = { v: 0 };
  private material: THREE.MeshBasicMaterial;
  private mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private positions: Float32Array;
  private samples = (ROPE.nodes - 1) * ROPE.smooth + 1;
  private sx = new Float64Array((ROPE.nodes - 1) * ROPE.smooth + 1);
  private sy = new Float64Array((ROPE.nodes - 1) * ROPE.smooth + 1);
  private stop: () => void;

  constructor(room: RoomScene, o: { from: () => Point | null; to: () => Point | null; reducedMotion: boolean }) {
    this.room = room;
    this.from = o.from;
    this.to = o.to;
    this.reduced = o.reducedMotion;
    const m = this.samples;
    this.positions = new Float32Array(m * 2 * 3);
    const index: number[] = [];
    for (let i = 0; i < m - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(index);
    this.material = new THREE.MeshBasicMaterial({ color: GL.ink, transparent: true, opacity: ROPE.alpha, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.renderOrder = -0.5; // behind Urchi, over the motes
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    room.scene.add(this.mesh);
    this.stop = room.afterUrchi((dt) => this.frame(dt));
  }

  /** Whether any of it shows. */
  get visible() {
    return this.shown.v > 0;
  }

  /** Laid from the peg to the backpack in a lazy S and drawn on along it over `seconds` (0: there at once). */
  draw(seconds: number) {
    this.lay();
    gsap.killTweensOf(this.shown);
    this.material.opacity = ROPE.alpha;
    if (seconds <= 0) this.shown.v = 1;
    else gsap.fromTo(this.shown, { v: 0 }, { v: 1, duration: seconds, ease: "power2.out" });
  }

  /** Reeled in: its far end leaves the backpack and it runs back into the peg over `seconds` (0: gone at once). */
  reel(seconds: number) {
    gsap.killTweensOf(this.shown);
    if (seconds <= 0) this.shown.v = 0;
    else gsap.to(this.shown, { v: 0, duration: seconds, ease: "power2.in" });
  }

  /** Reduced motion's way in and out: all of it, straight, fading to `on` over `seconds`. */
  fade(on: boolean, seconds: number) {
    if (on) this.lay();
    gsap.killTweensOf(this.shown);
    gsap.killTweensOf(this.material);
    this.shown.v = 1;
    this.material.opacity = on ? 0 : ROPE.alpha;
    gsap.to(this.material, { opacity: on ? ROPE.alpha : 0, duration: seconds, ease: "power2.out", onComplete: () => { if (!on) this.shown.v = 0; } });
  }

  /** Faded out of the way (the game is up), or back, keeping its shape. */
  dim(on: boolean) {
    gsap.to(this.material, { opacity: on ? 0 : ROPE.alpha, duration: on ? 0.3 : 0.5, ease: "power2.out", overwrite: true });
  }

  /** The nodes along a lazy S between its ends now, as long as the rope is, at rest. */
  private lay() {
    const a = this.from(), b = this.to();
    if (!a || !b) return;
    const n = this.n, side = Math.random() < 0.5 ? -1 : 1;
    // an S of two lobes, the second smaller, so it comes to the backpack nearly straight (behind the
    // body) rather than up from under an arm, as deep as makes it the rope's own length (no slack
    // left over to gather in a kink)
    const lobe = (u: number) => Math.sin(2 * Math.PI * u) * (1 - u);
    const long = (amp: number) => {
      let l = 0;
      for (let i = 1; i <= 64; i++) l += Math.hypot(1 / 64, amp * (lobe(i / 64) - lobe((i - 1) / 64)));
      return l;
    };
    let lo = 0, hi = 1;
    for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (long(mid) < 1 + ROPE.slack) lo = mid; else hi = mid; }
    for (let i = 0; i < n; i++) {
      this.shape[i] = lo * side * lobe(i / (n - 1));
      this.phase[i] = Math.random() * Math.PI * 2;
    }
    this.target(a, b, this.x, this.y);
    this.px.set(this.x);
    this.py.set(this.y);
    this.laid = true;
  }

  /** Where each node would be in the laid S between a and b: into xs, ys. */
  private target(a: Point, b: Point, xs: Float64Array, ys: Float64Array) {
    const dx = b.x - a.x, dy = b.y - a.y, n = this.n;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), s = this.reduced ? 0 : this.shape[i];
      xs[i] = a.x + dx * u - dy * s;
      ys[i] = a.y + dy * u + dx * s;
    }
  }

  private tx = new Float64Array(ROPE.nodes);
  private ty = new Float64Array(ROPE.nodes);

  /** One step of the rope, h seconds: zero-g verlet with its ends held, the lazy wander and the pull back to its S. */
  private step(a: Point, b: Point, h: number) {
    const n = this.n, x = this.x, y = this.y, px = this.px, py = this.py;
    this.target(a, b, this.tx, this.ty);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const rest = (len * (1 + ROPE.slack)) / (n - 1);
    this.t += h;
    for (let i = 1; i < n - 1; i++) {
      const vx = (x[i] - px[i]) * ROPE.damping, vy = (y[i] - py[i]) * ROPE.damping;
      px[i] = x[i];
      py[i] = y[i];
      const w = ROPE.wander * h * h, p = this.phase[i];
      const ax = w * Math.sin(this.t * 0.7 + p) + (this.tx[i] - x[i]) * ROPE.hold * h;
      const ay = w * Math.cos(this.t * 0.53 + p * 1.3) + (this.ty[i] - y[i]) * ROPE.hold * h;
      x[i] += vx + ax;
      y[i] += vy + ay;
    }
    x[0] = a.x; y[0] = a.y; x[n - 1] = b.x; y[n - 1] = b.y;
    // each span back to its length, and no bend sharper than `bend` allows, the ends held where they are
    const pull = (i: number, j: number, want: number, stretch: boolean) => {
      const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1e-6;
      if (!stretch && d >= want) return;
      const f = (d - want) / d;
      const wi = i === 0 ? 0 : j === n - 1 ? 1 : 0.5, wj = j === n - 1 ? 0 : i === 0 ? 1 : 0.5;
      x[i] += dx * f * wi; y[i] += dy * f * wi;
      x[j] -= dx * f * wj; y[j] -= dy * f * wj;
    };
    for (let k = 0; k < ROPE.iterations; k++) {
      for (let i = 0; i < n - 2; i++) pull(i, i + 2, rest * ROPE.bend, false);
      for (let i = 0; i < n - 1; i++) pull(i, i + 1, rest, true);
    }
  }

  private frame(dt: number) {
    const on = this.shown.v > 0 && this.material.opacity > 0;
    this.mesh.visible = on;
    if (!on || !this.laid) return;
    const a = this.from(), b = this.to();
    if (!a || !b) {
      this.mesh.visible = false;
      return;
    }
    const n = this.n, H = 1 / ROPE.fps;
    let k = 0;
    if (this.reduced) this.target(a, b, this.x, this.y);
    else {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= H && steps < 3) { this.step(a, b, H); this.acc -= H; steps++; }
      if (steps === 3) this.acc = 0;
      k = this.acc / H;
    }
    // the nodes between the last two steps, the ends where they are this frame
    const nx = this.tx, ny = this.ty;
    for (let i = 0; i < n; i++) { nx[i] = this.px[i] + (this.x[i] - this.px[i]) * k; ny[i] = this.py[i] + (this.y[i] - this.py[i]) * k; }
    if (this.reduced) { nx.set(this.x); ny.set(this.y); }
    nx[0] = a.x; ny[0] = a.y; nx[n - 1] = b.x; ny[n - 1] = b.y;
    // a curve through them (Catmull-Rom), then as much of it as shows, as a ribbon a pixel wide
    const S = ROPE.smooth, sx = this.sx, sy = this.sy;
    for (let i = 0; i < n - 1; i++) {
      const i0 = Math.max(0, i - 1), i3 = Math.min(n - 1, i + 2);
      for (let s = 0; s < S; s++) {
        const u = s / S, u2 = u * u, u3 = u2 * u;
        const c = (p0: number, p1: number, p2: number, p3: number) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
        sx[i * S + s] = c(nx[i0], nx[i], nx[i + 1], nx[i3]);
        sy[i * S + s] = c(ny[i0], ny[i], ny[i + 1], ny[i3]);
      }
    }
    sx[this.samples - 1] = nx[n - 1];
    sy[this.samples - 1] = ny[n - 1];
    let total = 0;
    for (let i = 1; i < this.samples; i++) total += Math.hypot(sx[i] - sx[i - 1], sy[i] - sy[i - 1]);
    const want = total * Math.min(1, this.shown.v);
    const P = this.positions, half = ROPE.width / 2;
    let run = 0, lastX = sx[0], lastY = sy[0], ended = false;
    for (let i = 0; i < this.samples; i++) {
      let x = sx[i], y = sy[i];
      if (i > 0 && !ended) {
        const seg = Math.hypot(x - sx[i - 1], y - sy[i - 1]);
        if (run + seg >= want) {
          const f = seg > 0 ? (want - run) / seg : 0;
          x = sx[i - 1] + (x - sx[i - 1]) * f;
          y = sy[i - 1] + (y - sy[i - 1]) * f;
          ended = true;
        }
        run += seg;
      } else if (ended) { x = lastX; y = lastY; }
      // the ribbon's width across the curve here
      const j = Math.min(this.samples - 1, i + 1), h = Math.max(0, i - 1);
      let tx = sx[j] - sx[h], ty = sy[j] - sy[h];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      P[i * 6] = x - ty * half; P[i * 6 + 1] = y + tx * half; P[i * 6 + 2] = 0;
      P[i * 6 + 3] = x + ty * half; P[i * 6 + 4] = y - tx * half; P[i * 6 + 5] = 0;
      lastX = x; lastY = y;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.stop();
    gsap.killTweensOf(this.shown);
    gsap.killTweensOf(this.material);
    this.room.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
