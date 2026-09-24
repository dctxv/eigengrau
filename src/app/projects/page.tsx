import type { Metadata } from "next";
import Link from "next/link";
import { NAME, PROJECTS, PROJECTS_HEADING, ROLE, YEAR } from "@/content/site";

export const metadata: Metadata = { title: "Projects" };

/** Projects. The grid is drawn in WebGL; this is its accessible mirror. */
export default function ProjectsPage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <p>
        {PROJECTS_HEADING.lead} {PROJECTS_HEADING.tail}
      </p>
      <h2>Selected work</h2>
      <ul>
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <article>
              <h3>{p.title}</h3>
              <p>{p.categories.join(", ")}</p>
              {p.comingSoon ? <p>Coming soon</p> : <Link href={`/projects/${p.slug}`}>View case</Link>}
            </article>
          </li>
        ))}
      </ul>
      <p>
        {NAME} ©{YEAR} All Rights Reserved
      </p>
    </section>
  );
}
