import * as THREE from "three";
import gsap from "gsap";
import type { Text } from "troika-three-text";
import { makeRenderer } from "@/engine/common/loader";
import { Urchi } from "@/engine/urchi/Urchi";
import { FONT, makeText, syncText } from "@/engine/common/text";

export type AboutOptions = {
  statement: string[];
  mark?: { line: number; after: string };
  current: string;
  reducedMotion?: boolean;
};

/** Urchi's box width in CSS px over the statement, on a window 900px wide or more: about the old object's footprint. */
const URCHI_PX = 180;

export class AboutScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  private lines: Text[] = [];
  private mark: Text | null = null;
  private current: Text | null = null;
  /** Urchi, sitting over the statement and following the pointer on its own. */
  readonly urchi: Urchi;
  private width = 1;
  private height = 1;
  private tick: (t: number, dt: number) => void;
  private disposed = false;
  private ready = false;

  constructor(private canvas: HTMLCanvasElement, private opts: AboutOptions) {
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
    this.urchi = new Urchi({ reducedMotion: opts.reducedMotion });
    this.urchi.mesh.renderOrder = 5;
    this.urchi.mesh.visible = false;
    this.scene.add(this.urchi.mesh);
    this.measure();
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.tick);
  }

  private measure() {
    this.width = this.canvas.clientWidth || 1;
    this.height = this.canvas.clientHeight || 1;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.left = 0;
    this.camera.right = this.width;
    this.camera.top = 0;
    this.camera.bottom = -this.height;
    this.camera.updateProjectionMatrix();
  }

  private get fontSize() {
    return Math.max(34, Math.min(64, this.width * 0.042));
  }

  async load() {
    const size = this.fontSize;
    this.lines = this.opts.statement.map((line) =>
      makeText(line, { font: FONT.serif, size, anchorX: "center", anchorY: "middle" }),
    );
    this.lines.forEach((l) => this.scene.add(l));
    if (this.opts.mark) {
      this.mark = makeText("®", { font: FONT.grotesk, size: 12, anchorX: "left", anchorY: "middle" });
      this.scene.add(this.mark);
    }
    this.current = makeText(this.opts.current, { font: FONT.grotesk, size: 12, anchorX: "center", anchorY: "middle" });
    this.scene.add(this.current);
    await Promise.all([...this.lines, this.mark, this.current].filter((t): t is Text => !!t).map((t) => syncText(t)));
    if (this.disposed) return;
    this.layout();
    this.ready = true;
    this.urchi.mesh.visible = true;
    this.reveal();
  }

  private lineY(i: number) {
    const pitch = this.fontSize * 1.375; // 88px at 64px
    const top = this.height / 2 - pitch;
    return top + i * pitch;
  }

  layout() {
    const size = this.fontSize;
    const pitch = size * 1.375;
    this.lines.forEach((l, i) => {
      l.fontSize = size;
      l.position.set(this.width / 2, -this.lineY(i), 0);
      l.userData.baseY = -this.lineY(i);
      l.userData.h = pitch;
    });
    if (this.mark && this.opts.mark) {
      const l = this.lines[this.opts.mark.line];
      const b = l?.textRenderInfo?.blockBounds;
      const w = b ? b[2] - b[0] : 0;
      this.mark.position.set(this.width / 2 + w / 2 + 3, -(this.lineY(this.opts.mark.line) - size * 0.32), 1);
    }
    if (this.current) this.current.position.set(this.width / 2, -(this.lineY(this.lines.length - 1) + 70 + 12), 0);
    // Urchi sits over the middle of the paragraph, a touch right of centre.
    this.urchi.mesh.position.set(this.width / 2 + size * 0.9, -(this.lineY(1) + pitch * 0.15), 2);
    this.urchi.width = URCHI_PX * Math.min(1, this.width / 900);
  }

  /** Lines rise out of their own masks: clipRect follows the offset so the box stays put. */
  private reveal() {
    const items = [...this.lines, this.current].filter((t): t is Text => !!t);
    items.forEach((t, i) => {
      const h = (t.userData.h as number | undefined) ?? 24;
      const baseY = t.position.y;
      const state = { offset: this.opts.reducedMotion ? 0 : h };
      const apply = () => {
        t.position.y = baseY - state.offset;
        t.clipRect = [-this.width, -h / 2 + state.offset, this.width, h / 2 + state.offset];
      };
      apply();
      if (this.opts.reducedMotion) return;
      gsap.to(state, { offset: 0, duration: 1.0, ease: "power4.out", delay: 0.15 + i * 0.08, onUpdate: apply });
    });
    if (this.mark) {
      this.mark.material.opacity = 0;
      this.mark.material.transparent = true;
      gsap.to(this.mark.material, { opacity: 1, duration: 0.5, delay: 0.9 });
    }
    this.urchi.scaleIn(this.opts.reducedMotion ? 0 : 1.1, 0.4);
  }

  resize() {
    this.measure();
    if (this.ready) {
      this.layout();
      this.lines.forEach((l) => {
        l.clipRect = null;
        l.sync();
      });
    }
  }

  private frame(dt: number) {
    if (this.disposed) return;
    this.urchi.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    this.lines.forEach((l) => l.dispose());
    this.mark?.dispose();
    this.current?.dispose();
    this.urchi.dispose();
    this.renderer.dispose();
  }
}
