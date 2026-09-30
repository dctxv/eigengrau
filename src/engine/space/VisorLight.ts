import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { ADD } from "@/engine/items/look";
import type { RoomScene } from "./RoomScene";

/**
 * Light on Urchi's visor from what it holds (the pocket universe): a soft glow over the visor, violet
 * going gold, brightest low down where the light comes up from its hands, `strength` at most, eased
 * in over `in` seconds and out over `out`. `wide` and `tall` of the eyes' reach across and up, and
 * `low` of it below them. In the room's cells, as everything afloat is.
 */
const VISOR = { strength: 0.45, in: 0.8, out: 1.2, wide: 2.6, tall: 2.1, low: 0.35, violet: "#b69cff", gold: "#ffdc9a" };

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const fragmentShader = /* glsl */ `
uniform vec3 uViolet;
uniform vec3 uGold;
uniform float uStrength;
uniform float uCell;
uniform vec2 uGrid;
uniform vec4 uBox;
varying vec2 vUv;
void main() {
  // taken at the middle of this fragment's cell (the room's pixelation), from the box's middle
  vec2 frag = uCell > 0.0 ? (floor(gl_FragCoord.xy / uCell) + 0.5) * uCell : gl_FragCoord.xy;
  vec2 q = (frag - uBox.xy) / uBox.zw;
  float a = exp(-dot(q, q) * 2.6) * (0.55 + 0.45 * smoothstep(0.7, -0.7, q.y)) * uStrength;
  gl_FragColor = vec4(mix(uViolet, uGold, smoothstep(0.4, -0.6, q.y)), a);
}`;

export class VisorLight {
  private readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly u = { uViolet: { value: rawColor(VISOR.violet) }, uGold: { value: rawColor(VISOR.gold) }, uStrength: { value: 0 }, uCell: { value: 0 }, uGrid: { value: new THREE.Vector2(1, 1) }, uBox: { value: new THREE.Vector4() } };
  private lit = 0;

  constructor(private readonly room: RoomScene) {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: this.u, transparent: true, depthTest: false, depthWrite: false, ...ADD }));
    // over Urchi, under what it holds
    this.mesh.renderOrder = 0.3;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    room.scene.add(this.mesh);
  }

  /** A frame: `on` while what lights it is held. */
  frame(dt: number, on: boolean) {
    this.lit += ((on ? 1 : 0) - this.lit) * (1 - Math.exp(-dt / (on ? VISOR.in : VISOR.out)));
    const room = this.room, afloat = !!room.float;
    this.mesh.visible = afloat && this.lit > 0.003;
    if (!this.mesh.visible) return;
    const e = room.eyes(), c = room.renderer.domElement, sx = c.width / room.width, sy = c.height / room.height;
    const w = e.reach * VISOR.wide, h = e.reach * VISOR.tall, x = e.x, y = e.y - e.reach * VISOR.low;
    this.u.uStrength.value = VISOR.strength * this.lit;
    this.u.uCell.value = room.pixelCell;
    this.u.uBox.value.set((x + room.width / 2) * sx, (y + room.height / 2) * sy, (w / 2) * sx, (h / 2) * sy);
    this.mesh.position.set(x, y, 0);
    this.mesh.scale.set(w * 1.6, h * 1.6, 1);
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
