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
 * in, the next `every` seconds after the last has gone (a wait drawn between the two). It comes up
 * over `in` seconds somewhere Urchi could get to (see Float.canReach), between `far` of the room's
 * width from it, within `band` of the room's height of its middle, and never more than `below`
 * radians under level from it (it swims head first, and will not go at something head down);
 * drifts `speed` px a second for `life` seconds on a line it could get to all along; and goes over
 * `out`. It is `size` CSS px across at zoom 1, a soft four-point glint as the items' crystals catch
 * the light in a faint round `halo`, warmer than any star (`colour`); unlike a star's, its arms
 * turn (`turn` rad/s) and it breathes by `twinkle` every `pulse` seconds. It is drawn in the cells
 * Urchi is drawn in afloat. Urchi notices it `notice` seconds after it starts to come up. A press within `hit` px of
 * it (`hitTouch` for a finger) goes for it. Gone for it, it slows to a stop over `stop` seconds and
 * brightens by `ready`; given up on, it drifts on for at least `after` seconds more.
 */
const GLINT = { first: [9, 14] as [number, number], every: [20, 40] as [number, number], in: 1.2, out: 1.8, far: [0.18, 0.42] as [number, number], band: 0.3, below: 0.5, speed: [8, 15] as [number, number], life: [16, 22] as [number, number], size: 40, colour: "#ffe9bf", twinkle: 0.35, pulse: 1.7, turn: 0.35, halo: 0.22, notice: 0.5, hit: 30, hitTouch: 44, stop: 0.35, ready: 0.35, after: 4 };
/**
 * The catch, in seconds: the glint flares as the hand closes on it and is gone over `flare`; what
 * was caught grows out of the hand over `grow` to `size` of the floating figure's height across
 * (never under `min` or over `max` CSS px, zoomed as Urchi is), held out past the glove, away
 * from its body (`out` of its own size beyond the hand), so it is seen against the sky, turning; Urchi looks at it for `hold` (by how rare it is, or what it is)
 * while the caption says what it is; then it goes up into the sky over `toSky`, or, one it has
 * already, it lets it go: it drifts off at `drift` of Urchi's height a second, fading over `fade`.
 * Under reduced motion nothing swims: the glint goes, and what it was is there in front of Urchi at
 * once.
 */
