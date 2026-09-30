## Addendum: Where it goes

*Darius suggested planets as the place Urchi's finds come from ("could be planets, could be something else"). Nobody answered him. The reviewed finds design sends Urchi to a random far point. Its real destinations come late: the landing of a fallen star (v1.5), wreck days (parked until one of his public repositories is archived or finished), and the drift and the moon (v3). "It names the planets" was cut. This addendum decides the question. Every claim was checked against the repository at `9b8c07c`. Typecheck is clean. To judge the art direction, I rendered mocks over real screenshots of Space. They are not code in the repository; see "What I checked".*

**The ruling.** No planets. A planet small enough to land on is a rock, so build the rock. Each ISO week (Monday to Sunday) in his time zone (Australia/Melbourne) gets one small body: a rock, an iron, a comet, or a rock with a small moon. It is the same for every visitor, and it passes behind Urchi on two of his days that week. On those days the outing's far point is the body. Urchi lands on it, kicks up dust, and brings back something from that body. The real planets stay out of Space's sky (last section).

---

### What I checked

| Claim | Where |
|---|---|
| The line's length: pulled straight, Urchi's middle reaches 60% of the room's width from the left edge (85% on a phone), less the clip's offset. That is 847 px at 1440 wide, and about 325 px at 390. | `Float.ts:41-48`, `:313-316` |
| Its root is 6 px past the left edge, 56% of the way down. | `Float.ts:40`, `:302-305` |
| It is a rope, not a rod. It is taut from its length on and slack again 2 px short of it (`LINE.slack`). Past its length it is a spring with about 20 px of give when flung at 1500 px/s. | `Float.ts:98-106`, `:982-987` |
| Urchi's own swims keep the clip within 92% of the length (`SWIM.slack`), so the line never pulls straight by itself. | `Float.ts:143`, `:802-806` |
| The length is measured in room px, and the zoom shrinks only the figure. At the far zoom the same line lies in long, loose curves. | `Float.ts:313-316`; `RoomScene.ts:270`; screenshot below |
| Afloat, Urchi is about 303 px tall at 1440 × 900 and about 161 px at 390 × 844. On a desktop the line is 2.8 of its heights long; on a phone, 2.0. | `RoomScene.ts:81-90` |
| The finds draw the far figure at an effective zoom of 0.08, "about seven cells tall": 24 px on a desktop and 13 px on a phone. | `reviewed/space-finds.md:156` |
| A sky layer's per-frame work is "uniforms only". Its `pixelSize` is "Reserved ... Nothing reads it yet." The README promises the sky is "never pixelated". | `layer.ts:59`, `:24`; `README.md:7` |
| The sky has one layer, typed as stars only. Every layer draws behind the motes (−1), the line (−0.5) and Urchi (0). | `Sky.ts:12`, `:189`, `:42-43` |
| The pixelation shader cuts the screen into cells on its own grid (`gl_FragCoord`), so two things drawn at one cell size share their cells. | `Urchi.ts:46-52` |
| The finds' code reserves two bits (`variant`). Its sky field holds only the variant, so a code cannot record that a star actually crossed. | `reviewed/space-finds.md:356-364`, `:381` |
| Wreck days are two a week, chosen from the ISO week in his zone. They stay parked until a public repository is archived or finished, with no fictional derelicts meanwhile. | `reviewed/space-finds.md:1000`; `decisions.md:250` |
| The one light every find is painted by comes from above, a little right and toward the viewer. | `character.ts:754` |
| Urchi's head planes run from `#040404` to `#1C1C1C`, and the finds paint rocks in them ("it thinks the rock is a relative"). | `LiveIcon.tsx:23`; `reviewed/space-finds.md:229`, `:429` |
| The quirks a landing needs already exist: `brace` ("brought up short: arms out in front") and `reachFor`. | `limbs.ts:360`, `:761` |
| Motes drift at 4-12 px/s. | `Motes.ts:26` |

**Mocks** (scratchpad, not the repository):
- `planets/desk-far.png`: Space at the far zoom, rendered by Playwright.
- `planets/mock-day.png`: a stone rock in the far band while Urchi floats near.
- `planets/mock-stone-crop.png`, `mock-iron-crop.png`, `mock-comet-crop.png`: each kind with the far figure landed on it, pixelated at the far figure's own cell.

They changed three decisions in this addendum:
- The iron ramp is darkened. In the suit's own grey it outshone the white suit.
- The comet has no tail. Pointing away from the site's one light, the tail pointed down and read as a lander's exhaust.
- The stone ramp's lit end is lifted slightly. Without it the facets did not read at 3-4 px cells.

---

### Planets: for and against

**For.**
- It is his idea.
- A planet is the most legible "somewhere" in space. A ringed disc reads at a glance, even in a share image.
- It would give an outing a place to go instead of a random point.
- Real planets could tie the sky to the world.

**Against.**

