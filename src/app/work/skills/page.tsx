import type { Metadata } from "next";
import Link from "next/link";
import { SKILLS, SKILLS_LINE } from "@/content/site";

export const metadata: Metadata = { title: "Skills", description: SKILLS_LINE };

/**
 * Skills, off Work: a plain DOM page in the case pages' language. The title
 * and its one line, then each area with its own line and what was done in it,
 * one quiet column. Back returns to the thread.
 */
export default function SkillsPage() {
  return (
    <main className="case skills">
      <div style={{ textAlign: "center" }}>
        <h1>Skills</h1>
        <p className="case-why">{SKILLS_LINE}</p>
      </div>
      {SKILLS.map((area, i) => (
        <section key={area.name} className="skills-area" aria-labelledby={`skills-${i}`}>
          <h2 id={`skills-${i}`}>{area.name}</h2>
          <p className="skills-why">{area.why}</p>
          <ul>
            {area.did.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <Link href="/work" className="case-back">
        Back
      </Link>
      {/* The page runs to a few screens under the tab bar, so it wears the rims Notes and Music do. */}
      <div className="case-rim case-rim-top" aria-hidden="true" />
      <div className="case-rim case-rim-bottom" aria-hidden="true" />
    </main>
  );
}
