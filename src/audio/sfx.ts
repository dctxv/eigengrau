/**
 * Sound (spec 11). Two sampled files in public/audio: a click for opening a
 * project and an ambient bed that loops with a crossfade at the seam. The
 * other cues are synthesised. Music adds a third voice: a song's preview heard
 * through the wall, with the bed ducking under it. Once its door has opened
 * the song stays in Music's room when the visitor leaves, and plays on to its
 * end, heard through the other tabs' walls. Off by default, remembered in
 * localStorage; nothing is fetched until sound is turned on.
 */
type Name = "click" | "tab" | "slide" | "focus" | "close" | "tick" | "done";
type Synth = Exclude<Name, "click">;

import gsap from "gsap";
import { setFlag } from "@/lib/flags";
import { EASE } from "@/lib/motion";
import { TAB_ORDER, tabIndex } from "@/lib/routes";
import { onWhere, whereNow, type Where } from "@/lib/where";

const STORAGE_KEY = "eigengrau:sound";
const TICK_THROTTLE_MS = 40;
const CLICK_URL = "/audio/click.wav";
const AMBIENT_URL = "/audio/ambient.mp3";
const AMBIENT_LEVEL = 0.12; // the bed sits about 18 dB under the cues
const AMBIENT_FADE_IN = 2;
const AMBIENT_FADE_OUT = 0.8;
const AMBIENT_XFADE = 4; // seconds of overlap at the loop seam

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
/** The bed's own level under the master, so a preview can duck it without touching its fades. */
let bed: GainNode | null = null;
/**
 * The bed's air: a lowpass after the bed's level, so the bed can go through a
 * wall without touching its fades or its ducking (see `sfx.air`). At rest it
 * sits at half the sample rate, where the filter passes everything untouched.
 */
let air: BiquadFilterNode | null = null;
/** Any frequency at or above half the sample rate opens the bed's air fully: `sfx.air(AIR_OPEN, over)`. */
export const AIR_OPEN = Number.POSITIVE_INFINITY;
/** What the air was last asked for, so a context made later starts there. */
let airHz = AIR_OPEN;
/** A Butterworth lowpass (a lowpass's Q is in dB): no bump at the cutoff, only the wall. */
const AIR_Q = -3.0103;
const airAt = (c: BaseAudioContext, hz: number) => Math.min(c.sampleRate / 2, Math.max(20, hz));
const buffers = new Map<Name, AudioBuffer>();
let clickBytes: Promise<ArrayBuffer> | null = null;
let clickDecoding = false;
let clickQueued = false;
let enabled = false;
let lastTick = 0;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(on: boolean) => void>();

/**
 * The counter's chime is D then A (587.33 and 880 Hz), both in the ambient
 * bed's F G A C D; the E it used to open on rubbed against the bed's F.
 */
function synth(c: AudioContext, name: Synth): AudioBuffer {
  const sr = c.sampleRate;
  const specs: Record<Synth, { dur: number; gen: (t: number, i: number) => number }> = {
    tab: { dur: 0.05, gen: (t) => (Math.random() * 2 - 1) * Math.exp(-t * 140) * 0.5 + Math.sin(t * 2 * Math.PI * 1400) * Math.exp(-t * 90) * 0.4 },
    slide: { dur: 0.32, gen: (t) => (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / 0.32)) ** 2 * 0.18 },
    focus: { dur: 0.12, gen: (t) => Math.sin(t * 2 * Math.PI * 180) * Math.exp(-t * 28) * 0.5 + (Math.random() * 2 - 1) * Math.exp(-t * 220) * 0.3 },
    close: { dur: 0.09, gen: (t) => Math.sin(t * 2 * Math.PI * 140) * Math.exp(-t * 40) * 0.4 + (Math.random() * 2 - 1) * Math.exp(-t * 260) * 0.2 },
    tick: { dur: 0.012, gen: (t) => Math.sin(t * 2 * Math.PI * 2100) * Math.exp(-t * 500) * 0.35 },
    done: { dur: 0.3, gen: (t) => (Math.sin(t * 2 * Math.PI * 587.33) * Math.exp(-t * 14) + Math.sin(Math.max(0, t - 0.09) * 2 * Math.PI * 880) * Math.exp(-Math.max(0, t - 0.09) * 12) * (t > 0.09 ? 1 : 0)) * 0.22 },
  };
  const { dur, gen } = specs[name];
  const n = Math.ceil(sr * dur);
  const buf = c.createBuffer(1, n, sr);
  const data = buf.getChannelData(0);
  // One-pole lowpass keeps the noise soft.
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const s = gen(t, i);
    lp += (s - lp) * 0.35;
    data[i] = lp;
  }
  return buf;
}

