import * as THREE from "three";
import { REST } from "../Float";
import { PIXEL_LEAST, levelCell } from "@/engine/common/pixel";
import { pixelCellAt } from "../RoomScene";
import type { LayerConfig, SkyFrame, SkyLayer, SkyView } from "./layer";
import type { PlanetBody } from "./planets/body";
import { pickWeighted, rng, subSeed, type Colour, type Num, type Resolved } from "./tune";

/** The planets there are, by the names `/?planets=` knows them by. */
export const PLANET_KINDS = ["ocean"] as const;
export type PlanetKind = (typeof PLANET_KINDS)[number];

/**
 * The ocean world: all sea, clear turquoise, under big anime cumulus (heaps of round puffs, bright
 * white tops, soft blue-grey underneath) that drift a little faster than the sea turns, with a soft
 * white haze where the sea meets the air and a thin rim on the lit side.
 */
export type OceanLook = {
  /** Its size (before its depth's), a share of the floating figure's height, and how much a sky's may vary either way (a share of it). */
  size: Num;
  vary: Num;
  /**
   * Baked once for the sky into a 2:1 equirectangular texture at most `width` texels round (less for a
   * planet that is never seen that big): the sea floor, and the clouds' heights and slopes. `cover`, how
   * much of it the clouds cover; `puff`, the size of their puffs (1 as drawn).
   */
  bake: { width: number; cover: Num; puff: Num };
  /** How much of the sea floor stands out of the water as islands: 0 none (all sea) .. 1 a lot. */
  islands: Num;
  /** The sea from deep to shallow (round any islands), its night side, and the islands' sand and green. */
  deep: Colour;
  mid: Colour;
  shallow: Colour;
  night: Colour;
  sand: Colour;
  green: Colour;
  /** The sea's sun glint, and how tight it is. */
  glint: Num;
  glintPower: Num;
  clouds: {
    /** Tops in the sun, the sides turned from it, and on the night side. */
    lit: Colour;
    shade: Colour;
    night: Colour;
    /** The step from shade to lit, on the light the puff's own surface gets (a soft cel step). */
    step: { from: Num; to: Num };
    /** How strongly the puffs' shapes turn their surface from the planet's (1 as baked). */
    bump: Num;
    /** They turn this much faster than the sea, so they drift over it. */
    drift: Num;
    /** Their shadow on the sea: how dark, and how far toward the sun it is cast from (a share of the radius). */
    shadow: Num;
    reach: Num;
  };
  /** Where the sea meets the air: a soft white haze, at the limb and on the lit side. */
  haze: { colour: Colour; amount: Num; power: Num };
  /** The terminator's warm band, on the sea and the clouds. */
  dusk: { colour: Colour; amount: Num };
  /** The thin atmosphere rim on the lit side: its colour, and its width (a share of the radius, never under 1.2 device px). */
  rim: { colour: Colour; width: Num };
  /** The soft bloom round what is bright (the rim, the lit limb): colour, width (a share of the radius) and strength. */
  glow: { colour: Colour; width: Num; amount: Num };
};

/** Each kind's look, by its name. */
export type PlanetLooks = { ocean: OceanLook };

/** A depth's way with the zoom, as the stars' bands have it (see StarsConfig.bands), and how big a planet there is drawn. */
type Depth = { zoomResponse: Num; size: Num; pixelFrom: Num; pixelMost: Num };

/**
 * The planets: two or three small, distant worlds in the sky, over the stars. The sky's seed picks
 * them from `pool` (each kind by its weight among those not yet picked; `/?planets=` picks them
 * instead: a list, `ocean,ocean` for two, `all` for one of each, `none`), puts each at its own depth
 * and places it clear of the others and of where Urchi floats.
 */
