# eigengrau

A minimal WebGL portfolio: five "pages" that behave like one app.

| Tab | Route | What it is |
|---|---|---|
| Space `1` | `/` | Urchi, the mascot, alone in a dark room, drawn large and smooth, at the screen's own resolution; wider than a phone, its head grows with the window to about half its height, eyes a little below the middle. It chooses what to look at: the pointer, a hovered tab pill, the sound chip when sound comes on, the spot where the pointer left the window, and faint one-pixel motes that drift through (tap the empty room to let one go). It looks rather than tracks: it notices things about 160ms late, its eyes turning first and its head after, a small turn quick and a big one slow; a mote's slow drift its eyes follow, a hand moving faster they jump after, as late again; resting its eyes on you, it looks away now and then, and back. Its blinks keep no beat: their gaps are log-normal, now and then two close together, now and then a long look without one. Tap a rhythm of three to eight taps there and it watches your hand, not the motes, then leans in and blinks the rhythm back, with a soft low pat for each blink if sound is on; the third time in a visit it adds a beat of its own, and tapping that version back earns a slow blink and twenty seconds of soft eyes. At night it only stirs. Come back to the tab after 45s or more away and you may catch it at something it wouldn't do while watched (at most once in ten minutes). Once per visit it looks up at a tab that changed since your last visit, and a caption says so ("Two new notes since 12 September."). It keeps his hours in `TIME_ZONE`: asleep 01:00-06:59 unless he is playing something (its head settles a little smaller and lower, as on a pillow), drowsy 23:00-00:59, dozing after 90s of stillness; while he plays something, it listens. Hovering it raises "Urchi / *his line*", and it reads the line and reacts. Besides its own face it has four more: woken from the night's sleep by a click a second time that night (the night's first wake in this browser is a groggy one instead: no stretch, heavy lids that clear over half a minute, a slow blink, slower to react), a mouse shaken over its face, thrown about on its line (three hard tugs or bumps in eight seconds) or home after its line snapped, it glares (angry: its lids down at a slant toward the nose, a pupil darker than its eye grown); caught in the act, or bumping a wall hard afloat, it squeezes its eyes shut into "><" (embarrassed); while he plays something it shuts its eyes, arched up, for a while at a time, thin-line notes rising from its ears; asleep for the night its head tips to one side and thin-line Zs drift off the ear that is up along a wave drawn afresh each night. It blinks into a glare and out again; a glare comes at most every 45 seconds and a fluster every 20. The faces show through the visor afloat; the notes and Zs only at home, and under reduced motion they hold still. Click it ("Take with you"; asleep, the first click wakes it) and it closes its eyes and dissolves through a pixel dither; a beat later it floats in from the left in its spacesuit, at 65% of the size the suited figure once stood in the room (40% on a phone), on a line from just past the left edge. Afloat it drifts, bobs and turns in zero gravity, and still looks at what it looks at; left alone, every so often it swims off somewhere else within its line's reach, head first in slow breaststrokes (arms swept down from a V beside its helmet, a frog kick), looking where it is going, and floats there until the next time. The room's edges catch it without a bounce. Hold it ("Hold") to drag it about, or fling it: it keeps its momentum, and the line, long enough for it to reach 60% of the way across (85% on a phone, where it floats nearer the middle), pulls taut with a little give, swings it round and tugs it back (a soft tug with sound on). Throw it hard enough and the line snaps: it flies off the page, and the head comes back home through the same dither with its eyes shut, and opens them slowly. Afloat, a thin slider on the right edge (or a wheel, a trackpad or a pinch) zooms it from a tenth to twice its size: afloat it and its line are always drawn in small square pixels (pixel level 1, 2 CSS px, the least anything afloat is drawn at, however close it comes), moving in whole-pixel steps, and past 40% its signal weakens, so the pixels grow a pixel at a time and fewer of them cross it the farther it goes; it comes home at its own size again. Behind it afloat is a painted night sky, which comes in with the float-in and goes with the flight home (never at home, in the empty beats between, or while the tabs slide): mostly tiny stars and a few large, warm white, pale blue and faint gold, each a soft core with a small glow, the brightest with a soft four-point glint, at three depths that the zoom moves by different amounts, drawn, like Urchi, in square cells of whole device pixels (level 1's at the least) in which every star is a small square block at its own brightness, and a glinting one a cross of cells in its stepped glow; when the zoom takes Urchi far out its signal weakens as Urchi's does: past 40% the farthest stars' cells grow first, then the middle ones', and the nearest keep their fine cells the longest. Each visit draws its own sky from a seed, kept through the visit's reloads, and now and then a rarer one: a Milky Way across it (one visit in five), a warmer sky with more gold glints (one in twelve), or a slow shooting star every so often (one in fifty). Over the stars hang small distant planets, two or three a sky, picked by weight from the kinds there are (so far one: an ocean world, clear turquoise sea under big anime cumulus, white on top and blue-grey underneath, that drift a little faster than it turns, with a soft white haze at its limb and a thin rim and bloom on its lit side). Each is a real sphere with a 2:1 equirectangular surface baked for the sky, turning slowly about a tilted axis under a sun that stays put, each at its own depth, nearer than any star: the zoom moves them more than the stars and the near ones most, drawn in level 1's cells like everything afloat, and zoomed far out each coarsens as the stars do, the far ones first. They keep round the middle of the page, clear of where Urchi floats, and nothing of them loads until it is first taken with you. Taken is remembered for the visit, so a reload finds it floating in again; it lives on Space only, and at night it dozes where it floats. A button over it does the same from the keyboard: Enter takes it, and afloat Enter sends it home and the arrow keys nudge it. With reduced motion it dithers in where it rests, a drag moves it without a fling, and a double click or tap sends it home. Afloat and awake, now and then something drifts by: 9 to 14 seconds after it floats in, and 20 to 40 seconds after the last one went, a faint glint comes up somewhere it could get to on its line, warmer than any star, its four arms slowly turning and breathing, and drifts across for a quarter of a minute. Urchi notices it first (a catch of the breath, its eyes wide a moment) and keeps going back to it, drifting a little its way: you follow its eyes there. Over it the cursor says "Catch it"; a click or tap on it (or Enter on Urchi's button, which says "Catch it" while one is out) sends Urchi for it, head first in its breaststroke and drawn straight at it too, the nearer arm reaching out and the mitten closing on it as the glint flares and goes. Only then is it decided what it was, by tier, as rare as the sky's own variants (common 70, uncommon 20, rare 8, top 2, among the tiers with something made), and in its tier something not caught yet if there is one. It grows out of the glove, held out to that side against the sky and turning, drawn in the cells Urchi is drawn in, and Urchi looks at it while the caption gives its name and line and a chime rises up the bed's notes, two for a common thing to five for the rarest; the rarer, the longer it looks. Something new then goes up into the sky, shrinking into the distance while Urchi watches it go, and hangs there from then on: on every visit after, each thing caught hangs somewhere of that visit's sky, clear of Urchi and the planets, over the planets and nearer than they are (the zoom moves it more), coarsening zoomed far out as they do; hover one (tap it on a phone) and the caption says what it is, and the magnet stone answers the pointer there too. Something it has already, it looks at, glances up at you, and lets go to drift off ("It has one already, and lets this one go."). Missed, a glint drifts on and goes, and another comes later; held, flung or sent home on the way, Urchi gives up and the glint drifts on a while. Under reduced motion nothing swims: the glint goes and what it was is there in front of Urchi at once. What it has caught is kept in this browser with a checksum over it. A list written by hand does not add up: the next thing Urchi catches is a forgery of something it claims, drawn twelve cells across with its rows slipping and its colours coming apart ("Forged frozen lightning. You didn't catch this one. You made it."), with a wrong note in its chime; after that everything the list claimed hangs in the sky as a forgery until the real one is caught. The console says where the list is kept to whoever opens it on Space, and has a word for whoever forges it. |
| Projects `2` | `/projects` | The wound horizon. One ink thread is wound into a ball sized to the screen, from his first year at the bottom to now at the top, where its loose end hangs still, at about 1.5 turns a year (nine at the least, so a short history is still a ball); wider than a phone, the heading and the ball stand centred between the tab bar and the page's foot. Each project is a mark at its year with its pieces hanging off it (dead work hangs inward); studies are unlabelled beads. Drag, the wheel or the arrow keys turn it (an arrow held past a moment spins it freely). Spin it hard for long enough, its surface faster than an LP turns (a drag, a trackpad or a held arrow; never a notched wheel or a trackpad's momentum), and it pulls in: smaller and faster, its rings drawn true and its pieces flat, the ticks climbing in pitch and, from halfway, running together into a whirr (heard with sound on). Let go short of the point of no return and it opens again with a sigh; past it, it drops to a knot, holds its breath and bursts: one ring, the thread flung out into filaments, and the projects settling into a loose contact sheet in date order, a faint year over each year's first, while the heading's tail says "Give them a minute." (with sound on, a soft bloom, and the bed goes through the wall). Hover, the arrows or a first tap choose a cover, with its caption beside it, clear of the others (on a phone, under the sheet); a click or Enter (a second tap) gathers everything and opens it. Past thirty projects the covers lie in year rows, as large as on the ball. Left alone six seconds (five on a phone), or at a drag, the wheel, Esc or a tap on empty space, everything is drawn back to the ball at once, as a magnet draws filings (nothing is wound): slow to leave, quicker as it closes, what lies nearest the centre first, each project docking with its tick; for 25 seconds after, it only tightens a little. Three to five hard flicks do it on a phone; with reduced motion it never happens. Hover (a first tap on a phone) shows the name, status word and one line under the ball; where the ball reaches that far, its rings thin beneath the words, and a pointer heading down to them keeps the choice a moment, so a click on the way still opens it. Click or Enter (a second tap) unspools it into a straight line (vertical on a phone) with its pieces and a "Case" link, and the line is plucked as it comes taut: its note is how long the project ran (D4 under a year, down the bed's notes to F3 at four years or more; heard with sound on), living work rings with a one-pixel standing wave, dead work thuds with one twitch. Esc winds it back. `/projects#slug` opens straight into a project. Case pages list the project's pieces. |
| Notes `3` | `/notes` | One column, newest first, his notes in serif and the site's own log lines in grotesk, headed by a sentence written from the tags ("Nine since August: three on psychology, ..."). Each tag word filters (`/notes?tag=psychology`). Typing anywhere finds; on a phone, tap "Notes". Notes that don't match fold into hairlines drawn to their length, one after another down the page, and open again back up it; with sound on, each gives a quiet tick, a thumb running down a card index, and clearing the filter closes softly. A dot marks notes newer than your last visit. Past `NOTES_FOLD_AFTER` notes, older months and years settle into one-line summaries. |
| Music `4` | `/music` | From Last.fm. While he is playing something, the sleeve alone in the centre, with a hairline that crawls over the song and an honest "About two minutes in.", and the week folded into the heading (the heading brings it back). Otherwise, the last played track and the week's ten songs in one stack, each sized by its plays. The heading is the week's single most unusual fact. With sound on, resting on a title plays its 30s preview "through the wall". Once its door has opened, the song stays in the room when you leave and plays to its end, heard through the other tabs' walls, more muffled the further you go and from Music's side; come back while it plays and the door reopens. Stay and the room takes the record's colour, on the door's clock: faint behind the wall, full when the door opens; his song's colour is the room's while he plays it. On a phone the first tap on a song chooses it and the second opens Last.fm. |
| About `5` | `/about` | One large serif statement with Urchi as the small mark after "too.", the status line, and three words beneath for elsewhere. |

A persistent chrome layer (monogram, pill tabs, sound chip) floats above page
panels that slide horizontally when you change tab, silently. Every tab you
visit stays loaded: leaving it pauses it where it is (Urchi afloat on its line,
the ball as you spun it, a note opened), and coming back finds it as you left
it rather than starting again. While they slide, and only then, faint one-pixel stars pass at about a third of their speed: the same
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
(monogram, name, role, statement, tabs, the projects with their status and
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
- `ITEMS`: Space's items by tier (common, uncommon, rare, top), each its
  `{ id, name, caption }`; an item is caught only once its model is made
  (`src/engine/items/`, listed in `items/index.ts`). `CATCH_LINES` is what
  the caption says of one Urchi has already, and of a forgery. `ITEM_NOTES`
  are the notes the top items are to unlock (placeholders, and not yet used).

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
on the keyless stores (the iTunes Search API, then Deezer's, which lists new
releases soonest: `api/songs.ts`) and proxies its preview same-origin; a 404
means silence, and is asked again after an hour. A sleeve Last.fm has no art
for (most new releases) is looked up on the same stores by `/api/now`. Nothing is fetched with sound off. The room's colour is read
from each cover in the browser (`src/lib/tone.ts`): a grey record leaves the
room grey, and a sleeve whose colour is only a small accent can be given its
hue in `OVERRIDES` there.

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

It has a spacesuit too, worn on Space when you take it with you: a low-poly helmet, suit and backpack built
from the head itself by `urchi/tools/build-suit.mjs` (the right half, mirrored; the helmet
fitted round the head, the ears and spikes folded in under it) and baked into
`src/engine/urchi/suit.json` (with the order its body grows in; its canvas frame into
`suit-frame.json`) with `npm run urchi:suit`, which also prints its checks. `setSuit` puts it on,
fetching the model the first time, so a visit that never sees the suit never downloads it (Space
fetches it as Urchi dissolves, and builds its rig a few milliseconds at a time in idle moments); in development `/dev/suit` shows it from all sides (a production build leaves
the sheet out altogether). As it goes on, the body grows from the neck ring along its surface, a
small part (a glove, a boot) coming on whole, and the helmet rises over a head whose ears are
already folded in.

What the site keeps in localStorage, every read and write guarded:
`eigengrau:sound` (sound on or off),
`eigengrau:visits` (`{ prev, seen }` in ms: when the last visit ended, and the
last activity; Space writes it and Notes reads it), `eigengrau:told` (the
visit Urchi has already pointed out what's new for), `eigengrau:along`
(`{ on, visit }`: Urchi taken with you, honoured only in the visit it was set in), `eigengrau:sky`
(`{ seed, visit }`: the visit's sky, the same way), `eigengrau:woken` (the night, as
`hours.ts` names it, this browser last woke Urchi from its sleep: a night's first wake is groggy) and
`eigengrau:found` (`{ items, forged?, sum }`: what Urchi has caught, each item's id and when it was first
caught, the ids it holds only as forgeries, and a checksum over both, salted in `src/lib/found.ts`; a
list that does not add up is a forgery, see Space above). In sessionStorage,
`eigengrau:tones` keeps each cover's colour for the visit.

The artwork in `public/work/` is screenshots of the projects themselves, each
project's cover and its alternate (shown on hover) 1000 x 1333, and each piece 640px
on its long side (twice the most it is shown at, for a 2x screen), all webp. The site began with generated placeholders in their
place; `scripts/gen-assets.mjs` still makes them (as `p01.webp`, `s01.webp` and so
on), should you want a blank start:

```
PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/gen-assets.mjs
```

The sky behind Urchi afloat is built in layers (`src/engine/space/sky/`): the
stars, and over them the planets. Its defaults are in `sky/defaults.ts`: any number or colour there
may be a `{ range: [a, b] }` that each visit's seed picks within, and the
variants and their odds (`weight`) are there too, and each depth's `pixelFrom` (the
zoom it coarsens from, 0 never; nearer in it keeps pixel level 1's cells, the least
anything afloat is drawn at) and `pixelMost` (its cell, CSS px, zoomed all the way out).
The pixel levels themselves (level 1, 2 CSS px, the new zero) are in
`src/engine/common/pixel.ts`. `/?sky=<seed>` forces a sky, to
share or debug one, and `/?planets=ocean` picks its planets instead of the seed
(a list, `ocean,ocean` for two, `all` for one of each, `none` for none); in
development `/dev/planets` shows each kind of planet close up and at the sky's
sizes, smooth and pixelated. In development, `/?debug=1` adds a panel on Space with a
control for every value: a die makes a value a range, a lock holds it while
Randomise rerolls the rest, a diamond makes it the current variant's own, and
"Copy config" copies the whole of `defaults.ts` as tuned (ranges, locks, variants
and weights) to paste over it. A production build leaves the panel out.

Space's items are small 3D models (`src/engine/items/`, a file each, loaded as their own chunks
when first wanted) sharing one look (`items/look.ts`); `items/sprite.ts` draws one into the room
among what is drawn there, on the room's pixel grid. In development `/dev/items?item=<id>` shows
one up close and at 96px, and on Space `/?glint` brings the first glint two seconds after Urchi
floats in and the next soon after the last, with `&catch=<id>` deciding what it turns out to be.

Fonts are self-hosted in `public/fonts/`: Inter Tight 500 (grotesk) and
Newsreader 300/400 (serif), as free stand-ins for the commercial faces. The
WOFF2 files feed CSS; the WOFF files feed the WebGL text renderer.

## Where things are

```
src/app/                 routes; each canvas tab page is only its accessible mirror (Notes is plain DOM and needs none)
src/app/api/now/         Last.fm: the track playing (its length, how far in, and whether that is sure), the last one played, the week's top songs and its one fact (fact.ts), { now, last, week }, empty on any failure
src/app/api/songs.ts     finding a song on the keyless stores (iTunes Search, then Deezer) for its preview and sleeve; only a confident match
src/app/api/preview/     a song's 30s preview from the stores, proxied same-origin and cached for a day; 404 (kept an hour) when no match is confident
src/app/api/cover/[id]/  album art proxied same-origin (Last.fm's, or a store's for a sleeve Last.fm lacks), cached for a day
src/components/Shell.tsx chrome + the horizontal page slider; every tab visited stays mounted, hidden and paused off screen (where.ts's setShown tells the pages)
src/components/chrome/   Nav, Tab (pill morph), FloatingLogo (exclusion blend), SoundChip, LiveIcon (the favicon's Urchi), Between (the stars between the tabs)
src/components/pages/    one client panel per tab: canvas + DOM overlays; NotesPanel and MusicPanel are plain DOM
src/engine/space/        Urchi's room (RoomScene), the intro's ring (IntroRing) and timeline (intro.ts), the motes (Motes.ts), call and response (Call.ts), and Urchi taken with you (Float.ts: the dither out, the float in, its zero-gravity physics, the hold and the fling, the line's pull and snap, the way home) on its line (Tether.ts); something drifting by and Urchi going for it (Catch.ts: the glint, the swim and the grab, what it caught shown and said, let go or sent up into the sky); sky/ is the sky behind it afloat: its layer manager (Sky.ts), what Urchi has caught hanging in it (Found.ts), the layers' contract (layer.ts), the stars (Stars.ts), the planets (Planets.ts, and planets/: each traced a pixel at a time on a square (body.ts), its surface baked on the GPU (bake.ts), the shaders they share (glsl.ts), a file per kind; loaded only once Urchi is taken), ranges, seeds and variants (tune.ts, seed.ts), the defaults (defaults.ts), and the ?debug=1 panel (debug/, development only)
src/engine/projects/     the wound thread (ThreadScene, which tells the page each phase of the supernova as a window `eigengrau:nova` event, `detail.phase`, for the spacesuit companion) and its edge-glass post pass (edgeGlass)
src/engine/about/        the statement, with Urchi as its mark
src/engine/urchi/        Urchi in the site: character.ts ports urchi/index.html and adds the site's hooks, Urchi.ts shows its canvas in a scene (and dissolves it through an 8x8 Bayer dither in its shader), attention.ts is what it looks at, acts.ts its small scripted acts, hours.ts his hours, mesh.json is its head, suit.json its spacesuit
src/engine/items/        Space's items: a file per item (its model and how it moves), the look they share (look.ts), glowing lines (lines.ts), the item sheet's pixelation (pixels.ts), and one drawn in the room (sprite.ts)
src/engine/common/       colour, loader, text and pixel-level helpers
src/lib/                 colour tokens, flags, motion, routes, viewport, the Last.fm poller (now.ts), the last-visit memory and what's new (visits.ts), the Notes column's data, sentence and sediment (notes.ts), a record's colour read from its cover in OKLab (tone.ts), which tab you are on and the slide taking you there (where.ts), whether Urchi was taken with you this visit (along.ts), and what it has caught (found.ts)
src/audio/sfx.ts         sound: the click and ambient bed from public/audio (the bed has its own lowpass, sfx.air, open at rest and shut to 700 Hz while the supernova's covers are out), synthesised cues (the counter's D/A chime, Urchi's low pats, its line's tug and snap and its catch's chime, Projects' plucked horizon and the supernova's bloom among them) and tick trains on the audio clock (Notes' riffle, the Projects ball's whirr, its ticks lifted in rate), and Music's preview voice with the bed ducking under it, whose door the room's colour keeps time with, and which plays on in its room when you leave (off by default, remembered in localStorage)
```
