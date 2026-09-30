import * as THREE from "three";
import gsap from "gsap";
import { makeRenderer } from "@/engine/common/loader";
import { PIXEL_LEAST, levelCell } from "@/engine/common/pixel";
import { ITEM_MAKERS } from "@/engine/items";
import { ItemSprite } from "@/engine/items/sprite";

/** A forgery in the case: as wrong as in the sky, this many cells across whatever its size. */
const FORGED_CELLS = 12;

type Shown = { key: string; id: string; forged: boolean; el: HTMLElement; sprite: ItemSprite };

/**
 * The case on Space (components/FoundCase.tsx): the things Urchi has caught, each drawn into its
 * place in the case's page, as the room draws them (items/sprite.ts), in pixel level 1's cells (a
 * forgery in its own wrong ones), turning. The page says where each goes (an element, by key) and
 * this draws it there every frame while the case is open, over one canvas the size of the case.
 */
export class CaseScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private shown = new Map<string, Shown>();
  private pointer: { x: number; y: number } | null = null;
  private tick: (t: number, dtMs: number) => void;
  private reduced: boolean;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, o: { reducedMotion: boolean }) {
    this.reduced = o.reducedMotion;
    this.renderer = makeRenderer(canvas);
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.z = 5;
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.tick);
  }

  /**
   * What is shown where: each `key` (a slot, or the case's big view) an item `id`, whether it is a
   * forgery, and the element it is drawn over. What is no longer asked for goes; an item already
   * shown under that key keeps its sprite (and where it is in its turn).
   */
  show(list: { key: string; id: string; forged: boolean; el: HTMLElement }[]) {
    const keep = new Set<string>();
    for (const w of list) {
      keep.add(w.key);
      const was = this.shown.get(w.key);
      if (was && was.id === w.id) {
        Object.assign(was, { forged: w.forged, el: w.el });
        continue;
      }
      was?.sprite.dispose();
      const sprite = new ItemSprite();
      sprite.t = Math.random() * 60;
      this.scene.add(sprite.mesh);
      const s: Shown = { ...w, sprite };
      this.shown.set(w.key, s);
      ITEM_MAKERS[w.id]?.().then(
        (maker) => {
          if (!this.disposed && this.shown.get(w.key) === s) sprite.setItem(maker());
        },
        () => undefined,
      );
    }
    for (const [k, s] of this.shown) {
      if (keep.has(k)) continue;
      s.sprite.dispose();
      this.shown.delete(k);
    }
  }

  /** The pointer, client px (null: gone), for the things that answer it (the magnet stone). */
  point(clientX: number | null, clientY = 0) {
    this.pointer = clientX === null ? null : { x: clientX, y: clientY };
  }

  private frame(dt: number) {
    if (this.disposed) return;
    const c = this.canvas, w = c.clientWidth || 1, h = c.clientHeight || 1, ratio = Math.min(window.devicePixelRatio || 1, 3);
    if (c.width !== Math.round(w * ratio) || c.height !== Math.round(h * ratio)) {
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(w, h, false);
      Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
      this.camera.updateProjectionMatrix();
    }
    const box = c.getBoundingClientRect(), grid = { x: c.width / w, y: c.height / h }, least = levelCell(PIXEL_LEAST, grid.x);
    const stage = { width: w, height: h, grid };
    for (const s of this.shown.values()) {
      const r = s.el.getBoundingClientRect(), size = Math.min(r.width, r.height);
      const x = r.left + r.width / 2 - box.left - w / 2, y = h / 2 - (r.top + r.height / 2 - box.top);
      const cell = s.forged ? Math.max(least, Math.round((size * grid.x) / FORGED_CELLS)) : least;
      s.sprite.place({ x, y, size, cell, fade: r.width > 0 ? 1 : 0, wrong: s.forged ? 1 : 0 });
      const p = this.pointer;
      s.sprite.point(p ? { x: p.x - box.left - w / 2, y: h / 2 - (p.y - box.top) } : null);
      s.sprite.frame(dt, this.reduced);
      s.sprite.draw(this.renderer, stage);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    for (const s of this.shown.values()) s.sprite.dispose();
    this.shown.clear();
    this.renderer.dispose();
  }
}
