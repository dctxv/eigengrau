import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { closeBy, restOn, windUp } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import { readResult, squareColor, todayUTC } from "@/lib/threshold";
import type { RoomScene } from "./RoomScene";

/**
 * Motes (spec S3): zero to three faint specks in Urchi's room, each exactly
 * one of its art pixels, only a few levels of 255 above eigengrau (Threshold's
 * scale), so they sit at the edge of what a screen shows. They drift slowly,
 * the pointer's air pushes them, and one that touches Urchi rests on it until
 * the next breath lifts it off. Urchi watches them through its attention: once
 * the pointer has been still a while, the faintest one; a mote too near its
 * face gets a cross-eyed look and a slow blink, and is gone when the lids
 * open. Tapping empty space releases one there. Once today's Threshold is
 * played, new ones are born at the level the visitor reached, so Urchi
 * watches the ones they can only just see.
 */
const MOTE = {
  max: 3,
  /** Levels above eigengrau, of 255: a new one's range, and a released one's. */
  levels: [3, 12] as [number, number],
  released: 4,
  /** Drift, px/s: never faster than the top of this. */
  speed: [4, 12] as [number, number],
  life: [10, 25] as [number, number],
  fade: 1.5,
  /** Seconds between arrivals, and before the first (sooner, so a visit sees one). */
  every: [45, 120] as [number, number],
  first: [5, 14] as [number, number],
  /** The pointer's air: how near it must pass (px) and what share of its velocity it lends. */
  air: { reach: 160, share: 0.15, ease: 0.25 },
  /** Kept this far inside the room's edges (px), clear of the tabs and the caption. */
  margin: 40,
  top: 64,
  bottom: 96,
  /** Near its face: within this share of Urchi's box width of its eyes, once watched for a moment. */
  near: 0.6,
  nearAfter: 1,
  /** A resting mote waits at least this long, then the top of a breath lifts it off at this speed. */
  rest: 0.8,
  lift: 8,
  minPx: 2,
};

