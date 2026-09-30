## State of the project and engineering

Reviewed against `9b8c07c` on 29 September 2026. The repo was only read, never changed.

**What I re-checked myself:**
- `npm run lint` and `npm run typecheck`. Both are clean, with no output.
- Every file and line the proposal cites.
- The CSP report-only probe in the scratchpad (`csp-probe.mjs`), re-run against the dev server.
- `curl -sI /`.
- `click.wav`, decoded to measure its length and tail.
- Next 16's own bundled docs (`node_modules/next/dist/docs`) and its fetch patch (`node_modules/next/dist/server/lib/patch-fetch.js`), for the claims about caching, `proxy.ts` and SRI.

The measurements in the proposal (`probe2-dev.json`) are consistent with what I saw.

### Review verdicts

| Idea | Verdict | Why |
|---|---|---|
| Issue 1 + A1: the WebGL fallback ("Lights off") and error pages | KEEP WITH CHANGES | A real blocker, and reproduced (`shots-nogl/nogl-space.png`). But the planned `src/app/error.tsx` would not catch it. The panels render inside `Shell`, and `Shell` sits in the root layout, above the segment boundary. The fix needs a per-panel error boundary. Urchi itself is a Canvas 2D character: `urchi/index.html` has no WebGL at all. So the fallback can keep it alive, not show a PNG. |
| Issue 2: `SITE_URL` | KEEP WITH CHANGES | Right. Read it from `NEXT_PUBLIC_SITE_URL`, which is the Vercel production URL until the domain exists. A production build should throw if it is unset or still `.example`, never fall back to `localhost`. |
| Issue 3: `TIME_ZONE` | KEEP | Minutes of work: `"Australia/Melbourne"`, with a new `HEMISPHERE = "south"`. The day boundary for daily games depends on it as well. |
| Issue 4: headers and CSP | KEEP WITH CHANGES | Right, and it is the brief: a security showcase with no headers. Drop `preload` from HSTS for now. Write `microphone=()`: deny by default, and grant a feature only in the same commit as the first thing that uses it. The summary's ruling fixes the final policy: Report-Only first, then nonces, and only the nonce policy is ever enforced. The re-run probe confirms the site needs `worker-src blob:` (troika), `img-src data:` (the live favicon) and inline style attributes. |
| Issue 5: sign `/api/preview` | KEEP WITH CHANGES | Medium, not High: Vercel's outbound IPs are shared with other sites anyway. `redirect: "error"` could silence real previews. Instead, follow a redirect by hand and check its host again. Skip the check in dev when there is no secret. |
| Issue 6: harden `/api/cover` | KEEP WITH CHANGES | The fixes are right but the references are wrong. The route is 50 lines, not 64-104. A junk hash costs four fetches, not five. |
| Issue 7: `/api/now` | KEEP WITH CHANGES | All four points hold. Add a server timestamp so a CDN-cached `elapsed` can be corrected. `fetchNow` (`src/lib/now.ts:55-75`) rebuilds the answer and would drop an `ok` flag. |
| Issue 8: tests and CI | KEEP WITH CHANGES | Needed. Phase it, starting with a day-one kit. The repo is public, so Actions minutes are free. Branch protection is decided: a ruleset on `main` that blocks only force-pushes and deletion, so `npm run note` still pushes straight to `main` (`decisions.md`, Engineering 4). |
| Issue 9: search and sharing | KEEP WITH CHANGES | Right. `next/og` (satori) cannot read WOFF2, so use `public/fonts/serif-300.woff`. The notes mirror stays `sr-only`, as Projects' does. How the cards look belongs to Style and UX R1 (F-H6), with `WORK_LINE` as the card's line (summary, reconciliation 10). |
| Issue 10: battery and heat | KEEP WITH CHANGES | Measure on real hardware first. Do not cap the pixel ratio at 2: `RoomScene.ts:28` allows 3 deliberately, so art pixels land on whole device pixels. The governor must go back to full rate on every saccade, blink and act, because the Urchi realism work adds more micro-motion, not less. |
| Issue 11: hot-spot files | KEEP WITH CHANGES | Extract `Space.ts` before finds. Pull ThreadScene's layout out after the GitHub-projects branch, never beside it. That branch has since merged (`0d9641d`); the week-1 months branch owns `ThreadScene.ts` next, and the layout extraction follows in week 7 (`decisions.md`, Engineering 5). |
| Issue 12: `store.ts` | KEEP | Small, and needed before streaks and pockets exist. |
| Issue 13: two sources of truth for Urchi | KEEP WITH CHANGES | Declare `character.ts` canonical and have `build-mascot` write `mesh.json`. A generated standalone page is optional. |
| Issue 14: the digits are not keys | KEEP (merged) | Same as Style and UX R3 (F-H2) and strategy's key table. Engineering supplies `keys.ts`. The numbering is decided: Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6. |
| Issue 15: Projects loads every still up front | KEEP WITH CHANGES | Real, but schedule it with the GitHub data. |
| Issue 16: asset weight | KEEP WITH CHANGES | `click.wav` is a deliberate 2.4 s stereo tail, still audible 48 dB down, so trimming changes the sound. Encode it instead, and skip the decoder's lead-in. |
| Issue 17: correctness nits | KEEP WITH CHANGES | All confirmed. Added one: `projectsLine` uses `numberWord`, which stops at twelve. With the real repositories (four public, eight closed, plus eigengrau and Urchi) it will print "14 projects since 2026." |
| Issue 18: links | KEEP WITH CHANGES | The two TODOs are settled: GitHub is `github.com/dctxv`, and the email is `dctxvv@gmail.com`, the address his own commits carry (`decisions.md`, item 2). Delete both `TODO(darius)` comments. Cut the email obfuscation: About already copies the address on tap, and the no-JS mirror needs it. |
| 4.1: one sixth tab that routes, not three | KEEP WITH CHANGES | The right call, but keying every tab by prefix would swallow `/projects/[slug]` into the Projects panel. Tabs must opt in (`owns`), as Strategy §5.5 proposes. Where it sits and what it is called are decided: "Desk", the third pill. |
| 4.2: `random.ts` | KEEP | Two copies of mulberry32, confirmed (`Between.tsx:104`, `sky/tune.ts:88`). |
| 4.2: `day.ts` | KEEP WITH CHANGES | Conflicts with both games proposals on the day boundary. Ruled in the summary: his zone (one day for everyone), falling back to UTC, never the visitor's, with numbering per game. `notes.ts` `localDay` is a different idea and keeps the visitor's day. |
| 4.2: `store.ts`, `keys.ts` | KEEP | Foundations. |
| 4.3: runway for daily games | KEEP WITH CHANGES | Solid. The golden 365-day snapshot is its best idea, and the summary's ruling takes it further: puzzles are made ahead, frozen, and served only on their day. The OG route needs one global day. |
| 4.4: runway for tools | KEEP WITH CHANGES | The "nothing leaves the page" test must allow same-origin chunk loads, and must also ban `sendBeacon` and image beacons. Check `new Worker(new URL(...))` under Turbopack. |
| 4.5: runway for the security section | KEEP WITH CHANGES | A `srcdoc` iframe inherits the parent page's CSP. Demos need a route with its own header, framed with `sandbox="allow-scripts"` and no `allow-same-origin`. |
| 4.6: runway for Urchi's finds | KEEP WITH CHANGES | `SkyLayer` is the wrong seam: it is static, uniforms-only and never pixelated. The find belongs in Urchi's plane, as Motes do (`Motes.ts:135-140`), with a new `TargetKind` and Float's existing reach and swim. |
| 4.7: runway for real GitHub projects | KEEP WITH CHANGES | The build-time sync is right. Curation and look belong to Strategy §1 and §3. Time it around the branch then in flight, which has since merged (`0d9641d`). |
| 4.8: refactor order | KEEP WITH CHANGES | Reordered around the in-flight branch. |
| 4.9: testing strategy | KEEP WITH CHANGES | Screenshot baselines of a living, randomised creature are brittle. Keep them few and lean on golden numbers. |
| 4.10: CI | KEEP WITH CHANGES | As issue 8. Also: make the Vercel build run the unit tests, so a red test blocks a deploy even without Actions. |
| 4.11: analytics and the error beacon | KEEP WITH CHANGES | Vercel Web Analytics custom events need Pro. Decided: Umami, cookieless and proxied same-origin, with three named events only (`decisions.md`, item 7). Errors and web vitals go through the beacon. Cut Sentry for now. |
| A2: "The site, examined" | KEEP WITH CHANGES | Duplicates the security draft's 2.8, "How this site is kept". Merge them into `/kept` (Strategy §6.1): engineering supplies the live readout and the build provenance. |
| A3: "The log writes itself" | KEEP WITH CHANGES | A good fit, since `kind: "log"` already exists (`site.ts:221`). Make it owner-approved from a local script, not an Action that commits on its own. Decided: keep is the default at the prompt, one keypress a line, once a week (`decisions.md`, Style and UX 5). |
| NEW: house rules for the builders (`CLAUDE.md`) | ADD | Parallel Claude branches build the site, and the only written invariants are spread through a very long README. This is the cheapest control on drift there is. |
| Launch checklist; Appendix B, the measurements | KEEP WITH CHANGES | Updated below. |

**Corrections found while checking:**
- **`/api/cover` references.** The proposal cites lines 64-104, 80-89, 83, 95-100 and 97. The file (`src/app/api/cover/[id]/route.ts`) is 50 lines long. The real places are:
  - `image()`, which passes the upstream type through: 9-15;
  - the store fetch: 28;
  - the CDN loop: 40-45;
  - the silent catches: 30 and 46.

  `exts` de-duplicates to `png, jpg, webp, gif`, so a junk hash costs **four** fetches, not five.
- **Upstream calls in a `force-dynamic` route.** Next's docs say `force-dynamic` behaves like `fetchCache = 'force-no-store'`, which would mean nothing in `/api/now` is cached. The code says otherwise: `patch-fetch.js:398` drops caching only for fetches with no explicit option. `call()` passes `next: { revalidate }` (`now/route.ts:75`), so the proposal's claim holds. Leave a comment in the route saying so, because the docs suggest the opposite.
- **Tailwind is doing more than tokens.** It supplies the preflight reset and `sr-only`, which is used ten times and is not defined in `globals.css`. Dropping it is not free.
- **Storage.** There are five `localStorage` keys, as stated, plus one in `sessionStorage`: `eigengrau:tones` (`src/lib/tone.ts:186`).
- **`RoomScene`'s pixel ratio of 3 is deliberate.** The comment at `RoomScene.ts:24-27` says so: the phone's canvas is not stretched, so the pixel look stays exact.
- **A prefix `tabOf` already exists.** It is at `src/audio/sfx.ts:497-499` and treats a case page as part of Projects. The new code should reuse it, not write a second one.
- **Heap.** Across the four laps it grew by 0.27 MB a lap (16.0 → 16.8 MB). That is probably GC noise, not "flat". The nightly lap test is what decides.
- **The "GPU stall due to ReadPixels" warning** most likely comes from the favicon painter's one-off `getImageData` (`LiveIcon.tsx:124`) on a canvas made without `willReadFrequently`. Space's own read-back, `pixelFinish` (`character.ts:1297`), runs only in pixel mode, on a canvas that has it. Low priority.
- **SRI.** The option is real: Next's bundled guide offers experimental SRI with static pages (`content-security-policy.md:456`). But it is experimental. Verify it in report-only mode before relying on it.

### Refined proposal

In priority order. Effort: **S** is up to a day, **M** is 2-4 days, **L** is 1-2 weeks.

---

#### 0. The state, in one page

eigengrau is careful front-end work done at sprint pace: 136 commits in five days, about 25k lines of strict TypeScript, and six runtime dependencies. Lint and typecheck are clean, and `npm audit --omit=dev` is clean. At the small scale it is better engineered than most production code:
- every scene has a `dispose()`;
- every storage access is guarded;
- hidden tabs really stop drawing (measured: 0 draw calls a second on Notes, with three WebGL tabs mounted behind it);
- the heap is close to flat across laps of the tabs;
- the proxies pin their upstream hosts.

What it lacks is the scaffolding a public site needs:
- no tests, and no CI;
- no error boundary of any kind;
- no fallback when WebGL is missing (the whole app falls over; reproduced);
- no security headers;
- no sitemap, robots file or share images;
- a placeholder `SITE_URL` and an unset `TIME_ZONE`;
- no written house rules for the Claude branches that build it.

A few files have become the place where every new feature would land and collide:
- `ThreadScene.ts`, 5,291 lines;
- one 680-line effect in `CreativeSpacePanel.tsx` (158-840);
- `globals.css`, 1,486 lines.

**Put plainly:** it is two or three focused days from a soft launch. It is about a week of foundations from being ready to take daily games, tools, a security section and Urchi's finds without the new work bending what is already there.

**Strengths, confirmed:**
- **Clean gates.** ESLint (next core-web-vitals + typescript) and `tsc --noEmit` under `strict` both pass silently. Dependencies are current: next 16.3.6, react 19.2.8, three 0.186.
- **An honest lifecycle.**
  - `RoomScene` checks `paused` in its ticker (`src/engine/space/RoomScene.ts:182-185`).
  - Space sets it from `onShown` (`src/components/pages/CreativeSpacePanel.tsx:769-786`).
  - Measured: sitting on Notes or Music after visiting every tab costs **0 draw calls a second and about 4 ms of script a second**, with four WebGL contexts alive behind it.
- **Code splitting where it matters.**
  - Notes and Music never download three.js or troika.
  - `suit.json` (142 KB raw, about 30 KB over the wire) loads only when the suit is first wanted (`character.ts:99`).
  - The audio loads only once sound is on (`src/audio/sfx.ts:1243-1263`).
  - The favicon painter is imported after `load` (`src/components/chrome/LiveIcon.tsx:50-57`).
- **Proxies built with a threat model.**
  - An https allow-list (`src/app/api/songs.ts:26-28, 111-119`).
  - `MAX_PARAM`.
  - Every store search has a timeout joined to the visitor's abort (`songs.ts:122-132`).
  - A confident miss is cached for an hour; a failure is not (`preview/route.ts:12-13, 33-34, 51-54`).
  - The Last.fm key never leaves the server.
