## Free tools

Reviewed against the repo at `9b8c07c` ("Space: a sky behind Urchi afloat, starting with the stars"). Where another reviewed area already decides something (engineering's CSP and registry, security's proxies, style's Desk and tagline, the games' pill), this review defers to it and names the seam.

### Review verdicts

| Idea | Verdict | Why |
|---|---|---|
| The bench frame: `/tools` index, `/tools/<slug>` pages, one engine per tool, the colophon | KEEP WITH CHANGES | This is the right frame. Name the visible label "Tools", because every other label is a plain noun and the route is `/tools`. Keep "bench" as the name in the code. Tools need a `shown` prop and must stop their frames when hidden, in case they live inside a Desk. Reduced motion has to be watched live. |
| Ways in: a fourth word under About, a Notes log line, Urchi's news, "Bench" on the thread | KEEP WITH CHANGES | `ELSEWHERE` renders every entry as an off-site `target="_blank"` link (`AboutPanel.tsx:71-81`), and "Elsewhere" means off-site anyway. Link the words "small tools" in `TAGLINE` instead; style R2 already puts the tagline on About. Keep the Notes line, the news hook and the thread project. |
| The privacy line: a live network watch, CSP and lint | KEEP WITH CHANGES | It is the best idea here, and it doubles as security work. It had three errors. A path-scoped CSP only binds on a hard load, because the site is one long-lived document. The watch cannot see WebSockets. And at 35% ink the line reads at about 2.9:1, so it fails AA. Rely on engineering's site-wide `connect-src 'self'`, and set the line at 60% ink (6.0:1). |
| State in the link, memory, and "Take" | KEEP WITH CHANGES | A query string is sent to the server when the link is opened, so "the word never leaves the page" was false for shared links. Anything personal (a word, a place, a date) goes after the `#`. Settings stay in the query. On a desk "Take" downloads; the share sheet is for touch. |
| The kit, `src/components/bench/` | KEEP WITH CHANGES | Text at 35% fails contrast. Pad and Plot were missing (Cues and Settle need them). Letter keys must be switchable (WCAG 2.1.4). Build each part when a tool first needs it, not all thirteen up front. |
| 1. Sky | KEEP WITH CHANGES (build first) | It is unique to this site, the engine is ready, and it leaves with the visitor as a wallpaper. Five fixes. Version the sky, or a retune changes every word's sky. Past 5,760 CSS px the export runs out of stars. A phone sees only about 80 stars, so it needs a denser preset. Space never re-reads its seed, so "Put it behind Urchi" needs a hand-off. The twinkle cannot loop by rounding speeds. |
| 2. Grain | KEEP WITH CHANGES | A crowded genre, but linear light, OKLab matching and the dissolve GIF set it apart in ten seconds. It was over-scoped for M: camera, SVG, CSS and e-ink bytes move to a second pass. The "fraction of a JPEG" claim becomes a live, honest size readout. |
| 3. Cues | KEEP WITH CHANGES | Rare and personal. It must never call `sfx.set(true)`. That starts the ambient bed and remembers sound as on for the whole site, and phones have no chip to turn it off (`globals.css:237-241`). Cues gets its own AudioContext. The buffer test needs a seeded RNG. Cut the latency calibration. |
| 4. Tone | KEEP WITH CHANGES | Cheap, and it explains the Music room. Cut the palette of five, which is a Coolors clone and contradicts "the one colour". Cut "Or name a record", which widens the proxies security wants closed. The floor must adapt to the visitor's own ground and ink. |
| 5. Quieter | CUT | It is Hemingway, alex and write-good with house taste, and it is the least "cool" tool on the list. It also preaches a voice that the site, largely written with Claude Code, speaks, not one visibly his: his only notes are "i got a free burrito heh" and "hi". Salvage: run its rules on log lines in `npm run note`. |
| 6. Facets, Trace mode | CUT | L effort against vtracer, potrace and Vectorizer.AI. The claimed engine is not really there: `trace-ref.mjs` is about fifty lines inside a `page.evaluate`, keyed to magenta and blue reference art, and traces each region on its own, which is exactly the gap-prone method the proposal warns against. |
| 6. Facets, Facet mode | CUT (parked) | Low-poly photo generators are a crowded toy genre, and the planes-and-rim twist is unproven. Revisit after four tools have shipped. |
| 7. A week | KEEP WITH CHANGES (later) | It is the site's most personal engine opened to everyone, and the card is a social object. It must fit security's fixes. There are no previews for strangers' weeks (F3). Covers go through minted ids (§2.5). ListenBrainz goes through the same route, because `connect-src 'self'` blocks it in the browser. MusicPanel (1,442 lines) needs pieces extracted first. |
| 8. Settle | KEEP WITH CHANGES (later) | The tagline's middle word is "motion". A table of one spring in every dialect, plus a live interruption demo, is uncommon and exactly his craft. Every mapping must come from each library's source and be tested. Moved up from 8th to 5th. |
| 9. Tab | CUT | RealFaviconGenerator already does this well, and animated favicon states are a gimmick few will ship. Salvage the craft as a write-up: publish `lidLine` and `live-icon.js` as a note and a snippet. |
| 10. That night | KEEP WITH CHANGES (stretch) | The one real sky, for a site named after darkness, and a well-loved kind of gift given free. L effort. Version one has no planets and no SVG. Stars' haze is a straight quad (`Stars.ts:120-130`), so the Milky Way cannot follow an arc in a round projection. The geolocation permission conflicts with engineering's policy. |
| "Considered, and cut" (tap tempo, numbers to words, banding fixer, glass generator, QR, the security tools, rhythm game, make-your-own-Urchi) | KEEP | Every cut there is right. The rhythm game belongs to the games, which must stay free of Urchi. The security tools share this frame, as described below. |

#### Checked against the repo

1. **No digit shortcuts exist.**
   - The pills are plain `<Link>`s (`Nav.tsx:33-37`, `Tab.tsx:46-57`), and no `keydown` handler anywhere reads digits. The games review measured this in Playwright.
   - "Tools never use digits" is still a good rule, because style R3 proposes adding keys 1 to 5. The premise was wrong, though.
2. **`sfx.set(true)` is not a neutral "on" (`sfx.ts:1286`).**
   - It calls `ambientStart()`, which fetches `/audio/ambient.mp3` and loops the bed.
   - It writes `eigengrau:sound = 1` for every future visit.
   - At 1024px wide or less the chip has `display: none` (`globals.css:237-241`), so a phone visitor would have no way to turn it off.
3. **A CSP scoped to `/tools/*` only applies to a hard load.**
   - Shell keeps one document alive (`Shell.tsx:128-133`), so a client-side trip from `/` to `/tools/grain` runs under `/`'s policy.
   - Engineering's site-wide `connect-src 'self'` (reviewed `engineering.md` §3.1) already makes the claim true on every document, and its probe found no connect violations. Drop the path variant.
   - Engineering's `Permissions-Policy` sets `camera=()` and `geolocation=()`. That would block Grain's camera and That night's "Here". Both need `(self)`.
4. **Query strings are sent to the server.**
   - Opening `/tools/sky?w=darius` puts "darius" in the host's request log.
   - Only a fragment (`#w=darius`) stays in the browser.
5. **Sky is not "the same today and next year".**
   - `Sky.apply()` resolves each word against the live `defaults.ts` (`Sky.ts:172-185`), which the owner retunes through `?debug=1`'s "Copy config".
   - Any retune redraws every word's sky. It needs frozen versions.
6. **"Put it behind Urchi" does not work as written.**
   - The seed is read once, in the Sky constructor (`Sky.ts:89`).
   - `alongOn()` is read once, at mount.
   - A hard load of `/` plays the intro unless Urchi is along (`CreativeSpacePanel.tsx:166`).
   - Since most visits start on `/`, Space is usually mounted already, and a link to `/?sky=darius` changes nothing.
7. **Big Sky exports run out of stars.** Stars are laid out only 4 fields across (`FIELD_MOST = 4`, `FIELD = 1440`, `Stars.ts:64-69`), which is 5,760 CSS px. Past that the edges are empty. The pixel ratio must be chosen so the CSS size stays inside.
8. **A phone's sky is sparse.**
   - `count` is per 1440² field. A 390×844 screen sees about 16% of one field, so about 80 stars.
   - Glints scale with the root of the area (`Stars.ts:400-401`), so there are two to four of them. `phone-03-space-afloat.png` shows exactly this.
   - A lock-screen preset has to raise both.
9. **The twinkle cannot be looped by rounding speeds.**
   - It is `sin(a)·sin(0.61a + …)` (`Stars.ts:135-136`), and the 0.61 factor never closes a cycle with the first.
   - Loop by crossfading instead.
10. **Colours will differ unless the tool uses the site's renderer.** Build it with `makeRenderer` (`loader.ts:107-114`), which writes raw `LinearSRGBColorSpace` output.
11. **The voices are not deterministic.**
    - `snapWave`, `tab`, `focus` and `close` (`sfx.ts:110, 121-123`) and the thud's knock (`sfx.ts:1111-1118`) all call `Math.random()`.
    - A buffer-for-buffer test needs an injected, seeded RNG. `rng` in `tune.ts:88` will do.
12. **OG images cannot be made "at build time" with Playwright.**
    - `scripts/gen-assets.mjs` is run by hand, needs a local Chromium and ffmpeg, and its output is committed.
    - Vercel's build has no browser.
13. **Live index thumbnails are too heavy.** Sky and Grain run on WebGL, not a 2D canvas, and five live WebGL thumbnails is too much. Use stills that loop only on hover.
14. **Text at 35% ink is about 2.9:1 on eigengrau** (computed). At 60% it is 6.0:1, as style measured. That makes the privacy line and the Readout labels, as proposed, fail AA.
15. **ListenBrainz "entirely in the browser" conflicts with `connect-src 'self'`.** It has to go through the week route.
16. **"Or name a record" (Tone) and A week's previews lean on the open proxies.** They would use `/api/songs`, `/api/cover` and `/api/preview`, which security flags as F1-F3.
17. **Reduced motion is read once.** `prefersReducedMotion()` (`motion.ts:19-22`) has no change listener (engineering noted this). Tools switch live.
18. **Small reference slips:**
    - `GLINT_AREA` is `Stars.ts:73`; line 400 is where it is used.
    - Last.fm's `call()` is `now/route.ts:73`.
    - `RHYTHM` (`Call.ts:16`) is not exported.
    - `mp4-muxer`'s author now points to its successor, Mediabunny. Check which is maintained when the loop is built.
    - The repo has no LICENSE, so "MIT" on exported code is the owner's call. See question 2.
19. **Everything else checks out.**
    - The tone.ts line numbers: `labOf :48`, `deltaE :82`, `toneOfPixels :114`, `read :166`, `CAPS :341`, `MIN_CONTRAST :346`, `underGrain :361`, `bend :392`, `Spring :417`, `dither :463`.
    - The dither GLSL (`Urchi.ts:17-22`), `magnet` (`ThreadScene.ts:688`), `weekFact` (`fact.ts:129`), `said` (`fact.ts:54`), the Writer (`notes.ts:87`), `lidLine` (`LiveIcon.tsx:119`), `SLEEP` (`:20`), `countWord` (`site.ts:201`), `whatsNew` (`visits.ts:167`) and `urlSeed` (`seed.ts:31-35`).
    - The hash chain: FNV-1a, then murmur3's finaliser, then mulberry32 (`tune.ts:57-88`).
    - The 40 ms tick throttle (`sfx.ts:25`) and commit `0c8268c`.

