import MESH_DATA from "./mesh.json";

/**
 * Urchi, the mascot, ported from urchi/index.html so the site's Urchi is the
 * same character as the standalone page: the low-poly head painted into a
 * small canvas, one pixel per 7.5-unit cell, which the host scales up with
 * hard pixel edges; the white rim; the random eye colourway; the cursor
 * follow, breathing, curious head tilt, darting pupils and blinks. Only the
 * page around it is gone (the floor, the hint and its own frame loop: the host
 * calls update(dt)). The site adds four hooks: eyes shut until opened (the
 * intro's handoff), a slow blink and a glance away (Threshold's yes and no),
 * and alphaAt for hit tests. The query-string knobs still work on any page.
 *
 * The mesh is baked into urchi/index.html by urchi/tools/build-mascot.mjs;
 * `npm run urchi:sync` copies it to mesh.json beside this file.
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type EyeSpec = { c: Vec3; dzdx: number; dzdy: number; n: Vec3 };
type Mesh = {
  v: Vec3[];
  f: Vec3[];
  g: number[];
  eye: { rx: number; ry: number; prx: number; pry: number; pin: number };
  eyes?: EyeSpec[];
  pivot: Vec3;
};
const MESH = MESH_DATA as unknown as Mesh;

/** The canvas's frame in mesh units (x right, y down): wider and taller than the box, so a tilted head fits. */
export const URCHI_FRAME = { x: -701.25, y: -674, w: 1402.5, h: 1230 } as const;
/** The mascot's box, the standalone page's viewBox: what its width is measured by. */
export const URCHI_BOX = { x: -540, y: -500, w: 1080, h: 1056 } as const;
/** The head itself, from ear tips to chin. */
export const URCHI_HEAD = { top: -436, bottom: 435.5 } as const;

