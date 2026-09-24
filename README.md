# eigengrau

A minimal WebGL portfolio: four "pages" that behave like one app.

| Tab | Route | What it is |
|---|---|---|
| Space `1` | `/` | A slowly orbiting 3D cloud of small pieces on eigengrau, with the week's records from Last.fm among them. Click one to bring it forward. |
| Projects `2` | `/projects` | The horizon: one line across the viewport, each project a mark on it at its year, with a status word and one honest line. |
| Notes `3` | `/notes` | One column of plain text, newest first: his notes in serif, the site's own log lines in grotesk. |
| About `4` | `/about` | One large serif statement with a chrome object sitting over it, and three words beneath for elsewhere. |

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
(monogram, name, role, statement, tabs, the six projects with their status and
one line, the notes, the twenty pieces in the cloud, the elsewhere links). Drop
your own media into `public/work/` and point the entries at it.

Music comes from Last.fm. Put `LASTFM_API_KEY` and `LASTFM_USER` in `.env.local`
(git-ignored); without them the site shows nothing and says nothing.

The placeholder artwork in `public/work/` is generated, not photographed:

```
PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/gen-assets.mjs
```

Fonts are self-hosted in `public/fonts/`: Inter Tight 500 (grotesk) and
Newsreader 300/400 (serif), as free stand-ins for the commercial faces. The
WOFF2 files feed CSS; the WOFF files feed the WebGL text renderer.

## Where things are

```
src/app/                 routes; each canvas tab page is only its accessible mirror (Notes is plain DOM and needs none)
src/app/api/now/         Last.fm: the scrobbling track and the week's top albums, { now, top }, empty on any failure
src/app/api/cover/[id]/  album art proxied same-origin, cached for a day
src/components/Shell.tsx chrome + the horizontal page slider
src/components/chrome/   Nav, Tab (pill morph), FloatingLogo (exclusion blend), SoundChip
src/components/pages/    one client panel per tab: canvas + DOM overlays; NotesPanel is the DOM column
src/engine/space/        the cloud (CloudScene) and the intro timeline
src/engine/projects/     the horizon, its travel and hover preview, edge-glass post pass
src/engine/about/        statement text and the raymarched chrome object
src/audio/sfx.ts         sound: the click and ambient bed from public/audio, plus synthesised cues (off by default, remembered in localStorage)
```