### Refined proposal

# Tools

Seven small, free instruments that run in the visitor's browser. Each is one of the site's own engines turned outward, and each ends by showing where that engine runs on the site.

The tagline already promises them: `TAGLINE` (`site.ts:9`) reads "Interfaces, motion and small tools, built with care." Today it is only the meta description and the sr-only mirror on `/` (`layout.tsx:10`, `page.tsx:10`). Once style R2 puts it on About, "small tools" becomes the door.

The security tools ("Headers, read", "A token, opened" and the rest, from `security.md` §4) use the same frame, kit, registry and privacy line. Their content is the security reviewer's, so this document covers only the seam.

---

#### At a glance

| Rank | Tool | Route | Pitch | Made from | Effort |
|---|---|---|---|---|---|
| 1 | **Sky** | `/tools/sky` | Every word draws its own night sky. Take one for your screen. | `engine/space/sky/` (Stars, tune, seed, defaults), `makeRenderer` | M (3 days) |
| 2 | **Grain** | `/tools/grain` | Any picture, in as few colours as it can bear. | the Bayer dither in `engine/urchi/Urchi.ts`; OKLab and the grain in `lib/tone.ts` | M (4 days; a second pass of 2) |
| 3 | **Cues** | `/tools/cues` | Small sounds for interfaces, all in one key, and the rhythm to play them in. | the voices in `audio/sfx.ts`, the rhythm reading in `engine/space/Call.ts` | M-L (5 days) |
| 4 | **Tone** | `/tools/tone` | The one colour a picture would lend a dark room. | `toneOfPixels`, `bend`, `contrast`, `Spring` in `lib/tone.ts` | S-M (2 days) |
| 5 | **Settle** | `/tools/settle` | One spring, written in every dialect motion is written in. | `Spring` (tone.ts), `magnet` (ThreadScene.ts), `EASE`/`DUR` (motion.ts) | M (3-4 days) |
| 6 | **A week** | `/tools/week` | Anyone's week of listening, in one honest sentence. | `api/now/fact.ts`, `lib/tone.ts`, MusicPanel's parts | M (3-4 days, one small route) |
| 7 | **That night** | `/tools/that-night` | The real sky over a place, on a night that mattered. | the look of `Stars.ts`, plus new astronomy | L (7-8 days for version one) |

**Build first:** the frame (two days), then Sky, Grain and Cues, then Tone as a cheap fourth. That is about sixteen working days.

---

#### What it holds to

1. **One engine, one tool.**
   - Every tool is something the site already does in front of visitors.
   - Every page ends by saying where the engine runs: "This is how Urchi leaves the room."
2. **Nothing leaves the page while you use it.**
   - Pictures, text and sounds are made in the browser and forgotten when the tab closes.
   - A link carries anything personal only after the `#`, the part browsers never send.
   - The one exception, A week, says so above the fold.
3. **The link is the state.**
   - Settings go in the query: short keys, fixed precision, colours as six hex digits.
   - Personal input goes in the fragment: a word, a place, a date.
   - The page says which is which.
4. **"Take" is the verb, with the tool's own noun:** "Take the sky", "Take the picture", "Take the sound", "Take the colour". The site already says "Take with you".
5. **Two colours for the chrome.**
   - Content may be in colour: a picture, a swatch, a sky.
   - Controls, labels and hairlines are ink on eigengrau.
   - Anything that carries meaning is at least 60% ink (6.0:1).
6. **Works with a thumb.**
   - Every tool works at 390px.
   - On touch, Take goes through the share sheet, so a picture lands in Photos. On a desk it downloads.
7. **Keys only where you are.**
   - Letter keys work only while focus is inside the tool and not in a text field.
   - The Keys card can turn them off, which WCAG 2.1.4 asks for.
   - Digits are left alone for the tabs (style R3 proposes 1-5).
8. **Two switches for sound, never crossed.**
   - The chip governs the sounds the site makes at you.
   - Play in Cues governs the sounds you ask for, on its own audio context.
   - No tool ever flips the chip.
9. **No accounts, no watermark, no metadata.**
   - A PNG taken from here carries nothing, not even his name.
   - The one exception is A week's card, which is a social object; its credit can be turned off.
10. **Honest numbers.**
    - Timings and sizes are measured: "Dithered in fourteen milliseconds."
    - Nothing gets graded.
11. **Motion is watched live.** A tool listens to `matchMedia("(prefers-reduced-motion: reduce)")` for changes and settles at once when it flips.

---

#### Where the tools live

##### Routes and the room

- **Routes.**
  - `/tools` is the index and `/tools/<slug>` is each tool.
  - Each page is a server component with its own `metadata`, a real-HTML heading and the colophon, so search engines and screen readers get the substance.
  - The tool itself is a client component loaded with `next/dynamic` and `ssr: false`, since WebGL and audio need a browser.
  - The pages follow the case pages (`src/app/projects/[slug]/page.tsx`), wearing the same `case-rim`s top and bottom.
- **Two homes, one codebase.**
  - **If the Desk lands** (style R16, engineering §4.5): Tools is a drawer in it. The Desk panel owns `/tools/*` through the `owns` list, so a tool stays mounted with the Desk and keeps its state like any tab. It must then pause when hidden: each tool takes a `shown` prop from `onShown` (`where.ts:64`) and stops its frames.
  - **If it does not:** Shell gives each `/tools/<slug>` a throwaway panel, shown at once with no slide (`Shell.tsx:128-133`). No pill lights, and the tool keeps its last input in module scope for the visit.
  - Either way, the tools keep their own URLs, because strangers arrive from search and from shared links.
- **Navigation is client-side,** with `next/link`. There are no hard loads: a song playing through Music's wall keeps playing, and Urchi stays afloat.
  - The CSP holds anyway, because it is site-wide.
  - This differs from the security review's advice for `/break`, whose demos need their own document. Tools do not.
- **The games stay separate.** The owner wants the daily games apart from Urchi, and the index does not list them. The Desk may show both drawers; this document does not mix them.

##### Ways in

- **About.**
  - When style R2 puts `TAGLINE` under the status line (12px grotesk at 60% ink), the words "small tools" in it become a link to `/tools`, with the site's 1px underline at 35% ink.
  - "Elsewhere" keeps its three words, because it means off-site.
  - If the Desk lands, its pill is the main door and this link is the quiet one.
- **Notes.** One site log line in grotesk whenever a tool lands, tagged `site`:
  - "A sky to take away."
  - "Grain: the dither Urchi leaves through, for any picture."
- **Urchi's news.**
  - Add `tools: "YYYY-MM-DD"` to `UPDATED` (`site.ts:99`) and a template to `URCHI_NEWS` (`site.ts:83`): `tool: "A new tool since {date}."`
  - `whatsNew` (`visits.ts:167-187`) pushes `{ href: "/about", date: UPDATED.tools }`, or `/desk` if that exists, with the tool line.
  - Urchi then looks up at that pill once in the visit, as it already does for notes.
- **Projects (optional).**
  - Add "Tools" to `PROJECTS` as a real project ("alive since 2026", why-line "Small things I made for other people. They keep no data.").
  - Each tool is a `SPACE_ITEMS` piece with `project: "tools"`, and its cover is made by the tool itself: a Sky, a Grain of a photograph, a Cues waveform.
  - This fits alongside the real GitHub projects now being added, because it is real work.

##### The index, `/tools`

- **Heading.** The Notes pattern: the grotesk label "Tools", then a serif sentence written from the registry with `countWord`.
  - "Four, free. What you give them stays on this page."
  - Once A week exists: "Seven, free. What you give them stays on this page, but for one, which says so."
  - With the security tools on the same index: "Six to make things with, and five to take things apart."
- **At night.** In Urchi's night hours (`clock().hours === "night"`, `hours.ts:31-44`) the sentence gains a clause in the voice of `URCHI_STATES`: "It is 3:12 here, and Urchi is asleep. These keep no hours."
  - `TIME_ZONE` is still null (`site.ts:16`), so "here" is the visitor's own hours, exactly as on Space.
- **Rows.** One per tool, in the Notes column's width, in rank order, grouped under two grotesk 11px labels at 60%: "To make" and "To check".
  - On the left, a 56px thumbnail.
    - It is a still WebP. On hover or focus it becomes a two-second muted `<video>` loop, made by the tool itself through a local script (`npm run tools:thumbs`, the way `gen-assets.mjs` works) and committed.
    - No live WebGL runs on the index. Under reduced motion the thumbnails stay still.
    - The Cues row plays its cue on hover through `sfx.play`, only with the chip on, like Music's previews.
  - Then the name in serif 20px and the pitch in grotesk 12px at 60%.
  - On the right, when it was made, in grotesk 11px at 60%: "2026.10", the date style Notes uses.
  - Hovering a row raises the cursor label "Open" (`src/components/CursorLabel.ts`, desktop only).
- **Foot.**
  - The privacy line.
  - "How these are kept": a link to security's `/kept` once it exists.
  - In development only, `/dev/tools`: the kit in every state, as `/dev/suit` shows the suit (`src/app/dev/suit/page.tsx`, which answers 404 in production).

##### A tool page, top to bottom

1. **Heading.** Grotesk label, then a serif sentence: "Grain  Any picture, in as few colours as it can bear."
2. **The tool.** Full width. Sky goes full bleed behind its controls.
3. **The caption.**
   - One serif line under the preview, in an `aria-live="polite"` region, saying what just happened: "Dithered in fourteen milliseconds. Two colours, 1,024 by 683."
   - Sentences count in words up to ninety-nine; readouts use digits.
4. **The colophon.**
   - Below the fold, three to six serif sentences at 60% ink.
   - It covers how the tool works, where the engine runs on the site, the file it came from (linked, if the repo is public), libraries and licences, how much was fetched to open it, when it was made and in how long, and its keys.
   - Grain's reads:
     > Made from the dither Urchi leaves through (`src/engine/urchi/Urchi.ts`). An eight by eight Bayer matrix is three two by two matrices added, each a quarter the weight of the one before: sixty-four thresholds laid over the picture. Colours are matched in OKLab, where distance is how different two colours look, and the error is spread in linear light, so a middle grey stays a middle grey. The GIF encoder is gifenc (MIT). Twenty-eight kilobytes, fetched when you opened this. Made in October 2026, in four days.
5. **The privacy line.**

##### The privacy line

Every tool page ends with one grotesk 11px line at 60% ink (6.0:1): **"Asked of the network since you opened this: nothing."** Three things make it true rather than decorative.

- **The watch** (new, `src/lib/bench/watch.ts`).
  - A `PerformanceObserver` watches `resource` entries (`buffered: false`) from the moment the tool mounts, and sorts each one.
  - **The tool's own chunks and worker,** fetched as it opened, are counted apart: "The tool itself: 31 KB, fetched when you opened this." This comes from `transferSize`.
  - **The site's own traffic** is named rather than hidden.
    - `/api/now`: Space and Music poll it through `pollNow` (`now.ts:83-117`) while the document is visible, whichever tab is shown. "One request since you opened this: /api/now. That was the site asking what he is playing, not this."
    - Next's `?_rsc=` prefetches for links in view: "Two requests, both this site fetching its own pages ahead of you."
  - **Anything else** turns the line to full ink and names the URL. A test makes sure this never happens.
  - The colophon says what the watch cannot see: "It sees what the browser lists. The page's policy stops the rest from leaving."
