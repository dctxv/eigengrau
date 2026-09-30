import * as THREE from "three";
import { facets, halo, haze, part, release, type Item } from "./look";
import { glowLines, type GlowLine } from "./lines";

/**
 * The stone and its field. The stone: its half sizes across, up (its poles, where the field comes
 * from, `poles` from its middle) and deep. Its field: `around` lines at each of `shells`, each shell
 * the lines that leave the north pole at a tilt (degrees from straight up) and, squeezed in from
 * the side (real field lines of two poles are wide and flat; these are drawn as they are pictured,
 * tall round the stone), reach `side` out from its axis; each glowing `width` out from its line.
 * Light flows along them from pole to pole at `flow` lengths a second; it turns once in `turn` s.
 *
 * The cursor: within `near` of its middle, the lines pull toward it, up to `pull` of the way, those
 * within about `reach` of it the most, and brighten as they bend. The cursor is followed at `follow`
 * (1/s), and the pull springs in and out (`spring`, `damping`), so the lines relax back with a
 * little wobble when it leaves. (All of these in the units the item fits a sphere of radius 1 in.)
 */
const STONE = { size: [0.3, 0.54, 0.28], poles: 0.46 };
const FIELD = { shells: [{ tilt: 58, side: 0.9 }, { tilt: 70, side: 0.7 }, { tilt: 86, side: 0.52 }], around: 5, width: 0.042, flow: 0.28, turn: 34 };
const CURSOR = { near: 1.7, pull: 0.65, reach: 0.75, follow: 9, spring: 40, damping: 6.5 };

/** The stone: an icosahedron with its corners pushed in and out, a little longer than it is wide. */
function stoneGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const at = g.attributes.position, seen = new Map<string, number>();
  for (let i = 0; i < at.count; i++) {
    const key = `${at.getX(i).toFixed(3)},${at.getY(i).toFixed(3)},${at.getZ(i).toFixed(3)}`;
    const k = seen.get(key) ?? seen.set(key, 0.84 + 0.3 * (((Math.sin(seen.size * 78.233 + 1.3) * 43758.5453) % 1) + 1) % 1).get(key)!;
    at.setXYZ(i, at.getX(i) * k * STONE.size[0], at.getY(i) * k * STONE.size[1], at.getZ(i) * k * STONE.size[2]);
  }
  return g;
}

/** Whether a point is inside the stone (near enough: the ellipsoid of its sizes, a little in). */
const insideStone = (p: THREE.Vector3) => (p.x / STONE.size[0]) ** 2 + (p.y / STONE.size[1]) ** 2 + (p.z / STONE.size[2]) ** 2 < 0.9;

/**
 * A field line of the stone's two poles, from its north pole to its south: it leaves the north
 * pole at `tilt` from straight up, turned `around` about the poles' axis, and follows the field.
 */
function trace(tilt: number, around: number) {
  const N = new THREE.Vector3(0, STONE.poles, 0), S = new THREE.Vector3(0, -STONE.poles, 0);
  const field = (p: THREE.Vector3) => {
    const a = p.clone().sub(N), b = p.clone().sub(S);
    return a.divideScalar(a.length() ** 3).sub(b.divideScalar(b.length() ** 3)).normalize();
  };
  const p = N.clone().add(new THREE.Vector3(Math.sin(tilt) * Math.cos(around), Math.cos(tilt), Math.sin(tilt) * Math.sin(around)).multiplyScalar(0.03));
  const pts = [p.clone()], step = 0.004;
  let run = 0;
  for (let i = 0; i < 6000 && p.distanceTo(S) > 0.03; i++) {
    // (a half step ahead first, so it follows the curve rather than cutting across it)
    const mid = p.clone().addScaledVector(field(p), step / 2);
    p.addScaledVector(field(mid), step);
    run += step;
    if (run >= 0.025) {
      pts.push(p.clone());
      run = 0;
    }
  }
  return pts;
}

/**
 * The field: `around` lines at each of the shells, each shell's set between the last's, each only
 * as it is outside the stone (and a point in, where it comes out of it).
 */
function fieldLines(): GlowLine[] {
  const lines: GlowLine[] = [];
  FIELD.shells.forEach(({ tilt, side }, s) => {
    // the line as the field has it, in one plane through the poles, squeezed to its width
    const flat = trace((tilt * Math.PI) / 180, 0), squeeze = side / Math.max(...flat.map((p) => Math.abs(p.x)));
    for (let k = 0; k < FIELD.around; k++) {
      const around = ((k + s / FIELD.shells.length) / FIELD.around) * Math.PI * 2;
      const pts = flat.map((p) => new THREE.Vector3(p.x * squeeze, p.y, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), around));
      const first = pts.findIndex((p) => !insideStone(p)), last = pts.length - 1 - [...pts].reverse().findIndex((p) => !insideStone(p));
      lines.push({ pts: pts.slice(Math.max(0, first - 1), Math.min(pts.length, last + 2)), width: FIELD.width });
    }
  });
  return lines;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Magnet stone (uncommon): a dark faceted rock, its poles glowing cyan, with glowing cyan field
 * lines looping from pole to pole round it and light flowing along them. It turns slowly, the lines
 * with it. The lines bend toward the cursor when it comes near, brightening as they bend, and relax
 * back when it leaves.
 */
