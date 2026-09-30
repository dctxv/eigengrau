import * as THREE from "three";
import { sfx, type ChimeKind } from "@/audio/sfx";
import { CATCH_LINES, ITEMS, fillLine, type ItemTier, type ItemText } from "@/content/site";
import { rawColor } from "@/engine/common/color";
import { ITEM_MAKERS, type Item } from "@/engine/items";
import { ADD } from "@/engine/items/look";
import { ItemSprite, type SpritePose } from "@/engine/items/sprite";
import { goFor, lookAtCatch, notice, watchGo } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import { answerForged, found, hasFound, keepForged, keepFound } from "@/lib/found";
import type { Float } from "./Float";
import type { RoomScene } from "./RoomScene";
import type { FoundSky } from "./sky/Found";

/**
 * The glint: something drifting by, afloat. The first comes `first` seconds after Urchi has floated
 * in (`firstNew` for a visitor who has caught nothing yet, so a newcomer meets one before they
 * wander off), the next `every` seconds after the last has gone (a wait drawn between the two). It comes up
 * over `in` seconds somewhere Urchi could get to (see Float.canReach), between `far` of the room's
 * width from it, within `band` of the room's height of its middle, and never more than `below`
 * radians under level from it (it swims head first, and will not go at something head down);
 * drifts `speed` px a second for `life` seconds on a line it could get to all along; and goes over
 * `out`. It is `size` CSS px across at zoom 1, a soft four-point glint as the items' crystals catch
 * the light in a faint round `halo`, warmer than any star (`colour`); unlike a star's, its arms
 * turn (`turn` rad/s), it breathes by `twinkle` every `pulse` seconds, and every `ring.every`
 * seconds a thin ring goes out from it and fades (over `ring.for`, to `ring.reach` of its size,
 * `ring.amount` bright at first), a ping no star gives. It is drawn in the cells Urchi is drawn in
 * afloat. Urchi notices it `notice` seconds after it starts to come up, and points at it with the
 * arm on that side for `point` seconds as well as looking. A press within `hit` px of
 * it (`hitTouch` for a finger) goes for it. Gone for it, it slows to a stop over `stop` seconds and
 * brightens by `ready`; given up on, it drifts on for at least `after` seconds more.
 */
const GLINT = { first: [9, 14] as [number, number], firstNew: [3, 5] as [number, number], every: [20, 40] as [number, number], in: 1.2, out: 1.8, far: [0.18, 0.42] as [number, number], band: 0.3, below: 0.5, speed: [8, 15] as [number, number], life: [16, 22] as [number, number], size: 72, colour: "#ffe9bf", twinkle: 0.35, pulse: 1.7, turn: 0.35, halo: 0.4, ring: { every: 2.2, for: 1.5, reach: 0.95, amount: 0.55 }, notice: 0.5, point: 2.2, hit: 40, hitTouch: 52, stop: 0.35, ready: 0.35, after: 4 };
/**
 * Something new, held up: once the hands have brought it in (`carry`, and `wait` more), Urchi holds
 * it up high in one hand over `for` seconds (Float.raise), a little out from the glove (`out` of its
 * size), and as it gets there (`burst` of the way up) a star flares behind it (BURST); it is held up
 * for the tier's hold (HOLD) from then.
 */
const RAISE = { wait: 0.15, for: 0.65, burst: 0.7, out: 0.45 };
/**
 * Held up, what it caught is brought to the middle of the page: the view pans to it, closing `rate`
 * of the way a second, for as long as it is held up (so it keeps it there as Urchi drifts), and once
 * it has gone up into the sky pans back to where it was, `back` of the way a second. Urchi's line,
 * fixed to the page's edge, is pulled with the view.
 */
const CENTRE = { rate: 2.2, back: 1.2 };
/**
 * The star behind something new held up: a lens flare, white, as bright as anything on the page. Its
 * core comes up over `grow` seconds (overshooting a little) with a flash (`flash` over its strength,
 * falling away over `flashFor`); then its arms shoot out over `rays`, starting `raysAt` in: four very
 * long thin ones along its axes, reaching `reach` times the size of what it is behind, and four
 * shorter on its diagonals, with fine faint streaks all round. It turns `spin[0]` rad/s at first and
 * `spin[1]` once its arms are out, fast. Let go (what it was behind goes up into the sky), it goes
 * with it and fades over `out`. Under reduced motion it is simply there, still, and fades.
 */
const BURST = { grow: 0.3, flash: 1.5, flashFor: 0.25, raysAt: 0.15, rays: 0.5, reach: 2.6, spin: [0.6, 7] as [number, number], out: 0.9 };

