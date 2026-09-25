import * as THREE from "three";
import gsap from "gsap";
import type { Text } from "troika-three-text";
import { sfx } from "@/audio/sfx";
import { statusWord, type Media, type Project, type SpaceItem } from "@/content/site";
import { GL } from "@/engine/common/color";
import { loadImage, loadMedia, makeRenderer, upload, type Loaded } from "@/engine/common/loader";
import { FONT, makeText, syncText } from "@/engine/common/text";
import { EdgeGlass } from "./edgeGlass";

/** What the pointer rests on: a project's mark or one of its pieces, or a study. */
export type ThreadTarget = { kind: "project"; project: Project } | { kind: "study"; piece: SpaceItem };

export type ThreadOptions = {
  heading: { lead: string; tail: string };
  reducedMotion?: boolean;
  /** What is chosen, and whether the pointer chose it (the keys and taps choose too). */
  onHover(target: ThreadTarget | null, byPointer: boolean): void;
  /** A project unspooled (its slug belongs in the URL), or the thread wound back in (null). */
  onOpen(project: Project | null): void;
};

/** A text and the box it rises out of: the site's masked entrance, done in troika. */
type Masked = {
  t: Text;
  box: [number, number, number, number];
  base: THREE.Vector2;
  /** -1: rises from below. 1: falls from above (a dead project's verdict). */
  dir: 1 | -1;
  offset: number;
  /** The offset that hides the text completely. */
  span: number;
};

type Piece = {
  bead: Bead;
  /** 0 is the cover; the rest are the project's pieces in file order. */
  index: number;
  aspect: number;
  /** Height on the ball, px at R_REF: the cover largest. */
  h: number;
  /** The piece's centre along the thread from its mark, and above the thread, px at R_REF. */
  along: number;
  up: number;
  /** Past MANY projects a mark hangs only its cover and two pieces; the rest wait for the unspool. */
  onBall: boolean;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  still: Loaded;
  /** A video piece's video, or the cover's hover media, fetched when the project opens. */
  moving: Promise<Loaded | null> | null;
  movingMedia: Media | null;
  /** It has reached its frame in this unspool: it ticked as it landed. */
  landed: boolean;
  /** Last frame's rect on screen (centre and size), its depth and ink: the hit test reads these. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  sz: number;
  ink: number;
};

type Bead = {
  project: Project | null;
  study: SpaceItem | null;
  year: number;
  /** 1: its work hangs outward and its tick stands north. -1: dead, hung inward, the tick hanging south. */
  side: 1 | -1;
  /** The mark, as a (fractional) sample index along the thread. */
  i: number;
  /** Its stretch of thread: its share of its year, in sample indices. */
  i0: number;
  i1: number;
  pieces: Piece[];
  /** 0 → 1 as the thread reaches it in the reveal. */
  pop: number;
  popped: boolean;
  /** 0 → 1 while it is the one hovered: its stretch goes to full ink. */
  hl: number;
  dot: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | null;
  cap: { name: Masked; status: Masked; why: Masked };
  open: { name: Masked; status: Masked; why: Masked; summary: Masked; link: Masked } | null;
  /** The mark on screen last frame, and its depth. */
  mx: number;
  my: number;
  mz: number;
  crossed: number;
};

/** Where an opened project lies: along is x on a wide screen, y on a phone. */
type Layout = {
  vertical: boolean;
  /** The line's y (wide) or x (phone), px. */
  line: number;
  mark: number;
  /** Where the stretch's two ends land, off screen. */
  start: number;
  end: number;
  /** Frame centres (along, across) and sizes, px; across is the absolute other coordinate. */
  frames: { along: number; across: number; w: number; h: number }[];
  /** How far the content runs along the line, px; past the viewport it scrolls. */
  length: number;
};

/** The heading's line, where the horizon had it and where Notes and Music set theirs. */
const HEADING_Y = 206;
const HEADING_CLEAR = 24;
/** Room kept over the ball for the loose end and the pieces near the top, at R_REF. */
const TOP_ROOM = 64;
/** The radius every px size on the ball is drawn at; the ball scales them with it. */
const R_REF = 210;
const D_MAX = 420;
const PHONE = 640;
const PHONE_D = 0.88;
const GROWTH_MAX = 1.4;
const TURNS_PER_YEAR = 1.5;
/** Each turn's lean, radians at the equator, and how fast the lean walks round (cycles per turn). */
const WOBBLE = 0.16;
const WOBBLE_RATE = 0.618;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** The axis leans toward you, so the top turns read as rings and the ball as a ball. */
const TILT = THREE.MathUtils.degToRad(15);
const IDLE = THREE.MathUtils.degToRad(6); // rad/s
/** The camera's distance in radii: a little perspective, so the near side swells. */
const FOCAL = 6;
const NORM = Math.sqrt(FOCAL * FOCAL - 1) / FOCAL;
/** Arc between thread samples on the unit sphere: about 3px at R_REF. */
const STEP = 0.014;
const BACK_INK = 0.25;
const DIM = 0.35;
const TICK = 24;
const BREATHE = 4; // the alive tick reaches 28
const BREATHE_PERIOD = 2.4;
const LOOSE = 40;
const COVER_H = 56;
const PIECE_H = [40, 36, 38, 36, 40, 36];
const STUDY_H = 38;
/** Between the thread and a piece's near edge, and how far out (in, for dead work) it hangs. */
const HANG_GAP = 8;
const HANG_OUT = 14;
const ROW_LEAD = 12;
const ROW_GAP = 8;
const MARK_GAP = 40;
const CAP_GAP = 40;
const NAME_SIZE = 22;
const STATUS_SIZE = 11;
const WHY_SIZE = 14;
const WHY_MAX = 450;
const DEAD_INK = 0.7;
// The unspooled line: the horizon again.
const LINE_Y = 0.58;
const LINE_X = 0.38;
const FRAME_H = 240;
const FRAME_MIN = 132;
const FRAME_GAP = 24;
const FRAME_OFF = 40;
const MARGIN = 96;
const PHONE_TEXT_INSET = 36;
const PHONE_FRAME_W = 168;
const MARK_LEAD = 40;
const OPEN_DUR = 2.1;
const CLOSE_DUR = 0.9;
/** A click this soon after opening is the rest of a double click, ms. */
const DOUBLE_CLICK = 400;
/**
 * How much later the ends of the stretch leave the ball than its mark: at
 * 2.6 about a third of the stretch is in the air at once, so the peel has a
 * tip that travels, and what is behind it lies straight.
 */
const SPREAD = 2.6;
/** A riding piece reaches its frame once the thread there is this far off the ball (0..1): on the straight. */
const RIDE_LIFT = 0.92;
/** The shortest ride, in unspool progress, so the cover grows into its frame rather than snapping. */
const RIDE_MIN = 0.2;
const RECEDE_INK = 0.15;
const RECEDE_PIECE_INK = 0.07;
const RECEDE_SCALE = 0.86;
/**
 * Under an opened project's words the receded ball thins to this share of
 * its ink, over a soft edge, so the words are read on the dark and not
 * through the rings.
 */
const VEIL_INK = 0.2;
const VEIL_PAD = 14;
const VEIL_FEATHER = 44;
/** A piece on the ball fades out before it crosses this margin at the screen's sides: a phone's ball nearly fills the width. */
const SIDE_MARGIN = 16;
/** Past this many projects a mark hangs only its cover and two pieces. */
const MANY = 24;
/** From this many, only marks on the front half hang pieces at all. */
const CROWD = 40;
/** Past this many projects the hung pieces start to shrink. */
const CROWD_FROM = 12;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const outCubic = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** The far side of the thread falls to a quarter of the ink: a wire ball, not a disc. */
const depthInk = (z: number) => BACK_INK + (1 - BACK_INK) * smooth(clamp01((z + 0.85) / 1.7));
const blockBounds = (t: Text): [number, number, number, number] => t.textRenderInfo?.blockBounds ?? [0, 0, 0, 0];

/** The year as a number with its fraction: 25 September 2026 is about 2026.73. */
function fractionalYear(d: Date) {
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  return y + (d.getTime() - start) / (end - start);
}

// ---------------------------------------------------------------- the thread's ink

const lineVert = /* glsl */ `
attribute float aEdge;
attribute float aInk;
varying float vEdge;
varying float vInk;
void main() {
  vEdge = aEdge;
  vInk = aInk;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** A 1 CSS px line with a one device pixel ramp each side, whatever the pixel ratio. */
const lineFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uHalf;
uniform float uDpr;
varying float vEdge;
varying float vInk;
void main() {
  float d = abs(vEdge) * uHalf * uDpr;
  float cover = clamp(0.5 * uDpr + 0.5 - d, 0.0, 1.0);
  gl_FragColor = vec4(uColor, vInk * cover);
}`;

/**
 * Screen-space ribbons: every polyline handed in becomes a strip 1px wide,
 * rebuilt each frame from points the CPU already projected. WebGL lines are
 * one device pixel, which is half a CSS pixel on a retina screen: too thin
 * to read as thread.
 */
class Ribbons {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private pos: Float32Array;
  private edge: Float32Array;
  private ink: Float32Array;
  private index: Uint32Array;
  private nv = 0;
  private ni = 0;
  private half = 1;

