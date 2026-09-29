## Style and UX

I checked this against the repo at `9b8c07c` without changing anything. `npm run typecheck` and `npm run lint` both pass. I opened every cited file and line I could, drove the dev server in Chromium to test the accessible names and the digit keys, and parsed the font files. Most of the proposal's evidence holds, and its contrast numbers match mine to the hundredth. Where it was wrong, or where a fix would not work as written, the text says **Correction**. Where something was missing, it says **Added**.

Screenshot folders:
- `S/` is `/tmp/claude-0/-home-user-eigengrau/a10b9ada-2576-598d-bc82-bdf87b8a6a28/scratchpad/review/shots-style/`
- `O/` is `/tmp/claude-0/-home-user-eigengrau/a10b9ada-2576-598d-bc82-bdf87b8a6a28/scratchpad/shots/`

### Review verdicts

| Idea | Verdict | Why |
|---|---|---|
| §1 What is already excellent | KEEP | It is accurate, and the ratios check out: ink on ground is 14.76:1, ink on glass 13.43:1, and glass over ground is `#1f1f26`. It is the brief for everything below. |
| F-H1a Monogram unfolds into "Darius Tan" | KEEP WITH CHANGES | It is cheap and in character. Gate the phone one-off on a real first-load test. `lastVisit()` stays null for thirty minutes after a first visit (`visits.ts:78`). |
| F-H1b Name and role flank the ring on every screen | KEEP | Phones get no name at all today (`globals.css:362-366`). |
| F-H1c About byline and tagline | KEEP WITH CHANGES | The statement and status are drawn in the canvas (`AboutScene.ts:167`), so a DOM byline needs the scene to publish where its lines sit. Use the lowercase form the mock already shows. |
| F-H2 Digits navigate | KEEP WITH CHANGES | Confirmed: no handler exists. Three problems with the fix as written. The Notes guard fails because Nav's listener runs first. Hiding the `<sup>` would break Label in Name on inactive pills. Single-key shortcuts need an off switch (WCAG 2.1.4). |
| F-H3 Sound on phones, chip in the group | KEEP WITH CHANGES | Confirmed, and Music's phone preview path (`MusicPanel.tsx:1254`) is unreachable today. Give the toggle a fixed name. Fix the iPhone silent switch with `navigator.audioSession`, not with an apology. |
| F-H4 The keyboard drives the ball | KEEP WITH CHANGES | Confirmed. The `sr-only` override CSS would be clipped by its `sr-only` parent, so render a separate DOM chip. `choose(slug)` is new, but it copies what `step()` already does (`ThreadScene.ts:2485-2514`). |
| F-H5 Phone nav at the bottom | KEEP WITH CHANGES (split) | The 2.5.8 failure is a one-line S fix at the top. The bottom bar is a design change with eight knock-ons, including Safari's bottom toolbar. Prototype it behind a flag first. |
| F-H6 Social cards | KEEP WITH CHANGES | Confirmed: there are no `og:`, `twitter:` or canonical tags, and the domain is a placeholder. **Correction:** `alternates: { canonical: '/' }` in the root layout would mark every page as a copy of the home page. Canonicals go per route. |
| F-M1 Contrast values | KEEP WITH CHANGES | The numbers are exact. But the zoom track's ink is set at runtime from the tether (`CreativeSpacePanel.tsx:236`, `Tether.ts:19`), so the CSS edit does nothing. The proposed hover floor of 0.35 still fails (2.87:1). |
| F-M2 Glass cursor label over colour | KEEP WITH CHANGES | The 1.17:1 failure is real. Use glass whenever the label belongs to Urchi or says "Open", with no per-pixel switching. |
| F-M3 Focus ring as Urchi's own rim | KEEP WITH CHANGES | The best idea in the section. The `rim` option is fixed at construction (`Urchi.ts:151,165`), so it needs a new setter. "Look at you" needs a new attention target built on the existing `ahead()`. |
| F-M4 Case pages as a page of Projects | KEEP WITH CHANGES | Confirmed. A case page should get `aria-current="true"`, not `"page"`. Focus needs a client island because the page is a server component. **Added:** `numberWord` switches to digits after twelve, so real projects will read "13 projects". Coordinate with the GitHub-projects branch. |
| F-M5 Rims only when something passes under them | KEEP | Confirmed: the band is glass over ground, `#1f1f26`, and it shows at rest on Notes and Music only. S. |
| F-M6 One heading line | KEEP WITH CHANGES | **Correction:** a pure `headLine(w, h)` cannot exist. The balance depends on measured caption text, the project count and the ball's fit (`ThreadScene.ts:1850-1898`). The scene should publish its line instead. |
| F-M7 A 404 in one piece | KEEP WITH CHANGES | Echoing the raw path lets anyone make the site say their sentence, which is text injection on a site meant to show security skill. Sanitise and cap it. Set the title by React 19 `<title>` hoisting. |
| F-M8 Quiet week and honest outage | KEEP WITH CHANGES | The quiet-week half is already handled: `last` comes from recent tracks, not the week, so the empty sleeve only shows on failure. The outage half is real, on the server and the client. |
| F-M9 Loading states | KEEP WITH CHANGES | The timings were measured on `next dev`, so re-measure on a production build. The real risk is that `ThreadScene.load()` waits for every cover and still, and that wait grows with real projects. |
| F-M10/M11 Pill hover and name tips | KEEP | S, with sensible hover-intent numbers. |
| F-M12 Intro hurry and short form | KEEP WITH CHANGES | Use a first-load flag. `lastVisit()` and `sessionStorage` both miss reloads within thirty minutes in a new tab. |
| F-L1/L2 Type and space tokens | KEEP WITH CHANGES | Keep the nav's 14px gap (spec 4.1) out of the snap. |
| F-L3 "Work" becomes "Projects" | KEEP | It mirrors "Notes Two since September". |
| F-L4 Rename the "Serif" family; display cut | KEEP WITH CHANGES | Confirmed: `serif.woff2` has one axis, `wght` 200-800, and no `opsz`. `Nav.tsx:18` and `NotesPanel.tsx:779` load `"Serif"` by name and must change too. **Added:** `grotesk-500.woff` is 140KB against 22KB for the WOFF2. |
| F-L5 Accessible names, order, skip link | KEEP WITH CHANGES | **Correction:** the pills are named "Projects 2" in Chromium, not "Projects2". Hiding the digit would remove the only visible label of an inactive pill from its name (2.5.3). Keep the monogram name, the reorder and the skip link. |
| F-L6 Static favicon | KEEP | Folded into R1. |
| F-L7 About footer | KEEP WITH CHANGES | Email already copies and says "Copied" (`AboutPanel.tsx:49-60`). What is new is showing the address and giving the links bigger targets. |
| F-L8 Urchi looks at a pill reached with Tab | KEEP | S, and it is exactly the brief: something for people who notice. |
| F-L9 Set `TIME_ZONE` | KEEP | One line, and the owner's call. |
| A. Eigengrau as grain | KEEP WITH CHANGES (experiment) | The concept is right and the maths is wrong. White-only noise at 0-6% lifts the mean to about `#1d1d24`, not `#15151c`. Reuse `tone.ts` `dither()`, which is symmetric and keeps the mean, behind `?grain=1`. |
| B. The visit's eyes as the one accent | KEEP WITH CHANGES | The most personal of the three. Drop the Music progress dot, because the room already has its own colour. Write the rule down. |
| C. Three voices and log-from-git | KEEP WITH CHANGES (staged) | Use mono only where alignment carries meaning: hashes, hex, tool output. Not the intro counter or note dates. The git script must run locally, because Vercel builds from a shallow clone. |
| §5 `/colophon` | KEEP WITH CHANGES | A good systems showcase. Cut the live faces row: it is L effort and gives away hidden behaviours. It becomes the home of the keys and sound switches. |
| §6 Order of work | REPLACED | Re-ranked by what a visitor meets first, and by what the incoming GitHub projects need. |
| **Added:** Desk, a sixth room for the tools, the daily game and the security work | ADD | The owner's new features need a home that keeps five-pills-one-app intact. `TABS` is generic enough that the room itself is S. |

### Refined proposal

These are in priority order. Each item keeps the proposal's detail and adds the corrections above. Effort: S is up to a day, M is 2-4 days, L is 1-2 weeks.

---

#### R0. Keep these: the brief for everything below

None of the fixes may make the site more like other sites. What follows is what they must protect, all checked.

- **The ground is an idea.** Eigengrau `#16161d` with ink `#e9e9e2`, its inverse (`src/lib/color.ts:1-13`). Because of that, white `difference` and `exclusion` labels land exactly on ink. Ink on ground is 14.76:1, and ink on the glass is 13.43:1.
- **Two faces, two voices.** Serif is his voice; grotesk is the site's. The heading pattern of a grotesk lead plus a serif sentence ("**Notes** Two since September: two random.") is a table of contents written as prose.
- **Search results are sentences.** Typing "burr" gives "**Notes** containing 'burr'. One. All notes." Notes that don't match fold into hairlines as long as they were (`S/j-notes-find.png`).
- **Honest data.**
  - A first-sighting progress line is dotted (`globals.css:1197-1207`), and the caption says "About two minutes in.".
  - Counts are words to ninety-nine through one function, `countWord` (`site.ts:201`).
- **The character and the chrome are one system.**
  - Urchi looks up at a hovered pill (`attention.ts:548-567`) and startles at the chip (`attention.ts:573`).
  - It points at the tab that changed since your last visit.
  - The favicon blinks and sleeps (`LiveIcon.tsx`).
- **Persistence.**
  - Tabs stay mounted and paused (`Shell.tsx:66-77`).
  - Stars pass between panels only while they slide (`Between.tsx`).
  - A song plays on through the wall.
