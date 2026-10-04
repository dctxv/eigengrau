"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { BASE_DEFAULTS, BASE_RANGES, readParams, type BaseParams } from "@/engine/urchi/base";
import { disposeTree, exportGlb, previewBase, previewLook, type BaseLook } from "@/engine/urchi/base3d";
import { URCHI_BOX, createUrchi, preloadSuit, type UrchiCharacter } from "@/engine/urchi/character";

const INK = "#16161d";
const PAGE = "#ffffff";
/** The game strip's ground: a warm mid-tone, and the height the figure must read at there. */
const STRIP = { ground: "#b08d6a", px: 64 };
/** The turnaround: every 45 degrees of the figure's turn (90 its left side, 180 its back). */
const SIDES: [string, number][] = [
  ["FRONT", 0], ["FRONT 3/4", 45], ["LEFT SIDE", 90], ["BACK 3/4", 135],
  ["BACK", 180], ["BACK 3/4", 225], ["RIGHT SIDE", 270], ["FRONT 3/4", 315],
];
/** The camera's distance, as the 2D painter's perspective (mesh units). */
const EYE = 2800;
const STORE = "urchi-base";

/** The sliders, grouped as the parts are. */
const GROUPS: { title: string; keys: (keyof BaseParams)[] }[] = [
  { title: "Head", keys: ["headScale", "headSink"] },
  { title: "Body", keys: ["bodyTop", "bodyBottom", "bodyHeight", "bodyFacets"] },
  { title: "Ruff", keys: ["ruff", "ruffTufts", "ruffLength"] },
  { title: "Bib", keys: ["bib", "bibColour"] },
  { title: "Tail", keys: ["tail", "tailLength"] },
  { title: "Hands", keys: ["handSize", "handGap", "handHeight"] },
  { title: "Feet", keys: ["footSize", "footSpacing"] },
];
const LABELS: Record<keyof BaseParams, string> = {
  headScale: "head scale", headSink: "head sink", bodyTop: "top width", bodyBottom: "bottom width", bodyHeight: "height",
  bodyFacets: "facets", ruff: "ruff", ruffTufts: "tufts", ruffLength: "tuft length", bib: "bib", bibColour: "colour",
  tail: "tail", tailLength: "length", handSize: "size", handGap: "distance from body", handHeight: "height", footSize: "size", footSpacing: "spacing",
};

/** Where the figure reaches: its top (the ground is y 0) and its farthest from the turning axis, in mesh units. */
function extent(root: THREE.Object3D): { top: number; r: number } {
  root.updateMatrixWorld(true);
  let top = 0, r = 0;
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const p = o.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      top = Math.max(top, v.y);
      r = Math.max(r, Math.hypot(v.x, v.z));
    }
  });
  return { top, r };
}

/** A camera that puts the ground (y 0) `groundPx` down a viewport `w` x `h` px, `ppu` px to a mesh unit at the turning axis. */
function cameraFor(cam: THREE.PerspectiveCamera, w: number, h: number, groundPx: number, ppu: number) {
  cam.aspect = w / h;
  cam.fov = (2 * Math.atan(h / ppu / 2 / EYE) * 180) / Math.PI;
  cam.position.set(0, groundPx / ppu - h / ppu / 2, EYE);
  cam.lookAt(0, cam.position.y, 0);
  cam.near = 10; cam.far = EYE * 3;
  cam.updateProjectionMatrix();
}

/**
 * The original Urchi (the 2D painter's, its plush body: /dev/body), held still at a turn, the teal
 * eyes forced as the new one has them; drawn as a copy, with where its feet reach (mesh units, y down).
 */
type Original = { image: HTMLCanvasElement; frame: { x: number; y: number; w: number; h: number } };
function original(turn: number, boxPx: number): Original {
  const was = location.search, q = new URLSearchParams(was);
  for (const k of ["yaw", "pitch", "roll", "blink"]) q.set(k, "0");
  q.set("col", "terrarium");
  // (a host that will not have its address changed still gets a figure: only not held still)
  const go = (to: string) => { try { history.replaceState(history.state, "", to); } catch { /* refused */ } };
  go(`?${q}`);
  let ch: UrchiCharacter;
  try {
    ch = createUrchi({ smooth: true, input: false }, { bare: true, turn });
  } finally {
    go(was || location.pathname);
  }
  ch.setSuit(1);
  ch.setResolution(boxPx);
  for (let i = 0; i < 60; i++) ch.update(0.05);
  const image = document.createElement("canvas");
  image.width = ch.canvas.width; image.height = ch.canvas.height;
  image.getContext("2d")!.drawImage(ch.canvas, 0, 0);
  const frame = { ...ch.frame };
  ch.dispose();
  return { image, frame };
}
/** How far below the head's middle the original's feet reach (mesh units), from its painting's alpha. */
function originalFeet(o: Original): number {
  const c = o.image, px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
  for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) return o.frame.y + ((y + 1) * o.frame.h) / c.height;
  return 0;
}

