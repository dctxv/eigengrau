# eigengrau: review and ideas (29 September 2026)

*For Darius. Specialists working in parallel wrote proposals for seven areas. A reviewer then checked each one line by line against the repository at `9b8c07c`, and cut, corrected and merged them. Nothing in the repository was changed. This first part is mine, as the lead. It says what matters most, decides where new things live, sets the order of work, and settles the places where the specialists disagreed. The seven reviewed sections follow it in full, in this order: **Urchi: making it feel alive**, **Style and UX**, **State of the project and engineering**, **Space: Urchi's finds**, **Daily games**, **Free tools**, and **Strategy, structure and GitHub projects**.*

*One gap, stated plainly. The security specialist's draft stopped partway: its tools, papers and plan were never written, so no Security section follows. Everything decided about security is gathered in this part, under "What I'd push on even more" (bet three) and "Where the new things live", and each piece names the section that specifies it.*

---

## The short version

- **Keep the style. The gaps are around it, not in it.** The site uses two colours, one glass and one radius, a serif for your voice and a grotesk for the site's, motion that behaves like objects, synthesised sound that waits to be asked, and a creature with real attention. The engineering underneath is cleaner than most production code. Nothing in this report asks it to look more like other portfolios. What is missing sits around the style: who made it, what he made, whether it survives a locked-down laptop, and whether it holds up to the scrutiny a security reader will give it.
- **Do this today: give the session adding your GitHub projects the brief in Strategy §1.** All fifteen repositories were created in 2026, and the thread places projects by whole years. With real data the ball unwinds to about 1.1 turns, every pluck is the same D4, the heading reads "15 projects since 2026", and the intro's ring of twelve thins to however many real images there are. The brief costs little inside that branch and a lot after it: take out every placeholder together, add `start`/`end` months, wind at least nine turns, place marks by date, use `countWord`, write months in `statusWord`, keep private repositories closed, and give each project a `did` line.
- **Fill in four placeholders this week:** `TIME_ZONE` (with a new `HEMISPHERE`), `SITE_URL`, and the email and GitHub links in `site.ts`. Urchi's sleep, the daily game's midnight, the link cards, the canonicals and `security.txt` all wait on them. Know what the zone means: if you are on Melbourne or Sydney time, Urchi's 01:00-06:59 falls on roughly 10:00-16:00 in New York (09:00-15:00 after 1 November) and on the London afternoon and evening. Many overseas visitors will meet it asleep, so its sleep life comes early, not last.
- **Three launch blockers.**
  - Without WebGL the site shows "Application error". `error.tsx` would not catch it; a boundary round each panel would, with a lights-off view. Urchi is Canvas 2D underneath, so it can keep breathing in that view.
  - There are no security headers, and two proxies are wider open than they should be, on a site meant to show security skill.
  - Your name is gone from the screen after four seconds (on a phone it never appears), and a shared link has no card.
- **Serve the reader who has a minute.**
  - A true work line (`WORK_LINE`) in the title, the cards and on screen. "Basic Human" stays, as the joke beside it.
  - **Plainly** (`/plainly`): one page that prints to A4, with a PDF.
  - Case pages that say what you did, with what, and when.

  Urchi is why people will remember you. Plainly is why they can shortlist you.
- **Everything new goes behind one sixth pill, "Desk", placed third:** Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6. The Desk has three drawers, Today (the daily games), Tools and Security, each at its own path. Urchi never comes to the Desk. Finds stay on Space.
- **Urchi first: make it look, not follow.** Ship four changes together behind a `lifelike` flag, in two or three days:
  - it notices a new thing about 160 ms late;
  - small head turns are quick and big ones slow;
  - the eyes lead a turn and settle back as the head arrives;
  - it glances aside near you before it ever looks off to a corner.

  Then, in order: lids that follow the eyes and blinks that stop keeping time; stroking and a blink reflex; ears and a bristle; sleep; memory.
- **Space finds: yes, and the design is strong.**
  - Left alone afloat, Urchi asks with a look and swims off on a paying-out line. It shrinks into the room's own pixels and comes back one-armed, holding a bolt it thinks is gold.
  - You carry it on a short thread across the tabs, and can leave it as the full stop on About.
  - Rarity is acted, never labelled. Outings come from waiting, never from clicking. No number ever appears.
- **Daily games, with no Urchi in them:**
  - **Same Grey** first: match a grey against company that lies about it. Monday 12 October.
  - **Stet** second: proofread a paragraph. 2 November.
  - **Plaintext** third: a weekly letter, one cipher a day, Caesar on Monday to XOR on Sunday. 23 November.
  - **Plate** (Chladni sand figures) is the flagship, once the first three have players. **Last login** is a hand-written Saturday incident.
  - Shares are plain text: no emoji grids, no timers, no shaming for a lost streak.
- **Tools that leave with the visitor.**
  - **Sky** first: any word draws its own night sky, to take away as a lock screen.
  - Then **Grain** (the dither Urchi leaves through, for any picture), **Cues** (interface sounds in one key) and **Tone**.
  - Every tool page says what it has asked of the network since it opened, and a test keeps that line true.
