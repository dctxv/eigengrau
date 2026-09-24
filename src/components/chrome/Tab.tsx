"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import type { TabHref } from "@/content/site";

type Props = { href: TabHref; label: string; n: number; active: boolean; ready: boolean };

/**
 * The pill tab (spec 4.2). The pill's width is driven by the spacer, not by
 * the label: the label is absolutely positioned and slides, the spacer grows
 * and shrinks, and overflow:hidden clips the label while it travels.
 */
export function Tab({ href, label, n, active, ready }: Props) {
  const root = useRef<HTMLAnchorElement>(null);
  const spacer = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (!ready || !root.current || !spacer.current || !text.current) return;
    const apply = (animate: boolean) => {
      const w = text.current!.offsetWidth;
      const to = {
        spacer: { width: active ? w + 3 : 0, marginRight: active ? 3 : 0 },
        root: { paddingLeft: active ? 12 : 7, paddingRight: active ? 12 : 7 },
        text: { left: active ? 12 : -(w + 14) },
      };
      const vars = animate && !prefersReducedMotion()
        ? { duration: DUR.tab, ease: EASE.tab, delay: DUR.tabDelay, overwrite: true as const }
        : { duration: 0, overwrite: true as const };
      gsap.to(spacer.current, { ...to.spacer, ...vars });
      gsap.to(root.current, { ...to.root, ...vars });
      gsap.to(text.current, { ...to.text, ...vars });
    };
    apply(!first.current);
    first.current = false;
    const onResize = () => apply(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, ready]);

  return (
    <Link
      ref={root}
      href={href}
      className="tab glass"
      aria-current={active ? "page" : undefined}
      onClick={() => {
        if (!active) sfx.play("tab");
      }}
    >
      <span ref={spacer} className="tab-spacer" aria-hidden="true" />
      <span ref={text} className="tab-label">
        {label}
      </span>
      <sup className="tab-num">{n}</sup>
    </Link>
  );
}
