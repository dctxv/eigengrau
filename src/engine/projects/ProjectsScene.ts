import * as THREE from "three";
import gsap from "gsap";
import type { Text } from "troika-three-text";
import type { Project } from "@/content/site";
import { loadImage, loadMedia, makeRenderer, upload, type Loaded } from "@/engine/common/loader";
import { FONT, makeText, syncText } from "@/engine/common/text";
import { EdgeGlass } from "./edgeGlass";

type Card = {
  project: Project;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  mat: THREE.ShaderMaterial;
  cover: Loaded;
  hover: Loaded | null;
  title: Text;
  cat: Text;
  chip: THREE.Group | null;
  hovered: boolean;
};

export type ProjectsOptions = {
  heading: { lead: string; tail: string };
  footer: string;
  onHover(project: Project | null): void;
  reducedMotion?: boolean;
};

const PAD = 8;
const GAP = 8;
const HEADING_Y = 206;
const GRID_TOP = 298;
const TITLE_GAP = 17;
const CAT_GAP = 20;
const ROW_EXTRA = 92;
const AFTER_GRID = 230;
const FOOTER_BOTTOM = 30;

const coverVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** object-fit: cover for two textures, crossfaded by uMix. */
const coverFrag = /* glsl */ `
uniform sampler2D uCover;
uniform sampler2D uAlt;
uniform float uMix;
uniform float uCoverAspect;
uniform float uAltAspect;
uniform float uPlaneAspect;
varying vec2 vUv;
vec2 fit(vec2 uv, float img, float plane) {
  vec2 s = vec2(1.0);
  if (img > plane) s.x = plane / img; else s.y = img / plane;
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec4 a = texture2D(uCover, fit(vUv, uCoverAspect, uPlaneAspect));
  vec4 b = texture2D(uAlt, fit(vUv, uAltAspect, uPlaneAspect));
  gl_FragColor = vec4(mix(a.rgb, b.rgb, uMix), 1.0);
}`;

/** Rounded rectangle for the "Coming Soon" chip: light grey, radius 4. */
const chipFrag = /* glsl */ `
uniform vec2 uSize;
uniform float uRadius;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = abs(p) - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) - uRadius;
  float a = 1.0 - smoothstep(-0.5, 0.5, d);
  gl_FragColor = vec4(vec3(240.0 / 255.0), 0.9 * a);
}`;

