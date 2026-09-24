import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Projects" tail="and why they exist" />
        </h1>
        <Caption className="mt-4">index / by status</Caption>
      </header>
      <p className="mt-16 max-w-prose font-serif text-[1.125rem] leading-relaxed text-text-2">
        A list, not a grid. What&apos;s active, what&apos;s paused, what died and why.
      </p>
    </main>
  );
}
