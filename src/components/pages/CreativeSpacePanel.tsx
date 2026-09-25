"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { MONOGRAM, NAME, ROLE, URCHI_LINES, URCHI_STATES, fillLine } from "@/content/site";
import { Motes } from "@/engine/space/Motes";
import { RoomScene } from "@/engine/space/RoomScene";
import { runIntro } from "@/engine/space/intro";
import { comeBack, glanceAt, glanceDown, read, tug } from "@/engine/urchi/acts";
import { Attention, pillAt, type Point } from "@/engine/urchi/attention";
import { clock } from "@/engine/urchi/hours";
import { CursorLabel } from "@/components/CursorLabel";
import { MaskedChars, MaskedWords } from "@/components/Mask";
import { Threshold } from "@/components/pages/Threshold";
import { getFlags, setFlag } from "@/lib/flags";
import { DUR, prefersReducedMotion } from "@/lib/motion";
import { pollNow, type Track } from "@/lib/now";
import { isTab } from "@/lib/routes";
import { readResult, resultCaption, todayUTC, writeResult } from "@/lib/threshold";
import { leftRoute, markNewsTold, newsTold, whatsNew } from "@/lib/visits";

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
/**
 * Seconds the pointer must rest on Urchi before its caption rises. A pointer crossing it on the
 * way to the tabs is not a hover, and must not spend the line's one reading.
 */
const HOVER_REST = 0.35;
/**
 * What's new (spec S4): the look waits this long after the eyes open (or after the intro hands
 * over), and for the pointer to be still this long; then its line holds the caption this long.
 */
const NEWS = { after: 2.4, afterIntro: 0.8, still: 1, dwell: 4 };
/** A phone has no hover: the caption rises once, this long after the eyes open, and sinks after `dwell`. */
const PHONE_CAPTION = { after: 3, dwell: 5 };
/** While he is listening: a look at the "4" first after this long, then every 60-90s. */
const LISTEN_GLANCE = { first: [8, 20] as [number, number], every: [60, 90] as [number, number] };
/** A song "playing" for longer than this is a stale now-playing, and treated as nothing. */
const STALE_MS = 15 * 60 * 1000;
/** The listening line is his; longer than this, it is the shorter one. */
const LINE_MAX = 48;

/** Lines Urchi has read this visit (in memory): later hovers get only a glance down at them. */
const readLines = new Set<string>();
/** The phone's one caption, once per visit. */
let phoneCaptionShown = false;
/** When this session first saw each now-playing track, for the stale cap. */
const firstSeen = new Map<string, number>();
/**
 * What the last poll said (in memory, across tab changes), so coming back to tab 1 at night while
 * he plays something does not show it asleep until this mount's own first poll answers.
 */
let lastNow: { track: Track | null; at: number } | null = null;
/** How old that answer may be and still be believed (the poll runs once a minute). */
const NOW_FRESH_MS = 2 * 60 * 1000;
/** At night, with nothing known yet, Urchi waits this long (ms, at most) for the poll before it appears. */
const NIGHT_WAIT = 800;

/** The scene's side of the game, reachable from the board's React handlers. */
type Game = {
  correct(): void;
  miss(): void;
  end(result: number): void;
  closed(abandoned: boolean): void;
  pointer(clientX: number, clientY: number, onPlate: boolean): void;
  leave(): void;
};

