# eigengrau

A minimal WebGL portfolio: three "pages" that behave like one app.

| Tab | Route | What it is |
|---|---|---|
| Creative Space `1` | `/` | A slowly orbiting 3D cloud of small pieces on white. Click one to bring it forward. |
| Projects `2` | `/projects` | A 3-column grid of 3:4 covers drawn in WebGL, scrolled virtually, with refractive glass rims at the top and bottom. |
| About `3` | `/about` | One large serif statement with a chrome object sitting over it. |

A persistent chrome layer (monogram, pill tabs, sound chip) floats above page
panels that slide horizontally when you change tab. The intro (name, role,
counter, ring, explode) plays only on a hard load of `/`.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint && npm run typecheck
```

## Make it yours

Everything that is identity or content lives in one file: `src/content/site.ts`
(monogram, name, role, statement, tabs, the six projects, the twenty pieces in
the cloud). Drop your own media into `public/work/` and point the entries at it.

The placeholder artwork in `public/work/` is generated, not photographed:

```
PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/gen-assets.mjs
```

Fonts are self-hosted in `public/fonts/`: Inter Tight 500 (grotesk) and
Newsreader 300/400 (serif), as free stand-ins for the commercial faces. The
WOFF2 files feed CSS; the WOFF files feed the WebGL text renderer.

## Where things are

```
src/app/                 routes; each tab page is only its accessible mirror (the visible page is a canvas)
src/components/Shell.tsx chrome + the horizontal page slider
src/components/chrome/   Nav, Tab (pill morph), FloatingLogo (exclusion blend), SoundChip
src/components/pages/    one client panel per tab: canvas + DOM overlays
src/engine/space/        the cloud (CloudScene) and the intro timeline
src/engine/projects/     orthographic grid, virtual scroll, hover swap, edge-glass post pass
src/engine/about/        statement text and the raymarched chrome object
src/audio/sfx.ts         synthesised Web Audio SFX (off by default, remembered in localStorage)
```
