import * as THREE from "three";
import { CATCH_LINES, ITEMS, fillLine, type ItemText, type ItemTier } from "@/content/site";
import { ADD } from "@/engine/items/look";
import { ItemSprite } from "@/engine/items/sprite";
import { closeBy, lookAtCatch, watchGo } from "@/engine/urchi/acts";
import type { Attention, Point } from "@/engine/urchi/attention";
import type { Float } from "./Float";
import type { RoomScene } from "./RoomScene";
import type { FoundSky } from "./sky/Found";

/**
 * Something taken down out of the sky: `size` of the floating figure's height across (never under
 * `min` or over `max` CSS px), grown to that from its size up there over `grow` seconds. Held, it
 * follows the hand on a spring (`hold`: rad/s and share of critical), so it lags a little and a
 * shake is a real shake; let go, it keeps the hand's speed (at most `fastest` px/s), slowing at `drag`
 * a second, and the page's edges catch it, giving back `bounce` of its speed. Left alone `idle`
 * seconds it goes home to its place in the sky, over `home`. Let go within `give` of the figure's
 * height of Urchi's middle, it is given to it.
 */
const OUT = { size: 0.62, min: 110, max: 240, grow: 0.35, hold: { omega: 16, zeta: 0.85 }, fastest: 3200, drag: 0.9, bounce: 0.35, idle: 18, home: 1.8, give: 0.6, samples: 0.09, wall: 24 };
/** A forgery given to Urchi: pushed back at `back` px/s, and the caption says what it is. */
const REFUSE = { back: 520 };
/** A glove waved at Urchi: this many turns of its way across within `within` seconds, each faster than `speed` px/s, near it (`near` of its height); it waves back, at most every `every` seconds. */
const WAVE = { turns: 3, within: 1.4, speed: 140, near: 1.8, every: 6 };
/** The micrometeorite near its face (within `near` of its height of its eyes): cross-eyed, at most every `every` s. Thrown faster than `burn` px/s it burns up in a streak `streak` s long, and is back in its place. */
const SPECK = { near: 0.45, every: 5, burn: 1300, streak: 0.8 };
/** The frozen lightning shaken: `turns` turns of its way within `within` s, each faster than `speed` px/s: it cracks and strikes, the page flashing `flash` bright over `flashFor` s; at most every `every` s. */
const SHAKE = { turns: 3, within: 0.9, speed: 700, flash: 0.35, flashFor: 0.35, wrong: 0.5, every: 2.5 };
/** The magnet stone: within `reach` of Urchi's height it draws Urchi toward it, at most `pull` of its height per second squared; what hangs in the sky within `sky` px of it is drawn to it. */
const MAGNET = { reach: 2.4, pull: 0.45, sky: 380 };
/** The comet minnows let go: they school after the pointer, `behind` px behind it, on a spring (`omega`, `zeta`); a tap scatters them at `scatter` px/s and they come back after `regroup` s. Given, they swim round its helmet `round` of its height out, `turns` rad/s, for `for` s. */
const SCHOOL = { behind: 70, omega: 3.2, zeta: 0.7, scatter: 900, regroup: 1.2, round: 0.5, turns: 2.4, for: 4.2, gone: 8 };

