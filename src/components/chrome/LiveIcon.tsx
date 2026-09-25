"use client";

import { useEffect } from "react";
import type * as Character from "@/engine/urchi/character";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The favicon's Urchi: 32 px, rim and all. The head never turns here, so the cell fits the head
 * itself (about 28 px across) rather than the tilting frame the page's Urchi needs.
 */
const ICON = { size: 32, cell: 38 } as const;
/** The character's own cadence (BLINK in character.ts): a blink every 2.5-6s, shut about a quarter second, now and then twice. */
const BLINK = { gap: [2.5, 6], shut: 0.24, again: 0.18, twice: 0.12 } as const;
/** One step of the lid curve: the icon moves at about 8 frames a second. */
const STEP = 0.125;
/**
 * Hidden this long, it falls asleep. While asleep it peeks at the tab every two or three minutes,
 * but only for the first few: after that the browser throttles hidden tabs hard, and it sleeps too.
 */
const SLEEP = { after: 20, check: [120, 180], peek: 1.4, checksFor: 290 } as const;
/**
 * Finding the closed lids (see lidLine): painted `fine` times finer, a pixel is lid where at least
 * `least` of its fine pixels are, and the head's planes are about `plane` grey (#040404-#1C1C1C).
 */
const LID = { fine: 8, least: 8, plane: 12 } as const;
/** Seconds after the page's load event. */
const START_AFTER_LOAD = 1.2;

type Frames = { shut: string; open: string; /** the lid curve, most shut first */ lids: string[] };

/**
 * Urchi in the browser's tab strip, in this visit's colourway (mounted once, in Shell). It blinks
 * while the page is visible and sleeps once you have been on another tab for a while; coming back
 * opens its eyes. Timers, not the gsap ticker, which stops in hidden tabs, and the icon is only
 * written when it changes. The page title never changes. Browsers that ignore a changing icon
 * keep the static one (src/app/icon.svg), which is also what shows until this starts.
 */
export function LiveIcon() {
  useEffect(() => startLiveIcon(), []);
  return null;
}

/**
 * It starts a beat after the page has loaded, so the tab strip never holds up the first paint, and
 * so the framework has hydrated its own icon link first: one changed before then is not recognised,
 * and a second link joins it (which is still taken over, but is untidy).
 */
function startLiveIcon(): () => void {
  let alive = true;
  let stop: (() => void) | null = null;
  let wait = 0;
  const begin = () => {
    wait = window.setTimeout(() => {
      import("@/engine/urchi/character").then((m) => {
        if (alive) stop = run(paintFrames(m));
      });
    }, START_AFTER_LOAD * 1000);
  };
  if (document.readyState === "complete") begin();
  else window.addEventListener("load", begin, { once: true });
  return () => {
    alive = false;
    window.removeEventListener("load", begin);
    clearTimeout(wait);
    stop?.();
  };
}

/**
 * Every frame the icon needs, painted once. A fresh character holds one still pose for its first
 * half second (its first tilt, dart and blink all come later), so a few milliseconds of its time
 * are enough to paint its eyes shut, the lid curve opening, and open, on the same head.
 */
function paintFrames({ createUrchi, drawnColourway, URCHI_FRAME, URCHI_HEAD }: typeof Character): Frames {
  const urchi = createUrchi({ cell: ICON.cell, input: false });
  const icon = document.createElement("canvas");
  icon.width = icon.height = ICON.size;
  const ctx = icon.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  // The head's middle lands on the icon's middle, on whole pixels, so each canvas pixel is one icon pixel.
  const dx = Math.round(ICON.size / 2 + URCHI_FRAME.x / ICON.cell);
  const dy = Math.round(ICON.size / 2 - ((URCHI_HEAD.top + URCHI_HEAD.bottom) / 2 - URCHI_FRAME.y) / ICON.cell);
  const draw = () => {
    ctx.clearRect(0, 0, ICON.size, ICON.size);
    ctx.drawImage(urchi.canvas, dx, dy);
  };
  const paint = () => {
    draw();
    return icon.toDataURL("image/png");
  };
  const MS = 0.001;
  urchi.closeEyes();
  urchi.update(MS);
  draw();
  // The shut eyes are the sleeping icon, so they must read as eyes: the lids go over in full colour.
  const iris = drawnColourway()?.iris;
  if (iris) {
    ctx.fillStyle = iris;
    for (const [x, y] of lidLine(createUrchi, iris, MS)) ctx.fillRect(dx + x, dy + y, 1, 1);
  }
  const shut = icon.toDataURL("image/png");
  urchi.openEyes(4 * MS);
  const lids: string[] = [];
  for (let i = 0; i < 4; i++) {
    urchi.update(MS);
    lids.push(paint());
  }
  urchi.dispose();
  const open = lids.pop()!;
  return { shut, open, lids };
}

/**
 * The closed lids, pixel by pixel. At the icon's cell the lid arc is thinner than a pixel and
 * smudges into the head, most of all with a dark iris, so the same shut pose is painted LID.fine
 * times finer to find where it falls: in each column of the icon's canvas the arc crosses, the
 * pixel it covers most is lid. A one-pixel line, which keeps the arc's sag where it has one.
 */
