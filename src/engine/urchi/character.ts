import MESH_DATA from "./mesh.json";
import SUIT_DATA from "./suit.json";

/**
 * Urchi, the mascot, ported from urchi/index.html so the site's Urchi is the
 * same character as the standalone page: the low-poly head painted into a
 * small canvas, one pixel per 7.5-unit cell, which the host scales up with
 * hard pixel edges; the white rim; the random eye colourway; the cursor
 * follow, breathing, curious head tilt, darting pupils and blinks. Only the
 * page around it is gone (the floor, the hint and its own frame loop: the host
 * calls update(dt)). The site adds its hooks: eyes shut until opened, a slow
 * blink and a glance away (Threshold's yes and no), alphaAt for hit tests,
 * and for the Space intro a reveal (the eyes alone, then the head built
 * outward from them), one ordinary blink on cue, a deep breath and a gaze
 * target. Space's attention system (attention.ts) drives the rest of them:
 * eyes that lead the head, fixation, lids of its own for each eye, a resting
 * lid, a breath whose pace and depth it sets, widening, converging, a pose,
 * a sway, an owl's bob and a stretch. With none of them called it behaves
 * exactly as the standalone page (About and the favicon rely on that). The
 * query-string knobs still work on any page.
 *
 * `smooth` paints the same head without the pixels, for the site's Space and
 * About: the canvas follows the size it is shown at (setResolution), edges keep
 * their anti-aliasing, and the white rim is the silhouette's outline, as wide
 * as one art pixel was (or as the host holds it, setRim), instead of the ring
 * of pixels around it. A frame that would draw what is already there is not
 * painted again, so a still Urchi costs its host no upload.
 *
 * The mesh is baked into urchi/index.html by urchi/tools/build-mascot.mjs;
 * `npm run urchi:sync` copies it to mesh.json beside this file.
 *
 * setSuit dresses it in its spacesuit (suit.json, baked by urchi/tools/build-suit.mjs,
 * `npm run urchi:suit`): the helmet turns with the head, the head shows only through the
 * visor (its ears and spikes tucked in under the shell), and the body hangs from the neck
 * ring, following the head's turn and tilt part of the way. Everything is painted as the
 * head is: the same light, the same flat shade per plane, the same rim round the whole
 * figure. With the suit off nothing of it runs, and the head paints exactly as before.
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];
/** A 2D canvas transform, as setTransform takes it. */
type CanvasTransform6 = [number, number, number, number, number, number];
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

/**
 * The spacesuit, in the head's space (see urchi/tools/build-suit.mjs), flat: vertices, triangles
 * wound as the head's, the plane each belongs to; per vertex its part and material (a triangle's
 * part is its corners'); faces never seen; the planes between the body's parts; the head's
 * vertices it tucks in; its frame.
 */
type Suit = {
  v: number[];
  f: number[];
  g: number[];
  vp: number[];
  vm: number[];
  materials: string[];
  parts: { name: string; material: number; rigid: number; decal: number }[];
  hidden: number[];
  sep: number[][];
  neck: Vec3;
  body: { yaw: number; roll: number };
  tuck: [number, number, number, number][];
  frame: { x: number; y: number; w: number; h: number };
};
const SUIT = SUIT_DATA as unknown as Suit;

/** The canvas's frame in mesh units (x right, y down): wider and taller than the box, so a tilted head fits. */
export const URCHI_FRAME = { x: -701.25, y: -674, w: 1402.5, h: 1230 } as const;
/** The frame with the suit on: the whole suited figure in any pose (and any turn), head's centre still at y 0. */
export const URCHI_SUIT_FRAME: { readonly x: number; readonly y: number; readonly w: number; readonly h: number } = SUIT.frame;
/** The mascot's box, the standalone page's viewBox: what its width is measured by. */
export const URCHI_BOX = { x: -540, y: -500, w: 1080, h: 1056 } as const;
/** The head itself, from ear tips to chin. */
export const URCHI_HEAD = { top: -436, bottom: 435.5 } as const;
/** The eye distance render() uses unless ?ortho asks for none. */
const PERSPECTIVE_AT_REST = 2800;

/**
 * The eyes as drawn at rest (facing front, open, in perspective), in mesh
 * units, x right and y down: where each centre lands, and how far from it the
 * eye reaches. A host that shows the eyes before the head (the Space intro)
 * lays things out around them with this.
 */
export const URCHI_EYES: { centres: [number, number][]; reach: number } = (() => {
  const eyes = MESH.eyes || [];
  const s = (z: number) => PERSPECTIVE_AT_REST / (PERSPECTIVE_AT_REST - z);
  let reach = 0;
  const centres = eyes.map(({ c: [cx, cy, cz], dzdx, dzdy }): [number, number] => {
    const x0 = cx * s(cz), y0 = cy * s(cz);
    for (let k = 0; k < 40; k++) {
      const t = (2 * Math.PI * k) / 40, x = cx + MESH.eye.rx * Math.cos(t), y = cy + MESH.eye.ry * Math.sin(t);
      const z = cz + dzdx * (x - cx) + dzdy * (y - cy);
      reach = Math.max(reach, Math.hypot(x * s(z) - x0, y * s(z) - y0));
    }
    return [x0, y0];
  });
  return { centres, reach };
})();

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

/** This visit's colourway, as drawn (or forced with ?col=) by the first Urchi on the page; null before any Urchi exists. */
export function drawnColourway(): { name: string; iris: string; pupilLeft: string; pupilRight: string } | null {
  if (!drawn) return null;
  return { name: drawn[0], iris: drawn[2], pupilLeft: drawn[3], pupilRight: drawn[4] || drawn[3] };
}

export type UrchiOptions = {
  reducedMotion?: boolean;
  /**
   * Mesh units per canvas pixel: 7.5 (the default) paints the 187 x 164 head of the standalone page.
   * A coarser cell paints a smaller canvas whose rim is still exactly one pixel, for a small Urchi
   * (the About mark, the favicon) that must stay crisp instead of being minified.
   */
  cell?: number;
  /** false: no window listeners, so the gaze never follows the pointer (the favicon). Default true. */
  input?: boolean;
  /**
   * Paint without pixels: anti-aliased edges and a drawn rim, at a resolution the host sets with
   * setResolution (the box's width in canvas pixels). `cell` then only sets the starting size.
   */
  smooth?: boolean;
  /**
   * For the suit's leak check (the dev sheet): paint one layer of the suited figure alone, flat
   * white, instead of the figure: "head", the head as the suit shows it (through the visor);
   * "helmet", the helmet's silhouette (shell, visor, rim and discs); "tucked", the head with its
   * ears and spikes tucked in but not clipped; "eyes", the eyes alone; "glass", what of the visor
   * the rim and discs leave to be seen.
   */
  suitLayer?: "head" | "helmet" | "tucked" | "eyes" | "glass";
  /** For the dev sheet's close-ups: "helmet" paints the suited figure's helmet alone, without the body. */
  suitPart?: "helmet";
};

