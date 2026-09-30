"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { CATCH_LINES, ITEMS, countWord, fillLine, type ItemText, type ItemTier } from "@/content/site";
import { CaseScene } from "@/engine/space/CaseScene";
import { found, onFound, type Found } from "@/lib/found";
import { prefersReducedMotion } from "@/lib/motion";
import { onShown } from "@/lib/where";

/** Every item in the case's order: by tier, commonest first, as site.ts lists them. */
const ORDER: (ItemText & { tier: ItemTier })[] = (Object.entries(ITEMS) as [ItemTier, ItemText[]][]).flatMap(([tier, list]) => list.map((i) => ({ ...i, tier })));
/** The window event the case says it is open or shut on (`detail.open`): Space holds its room still behind it. */
export const CASE_EVENT = "eigengrau:case";
/** The window event the case asks Space to give Urchi a thing on (`detail.id`), the keyboard's way to hand it over. */
export const GIVE_EVENT = "eigengrau:give";
/** The case comes and goes over this long (s). */
const FADE = 0.35;

/** "30 September", with the year when it is not this one. */
function dayText(ms: number) {
  const d = new Date(ms), opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-GB", opts);
}

const none: Found = { items: new Map(), forged: new Set(), tampered: false };

/**
 * The case (Space, tab 1): what Urchi has caught, to come back to. Once it has caught anything, a
 * word in the corner of Space says how much of all there is ("Three of eleven found"); pressed, the
 * case opens over the room (which holds still behind it): every item there is has its place, by
 * tier, commonest first. What it has caught is there in its place, turning, with its name; what it
 * has not is an empty place with only its tier under it, so nothing is given away. One chosen (the
 * last caught, at first) is shown large, with its name, its line and the day it was caught. A
 * forgery is there as a forgery. Esc, Close or a press on the case's empty ground shuts it.
 */
export function FoundCase() {
  // (what it has, from this browser's storage: nothing on the server)
  const have = useSyncExternalStore(onFound, found, () => none);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const big = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const slots = useRef(new Map<string, HTMLElement>());
  /** The open case's scene, told what goes where (see the effect below). */
  const showRef = useRef<((list: { key: string; id: string; forged: boolean; el: HTMLElement }[]) => void) | null>(null);

  const shown = have.tampered ? [] : ORDER.filter((i) => have.items.has(i.id));
  const real = shown.filter((i) => !have.forged.has(i.id)).length;
  const latest = shown.reduce<string | null>((b, i) => (!b || (have.items.get(i.id) ?? 0) > (have.items.get(b) ?? 0) ? i.id : b), null);
  const chosen = pick && have.items.has(pick) ? pick : latest;
  const first = shown.length ? Math.min(...shown.map((i) => have.items.get(i.id) ?? Infinity)) : 0;

  // open: the room holds still, it fades in, and the keyboard is in it; shut, back to the word
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    window.dispatchEvent(new CustomEvent(CASE_EVENT, { detail: { open } }));
    const reduced = prefersReducedMotion();
    gsap.to(el, { autoAlpha: open ? 1 : 0, duration: reduced ? 0 : FADE, ease: "power2.out", overwrite: true });
    if (!open) return;
    close.current?.focus();
    const back = trigger.current;
    const scene = new CaseScene(canvas.current!, { reducedMotion: reduced });
    (el as unknown as { __case: CaseScene }).__case = scene; // handy for headless QA
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onMove = (e: PointerEvent) => scene.point(e.clientX, e.clientY);
    // another tab slid in: the case shuts behind it
    const offShown = onShown((s) => {
      if (!s.has("/")) setOpen(false);
    });
    window.addEventListener("keydown", onKey);
    el.addEventListener("pointermove", onMove);
    showRef.current = (list) => scene.show(list);
    return () => {
      offShown();
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("pointermove", onMove);
      showRef.current = null;
      scene.dispose();
      back?.focus();
    };
  }, [open]);

  // what is drawn where: each caught thing in its place, and the chosen one large
  useEffect(() => {
    if (!open || !showRef.current) return;
    const list: { key: string; id: string; forged: boolean; el: HTMLElement }[] = [];
    for (const i of shown) {
      const el = slots.current.get(i.id);
      if (el) list.push({ key: i.id, id: i.id, forged: have.forged.has(i.id), el });
    }
    if (chosen && big.current) list.push({ key: "big", id: chosen, forged: have.forged.has(chosen), el: big.current });
    showRef.current(list);
  });

  const text = chosen ? ORDER.find((i) => i.id === chosen) : null;
  const forged = !!chosen && have.forged.has(chosen);
  const total = ORDER.length;

  return (
    <>
      {shown.length > 0 && (
        <button ref={trigger} type="button" className="found-word" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          {countWord(real)} of {countWord(total).toLowerCase()} found
        </button>
      )}
      <div
        ref={root}
        className="found-case"
        role="dialog"
        aria-modal="true"
        aria-label="What Urchi has found"
        aria-hidden={!open}
        style={{ visibility: "hidden", opacity: 0 }}
      >
        <canvas ref={canvas} className="found-canvas" aria-hidden="true" />
        {/* (it scrolls under the canvas, which stays put and draws each thing where its place is now) */}
        <div
          className="found-inner"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <header className="found-head">
            <h2>Found</h2>
            <p>
              {countWord(real)} of {countWord(total).toLowerCase()}
              {first ? `, the first on ${dayText(first)}.` : "."}
            </p>
            <button ref={close} type="button" className="found-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          {text && (
            <section className="found-chosen" aria-live="polite">
              <div ref={big} className="found-big" aria-hidden="true" />
              <div className="found-words">
                <span className="found-tier">{text.tier}</span>
                <h3>{forged ? fillLine(CATCH_LINES.forgedTitle, { name: text.name.toLowerCase() }) : text.name}</h3>
                <p>{forged ? CATCH_LINES.forged : text.caption}</p>
                <span className="found-when">Caught {dayText(have.items.get(text.id) ?? 0)}</span>
              {/* the keyboard's way to do what dragging it onto Urchi does */}
              <button
                type="button"
                className="found-give"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent(GIVE_EVENT, { detail: { id: text.id } }));
                }}
              >
                Hand it to Urchi
              </button>
              </div>
            </section>
          )}
          <ul className="found-grid">
            {ORDER.map((i) => {
              const has = shown.some((s) => s.id === i.id);
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    className="found-slot"
                    data-has={has || undefined}
                    data-chosen={i.id === chosen || undefined}
                    disabled={!has}
                    aria-label={has ? i.name : `Not found yet (${i.tier})`}
                    onClick={() => setPick(i.id)}
                  >
                    <span
                      className="found-place"
                      ref={(el) => {
                        if (el) slots.current.set(i.id, el);
                        else slots.current.delete(i.id);
                      }}
                    />
                    <span className="found-name">{has ? i.name : i.tier}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