export type PlanetsConfig = LayerConfig & {
  /** Each kind's weight against the others' (0: never picked). */
  pool: Record<PlanetKind, Num>;
  /** How many a sky picks, from `min` to `max`, each as likely (fewer if there are fewer kinds). */
  count: { min: number; max: number };
  /**
   * Their depths run from `far` to `near`, one planet in each stretch: each follows the zoom by its
   * depth's `zoomResponse` (times the layer's), about the room's middle, as the stars' depths do but
   * nearer, so they move more than any star; is drawn `size` times its kind's size; is drawn in
   * square cells of whole device pixels, never finer than pixel level 1 (the new zero); and zoomed
   * out past `pixelFrom` loses more of its signal as Urchi does, its cells growing from level 1's to
   * `pixelMost` CSS px at the zoom's farthest, the far ones first. Farther off than Urchi, a
   * planet loses its signal sooner than it does (Urchi from ZOOM.pixelFrom, 40%).
   */
  depth: { far: Depth; near: Depth };
  /** Never smaller than this across (CSS px) at zoom 1: a phone's sky still reads. */
  minPx: Num;
  /** The sun, as a direction in view space (x right, y up, z toward you): over the viewer's right shoulder, as Urchi's suit is lit, a little more from the side so each planet shows its night. */
  light: { x: Num; y: Num; z: Num };
  /** A turn takes between these many seconds (slow), the same way round for all of them; none under reduced motion. */
  spin: { min: Num; max: Num };
  /** The axis leans up to `tilt` degrees either way in the screen's plane, and its north pole toward you by between `tip.min` and `tip.max`, so it turns as a ball does. */
  tilt: Num;
  tip: { min: Num; max: Num };
  /**
   * Where they may go (CSS px from the room's edges, a planet's reach included): under the tab bar,
   * over the caption's band and clear of the zoom slider on the right. Each is the best of `tries`
   * spots: far from the others (by `apart` times their reach) and from where Urchi floats (`clear` of
   * the figure's height round it), where anything `enough` of the room's shorter side farther than
   * that counts the same, so they are not always pushed into the far corners. The spots are drawn
   * in toward the room's middle to `pull` of the way out to those edges, so the planets keep round
   * the middle of the page.
   */
  place: { top: number; bottom: number; left: number; right: number; tries: number; apart: Num; clear: Num; enough: Num; pull: Num };
} & PlanetLooks;

/** How far round its middle a planet keeps the others off, in its radii: its disc and the start of its glow. */
const SPACING = 1.25;
/** A planet made after the sky has come in comes up over this long (s), not all at once. */
const APPEAR = 0.6;

/** One of the sky's planets: what it is, its seed, and where it lies between the far depth (0) and the near (1). */
type Pick = { kind: PlanetKind; seed: number; depth: number; vary: number; period: number; phase: number; tilt: number; tip: number };
/** A planet as laid out: its pick, its depth's ways, its place and size at zoom 1 (room CSS px, y up), and its body once made. */
type Slot = Pick & { key: string; response: number; from: number; most: number; x: number; y: number; radius: number; body: PlanetBody | null; appear: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Which planets `/?planets=` asks for, in order; null when it asks for nothing. */
function asked(): PlanetKind[] | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("planets");
  if (q === null) return null;
  if (q.trim() === "all") return [...PLANET_KINDS];
  return q
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PlanetKind => (PLANET_KINDS as readonly string[]).includes(s));
}

/**
 * The planets layer (see PlanetsConfig). Each planet is a real sphere, traced a pixel at a time on a
 * square in the room's scene, with a 2:1 equirectangular surface baked on the GPU for the sky; it
 * spins slowly about its tilted axis under a sun that stays with the view, so its night side never
 * turns with the ground (planets/body.ts). Nothing of them is fetched or made until the float is on
 * its way (warm): their code is its own chunk, loaded as Urchi dissolves, and each surface is baked
 * once its shaders have compiled. Laid out on setup; each frame poses them.
 */
