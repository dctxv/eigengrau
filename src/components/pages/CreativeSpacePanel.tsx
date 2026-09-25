"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { MONOGRAM, NAME, ROLE, URCHI_LINES } from "@/content/site";
import { RoomScene } from "@/engine/space/RoomScene";
import { runIntro } from "@/engine/space/intro";
import { CursorLabel } from "@/components/CursorLabel";
import { MaskedChars, MaskedWords } from "@/components/Mask";
import { Threshold } from "@/components/pages/Threshold";
import { setFlag } from "@/lib/flags";
import { DUR, prefersReducedMotion } from "@/lib/motion";
import { readResult, resultCaption, todayUTC, writeResult } from "@/lib/threshold";

/** The game's door and its stack: Urchi, a gap, the plate. */
const GAME_HASH = "#threshold";
const PLATE_MAX = 480;
const PLATE_MARGIN = 32;
const STACK_GAP = 24;
/** Room the stack keeps above and below it: clear of the nav, off the bottom edge. */
const STACK_CLEAR = 48;
/** Seconds the result caption holds the slot before the hover caption may return. */
const RESULT_DWELL = 4;
/** A press that moves less than this (px) and lets go within this (ms) is a click. */
const CLICK = { slop: 6, ms: 600 };

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
 * Space, tab 1: Urchi alone in its room. One canvas, the intro's overlays,
 * the caption and the cursor label. Hovering Urchi raises its name over one
 * of his lines; clicking it opens Threshold, which is DOM beside the stage so
 * it stays accessible.
 */
