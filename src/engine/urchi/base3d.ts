/**
 * Urchi's base body (base.ts) in three.js: the parts as named meshes, each at its pivot under its
 * parent, so a host can bob, wag and swing them; painted for /dev/base as the 2D painter paints
 * the head (each facet one flat shade of near-black under a light fixed to the eye), or with
 * glTF's own materials for a .glb.
 */
import * as THREE from "three";
import { EYE_COLOURS, buildBase, type BaseParams, type Part, type PartName } from "./base";

/** The 2D painter's light, in view space (x right, y up, z toward the eye), and its curve. */
const LIGHT = new THREE.Vector3(0.18, 0.88, 0.44).normalize();
/** The head's shades, #040404 turned away to about #1C1C1C square on (the 2D painter's). */
const SKIN = { dark: 4 / 255, lit: 28 / 255 };

/**
 * A facet's shade as the 2D painter works it out: its normal in view space against the light,
 * to the power 1.2, from `dark` to `lit`. Written straight out as sRGB (no colour management), as
 * the canvas's fills are.
 */
function shaded(dark: THREE.Color, lit: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { dark: { value: dark }, lit: { value: lit }, light: { value: LIGHT } },
    vertexShader: `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 dark, lit, light;
      varying vec3 vN;
      void main() {
        float i = pow(max(0.0, dot(normalize(vN), light)), 1.2);
        gl_FragColor = vec4(mix(dark, lit, i), 1.0);
      }`,
  });
}
/** A flat colour, unlit (the eyes), sRGB as written. */
function flat(hex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { colour: { value: srgb(hex) } },
    vertexShader: "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 colour; void main() { gl_FragColor = vec4(colour, 1.0); }",
  });
}
/** A hex colour's sRGB values as they are (not into three's linear working space). */
const srgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return new THREE.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

/** The preview's materials, made once and kept (the bib's colour is a uniform). */
export type BaseLook = { skin: THREE.Material; bib: THREE.ShaderMaterial; iris: THREE.Material; pupil: THREE.Material };
export function previewLook(): BaseLook {
  const grey = (v: number) => new THREE.Color(v, v, v);
  return { skin: shaded(grey(SKIN.dark), grey(SKIN.lit)), bib: shaded(new THREE.Color(), new THREE.Color()), iris: flat(EYE_COLOURS.iris), pupil: flat(EYE_COLOURS.pupil) };
}
/** The bib's shades from its colour: square on to the light, its colour; turned away, a little over half of it. */
function setBib(look: BaseLook, hex: string) {
  const c = srgb(hex);
  look.bib.uniforms.lit.value.copy(c);
  look.bib.uniforms.dark.value.copy(c).multiplyScalar(0.58);
}

/**
 * The parts as a tree of meshes: each named as its part, at its pivot (relative to its parent's),
 * its geometry about that pivot; `scale` turns mesh units into the host's (0.001: metres, the head
 * a metre across its spikes).
 */
function tree(parts: Part[], material: (p: Part) => THREE.Material | THREE.Material[], scale: number): THREE.Group {
  const root = new THREE.Group();
  root.name = "urchi";
  const byName = new Map<PartName, { part: Part; mesh: THREE.Mesh }>();
  for (const part of parts) {
    const g = new THREE.BufferGeometry(), [px, py, pz] = part.pivot;
    const pos = Float32Array.from(part.position, (v, i) => (v - part.pivot[i % 3]) * scale);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(Float32Array.from(part.normal), 3));
    if (part.groups) { g.addGroup(0, part.groups.iris, 0); g.addGroup(part.groups.iris, part.groups.pupil, 1); }
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, material(part));
    mesh.name = part.name;
    mesh.userData.pivot = [px, py, pz];
    byName.set(part.name, { part, mesh });
  }
  for (const { part, mesh } of byName.values()) {
    const parent = part.parent ? byName.get(part.parent) : undefined, from = parent ? parent.part.pivot : [0, 0, 0];
    mesh.position.set((part.pivot[0] - from[0]) * scale, (part.pivot[1] - from[1]) * scale, (part.pivot[2] - from[2]) * scale);
    (parent ? parent.mesh : root).add(mesh);
  }
  return root;
}

/** The character for the preview, in mesh units, in the preview's look. */
export function previewBase(p: BaseParams, look: BaseLook): THREE.Group {
  setBib(look, p.bibColour);
  return tree(buildBase(p), (part) => (part.material === "eye" ? [look.iris, look.pupil] : part.material === "bib" ? look.bib : look.skin), 1);
}

/** Frees a tree's geometry (the preview's materials are kept). */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
}

/**
 * The character as a .glb: the parts as named meshes in metres (0.001 a mesh unit), at their
 * pivots, the ground at y 0, facing +z; the skin and the bib in glTF's standard material (flat
 * shaded: each facet's own normal), the eyes unlit (KHR_materials_unlit); the params it was built
 * from in the root's extras.
 */
export async function exportGlb(p: BaseParams): Promise<ArrayBuffer> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const std = (hex: string, name: string) => Object.assign(new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.85, metalness: 0, flatShading: true }), { name });
  const basic = (hex: string, name: string) => Object.assign(new THREE.MeshBasicMaterial({ color: new THREE.Color(hex) }), { name });
  const skin = std("#1a1a1a", "skin"), bib = std(p.bibColour, "bib"), iris = basic(EYE_COLOURS.iris, "iris"), pupil = basic(EYE_COLOURS.pupil, "pupil");
  const root = tree(buildBase(p), (part) => (part.material === "eye" ? [iris, pupil] : part.material === "bib" ? bib : skin), 0.001);
  root.userData = { params: p };
  const scene = new THREE.Scene();
  scene.add(root);
  const out = await new GLTFExporter().parseAsync(scene, { binary: true });
  disposeTree(root);
  for (const m of [skin, bib, iris, pupil]) m.dispose();
  return out as ArrayBuffer;
}
