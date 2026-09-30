import * as THREE from "three";
import { facets, faceted, halo, haze, part, release, specks, type Item } from "./look";
import { glowLines, type GlowLine } from "./lines";

/**
 * The calf and how it swims. It swims in place, as a whale hangs in open water: its tail stroking
 * once in `stroke` seconds (`fluke` radians each way, its body rocking `rock` against it), its heading
 * swinging slowly through every way on waves that never fall in step (`yaw` and `pitch`, each
 * [how far, how often] pairs, summed), banking `bank` into its turns, and drifting `drift` about
 * the middle. Its constellations: pale blue dots on its back twinkling at `twinkle`, joined by faint
 * lines.
 */
const CALF = {
  stroke: 3.6,
  fluke: 0.38,
  rock: 0.035,
  yaw: [[1.5, 0.061, 0.4], [0.9, 0.113, 1.9], [0.35, 0.29, 3.1]],
  pitch: [[0.42, 0.083, 0.7], [0.2, 0.17, 2.2]],
  bank: 2.2,
  drift: [0.12, 0.07, 0.1],
  twinkle: 1.1,
};

/** Its body's round: from its nose (+x) to where its tail begins, how far out it is (a lathe's profile, length along y). */
const PROFILE: [number, number][] = [
  [0, 0.44],
  [0.15, 0.42],
  [0.25, 0.35],
  [0.3, 0.22],
  [0.31, 0.06],
  [0.28, -0.1],
  [0.2, -0.24],
  [0.11, -0.36],
  [0.065, -0.44],
  [0, -0.46],
];
/** How tall and how wide it is against its round, and how flat underneath. */
const BODY = { tall: 0.92, wide: 1, flat: 0.84 };

/** How far out its round is at `x` along it. */
function roundAt(x: number) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [r0, y0] = PROFILE[i - 1], [r1, y1] = PROFILE[i];
    if (x <= y0 && x >= y1) return r0 + ((r1 - r0) * (x - y0)) / (y1 - y0);
  }
  return 0;
}

/** A point just off its skin: `x` along it, `from` degrees round from the top of its back (toward its left side as it goes up). */
function onSkin(x: number, from: number, off = 0.014) {
  const a = (from * Math.PI) / 180, r = roundAt(x) + off, y = Math.cos(a) * r * BODY.tall;
  return new THREE.Vector3(x, y < 0 ? y * BODY.flat : y, Math.sin(a) * r * BODY.wide);
}

/** Its body, faceted, in two: its back and sides, and its belly (the faces turned down). */
function bodyGeometry() {
  // (a lathe's profile from its bottom up, so its faces face out)
  const g = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)).reverse(), 9);
  g.rotateZ(-Math.PI / 2);
  const at = g.attributes.position;
  for (let i = 0; i < at.count; i++) {
    const y = at.getY(i) * BODY.tall;
    at.setXYZ(i, at.getX(i), y < 0 ? y * BODY.flat : y, at.getZ(i) * BODY.wide);
  }
  const f = faceted(g), pos = f.attributes.position, nrm = f.attributes.normal;
  const back: number[] = [], belly: number[] = [];
  for (let k = 0; k < pos.count; k += 3) {
    const down = (nrm.getY(k) + nrm.getY(k + 1) + nrm.getY(k + 2)) / 3 < -0.12;
    for (let j = 0; j < 3; j++) (down ? belly : back).push(pos.getX(k + j), pos.getY(k + j), pos.getZ(k + j));
  }
  f.dispose();
  const make = (v: number[]) => {
    const b = new THREE.BufferGeometry();
    b.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    b.computeVertexNormals();
    return b;
  };
  return { back: make(back), belly: make(belly) };
}

/** A fin from its outline (x back from its root, z out), a little thick, flat along its own plane. */
function finGeometry(outline: [number, number][], thick = 0.03) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2);
  g.rotateX(Math.PI / 2);
  return faceted(g);
}

/** Its constellations: each a run of dots on its back (x along, degrees round), joined in order. */
const STARS: [number, number][][] = [
  [[0.27, -16], [0.15, 8], [0.04, -12], [-0.08, 12], [-0.2, -2]],
  [[0.12, 42], [0.0, 56], [-0.12, 44], [-0.02, 34]],
  [[0.08, -46], [-0.06, -40]],
];

/** A constellation's line: along its skin between its dots, just off it. */
function starLine(dots: [number, number][]): GlowLine {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < dots.length - 1; i++)
    for (let k = 0; k < 6; k++) {
      const f = k / 6, [x0, a0] = dots[i], [x1, a1] = dots[i + 1];
      pts.push(onSkin(x0 + (x1 - x0) * f, a0 + (a1 - a0) * f, 0.01));
    }
  pts.push(onSkin(...dots[dots.length - 1], 0.01));
  return { pts, width: 0.012 };
}

const sum = (waves: number[][], t: number) => waves.reduce((s, [far, often, from]) => s + far * Math.sin(often * t + from), 0);