/** The caption's word to a visitor who has caught nothing yet, once a page, as Urchi first notices a glint: held this long (s). */
const HINT_FOR = 5.5;
let hinted = false;
/**
 * The catch, in seconds: the glint flares as the hands close on it and is gone over `flare`; what
 * was caught is there where the glint was (coming up over `grow`), and over `carry` the hands bring
 * it in front of Urchi, growing as it comes, to be held in both of them, as wide as they are apart
 * (`between` times that: it sits in front of the mittens either side of it), never under `min` or
 * over `max` CSS px (zoomed as Urchi is), and all of that `bigger` again, so it is seen, turning; Urchi looks at it for `hold` (by how rare it is, or what it is)
 * while the caption says what it is; then it goes up into the sky over `toSky`, or, one it has
 * already, it lets it go: it drifts off at `drift` of Urchi's height a second, fading over `fade`.
 * Under reduced motion nothing swims: the glint goes, and what it was is there in front of Urchi at
 * once.
 */
const CATCH = { bigger: 1.5, flare: 0.3, grow: 0.25, carry: 0.9, size: 0.45, between: 1.5, min: 84, max: 170, toSky: 2.6, drift: 0.28, fade: 2.6 };
const HOLD: Record<ItemTier | "again" | "forged", number> = { common: 2.4, uncommon: 3, rare: 3.6, top: 4.4, again: 2.4, forged: 3.8 };
/** How rare each tier is, as the sky's own variants are (by weight): only tiers with something made in them are drawn. */
const ODDS: Record<ItemTier, number> = { common: 70, uncommon: 20, rare: 8, top: 2 };
/** A forgery's signal: as wrong as it gets, and this many cells across. */
const FORGED_CELLS = 12;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Every item there is, with its tier, by id. */
const ALL = new Map<string, ItemText & { tier: ItemTier }>(
  (Object.entries(ITEMS) as [ItemTier, ItemText[]][]).flatMap(([tier, list]) => list.map((i) => [i.id, { ...i, tier }] as const)),
);
/** The items made so far (engine/items/index.ts): only these can be caught. */
const made = () => [...ALL.values()].filter((i) => ITEM_MAKERS[i.id]);

/** What a catch turns out to be: a tier drawn by ODDS among those with something made, then in it something it has not caught if there is one. */
function roll(): { id: string; tier: ItemTier } | null {
  const items = made();
  const tiers = (Object.keys(ODDS) as ItemTier[]).filter((t) => items.some((i) => i.tier === t));
  if (!tiers.length) return null;
  let r = Math.random() * tiers.reduce((s, t) => s + ODDS[t], 0), tier = tiers[tiers.length - 1];
  for (const t of tiers) if ((r -= ODDS[t]) <= 0) {
    tier = t;
    break;
  }
  const inTier = items.filter((i) => i.tier === tier), fresh = inTier.filter((i) => !hasFound(i.id)), pool = fresh.length ? fresh : inTier;
  return { id: pool[Math.floor(Math.random() * pool.length)].id, tier };
}

const glintVertex = /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
/** The glint as look.ts's glint draws it (two thin arms tapering to nothing, a soft core), in whole cells: each cell the light at its middle. */
const glintFragment = /* glsl */ `
uniform vec3 uColour;
uniform float uStrength;
uniform vec2 uCentre;
uniform float uHalf;
uniform float uCell;
uniform float uAngle;
uniform float uHalo;
uniform float uRing;
uniform float uRingAmount;
float arm(float along, float across) { float t = 1.0 - min(abs(along), 1.0); return t * t * t * exp(-across * across / (0.0025 + 0.004 * t)); }
void main() {
  vec2 p = uCell > 0.0 ? (floor(gl_FragCoord.xy / uCell) + 0.5) * uCell : gl_FragCoord.xy;
  vec2 d = (p - uCentre) / uHalf;
  float c = cos(uAngle), s = sin(uAngle);
  vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  float a = (arm(q.x, q.y) + arm(q.y, q.x) + 0.6 * exp(-dot(q, q) * 40.0) + uHalo * exp(-dot(q, q) * 7.0)) * uStrength;
  // the ping: a thin ring going out from it and fading
  if (uRing >= 0.0) {
    float r = mix(0.12, ${GLINT.ring.reach.toFixed(3)}, uRing), k = (length(d) - r) / 0.045;
    a += uRingAmount * (1.0 - uRing) * (1.0 - uRing) * exp(-k * k) * uStrength;
  }
  gl_FragColor = vec4(uColour, min(a, 1.0));
}`;

