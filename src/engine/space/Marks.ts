import * as THREE from "three";
import { GL } from "@/engine/common/color";
import { LINE_LOOK } from "./Tether";
import type { RoomScene } from "./RoomScene";

type Point = { x: number; y: number };

/**
 * Notes, while it listens with its eyes shut: one every `every` seconds, from each ear in turn,
 * rising `rise` px and drifting `out` px outward over `life` seconds, swaying `sway` px as they go;
 * `beamed` of them a beamed pair. They fade in over `fadeIn` of their life and out from `fadeOut`.
 */
const NOTE = { every: 0.95, life: 2.8, rise: 110, out: 55, sway: 6, beamed: 0.4, fadeIn: 0.12, fadeOut: 0.45, alpha: 0.9 };
/**
 * Zs, asleep for the night: one every `every` seconds from the ear its sleep has tipped up, each
 * along the same wave (drawn afresh each night: `amp` px of sway, `cycles` of it, where it starts)
 * out `out` px and up `rise` over `life` seconds, `size` px growing to `grow`, each a little off it
 * (`jitter` px) and turned a touch (`turn` rad).
 */
const ZS = { every: 1.25, life: 3.8, out: 175, rise: 70, amp: [14, 32] as [number, number], cycles: [1.3, 2.5] as [number, number], size: 14, grow: 30, jitter: 6, turn: 0.17, alpha: 0.9, fadeIn: 0.1 };
/** They are drawn for a head this tall (px) and scale with it, within these bounds. */
const SCALE = { head: 380, min: 0.5, max: 1.3 };
/** Under reduced motion, still: these few, where their paths put them this far along. */
const STILL = [0.18, 0.5, 0.82];

