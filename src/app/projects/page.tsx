import type { Metadata } from "next";
import Link from "next/link";
import { NAME, PROJECTS, projectsLine, ROLE, statusWord } from "@/content/site";

export const metadata: Metadata = { title: "Projects" };

/** Projects. The horizon is drawn in WebGL; this is its accessible mirror. */
export default function ProjectsPage() {
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <h2>Projects</h2>
      <ul>
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <article>
              <h3>{p.title}</h3>
              <p>{statusWord(p)}</p>
              <p>{p.why}</p>
              <Link href={`/projects/${p.slug}`}>View case</Link>
            </article>
          </li>
        ))}
      </ul>
      <p>{projectsLine()}</p>
    </section>
  );
}