// ---------------------------------------------------------------- the click

/** The bytes need no context, so they can be fetched before the first gesture. */
function fetchClick() {
  clickBytes ??= fetch(CLICK_URL).then((r) => {
    if (!r.ok) throw new Error(`${CLICK_URL}: ${r.status}`);
    return r.arrayBuffer();
  });
  return clickBytes;
}

function decodeClick(c: AudioContext) {
  if (buffers.has("click") || clickDecoding) return;
  clickDecoding = true;
  fetchClick()
    .then((bytes) => c.decodeAudioData(bytes.slice(0))) // decoding may detach the buffer; keep the cached copy intact
    .then((buf) => {
      buffers.set("click", buf);
      // The selection that turned sound on still gets its click, a beat late.
      if (clickQueued) sfx.play("click");
    })
    .catch(() => {
      clickBytes = null;
    })
    .finally(() => {
      clickDecoding = false;
      clickQueued = false;
    });
}

// ---------------------------------------------------------------- the ambient bed

type Deck = { el: HTMLAudioElement; gain: GainNode };
type Ambient = { bus: GainNode; decks: [Deck, Deck]; current: 0 | 1; switching: boolean };
let ambient: Ambient | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

/** Equal-power curve, so the seam neither dips nor swells. */
const XFADE_STEPS = 64;
const fadeOut = new Float32Array(XFADE_STEPS).map((_, i) => Math.cos((i / (XFADE_STEPS - 1)) * Math.PI * 0.5));
const fadeIn = new Float32Array(XFADE_STEPS).map((_, i) => Math.sin((i / (XFADE_STEPS - 1)) * Math.PI * 0.5));

/**
 * Two <audio> elements share one file and take turns: when the playing one
 * nears its end the other starts from zero and the two are crossfaded. The
 * file streams, so a five-minute loop costs no decoded memory, and the overlap
 * hides the gap that a plain `loop` would leave at the seam.
 */
function ambientEnsure(c: AudioContext): Ambient {
  if (ambient) return ambient;
  const bus = c.createGain();
  bus.gain.value = 0;
  bus.connect(bed!);
  const deck = (i: 0 | 1): Deck => {
    const el = document.createElement("audio");
    el.src = AMBIENT_URL;
    el.preload = "auto";
    el.loop = false;
    el.hidden = true;
    el.dataset.ambient = String(i);
    document.body.append(el); // in the document so the browser's audio indicator and devtools see it
    const gain = c.createGain();
    gain.gain.value = 0;
    c.createMediaElementSource(el).connect(gain).connect(bus);
    el.addEventListener("timeupdate", () => {
      const a = ambient;
      if (!a || !enabled || a.current !== i || a.switching) return;
      if (!Number.isFinite(el.duration) || el.duration - el.currentTime > AMBIENT_XFADE) return;
      crossTo(i === 0 ? 1 : 0);
    });
    return { el, gain };
  };
  ambient = { bus, decks: [deck(0), deck(1)], current: 0, switching: false };
  document.addEventListener("visibilitychange", () => {
    const a = ambient;
    if (!a) return;
    if (document.visibilityState === "hidden") {
      a.decks.forEach((d) => d.el.pause());
      hush(QUICK_CLOSE);
    } else if (enabled) void a.decks[a.current].el.play().catch(() => undefined);
  });
  return ambient;
}

function crossTo(next: 0 | 1) {
  const a = ambient;
  const c = ctx;
  if (!a || !c) return;
  const from = a.decks[a.current];
  const to = a.decks[next];
  a.switching = true;
  to.el.currentTime = 0;
  void to.el.play().catch(() => undefined);
  const t = c.currentTime;
  to.gain.gain.cancelScheduledValues(t);
  to.gain.gain.setValueCurveAtTime(fadeIn, t, AMBIENT_XFADE);
  from.gain.gain.cancelScheduledValues(t);
  from.gain.gain.setValueCurveAtTime(fadeOut, t, AMBIENT_XFADE);
  a.current = next;
  window.setTimeout(() => {
    from.el.pause();
    from.el.currentTime = 0;
    a.switching = false;
  }, AMBIENT_XFADE * 1000 + 50);
}

