import type { Metadata } from "next";
import Link from "next/link";
import { NAME, PROJECTS, projectsLine, ROLE, SPACE_ITEMS, statusWord } from "@/content/site";

export const metadata: Metadata = { title: "Projects" };

/**
 * Projects. The thread is drawn in WebGL; this is its accessible mirror, in
 * the thread's order of things: each project with its status, its line, its
 * pieces and its case, then the studies, the pieces that belong to none.
 * The thread runs by year, first to last, and a year's work in the order it
 * is listed (the sort is stable), so the mirror reads in the order the arrow
 * keys step through.
 */
export default function ProjectsPage() {
  const byYear = <T extends { year: number }>(list: readonly T[]) => [...list].sort((a, b) => a.year - b.year);
  const projects = byYear(PROJECTS);
  const studies = byYear(SPACE_ITEMS.filter((s) => !s.project || !PROJECTS.some((p) => p.slug === s.project)));
  return (
    <section className="sr-only">
      <h1>
        {NAME} - {ROLE}
      </h1>
      <h2>Projects</h2>
      <p>{projectsLine()}</p>
      <ul>
        {projects.map((p) => {
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
