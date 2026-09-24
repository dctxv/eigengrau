"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MONOGRAM, NAME, ROLE, SPACE_ITEMS } from "@/content/site";
import { CloudScene, type CloudItem } from "@/engine/space/CloudScene";
import { runIntro } from "@/engine/space/intro";
import { CursorLabel } from "@/components/CursorLabel";
import { MaskedChars, MaskedWords } from "@/components/Mask";
import { setFlag } from "@/lib/flags";
import { isCompact, prefersReducedMotion } from "@/lib/motion";

/**
 * Creative Space (spec 6): one canvas, the intro overlays, the caption, the
 * description, the cursor label and the mobile "View Case" button.
 */
export function CreativeSpacePanel({ intro }: { intro: boolean }) {
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const monogram = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const desc = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const viewCase = useRef<HTMLButtonElement>(null);
  const playIntro = intro && !prefersReducedMotion();

  useEffect(() => {
    const stageEl = stage.current!;
    const cloud = new CloudScene(canvas.current!, SPACE_ITEMS, { reducedMotion: prefersReducedMotion() });
    const cursor = new CursorLabel(label.current!, stageEl);
    Object.assign(stageEl, { __cloud: cloud }); // handy for debugging and headless QA
    let stopIntro: (() => void) | null = null;

    if (playIntro) {
      stopIntro = runIntro(
        {
          words: gsap.utils.toArray<HTMLElement>(".intro-side .mask > span", side.current!),
          letters: gsap.utils.toArray<HTMLElement>(".mask > span", monogram.current!),
          counterInner: counter.current!.firstElementChild as HTMLElement,
        },
        cloud,
      );
    } else {
      gsap.set([side.current, monogram.current, counter.current], { display: "none" });
      cloud.load().then(() => {
        cloud.showSettled();
        setFlag("loadingComplete", true);
        setFlag("pageReady", true);
      });
    }

    // ---- caption / description / view case (DOM overlays)
    const capTitle = caption.current!.querySelector("h3")!;
    const capCat = caption.current!.querySelector("p")!;
    const captionMasks = () => gsap.utils.toArray<HTMLElement>(".mask > span", caption.current!);
    const showCaption = (it: CloudItem) => {
      capTitle.querySelector(".mask > span")!.textContent = it.source.title;
      capCat.querySelector(".mask > span")!.textContent = it.source.category;
      desc.current!.innerHTML = it.source.description
        .map((line) => `<p><span class="mask"><span>${line.replace(/</g, "&lt;")}</span></span></p>`)
        .join("");
      gsap.set(gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!), { yPercent: 100, opacity: 0 });
      gsap.fromTo(captionMasks(), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, delay: 0.35, overwrite: true });
      if (isCompact()) gsap.fromTo(viewCase.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4, overwrite: true });
    };
    const hideCaption = () => {
      gsap.to(captionMasks(), { yPercent: -100, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.04, overwrite: true });
      const lines = gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!);
      if (lines.length) gsap.to(lines, { yPercent: -100, opacity: 0, duration: 0.3, ease: "power3.out", overwrite: true });
      gsap.to(viewCase.current, { opacity: 0, y: 10, duration: 0.3, overwrite: true });
    };
    const showDesc = (on: boolean) => {
      const lines = gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!);
      if (on) gsap.fromTo(lines, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.06, delay: 0.2, overwrite: true });
      else gsap.to(lines, { yPercent: -100, opacity: 0, duration: 0.35, ease: "power3.out", stagger: 0.03, overwrite: true });
    };

    // ---- pointer, wheel, touch, keyboard (spec 6.4, 6.5)
    let down = { x: 0, y: 0, t: 0 };
    let lastTouchY = 0;
    const onMove = (e: PointerEvent) => {
      cloud.setPointer(e.clientX);
      if (!cloud.focused) {
        cursor.set(null);
        return;
      }
      const hit = cloud.pick(e.clientX, e.clientY);
      cursor.set(hit === cloud.focused ? "Overview" : "Close");
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      lastTouchY = e.clientY;
    };
    const onDrag = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !(e.buttons & 1)) return;
      cloud.scrub((lastTouchY - e.clientY) * 2.5);
      lastTouchY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || performance.now() - down.t > 600) return;
      if (cloud.state !== "exploded") return;
      const hit = cloud.pick(e.clientX, e.clientY);
      if (cloud.focused) {
        if (hit === cloud.focused) {
          const on = !cloud.overview;
          cloud.setOverview(on);
          showDesc(on);
        } else {
          hideCaption();
          cloud.unfocus();
          cursor.set(null);
        }
      } else if (hit) {
        cloud.focus(hit);
        showCaption(hit);
        cursor.set("Overview");
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cloud.scrub(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") cloud.scrub(-120);
      else if (e.key === "ArrowRight") cloud.scrub(120);
      else if (e.key === "Escape" && cloud.focused) {
        hideCaption();
        cloud.unfocus();
        cursor.set(null);
      } else if (e.key === "Enter" && !cloud.focused && cloud.state === "exploded") {
        const it = cloud.nearestToCentre();
        if (it) {
          cloud.focus(it);
          showCaption(it);
        }
      }
    };
    const onViewCase = () => {
      if (!cloud.focused) return;
      const on = !cloud.overview;
      cloud.setOverview(on);
      showDesc(on);
    };
    const onResize = () => cloud.resize();
    const onVis = () => cloud.setVisible(document.visibilityState === "visible");

    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointermove", onDrag);
    stageEl.addEventListener("pointerup", onUp);
    stageEl.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    viewCase.current!.addEventListener("click", onViewCase);

    return () => {
      stopIntro?.();
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointermove", onDrag);
      stageEl.removeEventListener("pointerup", onUp);
      stageEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      cursor.destroy();
      cloud.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={stage} className="stage stage-space" aria-hidden="true">
      <canvas ref={canvas} />

      {/* Intro overlays (spec 5.1). Hidden without JS-driven reveal on non-intro loads. */}
      <div ref={side} className="intro-side">
        <MaskedWords text={NAME} className="intro-name" />
        <MaskedWords text={ROLE} className="intro-role" />
      </div>
      <div ref={monogram} className="intro-monogram">
        <MaskedChars text={MONOGRAM} />
      </div>
      <div ref={counter} className="intro-counter mask">
        <span>001</span>
      </div>

      {/* Focus overlays (spec 6.5) */}
      <div ref={caption} className="space-caption">
        <h3>
          <span className="mask">
            <span />
          </span>
        </h3>
        <p>
          <span className="mask">
            <span />
          </span>
        </p>
      </div>
      <div ref={desc} className="space-desc" />
      <button ref={viewCase} type="button" className="view-case">
        View Case
      </button>
      <div ref={label} className="cursor-label" />
    </section>
  );
}
