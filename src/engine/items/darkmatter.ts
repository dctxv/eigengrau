import * as THREE from "three";
import { rawColor } from "@/engine/common/color";
import { ADD, release, type Item } from "./look";

/**
 * The body and what streams past it. The body: its size (`size`, about its radius) and how lumpy
 * (`lumps`), squashed to `shape` across, up and deep; it tumbles at `tumble` (rad/s about each axis).
 * The stream: `dust` specks and `stars` tiny stars, drifting at `speed` (item units a second) through
 * a ball `reach` across, their paths parting round the body within `part` of it, as a stream parts
 * round a stone (so they bunch along its edges, and never go through it); its heading wanders slowly
 * (`wander`, rad/s). Every other speck of dust also lays a soft haze about it (`haze` bright), so
 * the stream reads as a mist even small. The stream is a slab `slab` as deep as it is wide, facing
 * you, so little of it passes in front. What passes behind the body has its light bent round it,
 * as a mass bends light (a lens, `lens` times the body's outline): pushed out of its outline and
 * gathered in a ring along its edge. The rim: `rim`, only where the stream passes thickest.
 */
const DARK = {
  size: 0.36,
  lumps: [0.2, 0.14, 0.1],
  shape: [1.25, 0.95, 0.85],
  tumble: [0.11, 0.08, 0.05],
  dust: 2200,
  stars: 140,
  haze: 0.045,
  speed: 0.1,
  reach: 1,
  part: 0.26,
  wander: 0.05,
  rim: 0.34,
  slab: 0.45,
  lens: 1.05,
};

/** A small seeded generator (mulberry32), so it is the same stream every time. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How far the body reaches along `u` (a unit direction in its own frame): a lumpy, squashed ball. */
function radius(u: THREE.Vector3) {
  const [sx, sy, sz] = DARK.shape, [a, b, c] = DARK.lumps;
  const squash = 1 / Math.sqrt((u.x / sx) ** 2 + (u.y / sy) ** 2 + (u.z / sz) ** 2);
  const lumps = 1 + a * Math.sin(3 * u.x + 0.7) * Math.sin(2 * u.y + 1.3) + b * Math.sin(4 * u.z - 1.1 + 2 * u.y) + c * Math.sin(5 * u.x + 3 * u.z);
  return DARK.size * squash * lumps;
}

/** The body's surface (for its rim): a finely cut ball pushed out to its reach, smooth. */
function bodyGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 5);
  const at = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < at.count; i++) {
    v.fromBufferAttribute(at, i).normalize();
    v.multiplyScalar(radius(v));
    at.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The rim: the body's edge, seen only where the stream passes thickest, along its flanks (turned
 * across the stream), and faint even there. Light added, none of the body itself.
 */
const rimVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vP = p.xyz;
  vN = normalMatrix * normal;
  gl_Position = projectionMatrix * p;
}`;
const rimFragment = /* glsl */ `
uniform vec3 uColour;
uniform vec3 uStream;
uniform float uRim;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN), v = normalize(-vP);
  float edge = pow(1.0 - abs(dot(n, v)), 3.0), flank = 1.0 - abs(dot(n, uStream));
  gl_FragColor = vec4(uColour * edge * flank * flank * uRim, 1.0);
}`;

/** The specks: each a point a pixel or two across (never less than one), as bright as it is there, light added. */
const speckVertex = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColour;
uniform vec4 uViewport;
varying float vAlpha;
varying vec3 vColour;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  float px = aSize * projectionMatrix[1][1] * uViewport.w / (2.0 * -p.z);
  gl_PointSize = max(1.0, px);
  // (a speck smaller than a pixel is as bright as the share of the pixel it would cover)
  vAlpha = aAlpha * min(1.0, px * px);
  vColour = aColour;
  gl_Position = projectionMatrix * p;
}`;
const speckFragment = /* glsl */ `
uniform float uSoft;
varying float vAlpha;
varying vec3 vColour;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  // a speck crisp, a haze's puff soft all the way out
  float a = uSoft > 0.5 ? exp(-d * d * 3.5) * (1.0 - smoothstep(0.8, 1.0, d)) : 1.0 - smoothstep(0.5, 1.0, d);
  gl_FragColor = vec4(vColour, vAlpha * a);
}`;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Dark matter (rare): nothing to see. An irregular body no light comes from, slowly tumbling, with
 * fine dust and tiny stars drifting past it through a ball of space: their paths part round it as a
 * stream round a stone, so they bunch along its edges and nothing goes through it, and its outline
 * is only there in what moves past. A faint rim shows only on its flanks, where the stream passes
 * thickest. The stream's heading wanders slowly, so its outline is drawn from every side in turn.
 */
