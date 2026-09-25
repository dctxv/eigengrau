import * as THREE from "three";
import gsap from "gsap";
import type { Text, TextRenderInfo } from "troika-three-text";
import { makeRenderer } from "@/engine/common/loader";
import { Urchi } from "@/engine/urchi/Urchi";
import { URCHI_BOX, URCHI_FRAME, URCHI_HEAD } from "@/engine/urchi/character";
import { FONT, makeText, syncText } from "@/engine/common/text";

export type AboutOptions = {
  statement: string[];
  mark?: { line: number; after: string };
  current: string;
  reducedMotion?: boolean;
};

/**
 * The mark against the statement's type, in ems: about half an em across, so at the largest size
 * it is the 32-36px sprite, and never so small on a phone that it stops being Urchi. Its chin sits
 * a superscript's third of an em above the baseline, a little clear of the full stop.
 */
const MARK = { em: 0.55, min: 22, max: 36, rise: 0.3, gap: 0.12 } as const;
/** When the mark arrives, after the lines have started rising (the old "®" faded in here), and when it opens its eyes. */
const MARK_IN = { delay: 0.9, fade: 0.5, eyes: 1.25, open: 0.4 } as const;

/** The troika metrics this scene reads; the site's typings only name blockBounds. */
type Metrics = TextRenderInfo & { visibleBounds?: [number, number, number, number]; topBaseline?: number };

export class AboutScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  private lines: Text[] = [];
  private current: Text | null = null;
  /**
   * Urchi as the superscript mark after "things.": a coarse cell, so each of its pixels is one
   * screen pixel and its rim stays one crisp pixel. It follows the pointer and blinks on its own.
   */
  mark: Urchi | null = null;
  /** The mark's box width in canvas pixels, which fixes its cell; a new size builds a new Urchi. */
  private markTexels = 0;
  /** CSS px per canvas pixel: one, or whatever whole number of device pixels is nearest to one. */
  private texel = 1;
  private markIn: gsap.core.Tween | null = null;
  private width = 1;
  private height = 1;
  private tick: (t: number, dt: number) => void;
  private disposed = false;
  private ready = false;
  private revealed = false;

  constructor(private canvas: HTMLCanvasElement, private opts: AboutOptions) {
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
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
    this.current = makeText(this.opts.current, { font: FONT.grotesk, size: 12, anchorX: "center", anchorY: "middle" });
    this.scene.add(this.current);
    await Promise.all([...this.lines, this.current].map((t) => syncText(t)));
    if (this.disposed) return;
    this.layout();
    this.ready = true;
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
    if (this.current) this.current.position.set(this.width / 2, -(this.lineY(this.lines.length - 1) + 70 + 12), 0);
    this.placeMark();
  }

  /**
   * The mark sits after the line's last glyph at superscript height, its canvas laid on whole
   * device pixels so none of its pixels is split.
   */
  private placeMark() {
    const spec = this.opts.mark;
    const line = spec ? this.lines[spec.line] : undefined;
    const info = line?.textRenderInfo as Metrics | null | undefined;
    if (!spec || !line || !info) return;
    const size = this.fontSize;
    const pr = this.renderer.getPixelRatio();
    this.texel = Math.max(1, Math.round(pr)) / pr;
    const box = Math.min(MARK.max, Math.max(MARK.min, Math.round(size * MARK.em)));
    const texels = Math.round(box / this.texel);
    if (!this.mark || texels !== this.markTexels) this.buildMark(texels);
    const m = this.mark!;
    const cell = URCHI_BOX.w / texels;
    // The ink's right edge and the baseline, in screen px (y down).
    const right = this.width / 2 + (info.visibleBounds ?? info.blockBounds)[2];
    const baseline = this.lineY(spec.line) - (info.topBaseline ?? -size * 0.2);
    // Where the head's box and its chin fall in the canvas, in canvas pixels.
    const headLeft = (URCHI_BOX.x - URCHI_FRAME.x) / cell;
    const chin = (URCHI_HEAD.bottom - URCHI_FRAME.y) / cell;
    const snap = (v: number) => Math.round(v * pr) / pr;
    const left = snap(right + Math.max(5, size * MARK.gap) - headLeft * this.texel);
    const top = snap(baseline - size * MARK.rise - chin * this.texel);
    const c = m.character.canvas;
    const w = c.width * this.texel, h = c.height * this.texel;
    const g = m.mesh.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    m.mesh.position.set(left + w / 2, -top - g.boundingBox!.max.y * h, 3);
  }

  private buildMark(texels: number) {
    const old = this.mark;
    const next = new Urchi({ reducedMotion: this.opts.reducedMotion, cell: URCHI_BOX.w / texels });
    next.appear = 1;
    next.mesh.renderOrder = 5;
    if (old) {
      // Resized across a step: the new one takes over where the old one was, eyes open.
      const fade = old.uniforms.uFade.value;
      next.uniforms.uFade.value = fade;
      if (fade < 1) next.fade(1, MARK_IN.fade * (1 - fade));
      this.scene.remove(old.mesh);
      old.dispose();
    } else {
      next.uniforms.uFade.value = 0;
      if (!this.opts.reducedMotion) next.closeEyes();
    }
    this.scene.add(next.mesh);
    this.mark = next;
    this.markTexels = texels;
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
    this.revealed = true;
    const m = this.mark;
    if (!m) return;
    if (this.opts.reducedMotion) {
      m.uniforms.uFade.value = 1;
      return;
    }
    // It fades in where the "®" used to, eyes shut, and opens them once it is there.
    m.fade(1, MARK_IN.fade, MARK_IN.delay, 0);
    this.markIn = gsap.delayedCall(MARK_IN.eyes, () => this.mark?.openEyes(MARK_IN.open));
  }

  resize() {
    this.measure();
    if (!this.ready) return;
    this.layout();
    this.lines.forEach((l) => {
      l.clipRect = null;
    });
    // The lines' new metrics arrive with the sync; the mark follows its word once they have.
    Promise.all(this.lines.map((l) => syncText(l))).then(() => {
      if (!this.disposed) this.placeMark();
    });
  }

  private frame(dt: number) {
    if (this.disposed) return;
    const m = this.mark;
    if (m && this.revealed) {
      m.update(dt);
      // The host sizes its plane to the frame, which a coarse canvas overshoots by a fraction of a
      // pixel; one canvas pixel per texel exactly keeps every pixel, and the rim, the same size.
      m.mesh.scale.set(m.character.canvas.width * this.texel, m.character.canvas.height * this.texel, 1);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    this.markIn?.kill();
    this.lines.forEach((l) => l.dispose());
    this.current?.dispose();
    this.mark?.dispose();
    this.renderer.dispose();
  }
}
