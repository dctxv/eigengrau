import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Music" };

export default function MusicPage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Now playing" tail="via last.fm" />
        </h1>
        <Caption className="mt-4">now playing / last.fm</Caption>
      </header>
      <p className="mt-16 max-w-prose font-serif text-[1.125rem] leading-relaxed text-text-2">
        Nothing playing yet. This page will read Last.fm: what&apos;s on now, and the week&apos;s
        top five.
      </p>
    </main>
  );
}