/**
 * Star whale calf (top, a creature): a round, deep navy calf with a pale belly and small fins,
 * pale blue dots glowing along its back, joined by faint lines into constellations. It swims in
 * place as a whale hangs in open water, heavy and calm: its flukes stroking slowly, its heading
 * swinging round through every way, near and far as much as across, banking into its turns.
 */
export function makeWhaleCalf(): Item {
  const { back, belly } = bodyGeometry();
  const navy = facets("#23346a", "#070b1e", 0.45), pale = facets("#dbe3f5", "#7584ad", 0.35);
  const whale = new THREE.Group();
  whale.add(part(back, navy, 30, 0.14), part(belly, pale, 30, 0.18));
  // its flukes, on a hinge where its tail begins, stroking up and down
  const tail = new THREE.Group();
  tail.position.set(-0.43, 0.01, 0);
  const flukes = part(finGeometry([[0.02, 0.05], [-0.1, 0.26], [-0.24, 0.3], [-0.16, 0.08], [-0.2, 0], [-0.16, -0.08], [-0.24, -0.3], [-0.1, -0.26], [0.02, -0.05]], 0.05), navy, 30, 0.2);
  flukes.rotation.z = 0.18;
  tail.add(flukes);
  whale.add(tail);
  // its small fins, low on its sides, paddling a little
  const fins = [-1, 1].map((side) => {
    const hinge = new THREE.Group();
    hinge.position.set(0.12, -0.13, side * 0.25);
    const fin = part(finGeometry([[0.04, 0], [-0.14, side * 0.16], [-0.07, 0]], 0.035), navy, 30, 0.2);
    hinge.add(fin);
    hinge.rotation.x = side * -0.5;
    whale.add(hinge);
    return { hinge, side };
  });
  // its eyes: small and dark, a glint in each
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), facets("#1a1d2a", "#050608", 0.3));
    // (low, where its dark back meets its pale belly, so it shows)
    eye.position.set(0.3, -0.06, side * 0.24);
    const shine = new THREE.Mesh(new THREE.OctahedronGeometry(0.01), facets("#ffffff", "#dfe8ff", 0));
    shine.position.set(0.012, 0.012, side * 0.02);
    eye.add(shine);
    whale.add(eye);
  }
  // its constellations: the dots (and a soft glow about each), the faint lines between
  const dotsAt = STARS.flat().map(([x, a]) => onSkin(x, a));
  const dots = specks(dotsAt.length, false, true), glows = specks(dotsAt.length, true, true);
  dotsAt.forEach((p, i) => {
    for (const s of [dots, glows]) {
      s.positions.set([p.x, p.y, p.z], i * 3);
      s.colours.set([0.78, 0.9, 1], i * 3);
    }
    dots.sizes[i] = 0.032;
    glows.sizes[i] = 0.1;
  });
  const lines = glowLines(STARS.map(starLine), { core: "#d8ecff", glow: "#7fb8ff", spread: 2.4, depthTest: true, shade: `float shade(float along, float line, float bent) { return 0.4; }` });
  whale.add(glows.points, lines.mesh, dots.points);
  const phases = dotsAt.map((_, i) => i * 1.7);

  const body = new THREE.Group();
  body.add(whale);
  whale.scale.setScalar(1.18);
  const glow = halo("#6f9cff", 2.2, 0.05);
  const under = haze("#8fb2ff", 1.7, 0.05);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);

  const turn = new THREE.Euler(0, 0, 0, "YXZ");
  const pose = (t: number) => {
    const stroke = Math.sin((Math.PI * 2 * t) / CALF.stroke);
    tail.rotation.z = CALF.fluke * stroke;
    fins.forEach((f) => (f.hinge.rotation.x = f.side * (-0.5 + 0.15 * Math.sin((Math.PI * 2 * t) / CALF.stroke + 1))));
    // its heading, swinging slowly; its bank into the swing; its body rocking against its stroke
    const yaw = sum(CALF.yaw, t), pitch = sum(CALF.pitch, t), swing = (sum(CALF.yaw, t + 0.5) - sum(CALF.yaw, t - 0.5));
    whale.rotation.z = CALF.rock * stroke;
    body.quaternion.setFromEuler(turn.set(pitch, yaw, -CALF.bank * swing * 0.25));
    body.position.set(CALF.drift[0] * Math.sin(0.05 * t), CALF.drift[1] * Math.sin(0.07 * t + 1), CALF.drift[2] * Math.sin(0.043 * t + 2));
    dotsAt.forEach((_, i) => {
      const tw = 0.7 + 0.3 * Math.sin(t * CALF.twinkle + phases[i]);
      dots.alphas[i] = tw;
      glows.alphas[i] = 0.35 * tw;
    });
    dots.changed();
    glows.changed();
  };
  pose(0);

  return {
    object: root,
    update(_dt, t) {
      pose(t);
    },
    dispose() {
      release(root);
    },
  };
}
