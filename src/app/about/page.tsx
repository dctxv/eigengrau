import type { Metadata } from "next";
import { ELSEWHERE, NAME, ROLE, STATEMENT, STATUS } from "@/content/site";

export const metadata: Metadata = { title: "About" };

/** About. The statement and the object are drawn in WebGL; this is the accessible mirror. */
export default function AboutPage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <p>{STATEMENT.join(" ")}</p>
      <p>{STATUS}</p>
      <h2>Elsewhere</h2>
      <ul>
        {ELSEWHERE.map((l) => (
          <li key={l.label}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