// ------------------------------------------------------------------ eye colours
// One colourway is drawn at random on every page load, weighted exactly as the LilGuy eyes
// trait sheet: 100 colourways in seven bands (weights 1, .8, .9, .7, .3, .5, .2; total 52.7).
// [name, weight, iris, pupil]  or, for the odd-eyed band, [name, weight, iris, pupil on the
// viewer's left, pupil on the viewer's right]. Only colours change: the eye and pupil shapes
// stay as they are. The iris colour fills the eye (and the closed-lid arc).
//   ?col=denim   force a colourway by name
type Colourway = [string, number, string, string] | [string, number, string, string, string];
const COLOURWAYS: Colourway[] = [
  // Base fourteen: weight 1.0
  ["marmalade", 1.0, "#F99F05", "#6E6123"],
  ["matcha", 1.0, "#C7FBA6", "#5E6E06"],
  ["houseplant", 1.0, "#039442", "#71FF6F"],
  ["terrarium", 1.0, "#6FF5D0", "#106E54"],
  ["whale", 1.0, "#0059A3", "#0095FF"],
  ["frog", 1.0, "#42DE86", "#436A16"],
  ["denim", 1.0, "#6C92F8", "#102A6E"],
  ["petunia", 1.0, "#F8AFFB", "#F006B4"],
  ["lipgloss", 1.0, "#A10180", "#FC609C"],
  ["jawbreaker", 1.0, "#F6759F", "#56031F"],
  ["cherry", 1.0, "#AE0002", "#FF5252"],
  ["pebble", 1.0, "#645252", "#A4A4A4"],
  ["valentine", 1.0, "#DD06CB", "#7B1612"],
  ["plum", 1.0, "#7260E6", "#622058"],
  // Pale-pupil five: weight 0.8
  ["gumball", 0.8, "#F20F07", "#FFFFFF"],
  ["sprinkler", 0.8, "#59BF05", "#FFFFFF"],
  ["pool", 0.8, "#05A8F9", "#FCEEEE"],
  ["moon", 0.8, "#4028FF", "#EBFFFC"],
  ["bubblegum", 0.8, "#F442E7", "#FFFFFF"],
  // Light-iris twelve: weight 0.9
  ["seaglass", 0.9, "#FBFBFB", "#167B61"],
  ["laser", 0.9, "#FFFFFF", "#FF0000"],
  ["snowball", 0.9, "#FFFFFF", "#5A79F3"],
  ["smoothie", 0.9, "#FFECE0", "#CE0959"],
  ["peach", 0.9, "#FDFBE2", "#F76E5D"],
  ["goldfish", 0.9, "#E0F4FB", "#DE9109"],
  ["seashell", 0.9, "#FCD9CF", "#070571"],
  ["hydrangea", 0.9, "#E1BFE1", "#2722DB"],
  ["cupcake", 0.9, "#F9FFB2", "#CA00CA"],
  ["limeade", 0.9, "#EAFCC5", "#09B6CE"],
  ["teacup", 0.9, "#F6E5A5", "#0D73F7"],
  ["candycane", 0.9, "#9CFBD5", "#790C05"],
  // Hard-black five: weight 0.7
  ["ladybug", 0.7, "#C3110E", "#000000"],
  ["avocado", 0.7, "#8BD67C", "#230606"],
  ["submarine", 0.7, "#0F7BA9", "#000000"],
  ["eggplant", 0.7, "#E202E8", "#0A0A0A"],
  ["og", 0.7, "#FFFFFF", "#000000"],
  // Neon thirty-seven: weight 0.3
  ["lobster", 0.3, "#F95320", "#044A5F"],
  ["pumpkin", 0.3, "#E87102", "#55FC6E"],
  ["beachball", 0.3, "#F6FD21", "#1C9DE3"],
  ["glowstick", 0.3, "#E9F905", "#360342"],
  ["cactus", 0.3, "#C4F41D", "#530AEC"],
  ["highlighter", 0.3, "#95F124", "#F50DCF"],
  ["kiwi", 0.3, "#55F927", "#9F7717"],
  ["flytrap", 0.3, "#15F817", "#5E045E"],
  ["junebug", 0.3, "#14DA70", "#3516AF"],
  ["sunset", 0.3, "#AE2400", "#F855FC"],
  ["robin", 0.3, "#15ABF8", "#5E2304"],
  ["jukebox", 0.3, "#024BDE", "#FB4CC3"],
  ["starboy", 0.3, "#7B43F5", "#F6BD49"],
  ["sonar", 0.3, "#126487", "#2EE605"],
  ["guava", 0.3, "#84FB8E", "#F64982"],
  ["blacklight", 0.3, "#6922F0", "#A3F410"],
  ["taffy", 0.3, "#F474DC", "#E8FCA6"],
  ["lilac", 0.3, "#7202FC", "#FDB0CE"],
  ["nightlight", 0.3, "#7768FE", "#55FC87"],
  ["crocus", 0.3, "#D602E8", "#FBF823"],
  ["rosebush", 0.3, "#1E6935", "#FC7AC0"],
  ["parakeet", 0.3, "#018335", "#23FAFB"],
  ["glowworm", 0.3, "#F40DF8", "#19F515"],
  ["spearmint", 0.3, "#9CFBCE", "#790572"],
  ["motel", 0.3, "#FA486F", "#92FABE"],
  ["buoy", 0.3, "#14ABD6", "#EEFA24"],
  ["slushie", 0.3, "#C206AD", "#49F6D9"],
  ["siren", 0.3, "#FD0C0D", "#2905E6"],
  ["ember", 0.3, "#994400", "#00EEFF"],
  ["jelly", 0.3, "#B60080", "#429EFB"],
  ["popsicle", 0.3, "#71FEAE", "#5598FC"],
  ["dragonfruit", 0.3, "#B60053", "#CFFA0F"],
  ["hibiscus", 0.3, "#B6003C", "#05E605"],
  ["jam", 0.3, "#C5013C", "#09CE93"],
  ["candle", 0.3, "#973849", "#F7FBBC"],
  ["calculator", 0.3, "#737373", "#09E151"],
  ["doorbell", 0.3, "#BEBEBE", "#E42D06"],
  // Muted thirteen: weight 0.5
  ["postcard", 0.5, "#BE6A6A", "#76D8EB"],
  ["flowerpot", 0.5, "#CC6262", "#3E4002"],
  ["juicebox", 0.5, "#F6826C", "#95059B"],
  ["mallard", 0.5, "#7B8401", "#0737A7"],
  ["tomato", 0.5, "#60A611", "#B4040F"],
  ["chamomile", 0.5, "#509156", "#F4C524"],
  ["peacock", 0.5, "#02B0B6", "#7923FB"],
  ["sandbox", 0.5, "#B8804A", "#F7F574"],
  ["kite", 0.5, "#7DB5F4", "#C10787"],
  ["puddle", 0.5, "#A7AFF6", "#837605"],
  ["moth", 0.5, "#EC75F6", "#564803"],
  ["strawberry", 0.5, "#FCB7F2", "#069A1E"],
  ["flamingo", 0.5, "#FCB7C3", "#068F9A"],
  // Odd-eyed fourteen: weight 0.2
  ["static", 0.2, "#666666", "#000000", "#FFFFFF"],
  ["eraser", 0.2, "#666666", "#FFEDED", "#000000"],
  ["pinball", 0.2, "#B60207", "#D2F9F9", "#60D105"],
  ["socks", 0.2, "#B865A8", "#76D8EB", "#8F1716"],
  ["koi", 0.2, "#FE6873", "#0A0A0A", "#D0F910"],
  ["marble", 0.2, "#D1D9FA", "#C11207", "#D20ADF"],
  ["stoplight", 0.2, "#34F7FD", "#038C03", "#F91024"],
  ["bumblebee", 0.2, "#FDCB21", "#0A0A0A", "#D10566"],
  ["lilypad", 0.2, "#D1F63B", "#10812B", "#0F91F4"],
  ["popcorn", 0.2, "#EAF66E", "#BB240A", "#0964E7"],
  ["spumoni", 0.2, "#F6EAB9", "#177E39", "#2722DB"],
  ["umbrella", 0.2, "#E7E3E9", "#F65F28", "#4F6BF8"],
  ["sherbet", 0.2, "#E4F4E2", "#4A0A99", "#DB8405"],
  ["neapolitan", 0.2, "#87493B", "#EB76DD", "#B7ABF3"],
];
/** Drawn (or forced) once per page load and shared by every Urchi on the site's pages from then on. */
let drawn: Colourway | null = null;
function colourwayFor(params: URLSearchParams): Colourway {
  const forced = COLOURWAYS.find((c) => c[0] === params.get("col"));
  if (forced) return (drawn = forced);
  if (drawn) return drawn;
  let r = Math.random() * COLOURWAYS.reduce((s, c) => s + c[1], 0);
  for (const c of COLOURWAYS) {
    r -= c[1];
    if (r < 0) return (drawn = c);
  }
  return (drawn = COLOURWAYS[COLOURWAYS.length - 1]);
}