- **The policy.**
  - Engineering's site-wide `connect-src 'self'`, with `img-src 'self' data: blob:` and `worker-src 'self' blob:` (reviewed `engineering.md` §3.1), is true on every document, so no path-scoped variant is needed.
  - Change its `Permissions-Policy` to `camera=(self)` and `geolocation=(self)`. Grain's camera and That night's "Here" ask only when pressed.
- **The code.**
  - Engineering's lint rule under `src/tools/**`: `no-restricted-globals` and `no-restricted-properties` for `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `navigator.sendBeacon`.
  - One exception file, for A week's client.
  - Its end-to-end test `e2e/tools-offline.spec.ts` uses every tool with a fixture and asserts that nothing unknown went out.

This is where the tools and the security work meet. The page shows the instinct; `/kept` explains it.

##### State, memory and sharing

- **Settings** (new, `src/lib/bench/state.ts`).
  - `useToolState(schema)` keeps settings in the query and personal input in the fragment.
  - Writes are debounced (200ms) through `history.replaceState`, as `Sky.reroll` does for `?sky=` (`Sky.ts:159-162`).
  - "Copy link" answers "Copied. It carries the settings, not the picture." For Sky: "Copied. Your word is after the #. Browsers keep that part to themselves."
- **Memory within a visit.**
  - Each tool keeps its last input in module scope, so a trip to Music and back finds it: "Still here. It never left the page."
  - Pictures are held as `ImageBitmap`s and closed when a new one is dropped.
- **Across visits.**
  - Per-viewer settings live in `localStorage` under `eigengrau:bench:<slug>`, every access guarded, as the README describes for the site's other keys.
  - Pictures and sounds are never stored.
  - A remembered word or place always comes with "Forget it".
- **Exports** (new, `src/lib/bench/take.ts`).
  - On a coarse pointer, it uses `navigator.share({ files })` where `canShare` allows, which puts a PNG one tap from Photos on iOS.
  - Otherwise, and on every desk, it uses `<a download>`.
  - Filenames are plain: `sky-darius.png`, `grain.png`, `cue-pluck-d4.wav`.

##### Weight and speed

- Each tool's code loads only on its route, under about 60 KB gzipped, not counting three.js, which anyone who came from Space already has.
- Heavy work goes to Workers: `new Worker(new URL("./x.worker.ts", import.meta.url), { type: "module" })`. That pattern is supported by Turbopack, Next 16's default. Check it under both `next dev` and a real build.
- **One WebGL context per tool,** made with `makeRenderer` (`loader.ts:107`).
  - On unmount: `renderer.dispose()`, then `renderer.forceContextLoss()`. Space, Projects and About already hold contexts in hidden panels, and iOS evicts the oldest past a handful.
- **The registry.** Engineering's `src/tools/index.ts` (`meta.ts` per tool) drives the index, `sitemap.ts` and the OG images.
  - OG images are committed PNGs made by the tools through a local Playwright script (`npm run tools:og`), or `next/og` where the image is only type.

---

#### The kit: tool parts on the site's tokens

- **Where.**
  - New components go in `src/components/bench/`, shown in every state on `/dev/tools` (development only).
  - Build each part when the first tool needs it:
    - **Sky:** Dial, Choice, Take, Link, Caption, Sheet, Keys, Colophon, Watch.
    - **Grain** adds Well, Split, Swatch and Readout.
    - **Cues** adds Pad and Plot.
- **Tokens.**
  - Only the site's own: `--bg`, `--ink`, `--glass-bg`, `--glass-blur`, `--r` (4px), `--gutter` (8px), `--bottom-ui` (`globals.css:36-55`).
  - Ink comes at five strengths, as new tokens made with `color-mix(in srgb, var(--ink) N%, var(--bg))`: 100, 60, 35, 20 and 8%.
  - 100 and 60 are for text. 35 is for underlines and inactive marks that repeat a label elsewhere. 20 and 8 are for hairlines and fills.
- **Type.**
  - Serif for sentences, grotesk for labels and readouts.
  - If style's monospace lands (reviewed `style-ux.md` C), it takes hex values, hashes and tool output, and nothing else.

| Part | What it is | Look | Hands and keys | Sound (chip on only) |
|---|---|---|---|---|
| **Well** | The drop target that fills an empty preview. | A 1px dashed hairline at 20%, inset by the gutter, 4px radius. Serif 20: "Drop a picture here, paste one, or choose one." Grotesk 12 at 60%: "It stays on this page." Dragged over, the hairline goes to 60% and the words become "Let go." | Drop; click to choose; paste anywhere on the page; `o` to open. | `focus` when a file is taken in. |
| **Dial** | A number, set by hand. | A 32px row: the label on the left (grotesk 12, 60%), the value on the right (grotesk 12, tabular). Under it a 1px track at 20%, the filled part at 60%, and a 7px ink dot: the Space zoom slider laid flat. | Drag anywhere on the row. Arrows ±1 step, Shift ×10, Home and End. Double-click the value to type one. `role="slider"`, with `aria-valuetext` as a sentence ("Cell, four pixels"). | `tick` on each detent, already throttled to one per 40ms (`sfx.ts:25`). |
| **Choice** | One of a few. | The tab pills: 7px sides, 4px radius. The chosen one is glass; the others are clear at 60%. | A radiogroup; arrow keys move the choice. | `tick`. |
| **Swatch** | A colour. | A 20px square with 4px radius. A 1px inset hairline at 20% when it is within ΔE 0.05 of the ground, so eigengrau shows on eigengrau. | Click copies hex ("Copied #16161d."). Alt-click copies `oklch()`. Long-press on a phone. | none |
| **Split** | Before and after. | A 1px vertical line at 60% with a 7px dot at its middle. "Before" and "After" in grotesk 11 at 60% in the top corners. | Drag, or arrows when focused. `\` flips between the two. | none |
| **Take** | The export. | A glass pill with the tool's noun: "Take the sky". A caret opens the formats in a glass list ("as a PNG, 1179 by 2556"). While working: "Taking…" over a hairline bar. | `s`; ⌘S is caught only while there is something to take. | `done` (the counter's D then A, `sfx.ts:125`). |
| **Link** | Copy the state. | Grotesk 12: "Copy link" becomes "Copied. It carries the settings, not the picture." | `l`. | none |
| **Caption** | What just happened. | Serif 15, one line, `aria-live="polite"`. It changes with the site's word rise (`Mask.tsx`), instantly under reduced motion. | none | none |
| **Readout** | Facts. | Label and value rows, grotesk 11, tabular figures, both at 60% or more (label 60%, value 100%). | Select and copy. | none |
| **Sheet** | The phone's controls. | Glass, 4px top radius, two detents: a peek of 88px (the main control and Take) and open at 60% height. A 24×2 hairline handle. It sits above `--bottom-ui` and the safe area. | Drag, or tap the handle. | none |
| **Keys** | What the keys do. | A glass card: keys in grotesk 12, meanings in serif 15, and a last line "Letters as keys: on. Turn off." | `?` opens it, Esc closes it. The switch is kept on the device. | none |
| **Colophon** | How it was made. | Serif 15 at 60%, at most 60ch. Links underlined 1px at 35%. | none | none |
| **Watch** | The privacy line. | Grotesk 11 at 60%; full ink if anything unknown left. | none | none |
| **Pad** (new) | Somewhere to tap a rhythm. | A 160px square (full width on a phone, 120px tall) with a 1px hairline at 20%. Each tap leaves a hairline ring that fades in 300ms; none under reduced motion. | Pointer or Space bar. Taps are timed from each event's own `timeStamp`. | Only Cues' own context. |
| **Plot** (new) | A curve or a waveform. | A 1px ink line on hairline axes at 20%, with a 1px playhead at 60%. Under reduced motion the playhead is a fixed marker. | Hover reads the value at that point into the Readout. | none |

- **Motion** comes only from `DUR` and `EASE` (`motion.ts`), and is instant under reduced motion.
- **Common keys** (inside the tool, not in a field): `o` open, `s` take, `l` copy link, `r` roll or reset, `[` `]` step the main dial, `\` before and after, `?` keys.

---

#### 1. Sky

**Pitch.** Every word draws its own night sky. Take one for your screen.

**Who it's for.**
- Anyone who wants a wallpaper that is theirs rather than a stock photo.
- Visitors who took Urchi afloat and want the sky behind it.
- The curious: what does my name look like?
- Gift-givers: a partner's name as a lock screen.

##### What it does

- **A word field.**
  - It takes any string up to 64 characters, the limit `urlSeed()` already uses (`seed.ts:31-35`).
  - Empty, it shows this visit's sky (`visitSeed()`, `seed.ts:38`), the one Space drew: "This visit's sky. Type a word for yours."
- **The sky, drawn at once and full bleed,** by the same layer as Space afloat: soft cores, glow, four-point glints, three depths, and twinkle.
- **What was drawn, in a sentence.** The odds come straight from the variant weights in `sky/defaults.ts:10-31` (70, 20, 8, 2 of 100). Star counts are read from what is actually in view, so the numbers are true for this screen:
  - "darius. A common sky: eighty-one stars on this phone, four bright enough to glint."
  - "Uncommon. One word in five draws a Milky Way."
  - "Rare. About one word in twelve draws a sky this warm."
  - "Very rare. One in fifty. Wait for it." A shooting star crosses every sixteen to thirty-two seconds (`shooting.every`).
- **"Find a rarer one".**
  - It tries "darius 2", "darius 3" and so on, hashing only, with nothing rendered, until a rarer variant comes up. Variants are ordered by weight.
  - "darius 14 draws a warm sky. It took fourteen tries."
  - It stops after 500. The chance of no very rare sky in 500 tries is about four in a hundred thousand.
- **"More": the `?debug=1` panel cut to five dials.** Each is a `Patch<StarsConfig>` laid over the word's variant with `merge()` (`tune.ts:39`).
  - Stars: density, a scale on `count`, ×0.5 to ×3.
  - Size: `size.bias`.
  - Warmth: the palette mixed toward the rare variant's (`defaults.ts:20-25`).
  - Glints: `sparkle.count`.
  - Milky Way: off or on, and its angle.
  - Once any dial is touched the sentence reads "darius, tuned", and Reset appears.
- **"For a phone" (on by default on a phone).**
  - A lock screen of eighty stars and two glints looks empty (`phone-03-space-afloat.png`).
  - This preset multiplies density by 2.5, and divides `sparkle.count` by the room's glint scale (`Stars.ts:400`), so the phone gets six to eight glints rather than two to four.
  - The sentence says so: "darius, for a phone: denser, as a lock screen wants."
- **"Leave room for the clock".**
  - Glints keep out of the top 30%, where a lock screen's clock sits.
  - This is a new optional `sparkle.clear` (a share of the height, default 0, so Space is unchanged), read in `lay()`'s glint pick at `Stars.ts:398-399`.
  - The Milky Way stays where the word put it.
- **Ground.**
  - Eigengrau `#16161d`, the `backdrop` in `STARS` (`defaults.ts:41`), or: "True black, for an OLED phone. Eigengrau is the grey the eye sees in the dark; a screen can do better."
  - This is only `backdrop: "#000000"` in the patch. The layer already reports it (`Stars.ts:329-331`) and the tool clears to it.
