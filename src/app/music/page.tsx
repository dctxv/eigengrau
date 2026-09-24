import type { Metadata } from "next";

export const metadata: Metadata = { title: "Music" };

/** Music. The panel is plain DOM and is its own accessible page; the route only names it. */
export default function MusicPage() {
  return <h1 className="sr-only">Music</h1>;
}
