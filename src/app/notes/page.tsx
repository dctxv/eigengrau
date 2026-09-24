import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notes" };

/** Notes. The panel is plain DOM and is its own accessible page; the route only names it. */
export default function NotesPage() {
  return <h1 className="sr-only">Notes</h1>;
}
