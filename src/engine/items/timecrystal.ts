import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { sfx } from "@/audio/sfx";
import { facets, faceted, glint, halo, haze, part, release, type Item } from "./look";

/**
 * Its beat: one every `beat` seconds, each a move made in `move` seconds and held, snapping home
 * with a little overshoot (`snap`), as clockwork does; each glows, fading over `glow` seconds. Its
 * loop is four beats, `shapes`: the facets extend (`out` from the core, `long` times as long), fold
 * (`fold` radians, over toward the pole they lean to), fold back a little as the ring of them
 * clicks round a step (`step` radians, kept), and come home. Each beat rings the next of `notes`
 * (Hz: F, A, C, A, in the site's key), with sound on. It turns once in `turn` seconds.
 */
const CLOCK = {
  beat: 1.25,
  move: 0.42,
  snap: 1.7,
  glow: 0.3,
  shapes: [
    { out: 0, long: 1, fold: 0 },
    { out: 0.13, long: 1.35, fold: 0 },
    { out: 0.05, long: 1, fold: 1 },
    { out: 0, long: 0.85, fold: -0.3 },
  ],
  step: Math.PI / 6,
  notes: [349.23, 440, 523.25, 440],
  turn: 30,
};

/** The core: a six-sided crystal pointed at both ends. */
function coreGeometry() {
  const pts = [new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(0, -0.58, 0)];
  for (const y of [0.17, -0.17])
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + (y > 0 ? 0 : Math.PI / 6);
      pts.push(new THREE.Vector3(Math.cos(a) * 0.27, y, Math.sin(a) * 0.27));
    }
  return faceted(new ConvexGeometry(pts));
}

/** A facet: a small four-sided shard, hinged at its root (the origin), pointing along +x. */
function facetGeometry() {
  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.42, 0, 0), new THREE.Vector3(0.16, 0.06, 0), new THREE.Vector3(0.16, -0.06, 0), new THREE.Vector3(0.16, 0, 0.045), new THREE.Vector3(0.16, 0, -0.045)];
  return faceted(new ConvexGeometry(pts));
}

const easeBack = (f: number, s: number) => 1 + (s + 1) * (f - 1) ** 3 + s * (f - 1) ** 2;

/**
 * Time crystal (rare): a violet crystal with a ring of six gold facets round it, keeping time. On a
 * steady beat it runs a loop of four shapes (see CLOCK): its facets extend, fold over, fold back as
 * the ring clicks round a step, and come home; the core ticks round against them. Each beat snaps
 * into place with a little overshoot, glows, glints at a tip, and with sound on rings a note in the
 * site's key. It turns slowly.
 */
export function makeTimeCrystal(): Item {
  const coreMaterial = facets("#c7a0ff", "#3b1c78", 0.7);
  coreMaterial.uniforms.uFlashColour.value.set(0.55, 0.42, 0.85);
  const core = part(coreGeometry(), coreMaterial, 20, 0.4);
  const ring = new THREE.Group();
  const facetGeo = facetGeometry();
  const gold = facets("#ffd978", "#8a5a12", 0.6);
  gold.uniforms.uFlashColour.value.set(0.75, 0.62, 0.3);
  const facetsList = Array.from({ length: 6 }, (_, i) => {
    const up = i % 2 === 0 ? 1 : -1, a = (i / 6) * Math.PI * 2;
    // hinged on the core, pointing out and up (or down), turned to its place round the ring
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 0.23, up * 0.1, Math.sin(a) * 0.23);
    pivot.rotation.set(0, -a, up * 0.5);
    const fold = new THREE.Group(), slide = new THREE.Group();
    const mesh = part(facetGeo, gold, 20, 0.45);
    slide.add(mesh);
    fold.add(slide);
    pivot.add(fold);
    ring.add(pivot);
    return { up, fold, slide, mesh };
  });
  const glints = [0, 3].map((i) => {
    const g = glint(0.28);
    g.mesh.position.set(0.42, 0, 0);
    facetsList[i].mesh.add(g.mesh);
    return g;
  });
  const crystal = new THREE.Group();
  crystal.add(core, ring);
  const body = new THREE.Group();
  body.add(crystal);
  body.rotation.set(0.3, 0, 0.12);
  const glow = halo("#c9a2ff", 2.1, 0.05);
  const under = haze("#d8b8ff", 1.6, 0.05);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);

  let lastBeat = -1;
  const pose = (t: number, still: boolean) => {
    const k = Math.floor(t / CLOCK.beat), into = t - k * CLOCK.beat;
    const f = Math.min(1, into / CLOCK.move), e = easeBack(f, CLOCK.snap);
    const from = CLOCK.shapes[(((k - 1) % 4) + 4) % 4], to = CLOCK.shapes[((k % 4) + 4) % 4];
    const out = from.out + (to.out - from.out) * e, long = from.long + (to.long - from.long) * e, fold = from.fold + (to.fold - from.fold) * e;
    for (const p of facetsList) {
      p.fold.rotation.z = p.up * fold;
      p.slide.position.x = out;
      p.slide.scale.set(long, 1, 1);
    }
    // the ring clicks round a step as each loop's third shape comes, and keeps it; the core ticks against it
    const steps = Math.floor((k + 1) / 4), stepping = ((k % 4) + 4) % 4 === 3 ? e : 1;
    ring.rotation.y = CLOCK.step * (steps - 1 + stepping);
    core.rotation.y = -(Math.PI / 12) * (k - 1 + e);
    crystal.rotation.y = (Math.PI * 2 * t) / CLOCK.turn;
    // each beat glows, a tip glints, and (with sound on, the clock running) it rings its note
    const lit = still ? 0 : Math.exp(-into / CLOCK.glow);
    gold.uniforms.uFlash.value = 0.6 * lit;
    coreMaterial.uniforms.uFlash.value = 0.45 * lit;
    glow.strength = 0.05 + 0.2 * lit;
    glints.forEach((g, i) => (g.strength = (k % 2 === i ? 1 : 0) * lit));
    if (!still && k !== lastBeat && lastBeat >= 0) sfx.bell(CLOCK.notes[((k % 4) + 4) % 4]);
    lastBeat = k;
  };
  pose(0, true);

  return {
    object: root,
    update(_dt, t, still) {
      pose(t, still);
    },
    dispose() {
      facetGeo.dispose();
      release(root);
    },
  };
}
