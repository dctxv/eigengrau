import * as THREE from "three";
import type { LayerConfig, SkyFrame, SkyLayer, SkyView } from "./layer";
import { pickWeighted, rng, subSeed, type Colour, type Num, type Resolved } from "./tune";

/**
 * The stars: a painted night sky (a Shinkai sky, not a starfield), the sky's first layer. Mostly
 * tiny stars and a few large, warm white, pale blue and faint gold, each a soft round core with a
 * small glow, at a few depths that the zoom moves by different amounts; the brightest few with a
 * soft four-point glint. One draw call: a quad per star, instanced, shaped in its shader at the
 * screen's own resolution, so it is clean at any zoom and any pixel ratio. Laid out once per sky;
 * each frame sets only uniforms.
 */
export type StarsConfig = LayerConfig & {
  /** The ground behind the sky, while it is there (the room's own eigengrau by default). */
  backdrop: Colour;
  /**
   * How many: stars to each FIELD (1440 CSS px) square at zoom 1, so they are as dense on a phone as
   * on a wide screen, which only sees more of the same sky.
   */
  count: Num;
  /** Each star's core radius, CSS px: `min + (max - min) * u ** bias` for u even in 0 .. 1, so a high bias is mostly tiny and a few large. */
  size: { min: Num; max: Num; bias: Num };
  /** Their colours, each drawn in proportion to its weight. */
  palette: { colour: Colour; weight: Num }[];
  /** How bright, `min` .. `max`: `follow` of where a star falls goes by its size (the larger, the brighter), the rest at random. */
  brightness: { min: Num; max: Num; follow: Num };
  /** The soft glow round each core: its radius (times the core's) and its strength against the core. */
  glow: { size: Num; strength: Num };
  /**
   * The depths, far to near (at most four): each takes its `share` of the stars, follows the zoom
   * by its own `zoomResponse` (times the layer's), and scales its stars' size and brightness by
   * `scale`. The nearer, the more they move, and the zoom reads as depth. Leaning with the pointer
   * (the layer's parallax), the nearer lean more too.
   */
  bands: { share: Num; zoomResponse: Num; scale: Num }[];
  /** Twinkling: each star dims by up to `amount` (0 .. 1) at about `speed` radians a second, some faster, some slower. Off under reduced motion. */
  twinkle: { speed: Num; amount: Num };
  /**
   * The brightest `count` stars in view get a soft four-point glint: arms `size` CSS px long on the
   * brightest (a little shorter down the rest), turned `rotation` degrees and each `jitter` degrees
   * either way more, at `strength` against the core, their colour `tintMix` of the way to `tint`.
   */
  sparkle: { count: Num; size: Num; rotation: Num; jitter: Num; strength: Num; tint: Colour; tintMix: Num };
  /**
   * A band across the sky, like the Milky Way: a line through the middle, turned `angle` degrees
   * and moved `offset` (of a field) across itself. `share` of the stars are gathered along it
   * instead of scattered (that share of a field square's worth to each field of its length), spread
   * about `width` of a field either side, over a haze of `hazeColour` as wide, `haze` bright along
   * its middle and broken into clouds by `patchy` (0 smooth .. 1 in clouds), at the farthest depth.
   */
  milkyWay: { enabled: boolean; angle: Num; offset: Num; width: Num; share: Num; haze: Num; patchy: Num; hazeColour: Colour };
  /**
   * Now and then a slow shooting star, once the sky is all there: one every `every` seconds or so
   * (between a third and five thirds of it), crossing the upper sky over `duration` seconds, its
   * head `travel` CSS px, its tail up to `length` px long and `width` px across, at `brightness`.
   * Never under reduced motion.
   */
  shooting: { enabled: boolean; every: Num; duration: Num; travel: Num; length: Num; width: Num; brightness: Num; colour: Colour };
};

/** The depths the shader has room for. */
const MOST_BANDS = 4;
/** The sky's unit, CSS px: a star's place is in fields from the room's middle, and `count` is per field square. */
export const FIELD = 1440;
/**
 * The sky's side, in fields: stars are laid up to this far out, so a zoomed-out sky (or a wide
 * screen's) never runs short.
 */
