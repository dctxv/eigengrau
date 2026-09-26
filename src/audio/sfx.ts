/**
 * Sound (spec 11). Two sampled files in public/audio: a click for opening a
 * project and an ambient bed that loops with a crossfade at the seam. The
 * other cues are synthesised. Music adds a third voice: a song's preview heard
 * through the wall, with the bed ducking under it. Off by default, remembered
 * in localStorage; nothing is fetched until sound is turned on.
 */
type Name = "click" | "tab" | "slide" | "focus" | "close" | "tick" | "done";
type Synth = Exclude<Name, "click">;

import { setFlag } from "@/lib/flags";

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
const QUICK_CLOSE = 0.3; // sound turned off, or the tab hidden
const WAKE_WAIT_MS = 300;

/**
 * What the Music page gets back: how long the song runs, where it lives on
 * Apple Music, when its first sample reaches the speakers (performance.now()
 * ms, a little after the promise resolves), and how to leave.
 */
export type Preview = { duration: number; link: string | null; heardAt: number; ended: Promise<void>; stop: () => void };

type Voice = { src: AudioBufferSourceNode; lp: BiquadFilterNode; level: GainNode; wet: GainNode };
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

/** Holds a param where it is at `t`, dropping whatever was scheduled after, so a new move starts from there. */
function hold(p: AudioParam, t: number) {
  if (typeof p.cancelAndHoldAtTime === "function") {
    p.cancelAndHoldAtTime(t);
    return;
  }
  const v = p.value;
  p.cancelScheduledValues(t);
  p.setValueAtTime(v, t);
}

/** Closes the door on the song playing, if any, over `over` seconds; the bed comes back as it goes. */
function hush(over = DOOR_CLOSE) {
  const v = voice;
  const c = ctx;
  voice = null;
  if (!v || !c) return;
  const t = c.currentTime;
  [v.lp.frequency, v.level.gain, v.wet.gain].forEach((p) => hold(p, t));
  v.lp.frequency.exponentialRampToValueAtTime(WALL_HZ, t + over);
  v.level.gain.linearRampToValueAtTime(0, t + over);
  if (bed) {
    hold(bed.gain, t);
    bed.gain.linearRampToValueAtTime(1, t + over);
  }
  try {
    v.src.stop(t + over + 0.05);
  } catch {
    /* already stopped */
  }
}

/**
 * Fetches, decodes and plays a preview behind the wall, scheduling the door
 * to open while nobody calls stop. Hover is not a gesture, so a context that
 * has never been woken stays silent: better silence than a line pretending.
 */
async function listen(url: string, signal?: AbortSignal): Promise<Preview | null> {
  if (!enabled) return null;
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
  if (signal?.aborted || !enabled) return null;
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
  src.connect(lp).connect(level).connect(master);
  lp.connect(walls).connect(wet).connect(level);

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
  level.gain.setValueAtTime(OPEN_LEVEL, tail);
  level.gain.linearRampToValueAtTime(0, end);
  wet.gain.setValueAtTime(ROOM_WET.wall, t);
  wet.gain.setValueAtTime(ROOM_WET.wall, doorAt);
  wet.gain.linearRampToValueAtTime(ROOM_WET.open, openAt);
  hold(bed.gain, t);
  bed.gain.linearRampToValueAtTime(BED_DUCK.wall, Math.min(t + WALL_IN, end));
  bed.gain.setValueAtTime(BED_DUCK.wall, doorAt);
  bed.gain.linearRampToValueAtTime(BED_DUCK.open, openAt);
  bed.gain.setValueAtTime(BED_DUCK.open, tail);
  bed.gain.linearRampToValueAtTime(1, end);

  const v: Voice = { src, lp, level, wet };
  const ended = new Promise<void>((resolve) => {
    src.onended = () => {
      [src, lp, level, wet, walls].forEach((n) => n.disconnect());
      if (voice === v) voice = null;
      resolve();
    };
  });
  src.start(t);
  voice = v;
  const stop = () => {
    if (voice === v) hush();
  };
  return { duration: buffer.duration, link, heardAt: heardAt(c, t), ended, stop };
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
    bed.connect(master);
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