function ambientStart() {
  const c = ensure();
  if (!c) return;
  const a = ambientEnsure(c);
  if (stopTimer) clearTimeout(stopTimer);
  const t = c.currentTime;
  const cur = a.decks[a.current];
  const other = a.decks[a.current === 0 ? 1 : 0];
  if (!a.switching) cur.gain.gain.setValueAtTime(1, t);
  void cur.el.play().catch(() => undefined);
  // Called inside a gesture: a silent play/pause unlocks the second element on iOS.
  if (other.el.paused && !a.switching) void other.el.play().then(() => other.el.pause()).catch(() => undefined);
  a.bus.gain.cancelScheduledValues(t);
  a.bus.gain.setValueAtTime(a.bus.gain.value, t);
  a.bus.gain.linearRampToValueAtTime(AMBIENT_LEVEL, t + AMBIENT_FADE_IN);
}

function ambientStop() {
  const a = ambient;
  const c = ctx;
  if (!a || !c) return;
  const t = c.currentTime;
  a.bus.gain.cancelScheduledValues(t);
  a.bus.gain.setValueAtTime(a.bus.gain.value, t);
  a.bus.gain.linearRampToValueAtTime(0, t + AMBIENT_FADE_OUT);
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    if (!enabled) a.decks.forEach((d) => d.el.pause());
  }, AMBIENT_FADE_OUT * 1000 + 50);
}

// ---------------------------------------------------------------- the next room

/**
 * A song's preview, heard as if from the next room. It starts behind the
 * wall: a lowpass at 700 Hz, about -16 dB, with a little of the room on it,
 * while the bed ducks 6 dB. Keep resting on it and the door opens: over 3s
 * the filter opens to 12 kHz, the song rises to about -6 dB and the bed sits
 * 10 dB down. Leave and the door closes over 1.2s and the song fades back
 * into the bed.
 */
const WALL_HZ = 700;
const OPEN_HZ = 12000;
const WALL_LEVEL = 0.16; // about -16 dB
const OPEN_LEVEL = 0.5; // about -6 dB
const ROOM_WET = { wall: 0.45, open: 0.06 };
const BED_DUCK = { wall: 0.5, open: 0.32 }; // -6 dB, then -10 dB
/**
 * The door's clock, in seconds. Exported because the Music room's colour keeps
 * the same one: muffled sound, muted colour; the door opens, the colour opens.
 */
export const WALL_IN = 0.6; // the song fades up behind the wall
export const DOOR_WAIT = 1.2; // then waits there this long before the door starts to open
export const DOOR_OPEN = 3;
export const DOOR_CLOSE = 1.2;
/** Come back to Music while its song plays on and the door reopens over this long; the page hears of it through `Preview.back`. */
const REOPEN = 1.5;
const QUICK_CLOSE = 0.3; // sound turned off, or the tab hidden
const WAKE_WAIT_MS = 300;

/** The room the song lives in. */
const HOME = "/music";
/**
 * The song heard from the other rooms, by how many lie between (Notes and
 * About are next door, Projects two along, Space three): its lowpass, its
 * level, how far it leans toward Music's side, and how far the bed ducks
 * under it. Next door is the wall itself.
 */
const AWAY = [
  { hz: WALL_HZ, level: WALL_LEVEL, pan: 0.3, bed: BED_DUCK.wall }, // -16 dB, the bed -6 dB
  { hz: 420, level: 0.079, pan: 0.45, bed: 0.63 }, // -22 dB, the bed -4 dB
  { hz: 260, level: 0.04, pan: 0.6, bed: 0.79 }, // -28 dB, the bed -2 dB
] as const;
/** A jump between rooms (reduced motion, a slide cut short): quick, but not a click. */
const JUMP = 0.3;
/** Too close to its stop to call it back (s): the audio thread may already have it. */
const UNSTOP = 0.03;

/**
 * What the Music page gets back: how long the song runs, where it lives on
 * Apple Music, when its first sample reaches the speakers (performance.now()
 * ms, a little after the promise resolves), and how to leave.
 */
