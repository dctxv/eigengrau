import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Game" };

export default function GamePage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Low-poly guess" tail="one a day" />
        </h1>
        <Caption className="mt-4">low-poly guess / daily</Caption>
      </header>
      <p className="mt-16 max-w-prose font-serif text-[1.125rem] leading-relaxed text-text-2">
        One object a day, drawn in twelve polygons. Guess it before it sharpens. Not open yet.
      </p>
    </main>
  );
}
