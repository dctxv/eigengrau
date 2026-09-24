"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { MONOGRAM, NAME, RESIDENT_LINES, ROLE, SPACE_ITEMS } from "@/content/site";
import { CloudScene, type CloudItem } from "@/engine/space/CloudScene";
import { runIntro } from "@/engine/space/intro";
import { CursorLabel } from "@/components/CursorLabel";
import { MaskedChars, MaskedWords } from "@/components/Mask";
import { Threshold } from "@/components/pages/Threshold";
import { setFlag } from "@/lib/flags";
import { DUR, isCompact, prefersReducedMotion } from "@/lib/motion";
import { readResult, resultCaption, todayUTC, writeResult } from "@/lib/threshold";

/** The game's door and its stack: the resident, a gap, the plate. */
const GAME_HASH = "#threshold";
const PLATE_MAX = 480;
const PLATE_MARGIN = 32;
const STACK_GAP = 24;
/** Below this height the resident dims with the room instead of rising above the plate. */
const STACK_MIN_H = 620;
/** Seconds the result caption holds the slot before the hover caption may return. */
const RESULT_DWELL = 4;

/** The scene's side of the game, reachable from the board's React handlers. */
type Game = {
  correct(): void;
  miss(): void;
  end(result: number): void;
  closed(abandoned: boolean): void;
  pointer(clientX: number, clientY: number, onPlate: boolean): void;
  leave(): void;
};

