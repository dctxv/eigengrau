import type { Metadata } from "next";
import Link from "next/link";
import { NAME, PROJECTS, projectsLine, ROLE, SPACE_ITEMS, statusWord } from "@/content/site";

export const metadata: Metadata = { title: "Projects" };

/**
 * Projects. The thread is drawn in WebGL; this is its accessible mirror, in
 * the thread's order of things: each project with its status, its line, its
 * pieces and its case, then the studies, the pieces that belong to none.
 */
export default function ProjectsPage() {
  const studies = SPACE_ITEMS.filter((s) => !s.project || !PROJECTS.some((p) => p.slug === s.project));
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <h2>Projects</h2>
      <p>{projectsLine()}</p>
      <ul>
        {PROJECTS.map((p) => {
          const pieces = SPACE_ITEMS.filter((s) => s.project === p.slug);
          return (
            <li key={p.slug}>
              <article>
                <h3>{p.title}</h3>
                <p>{statusWord(p)}</p>
                <p>{p.why}</p>
                {pieces.length > 0 && (
                  <ul aria-label={`Pieces from ${p.title}`}>
                    {pieces.map((s) => (
                      <li key={s.id}>{s.title}</li>
                    ))}
                  </ul>
                )}
                <Link href={`/projects/${p.slug}`}>Case: {p.title}</Link>
              </article>
            </li>
          );
        })}
      </ul>
      {studies.length > 0 && (
        <>
          <h2>Studies</h2>
          <ul>
            {studies.map((s) => (
              <li key={s.id}>
                {s.title}, {s.year}. {s.description.join(" ")}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
