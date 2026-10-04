import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/** Only in development: a production build never follows the import, so the sheet is not in the site's chunks. */
const BodySheet = process.env.NODE_ENV === "production" ? null : dynamic(() => import("./BodySheet").then((m) => m.BodySheet));

/**
 * Urchi's body without the spacesuit, for review while it is made: development only (a production
 * build answers this route with the 404). Its own plush body (engine/urchi/bare.ts: a round torso
 * under the chin, stubby legs, a ball of a hand each side), faceted and near-black as the head is,
 * the bare head on top, standing still on a white page as large as it fits; ?view=sides shows it
 * from all sides, every 45 degrees, at one scale. ?turn= turns the whole figure (degrees: 90 its left side, 180 its back); ?yaw=,
 * ?pitch=, ?roll= hold the head off straight ahead; ?pixel paints it in its hard pixels.
 */
export default function BodyPreview() {
  if (!BodySheet) notFound();
  return <BodySheet />;
}
