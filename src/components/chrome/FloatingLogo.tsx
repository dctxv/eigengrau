"use client";

import Link from "next/link";
import { useLayoutEffect, type Ref } from "react";
import gsap from "gsap";
import { MONOGRAM } from "@/content/site";

export function measureLogoSlot(): { left: number; top: number } {
  const slot = document.querySelector(".logo-slot");
  if (!slot) return { left: 0, top: 8 };
  const r = slot.getBoundingClientRect();
  return { left: r.left, top: r.top };
}

/**
 * The monogram lives outside the nav so its blend mode sits directly over
 * the canvas, and so it can move on its own during the intro (spec 4.3).
 */
export function FloatingLogo({ ref, placed }: { ref: Ref<HTMLAnchorElement>; placed: boolean }) {
  useLayoutEffect(() => {
    if (!placed) return;
    const el = document.querySelector<HTMLAnchorElement>(".floating-logo");
    const place = () => {
      if (!el) return;
      const r = measureLogoSlot();
      gsap.set(el, { x: r.left, y: r.top });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [placed]);

  return (
    <Link ref={ref} href="/" className="floating-logo" aria-label="Home">
      {MONOGRAM}
    </Link>
  );
}