function initialParams(): BaseParams {
  if (typeof window === "undefined") return { ...BASE_DEFAULTS };
  const p = new URLSearchParams(location.search).get("p");
  if (p) try { return readParams(JSON.parse(p)); } catch { /* not JSON: the defaults */ }
  try { const kept = localStorage.getItem(STORE); if (kept) return readParams(JSON.parse(kept)); } catch { /* storage off */ }
  return { ...BASE_DEFAULTS };
}

type Canvases = { main: HTMLDivElement; gl: HTMLCanvasElement; flat: HTMLCanvasElement; small: HTMLCanvasElement; zoom: HTMLCanvasElement };

/**
 * The sheet's painting, apart from React: the turnaround (and the originals beside it, with
 * Compare), then the strip; repainted (once a frame at most) as the params, Compare or the size change.
 */
class BaseView {
  private gl: THREE.WebGLRenderer;
  private small: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera();
  private look: BaseLook = previewLook();
  private model: THREE.Group | null = null;
  private reach = { top: 1, r: 1 };
  private originals = new Map<string, Original>();
  /** The original's feet below its head's middle (mesh units), once measured; and whether its model is here. */
  private feet: number | null = null;
  private suit = false;
  private compare = false;
  private frame = 0;
  private ro: ResizeObserver;
  private alive = true;

  constructor(private c: Canvases) {
    this.gl = new THREE.WebGLRenderer({ canvas: c.gl, antialias: true, alpha: true });
    this.gl.setClearColor(0x000000, 0);
    this.small = new THREE.WebGLRenderer({ canvas: c.small, antialias: true, preserveDrawingBuffer: true });
    this.small.setPixelRatio(1);
    this.small.setClearColor(new THREE.Color(STRIP.ground), 1);
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(c.main);
    // the original's model (its body hangs from the suit's neck), and the fonts for the labels
    Promise.all([preloadSuit(), document.fonts.ready]).then(() => { if (this.alive) { this.suit = true; this.draw(); } });
  }

  setParams(p: BaseParams) {
    if (this.model) { this.scene.remove(this.model); disposeTree(this.model); }
    this.model = previewBase(p, this.look);
    this.scene.add(this.model);
    this.reach = extent(this.model);
    this.draw();
  }

  setCompare(on: boolean) {
    this.compare = on;
    this.draw();
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    if (this.model) disposeTree(this.model);
    this.gl.dispose();
    this.small.dispose();
  }

