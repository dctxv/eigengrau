import Link from "next/link";
import { Caption } from "@/components/Caption";
import { Frame } from "@/components/Frame";
import { SITE_LINE, SITE_NAME } from "@/lib/routes";

export default function Home() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-5 sm:px-8">
      <div className="flex flex-1 items-center justify-center pt-20 pb-10">
        <figure className="flex flex-col items-center">
          <Frame className="size-40 sm:size-52" innerClassName="bg-surface-1" />
          <Caption as="figcaption" className="mt-4">
            front view / placeholder
          </Caption>
        </figure>
      </div>

      <header className="grid gap-6 pb-6 text-[14px] leading-snug sm:grid-cols-2 sm:pb-8 sm:text-[15px]">
        <div>
          <h1 className="font-medium text-text-1">{SITE_NAME}</h1>
          <p className="font-serif italic text-text-2">{SITE_LINE}.</p>
        </div>
        <div className="sm:text-right">
          <p className="font-serif text-text-2">
            Dark room, one lit subject.
            <br />
            Smooth page, choppy character.
          </p>
          <Link
            href="/colophon"
            className="mt-2 inline-block text-text-2 underline decoration-line underline-offset-4 hover:text-text-1"
          >
            Colophon
          </Link>
        </div>
      </header>
    </main>
  );
}
