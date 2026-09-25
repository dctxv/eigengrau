"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { sfx } from "@/audio/sfx";
import { PROJECTS, projectsLine, SPACE_ITEMS, type Project } from "@/content/site";
import { ThreadScene } from "@/engine/projects/ThreadScene";
import { CursorLabel } from "@/components/CursorLabel";
import { getFlags, setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";

const ROUTE = "/projects";

/** The slug in the URL's hash, if it names a project. */
function hashSlug(): string | null {
  let slug = window.location.hash.slice(1);
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // A malformed hash names nothing.
  }
  return PROJECTS.some((p) => p.slug === slug) ? slug : null;
}

/**
 * Projects: the wound horizon. The whole page is one canvas; only the cursor
 * label is DOM. An opened project puts its slug in the URL's hash (replaced,
 * never a route change), so /projects#nocturne opens straight into it.
 */
export function ProjectsPanel() {
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stageEl = stage.current!;
    const cursor = new CursorLabel(label.current!, stageEl);
    // Window keys reach every mounted panel; only the current one, at rest, may answer.
    const isCurrent = () => window.location.pathname === ROUTE && !getFlags().transitioning;
    const setHash = (p: Project | null) => {
      if (window.location.pathname !== ROUTE) return;
      const url = p ? `${ROUTE}#${p.slug}` : ROUTE;
      if (window.location.pathname + window.location.hash === url) return;
      window.history.replaceState(window.history.state, "", url);
    };
    // The label names what a click would do, so it shows only for what the pointer itself is on.
    let inside = false;
    const scene = new ThreadScene(canvas.current!, PROJECTS, SPACE_ITEMS, {
      heading: { lead: "Work", tail: projectsLine() },
      reducedMotion: prefersReducedMotion(),
      onHover: (t, byPointer) => cursor.set(inside && byPointer && t?.kind === "project" ? "Open" : null),
      onOpen: setHash,
    });
    Object.assign(stageEl, { __scene: scene }); // handy for debugging and headless QA
    const first = hashSlug();
    if (first) scene.openSlug(first);
    scene.load().then(() => {
      setFlag("pageReady", true);
      // A client navigation can write the hash after this panel mounted.
      const late = hashSlug();
      if (late && !scene.isOpen && isCurrent()) scene.openSlug(late);
    });

    // The sampled click is reserved for this.
    const goCase = (p: Project) => {
      sfx.play("click");
      router.push(`/projects/${p.slug}`);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = e.deltaMode === 1 ? 16 : 1;
      scene.wheel(e.deltaX * k, e.deltaY * k);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      scene.press(e.clientX, e.clientY);
      stageEl.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") inside = true;
      const dragging = scene.move(e.clientX, e.clientY);
      if (dragging) cursor.set(null);
      else if (e.pointerType !== "touch") scene.pointer(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (stageEl.hasPointerCapture?.(e.pointerId)) stageEl.releasePointerCapture(e.pointerId);
      if (!scene.release()) {
        if (e.pointerType !== "touch") scene.pointer(e.clientX, e.clientY);
        return;
      }
      const did = scene.tap(e.clientX, e.clientY, e.pointerType === "touch");
      if (did === "case" && scene.focused) goCase(scene.focused);
    };
    const onCancel = () => scene.release();
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      inside = false;
      cursor.set(null);
      scene.leave();
    };
    // The control the visitor reached with the keys, if the focus is on one: its Enter is its own.
    // A pill or the sound chip that was clicked keeps the focus too, and must not take Enter from the ball.
    const byKeys = (el: Element | null) => {
      try {
        return !!el?.matches(":focus-visible");
      } catch {
        return true; // no :focus-visible: leave Enter to whatever has the focus
      }
    };
    let keyFocus: Element | null = byKeys(document.activeElement) ? document.activeElement : null;
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      keyFocus = byKeys(el) ? el : null;
    };
    /**
     * Enter belongs to the ball unless the visitor is typing, or has tabbed to
     * another link or button. This page's own pill never keeps it: arriving
     * by the tab bar leaves that pill focused, and following it would only
     * reload the page they are on.
     */
    const ballTakesEnter = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement) || el === document.body) return true;
      if (el.isContentEditable || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return false;
      if (el.matches('.tabs a[aria-current="page"]')) return true;
      return !(el.closest("a[href], button") && el === keyFocus);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isCurrent() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") scene.step(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") scene.step(-1);
      else if (e.key === "Enter") {
        if (!ballTakesEnter()) return;
        const p = scene.focused;
        if (!p) return;
        // The focused pill would follow its link as well.
        e.preventDefault();
        if (scene.isOpen) goCase(p);
        else scene.openSlug(p.slug);
      } else if (e.key === "Escape") scene.escape();
    };
    const onHash = () => {
      if (window.location.pathname !== ROUTE) return;
      const slug = hashSlug();
      if (slug) scene.openSlug(slug);
      else if (scene.isOpen) scene.close();
    };
    // This page's own pill, pressed while a project is out, pushes /projects without the hash, and
    // a push fires no hashchange: the thread winds back in, so the page matches its URL again.
    const onClick = (e: MouseEvent) => {
      if (!isCurrent() || !scene.isOpen) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (a instanceof HTMLAnchorElement && a.origin === window.location.origin && a.pathname === ROUTE && !a.hash) scene.close();
    };
    const onResize = () => scene.resize();
    const onVis = () => scene.setVisible(document.visibilityState === "visible");

    stageEl.addEventListener("wheel", onWheel, { passive: false });
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerup", onUp);
    stageEl.addEventListener("pointercancel", onCancel);
    stageEl.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("click", onClick);
    return () => {
      stageEl.removeEventListener("wheel", onWheel);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerup", onUp);
      stageEl.removeEventListener("pointercancel", onCancel);
      stageEl.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onClick);
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