export function makeDarkMatter(): Item {
  const rand = seeded(20261003), n = DARK.dust + DARK.stars;
  // each speck: where along the stream it starts (-1 .. 1), its place across it (a disc), and its look
  const along = new Float32Array(n), across = new Float32Array(n * 2), phase = new Float32Array(n);
  const positions = new Float32Array(n * 3), sizes = new Float32Array(n), alphas = new Float32Array(n), base = new Float32Array(n), colours = new Float32Array(n * 3);
  const dust = [rawColor("#a79bd0"), rawColor("#8f9ec8"), rawColor("#c2b3d8")], star = [rawColor("#eef3ff"), rawColor("#cfe0ff"), rawColor("#fff4dd")];
  for (let i = 0; i < n; i++) {
    const isStar = i >= DARK.dust, r = Math.sqrt(rand()) * DARK.reach, a = rand() * Math.PI * 2;
    along[i] = rand() * 2 - 1;
    across[i * 2] = Math.cos(a) * r;
    across[i * 2 + 1] = Math.sin(a) * r;
    phase[i] = rand() * Math.PI * 2;
    sizes[i] = isStar ? 0.014 + 0.012 * rand() : 0.011 + 0.008 * rand();
    base[i] = isStar ? 0.8 + 0.2 * rand() : 0.3 + 0.3 * rand();
    const c = (isStar ? star : dust)[Math.floor(rand() * 3)];
    colours.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  g.setAttribute("aColour", new THREE.BufferAttribute(colours, 3));
  const speckU = { uViewport: { value: new THREE.Vector4(0, 0, 1, 1) }, uSoft: { value: 0 } };
  const specks = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: speckVertex, fragmentShader: speckFragment, uniforms: speckU, transparent: true, depthWrite: false, depthTest: false, ...ADD }));
  specks.frustumCulled = false;
  specks.onBeforeRender = (renderer) => renderer.getCurrentViewport(speckU.uViewport.value);
  // the haze: a soft puff about every other speck of dust, the same stream
  const puffs = Math.floor(DARK.dust / 2), hazeSize = new Float32Array(puffs), hazeAlpha = new Float32Array(puffs), hazeColour = new Float32Array(puffs * 3), hazeAt = new Float32Array(puffs * 3);
  const hazeTint = rawColor("#7f70b8");
  for (let k = 0; k < puffs; k++) {
    hazeSize[k] = 0.07 + 0.05 * rand();
    hazeColour.set([hazeTint.r, hazeTint.g, hazeTint.b], k * 3);
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute("position", new THREE.BufferAttribute(hazeAt, 3));
  hg.setAttribute("aSize", new THREE.BufferAttribute(hazeSize, 1));
  hg.setAttribute("aAlpha", new THREE.BufferAttribute(hazeAlpha, 1));
  hg.setAttribute("aColour", new THREE.BufferAttribute(hazeColour, 3));
  const hazeU = { uViewport: speckU.uViewport, uSoft: { value: 1 } };
  const haze = new THREE.Points(hg, new THREE.ShaderMaterial({ vertexShader: speckVertex, fragmentShader: speckFragment, uniforms: hazeU, transparent: true, depthWrite: false, depthTest: false, ...ADD }));
  haze.frustumCulled = false;
  haze.renderOrder = -1;
  haze.onBeforeRender = (renderer) => renderer.getCurrentViewport(speckU.uViewport.value);

  const body = new THREE.Group();
  const rimU = { uColour: { value: rawColor("#c9b8ff") }, uStream: { value: new THREE.Vector3(1, 0, 0) }, uRim: { value: DARK.rim } };
  const rim = new THREE.Mesh(bodyGeometry(), new THREE.ShaderMaterial({ vertexShader: rimVertex, fragmentShader: rimFragment, uniforms: rimU, transparent: true, depthWrite: false, depthTest: false, ...ADD }));
  body.add(rim);
  const root = new THREE.Group();
  root.add(haze, body, specks);

  const stream = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3(), dir = new THREE.Vector3();
  const turn = new THREE.Quaternion(), back = new THREE.Quaternion(), euler = new THREE.Euler(), m3 = new THREE.Matrix3();
  /** Whether a point (the item's frame) is inside the body, as it is turned now. */
  const inside = (x: THREE.Vector3) => {
    q.copy(x).applyQuaternion(back);
    const l = q.length();
    return l < 1e-6 || l < radius(q.divideScalar(l));
  };
  /** How far across the stream the body reaches, `a` along it, the way `e` goes (0 if it is not there). */
  const reachAcross = (a: number, e: THREE.Vector3) => {
    p.copy(stream).multiplyScalar(a);
    if (!inside(p)) return 0;
    let lo = 0, hi = DARK.size * 2;
    for (let k = 0; k < 10; k++) {
      const mid = (lo + hi) / 2;
      p.copy(stream).multiplyScalar(a).addScaledVector(e, mid);
      if (inside(p)) lo = mid;
      else hi = mid;
    }
    return lo;
  };

  const place = (t: number) => {
    const [tx, ty, tz] = DARK.tumble;
    turn.setFromEuler(euler.set(0.4 + tx * t, 0.2 + ty * t, tz * t));
    back.copy(turn).invert();
    body.quaternion.copy(turn);
    // the stream's heading, wandering, mostly across the view; and two ways across it
    const w = DARK.wander * t;
    stream.set(Math.cos(w), 0.45 * Math.sin(w * 0.7 + 0.5), 0.35 * Math.sin(w * 0.6)).normalize();
    // (across it: one way in the view's plane, the other as near toward you as there is)
    e1.crossVectors(stream, new THREE.Vector3(0, 0, 1)).normalize();
    e2.crossVectors(e1, stream);
    for (let i = 0; i < n; i++) {
      // along: drifting on, round from one end of the ball to the other
      let a = along[i] + DARK.speed * t;
      a = (((a + 1) % 2) + 2) % 2 - 1;
      const u = across[i * 2], v = across[i * 2 + 1] * DARK.slab, r = Math.hypot(u, v);
      dir.copy(e1).multiplyScalar(u).addScaledVector(e2, v);
      // parted round the body: those that would go through it, or near it, pushed out across the
      // stream to pass it, bunching along its edge
      let out = r;
      if (Math.abs(a) < DARK.size * 1.6 && r < DARK.size * 2 + DARK.part) {
        const e = r > 1e-6 ? dir.clone().divideScalar(r) : e1, body = reachAcross(a, e);
        if (body > 0 && r < body + DARK.part) out = body + (r * DARK.part) / (body + DARK.part);
      }
      if (r > 1e-6) dir.multiplyScalar(out / r);
      p.copy(stream).multiplyScalar(a).add(dir);
      // behind it, its light bent round it: out of its outline (the lens, for its outline the way
      // this is from its middle), the more the further behind
      const behind = smooth(0, -0.25, p.z), flat = Math.hypot(p.x, p.y);
      if (behind > 0 && flat > 1e-6) {
        q.set(p.x / flat, p.y / flat, 0).applyQuaternion(back);
        const ring = DARK.lens * radius(q.normalize()) * behind, out = 0.5 * (flat + Math.sqrt(flat * flat + 4 * ring * ring));
        p.x *= out / flat;
        p.y *= out / flat;
      }
      positions.set([p.x, p.y, p.z], i * 3);
      // faint toward the ball's edge and its ends (where it comes round), a star's twinkle
      const fade = smooth(1.02, 0.7, p.length()) * smooth(1, 0.85, Math.abs(a));
      alphas[i] = base[i] * fade * (i >= DARK.dust ? 0.75 + 0.25 * Math.sin(t * 2.3 + phase[i]) : 1);
      if (i < DARK.dust && i % 2 === 0 && i / 2 < puffs) {
        hazeAt.set([p.x, p.y, p.z], (i / 2) * 3);
        hazeAlpha[i / 2] = DARK.haze * fade;
      }
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
    hg.attributes.position.needsUpdate = true;
    hg.attributes.aAlpha.needsUpdate = true;
  };
  place(0);

  return {
    object: root,
    update(_dt, t) {
      place(t);
      // (the rim's sense of the stream, in the view: its flanks are where the stream is thickest)
      rimU.uStream.value.copy(stream).applyMatrix3(m3.getNormalMatrix(root.matrixWorld)).normalize();
    },
    dispose() {
      release(root);
    },
  };
}
