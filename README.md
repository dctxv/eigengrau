# eigengrau

A minimal WebGL portfolio: five "pages" that behave like one app.

| Tab | Route | What it is |
|---|---|---|
| Space `1` | `/` | Urchi, the mascot, alone in a dark room, drawn large and smooth, at the screen's own resolution; wider than a phone, its head grows with the window to about half its height, eyes a little below the middle. It chooses what to look at: the pointer, a hovered tab pill, the sound chip when sound comes on, the spot where the pointer left the window, and faint one-pixel motes that drift through (tap the empty room to let one go). Once per visit it looks up at a tab that changed since your last visit, and a caption says so ("Two new notes since 12 September."). It keeps his hours in `TIME_ZONE`: asleep 01:00-06:59 unless he is playing something (its head settles a little smaller and lower, as on a pillow), drowsy 23:00-00:59, dozing after 90s of stillness; while he plays something, it listens. Hovering it raises "Urchi / *his line*", and it reads the line and reacts. Clicking it opens Threshold, the daily game; when it is asleep, the first click wakes it. |
| Projects `2` | `/projects` | The wound horizon. One ink thread is wound into a ball sized to the screen, from his first year (2021) at the bottom to now at the top, where its loose end hangs still, at about 1.5 turns a year. Each project is a mark at its year with its pieces hanging off it (dead work hangs inward); studies are unlabelled beads. Drag, the wheel or the arrow keys turn it. Hover (a first tap on a phone) shows the name, status word and one line under the ball; where the ball reaches that far, its rings thin beneath the words. Click or Enter (a second tap) unspools it into a straight line (vertical on a phone) with its pieces and a "Case" link; Esc winds it back. `/projects#slug` opens straight into a project. Case pages list the project's pieces. |
| Notes `3` | `/notes` | One column, newest first, his notes in serif and the site's own log lines in grotesk, headed by a sentence written from the tags ("Nine since August: three on psychology, ..."). Each tag word filters (`/notes?tag=psychology`). Typing anywhere finds; on a phone, tap "Notes". Notes that don't match fold into hairlines drawn to their length. A dot marks notes newer than your last visit. Past `NOTES_FOLD_AFTER` notes, older months and years settle into one-line summaries. |
| Music `4` | `/music` | From Last.fm. While he is playing something, the sleeve alone in the centre, with a hairline that crawls over the song and an honest "About two minutes in.", and the week folded into the heading (the heading brings it back). Otherwise, the last played track and the week's ten songs in one stack, each sized by its plays. The heading is the week's single most unusual fact. With sound on, resting on a title plays its 30s preview "through the wall". Stay and the room takes the record's colour, on the door's clock: faint behind the wall, full when the door opens; his song's colour is the room's while he plays it. On a phone the first tap on a song chooses it and the second opens Last.fm. |
| About `5` | `/about` | One large serif statement with Urchi as the small mark after "things.", the status line, and three words beneath for elsewhere. |

A persistent chrome layer (monogram, pill tabs, sound chip) floats above page
panels that slide horizontally when you change tab. The intro plays only on a
hard load of `/`: name, role, counter and ring; then the ring draws in, Urchi's
eyes open alone, its head builds out from them, and its first breath blows the
pieces up toward the "2" as the chrome drops. The favicon is a live Urchi in
this visit's eye colours: it blinks, and falls asleep after about 20s on
another tab. `src/app/icon.svg` is the fallback.

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
one line, the notes, the pieces of work, the elsewhere links). Drop your own
media into `public/work/` and point the entries at it. Pieces carry a `year`
and an optional `project` slug (a piece without one is a study); they hang on
the Projects thread, and twelve of them fill the intro's ring.

Also in that file:

- `TIME_ZONE`: where he lives. Urchi's hours and Music's week use it; null
  means the visitor's own hours in the browser and UTC on the server.
- `UPDATED`: bump `UPDATED.projects` or `UPDATED.about` when those tabs
  change, so Urchi looks up at them for a returning visitor. Notes date
  themselves from the newest note.
- `URCHI_LINES`: his lines about Urchi, as `{ text, reaction }`.
  `URCHI_STATES` and `URCHI_NEWS` are the caption templates for its states
  (asleep, listening) and for what's new.
- `NOTES_FOLD_AFTER`: how many notes before Notes starts to settle.