export type Preview = {
  duration: number;
  link: string | null;
  heardAt: number;
  ended: Promise<void>;
  /**
   * Closes the door over 1.2s. Once the visitor has left Music's room the
   * song is no longer the page's to stop: only its end, sound turned off or
   * a hidden tab ends it.
   */
  stop: () => void;
  /** Whether it still plays on: not closing, not ended. */
  readonly sounding: boolean;
  /**
   * The door's last reopening as the visitor came back to Music: when it
   * starts (performance.now() ms, perhaps a little ahead) and how long it
   * takes (s). Null until then.
   */
  readonly back: { at: number; over: number } | null;
};

type Voice = {
  src: AudioBufferSourceNode;
  lp: BiquadFilterNode;
  level: GainNode;
  wet: GainNode;
  pan: StereoPannerNode | null;
  /** Context times: when the door starts to open, and when the song ends. */
  doorAt: number;
  end: number;
  /** When hush began to close the door and when the song is due to stop (context time); null while it plays on. */
  hushedAt: number | null;
  stopAt: number | null;
  /** The tab the visitor is in, and how many rooms lie between it and Music: 0 in the room. */
  tab: string;
  away: number;
  back: Preview["back"];
};
/** The song sounding, open or closing; a newer one takes its place. */
let voice: Voice | null = null;
let roomIr: AudioBuffer | null = null;

/** Most of a second of soft decaying noise: the next room's walls, heard through them. */
function roomTone(c: AudioContext): AudioBuffer {
  if (roomIr && roomIr.sampleRate === c.sampleRate) return roomIr;
  const n = Math.ceil(c.sampleRate * 0.9);
  const buf = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      lp += (Math.random() * 2 - 1 - lp) * 0.2;
      d[i] = lp * Math.exp((-i / c.sampleRate) * 5);
    }
  }
  return (roomIr = buf);
}

/**
 * When a sound scheduled at context time `t` is heard, on performance.now()'s
 * clock: the output timestamp maps one clock onto the other, and the output
 * latency stands in where there is none yet.
 */
function heardAt(c: AudioContext, t: number): number {
  const out = typeof c.getOutputTimestamp === "function" ? c.getOutputTimestamp() : null;
  if (out?.performanceTime && out.contextTime !== undefined) return out.performanceTime + (t - out.contextTime) * 1000;
  return performance.now() + ((c.outputLatency || 0) + (c.baseLatency || 0)) * 1000;
}

/**
 * Holds a param where it is at `t` (now), dropping whatever was scheduled
 * after, so a new move starts from there. The value is set again at `t`
 * even where the browser can hold it: with nothing in flight at `t` there is
 * nothing to hold, and a ramp would start from the last event, however long
 * ago, and leap.
 */
function hold(p: AudioParam, t: number) {
  const v = p.value;
  if (typeof p.cancelAndHoldAtTime === "function") p.cancelAndHoldAtTime(t);
  else p.cancelScheduledValues(t);
  p.setValueAtTime(v, t);
}

/** Straight steps a glide is drawn in: a value curve would be shorter, but not every browser can cut one short. */
const STEPS = 16;
const linear = (k: number) => k;
/** The slide's own ease, so the song moves as the page does. */
let slideEase: ((k: number) => number) | null = null;

/**
 * Moves a param from wherever it is at context time `now` to `to`: still until
 * `at`, then over `over` seconds along `ease`. `log` moves it on a log scale,
 * as the ear hears a filter's frequency.
 */
function glide(p: AudioParam, to: number, now: number, at: number, over: number, ease: (k: number) => number, log = false) {
  hold(p, now);
  const from = log ? Math.max(1, p.value) : p.value;
  if (at > now) p.setValueAtTime(from, at);
  if (over <= 0) {
    p.setValueAtTime(to, at);
    return;
  }
  for (let i = 1; i <= STEPS; i++) {
    const k = ease(i / STEPS);
    p.linearRampToValueAtTime(log ? from * (to / from) ** k : from + (to - from) * k, at + (over * i) / STEPS);
  }
}

/** The tab a route belongs to: a case page is in Projects; anything else outside the tabs (Threshold) is off Space. */
function tabOf(path: string): string {
  return TAB_ORDER.find((t) => t !== "/" && (path === t || path.startsWith(`${t}/`))) ?? "/";
}