export class Planets implements SkyLayer<PlanetsConfig> {
  readonly name = "planets";
  /** Their meshes' parent: a plain object, not a group, so each mesh sorts by its own renderOrder among the sky's layers. */
  readonly object = new THREE.Object3D();
  private cfg: Resolved<PlanetsConfig> | null = null;
  private view: SkyView | null = null;
  /** The least cell there is, device px: pixel level 1's (the new zero). */
  private least = 0;
  private slots: Slot[] = [];
  /** Bodies made, by their pick's key, kept across layouts (a resize, a tuned value). */
  private bodies = new Map<string, PlanetBody>();
  private making = new Set<string>();
  private warmed = false;
  private loading: Promise<typeof import("./planets/body")> | null = null;
  /** Seconds they have turned for (not under reduced motion, where they hold still). */
  private t = 0;
  private disposed = false;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly camera: THREE.Camera,
  ) {}

  /** The sky's planets, for headless QA: what each is, how near, where, and whether it is made yet. */
  get picked() {
    return this.slots.map((s) => ({ kind: s.kind, depth: s.depth, x: s.x, y: s.y, radius: s.radius, ready: !!s.body }));
  }

  setup(config: Resolved<PlanetsConfig>, seed: number, view: SkyView) {
    this.cfg = config;
    this.view = view;
    this.least = levelCell(PIXEL_LEAST, view.ratio);
    const picks = this.pick(config, seed);
    const far = config.depth.far, near = config.depth.near, old = new Map(this.slots.map((s) => [s.key, s]));
    this.slots = picks.map((p, i) => {
      const key = `${p.kind}:${p.seed}:${i}`, d = p.depth;
      const size = config[p.kind].size * (1 + config[p.kind].vary * p.vary) * lerp(far.size, near.size, d);
      return {
        ...p,
        key,
        response: config.zoomResponse * lerp(far.zoomResponse, near.zoomResponse, d),
        from: lerp(far.pixelFrom, near.pixelFrom, d),
        most: Math.max(1, lerp(far.pixelMost, near.pixelMost, d) * view.ratio),
        x: 0,
        y: 0,
        radius: Math.max(config.minPx, size * view.figure) / 2,
        body: null,
        appear: old.get(key)?.appear ?? 0,
      };
    });
    this.place(config, seed, view);
    // bodies no longer picked go; those still picked take their new look; any missing are made
    const keys = new Set(this.slots.map((s) => s.key));
    for (const [k, b] of this.bodies) {
      if (keys.has(k)) continue;
      this.object.remove(b.mesh);
      b.dispose();
      this.bodies.delete(k);
    }
    for (const s of this.slots) {
      s.body = this.bodies.get(s.key) ?? null;
      s.body?.setLook(config[s.kind], config.light);
    }
    if (this.warmed) this.make();
  }

  /** The float is on its way (or the sky is previewed): load them, once, and make what is missing. */
  warm() {
    this.warmed = true;
    this.make();
  }

  /** Every planet laid out that has no body yet gets one: the code loaded (again, had it failed), each made in turn. */
  private make() {
    if (this.disposed || !this.slots.some((s) => !s.body && !this.making.has(s.key))) return;
    this.loading ??= import("./planets/body");
    this.loading.then(
      async ({ PlanetBody }) => {
        for (const s of this.slots) {
          if (this.disposed || s.body || this.making.has(s.key) || !this.cfg || !this.view) continue;
          this.making.add(s.key);
          try {
            const look = this.cfg[s.kind];
            const body = await PlanetBody.create(s.kind, this.renderer, s.seed, look, this.bakeWidth(s), this.camera);
            // laid out again while it was made: still wanted, with the look it has now?
            const now = this.slots.find((n) => n.key === s.key);
            if (this.disposed || !now || !this.cfg) {
              body.dispose();
              continue;
            }
            body.setLook(this.cfg[s.kind], this.cfg.light);
            this.object.add(body.mesh);
            this.bodies.set(s.key, body);
            now.body = body;
          } finally {
            this.making.delete(s.key);
          }
        }
      },
      () => {
        this.loading = null; // (a failed fetch is tried again at the next warm)
      },
    );
  }

  /**
   * How wide its surface is baked: about a texel a device pixel round its equator at the most it is
   * zoomed in to, in powers of two from 256 up to its look's bake.width.
   */
  private bakeWidth(s: Slot) {
    const v = this.view!, most = Math.max(1, v.zoom.max ** s.response), round = Math.PI * 2 * s.radius * most * v.ratio;
    return Math.min(this.cfg![s.kind].bake.width, Math.max(256, 2 ** Math.ceil(Math.log2(Math.max(1, round)))));
  }

  /**
   * The sky's planets for its seed (or the ones the address asks for): `count` picked by weight,
   * each then given a depth (one in each stretch between far and near, shuffled among them, so no
   * two are at nearly the same distance), a size within its kind's `vary`, a turn and a lean.
   */
  private pick(c: Resolved<PlanetsConfig>, seed: number): Pick[] {
    const draw = rng(subSeed(seed, "pick"));
    let kinds = asked();
    if (!kinds) {
      const pool = Object.fromEntries(PLANET_KINDS.map((k) => [k, Math.max(0, c.pool[k] ?? 0)] as const).filter(([, w]) => w > 0));
      const least = Math.max(0, Math.round(Math.min(c.count.min, c.count.max))), most = Math.max(least, Math.round(c.count.max));
      let n = Math.min(Object.keys(pool).length, least + Math.floor(draw() * (most - least + 1)));
      kinds = [];
      while (n-- > 0) {
        const k = pickWeighted(pool, draw()) as PlanetKind;
        kinds.push(k);
        delete pool[k];
      }
    }
    const depths = kinds.map((_, i) => (i + 0.15 + 0.7 * draw()) / kinds.length);
    for (let i = depths.length - 1; i > 0; i--) {
      const j = Math.floor(draw() * (i + 1));
      [depths[i], depths[j]] = [depths[j], depths[i]];
    }
    const rad = Math.PI / 180;
    return kinds.map((kind, i) => ({
      kind,
      seed: Math.floor(draw() * 2 ** 31),
      depth: depths[i],
      vary: 2 * draw() - 1,
      period: Math.max(1, lerp(c.spin.min, c.spin.max, draw())),
      phase: draw() * Math.PI * 2,
      tilt: (2 * draw() - 1) * c.tilt * rad,
      tip: lerp(c.tip.min, c.tip.max, draw()) * rad,
    }));
  }

  /**
   * Each planet placed (the biggest first) at the best of PLANETS.place.tries spots for the seed:
   * the first clear enough of the others and of where Urchi floats, drawn in toward the middle (see
   * PlanetsConfig.place). The spots are shares of the room, the same ones every time, so a small
   * change of size keeps them where they were.
   */
  private place(c: Resolved<PlanetsConfig>, seed: number, v: SkyView) {
    const P = c.place, w = v.width, h = v.height, rest = w <= 640 ? REST.phone : REST;
    const home = { x: rest.x * w - w / 2, y: h / 2 - rest.y * h };
    const draw = rng(subSeed(seed, "place"));
    const placed: Slot[] = [];
    for (const s of [...this.slots].sort((a, b) => b.radius - a.radius)) {
      const reach = s.radius * SPACING;
      const x0 = -w / 2 + P.left + reach, x1 = w / 2 - P.right - reach;
      const y0 = -h / 2 + P.bottom + reach, y1 = h / 2 - P.top - reach;
      let best = -Infinity;
      for (let t = 0; t < Math.max(1, P.tries); t++) {
        const fx = draw(), fy = draw();
        const x = P.pull * (x0 < x1 ? lerp(x0, x1, fx) : (x0 + x1) / 2), y = P.pull * (y0 < y1 ? lerp(y0, y1, fy) : (y0 + y1) / 2);
        let score = Math.min(P.enough * Math.min(w, h), Math.hypot(x - home.x, y - home.y) - P.clear * v.figure - reach);
        for (const o of placed) score = Math.min(score, Math.hypot(x - o.x, y - o.y) - P.apart * (reach + o.radius * SPACING));
        if (score > best) {
          best = score;
          s.x = x;
          s.y = y;
        }
      }
      placed.push(s);
    }
  }

  update(f: SkyFrame) {
    const c = this.cfg, v = this.view;
    if (!c || !v) return;
    if (!f.reducedMotion) this.t += f.dt;
    const z = Math.max(f.zoom, 1e-3), fade = Math.max(0, c.opacity) * f.presence, lean = f.reducedMotion ? 0 : c.parallax;
    // nearer ones lean further, by their zoom response against the nearest's
    const nearest = Math.max(1e-6, ...this.slots.map((s) => Math.abs(s.response)));
    for (const s of this.slots) {
      const b = s.body;
      if (!b) continue;
      s.appear = f.reducedMotion ? 1 : Math.min(1, s.appear + f.dt / APPEAR);
      // behind the motes and the line, over the stars, the far ones first
      b.mesh.renderOrder = this.object.renderOrder + 0.01 * (1 + s.depth);
      const k = z ** s.response, share = Math.abs(s.response) / nearest;
      b.pose(
        {
          x: s.x * k - f.pointer.x * lean * share,
          y: s.y * k - f.pointer.y * lean * share,
          radius: s.radius * k,
          cell: pixelCellAt(f.zoom, s.from, s.most, this.least),
          fade: fade * s.appear,
          spin: s.phase + (Math.PI * 2 * this.t) / s.period,
          tilt: s.tilt,
          tip: s.tip,
        },
        v,
      );
    }
  }

  backdrop() {
    return null;
  }

  dispose() {
    this.disposed = true;
    for (const b of this.bodies.values()) {
      this.object.remove(b.mesh);
      b.dispose();
    }
    this.bodies.clear();
    this.slots = [];
  }
}
