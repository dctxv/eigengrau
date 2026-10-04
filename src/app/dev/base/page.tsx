import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/** Only in development: a production build never follows the import, so the sheet is not in the site's chunks. */
const BaseSheet = process.env.NODE_ENV === "production" ? null : dynamic(() => import("./BaseSheet").then((m) => m.BaseSheet));

/**
 * Urchi as a game's base body (engine/urchi/base.ts), tuned live: development only (a production
 * build answers this route with the 404). The turnaround (every 45 degrees), sliders for every
 * part, the original beside it (Compare), the figure 64px tall on a warm ground as a game strip
 * would show it, presets as JSON (Copy JSON, and pasted back), and Export GLB: the parts as
 * separate named meshes at their pivots, for Godot. ?p= a preset's JSON starts from it.
 */
export default function BasePreview() {
  if (!BaseSheet) notFound();
  return <BaseSheet />;
}
