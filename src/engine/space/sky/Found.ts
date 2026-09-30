import { ITEMS, type ItemText } from "@/content/site";
import { PIXEL_LEAST, levelCell } from "@/engine/common/pixel";
import { ITEM_MAKERS } from "@/engine/items";
import { ItemSprite, type SpritePose } from "@/engine/items/sprite";
import { found, onFound, type Found as Kept } from "@/lib/found";
import { REST } from "../Float";
import { pixelCellAt, type RoomScene } from "../RoomScene";
import type { SkyFrame } from "./layer";
import type { Sky } from "./Sky";
import { rng, subSeed } from "./tune";

/**
 * The things Urchi has caught, hanging in the sky behind it afloat, each where the visit's sky puts
 * it: over the planets and under the motes, the line and Urchi (`order`, as the sky's layers count
 * it). Each is `size` of the floating figure's height across at zoom 1 (between the two, by its
 * seed; never under `minPx`), at its own depth between `far` and `near`, which it follows the zoom
 * by as the planets do (nearer than they are, so it moves more), losing its signal from `pixelFrom`
 * to `pixelMost` CSS px at the zoom's farthest, never finer than pixel level 1. A forgery is as
 * big, but its signal is wrong: `forged.cells` cells across, and its rows slipping (see sprite.ts).
 * A thing just caught comes up over `appear` seconds (one flown up from Urchi's hand is there at
 * once).
 *
 * Each is placed at the best of `place.tries` spots (from the room's edges as the planets' are, drawn
 * in toward the middle to `pull` of the way out): far from where Urchi floats (`clear` of the
 * figure's height round it), from the planets (`planets` times their reach and its own) and from the
 * others (`apart` times their reach); a thing caught earlier is placed first, so one caught later
 * never moves it.
 */
const FOUND = {
  order: -98.5,
  size: [0.36, 0.45] as [number, number],
  minPx: 90,
  far: { zoomResponse: 0.3, pixelFrom: 0.6, pixelMost: 5 },
  near: { zoomResponse: 0.55, pixelFrom: 0.5, pixelMost: 4 },
  forged: { cells: 12 },
  appear: 0.8,
  place: { top: 84, bottom: 88, left: 28, right: 76, tries: 40, clear: 0.55, planets: 1.3, apart: 1.5, pull: 0.78 },
};

/** Every item's words, by its id. */
const TEXT = new Map<string, ItemText>(Object.values(ITEMS).flatMap((tier) => tier.map((i) => [i.id, i] as const)));

type Slot = {
  id: string;
  forged: boolean;
  /** Its place and size at zoom 1 (room CSS px, y up), its depth's way with the zoom, and its signal's. */
  x: number;
  y: number;
  size: number;
  response: number;
  from: number;
  most: number;
  sprite: ItemSprite | null;
  appear: number;
  /** Flown up from Urchi's hand: from where, since when (the layer's clock) and over how long. */
  flight: { from: SpritePose; t0: number; dur: number } | null;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.cos(Math.PI * t)) / 2);

/**
 * What Urchi has caught, in the sky behind it afloat (see FOUND). It comes and goes with the sky, and
 * nothing of it is loaded until the sky is first there with something in it. The things a forged
 * list claims are not shown until the forgery has been answered (see lib/found.ts): then each hangs
 * there as a forgery until the real one is caught.
 */
export class FoundSky {
  private room: RoomScene;
  private sky: Sky;
  private reduced: boolean;
  private slots = new Map<string, Slot>();
  private laid = "";
  private time = 0;
  private presence = 0;
  private zoom = 1;
  private least = 0;
  private pointerAt: { x: number; y: number } | null = null;
  private stopFollow: () => void;
  private stopFound: () => void;
  private disposed = false;

  constructor(room: RoomScene, sky: Sky, o: { reducedMotion: boolean }) {
    this.room = room;
    this.sky = sky;
    this.reduced = o.reducedMotion;
    this.stopFollow = sky.follow((f) => this.frame(f));
    this.stopFound = onFound(() => (this.laid = ""));
  }

  /** How much of the sky is there now, 0 .. 1 (what else drawn with it fades with it: the catch's glint). */
  get skyPresence() {
    return this.presence;
  }

  /** What hangs there (for headless QA): each thing's id, whether it is a forgery, its place and size at zoom 1, and whether it is drawn yet. */
  get hung() {
    return [...this.slots.values()].map((s) => ({ id: s.id, forged: s.forged, x: s.x, y: s.y, size: s.size, ready: !!s.sprite?.item }));
  }

