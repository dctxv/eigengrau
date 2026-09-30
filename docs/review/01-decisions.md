# Decisions

*29 September 2026. Darius asked not to be asked anything, so every question the report put to him is decided here: the eight in the summary's Roadmap ("Today, Tuesday 29 September", item 2), and the "Open questions for the owner" at the end of each section and the addendum. Duplicates are merged into the first eight, and each section's list points to them. Each decision gives a one-line reason, what it unblocks, the fact that would change it, and the one line that reverses it. When that line does not exist yet, it is marked new. Everything under "Decisions already made" is used as given and not reopened. Where a section disagrees with this list, this list wins. None of these decisions overrides the summary's rulings.*

**Five facts found while deciding.** Each one changed an answer.

1. **The GitHub-projects branch has merged.** `origin/main` is at `0d9641d` (16:40 UTC on 29 September, 02:40 on Wednesday in Melbourne). It brings four public projects (VECTOR, Digital Career Hub, NextBranch and Atelier), thirteen real pieces, and `TURNS_LEAST = 9` in `ThreadScene.ts`, and it removes every placeholder. It does not bring the brief's months, `did` lines, closed marks, or `countWord` in `projectsLine`. The local checkout is still at `9b8c07c`, so line numbers below are from that commit.
2. **This report is already public.** `docs/review/` was committed as `7da6945` on `claude/project-review-features-hs0fub`, and that branch is on `origin` of a public repository. Anyone can read the two proxy findings before they are fixed.
3. **His email is confirmed by his own commits.** All seven of his commits are authored `dctxv <dctxvv@gmail.com>`, which is the address at `site.ts:43`.
4. **Actions logs on a public repository are public.** Anything the GitHub sync prints about private repositories would be published.
5. **The launch audience arrives at his night.** In launch week, 09:00 in New York is 01:00 in Melbourne, the minute Urchi falls asleep. A Show HN post on a US morning will be met by a sleeping creature.

---

## The eight that unblock most

### 1. Where he is: Melbourne, southern hemisphere

**Decision.** `TIME_ZONE = "Australia/Melbourne"` and, new, `HEMISPHERE = "south"`. Everything that has a day uses his day:
- Urchi's sleep, 01:00 to 06:59;
- each daily puzzle's midnight, falling back to UTC and never to the visitor's day;
- Music's week, the sky calendar and Plainly's clock.

Plainly says "Melbourne." The Today head may say "It is already Friday here." to a visitor behind him, and "It is still Thursday here." to one ahead of him (New Zealand, the Pacific). Both are true, and they explain why No. 12 arrived at the visitor's breakfast.

- **Why:** his commits carry +10:00, and his public coursework is a Swinburne unit. One zone means one "No. 12" for everyone.
- **What it means in practice:** from Sunday 4 October his midnight falls at 09:00 in New York (08:00 after 1 November), 14:00 in London (13:00 after 25 October) and 21:00 in Singapore, so each puzzle lands on an American morning. Urchi sleeps through New York's 10:00 to 15:59 (09:00 to 14:59 after 1 November) and London's afternoon.
- **Unblocks:** engineering §1.2, `day.ts`, Same Grey's frozen days, Urchi's night, the sky calendar, "Where the days meet", and the softer first wake (item 6).
- **Changes if:** he moves city, or spends a season somewhere else.
- **Line:** `src/content/site.ts:16` (`TIME_ZONE`), with new `HEMISPHERE` on the line after it.

### 2. The domain

**Decision.**
- **The name.** Buy `dariustan.dev` by Friday 9 October, before the soft launch. If it is taken, buy the first free one of `dariustan.com`, `darius-tan.dev` and `dctxv.dev`.
- **Until it resolves.** `NEXT_PUBLIC_SITE_URL` is the Vercel production URL, as already decided. Canonicals, cards, `security.txt` and the sitemap all follow that one variable.
- **HSTS.** `max-age` goes on with the first headers commit. `preload` is added and submitted on Monday 9 November, a month after the domain goes live. On `.dev` this step is a formality, because browsers already force HTTPS for the whole TLD.
- **Email.** The address stays `dctxvv@gmail.com` (fact 3), and the `TODO(darius)` at `site.ts:43` goes. There is no forwarding address.