- **Accessibility intent.**
  - `sr-only` mirrors, in the canvas's own order (`src/app/projects/page.tsx`).
  - A live region.
  - Urchi is a real `<button>`, and the zoom is a real range input.
  - Hidden panels are `inert`.
  - Reduced motion is honoured in every scene.
- **Knobs that make tests possible.** `?still`, `?hour=`, `?sky=`, `?col=` and `?debug=1`. The debug panel and `/dev/suit` are compiled out of production (`CreativeSpacePanel.tsx:206`, `src/app/dev/suit/page.tsx:8`).
- **A README that really is a living spec,** and commit subjects good enough to publish (section 11.2).

**Issues, ranked (severities revised):**

| # | Severity | Issue | Evidence | Effort | Section |
|---|---|---|---|---|---|
| 1 | Blocker | No WebGL takes the whole app down, and no boundary exists that could catch it | `src/engine/common/loader.ts:108`; `Shell.tsx:219`; reproduced | S-M | 1.1 |
| 2 | Blocker | `SITE_URL` is `https://eigengrau.example` | `src/content/site.ts:10`, `src/app/layout.tsx:7-32` | S | 1.2 |
| 3 | High | `TIME_ZONE` is null: Urchi keeps the visitor's hours, and the server reads the week in UTC | `site.ts:16`, `src/engine/urchi/hours.ts:35`, `src/app/api/now/fact.ts:70-71` | S | 1.2 |
| 4 | High | No security headers or CSP, on a site meant to show security skills | `next.config.ts:3-8`; `curl -sI /` | S (M for nonces) | 3.1 |
| 5 | High | No written rules for the parallel Claude branches | no `CLAUDE.md` | S | 2 |
| 6 | Medium | `/api/preview` previews any song for anyone | `preview/route.ts:27-50` | S | 3.2 |
| 7 | Medium | `/api/cover` passes the upstream type through, follows redirects, has no timeouts and does not cache its 404s | `cover/[id]/route.ts:9-15, 28, 40-45` | S | 3.2 |
| 8 | Medium | `/api/now`: no upstream timeout, no CDN cache, an outage looks like a quiet week, and two pollers run | `now/route.ts:8, 73-78, 231-234`; `CreativeSpacePanel.tsx:479`; `MusicPanel.tsx:1000` | S | 3.2 |
| 9 | Medium | No tests, no CI, no `engines`, no Dependabot | no `.github/`, no test files | M, phased | 3.4 |
| 10 | Medium | Search and sharing: no sitemap, robots, OG images or canonical URLs; Notes text is not in the HTML | `Shell.tsx:19-23`, `src/app/notes/page.tsx:6-8` | S-M | 3.3 |
| 11 | Medium | Space paints on the CPU and uploads nearly every frame at idle | `src/engine/urchi/Urchi.ts:70-71, 287` | M | 7.1 |
| 12 | Medium | Hot-spot files | see section 6 | M-L, incremental | 6 |
| 13 | Medium | localStorage has no versioned schema; one contract is duplicated; nothing syncs across tabs | `along.ts`, `sky/seed.ts`, `visits.ts:20-21`, `notes.ts:308-327` | S | 4.3 |
| 14 | Low | Urchi has two sources of truth | `urchi/index.html` (1 commit) vs `character.ts` (19 commits) | S | 10 |
| 15 | Low | The pills print 1-5, but no key does anything | `Tab.tsx:56`; no global `keydown` | S | 4.4 |
| 16 | Low | Projects waits for every still | `ThreadScene.ts:1370-1374` | M | 7.2 |
| 17 | Low | Asset weight | `public/audio`, `public/fonts` | S | 7.3 |
| 18 | Low | Correctness nits, including `projectsLine` | `Shell.tsx:72`, `layout.tsx:40`, `motion.ts:19-22`, `site.ts:212` | S | 9 |
| 19 | Low | Links still marked TODO | `site.ts:41, 43` | S | 1.2 |

---

#### 1. Launch blockers

##### 1.1 "Lights off": the site without WebGL, on purpose

**Pitch.** When a browser cannot draw in 3D, the site does not show an error page. It turns its lights off, and Urchi is still there, breathing.

**What happens today, verified.**
- `makeRenderer` (`src/engine/common/loader.ts:107-115`) calls `new THREE.WebGLRenderer(...)`, which throws when no context can be made.
- It is called from three constructors:
  - `new RoomScene` in the effect at `CreativeSpacePanel.tsx:158-168`;
  - `ProjectsPanel.tsx:37` onwards;
  - `new AboutScene` at `AboutPanel.tsx:25`.
- With `--disable-webgl`, `/`, `/projects` and `/about` show Next's error overlay: "A WebGL context could not be created. Reason: disabled by enterprise policy or commandline switch." (`scratchpad/shots-nogl/nogl-space.png`). In production that becomes the white "Application error".
- `/notes` survives, because it has no canvas.

**Why the proposal's fix was not enough.**
- `src/app/error.tsx` wraps the page segment, meaning `children`. The panels are rendered by `Shell`'s `<Stage>` (`Shell.tsx:219`), and `Shell` lives in the root layout (`layout.tsx:46`).
- An error thrown in a panel's effect therefore goes straight past `error.tsx` to `global-error.tsx`, which replaces the whole document: chrome, mirror and all.
- There is no error boundary anywhere in `src/`.

**Who hits it.**
- Corporate laptops with hardware acceleration disabled by policy (the exact reason Chrome printed above).
- VMs and remote desktops.
- GPUs on Chrome's blocklist.
- Chrome no longer quietly falls back to SwiftShader for WebGL.

These are the recruiters who open a portfolio at work.

**How it works, step by step.**

1. **A boundary round every panel.**
   - New `src/components/chrome/PanelBoundary.tsx`: a class component with `getDerivedStateFromError` and `componentDidCatch`.
   - `Shell.tsx:219` wraps `<Stage>` in it, keyed by the panel.
   - React routes errors thrown in effects to the nearest boundary, so one panel's failure no longer takes out the chrome, the other panels or the mirror.
   - The boundary renders the panel's `flat` view, reports to the beacon (section 8), and exposes `retry()`. `retry()` bumps a key suffix in Shell's `Panel` type (`Shell.tsx:26`), which remounts the panel.
2. **One place that knows whether the lights work.**
   - New `glState()` in `loader.ts` returns `"ok" | "soft" | "none"`.
   - It is set to `"none"` the first time `makeRenderer` throws, so the second and third panels go flat at once instead of each failing in turn. No test context is spent, which matters on iOS, where contexts are few.
   - `"soft"` comes from one attempt with `failIfMajorPerformanceCaveat: true` that fails where a plain attempt succeeds, meaning software GL.
   - `?flat` forces `"none"`, in the family of `?still` and `?hour=`, so the view can be visited and tested.
3. **Space, flat: a live Urchi in plain Canvas 2D.**
   - Urchi is painted by `character.ts`'s own 2D rasteriser. `Urchi.ts` only uploads that canvas as a texture. The standalone `urchi/index.html` has no WebGL at all (checked: `getContext('2d')` at line 226, and no THREE).
   - So the flat Space does this:
     - calls `createUrchi({ smooth: true, reducedMotion })` (`character.ts:703`; options at 508-523);
     - puts `urchi.canvas` in the stage;
     - sizes it with `setResolution(boxPx)` (`character.ts:590`), using the home sizing rule: the head at 48% of the window's height, never more than 45% of its width or 600 px;
     - drives `update(dt)` (`character.ts:551`) from `gsap.ticker`;
     - pauses it from `onShown`, exactly as `RoomScene.paused` is paused.
   - `input: true` (the default, `character.ts:516-517`) gives it its own pointer following. It breathes, blinks and watches.
   - At night (`clock().hours === "night"`) it calls `closeEyes()`, as the favicon does (`LiveIcon.tsx:92, 121`).
   - What it cannot do: float, tether, dither or show the sky. All of those need `RoomScene`.
4. **Projects, flat.**
   - The mirror in `src/app/projects/page.tsx` is already in the thread's order. The flat view is that same markup without `sr-only`, styled like the case pages: the title in serif, the status word in grotesk, the `why` line, and "Case" as a link.
   - `ProjectsPanel` renders it when `glState() === "none"`.
5. **About, flat.**
   - The statement in serif DOM, in the canvas's place.
   - The mark after "things." becomes a coarse-cell 2D Urchi, the same `cell` trick the About mark already uses (`character.ts:510-515`).
   - The `Elsewhere` links are already DOM (`AboutPanel.tsx`) and do not change.
6. **Context loss.**
   - Each canvas listens for `webglcontextlost` and calls `preventDefault()`.
   - On `webglcontextrestored` the boundary's `retry()` remounts the panel.
   - Three losses in one visit set `glState()` to `"none"` for the rest of it.
7. **Page errors that are not WebGL.**
   - `src/app/error.tsx` catches the pages of their own: the case pages, and later `/plainly`, `/kept`, `/colophon` and `/f/<code>`. The Desk's drawers (`/today`, `/tools`, `/security`) render inside the kept Desk panel, so its `PanelBoundary` catches them.
   - `src/app/global-error.tsx` catches Shell itself. It must render its own `<html>` and `<body>`.

**Looks, sounds, reads.**
- The same two colours, pills and monogram.
- **Space.** Urchi is at home at its usual size. In the space the zoom slider would take, one grotesk line: *"This browser keeps the lights off. It does not seem to mind."*
  - The hover caption is unchanged: "Urchi / It keeps the place while I am out."
  - A click gives a slow blink and, once per visit, *"It would go out, but the lights are off."*
  - At night: *"It is 3:12 here. It is asleep."*
- **Projects heading:** the usual `projectsLine()`, then one more sentence. With the placeholders it read *"Six projects since 2021. Two alive. Laid out flat for this browser."*; with the real projects it starts *"Fourteen projects since 2026."*
- **About:** the statement, unchanged.
- **Error page** (`error.tsx`, `global-error.tsx`):
  - *"Something came loose. It was not you."*
  - Two words underneath: **Again** (calls `reset()`) and **Back** (to `/`).
- Sound is unchanged. The cues are Web Audio, not WebGL.

**Where it lives.** Every canvas tab, automatically. `?flat` forces it.

**Data.** Nothing persisted. It is decided per load. `alongOn()` stays set: flat Space ignores it without clearing it, so a later load with the lights on still finds Urchi afloat.

**Implementation sketch.**
- New `PanelBoundary.tsx` (about 50 lines).
- New `glState()` and a `try/catch` inside `makeRenderer`.
- A `flat` branch at the top of each of the three panels' effects, before anything else is built.
- The flat Space: a new `src/engine/space/FlatRoom.ts` (about 80 lines) wrapping `createUrchi`.
- New `e2e/nowebgl.spec.ts` (section 3.4).

**Edge cases.**
- **Phone:** the same, with Space using the phone sizing rule.
- **Reduced motion:** the character's own `reducedMotion` option; no blink animation in the caption.
- **Sound off:** silent.
- **Night hours:** eyes shut; the asleep caption.
- **Returning visitor:** nothing new is stored.
- **Software GL (`"soft"`):** stays in 3D. It switches to flat for Space only if the first three seconds average under 20 fps (a new check in `RoomScene.frame`). The measured SwiftShader rate was 43.

**Effort.**
- S-M: about a day and a half, including the boundary, three flat views and the test.

**What it shows.** Someone who designs failure as carefully as success. A hiring manager on a locked-down laptop still meets Urchi.

**Risks.**
- **Two code paths for Space.** Keep the flat one tiny (no float, no sky) and under a CI test, so it cannot rot.
- **`createUrchi` outside `RoomScene`.** `LiveIcon` and `/dev/suit` already use it this way, so this is proven.

##### 1.2 The minutes: identity, zone and links

**`SITE_URL`** (`src/content/site.ts:10`) feeds `metadataBase` (`layout.tsx:8`) and every URL in the JSON-LD (`layout.tsx:22-32`). It is read only on the server today; nothing on the client imports it. It comes from one environment variable, `NEXT_PUBLIC_SITE_URL`. Until the domain exists that variable is the Vercel production URL; once `dariustan.dev` (or the first free fallback) resolves, only the variable changes.

*Decided (`decisions.md`, item 2): read from `NEXT_PUBLIC_SITE_URL`, not written as a literal, so canonicals, cards, `security.txt` and the sitemap all move together when the domain arrives.*

```ts
// src/content/site.ts
const url = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL =
  url && !url.includes(".example") ? url : process.env.NODE_ENV === "production" ? fail("NEXT_PUBLIC_SITE_URL") : "http://localhost:3000";
```

- `fail` throws at build. A production build with the variable unset or still `.example` must fail, never publish `localhost` canonicals. There is no silent fallback to `VERCEL_PROJECT_PRODUCTION_URL`: the variable is set on purpose.
- Add `sameAs: ["https://github.com/dctxv", "https://www.instagram.com/dctxv/"]` to the Person in the JSON-LD.
- The content lint (section 3.4) fails while `SITE_URL` contains `.example`.

**`TIME_ZONE`** (`site.ts:16`, still `null`). Three consequences today:
- `hours.ts:35` passes `timeZone: undefined`, so Urchi sleeps from 01:00 to 06:59 in the **visitor's** zone.
- The asleep caption "It is {time} here." then prints the visitor's own clock as if it were his.
- `fact.ts:70-71` counts his week in UTC days.

Set the zone: `TIME_ZONE = "Australia/Melbourne"`, and a new `HEMISPHERE = "south"` on the line after it (for the sky calendar and the seasons). The evidence is his own commits (+10:00) and his Swinburne coursework repository. Melbourne moves to +11:00 on Sunday 4 October 2026, which the `Intl` zone handles by itself. Then the content lint checks that it is non-null and valid (`new Intl.DateTimeFormat("en", { timeZone })` must not throw). The daily games' day boundary (section 4.2) reads it too. *Decided (`decisions.md`, item 1); it changes only if he moves city.*

**Links** (`site.ts:41, 43`).
- GitHub (`https://github.com/dctxv`) and the email address (`dctxvv@gmail.com`, the address all seven of his commits carry) are settled. Delete the two `TODO(darius)` comments.
- Do not obfuscate the email:
  - About already copies it on pointer-up (`AboutPanel.tsx`);
  - the no-JS path needs the real `mailto:`;
  - Gmail's spam filter does the rest.