/** How many rooms lie between `path` and Music's. */
const roomsAway = (path: string) => Math.abs(tabIndex(tabOf(path)) - tabIndex(HOME));

/** Whether the visitor is in Music's room (or Shell has not yet said where they are). */
function atHome() {
  const w = whereNow();
  return !w || roomsAway(w.path) === 0;
}

/**
 * Moves the bed's duck to `level` along with the song, and brings it back to
 * full as the song ends; a move that would outlast the song just lets the bed
 * back up by the end.
 */
function bedTo(v: Voice, level: number, now: number, at: number, over: number, ease: (k: number) => number) {
  if (!bed) return;
  if (at + over >= v.end - 1) {
    hold(bed.gain, now);
    bed.gain.linearRampToValueAtTime(1, Math.max(v.end, now + 0.05));
    return;
  }
  glide(bed.gain, level, now, at, over, ease);
  bed.gain.setValueAtTime(level, v.end - 1);
  bed.gain.linearRampToValueAtTime(1, v.end);
}

/** Closes the door on the song playing, if any, over `over` seconds; the bed comes back as it goes. A close already sooner stands. */
function hush(over = DOOR_CLOSE) {
  const v = voice;
  const c = ctx;
  if (!v || !c) return;
  const t = c.currentTime;
  const stopAt = t + over + 0.05;
  if (v.stopAt !== null && v.stopAt <= stopAt) return;
  v.hushedAt ??= t;
  v.stopAt = stopAt;
  [v.lp.frequency, v.level.gain, v.wet.gain].forEach((p) => hold(p, t));
  v.lp.frequency.exponentialRampToValueAtTime(Math.min(WALL_HZ, Math.max(1, v.lp.frequency.value)), t + over);
  v.level.gain.linearRampToValueAtTime(0, t + over);
  if (bed) {
    hold(bed.gain, t);
    bed.gain.linearRampToValueAtTime(1, t + over);
  }
  try {
    v.src.stop(stopAt);
  } catch {
    /* already stopped */
  }
}

/**
 * The visitor moved between rooms. A song whose door has opened stays in
 * Music's room and plays on to its end, heard from wherever they are: through
 * more walls the further they go, from Music's side, and moving over the
 * slide's second along the slide's own ease, so walking away sounds like
 * walking away. A door still closing (the pointer left the title for the tab
 * bar) turns into the distance instead, if the song has not stopped yet. Come
 * back while it plays and the door reopens over 1.5s. A song still behind the
 * wall when the visitor leaves closes as it always has.
 */
function walk(w: Where) {
  const v = voice;
  const c = ctx;
  if (!v || !c) return;
  // Notes and About are both next door, but on either side: a walk between them still moves the song across.
  const tab = tabOf(w.path);
  if (tab === v.tab) return;
  const away = roomsAway(tab);
  const now = c.currentTime;
  if (v.away === 0) {
    if ((v.hushedAt ?? now) < v.doorAt) {
      hush();
      return;
    }
    if (v.stopAt !== null) {
      if (now > v.stopAt - UNSTOP) return;
      try {
        v.src.stop(v.end); // the last stop called is the one that counts
      } catch {
        return;
      }
      v.stopAt = null;
      v.hushedAt = null;
    }
  } else if (v.stopAt !== null) return; // closing for good: sound off, or the tab hidden
  v.tab = tab;
  v.away = away;
  const at = now + Math.max(0, (w.at - performance.now()) / 1000);
  if (!away) {
    glide(v.lp.frequency, OPEN_HZ, now, at, REOPEN, linear, true);
    glide(v.level.gain, OPEN_LEVEL, now, at, REOPEN, linear);
    glide(v.wet.gain, ROOM_WET.open, now, at, REOPEN, linear);
    if (v.pan) glide(v.pan.pan, 0, now, at, REOPEN, linear);
    bedTo(v, BED_DUCK.open, now, at, REOPEN, linear);
    v.back = { at: heardAt(c, at), over: REOPEN };
    return;
  }
  const room = AWAY[Math.min(away, AWAY.length) - 1];
  const side = tabIndex(tab) > tabIndex(HOME) ? -1 : 1; // About is to Music's right, so the song comes from the left
  const over = w.over > 0 ? w.over / 1000 : JUMP;
  const ease = w.over > 0 ? (slideEase ??= gsap.parseEase(EASE.slide)) : linear;
  glide(v.lp.frequency, room.hz, now, at, over, ease, true);
  glide(v.level.gain, room.level, now, at, over, ease);
  glide(v.wet.gain, ROOM_WET.wall, now, at, over, ease);
  if (v.pan) glide(v.pan.pan, side * room.pan, now, at, over, ease);
  bedTo(v, room.bed, now, at, over, ease);
}
onWhere(walk);