  constructor(
    material: THREE.ShaderMaterial,
    private capacity: number,
  ) {
    this.pos = new Float32Array(capacity * 2 * 3);
    this.edge = new Float32Array(capacity * 2);
    this.ink = new Float32Array(capacity * 2);
    this.index = new Uint32Array(capacity * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aEdge", new THREE.BufferAttribute(this.edge, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aInk", new THREE.BufferAttribute(this.ink, 1).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(this.index, 1).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.frustumCulled = false;
  }

  begin(half: number) {
    this.nv = 0;
    this.ni = 0;
    this.half = half;
  }

  /** Points from..to (inclusive) of arrays that already hold each point's unit normal. */
  strip(xs: Float32Array, ys: Float32Array, ink: Float32Array, nx: Float32Array, ny: Float32Array, from: number, to: number) {
    const count = to - from + 1;
    if (count < 2 || this.nv + count > this.capacity) return;
    const h = this.half;
    const v0 = this.nv;
    const pos = this.pos;
    for (let k = from; k <= to; k++) {
      const v = this.nv++;
      const x = xs[k];
      const y = -ys[k];
      const ox = nx[k] * h;
      const oy = -ny[k] * h;
      const o = v * 6;
      pos[o] = x + ox;
      pos[o + 1] = y + oy;
      pos[o + 2] = 0;
      pos[o + 3] = x - ox;
      pos[o + 4] = y - oy;
      pos[o + 5] = 0;
      this.edge[v * 2] = 1;
      this.edge[v * 2 + 1] = -1;
      this.ink[v * 2] = ink[k];
      this.ink[v * 2 + 1] = ink[k];
    }
    const idx = this.index;
    for (let s = 0; s < count - 1; s++) {
      const a = (v0 + s) * 2;
      const n = this.ni;
      idx[n] = a;
      idx[n + 1] = a + 1;
      idx[n + 2] = a + 2;
      idx[n + 3] = a + 1;
      idx[n + 4] = a + 3;
      idx[n + 5] = a + 2;
      this.ni += 6;
    }
  }

  end() {
    const g = this.mesh.geometry;
    (["position", "aEdge", "aInk"] as const).forEach((n) => {
      const attr = g.getAttribute(n) as THREE.BufferAttribute;
      attr.clearUpdateRanges();
      attr.addUpdateRange(0, this.nv * 2 * attr.itemSize);
      attr.needsUpdate = true;
    });
    const idx = g.getIndex()!;
    idx.clearUpdateRanges();
    idx.addUpdateRange(0, this.ni);
    idx.needsUpdate = true;
    g.setDrawRange(0, this.ni);
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}

/** Small polylines (ticks, rings, the loose end, connectors): their own scratch arrays and normals. */
class Scratch {
  x = new Float32Array(64);
  y = new Float32Array(64);
  a = new Float32Array(64);
  nx = new Float32Array(64);
  ny = new Float32Array(64);
  n = 0;
  reset() {
    this.n = 0;
  }
  push(x: number, y: number, a: number) {
    if (this.n >= 64) return;
    this.x[this.n] = x;
    this.y[this.n] = y;
    this.a[this.n] = a;
    this.n++;
  }
  normals(closed = false) {
    fillNormals(this.x, this.y, this.nx, this.ny, this.n, closed);
  }
}

function fillNormals(xs: Float32Array, ys: Float32Array, nx: Float32Array, ny: Float32Array, n: number, closed = false) {
  let px = 0;
  let py = -1;
  for (let k = 0; k < n; k++) {
    const a = closed ? (k - 1 + n) % n : Math.max(0, k - 1);
    const b = closed ? (k + 1) % n : Math.min(n - 1, k + 1);
    const dx = xs[b] - xs[a];
    const dy = ys[b] - ys[a];
    const l = Math.hypot(dx, dy);
    if (l > 1e-6) {
      px = -dy / l;
      py = dx / l;
    }
    nx[k] = px;
    ny[k] = py;
  }
}

// ---------------------------------------------------------------- the pieces

const pieceVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * A billboard: the still, crossfaded by uMix to the moving media once a
 * project opens; faded by depth, and softly blurred when it hangs inside.
 */
const pieceFrag = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uAlt;
uniform float uMix;
uniform float uMapAspect;
uniform float uAltAspect;
uniform float uPlaneAspect;
uniform float uFade;
uniform float uBlur;
varying vec2 vUv;
vec2 fit(vec2 uv, float img, float plane) {
  vec2 s = vec2(1.0);
  if (img > plane) s.x = plane / img; else s.y = img / plane;
  return (uv - 0.5) * s + 0.5;
}
vec3 tap(vec2 uv) {
  vec3 a = texture2D(uMap, fit(uv, uMapAspect, uPlaneAspect)).rgb;
  if (uMix < 0.001) return a;
  return mix(a, texture2D(uAlt, fit(uv, uAltAspect, uPlaneAspect)).rgb, uMix);
}
void main() {
  vec3 c;
  if (uBlur < 0.001) {
    c = tap(vUv);
  } else {
    float r = uBlur * 0.05;
    float d = r * 0.7071;
    c = tap(vUv) * 0.2
      + (tap(vUv + vec2(r, 0.0)) + tap(vUv - vec2(r, 0.0)) + tap(vUv + vec2(0.0, r)) + tap(vUv - vec2(0.0, r))) * 0.1
      + (tap(vUv + vec2(d, d)) + tap(vUv - vec2(d, d)) + tap(vUv + vec2(d, -d)) + tap(vUv - vec2(d, -d))) * 0.1;
  }
  gl_FragColor = vec4(c, uFade);
}`;

/** The still a piece shows on the ball: an image, or a video's poster. */
const stillOf = (m: Media) => (m.kind === "video" ? m.poster : m.src);

/**
 * Projects (tab 2): the wound horizon. The horizon's one ink line, wound
 * into a small ball of thread: a spherical spiral from his first year at the
 * bottom pole to now at the top, arc length in proportion to time, so an
 * empty year is bare thread and a busy one is knotted with work. Each
 * project is a mark on the thread at its year, in the horizon's grammar,
 * with its pieces hanging off it; opening one unspools its stretch of thread
 * back into a horizon for that project alone.
 *
 * Everything is projected on the CPU into CSS px and drawn with an
 * orthographic camera (world y = -px), so the ball and the straight line are
 * the same points in two places, and the unspool is a blend between them.
 */
export class ThreadScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
  /** The opened project's texts: they travel with the line when it scrolls. */
  private openGroup = new THREE.Group();
  private beads: Bead[] = [];
  private order: Bead[] = [];
  private pieces: Piece[] = [];
  private heading: { lead: Masked; tail: Masked } | null = null;
  private headingTwoLines = false;
  private headingDimmed = false;
  private lineMat: THREE.ShaderMaterial;
  private back: Ribbons | null = null;
  private front: Ribbons | null = null;
  private scratch = new Scratch();
  /** The glass rims: the standing line on a phone scrolls through them, as the old horizon did. */
  private glass: EdgeGlass;
  private lastScroll = 0;
  private dotGeo = new THREE.CircleGeometry(1, 20);
  private planeGeo = new THREE.PlaneGeometry(1, 1);

  // The thread: M samples on the unit sphere, evenly spaced along it, and their tangents.
  private M = 0;
  private P = new Float32Array(0);
  private TG = new Float32Array(0);
  private T0 = 0;
  private T1 = 1;
  // This frame, per sample: screen position, depth, ink, normal; and which bead's stretch it is.
  private SX = new Float32Array(0);
  private SY = new Float32Array(0);
  private SZ = new Float32Array(0);
  private SA = new Float32Array(0);
  private NX = new Float32Array(0);
  private NY = new Float32Array(0);
  private lifted = new Float32Array(0);
  private owner = new Int16Array(0);

  // Layout, CSS px.
  private width = 1;
  private height = 1;
  private R = 200;
  private cx = 0;
  private cy = 0;
  private capY = 0;

  // Motion.
  private angle = 0;
  private lastAngle = 0;
  private yaw = 0;
  private targetYaw = 0;
  private vel = 0;
  /** The idle spin's share: 1 turns at IDLE. Reduced motion starts (and stays) at 0. */
  private idleK: number;
  private drag: { x: number; y: number; t: number; moved: boolean } | null = null;
  private turning: gsap.core.Tween | null = null;
  private loose = { x: 0, v: 0 };
  private clock = 0;
  private draw = { value: 0 };
  private cursorOn = false;
  private rot = { ca: 1, sa: 0, ct: Math.cos(TILT), st: Math.sin(TILT) };

  // Hover and the open project.
  private hovered: Bead | null = null;
  private dim = 0;
  private pointerAt: { x: number; y: number } | null = null;
  /** The keys chose something: it holds until the pointer next moves. */
  private keyHold = false;
  private opened: Bead | null = null;
  private layoutO: Layout | null = null;
  private unspool = { p: 0 };
  /** Reduced motion: the open state crossfades in over 0.3s instead of unspooling. */
  private fadeIn = { value: 0 };
  private openTl: gsap.core.Timeline | null = null;
  private afterClose: (() => void) | null = null;
  /** Winding back in: a second click on the same project turns it round. */
  private closing = false;
  /** When the open project began to unspool, ms. */
  private openedAt = -Infinity;
  private scroll = { cur: 0, target: 0, max: 0 };
  private caseHot = false;
  private caseLift = { v: 0 };
  private coverHot: Piece | null = null;
  /** The opened project's words on screen, padded, and how far the ball has thinned under them (0..1). */
  private veil = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };

  private ready = false;
  private disposed = false;
  private pendingOpen: string | null = null;
  private intro: gsap.core.Timeline | null = null;
  private ctx = gsap.context(() => undefined);
  private ticker: (t: number, dt: number) => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private projects: Project[],
    private items: SpaceItem[],
    private opts: ThreadOptions,
  ) {
    this.renderer = makeRenderer(canvas);
    this.idleK = opts.reducedMotion ? 0 : 1;
    this.camera.position.z = 10;
    this.lineMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: GL.ink }, uHalf: { value: 1 }, uDpr: { value: 1 } },
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // A strip's winding follows the thread's direction on screen, so either face may show.
      side: THREE.DoubleSide,
    });
    this.scene.add(this.openGroup);
    this.glass = new EdgeGlass(this.renderer, 60, 60, "y");
    this.measure();
    this.ticker = (_t, dtMs) => this.frame(Math.min(dtMs, 64) / 1000);
    gsap.ticker.add(this.ticker);
  }

  private get vertical() {
    return this.width < PHONE;
  }

  private dur(s: number) {
    return this.opts.reducedMotion ? 0 : s;
  }

  private measure() {
    this.width = this.canvas.clientWidth || 1;
    this.height = this.canvas.clientHeight || 1;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.left = 0;
    this.camera.right = this.width;
    this.camera.top = 0;
    this.camera.bottom = -this.height;
    this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.lineMat.uniforms.uDpr.value = dpr;
    this.lineMat.uniforms.uHalf.value = 0.5 + 0.75 / dpr;
    this.glass.resize();
    this.glass.setAxis("y");
    // Only a phone's standing line scrolls through the rims; on a wide screen they would only
    // pull the end frames into the edges.
    this.glass.enabled = !this.opts.reducedMotion && this.vertical;
  }

  // ---------------------------------------------------------------- build

  async load(): Promise<void> {
    // A picture that fails to load leaves its mark bare rather than the page blank.
    const stills = await Promise.all([
      ...this.projects.map((p) => loadImage(p.cover).catch(() => null)),
      ...this.items.map((it) => loadImage(stillOf(it.media)).catch(() => null)),
    ]);
    if (this.disposed) {
      stills.forEach((s) => s?.dispose());
      return;
    }
    const covers = stills.slice(0, this.projects.length);
    const itemStills = stills.slice(this.projects.length);
    upload(this.renderer, stills.filter((s): s is Loaded => !!s));

    const lead = makeText(this.opts.heading.lead, { font: FONT.grotesk, size: 16, anchorY: "middle", letterSpacing: -0.02 });
    const tail = makeText(this.opts.heading.tail, { font: FONT.serif, size: 16, anchorY: "middle" });
    [lead, tail].forEach((t) => {
      t.material.transparent = true;
      t.renderOrder = 900;
      this.scene.add(t);
    });
    this.heading = { lead: this.masked(lead), tail: this.masked(tail) };

    const many = this.projects.length > MANY;
    this.projects.forEach((project, k) => {
      const own = this.items.map((it, j) => ({ it, still: itemStills[j] })).filter(({ it, still }) => it.project === project.slug && still);
      const bead = this.makeBead(project, null, project.year, project.status === "dead" ? -1 : 1);
      const cover = covers[k];
      if (cover) this.addPiece(bead, cover, cover.aspect || 0.75, project.hover, true);
      own.forEach(({ it, still }) => this.addPiece(bead, still!, it.aspect || still!.aspect, it.media.kind === "video" ? it.media : null, !many || bead.pieces.length < 3));
    });
    this.items.forEach((it, j) => {
      if (it.project && this.projects.some((p) => p.slug === it.project)) return;
      const still = itemStills[j];
      if (!still) return;
      const bead = this.makeBead(null, it, it.year, 1);
      this.addPiece(bead, still, it.aspect || still.aspect, it.media.kind === "video" ? it.media : null, true);
    });

    this.wind();
    this.back = new Ribbons(this.lineMat, this.M + 256 + this.beads.length * 64);
    this.front = new Ribbons(this.lineMat, this.M + 256 + this.beads.length * 64);
    this.back.mesh.renderOrder = 200;
    this.front.mesh.renderOrder = 400;
    this.scene.add(this.back.mesh, this.front.mesh);

    await this.layout();
    if (this.disposed) return;
    this.ready = true;
    this.rest();
    const slug = this.pendingOpen;
    this.pendingOpen = null;
    const deep = slug ? this.beads.find((b) => b.project?.slug === slug) : undefined;
    this.reveal(!!deep);
    if (deep) this.openBead(deep, { immediate: true });
  }

  private makeBead(project: Project | null, study: SpaceItem | null, year: number, side: 1 | -1): Bead {
    const title = project?.title ?? study?.title ?? "";
    const dead = project?.status === "dead";
    const light = dead || project?.status === "paused";
    const name = makeText(title, { font: light ? FONT.serifLight : FONT.serif, size: NAME_SIZE, anchorX: "center" });
    const status = makeText(project ? statusWord(project) : `study ${year}`, { font: FONT.grotesk, size: STATUS_SIZE, anchorX: "center" });
    const whyText = project?.why ?? study?.description.join(" ") ?? "";
    const why = makeText(whyText, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX, align: "center", anchorX: "center" });
    [name, status, why].forEach((t) => {
      t.material.transparent = true;
      t.renderOrder = 900;
      this.scene.add(t);
    });
    if (dead) name.material.opacity = DEAD_INK;

    let open: Bead["open"] = null;
    if (project) {
      const oName = makeText(title, { font: light ? FONT.serifLight : FONT.serif, size: NAME_SIZE });
      const oStatus = makeText(statusWord(project), { font: FONT.grotesk, size: STATUS_SIZE });
      const oWhy = makeText(project.why, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX });
      const oSummary = makeText(project.summary, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX });
      const oLink = makeText("Case", { font: FONT.grotesk, size: 12 });
      [oName, oStatus, oWhy, oSummary, oLink].forEach((t) => {
        t.material.transparent = true;
        t.renderOrder = 950;
        t.visible = false; // until its project opens
        this.openGroup.add(t);
      });
      if (dead) oName.material.opacity = DEAD_INK;
      open = { name: this.masked(oName), status: this.masked(oStatus), why: this.masked(oWhy), summary: this.masked(oSummary), link: this.masked(oLink) };
    }

    let dot: Bead["dot"] = null;
    // A shipped project wears the horizon's dot on its tick; a study is a bead on the thread itself.
    if (!project || project.status === "shipped") {
      dot = new THREE.Mesh(this.dotGeo, new THREE.MeshBasicMaterial({ color: GL.ink, transparent: true, depthTest: false, depthWrite: false }));
      this.scene.add(dot);
    }
    const bead: Bead = {
      project,
      study,
      year,
      side,
      i: 0,
      i0: 0,
      i1: 0,
      pieces: [],
      pop: 0,
      popped: false,
      hl: 0,
      dot,
      cap: { name: this.masked(name), status: this.masked(status), why: this.masked(why) },
      open,
      mx: 0,
      my: 0,
      mz: -1,
      crossed: 0,
    };
    this.beads.push(bead);
    return bead;
  }

  private addPiece(bead: Bead, still: Loaded, aspect: number, moving: Media | null, onBall: boolean) {
    const index = bead.pieces.length;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: still.texture },
        uAlt: { value: still.texture },
        uMix: { value: 0 },
        uMapAspect: { value: still.aspect || aspect },
        uAltAspect: { value: still.aspect || aspect },
        uPlaneAspect: { value: aspect },
        uFade: { value: 0 },
        uBlur: { value: 0 },
      },
      vertexShader: pieceVert,
      fragmentShader: pieceFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.planeGeo, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    const piece: Piece = {
      bead,
      index,
      aspect,
      h: (bead.study ? STUDY_H : index === 0 ? COVER_H : PIECE_H[(index - 1) % PIECE_H.length]) * this.crowdScale,
      along: 0,
      up: 0,
      onBall,
      mesh,
      still,
      moving: null,
      movingMedia: moving,
      landed: false,
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
      sz: -1,
      ink: 0,
    };
    bead.pieces.push(piece);
    this.pieces.push(piece);
  }

  /** More work hangs smaller, so the thread stays the thing you see: full size up to a dozen projects, half at about fifty. */
  private get crowdScale() {
    return Math.max(0.5, Math.min(1, Math.sqrt(CROWD_FROM / Math.max(1, this.projects.length))));
  }

  private masked(t: Text): Masked {
    return { t, box: [0, 0, 0, 0], base: new THREE.Vector2(), dir: -1, offset: 0, span: 0 };
  }

  /**
   * Winds the thread: a spherical spiral with its turns evenly spaced in
   * latitude, resampled evenly along its length so that sample index is
   * time. Then each bead is tied on at its year: a year's beads sit together
   * around the middle of that year (the data knows years, not months), and
   * each owns its share of the year's thread.
   */
  private wind() {
    const now = fractionalYear(new Date());
    // With nothing tied on yet, the thread is this year so far.
    const years = this.beads.length ? this.beads.map((b) => b.year) : [Math.floor(now)];
    this.T0 = Math.min(...years);
    this.T1 = Math.max(now, Math.max(...years) + 0.25);
    const turns = TURNS_PER_YEAR * (this.T1 - this.T0);

    // A dense table first, then even steps along its arc. Each turn leans a little, and the lean
    // walks round from turn to turn, so neighbouring turns cross the way wound thread does instead
    // of stacking like a spring. The lean fades out at the poles.
    const K = Math.ceil(turns * 1440);
    const at = (s: number, out: THREE.Vector3) => {
      const lat0 = -Math.PI / 2 + Math.PI * s;
      const lon = Math.PI * 2 * turns * s;
      const lat = lat0 + WOBBLE * Math.cos(lat0) * Math.sin(lon * WOBBLE_RATE);
      return out.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
    };
    const arc = new Float64Array(K + 1);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    at(0, a);
    for (let k = 1; k <= K; k++) {
      at(k / K, b);
      arc[k] = arc[k - 1] + a.distanceTo(b);
      a.copy(b);
    }
    const total = arc[K];
    const M = Math.max(2, Math.ceil(total / STEP) + 1);
    const P = new Float32Array(M * 3);
    let k = 0;
    for (let i = 0; i < M; i++) {
      const target = (total * i) / (M - 1);
      while (k < K - 1 && arc[k + 1] < target) k++;
      const f = (target - arc[k]) / Math.max(1e-9, arc[k + 1] - arc[k]);
      at((k + clamp01(f)) / K, a);
      P.set([a.x, a.y, a.z], i * 3);
    }
    const TG = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      const p = Math.max(0, i - 1) * 3;
      const q = Math.min(M - 1, i + 1) * 3;
      a.set(P[q] - P[p], P[q + 1] - P[p + 1], P[q + 2] - P[p + 2]).normalize();
      TG.set([a.x, a.y, a.z], i * 3);
    }
    this.M = M;
    this.P = P;
    this.TG = TG;
    this.SX = new Float32Array(M);
    this.SY = new Float32Array(M);
    this.SZ = new Float32Array(M);
    this.SA = new Float32Array(M);
    this.NX = new Float32Array(M);
    this.NY = new Float32Array(M);
    this.lifted = new Float32Array(M);
    this.owner = new Int16Array(M).fill(-1);

    // Tie the beads on, a year at a time.
    const pxToIdx = 1 / (STEP * R_REF);
    const idxOf = (t: number) => ((t - this.T0) / (this.T1 - this.T0)) * (M - 1);
    // A project's pieces sit together just past its mark, a knot of work: the cover standing on
    // the thread, the rest in two short rows beside it, the upper one set a little in, as if hung
    // by hand. They string out into one row only when the project unspools.
    const rowLen = (bead: Bead) => {
      const [first, ...rest] = bead.pieces.filter((pc) => pc.onBall);
      if (!first) return ROW_LEAD;
      const coverW = first.h * first.aspect;
      first.along = ROW_LEAD + coverW / 2;
      first.up = HANG_GAP + first.h / 2;
      const x0 = ROW_LEAD + coverW + ROW_GAP;
      const low = rest.slice(0, Math.ceil(rest.length / 2));
      const high = rest.slice(low.length);
      let end = ROW_LEAD + coverW;
      let lowH = 0;
      [low, high].forEach((row, r) => {
        let x = x0 + (r ? ROW_GAP * 1.5 : 0);
        row.forEach((pc) => {
          const w = pc.h * pc.aspect;
          pc.along = x + w / 2;
          pc.up = HANG_GAP + (r ? lowH + ROW_GAP / 2 : 0) + pc.h / 2;
          x += w + ROW_GAP;
          if (!r) lowH = Math.max(lowH, pc.h);
        });
        end = Math.max(end, x - ROW_GAP);
      });
      return end;
    };
    const byYear = new Map<number, Bead[]>();
    this.beads.forEach((bd) => byYear.set(bd.year, [...(byYear.get(bd.year) ?? []), bd]));
    const lonAt = (i: number) => {
      const k = Math.max(0, Math.min(M - 1, Math.round(i))) * 3;
      return Math.atan2(P[k], P[k + 2]);
    };
    let lastLon: number | null = null;
    [...byYear.keys()]
      .sort((x, y) => x - y)
      .forEach((year) => {
        const list = byYear.get(year)!;
        const lo = idxOf(year);
        const hi = idxOf(Math.min(year + 1, this.T1));
        const lens = list.map((bd) => rowLen(bd) * pxToIdx);
        const gap = MARK_GAP * pxToIdx;
        let span = lens.reduce((s, l) => s + l, 0) + gap * (list.length - 1);
        // A crowded year squeezes its gaps, then its rows, to stay inside the year.
        const squeeze = Math.min(1, (hi - lo) / Math.max(1e-6, span));
        span *= squeeze;
        // The data knows years, not months, so where in its year a knot sits is free: each one
        // steps round the ball from the last by the golden angle, never near the year's edges.
        let x = (lo + hi) / 2 - span / 2;
        const edge = (hi - lo) * 0.12;
        const from = lo + edge;
        const to = hi - edge - span;
        if (lastLon !== null && to > from) {
          const want = lastLon + GOLDEN;
          let best = Infinity;
          for (let c = 0; c <= 96; c++) {
            const at = lerp(from, to, c / 96);
            const d = Math.abs(Math.atan2(Math.sin(lonAt(at + span / 2) - want), Math.cos(lonAt(at + span / 2) - want)));
            if (d < best) {
              best = d;
              x = at;
            }
          }
        }
        lastLon = lonAt(x + span / 2);
        list.forEach((bd, j) => {
          bd.i = x;
          x += (lens[j] + gap) * squeeze;
          if (squeeze < 1) bd.pieces.forEach((pc) => (pc.along *= squeeze));
        });
        // Each bead's stretch: to the midpoints between neighbours, and to the year's ends.
        list.forEach((bd, j) => {
          const end = bd.i + lens[j] * squeeze;
          bd.i0 = j === 0 ? lo : (bd.i + (list[j - 1].i + lens[j - 1] * squeeze)) / 2;
          bd.i1 = j === list.length - 1 ? hi : (end + list[j + 1].i) / 2;
        });
      });
    this.order = [...this.beads].sort((x, y) => x.i - y.i);
    this.order.forEach((bd) => {
      const bi = this.beads.indexOf(bd);
      for (let i = Math.max(0, Math.ceil(bd.i0)); i <= Math.min(M - 1, Math.floor(bd.i1)); i++) this.owner[i] = bi;
    });
  }

  // ---------------------------------------------------------------- layout

  /** Sizes and places the ball, the heading and the captions; the texts measure first. */
  private async layout() {
    const W = this.width;
    const H = this.height;
    const v = this.vertical;
    const capMax = v ? Math.min(WHY_MAX, W - 48) : WHY_MAX;
    this.beads.forEach((b) => {
      b.cap.why.t.maxWidth = capMax;
      if (b.open) {
        const w = v ? Math.max(160, W - Math.round(W * LINE_X) - PHONE_TEXT_INSET - 16) : WHY_MAX;
        b.open.why.t.maxWidth = w;
        b.open.summary.t.maxWidth = w;
      }
    });
    await Promise.all(this.texts.map((t) => syncText(t)));
    if (this.disposed) return;

    // The heading, exactly where the horizon had it.
    if (this.heading) {
      const { lead, tail } = this.heading;
      const lw = blockBounds(lead.t)[2] - blockBounds(lead.t)[0];
      const tw = blockBounds(tail.t)[2] - blockBounds(tail.t)[0];
      const space = 16 * 0.28;
      const total = lw + space + tw;
      this.headingTwoLines = total > W - 40;
      if (!this.headingTwoLines) {
        const x0 = (W - total) / 2;
        this.setBase(lead, x0, HEADING_Y);
        this.setBase(tail, x0 + lw + space, HEADING_Y);
      } else {
        this.setBase(lead, (W - lw) / 2, HEADING_Y - 11);
        this.setBase(tail, (W - tw) / 2, HEADING_Y + 11);
      }
    }
    const headBottom = HEADING_Y + (this.headingTwoLines ? 22 : 11);

    // The ball: min(420, half the short side), a little larger with more work, and clear of the heading.
    const n = this.projects.length;
    // It grows with the square root of the work: six projects is today's size, sixty is 1.4 times it.
    const growth = 1 + (GROWTH_MAX - 1) * clamp01((Math.sqrt(n) - Math.sqrt(6)) / (Math.sqrt(60) - Math.sqrt(6)));
    let D = v ? W * PHONE_D : Math.min(D_MAX, 0.5 * Math.min(W, H)) * growth;
    const capH = this.captionHeight();
    const topRoom = (d: number) => headBottom + HEADING_CLEAR + TOP_ROOM * (d / (2 * R_REF));
    const bottomRoom = CAP_GAP * (v ? 0.8 : 1) + capH + 16;
    // The room over the ball grows with it, so the fit solves for both.
    const fitD = (H - headBottom - HEADING_CLEAR - bottomRoom) / (1 + TOP_ROOM / (2 * R_REF));
    D = Math.max(140, Math.min(D, fitD));
    this.R = D / 2;
    const top = topRoom(D) + this.R;
    const bottom = H - bottomRoom - this.R;
    this.cx = W / 2;
    this.cy = Math.max(top, Math.min(H * 0.54, bottom));
    this.capY = this.cy + this.R + CAP_GAP * (v ? 0.8 : 1);
    this.beads.forEach((b) => {
      this.setBase(b.cap.name, this.cx, this.capY);
      this.setBase(b.cap.status, this.cx, this.capY + 30);
      this.setBase(b.cap.why, this.cx, this.capY + 50);
      if (b !== this.hovered) {
        [b.cap.name, b.cap.status, b.cap.why].forEach((m) => {
          gsap.killTweensOf(m);
          m.offset = m.span;
          this.applyMask(m);
        });
      }
    });
    if (this.opened) this.layoutOpen(this.opened);
  }

  private captionHeight() {
    let h = 0;
    this.beads.forEach((b) => {
      const wb = blockBounds(b.cap.why.t);
      h = Math.max(h, 50 + (wb[3] - wb[1]));
    });
    return h || 70;
  }

  private get texts(): Text[] {
    const h = this.heading ? [this.heading.lead.t, this.heading.tail.t] : [];
    return [
      ...h,
      ...this.beads.flatMap((b) => [b.cap.name.t, b.cap.status.t, b.cap.why.t, ...(b.open ? [b.open.name.t, b.open.status.t, b.open.why.t, b.open.summary.t, b.open.link.t] : [])]),
    ];
  }

  /** Sets a text's resting place and reads its box; the current offset is kept. */
  private setBase(m: Masked, x: number, y: number) {
    const b = blockBounds(m.t);
    const pad = Math.max(3, m.t.fontSize * 0.2);
    m.box = [b[0] - 4, b[1] - pad, b[2] + 4, b[3] + pad];
    m.span = b[3] - b[1] + pad * 2;
    m.base.set(x, -y);
    this.applyMask(m);
  }

  private applyMask(m: Masked) {
    const { box, dir, offset } = m;
    m.t.position.set(m.base.x, m.base.y + dir * offset, 1);
    m.t.clipRect = [box[0], box[1] - dir * offset, box[2], box[3] - dir * offset];
  }

  private textHeight(m: Masked) {
    const b = blockBounds(m.t);
    return b[3] - b[1];
  }

  /**
   * The opened project as a horizon of its own: the line at 58% of the
   * height (on a phone, standing at 38% of the width), the mark near its
   * start, the pieces as frames above it (below, for dead work) and the
   * texts on the other side. Only the along axis scrolls.
   */
  private layoutOpen(bead: Bead) {
    const W = this.width;
    const H = this.height;
    const v = this.vertical;
    const dead = bead.side < 0;
    const o = bead.open!;
    const frames: Layout["frames"] = [];
    const heads = [o.name, o.status, o.why, o.summary, o.link];
    const gapsAfter = [6, 14, 8, 18, 0];
    // A relayout puts the Case word back at rest.
    gsap.killTweensOf(this.caseLift);
    this.caseLift.v = 0;
    this.caseHot = false;
    this.canvas.style.cursor = "";
    const blockH = heads.reduce((s, m, k) => s + this.textHeight(m) + gapsAfter[k], 0);
    let layout: Layout;
    if (!v) {
      const line = Math.round(H * LINE_Y);
      const headBottom = HEADING_Y + (this.headingTwoLines ? 22 : 11);
      const room = dead ? H - 24 - (line + FRAME_OFF) : line - FRAME_OFF - (headBottom + 16);
      let h = Math.max(FRAME_MIN, Math.min(FRAME_H, room));
      const widths = (hh: number) => bead.pieces.map((pc) => hh * pc.aspect);
      const rowW = (hh: number) => widths(hh).reduce((s, w) => s + w, 0) + FRAME_GAP * (bead.pieces.length - 1);
      const maxRow = W - 2 * MARGIN - MARK_LEAD;
      if (rowW(h) > maxRow) h = Math.max(FRAME_MIN * 0.75, h * (maxRow / rowW(h)));
      const total = MARK_LEAD + rowW(h);
      const x0 = Math.max(MARGIN, Math.round((W - total) / 2));
      let x = x0 + MARK_LEAD;
      widths(h).forEach((w) => {
        frames.push({ along: x + w / 2, across: dead ? line + FRAME_OFF + h / 2 : line - FRAME_OFF - h / 2, w, h });
        x += w + FRAME_GAP;
      });
      const length = Math.max(W, x - FRAME_GAP + MARGIN);
      layout = { vertical: false, line, mark: x0, start: -60, end: length + 60, frames, length };
      // Texts under the line (over it, for dead work), flush with the mark.
      let y = dead ? line - 20 - blockH : line + 20;
      heads.forEach((m, k) => {
        this.setBase(m, x0 - 1, y);
        y += this.textHeight(m) + gapsAfter[k];
      });
    } else {
      // The words stand clear of the tick, as the old phone horizon's did; the frames follow them down.
      const line = Math.round(W * LINE_X);
      const tx = line + PHONE_TEXT_INSET;
      let y = 104;
      heads.forEach((m, k) => {
        this.setBase(m, tx, y);
        y += this.textHeight(m) + gapsAfter[k];
      });
      const mark = 104 + this.textHeight(o.name) / 2;
      const w = dead ? line - 32 : Math.min(W - line - 32, PHONE_FRAME_W);
      let at = y + 32;
      bead.pieces.forEach((pc) => {
        const h = Math.min(w / pc.aspect, w * 1.4);
        const fw = h * pc.aspect;
        frames.push({ along: at + h / 2, across: dead ? line - 16 - fw / 2 : line + 16 + fw / 2, w: fw, h });
        at += h + 16;
      });
      const length = Math.max(H, at + 48);
      layout = { vertical: true, line, mark, start: -60, end: length + 60, frames, length };
    }
    heads.forEach((m) => {
      m.dir = dead && m === o.why && !v ? 1 : -1;
      this.applyMask(m);
    });
    this.layoutO = layout;
    this.scroll.max = Math.max(0, layout.length - (v ? H : W));
    this.scroll.target = Math.min(this.scroll.target, this.scroll.max);
    this.scroll.cur = Math.min(this.scroll.cur, this.scroll.max);
  }

  // ---------------------------------------------------------------- reveal

  /** Reduced motion: the newest year faces you. Otherwise the ball starts with the newest year just past the front. */
  private rest() {
    const last = this.order[this.order.length - 1];
    if (!last) return;
    const p = this.samplePos(last.i, new THREE.Vector3());
    this.angle = Math.atan2(-p.x, p.z) + (this.opts.reducedMotion ? 0 : 0.5);
    this.lastAngle = this.angle;
  }

  /** The thread winds itself from his first year to now; each mark and its pieces arrive as it passes. */
  private reveal(quick: boolean) {
    const items = this.heading ? [this.heading.lead, this.heading.tail] : [];
    if (this.opts.reducedMotion || quick) {
      this.draw.value = 1;
      items.forEach((it) => this.applyMask(it));
      this.beads.forEach((b) => {
        b.pop = 1;
        b.popped = true;
      });
      this.cursorOn = true;
      return;
    }
    items.forEach((it) => {
      it.offset = it.span;
      this.applyMask(it);
    });
    const tl = gsap.timeline();
    const rise = (it: Masked, at: number) => tl.to(it, { offset: 0, duration: 0.9, ease: "power4.out", onUpdate: () => this.applyMask(it) }, at);
    if (this.heading) {
      rise(this.heading.lead, 0.1);
      rise(this.heading.tail, 0.18);
    }
    tl.to(this.draw, { value: 1, duration: 1.7, ease: "power1.inOut" }, 0.15);
    tl.call(
      () => {
        this.cursorOn = true;
      },
      undefined,
      1.85,
    );
    this.intro = tl;
  }

  resize() {
    this.measure();
    if (!this.ready) return;
    this.intro?.progress(1);
    void this.layout();
  }

  // ---------------------------------------------------------------- geometry

  /** The thread's unit position at a fractional sample index. */
  private samplePos(i: number, out: THREE.Vector3) {
    const M = this.M;
    const c = Math.max(0, Math.min(M - 1, i));
    const a = Math.floor(c);
    const b = Math.min(M - 1, a + 1);
    const f = c - a;
    const P = this.P;
    return out.set(lerp(P[a * 3], P[b * 3], f), lerp(P[a * 3 + 1], P[b * 3 + 1], f), lerp(P[a * 3 + 2], P[b * 3 + 2], f));
  }

  private sampleTan(i: number, out: THREE.Vector3) {
    const k = Math.max(0, Math.min(this.M - 1, Math.round(i))) * 3;
    return out.set(this.TG[k], this.TG[k + 1], this.TG[k + 2]);
  }

  /** Spin about the ball's own axis, then the tilt toward you. */
  private rotate(x: number, y: number, z: number, out: THREE.Vector3) {
    const { ca, sa, ct, st } = this.rot;
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return out.set(x1, y * ct - z1 * st, y * st + z1 * ct);
  }

  /** A rotated unit point to screen px; returns the perspective scale. */
  private toScreen(q: THREE.Vector3, radius: number, out: { x: number; y: number }) {
    const k = (FOCAL / (FOCAL - q.z)) * NORM;
    out.x = this.cx + q.x * radius * k;
    out.y = this.cy - q.y * radius * k;
    return k;
  }

  /** A fractional sample's position this frame, wherever the unspool has put it. */
  private screenAt(i: number, out: { x: number; y: number }) {
    const c = Math.max(0, Math.min(this.M - 1, i));
    const a = Math.floor(c);
    const b = Math.min(this.M - 1, a + 1);
    const f = c - a;
    out.x = lerp(this.SX[a], this.SX[b], f);
    out.y = lerp(this.SY[a], this.SY[b], f);
    return out;
  }

  /** Along the opened line: the stretch's start and end land off screen, its mark at the layout's mark. */
  private alongOf(bead: Bead, L: Layout, i: number) {
    if (i <= bead.i) return lerp(L.start, L.mark, (i - bead.i0) / Math.max(1e-6, bead.i - bead.i0));
    return lerp(L.mark, L.end, (i - bead.i) / Math.max(1e-6, bead.i1 - bead.i));
  }

  private indexOfAlong(bead: Bead, L: Layout, along: number) {
    if (along <= L.mark) return lerp(bead.i0, bead.i, (along - L.start) / Math.max(1e-6, L.mark - L.start));
    return lerp(bead.i, bead.i1, (along - L.mark) / Math.max(1e-6, L.end - L.mark));
  }

  private lineAt(L: Layout, along: number, out: { x: number; y: number }) {
    const a = along - this.scroll.cur;
    if (L.vertical) {
      out.x = L.line;
      out.y = a;
    } else {
      out.x = a;
      out.y = L.line;
    }
    return out;
  }

  /**
   * Where sample i waits in the peel (0 leaves first, 1 last): the mark first,
   * then the thread after it, out to the stretch's end. The short run before
   * the mark only lays the line's start off the left edge, so it goes with
   * the mark rather than sweeping across on its own.
   */
  private peelOrder(bead: Bead, i: number) {
    if (i < bead.i) return ((bead.i - i) / Math.max(1e-6, bead.i - bead.i0)) * 0.3;
    return (i - bead.i) / Math.max(1e-6, bead.i1 - bead.i);
  }

  /** How far sample i has come off the ball. */
  private liftOf(bead: Bead, i: number) {
    if (this.opts.reducedMotion) return this.unspool.p;
    return inOut(clamp01(this.unspool.p * (1 + SPREAD) - SPREAD * this.peelOrder(bead, i)));
  }

  /**
   * A piece's ride: the knot leaves the ball with its mark, and each piece
   * sets off along the thread a beat after the one before, carried wherever
   * the thread is, and gets off at its frame as the laid line reaches it.
   * The cover, nearest the mark, gets off first; the rest are dealt out along
   * the line as it lays itself down. Returns the sample index it rides at and
   * how far it has grown into its frame.
   */
  private rideOf(pc: Piece, from: number, to: number) {
    const b = pc.bead;
    // The unspool progress at which the laid thread (lifted to RIDE_LIFT) reaches sample i.
    const reach = (i: number) => (this.peelOrder(b, i) * SPREAD + RIDE_LIFT) / (1 + SPREAD);
    const n = Math.max(1, b.pieces.length - 1);
    const p0 = Math.min(1 - RIDE_MIN, reach(b.i) * 0.55 + (0.3 * pc.index) / n);
    const p1 = Math.min(1, Math.max(p0 + RIDE_MIN, reach(to) + 0.04));
    const t = clamp01((this.unspool.p - p0) / Math.max(1e-6, p1 - p0));
    return { at: lerp(from, to, inOut(t)), grow: inOut(t) };
  }

  // ---------------------------------------------------------------- travel

  wheel(deltaX: number, deltaY: number) {
    if (!this.ready) return;
    const d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    if (this.opened) {
      this.scroll.target = THREE.MathUtils.clamp(this.scroll.target + d, 0, this.scroll.max);
      return;
    }
    this.stopTurn();
    if (this.opts.reducedMotion) this.angle += d * 0.002;
    else this.vel = THREE.MathUtils.clamp(this.vel + d * 0.0025, -4, 4);
  }

  /** A press on the stage: a drag spins the ball (or scrolls the opened line); a still press is a tap. */
  press(x: number, y: number) {
    this.drag = { x, y, t: performance.now(), moved: false };
  }

  /** Returns true while the press has become a drag. */
  move(x: number, y: number): boolean {
    const d = this.drag;
    if (!d || !this.ready) return false;
    const dx = x - d.x;
    const dy = y - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return false;
    if (!d.moved) {
      d.moved = true;
      this.stopTurn();
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.t) / 1000;
    if (this.opened) {
      const along = this.vertical ? dy : dx;
      this.scroll.target = THREE.MathUtils.clamp(this.scroll.target - along, 0, this.scroll.max);
      this.scroll.cur = THREE.MathUtils.clamp(this.scroll.cur - along, 0, this.scroll.max);
    } else {
      const turn = dx / Math.max(60, this.R);
      this.angle += turn;
      this.vel = this.opts.reducedMotion ? 0 : lerp(this.vel, turn / dt, 0.5);
    }
    d.x = x;
    d.y = y;
    d.t = now;
    return true;
  }

  /** Ends a press; true if it was a tap. */
  release(): boolean {
    const d = this.drag;
    this.drag = null;
    if (!d) return false;
    if (d.moved && performance.now() - d.t > 90) this.vel = 0; // held still before letting go
    return !d.moved;
  }

  private stopTurn() {
    this.turning?.kill();
    this.turning = null;
  }

  /** Turns the ball (about its own axis) until the bead's mark faces you. */
  private turnTo(bead: Bead, duration: number) {
    const p = this.samplePos(bead.i, new THREE.Vector3());
    let target = Math.atan2(-p.x, p.z) - this.yaw;
    const TAU = Math.PI * 2;
    target = this.angle + ((((target - this.angle) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
    this.stopTurn();
    this.vel = 0;
    if (duration <= 0) {
      this.angle = target;
      return;
    }
    this.turning = gsap.to(this, {
      angle: target,
      duration,
      ease: "power3.inOut",
      onComplete: () => {
        this.turning = null;
      },
    });
  }

  /** Arrow keys: the next project along the thread, turned to the front; opened, if one was open. */
  step(dir: 1 | -1) {
    if (!this.ready) return;
    const list = this.order.filter((b) => b.project);
    if (!list.length) return;
    const from = this.opened ?? (this.hovered?.project ? this.hovered : null);
    let i: number;
    if (from) i = THREE.MathUtils.clamp(list.indexOf(from) + dir, 0, list.length - 1);
    else i = list.reduce((best, b, k) => (b.mz > list[best].mz ? k : best), 0);
    const b = list[i];
    if (this.opened) {
      if (b !== this.opened) this.openBead(b);
      return;
    }
    this.keyHold = true;
    this.turnTo(b, this.dur(0.8));
    if (b !== this.hovered) this.setHover(b);
  }

  // ---------------------------------------------------------------- hover

  pointer(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (this.pointerAt && Math.hypot(x - this.pointerAt.x, y - this.pointerAt.y) < 1 && this.keyHold) return;
    this.pointerAt = { x, y };
    this.keyHold = false;
    if (!this.ready || this.drag?.moved) return;
    if (!this.opened) this.targetYaw = this.opts.reducedMotion ? 0 : (this.pointerAt.x / this.width - 0.5) * 0.45;
    this.hoverAtPointer();
  }

  leave() {
    this.pointerAt = null;
    this.targetYaw = 0;
    if (this.caseHot) this.setCaseHot(false);
    this.setCoverHot(null);
    if (this.hovered && !this.opened) this.setHover(null);
  }

  private hoverAtPointer() {
    const at = this.pointerAt;
    if (!at) return;
    if (this.opened) {
      this.setCaseHot(this.onCase(at.x, at.y));
      const pc = this.frameAt(at.x, at.y);
      this.setCoverHot(pc && pc.index === 0 ? pc : null);
      return;
    }
    const b = this.beadAt(at.x, at.y);
    if (b !== this.hovered) this.setHover(b, true);
  }

  /** Esc: an opened project winds back in and stays chosen; otherwise the choice is let go. */
  escape() {
    if (this.opened && !this.closing) {
      this.keyHold = true;
      this.close();
      return;
    }
    this.keyHold = false;
    if (this.hovered && !this.opened) this.setHover(null);
  }

  /** A tap or click. Returns what to do with it; the panel owns routing and sound. */
  tap(clientX: number, clientY: number, touch: boolean): "case" | "open" | "select" | "close" | "none" {
    if (!this.ready) return "none";
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (this.opened && this.closing) {
      // Caught on its way back in: the project, or another, opens from here.
      const again = this.beadAt(x, y);
      if (!again?.project) return "none";
      this.openBead(again);
      return "open";
    }
    if (this.opened) {
      // The second half of the double click that opened it is not a click on empty space. After
      // that, empty space winds it back from wherever the unspool has got to.
      if (performance.now() - this.openedAt < DOUBLE_CLICK) return "none";
      // The Case word answers once it has risen; on its way up it is not empty space either.
      if (this.onCase(x, y, true)) return this.unspool.p < 0.98 ? "none" : "case";
      if (this.frameAt(x, y)) return "none";
      this.close();
      return "close";
    }
    const b = this.beadAt(x, y) ?? (touch && this.hovered && this.onCaption(x, y) ? this.hovered : null);
    if (!b) {
      if (this.hovered) this.setHover(null);
      return "none";
    }
    // Touch has no hover: the first tap raises the caption, the second opens.
    if (touch && b !== this.hovered) {
      this.setHover(b);
      return "select";
    }
    if (!b.project) {
      if (b !== this.hovered) this.setHover(b);
      return "none";
    }
    this.openBead(b);
    return "open";
  }

  /** The bead whose piece is under the point (the nearest one in front), else the mark nearest it. */
  private beadAt(x: number, y: number): Bead | null {
    let best: Piece | null = null;
    const pad = 3;
    this.pieces.forEach((pc) => {
      if (pc.ink < 0.12 || !pc.mesh.visible) return;
      const keep = pc.bead === this.hovered ? 8 : 0;
      if (Math.abs(x - pc.sx) > pc.sw / 2 + pad + keep || Math.abs(y - pc.sy) > pc.sh / 2 + pad + keep) return;
      if (!best || pc.sz > best.sz || (pc.bead === this.hovered && best.bead !== this.hovered)) best = pc;
    });
    if (best) return (best as Piece).bead;
    let mark: Bead | null = null;
    let bestD = Infinity;
    this.beads.forEach((b) => {
      if (b.pop < 0.5) return;
      const reach = (b === this.hovered ? 30 : 22) * (b.mz < -0.2 ? 0.6 : 1);
      const d = Math.hypot(x - b.mx, y - b.my) - (b.mz > 0 ? 4 : 0);
      if (d < reach && d < bestD) {
        bestD = d;
        mark = b;
      }
    });
    return mark;
  }

  private onCaption(x: number, y: number) {
    return y > this.capY - 8 && y < this.capY + this.captionHeight() + 8 && Math.abs(x - this.cx) < Math.min(this.width / 2, WHY_MAX / 2 + 16);
  }

  private frameAt(x: number, y: number): Piece | null {
    if (!this.opened) return null;
    return this.opened.pieces.find((pc) => Math.abs(x - pc.sx) <= pc.sw / 2 && Math.abs(y - pc.sy) <= pc.sh / 2) ?? null;
  }

  private onCase(x: number, y: number, early = false) {
    const o = this.opened?.open;
    if (!o || (this.unspool.p < 0.98 && !early)) return false;
    const m = o.link;
    const b = blockBounds(m.t);
    const ox = m.base.x + this.openGroup.position.x;
    const oy = -(m.base.y + this.openGroup.position.y);
    return x >= ox + b[0] - 8 && x <= ox + b[2] + 8 && y >= oy - b[3] - 8 && y <= oy - b[1] + 8;
  }

  /** Under the pointer the Case word takes the pointer cursor and lifts 1px, as the links on About do. */
  private setCaseHot(on: boolean) {
    if (on === this.caseHot) return;
    this.caseHot = on;
    this.canvas.style.cursor = on ? "pointer" : "";
    const link = this.opened?.open?.link;
    if (!link) return;
    const rest = link.base.y - this.caseLift.v;
    gsap.to(this.caseLift, {
      v: on ? 1 : 0,
      duration: 0.15,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => {
        link.base.y = rest + this.caseLift.v;
        this.applyMask(link);
      },
    });
  }

  /** The cover frame of an opened project turns to its hover media, 400ms after the pointer arrives, as the grid did. */
  private setCoverHot(pc: Piece | null) {
    if (pc === this.coverHot) return;
    const prev = this.coverHot;
    this.coverHot = pc;
    if (prev) this.showMoving(prev, false);
    if (pc) this.showMoving(pc, true, 0.4);
  }

  get focused(): Project | null {
    return this.opened?.project ?? this.hovered?.project ?? null;
  }

  /** A project is out on its line, and not on its way back in. */
  get isOpen() {
    return !!this.opened && !this.closing;
  }

  private setHover(b: Bead | null, byPointer = false) {
    const prev = this.hovered;
    this.hovered = b;
    if (prev && prev !== this.opened) this.captionOff(prev);
    if (b && b !== this.opened) this.captionOn(b);
    this.opts.onHover(b ? (b.project ? { kind: "project", project: b.project } : { kind: "study", piece: b.study! }) : null, byPointer);
  }

  private captionOn(b: Bead) {
    const { name, status, why } = b.cap;
    this.ctx.add(() => {
      [name, status, why].forEach((m, k) => {
        gsap.to(m, { offset: 0, duration: this.dur(0.6), delay: this.dur(0.04 * k), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m) });
      });
    });
  }

  private captionOff(b: Bead) {
    const { name, status, why } = b.cap;
    this.ctx.add(() => {
      [name, status, why].forEach((m) => {
        gsap.to(m, { offset: m.span, duration: this.dur(0.35), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m) });
      });
    });
  }

  // ---------------------------------------------------------------- open

  /** Opens a project by slug: the deep link, or the URL's hash changing. */
  openSlug(slug: string) {
    if (!this.ready) {
      this.pendingOpen = slug;
      return;
    }
    const b = this.beads.find((k) => k.project?.slug === slug);
    if (b) this.openBead(b);
  }

  /**
   * The unspool: the project's stretch of thread peels off the ball, its
   * mark first and its ends last, and straightens into a horizon across the
   * viewport while the ball recedes behind it; the pieces ride the thread out
   * to their places and grow into frames; then the words rise.
   */
  openBead(b: Bead, o: { immediate?: boolean } = {}) {
    if (!b.project || !b.open) return;
    if (this.opened === b && !this.closing) return;
    if (this.opened && this.opened !== b) {
      this.close(() => this.openBead(b));
      return;
    }
    this.openTl?.kill();
    this.afterClose = null;
    this.closing = false;
    // Opening mid-reveal: the thread is wound at once.
    if (this.intro?.isActive()) this.intro.progress(1);
    if (this.draw.value < 1) this.draw.value = 1;
    this.cursorOn = true;
    if (this.hovered && this.hovered !== b) this.captionOff(this.hovered);
    if (this.hovered === b) this.captionOff(b);
    this.hovered = b;
    this.opened = b;
    this.openedAt = performance.now();
    this.scroll.cur = this.scroll.target = 0;
    this.layoutO = null;
    this.layoutOpen(b);
    this.targetYaw = 0;
    this.opts.onOpen(b.project);
    this.opts.onHover(null, false);
    if (!o.immediate) sfx.play("focus");
    b.pieces.forEach((pc) => {
      this.fetchMoving(pc);
      pc.landed = false;
    });

    const rm = !!this.opts.reducedMotion;
    this.turnTo(b, rm ? 0 : 0.9);
    const tl = gsap.timeline();
    if (rm) {
      this.unspool.p = 1;
      this.fadeIn.value = 0;
      tl.to(this.fadeIn, { value: 1, duration: 0.3, ease: "power2.inOut" }, 0);
    } else {
      this.fadeIn.value = 1;
      // From wherever it is: a project caught winding back unspools again from there.
      tl.to(this.unspool, { p: 1, duration: OPEN_DUR * (1 - this.unspool.p), ease: "none" }, 0);
    }
    const o2 = b.open;
    const words = [o2.name, o2.status, o2.why, o2.summary, o2.link];
    words.forEach((m) => {
      gsap.killTweensOf(m);
      m.offset = m.span;
      m.t.visible = true;
      this.applyMask(m);
    });
    // Reduced motion: the words are simply there at the crossfade's midpoint.
    const at = rm ? 0.15 : Math.max(0, OPEN_DUR * (0.72 - this.unspool.p));
    words.forEach((m, k) => {
      tl.to(m, { offset: 0, duration: rm ? 0 : 0.9, ease: "power4.out", onUpdate: () => this.applyMask(m) }, at + (rm ? 0 : k * 0.07));
    });
    tl.call(() => b.pieces.forEach((pc) => pc.index > 0 && this.showMoving(pc, true)), undefined, rm ? 0.3 : OPEN_DUR * (1 - this.unspool.p));
    this.openTl = tl;
  }

  /** Esc, or a click on empty space: the line winds back into the ball in 0.9s. */
  close(then?: () => void) {
    const b = this.opened;
    if (!b || !b.open) return;
    if (this.afterClose && then) {
      this.afterClose = then;
      return;
    }
    this.afterClose = then ?? null;
    this.closing = true;
    this.openTl?.kill();
    this.setCaseHot(false);
    this.setCoverHot(null);
    if (!then) sfx.play("close");
    const o = b.open;
    const rm = !!this.opts.reducedMotion;
    const tl = gsap.timeline({
      onComplete: () => {
        this.closing = false;
        this.opened = null;
        this.layoutO = null;
        this.openTl = null;
        this.fadeIn.value = 0;
        this.unspool.p = 0;
        b.pieces.forEach((pc) => this.showMoving(pc, false));
        [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
          m.t.visible = false;
        });
        const next = this.afterClose;
        this.afterClose = null;
        if (next) {
          next();
          return;
        }
        this.opts.onOpen(null);
        // The one that was open stays chosen, so Enter opens it again; the pointer decides otherwise.
        this.hovered = null;
        if (this.pointerAt && !this.keyHold) this.hoverAtPointer();
        else this.setHover(b);
      },
    });
    [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
      tl.to(m, { offset: m.span, duration: rm ? 0 : 0.3, ease: "power3.in", onUpdate: () => this.applyMask(m) }, rm ? 0.15 : 0);
    });
    if (rm) tl.to(this.fadeIn, { value: 0, duration: 0.3, ease: "power2.inOut" }, 0);
    else {
      tl.to(this.unspool, { p: 0, duration: CLOSE_DUR, ease: "power1.inOut" }, 0.1);
      tl.to(this.scroll, { cur: 0, target: 0, duration: CLOSE_DUR * 0.6, ease: "power2.inOut" }, 0);
    }
    this.openTl = tl;
  }

  /** Video pieces, and the cover's hover media, load when their project first opens. */
  private fetchMoving(pc: Piece) {
    if (pc.moving || !pc.movingMedia) return;
    pc.moving = loadMedia(pc.movingMedia)
      .then((l) => {
        if (this.disposed) {
          l.dispose();
          return null;
        }
        const u = pc.mesh.material.uniforms;
        u.uAlt.value = l.texture;
        u.uAltAspect.value = l.aspect || pc.aspect;
        return l;
      })
      .catch(() => null);
  }

  private showMoving(pc: Piece, on: boolean, delay = 0) {
    if (!pc.moving) return;
    const u = pc.mesh.material.uniforms;
    void pc.moving.then((l) => {
      if (!l || this.disposed) return;
      if (on && this.opened !== pc.bead) return;
      if (on) void l.video?.play().catch(() => undefined);
      gsap.to(u.uMix, {
        value: on ? 1 : 0,
        duration: this.dur(on ? 0.35 : 0.25),
        delay: this.dur(delay),
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => {
          if (!on) l.video?.pause();
        },
      });
    });
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    const rm = !!this.opts.reducedMotion;
    this.clock += rm ? 0 : dt;
    // Nothing is drawn until the layout has placed it: the texts wait at the origin until their fonts are in.
    if (!this.ready) return;

    // Spin: slow on its own, slower still while something is held, still while a project is open.
    const idleTarget = rm || this.opened ? 0 : this.hovered ? 0.1 : 1;
    this.idleK += (idleTarget - this.idleK) * (1 - Math.pow(0.02, dt));
    if (!this.drag?.moved && !this.turning) this.angle += (IDLE * this.idleK + this.vel) * dt;
    this.vel *= Math.pow(0.15, dt);
    if (Math.abs(this.vel) < 1e-4) this.vel = 0;
    this.yaw += (this.targetYaw - this.yaw) * (1 - Math.pow(0.03, dt));
    const w = (this.angle - this.lastAngle) / Math.max(dt, 1e-3);
    this.lastAngle = this.angle;

    // The loose end trails the turn on a soft spring.
    if (!rm) {
      const target = THREE.MathUtils.clamp(-w * 26, -26, 26) + Math.sin(this.clock * 0.9) * 1.5;
      this.loose.v += (-14 * (this.loose.x - target) - 2.6 * this.loose.v) * dt;
      this.loose.x += this.loose.v * dt;
    }

    this.scroll.cur += (this.scroll.target - this.scroll.cur) * (1 - Math.pow(0.9, dt * 60));
    this.openGroup.position.set(this.layoutO ? (this.layoutO.vertical ? 0 : -this.scroll.cur) : 0, this.layoutO?.vertical ? this.scroll.cur : 0, 0);

    // Hover: the chosen stretch to full ink, everything else down to 35%.
    const k = rm ? 1 : 1 - Math.pow(0.0005, dt);
    this.beads.forEach((b) => {
      b.hl += ((b === this.hovered || b === this.opened ? 1 : 0) - b.hl) * k;
    });
    this.dim += ((this.hovered || this.opened ? 1 : 0) - this.dim) * k;

    const a = this.angle + this.yaw;
    this.rot.ca = Math.cos(a);
    this.rot.sa = Math.sin(a);

    // The reveal: each mark and its pieces arrive as the winding thread reaches them.
    const reached = this.draw.value * (this.M - 1);
    this.beads.forEach((b) => {
      if (b.popped || reached < b.i) return;
      b.popped = true;
      this.ctx.add(() => gsap.to(b, { pop: 1, duration: 0.7, ease: "power3.out" }));
    });

    if (this.pointerAt && !this.keyHold && !this.drag?.moved && !this.opened) this.hoverAtPointer();
    this.placeVeil();
    this.project();
    this.drawThread();
    this.hang();
    this.crossings();
    this.dimHeading();
    this.glass.setVelocity(Math.abs(this.scroll.cur - this.lastScroll) / Math.max(dt, 1e-3) / 1500);
    this.lastScroll = this.scroll.cur;
    this.glass.render(this.scene, this.camera);
  }

  /** How far the ball has gone back behind an opened line. */
  private get recede() {
    if (!this.opened) return 0;
    return this.opts.reducedMotion ? this.fadeIn.value : inOut(clamp01(this.unspool.p * 1.5));
  }

  /** Where the opened project's words rest this frame (they scroll with the line), and how much the ball thins under them. */
  private placeVeil() {
    const v = this.veil;
    const o = this.opened?.open;
    v.k = o && this.layoutO ? this.recede : 0;
    if (!o || v.k <= 0) return;
    const g = this.openGroup.position;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
      const bb = blockBounds(m.t);
      const x = m.base.x + g.x;
      const y = -(m.base.y + g.y);
      x0 = Math.min(x0, x + bb[0]);
      x1 = Math.max(x1, x + bb[2]);
      y0 = Math.min(y0, y - bb[3]);
      y1 = Math.max(y1, y - bb[1]);
    });
    v.x0 = x0 - VEIL_PAD;
    v.y0 = y0 - VEIL_PAD;
    v.x1 = x1 + VEIL_PAD;
    v.y1 = y1 + VEIL_PAD;
  }

  /** The share of its ink the ball keeps at a point: all of it, except under the opened project's words. */
  private veilAt(x: number, y: number) {
    const v = this.veil;
    if (v.k <= 0) return 1;
    const dx = Math.max(v.x0 - x, 0, x - v.x1);
    const dy = Math.max(v.y0 - y, 0, y - v.y1);
    const near = 1 - smooth(clamp01(Math.hypot(dx, dy) / VEIL_FEATHER));
    return 1 - v.k * (1 - VEIL_INK) * near;
  }

  /** Every sample to the screen: on the ball, on the line, or on its way between. */
  private project() {
    const M = this.M;
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const l = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.R * lerp(1, RECEDE_SCALE, recede);
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    const drawn = this.draw.value * (M - 1);
    const open = this.opened;
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    const P = this.P;
    for (let i = 0; i < M; i++) {
      this.rotate(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], q);
      this.toScreen(q, radius, s);
      const d = depthInk(q.z);
      const o = this.owner[i];
      const hl = o >= 0 ? this.beads[o].hl : 0;
      let ink = lerp(d * base, 0.55 + 0.45 * smooth(clamp01((q.z + 0.85) / 1.7)), hl);
      ink *= this.veilAt(s.x, s.y);
      let lift = 0;
      if (open && L && i >= open.i0 && i <= open.i1) {
        lift = this.liftOf(open, i);
        this.lineAt(L, this.alongOf(open, L, i), l);
        if (rm) {
          // Reduced motion draws the line on its own; the stretch fades out of the ball.
          ink *= 1 - this.fadeIn.value;
          lift = 0;
        } else {
          s.x = lerp(s.x, l.x, lift);
          s.y = lerp(s.y, l.y, lift);
          ink = lerp(ink, 1, lift);
        }
      }
      if (i > drawn) ink = 0;
      this.SX[i] = s.x;
      this.SY[i] = s.y;
      this.SZ[i] = lift > 0.3 ? 2 : q.z;
      this.SA[i] = ink;
      this.lifted[i] = lift;
    }
    fillNormals(this.SX, this.SY, this.NX, this.NY, M);
  }

  /** The thread in two layers, behind and in front of the ball's centre, so the pieces sort between them. */
  private drawThread() {
    const back = this.back!;
    const front = this.front!;
    const half = this.lineMat.uniforms.uHalf.value as number;
    back.begin(half);
    front.begin(half);
    const M = this.M;
    const drawn = Math.min(M - 1, Math.floor(this.draw.value * (M - 1)));
    const open = this.opened;
    const cut0 = open ? Math.max(0, Math.ceil(open.i0)) : -1;
    const cut1 = open ? Math.min(M - 1, Math.floor(open.i1)) : -1;
    const rm = !!this.opts.reducedMotion;
    let start = 0;
    let layer: Ribbons | null = null;
    const flush = (end: number) => {
      if (layer && end > start) layer.strip(this.SX, this.SY, this.SA, this.NX, this.NY, start, end);
    };
    for (let i = 0; i < drawn; i++) {
      // The stretch leaves the ball at its two ends: those joins are drawn apart, below.
      const cut = open && !rm && (i === cut0 - 1 || i === cut1);
      if (cut || (this.SA[i] < 0.004 && this.SA[i + 1] < 0.004)) {
        flush(i);
        layer = null;
        continue;
      }
      const seg = this.SZ[i] + this.SZ[i + 1] >= 0 ? front : back;
      if (seg !== layer) {
        flush(i);
        layer = seg;
        start = i;
      }
    }
    flush(drawn);

    const sc = this.scratch;
    // Where the stretch leaves the ball: a join that thins out as its end flies off.
    if (open && !rm) {
      [
        [cut0 - 1, cut0],
        [cut1, cut1 + 1],
      ].forEach(([i, j]) => {
        if (i < 0 || j > drawn) return;
        const lift = Math.max(this.lifted[i], this.lifted[j]);
        const fade = (1 - lift) ** 2;
        if (fade < 0.01) return;
        sc.reset();
        sc.push(this.SX[i], this.SY[i], this.SA[i] * fade);
        sc.push(this.SX[j], this.SY[j], this.SA[j] * fade);
        sc.normals();
        front.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, 1);
      });
    }
    // Reduced motion: the opened stretch, drawn straight on the line and faded in.
    if (open && rm && this.layoutO && this.fadeIn.value > 0) {
      const L = this.layoutO;
      const p = { x: 0, y: 0 };
      sc.reset();
      const n = 48;
      for (let k = 0; k <= n; k++) {
        this.lineAt(L, lerp(L.start, L.end, k / n), p);
        sc.push(p.x, p.y, this.fadeIn.value);
      }
      sc.normals();
      front.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
    }

    this.drawMarks(back, front);
    this.drawLooseEnd(back, front, drawn);
    back.end();
    front.end();
  }

  /** Ticks in the horizon's grammar: alive breathes, paused wears a ring, shipped a dot, dead hangs down. */
  private drawMarks(back: Ribbons, front: Ribbons) {
    const q = new THREE.Vector3();
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const bn = new THREE.Vector3();
    const s0 = { x: 0, y: 0 };
    const s1 = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.R * lerp(1, RECEDE_SCALE, recede);
    const scale = radius / R_REF;
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    this.beads.forEach((b) => {
      const opened = b === this.opened;
      // The mark on the ball.
      this.samplePos(b.i, p);
      this.rotate(p.x, p.y, p.z, q);
      const k = this.toScreen(q, radius, s0);
      const dz = depthInk(q.z);
      let ink = lerp(dz * base, 0.55 + 0.45 * dz, b.hl) * b.pop * this.veilAt(s0.x, s0.y);
      if (b.i > this.draw.value * (this.M - 1)) ink = 0;
      b.mz = q.z;
      // Its tick: along the surface, perpendicular to the thread; north, or south for dead work.
      this.sampleTan(b.i, t);
      bn.copy(p).cross(t).normalize().multiplyScalar(b.side);
      const breathe = b.project?.status === "alive" && !rm ? (BREATHE / 2) * (1 + Math.sin((this.clock / BREATHE_PERIOD) * Math.PI * 2)) : 0;
      const tick = (TICK + breathe) * b.pop;
      this.rotate(p.x + bn.x * 0.12, p.y + bn.y * 0.12, p.z + bn.z * 0.12, q);
      this.toScreen(q, radius, s1);
      let dx = s1.x - s0.x;
      let dy = s1.y - s0.y;
      let len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // Foreshortened as the surface turns away.
      len = tick * scale * k * Math.min(1, (len / (0.12 * radius * k)) * 1.05);
      let mx = s0.x;
      let my = s0.y;
      let front1 = b.mz >= 0;
      if (opened && L) {
        const lift = rm ? 0 : this.liftOf(b, b.i);
        const l = this.lineAt(L, L.mark, { x: 0, y: 0 });
        mx = lerp(s0.x, l.x, lift);
        my = lerp(s0.y, l.y, lift);
        const ux = L.vertical ? b.side : 0;
        const uy = L.vertical ? 0 : -b.side;
        dx = lerp(dx, ux, lift);
        dy = lerp(dy, uy, lift);
        const n = Math.hypot(dx, dy) || 1;
        dx /= n;
        dy /= n;
        len = lerp(len, TICK + breathe, lift);
        ink = lerp(ink, 1, lift);
        if (lift > 0.3) front1 = true;
        if (rm && this.fadeIn.value > 0) {
          // Drawn a second time on the line, fading in.
          this.markShape(b, l.x, l.y, ux, uy, TICK, this.fadeIn.value, front);
          ink *= 1 - this.fadeIn.value;
        }
      }
      b.mx = mx;
      b.my = my;
      this.markShape(b, mx, my, dx, dy, len, ink, front1 ? front : back);
    });
  }

  private markShape(b: Bead, x: number, y: number, dx: number, dy: number, len: number, ink: number, layer: Ribbons) {
    const sc = this.scratch;
    const status = b.project?.status;
    if (b.project && status !== "paused" && ink > 0.004) {
      sc.reset();
      sc.push(x, y, ink);
      sc.push(x + dx * len, y + dy * len, ink);
      sc.normals();
      layer.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, 1);
    }
    if (status === "paused" && ink > 0.004) {
      // The horizon's ring: 1px at 3.5px, round on screen whatever the surface does.
      sc.reset();
      for (let k = 0; k <= 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        sc.push(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, ink);
      }
      sc.normals(true);
      layer.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
    }
    if (b.dot) {
      const tip = status === "shipped";
      const r = tip ? 2 : 2.5;
      b.dot.position.set(tip ? x + dx * len : x, -(tip ? y + dy * len : y), 0);
      b.dot.scale.setScalar(r * Math.max(0.001, b.pop));
      b.dot.material.opacity = ink;
      b.dot.visible = ink > 0.004;
      b.dot.renderOrder = layer === this.front ? 410 : 210;
    }
  }

  /** Now: 40px of thread past the last turn at the top, swaying, blinking like the horizon's cursor. */
  private drawLooseEnd(back: Ribbons, front: Ribbons, drawn: number) {
    if (!this.cursorOn || drawn < this.M - 1) return;
    if (!this.opts.reducedMotion && this.clock % 1 >= 0.5) return;
    const sc = this.scratch;
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.R * lerp(1, RECEDE_SCALE, recede);
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    this.samplePos(this.M - 1, p);
    this.sampleTan(this.M - 1, t);
    const len = (LOOSE / R_REF) * (this.R / R_REF) ** 0.3;
    sc.reset();
    let z = 0;
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      // On in the direction it was winding, then lifting off the ball in a soft arc.
      const lift = 1 + u * u * len * 0.85;
      const x = p.x * lift + t.x * u * len * 0.75;
      const y = p.y * lift + t.y * u * len * 0.75;
      const zz = p.z * lift + t.z * u * len * 0.75;
      this.rotate(x, y, zz, q);
      this.toScreen(q, radius, s);
      if (k === 0) z = q.z;
      const lx = s.x + this.loose.x * u * u;
      const ly = s.y + Math.abs(this.loose.x) * 0.15 * u * u;
      sc.push(lx, ly, depthInk(q.z) * base * this.veilAt(lx, ly));
    }
    sc.normals();
    (z >= 0 ? front : back).strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
  }

  /** The pieces: hung off their marks on the ball, riding the thread out when their project opens. */
  private hang() {
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const bn = new THREE.Vector3();
    const c = new THREE.Vector3();
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const a = { x: 0, y: 0 };
    const l = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.R * lerp(1, RECEDE_SCALE, recede);
    const scale = radius / R_REF;
    // Behind an opened line the ball's pieces go further back than its thread: colour carries further than ink.
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_PIECE_INK, recede);
    const pxToIdx = 1 / (STEP * R_REF);
    const crowd = this.projects.length >= CROWD;
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    const drawn = this.draw.value * (this.M - 1);
    const sorted: { pc: Piece; z: number; layer: number }[] = [];
    this.pieces.forEach((pc) => {
      const b = pc.bead;
      const opened = b === this.opened && L;
      const u = pc.mesh.material.uniforms;
      if (!pc.onBall && !opened) {
        pc.mesh.visible = false;
        pc.ink = 0;
        return;
      }
      // On the ball: the row runs along the thread from the mark, lifted off it and hung out (or in).
      const idx = b.i + pc.along * pxToIdx;
      this.samplePos(idx, p);
      this.sampleTan(idx, t);
      // The thread under the piece, on the ball: a ride measures its offset from here.
      this.rotate(p.x, p.y, p.z, q);
      this.toScreen(q, radius, a);
      bn.copy(p).cross(t).normalize();
      const up = pc.up / R_REF;
      const out = HANG_OUT / R_REF;
      c.copy(p)
        .addScaledVector(bn, b.side * up)
        .addScaledVector(p, b.side * out);
      this.rotate(c.x, c.y, c.z, q);
      const k = this.toScreen(q, radius, s);
      const dz = depthInk(q.z);
      let h = pc.h * scale * k * outCubic(b.pop);
      let w = h * pc.aspect;
      // Behind the ball a piece is only a shape through the thread; inside it, half ink and soft.
      let ink = b.side > 0 ? 0.1 + 0.9 * smooth(clamp01((q.z + 0.3) / 0.8)) : 0.5 * (0.7 + 0.3 * dz);
      ink *= lerp(base, 1, b.hl) * b.pop;
      if (crowd) ink *= smooth(clamp01((b.mz + 0.1) / 0.25));
      // Near the limb a knot hangs out past the ball: rather than be cut by the screen's edge, it
      // fades out as it crosses the side margin, gone by the time it would touch the edge.
      const over = Math.max(SIDE_MARGIN - (s.x - w / 2), s.x + w / 2 - (this.width - SIDE_MARGIN));
      if (over > 0) ink *= 1 - smooth(clamp01(over / SIDE_MARGIN));
      ink *= this.veilAt(s.x, s.y);
      if (!pc.onBall) ink = 0;
      if (b.i > drawn) ink = 0;
      let blur = b.side < 0 ? 0.45 : 0;
      let x = s.x;
      let y = s.y;
      let z = q.z;
      let layer = b.side < 0 ? 1 : q.z >= 0 ? 2 : 0;
      if (opened) {
        const f = L.frames[pc.index];
        const lineIdx = this.indexOfAlong(b, L, f.along);
        if (rm) {
          // A crossfade: out of the ball, then into its frame.
          const v = this.fadeIn.value;
          if (v >= 0.5) {
            this.lineAt(L, f.along, l);
            x = L.vertical ? f.across : l.x;
            y = L.vertical ? l.y : f.across;
            w = f.w;
            h = f.h;
            blur = 0;
            ink = (v - 0.5) * 2;
          } else ink *= 1 - v * 2;
          layer = 3;
        } else {
          const ride = this.rideOf(pc, idx, lineIdx);
          const e = ride.grow;
          // Dealt out: a quiet tick as each frame lands on the line.
          if (e >= 0.999 && !pc.landed && !this.closing) {
            pc.landed = true;
            sfx.play("tick", 0.35);
          }
          const offX = s.x - a.x;
          const offY = s.y - a.y;
          this.screenAt(ride.at, a);
          w = lerp(w, f.w, e);
          h = lerp(h, f.h, e);
          // Off the line by the frame's own gap, whatever size it has grown to.
          const sideX = L.vertical ? (f.across > L.line ? 1 : -1) : 0;
          const sideY = L.vertical ? 0 : f.across > L.line ? 1 : -1;
          x = a.x + lerp(offX, sideX * (16 * e + w / 2), e);
          y = a.y + lerp(offY, sideY * (FRAME_OFF * e + h / 2), e);
          ink = lerp(pc.onBall ? ink : 0, 1, pc.onBall ? e : clamp01(e * 1.6));
          blur *= 1 - e;
          if (ride.at > idx + 0.5 || e > 0.01) {
            layer = 3;
            z = 1 + (b.pieces.length - pc.index) * 0.01;
          }
        }
      }
      pc.sx = x;
      pc.sy = y;
      pc.sw = w;
      pc.sh = h;
      pc.sz = z;
      pc.ink = ink;
      pc.mesh.visible = ink > 0.004 && w > 0.5;
      if (!pc.mesh.visible) return;
      pc.mesh.position.set(x, -y, 0);
      pc.mesh.scale.set(w, h, 1);
      u.uFade.value = ink;
      u.uBlur.value = blur;
      sorted.push({ pc, z, layer });
    });
    // Behind the back thread, between the layers, in front; the opened project's frames over all.
    const bases = [100, 300, 500, 800];
    sorted.sort((m, n) => m.z - n.z);
    sorted.forEach(({ pc, layer }, r) => {
      pc.mesh.renderOrder = bases[layer] + r * 0.1;
    });
  }

  /** A quiet tick as each project's mark crosses the front, only while the ball is being turned. */
  private crossings() {
    const turning = Math.abs(this.vel) > 0.2 || !!this.turning;
    this.beads.forEach((b) => {
      if (!b.project) return;
      const s = b.mz > 0 ? Math.sign(b.mx - this.cx) || 1 : 0;
      if (s && b.crossed && s !== b.crossed && turning) sfx.play("tick", 0.6);
      if (s) b.crossed = s;
    });
  }

  /** The heading yields when an opened project's frames or words reach it; on a phone the standing line always does. */
  private dimHeading() {
    if (!this.heading) return;
    let on = false;
    const b = this.opened;
    const L = this.layoutO;
    if (b && L?.vertical && this.unspool.p > 0.02) on = true;
    else if (b && L && b.open) {
      const { lead, tail } = this.heading;
      const hx0 = lead.base.x + lead.box[0];
      const hx1 = tail.base.x + tail.box[2];
      const hy0 = HEADING_Y - (this.headingTwoLines ? 22 : 11) - 6;
      const hy1 = HEADING_Y + (this.headingTwoLines ? 22 : 11) + 6;
      const hit = (x0: number, y0: number, x1: number, y1: number) => x1 > hx0 && x0 < hx1 && y1 > hy0 && y0 < hy1;
      b.pieces.forEach((pc) => {
        if (pc.ink > 0.3 && hit(pc.sx - pc.sw / 2, pc.sy - pc.sh / 2, pc.sx + pc.sw / 2, pc.sy + pc.sh / 2)) on = true;
      });
      const g = this.openGroup.position;
      [b.open.name, b.open.status, b.open.why, b.open.summary, b.open.link].forEach((m) => {
        const bb = blockBounds(m.t);
        const x = m.base.x + g.x;
        const y = -(m.base.y + g.y);
        if (m.offset < m.span * 0.9 && hit(x + bb[0], y - bb[3], x + bb[2], y - bb[1])) on = true;
      });
    }
    if (on === this.headingDimmed) return;
    this.headingDimmed = on;
    this.ctx.add(() => {
      gsap.to([this.heading!.lead.t.material, this.heading!.tail.t.material], { opacity: on ? 0 : 1, duration: this.dur(0.3), ease: "power2.inOut", overwrite: true });
    });
  }

  setVisible(on: boolean) {
    this.pieces.forEach((pc) => {
      void pc.moving?.then((l) => {
        const v = l?.video;
        if (!v) return;
        if (on && this.opened === pc.bead && (pc.index > 0 || this.coverHot === pc)) void v.play().catch(() => undefined);
        else v.pause();
      });
    });
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.ticker);
    this.intro?.kill();
    this.openTl?.kill();
    this.stopTurn();
    this.ctx.kill();
    gsap.killTweensOf([this, this.unspool, this.fadeIn, this.draw, this.scroll, this.caseLift]);
    this.pieces.forEach((pc) => {
      gsap.killTweensOf(pc.mesh.material.uniforms.uMix);
      pc.mesh.material.dispose();
      pc.still.dispose();
      void pc.moving?.then((l) => l?.dispose());
    });
    this.beads.forEach((b) => {
      b.dot?.material.dispose();
      const words = [b.cap.name, b.cap.status, b.cap.why, ...(b.open ? [b.open.name, b.open.status, b.open.why, b.open.summary, b.open.link] : [])];
      gsap.killTweensOf(words);
    });
    this.texts.forEach((t) => t.dispose());
    this.back?.dispose();
    this.front?.dispose();
    this.lineMat.dispose();
    this.dotGeo.dispose();
    this.planeGeo.dispose();
    this.glass.dispose();
    this.renderer.dispose();
  }
}
