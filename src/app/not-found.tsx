import type { Metadata } from "next";
import Link from "next/link";
import { Caption } from "@/components/Caption";
import { Pairing } from "@/components/Pairing";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main id="main" className="page">
      <header>
        <p className="font-serif tabular text-[clamp(4rem,2rem+10vw,8rem)] leading-none text-text-1">
          404
        </p>
        <h1 className="mt-6 text-2xl font-medium tracking-[-0.02em]">
          <Pairing lead="Nothing here" tail="yet." />
        </h1>
        <Caption className="mt-4">not found / 404</Caption>
      </header>
      <Link
        href="/"
        className="mt-16 inline-block text-[15px] text-text-2 underline decoration-line underline-offset-4 hover:text-text-1"
      >
        Back to the space
      </Link>
    </main>
  );
}
