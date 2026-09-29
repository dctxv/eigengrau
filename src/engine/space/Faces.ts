import type { UrchiFace } from "@/engine/urchi/character";
import type { Attention } from "@/engine/urchi/attention";
import { SLEEP_ROLL } from "@/engine/urchi/attention";
import { Marks } from "./Marks";
import type { RoomScene } from "./RoomScene";

/** A face it makes for a moment, over whatever else it is doing. */
export type Reaction = "angry" | "embarrassed";

/**
 * How long each lasts (s), and how long before it can happen again: a glare or a fluster is a
 * moment, and one that came every few seconds would read as a twitch.
 */
const REACT: Record<Reaction, { hold: number; again: number }> = { angry: { hold: 2.2, again: 45 }, embarrassed: { hold: 1.8, again: 20 } };
/**
 * Listening, it shuts its eyes (happy) for `shut` seconds at a time and opens them for `open`
 * (drawn each time between the two), starting open, so it still looks about between songs' worth.
 */
const LISTEN = { shut: [10, 20] as [number, number], open: [6, 12] as [number, number], first: [3, 6] as [number, number] };
/** Handled roughly afloat: this many hard tugs or bumps within `within` seconds makes it cross. */
const ROUGH = { count: 3, within: 8 };
/**
 * The pointer shaken over its face at home: `turns` changes of direction, each after a run of at
 * least `run` px, within `within` seconds.
 */
const SHAKE = { turns: 4, run: 14, within: 1.2 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Urchi's faces (Space): which one it makes, and when. Its own face, unless something happens:
 * woken for the night by a click, the pointer shaken over its face, thrown about on its line or its
 * line snapped (angry, a glare); caught in the act, or a hard bump against a wall afloat
 * (embarrassed, "><"). While he plays music and it is awake it shuts its eyes, arched up (happy),
 * for a while at a time, notes rising from its ears; asleep for the night its head tips to one
 * side and Zs rise from the ear that is up (see Marks). The page tells it what happens; it sets the
 * face (the painter blinks into it) and the marks, a frame at a time.
 */
export class Faces {
  private room: RoomScene;
  private att: Attention;
  private marks: Marks;
  private t = 0;
  private reaction: { kind: Reaction; from: number; until: number } | null = null;
  private lastAt: Record<Reaction, number> = { angry: -Infinity, embarrassed: -Infinity };
  /** Listening: the eyes shut (happy) or open, until when. */
  private listen = { on: false, shut: false, until: 0 };
  private jolts: number[] = [];
  /** Its eyes are its own (after the intro, or on arrival): until then it makes no faces. */
  private begun = false;
  private shake = { x: NaN, dir: 0, run: 0, turns: [] as number[] };
  private stop: () => void;

  constructor(room: RoomScene, att: Attention, o: { reducedMotion: boolean }) {
    this.room = room;
    this.att = att;
    this.marks = new Marks(room, o);
    this.stop = room.onFrame((dt) => this.frame(dt));
  }

  /** Its eyes are its own now (the page's begin): faces from here on. */
  begin() {
    this.begun = true;
  }

  /**
   * A face for a moment, `delay` seconds from now, held `hold` seconds (its own by default); not
   * again within its `again`. Returns whether it will.
   */
  react(kind: Reaction, o: { delay?: number; hold?: number } = {}) {
    const from = this.t + (o.delay ?? 0);
    if (from - this.lastAt[kind] < REACT[kind].again) return false;
    // a glare outranks a fluster already under way; otherwise the one under way stands
    const r = this.reaction;
    if (r && this.t < r.until && !(kind === "angry" && r.kind === "embarrassed")) return false;
    this.lastAt[kind] = from;
    this.reaction = { kind, from, until: from + (o.hold ?? REACT[kind].hold) };
    return true;
  }

  /** Afloat, handled roughly (see Float's onJolt): enough of it makes it cross; one hard bump flusters it. */
  jolt(kind: "tug" | "bump") {
    const t = this.t;
    this.jolts = this.jolts.filter((j) => t - j < ROUGH.within);
    this.jolts.push(t);
    if (this.jolts.length >= ROUGH.count) {
      this.jolts = [];
      this.react("angry");
    } else if (kind === "bump") this.react("embarrassed");
  }

  /** The pointer at client x, and whether it is over its face at home (awake, going nowhere): shaken there, it glares. */
  pointer(x: number, over: boolean) {
    const k = this.shake;
    if (!over) {
      k.x = NaN;
      k.dir = 0;
      k.run = 0;
      k.turns = [];
      return;
    }
    if (Number.isNaN(k.x)) {
      k.x = x;
      return;
    }
    const dx = x - k.x;
    k.x = x;
    if (!dx) return;
    const dir = Math.sign(dx);
    if (dir === k.dir) k.run += Math.abs(dx);
    else {
      // a turn counts once the run before it was long enough
      if (k.dir && k.run >= SHAKE.run) k.turns.push(this.t);
      k.dir = dir;
      k.run = Math.abs(dx);
    }
    k.turns = k.turns.filter((t) => this.t - t < SHAKE.within);
    if (k.turns.length >= SHAKE.turns) {
      k.turns = [];
      this.react("angry");
    }
  }

  /** The face it makes now, and what rises from it. */
  private frame(dt: number) {
    this.t += dt;
    if (!this.begun) return;
    const att = this.att, ch = this.room.urchi.character, t = this.t;
    const r = this.reaction && t >= this.reaction.from && t < this.reaction.until ? this.reaction : null;
    if (this.reaction && t >= this.reaction.until) this.reaction = null;
    // listening, awake and free: eyes shut a while, open a while
    const listening = att.listening && att.mood === "awake";
    const L = this.listen;
    if (listening !== L.on) {
      L.on = listening;
      L.shut = false;
      L.until = t + rand(...LISTEN.first);
    } else if (listening && t >= L.until) {
      L.shut = !L.shut;
      L.until = t + rand(...(L.shut ? LISTEN.shut : LISTEN.open));
    }
    const happy = listening && L.shut && !att.acting && !r;
    const face: UrchiFace = r ? r.kind : happy ? "happy" : "neutral";
    if (ch.face !== face) ch.setFace(face);
    // what rises from it: notes while the happy eyes are shut, Zs asleep for the night (at home)
    this.marks.notes(happy && ch.face === "happy" && ch.shut < 0.5);
    const side = att.sleepSide;
    this.marks.zs(att.mood === "asleep" && !att.acting && ch.shut > 0.9, side > 0 ? 0 : 1, SLEEP_ROLL * side);
  }

  dispose() {
    this.stop();
    this.marks.dispose();
  }
}