/**
 * Space (spec 6): one canvas, the intro overlays, the caption, the
 * description, the cursor label and the mobile "View Case" button. The
 * resident sits at the centre: hovering it raises the caption, clicking it
 * opens Threshold, which is DOM beside the stage so it stays accessible.
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
  const live = useRef<HTMLParagraphElement>(null);
  const reducedMotion = prefersReducedMotion();
  const game = useRef<Game | null>(null);
  /** The board is up: the day it plays and how far the plate sits below the centre. */
  const [board, setBoard] = useState<{ date: string; drop: number } | null>(null);

  useEffect(() => {
    const stageEl = stage.current!;
    const hashGame = window.location.hash === GAME_HASH;
    const playIntro = intro && !reducedMotion && !hashGame;
    const cloud = new CloudScene(canvas.current!, SPACE_ITEMS, { reducedMotion });
    const cursor = new CursorLabel(label.current!, stageEl);
    Object.assign(stageEl, { __cloud: cloud }); // handy for debugging and headless QA
    let stopIntro: (() => void) | null = null;
    let openTimer: gsap.core.Tween | null = null;

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
        setFlag("exploded", true);
        setFlag("pageReady", true);
        // Arriving at the door: the board opens once the chrome has landed.
        if (hashGame) openTimer = gsap.delayedCall(DUR.drop + 0.2, () => openGame());
      });
    }

    // ---- caption / description / view case (DOM overlays)
    const capTitle = caption.current!.querySelector("h3")!;
    const capCat = caption.current!.querySelector("p")!;
    const captionMasks = () => gsap.utils.toArray<HTMLElement>(".mask > span", caption.current!);
    const raiseCaption = (title: string, sub: string, delay: number) => {
      capTitle.querySelector(".mask > span")!.textContent = title;
      capCat.querySelector(".mask > span")!.textContent = sub;
      gsap.fromTo(captionMasks(), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, delay, overwrite: true });
    };
    const showCaption = (it: CloudItem) => {
      desc.current!.innerHTML = it.source.description
        .map((line) => `<p><span class="mask"><span>${line.replace(/</g, "&lt;")}</span></span></p>`)
        .join("");
      const lines = gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!);
      if (lines.length) gsap.set(lines, { yPercent: 100, opacity: 0 });
      raiseCaption(it.source.title, it.source.category, 0.35);
      if (isCompact()) gsap.fromTo(viewCase.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4, overwrite: true });
    };
    const hideCaption = () => {
      gsap.to(captionMasks(), { yPercent: -100, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.04, overwrite: true });
      const lines = gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!);
      if (lines.length) gsap.to(lines, { yPercent: -100, opacity: 0, duration: 0.3, ease: "power3.out", overwrite: true });
      gsap.to(viewCase.current, { opacity: 0, y: 10, duration: 0.3, overwrite: true });
    };

    // ---- the resident: hover raises his line, leaving drops it; a result caption outranks both while it shows
    // One of his lines, chosen once per visit.
    const line = RESIDENT_LINES[Math.floor(Math.random() * RESIDENT_LINES.length)];
    let overResident = false;
    let resultShown = false;
    let resultTimer: gsap.core.Tween | null = null;
    const showResidentCaption = () => raiseCaption("Quiet", line, 0);
    const setOverResident = (on: boolean) => {
      if (on === overResident) return;
      overResident = on;
      cursor.set(on ? "Threshold" : null);
      if (resultShown) return;
      if (on) showResidentCaption();
      else hideCaption();
    };
    const showDesc = (on: boolean) => {
      const lines = gsap.utils.toArray<HTMLElement>(".mask > span", desc.current!);
      if (!lines.length) return;
      if (on) gsap.fromTo(lines, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.06, delay: 0.2, overwrite: true });
      else gsap.to(lines, { yPercent: -100, opacity: 0, duration: 0.35, ease: "power3.out", stagger: 0.03, overwrite: true });
    };

    // ---- Threshold: the door, the stack, the result
    let gameOpen = false;
    /** The day the open run belongs to, so a run across UTC midnight still scores that day. */
    let gameDate = todayUTC();
    /** The run's result, shown once the board has left. */
    let pending: number | null = null;
    const stackFits = () => window.innerHeight >= STACK_MIN_H;
    const plateSize = () => Math.min(PLATE_MAX, window.innerWidth - PLATE_MARGIN, window.innerHeight - PLATE_MARGIN);
    /** The resident, a gap and the plate form one centred stack; returns the plate's drop below the centre. */
    const stack = (duration: number) => {
      const fits = stackFits();
      cloud.liftResident(fits ? (STACK_GAP + plateSize()) / 2 : 0, duration);
      cloud.dimResident(!fits);
      return fits ? (cloud.residentSize.h + STACK_GAP) / 2 : 0;
    };
    const showResult = (date: string, result: number) => {
      const { title, line } = resultCaption(date, result);
      resultShown = true;
      resultTimer?.kill();
      raiseCaption(title, line, 0.2);
      if (live.current) live.current.textContent = `${title}. ${line}`;
      resultTimer = gsap.delayedCall(RESULT_DWELL, () => {
        resultShown = false;
        if (overResident) showResidentCaption();
        else hideCaption();
      });
    };
    const dropHash = () => {
      if (window.location.hash === GAME_HASH) window.history.replaceState(null, "", window.location.pathname);
    };
    const openGame = () => {
      if (gameOpen || cloud.state !== "exploded" || cloud.focused) return;
      const date = todayUTC();
      const played = readResult(date);
      // A second knock the same day shows the result instead of a new run.
      if (played !== null) {
        dropHash();
        showResult(date, played);
        return;
      }
      gameOpen = true;
      gameDate = date;
      pending = null;
      overResident = false;
      cursor.set(null);
      resultTimer?.kill();
      resultShown = false;
      hideCaption();
      cloud.dim(true);
      setBoard({ date, drop: stack(reducedMotion ? 0 : 0.9) });
    };
    const closeGame = (abandoned: boolean) => {
      gameOpen = false;
      setBoard(null);
      cloud.dim(false);
      cloud.liftResident(0, reducedMotion ? 0 : 0.9);
      cloud.dimResident(false);
      cursor.set(null);
      dropHash();
      if (!abandoned && pending !== null) showResult(gameDate, pending);
      pending = null;
    };
    game.current = {
      correct: () => {
        sfx.play("tick");
        cloud.resident.blinkSlow();
      },
      miss: () => {
        sfx.play("close");
        cloud.resident.glanceAside();
      },
      end: (result) => {
        writeResult(gameDate, result);
        pending = result;
      },
      closed: closeGame,
      pointer: (x, y, onPlate) => {
        cloud.setPointer(x, y);
        cursor.set(onPlate ? null : "Close");
      },
      leave: () => cursor.set(null),
    };

    // ---- pointer, wheel, touch, keyboard (spec 6.4, 6.5)
    let down = { x: 0, y: 0, t: 0 };
    let lastTouchY = 0;
    const onMove = (e: PointerEvent) => {
      cloud.setPointer(e.clientX, e.clientY);
      if (!cloud.focused) {
        // Pieces first; the resident only when none is under the pointer.
        const over = !cloud.pick(e.clientX, e.clientY) && cloud.residentHit(e.clientX, e.clientY);
        setOverResident(over);
        if (!over) cursor.set(null);
        return;
      }
      const hit = cloud.pick(e.clientX, e.clientY);
      cursor.set(hit === cloud.focused ? "Overview" : "Close");
    };
    const onLeave = () => setOverResident(false);
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
        overResident = false;
        cloud.focus(hit);
        showCaption(hit);
        cursor.set("Overview");
      } else if (cloud.residentHit(e.clientX, e.clientY)) {
        openGame();
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cloud.scrub(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    };
    const onKey = (e: KeyboardEvent) => {
      if (gameOpen) return;
      if (e.key === "ArrowLeft") cloud.scrub(-120);
      else if (e.key === "ArrowRight") cloud.scrub(120);
      else if (e.key === "Escape" && cloud.focused) {
        hideCaption();
        cloud.unfocus();
        cursor.set(null);
      } else if (e.key === "Enter" && !cloud.focused && cloud.state === "exploded") {
        const it = cloud.nearestToCentre();
        if (it) {
          overResident = false;
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
    const onResize = () => {
      cloud.resize();
      if (gameOpen) {
        const drop = stack(0);
        setBoard((b) => b && { ...b, drop });
      }
    };
    const onVis = () => cloud.setVisible(document.visibilityState === "visible");

    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerleave", onLeave);
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
      openTimer?.kill();
      resultTimer?.kill();
      game.current = null;
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
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
    <div className="space-panel">
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
        <button ref={viewCase} type="button" className="view-case" tabIndex={-1}>
          View Case
        </button>
        <div ref={label} className="cursor-label" />
      </section>

      {/* The game, beside the stage rather than inside it, so it is not aria-hidden; its result is read out here. */}
      <p ref={live} className="sr-only" aria-live="polite" />
      {board && (
        <Threshold
          date={board.date}
          drop={board.drop}
          reducedMotion={reducedMotion}
          onCorrect={() => game.current?.correct()}
          onMiss={() => game.current?.miss()}
          onEnd={(result) => game.current?.end(result)}
          onClosed={(abandoned) => game.current?.closed(abandoned)}
          onPointer={(x, y, onPlate) => game.current?.pointer(x, y, onPlate)}
          onLeave={() => game.current?.leave()}
        />
      )}
    </div>
  );
}
