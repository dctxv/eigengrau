"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { NOTES, type Note } from "@/content/site";
import { setFlag } from "@/lib/flags";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";

const ENTER_COUNT = 8;
const ENTER_STAGGER = 0.08;
const FIRST_Y = 206;

/** Newest first; entries on the same day keep their order in NOTES. */
const ENTRIES: Note[] = [...NOTES].sort((a, b) => b.date.localeCompare(a.date));

/** The hash anchor is the date; a second entry on the same day falls back to its id. */
const ANCHORS = new Map<string, string>();
const seen = new Set<string>();
ENTRIES.forEach((n) => {
  ANCHORS.set(n.id, seen.has(n.date) ? n.id : n.date);
  seen.add(n.date);
});

const dot = (date: string) => date.replaceAll("-", ".");

/**
 * Notes: plain DOM inside the sliding panel, not a canvas, so the text can be
 * selected, searched and linked. One centred column in a scroll container;
 * two glass rims at the top and bottom dissolve text as it leaves.
 */
export function NotesPanel() {
  const scroll = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scrollEl = scroll.current!;
    const columnEl = column.current!;
    setFlag("pageReady", true);

    // A hash link lands with its entry on the first-entry line.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? columnEl.querySelector<HTMLElement>(`[id="${CSS.escape(hash)}"]`) : null;
    if (target) scrollEl.scrollTop = Math.max(0, target.offsetTop - FIRST_Y);

    if (prefersReducedMotion()) return;
    const entries = gsap.utils.toArray<HTMLElement>(".note", columnEl).slice(0, ENTER_COUNT);
    const tweens = entries.map((entry, i) =>
      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>(".mask > span", entry),
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: DUR.reveal, ease: EASE.reveal, delay: 0.15 + i * ENTER_STAGGER, stagger: 0.04 },
      ),
    );
    return () => tweens.forEach((t) => t.kill());
  }, []);

  return (
    <section className="stage stage-notes">
      <div ref={scroll} className="notes-scroll">
        <div ref={column} className="notes-column">
          {ENTRIES.map((n) => (
            <article key={n.id} id={ANCHORS.get(n.id)} className={n.kind === "log" ? "note note-log" : "note"}>
              {n.kind === "log" ? (
                <p className="mask">
                  <span>
                    <time dateTime={n.date}>{dot(n.date)}</time>
                    {"  "}
                    {n.tags.join("  ")}
                    {"  "}
                    {n.body}
                  </span>
                </p>
              ) : (
                <>
                  <div className="mask">
                    <span className="note-meta">
                      <time dateTime={n.date} className="note-date">
                        {dot(n.date)}
                      </time>
                      <span className="note-tags">{n.tags.join("  ")}</span>
                    </span>
                  </div>
                  <p className="mask note-body">
                    <span>{n.body}</span>
                  </p>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
      <div className="notes-rim notes-rim-top" aria-hidden="true" />
      <div className="notes-rim notes-rim-bottom" aria-hidden="true" />
    </section>
  );
}
