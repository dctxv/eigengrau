## Cybersecurity: kept, read back, and noticed

*Reviewed on 29 September 2026 against `9b8c07c`; the repository was only read. Three parts were written independently to finish the unreviewed security draft (`ideas/security.md`, which stops in its CTF section): A (the proof, `/kept`, the Security drawer, the papers), B (the tools to check with) and C (Phosphenes). I opened every cited line, re-ran the offline evidence, and reconciled the parts with the summary's rulings, `decisions.md`, Engineering §3 (which owns the header config and the proxy code) and Free tools (which owns the tool frame). Everything here is defensive: nothing asks a visitor to forge, bypass or exploit anything, nothing touches a system that is not his, and each finding about his site comes with steps to confirm it on `localhost`. This document is public, as the review branch is, so it holds no Phosphenes answer: flags are shown as zeros, and the Blink's example uses SEEN, a word the build may not choose.*

### Review verdicts

| Idea | Verdict | Why |
|---|---|---|
| A1. The audit, re-checked (F1-F14) | KEEP WITH CHANGES | Every citation holds, and it catches engineering's JSON-LD line (`:42`, not `:40`). F14, a policy that makes the words vanish, is the best finding here. Fixes move to week 1, because this report is public (`decisions.md`, Engineering 4). F15 is added. The confirm scripts move into the repository. |
| A2. The enforced policy: a nonce, `'strict-dynamic'`, `worker-src 'self' blob:`, the rollout, a three-engine test | KEEP WITH CHANGES | Right, and verified. Graders must read production, because Vercel's previews sit behind its login. The proxy must skip files. The test must decide which header wins when `headers()` and the proxy both set one. |
| A3. An enforced floor from `headers()` | KEEP WITH CHANGES | Good depth; its interaction with the proxy's header is unverified, so a fallback is written. |
| A4. `Permissions-Policy`, twenty-eight names, two allowed | KEEP | Deny by default, as ruled, with `microphone=()`. |
| A5. CORP on the doors and static media | KEEP WITH CHANGES | `/api/urchi.png` needs its own `source` pattern; `/phos/` joins the list. |
| A6. Signed sleeve ids, strict `onHost`, fail closed, one `egress()`, a test per fence | KEEP WITH CHANGES | Fills real gaps in Engineering §3.2. Adds `NOTES` membership for songs too, and narrows previews to `itunes.apple.com`. |
| A7. `security.txt` and `robots.txt` as route handlers | KEEP WITH CHANGES | The robots comment is a light, which `MetadataRoute.Robots` cannot write. `security.txt` takes engineering's `.well-known` route if Next serves it, with part A's fields. |
| A8. Counts posted by the site, no Umami script | KEEP WITH CHANGES | Stricter than the ruling and inside it. Names and fields corrected to `decisions.md` item 7. |
| A9. No report endpoint, no Trusted Types, no COEP | KEEP | Each has evidence and a trigger. The endpoint's case rests on noise; the beacon already is a public POST route. |
| A10. `/kept` | KEEP WITH CHANGES | The best page in the plan. "Forget me", the three events as sent, no Claude Code on it (it is acknowledged once, on `/colophon`), `eigengrau:nova` skipped as an event, monospace from 7 December, a `.dev`-aware HSTS line, and part B's "What it asks your browser". |
| A11. "Try it", seven probes | KEEP WITH CHANGES | Honest. `javascript:void(0)`, because in the report-only week the probes really run. |
| A12. `grade.ts` | KEEP WITH CHANGES | Moot lines are not counted; `Cache-Control` is loose only with a nonce. |
| A13. The Security drawer | KEEP WITH CHANGES | Plaintext opens 7 December and Last login no earlier than January (`decisions.md`, Daily games 4). The "new" mark outside Notes is ink: the eye colour has three places. |
| A14-A16. Papers on 25 October, 8 November, 22 November | KEEP WITH CHANGES | Paper one is drafted from week-1 diffs. Paper three moves up a week, because the launch gate asks for three papers. |
| A17. A security reader's first sixty seconds | KEEP | It becomes a nightly test. |
| A18-A20. "One CVE, plainly", a violation counter, "Knocks" | CUT | His voice spent weekly, a count of extensions, and strangers choosing the site's writes and words. One static sentence survives. |
| A21. Which pieces lead, by role | KEEP WITH CHANGES | VECTOR leads `/plainly/security` in every season (`decisions.md`, 3). |
| B1. The four tools' shared rules | KEEP WITH CHANGES | The discipline the pages promise. Masking spares `WWW-Authenticate`; the beacon rule is narrowed. |
| B2. Headers, read | KEEP WITH CHANGES | Reads what scanners cannot reach. COEP is moot on a stranger's page, and `no-cache` without a nonce holds. |
| B3. Policy, read | KEEP WITH CHANGES | `'strict-dynamic'` with no nonce is "Broken", not "Open". |
| B4. A token, opened | KEEP WITH CHANGES | Decode-only, as decided. Counts `{ tool, format }`; "as sent" moves from `r` (the frame's reset) to `v`. |
| B5. A certificate, unfolded | KEEP WITH CHANGES | The most craft. `<domain>` in its sample, since none is bought; February if January is taken, still before 15 March. |
| B6. The monthly refresh Action | KEEP | None of his hours. |
| B7. An address, taken apart | KEEP (later) | On `QUEUE`'s rule. |
| B8-B10. How long it would hold; What kind of hash; What your browser says | CUT | Real passwords typed into a page; a cracking-mode picker; fingerprinting code on a page about restraint. Their defensive halves survive. |
| C1. Phosphenes from 1 November, eight lights by launch | KEEP | Proof before play; the gate's six hold even if the domain is late. |
| C2. One secret, derived season keys, PBKDF2 digests, ignored files, the guard | KEEP | Overrides Strategy §6.2's "rotate `PHOS_SECRET`": a season is a one-line commit. |
| C3, C6, C8, C10, C12, C16. The door, the note, the address, Seen in the dark, Small print, the back | KEEP | Each is looking, not breaking. Small print replaces every version of the keeper's pass, including Strategy §6.2's read-only one: a token kept in `localStorage` teaches the habit security readers flag. |
| C4. The pocket | KEEP WITH CHANGES | `?greet` prints it in development. |
| C5. The Blink | KEEP WITH CHANGES | The timing is right. It now honours reduced motion, as the icon's own blinks do (`LiveIcon.tsx:186`), with an opt-in on the hub; this overrides Strategy §6.2. |
| C7. The bed | KEEP WITH CHANGES | The phone reason is the missing network panel, since the chip moves into the nav in week 1. The header works in development. |
| C9. The hub | KEEP WITH CHANGES | Ink "new" mark; the Blink's opt-in. |
| C11. The fold | KEEP WITH CHANGES | The lantern prints its own console line, so devtools' link opens `lantern.ts`. |
| C13. The register | KEEP WITH CHANGES | It must read the resolved depths for that sky. |
| C14. The picture | KEEP WITH CHANGES | The chunk goes into engineering's `opengraph-image.tsx` response, not a static PNG that would fight it. |
| C15. The static | KEEP WITH CHANGES | The chip is on every screen from week 1; `static.wav` stays. |
| ADD 1. The supply chain | ADD | From the draft's §2.7, dropped by all three parts; `/kept` already promises it. |
| ADD 2. The confirm scripts and the trap test, in the repository | ADD | The papers' steps must name files he has. |
| ADD 3. What a picture knows | ADD (later) | The tools frame gives a metadata reader to security; the most useful check for non-developers. |

#### Checked against the repo

1. **Citations.** Every line cited was opened at `9b8c07c`. Corrections: the JSON-LD is `layout.tsx:42` (part A right, Engineering §9's `:40` wrong); `loader.ts` is `src/engine/common/loader.ts` and the `attention.ts` cited is `src/engine/urchi/attention.ts`; the live icon is 32 px (`LiveIcon.tsx:11`), drawn at 16 in a tab strip; a note's body renders at `NotesPanel.tsx:623`; a star depth's response is the layer's `zoomResponse` times the band's (`Stars.ts:308`), 1 today (`defaults.ts:38`); under reduced motion the icon still falls asleep as a cut (`LiveIcon.tsx:199-201`) but neither blinks nor peeks (`:186`, `:202`); `eigengrau:nova` (`ThreadScene.ts:520`) is an event, not a key; `Mask.tsx:6` takes a `style` prop; `?hour=` works in production (`hours.ts:21-28`), harmlessly.
2. **Re-run, offline.** `onhost.mts` accepts port 8443, port 22, a user and password, an `.svg` and `a.apple.com:444`, and refuses the lookalikes. The tripwire gets `200 image/svg+xml` from `/api/cover` with no `nosniff` and no policy, and one `/api/preview` request makes four store searches, all `redirect: follow`. `curl -sI localhost:3000` matches every header quoted below, and `/robots.txt`, `/.well-known/security.txt`, `/sitemap.xml`, `/.env` and `/wp-login.php` all 404. Seven commits carry +10:00; the first commit is 00:33 on Friday 25 September in Melbourne. `package.json:16-23` lists six runtime dependencies; Next 16.3.6 reads the nonce from either request header (`app-render.js:209`); troika's worker lines hold.
3. **Conflicts settled here.** Event names and "Forget me" (`decisions.md`, 6 and 7). Plaintext and the monospace on 7 December; Last login from January (Daily games 4). Proxy fixes in week 1. Claude Code named on `/kept` (removed). Paper three against the launch gate (moved). VECTOR first on `/plainly/security`. The eye colour's three places against the drawer's and hub's dots. `robots.ts` and a static card PNG against the lights. Strategy §6.2's keeper's pass, secret rotation and Blink under reduced motion (each overridden, with reasons). The tools index's wording, "to check things with". The domain: part B used `dariustan.dev`. The standing decision is that nothing is bought yet, a domain is bought before launch week, and preload follows a month after it goes live. Inside that, `decisions.md` item 2 sets the date: `dariustan.dev`, or the first free one of three others, bought by Friday 9 October, with preload on Monday 9 November. The name depends on which is free, so samples say `<domain>`, and the dates below follow item 2, with launch week as the latest the domain can arrive. Vercel's preview protection. The sound chip moving into the nav in week 1 (Style R4).
4. **New or unverified, marked where used:** `watch.expect()`; `document.featurePolicy` (Chromium only); crt.sh's `?q=<sha256>`; Umami accepting a minimal payload; which header wins between `headers()` and the proxy; Safari's changing favicon; hidden-tab timer wake-ups (not observable in this container); the first two lifetime rows and the day count of the Baseline Requirements.

### Refined proposal

In priority order: the proof, `/kept`, the Security drawer, the papers, the tools, Phosphenes, then later ideas and the role matrix. Engineering §3.1-3.2 stands as written, with the summary's overrides; the proof adds only what it lacks.

#### 0. The order, and the dates (his time)

| When | Proof and reading | Papers | Tools | Phosphenes |
|---|---|---|---|---|
| Week 1, 30 Sep-4 Oct | The proxies closed with their tests (F1-F3, F7, F15); `egress.ts`; signed sleeves and songs; F12, F13; the JSON-LD escaped; the supply chain; private reporting, push protection, CodeQL | | | |
| Week 2, 5-11 Oct | `headers()`: static policy in report-only, the enforced floor, `Permissions-Policy`, CORP, HSTS; `security.txt`, `robots.txt`; `count.ts`; the nightly three-engine test; the domain bought by Fri 9 Oct (`decisions.md` item 2) | | | |
| Week 3, 12-18 Oct | The nonce policy in report-only; style attributes moved; `/kept` v1; the clean week begins | | | |
| Week 4, 19-25 Oct | | One, Sun 25 Oct | | |
| Week 5, 26 Oct-1 Nov | Enforced from Mon 26 Oct at the earliest | | | Hub and five lights, Sun 1 Nov; six with the address, as planned, once the domain resolves |
| Week 6, 2-8 Nov | | Two, Sun 8 Nov | | |
| Week 7, 9-15 Nov | The notes Action and its guards (Strategy §7.2); HSTS `preload` on Mon 9 Nov, a month after a domain live on 9 Oct | | | |
| Week 8, 16-22 Nov | The domain at the latest, if 9 October slipped; A+ on both graders | Three, Sun 22 Nov | | The address, if the domain slipped; the fold and small print, Sun 22 Nov |
| Week 9, 23-29 Nov | Public launch | | | |
| December | HSTS `preload` here only if the domain slipped to week 8: a month after it goes live | | Headers and Policy 7-11 Dec; Token 14-16 Dec | Register 13 Dec; picture 27 Dec |
| Jan-Mar 2027 | `security.txt` renewed by 2 March | | Certificate 11-22 Jan; the March note | Static 17 Jan; back 7 Feb; season ends 1 Mar |

#### 1. The proof

Engineering's plumbing stands: the `headers()` block, `proxy.ts` generating a nonce, signed previews with one re-checked hop, the cover fixes, and `/api/now`'s timeout, cache, `at` and `ok`, with the summary's `microphone=()`. What follows is only what it lacks. Part A checked it by reading every route, `next.config.ts`, `layout.tsx`, `Shell.tsx`, `add-note.mjs`, troika's worker code and Next's nonce handling; by running the host check and the real handlers offline; and by injecting candidate policies into the dev server with Playwright. `npm audit` (with and without `--omit=dev`) reports nothing, and `npm run typecheck` is clean. Only Chromium is installed here, so browser claims are Chromium's; the CI job runs Firefox and WebKit too.

##### 1.1 The audit, re-checked

Severity is for this site: no accounts, no cookies, no user data. Two findings are real, one is a trap for the fix itself, and the rest are hygiene a security reader will notice.

| # | Severity | Finding | Where | Fix |
|---|---|---|---|---|
| F1 | **Medium** | `/api/cover` fetches from **any port, path and subdomain** of `mzstatic.com` and `dzcdn.net`, userinfo allowed, following redirects anywhere with no timeout. The id is the URL itself, base64url and unsigned. Confirmed: `onHost` accepts `https://is1-ssl.mzstatic.com:8443/probe`, `https://anything.dzcdn.net:22/` and `https://user:pw@is1-ssl.mzstatic.com/x.jpg`. | `songs.ts:111-119` (scheme and suffix only), `:218-222`; `cover/[id]/route.ts:25-28` | Signed ids, no port or userinfo, one re-checked hop, a timeout (§1.4; Engineering §3.2) |
| F2 | **Low** (conditional) | Upstream `Content-Type` is served **same-origin**, cached a day as `immutable`, with no `nosniff` and no policy on the bytes. Confirmed: an SVG answer comes back `200 image/svg+xml`, and opened directly, a script in it would run on this origin. It needs an allowed host to serve hostile bytes (a dangling subdomain, which the suffix match accepts): someone else's failure, hence Low. | `cover/[id]/route.ts:9-15`; `preview/route.ts:43-46` | Images (not SVG) and audio only; `nosniff`; `default-src 'none'; sandbox` (Engineering §3.2) |
| F3 | **Medium-Low** (cost) | `/api/preview` is an open search-and-stream proxy for any song in two catalogues. A miss costs **four** store searches, a Deezer hit adds a lookup, and about 1 MB streams through the function. Unique queries miss every cache, and Apple throttles per address (about twenty calls a minute), so a scraper could silence the site's own previews and bill him for egress. | `preview/route.ts:27-55`; `songs.ts:186-191, 205` | Signed songs only, one re-checked hop (the summary's ruling) |
| F4 | Low | **Hotlinking.** Any site can embed `/api/cover/…` or `/api/preview?…`, and his functions pay. | no `Cross-Origin-Resource-Policy` | CORP `same-origin` (§1.3) |
| F5 | Low as a bug, first as a signal | **No security headers.** `poweredByHeader: false` is the only hardening. | `next.config.ts:3-8` | Engineering §3.1, §1.2-1.3 |
| F6 | Low | `/api/now` is `force-dynamic` with no `Cache-Control`, so every poll from every tab runs a function; `call()` has no timeout; a failure answers as an empty week. | `now/route.ts:8, 73-78, 231-234` | Engineering §3.2 |
| F7 | Info | No size cap on proxied bodies; the preview passes the upstream `Content-Length` through. | `cover/[id]/route.ts:10`; `preview/route.ts:47-48, 50` | 2 MB covers, 5 MB previews, counted on the stream |
| F8 | Info (good) | **Fails closed and quietly.** Every route answers empty or 404 on failure. The Last.fm key is read at `now/route.ts:157`, used only in `call()`, and never echoed; no answer depends on a request header; inputs are bounded (`MAX_PARAM`, the hash shape); `X-Preview-Link` is https and pinned (`songs.ts:206`) and rendered `noopener noreferrer` (`MusicPanel.tsx:1356-1359`); every URL knob is parsed before use (`?tag=` against the list, `?hour=` clamped, `?sky=` cut to 64, `?debug=1` development-only); `/dev/suit` is dead in production; `.env*` is ignored (`.gitignore:34`), and the history holds no key. | as cited | Keep, and say so on `/kept` |
| F9 | Info | What it gives away: his **seven** hand-made commits carry +10:00 (Claude's 129 carry +00:00; the draft said "every commit"); the zone is still a TODO (`site.ts:16`), now decided as `Australia/Melbourne` (`decisions.md` item 1); one handle on GitHub and Instagram; the address in `ELSEWHERE` (`site.ts:40-44`) is his commits' address; Music publishes what is playing and when the last song ended (`now/route.ts:214`). | as cited | A decision, said on `/kept` (§2) |
| F10 | Info | No `security.txt`, `robots.txt`, CI, Dependabot, branch rules or `LICENSE`. `npm run note` commits and pushes to `main` (`add-note.mjs:4, 175-196`), so every note is a deploy. | repo root | Engineering §3.4; §1.5, §1.7 |
| F11 | Low (latent) | The JSON-LD goes into `dangerouslySetInnerHTML` unescaped: safe while he writes every string, unsafe once GitHub descriptions arrive. It is also written through `innerHTML` on the client, at least in development. | `layout.tsx:42` | `.replace(/</g, "\\u003c")` (Engineering §9) |
| F12 | Info | Last.fm track links are not pinned: `t.url` reaches `href` unchecked. React 19 blocks `javascript:` URLs, and Last.fm is trusted. | `now/route.ts:70, 196` → `MusicPanel.tsx:1409` | `onHost(t.url, ["last.fm"])`, as `songs.ts:206` does |
| F13 | Info | **Characters you cannot see.** `add-note.mjs` collapses whitespace (`:107`) and writes with `JSON.stringify` (`:114-115`), which escapes C0 controls but passes bidirectional controls (U+202A-202E, U+2066-2069) raw into `site.ts`. They cannot run, but they make a line of source read differently from what it is (the "Trojan Source" shape) and reorder the note on the page. | `scripts/add-note.mjs:107, 114-115` | Strip them in the writer; the content lint fails on them (paper three) |
| F14 | **Medium** (availability; a trap in the fix) | **The policy can make the words disappear.** troika builds workers from `blob:` URLs (`troika-worker-utils.esm.js:381-384`) and loads its own modules inside them with `importScripts(blob:)` (`:94-101`). Its main-thread fallback (`:212-236`) waits for `new Worker` to *throw*, but Chromium refuses a blocked worker *asynchronously*. So `worker-src` without `blob:` never starts the worker, and About's statement never draws; and `worker-src blob:` without `'strict-dynamic'` (engineering's step one) starts it, then refuses its `importScripts` ("failed to rehydrate"), and the statement never draws either. The second violation is raised **inside the worker**, where a page's `securitypolicyviolation` listener hears nothing. | as cited; Projects and About | `'strict-dynamic'`; `worker-src 'self' blob:`; CI listens to worker consoles (§1.2) |
| F15 | Info (new) | **Previews trust every `apple.com` host.** `PREVIEW_HOSTS` holds `apple.com` because Apple's previews come from `audio-ssl.itunes.apple.com`; the suffix match accepts any Apple host, and with F1 any port. Links need `apple.com` (`music.apple.com`, `songs.ts:28`), but they are never fetched. | `songs.ts:26, 202, 205` | Fetch previews only under `itunes.apple.com`, after a week of logging refused hosts (§1.4) |

**Confirm F1-F3 on localhost, touching no one.** Both scripts are in the review's scratchpad today. The week-1 branch's first commit copies them into `scripts/security/` (new), where they print the findings; its fix commit makes them print refusals, and the same tripwire becomes `cover.test.ts` and `preview.test.ts`.

*Ruled in the summary: one runner, Vitest, with scripts run under `tsx` so the `@/` alias works everywhere. In the repository both scripts are TypeScript run with `npx tsx`; the scratchpad originals used Node's type stripping and `jiti`.*

```bash
# The host check, as pure functions (no network): ACCEPT for the port, the userinfo and the .svg
npx tsx scripts/security/onhost-cases.ts
# The real handlers, with fetch replaced by a tripwire that logs and refuses (nothing leaves the machine)
npx tsx scripts/security/tripwire.ts
# cover -> 200 image/svg+xml | nosniff: null | csp: null
# preview -> 404 no-store
# https://is1-ssl.mzstatic.com:8443/probe  redirect=follow (default)
# https://itunes.apple.com/search?term=Anyone+Anything+at+all…  (and three more searches)
```

The harness imports the TypeScript routes through the `@/` alias under `tsx` (the scratchpad copy loads them with the project's own `jiti`); the SVG answer is made up inside the tripwire, never fetched.

**Corrections to the draft, so nothing is built from it by mistake.** Under `'nonce-…' 'strict-dynamic'`, an inline script *created by a trusted script* runs (verified in Chromium): a nonce stops injected markup (inline handlers, `javascript:` URLs, parser-inserted scripts), not what trusted code starts, and the probes in §2 are rebuilt on that. `strict-origin-when-cross-origin` still sends GitHub the origin; it is `rel="noreferrer"` (`AboutPanel.tsx:77`) that hides the site from GitHub's traffic page, so it comes off and `noopener` stays. The draft's `https: 'unsafe-inline'` fallbacks are dropped: browsers that know nonces ignore them, but a reader does not. Next reads the nonce from either request header (`app-render.js:209`), so the report-only week needs no pretend enforcing header. The summary overruled the draft's `redirect: "error"`, recomputed songs, path-scoped policies, `preload` now, and "No analytics".

##### 1.2 The enforced policy, and how it gets there

`src/lib/security/policy.ts` (new) is the one source: `proxy.ts` imports it, and `/kept` compares what arrived with it.

```
default-src 'self'; script-src 'nonce-{N}' 'strict-dynamic'; style-src 'self' 'nonce-{N}'; style-src-attr 'none';
img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self';
frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

- **`'strict-dynamic'` is load-bearing.** It lets Turbopack's loader start the site's own chunks, and lets troika's workers `importScripts` their `blob:` modules, since CSP3 allows any fetch that is not parser-inserted. Without it the words on Projects and About never draw (F14).
- **`worker-src 'self' blob:`** is the only place `blob:` appears. `img-src data:` covers the live favicon (`LiveIcon.tsx:89, 101`) and Music's grain (`tone.ts:476`). Grain adds `img-src blob:` in its own commit. `frame-src 'none'` until a `/lab` demo exists.
- **`style-src-attr 'none'`** needs three server-rendered style attributes moved: `layout.tsx:36` (`--vv-bottom-inset` into `:root` in `globals.css`, still overwritten through the CSSOM by `lib/viewport.ts`) and `projects/[slug]/page.tsx:35` and `:49` (a class, and `width`/`height` attributes). The CSSOM stays allowed, so `el.style.x = …` and GSAP are untouched (verified). A lint rule, `react/forbid-dom-props` for `style` under `src/app/**`, catches pages; the e2e test is the real guard, because `Mask.tsx:6` takes a `style` prop and a shared server-rendered component would slip past the rule.
- **The `<noscript><style>`** at `layout.tsx:44` gets `nonce={nonce}`. **Development** adds `'unsafe-eval'`, `'unsafe-inline'` for styles and `ws:`, as Next's guide says.

**The rollout.** Week 2 (by Sunday 11 October): engineering's static policy, with `'unsafe-inline'`, as `Content-Security-Policy-Report-Only` from `headers()`; it is never enforced. Week 3 (by Sunday 18 October): `proxy.ts` sends the nonce policy report-only, and the static one goes. Then **the clean week**: seven consecutive nightly runs with zero violations on every route, in Chromium, Firefox and WebKit, page and workers both. Week 5 (Monday 26 October at the earliest): the same string, enforced.

**What the plumbing must also do.**
- **A floor that survives a skipped proxy.** `headers()` sends an *enforced* `Content-Security-Policy: object-src 'none'; base-uri 'none'; frame-ancestors 'none'` on every path. If the proxy is ever skipped, as CVE-2025-29927 allowed in unpatched Next from 11.1.4 to 15.2.2 (16.3.6 is not affected), the floor holds. Week 3 settles two unknowns against production (Vercel's previews sit behind its login, and a report-only policy in production breaks nothing): whether Next sends both headers when `headers()` and the proxy each set one, and whether either grader misreads two policies. If the floor replaces the proxy's policy, or a grader misreads the pair, the floor's `source` leaves out document routes, and the nonce test carries documents.
- **The nonce is never cached for someone else.** Dynamic pages send `private, no-store`, and the test asserts two loads get two nonces.
- **The proxy runs only for documents.** Its `matcher` leaves out `/_next/`, `/api/`, `/audio/`, `/fonts/`, `/work/`, `/phos/`, `/.well-known/` and the metadata files, each of which is static or answers for itself, and prefetches (`missing: next-router-prefetch`), as Next's own CSP guide recommends. Every proxy call is an invocation he pays for.

**The test that decides "clean"**: `e2e/csp.spec.ts` (new), on pull requests and nightly against production.
- `page.on("console")` **and** a `securitypolicyviolation` listener, since a worker's refusals appear only in the console. It fails on `/Content Security Policy|importScripts|failed to rehydrate|Permissions-Policy/`.
- **The words drew.** `AboutScene` and `ThreadScene` set `document.documentElement.dataset.words = "drawn"` when troika's first `sync` completes (a new hook), and the test waits for it on `/about` and `/projects`.
- **Headers present:** the full policy on documents, the floor everywhere, two nonces on two loads, and exactly one `Strict-Transport-Security` (Vercel adds its own).
- **Browsers:** it adds `npx playwright install --with-deps firefox webkit` to engineering's Chromium-only job.
- **The trap, kept understood:** `e2e/csp-traps.spec.ts` (new) loads About under the two wrong policies and asserts the words do **not** draw, so a troika upgrade that changes the trap is noticed.

##### 1.3 Headers engineering's block lacks

- **`Permissions-Policy`, in full.** The site uses two controlled features: the clipboard for "Email copies" (`AboutPanel.tsx:52`) and media played after you ask (`sfx.ts:200`, `loader.ts:46`).

  ```
  accelerometer=(), autoplay=(self), bluetooth=(), browsing-topics=(), camera=(), clipboard-read=(), clipboard-write=(self),
  display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), local-fonts=(),
  magnetometer=(), microphone=(), midi=(), otp-credentials=(), payment=(), picture-in-picture=(), publickey-credentials-create=(),
  publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), web-share=(), xr-spatial-tracking=()
  ```

  Twenty-eight names, two allowed. An unrecognised name prints a console warning, and the CI job fails on any, so the list corrects itself. Grain adds `camera=(self)`, Sky `web-share=(self)`, That night `geolocation=(self)`, each in the commit that first uses it.
- **On the doors** (`/api/:path*`): `Cross-Origin-Resource-Policy: same-origin` and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; sandbox`, on every API answer. `/api/urchi.png` gets `cross-origin` instead, for GitHub's image proxy; write the doors' rule as `source: "/api/:path((?!urchi\\.png$).*)"` so the two values never both arrive.
- **On static media** (`/audio/`, `/fonts/`, `/work/`, `/phos/`): CORP `same-origin`. Crawlers are not browsers, so link cards are unaffected.
- **COEP is not sent,** and `/kept` says so as a choice. **About's links** keep only `rel="noopener"`.

##### 1.4 What the proxies' fixes lack

- **`onHost` refuses ports and userinfo:** `u.port === "" && !u.username && !u.password` at `songs.ts:115`, and `https://a.mzstatic.com:8443/`, `https://u:p@a.mzstatic.com/` and `https://a.apple.com:444/` join engineering's test list.
- **Sleeve ids are signed, as songs are**, by the summary's rule "signs what it hands out". `artId(url)` becomes `x-<b64url(url)>.<hmac>`, with `HMAC-SHA256(PREVIEW_SECRET, "cover\0" + url)` cut to 22 characters and compared with `timingSafeEqual`; songs sign `"preview\0" + …`, so one secret serves both and neither signature passes for the other. Sleeve signatures carry no date, so a sleeve kept in a note never expires. Sleeves and songs listed in `NOTES` also pass by set membership (the addendum's "Holocene was on"; `preview/route.ts:27-30` gains the check), so rotating the secret never breaks an old note.
- **Fail closed in production:** `if (!secret) return process.env.NODE_ENV === "production" ? refuse() : allowWithWarning()`. A forgotten variable silences previews instead of opening them.
- **One egress module**, `src/lib/security/egress.ts` (new). Every server `fetch` goes through `egress(url, init)`: the host against one `EGRESS` list, https, no port, no userinfo, no trailing dot; `redirect: "manual"`, following one `Location` only if it passes the same check; five seconds unless told otherwise. `EGRESS` today: `ws.audioscrobbler.com`, `lastfm.freetls.fastly.net`, `itunes.apple.com`, `api.deezer.com`, and the suffixes `mzstatic.com`, `apple.com` and `dzcdn.net`. For a week it logs every preview host it would refuse under `itunes.apple.com`; if none appears, `apple.com` narrows to `itunes.apple.com` for fetches (F15), leaving six kinds of address. `api.github.com` joins with `/api/pulse`. `no-restricted-globals: fetch` under `src/app/api/**` keeps it the only door.
- **A test for every fence** (Vitest, `fetch` stubbed):

  | File | Asserts |
  |---|---|
  | `src/app/api/cover.test.ts` | An unsigned or foreign `x-` id is a 404 **and `fetch` is never called**; a redirect out of `EGRESS` is a 404 after one fetch; a second redirect is refused; SVG and HTML upstream are 404s; a 3 MB body is cut off; every answer has `nosniff`, the sandbox policy and CORP; the junk-hash 404 has `max-age=300` |
  | `src/app/api/preview.test.ts` | A missing, bad or tomorrow's signature is a 404 before any search; today's and yesterday's pass; production with no secret refuses; `audio/*` only; `X-Preview-Link` stays https and pinned |
  | `src/app/api/now.test.ts` | The key appears in no answer, good or failed; `ok: false` on failure; `Cache-Control`; the timeout |
  | `src/lib/security/egress.test.ts` | Every host outside the list, every port and userinfo form, and `javascript:` are refused |
  | `src/lib/security/routes.test.ts` | Every `src/app/api/**/route.ts` has an entry in the threat model (§2), so no route ships without its two sentences |

##### 1.5 `security.txt` and `robots.txt`

- **`src/app/.well-known/security.txt/route.ts`** (`dynamic = "force-static"`), where Engineering §3.1 now places it. If the first build shows that Next does not serve a dot-folder, use `src/app/security.txt/route.ts` with a `rewrites()` entry from `/.well-known/security.txt` (RFC 9116 accepts the top-level path too). `Canonical` and `Policy` follow `SITE_URL`. `EXPIRES` is a hand-edited constant in `src/content/kept.ts` (new), so a human has to look again, and the content lint fails when it is under thirty days away. It is not signed: a key he does not maintain is worse than none. Turn on GitHub's private vulnerability reporting, free on a public repository.

  ```
  Contact: mailto:<his address, with +security before the @>
  Contact: https://github.com/dctxv/eigengrau/security/advisories/new
  Expires: 2027-03-31T13:00:00.000Z
  Preferred-Languages: en
  Canonical: https://<SITE_URL host>/.well-known/security.txt
  Policy: https://<SITE_URL host>/kept#if-you-find-something
  Acknowledgments: https://<SITE_URL host>/kept#thanks
  ```

  `Expires` is midnight on 1 April 2027 in Melbourne, six months out.
- **`src/app/robots.txt/route.ts`** (new, static) replaces engineering's `robots.ts`, because `MetadataRoute.Robots` cannot write the comment that is Phosphenes' first light (§6.3.1). It disallows `/api/` and `/dev/`, points at the sitemap, and, once Phosphenes is planted, adds `Disallow: /phosphenes` and the comment, whose value is derived at build so the repository never holds it.

##### 1.6 Counts without anyone else's script

The ruling is Umami, cookieless, proxied same-origin, named events only. The strictest way to honour it is **not to load Umami's script at all.**
- `src/lib/count.ts` (new) exports `EVENTS`, exactly as `decisions.md` item 7 fixes them: `game_finished { game, n, streak: "1" | "2-6" | "7+" }`, `find_taken { tier }` and `tool_export { tool, format }`. `count(name, fields)` is typed from it, so nothing else can be sent.
- It returns at once if `navigator.globalPrivacyControl` is true or `navigator.doNotTrack === "1"`. Otherwise it posts one JSON event to `/u/api/send`, rewritten to `https://cloud.umami.is/api/send`: the website id, the hostname, the path without query or hash, the name and its fields. Confirm once that Umami accepts it without `screen` and `language`; if not, add `language` only.
- **No page views.** The site never runs a third party's code, `connect-src 'self'` holds, and `/kept` can say "It runs only its own scripts" without a footnote.
- *Decided in `decisions.md` item 7: Umami Cloud, with its script and endpoint proxied under `/u/` and automatic page views off. Posting the three events without the script keeps every part of that decision except the script, which it did not need, so this stands; if Umami refuses the minimal payload, the proxied script with `data-auto-track="false"` is the fallback.*
- Before `/kept` describes what Umami receives, the branch sends one test event from a preview, and he reads the country it recorded on his first weekly look (item 7's habit, so it costs him nothing extra): one far from Vercel's region means the rewrite forwards the visitor's address, and `/kept` says so. `src/content/kept.ts` then quotes Umami's privacy page for what it derives, and the sentence is rechecked at every Umami change. A test renders `/kept`'s list from `EVENTS`.

##### 1.7 The supply chain (new, from the draft's §2.7)

"It installs from a lockfile and nothing else" is a line `/kept` prints (§2, block 9). Four settings and one CI step make it true.
1. **The lockfile is law.** Vercel's Install Command becomes `npm ci`, so the `^` ranges on `three`, `gsap` and `troika-three-text` (`package.json:16-23`) cannot drift at deploy.
2. **Updates wait three days.** Engineering's `.github/dependabot.yml` gains `cooldown: { default-days: 3 }`. A cooldown holds version updates only; security updates still open at once, and none is merged automatically. Why: in September 2025 a phished maintainer's `chalk` and `debug` releases, then the Shai-Hulud worm, put malicious versions on npm, and most were pulled within hours.
3. **Audit in CI.** `check.yml` runs `scripts/audit.mjs` (new, about twenty lines): `npm audit --omit=dev --audit-level=high --json`, failing on a high finding in a runtime dependency. A finding with no fixed release is pinned with `overrides` if a fixed transitive version exists; otherwise its advisory id goes in `.github/audit-allow.txt` with a date and a reason, and fails again thirty days later.
4. **GitHub's own guards,** his five minutes once: private vulnerability reporting (a `security.txt` contact), secret scanning with push protection, and CodeQL's default setup, all free on a public repository. `gitleaks detect` runs once over each public history before its Source link (decided).
5. **Said honestly.** `provenance.json` records the audit at build, so `/kept` says "On the day this was built, npm audit knew of nothing wrong with any of it," or, when it did, "npm audit knew of two advisories, both in tools used only to build it. Neither reaches your browser."

**Cut from the draft:** `actions/attest-build-provenance` (Vercel builds what is served, so an Actions attestation describes another artefact) and the line "Agents are fast, not careful" (Claude Code is acknowledged once, on `/colophon`). **Edge:** `npm run note` still pushes to `main`; the Vercel build's tests gate every push. **Effort:** S, half a day. **Shows:** supply-chain hygiene with dates and reasons. **Risk:** a wanted release waits three days, which is the point.

##### 1.8 Two things decided out

**A CSP report endpoint (`/api/csp`).** It would add reports only from browsers the nightly job does not run, and most would be extensions injecting their own scripts. It would be a second public POST route beside the beacon, taking attacker-written bodies, with `console.warn` as its only sink. It fails the rule that a server route exists only when there is no other way: the three-engine job is the other way, and it hears the workers. *Changes if* a person reports a violation the nightly job missed: then the draft's minimal version (an 8 KB counted cap; directive, blocked scheme and host, path without query; newlines escaped; `204`), with `Reporting-Endpoints` in the same commit.

**Trusted Types.** The report-only probe found three kinds of sink: Turbopack's loader setting `HTMLScriptElement.src` from plain strings on every route, troika's `Worker` constructor twice on `/projects` and `/about`, and the JSON-LD through `innerHTML` (React's development tools add `eval`). No policy was created; Next's own `nextjs` policy (`client/trusted-types.js`) serves the Pages Router's loader, not this one. Enforcing would need a catch-all `default` policy, the weak point Trusted Types exists to remove, and the only HTML sink the site writes is its own JSON-LD. The nonce policy already refuses injected handlers and `javascript:` URLs. *Changes if* the site ever writes text it did not write into an HTML sink, or Next names a policy for its loader: then a report-only week, with named policies only.

##### 1.9 A security reader's first sixty seconds, after the fixes

**0-10 s, `curl -sI https://<site>/`:**

```
HTTP/2 200
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
content-security-policy: default-src 'self'; script-src 'nonce-Zm9v…' 'strict-dynamic'; … frame-ancestors 'none'; upgrade-insecure-requests
content-security-policy: object-src 'none'; base-uri 'none'; frame-ancestors 'none'
cross-origin-opener-policy: same-origin
permissions-policy: accelerometer=(), autoplay=(self), … microphone=(), … xr-spatial-tracking=()
referrer-policy: strict-origin-when-cross-origin
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: DENY
```

No `x-powered-by` and no `set-cookie`; `server: Vercel` is the host naming itself. A second `curl` shows another nonce. `curl -sI /api/cover/zz` answers `404` with `max-age=300`, the sandbox policy, CORP and `nosniff`, and `curl '/api/preview?artist=a&title=b'` is a 404 before any store is asked.

**10-20 s, `/robots.txt`:** `/api/` and `/dev/` disallowed, the sitemap, and from week 5 `Disallow: /phosphenes` with a comment under it. A reader who knows robots is not a fence smiles, and follows it. **20-30 s, `/.well-known/security.txt`:** two contacts, an `Expires` six months out, a `Policy` pointing at `/kept`. **30-45 s, view-source:** `<html lang="en">` with no `style`; `nonce="…"` on every `<script>` and on the `<noscript><style>`; no third-party `src`; the JSON-LD with `<` as `\u003c` and `jobTitle` set to `WORK_LINE`; a per-route canonical; real text in the `sr-only` mirrors; no telling comments. **45-60 s, the console:** no red and no yellow, and from week 5, once a visit, "You opened the back of it. Most people never do." Now they have two threads to pull.

**Afterwards:** A+ on securityheaders.com and the Mozilla Observatory is the launch gate's item, with no `'unsafe-inline'` or `'unsafe-eval'` anywhere to flag. This section becomes `e2e/first-minute.spec.ts` (new), nightly against production.

---

#### 2. `/kept`, "How this site is kept"

**Pitch.** One quiet page that reads the site's own headers back to you, tries a few things in front of you, and says plainly what could go wrong, what stops it, and what the site gives away.

**How it works, top to bottom.** Block labels are grotesk 11px at 60% ink; the words are serif; header names and values are grotesk 11px with tabular figures until the monospace lands on Monday 7 December, then `--t-data` (Style R18).

**1. Head.**
> **Kept**  How this site is kept, and what it gives away.
>
> It is a small site, so it can afford to be strict. It runs only its own scripts. It fetches pictures and songs through its own door, from six kinds of address and no others. What it remembers of you stays in your browser, and it counts three things without knowing who did them. It says all of this in its headers, which this page reads back to you now.

"Six" is `countWord(EGRESS.length).toLowerCase()` (seven until F15's week of logging ends), and "three" is `EVENTS`'s length.

**2. What your browser was told.** `ReadBack.tsx` (new, client) calls `readOwn()` (§5.2) for this page, with `HEAD` and a `GET` fallback, and for `/api/cover/-`, a junk id that is a cached 404 and never goes upstream. It passes both to `grade()`, prints one line per header, shows this document's nonce (`document.querySelector("script[nonce]")?.nonce`) and the fetched one at four characters each, and compares what arrived with `policy()`. Lead: "These are the headers this address sends. Your browser had the same a moment ago, with a different nonce."

| Header | Kept (sample) | Otherwise |
|---|---|---|
| Content-Security-Policy | "Scripts run only with this visit's nonce, k3xP…, and whatever they start. The one just fetched was 9fQa…; the next visit gets another. Nothing framed, no plugins, no base to rewrite, nothing fetched from anywhere but here. Arrived as written." | Report-only: "Written down, and watched for a week before it is enforced." Drift: "Differs from what the code says: {directive}." Absent: "No policy. Anything that got into the page could run." |
| Strict-Transport-Security | "Two years, every subdomain. Your browser will not come here any other way until October 2028. Not on the preload list yet, on purpose: the address is new." (The date is the visit's plus `max-age`.) | "Only {n} days." Over http: "Not here: this is a copy on his machine." On a preloaded ending such as `.dev`: "Not on the list by name, and it need not be: every .dev address is." |
| X-Content-Type-Options | "nosniff. A file is what it says it is, or nothing." | "Absent. A browser may guess what a file is." |
| Referrer-Policy | "Other sites learn only that you came from here, never which page." | "Other sites are told which page you came from." |
| Permissions-Policy | "Twenty-six things a page can ask for, from the camera to the microphone, refused before anyone asks. Two are allowed, for this site only: copying my address, and playing sound you asked for." | "Absent. Every feature is left to its default." Where `document.featurePolicy` is missing (it exists only in Chromium): "Your browser does not say which of these it honours." |
| Cross-Origin-Opener-Policy | "same-origin. A window that opened this one cannot reach into it." | "Absent." |
| Framing | "No one can put this page inside theirs." | "Absent. This page can be framed." |
| Cache-Control | "private, no-store. This page and its nonce are never kept for anyone else." | "Cacheable, with a nonce in it." |
| CORP (the doors) | "same-origin. Other sites cannot borrow its pictures and songs." | "Absent. Anyone can embed them." |
| Cross-Origin-Embedder-Policy | "Not sent, on purpose. It buys precise timers and shared memory, and nothing here uses either." | — |

Also, uncounted: "Nothing says what it is built with. The colophon does, in sentences." And: "No cookies. Your browser would not let this page read one anyway; the tests check that the server sends none." **The verdict**, serif: "Nine of ten. The tenth is not sent, on purpose." On a regression: "Seven of ten. Two did not arrive, which is my fault. The tests should have stopped it." Under it, grotesk 12 at 60%: "Read any site's headers this way.", linking to `/tools/headers`.

**The grader,** shared with Headers, read: `src/lib/security/grade.ts` (new; pure, no DOM, no fetch).

```ts
export type Mark = "kept" | "loose" | "absent" | "chosen" | "moot";
export type Line = { name: string; value: string | null; mark: Mark; facts: string[] }; // codes, e.g. "csp.report-only", "hsts.years:2"
export type Reading = { lines: Line[]; kept: number; of: number };
export type Context = { https: boolean; document: boolean; chosen?: Partial<Record<string, string>> };
export function grade(headers: Iterable<[string, string]>, ctx: Context): Reading;
export function readPolicy(csp: string): { directives: Map<string, string[]>; flags: string[] }; // several policies read as their intersection
```

It grades facts, not words: `/kept`'s sentences live in `src/components/kept/words.ts`, and the tool words the same facts for a stranger's site. Only `/kept` passes `chosen`. A policy is `loose` if report-only, or if `script-src` has `'unsafe-inline'`, `'unsafe-eval'`, `*`, `https:` or `data:`, or if `object-src` or `base-uri` is missing, or with no nonce or hash; `'unsafe-inline'` beside a nonce still counts ("A browser that knows nonces ignores it. A reader does not."). HSTS is `kept` at a year or more, and `moot` over http. **Moot lines are not counted**, so `of` never marks a stranger down for COEP. **`Cache-Control` is `loose` only on a page carrying a nonce.** Golden tests (`grade.test.ts`) cover this site's expected headers, a bare Next app, a report-only policy, `'unsafe-inline'` with a nonce, `max-age=300` HSTS and two policies.

**3. Try it.** A glass chip. Lead: "Seven things, tried here, now: six a page should not let happen, and one it should. The addresses do not exist, so nothing would reach anyone even if one got out." `src/lib/security/probes.ts` (new) runs them in order and listens for `securitypolicyviolation`, naming the directive that answered in machine voice. In the report-only week, `e.disposition === "report"` turns each "Stopped." into "It would have been stopped. This week the policy only watches." The outcomes were verified in Chromium against §1.2's policy.

| Probe | Result |
|---|---|
| `new Function("return 1")()` | "A line of code, written as a string. Stopped. This site never runs text as code." `script-src` |
| `innerHTML = '<img src="data:," onerror="…">'` on a hidden element, removed after | "Markup with a handler in it, as an injected comment would carry. The picture failed, and the handler was not allowed to answer." `script-src-attr` |
| a click on `<a href="javascript:void(0)">` | "A javascript: link. Stopped." `script-src-elem` |
| `fetch("https://blocked.invalid/")` | "A request to an address outside this site. Stopped before it asked." `connect-src` |
| `new Image().src = "https://blocked.invalid/x.gif"` | "A picture from outside. Stopped before it asked." `img-src` |
| `setAttribute("style", …)`, then `el.style.color = …` | "A style written into the markup was refused. A style set by the site's own code was not: its animation writes styles the same way." `style-src-attr` |
| a trusted script appending an inline `<script>` | "A script this page already trusts, starting another. It ran. Trust passes to what trusted code starts, which is how the site loads its own pieces. The guard stands at the door, not in the room." |

**4. Where the server may go.**
> **Where the server may go**  Six kinds of address, and no others. It follows a redirect only back into them, and only once.

Rendered from `EGRESS`, each row with its fence and the test that holds it: "Last.fm, for what I am playing and the week. The key it uses never leaves the server." (`now.test.ts`) · "Last.fm's pictures, by a thirty-two-letter name and nothing else." (`cover.test.ts`) · "Apple's and Deezer's shelves, to find a song's sleeve and its thirty seconds. Only for songs this site listed." (`preview.test.ts`) · "Apple's and Deezer's own servers, for the sleeves and the seconds themselves. Signed, https, no port, no password in the address, pictures or sound only, and never more than a few megabytes." (`songs.test.ts`, `cover.test.ts`) · from week 5, "GitHub, for when I last pushed. It hears about private work only as a total for each month." (`pulse.test.ts`). Under the list: "Your browser never talks to the counter. This site passes three counts on."

**5. Where it could be hurt.** One entry per route, from `src/lib/security/routes.ts` (new); `routes.test.ts` fails if a route has none. The "until" dates come from each entry's `fixed`, the day the fix merged.

| Route | What someone could want | What stops them |
|---|---|---|
| `/api/now` | "To ask it very often and run up my bill, or to hope it lets slip its key." | "The answer is kept at the edge for ten seconds, so a thousand askers cost one call. The key never leaves the server, and a failure says it failed instead of pretending to be a quiet week." |
| `/api/preview` | "It was a jukebox for anyone until the first week of October." | "It plays only songs this site listed, signed within the day, and follows one redirect back into the stores and no further." Links paper one. |
| `/api/cover` | "It would fetch from any port on two companies' networks, and follow a redirect anywhere, until the first week of October." | "It serves only sleeves this site signed, as pictures, never as pages, with a rule on them that forbids everything else." |
| `/api/beacon` | "To send it anything, including lines made to look like log entries." | "It takes two kilobytes, strips new lines and control characters, answers everything the same way, and repeats nothing back." |
| `/api/today/…` | "Tomorrow's puzzle." | "A puzzle is served only from its own day, by my clock, and the files it comes from are frozen and kept out of the public repository." |
| `/api/pulse` | "The name of something private." | "Private work reaches it only as a monthly count. Names never leave the build." |
| `/api/urchi.png` | "To ask for it until it costs something." | "It takes nothing from you and is kept for ten minutes." |
| `/u/api/send` | "To count things that did not happen." | "Nothing. The counts are for me, and I read them knowing that." |

Under it, what survives of "Knocks": "Like every address on the internet, it is asked every day for /.env and /wp-login.php, by machines that ask everyone. There isn't one."

**6. What it keeps.** "In your browser, and nowhere else. No cookies." Rendered from `store.ts`'s key registry (Engineering §4.3); a test fails if an `eigengrau:` storage key in `src/` is missing, skipping names registered as events (`eigengrau:nova`, `ThreadScene.ts:520`). Today: `sound` ("Whether you turned the sound on."), `visits` ("When your last visit ended, so Urchi and Notes can say what is new."), `told`, `along` ("That you took Urchi with you, for this visit only."), `sky`, and `tones` until the tab closes. As they ship: `urchi` ("What Urchi remembers of you: how you treat it, and your rhythm. It remembers you across visits, and only here."), `finds`, `today:<game>`, `bench:<slug>`, `keys`, `phos` ("Which lights you have seen. Never the answers."), `week`, `eyes-seen`. Then `Yours.tsx` (new): "In your browser now: {the keys present}." or "Nothing. This browser has nothing of the site's." A chip, **"Forget me"**: the first tap reads "Your finds go too, and Urchi will not know you. Again to forget."; the second removes every `eigengrau:` key: "Forgotten." Last: "Vercel keeps its own request logs for a short while. I do not read them unless something is wrong."

**7. What it asks your browser** (what survives of the cut fingerprint mirror). "A few things, each for a reason, and nothing it keeps." Rendered from `src/lib/security/asks.ts` (new), each with its line: reduced motion ("so nothing swims past you", `motion.ts:21`, `character.ts:716`); whether the screen can hover (`CreativeSpacePanel.tsx:167`, `attention.ts:732`); more contrast ("so the room keeps its grey", `MusicPanel.tsx:919`); the pixel ratio (`Between.tsx:243`); the window's size; the visitor's own clock, for their day in Notes. A test fails on a `matchMedia(` call with no entry.

**8. What it gives away about me.** His first person, drafted for approval:
> - Where I am, near enough. Urchi sleeps from one to seven in the morning, my time, and the puzzles turn over at my midnight. Plainly says Melbourne, and the commits I made by hand say +10:00, or +11:00 in summer. The others keep UTC; How it is made says why.
> - When I sleep, by the same clock.
> - What I am listening to, and when I last played something, which says whether I am at a computer. That is Music, and it is on purpose.
> - When I push to my public repositories, to the minute. The private ones show only a total for each month, and never their names.
> - My names. I am dctxv on GitHub and on Instagram, and my address is on About and in every commit I made by hand.
> - That I am studying, and where. One of my public repositories is coursework.
>
> I keep these because the site would be less alive without them. Knowing what you give away is not the same as giving nothing away.
>
> It gives a little away about you too. It counts three moments and nothing else: a finished puzzle, a find taken, and something made with a tool and taken away. It sets no cookies, does not count pages or visits, and does not know who you are. Nothing is sent while your browser asks not to be tracked, and nothing is shown in public.

The last paragraph is Strategy §6.1's, as written. Under it, in the site's voice, the events exactly as sent: `game_finished { game, n, streak }`, `find_taken { tier }`, `tool_export { tool, format }`, completed from §1.6's check. Lines added in the commit that ships each feature: "My working hours, next to Email." and "What I was playing when I wrote a note, when I said yes."

**9. What it runs that I did not write.** "Six things, and why each earns its place." next ("The frame everything else hangs in."), react and react-dom ("What the pages are made of."), three ("The rooms: Space, the thread, the words on About."), gsap ("Most of what moves."), troika-three-text ("The words drawn inside the rooms. It builds its own workers, which is why the policy allows exactly that."). Then: "It installs from a lockfile and nothing else. Updates wait three days, unless they close a hole. On the day this was built, npm audit knew of nothing wrong with any of it." (`package.json:16-23`; the audit line from `provenance.json`; §1.7 makes it true.)

**10. If you find something** (`#if-you-find-something`).
> Write to me at {address}, or open a private report on GitHub. I will answer within a week and say what I will do. I will fix what is real within thirty days, or tell you why not, and write it up here once it is fixed, with your name if you want it.
>
> This site is in scope: its pages, its routes and its public repository. Last.fm, Apple, Deezer, Vercel, GitHub and Umami are not mine to offer. Please do not test how much it can take. It is a small site on a free plan, and knocking it over proves nothing either of us needs proved. Stop once you have shown it, and look at nothing that is not yours. There is almost nothing here that is.
>
> If you keep to that, I will not complain to anyone about what you did, and I will thank you. I cannot pay. The puzzles in Phosphenes are for breaking; the site is not.

At his night the first sentence gains "It is 3:12 here. Write anyway."

**11. Thanks** (`#thanks`). "No one yet." Then "{Name}, who found {what}, {Month year}." from `src/content/kept.ts`, and "Seen in the dark: {handles}." once anyone has seen every light (§6.5).

**12. Provenance.** "Built on Sunday 18 October at 21:40, my time, from 3f2a9c1. Forty-one tests passed before it was allowed out. The code is MIT. The words, the notes and Urchi are mine." (a sample), with "The commit." and "Its checks." linking GitHub. `scripts/provenance.mjs` (new) runs in the Vercel build after Vitest writes `.vitest.json` and before `next build`, writing a git-ignored `src/content/provenance.json`: `{ sha: VERCEL_GIT_COMMIT_SHA, builtAt, tests, audit }`.

**13. The last line**, once Phosphenes exists: "There are {six} lights hidden about the place, for anyone who looks." It looks unlinked and links to `/phosphenes`. Under it: "How it is made."

**Looks and sounds.** A `.case` column in Notes' width; two colours, no accent beyond the focus ring and selection every page has. Lines rise through the site's mask 60 ms apart. With sound on, each line lands with Notes' tick (`sfx.ts:124`), a line not kept with `focus`, and Try it ends on `done` if every probe did what it should.

**Where and data.** `/kept`, its own page (no pill), from About's quieter line, the drawer, `security.txt`, Plainly, each tool's foot, the README and `/colophon`. Nothing new is stored: headers are read live, every list is imported from the code, and `provenance.json` is written at build.

**Implementation.** `src/app/kept/page.tsx` (server, with metadata and a canonical) renders every block's words in HTML, so `curl` and screen readers get all of it; `Shell.tsx:129-132` already gives a non-tab route its own panel. `src/components/kept/{ReadBack,TryIt,Yours}.tsx` and `words.ts`; `src/lib/security/{policy,grade,probes,egress,routes,asks}.ts` with tests; `src/content/kept.ts`; `src/lib/count.ts`; `scripts/provenance.mjs`; `AboutPanel.tsx:70-82` gains the quieter line; `e2e/kept.spec.ts` checks "Nine of ten" on production and every probe's outcome.

**Edge cases.** Phone: one column, a header's name over its value, long values wrapping anywhere, the policy folded after three lines behind "All of it", the route table as a list, the chip 44px tall; checked at 390 and 320px. Reduced motion: everything at once. Sound off: silent. His night: only block 10's line changes. Returning: nothing new stored. Development: "This is a copy on his machine. The real one is stricter.", and Try it reads "It ran here, without the policy."

**Effort.** M, four and a half days. **What it shows.** A threat model per route, defence in depth with a test behind each claim, honesty about what the site gives away, and security in sentences a recruiter and a CISO can both read. **Risks.** A regression becomes public, which is the point, so the nightly job must catch it first. Claims drift from code, so every list is rendered from what it describes. Tone: calm, never a sales page.

#### 3. The Security drawer (`/security`, on the Desk)

**Pitch.** Papers first, then the page that keeps the site, then the things to play, with the hidden one last.

**How it works.**
1. The Desk owns `/security` (`tabOf`, Strategy §5.5), which opens the drawer in the kept Desk panel. `/security/<slug>` opens a paper in the same panel; the server page renders its full text, so it is in the HTML.
2. Rows come from `SECURITY` in `src/content/security.ts` (new), and a row shows only once it is live: a paper on or after its date in his zone (`day.ts`); `/kept` once it exists; Plaintext from Monday 7 December; Last login from its first Saturday (January 2027 at the earliest, by the counts); Phosphenes once a light is planted.

| Group | Row | Line under it (grotesk 12px, 60%) | Goes to |
|---|---|---|---|
| To read | each paper, newest first | "{Eight} minutes. {Its one-line pitch.}", dated "2026.10.25" on the right | `/security/<slug>` |
| To read | How this site is kept | "Its headers, read back to you, and what it gives away." | `/kept` |
| To play | Plaintext | "Today's lock is {Vigenère, with the length given}. New at midnight here." | `/today/plaintext` |
| To play | Last login | "One day of logins a week. Someone else was in there." With a record: "Your casebook: four patterns met." | `/today/login#casebook` |
| To play | Phosphenes, last | "Lights hidden about the place, for people who look." With a record: "You have seen two of six." | `/phosphenes` |

Reading time is `countWord(Math.ceil(words / 230))`; progress lines only read `eigengrau:today:*` and `eigengrau:phos`.

**The heading,** `securitySentence(rows)`, joins the live parts ("{n} papers", "how this site is kept", "a cipher a day", "an intrusion a week", "{n} lights hidden about the place") with commas and a final ", and". While no paper is live, a second sentence names the first one's date, and drops once it passes, so it never goes stale.
- 18 October: "**Security**  How this site is kept. The first paper is due on Sunday 25 October."
- 1 November: "**Security**  One paper, how this site is kept, and five lights hidden about the place."
- 22 November: "**Security**  Three papers, how this site is kept, and eight lights hidden about the place."
- 7 December: "**Security**  Three papers, how this site is kept, a cipher a day, and eight lights hidden about the place."
- January, once Last login runs: "… a cipher a day, an intrusion a week, and ten lights hidden about the place."

**Empty and night.** With nothing live, the drawer is not on the shelf (the Desk's rule: never an empty slot); a direct visit reads "**Security**  Nothing to read yet. The site is being kept before it is written about.", links "The desk", and is `noindex` until a row exists. At his night the Desk's heading already says "He is asleep. The desk is not." (Strategy §5.6), and two lines change: Phosphenes reads "One light only shows by day here.", and `/kept`'s reads "Write at any hour. The answer comes within a week."

**Looks and sounds.** Notes' column, rows a hairline apart, the cursor label "Read" or "Play" on desktop. A paper new since the last visit gets a small **ink** dot, Notes' shape without its colour: the eye colour has three places, and Notes' own dot is one. With sound on, opening the drawer gives Notes' riffle tick, and nothing else sounds.

**Phone.** `min(450px, calc(100% - 32px))`; each row one button at least 48px tall; the date under the title; 18px titles at 320px; no hover-only information; Back or Esc goes up to the shelf and keeps the drawer's scroll (Strategy §5.9).

**Also reached from** Plainly's security lens, the papers' Notes entries, `/kept`'s foot and, later, Go. **Data:** `SECURITY` in code; nothing stored. **Implementation:** `src/components/desk/SecurityDrawer.tsx`, `src/content/security.ts`, `src/app/security/[[...slug]]/page.tsx` (metadata per paper, an `sr-only` mirror, each paper's HTML), papers as TSX in `src/content/papers/<slug>.tsx` with a small `<Code>` (Engineering §5.3); `UPDATED.desk` moves when a paper lands, so Urchi looks up at the Desk pill once. **Edge cases:** reduced motion cuts the drawer in; sound off is silent; returning visitors see the ink dot and their own progress. **Effort:** S, a day, once the Desk frame exists. **Shows:** a practice with a paper trail, read in the order written. **Risks:** an early drawer with one row looks thin (the due-date clause says why, and drops on time); a slipped paper is simply not listed, so no row ever promises.

#### 4. Three papers

**Common to all three.**
- `/security/<slug>`, and a Notes entry of the new kind `"paper"`: `{ id, date, kind: "paper", tags: ["cybersec"], href, body }`. `site.ts:221` widens `kind` to `"note" | "log" | "paper"` and adds `href?`; `NotesPanel.tsx:599-625` renders a serif body and a grotesk "Read it."; `visits.ts:171` leaves out `kind === "paper"`, so Urchi looks at the Desk pill instead (it counts log lines as well as notes today, which is Notes' to change); the feed includes papers (Strategy §7.3).
- **Who writes what.** Claude drafts every section from the diffs, tests and reproduction scripts. He runs each confirm step on his own machine, so the paper is true that he saw it; approves the drafted "What I would tell the developer", rewriting only what is not his; writes the Notes line; and sets `approved: true`. About an hour a paper, as `decisions.md` item 3 counts it; the launch check counts only approved papers. The papers never say who found a finding, only that he confirmed it and what he changed; the one acknowledgement stays on `/colophon`.

##### Paper one: "How this site stopped being anyone's song proxy"

Sunday 25 October, `/security/song-proxy`, 1,800-2,200 words, about nine minutes. **Sections:** Two doors, and why they exist · The sleeve door opened onto two companies' networks · The song door was a jukebox for anyone · How bad, honestly · Sign what you hand out · One hop, checked again · The fences, and the tests that hold them · What I would tell the developer.

**The finding:** F1-F3 and F15, with their lines. "How bad, honestly" says no accounts, no cookies, no metadata service to reach on Vercel, and an SVG case that needs a third party's failure: Medium, not High, and still worth fixing, because it is exactly the pattern a reviewer looks for. **Confirm on localhost:** `npx tsx scripts/security/onhost-cases.ts`, then `npx tsx scripts/security/tripwire.ts` (§1.1), both with no network; after the fix the same harness shows 404s with `fetch` never called. **The fix:** signed ids (dated for songs, undated for sleeves, domain-separated), `onHost` refusing ports and userinfo, one `egress()` with one re-checked hop and a timeout, image and audio types only with `nosniff` and a sandbox policy, size caps, a cached 404, CORP, and §1.4's tests. It is the idea behind GitHub's Camo: sign what you mint, serve only what you signed.

**What I would tell the developer** (drafted, his to make his own):
> You built a door so your own pictures could come in without asking anyone's permission, and then you let the door decide what counted as a picture. Don't. Sign what you hand out, so the door opens only for things you made. Treat every redirect as a new request, because it is one. Serve only the types you meant, with nosniff, so a mistake upstream stays a broken image instead of becoming a page on your address. None of this was dangerous here, on a site with nothing to steal. That is the best time to fix it.

Notes entry `2026-10-25-song-proxy`, his line (a sample for length: "The site would fetch from any port on two companies' networks. It asks for a signature now."). Claude drafts sections 1-7, the scripts and the test table from the week-1 diffs.

##### Paper two: "The sentence that would not draw"

*A content security policy for a three.js site whose text renderer builds its workers from `blob:` URLs.* Sunday 8 November, `/security/blob-workers`, 2,000-2,500 words, two screenshots. **Sections:** What the page runs · What a strict policy trips on · The sentence that would not draw · Why a week of reports would not have heard it · Nonces, `'strict-dynamic'`, and what they cost · Styles: the attribute and the object model · What it still trusts · What I would tell the developer.

**The finding:** F14, with troika's lines. It also covers the three style attributes and why GSAP's CSSOM writes are fine; `img-src data:` for the favicon and the grain; the `<noscript>` nonce; Next reading the nonce from either header; the cost (every page dynamic, paid once a visit because every tab is kept); and the honest limit that "Try it" shows, that `'strict-dynamic'` trusts whatever trusted code starts, with Trusted Types as the next step and why not yet (§1.8). **Confirm on localhost:** with `npm run dev` running, `npx tsx scripts/security/troika-refused.ts` (copied from the scratchpad's `troika-refused.mjs` with the proxy scripts, and run under `tsx` like every script) loads `/about?still` under an *enforced* policy injected by Playwright, prints the console lines ("Refused to create a worker…" or "Failed to execute 'importScripts'… failed to rehydrate"), and screenshots a blank statement beside an open one; its policy line switches the two cases. `e2e/csp-traps.spec.ts` keeps them as a test.

**What I would tell the developer** (drafted):
> Read your policy from inside the workers too. A page can pass every check you run on it and still lose its words, because the part that draws them lives in a worker you never see, built from a blob: URL. That worker inherits the page's rules without inheriting your listeners. Allow blob: for workers and nowhere else. Use a nonce with 'strict-dynamic' so the worker may load what it builds. Make your tests listen to the worker's console as well as the page's. Then enforce, and not before: a report-only week that cannot hear the worker is a week of silence, not a week of evidence.

Notes entry `2026-11-08-blob-workers` (sample: "Two ways a security header can make a sentence vanish, and the one that keeps it."). It ends: "Read any policy the way this one was read: Policy, read." (once built).

##### Paper three: "Notes from a phone, and the injection they do not have"

Sunday 22 November, `/security/note-action`, 1,500-1,800 words. It moved from the 29th because the launch gate asks for three papers before the post; the Action is built in week 7, so its diff exists in time. **Sections:** A note from a phone · Who may write · The injection it does not have · Three more places a sentence could become code · The characters you cannot see · What the token may do · What I would tell the developer.

**The finding:** the notes Action (Strategy §7.2) and the script it calls. Expressions such as `${{ github.event.issue.body }}` are pasted into the script before the shell reads it, which is GitHub Actions script injection; the workflow passes the body only through `env:`. Three existing defences in `add-note.mjs`: `JSON.stringify` writes the body so it cannot close its string (`:114-115`); `execFileSync("git", [...])` with no shell (`:151-153`), so the commit subject (`:136`) cannot become a command; React renders the body as text (`NotesPanel.tsx:623`). The real gap is F13, and the category path, which *creates* categories after a prompt (`:83-90`) and which the Action must never reach, because an issue form's dropdown is not validation. The guard is `author_association == 'OWNER'`, not a label anyone's form can apply; permissions are per job; actions are pinned to SHAs; a `GITHUB_TOKEN` push starts no other workflow, so the Vercel build's tests are the gate.

**Confirm on localhost**, with no GitHub involved:

```bash
body='x"; echo INJECTED; #'
step='echo "${{ github.event.issue.body }}"'
bash -c "${step/'${{ github.event.issue.body }}'/$body}"   # prints x, then INJECTED: pasted into the script
BODY="$body" bash -c 'echo "$BODY"'                        # prints the body, and nothing else: through env
node -e 'const b="hi\u202Eevil".trim().replace(/\s+/g," ");console.log(JSON.stringify(b).includes("\u202E"))'   # true
```

With Docker, `act issues -e fixtures/issue.json` runs the real workflow against a copy of the repository. Never file the test issue on GitHub.

**The fix:** `.github/workflows/note.yml` (new) on `issues: [opened]`, `permissions: {}` at the top and `contents: write, issues: write` on the job, `if:` the owner and the note label, `concurrency: notes`, actions pinned by SHA, `BODY` through `env:` to `node scripts/note-from-issue.mjs`, `git commit -F .note-message`, then `gh issue close "$N" --comment "In."` with `N` from `env:`. `scripts/note-from-issue.mjs` (new) parses the form's two headings, refuses an unknown category instead of creating one, strips U+202A-202E and U+2066-2069, caps the note at 500 characters, and reuses `add-note.mjs`'s writer. The content lint fails on any bidi control in `site.ts`.

**What I would tell the developer** (drafted):
> Treat the issue body as a stranger, even when it is you. Hand it to your script through the environment, never into the script itself. Decide who may write by what GitHub says about them, not by a label anyone can choose. Write it into your code with a serialiser, never with quotes. Call git with a list of arguments, not a line of shell. Then strip the characters that make a line read differently from what it is. None of it is for the days you type carefully. It is for the day the text is not quite what you meant: a paste with something in it you cannot see, or a form that says it came from you.

Notes entry `2026-11-22-note-action` (sample: "Notes arrive from my phone now. The way in has no room for anyone else's."). *If the Action slips past 15 November,* paper three covers `add-note.mjs` alone (its sections 4 and 5), which needs no Action.

**The launch.** US Thanksgiving is Thursday 26 November, so the post goes out on Monday 23 or Tuesday 24 November, US morning, which is his night: Urchi will be asleep, and the softer first wake is ready.

---

#### 5. The tools to check with

They live in the Desk's Tools drawer under "To check", in the frame, kit, registry and privacy line of Free tools, and run entirely in the visitor's browser. Part B prototyped a policy reader and a DER walker in the scratchpad, and two results shaped them. A reader that judges policies one at a time reads the floor as "nothing limits scripts", so policies are judged together. And V8's `JSON.parse` quotes the start of its input in its error (`Unexpected token 'e', "eyJhbGciOi"... is not valid JSON`), so no error message may carry input.

##### 5.1 What the four share

**The frame, used as it is.** Each tool is a `meta.ts` in `src/tools/<slug>/`, in the one registry (`src/tools/index.ts`) with a new `group: "make" | "check"`. Under "To check" sits one serif line at 60%: "They read what you give them and say what they see. None of them reaches past this site." The index heading, in the frame's words and counted from the registry: "Three to make things with, and four to check things with. What you give them stays on this page." Each page is a server component with metadata, a type-only OG image and an HTML mirror of what the tool promises, so a reader without JavaScript learns the token tool never sends a token before they have one to paste. The tools are DOM only, so they work with WebGL off; only the token's countdown runs a timer, and it stops when the Desk is hidden (`onShown`, `where.ts:64`). A Take calls `count("tool_export", { tool, format })` (§1.6), and nothing about the input is sent.

**Stricter than the frame**, because a paste can be a secret: a session cookie, a bearer token, a private key by mistake.
1. **Never in a URL**, not even after the `#`: a fragment stays out of requests but not out of history, synced tabs or chats. Settings still go in the query. The one exception is Policy, read's "Copy link" (§5.3).
2. **Masked on sight.** `Set-Cookie` values, and any `Cookie`, `Authorization` or `Proxy-Authorization` line, become `•••• (41 characters)` before anything is drawn or held; so does any header whose name holds `key`, `token`, `secret`, `session` or `auth`, except `WWW-Authenticate` and `Proxy-Authenticate`, which are challenges. The field is then **replaced**, not edited, so undo cannot bring the text back.
3. **Fields that do not talk:** `spellcheck="false"` (enhanced spell checkers in Chrome and Edge send what is typed to their servers, as the 2022 "spell-jacking" reports showed), `autocomplete="off"` (which also stops the browser restoring the text on Back), `autocorrect`, `autocapitalize`, `translate="no"` on the field and every raw value, and Grammarly's three opt-outs. "Extensions can read any page. This one asks the well-known ones not to, and cannot stop the rest."
4. **Errors that carry nothing.** Parsing runs in `attempt()` (`src/lib/security/safe.ts`, new), which returns a fixed sentence and never rethrows. The beacon (Engineering §8) sends no `message` for an error whose stack passes through `src/tools/` or `src/lib/security/`; elsewhere it cuts a message to 120 characters and masks any run of twenty base64url characters, so the rest of the site keeps errors worth reading.
5. **One door out.** The only `fetch` is `readOwn()` (§5.2), whose argument is a union of three string literals, and the one exception to the frame's lint rule against `fetch`.
6. **Text only:** no `dangerouslySetInnerHTML` under `src/tools/**` or `src/lib/security/**`, by lint. The site's one use stays the JSON-LD.
7. **Invisible characters shown** as `⟨U+202E⟩`, with what each does: the bidi controls, zero-width characters and NUL that paper three strips from notes (F13).
8. **No verdict on anyone's safety.** A clean reading ends: "Nothing here looks loose from the outside. What matters most happens on the server, and a page cannot see it."

**Shared code** (new): `src/lib/security/{own.ts, safe.ts, words.ts}` (durations and counts in words), `src/lib/security/csp/{parse.ts, together.ts, match.ts}` (CSP3's parsing, several policies judged as one, and source-list matching, all pure), fixtures and `.reading.json` goldens under `src/lib/security/__fixtures__/`, `src/components/bench/{Paste,Reading,Tree}.tsx`, `src/lib/bench/forget.ts` (`useForgetOnLeave()`: clears on leaving the route, on `pagehide`, and after fifteen minutes hidden) and `src/lib/bench/handoff.ts` (one in-memory slot, Headers to Policy and Token to Certificate, emptied on read). The tools add about twenty-five fact codes to `grade.ts` for mistakes this site never makes (typos and unquoted keywords in a policy, short nonces, cookies without flags, `ALLOW-FROM`, `*` with credentials, obsolete and self-naming headers), and change no signature.

**Keys.** Letters only, while focus is inside the tool and not in a field, claimed through `keys.ts` with Notes' guard for typeable targets (`NotesPanel.tsx:1016`), and switched off with `eigengrau:keys`. No digits. Common: `e` tries an example, `c` clears, `s` takes the reading, `?` the keys. Headers: `h` reads this site's own, `p` opens the policy, `w` worst first. Policy: `a` would it load, `m` as a meta tag, `l` copies a link. Token: `h` hides or shows it, `v` shows it as sent. Certificate: `o` opens a file, `t` the tag table, `b` the bytes, `n` asks about a name, `[` `]` step through a chain. Esc in a field moves focus to the reading's heading; after a paste, focus goes there by itself (`tabindex="-1"`). Outside a field, Esc goes up a level, as everywhere on the Desk (board, then drawer, then shelf). `?` opens the site's one key sheet, which shows the tool's letters first while a tool has focus.

**The machine voice.** The monospace (from 7 December; before it, Style R18's tabular grotesk) sets only hashes, hex, headers and base64. Claims are a grotesk Readout, and the serif says what things mean. His first person appears three times, once a tool, each explaining something the tool refuses to do.

**"Nothing leaves the page", tested with a canary.** Each fixture carries a string found nowhere else, and `e2e/tools-offline.spec.ts` searches everything the page sent, stored or put in its address:

```ts
// e2e/helpers/leave.ts (new)
export function watchAll(page: Page) {
  const out: string[] = [];
  page.on("request", (r) => out.push(`${r.method()} ${r.url()}\n${JSON.stringify(r.headers())}\n${r.postData() ?? ""}`));
  page.on("websocket", (w) => out.push(`WS ${w.url()}`));
  return () => out.join("\n\n");
}
export const kept = (page: Page) => page.evaluate(async () => JSON.stringify({
  local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie,
  idb: (await indexedDB.databases()).map((d) => d.name), caches: await caches.keys(), url: location.href, title: document.title,
}));

test("A token, opened: the token goes nowhere and is not kept", async ({ page }) => {
  const token = fixture("token/canary.jwt");                    // carries "canary": "eigengrau-c4n4ry-7f3a"
  const needles = [...token.split(".").map((p) => p.slice(0, 16)), "eigengrau-c4n4ry-7f3a"];
  const sent = watchAll(page);
  await page.goto("/tools/token", { waitUntil: "load" });       // load, not networkidle: the site polls
  await page.getByLabel("A token").fill(token);
  await expect(page.getByText(/^Expires in /)).toBeVisible();
  for (const n of needles) { expect(sent()).not.toContain(n); expect(await kept(page)).not.toContain(n); }
  expect(sent()).not.toMatch(/\/u\/api\/send/);                  // reading is not counted; only a Take is
  await page.getByRole("link", { name: "Music" }).click(); await page.goBack();
  await expect(page.getByLabel("A token")).toHaveValue("");
});
```

The other three follow its shape: Headers makes no request when pasting, and exactly `readOwn()`'s same-origin requests, with no `Cookie` and no body, when reading its own; Policy compares `https://canary.invalid/x.js` without fetching it; the certificate arrives through `setInputFiles` and nothing is requested. A DOM check asserts rule 3's attributes on every "check" field.

**Seams with `/kept`.** `grade.ts` is built for `/kept` in week 3 and the tools extend it. **The writer test** (`src/lib/security/policy.test.ts`, new) reads the site's own policy and floor through the strangers' reader and fails on any `loose` fact, so the build stops if the site's policy ever reads as loose. A test asserts that `match()` agrees with Try it's outcomes. `__fixtures__/headers/own-production-expected.txt` (§1.9's `curl`, verbatim) pins the two-policy reading.

##### 5.2 Headers, read

**Pitch.** What a server told the browser, one header at a time, in sentences. For developers checking a staging server, `localhost` or an intranet app, which securityheaders.com and the Observatory cannot reach; for security readers who want reasons, not a letter; for anyone on a phone, which has no devtools.

**How it works.**
1. The well: serif 20 "Paste a response's headers here.", grotesk 12 at 60% "They stay on this page.", and the pills "Read this site's own" and "Try one".
2. `split(text)` (`src/tools/headers/split.ts`, pure) finds the form (HTTP/1.1, HTTP/2 and /3 with lowercase names, `:status`, `curl -v` transcripts with `>` and `*` lines dropped, devtools' two-line copies, a bare list), splits a `curl -sIL` chain and reads the last answer ("The first answer: 301, over plain HTTP. The second: 200."), unfolds old line folding, masks secrets ("Cookie values were hidden as soon as they were read. The reading needs only their flags."), names the request lines it dropped, and caps the paste at 64 KB.
3. `grade(pairs, { https, document })`. A page is read against the nine below; COEP counts only on this site's own read, where it is `chosen`, and is `moot` elsewhere, so a stranger's page is read against eight. An answer or a file is read against fewer, as §1.3's doors define them. With no `Content-Type` it reads every line and counts nothing. "It came over plain HTTP" (`?http=1`) makes HSTS moot, and is set by itself for a chain's first answer.
4. The summary sentence (serif 15, `aria-live`), then one line per header as sent, then those missing: a mark as a word (Holds, Loose, Open, Broken, Missing, On purpose, Moot, Obsolete or Noted; "Open", "Broken" and "Missing" at full ink), the header in mono at 60%, one serif sentence, and an optional "More". "As sent" or "Worst first" (`w`). The policy line links "Read it line by line." to Policy, read through `handoff.ts`.
5. **This site's own:** "This page", "A door" or "A file".

   ```ts
   // src/lib/security/own.ts (new): the one fetch in the security code, shared with /kept
   export const OWN = { page: "here", door: "/api/cover/-", file: "/fonts/serif.woff2" } as const;
   export type Own = (typeof OWN)[keyof typeof OWN];
   export async function readOwn(which: Own) {
     const path = which === "here" ? location.pathname : which;   // a path, never a URL
     watch.expect(path);                                           // new on the frame's watch
     const init = { cache: "no-store", credentials: "omit", redirect: "error" } as const;
     let res = await fetch(path, { ...init, method: which === OWN.door ? "GET" : "HEAD" });
     if (res.status === 405) res = await fetch(path, { ...init, method: "GET" });
     return { status: res.status, pairs: [...res.headers] as [string, string][] };
   }
   ```

   Fetch's `Headers` joins repeated headers with ", ", exactly how several policies share one value, so the policy and the floor arrive as two. It compares nonces and the policy with `policy()`, as `/kept` does, and passes `/kept`'s `chosen`. `/audio/*` is left out because a Phosphenes light rides on it, and `/api/now` because it would run a function.
6. An address pasted instead: "That is an address, not headers.", his line, and a command built from it, never run: `curl -sS -D - -o /dev/null 'https://example.com/'` (the address must parse with `new URL()`; a single quote becomes `'\''`).
7. "Take the reading": a `.txt` of the sentences and the masked headers.

**What it knows.** The nine a page is asked for (`/kept`'s ten without the doors' CORP):

| Header | Holds (sample) | Does not (sample) |
|---|---|---|
| Content-Security-Policy | "Scripts run only with this response's nonce, and whatever those start. Two policies, and a browser enforces both." | "Missing. Nothing limits what this page may run or load." · "A policy on trial. It reports what it would stop, and stops nothing." · "Any script that gets into the page runs: 'unsafe-inline' with no nonce beside it." |
| Strict-Transport-Security | "For two years, and on every subdomain, your browser will come here only over HTTPS." | "A browser may try plain HTTP first, and whoever sits on that network can answer for it." · `max-age=0`: "That is how HSTS is switched off." |
| X-Content-Type-Options | "A file is taken as the type it is labelled, never guessed." | "A browser may guess a file's type from its bytes." |
| Framing | "No site may show this page inside its own." | "Any site may frame this page and dress it up to be clicked." · `ALLOW-FROM`: "Browsers no longer understand it, so they ignore the header." |
| Referrer-Policy | "Other sites learn only that a visitor came from here, never from which page." | Missing: "The browser's default applies, which today is much the same." · `unsafe-url`: "the full address, query and all" |
| Permissions-Policy | "The camera, the microphone and where you are may not be asked for, here or in any frame." | "Nothing is switched off." · `interest-cohort=()`: "FLoC's switch. Chrome dropped FLoC in 2022." |
| Cross-Origin-Opener-Policy | "A window from another site gets no handle on this one." | With a sign-in page: "same-origin-allow-popups keeps sign-in popups working." |
| Cache-Control | With a nonce: "private, no-store." Without one, `no-cache` holds. | "A shared cache may keep this page, nonce and all." · "If it differs by who is signed in, one visitor could be shown another's." |
| COEP | Own: "Not sent, on purpose." | Stranger's: "Not sent. That is usual." Moot, and not counted. |

It has a sentence for the rest: cookies flag by flag and by framework (`JSESSIONID`, `PHPSESSID`, `connect.sid`), `SameSite` and `__Host-` rules; CORS (`*` with credentials: "Browsers refuse this pair, so it is broken, not open."); caching, reporting and self-naming headers ("It names itself and its version, nginx 1.18.0. Not a hole, but it saves someone a step."); obsolete ones (`X-XSS-Protection`: "0, or nothing, is the advice now."; `Public-Key-Pins`: "It could lock visitors out for as long as it said."); unknown ones, shown as they came; housekeeping on one line. Said once: "A set of headers shows what one answer said. It cannot show whether other answers differ, whether the server echoes whatever it is sent, or what the page does with any of it."

**Why it will not fetch another site's headers** (his voice, drafted):
> I could have this site's server fetch any address for you and hand back its headers. That would make it a proxy for anyone's requests, and the first paper here is about undoing exactly that. Paste them instead. The command below prints them, and then you know what you are reading.

The site's voice under it: "This page may talk only to this site; its own policy says so (connect-src 'self'). Even without that, a browser shows a page only the few headers another site agrees to share." That is literal: a cross-origin fetch sees only the CORS-safelisted response headers, and security headers are not among them.

**How it reads.** This site today (`curl -sI localhost:3000/`, fixture `own-dev-2026-09-29.txt`):
> **Headers, read**  A page. Of the eight things a page is asked for, one arrived: how long it may be kept. It can be framed by anyone, would run any script that got into it, and leaves HTTPS to chance.
>
> Noted. `Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding`. Caches keep a copy for each value of five request headers; four are Next's own, for moving between pages without a reload.
> Holds. `Cache-Control: no-cache, must-revalidate`. There is no nonce here to protect, so checking before each use is enough.
> Missing. Content-Security-Policy. Nothing limits what this page may run or load. …and six more.

On the serif font (`/fonts/serif.woff2`): "Loose: `Cache-Control: public, max-age=0`. A font whose name never changes costs a question every visit; name it by its contents and a year would do." That first finding is not a security point, and goes to Engineering §7.3. After week 5, its own read: "This page. Eight of the nine arrived, and the ninth is not sent, on purpose. The nonce fetched just now, `9fQa…`, is not the one this page arrived with, `k3xP…`, as it must not be." The privacy line: "Asked of the network since you opened this: nothing." or "two requests, both to this site, because you asked it to read its own headers."

**Looks, sounds, where.** A 640px column in the case pages' rims; no colour, marks as words. A `tick` when a reading lands (`sfx.ts:1393`, throttled at `:1395`) and `done` on a Take, with the chip on; nothing sounds for a loose line. First row under "To check", `/tools/headers`; `/kept`'s line under its verdict; Plainly's AppSec row; a log line, "Headers, read: any answer's headers, a sentence each."; `UPDATED.desk` moves once.

**Data and implementation.** No backend. Pasted text is held masked for the visit, never stored; `eigengrau:bench:headers` keeps `{ order }`. `split.ts`, `words.ts` (fact codes to sentences, durations through `src/lib/security/words.ts`), and `Headers.tsx` (client, `ssr: false`) from the kit. **Fixtures** as text: today's `curl` sets; production's report-only and enforced sets; his own live VECTOR deployment's, the one real "someone else's site"; a bare Next app; and `composed-*.txt`, one real-world mistake each (HSTS `max-age=0`, `ALLOW-FROM`, `*` with credentials, a flagless cookie, a `curl -v` transcript, an http-to-https chain). Goldens hold marks and fact codes, not sentences, so rewording never breaks a test; a second test runs every sentence through the content lint.

**Edge cases.** Phone, 390px: a six-line well, pills side by side, names over values, values wrapping anywhere; 320px: a four-line well, stacked pills, 24px targets, no sideways scroll even for a 20 KB policy. Reduced motion, watched live: lines appear at once. Sound off: silent. His night: no change. Returning: "Nothing you pasted was kept." A HAR file: "A HAR file holds your cookies and tokens as well as the answers. Save the one answer's headers instead."

**Colophon.**
> Made from the grader behind How this site is kept (`src/lib/security/grade.ts`), which reads this site's own headers back to anyone who opens that page. Headers are read against what browsers do now rather than what they did when each was new, so X-XSS-Protection is called obsolete and a missing Referrer-Policy is forgiven more than it once was. It knows forty-four headers by name and says what it can about the rest. No libraries. Twenty-two kilobytes, fetched when you opened this. Made in December 2026, in four days.

**Effort.** M, four days after `grade.ts`. **Shows:** browsers as they are now; a proxy refused; a reader that checks the site's own writer on every build. **Risks:** a wrong sentence is worse than none (each fact code cites its specification section, and goldens pin readings); browsers move (the colophon dates the knowledge).

##### 5.3 Policy, read

**Pitch.** A Content Security Policy, directive by directive, and what it would let in. Unlike Google's CSP Evaluator, it judges several policies together, answers "would it load?", and says each line in a sentence.

**How it works.**
1. A pasted policy, or one handed over. "It came in a `<meta>` tag" (`?meta=1`) reads `frame-ancestors`, `report-uri`, `report-to` and `sandbox` as ignored; "It was sent report-only" (`?ro=1`) reads everything as watched.
2. **Parsing** as CSP3 §2.2 does, naming the mistakes a browser will not mention: a repeated directive ("Only the first counts."); a near-miss name ("script_src is probably script-src, misspelled, and a browser ignores what it does not know."); an unquoted keyword ("self is missing its quotes, so it is read as a host called self."); a directive among the sources ("A semicolon is missing before it."); `'none'` beside others.
3. **Directive by directive:** `'unsafe-inline'` with no nonce or hash is **Open** ("the line that undoes the rest"), and beside one is **Loose** ("there only for old browsers; a grader will still count it"). `'strict-dynamic'` with a nonce or hash **Holds** ("Host lists, 'self' and 'unsafe-inline' beside it are ignored"), followed by "It does not stop a trusted script from starting the wrong thing."; without one it is **Broken**: "It trusts nothing to begin with, so no script runs. Probably not what was meant." `*`, a bare `https:`, `data:` or `blob:` in `script-src` are Open; `*.example.com` is Loose ("An allowed host is trusted with everything it serves; most host-list policies could be got round this way", Weichselbaum and others, CCS 2016); any of these beside `'strict-dynamic'` Holds. A nonce: "Twenty-two characters: 128 bits, if they are random. It must be new for every response, which one reading cannot show." Missing `base-uri` ("An injected <base> could move where relative scripts are fetched from, and a nonce would not stop it."), `form-action` or `frame-ancestors`: Loose, having no fallback. Obsolete directives are named.
4. **Together:** a load is allowed only if every policy allows it, so "missing" is said only when no policy covers it.
5. **The effective table,** after CSP3's fallbacks, as sentences: "Workers: worker-src, this site and blob: addresses."
6. **Would it load?** (`a`): a kind of load, an address, and the page's own address for `'self'`; `csp/match.ts` answers by CSP3's source-list matching (scheme, host wildcards, port, path with the trailing-slash rule and paths ignored after a redirect, nonces, hashes, `'strict-dynamic'`) and names the deciding directive. "It is only compared. Nothing is fetched."
7. **Copy link** (`l`): the policy after the `#`, every nonce written `'nonce-…'`. It is the one pasted thing these tools ever put in an address, because the site sends its policy to every visitor anyway.

**How it reads, on this site's own after week 5:**
> **Policy, read**  Two policies. A browser enforces both, so only what both allow gets through. The second is a floor of three lines, there in case the first ever fails to arrive. Nothing in either is loose.
>
> Holds. `script-src 'nonce-…' 'strict-dynamic'`. Scripts run with this response's nonce, and whatever those start.
> Holds. `worker-src 'self' blob:`. Workers from this site, or built by its own scripts from blob: addresses, which is how its words are drawn.

"Would it load?" agrees with `/kept`'s Try it: a script from `https://cdn.jsdelivr.net/npm/x.js` is "Not by its address. With 'strict-dynamic', a script loads only if it carries this response's nonce, or a trusted script adds it."; an inline `onclick` is "No. script-src has a nonce, so handlers written into markup never run."; a `blob:` worker is "Yes."

**Where, data, implementation, edges.** Second row, `/tools/policy`; paper two ends with it. Only `eigengrau:bench:policy` `{ meta }` is stored. `csp/{parse,together,match}.ts` and `src/tools/policy/`; `match.ts` is tested against the specification's examples and a table ported from web-platform-tests' `content-security-policy/` cases, each citing its file. Phone: one directive a line; the kinds become a native `<select>` at 320px. Reduced motion: lines at once. Sound off, his night: no change. Returning: nothing kept. Policies of 20 KB parse linearly and fold after twelve directives. A blanked nonce reads "A nonce was here, blanked when the link was made."

**Colophon, effort, shows, risk.** "The same grader's policy half, with one more part: a matcher that answers 'would it load?' by the rules in Content Security Policy Level 3, tested against the specification's own examples and against what How this site is kept saw a real browser do. A test reads this site's policy back through this reader on every build: if it ever reads as loose, the build stops. Made in December 2026, in a day." S, a day. It shows CSP to the level of fallback chains and `'strict-dynamic'`'s trade. The risk, an edge the examples miss, is met by the ported cases and a named directive in every answer.

##### 5.4 A token, opened

**Pitch.** What a token claims, in sentences. It keeps nothing. For developers debugging sign-in, security readers checking what a token gives away, and students learning that a JWT is signed, not sealed.

**How it works.**
1. His line above the field (below). The well: "Paste a token here." and "It is read here and kept nowhere." Pills: "Try the standard's example" and "Clear".
2. **Unwrapping** (`open.ts`, pure) strips, and says so, `Bearer `, `Authorization:`, `Cookie:` and `Set-Cookie:` lines, a token endpoint's JSON, and an address carrying `id_token=`, `access_token=` or `token=` ("Tokens in addresses end up in history, logs and Referer headers, which is why OAuth's security advice, RFC 9700, retired the implicit flow.").
3. **Identifying:** a signed token (JWS, compact or JSON), an encrypted one (JWE: "Its contents cannot be read without the key, and this page does not ask for one."), an unsigned one, a PASETO. **A known secret's prefix** (`prefixes.ts`: GitHub's `ghp_` family and `github_pat_`, GitLab `glpat-`, Slack `xox*-`, Stripe `sk_live_` and `rk_live_`, AWS `AKIA` and `ASIA`, Google `AIza`, npm `npm_`, Anthropic `sk-ant-`, OpenAI `sk-proj-`) clears the field at once: "That looks like a GitHub personal access token, not a JWT. If it is real, it is live: revoke it where it was made. Nothing here sent it anywhere, and it is gone from this page."
4. **Decoding** strictly, noting ordinary base64, padding and non-zero trailing bits. **Its own JSON scanner** (`json.ts`, about seventy lines), because `JSON.parse` quietly keeps the last of two names: "It names exp twice. The standard says a parser must reject that or keep the last; not every parser was told, and that disagreement is how tokens get past checks."
5. **Sentences** for the header and claims, with times against the visitor's clock; a one-second timer, only while shown, keeps "Expires in four minutes." true and speaks through `aria-live` only at expiry.
6. **What the server must check**, always, serif at 60%: "What matters most happens on the server, where no page can see it: the signature, with an algorithm the server chose, not the one the token names; exp and nbf, with a minute or two of slack; iss, against the issuers it trusts; aud, against its own name; and typ, so one kind of token cannot pass for another."
7. **Collapsing** to "A token, 1,843 bytes, ending …x9Q." with "Show it" and "Clear", so a screen-share shows the reading, not the token. **Forgetting** (`forget.ts`) on leaving the route (`onWhere`, `where.ts:33`), on `pagehide` (the back-forward cache), and after fifteen minutes hidden: "It is dropped from this page. Your browser frees the memory when it chooses; a page cannot wipe it."
8. **Take** omits the token and signature: "It leaves out the token, so the reading cannot be used as one." A header with `x5c` offers "Read its certificate".

| Header | Sentence (sample) | Loose or Open when |
|---|---|---|
| `alg: HS*` | "Signed with a shared secret: HMAC with SHA-256. Whoever can check it can also make one." | Beside `x5c`, `jwk`, `x5u` or `jku`: Open, "that pairing is what algorithm confusion looks like". From an issuer that signs with keys (Google, Microsoft, Apple, GitHub Actions, Okta, Auth0, Cognito): Loose. A 20-byte signature: "not made by the algorithm it names" |
| `alg: RS*`, `PS*`, `ES*`, `EdDSA` | "256 bytes of signature: a 2,048-bit key." · "ECDSA on P-256." · "Ed25519." | Under 2,048 bits. A 71-byte ES256 signature: "this looks like DER". Zeros: "Java 15 to 18 once accepted this (CVE-2022-21449). A server must refuse it." |
| `alg: none` in any capitals, or an empty signature | "Not signed at all. Anyone can write one, and a server that accepts it accepts anything." | Always Open |
| `kid` | "A server looks that name up in its own list; it must never read it as a file path or a query." | `../`, a slash, a quote or a NUL: Open |
| `jku`, `x5u`, `jwk` | "It says where to fetch its keys. This page does not fetch it." · "It carries its own public key." | `jku`/`x5u` Loose; `jwk` Open |
| `typ`; JWE `RSA1_5`, `zip: DEF` | "An access token, by its type (RFC 9068)." · "How well it compresses can say something about what is inside." | No `typ`; `RSA1_5` (RFC 8725); compression before encryption |

| Claim | Sentence (sample) | Loose when |
|---|---|---|
| `exp`, `nbf`, `iat` | "Expires in four minutes." in the visitor's zone and UTC | No `exp`; thirteen digits ("the year 57,000"); a string; `iat` in the future |
| lifetime | "It lives for thirty days." | An access token over an hour; any token over thirty days |
| `aud`, `jti`, `scope`, ID-token claims, `cnf` | "Meant for https://api.example.com. A server must check that it is named here." · "An ID token: it says who signed in, not what they may do." | No `aud` |
| anything personal | "It carries an email address and a phone number. Anyone who holds the token can read them. A token is signed, not sealed." | Emails, phones, Luhn-valid card numbers, IP addresses, names, keys like `password`, `ssn` or `salary` |
| size | "1,843 bytes. It goes with every request, and a cookie holds about 4,096." | Over 4,096 bytes |

**His line** (drafted): "Do not paste a live token from production. Nothing here sends it anywhere, but you cannot see that from where you sit, and the habit is the risk. An expired one reads just as well." Under the field: "It is not put in the address, not kept in this browser, and it goes when you leave this page."

**How it reads, on RFC 7519 §3.1's example** (`e`, on 29 September 2026; its header holds a carriage return, and its `exp` is 18:43 UTC on 22 March 2011):
> **A token, opened**  A signed token. Nothing in it is secret: its header and claims are only base64, and anyone holding it can read them. This one is the example in RFC 7519.
>
> Signed with a shared secret: HMAC with SHA-256. The header is written across two lines, with a carriage return inside. That is allowed, and unusual. Issued by joe. Expired fifteen years ago. No audience. One claim of its own, named by an address: http://example.com/is_root, true. Thirty-two bytes of signature, as HS256 makes. This page cannot check it. An HMAC can be checked only with the secret that made it, and that secret belongs on a server, not in a web page.

**Where, data, implementation.** Third row, `/tools/token`; Plainly's penetration-testing row; a log line, "A token, opened. It says what a token claims and keeps nothing." **Nothing is stored anywhere:** no settings key, no module memory across a route change; a lint rule bans `@/lib/store` and the storage globals under `src/tools/token/**`.

```ts
// src/tools/token/open.ts (new, pure: no DOM, no clock; `now` is passed in)
export type Opened =
  | { kind: "jws"; form: "compact" | "json"; header: Parsed; claims: Parsed | null; sig: Uint8Array; notes: Fact[] }
  | { kind: "jwe"; header: Parsed; notes: Fact[] }
  | { kind: "unsigned"; header: Parsed; claims: Parsed | null; notes: Fact[] }
  | { kind: "secret"; vendor: string; notes: Fact[] }            // a known prefix: the caller clears the field at once
  | { kind: "other"; notes: Fact[] };
export function open(input: string, now: number): Opened;       // never throws; every failure is a Fact
```

**Fixtures:** the RFCs' own examples (7519 §3.1, 7515 A.1-A.5, 7516, 8037), whose published keys are never used, and composed ones naming what they stand for (odd `exp`s, a `kid` with `../`, `x5c` with HS256, a zero signature, `None`, a GitHub-shaped secret of the prefix and forty `x`s, `canary.jwt`), with fact-code goldens at a fixed `now`.

**Edge cases.** Phone: parts wrap anywhere, a 96px label column, labels over values at 320px, the collapsed line leaving the screen to the reading. Reduced motion: the countdown changes words without the rise. Sound off: silent, even at expiry. His night: no change. Returning: "Nothing was kept from last time. That is on purpose." Offline: it reads the same. 20 KB tokens parse in under a frame and fold after twenty claims.

**Colophon.** "It splits a token at its dots, turns each part back from base64url, and reads the JSON with a small scanner of its own, because the browser's parser quietly keeps the last of two claims with the same name, and not every server does. The risks it names are the ones in RFC 8725, and only those a token can show. It does not check signatures with secrets, and it does not make tokens. The nearest thing on this site is how it signs every sleeve and song it hands out. No libraries. Eleven kilobytes. Made in December 2026, in two days."

**Effort.** S-M, two days. **Shows:** JOSE from the RFCs, discipline with a secret, and declining the forging half every other decoder ships. **Risks:** people paste live tokens anyway (the line, the collapse, the forgetting and the canary answer it); a crowded field (the sentences, the prefix catch and keeping nothing set it apart); false comfort ("What the server must check" always follows).

##### 5.5 A certificate, unfolded

**Pitch.** A certificate, byte by byte, and what it promises. For operators with a `.pem` they did not make, a chain that will not verify, or a renewal coming; for readers who want a parser written from the specification; for anyone wondering what "valid for two hundred days" means now that the limits fall every March.

**How it works.**
1. **Input** (`pem.ts`): PEM blocks as a chain, DER files, bare base64, certificate requests. **A private key is refused by its armour line before it is decoded**, and the field replaced: "That was a private key. It was not read, and it is gone from this page. It did pass through your clipboard, which some tools keep." A host name gets his line and `openssl s_client -connect example.com:443 -servername example.com -showcerts </dev/null`, built only from letters, digits, dots and hyphens.
2. **The walker** (`der.ts`, about three hundred lines, pure) follows X.690 and records every departure as a fault instead of throwing: indefinite (BER) and non-minimal lengths, lengths past their parent, padded integers, bad booleans. Limits: depth 32, 200,000 nodes, 1 MB. Nodes keep their offsets, so `tbsCertificate` reaches Web Crypto exactly as signed.
3. **X.509** (`x509.ts`, `ext.ts`, `oids.ts`): serials (under nine bytes is Loose: "In 2019 several authorities found theirs held sixty-three bits, and replaced millions of certificates."); SHA-1 below a root is Open; keys, including ML-DSA by NIST's `2.16.840.1.101.3.4.3.17`-`.19`; fingerprints and the SPKI pin from `crypto.subtle`; and every extension in a sentence ("Domain validated: the authority checked that whoever asked controls the name, and nothing about who they are."; a NUL in a name is Open; AIA and CRL addresses are shown as text, never fetched).
4. **SCTs** (`sct.ts`): logs named from Chrome's list, timestamps against `notBefore`, and Chrome's rule said plainly: "Chrome asks for two for a certificate of 180 days or less, and three for a longer one." It names the logs and does not check their signatures, and says so.
5. **Lifetimes** (`limits.ts`), counted from `notBefore` to `notAfter` inclusive, a day being 86,400 seconds and any part beyond another day: 825 days from 1 March 2018 (Ballot 193), 398 from 1 September 2020, 200 from 15 March 2026, 100 from 15 March 2027 and 47 from 15 March 2029 (Ballot SC-081v3). The last three are confirmed against the Forum's page; **the first two and the counting rule are from memory of BR §1.6.1 and §6.3.2 and must be checked before building**, and `limits.ts` names the version checked. They apply only to a public site's certificate; for a private CA, "they are advice". The reading always adds: "From 15 March 2027 the limit is one hundred days, and from 15 March 2029, forty-seven. Renewal wants to be automatic."
6. **A chain** (`chain.ts`), reordered if needed and shown so, each link checked for `cA`, `keyCertSign`, path length and name constraints, and its signature through Web Crypto (RSASSA-PKCS1-v1_5, RSA-PSS, ECDSA after converting DER to raw r‖s, and Ed25519 in Chrome from 137, Firefox from 129 and Safari from 17): "Signed by the one after it. The signature checks." **Trust is never claimed:** "Whether your browser trusts the top one depends on the roots your system keeps, which a page cannot see."
7. **"Does it cover a name?"** (`names.ts`, RFC 9525, compared, never fetched); **the tag table and the bytes**; **Take** as PEM, DER or the reading; and a link, "Look it up in the public logs", to crt.sh by SHA-256 fingerprint (check the parameter when building): "This link sends the certificate's fingerprint to crt.sh when you follow it. Nothing is sent until you do."

**Why it will not fetch one** (his voice, drafted): "A page cannot see a certificate. Browsers keep the connection to themselves. The only way to fetch one for you would be to have this site's server connect to whatever address you type, which is how a site becomes someone's port scanner. One line on your own machine does it, and then the certificate is yours to paste." A live check would be F1 again, at any port on any network. The one certificate shown without a paste is the site's own, `own.pem`, captured monthly by `scripts/tools-refresh.mjs` from `SITE_URL`'s host on 443 and dated on the page.

**How it reads, on ISRG Root X1** (`e`, real, from the system store):
> **A certificate, unfolded**  ISRG Root X1, from the Internet Security Research Group, in the US. Signed by itself: a root. Whether your browser trusts it depends on your system, which this page cannot see.
>
> RSA, 4,096 bits, signed with SHA-256. Valid from 4 June 2015 to 4 June 2035. That is exactly twenty years apart, which the Forum counts as 7,306 days, because it counts the last second too. It may issue certificates, with no limit on how deep the chain below it goes. Serial `8210cfb0d240e3594463e0bb63828b00`; in the bytes it begins with 00, because its first bit is set and a serial must be positive. SHA-256 `96:BC:EC:06:26:49:76:F3:74:60:77:9A:CF:28:C5:A7:CF:E8:A3:C0:AA:E1:1A:8F:FC:EE:05:C0:BD:DF:08:C6`.

A failure, one line: "Issued for 398 days on 20 March 2026, five days after the limit fell to two hundred. No public authority should have issued it."

**Where, data, implementation.** Fourth row, `/tools/certificate`. A pasted certificate is public, so it is held for the visit; a key never is. `eigengrau:bench:certificate` keeps `{ tree, bytes }`. `logs.json`, `own.pem` and the OID table ship in the chunk, refreshed monthly by `.github/workflows/tools-refresh.yml` (new), which fetches Chrome's `log_list.json` at build time, never for a visitor, and commits "Tools: the logs and the site's certificate, refreshed [quiet]". Files: `der.ts`, `oids.ts`, `x509.ts`, `ext.ts`, `sct.ts`, `chain.ts`, `names.ts` (with a small punycode decoder, shared later with An address), `limits.ts`, `pem.ts`, `words.ts`, `Certificate.tsx`, and `Tree.tsx`.

**Tests.** Let's Encrypt's published roots and intermediate, and `own.pem`; edge cases from `scripts/cert-fixtures.sh` (new; OpenSSL 3.5 or later for ML-DSA, and this machine has 3.0.13), including leaves dated across each lifetime boundary; broken bytes from `scripts/cert-mangle.mjs` (new). **A fuzz test** runs ten thousand seeded mutations per fixture, seeded from the shared PRNG in `src/lib/random.ts`: faults, never a throw, within budget, under 50ms each. Limit goldens pin 14 and 15 March 2026.

**Edge cases.** Phone: the tag table indents 8px (6px at 320px) for six levels, a chosen row's bytes beneath it; "Open a file" has no `accept` filter, since iOS greys out types it does not know; a ten-thousand-name certificate shows twelve and "Show all 10,000". Reduced motion: the tree opens without animation. Sound off, his night: no change. Returning: nothing pasted kept. No Web Crypto: no signature checks, said so.

**Colophon and the note.** "Read by a parser written for this page, about three hundred lines, that walks the bytes as X.690 describes them. Certificate Transparency logs are named from Chrome's own list, copied on 1 December 2026. Signatures along a chain are checked by your browser's Web Crypto; trust is not, because only your system knows which roots it keeps. The lifetimes are the CA/Browser Forum's, as Ballot SC-081v3 set them in April 2025. Made in January 2027, in eight days." A `cybersec` note drafted from `limits.ts` for Monday 1 March 2027: "What 15 March changes. From Monday a public certificate may last a hundred days."

**Effort.** L, eight days; a four-day cut without chain checks is what every decoder already offers. **Shows:** a binary specification implemented with faults recorded, PKI as it stands in 2026-2027, and the platform's own cryptography. **Risks:** parser bugs (the fuzz test and budgets), the schedule (flagged and tested), a stale log list (refreshed and dated), uneven Web Crypto (said where it fails).

##### 5.6 Ranking, order, files and his hours

| Tool | Useful to strangers | Shows craft | Engine ready | Fits the site | Effort | Rank |
|---|---|---|---|---|---|---|
| Headers, read, with Policy, read | 4 | 4 | 5 | 5 | M + S | **1** |
| A token, opened | 5 | 3 | 2 | 3 | S-M | **2** |
| A certificate, unfolded | 3 | 5 | 1 | 3 | L | **3** |

Headers first: the site's proof turned outward, and the one a security reader will try on their own staging server within a minute of `/kept`. Token second: cheapest and most used. Certificate third, in January, so it is live before the limit halves on 15 March 2027; if the counts send Plate or Last login's first Saturday into January (Daily games §7), it moves to February. Dates: `grade.ts` in week 3; Headers and Policy 7-11 December (after the Tools frame and the monospace); Token 14-16 December; Certificate 11-22 January (it needs the domain for `own.pem`); the March note on 1 March.

**Files changed:** `ReadBack.tsx`, `grade.ts` (fact codes only), `kept/page.tsx`, `eslint.config.mjs` (the `fetch` exception, the `dangerouslySetInnerHTML` ban, the token's storage bans), the beacon, `site.ts` (`UPDATED.desk`). **Libraries:** none; writing them is the point. **Size:** about 22 KB gzipped for Headers and Policy, 11 KB for Token, 38 KB for Certificate, all under the 60 KB rule. **Policy:** nothing new. **His hours:** about twenty minutes, to approve three first-person lines, read four colophons and approve the March note.

#### 6. Phosphenes

Season one in full. It folds in Strategy §6.2 (the Blink, the drawer row, the pacing) and departs from it in three places, each decided below: one secret for every season, Small print instead of any keeper's pass, and a Blink that asks first under reduced motion. Part C captured the live favicon's frames, measured PBKDF2 in Node and Chromium, computed the Morse and the ROT13, and mocked the hub and the microprint. Hidden-tab timing could not be measured here, because the page stayed visible in every mode tried, so the branch checks it by hand in Chrome and Firefox.

##### 6.1 The hunt, in one page

**Name and pitch.** Phosphenes: the lights you see with your eyes shut. Small answers hidden in what the site already publishes, for people who look.

**The rules, as the hub states them.** Every light is found by looking at something the site already shows to anyone: a file, a header, a record for its name, a sound, a picture, its console, its icon. No light needs a forged token, a bypassed control, a guessed secret, a crafted request, or anything sent to a system other than this site. Reading the source is looking too: the answers are not in the public repository, and where the page draws an answer, reading the code that draws it is only a slower way of looking.

**Three depths, as places:** *in plain sight* (open something and read it), *behind a door* (a tool every browser has, or patience), *in the dark* (decode something that has to be rendered first).

**The doors in,** none on the five original tabs: `robots.txt`'s `Disallow: /phosphenes`, itself the first light; the console greeting, the second; `/kept`'s last line (§2, block 13); the Security drawer's last row (§3); and Go, once it exists ("That one is real. Four of six."). The ROT13 note sits in Notes as a note, unexplained, and each new light gets one unlinked log line.

| Day (his) | Lights | Count |
|---|---|---|
| Sunday 1 November | the door, the pocket, the Blink, the note, the bed; the address the day the domain resolves | five or six |
| by Sunday 22 November | the address, with the domain | six |
| Sunday 22 November | the fold, the small print | eight |
| Sunday 13 December, the eve of the Geminids | the register | nine |
| Sunday 27 December | the picture | ten |
| Sunday 17 January | the static | eleven |
| Sunday 7 February | the back | twelve |
| Monday 1 March 2027 | season one ends; season two opens with new answers in the same places | |

Each light is planted by the merge that adds it, on its day, and the hub shows only planted lights: "Six lights so far. More when it is darker." The launch gate's six hold on 22 November even if the domain is late, because the fold and the small print arrive that day.

##### 6.2 How answers are made and checked, with no server

**Where they come from.** `PHOS_SECRET`, 32 random bytes (`openssl rand -base64 32`), set once in Vercel for Production only and in his `.env.local` (ignored, `.gitignore:34`). Previews and development build with a practice key, and say so. `src/content/phos.seasons.json` (new, tracked) holds ids, slots, dates and answer kinds, never answers: `{ "season": 1, "opens": "2026-11-01", "ends": "2027-03-01", "lights": [{ "id": "door", "slot": 1, "planted": "2026-11-01", "answer": "flag" }, …, { "id": "address", "slot": 6, "planted": null, "answer": "flag" }] }`.

```js
// scripts/phos.mjs (new)
const key = hmac(SECRET, `eigengrau/phos/season/${n}`);                      // the season's own key
const flag = (id) => `phos{${id}-${hmac(key, `flag/${id}`).toString("hex").slice(0, 16)}}`;
const word = (id) => WORDS[id][hmac(key, `word/${id}`).readUInt32BE(0) % WORDS[id].length];
const canon = (s) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(/^phos\{(.*)\}$/, "$1");
const derive = (answer) => pbkdf2Sync(canon(answer), `eigengrau/phos/${n}`, 150_000, 64, "sha256"); // digest, then proof piece
```

A flag is `phos{<id>-<16 hex>}`: 64 bits of HMAC, found, never guessed. A word is drawn from `scripts/phos/words.json` (new, public); season one's Blink list, each at most 25 Morse units, is HERE, REST, TIME, TIDE, NEST, EASE, MINE, HEED, SHH, LIT, AWE, SEA, a minute of his reading. `canon` makes `phos{door-…}`, `door-…` and `PHOS{DOOR-…}` one answer.

The script writes, all git-ignored: `src/content/phos.generated.ts` (salt, digests, last season's, `POCKET`, `NOTE` already turned by ROT13, `BLINK_WORD` as spans, never letters, and later values such as `PICTURE`), `src/content/phos.server.json` (`door`, `bed`, for the robots route and `next.config.ts`), and `public/phos/`. It runs as `predev`, `prebuild`, `pretypecheck` and `prelint`, so a fresh clone never fails, and **in production a missing `PHOS_SECRET` fails the build**: "PHOS_SECRET is not set. Refusing to plant practice lights in production." A practice key there would put answers anyone can compute from the public repository on the real site. `node scripts/phos.mjs print dns` and `verify` run only on his machine, refusing when `CI` or `VERCEL` is set. **The guard:** the content lint fails if `git grep` finds a flag in either alphabet (`phos\{[a-z]+-[0-9a-f]{16}\}` or its ROT13, `cubf\{…\}`) or if any generated file is tracked. Sixteen zeros, the stand-in this document uses, are allowed.

**How the page checks** (`src/lib/phos.ts`, new):

```ts
async function derive(answer: string, salt: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(canon(answer)), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 150_000 }, key, 512));
}
/** A right answer gives its light and its proof piece; an old one says so; anything else is null. The answer is never kept. */
export async function check(answer: string): Promise<{ id: string; piece: string } | "last" | null> {
  const bits = await derive(answer, SALT);
  const id = Object.keys(DIGESTS).find((k) => DIGESTS[k] === hex(bits.subarray(0, 32)));
  if (id) return { id, piece: hex(bits.subarray(32)) };
  if (LAST && LAST.digests.includes(hex((await derive(answer, LAST.salt)).subarray(0, 32)))) return "last";
  return null;
}
```

PBKDF2 rather than SHA-256, because the digests ship in the bundle and four answers are short words: a guess costs about 25 ms of a CPU core instead of a microsecond, while one check takes 55 ms in Chromium here. The page claims no more: "This page checks what you type against a slowed-down fingerprint of each answer." It never invites guessing. `phos.test.ts` derives one answer with `node:crypto` and with WebCrypto and asserts the same bytes. `phos.ts` also holds `allowBlink()` and `blinkAllowed()`, an in-memory flag for §6.3.3.

**What the browser keeps:** `eigengrau:phos` through `keep()`, `{ v, season, found: { id: time }, pieces: { id: hex }, past: { n: { seen, of } } }`. Never the answers; a piece is no quicker to invert than the digest. A new season starts `found` again and keeps "Last season you saw eight of twelve." `/kept` lists it: "Which lights you have seen. Never the answers."

##### 6.3 Season one: the six lights

###### 6.3.1 The sign on the door (`door`), in plain sight

`/robots.txt`, under the line that keeps crawlers out of the hub:

```
Disallow: /phosphenes
# Urchi does not go in there. You might. phos{door-0000000000000000}
```

It is read, not decoded, and the `Disallow` is also the hub's front door: robots.txt is a sign, not a fence. **Hint:** "Every house has a sign for the machines. Read it as one." **More plainly:** "Add /robots.txt to the site's address. Read the line under the one that says no." **Change:** §1.5's route adds both lines when `phos.server.json` has a `door`; `sitemap.ts` leaves `/phosphenes` out. The hub also sends `noindex`, which a crawler obeying the `Disallow` never reads, so a bare link may be listed without a snippet; the page holds nothing a search could spoil. **Confirm:** `curl -s localhost:3000/robots.txt`. Works on a phone; no motion, sound or hours.

###### 6.3.2 Said to whoever opens the back (`pocket`), in plain sight

The console, once a page load: "You opened the back of it. Most people never do." in ink on eigengrau, then "There are lights hidden about the place, for anyone who looks: https://<host>/phosphenes", then a collapsed group, "▸ Urchi keeps something in its pocket.", which opens to "It is warm. phos{pocket-0000000000000000}". **Hint:** "It talks to anyone who opens the back of it." **More plainly:** "Open the browser's developer tools and look at the console. One line there folds open. Easier on a computer."

```tsx
// src/components/chrome/Greeting.tsx (new), mounted in Shell after <LiveIcon /> (Shell.tsx:200)
let greeted = false; // once a page load; reactStrictMode (next.config.ts:6) runs effects twice in development
export function Greeting() {
  useEffect(() => {
    if (greeted || !POCKET || (process.env.NODE_ENV !== "production" && !location.search.includes("greet"))) return;
    greeted = true;
    const c = clock();
    console.log(`%cYou opened the back of it. Most people never do.${c.hours === "night" ? ` It is ${c.text} here.` : ""}`, INK);
    console.log(`%cThere are lights hidden about the place, for anyone who looks: ${location.origin}/phosphenes`, DIM);
    console.groupCollapsed("%cUrchi keeps something in its pocket.", DIM);
    console.log(`%cIt is warm. ${POCKET}`, DIM);
    console.groupEnd();
  }, []);
  return null;
}
```

`INK` and `DIM` are system-font styles, since the console cannot use the page's fonts; `location.origin` lets a preview print its own address; these are `log` lines, never `warn`, so §1.9's clean console holds. **Confirm:** `npm run dev`, then `localhost:3000/?greet` (development only, as `?debug=1` is). Phone: no console without a cable. His night adds the time.

###### 6.3.3 Said in its sleep (`blink`), behind a door

**What the visitor notices.** Leave the site's tab for another in the same window. After twenty seconds the small Urchi falls asleep, its eyes a line in its iris colour (`LiveIcon.tsx:20, 199-203`; lids painted at `:95-100`). A minute after they left, its eyes open and shut in a slow rhythm, short and long, then again, then it sleeps. On the 32-pixel icon (`LiveIcon.tsx:11`), drawn at 16 in the tab strip, open is two coloured dots and shut is a hairline. The lights you see with your eyes shut are, here, its eyes.

**How it decodes.** Morse, eyes open as the signal: a dot is 1,000 ms open, a dash 3,000; 1,000 ms shut inside a letter, 3,000 between letters, 7,000 between the two sendings. With the stand-in SEEN (21 units), both sendings take 49 seconds, from the 60th second to the 109th; the longest listed word, 25 units, ends at the 117th.

**The trigger.** The page is hidden (`LiveIcon.tsx:217-235`) and stays hidden for 60 seconds (coming back cancels every timer, `:168-171`, `:218`); the icon is asleep (`:223`); his clock is not at night (`hours.ts:14-19, 31-44`); the word has not been said in full this page load; and either the browser does not ask for reduced motion, or the visitor allowed it on the hub. A reload is a second chance.

**Why whole seconds.** Browsers wake a hidden page's timers about once a second (Chrome aligns them; Firefox holds them to 1,000 ms), and Chrome's once-a-minute throttling starts only after five minutes (`:17-20` already plans around it). So each edge is set from the word's start, 150 ms early. The first peek comes at 140 seconds (`:205-215`), after the word.

```ts
// LiveIcon.tsx, new. At module scope, beside SLEEP (:20):
export const WORD = { after: 60, unit: 1, early: 0.15 } as const;
// in run(), beside `let asleep` (:174); `reduced` is :159
let said = false;
const sayWord = () => {
  if (said || !asleep || !BLINK_WORD.length || clock().hours === "night" || (reduced && !blinkAllowed())) return;
  const all = edges(BLINK_WORD);                                                   // src/lib/morse.ts (new)
  for (const e of all) later(Math.max(0, e.at * WORD.unit - WORD.early), () => icon.show(e.open ? frames.open : frames.shut));
  later(all[all.length - 1].at * WORD.unit, () => (said = true));
};
// in onVisibility's hidden branch (:219-225), after the sleep is scheduled:
later(WORD.after, sayWord);
```

`src/lib/morse.test.ts` checks SEEN's spans (`[1,1,1,1,1,3,1,3,1,3,3,1,1]`), its 49 units, and, for every listed word, `WORD.after + length < SLEEP.after + SLEEP.check[0]`. `?blink=soon`, in development only, sleeps after one second and speaks after three.

**Hint:** "Look away for a minute, and watch its face in the tab." **More plainly:** "Leave this tab open and go to another in the same window. Watch the small Urchi in the tab strip. After a minute its eyes open for the letters, short and long, and it says the word twice. Once a visit, and only by day here. Easier on a computer."

**Edge cases.** **Reduced motion:** the icon's idle blinks and peeks already stop under it (`:186`, `:202`), so the word does too, unless the visitor allows it: the hub's row reads "Your browser asks for less motion, so its eyes stay shut. Let it blink, until you reload." The button calls `allowBlink()`; nothing is stored. This overrides Strategy §6.2's "a blink is a change of state, so it stays": the idle blinks are changes of state too, and the site already stops them. **His night:** not said; the row reads "It is 3:12 here. It only says it by day." **Phone:** no tab strip. **A browser that ignores a changing icon** keeps the static one, which carries no light. **A browser saving power** may smear the word; it is one light of six. **Confirm by hand** in Chrome and Firefox with `?blink=soon`, the one timing claim not measured here. **Changes if** the by-hand check shows slower wake-ups: two-second units, sent once, still over before the first peek.

###### 6.3.4 Another alphabet (`note`), in plain sight

A `cybersec` note dated Sunday 1 November, the category's first entry (`site.ts:235`), in his lower case: `ebg13 vf abg rapelcgvba. vg vf n abgr cnffrq snpr qbja. cubf{abgr-0000000000000000}`. ROT13 turns it back: "rot13 is not encryption. it is a note passed face down." The hex turns too (a-f become n-s), so the light is right only once the whole line is turned. **Hint:** "One note was written for a different alphabet. Search for it in plain words and it will not answer." That is literally true: Notes' search matches bodies as stored (`notes.ts:181-182, 188-191`), so "encryption" finds nothing and "rapelcgvba" finds it. **More plainly:** "Every letter in one note has moved thirteen places. Move them thirteen more."

**Change.** The entry ends in a token, `{{phos:note}}`, so the repository holds no answer; `notes.ts:9` fills it from `NOTE` before anything reads `ENTRIES`, so the panel, the search, the mirror and the feed agree, and before planting the note simply ends at "qbja.". The sentence is his to approve or rewrite in a minute; a rewrite goes in through a new flag, `npm run note -- --rot13`. **Confirm:** `/notes?tag=cybersec`. It reads the same on a phone, and the index sentence gains "one on cybersec" by itself.

###### 6.3.5 Carried in with the sound (`bed`), behind a door

`/audio/ambient.mp3`, fetched only when sound is turned on (`sfx.ts:12-13`, `:199-206`, `:1293`), carries one header no other file has: `phosphene: phos{bed-0000000000000000}`. **Hint:** "Turn the sound on and watch what it carries in." **More plainly:** "With the sound on, open the network panel and look at the headers that came with the ambient file. Asking for its headers directly works too. Easier on a computer."

```ts
// next.config.ts: read at build, so the value lives in the routes manifest, never in the repository
const phos = (() => { try { return JSON.parse(readFileSync("src/content/phos.server.json", "utf8")) as { bed?: string }; } catch { return {}; } })();
// in headers(), before engineering's production-only early return, so `npm run dev` shows it:
...(phos.bed ? [{ source: "/audio/ambient.mp3", headers: [{ key: "Phosphene", value: phos.bed }] }] : []),
```

Next applies it beside §1.3's CORP rule, since the keys differ. **Confirm:** restart `npm run dev`, then `curl -sI localhost:3000/audio/ambient.mp3 | grep -i phosphene`. **Phone:** the chip is in the nav from week 1, but a phone has no network panel; `curl -I` works from any computer, with sound off, and either is looking.

###### 6.3.6 Written on the address (`address`), behind a door

A TXT record at the apex of the site's name, once it has one: `<domain>. 3600 IN TXT "phosphene=phos{address-0000000000000000}"`, found with `dig +short TXT <domain>` or any lookup, on a phone too. **Hint:** "Some things are written on the address, not the house." **More plainly:** "Look up the TXT records for this site's name. Any DNS lookup will do." A `*.vercel.app` address cannot hold a record, so the light waits for the domain; the day it resolves, he runs `node scripts/phos.mjs print dns`, pastes the value, and sets `planted`: five minutes a season. **The nightly test** (`e2e/phos.spec.ts`, new, against production) checks the robots line, the audio header and, through `dns.promises.resolveTxt`, the record, each against this season's digest, so a stale record fails that night rather than in front of a player. The record's one-hour TTL means an old value lingers at most an hour, and the hub answers it "That was last season's. It was real then."

##### 6.4 The hub, `/phosphenes`

One quiet page that names the lights planted so far, hints on request, checks what you saw, and remembers only which ones.
- `src/app/phosphenes/page.tsx` (new, server) renders every word in HTML, hints in `<details>`, so `curl`, screen readers and visitors without JavaScript get it all ("Checking needs JavaScript. The lights do not."). `src/components/phos/Hub.tsx` (client) reads `eigengrau:phos`, lights rows and runs `check()`. Its own page, not a tab (`Shell.tsx:129-132`). Title "Phosphenes", description "Lights hidden about the place, for people who look.", `robots: { index: false, follow: false }`.
- **Looks.** Notes' column in a `.case` page, two colours, no accent. Serif 40px "Phosphenes", then the lede, serif 19px: "The lights you see with your eyes shut. A few are hidden in this site: in the places it keeps for machines, in its sound, in its name, and in Urchi. Nothing here asks you to break anything. Each one is something the site already shows to anyone who looks." A 168px ring of twelve slots (as the intro ring has twelve, `IntroRing.ts:14`), drawing only planted lights: a 9px hairline circle unlit, filled ink lit.
- **The count,** grotesk 12 at 60%, by `countWord`: "Six lights so far. More when it is darker." · "You have seen two of the six so far." · "You have seen all six there are." · "You noticed." at twelve of twelve.
- **Rows,** one per planted light, 48px or taller: the mark; the name in serif 18; under it the depth ("In plain sight.") or the find ("Seen on 2 November. It was on the door."); on the right, "A hint", opening the voice hint and then "More plainly". A light planted since the last visit (`visits.ts:110-113`) gets an ink dot, Notes' shape without its colour. The Blink's row carries the reduced-motion button (§6.3.3).
- **The answer.** "What did you see?", a field (placeholder "phos{…}, or a word", `autocomplete="off"`, `autocapitalize="off"`, `spellcheck="false"`, `name="seen"` so password managers leave it alone), and "Check". The status line: "Checking." · "Yes. That one was on the door." (the places: on the door, in its pocket, said in its sleep, in another alphabet, carried in with the sound, on the address) · "Not one of these." · "You have that one." · "That was last season's. It was real then." · "This browser cannot check. The lights are still there."
- **How it works,** serif 16:
  > Stay inside this site. Its pages, its headers, its files and the records for its name are all fair to read. The stores and services it talks to are not part of this, and nothing here needs you to send it anything strange.
  >
  > The source is public. The answers are not in it. This page checks what you type against a slowed-down fingerprint of each answer, here in your browser, and tells no one. What you have seen is kept in this browser only, never the answers.
  >
  > Break the puzzles, not the site. If you find a real hole, write to me first. You will be thanked.

  "write to me first" links to `/kept#if-you-find-something`. The foot: "How this site is kept." A practice copy says so above the heading.
- **Sound and motion.** A right answer plays `done` (`sfx.ts:125`); a wrong one plays nothing, since there is no buzzer. A lit mark fills over 240 ms, or at once under reduced motion.
- **Phone.** One column, 16px gutters, field and button stacked at 48px, hints opening in place. The pocket, the Blink and the bed add "Easier on a computer."; the door, the note and the address work on a phone.
- **Files and tests.** `page.tsx`, `Hub.tsx`, `Ring.tsx`, `src/content/phos.ts` (names, depths, hints, places), the seasons file, `phos.ts`, `morse.ts`, `scripts/phos.mjs` and its list; `.phos` rules beside `.case` (`globals.css:519-531`), undoing `.case img`'s `aspect-ratio` (`:528-531`) for a light's image. `phos.test.ts`, `morse.test.ts`, and `e2e/phos.spec.ts` (a right answer lights its row, a wrong one does not, the proof appears at all-found).

##### 6.5 Seen in the dark, instead of a leaderboard

A leaderboard needs server-side checking, storage, moderation, rate limits and a privacy notice, and live ranks invite shared answers. Instead, once a visitor has seen every planted light:
1. "You have seen every light there is so far. If you want to be listed among those seen in the dark, give a name. This page turns it, and what you found, into a short proof. It says which lights you saw without saying what they were."
2. A name of one to 24 characters (letters in any script, digits, spaces, hyphens, dots, underscores; NFC).
3. The proof, in the browser, keyed by the pieces of the planted lights in slot order:

   ```ts
   const key = await crypto.subtle.importKey("raw", bytes(ids.map((id) => pieces[id]).join("")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
   const mac = await crypto.subtle.sign("HMAC", key, enc(`eigengrau/phos/${season}/seen/${ids.length}/${name}`));
   const proof = hex(new Uint8Array(mac).subarray(0, 12)).match(/.{4}/g)!.join(" ");   // 96 bits, six groups of four
   ```

4. It shows exactly what would be sent ("Seen in the dark. Name: grey heron. Season: one. Lights: six. Proof: 0000 0000 0000 0000 0000 0000"), with "Send it" (a `mailto:` to his address with `+seen` before the @, from `site.ts:43`) and "Copy it". The page sends nothing itself. Under the buttons: "I keep the name you give and the day I read it, and nothing else. The email goes once the name is up. Your name will stay in this site's public history even if I take it down later. I may leave out a name that belongs to someone else."

**What he does,** two minutes each: paste the email into `node scripts/phos.mjs verify` (`Seen: "grey heron", season one, six lights.`), add the line to `SEEN` in `src/content/kept.ts` (the season's first as a log line, later ones `[quiet]`), reply "Seen.", delete the email. He keeps a name, a season, a count and a day, and no address, time, order or speed. On the hub: "Seen in the dark: grey heron, 0xkestrel and wren. Each saw every light there was that day." or "No one yet."; at a season's end, "Season one ended on 1 March. Twelve people saw every light there was when they looked." **A cheat** with every answer can make a proof, including someone who brute-forced the four words from the page's code; that is looking of a sort, and no prize depends on it. Nobody can make one without the flags, 64 bits each, found only in the site's public responses.

##### 6.6 The six that follow

- **The fold** (`fold`, 22 November, behind a door). `public/phos/lantern.js` and its map, written by `phos.mjs` by hand (the repository has no bundler to lend). The greeting loads it once a page load on `requestIdleCallback`; the strict-dynamic policy lets a trusted script insert it (§1.1). The lantern prints the fourth console line itself, "A lantern, lit from inside.", so devtools' link beside it opens the mapped `lantern.ts`, whose `sourcesContent` holds the flag in a comment. `productionBrowserSourceMaps` stays off, so the lesson is not a leak, and the tools' watch names the request as the site's own. **Hints:** "What you are reading has been folded. Folds remember." / "The console's fainter line came from a file that was folded small. Its map remembers how it looked before." S, half a day.
- **Small print** (`print`, 22 November, behind a door; it replaces the keeper's pass). On `/kept`, the rule above Thanks is not a line: a row of capitals 1.5 CSS pixels tall at 55% ink, `SEEN IN THE DARK · PHOS{PRINT-…} · …`, drawn as **stroked paths** from a public-domain Hershey font in `public/phos/rule.svg`, so its source holds coordinates, not words, and it escapes the minimum font size. Zoomed five or six times, or printed (about 0.4 mm) and read with a loupe, it is letters. Microprinting is how banknotes and cheques tell a copy, and the hub says so once found. It is `<img alt="" aria-hidden="true">`, pinch-zoomable because the viewport sets no maximum scale (`layout.tsx:13-19`). **Hints:** "On the page about keeping, one line is not a line. Look closer than you are meant to." / "Zoom in on the rule above Thanks as far as your browser goes, or print the page and use a magnifier." S-M, a day.
- **The register** (`register`, 13 December, in the dark). `?sky=250926`, the day the site began in Melbourne (00:33 on 25 September; the draft's `240926` was UTC's day). A new `Register.ts` implements `SkyLayer` (`layer.ts:52-64`), added after `Stars` (`Sky.ts:90`) only for that raw seed, which no word link produces, so no frozen sky changes. About 150 dots of a five-letter word sit across the three depths; a depth's field scales as `zoom ** response` (`Stars.ts:308, 358-360`), so a dot meant for offset *q* at zoom 0.1 sits 1.12, 1.26 or 1.51 times further out, and the word comes into register only at the slider's minimum, `ZOOM.min = 0.1` (`RoomScene.ts:104`). The responses are the layer's `zoomResponse` times the bands' (0.05, 0.1, 0.18; `defaults.ts:38, 51-55`), read resolved for that sky, never assumed. Zooming is not motion. **Hints:** "Every sky has a seed. One was planted the day this place began, written as the day, the month and the year's last two. At a tenth of its size, it lines up." / "Open the sky with ?sky= and the day this site began in Melbourne, float Urchi out, and zoom all the way out." `/colophon` states the day. M, two to three days.
- **The picture** (`picture`, 27 December, behind a door). An `iTXt` chunk, keyword `Comment`, in the root link card: "It was here before you looked. phos{picture-…}". Engineering renders that card in `src/app/opengraph-image.tsx` with `next/og`; a metadata image route may return any `Response`, so the file inserts the chunk before `IEND` with its CRC-32 (`src/lib/png.ts`, new, about forty lines) and returns the bytes. Found with `exiftool` or `strings`. **Hints:** "When a link to this site is shared, a picture goes with it. The picture remembers something." / "Find the picture named in the page's og:image. Save it, and read what is written inside the file, not on it." S, half a day.
- **The static** (`static`, 17 January, in the dark). Pressing the sound chip on, off, on, off, on within four seconds (`SoundChip.tsx:20-31`) plays 2.6 seconds of radio static whose spectrogram, 1.5 to 6 kHz, spells a word: sines per glyph row switched by column, at −30 dBFS, from a generator outside `synth()`, whose one-pole lowpass (`sfx.ts:135-141`, about 3.3 kHz) would smear it. The chip is on every screen from week 1, but recording a phone's own sound is awkward, so after "More plainly" the hub offers `static.wav`, rendered in the page by an `OfflineAudioContext` from the same function. **Hints:** "The dot beside the tabs can be made to stutter. What it says then is for the eyes." / "Press the sound chip five times inside four seconds, ending on. Record what plays and look at its spectrogram." M, two days. *Ruled in the summary: the sound chip moves into the nav, after the pills, and the finds' pocket takes the top-right corner, so the first hint no longer says "in the corner".*
- **The back** (`back`, 7 February, in the dark). About sixty `[x, y]` points in Urchi's mesh units in `src/engine/urchi/mesh.q.json` (git-ignored), attached as `MESH.q` at `character.ts:56`, never in `v`, whose lowest vertices set the ears (`:339`); the engine reads only `v`, `f`, `g`, `eye`, `eyes` and `pivot`. Its own file, because the mesh is rewritten whole. Plotted, the points spell a word, upside down with y upwards, since the mesh's y runs down. The quiet `origin` key is an honest red herring. The shape is Urchi's likeness, all rights reserved. **Hints:** "It was traced from a drawing. The drawing had writing on the back." / "Find Urchi's shape in the page's code. One list in it draws nothing on screen. Plot it." S-M, a day.

The later word lists are drafted with their lights: short, plain, a minute of his reading. "A tag, the letters shifted" stays a very rare find, because a light must be there for everyone.

##### 6.7 Log lines, edge cases, effort and risks

**Log lines.** Each planting merge's subject is an approved commit line, so it becomes an unlinked Notes log line tagged `site`: "Six small lights, hidden about the place." (1 November), "Two more lights. One is in the small print." (22 November), then "One more light, very far away.", "One more light, in a picture that travels.", "One more light, somewhere in the sound.", "One more light, on the back of the drawing." It is the only place the tabs ever speak of it.

| Case | What happens |
|---|---|
| Phone | The door, the note and the address; later the small print (a pinch), the picture, the register (the zoom slider) and the static (through `static.wav`). The pocket, the Blink and the bed say "Easier on a computer." |
| Reduced motion | Marks light at once. The Blink is off unless allowed on the hub, until reload. The register needs no motion. |
| Sound off | Only the bed and the static need sound, and both hints say so; the bed is also readable with `curl -I`. |
| His night, 01:00-06:59 | The Blink is not said ("It is 3:12 here. It only says it by day."); the console adds the time; the drawer reads "One light only shows by day here." Everything else keeps no hours. |
| Returning | Progress persists; new lights get the ink dot; after a season, "Last season you saw eight of twelve." |
| Private mode, no storage | Progress in memory: "This browser keeps nothing, so this page will forget when you close it." |
| No WebCrypto | "This browser cannot check. The lights are still there." |
| Two tabs | `keep()`'s `storage` event keeps them in step. |
| Previews and development | Practice answers, said at the top, on their own origin. |
| Someone posts the answers | They go stale at the season's end. |
| Safari | Whether it shows a changing favicon is the branch's to check; if not, the Blink's plainer hint names Chrome and Firefox. |

**Effort.** Season one is M, about three and a half days in week 5, after the policy is enforced: the script, seasons file, lists, `phos.ts`, `morse.ts`, guard and tests a day; the hub and Seen in the dark a day; the six lights a day (the Blink half of it, with its by-hand check); copy, phone and e2e half a day. The six that follow are L across the season, one or two days each. **His hours for season one, under one hour:** `PHOS_SECRET` (five minutes, once), the note's line, the hints and hub copy (fifteen minutes), the word list, the DNS record (five minutes a season), and two minutes per "Seen in the dark" email. Season two is a one-line commit a branch can draft, plus the record.

**Risks.** Play before proof would undo itself, so it opens only with the policy enforced, `/kept` live and the nightly job green. Answers leaking into the public repository: ignored files, the lint in both alphabets, `print` and `verify` refusing in CI, and production refusing a practice key. This document is public, so it holds stand-ins only; the word lists are public by design. Visitors probing the real site: the rules and `/kept`'s scope draw the line, the proxies are fixed first, and nothing on the hub points at `/api`. The Blink is fragile, one light of six, checked by hand before planting. Names in "Seen in the dark": his choice, stated. Tone: no hacker costume, no exclamation marks, scores or timers.

**What it shows.** Recon as a habit (`robots.txt`, headers, DNS); the browser from the inside (hidden tabs' clocks, the favicon, the console, source maps); encoding versus encryption, said in a note; cryptography used honestly, with its limits written on the page; secrets kept out of a public repository by a guard that proves it; microprinting in place of a token to forge; and restraint: a CTF that asks nobody to break anything.

#### 7. Later, and cut

##### 7.1 Later, on `QUEUE`'s rule

A tool is built when three different people write asking for it, or when the one before it has `tool_export` events on twenty of its first thirty days (the tools decision).

**An address, taken apart** (`/tools/address`). *Where a link really goes, read by the browser's own parser.* It is the site's first finding turned outward, and its examples come from the proxy's own tests (`https://mzstatic.com@evil.test/`, `https://a.mzstatic.com./x`, a port, a password). It shows the registrable domain from a bundled, dated Public Suffix List; userinfo tricks; IP addresses in decimal, octal or hex, as the WHATWG parser normalises them; `xn--` names beside their Unicode, with mixed scripts flagged; percent-encoding decoded; redirect parameters (`url=`, `next=`) as the hop they would make; and trackers, with "Take the clean link". It never follows the link, fetches a preview or asks a reputation service: "It reads a link. It does not follow it, and it is not a verdict." M, three days, sharing the certificate tool's punycode decoder. *Moves up if* a second paper is about URL parsing.

**What a picture knows** (`/tools/picture`, new). *What a photograph says about where and when it was taken, and a copy that says nothing.* The tools frame gives a metadata reader to security, and it is the most useful check here for people who are not developers.
1. Drop, paste or choose a JPEG, PNG or WebP. HEIC is named: "Most browsers cannot read HEIC. Share it as a JPEG and it will read."
2. It reads EXIF (Grain's sixty-line APP1 reader, moved to `src/lib/bench/exif.ts`), XMP, IPTC, PNG text chunks and the ICC profile's name, with no library.
3. One sentence each: "It knows where it was taken, to about ten metres: −37.80, 144.97. This page does not look the place up." (no map, since a map is a third party) · "It carries the camera's serial number, which ties every photo it takes together." · "It still holds a small copy of the picture from before it was cropped." (the embedded thumbnail, shown) · "It records the software that last saved it."
4. "Take the clean copy" re-encodes only the pixels through a canvas, orientation applied: "Only the pixels. The colour profile goes too, so colours may shift a little."

Phone: where it matters most; the iPhone's photo picker may drop the location first, and the page says so when a phone's JPEG arrives without one. Nothing is stored. S-M, two days, after Grain ships its reader. It will find the picture light (§6.6), which is behind a door, and this is one of the doors.

**The same file** (`/tools/file`). A download checked against the checksum its publisher printed, and an SRI string such as `package-lock.json`'s `integrity: "sha512-…"` read, which ties to `/kept`'s "It installs from a lockfile and nothing else". `crypto.subtle`, in a Worker for large files. S, after An address.

**Small passes, a day each, when three people ask:** public-key checking for A token, opened (a pasted PEM, JWK or JWKS, `kid` picking the key, Web Crypto verifying RS, PS, ES and Ed25519, HS refused with its sentence); a HAR reader that reads only the chosen entry's response headers; PKCS#7 bundles for the certificate.

##### 7.2 Cut, with what survives

| Idea | Why | What survives | Changes if |
|---|---|---|---|
| "One CVE, plainly", weekly from CISA's catalogue | Fifty-two paragraphs a year of the voice the rules spend sparingly, or generated ones that show nothing, on the page a security reader opens first; and a third-party fetch in every build | When a known-exploited bug touches his stack, Dependabot says so, and that is a `cybersec` note in his words | A season of vulnerability-management applications: monthly, as a note |
| A counter of blocked violations | It needs the endpoint decided out (§1.8), would mostly count extensions, and a public counter reads as failure or theatre | Nothing | Nothing |
| "Knocks": "Someone asked for /.env at 03:12" | Strangers would choose how many writes he pays for and every word shown; a curious visitor would see their own visit published; it shows a log grep, not a skill | One static sentence on `/kept` (§2, block 5); a cached, silent 404 short-circuit in `proxy.ts` if scanner 404s ever become a visible share of invocations | Nothing; the instinct belongs in Last login, where the intruders are fiction |
| How long it would hold | It asks for real passwords, and an honest time-to-crack depends on storage and attacker, which it cannot know | Stet's computed security facts (Daily games §3) | Nothing |
| What kind of hash | Its main use is picking a cracking mode | The same file (§7.1) | Nothing |
| What your browser says | Fingerprinting code on a site whose `/kept` says what it reads and why | "What it asks your browser" (§2, block 7) | Nothing |
| The keeper's pass, both versions | One asked visitors to forge; Strategy §6.2's read-only one keeps a signed token in `localStorage` on a site with no accounts, the habit security readers flag first | Small print; A token, opened teaches "signed, not sealed" | Nothing |
| Build attestation; the draft's line about agents | Vercel builds what is served; Claude Code is acknowledged once, on `/colophon` | `/kept`'s commit and checks links | Builds moving to Actions |
| A path-scoped policy for tools | Ruled: one site-wide policy | `/lab` demos get their own documents (Engineering §5.3) | A tool that runs pasted code: a separate origin |

#### 8. Which pieces to lead with, by role

This feeds `/plainly/security`. VECTOR, his cybersecurity atlas, leads it in every season (`decisions.md`, 3); the rows order the three security pieces after it. `PLAIN_LENSES.security.lead` takes one row's three slugs, so he changes the order per application season with one constant. **Default: AppSec**, the closest fit to "Interfaces, AI tools and security" and to what the site proves. *Changes if* a season of SOC graduate programmes or GRC roles: switch the row.

| Role | Lead with, in order | Then | Plainly's top line (draft) | Leave for later |
|---|---|---|---|---|
| **AppSec** | Paper one (a real SSRF and open proxy, fixed with signatures and tests); paper two (a nonce policy on a WebGL app, and the worker trap); `/kept` (a threat model per route) | Paper three; Headers, read | "I find the holes in my own code, fix them, and write down how." | Phosphenes, which reads as play |
| **SOC / blue team** | Last login's casebook from January (until then `/kept`'s "Where it could be hurt"); paper three (a pipeline an attacker would try, and its guards); the nightly three-engine check and the beacon's log-injection guard | `/kept`'s disclosure policy | "I read logs for what cannot be true, and build things that say when they break." | Paper two's rendering detail |
| **Penetration testing** | Phosphenes (recon as noticing, with "Seen in the dark"); paper one (a constrained SSRF shown safely with a tripwire); Plaintext (frequency, coincidence and XOR, broken by hand) | A token, opened | "I like finding what was left open, and I say so politely." | The dependency policy |
| **GRC** | `/kept` (what it keeps, what it gives away, provenance); `security.txt` and the disclosure policy (RFC 9116, scope, safe harbour); the counts decision (named events, no script, no cookie, disclosed) | The papers, as evidence that controls were tested | "I write down what a system promises, and test that it keeps it." | Plaintext and Phosphenes |

#### Evidence

Under `scratchpad/review/security/`, from 29 September 2026, touching nothing but his own `localhost`: `shots/onhost.mts` and `tripwire-harness.cjs` (re-run for this review); `shots/tt-probe.*`, `probes.mjs`, `worker-probe.mjs` and `troika-refused.mjs` with the three `csp-about-*.png` screenshots; `proto/csp.mjs` and `partA.mjs` (the floor misread one policy at a time); `proto/der.mjs` and `tree.mjs` (ISRG Root X1 and X2 walked); `proto/phos-calc.mjs`, `pbkdf2-cost.mjs` and `hidden-timers*.mjs`; the favicon, hub and microprint shots. Sources: CA/Browser Forum Ballot SC-081v3; Chrome's Certificate Transparency policy; Igalia on Ed25519 in Chrome 137, Firefox 129 and Safari 17; RFC 9116, 6648, 7515-7519, 7797, 8037, 8725, 9068, 9700, 5280, 5480 and 9525; CSP Level 3; Next 16.3.6's bundled CSP and metadata guides.

---

### Decisions

No questions: each is made, with its reason and what would change it. The owner's standing decisions (Melbourne, the public repository, the Desk, the domain, private repositories, counts, Claude Code, the licence, defensive only) are used as given.

**Merged into `decisions.md`, as they apply here** (the reasons and reversing lines are there):
- **Where he is** (item 1): `TIME_ZONE = "Australia/Melbourne"`, `HEMISPHERE = "south"`; papers date, puzzles turn over and the Blink keeps night by his day, falling back to UTC. Why: his commits carry +10:00 and his coursework is a Swinburne unit.
- **The domain** (item 2): `dariustan.dev`, or the first free of three others, by Friday 9 October; `NEXT_PUBLIC_SITE_URL` is the Vercel URL until then; preload a month after it goes live; the address stays his commits' Gmail address with no forwarding. Why: a printed CV cannot be relinked.
- **`WORK_LINE` and the security lens** (item 3): the draft line, and VECTOR first on `/plainly/security`; papers are drafted from the diffs and approved by him, about an hour each. Why: every word can be checked, and his hours go to approving, not drafting.
- **Private work** (item 5): closed, untitled marks; one monthly total; push times for public repositories only; the sync prints counts, and a test fails on a private name. Why: Actions logs on a public repository are public.
- **Memory and "Forget me"** (item 6): Urchi remembers in `eigengrau:urchi` only; `/kept` lists the key and clears every `eigengrau:` key on the second tap. Why: said first, and undoable.
- **Counts** (item 7): Umami, three named events, nothing under Do Not Track or GPC, printed on `/kept` as sent; here posted without the script (§1.6). Why: the streak bucket answers "does anyone come back" with no identifier.
- **Claude Code** (item 8): once, first, on `/colophon`; never on `/kept`, in the papers or in the cards. Why: said first by him, it reads as a way of working.
- **CI and the week-1 fixes** (Engineering 4): `npm run check` on every push; tests in Vercel's build command; a `main` ruleset that blocks only force-pushes and deletion; secret scanning with push protection and one `gitleaks` pass before any Source link; the proxy fixes in the first days of week 1. Why: this report is already public on the review branch.
- **Puzzle banks** (Daily games 3): frozen puzzles in a private repository fetched at build, and a secret seed root. Why: nothing in the public repository holds an answer.
- **Plaintext and the monospace** (Daily games 4, Style 2): Monday 7 December, Commit Mono; Last login after it. Why: one game at a time, four weeks of archive each.
- **Licence** (Tools 2): MIT `LICENSE` for code, a `NOTICE` keeping words, notes and Urchi's likeness; `/kept`'s provenance line says so. Why: MIT is the licence people know how to honour.
- **Later tools** (Tools 4): built on `QUEUE`'s rule (§7.1). Why: "only on demand" needs a number.
- **Defensive only** (Tools, "Also settled here"): the token tool decodes and never tries a secret; Headers, read never fetches an address; the certificate reads what it is given. Why: a proxy or a forger would undo paper one.
- **Paper three** (Strategy, "Also settled here"): the notes Action, not a CTF write-up. Why: defensive, from a real diff, and no CTF hours.
- **Hours and the song under a note** (Music, About and Notes 1 and 3): `WORK_HOURS` and a note's song are listed on `/kept` under what the site gives away, each in the commit that ships it. Why: both are already public; only the moment is new.

| Decision | Why | What would change it |
|---|---|---|
| The proxy fixes and their tests land in week 1 | The findings are readable today on a public branch | Nothing |
| Only the nonce policy with `'strict-dynamic'` and `worker-src 'self' blob:` is ever enforced | Without it the words on Projects and About never draw (F14), and `'unsafe-inline'` is what a reviewer spots | troika dropping `importScripts(blob:)`, or Next shipping hashes for everything |
| An enforced floor comes from `headers()` on every path | It holds if the proxy is ever skipped | The week-3 test showing one header replacing the other: the floor then skips documents |
| Graders, fixtures and `curl` checks read production, never a preview | Vercel protects previews, and report-only breaks nothing | Preview protection off |
| No report endpoint, no Trusted Types, no COEP | The nightly job hears more; a catch-all policy is the weakness; nothing needs isolation | A missed violation a person reports; untrusted text in an HTML sink; a tool needing `SharedArrayBuffer` |
| `Permissions-Policy` names twenty-eight features and allows two, `microphone=()` | Deny by default; grant in the commit that first uses a feature | Grain's `camera`, Sky's `web-share`, That night's `geolocation`, each in its own commit |
| CORP `same-origin` on the doors and static media; `cross-origin` on `/api/urchi.png` alone | Nobody else's page should spend his functions | A feature meant to be embedded elsewhere |
| Sleeve ids signed and undated, songs dated, one secret with domain separation, `NOTES` by membership | "Signs what it hands out", and a note's sleeve must never expire | A leak: rotate the secret; notes still work |
| A missing `PREVIEW_SECRET` in production refuses | A forgotten variable should silence previews, not open them | Nothing |
| Every server fetch goes through `egress()`: https, no port or password, one re-checked hop, five seconds | One fence written once, and the list `/kept` prints | Nothing |
| Previews narrow to `itunes.apple.com` after a week of logging | A fence as wide as the traffic and no wider (F15) | A refused preview host in that week's log |
| `robots.txt` is a route handler | Its comment is a light | Phosphenes ending |
| `security.txt`: `+security` address, GitHub's private reporting, `Expires` six months out, unsigned | A contact checked twice a year stays true; a key he does not keep is worse than none; `decisions.md` item 2 keeps his commits' address and sets up no forwarding, even with a domain | A mailbox on the domain, which item 2 does not create: then `security@<domain>` |
| HSTS `preload` a month after the domain goes live: Monday 9 November for a domain bought by 9 October (`decisions.md` item 2), December at the latest | The owner's decision; preload is slow to undo | A `.dev` or `.app` domain, already preloaded: the step is moot |
| Counts: three named events posted by the site, no script, no page views, nothing under GPC or Do Not Track | "It runs only its own scripts" stays literally true | Umami changing its API |
| `rel="noreferrer"` comes off About's two links; `noopener` stays | The policy already sends only the origin, and he sees the site on GitHub's traffic page | Nothing |
| The supply chain: `npm ci`, a three-day cooldown, audit in CI, CodeQL, push protection | Most malicious npm releases of 2025 were pulled within hours | Nothing |
| `/kept` says "Forget me", prints the three events as sent, and never names Claude Code | `decisions.md` items 6, 7 and 8 | Nothing |
| One grader: marks, not words; moot lines uncounted; `Cache-Control` loose only with a nonce | `/kept` and Headers, read must never disagree | Nothing |
| Try it uses `.invalid` addresses and `javascript:void(0)` | In the report-only week the probes run | Nothing |
| Outside Notes, "new" is an ink dot | The eye colour has exactly three places | Style widening the rule |
| Papers on 25 October, 8 November and 22 November; they never say who found a finding | The launch gate asks for three; the one acknowledgement stays on `/colophon` | The Action slipping past 15 November: paper three covers `add-note.mjs` alone |
| The confirm scripts live in the repository | The papers must name files he has | Nothing |
| `/plainly/security`: VECTOR, then the AppSec row | `decisions.md` item 3; AppSec fits the work line | SOC or GRC applications: switch the row |
| Four tools under "To check", at plain paths | Plain words everywhere; titles carry the search terms | Three months unfound: add `/tools/jwt` as a redirect |
| Headers and Policy 7-11 December, Token 14-16 December, Certificate 11-22 January | The ranking, and the monospace on 7 December | Plate or Last login taking January: the certificate in February, before 15 March |
| Nothing pasted enters a URL, except a policy with its nonces blanked | Fragments reach history, synced tabs and chats | Nothing |
| No letters, no scores, and no "what to send instead" generator | "Nothing gets graded"; a copied config that breaks a site would make the tool the cause | Three people asking for the generator |
| One `readOwn()`, three fixed places; the certificate never fetched; trust never claimed | Any fetch-by-address is F1 again; trust depends on a root store no page sees | Nothing |
| The token tool decodes only and stores nothing | A tool that makes tokens forges them | Public-key checking when three people ask |
| No error message carries input | `JSON.parse` quotes what it failed on | Nothing |
| The log list and the site's chain refresh monthly, `[quiet]` | None of his hours, and the page dates what it shows | He objects to bot commits: the lint warns at sixty days |
| Later: An address, What a picture knows, The same file. Never: passwords, hash types, fingerprints | Each "later" is defensive and useful; each "never" teaches a bad habit or needs data the site should not hold | As §7 says |
| Phosphenes opens 1 November with five lights, or six with the address once the domain of 9 October resolves; the address by 22 November at the latest, eight at launch, then one every three to four weeks | Proof before play; the gate asks for six | The policy slipping: the season slips a week at a time; nobody past three lights by mid-December: slow down |
| The Blink: hidden 60 s, one-second units, sent twice, never at his night, and off under reduced motion unless allowed on the hub | Hidden tabs wake about once a second; the icon's own blinks stop under reduced motion | Slower wake-ups by hand: two-second units, sent once |
| One `PHOS_SECRET` for all seasons, keys derived per season | A season is a one-line commit | A leak: rotate the secret |
| Word answers drawn by the build from public lists | Nobody has to choose | He writes one: `PHOS_WORDS` overrides |
| One salt a season, 512 bits a check (a digest and a proof piece) | One PBKDF2 call, about 55 ms | Slow phones: the piece becomes a second call on a right answer |
| The console light is a collapsed group; the header is `Phosphene`; the DNS light is an apex TXT | Observation, not props; RFC 6648 retired `X-`; `dig TXT` is the first recon habit | A registrar without apex TXT: `_phosphene.<name>` |
| Small print replaces the keeper's pass; the picture's chunk goes into engineering's card | Looking, not forging; one root card | Nothing |
| Two-step hints; "Seen in the dark" with the hub; lights not counted; flags in grotesk until 7 December | Recruiters can finish the easy ones; nobody should wait; the three events are decided; the monospace comes with Plaintext | He wants counts before season two: a fourth event, `phos_seen`, disclosed in the same commit |

### If you only do one thing here

**Close the two doors this week, and ship the tests that hold them in the same branch.** `/api/cover` will fetch from any port on two companies' networks and serve whatever type comes back on his own address. `/api/preview` searches and streams any song for anyone. Both are described in a public branch today (F1-F3).

The fix is about a day:
- sign every sleeve and song the site hands out;
- refuse ports and passwords in addresses;
- follow one redirect, and check it again;
- serve only pictures and sound, with `nosniff` and a sandbox policy;
- give every fetch five seconds.

Promote the tripwire harness into `cover.test.ts` and `preview.test.ts` alongside the fix, so the fix and its proof arrive together. It removes the only real exposure, and everything after it is written from its diff: the headers, `/kept`'s "Where the server may go", paper one.

The one warning for what comes next: never enforce a policy without `'strict-dynamic'`. Without it, the words on Projects and About quietly stop drawing, and a test that listens only to the page will not hear why.
