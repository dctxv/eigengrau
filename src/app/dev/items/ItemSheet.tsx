"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { ITEMS } from "@/content/site";
import { makeRenderer } from "@/engine/common/loader";
import { ITEM_MAKERS, type Item } from "@/engine/items";
import { PIXEL_LEAST, levelCell } from "@/engine/common/pixel";
import { Pixelated } from "@/engine/items/pixels";

/** The close view's size by default, and the size an item must read at (px). */
const BIG = 420;
const SMALL = 96;

const noop = () => () => {};

/** Space's items up close (see page.tsx). */
export function ItemSheet() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [q] = useState(() => (typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search)));
  // (its words wait for the page to be in the browser: the server has no address to read the item from)
  const shown = useSyncExternalStore(noop, () => true, () => false);
  const all = Object.entries(ITEMS).flatMap(([tier, list]) => list.map((i) => ({ ...i, tier })));
  const id = q.get("item") ?? all.find((i) => ITEM_MAKERS[i.id])?.id ?? "";
  const text = all.find((i) => i.id === id);
  const big = Number(q.get("big")) || BIG;

  useEffect(() => {
    const el = canvas.current!, make = ITEM_MAKERS[id];
    if (!make) return;
    const renderer = makeRenderer(el);
    renderer.setScissorTest(true);
    const scene = new THREE.Scene();
    // a long lens, so a chunky item is not distorted: a unit sphere just fills the view
    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
    camera.position.set(0, 0, 1.15 / Math.tan((11 * Math.PI) / 180));
    let item: Item | null = null, alive = true, raf = 0, last = performance.now(), t = Number(q.get("t")) || 0, lastHeld = -1;
    const still = q.has("still") || q.has("t");
    // the cursor, in the item's own frame (see Item.point): over either view, or ?px= &py= fixed
    // (item units); a view spans 1.15 of them either way from its middle
    const fixed = q.has("px") ? { x: Number(q.get("px")), y: Number(q.get("py")) } : null;
    let pointer: { x: number; y: number } | null = null;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      pointer = null;
      for (const [x, size] of [[40, big], [80 + big, SMALL]] as const) {
        const ux = ((cx - x) / size - 0.5) * 2.3, uy = -((cy - 60) / size - 0.5) * 2.3;
        if (Math.abs(ux) <= 1.15 && Math.abs(uy) <= 1.15) pointer = { x: ux, y: uy };
      }
    };
    const leave = () => (pointer = null);
    // pixelated as the item asks (Item.pixel; level 1 if it does not), or at ?pixel= (a level; 0 smooth) to compare
    const pixels = new Pixelated(), forced = q.has("pixel") ? Number(q.get("pixel")) : null;
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    // (held: ?t= is the moment shown, ?still the first)
    make().then((maker) => {
      if (!alive) return;
      item = maker();
      scene.add(item.object);
      item.update(0, t, true);
      el.dataset.ready = "1";
    });
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const w = el.clientWidth, h = el.clientHeight, ratio = Math.min(window.devicePixelRatio || 1, 3);
      if (el.width !== Math.round(w * ratio)) {
        renderer.setPixelRatio(ratio);
        renderer.setSize(w, h, false);
      }
      renderer.setScissor(0, 0, w, h);
      renderer.setViewport(0, 0, w, h);
      renderer.clear();
      if (!item) return;
      if (!still) t += dt;
      // (a script filming it sets window.__t, seconds, a frame at a time, and window.__point for the cursor)
      const script = window as unknown as { __t?: number; __point?: { x: number; y: number } | null };
      item.point?.(script.__point !== undefined ? script.__point : (fixed ?? pointer));
      const held = script.__t;
      if (held !== undefined) {
        item.update(held > lastHeld && held - lastHeld < 0.1 ? held - lastHeld : 1 / 30, held, false);
        lastHeld = held;
      } else item.update(still ? 0 : dt, t, still);
      // the close view, and beside it the item as small as it must read
      const cell = levelCell(forced ?? item.pixel ?? PIXEL_LEAST, ratio);
      for (const [x, size] of [[40, big], [80 + big, SMALL]] as const) {
        const y = h - 60 - size;
        renderer.setViewport(x, y, size, size);
        renderer.setScissor(x, y, size, size);
        if (cell > 0) pixels.render(renderer, scene, camera, x, y, size, size, cell);
        else renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      item?.dispose();
      pixels.dispose();
      renderer.dispose();
    };
  }, [id, big, q]);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#16161d", color: "#e9e9e2", font: "13px/1.4 ui-monospace, monospace" }}>
      <canvas ref={canvas} style={{ width: "100%", height: "100%", display: "block" }} />
      {shown && text && (
        <div style={{ position: "absolute", left: 80 + big, top: 60 + SMALL + 24, maxWidth: 360 }}>
          <div style={{ opacity: 0.5 }}>{text.tier}</div>
          <div style={{ fontSize: 16, margin: "4px 0" }}>{text.name}</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>{text.caption}</div>
          {!ITEM_MAKERS[text.id] && <div style={{ opacity: 0.5, marginTop: 8 }}>not made yet</div>}
        </div>
      )}
    </main>
  );
}
