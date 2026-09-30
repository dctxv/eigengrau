## Strategy, structure and GitHub projects

This reviews `ideas/strategy.md` against the repository, the running dev server, the owner's GitHub account, and the five companion documents already reviewed (`reviewed/daily-games.md`, `engineering.md`, `space-finds.md`, `style-ux.md`, `urchi-realism.md`), plus `ideas/security.md` and `ideas/tools.md`, which it depends on. The strategy document is the best of the set. Its diagnosis is measured rather than guessed, and its warning about the Projects ball is the most urgent correct finding in the whole review. Most of what follows sharpens it, reconciles it with the other documents where they now disagree, and closes the gaps where a plan would break on contact with the code.

### Review verdicts

| Idea | Verdict | Why |
|---|---|---|
| §0 The short version | KEEP WITH CHANGES | The diagnosis is right. Two facts are off: the earliest repository dates from 6 March, not 6 April, and the sound chip is hidden at 1024px and below, not only on phones. It also misses the real urgency. The session adding GitHub projects is running *today*, so the thread fix belongs in that branch now, not in "week 1". |
| §1 The state, measured | KEEP WITH CHANGES | I re-checked it and it holds: 1.12 turns, no lit pill on a case page, 51 of 108 non-merge commits, five visor commits with four merges. Corrections: the earliest repository date, and the case page at 1440×900 (the title is at y=783 and the paragraph starts at y=874, just inside the fold rather than below it). |
| §2 Personas and "two speeds" | KEEP WITH CHANGES | The best reasoning in the document. It misses that a public, unit-coded coursework repository suggests he is a student. That makes the first recruiter a graduate or internship screener with an applicant tracking system, and Plainly then needs Education, a PDF and possibly LinkedIn. *Decided: Education reads "Studying at Swinburne University of Technology.", with the degree and date left empty until he confirms them, and no LinkedIn is listed (decisions.md, item 3).* |
| §3.2-3.3 One sixth pill, named Desk | KEEP | The reviewed style-ux and engineering documents both land on it too. The options table is sound. "Desk" is the only name on the list that holds a puzzle, instruments and papers without a joke. |
| §3.4 Desk third, tabs renumbered | KEEP WITH CHANGES | The order is right, and it must be decided before the digits become keys. But the effect on Music "through the wall" is misdescribed. Space goes from three rooms away to four, which clamps to the same sound (`sfx.ts:322-326` has three entries). The audible change is on Projects, which moves from −22 dB to −28 dB. |
| §3.4 `tabOf`/`pillOf` and the Shell plan | KEEP WITH CHANGES | The core is right, but it misses four hooks. (1) sfx's `tabOf` maps a case page to Projects and everything else to `/`, so it needs `pillOf(p) ?? "/"`, not the new `tabOf`. (2) Space's look back at the tab you left is gated on `isTab(left)` (`CreativeSpacePanel.tsx:433`). (3) `pillAt` finds pills by `href` (`attention.ts:119`, `:553`). (4) Without memory, the Desk pill would always open the shelf, which breaks the promise that tabs stay where you left them. |
| §3.4 URLs | KEEP WITH CHANGES | Use paths (`/today/stet/6`), overruling the daily-games review's `?stet=6`. The Desk's `tabOf` removes the reason that review cut sub-routes, and `opengraph-image.tsx` receives `params`, never `searchParams`. |
| §3.4 "No fourth WebGL context" | KEEP WITH CHANGES | This conflicts with `tools.md`, where Sky and Grain each build a `WebGLRenderer`. The rule becomes: no fourth *kept* context. |
| §3.5 Decisions made once | KEEP WITH CHANGES | His midnight, falling back to UTC, is right, and the engineering and games reviews agree. "Three games in the first year" becomes "three on the shelf at once", because the games review ranks four dailies plus a weekly. The analytics decision changes (below). |
| §4.1-4.2 Month model; "GitHub knows when, `site.ts` knows why" | KEEP | Verified in code and on screen (`strat/thread-all2026.png`: one S-curve, "Twelve projects since 2026."). |
| §4.2 `year` taken from `start` for paused work | KEEP WITH CHANGES | "Paused since" means since it went quiet, so paused takes `end` (the month of the last push). The mark itself sits at `start`. |
| §4.3 Status proposed from signals | KEEP | Good defaults. "Dead is his word to say" is exactly right. |
| §4.4 The cover chain | KEEP WITH CHANGES | Steps 2 and 3 would copy a *private* repository's social preview and README images into a public repository. A closed project takes his own cover or the weave, and nothing else. |
| §4.4 The weave | KEEP WITH CHANGES | Right as a fallback. Render it as an SVG string through `sharp`, which Next already installs, so no browser is needed in CI. Scale it by the 95th percentile, not the maximum. It must not become most of the ball. |
| §4.5 Pieces and `Piece:` trailers | KEEP WITH CHANGES | The neatest idea in the section. Private repositories contribute nothing, not even a trailer's line or its date, because nothing of theirs reaches the site (decisions.md, item 5). |
| §4.6 Time on the thread | KEEP WITH CHANGES | One fixed pluck ladder in months instead of a mode that switches with the data. Year labels become a period key. |
| §4.7 Commit activity as thickness | KEEP WITH CHANGES | Feasible: the thread's strip reads per-sample arrays (`ThreadScene.ts:4749`), so a width array slots in. Normalise by the 95th percentile, or this site's own week of 136 commits flattens everything else. |
| §4.7 The loose end stirs | KEEP WITH CHANGES | Lovely and S. It needs a token at runtime, which §4.8 forbids ("never in Vercel"), so use a second, metadata-only token, scoped to the public repositories, because push times are shown only for those (decisions.md, item 5). The night check must not read `?hour=` (`hours.ts:21-29`). |
| §4.7 "He is working" on Space | KEEP WITH CHANGES | A real signal, like the music, and 45 characters (the cap is 48). It ships after the pulse and never during his night. |
| §4.8 Sync script, daily Action, committed JSON, `/api/pulse` | KEEP WITH CHANGES | The architecture is right. Three fixes. `UPDATED.projects` may bump only on a meaningful change, or Urchi says "Changed since" every day. The slugs of closed projects must not reveal their repositories, even in the curation file. The bot's commits must be kept out of the log (`[quiet]`). *Decided since: closed marks are untitled and come from the sync alone, so the curation file holds no closed entries at all (decisions.md, item 5).* |
| §4.9 Case page v2 | KEEP WITH CHANGES | Right order. Add the lit pill (`aria-current="true"`, per style-ux), status words in months, `did` required, and a "Source" link only for repositories that pass the hygiene check (new, below). |
| §4.10 Private, coursework, team | KEEP | Eight of fifteen repositories are private, so this is the main case. Add the university's rule on publishing coursework as a risk. *Decided: the Career Hub keeps its case page and its team, with no Source link (decisions.md, item 5).* |
| **New:** a brief for the session adding projects today | ADD | Every item in §4.6 is cheaper inside that branch than after it merges. |
| **New:** the intro ring needs twelve real images | ADD | `IntroRing.ts:73-78` strides through `SPACE_ITEMS` for twelve thumbnails. With six real pieces the ring of twelve becomes six, on the first screen anyone sees. |
| **New:** the Source link is a promise | ADD | For an owner showing security skills, a public repository with a secret in its history, or no README, undoes the case page that links to it. |
| §5.1 Plainly | KEEP WITH CHANGES | Keep. Lenses become static paths. The time uses the site's 24-hour `clock().text`. Add Education and a static PDF. There is no LinkedIn to add (decisions.md, item 3). |
| §5.2 Cards | KEEP WITH CHANGES | Add a truthful metadata title, because "Basic Human" is today's `<title>` and JSON-LD `jobTitle`. Canonicals go per route (Style R1, F-H6). |
| §5.3 "How it is made, and kept", as one page | KEEP WITH CHANGES (split in two) | It collides with `security.md`'s `/kept` and style-ux's `/colophon`, which serve different readers. Merging them buries the page a security reviewer is sent under the typefaces. Two short pages, linked to each other. `/kept`'s "No analytics" line must match what Quiet counts does: three named events and nothing else (decisions.md, item 7). |
| §5.4 The log writes itself | KEEP WITH CHANGES | Run it locally, approved by him, because Vercel builds from a shallow clone (engineering review). The `whatsNew` change is unnecessary if `log.json` merges into `ENTRIES` rather than `NOTES`. |
| §5.5 Notes from the phone | KEEP WITH CHANGES | Guard on `author_association == 'OWNER'`, not on a label: an issue form applies its labels for anyone who files it. |
| §5.6 By feed | KEEP | S, and no risk. |
| §5.7 Go, and the keys | KEEP WITH CHANGES | A Cmd-K palette is the most copied pattern on developer portfolios. Ship the `?` sheet first. Go comes later, opened by typing anywhere (Notes' own habit, taken site-wide), with the off switch WCAG 2.1.4 requires. |
| §5.8 The sky keeps the calendar | KEEP WITH CHANGES | Patching variant weights would also change how often the Milky Way appears, so patch the shooting layer instead. His commits are stamped +10:00: from there the Perseids and Quadrantids never rise, and the Eta Aquariids are the year's best. |
| §5.9 Doorstep | KEEP WITH CHANGES | Widen it to the profile itself. `dctxv/dctxv` does not exist yet, and one of the seven public repositories has a description. |
| §5.10 Quiet counts | KEEP WITH CHANGES | Vercel Web Analytics custom events need the Pro plan (confirmed in the engineering review). Decided: Umami, cookieless, proxied same-origin, with three named events only (decisions.md, item 7). |
| §5.11 Since Tuesday | KEEP | S. |
| §5.12 Someone was here | KEEP (later, with a traffic gate) | Quiet presence, with privacy built in. It is worthless without traffic, and the proposal already says so. |
| §5.13 The common sky | CUT (for 2026) | User-generated content, moderation and a key-value store, on a site about one person. Revisit only if 5.12 shows people come. |
| §5.14 The year, wound | KEEP WITH CHANGES | Freeze the numbers on 31 December. Last.fm's `12month` period is rolling, so by 7 January it is a different year. |
| §5.15 Others here | CUT | Agreed. |
| §5.16 The skips | KEEP | Every reason holds. The Strava one is the best. |
| §6.1 A clock of one person | KEEP | The real thesis of the site. |
| §6.2 Four bets | KEEP WITH CHANGES | Bet 3 becomes Phosphenes (below). |
| §6.3 Noticed | CUT as its own feature; MERGE into Phosphenes | There are now two capture-the-flag games in two documents. `security.md`'s Phosphenes has the better name (the lights you see in eigengrau), PBKDF2 rather than SHA-256, and flags generated and git-ignored. Noticed contributes the Blink and a visible row on the Security drawer. |
| §6.4 What to stop doing | KEEP WITH CHANGES | "One content commit for every Urchi commit" can be gamed when Claude writes the commits, and it fights what he asked for (Urchi alive). Replace it with dated content gates, and turn the polishing itself into content. |
| §7 Roadmap | KEEP WITH CHANGES | Resequenced around the branch in flight. Week 1 held four M-sized jobs labelled S. `error.tsx` cannot catch a panel's WebGL failure (engineering review). |
| §8 Measures | KEEP WITH CHANGES | The commit ratio is replaced by content gates. |

**What I checked**

- **Code, confirmed at the cited lines:**
  - Shell: `Shell.tsx:62, 128, 131-132, 143, 193, 216-218`.
  - Routes and nav: `routes.ts:5-11`, `Nav.tsx:35`, `Tab.tsx:46-50`.
  - Intro: `intro.ts:35` (`drop: 5.05`) and `:46` (the second pill).
  - Sound: `sfx.ts:315-326` (`HOME`, `AWAY`), `:496-499` (`tabOf`) and `:703`.
  - Space: `CreativeSpacePanel.tsx:334-338, 433, 460-463`.
  - `ThreadScene.ts`:
    - `:235` `TURNS_PER_YEAR`, `:253` `LOOSE`, `:262` `MARK_GAP`;
    - `:292` `PLUCK_HZ`, D4 down to F3;
    - `:826-833` Ribbons;
    - `:1393` the year labels, `:1406` `makeBead` by year;
    - `:1592-1598` wind, `:1697-1741` placed by year;
    - `:2978-2982` `runOf`, in whole years;
    - `:3850` the contact sheet's year flag;
    - `:4749` the main strip, `:4946-4980` the loose end.
  - `tone.ts:48` (`labOf`), `:65` (`rgbOf`) and `:80` (`fromLch`).
  - `hours.ts:31` (`clock`: its `text` is 24-hour "h:mm").
  - `site.ts:10, 16, 27, 99, 185, 191, 201, 209, 251`.
  - `layout.tsx:6-11` (metadata) and `:21-33` (JSON-LD, `jobTitle: ROLE`).
  - `visits.ts:95, 116, 167`, `IntroRing.ts:14, 73-78`, and `globals.css:237-241` (the chip hidden at ≤1024px).
- **Measured** with `strat-rev/pills.mjs` against localhost:3000:
  - At 390px the nav is 213-227px wide (widest with Projects lit). A sixth pill adds about 25px, so 238-252px, which fits.
  - On `/projects/nocturne` no pill is lit, at either width.
- **Git.**
  - 108 non-merge commits, 51 of them prefixed Space, Urchi or Suit.
  - The visor went thick rim (26 September), then slim rim, six points, no rim and a thin rim again. Those last four came in one morning, 09:52-12:33 on the 28th, with four merges.
  - Commit times carry +0000 and +1000.
- **GitHub** (`user:dctxv`): 15 repositories, 7 public and 8 private.
  - The earliest was created on **6 March 2026** (the public coursework repository), not 6 April.
  - Four have descriptions: `eigengrau` and three private ones. No other public repository has one.
  - As in the proposal, I name no private repository here.
- **Wrong or missing in the proposal:**
  - The music-through-the-wall rooms.
  - sfx's `tabOf` semantics.
  - The comeBack gate and `pillAt` by href.
  - The Desk pill's memory.
  - The token contradiction.
  - Private images leaking through the cover chain.
  - `UPDATED.projects` bumped daily.
  - `year` for paused work.
  - The 24-hour clock in Plainly's copy.
  - WebGL in tools.
  - Vercel custom events.
  - The duplicates of `/kept` and Phosphenes.
  - The intro ring.
  - The hemisphere.

---

### Refined proposal

In priority order. **New** marks what does not exist in the repository. Where this document and a companion disagree about where something lives or what comes first, this one decides. It follows the reviewed versions of the companions, not the drafts.

---

#### 0. The short version

1. **The site serves people who notice, beautifully. It hardly serves anyone else.**
   - On a desktop his name is on screen from 0.3s to about 4s after a hard load, at the window's far edges, and never again. On a phone it never appears.
   - The digits on the pills do nothing.
   - A link pasted into a chat shows no picture, and its title says "Basic Human".
   - A work laptop without WebGL gets "Application error".
   - The first thing a security reviewer runs gives the site an F.
   - Phones and tablets cannot turn the sound on.
   - Each of these is small to fix, and none of them touches Urchi.
2. **Urgent, today: real GitHub projects will break the Projects ball, and the session adding them is running now.**
   - All fifteen repositories were created in 2026 (6 March to 24 September).
   - The thread winds 1.5 turns a year and places projects by year alone. With only 2026 in the data it unwinds into one loose S-curve of 1.1 turns, every pluck is the same D4, and the heading reads "Twelve projects since 2026." Past twelve it reads "15 projects".
   - Hand that session the brief in §1 now, before it merges.
   - *Decided since (decisions.md, fact 1): that branch merged as `0d9641d`, with four public projects, thirteen real pieces, `TURNS_LEAST = 9` and every placeholder gone. The brief's months, `did` lines, closed marks and `countWord` did not come with it, so they are the week-1 branch "Projects: months on the thread" (§1).*
3. **Everything new goes behind one sixth pill, Desk, placed third.**
   - Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6.
   - The Desk holds three drawers, Today, Tools and Security, each with its own short URL. One kept panel owns them.
   - Space stays Urchi's and the Desk is his. **Urchi never comes to the Desk.**
   - Beside the tabs: **Plainly** (`/plainly`), a printable page for people with a minute. **How it is kept** (`/kept`) and **How it is made** (`/colophon`) are two short pages for the two kinds of curious.
4. **Four signature bets:**
   - **It remembers you:** Urchi alive, bringing things back.
   - **The thread is true:** Projects driven by GitHub. The thread is thicker where he worked, and its loose end stirs when he has just pushed.
   - **Phosphenes:** security shown as noticing. The site is hardened and reads its own headers back to you, and twelve lights are hidden about the place.
   - **New at midnight here:** one excellent daily game first, not five.
5. **Content by date, not polish by ratio.**
   - Keep making Urchi more alive; he asked for exactly that.
   - But the launch waits on dated content gates: real projects with his part stated, notes every week, and three security papers.
   - The polishing itself becomes content: "Five visors" is a case study, not an embarrassment.
6. **Roadmap:**
   - **This week:** the two proxies closed in the first days (this report is already public, decisions.md, fact 2), real projects on a thread that can hold them, his name on screen, cards, digits as keys.
   - **Next week:** safe, plain, and the Desk's frame. Soft launch on Sunday 11 October, and daily puzzle No. 1 at his midnight into Monday 12 October.
   - **Two months:** finds, two dailies, two tools, `/kept`, Phosphenes, three papers. Public launch in the week of 23 November.
   - **Later:** Plaintext from Monday 7 December, the year wound on 31 December, presence, and the rest.

---

#### 1. Do today: a brief for the session adding GitHub projects (new)

**Pitch.** Ten minutes now saves a second pass over the 5.3k-line `ThreadScene.ts` next week.

*Decided since (decisions.md, fact 1, and Strategy, "Also settled here"): the session merged as `0d9641d` at 16:40 UTC on 29 September. It removed every placeholder (item 1), brought four public projects (VECTOR, Digital Career Hub, NextBranch and Atelier) and thirteen real pieces, so the ring's twelve can be met (item 7), and set `TURNS_LEAST = 9` in `ThreadScene.ts`, the floor in item 3. It did not bring `start`/`end` months or marks placed by date (items 2-3), `countWord` in `projectsLine` (4), months in `statusWord` (5), closed marks (6) or `did` lines (8). Those are one week-1 branch, "Projects: months on the thread", which owns `ThreadScene.ts` alone; the `did` lines are drafted in it from each repository's authors and README and marked `draft: true` until he reads them; closed marks wait for the sync in week 3. The brief below is kept whole as that branch's checklist. Line numbers are from `9b8c07c`.*

**Why now.** The owner is replacing the placeholder projects in another Claude Code session. The engineering review already says "pull ThreadScene's layout out with the GitHub-projects branch now in flight, or after it merges, never beside it." The cheapest moment to fix the time model is inside that branch, while the data is being typed.

**The brief**, to paste into that session as written:

> Before any real project replaces a placeholder:
>
> 1. Remove every placeholder together, in one commit:
>    - all of `PROJECTS`;
>    - all twenty `SPACE_ITEMS` (including the studies dated 2021-2025);
>    - the generated art in `public/work`.
>
>    A real 2026 project next to a fake 2021 study makes the heading say "since 2021" and winds five empty years.
> 2. Every project gets `start` and `end` as `"YYYY-MM"`: the month the work began, and the month of the last push (or archive). Keep `year` for now, derived from them: `start` for alive, `end` for paused, dead and shipped.
> 3. In `ThreadScene.wind()` (`ThreadScene.ts:1592-1598`):
>    - `T0 = earliest start - 1/12`;
>    - `turns = Math.max(9, TURNS_PER_YEAR * (T1 - T0))`.
>
>    Place beads by fractional date instead of by year (`:1697-1741`): sort by date, place each at `idxOf(t)`, sweep forward so that no two overlap (row length plus `MARK_GAP`), then shift back if the last one runs past `T1`.
> 4. `projectsLine` (`site.ts:209`) uses `countWord`, not `numberWord`. When every project is in the current year, it names the month instead of the year: "Nine projects since March. Two alive."
> 5. `statusWord` (`site.ts:185`) writes months: "alive since April", "paused since July", "shipped August". In another year it writes "paused since July 2025". Over a year ago it writes only the year: "shipped 2024".
> 6. A private repository is a closed mark:
>    - it is untitled, sits at the month the repository was created, and reads "Closed. Ask and I will show you.";
>    - nothing from GitHub's name, description, language, README or README images reaches the site or the repository;
>    - there is no Source link.
>
>    *Decided (decisions.md, item 5): all eight private repositories appear this way, and their pushes thicken the thread only as one monthly total.*
> 7. The intro ring (`IntroRing.ts:73-78`) takes twelve thumbnails from `SPACE_ITEMS`. Keep at least twelve real images among the pieces, or pass it covers as well.
> 8. Every project has a `did` line: "Alone." or who else was involved and what I did. Draft each one from the repository's authors and README, marked `draft: true` until I have read it (decisions.md, item 3).
> 9. Bump `UPDATED.projects` (`site.ts:99`) to the day this lands.

**Effort:** S-M, inside work that is happening anyway.

**What it shows:** that the owner treats data changes as design changes. Recruiters never see it, and they never see the broken ball either.

---

#### 2. Who it is for: the two speeds

**The principle: two speeds.** Every page must answer "who is this, and what does he do" in words within three seconds. Everything else is for the people who stay. Today the site has only the slow speed.

##### 2.1 The recruiter or hiring manager

- **Arrives from** the link on his CV, LinkedIn, or an applicant tracking system. Usually a managed work laptop (Chrome or Edge), sometimes with hardware acceleration off by policy, with twenty to forty other candidates open in other tabs.
- **He is studying:** a public repository is a unit-coded team project (`ict30017-…`), a Swinburne University of Technology unit, which suggests he is. Then the first reader is often a graduate or internship screener, whose system wants a PDF, a degree and a date.
  - *Decided (decisions.md, item 3): this screener is the first reader, and a security hiring manager the second. Plainly says "Studying at Swinburne University of Technology.", with the degree and date empty until he confirms them. The content lint fails from Monday 16 November until he does, or sets `EDUCATION = null`.*
- **Wants in thirty seconds:**
  - his name and a real role in words;
  - three pieces of work, each with what he did and with what;
  - proof they are real (source, a live site);
  - how to reach him;
  - where he is, and when he is free.

**The thirty seconds today:**
- **0-4s.** A ring of twelve generated thumbnails and a counter. "Darius Tan" and "Basic Human" sit at the window's edges, about 1100px apart. The eye is on the ring.
- **4-8s.** The ring draws in, two eyes open and the head builds. Nothing is clickable until the chrome drops (`T.drop`, `intro.ts:35`).
- **8-15s.**
  - A spiky head, "D . T", "Space" and the digits.
  - Hovering the head gives "Urchi / It does not know it is the mascot."
  - Pressing `2` does nothing, so they click it.
- **15-25s.**
  - The ball: "Work  Six projects since 2021. Two alive."
  - "Case" opens a cover that fills the screen. At 1440×900 the title sits at y=783 and the paragraph starts at y=874, the last line of the window.
  - There is nothing about stack, his part or links.
- **25-30s.** About: the statement, "Busy putting a hole in spacetime", and GitHub, Instagram, Email.

**Where they get stuck:**
- "Basic Human" is the only role on the site, and it is a joke.
- No case page says what he did or with what.
- There is no CV.
- On a locked-down laptop the whole thing is "Application error".

**What they need, in order:**
1. His name and a true work line, visible on every page.
2. Plainly, with a CV that prints to one page, and a PDF.
3. Case pages that answer what, with what, his part, when, and where to see it.
4. A fallback that works without WebGL.
5. A share card that tells them whose link it is.

**What they remember:** "the one with the cat". **Urchi is why they remember him. Plainly is why they can shortlist him.**

##### 2.2 The security hiring manager (SOC, AppSec, penetration testing, security engineering)

- **Arrives from** a CV link, on a desktop.
- **Checks the site before reading it, by reflex:**
  - `curl -I`, or securityheaders.com and the Mozilla Observatory;
  - view-source;
  - `/robots.txt` and `/.well-known/security.txt`.
- **Then looks for** write-ups, a CTF profile, certifications, and security repositories.

**Today:**
- Recon finds only `cache-control`, which grades an F. `security.txt` and `robots.txt` are both 404.
- `/api/preview` searches and streams for anyone who asks, and `/api/cover` reaches any port on two CDN domains (`security.md` F1-F3).
- Notes has a `cybersec` category with nothing in it.

**Where they get stuck:** nothing on the site says security, and the one thing they always check says the opposite. **For this reader, a security gap is worse than having no security content at all.**

**What they need:**
1. The site hardened and saying so: A+ headers, a CSP, the proxies closed, and a real `security.txt` with a policy (`security.md` §1-§2).
2. Two or three papers, each ending with "what I would tell the developer".
3. Hands-on proof: a CTF profile link, and tools with a threat model a reviewer respects.
4. Something to look for: Phosphenes.

**From outside his shoes:** the first two papers already exist as findings.
- "How this site stopped being anyone's song proxy."
- "A CSP for a three.js site whose text renderer builds its workers from `blob:` URLs."

Writing about your own fixes is the most credible security writing there is.

##### 2.3 The fellow developer

- **Arrives from** his GitHub profile, a Discord, Hacker News, X or Bluesky. Desktop, with devtools open within a minute.

**Today:**
- They fling Urchi until the line snaps (delight).
- Few spin the ball hard enough, for long enough, to find the supernova.
- In devtools they see three.js, troika and GSAP.
- They look for the source. The repository is public, but the site never links it.
- They try Cmd-K and `?`, and get nothing.

**What they need:**
- the colophon, with the stack and a source link;
- a key sheet;
- tools they can use themselves (Sky, Grain, Cues);
- the log in Notes;
- something to share: the snapped line, the rhythm blinked back, a sky seed (`?sky=` exists as a development knob; once skies are frozen as version one in week 4, a shared sky link carries `v=1`, decisions.md, Tools 3).

##### 2.4 The designer or creative director

- **Arrives from** Instagram, a gallery (after launch), or a friend's share. Large screen, trackpad.
- **Today they notice:** the two colours, Newsreader at 300, the masked rises, the pill that morphs, the thread.

**Where they get stuck:**
- Case pages are thin, and there is no process on them.
- The best design work on the site (Urchi traced from `urchi/ref/`, faceted, fitted with a suit at `/dev/suit`) is visible only in development.

**What they need:**
- process shown as pieces;
- **a case page for Urchi itself**, on the thread as "alive since September", with "Five visors" as its best piece row (§7.5);
- the colophon;
- case pages that each explain one decision.

**From outside his shoes:** Urchi is his strongest design project, and it is not on his projects page.

##### 2.5 The friend

- **Arrives from** a message from him, on a phone. The preview has no image and reads "Darius Tan - Basic Human".

**Today:**
- An eight-second intro, with no name on a phone.
- Urchi, and a tap that brings it back in a spacesuit (lovely).
- Music, if he is playing something ("About two minutes in."), is the most human thing on the site.
- Notes says "hi".
- No sound is possible on a phone, and there is nothing to send back.

**What they need:**
- something new since last time;
- a reason to come back tomorrow (Today);
- something to send back (a daily result, a find, a sky);
- sound on phones.

##### 2.6 The stranger from Instagram

- **Arrives from** the link in @dctxv's bio, inside Instagram's in-app browser:
  - held upright;
  - audio restricted;
  - storage that may not last;
  - a back button that leaves for Instagram.
- **Attention span:** about five seconds.

**Today:**
- 0-8s is a counter and generated thumbnails, which is exactly where in-app browsers lose people.
- If they stay, the head does not say it can be touched. If they touch it, magic.

**What they need:**
- A reaction within a second: Urchi's eyes find the thumb as it lands.
- A short intro on a second visit and in an in-app browser (Style R12, F-M12, using a first-load flag).
- One thing to screenshot or post back.

##### 2.7 The owner

**Today:**
- All content lives in a TypeScript file. `npm run note` works from a terminal, and it pushes straight to main.
- `UPDATED` dates are bumped by hand.
- Nothing tells him whether anyone came.
- `SITE_URL`, `TIME_ZONE` and the email are still placeholders. All three are now decided: `NEXT_PUBLIC_SITE_URL` (the Vercel production URL until a domain), `Australia/Melbourne`, and `dctxvv@gmail.com` (Decisions, below).

**What he needs:**
- projects that come from where the work already is;
- notes from the phone;
- log lines he approves rather than writes;
- private counts with no cookies;
- a launch check that fails while placeholders remain;
- content gates that stop Urchi work from quietly eating the time the content needs.

##### 2.8 Who needs what

| Need | Recruiter | Security | Developer | Designer | Friend | Stranger | Owner |
|---|---|---|---|---|---|---|---|
| Name and true work line, at once | ● | ● | | | ● | ● | |
| Plainly, a CV that prints, a PDF | ● | ● | | | | | ● |
| Case pages with his part, stack, links | ● | ● | ● | ● | | | |
| Works without WebGL | ● | ● | | | | | |
| Share cards | ● | | ● | ● | ● | ● | |
| Hardened, and read back in public (`/kept`) | | ● | ● | | | | |
| Real projects, kept fresh from GitHub | ● | ● | ● | ● | | | ● |
| Colophon and source | | ● | ● | ● | | | |
| The daily game | | | ● | | ● | ● | |
| Tools | | ● | ● | ● | | ● | |
| Sound on phones, a fast first reaction | | | | | ● | ● | |
| Notes kept fresh | | | ● | | ● | | ● |
| Private counts | | | | | | | ● |

The five fixes that serve the most people are the name, Plainly, case pages, share cards and the no-WebGL fallback. None of them touches Urchi.

---

#### 3. Real GitHub projects on the thread

##### 3.1 What GitHub says, and why the ball will break

**His GitHub, read on 29 September 2026:**
- 15 repositories: 7 public and 8 private.
- All created between **6 March** and 24 September 2026.
- Four have a description. Among the public ones, only `eigengrau` ("Personal site.") does.
- Languages: TypeScript, JavaScript, Python, C# and HTML.
- One public repository is coursework for a Swinburne University of Technology unit (`ict30017-digital-career-hub`). One is a test (`urchi-test`).
- Pushes: only three repositories were pushed within the 45 days before 29 September (counting from 15 August). Most went quiet in July or August.

**The thread today:**
- It winds `TURNS_PER_YEAR = 1.5` (`ThreadScene.ts:235`) from the earliest year to now (`:1593-1598`).
- It ties beads on by year only (`:1697-1741`), stepping each year's knot round by the golden angle because "the data knows years, not months".

**With only 2026 in the data:**
- `T0 = 2026` and `T1 ≈ 2026.74`, so the ball is 1.12 turns.
- Every mark crowds onto one stretch and is squeezed (the squeeze at `:1714`).
- Every pluck is D4, because `runOf` (`:2978-2982`) counts whole years.
- The heading reads "Twelve projects since 2026." Past twelve it would read "15 projects", because `numberWord` stops at twelve.

**With real statuses (the rules in §3.3):** this month, the heading would honestly read something like "Nine projects since March. Two alive." That is fine. It is the truth, and it reads like the site.

*Decided since (decisions.md, item 5): with all eight closed marks the count is fourteen (four public projects, eight closed, eigengrau and Urchi), so it reads "Fourteen projects since March." That is past `numberWord`'s twelve, so `countWord` is needed now, not later.*

##### 3.2 The split: GitHub knows when, `site.ts` knows why

| Field | Source | Why |
|---|---|---|
| Whether it is on the thread | `projects.ts`: an entry names it. For a public repo, the GitHub topic `thread` opts it in as a study. | Curation is his. A dump of repos is not a portfolio. |
| `title` | `projects.ts`, defaulting to the public repo's name tidied (`plateup-bridge` becomes "Plateup bridge") | |
| `why` (the one honest line) | `projects.ts` only, always | The voice is not data |
| `summary`, `did`, `stack` words GitHub cannot know ("three.js", "GSAP") | `projects.ts`. For public repos, `summary` falls back to the README's first paragraph until he writes one. | |
| `status` | Proposed by the sync (§3.3). A value in `projects.ts` wins. | GitHub proposes, he decides |
| `start`, `end` (`"YYYY-MM"`) | `created_at`, and the last push or the archive date. His value wins, because a repo is often created after the work began. | Month precision |
| `year` (kept for compatibility) | Derived: `start` for alive; `end` for paused, dead and shipped | `statusWord` reads it (`site.ts:185`) until it moves to months |
| Languages, weekly commits, releases, homepage, topics, archived, social preview, README images | GitHub, at sync time. **Public repos only.** A closed repository gives only the month it was created, and its pushes join one monthly total across all eight (decisions.md, item 5). | |
| `cover`, `hover` | `projects.ts` if given, otherwise the cover chain (§3.4) | |
| `closed` | The sync, for every private repository when `SYNC_PRIVATE` is `all`, minus any named in the secret `SYNC_EXCLUDE` | Privacy is decided once: all eight appear, untitled (decisions.md, item 5) |

**The data shape:**

```ts
// src/content/projects.ts (new: PROJECTS and SPACE_ITEMS move here from site.ts, per engineering §4.1)
export type Entry = {
  slug: string;
  repo?: string;                 // "dctxv/VECTOR". Public repos only; a closed entry never names its repo here
  title?: string;
  why: string;
  status?: Status;
  start?: string; end?: string;  // "YYYY-MM"; his value beats GitHub's
  summary?: string;
  did: string;                   // required: "Alone." / "With three others, for a university unit. I did the API and the deploy."
  stack?: string[];
  cover?: string; hover?: Media;
  closed?: boolean;              // private: written by the sync, never here; untitled, no links, only its created month
  // no per-repo `activity` flag: closed pushes thicken the thread only as one monthly total (decisions.md, item 5)
  plain?: number;                // its place on /plainly, if any
  lenses?: ("security" | "design" | "dev")[];
};
import GH from "./github.json"; // written by scripts/sync-github.mjs, keyed by slug
export const PROJECTS: Project[] = ENTRIES.map((e) => merge(e, GH[e.slug]));
```

**The one rule the proposal missed: a closed repository's name cannot appear in the public repository at all, not even in the curation file.**
- The mapping from slug to private repository lives in an Actions secret, `THREAD_CLOSED`, as JSON: `{"atlas-of-me": "dctxv/<private>"}`.
- The sync reads that secret. The site reads only `github.json`, which is keyed by slug.
- *Decided (decisions.md, item 5): no mapping is needed, because closed marks are untitled. The sync lists private repositories at run time when the Actions variable `SYNC_PRIVATE` is `all`, skips any named in the secret `SYNC_EXCLUDE` (the Today bank's repository among them), and writes each as `closed-1`, `closed-2`… by created month. `THREAD_CLOSED` is not created. A test fails the sync if any private name, fetched at run time and never stored, appears in `github.json` or in the Action's log, because Actions logs on a public repository are public (fact 4).*

##### 3.3 A repository as a project: status, proposed

His value in `projects.ts` always wins. When the sync disagrees, it prints one line in the Action's log, never on the site: "VECTOR: you say alive. The last push was 81 days ago." For private work it prints only counts: "Eight closed. Forty-one pushes in September." (decisions.md, item 5).

| Signal | Status proposed |
|---|---|
| `archived: true` | dead. It is shipped only if he says so, because shipped means handed over. |
| pushed within the last 45 days | alive |
| a release, or a homepage that answers (a `HEAD` request returning 2xx), and no push for more than 45 days | shipped |
| no push for 46 to 365 days | paused, since the month of the last push |
| no push for more than a year, not archived | paused. The sync asks "A year without a push. Dead?" and never calls anything dead by itself. **Dead is his word to say.** |

**What goes on the thread:**
- **Projects:** each entry in `projects.ts`. The mark sits at `start`.
- **Studies:** opted-in public repos with fewer than twenty commits become unlabelled beads, which are `SpaceItem`s without a `project`, as studies are today.
- **The site itself and Urchi:** `eigengrau` goes on the thread as a project, alive since September. So does **Urchi**, as its own project, with the design pieces (the reference, the trace, the facets, the suit sheet, and the five visors). The thread's loose end is, truthfully, this site.
- **Left off:** tests and scratch (`urchi-test`), and `plateup-bridge` until it has a README and a `why` (decisions.md, item 5).

**The heading**, from the data: "Nine projects since March. Two alive." (with the eight closed marks, "Fourteen projects since March.", §3.1). This is `projectsLine` with `countWord`, naming the month while everything is inside the current year. Style R14 (F-L3) already renames the lead "Work" to "Projects".

##### 3.4 Covers: a chain, and the weave

**Take the first of these that exists:**
1. **`cover` in `projects.ts`**: his own image. **Required** for every project with `plain` set (the top five), and for every project with a live site: a real screenshot of the thing in use.
2. **The repo's social preview** (public repos only), if he uploaded one. GraphQL returns `openGraphImageUrl` and `usesCustomOpenGraphImage`. Skip GitHub's generated card.
3. **The README's first image** (public repos only).
   - Parse Markdown and HTML `<img>`, and resolve relative paths against `raw.githubusercontent.com`.
   - Skip badges: shields.io, and anything under 64px on either side.
4. **The weave** (new): a procedural cover drawn from the repository's own rhythm of work. A closed mark wears no cover at all: a weave would draw one private repository's rhythm, and its pushes are shown only inside the monthly total (decisions.md, item 5).

**The weave, specified:**
- **Frame:** 3:4, 900×1200, on the eigengrau ground.
- **Rows:** one horizontal thread per week of the repository's life, up to 104 weeks. The first week is at the bottom, as the ball winds from the bottom.
- **Thickness:** proportional to √(commits that week ÷ that repository's 95th-percentile week), from 0.5px to 9px, and clamped. A week with no commits leaves a hairline gap, so the silences show.
- **Colour:**
  - Each row takes a language, by a seeded draw weighted by byte share.
  - Take GitHub's linguist colour and run it through `labOf` (`tone.ts:48`). Clamp L to 0.68-0.80, multiply chroma by 0.55 (at most 0.11), then go back through `fromLch` and `rgbOf` (`tone.ts:80, 65`).
  - The covers already carry colour and the chrome stays two-colour, so this is in keeping. It never shouts in GitHub's own colours.
- **A knot:** one small ink knot on the row of the first release.
- **No text.**
- **Rendering:**
  - Build it as an SVG string in Node and encode it to WebP with `sharp`. `sharp` is already in `node_modules` through Next; add it to `devDependencies` explicitly.
  - No browser is needed in CI, unlike `gen-assets.mjs`.
  - Save to `public/work/gh/<slug>.webp` and commit it.

**The guardrail:** weaves are for studies without a still (closed marks wear none, above). If more than a third of the ball's marks wear weaves, the sync warns: "Most of the thread is weave. Give three of them a picture."

##### 3.5 Pieces: what hangs off a mark

- **Screenshots** (public repos): every README image after the first, up to five.
- **The live page**: for a repo with a homepage, the sync may take a dated screenshot of it, "As it stood on 29 September." This one does need Playwright, so run it locally with `--shots`, not in the daily Action.
- **Releases:** each becomes a small rendered card, drawn as an SVG and encoded with `sharp` like the weave:
  - the tag in grotesk;
  - the date;
  - the first line of its notes in serif.

  Pieces stay images, so `ThreadScene` needs no new kind of piece.
- **`Piece:` trailers** (new, and the neat part). He marks a commit as a moment worth keeping with a trailer in its message:

  ```
  Space: Urchi swims about, head first, in slow breaststrokes

  Piece: The first time it swam.
  ```

  - The sync reads commit messages (`/repos/{o}/{r}/commits?since=<last sync>`) and turns each trailer into a card: the commit's date and his line.
  - For a closed repository it writes nothing, not even the trailer and its date: nothing of a private repository's reaches the site (decisions.md, item 5).
  - Curation with no interface, done at the moment he knows it matters, in a habit he already has.
  - Because Claude writes many of his commits, add one line to the house rules (the engineering review's `CLAUDE.md`): "Add a `Piece:` trailer only when I ask for one."

##### 3.6 Time on the thread

- **Dates by month.** `Project` gains `start` and `end`. `wind()` places each bead by its fractional date (§1, point 3).
  - The golden-angle stepping at `:1716-1732` existed only because years were the only data. With dates, the date decides where on the ball a mark sits.
  - At nine or more turns across well under a year, marks a month apart are more than a quarter-turn apart, so they spread round the ball on their own.
- **A floor on the turns:** `Math.max(9, 1.5 × span)`. The placeholder ball had 8.6 turns, so a young career still reads as a ball. The floor governs until his thread spans six years.
- **A month of bare thread** before the first mark, so it does not sit on the pole.
- **The contact sheet's labels.** After the supernova, "a faint year over each year's first" is keyed by a new `periodOf(bead)`:
  - the month ("April") when the whole thread spans less than two years;
  - otherwise the year.

  That changes `:1393` (the labels) and `:3850` (`beads[i - 1].year !== b.year` becomes a comparison of periods).
- **The pluck:** one fixed ladder in months, so the same project always sounds the same, whatever else is on the ball. `runOf` returns months from `start` to `end`, or to now if alive:

  | Run | Note (`PLUCK_HZ`, `:292`) |
  |---|---|
  | under a month | D4, 293.66 Hz |
  | under three months | C4, 261.63 Hz |
  | under a year | A3, 220 Hz |
  | under three years | G3, 196 Hz |
  | three years or more | F3, 174.61 Hz |

##### 3.7 The intro ring needs twelve real images (new)

- **The problem:** `IntroRing` takes "the same twelve as ever" by striding through `SPACE_ITEMS` (`IntroRing.ts:73-78`, `RING.count = 12`, `:14`). Its selection is a `Set` of indices, so six pieces give a ring of six. Release cards and weaves in that ring would look like placeholders.
- **The fix:** pass `IntroRing` its own list, `RING_SOURCES` (new in `projects.ts`):
  - covers first, then pieces whose media is a real image or video;
  - never weaves or release cards;
  - ordered by his `plain` rank, then by date.
- **Fewer than twelve real images:** the ring repeats covers rather than thinning. A launch-gate check fails while `RING_SOURCES` holds fewer than eight distinct images.
- **Effort:** S.
- *Decided since (decisions.md, fact 1): `main` now has thirteen real pieces, so the ring can be twelve real images today. `RING_SOURCES` still keeps weaves and release cards out of it as they arrive.*

##### 3.8 The thread, alive

**Commit activity as thickness:**
- The strips share one half-width per frame (`Ribbons.begin(half)`, `:826`; `strip`, `:833`).
- Add an optional per-sample width: `strip(xs, ys, ink, nx, ny, from, to, w?)`, with `h = this.half * (w ? w[k] : 1)`.
- Only the main thread passes it (`:4749`, which already indexes the per-sample arrays `SX`…`NY`).
- In `wind()`, build `W = new Float32Array(M)` from the weekly totals of every synced repository mapped onto the thread's time. Closed repositories join only as one monthly total across all eight, spread evenly over the month's weeks, never per repository (decisions.md, item 5).
- `w = 0.7 + 0.8 · √(min(1, c / c95))`, where `c95` is the 95th-percentile week. This site's own week of 136 commits must not make every other week a hair.
- Busy weeks are visibly fuller, and quiet stretches thin but never below 0.7.
- Reduced motion is unaffected, because widths do not move. **The thread is thicker where he worked.**

**The loose end stirs when he has just pushed.** The loose end is drawn standing still today (`drawLooseEnd`, `:4946-4980`, `LOOSE = 40`). With `at` from `/api/pulse` (§3.9), let h be the hours since his last push to a public repository on the thread:
- **h < 48:** the end sways. The amplitude is `0.18 · e^(−h/12)` rad of its lift, with a 5.5s period, like a thread just let go.
- **h < 1:** once every 7-11 seconds it also gives one short 120ms tug, as if someone were still winding.
- **Hover:** a new hover target near its last sample raises a caption under the heading:
  - "Wound on an hour ago."
  - "Last wound on Tuesday."
  - (cut: "Wound on an hour ago, on something closed." Push times are shown only for public repositories, so a closed push never moves the loose end; decisions.md, item 5)
  - "Wound on at 2:14. He should have been asleep." (the push fell in his night hours)
- **Night test:** use `hoursOf` on the push time converted with `Intl` in `TIME_ZONE`. **Not** `clock()`, whose `?hour=` override (`hours.ts:21-29`) would relabel a real push. Add a small `hourAt(date)` to `hours.ts`.
- **Reduced motion:** no sway and no tug. The caption still answers.

**"He is working" on Space** (small, optional, and consistent with listening):
- **Trigger:** a push to a public repository within 30 minutes (the pulse sees no other kind), while he is not listening and it is not his night.
- **Caption:** `URCHI_STATES.working`, "He is writing something. It is keeping quiet." (45 characters; the cap is 48). It is chosen where `asleep` and `listening` already decide (`CreativeSpacePanel.tsx:334-338`).
- **The look:** now and then Urchi glances at the Projects pill, the way it glances at Music's while he listens (`:460-463`).
- It is a real signal, not a game, so it does not break the rule that keeps Urchi out of games.

##### 3.9 Fetching

**Recommended: a sync script, a daily Action, a committed JSON file, and one small live endpoint.**

1. **`scripts/sync-github.mjs`** (new):
   - **Reads:**
     - the public repos named in `projects.ts` (parsed for `slug`/`repo` pairs by a regex, or through Node 22's type stripping, since there are no aliased imports);
     - `SYNC_PRIVATE` and `SYNC_EXCLUDE` from the environment (`THREAD_CLOSED` is not needed, §3.2);
     - the `thread` topic.
   - **Calls:**
     - REST: `/repos/{o}/{r}`, `/languages`, `/releases` and `/commits?since=`.
     - `/stats/commit_activity`, which answers `202` while GitHub computes. Retry with backoff up to five minutes, and **never write zeros over good data**.
     - GraphQL, for `openGraphImageUrl` and `usesCustomOpenGraphImage`.
   - **Writes:**
     - `src/content/github.json`, keyed by slug, with **only fields on an allowlist**;
     - weaves and release cards (SVG → `sharp` → WebP).
   - **Bumps `UPDATED.projects` only on a change a visitor can see:** a new project, a status change, a new piece, a new release, or a new cover. Never for counts alone, or Urchi would look up at the Projects pill with "Changed since…" for every returning visitor, every day.
2. **`.github/workflows/thread.yml`** (new):
   - Runs daily on a jittered minute, and on `workflow_dispatch`.
   - Runs the sync and commits only if something changed. The subject is in the house voice, "Projects: the thread, rewound from GitHub [quiet]", so the log (§7.1) never offers it. *Ruled in the summary ("Process"): `[quiet]` keeps a commit out of the log; there is no `Log: none` trailer.*
   - Vercel deploys on the push. Check once that Vercel builds a commit authored by `github-actions[bot]`. If the project's Git settings block it, author the commit as his own noreply address.
   - Runs on `schedule` and `workflow_dispatch` only, never on `pull_request_target`. The repository is public, and secrets must never meet code from a fork.
3. **`/api/pulse`** (new, Node runtime):
   - Returns `{ at, repo }` for the last push to a public repo on the thread, and nothing else. Push times are shown only for public repositories (decisions.md, item 5), so a private push never reaches it.
   - Source: `GET /users/dctxv/repos?sort=pushed&per_page=10`, which lists public repositories only, then the first whose slug is on the thread; the route drops any entry marked `private` all the same. `PULSE_TOKEN` only lifts the rate limit, so the first draft's hashed map of private names (SHA-256 of the full name) is not needed.
   - Headers: `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600`, so GitHub sees at most six calls an hour however busy the site gets.
   - **Polling:** Projects and Space fetch it once when shown (`onShown`, `where.ts:64`), then every ten minutes while shown.

**The tokens: two, because the proposal's single token contradicted itself.** It said "never in Vercel", yet the pulse runs in Vercel.

| Token | Where | Permissions | Used by |
|---|---|---|---|
| `THREAD_TOKEN` | Actions secret | fine-grained, read-only Metadata and Contents, on all his repositories, since all eight private ones appear as closed marks (decisions.md, item 5) | the sync |
| `PULSE_TOKEN` | Vercel env | fine-grained, **Metadata only**, on the public repositories only | `/api/pulse` |

A leaked `PULSE_TOKEN` reveals nothing that is not public already: public push times and names. Both expire, so set a reminder a week before. The sync fails loudly. The pulse fails quietly, and the loose end holds still.

**Why not incremental static regeneration (ISR) for everything:**
- The Projects panel is client-only (`Shell.tsx:20`) and imports `PROJECTS` directly (`ProjectsPanel.tsx:6`).
- One committed file keeps one source of truth, shows up as a diff he can read, and never makes a visit depend on GitHub being up.

**The privacy boundary:**
- **`eigengrau` is public, so `github.json` is public the moment it is committed.**
- The allowlist in the sync is the boundary, not the UI.
- For a closed repository it writes only:
  - a generated slug (`closed-1`, `closed-2`…);
  - the month it was created;
  - its pushes, added into one monthly total across all eight.
- It never writes a name, description, language, README text, README image, social preview, topic, release note or `Piece:` trailer.
- *Decided (decisions.md, item 5): the first draft also let a slug he chose, `start` and `end`, language shares, weekly counts and `Piece:` trailers through. They are cut, because summing the pushes is what hides any one repository's rhythm.*

##### 3.10 The case page for a repository

The current page is a cover, a title block, one paragraph and the pieces (`src/app/projects/[slug]/page.tsx:34-40`). The new order, top to bottom, in the existing type:

1. **Title block first:** title, status word (in months), and his line. Cap the cover below at 60vh. At 1440×900 the words are then at the top rather than at y=783.
2. **The cover.**
3. **Summary:** his paragraph.
4. **His part**, in serif, one or two sentences:
   - "Alone."
   - "With three others, for a university unit. I did the API and the deploy."
5. **Made with**, one sentence built from the language shares plus his `stack` words:
   - "Mostly TypeScript. A little Python. Next.js and three.js."
   - The rule: one language at 60% or more reads "Mostly X", otherwise "X and Y".
6. **How long**, one sentence:
   - "From April to July. Eighty-one commits, most of them in May."
   - Past ninety-nine, digits: "212 commits".
7. **The strip** (new): the project's stretch of thread drawn straight as a thin inline SVG, with the same widths as the ball's. It is the unspooled line again, now as a record.
8. **Pieces:** as today, now with screenshots, release cards and `Piece:` cards.
9. **Links**, as grotesk words like Elsewhere:
   - "Source  Live  v1.2".
   - Source appears only for a repo that passes §3.12.
   - For a closed mark there is no case page. The mark itself reads "Closed. Ask and I will show you.", a `mailto:` link whose subject names its month ("The closed one from April"), because closed marks are untitled (decisions.md, item 5).
10. **Back:** as today.

*Ruled in the summary ("Where the specialists disagreed", case page layout): this order and these sentences, set in Style R5's type, with Style R5's lit pill, its focus handling and its "Next:" link to the following project.*

**Also on the page:**
- The Projects pill is lit through `pillOf`, with `aria-current="true"` rather than `"page"` (Style R5, F-M4).
- `generateMetadata` gains the `why` line as its description and a per-route canonical.
- The share card is in §4.3.

##### 3.11 Private, coursework, and team work

- **Private (eight of fifteen, so the main case):**
  - Untitled: all eight appear as closed marks at the month each was created, with no title, no line and no Source link (decisions.md, item 5).
  - The mark wears a small closed ring, like the paused tick in the horizon's grammar (`drawMarks`, `:4828`), so it reads as present but sealed.
  - "Closed. Ask and I will show you."
- **Coursework and team projects:**
  - `did` is required, and the page says plainly who else was involved.
  - Recruiters read honesty about a team as seniority, and unclear credit as a red flag.
  - **The university's rule on publishing assessed work** is not known, and many units forbid it. *Decided (decisions.md, item 5): the Career Hub keeps its case page and names its team, but shows no Source link (`source: false`), and it is not pinned on his profile. Changes if: the unit's rules are known to allow publishing; then `source: true`.*
- **Tests and scratch:** left off.

##### 3.12 The Source link is a promise (new)

A security-minded portfolio that links a public repository with a key in its history has written its own rejection. Before any case page links "Source":

1. **Secrets:** turn on GitHub secret scanning with push protection for every public repo (it is free for public repos). Run `gitleaks detect` over the full history once. Rotate anything found; do not only delete it.
2. **README:** the first paragraph matches the case page's `summary`, followed by one screenshot, how to run it, and what his part was.
3. **Description and topics** on GitHub (the sync reads them), and an MIT licence, as eigengrau gets (decisions.md, Tools 2). *Decided: MIT on every public repository he links, because it is the licence people already know how to honour. The Career Hub gets none, since it is coursework with no Source link. Changes if: a repository holds someone else's code under another licence, which then wins.*
4. **The sync checks** that a README and a description exist before it lets the page show "Source". Otherwise it prints "VECTOR: no README. The Source link waits."

**Effort:** S per repository, and it is content work, not code.

**What it shows:** the security reader follows the Source link. What they find there is the portfolio.

##### 3.13 Edge cases, effort, risks

- **Phone:** the thread already has phone layouts, and the loose end's caption sits under the ball as captions already do.
- **Reduced motion:** no sway and no tug. Widths are unaffected.
- **Sound off:** nothing new to hear. With sound on, the pluck follows the month ladder.
- **Night:** "He should have been asleep." Urchi's "working" caption never shows at night.
- **Returning visitor:** `UPDATED.projects` moves only on visible change, so Urchi's look at the pill stays honest.
- **GitHub down or rate-limited:** the committed JSON still stands. The pulse serves stale-while-revalidate, then nothing, and the end holds still.

**Effort:**
- Month model, turns, `countWord`, `statusWord` and the ring sources: **S-M** (inside the branch in flight, §1).
- Sync, weave and Action: **M**.
- Case page v2: **S-M**.
- Thickness and pulse: **S** each.
- About a week altogether.

**What it shows:** a portfolio that is a live record of actual work rather than a brochure, plus data plumbing, API care and privacy judgement.

**Risks:**
- Automation can make the thread noisy. Curating by entry, and treating repos under twenty commits as studies, keeps it calm.
- A quiet month shows as a thin thread. That is honest, and it stays: the thread never pads a quiet month.
- `stats/commit_activity` can answer `202` for minutes at a time.
- Claude-written commits inflate counts on some repositories. The 95th-percentile scale and the √ keep one hectic week from dominating.

---

#### 4. The non-negotiables

These are not bets. They are the price of being taken seriously, and each has its detail in a companion document.

##### 4.1 The name, and a truthful title

- **On screen:** Style R2, F-H1 (the monogram unfolds into "Darius Tan", the name on phones, an About byline).
- **In metadata** (new here):
  - `title.default` becomes `NAME` alone ("Darius Tan"), with the template `%s - Darius Tan`.
  - `description` becomes `WORK_LINE` (new in `site.ts`, beside `ROLE` at `site.ts:8`). *Decided (decisions.md, item 3):* the working draft "Student developer in Melbourne. Interfaces, AI tools and security.", which he may rewrite at any time; the content lint requires only that it exists.
  - The JSON-LD Person (`layout.tsx:21-24`) takes `jobTitle: WORK_LINE` and `sameAs: [GitHub, Instagram]`. No LinkedIn is listed (`LINKEDIN = null`, decisions.md, item 3).
  - "Basic Human" stays exactly where it works: on screen in the intro, next to the truth. It stops being what a search result or an ATS link preview shows.

##### 4.2 Plainly

**Pitch.** The same site, plainly. For people with a minute.

**How it works:**
1. `/plainly` is one server-rendered column with no canvas, and it prints to a single A4 page.
2. **At the top:**
   - his name, in serif at 40px;
   - `WORK_LINE`;
   - where he is and his time now, in the site's own 24-hour form from `clock()`: "Melbourne. It is 15:12 here." (decided: Melbourne, decisions.md, item 1);
   - no availability line (decided, decisions.md, item 3: there is no true date to give yet). It changes when there is one, as "Free from January."
3. **Education** (new): "Studying at Swinburne University of Technology." The degree and the finishing date stay empty until he confirms them (`EDUCATION.confirmed`). The content lint fails from Monday 16 November, a week before launch, until he does, or sets `EDUCATION = null` to drop the line (decisions.md, item 3). Confirmed, it reads "{Degree}, Swinburne University of Technology. Finishing {month year}."
4. **Work:** the projects with `plain` set, at most five, in his order. Each has its title, status word, his line, "Made with", his part, and its links.
5. **Security:** one sentence with links to the papers, `/kept` and Phosphenes.
6. **Elsewhere:**
   - GitHub and Email (with copy). No LinkedIn is listed (decisions.md, item 3);
   - Instagram, on the default lens only;
   - "Print this", which sets `document.title = "Darius Tan, CV"` and calls `window.print()`;
   - "As a PDF", a static `public/darius-tan-cv.pdf` rendered by `scripts/cv.mjs` (new; Playwright `page.pdf({ format: "A4" })`, run locally whenever the content changes). Applicant tracking systems want a file.
7. **Lenses as static paths:** `/plainly/security` and `/plainly/design`, via `generateStaticParams`. `?for=security` redirects to them.
   - Each lens reorders the sections, chooses projects by `lenses`, and swaps the top line.
   - A grotesk line at the top says "The same, for a security team." He sends that URL with applications.
   - *Decided (decisions.md, item 3): the default lens leads with the AI work (Atelier, NextBranch and the Career Hub); `/plainly/security` leads with VECTOR; `/plainly/design` leads with eigengrau and Urchi.*
   - Static paths keep the page cacheable and give each lens its own card.
8. **The foot:** "There is a slower version of this site. It has a creature in it." Then "How it is made. How it is kept.", linking the two pages in §6.1.

**How it looks, sounds and reads:**
- Notes' column, the two fonts, the two colours. On paper, ink on white.
- Silent, with the site's masked rise and none at all under reduced motion.
- The sample top, with the decided working draft of `WORK_LINE` (his to rewrite at any time):

> **Darius Tan**
> Student developer in Melbourne. Interfaces, AI tools and security.
> Melbourne. It is 15:12 here.

- **At night:** "It is 3:12 here, the middle of my night. Write anyway."

**Where it lives:**
- A second, quieter line under About's three Elsewhere words, "Plainly. How it is kept. How it is made.", in grotesk at 60% ink, apart from them because it is not elsewhere. *Ruled in the summary (reconciliation 8): About's foot is two lines, Elsewhere first and then this one.*
- The unfolded monogram's caption.
- Go ("plain", "cv", "resume").
- It is the destination of the no-WebGL fallback.

**Data:** `site.ts` and `projects.ts`. New: `WORK_LINE`, `EDUCATION`, `PLAIN_LENSES` (lens, top line, section order). Zero backend.

**Implementation:**
- `src/app/plainly/[[...lens]]/page.tsx` (new), with `metadata.title "Plainly"`.
- `@media print` rules in `globals.css`: hide `nav[data-navbar]` (which holds the sound chip once it moves into the nav, Style R4), the finds' pocket in the top-right corner and any carried find (summary, reconciliation 3), the floating logo and the live favicon's canvas; ink on white; `break-inside: avoid` per project.
- It renders in Shell as a non-tab page, like a case page, with no slide and no pill.

**Edge cases:**
- **Phone:** already a column.
- **Reduced motion:** static.
- **Sound off:** nothing to hear.
- **Returning visitor:** unchanged.
- **Safari print:** test the page breaks.

**Effort:** M.

**What it shows:** that he knows who his audience is and respects their time. Most creative portfolios never learn this.

**Risks:**
- Too prominent, and it drains the main site. Keep it one quiet word on About and one command in Go, never a banner.
- Keep it to two lenses. Every lens is another CV to maintain.

##### 4.3 Cards

**Pitch.** Every link shows the site before it is opened.

**How it works:**
- Each route gets a `next/og` `ImageResponse` at 1200×630.
- Satori reads WOFF but not WOFF2, and the WOFF files are already in `public/fonts/`: `grotesk-500.woff`, `serif-300.woff` and `serif-400.woff`.

| Route | Card |
|---|---|
| `/` | Urchi at rest, in the denim colourway (summary, reconciliation 10; a PNG rendered once from the head by a local script), "Darius Tan" in grotesk, and `WORK_LINE` in Newsreader 300 |
| `/projects/<slug>` | The cover at left; title, status word and his line at right |
| Notes (`#anchor`) | Cannot vary by hash: the notes card shows the newest note in serif at 64px, with its date |
| `/today/<game>/<n>` | The day's miniature, never the answer: "No. 12". This works because the number is a path segment. |
| `/tools/<slug>` | What the tool makes (a sky, a grain) |
| `/plainly`, `/plainly/<lens>` | His name and that lens's top line, nothing else |

- **Where:** `src/app/**/opengraph-image.tsx` (new), `twitter:card = summary_large_image`, and canonicals per route (not `canonical: '/'` in the root layout, per Style R1, F-H6).
- **Edge cases:**
  - LinkedIn caches cards for about a week; refresh them with its Post Inspector after launch.
  - Everything depends on `SITE_URL` being real. It reads `NEXT_PUBLIC_SITE_URL`: the Vercel production URL until `dariustan.dev` is bought, by Friday 9 October, and a production build fails while it is unset or still `.example` (decisions.md, item 2).
- **Effort:** S-M.
- **What it shows:** craft that carries into other people's apps.
- **Risk:** none beyond keeping the Urchi still current. Re-render it when the head changes.

##### 4.4 Lights off, and 4.5 the headers

- **No WebGL.** Engineering §1.1, as reviewed: a per-panel error boundary, because `error.tsx` sits below Shell and cannot catch a panel.
  - Urchi is Canvas 2D in `urchi/index.html`, so the fallback can keep it alive.
  - The fallback's one link is Plainly.
- **Headers and the proxies:** Engineering §3.1-3.3 owns the final policy, with `security.md` §1-§2 (an unreviewed draft) behind it.
  - The proxies go first, in the first days of week 1, because this report is already public on a branch of a public repository (decisions.md, fact 2 and Engineering 4): `/api/preview` serves only songs the site signed and follows one redirect hop, re-checked (F3); `/api/cover` takes only image types, with `nosniff`, a sandbox CSP, timeouts and a cached 404 (F1-F2); proxied bytes get `Cross-Origin-Resource-Policy: same-origin` (F4).
  - The rest of the first slice takes three days in week 2: static headers, a CSP in Report-Only with `'unsafe-inline'` on day one and nonces before anything is enforced, and `security.txt`, `robots.ts` and `sitemap.ts`.
  - The nonce CSP is enforced after a week of clean reports. `'unsafe-inline'` is never enforced, because `/kept` reads the policy back and a reviewer spots it at once.
  - HSTS `max-age` goes on with the first headers commit. `preload` waits until Monday 9 November, a month on the real domain (decisions.md, item 2).
  - `Permissions-Policy` denies every feature by default, and grants one in the same commit as the first thing that uses it. The microphone stays `()`, because Cues promises it never listens.
  - *Ruled in the summary ("Where the specialists disagreed": the CSP's first form, HSTS preload, `Permissions-Policy`, `/api/preview`).*

---

#### 5. The Desk

##### 5.1 Why one sixth pill, and why "Desk"

**What has to fit:**

| Thing | How people reach it | What its home must give it |
|---|---|---|
| Daily games | People come back daily and share results | A pill found without thinking; short URLs; kept state, so a half-played board survives a trip to Music |
| Free tools | Search, shared links | A server-rendered page per tool, with its own title and card |
| Security | A URL sent with an application | One landing page to send; long-form papers |
| Urchi's finds | Happen on Space | Nothing new in the tabs. The drawer is a dialog on Space (`reviewed/space-finds.md` cuts a `/drawer` route). |
| Real projects | Projects | §3 |
| Plainly, `/kept`, `/colophon` | About, Plainly's foot, Go, `security.txt` | Plain pages outside the tabs, like case pages |

**The options, weighed:**

| Option | Verdict |
|---|---|
| **A sixth tab that routes inside itself** (one pill; `/today`, `/tools`, `/security` inside it) | **Recommended.** It gets the slide, keep-alive and pause from Shell for free. A pill is the only thing a daily player finds again. |
| A sixth tab, "Today", for games only | It becomes the Desk's first drawer. Tools and security would still be homeless. |
| Three new tabs | No. Eight pills crowd the phone bar. |
| A hidden back room | Invisible to the three audiences these features exist for. It survives only as Phosphenes' manner. |
| A command palette alone | A layer, not a home (§9). |
| Sub-routes under existing tabs | Wrong categories. Projects' canvas cannot host DOM tools. |
| Standalone routes with no tab | No keep-alive, and no daily habit. The routes stay; a tab owns them. |

**The name:**

| Name | Games | Tools | Security | Problem |
|---|---|---|---|---|
| Lab | yes | yes | yes | Every portfolio has one, and it promises experiments rather than things that work |
| Play | yes | no | no | Makes security look like a toy |
| Room | yes | yes | yes | Taken: Space is Urchi's room, and Music's room takes the record's colour |
| Today | yes | no | no | Goes stale for tools |
| Bench | no | yes | half | Tools only |
| **Desk** | **yes** | **yes** | **yes** | None. The day's puzzle folded on it like a newspaper, the instruments on it, papers in a drawer. One syllable, human, his. |

##### 5.2 Where it sits: third, and renumbered

The row becomes **Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6.**
- **The order carries meaning,** because the slide runs sideways through the row. It reads: what he made, what you can use, what he says, what he hears, who he is. The public half comes first and the personal half second.
- **A recruiter** goes from Projects to the Security drawer in one slide.
- **The intro still works:** Urchi's first breath blows the pieces to the second pill (`intro.ts:46`), and Projects stays second.
- **Music through the wall:**
  - Notes stays next door, and the Desk sits two rooms away.
  - Projects moves from two rooms to three (−22 dB to −28 dB).
  - Space moves from three rooms to four, which clamps to the same far sound (`AWAY` has three entries, `sfx.ts:322-326`).
  - Update the comment at `sfx.ts:317-320`, and the "4" comments in `CreativeSpacePanel.tsx:59, 368, 460`, which become "5".
- **Renumbering is free now,** because no digit is a key yet and nothing has launched. **Decided: the Desk third** (decisions.md, item 4). The digit keys land in week 1 with 3 reserved, so Notes, Music and About answer to 4, 5 and 6 from the first day any digit works and nobody learns the old numbers. Pressing 3 does nothing until the Desk pill appears with its frame in week 2.
- **The fallback, not taken:** the Desk sixth, after About. No numbers change, but it reads as an appendix. It changes only if all three drawers are cut, and then there is no Desk at all.

##### 5.3 URLs

| URL | Panel | Pill lit | Server page (metadata and mirror) |
|---|---|---|---|
| `/` | Space | 1 | as now |
| `/projects`, `/projects#slug` | Projects | 2 | as now |
| `/projects/<slug>` | its own panel, as now | 2 (new) | as now |
| `/desk` | Desk, the shelf | 3 | `src/app/desk/page.tsx` (new) |
| `/today` | Desk, Today | 3 | `src/app/today/page.tsx` (new; dynamic, with `s-maxage` set to the seconds until his midnight) |
| `/today/<game>`, `/today/<game>/<n>` | Desk, a board (an earlier day is marked "late") | 3 | `src/app/today/[game]/[[...n]]/page.tsx` (new) |
| `/tools`, `/tools/<slug>` | Desk, Tools | 3 | `src/app/tools/[[...slug]]/page.tsx` (new, static) |
| `/security`, `/security/<slug>` | Desk, Security | 3 | `src/app/security/[[...slug]]/page.tsx` (new) |
| `/notes`, `/notes/feed.xml` | Notes | 4 | as now, plus the feed |
| `/music` | Music | 5 | as now |
| `/about` | About | 6 | as now |
| `/plainly`, `/plainly/<lens>` | its own page | none | new |
| `/kept`, `/colophon`, `/phosphenes` | their own pages | none | new |

- **Paths, not queries, for puzzles.** This overrules the daily-games review's `/today?stet=6`. That review cut sub-routes only because `isTab` was an exact match, which the Desk fixes. More to the point, `opengraph-image.tsx` is handed `params` and never `searchParams`, so a per-puzzle card is one file with a path and a workaround route with a query. Game numbers stay per game, counted from each game's own first day.
- **Frozen, and served on their day.** Each puzzle is made ahead, frozen, and served by `/api/today/[game]/[n]` only from its own day on. The day turns at his midnight in Australia/Melbourne, falling back to UTC and never to the visitor's day. The frozen files live in a private repository fetched at build (`TODAY_REPO`, `TODAY_TOKEN`), so nothing in the public repository holds an answer. *Ruled in the summary ("Where the specialists disagreed": whose midnight; frozen and served on the day), with the bank's home decided in decisions.md, Daily games 3.*

##### 5.4 Keys

| Key | Where | What it does |
|---|---|---|
| `1`-`6` | anywhere, unless typing in a field, or a board or Notes' search has claimed digits | Goes to that tab (Style R3, F-H2, through `src/lib/keys.ts`, new). During the intro it hurries the intro instead |
| `?` | anywhere, unless typing | The key sheet (§9) |
| Esc | Go, a board, a drawer | Up one level: board, then drawer, then shelf |
| ↑ ↓, Enter | the Desk shelf | Choose a row, open it |
| Existing keys | Space, Projects, Notes, Music | Unchanged |

- **One listener with a claim stack** (`keys.ts`). Nav's listener must not run before Notes' type-anywhere handler, which is the ordering bug the style-ux review found in R3 (F-H2). A board or Notes' search claims digits while it has them.
- **An off switch** for single-character shortcuts (WCAG 2.1.4), kept through `keep()` in `src/lib/store.ts` as `eigengrau:keys` and set on `/colophon`.

##### 5.5 How Shell handles it

Today Shell keys each panel by its exact path (`Shell.tsx:62, 132`) and knows a tab only by exact match (`routes.ts:5-7`). `sfx.ts:496-499` has its own prefix-matching `tabOf` with different semantics: a case page counts as Projects, and anything else counts as Space.

```ts
// src/content/site.ts
export const TABS = [
  { href: "/", label: "Space", n: 1 },
  { href: "/projects", label: "Projects", n: 2 },
  { href: "/desk", label: "Desk", n: 3, owns: ["/today", "/tools", "/security"] },
  { href: "/notes", label: "Notes", n: 4 },
  { href: "/music", label: "Music", n: 5 },
  { href: "/about", label: "About", n: 6 },
] as const;

// src/lib/routes.ts
const under = (path: string, root: string) => path === root || path.startsWith(`${root}/`);
/** The tab whose kept panel shows this path: its own href, or a root it owns. Null for any other page. */
export function tabOf(path: string): TabHref | null {
  for (const t of TABS) {
    if (path === t.href) return t.href;
    if ("owns" in t && t.owns.some((r) => under(path, r))) return t.href;
  }
  return null;
}
/** The pill lit for a path: its tab, or the tab it sits under (/projects/nocturne lights Projects). */
export function pillOf(path: string): TabHref | null {
  return tabOf(path) ?? TABS.find((t) => t.href !== "/" && under(path, t.href))?.href ?? null;
}
```

**Shell changes:**
- **Initial panel** (`:62`): `const tab = tabOf(pathname)`. Key and path are `tab ?? "page:0"` and `tab ?? pathname`.
- **Route change** (`:119-146`):
  - If `tabOf(prev) && tabOf(prev) === tabOf(pathname)`, it is a move inside a tab. Call `arrive(pathname, prev)` and return, with no slide.
  - Otherwise `canSlide` tests `tabOf(prev)`, `tabOf(pathname)` and `els.current.has(tabOf(prev))`. `dir` and `pendingRef.to` use tab paths.
- **Kept panels** (`:131`): `isTab(p.path) || p.path === (tabOf(pathname) ?? pathname)`.
- **Children** (`:218`): `{p.path === tabOf(pathname) ? children : null}`. The sub-route's server mirror then renders inside the Desk panel.
- **Stage** (`:30-34`): `if (path === "/desk") return <DeskPanel />;`.
  - `DeskPanel` (new) listens with `onWhere` and acts only when `tabOf(w.path) === "/desk"`, so it ignores `/music` while hidden.
  - It keeps its drawers mounted and folds the ones not open.

**The four hooks the proposal missed:**
1. **Room sound** (`sfx.ts:497-499`): replace its body with `pillOf(path) ?? "/"`. It must not use the new `tabOf`, which returns null for a case page and would move a song "heard from Projects" to Space.
2. **Space's look back at the tab you left** (`CreativeSpacePanel.tsx:433`): today it is gated on `isTab(left)`. Use `const pill = left && pillOf(left)` instead. Coming home from a case page, Urchi then looks at Projects, and coming home from a board it looks at the Desk. That is a small gain for people who notice.
3. **The Desk pill remembers.**
   - The promise is that tabs stay where you left them. If the Desk pill always linked to `/desk`, pressing `3` from Music would drop you on the shelf, not the half-played board.
   - Nav gives a tab with `owns` the href of the last path it showed in this visit, kept in memory in `where.ts` (`lastIn(tab)`, new).
   - Clicking the lit Desk pill, or Esc, goes up to the shelf.
4. **`pillAt` by href** (`attention.ts:119`, and the pill ids at `:553-556`): once the Desk pill's href changes, a lookup by `href="/desk"` misses it.
   - `Tab.tsx` gains `data-tab={tab}`.
   - `pillAt` and the attention ids query `[data-tab="…"]`.
   - `intro.ts:46` indexes the pill and needs no change.

**What needs no change:**
- `Between.tsx:130` sizes by `TABS.length`.
- `setShown` receives tab paths.
- `ProjectsPanel`'s and `NotesPanel`'s `onWhere` handlers compare exact paths of their own.

`typedRoutes: true` (`next.config.ts`) needs every sub-route to exist as a page. The remembered Desk href is typed with `as Route`.

##### 5.6 How the Desk looks

- **DOM,** in Notes' column width (`min(450px, calc(100% - 32px))`), headed as Notes and Projects are: a grotesk lead, then a serif sentence built from data with `countWord`.
- **Motion:** inside the Desk it runs vertically; between tabs it runs horizontally.
  - A drawer opens by rising through the site's mask, and the others fold into hairlines drawn to their length. This borrows Notes' fold, which first means extracting the `Folds` class (`NotesPanel.tsx:126-563`), as the games review notes.
  - **Sideways always means another tab. Up and down always means the same tab.**
- **A drawer appears only once it has something in it.** There is never an empty slot.

Sample copy:

> **Desk**  Today's Same Grey, three tools, and two papers.
>
> **Today**  No. 12, Same Grey. New at midnight here, in five hours.
> **Tools**  Three, free. Nothing you give them leaves this page.
> **Security**  Two papers. How this site is kept. Six lights hidden about the place, for people who look.

During his night hours (`clock()`, `hours.ts:31`), the heading's tail gains: "He is asleep. The desk is not."

##### 5.7 The WebGL budget: no fourth kept context

- Space, Projects and About each hold one context (`RoomScene.ts:175`, `ThreadScene.ts:1308`, `AboutScene.ts:95`).
- The Desk panel is kept, so it must never hold a fourth.
- A tool that needs WebGL (Sky and Grain in `tools.md`) creates its renderer when opened, and releases it with `renderer.dispose()` and `renderer.forceContextLoss()`:
  - when its drawer closes;
  - or when the Desk has been hidden for ten seconds (through `onShown`).
- Its state lives in its URL and in `store.ts`, so nothing is lost.
- Games stay DOM and 2D canvas, as the games review already requires.

##### 5.8 Ownership, and where each thing lands

- **Space is Urchi's.** The Desk is his, with no Urchi at all: not in the games (his own instinct), not in the tools, not in the papers.
- Projects is the record, Notes is the voice, Music is the room, and About is the man.

| Thing | Home | Also reachable from |
|---|---|---|
| Daily games | Desk, Today | Go. The Today drawer's own heading does the daily telling. Urchi never points at the Desk for the daily: it looks up at the Desk pill once only when `UPDATED.desk` moves for a new game, tool or paper, as it already does for notes. *Ruled in the summary (reconciliation 4), overruling this section's first "Today's is out.": `URCHI_NEWS.today` is not added, because a daily look would mean nothing and the games stay Urchi-free.* |
| Tools | Desk, Tools | Search, log lines, Go |
| Security papers | Desk, Security (`/security/<slug>`) | Notes, as `cybersec` entries of a new `kind: "paper"` with an `href`; Plainly |
| `/kept` | its own page | The Security drawer's first row, `security.txt`'s `Policy:`, Plainly's foot, About's quieter line |
| Phosphenes | `/phosphenes` | The Security drawer's last row, `robots.txt`, the console, `/kept`'s last line, Go |
| Urchi's finds | Space, a dialog | The carried find (`reviewed/space-finds.md`) |
| Real projects | Projects | Plainly (top five) |
| Plainly | `/plainly` | About's quiet line, the monogram's caption, Go, the no-WebGL fallback |
| `/colophon` | its own page | Plainly's foot, About's quieter line, the key sheet, the 404 |

##### 5.9 Edge cases, effort, risks

- **Phone:** six pills measure 238-252px at 390px, so they fit. The Desk is a Notes-like column.
- **Reduced motion:** drawers cut instead of rising.
- **Sound:** silent. With sound on, a drawer gives Notes' riffle tick.
- **Night:** only the caption changes.
- **Returning visitor:** today's board lives in storage (`eigengrau:today:<game>`, through `store.ts`), and the drawer you left is remembered for the visit.

**Effort:**
- Routing (`tabOf`, `pillOf`, Shell, Nav, the four hooks): **S**.
- The Desk frame (shelf, drawers, mirrors, metadata, the extracted fold): **M**.
- Games and tools are costed in their own documents.

**What it shows:** a site that grows without losing its shape, which is the hardest thing for a personal site to do.

**Risks:**
- Scroll position has to be kept per drawer.
- **The Desk must not become a junk drawer.** Anything that is not something you do or something you use stays out.

---

#### 6. Security as the site's own: kept, made, and Phosphenes

##### 6.1 Two short pages, not one

- **Why split.** The proposal merged the colophon, "the site, examined" and privacy into one page. But `security.md` §2.8 already specifies `/kept`, style-ux §5 specifies `/colophon`, and the readers differ.
  - The security reader wants one URL that is all threat model.
  - The designer wants type and process.
  - A merged page buries the first under the second.
- The engineering review merged its own "site, examined" into `/kept`. So: two pages, one line apart. *Ruled in the summary ("Where the specialists disagreed"): two short pages, linked to each other.*

**`/kept`, "How this site is kept"** (content owned by `security.md` §2.8):
- the live self-check of headers;
- "Try it", five probes;
- what it will not do;
- where it could be hurt;
- what it depends on;
- what it gives away about him;
- what it keeps in your browser, key by key, including `eigengrau:urchi` (Urchi's memory of you, and the one trust value), with a "Forget me" button that clears every `eigengrau:` key (decisions.md, item 6);
- the disclosure policy;
- **Thanks** (reported holes, and people seen in the dark);
- the last line to Phosphenes.

**One correction to that draft, from this strategy.** Its line "No analytics" must match §8.2. Counts ship (decisions.md, item 7), so the page says:

> It counts three moments and nothing else: a finished puzzle, a find taken, and something made with a tool and taken away. It sets no cookies, does not count pages or visits, and does not know who you are. Nothing is sent while your browser asks not to be tracked, and nothing is shown in public.

Under it, the three names and their fields, exactly as sent: `game_finished { game, n, streak }`, `find_taken { tier }` and `tool_export { tool, format }`.

**`/colophon`, "How it is made"** (content owned by Style R17, as reviewed). Its first sentence is item 5's acknowledgement, before everything else:
1. **Type and colour:** "Set in Inter Tight and Newsreader. Two colours: eigengrau, #16161d, and ink, #e9e9e2. One glass. One radius, four pixels."
2. **Urchi:** traced, faceted and suited, with three stills rendered for production (the dev sheet stays in development).
3. **Sound:** "Synthesised, in F, G, A, C and D. Off unless you turn it on."
4. **Keys and switches:** sound, and single-key shortcuts on or off.
5. **How it was built:** said once, plainly, and first, as the page's opening sentence: "Built with Claude Code, on parallel branches. I wrote what each branch should do, and read every merge." It appears nowhere else: not in the `did` lines, on Plainly or in the cards (decided, decisions.md, item 8).
6. **Source:** github.com/dctxv/eigengrau. "Read it. It was written to be read."

**Where they are linked:**
- Plainly's foot links both.
- About's foot links both, in its quieter second line (summary, reconciliation 8).
- The 404 page (Style R8's layout, with a sanitised path) lists the six tabs as words, plus "Colophon": "Nothing here. The colophon says what is." When the visitor is carrying a find, it adds the finds' clause: "Nothing here. Except a bolt." *Ruled in the summary (reconciliation 9).*
- `security.txt` points to `/kept`.

**Effort:** `/kept` is M (`security.md`); `/colophon` is S-M.

##### 6.2 Phosphenes (Noticed, merged)

**The decision.**
- The proposal's **Noticed** (five flags) and `security.md`'s **Phosphenes** (twelve flags) are the same idea. Ship one.
- **Phosphenes wins the name:** eigengrau is the grey you see in total darkness, and phosphenes are the lights you see in it. That is the site's own metaphor, not a bolt-on.
- **It also wins the mechanics** (`security.md` §3.1):
  - `phos{…}` flags;
  - PBKDF2 at 150,000 iterations rather than a bare SHA-256, since some answers are words;
  - flag values generated at build from `PHOS_SECRET`, into git-ignored files;
  - proof by hash for "Seen in the dark".
- "Noticed" survives only as the words at twelve of twelve: "You noticed."

**What Noticed contributes:**
1. **A row on the Security drawer.**
   - `security.md` wanted nothing on the tabs to point to it. But a CTF a hiring manager never learns exists shows no skill, and the Desk, the sixth pill, is not one of the five tabs that draft knew.
   - So the Security drawer's last row reads: "Phosphenes  Lights hidden about the place, for people who look."
   - `/phosphenes` is still `Disallow`ed in `robots.txt`, and that line is flag one.
2. **The Blink, replacing "The older icon" (`security.md` flag 3) in the same place.**
   - Once per visit, after the tab has been hidden for a minute, the live favicon (`LiveIcon.tsx`) blinks one short word in Morse (a long blink is a dash), then goes back to blinking as usual.
   - An XML comment in `icon.svg` is view-source trivia. A favicon blinking a word is exactly "people who notice".
   - **At his night** the favicon Urchi is asleep and blinks nothing, which is one more thing to notice. The hint says: "Come back while it is awake."
   - **Reduced motion:** a blink is a change of state, not travel, so it stays.
   - **Phones** have no visible tab strip, so the hint says so: "Easier to see on a computer."
3. **Go checks flags anywhere:** typing `phos{…}` into Go, once it exists, answers in one line: "That one is real. Four of six."

**Pacing (new).**
- **Season one opens with the six that each cost under an hour to plant:**
  - the robots line;
  - the console;
  - the Blink;
  - the ROT13 note (which also gives `cybersec` its first entry);
  - the header on the ambient bed;
  - the DNS TXT record.
- **The "in the dark" six follow through the season:** the source map, the OG image's metadata, the spectrogram, the sky register, the mesh, and **the keeper's pass, read**: a signed token in `localStorage` whose light sits in its claims, where anyone who decodes it can read it, as "A token, opened" does. Nothing asks for a forged pass or a guessed secret.
  - *Decided ("defensive only"): the draft's weak-secret pass, which asked visitors to write a new token with a guessed word, is cut. Its replacement teaches the defensive half of the same lesson: a token is signed, not sealed, so nothing secret belongs in its claims. It changes if: nothing; forging stays out.*
  - Each is announced by one log line: "One more light, somewhere in the sound."
- **The hub's ring shows only the lights planted so far:** "Six lights so far. More when it is darker." An unplanted mark would be a dead end.
- **Seasons:** rotate `PHOS_SECRET` and replant. A walkthrough posted elsewhere then goes stale instead of spoiling the page: "Season one ended on 1 March. Twelve people saw all of it."

**The guard.**
- A CI check fails the build if any tracked file contains `phos{` followed by hex.
- The page says: "The source is public. The answers are not in it."
- **Scope:** "Look for the lights, not for holes. If you find a real hole anyway, write to me first. You will be thanked." *Decided ("defensive only"): the page never invites anyone to break anything.*

**Effort:**
- The six easy lights plus the hub: **M**.
- All twelve: **L** across the season, alongside the papers.

**What it shows:** recon, web security, cryptography and threat modelling, as part of the site's personality rather than as a list of certificates.

---

#### 7. Keeping it fresh

##### 7.1 The log writes itself (run locally)

**Pitch.** The site's own log lines, written by its commits, approved by him.

**How it works:**
1. `npm run log` (new: `scripts/log-from-git.mjs`) runs on his machine. Vercel builds from a shallow clone, so the build cannot read the history (engineering review).
2. It proposes at most one line per day since the last run:
   - a commit's `Log:` trailer, if one exists;
   - otherwise the subject of the day's last merge into main, with its branch prefix removed.

   It never offers a commit marked `[quiet]` (the sync's own commits carry it). *Ruled in the summary ("Process"): `[quiet]` keeps a commit out of the log.*
3. It rewrites each into the log's form:
   - "Merge p2/afloat: a smooth line, walls without a bounce, hands out of the suit, and swimming"
   - becomes "A smooth line, walls without a bounce, hands out of the suit, and swimming."
4. It shows him the lines once a week, with keep as the default, so it costs one keypress a line (decisions.md, Style and UX 5). He keeps, edits or drops each, and it writes `src/content/log.json` (`kind: "log"`, `tags: ["site"]`).

**How it reads**, from his real history:
- "Urchi's faces, and what brings them on."
- "Zoom while afloat, pixelated by distance."
- "A sky behind Urchi afloat, starting with the stars."

**Implementation:**
- `notes.ts:9` builds `ENTRIES` from `[...NOTES, ...LOG]`.
- Because the log merges into `ENTRIES` and not into `NOTES`, `whatsNew` (`visits.ts:167`, which filters `NOTES`) already ignores it. Urchi never announces "Two new notes" for log lines, and no change is needed there.
- Anchors keyed by date fall back to ids on shared days, which already works (`notes.ts:12-19`).

**Edge cases:**
- One line per day keeps a day of twenty-three commits from flooding the column.
- `NOTES_FOLD_AFTER` settles old lines into month summaries as designed.

**Effort:** S.

**What it shows:** process in public, and Notes has entries from day one.

**Risk:** a subject not meant for strangers. Approval handles it.

##### 7.2 Notes from the phone

1. A GitHub issue form, `.github/ISSUE_TEMPLATE/note.yml` (new), with a category dropdown built from `NOTE_CATEGORIES` and a text field. He fills it in from the GitHub mobile app.
2. `.github/workflows/note.yml` runs on `issues: opened`, guarded by `github.event.issue.author_association == 'OWNER'`.
   - Not by the label: an issue form applies its labels for whoever files it.
3. It runs `node scripts/add-note.mjs --category "$CATEGORY" --text "$TEXT" --local`, with new non-interactive flags. The body is passed **through `env:` only**, never by interpolating `${{ github.event.issue.body }}` into a shell line. That interpolation is the classic Actions script injection, and it is a paper in itself.
4. It commits "Notes: {first four words}" and closes the issue with "In."

- **Edge cases:** an issue from anyone else is ignored. The date and `at` are written in his zone, Australia/Melbourne, as `add-note.mjs` now writes them, and by default the note names what was playing, as `npm run note` does (decisions.md, Music, About and Notes 1). Deploys take about a minute.
- **Effort:** S.
- **What it shows:** automation with a threat model.
- **Risk:** the issue is public for a minute before the note is. Draft in the app, not in the issue.

##### 7.3 By feed

- `src/app/notes/feed.xml/route.ts` (new): static RSS 2.0 of notes and papers. Log lines are left out, because the feed is his voice.
- `<link rel="alternate">` goes in `layout.tsx`.
- One grotesk line at the foot of Notes: "By feed, if you read that way."
- **Effort:** S. **Risk:** none.
- Email stays a skip: a mailing list is a store of other people's data.

##### 7.4 Since Tuesday

- `STATUS` (`site.ts:27`) becomes `{ text, since: "2026-09-29" }`. About draws it in its canvas (`AboutPanel.tsx:29`), so the words are computed at mount.
- **The words, in his zone:**
  - "Since this morning" or "Since this afternoon" (the same day);
  - "Since Tuesday" (within six days);
  - "Since 12 September";
  - past a year, "Since September 2025".
- The same line appears on Plainly.
- The status line gets its full stop, "Busy putting a hole in spacetime.", in the same commit, and `WORK_LINE` sits under it on About (decisions.md, item 3; summary, reconciliation 8).
- **Effort:** S.
- **Risk:** "Since March" reads as a reproach. That is the point.

##### 7.5 Turn the polish into content (new)

**Pitch.** The hours spent on Urchi are the best design story on the site. Tell it.

**How it works:**
- Any Urchi change that took more than a morning gets one note, in his voice, the day it lands:
  - "The visor went through five versions in one morning. The thin rim came back at the end."
  - "It swims breaststroke now. Front crawl looked like panic."
- The Urchi case page (§3.3) gets a piece row called **"Five visors"**: five stills of the helmet, one per commit.
  - `4703066` thick rim;
  - `f1b05f6` slim rim;
  - `0aaf4b0` six points;
  - `2518f06` no rim;
  - `4be495d` thin rim again.
  - A local script checks out each commit into a temporary worktree and screenshots `/dev/suit`. Each still is captioned with its commit's date and time.
- **Effort:** S-M.
- **What it shows:** judgement, iteration and taste, which is exactly what the designer persona came for. It also answers the proposal's worry about polish more kindly than a ratio does.

---

#### 8. Reach and counts

##### 8.1 Doorstep, and the profile it sits on

**Pitch.** Urchi on his GitHub profile, awake or asleep by his hours, on a profile worth landing on.

**How it works:**
1. `/api/urchi.png` (new) renders with `next/og`:
   - Urchi's head from a pre-rendered still, with eyes open or shut by `clock()`;
   - a grotesk line: "It is 3:12 here. It is asleep." at night (the existing `URCHI_STATES.asleep`), and one of `URCHI_LINES` by day.
2. Cached with `max-age=600`. GitHub's image proxy (camo) honours it within about an hour.
3. **The profile itself** (new, and zero code):
   - Create `dctxv/dctxv`, the profile README, which does not exist yet.
   - It embeds `<a href="{SITE_URL}"><img src="{SITE_URL}/api/urchi.png" width="240" alt="Urchi"></a>` and one line: `WORK_LINE`.
   - Pin up to six repositories: `eigengrau` plus the best public work, each passing §3.12. *Decided:* `eigengrau`, VECTOR, NextBranch and Atelier, each pinned once it passes §3.12. The Career Hub is not pinned, because it shows no Source link, and `urchi-test` and `plateup-bridge` stay off, as on the thread (decisions.md, item 5). *Changes if:* `plateup-bridge` gains a README and a `why`.
   - Give all seven public repositories a description and topics. Today only one has a description.
   - Put the site in the profile's website field and in the Instagram bio.

**Edge cases:** the night image reads `TIME_ZONE`, which is Australia/Melbourne (decisions.md, item 1). Unset, it would show the wrong clock.

**Effort:** S-M.

**What it shows:** the site reaching out to where developers and technical recruiters actually arrive. With eight of fifteen repositories private, the profile *is* his public GitHub.

##### 8.2 Quiet counts

**Pitch.** He should know whether anyone came, without knowing who.

**How it works:**
- **The correction:** Vercel Web Analytics custom events need the Pro plan (confirmed in the engineering review). On Hobby, Vercel gives page views only.
- **Decided (decisions.md, item 7):** Umami Cloud's free tier, cookieless, for three named events and nothing else, behind a same-origin rewrite in `next.config.ts`. Automatic page views are off (`data-auto-track="false"`):
  - `/u/script.js` goes to `https://cloud.umami.is/script.js`;
  - `/u/api/send` goes to `https://cloud.umami.is/api/send`.

  The CSP then stays `'self'`, there are no cookies, and there is one vendor. Check the current free-tier limit, which is far above this site's traffic.
- **Changes if:** Umami's free tier ends or its terms change (then self-hosted Umami behind the same `/u/`), or he is on Vercel Pro and prefers its events, under the same three names.
- **The events, three and no more** (new `EVENTS` in new `src/lib/count.ts`):
  - `game_finished { game, n, streak: "1" | "2-6" | "7+" }`;
  - `find_taken { tier }`;
  - `tool_export { tool, format }`.
  - *Decided (decisions.md, item 7): the first draft's ten (`urchi_taken`, `line_snapped`, `nova`, `case_opened`, `plainly_printed`, `cv_pdf`, `today_finished`, `tool_used`, `light_seen`, `find_taken`) become these three, so `/kept`'s disclosure stays one honest sentence. The streak bucket answers "does anyone come back" without an identifier or a page view.*
- Nothing is sent while the browser signals Do Not Track or Global Privacy Control.
- He sees them privately, once a week. `/kept` prints the three names and their fields exactly as sent (§6.1).

**Effort:** S.

**Risk:** checking too often. Once a week is enough.

**Public counters stay a skip.** "Four people this week" reads as failure.

---

#### 9. Go, and the keys

**The key sheet first** (S, in week 2, on top of `keys.ts`, which lands in week 1 with the digits). `?` opens a small glass card:

> 1 to 6, the tabs. Esc, back. ? , this.
> On Space, Enter takes it with you, and the arrows nudge it afloat.
> On Projects, the arrows turn the ball; hold one and it spins.
> Keys can be turned off in the colophon.

**Go later** (M, from week 7). A Cmd-K palette alone is the most copied pattern on developer portfolios. Make it the site's own by extending the habit Notes already has.

1. **Opening it:**
   - Cmd-K or Ctrl-K, anywhere.
   - **Or start typing a letter** on any tab that does not already take letters: Space, Projects, Music, About and the Desk shelf. Not Notes (which searches as you type), a board, or a field.
   - One glass bar, 480px, rises under the nav with your letter already in it. It uses the one glass (`rgba(40,40,47,.5)`, 40px blur, 4px radius).
2. **Input:** serif at 20px, placeholder "Where to?"
3. **Results:** up to seven, in grotesk at 12px, each with its kind on the right: tab, project, note, paper, tool, game, do.
   - The index is built in the browser from `TABS`, `PROJECTS`, `ENTRIES` (the first 60 characters) and the tool, game and paper registries.
4. **Commands, ten at most:**
   - "Sound on", "Sound off";
   - "Take Urchi with you" and "Send it home" (on Space);
   - "Copy email", "Plainly", "Print the CV";
   - "This sky's link" (`/?sky=<seed>&v=1`: Go comes after skies are frozen as version one in week 4, so the link carries its version; decisions.md, Tools 3).
5. **`phos{…}`** is checked (§6.2).
6. **Keys:** Enter goes, Esc closes. With no results: "Nothing by that name."

**Details:**
- **Where:** `src/components/chrome/Go.tsx` (new), mounted in Shell beside the nav (`Shell.tsx:197-200`), where `SoundChip` sits today. The chip moves into the nav and the finds' pocket takes the top-right corner (summary, reconciliation 3), so Go never sits in that corner. All keys go through `keys.ts`.
- **Accessibility:**
  - It is a combobox with `aria-activedescendant` over a listbox.
  - "Letters open Go" is a single-character shortcut, so it is covered by the colophon's off switch (WCAG 2.1.4).
- **Phone:** skipped. The Desk and Plainly do its job there. Later, a 500ms long press on the monogram could open it.
- **Sound:** with sound on, Notes' riffle tick as the results change.
- **Effort:** M.
- **Risk:** a palette full of commands becomes a menu, hence the cap of ten.

---

#### 10. The sky keeps the calendar

**Pitch.** On the nights the real sky does something, so does his.

**How it works:**
1. `src/engine/space/sky/calendar.ts` (new) holds a table of annual showers, with peak dates that vary by about a day each year. Each entry carries the hemisphere it suits.
   - **Add `HEMISPHERE: "north" | "south"`** beside `TIME_ZONE` in `site.ts` (`site.ts:16`), set to `"south"` (decisions.md, item 1).
   - He is in Melbourne: his commits are stamped +10:00, and his public coursework is a Swinburne unit. From there the Perseids and Quadrantids never really rise in his sky, and the Eta Aquariids are the year's best.

   | Shower | Peak, about | North | South |
   |---|---|---|---|
   | Quadrantids | 3 January | yes | no |
   | Lyrids | 22 April | yes | low |
   | **Eta Aquariids** | 6 May | low | **yes, the best** |
   | Southern Delta Aquariids | 30 July | low | yes |
   | Perseids | 12 August | yes | no |
   | Orionids | 21 October | yes | yes |
   | Leonids | 17 November | yes | yes |
   | Geminids | 14 December | yes | low in the north of the sky |

2. **On a peak night** (±1 day, in `TIME_ZONE`), patch the resolved stars config through `merge` (`tune.ts:39`): `stars.shooting = { enabled: true, every: { range: [5, 11] } }`.
   - This is three times the "very rare" sky's 16-32s, whatever variant the visit drew.
   - **Do not** raise the "very rare" variant's weight (`defaults.ts:30`). Variants also decide the Milky Way (1 in 5) and the warm palette, and those would quietly become rarer.
3. **Moon:** at a new moon, `count` +10%; near a full moon, −10%. A standard synodic formula gives the phase.
4. **The caption afloat:** `URCHI_STATES.shower`, "The Orionids tonight, low in the north." (the direction comes from the table and his hemisphere; this is the southern sky)
   - The count, "It has seen four.", waits until Urchi actually turns to watch shooting stars: Urchi §15 (6.1, "It saw it too"), with the one crossing event from `Stars` and the one `witness` act that Urchi's "It saw it too", the finds' "star that fell" and this calendar share.
   - *Ruled in the summary (reconciliation 7): one shooting-star event, with the Urchi section's habituation, which is essential here, because on a shower night stars cross every 5-11 seconds.*
5. **The log line** is computed, not committed. On the day before a peak, Notes shows a synthetic `kind: "log"` entry: "The Orionids are in the sky behind Urchi until Thursday. About."

**Where:** Space, afloat only (the sky shows only there).

**Data:** a static table and arithmetic. Zero backend.

**Edge cases:**
- **Reduced motion:** no shooting stars are drawn, but the caption still names the shower.
- **Night:** Urchi dozes afloat. A shooting star may make it open one eye, and no more.
- **`?sky=` links** ignore the calendar, so a shared sky stays the same sky for everyone who opens it.

**Effort:** S.

**Deadline:** the Orionids peak around Wednesday 21 October, so ship by the 20th.

**What it shows:** the sky is a real sky, *his* sky, and the site keeps time with the world as well as with him.

**Risk:** astronomy pedants. That is why the log line says "About."

---

#### 11. The year, wound (December)

**Pitch.** On 31 December, the year unspools.

**How it works:**
1. From 31 December to 7 January, Projects' heading tail reads "2026, wound."
2. The year's stretch of thread lies straight across the screen with its marks, reusing the single-project unspool.
3. Under it, one sentence per tab:
   - "Nine projects, three alive."
   - "712 commits, most in May."
   - "Forty notes, mostly on music."
   - "2,140 plays. The most was {song}."
   - For this visitor only, from storage: "Urchi brought you nine things."
4. **Freeze the numbers on 31 December:**
   - Last.fm's `user.getTopTracks` with `period=12month` is a rolling window, so by 7 January it is a different year.
   - A local script writes `src/content/year-2026.json` on the 31st: the Last.fm totals, the commit totals from `github.json`, and the note counts.
5. A share card of the line.

**Effort:** M. **Deadline:** Thursday 31 December.

**Risk:** a thin year looks thin, which is honest.

---

#### 12. Later: Someone was here

**Pitch.** The last person who tapped a rhythm left it behind, and Urchi kept it.

**How it works:**
1. When Urchi answers a rhythm (`Call.ts`), the page posts its gaps to `/api/rhythm` (new):
   - quantized to 20ms;
   - 3 to 8 taps;
   - plus the tap's normalised position.

   The server validates the shape strictly and rejects anything else.
2. **The store:** Upstash Redis (free tier, through the Vercel Marketplace), holding a ring of the last twenty.
3. **The replay:** a later visitor, at home, by day, after 30 seconds of stillness, sees Urchi look at the spot where someone tapped. It blinks their rhythm once, planned with `plan()` (`Call.ts:69`) and played through the `answer` act (`acts.ts:414`).
4. **The caption:** `URCHI_STATES.remembering`, "Someone tapped this at 14:02. It kept it."
5. **If they tap it back** (`matches()`, `Call.ts:93`), Urchi gives the slow blink of `trust` (`acts.ts:455`), and the caption becomes "You, and someone at 14:02."

**Privacy:** no IDs and no stored IP. Rate limiting keys on a salted hash that expires within the hour. A rhythm cannot say anything, and your own rhythm never comes back to you.

**Edge cases:**
- **Reduced motion:** blinks only, and the look is a cut.
- **Never** at night.

**Effort:** S-M, plus the store.

**The gate:** December, and only once counts show twenty named events a day for a week. Visits are not counted (decisions.md, item 7), so the events stand in for them. Before that, the rhythm it replays would most likely be the visitor's own.

---

#### 13. Cut, with reasons

| Idea | Why not |
|---|---|
| The common sky (one star per visitor) | User-generated content and moderation on a site about one person. The caps stop vandalism only in part. Revisit in 2027 if §12 shows people come. |
| Others here (live motes) | Needs a WebSocket host and a third-party origin in the CSP, and Space would nearly always show no one. |
| Noticed, as its own feature | Merged into Phosphenes (§6.2) |
| One page for colophon, kept and privacy | Split (§6.1) |
| "One content commit for every Urchi commit" | Easy to game when Claude writes the commits, and it fights the realism he asked for. Replaced by content gates (§14.3). |
| Email newsletter | A list is a store of other people's data. RSS reaches the same readers. |
| "Ask the site", an LLM chat | Generic, off-voice, costs money, and a prompt-injection surface. It does not return as a Phosphenes challenge either: a light that asks visitors to inject a prompt asks them to exploit something, and security here is defensive only. |
| Public visit counters | Small numbers read as failure |
| Text guestbook | Needs moderation |
| `/uses` | One paragraph in the colophon is enough |
| PWA, offline | Nobody installs a portfolio |
| Strava for `sport` | Routes give away where you live. A security person should not publish them. |
| Webring | Later, when there are neighbours |
| Other languages | Not yet |

---

#### 14. If it were mine

##### 14.1 A clock of one person

Most portfolios are brochures. This one is already half a window into a life:
- Urchi keeps his hours.
- The room takes the colour of the record he is playing.
- Notes are his voice.

Every one of these signals is real, cannot be faked, and is half built. Push them all the way:
- asleep (his hours);
- listening (Last.fm);
- working (the pulse, §3.8);
- writing (notes and the log);
- a status that dates itself (§7.4);
- a sky that is his hemisphere's (§10).

A visitor at 02:14 his time should feel they have walked into a flat where someone is asleep and the record has just stopped. No template can copy that, because it is his actual life.

**The privacy line:** every one of these signals is also a fact about him. `/kept`'s "what it gives away about me" says so plainly. *Decided:* all of them stay, and the list names each one: his zone (Australia/Melbourne), his sleep (01:00-06:59), his listening, his handle, `WORK_HOURS`, and push times for public repositories only, while private work shows only as closed marks and monthly totals (decisions.md, items 1 and 5; Music, About and Notes 3). *Changes if:* he asks for one to go; each is one line.

##### 14.2 The four bets

1. **It remembers you.**
   - Spend the realism budget on the first twenty seconds at home, which every visitor sees. That means the ordered items in `reviewed/urchi-realism.md`: eyes before head, seeing you a moment late, blinks that come when they come, lids that follow the eyes, and pursuit shipped together with saccades.
   - Then its memory of a returning visitor.
   - Then finds (`reviewed/space-finds.md`: Spacewalk with the story layer). Left alone, Urchi goes out along its line and comes back with something: **you get things by leaving it alone.** That is the site's philosophy turned into a mechanic.
   - *Ruled in the summary (bet one, and "When Urchi's realism starts"): package one (latency, head speed by amplitude, eyes first, near aversions) ships behind `lifelike` in week 2 on its own branch, with the softer first wake; then lids and blinks, then touch (the blink reflex in week 3, stroking in week 5). The finds spine comes after package one and the lids, from week 4. Ears, sleep life and memory follow, with memory last, in week 9.*
2. **The thread is true.** Section 3. Nobody else's projects page updates itself from the work they actually did.
3. **Phosphenes.** The site's thesis is people who notice, and in security, recon *is* noticing. `/kept` is the proof, and the lights are the play.
4. **New at midnight here.**
   - One daily game done superbly (Same Grey, No. 1 on Monday 12 October), then Stet (No. 1 on Monday 9 November), then Plaintext from Monday 7 December. *Decided (decisions.md, Daily games 4): each waits until the last has four weeks of archive and the counts show people coming back.*
   - Shares in plain text, with no emoji grids. An archive that becomes beautiful as it grows. No Urchi.
   - His midnight also lands well for others: he is on Melbourne time (+11:00 from Sunday 4 October), so a new puzzle drops at 09:00 in New York (08:00 after 1 November) and 14:00 in London (13:00 after 25 October), the American morning and the European afternoon.

##### 14.3 What to stop doing

1. **Letting content wait for polish.** Keep polishing Urchi; he asked for exactly that. But the site launches on dated gates, not on a commit ratio:
   - **by Sunday 11 October:** every project real, with `why` and `did`; five notes; `WORK_LINE` written;
   - **by Sunday 1 November:** the first paper, and two notes a week since launch;
   - **by Monday 23 November:** three papers, and the Urchi case page with "Five visors".
2. **Hiding who he is.** "D . T" and "Basic Human" stay as the joke, next to the truth (§4.1).
3. **Shipping without a phone story.** The sound chip is hidden at 1024px and below, so a third of the craft (sound) is gone on phones and tablets. The chip moves into the nav on every screen (Style R4). Every new feature states its phone behaviour before it merges.
4. **Placeholders in production.** A content test fails the build while any `TODO(darius)` or `.example` remains (Engineering §3.4, the content lint). The same test checks that the intro ring has eight or more real images (§3.7).
5. **A fourth kept WebGL context** (§5.7).
6. **Behaviours nobody can find.** Keep the secrets, but give three ways in:
   - the key sheet;
   - log lines that announce new behaviours ("Urchi brings things back now, if you leave it alone.");
   - Phosphenes, for the hunt.
7. **Building five of everything.** Ship one of each, watch the counts, then choose the second.
8. **Treating Urchi as the answer to everything.** His instinct to keep games Urchi-free is right. Extend it to tools and papers. Urchi's power is being the one creature in a quiet place.

---

#### 15. Roadmap

Today is Tuesday 29 September 2026. The weeks run from Wednesday 30 September. The dates assume his current pace, which is about twenty-five commits a day across parallel branches. It is an order more than a calendar: if a week slips, keep the order.

##### Today, Tuesday 29 September

- Paste the brief in §1 into the session adding GitHub projects. *Done in part: that session merged as `0d9641d` (decisions.md, fact 1), and the rest of the brief is the week-1 months branch.*
- Set `TIME_ZONE = "Australia/Melbourne"` and, on the line after it, `HEMISPHERE = "south"` (`site.ts:16`). Remove the two `TODO(darius)` marks on the GitHub and email links (`site.ts:41, 43`): `github.com/dctxv`, and `dctxvv@gmail.com`, the address all seven of his commits carry. `SITE_URL` (`site.ts:10`) reads `NEXT_PUBLIC_SITE_URL`, the Vercel production URL until a domain is bought (decisions.md, fact 3 and items 1-2).

##### Week 1, 30 September to 4 October: real projects on a thread that holds them; people can find him

| Work | Docs | Effort |
|---|---|---|
| **First days:** the two proxies closed: `/api/preview` serving only signed songs, `/api/cover` taking only images, and timeouts (moved up from week 2 because this report is already public) | Engineering §3.2; decisions.md, fact 2 and Engineering 4 | S-M |
| The branch in flight landed as `0d9641d` with nine turns and the placeholders out. The rest of the §1 brief is one branch, "Projects: months on the thread", which owns `ThreadScene.ts`: the month model, marks by date, `countWord`, `statusWord` in months, ring sources, and the drafted `did` lines (decisions.md, fact 1 and Engineering 5) | §1, §3.6-3.7 | S-M |
| `site.ts` split into identity, projects and notes as a pure move, on Wednesday 30 September; `site.ts` keeps re-exporting everything | Engineering §6; decisions.md, Engineering 5 | S |
| `CLAUDE.md`, `npm run check`, Vitest (scripts under `tsx`) and the content lint | Engineering §2, §3.4 | M |
| Lights off: a per-panel error boundary (in week 1, as in the summary's roadmap) | Engineering §1.1 | S-M |
| Case page v2 | §3.10 | S-M |
| **Content:** `why` and `did` for six to eight projects; real covers for the top five; §3.12 hygiene on every public repo to be linked | §3.12 | content |
| The name on screen; sound on phones (the chip moves into the nav); `WORK_LINE`; a truthful title | Style R2, R4, R9; §4.1 | S-M |
| Cards v1 (site, projects, notes) | §4.3 | S |
| `keys.ts`, digits 1-6 as keys with 3 reserved until the Desk pill lands in week 2, `pillOf` (the case page lights Projects) | §5.4-5.5 | S |
| Since Tuesday | §7.4 | S |

##### Week 2, 5 to 11 October: safe, plain, and the Desk's frame

| Work | Docs | Effort |
|---|---|---|
| Headers, CSP in Report-Only (`'unsafe-inline'` on day one, nonces before anything is enforced), HSTS without `preload`, `Permissions-Policy` denying by default, `/api/now`'s timeouts, cache and honest outage, `security.txt`, `robots.ts`, `sitemap.ts` | Engineering §3.1-3.3; security.md first slice | M (three days) |
| The domain: `dariustan.dev` bought by Friday 9 October (else the first free one of `dariustan.com`, `darius-tan.dev` and `dctxv.dev`), and `NEXT_PUBLIC_SITE_URL` moved to it | decisions.md, item 2 | ten minutes |
| **On its own branch:** Urchi's package one behind `lifelike` (latency, head speed by amplitude, eyes first, near aversions) and the softer first wake (`CreativeSpacePanel.tsx:195`), recorded before and after against the probe | Urchi §2; decisions.md, item 6 | S-M |
| Plainly, with print, the PDF and the security lens | §4.2 | M |
| Quiet counts: Umami, three named events | §8.2 | S |
| `tabOf` and Shell with the four hooks, `DeskPanel`, the Today drawer; `random.ts`, `day.ts` (his zone, Australia/Melbourne, falling back to UTC), `store.ts` | §5, Engineering §4.1-4.5 | S + M |
| Daily groundwork and **Same Grey**, with 400 days frozen and validated; the key sheet | reviewed/daily-games.md; §9 | M |
| **Content gate, Sunday 11 October:** every project real, with `why` and `did` (none still `draft: true`); five notes; `WORK_LINE` present. **Soft launch, the same day:** his Instagram bio and his CV. Same Grey No. 1 goes live at his midnight into Monday 12 October, only if the 400 frozen days pass their checks. Otherwise it moves to Monday 19 October. | | |

##### Weeks 3 to 10

| Week | Dates | Urchi | Projects and content | Desk | Security | Other |
|---|---|---|---|---|---|---|
| 3 | 12-18 Oct | Extract `Space.ts`, then the `?debug=urchi` panel; lids that follow the eyes; log-normal and incomplete blinks; the blink reflex | `sync-github.mjs` (closed marks through `SYNC_PRIVATE`), the weave, the daily Action; `Piece:` trailers start; two notes | Same Grey, No. 1 on Monday 12 October | `/kept` v1 with the live headers; the CSP moves to nonces, still Report-Only | The log writes itself, By feed |
| 4 | 19-25 Oct | Finds MVP, the spine (reviewed/space-finds.md phase 1); the shared shooting-star event and "It saw it too" | The Urchi case page, "Five visors" | The Tools frame; tool: **Sky** (a context only while open), with skies frozen as version one in its first commit | Paper 1: "How this site stopped being anyone's song proxy" | The sky keeps the calendar by the 20th; Orionids around the 21st |
| 5 | 26 Oct-1 Nov | Stroking and the purr; ears and the bristle | The thread alive: thickness, the loose end, `/api/pulse` (public pushes only) | `/colophon` with the key and sound switches | CSP enforced after a clean week; **Phosphenes**: the hub and six lights | Doorstep and the profile |
| 6 | 2-8 Nov | Finds phase 2 begins; breath and sighs; rests more than it performs afloat | Two notes | **Stet** ready: forty public-domain passages approved by Monday 2 November | Paper 2: "A CSP for a three.js site" | |
| 7 | 9-15 Nov | Moods, habituation, microsleeps; finds v2 continues | "He is working"; the ThreadScene layout extraction with golden numbers | **Stet No. 1** on Monday 9 November; tool: **Grain**; Go | HSTS `preload` on Monday 9 November; two more lights | Notes from the phone |
| 8 | 16-22 Nov | Sleep life: dreams and the pillow, in place before the launch audience arrives at his 01:00 | | Room for the launch (Plaintext's build moves to December) | Two more lights | Leonids around the 17th; `EDUCATION` confirmed, or dropped, by Monday 16 November |
| 9 | 23-29 Nov | Memory and persona: recognition, "it knows your rhythm", the arrival budget | Launch check | Stet's third week; Plaintext's build | Paper 3: "The notes Action, and the injection it does not have"; "Seen in the dark" | **Public launch:** Show HN on a weekday morning US time, which is his night, so Urchi is met asleep; galleries (Awwwards, Godly, siteinspire) |
| 10 | 30 Nov-6 Dec | | | Tool: **Cues** or **Tone**; Plaintext ready, with the monospace (Commit Mono); **Plaintext, week 1 "The name"**, from Monday 7 December | The last two lights | Someone was here, if counts show twenty named events a day for a week |

*Decided (decisions.md, Daily games 4, items 2 and 6, Strategy, and the summary's roadmap): Stet No. 1 moves from 2 to 9 November and Plaintext from 23 November to 7 December, so no game starts before the last has four weeks of archive; paper three is the notes Action, in week 9; the CSP moves to nonces in week 3 and is enforced in week 5; HSTS `preload` is added on 9 November; Urchi's weeks follow the summary's order, with package one and the softer first wake in week 2 and sleep life in week 8.*

##### The launch gate for week 9

Every item below must be true:
- A+ headers, with the CSP enforced;
- no placeholders, and the content test passing;
- only real projects, and every linked repo through §3.12;
- at least eight real images in the intro ring;
- Plainly prints to one page, and the PDF matches it;
- a visit without WebGL is readable;
- share cards on every route;
- one daily game with at least four weeks of archive (Same Grey, whose No. 1 is six weeks earlier);
- the softer first wake and Urchi's sleep life live, because the launch audience arrives at his night (decisions.md, fact 5);
- the finds MVP live;
- `/kept` live, with Phosphenes' first six lights;
- his name visible within a second on every page and device;
- the three content gates in §14.3 met.

##### Later (December onwards)

- The Geminids, around Monday 14 December.
- The year, wound, on Thursday 31 December.
- The third tool, and **Plate** (the games review's flagship, about a week and a half of work) if the counts say the dailies are played.
- **Last login**, as a hand-written weekly.
- Phosphenes, season two.
- Urchi's micro-acts library (the sneeze, with its cue in `sfx.ts`), dizziness after a spin, a level head while tumbling, pupils with a size of their own, and the catchlight experiment behind its flag. "It dreams" moves to week 8, before launch (decisions.md, Urchi 4).
- The common sky and Others here stay cut unless traffic changes the argument.

---

#### 16. How to know it is working

| Measure | Now | Target |
|---|---|---|
| Time until his name is on screen and stays | 0.3s, gone by 4s (desktop); never (phone) | Under 1s, on every page and device |
| Landing to a case page that states his part and stack | Impossible | Two clicks. Plainly: one. |
| securityheaders.com, Mozilla Observatory | F | A+ on both |
| A visit without WebGL | "Application error" | Readable, with Plainly one click away |
| The thread with real data | 1.1 turns, every pluck D4 | At least nine turns; marks by month; five notes on the ladder |
| Distinct real images in the intro ring | 12 generated | At least 8 real, 12 by launch |
| Share cards | None | Every route |
| Public repos linked from case pages that pass §3.12 | n/a | All |
| Notes written by him | Two | At least two a week, plus approved log lines |
| Papers | None | Three by 23 November |
| Returning players: the share of `game_finished` events with a streak of two or more (visits are not counted, decisions.md, item 7) | Unknown | Tracked from Same Grey No. 1; the target set after four weeks |
| Today completions (`game_finished`; shares are not counted) | n/a | Tracked from No. 1 |

---

### Decisions

*The owner is asked nothing. The five questions this section first put to him are decided in `decisions.md` ("By section", Strategy 1-5, and the eight they point to), which wins where this section disagrees; the rest are summary rulings or decided here. Each line gives the decision, its reason, and what would change it.*

1. **The one true line, the reader, the degree, LinkedIn.** `WORK_LINE = "Student developer in Melbourne. Interfaces, AI tools and security."`, a working draft, goes in the title (`title.default` becomes "Darius Tan"), the description, the cards, the JSON-LD `jobTitle` and Plainly, with "Basic Human" on screen beside it as the joke. The first reader is a graduate or internship screener, the second a security hiring manager. Plainly's default lens leads with Atelier, NextBranch and the Career Hub, `/plainly/security` with VECTOR, and `/plainly/design` with eigengrau and Urchi. Education reads "Studying at Swinburne University of Technology." until he confirms the degree and date (the lint fails from Monday 16 November). No LinkedIn, and no availability line. *Why:* every word can be checked against the work on `main`. *Changes if:* he rewrites the line, which is welcome at any time, or he is not a student, and then its first sentence goes. (decisions.md, item 3; Strategy 1.)
2. **Desk third.** Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6, with the drawers Today, Tools and Security. The digit keys land in week 1 with 3 reserved. *Why:* renumbering is free only until the digits do something. *Changes if:* all three drawers are cut. Nothing less. (decisions.md, item 4; Strategy 2.)
3. **Private work.** All eight private repositories appear as untitled closed marks at the month each was created, reading "Closed. Ask and I will show you." Nothing else of theirs (name, description, language, README, images or `Piece:` trailers) reaches the site or the public repository. Their pushes thicken the thread only as one monthly total across all eight. Push times, and "Wound on at 2:14. He should have been asleep.", are shown for public repositories only. The sync prints only counts for private work, and a test fails it if a private name appears in `github.json` or in the Action's log. *Why:* it needs no judgement from him, it keeps the thread's thickness true, and summing hides any one repository's rhythm. *Changes if:* a private repository is someone else's work or covered by an agreement; it then leaves through `SYNC_EXCLUDE`. (decisions.md, item 5; Strategy 3.)
4. **Where he is.** `TIME_ZONE = "Australia/Melbourne"` and `HEMISPHERE = "south"` (`site.ts:16` and the line after it). Urchi sleeps 01:00 to 06:59 there, the daily puzzles turn at his midnight, falling back to UTC, and the sky calendar uses the southern table. *Why:* his commits carry +10:00, and his public coursework is a Swinburne unit. *Changes if:* he moves city, or spends a season somewhere else. (decisions.md, item 1; Strategy 4.)
5. **Claude Code.** Once, plainly and first, on `/colophon`: "I wrote what each branch should do, and read every merge." It is not in the `did` lines, on Plainly or in the cards. *Why:* said first by him, it reads as a way of working; found later by someone else, it reads as a secret. *Changes if:* an application asks directly; he answers there, in the same words. (decisions.md, item 8; Strategy 5.)
6. **The brief is half delivered.** The GitHub-projects branch merged as `0d9641d`. Its unfinished items (months, marks by date, `countWord` in `projectsLine`, months in `statusWord`, and `did` lines drafted and marked `draft: true`) are one week-1 branch, "Projects: months on the thread", which owns `ThreadScene.ts`; closed marks wait for the sync in week 3. *Why:* one owner for `ThreadScene.ts` at a time is the house rule. *Changes if:* another branch is already in `ThreadScene.ts`; the months branch then waits for it. (decisions.md, fact 1; Strategy, "Also settled here"; Engineering 5.)
7. **The domain.** `SITE_URL` reads `NEXT_PUBLIC_SITE_URL`, the Vercel production URL until `dariustan.dev` is bought, by Friday 9 October (else the first free one of `dariustan.com`, `darius-tan.dev` and `dctxv.dev`). HSTS `preload` is added on Monday 9 November. *Why:* the soft launch prints the address on his CV, which cannot be relinked. *Changes if:* he already owns a domain (use it), or none of the four is free (the site stays on the Vercel URL). (decisions.md, item 2.)
8. **Counts.** Umami Cloud, cookieless, proxied under `/u/` on the same origin, with page views off and three named events only (`game_finished`, `find_taken`, `tool_export`), nothing sent under Do Not Track or Global Privacy Control, and each named on `/kept`. "Someone was here" is gated on twenty named events a day for a week, and §16's returning visitors become the share of finishes with a streak of two or more. *Why:* the streak bucket answers "does anyone come back" without an identifier. *Changes if:* Umami's free tier ends (then self-hosted Umami behind the same `/u/`), or he is on Vercel Pro and prefers its events, under the same names. (decisions.md, item 7.)
9. **Coursework, and what is linked.** The Career Hub keeps its case page and names its team, with no Source link and no pin; `urchi-test` stays off; `plateup-bridge` stays off until it has a README and a `why`. The profile pins `eigengrau`, VECTOR, NextBranch and Atelier, each once it passes §3.12, and each linked public repository gets an MIT licence, as eigengrau does. *Why:* the unit's rule on publishing assessed work is not known, a pin is a Source link, and MIT is the licence people know how to honour. *Changes if:* the unit's rules are known to allow publishing (`source: true`), or a repository holds code under another licence, which then wins. (decisions.md, item 5; Tools 2.)
10. **The papers.** Paper three is "The notes Action, and the injection it does not have", not a CTF write-up, in week 9. All three are drafted from the real diffs and approved by him (`approved: true`, about an hour each), under his byline. *Why:* it is defensive, it comes from a real diff, and it costs him no CTF hours. *Changes if:* he finishes a CTF or a lab he wants to write up; it becomes paper four. (decisions.md, Strategy, "Also settled here".)
11. **The order of the games.** Same Grey No. 1 on Monday 12 October, Stet No. 1 on Monday 9 November, and Plaintext, week 1 "The name", on Monday 7 December; the launch gate's game is Same Grey. *Why:* the summary's own rule, no new game until the last has four weeks of archive and the counts show people coming back. *Changes if:* fewer than forty Stet passages are approved by 2 November (Stet slips a week at a time), or the counts show nobody coming back (the next game waits a week at a time). (decisions.md, Daily games 4.)
12. **Urchi and the Desk.** Urchi never comes to the Desk and never points at it for the daily. It looks up at the Desk pill once only when `UPDATED.desk` moves for a new game, tool or paper, and `URCHI_NEWS.today` is not added. *Why:* a daily look would mean nothing, and the games stay Urchi-free. *Changes if:* nothing; it is a summary ruling (reconciliation 4).
13. **Phosphenes, and security, stay defensive.** The keeper's pass is read, never forged; "Ask the site" does not return as a challenge; the page invites nobody to break anything; `/kept`'s "Try it" probes are the site testing its own fences in the visitor's own page. *Why:* security on this site is defensive only. *Changes if:* nothing; it is a standing rule.
14. **The first wake, and a launch at his night.** The night's first wake in a browser is groggy (heavy lids and a slow blink), shipped with package one in week 2; dreams and the pillow land in week 8. *Why:* the Show HN morning in New York is 01:00 in Melbourne, the minute Urchi falls asleep, and a stranger's first touch should not be told off. *Changes if:* the launch moves; sleep life then stays in the week before it. (decisions.md, item 6, fact 5 and Urchi 4.)
15. **What only he writes.** His own hours go only to the `why` lines, reading four drafted `did` lines (about five minutes), approving the papers and the forty Stet passages (about an hour each), and notes; everything else here is drafted for him to approve. *Why:* the owner's hours are the scarcest thing on the roadmap. *Changes if:* he wants to write more himself, which always wins over a draft. (decisions.md, item 3.)

### If you only do one thing here

Today, before the session adding your GitHub projects merges, paste it the brief in §1:
- remove every placeholder together;
- give each project `start` and `end` months and a `did` line;
- wind the thread at least nine turns and place marks by date;
- switch `projectsLine` to `countWord` and `statusWord` to months;
- feed the intro ring real images;
- keep private repositories closed.

That is an S-to-M change inside work already happening. Without it, the day your real projects arrive is the day the Projects tab turns into a loose S-curve with every pluck the same note, under a heading that says "15 projects since 2026". Everything else in this document can wait a week. This cannot.

*Decided since (decisions.md, fact 1): that session merged as `0d9641d`, with the placeholders out, real pieces for the ring and nine turns. The one thing is now the week-1 branch "Projects: months on the thread", which carries the rest of this list: months and marks by date, `countWord` in `projectsLine`, months in `statusWord`, and the drafted `did` lines. Closed marks, all eight and untitled, follow with the sync in week 3.*
