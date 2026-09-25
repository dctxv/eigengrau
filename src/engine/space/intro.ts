import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { SPACE_ITEMS } from "@/content/site";
import { setFlag } from "@/lib/flags";
import { IntroRing } from "./IntroRing";
import type { RoomScene } from "./RoomScene";

export type IntroRefs = {
  words: HTMLElement[];
  letters: HTMLElement[];
  counterInner: HTMLElement;
};

/**
 * The second half's beats, in seconds from the ring's start (spec S1). Up to
 * 2.75 it is the old intro; from there to the chrome's drop stays under 2.3s.
 */
const T = {
  /** The ring draws in round the dark centre while the monogram goes. */
  draw: 2.75,
  drawFor: 0.9,
  /** Two shut eyes on eigengrau, and they open. */
  eyes: 3.0,
  eyesIn: 0.2,
  open: 3.22,
  openFor: 0.3,
  /** After half a second of only the eyes, one ordinary blink. */
  blink: 4.0,
  /** The head builds outward from the eyes, breathing in as it does. */
  build: 4.38,
  buildFor: 0.62,
  /** At the top of that breath it breathes out, three times its usual nod, and the work blows away. */
  breath: 5.0,
  exhale: 0.55,
  depth: 3,
  /** The chrome drops, so the "2" lands where the work went. */
  drop: 5.05,
  /** Its first look follows the pieces up, holds on the pill, then comes back to you. */
  lookAfter: 0.25,
  lookFor: 0.55,
  lookHold: 0.8,
} as const;

/** The "2" pill's centre and width in client px. The nav is laid out (only hidden) before it drops, so it can be measured now. */
function workPill(): { x: number; y: number; w: number } | null {
  const pill = document.querySelectorAll<HTMLElement>(".tabs .tab")[1];
  if (!pill) return null;
  const r = pill.getBoundingClientRect();
  return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } : null;
}

/**
 * The first-load intro. Two halves: A runs from navigation start (words,
 * monogram, counter). B runs once the ring's twelve thumbnails are on the GPU
 * and A has had its minimum time: 100, the ring, the words out; then, instead
 * of the old explode, "eyes first" and "first breath": the ring draws in, two
 * eyes open alone inside it and blink, the head builds outward from them, and
 * its first breath out blows the work up toward the "2" pill as the chrome
 * drops.
 */
export function runIntro(refs: IntroRefs, room: RoomScene, onSettled?: () => void): () => void {
  const { words, letters, counterInner } = refs;
  const MIN_A = 1.2;
  const ring = new IntroRing(room, SPACE_ITEMS);
  const urchi = room.urchi.character;
  let progress = 0;
  let allReady = false;
  let shown = 1;
  let counterDone = false;
  let counting = false;
  let killed = false;
  let tlB: gsap.core.Timeline | null = null;
  let firstLook: gsap.core.Timeline | null = null;
  const look = { nx: 0, ny: 0 };

  room.hideUrchi();
  gsap.set([...words, ...letters], { yPercent: 100, opacity: 0 });
  gsap.set(counterInner, { yPercent: 100 });

  // Counter: eases toward the real progress, never jumps, never goes back.
  const counterTick = () => {
    if (!counting || counterDone) return;
    const target = allReady ? 100 : Math.min(99, Math.floor(progress * 99));
    shown += (target - shown) * 0.18;
    if (allReady && shown > 99.5) {
      shown = 100;
      counterDone = true;
      counterInner.textContent = "100";
      sfx.play("done", 0.5);
      maybeStartB();
      return;
    }
    counterInner.textContent = String(Math.max(1, Math.round(shown))).padStart(3, "0");
  };
  gsap.ticker.add(counterTick);

  const tlA = gsap.timeline();
  tlA
    .to(counterInner, { yPercent: 0, duration: 0.12, ease: "power2.out" }, 0)
    .to(words, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.065 }, 0)
    .to(letters, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.05 }, 0.02)
    .add(() => {
      counting = true;
    }, 0.37)
    .add(() => maybeStartB(), MIN_A);

  let aDone = false;
  let bStarted = false;
  tlA.eventCallback("onComplete", () => {
    aDone = true;
    maybeStartB();
  });

  /** The first breath: the work goes up and out toward the "2", and Urchi's first look goes with it. */
  const blow = () => {
    const pill = workPill();
    const to = pill ? room.toRoom(pill.x, pill.y) : { x: 0, y: room.height / 2 };
    void ring.blow({ ...to, w: pill?.w ?? 0 });
    const nx = pill ? (pill.x / window.innerWidth) * 2 - 1 : 0;
    const ny = pill ? (pill.y / window.innerHeight) * 2 - 1 : -1;
    const follow = () => urchi.lookAt(look.nx, look.ny);
    firstLook = gsap
      .timeline({
        delay: T.lookAfter,
        onComplete: () => {
          urchi.lookAt(null);
          onSettled?.(); // its eyes are its own from here
        },
      })
      .to(look, { nx, ny, duration: T.lookFor, ease: "sine.inOut", onUpdate: follow })
      .to({}, { duration: T.lookHold });
  };

  function maybeStartB() {
    if (killed || bStarted || !counterDone || !(aDone || tlA.time() >= MIN_A)) return;
    bStarted = true;
    const reveal = { r: 0 };
    tlB = gsap.timeline();
    tlB
      .add(() => ring.start(), 0)
      .to({}, { duration: 0.45 }, 0)
      .to(counterInner, { yPercent: -100, duration: 0.3, ease: "power3.inOut" }, 0.45)
      .to(words, { yPercent: -100, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.065 }, 2.1)
      // Eyes first.
      .add(() => ring.drawIn(room.eyes(), room.pixel, T.drawFor), T.draw)
      .to(letters, { opacity: 0, duration: 0.4, ease: "power2.out" }, T.draw)
      .add(() => room.urchi.fade(1, T.eyesIn, 0, 0), T.eyes)
      .add(() => room.urchi.openEyes(T.openFor), T.open)
      .add(() => urchi.blink(), T.blink)
      // The head, from the eyes out, on an in-breath.
      .add(() => urchi.deepBreath(T.breath - T.build, T.exhale, T.depth), T.build)
      .to(reveal, { r: 1, duration: T.buildFor, ease: "sine.in", onUpdate: () => urchi.setReveal(reveal.r) }, T.build)
      // First breath.
      .add(blow, T.breath)
      .add(() => {
        room.interactive = true;
        setFlag("exploded", true);
        setFlag("pageReady", true);
      }, T.drop);
  }

  ring
    .load((p) => {
      progress = Math.max(progress, p);
    })
    .then(() => {
      if (killed) return;
      allReady = true;
      setFlag("loadingComplete", true);
      setFlag("preloadProgress", 1);
    })
    .catch(() => {
      allReady = true;
    });

  // Never strand the visitor if an asset hangs.
  const safety = window.setTimeout(() => {
    allReady = true;
  }, 12000);

  return () => {
    killed = true;
    window.clearTimeout(safety);
    gsap.ticker.remove(counterTick);
    tlA.kill();
    tlB?.kill();
    firstLook?.kill();
    ring.dispose();
  };
}
