"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MONOGRAM, NAME, ROLE, URCHI_LINES, URCHI_STATES, fillLine } from "@/content/site";
import { Call } from "@/engine/space/Call";
import { Float, type FloatState } from "@/engine/space/Float";
import { Motes } from "@/engine/space/Motes";
import { RoomScene } from "@/engine/space/RoomScene";
import { runIntro } from "@/engine/space/intro";
import { caught, comeBack, glanceAt, glanceDown, read, tug, type Caught } from "@/engine/urchi/acts";
import { Attention, pillAt, type Point } from "@/engine/urchi/attention";
import { clock } from "@/engine/urchi/hours";
import { CursorLabel } from "@/components/CursorLabel";
import { MaskedChars, MaskedWords } from "@/components/Mask";
import { alongOn } from "@/lib/along";
import { getFlags, setFlag } from "@/lib/flags";
import { prefersReducedMotion } from "@/lib/motion";
import { pollNow, type Track } from "@/lib/now";
import { isTab } from "@/lib/routes";
import { leftRoute, markNewsTold, newsTold, whatsNew } from "@/lib/visits";

/** A press that moves less than this (px) and lets go within this (ms) is a click. */
const CLICK = { slop: 6, ms: 600 };
/** Reduced motion, Urchi afloat: two clicks or taps on it this close (ms, px) send it home, as a fling hard enough would. */
const TWICE = { ms: 450, px: 24 };
/** What the page says for a screen reader as Urchi goes out on its line, and as it comes home. */
const SAID = { out: "Urchi is out on its line.", snapped: "The line snapped.", home: "Urchi is home." };
/**
 * When a pointer event happened (performance.now() ms): its own time stamp, so that one long frame
 * (a phone painting Urchi at its full resolution) does not bunch the taps it held back into one
 * rhythm-breaking cluster. A stamp on another clock (older browsers counted from 1970), from the
 * future or older than `stale` ms is not believed, and the handler's own time stands in.
 */
const eventTime = (e: Event, stale = 2000) => {
  const now = performance.now();
  return e.timeStamp > 0 && e.timeStamp <= now && now - e.timeStamp < stale ? e.timeStamp : now;
};
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
/**
 * A phone has no hover: the caption rises once, this long after the eyes open, and sinks after
 * `dwell`. Never sooner than `afterCall` seconds after a rhythm tapped at it (or its answer): rising
 * the moment an answer ends, the line would read as part of it.
 */
const PHONE_CAPTION = { after: 3, dwell: 5, afterCall: 4 };
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
/**
 * When this session first and last saw each now-playing track (ms), for the stale cap when the
 * answer does not say how far in he is.
 */
const tracksSeen = new Map<string, { first: number; last: number }>();
/** A song missing from the answers this long (ms) is a new play when it comes back, as Music has it. */
const FORGET_MS = 3 * 60 * 1000;
/**
 * What the last poll said (in memory, across tab changes), so coming back to tab 1 at night while
 * he plays something does not show it asleep until this mount's own first poll answers.
 */
let lastNow: { track: Track | null; at: number } | null = null;
/** How old that answer may be and still be believed (the poll runs once a minute). */
const NOW_FRESH_MS = 2 * 60 * 1000;
/** At night, with nothing known yet, Urchi waits this long (ms, at most) for the poll before it appears. */
const NIGHT_WAIT = 800;
/**
 * Caught in the act (panel 2, N3): back on the tab after at least `away` ms elsewhere, you may
 * find it doing something it would not do while watched; at most once every `every` ms.
 */
const CAUGHT = { away: 45 * 1000, every: 10 * 60 * 1000 };
/** When it was last caught (Date.now() ms, in memory): wall time, since a phone put away may stop the page's own clock. */
let caughtAt = -Infinity;

/** Who holds the caption: a timed line (what's new) outranks the hover caption. */
type Slot = "hover" | "auto" | "news";
const RANK: Record<Slot, number> = { hover: 1, auto: 1, news: 2 };

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
 * his lines; clicking it takes it with you (Float.ts): it dissolves, and
 * floats back in from the left on a line, to be held, flung and sent home.
 * A real button over it (beside the stage, which is aria-hidden) lets the
 * keyboard do the same.
 */