- **The Music room takes the record's colour** in OKLab, with a grain against banding (`tone.ts:463` `dither()`). `prefers-contrast: more` switches the light off (`globals.css:1058-1063`).
- **Reduced motion is designed**, not just switched off (`globals.css:1466-1486`; `S/h-rm-space-1200ms.png`).
- **The canvases have mirrors.** The canvas tabs have accessible DOM mirrors in the arrow-key order (`src/app/projects/page.tsx`). Notes underlines on focus instead of drawing a ring the masks would clip (`globals.css:706-719`).
- **One hundred weighted colourways** (`character.ts:378`) make every load a little different.
- **The voice holds everywhere**, including the commit log. There are no exclamation marks, and every sentence ends.

---

#### R1. "Arrives dressed": link cards, a real domain, icons (F-H6, F-L6, and JSON-LD)

**Pitch:** a shared link shows his name, his line and Urchi before anyone clicks.

**Evidence (confirmed):**
- `layout.tsx:7-11` sets only `metadataBase`, `title` and `description`. There is no `openGraph`, `twitter` or `alternates`.
- `SITE_URL` is `"https://eigengrau.example"` (`site.ts:10`).
- `src/app/icon.svg` is a 3px dot on eigengrau, and there is no `apple-icon`.
- The JSON-LD `Person` (`layout.tsx:21-33`) has `name`, `jobTitle` and `url`, and no `sameAs`.
- Most people meet a portfolio as a link in iMessage, Slack, Discord or LinkedIn, and today that link is a bare grey title.

**How it works**
1. Set `SITE_URL` to the real domain (the Vercel domain until a custom one exists). Every absolute URL follows it: the cards, the JSON-LD and the canonicals.
2. In `layout.tsx` add:
   - `openGraph: { type: "website", siteName: "eigengrau", title: NAME, description: TAGLINE }`
   - `twitter: { card: "summary_large_image" }`
3. **Correction:** don't put `alternates: { canonical: "/" }` in the root layout. Child routes inherit it, so every page would declare itself a copy of the home page and search engines would drop the deep pages. Set canonicals per route:
   - `export const metadata = { title: "Notes", alternates: { canonical: "/notes" } }` in each page file
   - `` alternates: { canonical: `/projects/${slug}` } `` inside `generateMetadata` in `src/app/projects/[slug]/page.tsx`
4. **New** `src/app/opengraph-image.tsx`, using `ImageResponse` from `next/og`, 1200x630:
   - the eigengrau ground
   - "Darius Tan" in Grotesk 500 at 44px at x96 y96
   - "Basic Human" in Newsreader 400 at 44px beneath it
   - bottom-left, "eigengrau" at 20px and 60% ink (`#959593`, 6.0:1)
   - right, a 360px Urchi head from a **new** `public/og/urchi.png`. Render it once from `urchi/index.html` with Playwright, the way `scripts/gen-assets.mjs` already drives a browser, in the "denim" colourway, so the card has one fixed eye colour.
   - Fonts: read `public/fonts/grotesk-500.woff` and `serif-400.woff` with `fs` on the Node runtime. Satori reads WOFF, TTF and OTF, not WOFF2.
5. Per route:
   - **New** `src/app/projects/[slug]/opengraph-image.tsx`: the cover on the left at 630x630, object-fit cover. On the right: the title in serif 64px, `statusWord(p)` ("alive since 2024") in grotesk 22px at 60%, and the why-line in serif 28px.
     - The covers in `public/work` are `.webp`, and Satori may not decode WebP. Have `gen-assets` write a `.jpg` sibling for card use.
     - A GitHub project with no cover gets its title alone, large, with its status word. One hairline crosses the card at the height its year sits on the thread: a nod to the ball, not a render.
   - **New** `src/app/notes/opengraph-image.tsx`: the newest note in serif 56px with its date in grotesk 20px at 60%. ("i got a free burrito heh" is honestly a great card.)
   - `/music` gets a static card: "**Music** What he is playing, from Last.fm." A live card would call Last.fm on every crawl.
6. Icons:
   - **New** `src/app/apple-icon.png` at 180px: Urchi on eigengrau with 24px padding.
   - Replace `src/app/icon.svg` with a 32px pixel Urchi in denim (`#6C92F8` / `#102A6E`), painted once from `paintFrames` in `LiveIcon.tsx:74` by a small script. Keep the file name, which the README names as the fallback.
7. JSON-LD: add `sameAs: ELSEWHERE.filter(l => !("copy" in l)).map(l => l.href)` (GitHub and Instagram) and `description: TAGLINE`.

**Looks and reads:** the root card reads "Darius Tan / Basic Human", with Urchi looking out of the right third and "eigengrau" small in the corner. A project card reads "Nocturne / paused since 2025 / *its why-line*".

**Where:** link previews, bookmarks, home screens. Nothing changes on screen.

**Data:** static, all at build time. No backend.

**Implementation sketch:**
- `layout.tsx`
- each `page.tsx`'s `metadata`
- three **new** `opengraph-image.tsx` files
- a **new** `scripts/og-urchi.mjs` (or a step in `gen-assets.mjs`)
- `site.ts:10`

**Edge cases:**
- Slack and LinkedIn cache cards for days, so ship after the domain is final. LinkedIn's Post Inspector refreshes a card.
- The placeholder projects' cards regenerate from `PROJECTS` when the real ones land.
- Night hours, sound and reduced motion do not apply.

**Effort:** M. The metadata and root card take a day; the per-project card adds a day.

**What it shows:** he knows where a portfolio is really first seen.

**Risks:**
- Satori supports only a flexbox subset, so keep the cards simple.
- Keep the font reads on the Node runtime.

---

#### R2. "Say the name" (F-H1 and F-L5's monogram)

**Pitch:** after the first five seconds the visible site never says who made it. Let the monogram, the intro and About say it, each in its own way.

**Evidence (confirmed):**
- `.intro-side` is `display: none` at 1025px and below (`globals.css:362-366`).
- About's name is only in an `sr-only` `h1` (`src/app/about/page.tsx`).
- `TAGLINE` is only in the meta description and an `sr-only` line (`src/app/page.tsx`).
- The monogram's accessible name is "Home" while it shows "D . T" (checked in Chromium), which fails 2.5.3 Label in Name.
- **Correction** to the claim that nobody is ever named: the browser tab title does carry the name ("Notes - Darius Tan", `layout.tsx:9`). So desktop is less bad than stated. On a phone the title is hidden.

**How it works**

a) **The monogram unfolds.**
1. On hover (after 120ms of intent) or keyboard focus, "D . T" becomes "Darius Tan". The D and the T stay put, "arius" and "an" rise through masks, and the spaced dots close up.
2. Timing: `DUR.tab` 0.42s with `EASE.tab` (`power3.out`), stagger 0.018s. It folds back in 0.3s `power2.in`.
3. Structure inside `FloatingLogo.tsx:34`:
   - `<span class="logo-mono">` holds `MaskedChars text="D . T"`.
   - `<span class="logo-name" aria-hidden="true">` holds `MaskedChars text="Darius Tan"`, absolutely positioned with `right: 0; top: 0`. The name grows leftward from the monogram's right edge, so the nav never re-centres and the pills never move (mock: `S/mock-b-nav-name-chip-tip.png`).
4. Arm it only after `placed` is true (`FloatingLogo.tsx:18`), so the intro's flight of the monogram is untouched.
5. Phones have no hover. On a first-ever load only, it unfolds once, 600ms after the chrome lands, holds for 2.4s, and folds back.
   - **Correction:** use a **new** `firstLoad()` in `src/lib/visits.ts`, true when `read()` found nothing in `begin()`. Not `lastVisit() !== null`: `prev` stays null for thirty minutes after a first visit (`visits.ts:78`), so the one-off would replay on every reload in that window.
6. Accessible name: drop `aria-label="Home"`. Visible "D . T" plus a `sr-only` ", Darius Tan, home" gives the name "D . T, Darius Tan, home", which contains the visible label.
7. Render `FloatingLogo` before `Nav` in `Shell.tsx:197-198`, so it comes first in the tab order, as it does on screen.

b) **The intro names him on every screen.**
- Desktop: bring the name and role in to flank the ring instead of the window edges.
  - `IntroRing` knows its radius; have it write a **new** `--ring-r` on `.space-panel`.
  - Then `.intro-side { padding-inline: max(9%, calc(50% - var(--ring-r) - 200px)); }`. At 1440 that puts the name about 150px from the ring, not 590px.
- At 1025px and below, show them instead of hiding them:
  - the name above the ring, centred, 14px, at `top: calc(50% - var(--ring-r) - 40px)`
  - the role below it, at `calc(50% + var(--ring-r) + 24px)`

c) **About gets a byline.**
- The statement and status line are troika text in the canvas (`AboutScene.ts:167`). A DOM line can't just be stacked above them.
- **New** `onLayout(top, bottom)` option on `AboutScene`, called after it lays out its lines. `AboutPanel` writes `--statement-top` and `--status-bottom`.
- Above the statement, 48px over its first line: a DOM `<p class="about-byline">` in 12px grotesk at full ink. It reads "Darius Tan, basic human." (`` `${NAME}, ${ROLE.toLowerCase()}.` ``). The lowercase form in `S/mock-b2-about-name-eyes-ring.png` reads as a sentence, which is the house rule.
- Below the status line: `TAGLINE` in 12px grotesk at 60% ink (6.0:1).
- Keep today's tagline until the security work exists on the site. Then: "Interfaces, small tools, and the security underneath them."

**Looks and reads:** hovering the monogram gives "Darius Tan", tight, in the same 14px grotesk. The About page opens with "Darius Tan, basic human." above "Quiet interfaces for".

**Where:** `FloatingLogo.tsx`, `IntroRing.ts`, `globals.css:350-366`, `AboutPanel.tsx`, `AboutScene.ts`, `visits.ts`.

**Data:** none. `firstLoad()` reads the existing `eigengrau:visits` key.

**Edge cases:**
- Reduced motion swaps the text instantly.
- Private mode means every load is a first load, as `visits.ts` already accepts.
- At 320px the unfolded name must not reach the viewport edge. Clamp with `max-width` and let it overflow leftward only.
- Night hours and sound do not apply.

**Effort:** S. The byline is S+, because of the layout callback.

**What it shows:** confidence. The name is there when you look for it.

