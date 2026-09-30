import type { SkyLayers } from "../Sky";
import type { Resolved } from "../tune";

/** A place in a config: its keys and list indices, from the top. */
export type Path = (string | number)[];

/**
 * A row of the panel: a number (a slider, with its bounds and step; `whole` for a count; `fixed`
 * when it is never a range; `note` beside it; `off` shown but not to be changed), a colour (which
 * may be a range between two), or a switch (never a range).
 */
export type Row =
  | { kind: "num"; path: Path; label: string; min: number; max: number; step: number; whole?: boolean; fixed?: boolean; note?: string; off?: boolean }
  | { kind: "colour"; path: Path; label: string }
  | { kind: "bool"; path: Path; label: string };

export type Group = { title: string; rows: Row[] };

const num = (path: Path, label: string, min: number, max: number, step: number, more: Partial<Extract<Row, { kind: "num" }>> = {}): Row => ({ kind: "num", path, label, min, max, step, ...more });
const colour = (path: Path, label: string): Row => ({ kind: "colour", path, label });
const bool = (path: Path, label: string): Row => ({ kind: "bool", path, label });

/** What every layer has (layer.ts). */
const layerRows = (): Group => ({
  title: "Layer",
  rows: [
    bool(["enabled"], "enabled"),
    num(["opacity"], "opacity", 0, 1, 0.01),
    num(["renderOrder"], "renderOrder", -10, 10, 1, { whole: true, fixed: true }),
    num(["zoomResponse"], "zoomResponse", -1, 3, 0.01),
    num(["parallax"], "parallax", 0, 60, 0.5, { note: "px" }),
  ],
});

/** The stars' rows, for the config as drawn now (its palette and depths as long as they are). */
export function starsGroups(c: Resolved<SkyLayers["stars"]>): Group[] {
  return [
    layerRows(),
    { title: "Ground", rows: [colour(["backdrop"], "backdrop")] },
    { title: "Field", rows: [num(["count"], "count", 0, 2400, 1, { whole: true, note: "per 1440² px" })] },
    {
      title: "Size",
      rows: [num(["size", "min"], "min", 0, 3, 0.01, { note: "px" }), num(["size", "max"], "max", 0, 6, 0.01, { note: "px" }), num(["size", "bias"], "bias", 0.2, 8, 0.05)],
    },
    {
      title: "Brightness",
      rows: [num(["brightness", "min"], "min", 0, 1.5, 0.01), num(["brightness", "max"], "max", 0, 1.5, 0.01), num(["brightness", "follow"], "follow size", 0, 1, 0.01)],
    },
    { title: "Glow", rows: [num(["glow", "size"], "size", 0, 10, 0.1, { note: "× core" }), num(["glow", "strength"], "strength", 0, 1.5, 0.01)] },
    {
      title: "Palette",
      rows: c.palette.flatMap((_, i) => [colour(["palette", i, "colour"], `colour ${i + 1}`), num(["palette", i, "weight"], `weight ${i + 1}`, 0, 10, 0.1)]),
    },
    {
      title: "Depth bands (far → near)",
      rows: c.bands.flatMap((_, i) => [
        num(["bands", i, "share"], `${i + 1} share`, 0, 1, 0.01),
        num(["bands", i, "zoomResponse"], `${i + 1} zoomResponse`, -0.5, 1, 0.005),
        num(["bands", i, "scale"], `${i + 1} scale`, 0.2, 2, 0.01),
        num(["bands", i, "pixelFrom"], `${i + 1} pixelFrom`, 0, 1, 0.01, { note: "zoom; 0 never" }),
        num(["bands", i, "pixelMost"], `${i + 1} pixelMost`, 1, 24, 0.5, { note: "px, zoomed out" }),
      ]),
    },
    { title: "Twinkle", rows: [num(["twinkle", "speed"], "speed", 0, 5, 0.05, { note: "rad/s" }), num(["twinkle", "amount"], "amount", 0, 1, 0.01)] },
    {
      title: "Sparkle",
      rows: [
        num(["sparkle", "count"], "count", 0, 40, 1, { whole: true }),
        num(["sparkle", "size"], "size", 0, 40, 0.5, { note: "px" }),
        num(["sparkle", "rotation"], "rotation", -45, 45, 1, { note: "°" }),
        num(["sparkle", "jitter"], "jitter", 0, 45, 1, { note: "°" }),
        num(["sparkle", "strength"], "strength", 0, 2, 0.01),
        colour(["sparkle", "tint"], "tint"),
        num(["sparkle", "tintMix"], "tintMix", 0, 1, 0.01),
      ],
    },
    {
      title: "Milky Way",
      rows: [
        bool(["milkyWay", "enabled"], "enabled"),
        num(["milkyWay", "angle"], "angle", -90, 90, 1, { note: "°" }),
        num(["milkyWay", "offset"], "offset", -0.5, 0.5, 0.005),
        num(["milkyWay", "width"], "width", 0.01, 0.3, 0.005),
        num(["milkyWay", "share"], "share", 0, 1, 0.01),
        num(["milkyWay", "haze"], "haze", 0, 0.3, 0.002),
        num(["milkyWay", "patchy"], "patchy", 0, 1, 0.01),
        colour(["milkyWay", "hazeColour"], "hazeColour"),
      ],
    },
    {
      title: "Shooting star",
      rows: [
        bool(["shooting", "enabled"], "enabled"),
        num(["shooting", "every"], "every", 2, 120, 1, { note: "s" }),
        num(["shooting", "duration"], "duration", 0.3, 6, 0.05, { note: "s" }),
        num(["shooting", "travel"], "travel", 50, 1200, 5, { note: "px" }),
        num(["shooting", "length"], "length", 10, 500, 5, { note: "px" }),
        num(["shooting", "width"], "width", 0.3, 4, 0.05, { note: "px" }),
        num(["shooting", "brightness"], "brightness", 0, 2, 0.01),
        colour(["shooting", "colour"], "colour"),
      ],
    },
  ];
}

