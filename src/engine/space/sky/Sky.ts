import * as THREE from "three";
import { GL, rawColor } from "@/engine/common/color";
import { FLOAT_IN, type FloatState } from "../Float";
import { ZOOM, type RoomScene } from "../RoomScene";
import { PLANETS, SKY, STARS } from "./defaults";
import type { LayerConfig, SkyFrame, SkyLayer, SkyState, SkyView } from "./layer";
import { Planets, type PlanetsConfig } from "./Planets";
import { keepSeed, rollSeed, urlSeed, visitSeed } from "./seed";
import { Stars, type StarsConfig } from "./Stars";
import { hashSeed, hasLock, merge, pickWeighted, resolve, subSeed, unitOf, type Patch, type Resolved } from "./tune";

/** Every layer's config, by its name. */
export type SkyLayers = { stars: StarsConfig; planets: PlanetsConfig };
/** What a variant lays over each layer's config (see Patch), by the layer's name. */
export type SkyPatches = { [K in keyof SkyLayers]?: Patch<SkyLayers[K]> };
/** A sky a seed may draw: its odds (its weight against the others') and what it changes. */
export type SkyVariant = { weight: number; layers: SkyPatches };

/** The sky's own config (its layers have their own). */
export type SkyConfig = {
  /** null: a new sky each visit, kept for the visit, reloads included; a seed: that sky on every visit. ?sky=<seed> beats both. */
  seed: string | null;
  /** The skies a seed may draw, as the eyes draw their colourways: by weight. */
  variants: Record<string, SkyVariant>;
};

/**
 * How the sky comes and goes, in seconds: in with the float-in (`in`, as long as it, easing out,
 * as the zoom slider does), out with the flight home over `out`, so it is all but gone as Urchi
 * leaves the page; whatever is left once the room is empty goes in `gone`, so the empty beat is
 * never seen with a sky. For a tab's slide it goes in `slide` (within the slide's wait, before the
 * pages move), and comes back over `back` once they have stopped.
 */
const FADE = { in: FLOAT_IN, out: 0.5, gone: 0.12, slide: 0.18, back: 0.6 };
type Ease = "in" | "out" | "inOut";
const EASE: Record<Ease, (t: number) => number> = {
  in: (t) => 1 - Math.cos((t * Math.PI) / 2),
  out: (t) => Math.sin((t * Math.PI) / 2),
  inOut: (t) => (1 - Math.cos(t * Math.PI)) / 2,
};
/** The pointer's lean eases toward it over about this long (s). */
const LEAN_EASE = 0.35;
/** Every layer is drawn at this renderOrder plus its own: behind the motes (-1), the line (-0.5) and Urchi (0). */
const ORDER = -100;

type Entry = { layer: SkyLayer; resolved: Resolved<LayerConfig> | null };

/**
 * The sky behind Urchi afloat (Space): its layers, each its own module with its own config, drawn
 * in the room's scene in their order, behind everything else there. It comes in with the float-in
 * and goes with the flight home, and is never there at home, in the empty beats between, or while
 * the tabs slide. Each frame it gives every layer the zoom, its clock, the pointer and where the
 * float is; while none of it is there nothing is drawn and no layer is asked anything.
 *
 * Each visit draws a sky from a seed (seed.ts): the seed picks a variant by weight, which is laid
 * over each layer's config, and then every range in it (tune.ts).
 */
export class Sky {
  /** The sky's config and its layers', as drawn: the defaults (defaults.ts), and whatever the ?debug=1 panel has tuned since. */
  readonly config: SkyConfig;
  readonly layers: SkyLayers;
  /** The seed drawn, and where it came from: the address, the config, or the visit. */
  seed: string;
  /** The variant the seed drew (or the panel holds). */
  variant = "";
  /** The panel's: a variant held whatever the seed draws (null: the seed's). */
  forced: string | null = null;
  private room: RoomScene;
  private reduced: boolean;
  private entries: Entry[] = [];
  private view: SkyView | null = null;
  private state: SkyState = "off";
  private held = false;
  private previewing = false;
  /** How much of the sky is there (0 .. 1), and where it is fading to. */
  private presence = 0;
  private fade: { from: number; to: number; t0: number; dur: number; ease: Ease } | null = null;
  private time = 0;
  private pointerTo: { x: number; y: number } | null = null;
  private pointerNow = { x: 0, y: 0 };
  private cleared = "";
  private clear = new THREE.Color();
  private followers = new Set<(frame: SkyFrame) => void>();
  private stopFrame: () => void;