**Risks:** the unfold must never shift a pill. Test at 390px and 320px, where "Darius Tan" is about 50px wider than "D . T".

---

#### R3. "The digits work" (F-H2)

**Pitch:** the numbers on the pills are a promise. Keep it: 1 to 5 change rooms from anywhere.

**Evidence (confirmed):**
- `grep keydown` finds handlers only in Notes, Space's control, Projects, Music, `sfx`'s wake and the sky debug panel. There is no digit handler anywhere.
- In Chromium, pressing 4 on `/notes` opens a search instead (`NotesPanel.tsx:1012-1033`).

**Corrections to the proposed fix**
1. **Listener order.** The proposal adds `if (!query && /^[1-5]$/.test(e.key)) return;` to Notes. But the nav's `window` listener is registered first, because Shell mounts before the dynamically loaded NotesPanel, so it would navigate even in the middle of a search.
   - Register the tab-keys listener in the **capture** phase on `window`. That makes the order fixed.
   - Give it a **new** `finding` flag in `src/lib/flags.ts` that Notes sets from its existing `finding` (`NotesPanel.tsx:732`).
   - When the handler navigates it calls `e.preventDefault()`. Notes already returns on `e.defaultPrevented` (`NotesPanel.tsx:1013`), so no Notes guard is needed.
2. **Keep the digit in the name.** Chromium names the pills "Space 1", "Projects 2" and so on (checked). The proposal's "Projects2" is wrong. An inactive pill's only visible label is its digit, so `aria-hidden` on the `<sup>` would fail 2.5.3. Add `aria-keyshortcuts={String(n)}` to the link and keep the digit.
3. **Added: WCAG 2.1.4 Character Key Shortcuts (Level A).** Single-character shortcuts need a way to turn them off. Otherwise speech-input users who say "two" get sent to Projects. The switch lives in the Colophon (R17) and is kept in `localStorage['eigengrau:keys']`.

**How it works, step by step**
1. **New** `src/lib/keys.ts` exports `installTabKeys(push: (href: string) => void)`. It adds `window.addEventListener("keydown", h, { capture: true })`.
2. `h` returns early if any of these is true:
   - a modifier is held, or `e.repeat`, or `e.isComposing`
   - the target is inside `input, textarea, select, [contenteditable]`
   - `getFlags().transitioning`
   - `getFlags().finding && location.pathname === "/notes"`. The query persists on a kept Notes tab, so check the path too.
   - the keys are switched off in storage
   - the intro is running
3. If `/^[1-9]$/` matches and `n <= TABS.length`, and `TABS[n-1].href !== location.pathname`, then `e.preventDefault()` and `push(href)`.
4. Pressing the current tab's digit does nothing.
5. Install it in Shell next to `installViewportVars()` (`Shell.tsx:79`), with `useRouter().push`.
6. NotesPanel: `useEffect(() => setFlag("finding", finding), [finding])`, and clear it on unmount.
7. To search for "2026" on Notes, open the field by tapping "Notes", or type any letter first. Inside the field, digits type as normal.

**Looks, sounds, reads:**
- The slide is the one you get from clicking a pill, and so is its sound (`Shell.tsx` decides whether to slide).
- On keyboard focus, the pill's tip (R11) reads "Notes" and nothing more.
- The Colophon row reads: "Keys. One to five change rooms, from anywhere. *Turn them off.*"

**Where:** global. Keys 1 to 5 (1 to 6 if Desk lands, R16).

**Data:** `localStorage['eigengrau:keys'] = "off"`, read in try/catch.

**Implementation sketch:**
- **new** `src/lib/keys.ts`
- `src/lib/flags.ts` (the `finding` flag)
- `Shell.tsx:79`
- `NotesPanel.tsx:732`
- `Tab.tsx:47-58` (`aria-keyshortcuts`)

**Edge cases:**
- Reduced motion: Shell already shows the tab at once (`canSlide` is false).
- A digit pressed mid-slide is ignored.
- During the intro, a digit hurries it (R12) instead of navigating.
- The sky debug panel's seed field is an input, so it is skipped.
- Numpad digits report `e.key` "2" with NumLock on, so they work.
- Projects uses the arrows, Enter and Esc; Space's control uses Enter and the arrows. Neither uses digits, so there is no clash.

**Effort:** S.

**What it shows:** the chrome keeps its promises.

**Risks:** speech input, which the off switch covers, and muscle memory if tabs are ever reordered.

---

#### R4. "Sound in every pocket" (F-H3 and F-M10)

**Pitch:** a third of the craft is sound. Let every visitor switch it on, and let the switch say what it is.

**Evidence (confirmed):**
- `@media (max-width: 1024px) { .sound-chip { display: none } }` (`globals.css:237-241`). `motion.ts` `BP.desktop` notes the choice ("sound chip + cursor labels above this").
- `SoundChip.tsx:21` is the only caller of `sfx.toggle()`.
- On a phone, Music's `if (sfx.enabled) listen(t)` (`MusicPanel.tsx:1254`) can never run.
- **Added:** the chip's name flips between "Turn on sound" and "Turn off sound" while it also carries `aria-pressed` (checked in Chromium). A toggle whose name and state both change reads as "Turn off sound, toggle button, pressed", which is a contradiction.

**How it works**
1. Delete the `display: none` at `globals.css:237-241`.
2. Move `<SoundChip/>` from `Shell.tsx:199` into `Nav.tsx`, after `.tabs` inside `.nav-inner`. It then mirrors the monogram, 14px from the tabs on each side.
3. Chip geometry: `position: static; pointer-events: auto; height: auto; align-self: stretch; min-width: 28px;`. It becomes as tall as the pills (27.4px) and shares their baseline.
4. Name: a static `aria-label="Sound"`, with state carried only by `aria-pressed`.
5. It morphs like a pill:
   - On hover or keyboard focus, the word "Sound" slides out beside the dot in serif 15px, using `Tab.tsx`'s spacer technique.
   - After a click it shows a sentence for 1.2s, "Sound on." or "Sound off.", then folds back to the dot, with the ring when on.
   - On a phone's first tap the sentence holds for 1.6s.
6. **Added: the iPhone silent switch.**
   - Previews go through Web Audio (`createMediaElementSource`, `sfx.ts:209`), which the ringer switch mutes.
   - Safari 16.4 and later expose `navigator.audioSession.type`. Set it to `"playback"` while a Music preview is sounding, so a song the visitor chose plays through the switch. Set it back to `"ambient"` otherwise, so UI ticks stay polite.
   - Feature-detect it, and verify on a real device.
   - Where it is missing, the first iOS tap reads "Sound on. If the phone is on silent, so is this."
7. `chipAt()` (`attention.ts:125`) queries `.sound-chip` wherever it is, so Urchi's startle still finds it. On a bottom bar (R9) it would look down, which is nice.

**Looks and reads:** "D . T  [1][Notes 3][4][5]  [•]" on one line. Hovering the dot reveals "Sound •"; a click says "Sound on." for a beat.

**Where:** the nav group, on every screen.

**Data:** `sfx` already remembers the state for the visit.

