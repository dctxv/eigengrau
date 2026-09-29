// The sky's defaults: Space's float background as it is drawn. Tune it in the ?debug=1 panel (in
// development), then paste its "Copy config" over this whole file. What each value means is told
// on the types (Sky.ts, layer.ts, Stars.ts); any number or colour may be a { range: [a, b] } the
// visit's seed picks within, with a `lock` to hold it (tune.ts).
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
  pixelSize: 0,
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
    { share: 0.55, zoomResponse: 0.05, scale: 0.8 },
    { share: 0.3, zoomResponse: 0.1, scale: 1 },
    { share: 0.15, zoomResponse: 0.18, scale: 1.15 },
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
