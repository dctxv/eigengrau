/**
 * Web Audio SFX (spec 11). Everything is synthesised into small AudioBuffers
 * at init, so there are no audio files to license or load. Quiet, short, dry.
 */
type Name = "tab" | "slide" | "focus" | "close" | "tick" | "done";

import { setFlag } from "@/lib/flags";

const STORAGE_KEY = "eigengrau:sound";
const TICK_THROTTLE_MS = 40;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<Name, AudioBuffer>();
let enabled = false;
let lastTick = 0;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(on: boolean) => void>();

function synth(c: AudioContext, name: Name): AudioBuffer {
  const sr = c.sampleRate;
  const specs: Record<Name, { dur: number; gen: (t: number, i: number) => number }> = {
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

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    (["tab", "slide", "focus", "close", "tick", "done"] as Name[]).forEach((n) => buffers.set(n, synth(ctx!, n)));
  }
  if (ctx.state === "suspended") void ctx.resume();
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
      // The context needs a gesture before it can run; wake it on the first one.
      const wake = () => {
        ensure();
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
    if (on) ensure();
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
    if (!buf) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = volume;
    src.connect(g).connect(master);
    src.start();
    duck();
  },
};
