"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import { sfx } from "@/audio/sfx";
import { ELSEWHERE, STATEMENT, STATEMENT_MARK, STATUS } from "@/content/site";
import { AboutScene } from "@/engine/about/AboutScene";
import { setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";

const COPIED_MS = 1200;

/**
 * About (spec 10): the statement, the current line and the chrome object, all
 * in one canvas, with the Elsewhere row as real links beside it so it stays
 * reachable while the canvas is hidden from assistive tech.
 */
export function AboutPanel() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const scene = new AboutScene(canvas.current!, {
      statement: STATEMENT,
      mark: STATEMENT_MARK,
      current: STATUS,
      reducedMotion: prefersReducedMotion(),
    });
    scene.load().then(() => setFlag("pageReady", true));
    const onMove = (e: PointerEvent) => scene.pointer(e.clientX, e.clientY);
    const onResize = () => scene.resize();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      scene.dispose();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  // Email copies on pointerup (a user gesture); touch and missing clipboard fall through to mailto.
  const onCopy = (text: string) => (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === "touch" || !navigator.clipboard?.writeText) return;
    suppressClick.current = true;
    navigator.clipboard.writeText(text).then(() => {
      sfx.play("tab");
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
    }, () => undefined);
  };
  const onCopyClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
  };

  return (
    <div className="about-panel">
      <section className="stage stage-about" aria-hidden="true">
        <canvas ref={canvas} />
      </section>
      <nav className="elsewhere" aria-label="Elsewhere">
        {ELSEWHERE.map((l) =>
          "copy" in l ? (
            <a key={l.label} href={l.href} onPointerUp={onCopy(l.copy)} onClick={onCopyClick}>
              {copied ? "Copied" : l.label}
            </a>
          ) : (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ),
        )}
      </nav>
    </div>
  );
}