/** A spring toward `x`, `y` (`omega` rad/s, `zeta` of critical), stepped a 120th of a second at a time, so it keeps still however long a frame is. */
function spring(u: { x: number; y: number; vx: number; vy: number }, x: number, y: number, omega: number, zeta: number, dt: number) {
  const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
  for (let i = 0; i < n; i++) {
    u.vx += (omega * omega * (x - u.x) - 2 * zeta * omega * u.vx) * h;
    u.vy += (omega * omega * (y - u.y) - 2 * zeta * omega * u.vy) * h;
    u.x += u.vx * h;
    u.y += u.vy * h;
  }
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Every item's words and tier, by id. */
const TEXT = new Map<string, ItemText & { tier: ItemTier }>((Object.entries(ITEMS) as [ItemTier, ItemText[]][]).flatMap(([tier, list]) => list.map((i) => [i.id, { ...i, tier }] as const)));

/** A step of a given thing's reaction: `at` seconds after it was given. */
type Step = { at: number; run: () => void; done?: boolean };

/** Where a thing out is, and what it is doing. */
type Out = {
  id: string;
  forged: boolean;
  sprite: ItemSprite;
  /** Where it is (room px at Urchi's depth) and how fast it goes (px/s). */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Its size up in the sky when taken down, and when (the clock); when it was last handled. */
  from: number;
  t0: number;
  touched: number;
  turn: number;
  /** Held: where on it the hand has it (px from its middle), where the hand is (room px at Urchi's depth), and the hand's last places. */
  held: { gx: number; gy: number; px: number; py: number; samples: { t: number; x: number; y: number }[] } | null;
  mode: "loose" | "follow" | "given" | "burn";
  /** Given: when, and its steps, and where it is drawn meanwhile (room px, as the page shows it). */
  given: { t0: number; steps: Step[]; place: () => Point | null; carry: { x: number; y: number } } | null;
  /** A shake or a wave: its way across (the sign of its speed across, and when it last turned), and how many turns lately. */
  way: { sx: number; sy: number; turns: number[] };
  /** When each of its own things last happened (the clock). */
  last: Record<string, number>;
  /** Scattered (the minnows): until when. */
  scattered: number;
  /** The page's flash, and a moment of its signal going wrong (the lightning's crack): until when. */
  wrongUntil: number;
};

export type HandlingOptions = {
  room: RoomScene;
  att: Attention;
  float: Float;
  sky: FoundSky;
  reducedMotion: boolean;
  /** The caption: `title` over `line`, held `dwell` seconds. */
  say(title: string, line: string, dwell: number): void;
  /** Said for a screen reader. */
  tell(text: string): void;
};

const streakFragment = /* glsl */ `
uniform vec2 uHead;
uniform vec2 uDir;
uniform float uLen;
uniform float uWidth;
uniform float uCell;
uniform float uStrength;
void main() {
  vec2 p = uCell > 0.0 ? (floor(gl_FragCoord.xy / uCell) + 0.5) * uCell : gl_FragCoord.xy;
  vec2 r = p - uHead;
  float along = -dot(r, uDir), across = dot(r, vec2(-uDir.y, uDir.x));
  float t = clamp(along / max(uLen, 1.0), 0.0, 1.0);
  float tail = along >= 0.0 && along <= uLen ? (1.0 - t) * (1.0 - t) * exp(-pow(across / (uWidth * (1.0 - 0.7 * t)), 2.0)) : 0.0;
  float head = exp(-dot(r, r) / (uWidth * uWidth * 5.0));
  float a = (tail + 1.4 * head) * uStrength;
  gl_FragColor = vec4(mix(vec3(1.0, 0.72, 0.4), vec3(1.0, 0.97, 0.9), min(1.0, a)), min(a, 1.0));
}`;
const flatVertex = /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const flashFragment = /* glsl */ `uniform float uStrength; void main() { gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), uStrength); }`;

/**
 * Space's items, handled (Space, tab 1, afloat). What hangs in the sky can be taken down: a press on
 * it and a drag takes it out of its place, and it comes forward, grown, on the hand. Let go, it
 * keeps the hand's speed and drifts in zero gravity, the page's edges catching it, until it is taken
 * again or, left alone, goes home to its place. One is out at a time: taking another sends the first
 * home. Let go on Urchi, it is given to it: Urchi takes it in both hands and does what that thing
 * makes it do, then sends it home. A forgery it will not take: it pushes it back.
 *
 * Each thing has its own ways (see WAYS): the lost glove waves while it is held, and waved at Urchi,
 * Urchi waves back; the micrometeorite near its face makes it cross-eyed, and thrown hard it burns up
 * in a streak and is back in its place; the frozen lightning shaken cracks and strikes, the page
 * flashing and Urchi startled; the magnet stone draws Urchi toward it, and what hangs in the sky;
 * the comet minnows, let go, school after the pointer, and scatter at a tap.
 */
export class Handling {
  private o: HandlingOptions;
  private out: Out | null = null;
  private t = 0;
  private streak: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private flash: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private flashAt = -Infinity;
  private burnt: { x: number; y: number; vx: number; vy: number; t0: number } | null = null;
  private pointer: Point | null = null;
  private pointerAt = -Infinity;
  private stopFrame: () => void;
  private stopAfter: () => void;
  private disposed = false;

  constructor(o: HandlingOptions) {
    this.o = o;
    const uS = { uHead: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(1, 0) }, uLen: { value: 1 }, uWidth: { value: 4 }, uCell: { value: 0 }, uStrength: { value: 0 } };
    this.streak = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: uS, vertexShader: flatVertex, fragmentShader: streakFragment, transparent: true, depthTest: false, depthWrite: false, ...ADD }));
    this.streak.renderOrder = 0.55;
    this.streak.frustumCulled = false;
    this.streak.visible = false;
    this.flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { uStrength: { value: 0 } }, vertexShader: flatVertex, fragmentShader: flashFragment, transparent: true, depthTest: false, depthWrite: false, ...ADD }));
    this.flash.renderOrder = 20;
    this.flash.frustumCulled = false;
    this.flash.visible = false;
    o.room.scene.add(this.streak, this.flash);
    this.stopFrame = o.room.onFrame((dt) => this.frame(dt));
    this.stopAfter = o.room.afterUrchi((dt) => this.draw(dt));
  }

  // ---------------------------------------------------------------- what the page asks

  /** Something is out of the sky. */
  get isOut() {
    return !!this.out;
  }

  /** Being held by the hand. */
  get holding() {
    return !!this.out?.held;
  }

  /** Given to Urchi, and it is still busy with it. */
  get giving() {
    return this.out?.mode === "given";
  }

  /** Whether a client point is on the thing out (not while Urchi has it). */
  hit(clientX: number, clientY: number) {
    const u = this.out;
    if (!u || u.mode === "given" || u.mode === "burn") return false;
    const p = this.o.room.toRoom(clientX, clientY);
    return u.sprite.hit(p.x, p.y, 10);
  }

  /** Whether the thing held is over Urchi now: let go, it is given to it. */
  get overUrchi() {
    const u = this.out;
    return !!u?.held && this.nearUrchi(u);
  }

  /** The pointer, client px (null: gone): the minnows school after it. */
  point(clientX: number | null, clientY = 0) {
    if (clientX === null) {
      this.pointer = null;
      return;
    }
    this.pointer = this.o.room.toWorld(clientX, clientY);
    this.pointerAt = this.t;
  }

  /** Takes a thing down out of the sky with the hand, at a client point, at `t` (performance.now() ms): whether it did. */
  take(id: string, clientX: number, clientY: number, t: number) {
    const o = this.o;
    if (this.out) this.home(this.out.id === id ? 0 : OUT.home);
    const lent = o.sky.lend(id);
    if (!lent) return false;
    const pan = o.room.pan;
    const u: Out = {
      id,
      forged: lent.forged,
      sprite: lent.sprite,
      x: lent.pose.x + pan.x,
      y: lent.pose.y + pan.y,
      vx: 0,
      vy: 0,
      from: lent.pose.size,
      t0: this.t,
      touched: this.t,
      turn: 0,
      held: null,
      mode: "loose",
      given: null,
      way: { sx: 0, sy: 0, turns: [] },
      last: {},
      scattered: -Infinity,
      wrongUntil: -Infinity,
    };
    u.sprite.mesh.renderOrder = 0.6;
    this.out = u;
    this.grab(clientX, clientY, t);
    o.tell(`You took down ${TEXT.get(id)?.name.toLowerCase() ?? "something"}.`);
    return true;
  }

  /** Holds the thing out with the hand at a client point (it is on it: see hit). */
  grab(clientX: number, clientY: number, t: number) {
    const u = this.out;
    if (!u || u.mode === "given" || u.mode === "burn") return false;
    const p = this.o.room.toWorld(clientX, clientY);
    u.held = { gx: p.x - u.x, gy: p.y - u.y, px: p.x, py: p.y, samples: [{ t, x: p.x, y: p.y }] };
    // (brought forward from the sky, the hand has it near its middle)
    if (this.t - u.t0 < OUT.grow) Object.assign(u.held, { gx: 0, gy: 0 });
    u.mode = "loose";
    u.touched = this.t;
    return true;
  }

  /** The hand moved to a client point at `t` (performance.now() ms). */
  drag(clientX: number, clientY: number, t: number) {
    const h = this.out?.held;
    if (!h) return;
    const p = this.o.room.toWorld(clientX, clientY);
    h.px = p.x;
    h.py = p.y;
    h.samples.push({ t, x: p.x, y: p.y });
    while (h.samples.length > 2 && t - h.samples[0].t > OUT.samples * 1000) h.samples.shift();
    this.point(clientX, clientY);
  }

  /** Let go at `t` (performance.now() ms): given, if it is over Urchi; else it keeps the hand's speed, or does what it does when thrown. */
  release(t: number) {
    const u = this.out, h = u?.held;
    if (!u || !h) return;
    const giving = this.nearUrchi(u);
    u.held = null;
    u.touched = this.t;
    const s = h.samples, last = s[s.length - 1], first = s[0];
    let vx = 0, vy = 0;
    if (!this.o.reducedMotion && last && first && t - last.t < OUT.samples * 1000 && last.t - first.t > 8) {
      const dt = (last.t - first.t) / 1000;
      vx = (last.x - first.x) / dt;
      vy = (last.y - first.y) / dt;
      const v = Math.hypot(vx, vy);
      if (v > OUT.fastest) {
        vx *= OUT.fastest / v;
        vy *= OUT.fastest / v;
      }
    }
    u.vx = vx;
    u.vy = vy;
    if (giving) {
      this.give();
      return;
    }
    const speed = Math.hypot(vx, vy);
    // thrown hard, the micrometeorite burns up
    if (u.id === "micrometeorite" && speed > SPECK.burn) {
      this.burn(u);
      return;
    }
    // let go, the minnows school after the pointer
    if (u.id === "comet-minnows") u.mode = "follow";
  }

  /** A tap on empty sky while the minnows are out: they scatter. Whether it was taken as that. */
  press(clientX: number, clientY: number) {
    const u = this.out;
    if (!u || u.id !== "comet-minnows" || u.mode !== "follow" || this.o.reducedMotion) return false;
    const p = this.o.room.toWorld(clientX, clientY), dx = u.x - p.x, dy = u.y - p.y, d = Math.hypot(dx, dy) || 1;
    u.vx = (dx / d) * SCHOOL.scatter;
    u.vy = (dy / d) * SCHOOL.scatter;
    u.scattered = this.t + SCHOOL.regroup;
    return true;
  }

  /** The keyboard's way (the case): a thing in the sky given to Urchi as if it had been handed over. */
  giveFromSky(id: string) {
    if (this.out) this.home(0);
    const lent = this.o.sky.lend(id);
    if (!lent) return false;
    const pan = this.o.room.pan, seen = this.o.room.float;
    this.out = {
      id,
      forged: lent.forged,
      sprite: lent.sprite,
      x: (seen?.x ?? lent.pose.x) + pan.x,
      y: (seen?.y ?? lent.pose.y) + pan.y,
      vx: 0,
      vy: 0,
      from: lent.pose.size,
      t0: this.t - OUT.grow,
      touched: this.t,
      turn: 0,
      held: null,
      mode: "loose",
      given: null,
      way: { sx: 0, sy: 0, turns: [] },
      last: {},
      scattered: -Infinity,
      wrongUntil: -Infinity,
    };
    this.out.sprite.mesh.renderOrder = 0.6;
    this.give();
    return true;
  }

  /** The float's state changed: gone home (or on its way), whatever is out goes back to its place at once. */
  floatChanged(floating: boolean) {
    if (!floating && this.out) this.home(-1);
  }

  // ---------------------------------------------------------------- going and giving

  /** Back to its place in the sky: flown there over `seconds` (0 at once; -1 simply there again, coming up in its place). */
  private home(seconds: number) {
    const u = this.out, o = this.o;
    if (!u) return;
    this.out = null;
    o.float.attract(null);
    o.sky.magnet(null);
    if (u.mode === "given") o.float.openHand();
    u.sprite.mesh.renderOrder = 0.6;
    o.sky.adopt(u.id, u.sprite, { ...u.sprite.placed }, seconds);
  }

  /** Near enough Urchi to be given to it: held, where the hand has it (it trails a little); loose, where it is. */
  private nearUrchi(u: Out) {
    const room = this.o.room, pan = room.pan, h = u.held, x = h ? h.px - h.gx : u.x, y = h ? h.py - h.gy : u.y;
    return room.nearUrchi(x - pan.x, y - pan.y, OUT.give * room.figureTall * room.zoom * 0.25);
  }

  /** Given to Urchi: it takes it (or, a forgery, pushes it back) and does what that thing makes it do. */
  private give() {
    const u = this.out, o = this.o;
    if (!u) return;
    const name = TEXT.get(u.id)?.name ?? "";
    if (u.forged) {
      // it will not have a forgery: a puzzled tilt, and back it goes to whoever made it
      o.att.play("lookAtCatch", 5, () => lookAtCatch(o.att, () => this.client(u), "forged", 1.6));
      const seen = o.room.float, dx = u.x - ((seen?.x ?? 0) + o.room.pan.x), dy = u.y - ((seen?.y ?? 0) + o.room.pan.y), d = Math.hypot(dx, dy) || 1;
      u.vx = (dx / d) * REFUSE.back;
      u.vy = (dy / d) * REFUSE.back;
      u.mode = "loose";
      o.say(fillLine(CATCH_LINES.forgedTitle, { name: name.toLowerCase() }), CATCH_LINES.forged, 3.5);
      return;
    }
    const plan = (WAYS[u.id]?.give ?? defaultGive)(this, u);
    if (!plan) {
      // (it cannot take anything now: held, asleep, busy) it drifts on
      u.mode = "loose";
      return;
    }
    const seen = { x: u.x - o.room.pan.x, y: u.y - o.room.pan.y };
    u.mode = "given";
    u.vx = u.vy = 0;
    u.given = { t0: this.t, steps: plan.steps, place: plan.place, carry: seen };
    o.tell(`Urchi takes ${name.toLowerCase()}.`);
  }

  /** Given back: the reaction over, it goes home, and Urchi watches it go. */
  finishGive() {
    const u = this.out, o = this.o;
    if (!u) return;
    o.float.openHand();
    const id = u.id;
    this.home(2.2);
    o.att.play("watchGo", 3, () => watchGo(o.att, () => o.sky.clientOf(id), 1.6));
  }

  /** The micrometeorite thrown hard: it burns up in a streak, and is back in its place. */
  private burn(u: Out) {
    const o = this.o;
    this.burnt = { x: u.x, y: u.y, vx: u.vx, vy: u.vy, t0: this.t };
    this.out = null;
    u.sprite.mesh.visible = false;
    o.sky.adopt(u.id, u.sprite, { ...u.sprite.placed }, -1);
    o.att.play("watchGo", 3, () => watchGo(o.att, () => this.burnClient(), SPECK.streak));
  }

  // ---------------------------------------------------------------- for the ways

  /** The things it holds on to, for WAYS. */
  get urchi() {
    return { att: this.o.att, float: this.o.float, room: this.o.room };
  }

  /** The clock (s). */
  get now() {
    return this.t;
  }

  /** Where a thing out is on the page (client px). */
  client(u: Out): Point {
    const r = this.o.room.canvas.getBoundingClientRect(), p = u.sprite.placed;
    return { x: r.left + r.width / 2 + p.x, y: r.top + r.height / 2 - p.y };
  }

  /** The page flashes (the lightning's strike), bright `strength`, over `seconds`. */
  flashPage() {
    if (this.o.reducedMotion) return;
    this.flashAt = this.t;
  }

  private burnClient(): Point | null {
    const b = this.burnt;
    if (!b) return null;
    const r = this.o.room.canvas.getBoundingClientRect(), pan = this.o.room.pan, k = this.t - b.t0;
    return { x: r.left + r.width / 2 + b.x + b.vx * k - pan.x, y: r.top + r.height / 2 - (b.y + b.vy * k - pan.y) };
  }

  // ---------------------------------------------------------------- frames

  private frame(dt: number) {
    if (this.disposed) return;
    this.t += dt;
    const u = this.out, o = this.o, room = o.room;
    if (!u) return;
    const tall = room.figureTall * room.zoom, reduced = o.reducedMotion;
    if (u.held) {
      // on the hand: a spring to it, lagging a little
      const h = u.held, tx = h.px - h.gx, ty = h.py - h.gy;
      if (reduced) {
        u.x = tx;
        u.y = ty;
      } else spring(u, tx, ty, OUT.hold.omega, OUT.hold.zeta, dt);
      u.touched = this.t;
      this.watchWay(u);
      WAYS[u.id]?.held?.(this, u, dt);
    } else if (u.mode === "follow") {
      // the minnows, schooling after the pointer (scattered a moment first, if a tap scattered them)
      const p = this.pointer;
      if (p && this.t >= u.scattered) {
        const dx = p.x - u.x, dy = p.y - u.y, d = Math.hypot(dx, dy) || 1, gx = p.x - (dx / d) * SCHOOL.behind, gy = p.y - (dy / d) * SCHOOL.behind;
        spring(u, gx, gy, SCHOOL.omega, SCHOOL.zeta, dt);
      } else {
        const k = Math.exp(-dt * OUT.drag);
        u.vx *= k;
        u.vy *= k;
        u.x += u.vx * dt;
        u.y += u.vy * dt;
      }
      u.turn = this.t < u.scattered ? Math.sin(this.t * 14) * 0.6 : Math.atan2(u.vy, u.vx) * 0.15;
      this.keepIn(u, tall);
      // the pointer gone a while, they go home
      if (this.t - this.pointerAt > SCHOOL.gone) this.home(OUT.home);
    } else if (u.mode === "loose") {
      const k = Math.exp(-dt * OUT.drag);
      u.vx *= k;
      u.vy *= k;
      u.x += u.vx * dt;
      u.y += u.vy * dt;
      this.keepIn(u, tall);
      WAYS[u.id]?.loose?.(this, u, dt);
      if (this.t - u.touched > OUT.idle) this.home(OUT.home);
    } else if (u.mode === "given" && u.given) {
      for (const s of u.given.steps) {
        if (s.done || this.t - u.given.t0 < s.at) continue;
        s.done = true;
        s.run();
        if (this.out !== u) return;
      }
      // it could not hold on to it (held, flung, gone to sleep): it drifts off
      if (!o.float.fetching && u.given.steps.some((s) => !s.done) && this.needsHands(u)) {
        u.mode = "loose";
        u.given = null;
      }
    }
    // the magnet stone, out: Urchi and what hangs in the sky are drawn toward it
    if (this.out?.id === "magnet-stone" && this.out.mode !== "given") {
      const m = this.out, seen = room.float;
      const d = seen ? Math.hypot(m.x - (seen.x + room.pan.x), m.y - (seen.y + room.pan.y)) / Math.max(1, tall) : Infinity;
      o.float.attract(d < MAGNET.reach ? { x: m.x, y: m.y } : null, MAGNET.pull * (1 - d / MAGNET.reach));
      o.sky.magnet({ x: m.x - room.pan.x, y: m.y - room.pan.y }, MAGNET.sky);
    } else {
      o.float.attract(null);
      o.sky.magnet(null);
    }
  }

  /** Given, and still wanting Urchi's hands for it (the minnows swim round its helmet with none). */
  private needsHands(u: Out) {
    return u.id !== "comet-minnows" && !(u.id === "magnet-stone" && this.t - (u.given?.t0 ?? 0) < MAGNET_STICK.peel);
  }

  /** The page's edges (where the view is) catch it, giving back a little of its speed. */
  private keepIn(u: Out, tall: number) {
    const room = this.o.room, pan = room.pan, r = Math.min(tall * 0.3, 80), W = room.width / 2 - OUT.wall - r, H = room.height / 2 - OUT.wall - r;
    const x = u.x - pan.x, y = u.y - pan.y;
    if (x < -W || x > W) {
      u.x = pan.x + clamp(x, -W, W);
      u.vx = -u.vx * OUT.bounce;
    }
    if (y < -H || y > H) {
      u.y = pan.y + clamp(y, -H, H);
      u.vy = -u.vy * OUT.bounce;
    }
  }

  /** The way it is moved across, held: each turn of it (faster than a shake's or a wave's least), for WAYS. */
  private watchWay(u: Out) {
    const w = u.way, sx = Math.sign(Math.round(u.vx / 60)), sy = Math.sign(Math.round(u.vy / 60));
    const fast = Math.hypot(u.vx, u.vy);
    if (sx && w.sx && sx !== w.sx && fast > WAVE.speed) w.turns.push(this.t);
    else if (sy && w.sy && sy !== w.sy && fast > SHAKE.speed) w.turns.push(this.t);
    if (sx) w.sx = sx;
    if (sy) w.sy = sy;
    while (w.turns.length && this.t - w.turns[0] > Math.max(WAVE.within, SHAKE.within)) w.turns.shift();
  }

  /** How many turns of its way across within `within` seconds (see watchWay). */
  turnsWithin(u: Out, within: number) {
    return u.way.turns.filter((t) => this.t - t <= within).length;
  }

  private draw(dt: number) {
    const o = this.o, room = o.room, pan = room.pan, grid = { x: room.renderer.domElement.width / Math.max(1, room.width), y: room.renderer.domElement.height / Math.max(1, room.height) };
    const stage = { width: room.width, height: room.height, grid };
    // the page's flash (the lightning)
    const fu = (this.t - this.flashAt) / SHAKE.flashFor;
    this.flash.visible = fu >= 0 && fu < 1;
    if (this.flash.visible) {
      this.flash.material.uniforms.uStrength.value = SHAKE.flash * (1 - smooth(fu));
      this.flash.scale.set(room.width, room.height, 1);
      this.flash.position.set(0, 0, 0);
    }
    // the micrometeorite burning up
    const b = this.burnt;
    if (b) {
      const k = this.t - b.t0, u = k / SPECK.streak, s = this.streak.material.uniforms, speed = Math.hypot(b.vx, b.vy) || 1;
      const hx = b.x + b.vx * k - pan.x, hy = b.y + b.vy * k - pan.y, len = Math.min(460, speed * 0.28) * (1 - 0.5 * u);
      this.streak.visible = u < 1;
      if (u >= 1) this.burnt = null;
      else {
        const c = Math.max(1, room.pixelCell);
        s.uHead.value.set((hx + room.width / 2) * grid.x, (hy + room.height / 2) * grid.y);
        s.uDir.value.set(b.vx / speed, b.vy / speed);
        s.uLen.value = len * grid.x;
        s.uWidth.value = 3.2 * grid.x;
        s.uCell.value = c;
        s.uStrength.value = 1 - smooth(u);
        this.streak.position.set(hx - (b.vx / speed) * len * 0.5, hy - (b.vy / speed) * len * 0.5, 0);
        this.streak.scale.set(len * 2 + 60, len * 2 + 60, 1);
      }
    }
    const u = this.out;
    if (!u) return;
    const tall = room.figureTall * room.zoom;
    const size = clamp(OUT.size * tall, OUT.min * Math.min(1, room.zoom), OUT.max);
    const grow = o.reducedMotion ? 1 : smooth((this.t - u.t0) / OUT.grow);
    let s = u.from + (size - u.from) * grow;
    let x = u.x - pan.x, y = u.y - pan.y;
    if (u.mode === "given" && u.given) {
      // where Urchi has it: brought there from where it was given over a moment
      const at = u.given.place(), k = o.reducedMotion ? 1 : smooth((this.t - u.given.t0) / 0.6), c = u.given.carry;
      if (at) {
        x = c.x + (at.x - c.x) * k;
        y = c.y + (at.y - c.y) * k;
      }
      s = size;
      u.x = x + pan.x;
      u.y = y + pan.y;
    }
    const cell = u.forged ? Math.max(room.pixelCell, Math.round((s * grid.x) / 12)) : Math.max(1, room.pixelCell);
    const wrong = u.forged ? 1 : this.t < u.wrongUntil ? 0.6 : 0;
    u.sprite.place({ x, y, size: s, cell, fade: 1, wrong, turn: u.turn });
    u.sprite.point(this.pointer ? { x: this.pointer.x - pan.x, y: this.pointer.y - pan.y } : null);
    u.sprite.frame(dt, o.reducedMotion);
    u.sprite.draw(room.renderer, stage);
  }

  dispose() {
    this.disposed = true;
    this.stopFrame();
    this.stopAfter();
    if (this.out) this.out.sprite.dispose();
    this.out = null;
    for (const m of [this.streak, this.flash]) {
      m.removeFromParent();
      m.geometry.dispose();
      m.material.dispose();
    }
  }
}