1. **Scale against the tether.** The line is a fixed piece of screen: 847 px at 1440 wide, which is 2.8 of Urchi's heights. It is a real rope. It is slack in lazy curves until its length, taut 2 px later (`Float.ts:106`), and Urchi's own swims stay inside 92% of it (`:143`). An outing pays out only enough line to reach its far point, with 15% to spare (`space-finds.md:159`), and that point lies 55-80% of the way across the room (`:148`). So everything Urchi can reach is on this screen, about a line's length from the left edge, and it arrives there as the far figure, 24 px tall.
   - **A planet it can land on.** To read as a planet beside a 24 px figure, a body has to be twenty or thirty times its height: 500-700 px. That is most of a 900 px room, and bigger than Urchi afloat (303 px). And the tether would visibly reach a thing whose size says it is thousands of kilometres across.
   - **A planet it cannot land on.** Then it is scenery, and the outing still goes to a random point.
   - **Anything small enough to leave the room quiet** is about three or four figure-heights across (72-97 px). With a figure on it, that reads as a rock, whatever it is painted as. Saint-Exupéry called his an asteroid.
2. **Two colours.** A planet is colour: Jupiter's bands, Mars's rust, Neptune's blue. The rule is that colour only comes from something, and that saturation lives in the eyes, the suit's two amber lights and a gem's lit facets. A planet would be the largest coloured area on Space, larger than the eyes, and would come from nothing. A grey planet is just a large moon. Small bodies are the opposite: comet nuclei and the dark asteroids are among the darkest objects in the solar system. The site's two colours are what they actually look like.
3. **The quiet sky.** The README's sky is "mostly tiny stars and a few large". Its rarities are a Milky Way (one in five), a warm sky (one in twelve) and a shooting star (one in fifty). A disc would be the biggest thing in the sky every time it appears.
   - As a sky layer it could not work anyway. A layer's frame is uniforms only (`layer.ts:59`), so a turning, lit body cannot be repainted there. The sky is also never pixelated, so a far body would stay sharp while the figure landing on it turned to cells.
4. **Wreck days.** A wreck is the destination that means something: his finished work, found in pieces that link to its case page. A planet is a bigger spectacle than a 6-10 facet wreck, and it would be there first and for months, because wrecks wait for an archived or finished public repository. It would set a scale the wrecks could never match. Naming is also his job (the reason "It names the planets" was cut), and invented planets need invented names: more of the hours only he can spend.

   *Decided (`decisions.md:248-253`; item 5, on private work): private repositories are never named, and a wreck's label names its project ("at the wreck of {project}"), so only a public repository can become a wreck. "Finished" is the data rule, archived or no push for six months with a release, not the status word.*

**The options, decided.**

| Option | Decision | Why, in one line |
|---|---|---|
| A planet Urchi lands on | No | To read as a planet it would fill the room, and the rope would show it is 850 px away |
| A planet far off, as a sky layer | No | Scenery Urchi cannot visit, colour from nowhere, and a layer cannot repaint or pixelate |
| **One small body a week** | **Yes** | It fits the rope, the two colours and the quiet sky. It claims nothing about his work, so wrecks keep their meaning |
| The random far point | Kept | For the five days in seven with no body |
| Fictional derelicts until wrecks exist | No | Already decided (`decisions.md:250`) |

**What would change it:** if Space's sky ever becomes his real sky, real planets come with it, as points, never as places to land (last section).

---

### The rock that passed

**Pitch.** Most weeks something small passes behind Urchi, the same for everyone. On its two days Urchi goes out to it, lands, and brings back a piece.

#### How it works

1. **The week's body** (new `src/engine/finds/rock.ts`, pure).
   - `weekOf(day)` gives the ISO week of his day in `TIME_ZONE` (`"Australia/Melbourne"`), from `day.ts`, which falls back to UTC and never to the visitor's day.
   - `rockOf("2026-W50")` hashes `"rock:1:" + week` with `random.ts` and draws a kind by weight: stone 45, iron 20, comet 25, a rock with its moon 10.
   - It then draws the rest from the same hash: the long axis (3-4 heights of the far figure), a tumble axis, a tumble period (180-360 s) and the hull's seed.
   - Every visitor gets the same body. It needs no server and no storage.
   - `rockOf` is frozen with the finds' v1 tables, because find codes decode through it.
2. **Its two days.** `passOf(week, taken)` picks two consecutive days of his week.
   - `taken` holds the wreck days, once they exist, and the day before and after each shower peak that the sky calendar shows in his sky (`reviewed/strategy.md:1292`). With `HEMISPHERE = "south"`, that is every shower the calendar marks for the south, and never the Quadrantids or the Perseids. The first pass, in 2026-W50, loses Sunday 13 December to the Geminids (peak about Monday the 14th), so it falls between Monday 7 and Saturday 12 December.
   - Two days taken out of seven leave five in at most three runs, so one run is always at least two days long. With wreck days alone, the body never misses a week. If showers leave no two consecutive days free, nothing passes that week.
   - The kind depends only on the week. Wreck days can move the body's days when they arrive, but never what a find from it is. Wreck days start with the ISO week after they ship.
