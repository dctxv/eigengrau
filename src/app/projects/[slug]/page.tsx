import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { numberWord, PROJECTS, SPACE_ITEMS, statusWord } from "@/content/site";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  return { title: project?.title ?? "Project" };
}

/**
 * Case study. Out of the reference's scope, so it is a plain DOM page in the
 * same language: one cover, one title, the status word, the one line, one
 * paragraph, then the pieces that hang off its mark on the thread, each with
 * its title and its three lines. A dead project keeps its cover here as the
 * record. Back returns to the project unspooled on the thread.
 */
export default async function CasePage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  const pieces = SPACE_ITEMS.filter((s) => s.project === project.slug);
  return (
    <main className="case">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={project.cover} alt="" />
      <div style={{ textAlign: "center" }}>
        <h1>{project.title}</h1>
        <p className="case-status">{statusWord(project)}</p>
        <p className="case-why">{project.why}</p>
      </div>
      <p className="case-text">{project.summary}</p>
      {pieces.length > 0 && (
        <section className="case-pieces" aria-labelledby="case-pieces">
          <h2 id="case-pieces">{pieces.length === 1 ? "One piece" : `${numberWord(pieces.length)} pieces`}</h2>
          {pieces.map((s) => (
            <figure key={s.id} className="case-piece">
              {/* A video piece shows its poster: this page is the record, not the reel. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.media.kind === "video" ? s.media.poster : s.media.src} alt="" style={{ aspectRatio: String(s.aspect) }} loading="lazy" />
              <figcaption>
                <h3>{s.title}</h3>
                <p>
                  {s.description.map((line, k) => (
                    <span key={k}>
                      {line}
                      {k < s.description.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </figcaption>
            </figure>
          ))}
        </section>
      )}
      <Link href={`/projects#${project.slug}`} className="case-back">
        Back
      </Link>
    </main>
  );
}