- **Why:** the soft launch puts the address on his CV and in his Instagram bio, and a printed CV cannot be relinked. A domain in his name carries the name that the review's fourth risk says is missing.
- **Unblocks:** link cards v1 (week 1), canonicals, `security.txt`, previews that do not change after LinkedIn and applicant tracking systems cache them, and Phosphenes' DNS TXT light (week 5).
- **Changes if:** he already owns a domain (use it), or none of the four is free. In that case the site stays on the Vercel URL, and the build still passes.
- **Line:** the Vercel environment variable `NEXT_PUBLIC_SITE_URL`, read by `SITE_URL` (`site.ts:10`). Preload is the `Strict-Transport-Security` value in a new `headers()` in `next.config.ts`.
- **His time:** ten minutes and the registration fee. It is the only purchase on this list.

### 3. `WORK_LINE`, the reader, and what only he writes

**Decision.**
- **The line.** `WORK_LINE = "Student developer in Melbourne. Interfaces, AI tools and security."` goes in now as the working draft. "Basic Human" stays on screen beside it as the joke. `title.default` becomes "Darius Tan", and the description and the JSON-LD `jobTitle` take `WORK_LINE`.
- **Who it is for.** The first reader is a graduate or internship screener. The second is a security hiring manager.
- **Plainly's lenses.**
  - The default lens leads with the AI work: Atelier, NextBranch and the Career Hub.
  - `/plainly/security` leads with VECTOR. It is the link he sends with security applications.
  - `/plainly/design` leads with eigengrau and Urchi.
- **Education.** "Studying at Swinburne University of Technology.", with the degree and the finishing date left empty.
- **LinkedIn.** None is listed. None is known, and a guessed one is worse than none.
- **Availability.** No availability line.
- **About.** "Small tools" stays unlinked on About, because those words are not in the line (summary, reconciliation 8).

- **Why:** it says what the work on `main` shows (a cybersecurity atlas, two AI tools and an AI capstone), and every word of it can be checked.
- **Unblocks:** the page title, the cards, the JSON-LD, Plainly and its PDF, and About's foot.
- **Changes if:** he rewrites it, which is welcome at any time, or he is not a student, in which case the first sentence goes.
- **Line:** new `WORK_LINE` in `site.ts`, beside `ROLE` (`site.ts:8`), with new `EDUCATION` and `LINKEDIN = null` under it.

**What only he can write: the working default, and the day the lint starts to fail.** A build never fails because he has not written enough. It fails on placeholders, on broken rules, and on drafts past their date.

| What | Working default | The lint fails from | What clears it |
|---|---|---|---|
| `WORK_LINE` | The draft above | The day the content lint lands (week 1, by Sunday 4 October), and only if the line is missing or empty | It exists. Being the draft never fails. |
| Placeholders (`TODO(darius)`, `.example`, a null `TIME_ZONE`) | Filled by items 1 and 2 | The same day, in every production build | None left |
| The status line (`site.ts:27`) | "Busy putting a hole in spacetime." | The same day ("every sentence ends") | Its full stop, added in the same commit |
| `did`, one per project | A factual line drafted by the week-1 projects branch from each repository's authors and README, marked `draft: true`. The Career Hub's comes from his own `why`: "One of six. I lead the AI side." | Sunday 11 October, while any `did` is missing or still `draft: true` | He reads four lines and deletes the flags, about five minutes |
| `why`, one per project | The four on `main` (`0d9641d`) | Sunday 11 October, if any is missing | They exist |
| `EDUCATION` | Swinburne, with the degree and date empty and `confirmed: false` | Monday 16 November, a week before launch | `confirmed: true` with the degree and year, or `EDUCATION = null` to drop the line |
| Notes | His two of 28 September stay. They are his, and the burrito find is keyed to one of them | Never in a build. `npm run check -- --launch`, run before the public post, fails with fewer than twelve notes and papers. | Writing |
| Papers | Drafted from the real diffs for him to approve (`approved: true`) | The launch check fails with fewer than three approved | Approving, about an hour each |
| Stet passages | Forty public-domain passages, chosen and marked up for approval (Daily games, 4) | `npm run today` refuses unapproved passages, and fails from Monday 2 November while fewer than forty are approved | One sitting, about an hour |
| Urchi's lines, the capsule, the letter, `npm run leave` | The lines already written (Space finds, 2) | Never | Nothing to clear |
| `WORK_HOURS` and the city | 9:00 to 18:00, Monday to Friday; "Melbourne." | Never | Nothing to clear |

### 4. The Desk, third