**Placeholders.** Before launch, either replace the six placeholder projects and the art in `public/work` or hide them. The owner's GitHub branch has done this: it merged as `0d9641d` with four public projects (VECTOR, Digital Career Hub, NextBranch and Atelier) and removed every placeholder. Bump `UPDATED` (`site.ts:99`) to the launch date.

Effort: under an hour, apart from the projects.

---

#### 2. House rules for the builders (new)

**Pitch.** Every branch Claude opens reads the same short rules before it writes a line, so ten parallel branches still build one site.

**Why.**
- 136 commits in five days came from parallel Claude Code branches ("Merge p2/limbs2" is in the log).
- The invariants that make the site feel like one thing live only in the README's very long table rows and in the comments. The rules are: two colours, no exclamation marks, tabs kept mounted, pause on hide, reduced motion, sound off.
- A new agent reading `NotesPanel.tsx` to add a daily game would find none of them.

**How it works.**
1. A new `CLAUDE.md` at the root, about 60 lines. It points to the README as the spec rather than copying it.
2. It sets out the invariants as rules you can check:
   1. Two colours only (`#16161d`, `#e9e9e2`). The tokens live in `globals.css` `@theme` and `:root` and in `src/lib/color.ts`. The one allowed exception is Music's room tone (`src/lib/tone.ts`).
   2. One radius (4 px), one gutter (8 px), one glass. Grotesk for labels and log lines, serif for his words.
   3. Copy:
      - no exclamation marks;
      - sentences, not labels;
      - counts go through `countWord` ("Sixty-two", digits from 100);
      - his voice, never the creature's.
   4. Every visited tab stays mounted:
      - pause frames on `onShown` (`src/lib/where.ts`), and never assume that mounted means visible;
      - window key handlers must check they are the current tab, as `ProjectsPanel.tsx:40` does; new ones claim keys through `src/lib/keys.ts` instead (section 4.4).
   5. Reduced motion is honoured everywhere. Sound is off by default, and nothing sounds before a gesture.
   6. No backend state. Storage goes through `src/lib/store.ts` (section 4.3), with every access guarded.
   7. No fourth *kept* WebGL context: only Space, Projects and About keep one. A tool that needs WebGL creates its context when it opens and releases it when it closes, or after ten seconds hidden. Games and every other new surface use the DOM or a 2D canvas. Four contexts are already alive on a full lap. *Ruled in the summary ("Rules for every new thing", Performance): this replaces "no new WebGL contexts outside Space, Projects and About", because Sky is a WebGL tool.*
   8. Urchi:
      - `src/engine/urchi/character.ts` is canonical;
      - asleep 01:00-06:59 his time (`hours.ts`, Australia/Melbourne);
      - new behaviour goes through `Attention.play` with a priority;
      - it is never on the Desk, and never announces the daily puzzle.
   9. Before committing, run `npm run check`. Commit subjects read `Tab: a sentence in the house voice`, and `[quiet]` keeps one out of the log (section 11.2).
   10. Never touch `ThreadScene.ts` or `CreativeSpacePanel.tsx` on two branches at once. Say which of them a branch touches in its first commit.
   *Ruled in the summary: these ten are the core, and `CLAUDE.md` carries the summary's whole "Rules for every new thing" (voice, colour and type, sound, motion, phone, Urchi, data, performance, testing, process).*
3. `package.json` gains `"check": "npm run lint && npm run typecheck && vitest run"`.
4. Optional: a `.claude/settings.json` Stop hook that runs `npm run check`. It costs about 20 seconds a turn, so try it on one branch first.

**Looks, sounds, reads.** Invisible to visitors. The file itself reads in the house voice, so the rules model it: "Nothing on this site raises its voice. Not the copy, not the sound, not the motion."

**Where it lives.** `/CLAUDE.md`, plus the `check` script.

**Data.** None.

**Implementation sketch.** One Markdown file and one script line. The content lint (section 3.4) enforces rules 1, 3 and 8 in code, so the file is not the only guard.

**Edge cases.** The README and `CLAUDE.md` drift apart. `CLAUDE.md` links to README sections instead of restating behaviour.

**Effort.** S: about an hour.

**What it shows.** In an interview, "how do you work with AI agents?" has a concrete, good answer: he runs them like a lead runs a team, with written rules and checks.

**Risks.** Rules nobody enforces rot. That is why the content lint exists.

---

#### 3. Before announcing it

##### 3.1 Security headers and CSP

**Today.**
- `curl -sI /` shows only `Cache-Control`, `Vary` and `Link`, and `next.config.ts` has no `headers()`.
- `/.well-known/security.txt`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` and `/favicon.ico` all 404.
- Vercel adds HSTS by itself on its domains, but nothing else. Expect a failing grade on securityheaders.com and on the Mozilla Observatory: the first two things a security reviewer runs.

**What the site actually needs.** I re-ran the scratchpad's report-only probe (`csp-probe.mjs`) over all six routes, taking Urchi out on `/`. The only violations were:
- `worker-src blob:`: troika's SDF workers, on Projects and About;
- `img-src data:`: the live favicon;
- `style-src-attr` inline: `<html style="--vv-bottom-inset:0px">` from `layout.tsx:36`, plus React style props on case pages;
- Next's own dev tools, which production does not have.

There were no violations for fonts, media, `connect` or `frame`.

**Step 1 (S), production only.** Dev needs `unsafe-eval`.

```ts
// next.config.ts
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",   // step 2 replaces this
  "style-src 'self' 'unsafe-inline'",    // the <html> style attribute; GSAP writes through CSSOM, which CSP allows anyway
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",             // troika-worker-utils builds its workers from blob: URLs
  "frame-src 'none'",                    // becomes 'self' in the commit that adds the first /lab demo (section 5.3)
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

async headers() {
  if (process.env.NODE_ENV !== "production") return [];
  return [{ source: "/:path*", headers: [
    { key: "Content-Security-Policy-Report-Only", value: CSP }, // report-only; step 2's nonce policy is the one enforced, after a clean week
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // add "preload" after a month on the real domain
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=(), browsing-topics=(), microphone=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-Frame-Options", value: "DENY" },
  ]}];
},
```

- **`preload`** is left out until the domain has been lived on. Preload lists are slow to leave, and `includeSubDomains` commits every future subdomain to HTTPS. *Decided (`decisions.md`, item 2): the domain is bought by Friday 9 October, and `preload` is added and submitted on Monday 9 November, a month after it goes live.*
- **`microphone=()`** is written out rather than omitted, and it stays `()`: Cues promises it never listens, and an explicit value reads better on `/kept` than a gap does. *Ruled in the summary: deny by default, and grant a feature in the same commit as the first thing that uses it (`geolocation=(self)` arrives with That night's "Here", if it is ever built). The same rule keeps `frame-src` at `'none'` until the first `/lab` demo.*
- **`/.well-known/security.txt`**, served by a static route (`src/app/.well-known/security.txt/route.ts`, `dynamic = "force-static"`) built from `SITE_URL`, not a file in `public/`, because it must follow `NEXT_PUBLIC_SITE_URL` when the domain arrives (`decisions.md`, item 2):

  ```
  Contact: mailto:dctxvv@gmail.com
  Expires: 2027-09-30T00:00:00Z
  Canonical: ${SITE_URL}/.well-known/security.txt
  Preferred-Languages: en
  Policy: ${SITE_URL}/kept
  ```

  The `Policy` path is `/kept`, "How this site is kept", as the summary's map has it.

**Step 2 (M): no `unsafe-inline` for scripts.** Two routes, both in Next's bundled guide:
- **Nonces.** A new `src/proxy.ts` (Next 16's name for middleware) generates a nonce and uses `'nonce-…' 'strict-dynamic'`.
  - The guide says it plainly: every page becomes dynamically rendered.
  - Here that costs little, because every panel is client-rendered.
  - The case pages lose `generateStaticParams`'s static output.
- **Experimental SRI** (`experimental.sri`). Pages stay static.
  - It is experimental: try it in report-only for a week before trusting it.
  - Inline flight-data scripts are the usual catch.

*Ruled in the summary: nonces. Report-Only with `'unsafe-inline'` on day one, then the nonce policy, enforced after a clean week. Only the nonce policy is ever enforced, because `/kept` reads it back and a reviewer spots `'unsafe-inline'` at once. SRI stays an experiment in report-only.* The write-up is paper two, "A CSP for a three.js site whose text renderer builds its workers from `blob:` URLs" (Strategy §2.2, §5.8). This section is only the plumbing.

##### 3.2 The three proxies, and one poller

*Decided (`decisions.md`, Engineering 4): this report is already public on the review branch of a public repository, so the proxy fixes below (`/api/preview` serving only signed songs, `/api/cover` taking only images, and the timeouts) move from week 2 to the first days of week 1. The review branch is never merged, and `docs/review/` never lands on `main`.*

**`/api/preview`: only songs the site listed (Medium, S).**

- **What an attacker gets.** Today anyone can `curl '/api/preview?artist=…&title=…'` for any song in Apple's or Deezer's catalogue and have the site stream it (`preview/route.ts:27-50`).
- **What each call costs.** Up to four store searches plus a Deezer track lookup (`songs.ts:186-191, 205`), and about 1 MB of egress per hit.
- **Why only Medium.** The risk is cost and noise, not data. Apple throttles by IP, but a Vercel function's outbound IP is shared with other tenants anyway.
- **The fix.** Sign what the site lists.

```ts
// src/app/api/now/route.ts, per track returned (now, last, week.tracks)
const sign = (artist: string, title: string, day = utcDay()) =>
  createHmac("sha256", process.env.PREVIEW_SECRET!).update(`${day}\0${artist}\0${title}`).digest("base64url").slice(0, 16);
