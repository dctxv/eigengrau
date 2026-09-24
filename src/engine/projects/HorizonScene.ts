import * as THREE from "three";
import gsap from "gsap";
import type { Text } from "troika-three-text";
import { sfx } from "@/audio/sfx";
import { statusWord, type Project } from "@/content/site";
import { GL } from "@/engine/common/color";
import { loadImage, loadMedia, makeRenderer, upload, type Loaded } from "@/engine/common/loader";
import { FONT, makeText, syncText } from "@/engine/common/text";
import { EdgeGlass } from "./edgeGlass";

export type HorizonOptions = {
  heading: { lead: string; tail: string };
  onHover(project: Project | null): void;
  reducedMotion?: boolean;
};

/**
 * A text and the box it rises out of. The clipRect stays on the box (in the
 * text's own units) while the text itself moves by `offset` along `dir`, so
 * the box reads as a mask: the site's own entrance, done in troika.
 */
type Masked = {
  t: Text;
  box: [number, number, number, number];
  base: THREE.Vector2;
  /** -1: rises from below. 1: falls from above (the dead project's verdict). */
  dir: 1 | -1;
  offset: number;
  /** The offset that hides the text completely. */
  span: number;
};

type Mark = {
  project: Project;
  /** Distance along the time axis, in content px. */
  pos: number;
  /** 1: above (right of) the line. -1: below (left of) it, for dead projects. */
  side: 1 | -1;
  tick: THREE.Mesh | null;
  tickH: number;
  dot: THREE.Mesh | null;
  ring: THREE.Mesh | null;
  name: Masked;
  status: Masked;
  why: Masked;
  cover: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  media: { cover: Loaded; hover: Loaded | null };
  mixDelay: gsap.core.Tween | null;
  /** Which side of the viewport centre the mark was on last frame, for the tick cue. */
  crossed: number;
};

const HEADING_Y = 206;
const LINE_Y = 0.58; // of the height
const FIRST_X = 0.09; // of the width, the intro inset
const MIN_GAP = 280;
const PX_PER_YEAR = 280;
const TAIL = 400; // from the last mark to the "now" cursor
const CURSOR_H = 14;
const TICK = 24;
const BREATHE = 4; // the alive tick reaches 28
const BREATHE_PERIOD = 2.4;
const NAME_SIZE = 22;
const STATUS_SIZE = 11;
const OFF_LINE = 8;
const WHY_OFF = 16;
const WHY_MAX = 450;
const COVER_W = 180;
const COVER_H = 240;
const COVER_GAP = 24;
const BAND = 120;
const DEAD_INK = 0.7;
const PHONE = 640;
// Under 640px the horizon stands up: the line at 38% of the width, time flowing down.
const LINE_X = 0.38;
const FIRST_Y = 320;
const MIN_GAP_V = 200;
const BOTTOM_V = 96;
const TEXT_INSET_V = 32;

const coverVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * object-fit: cover for two textures, crossfaded by uMix. The plane is also
 * the mask: the image slides in from uFrom (in uv units) as uReveal goes to 1,
 * and whatever falls outside the plane is discarded.
 */
const coverFrag = /* glsl */ `
uniform sampler2D uCover;
uniform sampler2D uAlt;
uniform float uMix;
uniform float uCoverAspect;
uniform float uAltAspect;
uniform float uPlaneAspect;
uniform float uReveal;
uniform vec2 uFrom;
varying vec2 vUv;
vec2 fit(vec2 uv, float img, float plane) {
  vec2 s = vec2(1.0);
  if (img > plane) s.x = plane / img; else s.y = img / plane;
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 uv = vUv - uFrom * (1.0 - uReveal);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
  vec4 a = texture2D(uCover, fit(uv, uCoverAspect, uPlaneAspect));
  vec4 b = texture2D(uAlt, fit(uv, uAltAspect, uPlaneAspect));
  gl_FragColor = vec4(mix(a.rgb, b.rgb, uMix), 1.0);
}`;

