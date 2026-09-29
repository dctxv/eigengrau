"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { getFlags, onFlags, setFlag } from "@/lib/flags";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import { isTab, tabIndex } from "@/lib/routes";
import { installViewportVars } from "@/lib/viewport";
import { noteVisit } from "@/lib/visits";
import { arrive, setShown } from "@/lib/where";
import { Between, type BetweenHandle } from "./chrome/Between";
import { FloatingLogo, measureLogoSlot } from "./chrome/FloatingLogo";
import { LiveIcon } from "./chrome/LiveIcon";
import { Nav } from "./chrome/Nav";
import { SoundChip } from "./chrome/SoundChip";

const CreativeSpacePanel = dynamic(() => import("./pages/CreativeSpacePanel").then((m) => m.CreativeSpacePanel), { ssr: false });
const ProjectsPanel = dynamic(() => import("./pages/ProjectsPanel").then((m) => m.ProjectsPanel), { ssr: false });
const NotesPanel = dynamic(() => import("./pages/NotesPanel").then((m) => m.NotesPanel), { ssr: false });
const MusicPanel = dynamic(() => import("./pages/MusicPanel").then((m) => m.MusicPanel), { ssr: false });
const AboutPanel = dynamic(() => import("./pages/AboutPanel").then((m) => m.AboutPanel), { ssr: false });

/** A mounted page: a tab's panel is keyed by its path and kept; any other route's gets a key of its own. */
type Panel = { key: string; path: string; intro: boolean };

/** A tab's page. Memoised: a kept panel is not rendered again on every route change. */
const Stage = memo(function Stage({ path, intro }: { path: string; intro: boolean }) {
  if (path === "/") return <CreativeSpacePanel intro={intro} />;
  if (path === "/projects") return <ProjectsPanel />;
  if (path === "/notes") return <NotesPanel />;
  if (path === "/music") return <MusicPanel />;
  if (path === "/about") return <AboutPanel />;
  return null;
});

