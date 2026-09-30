"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/engine/common/loader";
import { PLANETS } from "@/engine/space/sky/defaults";
import { PLANET_KINDS, type PlanetKind } from "@/engine/space/sky/Planets";
import { PlanetBody } from "@/engine/space/sky/planets/body";
import { resolve } from "@/engine/space/sky/tune";

/** The close one's diameter by default (px), the sky's sizes beside it, and the cells (device px) they are also shown pixelated at. */
const BIG = 460;
const SKY = [84, 60, 40, 26];
const CELLS = [2, 3, 4];

/** Space's planets up close (see page.tsx for its knobs). */
export function PlanetSheet() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [q] = useState(() => (typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search)));

  useEffect(() => {
    const el = canvas.current!;
    const k = q.get("kind"), kind: PlanetKind = (PLANET_KINDS as readonly string[]).includes(k ?? "") ? (k as PlanetKind) : PLANET_KINDS[0];
    const seed = Number(q.get("seed")) || 7, big = Number(q.get("big")) || BIG, speed = Number(q.get("speed")) || 6, solo = q.has("solo");
    const fixed = q.has("spin") ? (Number(q.get("spin")) * Math.PI) / 180 : null;
    const config = resolve(PLANETS, seed);
    const renderer = makeRenderer(el);
    renderer.autoClear = false;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    camera.position.z = 10;
    let body: PlanetBody | null = null;
    let alive = true;
    let t = 0;
    let last = performance.now();
    let raf = 0;
    const fit = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      Object.assign(camera, { left: -el.clientWidth / 2, right: el.clientWidth / 2, top: el.clientHeight / 2, bottom: -el.clientHeight / 2 });
      camera.updateProjectionMatrix();
    };
    fit();
    // (baked finer than the sky's, for a close look)
    PlanetBody.create(kind, renderer, seed, config[kind], Number(q.get("width")) || 2048, camera).then((b) => {
      if (!alive) return b.dispose();
      b.setLook(config[kind], config.light);
      body = b;
      scene.add(b.mesh);
      el.dataset.ready = "1";
    });
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      t += ((now - last) / 1000) * speed;
      last = now;
      renderer.clear();
      if (!body) return;
      const w = el.clientWidth, h = el.clientHeight, stage = { width: w, height: h, grid: { x: el.width / w, y: el.height / h } };
      // (a script filming it sets window.__spin, degrees, a frame at a time)
      const held = (window as unknown as { __spin?: number }).__spin;
      const spin = held !== undefined ? (held * Math.PI) / 180 : (fixed ?? (t * Math.PI * 2) / ((config.spin.min + config.spin.max) / 2));
      const tilt = (-0.4 * config.tilt * Math.PI) / 180, tip = (((config.tip.min + config.tip.max) / 2) * Math.PI) / 180;
      const at = (x: number, y: number, d: number, cell = 0) => {
        body!.pose({ x: x - w / 2, y: h / 2 - y, radius: d / 2, cell, fade: 1, spin, tilt, tip }, stage);
        renderer.render(scene, camera);
      };
      // the close one, then the sky's sizes in a column, and pixelated beside each
      const left = 40 + big / 2;
      at(left, h / 2, big);
      if (solo) return;
      let y = 60;
      const x0 = left + big / 2 + 90;
      for (const d of SKY) {
        at(x0, y + d / 2, d);
        CELLS.forEach((c, i) => at(x0 + (i + 1) * (SKY[0] + 40), y + d / 2, d, c));
        y += d + 44;
      }
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", fit);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      body?.dispose();
      renderer.dispose();
    };
  }, [q]);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#16161d" }}>
      <canvas ref={canvas} style={{ width: "100%", height: "100%", display: "block" }} />
    </main>
  );
}
