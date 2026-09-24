import type { Metadata } from "next";
import { NAME, ROLE, STATEMENT, STATUS } from "@/content/site";

export const metadata: Metadata = { title: "About" };

/**
 * About. The statement and the object are drawn in WebGL; this is their
 * accessible mirror. Elsewhere is real DOM in the panel, so it is not repeated.
 */
export default function AboutPage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <p>{STATEMENT.join(" ")}</p>
      <p>{STATUS}</p>
    </section>
  );
}
