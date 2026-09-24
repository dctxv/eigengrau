"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { sfx } from "@/audio/sfx";
import { PROJECTS, projectsLine, type Project } from "@/content/site";
import { HorizonScene } from "@/engine/projects/HorizonScene";
import { CursorLabel } from "@/components/CursorLabel";
import { getFlags, setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";

/** Projects: the horizon (horizon.md). The whole page is one canvas; only the "View" label is DOM. */
export function ProjectsPanel() {
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stageEl = stage.current!;
    const cursor = new CursorLabel(label.current!, stageEl);
    const scene = new HorizonScene(canvas.current!, PROJECTS, {
      heading: { lead: "Work", tail: projectsLine() },
      reducedMotion: prefersReducedMotion(),
      onHover: (p: Project | null) => cursor.set(p ? "View" : null),
    });
    Object.assign(stageEl, { __scene: scene }); // handy for debugging and headless QA
    scene.load().then(() => setFlag("pageReady", true));

    // The sampled click is reserved for this.
    const open = (p: Project) => {
      sfx.play("click");
      router.push(`/projects/${p.slug}`);
    };
    // Window keys reach every mounted panel; only the current one, at rest, may answer.
    const isCurrent = () => window.location.pathname === "/projects" && !getFlags().transitioning;

    let down = { x: 0, y: 0 };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = e.deltaMode === 1 ? 16 : 1;
      scene.wheel(e.deltaX * k, e.deltaY * k);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        if (e.buttons & 1) scene.touchMove(e.clientX, e.clientY);
        return;
      }
      scene.pointer(e.clientX, e.clientY);
    };
    const onLeave = () => scene.leave();
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      if (e.pointerType === "touch") scene.touchStart(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") scene.touchEnd();
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const p = scene.projectAt(e.clientX, e.clientY);
      if (!p) {
        if (e.pointerType === "touch") scene.leave();
        return;
      }
      // Touch has no hover: the first tap raises the preview, the second opens.
      if (e.pointerType === "touch" && scene.focused !== p) {
        scene.focus(p);
        return;
      }
      open(p);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isCurrent()) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") scene.step(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") scene.step(-1);
      else if (e.key === "Enter" && scene.focused) open(scene.focused);
      else if (e.key === "Escape") scene.leave();
    };
    const onResize = () => scene.resize();
    const onVis = () => scene.setVisible(document.visibilityState === "visible");

    stageEl.addEventListener("wheel", onWheel, { passive: false });
    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerleave", onLeave);
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stageEl.removeEventListener("wheel", onWheel);
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      cursor.destroy();
      scene.dispose();
    };
  }, [router]);

  return (
    <section ref={stage} className="stage stage-projects" aria-hidden="true">
      <canvas ref={canvas} />
      <div ref={label} className="cursor-label" />
    </section>
  );
}