const CATCH = { flare: 0.3, grow: 0.5, size: 0.34, min: 64, max: 150, out: 0.42, toSky: 2.6, drift: 0.28, fade: 2.6 };
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
float arm(float along, float across) { float t = 1.0 - min(abs(along), 1.0); return t * t * t * exp(-across * across / (0.0025 + 0.004 * t)); }
void main() {
  vec2 p = uCell > 0.0 ? (floor(gl_FragCoord.xy / uCell) + 0.5) * uCell : gl_FragCoord.xy;
  vec2 d = (p - uCentre) / uHalf;
  float c = cos(uAngle), s = sin(uAngle);
  vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  float a = (arm(q.x, q.y) + arm(q.y, q.x) + 0.6 * exp(-dot(q, q) * 40.0) + uHalo * exp(-dot(q, q) * 7.0)) * uStrength;
  gl_FragColor = vec4(uColour, min(a, 1.0));
}`;

/** The glint, in the room's scene: behind Urchi and its line, over the sky. Placed and lit each frame. */
class Glint {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private u = { uColour: { value: rawColor(GLINT.colour) }, uStrength: { value: 0 }, uCentre: { value: new THREE.Vector2() }, uHalf: { value: 1 }, uCell: { value: 0 }, uAngle: { value: 0 }, uHalo: { value: GLINT.halo } };

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: glintVertex, fragmentShader: glintFragment, transparent: true, depthTest: false, depthWrite: false, ...ADD }),
    );
    this.mesh.renderOrder = -0.75;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /** At room point x, y (CSS px, y up), `size` across, at `strength`, its arms turned `angle`, in cells `cell` device px square; the room's size and its buffer's device px per CSS px. */
  draw(x: number, y: number, size: number, strength: number, angle: number, cell: number, room: { width: number; height: number }, grid: { x: number; y: number }) {
    this.mesh.visible = strength > 0.002 && size > 0.5;
    if (!this.mesh.visible) return;
    this.u.uAngle.value = angle;
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
  /** Something there to be caught came or went: the cursor's word and the control's name follow. */
  onChange(): void;
};

type Out = { x: number; y: number; vx: number; vy: number; born: number; life: number; gone: number; t: number; ready: number; noticed: boolean };
type Held = { id: string; text: ItemText & { tier: ItemTier }; kind: "new" | "again" | "forged"; sprite: ItemSprite; t0: number; shown: boolean; side: 1 | -1 };
type Loose = { sprite: ItemSprite; vx: number; vy: number; t: number; fade: number };

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
    o.room.scene.add(this.glint.mesh);
    this.stopFrame = o.room.onFrame((dt) => this.frame(dt));
    // (after Urchi is placed: what is in its hand follows its hand)
    this.stopAfter = o.room.afterUrchi((dt) => this.draw(dt));
  }

  /** Something there to be caught: a glint out, not yet gone for. */
  get catchable() {
    return !!this.out && !this.going && !this.held && this.out.gone < 0 && this.t - this.out.born > GLINT.in * 0.5;
  }

  /** Busy with a catch: going for one, or holding it. */
  get busy() {
    return !!this.going || !!this.held;
  }

  /** Whether a client point is on the glint (a finger's reach is wider). */
  hit(clientX: number, clientY: number, touch = false) {
    const g = this.out;
    if (!g || !this.catchable) return false;
    const p = this.o.room.toRoom(clientX, clientY), reach = (touch ? GLINT.hitTouch : GLINT.hit) * Math.max(0.6, Math.min(1.5, this.o.room.zoom));
    return Math.hypot(p.x - g.x, p.y - g.y) <= reach;
  }

  /** The float's state changed: a glint's first comes a while after floating in; gone home, whatever was out goes. */
  floatChanged(floating: boolean) {
    if (floating) {
      if (!Number.isFinite(this.next)) this.next = this.t + (this.dev ? 2 : rand(...GLINT.first));
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
    o.att.play("goFor", 4, () => goFor(o.att, () => this.clientOf(this.out), () => !this.going || !!this.held));
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
    o.room.scene.add(sprite.mesh);
    const hand = o.float.handAt(), p = o.room.float;
    this.held = { id: g.id, text, kind, sprite, t0: this.t, shown: false, side: hand && p && hand.x < p.x ? -1 : 1 };
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
    o.float.openHand();
    if (h.kind === "forged") keepForged(h.id);
    else if (h.kind === "new") keepFound(h.id);
    const from = h.sprite.placed;
    if (now || !h.sprite.item) h.sprite.dispose();
    else if (h.kind === "again") {
      const p = o.room.float, dx = from.x - (p?.x ?? 0), dy = from.y - (p?.y ?? 0), d = Math.hypot(dx, dy) || 1, v = CATCH.drift * o.room.figureTall * o.room.zoom;
      this.loose.push({ sprite: h.sprite, vx: (dx / d) * v, vy: (dy / d) * v + v * 0.3, t: 0, fade: 1 });
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
    const o = this.o, room = o.room, p = room.float;
    if (!p) return false;
    const W = room.width, H = room.height;
    for (let k = 0; k < 60; k++) {
      const x = rand(-W / 2, W / 2), y = rand(-H / 2, H / 2), life = rand(...GLINT.life), a = Math.random() * Math.PI * 2, v = rand(...GLINT.speed);
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v, end = { x: x + vx * life, y: y + vy * life };
      const d = Math.hypot(x - p.x, y - p.y), under = Math.atan2(p.y - y, Math.abs(x - p.x));
      if (d < GLINT.far[0] * W || d > GLINT.far[1] * W || Math.abs(y) > GLINT.band * H || Math.abs(end.y) > GLINT.band * H || under > GLINT.below) continue;
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
        o.att.add({ id: "glint", kind: "glint", weight: 1, at: () => this.clientOf(this.out) }, 1);
        o.att.play("notice", 3, () => notice(o.att, () => this.clientOf(this.out)));
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
    if (h && h.shown && this.t - h.t0 >= HOLD[h.kind === "new" ? h.text.tier : h.kind]) this.finish();
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
      const at = this.held ? (o.float.handAt() ?? g) : g;
      // (in the sky, it goes with it for a tab's slide)
      const strength = Math.max(0, fade) * twinkle * (0.75 + GLINT.ready * g.ready) * o.sky.skyPresence;
      this.glint.draw(at.x, at.y, GLINT.size * Math.max(0.35, zoom), strength, o.reducedMotion ? 0 : g.t * GLINT.turn, cell, room, grid);
    } else this.glint.draw(0, 0, 0, 0, 0, 0, room, grid);
    const stage = { width: room.width, height: room.height, grid };
    const h = this.held;
    if (h) {
      const p = room.float, tall = room.figureTall * zoom;
      const hand = o.float.handAt() ?? (p ? room.onFigure(h.side * 330, 600) : { x: 0, y: 0 });
      const size = Math.min(CATCH.max * Math.max(zoom, 0.4), Math.max(CATCH.min * Math.min(1, zoom), CATCH.size * tall));
      const grow = h.shown ? (o.reducedMotion ? 1 : smooth((this.t - h.t0) / CATCH.grow)) : 0;
      const s = size * (0.25 + 0.75 * grow);
      const forged = h.kind === "forged", c = forged ? Math.max(cell, Math.round((s * grid.x) / FORGED_CELLS)) : Math.max(1, cell);
      // out past the glove, away from its middle
      const mx = p?.x ?? 0, my = p?.y ?? 0, dx = hand.x - mx, dy = hand.y - my, dl = Math.hypot(dx, dy) || 1;
      const pose: SpritePose = { x: hand.x + (dx / dl) * CATCH.out * s, y: hand.y + (dy / dl) * CATCH.out * s, size: s, cell: c, fade: grow, wrong: forged ? 1 : 0 };
      h.sprite.place(pose);
      h.sprite.frame(dt, o.reducedMotion);
      h.sprite.draw(room.renderer, stage);
    }
    for (let i = this.loose.length - 1; i >= 0; i--) {
      const l = this.loose[i], p = l.sprite.placed;
      l.t += dt;
      const fade = 1 - smooth(l.t / CATCH.fade);
      l.sprite.place({ ...p, x: p.x + l.vx * dt, y: p.y + l.vy * dt, fade });
      l.sprite.frame(dt, o.reducedMotion);
      l.sprite.draw(room.renderer, stage);
      if (fade <= 0) {
        l.sprite.dispose();
        this.loose.splice(i, 1);
      }
    }
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
    this.held?.sprite.dispose();
    this.loose.forEach((l) => l.sprite.dispose());
  }
}