  /** What is on show: nothing of a forged list until it is answered. */
  private shown(k: Kept): { id: string; forged: boolean }[] {
    if (k.tampered) return [];
    return [...k.items].sort((a, b) => a[1] - b[1]).map(([id]) => ({ id, forged: k.forged.has(id) }));
  }

  /** Laid out afresh: what it has, for this sky and this room. Things kept keep their sprites. */
  private layout() {
    const room = this.room, k = found(), list = this.shown(k), seed = this.sky.seedNumber;
    const key = `${seed} ${room.width}x${room.height} ${room.figureTall.toFixed(1)} ${list.map((s) => `${s.id}${s.forged ? "*" : ""}`).join(",")}`;
    if (key === this.laid) return;
    this.laid = key;
    const P = FOUND.place, w = room.width, h = room.height, figure = room.figureTall, rest = w <= 640 ? REST.phone : REST;
    const home = { x: rest.x * w - w / 2, y: h / 2 - rest.y * h };
    const planets = this.sky.planetSpots;
    const old = this.slots;
    this.slots = new Map();
    const placed: Slot[] = [];
    for (const { id, forged } of list) {
      const draw = rng(subSeed(seed, `found:${id}`)), depth = draw();
      const size = Math.max(FOUND.minPx, lerp(FOUND.size[0], FOUND.size[1], draw()) * figure), reach = size / 2;
      const x0 = -w / 2 + P.left + reach, x1 = w / 2 - P.right - reach, y0 = -h / 2 + P.bottom + reach, y1 = h / 2 - P.top - reach;
      let best = -Infinity, bx = 0, by = 0;
      for (let t = 0; t < P.tries; t++) {
        const fx = draw(), fy = draw();
        const x = P.pull * (x0 < x1 ? lerp(x0, x1, fx) : (x0 + x1) / 2), y = P.pull * (y0 < y1 ? lerp(y0, y1, fy) : (y0 + y1) / 2);
        let score = Math.hypot(x - home.x, y - home.y) - P.clear * figure - reach;
        for (const p of planets) score = Math.min(score, Math.hypot(x - p.x, y - p.y) - P.planets * (reach + p.radius));
        for (const o of placed) score = Math.min(score, Math.hypot(x - o.x, y - o.y) - P.apart * (reach + o.size / 2));
        if (score > best) {
          best = score;
          bx = x;
          by = y;
        }
      }
      const was = old.get(id);
      const slot: Slot = {
        id,
        forged,
        x: bx,
        y: by,
        size,
        response: lerp(FOUND.far.zoomResponse, FOUND.near.zoomResponse, depth),
        from: lerp(FOUND.far.pixelFrom, FOUND.near.pixelFrom, depth),
        most: Math.max(1, lerp(FOUND.far.pixelMost, FOUND.near.pixelMost, depth) * room.ratio),
        sprite: was?.sprite ?? null,
        appear: was?.appear ?? 0,
        flight: was?.flight ?? null,
      };
      old.delete(id);
      placed.push(slot);
      this.slots.set(id, slot);
    }
    for (const s of old.values()) s.sprite?.dispose();
    if (this.presence > 0) this.make();
  }

  /** Every thing laid out with no sprite gets one, its item's code loaded (its own chunk) and made. */
  private make() {
    for (const s of this.slots.values()) {
      if (s.sprite) continue;
      const sprite = (s.sprite = new ItemSprite());
      sprite.t = Math.random() * 60; // (each at its own moment, not all turning alike)
      sprite.mesh.renderOrder = FOUND.order;
      this.room.scene.add(sprite.mesh);
      ITEM_MAKERS[s.id]?.().then(
        (maker) => {
          if (this.disposed || s.sprite !== sprite) return;
          sprite.setItem(maker());
        },
        () => {
          // (not there to be had: tried again on the next layout)
          if (s.sprite === sprite) s.sprite = null;
          sprite.dispose();
        },
      );
    }
  }

  /** Where a thing hangs now (room px, y up), as big as it is drawn at this zoom: where one just caught flies up to. */
  poseOf(id: string): SpritePose | null {
    this.layout();
    const s = this.slots.get(id);
    return s ? this.at(s) : null;
  }