const FIELD_MOST = 4;
/** A glint is kept this far (fields) inside the room's edges, so it is seen whole. */
const GLINT_CLEAR = 0.03;
/** The glints' count is for a room this big (CSS px²); a smaller one has fewer, by the root of its area, and a bigger up to twice as many. */
const GLINT_AREA = 1440 * 900;
/** Where a shooting star starts: across the middle `across` of the room, and between `high` of its height above the middle. */
const SHOT = { across: 0.8, high: [0.1, 0.42] as [number, number], tilt: [15, 35] as [number, number] };

const vertexShader = /* glsl */ `
attribute vec4 iPlace;   // x, y (field units from the middle, y up), depth band, kind: 0 star, 1 the Milky Way's haze, 2 the shooting star
attribute vec4 iLook;    // a star's radius (CSS px), brightness, glint (0 none .. 1 the brightest), the glint's own turn (rad);
                         // the haze's width (field units), brightness, heading (rad), half its length (field units)
attribute vec3 iColour;
attribute vec2 iTwinkle; // a star's phase (rad) and speed (times the twinkle's); the haze's patchiness and where its clouds start
uniform float uField;    // CSS px per field unit (FIELD)
uniform vec4 uScale;     // each band's scale this frame: the zoom to its response
uniform vec4 uDepth;     // each band's share of the lean
uniform vec2 uLean;      // the lean against the pointer, CSS px
uniform float uPx;       // CSS px per device px
uniform float uTime;
uniform vec2 uTwinkle;   // speed (rad/s), amount
uniform vec2 uGlow;      // radius (times the core's), strength
uniform vec3 uGlint;     // arm length (CSS px), turn (rad), strength
uniform float uOpacity;
uniform vec4 uShootA;    // the shooting star's head (room CSS px), its heading (rad)
uniform vec4 uShootB;    // its tail's length, its width (CSS px), its brightness now (0: none)
varying vec2 vAt;        // CSS px from the centre (the shooting star's and the haze's: along their heading, and across)
varying vec4 vShape;     // core radius, glow radius, glint arm, kind (the shooting star's width and tail; the haze's width, half length and patchiness)
varying float vTurn;
varying vec3 vColour;
varying vec2 vCloud;     // the haze's place in its clouds

void main() {
  vec2 corner = position.xy;
  float kind = iPlace.w;
  if (kind > 1.5) {
    if (uShootB.z <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec2 dir = vec2(cos(uShootA.z), sin(uShootA.z)), side = vec2(-dir.y, dir.x);
    float len = uShootB.x, w = max(uShootB.y, 0.6 * uPx), m = 3.0 * w + 2.0 * uPx;
    vAt = vec2(mix(-len - m, m, corner.x * 0.5 + 0.5), corner.y * m);
    vShape = vec4(w, len, 0.0, 2.0);
    vTurn = 0.0;
    vColour = iColour * uShootB.z * uOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(uShootA.xy + dir * vAt.x + side * vAt.y, 0.0, 1.0);
    return;
  }
  int band = int(iPlace.z + 0.5);
  float scale = uScale[band];
  vec2 centre = iPlace.xy * uField * scale + uLean * uDepth[band];
  float light = iLook.y * uOpacity;
  float reach;
  if (kind > 0.5) {
    // the haze: one long quad along the band, three widths either side of its line
    float w = max(iLook.x * uField * scale, 1.0), len = iLook.w * uField * scale;
    vec2 dir = vec2(cos(iLook.z), sin(iLook.z)), side = vec2(-dir.y, dir.x);
    vAt = corner * vec2(len, 3.0 * w);
    vShape = vec4(w, len, iTwinkle.x, 1.0);
    vCloud = vec2(vAt.x / (4.0 * w), vAt.y / (1.6 * w)) + iTwinkle.y;
    vTurn = 0.0;
    vColour = iColour * light;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(centre + dir * vAt.x + side * vAt.y, 0.0, 1.0);
    return;
  } else {
    // never under 0.7 of a device px: a smaller star is drawn that big, and as much dimmer
    float r = iLook.x, least = 0.7 * uPx;
    if (r < least) { light *= (r * r) / (least * least); r = least; }
    float a = uTime * uTwinkle.x * iTwinkle.y + iTwinkle.x;
    light *= 1.0 - uTwinkle.y * (0.5 + 0.5 * sin(a) * sin(0.61 * a + 2.3 * iTwinkle.x));
    float g = max(r * uGlow.x, 0.01);
    float arm = iLook.z > 0.0 ? uGlint.x * (0.55 + 0.45 * iLook.z) : 0.0;
    reach = max(max(r + uPx, 2.2 * g), arm) + uPx;
    vShape = vec4(r, g, arm, 0.0);
    vTurn = uGlint.y + iLook.w;
  }
  vColour = iColour * light;
  vAt = corner * reach;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(centre + vAt, 0.0, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform float uPx;
uniform vec2 uGlow;
uniform vec3 uGlint;
varying vec2 vAt;
varying vec4 vShape;
varying float vTurn;
varying vec3 vColour;
varying vec2 vCloud;

// value noise, and three octaves of it: the haze's clouds
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float clouds(vec2 p) {
  return 0.55 * noise(p) + 0.3 * noise(2.03 * p + 7.1) + 0.15 * noise(4.1 * p + 3.7);
}

// a glint's arm: a fine line tapering to nothing at its length (never thinner than half a device
// px), in a soft haze of its own four times as wide
float arm(float along, float across, float len, float r) {
  float taper = 1.0 - min(abs(along) / len, 1.0);
  float thick = max(0.55 * uPx, 0.3 * r * (0.35 + 0.65 * taper)), soft = 4.0 * thick;
  return taper * taper * exp(-(across * across) / (thick * thick)) + 0.22 * taper * taper * taper * exp(-(across * across) / (soft * soft));
}

void main() {
  float kind = vShape.w;
  vec3 colour = vColour;
  float light;
  if (kind > 1.5) {
    // the shooting star: a tail thinning and fading behind a soft head
    float w = vShape.x, len = max(vShape.y, 0.001);
    float t = clamp(1.0 + vAt.x / len, 0.0, 1.0), thin = w * (0.3 + 0.7 * t);
    float tail = vAt.x <= 0.0 ? t * t * exp(-(vAt.y * vAt.y) / (thin * thin)) : 0.0;
    light = tail + exp(-dot(vAt, vAt) / (2.5 * w * w));
  } else if (kind > 0.5) {
    // brightest along its line, broken into clouds as far as it is patchy, fading out at its ends
    float across = vAt.y / vShape.x;
    light = exp(-0.5 * across * across) * mix(1.0, 2.6 * pow(clouds(vCloud), 1.6), vShape.z);
    light *= 1.0 - smoothstep(0.85, 1.0, abs(vAt.x) / vShape.y);
  } else {
    float d = length(vAt), r = vShape.x, g = vShape.y;
    float core = 1.0 - smoothstep(r - max(uPx, 0.5 * r), r + 0.5 * uPx, d);
    light = core + uGlow.y * exp(-(d * d) / (g * g));
    if (vShape.z > 0.0) {
      float c = cos(vTurn), s = sin(vTurn);
      vec2 q = vec2(c * vAt.x + s * vAt.y, c * vAt.y - s * vAt.x);
      light += uGlint.z * (arm(q.x, q.y, vShape.z, r) + arm(q.y, q.x, vShape.z, r));
    }
    // the core a little whiter than its colour, as a painted star's is
    float peak = max(colour.r, max(colour.g, colour.b));
    colour = mix(colour, vec3(peak), 0.4 * core);
  }
  gl_FragColor = vec4(colour * light, 1.0);
}`;