export type UrchiCharacter = {
  /** The painted head, VBW / CELL by VBH / CELL pixels (187 x 164 at the default cell); transparent around the rim. */
  readonly canvas: HTMLCanvasElement;
  /**
   * One frame: steps the springs and repaints, unless nothing it draws has moved since the last
   * paint (the canvas already shows this frame). Returns whether it painted. dt in seconds.
   */
  update(dt: number): boolean;
  /** Eyes shut (the closed-lid arc) until openEyes. */
  closeEyes(): void;
  openEyes(seconds: number): void;
  /** A slow, deliberate blink: Threshold's yes. `hold` keeps it shut longer (a long, patient blink). */
  slowBlink(hold?: number): void;
  /** A look away, head and pupils, for a moment: Threshold's no. */
  glance(): void;
  /** One ordinary blink now (never a double); the next random one waits its usual gap after it. */
  blink(): void;
  /**
   * Look at a point instead of the pointer: nx, ny in the pointer's space (the viewport, x right,
   * y down, each -1..1). The pupils go at once and, when the look moves far, the head follows
   * about 80ms later on its usual springs (`how` can make it snap there or turn quickly); the
   * pupils settle toward it with small flicks. lookAt(null) hands the gaze back to the pointer
   * (or straight ahead without one). Reduced motion keeps the head front.
   */
  lookAt(nx: number | null, ny?: number, how?: LookHow): void;
  /**
   * One deep breath: over `inhale` seconds the breath rises from wherever it is to the top of an
   * in-breath `depth` times the usual, then breathes out over `exhale` seconds (a nod of `depth`
   * times 3.15 degrees), and the ordinary loop carries on from the bottom, settling back to its
   * usual depth over about a second.
   */
  deepBreath(inhale: number, exhale: number, depth: number): void;
  /**
   * How much of Urchi is painted, 0..1 (1, the default, is all of it and costs nothing extra).
   * 0 paints the eyes alone, as they would show on the head, on nothing. Between, the head's art
   * pixels switch on in order of their distance from the nearer eye centre, and once the head is
   * whole the white rim switches on in the same order. The curious tilt holds off until it is 1.
   */
  setReveal(r: number): void;
  /** Whether canvas coordinates (u, v in 0..1, v up) fall on the head or its rim. */
  alphaAt(u: number, v: number): boolean;
  /**
   * The canvas's resolution: the mascot's box (URCHI_BOX, 1080 units) this many canvas pixels
   * across. A new size resizes the canvas (hosts showing it as a texture make a new one), and the
   * next update paints it. A smooth Urchi's host keeps this at the size it is shown, in device pixels.
   */
  setResolution(boxPx: number): void;
  /**
   * A smooth rim's width in mesh units, as the host wants it (Space holds it between 2 and 3.5
   * screen px); null is one art pixel, 7.5 units. Never under a canvas pixel and a quarter.
   */
  setRim(units: number | null): void;
  /**
   * The spacesuit, 0 (off: exactly the bare head, as ever) .. 1 (on). On, the canvas covers
   * URCHI_SUIT_FRAME instead of URCHI_FRAME (a host showing it as a texture makes a new one), the
   * head shows only through the visor and alphaAt hits the suited figure. Between, the suit
   * builds itself: its facets switch on in order of their distance from the neck ring (the
   * intro's reveal, outward from the neck instead of the eyes), the ears and spikes fold in as
   * the helmet closes, and the bare head shows under what is not yet there.
   */
  setSuit(amount: number): void;
  /** The suit as set, 0..1. */
  readonly suit: number;
  /**
   * The whole figure turned about its vertical axis, in degrees (90 shows its left side, 180 its
   * back): a view, not a look, so the head's own turn still comes on top. The preview sheet's 3/4,
   * side and back views; 0 by default.
   */
  setTurn(degrees: number): void;
  /** The canvas's frame in mesh units: URCHI_FRAME, or URCHI_SUIT_FRAME with the suit on. */
  readonly frame: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

  // ---- attention hooks (Space's attention system drives these; all inert until called)
  /**
   * Something is paying attention for it. Under reduced motion the head still stays front and
   * the breath still, but blinks run and the pupils jump (without easing) to what it looks at,
   * so it still notices things instead of being a picture.
   */
  attend(): void;
  /**
   * The pupils alone, in their own reach (-1..1 each way, a little wider than the darts), while
   * the head keeps to lookAt: reading a line, finding you through one opened eye. null lets them
   * follow the gaze again.
   */
  eyesTo(ex: number | null, ey?: number): void;
  /** Fixed on something: the darts shrink to small flicks, further apart. Interest reads as stillness. */
  fixate(on: boolean): void;
  /** How the pupils move between looks: dart (the default), drift (slow, listening) or still (asleep). */
  setDarts(mode: "dart" | "drift" | "still"): void;
  /** Pupils toward the nose, 0..1: gently cross-eyed at something close. */
  converge(amount: number): void;
  /** The eyes open wider by `amount` (0.06 is 6%) for `seconds`, then settle. */
  widen(amount: number, seconds: number): void;
  /** A quick dip of the pupils' height and back: the small flinch of being woken. */
  dip(): void;
  /** The breath holds where it is for `seconds`: a freeze. */
  pauseBreath(seconds: number): void;
  /** Seconds per breath (4.29 by default); eases there over a couple of breaths. */
  setBreathPeriod(seconds: number): void;
  /** The breath's depth, 1 by default: 1.4 is a sleeper's deeper nod. */
  setBreathDepth(depth: number): void;
  /** The gap between ordinary blinks, in seconds (2.5..6 by default). */
  setBlinkGap(min: number, max: number): void;
  /** How long an ordinary blink stays shut (0.15s by default); longer as it gets sleepy. */
  setBlinkHold(seconds: number): void;
  /** A resting lid over both eyes, 0 (open) .. 0.5: drowsiness. Eases there. */
  setRestLid(v: number): void;
  /** Each eye's own lid, 0 open .. 1 shut (the closed arc), eased over `seconds`: one eye can open alone. */
  setLids(left: number, right: number, seconds?: number): void;
  /**
   * The curious tilt, now, toward a side (-1 left, 1 right), at its usual angle or `degrees`.
   * It is cued, so it happens even with the random tilts off (listening): then it holds a moment
   * and the head comes level again.
   */
  tiltToward(dir: number, degrees?: number): void;
  /** The random curious tilts: `[min, max]` seconds apart (4..9 by default), or null for none (it straightens). */
  setTilts(gap: [number, number] | null): void;
  /** A slow sway of the head, roll ±`degrees` on a `period`, eased in and out; 0 stops it. */
  sway(degrees: number, period?: number): void;
  /**
   * An owl's bob: the head side to side three times, about ±3 degrees at 2Hz, judging a distance.
   * It holds off the random tilts while it runs, and is refused (false) while a tilt is still swinging.
   */
  bob(): boolean;
  /** Woken properly: a slow stretch upward, the face tipping up about 9.5 degrees and the head rising, and back, over 1.2s. */
  stretch(): void;
  /** Hold the head off its aim by these angles in degrees (a sleeper's dip, a nod, a wind-up), on a spring of `speed`. */
  pose(yaw: number, pitch: number, roll: number, speed?: number): void;
  /** A small jolt to the pose's springs, in degrees per second: a startle's kick. */
  kick(yaw: number, pitch: number, roll: number): void;
  /** Two blinks, close together. */
  doubleBlink(): void;
  /** The breath now, -1 .. 1: +1 is the top of an in-breath. */
  readonly breath: number;
  /** How shut the eyes are right now, 0 .. 1 (the more shut of the two). */
  readonly shut: number;
  dispose(): void;
};

