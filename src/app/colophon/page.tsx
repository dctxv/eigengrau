import type { Metadata } from "next";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";
import { ShortcutToggle } from "@/components/nav/ShortcutToggle";

export const metadata: Metadata = { title: "Colophon" };

const NOTE = "max-w-[34ch] font-serif text-[1.125rem] leading-relaxed text-text-2";

export default function ColophonPage() {
  return (
    <main id="main" className="page">
      <header>
        <h1 className="text-[clamp(2.25rem,1.4rem+4vw,4rem)] font-medium leading-none tracking-[-0.02em]">
          <Pairing lead="Colophon" tail="how this is built" />
        </h1>
        <Caption className="mt-4">colophon / v1</Caption>
      </header>
      <ul className="mt-16 grid gap-10 sm:grid-cols-2">
        <li>
          <p className={NOTE}>
            Next.js, TypeScript, Tailwind, Motion. No CMS; everything lives in the repo.
          </p>
          <Caption className="mt-3">stack</Caption>
        </li>
        <li>
          <p className={NOTE}>
            Inter Tight for the interface. Newsreader for the asides, the dates, the numerals.
          </p>
          <Caption className="mt-3">type</Caption>
        </li>
        <li>
          <p className={NOTE}>
            Eigengrau, <span className="font-sans tabular text-text-1">#16161D</span>. The colour
            you see with your eyes closed in a dark room.
          </p>
          <Caption className="mt-3">background</Caption>
        </li>
        <li>
          <p className={NOTE}>
            The page moves smoothly. The character will move at twelve frames a second, whole
            pixels only.
          </p>
          <Caption className="mt-3">two frame rates</Caption>
        </li>
        <li>
          <p className={NOTE}>
            The keys 1 to 6 jump between pages from anywhere on the site. If a stray keypress
            keeps moving you, switch them off; this browser remembers.
          </p>
          <ShortcutToggle className="mt-3" />
          <Caption className="mt-3">keyboard</Caption>
        </li>
      </ul>
    </main>
  );
}