/**
 * Fetches, decodes and plays a preview behind the wall, scheduling the door
 * to open while nobody calls stop. Hover is not a gesture, so a context that
 * has never been woken stays silent: better silence than a line pretending.
 * Only in Music's room: a preview that arrives after the visitor has left
 * plays nothing.
 */
async function listen(url: string, signal?: AbortSignal): Promise<Preview | null> {
  if (!enabled || !atHome()) return null;
  const c = ensure();
  if (!c || !master || !bed) return null;
  const running = () => c.state === "running";
  if (!running()) {
    await Promise.race([c.resume().catch(() => undefined), new Promise((r) => setTimeout(r, WAKE_WAIT_MS))]);
    if (!running()) return null;
  }
  let link: string | null;
  let buffer: AudioBuffer;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    link = res.headers.get("x-preview-link");
    buffer = await c.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
  if (signal?.aborted || !enabled || !atHome()) return null;
  hush();

  const src = c.createBufferSource();
  src.buffer = buffer;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.5;
  const level = c.createGain();
  const wet = c.createGain();
  const walls = c.createConvolver();
  walls.buffer = roomTone(c);
  // The song's own end, apart from the door and the distance, so neither has to redraw it.
  const fade = c.createGain();
  const pan = typeof c.createStereoPanner === "function" ? c.createStereoPanner() : null;
  src.connect(lp).connect(level);
  lp.connect(walls).connect(wet).connect(level);
  const out = level.connect(fade);
  (pan ? out.connect(pan) : out).connect(master);

  // Behind the wall, then the door, then the song's own end; a short file just ends sooner.
  const t = c.currentTime;
  const end = t + buffer.duration;
  const doorAt = Math.min(t + WALL_IN + DOOR_WAIT, end);
  const openAt = Math.min(doorAt + DOOR_OPEN, end);
  const tail = Math.max(openAt, end - 1);
  lp.frequency.setValueAtTime(WALL_HZ, t);
  lp.frequency.setValueAtTime(WALL_HZ, doorAt);
  lp.frequency.exponentialRampToValueAtTime(OPEN_HZ, openAt);
  level.gain.setValueAtTime(0, t);
  level.gain.linearRampToValueAtTime(WALL_LEVEL, Math.min(t + WALL_IN, end));
  level.gain.setValueAtTime(WALL_LEVEL, doorAt);
  level.gain.linearRampToValueAtTime(OPEN_LEVEL, openAt);
  fade.gain.setValueAtTime(1, tail);
  fade.gain.linearRampToValueAtTime(0, end);
  wet.gain.setValueAtTime(ROOM_WET.wall, t);
  wet.gain.setValueAtTime(ROOM_WET.wall, doorAt);
  wet.gain.linearRampToValueAtTime(ROOM_WET.open, openAt);
  hold(bed.gain, t);
  bed.gain.linearRampToValueAtTime(BED_DUCK.wall, Math.min(t + WALL_IN, end));
  bed.gain.setValueAtTime(BED_DUCK.wall, doorAt);
  bed.gain.linearRampToValueAtTime(BED_DUCK.open, openAt);
  bed.gain.setValueAtTime(BED_DUCK.open, tail);
  bed.gain.linearRampToValueAtTime(1, end);

  const v: Voice = { src, lp, level, wet, pan, doorAt, end, hushedAt: null, stopAt: null, tab: HOME, away: 0, back: null };
  const ended = new Promise<void>((resolve) => {
    src.onended = () => {
      [src, lp, level, wet, walls, fade, pan].forEach((n) => n?.disconnect());
      if (voice === v) voice = null;
      resolve();
    };
  });
  src.start(t);
  voice = v;
  return {
    duration: buffer.duration,
    link,
    heardAt: heardAt(c, t),
    ended,
    stop: () => {
      if (voice === v && v.away === 0) hush();
    },
    get sounding() {
      return voice === v && v.stopAt === null;
    },
    get back() {
      return v.back;
    },
  };
}