// Track gains `sig?: string` (src/lib/now.ts:9); fetchNow (now.ts:55-75) must copy it through, since it rebuilds the object.
```

- `MusicPanel.tsx:892` adds `s: t.sig` to the query.
- The route accepts today's or yesterday's signature. Otherwise it answers with the existing cached 404 (`silence(true)`).
- With no `PREVIEW_SECRET` (dev), it skips the check and says so once with `console.warn`.
- **Also:**
  - Refuse any `content-type` that is not `audio/*`.
  - Add `X-Content-Type-Options: nosniff`.
  - Refuse a `Content-Length` over 5 MB.
- **Redirects.** Do **not** pass `redirect: "error"`: a store's CDN may legitimately redirect a preview. Pass `redirect: "manual"`, follow at most one `Location`, and only if `onHost(location, PREVIEW_HOSTS)` accepts it.

**`/api/cover`: the stored-XSS shape, closed (Medium, S).** References corrected against the 50-line file.
- `image()` (lines 9-15) passes the upstream `Content-Type` through, with `immutable`.
  - Accept only `image/(jpeg|png|webp|gif)`; SVG is excluded.
  - Add `nosniff` and `Content-Security-Policy: default-src 'none'; sandbox` to the proxied bytes.
- The store fetch (line 28) and the CDN loop (lines 40-45) follow redirects and have no timeout.
  - Use `redirect: "manual"` with the same one-hop `onHost` check (`ART_HOSTS` for the store path, and the Last.fm CDN host for the loop).
  - Add `signal: AbortSignal.timeout(5000)`.
- A junk 32-hex id costs **four** sequential fetches (`png, jpg, webp, gif`), and the 404 is not cached. Answer with `Cache-Control: public, max-age=300`.
- `artUrl` (`songs.ts:218-222`) should accept only paths ending in an image extension, or a size segment like `/600x600bb.jpg`.
- Log the reason in both silent catches (lines 30 and 46).

**`/api/now`: honest and cheap (Medium, S).**
- **Timeouts.** `call()` (`now/route.ts:73-78`) has none. Copy `songs.ts`'s `AbortSignal.timeout`: 5 s per Last.fm call.
- **CDN cache.** The route is `force-dynamic`, and `NextResponse.json` (line 231) sends no `Cache-Control`, so every poll from every visitor is a function invocation. Send `Cache-Control: public, s-maxage=10, stale-while-revalidate=50`.
  - A cached answer's `elapsed` can then be up to 10 s old.
  - Add `at: Date.now()` to the body (new field on `NowResponse`, `now.ts:35`). The client corrects with `elapsed + clamp((Date.now() - at) / 1000, 0, 15)`; the clamp bounds clock skew.
  - Space uses `elapsed` only to decide staleness (`CreativeSpacePanel.tsx:489-490`). Music's own clock (`timingOf`) takes the corrected value.
- **An outage that looks like a quiet week.** `catch { return EMPTY_NOW }` (lines 232-234) and `fetchNow`'s `!res.ok → EMPTY_NOW` (`now.ts:58`) make an outage identical to a quiet week.
  - Add `ok: false` to the failure shape, carried through `fetchNow`, and `console.warn` the reason.
  - Style and UX R8 (F-M8) writes the honest line for it. Suggested: *"Last.fm is not answering. The records are still here."* Music then shows the last good week from `eigengrau:week`, the cached week the summary's storage list adds for outages.
- **Upstream calls are cached.** The upstream calls are cached despite `force-dynamic`: explicit `next.revalidate` wins (`patch-fetch.js:398`). Say so in a comment at line 8.

**One poller (S).**
- Space and Music each run `pollNow` (`CreativeSpacePanel.tsx:479`, `MusicPanel.tsx:1000`).
- `pollNow` pauses on **document** visibility (`now.ts:108`), not on the **panel**, so both run whenever both are mounted: seven calls in about 2.5 minutes in the probe.
- The fix: `src/lib/now.ts` becomes one shared poller.
  - `subscribe(tab, onData, cadence)`.
  - It polls at the fastest cadence among subscribers whose tab is shown (`onShown`), and at the slowest cadence otherwise. Space still hears a song start while you read Notes, just less often.
  - It delivers the last answer at once to a new subscriber. Space already keeps a module-level `lastNow` for this; it moves into the poller.

##### 3.3 Search and sharing: the plumbing

Style and UX R1 (F-H6) designs how the cards look. This section is the wiring.
- **`src/app/sitemap.ts`:** built from `TABS`, `PROJECTS` and the future registries (`src/tools/index.ts`, the games list, the security entries).
- **`src/app/robots.ts`:** disallow `/api/` and `/dev/`; point at the sitemap. When Phosphenes' season one opens, it also disallows `/phosphenes`, and that line is the first light.
- **`src/app/opengraph-image.tsx`** via `next/og`: his name and `WORK_LINE` in Newsreader on eigengrau, beside a small Urchi in the denim colourway. *Ruled in the summary (reconciliation 10): the cards carry `WORK_LINE`, not "Basic Human" and not the statement; "Basic Human" stays on screen as the joke beside it. Canonicals are set per route, never on the root layout.*
  - Satori reads TTF, OTF and WOFF, **not WOFF2**. Load `public/fonts/serif-300.woff` (52 KB) with `readFile`.
  - Urchi cannot be painted inside satori. Pre-render a PNG of the smooth head with the 2D painter in a build script (the same painter the flat Space uses) and embed it as a data URL.
  - Without dynamic params these images are generated once at build.
- **Per-project `opengraph-image.tsx`** under `projects/[slug]`, from the cover.
  - Convert covers to PNG or JPEG at `gen:assets` time. Do not rely on satori reading WebP.
  - `generateMetadata` (`projects/[slug]/page.tsx:13-17`) gains `description: project.summary` and `alternates.canonical`.
- **Descriptions per route.** Every route currently shares `TAGLINE`.
  - Space (the root): `WORK_LINE`, "Student developer in Melbourne. Interfaces, AI tools and security." `title.default` becomes "Darius Tan", and the JSON-LD `jobTitle` takes `WORK_LINE` too (`decisions.md`, item 3).
  - Projects: `projectsLine()`.
  - Notes: *"Short notes, and the site's own log. The newest: 'i got a free burrito heh'."*
  - Music: *"What he is playing, and the week's ten."*
  - About: the statement.
- **Notes in the HTML.** `src/app/notes/page.tsx` renders only `<h1 class="sr-only">Notes</h1>`, and all panels are `ssr: false` (`Shell.tsx:19-23`), so a `curl` of `/notes` has no note text. Render the notes list server-side as an `sr-only` mirror, exactly as `src/app/projects/page.tsx` does for Projects: date, tags and body, newest first.
- **Also:** `favicon.ico` (a 16/32 px Urchi from the same painter), `apple-icon.png` and `manifest.webmanifest` (name, `#16161d`, `display: browser`).
- **Later:** `/notes/[id]` permalinks, only once notes are longer than "hi".

Effort: S-M.

##### 3.4 Tests and CI, in phases

**Phase one: the day-one kit (about 1.5 days).**

Install Vitest, with the `@/` alias set in `vitest.config.ts` via `resolve.alias`, the `node` environment, and `jsdom` only for storage. Scripts that import site code (`npm run today`, `npm run sync:github`) run under `tsx`, so the `@/` alias works everywhere. *Ruled in the summary: Vitest is the one runner; no `node --test`, and no check hidden inside a dev page.*

| Test file | What it pins |
|---|---|
| `src/content/site.test.ts`, **the content lint** | **Identity:**<br>- `TIME_ZONE` is valid and non-null.<br>- `SITE_URL` has no `.example`.<br><br>**Words and voice:**<br>- `countWord(0..120)` golden: "No", "Twelve", "Sixty-two", "Ninety-nine", "100".<br>- `projectsLine` uses `countWord`: once the count passes twelve it must read "Fourteen projects", not "14".<br>- No `!` in any user-facing string in `site.ts`. This fails for copy and warns for note bodies, which are his.<br>- Every `URCHI_LINES` entry is 48 characters or fewer.<br><br>**References and files:**<br>- Every `SPACE_ITEMS.project` names a real slug.<br>- Every media path exists under `public/`.<br>- Covers are 150 KB or less.<br>- Every string troika draws (statement, titles, `why`) is inside the subset font's range (section 7.3).<br><br>**Notes:**<br>- Note ids are unique.<br>- Dates are valid.<br>- Tags are in `NOTE_CATEGORIES`. |
| `src/app/api/songs.test.ts` | **`onHost`** must return null for every one of these:<br>- `https://mzstatic.com.evil.com/x`<br>- `https://evil.com/?h=mzstatic.com`<br>- `https://mzstatic.com@evil.com/`<br>- `http://a.mzstatic.com/`<br>- `https://xmzstatic.com/`<br>- `https://a.mzstatic.com./`<br>- `javascript:alert(1)`<br><br>**Round trips:** `artId`/`artUrl`, including rejection of an `x-` id outside the hosts.<br><br>**Matching** (`songKey`/`bareTitle`):<br>- "Song (feat. X)" matches "Song".<br>- "[2011 Remaster]" matches the bare title.<br>- "(Live)" stays apart.<br><br>**`findSong`**, with `fetch` stubbed:<br>- throws when a store did not answer;<br>- returns null on a confident miss. |
| `src/app/api/now/fact.test.ts` | `weekFact` on fixtures:<br>- an empty week;<br>- a heavy week;<br>- one song on repeat;<br>- a zone boundary. |
| `src/lib/random.test.ts`, `src/lib/day.test.ts` | - The first ten outputs of `rng(1)`, frozen.<br>- `today()` and `dayNo` across Melbourne's two changes (Sunday 4 October 2026 and Sunday 4 April 2027), and in zones at +14 and -12. |

*Decided (`decisions.md`, item 3's table, and items 1 and 5): the content lint also checks that `HEMISPHERE` is `"north"` or `"south"`; that `WORK_LINE` exists and is not empty (being the draft never fails); that no `TODO(darius)` is left; that the status line ends with a full stop; that from Sunday 11 October every project has a `why` and a `did` no longer marked `draft: true`; that from Monday 16 November `EDUCATION` is `confirmed: true` or `null`; and that each of About's three linked phrases occurs exactly once in the statement. (The check that no private repository's name reaches `github.json` or the log belongs to the sync, which alone holds the names; section 5.5.) None of these fails because he has not written enough; they fail on placeholders, broken rules and drafts past their date.*

- **`e2e/smoke.spec.ts`**, Playwright with the SwiftShader flags from `shoot2.mjs`, against `next start`, waiting for `load`, never `networkidle`, because the site polls:
  - every route returns the right status, with no `pageerror`;
  - the mirror or the real DOM is present;
  - the pills navigate;
  - a kept tab is `inert` and `visibility: hidden`;
  - at 1440×900 and 390×844 with touch.
- **`e2e/nowebgl.spec.ts`:** launched with `--disable-webgl`, every route renders its flat view (section 1.1) with no error page.
- **A deploy gate that costs no Actions minutes:** set Vercel's build command to `npm run lint && npm run typecheck && vitest run && next build`, which adds about 20 s. A red test blocks the deploy even if CI is never set up.

**Phase two: when the Desk and the finds begin.**
- **`e2e/reduced.spec.ts`** (`reducedMotion: 'reduce'`): no intro, and Urchi dithers in where it rests.
- **`e2e/a11y.spec.ts`:**
  - `@axe-core/playwright` on the DOM routes: Notes, Music, case pages, 404, the Desk, the tools;
  - a keyboard walk: Tab reaches Urchi's button, Enter takes it, and on Projects Esc winds the thread back.
- **`e2e/tools-offline.spec.ts`:** see section 5.2 for the exact rule.
- **`e2e/budget.spec.ts`:** sum the encoded bytes of a hard load, excluding sound.
  - `/` 900 KB; `/notes` 350 KB; `/projects` 1.2 MB until covers are thumbnails.
  - Fail on any single image over 300 KB.
- **Golden tests:**
  - `lib/notes.test.ts`: `indexSentence`, `tagSentence`, `findSentence` and `summary`, and `settle` once it takes its entries as a parameter.
  - `sky/tune.test.ts`: `resolve` is deterministic, locks hold, and `pickWeighted` distributes as weighted.
  - `urchi/hours.test.ts`: `hoursOf` at 0, 1, 6, 7, 22 and 23.
  - `lib/tone.test.ts`: the `labOf`/`rgbOf` round trip, and `contrast` ≥ `MIN_CONTRAST`.
  - `games/*/rules.test.ts` and `finds/roll.test.ts`.

**Phase three: screenshot baselines, few and fixed.**

A living, randomised creature makes for brittle screenshots. Keep four, and lean on golden numbers everywhere else:
- `/about?still`;
- `/?still&hour=14:00&sky=k3x9q2&col=<a fixed colourway>`, at home, never afloat;
- `/notes`;
- `/projects/vector` (the placeholder `meridian` is gone from `main` since `0d9641d`).

How to take them:
- `page.clock.install({ time: new Date("2026-10-01T14:00:00") })`, then `page.clock.runFor(4000)` before each shot, so frames advance deterministically.
- `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`.
- Linux-only baselines, regenerated by a `workflow_dispatch` job.

This is the net under the ThreadScene layout extraction. The layout's own golden numbers (section 6) are the stronger net.

**CI (`.github/workflows/`).** Two workflows, so the fast one runs on every push:

```yaml
# check.yml: every push (about a minute)
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check          # lint, typecheck, vitest
```

```yaml
# e2e.yml: pull requests to main, and main itself (about eight minutes)
on:
  pull_request: { branches: [main] }
  push: { branches: [main] }
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: "http://localhost:3000"   # CI builds are never deployed; production builds fail without the real one
          TODAY_TOKEN: ${{ secrets.TODAY_TOKEN }}          # the private puzzle bank, fetched at build (section 5.1)
          TODAY_REPO: ${{ secrets.TODAY_REPO }}            # its name stays a secret, so this public file never names it
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test    # webServer: npm start, port 3000
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: playwright, path: [playwright-report, test-results] }
```

- **Minutes.** A public repo's minutes are free. A private one gets about 2,000 a month. At about twenty pushes a day plus four end-to-end runs, that is roughly 1,500 minutes a month: close to the limit. The repo (`dctxv/eigengrau`) is public, so both workflows run on every push they list at no cost. *Decided: if it ever goes private, the checks run only in the Vercel build (`decisions.md`, Engineering 4).*
- **Pinning:** `"engines": { "node": ">=20.9" }` in `package.json`, and `.nvmrc` with `22`.
- **`.github/dependabot.yml`:** npm weekly, grouped: `next` with `eslint-config-next`, `react` with `react-dom`, `three` with `@types/three`. Actions monthly.
- **Branch protection versus `npm run note`.** `npm run note` commits and pushes to main (`scripts/add-note.mjs:4, 136`). Branch protection that requires `check` would reject that push unless admins may bypass. *Decided (`decisions.md`, Engineering 4): no required check. `main` gets a ruleset that blocks only force-pushes and deletion, so `npm run note` keeps pushing straight to `main`, and the Vercel deploy gate above is what stops a red test.*
- **Before any Source link:** secret scanning with push protection on every public repository, and one `gitleaks detect` over each history (Strategy §3.12).
- **Nightly:**
  - the memory lap: ten laps of the tabs; heap growth under 3 MB; DOM nodes and listeners constant;
  - a smoke screenshot of production, uploaded as an artifact.

---

#### 4. Foundations for everything new (about two days together)

##### 4.1 `src/lib/random.ts` (S)

- **Move** `hashSeed`, `subSeed`, `unitOf`, `rng` and `pickWeighted` out of `src/engine/space/sky/tune.ts:58-143`.
  - `tune.ts` re-exports them, so the sky is unchanged.
  - Delete the second mulberry32 in `src/components/chrome/Between.tsx:103-113`; it is identical.
- **Add** `seeded(...parts: string[]): () => number`, which is `rng(hashSeed(parts.join("\u0000")))`, so every game, find and sky draws from one tested source.
- **Freeze it.** A golden test fixes the first ten outputs of `rng(1)` and `hashSeed("eigengrau")`. A PRNG that changed silently would change every shared sky, every find's code, and every daily puzzle not yet written. Published puzzles are safe either way, because they are frozen files (section 5.1).
- *Ruled in the summary: the module is `src/lib/random.ts`, not `src/lib/seed.ts`, because `sky/seed.ts` already means visit and URL seeds.*

##### 4.2 `src/lib/day.ts`: one day for everyone (S)

The engineering proposal used the visitor's local date, "as Wordle does". Both games proposals use his zone. His zone it is (`TIME_ZONE ?? "UTC"`, which is `"Australia/Melbourne"`), for engineering reasons:
- The OG image for "No. 12" is rendered on the server, which has no visitor zone.
- The `/api/today` and `/api/today/[game]/[n]` edge caches need one global expiry.
- Archive URLs (`/today/<game>/<n>`) must mean one puzzle.
- Two friends comparing "No. 12" at the same moment see the same board.

It also fits the site, which already lives on his hours. The cost: a visitor far from him gets the new puzzle at another hour. From Sunday 4 October his midnight is 09:00 in New York and 14:00 in London. The copy turns that into character: *"A new one at midnight, his time. That is in six hours."*, and the Today head may say *"It is already Friday here."* to a visitor behind him (`decisions.md`, item 1).

*Ruled in the summary: his day, falling back to UTC, never the visitor's; numbering is per game, not one epoch. So the single `EPOCH` this section first proposed gives way to each game's own `since` (Same Grey's is 2026-10-12), exported from `src/games/<id>/rules.ts`, and `daySeed` leaves this client module: puzzles are generated ahead by `npm run today` from the build secret `TODAY_SALT` (section 5.1).*

```ts
import { TIME_ZONE } from "@/content/site";
export const DAY_ZONE = TIME_ZONE ?? "UTC";                      // "Australia/Melbourne"
export function today(now = new Date()): string                // "YYYY-MM-DD" in DAY_ZONE, via Intl "en-CA"
export function dayNo(since: string, date: string): number     // (Date.UTC of date − Date.UTC of since) / 86_400_000 + 1: whole days, no DST; since is the game's first day
export function dateOf(since: string, no: number): string      // the inverse, for archives
export function untilTomorrow(now = new Date()): number        // ms to the next 00:00 in DAY_ZONE, from Intl parts
export function visitorDay(now = new Date()): string           // notes.ts's localDay, moved here with its own meaning
// Seeding a day is not here: seedFor(game, n, attempt) = subSeed(hashSeed(TODAY_SALT), `${game}:${n}:${attempt}`) lives in scripts/today.ts, run under tsx.
```

- **`notes.ts:34` `localDay` is a different idea.** It answers "what day is it for the visitor?" for "new since your last visit". It moves here as `visitorDay()` with the same meaning; do not merge it into `today()`.
- **Tests:**
  - `dayNo` is continuous across both DST changes in `DAY_ZONE` (Melbourne: Sunday 4 October 2026 and Sunday 4 April 2027);
  - `untilTomorrow` is never negative and never over 25 hours;
  - `today()` at 23:59:59 and at 00:00:00.

##### 4.3 `src/lib/store.ts`: versioned, guarded, in step across tabs (S)

```ts
export function keep<T>(name: string, o: { version: number; empty: T; read(data: unknown, from: number): T | null }) {
  // key `eigengrau:${name}`, value { v, data }; every access in try/catch (private mode: memory only);
  // read() migrates older versions or returns null (then `empty`); a `storage` listener keeps browser tabs in step;
  // returns { get(), set(next), update(fn), subscribe(fn) }: subscribe fits useSyncExternalStore.
}
```

- `urchi`, `finds` and `today:<game>` use it from day one. *Ruled in the summary: one record per game (`eigengrau:today:<game>`, not one `daily` key), and trust lives once, in `eigengrau:urchi`, with the browser's seed beside it; the finds' events feed that one value and there is no second store. Every new key (`urchi`, `finds`, `today:<game>`, `bench:<slug>`, `keys`, `phos`, `week`, `eyes-seen`) goes into the README's list and onto `/kept`.*
- The five legacy keys (`eigengrau:sound`, `:visits`, `:told`, `:along`, `:sky`) stay as they are; migrating them buys nothing.
- The one duplicated contract goes: `notes.ts:308-327` re-declaring `visits.ts`'s 30-minute rule. `notes.ts` imports `lastVisit()` from `visits.ts`.
- **Budget:** about 50 KB per key. Prune daily history older than 400 days on write.
- **Moving between devices, with no accounts:** `exportAll()` gives a base64url string of the `keep` keys, and `importAll(s)` validates each one through its own `read()`. The Desk offers it as *"Take your record with you."*

##### 4.4 `src/lib/keys.ts` and the digits (S)

**Today.**
- `Tab.tsx:56` prints `<sup>{n}</sup>`, and the README table says "Space `1`".
- The only window key handlers are Notes' (`NotesPanel.tsx:1090`), Projects' (`ProjectsPanel.tsx:198`) and Music's (`MusicPanel.tsx:986`). Nothing takes a digit.
- Notes' type-anywhere search (`NotesPanel.tsx:1012-1016`) would start a search on "4", Notes' own new digit.

**The keymap.**
- Panels register claims: `claim(tab, (e) => boolean)`.
- Shell handles `1`-`6` only when:
  - the target is not typeable;
  - no modifier is held;
  - no claim on the current tab takes the key.
- Notes claims printable keys only once a search has begun.
- A future game board with numbers claims digits while focused.

This is Style and UX R3 (F-H2) and strategy's key table. Engineering supplies only the keymap. **The numbering is decided:** Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6. Renumbering is free until the digits work, and not after, so the digits land in week 1 with 3 reserved: Notes, Music and About answer to 4, 5 and 6 from the first day any digit works, and 3 does nothing until the Desk pill arrives with its frame in week 2 (`decisions.md`, item 4).

*Ruled in the summary ("Keys"): `keys.ts` is one capture-phase listener with a claim stack, and the capture phase is what fixes the Notes ordering bug. During the intro a digit hurries the intro instead. `?` opens the key sheet, Esc goes up one level inside the Desk (board, drawer, shelf), and single-character shortcuts can be switched off on `/colophon` (`eigengrau:keys`), as WCAG 2.1.4 requires.*

##### 4.5 A tab that owns rooms: the Desk's mechanics (S-M)

Games, tools and security as three new tabs would give eight pills. That is too many for the phone bar, and it dilutes the rooms. One tab, the **Desk**, holds all three. It is decided: the pill is called "Desk" and sits third (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6), with the drawers Today, Tools and Security, as Strategy §5 sets out. This section is only what Shell needs so that one tab can serve many URLs.

**Two ideas, kept apart.**
- **`tabOf(path)`: which kept panel renders a route.** Exact match, or a route the tab `owns`. Opt-in per tab.
- **`pillOf(path)`: which pill lights and which room the sound is in.** This is the existing prefix function in `sfx.ts:497-499` (a case page is "in" Projects), moved to `routes.ts` and shared.

*Ruled in the summary ("Shared foundations"): the second function is named `pillOf`, as in Strategy §5.5, and sfx's own `tabOf` becomes it. This section first called it `roomOf`.*

Keying every tab by prefix, as proposed, would make `/projects/vector` render inside the kept Projects panel next to the thread canvas. Case pages must stay their own pages.

```ts
// src/content/site.ts (strategy's shape)
{ href: "/desk", label: "Desk", n: 3, owns: ["/today", "/tools", "/security"] },