- **"Put it behind Urchi".**
  - It takes the visitor to Space with this word's sky, and Urchi out on its line.
  - At night: "It is asleep. The sky is kept for when you take it out."
  - Tuning does not travel: "Space draws the word, not your tuning."
- **Later: "Take a moving one".**
  - A twelve-second loop (MP4 through WebCodecs; the muxer is mp4-muxer or its successor, Mediabunny).
  - The twinkle is `sin(a)·sin(0.61a + …)`, so it cannot close by rounding speeds. The last 1.5 seconds crossfade into the first. That is invisible on stars, and it is how seamless loops are usually made.
  - The shooting star is placed from the seed in the loop, not `Math.random()`, so the loop is the same every time.

##### How it goes

- **Desktop.**
  - The word field sits bottom-left in a glass pill, with the sentence under it and Take on the right.
  - The sky redraws on each keystroke, debounced 60ms. `setup` lays out the stars in view in a few milliseconds.
  - Keys: `r` rolls a new word, `s` takes, `l` copies the link, `m` opens More.
- **Phone.**
  - The sky fills the screen, with the field in a Sheet above the safe area.
  - Take opens the share sheet with the PNG. "Save Image" puts it in Photos, one step from being the wallpaper.
  - The preview renders at the phone's own pixel ratio, so what you see is exactly the wallpaper.

##### In and out

- **In:** a word, and optionally the five dials, the phone preset, the ground and room for the clock.
- **Out:** PNG.
  - **"For this phone":** `screen.width × devicePixelRatio` by `screen.height × devicePixelRatio`, for example 1179 by 2556, at the phone's own ratio.
  - **"For this screen":** for example 2880 by 1800, at the screen's ratio.
  - **"Square, 2048":** ratio 2, so 1024 CSS px.
  - **"Something else":** up to 8192 on a side on a desk. The ratio is chosen as `max(1, long / 2880)`, so stars stay the size they are on a screen. The CSS size never passes the 5,760 px the sky is laid out over (`FIELD_MOST × FIELD`, `Stars.ts:64-69`).
    - On iOS a canvas holds about 16.7 million pixels: "This phone can hold a picture of about sixteen million pixels. For a bigger one, use a computer."
- **Same sky, different screens.**
  - Stars are placed in field units from the middle (`FIELD`, `Stars.ts:64`), so a phone and a monitor share one sky: "The phone sees its middle."
  - Glints go to the brightest stars in view, so a crop may crown different ones. The sentence counts what is really there.

##### How it's built

- **A pure, versioned draw.**
  - **New `src/engine/space/sky/draw.ts`:** `drawSky(seed, version, tuned?) → { variant, stars: Resolved<StarsConfig>, starsSeed }`. It holds what `Sky.apply()` does now (`Sky.ts:172-185`):
    1. `hashSeed` the word;
    2. pick a variant with `pickWeighted(weights, unitOf(h, "variant"))`;
    3. `merge` the variant's patch, then the tuning;
    4. `resolve` against `subSeed(h, "stars")`.
  - It imports only `tune.ts` and types, with relative imports, so Node can test it.
  - **New `sky/versions.ts`:** `{ 1: { sky: SKY, stars: STARS } }`. Before the owner pastes a retuned `defaults.ts`, the current version is frozen as a literal. The live defaults become the next version, and Space always draws the latest.
  - Links carry `v`. A word from an older link says: "This sky was drawn before the sky was last retuned. Behind Urchi it will look a little different."
  - **A test** runs under Node's own test runner, the `node --test` script the games review adds. It pins `drawSky("darius", 1)`: its variant, and the first five stars' places and radii. The same word then draws the same sky on Space and on the tool, today and after any retune.
- **New `src/tools/sky/render.ts`.**
  - A renderer from `makeRenderer(canvas)` (`loader.ts:107`), for the same raw colour output as Space.
  - A scene with an `OrthographicCamera(-w/2, w/2, h/2, -h/2, -1000, 1000)`, as `RoomScene` lays it out (`RoomScene.ts:196`).
  - `new Stars()` (`Stars.ts:219`), then:
    - `stars.setup(resolved, starsSeed, { width: w, height: h, ratio, zoom: { min: 1, max: 1 } })` (`:262`). With a zoom of one, only stars in view are laid.
    - `stars.update({ dt, time, zoom: 1, pointer: { x: 0, y: 0 }, state: "afloat", presence: 1, reducedMotion })` (`:314`). The shooting star needs `"afloat"` and full presence (`:439`).
    - `renderer.setClearColor(stars.backdrop())`.
  - Frames run on `requestAnimationFrame` only while the page is shown and motion is allowed. Otherwise one still frame is drawn.
- **Export.**
  - Up to `MAX_RENDERBUFFER_SIZE`: render once to a `WebGLRenderTarget` at size, `readPixels`, flip, `putImageData` onto a 2D canvas, then `toBlob("image/png")`.
  - Bigger: `setup` once at the full export size, so the glints are chosen for the whole picture. Then render 2048px tiles with `camera.setViewOffset(fullW, fullH, x, y, 2048, 2048)`. The stars are one instanced draw call, so every tile is the same call.
- **Scaling.** Star sizes are CSS px drawn at `uPx = 1 / ratio` (`Stars.ts:302`), so an export at the phone's ratio looks as it does on the phone.
- **The rarer-one search** uses `hashSeed`, `unitOf` and `pickWeighted` alone: 500 tries in well under a millisecond.
- **The hand-off to Space.**
  - The button calls `keepSeed(word)` (`seed.ts:51`).
  - Unless `clock().hours === "night"`, it also calls `setAlong(true)` (`along.ts:43`). Then it goes to `/` with `next/link`.
  - **If Space is not mounted yet,** it mounts with Urchi along, so there is no intro (`CreativeSpacePanel.tsx:166`), and the Sky's constructor picks up the word through `visitSeed()` (`Sky.ts:89`).
  - **If Space is already mounted,** which is the usual case, a small new branch in its `onShown` handler (`CreativeSpacePanel.tsx:770`) does two things:
    - if `visitSeed() !== sky.seed`, it calls `sky.reroll(visitSeed())` (`Sky.ts:154`);
    - if `alongOn()` and Urchi is home, it calls `fl.take()`, the path Enter already uses (`CreativeSpacePanel.tsx:713`).
  - About twelve lines. Nothing else in Space changes.
- **Later: "Link with a picture".**
  - `/tools/sky/[word]` gets its own `opengraph-image.tsx` with `next/og`. A new `svgSky(drawSky(...))` writes the view's stars as SVG circles with radial gradients and glints as thin paths, and Satori renders it through `<img src="data:image/svg+xml…">`.
  - A pasted link then shows its sky in a chat.
  - The page says what that costs: "This link shows its sky in a chat. To draw it, it tells this site the word."
- **New files:**
  - `src/engine/space/sky/{draw.ts, versions.ts}`;
  - `src/tools/sky/{render.ts, export.ts, Sky.tsx, meta.ts}`;
  - `src/app/tools/sky/page.tsx`.
- **Changed files:**
  - `Sky.ts`: `apply` calls `drawSky`.
  - `Stars.ts`: the optional `sparkle.clear`.
  - `CreativeSpacePanel.tsx`: the `onShown` branch.

##### Looks, sounds, reads

- **Looks.** The sky, and nothing else but glass pills.
- **Sounds.** With the chip on, a take chimes `done`, and nothing else makes a sound: "A sky is quiet."
- **Reads.**
  - Colophon: "Made from the sky behind Urchi afloat. Your word is hashed (FNV-1a), stirred (murmur3's finaliser) and handed to mulberry32; every value is picked by its own place in the config, so the same word draws the same sky on any machine. Skies are versioned, so a word keeps its sky when this one is retuned."
  - No WebGL: "This browser has no WebGL. The sky needs it."

##### Privacy and link

- **Privacy.** The word stays on the page. The link carries it only after the `#`: "Your word is after the #. Browsers keep that part to themselves."
- **Link.** `/tools/sky#w=darius&v=1`.
  - Tuned dials add `&t=`, five base-36 numbers joined with dots.
  - `&g=black` sets the ground, `&p=1` the phone preset, and `&c=1` room for the clock.
  - The later picture link is `/tools/sky/darius`, and it says what it sends.

##### Edge cases

- **Phone.**
  - Exports tile where the renderbuffer is small, and are capped at about 16.7 million pixels.
  - A 1290×2796 frame is about 14 MB of pixels, which is fine.
- **No WebGL.** The sentence above, with a still picture of a common sky so the page is not empty.
- **Reduced motion.** No twinkle and no shooting star (both are already off in `Stars.ts:320, 432`). The still sky is the wallpaper anyway.
- **Sound off.** Silent.
- **Urchi's night.**
  - The sky keeps no hours; the index's clause covers it.
  - "Put it behind Urchi" keeps the seed but does not wake it: "It is asleep. The sky is kept for when you take it out." Waking it with a click is what makes it glare, and a tool should not start that.
- **Returning visitor.** The last word shows as a greyed placeholder: "Last time: darius. Forget it."

**Effort.** M, three days:
- `draw.ts`, `versions.ts` and the test: half a day.
- The renderer, export sizes, tiling and the phone preset: a day.
- The UI, the rarer search, the fragment link and the hand-off to Space: a day and a half.
- Later: the moving loop (a day) and the picture link (a day).

**What it shows.** The site's randomness is a system: seeded, tuned within set ranges, versioned and reproducible. He also thinks about what a visitor takes away. The wallpaper carries the site onto lock screens with no logo. The hand-off closes a loop: a word typed on a tool page ends up behind the mascot.

**Risks.**
- Starfield makers exist. What sets this apart is the look (a painted sky, not noise), the word, and Urchi.
- Check the Milky Way's haze at 8K. It is procedural noise (`Stars.ts:158-170`), so it has no texture resolution to run out of, but its clouds may read coarse at that size.
- Keep More to five dials, or it becomes the debug panel.
- The sky must be versioned before the first link is shared.

---

#### 2. Grain

**Pitch.** Any picture, in as few colours as it can bear.

**Who it's for.**
- Designers after the one-bit or small-palette look: posters, zines, sleeves, profile pictures.
- Web developers making small, textured hero images. The readout shows the real size against the original, whichever way it falls.
- People making for e-ink: reMarkable, Kindle, the e-paper dashboards on desks, and one-bit handhelds at 400 by 240. They arrive with the second pass.

##### What it does (first pass)

- **Sources.**
  - A picture, dropped, pasted or chosen: JPEG, PNG, WebP, AVIF, the first frame of a GIF, and HEIC where the browser can open it (Safari can).
  - It is decoded with `createImageBitmap(file, { imageOrientation: "from-image" })`, so phone photos are not sideways.
  - A gradient: two colours and an angle. This is the banding fix, a dark gradient that does not step, as the Music room's light does not.