const rgb = (c: string) => [1, 3, 5].map((i) => (parseInt(c.slice(i, i + 2), 16) || 0) / 255);
const mixRgb = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
/** A normal deviate from two even ones (Box-Muller). */
const gauss = (u: number, v: number) => Math.sqrt(-2 * Math.log(Math.max(u, 1e-9))) * Math.cos(2 * Math.PI * v);
const rad = (deg: number) => (deg * Math.PI) / 180;

type Star = { x: number; y: number; band: number; r: number; b: number; colour: number[]; phase: number; speed: number; turn: number; glint: number };

export class Stars implements SkyLayer<StarsConfig> {
  readonly name = "stars";
  readonly object: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private cfg: Resolved<StarsConfig> | null = null;
  private view: SkyView | null = null;
  private readonly u = {
    uField: { value: 1 },
    uScale: { value: new THREE.Vector4(1, 1, 1, 1) },
    uDepth: { value: new THREE.Vector4(0, 0, 0, 0) },
    uLean: { value: new THREE.Vector2() },
    uPx: { value: 1 },
    uTime: { value: 0 },
    uTwinkle: { value: new THREE.Vector2() },
    uGlow: { value: new THREE.Vector2() },
    uGlint: { value: new THREE.Vector3() },
    uOpacity: { value: 0 },
    uShootA: { value: new THREE.Vector4() },
    uShootB: { value: new THREE.Vector4() },
  };
  /** The shooting star crossing now (its start, heading and clock), and when the next may come (the sky's clock; -1 not yet decided). */
  private shot: { x: number; y: number; heading: number; t0: number } | null = null;
  private nextShot = -1;
  /** Each depth's power of the zoom (the layer's response times its own), as laid out; 0 past the last. */
  private readonly powers = [0, 0, 0, 0];

