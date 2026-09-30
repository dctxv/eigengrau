## What only you can do

*For Darius. This is a producer's pass over the whole plan. It lists every task that needs your hands, your accounts or your voice, and what each one costs. It adds them up week by week, and it sets an order that keeps both launch dates on about six hours a week. The hours are honest estimates for doing each thing for the first time. Everything else in the report is work for the branches. Line numbers are from `9b8c07c`; where a file is cited on `main` (`0d9641d`), it says so. Nothing in the repository was changed. No new features are proposed here: only an order, a budget and rules for who writes what.*

---

### The short version

- **The plan as it stands asks about fifty-three hours of you over the nine weeks to launch, about 5.9 a week.** That fits only because decisions already taken removed about fifty more. Stet runs on public-domain prose, the papers start as drafts written from the diffs, paper three needs no CTF, and the finds ship with the words already written for them.
- **Your biggest cost is not writing.** It is briefing the branches and reading every merge, which `/colophon` will say you do. At a lean pace of about ten merges a week that is two hours a week, more than all your writing put together. At today's pace, about six merges a day, it is closer to four hours, and three more weeks go over eight hours.
- **One week breaks the budget: launch week, at a little over eight hours.** The launch device pass, the Show HN post, a launch night that starts at your midnight and the galleries all land in it. Paper three lands the Sunday before, 22 November, in what is probably an exam week. No week goes over fifteen.
- **The lean line keeps every week to about six hours, and weeks 7 and 8 (probably your exams) to four and a half or less.** It keeps both dates. What moves, in order:
  - the galleries, and Urchi's memory, go to the week after launch;
  - four features that no gate needs go to December;
  - notes drop to one a week in November;
  - Stet goes behind Plate, but only if its bank is still unapproved on 22 November.
- **Your voice is needed in five places only:**
  - `WORK_LINE`, when you rewrite it;
  - each `why`, and the sentence of each `did`;
  - your notes;
  - the last section of each paper;
  - a few Urchi lines.

  Everything else can be drafted for you. The one condition is that you read anything in your first person before it ships.

  *Ruled in the decisions: your voice is reserved for `WORK_LINE`, the `why` and `did` lines, your notes and a few Urchi lines, and papers start as drafts written from the diffs. The last section of each paper is the one place added here, because it carries your byline into interviews. In a week with no room for it, that section is drafted like the rest and you rewrite what is not yours (Cybersecurity §4), which brings a paper to about an hour.*
- **Do not read the whole report.** It is about 138,000 words, which is roughly two of your weeks. Read the summary's short version and this page. The branches read the rest.

---

## A. The budget

### Assumptions

- **Your time.** Six to ten hours a week, planned at six. Anything over six goes to more of your own writing, never to more features (see "If you have ten hours" below).
- **Merges.** "I wrote what each branch should do, and read every merge." is the decided wording for `/colophon`, so reading merges is in the budget.
  - At the lean pace there are about two merges a weekday. For each, you read the description, the test result, and the diff of anything under `src/content/` or in a hot-spot file. That is about ten minutes a merge.
  - Weeks 1 and 2 carry more merges, so they are budgeted at two and a half hours.
- **Exams: an assumption, not checked.** Swinburne's second semester teaches until about Sunday 1 November and assesses through November. Its 2026 calendar could not be opened from here to confirm the exam dates. So this plan treats weeks 5 to 8 (26 October to 22 November) as the weeks your coursework peaks, and keeps weeks 7 and 8 light.
  - **What would change it:** your real timetable. With no November exams, paper three and the Stet sitting move earlier, and nothing else changes.
- **Dates.** They follow the summary's Roadmap, with the two moves in `decisions.md`. Both moves follow the summary's own rule of four weeks' archive before the next game:
  - Stet No. 1 moves to Monday 9 November;
  - Plaintext moves to Monday 7 December.