type Mark = { kind: "note" | "z"; born: number; ear: 0 | 1; beamed: boolean; jx: number; jy: number; turn: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * What rises from Urchi at home as it feels something: notes from its ears while it listens, and
 * Zs while it sleeps for the night. Drawn in the room's own scene in the line's ink and width
 * (see Tether's LINE_LOOK), over the head; a mark already on its way finishes when they stop.
 * Only at home: afloat its ears are in the helmet. Under reduced motion they hold still.
 */
export class Marks {
  private room: RoomScene;
  private reduced: boolean;
  private mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private pos = new Float32Array(0);
  private col = new Float32Array(0);
  private n = 0;
  private marks: Mark[] = [];
  private t = 0;
  private notesOn = false;
  private zsOn = false;
  /** The ear the Zs rise from (0 the viewer's left, 1 the right), and the head's tip then (degrees). */
  private zEar: 0 | 1 = 1;
  private roll = 0;
  /** Tonight's wave. */
  private wave = { amp: 20, cycles: 1.6, phase: 0 };
  private nextNote = 0;
  private nextZ = 0;
  private noteEar: 0 | 1 = 0;
  private stop: () => void;

  constructor(room: RoomScene, o: { reducedMotion: boolean }) {
    this.room = room;
    this.reduced = o.reducedMotion;
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.mesh.renderOrder = 1; // over Urchi
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.fit(2048);
    room.scene.add(this.mesh);
    this.stop = room.afterUrchi((dt) => this.frame(dt));
  }

  /** Notes from its ears (listening, eyes shut), or not. */
  notes(on: boolean) {
    if (on === this.notesOn) return;
    this.notesOn = on;
    if (on) this.nextNote = this.t;
    else if (this.reduced) this.marks = this.marks.filter((m) => m.kind !== "note");
  }

  /**
   * Zs from the ear its sleep tips up (`ear`, 0 the viewer's left), the head tipped `roll` degrees
   * (see RoomScene.earTips), or none. Each night's wave is drawn afresh.
   */
  zs(on: boolean, ear: 0 | 1 = 1, roll = 0) {
    this.zEar = ear;
    this.roll = roll;
    if (on === this.zsOn) return;
    this.zsOn = on;
    if (on) {
      this.wave = { amp: rand(...ZS.amp), cycles: rand(...ZS.cycles), phase: rand(0, Math.PI * 2) };
      this.nextZ = this.t;
    } else if (this.reduced) this.marks = this.marks.filter((m) => m.kind !== "z");
  }

  /** Room for `v` vertices. */
  private fit(v: number) {
    this.pos = new Float32Array(v * 3);
    this.col = new Float32Array(v * 4);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
  }

  private vertex(x: number, y: number, a: number) {
    if ((this.n + 1) * 3 > this.pos.length) return;
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = 0;
    this.col[i * 4] = GL.ink.r; this.col[i * 4 + 1] = GL.ink.g; this.col[i * 4 + 2] = GL.ink.b; this.col[i * 4 + 3] = a;
  }

  /** A stroke from one point to the next, `w` px wide. */
  private line(pts: Point[], w: number, a: number) {
    for (let k = 1; k < pts.length; k++) {
      const p = pts[k - 1], q = pts[k], l = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = (-(q.y - p.y) / l) * (w / 2), ny = ((q.x - p.x) / l) * (w / 2);
      this.vertex(p.x + nx, p.y + ny, a); this.vertex(p.x - nx, p.y - ny, a); this.vertex(q.x + nx, q.y + ny, a);
      this.vertex(q.x + nx, q.y + ny, a); this.vertex(p.x - nx, p.y - ny, a); this.vertex(q.x - nx, q.y - ny, a);
    }
  }

  /** A filled oval (a note's head). */
  private oval(c: Point, rx: number, ry: number, rot: number, a: number) {
    const N = 14, cs = Math.cos(rot), sn = Math.sin(rot), at = (k: number) => {
      const t = (2 * Math.PI * k) / N, x = rx * Math.cos(t), y = ry * Math.sin(t);
      return { x: c.x + x * cs - y * sn, y: c.y + x * sn + y * cs };
    };
    for (let k = 0; k < N; k++) {
      const p = at(k), q = at(k + 1);
      this.vertex(c.x, c.y, a); this.vertex(p.x, p.y, a); this.vertex(q.x, q.y, a);
    }
  }

  /** A note with its head at `h` (room px, y up), `k` times its size: an eighth, or a beamed pair. */
  private note(h: Point, k: number, a: number, beamed: boolean) {
    const w = LINE_LOOK.width, P = (x: number, y: number) => ({ x: h.x + x * k, y: h.y + y * k });
    const heads = beamed ? [P(0, 0), P(14, 3)] : [P(0, 0)];
    for (const c of heads) {
      this.oval(c, 4.6 * k, 3.4 * k, 0.35, a);
      this.line([{ x: c.x + 4.2 * k, y: c.y + 1 * k }, { x: c.x + 4.2 * k, y: c.y + 22 * k }], w, a);
    }
    if (beamed) this.line([P(4.2, 22), P(18.2, 25)], 2 * w, a);
    else this.line([P(4.2, 22), P(8, 20.5), P(10.2, 17), P(10.4, 13.5), P(10, 10)], w, a);
  }

  /** A Z at `c`, `size` px, turned `turn`. */
  private z(c: Point, size: number, turn: number, a: number) {
    const h = size / 2, cs = Math.cos(turn), sn = Math.sin(turn), P = (x: number, y: number) => ({ x: c.x + x * cs - y * sn, y: c.y + x * sn + y * cs });
    this.line([P(-h, h), P(h, h), P(-h, -h), P(h, -h)], LINE_LOOK.width, a);
  }

  /** A note `u` of the way through its life from ear `e` (room px), `out` its outward side: where it is and how clear. */
  private notePlace(m: Mark, e: Point, out: number, s: number, u: number) {
    const x = e.x + out * (18 + NOTE.out * u + NOTE.sway * Math.sin(u * Math.PI * 2 + m.jx)) * s;
    const y = e.y + (10 + NOTE.rise * u) * s;
    const a = NOTE.alpha * Math.min(1, u / NOTE.fadeIn) * (u < NOTE.fadeOut ? 1 : 1 - (u - NOTE.fadeOut) / (1 - NOTE.fadeOut));
    return { at: { x, y }, a };
  }

  private zPlace(m: Mark, e: Point, out: number, s: number, u: number) {
    const W = this.wave;
    const x = e.x + out * (30 + ZS.out * u + m.jx) * s;
    const y = e.y + (6 + ZS.rise * u + W.amp * Math.sin(W.phase + u * Math.PI * 2 * W.cycles) + m.jy) * s;
    const a = ZS.alpha * Math.min(1, u / ZS.fadeIn) * (1 - u);
    return { at: { x, y }, a, size: (ZS.size + (ZS.grow - ZS.size) * u) * s };
  }

  private frame(dt: number) {
    this.t += dt;
    // (still under reduced motion: they do not age)
    if (this.reduced) this.marks.forEach((m) => (m.born += dt));
    const ears = this.room.earTips(this.zsOn ? this.roll : 0);
    if (!ears) {
      // afloat (or gone): none, and none left over for when it is home again
      this.marks = [];
      this.mesh.visible = false;
      return;
    }
    const s = clamp(this.room.urchiSize.h / SCALE.head, SCALE.min, SCALE.max), t = this.t;
    const mark = (kind: Mark["kind"], ear: 0 | 1, born: number): Mark => ({ kind, born, ear, beamed: Math.random() < NOTE.beamed, jx: kind === "z" ? rand(-ZS.jitter, ZS.jitter) : rand(0, Math.PI * 2), jy: rand(-ZS.jitter, ZS.jitter), turn: rand(-ZS.turn, ZS.turn) });
    if (this.reduced) {
      // still: a few, where their paths put them, for as long as they are on
      if (this.notesOn && !this.marks.some((m) => m.kind === "note")) STILL.forEach((u, i) => this.marks.push(mark("note", (i % 2) as 0 | 1, t - u * NOTE.life)));
      if (this.zsOn && !this.marks.some((m) => m.kind === "z")) STILL.forEach((u) => this.marks.push(mark("z", this.zEar, t - u * ZS.life)));
    } else {
      if (this.notesOn && t >= this.nextNote) {
        this.marks.push(mark("note", this.noteEar, t));
        this.noteEar = this.noteEar ? 0 : 1;
        this.nextNote = t + NOTE.every;
      }
      if (this.zsOn && t >= this.nextZ) {
        this.marks.push(mark("z", this.zEar, t));
        this.nextZ = t + ZS.every;
      }
      this.marks = this.marks.filter((m) => t - m.born < (m.kind === "note" ? NOTE.life : ZS.life));
    }
    this.n = 0;
    for (const m of this.marks) {
      const e = ears[m.ear], out = m.ear === 0 ? -1 : 1;
      if (m.kind === "note") {
        const p = this.notePlace(m, e, out, s, clamp((t - m.born) / NOTE.life, 0, 1));
        this.note(p.at, 1.6 * s, p.a, m.beamed);
      } else {
        const p = this.zPlace(m, e, out, s, clamp((t - m.born) / ZS.life, 0, 1));
        this.z(p.at, p.size, m.turn, p.a);
      }
    }
    this.mesh.visible = this.n > 0;
    this.mesh.geometry.setDrawRange(0, this.n);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.stop();
    this.room.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