  constructor(room: RoomScene, o: { reducedMotion: boolean }) {
    this.room = room;
    this.reduced = o.reducedMotion;
    this.config = structuredClone(SKY);
    this.layers = { stars: structuredClone(STARS), planets: structuredClone(PLANETS) };
    this.seed = urlSeed() ?? this.config.seed ?? visitSeed();
    this.add(new Stars());
    this.add(new Planets(room.renderer, room.camera));
    this.apply();
    this.stopFrame = room.onFrame((dt) => this.frame(dt));
  }

  /** Where the seed came from. */
  get source(): "url" | "config" | "visit" {
    return urlSeed() ? "url" : this.config.seed ? "config" : "visit";
  }

  /** A layer's config as drawn now: its variant laid over it, its ranges picked. */
  resolved<K extends keyof SkyLayers>(name: K): Resolved<SkyLayers[K]> | null {
    return (this.entries.find((e) => e.layer.name === name)?.resolved as Resolved<SkyLayers[K]> | undefined) ?? null;
  }

  // ---------------------------------------------------------------- what the page tells it

  /** Where the float is: the sky follows (see FADE). Once it is on its way, the layers that load late start loading. */
  setFloat(s: FloatState) {
    if (s !== "home" && s !== "returning") this.warm();
    const state: SkyState = s === "arriving" ? "arriving" : s === "floating" ? "afloat" : s === "flying" ? "leaving" : "off";
    if (state === this.state) return;
    this.state = state;
    if (this.wanted) this.fadeTo(1, state === "arriving" ? FADE.in : FADE.back, "out");
    else if (state === "leaving") this.fadeTo(0, FADE.out, "inOut");
    else this.fadeTo(0, FADE.gone, "in", true);
  }

  /** A tab's slide: the sky goes before the pages move (true), and comes back once they have stopped (false). */
  hold(on: boolean) {
    if (on === this.held) return;
    this.held = on;
    if (on) this.fadeTo(0, FADE.slide, "in", true);
    else if (this.wanted) this.fadeTo(1, FADE.back, "out");
  }

  /** The panel's: the sky shown at home too, to tune it without taking Urchi out. */
  set preview(on: boolean) {
    this.previewing = on;
    if (on) this.warm();
    if (this.wanted) this.fadeTo(1, FADE.back, "out");
    else this.fadeTo(0, FADE.gone, "in", true);
  }

  get preview() {
    return this.previewing;
  }

  /** The pointer, in client px (a mouse or a pen; null: gone), for the layers' lean. */
  pointer(clientX: number | null, clientY = 0) {
    if (clientX === null) {
      this.pointerTo = null;
      return;
    }
    const r = this.room.canvas.getBoundingClientRect(), clamp = (v: number) => Math.max(-1, Math.min(1, v));
    this.pointerTo = { x: clamp((clientX - r.left - r.width / 2) / (r.width / 2 || 1)), y: clamp((r.top + r.height / 2 - clientY) / (r.height / 2 || 1)) };
  }

  /**
   * What is drawn with the sky without being one of its tuned layers (the things Urchi has caught,
   * sky/Found.ts): told every frame what each layer is, however much of the sky is there (none
   * too), after the layers. Returns the way to stop.
   */
  follow(fn: (frame: SkyFrame) => void) {
    this.followers.add(fn);
    return () => {
      this.followers.delete(fn);
    };
  }

  /** The sky's seed as a number, for what is laid out with it (the same sky, the same places). */
  get seedNumber() {
    return hashSeed(this.seed);
  }

  /** Where its planets are (room CSS px at zoom 1, y up) and how big, for what keeps clear of them. */
  get planetSpots(): { x: number; y: number; radius: number }[] {
    const p = this.entries.find((e) => e.layer.name === "planets")?.layer as Planets | undefined;
    return p ? p.picked.map(({ x, y, radius }) => ({ x, y, radius })) : [];
  }

  // ---------------------------------------------------------------- drawing a sky

  /**
   * A new sky: `seed`, or one rolled now. It stays the visit's; and where the seed came from the
   * address or the config, it goes there too, so a reload keeps it. A variant with values locked in
   * it is being tuned, so it is held (see forced), and its locks hold; the layers' own locks hold
   * whatever the variant (see merge). Returns whether it held one.
   */
  reroll(seed = rollSeed()) {
    const hold = !this.forced && hasLock(this.config.variants[this.variant]?.layers);
    if (hold) this.forced = this.variant;
    this.seed = seed;
    keepSeed(seed);
    if (urlSeed()) {
      const url = new URL(window.location.href);
      url.searchParams.set("sky", seed);
      window.history.replaceState(window.history.state, "", url);
    } else if (this.config.seed) this.config.seed = seed;
    this.apply();
    return hold;
  }