const burstFragment = /* glsl */ `
uniform vec2 uCentre;
uniform float uHalf;
uniform float uCell;
uniform float uAngle;
uniform float uGrow;
uniform float uRays;
uniform float uStrength;
float hash(float n) { return fract(sin(n) * 43758.5453); }
// a spike along x: thin, and thinner and fainter toward its tip at L
float spike(float along, float across, float L, float w) {
  float u = min(along / max(L, 1e-3), 1.0);
  return exp(-pow(across / (w * (0.35 + 0.65 * (1.0 - u))), 2.0)) * pow(1.0 - u, 1.6);
}
void main() {
  vec2 p = uCell > 0.0 ? (floor(gl_FragCoord.xy / uCell) + 0.5) * uCell : gl_FragCoord.xy;
  vec2 d = (p - uCentre) / uHalf;
  float c = cos(uAngle), s = sin(uAngle);
  vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  float r = length(q), g = max(uGrow, 1e-3);
  // the core: blinding at the middle, a soft glow round it
  float v = 1.6 * exp(-r * r / (0.004 * g * g)) + 0.6 * exp(-r / (0.05 * g)) + 0.2 * exp(-r / (0.16 * g));
  // four long arms along its axes, four shorter on its diagonals
  float L = uRays, D = 0.5 * uRays;
  v += spike(abs(q.x), abs(q.y), L, 0.012) + spike(abs(q.y), abs(q.x), L, 0.012);
  vec2 w = vec2(q.x + q.y, q.x - q.y) * 0.70710678;
  v += 0.6 * (spike(abs(w.x), abs(w.y), D, 0.016) + spike(abs(w.y), abs(w.x), D, 0.016));
  // and fine faint streaks all round
  float k = floor((atan(q.y, q.x) + 3.14159265) / 6.2831853 * 96.0);
  v += 0.25 * uRays * step(0.55, hash(k)) * hash(k + 7.0) * exp(-r / 0.3) * smoothstep(0.03, 0.1, r);
  v *= uStrength;
  vec3 col = mix(vec3(0.82, 0.88, 1.0), vec3(1.0), min(1.0, v * 0.8));
  gl_FragColor = vec4(col, min(v, 1.0));
}`;

