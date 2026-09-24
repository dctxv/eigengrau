"use client";

import { useEffect, useRef } from "react";
import { CURRENT, STATEMENT, STATEMENT_MARK } from "@/content/site";
import { AboutScene } from "@/engine/about/AboutScene";
import { setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";

/** About (spec 10): the statement, the current line and the chrome object, all in one canvas. */
export function AboutPanel() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = new AboutScene(canvas.current!, {
      statement: STATEMENT,
      mark: STATEMENT_MARK,
      current: CURRENT,
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
    };
  }, []);

  return (
    <section className="stage stage-about" aria-hidden="true">
      <canvas ref={canvas} />
    </section>
  );
}