- **The launch and paper three.** The launch post goes out in the week of 23 November. The launch check needs three approved papers. Paper three is published on Sunday 22 November, the day before launch week begins (Cybersecurity §4, and the summary's "three, by 23 November").
  - *Ruled in the summary and the Security section: paper three moved from Sunday 29 November to Sunday 22 November, so all three papers are out before the post. On the lean line its hours were already in weeks 7 and 8; in the plan as it stands they move from week 9 to week 8.*
- **The domain.** The standing decision is "before the public launch", and decisions.md, item 2, sets the date: by Friday 9 October. This plan keeps that date, in week 2, because the soft launch puts the address on your CV, and a printed CV cannot be relinked. It takes thirty minutes and the fee.
  - **What would change it:** if the fee does not fit that week, buy it in week 7 at the latest. The soft launch then goes out on the Vercel URL, which keeps working.
  - **HSTS preload** follows a month after the domain goes live: Monday 9 November, in week 7 (decisions.md, item 2, and T41). If the domain slips to week 7, preload moves to December.

### Every task

Two terms used in the tables:
- **"Claude drafts"**: a branch writes it, and you edit or approve it.
- **"Checklist"**: Claude writes the exact steps and values, and you carry them out in your own accounts.

**Standing, every week**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| S1 | Brief the branches and read every merge | 2 h a week (2.5 h in weeks 1-2) | Every week | Briefs: yes, from the report's sections. Reading: no. | The one sentence the site says about Claude Code is true only if you do this. |
| S2 | Two notes a week, plus the status line (`site.ts:27`) when it changes | 30 min | Three gates: 11 Oct (five notes); 1 Nov (two a week since the soft launch); the launch check (twelve notes and papers) | No | Notes are the one column where every word is yours (Part B). |
| S3 | Approve the week's log lines (`npm run log`) | 10 min, from week 3 | Week 3 | Yes: they are merge subjects, in the site's voice | Your approval is the guard against a subject not meant for strangers. Take no more than you wrote notes that week (Part B, rule 4). |
| S4 | Read the counts | 10 min, from week 3 | Plate's go-ahead; the finds' pacing review (23 Nov); the next game | No | A decided habit: once a week. |

**Setup, in your own accounts**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T1 | Setup one:<br>- `NEXT_PUBLIC_SITE_URL`, the Vercel production URL for now;<br>- `PREVIEW_SECRET`;<br>- the Vercel build command (lint, typecheck, Vitest, build);<br>- check `LASTFM_API_KEY` and `LASTFM_USER`;<br>- a ruleset on `main` blocking force-pushes and deletion;<br>- private vulnerability reporting | 30 min | Week 1. A production build fails without the URL, and the proxy fixes, moved into week 1, need the secret. | Checklist, plus the one command that makes the secret on your machine | A secret never passes through a chat or a file. |
| T2 | Setup two:<br>- an Umami Cloud account and `NEXT_PUBLIC_UMAMI_ID`;<br>- a private repository for the frozen puzzles;<br>- a fine-grained, read-only `TODAY_TOKEN`, with `TODAY_REPO` and `TODAY_SALT` | 30 min | Same Grey No. 1 (Monday 12 Oct), and the counts | Checklist | These are your accounts. |
| T3 | The domain:<br>- buy `decisions.md`'s first choice (`dariustan.dev`), or the first of its fallbacks that is free;<br>- point it at Vercel;<br>- switch `NEXT_PUBLIC_SITE_URL` to it | 30 min, plus the fee | Week 2, by Friday 9 October (decisions.md, item 2; the standing decision: before the launch) | Checklist, with the DNS records | The payment and the registrar are yours. |
| T4 | Setup three, the sync:<br>- `THREAD_TOKEN`, read-only;<br>- `SYNC_PRIVATE=all`;<br>- `SYNC_EXCLUDE`, typed straight into an Actions secret;<br>- check once that Vercel builds the bot's commit;<br>- a reminder a week before each token expires | 30 min | Week 3: the sync, the weave and the daily Action | Checklist. The private names: never. | No private name may appear in a chat, a file or a log (decisions.md, item 5). |
| T5 | Setup four: `PULSE_TOKEN` (Metadata only) and `PHOS_SECRET` | 15 min | Week 5: `/api/pulse` and Phosphenes | Checklist | These are your accounts. |
| T6 | The DNS light: paste the TXT value that `node scripts/phos.mjs print dns` prints | 5 min, then 5 min each season | Phosphenes, by Sunday 22 Nov at the latest (Cybersecurity §6) | Not applicable | The registrar is yours. |

**Repository hygiene, before any Source link**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T7 | Turn on secret scanning with push protection on all seven public repositories | 15 min | Every Source link (case page v2, week 1) | No | These are your settings, and this was decided to happen before any Source link. |
| T8 | gitleaks: read the report a session makes over each public history, and rotate anything real | 30 min, plus 30 min for each live secret | The same | Claude runs it and writes the summary | Only you can revoke your keys. |
| T9 | READMEs for VECTOR, NextBranch, Atelier and eigengrau; descriptions and topics for all seven | 1 h | The same. The sync shows a Source link only when a README and a description exist. | Yes. The facts come from each repository, and "My part" quotes your `did` word for word. | A README is documentation, not voice. |
| T10 | The MIT `LICENSE` and the `NOTICE` | 5 min | The first export (Sky, week 4) | Yes | Standard text, and decided. |
| T11 | The Career Hub: check the unit's rule on publishing, and tell the five teammates that their names are on the site (they already are, on `main`) | 15 min | Only its Source link | No | Their consent and the unit's rule are facts only you can get. |

**Your voice**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T12 | The facts about you: the degree and year for `EDUCATION`. The rest are decided and stand unless one is wrong: `WORK_LINE`'s working draft (yours to rewrite at any time), `WORK_HOURS` (9:00 to 18:00, Monday to Friday) and the city (Melbourne) | 15 min | Week 1 (the title, the cards, the JSON-LD). `EDUCATION` fails the lint from Monday 16 Nov. | No | Only you know them. The line is yours to rewrite, and nobody else polishes it. |
| T13 | `why` and `did` for the four projects on `main`: reread them, and rewrite any you did not write yourself | 15 min | The 11 Oct gate | The facts only: authors and commit shares from git, and the team list | "The voice is not data" (Strategy §3.2). |
| T14 | `why` and `did` for eigengrau and for Urchi | 30 min | The 11 Oct gate | The facts only | The same. Their covers are screenshots a branch takes. |
| T15 | Paper one: run the two confirm scripts on localhost, read the draft twice, and write section 8 and the Notes line | 3 h | Sunday 25 Oct, and the 1 Nov gate | Sections 1-7, from the diffs. Section 8 as bullet points only. | It carries your byline, and you must be able to explain it in an interview without the page. That is why this plan allows three hours, not the draft's two. |
| T16 | Paper two, done the same way | 3 h | Sunday 8 Nov | The same | The same. |
| T17 | Paper three, done the same way | 3 h | Approved and published Sunday 22 Nov, before the launch post (Cybersecurity §4) | The same | The same. |
| T18 | The note that is the ROT13 light | 10 min | Phosphenes, Sunday 1 Nov | No: it is a note | A light that is a note is still a note. |
| T19 | `/colophon`: the decided first line goes in as it stands; you write the one sentence on how the papers were made | 15 min | Week 5 | No | decisions.md, item 8. |
| T20 | The Show HN post and its first comment | 45 min | The public launch | A list of facts only | It is you introducing yourself, and readers there can tell. |
| T21 | Launch night: answer the comments for the first three hours | 2.5 h | The public launch | No | It starts at your midnight: that week, 08:00 in New York is 00:00 in Melbourne. |

**Your approval of drafts**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T22 | Plainly: check every fact and the two lens lines, print it from Safari and from Chrome, and open the PDF | 30 min | The soft launch (the link on your CV) | Yes | It is the site's voice wrapped round your facts. |
| T23 | `/kept`: "What it gives away about me", and the disclosure policy | 20 min | `/kept` v1, week 3 | Yes, marked as a draft until you have read it | It is in your first person, and every line is a fact about you. |
| T24 | The finds' captions: read them once. They ship as written; a line you would not say is replaced by one of yours later, without code | 20 min | The finds spine, week 4 | Already drafted, and decided to ship | They speak in your first person. Rewrites remain welcome later. |
| T25 | The Urchi case page and "Five visors": its summary | 15 min | Week 4 | Yes. The captions come from the commit times. | |
| T26 | Phosphenes: the hints, the hub's copy, and the Blink's word list | 20 min | Sunday 1 Nov | Yes | Cybersecurity §6 puts your whole share of season one at under an hour. |
| T27 | Stet: approve forty public-domain passages | 1.5 h | Monday 2 Nov (Stet No. 1 is Monday 9 Nov) | Yes, marked up and validated | decisions.md says an hour. Two minutes a passage is the honest figure. |
| T28 | Your GitHub profile: create `dctxv/dctxv`, pin six repositories, set the website field | 30 min | Week 5 | The README: yes | It is your account. |
| T29 | The soft launch: the link in your Instagram bio and on your CV | 20 min | Sunday 11 Oct | No | |
| T30 | The galleries: Godly and siteinspire first | 30 min | Launch week | The descriptions: yes | These are your accounts. |

**Judgement on real devices**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T31 | Urchi, package one: watch the before-and-after recording, then look at it on your phone | 15 min | Turning `lifelike` on in production (week 2) | Claude makes the recording | The decided numbers change if a blink reads as a twitch at 30 fps (decisions.md, item 6), and only a phone shows that. |
| T32 | Urchi reviews: lids and blinks (week 3), stroking and ears (week 5), sleep life at `?hour=3` (week 8), memory (week 9) | 10 min each | Each one's flag | Claude makes the recordings | |
| T33 | Device pass one:<br>- your phone's browser, all six tabs, sound on, the silent switch;<br>- the link opened from Instagram;<br>- your laptop in Chrome with hardware acceleration off;<br>- Plainly printed;<br>- Same Grey No. 1 played once | 1 h | The soft launch, and Same Grey No. 1 | No | Playwright cannot be a phone in a pocket. |
| T34 | Idle measurement: five minutes on Space, on your laptop (the Performance panel and energy use) and on your phone | 30 min | Whether the frame governor gets built (Engineering §7.1: measure first) | No | It needs real hardware. |
| T35 | The launch device pass:<br>- your phone, including ten minutes in the background;<br>- a borrowed phone of the other kind;<br>- the screen reader on every tab;<br>- Instagram again;<br>- print;<br>- no WebGL | 1.5 h | The launch gate | Claude covers Firefox, keyboard-only and reduced motion in Playwright | |
| T36 | Notes from the phone: install the GitHub app, and file one real note through the form | 10 min | Paper three's live confirm | No | Only your account can prove the owner guard works. |

**After the launch**

| # | Task | Time | Blocks | Claude drafts? | Why |
|---|---|---|---|---|---|
| T37 | Plaintext: approve four letters, "The name" and three public-domain weeks | 30 min | Monday 7 Dec | Yes. The solver breaks every day before anyone sees it. | |
| T38 | Stet: approve ten more passages a month | 20 min a month | From December | Yes | |
| T39 | Last login: play and approve eight incidents cold, and approve the casebook | 2 h 15 min once, then 15 min a week | Its first Saturday | Yes. The solver proves each one. | Fairness is a feeling a solver cannot check. |
| T40 | The security tools' three lines in your first person | 15 min | December | Yes | |
| T41 | The HSTS preload submission | 10 min | Monday 9 November, a month after the domain goes live in week 2 (decisions.md, item 2); December only if the domain slips to week 7 | Checklist | Decided: a month after the domain goes live. On `.dev` it is a formality, because browsers already force HTTPS for the whole TLD. |
| T42 | Renewals: the three tokens, and `security.txt`'s `Expires` (31 March 2027) | 15 min each | As each falls due; the lint warns thirty days ahead | Checklist | |
| T43 | Replies to "Seen in the dark", and any disclosure report | 2 min each | Ongoing from 1 Nov | No | People write to you. |

*Ruled in decisions.md, item 2: preload goes on Monday 9 November, not late December. T41 is listed here with the other one-off steps, but its ten minutes are counted in week 7 below.*

### Hours by week

The first column is the plan as it stands. The second is the same plan with merges read at today's pace (about six a day, five minutes each, so about four hours a week). The third is the lean line below.

| Week | Dates | The plan as it stands | At today's merge pace | The lean line |
|---|---|---|---|---|
| 1 | 30 Sep-4 Oct | 5.8 | 7.3 | 5.8 |
| 2 | 5-11 Oct | 6.6 | **8.1, over 8** | 6.1 |
| 3 | 12-18 Oct | 4.6 | 6.6 | 5.9 |
| 4 | 19-25 Oct | 6.4 | **8.4, over 8** | 6.1 |
| 5 | 26 Oct-1 Nov | 6.1 | **8.1, over 8** | 5.5 |
| 6 | 2-8 Nov | 5.8 | 7.8 | 6.1 |
| 7 | 9-15 Nov | 3.2 | 5.2 | 2.5 |
| 8 | 16-22 Nov | 6.0 | 8.0 | 4.5 |
| 9 | 23-29 Nov | **8.3, over 8** | **10.3, over 8** | 6.3 |
| **Total** | | **52.8** | **69.8** | **48.9** |

*Ruled in the summary, the Security section and decisions.md: paper three is published on Sunday 22 November, and HSTS preload goes on Monday 9 November. So the first two columns carry paper three's three hours in week 8, not in week 9 as the Roadmap's first draft had them, and all three columns carry the ten-minute preload in week 7.*

- **No week goes over fifteen hours** in any column.
- **Week 9 of the plan** is over eight because it holds three things at once, on top of the merges:
  - the launch device pass (1.5 h);
  - the post and launch night (3.25 h);
  - the galleries.
- **Week 8 of the plan** holds paper three (3 h), published on Sunday 22 November, before the post. When the Roadmap's first draft put it in week 9, launch week came to 11.3 hours.
- **Week 7 of the plan** is light by coincidence, not by design. Weeks 7 and 8 are also the weeks most likely to be exams.
- **What would change the lean line:**
  - a week of more than ten merges, which costs about ten minutes each;
  - a live secret found by gitleaks, which costs thirty minutes each.

### The lean line

**Its four rules**
1. **Merges are budgeted first,** with fewer and larger branches.
   - Normally about two merges a weekday.
   - Weeks 7 and 8: only what the launch needs, about six merges a week.
   - Launch week: fixes only. A feature freeze starts on Sunday 22 November (new).
2. **Your voice goes only where nothing else can go.**
3. **Setup goes early,** in weeks 1 to 3.
4. **The heavy hours** (the papers) go in the weeks before exams peak, and on the weekend after them.

**Week by week**

| Week | Hours | What you do |
|---|---|---|
| 1 | 5.8 | - Setup one; secret scanning; read the gitleaks report.<br>- READMEs for VECTOR and eigengrau, and all seven descriptions. NextBranch and Atelier wait for week 3; until then their case pages say "The Source link waits."<br>- The licence.<br>- The facts about you.<br>- `why` and `did` for all six projects (T13 and T14 together).<br>- Two notes. |
| 2 | 6.1 | - Setup two; the domain.<br>- Check Plainly.<br>- Watch Urchi's package one.<br>- Device pass one.<br>- **Soft launch, Sunday 11 October.**<br>- Two notes. |
| 3 | 5.9 | - Setup three.<br>- READMEs for NextBranch and Atelier.<br>- `/kept`'s first person.<br>- The finds' captions, read a week early (they are already written).<br>- The first twenty Stet passages.<br>- The idle measurement; the lids and blinks.<br>- Two notes; the first log lines and counts. |
| 4 | 6.1 | - **Paper one (Sunday 25 October).**<br>- The Urchi case page.<br>- Two notes. |
| 5 | 5.5 | - Setup four, and the DNS light if the domain resolves.<br>- The ROT13 note.<br>- The paper sentence on `/colophon`.<br>- The Phosphenes copy.<br>- The other twenty Stet passages, so all forty are in by Sunday 1 November.<br>- Your GitHub profile.<br>- Notes from the phone, brought forward from week 7 (new), so November's notes can come from your pocket.<br>- Stroking and ears.<br>- Two notes. |
| 6 | 6.1 | - **Paper two (Sunday 8 November).**<br>- The Career Hub check.<br>- Two notes. |
| 7 | 2.5 | - Paper three's confirm steps: the three commands on localhost, and one real note through the Action.<br>- The HSTS preload submission, Monday 9 November (ten minutes).<br>- One note.<br>- About six merges. |
| 8 | 4.5 | - Paper three's reading and section 8, on the weekend of 21-22 November. It is published on Sunday the 22nd.<br>- Sleep life at `?hour=3`, on your phone.<br>- One note. |
| 9 | 6.3 | - The launch device pass, Monday 23 November.<br>- **The Show HN post, Tuesday 24 November at 08:00 in New York**, which is midnight in Melbourne and ahead of Thanksgiving on the 26th.<br>- Launch night.<br>- One note.<br>- Fixes only. |
| 10 | 4.0 | - The galleries.<br>- Urchi's memory and persona, reviewed and shipped.<br>- Plaintext's four letters, approved for Monday 7 December. |

**What slips, and in what order.** The first item goes first.
1. **Everything after launch that needs you.** Each one has a working default.
   - Last login's first Saturday becomes 9 January 2027, with eight incidents approved over the summer break.
   - The security tools' lines, the capsule lines, `npm run leave`, and any rewrite of the letter.
2. **The galleries, and Urchi's memory and persona, move to week 10.** Neither is a launch gate, and launch week should ship nothing new.
3. **Work no gate needs moves to December:**
   - Grain;
   - "He is working";
   - moods and habituation (Urchi's "it gets used to you"; *ruled in the summary: the shooting star's own repeats rule is not this one, and it stays with the one crossing event and `witness` act in week 4, because on shower nights it is essential*);
   - the ThreadScene layout extraction;
   - Phosphenes' two extra lights (the gate is six).

   Finds phase 2 also pauses in weeks 7 and 8. This is what brings those two weeks down to about six merges each.
4. **Notes drop from two a week to one in weeks 7 to 9.** The 1 November gate is met by then. The launch check needs twelve notes and papers, and this line reaches twenty.
5. **Some links and checks move:** NextBranch's and Atelier's Source links to week 3, and the Career Hub check to week 6.
6. **Stet.** Its sitting is split into twenty passages in week 3 and twenty in week 5.
   - If forty are not approved by Sunday 1 November, Stet slips a week at a time, as decided.
   - If they are still not approved by Sunday 22 November, **Stet goes behind Plate.** Plate costs you no writing and waits only for Same Grey's counts. Stet follows once its bank is approved, and Plaintext comes four weeks after whichever game shipped second.
   - *Ruled in the summary: no new game until the last one has four weeks of archive and the counts show people coming back, and Plate waits for counts (decisions.md, Daily games 4). This fallback keeps both rules. It bends the summary's order (Plate once the first three have players) only while Stet's bank is unapproved, and forty approved passages restore that order.*
7. **Paper three's three hours go in week 7 or week 8,** whichever your exams leave open. If neither does, they go on Monday 23 and Tuesday 24 November, paper three is published on Tuesday the 24th instead of Sunday the 22nd, and the post moves from Tuesday to Wednesday 25 November, US morning, still before Thanksgiving. The launch check still sees three approved papers before the post.
8. **The domain.** Week 2, or week 7 at the latest.
9. **Only then the launch date,** and only for a failed hard gate: headers, placeholders, no WebGL, Plainly or cards. None of those needs more of your hours.

**What never slips:**
- T1 to T5;
- the hygiene before any Source link;
- both device passes;
- at least one note a week;
- running every paper's confirm steps yourself.

**If you have ten hours.** Spend the extra four on your voice, in this order:
1. a third note each week;
2. your own Stet paragraphs, through "Lend this to Stet?" in `npm run note` (decisions.md);
3. one Plaintext letter of your own;
4. your own `CAPSULE_LINES`.

Do not spend them on features.

### What you no longer have to decide or write

Together these saved about fifty hours before launch, which is the whole budget a second time.

| What | Where it was settled | What it would have cost you before launch | What would reopen it |
|---|---|---|---|
| The eight questions of 29 September: zone, domain deadline, `WORK_LINE`, the Desk, private work, Urchi's face, counts, Claude Code | The decisions already made; decisions.md, items 1-8 | About three hours of thinking, with weeks 1 and 2 waiting on your answers | You rewrite any of them. Each has its one line. |
| Stet from twenty of your paragraphs, then two a week | decisions.md (Daily games, 4) | About fifteen hours by 2 November, then an hour and a half every week | You write paragraphs anyway. They go in first. |
| Papers from a blank page | decisions.md (Strategy); Cybersecurity §4 | About five more hours a paper, fifteen in all | |
| A CTF to write up for paper three | decisions.md (Strategy) | A weekend of CTF and a write-up, about twelve hours | You finish one you want to write up. It becomes paper four. |
| The finds' lines, the capsule and the seven-line letter | decisions.md (Space finds, 2) | About two hours, and the finds waiting on you | Your rewrites replace them without code. |
| Which private repositories to show, one by one | decisions.md, item 5 | Eight judgements, and one more for every new repository | A repository turns out to be someone else's work. |
| Plaintext's later letters, and Last login's thirty incidents | Daily games §4 and §6, and Part B | About two hours before 7 December, and about twenty-two over Last login's first thirty weeks | |
| An analytics vendor, and what it counts | decisions.md, item 7 | An hour of reading | Umami's free tier ends. |
| Later lines under old notes, the three notes a stranger starts with, the song kept with a note, `WORK_HOURS`, the three phrases | decisions.md (Music, About and Notes) | Small, but each one was a question waiting on you | You mark notes `start: true`, write later lines, or answer no at the prompt. |
| The licence, frozen skies, Last.fm for strangers, That night, the phone nav, the eye accent, the monospace, gifts as copies, the gems' colour, pacing, wreck days | The decisions already made; decisions.md | None of these can hold up a week now | Each section's "changes if". |

---

## B. Drafting rules

**The rule in one line: Claude may draft what can be checked. You write what can only be meant.**
- A fact is checked by a source, a solver, a test or a lint.
- A reason, a feeling, a judgement, or an account of your own part can only be meant, so it starts as your words.

### Must start as your words

| Text | Why | What Claude may do |
|---|---|---|
| `WORK_LINE`, once you rewrite it | It is the one line a screener reads. The working draft stays until you replace it. Nobody polishes it for you. | Check its length and troika's glyph range. Nothing else. |
| `why`, one for each project | "The voice is not data" (Strategy §3.2). It is about seventy characters (`site.ts:114`). | Count the characters. |
| The sentence of each `did` | Credit on a team project reads either as honesty or as a red flag (Strategy §3.11). This rule is ten minutes stricter than decisions.md's `draft: true` lines, because the decisions keep `did` for your voice. | Gather the facts (authors, commit shares, the team list) and hand them to you as a list, not as a sentence. |
| Notes, all of them:<br>- the two a week;<br>- the ROT13 light;<br>- a note lent to Stet;<br>- the Notes line of each paper | Notes are the one place a reader may assume every word is yours. That is what lets `/colophon` say the rest in one sentence. | The prompts in Part C, and nothing after that. Never fix your capitals or punctuation: the content lint only warns on note bodies (Engineering §3.4), and your notes are lowercase and cheerful (Tools, "Cut"), which is the point. |
| Section 8 of each paper, "What I would tell the developer" | It is the paragraph an interviewer will quote back to you. | Bullet points of what the fix teaches. The paragraph is yours. In a week with no room for it, the Security section's way applies instead: Claude drafts the paragraph and you rewrite what is not yours (Cybersecurity §4). |
| A few Urchi lines: new `URCHI_LINES`, `CAPSULE_LINES`, and the captions for `npm run leave` | Captions are your first person about the creature (`site.ts:53-56`). These are the ones nobody else can know. | Check the 48-character limit and that there is no exclamation mark, and suggest a reaction. |
| Anything spoken to people:<br>- the `/colophon` sentence on the papers;<br>- the Show HN post;<br>- your replies on launch night;<br>- anything addressed to a person (teammates, "Seen in the dark", a disclosure report) | It is you, speaking to people. | A list of facts for the post. Nothing else. |

### Claude drafts, you edit

| Text | What keeps the draft honest | Your part | How it is marked |
|---|---|---|---|
| Papers, sections 1-7 | They are written from the real diffs, tests and reproduction scripts. Papers never say who found a finding (Cybersecurity §4). | Run every confirm step yourself, and read the draft twice. | `approved: true` (decisions.md, item 3). The launch check counts only approved papers. |
| Stet's public-domain passages | Each is pre-1900 and names its source ("Faraday, 1861."). The swaps are checked by `scripts/today.ts`, run under `tsx` (the summary's ruling: one runner, Vitest, and scripts under `tsx`). Old facts never carry a `qy`. | Read each for tone. | `npm run today` refuses passages you have not approved (decisions.md). |
| Plaintext's letters: "The name" and the public-domain weeks | The solver breaks every day before anyone sees it (Daily games §4). | Read the seven lines as a letter. | Approval in the bank. |
| Last login's incidents and casebook | `solve.ts` proves there is one answer and that every note is needed (Daily games §6). The cast is fixed. The casebook defines public attack patterns, with their ATT&CK IDs. | Play each incident cold before approving it. A solver can prove the answer is unique, not that it is fair. | Approval in the bank. |
| READMEs, descriptions and topics, and the GitHub profile README | The facts come from each repository. "My part" quotes your `did` word for word. | Read, and merge. | Nothing needed. |
| `/kept`'s "What it gives away about me", and the disclosure policy | Every line is a checkable fact about you: your zone, your sleep hours, your listening, your handle. | Check each fact for accuracy. What is published was decided (decisions.md, items 1, 6 and 7, and Music, About and Notes 3), so a wrong fact is corrected, not reopened. | `draft: true` until you have read it, the same flag `did` uses. |
| The finds' captions and the letter | They were decided to ship as written. The lint enforces 48 characters. | One read. A line you would not say is replaced by one of yours later, without code (decisions.md, Space finds 2). | As for `/kept`. |
| The security tools' three first-person lines, Phosphenes' hints and hub, and Plainly's lens lines | Each one explains something checkable. | Read. | As for `/kept`. |
| Test fixtures: the notes Action's issue, Same Grey's frozen days, the certificate and token fixtures | Nothing in them is anyone's voice. | Nothing. | Not needed. |