**Decision (already made).** Pill three, with the drawers Today, Tools and Security. The row reads Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6. That settles the games' "Today pill last", the tools' "`/tools` reached from About" and style's "Desk as 5".

New here: the digit keys land in week 1 with 3 reserved. Notes, Music and About answer to 4, 5 and 6 from the first day any digit works, so nobody ever learns the old numbers. Pressing 3 does nothing until the Desk pill appears with its frame in week 2.

- **Why:** renumbering is free only until the digits do something.
- **Unblocks:** `keys.ts`, the `?` sheet, `pillOf`, the Desk frame, the Tools registry's home and the Security drawer.
- **Changes if:** all three drawers are cut. Nothing less.
- **Line:** `TABS` (`site.ts:29-35`).

### 5. Private work

**Decision.**
- **All eight appear.** Every private repository appears as a closed mark, without a title, at the month it was created. It reads "Closed. Ask and I will show you." Nothing else of theirs (name, description, language, README or images) reaches the site or the public repository.
- **Activity is summed.** Their pushes thicken the thread as one monthly total across all eight, never per repository.
- **Push times** ("Wound on at 2:14. He should have been asleep.") are shown only for public repositories.
- **The sync prints only counts** for private work ("Eight closed. Forty-one pushes in September."). A test fails the sync if any private name, fetched at run time and never stored, appears in `github.json` or in the log (fact 4).
- **Public repositories left out.** The Career Hub is coursework. It keeps its case page and its team, but shows no Source link. `urchi-test` stays off because it is a test. `plateup-bridge` stays off until it has a README and a `why`.

- **Why:** showing all eight is the only choice that needs no judgement from him and keeps the thread's thickness true. Summing the pushes hides any one repository's rhythm.
- **Unblocks:**
  - `scripts/sync-github.mjs` and the daily Action (week 3), the weave and `/api/pulse`;
  - the closed ring in `drawMarks` (`ThreadScene.ts:4829`);
  - `countWord` in `projectsLine`, which is needed now: four public projects and eight closed ones make twelve, and eigengrau and Urchi make fourteen, past `numberWord`'s twelve.
- **Changes if:** a private repository is someone else's work or covered by an agreement. That one leaves the count. The Career Hub gets its Source link when the unit's rules are known to allow publishing (`source: true`).
- **Line:** a new Actions variable, `SYNC_PRIVATE` (`all` or `none`), read by new `scripts/sync-github.mjs`. Exclusions go in the secret `SYNC_EXCLUDE`, never in the repository.

### 6. How much of Urchi's face may change, and memory

**Decision (the settled parts, with their numbers filled in).**
- **Pupils.** The rest share is 0.85. At rest after a big turn the pupils sit at 8.5 units instead of today's 10, not the section's 7.
- **Blinks.** The blink change in Urchi §4.5 goes in: a close of about 75 ms, a drawn shut of about 60 ms, and a 170 ms opening. The slow blink keeps its deliberate curve (`SLOW_BLINK`, `character.ts:1039`).
- **Catchlight.** It sits behind a flag that is off in production and available in `/dev/urchi`.
- **The glare** keeps its grown pupil (`angry: { pupil: 1.35 }`, `character.ts:961`).
- **Memory.** Urchi remembers visitors in `eigengrau:urchi`, in their browser only, as Urchi §12.1 specifies, including the grudge about last night.
  - `Call.ts:14` ("The only thing it counts is answers in this visit") is rewritten to match.
  - The persona fixes temperament only, and the colourway stays per page load.
  - About says so as the caption and accessible name of its mark: "It remembers you. Only in this browser." About's foot stays at two lines (reconciliation 8).
  - `/kept` lists the key and what it holds, with a "Forget me" button that clears every `eigengrau:` key.
- **New: the softer first wake moves into package one (week 2).** The night's first wake in a browser is groggy: heavy lids and a slow blink instead of the glare. The glare stays for a second wake the same night. It is one line, `CreativeSpacePanel.tsx:195` (`if (woke && night) faces.react("angry", …)`), and the launch audience arrives at his night (fact 5).

- **Why:** 0.85 moves the pupils most of the way off the rim while the face he drew stays recognisable. A stranger's first touch at 01:00 should not be told off.
- **Unblocks:** package one behind `lifelike` (week 2), lids and blinks (week 3), and memory and persona (week 9).
- **Changes if:**
  - the before-and-after recording against the probe still shows pinned pupils at 0.85: then 0.75;
  - the new blink reads as a twitch at a phone's 30 fps: then the close stays at 90 ms.