// ------------------------------------------------------------------ each thing's ways

/** What a thing does out of the sky: held (each frame), loose (each frame), and given (its reaction: where it is drawn, and its steps). */
type Ways = {
  held?(h: Handling, u: Out, dt: number): void;
  loose?(h: Handling, u: Out, dt: number): void;
  give?(h: Handling, u: Out): { place: () => Point | null; steps: Step[] } | null;
};

/** The magnet stone given: it sticks to Urchi's helmet (`at`, head space) until `peel` s, while it shakes its head; then a hand peels it off. */
const MAGNET_STICK = { at: [440, -60] as [number, number], peel: 2.6, shakes: [0.9, 1.5, 2.1] };

/** Given, as most things are: taken in both hands, looked at (`look` s), and sent home. */
function defaultGive(h: Handling, u: Out, look = 2.2, then?: Step[]) {
  const { float, att } = h.urchi;
  if (!float.receive(() => {})) return null;
  att.play("lookAtCatch", 5, () => lookAtCatch(att, () => h.client(u), "new", look));
  return { place: () => float.handAt(), steps: [...(then ?? []), { at: look + (then?.length ? 1.4 : 0.6), run: () => h.finishGive() }] };
}

const WAYS: Record<string, Ways> = {
  // the lost glove: it waves as it is held; waved at Urchi, Urchi waves back. Given, it holds it up
  // beside its own, looks at it, and a slow blink
  "lost-glove": {
    held(h, u) {
      u.turn = 0.35 * Math.sin(h.now * 7);
      const { float, room, att } = h.urchi, seen = room.float, tall = room.figureTall * room.zoom;
      if (!seen) return;
      const near = Math.hypot(u.x - room.pan.x - seen.x, u.y - room.pan.y - seen.y) < WAVE.near * tall;
      if (near && h.turnsWithin(u, WAVE.within) >= WAVE.turns && h.now - (u.last.wave ?? -Infinity) > WAVE.every && float.gesture("wave")) {
        u.last.wave = h.now;
        att.play("notice", 3, () => lookAtCatch(att, () => h.client(u), "new", 1.4));
      }
    },
    loose(h, u) {
      u.turn *= 0.95;
    },
    give(h, u) {
      const { float, att } = h.urchi;
      return defaultGive(h, u, 2.4, [
        { at: 0.9, run: () => float.raise() },
        { at: 2.2, run: () => att.ch.slowBlink() },
      ]);
    },
  },
  // the micrometeorite: near its face, cross-eyed. Given, it holds it right up by its visor and squints
  micrometeorite: {
    held(h, u) {
      const { room, att } = h.urchi, e = room.eyes(), tall = room.figureTall * room.zoom, p = u.sprite.placed;
      if (room.float && Math.hypot(p.x - e.x, p.y - e.y) < SPECK.near * tall && h.now - (u.last.cross ?? -Infinity) > SPECK.every && !att.acting) {
        u.last.cross = h.now;
        att.play("closeBy", 3, () => closeBy(att, () => h.client(u), () => {}));
      }
    },
    give(h, u) {
      const { float, att } = h.urchi;
      return defaultGive(h, u, 2.6, [
        {
          at: 0.8,
          run: () => {
            float.raise([520, 280, 320]);
            att.ch.converge(1);
            att.ch.setLids(0.45, 0.45, 0.25);
          },
        },
        {
          at: 2.8,
          run: () => {
            att.ch.converge(0);
            att.ch.setLids(0, 0, 0.3);
          },
        },
      ]);
    },
  },
  // the frozen lightning: shaken, it cracks and strikes, the page flashes and Urchi startles. Given, it
  // holds it out at arm's length and looks away
  "frozen-lightning": {
    held(h, u) {
      if (h.turnsWithin(u, SHAKE.within) < SHAKE.turns || h.now - (u.last.crack ?? -Infinity) < SHAKE.every) return;
      u.last.crack = h.now;
      u.wrongUntil = h.now + SHAKE.wrong;
      h.flashPage();
      const { float, att } = h.urchi, c = h.client(u);
      att.startle(c);
      att.play("notice", 3, () => lookAtCatch(att, () => h.client(u), "forged", 1.2));
      float.gesture("brace");
    },
    give(h, u) {
      const { float, att } = h.urchi;
      return defaultGive(h, u, 2.4, [
        {
          at: 0.8,
          run: () => {
            float.raise([900, 560, 200]);
            att.ch.glance();
          },
        },
      ]);
    },
  },
  // the magnet stone: given, it sticks to its helmet; it shakes its head, and a hand peels it off
  "magnet-stone": {
    give(h, u) {
      const { float, att, room } = h.urchi;
      const side = u.x - room.pan.x < (room.float?.x ?? 0) ? -1 : 1;
      const helmet = () => (room.float ? room.onFigure(side * MAGNET_STICK.at[0], MAGNET_STICK.at[1]) : null);
      let place: () => Point | null = helmet;
      const steps: Step[] = MAGNET_STICK.shakes.map((at, i) => ({ at, run: () => att.ch.tiltToward(i % 2 ? side : -side, 14) }));
      steps.push({
        at: MAGNET_STICK.peel,
        run: () => {
          if (!float.receive(() => {})) return;
          float.raise([560, 120, 220]);
          place = () => float.handAt();
        },
      });
      steps.push({ at: MAGNET_STICK.peel + 1.2, run: () => h.finishGive() });
      att.play("notice", 3, () => lookAtCatch(att, () => h.client(u), "forged", 2.2));
      return { place: () => place(), steps };
    },
  },
  // the comet minnows: given, they swim round its helmet a while, its eyes going round after them
  "comet-minnows": {
    give(h, u) {
      const { room, att } = h.urchi, t0 = h.now;
      const place = () => {
        const e = room.eyes(), r = SCHOOL.round * room.figureTall * room.zoom, a = (h.now - t0) * SCHOOL.turns;
        return room.float ? { x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r * 0.8 } : null;
      };
      att.play("watchGo", 3, () => watchGo(att, () => h.client(u), SCHOOL.for));
      return { place, steps: [{ at: SCHOOL.for, run: () => h.finishGive() }] };
    },
  },
};