  constructor() {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.u,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // light added to what is under it: the stars are drawn premultiplied
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    });
    this.object = new THREE.Mesh(new THREE.InstancedBufferGeometry(), material);
    this.object.frustumCulled = false;
  }

  setup(config: Resolved<StarsConfig>, seed: number, view: SkyView) {
    this.cfg = config;
    this.view = view;
    const stars = this.lay(config, seed, view);
    const haze = config.milkyWay.enabled ? [this.haze(config, seed, view)] : [];
    const shooting = config.shooting.enabled;
    const n = stars.length + haze.length + (shooting ? 1 : 0);
    const place = new Float32Array(n * 4), look = new Float32Array(n * 4), colour = new Float32Array(n * 3), twinkle = new Float32Array(n * 2);
    let i = 0;
    for (const s of stars) {
      place.set([s.x, s.y, s.band, 0], i * 4);
      look.set([s.r, s.b, s.glint, s.turn], i * 4);
      colour.set(s.colour, i * 3);
      twinkle.set([s.phase, s.speed], i * 2);
      i++;
    }
    for (const h of haze) {
      place.set([h.x, h.y, 0, 1], i * 4);
      look.set([h.width, h.bright, h.heading, h.half], i * 4);
      colour.set(h.colour, i * 3);
      twinkle.set([h.patchy, h.cloud], i * 2);
      i++;
    }
    if (shooting) {
      place.set([0, 0, 0, 2], i * 4);
      colour.set(rgb(config.shooting.colour), i * 3);
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
    geo.setIndex([0, 1, 2, 2, 1, 3]);
    geo.setAttribute("iPlace", new THREE.InstancedBufferAttribute(place, 4));
    geo.setAttribute("iLook", new THREE.InstancedBufferAttribute(look, 4));
    geo.setAttribute("iColour", new THREE.InstancedBufferAttribute(colour, 3));
    geo.setAttribute("iTwinkle", new THREE.InstancedBufferAttribute(twinkle, 2));
    geo.instanceCount = n;
    this.object.geometry.dispose();
    this.object.geometry = geo;

    const u = this.u;
    u.uField.value = FIELD;
    u.uPx.value = 1 / view.ratio;
    u.uGlow.value.set(config.glow.size, config.glow.strength);
    u.uGlint.value.set(config.sparkle.size, rad(config.sparkle.rotation), config.sparkle.strength);
    // nearer depths lean further: each band's share of the lean, by its zoom response against the nearest's
    const bands = this.bands(config), most = Math.max(...bands.map((b) => Math.abs(b.zoomResponse)));
    u.uDepth.value.fromArray([0, 1, 2, 3].map((k) => (k < bands.length ? (most > 0 ? Math.abs(bands[k].zoomResponse) / most : (k + 1) / bands.length) : 0)));
    for (let k = 0; k < MOST_BANDS; k++) this.powers[k] = k < bands.length ? config.zoomResponse * bands[k].zoomResponse : 0;
    this.shot = null;
    this.nextShot = -1;
    u.uShootB.value.z = 0;
  }

  update(f: SkyFrame) {
    const c = this.cfg;
    if (!c) return;
    const u = this.u, p = this.powers;
    u.uTime.value = f.time % 10000;
    u.uOpacity.value = Math.max(0, c.opacity) * f.presence;
    u.uTwinkle.value.set(c.twinkle.speed, f.reducedMotion ? 0 : Math.min(1, Math.max(0, c.twinkle.amount)));
    const z = Math.max(f.zoom, 1e-3);
    u.uScale.value.set(z ** p[0], z ** p[1], z ** p[2], z ** p[3]);
    // leaning away from the pointer, as what is nearer does when you move your head
    const lean = f.reducedMotion ? 0 : c.parallax;
    u.uLean.value.set(-f.pointer.x * lean, -f.pointer.y * lean);
    this.shoot(f, c);
  }

  backdrop() {
    return this.cfg?.backdrop ?? null;
  }

  dispose() {
    this.object.geometry.dispose();
    this.object.material.dispose();
  }

  /** The bands in use: at most MOST_BANDS, and at least one. */
  private bands(c: Resolved<StarsConfig>) {
    const b = c.bands.slice(0, MOST_BANDS);
    return b.length ? b : [{ share: 1, zoomResponse: 0, scale: 1 }];
  }

  /**
   * The stars for a seed, over the whole sky (FIELD_MOST fields across): each depth from its own
   * stream, and the Milky Way's from another, with the same draws for every star, so each is the
   * same star whatever the room's size or the zoom's reach; kept only as far out as its depth can
   * be seen.
   */
  private lay(c: Resolved<StarsConfig>, seed: number, view: SkyView): Star[] {
    const bands = this.bands(c), shares = bands.map((b) => Math.max(0, b.share)), total = shares.reduce((s, v) => s + v, 0) || 1;
    const palette = c.palette.length ? c.palette : [{ colour: "#ffffff", weight: 1 }];
    const weights = Object.fromEntries(palette.map((p, k) => [k, p.weight]));
    const colours = palette.map((p) => rgb(p.colour));
    const { min: rMin, max: rMax, bias } = c.size, bMin = c.brightness.min, bMax = c.brightness.max, follow = Math.min(1, Math.max(0, c.brightness.follow));
    const halfW = view.width / (2 * FIELD), halfH = view.height / (2 * FIELD), lean = Math.abs(c.parallax) / FIELD;
    // how far out each depth can be seen: zoomed all the way out (or in, for one that runs backwards), leaning all the way
    const reach = bands.map((band) => {
      const resp = c.zoomResponse * band.zoomResponse, least = Math.min(1, view.zoom.min ** resp, view.zoom.max ** resp);
      return [Math.min(FIELD_MOST / 2, (halfW + lean) / least + 0.01), Math.min(FIELD_MOST / 2, (halfH + lean) / least + 0.01)];
    });
    const out: Star[] = [];
    const star = (x: number, y: number, k: number, uSize: number, uBright: number, uColour: number, uPhase: number, uSpeed: number, uTurn: number) => {
      if (Math.abs(x) > reach[k][0] || Math.abs(y) > reach[k][1]) return;
      const band = bands[k], grown = uSize ** Math.max(0.01, bias);
      const bright = bMin + (bMax - bMin) * (follow * grown + (1 - follow) * uBright);
      out.push({
        x,
        y,
        band: k,
        r: Math.max(0, (rMin + (rMax - rMin) * grown) * band.scale),
        b: Math.max(0, bright * band.scale),
        colour: colours[Number(pickWeighted(weights, uColour))] ?? colours[0],
        phase: uPhase * Math.PI * 2,
        speed: 0.5 + uSpeed,
        turn: (uTurn * 2 - 1) * rad(c.sparkle.jitter),
        glint: 0,
      });
    };
    // (arguments are drawn left to right, so every star takes its draws whether it is kept or not)
    const mw = c.milkyWay, gathered = mw.enabled ? Math.min(1, Math.max(0, mw.share)) : 0, count = Math.max(0, c.count);
    bands.forEach((_, k) => {
      const n = Math.round((count * (1 - gathered) * shares[k] * FIELD_MOST * FIELD_MOST) / total);
      const draw = rng(subSeed(seed, `band${k}`));
      for (let i = 0; i < n; i++) star((draw() - 0.5) * FIELD_MOST, (draw() - 0.5) * FIELD_MOST, k, draw(), draw(), draw(), draw(), draw(), draw());
    });
    if (gathered > 0) {
      // along the band's line, the whole sky's diagonal, spread across it, at the depths in their shares
      const long = FIELD_MOST * Math.SQRT2, n = Math.round(count * gathered * long), dir = [Math.cos(rad(mw.angle)), Math.sin(rad(mw.angle))];
      const depths = Object.fromEntries(shares.map((s, k) => [k, s]));
      const draw = rng(subSeed(seed, "milky"));
      for (let i = 0; i < n; i++) {
        const along = (draw() - 0.5) * long, across = mw.offset + gauss(draw(), draw()) * mw.width, k = Number(pickWeighted(depths, draw()));
        star(along * dir[0] - across * dir[1], along * dir[1] + across * dir[0], k, draw(), draw(), draw(), draw(), draw(), draw());
      }
    }
    // the glints: the brightest in view at zoom 1, clear of the edges; fewer in a small room
    const x0 = halfW - GLINT_CLEAR, y0 = halfH - GLINT_CLEAR;
    const shown = out.filter((s) => Math.abs(s.x) < x0 && Math.abs(s.y) < y0).sort((a, b) => b.r * b.b - a.r * a.b);
    const room = Math.min(2, Math.sqrt((view.width * view.height) / GLINT_AREA));
    const glints = Math.min(shown.length, Math.max(0, Math.round(c.sparkle.count * room)));
    const tint = rgb(c.sparkle.tint), tintMix = Math.min(1, Math.max(0, c.sparkle.tintMix));
    for (let g = 0; g < glints; g++) {
      const s = shown[g];
      s.glint = glints > 1 ? 1 - (0.45 * g) / (glints - 1) : 1;
      s.colour = mixRgb(s.colour, tint, tintMix);
    }
    return out;
  }

  /** The band's haze: one quad along its line, as long as it can be seen, at the farthest depth; its clouds start where its seed says. */
  private haze(c: Resolved<StarsConfig>, seed: number, view: SkyView) {
    const mw = c.milkyWay, heading = rad(mw.angle);
    const least = Math.min(1, view.zoom.min ** (c.zoomResponse * this.bands(c)[0].zoomResponse));
    const lean = Math.abs(c.parallax) / FIELD;
    return {
      x: -mw.offset * Math.sin(heading),
      y: mw.offset * Math.cos(heading),
      width: Math.max(0.001, mw.width),
      bright: Math.max(0, mw.haze),
      heading,
      half: (Math.hypot(view.width, view.height) / (2 * FIELD) + lean) / least + Math.abs(mw.offset) + 0.1,
      colour: rgb(mw.hazeColour),
      patchy: Math.min(1, Math.max(0, mw.patchy)),
      cloud: rng(subSeed(seed, "haze"))() * 100,
    };
  }

  /** The shooting star: once the sky is all there and it is time, one crosses the upper sky; only uniforms change. */
  private shoot(f: SkyFrame, c: Resolved<StarsConfig>) {
    const sh = c.shooting, B = this.u.uShootB.value, view = this.view;
    if (!sh.enabled || f.reducedMotion || !view || sh.duration <= 0) {
      B.z = 0;
      return;
    }
    if (!this.shot) {
      B.z = 0;
      if (this.nextShot < 0) this.nextShot = f.time + sh.every * (0.4 + 0.6 * Math.random());
      if (f.state !== "afloat" || f.presence < 1 || f.time < this.nextShot) return;
      // from the upper sky, heading down toward the middle at a shallow slant
      const x = (Math.random() - 0.5) * SHOT.across * view.width;
      const y = (SHOT.high[0] + Math.random() * (SHOT.high[1] - SHOT.high[0])) * view.height;
      const tilt = rad(SHOT.tilt[0] + Math.random() * (SHOT.tilt[1] - SHOT.tilt[0]));
      this.shot = { x, y, heading: x > 0 ? Math.PI + tilt : -tilt, t0: f.time };
    }
    const s = this.shot, p = (f.time - s.t0) / sh.duration;
    if (p >= 1) {
      this.shot = null;
      this.nextShot = f.time + sh.every * (1 / 3 + (4 / 3) * Math.random());
      B.z = 0;
      return;
    }
    // slow, easing out a little; the tail grows in its first third, and it brightens and fades on a sine
    const along = sh.travel * (1 - (1 - p) ** 1.4);
    this.u.uShootA.value.set(s.x + Math.cos(s.heading) * along, s.y + Math.sin(s.heading) * along, s.heading, 0);
    B.set(sh.length * Math.min(1, p / 0.35), sh.width, Math.max(0, sh.brightness) * Math.sin(Math.PI * p) ** 0.6, 0);
  }
}