  /**
   * The sky drawn again from its config: the seed's variant (or the one held), laid over each
   * layer's config, its ranges picked; each layer laid out afresh, in its order. Also on a resize.
   */
  apply() {
    const h = hashSeed(this.seed), variants = this.config.variants;
    const weights = Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, v.weight]));
    this.variant = this.forced && variants[this.forced] ? this.forced : pickWeighted(weights, unitOf(h, "variant"));
    const buffer = this.room.renderer.domElement;
    const view = (this.view = {
      width: this.room.width,
      height: this.room.height,
      ratio: this.room.ratio,
      zoom: { min: ZOOM.min, max: ZOOM.max },
      grid: { x: buffer.width / Math.max(1, this.room.width), y: buffer.height / Math.max(1, this.room.height) },
      figure: this.room.figureTall,
      panMost: this.room.panMost,
    });
    for (const e of this.entries) {
      const name = e.layer.name as keyof SkyLayers, seed = subSeed(h, name);
      const config = merge<LayerConfig>(this.layers[name], variants[this.variant]?.layers[name] as Patch<LayerConfig> | undefined);
      e.resolved = resolve(config, seed);
      e.layer.setup(e.resolved, seed, view);
      e.layer.object.renderOrder = ORDER + e.resolved.renderOrder;
    }
    this.entries.sort((a, b) => a.layer.object.renderOrder - b.layer.object.renderOrder);
  }

  // ---------------------------------------------------------------- frames

  /** Every layer that loads late starts loading (see SkyLayer.warm). */
  private warm() {
    for (const e of this.entries) e.layer.warm?.();
  }

  private add<C extends LayerConfig>(layer: SkyLayer<C>) {
    layer.object.visible = false;
    this.room.scene.add(layer.object);
    this.entries.push({ layer: layer as unknown as SkyLayer, resolved: null });
  }

  /** Whether the sky should be there: the float in or afloat (or the panel's preview), and no slide. */
  private get wanted() {
    return !this.held && (this.previewing || this.state === "arriving" || this.state === "afloat");
  }

  /** Fade to `to` over `seconds` (at once under reduced motion); one already on its way there goes on, unless this one is `sooner`. */
  private fadeTo(to: number, seconds: number, ease: Ease, sooner = false) {
    const f = this.fade;
    if (f ? f.to === to && !(sooner && f.t0 + f.dur - this.time > seconds) : this.presence === to) return;
    this.fade = { from: this.presence, to, t0: this.time, dur: this.reduced ? 0 : seconds, ease };
  }

  private frame(dt: number) {
    this.time += dt;
    const room = this.room, v = this.view;
    // resized, or on another screen: laid out afresh for it
    if (!v || v.width !== room.width || v.height !== room.height || v.ratio !== room.ratio) this.apply();
    const f = this.fade;
    if (f) {
      const t = f.dur > 0 ? Math.min(1, (this.time - f.t0) / f.dur) : 1;
      this.presence = f.from + (f.to - f.from) * EASE[f.ease](t);
      if (t >= 1) {
        this.presence = f.to;
        this.fade = null;
      }
    }
    const to = this.pointerTo ?? { x: 0, y: 0 }, p = this.pointerNow, k = 1 - Math.exp(-dt / LEAN_EASE);
    p.x += (to.x - p.x) * k;
    p.y += (to.y - p.y) * k;
    const frame: SkyFrame = { dt, time: this.time, zoom: room.zoom, pointer: p, pan: room.pan, state: this.state, presence: this.presence, reducedMotion: this.reduced };
    let backdrop: string | null = null;
    for (const e of this.entries) {
      const on = this.presence > 0 && !!e.resolved?.enabled;
      e.layer.object.visible = on;
      if (!on) continue;
      e.layer.update(frame);
      backdrop ??= e.layer.backdrop();
    }
    this.followers.forEach((fn) => fn(frame));
    this.paint(backdrop);
  }

  /** The room's ground: the lowest layer's backdrop as far as the sky is there, the room's own eigengrau where it is not. */
  private paint(backdrop: string | null) {
    const key = backdrop ? `${backdrop} ${this.presence}` : "";
    if (key === this.cleared) return;
    this.cleared = key;
    this.clear.copy(GL.bg);
    if (backdrop) this.clear.lerp(rawColor(backdrop), this.presence);
    this.room.renderer.setClearColor(this.clear);
  }

  dispose() {
    this.stopFrame();
    for (const e of this.entries) {
      this.room.scene.remove(e.layer.object);
      e.layer.dispose();
    }
    this.room.renderer.setClearColor(GL.bg);
  }
}
