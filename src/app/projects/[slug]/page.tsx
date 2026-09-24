import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/content/site";

export function generateStaticParams() {
  return PROJECTS.filter((p) => !p.comingSoon).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  return { title: project?.title ?? "Project" };
}

/**
 * Case study. Out of the reference's scope, so it is a plain DOM page in the
 * same language: one cover, one title, one category line, one paragraph.
 */
export default async function CasePage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug && !p.comingSoon);
  if (!project) notFound();
  return (
    <main className="case">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={project.cover} alt="" />
      <div style={{ textAlign: "center" }}>
        <h1>{project.title}</h1>
        <p className="case-cat">{project.categories.join(", ")}</p>
      </div>
      <p className="case-text">{project.summary}</p>
      <Link href="/projects" className="case-back">
        Back
      </Link>
    </main>
  );
}