/** The planets' rows: the layer's, the pick and the depths, the sun and the turn, where they go, and each kind's look. */
export function planetsGroups(): Group[] {
  const kinds = Object.keys(PLANET_LOOKS) as (keyof typeof PLANET_LOOKS)[];
  return [
    layerRows(),
    { title: "Pick", rows: [...kinds.map((k) => num(["pool", k], `${k} weight`, 0, 10, 0.05)), num(["count", "min"], "count min", 0, 5, 1, { whole: true, fixed: true }), num(["count", "max"], "count max", 0, 5, 1, { whole: true, fixed: true })] },
    {
      title: "Depths (far, near)",
      rows: (["far", "near"] as const).flatMap((d) => [
        num(["depth", d, "zoomResponse"], `${d} zoomResponse`, -0.5, 1.5, 0.005),
        num(["depth", d, "size"], `${d} size`, 0.2, 3, 0.01, { note: "× kind" }),
        num(["depth", d, "pixelFrom"], `${d} pixelFrom`, 0, 1, 0.01, { note: "zoom; 0 never" }),
        num(["depth", d, "pixelMost"], `${d} pixelMost`, 1, 24, 0.5, { note: "px, zoomed out" }),
      ]),
    },
    {
      title: "Sun and turn",
      rows: [
        num(["light", "x"], "sun x", -1, 1, 0.01),
        num(["light", "y"], "sun y", -1, 1, 0.01),
        num(["light", "z"], "sun z", 0, 1, 0.01, { note: "toward you" }),
        num(["spin", "min"], "turn min", 10, 600, 1, { note: "s" }),
        num(["spin", "max"], "turn max", 10, 600, 1, { note: "s" }),
        num(["tilt"], "tilt", 0, 60, 1, { note: "°" }),
        num(["tip", "min"], "tip min", 0, 60, 1, { note: "°" }),
        num(["tip", "max"], "tip max", 0, 60, 1, { note: "°" }),
        num(["minPx"], "min size", 4, 60, 1, { note: "px" }),
      ],
    },
    {
      title: "Place",
      rows: [
        num(["place", "pull"], "pull", 0, 1, 0.01, { note: "to the middle" }),
        num(["place", "clear"], "clear of Urchi", 0, 2, 0.01, { note: "× figure" }),
        num(["place", "apart"], "apart", 0, 4, 0.05),
        num(["place", "enough"], "enough", 0, 0.5, 0.01),
        num(["place", "top"], "top", 0, 200, 1, { whole: true, fixed: true, note: "px" }),
        num(["place", "bottom"], "bottom", 0, 200, 1, { whole: true, fixed: true, note: "px" }),
        num(["place", "left"], "left", 0, 200, 1, { whole: true, fixed: true, note: "px" }),
        num(["place", "right"], "right", 0, 200, 1, { whole: true, fixed: true, note: "px" }),
        num(["place", "tries"], "tries", 1, 80, 1, { whole: true, fixed: true }),
      ],
    },
    ...kinds.flatMap((k) => PLANET_LOOKS[k]()),
  ];
}