export type UrchiOptions = { reducedMotion?: boolean };

export type UrchiCharacter = {
  /** The painted head, VBW / CELL by VBH / CELL pixels (187 x 164); transparent around the rim. */
  readonly canvas: HTMLCanvasElement;
  /** One frame: steps the springs and repaints. dt in seconds. */
  update(dt: number): void;
  /** Eyes shut (the closed-lid arc) until openEyes. */
  closeEyes(): void;
  openEyes(seconds: number): void;
  /** A slow, deliberate blink: Threshold's yes. */
  slowBlink(): void;
  /** A look away, head and pupils, for a moment: Threshold's no. */
  glance(): void;
  /** Whether canvas coordinates (u, v in 0..1, v up) fall on the head or its rim. */
  alphaAt(u: number, v: number): boolean;
  dispose(): void;
};

export function createUrchi(o: UrchiOptions = {}): UrchiCharacter {
  const D2R = Math.PI / 180;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  // Local debug knobs (ignored when there is no query string):
  //   ?still            freeze breathing and the cursor follow (stable screenshots)
  //   ?look=0.6,-0.3    fix the gaze target (x right, y down, each -1..1)
  //   ?yaw=90&pitch=0   fix the head's angles in degrees (90 = right side view)
  //   ?ortho            no perspective (for comparing against the reference views)
  //   ?blink=0.5        fix how far the eyes are shut (0 open .. 1 closed)
  //   ?roll=12          fix the head tilt in degrees (positive tips the top to the right)
  const params = new URLSearchParams(location.search);
  const STILL = params.has("still");
  const reduceMotion = STILL || !!o.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (STILL) document.documentElement.dataset.still = "";

  const colourway = colourwayFor(params);
  const EYE_COLOUR = { iris: colourway[2], pupilLeft: colourway[3], pupilRight: colourway[4] || colourway[3] };
  document.documentElement.dataset.eyes = colourway[0];

  // ------------------------------------------------------------------ mesh
  const V = MESH.v, F = MESH.f, G = MESH.g;   // triangles, and the drawn plane each belongs to
  const GN = new Float64Array((Math.max(...G) + 1) * 3), tarea = new Float64Array(F.length);
  const EYES = MESH.eyes || [];
  // canvas in the SVG's coordinates, one pixel per CELL units; it covers x -701.25..701.25 and
  // y -674..556, wider and taller than the SVG's viewBox so a tilted head never gets cut off
  const CELL = 7.5, VBX = URCHI_FRAME.x, VBY = URCHI_FRAME.y, VBW = URCHI_FRAME.w, VBH = URCHI_FRAME.h;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  canvas.width = VBW / CELL; canvas.height = VBH / CELL;
  const COLOR = { base: "#040404" };
  const BASE = 1.5;   // dark base grown beyond the silhouette (units), so joins between planes show dark
  const rimMask = new Uint8Array((VBW / CELL) * (VBH / CELL));
  /** The last frame's pixels, for alphaAt. */
  let lastPx: Uint8ClampedArray | null = null;

  // ------------------------------------------------------------------ look
  // the cursor at a screen edge turns the head about 41 degrees (up/down 17.5 / 15)
  const LOOK = { yaw: 41.25 * D2R, pitchUp: 17.5 * D2R, pitchDown: 15 * D2R };
  const LIGHT = (() => { const l = [0.18, 0.88, 0.44], n = Math.hypot(...l); return l.map(v => v / n); })();   // view space: x right, y up, z toward viewer
  const FORCED_ROLL = params.has("roll") ? (Number(params.get("roll")) || 0) * D2R : null;
  const FORCED_BLINK = params.has("blink") ? Math.min(1, Math.max(0, Number(params.get("blink")) || 0)) : null;
  const PERSPECTIVE = params.has("ortho") ? Infinity : 2800;                                            // eye distance in mesh units
  const PIVOT_Y = MESH.pivot[1];                                                                        // turn about the middle of the head
  const FORCED = params.has("yaw") || params.has("pitch") ? [Number(params.get("yaw")) || 0, Number(params.get("pitch")) || 0].map(v => v * D2R) : null;
  type Spring = { v: number; vel: number; target: number };
  const spring = (v = 0): Spring => ({ v, vel: 0, target: v });
  const S = { yaw: spring(), pitch: spring(), pointer: { nx: 0, ny: 0, has: false }, t: 0, lastMove: -99 };
  if (params.get("look")) {
    const [nx, ny] = params.get("look")!.split(",").map(Number);
    Object.assign(S.pointer, { nx: clamp(nx || 0, -1, 1), ny: clamp(ny || 0, -1, 1), has: true });
  }
  function stepSpring(s: Spring, dt: number, omega = 9, zeta = 0.8) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) { const acc = -omega * omega * (s.v - s.target) - 2 * zeta * omega * s.vel; s.vel += acc * h; s.v += s.vel * h; }
  }

  // ------------------------------------------------------------------ input
  const P = S.pointer;
  const listeners: [string, EventListener, AddEventListenerOptions | undefined][] = [];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    window.addEventListener(type, fn as EventListener, opts);
    listeners.push([type, fn as EventListener, opts]);
  };
  function pointerAt(e: PointerEvent) {
    P.nx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1);
    P.ny = clamp(e.clientY / innerHeight * 2 - 1, -1, 1);
    P.has = true; S.lastMove = S.t;
  }
  let release = 0;
  if (!reduceMotion) {
    on("pointermove", pointerAt, { passive: true });
    on("pointerdown", pointerAt, { passive: true });
    // a touch has no hover: hold the gaze where the finger was for a moment, then drift back
    on("pointerdown", () => clearTimeout(release));
    on("pointerup", e => { if (e.pointerType === "touch") release = window.setTimeout(() => { P.has = false; }, 1400); });
    on("pointerout", e => { if (!e.relatedTarget && e.pointerType !== "touch") P.has = false; });
    on("blur", () => { P.has = false; });
  }

  // ------------------------------------------------------------------ breathing
  // A slow loop: the head tips up as it rises and down as it settles, like a gentle nod.
  const BREATH = { period: 4.29, nod: 3.15 * D2R, rise: 5.25 };   // seconds per breath, nod amplitude, rise in SVG units (~1.75px)
  let rise = 0;
  function breathe(t: number) {
    const w = reduceMotion ? 0 : Math.sin(2 * Math.PI * t / BREATH.period);   // +1 at the top of the in-breath
    rise = -BREATH.rise * w;
    return -BREATH.nod * w;   // negative pitch tips the face up
  }

  // ------------------------------------------------------------------ curious head tilt
  // A random sequence of head moves, usually 4-9s apart (about one in ten comes sooner, after
  // 1.5-2.5s, so there is no steady beat; after straightening it may rest up to 10s).
  //   from level:  tilt to a random side, but never more than two tilts in a row to one side
  //   from a tilt: straighten (35%), swing across to the other side (30%), or re-settle on the
  //                same side at a new angle (35%, never twice in a row)
  // Each move picks its own angle (usually 6-15 degrees, about one in four a small 3-6), its
  // own pace (slow lean to quick perk), a slight turn toward that side and a small look up or
  // down. The tilt pivots low in the head, like a neck, through a soft spring.
  const TILT = { pivot: 250, maxSameSide: 2 };
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const tilt = { roll: spring(), yaw: spring(), pitch: spring(), speed: 5.5, side: 0, lastSide: 0, streak: 0, next: rand(2, 5), resettled: false };
  function tiltTo(dir: number) {
    const small = Math.random() < 0.25;
    tilt.roll.target = dir * rand(small ? 3 : 6, small ? 6 : 15) * D2R;
    tilt.yaw.target = dir * rand(1, 5) * D2R;
    tilt.pitch.target = rand(-3, 2) * D2R;   // mostly a slight look up, sometimes down
    tilt.side = dir;
  }
  function newTilt(dir: number) {                     // a fresh tilt to a side: counts toward the same-side limit
    if (dir === tilt.lastSide && tilt.streak >= TILT.maxSameSide) dir = -dir;
    tilt.streak = dir === tilt.lastSide ? tilt.streak + 1 : 1;
    tilt.lastSide = dir;
    tiltTo(dir);
  }
  function stepTilt(t: number, dt: number) {
    if (t >= tilt.next) {
      let rest = false;
      const wasResettled = tilt.resettled; tilt.resettled = false;
      if (tilt.side === 0) newTilt(Math.random() < 0.5 ? 1 : -1);
      else {
        const r = Math.random();
        if (r < 0.35) { tilt.side = 0; tilt.roll.target = 0; tilt.yaw.target = 0; tilt.pitch.target = 0; rest = true; }
        else if (r < 0.65 || wasResettled) newTilt(-tilt.side);
        else { tiltTo(tilt.side); tilt.resettled = true; }   // same side, new angle (once in a row): not a new tilt
      }
      tilt.speed = rand(3.5, 8);                // this move's pace: slow lean .. quick perk
      tilt.next = t + (Math.random() < 0.1 ? rand(1.5, 2.5) : rand(4, rest ? 10 : 9));
    }
    stepSpring(tilt.roll, dt, tilt.speed, 0.62); stepSpring(tilt.yaw, dt, tilt.speed, 0.7); stepSpring(tilt.pitch, dt, tilt.speed, 0.7);
  }

  // ------------------------------------------------------------------ pupil movement
  // The pupils move as a pair, separately from the eye whites: small, smooth darts up, down,
  // left and right, and now and then a quick dip to 95% height and back. A new change comes
  // every 0.2-0.8s (with the dips' returns, 2.5 changes a second on average); each eases into place over about 0.2s.
  const GAZE = { minGap: 0.2, maxGap: 0.8, x: 10, y: 9, dip: 0.95, dipChance: 0.25, dipHold: [0.25, 0.45] as Vec2 };
  const gaze = { x: spring(), y: spring(), h: spring(1), next: 0.5, undip: -1 };
  function stepGaze(t: number, dt: number) {
    if (gaze.undip >= 0 && t >= gaze.undip) { gaze.h.target = 1; gaze.undip = -1; }
    if (t >= gaze.next) {
      if (Math.random() < GAZE.dipChance && gaze.undip < 0) {
        gaze.h.target = GAZE.dip; gaze.undip = t + rand(...GAZE.dipHold);
      } else {
        gaze.x.target = rand(-GAZE.x, GAZE.x);
        gaze.y.target = rand(-GAZE.y, GAZE.y);
      }
      gaze.next = t + rand(GAZE.minGap, GAZE.maxGap);
    }
    stepSpring(gaze.x, dt, 22, 0.9); stepSpring(gaze.y, dt, 22, 0.9); stepSpring(gaze.h, dt, 22, 0.9);
  }

  // ------------------------------------------------------------------ eyes + blink
  // Open: an oval ring with an oval pupil hole (pupil nudged toward the nose). Blinking: the
  // ring squashes shut from the top toward a pivot low in the eye, then snaps to the closed
  // look, a thin arc curving down like a relaxed lid, and reopens the same way.
  const EYE = MESH.eye, STEPS = 40, ARC = 24;
  let blinkAmount = 0;   // 0 open .. 1 shut
  function eyeShape(e: EyeSpec, b: number): { white: Vec2[]; pupil: Vec2[] | null } {
    const [cx, cy] = e.c, side = cx > 0 ? 1 : -1;
    const open = 1 - b;
    const ellipse = (x: number, y: number, rx: number, ry: number) => Array.from({ length: STEPS }, (_, k): Vec2 => { const t = 2 * Math.PI * k / STEPS; return [x + rx * Math.cos(t), y + ry * Math.sin(t)]; });
    // the pupil is its own layer: blinking never changes it (the lid just covers it); only the
    // pupil movement below moves it and briefly shortens it
    const pupil = ellipse(cx - side * EYE.pin + gaze.x.v, cy + gaze.y.v, EYE.prx, EYE.pry * gaze.h.v);   // same offset for both: they move as a pair
    if (open > 0.22) {
      // the white opening: the eye outline squashed from the top toward a pivot low in the eye
      const pivot = cy + 0.3 * EYE.ry;
      const white = ellipse(cx, cy, EYE.rx, EYE.ry).map(([x, y]): Vec2 => [x, pivot + (y - pivot) * open]);
      return { white, pupil };
    }
    // closed: tapered crescent, ends level, sagging down in the middle; no pupil
    const y0 = cy + 0.16 * EYE.ry, x0 = cx - 1.02 * EYE.rx, w = 2.04 * EYE.rx, top = 0.2 * EYE.ry, bottom = top + 0.2 * EYE.ry;
    const upper = Array.from({ length: ARC + 1 }, (_, k): Vec2 => { const t = k / ARC; return [x0 + t * w, y0 + 4 * top * t * (1 - t)]; });
    const lower = Array.from({ length: ARC - 1 }, (_, k): Vec2 => { const t = 1 - (k + 1) / ARC; return [x0 + t * w, y0 + 4 * bottom * t * (1 - t)]; });
    return { white: [...upper, ...lower], pupil: null };
  }
  // A calm, deliberate blink: ~90ms to close, 150ms fully shut, ~140ms to open (opening is slower),
  // every 2.5-6s, now and then twice in a row.
  type BlinkTiming = { close: number; hold: number; open: number };
  const BLINK: BlinkTiming = { close: 0.09, hold: 0.15, open: 0.14 };
  /** The site's slow blink (Threshold's yes): the same curves, drawn out. */
  const SLOW_BLINK: BlinkTiming = { close: 0.35, hold: 0.2, open: 0.35 };
  const blink = { start: -1, next: 1.2 + Math.random() * 2, double: false, timing: BLINK };
  function stepBlink(t: number) {
    if (blink.start < 0) { if (t >= blink.next) blink.start = t; else return 0; }
    const e = t - blink.start, { close, hold, open } = blink.timing;
    if (e < close) { const u = e / close; return u * u * (3 - 2 * u); }   // lid eases down, deliberate rather than a snap
    if (e < close + hold) return 1;
    if (e < close + hold + open) { const u = (e - close - hold) / open; return 1 - (1 - (1 - u) * (1 - u)); }   // eases open
    const slow = blink.timing !== BLINK;
    blink.start = -1; blink.timing = BLINK;
    blink.double = !slow && !blink.double && Math.random() < 0.18;   // at most two in a row
    blink.next = t + (blink.double ? 0.12 : 2.5 + Math.random() * 3.5);
    return 0;
  }

  // ------------------------------------------------------------------ the site's hooks
  // The lid over everything else: 1 keeps the eyes shut (the intro hands over to a sleeping
  // Urchi), and it lifts on openEyes with the blink's own opening curve.
  const lid = { v: 0, from: 0, start: -1, dur: 0 };
  function stepLid(t: number) {
    if (lid.start < 0) return lid.v;
    const u = lid.dur > 0 ? Math.min(1, (t - lid.start) / lid.dur) : 1;
    lid.v = lid.from * (1 - u) * (1 - u);
    if (u >= 1) lid.start = -1;
    return lid.v;
  }
  // The glance away (Threshold's no): the head turns off and the pupils follow for a moment.
  const GLANCE = { yaw: 22 * D2R, hold: 0.6 };
  const away = { turn: spring(), until: -1 };

  // ------------------------------------------------------------------ render
  const proj = new Float64Array(V.length * 3);   // rotated x, y (screen, y down) and z (toward viewer) per vertex
  const depth = new Float64Array(F.length);

  type Plane = { z: number; n: number; path: Path2D; color: string };
  type Item = { z: number; plane?: Plane; eye?: { white: Path2D; pupil: Path2D | null; left: boolean } };

  function render(yaw: number, pitch: number, roll = 0) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), RP = TILT.pivot;
    const project = ([px, py, pz]: Vec3): Vec3 => {
      const x = px, y = py - PIVOT_Y, z = pz;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
      // roll (the head tilt) about the view axis, pivoting low in the head; positive tips the top to the right
      const xr = x1 * cr - (y2 - RP) * sr, yr = x1 * sr + (y2 - RP) * cr + RP;
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - z2);
      return [xr * s, (yr + PIVOT_Y) * s, z2];
    };
    for (let i = 0; i < V.length; i++) {
      const x = V[i][0], y = V[i][1] - PIVOT_Y, z = V[i][2];
      // yaw about the vertical axis (positive turns the face to the viewer's right), then
      // pitch about the horizontal axis (positive tips the face down; y points down here)
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
      const xr = x1 * cr - (y2 - RP) * sr, yr = x1 * sr + (y2 - RP) * cr + RP;
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - z2);
      proj[i * 3] = xr * s; proj[i * 3 + 1] = (yr + PIVOT_Y) * s; proj[i * 3 + 2] = z2;
    }
    // 1. per triangle: screen winding (visibility), depth, and its normal summed into its plane
    GN.fill(0);
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi];
      let area = 0, nx = 0, ny = 0, nz = 0, zsum = 0;
      for (let k = 0; k < 3; k++) {
        const a = f[k], b = f[(k + 1) % 3];
        const ax = proj[a * 3], ay = -proj[a * 3 + 1], az = proj[a * 3 + 2];
        const bx = proj[b * 3], by = -proj[b * 3 + 1], bz = proj[b * 3 + 2];
        area += proj[a * 3] * proj[b * 3 + 1] - proj[b * 3] * proj[a * 3 + 1];
        nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by);
        zsum += az;
      }
      depth[fi] = zsum / 3; tarea[fi] = area;
      const g = G[fi]; GN[g * 3] += nx; GN[g * 3 + 1] += ny; GN[g * 3 + 2] += nz;
    }
    // 2. visible triangles, merged per plane into one shape (so no seams show inside a plane),
    //    each plane taking its one shade; the silhouette is the union of everything
    const planes = new Map<number, Plane>(), head = new Path2D();
    for (let fi = 0; fi < F.length; fi++) {
      if (!(tarea[fi] > 0)) continue;
      const g = G[fi], f = F[fi];
      let pl = planes.get(g);
      if (!pl) {
        let nx = GN[g * 3], ny = GN[g * 3 + 1], nz = GN[g * 3 + 2];
        const l = Math.hypot(nx, ny, nz) || 1;
        if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const i = Math.pow(Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l), 1.2);
        const c = Math.round(4 + 24 * i);   // near-black: planes range from #040404 to about #1C1C1C
        pl = { z: 0, n: 0, path: new Path2D(), color: `rgb(${c},${c},${c})` };
        planes.set(g, pl);
      }
      const tri = new Path2D();
      tri.moveTo(proj[f[0] * 3], proj[f[0] * 3 + 1]); tri.lineTo(proj[f[1] * 3], proj[f[1] * 3 + 1]); tri.lineTo(proj[f[2] * 3], proj[f[2] * 3 + 1]); tri.closePath();
      pl.path.addPath(tri); head.addPath(tri);
      pl.z += depth[fi]; pl.n++;
    }
    const items: Item[] = [];
    for (const pl of planes.values()) items.push({ z: pl.z / pl.n, plane: pl });
    // 3. eyes: drawn on their face plane, hidden once that face turns away, and sorted just in
    //    front of what they lie on so nearer parts of the head cover them
    EYES.forEach(e => {
      const n = e.n, nz1 = -n[0] * sy + n[2] * cy, nz2 = -n[1] * sp + nz1 * cp;
      if (nz2 < 0.15) return;
      const onPlane = ([x, y]: Vec2): Vec3 => [x, y, e.c[2] + e.dzdx * (x - e.c[0]) + e.dzdy * (y - e.c[1])];
      let zmax = -Infinity;
      const path = (ring: Vec2[]) => { const p = new Path2D(); ring.forEach(([x, y], k) => { const q = project(onPlane([x, y])); if (q[2] > zmax) zmax = q[2]; if (k) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); }); p.closePath(); return p; };
      const shape = eyeShape(e, blinkAmount);
      items.push({ z: 0, eye: { white: path(shape.white), pupil: shape.pupil && path(shape.pupil), left: e.c[0] < 0 } });
      items[items.length - 1].z = zmax + 10;
    });
    items.sort((a, b) => a.z - b.z);   // painter's order: far first

    // 4. paint: dark base (silhouette grown by BASE, so joins between planes show dark), the
    //    planes and eyes far-to-near, then snap the edge to whole pixels and add the rim
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1 / CELL, 0, 0, 1 / CELL, -VBX / CELL, (rise - VBY) / CELL);
    ctx.lineJoin = "round";
    ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
    ctx.lineWidth = CELL;   // one canvas pixel
    for (const it of items) {
      // one-pixel stroke in the plane's own colour closes the anti-aliasing gap to its neighbours
      if (it.plane) { ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path); continue; }
      const eye = it.eye!;
      ctx.save(); ctx.clip(head);                                     // a turned-away eye never sticks out past the head
      ctx.fillStyle = EYE_COLOUR.iris; ctx.fill(eye.white);
      if (eye.pupil) { ctx.clip(eye.white); ctx.fillStyle = eye.left ? EYE_COLOUR.pupilLeft : EYE_COLOUR.pupilRight; ctx.fill(eye.pupil); }   // the lid covers the pupil
      ctx.restore();
    }
    // hard pixel edge against the page (each pixel is head or background), then the white rim:
    // every background pixel touching the head (8 neighbours) turns white, one art pixel wide
    const W = canvas.width, H = canvas.height;
    const img = ctx.getImageData(0, 0, W, H), px = img.data;
    for (let k = 3; k < px.length; k += 4) px[k] = px[k] < 128 ? 0 : 255;
    rimMask.fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3]) continue;
      let touch = false;
      for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && px[(ny * W + nx) * 4 + 3]) { touch = true; break; }
      }
      if (touch) rimMask[y * W + x] = 1;
    }
    for (let i = 0; i < rimMask.length; i++) if (rimMask[i]) { const k = i * 4; px[k] = px[k + 1] = px[k + 2] = 255; px[k + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    lastPx = px;
  }

  // ------------------------------------------------------------------ frame
  // The standalone page's frame, called by the host's ticker instead of its own.
  function frame(dtSeconds: number) {
    const dt = Math.min(0.05, Math.max(0.001, dtSeconds));
    S.t += dt;
    const tx = P.has ? P.nx : 0, ty = P.has ? P.ny : 0;
    S.yaw.target = tx * LOOK.yaw;
    S.pitch.target = ty > 0 ? ty * LOOK.pitchDown : ty * LOOK.pitchUp;
    stepSpring(S.yaw, dt); stepSpring(S.pitch, dt);
    if (STILL) { S.yaw.v = S.yaw.target; S.pitch.v = S.pitch.target; }
    if (FORCED) { S.yaw.v = FORCED[0]; S.pitch.v = FORCED[1]; }
    blinkAmount = Math.max(FORCED_BLINK ?? (reduceMotion ? 0 : stepBlink(S.t)), stepLid(S.t));
    const nod = STILL || FORCED ? breathe(0) : breathe(S.t);
    if (!reduceMotion && !FORCED) { stepTilt(S.t, dt); stepGaze(S.t, dt); }
    if (away.until >= 0 && S.t >= away.until) { away.turn.target = 0; away.until = -1; }
    stepSpring(away.turn, dt, 12, 0.8);
    const roll = FORCED_ROLL ?? tilt.roll.v;
    render(S.yaw.v + tilt.yaw.v + away.turn.v, S.pitch.v + tilt.pitch.v + nod, roll);
  }
  blinkAmount = FORCED_BLINK ?? 0;
  breathe(0);
  render(FORCED ? FORCED[0] : 0, FORCED ? FORCED[1] : 0, FORCED_ROLL ?? 0);

  return {
    canvas,
    update: frame,
    closeEyes() {
      lid.v = 1; lid.start = -1;
    },
    openEyes(seconds) {
      lid.from = lid.v; lid.start = S.t; lid.dur = reduceMotion ? 0 : seconds;
    },
    slowBlink() {
      if (reduceMotion || lid.v > 0) return;
      blink.start = S.t; blink.timing = SLOW_BLINK;
    },
    glance() {
      if (reduceMotion) return;
      const dir = S.yaw.v + tilt.yaw.v > 0 ? -1 : 1;   // away from where it was looking
      away.turn.target = dir * GLANCE.yaw; away.until = S.t + GLANCE.hold;
      gaze.x.target = dir * GAZE.x; gaze.next = S.t + GLANCE.hold;
    },
    alphaAt(u, v) {
      if (!lastPx) return false;
      const x = Math.floor(u * canvas.width), y = Math.floor((1 - v) * canvas.height);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false;
      return lastPx[(y * canvas.width + x) * 4 + 3] > 0;
    },
    dispose() {
      listeners.forEach(([type, fn, opts]) => window.removeEventListener(type, fn, opts));
      listeners.length = 0;
      clearTimeout(release);
    },
  };
}