Music comes from Last.fm. Put `LASTFM_API_KEY` and `LASTFM_USER` in `.env.local`
(git-ignored); without them the Music tab says "No plays this week" and
nothing else. With them, it shows the track playing now (or the last one, and
when), and the week's ten most-played songs: each title's size and brightness
follow its play count, so the ones played least sink toward eigengrau, and
hovering one turns the sleeve to its album. While the tab is open it polls
every 20s while he is live and every minute otherwise. Song lengths come from
`track.getInfo`, so `/api/now` also returns `now.length`, `now.elapsed` and
`now.sure` (whether the start is known, or only a lower bound), and
`week.fact`, the heading (from `api/now/fact.ts`). Space polls `/api/now` too,
to know when he is listening. With sound on, `/api/preview` looks the song up
on the keyless iTunes Search API and proxies its preview same-origin; a 404
means silence. Nothing is fetched with sound off.

Threshold is the game behind Urchi: five rounds of squares, one of
them lighter than eigengrau by 10, 6, 4, 2, then 1 of 255, two boards a round.
Everyone gets the same boards on the same UTC day; the result stays in
localStorage until tomorrow. `/threshold` opens it directly.

Urchi, the mascot, keeps its own page in `urchi/`: open `urchi/index.html`
(the query-string knobs at the top of its script work on the site too, e.g.
`/?col=denim` or `/about?still`; the site adds `/?hour=3` or `/?hour=3:12`,
which pretends it is that time where he is, from `src/engine/urchi/hours.ts`).
Its head is traced from `urchi/ref/` and baked by its tools; after rebuilding
it, copy the mesh into the site:

```
node urchi/tools/build-mascot.mjs && npm run urchi:sync
```

The site paints it smooth (the canvas follows the size it is shown at, and the white rim is
the silhouette's outline); the standalone page and the favicon keep the hard pixels. The
behaviour began as a line-for-line port into
`src/engine/urchi/character.ts`, so a change to the script in
`urchi/index.html` still wants the same change there. It is no longer only a
port: the site's copy carries hooks that `urchi/index.html` lacks (`setReveal`,
`lookAt`, `widen`, `pauseBreath`, `setBreathPeriod`, `setBlinkGap`,
`setRestLid`, `setLids`, `tiltToward`, `fixate`, `converge`, `bob`, `stretch`),
which the intro and Space's attention and acts drive.

What the site keeps in localStorage, every read and write guarded:
`eigengrau:sound` (sound on or off), `eigengrau:threshold` (today's result),
`eigengrau:visits` (`{ prev, seen }` in ms: when the last visit ended, and the
last activity; Space writes it and Notes reads it) and `eigengrau:told` (the
visit Urchi has already pointed out what's new for).

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
src/app/api/now/         Last.fm: the track playing (its length, how far in, and whether that is sure), the last one played, the week's top songs and its one fact (fact.ts), { now, last, week }, empty on any failure
src/app/api/preview/     a song's 30s preview from the iTunes Search API, proxied same-origin and cached for a day; 404 when no match is confident
src/app/api/cover/[id]/  album art proxied same-origin, cached for a day
src/app/threshold/       redirects to /#threshold, the game's door
src/components/Shell.tsx chrome + the horizontal page slider
src/components/chrome/   Nav, Tab (pill morph), FloatingLogo (exclusion blend), SoundChip, LiveIcon (the favicon's Urchi)
src/components/pages/    one client panel per tab: canvas + DOM overlays; NotesPanel and MusicPanel are plain DOM; Threshold is the game's board
src/engine/space/        Urchi's room (RoomScene), the intro's ring (IntroRing) and timeline (intro.ts), and the motes (Motes.ts)
src/engine/projects/     the wound thread (ThreadScene) and its edge-glass post pass (edgeGlass)
src/engine/about/        the statement, with Urchi as its mark
src/engine/urchi/        Urchi in the site: character.ts ports urchi/index.html and adds the site's hooks, Urchi.ts shows its canvas in a scene, attention.ts is what it looks at, acts.ts its small scripted acts, hours.ts his hours, mesh.json is its head
src/engine/common/       colour, loader and text helpers
src/lib/                 colour tokens, flags, motion, routes, viewport, the Last.fm poller (now.ts), the game's rules (threshold.ts), the last-visit memory and what's new (visits.ts), the Notes column's data, sentence and sediment (notes.ts), and a record's colour read from its cover in OKLab (tone.ts)
src/audio/sfx.ts         sound: the click and ambient bed from public/audio, synthesised cues (the counter's D/A chime among them), and Music's preview voice with the bed ducking under it, whose door the room's colour keeps time with (off by default, remembered in localStorage)
```
