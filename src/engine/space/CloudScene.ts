import * as THREE from "three";
import gsap from "gsap";
import type { SpaceItem } from "@/content/site";
import { loadAll, makeRenderer, upload, type Loaded } from "@/engine/common/loader";
import { Resident } from "@/engine/common/resident";
import { sfx } from "@/audio/sfx";

/** One flat, unlit, billboarded plane per piece (spec 6.1). */
export type CloudItem = {
  source: SpaceItem;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  mat: THREE.ShaderMaterial;
  aspect: number;
  /** Rest height in world units. */
  base: number;
  home: THREE.Vector3;
  loaded: Loaded;
  /** Ring slot index, or -1 when the item only appears at the explode. */
  ring: number;
  /** 0..1 progress of the ring pop-in / explode tweens. */
  t: number;
  start: THREE.Vector3;
  startScale: THREE.Vector2;
};

export type CloudOptions = {
  reducedMotion?: boolean;
};

const FOV = 35;
const CAMERA_Z = 6;
const BASE = 0.34; // rest height, world units: about 80px at depth 0 on the reference viewport
const SPHERE = { rx: 1.05, ry: 1.12, rz: 1.4 };
const RING_COUNT = 12;
const RING_PX = { r0: 255, r1: 265, thumb: 60 };
const IDLE = 0.13; // rad/s, about 7.5 degrees per second
const FOCUS_Z = 3.2;
const FOCUS_H = 0.7;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const Y_AXIS = new THREE.Vector3(0, 1, 0);
/** The resident's plane in CSS px at depth 0, and its phone size. */
const RESIDENT_PX = { w: 120, h: 140 };
const RESIDENT_PX_PHONE = { w: 88, h: 104 };
const PHONE = 640;
const DIM_FADE = 0.15;

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Fade and a cheap 9-tap blur, so out-of-focus items blur like depth of field. */
const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
uniform float uBlur;
varying vec2 vUv;
void main() {
  vec4 c;
  if (uBlur < 0.001) {
    c = texture2D(uMap, vUv);
  } else {
    float r = uBlur * 0.06;
    c = texture2D(uMap, vUv) * 0.2;
    c += texture2D(uMap, vUv + vec2( r, 0.0)) * 0.1;
    c += texture2D(uMap, vUv + vec2(-r, 0.0)) * 0.1;
    c += texture2D(uMap, vUv + vec2(0.0,  r)) * 0.1;
    c += texture2D(uMap, vUv + vec2(0.0, -r)) * 0.1;
    float d = r * 0.7071;
    c += texture2D(uMap, vUv + vec2( d,  d)) * 0.1;
    c += texture2D(uMap, vUv + vec2(-d,  d)) * 0.1;
    c += texture2D(uMap, vUv + vec2( d, -d)) * 0.1;
    c += texture2D(uMap, vUv + vec2(-d, -d)) * 0.1;
  }
  gl_FragColor = vec4(c.rgb, uFade);
}`;

export class CloudScene {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly group = new THREE.Group();
  /** At the origin, never rotates, copies the cloud's fit scale: the resident's room. */
  readonly residentGroup = new THREE.Group();
  readonly resident: Resident;
  readonly items: CloudItem[] = [];
  private geo = new THREE.PlaneGeometry(1, 1);
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private sources: SpaceItem[];
  private opts: CloudOptions;
  private disposed = false;
  private loaded = false;

  // Motion state (spec 6.4)
  state: "hidden" | "ring" | "exploded" = "hidden";
  private angle = 0;
  private vel = 0;
  private yaw = 0;
  private targetYaw = 0;
  private lastTickAngle = 0;
  private rotFactor = 0; // 0 while the ring is up, ramps to 1 at the explode
  private rotating = true;
  private ringAngle = 0;
  private ringRadius = RING_PX.r0;
  private ringTween: gsap.core.Tween | null = null;

  focused: CloudItem | null = null;
  overview = false;
  private width = 1;
  private height = 1;
  private tmpQ = new THREE.Quaternion();
  private tick: (time: number, dt: number) => void;

  constructor(canvas: HTMLCanvasElement, sources: SpaceItem[], opts: CloudOptions = {}) {
    this.canvas = canvas;
    this.sources = sources;
    this.opts = opts;
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    this.camera.position.z = CAMERA_Z;
    this.scene.add(this.group);
    // Depth mode: the body writes gl_FragDepth so pieces sort in front of and behind it.
    this.resident = new Resident({ aspect: RESIDENT_PX.w / RESIDENT_PX.h, steps: 48, depth: true, reducedMotion: opts.reducedMotion });
    this.resident.uniforms.uProj.value = this.camera.projectionMatrix;
    this.resident.mesh.renderOrder = 0;
    this.residentGroup.add(this.resident.mesh);
    this.scene.add(this.residentGroup);
    this.resize();
    this.tick = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.tick);
  }

  // ---------------------------------------------------------------- loading

  /** Loads and uploads every texture. `onProgress` drives the counter (spec 5.3). */
  async load(onProgress?: (p: number) => void): Promise<void> {
    const loaded = await loadAll(
      this.sources.map((s) => s.media),
      onProgress,
    );
    if (this.disposed) {
      loaded.forEach((l) => l.dispose());
      return;
    }
    const n = this.sources.length;
    const ringStride = n / RING_COUNT;
    const ringIndices = new Set<number>();
    for (let k = 0; k < RING_COUNT; k++) ringIndices.add(Math.round(k * ringStride) % n);
    let ringSlot = 0;
    this.sources.forEach((source, i) => {
      const l = loaded[i];
      const y = 1 - (i / (n - 1)) * 2; // fibonacci sphere: even spread, no clumps
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const t = GOLDEN * i;
      const home = new THREE.Vector3(Math.cos(t) * r * SPHERE.rx, y * SPHERE.ry, Math.sin(t) * r * SPHERE.rz);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: l.texture }, uFade: { value: 1 }, uBlur: { value: 0 } },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      const variation = 0.85 + ((i * 7919) % 100) / 100 * 0.4; // deterministic 0.85 .. 1.25
      const base = BASE * variation;
      const aspect = source.aspect || l.aspect;
      mesh.scale.set(0, 0, 1);
      mesh.position.copy(home);
      mesh.visible = false;
      this.group.add(mesh);
      this.items.push({
        source, mesh, mat, aspect, base, home, loaded: l,
        ring: ringIndices.has(i) ? ringSlot++ : -1,
        t: 0, start: new THREE.Vector3(), startScale: new THREE.Vector2(),
      });
    });
    upload(this.renderer, loaded);
    // One warm-up frame compiles the programs before anything is visible.
    this.renderer.compile(this.scene, this.camera);
    this.loaded = true;
    this.playVideos(true);
  }

  private playVideos(on: boolean) {
    this.items.forEach((it) => {
      const v = it.loaded.video;
      if (!v) return;
      if (on) void v.play().catch(() => undefined);
      else v.pause();
    });
  }

  // ---------------------------------------------------------------- helpers

  /** World units visible vertically at depth z. */
  visibleHeightAt(z: number) {
    const d = this.camera.position.z - z;
    return 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * d;
  }

  /** World units per CSS px at depth z. */
  unitsPerPx(z: number) {
    return this.visibleHeightAt(z) / this.height;
  }

  private setScale(it: CloudItem, h: number) {
    it.mesh.scale.set(h * it.aspect, h, 1);
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // On narrow viewports the whole cloud (and the intro ring) shrinks to fit about 80% of the width.
    const visibleW = this.visibleHeightAt(0) * this.camera.aspect;
    const fit = THREE.MathUtils.clamp((visibleW * 0.8) / (2 * SPHERE.rx + 0.5), 0.35, 1);
    this.group.scale.setScalar(fit);
    this.residentGroup.scale.setScalar(fit);
    const px = w <= PHONE ? RESIDENT_PX_PHONE : RESIDENT_PX;
    const u = this.unitsPerPx(0);
    this.resident.base.set(px.w * u, px.h * u);
    if (this.focused) this.applyFocusTransform(this.focused, 0);
  }

  // ---------------------------------------------------------------- intro phases (spec 6.2, 6.3)

  /** Thumbnails pop in near the centre and settle on a slowly turning ring around the monogram. */
  startRing() {
    if (!this.loaded) return;
    this.state = "ring";
    this.rotFactor = 0;
    this.group.rotation.y = 0;
    this.ringAngle = 0;
    this.ringRadius = RING_PX.r0;
    this.ringTween = gsap.to(this, { ringRadius: RING_PX.r1, duration: 2.6, ease: "sine.inOut" });
    this.items.forEach((it) => {
      if (it.ring < 0) return;
      it.mesh.visible = true;
      it.t = 0;
      gsap.to(it, { t: 1, duration: 0.8, ease: "power3.out", delay: 0.05 + it.ring * 0.06 });
    });
  }

  private ringSlot(it: CloudItem, out: THREE.Vector3) {
    const a = this.ringAngle + (it.ring / RING_COUNT) * Math.PI * 2;
    // In group space, so the whole ring shrinks with the fit scale on narrow screens.
    const u = this.unitsPerPx(0) * this.ringRadius;
    return out.set(Math.cos(a) * u, Math.sin(a) * u, 0);
  }

  /** Ring items fly to their sphere homes and grow; hidden items scale in at home. */
  explode(): Promise<void> {
    if (!this.loaded) return Promise.resolve();
    this.ringTween?.kill();
    this.items.forEach((it) => {
      if (it.ring >= 0) {
        it.start.copy(it.mesh.position);
        it.startScale.set(it.mesh.scale.x, it.mesh.scale.y);
      } else {
        it.start.copy(it.home);
        it.startScale.set(0, 0);
        it.mesh.visible = true;
      }
      it.t = 0;
    });
    this.state = "exploded";
    gsap.to(this, { rotFactor: 1, duration: 1.4, ease: "power2.in" });
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      this.items.forEach((it) => {
        tl.to(it, { t: 1, duration: 1.2, ease: "power3.inOut" }, Math.random() * 0.25);
      });
    });
  }

  /** No intro: everything at home, fading in together. */
  showSettled() {
    if (!this.loaded) return;
    this.state = "exploded";
    this.rotFactor = this.opts.reducedMotion ? 0 : 1;
    this.items.forEach((it) => {
      it.t = 1;
      it.mesh.visible = true;
      it.mesh.position.copy(it.home);
      this.setScale(it, it.base);
      it.mat.uniforms.uFade.value = 0;
      gsap.to(it.mat.uniforms.uFade, { value: 1, duration: 0.6, ease: "power2.out" });
    });
    this.showResident(0.6);
  }

  // ---------------------------------------------------------------- the resident

  /** The intro's handoff: scale in at the centre from nothing, eyes closed until openEyes(). */
  startResident() {
    this.resident.closeEyes();
    this.resident.scaleIn(1.1);
  }

  /** No intro: full size, eyes open, fading in with the pieces. */
  showResident(fadeSeconds: number) {
    this.resident.openEyes(0);
    this.resident.fadeIn(this.opts.reducedMotion ? 0 : fadeSeconds);
  }

  /** The room dims for the game: every piece to a low fade and a full blur, and back. */
  dim(on: boolean) {
    this.items.forEach((it) => {
      gsap.to(it.mat.uniforms.uFade, { value: on ? DIM_FADE : 1, duration: 0.6, ease: "power2.out", overwrite: true });
      gsap.to(it.mat.uniforms.uBlur, { value: on ? 1 : 0, duration: 0.6, ease: "power2.out", overwrite: true });
    });
  }

  /** Whether the pointer is on the resident's silhouette; only meaningful once pick() found no piece. */
  residentHit(clientX: number, clientY: number): boolean {
    if (this.state !== "exploded" || this.focused) return false;
    if (this.resident.appear < 0.5 || this.resident.uniforms.uFade.value < 0.5) return false;
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const { origin, direction } = this.ray.ray;
    if (Math.abs(direction.z) < 1e-6) return false;
    // The plane sits at z 0 facing the camera: solve the ray for it.
    const t = -origin.z / direction.z;
    const x = origin.x + direction.x * t;
    const y = origin.y + direction.y * t;
    const fit = this.residentGroup.scale.x;
    const w = this.resident.mesh.scale.x * fit;
    const h = this.resident.mesh.scale.y * fit;
    if (w <= 0 || h <= 0) return false;
    return this.resident.hitTest(x / w + 0.5, y / h + 0.5);
  }

  // ---------------------------------------------------------------- interaction (spec 6.4)

  /** The pointer yaws the cloud; with a y it also sets the resident's gaze. */
  setPointer(clientX: number, clientY?: number) {
    // A held piece keeps the cloud where it is.
    if (!this.focused) this.targetYaw = (clientX / this.width - 0.5) * 0.6;
    if (clientY !== undefined) this.resident.setPointer(clientX / this.width, clientY / this.height);
  }

  scrub(deltaY: number) {
    if (this.focused) return;
    this.vel += deltaY * 0.0009;
  }

  /** Item under the pointer, if any. */
  pick(clientX: number, clientY: number): CloudItem | null {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const meshes = this.items.filter((it) => it.mesh.visible && it.mat.uniforms.uFade.value > 0.5).map((it) => it.mesh);
    const hits = this.ray.intersectObjects(meshes, false);
    if (!hits.length) return null;
    const hit = hits[0].object;
    return this.items.find((it) => it.mesh === hit) ?? null;
  }

  /** The item nearest the screen centre (keyboard focus). */
  nearestToCentre(): CloudItem | null {
    let best: CloudItem | null = null;
    let bestD = Infinity;
    const v = new THREE.Vector3();
    this.items.forEach((it) => {
      if (!it.mesh.visible) return;
      it.mesh.getWorldPosition(v).project(this.camera);
      const d = v.x * v.x + v.y * v.y;
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    });
    return best;
  }

  // ---------------------------------------------------------------- focus (spec 6.5)

  private applyFocusTransform(it: CloudItem, duration: number) {
    // The seat in group space once the yaw has settled, so the piece lands centred and stays there.
    const world = new THREE.Vector3(0, this.overview ? this.unitsPerPx(FOCUS_Z) * this.height * 0.1 : 0, FOCUS_Z);
    const local = world.applyAxisAngle(Y_AXIS, -(this.angle + this.targetYaw * this.rotFactor)).divideScalar(this.group.scale.x || 1);
    const visibleH = this.visibleHeightAt(FOCUS_Z);
    const visibleW = visibleH * this.camera.aspect;
    // 70% of the viewport height, unless the piece would run past the sides (16px margin each).
    let h = visibleH * (this.overview ? FOCUS_H * 0.55 : FOCUS_H);
    h = Math.min(h, (visibleW - this.unitsPerPx(FOCUS_Z) * 32) / it.aspect);
    const s = this.group.scale.x; // mesh scale is local, so undo the group's fit scale
    gsap.to(it.mesh.position, { x: local.x, y: local.y, z: local.z, duration, ease: "power3.inOut", overwrite: true });
    gsap.to(it.mesh.scale, { x: (h * it.aspect) / s, y: h / s, duration, ease: "power3.inOut", overwrite: true });
  }

  focus(sel: CloudItem) {
    if (this.focused || this.state !== "exploded") return;
    this.focused = sel;
    this.overview = false;
    this.rotating = false;
    this.vel = 0;
    sel.mesh.renderOrder = 10;
    this.applyFocusTransform(sel, 0.9);
    this.items.forEach((it) => {
      if (it === sel) return;
      gsap.to(it.mat.uniforms.uFade, { value: 0, duration: 0.6, ease: "power2.out", overwrite: true });
      gsap.to(it.mat.uniforms.uBlur, { value: 1, duration: 0.6, ease: "power2.out", overwrite: true });
    });
    // A 70%-height piece covers the centre anyway: the resident dims with the room.
    this.resident.fade(DIM_FADE, 0.6);
    sfx.play("focus");
  }

  /** "Overview": the piece steps back to make room for its description. */
  setOverview(on: boolean) {
    if (!this.focused || this.overview === on) return;
    this.overview = on;
    this.applyFocusTransform(this.focused, 0.7);
  }

  unfocus() {
    const sel = this.focused;
    if (!sel) return;
    this.focused = null;
    this.overview = false;
    gsap.to(sel.mesh.position, { x: sel.home.x, y: sel.home.y, z: sel.home.z, duration: 0.9, ease: "power3.inOut", overwrite: true });
    gsap.to(sel.mesh.scale, {
      x: sel.base * sel.aspect, y: sel.base, duration: 0.9, ease: "power3.inOut", overwrite: true,
      onComplete: () => {
        sel.mesh.renderOrder = 0;
        this.rotating = true;
      },
    });
    this.items.forEach((it) => {
      if (it === sel) return;
      gsap.to(it.mat.uniforms.uFade, { value: 1, duration: 0.6, ease: "power2.out", delay: 0.2, overwrite: true });
      gsap.to(it.mat.uniforms.uBlur, { value: 0, duration: 0.6, ease: "power2.out", delay: 0.2, overwrite: true });
    });
    this.resident.fade(1, 0.6, 0.2);
    sfx.play("close");
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    // rotation: idle + scrub inertia + pointer yaw
    this.vel *= Math.pow(0.1, dt);
    if (this.rotating) this.angle += ((this.opts.reducedMotion ? 0 : IDLE) * this.rotFactor + this.vel) * dt;
    this.yaw += (this.targetYaw - this.yaw) * (1 - Math.pow(0.02, dt));
    this.group.rotation.y = this.angle + this.yaw * this.rotFactor;
    if (Math.abs(this.angle - this.lastTickAngle) > 0.12 && Math.abs(this.vel) > 0.05) {
      sfx.play("tick", 0.6);
      this.lastTickAngle = this.angle;
    }

    if (this.state === "ring") {
      this.ringAngle += 0.14 * dt;
      const slot = new THREE.Vector3();
      this.items.forEach((it) => {
        if (it.ring < 0) return;
        this.ringSlot(it, slot);
        const k = it.t;
        it.mesh.position.copy(slot).multiplyScalar(k);
        // Thumbs shrink less than the ring itself, so they stay legible on a phone.
        const fit = this.group.scale.x;
        const w = (this.unitsPerPx(0) * RING_PX.thumb * Math.max(fit, 0.7) * k) / fit;
        it.mesh.scale.set(w, w / it.aspect, 1);
      });
    } else if (this.state === "exploded") {
      this.items.forEach((it) => {
        if (it.t >= 1 || it === this.focused) return;
        const k = it.t;
        it.mesh.position.lerpVectors(it.start, it.home, k);
        const h = it.base;
        it.mesh.scale.set(
          THREE.MathUtils.lerp(it.startScale.x, h * it.aspect, k),
          THREE.MathUtils.lerp(it.startScale.y, h, k),
          1,
        );
      });
    }

    // billboards: cancel the group's rotation so every plane faces the camera squarely
    this.tmpQ.copy(this.group.quaternion).invert().multiply(this.camera.quaternion);
    this.items.forEach((it) => it.mesh.quaternion.copy(this.tmpQ));

    this.resident.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  setVisible(on: boolean) {
    this.playVideos(on);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    this.ringTween?.kill();
    this.items.forEach((it) => {
      gsap.killTweensOf(it);
      gsap.killTweensOf(it.mesh.position);
      gsap.killTweensOf(it.mesh.scale);
      gsap.killTweensOf(it.mat.uniforms.uFade);
      gsap.killTweensOf(it.mat.uniforms.uBlur);
      it.mat.dispose();
      it.loaded.dispose();
    });
    gsap.killTweensOf(this);
    this.resident.dispose();
    this.geo.dispose();
    this.renderer.dispose();
  }
}