/** The star behind something new held up (see BURST), in the room's scene: over Urchi, under what it is behind. */
class Burst {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private u = { uCentre: { value: new THREE.Vector2() }, uHalf: { value: 1 }, uCell: { value: 0 }, uAngle: { value: 0 }, uGrow: { value: 0 }, uRays: { value: 0 }, uStrength: { value: 0 } };

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: glintVertex, fragmentShader: burstFragment, transparent: true, depthTest: false, depthWrite: false, ...ADD }),
    );
    this.mesh.renderOrder = 0.45;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /** At room point x, y, reaching `half` CSS px from its middle, its core `grow` and its arms `rays` of the way out, turned `angle`, at `strength`, in cells `cell` device px. */
  draw(x: number, y: number, half: number, grow: number, rays: number, angle: number, strength: number, cell: number, room: { width: number; height: number }, grid: { x: number; y: number }) {
    this.mesh.visible = strength > 0.002 && half > 1;
    if (!this.mesh.visible) return;
    const c = Math.max(1, cell), cx = (Math.floor(((x + room.width / 2) * grid.x) / c) + 0.5) * c, cy = (Math.floor(((y + room.height / 2) * grid.y) / c) + 0.5) * c;
    this.u.uCell.value = cell;
    this.u.uCentre.value.set(cx, cy);
    this.u.uHalf.value = half * grid.x;
    this.u.uAngle.value = angle;
    this.u.uGrow.value = grow;
    this.u.uRays.value = rays;
    this.u.uStrength.value = strength;
    this.mesh.position.set(cx / grid.x - room.width / 2, cy / grid.y - room.height / 2, 0);
    this.mesh.scale.set(2 * half, 2 * half, 1);
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/** The glint, in the room's scene: behind Urchi and its line, over the sky. Placed and lit each frame. */
class Glint {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private u = { uColour: { value: rawColor(GLINT.colour) }, uStrength: { value: 0 }, uCentre: { value: new THREE.Vector2() }, uHalf: { value: 1 }, uCell: { value: 0 }, uAngle: { value: 0 }, uHalo: { value: GLINT.halo }, uRing: { value: -1 }, uRingAmount: { value: GLINT.ring.amount } };

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: glintVertex, fragmentShader: glintFragment, transparent: true, depthTest: false, depthWrite: false, ...ADD }),
    );
    this.mesh.renderOrder = -0.75;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /** At room point x, y (CSS px, y up), `size` across, at `strength`, its arms turned `angle`, its ring `ring` of the way out (-1 none), in cells `cell` device px square; the room's size and its buffer's device px per CSS px. */
  draw(x: number, y: number, size: number, strength: number, angle: number, ring: number, cell: number, room: { width: number; height: number }, grid: { x: number; y: number }) {
    this.mesh.visible = strength > 0.002 && size > 0.5;
    if (!this.mesh.visible) return;
    this.u.uAngle.value = angle;
    this.u.uRing.value = ring;
    // its middle on a cell's middle, so its arms are even
    const c = Math.max(1, cell), cx = (Math.floor(((x + room.width / 2) * grid.x) / c) + 0.5) * c, cy = (Math.floor(((y + room.height / 2) * grid.y) / c) + 0.5) * c;
    this.u.uCentre.value.set(cx, cy);
    this.u.uHalf.value = (size / 2) * grid.x;
    this.u.uCell.value = cell;
    this.u.uStrength.value = strength;
    this.mesh.position.set(cx / grid.x - room.width / 2, cy / grid.y - room.height / 2, 0);
    this.mesh.scale.set(size + (2 * c) / grid.x, size + (2 * c) / grid.y, 1);
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export type CatchOptions = {
  room: RoomScene;
  att: Attention;
  float: Float;
  sky: FoundSky;
  reducedMotion: boolean;
  /** The caption: `title` over `line`, held `dwell` seconds (it outranks the hover caption while it holds). */
  say(title: string, line: string, dwell: number): void;
  /** Said for a screen reader. */
  tell(text: string): void;
  /** A phone (no pointer to click with): the hint says tap. */
  phone: boolean;
  /** Something there to be caught came or went: the cursor's word and the control's name follow. */
  onChange(): void;
};

type Out = { x: number; y: number; vx: number; vy: number; born: number; life: number; gone: number; t: number; ready: number; noticed: boolean };
/** What it caught: which, what it turned out to be, its sprite, when it was shown (t0) and caught, and where (room px: where the glint was). */
type Held = { id: string; text: ItemText & { tier: ItemTier }; kind: "new" | "again" | "forged"; sprite: ItemSprite; t0: number; shown: boolean; caughtAt: number; from: Point; raisedAt: number; raiseFrom: Point };
/** The star behind something new: since when (its clock), how big what it is behind was, how far it has turned, what it is behind, and since when it has been going (-1 not). */
type Star = { t0: number; size: number; angle: number; sprite: ItemSprite; out: number };
/** Something let go, drifting off: its sprite, where it is (room px at Urchi's depth) and how fast it goes, since when, and how much is left of it. */
type Loose = { sprite: ItemSprite; x: number; y: number; vx: number; vy: number; t: number; fade: number };

/**
 * Something drifting by, afloat (Space, tab 1). While Urchi floats awake on its line, now and then a
 * faint glint comes up somewhere in the sky it could get to and drifts slowly across (GLINT). Urchi
 * notices it first, and keeps looking back at it: you follow its eyes there. A click or tap on it
 * (or, from the keyboard, Urchi's own control, which says "Catch it" while one is out) sends Urchi
 * for it: it swims there head first, reaches with the arm on that side and closes its hand on it
 * (Float.goFor). What it caught is drawn only then (roll: by tier, as rare as the sky's own
 * variants, and in a tier something it has not caught if there is one): it grows out of its glove,
 * turning, and Urchi looks at it while the caption says what it is, with a chime of more notes the
 * rarer it is. Something new goes up into the sky, where it hangs from then on (sky/Found.ts); one
 * it has already, it looks at and lets go. Missed, a glint drifts on and goes; another comes later.
 *
 * What it has is kept in this browser (lib/found.ts). A list that does not add up was written by
 * someone else: the next thing Urchi catches is a forgery of something it claims, heavily
 * pixelated and wrong ("You didn't catch this one. You made it."), and the console says a word.
 */
export class Catch {
  private o: CatchOptions;
  private glint = new Glint();
  private out: Out | null = null;
  /** Gone for (the glint stays put and Urchi swims to it), and what it will turn out to be (its code loading). */
  private going: { id: string; tier: ItemTier; forged: boolean; maker: Promise<() => Item> } | null = null;
  private held: Held | null = null;
  private burst = new Burst();
  private star: Star | null = null;
  private loose: Loose[] = [];
  /** When the next glint comes (its clock, s), and its clock. */
  private next = Infinity;
  private t = 0;
  private told = false;
  private stopFrame: () => void;
  private stopAfter: () => void;
  private disposed = false;

  constructor(o: CatchOptions) {
    this.o = o;
    o.room.scene.add(this.glint.mesh, this.burst.mesh);
    this.stopFrame = o.room.onFrame((dt) => this.frame(dt));
    // (after Urchi is placed: what is in its hand follows its hand)
    this.stopAfter = o.room.afterUrchi((dt) => this.draw(dt));
  }

  /** Something there to be caught: a glint out, not yet gone for. */
  get catchable() {
    return !!this.out && !this.going && !this.held && this.out.gone < 0 && this.t - this.out.born > GLINT.in * 0.5;
  }

  /** What it holds now, caught (its id), or null. */
  get holdingId() {
    return this.held?.id ?? null;
  }

  /** Busy with a catch: going for one, or holding it. */
  get busy() {
    return !!this.going || !!this.held;
  }

  /** Whether a client point is on the glint (a finger's reach is wider). */
  hit(clientX: number, clientY: number, touch = false) {
    const g = this.out;
    if (!g || !this.catchable) return false;
    const p = this.o.room.toWorld(clientX, clientY), reach = (touch ? GLINT.hitTouch : GLINT.hit) * Math.max(0.6, Math.min(1.5, this.o.room.zoom));
    return Math.hypot(p.x - g.x, p.y - g.y) <= reach;
  }

  /** The float's state changed: a glint's first comes a while after floating in; gone home, whatever was out goes. */
  floatChanged(floating: boolean) {
    if (floating) {
      if (!Number.isFinite(this.next)) this.next = this.t + (this.dev ? 2 : rand(...(found().items.size ? GLINT.first : GLINT.firstNew)));
      return;
    }
    this.next = Infinity;
    this.fade();
    if (this.held) this.finish(true);
  }

  /** ?glint in development: the first glint two seconds in and the next soon after, to see it without waiting (and ?catch=<id> to say what it is). */
  private get dev() {
    return process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("glint");
  }

  /** Go for the glint (a click on it, or the control's Enter): true if Urchi goes. */
  take(): boolean {
    const g = this.out, o = this.o;
    if (!g || !this.catchable || this.disposed) return false;
    const k = found(), claimed = [...k.items.keys()].filter((id) => ITEM_MAKERS[id]);
    const forged = k.tampered;
    // (?catch=<id> in development: that item, whatever the roll, to see it without waiting for it)
    const asked = this.dev ? new URLSearchParams(window.location.search).get("catch") : null;
    const pick = asked && ALL.has(asked) ? { id: asked } : forged ? (claimed.length ? { id: claimed[Math.floor(Math.random() * claimed.length)] } : roll()) : roll();
    const make = pick && ITEM_MAKERS[pick.id];
    if (!pick || !make) return false;
    const going = { id: pick.id, tier: ALL.get(pick.id)!.tier, forged, maker: make() };
    going.maker.catch(() => undefined);
    if (this.o.reducedMotion) {
      this.going = going;
      this.caught();
      return true;
    }
    const went = o.float.goFor(() => (this.out ? { x: this.out.x, y: this.out.y } : null), { caught: () => this.caught(), lost: () => this.lost() });
    if (!went) return false;
    this.going = going;
    o.att.cancel("notice");
    o.att.play("goFor", 4, () => goFor(o.att, () => this.clientOfWorld(this.out), () => !this.going || !!this.held));
    o.onChange();
    return true;
  }

  /** Urchi's hand closed on it: the glint flares and goes, and what it was grows out of the glove. */
  private caught() {
    const g = this.going, o = this.o;
    if (!g) return;
    this.going = null;
    if (this.out) this.out.gone = this.t;
    o.att.remove("glint");
    const text = ALL.get(g.id)!, kind = g.forged ? "forged" : hasFound(g.id) ? "again" : "new";
    const sprite = new ItemSprite();
    sprite.mesh.renderOrder = 0.5; // in its hand, in front of it
    sprite.held = true;
    o.room.scene.add(sprite.mesh);
    // (where it was caught, at Urchi's depth: the view may pan while it is carried in)
    const hand = o.float.handAt(), pan = o.room.pan;
    const at = this.out ? { x: this.out.x, y: this.out.y } : hand ? { x: hand.x + pan.x, y: hand.y + pan.y } : { x: pan.x, y: pan.y };
    this.held = { id: g.id, text, kind, sprite, t0: this.t, shown: false, caughtAt: this.t, from: at, raisedAt: -1, raiseFrom: at };
    g.maker.then(
      (maker) => {
        const h = this.held;
        if (this.disposed || !h || h.sprite !== sprite) return;
        sprite.setItem(maker());
        this.show(h, g.tier);
      },
      () => this.finish(true),
    );
    o.onChange();
  }

  /** What it caught is here: it is shown, said and heard, and Urchi looks at it. */
  private show(h: Held, tier: ItemTier) {
    const o = this.o, hold = HOLD[h.kind === "new" ? tier : h.kind];
    h.shown = true;
    h.t0 = this.t;
    const name = h.text.name;
    if (h.kind === "forged") {
      o.say(fillLine(CATCH_LINES.forgedTitle, { name: name.toLowerCase() }), CATCH_LINES.forged, hold + 0.6);
      o.tell(`Urchi caught a forged ${name.toLowerCase()}.`);
      answerForged();
    } else {
      o.say(name, h.kind === "again" ? CATCH_LINES.again : h.text.caption, hold + 0.6);
      o.tell(h.kind === "again" ? `Urchi caught another ${name.toLowerCase()}, and lets it go.` : `Urchi caught ${name.toLowerCase()}. ${h.text.caption}`);
    }
    const chime: ChimeKind = h.kind === "new" ? tier : h.kind;
    sfx.chime(chime);
    o.att.play("lookAtCatch", 5, () => lookAtCatch(o.att, () => this.clientOf(h.sprite.placed), h.kind, hold));
  }

  /** Urchi never got there (held, flung, asleep, or too long): the glint drifts on a while. */
  private lost() {
    if (!this.going) return;
    this.going = null;
    const g = this.out;
    if (g && g.gone < 0) {
      g.life = Math.max(g.life, this.t - g.born + GLINT.after);
      const a = Math.random() * Math.PI * 2, v = rand(...GLINT.speed);
      g.vx = Math.cos(a) * v;
      g.vy = Math.sin(a) * v;
      g.ready = 0;
    }
    this.o.att.cancel("goFor");
    this.o.onChange();
  }

  /**
   * Done looking at it: something new goes up into the sky (kept from now), a forgery with it (the
   * forged list answered); one it has already it lets go. `now`: Urchi has gone (home, or flying off
   * its snapped line), so it is simply kept, and nothing is seen to go.
   */
  private finish(now = false) {
    const h = this.held, o = this.o;
    if (!h) return;
    this.held = null;
    h.sprite.held = false;
    o.float.openHand();
    // (and once it has gone up, the view comes back to where it was)
    o.room.panToward(0, 0, CENTRE.back);
    // the star goes up with it, fading; with Urchi gone, at once
    if (this.star) {
      if (now) {
        this.star = null;
        this.burst.mesh.visible = false;
      } else this.star.out = this.t;
    }
    if (h.kind === "forged") keepForged(h.id);
    else if (h.kind === "new") keepFound(h.id);
    const from = h.sprite.placed;
    if (now || !h.sprite.item) h.sprite.dispose();
    else if (h.kind === "again") {
      const p = o.room.float, dx = from.x - (p?.x ?? 0), dy = from.y - (p?.y ?? 0), d = Math.hypot(dx, dy) || 1, v = CATCH.drift * o.room.figureTall * o.room.zoom;
      this.loose.push({ sprite: h.sprite, x: from.x + o.room.pan.x, y: from.y + o.room.pan.y, vx: (dx / d) * v, vy: (dy / d) * v + v * 0.3, t: 0, fade: 1 });
      o.att.play("watchGo", 3, () => watchGo(o.att, () => this.clientOf(h.sprite.placed), 1.4));
    } else {
      o.sky.adopt(h.id, h.sprite, { ...from }, CATCH.toSky);
      o.att.play("watchGo", 3, () => watchGo(o.att, () => o.sky.clientOf(h.id), CATCH.toSky * 0.8));
    }
    this.next = this.t + rand(...GLINT.every) * (this.dev ? 0.2 : 1);
    o.onChange();
  }

  /** The glint goes, if one is out (quickly: Urchi is on its way home). */
  private fade() {
    if (this.going) {
      this.going = null;
      this.o.float.openHand();
    }
    if (this.out && this.out.gone < 0) this.out.gone = this.t;
    this.o.att.remove("glint");
  }

  /** A glint comes up: somewhere Urchi could get to, far enough from it, on a line it could get to all along. */
  private spawn() {
    const o = this.o, room = o.room, seen = room.float, pan = room.pan;
    if (!seen) return false;
    // (all at Urchi's depth, round where the view looks)
    const p = { x: seen.x + pan.x, y: seen.y + pan.y };
    const W = room.width, H = room.height;
    for (let k = 0; k < 60; k++) {
      const x = pan.x + rand(-W / 2, W / 2), y = pan.y + rand(-H / 2, H / 2), life = rand(...GLINT.life), a = Math.random() * Math.PI * 2, v = rand(...GLINT.speed);
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v, end = { x: x + vx * life, y: y + vy * life };
      const d = Math.hypot(x - p.x, y - p.y), under = Math.atan2(p.y - y, Math.abs(x - p.x));
      if (d < GLINT.far[0] * W || d > GLINT.far[1] * W || Math.abs(y - pan.y) > GLINT.band * H || Math.abs(end.y - pan.y) > GLINT.band * H || under > GLINT.below) continue;
      if (!o.float.canReach({ x, y }) || !o.float.canReach(end)) continue;
      this.out = { x, y, vx, vy, born: this.t, life, gone: -1, t: Math.random() * 10, ready: 0, noticed: false };
      if (!this.told) {
        this.told = true;
        o.tell("Something is drifting by.");
      }
      o.onChange();
      return true;
    }
    return false;
  }

  private frame(dt: number) {
    if (this.disposed) return;
    this.t += dt;
    const o = this.o, fl = o.float;
    // a new one, when it is time: floating, awake, and nothing else going on
    if (!this.out && !this.held && this.t >= this.next) {
      if (fl.state === "floating" && !o.att.asleep && !fl.holding && !fl.fetching && o.room.zoom > 0.25) {
        if (!this.spawn()) this.next = this.t + 2;
      } else this.next = this.t + 2;
    }
    const g = this.out;
    if (g) {
      g.t += dt;
      const still = !!this.going;
      if (still) {
        const k = Math.exp(-dt / GLINT.stop);
        g.vx *= k;
        g.vy *= k;
        g.ready = Math.min(1, g.ready + dt / GLINT.stop);
      }
      if (!o.reducedMotion) {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
      }
      // Urchi notices it once it has come up a little, and keeps going back to it
      if (!g.noticed && g.gone < 0 && this.t - g.born > GLINT.notice && !o.att.asleep) {
        g.noticed = true;
        o.att.add({ id: "glint", kind: "glint", weight: 1, at: () => this.clientOfWorld(this.out) }, 1);
        o.att.play("notice", 3, () => notice(o.att, () => this.clientOfWorld(this.out)));
        o.float.pointAt(() => (this.out && this.out.gone < 0 ? { x: this.out.x, y: this.out.y } : null), GLINT.point);
        // someone who has never caught anything is told what it is, once a page
        if (!hinted && !found().items.size) {
          hinted = true;
          o.say("Urchi", fillLine(CATCH_LINES.hint, { click: o.phone ? "Tap" : "Click" }), HINT_FOR);
        }
      }
      // missed: its time is up and it goes
      if (g.gone < 0 && !this.going && this.t - g.born > GLINT.in + g.life) {
        g.gone = this.t;
        o.att.remove("glint");
        this.next = this.t + rand(...GLINT.every) * (this.dev ? 0.2 : 1);
        o.onChange();
      }
      if (g.gone >= 0 && this.t - g.gone > (this.held ? CATCH.flare : GLINT.out)) {
        this.out = null;
        o.onChange();
      }
    }
    // it goes the moment Urchi does
    if (this.out && this.out.gone < 0 && fl.state !== "floating") this.fade();
    // done looking at what it caught
    const h = this.held;
    // something new: held up high in one hand once the hands have brought it in, and a star flares behind it
    if (h && h.kind === "new" && h.shown && h.raisedAt < 0 && this.t >= h.caughtAt + CATCH.carry + RAISE.wait) {
      h.raisedAt = this.t;
      h.raiseFrom = { x: h.sprite.placed.x, y: h.sprite.placed.y };
      fl.raise();
    }
    // held up, the view comes round to it: the camera eases until it is in the middle of the page (and stays there after)
    if (h && h.raisedAt >= 0) {
      const at = h.sprite.placed;
      o.room.panToward(at.x + o.room.pan.x, at.y + o.room.pan.y, CENTRE.rate);
    }
    if (h && h.raisedAt >= 0 && !this.star && this.t >= h.raisedAt + RAISE.for * RAISE.burst) this.star = { t0: this.t, size: h.sprite.placed.size, angle: Math.random() * Math.PI, sprite: h.sprite, out: -1 };
    const done = h && h.shown && (h.kind === "new" ? h.raisedAt >= 0 && this.t - h.raisedAt >= RAISE.for + HOLD[h.text.tier] : this.t - h.t0 >= HOLD[h.kind]);
    if (done) this.finish();
  }

  /** The glint, what is in Urchi's hand, and what it let go: drawn where they are this frame (after Urchi is placed). */
  private draw(dt: number) {
    const o = this.o, room = o.room, grid = { x: room.renderer.domElement.width / Math.max(1, room.width), y: room.renderer.domElement.height / Math.max(1, room.height) };
    const cell = room.pixelCell, zoom = room.zoom;
    const g = this.out;
    if (g) {
      const up = Math.min(1, (this.t - g.born) / GLINT.in), inU = up * up * (3 - 2 * up);
      let fade = inU;
      if (g.gone >= 0) {
        const u = (this.t - g.gone) / (this.held ? CATCH.flare : GLINT.out);
        // caught, it flares as the hand closes and is gone; missed, it simply goes
        fade = this.held ? (1 - smooth(u)) * (1 + 1.5 * Math.sin(Math.PI * Math.min(1, u * 2))) : inU * (1 - smooth(u));
      }
      const twinkle = o.reducedMotion ? 1 : 1 - GLINT.twinkle + GLINT.twinkle * Math.sin((Math.PI * g.t) / GLINT.pulse) ** 2;
      const at = { x: g.x - room.pan.x, y: g.y - room.pan.y };
      // (in the sky, it goes with it for a tab's slide)
      const strength = Math.max(0, fade) * twinkle * (0.75 + GLINT.ready * g.ready) * o.sky.skyPresence;
      // (no ping once it is gone for, or going)
      const ring = o.reducedMotion || this.going || this.held || g.gone >= 0 ? -1 : (g.t % GLINT.ring.every) / GLINT.ring.for;
      this.glint.draw(at.x, at.y, GLINT.size * Math.max(0.35, zoom), strength, o.reducedMotion ? 0 : g.t * GLINT.turn, ring > 1 ? -1 : ring, cell, room, grid);
    } else this.glint.draw(0, 0, 0, 0, 0, -1, 0, room, grid);
    const stage = { width: room.width, height: room.height, grid };
    const h = this.held;
    if (h) {
      const p = room.float, tall = room.figureTall * zoom;
      // between its hands (under reduced motion, which has no hands to move, in front of its middle)
      const hand: Point & { apart?: number } = o.float.handAt() ?? (p ? room.onFigure(0, 780) : { x: 0, y: 0 });
      const wide = hand.apart ? hand.apart * CATCH.between : CATCH.size * tall;
      const size = CATCH.bigger * Math.min(CATCH.max * Math.max(zoom, 0.4), Math.max(CATCH.min * Math.min(1, zoom), wide));
      // the glint is what it caught: it grows out of where the glint was, and the hands bring it in
      const carry = o.reducedMotion ? 1 : smooth((this.t - h.caughtAt) / CATCH.carry);
      const shown = h.shown ? (o.reducedMotion ? 1 : smooth((this.t - h.t0) / CATCH.grow)) : 0;
      const s = size * (0.3 + 0.7 * carry);
      const forged = h.kind === "forged", c = forged ? Math.max(cell, Math.round((s * grid.x) / FORGED_CELLS)) : Math.max(1, cell);
      const fx = h.from.x - room.pan.x, fy = h.from.y - room.pan.y;
      let x = fx + (hand.x - fx) * carry, y = fy + (hand.y - fy) * carry;
      if (h.raisedAt >= 0) {
        // held up: over the raised glove, a little out from it (away from its middle)
        const up = o.reducedMotion ? 1 : smooth((this.t - h.raisedAt) / RAISE.for), mx = p?.x ?? 0, my = p?.y ?? 0, dx = hand.x - mx, dy = hand.y - my, dl = Math.hypot(dx, dy) || 1;
        const tx = hand.x + (dx / dl) * RAISE.out * s, ty = hand.y + (dy / dl) * RAISE.out * s;
        x = h.raiseFrom.x + (tx - h.raiseFrom.x) * up;
        y = h.raiseFrom.y + (ty - h.raiseFrom.y) * up;
      }
      const pose: SpritePose = { x, y, size: s, cell: c, fade: shown, wrong: forged ? 1 : 0 };
      h.sprite.place(pose);
      h.sprite.frame(dt, o.reducedMotion);
      h.sprite.draw(room.renderer, stage);
    }
    // the star, behind what it flares for (held up, then going up into the sky)
    const st = this.star;
    if (st) {
      const u = this.t - st.t0, at = st.sprite.placed, still = o.reducedMotion;
      const k = Math.min(1, u / BURST.grow), grow = still ? 1 : k * (2 - k) + 0.18 * Math.sin(Math.PI * k);
      const rays = still ? 1 : smooth((u - BURST.raysAt) / BURST.rays);
      st.angle += still ? 0 : dt * (BURST.spin[0] + (BURST.spin[1] - BURST.spin[0]) * rays);
      const fade = st.out < 0 ? 1 : 1 - smooth((this.t - st.out) / BURST.out);
      const strength = fade * (1 + (still ? 0 : BURST.flash * Math.exp(-u / BURST.flashFor)));
      this.burst.draw(at.x, at.y, st.size * BURST.reach, Math.max(0, grow), rays, st.angle, strength, Math.max(1, cell), room, grid);
      if (fade <= 0) {
        this.star = null;
        this.burst.draw(0, 0, 0, 0, 0, 0, 0, 0, room, grid);
      }
    }
    for (let i = this.loose.length - 1; i >= 0; i--) {
      const l = this.loose[i], p = l.sprite.placed;
      l.t += dt;
      const fade = 1 - smooth(l.t / CATCH.fade);
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.sprite.place({ ...p, x: l.x - room.pan.x, y: l.y - room.pan.y, fade });
      l.sprite.frame(dt, o.reducedMotion);
      l.sprite.draw(room.renderer, stage);
      if (fade <= 0) {
        l.sprite.dispose();
        this.loose.splice(i, 1);
      }
    }
  }

  /** A point at Urchi's depth (the glint's) as a client point, where the view shows it (null for none). */
  private clientOfWorld(p: Point | null): Point | null {
    const pan = this.o.room.pan;
    return p && this.clientOf({ x: p.x - pan.x, y: p.y - pan.y });
  }

  /** A room point as a client point (null for none). */
  private clientOf(p: Point | null): Point | null {
    if (!p) return null;
    const r = this.o.room.canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2 + p.x, y: r.top + r.height / 2 - p.y };
  }

  dispose() {
    this.disposed = true;
    this.stopFrame();
    this.stopAfter();
    this.o.att.remove("glint");
    this.glint.dispose();
    this.burst.dispose();
    this.held?.sprite.dispose();
    this.loose.forEach((l) => l.sprite.dispose());
  }
}