/**
 * The persistent chrome plus the horizontal page slider (spec 2 and 8).
 * Pages are 100vw panels stacked in one place. Every tab visited stays
 * mounted, hidden (and inert) while it is not on screen, so coming back finds
 * it as it was left rather than starting again: Urchi where it floated, the
 * ball as it was spun, the song still playing. A route change between tabs
 * slides the panel being left out and the one arrived at in, side by side;
 * any other change shows the new page at once. Pages learn which panels are
 * on screen from where.ts (setShown), and pause their frames while hidden.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const keyRef = useRef(0);
  const prevPath = useRef(pathname);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  /** What the next commit does once the panel arrived at is mounted: slide to it, or show it at once. */
  const pendingRef = useRef<{ to: string; slide: { dir: 1 | -1; from: string } | null } | null>(null);
  const betweenRef = useRef<BetweenHandle>(null);
  /** Each panel's element, by path. */
  const els = useRef(new Map<string, HTMLDivElement>());
  /** The paths on screen now. */
  const shownRef = useRef<string[]>([pathname]);
  const [panels, setPanels] = useState<Panel[]>(() => [{ key: isTab(pathname) ? pathname : "page:0", path: pathname, intro: pathname === "/" }]);
  const [chromePlaced, setChromePlaced] = useState(false);

  /** Only these panels on screen; the rest hidden, inert and out of the reading order, where they were left. */
  const show = (paths: string[]) => {
    shownRef.current = paths;
    els.current.forEach((el, path) => {
      const on = paths.includes(path);
      el.style.visibility = on ? "" : "hidden";
      el.inert = !on;
      el.toggleAttribute("aria-hidden", !on);
      if (!on) gsap.set(el, { x: 0 });
    });
    setShown(paths.filter(isTab));
  };

  // Viewport units and the reduced-motion intro skip.
  useEffect(() => installViewportVars(), []);

  // Chrome drop-in: after the first breath on an intro load, otherwise as soon as the fonts are in.
  useEffect(() => {
    const nav = navRef.current;
    const logo = logoRef.current;
    if (!nav || !logo) return;
    let shown = false;
    const show = (animate: boolean) => {
      if (shown) return;
      shown = true;
      const slot = measureLogoSlot();
      gsap.set(nav, { visibility: "visible" });
      gsap.set(logo, { visibility: "visible", x: slot.left });
      if (animate) {
        gsap.fromTo(nav, { yPercent: -250 }, { yPercent: 0, duration: DUR.drop, ease: EASE.drop });
        gsap.fromTo(logo, { y: -57 }, { y: slot.top, duration: DUR.drop, ease: EASE.drop, onComplete: () => setChromePlaced(true) });
      } else {
        gsap.set(nav, { yPercent: 0 });
        gsap.set(logo, { y: slot.top });
        setChromePlaced(true);
      }
    };
    const intro = panels[0]?.intro && !prefersReducedMotion();
    if (!intro) {
      const fonts = document.fonts?.ready ?? Promise.resolve();
      let alive = true;
      fonts.then(() => alive && show(!prefersReducedMotion()));
      return () => {
        alive = false;
      };
    }
    if (getFlags().exploded) show(true);
    return onFlags((f) => {
      if (f.exploded) show(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route change: decide whether to slide.
  useLayoutEffect(() => {
    noteVisit(pathname); // on mount too: the visit's clock, and which tab was just left (Space looks back at it)
    const prev = prevPath.current;
    if (prev === pathname) {
      arrive(pathname, null);
      return;
    }
    prevPath.current = pathname;
    setFlag("cameFromInAppNav", true);
    const canSlide = isTab(prev) && isTab(pathname) && els.current.has(prev) && !prefersReducedMotion() && !tweenRef.current;
    // The tabs stay; a page on any other route goes when it is left, and a new one is made for it.
    setPanels((ps) => {
      const kept = ps.filter((p) => isTab(p.path) || p.path === pathname);
      return kept.some((p) => p.path === pathname) ? kept : [...kept, { key: isTab(pathname) ? pathname : `page:${++keyRef.current}`, path: pathname, intro: false }];
    });
    if (!canSlide) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      betweenRef.current?.end();
      setFlag("transitioning", false);
      arrive(pathname, prev);
      pendingRef.current = { to: pathname, slide: null };
      return;
    }
    const dir: 1 | -1 = tabIndex(pathname) > tabIndex(prev) ? 1 : -1;
    pendingRef.current = { to: pathname, slide: { dir, from: prev } };
    arrive(pathname, prev, DUR.slideDelay * 1000, DUR.slide * 1000);
  }, [pathname]);

  // The panel arrived at is mounted: show it at once, or slide it in beside the one being left.
  useLayoutEffect(() => {
    const p = pendingRef.current;
    const toEl = p && els.current.get(p.to);
    if (!p || !toEl) {
      // A panel mounted with nothing pending (the first) takes its place as the rest do.
      show(shownRef.current);
      return;
    }
    pendingRef.current = null;
    const fromEl = p.slide && els.current.get(p.slide.from);
    if (!p.slide || !fromEl) {
      els.current.forEach((el) => gsap.set(el, { x: 0 }));
      show([p.to]);
      return;
    }
    const { dir, from } = p.slide;
    const w = window.innerWidth;
    show([from, p.to]);
    gsap.set(fromEl, { x: 0 });
    gsap.set(toEl, { x: dir * w });
    setFlag("transitioning", true);
    betweenRef.current?.begin(tabIndex(from), tabIndex(p.to), w);
    const at = { k: 0 };
    tweenRef.current = gsap.to(at, {
      k: 1,
      duration: DUR.slide,
      ease: EASE.slide,
      delay: DUR.slideDelay,
      onUpdate: () => {
        gsap.set(fromEl, { x: -dir * w * at.k });
        gsap.set(toEl, { x: dir * w * (1 - at.k) });
        // The stars between the tabs ride the same frames, told how far the pages have gone.
        betweenRef.current?.step(-dir * w * at.k);
      },
      onComplete: () => {
        tweenRef.current = null;
        betweenRef.current?.end();
        setFlag("transitioning", false);
        gsap.set(toEl, { x: 0 });
        show([p.to]);
      },
    });
  }, [panels]);

  const tabRoute = isTab(pathname);

  return (
    <>
      <Nav ref={navRef} pathname={pathname} />
      <FloatingLogo ref={logoRef} placed={chromePlaced} />
      <SoundChip />
      <LiveIcon />
      <div className="page-viewport">
        <div className="page-row">
          {panels.map((p) => (
            <div
              className="panel"
              key={p.key}
              ref={(el) => {
                if (!el) return;
                els.current.set(p.path, el);
                return () => {
                  if (els.current.get(p.path) === el) els.current.delete(p.path);
                };
              }}
            >
              <div className="body-wrapper">
                {isTab(p.path) ? (
                  <main>
                    {p.path === pathname && tabRoute ? children : null}
                    <Stage path={p.path} intro={p.intro} />
                  </main>
                ) : p.path === pathname ? (
                  children
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <Between ref={betweenRef} />
      </div>
    </>
  );
}
