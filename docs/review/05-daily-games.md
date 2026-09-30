## Daily games

Both proposals are unusually well grounded. I opened every file they cite, re-ran their scratch scripts, and measured the chrome in the running dev server. Nearly all of their facts hold, and the few that don't are listed under "What I checked". Where they differ, it is over structure: A builds a rigorous frame and five word, logic and number games; B builds a shelf and five visual, audio and physics games. The refined proposal takes A's frame, B's shelf manners, and four of the ten games: two from each proposal. It adds one weekly.

### Review verdicts

**The frame**

| Idea | Verdict | Why |
|---|---|---|
| A · The shared frame: his day, frozen days served on the day, one record per game, share rules | KEEP WITH CHANGES | The most rigorous runway either proposal wrote. Four changes. Address games by path (`/today/stet/6`) rather than hash, so a shared link can carry a preview. Compute streaks instead of storing them. Let the server say which day it is. Give each game its own number from its own first day. *Ruled in the summary: paths, not the query this review first proposed (`/today?stet=6`), because the Desk's `tabOf` keeps sub-routes alive and `opengraph-image.tsx` receives `params`, never `searchParams`.* |
| B · A "Today" shelf with all five games every day, as a 976px row of cards | KEEP WITH CHANGES | Keep the day line, "Share the day", the miniatures, the per-puzzle preview image and the "what not to do" list. Cap the shelf at three games, and set it on Notes' column, which is the site's existing DOM layout, rather than a card grid the site has nowhere else. |
| B · `/today/<game>` sub-routes, and key `6` | KEEP the paths, under the Desk; the key is `3` | On today's code, `isTab` is an exact match (`src/lib/routes.ts:5-7`). A sub-route would therefore mount a throwaway panel (`Shell.tsx:130-133`), lose keep-alive and the slide, and light no pill (`Nav.tsx:35`). That was this review's reason to cut them. No digit shortcut exists anywhere: pressing `2` on `/notes` leaves the URL at `/notes`, which I measured in Playwright. *Ruled in the summary: the Desk owns `/today` through the new `tabOf` (Strategy §5.5, Engineering §4.5), which removes the objection, so puzzles are paths (`/today/<game>/<n>`). The Desk is pill three, so its key is `3`, not `6`.* |
| B · No new WebGL context; a `?debug=1` panel per game; the bed through the wall for tonal games | KEEP | Right on all three. The wall needs the fix described under Plate. |
| A · A sixth pill, "Today" | MERGED into the Desk (decided) | A sixth pill fits: at 390px the bar is 213px wide, and a sixth digit pill adds about 24px. The pill is "Desk", placed third (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6), and Today is its first drawer, beside Tools and Security. The panel is the same; the row and the address change. *Ruled in the summary ("Where the new things live"); see Decisions, 1.* |

**The games**