const blockBounds = (t: Text): [number, number, number, number] => t.textRenderInfo?.blockBounds ?? [0, 0, 0, 0];

/**
 * The horizon (horizon.md): one ink line at 58% of the height, each project a
 * mark on it at its year, a blinking cursor for now at the far right. Status
 * is position and mark, never colour; hover raises the cover and the one line
 * out of the line itself. Orthographic in CSS px, world y = -px.
 */
export class HorizonScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  /** Travels with the scroll: the line, the marks, the cursor. */
  readonly content = new THREE.Group();
  /** Stays put: the heading, while the horizon is horizontal. */
  private fixed = new THREE.Group();
  private glass: EdgeGlass;
  private marks: Mark[] = [];
  private heading: { lead: Masked; tail: Masked } | null = null;
  private line: THREE.Mesh;
  private cursor: THREE.Mesh;
  private draw = { value: 0 };
  private lineLen = 0;
  private cursorOn = false;
  private ink = new THREE.MeshBasicMaterial({ color: GL.ink, side: THREE.DoubleSide });
  /** A 1x1 plane with its origin at the corner, so a scale grows it away from the line. */
  private unit = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  private square = new THREE.PlaneGeometry(1, 1);
  private dotGeo = new THREE.CircleGeometry(2, 24);
  private ringGeo = new THREE.RingGeometry(3, 4, 32);
  private width = 1;
  private height = 1;
  private target = 0;
  private current = 0;
  private maxScroll = 0;
  private velocity = 0;
  private lastTouch = 0;
  private touchV = 0;
  private hovered: Mark | null = null;
  private headingDimmed = false;
  private clock = 0;
  private ready = false;
  private disposed = false;
  private intro: gsap.core.Timeline | null = null;
  private ctx = gsap.context(() => undefined);
  private ticker: (t: number, dt: number) => void;

  constructor(private canvas: HTMLCanvasElement, private projects: Project[], private opts: HorizonOptions) {
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
    this.scene.add(this.fixed, this.content);
    this.line = new THREE.Mesh(this.unit, this.ink);
    this.cursor = new THREE.Mesh(this.unit, this.ink);
    this.cursor.visible = false;
    this.content.add(this.line, this.cursor);
    this.glass = new EdgeGlass(this.renderer, 60, 60, "x");
    this.glass.enabled = !opts.reducedMotion;
    this.measure();
    this.ticker = (_t, dtMs) => this.frame(Math.min(dtMs, 100) / 1000);
    gsap.ticker.add(this.ticker);
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
    this.glass.resize();
    this.glass.setAxis(this.vertical ? "y" : "x");
  }

  get vertical() {
    return this.width < PHONE;
  }

  /** The line's px offset: its y when horizontal, its x when vertical. */
  private get lineAt() {
    return this.vertical ? Math.round(this.width * LINE_X) : Math.round(this.height * LINE_Y);
  }

  private get viewport() {
    return this.vertical ? this.height : this.width;
  }

  private dur(s: number) {
    return this.opts.reducedMotion ? 0 : s;
  }

  // ---------------------------------------------------------------- build

  async load(): Promise<void> {
    const covers = await Promise.all(this.projects.map((p) => loadImage(p.cover)));
    const hovers = await Promise.all(this.projects.map((p) => loadMedia(p.hover).catch(() => null)));
    if (this.disposed) {
      covers.forEach((c) => c.dispose());
      hovers.forEach((h) => h?.dispose());
      return;
    }
    upload(this.renderer, covers);
    upload(this.renderer, hovers.filter((h): h is Loaded => !!h));

    const lead = makeText(this.opts.heading.lead, { font: FONT.grotesk, size: 16, anchorY: "middle", letterSpacing: -0.02 });
    const tail = makeText(this.opts.heading.tail, { font: FONT.serif, size: 16, anchorY: "middle" });
    [lead, tail].forEach((t) => {
      t.material.transparent = true;
      this.fixed.add(t);
    });
    this.heading = { lead: this.masked(lead), tail: this.masked(tail) };

    // Chronological, ties in file order.
    const order = this.projects.map((project, i) => ({ project, i })).sort((a, b) => a.project.year - b.project.year || a.i - b.i);
    order.forEach(({ project, i }) => {
      const { status } = project;
      const side: 1 | -1 = status === "dead" ? -1 : 1;
      const light = status === "paused" || status === "dead";
      const name = makeText(project.title, { font: light ? FONT.serifLight : FONT.serif, size: NAME_SIZE });
      if (status === "dead") {
        name.material.transparent = true;
        name.material.opacity = DEAD_INK;
      }
      const stat = makeText(statusWord(project), { font: FONT.grotesk, size: STATUS_SIZE });
      const why = makeText(project.why, { font: FONT.serif, size: 14, lineHeight: 1.3 });
      const cover = covers[i];
      const hover = hovers[i];
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uCover: { value: cover.texture },
          uAlt: { value: hover?.texture ?? cover.texture },
          uMix: { value: 0 },
          uCoverAspect: { value: cover.aspect },
          uAltAspect: { value: hover?.aspect ?? cover.aspect },
          uPlaneAspect: { value: COVER_W / COVER_H },
          uReveal: { value: 0 },
          uFrom: { value: new THREE.Vector2(0, -1) },
        },
        vertexShader: coverVert,
        fragmentShader: coverFrag,
      });
      const mesh = new THREE.Mesh(this.square, mat);
      mesh.renderOrder = 10;
      mesh.visible = false;
      const tick = status === "paused" ? null : new THREE.Mesh(this.unit, this.ink);
      const dot = status === "shipped" ? new THREE.Mesh(this.dotGeo, this.ink) : null;
      const ring = status === "paused" ? new THREE.Mesh(this.ringGeo, this.ink) : null;
      [name, stat, why, mesh, tick, dot, ring].forEach((o) => o && this.content.add(o));
      this.marks.push({
        project,
        pos: 0,
        side,
        tick,
        tickH: 0,
        dot,
        ring,
        name: this.masked(name),
        status: this.masked(stat),
        why: this.masked(why),
        cover: mesh,
        media: { cover, hover },
        mixDelay: null,
        crossed: 0,
      });
    });

    await this.layout();
    if (this.disposed) return;
    this.ready = true;
    this.rest();
    this.reveal();
  }

  private masked(t: Text): Masked {
    return { t, box: [0, 0, 0, 0], base: new THREE.Vector2(), dir: -1, offset: 0, span: 0 };
  }

  private get texts(): Text[] {
    const h = this.heading ? [this.heading.lead.t, this.heading.tail.t] : [];
    return [...h, ...this.marks.flatMap((m) => [m.name.t, m.status.t, m.why.t])];
  }

  /** Anchors depend on the orientation, so a layout is a sync then a placement. */
  private async layout() {
    const v = this.vertical;
    this.marks.forEach((m) => {
      const { side, name, status, why } = m;
      if (v) {
        name.t.anchorX = side > 0 ? "left" : "right";
        name.t.anchorY = "middle";
        status.t.anchorX = side > 0 ? "left" : "right";
        status.t.anchorY = "top";
        why.t.anchorX = "left";
        why.t.anchorY = side > 0 ? "top" : "middle";
        why.t.textAlign = "left";
        why.t.maxWidth = Math.max(120, this.width - this.lineAt - TEXT_INSET_V - 16);
      } else {
        name.t.anchorX = "center";
        name.t.anchorY = side > 0 ? "bottom" : "top";
        status.t.anchorX = "left";
        status.t.anchorY = side > 0 ? "bottom" : "top";
        why.t.anchorX = "center";
        why.t.anchorY = side > 0 ? "top" : "bottom";
        why.t.textAlign = "center";
        why.t.maxWidth = WHY_MAX;
      }
    });
    await Promise.all(this.texts.map((t) => syncText(t)));
    if (this.disposed) return;
    this.place();
  }

  /** Positions, in CSS px, from the sizes troika measured. */
  private place() {
    const v = this.vertical;
    const W = this.width;
    const line = this.lineAt;

    // Marks along the time axis: years give the proportion, the minimum keeps it legible.
    const first = v ? FIRST_Y : Math.round(W * FIRST_X);
    const gap = v ? MIN_GAP_V : MIN_GAP;
    const perYear = v ? MIN_GAP_V : PX_PER_YEAR;
    const year0 = this.marks[0]?.project.year ?? 0;
    let prev = -Infinity;
    this.marks.forEach((m) => {
      m.pos = Math.max(first + (m.project.year - year0) * perYear, prev + gap);
      prev = m.pos;
    });
    const nowPos = (this.marks.length ? prev : first) + TAIL;
    this.lineLen = nowPos;
    const contentLen = v ? nowPos + BOTTOM_V : Math.max(W, nowPos + first);
    this.maxScroll = Math.max(0, contentLen - this.viewport);
    this.target = THREE.MathUtils.clamp(this.target, 0, this.maxScroll);
    this.current = THREE.MathUtils.clamp(this.current, 0, this.maxScroll);

    if (v) {
      this.line.position.set(line - 0.5, 0, 0);
      this.cursor.position.set(line - CURSOR_H / 2, -nowPos - 0.5, 0);
      this.cursor.scale.set(CURSOR_H, 1, 1);
    } else {
      this.line.position.set(0, -line - 0.5, 0);
      this.cursor.position.set(nowPos - 0.5, -line - CURSOR_H / 2, 0);
      this.cursor.scale.set(1, CURSOR_H, 1);
    }
    this.applyDraw();

    if (this.heading) {
      const { lead, tail } = this.heading;
      (v ? this.content : this.fixed).add(lead.t, tail.t);
      const lw = blockBounds(lead.t)[2] - blockBounds(lead.t)[0];
      const tw = blockBounds(tail.t)[2] - blockBounds(tail.t)[0];
      const space = 16 * 0.28;
      const total = lw + space + tw;
      if (total <= W - 40) {
        const x0 = (W - total) / 2;
        this.setBase(lead, x0, HEADING_Y);
        this.setBase(tail, x0 + lw + space, HEADING_Y);
      } else {
        // Narrow screens: the serif phrase drops to its own line under the grotesk lead-in.
        this.setBase(lead, (W - lw) / 2, HEADING_Y - 11);
        this.setBase(tail, (W - tw) / 2, HEADING_Y + 11);
      }
    }

    this.marks.forEach((m) => {
      const { side, pos } = m;
      if (m.tick) {
        if (v) m.tick.position.set(line, -pos - 0.5, 0);
        else m.tick.position.set(pos - 0.5, -line, 0);
        this.applyTick(m);
      }
      if (m.ring) m.ring.position.set(v ? line : pos, v ? -pos : -line, 0.5);
      if (m.dot) m.dot.position.set(v ? line + TICK : pos, v ? -pos : -(line - TICK), 0.5);

      if (v) {
        this.setBase(m.name, line + side * TEXT_INSET_V, pos);
        this.setBase(m.status, line + side * TEXT_INSET_V, pos + 16);
        // The one line always sits right of the line, where there is room to read it.
        this.setBase(m.why, line + TEXT_INSET_V, side > 0 ? pos + 44 : pos);
        m.why.dir = -1;
        m.cover.visible = false;
        m.cover.material.uniforms.uReveal.value = 0;
      } else {
        this.setBase(m.name, pos, line - side * (TICK + OFF_LINE));
        this.setBase(m.status, pos + OFF_LINE, line - side * OFF_LINE);
        this.setBase(m.why, pos, line + side * WHY_OFF);
        // The verdict of a dead project falls; every other line rises.
        m.why.dir = side > 0 ? -1 : 1;
        const nb = blockBounds(m.name.t);
        const edge = line - side * (TICK + OFF_LINE + (nb[3] - nb[1]) + COVER_GAP);
        m.cover.position.set(pos, -(edge - side * (COVER_H / 2)), 2);
        m.cover.scale.set(COVER_W, COVER_H, 1);
        m.cover.material.uniforms.uFrom.value.set(0, -side);
      }
      // A why line only shows while its mark is hovered.
      if (m !== this.hovered) {
        gsap.killTweensOf(m.why);
        m.why.offset = m.why.span;
      }
      this.applyMask(m.why);
    });
  }

  /** Sets a text's resting place and reads its box; the current offset is kept. */
  private setBase(m: Masked, x: number, y: number) {
    const b = blockBounds(m.t);
    const pad = Math.max(3, m.t.fontSize * 0.2);
    m.box = [b[0] - 4, b[1] - pad, b[2] + 4, b[3] + pad];
    m.span = b[3] - b[1] + pad * 2;
    m.base.set(x, -y);
    this.applyMask(m);
  }

  private applyMask(m: Masked) {
    const { box, dir, offset } = m;
    m.t.position.set(m.base.x, m.base.y + dir * offset, 1);
    m.t.clipRect = [box[0], box[1] - dir * offset, box[2], box[3] - dir * offset];
  }

  private applyDraw() {
    const len = this.lineLen * this.draw.value;
    if (this.vertical) this.line.scale.set(1, -len, 1);
    else this.line.scale.set(len, 1, 1);
  }

  private applyTick(m: Mark) {
    if (!m.tick) return;
    const breathe = m.project.status === "alive" && !this.opts.reducedMotion ? (BREATHE / 2) * (1 + Math.sin((this.clock / BREATHE_PERIOD) * Math.PI * 2)) * (m.tickH / TICK) : 0;
    const h = m.side * (m.tickH + breathe);
    if (this.vertical) m.tick.scale.set(h, 1, 1);
    else m.tick.scale.set(1, h, 1);
  }

  /** Opens on the most recent alive project; a phone starts at the top like any page. */
  private rest() {
    const latest = [...this.marks].reverse().find((m) => m.project.status === "alive") ?? this.marks[this.marks.length - 1];
    this.target = this.current = latest && !this.vertical ? THREE.MathUtils.clamp(latest.pos - this.viewport / 2, 0, this.maxScroll) : 0;
    const centre = this.current + this.viewport / 2;
    this.marks.forEach((m) => {
      m.crossed = Math.sign(m.pos - centre) || 1;
    });
  }

  /** The line draws in from the left; the marks rise out of their masks 0.05s apart. */
  private reveal() {
    const items = this.heading ? [this.heading.lead, this.heading.tail] : [];
    this.marks.forEach((m) => items.push(m.name, m.status));
    if (this.opts.reducedMotion) {
      this.draw.value = 1;
      this.applyDraw();
      items.forEach((it) => this.applyMask(it));
      this.marks.forEach((m) => {
        m.tickH = TICK;
      });
      this.cursorOn = true;
      return;
    }
    items.forEach((it) => {
      it.offset = it.span;
      this.applyMask(it);
    });
    this.marks.forEach((m) => {
      m.dot?.scale.setScalar(0.001);
      m.ring?.scale.setScalar(0.001);
    });
    const tl = gsap.timeline();
    const rise = (it: Masked, at: number) => tl.to(it, { offset: 0, duration: 0.9, ease: "power4.out", onUpdate: () => this.applyMask(it) }, at);
    tl.to(this.draw, { value: 1, duration: 1.0, ease: "power3.out", onUpdate: () => this.applyDraw() }, 0);
    if (this.heading) {
      rise(this.heading.lead, 0.1);
      rise(this.heading.tail, 0.18);
    }
    this.marks.forEach((m, i) => {
      const at = 0.35 + i * 0.05;
      rise(m.name, at);
      rise(m.status, at + 0.06);
      if (m.tick) tl.to(m, { tickH: TICK, duration: 0.6, ease: "power3.out" }, at);
      const cap = m.dot ?? m.ring;
      if (cap) tl.to(cap.scale, { x: 1, y: 1, duration: 0.4, ease: "power3.out" }, at + (m.dot ? 0.3 : 0.1));
    });
    tl.call(
      () => {
        this.cursorOn = true;
      },
      undefined,
      1.0,
    );
    this.intro = tl;
  }

  resize() {
    this.measure();
    if (!this.ready) return;
    this.intro?.progress(1);
    this.setHover(null);
    void this.layout();
  }

  // ---------------------------------------------------------------- travel

  wheel(deltaX: number, deltaY: number) {
    const d = this.vertical ? deltaY : Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    this.target = THREE.MathUtils.clamp(this.target + d, 0, this.maxScroll);
  }

  touchStart(x: number, y: number) {
    this.lastTouch = this.vertical ? y : x;
    this.touchV = 0;
  }

  touchMove(x: number, y: number) {
    const p = this.vertical ? y : x;
    this.touchV = this.lastTouch - p;
    this.target = THREE.MathUtils.clamp(this.target + this.touchV, 0, this.maxScroll);
    this.lastTouch = p;
  }

  touchEnd() {
    this.target = THREE.MathUtils.clamp(this.target + this.touchV * 12, 0, this.maxScroll);
  }

  /** Arrow keys: focus the next mark along the line and travel to it. */
  step(dir: 1 | -1) {
    if (!this.ready || !this.marks.length) return;
    let i: number;
    if (this.hovered) {
      i = THREE.MathUtils.clamp(this.marks.indexOf(this.hovered) + dir, 0, this.marks.length - 1);
    } else {
      const centre = this.current + this.viewport / 2;
      i = this.marks.reduce((best, m, k) => (Math.abs(m.pos - centre) < Math.abs(this.marks[best].pos - centre) ? k : best), 0);
    }
    const m = this.marks[i];
    this.target = THREE.MathUtils.clamp(m.pos - this.viewport / 2, 0, this.maxScroll);
    if (m !== this.hovered) this.setHover(m);
  }

  // ---------------------------------------------------------------- hover

  /** The mark whose 120px band holds the pointer, nearest first. */
  private markAt(clientX: number, clientY: number): Mark | null {
    const rect = this.canvas.getBoundingClientRect();
    const along = this.vertical ? clientY - rect.top + this.current : clientX - rect.left + this.current;
    let best: Mark | null = null;
    let bestD = BAND / 2;
    this.marks.forEach((m) => {
      const d = Math.abs(m.pos - along);
      if (d <= bestD) {
        best = m;
        bestD = d;
      }
    });
    return best;
  }

  pointer(clientX: number, clientY: number) {
    if (!this.ready) return;
    const m = this.markAt(clientX, clientY);
    if (m !== this.hovered) this.setHover(m);
  }

  leave() {
    if (this.hovered) this.setHover(null);
  }

  focus(project: Project) {
    const m = this.marks.find((k) => k.project === project);
    if (m && m !== this.hovered) this.setHover(m);
  }

  get focused(): Project | null {
    return this.hovered?.project ?? null;
  }

  projectAt(clientX: number, clientY: number): Project | null {
    return this.ready ? (this.markAt(clientX, clientY)?.project ?? null) : null;
  }

  private setHover(m: Mark | null) {
    if (this.hovered) this.hoverOff(this.hovered);
    this.hovered = m;
    if (m) this.hoverOn(m);
    this.opts.onHover(m?.project ?? null);
    this.dimHeading();
  }

  /** The cover and the one line come up together; the video waits 400ms, as the grid did. */
  private hoverOn(m: Mark) {
    const u = m.cover.material.uniforms;
    this.ctx.add(() => {
      gsap.to(m.why, { offset: 0, duration: this.dur(0.6), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m.why) });
      if (this.vertical) return;
      m.cover.visible = true;
      gsap.to(u.uReveal, { value: 1, duration: this.dur(0.6), ease: "power3.out", overwrite: true });
      m.mixDelay?.kill();
      m.mixDelay = gsap.delayedCall(this.dur(0.4), () => {
        m.mixDelay = null;
        const video = m.media.hover?.video;
        if (video) void video.play().catch(() => undefined);
        gsap.to(u.uMix, { value: 1, duration: this.dur(0.25), ease: "power2.inOut", overwrite: true });
      });
    });
  }

  private hoverOff(m: Mark) {
    const u = m.cover.material.uniforms;
    const video = m.media.hover?.video;
    m.mixDelay?.kill();
    m.mixDelay = null;
    this.ctx.add(() => {
      gsap.to(m.why, { offset: m.why.span, duration: this.dur(0.4), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m.why) });
      gsap.to(u.uReveal, {
        value: 0,
        duration: this.dur(0.4),
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          m.cover.visible = false;
        },
      });
      gsap.to(u.uMix, { value: 0, duration: this.dur(0.25), ease: "power2.inOut", overwrite: true, onComplete: () => video?.pause() });
    });
  }

  /** On short viewports a raised cover can reach the heading; the heading yields. */
  private dimHeading() {
    if (!this.heading) return;
    let on = false;
    const m = this.hovered;
    if (m && !this.vertical) {
      const cx = m.pos - this.current;
      const cy = -m.cover.position.y;
      const { lead, tail } = this.heading;
      const hx0 = lead.base.x + lead.box[0];
      const hx1 = tail.base.x + tail.box[2];
      on = cx + COVER_W / 2 > hx0 && cx - COVER_W / 2 < hx1 && cy - COVER_H / 2 < HEADING_Y + 12 && cy + COVER_H / 2 > HEADING_Y - 12;
    }
    if (on === this.headingDimmed) return;
    this.headingDimmed = on;
    this.ctx.add(() => {
      gsap.to([this.heading!.lead.t.material, this.heading!.tail.t.material], { opacity: on ? 0 : 1, duration: this.dur(0.3), ease: "power2.inOut", overwrite: true });
    });
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    this.clock += this.opts.reducedMotion ? 0 : dt;
    // lerp 0.1 per frame at 60fps, expressed in time so slow frames do not slow the travel
    this.current += (this.target - this.current) * (1 - Math.pow(0.9, dt * 60));
    this.velocity = this.target - this.current;
    if (this.vertical) this.content.position.set(0, this.current, 0);
    else this.content.position.set(-this.current, 0, 0);

    if (this.ready) {
      const centre = this.current + this.viewport / 2;
      this.marks.forEach((m) => {
        const s = Math.sign(m.pos - centre) || 1;
        if (s !== m.crossed) sfx.play("tick", 0.6);
        m.crossed = s;
        this.applyTick(m);
      });
      if (this.hovered) this.dimHeading();
    }
    // The cursor blinks hard at 1Hz: now is either there or it is not.
    this.cursor.visible = this.cursorOn && (this.opts.reducedMotion || this.clock % 1 < 0.5);

    this.glass.setVelocity(Math.abs(this.velocity) / 400);
    this.glass.render(this.scene, this.camera);
  }

  setVisible(on: boolean) {
    this.marks.forEach((m) => {
      const v = m.media.hover?.video;
      if (!v) return;
      if (on && m === this.hovered) void v.play().catch(() => undefined);
      else v.pause();
    });
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.ticker);
    this.intro?.kill();
    this.ctx.kill();
    this.marks.forEach((m) => {
      m.mixDelay?.kill();
      gsap.killTweensOf([m, m.why, m.name, m.status, m.cover.material.uniforms.uMix, m.cover.material.uniforms.uReveal]);
      m.cover.material.dispose();
      m.media.cover.dispose();
      m.media.hover?.dispose();
    });
    this.texts.forEach((t) => t.dispose());
    this.unit.dispose();
    this.square.dispose();
    this.dotGeo.dispose();
    this.ringGeo.dispose();
    this.ink.dispose();
    this.glass.dispose();
    this.renderer.dispose();
  }
}
