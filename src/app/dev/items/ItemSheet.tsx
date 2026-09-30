"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ITEMS } from "@/content/site";
import { makeRenderer } from "@/engine/common/loader";
import { ITEM_MAKERS, type Item } from "@/engine/items";

/** The close view's size by default, and the size an item must read at (px). */
const BIG = 420;
const SMALL = 96;

/** Space's items up close (see page.tsx). */
export function ItemSheet() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [q] = useState(() => (typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search)));
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
    let item: Item | null = null, alive = true, raf = 0, last = performance.now(), t = Number(q.get("t")) || 0;
    const still = q.has("still") || q.has("t");
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
      // (a script filming it sets window.__t, seconds, a frame at a time)
      const held = (window as unknown as { __t?: number }).__t;
      if (held !== undefined) item.update(1 / 30, held, false);
      else item.update(still ? 0 : dt, t, still);
      // the close view, and beside it the item as small as it must read
      for (const [x, size] of [[40, big], [80 + big, SMALL]] as const) {
        const y = h - 60 - size;
        renderer.setViewport(x, y, size, size);
        renderer.setScissor(x, y, size, size);
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      item?.dispose();
      renderer.dispose();
    };
  }, [id, big, q]);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#16161d", color: "#e9e9e2", font: "13px/1.4 ui-monospace, monospace" }}>
      <canvas ref={canvas} style={{ width: "100%", height: "100%", display: "block" }} />
      {text && (
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
