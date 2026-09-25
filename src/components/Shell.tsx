"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { sfx } from "@/audio/sfx";
import { getFlags, onFlags, setFlag } from "@/lib/flags";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import { isTab, tabIndex } from "@/lib/routes";
import { installViewportVars } from "@/lib/viewport";
import { noteVisit } from "@/lib/visits";
import { FloatingLogo, measureLogoSlot } from "./chrome/FloatingLogo";
import { Nav } from "./chrome/Nav";
import { SoundChip } from "./chrome/SoundChip";

const CreativeSpacePanel = dynamic(() => import("./pages/CreativeSpacePanel").then((m) => m.CreativeSpacePanel), { ssr: false });
const ProjectsPanel = dynamic(() => import("./pages/ProjectsPanel").then((m) => m.ProjectsPanel), { ssr: false });
const NotesPanel = dynamic(() => import("./pages/NotesPanel").then((m) => m.NotesPanel), { ssr: false });
const MusicPanel = dynamic(() => import("./pages/MusicPanel").then((m) => m.MusicPanel), { ssr: false });
const AboutPanel = dynamic(() => import("./pages/AboutPanel").then((m) => m.AboutPanel), { ssr: false });

type Panel = { key: number; path: string; intro: boolean };

function Stage({ path, intro }: { path: string; intro: boolean }) {
  if (path === "/") return <CreativeSpacePanel intro={intro} />;
  if (path === "/projects") return <ProjectsPanel />;
  if (path === "/notes") return <NotesPanel />;
  if (path === "/music") return <MusicPanel />;
  if (path === "/about") return <AboutPanel />;
  return null;
}

/**
 * The persistent chrome plus the horizontal page slider (spec 2 and 8).
 * Pages are 100vw panels in a flex row; a route change mounts the new panel
 * next to the current one, slides the row, then drops the old panel and
 * resets the row in the same frame.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef(0);
  const prevPath = useRef(pathname);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const pendingRef = useRef<{ dir: 1 | -1; next: Panel } | null>(null);
  const [panels, setPanels] = useState<Panel[]>(() => [{ key: 0, path: pathname, intro: pathname === "/" }]);
  const [chromePlaced, setChromePlaced] = useState(false);

  // Viewport units and the reduced-motion intro skip.
  useEffect(() => installViewportVars(), []);

  // Chrome drop-in: after the explode on an intro load, otherwise as soon as the fonts are in.
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
    if (prev === pathname) return;
    prevPath.current = pathname;
    setFlag("cameFromInAppNav", true);
    const current = panels.find((p) => p.path === prev) ?? panels[0];
    const next: Panel = { key: ++keyRef.current, path: pathname, intro: false };
    const canSlide = isTab(prev) && isTab(pathname) && !prefersReducedMotion() && !tweenRef.current;
    if (!canSlide) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      pendingRef.current = null;
      if (rowRef.current) gsap.set(rowRef.current, { x: 0 });
      setPanels([next]);
      return;
    }
    const dir: 1 | -1 = tabIndex(pathname) > tabIndex(prev) ? 1 : -1;
    pendingRef.current = { dir, next };
    setPanels(dir > 0 ? [current, next] : [next, current]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Both panels are mounted: slide the row.
  useLayoutEffect(() => {
    const p = pendingRef.current;
    const row = rowRef.current;
    if (!p || !row || panels.length !== 2) return;
    pendingRef.current = null;
    const w = window.innerWidth;
    const from = p.dir > 0 ? 0 : -w;
    const to = p.dir > 0 ? -w : 0;
    setFlag("transitioning", true);
    tweenRef.current = gsap.fromTo(row, { x: from }, {
      x: to,
      duration: DUR.slide,
      ease: EASE.slide,
      delay: DUR.slideDelay,
      onStart: () => sfx.play("slide"),
      onComplete: () => {
        tweenRef.current = null;
        setFlag("transitioning", false);
        // Drop the old panel and reset the row in one synchronous commit: no visible jump.
        flushSync(() => setPanels([p.next]));
        gsap.set(row, { x: 0 });
      },
    });
  }, [panels]);

  const tabRoute = isTab(pathname);

  return (
    <>
      <Nav ref={navRef} pathname={pathname} />
      <FloatingLogo ref={logoRef} placed={chromePlaced} />
      <SoundChip />
      <div className="page-viewport">
        <div className="page-row" ref={rowRef}>
          {panels.map((p) => (
            <div className="panel" key={p.key}>
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
      </div>
    </>
  );
}
