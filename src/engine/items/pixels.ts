import * as THREE from "three";

/**
 * An item drawn pixelated (Item.pixel): the scene drawn small, into a picture a cell of it to a
 * pixel, then that picture laid over the view with each of its pixels a square cell, hard edged.
 * What the picture covers it covers, and its glows are added over what is behind (see look.ts ADD),
 * so it sits on whatever the host draws behind it as the smooth item would. The host keeps one and
 * disposes it.
 */
export class Pixelated {
  private readonly target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  private readonly quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly stage = new THREE.Scene();
  private readonly lens = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly clear = new THREE.Color();

  constructor() {
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: this.target.texture } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: `uniform sampler2D uMap; varying vec2 vUv; void main() { gl_FragColor = texture2D(uMap, vUv); }`,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.quad.frustumCulled = false;
    this.stage.add(this.quad);
  }

  /**
   * `scene` through `camera` into the view at x, y (from the bottom left), w by h (CSS px, as the
   * renderer's viewport takes them), pixelated in cells `cell` device px square. The view's last
   * part of a cell, where it does not divide evenly, is left empty.
   */
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, x: number, y: number, w: number, h: number, cell: number) {
    const ratio = renderer.getPixelRatio(), across = Math.max(1, Math.floor((w * ratio) / cell)), up = Math.max(1, Math.floor((h * ratio) / cell));
    this.target.setSize(across, up);
    const was = renderer.getRenderTarget(), wasAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clear);
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(was);
    renderer.setClearColor(this.clear, wasAlpha);
    renderer.setViewport(x, y, (across * cell) / ratio, (up * cell) / ratio);
    renderer.render(this.stage, this.lens);
  }

  dispose() {
    this.target.dispose();
    this.quad.geometry.dispose();
    this.quad.material.dispose();
  }
}