export function CreativeSpacePanel({ intro }: { intro: boolean }) {
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const monogram = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const reducedMotion = prefersReducedMotion();
  const game = useRef<Game | null>(null);
  /** The board is up: the day it plays and how far the plate sits below the centre. */
  const [board, setBoard] = useState<{ date: string; drop: number } | null>(null);

  useEffect(() => {
    const stageEl = stage.current!;
    const hashGame = window.location.hash === GAME_HASH;
    const playIntro = intro && !reducedMotion && !hashGame;
    const room = new RoomScene(canvas.current!, { reducedMotion });
    const cursor = new CursorLabel(label.current!, stageEl);
    Object.assign(stageEl, { __room: room }); // handy for debugging and headless QA
    let stopIntro: (() => void) | null = null;
    let openTimer: gsap.core.Tween | null = null;

    if (playIntro) {
      stopIntro = runIntro(
        {
          words: gsap.utils.toArray<HTMLElement>(".intro-side .mask > span", side.current!),
          letters: gsap.utils.toArray<HTMLElement>(".mask > span", monogram.current!),
          counterInner: counter.current!.firstElementChild as HTMLElement,
        },
        room,
      );
    } else {
      // No intro, and nothing to load: Urchi is simply there.
      gsap.set([side.current, monogram.current, counter.current], { display: "none" });
      room.showUrchi(0.6);
      setFlag("loadingComplete", true);
      setFlag("exploded", true);
      setFlag("pageReady", true);
      // Arriving at the door: the board opens once the chrome has landed.
      if (hashGame) openTimer = gsap.delayedCall(DUR.drop + 0.2, () => openGame());
    }

    // ---- the caption: Urchi's name over one of his lines, or the game's result
    const capTitle = caption.current!.querySelector("h3")!;
    const capLine = caption.current!.querySelector("p")!;
    const captionMasks = () => gsap.utils.toArray<HTMLElement>(".mask > span", caption.current!);
    const raiseCaption = (title: string, sub: string, delay: number) => {
      capTitle.querySelector(".mask > span")!.textContent = title;
      capLine.querySelector(".mask > span")!.textContent = sub;
      gsap.fromTo(captionMasks(), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, delay, overwrite: true });
    };
    const hideCaption = () => {
      // Reduced motion pins every mask's text in place (globals.css), so the words themselves go.
      if (reducedMotion) captionMasks().forEach((s) => (s.textContent = ""));
      else gsap.to(captionMasks(), { yPercent: -100, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.04, overwrite: true });
    };

    // Hover raises the caption, leaving drops it; a result caption outranks both while it shows.
    // One of his lines, chosen once per visit.
    const line = URCHI_LINES[Math.floor(Math.random() * URCHI_LINES.length)];
    let overUrchi = false;
    let resultShown = false;
    let resultTimer: gsap.core.Tween | null = null;
    const showUrchiCaption = () => raiseCaption("Urchi", line, 0);
    const setOverUrchi = (on: boolean) => {
      if (on === overUrchi) return;
      overUrchi = on;
      cursor.set(on ? "Threshold" : null);
      if (resultShown) return;
      if (on) showUrchiCaption();
      else hideCaption();
    };

    // ---- Threshold: the door, the stack, the result
    let gameOpen = false;
    /** The day the open run belongs to, so a run across UTC midnight still scores that day. */
    let gameDate = todayUTC();
    /** The run's result, shown once the board has left. */
    let pending: number | null = null;
    const plateSize = () => Math.min(PLATE_MAX, window.innerWidth - PLATE_MARGIN, window.innerHeight - PLATE_MARGIN);
    /**
     * Urchi, a gap and the plate form one centred stack; returns the plate's drop below the centre.
     * Urchi steps down to the largest whole pixel scale whose head fits above the plate, so its
     * pixels stay square; when not even one screen pixel per art pixel fits, it dims instead.
     */
    const stack = (duration: number) => {
      const plate = plateSize();
      const step = room.stepFitting(window.innerHeight - 2 * STACK_CLEAR - STACK_GAP - plate);
      const fits = step > 0;
      room.liftUrchi(fits ? (STACK_GAP + plate) / 2 : 0, duration, fits ? room.pixelAt(step) / room.pixel : 1);
      room.dimUrchi(!fits);
      return fits ? (room.headAt(step) + STACK_GAP) / 2 : 0;
    };
    const showResult = (date: string, result: number) => {
      const { title, line } = resultCaption(date, result);
      resultShown = true;
      resultTimer?.kill();
      raiseCaption(title, line, 0.2);
      if (live.current) live.current.textContent = `${title}. ${line}`;
      resultTimer = gsap.delayedCall(RESULT_DWELL, () => {
        resultShown = false;
        if (overUrchi) showUrchiCaption();
        else hideCaption();
      });
    };
    const dropHash = () => {
      if (window.location.hash === GAME_HASH) window.history.replaceState(null, "", window.location.pathname);
    };
    const openGame = () => {
      if (gameOpen || !room.interactive) return;
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
      overUrchi = false;
      cursor.set(null);
      resultTimer?.kill();
      resultShown = false;
      hideCaption();
      setBoard({ date, drop: stack(reducedMotion ? 0 : 0.9) });
    };
    const closeGame = (abandoned: boolean) => {
      gameOpen = false;
      setBoard(null);
      room.liftUrchi(0, reducedMotion ? 0 : 0.9);
      room.dimUrchi(false);
      cursor.set(null);
      dropHash();
      if (!abandoned && pending !== null) showResult(gameDate, pending);
      pending = null;
    };
    game.current = {
      correct: () => {
        sfx.play("tick");
        room.urchi.slowBlink();
      },
      miss: () => {
        sfx.play("close");
        room.urchi.glance();
      },
      end: (result) => {
        writeResult(gameDate, result);
        pending = result;
      },
      closed: closeGame,
      // Urchi follows the pointer on its own while the board is up.
      pointer: (_x, _y, onPlate) => cursor.set(onPlate ? null : "Close"),
      leave: () => cursor.set(null),
    };

    // ---- pointer: hover and click on Urchi
    let down = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => setOverUrchi(room.urchiHit(e.clientX, e.clientY));
    const onLeave = () => setOverUrchi(false);
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK.slop || performance.now() - down.t > CLICK.ms) return;
      if (room.urchiHit(e.clientX, e.clientY)) openGame();
    };
    const onResize = () => {
      room.resize();
      if (gameOpen) {
        const drop = stack(0);
        setBoard((b) => b && { ...b, drop });
      }
    };

    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerleave", onLeave);
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointerup", onUp);
    window.addEventListener("resize", onResize);

    return () => {
      stopIntro?.();
      openTimer?.kill();
      resultTimer?.kill();
      game.current = null;
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      cursor.destroy();
      room.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-panel">
      <section ref={stage} className="stage stage-space" aria-hidden="true">
        <canvas ref={canvas} />

        {/* The intro's overlays, hidden on any load that skips it. */}
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

        {/* Urchi's caption: its name over one of his lines, or the game's result. */}
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
