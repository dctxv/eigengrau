"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";

const subscribe = (cb: () => void) => sfx.onChange(cb);
const getOn = () => sfx.enabled;
const getServerOn = () => false;

/** 28 x 24 glass chip, a 4px dot, and a thin ring that shows when sound is on (spec 4.4). */
export function SoundChip() {
  const on = useSyncExternalStore(subscribe, getOn, getServerOn);
  const ring = useRef<SVGSVGElement>(null);

  useEffect(() => {
    sfx.init();
  }, []);

  const toggle = () => {
    const next = sfx.toggle();
    if (next) sfx.play("tab");
    if (ring.current) {
      gsap.killTweensOf(ring.current);
      gsap.fromTo(
        ring.current,
        { scale: 0.6, opacity: 1, transformOrigin: "50% 50%" },
        { scale: 1.6, opacity: 0, duration: 0.6, ease: "power2.out", onComplete: () => gsap.set(ring.current, { scale: 1, opacity: next ? 1 : 0 }) },
      );
    }
  };

  return (
    <button
      type="button"
      className="sound-chip glass"
      aria-label={on ? "Turn off sound" : "Turn on sound"}
      aria-pressed={on}
      onClick={toggle}
    >
      <span className="sound-dot" aria-hidden="true" />
      <svg ref={ring} className="sound-ring" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5.5" />
      </svg>
    </button>
  );
}