- **Pattern.**
  - "Eight by eight": the site's own Bayer matrix, the one Urchi dissolves through.
  - "Four by four" and "Two by two".
  - "Blue noise": a 64px void-and-cluster tile, precomputed, about 4 KB.
  - "Floyd–Steinberg", scanned serpentine, which avoids the worm artefacts.
  - "Atkinson", the 1984 Mac's: "It throws away a quarter of the error on purpose. The highlights stay clean."
  - "Grain": random, a level or two either way, the tile `dither()` makes for Music (`tone.ts:463`). This is for gradients.
- **Palette.**
  - "Eigengrau and ink" (the default).
  - "Any two".
  - "The picture's own", two to sixteen colours. This is k-means in OKLab, seeded from the heaviest hue bins, the way `toneOfPixels` votes (`tone.ts:114-160`).
  - "Greys", four or sixteen.
- **Cell.** One to sixteen device pixels a cell: the pixel size.
- **Adjust.**
  - Light and Contrast.
  - Midtones: a gamma.
  - Edges: a light unsharp mask before diffusion.
- **Done properly, and shown.**
  - Colours are matched by ΔE in OKLab (`deltaE`, `tone.ts:82`), not by RGB distance.
  - Error is spread in linear light, through the `LINEAR` table (`tone.ts:34`), not in gamma-encoded values.
  - A Split compares against "the usual way": "The usual way darkens the middle greys. Drag to see."
- **"Through".**
  - A dial that dissolves the result exactly as Urchi leaves the room: a cell is dropped where `bayer8 < threshold` (`Urchi.ts:21-22`).
  - **"Take it leaving"** exports the dissolve as a 24-frame GIF: a picture going the way Urchi goes.

##### Second pass (one to two days)

- **The camera, live,** with ordered patterns only, at 30fps on the GPU. It asks only when "Camera" is pressed.
  - "Keep" captures the dithered frame. It uses `ImageCapture` at full sensor resolution where it exists (Chromium), and the video frame elsewhere.
- **"Six-colour e-paper"** palette, and a "400 by 240, one bit" size preset.
- **More outputs:**
  - **SVG,** for four colours or fewer: horizontal runs merged into one path per colour. The readout advises honestly: "Nine kilobytes as SVG, three as PNG. Take the PNG."
  - **CSS**, in gradient mode: `background: url(data:…), linear-gradient(…)`, and the tile on its own.
  - **Bytes for a display:** one bit, row-major, most significant bit first, as a C array or a `.bin`. "For the screen on your desk."

##### How it goes