// src/lib/routes.ts
export function tabOf(path: string): TabHref | null {
  for (const t of TABS) {
    if (path === t.href) return t.href;
    const owned = "owns" in t ? [t.href, ...t.owns] : [];
    if (owned.some((o) => path === o || path.startsWith(`${o}/`))) return t.href;
  }
  return null;
}
export function pillOf(path: string): TabHref | null { /* sfx.ts:497-499, moved here: tabOf(path), or the tab it sits under */ }
```

**What changes in Shell** (a day, not the "S" the proposal gave it):
- `Shell.tsx:62` and `:131`: a panel's key is `tabOf(path) ?? \`page:${n}\``.
- `els` (`Shell.tsx:59`) is keyed by panel key, not by path.
- `show()` and `setShown()` (`Shell.tsx:66-76`) pass tab roots.
- `canSlide` and `tabIndex` (`Shell.tsx:128, 143`) compare `tabOf` on both sides. A move between two routes of the same tab is not a slide: the Desk handles it itself.
- `Stage` (`Shell.tsx:29-36`) receives `{ tab, path }`, and the Desk panel reads `path`.
- `Shell.tsx:219` renders `children` (the server mirror) inside the panel whose tab owns the current path.
- `Nav.tsx:35`: `active={pillOf(pathname) === t.href}`, so case pages light "2", with `aria-current="true"` (strategy asks for this).
- `sfx.ts` imports `pillOf` instead of keeping its own copy, as `pillOf(path) ?? "/"`. It must not use the new `tabOf`, which returns null for a case page and would move a song "heard from Projects" to Space.
- *Ruled in the summary: three more hooks the first draft missed, specified in Strategy §5.5.*
  - **Space's look back at the tab you left** (`CreativeSpacePanel.tsx:433`), gated today on `isTab(left)`, uses `pillOf(left)`. Coming home from a case page, Urchi looks at Projects; coming home from a board, it looks at the Desk pill (a look back, not an announcement).
  - **The Desk pill remembers its last drawer.** Nav gives a tab with `owns` the href of the last path it showed this visit (`lastIn(tab)`, new, in memory in `where.ts`), so `3` from Music returns to the half-played board. Clicking the lit Desk pill, or Esc, goes up to the shelf.
  - **`pillAt` by `data-tab`** (`attention.ts:119`, and the pill ids at `:553-556`): once the Desk pill's href changes, a lookup by `href` misses it, so `Tab.tsx` gains `data-tab={tab}` and the lookups query that.
- Unchanged:
  - the panels' own `isCurrent` checks (`ProjectsPanel.tsx:40`, `NotesPanel.tsx:1014`), because those tabs own nothing;
  - `Between.tsx:130`, which already sizes by `TABS.length`.
- Each owned route gets a server page with metadata and a mirror, for example `src/app/today/[game]/[[...n]]/page.tsx` or `src/app/tools/[[...slug]]/page.tsx`. That is where the Desk's search presence comes from.

**Payoff.** A half-played puzzle survives a trip to Music, exactly as Urchi's float does today.

**Edge cases.**
- A hard load of `/tools/jwt` mounts the Desk panel with that path.
- Back and forward inside the Desk change `path` without a remount.
- Reduced motion: no slide, as today.

##### 4.6 Where the new work lives

```
src/
  lib/
    random.ts        NEW  one PRNG + hashing (from sky/tune.ts; Between.tsx's copy deleted)
    day.ts           NEW  today(), dayNo(), untilTomorrow() in his zone; visitorDay() from notes.ts
    store.ts         NEW  versioned, guarded, cross-tab localStorage; export/import
    keys.ts          NEW  one keymap, claims, digits for tabs
    routes.ts        CHANGE  tabOf() (owned routes), pillOf() (moved from sfx.ts)
    count.ts         NEW  the three named Umami events (section 8)
    now.ts           CHANGE  one shared poller; ok, at, sig carried through
  content/
    site.ts          SPLIT on 30 September into identity.ts, projects.ts, notes.ts, re-exporting all (section 6, step 6)
    github.json      NEW  generated by scripts/sync-github.mjs, committed; public repositories only, private ones as monthly totals
    finds.ts         NEW  the catalogue's words (Space finds)
    log.json         NEW  written by npm run log (section 11.2)
    today/           NEW  git-ignored checkout of the private puzzle bank, fetched at build (section 5.1)
    security/*.mdx   NEW  write-ups (or .tsx; section 5.3)
  games/<name>/      NEW  rules.ts (pure) · Board.tsx · share.ts
  tools/<name>/      NEW  meta.ts · logic.ts (pure) · Tool.tsx · worker.ts?
  tools/index.ts     NEW  the registry: sitemap, listing, OG
  engine/space/
    Space.ts         NEW  the controller extracted from CreativeSpacePanel's effect
    FlatRoom.ts      NEW  the lights-off Space (section 1.1)
  engine/finds/      NEW  catalog.ts · roll.ts (pure) · FindSprite.ts · present.ts · store.ts (the pocket, on keep("finds"))
  components/chrome/
    PanelBoundary.tsx NEW
    Carried.tsx      NEW  the carried find, above every tab (2D canvas)
  components/pages/
    DeskPanel.tsx    NEW
  app/
    desk/page.tsx, today/…, tools/…, security/…   NEW  server mirrors and metadata
    api/today/route.ts, api/today/[game]/[n]/route.ts   NEW  the day, and a frozen puzzle served only from its day
    sitemap.ts · robots.ts · opengraph-image.tsx · error.tsx · global-error.tsx · manifest.ts   NEW
```

*Ruled in the summary ("Shared foundations"): finds live in `src/engine/finds/`, kept out of `engine/space` because the chrome and About use them too, so the pocket moves there from the `src/lib/finds.ts` this section first proposed, and the sprite takes the finds section's name, `FindSprite.ts`.*

---

#### 5. Runways for the new work

The games, tools, security content and finds each have their own proposals. These sections are only the engineering contract each must meet.

##### 5.1 Daily games

**Shape.** Each game is `src/games/<name>/`:
- `rules.ts` is pure: `generate(seed) → Puzzle`, `apply(puzzle, state, move) → state`, `solved(state)` and `score(state)`. No DOM and no clock. It also exports the game's `since`, its own first day, from which its numbers count.
- `Board.tsx` is DOM by default. A 2D canvas only if the game is spatial. Never a fifth WebGL context.
- `share.ts` writes the result as spoiler-free text in the house voice, with the number as a word up to ninety-nine: *"Stet, No. Twelve. Four marks, no mistakes."* It shares through `navigator.share` and falls back to the clipboard, with *"Copied."* as the only feedback.

**Where the puzzle is made.**
- *Ruled in the summary: frozen and served on the day. This section first generated each puzzle on the client from `daySeed(game, today())`, with the answer in the JS "as Wordle's was", and kept a salted `/api/daily/[game]` for later. Stet and Plaintext are curated, so a public bundle would spoil a week, and frozen files cannot drift.*
- **Made ahead.** `npm run today` (`scripts/today.ts`, run under `tsx`) generates and validates the next 400 days of each game from `seedFor(game, n, attempt)`, rooted in the build secret `TODAY_SALT`, into `src/content/today/<game>.json`. It never rewrites a day that already exists.
- **Kept private.** `src/content/today/` is a git-ignored checkout of a private bank repository, fetched at build by `scripts/fetch-today.mjs` with a read-only token (`TODAY_TOKEN`) and a repository name that is itself a variable (`TODAY_REPO`), so the public repository never holds an answer or names the bank (`decisions.md`, Daily games 3).
- **Served on its day.** `/api/today` gives the day; `/api/today/[game]/[n]` gives puzzle `n`, imported on the server only, and a 404 for any `n` later than today in `DAY_ZONE`. Past days are `immutable`; today is edge-cached until `untilTomorrow()`, about one invocation per region per day.

**Persistence.**
- `keep(\`today:${game}\`, { version: 1, … })`, one record per game, holds `{ played: { [date]: { moves, result, at } } }`.
- Streaks are computed from `played`, never stored, so they cannot drift.
- Moving devices uses the export string (section 4.3).

**Golden tests.** The frozen files are the snapshot, and they are stronger than one: a published day cannot change at all. `npm run today` validates every day it writes (solvable, one answer) and re-rolls with `attempt` until it passes. In the public repository, Vitest covers `rules.ts` on fixtures, never on the bank.

**Share cards.** `src/app/today/[game]/[[...n]]/opengraph-image.tsx` renders "No. Twelve" and an empty board, never the answer. It reads the game and the number from `params` (the puzzle's path, `/today/stet/6`), never `searchParams`, so each puzzle has its own card. A card for a day not yet out is a 404, like the puzzle itself.

**Edge cases.**
- **Midnight mid-game:** the board finishes on its own date. At midnight a single caption appears: *"A new one is ready. This one is still yours."*
- **Reduced motion:** no animated reveals.
- **Sound off:** silent.
- **Returning visitor:** yesterday's result, and today's untouched board.
- **Night hours:** the games do not sleep, even when Urchi does.

##### 5.2 Tools

**Shape.** Each tool is `src/tools/<name>/`:
- `meta.ts`: slug, title, one line and keywords. It feeds the sitemap, the OG image and the Desk listing, where the one registry (`src/tools/index.ts`) groups its rows under "To make" and "To check" (security tools sit under "To check", summary reconciliation 2).
- `logic.ts`: pure, and tested.
- `Tool.tsx`: dynamically imported, so the Desk costs nothing until a tool opens.
- `worker.ts` for heavy work, via `new Worker(new URL("./worker.ts", import.meta.url))`. Next 16 builds with Turbopack, so check this form there on day one. If it fails, build the worker from a Blob: `worker-src blob:` is already allowed for troika. Hashing large files uses `crypto.subtle` inside the worker.

**"Nothing you give it leaves this page": a promise the site can prove.**
- **CSP.** `connect-src 'self'` stops third-party exfiltration at the browser.
- **Lint.** An ESLint `no-restricted-globals` / `no-restricted-properties` rule under `src/tools/**` bans:
  - `fetch`, `XMLHttpRequest`, `WebSocket` and `EventSource`;
  - `navigator.sendBeacon`;
  - `Image` / `.src =` assignments to anything but `blob:` or `data:`.
- **`e2e/tools-offline.spec.ts`.** For every tool: open it, wait for its chunk and worker, then use it with a fixture input. The test then asserts:
  - zero requests other than `GET /_next/static/**` chunk loads;
  - no request with a body;
  - no request to `/api/`.

  The first version of this rule ("zero requests after load") would have failed on the tool's own lazy chunk.

  *Decided (`decisions.md`, item 7, and the Free tools section): counts are on, so the one exception the tool itself causes is a single same-origin `/u/` request carrying only `tool_export { tool, format }` when a visitor takes something, sent by `src/lib/count.ts` (outside `src/tools/**`, so the lint above still holds) and never under Do Not Track or Global Privacy Control. The site's own traffic that has nothing to do with the tool (Space's `/api/now` poll, `?_rsc=` prefetches, `/api/beacon`) is on the test's known list, and nothing else may go out. The tool's privacy line names the `/u/` request when it happens.*