/** Who holds the caption: a timed line outranks the hover caption (the result most of all). */
type Slot = "hover" | "auto" | "news" | "result";
const RANK: Record<Slot, number> = { hover: 1, auto: 1, news: 2, result: 3 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** The words of a caption line, as points (their centres) in client px, left to right. */
function wordsOf(span: HTMLElement): Point[] {
  const node = span.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return [];
  const box = (span.parentElement ?? span).getBoundingClientRect();
  const y = box.top + box.height / 2;
  const range = document.createRange();
  const out: Point[] = [];
  for (const m of (node.textContent ?? "").matchAll(/\S+/g)) {
    range.setStart(node, m.index!);
    range.setEnd(node, m.index! + m[0].length);
    const r = range.getBoundingClientRect();
    if (r.width) out.push({ x: r.left + r.width / 2, y });
  }
  return out;
}

/**
 * Space, tab 1: Urchi alone in its room. One canvas, the intro's overlays,
 * the caption and the cursor label. Urchi pays attention (attention.ts): it
 * chooses what to look at, watches the motes, looks up at what is new, keeps
 * his hours and reads his captions. Hovering it raises its name over one of
 * his lines; clicking it opens Threshold, which is DOM beside the stage so it
 * stays accessible.
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
    const phone = matchMedia("(hover: none)").matches;
    const room = new RoomScene(canvas.current!, { reducedMotion });
    const cursor = new CursorLabel(label.current!, stageEl);
    // Its attention: the eyes look out from between the eyes, in client px.
    const eyesClient = (): Point => {
      const r = room.canvas.getBoundingClientRect();
      const e = room.eyes();
      return { x: r.left + r.width / 2 + e.x, y: r.top + r.height / 2 - e.y };
    };
    let moodChanged = () => {};
    const att = new Attention(room.urchi.character, { head: eyesClient, reach: () => room.urchiSize.w / 2, reducedMotion, onMood: () => moodChanged() });
    const motes = new Motes(room, att, { reducedMotion });
    Object.assign(stageEl, { __room: room, __att: att, __motes: motes }); // handy for debugging and headless QA
    let stopIntro: (() => void) | null = null;
    let stopArrive: (() => void) | null = null;
    let openTimer: gsap.core.Tween | null = null;

    // ---- the caption: Urchi's name over one of his lines, a state, what's new, or the game's result
    const capTitle = caption.current!.querySelector("h3")!;
    const capLine = caption.current!.querySelector("p")!;
    const lineSpan = capLine.querySelector<HTMLElement>(".mask > span")!;
    const captionMasks = () => gsap.utils.toArray<HTMLElement>(".mask > span", caption.current!);
    const raiseCaption = (title: string, sub: string, delay: number) => {
      capTitle.querySelector(".mask > span")!.textContent = title;
      lineSpan.textContent = sub;
      gsap.fromTo(captionMasks(), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, delay, overwrite: true });
    };
    const hideCaption = () => {
      // Reduced motion pins every mask's text in place (globals.css), so the words themselves go.
      if (reducedMotion) captionMasks().forEach((s) => (s.textContent = ""));
      else gsap.to(captionMasks(), { yPercent: -100, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.04, overwrite: true });
    };

    // One slot: a timed caption (the result, what's new, the phone's one rise) holds it for its
    // dwell; then it goes back to the hover caption if the pointer rests on Urchi, or sinks.
    let slot: Slot | null = null;
    let slotTimer: gsap.core.Tween | null = null;
    /** The pointer is on Urchi (the cursor label follows at once)... */
    let overUrchi = false;
    /** ...and has rested there HOVER_REST: the hover caption is up, or waits for a timed one. */
    let hovering = false;
    let restTimer: gsap.core.Tween | null = null;
    const release = () => {
      slotTimer?.kill();
      slotTimer = null;
      slot = null;
      att.cancel("read");
      if (hovering) showUrchiCaption();
      else hideCaption();
    };
    const say = (kind: Slot, title: string, line: string, o: { dwell?: number; delay?: number } = {}) => {
      if (slot && RANK[slot] > RANK[kind]) return false;
      slotTimer?.kill();
      slotTimer = null;
      if (kind !== "hover" && kind !== "auto") att.cancel("read");
      slot = kind;
      raiseCaption(title, line, o.delay ?? 0);
      if (o.dwell) slotTimer = gsap.delayedCall(o.dwell, release);
      return true;
    };

    // ---- what the hover caption says: his line (one per visit), or his hours' or his music's
    const line = URCHI_LINES[Math.floor(Math.random() * URCHI_LINES.length)];
    let playing: Track | null = null;
    const hoverLine = (): { text: string; readable: boolean } => {
      // The night's sleep only: dozing off in daylight is not "asleep" at 14:05
      if (att.mood === "asleep") return { text: fillLine(URCHI_STATES.asleep, { time: clock().text }), readable: false };
      if (att.listening && playing) {
        const l = fillLine(URCHI_STATES.listening, { title: playing.title });
        return { text: l.length > LINE_MAX ? URCHI_STATES.listeningLong : l, readable: false };
      }
      return { text: line.text, readable: true };
    };
    /**
     * His line rises and Urchi reads it (once per line per visit; after that, a glance down). Not
     * its states: it is asleep, or listening. A first reading waits for whatever Urchi is busy
     * with (waking, a look at what is new, a mote) for as long as the line stays up: the caption
     * sinking or changing cancels it.
     */
    const readCaption = (text: string) => {
      if (att.has("read")) return;
      const words = () => wordsOf(lineSpan);
      if (readLines.has(text)) {
        att.play("read", 2, () => glanceDown(att, words()), { queue: 0.6 });
        return;
      }
      // read once its last jump has landed: a reading cut off before that leaves the line unread
      att.play("read", 2, () => read(att, words(), line.reaction, () => readLines.add(text)), { queue: Infinity });
    };
    const showUrchiCaption = (kind: Slot = "hover", dwell?: number) => {
      const { text, readable } = hoverLine();
      if (!say(kind, "Urchi", text, { dwell })) return;
      if (readable) readCaption(text);
    };
    /** The pointer has rested on Urchi: its caption rises (or waits for a timed one to finish). */
    const settleHover = () => {
      restTimer = null;
      hovering = true;
      if (slot && slot !== "hover") return;
      // You came to it: it stops looking back at the tab you left (or at the "4") and reads.
      att.cancel("comeBack");
      att.cancel("listenGlance");
      showUrchiCaption();
    };
    const setOverUrchi = (on: boolean) => {
      if (on === overUrchi) return;
      // Dozing, the pointer arriving stirs it first, so its caption is decided awake.
      if (on) att.rouse();
      overUrchi = on;
      cursor.set(on ? (att.asleep ? "Wake" : "Threshold") : null);
      restTimer?.kill();
      restTimer = on ? gsap.delayedCall(HOVER_REST, settleHover) : null;
      if (on || !hovering) return;
      hovering = false;
      if (slot && slot !== "hover") return;
      slot = null;
      att.cancel("read");
      hideCaption();
    };

    // Falling asleep or waking under the pointer: the label follows, and the caption when its words change.
    moodChanged = () => {
      if (overUrchi) cursor.set(att.asleep ? "Wake" : "Threshold");
      // The phone's one caption follows too: a tap that wakes it at night must not leave it
      // saying "asleep" with its eyes open. Awake, the line is his, and it reads it.
      if (slot === "auto") {
        if (lineSpan.textContent !== hoverLine().text) {
          att.cancel("read");
          showUrchiCaption("auto", PHONE_CAPTION.dwell);
        }
        return;
      }
      if (!hovering || (slot && slot !== "hover")) return;
      const { text, readable } = hoverLine();
      if (slot === "hover" && lineSpan.textContent === text) {
        if (readable) readCaption(text); // the same line, and awake now to read it
        return;
      }
      att.cancel("read");
      showUrchiCaption();
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
      say("result", title, line, { dwell: RESULT_DWELL, delay: 0.2 });
      if (live.current) live.current.textContent = `${title}. ${line}`;
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
      overUrchi = hovering = false;
      restTimer?.kill();
      restTimer = null;
      cursor.set(null);
      slotTimer?.kill();
      slot = null;
      hideCaption();
      att.pause(true);
      motes.hide(true);
      setBoard({ date, drop: stack(reducedMotion ? 0 : 0.9) });
    };
    const closeGame = (abandoned: boolean) => {
      gameOpen = false;
      setBoard(null);
      room.liftUrchi(0, reducedMotion ? 0 : 0.9);
      room.dimUrchi(false);
      cursor.set(null);
      dropHash();
      att.pause(false);
      motes.hide(false);
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

    // ---- its life in the room, once its eyes are its own
    let begun = -1;
    let newsAt = Infinity;
    const news = newsTold() ? null : whatsNew();
    let listenGlance = Infinity;
    const begin = (afterIntro: boolean) => {
      if (begun >= 0) return;
      att.start({ afterIntro });
      motes.start();
      begun = att.t;
      newsAt = att.t + (afterIntro ? NEWS.afterIntro : NEWS.after);
      // Back from another tab: it is still watching the pill of the tab you left.
      const left = leftRoute();
      if (!afterIntro && left && left !== "/" && isTab(left)) {
        att.play("comeBack", 6, () => comeBack(att, () => pillAt(left), () => !getFlags().transitioning));
      }
    };
    const stopLife = room.onFrame((dt) => {
      att.update(dt);
      if (begun < 0 || gameOpen) return;
      const t = att.t;
      // What's new: once per visit, when you are still, a tug toward that tab, then his line.
      if (news && t >= newsAt && att.stillFor >= NEWS.still && !att.asleep && !att.acting) {
        newsAt = Infinity;
        markNewsTold();
        att.play("news", 2, () =>
          tug(att, () => pillAt(news.href), () => {
            say("news", news.label, news.line, { dwell: NEWS.dwell });
            if (live.current) live.current.textContent = `${news.label}. ${news.line}`;
            att.nodAt(news.href);
          }),
        );
      }
      // A phone has no hover: its caption rises once, and it reads it.
      if (phone && !phoneCaptionShown && t >= begun + PHONE_CAPTION.after && !att.acting && slot === null) {
        phoneCaptionShown = true;
        showUrchiCaption("auto", PHONE_CAPTION.dwell);
      }
      // While he is listening, it looks up at the "4" now and then.
      if (att.listening && t >= listenGlance) {
        listenGlance = t + rand(...LISTEN_GLANCE.every);
        att.play("listenGlance", 1, () => glanceAt(att, () => pillAt("/music")));
      }
    });

    // Is he playing something? The same poll Music uses; a track playing for over 15 minutes is stale.
    const hear = (track: Track | null) => {
      playing = track;
      if (track && !att.listening) listenGlance = att.t + rand(...LISTEN_GLANCE.first);
      att.setListening(!!track);
    };
    /** The first answer's other listener: a night arrival waiting on it. */
    let onHeard = () => {};
    // The last answer, if it is recent, holds until this mount's own poll comes back.
    const known = lastNow && Date.now() - lastNow.at < NOW_FRESH_MS ? lastNow : null;
    if (known) hear(known.track);
    const stopPoll = pollNow((r) => {
      const now = r.now;
      let on = false;
      if (now) {
        const key = `${now.artist}\u0000${now.title}`;
        if (!firstSeen.has(key)) firstSeen.set(key, Date.now());
        on = Date.now() - firstSeen.get(key)! < STALE_MS;
      }
      lastNow = { track: on ? now : null, at: Date.now() };
      hear(lastNow.track);
      onHeard();
    });

    if (playIntro) {
      stopIntro = runIntro(
        {
          words: gsap.utils.toArray<HTMLElement>(".intro-side .mask > span", side.current!),
          letters: gsap.utils.toArray<HTMLElement>(".mask > span", monogram.current!),
          counterInner: counter.current!.firstElementChild as HTMLElement,
        },
        room,
        () => begin(true),
      );
    } else {
      // No intro, and nothing to load: Urchi is simply there. At night, when nobody knows yet
      // whether he is playing something, it waits a moment for the poll before it appears, so it
      // arrives asleep or listening rather than waking the moment the answer lands.
      gsap.set([side.current, monogram.current, counter.current], { display: "none" });
      let arrived = false;
      // A real timer, not gsap's: its clock can jump ahead after a long first frame.
      let arriveTimer = 0;
      const arrive = () => {
        if (arrived) return;
        arrived = true;
        window.clearTimeout(arriveTimer);
        room.showUrchi(0.6);
        begin(false);
      };
      if (!known && clock().hours === "night") {
        onHeard = arrive;
        arriveTimer = window.setTimeout(arrive, NIGHT_WAIT);
      } else arrive();
      setFlag("loadingComplete", true);
      setFlag("exploded", true);
      setFlag("pageReady", true);
      // Arriving at the door: the board opens once the chrome has landed.
      if (hashGame)
        openTimer = gsap.delayedCall(DUR.drop + 0.2, () => {
          arrive();
          openGame();
        });
      stopArrive = () => window.clearTimeout(arriveTimer);
    }

    // ---- pointer: hover and click on Urchi; a tap on the empty room lets a mote go
    let down = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => setOverUrchi(room.urchiHit(e.clientX, e.clientY));
    const onLeave = () => setOverUrchi(false);
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK.slop || performance.now() - down.t > CLICK.ms) return;
      if (room.urchiHit(e.clientX, e.clientY)) {
        // Asleep, the first click wakes it; only the next opens the game.
        if (att.wake()) return;
        openGame();
      } else if (room.interactive && !gameOpen) motes.release(e.clientX, e.clientY);
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
      stopArrive?.();
      openTimer?.kill();
      slotTimer?.kill();
      restTimer?.kill();
      stopPoll();
      stopLife();
      game.current = null;
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
      stageEl.removeEventListener("pointerdown", onDown);
      stageEl.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      cursor.destroy();
      motes.dispose();
      att.dispose();
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

        {/* Urchi's caption: its name over one of his lines, a state, what's new, or the game's result. */}
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

      {/* The game, beside the stage rather than inside it, so it is not aria-hidden; its result (and what's new) is read out here. */}
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