- **Line:** each part is one line: `rest: 0.85` in new `src/engine/urchi/lifelike.ts`; `BLINK` at `character.ts:1037`; `catchlight: false` and `memory: true` in `lifelike.ts`; `CreativeSpacePanel.tsx:195`.

### 7. Counts

**Decision.**
- **The service.** Umami Cloud's free tier, cookieless. The script and the endpoint are proxied under `/u/` on the same origin, so `connect-src 'self'` still holds.
- **What it counts.** Automatic page views are off (`data-auto-track="false"`). Three named events are sent, and nothing else:
  - `game_finished { game, n, streak: "1" | "2-6" | "7+" }`
  - `find_taken { tier }`
  - `tool_export { tool, format }`
- **When it counts nothing.** Nothing is sent while the browser signals Do Not Track or Global Privacy Control.
- **Disclosure.** `/kept` prints the three names and their fields exactly as sent.
- **His habit.** He looks once a week.

- **Why:** the streak bucket answers "does anyone come back" without an identifier or a page view, and three events keep the disclosure to one honest sentence.
- **Unblocks:**
  - the one-game-at-a-time rule (Daily games, 4);
  - the finds' pacing review;
  - Plate's go or no-go;
  - "Someone was here", now gated on twenty named events a day for a week, because visits are not counted;
  - Strategy §16's "Returning visitors a week", which becomes the share of finishes with a streak of two or more.
- **Changes if:** Umami's free tier ends or its terms change (then self-hosted Umami behind the same `/u/`), or he is on Vercel Pro and prefers its events (the same three names).
- **Line:** new `EVENTS` in new `src/lib/count.ts`, and the `/u/` rewrites in `next.config.ts`.
- **His time:** ten minutes to open the account and set `NEXT_PUBLIC_UMAMI_ID`.

### 8. Claude Code

**Decision (already made).** The acknowledgement appears once, plainly and first, on `/colophon`: "I wrote what each branch should do, and read every merge." It is not in the `did` lines, not on Plainly and not in the cards. Commit trailers stay as they are, since they are already public.

- **Why:** said first by him, it reads as a way of working. Found later by someone else, it reads as a secret.
- **Unblocks:** `/colophon` (week 5), and papers drafted from diffs under his byline, with the colophon saying how they were made.
- **Changes if:** an application asks directly. He answers there, in the same words.
- **Line:** the first sentence of new `src/app/colophon/page.tsx`.

---

## By section

### Urchi

1. **How much of the face may change.** See the eight, item 6: rest share 0.85, the blink change in §4.5 goes in, the catchlight is off behind a flag, and the glare keeps its pupil.
2. **Memory across visits.** See item 6: yes, in the browser only. About says it on the mark, and `/kept` explains it and offers "Forget me".
3. **Persona and colourway.** See item 6: the persona fixes temperament only. The colourway stays per load, because the eye accent (Style R15), the colophon's hundred eyes and the finds' labels ("Its eyes were denim.") all draw from the per-load colourway.
4. **The time zone, and whether sleep life leads.** The zone is item 1. The order stays as the summary has it, with one move:
   - the softer first wake joins package one in week 2 (item 6);
   - dreams and the pillow stay in week 8, which is now the week before launch, so they are in place when the launch audience arrives at his 01:00 (fact 5).

   Sleep life does not go first overall, because every visitor sees the look by day and only night visitors see sleep.
   - **Unblocks:** the week-2 branch's scope.
   - **Changes if:** the launch moves. Sleep life then stays in the week before it.
   - **Line:** the Roadmap row for week 8.
5. **A purr and a sneeze.** Yes, as already decided, both synthesised in `src/audio/sfx.ts`.
   - **When.** The purr ships with stroking (week 5). The sneeze ships with the micro-acts (December).
   - **Sound off.** Neither sounds with sound off, and each has a visible counterpart: for the purr, lids half-closed and the head leaning into the hand; for the sneeze, a jolt of the head. They join Urchi's own four sounds under the rule that Urchi's sounds stay Urchi's.
   - **Why:** stroking is the first thing anyone does to a cat, and nothing answers it today.
   - **Changes if:** the purr cannot be heard on phone speakers, since a purr lives around 25-150 Hz and they roll off far above that. It then gains a soft upper harmonic rather than more volume.
   - **Line:** the two new cues in `sfx.ts`.

### Style and UX

