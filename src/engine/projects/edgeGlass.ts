import * as THREE from "three";

/** Which pair of edges bends: "y" for the top and bottom rims, "x" for the left and right. */
export type GlassAxis = "y" | "x";

/**
 * The "liquid glass" rims (spec 9): the scene is rendered to a target, then a
 * full-screen quad stretches the two edge bands toward their edge, folds the
 * mapping at the lip into streaks along the axis and splits the channels.
 * The axis is a uniform, so the horizon can turn the rims to its sides.
 */
const frag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform vec2  uRes;
uniform float uDpr;
uniform float uA;
uniform float uB;
uniform float uAxis;
uniform float uStrength;
uniform float uDispersion;
uniform float uVelocity;
in vec2 vUv;
out vec4 fragColor;

float band(float distPx, float size) { return clamp(1.0 - distPx / size, 0.0, 1.0); }

void main() {
  // uAxis 0: the bands are the top (A) and bottom (B); 1: the left (A) and right (B).
  vec2  ax = mix(vec2(0.0, 1.0), vec2(1.0, 0.0), uAxis);
  float L  = dot(uRes, ax) / uDpr;
  float p  = dot(vUv, ax) * L;
  float dA = mix(L - p, p, uAxis);
  float dB = mix(p, L - p, uAxis);

  float kA = pow(band(dA, uA), 2.4);
  float kB = pow(band(dB, uB), 2.4);
  float bend = uStrength * (1.0 + 0.5 * uVelocity);

  // the sample moves away from its edge, so the band stretches toward it
  float offA = kA * bend * (uA / L) * mix(-1.0, 1.0, uAxis);
  float offB = kB * bend * (uB / L) * mix(1.0, -1.0, uAxis);
  vec2  d    = ax * (offA + offB);
  float k    = max(kA, kB);

  // a whisper of blur along the axis inside the band keeps the streaks from looking crisp
  vec2 blur = ax * (k * 2.0 * uDpr / dot(uRes, ax));
  float split = uDispersion * k;
  vec2 uvR = vUv + d * (1.0 + split);
  vec2 uvG = vUv + d;
  vec2 uvB = vUv + d * (1.0 - split);
  float r = (texture(tScene, uvR).r + texture(tScene, uvR + blur).r + texture(tScene, uvR - blur).r) / 3.0;
  float g = (texture(tScene, uvG).g + texture(tScene, uvG + blur).g + texture(tScene, uvG - blur).g) / 3.0;
  float b = (texture(tScene, uvB).b + texture(tScene, uvB + blur).b + texture(tScene, uvB - blur).b) / 3.0;
  fragColor = vec4(r, g, b, 1.0);
}`;

const vert = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export class EdgeGlass {
  private target: THREE.WebGLRenderTarget;
  private quadScene = new THREE.Scene();
  private quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: THREE.ShaderMaterial;
  enabled = true;

  /** `a` is the top (or left) band in px, `b` the bottom (or right). */
  constructor(private renderer: THREE.WebGLRenderer, a = 60, b = 50, axis: GlassAxis = "y") {
    const size = renderer.getSize(new THREE.Vector2());
    const dpr = renderer.getPixelRatio();
    this.target = new THREE.WebGLRenderTarget(Math.max(1, size.x * dpr), Math.max(1, size.y * dpr), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tScene: { value: this.target.texture },
        uRes: { value: new THREE.Vector2(size.x * dpr, size.y * dpr) },
        uDpr: { value: dpr },
        uA: { value: a },
        uB: { value: b },
        uAxis: { value: axis === "x" ? 1 : 0 },
        uStrength: { value: 1.0 },
        uDispersion: { value: 0.35 },
        uVelocity: { value: 0 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.quadScene.add(quad);
  }

  resize() {
    const size = this.renderer.getSize(new THREE.Vector2());
    const dpr = this.renderer.getPixelRatio();
    this.target.setSize(Math.max(1, Math.round(size.x * dpr)), Math.max(1, Math.round(size.y * dpr)));
    this.material.uniforms.uRes.value.set(size.x * dpr, size.y * dpr);
    this.material.uniforms.uDpr.value = dpr;
  }

  setAxis(axis: GlassAxis) {
    this.material.uniforms.uAxis.value = axis === "x" ? 1 : 0;
  }

  setVelocity(v: number) {
    this.material.uniforms.uVelocity.value = THREE.MathUtils.clamp(v, 0, 1);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    if (!this.enabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      return;
    }
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
  }
}