**Implementation sketch:**
- `SoundChip.tsx`
- `Nav.tsx`
- `Shell.tsx:199`
- `globals.css:201-241`
- `sfx.ts` (the `audioSession` switch, in the deck's start and stop)

**Edge cases:**
- Reduced motion swaps the word without a slide.
- At night an asleep Urchi does not startle. Confirmed: `Attention.play` refuses non-sleeping acts unless awake (`attention.ts:349-351`).
- The nav's width at 390px with the chip is about 300px, and it fits. Test at 320px.
- Sound stays off by default.

**Effort:** S-M.

**What it shows:** he finished the sound design for everyone, not only for desktop.

**Risks:**
- The nav group gets longer.
- `audioSession` behaviour varies across iOS versions.

---

#### R5. "The project's own page" (F-M4): the template the real GitHub projects will live in

**Pitch:** a case page should feel like a page of the Projects tab, set in the ball's type, with the facts a developer looks for.

**Evidence (confirmed):**
- `Nav.tsx:35` matches the path exactly, so no pill is current on `/projects/[slug]`.
- `.case h1` is 12px grotesk (`globals.css:534-537`), while the ball sets the name in serif at 22px (`ThreadScene.ts:264`). The status is 12px here and 11px there.
- The only "Back" is at the very end (`[slug]/page.tsx`).
- `body` is `overflow: hidden` and `.case` is never focused, so PageDown does nothing.
- **Added:** `projectsLine()` (`site.ts:209-213`) and the case page's piece count use `numberWord`, which returns digits after twelve (`site.ts:189-191`). Past twelve real projects, the heading will read "14 projects since 2021.", breaking the words-to-ninety-nine rule. Use `countWord` (`site.ts:201`).

**How it works**
1. **The pill.** `Nav.tsx:35` passes both `exact` and `within` (`pathname.startsWith(t.href + "/")` for any tab but `/`).
   - `Tab` animates its label open when either is true.
   - It sets `aria-current="page"` only when exact, and `aria-current="true"` on a case page. A case page is inside Projects, not Projects itself.
   - Change the CSS selectors that key on `[aria-current="page"]` (`globals.css:163-170`) to `[aria-current]`.
   - `ProjectsPanel`'s `ballTakesEnter` matches `[aria-current="page"]` only on `/projects` itself, so it is unaffected.
2. **The ball's type.**
   - `h1 { font: 400 22px/1.2 var(--font-serif) }`
   - `.case-status { font: 500 11px/1.4 var(--font-grotesk) }`
   - The why-line and summary stay at 14px serif.
3. **A facts row for GitHub projects,** reusing Notes' meta layout (`.note-meta`: flex, space-between, 11px grotesk):
   - left: the span, "2024 to now" or "2022 to 2023"
   - right: "Source   Live" as links, underlined on hover like the tags
   - under it, 11px grotesk at 60%: "TypeScript. Last touched three days ago."
   - Leave star counts out: small numbers read as small.
   - Data: whatever fields the GitHub branch adds to `Project`. If it adds none, suggest `repo?: string; live?: string; span?: [number, number | null]`, plus a **new** `src/content/github.json` (`{ [slug]: { language, pushedAt } }`) written by a local script.
   - The row is omitted when there is no data.
4. **Foot of the page:** "Next: Sundial, paused since 2025." in serif 14px, with the next project in thread order (by year) and `statusWord()`. Then "Back to the thread" in grotesk 12px. The same "Back to the thread" also goes above the cover. Both link to `/projects#slug`, as "Back" does now.
5. **Scroll and keys:**
   - `.case { align-content: start }` (the 404 overrides it, R8).
   - A **new** client island `CaseFocus.tsx` inside the server page: `tabIndex={-1}` on `main.case`, and `main.focus({ preventScroll: true })` on mount. PageDown, Space and the arrow keys then work.
   - `.case:focus { outline: none }`.
6. `projectsLine()` and the pieces heading switch to `countWord`.

**Looks and reads:** a centred column. The cover, then "Nocturne" in 22px serif, then "paused since 2025" in 11px grotesk, then the why-line. The facts row reads like a note's date line.

**Where:** `/projects/[slug]`.

**Data:** static, at build time. No runtime GitHub calls, so no rate limits and no token in the client.

**Implementation sketch:**
- `src/app/projects/[slug]/page.tsx`
- **new** `CaseFocus.tsx`
- `Nav.tsx:35`, `Tab.tsx`
- `globals.css:519-560`
- `site.ts` (`countWord`)

**Edge cases:**
- Phones: one column, with the facts row wrapping onto two lines.
- Reduced motion does not apply.
- The `/projects#slug` round trip is unchanged.
- A returning visitor sees nothing different.

**Effort:** S. The GitHub JSON script adds S.

**What it shows:** real work is presented as real work, with its source, its span and when it was last touched.

**Risks:** the GitHub-projects session is changing `site.ts` and probably this page right now. Land this after that merges, or hand that session these rules.

---

#### R6. "The ball answers the Tab key" (F-H4)

**Pitch:** Tab should light a project on the ball, as hover does.

**Evidence (confirmed):** after the chrome, the only Tab stops on Projects are the `sr-only` mirror links, "Case: Halo" and so on (`src/app/projects/page.tsx:20,42`). Nothing on screen changes (`S/j-projects-tab-into-mirror.png`). That fails 2.4.7 Focus Visible.

**How it works**
1. **The primary fix (S-M).** When a mirror link gets focus, the ball lights that project.
   - The document `focusin` listener already exists (`ProjectsPanel.tsx:121,204`). Extend it: if the target matches `a[href^="/projects/"]` inside the mirror, call the **new** `scene.choose(slug)`.
   - `focusout` calls `scene.choose(null)`.
2. `choose` is `step()`'s own logic addressed by slug (`ThreadScene.ts:2485-2514`):
   - Find the bead with `this.order.find(b => b.project?.slug === slug)`.
   - If a project is opened, `openBead(b)`.
   - If the supernova's field is on, `setHover(b)`.
   - Otherwise `this.keyHold = true; this.turnTo(b, this.dur(0.8)); this.setHover(b)`.
   - `choose(null)` calls `setHover(null)` unless opened.
3. Enter follows the focused link to the case natively. `ballTakesEnter()` already leaves Enter to a link with key focus (`ProjectsPanel.tsx:131-137`). Esc winds back as now. The canvas stays `aria-hidden`.
4. **The fallback, shipped with it (S).**
   - **Correction:** the proposal's CSS un-hides the focused link inside `section.sr-only`. But that section is itself 1px with `overflow: hidden` and `clip`, so the link can't escape it reliably.
   - Instead, `ProjectsPanel` renders its own `<p class="projects-focus glass" aria-hidden="true">` at `bottom: calc(var(--bottom-ui) + 8px)`, centred. It is filled on mirror focus and emptied on blur.
   - Style: 12px grotesk at full ink, padding `5px 8px 6px`, radius `var(--r)`, a 1px ink outline 2px out. It fades in over 150ms (instantly under reduced motion).
   - Copy: "Halo. Enter opens the case."

**Where:** `/projects`, from the Tab key.

**Data:** none.

**Implementation sketch:**
- `ProjectsPanel.tsx:121` (the focus listener)
- `ThreadScene.ts` (**new** public `choose`)
- `globals.css` (`.projects-focus`)
- `src/app/projects/page.tsx`: add a `projects-mirror` class to the section so the listener can scope to it

**Edge cases:**
- Reduced motion: `turnTo` with the scene's reduced durations.
- Phones have no Tab key, so nothing changes.
- In the supernova, focus steps through the covers like the arrows.
- Studies have no links, so they are not stops.

**Effort:** S for the chip, S-M for `choose`.

**What it shows:** the WebGL is not a wall for keyboard users.

**Risks:** `turnTo` spinning the ball on every Tab press could feel busy. Cap it with the existing 0.8s turn.

---

#### R7. "Quiet, but legible" (F-M1)

**Pitch:** keep volume as a concept and lift the floor to AA.

| Text or mark | Where | Now | To | Ratio |
|---|---|---|---|---|
| Least-played song title (a 16px link) | `MusicPanel.tsx:14` `QUIETEST` | 0.28 (2.28:1) | 0.5 | 4.56:1 |
| Other titles while one is chosen | `globals.css:1282` `calc(var(--level) * 0.3)` | down to 0.08 | `max(0.5, calc(var(--level) * 0.6))` | ≥4.56:1 |
| Contact-sheet year, 11px | `ThreadScene.ts:627` `YEAR_INK` | 0.4 (3.34:1) | 0.55 | 5.21:1 |
| A month the filter empties, 12px | `globals.css:886` | 0.35 (2.87:1) | 0.5 | 4.56:1 |
| Folded-note hairline (a button) | `globals.css:849` | 18% (1.64:1) | 38% | 3.14:1 (non-text) |
| Hot hairline | `globals.css:857` | 45% | 70% | 7.73:1 |
| Zoom track afloat | runtime: `Tether.ts:19` `ROPE.alpha` via `CreativeSpacePanel.tsx:236` | 0.35 (2.87:1) | 0.4 | 3.34:1 |
| Secondary 60% text | `globals.css:1223, 1262` | 0.6 (6.0:1) | keep | 6.0:1 |

- **Correction:** `--zoom-ink` at `globals.css:458` is only a default. The panel overwrites it from the tether's alpha, so editing the CSS changes nothing. Raising `ROPE.alpha` to 0.4 keeps the line and its track one ink, which is the stated intent in `globals.css:447-449`, and passes 3:1. Decoupling them is the alternative, if he wants the line fainter.
- **Correction:** the proposal's hover floor of 0.35 still fails (2.87:1). With `max(0.5, level * 0.6)`, the chosen song goes to 1 and the rest sit between 0.5 and 0.6, which still reads as a spotlight.
- The type size, 16px to 64px, carries the volume.
- Extend `@media (prefers-contrast: more)` (`globals.css:1058`) to set all of the above to 1, with `--glass-bg: rgb(40 40 47 / .92)` and `:focus-visible { outline-width: 2px }`.
- **Added:** `@media (prefers-reduced-transparency: reduce) { :root { --glass-bg: #1f1f26; --glass-blur: 0px } }`. `#1f1f26` is exactly what the glass looks like over the ground, so nothing changes at rest. Chromium honours it; other browsers ignore it harmlessly.

**Edge cases:** the Music room's colour (`tone.ts`) already guards contrast with `MIN_CONTRAST = 13.4` (`tone.ts:346`), and the floors above sit on top of it.

**Effort:** S.

**What it shows:** accessibility treated as craft, not compliance.

**Risks:** the Music stack loses a little of its range at the quiet end.

---

#### R8. "Honest rooms": the 404, a Last.fm outage, and loading (F-M7, F-M8, F-M9)

**The 404: "Nothing at /nope."**
- **Evidence (confirmed):** `not-found.tsx` puts "Nothing here." and "Back" in `.case`, a full-height grid whose rows stretch, so they split apart (`globals.css:519-527`).
- Layout: `<main className="case lost">` with `.case.lost { align-content: center; gap: 12px; }`.
- Copy:
  - serif 16px: "Nothing at /nope."
  - grotesk 11px at 60%, by day: "Urchi looked twice."
  - the same, at night (`clock().hours === "night"`, `hours.ts:31`): "Urchi is asleep. It will look in the morning."
  - then the five tabs as words in grotesk 12px, 24px apart: "Space  Projects  Notes  Music  About"
  - Mock: `S/mock-c-404.png`.
- **Correction, a security one.**
  - Echoing the raw path lets anyone mint a link that makes the site say their sentence (`/your-account-is-locked-call-...`). That is text injection, and he would flag it on someone else's site.
  - A small client island reads `usePathname()` and runs `decodeURIComponent` in a try.
  - It keeps only `[A-Za-z0-9/._~-]`, collapses repeated slashes, and cuts at 32 characters with "…".
  - If nothing is left, it says "Nothing here.".
- Title: render `<title>Nothing here - Darius Tan</title>` in the component. React 19 hoists it into the head, which is surer than a `metadata` export on `not-found`.
- Later (M): About's small Urchi mark above the line, doing its `lookAround` act (`acts.ts`) and then looking at you. Asleep at night.
- Effort: S.

**A Last.fm outage says so**
- **Evidence (confirmed):**
  - The route returns `EMPTY_NOW` with a 200 both on a missing key (`src/app/api/now/route.ts:159`) and on any failure (`route.ts:232-233`).
  - The client also returns `EMPTY_NOW` on `!res.ok` (`src/lib/now.ts:58`).
  - An outage therefore reads "No plays this week.".
- **Correction:** the quiet-week half needs nothing. `last` comes from `user.getrecenttracks` with no date bound (`route.ts:166`), so in a quiet week the page already shows "Last played, three days ago." with its sleeve (`MusicPanel.tsx:1157`). The empty sleeve with "Quiet" appears only on failure, or on a brand-new account. Keep it for that case: it reads as an empty sleeve.
- The fix:
  1. `NowResponse` gains `down?: true | "unset"`. On failure the route sends `{ ...EMPTY_NOW, down: true }`; on a missing key, `down: "unset"`. `fetchNow` does the same on `!res.ok` or a throw.
  2. On every good answer, the panel keeps `{ at, data }` in `localStorage['eigengrau:week']`.
  3. When `down` arrives, it shows the kept week at 60% ink, headed "**Music** Last.fm is not answering. This was the week as of Tuesday.". With nothing kept: "**Music** Last.fm is not answering. The room will fill when it does.".
  4. With `"unset"` (dev only): "**Music** Last.fm is not set up here."
- Where: `route.ts`, `now.ts`, `MusicPanel.tsx`.
- Effort: S.

**Loading that is already the page**
- **Correction on method:** the blank-screen timings (1-3s on Projects) were measured on `next dev`, which compiles on demand. Measure on a production build first. Because the dev server holds `.next`, build in a copy of the repo and run `next start` there.
- The real, growing risk: `ThreadScene.load()` waits for every project cover and every piece's still before drawing anything (`ThreadScene.ts:1369-1381`), and real GitHub projects will add to that list.
  1. Give `load()` a **new** `onProgress` option that counts settled promises, as `loadAll` in `loader.ts:93` already does.
  2. `ProjectsPanel` shows a DOM heading at the provisional line, "**Projects** Six since 2021. Two alive." (R14 renames "Work"). Under it, a 1px hairline at 30% ink grows from 0 to 240px with the progress.
  3. When `load()` resolves (`ProjectsPanel.tsx:65`), the DOM heading fades out over 200ms as the WebGL heading fades in wherever the balance puts it. It does not claim to take "the same pixels".
  4. Later (M): draw the thread and the marks first, and fade each cover in as it lands.
- Music: show "**Music** Asking Last.fm." until the first answer, instead of rendering nothing (`MusicPanel.tsx:1288`).
- About: loads fast enough; leave it.
- Effort: S-M.

**What it shows:** the site never lies, even when it is broken or busy.

---

#### R9. "Room for a thumb" (F-H5, split)

**Evidence (confirmed):**
- Inactive pills on a phone are 18-21 x 27.4 px, 4px apart (`globals.css:140-156`), with centres 23px apart. That fails 2.5.8's spacing exception (24px).
- The bar sits 8px from the top (`S/f-phone-thumb-notes.png`).

**Now (S): bigger targets at the top.**
```css
@media (max-width: 640px) {
  .tabs { gap: 6px; }
  .tab { min-width: 24px; justify-content: center; }
}
```
- Pills become at least 24 x 27.4 with centres at least 30px apart, which passes 2.5.8 outright, without the exception.
- `Tab.tsx:28` animates padding only, so `min-width` doesn't fight it.

**Later (M), a prototype behind `?nav=bottom`: the nav at the thumb.** The proposal's CSS stands:
```css
@media (max-width: 640px) {
  :root { --nav-h: 48px; --bottom-ui: calc(2rem + env(safe-area-inset-bottom) + var(--nav-h)); }
  .nav { top: auto; bottom: calc(env(safe-area-inset-bottom) + 14px); }
  .tabs { gap: 6px; }
  .tab { min-width: 36px; min-height: 36px; align-items: center; justify-content: center; }
  .tab-num { font-size: 12px; transform: none; }
  .logo-slot { display: none; }  /* the monogram stays top-left on its own: 16px, 14px */
}
```
- This gives 36x36 pills with centres 42px apart (`S/mock-a-phone-bottom-nav-notes.png`).
- The Space caption, the About links and the Notes and Music padding all use `--bottom-ui`, so they rise clear of the bar.
- The knock-ons, with **corrections**:
  - `ThreadScene.ts:191` (not 185) hard-codes `NAV_FOOT = 35`. Read it from the nav's rect instead.
  - The Projects caption's `capY` (`ThreadScene.ts:1905`) must also subtract the bar, or the phone caption lands under it.
  - Shell's drop animation comes from above (`Shell.tsx:94-95`: `yPercent: -250`, logo `y: -57`). On the bottom bar it must rise from below.
  - `measureLogoSlot()` falls back to `{ left: 0, top: 8 }`. On phones make it `{ left: 16, top: 14 }`.
  - `Tab.tsx:28` paddings go from 12/7 to 12/10.
  - Centre the digit: `.tab-num`'s `translateY(2px)` assumes a bottom-aligned 27px pill, and the mock shows the digit riding high.
  - The intro's breath blows the work "toward the 2" (`intro.ts:45`), so it would fall down into the bar. That is a decision to make; "the work goes into the 2" still holds.
  - Safari's bottom toolbar: a tap near the bottom edge can summon it. Test on a real iPhone.
  - The landscape rules (`globals.css:1425-1464`) need a pass.
- The test: if it feels like an app's tab bar rather than this site, keep the top.

**What it shows:** phones considered as first-class, not as a narrow desktop.

**Risks:** the bottom bar changes the site's silhouette on every phone screenshot.

---

#### R10. "Glass when it's needed, one line for headings" (F-M5, F-M6)

**The rims appear only when something passes under them (S)**
- **Evidence (confirmed):** at rest, the rims draw `#1f1f26` bands on Notes and Music only (`globals.css:956-981`). Space, Projects and About are flat. The rims also use a second blur, 12px, against the one glass of 40px.
```css
.notes-rim, .music-rim, .case-rim { opacity: 0; transition: opacity 240ms var(--ease-ui); }
[data-under-top] .notes-rim-top, [data-under-top] .music-rim-top, [data-under-top] .case-rim-top,
[data-under-bottom] .notes-rim-bottom, [data-under-bottom] .music-rim-bottom, [data-under-bottom] .case-rim-bottom { opacity: 1; }
.notes-rim-top, .music-rim-top, .case-rim-top { top: -20px; height: 80px;
  mask-image: linear-gradient(to bottom, #000 calc(30% + 20px), transparent); }
@media (prefers-reduced-motion: reduce) { .notes-rim, .music-rim, .case-rim { transition: none; } }
```
- On scroll of `.notes-scroll`, `.music-scroll` or `.case`, set `data-under-top` when `scrollTop > 4`, and `data-under-bottom` when `scrollHeight - clientHeight - scrollTop > 4`.
- Put the attributes on the stage sections that hold the rims: `NotesPanel.tsx:1186`, `MusicPanel.tsx:1274`, and `main.case` in `[slug]/page.tsx`. I used descendant selectors because the rims sit inside the stage.
- Check the seam at the rim's foot (`#14141b`) in both Chromium and Safari after the change.

**One heading line (S-M)**
- **Evidence (confirmed):** Notes and Music head at the 206 line, but Projects balances its heading on a wide screen (about 142px at 1440x900; `O/desk-direct-projects.png`). The heading therefore jumps about 64px as the panels slide.
- **Correction:** the proposed `headLine(width, height)` can't be pure. Where the heading lands depends on:
  - the heading's measured ink (`above`)
  - the caption height, measured from troika text
  - the project count, through `growth`
  - the ball's fit (`ThreadScene.ts:1850-1898`)
- The fix: let the scene publish its line.
  1. **New** option `onHeadLine?: (y: number) => void` on `ThreadScene`, called where `this.headY = hy` is set (`ThreadScene.ts:1898`).
  2. `ProjectsPanel` stores it in a **new** `src/lib/headline.ts`. The store keeps `{ w, h, y }` in `sessionStorage`, so a reload at the same size has it at once, and writes `--head-line` on `:root`.
  3. `.notes-column { padding-top: calc(var(--head-line, 206px) - 12px) }` and `.music { padding-top: calc(var(--head-line, 206px) - 10px) }`.
  4. Notes and Music copy the value into their own style only on arrival (`onWhere`), never live. A heading on screen therefore never moves; only a hidden one does.
- The only mismatch left is a first visit to Notes before Projects has ever laid out. The fallback is 206 there, and Projects' heading appears after its load, never mid-slide.
- Phones keep `lineHeadingY`, which the published value reflects anyway.

**What it shows:** the five rooms are one building.

---

#### R11. "Names for the numbers" (F-M11, with the chip's hover in R4)

**Pitch:** a newcomer should be able to learn what "3" is without clicking it.

**Evidence (confirmed):** there is no `.tab:hover` rule (`globals.css:145-156` only transitions `background-color`).

**How it works**
1. Hover background: `@media (hover: hover) { .tab:not([aria-current]):hover { background: rgb(233 233 226 / .08); } }`.
2. One shared **new** `.tab-tip` element in `.nav-inner`: a glass chip 6px under the hovered or focused pill, holding its label in serif 15px/110% with `5px 8px 6px` padding (mock: `S/mock-b-nav-name-chip-tip.png`, "Notes" under the 3).
3. Timing:
   - It appears after 250ms of hover, or at once on keyboard focus.
   - Moving between pills within 600ms of a tip moves it at once.
   - It rises 4px over 180ms `power3.out` and leaves in 120ms.
4. Reduced motion: fade only.
5. Phones don't get it; the bigger targets (R9) and the active label carry the job.
6. The tip is `aria-hidden`, because the link's name already says it.

**Where:** `Nav.tsx`, `globals.css`.

**Edge cases:**
- Urchi already looks up at a hovered pill; the tip doesn't change that.
- With R3, a keyboard focus tip reads only the label.

**Effort:** S.

**Risks:** tooltips are generic. Keep this one as quiet as a pill.

---

#### R12. "A second look is shorter" (F-M12)

**Pitch:** the intro is a gift the first time and a toll the fifth.

**Evidence (confirmed):**
- Phase A lasts at least 1.2s, then phase B runs to `T.drop = 5.05`, and the drop takes 0.8s (`intro.ts:18-42`, `motion.ts`). That is about seven seconds on every hard load of `/`, with no skip.
- The reported timing was measured on dev, but the choreography is fixed, so the total holds.

**How it works**
1. **Hurry, not skip.** Any `pointerdown`, `keydown` or `wheel` during the intro sets `timeScale(4)` on both timelines, and `MIN_A` is dropped. The choreography stays legible and lands in about a second.
   - `runIntro` (`intro.ts:59`) now returns only a stop function. Change it to return `{ stop, hurry }` and update its caller in `CreativeSpacePanel.tsx`.
2. **The short form** for anyone who has been here before. That is the **new** `firstLoad()` from R2 returning false, which also covers reloads in a new tab within thirty minutes, where `lastVisit()` and `sessionStorage` both miss.
   - Skip phase A and the ring. The eyes open, blink, the head builds and the chrome drops: about 2.1s from `T.eyes` to `T.drop`.
   - A first-ever visit keeps the full seven seconds.
3. Digits during the intro hurry it (R3); they don't navigate until the chrome has landed.

**Edge cases:**
- Reduced motion already skips the intro.
- Sound doesn't apply.
- Night hours: the short form still opens its eyes. Check that the night-sleep state takes over after the drop, as it does now.

**Effort:** S.

**What it shows:** respect for a returning visitor's time.

**Risks:** the ring was the first sight of the work, so returning visitors lose it. They have seen it.

---

#### R13. "Focus that belongs to the character" (F-M3, F-L8, F-M2)

**Pitch:** no rectangles round a creature. When the keyboard reaches Urchi, its own white rim thickens and it turns to look at you.

**Evidence (confirmed):**
- The ring round Urchi is the global 1px box (`globals.css:92-95`): a rotated rectangle afloat, and a 535x432 box at home with an ear poking out (`S/i-urchi-home-focus.png`, `O/desk-5-about.png`).
- After a click on Urchi, the next keypress of any kind turns `:focus-visible` on.
- Urchi watches pills under the pointer only (`attention.ts:548-567`, `pointerover`).
- The cursor label over a blue eye is `#ff6f00` on `#0090ff`, 1.17:1 (`O/desk-02-space-hover.png`).

**How it works**
1. **The rim.**
   - **Correction:** `rim` is a constructor option stored `readonly` (`Urchi.ts:113,151,165`) and read through `rimFor` (`Urchi.ts:249`). Add a **new** `setRimScale(k: number)` that multiplies the held rim.
   - On keyboard focus of `.space-urchi`, tween `k` from 1 to 2 over 0.18s; back over 0.24s on blur. Reduced motion sets it instantly.
   - At home the rim is one art pixel of a head about 116 art pixels tall. At 432px that is about 3.7px, so doubling adds a 3.7px white band against the ground. That is a clearly visible change, in the spirit of 2.4.13.
   - Afloat, the suited figure's outline thickens the same way, through the same host.
2. **It looks at you.**
   - **New** `Attention.attend(on)` adds a high-weight target `{ id: "focus", at: () => this.ahead() }`. `ahead()` is the existing "out at you" point (`attention.ts:709`). It is removed on blur.
   - Asleep, it doesn't wake. Its lids flicker once, as a sleeping act (`play(..., { sleeping: true })`).
3. **The box goes only when the ring is drawn.** The panel sets `data-ring` on `.space-panel` once the scene confirms it can draw the rim. `.space-panel[data-ring] .space-urchi:focus-visible { outline: none }`. If WebGL failed, the box stays.
4. **Mouse, then a key.** On `pointerdown` on the control, set `data-pointer`, and clear it on the next Tab keydown. `.space-urchi[data-pointer]:focus-visible { outline: none }`.
5. **Every other ring:** `:focus-visible { outline: 1.5px solid var(--ink); outline-offset: 3px; border-radius: var(--r); }`. For the About links, `.elsewhere a { padding: 8px 6px; margin: -8px -6px; }` gives the ring room and makes the targets about 33px tall.
6. **Urchi watches the keyboard (F-L8).** Next to `over` and `out` in `attention.ts:548-567`, add `focusin` and `focusout` twins. If the focused element is a `.tabs .tab` that `matches(":focus-visible")` and isn't the current page, add the same `pill:` target. Tabbing along the bar, it looks up at each pill in turn.
7. **The cursor label over colour (F-M2).**
   - A **new** `CursorLabel.set(text, { glass: true })` (`src/components/CursorLabel.ts:38`) toggles `data-glass`.
   - Pass it for Urchi's words (`CreativeSpacePanel.tsx:219-224,378`) and for Projects' "Open" (`ProjectsPanel.tsx:54`).
   - `.cursor-label[data-glass] { mix-blend-mode: normal; color: var(--ink); background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); padding: 3px 7px 4px; border-radius: var(--r); font: 500 12px/1.4 var(--font-grotesk); }`
   - Contrast goes from 1.17:1 to 13.4:1. Those labels only ever show over Urchi or a cover, so there is no switching mid-flight.
   - `difference` stays for any future label over plain ground.

**Looks and reads:** Tab to Urchi and its outline swells from a hairline to a stroke while its eyes come round to you. Tab along the pills and it follows them.

**Where:** Space, and the chrome.

**Data:** none.

**Implementation sketch:**
- `Urchi.ts` (`setRimScale`)
- `attention.ts` (`attend`, focus twins)
- `CreativeSpacePanel.tsx` (`data-ring`, `data-pointer`)
- `CursorLabel.ts`
- `globals.css:92-95`, `624-640`

**Edge cases:**
- Reduced motion: instant rim, and the look without a head turn.
- Phones: no focus rings from touch.
- Night: no waking.

**Effort:** M for the rim and look; S for the rest.

**What it shows:** accessibility designed into the character, not bolted on.

**Risks:** the rim must still read afloat at small zoom, when it is pixelated. Check at 40% and at a tenth.

---

#### R14. "Tokens, type and small things" (F-L1 to F-L4, F-L7, F-L9)

**Type and space tokens (S)**
```css
:root {
  --t-micro:   500 11px/1.4  var(--font-grotesk);  /* dates, counts, digits, status words, years */
  --t-label:   500 12px/1.4  var(--font-grotesk);  /* names, links, captions, log lines, cursor labels */
  --t-lead:    500 16px/1.25 var(--font-grotesk);  /* the heading's lead word, -0.02em */
  --t-small:   400 14px/1.35 var(--font-serif);    /* why lines, piece text, caption lines */
  --t-body:    400 16px/1.45 var(--font-serif);    /* notes, heading sentences */
  --t-title:   400 22px/1.2  var(--font-serif);    /* project names, song titles (26px in the room) */
  --t-display: 300 clamp(34px, 4.2vw, 64px)/1.375 var(--font-serif);
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px; --s9: 96px;
}
```
- Against today:
  - the cursor label goes from 13px to 12px
  - the Space caption line goes from 13px to 14px (`globals.css:405`)
  - the case `h1` takes `--t-title`
  - the case status goes from 12px to 11px
  - the tab label stays at 15px, as the chrome's one documented exception
- Mirror the numbers in a **new** `src/lib/type.ts` for troika. `ThreadScene`'s 22, 11 and 14 already match, so this locks them.
- Snap one-offs to the steps: 10, 14 and 46 become 8, 16 and 48.
- **Correction:** not the nav's 14px gap, which is spec 4.1 ("logo slot, 14px gap", `Nav.tsx:9`). Not the pill paddings of 6 and 7 either; those are optical.

**"Projects", not "Work" (F-L3, S)**
- `ProjectsPanel.tsx:53` changes to `lead: "Projects"`.
- `projectsLine()` drops its "projects" to read "Six since 2021. Two alive.", with `countWord` (R5). That mirrors "**Notes** Two since September".
- The `sr-only` mirror under its `<h2>Projects</h2>` reads fine either way.

**Fonts (F-L4, S-M)**
- Rename the family from `"Serif"` to `"Newsreader EG"` in `globals.css:13-19` and `--font-serif`.
- **Added:** also rename it in the two `document.fonts.load` calls: `Nav.tsx:18` (`'400 15px "Serif"'`) and `NotesPanel.tsx:779`. Otherwise the nav waits on a font that no longer exists, and falls back through its `then(done, done)`.
- **Confirmed:** `public/fonts/serif.woff2` has one axis, `wght` 200-800, and no `opsz`, so the 64px About statement is set in a text cut.
  - The statement is troika text from `serif-300.woff` (`AboutScene.ts`), so CSS `font-optical-sizing` alone won't reach it.
  - Make a static Newsreader instance at opsz 72 and weight 300 (with `fontTools varLib.instancer` from the OFL variable font), save it as `public/fonts/serif-display-300.woff`, and add a **new** `FONT.serifDisplay` in `src/engine/common/text.ts:5-9` for the statement and the Music room's big titles.
  - For DOM text, swap `serif.woff2` for the full variable file with its `opsz` axis and set `font-optical-sizing: auto`.
- **Added, performance:** `grotesk-500.woff`, which troika loads on Projects and About, is 140KB, against 22KB for the WOFF2 of the same face. It looks unsubset. Subset it to the WOFF2's character set, which should save around 100KB on those tabs' first load.

**About footer (F-L7, S)**
- The status gets its full stop: "Busy putting a hole in spacetime." (`site.ts:27`). It is the one sentence on the site without one.
- The Email link already copies on pointer-up and says "Copied" (`AboutPanel.tsx:49-60`). What is new: on hover or focus, the word "Email" rises out and the address rises in through the same mask, so the address is finally visible.
- Confirm the address first (`site.ts:43` is marked TODO).
- Target size comes from R13's padding.

**Urchi keeps his hours (F-L9, S)**
- Set `TIME_ZONE` (`site.ts:16`). "It is 3:12 here. It is asleep." should be about his night, not the visitor's.

**Skip link (F-L5)**
- "Skip to the page" as the first stop: a glass chip top-left while focused.

---

#### R15. "The visit's eyes": Urchi's colourway as the site's only accent (Direction B)

**Pitch:** each load draws one of Urchi's hundred colourways, and the interface wears the same colour in exactly three places.

**How it works**
1. **New** `src/lib/eyes.ts` takes over `COLOURWAYS` (`character.ts:378`), the weighted draw with `?col=`, and `drawnColourway()` (`character.ts:503`).
   - `character.ts` imports them, so Urchi, the favicon and the chrome share one draw.
   - Shell calls the draw in its first effect. Today the colourway exists only once the first Urchi does, which on a direct `/notes` load is `LiveIcon`, about 1.2s in.
2. It sets `document.documentElement.dataset.eyes` (as `character.ts:721` does now) and a **new** `--eye`:
   - Take the lighter of iris and pupil by OKLab L (`labOf` in `tone.ts:48`).
   - Clamp to L ≥ 0.74 and C ≤ 0.16 (`fromLch` and `rgbOf` in `tone.ts:65,80`).
   - Check `contrast(rgb, BG_RGB) >= 4.5` (`tone.ts:89`), raising L in 0.02 steps until it passes.
   - For hues between 10° and 40° with chroma above 0.12 (reds such as "cherry" `#AE0002`), fall back to ink, so a ring never reads as an error.
3. The three places, and only these:
   - the keyboard focus ring: `outline: 1.5px solid var(--eye, var(--ink))`
   - `::selection { background: color-mix(in oklab, var(--eye) 38%, var(--bg)); color: var(--ink); }`
   - the Notes "new since your last visit" dot (`.note-new`, `globals.css:801`)
   - **Cut:** the dot on Music's progress hairline. The Music room already takes the record's colour, and the two accents should never meet on one surface.
4. At night (`clock().hours === "night"` at load), `--eye` drops to 40% of its chroma. Its eyes are shut, so its colour is too.

**Looks and reads:** a visit with "petunia" eyes (`#F8AFFB`). Tab to "GitHub" and the ring is petunia, 1.5px, 3px off, with 4px corners (`S/mock-b2-about-name-eyes-ring.png`). Selected note text highlights in a dusty pink. Reload, and it's matcha. Someone who notices realises the ring matches the eyes.

**Where:** tokens in `globals.css`; the draw in `eyes.ts`.

**Data:** none. Optionally `localStorage['eigengrau:eyes-seen']` for the Colophon.

**Edge cases:**
- Forced colours: system colours win.
- `prefers-contrast: more`: ink.
- Phones are identical.
- Reduced motion and sound don't apply.

**Effort:** S.

**What it shows:** systems thinking. The randomness that makes the character alive is extended to the interface on purpose, with a contrast guard.

**Risks:** it bends "two colours only". Write the rule into the token comment in `globals.css:22` and the README: "Two colours, whatever a record brings, and the day's eyes in three small places."

---

#### R16. **Added:** "Desk", a sixth room for the tools, the daily game and the security work

**Pitch:** one room for things a visitor can use rather than look at: today's puzzle at the top, the free tools beneath it, the security work among them. Nothing anyone types there leaves the page.

**Why here:** the owner wants daily games, free tools and a cybersecurity showcase. Scattering them under About or as unlinked routes would hide them. Five more tabs would wreck the chrome. The tab system is generic:
- `TABS` in `site.ts:29-35` feeds `routes.ts`, `Between.tsx:130`, `visits.ts:178` and `Nav.tsx:34`.
- Adding a room is a `TABS` entry plus a `Stage` case in `Shell.tsx:29-35`.
- `intro.ts`'s `workPill()` uses index 1 (Projects), so it is unaffected.

**How it works**
1. `TABS` gains `{ href: "/desk", label: "Desk", n: 5 }`, and About becomes 6, since About conventionally comes last. Key 5 now opens Desk (R3).
2. **New** `DeskPanel.tsx`, loaded with `dynamic(..., { ssr: false })` like the others. It is a plain DOM column in Notes' language, on the shared heading line (R10).
   - The heading is written from the list: "**Desk** Today's puzzle, and four small tools. Nothing you put in them leaves this page."
3. First row, the day's game (the daily-game area defines which game): its number and state in the log voice, 12px grotesk:
   - "No. 41. Not yet played."
   - "No. 41. Solved in four. The next one at midnight."
   - The row opens in place, as a note unfolds.
4. Then one row per tool:
   - name in serif 16px
   - one line in serif 14px at 60%
   - a tag word in grotesk 11px ("security", "text", "colour"), filterable like Notes' tags
   - Each row opens in place, and each tool also has its own address, `/desk/[tool]`. That is a plain DOM page on the case template (R5) with Desk's pill current (`aria-current="true"`) and its own link card (R1).
5. Machine output (hashes, hex, headers) is set in the machine voice (R18).
6. `whatsNew()` (`visits.ts:167`) leaves `/desk` out. A daily puzzle is new every day, so Urchi would look up at the Desk pill on every visit and the gesture would stop meaning anything. It also keeps Urchi out of the games, as the owner asked.

**Looks, sounds, reads:** a column like Notes, with the day's line first. With sound on, a tool row opening gives Notes' quiet tick. There is no new colour: the eyes accent (R15) marks focus only.

**Where:**
- Tab 5, `/desk`, and `/desk/[tool]`.
- **New** `src/app/desk/page.tsx`: an `sr-only` mirror, like the other tabs.
- **New** `src/app/desk/[tool]/page.tsx`.

**Data:** `localStorage['eigengrau:desk:*']` for game state and tool preferences. No backend. Tools run in the browser, which is a promise, and also a security stance that can be stated.

**Implementation sketch:**
- `site.ts` `TABS`
- `Shell.tsx:29-35` (`Stage`)
- **new** `DeskPanel.tsx`
- **new** routes
- reuse `.notes-*` styles in `globals.css`

**Edge cases:**
- Phones: six pills at 24px minimum (R9) plus the chip come to about 330px at 390 wide. Test at 320px.
- Reduced motion: rows open without the fold animation, as Notes does.
- Night: nothing changes, since there is no Urchi here.
- A returning visitor finds their game state kept.

**Effort:** S for the room. The games and tools are M-L each, in their own areas.

**What it shows:** he builds things people use, not only things they look at.

**Risks:**
- A sixth pill crowds the bar.
- The tools could drift into a generic "dev tools" look. They must stay in the house style: two colours, sentences, and no dashboards.

---

#### R17. "Colophon" (`/colophon`)

**Name:** Colophon, the page at the back of a book that says what it was made of.

**Pitch:** the design system, shown working. It lists the materials, never the secrets, and it is where the visitor's switches live.

**How it works, section by section.** It is plain DOM like a case page, on the head line.
1. **Head:** "**Colophon** Set in Inter Tight and Newsreader, on eigengrau."
2. **Ground:** a band 240px tall that is simply the page, with: "#16161d. Eigengrau, the grey the eye sees in total darkness. The page is not black because the eye never is."
3. **Ink:** "#e9e9e2. Its inverse, so a white word in difference mode lands on it exactly. Fourteen point eight to one."
4. **Glass:** a live glass panel over a few drifting one-pixel DOM dots, with its recipe in `--t-data`: `rgba(40, 40, 47, 0.5) · blur 40px · radius 4px`.
5. **Today's eyes:**
   - a small live Urchi (the About mark at 64px)
   - "Today: petunia. One visit in fifty-three. A reload draws again." The odds are computed from the colourway's weight (52.7 in total), with `countWord`.
   - a grid of a hundred small eyes: the ones seen are filled, the rest are hairline rings, with "You have seen four."
6. **Type:** each token set in a real line from the site:
   - micro: "2026.09.28"
   - label: "Take with you"
   - small: "Still on air, so the dot still moves."
   - body: "Typing anywhere finds."
   - title: "Nocturne"
   - display: "Quiet interfaces for"
7. **Motion:** five curves drawn as 1px SVG paths, 160x80:
   - the reveal (`power4.out`, 0.9s)
   - the slide (`power4.inOut`, 1.0s)
   - the pill (`power3.out`, 0.42s)
   - the drop (`power3.out`, 0.8s)
   - the magnet

   Hovering or tapping one runs a dot along it while a word rises through a mask on the same curve.
8. **Sound:** one row per cue from `src/audio/sfx.ts`, named as materials, not as what sets them off: "A pat. A tug. A snap. A pluck, D4 down to F3. A bloom. A riffle." With sound off, a row answers "Sound is off." as Music does.
9. **Switches (added):**
   - "Sound. Off until asked. *Turn it on.*"
   - "Keys. One to five change rooms, from anywhere. *Turn them off.*" (R3, WCAG 2.1.4)
10. **Numbers:** "One hundred and thirty-six commits in six days. Twenty-five thousand lines. Two colours." Hundreds are written out here by hand, since `countWord` stops at ninety-nine.
11. **Rules,** in serif 16px, numbered in words: "One. Two colours, and whatever a record brings. Two. One glass, one radius. Three. Sound waits to be asked. Four. Nothing moves for anyone who asked it not to. Five. Every sentence ends."
12. **Served with (added, if the security area ships it):** the response headers in `--t-data` (a content security policy, `Referrer-Policy`, `Permissions-Policy`), with "Check them." and a link to `/.well-known/security.txt`. `next.config.ts` sets no headers today.

- **Cut:** the "Urchi's faces" row, where hovering made the big Urchi pull each face. It is L effort, and it teaches the faces to people who haven't found them, which works against "for people who notice".

**Where:** `/colophon`, not a tab. It is the fourth word under About ("GitHub  Instagram  Email  Colophon") and a word on the 404.

**Data:**
- Values from code: `src/lib/color.ts`, `src/lib/motion.ts` (`DUR`, `EASE`), the R14 tokens, and `COLOURWAYS` from `eyes.ts` (R15).
- Seen eyes in `localStorage['eigengrau:eyes-seen']`.
- **Correction:** the git numbers can't be computed at build on Vercel, because it builds from a shallow clone. A local script writes a **new** `src/content/build.json` before each commit, as `scripts/add-note.mjs` already edits and commits content.

**Implementation sketch:**
- **new** `src/app/colophon/page.tsx`, a server component reusing `.case` and its rims
- **new** client island `ColophonLive.tsx` for the eyes, the curves, the cues (`sfx.play(name)`) and the switches

**Edge cases:**
- Phones: one column, with swatches full-bleed.
- Reduced motion: the curves are drawn and the dots jump to their ends.
- Sound off: the rows say so.
- Night: the page's Urchi is asleep, and the eyes row reads "It is asleep. The colour will keep until seven."
- A returning visitor sees the seen count grow.

**Effort:** M.

**What it shows:** he designs systems, not pages. Tokens, contrast, curves and an accessibility stance, in one scroll and in the site's voice.

**Risks:**
- Values drift if they are copied by hand, so read everything from code.
- Over-explaining kills the magic. Materials only.

---

#### R18. "Three voices", staged (Direction C)

**Pitch:** serif is him, grotesk is the site, and machine text should look like a machine said it. Add that third voice when there is machine text to set, not before.

**How it works**
1. **Stage one (S, now): no new font.**
   - Machine data (commit hashes on log lines, the GitHub facts row's hash) uses grotesk 11px at 60% with `font-variant-numeric: tabular-nums slashed-zero`.
   - Check that the grotesk subset kept the `zero` feature. If not, use tabular only.
2. **Stage two (S, when Desk and the security tools land):**
   - A monospace at 400 only, subset to ASCII, as WOFF2 plus a WOFF for troika. JetBrains Mono or Commit Mono are both OFL.
   - Token `--t-data: 400 11px/1.4 var(--font-mono)`.
   - Use it only where alignment carries meaning: hashes, hex, headers, tool output, and diffs.
   - **Corrections:** not the intro counter, which is serif and part of the intro's look (`globals.css:377-386`). Not note dates, which are the notes' furniture. Not the supernova years, which stay grotesk. Add `FONT.mono` in `text.ts` only if a canvas ever needs it.
3. **The log from git.**
   - A **new** `scripts/log-from-git.mjs`, run locally like `add-note.mjs`, turns merge commits into `kind: "log", tags: ["site"]` entries in `NOTES`.
   - It strips "Merge p2/x: ", so a line reads "Space: a sky behind Urchi afloat, starting with the stars".
   - At most one line a day, which `NOTES_FOLD_AFTER` handles later.
   - **Correction:** it can't run at build, because Vercel's checkout is shallow.

**How it reads (mock):**
```
2026.09.29  9b8c07c                                            site
Space: a sky behind Urchi afloat, starting with the stars
```
The date is grotesk 11px, the hash is the machine voice at 60%, the line is grotesk 12px (the site speaking), and the tag is grotesk 11px.

**Edge cases:**
- Phones: 11px mono is legible at DPR 2 and above.
- New log lines get the "new" dot, like notes.

**Effort:** S per stage.

**What it shows:** a security person's instinct for provenance: who said this, and when. It fills Notes in the site's own voice at the same time.

**Risks:**
- A third face tips toward the developer-portfolio cliché; the 11px, alignment-only rule is the guard.
- Commit lines are public, so the owner must be comfortable with that.

---

#### R19. "The eye's own noise": eigengrau as grain (Direction A, an experiment)

**Pitch:** eigengrau isn't flat grey. It is the faint noise the eye sees in the dark, so the ground could carry it.

**Correction to the maths:** white noise at 0-6% alpha has a mean of about 3%, which lifts `#16161d` to about `#1d1d24`. Moving the token to `#15151c` doesn't compensate. `tone.ts` already solves this: `dither()` (`tone.ts:463`) mixes white and black at alphas that shift the colour equally both ways, so the mean stays put.

**How it works**
1. A **new** `.grain` layer: fixed, `inset: 0`, `z-index: 9998` (under the chrome, over every panel), `pointer-events: none`.
2. Its tile comes from a `dither()`-style generator with an amplitude argument: ±1.5% by day, ±2.5% during Urchi's night hours (`hours.ts`). At `background-size: calc(64px / var(--dpr))` it is one noise pixel per device pixel.
3. It is static. A random `background-position` is re-rolled when a tab arrives (`onWhere`), so every slide lands on fresh dark.
4. The pill glass frosts real texture, because `backdrop-filter` blurs the layer beneath it.
5. At ±1.5% it is invisible on covers and sleeves, and the Music room's own 1% grain becomes the house texture instead of a local fix.

**Where:** `Shell.tsx`, next to `Between`; CSS in `globals.css`. It runs only behind `?grain=1` for a week.

**Data:** none.

**Edge cases:**
- Reduced motion: no re-roll.
- `prefers-contrast: more` and reduced transparency: off.
- Phones: ±1%.
- Visual-snow sensitivity is the reason it never animates.

**Effort:** S.

**What it shows:** he understands the name as a phenomenon, not a colour.

**Risks:**
- One more compositing layer over WebGL. Measure frame time on a mid-range Android.
- If he can't tell it is on from a metre away, and screenshots don't improve, drop it.

---

#### Order of work

| # | What | Severity | Effort | Main files |
|---|---|---|---|---|
| 1 | R1 link cards, real `SITE_URL`, per-route canonicals, icons, `sameAs` | High | M | `layout.tsx`, new `opengraph-image.tsx` ×3, `apple-icon.png`, `icon.svg`, `site.ts:10` |
| 2 | R3 digits, with the capture listener, `finding` flag and off switch | High | S | new `src/lib/keys.ts`, `flags.ts`, `Shell.tsx:79`, `NotesPanel.tsx:732`, `Tab.tsx` |
| 3 | R2 the name: monogram, intro on phones, About byline | High | S | `FloatingLogo.tsx`, `IntroRing.ts`, `AboutPanel.tsx`, `AboutScene.ts`, `visits.ts`, `globals.css:350-366` |
| 4 | R4 sound on every screen, chip in the group, `audioSession` | High | S-M | `SoundChip.tsx`, `Nav.tsx`, `Shell.tsx:199`, `sfx.ts`, `globals.css:201-241` |
| 5 | R9 phone targets at the top | High | S | `globals.css` |
| 6 | R6 Projects answers Tab | High | S / S-M | `ProjectsPanel.tsx:121`, `ThreadScene.ts`, `projects/page.tsx` |
| 7 | R5 case page as the GitHub template, `countWord` (after that branch lands) | Medium | S | `[slug]/page.tsx`, new `CaseFocus.tsx`, `Nav.tsx:35`, `Tab.tsx`, `site.ts:209` |
| 8 | R7 contrast, reduced transparency | Medium | S | `MusicPanel.tsx:14`, `globals.css`, `ThreadScene.ts:627`, `Tether.ts:19` |
| 9 | R8 404, honest outage, loading | Medium | S-M | `not-found.tsx`, `api/now/route.ts`, `now.ts`, `MusicPanel.tsx`, `ThreadScene.ts:1369` |
| 10 | R10 rims on scroll, the published heading line | Medium | S / S-M | `globals.css:956-981`, `NotesPanel.tsx:1186`, `MusicPanel.tsx:1274`, `ThreadScene.ts:1898`, new `headline.ts` |
| 11 | R11 pill tips, R12 intro hurry and short form | Medium | S | `Nav.tsx`, `intro.ts:59`, `CreativeSpacePanel.tsx`, `visits.ts` |
| 12 | R13 focus as Urchi's rim, glass label, Urchi watches Tab | Medium | M | `Urchi.ts`, `attention.ts`, `CreativeSpacePanel.tsx`, `CursorLabel.ts` |
| 13 | R14 tokens, "Projects", fonts, subset WOFF, About footer, `TIME_ZONE` | Low | S-M | `globals.css`, new `type.ts`, `text.ts`, `Nav.tsx:18`, `public/fonts` |
| 14 | R15 the visit's eyes | Bold | S | new `eyes.ts`, `character.ts`, `globals.css` |
| 15 | R16 Desk, the room itself | New | S (content M-L elsewhere) | `site.ts` `TABS`, `Shell.tsx:29-35`, new `DeskPanel.tsx`, new `app/desk/` |
| 16 | R17 Colophon | Idea | M | new `app/colophon/`, new `build.json` script |
| 17 | R18 three voices, staged; log-from-git | Bold | S each | `globals.css`, new `scripts/log-from-git.mjs` |
| 18 | R9 bottom-bar prototype | Experiment | M | `globals.css`, `Shell.tsx:94-95`, `ThreadScene.ts:191,1905`, `FloatingLogo.tsx`, `Tab.tsx:28` |
| 19 | R19 grain | Experiment | S | `Shell.tsx`, `globals.css`, `tone.ts` |

**Appendix: the screenshots that carry the claims.** These are unchanged from the proposal. The mocks are `S/mock-a-phone-bottom-nav-notes.png`, `S/mock-b-nav-name-chip-tip.png`, `S/mock-b2-about-name-eyes-ring.png`, `S/mock-c-404.png` and `S/mock-d-music-quiet.png`. The quiet-week mock is now moot (see R8). The evidence shots are `S/a-first-*`, `S/b-*`, `S/e-about-focus-link.png`, `S/f-phone-*`, `S/g-1024-music-no-chip.png`, `S/h-rm-*`, `S/i-*`, `S/j-*`, `S/k-*`, `O/desk-02-space-hover.png`, `O/desk-5-about.png`, `O/desk-direct-projects.png`, `O/desk-direct-music.png` and `O/desk-direct-404.png`.

### Open questions for the owner

1. What is the real domain, and what is your time zone? The link cards, canonicals and JSON-LD (R1) all wait on the domain. Urchi's night (R14) waits on the zone.
2. Does "two colours only" stretch to Urchi's eye colour in three small places (R15)? And, once the security tools exist, to a third face for machine text (R18)?
3. Where should the tools, the daily game and the security work live: a sixth tab, "Desk" (key 5, with About moving to 6), or pages off About (R16)?
4. On phones, do you want to try the nav at the bottom (R9, prototype), or keep it at the top with bigger targets?
5. Is the repo public, and are you comfortable with commit lines appearing as Notes log lines and as Colophon numbers (R17, R18)?

### If you only do one thing here

Do R1: set the real domain, add the root link card with "Darius Tan / Basic Human" and Urchi looking out of it, and give each project page its own card from the cover and status word. Most people will meet this site as a link in a message or on LinkedIn, not by typing the address. Today that link is a bare grey title on a placeholder domain that never says whose work it is. A card is one day's work and needs no change to anything on screen. It carries the name, the voice and the character into every place the site gets shared. It also pays off again as each real GitHub project lands, because every case page becomes its own well-dressed link.
