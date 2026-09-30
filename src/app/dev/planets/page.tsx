import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/**
 * The sheet itself, only in development: a production build never follows the import (the branch
 * is dead there), so the sheet's code is not in the site's chunks at all.
 */
const PlanetSheet = process.env.NODE_ENV === "production" ? null : dynamic(() => import("./PlanetSheet").then((m) => m.PlanetSheet));

/**
 * Space's planets up close: development only (a production build answers this route with the 404).
 * Each kind as the sky's defaults draw it (sky/defaults.ts, PLANETS; tune them in Space's ?debug=1
 * panel): big, then as big as it is in the sky, smooth and pixelated at a few cells, turning. ?kind=
 * which planet (the first by default), ?seed= its seed, ?big= the close one's diameter (px), ?spin= a
 * fixed turn in degrees (it holds still), ?speed= how much faster than in the sky it turns, ?solo
 * the close one alone; and window.__spin (degrees) holds it at a turn for a script filming it.
 */
export default function PlanetsPreview() {
  if (!PlanetSheet) notFound();
  return <PlanetSheet />;
}
