## Addendum: The existing Music, About and Notes tabs get fixes but almost no feature improvements

*The report gives Space and Projects deep work, but Music, About and Notes get mostly fixes and plumbing. This addendum proposes eight feature improvements to those three tabs themselves: three for Notes, three for About and two for Music. Each is aimed at one of two readers: the visitor who comes back, and the recruiter who wants to know who this is and how to work with him. Every claim was checked against the repository at `9b8c07c`. Tab numbers follow the report's renumbering: Desk 3, Notes 4, Music 5, About 6.*

**What this does not repeat.** A week, the year wound, the outage line, "Since Tuesday", the byline, the Plainly link, the feed, the log from git, notes from the phone, papers, Stet in Notes, and finds set down on About, Notes or Music are all specified elsewhere. Where a proposal here builds on one of them, it says so and adds only what is new.

**The constraints.**
- The chrome stays two colours. Colour appears only where a record brings it.
- About shows Urchi only as its existing mark.
- Nothing goes on the Desk.
- No new WebGL context: About's additions draw in the context it already holds (`AboutScene.ts:95`), and everything else is DOM.

---

### What I checked

| Claim | Where |
|---|---|
| The statement and status line are two troika `Text`s in one canvas. The canvas section is `aria-hidden`, and only the Elsewhere row is real DOM. | `AboutScene.ts:164-167`, `AboutPanel.tsx:67-82` |
| The installed troika (0.52.5) has per-character `caretPositions` (start x, end x, bottom, top) and `colorRanges`. `colorRanges` is a syncable prop, so changing it re-lays out the text in the worker. It cannot be tweened frame by frame. | `node_modules/troika-three-text/dist/troika-three-text.esm.js:769, 1242-1245, 2600-2617` |
| The mark is placed from the last line's metrics, and it looks at a point given in client px. | `AboutScene.ts:137-145, 212-231` |
| Under reduced motion the mark never follows the pointer, because no listeners are added. | `AboutScene.ts:104-110` |
| A preview plays only in Music's room: `listen()` refuses unless `atHome()`. A voice is born with `tab: HOME, away: 0`, and its `stop()` does nothing once `away !== 0`. | `sfx.ts:722, 740, 787, 802-806` |
| `walk()` already opens a song's door when the visitor arrives in Music, and muffles it through `AWAY` as they leave. | `sfx.ts:671-711, 322-326` |
| The song left playing (`carried`) is module-local to `MusicPanel`, so nothing outside Music can hand it a song. | `MusicPanel.tsx:49, 922-932` |
| The route reads up to 1,000 of the week's scrobbles with timestamps, and `fact.ts` reads each one's hour in his zone. The page receives only the one sentence. | `route.ts:163-179, 220-228`; `fact.ts:67-80, 202-210` |
| When he plays something at night, Urchi wakes and stays up: it does not fall asleep on arrival while listening, and `setListening(true)` stirs it. | `attention.ts:215, 225-230, 792` |
| `npm run note` needs one-line entries, dates notes in the machine's zone, and never asks Last.fm. | `add-note.mjs:31, 203-206, 115` |
| `Folds` registers every `.note` in the column by `data-id`, so a second copy of a note would break it. | `NotesPanel.tsx:137-146` |
| The "new" dot is by date alone: newer than the last visit, whether or not it was ever on screen. | `NotesPanel.tsx:1106` |
| Urchi's look at the About pill reads `UPDATED.about`, a hand-bumped constant. | `visits.ts:176`, `site.ts:99` |
| Cover tones are kept in `sessionStorage`, per visit. `bend()` gives a dark room tint, not a line colour. | `tone.ts:218, 234, 392-411` |

---

### Ranked by impact against effort

Impact runs from 1 to 5. Effort: S is up to a day, M is two to four days.