- **Security, shown as noticing.** Harden the site first. Then read its headers back in public on `/kept`, and write three short papers about your own fixes. Then the play: Plaintext, Last login and Phosphenes (lights hidden in the site's own layers). For this reader a security gap is worse than having no security content at all, so the proof comes before the playground.
- **How to work.**
  - A `CLAUDE.md` of house rules for the parallel branches.
  - One test runner.
  - A content lint that fails the build while placeholders remain.
  - Launch gates by date, not more polish: soft launch on Sunday 11 October, public launch in the week of 23 November.

---

## State of the project

### The style it is in

eigengrau is dark, literary minimalism with something like a toy at its centre. It feels more like an object on a desk than a website: a paperweight, a music box, a notebook.

- **Colour and material.** Two colours: the ground `#16161d` and its exact inverse, ink `#e9e9e2` (14.76:1). One grey glass, one 4px radius, one 8px gutter.
- **Two typefaces, two jobs.** Newsreader is your voice. Inter Tight is the site's. Each heading pairs them, a grotesk word and then a serif sentence, like a table of contents written as prose: **Work** *Six projects since 2021. Two alive.*
- **Motion behaves like objects.** Springs, a tether, a magnet, a thread wound into a ball.
- **Sound.** Synthesised in one pentatonic key, and off until asked.
- **Rewards are hidden,** for "people who notice".

It is nothing like the usual developer portfolio, and that is its value. The screenshots bear it out: Urchi alone on eigengrau with five pills above it, the thread ball under a single sentence, and About as three lines of serif with a tiny Urchi after the full stop.

The style needs **more legibility, not more style**:
- quiet text lifted to AA, and a cursor label that reads over coloured eyes;
- a focus ring that belongs to the character;
- a name for each digit;
- phone targets that pass;
- tokens for type and spacing;
- a proper display cut of Newsreader for the 64px statement.

The bold moves worth making are the day's eye colour as the one accent, in three small places, and a monospace that arrives only with machine text. All of this is in **Style and UX**.

### What is already excellent

| Strength | Evidence |
|---|---|
| A coherent design language, written down | README as a living spec; two colours, one glass, one radius, two faces with two jobs |
| A voice that holds everywhere | No exclamation marks, counts in words, sentences for labels, commit subjects good enough to publish |
| A character with a real attention model | `attention.ts`, `acts.ts`, `Faces.ts`, `Call.ts`, `Float.ts`, `Tether.ts`: salience, boredom, acts with priorities, a rhythm call and response, a swim, a line that snaps |
| Honest lifecycle | Every scene has a `dispose()`. Sitting on Notes with three WebGL tabs kept behind it costs **0 draw calls and about 4 ms of script a second** |
| Engineering hygiene | Strict TypeScript, clean lint and typecheck, six runtime dependencies, `npm audit` clean, every storage access guarded, proxies that pin their hosts and never leak the Last.fm key |
| Accessibility intent | `sr-only` mirrors in the canvas order, `inert` hidden panels, Urchi as a real `<button>`, reduced motion designed rather than switched off |
| Knobs that make testing possible | `?still`, `?hour=`, `?sky=`, `?col=`, `?debug=1`, `/dev/suit` |
| Pace | 136 commits and about 25k lines in five days, built with parallel Claude Code branches |

### What is placeholder

- The six projects and every image in `public/work` (being replaced now).
- Two notes ("i got a free burrito heh", "hi"). The `cybersec` category is empty.
- `SITE_URL` (`https://eigengrau.example`), `TIME_ZONE` (`null`), the email and GitHub links (`TODO(darius)`), and `UPDATED`.
- The only role on the site is "Basic Human". It is also the page `<title>` and the JSON-LD `jobTitle`.
- About's status line, which is the one sentence on the site without a full stop.

### What is at risk, most urgent first

1. **Real projects break the thread.** The ball drops to about 1.1 turns, every pluck is D4, and `numberWord` prints "15 projects" (it stops at twelve). The intro ring shrinks to however many real images exist. *Strategy §1, §3.*
2. **No WebGL, no site.** Corporate laptops with acceleration disabled by policy, VMs and blocklisted GPUs all get the white "Application error". No error boundary exists anywhere, and the planned `error.tsx` sits below Shell. *Engineering §1.1.*
3. **A security site that fails its own first check.**
   - There are no headers, so securityheaders.com and the Observatory give an F.
   - `/api/cover` will fetch from any port on two CDN domains and follows redirects.
   - `/api/preview` searches and streams any song for anyone.
   - `/api/now` has no timeout and no CDN cache, and it reports an outage as a quiet week.
   - *Engineering §3.1-3.2.*
4. **Nobody is named.** The name appears for about four seconds on desktop and never on a phone. Links unfurl as a bare grey title on a placeholder domain. *Style R1-R2, Strategy §4.1.*
5. **Phones are second-class.**
   - The sound chip is hidden at 1024px and below, so a third of the craft is unreachable.
   - Pill centres are 23px apart, which fails WCAG 2.5.8.
   - The intro takes about seven seconds on every hard load, with no skip. That is exactly where Instagram's in-app browser loses people.
   - *Style R4, R9, R12.*
6. **Promises the chrome does not keep.** The digits on the pills do nothing (pressing 4 on Notes starts a search). Quiet text falls to 2.28:1. The cursor label over a blue eye is 1.17:1. *Style R3, R7, R13.*
7. **Parallel branches with no written rules, no tests and no CI.** Three files are where every feature would collide:
   - `ThreadScene.ts`, 5,291 lines;
   - one 680-line effect in `CreativeSpacePanel.tsx`;
   - `globals.css`, 1,486 lines.

   *Engineering §2, §3.4, §6.*
8. **Polish crowding out content.** 51 of 108 non-merge commits are Space, Urchi or Suit. The visor went through five versions, four of them in one morning. The site has one superb character and very few words from you. *Strategy §14.3.*
9. **Space may be costly at idle.** Urchi is painted on the CPU and uploaded as a texture of about 7 MB nearly every frame. Measure on a real MacBook and iPhone before building a frame governor. *Engineering §7.1.*

---

## What I'd push on even more

The thesis already exists, half built: **a clock of one person.**
- Urchi keeps your hours.
- The room takes the colour of the record you are playing.
- Notes are your voice.
- The thread can become the record of your pushes.
- The sky can be your hemisphere's.

None of these signals can be faked or copied, because they are your actual life. A visitor at 02:14 your time should feel they have walked into a flat where someone is asleep and the record has only just stopped. Five bets push this all the way. They are listed in the order I would fund them.

### Bet one: "It remembers you" (Urchi alive, then finds)

**Why.** Urchi is why anyone will remember the site. The realism work is only worth what a visitor can see, so spend it in this order:

1. **The first five seconds at home.** Every visitor sees them. Today the head *tracks* the pointer, which contradicts the site's own words, "attention, not tracking". Fix it first with the latency, head speed, eyes-first and aversion package (**Urchi**, §2).
2. **Lids and blinks.** The blink interval today is a metronome. Replace it with log-normal intervals, add lids that follow the eyes, and add microsleeps at half past midnight.
3. **Touch.** Stroking, with a purr and a limit, and a blink reflex when something flies at its face. Stroking is the first thing anyone does to a cat, and nothing answers it today.
4. **Ears and a bristle.** They change the silhouette, which is the one read that survives at phone size.
5. **Sleep life.** Dreams (a flicker of iris colour between closed lids), and settling on its pillow. This is promoted because of the time zone.
6. **Memory,** kept only in the browser: recognition, the rhythm you taught it, a persona per visitor.

Do not spend on detail inside the eyes while it is afloat. At the default zoom the eyes are about 30px across, and the pupils travel ±1.5px. Afloat, life comes from the head, the body and the limbs (**Urchi**, §0.1).

**Finds come after the first three steps.** They are your own idea, and they put the site's philosophy into a mechanic: **you get things by leaving it alone.** Build the spine first:
- the outing;
- the bolt, presented the proud way;
- `Carried.tsx`;
- About's full stop.

That proves every hard part (depth, the line, the glove anchor, the painter, carrying across kept tabs) in three or four days (**Space finds**, "If you only do one thing").

**My one addition: a softer first wake.** Because of the time zone, many first visits will land at your night. Today a click wakes Urchi and it glares. Make the first wake of the night, per browser, a groggy one: heavy lids, a slow blink, and the yawn (M1) once it exists. Keep the glare for a second wake the same night. A stranger's first touch should not be told off.

**What it shows.** You know the difference between tracking and attention, and you can build it from the perceptual literature. You also direct a character with restraint.

### Bet two: "The thread is true" (Projects from GitHub)

**Why.** No other projects page updates itself from the work its owner actually did.
- GitHub knows *when*; `projects.ts` knows *why*.
- Marks sit at their month.
- The thread is thicker where you worked.
- Its loose end stirs for two days after a push. The hover reads "Wound on at 2:14. He should have been asleep."
- Private repositories appear as closed marks, with "Closed. Ask and I will show you." Nothing of theirs reaches the public repository, not even their names.
- Urchi and eigengrau go on the thread as projects themselves. Urchi's best piece row is **"Five visors"**, which turns the polishing into a case study.

**The one caution.** A "Source" link is a promise. Before any case page links a repository, turn on secret scanning with push protection, run `gitleaks` over the history, and give it a real README and description. A security reader will follow the link, and what they find there *is* the portfolio (**Strategy** §3.12).

### Bet three: "Kept" (security, shown as noticing)

**Why.** The site's thesis is people who notice, and in security, reconnaissance *is* noticing. The order matters: **proof, then reading it back, then papers, then play.** A capture-the-flag on a site that grades F would undo itself.

| Layer | What | When | Specified in |
|---|---|---|---|
| **Proof** | Static headers. A CSP in Report-Only, then a nonce policy enforced after a clean week. HSTS without `preload` until the domain has been lived on for a month. `/api/preview` serving only songs the site signed, redirects followed one hop and re-checked. `/api/cover` taking only image types, with `nosniff`, a sandbox CSP, timeouts and a cached 404. `security.txt`, robots and sitemap. JSON-LD escaped before GitHub text reaches it. The 404 echoing only a sanitised path, so nobody can make the site say their sentence. The notes-from-phone Action guarded on `author_association == 'OWNER'`, with the issue body passed only through `env:` (no script injection). Secret scanning and `gitleaks` before any Source link. | weeks 2-3 | Engineering §3.1-3.2, §9; Style R8; Strategy §7.2, §3.12 |
| **Reading it back** | `/kept`, "How this site is kept". It reads back the headers your browser was just given, one sentence each. It lists where the server may go, with the tests that prove each fence. It gives a threat model per API route, "what it gives away about me" (your time zone, sleep, listening and handle, stated and chosen), a disclosure policy, a Thanks list, and provenance: "Built 29 September at 16:52 from 9b8c07c. Forty-one tests passed before it was allowed out." | week 3 | Strategy §6.1; Engineering §11.1 |
| **Papers** | Three, by 23 November, each ending with "what I would tell the developer". (1) "How this site stopped being anyone's song proxy": the constrained SSRF on `/api/cover`, the open search-and-stream on `/api/preview`, and the fixes. (2) "A CSP for a three.js site whose text renderer builds its workers from `blob:` URLs". (3) A CTF or lab write-up, or the notes Action and the injection it does not have. They live at `/security/<slug>` and in Notes as `cybersec` entries. | weeks 4-9 | Strategy §2.2, §5.8 |
| **Play** | **Plaintext:** real cryptanalysis (frequency fits, the index of coincidence, the XOR case trick), every day verified by a solver, with week one's answer the site's own name. **Last login:** a weekly incident, "Someone else was here today", with a casebook of MITRE ATT&CK IDs. **Phosphenes:** lights hidden in the site's layers, six in season one (the robots line, the console, a favicon that blinks a word in Morse, a ROT13 note, a header on the ambient bed, a DNS TXT record). Checked by PBKDF2 digests, with the flags generated at build and git-ignored, and "Seen in the dark" instead of a leaderboard. Also the very rare find "A tag, the letters shifted", and the forged-gift check: "A forgery. It can tell." | weeks 5-9, then seasons | Daily games §4, §6; Strategy §6.2; Space finds §10, §2.9 |
| **Tools to check with** | Every tool page's live network line is already a small security demonstration. Security tools come later and share the Tools frame: "Headers, read" (paste any response's headers, or read this site's; it shares its grader with `/kept`), "A token, opened" (a JWT decoder with a local weak-secret check; the token never leaves the page), and "A certificate, unfolded" (PEM and X.509 through its own DER walker). **They were drafted but not reviewed, so each needs a full spec in the Free tools frame before it is built.** | from December | Free tools (frame and privacy line) |
| **Code you can run** | Demos that execute code live at `/lab/<demo>`: each is its own document with its own CSP, framed with `sandbox="allow-scripts"` and no `allow-same-origin`. Anything that runs code a visitor pastes goes on a separate origin. | only after all of the above | Engineering §5.3 |

**What it shows.** Recon, web security, cryptography, incident reasoning and threat modelling, as part of the site's personality rather than a list of badges. It also shows the rarer skill of explaining security in plain sentences.

### Bet four: "New at midnight here" (one daily game, done superbly)

**Why.** A daily game is the only thing on the list that brings someone back tomorrow. One excellent game beats five. Same Grey goes first because it is the site's own argument as a game: the eye invents greys in the dark, and here it invents them in the light. It needs no writing and no WebGL, and it proves the frame:
- the day in your zone;
- puzzles made ahead, frozen, and served only on their day;
- one record per game;
- streaks computed, never stored;
- plain-text shares with a preview image.

Stet then makes your writing the supply. It needs two paragraphs a week, and those paragraphs become Notes content. Plaintext is the security piece a technical reviewer can actually play. **The rule:** no new game until the last one has four weeks of archive and the counts show people coming back.

### Bet five: "It travels" (everything that leaves carries the site)

**Why.** Most people meet a portfolio as a link, not an address. Every artefact that leaves the site should carry it without a logo:
- the link cards, with your name and `WORK_LINE` beside Urchi;
- a Sky lock screen;
- a gift link that unfurls as the find itself, "Quartz, smoky.";
- a plain-text Same Grey result;
- Urchi on your GitHub profile, awake or asleep by your hours;
- Plainly's PDF in an applicant tracking system.

Each one is small. Together they are how the site reaches the people who would never type its address.

### From outside your shoes

**Strategy** §2 walks through seven readers. Five facts stand out:

1. **A recruiter** on a managed laptop may have WebGL off, and gives you thirty seconds with forty other tabs open.
2. **A graduate screener,** if you are finishing a degree (a public coursework repository suggests you are), wants a PDF, a degree and a date.
3. **A security manager** runs `curl -I` before reading a word.
4. **A friend** opens your link in Instagram's in-app browser: held upright, with audio restricted and five seconds of patience.
5. **An overseas visitor** at 3 am your time meets a sleeping creature.

Every item in the priorities below answers one of them.

### What I would not push on

- **A Cmd-K palette as the first key feature.** It is the most copied pattern on developer portfolios. The `?` key sheet comes first. Go comes later, opened by typing a letter anywhere, which is Notes' own habit taken site-wide.
- **An LLM "ask the site" chat.** It is generic and off-voice, it costs money, and it is an injection surface.
- **Leaderboards, public visit counters, a guestbook, a newsletter or live presence.** They are empty or need moderation on a site this size.
- **The cut ideas, for the reasons their sections give:** the second Urchi, the Survey, Fairly Sure, Eight Lamps, Slack, Quieter, Tab and Facets.

---

## Where the new things live

### The decision

**One sixth pill, "Desk", third in the row: Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6.**

- **Why one pill.** Three new tabs would give eight pills, which crowd a phone bar. A hidden room or unlinked routes hide the features from exactly the three audiences they are for. A pill is the only thing a daily player finds again without thinking.
- **Why "Desk".** It is the only name that holds a puzzle, instruments and papers without a joke. The alternatives fail: Lab (every portfolio has one), Play (makes security look like a toy), Today (goes stale for tools), Bench (tools only).
- **Why third.** The slide runs sideways through the row, so the order reads as a sentence: what he made, what you can use, what he says, what he hears, who he is. The public half comes first. A recruiter goes from Projects to the Security drawer in one slide. The intro still blows the work into the "2".
- **Why decide now.** No digit is a key yet and nothing has launched, so renumbering is free today and costly later.
- **The mechanics** are in **Strategy** §5.5 and **Engineering** §4.5:
  - `tabOf` (the kept panel that renders a path; opt-in `owns`) and `pillOf` (the pill that lights, so a case page lights Projects);
  - the four hooks the first draft missed: sfx's room sound, Space's look back at the tab you left, `pillAt` by `data-tab`, and a Desk pill that remembers the last drawer.

### The map

| Place | Path | Pill | Rendered by | Notes |
|---|---|---|---|---|
| Space | `/` | 1 | kept panel | Urchi's room. Finds; the drawer is a dialog opened from the pocket; a gift arrives at `/?find=<code>` |
| Projects | `/projects`, `/projects#slug` | 2 | kept panel | The thread |
| A project | `/projects/<slug>` | 2, lit with `aria-current="true"` | own page | Case page v2 (Strategy §3.10, Style R5) |
| Desk | `/desk` | 3 | kept panel, owns `/today`, `/tools`, `/security` | The shelf. Up and down means the same tab; sideways means another tab |
| Today | `/today`, `/today/<game>`, `/today/<game>/<n>` | 3 | Desk drawer | Paths, not queries, so each puzzle has its own card. Numbers count from each game's own first day |
| Tools | `/tools`, `/tools/<slug>` | 3 | Desk drawer | Settings in the query; anything personal after the `#` |
| Security | `/security`, `/security/<paper>` | 3 | Desk drawer | Papers, then links to `/kept`, Plaintext, Last login's casebook and, last, Phosphenes |
| Notes | `/notes`, `/notes/feed.xml` | 4 | kept panel | Notes, papers (`kind: "paper"`) and approved log lines |
| Music | `/music` | 5 | kept panel | |
| About | `/about` | 6 | kept panel | Foot: Elsewhere, then a quieter line of the site's own pages (below) |
| Plainly | `/plainly`, `/plainly/security`, `/plainly/design` | none | own page | Prints to one A4 page. `public/darius-tan-cv.pdf` is built by a local script |
| How it is kept | `/kept` | none | own page | `security.txt`'s `Policy:` points here |
| How it is made | `/colophon` | none | own page | Holds the switches: sound, and single-key shortcuts |
| Phosphenes | `/phosphenes` | none | own page | `Disallow`ed in `robots.txt`, and that line is the first light |
| A gift | `/f/<code>` | none | own page, then `location.replace("/?find=<code>")` | Metadata from the code; a share image later |
| Demos | `/lab/<demo>` | none | own document, own CSP | Later, and only if built |

**New API routes:** `/api/today` and `/api/today/[game]/[n]` (the day and its frozen puzzle, served only from its day on), `/api/pulse` (the last push, cached ten minutes), `/api/urchi.png` (for your GitHub profile), `/api/beacon` (errors and web vitals), and later `/api/week/[user]`.

**Development only:** `/dev/suit`, `/dev/urchi`, `/dev/finds`, `/dev/tools`, `?debug=1` (sky), `?debug=urchi`, `?outing=now`, `?flat`, and `?day=` (refused in production).

### Keys

| Key | Where | What it does |
|---|---|---|
| `1`-`6` | anywhere, unless a text field has focus, or a game board or Notes' search has claimed digits | Goes to that tab. During the intro it hurries the intro instead |
| `?` | anywhere, unless typing | The key sheet |
| Esc | inside the Desk; dialogs | Up one level: board, then drawer, then shelf |
| Letters | inside a tool only | That tool's keys (`o` open, `s` take, `l` link, `r` roll, `[` `]`, `\`) |
| Cmd/Ctrl-K | later | Go |

- **One listener.** `src/lib/keys.ts` is a single capture-phase listener with a claim stack. The capture phase is what fixes the Notes ordering bug.
- **An off switch.** Single-character shortcuts can be turned off on `/colophon` (`eigengrau:keys`), as WCAG 2.1.4 requires.
- **One knock-on in the finds section.** "Press 5 while carrying" there now means About's new key, 6.

### Who owns what

- **Space is Urchi's.** Urchi also appears as About's mark, the favicon, the lights-off view, the 404 (later) and your GitHub profile image.
- **The Desk is yours, and Urchi never comes to it.** It is not in the games (your own instinct, and the right one), not in the tools and not in the papers.
- **The other tabs.** Projects is the record. Notes is your voice. Music is the room. About is the man.

### The conflicts, reconciled

1. **The cipher.** Plaintext is the one cipher game. It lives in Today, and the Security drawer lists it and Last login's casebook under "to play".
   - The very rare find "A tag, the letters shifted" stays a find. Its drawer label offers "Copy the letters" and, once Plaintext exists, a link to that week's Thursday strips (a Vigenère tool), rather than a separate cipher tool.
   - Phosphenes stays a hunt that runs in seasons, not a daily. Its ROT13 light is a Notes entry.
   - No cipher appears in Tools.
2. **Tools and security tools.** There is one registry (`src/tools/index.ts`), one frame and one privacy line.
   - The Tools index groups its rows under "To make" and "To check". Security tools sit under "To check" at `/tools/<slug>`.
   - `/security` is for reading: papers, and pointers to `/kept`, the games and Phosphenes.
3. **Finds, carrying, and the Desk.**
   - **What is carried.** The carried find is the visitor's object, drawn by `Carried.tsx` in Shell.
   - **Where it goes.** It travels with the slide to Projects, Notes, Music and About. It can be left as About's full stop and, later, at the foot of Notes; the 404 notices it.
   - **On the Desk it goes into the pocket at once, and never hangs under the pointer.** The boards own the pointer there, and Same Grey is literally a test of what sits beside a grey.
   - **The pocket's place.** It takes the top-right corner the sound chip gives up when the chip moves into the nav (Style R4), on every screen size. It exists only after your first take.
   - **The drawer** is a dialog, not a route, with no `D` key.
4. **Urchi and the Desk pill.**
   - Urchi never announces the daily puzzle. A "new" every day would make the look mean nothing, and the games stay Urchi-free. This overrules Strategy's "Today's is out.".
   - `UPDATED.desk` moves only when a new game, tool or paper lands. Then Urchi looks up at the Desk pill once, as it already does for notes.
   - The Today drawer's own heading does the daily telling.
5. **One trust, one seed.**
   - Trust lives once, in `eigengrau:urchi`, using the model in Urchi §12.1. The finds' events (the keeps trade, giving a find back, taking a reverent one, a snapped line) feed that one value; there is no second store.
   - The browser's seed lives there too. The finds derive their code salt from it.
6. **The eyes stay per page load.** The persona fixes temperament only. Three features lean on the per-load draw: the eye accent (Style R15), the Colophon's hundred eyes, and the finds' labels ("Its eyes were denim.").
7. **One shooting-star event.** Three sections need a shooting star:
   - Urchi's "It saw it too" (§15);
   - the finds' "star that fell" (§4);
   - the sky calendar's meteor showers (Strategy §10).

   Build one crossing event from `Stars` and one `witness` act, with the Urchi section's habituation. On shower nights stars cross every 5-11 seconds, so the habituation is essential, not optional.
8. **About's foot: two lines.**
   - First, Elsewhere: GitHub, Instagram, Email. It stays off-site only.
   - Second, quieter, in grotesk at 60%: "Plainly. How it is kept. How it is made."
   - The status line gets its full stop, and `WORK_LINE` sits under it. "Small tools" is linked only if those words are in your line.
9. **The 404.** Style R8's layout and sanitised path, with the six tabs as words plus "Colophon". Add the finds' clause when you are carrying something: "Nothing here. Except a bolt."
10. **The link cards.** They use `WORK_LINE`, not "Basic Human" (Strategy §4.1 over Style R1). Urchi is shown in the denim colourway. Canonicals are set per route, never on the root layout.

### Shared foundations (build once)

**Modules**
- `src/lib/random.ts`: one PRNG and hash, frozen by a golden test. Not `src/lib/seed.ts`, because `sky/seed.ts` already means visit seeds.
- `src/lib/day.ts`: your day, falling back to UTC, never to the visitor's day. It keeps `notes.ts`'s `localDay` as `visitorDay()`.
- `src/lib/store.ts`: `keep()`, versioned, guarded, and kept in step across browser tabs.
- `src/lib/keys.ts`.
- `src/lib/routes.ts`: `tabOf` and `pillOf`. sfx's own `tabOf` becomes `pillOf`.
- `src/engine/space/Space.ts`: extracted from `CreativeSpacePanel`'s effect before finds.
- `src/engine/finds/`: kept out of `engine/space`, because the chrome and About use it too.
- `src/games/<id>/{rules,Board,share}` and `src/tools/<slug>/{meta,logic,Tool}`.
- `src/content/`: `projects.ts`, `github.json`, `finds.ts`, `log.json` and `today/`.

**New storage keys.** Each one goes into the README's list and onto `/kept`:
- `eigengrau:urchi` and `eigengrau:finds`;
- `eigengrau:today:<game>`;
- `eigengrau:bench:<slug>`;
- `eigengrau:keys` and `eigengrau:phos`;
- `eigengrau:week`, a cached Music week for outages;
- `eigengrau:eyes-seen`.

The five existing keys stay as they are.

---

## Priorities

Impact runs from 1 to 5. Effort: S is up to a day, M is 2-4 days, L is 1-2 weeks.

| # | Item | Area | Impact | Effort | Why now | Depends on |
|---|---|---|---|---|---|---|
| 1 | The brief to the GitHub-projects session: placeholders out together, `start`/`end` months, at least nine turns placed by date, `countWord`, months in `statusWord`, closed private repos, `did` lines, real images for the ring | Strategy §1 | 5 | S-M | The branch is running today. After it merges, the fix is a second pass over 5.3k lines | nothing |
| 2 | Fill in the placeholders: `TIME_ZONE`, `HEMISPHERE`, `SITE_URL` (a literal, or from the environment with a production throw), email, GitHub | Engineering §1.2 | 5 | S | Sleep, the games' midnight, cards, canonicals and `security.txt` all wait on them | your answers |
| 3 | Lights off: a `PanelBoundary` round each panel; flat Space (a live 2D Urchi), flat Projects and flat About; `error.tsx` and `global-error.tsx`; an `--disable-webgl` test | Engineering §1.1 | 5 | S-M | Recruiters on locked-down laptops get "Application error" | nothing |
| 4 | Your name on screen (the monogram unfolds, the name on phones, an About byline); `WORK_LINE` in the title and JSON-LD; link cards for the site, projects and notes; icons | Style R1-R2; Strategy §4.1, §4.3 | 5 | M | Most people's first sight of the site is a link preview | 2, your `WORK_LINE` |
| 5 | Security, first slice: headers, CSP in Report-Only, the three proxies fixed, `/api/now` timeouts, cache and an honest outage, `security.txt`, `robots.ts`, `sitemap.ts` | Engineering §3.1-3.3 | 5 | M | An F grade on a site meant to show security skill | 2 |
| 6 | House rules and the net: `CLAUDE.md`, `npm run check`, Vitest with the day-one kit (content lint, proxy host tests, `countWord` goldens), tests in the Vercel build command | Engineering §2, §3.4 | 4 | M | Parallel branches are about to multiply, and nothing checks them | nothing |
| 7 | Case page v2 (title first, his part, made with, how long, the strip, links), the GitHub sync with its weave and daily Action, and Source hygiene per repo | Strategy §3.4-3.12; Style R5 | 5 | M | Real work presented as real work; the thread becomes true | 1 |
| 8 | Urchi, package one: latency, head speed by amplitude, eyes first, near aversions; the favicon's blinks | Urchi §1-2, §16.3 | 5 | S-M | What every visitor meets in the first five seconds; it touches Urchi's own files and one line of `RoomScene.ts` | `random.ts` |
| 9 | Keys and numbering: Desk third, `keys.ts`, digits 1-6, `pillOf` (a case page lights Projects), the `?` sheet | Style R3; Strategy §5.2-5.5 | 3 | S | Renumbering is free only until the digits work | the numbering decision |
| 10 | Plainly, with print, a PDF and a security lens | Strategy §4.2 | 4 | M | A recruiter's thirty seconds, and a graduate screener's file | 1, 4 |
| 11 | Sound on every screen: the chip moves into the nav, has a fixed name, and uses `audioSession` for previews; phone targets of 24px or more | Style R4, R9 | 3 | S-M | A third of the craft is unreachable on phones and tablets | nothing |
| 12 | Foundations: `random.ts`, `day.ts`, `store.ts`, `tabOf`, and `Space.ts` extracted | Engineering §4, §6 | 4 | M | Games, finds, tools and memory all plug into these | 2 |
| 13 | The Desk frame and the Today drawer, with Same Grey (400 days frozen and validated) | Daily games §1-2; Strategy §5 | 4 | M | A daily reason to come back. No. 1 at your midnight into Monday 12 October | 9, 12 |
| 14 | `/kept` with the live self-check; paper one; CSP enforced with nonces after a clean week | Strategy §6.1; Engineering §11.1 | 4 | M | Turns the hardening into proof anyone can check in thirty seconds | 5 |
| 15 | Finds, phase 1: the outing, six handovers, ten types, carrying, the pocket, the drawer, About's full stop, the spikes | Space finds §2 | 4 | L (the spine alone is 3-4 days) | Your own idea, and the site's philosophy as a mechanic | 8, 12 |
| 16 | Sky, the first tool: versioned skies, lock-screen exports, the hand-off to Urchi | Free tools §1 | 3 | M (plus the frame, 2 days) | The engine is already built, and it leaves with the visitor | 13 |
| 17 | Phosphenes, season one: the hub and six lights | Strategy §6.2 | 3 | M | Security as noticing, once the proof is in place | 5, 14 |

---

## Roadmap

The pace below assumes about twenty-five commits a day across parallel branches, which is what the log shows. It is an order more than a calendar: if a week slips, keep the order. Two branches never touch `ThreadScene.ts` or `CreativeSpacePanel.tsx` at the same time.

### Today, Tuesday 29 September

1. Paste the brief from **Strategy** §1 into the session adding your projects.
2. Answer the eight questions that unblock most of this. Each section's own questions can wait until its work starts.
   1. **Your time zone and hemisphere.** They set Urchi's sleep, the daily game's midnight and the meteor showers. The commits say +10:00.
   2. **The domain.** It sets `SITE_URL`, the cards, the canonicals, `security.txt` and when HSTS preload can go on.
   3. **`WORK_LINE`.** About eight words that say what you do. If you are finishing a degree, which one and when? LinkedIn, if any?
   4. **The Desk third,** renumbering Notes, Music and About. I recommend it.
   5. **Private work.** Which private repositories may appear as closed projects? May their weekly counts thicken the thread? May the site say when you push?
   6. **How much of Urchi's face may change.** The pupils' rest share, the blink's speed, a catchlight. Also, may it remember visitors across visits, in their browser only?
   7. **Counts.** May the site count a few moments (a finished puzzle, a snapped line) with no cookies and no identity? Without it you will never know whether anyone plays.
   8. **Claude Code.** How plainly should the site say it was built with it? My advice: one line on `/colophon`, said first, reads as process skill. "I wrote what each branch should do, and read every merge."

### The next two weeks (30 September to 11 October)

**Week 1, 30 September to 4 October: real projects on a thread that can hold them, and people can find you.**
- The GitHub branch lands with the brief. After that merge, split `site.ts` (identity, projects, notes).
- Case page v2.
- Your name on screen, `WORK_LINE`, a truthful title, link cards v1.
- `keys.ts`, digits 1-6, and `pillOf`.
- Sound on every screen, and phone targets.
- `CLAUDE.md`, `npm run check`, Vitest and the content lint.
- Lights off.
- "Since Tuesday" (the status line dates itself).
- **Content:** a `why` and a `did` for six to eight projects, real covers for the top five, and hygiene on every public repository you will link.

**Week 2, 5 to 11 October: safe, plain, and the Desk's frame.**
- Security's first slice: headers, CSP in Report-Only, the proxies, `security.txt`, robots and sitemap.
- Plainly, with the PDF and the security lens.
- Quiet counts (Umami proxied same-origin, unless you are on Vercel Pro).
- Foundations (`random`, `day`, `store`, `tabOf`); the Desk frame and the Today drawer; Same Grey, with 400 days frozen and validated.
- **In parallel, on its own branch:** Urchi's package one behind `lifelike`, recorded before and after against the probe. It touches `attention.ts`, `character.ts` and `Urchi.ts`, plus one line of `RoomScene.ts` for the flag. The `?debug=urchi` panel waits for `Space.ts`.
- **Content gate, Sunday 11 October:**
  - every project real, with `why` and `did`;
  - five notes;
  - `WORK_LINE` written.
- **Soft launch, Sunday 11 October:** your Instagram bio and your CV.
- **Same Grey No. 1** goes live at your midnight into Monday 12 October, if the frozen days pass their checks. Otherwise it moves to Monday 19 October.

### The next two months (12 October to 29 November)

| Week | Urchi and Space | Projects and content | Desk | Security |
|---|---|---|---|---|
| 3, 12-18 Oct | Extract `Space.ts`, then the `?debug=urchi` panel. Lids that follow the eyes; log-normal and incomplete blinks; the blink reflex | The sync, the weave and the daily Action; `Piece:` trailers begin; two notes; `npm run log` and the feed | Same Grey No. 1 on Monday | `/kept` v1; the CSP moves to nonces |
| 4, 19-25 Oct | The finds spine (outing, bolt, carry, About's full stop). The shared shooting-star event and "It saw it too" | The Urchi case page with "Five visors" | Tools frame; **Sky** | Paper one. The sky calendar by Tuesday 20 October, for the Orionids around the 21st |
| 5, 26 Oct-1 Nov | Stroking and the purr; ears and the bristle | The thread alive: thickness, the loose end, `/api/pulse`; your GitHub profile README | `/colophon` with the switches | CSP enforced after a clean week; **Phosphenes**: the hub and six lights |
| 6, 2-8 Nov | Finds phase 2 begins; breath and sighs; rests more than it performs afloat | Two notes | **Stet No. 1** on Monday 2 November | Paper two |
| 7, 9-15 Nov | Moods, habituation, microsleeps | "He is working" on Space; notes from your phone; the ThreadScene layout extraction with golden numbers | **Grain** | |
| 8, 16-22 Nov | Sleep life: dreams, the pillow, the softer first wake | | Plaintext ready; the monospace lands with it | Two more lights. The Leonids around the 17th |
| 9, 23-29 Nov | Memory and persona: recognition, "it knows your rhythm", the arrival budget | Launch check | **Plaintext, week 1 "The name"**, from Monday 23 November | Paper three; "Seen in the dark" |

- **Content gate, Sunday 1 November:** paper one is out, and there have been two notes a week since the soft launch.
- **Content gate and launch gate, the week of 23 November.** Every item in **Strategy** §15's list must hold, including:
  - A+ headers with the CSP enforced;
  - no placeholders;
  - Plainly printing to one page;
  - a readable visit without WebGL;
  - cards on every route;
  - one game with four weeks of archive;
  - the finds spine live;
  - `/kept` and six lights;
  - three papers.

  Then the **public launch**: Show HN on a weekday morning, US time, and the galleries.

### Later (December onwards)

- **Desk:** Cues or Tone (early December). Plate, if the counts say the dailies are played. Last login's first Saturday. Settle, A week and That night, in that order and only on demand.
- **Security:** the remaining six lights, and season two with the secret rotated. The security tools, once each has a proper spec. `/lab` demos last, if at all.
- **Urchi:** the micro-acts (the sneeze, staring at nothing, the double-take), dizziness after a spin, a level head while tumbling, pupils with a size of their own, a catchlight experiment, and the constellations it draws with its eyes.
- **Finds:** the lines you snapped, the fallen star and its ember, the letter in seven pieces, the geode, `npm run leave`, then wreck days made from real projects.
- **Dated:** the Geminids around Monday 14 December. "The year, wound" on Thursday 31 December, with its numbers frozen that day.
- **Gated on traffic:** "Someone was here", only once counts show about twenty visits a day.
- **Experiments behind flags:** the phone nav at the bottom, and eigengrau as grain.

---

## Rules for every new thing

These go into `CLAUDE.md`, so every branch reads them before it writes a line. The content lint and the tests enforce the ones that can be checked.

**Voice**
- Sentences, not labels. No exclamation marks. Every sentence ends.
- Counts go through `countWord`: words up to ninety-nine, digits from 100.
- Captions are at most 48 characters, in your first person, about the creature. The site's log lines are in the third person. The site never says "we" or "us".
- No emoji anywhere, shares included.
- Numbers on screen are honest and measured ("About two minutes in.", "Dithered in fourteen milliseconds.").

**Colour and type**
- Two colours for anything that is the site speaking.
- Colour is allowed only where it comes from something: a record, Urchi's eyes, a lit facet, a visitor's own picture.
- Meaningful text is at least 60% ink (6.0:1). Nothing falls below AA.
- Serif for your voice, grotesk for the site's. Monospace only where alignment carries meaning (hashes, hex, headers, ciphertext, logs), and only from Plaintext on.

**Sound**
- Off by default. Nothing sounds before a gesture. Nothing depends on sound: every cue has a visible counterpart.
- Use the existing cues first. Urchi's four sounds (`pat`, `patOwn`, `tug`, `snap`) stay Urchi's.
- No tool or game ever flips the chip. A tool with its own sound makes its own `AudioContext`.
- `sfx.air` is saved and restored, never forced open.

**Motion**
- Reduced motion is designed, not removed: cuts, dithers and still frames.
- Shape changes swap in during a blink, as faces do.
- DOM features watch `prefers-reduced-motion` live.
- Under `?still`, every new random process is off, so screenshots stay stable.

**Phone**
- Every feature states its phone behaviour before it merges.
- Targets are at least 24px, with centres at least 24px apart.
- Keep clear of the edge swipe, and set `touch-action` where you drag.
- Test at 390px and at 320px.

**Urchi**
- New behaviour goes through `Attention.play` with a priority.
- It respects `holdBlinks` and never cuts short a blink that is hiding a face swap.
- It is asleep from 01:00 to 06:59 your time.
- It is never on the Desk.
- At most one arrival act a visit, in this order: a gift parcel, the news look, the rhythm greeting, recognition.

**Data**
- Zero backend first. Storage goes through `store.ts`. Anything personal in a link goes after the `#`.
- A server route exists only when there is no other way (Last.fm, the day's puzzle, the pulse). It is edge-cached, fetches only from fixed hosts, signs what it hands out, and fails quietly and honestly.
- Nothing in the public repository names a private repository, holds a flag, or holds a puzzle's answer.

**Performance**
- No fourth *kept* WebGL context. A tool's context is created when it opens and released when it closes, or after ten seconds hidden.
- Every visited tab pauses its frames when hidden (`onShown`). DOM features draw no frames while nothing moves.
- Code loads on demand:
  - a tool is at most 60 KB gzipped, plus three.js;
  - a game is at most 12 KB;
  - finds are 12-16 KB.
- Hard-load budgets:
  - `/` 900 KB;
  - `/notes` 350 KB;
  - `/projects` 1.2 MB until covers are thumbnails;
  - no image over 300 KB, and no cover over 150 KB.
- The heap grows by less than 3 MB over ten laps of the tabs.

**Testing**
- One runner, Vitest. Scripts such as `npm run today` run under `tsx`, so the `@/` alias works everywhere.
- Pure logic lives in `rules.ts`, `logic.ts` or `roll.ts`, with golden tests.
- The PRNG's first outputs are frozen, and a published daily puzzle is never rewritten.
- End-to-end: smoke, no-WebGL, reduced motion, accessibility (axe plus a keyboard walk), and "nothing leaves the page" for tools. Playwright waits for `load`, not `networkidle`, because the site polls.
- Four screenshot baselines at most. A living creature makes pixel tests brittle; golden numbers do the rest.

**Process**
- Commit subjects read `Tab: a sentence in the house voice`. `[quiet]` keeps a commit out of the log.
- Every shipped behaviour gets one Notes log line: "Urchi looks now, a moment after it sees."
- A `Piece:` trailer goes on a commit only when you ask for one.
- A branch names in its first commit which of the two hot-spot files it touches.

---

## Where the specialists disagreed

| Question | The positions | My call, and why |
|---|---|---|
| Where the new features live | Style: a Desk as tab 5, About to 6. Games: a "Today" pill sixth. Tools: `/tools` reached from About, or a Desk drawer. Strategy and engineering: one Desk that owns routes. | **Desk, third.** One pill, sub-routes kept alive, and the row reads public then personal. Decide before the digits become keys. |
| How a puzzle is addressed | Games: a query (`/today?stet=6`), because sub-routes lost keep-alive. Strategy: a path. | **Paths** (`/today/stet/6`). The Desk's `tabOf` removes the games review's objection, and `opengraph-image.tsx` receives `params`, never `searchParams`. |
| Whose midnight | Engineering's first draft: the visitor's, as Wordle does. Games and strategy: yours. | **Yours, falling back to UTC.** One "No. 12" for everyone, a server-rendered card, one cache expiry, and it fits a site that keeps your hours. Numbering is per game, not one epoch. |
| Puzzles in the bundle, or served on their day | Engineering: generate on the client; the answer in the JS is fine. Games: frozen JSON, served by an API only from its day. | **Frozen and served on the day.** Stet and Plaintext are curated, so a public bundle spoils a week. Frozen files also cannot drift. Keep the curated banks in a private repository fetched at build. |
| Test runner | Engineering: Vitest. Games and tools: `node --test`, with no `@/` imports. Finds: a check inside `/dev/finds`. | **Vitest,** with scripts run under `tsx`. One runner that understands the alias, and pure modules stay pure by discipline, not by necessity. `/dev/finds` stays as the visual grid. |
| The shared PRNG's home | Urchi and games: `src/lib/seed.ts`. Engineering: `src/lib/random.ts`. | **`random.ts`.** `sky/seed.ts` already means visit and URL seeds. |
| Does Urchi point at the Desk? | Strategy: yes, "Today's is out." Games and style: never. Tools: yes, for a new tool. | **Never for the daily; once for a new game, tool or paper.** A daily look would mean nothing, and the games stay Urchi-free. |
| The card's line | Style: "Darius Tan / Basic Human". Strategy: `WORK_LINE`. | **`WORK_LINE`.** "Basic Human" stays on screen as the joke beside the truth, not in what a search result or an applicant tracking system shows. |
| The pocket's place | Finds: left of the sound chip on desktop, in the chip's empty corner on phones. Style: the chip moves into the nav. | **The chip moves into the nav, and the pocket takes the top-right corner** on every screen. |
| Two trust values | Urchi's memory holds trust; finds holds its own. | **One trust, in `eigengrau:urchi`.** Finds' events feed it. |
| Should a persona fix the eye colour? | Urchi asks the question. Style's accent, the Colophon and the finds' labels all assume a draw per page load. | **The colourway stays per page load.** The persona is temperament only. |
| `pleased` uses the happy face | Finds: the happy face for 1.2 s when you take a find. Urchi: happy means "he is playing music", so do not blur it. | **Allowed, as a brief event** (at most 1.2 s, no notes rising, never from a hidden mood). The rising notes carry the music meaning, and moods never trigger faces. |
| Following shooting stars | Urchi §15, finds §4 and strategy §10 each propose their own. | **One crossing event and one `witness` act,** with Urchi's habituation. It is essential on shower nights. |
| The CSP's first form | Engineering: static headers with `'unsafe-inline'` first, nonces or SRI later. The security draft: nonces from the start. | **Report-Only with `'unsafe-inline'` on day one, then nonces before anything is enforced.** Only the nonce policy is ever enforced, because `/kept` reads it back and a reviewer spots `unsafe-inline` at once. Nonces make pages dynamic, which costs little here: every panel is client-rendered and the cost is paid once a visit. |
| HSTS preload | The security draft: preload now. Engineering: not yet. | **Not yet.** Add it after a month on the real domain. |
| `Permissions-Policy` | Engineering: `microphone=(self)`. Tools: `camera` and `geolocation` for Grain and That night. The security draft: deny all. | **Deny by default, and grant a feature in the same commit as the first thing that uses it.** The microphone stays `()`, because Cues promises it never listens. |
| `/api/preview` | Engineering: signed ids and one re-checked redirect hop. The security draft: recompute the week's songs, and `redirect: "error"`. | **Engineering's version.** A store's CDN may redirect legitimately, and a signature does the same job with less work. |
| One page or two for "how it is made and kept" | Style: `/colophon`. Security and engineering: `/kept`. Strategy's first draft: one merged page. | **Two short pages, linked to each other.** The security reader needs one URL that is all threat model. |
| When Urchi's realism starts | Strategy: realism in week 3, after the Desk. Urchi: week 1. | **Package one in week 2, on its own branch.** It is two or three days, it touches files no other early work touches, it is the first five seconds of every visit, and you asked for it. The rest follows strategy's weeks. |
| Analytics | Games: Vercel custom events. Engineering and strategy: those need Pro. | **Umami, proxied same-origin, unless you are on Pro.** `/kept` then says exactly what is counted. |
| A path-scoped CSP for tools | The security draft and the first tools draft: stricter policies per path, with tools opened by full loads. The tools review: client-side navigation under one site-wide policy. | **One site-wide policy, and client-side navigation.** The site is one long-lived document, so a per-path policy binds only on a hard load. `connect-src 'self'` already makes "nothing leaves this page" true everywhere, and the network watch plus a test prove it. Only `/lab` demos, which run code, get documents of their own. |
| Case page layout | Style R5: a facts row ("2024 to now", "Source Live"). Strategy §3.10: sentences ("Mostly TypeScript. A little Python."; "From April to July. Eighty-one commits, most of them in May."). | **Strategy's order and sentences, in style's type,** with style's lit pill, focus handling and "Next:" link. |
