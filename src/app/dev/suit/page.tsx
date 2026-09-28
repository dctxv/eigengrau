import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/**
 * The sheet itself, only in development: a production build never follows the import (the branch
 * is dead there), so the sheet's code is not in the site's chunks at all.
 */
const SuitSheet = process.env.NODE_ENV === "production" ? null : dynamic(() => import("./SuitSheet").then((m) => m.SuitSheet));

/**
 * The spacesuit's preview sheet, for review while it is being made: development only (a
 * production build answers this route with the 404). ?view= sheet (the default: front, 3/4,
 * side and back, and the helmet with four looks, as the reference lays them out), small (as small
 * as it will be on other tabs), space (as big as the head on Space), turn (all the way round),
 * follow (the body following the head), reveal (setSuit between nothing and all of it), one (one
 * pose: ?turn=, ?hy=, ?hp=, ?hr=, ?part=helmet, ?pixel), poses (the helmet at the far corners of
 * what the head can do), leak (the head never shows outside the helmet, over 236 poses), perf
 * (what a suited frame costs to paint), host (the three.js host with the suit on), and the limbs:
 * limbs (their poses: at rest, afloat and each quirk at its height; ?turn=, ?pose=), quirks (each
 * quirk over its time, a row each; ?only=wave,tap, ?cols=, ?turn=), strip (one quirk as a film
 * strip: ?quirk=, ?side=, ?every=, ?n=) and film (it afloat, left alone, a frame at a time for a
 * script to make a clip of: ?seed=, ?fps=, ?turn=).
 */
export default function SuitPreview() {
  if (!SuitSheet) notFound();
  return <SuitSheet />;
}
