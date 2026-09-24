/**
 * Generates the placeholder artwork in public/work with headless Chromium.
 * Every piece is abstract and generated here, so nothing is lifted from anywhere.
 *
 *   node scripts/gen-assets.mjs
 *
 * Needs the playwright package (a global install is fine: set PLAYWRIGHT_PATH to its folder)
 * and an ffmpeg with libvpx for the video loops (FFMPEG env var, default: playwright's copy).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require("playwright"); } catch { /* fall through */ }
  for (const p of [process.env.PLAYWRIGHT_PATH, "/opt/node22/lib/node_modules/playwright"]) {
    if (p) { try { return require(p); } catch { /* next */ } }
  }
  throw new Error("playwright not found: npm i -D playwright, or set PLAYWRIGHT_PATH");
})();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "work");
const FFMPEG = process.env.FFMPEG || "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux";
const FPS = 24;
const LOOP_SECONDS = 2.5;

/** Cloud items: long side 320px (about 2x the largest on-screen size). */
const CLOUD = [
  { id: "s01", aspect: 0.75, style: "field", seed: 11 },
  { id: "s02", aspect: 1.5, style: "stripes", seed: 12 },
  { id: "s03", aspect: 1, style: "blobs", seed: 13 },
  { id: "s04", aspect: 0.8, style: "grid", seed: 14, video: "orbit" },
  { id: "s05", aspect: 1.333, style: "arc", seed: 15 },
  { id: "s06", aspect: 0.75, style: "glyph", seed: 16 },
  { id: "s07", aspect: 1.778, style: "horizon", seed: 17 },
  { id: "s08", aspect: 1, style: "noise", seed: 18, video: "scan" },
  { id: "s09", aspect: 0.75, style: "blobs", seed: 19 },
  { id: "s10", aspect: 1.333, style: "field", seed: 20 },
  { id: "s11", aspect: 0.8, style: "arc", seed: 21 },
  { id: "s12", aspect: 1.5, style: "glyph", seed: 22 },
  { id: "s13", aspect: 1, style: "stripes", seed: 23, video: "pulse" },
  { id: "s14", aspect: 0.75, style: "horizon", seed: 24 },
  { id: "s15", aspect: 1.333, style: "grid", seed: 25 },
  { id: "s16", aspect: 0.75, style: "noise", seed: 26 },
  { id: "s17", aspect: 1, style: "field", seed: 27 },
  { id: "s18", aspect: 1.778, style: "blobs", seed: 28, video: "wave" },
  { id: "s19", aspect: 0.8, style: "stripes", seed: 29 },
  { id: "s20", aspect: 1.5, style: "arc", seed: 30 },
];

/** Covers: 3:4, 1000 x 1333. Alternates: a different still, or a 720 x 960 loop. */
const COVERS = [
  { id: "p01", style: "blobs", seed: 101, alt: { style: "field", seed: 102 } },
  { id: "p02", style: "dark", seed: 103, alt: { video: "orbit", seed: 104 } },
  { id: "p03", style: "arc", seed: 105, alt: { style: "glyph", seed: 106 } },
  { id: "p04", style: "yellow", seed: 107, alt: { video: "scan", seed: 108 } },
  { id: "p05", style: "horizon", seed: 109, alt: { style: "noise", seed: 110 } },
  { id: "p06", style: "grid", seed: 111, alt: { video: "wave", seed: 112 } },
];

