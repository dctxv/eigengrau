import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Strategy" };

export default function StrategyPage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Strategy" tail="vs the S&P 500" />
        </h1>
        <Caption className="mt-4">placeholder data / real feed in v2</Caption>
      </header>
      <p className="mt-16 max-w-prose font-serif text-[1.125rem] leading-relaxed text-text-2">
        A strategy against the index. Placeholder numbers until the real feed lands.
      </p>
    </main>
  );
}