| Idea | Verdict | Why |
|---|---|---|
| B · **Same Grey** (match a grey against lying company) | KEEP WITH CHANGES · build first | It is the site's thesis in a minute: DOM and CSS, nothing to write, and S effort on top of the frame. It proves the runway with the least risk. Changes: an explicit weekday ladder, a step table so one step is one level, a named illusion line for each family, a softer Room on phones, and an honest fallback if it proves a one-week novelty. |
| A · **Stet** (proofread a paragraph; a wrong tap is "let stand") | KEEP WITH CHANGES · second | The About statement ("people who notice the small things") as a game, for anyone who reads, and its paragraphs become Notes content. Changes: the content supply does not add up as written, a ceiling on stets stops tap-everything, rules for doubled words and one-token facts, a `npm run passage` script, and a Notes category for "space". *Decided in `decisions.md` (Daily games 4): the bank launches on forty public-domain passages, marked up by a branch and approved by him in one sitting; his notes reach Stet only when he lends one, so nothing asks him for weekly paragraphs. Stet No. 1 is Monday 9 November.* |
| A · **Plaintext** (a weekly letter, one lock a day, Caesar to XOR) | KEEP WITH CHANGES · third, from a Monday | The strongest security piece among the games: frequency fits, the index of coincidence, repeating-key XOR. Week one turns the site's name into the answer, and every example is verified. Changes: launch on a Monday (Monday 7 December, decided; first proposed as 23 November), a history line for each weekday, and the letters kept out of the public repository (decided: the repository is public, so every frozen puzzle lives in a private bank fetched at build). |
| B · **Plate** (Chladni: find the note that draws the figure in sand) | KEEP WITH CHANGES · fourth, the flagship | The most original idea here and the one people would write about. Changes: fix the pitch arithmetic (Saturday's notes fall off the dial), share `sfx.air` politely with the supernova, quiet a song left in Music, a new sustained voice in `sfx`, and a phone layout clear of the edge swipe. Realistic effort is a week and a half, not four days. |
| A · **Last login** (a day of logins; find the intruder's lines) | KEEP WITH CHANGES · a weekly, hand-written | The best demonstration of how a security person thinks. It is too costly to write well every day, and A's own risk list admits that generated clues read mechanically. So: one incident a week, thirty written by hand and checked by A's solver, with ATT&CK IDs in the casebook. |
| A · Fairly Sure (80% ranges; calibration) | CUT | It needs a bank of four hundred sourced facts, a single wrong one is fatal, and it is a known format (calibration trainers). Its computed security numbers move into Stet's `qy` facts instead. |
| A · Eight Lamps (combine bit rows with gates to reach a target) | CUT | NYT's *Digits* with bitwise operators. It is niche by A's own ranking, and Same Grey already fills the "no writing needed" slot. The eight-day picture is charming but does not rescue it. |
| B · Held (tune strings until a Lissajous figure holds still) | CUT as a daily | Elegant, but the day barely varies: every day asks you to tune four strings. Its core pleasure is sound, which is off by default. Park it as an instrument for Tools. |
| B · Overhead (pin a patch of the real sky) | CUT for year one | L effort, a licensing chore (stick figures), fiddly on phones, and hard for anyone who does not know the sky. It duplicates the star catalogue pipeline in the Tools proposal's "That night" (`tools.md` §10); revisit once that exists, when it becomes M. |
| B · Slack (wind a finite thread round beads) | CUT | It ports Urchi's tether and plays Urchi's `tug` and `snap` (`sfx.ts:1339-1350`: "Urchi's line pulled straight hard"), against the owner's "separate from Urchi". It is also L, and generic shortest-path at heart. |
| A's own cuts: Spelled Out, Redacted to width, Checksum | Agree: CUT | For the reasons A gives: fiddly grids, a Redactle clone, one trick. |
| A's cut Timing Attack | CUT (defensive only) | A side-channel toy would be a poor daily. It is also cut from the security pages: it asks the visitor to exploit a timing leak, and the site's security work is defensive only. What it would teach (compare secrets in constant time) can be a paragraph in a paper, if his own code ever needs it. |

#### What I checked

- **Verified in A:**
  - `sfx.ts:15` (cue names), `:25` (the tick throttle), `:1243` (`sfx`), `:1358` (`bloom`) and `:1440` (`pluck`).
  - `hours.ts:15-19` (`hoursOf`) and `:31-44` (`clock`), and `sky/tune.ts:58-97` (`hashSeed`, `subSeed`, `rng`).
  - `visits.ts:167` (`whatsNew`), `site.ts:10`, `:16`, `:29` and `:201`.
  - `globals.css:97` (`.glass`), `:664` and `:671` (the column and head), and `:941` (`notes-rise`).
  - `NotesPanel.tsx:1012-1034` (keys), `AboutPanel.tsx:48-57` (Copied), `ProjectsPanel.tsx:16` (`hashSlug`) and `api/now/route.ts:7` (`runtime`).
  - `#e9e9e2` is the exact inverse of `#16161d` (255−0x16 = 0xe9, 255−0x1d = 0xe2).
  - I re-ran the examples:
    - Monday's Caesar at shift 7 reads "CLOSE YOUR EYES…".
    - Thursday's Vigenère with EYES reads "THE OLD PHYSIOLOGISTS…".
    - Sunday's first sixteen bytes XOR `grey` give "Eigengrau. Its o".
    - The SIGNAL alphabet has no fixed points.
    - `login2.mjs` confirms a unique answer, and that every note is needed.
    - `lamps3.mjs` confirms par 3.
    - The numbers check out: 10,584,000 bytes, 26⁸ and 2³².
  - A is right that no 1-5 key handler exists, whatever the README says.
- **Wrong or missing in A:**
  - Stet's topics include "space", but `NOTE_CATEGORIES` (`site.ts:230-240`) has no such category.
  - "Thirty passages, then three a week" cannot hold "comes back after 120 days" until the bank reaches 120, about week thirty.
  - There is no test runner in `package.json`, so the "unit test" needs one.
  - A hash never reaches the server, so hash addresses cannot have per-puzzle link previews.
  - "Reusing the fold in NotesPanel" means first extracting the 440-line `Folds` class (`NotesPanel.tsx:126-563`).
  - A stored streak can drift.
- **Verified in B:**
  - Every quoted seed, e.g. `hashSeed("grey:2026-10-01")` = 1535746116.
  - The Same Grey hexes (`grey.mjs`) and Held's beat rates (`held.mjs`).
  - The three WebGL contexts (`RoomScene.ts:175`, `ThreadScene.ts:1308`, `AboutScene.ts:95`, all via `makeRenderer`, `loader.ts:108`).
  - The `tone.ts` exports at `:48`, `:65`, `:80` and `:95-97`, with `inGamut` at `:70` private as B says.
  - The `sfx` internals at `:1049`, `:1074`, `:1081`, `:1145`, `:1165`, `:1371` and `:1467`.
- **Wrong or missing in B:**
  - `/today/plate` and key `6`, as above: wrong against today's `isTab`. *Ruled in the summary: the Desk's `tabOf` makes the path right, and the key is the Desk's `3`.*
  - Plate's F of 60-95 Hz with Saturday's pool {25, 26, 50} puts 50F at 3.0-4.75 kHz. That is off the 60 Hz-2.4 kHz dial, and contradicts "the highest notes stay under 2.8 kHz". 26F reaches 2.47 kHz.
  - The "Bayer matrix at `Urchi.ts:20-21`" is a GLSL function (`bayer8`), not a table. It has to be ported to JS, which is about a dozen lines.
  - `sfx.air` is one global dial. The supernova shuts it (`ThreadScene.ts:3505`) and opens it (`:3623`, `:3648`, `:5248`), so a game that "restores AIR_OPEN" would open the wall under a kept Projects panel mid-float.
  - Held's new pluck needs a per-kind pluck point: `PLUCK_AT` is one constant (`sfx.ts:1054`, used at `:1089`).
  - The file convention `opengraph-image.tsx` cannot see a query string. (This is one of the summary's two reasons for paths.)
  - Minor: `countWord` is at `site.ts:201`, not `:200`.

#### The merge, in one paragraph

The direction is **one Today drawer on the Desk (pill three) with at most three daily games in year one, plus one weekly**. The games are **Same Grey** (from B) first, **Stet** (A) second and **Plaintext** (A) third, with **Plate** (B) as the fourth, flagship game once the first three have players. **Last login** (A) is a Saturday weekly.

Where each part comes from:

- **From A:** the day that never falls back to the visitor's zone; puzzles made ahead, frozen and served on the day; one storage key per game; the share character set and length test; a Notes-shaped Today page; the midnight rule; the keys contract; the sound mapping from existing cues; and "Carry it".
- **From B:** streaks computed rather than stored; "Share the day"; miniatures; per-puzzle preview images; no new WebGL; a `?debug=1` panel per game; the bed through the wall; and the "what not to do" list.
- **From both, via the engineering review:** the per-game folder shape `src/games/<id>/{rules.ts, Board.tsx, share.ts}`.
- **New here:**
  - addressing that reaches the server (a query in this review's first draft; paths under the Desk by the summary's ruling);
  - the server-reported day;
  - per-game numbering;
  - the prerequisite list;
  - the Stet supply arithmetic and `npm run passage`;
  - the stet ceiling;
  - the illusion lines;
  - the Plate pitch and wall fixes;
  - `sfx.hushSong`;
  - Last login's cast and ATT&CK casebook;
  - the calendar;
  - counting.
- **From the summary and `decisions.md`, applied throughout:** the Desk third, paths, the shared `random.ts`, `day.ts` and `store.ts`, Vitest, the private puzzle bank, Umami's `game_finished`, Melbourne's midnight, and the calendar moved so each game has four weeks of archive before the next.

---

### Refined proposal

#### 0. Before any of it (about a day)

1. **Set `TIME_ZONE = "Australia/Melbourne"`** (`src/content/site.ts:16`, still `null` with a TODO), with new `HEMISPHERE = "south"` on the line after it. *Decided (`decisions.md`, item 1): his commits carry +10:00, and his public coursework is a Swinburne unit.*
   - The day turns at his midnight, so two friends comparing "Stet 6" are looking at the same paragraph.
   - If the zone is ever missing, the games use UTC, never the visitor's zone. This is unlike `clock()` (`hours.ts:35`) and `localDay` (`notes.ts:34`), which do fall back to the visitor's.
   - The daily games are the first feature where a null would show to strangers, so the content lint fails a production build while `TIME_ZONE` is null.
   - Melbourne moves to +11:00 on Sunday 4 October 2026, eight days before Same Grey No. 1, and back to +10:00 on Sunday 4 April 2027. His midnight into Monday 12 October is 13:00 UTC on Sunday 11 October, which is 09:00 in New York.
2. **Set `SITE_URL`** (`site.ts:10`, `https://eigengrau.example`). Every share prints its host. *Decided: it comes from `NEXT_PUBLIC_SITE_URL`, and a production build fails if that is unset or still `.example`. Until a domain exists it is the Vercel production URL; `decisions.md` (item 2) buys `dariustan.dev` by Friday 9 October. The share examples below print that host.*
3. **One seeded generator.**
   - Move `hashSeed`, `stir`, `subSeed`, `unitOf` and `rng` from `src/engine/space/sky/tune.ts:57-97` into a new `src/lib/random.ts`, and have `tune.ts` re-export them. *Ruled in the summary: the shared PRNG lives in `src/lib/random.ts`, not `src/lib/seed.ts`, because `sky/seed.ts` already means visit and URL seeds.*
   - Delete the copy `mulberry32` in `src/components/chrome/Between.tsx:103-113` and import `rng` instead.
   - The sky does not change, because the two are the same algorithm line for line.
   - A test freezes the first ten outputs of `rng(1)` and `hashSeed("eigengrau")`.
4. **A test runner.** There is none in `package.json`. *Ruled in the summary: one runner, Vitest, with scripts such as `npm run today` run under `tsx`, so the `@/` alias works everywhere. It replaces this review's first plan, `node --test` with no `@/` imports.*
   - Add `"test": "vitest run"` and `"today": "tsx scripts/today.ts"`. The Vercel build command runs `vitest run` before `next build` (`decisions.md`, Engineering 4).
   - The games' pure modules (`src/games/*/rules.ts`, `sand.ts`, `crypto.ts`, `solve.ts` and the shared `src/lib/day.ts`) take no DOM and no clock. They stay pure by discipline, not because the runner forces it.
   - **The `@/` alias is allowed in them.** `tone.ts` imports `@/lib/color` (`tone.ts:21`), and a generator may now use it. `day.ts` imports `TIME_ZONE` from `@/content/site` directly, and the script reads it the same way, rather than reading `site.ts` as text as `add-note.mjs` does.
   - What this review first checked for the Node route is now moot: Node here is 22.22 and runs an `.mjs` importing a `.ts` by its extension with no flags, and `node --test scripts/` reports a failure where a quoted glob passes. `"allowImportingTsExtensions"` is not needed.

---

#### 1. The frame: Today

> **Today** Three to do. The day turns here in six hours.

##### 1.1 Where it lives

- **The Desk's first drawer, on a sixth pill placed third.** *Ruled in the summary: one pill, "Desk", third in the row (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6), with the drawers Today, Tools and Security, each at its own path. This section first proposed a "Today" pill sixth.*
  - Add `{ href: "/desk", label: "Desk", n: 3, owns: ["/today", "/tools", "/security"] }` to `TABS` (`site.ts:29-35`), third, and renumber Notes, Music and About to 4, 5 and 6. Add `if (path === "/desk") return <DeskPanel />;` to `Stage` (`Shell.tsx:29-36`). The new `DeskPanel` renders the Today drawer, new `TodayDrawer`, and later the Tools and Security drawers (Strategy §5.5).
  - The new `tabOf` in `src/lib/routes.ts` says the Desk's kept panel renders `/today` and everything under it; `pillOf` lights pill three there. A move between `/today` and `/today/stet/6` is a move inside one tab: Shell calls `arrive` and does not slide.
  - Add a new `src/app/today/page.tsx` with an sr-only `h1`, as `src/app/notes/page.tsx` has, and the board pages under it (§1.2).
  - Shell then gives it everything the other tabs have: it stays mounted, is hidden and inert off screen, slides in `TAB_ORDER`, and has the stars between tabs (`Between.tsx`). A half-played Stet survives a trip to Music.
  - `typedRoutes` (`next.config.ts`) is satisfied once the pages exist. The Desk pill's remembered href is typed with `as Route`.
- **It fits the bar.** Measured at 390×844:
  - the bar is 213px wide;
  - the monogram is 29px;
  - the four digit pills are 18-21px each, 4px apart;
  - the active "Notes" label is 75px.

  A sixth digit pill adds about 24px. The strategy review measures six pills at 238-252px at 390px, with "Desk" as the shorter active label.
- **Third in the row.** Notes, Music and About move to 4, 5 and 6. That is free now, because no digit is a key yet and nothing has launched. A song left playing in Music's room (5) is heard on the Desk (3) two rooms off: `roomsAway` (`sfx.ts:503`) clamps into `AWAY`'s three entries (`sfx.ts:322-326`), so it plays at 420 Hz, -22 dB. This needs sfx's own `tabOf` (`sfx.ts:497-500`) to become `pillOf` (summary, "Shared foundations"). Today's version would count `/today/stet/6` as Space, four rooms off, and clamp it to the far sound.
- **Why a pill and not a link on About** (from A): a daily game depends on being found again tomorrow, and the pill bar is the site's only navigation. One pill, the Desk, holds every game, and the tools and papers beside them. There will never be one pill per game.
- **The Desk pill remembers.** It links to the last path it showed in this visit (`lastIn(tab)` in `where.ts`, new, Strategy §5.5). Pressing `3` from Music therefore returns to the half-played board, not the shelf. Clicking the lit Desk pill goes up to the shelf; Esc goes up one level.
- **Urchi stays out.** *Ruled in the summary (reconciliation 4): Urchi never announces the daily puzzle, and never comes to the Desk. This overrules strategy's "Today's is out."*
  - `whatsNew` (`visits.ts:167-187`) never learns about `/today`, so Urchi never looks up at the pill to announce a puzzle. A "new" every day would make the look mean nothing, and he asked for the games to be separate.
  - `UPDATED.desk` moves only when a new game, tool or paper lands. Then, and only then, Urchi looks up at the Desk pill once, as it already does for notes. The first days of Same Grey, Stet and Plaintext each count once as a new game. Their daily numbers never do.
  - The Today drawer's own heading does the daily telling (§1.8).
  - Urchi still glances at whatever pill the pointer hovers, as the README describes. Coming home from a board, it looks back at the Desk pill (Strategy §5.5, hook 2). That is attention, not involvement, and it needs no change here.

##### 1.2 Addressing: paths, under the Desk

*Ruled in the summary ("How a puzzle is addressed"): paths such as `/today/stet/6`, not the query this section first proposed (`/today?stet=6`, in the manner of Notes' `?tag=`). Numbers count from each game's own first day.*

| Address | Opens |
|---|---|
| `/desk` | the Desk's shelf: Today, Tools and Security |
| `/today` | the Today drawer |
| `/today/grey` | today's Same Grey |
| `/today/stet/6` | Stet No. 6 (today's, or an archive day, marked "late" if played after its day) |
| `/today/plaintext/1` | Plaintext week 1, on today's lock, or its last one if that week is past |
| `/today/record` | the record (`record` is a reserved segment, never a game id) |

- **Pages.** New `src/app/today/[game]/page.tsx` (today's puzzle of that game) and `src/app/today/[game]/[n]/page.tsx` (a numbered day), each with metadata and a server mirror, rendered inside the Desk panel (`Shell.tsx`'s children go to the panel whose tab owns the path). This splits Strategy §5.3's `[[...n]]` in two, so the card file sits in a plain dynamic segment, which is the form Next's own docs show for `opengraph-image` (§1.9).
- **Opening a game** is a client navigation inside the Desk (`router.push("/today/stet/25")`). Shell sees that `tabOf(prev)` and `tabOf(pathname)` are both `/desk`, calls `arrive(pathname, prev)` and returns, with no slide. The Desk pill stays lit, because `pillOf` returns `/desk` for anything under `/today`.
- **Coming back by the pill.** The Desk pill links to the last path it showed (`lastIn`, §1.1), so the open board comes back with its own URL. Nothing has to be written back, as Notes' `onArrive` does (`NotesPanel.tsx:1077-1082`) for its query.
- **Why not the hash (A):** a hash never reaches the server, so a shared "Stet 6" could not unfurl as Stet 6.
- **Why not the query (this review's first draft):** `opengraph-image.tsx` receives `params`, never `searchParams`, so a query needs a workaround route for every card. The objection to sub-routes (an exact-match `isTab`) is gone once the Desk owns `/today`.

##### 1.3 The day

*Ruled in the summary ("Shared foundations"): the day lives in the shared `src/lib/day.ts`, his day falling back to UTC and never to the visitor's, and `notes.ts`'s `localDay` moves there as `visitorDay()` with its own meaning. Numbering is per game, so Engineering §4.2's single `EPOCH` gives way to each game's `since`. The functions below are what the games need from that module.*

- **New `src/lib/day.ts`** (shared with finds, Music and the sky calendar):
  - `todayKey(now)` returns `"2026-12-10"`, from `Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" })`. That is the technique of `clock()` (`hours.ts:31-44`), with `ZONE = TIME_ZONE ?? "UTC"`, which is `"Australia/Melbourne"` once `TIME_ZONE` is set (§0). It is Engineering §4.2's `today()` under another name; the shared module keeps Engineering's names (`today()`, `untilTomorrow()`), and this section's names below refer to them.
  - `dayIndex(key)` counts whole days between date strings using `Date.UTC` on the parsed parts, so daylight saving can never produce a 23-hour day.
  - `weekday(key)` is `new Date(key + "T00:00:00Z").getUTCDay()`.
  - Also `isoWeek(key)` and `msUntilNextDay(now)` (Engineering's `untilTomorrow()`).
- **The server says which day it is** (new).
  - `GET /api/today` returns (on Thursday 10 December, the first Thursday with all three games live):

    ```json
    { "day": "2026-12-10", "weekday": 4, "next": 21600000, "games": { "grey": 60, "stet": 32, "plaintext": { "week": 1, "day": 4 } } }
    ```

  - The page trusts this over the device clock. A phone set a day ahead sees "Not out yet here." rather than a 404.
  - The countdown runs from `next` against `performance.now()`, so changing the device clock mid-visit changes nothing.
- **Development knob.** `?day=2026-12-10` works like `?hour=` (`hours.ts:21-28`), honoured by both the page and the API only when `NODE_ENV !== "production"`, so nobody can preview tomorrow on the live site.
- **Numbering.** Each game counts from its own first day (its `since`, §1.6), so "Stet 1" is Stet's first day whatever the shelf did before.
  - A used one epoch for every game, which would make Stet's first puzzle "Stet 29".
  - B used "day one" for the shelf.
  - The shelf itself is named by its date, not a number: "Thursday 10 December."

##### 1.4 Seeds (from A)

- `seedFor(game, n, attempt = 0) = subSeed(hashSeed(TODAY_SALT), \`${game}:${n}:${attempt}\`)`, from `src/lib/random.ts`. `attempt` lets the build re-roll a day that fails its checks, and the re-roll is still deterministic.
- **The root is a build secret.** *Decided (`decisions.md`, Daily games 3):* `TODAY_SALT`, a build secret that is never in either repository and is read only by `npm run today`, replaces the literal `"eigengrau/today/v1"` this review first proposed, so the public generator cannot compute a day. The frozen files (§1.5) mean the salt is needed only when days are written, never at request time.
- Curated banks (Stet's passages, Plaintext's letters) are walked in a seeded Fisher-Yates permutation, reseeded once per cycle of the bank. Order does not follow file order, and nothing repeats within a cycle.

##### 1.5 Made ahead, frozen, served on the day (from A)

- **New `scripts/today.ts`** (`npm run today`), a script like `scripts/add-note.mjs`, run under `tsx` so it can import the games' `rules.ts` through `@/` (§0).
  - It generates and validates the next 400 days of every game into `src/content/today/<game>.json`, which is a checkout of the private bank (below), git-ignored in the public repository.
  - It prints a report: rejects and re-rolls, the difficulty spread by weekday, and each game's own figures (par, clue counts, grain counts).
  - **It never rewrites a day that already exists.** A generator changed next spring only affects days not yet written. That is stronger than B's snapshot test, because frozen JSON cannot change at all.
- **New route handlers:**
  - `src/app/api/today/route.ts`, for the day.
  - `src/app/api/today/[game]/[n]/route.ts`, for a puzzle.

  Both use `export const runtime = "nodejs"`, as `src/app/api/now/route.ts:7` does.
  - They import the JSON **on the server only**, and return 404 for any `n` later than today in `ZONE`.
  - Past days are sent with `Cache-Control: public, max-age=31536000, immutable`.
  - Today is sent with `public, s-maxage=<seconds to his midnight>, stale-while-revalidate=60`. On Vercel's CDN that is about one function run per region per day.
- **The public repo.** `git remote` is `github.com/dctxv/eigengrau`, and it is public, so anything committed there is readable by anyone. *Decided (`decisions.md`, Daily games 3), under the summary's rule that nothing in the public repository holds a puzzle's answer:*
  - **Every frozen puzzle goes private, Same Grey included.** `src/content/today/` lives in a new private repository, fetched at build by a new `scripts/fetch-today.mjs`. It uses a fine-grained read-only token (`TODAY_TOKEN`) and takes the repository's name from `TODAY_REPO`, both Vercel variables, so the public repository never names it.
  - **This review first accepted public answers for the procedural games.** Same Grey and Plate are procedural: knowing the answer spoils only your own game, and there is no board to cheat on. The rule covers them anyway, and one bank is simpler than two.
  - **Stet and Plaintext** are curated, and a public letter would spoil a week for anyone who looks. The private bank settles it, so the record page never needs "The answers are in the repository. So is everything else."
  - **It is not a project.** The bank repository is left off the thread through the secret `SYNC_EXCLUDE`, and, like every private repository, it is never named anywhere public.
  - **Changes if** the build cannot reach GitHub reliably. The frozen files then go into a Vercel Blob read only on the server, and the rule still holds.

##### 1.6 The registry

New `src/lib/today/games.ts`:

```ts
export type GameId = "grey" | "stet" | "plaintext" | "plate" | "login";
export type Game = { id: GameId; name: string; since: string; every: "day" | "saturday"; line: string };
export const GAMES: readonly Game[] = [
  { id: "grey",      name: "Same Grey", since: "2026-10-12", every: "day",      line: "Five greys, each in company." },
  { id: "stet",      name: "Stet",      since: "2026-11-09", every: "day",      line: "A paragraph with a few things wrong in it." },
  { id: "plaintext", name: "Plaintext", since: "2026-12-07", every: "day",      line: "One lock a day. A letter a week." },
];
```

- The head counts what exists, and a game's line appears from its `since`.
- **Where `since` lives.** Each game exports its own `since` from `src/games/<id>/rules.ts`, and the registry imports it, so the generator and the page cannot disagree (`decisions.md`, Daily games 4).
- **The dates.** *Decided in `decisions.md` (Daily games 4):* Stet from Monday 9 November and Plaintext from Monday 7 December, not 2 and 23 November as first proposed. The summary's own rule, "no new game until the last one has four weeks of archive and the counts show people coming back", forbids the earlier dates. Four weeks after 12 October is 9 November, and four weeks after that is 7 December.
- All three `since` dates are Mondays (checked), because every game's ladder starts gentle on a Monday.
- **The shared weekday ladder:**
  - Monday is the gentle day.
  - Tuesday to Saturday climb, and Saturday is the hardest.
  - Sunday is larger and slower, not harder: the newspaper Sunday (from B).

##### 1.7 What the browser keeps

- **One key per game**, `eigengrau:today:<game>` (from A). A corrupt record takes out one game, not the shelf, and it matches the site's one key per concern (the README's list). The summary's list of new keys has exactly this form.
- **Through the shared `src/lib/store.ts`.** *Ruled in the summary: storage goes through `keep()`, which is versioned, guarded, and kept in step across browser tabs.* Each game calls `keep("today:<game>", { version: 1, … })`. The guards, the memory fallback and the cross-tab listener below are what `keep()` provides, so the games write none of them.
- **The record:**

  ```ts
  type DayRecord<S, R> = {
    status: "open" | "done" | "opened";   // opened: gave up and was shown
    state?: S;                             // the game in progress, so a reload resumes
    at?: number;                           // finished, ms
    late?: true;                           // finished from the archive, after its day
    result?: R;                            // what the share, the record and the archive read
  };
  type GameRecord<S, R> = { v: 1; days: Record<number, DayRecord<S, R>> };
  ```

- **The streak is computed, never stored** (from B). It is the run of consecutive day numbers ending today or yesterday whose status is `done` and that are not `late`. It cannot drift.
- **Pruning:** `state` is dropped after fourteen days, and days older than four hundred are pruned. The budget is under 50 KB a game.
- **Guards:** every read and write is guarded, as in `visits.ts:54-72`. If storage is refused, the record lives in memory for the page, as `sky/seed.ts:37-58` does.
- **Two browser tabs** (new): the drawer listens for `storage` events on its keys (through `keep()`'s `subscribe`) and re-reads, so a day finished in one tab reads as finished in the other.
- **Carry it** (from A, optional, S): the whole record as a short base64url code, pasted into another browser. The copy reads: "It lives in this browser. This takes it with you." It is `store.ts`'s `exportAll()` and `importAll()` (Engineering §4.3), which validate each key through its own `read()`.
- Add the new keys to the README's localStorage list and to `/kept`, as the summary requires of every new key.

##### 1.8 The Today page

- **The column.**
  - A plain DOM drawer, new `src/components/desk/TodayDrawer.tsx`, rendered by the new `DeskPanel` (itself dynamically imported as the other panels are, `Shell.tsx:19-23`). The drawer is loaded on demand in turn, so the Desk costs nothing until it is opened.
  - It is set on Notes' column: `.notes-column` (`globals.css:664-668`: `min(450px, 100% - 32px)`, 194px top padding) and `.notes-head` (`globals.css:671-676`: a grotesk lead, then one serif sentence, the first line on the 206px line that Projects, Notes and Music share).
  - Copy those rules to `.today-*` rather than sharing the class names, so Notes can change without moving Today.
- **The head** is written from the day's state, never stale (the count comes from `GAMES`, the way `projectsLine` does at `site.ts:209`). It is the only thing that tells anyone about the day's puzzles: Urchi never does (§1.1). The Desk's shelf carries one line for the drawer, as Strategy §5.6 writes it: "**Today** No. 12, Same Grey. New at midnight here, in five hours."

  | State | Head |
  |---|---|
  | One game live (launch) | **Today** One small thing, new at midnight here. *(from B)* |
  | Nothing done | **Today** Three to do. The day turns here in six hours. |
  | Some done | **Today** One of three. Stet is still open. |
  | All done | **Today** All three. The next at midnight here, in four hours. |
  | A Monday | **Today** Three to do, and a new letter. The day turns here in six hours. |
  | The visitor's date is not his | adds "It is already Friday here." or "It is still Thursday here." |
  | A streak of two or more | adds "Nine days running." |
  | Back after a gap | adds "Back again." It never says a streak was lost. |

- **Entries** are shaped like notes (see Notes' date and tag line).
  - The meta line is grotesk 11px, with "No. 25" on the left and "Stet" on the right.
  - Under it sit a **56×56 miniature** (from B) and one serif line about today's puzzle: "A paragraph about Voyager, with five things wrong in it."
  - The miniature is drawn once on a 2D canvas and never shows the answer:
    - Same Grey: the first company with its patch.
    - Stet: the paragraph as grey lines, with no words.
    - Plaintext: the week as seven marks, filled when open.
    - Plate: the target figure.
  - A finished game's result replaces the line ("Five of five. One let stand."), and the word "Share" appears in grotesk.
  - Unplayed entries sit at `color-mix(in srgb, var(--ink) 60%, transparent)`, and finished ones at full ink.
- **Opening a game.**
  - The other entries fold into hairlines the length of their lines.
    - Either extract `Folds` (`NotesPanel.tsx:126-563`) into `src/lib/folds.ts` first (half a day, and Notes must be re-tested),
    - or draw simpler hairlines with CSS `scaleY`, which is enough for three entries.
  - The miniature grows into the board with a FLIP (from B), using `EASE.reveal` and `DUR.reveal` (`motion.ts`, 0.9s). Under reduced motion it is a cut.
  - The URL becomes `/today/stet/25` (§1.2).
  - Esc, or a tap on the lead word, unfolds the shelf again, the way Esc winds Projects back. Esc goes up one level at a time, as the summary's key table has it: board, then drawer, then the Desk's shelf.
- **Boards are `next/dynamic` imports**, so Today costs nothing until a game is opened.
- **Midnight.**
  - A timer runs to `next`, with a re-check on `visibilitychange`.
  - A board open across midnight is never swapped out under the player. A grotesk line appears above it: "It is a new day here. This one stays until you leave it." (A's and B's lines, merged.)
  - The shelf behind it updates.
- **`/today/record`.** One sentence per game, in the manner of the Notes head:
  - "Nine days running. Same Grey every day, Stet most of them. You miss fonts."
  - "Plaintext: two weeks read whole. Fridays take you longest."
- **Archive.** Each game has one line per day in Notes' form: "No. 3, Wednesday. Forty levels off."
  - Past sixty days, months fold into one line each, the same idea as the sediment in `notes.ts`.
  - Each game also has its own picture of its history: Same Grey's swatch strips, Stet's clean paragraphs, Plaintext's letters, and Plate's wall of plates.
  - Late plays are marked "late" and never count toward the streak.

##### 1.9 Share

- **One game's share.** New `src/lib/today/share.ts`.
  - Each game returns two to four lines, and the frame adds the address (`dariustan.dev/today/stet/25`, from `SITE_URL`, which prints the Vercel production URL until the domain resolves; §0).
  - On a touch device it calls `navigator.share({ text })`. Otherwise it copies to the clipboard, and the word swaps to "Copied" exactly as About does (`AboutPanel.tsx:48-57`, including `sfx.play("tab")`).
  - Allowed characters are ASCII plus `· • ● ○ × – [ ]`. No emoji, because they bring colours the site does not have.
  - A test keeps every share under 280 characters.
- **Share the day** (from B). The head offers it once two or more games are done:

  ```
  eigengrau, Thursday 10 December.
  Same Grey: forty levels off. Stet: five of five, one let stand. Plaintext: Thursday, two peeks.
  dariustan.dev/today
  ```

- **Link previews.**
  - `src/app/today/[game]/[n]/page.tsx` exports `generateMetadata({ params })`. Its title is "Stet No. 25", which becomes "Stet No. 25 - Darius Tan" through the layout's template (`layout.tsx:9`). The canonical is set on this route, never on the root layout (summary, reconciliation 10).
  - A new `src/app/today/[game]/[n]/opengraph-image.tsx` draws the card with `ImageResponse` from `next/og`. It receives `params` (`{ game, n }`), which is why the summary chose paths. `src/app/today/[game]/page.tsx`, today's puzzle, points its card at today's numbered one, because every share prints the numbered path.
    - Its fonts come from `public/fonts/grotesk-500.woff` and `serif-400.woff`. The renderer reads WOFF, not WOFF2, and those files are already there for troika.
    - Serif ink on eigengrau, 1200×630, showing the puzzle and never the answer:
      - Stet: "Stet No. 25. Five marks to make."
      - Same Grey: the first company.
      - Plaintext: the first line of cipher.
      - Plate: the card's figure.
  - This review first drew the card from a route handler (`/api/today/og?g=stet&n=25`), because `opengraph-image.tsx` cannot read a query. With paths, the file convention works, and no card route is needed. A card for a day not yet out is a 404, like the puzzle itself (§1.5). Once out, a card never changes, so it is sent `immutable`.

##### 1.10 Sound, motion, keys, frames

- **Sound: only cues the site already has**, except Plate's new voice.
  - `play("tick")` for small steps. It is already throttled to one per 40ms (`sfx.ts:25`, `:1395-1399`).
  - `play("focus")` for picking something.
  - `play("close")`, quietly, for "not that".
  - `play("done")`, the D then A of the counter (`sfx.ts:125`), for finished.
  - `pluck(hz, "ring" | "thud")` (`sfx.ts:1440`) for results landing.
  - `bloom()` (`sfx.ts:1358`) for rare completions: a week read whole.

  Sound is off by default. With it off, `play` returns at its first line (`sfx.ts:1394`) and no audio context is made.

  **Urchi's four sounds stay Urchi's:** `pat`, `patOwn`, `tug` and `snap` (`sfx.ts:15`).
- **Motion.** Text rises with `notes-rise` (`globals.css:941-946`). Under reduced motion everything is simply placed (`prefersReducedMotion`, `motion.ts:19-22`, and the CSS query at `globals.css:947`).
- **The keys contract.**
  - Every board's handler returns early unless all of these hold, which are the checks at `NotesPanel.tsx:1012-1016`:
    - the path is the board's own (`location.pathname` starts with `/today/<game>`; `tabOf` gives `/desk`);
    - `!getFlags().transitioning`;
    - no modifier key;
    - nothing typeable has focus.
  - **Claims, not an attribute.** *Ruled in the summary: one capture-phase listener with a claim stack, `src/lib/keys.ts`. The digits `1`-`6` go to the tabs anywhere, unless a text field has focus, or a game board or Notes' search has claimed digits.* While a board is open it registers `claim("/desk", (e) => boolean)` for the keys it uses, and releases the claim when it closes. Plate and Plaintext take digits and letters, so they claim digits; Same Grey, Stet and Last login do not, so `1`-`6` still move between tabs from their boards. This replaces the `data-keys="own"` attribute this review first proposed.
  - Esc is never claimed by a board: it always goes up one level (board, then drawer, then shelf).
- **Frames.**
  - No WebGL: every board is DOM or a 2D canvas (from B). Three contexts already live, and kept panels keep theirs. The Desk is a kept panel, so it must never hold a fourth.
  - Canvas boards stop their frames when `onShown` (`where.ts:64-70`) says the Desk is hidden, or when their drawer is folded, exactly as `ProjectsPanel.tsx:177-182` pauses the ball.

##### 1.11 What not to do (from B, kept whole)

- No timers on screen.
- No leaderboards or accounts.
- No emoji squares.
- No confetti.
- No red.
- No lives drawn as hearts.
- No sound on by default.
- No fourth WebGL context.
- No Urchi.
- No nagging on other tabs.

The Desk pill, and the Today drawer's own heading, are the only invitation. Urchi never points at the Desk for the daily (summary, reconciliation 4).

##### 1.12 Before each game ships

- `npm run today` passes: four hundred days written, every validator green, no existing day changed.
- `npm test` (Vitest, golden tests beside each pure module) covers:
  - the day's arithmetic across both DST changes in `ZONE`, which for Melbourne are Sunday 4 October 2026 (to +11:00) and Sunday 4 April 2027 (back to +10:00);
  - streak arithmetic, including late days and a gap;
  - share length and character set;
  - seed stability;
  - the game's own normalisation.
- A Playwright pass at 1440×900, 390×844 and 320px wide (the summary's phone rule), with reduced motion on and off and sound off throughout. The pattern is the existing `shoot2.mjs`, with `waitUntil: "load"`, because the site polls.
- One Notes log line for the game, in the third person, as the summary asks of every shipped behaviour: "Same Grey begins. A new one arrives at his midnight."
- A **`?debug=1` panel per game** in development (from B), modelled on `src/engine/space/sky/debug/`:
  - the generator's knobs;
  - a die to re-roll the day;
  - "Copy config" to paste the tuned ladder back into source.

  It is left out of production the way the sky's is (`CreativeSpacePanel.tsx:206`).

##### 1.13 Counting (new, decided)

Zero backend also means he will never know whether anyone plays.

- This review first proposed Vercel Web Analytics custom events, with `today_done { game, n, late }` and nothing else. Custom events need Vercel Pro.
- *Decided (`decisions.md`, item 7; the summary's "Analytics" ruling):* **Umami Cloud's free tier, cookieless**, with its script and endpoint proxied under `/u/` on the same origin, so `connect-src 'self'` still holds. Automatic page views are off (`data-auto-track="false"`).
- A finished game sends one named event, and nothing else: `game_finished { game, n, streak: "1" | "2-6" | "7+" }`. The streak bucket answers "does anyone come back" without an identifier or a page view. A late play from the archive sends nothing, since it never counts toward a streak.
- Nothing is sent while the browser signals Do Not Track or Global Privacy Control. `/kept` prints the event's name and fields exactly as sent.
- New `EVENTS` in new `src/lib/count.ts` holds the three names the site sends (`game_finished`, `find_taken`, `tool_export`). The boards call it; they never touch Umami directly.
- Without it, "ship two and see whether anyone comes back" (A's rule) cannot be judged. With it, "the counts show people coming back" has a definition (§7).

**Effort:** M, three to four days, plus half a day if `Folds` is extracted. Same Grey then ships on top. The shared foundations (`random.ts`, `day.ts`, `store.ts`, `keys.ts`, `tabOf`) and the Desk frame are counted in the summary's priorities 9, 12 and 13, not here twice.

**Where it hooks in:**

- **Changed files:**
  - `site.ts:29` (`TABS`: the Desk third, with `owns`; Notes, Music and About renumbered);
  - `Shell.tsx:29-36` (`Stage`, which returns `DeskPanel` for `/desk`) and Shell's `tabOf` handling (Strategy §5.5);
  - `src/lib/routes.ts` (`tabOf`, `pillOf`) and `sfx.ts:497-500` (its own `tabOf` becomes `pillOf`);
  - `tune.ts:57-97` and `Between.tsx:103-113` (to `random.ts`);
  - `notes.ts:34` (`localDay` moves to `day.ts` as `visitorDay()`);
  - `package.json` (Vitest, `tsx`, the `test` and `today` scripts), `.gitignore` (`src/content/today/`), README.
- **New files:**
  - `src/lib/random.ts`, `src/lib/day.ts`, `src/lib/store.ts`, `src/lib/keys.ts` (shared foundations);
  - `src/lib/today/{games,share}.ts`;
  - `src/lib/count.ts`;
  - `src/app/desk/page.tsx`, `src/app/today/page.tsx`, `src/app/today/[game]/page.tsx`, `src/app/today/[game]/[n]/page.tsx`, `src/app/today/[game]/[n]/opengraph-image.tsx`;
  - `src/app/api/today/route.ts`, `src/app/api/today/[game]/[n]/route.ts`;
  - `src/components/pages/DeskPanel.tsx`, `src/components/desk/TodayDrawer.tsx`;
  - `scripts/today.ts`, `scripts/fetch-today.mjs`, and Vitest files beside the pure modules (`src/lib/day.test.ts`, `src/games/<id>/rules.test.ts`);
  - `src/content/today/`, fetched at build from the private bank and never committed here.

---

#### 2. Same Grey (from B) · build first

> **Same Grey** Five greys, each in company. Make the one on its own the same.

**Pitch.** The eye does not see grey. It sees grey against what is round it. Five times a day, a grey patch sits in company that lies about it: a light room, a blue wall, stripes, an edge. You set a second patch, alone on the page, until the two look the same. Then the company dissolves, and the seam shows how far you were led.

##### Why it goes first

- It is DOM and CSS only: no canvas, physics or audio to tune, and nothing to write. It proves the frame with the least that can go wrong.
- **The name.** Eigengrau is the grey the eye makes up in the dark. This game is a small daily proof that the eye makes up greys in the light too.
- **Two colours.** Every grey is a mix of eigengrau and ink in OKLab, so the palette stays the site's two colours. One round a day borrows a colour, the way Music's room borrows a record's. *Checked against the summary's colour rule ("colour only where it comes from something"): the Tint round's blue is the illusion under test, it appears in one round a day, and the frame around it stays two colours.*
- **Self-knowledge.** After ten days it tells you how your own eye leans: the small, true thing that About promises.

##### Rules

1. **Five rounds** (seven on Sunday). Each shows a reference patch in company, and a second patch alone on the page's eigengrau.
2. **Adjust.** Drag the lone patch lighter or darker, and in a tinted round warmer or cooler, until the two look the same. Then choose "Leave it there".
3. **Reveal.** The company dissolves, and the lone patch slides over until it touches the reference. If they differ, you see the seam.
4. **Levels.** The difference is the largest gap in any of red, green and blue, out of 255. That is what the screen actually shows.
5. **Result.** The total over the round, lower is better. There is no timer and no retrying. You cannot lose, only be led.

##### The five kinds of company

Each family gets one serif line the first time a player meets it, kept afterwards in the record as "Five ways to be led" (new).

| Company | Illusion | What it does | The line |
|---|---|---|---|
| **Room** | Simultaneous contrast | On a light ground the reference looks darker. The lone patch, on eigengrau, looks lighter. | "Chevreul ran the dyes at the Gobelins. The weavers said his blacks were weak. The blacks were fine; it was what they sat beside. He wrote it down in 1839." |
| **Tint** | Chromatic induction, on the blue–yellow axis | A grey on blue looks yellowish. | "A grey on blue borrows the opposite of blue. The eye does it to keep white white." |
| **Stripes** | White's illusion | Grey bars laid on the dark stripes of a grating look *lighter*, against everything Room taught. A player who has learnt to correct gets caught. | "Michael White, 1979. The grey takes after the stripe it seems to lie in, not the ones it touches most." |
| **Edge** | Cornsweet | Two identical fields meet at an edge, with a light ramp on one side and a dark ramp on the other, and one whole field looks lighter. | "Cornsweet, 1970. Only the edge is different. The eye fills in the rest to match it." |
| **Nothing** | None | The reference sits on plain eigengrau, like the lone patch. It is the control: anyone correcting by habit overcorrects. | "Nothing was there to correct for. Correcting anyway is the illusion." |

##### A day, worked (B's Thursday, rechecked with `grey.mjs`)

These values were computed for `hashSeed("grey:2026-10-01")`. Under `seedFor("grey", n)` the numbers will differ, but the shape will not. Under the new numbering it would be Same Grey No. 4, Thursday 15 October. The truth `t` is the mix from eigengrau (0) to ink (1), in the site's own OKLab (`tone.ts:48-80`).

| Round | Company | Truth | A player's setting | Levels |
|---|---|---|---|---|
| 1 | Room: the reference on a 360px square of ink | t 0.52, `#7b7b7c` | `#6f6f71`, darker, as the light room made it look | 12 |
| 2 | Tint: on `oklch(0.52 0.13 262)`, `#3e66b3` | t 0.58, `#888888` | `#8e8a80`, yellow added to match the yellow the blue lent it | 8 |
| 3 | Stripes: 12px stripes of ink and eigengrau, the grey on a dark stripe | t 0.44, `#6a6a6c` | `#767678`, lighter | 12 |
| 4 | Nothing: plain eigengrau | t 0.55, `#818182` | `#7e7e7f`, corrected for nothing | 3 |
| 5 | Edge: two fields with a 40px ramp each side of the join | t 0.37, `#5b5b5f` | `#606063` | 5 |

The result reads "Forty levels off in five. The eye usually is."

This example used full ink for the Room. The ladder below caps the Room at 90% ink, for comfort.

##### How each day is made

- **Truths** lie between t 0.30 and 0.70, so a patch is never near a company's extremes.
- **The start.** The lone patch starts 0.06 to 0.12 away in t, which is about thirteen to twenty-five levels, on a side the seed picks, and never within two levels of the truth. A player who does not touch it scores badly.
- **One step is one level** (new).
  - The lone patch moves along a table built once: the distinct 8-bit colours on the OKLab line from eigengrau to ink, one entry per level of the channel that changes most. That is about two hundred and eleven entries, from `0x16` to `0xe9` in red.
  - In Tint rounds the sideways axis moves OKLab *b* by 0.0025 a step, and the table is rebuilt at that *b*.
  - So a perfect answer is always reachable, and the score measures exactly what was painted.
- **The weekday ladder** (made explicit; B's table left Tuesday to Friday loose):

  | Day | Rounds | Companies | Strength | Patch |
  |---|---|---|---|---|
  | Mon | 5 | Room, Tint, Edge, Room, Edge | Room at 90% ink, Tint chroma 0.13, Edge ramps 40px | 112px |
  | Tue | 5 | Room, Tint, Edge, Nothing, and one more Room or Tint | as Monday | 112px |
  | Wed | 5 | adds Stripes (12px) | as Monday | 112px |
  | Thu | 5 | all five, Nothing at most once | Room 85%, chroma 0.10, stripes 10px, ramps 32px | 96px |
  | Fri | 5 | all five | as Thursday, ramps 28px | 96px |
  | Sat | 5 | all five | Room 75%, chroma 0.07, stripes 8px, ramps 20px | 64px |
  | Sun | 7 | all five, and two Nothing | as Thursday | 96px |

  Subtler is harder because a subtle illusion is harder to recognise as one, so more people forget to correct for it.
- **Tint hues** stay on the blue–yellow axis (OKLCH hue near 262° or near 95°), never red–green. The common protan and deutan kinds of colour blindness keep that channel, so the round still works for them.
- **Gamut.** Every colour is checked with `inGamut` (`tone.ts:70`), which becomes an export.
- **Solvable by construction:** every round has its truth.
- **The frozen day:**

  ```json
  { "n": 4, "weekday": 4, "rounds": [
    { "family": "room",    "t": 0.52, "start": 0.61, "ground": 0.85, "size": 96 },
    { "family": "tint",    "t": 0.58, "start": 0.49, "hue": 262, "chroma": 0.10, "size": 96 },
    { "family": "stripes", "t": 0.44, "start": 0.53, "stripe": 10, "size": 96 },
    { "family": "nothing", "t": 0.55, "start": 0.47, "size": 96 },
    { "family": "edge",    "t": 0.37, "start": 0.45, "ramp": 32, "size": 96 } ] }
  ```

##### How it looks

- **Desktop.**
  - The heading sits on the 206px line.
  - Below it the board: two 360×360 places side by side, 32px apart, with their tops at 270.
    - **Left:** the company, with the reference patch at its centre.
    - **Right:** no box at all. The lone patch floats on the page itself at the same height, so the page is its company.
  - Under the lone patch, in grotesk 12: "Leave it there".
  - Under the board, the status line in serif: "Two of five."
  - The grain from `dither()` (`tone.ts:463`) is never laid over the patches, because it would add a level of noise.
- **Phone.**
  - The company square is 358 wide at y 150. The lone patch is 96×96, centred 48px under it, with "Leave it there" beneath.
  - `touch-action: none` on the patch, so the panel does not scroll while you drag.
  - The Room company never exceeds 360px or touches the page's edges. It is the brightest thing on the site, and a phone at night should not flash.
- **The reveal.**
  1. The company dissolves through the 8×8 Bayer order over 0.6s. Port `bayer8` from its GLSL in `Urchi.ts:20-21` to about a dozen lines of JS. Draw seventeen threshold frames once into an 8×8 canvas each, and step them as a CSS `mask-image`, with cells of `DITHER_CELL` (2.5) device pixels as `RoomScene.ts:94` and `:216` do.
  2. The lone patch slides until it sits edge to edge with the reference, using `EASE.reveal` and `DUR.reveal` (0.9s). On a phone it slides up.
  3. The two stay together for two seconds with the round's line.
  4. The next company builds in through the dither.

##### Hands and keys

- **Pointer.** Drag the lone patch up for lighter and down for darker, one level per 4px. The cursor label says "Lighter" or "Darker", through `CursorLabel.ts`. In Tint rounds, drag sideways for warmer or cooler. The wheel moves one level a notch.
- **Keyboard.**
  - ↑/↓ move one level, and Shift moves five.
  - ←/→ warm or cool.
  - Enter leaves it there.
  - Esc goes back to the Today drawer (up one level).
- **Touch.** Drag.

##### Sound

- Each level crossed plays `play("tick")`, a detent under the finger, throttled to one per 40ms.
- Leaving it plays `focus`.
- The reveal slide plays `close` at 0.4.
- The last round plays `done`.
- The bed stays as it is, because nothing here is tonal.

##### What it says

| Round | Line |
|---|---|
| Room | "Twelve levels darker than it was. The light room did that." |
| Tint | "Eight levels off, most of it yellow. The blue lent it." |
| Stripes | "Twelve lighter. The stripes go the other way." |
| Nothing | "Nothing to see through that time. You corrected anyway." |
| At most one level | "The same grey. Both of them." |

| End | Line |
|---|---|
| Typical | "Forty levels off in five. The eye usually is." |
| Under ten | "Nine levels off in five. Hardly led at all." |
| Sunday | "Fifty-one levels off in seven. Two of them were nothing." |

##### Share

```
Same Grey 4
Forty levels off in five. The stripes took twelve.
dariustan.dev/today/grey/4
```

It names the family that cost the most, which says nothing about which way.

##### Record and archive

- **Stored:** each round's `{ family, t, set: [r, g, b], levels }` and the total.
- **Archive:** each day is a strip of five swatch pairs, truth beside yours, each pair 24px and touching, so the seams read as a row.
- **The bias line.** After ten days a line appears in the record, from the mean signed error per family: "You see light rooms darker than they are, by about nine levels. Stripes fool you less than most." This is the hook that brings people back.

##### Accessibility

- **Reduced motion.** The dissolve and the slide are cuts, and the patches are placed side by side at once.
- **Colour blindness.** Tint stays on the blue–yellow axis. A "Greys only" word in the footer swaps Tint for a second Room, remembered per viewer in `eigengrau:today:grey` through `store.ts`, not in a key of its own.
- **Sound off.** Silent, and fully playable.
- **Forced colours.** Under `@media (forced-colors: active)` the system repaints the greys and breaks the premise. The game says so plainly: "Your system is choosing the colours. This one needs the page's."
- **Screen readers.** "A game about seeing greys. It needs the eyes." It is still operable from the keyboard. The shelf's other two games are written for screen readers, which is why this honesty is acceptable here.

##### Where it hooks in

- **New:**
  - `src/games/grey/rules.ts`: the families, the ladder, the step table and the levels. It is pure, and imported by `scripts/today.ts`.
  - `src/games/grey/Board.tsx`: DOM with CSS backgrounds. The stripes are a `repeating-linear-gradient`, and the Cornsweet ramps are linear gradients.
  - `src/games/grey/share.ts`.
- **Reuses:**
  - From `tone.ts`: `labOf` (`:48`), `rgbOf` (`:65`), `inGamut` (`:70`, exported), `fromLch` (`:80`), and `BG_RGB`, `INK_RGB` and `EIGENGRAU` (`:95-97`).
  - `EASE` and `DUR` from `motion.ts`.
  - `CursorLabel.ts`.
  - `sfx.play`.
  - `countWord` (`site.ts:201`).
- **Weight:** under 8 KB of gzipped JS, and no frame loop at rest.

##### Edge cases

- **Phone:** as laid out above.
- **Reduced motion:** cuts.
- **Sound off:** nothing is lost.
- **Urchi's night hours:** not involved. The day turns at his midnight, an hour before his night (01:00-06:59 in Melbourne) begins, so a board started at 23:50 his time is played to the end as yesterday's, with the new-day line above it (§1.8).
- **Returning visitor:** a half-played day resumes on its round, with the lone patch where it was left.
- **Carrying a find:** on the Desk a carried find goes into the pocket at once and never hangs under the pointer (summary, reconciliation 3). That matters most here, because Same Grey is a test of what sits beside a grey.
- **Screens:** six-bit panels may shimmer at one-level steps, which is harmless. Brightness and calibration differ between screens, but both patches are on the same screen, so most of that cancels out.

**Effort:** S, one day, plus half a day of tuning with the debug panel. It needs the frame first.

**What it shows:** colour science done properly (OKLab, honesty about 8 bits, the gamut), perception, and the restraint to make a game out of five grey squares.

**Risks:**

- **It is a test before it is a game.** The skill ceiling is low, and the loop is learning your own bias. White's stripes and the Nothing round keep that honest, and the bias line keeps people coming back. If the counts show returning players falling away after a week, move Same Grey to Tools as an instrument, and let Stet carry the shelf.

---

#### 3. Stet (from A) · second

> Proofreaders write *stet*, "let it stand", beside a mark they take back.

**Pitch.** A paragraph with a few things wrong in it. Mark them. Anything you mark that was right is let stand.

##### Rules

1. **One paragraph a day**, eighty to a hundred and twenty words, set the way a note is set.
2. **The count.** The head says how many errors it holds: three on Monday, rising to six on Sunday. From Monday to Wednesday it also names their kinds.
3. **One error, one word.** Every error lives inside one word, together with any punctuation touching it, and you tap the word.
   - A doubled word ("the the") spans two tokens, and tapping either marks it (new).
   - A wrong fact changes exactly one token: "2004", not "in 2004" (new).
4. **If the word holds an error, the mark stays.**
   - The word is struck through, and the right form rises above it.
   - Its proofreader's mark goes in the margin.
5. **If it does not, the word is let stand.**
   - A row of dots appears under it, the proofreader's own sign for stet, and "stet" appears in the margin.
   - It costs nothing but the count.
6. **The margin fills** (new).
   - The margin holds as many stets as there are errors, plus three.
   - When it is full, the paragraph stops taking marks and asks: "The margin is full. Is that all you can see?"
   - There are still no lives, but tapping every word stops paying.
7. **Finishing.** You finish by finding them all, or by choosing "That is all I can see.", which shows the rest.

##### The kinds of error, with the marks the margin uses

| Mark | What is wrong | First appears |
|---|---|---|
| `/` | A wrong letter or word. The slash goes through it and the right one goes in the margin: "were" for "where", "compliment" for "complement". | Monday |
| `tr` | Two letters swapped: "heliopuase". | Monday |
| `del` | Something to take out: a doubled word, or a stray apostrophe ("it's twin"). | Tuesday |
| `qy` | A fact that is wrong: a year, a number, a name. It is a query to the author. | Thursday |
| `wf` | Wrong font: one word set in the grotesk instead of the serif. | Friday |
| `wf` | Sunday's harder kind: one word in Newsreader 300 among the 400s. Both weights are already self-hosted in `public/fonts/`. | Sunday |
| `–` | A hyphen where a range needs an en dash, or a straight quote where a curly one belongs. | Sunday |

Spelling is British throughout, because the site writes "colour". An error is never a spelling variant.

##### A day, worked: Stet No. 6, Saturday 14 November 2026. "Five marks to make."

This is A's example. With Stet counting from Monday 9 November (decided; first proposed as 2 November), No. 6 is still a Saturday. The word **Berry** is set in the grotesk.

*Decided in `decisions.md` (Daily games 4): the bank launches on public-domain passages, which never carry a `qy`. A paragraph like this one, with a sourced modern fact, reaches Stet only as a note he lends (below). The example stands as the shape of such a day.*

> Voyager 1 left Earth on 5 September 1977, sixteen days after it's twin. It carries a gold-plated record: greetings in fifty-five languages, whale song, a kiss, a heartbeat, and ninety minutes of music, from Bach to Chuck **Berry**. In 2004 it crossed the heliopuase, were the Sun's wind gives out, and became the first human-made object in interstellar space. Its signal now takes almost a day to reach us. Nobody expects the record to be found. It was sent anyway.

One way through it:

1. **"it's twin".** It is struck through, "its" rises above it, and `del` goes in the margin. "Its signal", three sentences later, is correct, and is there on purpose.
2. **"sixteen".** It looks too neat, so the player taps it. Dots appear under it, with "stet": it is true. Voyager 2 launched on 20 August and Voyager 1 on 5 September.
3. **"2004".** A `qy`. When the day is finished, a line under the paragraph says: "2004 was the termination shock. The heliopause was 2012." with its source.
4. **"heliopuase".** A `tr`.
5. **"were".** A `/`, with "where" in the margin.
6. **"Berry".** A `wf`. On a phone it is the hardest of the five, and if it keeps getting past you the record will say so.

The result reads "Five of five. One let stand." Choosing "Read it clean" then sets the paragraph right one word at a time, and the day can be shared.

The clean text reads: "...sixteen days after its twin... In 2012 it crossed the heliopause, where the Sun's wind gives out...". "Almost a day" is true in November 2026: Voyager 1 reaches one light-day from Earth at about that time. That is exactly the kind of fact that needs its "as of" in the source note.

##### How each day is made

Passages are curated and the errors are procedural.

- **The bank.** New `src/content/today/stet.json`, in the private bank (§1.5). Each passage looks like this:

  ```ts
  type Passage = {
    id: string; topic: NoteCategory; text: string;
    approved: boolean;                                           // he approves; npm run today refuses a passage without it
    lent?: string;                                               // the id of the note he lent, if it is his
    source?: { title: string; year: number };                    // public-domain passages only
    facts: { span: string; wrong: string[]; note: string; source: string; asOf?: string }[];
    swaps: { span: string; to: string }[];                       // safe wrong-word slots, chosen by a person
    keep: string[];                                              // names and archaic spellings tr and the word list must leave alone
  };
  ```

- **The supply** (corrected). As written, "thirty to launch, then three a week, with a passage back after 120 days" cannot work: the bank would not reach 120 until about week thirty. This review then proposed forty to launch (twenty of his, twenty public-domain) and two of his a week. *Decided in `decisions.md` (Daily games 4), to spend none of his weekly hours on it:*
  - **Launch with forty public-domain passages:** short paragraphs from pre-1900 non-fiction whose prose still reads well, chosen and marked up by a branch with `npm run passage` (the swaps, the `keep` list and the source). For example:
    - Faraday, *The Chemical History of a Candle* (1861);
    - Ada Lovelace's *Notes* (1843);
    - Darwin, *The Voyage of the Beagle* (1839);
    - Babbage, *Passages from the Life of a Philosopher* (1864);
    - Mary Somerville, *On the Connexion of the Physical Sciences* (1834).
  - **He approves them in one sitting** of about an hour, by Monday 2 November, a week before Stet No. 1. `npm run today` refuses unapproved passages, and fails from 2 November while fewer than forty are approved. If fewer than forty are approved by then, Stet slips a week at a time.
  - **Add ten a month,** drafted the same way, for his approval.
  - **Notes he lends.** `npm run note` asks "Lend this to Stet? [y/N]" for any note of 80 to 120 words. A lent note may carry a `qy`, because its facts are his and sourced. If he writes Stet paragraphs anyway, they go in with `npm run passage` and are chosen before the public-domain ones.
  - **Nothing asks him for two paragraphs a week.**
  - **Spacing.** A passage never returns sooner than the bank's size in days (forty at first), and returns with different errors. When it does, its `qy` slot moves to a different fact, so remembering the clean text does not give the query away.
  - **Public-domain passages** never carry a `qy`, because old facts are often out of date. That day's `qy` becomes a `/`. They name their source after the day is finished: "Faraday, 1861."
- **`npm run passage`** (new), built like `scripts/add-note.mjs`. It asks for:
  - the text and the topic;
  - each fact (its span, two or three wrong values, a one-line note and a source URL);
  - the swaps.

  It then runs the validator and appends to the bank, with `approved: false` until he approves it. Marking up a Stet paragraph becomes as easy as writing a note, and a branch can do it for him.
- **Where his passages come from.** Notes he lends: his own paragraphs on his note topics, with facts taken from cited sources. The facts are not copyrightable, and the sentences are his.
  - `NOTE_CATEGORIES` (`site.ts:230-240`) has no "space". Add it before a note like the Voyager paragraph needs it.
- **Each day.**
  - `rng(seedFor("stet", n))` picks the passage from a seeded permutation of the eligible ones.
  - The weekday decides the kinds. The seed picks a slot for each kind, following these rules:
    - errors are at least eight words apart;
    - none falls in the first three words;
    - `tr` goes only on words of six letters or more that are not in `keep`;
    - `wf` goes only on words of four letters or more.
- **Solvability and uniqueness**, checked in `scripts/today.ts`:
  - The clean text must pass an en-GB word list (plus `keep`) and a typographic lint: curly quotes, en dashes in ranges, no double spaces.
  - Every `tr` and `del` output must be a non-word or a repeat, so it can only be read as wrong.
  - `/` comes only from `swaps`, which a person chose, and `qy` only from `facts`, which carry a source.
  - Exactly N tokens must differ from the clean text (a doubled word counts once). So there are N wrong words, and every other word is right, both by construction and by the lint.
- **By weekday:**

  | Day | Errors | Kinds |
  |---|---|---|
  | Monday | 3 | `/` and `tr`, named in the head |
  | Tuesday | 4 | adds `del`, named |
  | Wednesday | 4 | named |
  | Thursday | 5 | adds `qy`; the head gives only the count |
  | Friday | 5 | adds `wf` |
  | Saturday | 5 | as Friday |
  | Sunday | 6 | adds the weight `wf` and the typographic marks |

- **Security facts** (new, grafted from the cut Fairly Sure). Cybersec notes he lends can carry computed facts, which are sturdier than looked-up ones (public-domain passages carry no `qy`). For example: "At ten billion guesses a second, every eight-letter lowercase password falls in about twenty-one seconds" (26⁸ = 208,827,064,576). The `qy` offers "twenty-one minutes" as its wrong value.

##### How it looks

- **Desktop.** Notes' 450px column. The paragraph is set in the serif at 18px/1.6. Notes uses 16px; this is a little larger because it has to be read closely.
  - Words are buttons with no chrome. On hover they get the site's own link underline, 1px with a 3px offset (`globals.css:697-705`).
  - A marked word is struck through with a 1px ink line, and its correction sits above it in grotesk 11px, rising in its mask.
  - Margin marks sit 24px outside the column on the line's baseline, in grotesk 11px at 60% ink, like the tags in Notes' meta line.
- **Stet dots.** `text-decoration: underline dotted 1px` at 45% ink. "stet" shows in the margin for 2.4s, and then only the dots remain.
- **Under the paragraph.**
  - A grotesk 12px tabular line, "Three of five. One let stand.", with the margin's room beside it: "Four stets left."
  - A text button: "That is all I can see."
- **Phone (640px and below).**
  - There is no margin, so marks become superscripts after the word, the size of the pill digits.
  - The paragraph is 17px/1.65, so every word is a 32px-tall target.
  - The count line sticks just above the bottom rim.
- **First visit** (new): one serif line under the head. "Proofreaders write stet, let it stand, beside a mark they take back. Tap what is wrong."

##### Hands and keys

Tap or click a word. With the keyboard, the paragraph is one composite widget with a roving focus:

- ←/→ moves word by word, and ↑/↓ line by line.
- Enter or Space marks the focused word.
- Typing letters jumps to the next word starting with them, the same type-anywhere habit as Notes (`NotesPanel.tsx:1012-1034`).
- Tab leaves for the controls.
- Esc goes back to the Today drawer (up one level).

##### Sound

- A mark that holds: `play("tick", 0.6, 0.8)`, like a pencil tick.
- A word let stand: `play("close", 0.35)`.
- All found: `play("done")`.

##### Feedback and failure

- There are no lives. Stets are counted, never punished, until the margin is full.
- "That is all I can see." asks once ("Show the rest?" / "Not yet"). Then it writes in the missed errors at 60% ink, with their marks: "Two were still in there." (This review first set them at 45%, which is 3.9:1 on eigengrau; the summary's rule is that meaningful text is at least 60% ink, 6.0:1.)
- The fact note is always kind and worth reading. It gives the true figure and says why the wrong one was tempting.

##### Share

```
Stet 6
del stet qy tr / wf
Five of five. One let stand.
dariustan.dev/today/stet/6
```

The second line is the margin in the order you worked. It reads like a real proofreader's margin, and gives away the kinds, not the words. On Thursday and later, when the head no longer names the kinds, the line shows marks only for the kinds already named that week, and `·` for the rest.

##### Record and archive

- **Streak:** counts days finished, whether or not every error was found. It rewards coming back, not perfection.
- **Record:** days played, clean days (all found, no stets), stets per day, and the kind you miss most: "You miss fonts." "You trust numbers."
- **Archive:** every past paragraph can be played. Finished ones can be read clean, with their fact notes.
- **Into Notes** (A's idea, with its mechanics fixed, then turned round by the supply decision):
  - A lent note is already in Notes, because it began there. The day after its Stet day, its Notes entry gains a grotesk trailer, "Stet No. 6", linking to `/today/stet/6`.
  - Public-domain passages never go into Notes. Notes is his voice, and Faraday's paragraph is not.
  - Notes is compiled from `site.ts` (`NOTES`, `site.ts:251`), so the trailer needs either:
    - the daily deploy the strategy review proposes, or
    - `npm run passage -- --publish <id>`, run by hand.
  - Notes must not fetch passages at runtime, because the bank is server-only.
  - A's first idea, that Stet gives a column holding two entries today a steady supply of his writing, becomes the reverse: his notes, when he writes them, give Stet a supply.

##### Accessibility

- **Screen readers** get the paragraph as text, and each word as a button named by the word: "heliopuase, word 38 of 86".
- **Results** go to a polite live region: "Marked. Transposed letters: heliopause."
- **`wf` cannot be heard.** A "Reading by ear" switch in the head replaces the day's `wf` with a `/` in the same place, and says so. The result and the share note "by ear".
- **Colour:** nothing depends on colour. States are strikes, dots and marks.

##### Spoilers

The day's JSON, which includes the corrections, is served only on or after its day. The share gives kinds, not words. Fact notes appear only after finishing.

##### Where it hooks in

- `TodayDrawer` opens `StetBoard` (new `src/games/stet/Board.tsx`), which fetches `/api/today/stet/6`.
- The text is split into word tokens once, on whitespace, keeping punctuation attached.
- The reveal uses the rise keyframes.
- The record lives in `eigengrau:today:stet`.
- `src/games/stet/rules.ts` holds the tokeniser, the error kinds and the validator, and is shared with the build script.

##### Edge cases

- **Phone:** 32px targets. `wf` appears only from Friday, and the weight `wf` only on Sunday: a 300/400 difference at 17px is easy on a retina phone and hard on a cheap one.
- **Reduced motion:** corrections appear without rising.
- **Sound off:** silent, and nothing is lost.
- **Urchi's night hours:** not involved.
- **Returning visitor:** the paragraph comes back with its marks in place.

**Effort:** M, two to three days of code on top of the frame. Content: forty public-domain passages marked up by a branch (about a week of a branch's work), one sitting of about an hour for him to approve them, then ten a month drafted for approval.

**What it shows:** an eye for detail and for type (the site's own two faces are the game's hardest mark), his writing, and what he reads about.

**Risks:**

- **A factual error in the clean text** would be a disaster in a proofreading game. Every fact carries a source and an "as of", and is checked twice.
- **Ambiguous `/` slots.** A person picks them for that reason.
- **Pedantry.** Typographic marks appear only on Sunday, and each is explained the first time it comes up.
- **Writing.** Decided: nothing asks him for weekly paragraphs, so Stet no longer depends on them (`decisions.md`, Daily games 4). The one dependency left is his hour of approval. If fewer than forty passages are approved by Monday 2 November, Stet slips a week at a time.

**Why it fits:** About says "Quiet interfaces for people who notice the small things." Stet is that sentence as a game.

---

#### 4. Plaintext (from A) · third, from Monday 7 December

*Decided in `decisions.md` (Daily games 4): week 1 opens on Monday 7 December, not 23 November, so that Stet has four weeks of archive first, as the summary's one-game-at-a-time rule requires. The dates in the worked week below move with it.*

> The method is on the page. Only the key is not. (Kerckhoffs, 1883.)

**Pitch.** One lock a day, each a little better than the last, from Caesar on Monday to XOR on Sunday. Once all seven are open, the week's lines make one letter.

**First visit** (new), one serif line: "A letter a week, one line a day, each under a better lock than the last. The method is on the page. Only the key is not."

##### Rules

1. **The week.** A week, Monday to Sunday, is one short letter in seven parts. Each day one part is locked with that weekday's cipher.
2. **The tools.** The page gives you the tools to break it. When the key is right the text reads, and the page knows because it checks a hash. It never holds the answer itself.
3. **Hints.** Each day has one. From Thursday on, the hints point back into the week ("You read them on Monday."). Earlier days stay open in the archive, so starting on a Thursday is fine.
4. **Peeks.** You can ask for one letter of the key. On Wednesday a peek gives one mapping, on Friday one column's place, on Sunday one byte. Peeks are unlimited, and counted.
5. **Giving up.** "Open it" shows the key and the text, and the day counts as opened, not solved.

| Day | Lock | Shown as | Key | Tool |
|---|---|---|---|---|
| Mon | Caesar | letters, word breaks kept | a shift of 1-25 | one alphabet strip |
| Tue | Affine (ax + b mod 26) | as Monday | a coprime to 26 (not 1), and b | two strips |
| Wed | Keyword substitution, no letter standing for itself | as Monday | a word from the day's own text, the alphabet turned | a mapping row with letter counts |
| Thu | Vigenère, length given | as Monday | a word from Monday | one strip per column, each with its counts |
| Fri | Columnar transposition | letters only, in five-letter groups | a word from Tuesday, no letter twice | columns you can move |
| Sat | Vigenère, no length given | five-letter groups | a word from Wednesday | coincidence bars for lengths 2-12, then Thursday's tool |
| Sun | Repeating-key XOR over bytes | hex | a lowercase word | one dial per key byte, with a readable meter |

##### A week, worked: week 1, "The name" (all recomputed)

**Monday 7 December.** The hint is "One letter stands alone. It is probably A."

```
JSVZL FVBY LFLZ PU H KHYR YVVT HUK DHPA H TPUBAL. DOHA FVB ZLL PZ UVA ISHJR.
PA PZ H ZVMA NYLF, HUK PM FVB DHAJO PA SVUN LUVBNO PA TVCLZ.
```

- H stands for A, so the shift is 7.
- It opens to: *"Close your eyes in a dark room and wait a minute. What you see is not black. It is a soft grey, and if you watch it long enough it moves."*
- A chi-squared fit over all twenty-five shifts puts 7 at 17.6, against 290 for the next best, so there is no second reading.

**Thursday 10 December.** The hint is "Four letters. You read them on Monday."

```
XFI GPB TZCQMGPMKAWRW FSRMUIB ML ELH YETI AX Y TDEGR YIPQSR LEEI. RLWC BMV RMX
EEII S JSWK. XFIQ APSLI GX VSUR SRB AWRR FSGI XG AMVC.
```

There are two ways in:

- **The chain.** Monday's four-letter words are *your, eyes, dark, room, wait, what, soft, grey, long*. Type them into the key field in turn, and EYES reads at once.
- **The tools.** Split the text into four columns, taking every fourth letter, which gives twenty-six letters each. Turn each column until its letter counts sit on English's outline. The fit (chi-squared, lower is better) for each column's best shift against its second best:

  | Column | Best | Fit | Second | Fit |
  |---|---|---|---|---|
  | 1 | E | 23.1 | P | 54.3 |
  | 2 | Y | 37.3 | F | 78.9 |
  | 3 | E | 15.1 | Q | 53.7 |
  | 4 | S | 20.0 | E | 120.3 |

  To check the first word: X−E = T, F−Y = H, I−E = E, which gives THE.

It opens to: *"The old physiologists noticed it and gave it a plain German name. They did not make a fuss. They wrote it down and went back to work."*

**Sunday 13 December.** The hint is "Four lowercase letters. The colour." These are the first sixteen of its 136 bytes:

```
22 1b 02 1c 09 15 17 18 12 5c 45 30 13 01 45 16 ...
```

- **The page teaches the XOR trick.** A space (0x20) XORed with a lowercase key letter gives a byte from 0x40 to 0x5f, which looks like a capital letter.
  - So in column 2 the commonest byte, 0x52, is a space: 0x52 XOR 0x20 is `r`.
  - Column 3's 0x45 gives `e`.
  - The middle of the key is therefore `re`, and the hint settles it as the British spelling.
- The per-column readable meter confirms `g r e y`.

It opens to: *"Eigengrau. Its own grey. The page you are reading is that colour, and the letters are its inverse. You have been looking at it all week."* That is literally true: `#e9e9e2` is the exact inverse of `#16161d` (`src/lib/color.ts`).

**The whole letter:**

> Close your eyes in a dark room and wait a minute. What you see is not black. It is a soft grey, and if you watch it long enough it moves. / Nothing outside you made it. There is no light in the room. The eye is only listening to itself, and the grey is the sound of that. / Engineers would call it the noise floor: the signal a receiver hears when nobody is sending. Every system has one. Most of them hide it. / The old physiologists noticed it and gave it a plain German name. They did not make a fuss. They wrote it down and went back to work. / The name is two words stuck together. The first means own, as in one's own. The second is the colour. Put them back together and read it. / A cipher is supposed to look like that grey: noise with nothing in it. The good ones do. The bad ones leave the shape of the words showing. / Eigengrau. Its own grey. The page you are reading is that colour, and the letters are its inverse. You have been looking at it all week.

**The rest of the week's keys** (all computed; SIGNAL, LIGHT and NOISE all appear in their source lines):

- **Tuesday:** affine, with a = 5 and b = 8.
- **Wednesday:** the keyword SIGNAL, with the alphabet turned one place (`ZSIGNALBCDEFHJKMOPQRTUVWXY`), so that no letter stands for itself. SIGNAL is in Wednesday's own text.
- **Friday:** LIGHT, from Tuesday's text. The columns are read out in the order 2, 3, 1, 0, 4.
- **Saturday:** NOISE, from Wednesday's text.
  - The index of coincidence by key length is 0.042 for 1, 0.040 for 2, 0.039 for 3, 0.041 for 4, **0.059 for 5** and 0.039 for 6, so length 5 stands out.
  - The columns then give N O I S E.
- **Sunday:** `grey`.

##### What each lock teaches (new)

After each day opens, the key appears in grotesk, then one serif line about the lock and why it fails. The seven lines, with Thursday's taken from A:

| Day | Key line | The line |
|---|---|---|
| Mon | "Key: 7." | "Suetonius says Caesar shifted by three. Twenty-five keys is not a secret. It is a short delay." |
| Tue | "Key: a = 5, b = 8." | "Twelve choices of a and twenty-six of b: 312 keys. A computer has tried them all before the page has drawn." |
| Wed | "Key: SIGNAL, turned one place." | "The keys run to a number twenty-seven digits long, and it still falls to counting. Al-Kindi wrote down how in the ninth century." |
| Thu | "Key: EYES." | "The Vigenère was called the indecipherable cipher for three centuries. Kasiski published how to break it in 1863. Babbage had done it first and not said." |
| Fri | "Key: LIGHT. Columns 2, 3, 1, 0, 4." | "A transposition moves the letters and changes none of them, so their counts still read as English. That is how you knew it was one." |
| Sat | "Key: NOISE." | "William Friedman's index of coincidence, from the 1920s: the text itself says how long the key is." |
| Sun | "Key: grey." | "A short key repeated over bytes is a Vigenère by another name. Breaking it is the sixth exercise in Cryptopals, and it still turns up in real malware." |

##### How each week is made

- **Content.** New `src/content/today/plaintext.json`: `[{ title, lines: [7], source? }]`, one entry per week, curated in order.
  - Week one is "The name".
  - Later weeks are seven consecutive sentences from public-domain writing about secrets and signals, chosen by a branch and approved by him, or his own letters when he writes one (they go first, and are never required):
    - Poe, *The Gold-Bug* (1843);
    - Conan Doyle, *The Adventure of the Dancing Men* (1903);
    - Babbage, *Passages from the Life of a Philosopher* (1864).

    On those weeks, Sunday's reveal names the source.
  - Each line runs to about 100-110 letters, which is enough for the statistics to work.
  - Launch with four letters: "The name", already written and verified above, and three public-domain weeks drafted for his approval, which takes minutes, not evenings.
- **Keys** come from `seedFor("plaintext", n)` within each weekday's rules.
  - Shifts are 1-25, never 13.
  - Affine `a` is drawn from the eleven values other than 1 that are coprime to 26.
  - Wednesday's alphabet is keyword-turned, and rejected if any letter stands for itself (the American Cryptogram Association's convention).
  - Thursday's, Friday's and Saturday's keys are drawn from words in Monday's, Tuesday's and Wednesday's plaintext. That is the chain. Friday's must have distinct letters.
- **Solvability is guaranteed by solving.** `scripts/today.ts` breaks every day with the page's own tools before anyone sees it:
  - chi-squared over shifts (Monday, Tuesday, and each column on Thursday and Saturday);
  - the index of coincidence for the key length (Saturday);
  - hill-climbing on a quadgram score (Wednesday);
  - quadgram-scoring all 120 orderings (Friday);
  - a readable-bytes score per key byte (Sunday).

  A day ships only if the solver recovers the key, the true reading beats the next best by a set margin, and no other key produces more than 90% dictionary words. Otherwise it re-rolls with `attempt + 1`.
- **The answer check.**
  - The day's JSON holds the ciphertext and `sha256(week:day:NORMALISED)`. NORMALISED is the letters only, in upper case, from Monday to Saturday, and the exact bytes on Sunday.
  - The page decrypts with your key and compares hashes with `crypto.subtle.digest`. That needs a secure context: https, or localhost.
  - For peeks there is one salted hash per key position, and the page brute-forces 26 letters (256 bytes on Sunday) when you ask.
  - Neither the plaintext nor the key is ever shipped.
  - A line for anyone reading the console: "It is all in the bundle, and none of it reads. That is rather the point."
- **Difficulty** comes from the cipher order itself. Word breaks disappear on Friday, and Sunday moves from letters to bytes.

##### How it looks

- **Head.** Grotesk "Plaintext", then serif "Week 1, Thursday. Four letters. You read them on Monday."
- **The ciphertext.**
  - Each letter sits in a fixed-width cell (a CSS grid of `0.75em` columns, glyphs centred), because the columns have to line up.
  - The cipher letters are set in the site's new monospace at 15px and 60% ink. The current decryption sits under them at full ink. *Ruled in the summary: monospace only where alignment carries meaning (ciphertext, hex, logs), and only from Plaintext on. `decisions.md` (Style and UX 2) makes it Commit Mono 400, subset to ASCII, arriving with Plaintext on Monday 7 December. This review first set the cipher in the grotesk, because Inter Tight is not monospaced, at 45% ink, which is 3.9:1 and below the summary's 60% floor for meaningful text.* The grid stays, so the decryption, in the grotesk, still sits under its cipher letter.
  - Letters that change when you turn a dial rise 4px into place.
- **The tools** sit in one glass panel (`.glass`, `globals.css:97`, radius 4, gutter 8):
  - **Strips** (Monday, Tuesday, Thursday). The alphabet A-Z runs across, with the shifted alphabet under it, dragged sideways like an unrolled cipher disk. It snaps letter by letter.
  - **Letter counts.** Twenty-six 1px hairlines with heights set by the counts, and English's expected profile as a faint dotted outline over them.
  - **The mapping row** (Wednesday). The cipher letters are sorted by count, each with a slot for its plaintext letter. Giving a plaintext letter to a second cipher letter strikes through the older mapping.
  - **Columns** (Friday). The text stands in vertical strips headed "? ? ? ? ?", and the rows read across as you move them.
  - **Coincidence bars** (Saturday). Eleven bars for lengths 2-12, with two dotted guides: English at 0.066 and random at 0.038.
  - **Hex grid** (Sunday).
    - Bytes sit in two-character cells in the monospace, each with its decoded character under it (`·` where it is not printable).
    - Each key byte has a dial showing hex and character, and a per-column "readable" hairline meter.
    - A grotesk 11px tip: "A space under a letter turns it into a capital."
- **Solved.**
  - The decrypted line slides up to replace the cipher, set in serif 16px as a note, with the key and the lock's line under it.
  - Below it the week so far is stacked: solved days' lines in serif, unsolved days as hairlines the length of their text.
  - On Sunday the letter stands complete under its title, with the seven keys listed in grotesk.
- **Phone.**
  - The cells are 0.8em, and the strips go full-width and are swiped.
  - On Friday you tap two columns to swap them instead of dragging.
  - Sunday's hex runs eight bytes to a row (8 × 36px = 288px).
  - Wednesday's mapping uses an on-page alphabet of three rows of nine buttons instead of the system keyboard.

##### Hands and keys

- **Strips.** ←/→ step one letter, and PageUp/PageDown five. Typing A-Z into the key field sets every strip at once, which is how the chain is meant to be used: type EYES.
- **Wednesday.** ←/→ choose a cipher letter, typing a letter maps it, and Backspace clears it.
- **Friday.** Tab to a column, Space to pick it up, ←/→ to move it, and Space to put it down. This is the standard keyboard pattern for drag and drop.
- **Sunday.** ←/→ move between key bytes, ↑/↓ change the byte by one, and typing two hex digits sets it.
- The board claims digits and letters through `keys.ts` while it is open, so `1`-`6` do not change tabs mid-key (§1.10).

##### Sound

- A strip step plays `tick`, already throttled.
- There is **no** sound for "getting close". Any sign of nearness would give the key away.
- A day opening plays `done`.
- The seventh lock opening plays `bloom()`: the week opens.

##### Feedback and failure

- Nothing is ever marked wrong. The text reads as nonsense until it doesn't.
- Peeks are always on offer: "Show me one letter of the key."
- Opening a day says "Opened. The key was EYES.", with no judgement.
- After a solve, a rounded honest time appears, the way Music says "About two minutes in.": "About six minutes."

##### Share

```
Plaintext, week 1
M T W T · · ·
Thursday, two peeks.
dariustan.dev/today/plaintext/1
```

A capital letter is a day solved, a lower-case letter a day opened, and `·` a day still locked. On a Sunday with the week complete: "Seven of seven. The week reads."

##### Record and archive

- **Two records:** days solved in a row, and weeks read whole.
- **The archive** keeps every week's letter (complete once all its days are solved) and every day's tool, so any day can be replayed.
- **The record reads:** "Fridays take you longest."

##### Accessibility

- The strips are `role="slider"` with `aria-valuetext="Shift 7, A becomes H"`.
- The decryption is read on request with a "Read it" button, and otherwise announced once after a 600ms pause, so the screen reader does not chatter on every step.
- Letter counts have a text version: "Most common: L, eleven. V, nine. Z, eight."
- Friday's keyboard reordering announces each move: "Column three, now second."
- Nothing depends on colour.

##### Spoilers

- Only the ciphertext and the hashes are shipped, and a future day is a 404 from the server.
- The share shows only which days are done.
- Peeks can be brute-forced from the console. The page does not pretend otherwise, and never invites it: the site's security work is defensive only.
- The repository is public, so the letters live in the private bank fetched at build (§1.5; `decisions.md`, Daily games 3). The public repository holds only the generator and `crypto.ts`, which is the method, and the method is meant to be on the page. For this game above all, the private bank is worth the small build step.

##### Where it hooks in

- New `src/games/plaintext/Board.tsx`, with one tool component per weekday in `src/games/plaintext/tools/`.
- New `src/games/plaintext/crypto.ts`: the ciphers, the statistics (`chi`, `ioc`, quadgrams) and the hash check. The build script and the page share this one file, so the validator and the player use the same maths.
- The record lives in `eigengrau:today:plaintext`.
- `npm test` includes the whole example week above as a normalisation test.

##### Edge cases

- **Phone:** every tool above is built for touch.
- **Reduced motion:** letters change in place without rising.
- **Sound off:** nothing is lost.
- **Night hours:** not involved.
- **Returning visitor:** the dials are where they were left.
- **Starting on a Thursday:** the hint links to Monday in the archive.

**Effort:** L, one to two weeks, for seven tools, the validators, the hash checks and the first four letters. Build it in the first half of November while Stet starts, and finish it in the week after the public launch (30 November to 6 December), leaving the launch weeks (16-29 November) free, as `decisions.md` (Daily games 4) asks. Launch it on Monday 7 December, with the monospace.

**What it shows:** real cryptanalysis (frequency fits, the index of coincidence, the XOR case trick), presented quietly. It is the security piece a technical reviewer can actually play, and the first week turns the site's own name into the answer.

**Risks:**

- **The Saturday and Sunday cliff.** Peeks and the tip lines are there for it.
- **Writing a letter every week.** Decided: nothing asks him to. Public-domain weeks carry the game, drafted for his approval, and his own letters go first whenever he writes one.
- **Normalisation bugs in the hash check.** The example week is the test.

**Why it fits:** eigengrau is the signal with no sender, and a good cipher should look like it. Saturday's line says so.

---

#### 5. Plate (from B) · fourth, the flagship

> **Plate** Find the note that holds this figure.

**Pitch.** A square plate strewn with six thousand grains of sand, and a card showing today's figure. Bow the plate at the right note, in the right place along its edge, and the sand runs into that figure.

##### Why it is this site's game

- **History.** Ernst Chladni bowed sand-strewn brass plates in 1787 and watched the sand gather on the lines that do not move.
- **Look.** The grains are the site's one-pixel motes (`Motes.ts:18-22`: a few levels of 255 above eigengrau), in their thousands, on the site's grey glass.
- **Sound and sight.** Each carries the whole game on its own: the plate sings louder near a resonance, and the sand hops higher.
- **Noticing is rewarded twice.** Count the figure's lines and you can work out the note before you play one; listen, and you hear it sing.
- **A drawing a day.** Everyone ends the day with a drawing that carries their mistakes. A figure reached on the first bow is dense. One found after four wrong notes is thinner, because sand went over the edge.

##### Rules

1. **The board.** Six thousand grains lie on a square plate (round on Sundays). A card shows today's figure, and the dial marks the plate's lowest note.
2. **Set a note.** Setting the dial is free and silent.
3. **Bow.** Hold the plate's edge to bow it. While you hold, the plate sounds the note and the sand moves. Slide along the edge to move the bow. Let go and the sand stops where it is, so thinking costs nothing.
4. **Resonance.** At a note the plate resonates at, the sand runs to the lines that are not moving. Which figure you get depends on the note and on where the bow is.
5. **Lost sand.** Grains near a moving edge go over it, so wrong notes and wrong places cost sand.
6. **Holding.** The figure holds when nine grains in ten lie on today's lines for two seconds of bowing.
7. **The result** is how many bows it took (each press and hold is one) and the grains left.

##### The model

- **Mode shapes.** The plate is the unit square, with mode shapes φ_mn(x, y) = cos(mπx)·cos(nπy): a simplified free plate.
- **Notes.** Mode (m, n) sounds at f_mn = F·(m² + n²), where F is the plate's lowest note.
- **Several modes at one note.** Every mode with the same m² + n² sounds at the same note, and a bow at point b drives each in proportion to its own value there. At note f the plate's shape is Φ(p) = Σ_k φ_k(b)·φ_k(p)·R(f, f_k), where R is a resonance curve of quality Q.
- **What the bow does.** Moving the bow along the edge turns the mix of modes, so the figure morphs smoothly between straight grid lines and the curved Chladni forms.
- **Number theory for free.** 25 = 0² + 5² = 3² + 4², so four modes sound together at 25F. It gives the week's strangest figures.
- **The sand.** Every step, sixty a second, each grain jumps by noise of 0.010·A plate widths and drifts 0.004·A down the slope of |Φ|, where A is |Φ| normalised at that grain. A grain pushed over the edge falls with probability 0.5·A, and otherwise bounces back.
- **Checked in B's scratch simulation.** At the right note and bow, 99% of the grains that remain lie within 1.2% of a plate width of the lines after five seconds.
- **The round plate** (Sundays). φ = J_m(k_mn·r)·cos(m(θ − θ_bow)), with m diameters and n rings. The notes follow Chladni's own law, f ≈ F·(m + 2n)². The bow sets θ_bow, so the diameters turn to put a moving point under it, and the puzzle there is finding m and n.
- **Honesty.** A footnote under the dial: "A square plate, simplified. Its notes rise as m² + n²." Acousticians will know that a real free plate's do not.

##### A day, worked (B's Thursday)

- The seed is `hashSeed("plate:2026-10-01")` = 1328286431; under `seedFor` the numbers will differ, not the shape.
- The plate is square, its lowest note F = 88 Hz, with Q = 30.
- The card is where (2, 3) and (3, 2) sound together, bowed a fifth of the way along the bottom edge. That is the classic Chladni figure: a long diagonal with two curved lines. Here it is at 40×20, from the same maths:

```
·······##··············#··············##
·······#···············#············##··
·······#·············##···········##····
·····##···········###···········##······
··········####················##········
·········#··················##··········
········#·················##············
········#···············##··············
·······#··············##···········##···
······##············##···········##·····
·····##···········##············##······
···##···········##··············#·······
··············##···············#········
············##·················#········
··········##··················#·········
········##················####··········
······##···········###···········##·····
····##···········##·············#·······
··##············#···············#·······
##··············#··············##·······
```

The resonances in reach, with the modes that sound at each:

| Note (Hz) | 88 | 176 | 352 | 440 | 704 | 792 | 880 | **1,144** | 1,408 | 1,496 |
|---|---|---|---|---|---|---|---|---|---|---|
| m² + n² | 1 | 2 | 4 | 5 | 8 | 9 | 10 | **13** | 16 | 17 |
| Modes | 0,1 · 1,0 | 1,1 | 0,2 · 2,0 | 1,2 · 2,1 | 2,2 | 0,3 · 3,0 | 1,3 · 3,1 | **2,3 · 3,2** | 0,4 · 4,0 | 1,4 · 4,1 |

**A typical play** (the sand counts come from the scratch simulation):

1. The player tries 880 Hz and bows. A figure of one straight spine with four short bars forms: "A figure, not this one. Some sand went over the edge." 197 grains are gone.
2. They try 792 Hz: another wrong figure, and 45 more grains.
3. They look harder. The card's lines cross the plate about twice one way and three times the other: 2² + 3² = 13, and 13 × 88 = 1,144. They type `1144`, press Enter, and bow at the middle of the left edge. The sand runs into straight lines instead: "This note. Not this figure. Try another place along the edge."
4. They hold the bottom edge and slide. Near a fifth of the way along, the straight lines bend into the card's diagonal and curves: "It holds."

The result is "Held on the fourth bow, with 5,732 grains." A player who counted first holds it on the first bow, with about 5,840.

##### How each day is made (the pitch arithmetic corrected)

- **The fix.** B set F at 60-95 Hz and the dial at 60 Hz-2.4 kHz, but Saturday's pool includes 50. That puts 50F at 3.0-4.75 kHz, off the dial, and 26F at up to 2.47 kHz.
- **The new rule.** F = min(110, 2200 ÷ the pool's largest value) × u, with u from 0.75 to 1.0 drawn from the seed. The highest note of any day is then 2.2 kHz or lower.
- **The dial** is the same for every day, so the hand learns it: logarithmic, from 30 Hz to 2.4 kHz.

| Day | m² + n² pool | Modes | F | Q |
|---|---|---|---|---|
| Mon | 2, 8, 18 | single square modes (1,1), (2,2), (3,3): plain grids with m lines each way, easy to count | 82-110 Hz | 12 |
| Tue | 4, 5, 9 | pairs | 82-110 Hz | 18 |
| Wed | 5, 10, 13 | pairs | 82-110 Hz | 24 |
| Thu | 10, 13, 17 | pairs | 82-110 Hz | 30 |
| Fri | 13, 17, 20 | pairs | 82-110 Hz | 36 |
| Sat | 25, 26, 50 | four modes at 25; three at 50 (1² + 7² = 5² + 5²) | 33-44 Hz | 45 |
| Sun | round plate, (m + 2n)² ≤ 36 | diameters and rings | 46-61 Hz | 30 |

- **Wide resonances early.** Monday's Q of 12 keeps resonances wide and forgiving on a phone's dial. On Monday and Tuesday the dial also marks the first two resonances: "Its lowest notes are 88 and 176 Hz."
- **The bow point** is a point on the perimeter drawn from the seed. It is rejected in three cases:
  - every mode at that note has |φ_k(b)| < 0.3, so the bow sits near a node of everything and the sand would barely move;
  - the figure's 64×64 nodal mask overlaps another note's figure, at any bow point, by an IoU above 0.6, because the figure must name its note;
  - its lines fall closer than 14 CSS px on the 342px phone plate.
- **Solvability**, checked in `scripts/today.ts`. The sand simulation is pure TypeScript, so the script can run it headless:
  - from a uniform start, at the answer's note and bow, it must hold within six seconds;
  - after the two neighbouring resonances have each been bowed for two seconds, it must still hold within ten.
- **Determinism.** The day's seeded `rng` drives a fixed 60 Hz step, and the cosines come from per-axis tables rather than per-grain `Math.cos`. A replay then draws the same picture in every engine. The archive only needs the same picture, not the same bits.

##### How it looks

- **Desktop, 1440×900.**
  - **Heading:** "Plate" with "Find the note that holds this figure." on the 206px line.
  - **The plate:** 440×440, its top at 270, centred at x 720. It is filled with `--glass-bg` with the 4px radius (`--r`, `globals.css:39-42`) and no blur, since there is nothing behind it to blur. The grains are ink at single device pixels, with alpha from 0.55 to 0.9, so the sand has texture.
  - **The bow:** a 24px ink bar just outside the edge where the pointer holds. It follows round the corners.
  - **The card:** 144×144 to the plate's left (x 316), top-aligned, with the figure in 1px ink hairlines at 0.8. Under it, in serif 14: "Its lowest note is 88 Hz."
  - **The dial:** a 560px hairline 24px under the plate, logarithmic from 30 Hz to 2.4 kHz.
    - The note is a 7px ink dot with "1,144 Hz" in grotesk 12 above it.
    - F is a 1px tick, 8px tall.
    - Resonances you have found become 5px hollow rings, which builds a map as you play.
    - While you bow, a hairline peak above the dot shows how hard the plate is moving.
  - **The status line:** serif 16/24 under the dial: "It sings a little."
- **Phone, 390×844.**
  - The heading is one line at y 96, with the card at 64×64 to its right.
  - The plate is 342×342 at x 24, y 150. The 24px bow band inside its edge then sits 24-48px from the screen's edge, clear of the browser's edge-swipe gesture. `touch-action: none` is set on the plate and the dial.
  - The dial runs full width at y 520, and the whole lower third is a scrub surface for the other thumb.
  - The status line is at y 570.

##### Hands and keys

- **Mouse.**
  - Drag the dial's dot. It scrubs: the further above the line the pointer goes, the finer it moves, down to a quarter speed at 80px above.
  - Click the line to jump.
  - Type digits and press Enter to set the note exactly (the board claims digits through `keys.ts` while it is open, §1.10).
  - Press and hold the edge band to bow, and slide along it to move the bow.
- **Touch:** the same, with two thumbs.
- **Keyboard.**
  - ←/→ move the note by 10 cents, Shift by a semitone, and Alt by 2 cents.
  - `[` and `]` walk the bow 1% round the perimeter, and Shift makes it 5%.
  - Hold Space to bow.
  - Esc goes back to the Today drawer (up one level).

##### Sound

- **The bowed plate** is a new sustained voice in `sfx`. There is none today: every cue is a buffer.
  - The API is `sfx.voice()`, returning `{ set(hz, gain), stop(over) }`.
  - It is a sine at the note, its octave at -18 dB, and a thread of noise through a band-pass at -30 dB for the bow hair, all through a 4 kHz lowpass.
  - The gain follows R(f): off resonance a thin -30 dB, and near one a swell to -12 dB with a slow 0.8 Hz shimmer between two partials. Near a resonance, it sings.
  - A 40ms attack, and a 250ms ring-out on letting go.
  - Above 1.5 kHz the level falls gently along an equal-loudness curve.
  - It is created only with sound on, and stopped by `sfx.set(false)` along with the rest (add it to the clean-up at `sfx.ts:1293-1302`).
- **Sand going over the edge:** the Projects tick on `sfx.train` (`sfx.ts:1326`) at gain 0.06 and rate 1.6. One tick per forty grains lost, never closer than 40ms apart: sand pattering off a table.
- **It holds:** `play("done", 0.5)`.
- **The bed through the wall, done politely.** On opening, Plate reads the bed's air with a new `sfx.airNow()` (`airHz` is private, `sfx.ts:46`), then calls `sfx.air(700, 0.6)`. On leaving, it restores the value it found, not `AIR_OPEN`. A kept Projects panel mid-supernova holds the wall shut (`ThreadScene.ts:3505`), and Plate must not open it under the floating covers.
- **A song left in Music.** It keeps playing through the walls (`sfx.ts:322-326`). Plate's first bow ends it over 0.8s with a new `sfx.hushSong(0.8)`, a one-line wrapper round `hush` (`sfx.ts:565`), because a tuning game and a muffled song cannot share a room.

##### What it says

| Moment | Line |
|---|---|
| Dial set, not bowing | "1,144 Hz. Hold the edge to hear it." |
| Off resonance | "Nothing moves at this note." |
| Near | "It sings a little." then "Closer." |
| Wrong resonance | "A figure, not this one. Some sand went over the edge." |
| Right note, wrong bow | "This note. Not this figure. Try another place along the edge." |
| Holds | "It holds." then "Held on the fourth bow, with 5,732 grains." |
| Under 1,500 grains | "Too little sand left to hold a figure. There is more tomorrow." The day ends and the entry reads "Bare." |

##### Share

```
Plate 9
Held on the fourth bow, with 5,732 grains.
dariustan.dev/today/plate/9
```

##### Record and archive

- **Stored:** `{ bows: [[hz, s0, s1, ms], ...], grains, held }`, where `s` is the bow's place round the perimeter. That is a few dozen numbers.
- **A thumbnail** (new): a 64×64 one-bit picture of the final sand (512 bytes) is kept in `result` for 120 days, and after that only the numbers. Redrawing a wall of sixty plates from their logs would take seconds.
- **The archive** is a wall of past plates at 96×96, the sand as you left it. The dense ones are the days you counted; the sparse ones cost sand.
- **The streak:** "Nine days held."

##### Accessibility

- **Reduced motion.**
  - Grains never jitter. While you bow, the plate shows the settled sand for that note and place: the simulation runs four seconds of plate time ahead, off screen, in about 30ms.
  - The new sand comes in through the ported Bayer order over 0.3s.
  - The "sings" state is the dial's still hairline peak.
- **Sound off.** Fully playable: the grains' agitation and the dial's peak show the resonance.
- **Colour.** Ink on grey glass only.
- **Screen readers.**
  - A live region reads the note, whether the sand is moving, and the share of grains on the figure: "Six in ten on the figure."
  - The card is described by its line counts: "Two curved lines one way, three the other, and one long diagonal."
  - With that and the sound, the arithmetic route works without sight.

##### Where it hooks in

- **New:**
  - `src/games/plate/rules.ts`: the modes, the response and the generator. It is pure.
  - `src/games/plate/sand.ts`: the deterministic simulation. It is pure, and imported by the script.
  - `src/games/plate/Board.tsx`: a 2D canvas written through a `Uint32Array` view of `ImageData`.
  - `src/games/plate/share.ts`.
  - In `sfx.ts`: `voice`, `airNow` and `hushSong`.
- **Reuses:**
  - `seedFor`.
  - The mote levels and `levelColor` (`Motes.ts:18-22`, `:88`).
  - The faint-pixel reasoning of `Between.tsx:27-46` (levels that survive 8 bits), for the lightest grains.
  - `sfx.train`, `play("done")` and `sfx.air`.
  - The `--glass-bg` and `--r` tokens.
  - `onShown`, for pausing.
- **Performance:**
  - The field table (Φ and its gradient on 128×128, from cosine tables) is under 1ms per rebuild.
  - A grain step takes about 0.25ms, and drawing about 1.5ms: about 3ms a frame on a mid phone.
  - About 12 KB of gzipped JS.
  - **No frames at all when you are not bowing**, because sand does not move by itself.

##### Edge cases

- **Phone:** the plate sits clear of the edge swipe, the Q ladder is forgiving, and you can scrub or type.
- **Reduced motion:** settled sand, as above.
- **Sound off:** fully playable.
- **Night hours:** not involved.
- **Returning visitor:** the bow log replays the plate exactly as it was left.

**Effort:** M+:

- the model and the sand, one day;
- the board, bow and dial, a day and a half;
- the voice and the wall, half a day;
- the generator and its checks, one day;
- then two or three days of tuning with the debug panel.

Plan on a week and a half. B's "four days" leaves out the tuning.

**What it shows:** he can model a physical system, simulate it and make it sound right. He knows where the maths is hiding (m² + n²) and leaves it there for people who notice. This is the one a creative-technology reviewer will remember.

**Risks:**

- **The simplified model:** hence the footnote.
- **Brute-force sweeping.** It works, but it costs sand and bows, which is the point.
- **Tuning time.** It is the reason Plate comes fourth, once the frame has earned it.

---

#### 6. Last login (from A) · a weekly, on Saturdays

**Pitch.** One day of logins for a small team. Someone else was in there. Find their lines.

##### Cadence and place (changed)

- **One incident a week.** It appears on the shelf on Saturdays as a fourth entry ("Saturday's incident.") and stays open all week in the archive.
- **Why not daily.** A good incident takes about an hour to write and check, and A's own risk list admits that generated clues read mechanically.
- **Written by hand first.** Thirty incidents, which is thirty weeks, each checked by A's solver. The generator (world, attacks, clue selection, grading) is year-two work. "By hand" means curated, not generated: a branch drafts each incident from the pattern catalogue, the solver proves it, and he approves it in a few minutes. His own hours are not spent writing them.
- **The Security drawer.** It exists (the Desk's third drawer), and it lists Plaintext and Last login's casebook under "to play" (summary, reconciliation 1). Its "Casebook" row links here.

##### Rules

1. **The log.** You get the day's log: ten to sixteen lines, each with a time, an account, where it came from, a device, a result (ok or failed) and what it did.
2. **The notes.** You also get the notes: five to nine short facts about the team and the intruder.
3. **Oddities.** A line is the intruder's if it cannot have been its owner's. Three things on an owner's line need explaining:
   - a login at night, which is one till seven;
   - a login from away, meaning anywhere but the office or home;
   - a failed try.

   If no note explains an oddity, that line is not its owner's.

   This rule is on the page every week, in one line: "Night is one till seven. Away is anywhere but the office or home. All times are office time."
4. **Close the incident.** Mark the lines you think are theirs, then choose "Close the incident". While you work you can strike lines through as explained.
5. **Three reports.** After the third, the incident closes itself and shows what happened.

##### The cast (new)

- **Ana, Ben, Cleo and Dev**: A's names, which already run A, B, C, D, as textbook examples do.
- **Eve** is also on the team. She is never the one. The casebook says so: "Eve is on the team. She has never once been the one." Security readers will smile.
- Names never read like real colleagues. There are no surnames.

##### A week, worked: week 3

Head: grotesk "Last login", then serif "Wed 7 Oct 18:05 from office. Someone else was here today." The date is the incident's own.

```
01  02:40  dev   home    linux  ok      sudo
02  07:52  ana   office  mac    ok      mail
03  08:30  ben   Lisbon  mac    ok      mail
04  08:58  cleo  office  mac    failed
05  08:59  cleo  office  mac    ok      repo
06  09:00  cleo  office  mac    ok      export
07  09:16  cleo  Porto   phone  ok      mail
08  12:58  ana   office  mac    failed
09  12:59  ana   office  mac    ok      repo
10  13:05  ana   office  mac    ok      export
11  16:40  ben   Lisbon  phone  ok      mail
12  16:41  ben   Lisbon  phone  ok      export
13  18:05  dev   office  linux  ok      deploy
```

The notes:

1. Every line of theirs is under one name.
2. Dev was on call last night.
3. Ben is at a conference in Lisbon all week.
4. Ana changed her password on Monday and keeps getting it wrong.
5. Cleo flew home from Porto this morning.
6. Nobody gets from the office to anywhere else in under an hour.
7. Cleo read her mail before she boarded.

One way through it:

1. **Explain what can be explained.** Strike each through:
   - line 01, at night, by note 2;
   - lines 03, 11 and 12, away, by note 3;
   - line 08, failed, by note 4;
   - line 07, away, by note 5.
2. **Two places at once.** Cleo is in the office from 08:58 to 09:00 and in Porto at 09:16. By note 6, sixteen minutes cannot cover that, so one side is not Cleo.
3. **Which side.** By note 7 the Porto mail line (07) is hers, so the office lines, 04, 05 and 06, are not.
4. **Nobody else.** By note 1, nothing under any other name is theirs.

**Answer: 04, 05, 06.**

The reveal, in serif: "Impossible travel. Cleo's password, used from a desk in her own office while she was still in Porto. The failed try first: whoever it was nearly knew it. Real systems flag this the same way: two places, too little time."

The normal-looking lines are the guilty ones, and every odd-looking line is innocent. That inversion is the game.

**Checked.** A brute force over all 8,191 non-empty sets of lines (A's `login2.mjs`, re-run) finds the answer unique, and shows that every note is needed:

| Note removed | What happens |
|---|---|
| 2, 3, 4 or 5 | No consistent answer, because a red herring can no longer be explained. |
| 6 | Four answers. |
| 7 | Five answers. |
| 1 | 512 answers. |

##### How each incident is made

- **By hand, from a catalogue of real patterns.** Each carries its MITRE ATT&CK ID in the casebook (new):

  | Pattern | ID |
  |---|---|
  | Impossible travel, on stolen credentials | T1078 Valid Accounts |
  | Password spraying | T1110.003 |
  | Credential stuffing | T1110.004 |
  | MFA fatigue (a run of "push denied", then "push approved") | T1621 |
  | Privilege escalation (a login, then `sudo`, from an account that never uses it) | T1548.003 |
  | Session replay | T1550.004 |
  | Lateral movement (two accounts, the second reached from the first's desk within minutes) | T1021 |

- **Red herrings** are legitimate oddities the notes explain: travel, on call, a new password, a new phone.
- **Validated** by `src/games/login/solve.ts`, the brute force over sets of lines. It proves:
  - that the answer is unique;
  - that every note is needed (the table above);
  - that the rule line alone is enough.
- **The difficulty** follows A's grader, applied by hand:

  | Week | Lines | Herrings | Suppositions | Other |
  |---|---|---|---|---|
  | Early | 8-10 | 2 | none | |
  | Middle | 13 | 4 | none | like the example |
  | Late | 14-16 | 5 | one | two names; raw IPs replace place names, with a short "where these are" note ("10.0.x.x is the office"); user agents replace devices (`curl/8.4`, with "Only the build server speaks curl.") |

##### How it looks

- **The log** is a real `<table>` in the site's monospace at 12px/2. *Ruled in the summary: monospace where alignment carries meaning, logs included, from Plaintext on; Last login ships after Plaintext. This review first set it in grotesk 500 with tabular numbers.*
  - There are no borders. Rows are separated by 8px, and each row is one button at least 32px tall.
  - Marked "theirs": a 1px ink rule down the left edge, and "theirs" in the last column.
  - "Explained": struck through at 60% ink, the summary's floor for meaningful text (this review first set 35%, which is 2.9:1). The strike carries the state.
- **The notes** are serif 16px in a list, and each can be struck through as used.
  - On desktop (1024px and up), the log sits on the left at 560px and the notes on the right at 320px, 8px apart.
  - On a phone, the notes come first, collapsed to their first line until tapped, then the log, one line per row. `04 08:58 cleo office mac failed` is about 205px of grotesk at 12px, and about 225px in a monospace at 12px, where each of its 31 characters is about 0.6em wide. Late weeks wrap each row to two lines.
- **"Close the incident"** is a glass chip in grotesk 12px, like a tab pill.

##### Hands and keys

- Tap a row to cycle it: none, theirs, explained, none.
- Keyboard:
  - ↑/↓ move between rows;
  - M marks theirs, X marks explained, and 0 clears;
  - Enter closes the incident;
  - Esc goes back to the Today drawer (up one level).

##### Sound

- Marking plays `tick`.
- Explaining plays `close` at 0.3.
- A report that closes it plays `done`.
- A report that does not plays `focus`, a low, soft sound, never a buzz.

##### Feedback and failure

- A wrong report gives counts, not lines: "Not quite. Two of your lines are theirs. One is Cleo's own."
- After the third, it says "Here is what happened.", marks the answer, and walks through the solution, one note to each step.

##### Share

```
Last login, week 3
Thirteen lines. Closed on the first report.
dariustan.dev/today/login/3
```

The pattern is left out on purpose: naming it gives the game away.

##### The casebook

Each pattern you have met gets two sentences in his voice and its ID, so the collection doubles as a small glossary of attacks. The sentences are drafted for his approval, as below:

- *Impossible travel* (T1078): "Two places, too little time between them."
- *Password spraying* (T1110.003): "One password tried against every account, quietly, from one place."
- *MFA fatigue* (T1621): "Push after push until somebody says yes to make it stop."

The record reads, for example: "Closed on the first report nine times. Spraying fools you."

##### Accessibility

- A real table with `th scope="col"`. Rows are toggle buttons, with `aria-pressed` and `aria-describedby` giving their state.
- The notes are a list, and results go to a live region.
- The time conflicts are all in the text, so nothing depends on sight or colour.

##### Edge cases

- **Phone:** as above.
- **Reduced motion:** strikes appear without being drawn.
- **Sound off:** silent.
- **Night hours:** the game borrows the definition of night from `hoursOf` (`hours.ts:15-19`), not Urchi.
- **Returning visitor:** marks and strikes are kept in `state`.

**Effort:** M, three days for the board and the solver, plus thirty incidents at about an hour each of a branch's time, and a few minutes each of his to approve them.

**What it shows:** how someone in security thinks. Anomalies are weighed against their explanations, harmless oddities have a base rate, and the dangerous line usually looks ordinary.

**Risks:**

- **Fairness:** hence the rule line every week.
- **Clues that sound mechanical:** hence writing them by hand.
- **Time zones:** "All times are office time."

**Why it fits:** "Someone else was here today." is exactly the understated sentence the site would use for an incident.

---

#### 7. Order and calendar

| When | What | Size |
|---|---|---|
| 29 Sep - 9 Oct | §0 prerequisites and the §1 frame: the digits with 3 reserved in week 1, the Desk frame and the Today drawer in week 2, and Same Grey's 400 days frozen and validated | M |
| **Mon 12 Oct** | **Same Grey No. 1**, at his midnight (13:00 UTC on Sunday 11 October). The head reads "One small thing, new at midnight here." If the frozen days fail their checks, it moves to Monday 19 October. | S |
| October | A branch chooses and marks up Stet's forty public-domain passages (`npm run passage`); build Stet | M + a branch's markup |
| **Mon 2 Nov** | He approves the forty passages, in one sitting of about an hour | |
| **Mon 9 Nov** | **Stet No. 1**, after Same Grey's four weeks of archive | |
| 2-15 Nov, then 30 Nov-6 Dec | Build Plaintext's tools; "The name" is written, and three public-domain letters are drafted for approval. The launch weeks (16-29 November) are left free. | L |
| **Mon 7 Dec** | **Plaintext, week 1: "The name"**, with the monospace, after Stet's four weeks of archive | |
| From Monday 4 January 2027, by the counts | Plate, then Last login's first Saturday, or the other way round if the security pages need something playable first | M+ · M |

**The rule:** no new game until the last one has four weeks of archive and the counts show returning players. "The counts show returning players" means finishes with a streak of two or more (`game_finished`'s `streak` of `"2-6"` or `"7+"`) on most days of the previous game's fourth week. If they do not, the next game waits a week at a time (`decisions.md`, Daily games 4). Three games done well is the ceiling for year one, and the Saturday incident is a weekly, not a fourth daily.

**The launch.** The launch gate in the week of 23 November asks for "one game with four weeks of archive". That is Same Grey, whose No. 1 is six weeks earlier. Security at launch is carried by the headers, `/kept`, three papers and Phosphenes, not by Plaintext.

These dates follow `decisions.md` (Daily games 4). They move Stet a week and Plaintext two weeks later than the summary's roadmap (weeks 3, 6 and 9), which broke the summary's own four-week rule. All of them fall on Mondays.

#### 8. Parked, with what to keep

- **Held (B).**
  - A good instrument for Tools: "a tuner you can see", with one figure and two senses.
  - Keep B's notes for when it is built:
    - a per-kind pluck point (`PLUCK_AT`, `sfx.ts:1054`, used at `:1089`) set to 0.13, so the fourth partial is not 0.03 of the fundamental;
    - `sfx.pluckPair(hz1, hz2)`, since `ringing` holds one pluck (`sfx.ts:1074`) and each pluck damps the last (`sfx.ts:1444`);
    - `StereoPannerNode`s at ±0.3;
    - `detune` in cents, smoothed over 20ms.
- **Overhead (B).** Revisit once the Tools proposal's "That night" ships the Yale Bright Star Catalogue. Its data, B−V colours and star sprites are the hard half. Draw his own 88 stick figures rather than licensing a set.
- **Eight Lamps (A).** The spare game that needs no writing, if Same Grey is ever retired. The par DP and the rejection figures are already done (`scratchpad/daily/lamps3.mjs`).
- **Timing Attack (A).** Cut, not parked. It was a poor daily, and as a toy for the security pages it would ask the visitor to exploit a timing leak, which the site's security work, defensive only, never does. Constant-time comparison can be a paragraph in a paper instead, if his own code ever needs one.

---

### Decisions

*The owner is asked nothing. The five questions this section first put to him are decided in `decisions.md` ("By section", Daily games 1-5), and what else it depended on is decided there under "The eight". Each line gives the decision and its reason, and what would change it.*

1. **Where the games live.** Today is the first drawer of the Desk, the sixth pill placed third (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6), with puzzles at paths such as `/today/stet/6`. *Why:* one pill holds games, tools and papers, and renumbering is free only until the digits work. *Changes if:* all three drawers are cut (`decisions.md`, item 4 and Daily games 1; the summary's IA ruling).
2. **Where "here" is.** `TIME_ZONE = "Australia/Melbourne"`, `HEMISPHERE = "south"`. Every puzzle turns over at his midnight, falling back to UTC and never to the visitor's day. The head says "It is already Friday here." when his date is ahead of the visitor's, and "It is still Thursday here." when it is behind. *Why:* his commits carry +10:00 and his public coursework is a Swinburne unit, and one zone gives one "No. 12" for everyone. *Changes if:* he moves city (`decisions.md`, item 1 and Daily games 2).
3. **The public repository, and the banks.** The repository is public, so every frozen puzzle, Same Grey included, lives in a private bank fetched at build by `scripts/fetch-today.mjs` (`TODAY_TOKEN`, `TODAY_REPO`), the seed root is the secret `TODAY_SALT`, and the bank is kept off the thread through `SYNC_EXCLUDE` and never named. *Why:* nothing in the public repository may hold a puzzle's answer. *Changes if:* the build cannot reach GitHub reliably; the files then go into a Vercel Blob read only on the server (`decisions.md`, Daily games 3).
4. **Stet's supply, and the order of the games.** Stet launches on forty public-domain passages, marked up by a branch and approved by him in one sitting by Monday 2 November, with ten more a month and any note he lends. Same Grey No. 1 is Monday 12 October, Stet No. 1 Monday 9 November, and Plaintext's week 1 Monday 7 December. *Why:* public-domain prose costs him an hour instead of forty paragraphs, and the dates keep the summary's four-weeks-of-archive rule. *Changes if:* he writes Stet paragraphs anyway (they go first), or fewer than forty are approved by 2 November (Stet slips a week at a time) (`decisions.md`, Daily games 4).
5. **Counting a finished game.** Yes: Umami, cookieless and proxied same-origin under `/u/`, one event, `game_finished { game, n, streak: "1" | "2-6" | "7+" }`, nothing under Do Not Track or Global Privacy Control, and disclosed on `/kept`. *Why:* the streak bucket answers "does anyone come back" without an identifier, and Vercel's custom events need Pro. *Changes if:* Umami's free tier ends (self-hosted Umami behind the same `/u/`), or he is on Vercel Pro and prefers its events under the same name (`decisions.md`, item 7 and Daily games 5).
6. **The host the shares print.** `SITE_URL` comes from `NEXT_PUBLIC_SITE_URL`, the Vercel production URL until `dariustan.dev` is bought and live, and a production build fails while it is unset or `.example`. *Why:* every share and card prints it, and a printed CV cannot be relinked. *Changes if:* he already owns a domain, or none of the four candidates is free (`decisions.md`, item 2).
7. **Urchi and the daily.** Urchi never announces the day's puzzle and never comes to the Desk; it looks up at the Desk pill once only when a new game lands (`UPDATED.desk`). *Why:* a daily look would mean nothing, and the games stay Urchi-free (summary, reconciliation 4).
8. **The monospace.** Commit Mono 400, subset to ASCII, arrives with Plaintext on Monday 7 December and sets its ciphertext and hex, and later Last login's log. *Why:* alignment carries meaning there, and nowhere else yet. *Changes if:* it smears at 11px in troika; then JetBrains Mono (`decisions.md`, Style and UX 2).
9. **The tooling.** The shared `src/lib/random.ts`, `day.ts` and `store.ts`; Vitest as the one runner, with `npm run today` under `tsx`. *Why:* the summary's shared foundations and testing rule; one alias-aware runner for games, finds and tools.
10. **Timing Attack.** Cut, not handed to Security. *Why:* security here is defensive only, and it would ask the visitor to exploit a timing leak.

### If you only do one thing here

Build the frame and put Same Grey on it:

- the Desk's pill, third in the row, with Today as its first drawer;
- the day in your own zone, Melbourne's;
- puzzles made ahead, frozen, and served only on their day;
- one record per game;
- plain-text shares with a preview image.

Then launch on a Monday (No. 1 at your midnight into Monday 12 October) and let it run a month before adding anything. It is about a week of work. It needs no writing and no WebGL, and it is the site's own thesis as a game: the eye inventing greys, on a site named for the grey the eye invents. Everything after it is cheaper because it exists: Stet, Plaintext, Plate and the Saturday incident all plug into the same day, seed, store, share and shelf. During that month a branch marks up Stet's forty public-domain passages, and you approve them in one sitting by 2 November; that bank, and the notes you lend it, are the difference between a clever page and a place people come back to.
