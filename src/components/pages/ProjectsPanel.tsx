"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAME, PROJECTS, PROJECTS_HEADING, YEAR, type Project } from "@/content/site";
import { ProjectsScene } from "@/engine/projects/ProjectsScene";
import { CursorLabel } from "@/components/CursorLabel";
import { setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";

/** Projects (spec 7): the whole page is one canvas; only the "View" label is DOM. */
export function ProjectsPanel() {
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stageEl = stage.current!;
    const cursor = new CursorLabel(label.current!, stageEl);
    const scene = new ProjectsScene(canvas.current!, PROJECTS, {
      heading: PROJECTS_HEADING,
      footer: `${NAME} ©${YEAR} All Rights Reserved`,
      reducedMotion: prefersReducedMotion(),
      onHover: (p: Project | null) => cursor.set(p && !p.comingSoon ? "View" : null),
    });
    Object.assign(stageEl, { __scene: scene }); // handy for debugging and headless QA
    scene.load().then(() => setFlag("pageReady", true));

    let down = { x: 0, y: 0 };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scene.wheel(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    };
    const onMove = (e: PointerEvent) => scene.pointer(e.clientX, e.clientY);
    const onLeave = () => scene.leave();
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      if (e.pointerType === "touch") scene.touchStart(e.clientY);
    };
    const onDrag = (e: PointerEvent) => {
      if (e.pointerType === "touch" && e.buttons & 1) scene.touchMove(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") scene.touchEnd();
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const p = scene.projectAt(e.clientX, e.clientY);
      if (p && !p.comingSoon) router.push(`/projects/${p.slug}`);
    };
    const onResize = () => scene.resize();
    const onVis = () => scene.setVisible(document.visibilityState === "visible");

    stageEl.addEventListener("wheel", onWheel, { passive: false });
    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerleave", onLeave);
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointermove", onDrag);
    stageEl.addEventListener("pointerup", onUp);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stageEl.removeEventListener("wheel", onWheel);
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointermove", onDrag);
      stageEl.removeEventListener("pointerup", onUp);
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
