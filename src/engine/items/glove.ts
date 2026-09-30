import * as THREE from "three";
import SUIT from "@/engine/urchi/suit.json";
import { facets, fit, haze, part, release, type Item } from "./look";

/** What of the suit's model the glove is made from (see urchi/tools/build-suit.mjs). */
type SuitModel = { v: number[]; f: number[]; vp: number[]; hidden: number[]; parts: { name: string; material: number }[]; materials: string[] };

/** Urchi's right glove as its suit has it: the glove, its thumb, its dark palm and the grey cuff at its wrist. */
const PARTS = ["glove.R", "thumb.R", "palm.R", "cuff.R"];
/** The suit's own colours for them (character.ts SUIT_COLOUR), lit to shade. */
const COLOURS: Record<string, [string, string]> = { grey: ["#acaba6", "#5c5c5a"], dark: ["#58585c", "#222225"] };

/**
 * The glove's triangles by material, out of the suit's model: every face of its parts that is ever
 * seen, in three.js's frame (the model's y runs down, so it is turned up, and each face's winding
 * turned with it so it still faces out).
 */
function gloveGeometry(): Map<string, THREE.BufferGeometry> {
  const S = SUIT as unknown as SuitModel;
  const wanted = new Set(PARTS.map((n) => S.parts.findIndex((p) => p.name === n)).filter((i) => i >= 0));
  const hidden = new Set(S.hidden);
  const byMaterial = new Map<string, number[]>();
  for (let face = 0; face < S.f.length / 3; face++) {
    const [a, b, c] = [S.f[face * 3], S.f[face * 3 + 1], S.f[face * 3 + 2]];
    const p = S.vp[a];
    if (!wanted.has(p) || hidden.has(face)) continue;
    const name = S.materials[S.parts[p].material];
    const out = byMaterial.get(name) ?? byMaterial.set(name, []).get(name)!;
    for (const i of [a, c, b]) out.push(S.v[i * 3], -S.v[i * 3 + 1], S.v[i * 3 + 2]);
  }
  const geos = new Map<string, THREE.BufferGeometry>();
  for (const [name, xyz] of byMaterial) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(xyz, 3));
    geos.set(name, g);
  }
  return geos;
}

/**
 * Lost glove (common): one of Urchi's own gloves, the very model its suit wears (grey, a dark
 * palm, a grey cuff at the wrist), tumbling slowly on its own.
 */
export function makeGlove(): Item {
  const hand = new THREE.Group();
  for (const [name, g] of gloveGeometry()) {
    const [lit, shade] = COLOURS[name] ?? COLOURS.grey, material = facets(lit, shade);
    // the palm lies on the glove's own surface, as a decal does: drawn a hair nearer, so it is never lost in it
    if (name === "dark") Object.assign(material, { polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    hand.add(part(g, material, 26, name === "dark" ? 0.25 : 0.4));
  }
  const body = new THREE.Group();
  body.add(hand);
  fit(hand, 0.95);
  const root = new THREE.Group();
  const under = haze("#d6dae6", 1.8, 0.06);
  under.position.set(0, -1.05, -0.5);
  root.add(under, body);
  // a slow tumble, the pose a function of its clock (so a held clock holds it, and any moment can be shown)
  const pose = (t: number) => body.rotation.set(0.4 + 0.21 * t, -0.5 + 0.33 * t, 0.25 + 0.09 * Math.sin(0.4 * t));
  pose(0);

  return {
    object: root,
    update(_dt, t) {
      pose(t);
    },
    dispose() {
      release(root);
    },
  };
}
