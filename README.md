# eigengrau

A minimal WebGL portfolio: five "pages" that behave like one app.

| Tab | Route | What it is |
|---|---|---|
| Space `1` | `/` | Urchi, the mascot, alone in a dark room, drawn large and smooth, at the screen's own resolution; wider than a phone, its head grows with the window to about half its height, eyes a little below the middle. It chooses what to look at: the pointer, a hovered tab pill, the sound chip when sound comes on, the spot where the pointer left the window, and faint one-pixel motes that drift through (tap the empty room to let one go). Tap a rhythm of three to eight taps there and it watches your hand, not the motes, then leans in and blinks the rhythm back, with a soft low pat for each blink if sound is on; the third time in a visit it adds a beat of its own, and tapping that version back earns a slow blink and twenty seconds of soft eyes. At night it only stirs. Come back to the tab after 45s or more away and you may catch it at something it wouldn't do while watched (at most once in ten minutes). Once per visit it looks up at a tab that changed since your last visit, and a caption says so ("Two new notes since 12 September."). It keeps his hours in `TIME_ZONE`: asleep 01:00-06:59 unless he is playing something (its head settles a little smaller and lower, as on a pillow), drowsy 23:00-00:59, dozing after 90s of stillness; while he plays something, it listens. Hovering it raises "Urchi / *his line*", and it reads the line and reacts. Clicking it opens Threshold, the daily game; when it is asleep, the first click wakes it. |
| Projects `2` | `/projects` | The wound horizon. One ink thread is wound into a ball sized to the screen, from his first year (2021) at the bottom to now at the top, where its loose end hangs still, at about 1.5 turns a year; wider than a phone, the heading and the ball stand centred between the tab bar and the page's foot. Each project is a mark at its year with its pieces hanging off it (dead work hangs inward); studies are unlabelled beads. Drag, the wheel or the arrow keys turn it (an arrow held past a moment spins it freely). Spin it hard for long enough, its surface faster than an LP turns (a drag, a trackpad or a held arrow; never a notched wheel or a trackpad's momentum), and it pulls in: smaller and faster, its rings drawn true and its pieces flat, the ticks climbing in pitch and, from halfway, running together into a whirr (heard with sound on). Let go short of the point of no return and it opens again with a sigh; past it, it drops to a knot, holds its breath and bursts: one ring, the thread flung out into filaments, and the projects settling into a loose contact sheet in date order, a faint year over each year's first, while the heading's tail says "Give them a minute." (with sound on, a soft bloom, and the bed goes through the wall). Hover, the arrows or a first tap choose a cover, with its caption beside it, clear of the others (on a phone, under the sheet); a click or Enter (a second tap) gathers everything and opens it. Past thirty projects the covers lie in year rows, as large as on the ball. Left alone six seconds (five on a phone), or at a drag, the wheel, Esc or a tap on empty space, a winder winds the thread back from its first year and each project flies home with its tick, his career in date order; for 25 seconds after, it only tightens a little. Three or four hard flicks do it on a phone; with reduced motion it never happens. Hover (a first tap on a phone) shows the name, status word and one line under the ball; where the ball reaches that far, its rings thin beneath the words, and a pointer heading down to them keeps the choice a moment, so a click on the way still opens it. Click or Enter (a second tap) unspools it into a straight line (vertical on a phone) with its pieces and a "Case" link, and the line is plucked as it comes taut: its note is how long the project ran (D4 under a year, down the bed's notes to F3 at four years or more; heard with sound on), living work rings with a one-pixel standing wave, dead work thuds with one twitch. Esc winds it back. `/projects#slug` opens straight into a project. Case pages list the project's pieces. |
| Notes `3` | `/notes` | One column, newest first, his notes in serif and the site's own log lines in grotesk, headed by a sentence written from the tags ("Nine since August: three on psychology, ..."). Each tag word filters (`/notes?tag=psychology`). Typing anywhere finds; on a phone, tap "Notes". Notes that don't match fold into hairlines drawn to their length, one after another down the page, and open again back up it; with sound on, each gives a quiet tick, a thumb running down a card index, and clearing the filter closes softly. A dot marks notes newer than your last visit. Past `NOTES_FOLD_AFTER` notes, older months and years settle into one-line summaries. |
| Music `4` | `/music` | From Last.fm. While he is playing something, the sleeve alone in the centre, with a hairline that crawls over the song and an honest "About two minutes in.", and the week folded into the heading (the heading brings it back). Otherwise, the last played track and the week's ten songs in one stack, each sized by its plays. The heading is the week's single most unusual fact. With sound on, resting on a title plays its 30s preview "through the wall". Once its door has opened, the song stays in the room when you leave and plays to its end, heard through the other tabs' walls, more muffled the further you go and from Music's side; come back while it plays and the door reopens. Stay and the room takes the record's colour, on the door's clock: faint behind the wall, full when the door opens; his song's colour is the room's while he plays it. On a phone the first tap on a song chooses it and the second opens Last.fm. |
| About `5` | `/about` | One large serif statement with Urchi as the small mark after "things.", the status line, and three words beneath for elsewhere. |

A persistent chrome layer (monogram, pill tabs, sound chip) floats above page
panels that slide horizontally when you change tab. While they slide, and only
then, faint one-pixel stars pass at about a third of their speed: the same
ones all visit, back the other way on the way back. The intro plays only on a
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
means silence. Nothing is fetched with sound off. The room's colour is read
from each cover in the browser (`src/lib/tone.ts`): a grey record leaves the
room grey, and a sleeve whose colour is only a small accent can be given its
hue in `OVERRIDES` there.

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
visit Urchi has already pointed out what's new for). In sessionStorage,
`eigengrau:tones` keeps each cover's colour for the visit.

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
src/components/chrome/   Nav, Tab (pill morph), FloatingLogo (exclusion blend), SoundChip, LiveIcon (the favicon's Urchi), Between (the stars between the tabs)
src/components/pages/    one client panel per tab: canvas + DOM overlays; NotesPanel and MusicPanel are plain DOM; Threshold is the game's board
src/engine/space/        Urchi's room (RoomScene), the intro's ring (IntroRing) and timeline (intro.ts), the motes (Motes.ts), and call and response (Call.ts)
src/engine/projects/     the wound thread (ThreadScene, which tells the page each phase of the supernova as a window `eigengrau:nova` event, `detail.phase`, for the spacesuit companion) and its edge-glass post pass (edgeGlass)
src/engine/about/        the statement, with Urchi as its mark
src/engine/urchi/        Urchi in the site: character.ts ports urchi/index.html and adds the site's hooks, Urchi.ts shows its canvas in a scene, attention.ts is what it looks at, acts.ts its small scripted acts, hours.ts his hours, mesh.json is its head
src/engine/common/       colour, loader and text helpers
src/lib/                 colour tokens, flags, motion, routes, viewport, the Last.fm poller (now.ts), the game's rules (threshold.ts), the last-visit memory and what's new (visits.ts), the Notes column's data, sentence and sediment (notes.ts), a record's colour read from its cover in OKLab (tone.ts), and which tab you are on and the slide taking you there (where.ts)
src/audio/sfx.ts         sound: the click and ambient bed from public/audio (the bed has its own lowpass, sfx.air, open at rest and shut to 700 Hz while the supernova's covers are out), synthesised cues (the counter's D/A chime, Urchi's low pats, Projects' plucked horizon and the supernova's bloom among them) and tick trains on the audio clock (Notes' riffle, the Projects ball's whirr, its ticks lifted in rate), and Music's preview voice with the bed ducking under it, whose door the room's colour keeps time with, and which plays on in its room when you leave (off by default, remembered in localStorage)
```