  /** A thing's pose now, at this frame's zoom. */
  private at(s: Slot): SpritePose {
    const k = Math.max(this.zoom, 1e-3) ** s.response, size = s.size * k, device = this.room.renderer.domElement.width / Math.max(1, this.room.width);
    const cell = s.forged ? Math.max(this.least, Math.round((size * device) / FOUND.forged.cells)) : pixelCellAt(this.zoom, s.from, s.most, this.least);
    return { x: s.x * k, y: s.y * k, size, cell, fade: this.presence * s.appear, wrong: s.forged ? 1 : 0 };
  }

  /**
   * One just caught, flown up from Urchi's hand: `sprite` (the catch's own, handed over with its
   * item) goes from `from` to where it hangs over `seconds`, shrinking as it goes into the distance.
   */
  adopt(id: string, sprite: ItemSprite, from: SpritePose, seconds: number) {
    this.layout();
    const s = this.slots.get(id);
    if (!s) {
      sprite.dispose();
      return;
    }
    if (s.sprite && s.sprite !== sprite) s.sprite.dispose();
    s.sprite = sprite;
    s.appear = 1;
    s.flight = { from, t0: this.time, dur: this.reduced ? 0 : seconds };
    sprite.mesh.renderOrder = 0.5;
  }

  /** The pointer, client px (null: gone), for the things that answer it (the magnet stone). */
  pointer(clientX: number | null, clientY = 0) {
    this.pointerAt = clientX === null ? null : this.room.toRoom(clientX, clientY);
  }

  /** The thing under a client point, nearest first: its id, its words, and whether it is a forgery; null when there is none (or no sky). */
  hit(clientX: number, clientY: number): { id: string; text: ItemText; forged: boolean } | null {
    if (this.presence < 0.5) return null;
    const p = this.room.toRoom(clientX, clientY);
    let best: Slot | null = null;
    for (const s of this.slots.values()) if (s.sprite?.item && !s.flight && s.sprite.hit(p.x, p.y, 6) && (!best || s.response > best.response)) best = s;
    const text = best && TEXT.get(best.id);
    return best && text ? { id: best.id, text, forged: best.forged } : null;
  }

  private frame(f: SkyFrame) {
    if (this.disposed) return;
    this.time += f.dt;
    this.presence = f.presence;
    this.zoom = f.zoom;
    this.least = levelCell(PIXEL_LEAST, this.room.renderer.domElement.width / Math.max(1, this.room.width));
    if (f.presence > 0) this.layout();
    const stage = { width: this.room.width, height: this.room.height, grid: { x: this.room.renderer.domElement.width / Math.max(1, this.room.width), y: this.room.renderer.domElement.height / Math.max(1, this.room.height) } };
    for (const s of this.slots.values()) {
      const sp = s.sprite;
      if (!sp) continue;
      if (!s.flight) s.appear = f.reducedMotion ? 1 : Math.min(1, s.appear + f.dt / FOUND.appear);
      let pose = this.at(s);
      if (s.flight) {
        const fl = s.flight, u = fl.dur > 0 ? Math.min(1, (this.time - fl.t0) / fl.dur) : 1, e = ease(u), a = fl.from;
        // the whole way there in view, whatever the sky is doing: it is what Urchi is watching
        pose = { x: lerp(a.x, pose.x, e), y: lerp(a.y, pose.y, e), size: lerp(a.size, pose.size, e), cell: Math.round(lerp(a.cell, pose.cell, e)), fade: Math.max(pose.fade, 1 - u), wrong: pose.wrong };
        // over Urchi as it leaves its hand; behind it once it is clear of it, among the sky's things
        if (sp.mesh.renderOrder !== FOUND.order && (u > 0.55 || !this.room.nearUrchi(pose.x, pose.y, pose.size / 2))) sp.mesh.renderOrder = FOUND.order;
        if (u >= 1) {
          s.flight = null;
          sp.mesh.renderOrder = FOUND.order;
        }
      }
      sp.place(pose);
      sp.point(this.pointerAt);
      sp.frame(f.dt, f.reducedMotion);
      sp.draw(this.room.renderer, stage);
    }
    if (f.presence > 0 && [...this.slots.values()].some((s) => !s.sprite)) this.make();
  }

  /** Where a thing is now, client px: what Urchi watches as one flies up. */
  clientOf(id: string) {
    const s = this.slots.get(id)?.sprite;
    if (!s) return null;
    const r = this.room.canvas.getBoundingClientRect(), p = s.placed;
    return { x: r.left + r.width / 2 + p.x, y: r.top + r.height / 2 - p.y };
  }

  dispose() {
    this.disposed = true;
    this.stopFollow();
    this.stopFound();
    for (const s of this.slots.values()) s.sprite?.dispose();
    this.slots.clear();
  }
}