| Rank | Name | Tab | Impact | Effort | Why this rank | Depends on |
|---|---|---|---|---|---|---|
| 1 | **Where the days meet** | About | 4 | S (1 day) | It answers a recruiter's first practical question ("when can we talk?") for anyone ten to nineteen hours away, and it is the cheapest item here. | `TIME_ZONE` set |
| 2 | **The small hours** | Music | 3 | S-M (1.5 days) | Every Music visitor sees it. It needs no new upstream call, and it makes Urchi's clock and Last.fm's agree. | `TIME_ZONE` set; the outage line's `eigengrau:week` |
| 3 | **Read closer** | About | 4 | M (3 days) | About becomes the site's index without losing its one sentence. The statement also becomes keyboard-reachable. | style-ux R2's `onLayout` callback |
| 4 | **Holocene was on** | Notes, from Music | 4 | M (3 days) | It is the one change to how reading a note *feels*, and it is the site's "through the wall" put to a new use. **Its data can only be captured when the note is written**, so the capture should ship today (see the last section). | the preview signing (engineering §3.2) |
| 5 | **You stopped here** | Notes | 2 | S-M (1.5 days) | The returning visitor starts where they left off. A first-time recruiter gets three notes to start with. | `store.ts` |
| 6 | **A year on** | Notes | 2 | S-M (2 days) | Old notes come back for a reason. Later lines work from day one; anniversaries only from 28 September 2027. | `day.ts`, `random.ts` |
| 7 | **Listen in** | Music | 2 | M (2 days after #4's plumbing) | Magical, but it only happens when he is live *and* the visitor has sound on. | #4's plumbing; the one poller (engineering §3.2) |
| 8 | **Second draft** | About | 2 | S-M (2 days) | Nothing shows until he rewrites the statement. Build it the week before he does. | `store.ts` |

**Where these slot into the report's plan:**

| When | What |
|---|---|
| Today | #4's capture in `npm run note` (an hour) |
| Week 3 | #1 and #2, once `TIME_ZONE` and the outage line are in |
| Week 4 | #3, after the byline's `onLayout` |
| Week 5 | The rest of #4 |
| Weeks 6-7 | #5 and #6 |
| Week 8 | #7 |
| Whenever he first rewrites the statement | #8 |

---

### Shared plumbing (build once)

- **A song started outside Music's room** (used by #4 and #7). `listen(url, signal, opts?: { from?: "away" })` in `sfx.ts:721`.
  - With `from: "away"`, it skips the two `atHome()` refusals (`:722`, `:740`).
  - It builds the voice at `AWAY[min(away, 3) - 1]` (`:322-326`), with the pan side computed as at `:703`, and with no door scheduled (`doorAt = end`).
  - It sets `tab` and `away` from `whereNow()` instead of `HOME` and 0 (`:787`).
  - `stop()` (`:802`) on such a voice fades it into the bed over `DOOR_CLOSE` instead of returning early.
  - `walk()` already opens the door when the visitor walks into Music (`:691-700`). `sfx.preview` (`:1317`) gains the option.
- **`src/lib/record.ts` (new).** `carried` moves out of `MusicPanel.tsx:49` into this module, so a song begun on Notes, or by Listen in, is Music's to pick up on arrival (`MusicPanel.tsx:922-932`).
  - It carries `{ preview, key, cover, from: "week" | "note" | "live", track, date? }`.
  - `Shown` (`:728`) gains a fifth mode, `visit`, for a carried song that is not in the week.
- **The preview and cover routes take what the site lists.** Engineering §3.2 signs `now`, `last` and `week.tracks`. `preview/route.ts:27-30` and `/api/cover` should also accept any song or cover id listed in `NOTES`, imported on the server into a `Set`. Nothing outside the site's own content streams.
- **`AboutScene` learns three verbs** (used by #3 and #8). `phrases()` gives phrase boxes from `caretPositions`. `say(text | null)` swaps the status `Text` (`:167, 201-204`) with a sync and the mask rise the reveal already uses (`:261-274`). `lookAt(x, y)` points the mark at a spot in client px, through `look()` (`:137-145`). All of it goes through style-ux R2's `onLayout` callback, which becomes `onLayout({ top, bottom, phrases })`.
- **Two new storage keys,** both through `store.ts`, in the README's list and on `/kept`:
  - `eigengrau:read`, for #5;
  - `eigengrau:about`, for #8.

  Nothing else here stores anything.
- **Tests (Vitest), all golden and pure:**
  - `byHour` and `weekFactOf` on the existing fixture list, including a zone boundary;
  - `overlap` on fixed dates across 4 October, 25 October and 1 November 2026;
  - the word diff;
  - `surfaced()`.

---

## Music

### 1. The small hours

**Pitch.** The week laid over one day, in his hours, with Urchi's night marked under it.

**How it works:**
1. **The hours, counted.** The route already has the week's scrobbles as `Scrobble[]` (`route.ts:220`). A new pure `byHour(scrobbles, zone)` in `fact.ts` counts them into 24 bins with the same private `reader(zone)` the sentence uses (`fact.ts:67-80`). Each bin also names its artist when one artist holds at least half of it.
2. **What the page receives.** `week.hours` is added to the body (`route.ts:221-230`) as `{ plays: number[24], artist: (string | null)[24], whole: boolean }`. `whole` is `scrobbles.length >= total`, as `weekFact` already computes it (`fact.ts:139`).
3. **The sentence says which part of the day it is about.** `weekFact` becomes `weekFactOf()`, which returns `{ text, band? }`. `band` is the `BANDS` index (`fact.ts:39-46`) when the winning fact is the part-of-day one (`:202-210`). `weekFact(i)` stays as `weekFactOf(i).text`, so its tests stand.
4. **The ruler.** Under the sleeve's words, in the sleeve's own column, sit 24 hairlines, one per hour from midnight.
   - Height is `2 + 22·√(plays / most)` px, at 40% ink.
   - An hour with no plays is a 1px dot at 20%.
5. **His night.** Under hours one to six (01:00-06:59, `hoursOf`, `hours.ts:15-19`), a 1px line at 30% runs beneath the columns. It is drawn, never labelled.
6. **Now.** The column for his hour now (`clock().h`, `hours.ts:31`) stands at full ink. While he is playing something, that one hairline takes his record's hue.
   - The hue is lifted to L 0.78, with chroma at most 0.12, and checked at 4.5:1 against eigengrau with `contrast` (`tone.ts:89`), as style-ux R15 lifts the eyes.
   - Not `bend()`: that is a room tint, and a 1px line in it would vanish.
   - It is the only colour on the ruler, and it comes from the record.
7. **The sentence points at its proof.** When the heading is a part-of-day fact ("Mostly Bon Iver, mostly after midnight."), that band's columns rise to full ink for 1.2s after the heading lands, then settle back.
8. **Naming an hour.** Hovering, focusing or a finger names an hour in one grotesk line under the ruler, at 11px and 60%. It is not a cursor label, so phones get it too.

**How it reads:**
- "Nine in the evening. Twenty-one plays, mostly Men I Trust."
- "Two in the morning. Six plays. Urchi stayed up for them." (True to the code: his playing keeps it awake, `attention.ts:215, 225-230`.)
- "Four in the morning. Nothing played. Urchi slept."
- "Eleven in the morning, now. Nothing yet."
- In a heavy week (`!whole`), once: "Of the newest 1,000 plays."
- The ruler's accessible name: "The week by the hour, in his time. Most of it in the evening. Six plays between one and seven in the morning."
- **The hour words:** "Midnight", "Noon", then "One in the morning" to "Eleven in the morning", "One in the afternoon" to "Five in the afternoon", "Six in the evening" to "Nine in the evening", and "Ten at night", "Eleven at night".

**How it sounds.** With sound on, scrubbing across the ruler gives one tick per column at Notes' riffle gain (`sfx.play("tick", 0.25)`, `RIFFLE_GAIN`, `NotesPanel.tsx:56`). It is the thumb along a card index again. At rest it is silent.

**Where it lives:**
- Music, in the week view only. It leaves with the stack when the page turns to the room (`MusicPanel.tsx:1392`), with the stack's `data-leaving` fall.
- Its place is `.music-side`, after `.music-now` (`:1345-1389`).
- **On a desktop** it is as wide as the sleeve's column, `clamp(160px, 20vw, 280px)` (`globals.css:1117`), so the columns sit 6.7 to 11.7px apart.
- **On a phone** it takes `--sleeve-w: min(240px, 64vw)` (`globals.css:1390`), which puts the columns about 10px apart.

**Data and persistence:**
- No new upstream call, and about 0.6 KB more per answer. Nothing is stored.
- In an outage, the week kept in `eigengrau:week` (style-ux R8) carries `hours`, and the ruler is drawn at 60% with the rest.

**Implementation:**
- `src/app/api/now/fact.ts`: export `byHour` and `weekFactOf`. `reader` stays private.
- `route.ts:221-230`: add `hours` to `week`.
- `now.ts:28-34`: add `Week.hours?`.
  - `fetchNow` rebuilds the week (`now.ts:64-70`), so it must copy `hours` through: 24 finite, non-negative numbers, or none. It is the same trap engineering names for `sig`.
- `src/components/music/Hours.tsx` (new, in the folder A week creates): a `<div role="img" tabIndex={0}>` of 24 `<i style="--h">`.
  - The pointer's x picks the column.
  - While the ruler has focus, ← and → step the hour. The ruler claims those keys through `keys.ts`.
  - A polite live region reads the line.
- `MusicPanel.tsx:1345-1389`: render it when `!room`.

**Edge cases:**
- **Phone:** the strip is one target, 44px tall, with `touch-action: pan-y`. A sideways drag scrubs and a vertical drag scrolls.
- **Reduced motion:** the columns appear at once, and the band lights as a cut. It is watched live (`matchMedia` change), as the rules require.
- **Sound off:** no ticks.
- **His night:** the "now" column sits over the night line. If he is playing, it is lit in his record's hue, the same thing Urchi's listening face says on Space.
- **`TIME_ZONE` null:** `fact.ts` reads UTC but `hours.ts` reads the visitor's zone (engineering issue 3). Until it is set, the lines end in ", UTC", and the night line and every Urchi clause are left out.
- **A thin week:** below twenty plays the ruler is not drawn. Noise is not a shape.
- **A returning visitor:** nothing is remembered. It is always this week.

**Effort:** S-M, a day and a half.

**What it shows:** data told as a shape and a sentence, without a chart library, and two of the site's clocks made to agree.

**Risks:**
- A second "chart" on a page that is a sentence and a stack. It stays 24px tall, silent and unlabelled until asked.
- Scrobbles are dated when a song starts, so an hour's column counts songs begun in it.

**Log line:** "Music: the week, by the hour, with Urchi's night under it."

---

### 2. Listen in

**Pitch.** While he is playing something, you can follow his record round the flat. You hear thirty seconds of each song he plays, from Music's room, wherever you are.

This is what "through the wall" becomes when it is taken all the way. #4 is the other half: a note's song heard from next door.

**How it works:**
1. **The sleeve becomes a button.** When he is live, Music turns to the room (`go(true)`, `MusicPanel.tsx:1020`) and his sleeve stands alone. With sound on, a transparent `<button aria-pressed>` sits over `.music-cover`. It sits over it rather than wrapping it, so the glide's `coverBox` measure (`:802-809`) is untouched.
2. **Pressing it** asks for his song's signed preview (engineering §3.2) and plays it the way a title's plays (`:888-914`): behind the wall, then the door opens in front of you.
3. **A new `src/lib/listenIn.ts`** holds `{ on, key }` for this page load only. It subscribes to the shared poller (engineering §3.2's `subscribe`) at the live cadence (`POLL.live`, 20s, `:21`), whatever tab is shown. The visitor asked for it.
4. **His next song.** When the poll brings a new song, and sound is on and the visitor is not on the Desk, it fetches that preview and starts it from Music's room at the visitor's distance (the shared `from: "away"`):
   - through one wall on Notes or About;
   - through three on Projects;
   - as far as the flat goes on Space.
5. **The song before** goes into the bed as the new one comes up (`hush(WALL_IN)`, `sfx.ts:742`). A song replaced before its preview arrives is aborted, as a title's is (`asking`, `MusicPanel.tsx:889-891`).
6. **Walking into Music** opens the door (`walk`, `sfx.ts:691-700`), and the page picks the song up as it picks up a song left playing (`MusicPanel.tsx:922-932`, through `record.ts`).
7. **When he stops,** it waits ten minutes for the next record. Then it lets go without a sound.
8. **It also ends** on a second press, on the sound chip, on a reload, or on a hidden tab (sfx already closes songs on hidden, `QUICK_CLOSE`, `sfx.ts:311`).

**How it reads:**
- The cursor on the sleeve says "Listen in". While it is on, "Leave him to it".
- Under the state line, in grotesk 11px at 60%: "Thirty seconds of each song, as he plays them." From the second song on: "You hear thirty seconds. He hears the rest."
- The line "About two minutes in." still means his place in the song. The preview is the store's thirty seconds, and nothing claims they are the same.
- When he stops: "He stopped. The room waits ten minutes for the next one." After ten minutes: "He has not put anything else on."
- A song the stores lack: "No preview of this one." Then it waits for the next.
- The button's accessible name: "Listen in: thirty seconds of each song he plays, through the wall."

**How it sounds.** Only the previews, the door and the walls. No new cue.

**Where it lives.** Music's room (pill 5). It is heard on every tab except the Desk.

**Data and persistence:**
- Nothing is stored.
- One `/api/now` poll every 20s. With engineering's `s-maxage=10`, that is at most one function call every ten seconds, however many people listen.
- One preview per song, about 0.5 to 1 MB, cached a day at the edge.

**Implementation:**
- The shared `from: "away"` and `record.ts`.
- `MusicPanel.tsx:1324-1343`: the button in room mode, with a `CursorLabel` word.
- `listenIn.ts` checks `pillOf(whereNow().path)` (the report's `routes.ts`) and holds while the visitor is on the Desk.

**Edge cases:**
- **Phone:** tap the sleeve. It needs style-ux R4 first: the chip in the nav, and `navigator.audioSession.type = "playback"` for the silent switch. Until then, no phone can turn sound on.
- **Reduced motion:** sound only. Nothing changes.
- **Sound off:** the button is not there. The cursor says "Sound is off" once (`firstSoundOffHover`, `:53`), and nothing is fetched.
- **His night:** he is playing at 2:40, so Urchi is up and listening on Space. Listen in works the same.
- **A returning visitor:** never remembered. It is always a fresh press, so nothing ever plays on arrival.
- **The Desk:** no new song starts there. A game that owns the sound ends the one playing (Plate's `sfx.hushSong`, as the games section plans).

**Effort:** M. Two days after #4's plumbing, three alone.

**What it shows:** one audio graph, built with no streaming service, no account and no autoplay, is enough for the flat to have a record on in the next room.

**Risks:**
- **Store terms.** Previews are for promotion. The attribution link under the sleeve stays (`MusicPanel.tsx:1355-1367`).
- **Surprise.** Songs start on other tabs, but only after a press on this page load, and only after the first door opened in front of the visitor.
- **Rarity.** Few people will ever meet it. It is for the few who stay.

**Log line:** "Music: listen in, and hear thirty seconds of whatever he puts on next."

---

## Notes

### 3. Holocene was on

**Pitch.** Each note keeps what he was playing when he wrote it, and you can hear it from next door.

**How it works:**
1. **The script asks Last.fm.** After the text, `npm run note` asks Last.fm once (`user.getrecenttracks`, `limit=1`). It reads `LASTFM_API_KEY` and `LASTFM_USER` from `.env.local` (README:55) with `process.loadEnvFile` or a five-line parser. If a song is playing now, or scrobbled in the last ten minutes, it asks:
   ```
   Holocene, Bon Iver was on. Keep it with the note? [Y/n]
   ```
2. **What is kept.** The entry's single line (`add-note.mjs:31` requires one) gains `heard: { title, artist, cover }` and `at: "23:41"`.
   - `cover` is the 32-hex hash, taken as the route's `coverId()` takes it (`route.ts:54-60`).
   - `at` is *his* time, from `TIME_ZONE`. The script's `localDay` uses the machine's zone (`add-note.mjs:203-206`), and that should change for the date too.
3. **Notes from the phone.** The notes Action (Strategy §7.2) does the same with a repository secret passed through `env:`. The issue is filed while the song plays, and the Action runs within a minute.
4. **The line.** Under a note's body sits one grotesk line at 11px and 60%, the site's voice:
   - "Holocene was on."
   - With `at`: "Holocene was on, at 23:41."
   - In his night: "Holocene was on, at 2:14."
5. **Heard from next door.** Rest on the line for 600ms (Music's `DWELL_MS`, `MusicPanel.tsx:25`) with sound on, and the song's preview comes through the wall from Music's side: muffled at `WALL_HZ`, and panned right, because Music is the next room to the right in either numbering.
6. **The colour comes too,** the way Music's room takes it behind the wall: 35% of the record's colour (`WALL_SHARE`, `MusicPanel.tsx:134`). It is a soft light at the column's right edge, level with the note, painted with `bend(t, false)` (`tone.ts:392`).
7. **Leave the line** and the song fades into the bed over 1.2s, as a title's does. **Click it** and it stays on to its end. The line then reads "Holocene is on." until it ends.
8. **Walk into Music** while it plays and the door opens. The sleeve shows it in the new `visit` mode, with the state line "From a note, 28 September."
9. **The other way round.** In Music's stack, a song that is also in a note says so. Its `aria-label` (`MusicPanel.tsx:1414`) ends ", in a note on 28 September", and its cursor word (`:1219`) is "Last.fm. Also in a note."

**How it reads:**
- "Holocene was on."
- "Holocene is on."
- "From a note, 28 September."
- "Sound is off." (once a visit, as Music says it)

Log lines (`kind: "log"`) never carry a song.

**Where it lives.** Notes (pill 4), under the note's body, and Music's sleeve when you walk in.

**Data and persistence:**
- The songs live in `NOTES` (in `notes.ts` once `site.ts` is split).
- No backend, and nothing stored.
- A cover's tone is learnt only when the line is first rested on: `/api/cover/<id>` loads into a hidden `<img>`, then `learnTone` (`tone.ts:308`).

**Implementation:**
- `site.ts:215-224`: `Note.heard?: { title: string; artist: string; cover: string | null }` and `Note.at?: string`.
- `NotesPanel.tsx:622-624`: a `<button className="note-heard">` after `.note-body`, inside `.note-full`, so it folds with its note.
- `onOver` (`:994-1006`) gets the dwell branch, for the mouse only. `onClick` (`:963-991`) gets the pin.
- `.notes-light` (new) in `.stage-notes` holds one spill. It runs frames only while it moves, as Music's `RoomLight` does (`MusicPanel.tsx:708-724`).
- `notes.ts:182`: the haystack includes `heard.title` and `heard.artist`, so typing "holocene" finds every note written to it.
- The shared `from: "away"`, `record.ts`, the routes' `NOTES` allow-list, and the `visit` mode at `MusicPanel.tsx:1151-1160`. The carried cover joins `covers`.

**Edge cases:**
- **Phone:** a tap plays and pins, and a second tap stops. There is no dwell.
- **Reduced motion:** the light crosses linearly over 0.6s, as Music's `PLAIN` does (`MusicPanel.tsx:150`). Watched live.
- **Sound off:** nothing is fetched. A rest still brings the colour after the dwell, as Music's titles do (`:1228-1235`).
- **A context not woken on this page load** (sound restored on from storage, no gesture yet): `listen()` resolves null (`sfx.ts:724-728`), and there is colour only.
- **His night:** only the "at 2:14".
- **A returning visitor:** nothing is stored.
- **A folded note:** the line folds with it.
- **A song already left playing in Music:** the note's song takes the room, as a newer song always does (`hush(WALL_IN)`).

**Effort:** M, three days:
- the script prompt and the Action, half a day;
- `from: "away"`, a day;
- the line and the light, a day;
- the `visit` sleeve, half a day.

**What it shows:** a note is a moment, and the site keeps its sound. It also shows an audio graph clean enough to take a new source without special cases.

**Risks:**
- **Privacy.** His listening is already public on Last.fm, but pinning a song to a moment of writing is new. The prompt asks every time.
- **No preview.** A song the stores lack still reads, and a rest brings only the colour.

**Log line:** "Notes: each note keeps what was playing, heard through the wall."

---

### 4. You stopped here

**Pitch.** The column remembers what you have actually seen. Coming back, you start where you left off. The first time, you get three to start with.

**How it works:**
1. **Seen, not read.** An `IntersectionObserver` with `.notes-scroll` as its root counts a note as seen when 60% of it stays in view for 1.5s (all of it, if it is shorter than the window). It only counts:
   - while Notes is shown (`onShown`, `where.ts:64`);
   - while the document is visible;
   - while nothing is filtered or being found.
2. **Kept.** Seen ids go to `eigengrau:read` through `store.ts`. The newest 400 are kept, about 9 KB.
3. **The new dot changes meaning.** `fresh` (`NotesPanel.tsx:1106`) becomes "newer than your last visit **and** not yet seen", so a note you already saw in another tab no longer calls to you. The dot keeps style-ux R15's eye colour.
4. **The bookmark.** When unseen notes sit above seen ones, a 1px rule at 30% runs the column's width above the newest seen note. It carries "You stopped here, 12 September." at its right, in grotesk 11px at 60%. The day is `lastVisitDay` (`notes.ts:316`).
   - It is not a `.note`, so `Folds` never sees it (`:137-146`).
   - It is placed once per arrival (`onArrive`, `:1077-1082`) and never moves while you read.
5. **All seen.** The head sentence ends "You have been through them all.", as one more `word` piece in `indexSentence` (`notes.ts:113-132`).
6. **The first visit.** When `lastVisit()` is null and there are at least twelve notes, up to three of which he has marked `start: true`, the head sentence gains "Three to start with." as a button.
   - It filters exactly as a tag word does (`filter`, `NotesPanel.tsx:863-869`): the rest fold into hairlines drawn to their length, and "All notes." brings them back.
   - `?tag=start` links to it.

**How it reads:**
- "You stopped here, 12 September."
- "You have been through them all."
- "Three to start with."
- The dot's hidden text becomes "New since your last visit, not seen yet."

Nothing ever says "read": the page cannot know.

**Where it lives.** Notes.

**Data and persistence:** `eigengrau:read` (new), and `Note.start?: true` in `site.ts`. No backend.

**Implementation:**
- The layout effect that makes `Folds` (`NotesPanel.tsx:759-791`) adds the observer after `f.init`, and disconnects it in the cleanup.
- `readTag` (`:99-102`) accepts `start` when any note has it.
- `hasTag` (`notes.ts:185`) treats `start` as a tag on those notes.
- `tagSentence` (`notes.ts:135`) writes "Three to start with. All notes."

**Edge cases:**
- **Phone:** unchanged. The rule fits 358px.
- **Reduced motion:** the rule appears without drawing in.
- **Sound off, and his night:** nothing changes.
- **A returning visitor:** this is who it is for.
- **Private mode:** every visit is a first, as `visits.ts` already accepts, so the visitor always gets "Three to start with."
- **Sediment** (past `NOTES_FOLD_AFTER`): a folded month counts as unseen, and the rule never goes inside one.

**Effort:** S-M, a day and a half.

**What it shows:** respect for a reader's time. For a recruiter, it is a curated way in without a "best of" page.

**Risks:**
- "Seen" is not "read", which is why the copy never claims it.
- `start` notes go stale. The content lint can warn when a start note is more than a year old.

**Log line:** "Notes: it remembers where you stopped."

---

### 5. A year on

**Pitch.** Old notes come back for two reasons: it is a year to the day, or he has written under one again.

**How it works:**
1. **Later lines.** A note may carry dated later lines, such as `later: [{ date: "2027-03-02", body: "Still true." }]`. They sit under its body, indented 24px: the date in grotesk 11px, then the line in serif 14px at 80% ink.
2. **The script asks.** `npm run note -- --later <id>` adds a later line. And whenever he runs `npm run note`, the script first looks for a note written on this day in an earlier year, in his zone, and asks:
   ```
   A year ago today: "i got a free burrito heh". Add a later line to it? [y/N]
   ```
   The anniversary nudges the writer as well as the reader.
3. **At the top, for the day.** When one of his notes (never a log line) was written on this date in an earlier year, it surfaces above the newest note under a grotesk line: "A year ago today." or "Two years ago today."
   - With none on the day, it takes the nearest within three days: "A year ago this week."
   - One note a day, the same for everyone, chosen by the day's seed (`random.ts`, `day.ts`). The day turns at *his* midnight.
4. **Answered since your last visit.** For a returning visitor, a note answered since their last visit surfaces there instead, headed "Answered on 3 March.", with the new dot on its later line (`NewDot`, `NotesPanel.tsx:579-584`). It outranks the anniversary.
5. **Urchi tells it on Space,** as it tells new notes. `whatsNew` (`visits.ts:167-187`) counts fresh later lines, and `URCHI_NEWS` (`site.ts:83-87`) gains `answered: "{count} old note answered since {date}."` (42 characters with "One" and "12 September", under the cap of 48).
6. **Only in the quiet column.** The surfaced copy steps aside while a tag or a find is on. The note itself is always in its own place, in the column or the sediment.

**How it reads:**
- "A year ago today."
- "Two years ago this week."
- "Answered on 3 March."
- A later line, in his words: "2027.09.28  Still the best burrito."

**Where it lives.** Notes: at the top of the column under the head sentence, and inside each note for its later lines.

**Data and persistence:** `NOTES` only. No backend, and no new key: "since your last visit" is the existing `eigengrau:visits`.

**Implementation:**
- `site.ts:215-224`: `Note.later?` and `Note.quiet?`. The one-line rule stands.
- `notes.ts`:
  - a new `surfaced(today, lastVisit)`, returning `{ note, head }` or null;
  - `HAYSTACK` (`:182`) takes the later lines too.
- `ruleWidth` (`NotesPanel.tsx:69`) counts the later lines' length, so the hairline still measures the whole note.
- `NotesPanel.tsx:1216`: a `.notes-then` block before `.notes-list`.
  - Its article is deliberately **not** a `.note`, because `Folds` registers every `.note` by `data-id` (`:137-146`) and `ANCHORS` must stay unique (`notes.ts:12-19`).
  - Its date links to the note's own anchor.
- `visits.ts:171`: fresh later lines count as news.
- `add-note.mjs`: the prompt, and `--later`.

**Edge cases:**
- **Phone, reduced motion, sound off:** the same column. The surfaced note appears without its rise under reduced motion. Nothing sounds.
- **His night:** the day turns at his midnight, not the visitor's.
- **A returning visitor:** "Answered on …" comes first.
- **A note he would rather not see again:** `quiet: true` keeps it out of the anniversaries.
- **The honest limit:** the first anniversary is 28 September 2027. It comes sooner only if he backdates notes he wrote elsewhere, which `npm run note` allows (`add-note.mjs:98`). Later lines work from the first day.

**Effort:** S-M, two days.

**What it shows:** writing that is revisited, not only posted, and a column that knows what day it is.

**Risks:** it needs him to write later lines. If he never does, it shrinks to anniversaries, and those start in a year.

**Log line:** "Notes: a year on, the old ones come back."

---

## About

### 6. Read closer

**Pitch.** The statement is the index. Its phrases open onto the proof.

**How it works:**
1. **Three phrases, three places.** The statement stays one sentence in the canvas. Three phrases in it carry a gloss and a place, set in `site.ts`:

   | Phrase | Goes to | Gloss |
   |---|---|---|
   | "Quiet interfaces" | Projects | `projectsLine()` (`site.ts:209-213`), "Six projects since 2021. Two alive." |
   | "notice" | the Security drawer | "Noticing is most of security. Three papers so far." |
   | "the small things" | the Tools drawer | "Small tools, free. They keep nothing of yours." |

   Until those drawers exist, "notice" goes to Notes instead: "What he noticed, in notes. Two so far." The full stop after "things" is left alone, because it belongs to the finds.
2. **The scene publishes the phrases' boxes.** `AboutScene` builds each phrase's box from troika's `caretPositions`, mapped to the screen as `placeMark` maps the line (`AboutScene.ts:212-231`). It publishes them through the `onLayout` callback, and again after a resize's sync (`:296-298`).
3. **Real links over the words.** `AboutPanel` lays a real `<a>` over each box, outside the `aria-hidden` stage (`AboutPanel.tsx:67`). At rest they have no look of their own.
4. **Resting on a phrase** (300ms), or focusing it:
   - that phrase stays at full ink, and the rest of the statement drops to 60% (`colorRanges`, one re-layout, a cut);
   - the status line drops through its mask and the gloss rises in its place (`say`);
   - the mark turns to look at the phrase (`lookAt`, its centre in place of the pointer).
5. **Leaving,** after 250ms (Music's `GRACE_MS`), reverses it: the gloss drops, the status rises and the ink comes back.
6. **A click** slides to that tab.
7. **A `CursorLabel`**, as Music and Notes have, names the destination: "Projects", "Security" or "Tools".

**How it reads:**
- At rest, nothing is new.
- Resting on "Quiet interfaces", the statement dims except those two words, and under it rises "Six projects since 2021. Two alive."
- The accessible name: "Quiet interfaces: six projects since 2021, two alive. Projects."

**Where it lives.** About. The phrases lead to Projects, the Security drawer and Tools.

**Data and persistence:** `GLOSSES` in `site.ts` as `{ phrase, href, say }[]`, where `say` may count content with `countWord`. No backend, and nothing stored.

**Implementation:**
- `AboutScene.ts`:
  - `phrases()`;
  - `emphasise(range | null)` on `this.lines` (`:57`);
  - `say()` and `lookAt()` from the shared list.
- `AboutPanel.tsx:65-84`: the overlay and a `CursorLabel`.
- `about/page.tsx`: the `sr-only` mirror keeps the plain sentence. The three links are real in the panel, so a screen reader hears the sentence and then its three doors.
- **Content lint:** each `phrase` must occur exactly once in the current statement.

**Edge cases:**
- **Phone:** the first tap glosses, the second tap goes, and a tap elsewhere closes. It is Music's two-tap (`MusicPanel.tsx:1237-1256`). At 34px type a phrase's box is about 47px tall, well over the 24px floor.
- **Reduced motion:** the gloss swaps without a rise, and the dim is a cut anyway. The mark does not turn, as it already never follows the pointer under reduced motion (`AboutScene.ts:104-110`).
- **Sound off:** nothing. With sound on, a click plays the ordinary tab cue, and the gloss is silent.
- **His night:** the mark is asleep (#8) and does not look.
- **A returning visitor:** nothing is stored.
- **A draft (#7) without one of the phrases:** that gloss is left out.
- **The finds' full stop:** the box for "the small things" ends at the "s", so the full stop stays the finds'.

**Effort:** M, three days.

**What it shows:** one sentence that is both the thesis and the table of contents. It also fixes the accessibility of a canvas statement as part of a feature, not as a chore.

**Risks:**
- **Poetry turned into a menu.** Three phrases at most, with no underline and no hint at rest.
- **A flash between states.** If one frame shows the text un-dimmed between syncs, pre-sync both states as two `Text`s and swap their visibility.

**Log line:** "About: the statement opens where you rest on it."

---

### 7. Second draft

**Pitch.** The statement keeps its drafts. When he rewrites it, a returning visitor sees it being rewritten.

**How it works:**
1. **Drafts, dated.** `STATEMENT` and `STATEMENT_MARK` (`site.ts:19-25`) become `STATEMENTS: { from, lines, mark }[]`, oldest first, the last being current.
   - `UPDATED.about` (`site.ts:99`) follows the newest `from`, so Urchi already looks up at the About pill for a returning visitor (`visits.ts:176`).
   - Its line becomes "Rewritten since 12 September.", a new `URCHI_NEWS.rewritten`.
2. **The earlier draft, still standing.** A returning visitor meets the earlier draft already in place, with no rise, as if it had never left, when both of these hold:
   - their last visit (`lastVisit()`, `visits.ts:110`) fell while that earlier draft stood;
   - `eigengrau:about` shows they have not yet been shown this revision.
3. **Struck.** After 1.2s, each removed word is struck: a 1.5px ink rule drawn across it left to right in 0.25s, 0.08s apart. The rule is a plane in About's own scene, sized from `caretPositions`. It holds 0.6s.
4. **Rewritten.** The changed lines drop through their masks and the new lines rise, through the existing reveal (`AboutScene.ts:261-286`). Unchanged lines stay put. The mark follows its word through that draft's own `mark` (`placeMark`).
5. **Said once.** The status slot says "Rewritten on 2 November." for eight seconds, then the status returns.
6. **Earlier drafts, for people who notice.** Over the statement, away from #6's phrases, the cursor says "Second draft".
   - A click steps back a draft: the lines swap through their masks at 60% ink, and the status slot reads "The first draft, 25 September to 2 November."
   - Past the first draft, "As it stands, since 2 November." brings the current one back. Esc brings it back at once.

**How it reads:**
- "Rewritten on 2 November."
- "Second draft."
- "The first draft, 25 September to 2 November."
- "As it stands, since 2 November."

**Where it lives.** About.

**Data and persistence:** `STATEMENTS` in `site.ts`, and `eigengrau:about` (new), which holds the `from` of the last revision shown.

**Implementation:**
- `site.ts:18-25`.
- `AboutScene.ts`: `drafts`, `strike(words)` and `swap(lines)`. The word diff is an LCS over words, about twenty lines.
- `AboutPanel.tsx:26-31` picks the first draft to show from `lastVisit()`.
- `about/page.tsx` lists the earlier drafts with their dates in the `sr-only` mirror.
- An "Earlier drafts" button in the overlay, `sr-only` until it has focus, steps with the keyboard.

**Edge cases:**
- **Phone:** tapping the statement outside a phrase steps back a draft.
- **Reduced motion:** there is no strike animation. The old draft shows with its removed words already struck for 1.2s, then cuts to the new.
- **Sound off:** it is silent either way.
- **His night:** the mark sleeps through it.
- **A first visit:** only the current draft, but "Second draft" can still be found.
- **One draft** (today): nothing shows, not even the cursor word.
- **`?still`:** no strike, and the current draft.

**Effort:** S-M, two days. Build it the week before his first rewrite.

**What it shows:** he revises in public and is not embarrassed by an earlier self. The site's words have a history, as its code does.

**Risks:**
- A statement rewritten often reads as indecision. Put a rule in `CLAUDE.md`: at most one draft a quarter.
- The strike must sit exactly on the glyphs. Test it at 34px and at 64px.

**Log line:** "About: the statement keeps its drafts."

---

### 8. Where the days meet

**Pitch.** Next to Email: how his working day and yours line up this week, from both clocks.

**How it works:**
1. **His hours.** A new `WORK_HOURS` in `site.ts`, for him to set: `{ from: 9, to: 18, days: [1, 2, 3, 4, 5] }`.
2. **Two clocks compared.** A new pure `src/lib/overlap.ts` takes the visitor's next five weekdays, 9:00 to 17:00, in their zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), and sets them against his hours in `TIME_ZONE`. Each day is converted through `Intl` on its own date, so daylight saving lands on the right day on both sides.
3. **On hover or focus of Email,** the address rises in (style-ux F-L7), and this line rises under the Elsewhere row. It takes the place of the quieter row of site pages, which drops through its mask. Leaving swaps them back.
4. **On a phone,** the first tap on Email shows the address and the line, and the second opens the mail app. Today a touch goes straight to `mailto:` (`AboutPanel.tsx:50`).
5. **Plainly,** which already says "It is 15:12 here.", gets the same line under it.
6. **The mark keeps his hours.** At his night (`clock().hours === "night"`), `AboutScene`'s arrival skips opening the eyes (`MARK_IN.eyes`, `AboutScene.ts:282-285`, with `closeEyes()`/`openEyes()` at `Urchi.ts:340-346`). The existing mark says it without words.

**How it reads.** These are worked for `TIME_ZONE = "Australia/Melbourne"` and his hours of 9 to 18. Melbourne moves to UTC+11 on 4 October 2026.

| Visitor | Dates | Hours apart | The line |
|---|---|---|---|
| Singapore | all autumn | 3 | "It is 21:14 for him. Your working days share six hours, 9:00 to 15:00 yours." |
| San Francisco | to 31 October | 18 | "It is 21:14 for him. Your Monday to Thursday afternoons meet his mornings, 15:00 to 17:00 yours." |
| San Francisco | from 1 November | 19 | The same, "14:00 to 17:00 yours." |
| London | 4 to 24 October | 10 | "It is 21:14 for him. Your days miss by an hour: his ends at 8:00 yours." |
| London | from 25 October | 11 | "Your days miss by two hours: his ends at 7:00 yours." |
| New York | 4 to 31 October | 15 | "Your days miss by an hour: his starts at 18:00 yours." |
| New York | from 1 November | 16 | "His day starts as yours ends, at 17:00 yours." |
| His zone | | 0 | "Same hours as yours." |

- **His night:** "It is 3:12 for him, the middle of his night." Then the overlap.
- **His weekend:** "It is Saturday for him." Then next week's overlap.

**Where it lives.** About's foot beside Email, and the top of Plainly.

**Data and persistence:** `TIME_ZONE` and `WORK_HOURS`. The visitor's zone is read in the browser and never leaves it. No backend, and nothing stored.

**Implementation:**
- `src/lib/overlap.ts`: new, pure, and golden-tested on fixed dates.
- `AboutPanel.tsx:49-63` and `70-82`: the hover and focus state, and the two-tap on touch.
- `AboutScene.ts:282-285`: the night guard.

**Edge cases:**
- **Phone:** the two-tap. At 320px the line wraps to two lines.
- **Reduced motion:** the swap is a cut.
- **Sound off:** nothing changes. Email still copies with the `tab` cue when sound is on (`AboutPanel.tsx:53`).
- **His night:** as above, in words and in the mark.
- **A returning visitor:** nothing is stored.
- **`TIME_ZONE` null, or no zone in the visitor's browser:** the line is left out.
- **Different working hours:** the line says "yours" and the times plainly, so its 9-to-5 assumption shows.

**Effort:** S, a day.

**What it shows:** he knows the practical question behind "how do I work with him" when the asker is ten to nineteen hours away, and he answers it honestly, daylight saving included.

**Risks:**
- "Your days miss" can read as a disclaimer. It is honest, and it names the hour when a call is easy.
- It publishes his working hours. `/kept`'s "what it gives away about me" should list them.

**Log line:** "About: when his working day meets yours."

---

### Open questions for the owner

1. May a note name what you were playing when you wrote it? The script asks every time, with yes as the default.
2. May visitors follow your live listening with sound on (Listen in)?
3. Your working hours and days for **Where the days meet**, and may they be public?
4. Which three phrases in the statement, and where should each lead?
5. Will you write later lines under old notes? If not, **A year on** waits for its first anniversary in 2027.
6. Once there are twelve notes, which three should a stranger start with?

### If you only do one thing here

Add the Last.fm question to `npm run note` today. It is an hour's work in `scripts/add-note.mjs`, and every note written from now on keeps the song that was on and the minute it was written. The line under the note, the song through the wall and Music's side of it can all come in week five. What was playing can only be captured at the moment of writing, and a note written without it can never get it back.

The cheapest visible win after that is **Where the days meet**: one day's work, and it answers the question a recruiter overseas actually has.