3. **The pass.** It starts at his midnight at the start of the first day and ends at his midnight after the second (47 or 49 hours at a daylight-saving change: in Melbourne, a pass over Saturday 2 and Sunday 3 October 2027 is 47 hours, and one over Saturday 3 and Sunday 4 April 2027 is 49).
   - **Path.** Its middle travels on a gentle arc: on a desktop from `x` 0.80 to 0.50 of the room's width, with `y` running 0.30, then 0.25 at the middle, then 0.32. On a phone, `x` 0.70 to 0.50 and `y` 0.24, 0.20, 0.26. These are shares of the room, like the far point (`space-finds.md:148`), and its box stays 64 px clear of the zoom slider on the right edge (`CreativeSpacePanel.tsx:234`) and of the finds' pocket in the top-right corner.

     *Ruled in the summary: the sound chip moves into the nav, and the pocket takes the top-right corner on every screen. The path's highest point is a quarter of the way down on a desktop (225 px at 900 tall) and a fifth on a phone (169 px at 844), so the body, its coma and its moonlet stay well below that corner.*
   - **Speed.** That is 432 px in 48 hours at 1440 wide, about 9 px an hour. It never visibly moves within a visit, but it has moved by the evening.
   - **Tumble.** It turns once every three to six minutes, so its lit facets change slowly.
   - **Its ends.** It dithers in over the first twenty minutes of its pass and out over the last twenty.
4. **When it shows.** It is there only while afloat, and it comes and goes with the sky: the float-in, the flight home, a tab's slide. It reads the sky's presence through a new public getter (`Sky.ts:75` is private now).
5. **Urchi notices it.** A new `TargetKind` `"rock"` has a floor of 0.5 (`attention.ts:36`, `:70`).
   - **The first sight of a visit** is a new `noticeRock` act. Urchi looks for 1.2 s and gives the owl's bob, "judging a distance". For a stone it adds a slow blink, because rocks are its relatives. For an iron, it looks again whenever the glint catches.
   - **After that,** the rock is where its bored looks go.
   - **What a watcher learns.** The finds' tell, "it looks off into the corner again, and this time it goes", becomes "it looks at the rock again, and this time it goes".

   *Ruled in the summary: at most one arrival act a visit (a gift parcel, the news look, the rhythm greeting, recognition). `noticeRock` is not one: it plays only after a float-in, never on arrival, and its caption waits if a news line already holds the slot.*
6. **On its days, the outing goes to it.**
   - `setOff`'s far point is the body's anchor, through the far point override `Outing` needs for the fallen star (`space-finds.md:972`). This branch builds it first, and the fallen star reuses it.

     *Ruled in the summary: the fallen star is on the "Later (December onwards)" list, after this build, so the override cannot wait for it.*
   - The anchor is the body's shoulder facing the line's root, so the line never crosses the body's face.
   - The finds' depth clamp gives way to the body's own scale: `figureDepth = rockScale / room.zoom`. The far figure and the body then share a depth and a pixel cell.
   - Eligibility, the ask, the 9-second swim out and the reel all stay as designed.
7. **Touchdown** (a new outing phase `landing`, 1.2 s).
   - It arrives soles first: turned to the surface's normal, but never more than 0.6 rad from upright, so its head stays up. It lands in the `brace` pose, arms out in front, legs together.
   - Dust kicks up: small squares of one cell each, painted into the body's own canvas so they pixelate with it.
     - **Stone:** six to ten cells rise from the contact at 3-6 px/s, hang, and settle back over six seconds. On a body with almost no gravity, dust falls slowly.
     - **Iron:** two or three cells, which leave and do not come back.
     - **Comet:** eight to twelve pale cells, which drift away from the light and fade. **It bounces once:** it leaves the surface to 0.4 of the body's radius and settles 1.5 s later. Philae bounced on its comet in November 2014, and nothing on the site says so.
8. **The rummage** (a new phase `on`). The rummage times stay the tier's (`space-finds.md:162-172`).
   - Every 1.5-3 s it reaches down with alternate hands (`reachFor` toward the surface), and each reach kicks up a cell or two.
   - Every other reach it shuffles a little way along the rim, up to 6% of the outline.
   - It looks down (`att.eyes(0, 0.8)`).
   - **Staying on as it turns.** The anchor is recomputed on each repaint, and the drive's spring keeps the figure on it, the way you keep your feet on a turning barrel.
   - The twitch and the glint come as designed. It pushes off with three cells of dust from its feet and swims home one-armed.
