import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/** Only in development: a production build never follows the import, so the sheet is not in the site's chunks. */
const ItemSheet = process.env.NODE_ENV === "production" ? null : dynamic(() => import("./ItemSheet").then((m) => m.ItemSheet));

/**
 * Space's items up close, for review while they are made: development only (a production build
 * answers this route with the 404). ?item= its id (site.ts ITEMS; the first made by default), shown
 * big (?big= px) and at 96px, the size it must read at, with its name and caption, turning; ?t=
 * holds its clock at that many seconds (for stills), ?still stops it.
 */
export default function ItemsPreview() {
  if (!ItemSheet) notFound();
  return <ItemSheet />;
}