  draw() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => { if (this.alive && this.model) this.paint(this.model); });
  }

  private paint(model: THREE.Group) {
    const { main, flat } = this.c, dpr = window.devicePixelRatio || 1, W = main.clientWidth, H = main.clientHeight;
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(W, H, false);
    flat.width = Math.round(W * dpr); flat.height = Math.round(H * dpr);
    const g = flat.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const cols = W < H ? 2 : 4, rows = SIDES.length / cols, cw = W / cols, ch = H / rows, labelH = 22, pad = 14;
    const before = this.compare && this.suit, figW = before ? cw / 2 : cw, figH = ch - labelH - pad;
    // the original's reach, when it is beside it: its feet below its head's middle, its top the ear tips (436 up)
    if (before && this.feet === null) this.feet = originalFeet(original(0, 300));
    const feet = this.feet ?? 0, origH = before ? feet + 436 : 0, origR = before ? 506 : 0;
    const ppu = Math.min((figH * 0.94) / Math.max(this.reach.top, origH), (figW * 0.92) / (2 * Math.max(this.reach.r, origR)));
    const groundPx = pad + figH * 0.97;
    this.gl.setScissorTest(true);
    this.gl.clear();
    g.font = "500 12px Grotesk, ui-sans-serif, system-ui, sans-serif";
    g.textAlign = "center"; g.textBaseline = "top";
    SIDES.forEach(([name, turn], i) => {
      const x0 = cw * (i % cols), y0 = ch * Math.floor(i / cols), vx = x0 + (before ? figW : 0), vh = ch - labelH;
      this.gl.setViewport(vx, H - y0 - vh, figW, vh);
      this.gl.setScissor(vx, H - y0 - vh, figW, vh);
      cameraFor(this.cam, figW, vh, groundPx, ppu);
      model.rotation.y = (-turn * Math.PI) / 180;
      this.gl.render(this.scene, this.cam);
      g.fillStyle = INK;
      g.fillText(`${name}  ${turn}°`, x0 + cw / 2, y0 + ch - labelH + 2);
      if (before) {
        const key = `${turn}|${Math.round(ppu * dpr * 1000)}`;
        let o = this.originals.get(key);
        // the 2D painter turns the other way round: its turn -90 shows the figure's left side, as 90 does here
        if (!o) { o = original(-turn, URCHI_BOX.w * ppu * dpr); this.originals.set(key, o); }
        const cx = x0 + figW / 2;
        g.drawImage(o.image, cx + o.frame.x * ppu, y0 + groundPx - (feet - o.frame.y) * ppu, o.frame.w * ppu, o.frame.h * ppu);
        g.fillStyle = "#8a8a86";
        g.fillText("before", cx, y0 + 2); g.fillText("after", cx + figW, y0 + 2);
      }
    });
    model.rotation.y = 0;
    this.gl.setScissorTest(false);
    this.paintStrip(model);
    document.documentElement.dataset.sheet = "ready";
  }

  /** The figure 64px tall on the strip's ground, front and three-quarter, and the same blown up four times, pixel for pixel. */
  private paintStrip(model: THREE.Group) {
    const ppu = STRIP.px / this.reach.top, w = Math.ceil(2 * this.reach.r * ppu) + 16, h = STRIP.px + 16, views = [0, 45];
    this.small.setSize(w * views.length, h, false);
    this.small.setScissorTest(true);
    this.small.clear();
    views.forEach((turn, i) => {
      this.small.setViewport(w * i, 0, w, h);
      this.small.setScissor(w * i, 0, w, h);
      cameraFor(this.cam, w, h, h - 8, ppu);
      model.rotation.y = (-turn * Math.PI) / 180;
      this.small.render(this.scene, this.cam);
    });
    model.rotation.y = 0;
    this.small.setScissorTest(false);
    const { small, zoom } = this.c;
    small.style.width = `${w * views.length}px`; small.style.height = `${h}px`;
    zoom.width = w * views.length * 4; zoom.height = h * 4;
    zoom.style.width = `${zoom.width}px`; zoom.style.height = `${zoom.height}px`;
    const z = zoom.getContext("2d")!;
    z.imageSmoothingEnabled = false;
    z.drawImage(small, 0, 0, zoom.width, zoom.height);
  }
}

const noSubscribe = () => () => {};

/**
 * `onExport`, for a host that saves files itself (a page that may not start a download of its
 * own): it is handed the .glb and the params, and answers with the note to show; without it the
 * sheet downloads urchi.glb.
 */