1. **The domain and the time zone.** See the eight, items 1 and 2.
2. **The eye colour, and a third face.**
   - **The eye colour.** Yes, in exactly three places, as already decided: the focus ring, `::selection`, and the Notes "new" dot. It drops to 40% chroma at his night, and reds fall back to ink.
   - **The third face.** The monospace is Commit Mono at weight 400, subset to ASCII, as WOFF2 plus a WOFF for troika. It arrives with Plaintext on Monday 7 December (Daily games, 4), and not before.
   - **Why Commit Mono:** it is drawn to be neutral, so machine text reads as a third voice and not as a brand. It is OFL.
   - **Changes if:** it smears at 11px in troika. Then JetBrains Mono, also OFL.
   - **Line:** `--eye` in `globals.css`, and the mono's `@font-face`.
3. **Where tools, games and security live.** See item 4.
4. **Nav on phones.** It stays at the top with bigger targets, as already decided. Six pills at 320px leave about 48px each, well over 24px. The bottom nav stays behind `?nav=bottom` in development builds only, and is not tried in production before launch.
   - **Changes if:** the 320px test fails the 24px centre spacing.
   - **Line:** the `?nav=bottom` flag.
5. **The public repo, and commit lines on the site.**
   - **Log lines.** Yes, as already decided. `npm run log` offers the week's merge subjects with yes as the default and never offers a `[quiet]` commit. It takes one keypress per line, once a week.
   - **Colophon numbers.** They come from a local `src/content/build.json`, written before each commit, because Vercel's shallow clone cannot count.
   - **Changes if:** a subject says something he would not publish. Then `[quiet]`, or no at the prompt.
   - **Line:** the prompt's default in new `scripts/log-from-git.mjs`.

### Engineering

1. **The domain.** See item 2.
2. **The time zone, and whose midnight.** See item 1: his midnight, falling back to UTC, one "No. n" for everyone, numbered per game.
3. **Where the Desk sits.** See item 4. The digit 3 is reserved from week 1.
4. **Public repo: CI and deploy gates.**
   - **CI.** GitHub Actions runs `npm run check` on every push and pull request (free on a public repository).
   - **The deploy gate.** Vercel's build command runs `npm run lint && npm run typecheck && vitest run && next build`, so a red test blocks a deploy even if Actions is down.
   - **`/kept`** links each build to its Actions run by commit hash.
   - **`main`** gets a ruleset that blocks only force-pushes and deletion, so `npm run note` keeps pushing straight to `main`. That settles the review's branch-protection point.
   - **Before any Source link:** secret scanning with push protection on every public repository, and one `gitleaks detect` over each history.
   - **New because of fact 2:** the proxy fixes (engineering §3.1-3.2: `/api/preview` serving only signed songs, `/api/cover` taking only images, plus timeouts) move from week 2 to the first days of week 1. The review branch is never merged, and `docs/review/` never lands on `main`. The branch stays up, since deleting it would not unpublish it.

   - **Why:** CI is free and public, and it gives `/kept` something real to link to.
   - **Changes if:** the repository ever goes private. The checks then run only in the Vercel build.
   - **Line:** new `.github/workflows/check.yml`, and Vercel's Build Command setting.
5. **The GitHub-projects branch.** Settled by fact 1: it merged as `0d9641d` and touched `ThreadScene.ts` in two places (`TURNS_LEAST`).
   - **Wednesday 30 September:** `site.ts` is split into identity, projects and notes as a pure move. `site.ts` keeps re-exporting everything, so no import changes.
   - **Then one week-1 branch, "Projects: months on the thread",** owns `ThreadScene.ts` and carries the brief's unfinished items:
     - `start`/`end` months, and marks placed by date;
     - `countWord` in `projectsLine`, and months in `statusWord`;
     - the drafted `did` lines.
   - **Closed marks** wait for the sync in week 3.
   - **The layout extraction** with golden numbers stays in week 7.

   - **Why:** the split touches no hot-spot file, and one owner for `ThreadScene.ts` at a time is the house rule.
   - **Changes if:** another branch is already in `ThreadScene.ts`. The months branch then waits for it.
   - **Line:** the week-1 row of the Roadmap.

### Space finds