- **Desktop.**
  - The Well fills the preview. The first result appears on the GPU before the drop animation would have ended.
  - The right-hand column holds Pattern (Choice); Palette (Swatches); Cell, Light, Contrast and Through (Dials); then Take.
  - The Split sits over the preview.
  - Keys: `o` open, `c` camera (second pass), `[` `]` cell, `p` next pattern, `\` before and after, `s` take.
- **Phone.** The picture sits on top, with the controls in a Sheet.

##### In and out

- **PNG.**
  - At true size, one pixel per cell, which is tiny.
  - Or scaled with nearest-neighbour, two to eight times or to a width.
  - Optionally keeping transparency, for stickers.
- **GIF** of the dissolve, with gifenc (MIT, about 9 KB).
- **The readout's size line is measured,** never claimed: "Two colours, 1,024 by 683: 61 KB as a PNG. The photograph was 212 KB." If it is bigger, it says so.
- Second pass: SVG, CSS and display bytes, as above.

##### How it's built

- **Share the shader.**
  - Move the dither GLSL (`Urchi.ts:17-22`: `bayer2`, `bayer8`, `dithered()`, recursive and needing no texture) into a new `src/engine/common/dither.glsl.ts`.
  - `Urchi.ts` imports it back unchanged, and the tool uses `bayer8` as a threshold map.
- **Share the colour maths** from `tone.ts`:
  - `labOf` (`:48`), `rgbOf` (`:65`) and `deltaE` (`:82`);
  - the `LINEAR` table (`:34`), which needs exporting;
  - the hue voting in `toneOfPixels` (`:114`), as k-means' first centres;
  - `dither()` (`:463`), generalised into `grainTile(levels, size)`. The site keeps calling `dither()`.
- **The ordered path is a fragment shader** on one quad, through the tool's own `makeRenderer`.
  - The picture is uploaded with `colorSpace` left as none, and converted to linear in the shader, so the tool is in control of both conversions.
  - Two colours: compare the pixel's place between them, in linear light, against the threshold.
  - More colours, after Yliluoma's first algorithm, the usual way to ordered-dither to an arbitrary palette: find the pair of palette colours whose mix best matches the pixel in OKLab, and let the threshold choose between them in proportion to the mix. With up to sixteen colours, that is a small loop per fragment.
- **Error diffusion is serial, so it runs in a Worker.**
  - It works on `Float32Array`s in linear light, and the buffers are transferred, not copied.
  - A 12-megapixel photograph takes a few hundred milliseconds.
  - The working size defaults to 2048 on the long side ("Dither wants fewer pixels than your camera has."), with "Full size" as a choice.
- **New files:**
  - `src/engine/common/dither.glsl.ts`;
  - `src/tools/grain/{shader.ts, diffuse.worker.ts, palette.ts, gif.ts, Grain.tsx, meta.ts}`;
  - in the second pass, `{svg.ts, eink.ts, camera.ts}`.

##### Looks, sounds, reads

- **Looks.** The preview on eigengrau.
- **Reads.**
  - "Dithered in fourteen milliseconds. Two colours, 1,024 by 683."
  - "Four colours of its own: a dark teal, an ink, two greys."
  - "Atkinson. A quarter of the error, thrown away."
- **Sounds.** With the chip on, Dial detents tick; the camera's Keep plays the site's sampled `click`; Take chimes.

##### Privacy and link

- **Privacy.**
  - Everything is local, and re-encoding through a canvas drops EXIF.
  - If the source JPEG carried a location (a sixty-line APP1 reader finds the GPS tags), the page says: "This picture knew where it was taken. What you take from here does not."
  - A metadata scrubber as a tool of its own belongs to security.
- **Link.** `/tools/grain?p=bayer8&c=3&pal=16161d.e9e9e2&l=0&k=0&t=0`. "The link carries the settings. Open it with a picture of your own."

##### Edge cases

- **Phone.**
  - iOS caps a canvas at about 16.7 million pixels, so inputs are scaled down at decode first.
  - HEIC outside Safari: "This browser cannot open HEIC. Safari can, or save it as a JPEG first."
- **Transparency.** Alpha under 50% becomes the ground, unless Keep transparency is on.
- **Animated GIF.** "Only its first frame. Moving pictures are for later."
- **Camera refused** (second pass). "No camera. It asked, and the browser said no."
- **Reduced motion.** The dissolve preview is not animated; the Through dial still sets a still. The GIF can still be taken, because you asked.
- **Sound off.** Silent.
- **Urchi's night.** No change.
- **Returning visitor.**
  - Settings are remembered.
  - The picture is held in memory for the visit only: "Still here. It never left the page."

**Effort.** M, four days for the first pass. The second pass (camera, e-paper palette, SVG, CSS and display bytes) takes one to two days.

**What it shows.**
- He understands the site's texture from the maths up: a threshold map, linear light, perceptual matching.
- He knows the gamma trap most dither tools fall into.
- Urchi's dissolve becomes something a visitor can hold.

**Risks.**
- The genre is crowded (Dither It, Dither Me This and others). The difference has to show in the first ten seconds: the eigengrau default, the linear-light Split and the dissolve GIF.
- The camera's permission prompt is loud on a quiet site. It belongs to the second pass, and asks only when "Camera" is pressed.

---

#### 3. Cues

**Pitch.** Small sounds for interfaces, all in one key, and the rhythm to play them in.

**Who it's for.**
- Product designers and front-end developers who need a send, a done, an error or a notify, and end up with a stock "pop".
- App developers who want a haptic pattern that matches the sound.

jsfxr and ZzFX make game blips, and sound libraries sell files. Nothing makes a set of quiet cues in one key, with the rhythm and the buzz from the same taps.

##### What it does

- **Voices,** taken from `src/audio/sfx.ts`, at most eight:
  - **Pat,** Urchi's answer: a sine with its octave, starting a touch sharp and settling as it lands (`:67-80`).
  - **Pluck,** ring or thud: partials by a two-multiply recurrence, plucked about a fifth of the way along (`:1049-1142`).
  - **Tug:** a low rope (`:87-102`).
  - **Snap:** a soft crack over a falling thump (`:104-114`).
  - **Chime:** two notes, like the counter's D then A (`:125`).
  - **Tick:** the Notes riffle (`:124`).
  - **Bloom:** the supernova's swell (`:947-1040`).
  - **Knock** (new): a thud and a short burst of filtered noise, a knuckle on a door.
- **At most six dials a voice,** named plainly:
  - Note, snapped to the scale;
  - Length;
  - Softness (the attack);
  - Brightness (the tilt of the partials);
  - Body (the decay);
  - Air (a lowpass);
  - Hand: a small change on every play (a few cents of pitch, a decibel of level, a few milliseconds of timing). "Two plays are never quite the same, as two taps never are."
- **One key.**
  - F G A C D by default: the pentatonic the ambient bed is in, and every cue on the site with it. Any major pentatonic can be chosen instead.
  - "Every cue here is in one key, so any two of them agree."
  - Notes show as "D3, 146.83 Hz".
- **A sheet.**
  - Named slots (Open, Close, Done, Error, Notify, Tap), each holding a cue.
  - "Play the sheet" plays them in order and levels them against each other.
- **Tap a rhythm.** The Pad reads taps as Urchi does (`RHYTHM`, `Call.ts:16`): three to eight taps, gaps between 120 and 900 ms, and a press longer than 600 ms is not a tap.
  - The cue plays back at your intervals.
  - "Tidy" snaps the gaps to eighths or sixteenths at the tempo it hears, or leaves them human.
  - "Three taps, 212 and 431 ms apart. A double knock, then a pause."
- **Haptics from the same rhythm,** as copyable snippets:
  - `navigator.vibrate([…])` for Android's web ("Feel it" works there);
  - Android's `VibrationEffect.startComposition()`, with `PRIMITIVE_CLICK`, `TICK` and `THUD` at scales and delays (API 30+), and a `createWaveform` fallback;
  - an iOS Core Haptics AHAP file: `HapticTransient` events, with intensity from the cue's level and sharpness from its brightness.
  - On iOS: "Your phone does not let a page buzz it. Android does."
  - The snippets are marked "untested on your device", because they are.
- **"The site's own".** Presets for every sound on eigengrau: "Urchi's pat", "Its own beat" (D3), "The line's tug", "The line snapping", "A living project" (a ring), "A dead one" (a thud), "The supernova", "The counter". "Every sound on this site, to take."

##### The two switches (the fix)

- **Cues never calls `sfx.set`.**
  - That call starts the ambient bed (`ambientStart()`) and remembers sound as on for every later visit (`sfx.ts:1286-1293`).
  - On a phone there is no chip to turn it back off (`globals.css:237-241`).
- **Instead:**
  - Play makes Cues' own `new AudioContext({ latencyHint: "interactive" })` inside the gesture, and it is closed on unmount.
  - The page says: "Play is its own switch. The rest of the site stays as quiet as you left it."
  - If the site's sound is on (`sfx.enabled`), the page puts the bed through the wall while you audition, with `sfx.air(400, 0.3)` (`sfx.ts:1371`), and opens it again on leaving with `sfx.air(AIR_OPEN, 0.6)` (`AIR_OPEN`, `sfx.ts:44`).
- **On a phone** this is the only place the site makes a sound, and the colophon says so: "On a phone, this is the one room with sound in it."
- **iOS's ring/silent switch.** Test `navigator.audioSession.type` on a real iPhone (Safari 16.4 and later):
  - `"transient"`, the spec's type for a notification ping, which should mix over the visitor's music;
  - `"playback"`, which beats the silent switch but, by the spec, may pause their music.
  - Choose the one that does not stop their podcast. If the switch wins, say so: "Your phone is on silent. It wins."
- **A song left playing in Music's room** is still heard faintly here. `tabOf` counts `/tools/*` as Space, three rooms away: 260 Hz, −28 dB (`sfx.ts:322-326, 498-503`). The page leaves it be.

##### How it goes

- **Desktop.**
  - Voices down the left.
  - The waveform in the middle as a Plot, with its envelope at 20% and a pluck's partials as thin bars.
  - Dials on the right, and the Pad under the waveform.
  - Keys: Space plays, `t` taps, the arrows move through dials, `s` takes.
- **Phone.**
  - Voice chips scroll across; the waveform sits on top and the dials below.
  - A Pad the size of a thumb. Touch taps are timed from each event's own `timeStamp`, not from when the handler ran, as Space already does (`CreativeSpacePanel.tsx`, `eventTime`).

##### In and out

- **WAV,** 16 or 24 bit, 44.1 or 48 kHz, mono. Peak-normalised to −1 dBFS, or levelled across a sheet.
- **"As code".** A self-contained ES module of one or two kilobytes that synthesises the cue into an AudioBuffer at runtime, so there are no files to ship, which is how the site does it. Only the chosen voice's generator is inlined.
- **A JSON recipe.**
- **The sheet as a ZIP** (fflate, MIT), with a README listing each cue's note and length, and one line: "Level them against each other, not against your music."
- **Haptics** as copyable snippets.

##### How it's built

- **Refactor the voices without changing a sample.**
  - Today they are closures inside `sfx.ts`: `synth()` (`:118`), `patWave` (`:68`), `tugWave` (`:98`), `snapWave` (`:104`), `rounded` (`:93`), `pluckSteps` (`:1081`), and `bloom` (`:966`), which builds audio nodes.
  - Move the sample generators into a pure new `src/audio/voices.ts`: `(t, params, rand) → sample`, with no AudioContext.
  - `rand` defaults to `Math.random`, so the site sounds as it does now.
  - `pluckSteps` writes into a `Float32Array` rather than an `AudioBuffer`, and keeps its idle-time slicing.
  - Bloom renders through an `OfflineAudioContext` for export.
  - **A test** renders every voice at 48 kHz with `rng(1)` from `tune.ts:88`, before and after the move, and requires a largest difference under 1e-7. `synth()`'s one-pole lowpass (`:136-140`) moves with them, so the noise voices match too.
- **Rhythm.**
  - Export `RHYTHM` from `Call.ts:16`.
  - A pure new `src/tools/cues/rhythm.ts` adds tempo estimation: the median gap, and how well it fits at one, one half and one quarter.
- **Encoders.** WAV is about forty lines. The code export is a template with the voice's generator inlined.
- **Cut:** the Bluetooth latency calibration. Playback at your intervals is not affected by a constant delay, and nothing here asks you to tap along to a click.

##### Looks, sounds, reads

- **Looks.**
  - A tap on the Pad leaves a hairline ring that fades in 300ms; there is none under reduced motion.
  - The playhead is a 1px line; under reduced motion it is a fixed marker.
- **Reads.**
  - "A pluck at D4, two and a half seconds, ringing."
  - "A thud at A2. It stops before you notice it has."
  - "Level with the others."
  - "Your rhythm: three taps. Tidied to eighths at 104 a minute."
- **The privacy line** here adds: "It never listens. The Pad hears only your taps." No microphone is ever asked for.

##### Privacy and link

- **Privacy.** Local, and no microphone.
- **Link.** `/tools/cues?v=pluck&n=D4&len=2.4&soft=4&br=1.8&hand=0.2&r=212.431`. A sheet goes in `&s=` as compact base64url JSON. These are settings, so the query is right.

##### Edge cases

- **Sound off.**
  - The chip stays off. Play is its own switch.
  - Commit `0c8268c` ("sfx.play wakes a suspended audio context") covers the site's context. Cues' own is made inside the gesture, so it starts running.
- **Phone.** The silent switch, as above. Android haptics work; iOS says why not.
- **Reduced motion.** Static playhead and no Pad rings. The sound is unaffected.
- **Urchi's night.** No change.
- **Returning visitor.** The last sheet is kept in `eigengrau:bench:cues`.

**Effort.** M-L, five days. The voices refactor with its test is the careful day; the Pad and the haptic snippets are another.

**What it shows.**
- Sound design as mathematics: partials, pitch envelopes, raised-cosine tapers.
- Taste: one key, quiet levels.
- Systems thinking: a sound and a buzz from one rhythm.
- It puts the site's most hidden craft, sound that is off by default, in front of people who will use it.

**Risks.**
- A synth can grow for ever. The cap is eight voices and six dials.
- iOS audio quirks: test on a real phone before shipping.
- Levels in real apps: the README's note on levelling.
- The licence of the code export: see question 2.

---

#### 4. Tone

**Pitch.** The one colour a picture would lend a dark room.

**Who it's for.**
- Designers and developers of dark interfaces themed from artwork: music players, podcast apps, galleries, Now Playing widgets, event pages.
- People who have watched "average colour" turn every sleeve to mud.
- Anyone who noticed the Music room change colour and wondered how.

##### What it does

- **Drop one picture or a folder of them.** For each, you get:
  - **The tone,** from `toneOfPixels` (`tone.ts:114`). The picture is read at 32×32. Near-black, near-white and grey pixels are dropped. The rest vote in 24 hue bins, weighted by chroma squared and by nearness to mid-lightness, and the tone is the weighted mean of the heaviest bin and its neighbours.
  - **Its strength:** "It has colour to spare." or "Mostly grey. It lends the room nothing."
  - **A coarse name from OKLCH bands:** "a quiet, dark teal". Keep it coarse.
- **The room.**
  - A live mock of a dark page (a sleeve, a serif title, a grotesk line), lit by `bend` at the site's caps (`CAPS`, `tone.ts:341`), preview or live.
  - The yellow rule applies: yellows turn toward amber so they do not go olive (`tone.ts:369-383`).
  - Colours out of gamut give up chroma, not hue.
- **"Louder".**
  - At the site's caps the room moves at most 0.045 of chroma, which reads as barely there in a screenshot.
  - A Louder dial goes past the caps, up to about four times, and the readout says how far: "Four times louder than the site allows itself."
- **The floor.**
  - The ink's contrast is shown live and is never allowed under your floor.
  - The default is the site's 13.4:1 (`MIN_CONTRAST`, `tone.ts:346`), measured under the dither's lightest grain (`underGrain`, `:361`). WCAG AA (4.5) and AAA (7) are the alternatives.
  - An "Under grain" toggle is on by default, as the site does.
- **Your own ground and ink.**
  - Eigengrau and ink by default, or type any dark ground and ink, and the rules adapt.
  - The floor can never be set above the pair's own contrast: "Your ink on your ground is 9.1 to 1. The floor cannot be higher than that."
- **"Average", as a comparison.** Beside the tone, the plain mean colour of the same picture, with the line from the file's own comment: "The average of a cover is mud."
- **"Between".**
  - Pick two pictures and watch the room move from one to the other on the site's `Spring` (`tone.ts:417`), straight across in OKLab.
  - "Navy never reaches olive by way of green."
- **Batch.** A grid of pictures, each over its own lit room, taken as JSON to precompute tones at build time.
- **Cut:**
  - The palette of five. It is Coolors and Adobe's ground, and it contradicts "the one colour".
  - "Or name a record". It would put strangers' searches through `/api/songs` and `/api/cover`, which security wants narrowed (F1, F3).

##### How it goes

- **Desktop.** The room fills the page with the picture centred, as on Music, and the readout on the right.
- **Phone.** Stacked; swipe between a batch's pictures.

##### In and out

- **CSS custom properties:** `--room: oklch(…)`, `--room-hex`, `--ink`.
- **A Tailwind v4 `@theme` block.**
- **JSON:** one entry per file, `{ file, L, a, b, s, hex, oklch }`.
- **A PNG card:** the picture, the room and the sentence.
- **"Take the reader itself".** `toneOfPixels` and `bendOn` with their constants, as a standalone module of about two kilobytes, so anyone can do what the Music tab does. The licence is question 2.

##### How it's built

- **`tone.ts` is nearly all of it.**
  - `toneOfPixels` is already pure.
  - The 32×32 read follows `read()` (`:166`), but from `createImageBitmap(file, { resizeWidth: 32, resizeHeight: 32, resizeQuality: "high" })`, falling back to a 32px canvas where `resize*` is unsupported.
  - Then `bend`, `contrast` (`:89`) and `Spring`.
- **Parameterise `bend`.**
  - It reads `EIGENGRAU`, `INK_RGB`, `CAPS`, `MIN_CONTRAST` and `GRAIN` (`tone.ts:95-97, 341-367`).
  - Pull them into `bendOn({ ground, ink, caps, floor, grain })`.
  - `bend(t, live)` stays as a one-line wrapper with the site's values, so Music does not change. A test pins `bend` against a handful of known tones before and after.
- **New:** `src/tools/tone/{name.ts, export.ts, Tone.tsx, meta.ts}`.

##### Looks, sounds, reads

- **Looks.** The room is the interface.
- **Reads.**
  - "A quiet, dark teal. Most of the picture is grey, so the room takes only a little."
  - "Ink stays at 14.1 to 1."
  - "A grey record. It lends the room nothing."
- **Sounds.** None, beyond `done` on a take with the chip on.

##### Privacy and link

- **Privacy.** Local.
- **Link.** `/tools/tone?c=0.62.0.11.215&s=0.8&g=16161d&i=e9e9e2&f=13.4`. "The link carries the colour, not the picture."

##### Edge cases

- **Transparent PNGs.** Alpha under 128 is ignored, as `tone.ts:124` already does. CMYK JPEGs are converted by the browser.
- **A light ground typed by mistake.** "This is for dark rooms. On a light ground the rules turn upside down, and this does not know them."
- **Phone.** Fine at 390px.
- **Reduced motion.** The spring jumps (`snap`, `tone.ts:430`).
- **Sound off.** Silent.
- **Urchi's night.** No change.
- **Returning visitor.** The last ground, ink and floor are kept.

**Effort.** S-M, one and a half to two days.

**What it shows.** Colour science used with restraint, and an accessibility floor that holds even under dither. It explains the Music room's quiet trick to anyone who noticed it.

**Risks.**
- "Colour from an image" is crowded (color-thief, node-vibrant, fast-average-color). Lead with the dark room and the contrast guarantee.
- Colour names are subjective, so keep them coarse.

---

#### 5. Settle

**Pitch.** One spring, written in every dialect motion is written in.

**Who it's for.** Front-end and app developers, and motion designers, who move between CSS, JavaScript libraries, SwiftUI and Compose. Each of those describes a spring differently.

##### What it does

- **Models.**
  - "Spring": bounce and duration, or stiffness, damping and mass.
  - "Settle": critically damped with one time constant. This is the site's own, which moves the Music room's colour (`Spring`, `tone.ts:417`, `tau` 0.7s).
  - "Magnet": `t²(2 − t²)`, "slow to leave, quicker as it closes", the Projects covers' return (`magnet`, `ThreadScene.ts:688`).
  - "Curve": cubic Bézier, including the site's tokens `power4.out`, `power3.out` and `power2.inOut` (`EASE`, `motion.ts:2-8`), and the sky's cosine eases (`Sky.ts:35-39`).
  - "Steps".
- **Previews on real parts,** each under the curve's Plot with a playhead:
  - the tab pill morphing (`DUR.tab` 0.42s);
  - a panel sliding, like the site's 1.0s slide;
  - a toggle;
  - a card landing;
  - a number counting;
  - a phone Sheet rising.
- **"Grab it".** Take hold of the moving card halfway. A spring carries its velocity into the new target, as the site's `Spring` does when it is retargeted (`tone.ts:417-455`); a curve starts again. "Grab it halfway. A spring carries on from where it is; a curve starts again."
- **The same motion in every dialect, side by side:**
  - CSS `linear()`, adaptively sampled to the fewest points within an error you choose ("Twenty-two points, within half a percent"), with its duration;
  - Web Animations keyframes;
  - GSAP: a `CustomEase` path, which is free since GSAP 3.13 (the site is on `^3.15`), or a function;
  - Motion, formerly Framer Motion: `bounce` and `visualDuration`, or `stiffness`, `damping` and `mass`;
  - React Spring: `tension` and `friction`;
  - SwiftUI: `.spring(duration:bounce:)`, and `response` with `dampingFraction`;
  - UIKit: `UISpringTimingParameters`;
  - Jetpack Compose: `spring(dampingRatio, stiffness)`;
  - a `prefers-reduced-motion` fallback.
- **Honest notes** wherever a dialect cannot say it exactly: "CSS linear() cannot carry velocity into an interruption. It will look right until someone interrupts it."

##### How it goes

- **Desktop.** The Plot on the left, the previews in a grid, and the dialects in a tabbed code block (Choice).
- **Phone.** The Plot, one preview at a time, and a Sheet with the dialects.

##### In and out

- **In:** the model's parameters, typed or dragged. You can also paste any dialect, such as `.spring(response: 0.5, dampingFraction: 0.8)`, and have it read in.
- **Out:** copyable code in every dialect, and `linear()` at a chosen precision.

##### How it's built

- **Engines.**
  - `Spring`: critically damped, closed form. It is extended here with the underdamped closed form.
  - `magnet`, the sky's cosine eases, and the `EASE` and `DUR` tokens.
- **New:** `src/tools/settle/{spring.ts, sample.ts, dialects.ts, parse.ts, Settle.tsx, meta.ts}`.
  - `sample.ts` simplifies the curve for `linear()` with Ramer–Douglas–Peucker, the same algorithm `trace-ref.mjs`'s `simplify` uses.
  - `dialects.ts` holds each platform's mapping. Each is taken from that library's source, not its marketing pages, and cited in a comment with the version read.
  - Each mapping has a test against a number computed by hand from the cited formula. For example, SwiftUI's `duration` and `bounce` against stiffness `(2π / duration)²`.
- **Plot and previews** use the kit's Plot and the site's real pill and slide CSS, so a preview is the site's own part.

##### Looks, sounds, reads

- **Looks.** The Plot is a 1px ink line on hairline axes.
- **Sounds.** With the chip on, a `tick` when a preview comes to rest.
- **Reads.**
  - "Settles in 0.42 seconds, with one small bounce."
  - "Critically damped. It never overshoots."
  - "The site's own: it reaches the colour in about two seconds and never passes it."

##### Privacy and link

- **Privacy.** Local.
- **Link.** `/tools/settle?m=spring&b=0.2&d=0.5`.

##### Edge cases

- **Reduced motion.**
  - Previews do not play by themselves. Each shows a filmstrip of twelve frames instead: "Twelve frames, a twelfth of a second apart."
  - A Play button plays it once, because you asked.
- **Phone.** One preview at a time.
- **Sound off.** Silent.
- **Urchi's night.** No change.
- **Returning visitor.** The last spring is kept.

**Effort.** M, three to four days. The dialect tests are a whole day.

**What it shows.**
- The site is full of tuned physics: the tether, the magnet, the colour spring, the slide. This turns that craft into knowledge he can hand over.
- It shows he knows every platform's words for the same thing.
- It earns the tagline's middle word.

**Risks.**
- Good single-purpose generators exist (Jake Archibald's `linear()` generator, a few spring playgrounds). The dialect table and the interruption demo are what set this apart.
- A wrong conversion is worse than none. Test every one, and cite the version read.

---

#### 6. A week

**Pitch.** Anyone's week of listening, in one honest sentence.

**Who it's for.** Last.fm and ListenBrainz users, a large and share-happy crowd, and friends of the owner.

##### What it does

- **Type a Last.fm name,** or a ListenBrainz one. The page does for them what Music does for Darius:
  - **The heading** is the week's single most surprising fact, from `weekFact` (`fact.ts:129`):
    - "Nothing since Thursday."
    - "Holocene eleven times in a row."
    - "Rosalía, mostly after midnight."
    - "Nothing but Bon Iver."
    - "Sixty-two plays, forty of them on Sunday."
  - **The ten songs,** sized by plays.
  - **The room,** lit by the top sleeve's tone.
- **Their hours.**
  - Facts about the time of day (`BANDS`, `fact.ts:39-46`) need a time zone, and Last.fm does not publish one.
  - The page reads the week in the visitor's own zone, and says so: "Read in your hours, Europe/London. Change."
- **A card to take.**
  - PNG at 1080×1350 and 1080×1920.
  - The sentence in Newsreader on the lit eigengrau, with the grain, and the ten titles small beneath it.
  - "eigengrau / week" in grotesk 9px at 60%. This is the only tool that puts the site's name on its output, because its output is the only social object, and the credit can be turned off.
- **The link `/tools/week/<name>`** has its own OG image (`next/og`, type and colour only), so pasting it into a chat shows the sentence.
- **Later: "Compare".** "You both played Bon Iver. She played it forty times more."
- **No previews for strangers' weeks.**
  - Security narrows `/api/preview` to songs the site itself listed (F3), and the page says so.
  - "Previews are for his week only. Hear it on Last.fm." Each title links out.

##### How it goes

- **Desktop.** Laid out as Music: the heading, the stack of ten, the sleeve.
- **Phone.** Laid out as Music's phone layout. The first tap on a song chooses it; the second opens Last.fm.

##### How it's built: the one tool with a backend

- **A new route, `src/app/api/week/[user]/route.ts`,** reusing:
  - the Last.fm client. Security §2.5 moves `call()` (`now/route.ts:73-78`) and the week's page fetch into a shared new `src/app/api/lastfm.ts`. Use that, with the server-side key.
  - `weekFact`, unchanged, since it is already pure.
- **Caching.** Per name, ten minutes at the edge: `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600`. One name is four or five Last.fm calls (`now/route.ts:164-169`), so the cache matters.
- **Rate limit.**
  - A Vercel firewall rule, around 30 a minute per IP, if the plan offers it.
  - Otherwise, a per-instance token bucket plus the cache. Answer "Last.fm is busy. Try in a minute." rather than a stack trace.
- **Validation.** Names must match Last.fm's own rule: a letter, then 1 to 14 letters, digits, `_` or `-`. Anything else is a 400 with no upstream call.
- **Covers** go through `/api/cover` with ids the week route mints and signs (security's HMAC, §2.5), so the proxy still serves only URLs the site made.
- **ListenBrainz** goes through the same route (`?from=lb`). Its API is keyless, but the site-wide `connect-src 'self'` would block the browser from calling it directly.
- **The page.** Pull the heading, the stack of ten and the room light out of `MusicPanel.tsx`, which is 1,442 lines, into `src/components/music/` so both use them. That is the extra day in the estimate.

##### Looks, sounds, reads

- **Looks.** As Music.
- **Sounds.** None, beyond `done` on a take with the chip on.
- **Reads.**
  - "No plays this week. A quiet one."
  - "Last.fm does not know rj."
  - "rj keeps their listening private."
  - "Last.fm asked this site to slow down. Try in a minute."

  The site never says "we" or "us". It is "he", "it" and "this site".

##### Privacy and link

- **Privacy.** Said above the fold: "This one asks Last.fm, through this site. It keeps nothing, and it sees only what Last.fm shows anyone." Names are never logged; errors are logged without them. The page credits "Data from Last.fm", with a link, as Last.fm's terms expect.
- **Link.** `/tools/week/rj?tz=Europe/London`. The name has to reach the server anyway, and the page says so.

##### Edge cases

- **Phone.** As Music.
- **Reduced motion.** The room's colour jumps (`Spring.snap`) and there is no door animation.
- **Sound off.** No previews, and nothing is fetched for them.
- **Urchi's night.** No change.
- **Returning visitor.** "Last time: rj. Forget it."

**Effort.** M, three to four days: the route, extracting MusicPanel's parts, the page, the card and the OG image.

**What it shows.** His voice written as code (the fact finder is a set of scored rules), data told as a sentence, and a backend kept as small and as safe as it can be. The most personal tab, opened to everyone.

**Risks.**
- Last.fm's terms: non-commercial use and a credit. Question 4 asks whether the owner wants his key serving strangers at all.
- Quota on a busy day: the cache, the limit, and a graceful "busy".
- The rules were tuned on one person's listening. Test them against fixtures from a range of accounts before launch.

---

#### 7. That night (stretch)

**Pitch.** The real sky over a place, on a night that mattered.

**Who it's for.**
- Gift-givers. Custom star-map posters are a well-paid category, so a free and beautiful one gets noticed.
- Anyone marking a birth, a wedding or a first night somewhere.
- The astronomy-curious.

It also gives a site named for what the eye sees in the dark one real sky.

##### What it does (version one)

- **A place.**
  - Type a town from a bundled list, press "Here" (geolocation, asked only on the press), or enter a latitude and longitude.
  - The list is GeoNames `cities15000` (CC BY 4.0, about 25,000 places), trimmed to name, country, latitude, longitude and an index into a table of IANA zones.
  - It is served as a static file of about 300 KB gzipped, fetched same-origin only when the field is focused, and cached.
- **A date and a time.**
  - The default is 21:00 in the place's own zone: "An evening, unless you know the hour."
  - A new `zonedToUtc(local, zone)` solves for the offset in two passes with `Intl.DateTimeFormat`, because `Intl` does not convert in that direction.
- **The sky.**
  - The Yale Bright Star Catalogue: about 9,100 stars down to magnitude 6.5, the whole naked-eye sky, packed to about 45 KB.
  - Precessed from J2000 to the date, then local sidereal time, altitude and azimuth, and a stereographic projection of the sky above the horizon into a circle.
  - Star colour from B−V, through temperature, to sRGB, then pulled gently toward the site's three star colours (`defaults.ts:44-48`): "coloured as the eye would see it, softened".
  - Size and brightness from magnitude. The brightest eight get the four-point glint.
- **Options.**
  - The Moon, with its phase: "The Moon, two days past full."
  - Constellation lines as hairlines at 20%, with names in grotesk 9px at 60% (lines from d3-celestial, BSD-3-Clause).
- **A caption in serif.**
  - "The sky over Kuala Lumpur, 12 March 1998, a little after nine in the evening. 2,315 stars."
  - Plus an optional line of your own, up to 48 characters, the site's caption length (`site.ts:55`).

##### Later

- The planets, from Standish's approximate Keplerian elements, valid 1800-2050: "Jupiter, low in the east."
- SVG for print shops.
- The Milky Way. Stars' haze is one straight quad (`Stars.ts:120-130`), but in a round projection the galactic plane is an arc. Draw it as a chain of about 64 short haze quads along the projected great circle, with the same cloud noise.

##### How it goes

- **Desktop.** The circle on eigengrau, the caption beneath, and place, date and options in the right column.
- **Phone.** The circle full width, with place and date in a Sheet. Take goes through the share sheet.

##### In and out

- **In:** a place, a date and time, and the options.
- **Out:**
  - a poster PNG at A3, A2, or 18×24 inches at 300 dpi (up to 7200px on a side on a desk, drawn in tiles);
  - a phone wallpaper with the circle filling the frame.
  - On iOS both are capped at about 16.7 million pixels, and the page says so.

##### How it's built

- **The look is Stars'.**
  - Refactor `Stars.ts` so its material and its geometry fill are separate from `lay()`: `starMaterial()` and `fillStars(list)`.
  - A new `CatalogueStars` implements `SkyLayer` (`layer.ts:52-64`) and feeds projected positions, in field units from the middle, to the same shader.
- **New:**
  - `public/tools/night/{bsc5.bin, places.bin}`;
  - `src/tools/night/{astro.ts, project.ts, places.ts, zone.ts, NightSky.tsx, meta.ts}`.
  - `astro.ts` does precession, sidereal time, altitude and azimuth, and the Moon at low precision after Meeus; later, the planets after Standish.
- **Tested** against known positions: Sirius's altitude over a named place and time, and the Moon's phase on three dates, checked against Stellarium or JPL Horizons and kept as fixtures.

##### Looks, sounds, reads

- **Looks.** The site's sky, made true.
- **Reads.**
  - "Stars within a tenth of a degree. The Moon within a degree."
  - "The sun is up in Tromsø at that hour. Here is the sky as it would be without it."
- **Sounds.** None, beyond `done` with the chip on.

##### Privacy and link

- **Privacy.**
  - The place and date stay on the page. The list is bundled, and geolocation is optional and stays local.
  - `Permissions-Policy` needs `geolocation=(self)`.
- **Link.** It carries them after the `#`, and the page says so: "The link has the place and the date after the #. Send it to whoever was there." For example `/tools/that-night#at=kuala-lumpur&d=1998-03-12T21:00&m=1&l=1`.

##### Edge cases

- **Polar sun.** Rendered as if the sun were down, and the page says so.
- **Dates before 1970.** The zone database is reliable from 1970. Before that: "The hour may be off by one. Clocks were set differently then."
- **Dates outside 1800-2050.** When planets exist, they are left off, with a note.
- **Phone.** Posters render in tiles under the memory cap.
- **Reduced motion.** No twinkle.
- **Sound off.** Silent.
- **Urchi's night.** No change.
- **Returning visitor.** The last place is kept: "Last time: Kuala Lumpur. Forget it."

**Effort.** L. Version one takes seven to eight days, half of it the astronomy and its tests. The planets, SVG and the Milky Way arc add three to four more.

**What it shows.** Mathematics done with care, the site's space theme made real, and an eye for what people pay for, given away.

**Risks.**
- Accuracy: state the claims plainly and test them.
- Licence credits in the colophon: BSC5, GeoNames CC BY, d3-celestial BSD.
- It is the biggest build, for a tool each person uses a few times a year. Gifts get shared, though. Build it only after the first four have shipped and been used.

---

#### Ranking and build order

| Tool | Useful to strangers | Shows craft | Engine ready | Leaves with the visitor | Effort | Rank |
|---|---|---|---|---|---|---|
| Sky | 4 | 4 | 5 | 5 (a wallpaper) | M | **1** |
| Grain | 5 | 5 | 4 | 5 (a picture, a GIF) | M | **2** |
| Cues | 4 | 5 | 4 | 3 (a WAV, some code) | M-L | **3** |
| Tone | 3 | 4 | 5 | 2 (a colour) | S-M | 4 |
| Settle | 4 | 4 | 3 | 2 (code) | M | 5 |
| A week | 3 | 3 | 4 | 5 (a card) | M, backend | 6 |
| That night | 4 | 5 | 2 | 5 (a poster) | L | 7 |

**Why Sky, Grain and Cues first:**
- **Each is an engine visitors have already met:** the sky behind Urchi afloat, the dither Urchi leaves through, the sounds under the chip. The tool answers "how did he do that".
- **Three senses:** a sky to look at, a picture to hold, a sound to hear. Three tools that looked alike would make the bench feel like a template; these make it feel like a set.
- **Each leaves with the visitor,** with no logo, and brings people back through its link.
- **Together they test the whole kit:**
  - Sky: the fragment link, big exports, and the hand-off to Space.
  - Grain: the Well, the Worker, the Split and the GIF.
  - Cues: its own audio context, the Pad and the code export.

| Days | Work |
|---|---|
| 1-2 | The frame: routes, the registry, the page shell, `state.ts`, `take.ts`, `watch.ts`, and the kit parts Sky needs. The Permissions-Policy change with engineering. The About tagline link (or the Desk drawer), and the Notes log line. |
| 3-5 | Sky: `draw.ts`, `versions.ts` and the test, the renderer and export, the phone preset, the rarer search, the fragment link, the hand-off to Space. |
| 6-9 | Grain, first pass: the shared dither GLSL, the ordered path, diffusion in a Worker, palettes, PNG, the dissolve GIF, the linear-light Split. |
| 10-14 | Cues: `voices.ts` with its seeded buffer test, its own context, the UI, the Pad, WAV, code, the haptic snippets. |
| 15-16 | Tone, with the `bendOn` refactor and its test. |
| later | Grain's second pass, Sky's loop and picture link, Settle, A week, then That night. |

---

#### Cut, and where the good parts go

- **Quieter.**
  - As a public tool, it repeats Hemingway, alex, write-good and Vale, with house taste on top.
  - It would teach the site's literary voice as if it were his. His own notes are lowercase and cheerful.
  - **Salvage:** check `kind: "log"` lines in `scripts/add-note.mjs` (`npm run note`) for no exclamation marks, counts as words up to ninety-nine, and at most 48 characters for captions. That keeps the site's own lines in tune without preaching to anyone.
- **Facets.**
  - Trace is L against vtracer and potrace, and the tracing in `trace-ref.mjs` is not a reusable engine.
  - Facet is a crowded toy genre.
  - Parked. Revisit Facet after four tools ship, if "your cat, in Urchi's planes" still tempts.
- **Tab.**
  - RealFaviconGenerator already exists.
  - **Salvage:** write "How the tab blinks" as a note, with the `lidLine` trick (`LiveIcon.tsx:112-155`: painted eight times finer, the lid kept where it is most present) and the timer-not-`requestAnimationFrame` lesson. Offer `live-icon.js` as a copyable snippet on it.
- **The proposal's own cuts stand:**
  - tap tempo on its own;
  - numbers to words;
  - a separate banding fixer (it is Grain's gradient mode);
  - a glass generator;
  - QR codes;
  - the rhythm game (the games must stay free of Urchi);
  - make-your-own-Urchi;
  - the security tools, which share this frame as described.

#### Files this would touch or add

- **Changed:**
  - `src/engine/space/sky/Sky.ts`: `apply` goes through `drawSky`.
  - `src/engine/space/sky/Stars.ts`: optional `sparkle.clear`. Later, `starMaterial` and `fillStars` for That night.
  - `src/components/pages/CreativeSpacePanel.tsx`: the `onShown` hand-off branch.
  - `src/engine/urchi/Urchi.ts`: the GLSL moves to `engine/common/dither.glsl.ts`.
  - `src/audio/sfx.ts`: the voices move to `src/audio/voices.ts`, with an injectable RNG.
  - `src/engine/space/Call.ts`: export `RHYTHM`.
  - `src/lib/tone.ts`: export `LINEAR`; `bendOn` with `bend` as its wrapper; `grainTile`.
  - `src/content/site.ts`: `UPDATED.tools` and a `URCHI_NEWS.tool` line.
  - `src/lib/visits.ts`: the tools entry in `whatsNew`.
  - `src/components/pages/AboutPanel.tsx`: the "small tools" link in the tagline, once style R2 lands.
  - `next.config.ts`: engineering's headers, with `camera=(self)` and `geolocation=(self)`.
- **New:**
  - `src/app/tools/page.tsx` and `src/app/tools/<slug>/page.tsx` (or the Desk's owned routes);
  - `src/tools/index.ts` and `src/tools/<slug>/…`;
  - `src/components/bench/*`;
  - `src/lib/bench/{state.ts, take.ts, watch.ts}`;
  - `src/engine/space/sky/{draw.ts, versions.ts}`;
  - `src/app/dev/tools/page.tsx` (development only);
  - `src/app/api/week/[user]/route.ts` (A week only);
  - `scripts/tools-og.mjs` and `scripts/tools-thumbs.mjs` (run locally).
- **Libraries.** All small and permissive, each loaded only by the tool that needs it:
  - gifenc (MIT);
  - fflate (MIT);
  - later, mp4-muxer (MIT) or Mediabunny, whichever is maintained then.

### Open questions for the owner

1. **Where do the tools live?** In a Desk room, with Tools as one drawer beside Today (style R16, engineering §4.5), where they stay mounted like tabs? Or as their own `/tools` pages, reached from the words "small tools" on About? The code is the same; the navigation is not.
2. **May visitors keep what they take?** The repo has no LICENSE. Can exported code (Cues' module, Tone's reader, the favicon snippet) be given away, as MIT or public domain? And is `github.com/dctxv/eigengrau` public, so colophons can link to the files they came from?
3. **Should skies be frozen?** Freeze the current sky as version one before the first link goes out, so a shared word keeps its sky after you retune Space? Recommended. Or let every word's sky drift with your tuning?
4. **Your Last.fm key, for strangers?** Are you comfortable with your key serving strangers' weeks, behind a cache and a rate limit, with no previews for them? Or should A week be ListenBrainz-only, or wait?
5. **That night: now, later, or never?** Is a real star map worth one and a half to two weeks after the first four tools, given how rarely each person needs one and how widely gifts get shared?

### If you only do one thing here

Build **Sky**, with only the parts of the bench it needs: the page, Take, the fragment link, the privacy line and the colophon. First freeze today's sky as version one in a pure, tested `draw.ts` that Space and the tool share. Add the twelve-line hand-off, so "Put it behind Urchi" really takes the visitor's word out onto Urchi's line.

It is three days of work on an engine that is already written and tuned. Nothing like it exists elsewhere: no other portfolio has a mascot floating in a sky you can name. It leaves with the visitor as a lock screen, with no logo. And it proves the frame (links, exports, the live privacy line) on the cheapest possible tool before Grain and Cues are built on it.
