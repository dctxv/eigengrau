import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { facets, halo, release, specks, type Item } from "./look";
import { glowLines } from "./lines";
import { seeded } from "./swim";

/**
 * The galaxy. Its disc: `arms` arms wound at `pitch` (radians) out to `reach`, `stars` stars along
 * them (fewer the further out, spread `spread` across an arm, and `between` of them fainter in the
 * disc between the arms), `dust` soft puffs of dust among them,
 * `thick` deep; a bulge of `bulge` stars at its core. About it, `loose` loose stars at every depth,
 * out to `about`. It turns once in `turn` seconds, and leans `lean` (radians) toward you, wobbling
 * `wobble` as it goes, so its depths slide past one another. Held, it settles over `settle`
 * seconds: face on, calmer, `strays` of its stars drifting out round it.
 */
const GALAXY = {
  arms: 2,
  pitch: 0.32,
  reach: 0.88,
  stars: 2600,
  spread: 0.75,
  between: 0.2,
  dust: 420,
  thick: 0.03,
  bulge: 520,
  loose: 260,
  about: 1,
  turn: 70,
  lean: 1.05,
  wobble: 0.16,
  settle: 1.2,
  strays: 18,
};

/** Where the tiny planet is (on an arm, how far out and how far round), how big, and its Urchi on its line. */
const HIDDEN = { out: 0.58, round: 0.9, planet: 0.011, urchi: 0.005, line: 0.028 };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Pocket universe (top, the rarest): a small spiral galaxy floating free, nothing round it. A bright
 * gold-white core, violet and blue arms slowly turning, dust along them, and loose stars at every
 * depth about it, so as it leans and wobbles its depths slide past one another. Its edges never end:
 * its stars thin out into a few faint ones and fade into the dark. Held (Item.held), it settles,
 * face on and calmer, and a few of its stars drift out round it. Hidden in one arm, too small to see
 * unless looked at very close: a tiny planet with a tiny Urchi on its line.
 */