**Search presence.** Each tool route has a server-rendered mirror: what it does, how to use it, and the privacy line. Each has its own OG image. Tools are the part of a portfolio that strangers search for.

##### 5.3 The security section

**Write-ups.**
- Long-form, static, plain DOM in the case-page language, with code blocks and an OG image each.
- MDX (`@next/mdx`) is right if there will be more than about five. It adds three dev dependencies.
- For two or three write-ups, TSX pages with a small `<Code>` component need none. Start with TSX; move to MDX when writing stops being pleasant.
- Everything else on the site stays as TS content objects.
- They live at `/security/<slug>` in the Security drawer and in Notes as `kind: "paper"`. *Decided (`decisions.md`, Strategy): all three papers are drafted from the real diffs for him to approve (`approved: true`), under his byline, and paper three is "The notes Action, and the injection it does not have", not a CTF write-up.*

**Demos that run code.**
- A `srcdoc` iframe **inherits the embedding page's CSP**. Under the site's policy, a playground's scripts would simply be blocked, or would need the page's nonce, which defeats the point.
- So each demo is its own route, `/lab/<demo>`:
  - with its own `Content-Security-Policy` header set in `next.config.ts` `headers()` for `/lab/:path*`;
  - framed with `<iframe sandbox="allow-scripts" src="/lab/<demo>">`, **without** `allow-same-origin`, so it runs in an opaque origin and cannot read the site's localStorage (streaks and finds).
- `frame-src 'self'` in the main policy allows it. It replaces `frame-src 'none'` in the same commit as the first demo, and not before (section 3.1). Demos come only after the proof, the reading back, the papers and the play (summary, bet three), if at all.
- If a demo ever runs code a visitor pastes, host it on a separate origin: a `lab.` subdomain as a second Vercel project.

**The site itself is exhibit one** (section 11.1).

##### 5.4 Urchi's finds: the right seams

The design belongs to the two finds proposals. The engineering corrections:

- **Not a `SkyLayer`.** The layer contract (`src/engine/space/sky/layer.ts:52-66`) is for a seeded backdrop:
  - `setup()` lays it out once per seed;
  - `update()` is "uniforms only";
  - the sky is "never pixelated" and moves by depth with the zoom.

  A thing Urchi swims to, grasps and holds must live in **Urchi's plane**, zooming and pixelating with it. A distant glint before it is noticed can be a sky-depth sprite. The find itself cannot.
