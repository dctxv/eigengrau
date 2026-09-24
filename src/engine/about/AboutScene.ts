import * as THREE from "three";
import gsap from "gsap";
import type { Text } from "troika-three-text";
import { makeRenderer } from "@/engine/common/loader";
import { FONT, makeText, syncText } from "@/engine/common/text";

export type AboutOptions = {
  statement: string[];
  mark?: { line: number; after: string };
  current: string;
  reducedMotion?: boolean;
};

/** The object's plane, in CSS px: about 150 x 220 on the reference. */
const BLOB_W = 170;
const BLOB_H = 240;

const blobVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * A chrome object made of soft merged blobs (spec 10), raymarched inside a
 * small plane. The environment is procedural: a bright studio softbox above,
 * a dark floor band, a thin rim below, so it reads as near-mirror metal.
 */
const blobFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uAspect;
uniform vec2  uTilt;
varying vec2 vUv;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
  float t = uTime;
  float d = 1e5;
  vec3 c0 = vec3(sin(t * 0.70) * 0.22, 0.30 + cos(t * 0.53) * 0.28, sin(t * 0.61) * 0.18);
  vec3 c1 = vec3(cos(t * 0.47) * 0.24, -0.34 + sin(t * 0.66 + 1.7) * 0.26, cos(t * 0.52) * 0.16);
  vec3 c2 = vec3(sin(t * 0.58 + 3.1) * 0.26, cos(t * 0.44 + 0.6) * 0.34, sin(t * 0.73 + 2.0) * 0.20);
  vec3 c3 = vec3(cos(t * 0.39 + 1.1) * 0.20, sin(t * 0.81 + 2.4) * 0.52, cos(t * 0.46 + 1.3) * 0.12);
  d = smin(d, length(p - c0) - (0.40 + 0.04 * sin(t * 0.9)), 0.32);
  d = smin(d, length(p - c1) - (0.38 + 0.04 * cos(t * 1.1)), 0.32);
  d = smin(d, length(p - c2) - (0.30 + 0.03 * sin(t * 0.7 + 1.0)), 0.32);
  d = smin(d, length(p - c3) - (0.26 + 0.03 * cos(t * 0.8 + 2.0)), 0.32);
  return d;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

vec3 env(vec3 r) {
  // studio: a softbox overhead, a dark band at the horizon, a bright floor bounce
  float up = r.y;
  float soft = smoothstep(0.05, 0.55, up);                      // softbox overhead
  float horizon = 1.0 - smoothstep(0.0, 0.22, abs(up + 0.1));   // dark band at the horizon
  float floorB = smoothstep(-0.95, -0.45, -up) * 0.5;           // floor bounce, dimmer than the sky
  float side = pow(abs(r.x), 8.0) * 0.7;                        // two rim lights
  float stripe = smoothstep(0.55, 0.6, up) * (1.0 - smoothstep(0.62, 0.67, up)) * 0.6; // a hard edge on the softbox
  float v = 0.04 + soft * 0.96 + floorB + side - horizon * 0.7 - stripe;
  return vec3(clamp(v, 0.02, 1.0));
}

mat3 rot(vec2 t) {
  float cx = cos(t.y), sx = sin(t.y), cy = cos(t.x), sy = sin(t.x);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx);
  mat3 ry = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy);
  return ry * rx;
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uAspect;
  mat3 R = rot(uTilt);
  vec3 ro = R * vec3(p * 1.0, 3.0);
  vec3 rd = R * vec3(0.0, 0.0, -1.0);
  float t = 0.0;
  float minD = 1e5;
  bool hit = false;
  vec3 pos;
  for (int i = 0; i < 72; i++) {
    pos = ro + rd * t;
    float d = map(pos);
    minD = min(minD, d);
    if (d < 0.0015) { hit = true; break; }
    t += d * 0.9;
    if (t > 7.0) break;
  }
  if (!hit) {
    float aa = 1.0 - smoothstep(0.0, 0.012, minD);
    gl_FragColor = vec4(vec3(0.6), aa * 0.9);
    return;
  }
  vec3 n = normalAt(pos);
  vec3 v = -rd;
  vec3 r = reflect(-v, n);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 col = env(r) * (0.82 + 0.18 * fres);
  // a crisp highlight from the softbox
  float spec = pow(max(dot(r, normalize(vec3(0.3, 0.9, 0.4))), 0.0), 60.0);
  col += spec * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`;

export class AboutScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  private lines: Text[] = [];
  private mark: Text | null = null;
  private current: Text | null = null;
  private blob: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private width = 1;
  private height = 1;
  private tilt = new THREE.Vector2();
  private targetTilt = new THREE.Vector2();
  private tick: (t: number, dt: number) => void;
  private disposed = false;
  private clock = 0;
  private ready = false;

  constructor(private canvas: HTMLCanvasElement, private opts: AboutOptions) {
    this.renderer = makeRenderer(canvas);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.z = 10;
    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uAspect: { value: BLOB_W / BLOB_H }, uTilt: { value: this.tilt } },
        vertexShader: blobVert,
        fragmentShader: blobFrag,
        transparent: true,
      }),
    );
    this.blob.renderOrder = 5;
    this.blob.scale.set(BLOB_W, BLOB_H, 1);
    this.blob.visible = false;
    this.scene.add(this.blob);
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
    this.blob.visible = true;
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
    // The object sits over the middle of the paragraph, a touch right of centre.
    this.blob.position.set(this.width / 2 + size * 0.9, -(this.lineY(1) + pitch * 0.15), 2);
    const s = Math.min(1, this.width / 900);
    this.blob.scale.set(BLOB_W * s, BLOB_H * s, 1);
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
    this.blob.material.uniforms.uTime.value = 0;
    this.blob.scale.multiplyScalar(0.001);
    const s = Math.min(1, this.width / 900);
    gsap.to(this.blob.scale, { x: BLOB_W * s, y: BLOB_H * s, duration: this.opts.reducedMotion ? 0 : 1.1, ease: "power3.out", delay: 0.4 });
  }

  pointer(clientX: number, clientY: number) {
    this.targetTilt.set((clientX / this.width - 0.5) * 0.25, (clientY / this.height - 0.5) * 0.18);
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
    this.clock += this.opts.reducedMotion ? 0 : dt;
    this.blob.material.uniforms.uTime.value = this.clock;
    this.tilt.lerp(this.targetTilt, 1 - Math.pow(0.05, dt));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.killTweensOf(this.blob.scale);
    this.lines.forEach((l) => l.dispose());
    this.mark?.dispose();
    this.current?.dispose();
    this.blob.geometry.dispose();
    this.blob.material.dispose();
    this.renderer.dispose();
  }
}