/** How the gaze turns when lookAt moves it: "snap" is already there; "quick" turns faster than usual. */
export type LookHow = "snap" | "quick";

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
  /** The head's vertices as painted: the mesh's own, or with the suit on its ears and spikes tucked in. */
  let HV: Vec3[] = V;
  const GN = new Float64Array((Math.max(...G) + 1) * 3), tarea = new Float64Array(F.length);
  const EYES = MESH.eyes || [];
  // canvas in the SVG's coordinates, one pixel per CELL units; it covers x -701.25..701.25 and
  // y -674..556, wider and taller than the SVG's viewBox so a tilted head never gets cut off
  let VBX: number = URCHI_FRAME.x, VBY: number = URCHI_FRAME.y, VBW: number = URCHI_FRAME.w, VBH: number = URCHI_FRAME.h;
  let CELL = o.cell && o.cell > 0 ? o.cell : 7.5;
  const SMOOTH = !!o.smooth;
  const canvas = document.createElement("canvas");
  // The pixel pass reads the frame back every time; a smooth frame is never read, so it can stay on the GPU.
  const ctx = (SMOOTH ? canvas.getContext("2d") : canvas.getContext("2d", { willReadFrequently: true }))!;
  canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
  const COLOR = { base: "#040404" };
  const BASE = 1.5;   // dark base grown beyond the silhouette (units), so joins between planes show dark
  let rimMask = new Uint8Array(canvas.width * canvas.height);
  /** The last frame's pixels, for alphaAt. */
  let lastPx: Uint8ClampedArray | null = null;
  /** A smooth frame's silhouette and its canvas transform, for alphaAt. */
  let lastHead: Path2D | null = null;
  let lastToCanvas: CanvasTransform6 | null = null;
  /** The host's rim, in mesh units (setRim); null for one art pixel. */
  let rim: number | null = null;
  /** A smooth rim's width in mesh units: one art pixel (7.5) or the host's, and never under a canvas pixel and a quarter. */
  const rimWidth = () => Math.max(rim ?? 7.5, 1.25 * CELL);

  // ------------------------------------------------------------------ look
  // the cursor at a screen edge turns the head about 41 degrees (up/down 17.5 / 15)
  const LOOK = { yaw: 41.25 * D2R, pitchUp: 17.5 * D2R, pitchDown: 15 * D2R };
  const LIGHT = (() => { const l = [0.18, 0.88, 0.44], n = Math.hypot(...l); return l.map(v => v / n); })();   // view space: x right, y up, z toward viewer
  const FORCED_ROLL = params.has("roll") ? (Number(params.get("roll")) || 0) * D2R : null;
  const FORCED_BLINK = params.has("blink") ? Math.min(1, Math.max(0, Number(params.get("blink")) || 0)) : null;
  const PERSPECTIVE = params.has("ortho") ? Infinity : PERSPECTIVE_AT_REST;                             // eye distance in mesh units
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
  if (!reduceMotion && o.input !== false) {
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
  // The loop is a phase that advances with time, times a depth, so a scripted breath (the
  // intro's first) can take it over and hand it back without a jump.
  const BREATH = { period: 4.29, nod: 3.15 * D2R, rise: 5.25, settle: 0.8 };   // seconds per breath, nod amplitude, rise in SVG units (~1.75px), seconds to settle after a deep one
  type DeepBreath = { start: number; inhale: number; exhale: number; depth: number; from: number };
  // `period` eases toward `toPeriod` and `depth` settles toward `base`, so the attention hooks can
  // slow it (drowsy, asleep, the bed playing) without a jump; `hold` pauses it (a freeze).
  const breath = { phase: 0, depth: 1, base: 1, w: 0, period: BREATH.period, toPeriod: BREATH.period, hold: -1, deep: null as DeepBreath | null };
  let rise = 0;
  function breathe(dt: number) {
    let w = 0;   // +depth at the top of the in-breath
    const deep = breath.deep;
    breath.period += (breath.toPeriod - breath.period) * (1 - Math.exp(-dt / 2));
    if (reduceMotion || FORCED) {
      w = 0;
    } else if (deep && S.t - deep.start < deep.inhale + deep.exhale) {
      const e = S.t - deep.start;
      if (e < deep.inhale) { const u = e / deep.inhale; w = deep.from + (deep.depth - deep.from) * u * u * (3 - 2 * u); }
      else { breath.phase = Math.PI / 2 + Math.PI * (e - deep.inhale) / deep.exhale; w = Math.sin(breath.phase) * deep.depth; }
    } else if (S.t < breath.hold) {
      w = breath.w;   // frozen mid-breath
    } else {
      if (deep) { breath.deep = null; breath.phase = 1.5 * Math.PI; breath.depth = deep.depth; }   // on from the bottom of the out-breath
      breath.phase = (breath.phase + 2 * Math.PI * dt / breath.period) % (2 * Math.PI);
      breath.depth += (breath.base - breath.depth) * (1 - Math.exp(-dt / BREATH.settle));
      w = Math.sin(breath.phase) * breath.depth;
    }
    breath.w = w;
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
  // `at`: when the last move began (the owl's bob waits for a tilt to finish swinging)
  const tilt = { roll: spring(), yaw: spring(), pitch: spring(), speed: 5.5, side: 0, lastSide: 0, streak: 0, next: rand(2, 5), resettled: false, at: -99 };
  /** The gap between moves (the attention hooks can stretch it, or stop the tilts: `on` false). */
  const tilts = { on: true, min: 4, max: 9 };
  /** With the random tilts off, how long a cued tilt holds before the head comes level. */
  const CUED_HOLD: Vec2 = [1.3, 1.8];
  let cuedUntil = -1;
  function level() {
    tilt.side = 0; tilt.roll.target = 0; tilt.yaw.target = 0; tilt.pitch.target = 0;
  }
  function tiltTo(dir: number, degrees?: number) {
    const small = Math.random() < 0.25;
    tilt.roll.target = dir * (degrees ?? rand(small ? 3 : 6, small ? 6 : 15)) * D2R;
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
    if (reveal < 1) {                                  // a head not yet drawn holds level, so the eyes stay where the host put them
      level();
      tilt.next = Math.max(tilt.next, t + rand(2, 4));
    } else if (!tilts.on) {                            // no random tilts: level, once a cued one has had its moment
      if (t >= cuedUntil) { level(); tilt.next = Math.max(tilt.next, t + rand(2, 4)); }
    } else if (t >= tilt.next) {
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
      tilt.at = t;
      const sooner = tilts.min <= 4 && Math.random() < 0.1;   // no early ones when the tilts are spaced out (drowsy)
      tilt.next = t + (sooner ? rand(1.5, 2.5) : rand(tilts.min, rest ? tilts.max + 1 : tilts.max));
    }
    stepSpring(tilt.roll, dt, tilt.speed, 0.62); stepSpring(tilt.yaw, dt, tilt.speed, 0.7); stepSpring(tilt.pitch, dt, tilt.speed, 0.7);
  }

  // ------------------------------------------------------------------ pupil movement
  // The pupils move as a pair, separately from the eye whites: small, smooth darts up, down,
  // left and right, and now and then a quick dip to 95% height and back. A new change comes
  // every 0.2-0.8s (with the dips' returns, 2.5 changes a second on average); each eases into place over about 0.2s.
  // With a gaze target (lookAt) the darts centre on it and shrink to small flicks.
  // The attention hooks: fixed on something, the flicks shrink to ±2 every 0.6-1.4s; drifting
  // (listening), the pupils wander slowly every 1.2-2.4s; still (asleep), they stay put. eyesTo
  // steers the pupils alone, over a slightly wider reach, with quicker jumps (reading).
  const GAZE = { minGap: 0.2, maxGap: 0.8, x: 10, y: 9, dip: 0.95, dipChance: 0.25, dipHold: [0.25, 0.45] as Vec2, flick: 3 };
  const FIX = { flick: 2, gap: [0.6, 1.4] as Vec2 };
  const DRIFT = { gap: [1.2, 2.4] as Vec2, omega: 6 };
  const EYES_REACH = { x: 20, y: 16, omega: 34 };
  /** Pupils toward the nose at full convergence, in mesh units. */
  const CONVERGE = 16;
  const gaze = { x: spring(), y: spring(), h: spring(1), conv: spring(), next: 0.5, undip: -1, fixed: false, darts: "dart" as "dart" | "drift" | "still", instant: false };
  // the target, this moment's flick about it, and where the head aims (it follows the pupils after a lead)
  const look = { on: false, nx: 0, ny: 0, fx: 0, fy: 0, hx: 0, hy: 0, headAt: -1, quick: -1 };
  const eyes = { on: false, x: 0, y: 0 };
  function stepGaze(t: number, dt: number) {
    if (gaze.undip >= 0 && t >= gaze.undip) { gaze.h.target = 1; gaze.undip = -1; }
    if (t >= gaze.next) {
      const drift = gaze.darts === "drift";
      if (gaze.darts === "still" || eyes.on) {
        look.fx = look.fy = 0;
      } else if (!gaze.fixed && !drift && Math.random() < GAZE.dipChance && gaze.undip < 0) {
        gaze.h.target = GAZE.dip; gaze.undip = t + rand(...GAZE.dipHold);
      } else if (look.on) {
        const f = gaze.fixed ? FIX.flick : GAZE.flick;
        look.fx = rand(-f, f); look.fy = rand(-f, f);
      } else {
        const k = drift ? 0.6 : 1;
        gaze.x.target = rand(-GAZE.x, GAZE.x) * k;
        gaze.y.target = rand(-GAZE.y, GAZE.y) * k;
      }
      gaze.next = t + (gaze.fixed ? rand(...FIX.gap) : drift ? rand(...DRIFT.gap) : rand(GAZE.minGap, GAZE.maxGap));
    }
    if (eyes.on) {
      gaze.x.target = eyes.x * EYES_REACH.x; gaze.y.target = eyes.y * EYES_REACH.y;
    } else if (look.on) {   // kept on the target as it moves
      gaze.x.target = clamp(look.nx * GAZE.x + look.fx, -GAZE.x, GAZE.x);
      gaze.y.target = clamp(look.ny * GAZE.y + look.fy, -GAZE.y, GAZE.y);
    } else if (gaze.darts === "still") {
      gaze.x.target = gaze.y.target = 0;
    }
    if (t < away.eyesUntil) { gaze.x.target = away.eyes * GAZE.x; gaze.y.target = 0; }   // the glance's pupils, whatever the gaze
    if (gaze.instant) {   // reduced motion, attended: jumps without easing
      gaze.x.v = gaze.x.target; gaze.y.v = gaze.y.target; gaze.h.v = 1; gaze.conv.v = gaze.conv.target;
      return;
    }
    const w = eyes.on ? EYES_REACH.omega : gaze.darts === "drift" ? DRIFT.omega : 22;
    stepSpring(gaze.x, dt, w, 0.9); stepSpring(gaze.y, dt, w, 0.9); stepSpring(gaze.h, dt, 22, 0.9); stepSpring(gaze.conv, dt, 6, 0.9);
  }

  // ------------------------------------------------------------------ eyes + blink
  // Open: an oval ring with an oval pupil hole (pupil nudged toward the nose). Blinking: the
  // ring squashes shut from the top toward a pivot low in the eye, then snaps to the closed
  // look, a thin arc curving down like a relaxed lid, and reopens the same way.
  const EYE = MESH.eye, STEPS = 40, ARC = 24;
  let blinkAmount = 0;   // 0 open .. 1 shut
  /** How wide the eyes are (1 as drawn): the startle's widening. */
  const wide = spring(1);
  let wideUntil = -1;
  function eyeShape(e: EyeSpec, b: number): { white: Vec2[]; pupil: Vec2[] | null } {
    const [cx, cy] = e.c, side = cx > 0 ? 1 : -1;
    const open = 1 - b;
    const ellipse = (x: number, y: number, rx: number, ry: number) => Array.from({ length: STEPS }, (_, k): Vec2 => { const t = 2 * Math.PI * k / STEPS; return [x + rx * Math.cos(t), y + ry * Math.sin(t)]; });
    // the pupil is its own layer: blinking never changes it (the lid just covers it); only the
    // pupil movement below moves it and briefly shortens it (and converging draws each toward the nose)
    const pupil = ellipse(cx - side * (EYE.pin + CONVERGE * gaze.conv.v) + gaze.x.v, cy + gaze.y.v, EYE.prx, EYE.pry * gaze.h.v);   // same offset for both: they move as a pair
    if (open > 0.22) {
      // the white opening: the eye outline squashed from the top toward a pivot low in the eye
      const pivot = cy + 0.3 * EYE.ry, w = wide.v;
      const white = ellipse(cx, cy, EYE.rx * w, EYE.ry * w).map(([x, y]): Vec2 => [x, pivot + (y - pivot) * open]);
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
  const blink = { start: -1, next: 1.2 + Math.random() * 2, double: false, timing: BLINK, cued: false, twice: false, gap: [2.5, 6] as Vec2 };
  function stepBlink(t: number) {
    if (blink.start < 0) { if (t >= blink.next) blink.start = t; else return 0; }
    const e = t - blink.start, { close, hold, open } = blink.timing;
    if (e < close) { const u = e / close; return u * u * (3 - 2 * u); }   // lid eases down, deliberate rather than a snap
    if (e < close + hold) return 1;
    if (e < close + hold + open) { const u = (e - close - hold) / open; return 1 - (1 - (1 - u) * (1 - u)); }   // eases open
    const lone = blink.timing !== BLINK || blink.cued;   // a slow blink or one on cue is never doubled
    blink.start = -1; blink.timing = BLINK; blink.cued = false;
    blink.double = blink.twice || (!lone && !blink.double && Math.random() < 0.18);   // at most two in a row
    blink.twice = false;
    blink.next = t + (blink.double ? 0.12 : blink.gap[0] + Math.random() * (blink.gap[1] - blink.gap[0]));
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
  const away = { turn: spring(), until: -1, eyes: 0, eyesUntil: -1 };
  // No stray blink straight after the eyes open: the first comes at least this long after the lids are up.
  const WAKE_BLINK_GAP = 1;

  // The attention hooks' lids: one per eye (the viewer's left, then right), each eased from where
  // it is to where it is sent, and a resting lid over both (drowsiness). An eye shows the most
  // shut of these and the blink, so a blink still closes a heavy eye and a shut eye stays shut.
  type Ease = { v: number; from: number; to: number; start: number; dur: number };
  const ease = (v = 0): Ease => ({ v, from: v, to: v, start: -1, dur: 0 });
  const eyeLids: [Ease, Ease] = [ease(), ease()];
  const restLid = ease();
  function easeTo(e: Ease, to: number, seconds: number) {
    e.from = e.v; e.to = to; e.start = S.t; e.dur = Math.max(0, seconds);
  }
  function stepEase(e: Ease, t: number) {
    if (e.start < 0) return e.v;
    const u = e.dur > 0 ? Math.min(1, (t - e.start) / e.dur) : 1;
    e.v = e.from + (e.to - e.from) * u * u * (3 - 2 * u);
    if (u >= 1) e.start = -1;
    return e.v;
  }
  // The pose: angles the head holds off its aim (a sleeper's dip, a stretch, a nod), on springs.
  const pose = { yaw: spring(), pitch: spring(), roll: spring(), speed: 6 };
  // The sway (listening): roll on a slow sine whose depth eases in and out.
  const swaying = { amp: spring(), period: 3.4, phase: 0 };
  // The owl's bob: three swings side to side at 2Hz. It keeps clear of the curious tilt: not within
  // `clear` seconds of a tilt's start or while the tilt is more than `settled` from where it is
  // going, and no random tilt until `after` seconds past its end, so it reads as a gesture of its own.
  const BOB = { roll: 3 * D2R, shift: 10, hz: 2, cycles: 3, clear: 1, settled: 1.5 * D2R, after: 0.6 };
  let bobStart = -1, shift = 0;
  // The stretch: one slow hump up and back.
  const STRETCH = { seconds: 1.2, pitch: 9.5 * D2R, rise: 16 };
  let stretchStart = -1;
  /** Reduced motion, with attention: blinks and pupil jumps run, nothing else moves. */
  let attended = false;

  // The reveal (the intro's "eyes first"). While it is under 1, render() also paints the eyes as
  // they show on the head into a mask, and its pixel pass (after the alpha snap and the rim) turns
  // off every head pixel beyond the sweep: the head's pixels switch on in order of distance from
  // the nearer eye centre over the first REVEAL.head of the way, the rim's over the rest.
  const REVEAL = { head: 0.72 };
  let reveal = 1;
  let revealMask: CanvasRenderingContext2D | null = null;
  let revealDist: Float32Array | null = null;
  const eyeAt = new Float64Array(EYES.length * 2);   // the eye centres this frame, in canvas pixels
  /** The eyes' reach, in canvas pixels: the head's sweep starts at their edge rather than their centre. */
  const eyeReach = () => URCHI_EYES.reach / CELL;
  function maskContext() {
    if (!revealMask) {
      const c = document.createElement("canvas");
      c.width = canvas.width; c.height = canvas.height;
      revealMask = c.getContext("2d", { willReadFrequently: true })!;
      revealDist = new Float32Array(c.width * c.height);
    }
    return revealMask;
  }
  /** The reveal's pixel pass over the snapped, rimmed frame: what the sweep has not reached goes transparent. */
  function hideUnrevealed(px: Uint8ClampedArray, eyes: Uint8ClampedArray, W: number, H: number) {
    const dist = revealDist!, EYE_REACH = eyeReach();
    let farHead = EYE_REACH, nearRim = Infinity, farRim = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!px[i * 4 + 3]) continue;
      let d = Infinity;
      for (let k = 0; k < eyeAt.length; k += 2) d = Math.min(d, Math.hypot(x + 0.5 - eyeAt[k], y + 0.5 - eyeAt[k + 1]));
      dist[i] = d;
      if (!rimMask[i]) farHead = Math.max(farHead, d);
      else { nearRim = Math.min(nearRim, d); farRim = Math.max(farRim, d); }
    }
    const u = reveal / REVEAL.head, v = (reveal - REVEAL.head) / (1 - REVEAL.head);
    const headR = reveal <= 0 ? -1 : EYE_REACH + Math.min(1, u) * (farHead - EYE_REACH);
    const rimR = v <= 0 ? -1 : nearRim + Math.min(1, v) * (farRim - nearRim);
    for (let i = 0; i < W * H; i++) {
      if (!px[i * 4 + 3]) continue;
      const on = rimMask[i] ? dist[i] <= rimR : eyes[i * 4 + 3] >= 128 || dist[i] <= headR;
      if (!on) px[i * 4 + 3] = 0;
    }
  }

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
    for (let i = 0; i < HV.length; i++) {
      const x = HV[i][0], y = HV[i][1] - PIVOT_Y, z = HV[i][2];
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
      const shape = eyeShape(e, lidOf(e.c[0] < 0 ? 0 : 1));
      items.push({ z: 0, eye: { white: path(shape.white), pupil: shape.pupil && path(shape.pupil), left: e.c[0] < 0 } });
      items[items.length - 1].z = zmax + 10;
    });
    items.sort((a, b) => a.z - b.z);   // painter's order: far first

    // 4. paint: dark base (silhouette grown by BASE, so joins between planes show dark), the
    //    planes and eyes far-to-near, then snap the edge to whole pixels and add the rim.
    //    During a reveal the eyes also go into a mask, and planes nearer than an eye cut it.
    const toCanvas: CanvasTransform6 = [1 / CELL, 0, 0, 1 / CELL, (shift - VBX) / CELL, (rise - VBY) / CELL];
    if (suit > 0) {
      renderSuit(yaw, pitch, roll, head, items, toCanvas);
      return;
    }
    if (SMOOTH) {
      paintSmooth(head, items, toCanvas, reveal < 1 ? EYES.map((e) => project(e.c)) : null);
      return;
    }
    const mask = reveal < 1 ? maskContext() : null;
    if (mask) {
      mask.setTransform(1, 0, 0, 1, 0, 0);
      mask.clearRect(0, 0, canvas.width, canvas.height);
      mask.setTransform(...toCanvas);
      mask.lineJoin = "round"; mask.lineWidth = CELL; mask.fillStyle = mask.strokeStyle = "#fff";
      EYES.forEach((e, k) => { const q = project(e.c); eyeAt[k * 2] = (q[0] + shift - VBX) / CELL; eyeAt[k * 2 + 1] = (q[1] + rise - VBY) / CELL; });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
    ctx.lineWidth = CELL;   // one canvas pixel
    for (const it of items) {
      // one-pixel stroke in the plane's own colour closes the anti-aliasing gap to its neighbours
      if (it.plane) {
        ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path);
        if (mask) { mask.globalCompositeOperation = "destination-out"; mask.fill(it.plane.path); mask.stroke(it.plane.path); }
        continue;
      }
      const eye = it.eye!;
      ctx.save(); ctx.clip(head);                                     // a turned-away eye never sticks out past the head
      ctx.fillStyle = EYE_COLOUR.iris; ctx.fill(eye.white);
      if (eye.pupil) { ctx.clip(eye.white); ctx.fillStyle = eye.left ? EYE_COLOUR.pupilLeft : EYE_COLOUR.pupilRight; ctx.fill(eye.pupil); }   // the lid covers the pupil
      ctx.restore();
      if (mask) { mask.save(); mask.globalCompositeOperation = "source-over"; mask.clip(head); mask.fill(eye.white); mask.restore(); }
    }
    pixelFinish(mask);
  }

  /**
   * The pixel paint's last pass: a hard pixel edge against the page (each pixel is head or
   * background), then the white rim: every background pixel touching the head (8 neighbours)
   * turns white, one art pixel wide. During a reveal, what the sweep has not reached goes.
   */
  function pixelFinish(mask: CanvasRenderingContext2D | null) {
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
    if (mask) hideUnrevealed(px, mask.getImageData(0, 0, W, H).data, W, H);
    ctx.putImageData(img, 0, 0);
    lastPx = px;
  }

  /**
   * The smooth paint: the rim first, as the silhouette's outline (its inner half is covered by
   * what follows), then the dark base, the planes and the eyes far to near, all anti-aliased.
   * During a reveal, circles about the eye centres (in mesh units) grow over the head and then
   * over the rim, in the pixel pass's order, and the eyes show on their own over whatever is there.
   */
  function paintSmooth(head: Path2D, items: Item[], toCanvas: CanvasTransform6, eyeC: Vec3[] | null) {
    const RIM = rimWidth();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    let headR = Infinity, rimR = Infinity;
    if (eyeC) {
      let far = URCHI_EYES.reach;
      for (let i = 0; i < V.length; i++) {
        let d = Infinity;
        for (const c of eyeC) d = Math.min(d, Math.hypot(proj[i * 3] - c[0], proj[i * 3 + 1] - c[1]));
        far = Math.max(far, d);
      }
      far += BASE;
      const u = reveal / REVEAL.head, v = (reveal - REVEAL.head) / (1 - REVEAL.head), near = far * 0.55;
      headR = reveal <= 0 ? -1 : URCHI_EYES.reach + Math.min(1, u) * (far - URCHI_EYES.reach);
      rimR = v <= 0 ? -1 : near + Math.min(1, v) * (far + RIM - near);
    }
    const circles = (r: number) => {
      const p = new Path2D();
      eyeC!.forEach(([x, y]) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); });
      return p;
    };
    if (rimR > 0) {
      ctx.save();
      if (eyeC) ctx.clip(circles(rimR));
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * (RIM + BASE); ctx.stroke(head);
      ctx.restore();
    }
    if (headR > 0) {
      ctx.save();
      if (eyeC) ctx.clip(circles(headR));
      ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
      ctx.lineWidth = CELL;   // one canvas pixel in the plane's own colour closes the gaps to its neighbours
      for (const it of items) {
        if (it.plane) { ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path); }
        else if (!eyeC) paintEye(it.eye!, head);
      }
      ctx.restore();
    }
    if (eyeC) for (const it of items) if (it.eye) paintEye(it.eye, head);
    lastHead = head; lastToCanvas = toCanvas;
  }
  function paintEye(eye: NonNullable<Item["eye"]>, head: Path2D) {
    ctx.save(); ctx.clip(head);                                       // a turned-away eye never sticks out past the head
    ctx.fillStyle = EYE_COLOUR.iris; ctx.fill(eye.white);
    if (eye.pupil) { ctx.clip(eye.white); ctx.fillStyle = eye.left ? EYE_COLOUR.pupilLeft : EYE_COLOUR.pupilRight; ctx.fill(eye.pupil); }   // the lid covers the pupil
    ctx.restore();
  }

  // ------------------------------------------------------------------ the suit
  // Built the first time the suit goes on (nothing of it exists before), from suit.json. The
  // painter works a flat plane at a time: each plane's outline (its loops of vertices, from the
  // triangles that can be seen) is found once here, so a frame walks each plane's corners once.
  /** A part's planes, its vertices (first and count), its middle; `decal`: 1 on the shell plane by plane (the rim), 2 as a whole (a disc). */
  type SuitPart = { planes: Int32Array; v0: number; vn: number; mid: Vec3; decal: number };
  type SuitRig = {
    sv: Float64Array; rigid: Uint8Array;
    /** Per plane: its material, its part, its loops (loop0 .. loop0 + loops in loopAt) and its middle. */
    planeMat: Uint8Array; planePart: Int32Array; loop0: Int32Array; loops: Int32Array; planeMid: Float64Array;
    /** Per loop: where its corners start in `corner` and how many; per corner, the plane across the edge to the next corner (-1: none that is ever drawn). */
    loopAt: Int32Array; loopLen: Int32Array; corner: Int32Array; across: Int32Array;
    /** Per plane: how far its middle is from the neck ring, 0..1 (the suit builds itself outward from there). */
    reveal: Float32Array;
    /** The shell's facets, as planes (outward normal, offset: it is convex). */
    shellPlanes: Float64Array;
    parts: SuitPart[];
    /** The helmet's shell and glass, its decals (the rim, the discs), and the body's parts. */
    shell: number; glass: number; decals: number[]; body: number[];
    /** The planes between the body's parts: [a, b, nx, ny, nz, d] each, part a on the side n.p < d. */
    sep: Float64Array;
    tucked: Vec3[];
    post: Float64Array;
    normals: Float64Array; planeZ: Float64Array; on: Uint8Array;
    colours: Map<number, string>;
  };
  let rig: SuitRig | null = null;
  function suitRig(): SuitRig {
    if (rig) return rig;
    const nv = SUIT.v.length / 3, nf = SUIT.f.length / 3, np = Math.max(...SUIT.g) + 1;
    const sv = Float64Array.from(SUIT.v), rigid = new Uint8Array(nv);
    for (let i = 0; i < nv; i++) rigid[i] = SUIT.parts[SUIT.vp[i]].rigid;
    const hidden = new Uint8Array(nf);
    for (const i of SUIT.hidden) hidden[i] = 1;
    const planeMat = new Uint8Array(np), planePart = new Int32Array(np), planeMid = new Float64Array(np * 3);
    const facesOf: number[][] = Array.from({ length: np }, () => []);
    for (let i = 0; i < nf; i++) {
      const g = SUIT.g[i], pi = SUIT.vp[SUIT.f[i * 3]];
      planePart[g] = pi; planeMat[g] = SUIT.parts[pi].material;
      if (!hidden[i]) facesOf[g].push(i);
    }
    // each directed edge's face, to find the plane across a plane's outline
    const edgeFace = new Map<number, number>();
    const corner = (i: number, k: number) => SUIT.f[i * 3 + (k % 3)];
    for (let i = 0; i < nf; i++) for (let k = 0; k < 3; k++) edgeFace.set(corner(i, k) * nv + corner(i, k + 1), i);
    const loop0 = new Int32Array(np), loops = new Int32Array(np), loopAt: number[] = [], loopLen: number[] = [], corners: number[] = [], across: number[] = [];
    for (let g = 0; g < np; g++) {
      loop0[g] = loopAt.length;
      const fs = facesOf[g];
      if (!fs.length) continue;
      // the middle: the mean of its triangles' middles
      for (const i of fs) for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) planeMid[g * 3 + c] += sv[corner(i, k) * 3 + c] / (3 * fs.length);
      // its outline: the edges of its triangles that no other of them shares, chained into loops
      const own = new Set<number>(), next = new Map<number, number[]>();
      for (const i of fs) for (let k = 0; k < 3; k++) own.add(corner(i, k) * nv + corner(i, k + 1));
      for (const e of own) { const a = Math.floor(e / nv), b = e % nv; if (!own.has(b * nv + a)) (next.get(a) || next.set(a, []).get(a)!).push(b); }
      while (next.size) {
        const start = next.keys().next().value as number;
        loopAt.push(corners.length);
        let a = start, n = 0;
        do {
          const out = next.get(a)!, b = out.pop()!;
          if (!out.length) next.delete(a);
          corners.push(a);
          const f = edgeFace.get(b * nv + a);
          across.push(f === undefined || hidden[f] ? -1 : SUIT.g[f]);
          a = b; n++;
        } while (a !== start && next.has(a));
        loopLen.push(n);
        loops[g]++;
      }
    }
    const [NX, NY, NZ] = SUIT.neck, reveal = new Float32Array(np);
    let far = 0;
    for (let g = 0; g < np; g++) far = Math.max(far, (reveal[g] = Math.hypot(planeMid[g * 3] - NX, planeMid[g * 3 + 1] - NY, planeMid[g * 3 + 2] - NZ)));
    for (let g = 0; g < np; g++) reveal[g] /= far;
    const parts: SuitPart[] = SUIT.parts.map((p) => ({ planes: new Int32Array(0), v0: nv, vn: 0, mid: [0, 0, 0], decal: p.decal }));
    const lists: number[][] = SUIT.parts.map(() => []);
    for (let g = 0; g < np; g++) if (loops[g]) lists[planePart[g]].push(g);
    lists.forEach((l, pi) => { parts[pi].planes = Int32Array.from(l); });
    for (let i = 0; i < nv; i++) { const p = parts[SUIT.vp[i]]; p.v0 = Math.min(p.v0, i); p.vn++; for (let k = 0; k < 3; k++) p.mid[k] += sv[i * 3 + k]; }
    for (const p of parts) for (let k = 0; k < 3; k++) p.mid[k] /= p.vn;
    const named = (n: string) => SUIT.parts.findIndex((p) => p.name === n);
    const shell = named("helmet");
    // the shell's facets: from one triangle of each of its planes
    const shellPlanes: number[] = [];
    for (let i = 0; i < nf; i++) {
      if (planePart[SUIT.g[i]] !== shell || facesOf[SUIT.g[i]][0] !== i) continue;
      const A = corner(i, 0) * 3, B = corner(i, 1) * 3, C = corner(i, 2) * 3;
      const ux = sv[B] - sv[A], uy = sv[B + 1] - sv[A + 1], uz = sv[B + 2] - sv[A + 2], vx = sv[C] - sv[A], vy = sv[C + 1] - sv[A + 1], vz = sv[C + 2] - sv[A + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;   // outward: wound as the head, by the right hand
      shellPlanes.push(nx, ny, nz, nx * sv[A] + ny * sv[A + 1] + nz * sv[A + 2]);
    }
    const tucked = V.slice();
    for (const [i, x, y, z] of SUIT.tuck) tucked[i] = [x, y, z];
    rig = {
      sv, rigid, planeMat, planePart, loop0, loops, planeMid,
      loopAt: Int32Array.from(loopAt), loopLen: Int32Array.from(loopLen), corner: Int32Array.from(corners), across: Int32Array.from(across),
      reveal, shellPlanes: Float64Array.from(shellPlanes), parts,
      shell, glass: named("visor"),
      decals: SUIT.parts.flatMap((p, i) => (p.rigid && p.decal ? [i] : [])),
      body: SUIT.parts.flatMap((p, i) => (p.rigid ? [] : [i])),
      sep: Float64Array.from(SUIT.sep.flat()), tucked,
      post: new Float64Array(nv * 3),
      normals: new Float64Array(np * 3), planeZ: new Float64Array(np), on: new Uint8Array(np), colours: new Map(),
    };
    return rig;
  }
  /** A plane's loops, into a path, at the points in P. */
  function planeInto(R: SuitRig, path: Path2D, g: number, P: Float64Array) {
    for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
      const at = R.loopAt[l], n = R.loopLen[l];
      for (let k = 0; k < n; k++) { const v = R.corner[at + k] * 3; if (k) path.lineTo(P[v], P[v + 1]); else path.moveTo(P[v], P[v + 1]); }
      path.closePath();
    }
  }

  /**
   * The suit's colours, per material: the flat shade of a plane runs from `dark` (turned from
   * the light) to `lit` (square on to it) on the head's own curve. The fabric tops out at the
   * site's ink, never white; its shadows are warm light greys. The glass is not filled: it is
   * the head behind a smoked tint, with a soft sheen on the facets that face the light.
   */
  const SUIT_COLOUR: Record<string, { dark: Vec3; lit: Vec3 }> = {
    fabric: { dark: [150, 145, 136], lit: [233, 233, 226] },
    grey: { dark: [92, 92, 90], lit: [172, 171, 166] },
    dark: { dark: [34, 34, 37], lit: [88, 88, 92] },
    accent: { dark: [176, 104, 40], lit: [246, 172, 76] },
    glass: { dark: [0, 0, 0], lit: [0, 0, 0] },
  };
  const SUIT_MATS = SUIT.materials.map((m) => SUIT_COLOUR[m]);
  /**
   * The visor: the helmet's dark inside, a smoke over the head, and per facet a sheen that grows
   * with its light (so the glass reads as faceted glass); on the facets most square to the light,
   * one soft highlight.
   */
  const VISOR = { inside: "#060608", tint: "rgba(18, 20, 30, 0.1)", sheen: "205, 212, 228", base: 0.025, grow: 0.07, glint: [0.55, 0.9, 0.36] as Vec3 };
  /** The body's share of a breath's rise (the chest lifts a hair with it) and its zero-g drift. */
  const SUIT_BODY = { rise: 0.5, drift: { roll: 0.7 * D2R, yaw: 1.1 * D2R, lift: 3, periods: [7.3, 9.1, 6.1] as Vec3 } };
  let suit = 0, turn = 0;
  /** The last suited frame, for alphaAt: its drawn planes and points, its outline, the bare head under a suit still building. */
  let suitHit: { planes: number[]; post: Float64Array; outline: Path2D; head: Path2D | null; shape: Path2D | null } | null = null;
  /** The body's drift this frame: roll and yaw in radians, lift in mesh units. */
  const drift = { roll: 0, yaw: 0, lift: 0 };
  /** The frame the canvas covers, as it was last sized. */
  const frameNow = () => (suit > 0 ? URCHI_SUIT_FRAME : URCHI_FRAME);
  function fitFrame() {
    const f = frameNow();
    if (f.x === VBX && f.y === VBY && f.w === VBW && f.h === VBH) return;
    VBX = f.x; VBY = f.y; VBW = f.w; VBH = f.h;
    canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
    rimMask = new Uint8Array(canvas.width * canvas.height);
    revealMask = null; revealDist = null; lastPx = null; lastHead = null; lastDrawn = null; suitHit = null;
  }
  const smooth01 = (a: number, b: number, v: number) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

  /**
   * One suited frame. The helmet turns with the head (the same projection, point for point); the
   * body hangs from the neck ring, which the head's roll carries, turned by part of the head's yaw
   * and roll (never its pitch) and drifting a little.
   *
   * Order, far to near. The body first: its parts are convex and any two that can overlap have a
   * plane between them (baked), so the one on the far side of it from the eye goes first. Then
   * the helmet: the rim's planes whose middle the shell hides from the eye, and a disc turned
   * from it, so the shell covers what of them is behind it; the shell; the glass, which is the
   * helmet's dark inside, the head as ever (clipped to the glass, so no ear, spike or pixel of it
   * can show anywhere else) and the smoked tint; last the rest of the rim and the discs.
   */
  function renderSuit(yaw: number, pitch: number, roll: number, head: Path2D, items: Item[], toCanvas: CanvasTransform6) {
    const R = suitRig(), POST = R.post, SV = R.sv, RP = TILT.pivot, nv = SV.length / 3;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // the neck, where the head's roll carries it, and the body's own turn about it
    const [NX, NY, NZ] = SUIT.neck, ny0 = NY - PIVOT_Y;
    const ax = -(ny0 - RP) * sr, ay = (ny0 - RP) * cr + RP + PIVOT_Y;
    const bYaw = SUIT.body.yaw * (yaw - turn) + turn + drift.yaw, bRoll = SUIT.body.roll * roll + drift.roll;
    const cby = Math.cos(bYaw), sby = Math.sin(bYaw), cbr = Math.cos(bRoll), sbr = Math.sin(bRoll);
    const lift = (SUIT_BODY.rise - 1) * rise - drift.lift;
    for (let i = 0; i < nv; i++) {
      let X: number, Y: number, Z: number;
      if (R.rigid[i]) {
        const x = SV[i * 3], y = SV[i * 3 + 1] - PIVOT_Y, z = SV[i * 3 + 2];
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        const y2 = y * cp + z1 * sp; Z = -y * sp + z1 * cp;
        X = x1 * cr - (y2 - RP) * sr; Y = x1 * sr + (y2 - RP) * cr + RP + PIVOT_Y;
      } else {
        const x = SV[i * 3] - NX, y = SV[i * 3 + 1] - NY, z = SV[i * 3 + 2] - NZ;
        const x1 = x * cby + z * sby; Z = -x * sby + z * cby;
        X = ax + x1 * cbr - y * sbr; Y = ay + x1 * sbr + y * cbr;
      }
      const s = PERSPECTIVE === Infinity ? 1 : PERSPECTIVE / (PERSPECTIVE - Z);
      POST[i * 3] = X * s; POST[i * 3 + 1] = Y * s + (R.rigid[i] ? 0 : lift); POST[i * 3 + 2] = Z;
    }
    // the eye, taken back into the head's space and into the body's
    const EZ = PERSPECTIVE === Infinity ? 1e7 : PERSPECTIVE;
    let ehx: number, ehy: number, ehz: number, ebx: number, eby: number, ebz: number;
    {
      const x1 = -(PIVOT_Y + RP) * sr, y2 = -(PIVOT_Y + RP) * cr + RP;
      const y = y2 * cp - EZ * sp, z1 = y2 * sp + EZ * cp;
      ehx = x1 * cy - z1 * sy; ehy = y + PIVOT_Y; ehz = x1 * sy + z1 * cy;
      const u = -ax, v = -ay, bx1 = u * cbr + v * sbr;
      ebx = bx1 * cby - EZ * sby + NX; eby = -u * sbr + v * cbr + NY; ebz = bx1 * sby + EZ * cby + NZ;
    }
    const whole = suit >= 1, shown = whole ? Infinity : suit * 1.12;
    const N = R.normals, PZ = R.planeZ, on = R.on;
    on.fill(0);
    const paths: Path2D[] = [], visor = new Path2D(), drawn: number[] = [];
    // while the suit builds itself, the visor's opening is there from the start (the head shows
    // through all of it), and the glass's dark inside and smoke come in as its facets do
    const opening = whole ? visor : new Path2D();
    let glassAll = 0, glassOn = 0;
    /** Each part's planes drawn this frame, near and far (a disc turned from the eye, the rim behind the shell). */
    const nearOf: number[][] = R.parts.map(() => []), farOf: number[][] = R.parts.map(() => []);
    const box = new Float64Array(R.parts.length * 4);
    const hub = R.parts[R.shell].mid, M = R.planeMid;
    R.parts.forEach((P, pi) => {
      const helmet = !!SUIT.parts[pi].rigid;
      if (o.suitPart === "helmet" && !helmet) return;
      // a disc goes after the glass while it faces the eye, and before the shell while it does not
      const [mx, my, mz] = P.mid;
      const farPart = P.decal === 2 && (mx - hub[0]) * (ehx - mx) + (my - hub[1]) * (ehy - my) + (mz - hub[2]) * (ehz - mz) < 0;
      for (const g of P.planes) {
        const unrevealed = R.reveal[g] > shown;
        if (unrevealed && pi !== R.glass) continue;
        // facing the eye: the plane's outline runs the right way round on screen; its normal as the
        // head's, summed over its outline (the same sum as over its triangles: inside edges cancel)
        let area = 0, nx = 0, ny = 0, nz = 0, z = 0, count = 0;
        for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
          const at = R.loopAt[l], n = R.loopLen[l];
          for (let k = 0; k < n; k++) {
            const p = R.corner[at + k] * 3, q = R.corner[at + (k + 1) % n] * 3;
            const px = POST[p], py = POST[p + 1], pz = POST[p + 2], qx = POST[q], qy = POST[q + 1], qz = POST[q + 2];
            area += px * qy - qx * py;
            nx += (qy - py) * (pz + qz); ny += (pz - qz) * (px + qx); nz += (px - qx) * (qy + py);
            z += pz; count++;
          }
        }
        if (!(area > 0)) continue;
        if (pi === R.glass) { glassAll++; if (!whole) planeInto(R, opening, g, POST); }
        if (unrevealed) continue;
        N[g * 3] = nx; N[g * 3 + 1] = ny; N[g * 3 + 2] = -nz;
        PZ[g] = z / count;
        // a plane of the rim whose middle the shell hides from the eye goes before the shell, which covers what is behind it
        const far = farPart || (P.decal === 1 && !clearOfShell(R.shellPlanes, M[g * 3], M[g * 3 + 1], M[g * 3 + 2], ehx, ehy, ehz));
        const path = (paths[g] = new Path2D());
        planeInto(R, path, g, POST);
        (far ? farOf : nearOf)[pi].push(g);
        on[g] = 1; drawn.push(g);
        if (pi === R.glass) { glassOn++; planeInto(R, visor, g, POST); }
      }
    });
    // the body's order: every pair that overlaps on screen goes far side of its plane first
    const body = R.body.filter((pi) => nearOf[pi].length > 0);
    for (const pi of body) {
      const P = R.parts[pi];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let v = P.v0; v < P.v0 + P.vn; v++) { const x = POST[v * 3], y = POST[v * 3 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      box[pi * 4] = x0; box[pi * 4 + 1] = y0; box[pi * 4 + 2] = x1; box[pi * 4 + 3] = y1;
    }
    const order = orderBody(R, body, box, ebx, eby, ebz);
    const colourOf = (g: number) => {
      let nx = N[g * 3], ny = N[g * 3 + 1], nz = N[g * 3 + 2];
      const l = Math.hypot(nx, ny, nz) || 1;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      return Math.pow(Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l), 1.2);
    };
    const fillPlane = (g: number) => {
      const m = SUIT_MATS[R.planeMat[g]], i = colourOf(g);
      const r = Math.round(m.dark[0] + (m.lit[0] - m.dark[0]) * i), gr = Math.round(m.dark[1] + (m.lit[1] - m.dark[1]) * i), b = Math.round(m.dark[2] + (m.lit[2] - m.dark[2]) * i);
      const key = (r << 16) | (gr << 8) | b;
      let col = R.colours.get(key);
      if (!col) R.colours.set(key, (col = `rgb(${r},${gr},${b})`));
      ctx.fillStyle = ctx.strokeStyle = col; ctx.fill(paths[g]); ctx.stroke(paths[g]);
    };
    const byDepth = (p: number, q: number) => PZ[p] - PZ[q];
    // The figure's outline: the edges of drawn planes whose neighbour is not drawn. The rim and the
    // dark base are strokes of it (with round ends, as round joins), not of every plane: all that
    // shows of either is outside the figure, where only these edges reach.
    const outline = new Path2D();
    for (const g of drawn) for (let l = R.loop0[g]; l < R.loop0[g] + R.loops[g]; l++) {
      const at = R.loopAt[l], n = R.loopLen[l];
      for (let k = 0; k < n; k++) {
        const nb = R.across[at + k];
        if (nb >= 0 && on[nb]) continue;
        const p = R.corner[at + k] * 3, q = R.corner[at + (k + 1) % n] * 3;
        outline.moveTo(POST[p], POST[p + 1]); outline.lineTo(POST[q], POST[q + 1]);
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(...toCanvas);
    ctx.lineJoin = "round";
    // (its points are the rig's own: they change only when a frame is painted, which replaces this)
    suitHit = { planes: drawn, post: POST, outline, head: whole ? null : head, shape: null };
    lastHead = null;
    lastToCanvas = toCanvas;
    const decalPlanes = (lists: number[][]) => R.decals.flatMap((pi) => lists[pi]).sort(byDepth);
    if (o.suitLayer) {
      // the leak check's layers: flat white, nothing else
      ctx.fillStyle = "#fff";
      if (o.suitLayer === "helmet") {
        const sil = new Path2D();
        for (const g of drawn) if (SUIT.parts[R.planePart[g]].rigid) sil.addPath(paths[g]);
        ctx.fill(sil);
      }
      else if (o.suitLayer === "head") { ctx.save(); ctx.clip(visor); ctx.fill(head); ctx.restore(); }
      else if (o.suitLayer === "tucked") ctx.fill(head);
      else if (o.suitLayer === "eyes") { for (const it of items) if (it.eye) { ctx.save(); ctx.clip(head); ctx.fill(it.eye.white); ctx.restore(); } }
      else {
        ctx.fill(visor);
        ctx.globalCompositeOperation = "destination-out";
        for (const g of decalPlanes(nearOf)) ctx.fill(paths[g]);
        ctx.globalCompositeOperation = "source-over";
      }
      if (!SMOOTH) pixelFinish(null);
      return;
    }
    const RIM = rimWidth();
    if (SMOOTH) {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * (RIM + BASE); ctx.lineCap = "round";
      ctx.stroke(outline);
      ctx.lineCap = "butt";
      if (!whole) ctx.stroke(head);
    }
    // the bare head under a suit still building itself (its own rim, drawn with the suit's)
    const headItems = () => {
      ctx.fillStyle = ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.fill(head); ctx.stroke(head);
      ctx.lineWidth = CELL;
      for (const it of items) {
        if (it.plane) { ctx.fillStyle = ctx.strokeStyle = it.plane.color; ctx.fill(it.plane.path); ctx.stroke(it.plane.path); }
        else paintEye(it.eye!, head);
      }
    };
    if (!whole) headItems();
    ctx.strokeStyle = COLOR.base; ctx.lineWidth = 2 * BASE; ctx.lineCap = "round"; ctx.stroke(outline); ctx.lineCap = "butt";
    ctx.lineWidth = CELL;
    for (const pi of order) for (const g of nearOf[pi]) fillPlane(g);
    for (const g of decalPlanes(farOf)) fillPlane(g);
    for (const g of nearOf[R.shell]) fillPlane(g);
    if (glassAll) {
      // through the visor: the helmet's dark inside, the head, the smoked glass
      const glass = glassOn / glassAll;
      ctx.save(); ctx.clip(opening);
      ctx.globalAlpha = glass; ctx.fillStyle = VISOR.inside; ctx.fill(opening); ctx.globalAlpha = 1;
      headItems();
      ctx.globalAlpha = glass; ctx.fillStyle = VISOR.tint; ctx.fill(opening); ctx.globalAlpha = 1;
      for (const g of nearOf[R.glass]) {
        const i = colourOf(g), a = VISOR.base + VISOR.grow * i + VISOR.glint[2] * smooth01(VISOR.glint[0], VISOR.glint[1], i);
        ctx.fillStyle = `rgba(${VISOR.sheen}, ${a.toFixed(3)})`; ctx.fill(paths[g]);
      }
      ctx.restore();
      ctx.lineWidth = CELL;
    }
    for (const g of decalPlanes(nearOf)) fillPlane(g);
    if (!SMOOTH) pixelFinish(null);
  }

  /** Whether the line from a point to the eye (both in the head's space) passes clear of the convex shell. */
  function clearOfShell(planes: Float64Array, px: number, py: number, pz: number, ex: number, ey: number, ez: number) {
    const dx = ex - px, dy = ey - py, dz = ez - pz;
    let t0 = 0, t1 = 1;
    for (let k = 0; k < planes.length; k += 4) {
      const a = planes[k] * px + planes[k + 1] * py + planes[k + 2] * pz - planes[k + 3], b = planes[k] * dx + planes[k + 1] * dy + planes[k + 2] * dz;
      if (Math.abs(b) < 1e-12) { if (a > 0) return true; continue; }
      const t = -a / b;
      if (b < 0) { if (t > t0) t0 = t; } else if (t < t1) t1 = t;
      if (t1 - t0 < 1e-4) return true;
    }
    return false;
  }

  /**
   * The body's parts in painting order: for every two drawn parts whose boxes on screen overlap,
   * the one on the far side of the plane between them (from the eye) goes first; among the parts
   * free to go, the farthest. Should the planes ever disagree in a loop, the farthest part left
   * breaks it.
   */
  function orderBody(R: SuitRig, body: number[], box: Float64Array, ex: number, ey: number, ez: number): number[] {
    const n = R.parts.length, S = R.sep, deg = new Int32Array(n), after: number[][] = body.map(() => []), slot = new Int32Array(n).fill(-1);
    body.forEach((pi, k) => { slot[pi] = k; });
    for (let k = 0; k < S.length; k += 6) {
      const a = S[k], b = S[k + 1];
      if (slot[a] < 0 || slot[b] < 0) continue;
      if (box[a * 4] > box[b * 4 + 2] || box[b * 4] > box[a * 4 + 2] || box[a * 4 + 1] > box[b * 4 + 3] || box[b * 4 + 1] > box[a * 4 + 3]) continue;
      const nearB = S[k + 2] * ex + S[k + 3] * ey + S[k + 4] * ez - S[k + 5] > 0;   // the eye on b's side: a first
      const first = nearB ? a : b, then = nearB ? b : a;
      after[slot[first]].push(then); deg[then]++;
    }
    const z = new Float64Array(n);
    for (const pi of body) { const P = R.parts[pi]; let s = 0; for (let v = P.v0; v < P.v0 + P.vn; v++) s += R.post[v * 3 + 2]; z[pi] = s / P.vn; }
    const out: number[] = [], done = new Uint8Array(n);
    while (out.length < body.length) {
      let pick = -1;
      for (const pi of body) if (!done[pi] && deg[pi] === 0 && (pick < 0 || z[pi] < z[pick])) pick = pi;
      if (pick < 0) for (const pi of body) if (!done[pi] && (pick < 0 || z[pi] < z[pick])) pick = pi;
      done[pick] = 1; out.push(pick);
      for (const q of after[slot[pick]]) deg[q]--;
    }
    return out;
  }
  /** The head's vertices for a suit this far on: the ears and spikes fold in as the helmet closes. */
  function headFor(amount: number): Vec3[] {
    if (amount <= 0) return V;
    const t = smooth01(0.55, 0.95, amount), T = suitRig().tucked;
    if (t >= 1) return T;
    return V.map((p, i) => (T[i] === p ? p : [p[0] + (T[i][0] - p[0]) * t, p[1] + (T[i][1] - p[1]) * t, p[2] + (T[i][2] - p[2]) * t]));
  }

  // ------------------------------------------------------------------ frame
  // Eyes lead, head follows: when a look moves far, the pupils go at once and the head's aim
  // catches up this much later (a quick turn stiffens the head's springs for a moment).
  const LEAD = { seconds: 0.08, jump: 0.08, quick: 0.6 };
  const HEAD = { omega: 9, quick: 16 };
  /** The head's angles for an aim in the pointer's space. */
  const headAim = (nx: number, ny: number): Vec2 => [nx * LOOK.yaw, ny > 0 ? ny * LOOK.pitchDown : ny * LOOK.pitchUp];
  /** Blinks and pupil moves run: always, except under reduced motion with nothing attending (or ?still). */
  const lively = () => !reduceMotion || (attended && !STILL);
  /** Each eye's lid this frame (0 the viewer's left, 1 the right): the most shut of the blink, its own lid and the resting lid. */
  function lidOf(i: 0 | 1) {
    return Math.max(blinkAmount, eyeLids[i].v, restLid.v);
  }

  /**
   * What render() read for the last paint. A frame whose every input is within DRAWN_EPS of it
   * would draw the same picture (a hundredth of a canvas pixel at most), so the canvas keeps it
   * and a host can skip its upload. Null paints the next frame whatever (a new size, the first).
   */
  let lastDrawn: number[] | null = null;
  const DRAWN_EPS = 1e-5;
  function paint(yaw: number, pitch: number, roll: number): boolean {
    const now = [yaw, pitch, roll, lidOf(0), lidOf(1), gaze.x.v, gaze.y.v, gaze.h.v, gaze.conv.v, wide.v, shift, rise, reveal, CELL, rimWidth()];
    if (suit > 0 || turn !== 0) now.push(suit, turn, drift.roll, drift.yaw, drift.lift);
    const was = lastDrawn;
    if (was && was.length === now.length && now.every((v, i) => Math.abs(v - was[i]) < DRAWN_EPS)) return false;
    lastDrawn = now;
    render(turn !== 0 ? yaw + turn : yaw, pitch, roll);
    return true;
  }

  // The standalone page's frame, called by the host's ticker instead of its own.
  function frame(dtSeconds: number): boolean {
    const dt = Math.min(0.05, Math.max(0.001, dtSeconds));
    S.t += dt;
    let tx = 0, ty = 0;   // a gaze target outranks the pointer
    if (look.on && !reduceMotion) {
      if (look.headAt < 0 || S.t >= look.headAt) { look.hx = look.nx; look.hy = look.ny; look.headAt = -1; }
      tx = look.hx; ty = look.hy;
    } else if (P.has) { tx = P.nx; ty = P.ny; }
    [S.yaw.target, S.pitch.target] = headAim(tx, ty);
    const omega = S.t < look.quick ? HEAD.quick : HEAD.omega;
    stepSpring(S.yaw, dt, omega); stepSpring(S.pitch, dt, omega);
    if (STILL) { S.yaw.v = S.yaw.target; S.pitch.v = S.pitch.target; }
    if (FORCED) { S.yaw.v = FORCED[0]; S.pitch.v = FORCED[1]; }
    blinkAmount = Math.max(FORCED_BLINK ?? (lively() ? stepBlink(S.t) : 0), stepLid(S.t));
    stepEase(eyeLids[0], S.t); stepEase(eyeLids[1], S.t); stepEase(restLid, S.t);
    const nod = breathe(dt);
    if (!reduceMotion && !FORCED) { stepTilt(S.t, dt); stepGaze(S.t, dt); }
    else if (lively() && !FORCED) stepGaze(S.t, dt);   // reduced motion, attended: the pupils still jump
    if (away.until >= 0 && S.t >= away.until) { away.turn.target = 0; away.until = -1; }
    stepSpring(away.turn, dt, 12, 0.8);
    if (wideUntil >= 0 && S.t >= wideUntil) { wide.target = 1; wideUntil = -1; }
    stepSpring(wide, dt, 18, 0.7);
    // what the attention hooks add: a held pose, the sway and the owl's bob (none of it under reduced motion)
    stepSpring(pose.yaw, dt, pose.speed, 0.85); stepSpring(pose.pitch, dt, pose.speed, 0.85); stepSpring(pose.roll, dt, pose.speed, 0.85);
    swaying.phase = (swaying.phase + 2 * Math.PI * dt / swaying.period) % (2 * Math.PI);
    stepSpring(swaying.amp, dt, 1.4, 1);
    let bobRoll = 0;
    shift = 0;
    if (bobStart >= 0) {
      const e = S.t - bobStart, dur = BOB.cycles / BOB.hz;
      if (e >= dur) bobStart = -1;
      else { const env = Math.sin(Math.PI * e / dur), s = Math.sin(2 * Math.PI * BOB.hz * e) * env; bobRoll = BOB.roll * s; shift = BOB.shift * s; }
    }
    let reach = 0;
    if (stretchStart >= 0) {
      const u = (S.t - stretchStart) / STRETCH.seconds;
      if (u >= 1) stretchStart = -1;
      else reach = Math.sin(Math.PI * u) ** 2;
    }
    if (reduceMotion || FORCED) { shift = 0; reach = 0; }
    rise -= STRETCH.rise * reach;
    const extra = reduceMotion || FORCED ? { yaw: 0, pitch: 0, roll: 0 } : { yaw: pose.yaw.v, pitch: pose.pitch.v - STRETCH.pitch * reach, roll: pose.roll.v + swaying.amp.v * Math.sin(swaying.phase) + bobRoll };
    const roll = FORCED_ROLL ?? tilt.roll.v + extra.roll;
    if (suit > 0 && !reduceMotion && !FORCED) {
      const [p0, p1, p2] = SUIT_BODY.drift.periods, TAU = 2 * Math.PI;
      drift.roll = SUIT_BODY.drift.roll * Math.sin((TAU * S.t) / p0);
      drift.yaw = SUIT_BODY.drift.yaw * Math.sin((TAU * S.t) / p1 + 1.3);
      drift.lift = SUIT_BODY.drift.lift * Math.sin((TAU * S.t) / p2 + 0.6);
    } else drift.roll = drift.yaw = drift.lift = 0;
    return paint(S.yaw.v + tilt.yaw.v + away.turn.v + extra.yaw, S.pitch.v + tilt.pitch.v + nod + extra.pitch, roll);
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
      if (blink.start < 0) blink.next = Math.max(blink.next, S.t + lid.dur + WAKE_BLINK_GAP);
    },
    slowBlink(hold) {
      if (!lively() || lid.v > 0) return;
      blink.start = S.t; blink.timing = hold === undefined ? SLOW_BLINK : { ...SLOW_BLINK, hold };
    },
    glance() {
      if (!lively()) return;
      const dir = S.yaw.v + tilt.yaw.v > 0 ? -1 : 1;   // away from where it was looking
      if (!reduceMotion) { away.turn.target = dir * GLANCE.yaw; away.until = S.t + GLANCE.hold; }
      away.eyes = dir; away.eyesUntil = S.t + GLANCE.hold;
      gaze.x.target = dir * GAZE.x; gaze.next = S.t + GLANCE.hold;
    },
    blink() {
      if (!lively() || lid.v > 0 || blink.start >= 0) return;
      blink.start = S.t; blink.timing = BLINK; blink.cued = true; blink.double = false;
    },
    lookAt(nx, ny = 0, how) {
      if (nx === null) { look.on = false; look.headAt = -1; gaze.next = S.t; return; }
      if (!look.on) {   // the head was on the pointer (or ahead): the lead starts from there
        look.fx = look.fy = 0;
        look.hx = P.has ? P.nx : 0; look.hy = P.has ? P.ny : 0;
      }
      look.on = true; look.nx = clamp(nx, -1, 1); look.ny = clamp(ny, -1, 1);   // the pupils go at once; the head follows on its springs
      if (how === "snap") {   // already there: head, pupils and all
        look.hx = look.nx; look.hy = look.ny; look.headAt = -1;
        if (!reduceMotion) { [S.yaw.v, S.pitch.v] = headAim(look.nx, look.ny); S.yaw.vel = S.pitch.vel = 0; }
        gaze.x.v = gaze.x.target = look.nx * GAZE.x; gaze.y.v = gaze.y.target = look.ny * GAZE.y;
        return;
      }
      if (look.headAt < 0 && Math.hypot(look.nx - look.hx, look.ny - look.hy) > LEAD.jump) look.headAt = S.t + LEAD.seconds;
      if (how === "quick") look.quick = S.t + LEAD.quick;
    },
    deepBreath(inhale, exhale, depth) {
      breath.deep = { start: S.t, inhale: Math.max(0.05, inhale), exhale: Math.max(0.05, exhale), depth, from: breath.w };
    },
    setReveal(r) {
      reveal = clamp(r, 0, 1);
    },
    setResolution(boxPx) {
      const next = URCHI_BOX.w / Math.max(8, boxPx);
      if (Math.abs(next - CELL) < 1e-9) return;
      CELL = next;
      canvas.width = Math.ceil(VBW / CELL); canvas.height = Math.ceil(VBH / CELL);
      rimMask = new Uint8Array(canvas.width * canvas.height);
      revealMask = null; revealDist = null; lastPx = null; lastHead = null; lastDrawn = null; suitHit = null;
    },
    setRim(units) {
      rim = units === null ? null : Math.max(0, units);
    },
    setSuit(amount) {
      const next = clamp(amount, 0, 1);
      if (next === suit) return;
      suit = next;
      HV = headFor(suit);
      fitFrame();
      lastDrawn = null;
    },
    get suit() {
      return suit;
    },
    setTurn(degrees) {
      turn = degrees * D2R;
    },
    get frame() {
      return frameNow();
    },
    alphaAt(u, v) {
      if (SMOOTH && suit > 0) {
        const h = suitHit;
        if (!h || !lastToCanvas) return false;
        if (!h.shape) {
          const shape = (h.shape = new Path2D()), R = suitRig();
          for (const g of h.planes) planeInto(R, shape, g, h.post);
        }
        const x = u * canvas.width, y = (1 - v) * canvas.height;
        ctx.save();
        ctx.setTransform(...lastToCanvas);
        ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = 2 * (rimWidth() + BASE);
        const on = ctx.isPointInPath(h.shape, x, y) || ctx.isPointInStroke(h.outline, x, y) || (!!h.head && (ctx.isPointInPath(h.head, x, y) || ctx.isPointInStroke(h.head, x, y)));
        ctx.restore();
        return on;
      }
      if (SMOOTH) {
        if (!lastHead || !lastToCanvas) return false;
        const x = u * canvas.width, y = (1 - v) * canvas.height;
        ctx.save();
        ctx.setTransform(...lastToCanvas);
        ctx.lineJoin = "round"; ctx.lineWidth = 2 * (rimWidth() + BASE);
        const on = ctx.isPointInPath(lastHead, x, y) || ctx.isPointInStroke(lastHead, x, y);
        ctx.restore();
        return on;
      }
      if (!lastPx) return false;
      const x = Math.floor(u * canvas.width), y = Math.floor((1 - v) * canvas.height);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false;
      return lastPx[(y * canvas.width + x) * 4 + 3] > 0;
    },

    // ---- attention hooks
    attend() {
      attended = true;
      gaze.instant = reduceMotion && !STILL;
    },
    eyesTo(ex, ey = 0) {
      if (ex === null) { eyes.on = false; gaze.next = S.t; return; }
      eyes.on = true; eyes.x = clamp(ex, -1, 1); eyes.y = clamp(ey, -1, 1);
    },
    fixate(on) {
      if (on === gaze.fixed) return;
      gaze.fixed = on;
      if (on) { look.fx *= FIX.flick / GAZE.flick; look.fy *= FIX.flick / GAZE.flick; gaze.next = S.t + rand(...FIX.gap); }
    },
    setDarts(mode) {
      if (mode === gaze.darts) return;
      gaze.darts = mode; gaze.next = S.t;
    },
    converge(amount) {
      gaze.conv.target = clamp(amount, 0, 1);
    },
    widen(amount, seconds) {
      if (reduceMotion) return;
      wide.target = 1 + amount; wideUntil = S.t + seconds;
    },
    dip() {
      if (!lively()) return;
      gaze.h.target = 0.9; gaze.undip = S.t + 0.3;
    },
    pauseBreath(seconds) {
      breath.hold = Math.max(breath.hold, S.t + seconds);
    },
    setBreathPeriod(seconds) {
      breath.toPeriod = Math.max(1, seconds);
    },
    setBreathDepth(depth) {
      breath.base = Math.max(0, depth);
    },
    setBlinkGap(min, max) {
      blink.gap = [Math.max(0.2, min), Math.max(min, max)];
      if (blink.start < 0 && !blink.double) blink.next = Math.min(blink.next, S.t + blink.gap[1]);
    },
    setBlinkHold(seconds) {
      BLINK.hold = clamp(seconds, 0.05, 2);
    },
    setRestLid(v) {
      const to = clamp(v, 0, 0.5);
      if (Math.abs(to - restLid.to) > 1e-3) easeTo(restLid, to, reduceMotion ? 0 : 1.2);
    },
    setLids(left, right, seconds = 0) {
      const dur = reduceMotion ? 0 : seconds;
      easeTo(eyeLids[0], clamp(left, 0, 1), dur); easeTo(eyeLids[1], clamp(right, 0, 1), dur);
    },
    tiltToward(dir, degrees) {
      if (reduceMotion || reveal < 1) return;
      const side = dir < 0 ? -1 : 1;
      tilt.streak = side === tilt.lastSide ? tilt.streak + 1 : 1; tilt.lastSide = side;
      tiltTo(side, degrees); tilt.resettled = false;
      tilt.speed = rand(6, 8);   // a perk rather than a lean
      tilt.at = S.t;
      if (tilts.on) tilt.next = S.t + rand(tilts.min, tilts.max);
      else cuedUntil = S.t + rand(...CUED_HOLD);
    },
    setTilts(gap) {
      tilts.on = !!gap;
      if (gap) { tilts.min = gap[0]; tilts.max = Math.max(gap[0], gap[1]); tilt.next = Math.min(tilt.next, S.t + tilts.max); cuedUntil = -1; }
    },
    sway(degrees, period = 3.4) {
      swaying.amp.target = Math.abs(degrees) * D2R; swaying.period = Math.max(0.5, period);
    },
    bob() {
      // Not over a tilt still swinging: its 6-15 degrees would swamp the bob's 3.
      const swinging = S.t - tilt.at < BOB.clear || Math.abs(tilt.roll.v - tilt.roll.target) > BOB.settled;
      if (reduceMotion || bobStart >= 0 || swinging) return false;
      bobStart = S.t;
      // and no random tilt starts while it judges the distance
      tilt.next = Math.max(tilt.next, S.t + BOB.cycles / BOB.hz + BOB.after);
      return true;
    },
    stretch() {
      if (reduceMotion) return;
      stretchStart = S.t;
    },
    pose(yaw, pitch, roll, speed = 6) {
      pose.yaw.target = yaw * D2R; pose.pitch.target = pitch * D2R; pose.roll.target = roll * D2R; pose.speed = speed;
    },
    kick(yaw, pitch, roll) {
      pose.yaw.vel += yaw * D2R; pose.pitch.vel += pitch * D2R; pose.roll.vel += roll * D2R;
    },
    doubleBlink() {
      if (!lively() || lid.v > 0) return;
      blink.start = S.t; blink.timing = BLINK; blink.cued = false; blink.double = false; blink.twice = true;
    },
    get breath() {
      return breath.w;
    },
    get shut() {
      return Math.max(lidOf(0), lidOf(1));
    },
    dispose() {
      listeners.forEach(([type, fn, opts]) => window.removeEventListener(type, fn, opts));
      listeners.length = 0;
      clearTimeout(release);
    },
  };
}