1. **How much colour.** As already decided: gems reach at most OKLab chroma 0.12, on lit facets only, and stay ink-glass in shadow. Gold keeps to the same cap. The one gem that matches the eyes (#11) stays.
   - **Why:** colour only where light falls keeps "colour comes from something".
   - **Changes if:** at 10% zoom, dithered and pixelated, a 0.12 gem reads as an interface accent. Then 0.09.
   - **Line:** new `GEM_CHROMA = 0.12` in `src/engine/finds/`.
2. **The words.** They ship as written in the report: the catalogue's captions and repeats, the once list (#53-57), the letter (§6) and the burrito (#58).
   - **The capsule (#38).** It carries one of his five `URCHI_LINES` (`site.ts:58-64`), one not shown this visit, so its line is his without new writing. New `CAPSULE_LINES` starts empty and takes his own lines when he writes them.
   - **The USB stick (#55).** "My first project" is computed: the public project with the earliest `start`.
   - **`npm run leave`** is built, is optional, and nothing waits on it.
   - **Changes if:** he writes his own lines. They replace these without code.
   - **Line:** `CAPSULE_LINES` (new, in `finds.ts`).
3. **Gifts.** They are copies, as already decided: "It is a copy. Most gifts are." Forgery detection stays a quiet check ("A forgery. It can tell."). Nothing on the site invites anyone to try.
   - **Line:** new `GIFT = "copy"` in `finds.ts`.
4. **What the GitHub import writes, and wrecks.**
   - **The fields.** The sync (week 3) writes `archived`, `pushedAt`, `release`, `language` and `lastCommit` for public repositories only, into `src/content/github.json`. The four covers already exist.
   - **Wreck days stay parked,** as already decided, and "finished" means the section's data rule: archived, or no push for six months with a release. It does not mean the hand-set status word. VECTOR, NextBranch and Atelier read "shipped" on `main`, but none has been quiet for six months, and VECTOR is live and in use. There are no fictional derelicts in the meantime.
   - **When the rule is met,** the sync prints the first repository to meet it, and the L-sized build is scheduled then.
   - **Changes if:** he archives a repository.
   - **Line:** the status rule in new `scripts/sync-github.mjs`.
5. **Pacing.** As designed: three outings a day, the first always fruitful. It is revisited on Monday 23 November, after four weeks of `find_taken`.
   - **Changes if:** the counts show almost nothing taken after each browser's first find. That would mean people never wait long enough, and the second outing then comes sooner. The rates do not go up.
   - **Line:** the outing timings in `src/engine/finds/`.

### Daily games

1. **One pill called Today, or the Desk.** See item 4. Today is a Desk drawer at `/today/<game>/<n>` (paths, per the summary's ruling).
2. **Where "here" is.** See item 1. "It is already Friday here." is shown when his date is ahead of the visitor's, and "It is still Thursday here." when it is behind.
3. **The public repo, and the banks.**
   - **Frozen puzzles go private.** Every frozen puzzle file (`src/content/today/`, Same Grey included) lives in a new private repository, fetched at build by `scripts/fetch-today.mjs`. It uses a fine-grained read-only token (`TODAY_TOKEN`) and takes the repository's name from `TODAY_REPO`, both Vercel variables, so the public repository never names it.
   - **The seed root is secret.** It comes from a build secret (`TODAY_SALT`) instead of the literal `"eigengrau/today/v1"`, so the public generator cannot compute a day.
   - **It is not a project.** The bank repository is left off the thread through `SYNC_EXCLUDE`.

   - **Why:** the summary's rule is that nothing in the public repository holds a puzzle's answer. That covers Same Grey too, and it overrides the section's "accept it" for procedural games.
   - **Changes if:** the build cannot reach GitHub reliably. The frozen files then go into a Vercel Blob read only on the server, and the rule still holds.
   - **Line:** `TODAY_REPO`.
4. **Stet's supply, and the order of the games.**
   - **The bank.** Stet launches on public-domain passages, not on his weekly writing.
     - A branch chooses and marks up forty passages from pre-1900 non-fiction (Faraday 1861, Lovelace 1843, Darwin 1839, Babbage 1864, Somerville 1834 and others of their kind) with `npm run passage`: the swaps, the `keep` list and the source.
     - He approves them in one sitting of about an hour, by Monday 2 November.
     - Ten more are drafted each month.
     - Public-domain passages never carry a `qy`: that day's query becomes a `/`, as the section already specifies.
     - `npm run note` asks "Lend this to Stet? [y/N]" for any note of 80 to 120 words. A lent note may carry a `qy`, because its facts are his and sourced.
     - Nothing asks him for two paragraphs a week.
   - **The order.** It follows the summary's own rule, "no new game until the last one has four weeks of archive and the counts show people coming back". The roadmap's dates broke that rule by a week for Stet and by two weeks for Plaintext.
     - **Same Grey No. 1:** Monday 12 October, as planned.
     - **Stet No. 1:** Monday 9 November, not 2 November.
     - **Plaintext, week 1 "The name":** Monday 7 December, not 23 November.
     - **"The counts show people coming back"** means finishes with a streak of two or more on most days of the previous game's fourth week. If they do not, the next game waits a week at a time.
   - **The launch.** The launch gate's "one daily game with four weeks of archive" is Same Grey. Security at launch is carried by the headers, `/kept`, three papers and Phosphenes. Weeks 8 and 9 lose Plaintext's build and gain room for the launch.
   - **Plate** still waits for counts.

   - **Why:** public-domain prose costs him an hour instead of forty paragraphs, and one game at a time is what keeps a one-person site from running three half-played games through its launch.
   - **Changes if:**
     - he writes Stet paragraphs anyway: they go in with `npm run passage` and are chosen before the public-domain ones;
     - fewer than forty are approved by 2 November: Stet slips a week at a time.
   - **Line:** each game's `since` in new `src/games/<id>/rules.ts`.
5. **May the site count a finished game.** See item 7: yes, through Umami, not Vercel custom events. `game_finished` carries the game, the number and the streak bucket.

### Tools

1. **Where the tools live.** See item 4. Tools is a Desk drawer at `/tools/<slug>`, with one registry and its rows grouped under "To make" and "To check". About's phrase "the small things" leads there once Sky ships (Music, About and Notes, 4).
2. **Licence.**
   - **The code.** An MIT `LICENSE` at the repository root.
   - **Everything else.** A `NOTICE` says the words are all rights reserved: notes, the finds' captions and letter, and Urchi's likeness (`src/engine/urchi/mesh.json`, `suit.json` and the `urchi/` assets). The fonts keep their OFL.
   - **Exported code** (Cues' module, Tone's reader, the favicon snippet) carries a two-line header: "MIT. From eigengrau by Darius Tan, `<file>` at `<commit>`."
   - **What a tool makes from the visitor's own input** (their word's sky, their photograph dithered) is theirs, with no licence line.
   - **An export that shows Urchi** says "Urchi is not free to reuse." in its colophon line.
   - **Links to source files** are commit permalinks, not `main`, so they do not rot.

   - **Why:** MIT is the licence people already know how to honour, and the header travels with the snippet.
   - **Changes if:** he wants snippets free of attribution. Then MIT-0, one word in the header.
   - **Line:** `LICENSE` (new).
3. **Should skies be frozen.** Yes, as already decided.
   - `sky/versions.ts` freezes the tuned `defaults.ts` as version one in the Sky tool's first commit (week 4), before Sky's first link.
   - Space always draws the newest version, and a word link carries its version (`v=1`).
   - Until then, `?sky=` is a development knob and promises nothing.

   - **Why:** the sky layers are still arriving (the stars landed at `9b8c07c` today), so freezing now would freeze a sky half built.
   - **Changes if:** a `?sky=` link is shared publicly before week 4. Freeze at that commit.
   - **Line:** new `src/engine/space/sky/versions.ts`.
4. **His Last.fm key, for strangers.** No, as already decided. A week reads ListenBrainz only, through the week route (`?from=lb`), because `connect-src 'self'` blocks the browser from calling it. It has no previews, and its covers go through minted ids.

   **"Only on demand"** is defined here for every tool on the later list: a tool is built only when the one before it in the queue (Sky, then Grain, Cues or Tone, then Settle, then A week, then That night) has `tool_export` events on at least twenty of its first thirty days, or when three different people write asking for it.
   - **Line:** new `QUEUE` in `src/tools/index.ts`.
5. **That night.** Later, and only on demand as defined above, after A week. Version one has no planets and no SVG. `geolocation=(self)` joins `Permissions-Policy` in the same commit as "Here".
   - **Changes if:** the demand rule is met.
   - **Line:** its place in `QUEUE`.

**Also settled here, by "defensive only":**
- **"A token, opened"** decodes and explains a JWT on the page and never tries a secret. The summary's "local weak-secret check" is cut.
- **"Headers, read"** reads pasted headers or this site's own, and never fetches a URL on a visitor's behalf, because that would make it a proxy.
- **"A certificate, unfolded"** reads what it is given.
- **Each security tool** still needs its full spec in the Tools frame before it is built, from December.

### Strategy

1. **The one true line, and who it is for; the degree; LinkedIn.** See item 3: the draft `WORK_LINE`; the screener first and the security manager second; lenses led by AI, security and design; Swinburne with the details empty until confirmed (the lint fails from Monday 16 November); no LinkedIn.
2. **Desk third or sixth.** See item 4.
3. **Private work: which appear, their activity, push times.** See item 5: all eight, untitled, activity as one monthly total, and push times for public repositories only.
4. **Where he is.** See item 1.
5. **How plainly to say Claude Code.** See item 8: once, first, on `/colophon`.

**Also settled here:**
- **The brief.** It is half delivered (fact 1). The rest is the week-1 months branch (Engineering, 5).
- **Paper three** is "The notes Action, and the injection it does not have", not a CTF write-up. It is defensive, it comes from a real diff, and it costs him no CTF hours.
  - **Changes if:** he finishes a CTF or a lab he wants to write up. It becomes paper four.
- **All three papers** are drafted from the real diffs and approved by him. The byline is his.

### Music, About and Notes

1. **May a note name what was playing.** Yes, with yes as the default.
   - **This week:** the capture goes into `scripts/add-note.mjs` (about an hour). `at` is written in his zone, replacing the machine-zone `localDay` (`add-note.mjs:203`), which also fixes the date. The notes Action does the same. Log lines never carry a song.
   - **`/kept`** lists it.
   - **Why:** his listening is already public on Last.fm and on Music. Only the moment is new, and it can be captured only at the moment of writing.
   - **Changes if:** over a month he answers no more often than yes. The default then becomes no.
   - **Line:** the prompt's default in `add-note.mjs`.
2. **Listen in.** Yes, in week 8.
   - **How it plays.** Only with sound on, only thirty seconds of each song through the signed preview route, and never on its own.
   - **Whose data.** It reads his own now-playing through the route Music already polls, so his key still serves only his data. At his night it works the same.
   - **Changes if:** previews start failing under rate limits. Listen in is then paused before anything else.
   - **Line:** `LISTEN_IN` in new `src/lib/listenIn.ts`.
3. **His hours for "Where the days meet".** `WORK_HOURS = { from: 9, to: 18, days: [1, 2, 3, 4, 5] }`, public, and listed on `/kept` under what the site gives away about him.
   - **Why:** a recruiter ten to nineteen hours away needs a time, and the line prints the hours, so its assumption shows.
   - **Changes if:** his timetable differs.
   - **Line:** new `WORK_HOURS` in `site.ts`.
4. **The three phrases.**
   - **"Quiet interfaces"** leads to Projects. Its gloss comes from `projectsLine()`.
   - **"notice"** leads to Notes until the first paper (Sunday 1 November): "What he noticed, in notes. Two so far." After that it leads to the Security drawer: "Noticing is most of security. One paper so far."
   - **"the small things"** leads to the Tools drawer once Sky ships in week 4, and is unlinked before that.
   - **The full stop** stays the finds'.
   - **The content lint** checks that each phrase occurs exactly once in the statement.

   - **Why:** they are the three phrases with proof behind them.
   - **Changes if:** he rewrites the statement. A phrase that no longer occurs drops out, and the lint names it.
   - **Line:** new `GLOSSES` in `site.ts`.
5. **Later lines under old notes.** Nothing asks him to write them.
   - **Week 7:** only the `later` field, its rendering, and `npm run note -- --later <id>` (half a day). The script's anniversary prompt defaults to no.
   - **By Wednesday 1 September 2027:** the anniversaries and "Answered since your last visit", ahead of the first anniversary on 28 September 2027.

   - **Why:** the anniversary half cannot fire for a year, so it should not cost code this year.
   - **Changes if:** he writes three later lines before then. "Answered since" is built then.
   - **Line:** the anniversary prompt's default in `add-note.mjs`.
6. **Which three notes a stranger starts with.** The three papers, chosen automatically once there are twelve notes and three approved papers, which is expected in launch week. A `start: true` on any note overrides the rule.
   - **Why:** the stranger who gets "Three to start with." is usually the recruiter, the papers are the proof, and it costs him nothing.
   - **Changes if:** he marks three of his own.
   - **Line:** the `start` rule in `notes.ts` (`hasTag`, `notes.ts:185`).