- **Model it on Motes.** `Motes.ts` already does almost exactly this:
  - a `THREE.Mesh` added to `room.scene` (`Motes.ts:135-140`);
  - registered with the attention through `att.add({ id, kind: "mote", weight, level, at })` (`Motes.ts:169`);
  - removed with `att.remove(id)`;
  - checked with `att.watching(id)`.

  New `src/engine/finds/FindSprite.ts` (the finds section's name; this section first called it `src/engine/space/finds/FindMesh.ts`) does the same with `kind: "find"`, a new member of `TargetKind` (`src/engine/urchi/attention.ts:36`). Whether it snaps to the pixel grid follows the same rule Urchi and the line follow (`RoomScene.ts:480-497`).
- **Going to it.** Float's swim is private: `swimStep()` and `pickSwim()`, `Float.ts:764-806`.
  - Add a public `Float.swimFor(target: () => Point)` (new). It sets `this.swim` to the find's place, under the same `free` test (`Float.ts:766`: floating, not held, not taut, awake, calm).
  - It plays the existing `swimTo` act (`src/engine/urchi/acts.ts:71`) through `att.play("swimTo", …)`, as line 780 does.
- **Grasping it.** `reachOut()` (`Float.ts:740-757`) already reaches for a watched mote with `L.reachFor(at, side)` (`src/engine/urchi/limbs.ts:761`). Widen its `thing` choice from `kind === "mote"` to include `"find"`. Holding it out is a new limbs quirk.
- **Within the line.** A find must spawn where the swim could reach it: within `this.length * SWIM.slack` of the line's root, the same test `pickSwim` applies (`Float.ts:798-800`). Otherwise Urchi goes taut and tugs, which reads as failure.
- **Presenting it.**
  - The `"happy"` face (`character.ts:698`) plus a new `present` act in `acts.ts`. *Ruled in the summary: allowed as a brief event only, at most 1.2 s, with no notes rising and never from a hidden mood, because rising notes carry the music meaning.*
  - The caption and the live region (`CreativeSpacePanel.tsx`'s `live` ref) say what it is, in his voice.
- **Rolling it.** `finds/roll.ts` is pure: `seeded(visitSeed(), String(count), today())` into `pickWeighted`. Tests:
  - determinism;
  - distribution: 10,000 rolls within 2% of the weights.
- **The pocket.** `src/engine/finds/store.ts` on `keep("finds", { version: 1 })`, holding `{ items: [{ id, kind, at, seed }], carrying: string | null }`. Trust is not kept here: the finds' events (the keeps trade, giving a find back, taking a reverent one, a snapped line) feed the one trust value in `eigengrau:urchi`, and the gift codes' salt derives from the browser's seed kept there too (summary, reconciliation 5).
- **Carrying it across tabs.**
  - `src/components/chrome/Carried.tsx`, mounted in `Shell`. *Ruled in the summary: the sound chip moves into the nav (Style and UX R4), and the pocket takes the top-right corner the chip gives up, on every screen size, from the first take on. This section first put it beside `SoundChip`.*
  - On the Desk the carried find goes into the pocket at once and never hangs under the pointer: the boards own the pointer there, and Same Grey is a test of what sits beside a grey.
  - A small 2D canvas using sprites pre-rendered by `gen-assets`. Never a new three.js renderer.
  - It subscribes to the store, so it survives reloads and stays in step across browser tabs.
- **Only when it makes sense:**
  - `Float.state === "floating"`, `!att.asleep`, `!att.acting`;
  - not while the tabs slide (`getFlags().transitioning`).
- **Refactor first.** Extract `Space.ts` (section 6, step 3). Otherwise finds is another 150 lines in `CreativeSpacePanel`'s single effect.
- **Edge cases the engine already models:**
  - **Asleep** (01:00-06:59 his time): nothing is fetched.
  - **Reduced motion:** no swim; it dithers in already holding the find.
  - **Phone:** the line reaches 85% of the width.
  - **The line snaps mid-fetch:** the find drifts back into the room and fades.
  - **Returning visitor:** the pocket persists.

##### 5.5 Real GitHub projects (being added now)

*Since written: the branch merged as `0d9641d` on 29 September, with four public projects (VECTOR, Digital Career Hub, NextBranch and Atelier), thirteen real pieces and `TURNS_LEAST = 9`. It did not bring the brief's months, `did` lines, closed marks, or `countWord` in `projectsLine`; those go to the week-1 months branch (`decisions.md`, Engineering 5), and the sync below lands in week 3.*

Curation, look and the thread's handling of many projects belong to Strategy §1 and §3. The engineering contract:

- **Fetch at build time, never at runtime.**
  - A new `scripts/sync-github.mjs` calls `GET /users/dctxv/repos?per_page=100&sort=pushed`, plus `/languages` and `/topics`.
  - It writes `src/content/github.json`: `name, description, html_url, homepage, language, topics, stargazers_count, created_at, pushed_at, archived, fork`, plus the finds section's `release` and `lastCommit`. These are for public repositories only.
  - Run it by hand (`npm run sync:github`, under `tsx`). This means no rate limits, no loading states, and a diff he reviews.
  - A daily Action that commits comes with the sync in week 3. *Decided (`decisions.md`, item 5, and the summary's priority 7); this section first left it for later.* Each of its commits triggers a Vercel deploy, and they carry `Log: none` so the log never offers them.
- **Private repositories: closed, counted, never named.** *Decided (`decisions.md`, item 5):*
  - All eight appear as closed marks, untitled, at the month each was created, reading "Closed. Ask and I will show you." No name, description, language, README or image of theirs reaches the site or the public repository.
  - Their pushes thicken the thread only as one monthly total across all eight. Push times ("Wound on at 2:14.") are shown only for public repositories.
  - The sync reads them with a token through the authenticated `/user/repos`, controlled by the Actions variable `SYNC_PRIVATE` (`all` or `none`), with exclusions (the puzzle bank among them) in the secret `SYNC_EXCLUDE`.
  - Actions logs on a public repository are public, so the sync prints only counts ("Eight closed. Forty-one pushes in September."). A test fails the sync if any private name, fetched at run time and never stored, appears in `github.json` or in the log.
- **Facts from GitHub, voice from `site.ts`.**
  - `Project` (`site.ts:107-122`) gains optional `repo`, `live`, `stack`, `start` and `end` (months, per the Strategy §1 brief; this section first called them `started` and `ended`), a `did` line, and `source` (the Career Hub is coursework and shows no Source link until `source: true`).
  - `github.json` supplies the facts. `site.ts` keeps `why`, `summary` and the curation: which repos appear at all.
  - The status word defaults from the data: archived → "dead"; pushed within 90 days → "alive"; otherwise "paused". His word always wins.
- **Real run lengths.** `created_at` and `pushed_at` give the pluck its real duration. Today it is inferred from one year plus the pieces' years (the rule is described at `ThreadScene.ts:284-292`).
- **Pieces from the repo.** Screenshots under `docs/` or `.github/` are downloaded at sync time and cut with `sharp` to the 320 px box (`PIECE_BOX`, `projects/[slug]/page.tsx:7`).
- **Strings from GitHub are untrusted.**
  - Escape the JSON-LD (section 9).
  - Before any case page links a repository: secret scanning with push protection, one `gitleaks detect` over its history, and a real README and description (Strategy §3.12).
  - Render any README with `rehype-sanitize` at build time.
  - The content lint checks troika's glyph range on titles and `why` lines (section 7.3).
- **Counts.** `projectsLine` must switch from `numberWord` to `countWord` (section 9). The real repositories landed without it, so it goes into the week-1 months branch: four public and eight closed make twelve, and eigengrau and Urchi make fourteen, past `numberWord`'s twelve.

---

#### 6. Refactors, in order, around the branch in flight

The owner had a GitHub-projects branch open when this was written. Any refactor of `site.ts` or `ThreadScene.ts` beside it guarantees a painful merge. *Since then it has merged (`0d9641d`, 29 September), so step 5 is done and steps 6 and 7 are dated below (`decisions.md`, Engineering 5).*

1. **`PanelBoundary` and the lights-off views** (section 1.1). A bug fix. S-M.
2. **`CLAUDE.md` and `npm run check`** (section 2). S.
3. **Extract `src/engine/space/Space.ts` from `CreativeSpacePanel.tsx:158-840`.** M. No other open branch touches Space's effect.
   - The interface:

     ```ts
     interface SpaceSystem { frame?(dt: number): void; pointer?(e: PointerEvent, over: boolean): boolean; float?(s: FloatState): void; shown?(on: boolean): void; dispose(): void }
     ```

   - Room, attention, faces, motes, call, float, sky and the poll are registered in order.
   - The panel keeps only refs and JSX.
   - Finds, and the lights-off room, become one more system each.
4. **`random.ts`, `day.ts`, `store.ts`, `keys.ts`, and `tabOf`/`pillOf`** (section 4). About two days.
5. **Merge the GitHub-projects branch.** Done: `0d9641d`.
6. **Then split `site.ts`** into `identity.ts` (what the chrome imports on every route), `projects.ts` and `notes.ts`. S. On Wednesday 30 September, ahead of steps 1-4 now that the branch has merged, as a pure move: `site.ts` keeps re-exporting everything, so no import changes. It touches no hot-spot file.
   - Update `scripts/add-note.mjs`, which looks for `export const NOTES: Note[] = [` in `site.ts` (`add-note.mjs:18-27`).
   - Confirm with `@next/bundle-analyzer` that notes and projects no longer ride in the shared chunk.
7. **Then extract ThreadScene's layout:** the build and layout sections (`ThreadScene.ts:1367-2117`), into a pure `thread/layout.ts`. M. First, one week-1 branch, "Projects: months on the thread", owns `ThreadScene.ts` and carries the brief's unfinished items (`start`/`end` months and marks placed by date, `countWord` in `projectsLine`, months in `statusWord`, the drafted `did` lines). Closed marks wait for the sync in week 3. The extraction itself is week 7, when no other branch is in the file.
   - It takes data and returns positions, and golden numbers pin it: every mark's angle and height for a fixture of six projects, a fixture of fourteen (today's real count) and a fixture of thirty.
   - This is the part real repos change, and it gets the strongest net.
   - The rest of the split, one section per PR and only when a feature needs it:
     - `thread/noise.ts` (731-798);
     - `thread/ribbons.ts` (799-938);
     - `thread/hover.ts` (2534-2887);
     - `thread/nova.ts` (3118-4404, the supernova as a state machine).
   - Leave the supernova until last. It works, and it is a thousand lines.
8. **CSS by panel.** Move `globals.css` sections into `src/styles/{chrome,space,projects,notes,music,case}.css`, imported by their panels. Keep one `tokens.css`, with a test that its two colours match `src/lib/color.ts`. Keep Tailwind: it supplies preflight and `sr-only`, and its `@theme` tokens are a cheap way to keep new Desk UIs on the two colours. S.
9. **Leave `character.ts` alone**, except to pull out pure pieces (colourway choice, projection) when finds needs hand poses. Refactoring the painter is risk without reward.

---

#### 7. Performance

##### 7.1 Space at idle: a frame governor, after measuring

**Today.**
- Urchi is painted by the Canvas 2D rasteriser in `character.ts`, into a canvas up to `RES_MAX = 1400` px across (`Urchi.ts:70-71`).
- That canvas is uploaded whenever `character.update(dt)` reports a paint (`Urchi.ts:287`). Breathing makes that nearly every frame: at about 1400×1230 RGBA, roughly 7 MB an upload.
- The probe measured Space idle at 43 frames a second (SwiftShader's rate) and about 290 ms of script a second.
- A real GPU will do far better, but the CPU paint is real.

**Step 1: measure on real hardware.** Five minutes idle on Space:
- a MacBook: Performance panel, and Energy Impact in Activity Monitor;
- a recent iPhone: Safari's timeline.

Targets on an M-series Mac: under 60 ms of script a second, and Energy Impact "Low". If the numbers already meet them, stop here.

**Step 2: the governor, in `RoomScene`.**
- **Rates:**
  - **Full rate:** while any of these is true:
    - the pointer moved in the last two seconds;
    - a drag or fling is running (`Float` `hold` or velocity);
    - an act is playing (`att.acting`);
    - a saccade or blink began in the last 400 ms (new getter on `Attention`, fed by the character);
    - Float is in any state but `home` or `floating`;
    - the zoom is changing;
    - a shooting star is crossing.
  - **30 fps otherwise:** breathing and slow drift look the same at 30.
  - **15 fps asleep:** the Zs drift slowly, and 12 would step visibly.
- **How:** `tick` accumulates `dtMs`, and calls `frame(acc)` once the accumulated time exceeds the frame budget (`frame` already clamps to 64 ms, `RoomScene.ts:182-185`).
- **Why this rule:** the Urchi realism work adds micro-motion (fixational drift, pupil unrest). The governor wakes on events rather than guessing, so that work stays crisp where it matters.

**Do not lower the pixel ratio cap.** `RoomScene.ts:28` allows 3 on purpose: whole art pixels on a phone's canvas. It is the look, not an oversight.

**Step 3, only if step 2 is not enough:** skip the upload for sub-pixel changes, meaning a pose that moved less than half a canvas pixel since the last upload.

**Step 4 (L, probably never):** draw the head as flat-shaded three.js geometry. The painter is what makes it Urchi, so only do this if the numbers demand it.

**Projects.** The ball idles at 770 draw calls a second (about 18 per frame). Measure it the same way before governing it.

**Edge cases.**
- Reduced motion already removes most of the motion.
- The governor must never delay the first frame after `onShown` flips.

**Effort.** M.

##### 7.2 Projects: the ball before the stills

**Today.**
- `ThreadScene.load` awaits `Promise.all` over every cover and every piece still (`ThreadScene.ts:1370-1374`) before it builds.
- Moving media already waits until a project opens (`fetchMoving`, line 3082).
- With six projects and twenty pieces that is fine. With thirty repos at three to five screenshots each, the ball waits for about 150 images. On `main` today there are four public projects and thirteen real pieces, so this is headroom, not urgency.

**Fix (M, with the GitHub data).**
- Build the thread with bare marks, and fade each cover in as it lands.
- Cut stills to the 320 px box.
- Consider one texture atlas per year.

The README already says covers lie in year rows past thirty projects, so the layout anticipated this.

##### 7.3 Asset weight

| Asset | Size | Change |
|---|---|---|
| `public/audio/click.wav` | 423 KB: stereo, 16-bit, 44.1 kHz, **2.4 s**, audible down to -48 dB at 2.3 s | Trimming would change the sound. Encode it as AAC (`.m4a`) at 128 kbps, about 40 KB. After `decodeAudioData` (`sfx.ts:161`), find the first sample above -60 dB and start from there (`source.start(t, offset)`), so the encoder's lead-in never delays the click. Loaded only once sound is on. |
| `public/audio/ambient.mp3` | 3.6 MB, streamed, sound on only | Re-encode at 96 kbps (about 1.3 MB) if it still sounds right. |
| `public/fonts/grotesk-500.woff` (troika's copy; troika cannot read WOFF2) | 140 KB | Subset it to Latin-1 plus typographic punctuation: `pyftsubset grotesk-500.woff --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026" --flavor=woff`, about 25 KB. The content lint checks every string troika draws is inside that range, because GitHub titles are not his to control. |
| `public/work/p05-alt.webp`, `p05.webp` | 554 KB, 294 KB | Placeholders. The CI budget stops real covers doing the same. |

---

#### 8. Deployment and observability

**Vercel.**
- Environment variables: `LASTFM_API_KEY`, `LASTFM_USER`, `PREVIEW_SECRET` (new) and `NEXT_PUBLIC_SITE_URL`, always: the Vercel production URL until the domain resolves, then the domain (a production build fails without it). Later, all new: `TODAY_TOKEN`, `TODAY_REPO` and `TODAY_SALT` for the puzzle bank (section 5.1), and `NEXT_PUBLIC_UMAMI_ID` for the counts. The sync's `SYNC_PRIVATE` and `SYNC_EXCLUDE` live in GitHub Actions, not in Vercel.
- Preview deployments per branch already suit the parallel-branch way of working: each Claude branch gets a URL to look at.
- The build command runs the tests (section 3.4).
- Add HSTS `preload` only after a month on the custom domain: Monday 9 November, if the domain goes live by Friday 9 October (`decisions.md`, item 2).

**Analytics: cookieless, with no banner, and honest about it.**
- **Vercel Web Analytics** serves its script and beacon same-origin (`/_vercel/insights`), so it fits `connect-src 'self'` with no change.
  - Custom events need the Pro plan. On Hobby it counts page views only.
- **Events on Hobby** go through Umami with its script and endpoint proxied same-origin by a `rewrites()` entry under `/u/`, so the CSP stays tight (`connect-src 'self'` still holds). *Decided (`decisions.md`, item 7): Umami Cloud's free tier, cookieless, with automatic page views off (`data-auto-track="false"`). It changes to self-hosted Umami behind the same `/u/` if the free tier ends.*
- **Keep the events few.** *Decided: three named events, and nothing else. This section first proposed seven (`urchi_taken`, `line_snapped`, `nova_burst`, `preview_played`, `daily_solved`, `tool_used`, `find_found`); they are cut to the three that answer "does anyone come back, and does anyone take anything".*
  - `game_finished { game, n, streak: "1" | "2-6" | "7+" }`;
  - `find_taken { tier }`;
  - `tool_export { tool, format }`.
  - They live in new `EVENTS` in new `src/lib/count.ts`. Nothing is sent while the browser signals Do Not Track or Global Privacy Control.
- **One dry line on `/kept`** says what is counted, with the three names and their fields printed exactly as sent: *"Visits are not counted. Three moments are: a game finished, a find taken, a tool's export. Nothing says whose."*

**Errors: a beacon before any vendor.**
- `src/app/api/beacon/route.ts` accepts a `POST` of 2 KB or less and `console.error`s it into Vercel's logs.
  - It strips newlines and control characters first, so nobody can forge log lines.
  - It answers `204` to anything, and never echoes input.
- **The client sends via `navigator.sendBeacon` from:**
  - `PanelBoundary`, `error.tsx` and `global-error.tsx`;
  - `window.onerror` and `unhandledrejection`;
  - `glState()` turning `"none"` or `"soft"`, and `webglcontextlost`.
- **Sampling:** 100% for WebGL failures (they are the unknown); 10% otherwise.
- `useReportWebVitals` (available: `next/dist/client/web-vitals.d.ts`) sends LCP, INP and CLS through the same beacon. INP matters on a pointer-first site.
- Sentry is cut for now. Its SDK outweighs everything but three.js.

**Upstream health.**
- Log a reason in each silent `catch`:
  - `now/route.ts:232`;
  - `songs.ts:129`;
  - `cover/[id]/route.ts:30, 46`;
  - `preview/route.ts:51`.
- Once CI exists, a weekly Action calls `/api/now` and opens an issue if `ok` has been false for a day. Last.fm keys do get revoked.

---

#### 9. Small correctness fixes (S together)

- **`projectsLine` (`site.ts:209-213`)** uses `numberWord`, which stops at "Twelve" and then prints digits (`site.ts:189-191`). With the real repositories (four public and eight closed, plus eigengrau and Urchi) it will read "14 projects since 2026.", against the house rule that counts are words up to ninety-nine.
  - Switch it to `countWord`, which already exists for exactly this (`site.ts:201-206`).
  - The case page's "{n} pieces" (`projects/[slug]/page.tsx:43`) likewise.
  - The content lint pins both.
- **`Shell.tsx:72`.** `toggleAttribute("aria-hidden", !on)` writes `aria-hidden=""`, which ARIA reads as not hidden. It is harmless today, because `visibility: hidden` and `inert` do the work. Use `setAttribute("aria-hidden", "true")` and `removeAttribute`.
- **Several `<main>` elements.** Every kept panel renders one (`Shell.tsx:217`). Render a `<div>` there instead, and set or remove `role="main"` inside the same `show()` (`Shell.tsx:66-76`). No remount.
- **`layout.tsx:40`.** The JSON-LD goes into `dangerouslySetInnerHTML` without escaping `<`. It is safe while he writes every string, and unsafe once GitHub descriptions arrive. Use `JSON.stringify(jsonLd).replace(/</g, "\\u003c")`.
- **`motion.ts:19-22`.** Reduced motion is read at mount, with no `change` listener. Add `onReducedMotion(fn)` for the panels that can switch live (the Desk, tools and games). The scenes can keep reading it at mount.
- **The 404** (`src/app/not-found.tsx`) borrows the case layout, so "Nothing here." sits at the top and "Back" mid-screen (`desk-direct-404.png`). Put them together. The copy belongs to Style and UX R8 (F-M7): a sanitised, capped path, so nobody can make the site say their sentence, and the six tabs as words plus "Colophon" (summary, reconciliation 9).
- **The duplicate mulberry32** goes with `random.ts` (section 4.1).

---

#### 10. One Urchi

**Today.**
- `urchi/index.html` (523 lines) has one commit, the import (`1dd87df`).
- `character.ts` has 19 commits and adds faces, the suit, limbs, `smooth` and a dozen hooks.
- The README (`README.md:89-90`) still says a change to one wants the same change in the other.
- The head mesh travels through HTML comment markers: `build-mascot.mjs` writes it into `index.html`, and `scripts/sync-urchi.mjs` copies it back out.

**Fix (S).**
- Declare `character.ts` canonical, in the README and in `CLAUDE.md`.
- `urchi/tools/build-mascot.mjs` writes `src/engine/urchi/mesh.json` directly. `sync-urchi.mjs` is deleted.
- The standalone page becomes a dev-only `/dev/urchi` route beside `/dev/suit`, using the flat room from section 1.1. That is nearly free once `FlatRoom.ts` exists.
- Delete `urchi/index.html` in the same commit, and update what points to it (`character.ts:6, 30`; `README.md:74-90`). *Decided: git history keeps the original, and a copy nobody updates is exactly the second source of truth this fixes. It stays, marked frozen, only if something outside the repository links to it.*

---

#### 11. Two features the engineering suggests

##### 11.1 The site, examined (merged into `/kept`, "How this site is kept")

The security draft (§2.8, unreviewed and unfinished) proposed a page about how the site is kept. This was the same idea, so the name and the route follow that proposal (`/kept`), which Strategy §6.1 now specifies alongside `/colophon`: two short pages, linked to each other (summary ruling). Engineering supplies four live parts, so the page cannot drift from the code:

1. **The headers you were just given.**
   - A small client component does `fetch("/", { method: "HEAD", cache: "no-store" })`. Every response header is readable from the same origin except `Set-Cookie`.
   - It prints CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP and `nosniff`, one line each on why each is there.
   - A nonce in the CSP is shown as `'nonce-…'`, so nobody reports it as a leak.
   - A header that did not arrive is shown struck through, honestly.
   - Copy: *"These are the headers your browser was given a moment ago."*
2. **Where the server may go.**
   - The page imports `PREVIEW_HOSTS`, `ART_HOSTS` and `LINK_HOSTS` from `src/app/api/songs.ts:26-28`, plus the Last.fm API and CDN.
   - It lists them, with the test that proves each fence: the `onHost` bypass cases in section 3.4.
   - Copy: *"The server fetches from six places and no others. It follows a redirect only back into them."*
   - When `/api/pulse` (the GitHub API) and the `/u/` rewrite (Umami) arrive, they join the list in the same commit, and the count in the copy is computed with `countWord`, so the sentence cannot fall behind.
3. **The signed previews and the refused redirects,** each paired with the attack it stops.
4. **Provenance.**
   - `process.env.VERCEL_GIT_COMMIT_SHA` and the build time, read at build.
   - The repo is public, so a link to that commit's Actions run on GitHub, by commit hash (`decisions.md`, Engineering 4).
   - The test count from a Vitest JSON report written during the Vercel build (section 3.4's build command), so the number is the one that let this build out.
   - Copy: *"Built 29 September at 16:52 from 9b8c07c. Forty-one tests passed before it was allowed out."*

*Decided (`decisions.md`, items 6 and 7): `/kept` also lists every `eigengrau:` key and what it holds, including Urchi's memory of the visitor, with a "Forget me" button that clears them all; the three counted events, exactly as sent; and what the site gives away about him (his zone, his sleep, his listening, `WORK_HOURS`). Those are written content; the four parts above are the live ones.*

**Looks.** A case page's layout: header names in grotesk, his words in serif. No sound.

**Edge cases.**
- **Dev:** there are no headers. The page says *"This is a copy on his machine. The real one is stricter."*
- **Phone:** stacked.
- **Reduced motion:** nothing moves anyway.

**Effort.** S, once sections 3.1 and 3.2 are done.

**What it shows.** Security as a practice, checkable in thirty seconds by exactly the people it is for.

**Risks.**
- It advertises the defences. None of them depend on being secret; `PREVIEW_SECRET` stays secret.
- Keep it honest when something is missing.

##### 11.2 The log, from the commits

**Pitch.** Notes already has a kind for the site's own lines, and the commit subjects already sound like them. Let him publish the ones he likes.

**How it works.**
1. A new `scripts/log-from-git.mjs` (the name `decisions.md` and Strategy §7.1 use; this section first called it `scripts/log.mjs`), run as `npm run log` once a week, reads `git log main --since=<the newest log line's date> --date=short --format="%ad%x09%s"`.
2. It keeps subjects that start with a tab name: `Space:`, `Projects:`, `Notes:`, `Music:`, `About:`, and later `Desk:`. In today's history that is thirty-seven Space, nineteen Projects, nine Notes and nine Music.
3. It drops:
   - anything containing `[quiet]`;
   - `npm run note`'s own commits (`Notes: YYYY-MM-DD, …`, `add-note.mjs:136`);
   - the sync's commits, which carry `Log: none`;
   - merges with nothing after the branch name. *Decided (`decisions.md`, Style and UX 5): the week's merge subjects are offered too. A merge that carries a sentence ("Merge p2/afloat: a smooth line, walls without a bounce, hands out of the suit, and swimming") is offered with its prefix removed, as Strategy §7.1 does, and a `Log:` trailer wins where there is one.*
4. It groups by day and proposes at most two lines a day. It asks about each one, the same way `add-note.mjs` asks its questions, with keep as the default: Enter keeps, `e` edits, `n` skips. One keypress a line, once a week. *Decided (`decisions.md`, Style and UX 5); it changes to no by default only if a subject ever says something he would not publish.*
5. It writes the chosen lines to `src/content/log.json` as `{ id, date, body }`.
6. `src/lib/notes.ts` merges them into the column as `kind: "log"` with the tag `site`.
7. It commits `log.json` the way `add-note` commits a note.

It runs locally, on purpose. Vercel clones shallowly, and an Action that commits on its own would publish work-in-progress subjects he never chose.

**Looks, sounds, reads.**
- Grotesk log lines in the Notes column, as already designed: *"Space: a sky behind Urchi afloat, starting with the stars."*
- The tag sentence counts them: *"Fourteen from the site since September."*
- The existing riffle tick when they fold.

**Where it lives.**
- Notes (tab 4), filterable with `/notes?tag=site`.
- The hand-set `UPDATED` (`site.ts:99`) stays, and log lines do not move pills. *Ruled in the summary (reconciliation 4): `UPDATED.desk` moves only when a new game, tool or paper lands, and then Urchi looks up at the Desk pill once; it never looks up for a daily puzzle. So, as in Strategy §7.1, log lines merge into `ENTRIES`, not `NOTES`, and `whatsNew` (`src/lib/visits.ts:167-176`, which filters `NOTES`) already ignores them. This section first had the log retire `UPDATED`, with `whatsNew` taking each tab's date from its newest log line.*

**Data.** `src/content/log.json`, committed. No backend.

**Edge cases.**
- **Flooding.** The launch week has 136 commits. Two lines a day, his approval, and the existing `NOTES_FOLD_AFTER` sediment keep it readable.
- **Returning visitor:** they see the dot on new lines, which already works.

**Effort.** S.

**What it shows.** Craft over time, in its own voice. For a recruiter it is a changelog; for a person who notices, it is a diary.

**Risks.** A careless subject line becomes public. The approval step is the guard, and `[quiet]` covers the rest.

---

#### 12. Launch checklist

**Blockers:**
- [ ] `PanelBoundary` round every panel; lights-off Space, Projects and About; `error.tsx` and `global-error.tsx`; `e2e/nowebgl.spec.ts` (section 1.1)
- [ ] `SITE_URL` from `NEXT_PUBLIC_SITE_URL` (the Vercel production URL until the domain resolves), with a production build that fails if it is unset or `.example`; `sameAs` in the JSON-LD
- [ ] `TIME_ZONE = "Australia/Melbourne"` and `HEMISPHERE = "south"` set
- [ ] `WORK_LINE` in the title, the description and the JSON-LD `jobTitle`; `title.default` "Darius Tan"
- [ ] GitHub (`github.com/dctxv`) and email (`dctxvv@gmail.com`) kept in `ELSEWHERE` (`site.ts:41, 43`); both `TODO(darius)` comments deleted
- [x] Placeholder projects replaced; `p05*` removed (both on `main` since `0d9641d`)
- [ ] `UPDATED` set to launch day
- [ ] `projectsLine` on `countWord` (the week-1 months branch)
- [ ] `LASTFM_API_KEY` and `LASTFM_USER` set in Vercel; Music checked with real data
- [ ] `CLAUDE.md` and `npm run check`

**Before announcing it:**
- [ ] Headers, with `microphone=()` and `frame-src 'none'`; CSP report-only for a week, then the nonce policy enforced; `security.txt` (section 3.1)
- [ ] `/api/preview` signed and one-hop redirects; `/api/cover` type, redirect, timeout and 404 cache; `/api/now` timeout, CDN cache, `at` and `ok`; one poller (section 3.2). The two proxy fixes and the timeouts come first, in the first days of week 1, because this report is already public
- [ ] `sitemap.ts`, `robots.ts`, root and per-project OG images (WOFF, not WOFF2), per-route descriptions, notes mirror, `favicon.ico`, `apple-icon`, manifest (section 3.3)
- [ ] Phase-one tests green, run by the Vercel build command; CI on GitHub Actions (the repo is public, so its minutes are free); the `main` ruleset against force-pushes and deletion
- [ ] Devices:
  - [ ] MacBook, five minutes idle on Space (fans and CPU)
  - [ ] iPhone Safari: every tab visited, then ten minutes in the background, then returned to; watch for a reload from memory pressure with four contexts live
  - [ ] Android Chrome
  - [ ] Firefox: WebM hover media falls back to posters (`loader.ts:76-80`)
- [ ] Walkthroughs:
  - [ ] VoiceOver on each tab
  - [ ] keyboard only
  - [ ] reduced motion
  - [ ] sound on and off
  - [ ] Last.fm down (key removed)
  - [ ] `?hour=3`
  - [ ] `?flat`
- [ ] Domain (bought by Friday 9 October, `NEXT_PUBLIC_SITE_URL` moved to it), HTTPS, the three Umami events and the beacon live
- [ ] The 404 in one piece

**Soon after:**
- [ ] Measure Space and Projects at idle; the frame governor if needed (section 7.1)
- [ ] `random.ts`, `day.ts`, `store.ts`, `keys.ts`, `tabOf`/`pillOf`; the digits 1-6 in the decided order (week 1, with 3 reserved until the Desk frame in week 2)
- [ ] `Space.ts` extracted; `site.ts` split (Wednesday 30 September); ThreadScene layout extracted with golden numbers (week 7)
- [x] The GitHub branch merged (`0d9641d`)
- [ ] `click.wav` encoded with the offset skip; troika WOFF subset (section 7.3)
- [ ] `/dev/urchi` from the flat room; the README corrected (section 10)
- [ ] `npm run log` and the first log lines (section 11.2)

---

#### 13. Measurements (Appendix B, kept)

Dev server, Chromium 1440×900 with SwiftShader. JS bytes are dev chunks, so they are relative only.

| Route (hard load) | Requests | Transferred | Notes |
|---|---|---|---|
| `/` | 43 | 1.9 MB | three.js dev chunks about 417 KB; 8 media requests (232 KB, the intro ring's WebM pieces); `/api/now` twice |
| `/projects` | 54 | 2.1 MB | 26 images (509 KB; `p05.webp` 287 KB); troika loaded |
| `/notes` | 22 | 1.0 MB | no three.js, no troika |
| `/music` | 25 | 1.1 MB | no three.js |
| `/about` | 28 | 1.6 MB | three.js and troika |
| `/projects/meridian` | 25 | 1.0 MB | |
| `/nope` | 21 | 1.0 MB | 404 status, correct |

| Sitting on… (8 s each, after visiting the tabs by pill) | Draws/s | Script ms/s | Heap | GL contexts |
|---|---|---|---|---|
| Space, home, idle | 43 | 289 | 13.5 MB | 1 |
| Projects, ball idle | 770 | 46 | 19.2 MB | 3 (troika's SDF generator makes its own) |
| About | 54 | 98 | 16.3 MB | 4 |
| Notes (three GL tabs kept behind it) | **0** | **4** | 15.0 MB | 4 |
| Music | **0** | **4** | 16.2 MB | 4 |

**Other measurements:**
- **Heap over four laps**, with GC between laps: 16.0, 16.4, 16.7, 16.8 MB, about 0.27 MB a lap and probably noise. DOM nodes held at 476, listeners at 735. The nightly ten-lap test decides.
- **Library weight, gzipped** (an estimate; there was no production build):
  - gsap about 27 KB;
  - troika-three-text about 31 KB, plus about 5 KB of utilities;
  - three.js roughly 130-170 KB after tree-shaking.

  Confirm all of these with `next build` or `@next/bundle-analyzer`.
- **CSP report-only probe** (re-run for this review):
  - needed: `worker-src blob:`, `img-src data:`, inline style attributes;
  - nothing needed for fonts, media, `connect` or `frame`.
- **Endpoints:**
  - these all 404: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image`, `/favicon.ico`, `/apple-icon`, `/.well-known/security.txt`;
  - `/api/now` returns 200 with no `Cache-Control`;
  - `/api/cover/<junk>` returns an uncached 404.
- **WebGL disabled:** `/`, `/projects` and `/about` show the error overlay ("A WebGL context could not be created. Reason: disabled by enterprise policy or commandline switch", from `loader.ts:108` via `RoomScene.ts:175` via `CreativeSpacePanel.tsx:168`). `/notes` works. Screenshots are in `scratchpad/shots-nogl/`.

### Decisions

*The owner is asked nothing. Each line gives the decision and its reason; the full entries, with what would change each one, are in `decisions.md`.*

1. **The domain.** `NEXT_PUBLIC_SITE_URL` is the Vercel production URL until `dariustan.dev` (or the first free of `dariustan.com`, `darius-tan.dev`, `dctxv.dev`) is bought by Friday 9 October; a production build fails if it is unset or `.example`, and HSTS `preload` goes on Monday 9 November. Reason: one variable moves the canonicals, cards, `security.txt` and sitemap together, and a printed CV cannot be relinked (`decisions.md`, item 2).
2. **The time zone, and whose midnight.** `TIME_ZONE = "Australia/Melbourne"`, `HEMISPHERE = "south"`; each puzzle turns over at his midnight, falling back to UTC, never the visitor's, numbered per game from its own `since`. Reason: his commits carry +10:00 and his coursework is a Swinburne unit, and one zone means one "No. 12" for everyone (`decisions.md`, item 1; summary ruling).
3. **Where the Desk sits.** Third: Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6; the digits land in week 1 with 3 reserved. Reason: renumbering is free only until the digits do something (`decisions.md`, item 4).
4. **The repo is public.** CI runs on GitHub Actions for free; the Vercel build command also runs lint, typecheck and Vitest, so a red test blocks a deploy even if Actions is down; `/kept` links each build to its Actions run; `main` gets a ruleset against force-pushes and deletion only, so `npm run note` keeps pushing; secret scanning and `gitleaks` come before any Source link. Reason: CI is free and public, and gives `/kept` something real to link to (`decisions.md`, Engineering 4).
5. **The proxy fixes move to the first days of week 1.** Reason: this report is already public on the review branch, which is never merged (`decisions.md`, fact 2 and Engineering 4).
6. **The GitHub-projects branch has merged** (`0d9641d`). `site.ts` is split on Wednesday 30 September as a pure move; the week-1 months branch owns `ThreadScene.ts` (months, `countWord`, `did` lines); closed marks wait for the week-3 sync; the layout extraction is week 7. Reason: one owner for `ThreadScene.ts` at a time (`decisions.md`, Engineering 5).
7. **Private repositories** appear only as untitled closed marks, their pushes as one monthly total, never named; the sync prints only counts and a test fails it on any private name. Reason: Actions logs on a public repository are public (`decisions.md`, item 5).
8. **Counts.** Umami Cloud, cookieless, under `/u/` on the same origin, with three named events (`game_finished`, `find_taken`, `tool_export`), nothing under DNT or GPC, disclosed on `/kept`. Reason: it answers "does anyone come back" without an identity or a page view (`decisions.md`, item 7).
9. **Puzzles are frozen and served on their day** from a private bank fetched at build (`TODAY_REPO`, `TODAY_TOKEN`), seeded from the secret `TODAY_SALT`. Reason: nothing in the public repository may hold a puzzle's answer (summary ruling; `decisions.md`, Daily games 3).
10. **`Permissions-Policy` denies by default,** with `microphone=()` kept; the same rule keeps `frame-src 'none'` until the first `/lab` demo. Reason: Cues promises it never listens, and a feature is granted only in the commit that first uses it (summary ruling).
11. **The CSP** is Report-Only with `'unsafe-inline'` first, then nonces, and only the nonce policy is ever enforced. Reason: `/kept` reads it back, and a reviewer spots `'unsafe-inline'` at once (summary ruling).
12. **The log** is `scripts/log-from-git.mjs`, run weekly, with keep as the default; `UPDATED` stays hand-set. Reason: one keypress a line costs him minutes a week, and Urchi looks up only for a new game, tool or paper (`decisions.md`, Style and UX 5; summary, reconciliation 4).
13. **Links.** GitHub `dctxv` and `dctxvv@gmail.com` stay as they are, with no obfuscation. Reason: all seven of his commits carry that address (`decisions.md`, fact 3 and item 2).

### If you only do one thing here

Put a `PanelBoundary` round every tab, and give Space, Projects and About a lights-off view, with a `--disable-webgl` test to hold it there. Today a recruiter on a locked-down work laptop gets an error page. The planned `error.tsx` would not change that, because the panels live in the root layout, above it. The fix costs about a day and a half. The surprise is how little it gives up: Urchi is a Canvas 2D character underneath, so even with the lights off it still breathes, blinks and watches the pointer. Setting `TIME_ZONE` to `"Australia/Melbourne"` and `NEXT_PUBLIC_SITE_URL` to the Vercel production URL takes minutes; do those the same afternoon. Nothing else here matters as much as not failing in front of the people the site is for.
