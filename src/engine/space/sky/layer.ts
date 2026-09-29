import type * as THREE from "three";
import type { Num, Resolved } from "./tune";

/**
 * What every layer of the sky has in its config (each layer adds its own). Any `Num` may be a
 * range the sky's seed picks within (see tune.ts).
 */
export type LayerConfig = {
  /** Drawn at all. */
  enabled: boolean;
  /** Its strength, 0 .. 1; the sky coming and going (the float in, the flight home) multiplies it. */
  opacity: Num;
  /** Its place among the sky's layers, higher drawn over lower. Every one is behind the motes, the line and Urchi. */
  renderOrder: number;
  /**
   * How far it follows the zoom slider: 0 not at all, 1 as its own depths ask. A layer scales
   * about the room's middle by the zoom to a power (its depths' responses times this), so what is
   * nearer grows and shrinks more, and zooming reads as depth.
   */
  zoomResponse: Num;
  /** How far it leans against the pointer, CSS px with the pointer at the room's edge; 0 none (not under reduced motion). */
  parallax: Num;
  /** Reserved for its pixelation: a cell in device px, 0 off. Nothing reads it yet. */
  pixelSize: Num;
};

/**
 * Where the float is, as the sky sees it: off (Urchi home, or on its way: dissolving, the empty
 * beats, coming home), arriving (floating in), afloat, or leaving (its line snapped, flying home).
 */
export type SkyState = "off" | "arriving" | "afloat" | "leaving";

/** The room as the layers lay out in it: CSS px, device px per CSS px, and the zoom's bounds. */
export type SkyView = { width: number; height: number; ratio: number; zoom: { min: number; max: number } };

/** What the manager gives each layer every frame. */
export type SkyFrame = {
  /** Seconds since the last frame, and the sky's own clock (s). */
  dt: number;
  time: number;
  /** Urchi's zoom as drawn this frame: 1 as it floats (and at home), down to the view's min, up to its max. */
  zoom: number;
  /** The pointer from the room's middle, -1 .. 1 each way (y up), eased; 0 with no pointer. */
  pointer: { x: number; y: number };
  state: SkyState;
  /** How much of the sky is there, 0 .. 1: it comes in with the float, and goes with the flight home and for a tab's slide. */
  presence: number;
  reducedMotion: boolean;
};

/** A layer of the sky: its own module and config, drawn by the manager (Sky.ts) in the room's scene. */
export interface SkyLayer<C extends LayerConfig = LayerConfig> {
  /** Its name: its key in a variant's patches and in the panel. */
  readonly name: string;
  /** What it draws, added to the room's scene by the manager (which sets its renderOrder). */
  readonly object: THREE.Object3D;
  /** Laid out afresh: a new sky (seed, variant), a tuned config, or a resized room. `seed` is this layer's own. */
  setup(config: Resolved<C>, seed: number, view: SkyView): void;
  /** A frame, while any of the sky is there. Uniforms only: nothing is laid out again here. */
  update(frame: SkyFrame): void;
  /** The ground it paints behind everything, #rrggbb, or null: the lowest layer's is the room's while the sky is there. */
  backdrop(): string | null;
  dispose(): void;
}
