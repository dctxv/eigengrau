import * as THREE from "three";
import gsap from "gsap";
import type { SpaceItem } from "@/content/site";
import { loadAll, upload, type Loaded } from "@/engine/common/loader";
import type { RoomScene } from "./RoomScene";

/**
 * The ring, in CSS px on a wide screen: twelve thumbnails pop in round the monogram and turn
 * slowly while the counter finishes. On a narrow screen the whole ring scales to fit 80% of the
 * width (the thumbnails less, so they stay legible). Where Urchi is drawn larger than 3 screen px
 * per art pixel it grows with Urchi, so it still has somewhere to draw in to round the bigger
 * eyes; never so far that it reaches past `maxH` of the height from the centre.
 */
const RING = { count: 12, r0: 255, r1: 265, thumb: 60, turn: 0.14, span: 590, minFit: 0.35, minThumbFit: 0.7, maxH: 0.42 };
/**
 * The draw-in: the ring closes round Urchi's eyes, this far clear of them, its thumbnails
 * shrinking to this width. Both are for 3 screen px per art pixel and scale with Urchi.
 */
const DRAW = { gap: 16, thumb: 40, minThumb: 24 };
/**
 * The blow: each piece flies this long, this far behind the one before, and leaves this big.
 * Its swing round the head is over by `converge` of the flight, so the last stretch is a
 * straight rise through the pill's spot; `shove` is the share of its climb the breath gives it
 * at once (the rest comes on steadily).
 */
const BLOW = { flight: 0.78, stagger: 0.03, end: 8, margin: 24, converge: 0.75, shove: 0.55 };

type Piece = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  loaded: Loaded;
  aspect: number;
  /** Its place on the ring, 0..11. */
  slot: number;
  /** 0..1: the pop-in. */
  pop: number;
  /** Set when the breath takes it. */
  flight: Flight | null;
};

/**
 * A piece's way out, in polar coordinates about the ring's centre: its distance jumps (the
 * breath's shove) then climbs steadily, while its angle swings round to the exit slowly at first
 * and last, so each piece blows outward, sweeps up round Urchi's head, falls in above it with the
 * others and leaves straight up through the pill's spot.
 */
type Flight = { t: number; r0: number; r1: number; a0: number; da: number; s0: number };

/**
 * The intro's ring of work (spec S1): loaded only on a hard load of `/`, a
 * stride through SPACE_ITEMS; it pops in, turns, draws in round Urchi's eyes
 * and is blown away up toward the "2" pill on Urchi's first breath. It
 * frees everything once the last piece has gone.
 */
export class IntroRing {
  private room: RoomScene;
  private sources: SpaceItem[];
  private group = new THREE.Group();
  private geo = new THREE.PlaneGeometry(1, 1);
  private pieces: Piece[] = [];
  private stopFrame: () => void;
  private loaded = false;
  private disposed = false;
  private turning = false;
  private angle = 0;
  /** Radius and thumbnail width in wide-screen px (scaled by fit each frame), and the centre in room px. */
  private radius = RING.r0;
  private thumb = RING.thumb;
  private centre = { x: 0, y: 0 };
  private blowing: gsap.core.Timeline | null = null;
  private onVisibility = () => this.playVideos(document.visibilityState === "visible");

