import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Log" };

export default function LogPage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Build log" tail="only what shipped" />
        </h1>
        <Caption className="mt-4">build log / newest first</Caption>
      </header>
      <p className="mt-16 max-w-prose font-serif text-[1.125rem] leading-relaxed text-text-2">
        Only things that shipped. Nothing has, yet.
      </p>
    </main>
  );
}