9. **What it brings back.** The tier is drawn first, as always (`space-finds.md:370`), so **the body changes what Urchi finds, never how rare it is.** The pacing is unchanged (three outings a day, the first always fruitful), as already decided (`decisions.md:254`).

   | Body | Leans toward (each type ×4 within its category, and those categories ×2.5) | Fewer | Found only here (new) |
   |---|---|---|---|
   | Stone, or a rock with its moon | Basalt (#12), Olivine (#33), A rock (#13) | rubbish ×0.2, ice ×0.5 | **Regolith** (#65) |
   | Iron | Iron, pitted (#31); Iron, etched (#40); Pallasite (#41); A magnet (#25) | rubbish ×0.2, ice ×0.3 | **Nickel-iron** (#63) |
   | Comet | Comet ice (#19), Clathrate (#43), A frozen drop (#35) | rubbish ×0.2, gold ×0.3 | **Comet crust** (#64) |

   The new types, in the catalogue's columns:

   | # | Name | Caption | Then | Handover | Business | Made as | Tier | When |
   |---|---|---|---|---|---|---|---|---|
   | 63 | Nickel-iron. | Nickel-iron. It prised it off in a curl. (39) | slowBlink | proud | held up high like the bolt; the wrist dips with the weight (`wrBend` +12) | shard bent on a seeded arc, steel | uncommon | rock: iron |
   | 64 | Comet crust. | Comet crust. Dark outside, ice inside. (38) | longBlink | sincere | handed over fast, as ice is | rock in the head's material with one cut face in the ice ramp | common | rock: comet; the ice melts |
   | 65 | Regolith. | Regolith. It brought it back cupped. (36) | slowBlink | sincere, in both gloves (`cradle` on both sides) | two cells escape between its gloves on the way home | five to seven tiny rocks, head material, 16 planes in all | common | rock: stone |

   Labels:
   - **#63:** "Kamacite, a shaving. About six per cent nickel." / *"It thinks it is a bolt, not finished yet."*
   - **#64:** "Dust and ice, mostly dust." / *"The ice goes. The dark part keeps."* Its ice face shrinks over twenty minutes, as ice does (`space-finds.md:716`), and the crust stays: "Only the crust now. The ice went on 8 December."
   - **#65:** "Dust and grit, a pinch." / *"Most of it got away."*
10. **Home.** The depth eases back, the line reels in, and it presents the find as designed. Coming home with nothing from the body, the hover caption reads "Nothing. The rock was all rock."

#### How it looks, sounds and reads

**The look.** It is one hull, painted by the finds' own `shape.ts` and `paint.ts`, sitting in the room's plane at the far depth. It is never a sky band.
- **Shape.** A `body` preset of the rock recipe: 18-28 points on an ellipsoid with axes 1 : 0.55-0.8 : 0.45-0.7 and roughness 0.2-0.35, merged to at most 40 planes (the finds' budget). One crater is an inset plane. It is a knapped potato, never a sphere.
- **Size.** 72-97 px on a 1440 screen and 39-52 px on a 390 phone. That is bigger than any glint in the sky (14-22 px) and at most a third of Urchi afloat.
- **Depth.** Its scale is `0.08 × room.zoom^0.2`. It follows the zoom slightly more than the nearest band of stars does (`zoomResponse` 0.18), and far less than Urchi.
- **Pixelation.** It is pixelated in the room's own cells for that depth (`cellFor`, `RoomScene.ts:314`, made public), so a landed Urchi and its body are drawn on one grid.
- **Draw order.** `renderOrder` −2: over the sky (−100), under the motes (−1), the line (−0.5) and Urchi (0). Motes drift in front of it, the line crosses in front, and Urchi is always nearer.
- **Rim and light.** Urchi's white rim goes round it, one cell wide. It is lit by the one `LIGHT`.

**Material, by kind.** Every colour comes from a ramp the site already has. Nothing but the comet's coma is above OKLab chroma 0.03. The coma's `#cddbff` is 0.052, a star colour the sky already draws (`defaults.ts:46`), laid down at 6-10% dither density. Everything stays far under the gems' cap of 0.12, which applies to lit facets only (`decisions.md:236`).

| Kind | Ramp | Rim | Its tell from across the room |
|---|---|---|---|
| Stone | Urchi's head planes, `#040404`, with the lit end lifted from `#1C1C1C` to `[60,60,64]` so facets read at 3-4 px cells | white, one cell | It looks like Urchi's head: black, faceted, white-rimmed. A relative |
| Iron | a darker cut of the suit's grey, `[40,40,40]` to `[140,139,135]`, so it never outshines the white suit | white | the finds' glint on its most-lit vertex whenever a facet turns square to the light (n·L ≥ 0.95): a slow flash every minute or two |
| Comet | the head's planes for the nucleus, plus a coma of the sky's own pale blue `#cddbff` (`defaults.ts:46`) in the finds' Bayer dither, 6-10% dense out to 1.6 radii | white | A few cells shed, drift away from the light at 2-4 px/s, and fade over six seconds. No tail |
| A rock with its moon | stone, plus a moonlet a fifth of its long axis going round it every four minutes, behind and then in front, painted in the same canvas | white | it moves |

**Sound** (off by default; with sound on only).
- Phase 1 adds no new cue. The touchdown is the finds' stone thud, `sfx.pluck(110, "thud")`, at 0.3: heard from far off.
- Once the finds' phase-2 cues exist, it becomes the knock (stone), the clink at half level (iron), or the crackle at 0.05 (comet).
- As with every find cue, all of it plays at 60% during his night.

**Reads.** A new `ROCK_STATES` goes in `site.ts`, beside `URCHI_STATES`. These are state lines, in the site's third person. The captions about Urchi are his.

| When | Caption (grotesk word / serif line) | Chars |
|---|---|---|
| First sight of this pass: rises by itself in the `news` slot (`CreativeSpacePanel.tsx:113`), on a phone and a desktop | **Rock** / It is passing this week. Basalt, mostly. | 40 |
| | **Rock** / It is passing this week. Mostly iron. | 37 |
| | **Comet** / It is passing this week. A small one. | 37 |
| | **Rock** / It is passing this week, and so is its moon. | 44 |
| A later visit in the same pass (once) | **Rock** / Still passing. It has moved since Monday. | 41 |
| | **Rock** / Still passing. It has moved since this morning. | 47 |
| His night, on hover | **Rock** / It is passing tonight. Urchi is asleep. | 39 |
| Hovering the far figure while it is on the body | **Urchi** / It is on the rock. Give it a minute. | 36 |
| Home with nothing from the body | **Urchi** / Nothing. The rock was all rock. | 31 |
| The first comet landing in a browser | **Urchi** / It bounced. They do, on comets. | 31 |

- **Live region** (new lines):
  - "A rock is passing this week." (once a pass)
  - "Urchi has swum out to the rock."
  - "Urchi is back from the rock. It is holding nickel-iron."
  - "Urchi came back from the rock with nothing."
- **Control name:** "Call Urchi back from the rock".
- **No cursor word.** Over the body only a caption appears. Nothing sends Urchi out (the finds' rule 1), so the body is not a button.

**Label clauses.** These go after "at the wreck of {project}." in the finds' provenance order (`space-finds.md:593-603`). The gift clause still wins for gifts.
- "on the rock that passed this week." (the same ISO week in his zone), or "on the comet that passed this week."
- "on the rock that passed the week of 7 December." (any later week)
- "brought back from the rock that passed on Tuesday, while you were out." (a pending find)
- "asleep afloat, as the rock went by." (the asleep handover)

```
Nickel-iron.
Kamacite, a shaving. About six per cent nickel. Three grams.
Found by Urchi at 16:40, 8 December, on the rock that
passed this week. Its eyes were denim.
It thinks it is a bolt, not finished yet.
```

**The Notes log line** when it ships: "A rock passes most weeks now. Urchi goes out to it."

#### Where it lives

- **On Space,** afloat only, because that is where the sky is.
- **In the drawer's labels,** and in `/f/<code>`'s title and description.
- **On About,** as a full stop, if carried there.
- **Not on the Desk,** where Urchi never goes.
- **Not in the Sky tool's lock screens,** which export sky layers, and the body is not one.

#### Data and persistence

**No backend.** The body is a pure function of the week, and its place is a pure function of the time.

**The find code: the reserved bits, no version bump.** The two `variant` bits (`space-finds.md:363`) become `where`:

| Value | Meaning |
|---|---|
| 0 | the open sky, as every code minted before this change has |
| 1 | the week's body |
| 2 | where a star came down |
| 3 | reserved (the moon, v3) |

- **Value 2 also closes a gap in the fallen star (§4).** The sky field holds only the variant (`:360`), so `findOf(code)` cannot currently know that a star actually crossed, and a gift of "A piece of a shooting star" could not be rebuilt.
- **Why no version bump.** The body's types are eligible only when `where` is 1, and they are filtered out before the weighted draw. Every earlier code therefore still builds the same object, and a version bump would split one catalogue in two for nothing.
- **What would force one:** anything that changes the tier odds or the order of the existing types.
- **One requirement.** `findOf` must read the day field as his day, as the hour beside it already is. Then `rockOf(weekOf(day))` recovers the body.

**Store.** One optional field on `eigengrau:finds`, written through `store.ts`'s `keep()`, so no migration is needed (`space-finds.md:747`). Trust is untouched: it lives once, in `eigengrau:urchi`, and the body feeds it nothing.

```ts
rocks?: Record<string, { seen: number; landed?: true; at?: [number, number] }>; // week → first seen (ms), landed on, where it was last seen (shares); last eight weeks
```

**Counts.** `find_taken` gains a property `where` ("sky", "rock" or "star"), so it is sent as `find_taken { tier, where }`. There is no new event. `/kept` prints each event's fields exactly as sent (`decisions.md:139`), so its line gains `where` in the same commit.

#### Implementation sketch

**New**

```ts
// src/engine/finds/rock.ts (new): no DOM, no three.js; imports random.ts and day.ts only
export type RockKind = "stone" | "iron" | "comet" | "moon";
export type Rock = { week: string; kind: RockKind; seed: number; long: number; axis: [number, number, number]; tumble: number };
export const ROCK = {
  kinds: { stone: 45, iron: 20, comet: 25, moon: 10 },
  depth: 0.08, zoomResponse: 0.2,                 // its scale against Urchi afloat at zoom 1; how far it follows the zoom
  long: [3, 4],                                   // its long axis, in heights of the far figure
  path: { x: [0.8, 0.5], y: [0.3, 0.25, 0.32] },  // shares of the room: start, middle, end of its pass
  phonePath: { x: [0.7, 0.5], y: [0.24, 0.2, 0.26] },
  sliderClear: 64, tumble: [180, 360], ends: 20 * 60,
  moon: { size: 0.2, orbit: 2.1, period: 240 },
  kick: { stone: [6, 10], iron: [2, 3], comet: [8, 12], speed: [3, 6], settle: 6 },
} as const;
export function weekOf(day: string): string;                                          // "2026-W50"
export function rockOf(week: string): Rock;                                           // frozen with the finds' v1 tables
export function passOf(week: string, taken: ReadonlySet<string>): [string, string] | null;
export function rockAt(now: number): { rock: Rock; t: number; day: string } | null;  // t: 0..1 along its pass
```

- `src/engine/finds/RockSprite.ts` (new): one plane in the room's scene.
  - It uses a `CanvasTexture` of at most 128² (192² for a comet with its coma), painted at cell scale, because it is always pixelated.
  - It draws with Urchi's smooth fragment shader, as `FindSprite` does, with `uPix` set for its own depth and `uDither` for its ends.
  - Its methods: `set(rock, t)`, `anchor()` (room px and the surface's normal), `kick(n)`, `hit(x, y)` and `dispose()`.
- `src/content/finds.ts`:
  - types #63-65, with a new condition `when.rock`;
  - `ROCK_FINDS`, the leanings table above;
  - the label clauses.
- `site.ts`: `ROCK_STATES`.
- `/dev/finds?rocks=52` draws a year of bodies on one page, as the finds' sixty-four seeds are drawn. `?rock=2026-W50` puts a given week's body in today's sky; it is development only and refused in production, like `?day=`.

**Changed**
- `src/engine/finds/`:
  - `code.ts`: `variant` becomes `where`.
  - `make.ts`: the leanings, applied after the tier.
  - `context.ts`: `snapshot()` reads `rockAt(now)`.
  - `shape.ts`: the `body` and `moonlet` presets.
  - `paint.ts`: cell-scale painting, dust cells and the coma.
- `Outing.ts`: the far point override (shared with §4); phases `landing` and `on`; the comet's bounce.
- `RoomScene.ts`: `cellFor` (`:314`) becomes a public `cellAt(zoom)`; `figureDepth` (the finds') is set from the body.
- `Sky.ts`: a public `presence` getter (`:75`).
- `attention.ts`: `TargetKind` gains `"rock"`, with a `FLOOR` entry.
- `acts.ts`: `noticeRock` and `land`. The latter is a generator with a `finally`, as the others are, and runs `brace`, then `reachFor` with alternate hands. No new quirk is needed.
- `src/engine/space/Space.ts` (extracted from `CreativeSpacePanel.tsx`'s effect in week 3, before finds, so this work lands there and not in the hot-spot file):
  - mount the sprite on the body's days while afloat;
  - the hit order: Urchi near, then the far figure, the offered find, and the body last;
  - the caption lines and live lines.
- `src/lib/day.ts`: `isoWeek(day)`.
- `src/engine/space/sky/calendar.ts` (strategy §10): `showerDays(week)`.
- `README.md`: a sentence in the Space row.
- `src/lib/count.ts`: `where` on `find_taken` in `EVENTS`, and `/kept`'s line with it.

**Tests** (Vitest)
- `rockOf` goldens for sixty-four weeks.
- `passOf` for every week from 2026 to 2036: never on a wreck day or in a shower window, always two consecutive days or none, and the body's kind the same with wreck days on or off.
- The tier odds under `where = 1` within 1% over 100,000 draws.
- Sixty-four codes minted before the change still build identical finds.
- A Playwright run with `?rock=` at 1440 and 390, at the start, middle and end of a pass.

#### Edge cases

| Case | What happens |
|---|---|
| **Phone** | The phone path and sizes (39-52 px). The hit area is at least 44 × 44 px, and a tap raises the caption and makes Urchi look; it never sends Urchi out. The first-sight caption rises by itself (`PHONE_CAPTION`, `CreativeSpacePanel.tsx:58`). Test at 390 and at 320. |
| **Reduced motion** | The body sits still at the middle of its path on both days. It does not tumble: a seeded pose with at least one facet lit above 0.9. The moon holds its angle and the comet sheds nothing. It still dithers in and out at its ends (a dither is not motion). An outing is a cut: Urchi dithers out where it floats and dithers in on the body, crouched, with the line at 20% (as the finds' reduced-motion outing is). A still scatter of five cells appears with it and goes when it leaves. The comet does not bounce. The whole loop is there. |
| **Sound off** | Silent. The dust, the twitch and the glint carry it. |
| **His night, 01:00-06:59** | It passes while Urchi sleeps: it drifts and turns, and nobody goes out. Hovering it: "It is passing tonight. Urchi is asleep." The asleep handover (phase 2) sends its small thing in from the body's side, labelled "asleep afloat, as the rock went by." An outing already on the body when night begins finishes as the finds say: it comes home and dozes holding the find. |
| **Returning visitor** | A later visit in the same pass gets "Still passing. It has moved since Monday." (once). Missed days leave pending finds on the spikes: "brought back from the rock that passed on Tuesday, while you were out." On the first float-in of the week after a pass they saw, Urchi looks at the empty place where it was for 0.8 s, and nothing says so. |
| **A star falls on a body day** | The landing wins the next outing, because it is rarer, and then the body resumes. The star is the one shared crossing event from `Stars` that the summary rules is built once (reconciliation 7). |
| **A shower night** | The body's days avoid it, so the sky is never busy with both. |
| **Wreck days arrive** | They take their two days first, from the ISO week after they ship. No find changes. |
| **`?still`** | The body is hidden unless `?rock=` is given (development only), so screenshot baselines do not depend on the date. |
| **`?sky=` links, and Sky exports** | Unaffected. The body belongs to the week, not to the visit's sky. A frozen sky version (`sky/versions.ts`, version one from the Sky tool's first commit) never includes it. |
| **Zoom, resize, two tabs, a hidden tab** | Its scale follows `zoom^0.2`. Its place is kept as shares of the room. It is the same in every tab. On return it is wherever the time puts it. |
| **Private mode** | It works fully. "Still passing" never shows, because nothing is remembered. |
| **A hand-made or gifted code with `where = 1`** | It decodes to that week's body. The gift clause wins on the label. A forgery is caught by the existing check or is harmless. |

#### Effort

**M: four days,** after finds phase 1. The far point override is built here, on day 3, and the fallen star reuses it later.

| Day | Work | Done when |
|---|---|---|
| 1 | `rock.ts`; the shape presets; cell-scale paint; `RockSprite`; `/dev/finds?rocks=52` | A year of bodies looks like one family, and each reads at 320 px |
| 2 | The pass (path, days, exclusions, sky presence); `noticeRock`; captions; live lines; hit order | Playwright shows it at the start, middle and end of a pass at 1440 and 390 |
| 3 | The landing: override, touchdown, staying on as it turns, dust, the bounce, the rummage; `where` in the code; the leanings; #63-65 | Outings land and bring back pieces of their body, and the golden codes pass |
| 4 | Phone, reduced motion, night, returning, the tests, the README | Every row above is checked |

- **When:** build it in the week of 30 November, the week after the public launch. The first body passes in ISO week 50 (7-13 December). It is the first thing on Space that changes after launch, and it gives a launch visitor a reason to come back. Plaintext's week 1 starts the same Monday, 7 December, on the Desk (`decisions.md:281`); the two share no files.
- **Darius's time:** none. The lines above ship as written, as the finds' words do, and his rewrites replace them without code.

#### What it shows about him

- **Scale sense and restraint.** His own idea, answered with the rope's arithmetic rather than taste.
- **A shared world from a date seed, with no server.** The wreck days will reuse the rig: the body in the room's plane, the far point override, landing on something and riding it, and the week's seed.
- **Small-body literacy, worn lightly.** Irons that are the cores of broken things, basalt, a comet's dark crust over ice, a bounce on a comet.
- **Care with data that lasts.** The code carries the week without a version bump, and a test proves that no earlier find changed.

#### Risks, and what keeps them small

1. **Saint-Exupéry's picture.** A small figure on a small world is the Little Prince. The body is never round, Urchi never stands upright on it (it clings in a crouch, as you would in zero gravity), and it has no rose and no lamp.
2. **Wallpaper.** It is absent on at least five days in seven and in shower weeks. Its caption shows once a pass.
3. **A dark thing on a dark ground at 3-4 px cells.** The rim carries it, and the lit end of the ramp is lifted. **Changes if** it reads as a hole at 320 px wide: then the lit end goes to `[84,84,88]`.
4. **Upstaging the wrecks.** It has no sets, no fling, no relics and no links, and it never names anything. Wrecks keep all of those.
5. **Taken for a real asteroid.** It has no name and no designation, because designations belong to real objects and someone would look one up. Nothing claims it is real. The sky calendar is where the site tells the truth about the sky.
6. **Seen by few.** It needs Urchi afloat on one of two days. The first-sight caption reaches everyone who floats, and pending finds bring it to those who were away. **Changes if** after eight weeks `find_taken` with `where: rock` appears on fewer than one pass in four: then it passes on three days, never more.
7. **Cost.** One draw call while afloat on its days. About three repaints a second while it turns and up to fifteen for six seconds of dust. None while hidden. No new WebGL context.

---

### The real planets in tonight's sky

**No: the real planets visible from Melbourne tonight do not appear in Space's sky.**
- **Its sky is invented.** Each visit draws its own from a seed (`Sky.ts`, `README.md:7`), and its stars sit where no real star is. A true Jupiter among invented stars is a true thing in a false place. The room has no horizon and no east, so "Jupiter, low in the east" has nowhere to be.
- **Drawn true, a planet is just another star.** At the room's scale it is a steady point, Jupiter at its brightest about magnitude −2.9, and only a label could say which point it is. Labelling things in the sky is what "It names the planets" was cut for. Drawn as a disc, it lies.
- **The astronomy belongs to That night.** Standish's orbital elements are That night's work. That tool comes last in the queue, only on demand, and its first version already has no planets (`decisions.md:319`). Building that astronomy first for Space would reverse the queue, for a feature no visitor could check without a label.
- **The sky already keeps real time where anyone can see it.** Meteor showers on their real nights, in his hemisphere, the south (strategy §10). Later, the Moon in its real phase where he lives (`space-finds.md:1123`), which anyone can check by looking up.
- **What would change it:** That night gets built with planets under its demand rule, and Space's sky becomes his real sky: the true stars over Melbourne at his hour. Then the planets come with it as points, named only in a hover caption and never places Urchi can go.

---

### Decisions

*The owner is asked nothing, and this addendum put no question to him. These are the decisions it depends on; the merged ones point to `decisions.md`, which wins where this addendum disagrees, and the summary's rulings win over both. Each line gives the decision, its reason, and what would change it.*

1. **No planets; one small body a week.** A rock, an iron, a comet or a rock with its moon, on two days of his week. *Why:* it fits the rope, the two colours and the quiet sky, and leaves the wrecks their meaning (this addendum). *Changes if:* Space's sky becomes his real sky; then the real planets come as points, never places to land.
2. **Where he is.** `TIME_ZONE = "Australia/Melbourne"`, `HEMISPHERE = "south"`: his ISO week, his midnights for the pass, his night for sleep, and the southern showers that take days from the body. *Why:* his commits carry +10:00, and his public coursework is a Swinburne unit. *Changes if:* he moves city (decisions, item 1).
3. **Wreck days stay parked,** until a public repository is archived, or has had no push for six months and has a release; no fictional derelicts meanwhile, and the body's kind never depends on them. *Why:* private repositories are never named, and a wreck names its project. *Changes if:* he archives a repository (decisions, Space finds 4; item 5).
4. **Pacing is unchanged.** Three outings a day, the first always fruitful; the body changes what is found, never how rare it is. *Why:* there are no counts yet to tune against. *Changes if:* the review on Monday 23 November says so (decisions, Space finds 5).
5. **Colour.** Every ramp stays at or under OKLab chroma 0.03 except the coma's star blue (0.052, dithered), all far under the gems' 0.12 on lit facets. *Why:* colour only where it comes from something. *Changes if:* the body reads as an accent at 320 px; then the coma drops to the ink ramp (decisions, Space finds 1).
6. **Counts.** No new event: `find_taken { tier, where }`, through Umami, cookieless and same-origin, with `/kept` printing the fields exactly as sent. *Why:* `where: rock` is the only way to know whether anyone sees the body. *Changes if:* the rule in risk 6 fires (decisions, item 7).
7. **The words ship as written.** The captions, labels, live lines and log line above, with his rewrites replacing them without code. *Why:* his hours go to `WORK_LINE`, the `why` and `did` lines and notes. *Changes if:* he writes his own (decisions, Space finds 2).
8. **Gifts are copies.** A gifted code with `where = 1` rebuilds that week's body, the gift clause wins on the label, and the forgery check stays quiet. *Why:* security here is defensive only, and nothing invites anyone to try (decisions, Space finds 3).
9. **Not on the Desk,** and never in a Sky export or a frozen sky version. *Why:* Urchi never comes to the Desk (summary, "Who owns what"), and the body is not a sky layer (decisions, Tools 3).
10. **The pocket and the slider.** The body's path stays clear of the zoom slider on the right edge and of the pocket in the top-right corner. *Why:* the summary's ruling on "The pocket's place".
11. **The far point override is built here,** on day 3, and the fallen star reuses it. *Why:* the summary's roadmap puts the fallen star in December or later, after this build. *Changes if:* the fallen star ships first; then this branch reuses its override and saves half a day.
12. **When.** Built in the week of 30 November, first pass in 2026-W50 (7 to 12 December), with Vitest goldens and `/dev/finds` as the visual grid. *Why:* it is the first change on Space after the public launch, and the summary rules one test runner. *Changes if:* the launch moves; the body then follows it by a week.
13. **The real planets stay out of Space.** That night comes last, only on demand, and its first version has no planets. *Why:* an invented sky cannot hold a true planet in a true place (decisions, Tools 5).