export function CreativeSpacePanel({ intro }: { intro: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const monogram = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const stageEl = stage.current!;
    const panelEl = panel.current!;
    const controlEl = control.current!;
    // Taken with you within the visit: a reload finds it floating in from the left again, so the
    // intro, which builds the bare head from its eyes, gives way to the room as a return shows it.
    const along = alongOn();
    const playIntro = intro && !reducedMotion && !along;
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
    /** It is being found asleep (a night arrival): the head is on its pillow already, not settling onto it. */
    let arriving = false;
    // (afloat it looks from where it is, turned as it is: see Float.lookFrom)
    let float: Float | null = null;
    const att = new Attention(room.urchi.character, {
      head: eyesClient,
      reach: () => (room.urchiSize.w / 2) * room.shown,
      reducedMotion,
      onMood: () => moodChanged(),
      origin: () => float?.lookFrom() ?? null,
    });
    const motes = new Motes(room, att, { reducedMotion });
    const call = new Call(room, att, motes, { reducedMotion });
    /** The pointer is on Urchi (the cursor label follows at once)... */
    let overUrchi = false;
    /** Where a mouse (or pen) pointer last was over the panel, client px; null for a finger, or gone. */
    let resting: Point | null = null;
    /**
     * What a click on Urchi does, as the cursor says it: asleep, it wakes it; at home, it takes it
     * with you; afloat, you hold it. Nothing while it is on its way somewhere.
     */
    const urchiWord = () => (fl.busy ? null : att.asleep ? "Wake" : fl.afloat ? "Hold" : "Take with you");
    /** The control's name, the same thing said for the keyboard: afloat, Enter sends it home. */
    const controlName = () => (att.asleep ? "Wake Urchi" : fl.afloat ? "Send Urchi home" : "Take Urchi with you");
    /** Its word, name and cursor follow what it is doing (and whether it is asleep). */
    const labelUrchi = () => {
      if (overUrchi) cursor.set(urchiWord());
      controlEl.setAttribute("aria-label", controlName());
      controlEl.setAttribute("aria-disabled", String(fl.busy || begun < 0));
      controlEl.toggleAttribute("data-afloat", fl.afloat);
      const hand = fl.holding ? "grabbing" : overUrchi && fl.afloat && !att.asleep ? "grab" : "";
      if ((panelEl.dataset.cursor ?? "") !== hand) panelEl.dataset.cursor = hand;
    };
    let flew = false;
    const onFloat = (state: FloatState) => {
      labelUrchi();
      if (state === "floating" && live.current) live.current.textContent = SAID.out;
      // the snap is said as it happens, and "home" only once the head is back with its eyes open
      // (home without ever getting out, its suit never having come, is nothing to announce)
      if (state === "flying" && live.current) live.current.textContent = SAID.snapped;
      if (state === "flying") flew = true;
      if (state === "home" && flew && live.current) live.current.textContent = SAID.home;
      if (state === "home") flew = false;
      // the room changed under the pointer: whether it is on Urchi is asked again on its next move
      if (state !== "floating" && state !== "arriving") setOverUrchi(false);
    };
    const fl = (float = new Float({ room, att, reducedMotion, onState: (s) => onFloat(s) }));
    Object.assign(stageEl, { __room: room, __att: att, __motes: motes, __call: call, __float: fl }); // handy for debugging and headless QA
    let stopIntro: (() => void) | null = null;
    let stopArrive: (() => void) | null = null;

    // ---- the caption: Urchi's name over one of his lines, a state, or what's new
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

    // One slot: a timed caption (what's new, the phone's one rise) holds it for its
    // dwell; then it goes back to the hover caption if the pointer rests on Urchi, or sinks.
    let slot: Slot | null = null;
    let slotTimer: gsap.core.Tween | null = null;
    /** The pointer on Urchi (overUrchi, above) has rested there HOVER_REST: the hover caption is up, or waits for a timed one. */
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
      cursor.set(on ? urchiWord() : null);
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
      // Asleep for the night, the head settles onto its pillow as the lids close (already there
      // when it is found asleep), and rises as it wakes. Afloat, it dozes where it floats.
      room.settleUrchi(att.mood === "asleep", arriving);
      labelUrchi();
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

    // ---- its life in the room, once its eyes are its own
    let begun = -1;
    let newsAt = Infinity;
    const news = newsTold() ? null : whatsNew();
    let listenGlance = Infinity;
    /** When a rhythm or its answer last had its attention (attention seconds). */
    let callHeard = -Infinity;
    const begin = (afterIntro: boolean) => {
      if (begun >= 0) return;
      arriving = !afterIntro;
      att.start({ afterIntro });
      arriving = false;
      motes.start();
      begun = att.t;
      labelUrchi();
      newsAt = att.t + (afterIntro ? NEWS.afterIntro : NEWS.after);
      // Back from another tab: it is still watching the pill of the tab you left.
      const left = leftRoute();
      if (!afterIntro && left && left !== "/" && isTab(left)) {
        att.play("comeBack", 6, () => comeBack(att, () => pillAt(left), () => !getFlags().transitioning));
      }
    };
    const stopLife = room.onFrame((dt) => {
      att.update(dt);
      if (begun < 0) return;
      const t = att.t;
      // What's new: once per visit, when you are still, a tug toward that tab, then his line (not
      // while Urchi is on its way somewhere, and so not there to do the tugging).
      if (news && t >= newsAt && att.stillFor >= NEWS.still && !att.asleep && !att.acting && !fl.busy) {
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
      if (call.busy) callHeard = t;
      if (phone && !phoneCaptionShown && t >= begun + PHONE_CAPTION.after && t >= callHeard + PHONE_CAPTION.afterCall && !att.acting && slot === null && !fl.busy) {
        phoneCaptionShown = true;
        showUrchiCaption("auto", PHONE_CAPTION.dwell);
      }
      // While he is listening, it looks up at the "4" now and then.
      if (att.listening && t >= listenGlance) {
        listenGlance = t + rand(...LISTEN_GLANCE.every);
        att.play("listenGlance", 1, () => glanceAt(att, () => pillAt("/music")));
      }
    });

    // Is he playing something? The same poll Music uses; a track 15 minutes in is stale, and a
    // replay (Holocene eleven times) is a new play, not the old one gone stale.
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
      const at = Date.now();
      let on = false;
      const key = now && `${now.artist}\u0000${now.title}`;
      if (now && key) {
        const seen = tracksSeen.get(key);
        const first = seen && at - seen.last < FORGET_MS ? seen.first : at;
        tracksSeen.set(key, { first, last: at });
        // how far in: the server's word when it has one, else how long this session has seen it
        const inSong = typeof now.elapsed === "number" ? now.elapsed * 1000 : at - first;
        on = inSong < STALE_MS;
      }
      for (const [k, s] of tracksSeen) if (k !== key && at - s.last >= FORGET_MS) tracksSeen.delete(k);
      lastNow = { track: on ? now : null, at };
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
      // Real timers, not gsap's: its clock can jump ahead after a long first frame.
      let arriveTimer = 0;
      const arrive = () => {
        if (arrived) return;
        arrived = true;
        window.clearTimeout(arriveTimer);
        // Taken with you: not at home, but floating in from the left once its suit is here.
        if (along) fl.restore();
        room.showUrchi(0.6);
        begin(false);
      };
      if (known !== null || clock().hours !== "night") arrive();
      else {
        onHeard = arrive;
        arriveTimer = window.setTimeout(arrive, NIGHT_WAIT);
      }
      setFlag("loadingComplete", true);
      setFlag("exploded", true);
      setFlag("pageReady", true);
      stopArrive = () => window.clearTimeout(arriveTimer);
    }

    // ---- caught in the act: back on the tab after a while away, it was doing something else
    let hiddenAt = -1;
    /**
     * What it is caught doing: facing into a top corner, staring up at the "2", or halfway through
     * a stretch. Under reduced motion the head stays still and only the pupils can show it, which
     * they do for a corner and hardly at all for the pill just above the head, so it is the corner.
     */
    const pose = (): Caught => {
      const r = reducedMotion ? 0 : Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      if (r < 0.4 || (r < 0.7 && !pillAt("/projects"))) return { kind: "corner", side, at: { x: (0.5 + side * 0.48) * window.innerWidth, y: 0.03 * window.innerHeight } };
      if (r < 0.7) return { kind: "pill", at: () => pillAt("/projects") };
      return { kind: "stretch", side };
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        call.stop();
        return;
      }
      const now = Date.now();
      const away = hiddenAt < 0 ? 0 : now - hiddenAt;
      hiddenAt = -1;
      if (away < CAUGHT.away || now - caughtAt < CAUGHT.every) return;
      // Never while it sleeps or dozes, in the intro, mid-rhythm or mid-slide, nor away from home.
      if (begun < 0 || att.asleep || call.busy || getFlags().transitioning || fl.state !== "home") return;
      // Played now, before the page's first frame back, so that frame already shows it.
      if (att.play("caught", 6, () => caught(att, pose(), { rise: (on, seconds) => room.riseUrchi(on, seconds) }))) caughtAt = now;
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---- pointer: hover and click on Urchi (at home it takes it with you; afloat a press holds
    // it, and letting go flings it); a tap on the empty room lets a mote go, and a rhythm of them
    // gets an answer. The whole panel listens, the control over Urchi included, so what a press
    // does is decided by where Urchi is drawn, not by the control's box.
    let down = { x: 0, y: 0, t: 0, id: -1, held: false, woke: false };
    /** Reduced motion: the last click or tap on Urchi afloat, for a second one (see TWICE). */
    let lastTap = { t: -Infinity, x: 0, y: 0 };
    // Afloat, Urchi drifts under a pointer that is not moving (and out from under it): every few
    // frames the place the pointer rests is asked again, so its word comes and goes with it.
    let frames = 0;
    const stopDrifting = room.onFrame(() => {
      if (!resting || down.held || !fl.afloat || ++frames % 4) return;
      const on = room.urchiHit(resting.x, resting.y);
      if (on === overUrchi) return;
      setOverUrchi(on);
      labelUrchi();
    });
    // Quick taps must stay taps: no double-tap zoom on a phone (a pinch still zooms).
    stageEl.style.touchAction = "manipulation";
    const onMove = (e: PointerEvent) => {
      if (down.held && e.pointerId === down.id) {
        fl.drag(e.clientX, e.clientY, eventTime(e));
        return;
      }
      resting = e.pointerType === "touch" ? null : { x: e.clientX, y: e.clientY };
      setOverUrchi(room.urchiHit(e.clientX, e.clientY));
      labelUrchi();
    };
    const onLeave = () => {
      resting = null;
      if (down.held) return;
      setOverUrchi(false);
      labelUrchi();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      down = { x: e.clientX, y: e.clientY, t: eventTime(e), id: e.pointerId, held: false, woke: false };
      // Afloat, a press on it holds it (asleep, the press only wakes it, as a click at home does).
      if (fl.afloat && room.urchiHit(e.clientX, e.clientY)) {
        call.abort();
        if (att.wake()) {
          down.woke = true;
          return;
        }
        if (fl.grab(e.clientX, e.clientY, down.t)) {
          down.held = true;
          try {
            (e.target as Element).setPointerCapture(e.pointerId); // held off the panel's edge, it is still held
          } catch {
            /* a pointer already gone */
          }
          labelUrchi();
        }
        return;
      }
      call.press(down.t);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== down.id) return;
      const t = eventTime(e), click = Math.hypot(e.clientX - down.x, e.clientY - down.y) <= CLICK.slop && t - down.t <= CLICK.ms;
      if (down.held) {
        down.held = false;
        fl.release(t);
        labelUrchi();
        // Reduced motion has no fling to throw it home with: two clicks or taps on it send it.
        if (reducedMotion && click) {
          if (t - lastTap.t < TWICE.ms && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < TWICE.px) {
            lastTap = { t: -Infinity, x: 0, y: 0 };
            fl.sendHome();
          } else lastTap = { t, x: e.clientX, y: e.clientY };
        }
        return;
      }
      if (down.woke) return;
      if (!click) {
        call.abort();
        return;
      }
      if (room.urchiHit(e.clientX, e.clientY)) {
        call.abort();
        // Asleep, the first click wakes it; awake at home, it is taken with you.
        if (att.wake()) return;
        if (fl.state === "home" && begun >= 0) fl.take();
      } else if (room.interactive) {
        if (begun >= 0) call.tap(e.clientX, e.clientY, down.t);
        else motes.release(e.clientX, e.clientY);
      }
    };
    /** The system took the pointer (a gesture of its own): a hold simply ends, and any rhythm with it. */
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== down.id) return;
      if (down.held) fl.release(eventTime(e), false);
      down.held = false;
      call.abort();
      labelUrchi();
    };

    // ---- the control over Urchi: the keyboard's way to do what a click does (Enter or Space);
    // afloat, the arrow keys nudge it. A pointer's own click on it was handled above.
    const onControl = (e: MouseEvent) => {
      if (e.detail !== 0 || fl.busy || begun < 0 || !room.interactive) return;
      call.abort();
      if (att.wake()) return;
      if (fl.afloat) fl.sendHome();
      else fl.take();
    };
    const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const onControlKey = (e: KeyboardEvent) => {
      const d = ARROWS[e.key];
      if (!d || !fl.afloat) return;
      e.preventDefault();
      fl.nudge(d[0], d[1]);
    };
    /** Where the control was last put (panel px, turn), so it is only moved when Urchi has. */
    let placed = "";
    // It covers Urchi as it is drawn: the head's box at home, or afloat the figure's, turned with it.
    const stopControl = room.afterUrchi(() => {
      const b = fl.box() ?? { ...room.homeBox, angle: 0 };
      const left = room.width / 2 + b.x - b.w / 2, top = room.height / 2 - b.y - b.h / 2;
      const key = `${left.toFixed(1)} ${top.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)} ${b.angle.toFixed(3)}`;
      if (key === placed) return;
      placed = key;
      controlEl.style.width = `${b.w}px`;
      controlEl.style.height = `${b.h}px`;
      controlEl.style.transform = `translate(${left}px, ${top}px) rotate(${-b.angle}rad)`;
    });
    const onResize = () => {
      room.resize();
      fl.resize();
    };

    panelEl.addEventListener("pointermove", onMove);
    panelEl.addEventListener("pointerleave", onLeave);
    panelEl.addEventListener("pointerdown", onDown);
    panelEl.addEventListener("pointerup", onUp);
    panelEl.addEventListener("pointercancel", onCancel);
    controlEl.addEventListener("click", onControl);
    controlEl.addEventListener("keydown", onControlKey);
    window.addEventListener("resize", onResize);

    return () => {
      stopIntro?.();
      stopArrive?.();
      slotTimer?.kill();
      restTimer?.kill();
      stopPoll();
      stopLife();
      stopDrifting();
      stopControl();
      panelEl.removeEventListener("pointermove", onMove);
      panelEl.removeEventListener("pointerleave", onLeave);
      panelEl.removeEventListener("pointerdown", onDown);
      panelEl.removeEventListener("pointerup", onUp);
      panelEl.removeEventListener("pointercancel", onCancel);
      controlEl.removeEventListener("click", onControl);
      controlEl.removeEventListener("keydown", onControlKey);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cursor.destroy();
      call.dispose();
      motes.dispose();
      fl.dispose();
      att.dispose();
      room.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={panel} className="space-panel">
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

        {/* Urchi's caption: its name over one of his lines, a state, or what's new. */}
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

      {/* Urchi's own control, over it wherever it is: beside the stage, so the keyboard and a screen reader reach it. */}
      <button ref={control} type="button" className="space-urchi" aria-label="Take Urchi with you" aria-disabled="true" />

      {/* Beside the stage rather than inside it, so it is not aria-hidden: what's new, and Urchi going out and coming home, are read out here. */}
      <p ref={live} className="sr-only" aria-live="polite" />
    </div>
  );
}
