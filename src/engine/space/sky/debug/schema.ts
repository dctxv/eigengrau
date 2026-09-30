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