// ---------------------------------------------------------------- context

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    bed = ctx.createGain();
    air = ctx.createBiquadFilter();
    air.type = "lowpass";
    air.Q.value = AIR_Q;
    air.frequency.value = airAt(ctx, airHz);
    bed.connect(air).connect(master);
    (["tab", "slide", "focus", "close", "tick", "done"] as Synth[]).forEach((n) => buffers.set(n, synth(ctx!, n)));
  }
  if (ctx.state === "suspended") void ctx.resume();
  decodeClick(ctx);
  return ctx;
}

/** Briefly lowers any audible video while an SFX plays ("duck other audio"). */
function duck() {
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video")).filter((v) => !v.muted);
  if (!videos.length) return;
  videos.forEach((v) => {
    v.dataset.duckVolume ??= String(v.volume);
    v.volume = Number(v.dataset.duckVolume) * 0.3;
  });
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    videos.forEach((v) => {
      v.volume = Number(v.dataset.duckVolume ?? 1);
      delete v.dataset.duckVolume;
    });
  }, 300);
}

export const sfx = {
  init() {
    if (typeof window === "undefined") return;
    try {
      enabled = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      enabled = false;
    }
    listeners.forEach((l) => l(enabled));
    setFlag("soundEnabled", enabled);
    if (enabled) {
      void fetchClick().catch(() => undefined);
      // The context needs a gesture before it can run; wake it on the first one.
      const wake = () => {
        ambientStart();
        window.removeEventListener("pointerdown", wake);
        window.removeEventListener("keydown", wake);
      };
      window.addEventListener("pointerdown", wake);
      window.addEventListener("keydown", wake);
    }
  },
  get enabled() {
    return enabled;
  },
  set(on: boolean) {
    enabled = on;
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* private mode */
    }
    if (on) ambientStart();
    else {
      hush(QUICK_CLOSE);
      ambientStop();
    }
    setFlag("soundEnabled", on);
    listeners.forEach((l) => l(on));
  },
  toggle() {
    sfx.set(!enabled);
    return enabled;
  },
  /**
   * A song's preview from `url` (same-origin, so it can be filtered), heard
   * through the wall; the door opens while nobody calls `stop`. It resolves
   * as the song starts, with `heardAt` saying when it is heard. Null, having
   * played nothing, when sound is off, the context has not been woken by a
   * gesture yet, there is no preview, or `signal` was aborted first. Nothing
   * is fetched while sound is off.
   */
  preview(url: string, signal?: AbortSignal): Promise<Preview | null> {
    return listen(url, signal);
  },
  /**
   * Puts the bed through a wall, or takes the wall away: the bed's lowpass
   * moves to `hz` over `overSeconds`, on a log scale as the ear hears it.
   * `sfx.air(700, 0.6)` is the next room's wall; `sfx.air(AIR_OPEN, 4)` opens
   * it again, to where the filter is not there at all (its resting state).
   * Only the bed goes through it: the cues, the ticks and a preview do not.
   * Made for the supernova's float, which sends the bed through the wall as
   * the pieces drift and opens it as the ball winds back. It wakes nothing
   * and fetches nothing: with sound off it only moves the dial.
   */
  air(hz: number, overSeconds = 0) {
    airHz = hz;
    const c = ctx;
    const f = air;
    if (!c || !f) return;
    const to = airAt(c, hz);
    const t = c.currentTime;
    hold(f.frequency, t);
    if (overSeconds > 0) f.frequency.exponentialRampToValueAtTime(to, t + overSeconds);
    else f.frequency.setValueAtTime(to, t);
  },
  onChange(l: (on: boolean) => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  play(name: Name, volume = 1) {
    if (!enabled) return;
    if (name === "tick") {
      const now = performance.now();
      if (now - lastTick < TICK_THROTTLE_MS) return;
      lastTick = now;
    }
    const c = ensure();
    if (!c || !master) return;
    const buf = buffers.get(name);
    if (!buf) {
      if (name === "click") clickQueued = true;
      return;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = volume;
    src.connect(g).connect(master);
    src.start();
    duck();
  },
};

