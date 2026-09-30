// The sky's defaults: Space's float background as it is drawn. Tune it in the ?debug=1 panel (in
// development), then paste its "Copy config" over this whole file. What each value means is told
// on the types (Sky.ts, layer.ts, Stars.ts, Planets.ts); any number or colour may be a { range: [a, b] } the
// visit's seed picks within, with a `lock` to hold it (tune.ts).
import type { PlanetsConfig } from "./Planets";
import type { SkyConfig } from "./Sky";
import type { StarsConfig } from "./Stars";

export const SKY: SkyConfig = {
  seed: null,
  variants: {
    common: { weight: 70, layers: {} },
    uncommon: {
      weight: 20,
      layers: { stars: { count: { range: [760, 980] }, milkyWay: { enabled: true } } },
    },
    rare: {
      weight: 8,
      layers: {
        stars: {
          palette: [
            { colour: "#fff1dc", weight: 4 },
            { colour: "#ffe0ae", weight: 3 },
            { colour: "#f4c878", weight: 2.5 },
            { colour: "#d6e0ff", weight: 1 },
          ],
          sparkle: { count: { range: [11, 16] }, tintMix: { range: [0.55, 0.8] } },
        },
      },
    },
    "very rare": { weight: 2, layers: { stars: { shooting: { enabled: true } } } },
  },
};

export const STARS: StarsConfig = {
  enabled: true,
  opacity: 1,
  renderOrder: 0,
  zoomResponse: 1,
  parallax: 0,
  backdrop: "#16161d",
  count: { range: [420, 560] },
  size: { min: 0.35, max: { range: [1.7, 2.3] }, bias: { range: [3.2, 4.2] } },
  palette: [
    { colour: "#fff4e4", weight: 6 },
    { colour: "#cddbff", weight: 3 },
    { colour: "#f2d596", weight: 1.2 },
  ],
  brightness: { min: 0.22, max: 0.95, follow: 0.6 },
  glow: { size: 3.2, strength: 0.32 },
  bands: [
    { share: 0.55, zoomResponse: 0.05, scale: 0.8, pixelFrom: 0.4, pixelMost: 6 },
    { share: 0.3, zoomResponse: 0.1, scale: 1, pixelFrom: 0.25, pixelMost: 4 },
    { share: 0.15, zoomResponse: 0.18, scale: 1.15, pixelFrom: 0.15, pixelMost: 2.5 },
  ],
  twinkle: { speed: { range: [0.5, 0.8] }, amount: 0.35 },
  sparkle: {
    count: { range: [5, 8] },
    size: { range: [14, 22] },
    rotation: { range: [-8, 8] },
    jitter: 6,
    strength: 0.8,
    tint: "#f6d48f",
    tintMix: 0,
  },
  milkyWay: {
    enabled: false,
    angle: { range: [-38, -18] },
    offset: { range: [-0.12, 0.12] },
    width: { range: [0.045, 0.07] },
    share: 0.6,
    haze: { range: [0.07, 0.1] },
    patchy: { range: [0.75, 0.95] },
    hazeColour: "#a9b6e6",
  },
  shooting: {
    enabled: false,
    every: { range: [16, 32] },
    duration: { range: [1.8, 2.6] },
    travel: { range: [280, 420] },
    length: { range: [110, 180] },
    width: 0.9,
    brightness: 0.85,
    colour: "#fff6e8",
  },
};

export const PLANETS: PlanetsConfig = {
  enabled: true,
  opacity: 1,
  renderOrder: 1,
  zoomResponse: 1,
  parallax: 0,
  pool: { ocean: 1 },
  count: { min: 2, max: 3 },
  depth: {
    far: { zoomResponse: 0.25, size: 0.75, pixelFrom: 0.7, pixelMost: 6 },
    near: { zoomResponse: 0.5, size: 1.3, pixelFrom: 0.55, pixelMost: 5 },
  },
  minPx: 18,
  light: { x: 0.55, y: 0.62, z: 0.56 },
  spin: { min: 80, max: 150 },
  tilt: 24,
  tip: { min: 10, max: 26 },
  place: { top: 70, bottom: 76, left: 16, right: 60, tries: 32, apart: 1.5, clear: 0.62, enough: 0.12, pull: 0.5 },
  ocean: {
    size: 0.5,
    vary: 0.12,
    bake: { width: 1024, cover: 0.46, puff: 1 },
    islands: 0,
    deep: "#0c97bd",
    mid: "#19c6cc",
    shallow: "#86f5e4",
    night: "#0c2340",
    sand: "#ffe8a8",
    green: "#56d18a",
    glint: 0.55,
    glintPower: 70,
    clouds: {
      lit: "#ffffff",
      shade: "#9db2d9",
      night: "#26314f",
      step: { from: 0.2, to: 0.4 },
      bump: 1,
      drift: 1.18,
      shadow: 0.3,
      reach: 0.035,
    },
    haze: { colour: "#e9fbff", amount: 0.85, power: 2.4 },
    dusk: { colour: "#ffb3c1", amount: 0.28 },
    rim: { colour: "#cdf8ff", width: 0.035 },
    glow: { colour: "#a6ecff", width: 0.3, amount: 0.32 },
  },
};