type Mote = {
  id: string;
  /** Room px: the centre is the origin, y up. */
  x: number;
  y: number;
  heading: number;
  turn: number;
  speed: number;
  toSpeed: number;
  nextSpeed: number;
  /** The air's push, eased, px/s. */
  ax: number;
  ay: number;
  level: number;
  born: number;
  life: number;
  /** When it began to fade out (-1: not yet), and over how long. */
  out: number;
  outFor: number;
  alpha: number;
  resting: boolean;
  restSince: number;
  breathLow: boolean;
  /** Passes through Urchi until then (just lifted off). */
  ghost: number;
  claimed: boolean;
  watchedSince: number;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Motes {
  private room: RoomScene;
  private att: Attention;
  private reduced: boolean;
  private motes: Mote[] = [];
  private geo = new THREE.PlaneGeometry(1, 1);
  private t = 0;
  private next = -1;
  private count = 0;
  private hidden = false;
  private stopFrame: () => void;
  private rect: DOMRect | null = null;

  constructor(room: RoomScene, att: Attention, o: { reducedMotion: boolean }) {
    this.room = room;
    this.att = att;
    this.reduced = o.reducedMotion;
    this.stopFrame = room.onFrame((dt) => this.frame(dt));
  }

  /** Motes may begin to arrive (once Urchi is awake in its room). */
  start() {
    if (this.next < 0) this.next = this.t + rand(...MOTE.first);
  }

  /** Hidden while the game is open: they fade at once and none arrive. */
  hide(on: boolean) {
    this.hidden = on;
    if (on) this.motes.forEach((m) => this.fadeOut(m, 0.3));
    else this.next = this.t + rand(...MOTE.first);
  }

  /** A tap on empty space: a mote there, and Urchi winds up and turns to it. */
  release(clientX: number, clientY: number) {
    if (this.hidden || this.next < 0) return;
    const p = this.room.toRoom(clientX, clientY);
    const m = this.make(p.x, p.y, this.levelNow(MOTE.released), true);
    this.att.quiet("pointer");
    this.att.play("windUp", 3, () => windUp(this.att, () => this.clientOf(m, 0)), { queue: 0.5 });
  }

  /** What a new mote's level is: the visitor's Threshold result once today's is played. */
  private levelNow(fallback?: number) {
    const played = readResult(todayUTC());
    if (played !== null && played > 0) return played;
    return fallback ?? Math.round(rand(MOTE.levels[0], MOTE.levels[1]));
  }

  private make(x: number, y: number, level: number, released = false): Mote {
    // past three, the oldest fades
    const live = this.motes.filter((m) => m.out < 0);
    if (live.length >= MOTE.max) this.fadeOut(live[0], MOTE.fade);
    const mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({ color: rawColor(squareColor(level)), transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
    );
    mesh.renderOrder = -1; // behind Urchi
    this.room.scene.add(mesh);
    const speed = rand(...MOTE.speed);
    const m: Mote = {
      id: `mote:${++this.count}`,
      x,
      y,
      heading: rand(0, Math.PI * 2),
      turn: 0,
      speed: released ? 5 : speed,
      toSpeed: speed,
      nextSpeed: this.t + rand(2, 5),
      ax: 0,
      ay: 0,
      level,
      born: this.t,
      life: rand(...MOTE.life),
      out: -1,
      outFor: MOTE.fade,
      alpha: 0,
      resting: false,
      restSince: 0,
      breathLow: false,
      ghost: 0,
      claimed: false,
      watchedSince: -1,
      mesh,
    };
    this.motes.push(m);
    // a new one is a little interesting; one you let go of is very
    this.att.add({ id: m.id, kind: "mote", weight: 0.8, level, at: () => this.clientOf(m, 0.35) }, released ? 1.2 : 0.45);
    return m;
  }

  /** An arrival: from an edge, drifting in, or out of nothing in the open room. */
  private arrive() {
    const w = this.room.width / 2, h = this.room.height / 2;
    const level = this.levelNow();
    if (!this.reduced && Math.random() < 0.5) {
      const edge = Math.floor(Math.random() * 4);
      const along = rand(-0.7, 0.7);
      const pos: [number, number, number][] = [
        [-w - 2, along * h, 0],
        [w + 2, along * h, Math.PI],
        [along * w, h + 2, -Math.PI / 2],
        [along * w, -h - 2, Math.PI / 2],
      ];
      const [x, y, heading] = pos[edge];
      const m = this.make(x, y, level);
      m.heading = heading + rand(-0.5, 0.5);
      m.alpha = 1; // it drifts in whole rather than fading in at the edge
      m.born -= MOTE.fade;
      return;
    }
    // somewhere in the open: clear of Urchi, the tabs and the caption
    const head = this.room.eyes();
    const clear = this.room.urchiSize.w * 0.75;
    for (let k = 0; k < 20; k++) {
      const x = rand(-w + MOTE.margin, w - MOTE.margin);
      const y = rand(-h + MOTE.bottom, h - MOTE.top);
      if (Math.hypot(x - head.x, y - head.y) > clear) {
        this.make(x, y, level);
        return;
      }
    }
  }

  private fadeOut(m: Mote, seconds: number) {
    if (m.out >= 0) return;
    m.out = this.t;
    m.outFor = seconds;
    this.att.remove(m.id);
  }

  private vanish(m: Mote) {
    this.att.remove(m.id);
    this.room.scene.remove(m.mesh);
    m.mesh.material.dispose();
    this.motes = this.motes.filter((o) => o !== m);
  }

  /** A mote's centre in client px; null while it is fainter than `seen` of itself (still fading in or out). */
  private clientOf(m: Mote, seen: number): Point | null {
    if (!this.motes.includes(m) || m.alpha < seen || this.hidden) return null;
    const r = this.rect ?? this.room.canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2 + m.x, y: r.top + r.height / 2 - m.y };
  }

  private frame(dt: number) {
    this.t += dt;
    if (!this.motes.length && (this.next < 0 || this.hidden)) return;
    this.rect = this.room.canvas.getBoundingClientRect();
    if (this.next >= 0 && !this.hidden && this.t >= this.next) {
      this.next = this.t + rand(...MOTE.every);
      if (this.room.interactive) this.arrive();
    }
    const px = Math.max(MOTE.minPx, this.room.pixel);
    const ratio = this.room.ratio;
    const snap = (v: number) => Math.round(v * ratio) / ratio;
    const W = this.room.width, H = this.room.height;
    const face = this.room.eyes();
    const breath = this.att.ch.breath;
    const air = this.att.air();
    for (const m of [...this.motes]) {
      const age = this.t - m.born;
      if (m.out < 0 && age > m.life) this.fadeOut(m, MOTE.fade);
      if (m.out >= 0) {
        m.alpha = Math.max(0, m.alpha - dt / Math.max(0.01, m.outFor));
        if (m.alpha <= 0) {
          this.vanish(m);
          continue;
        }
      } else m.alpha = Math.min(1, m.alpha + dt / MOTE.fade);
      if (!this.reduced && !m.resting) this.drift(m, dt, air, W, H);
      if (m.resting && !this.reduced) this.rest(m, breath);
      // too near its face while it watches: cross-eyed, a slow blink, and gone
      if (this.att.watching(m.id)) {
        if (m.watchedSince < 0) m.watchedSince = this.t;
      } else m.watchedSince = -1;
      const near = Math.hypot(m.x - face.x, m.y - face.y) < this.room.urchiSize.w * MOTE.near;
      if (!m.claimed && m.out < 0 && near && m.watchedSince >= 0 && this.t - m.watchedSince > MOTE.nearAfter) {
        m.claimed = true;
        this.att.play("closeBy", 3, () => closeBy(this.att, () => this.clientOf(m, 0), () => this.vanish(m)), { queue: 1 });
      }
      // one art pixel, on whole device pixels, so its edges stay hard
      const left = snap(W / 2 + m.x - px / 2), top = snap(H / 2 - m.y - px / 2);
      m.mesh.position.set(left + px / 2 - W / 2, H / 2 - top - px / 2, -1);
      m.mesh.scale.set(px, px, 1);
      m.mesh.material.opacity = m.alpha;
    }
  }

  /** Slow wandering (a heading that turns smoothly, a speed that changes its mind), plus the air, never over 12 px/s. */
  private drift(m: Mote, dt: number, air: ReturnType<Attention["air"]>, W: number, H: number) {
    m.turn += (rand(-1, 1) * 1.6 - m.turn * 0.8) * dt;
    m.heading += m.turn * dt;
    if (this.t >= m.nextSpeed) {
      m.toSpeed = rand(...MOTE.speed);
      m.nextSpeed = this.t + rand(2, 5);
    }
    m.speed += (m.toSpeed - m.speed) * (1 - Math.exp(-dt / 1.5));
    // keep to the room: near an edge (or the tabs, or the caption), it turns back in
    const inX = W / 2 - MOTE.margin, top = H / 2 - MOTE.top, bottom = -H / 2 + MOTE.bottom;
    const out = m.x < -inX || m.x > inX || m.y > top || m.y < bottom;
    if (out && m.out < 0 && this.t - m.born > 3) {
      const home = Math.atan2(-m.y * 0.5, -m.x);
      let d = home - m.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.heading += Math.sign(d) * Math.min(Math.abs(d), 0.9 * dt);
    }
    // the pointer is air: passing near pushes it, by a share of its velocity, less further off
    let tx = 0, ty = 0;
    if (air.has) {
      const c = this.clientOf(m, 0);
      if (c) {
        const d = Math.hypot(c.x - air.x, c.y - air.y);
        if (d < MOTE.air.reach) {
          const f = (1 - d / MOTE.air.reach) ** 2 * MOTE.air.share;
          tx = air.vx * f;
          ty = -air.vy * f;
        }
      }
    }
    const k = 1 - Math.exp(-dt / MOTE.air.ease);
    m.ax += (tx - m.ax) * k;
    m.ay += (ty - m.ay) * k;
    let vx = Math.cos(m.heading) * m.speed + m.ax, vy = Math.sin(m.heading) * m.speed + m.ay;
    const v = Math.hypot(vx, vy), cap = MOTE.speed[1];
    if (v > cap) {
      vx *= cap / v;
      vy *= cap / v;
    }
    const nx = m.x + vx * dt, ny = m.y + vy * dt;
    // it touches Urchi: it rests there, on a spike, and Urchi blinks at it twice
    if (this.t > m.ghost && m.out < 0 && this.room.urchi.hit(nx, ny)) {
      m.resting = true;
      m.restSince = this.t;
      m.ax = m.ay = 0;
      this.att.play("restOn", 3, () => restOn(this.att, () => this.clientOf(m, 0)), { queue: 1 });
      return;
    }
    m.x = nx;
    m.y = ny;
    if (Math.abs(m.x) > W / 2 + 8 || Math.abs(m.y) > H / 2 + 8) this.fadeOut(m, 0.01); // drifted out of the room
  }

  /** Resting on a spike until the top of a breath lifts it off, away from the head. */
  private rest(m: Mote, breath: number) {
    if (breath < 0.5) m.breathLow = true;
    if (this.t - m.restSince < MOTE.rest || !m.breathLow || breath < 0.9) return;
    const head = this.room.eyes();
    m.resting = false;
    m.breathLow = false;
    m.heading = Math.atan2(m.y - head.y + 40, m.x - head.x);
    m.speed = MOTE.lift;
    m.ghost = this.t + 1.5;
  }

  dispose() {
    this.stopFrame();
    [...this.motes].forEach((m) => this.vanish(m));
    this.geo.dispose();
  }
}