  constructor(room: RoomScene, items: SpaceItem[]) {
    this.room = room;
    // A stride through the pieces, the same twelve as ever.
    const n = items.length;
    const picked = new Set<number>();
    for (let k = 0; k < RING.count && n; k++) picked.add(Math.round((k * n) / RING.count) % n);
    this.sources = [...picked].map((i) => items[i]);
    // Over Urchi while there are only its eyes; behind it once the head builds (see behind).
    this.group.renderOrder = 10;
    room.scene.add(this.group);
    this.stopFrame = room.onFrame((dt) => this.frame(dt));
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /** Loads the twelve thumbnails; `onProgress` drives the counter. */
  async load(onProgress?: (p: number) => void): Promise<void> {
    const loaded = await loadAll(
      this.sources.map((s) => s.media),
      onProgress,
    );
    if (this.disposed) {
      loaded.forEach((l) => l.dispose());
      return;
    }
    this.sources.forEach((source, slot) => {
      const l = loaded[slot];
      // Transparent only so it sorts with Urchi (also transparent) by renderOrder.
      const mat = new THREE.MeshBasicMaterial({ map: l.texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.renderOrder = 10;
      mesh.visible = false;
      mesh.scale.set(1e-4, 1e-4, 1);
      this.group.add(mesh);
      this.pieces.push({ mesh, loaded: l, aspect: source.aspect || l.aspect, slot, pop: 0, flight: null });
    });
    upload(this.room.renderer, loaded);
    // Compiles the program before anything is visible.
    this.room.renderer.compile(this.room.scene, this.room.camera);
    this.loaded = true;
    this.playVideos(true);
  }

  /** The ring's scale on this viewport: 1 on a wide screen (more beside a larger Urchi), down to fit 80% of a narrow one. */
  private get fit() {
    const reach = RING.r1 + RING.thumb / 2;
    const grow = THREE.MathUtils.clamp(this.room.pixel / 3, 1, Math.max(1, (RING.maxH * this.room.height) / reach));
    return THREE.MathUtils.clamp((this.room.width * 0.8) / (RING.span * grow), RING.minFit, 1) * grow;
  }

  private get thumbFit() {
    return Math.max(this.fit, RING.minThumbFit);
  }

  /** Thumbnails pop in near the centre and settle on a slowly turning ring round the monogram. */
  start() {
    if (!this.loaded) return;
    this.turning = true;
    this.angle = 0;
    this.radius = RING.r0;
    gsap.to(this, { radius: RING.r1, duration: 2.6, ease: "sine.inOut" });
    this.pieces.forEach((p) => {
      p.mesh.visible = true;
      p.pop = 0;
      gsap.to(p, { pop: 1, duration: 0.8, ease: "power3.out", delay: 0.05 + p.slot * 0.06 });
    });
  }

  /**
   * The ring draws in, still turning, round a circle (in room px) that holds Urchi's eyes:
   * `pixel` is Urchi's screen px per art pixel, so the gap and the thumbnails scale with it.
   */
  drawIn(eyes: { x: number; y: number; reach: number }, pixel: number, duration: number) {
    const scale = pixel / 3;
    const thumb = Math.max(DRAW.minThumb, DRAW.thumb * scale);
    const radius = eyes.reach + DRAW.gap * scale + thumb / 2;
    gsap.to(this, { radius: radius / this.fit, thumb: thumb / this.thumbFit, duration, ease: "power2.in", overwrite: true });
    gsap.to(this.centre, { x: eyes.x, y: eyes.y, duration, ease: "power2.inOut" });
  }

  /**
   * The head is about to build out from the eyes: the ring goes behind Urchi, so the head
   * swallows the pieces as it grows over them (rather than wearing them on its face), and the
   * breath blows them out from behind it.
   */
  behind() {
    this.group.renderOrder = -1;
    this.pieces.forEach((p) => (p.mesh.renderOrder = -1));
  }

  /**
   * The breath takes the pieces: out, up round the head and over the top edge through the pill
   * at `to` (its centre and width, in room px), nearest first, ~30ms apart. Each comes through
   * the pill on the side it came round. Resolves once the last has gone, and frees the ring.
   */
  blow(to: { x: number; y: number; w: number }): Promise<void> {
    this.turning = false;
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.centre);
    const live = this.pieces.filter((p) => p.mesh.visible);
    if (!live.length) {
      this.dispose();
      return Promise.resolve();
    }
    const c = this.centre;
    const exitY = this.room.height / 2 + BLOW.end;
    const up = Math.atan2(exitY - c.y, to.x - c.x);
    const spread = Math.max(0, to.w / 2 - BLOW.end / 2);
    live.forEach((p) => {
      const { x, y } = p.mesh.position;
      const a0 = Math.atan2(y - c.y, x - c.x);
      // Round whichever side it is on; one straight below goes round by its slot.
      let da = Math.atan2(Math.sin(up - a0), Math.cos(up - a0));
      if (Math.abs(Math.abs(da) - Math.PI) < 0.2) da = (p.slot % 2 ? 1 : -1) * Math.abs(da);
      const exitX = to.x - Math.sign(da) * spread * Math.min(1, Math.abs(da) / Math.PI);
      const exitA = Math.atan2(exitY - c.y, exitX - c.x);
      p.flight = {
        t: 0,
        r0: Math.hypot(x - c.x, y - c.y),
        r1: Math.hypot(exitX - c.x, exitY - c.y),
        a0,
        da: da + (exitA - up),
        s0: p.mesh.scale.x,
      };
    });
    live.sort((a, b) => Math.abs(a.flight!.da) - Math.abs(b.flight!.da));
    return new Promise((resolve) => {
      this.blowing = gsap.timeline({
        onComplete: () => {
          this.dispose();
          resolve();
        },
      });
      live.forEach((p, i) => this.blowing!.to(p.flight!, { t: 1, duration: BLOW.flight, ease: "none" }, i * BLOW.stagger));
    });
  }

  private playVideos(on: boolean) {
    this.pieces.forEach((p) => {
      const v = p.loaded.video;
      if (!v) return;
      if (on) void v.play().catch(() => undefined);
      else v.pause();
    });
  }

  private frame(dt: number) {
    if (!this.loaded || this.disposed) return;
    // Drawing in, it turns a little faster, as a skater pulling in her arms.
    if (this.turning) this.angle += RING.turn * Math.max(1, RING.r0 / this.radius) * dt;
    const fit = this.fit;
    const r = this.radius * fit;
    const w = this.thumb * this.thumbFit;
    const xMax = this.room.width / 2 - BLOW.margin;
    for (const p of this.pieces) {
      if (!p.mesh.visible) continue;
      const f = p.flight;
      if (!f) {
        const a = this.angle + (p.slot / RING.count) * Math.PI * 2;
        p.mesh.position.set(this.centre.x + Math.cos(a) * r * p.pop, this.centre.y + Math.sin(a) * r * p.pop, 0);
        p.mesh.scale.set(w * p.pop, (w * p.pop) / p.aspect, 1);
        continue;
      }
      const shove = 1 - (1 - f.t) * (1 - f.t); // power2.out
      const climb = BLOW.shove * shove + (1 - BLOW.shove) * f.t * f.t;
      const u = Math.min(1, f.t / BLOW.converge);
      const swing = 0.5 - Math.cos(Math.PI * u) / 2; // sine.inOut: out first, round, then in line
      const pr = f.r0 + (f.r1 - f.r0) * climb;
      const pa = f.a0 + f.da * swing;
      const x = this.centre.x + Math.cos(pa) * pr;
      // Kept inside the sides on a narrow screen, easing in rather than hitting a wall.
      const kept = Math.abs(x) < 1 ? x : Math.sign(x) * xMax * Math.tanh(Math.abs(x) / xMax);
      p.mesh.position.set(kept, this.centre.y + Math.sin(pa) * pr, 0);
      const s = f.s0 + (BLOW.end - f.s0) * f.t * f.t;
      p.mesh.scale.set(s, s / p.aspect, 1);
      if (f.t >= 1) p.mesh.visible = false;
    }
  }

  /** Stops, lets go of every texture and video, and leaves the room. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopFrame();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.blowing?.kill();
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.centre);
    this.pieces.forEach((p) => {
      gsap.killTweensOf(p);
      if (p.flight) gsap.killTweensOf(p.flight);
      p.mesh.material.dispose();
      p.loaded.dispose();
    });
    this.pieces = [];
    this.room.scene.remove(this.group);
    this.geo.dispose();
  }
}
