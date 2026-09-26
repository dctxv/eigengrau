import { notFound } from "next/navigation";
import { SuitSheet } from "./SuitSheet";

/**
 * The spacesuit's preview sheet, for review while it is being made: development only (a
 * production build answers this route with the 404). ?view= sheet (the default: front, 3/4,
 * side and back, and the helmet with four looks, as the reference lays them out), small (as small
 * as it will be on other tabs), space (as big as the head on Space), turn (all the way round),
 * follow (the body following the head), reveal (setSuit between nothing and all of it), one (one
 * pose: ?turn=, ?hy=, ?hp=, ?hr=, ?part=helmet, ?pixel), poses (the helmet at the far corners of
 * what the head can do), leak (the head never shows outside the helmet, over 236 poses), perf
 * (what a suited frame costs to paint) and host (the three.js host with the suit on).
 */
export default function SuitPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SuitSheet />;
}
