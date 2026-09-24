/**
 * Sound (spec 11). Two sampled files in public/audio: a click for opening a
 * project and an ambient bed that loops with a crossfade at the seam. The
 * other cues are synthesised. Off by default, remembered in localStorage;
 * nothing is fetched until sound is turned on.
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
const buffers = new Map<Name, AudioBuffer>();
let clickBytes: Promise<ArrayBuffer> | null = null;
let clickDecoding = false;
let clickQueued = false;
let enabled = false;
let lastTick = 0;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(on: boolean) => void>();

function synth(c: AudioContext, name: Synth): AudioBuffer {
  const sr = c.sampleRate;
  const specs: Record<Synth, { dur: number; gen: (t: number, i: number) => number }> = {
    tab: { dur: 0.05, gen: (t) => (Math.random() * 2 - 1) * Math.exp(-t * 140) * 0.5 + Math.sin(t * 2 * Math.PI * 1400) * Math.exp(-t * 90) * 0.4 },
    slide: { dur: 0.32, gen: (t) => (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / 0.32)) ** 2 * 0.18 },
    focus: { dur: 0.12, gen: (t) => Math.sin(t * 2 * Math.PI * 180) * Math.exp(-t * 28) * 0.5 + (Math.random() * 2 - 1) * Math.exp(-t * 220) * 0.3 },
    close: { dur: 0.09, gen: (t) => Math.sin(t * 2 * Math.PI * 140) * Math.exp(-t * 40) * 0.4 + (Math.random() * 2 - 1) * Math.exp(-t * 260) * 0.2 },
    tick: { dur: 0.012, gen: (t) => Math.sin(t * 2 * Math.PI * 2100) * Math.exp(-t * 500) * 0.35 },
    done: { dur: 0.3, gen: (t) => (Math.sin(t * 2 * Math.PI * 660) * Math.exp(-t * 14) + Math.sin(Math.max(0, t - 0.09) * 2 * Math.PI * 880) * Math.exp(-Math.max(0, t - 0.09) * 12) * (t > 0.09 ? 1 : 0)) * 0.22 },
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
  bus.connect(master!);
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
    if (document.visibilityState === "hidden") a.decks.forEach((d) => d.el.pause());
    else if (enabled) void a.decks[a.current].el.play().catch(() => undefined);
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
    else ambientStop();
    setFlag("soundEnabled", on);
    listeners.forEach((l) => l(on));
  },
  toggle() {
    sfx.set(!enabled);
    return enabled;
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