/** Runs inside the page. Draws one frame of `style` at time t (0..1 for loops) onto ctx. */
const DRAW_SOURCE = String(function draw(canvas, style, seed, t) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, S = Math.min(W, H);
  let s = seed * 7919 + 17;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const PAL = [
    ["#F2E9DA", "#111111", "#E63B2E"], ["#0E0E0E", "#F4F1EA", "#2B5BFF"], ["#FFD23F", "#111111", "#F2E9DA"],
    ["#1B3A6B", "#F2E9DA", "#E8A33D"], ["#EDEDED", "#111111", "#3AA17E"], ["#E63B2E", "#F2E9DA", "#111111"],
    ["#101820", "#DDE3EA", "#F26B5B"], ["#F4F1EA", "#4A3F9A", "#F2B134"],
  ];
  const pal = PAL[Math.floor(rnd() * PAL.length)];
  const [bg, ink, accent] = pal;
  const TAU = Math.PI * 2;
  const grain = (amount) => {
    const img = ctx.getImageData(0, 0, W, H); const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  };
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  if (style === "dark") { ctx.fillStyle = "#0A0A0A"; ctx.fillRect(0, 0, W, H); }
  if (style === "yellow") { ctx.fillStyle = "#FFD400"; ctx.fillRect(0, 0, W, H); }
  const ph = t * TAU;
  switch (style) {
    case "field": case "yellow": {
      const r = S * (0.28 + rnd() * 0.12);
      ctx.fillStyle = style === "yellow" ? "#111" : ink;
      ctx.beginPath(); ctx.arc(W * (0.35 + rnd() * 0.3), H * (0.35 + rnd() * 0.3), r, 0, TAU); ctx.fill();
      ctx.fillStyle = accent; ctx.fillRect(W * 0.1, H * 0.78, W * 0.8, S * 0.02);
      break;
    }
    case "stripes": {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.5 + rnd());
      const n = 9 + Math.floor(rnd() * 6); const w = (S * 2) / n;
      for (let i = -n; i < n; i++) { ctx.fillStyle = i % 2 ? ink : accent; ctx.fillRect(i * w, -S * 1.5, w * 0.5, S * 3); }
      ctx.restore();
      break;
    }
    case "blobs": case "dark": {
      if (style === "dark") ctx.globalAlpha = 0.9;
      for (let i = 0; i < 5; i++) {
        const cx = W * rnd(), cy = H * rnd(), r = S * (0.25 + rnd() * 0.35);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, i % 2 ? accent : ink); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
      if (style === "dark") { ctx.fillStyle = "#F2E9DA"; ctx.fillRect(W * 0.12, H * 0.12, S * 0.06, S * 0.06); }
      break;
    }
    case "grid": {
      const n = 8 + Math.floor(rnd() * 5); const cell = S / n; const hx = rnd(), hy = rnd();
      ctx.fillStyle = ink;
      for (let y = cell / 2; y < H; y += cell) for (let x = cell / 2; x < W; x += cell) {
        const d = Math.hypot(x / W - hx, y / H - hy); if (d < 0.22) continue;
        ctx.beginPath(); ctx.arc(x, y, cell * 0.18, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(W * hx, H * hy, S * 0.09, 0, TAU); ctx.fill();
      break;
    }
    case "arc": {
      ctx.lineWidth = S * 0.06; ctx.lineCap = "butt";
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? ink : accent;
        ctx.beginPath(); ctx.arc(W * 0.5, H * 0.55, S * (0.12 + i * 0.11), rnd() * TAU, rnd() * TAU + 2.5); ctx.stroke();
      }
      break;
    }
    case "glyph": {
      ctx.fillStyle = ink; ctx.font = `700 ${S * 0.9}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const ch = "AEKMRSXZ7&"[Math.floor(rnd() * 10)];
      ctx.fillText(ch, W * 0.5, H * 0.55);
      ctx.fillStyle = accent; ctx.fillRect(W * 0.1, H * 0.1, S * 0.05, S * 0.05);
      break;
    }
    case "horizon": {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, accent); g.addColorStop(0.62, bg); g.addColorStop(0.621, ink); g.addColorStop(1, ink);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(W * (0.3 + rnd() * 0.4), H * 0.5, S * 0.08, 0, TAU); ctx.fill();
      grain(28);
      break;
    }
    case "noise": {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, ink); g.addColorStop(1, accent);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); grain(90);
      break;
    }
    // Looping styles (t in 0..1)
    case "orbit": {
      ctx.fillStyle = ink; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        const a = ph * (i % 2 ? 1 : -1) + (i / 6) * TAU; const r = S * (0.12 + i * 0.05);
        ctx.fillStyle = i % 3 === 0 ? accent : bg; ctx.beginPath();
        ctx.arc(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, S * 0.045, 0, TAU); ctx.fill();
      }
      break;
    }
    case "scan": {
      ctx.fillStyle = accent; ctx.fillRect(0, 0, W, H);
      const y = ((t + 0.5) % 1) * H; ctx.fillStyle = ink; ctx.fillRect(0, y - S * 0.04, W, S * 0.08);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(W / 2, H / 2, S * 0.22 + Math.sin(ph) * S * 0.02, 0, TAU); ctx.fill();
      ctx.fillStyle = ink; ctx.fillRect(0, y - S * 0.04, W, S * 0.08);
      break;
    }
    case "pulse": {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = ink; ctx.beginPath();
      const k = 0.26 + 0.06 * Math.sin(ph);
      for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU; const r = S * (k + 0.03 * Math.sin(a * 5 + ph * 2)); const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fill();
      break;
    }
    case "wave": {
      ctx.fillStyle = ink; ctx.fillRect(0, 0, W, H); ctx.lineWidth = S * 0.012; ctx.strokeStyle = bg;
      for (let l = 0; l < 7; l++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) { const y = H * (0.2 + l * 0.1) + Math.sin(x / S * 6 + ph + l * 0.6) * S * 0.04; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.strokeStyle = l === 3 ? accent : bg; ctx.stroke();
      }
      break;
    }
  }
});

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<canvas id="c"></canvas><script>window.draw = ${DRAW_SOURCE};</script>`);

  const still = async (file, w, h, style, seed, t = 0) => {
    const url = await page.evaluate(([w, h, style, seed, t]) => {
      const c = document.getElementById("c"); c.width = w; c.height = h; window.draw(c, style, seed, t);
      return c.toDataURL("image/webp", 0.82);
    }, [w, h, style, seed, t]);
    writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  };

  const video = async (base, w, h, style, seed) => {
    const frames = Math.round(FPS * LOOP_SECONDS);
    const buffers = [];
    for (let i = 0; i < frames; i++) {
      const url = await page.evaluate(([w, h, style, seed, t]) => {
        const c = document.getElementById("c"); c.width = w; c.height = h; window.draw(c, style, seed, t);
        return c.toDataURL("image/jpeg", 0.92);
      }, [w, h, style, seed, i / frames]);
      buffers.push(Buffer.from(url.split(",")[1], "base64"));
    }
    // Playwright's ffmpeg only demuxes a piped MJPEG stream (it is built for screen recording).
    execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "pipe:0",
      "-c:v", "libvpx", "-b:v", "500k", "-crf", "24", "-auto-alt-ref", "0", "-pix_fmt", "yuv420p", "-an", `${base}.webm`],
      { cwd: OUT, input: Buffer.concat(buffers), maxBuffer: 1 << 30 });
    await still(join(OUT, `${base}.webp`), w, h, style, seed, 0); // poster
  };

  for (const it of CLOUD) {
    const w = it.aspect >= 1 ? 320 : Math.round(320 * it.aspect);
    const h = it.aspect >= 1 ? Math.round(320 / it.aspect) : 320;
    if (it.video) await video(it.id, w & ~1, h & ~1, it.video, it.seed);
    else await still(join(OUT, `${it.id}.webp`), w, h, it.style, it.seed);
    console.log("cloud", it.id);
  }
  for (const c of COVERS) {
    await still(join(OUT, `${c.id}.webp`), 1000, 1333, c.style, c.seed);
    if (c.alt.video) await video(`${c.id}-alt`, 720, 960, c.alt.video, c.alt.seed);
    else await still(join(OUT, `${c.id}-alt.webp`), 1000, 1333, c.alt.style, c.alt.seed);
    console.log("cover", c.id);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