export class ProjectsScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly content = new THREE.Group();
  private glass: EdgeGlass;
  private cards: Card[] = [];
  private texts: Text[] = [];
  private geo = new THREE.PlaneGeometry(1, 1);
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private width = 1;
  private height = 1;
  private target = 0;
  private current = 0;
  private maxScroll = 0;
  private velocity = 0;
  private lastY = 0;
  private touchV = 0;
  private hovered: Card | null = null;
  private disposed = false;
  private tick: (t: number, dt: number) => void;
  private heading: { lead: Text; tail: Text } | null = null;
  private footer: Text | null = null;

  constructor(private canvas: HTMLCanvasElement, private projects: Project[], private opts: ProjectsOptions) {
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
    this.scene.add(this.content);
    this.glass = new EdgeGlass(this.renderer, 60, 50);
    this.glass.enabled = !opts.reducedMotion;
    this.measure();
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 100) / 1000);
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
    this.glass.resize();
  }

  get cols() {
    return this.width < 640 ? 1 : this.width <= 1024 ? 2 : 3;
  }

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

    this.heading = {
      lead: makeText(this.opts.heading.lead, { font: FONT.grotesk, size: 16, anchorY: "middle", letterSpacing: -0.02 }),
      tail: makeText(this.opts.heading.tail, { font: FONT.serif, size: 16, anchorY: "middle" }),
    };
    this.content.add(this.heading.lead, this.heading.tail);
    this.texts.push(this.heading.lead, this.heading.tail);

    this.projects.forEach((project, i) => {
      const cover = covers[i];
      const hover = hovers[i];
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uCover: { value: cover.texture },
          uAlt: { value: hover?.texture ?? cover.texture },
          uMix: { value: 0 },
          uCoverAspect: { value: cover.aspect },
          uAltAspect: { value: hover?.aspect ?? cover.aspect },
          uPlaneAspect: { value: 0.75 },
        },
        vertexShader: coverVert,
        fragmentShader: coverFrag,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      this.content.add(mesh);
      const title = makeText(project.title, { font: FONT.grotesk, size: 12, lineHeight: 1.4 });
      const cat = makeText(project.categories.join(", "), { font: FONT.serif, size: 13, lineHeight: 1.4 });
      this.content.add(title, cat);
      this.texts.push(title, cat);
      let chip: THREE.Group | null = null;
      if (project.comingSoon) {
        chip = new THREE.Group();
        const label = makeText("Coming Soon", { font: FONT.grotesk, size: 12, anchorX: "center", anchorY: "middle" });
        const bg = new THREE.Mesh(
          this.geo,
          new THREE.ShaderMaterial({
            uniforms: { uSize: { value: new THREE.Vector2(80, 23) }, uRadius: { value: 4 } },
            vertexShader: coverVert,
            fragmentShader: chipFrag,
            transparent: true,
          }),
        );
        bg.renderOrder = 1;
        label.renderOrder = 2;
        chip.add(bg, label);
        this.content.add(chip);
        this.texts.push(label);
        syncText(label).then(({ width }) => {
          const w = width + 12;
          const h = 12 * 1.4 + 6;
          bg.scale.set(w, h, 1);
          (bg.material as THREE.ShaderMaterial).uniforms.uSize.value.set(w, h);
          chip!.userData.size = { w, h };
          this.layout();
        });
      }
      this.cards.push({ project, mesh, mat, cover, hover, title, cat, chip, hovered: false });
    });

    this.footer = makeText(this.opts.footer, { font: FONT.serif, size: 13, anchorX: "center", anchorY: "bottom" });
    this.content.add(this.footer);
    this.texts.push(this.footer);

    await Promise.all(this.texts.map((t) => syncText(t)));
    this.layout();
  }

  /** Layout math from spec 7.2, in CSS px. World y is -px so the camera reads top-down. */
  layout() {
    const W = this.width;
    const cols = this.cols;
    const cardW = (W - 2 * PAD - (cols - 1) * GAP) / cols;
    const imageH = (cardW * 4) / 3;
    const rowPitch = imageH + ROW_EXTRA;

    if (this.heading) {
      const lw = this.heading.lead.textRenderInfo ? this.heading.lead.textRenderInfo.blockBounds[2] - this.heading.lead.textRenderInfo.blockBounds[0] : 0;
      const tw = this.heading.tail.textRenderInfo ? this.heading.tail.textRenderInfo.blockBounds[2] - this.heading.tail.textRenderInfo.blockBounds[0] : 0;
      const space = 16 * 0.28;
      const total = lw + space + tw;
      if (total <= W - 2 * PAD - 24) {
        const x0 = (W - total) / 2;
        this.heading.lead.position.set(x0, -HEADING_Y, 0);
        this.heading.tail.position.set(x0 + lw + space, -HEADING_Y, 0);
      } else {
        // Narrow screens: the serif phrase drops to its own line under the grotesk lead-in.
        this.heading.lead.position.set((W - lw) / 2, -(HEADING_Y - 11), 0);
        this.heading.tail.position.set((W - tw) / 2, -(HEADING_Y + 11), 0);
      }
    }

    let lastCaptionBottom = GRID_TOP;
    this.cards.forEach((card, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = PAD + col * (cardW + GAP);
      const y = GRID_TOP + row * rowPitch;
      card.mesh.position.set(x + cardW / 2, -(y + imageH / 2), 0);
      card.mesh.scale.set(cardW, imageH, 1);
      card.mat.uniforms.uPlaneAspect.value = cardW / imageH;
      const titleTop = y + imageH + TITLE_GAP;
      card.title.position.set(x, -titleTop, 1);
      card.cat.position.set(x, -(titleTop + CAT_GAP), 1);
      lastCaptionBottom = titleTop + CAT_GAP + 13 * 1.4;
      if (card.chip) {
        const size = card.chip.userData.size as { w: number; h: number } | undefined;
        const w = size?.w ?? 80;
        const h = size?.h ?? 23;
        card.chip.position.set(x + 8 + w / 2, -(y + 8 + h / 2), 2);
      }
    });

    const footerY = lastCaptionBottom + AFTER_GRID + 13 * 1.4;
    if (this.footer) this.footer.position.set(W / 2, -footerY, 1);
    const contentH = footerY + FOOTER_BOTTOM;
    this.maxScroll = Math.max(0, contentH - this.height);
    this.target = THREE.MathUtils.clamp(this.target, 0, this.maxScroll);
  }

  resize() {
    this.measure();
    this.layout();
  }

  // ---------------------------------------------------------------- scroll (spec 7.3)

  wheel(deltaY: number) {
    this.target = THREE.MathUtils.clamp(this.target + deltaY, 0, this.maxScroll);
  }

  touchStart(y: number) {
    this.lastY = y;
    this.touchV = 0;
  }

  touchMove(y: number) {
    this.touchV = this.lastY - y;
    this.target = THREE.MathUtils.clamp(this.target + this.touchV, 0, this.maxScroll);
    this.lastY = y;
  }

  touchEnd() {
    this.target = THREE.MathUtils.clamp(this.target + this.touchV * 12, 0, this.maxScroll);
  }

  // ---------------------------------------------------------------- hover

  private pick(clientX: number, clientY: number): Card | null {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObjects(this.cards.map((c) => c.mesh), false);
    if (!hits.length) return null;
    return this.cards.find((c) => c.mesh === hits[0].object) ?? null;
  }

  pointer(clientX: number, clientY: number) {
    if (!this.cards.length) return;
    const card = this.pick(clientX, clientY);
    if (card === this.hovered) return;
    if (this.hovered) this.setHover(this.hovered, false);
    this.hovered = card;
    if (card) this.setHover(card, true);
    this.opts.onHover(card?.project ?? null);
  }

  leave() {
    if (this.hovered) this.setHover(this.hovered, false);
    this.hovered = null;
    this.opts.onHover(null);
  }

  private setHover(card: Card, on: boolean) {
    card.hovered = on;
    const v = card.hover?.video;
    if (on && v) void v.play().catch(() => undefined);
    gsap.to(card.mat.uniforms.uMix, {
      value: on ? 1 : 0,
      duration: 0.25,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: () => {
        if (!on && v) v.pause();
      },
    });
  }

  projectAt(clientX: number, clientY: number): Project | null {
    return this.pick(clientX, clientY)?.project ?? null;
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    // lerp 0.1 per frame at 60fps, expressed in time so slow frames do not slow the scroll
    this.current += (this.target - this.current) * (1 - Math.pow(0.9, dt * 60));
    this.velocity = this.target - this.current;
    this.content.position.y = this.current;
    this.glass.setVelocity(Math.abs(this.velocity) / 400);
    this.glass.render(this.scene, this.camera);
  }

  setVisible(on: boolean) {
    this.cards.forEach((c) => {
      const v = c.hover?.video;
      if (!v) return;
      if (on && c.hovered) void v.play().catch(() => undefined);
      else v.pause();
    });
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    this.cards.forEach((c) => {
      gsap.killTweensOf(c.mat.uniforms.uMix);
      c.mat.dispose();
      c.cover.dispose();
      c.hover?.dispose();
      if (c.chip) (c.chip.children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material.dispose();
    });
    this.texts.forEach((t) => t.dispose());
    this.geo.dispose();
    this.glass.dispose();
    this.renderer.dispose();
  }
}