export function BaseSheet({ onExport }: { onExport?: (glb: ArrayBuffer, params: BaseParams) => Promise<string> } = {}) {
  const host = useSyncExternalStore(noSubscribe, () => document.body, () => null);
  const [params, setParams] = useState<BaseParams>(initialParams);
  const [compare, setCompare] = useState(false);
  const [preset, setPreset] = useState("");
  const [note, setNote] = useState("");
  const mainRef = useRef<HTMLDivElement>(null), glRef = useRef<HTMLCanvasElement>(null), flatRef = useRef<HTMLCanvasElement>(null);
  const smallRef = useRef<HTMLCanvasElement>(null), zoomRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<BaseView | null>(null);

  // the view, once its canvases are on the page
  useEffect(() => {
    if (!host || !mainRef.current) return;
    const v = new BaseView({ main: mainRef.current, gl: glRef.current!, flat: flatRef.current!, small: smallRef.current!, zoom: zoomRef.current! });
    setView(v);
    return () => { v.dispose(); setView(null); };
  }, [host]);
  useEffect(() => { view?.setParams(params); }, [view, params]);
  useEffect(() => { view?.setCompare(compare); }, [view, compare]);
  // kept for the next visit
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(params)); } catch { /* storage off */ } }, [params]);

  const set = <K extends keyof BaseParams>(k: K, v: BaseParams[K]) => setParams((p) => ({ ...p, [k]: v }));
  const flash = (text: string) => { setNote(text); window.setTimeout(() => setNote(""), 1800); };
  const copy = async () => {
    const text = JSON.stringify(params, null, 2);
    try { await navigator.clipboard.writeText(text); flash("Copied"); }
    catch { setPreset(text); flash("Copy it from the box"); }
  };
  const load = () => {
    try { setParams(readParams(JSON.parse(preset))); flash("Loaded"); } catch { flash("That isn't JSON"); }
  };
  const download = async () => {
    const glb = await exportGlb(params);
    if (onExport) {
      try { flash(await onExport(glb, params)); } catch (e) { flash(e instanceof Error ? e.message : "The file wasn't saved"); }
      return;
    }
    const url = URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" }));
    const a = document.createElement("a");
    a.href = url; a.download = "urchi.glb"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Exported urchi.glb");
  };

  if (!host) return null;
  const sheet = (
    <div data-base-sheet="" className="bs">
      <style>{CSS}</style>
      <aside className="bs-panel">
        <div className="bs-head">
          <h1>Urchi, base body</h1>
          <div className="bs-buttons"><button onClick={download} title="The parts as separate named meshes at their pivots, in metres, for Godot">Export GLB</button></div>
        </div>
        {GROUPS.map((grp) => (
          <section key={grp.title}>
            <h2>{grp.title}</h2>
            {grp.keys.map((k) => {
              const v = params[k];
              if (typeof v === "boolean") return (
                <label key={k} className="bs-row bs-check"><input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked as never)} /> {LABELS[k]}</label>
              );
              if (typeof v === "string") return (
                <label key={k} className="bs-row"><span>{LABELS[k]}</span><input type="color" value={v} onChange={(e) => set(k, e.target.value as never)} /><output>{v}</output></label>
              );
              const [lo, hi, step] = BASE_RANGES[k]!;
              return (
                <label key={k} className="bs-row">
                  <span>{LABELS[k]}</span>
                  <input type="range" min={lo} max={hi} step={step} value={v} onChange={(e) => set(k, Number(e.target.value) as never)} />
                  <output>{step < 1 ? v.toFixed(2) : v}</output>
                </label>
              );
            })}
          </section>
        ))}
        <section>
          <h2>View</h2>
          <label className="bs-row bs-check"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> compare with the original</label>
        </section>
        <section>
          <h2>Presets</h2>
          <div className="bs-buttons">
            <button onClick={copy}>Copy JSON</button>
            <button onClick={load}>Load pasted</button>
            <button onClick={() => setParams({ ...BASE_DEFAULTS })}>Reset</button>
          </div>
          <textarea value={preset} onChange={(e) => setPreset(e.target.value)} placeholder="Paste a preset's JSON here" spellCheck={false} />
        </section>
        <p className="bs-note" aria-live="polite">{note}</p>
      </aside>
      <main className="bs-main">
        <div ref={mainRef} className="bs-turn">
          <canvas ref={flatRef} />
          <canvas ref={glRef} />
        </div>
        <div className="bs-strip">
          <div><canvas ref={smallRef} /><span>64px, as in the game strip</span></div>
          <div><canvas ref={zoomRef} className="bs-zoom" /><span>the same, four times, pixel for pixel</span></div>
        </div>
      </main>
    </div>
  );
  return createPortal(sheet, host);
}

const CSS = `
.bs { position: fixed; inset: 0; z-index: 2147483000; display: flex; background: ${PAGE}; color: ${INK}; font: 500 12px/1.35 Grotesk, ui-sans-serif, system-ui, sans-serif; }
.bs-panel { width: 290px; flex: none; overflow-y: auto; padding: 16px 16px 96px; background: #f3f2ee; border-right: 1px solid #e2e0da; }
.bs-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bs-panel h1 { font-size: 15px; margin: 0; }
.bs-panel h2 { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #6d6c68; margin: 14px 0 4px; }
.bs-row { display: grid; grid-template-columns: 96px 1fr 40px; align-items: center; gap: 6px; min-height: 24px; }
.bs-row output { text-align: right; font-variant-numeric: tabular-nums; color: #55544f; }
.bs-row input[type=range] { width: 100%; accent-color: ${INK}; }
.bs-row input[type=color] { width: 100%; height: 22px; border: 1px solid #d6d4cd; background: none; padding: 0; }
.bs-check { display: flex; gap: 8px; }
.bs-buttons { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 6px; }
.bs-buttons button { font: inherit; padding: 5px 10px; border: 1px solid ${INK}; border-radius: 999px; background: #fff; color: ${INK}; cursor: pointer; }
.bs-buttons button:hover { background: ${INK}; color: #fff; }
.bs-panel textarea { width: 100%; height: 90px; font: 11px/1.4 ui-monospace, monospace; border: 1px solid #d6d4cd; padding: 6px; resize: vertical; background: #fff; }
.bs-note { min-height: 16px; color: #3d6b52; }
.bs-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.bs-turn { position: relative; flex: 1; min-height: 0; }
.bs-turn canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.bs-strip { flex: none; display: flex; gap: 24px; align-items: flex-end; padding: 12px 16px; border-top: 1px solid #e2e0da; overflow-x: auto; }
.bs-strip > div { display: flex; flex-direction: column; gap: 4px; color: #6d6c68; }
.bs-strip canvas { display: block; image-rendering: pixelated; }
@media (max-width: 760px) { .bs { flex-direction: column-reverse; } .bs-panel { width: auto; height: 45vh; border-right: 0; border-top: 1px solid #e2e0da; } }
`;
