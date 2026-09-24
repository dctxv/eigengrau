import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { setFlag } from "@/lib/flags";
import { DUR } from "@/lib/motion";
import type { CloudScene } from "./CloudScene";

export type IntroRefs = {
  words: HTMLElement[];
  letters: HTMLElement[];
  counterInner: HTMLElement;
};

/**
 * The first-load intro (spec 5). Two halves: A runs from navigation start
 * (words, monogram, counter). B runs once every texture is on the GPU and A
 * has had its minimum time: 100, ring, words out, explode, then the chrome.
 */
export function runIntro(refs: IntroRefs, cloud: CloudScene): () => void {
  const { words, letters, counterInner } = refs;
  const MIN_A = 1.2;
  let progress = 0;
  let allReady = false;
  let shown = 1;
  let counterDone = false;
  let counting = false;
  let killed = false;
  let eyes: gsap.core.Tween | null = null;

  gsap.set([...words, ...letters], { yPercent: 100, opacity: 0 });
  gsap.set(counterInner, { yPercent: 100 });

  // Counter (spec 5.3): eases toward the real progress, never jumps, never goes back.
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

  function maybeStartB() {
    if (killed || bStarted || !counterDone || !(aDone || tlA.time() >= MIN_A)) return;
    bStarted = true;
    const tlB = gsap.timeline();
    tlB
      .add(() => cloud.startRing(), 0)
      .to({}, { duration: 0.45 }, 0)
      .to(counterInner, { yPercent: -100, duration: 0.3, ease: "power3.inOut" }, 0.45)
      .to(words, { yPercent: -100, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.065 }, 2.1)
      .add(() => {
        cloud.explode().then(() => {
          if (killed) return;
          setFlag("exploded", true);
          setFlag("pageReady", true);
          // The chrome drops on this flag (Shell); the eyes open once it has landed.
          eyes = gsap.delayedCall(DUR.drop + 0.3, () => {
            if (!killed) cloud.resident.openEyes(0.35);
          });
        });
      }, 2.75)
      .to(letters, { opacity: 0, duration: 0.4, ease: "power2.out" }, 2.75)
      // The monogram hands over: the resident scales in at the centre, eyes closed.
      .add(() => cloud.startResident(), 2.95);
  }

  cloud
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
    eyes?.kill();
    gsap.ticker.remove(counterTick);
    tlA.kill();
  };
}