export function makePocketUniverse(): Item {
  const rand = seeded(20261006), gauss = () => (rand() + rand() + rand() + rand() - 2) * 0.87;
  const disc = new THREE.Group();

  // the stars of its disc: its bulge, then along its arms
  const n = GALAXY.bulge + GALAXY.stars, stars = specks(n);
  const gold = rawColor("#ffe3a3"), white = rawColor("#fff7ea"), violet = rawColor("#9a72ff"), blue = rawColor("#6e92ff"), young = rawColor("#d6e4ff");
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number, r: number;
    if (i < GALAXY.bulge) {
      x = gauss() * 0.07;
      y = gauss() * 0.045;
      z = gauss() * 0.07;
      r = Math.hypot(x, z);
      c.copy(rand() < 0.5 ? gold : white);
      stars.sizes[i] = 0.012 + 0.012 * rand();
      stars.alphas[i] = 0.45 + 0.3 * rand();
    } else {
      // how far out (fewer further), which arm, and where across it
      r = Math.min(GALAXY.reach * 1.1, 0.06 + -Math.log(1 - rand() * 0.95) * 0.26);
      const arm = Math.floor(rand() * GALAXY.arms), wind = Math.log(r / 0.06) / Math.tan(GALAXY.pitch), between = rand() < GALAXY.between;
      const a = between ? rand() * Math.PI * 2 : wind + (arm * Math.PI * 2) / GALAXY.arms + gauss() * GALAXY.spread * (0.35 + r);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * GALAXY.thick * (1 + r);
      const hue = rand();
      c.copy(r < 0.14 ? gold : hue < 0.45 ? violet : hue < 0.9 ? blue : young).lerp(white, r < 0.14 ? 0.3 : 0.05 * rand());
      stars.sizes[i] = 0.008 + 0.01 * rand() + (hue > 0.95 ? 0.008 : 0);
      // (its edges thin out and fade)
      stars.alphas[i] = (0.3 + 0.45 * rand()) * (between ? 0.45 : 1) * smooth(GALAXY.reach * 1.1, GALAXY.reach * 0.45, r);
    }
    stars.positions.set([x, y, z], i * 3);
    stars.colours.set([c.r, c.g, c.b], i * 3);
  }
  stars.changed();

  // dust along its arms: soft puffs, violet and blue, faint
  const dust = specks(GALAXY.dust, true);
  for (let i = 0; i < GALAXY.dust; i++) {
    const r = 0.1 + rand() * 0.7, arm = Math.floor(rand() * GALAXY.arms), wind = Math.log(r / 0.06) / Math.tan(GALAXY.pitch);
    const a = wind + (arm * Math.PI * 2) / GALAXY.arms + gauss() * 0.35 + 0.15;
    dust.positions.set([Math.cos(a) * r, gauss() * 0.015, Math.sin(a) * r], i * 3);
    c.copy(rand() < 0.5 ? violet : blue);
    dust.colours.set([c.r, c.g, c.b], i * 3);
    dust.sizes[i] = 0.1 + 0.1 * rand();
    dust.alphas[i] = 0.085 * smooth(0.85, 0.3, r);
  }
  dust.changed();
  dust.points.renderOrder = -1;

  // the hidden planet on its arm, and its Urchi on its line
  const hid = new THREE.Group();
  const hidAngle = Math.log(HIDDEN.out / 0.06) / Math.tan(GALAXY.pitch) + HIDDEN.round * 0.1;
  hid.position.set(Math.cos(hidAngle) * HIDDEN.out, 0.01, Math.sin(hidAngle) * HIDDEN.out);
  hid.add(new THREE.Mesh(new THREE.IcosahedronGeometry(HIDDEN.planet, 1), facets("#5fe0d4", "#1d4f7a", 0.6)));
  const urchi = new THREE.Group();
  const helmet = new THREE.Mesh(new THREE.IcosahedronGeometry(HIDDEN.urchi, 1), facets("#f4f3ee", "#8a8a88", 0.4));
  const visor = new THREE.Mesh(new THREE.IcosahedronGeometry(HIDDEN.urchi * 0.62, 1), facets("#2a2440", "#0a0812", 0.3));
  visor.position.set(HIDDEN.urchi * 0.35, 0, HIDDEN.urchi * 0.35);
  const suit = new THREE.Mesh(new THREE.BoxGeometry(HIDDEN.urchi * 1.2, HIDDEN.urchi * 1.3, HIDDEN.urchi), facets("#e8e7e2", "#7d7d7b", 0.3));
  suit.position.y = -HIDDEN.urchi * 1.4;
  urchi.add(helmet, visor, suit);
  urchi.position.set(HIDDEN.planet + HIDDEN.line, HIDDEN.planet * 0.6, 0);
  hid.add(urchi);
  const tether = glowLines(
    [{ pts: [new THREE.Vector3(HIDDEN.planet * 0.8, HIDDEN.planet * 0.3, 0), new THREE.Vector3(HIDDEN.planet + HIDDEN.line * 0.5, HIDDEN.planet * 1.4, 0), urchi.position.clone().add(new THREE.Vector3(-HIDDEN.urchi * 0.8, -HIDDEN.urchi, 0))], width: 0.0015 }],
    { core: "#f0f0ea", glow: "#c9c9c4", spread: 2, depthTest: true },
  );
  hid.add(tether.mesh);
  disc.add(dust.points, stars.points, hid);

  // loose stars about it, at every depth
  const loose = specks(GALAXY.loose + GALAXY.strays);
  const strayAt: { r: number; a: number; y: number; rate: number }[] = [];
  for (let i = 0; i < GALAXY.loose + GALAXY.strays; i++) {
    const v = new THREE.Vector3(gauss(), gauss() * 0.6, gauss()).normalize().multiplyScalar(0.3 + Math.pow(rand(), 0.6) * (GALAXY.about - 0.3));
    loose.positions.set([v.x, v.y, v.z], i * 3);
    c.copy(rand() < 0.6 ? young : rand() < 0.5 ? violet : gold);
    loose.colours.set([c.r, c.g, c.b], i * 3);
    loose.sizes[i] = 0.008 + 0.008 * rand();
    loose.alphas[i] = i < GALAXY.loose ? (0.25 + 0.4 * rand()) * smooth(GALAXY.about, 0.5, v.length()) : 0;
    if (i >= GALAXY.loose) strayAt.push({ r: 0.55 + 0.35 * rand(), a: rand() * Math.PI * 2, y: (rand() - 0.5) * 0.25, rate: 0.25 + 0.3 * rand() });
  }
  loose.changed();

  const lean = new THREE.Group();
  lean.add(disc);
  const core = halo("#ffe4a8", 0.6, 0.4), glow = halo("#9d88ff", 2.1, 0.09);
  const root = new THREE.Group();
  root.add(glow.mesh, core.mesh, lean, loose.points);

  // held: how settled (0 free, 1 held)
  let held = false, settled = 0;
  const place = (t: number) => {
    disc.rotation.y = -(Math.PI * 2 * t) / GALAXY.turn;
    const w = GALAXY.wobble * (1 - 0.7 * settled);
    lean.rotation.set(GALAXY.lean * (1 - 0.35 * settled) + w * Math.sin(t * 0.11), 0.4 * Math.sin(t * 0.05) * (1 - settled), w * 0.6 * Math.sin(t * 0.083 + 1));
    // the strays: out round it while it is held, drifting slowly, fading in and out with it
    strayAt.forEach((s, k) => {
      const i = GALAXY.loose + k, a = s.a + t * s.rate;
      loose.positions.set([Math.cos(a) * s.r, s.y + 0.04 * Math.sin(t * 0.7 + k), Math.sin(a) * s.r * 0.6], i * 3);
      loose.alphas[i] = 0.8 * settled;
    });
    loose.changed();
    core.strength = 0.4 + 0.12 * settled;
  };
  place(0);

  return {
    object: root,
    held(on) {
      held = on;
    },
    update(dt, t, still) {
      settled = still ? (held ? 1 : 0) : settled + ((held ? 1 : 0) - settled) * (1 - Math.exp(-dt / GALAXY.settle));
      place(t);
    },
    dispose() {
      release(root);
    },
  };
}
