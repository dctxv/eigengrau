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
 * The mark's box in CSS px against the statement's font size, as [font, box] with straight lines
 * between: the 32-36px sprite wherever the type is at desktop size (1024 wide and up), shrinking
 * with the type below that to 24px on a phone, where a full-size mark would outweigh its word.
 */
const MARK_BOX: readonly (readonly [number, number])[] = [[34, 24], [43, 32], [64, 36]];
/** Its chin sits a superscript's third of an em above the baseline, a little clear of the full stop. */
const MARK = { rise: 0.3, gap: 0.12 } as const;
/** When the mark arrives, after the lines have started rising (the old "®" faded in here), and when it opens its eyes. */
const MARK_IN = { delay: 0.9, fade: 0.5, eyes: 1.25, open: 0.4 } as const;
/**
 * Where the mark looks, seen from the mark: at the pointer as if it lay `reach` ems out in front,
 * so a pointer on the words beside it turns its head that way and one on it is looked at straight.
 * A touch holds the look for `release` seconds, as the character's own does.
 */
const GAZE = { reach: 4, release: 1.4 } as const;

/** The troika metrics this scene reads; the site's typings only name blockBounds. */
type Metrics = TextRenderInfo & { visibleBounds?: [number, number, number, number]; topBaseline?: number };

/**
 * Which scene last took each canvas, by number (a canvas has only the one context to give; see
 * dispose). A number, so a canvas kept alive never keeps a whole scene alive with it.
 */
const owners = new WeakMap<HTMLCanvasElement, number>();
let scenes = 0;

function markBox(size: number) {
  const [first] = MARK_BOX, last = MARK_BOX[MARK_BOX.length - 1];
  if (size <= first[0]) return first[1];
  for (let i = 1; i < MARK_BOX.length; i++) {
    const [f0, b0] = MARK_BOX[i - 1], [f1, b1] = MARK_BOX[i];
    if (size <= f1) return b0 + ((size - f0) / (f1 - f0)) * (b1 - b0);
  }
  return last[1];
}

