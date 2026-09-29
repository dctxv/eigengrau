import type { SkyConfig, SkyLayers } from "../Sky";

/** The defaults file's head, as defaults.ts has it. */
const HEAD = `// The sky's defaults: Space's float background as it is drawn. Tune it in the ?debug=1 panel (in
// development), then paste its "Copy config" over this whole file. What each value means is told
// on the types (Sky.ts, layer.ts, Stars.ts); any number or colour may be a { range: [a, b] } the
// visit's seed picks within, with a \`lock\` to hold it (tune.ts).
import type { SkyConfig } from "./Sky";
import type { StarsConfig } from "./Stars";
`;

/** A line no longer than this is kept on one line. */
const WIDTH = 110;

const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
/** A number as short as it can be without losing what was tuned (four places). */
const number = (v: number) => String(Number(v.toFixed(4)));

/** A value as a TypeScript literal, `indent` its line's indent and `at` the column it starts at. */
function literal(v: unknown, indent: string, at: number): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return number(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return String(v);
  const inner = indent + "  ";
  if (Array.isArray(v)) {
    const flat = `[${v.map((x) => literal(x, inner, 0)).join(", ")}]`;
    if (!flat.includes("\n") && at + flat.length + 1 <= WIDTH) return flat;
    return `[\n${v.map((x) => `${inner}${literal(x, inner, inner.length)},`).join("\n")}\n${indent}]`;
  }
  const entries = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
  if (!entries.length) return "{}";
  const flat = `{ ${entries.map(([k, x]) => `${key(k)}: ${literal(x, inner, 0)}`).join(", ")} }`;
  if (!flat.includes("\n") && at + flat.length + 1 <= WIDTH) return flat;
  return `{\n${entries.map(([k, x]) => `${inner}${key(k)}: ${literal(x, inner, inner.length + key(k).length + 2)},`).join("\n")}\n${indent}}`;
}

/** The whole defaults file for a sky's config and its layers': ranges, locks, variants and their weights, as tuned. */
export function configFile(sky: SkyConfig, layers: SkyLayers): string {
  return `${HEAD}
export const SKY: SkyConfig = ${literal(sky, "", 30)};

export const STARS: StarsConfig = ${literal(layers.stars, "", 34)};
`;
}
