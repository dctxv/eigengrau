import * as THREE from "three";

/**
 * The "liquid glass" rims (spec 9): the scene is rendered to a target, then a
 * full-screen quad stretches the top and bottom bands toward the edge, folds
 * the mapping at the lip into vertical streaks and splits the channels.
 */
const frag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform vec2  uRes;
uniform float uDpr;
uniform float uTop;
uniform float uBottom;
uniform float uStrength;
uniform float uDispersion;
uniform float uVelocity;
in vec2 vUv;
out vec4 fragColor;

float band(float distPx, float size) { return clamp(1.0 - distPx / size, 0.0, 1.0); }

void main() {
  float H    = uRes.y / uDpr;
  float py   = vUv.y * H;
  float tTop = band(H - py, uTop);
  float tBot = band(py, uBottom);

  float kTop = pow(tTop, 2.4);
  float kBot = pow(tBot, 2.4);
  float bend = uStrength * (1.0 + 0.5 * uVelocity);

  float offTop = -kTop * bend * (uTop / H);
  float offBot =  kBot * bend * (uBottom / H);
  vec2  d      = vec2(0.0, offTop + offBot);
  float k      = max(kTop, kBot);

  // a whisper of vertical blur inside the band keeps the streaks from looking crisp
  float blur = k * 2.0 * uDpr / uRes.y;
  float split = uDispersion * k;
  vec2 uvR = vUv + d * (1.0 + split);
  vec2 uvG = vUv + d;
  vec2 uvB = vUv + d * (1.0 - split);
  float r = (texture(tScene, uvR).r + texture(tScene, uvR + vec2(0.0, blur)).r + texture(tScene, uvR - vec2(0.0, blur)).r) / 3.0;
  float g = (texture(tScene, uvG).g + texture(tScene, uvG + vec2(0.0, blur)).g + texture(tScene, uvG - vec2(0.0, blur)).g) / 3.0;
  float b = (texture(tScene, uvB).b + texture(tScene, uvB + vec2(0.0, blur)).b + texture(tScene, uvB - vec2(0.0, blur)).b) / 3.0;
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

  constructor(private renderer: THREE.WebGLRenderer, top = 60, bottom = 50) {
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
        uTop: { value: top },
        uBottom: { value: bottom },
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