export class AboutScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  private lines: Text[] = [];
  private current: Text | null = null;
  /**
   * Urchi as the superscript mark after "things.": a coarse cell, so each of its pixels is one
   * screen pixel and its rim stays one crisp pixel. It looks at the pointer from where it sits
   * (see look) and blinks on its own.
   */
  mark: Urchi | null = null;
  /** The mark's box width in canvas pixels, which fixes its cell; a new size builds a new Urchi. */
  private markTexels = 0;
  /** CSS px per canvas pixel: one, or whatever whole number of device pixels is nearest to one. */
  private texel = 1;
  private markIn: gsap.core.Tween | null = null;
  /**
   * How far the mark has arrived, kept by the scene rather than the Urchi: a resize across a size
   * step builds a new one, which takes over at the same moment (still unseen, eyes still shut).
   * `eyesAt` is when its eyes began to open (performance.now), -1 while they are shut.
   */
  private arrival = { fade: 0, eyesAt: -1 };
  /** The pointer in client px while the mark is looking at it, so a new or moved mark can look again. */
  private pointer: { x: number; y: number } | null = null;
  private release = 0;
  private width = 1;
  private height = 1;
  private tick: (t: number, dt: number) => void;
  private disposed = false;
  private serial = ++scenes;
  private ready = false;
  private revealed = false;

  constructor(private canvas: HTMLCanvasElement, private opts: AboutOptions) {
    this.renderer = makeRenderer(canvas);
    owners.set(canvas, this.serial);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
    this.measure();
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.tick);
    if (!opts.reducedMotion) {
      window.addEventListener("pointermove", this.onPointer, { passive: true });
      window.addEventListener("pointerdown", this.onPointer, { passive: true });
      window.addEventListener("pointerup", this.onPointerUp, { passive: true });
      window.addEventListener("pointerout", this.onPointerOut, { passive: true });
      window.addEventListener("blur", this.lookAway);
    }
  }

  // The gaze, as seen from the mark. Left to itself the character reads the pointer across the
  // whole viewport, as if it sat mid-screen; these give it the direction from its head to the
  // pointer instead (see look), and hand the gaze back once the pointer has gone, when the
  // character, which has let go of it too, looks straight ahead.
  private onPointer = (e: PointerEvent) => {
    clearTimeout(this.release);
    this.pointer = { x: e.clientX, y: e.clientY };
    this.look();
  };
  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") this.release = window.setTimeout(this.lookAway, GAZE.release * 1000);
  };
  private onPointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget && e.pointerType !== "touch") this.lookAway();
  };
  private lookAway = () => {
    clearTimeout(this.release);
    if (!this.pointer) return;
    this.pointer = null;
    this.mark?.character.lookAt(null);
  };

  /** Turns the mark toward the pointer: the direction from its head to the pointer, `reach` ems out in front. */
  private look() {
    const m = this.mark, p = this.pointer;
    if (!m || !p) return;
    const r = this.canvas.getBoundingClientRect();
    const dx = p.x - (r.left + m.mesh.position.x);
    const dy = p.y - (r.top - m.mesh.position.y);
    const d = Math.hypot(dx, dy, GAZE.reach * this.fontSize);
    m.character.lookAt(dx / d, dy / d);
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
    if (this.current) {
      this.current.position.set(this.width / 2, -(this.lineY(this.lines.length - 1) + 70 + 12), 0);
      this.current.userData.baseY = this.current.position.y;
    }
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
    const texels = Math.round(markBox(size) / this.texel);
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
    this.look();
  }

  /**
   * A new mark for a new size. A resize across a step builds one mid-arrival as readily as later,
   * so it takes up the arrival where it stands: the fade comes from the scene each frame, and the
   * eyes stay shut until their moment, or finish opening in the time that was left.
   */
  private buildMark(texels: number) {
    const old = this.mark;
    const next = new Urchi({ reducedMotion: this.opts.reducedMotion, cell: URCHI_BOX.w / texels });
    next.appear = 1;
    next.mesh.renderOrder = 5;
    next.uniforms.uFade.value = this.arrival.fade;
    if (!this.opts.reducedMotion) {
      const since = this.arrival.eyesAt < 0 ? -1 : (performance.now() - this.arrival.eyesAt) / 1000;
      if (since < MARK_IN.open) next.closeEyes();
      if (since >= 0 && since < MARK_IN.open) next.openEyes(MARK_IN.open - since);
    }
    if (old) {
      this.scene.remove(old.mesh);
      old.dispose();
    }
    this.scene.add(next.mesh);
    this.mark = next;
    this.markTexels = texels;
  }

  /**
   * Lines rise out of their own masks: clipRect follows the offset so the box stays put. The rise
   * is a share of each line's height from wherever layout last put it, so a resize mid-rise (a
   * phone turned while the page loads) lands the lines, and the mark, in the new layout.
   */
  private reveal() {
    const items = [...this.lines, this.current].filter((t): t is Text => !!t);
    items.forEach((t, i) => {
      const state = { rise: this.opts.reducedMotion ? 0 : 1 };
      const apply = () => {
        const h = (t.userData.h as number | undefined) ?? 24;
        const offset = state.rise * h;
        t.position.y = (t.userData.baseY as number) - offset;
        t.clipRect = [-this.width, -h / 2 + offset, this.width, h / 2 + offset];
      };
      apply();
      if (this.opts.reducedMotion) return;
      gsap.to(state, { rise: 0, duration: 1.0, ease: "power4.out", delay: 0.15 + i * 0.08, onUpdate: apply });
    });
    this.revealed = true;
    if (this.opts.reducedMotion) {
      this.arrival.fade = 1;
      return;
    }
    // It fades in where the "®" used to, eyes shut, and opens them once it is there.
    gsap.to(this.arrival, { fade: 1, duration: MARK_IN.fade, ease: "power2.out", delay: MARK_IN.delay });
    this.markIn = gsap.delayedCall(MARK_IN.eyes, () => {
      this.arrival.eyesAt = performance.now();
      this.mark?.openEyes(MARK_IN.open);
    });
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
      m.uniforms.uFade.value = this.arrival.fade;
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
    gsap.killTweensOf(this.arrival);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointerout", this.onPointerOut);
    window.removeEventListener("blur", this.lookAway);
    clearTimeout(this.release);
    this.lines.forEach((l) => l.dispose());
    this.current?.dispose();
    this.mark?.dispose();
    this.renderer.dispose();
    // troika's glyph atlas is shared by every text on the site, and a renderer that drew it stays
    // reachable through it, context and all, so each visit would leave a live context behind
    // until the browser starts losing the oldest. Lose this one on purpose. A tick later, and only
    // if no new scene has taken the canvas: in development React mounts the panel twice on the
    // same element, and the second scene gets this very context back.
    const { canvas, renderer, serial } = this;
    setTimeout(() => {
      if (owners.get(canvas) === serial) renderer.forceContextLoss();
    }, 0);
  }
}