export function makeMagnet(): Item {
  const stone = part(stoneGeometry(), facets("#4b5263", "#13151b", 0.6, { colour: "#5ff0ff", from: 0.72, amount: 0.75 }), 22, 0.32);
  const cursor = { value: new THREE.Vector3() }, pullU = { value: 0 }, reach = { value: CURSOR.reach }, time = { value: 0 };
  const field = glowLines(fieldLines(), {
    core: "#e8ffff",
    glow: "#35e3ff",
    spread: 3,
    depthTest: true,
    uniforms: { uCursor: cursor, uPull: pullU, uReach: reach, uTime: time },
    bend: /* glsl */ `
      uniform vec3 uCursor;
      uniform float uPull;
      uniform float uReach;
      // drawn toward the cursor, the nearer it the more, never past it
      vec4 bend(vec3 v) {
        vec2 d = uCursor.xy - v.xy;
        float f = uPull * exp(-dot(d, d) / (uReach * uReach));
        return vec4(v.xy + d * f, v.z, max(f, 0.0));
      }`,
    shade: /* glsl */ `
      uniform float uTime;
      // light flowing out of the north pole and into the south along each line, each on its own
      // beat, and brighter where the cursor bends it
      float shade(float along, float line, float bent) {
        float x = fract(along - uTime * ${FIELD.flow.toFixed(3)} + fract(line * 0.618)) - 0.5;
        return (0.5 + 0.6 * exp(-x * x / 0.018)) * (1.0 + 1.8 * bent);
      }`,
  });
  const spin = new THREE.Group();
  spin.add(stone, field.mesh);
  const body = new THREE.Group();
  body.add(spin);
  body.rotation.z = 0.22;
  const glow = halo("#43d9ff", 2.2, 0.06);
  const under = haze("#7fe0ff", 1.6, 0.05);
  under.position.set(0, -1.02, -0.5);
  const root = new THREE.Group();
  root.add(under, glow.mesh, body);
  const poles = (stone.material as THREE.ShaderMaterial).uniforms.uGlowAmount;

  // the cursor, as the host last gave it; where the lines are drawn toward (following it, and left
  // where it was when it goes, so they relax back from there); and how hard, springing
  let pointer: { x: number; y: number } | null = null;
  const toward = { x: 0, y: 0 };
  let pull = 0, speed = 0;
  // the cursor in the view the lines are drawn in: the item's middle there, and its frame's scale
  const origin = new THREE.Vector3(), scale = new THREE.Vector3();
  const before = field.mesh.onBeforeRender.bind(field.mesh);
  field.mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
    before(renderer, scene, camera, geometry, material, group);
    root.matrixWorld.decompose(origin, new THREE.Quaternion(), scale);
    origin.applyMatrix4(camera.matrixWorldInverse);
    cursor.value.set(origin.x + toward.x * scale.x, origin.y + toward.y * scale.y, origin.z);
    reach.value = CURSOR.reach * scale.x;
  };

  return {
    object: root,
    point(at) {
      pointer = at;
    },
    update(dt, t, still) {
      spin.rotation.y = (Math.PI * 2 * t) / FIELD.turn;
      body.rotation.x = 0.1 + 0.08 * Math.sin(t * 0.27);
      time.value = t;
      const target = pointer ? CURSOR.pull * smooth(CURSOR.near, CURSOR.near * 0.55, Math.hypot(pointer.x, pointer.y)) : 0;
      if (pointer) {
        const k = still ? 1 : 1 - Math.exp(-CURSOR.follow * dt);
        toward.x += (pointer.x - toward.x) * k;
        toward.y += (pointer.y - toward.y) * k;
      }
      if (still) {
        pull = target;
        speed = 0;
      } else {
        speed += (target - pull) * CURSOR.spring * dt;
        speed *= Math.exp(-CURSOR.damping * dt);
        pull += speed * dt;
      }
      pullU.value = pull;
      // the poles and the halo breathe with the flow, and brighten as it pulls
      const lift = Math.max(0, pull) / CURSOR.pull;
      poles.value = 0.65 + 0.15 * Math.sin(t * 1.3) + 0.3 * lift;
      glow.strength = 0.06 + 0.06 * lift;
    },
    dispose() {
      release(root);
    },
  };
}