/** Each kind's own groups. */
const PLANET_LOOKS = {
  ocean: (): Group[] => [
    {
      title: "Ocean",
      rows: [
        num(["ocean", "size"], "size", 0.02, 0.6, 0.005, { note: "× figure" }),
        num(["ocean", "vary"], "vary", 0, 0.5, 0.01),
        num(["ocean", "bake", "width"], "bake width", 256, 2048, 256, { whole: true, fixed: true, note: "texels, at most" }),
        num(["ocean", "bake", "cover"], "cloud cover", 0, 1, 0.01, { note: "baked" }),
        num(["ocean", "bake", "puff"], "puff size", 0.3, 2.5, 0.01, { note: "baked" }),
        num(["ocean", "islands"], "islands", 0, 1, 0.01),
        colour(["ocean", "deep"], "deep"),
        colour(["ocean", "mid"], "mid"),
        colour(["ocean", "shallow"], "shallow"),
        colour(["ocean", "night"], "night"),
        colour(["ocean", "sand"], "sand"),
        colour(["ocean", "green"], "green"),
        num(["ocean", "glint"], "glint", 0, 2, 0.01),
        num(["ocean", "glintPower"], "glint tight", 2, 200, 1),
      ],
    },
    {
      title: "Ocean: clouds",
      rows: [
        colour(["ocean", "clouds", "lit"], "lit"),
        colour(["ocean", "clouds", "shade"], "shade"),
        colour(["ocean", "clouds", "night"], "night"),
        num(["ocean", "clouds", "step", "from"], "step from", -1, 1, 0.01),
        num(["ocean", "clouds", "step", "to"], "step to", -1, 1, 0.01),
        num(["ocean", "clouds", "bump"], "bump", 0, 3, 0.01),
        num(["ocean", "clouds", "drift"], "drift", 0.5, 2, 0.01, { note: "× the sea's turn" }),
        num(["ocean", "clouds", "shadow"], "shadow", 0, 1, 0.01),
        num(["ocean", "clouds", "reach"], "shadow reach", 0, 0.15, 0.001),
      ],
    },
    {
      title: "Ocean: air",
      rows: [
        colour(["ocean", "haze", "colour"], "haze"),
        num(["ocean", "haze", "amount"], "haze amount", 0, 1, 0.01),
        num(["ocean", "haze", "power"], "haze power", 0.5, 6, 0.05),
        colour(["ocean", "dusk", "colour"], "dusk"),
        num(["ocean", "dusk", "amount"], "dusk amount", 0, 1, 0.01),
        colour(["ocean", "rim", "colour"], "rim"),
        num(["ocean", "rim", "width"], "rim width", 0, 0.2, 0.001, { note: "× radius" }),
        colour(["ocean", "glow", "colour"], "glow"),
        num(["ocean", "glow", "width"], "glow width", 0, 1, 0.01, { note: "× radius" }),
        num(["ocean", "glow", "amount"], "glow amount", 0, 1.5, 0.01),
      ],
    },
  ],
};