function lidLine(createUrchi: typeof Character.createUrchi, iris: string, dt: number): [number, number][] {
  const fine = createUrchi({ cell: ICON.cell / LID.fine, input: false });
  fine.closeEyes();
  fine.update(dt);
  const { width: W, height: H } = fine.canvas;
  const px = fine.canvas.getContext("2d")!.getImageData(0, 0, W, H).data;
  fine.dispose();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(iris.slice(i, i + 2), 16));
  // Lid is nearer the iris than halfway to the head's dark planes. The white rim, as white as some
  // irises, is never lid: every pixel of it is within two of the transparent outside.
  const near = ((r - LID.plane) ** 2 + (g - LID.plane) ** 2 + (b - LID.plane) ** 2) / 4;
  const inside = (x: number, y: number) => {
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const u = x + i, v = y + j;
      if (u < 0 || v < 0 || u >= W || v >= H || !px[(v * W + u) * 4 + 3]) return false;
    }
    return true;
  };
  const cols = Math.ceil(W / LID.fine), rows = Math.ceil(H / LID.fine);
  const cover = new Uint16Array(cols * rows);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4;
    if (!px[k + 3] || (px[k] - r) ** 2 + (px[k + 1] - g) ** 2 + (px[k + 2] - b) ** 2 > near || !inside(x, y)) continue;
    cover[Math.floor(y / LID.fine) * cols + Math.floor(x / LID.fine)]++;
  }
  const line: [number, number][] = [];
  for (let x = 0; x < cols; x++) {
    let best = -1, most = LID.least - 1;
    for (let y = 0; y < rows; y++) {
      if (cover[y * cols + x] <= most) continue;
      most = cover[y * cols + x];
      best = y;
    }
    if (best >= 0) line.push([x, best]);
  }
  return line;
}

/** Runs the icon: blinks while visible, sleeps while hidden. Returns the stop, which puts the static icon back. */
function run(frames: Frames): () => void {
  const reduced = prefersReducedMotion();
  const timers = new Set<number>();
  const later = (seconds: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, seconds * 1000);
    timers.add(id);
  };
  const cancel = () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  };
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const icon = takeOverIcon();
  let asleep = false;
  let hiddenAt = 0;

  /** Frames one step apart, then `done`. */
  const play = (seq: string[], done?: () => void) => {
    const [first, ...rest] = seq;
    icon.show(first);
    if (rest.length) later(STEP, () => play(rest, done));
    else done?.();
  };

  const scheduleBlink = () => {
    if (!reduced) later(rand(...BLINK.gap), () => blink(false));
  };
  const blink = (second: boolean) => {
    icon.show(frames.shut);
    // At this frame rate the opening fits in one step: three-quarters open, then open.
    later(BLINK.shut, () =>
      play([frames.lids[1], frames.open], () => {
        if (!second && Math.random() < BLINK.again) later(BLINK.twice, () => blink(true));
        else scheduleBlink();
      }),
    );
  };

  const fallAsleep = () => {
    asleep = true;
    icon.show(frames.shut);
    if (!reduced) schedulePeek();
  };
  // It opens its eyes a slit, as if checking the tab is still there, and goes back to sleep.
  const schedulePeek = () => {
    const wait = rand(...SLEEP.check);
    if ((performance.now() - hiddenAt) / 1000 + wait > SLEEP.checksFor) return;
    later(wait, () => {
      icon.show(frames.lids[0]);
      later(SLEEP.peek, () => {
        icon.show(frames.shut);
        schedulePeek();
      });
    });
  };

  const onVisibility = () => {
    cancel();
    if (document.hidden) {
      hiddenAt = performance.now();
      if (!asleep) {
        icon.show(frames.open); // never left mid-blink
        later(SLEEP.after, fallAsleep);
      }
      return;
    }
    if (asleep) {
      // Back again: the eyes open along the lid curve.
      asleep = false;
      play(reduced ? [frames.open] : [frames.shut, ...frames.lids, frames.open], scheduleBlink);
      return;
    }
    icon.show(frames.open);
    scheduleBlink();
  };

  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    cancel();
    icon.restore();
  };
}

/**
 * The page's icon links, taken over while the live icon runs; each keeps its static attributes to
 * put back. A navigation re-renders the head's metadata: the link it adds is taken over too, and in
 * the moment between the old link leaving and the new one arriving, a link of its own holds the icon.
 */
function takeOverIcon() {
  type Attrs = { href: string | null; type: string | null; sizes: string | null };
  let current = "";
  const taken = new Map<HTMLLinkElement, Attrs>();
  let own: HTMLLinkElement | null = null;
  const put = (l: HTMLLinkElement, a: Attrs) =>
    (["href", "type", "sizes"] as const).forEach((k) => {
      const v = a[k];
      if (v === null) l.removeAttribute(k);
      else l.setAttribute(k, v);
    });
  const apply = () => {
    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')).filter((l) => l !== own);
    taken.forEach((_, l) => {
      if (!l.isConnected) taken.delete(l);
    });
    if (links.length) {
      own?.remove();
      own = null;
    } else {
      if (!own) {
        own = document.createElement("link");
        own.rel = "icon";
        document.head.appendChild(own);
      }
      links.push(own);
    }
    for (const l of links) {
      if (l.getAttribute("href") === current) continue;
      if (l !== own && !taken.has(l)) taken.set(l, { href: l.getAttribute("href"), type: l.getAttribute("type"), sizes: l.getAttribute("sizes") });
      put(l, { href: current, type: "image/png", sizes: `${ICON.size}x${ICON.size}` });
    }
  };
  const watch = new MutationObserver(() => {
    if (current) apply();
  });
  watch.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "rel"] });
  return {
    show(href: string) {
      if (href === current) return;
      current = href;
      apply();
    },
    restore() {
      watch.disconnect();
      taken.forEach((a, l) => put(l, a));
      taken.clear();
      own?.remove();
    },
  };
}