### The site's own voice, drafted freely

These can be written by the branches without asking you:
- captions in grotesk;
- log lines (third person, from merge subjects, approved at S3);
- labels;
- the copy for the tools and the Desk;
- the key sheet and the 404;
- `/kept`'s read-back of the headers;
- the colophon's facts.

The house rules and the content lint hold them in place, and you see them when you read the merge.

### How this stays true to `/colophon`

1. **The sentence is budgeted first.** S1 is the largest line in Part A.
2. **First person means read by you.** Anything in your first person that Claude drafts ships only after you have read it. It goes through the markers the plan already has (`draft: true`, `approved: true`, and Stet's approval), so no new mechanism is needed.
3. **Notes are never drafted.** So the colophon needs one sentence, not a disclaimer on every page.
4. **The log never outnumbers you (new).**
   - Once log lines join `ENTRIES` (Strategy §7.1 changes `src/lib/notes.ts:9`), Notes' heading counts every tag, log lines included. It puts `site` last only among equals (`notes.ts:47-60`, the sort at `:59`).
   - With a log line a day against two notes a week, the heading would read "Mostly about the site." (`notes.ts:297`).
   - So at S3, approve no more log lines in a week than you wrote notes, and say no to the rest.
   - **What would change it:** a week in which you wrote more.
5. **Papers say once, on `/colophon`, how they were made** (decisions.md, item 8), in your own sentence. It should say three things: they began as drafts written from the diffs, you ran every check yourself, and the last section of each is yours.
6. **The same words everywhere.** The first comment under the Show HN post, and any interview answer, use the colophon's words.
7. **Drafts do not imitate you.** Claude writes drafts in the site's plain register, never in your note voice, so your edits stay visible as yours.
8. **Two things stay as decided.** Nothing drafted names a private repository, and the commit trailers stay as they are.

---

## C. Note prompts

These are prompts, not drafts. Each one names the moment it belongs to and a fact worth checking. Write them the way you write: lowercase is fine, and short is fine. `npm run note` offers every category below. A note you tag `site` is yours, and the column calls it "about the site" (`notes.ts:67`). It is not the same thing as a log line.

### random
1. **The chrome thing.**
   - Before Urchi, Space held a raymarched chrome object. Urchi took its place at 01:50 on 25 September, your time (`abc5315`; still the 24th in UTC), and it survives only as a find: "Chrome, from whatever lived here before it."
   - What was it, and why did it go? *Week 4, with the finds spine.*
2. **Threshold.**
   - A daily game was built, then removed on 28 September ("Space: Threshold goes", `fe41606`).
   - What was wrong with it, and what does Same Grey do differently? *Week 3, the week Same Grey No. 1 goes out.*
3. **The lost hour.** Melbourne's clocks go forward on Sunday 4 October, and Urchi's night moves with them. What did you do with the hour? *Week 1.*
4. **Your own name, for a fee.** Which names were taken, and what it is like to own the one you got. *Week 2, with the domain.*
5. **The Orionids.**
   - They peak around Wednesday 21 October.
   - Go outside after midnight, while Urchi sleeps, and write what you actually saw from Melbourne. *Week 4.*
6. **The real desk.** The site has a Desk now. What is on yours? *Week 2 or 3, when the pill appears.*
7. **Once a year.** The burrito comes back as a find every 28 September. What else from this year should the site remember once a year? *Any week.*

### music
1. **What was on.** From this week, `npm run note` keeps the song that was playing (decisions.md). What was on for the first note, and did you say yes? *Week 1.*
2. **The worst colour.** The room takes the colour of the record you play (`6ef61b4`). Which record made it the worst colour? *Any week.*
3. **The small hours.**
   - When you play something at night, Urchi wakes and stays up (Music, About and Notes, "What I checked").
   - What were you playing the last time it did? *Week 3.*
4. **Five notes.** Every sound on the site is in F, G, A, C and D, and off until someone asks. Why those notes, and why off? *Week 5, with `/colophon`.*
5. **The pluck.**
   - A project's mark will sound by how long it ran: D4 under a month, down to F3 at three years.
   - Which of yours will be the first to reach F3? *With the months on the thread.*
6. **Below the speaker.**
   - The purr has to be heard on phone speakers, which roll off far above where a purr lives (decisions.md, Urchi 5).
   - Which song of yours only works on good speakers? *Week 5, with stroking.*

### tech
1. **Five visors.**
   - Thick rim (`4703066`), slim rim, six points, no rim, then the thin rim again (`4be495d`).
   - The review says four of them came in one morning. In Melbourne it was one evening, 19:52 to 22:32 on 28 September.
   - Why did the thin rim come back? *Week 4, with the Urchi case page.*
2. **Seven megabytes a frame.**
   - Urchi is painted on the CPU, then uploaded as a texture of about 7 MB nearly every frame (Engineering §7.1).
   - What did your laptop and your phone actually say? *Week 3, after the measurement.*
3. **Fifteen in one year.**
   - Real projects broke the thread: 1.1 turns, every pluck the same D4, and a heading that would have said "15 projects".
   - What does a floor of nine turns say about a young career? *Week 1.*
4. **How the tab blinks.**
   - The favicon's shut lids are painted eight times finer, then thinned to one pixel (`LiveIcon.tsx:119`). It runs on a timer, not on animation frames (`:53`).
   - The tools review asked for exactly this note. *Any week.*
5. **Application error.** Without WebGL, the whole site was a white error page. What does it show now, and who were you building that for? *Week 2, with lights off.*
6. **Nothing behind the curtain.** Every tab stays loaded, yet Notes, with three WebGL tabs behind it, draws nothing. What did that take? *Any week.*
7. **WOFF, not WOFF2.**
   - troika and the card renderer cannot read WOFF2, so the site carries both.
   - Write about the smallest constraint that cost you the most time this month. *Week 4.*

### ai
1. **Seven of 136.**
   - Seven of the first 136 commits are yours, and they are the only ones stamped +10:00.
   - What does "I wrote what each branch should do, and read every merge." look like in an ordinary week? *Week 5, with `/colophon`.*
2. **Three days.** NextBranch's line says it was built in three days. What did three days of building with agents teach you that a term of coursework did not? *Any week.*
3. **No chatbot.** The site will never have an "ask the site" box (the summary, "What I would not push on"). Why not, from someone who builds AI tools? *Any week.*
4. **The last section.** Paper one began as a draft from the diffs. What did you change, and what did you refuse to sign? *Week 5, the week after paper one.*
5. **On your own machine.** Atelier's line is "My own workshop for talking to any model, on my own machine." What do you actually use it for? *Any week.*
6. **Tuned for Bangladesh.** The Career Hub's resume review is tuned to how hiring works in Bangladesh. What did a general model get wrong before it was tuned? *Any week.*
7. **Two voices.** The site has a house voice, and your notes do not follow it. Which one is you, and who wrote the other? *Any week.*

### cybersec
1. **Anyone's song proxy.**
   - The site would fetch from any port on two CDN domains, and search and stream any song for anyone.
   - How did it feel to read that about your own site? *Week 4, the day paper one goes out, and only once the fix is live.*
2. **F, then.** On 29 September the site had no security headers, and the graders gave it an F. What does `curl -I` say now? *Week 3, once the headers are live.*
3. **The sentence that would not draw.** Under a strict policy, troika's blob workers can blank About without a single report reaching the page. *Week 6, with paper two.*
4. **What the scanners found.**
   - Secret scanning and gitleaks, over seven public histories: what turned up, or what you expected to turn up.
   - *Week 1 or 2, and only after anything found has been rotated. Never name a private repository.*
5. **What it gives away.** Your zone, your sleep, your listening, your handle. Which one did you hesitate over? *Week 3, with `/kept`.*
6. **When to say it.**
   - The review of this site sat on a public branch before its fixes shipped (decisions.md, fact 2).
   - When should a finding about your own work be public? *Week 3, after the proxy fixes are live.*
7. **The owner guard.** Notes from your phone, and the injection they do not have. *Week 8, with paper three (Sunday 22 November).*
8. **Eve.** Last login's cast has an Eve, and she has never once been the one. Why is Eve in every example? *December, with Last login.*

### existential
1. **Who it is for at 3 am.**
   - Urchi sleeps from 01:00 to 06:59 your time, and the launch audience arrives while it sleeps (decisions.md, fact 5).
   - Who is the site for then? *Week 8, with sleep life.*
2. **01:33.**
   - Your one hand-made Urchi commit was at 01:33 on 25 September (`1dd87df`), inside the hours it now sleeps. The thread will say "He should have been asleep."
   - What were you doing awake? *Week 5, with the thread alive.*
3. **Dead is your word.** The sync never calls a project dead; it asks. Which of yours is dead, and will you say so? *Week 3, with the sync.*
4. **Closed.** Eight of your fifteen repositories are closed marks: "Closed. Ask and I will show you." What would you show first, and why, without naming it? A note never names a closed repository (decisions.md, item 5). *Week 3.*
5. **Most gifts are.** A gift from the drawer is a copy: "It is a copy. Most gifts are." Is that true? *When gifts ship.*
6. **Eigengrau.** It is the grey you see with your eyes shut. What do you see? *Any week.*
7. **Launch night.** You posted at your midnight so that it landed on an American morning. Write about it the day after. *Week 9.*

### psychology
1. **A moment late.** Urchi now notices a new thing about 160 ms late, and that delay is what makes it look alive. Why does late read as alive? *Week 2, with package one.*
2. **The slow blink.**
   - Cats answer a slow blink with a slow blink, as a 2020 study in *Scientific Reports* showed. Urchi has one too.
   - Have you ever tried it on a cat? *Week 3, with lids and blinks.*
3. **Company.** Same Grey is about how the eye makes up a grey from whatever sits beside it. What else do you only see by the company it keeps? *Week 3, with No. 1.*
4. **Leave it alone.** Finds come from waiting, never from clicking, and nothing is labelled rare. Why a reward for patience, and not a slot machine? *Week 4, with the finds spine.*
5. **Streaks.** They are computed, never stored, and nobody is told off for breaking one. Have you ever kept going only for the number? *Week 3 or 4.*
6. **The first touch.** A stranger who wakes Urchi at night now gets a groggy look, not a glare. Why should a first impression be soft? *Week 2 or 8.*
7. **Remembered.** Urchi will remember you, but only in your browser. What should a thing remember about a person, and what should it forget? *Week 10, with memory.*

### sport
1. **Under a hundred milliseconds.** A sprinter who reacts in under 0.1 seconds is called for a false start. Urchi reacts in about 160 ms, on purpose. What is the fastest you have ever reacted to anything? *Week 2.*
2. **Eyes first.**
   - Good batters look to where the ball will bounce before it gets there (Land and McLeod, 2000). Urchi's eyes now lead its head.
   - Where do your eyes go first, in the sport you play or watch? *Week 2.*
3. **The race that stops a nation.** The Melbourne Cup is on Tuesday 3 November, a holiday where you are. Did you stop? *Week 6.*
4. **The longest streak.** Same Grey keeps a streak and never shames you for losing it. What is the longest streak you have kept at anything: training, a team, a habit? *Week 4.*
5. **The thin stretch.** The thread is thicker in the weeks you worked. If your training had a thread, where is the thin part, and why? *Week 5, with the thread alive.*
6. **The wrong time zone.**
   - Watching from Melbourne means kick-offs at dawn.
   - The site does the reverse: its day starts at your midnight, on someone else's morning. *Week 1 or 3.*
7. **Enough.** Stroking has a limit: Urchi purrs, then has had enough. Write about rest days. *Week 5, with stroking.*

### site
1. **Your midnight.** A puzzle turns over at your midnight, which is an American morning. Why yours, and not the visitor's? *Week 3, when Same Grey No. 1 goes out.*
2. **Basic Human.** It stays on screen, beside the true line. Why keep the joke? *Week 1.*
3. **Third.** The Desk went in third, not last. Why does the order read as a sentence? *Week 2.*
4. **The soft launch.** Who did you send it to first, and what did they say? *Week 2 or 3.*
5. **Three things.** The site counts a finished game, a find taken and a tool export, and nothing else. What do you want to know, and what do you not? *Week 3.*
6. **Fiction since 2021.** The thread held six invented projects dated 2021 to 2025. What was it like to replace them with real ones, all from this year? *Week 1.*
7. **What you cut.** The second Urchi, the guestbook, the leaderboards, the chatbot. Which cut hurt? *Week 7.*

### Two a week, on the lean line

| Week | Prompts |
|---|---|
| 1 | "Fifteen in one year" (tech); "The lost hour" (random) |
| 2 | "A moment late" (psychology); "The soft launch" (site) |
| 3 | "Your midnight" (site); "F, then" (cybersec) |
| 4 | "Five visors" (tech); "The Orionids" (random). Paper one's Notes line is written as part of T15. |
| 5 | "Seven of 136" (ai); "01:33" (existential) |
| 6 | "The race that stops a nation" (sport); "Leave it alone" (psychology). Paper two's Notes line is written as part of T16. |
| 7 | One note: "The small hours" (music) |
| 8 | One note: "Who it is for at 3 am" (existential). Paper three's Notes line is written as part of T17, for Sunday 22 November. |
| 9 | One note: "Launch night" (existential), the day after. |

---

### Decisions

*You are asked nothing. This section never had a list of open questions; the lines below are the decisions it depends on or makes, one line each with its reason. Items merged into `decisions.md` point there, and each says what would change it.*

1. **Where you are: `Australia/Melbourne`, southern hemisphere** (decisions.md, item 1). Every date here is your day; Melbourne moves to +11:00 on Sunday 4 October, so the post at 08:00 in New York on Tuesday 24 November lands at your midnight. Why: your commits carry +10:00 and your public coursework is a Swinburne unit. Changes if: you move city.
2. **The budget is six hours a week, and the lean line keeps it** (new). Anything over six goes to your own writing, never to features. Why: the plan as it stands asks about fifty-three hours, and only merges, setup and your voice need you. Changes if: a week of more than ten merges, or a live secret from gitleaks.
3. **Exams are assumed in weeks 5 to 8, so weeks 7 and 8 stay light** (new). Why: Swinburne's second semester teaches until about 1 November and assesses through November. Changes if: your real timetable shows no November exams; then paper three and the Stet sitting move earlier.
4. **The domain is bought by Friday 9 October, and HSTS preload goes on Monday 9 November** (decisions.md, item 2). Why: the soft launch prints the address on your CV, and preload waits a month on the real domain. Changes if: the fee does not fit week 2; then the domain comes in week 7 at the latest and preload in December.
5. **Papers are published on 25 October, 8 November and 22 November, drafted from the diffs and approved by you** (decisions.md, Strategy; Cybersecurity §4). Paper three is the notes Action, not a CTF. Why: the launch check needs three approved papers before the post. Changes if: the week-7 or week-8 hours do not come; then paper three is published on Tuesday 24 November and the post moves to Wednesday 25 November.
6. **Your voice goes in five places only: `WORK_LINE`, `why` and `did`, notes, each paper's last section, and a few Urchi lines** (decisions already made, plus the papers' last section). Why: a reason or an account of your own part can only be meant, and everything checkable can be drafted. Changes if: a week has no room for a paper's last section; then it is drafted and you rewrite what is not yours.
7. **Anything in your first person ships only after you have read it, through the markers the plan already has** (`draft: true`, `approved: true`, Stet's approval). Why: it is what keeps `/colophon`'s one sentence true. Changes if: nothing; it is the condition for drafting at all.
8. **Claude Code is said once, first, on `/colophon`, and reading merges is budgeted first (S1)** (decisions.md, item 8). Why: "I wrote what each branch should do, and read every merge." is true only if the hours exist. Changes if: an application asks directly; you answer there in the same words.
9. **No private repository is named in any note, draft, chat, file or log** (decisions.md, item 5). The note prompt "Closed." asks what you would show first without naming it, and `SYNC_EXCLUDE` is typed straight into a secret. Why: nothing of theirs reaches the site but an untitled mark and a monthly total. Changes if: nothing.
10. **The log never outnumbers you** (new). At S3 you approve no more log lines in a week than you wrote notes. Why: otherwise Notes' heading would read "Mostly about the site." Changes if: a week in which you wrote more.
11. **A feature freeze starts on Sunday 22 November, and launch week ships fixes only** (new). The galleries and Urchi's memory and persona move to week 10. Why: neither is a launch gate, and launch night starts at your midnight. Changes if: nothing short of a failed hard gate.
12. **Stet's forty passages are approved in two sittings of twenty, in weeks 3 and 5** (decisions.md, Daily games 4). Stet No. 1 is Monday 9 November; it slips a week at a time after 1 November, and goes behind Plate if the bank is still unapproved on 22 November (new). Why: two minutes a passage is the honest figure, and Plate needs none of your writing. Changes if: you write Stet paragraphs of your own; they go in first.
13. **The finds' captions ship as written, after one read** (decisions.md, Space finds 2). Why: they were decided to ship, and they are in your first person. Changes if: you write your own lines; they replace these without code.
14. **What `/kept` says you give away is decided, and you read it only for accuracy** (decisions.md, items 1, 6 and 7, and Music, About and Notes 3). Why: the zone, the hours, the listening and the handle were each chosen already. Changes if: a fact is wrong; it is corrected, not reopened.
15. **The counts are read once a week, from week 3** (decisions.md, item 7). Why: Plate's go-ahead, the finds' pacing review on 23 November and the next game all wait on them. Changes if: Umami's free tier ends.
16. **Nothing here asks you to write or approve anything that forges, bypasses or exploits** (decisions already made: defensive only). The security tools' three first-person lines are for tools that decode and explain. Why: every finding in the papers is about your own site, confirmed on localhost. Changes if: nothing.
