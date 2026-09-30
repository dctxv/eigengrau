## Urchi: making it feel alive

*Reviewed against the repo at `9b8c07c` (29 Sep 2026). Nothing in the repo was changed. Under review: "Urchi, alive: an audit and an upgrade plan".*

*Final version: made consistent with the lead's summary (`00-summary.md`), whose rulings override this section, and with `decisions.md`. The owner is asked nothing; where the first draft asked, the choice is made below and listed under "Decisions" at the end.*

### Review verdicts

**What I checked**

- I opened every file the proposal cites and spot-checked about 150 of its `file:line` references across `character.ts`, `attention.ts`, `acts.ts`, `limbs.ts`, `Faces.ts`, `Call.ts`, `Float.ts`, `Motes.ts`, `sky/Stars.ts`, `sky/tune.ts`, `sky/seed.ts`, `sky/defaults.ts`, `lib/visits.ts`, `audio/sfx.ts`, `RoomScene.ts` and `CreativeSpacePanel.tsx`. Nearly all of them land on the line they describe. This is an unusually well-grounded proposal, and the probe in its Part 1.1 is the right way to start.
- The mesh facts hold. The mesh has 84 vertices, 164 triangles and 108 planes. The eye is `rx 100, ry 103.1` with a pupil of `prx 57, pry 69.3` and `pin 18`. The ear tips are vertices 0 and 28 at `(±395.5, −436, 17.4)`, and the spikes 11/19/22 and 36/44/47 are exactly `suit.json`'s `tuck` list.
- Forty of the hundred colourways have a pupil lighter than the iris (35% by weight). Both the desktop and phone screenshots of Space happen to show one.
- The home scale holds: the head is about 435 px tall at 1440×900, so a mesh unit is about 0.5 CSS px. On a phone it is nearer 0.3 than 0.4, since the head is about 245 px tall in `phone-01-space.png`. Afloat at the default zoom the eyes are about 30 px across (`desk-03-space-afloat.png`), which makes a unit about 0.15 px.
- The pupil is clipped to the eye (`ctx.clip(eye.white)`, `character.ts:1283` and `:1368`). This matters for P1.

**Errors and conflicts with how the site works**

1. **E6 does not fix the tell it says it fixes.** By construction it "reproduces today's art-directed pupil offset exactly" at rest, so after a big turn the pupils still sit at the edge of the eye (tell 2, `step-sheet.png`). It needs a rest share below 1 (see 2.3 below).
2. **The owl's bob is not something E6 compensates.** `BOB` (`character.ts:1096`) is ±3° of *roll* plus a 10-unit sideways `shift` (`:2120-2125`). E6 counter-rotates only yaw and pitch. Countering the breath's 3.15° nod moves the pupils by about 2 units, roughly 1 px. "Its gaze stays locked on you while its head breathes" is true but close to invisible, so it should not be sold as the showpiece.
3. **E1 on its own makes tracking look stepped.** Attention re-aims every frame (`attention.ts:593-616`), so a slowly moving pointer is a target that moves every frame. Saccades with a 1.2-unit threshold would turn smooth following into a staircase. Pursuit (E4) has to ship with it, yet the proposal's four-week order never schedules E4. It also leaves out E7, E9, H2, H4, H5, B5 and B6.
4. **Several items fall below a pixel on the proposal's own scale:**
   - the glissade (3-6% of at most 10 units);
   - the undershoot and its corrective saccade (5-10%);
   - E3's drift (SD 0.9 unit, about 0.45 px) and its 0.8-3-unit microsaccades, which would leave the eyes *stiller* than today's ±3-unit flicks;
   - P3's hippus;
   - E9's 8-16 ms blink offsets (less than one 60 Hz frame), its 0-3% anisocoria and its 0.5-unit vergence bias.
5. **Afloat, detail inside the eye cannot be seen.** At about 0.15 px per unit, today's full pupil reach is ±1.5 px. P2's helmet dark adaptation, F5's nystagmus, and the slit pupils and pursuit in 6.1 are all invisible at the default zoom. Afloat, realism has to come from the head, body and limbs and from the big face shapes, which do show through the visor.
6. **A4 misses that it already looks away.** When the pointer rests, its salience (a floor of 0.3 plus fading novelty) drops under `BORED.below` (0.45) within seconds. `wander` (`attention.ts:710`, `:721-746`) then looks off and checks back on you every 3-6 s. The real tell is that these look-aways are 50° jumps to the corners of the screen, not small aversions near you. A4 and N2 are one change.
7. **A1 would change what the happy face means.** Happy is the listening face: eyes shut and arched up while *he* is playing something, with notes rising (`Faces.ts:142-143`, README). Triggering it whenever valence is above 0.3 would blur the one signal that says the owner is playing music right now.
8. **B3 can break the face swap.** `setFace` waits for the lids to reach `SHUT` 0.97 (`character.ts:2106`) and uses "a blink under way" to hide the swap (`:2396-2406`). If an incomplete blink is under way when a face is asked for, the face waits for the next full blink, and with B1's long tail that can be 10-20 s.
9. **`pointerSeen` only lasts the session.** `visits.ts` says so in its header. A returning visitor's pointer position is unknown, so the recognition double-take "at the spot where your pointer was last seen" cannot work as written.
10. **The shooting star lives in sky coordinates, not client px** (`Stars.shoot`, `Stars.ts:430-455`). In the "very rare" sky (`defaults.ts:30`, one visit in fifty) it comes back every 16-32 s for 1.8-2.6 s (`defaults.ts:76-80`). 6.1 therefore needs a coordinate transform and habituation across repeats.
11. **Captions have a limit.** The site's rule is at most 48 characters, in the owner's voice rather than the creature's (`site.ts:53-56`). "It is {time} here. It is asleep, and would like to stay that way." runs to about 62.
12. **The imports point the wrong way, and one name collides.**
    - Re-exporting `rng`, `hashSeed` and `subSeed` from `engine/space/sky/tune.ts` into `engine/urchi` reverses the dependency: Space imports Urchi, not the other way round.
    - In the sky, `tune.ts` means "resolve seeded ranges" and the numbers live in `defaults.ts`. Urchi's numbers file needs another name.
13. `sfx.air` opens the ambient bed's filter (`sfx.ts:43`). It does not say whether the bed is playing.
14. **The time zone is unset.** `TIME_ZONE` is `null` (`site.ts:16`, a TODO), so for now Urchi keeps the *visitor's* hours and only night owls see it asleep. Once a zone is set, many visitors in other zones will find it asleep. Sleep life (6.3, M10) then matters much more than the proposal's ranking allows.
    - *Decided: `TIME_ZONE = "Australia/Melbourne"`, with a new `HEMISPHERE = "south"` on the line after it (his commits carry +10:00, and his public coursework is a Swinburne unit). Melbourne moves to +11:00 on Sunday 4 October, so from then his 01:00-06:59 is New York's 10:00-15:59 (09:00-14:59 after 1 November) and London's afternoon and early evening, and a US-morning launch in the week of 23 November arrives at 01:00, the minute it falls asleep (decisions.md, item 1 and fact 5).*
15. **The dream's "cracks" are too wide.** At 0.66-0.74 shut the eye is 26-34% open. The squash (`ownEye`, `character.ts:1022-1025`) at 0.3 open is a clearly visible eye about 30 px tall. A sliver is 0.74-0.77.
16. **The ears and spikes fold in under the helmet** as the suit goes on (`headFor`, `character.ts:2045`). S1 and S2 offsets must be zero whenever `suit > 0`, or the tuck blends from vertices that have already moved.
17. **The blink hooks share state.** `setBlinkHold` changes the shared `BLINK` object (`character.ts:2357`), and `holdBlinks` works by calling `openEyes(0)` every frame (`attention.ts:419`, `:596`). Every new blink source (B4 draws, B5 bursts, B6 microsleeps) has to respect `blinksHeld`, or it will add a beat to the rhythm answer.

**What is missing**

- Stroking. It is the first thing anyone does to a cat, and nothing answers it; only a shake over the face gets a response (a glare).
- A blink reflex when something comes fast at its eyes.
- A response to the one sound every visitor makes with the site's sound off: their own clicks and keys.
- A realistic blink for the favicon, which still runs its own uniform loop (`LiveIcon.tsx:172-193`).
- A shared budget for arrival acts. The news look, a recognition and a rhythm greeting could all stack in the first ten seconds.
- A rule that every new behaviour stays off under `?still` (`character.ts:716`), which the site relies on for stable screenshots.

| Idea | Verdict | Why |
|---|---|---|
| F0.1 A toolkit for being alive (`life.ts`, numbers file, `lifelike`) | KEEP WITH CHANGES | The foundation is right. Move the seeded rng to a shared module instead of importing the sky into Urchi, rename the numbers file, and pass the flag through `Urchi.ts:166` from `RoomScene.ts:178`. |
| F0.2 Expose head, gaze and next blink | KEEP | Small, and E6, the debug panel and QA all need it. |
| E1 Saccades on the main sequence | KEEP WITH CHANGES | Worth doing, but the pupils travel only ±5 px at home: the timing matters and the glissade and undershoot do not. It has to ship with pursuit. |
| E2 Fixation-duration distributions | KEEP (folded into N1) | Right idea. It belongs in the single table of intervals. |
| E3 Microsaccades and drift | KEEP WITH CHANGES | The drift and 0.8-unit microsaccades are below a pixel and would make the eyes stiller than today. Keep today's amplitude and change the timing and direction instead. |
| E4 Smooth pursuit with catch-up | KEEP WITH CHANGES | Scheduled with E1 as its partner (week 4 in the order of work, 17) and reduced to a simple tracking law. On a phone it mostly serves motes. |
| E5 Perceptual latency | KEEP | The cheapest change a visitor sees in the first five seconds, and it keeps the site's own promise of attention rather than tracking. |
| E6 Eyes first, head, eyes home (VOR, dead zone) | KEEP WITH CHANGES | As written it keeps the pinned rest offset it claims to fix and does not touch the bob. Add a rest share (0.85, decided), apply the dead zone only to discrete shifts, and A/B it. |
| E7 Vergence scaled by distance | KEEP | Visible (about 3 px per pupil at 0.4), funny, and costs little. |
| E8 Lids follow the eyes | KEEP | The cheapest visible realism on the list. Add it to the repaint check. |
| E9 A pair, not twins | KEEP WITH CHANGES | Keep the lazy lid and add expressive asymmetry. Cut the sub-frame blink offsets, the anisocoria and the 0.5-unit bias. |
| E10 Catchlight | KEEP WITH CHANGES | Only as an experiment behind a flag, on dark-pupil colourways. It changes the mascot's face, so it stays an experiment: decided off in production and on only in `/dev/urchi`. |
| B1 Log-normal blink intervals | KEEP | Removes the metronome. |
| B2 Probabilistic gaze-evoked blink | KEEP | Stops the blink that fires on every sweep of the mouse. |
| B3 Incomplete blinks | KEEP WITH CHANGES | Must never cut short a cued blink or one hiding a face swap (`SHUT` 0.97). |
| B4 Blink kinematics | KEEP WITH CHANGES | Changes a blink the owner chose to make "calm, deliberate" (`:1034`). Decided: the middle values in 4.5 go in, and the slow blink keeps its curve. |
| B5 Stare, then a flurry | KEEP | Cheap. Has to respect `holdBlinks`. |
| B6 Microsleeps | KEEP | Fits the existing 45-90 s "heavy" band exactly and is very relatable. |
| P1 A pupil size of its own | KEEP WITH CHANGES | The pupil is clipped to the eye, so at 1.29× a dark pupil blacks the eye out. Cap it at 0.88-1.12, drop the slits, and drive it by interest and arousal. |
| P2 Light sources on Space | CUT (one line folded into P1) | Invisible afloat (the eyes are about 30 px). The shooting star comes one visit in fifty, and the Milky Way's +0.03 does nothing. |
| P3 Hippus | CUT | About 0.4 px, and the proposal agrees. |
| P4 The glare narrows (slits) | CUT (decided: the glare keeps its grown pupil) | The current glare reads well, and slits change the face's identity. The "big round pupils in a fright" half lives on inside A2. |
| H1 Head speed by amplitude | KEEP | Fixes the tell that every turn takes the same time. |
| H2 Wind-up before a big turn | KEEP WITH CHANGES | Only when the target changes and the turn is over 35°. Never on the pointer, where it would feel like lag. |
| H3 Tilts that mean something | KEEP | Turns a loop into a response. |
| H4 Neck arc | KEEP WITH CHANGES | 40-50 units, not 70 (23 px of slide is a lot for a head placed by its eyes). Low priority. |
| H5 Postural sway | KEEP | Cheap. The eyes cancel its yaw and pitch through E6. |
| H6 Double-take | KEEP (as M4) | Duplicate. |
| Br1 No two breaths alike | KEEP | The breath is on screen the whole time. |
| Br2 Sighs | KEEP | Relief made visible, cheaply. |
| Br3 Holds its breath while it listens | KEEP | Small, and exactly right in `heed`. |
| Br4 Its breath quickens | KEEP WITH CHANGES | Must give way to the floor of 5.2 s while sound is on (`attention.ts:817`) once the arousal fades. |
| S1 Ears with opinions | KEEP WITH CHANGES | At home only, since they are tucked away afloat. Sound is off for most visitors, so drive the ears by interest and fear and by the visitor's own clicks and keys. |
| S2 It bristles | KEEP | The silhouette is the strongest read at any size. |
| S3 Ears scan the room | CUT (one line kept in `soundOn`) | Only happens with sound on, and 3° of scanning barely shows. |
| A1 Moods, not only faces | KEEP WITH CHANGES | Extend the arousal, novelty and boredom Attention already has instead of building a second model. Faces keep their explicit triggers. |
| A2 A glare builds and lingers | KEEP | Onsets and afterglow are where emotion reads. |
| A3 It gets used to you | KEEP | Stops it being wound up like a toy, which the attention header already aims for. |
| A4 Cannot hold your gaze forever | KEEP WITH CHANGES | The boredom cycle already looks away. The fix is small, near aversions before the far ones. Merged with N2. |
| Mem It remembers you | KEEP WITH CHANGES | `pointerSeen` only lasts the session. Drop the "ignored, so cool" behaviour, shorten the long caption, and reuse `eigengrau:visits`. |
| Per Every visitor's Urchi differs | KEEP WITH CHANGES | Narrower ranges and a shared rng. Decided: the persona fixes temperament only, and the colourway stays per page load. |
| N1 Waiting the way animals wait | KEEP | The principle of the whole section. |
| N2 Nowhere in particular | KEEP (merged into A4) | Same change as A4. |
| N3 Body drift differs each time | KEEP | Ten minutes of work. |
| N4 Never the same wave twice | KEEP | Kills the demo loop afloat. |
| F1 Head stays level when it tumbles | KEEP WITH CHANGES | Cap at ±10° and keep the term out of what the body follows, or the suit cancels it. |
| F2 Look, turn, then swim | KEEP | Small and right. |
| F3 It watches its hands | KEEP WITH CHANGES | The head has to lead, because the eyes are invisible afloat. |
| F4 A reach that corrects itself | CUT | Payoff 2 for effort M, and not visible at the afloat size. |
| F5 Spun, it is dizzy | KEEP WITH CHANGES | Lead with the head. Use pupils at full reach so they show when zoomed in; true nystagmus would be invisible. |
| F6 Swimming tires it | KEEP | Gives the float a before and after. |
| F7 Stroke by stroke | KEEP (folded into N4) | Duplicate of N4's jitter. |
| F8 Rest more than perform | KEEP | The most important change afloat, and the smallest. |
| M1 Yawn | KEEP WITH CHANGES | It has no mouth, so build on the stretch that already exists, late hours only. |
| M2 Sneeze | KEEP | It has a cause and a consequence, so it reads. |
| M3 Spontaneous slow blink | KEEP | The cat's "I trust you". |
| M4 Double-take | KEEP | Classic and cheap. |
| M5 Peers at something faint | KEEP | A visible squint with a reason. |
| M6 Loses the mote | KEEP | Prediction you can see. |
| M7 Stares at nothing | KEEP | The best "for people who notice" moment in the list. |
| M8 Hiccups | CUT | A jolt with no cause, no mouth and no body at home reads as a dropped frame. |
| M9 Shakes its head | KEEP | The natural full stop after a sneeze or a fling. |
| M10 Settles on its pillow | KEEP (promoted) | Sleep will be common: the zone is Melbourne's, so an American working day falls in its night. |
| Part 5 `?debug=urchi` panel | KEEP WITH CHANGES | Build it in two phases: sliders, rasters and time scale in week 3, once `Space.ts` is extracted (summary ruling), the recorder's histograms and scatter later. |
| 6.1 It saw it too | KEEP WITH CHANGES | Needs a sky-to-client transform and habituation, since the star repeats every 16-32 s. Afloat the eyes are too small, so the head, arm and body carry it. |
| 6.2 It knows your rhythm | KEEP WITH CHANGES | Shares an arrival budget with the news look. At night it murmurs the rhythm instead. |
| 6.3 It dreams | KEEP WITH CHANGES | Not while he is playing music. The cracks should be 0.74-0.77. Promoted because of the time zone. |
| "A last note" (Urchi as a project, a Notes line) | KEEP | The realism work is itself a portfolio piece. |
| NEW It leans into a hand (stroking, a purr, and a limit) | ADD | The most natural thing people do to a cat, and today nothing answers it. |
| NEW It blinks at what comes at it (blink reflex) | ADD | Very realistic, very cheap, seen as soon as someone flicks the mouse at it. |
| NEW It hears you click | ADD (inside S1) | The one sound every visitor makes with the site's sound off. |
| NEW The favicon waits the same way | ADD | Fifteen minutes. The favicon should not blink like a metronome while the page does not. |
| NEW M11 The walls moved | ADD | A startle at a window being resized: desktop only, cheap, for people who notice. |
| NEW An arrival budget | ADD | Keeps a gift parcel, the news, recognition and rhythm greetings from stacking. |
| NEW Say it in Notes | ADD | Each release gets a one-line site log in Notes, as the site already does. |

---

### Refined proposal

Everything is in priority order. Each item keeps its name as a commit line would read, its model with numbers, its hook (existing code, or *new*), how it reads, its edges, and its effort (S up to a day, M 2-4 days, L 1-2 weeks), payoff (1-5) and risk. Where the original numbers were right they are kept.

---

#### 0. Ground rules for everything below

**0.1 The visibility budget.** Every item is judged against how many pixels it moves.

| Where | px per mesh unit | Today's pupil travel (±10 units) | Today's flick (±3) |
|---|---|---|---|
| Home, desktop 1440×900 | about 0.5 (head about 435 px) | ±5 px | ±1.5 px |
| Home, phone 390×844 | about 0.3 (head about 245 px) | ±3 px | ±1 px |
| Afloat, desktop, default zoom | about 0.15 (eyes about 30 px) | ±1.5 px | under 0.5 px |
| Afloat, phone (40% size) | under 0.1 | under 1 px | none |
| Afloat, zoomed to 2× | about 0.3 | ±3 px | ±1 px |

(On a 2× display the device pixels double, but the eye still judges CSS-sized motion.)

The rules that follow:
- At home, anything of 2 units or more (1 px) is worth building. Anything under that is not.
- Afloat, detail inside the eye only pays when the visitor has zoomed in (`room.zoomLevel` ≥ 1.5). Afloat life goes through the head (roll, turn), the body (`Float`), the limbs (`limbs.ts`) and the face shapes, which read through the visor (README).
- Pixelated afloat (below 40% zoom, `RoomScene.cellFor`), none of the fine eye work runs.

**0.2 Who runs the character.** Space and About both use `new Urchi(...)` (`RoomScene.ts:178`, `AboutScene.ts:239`). The favicon and `/dev/suit` call `createUrchi` directly (`LiveIcon.tsx:75`, `SuitSheet.tsx`). The header (`character.ts:18-20`) promises that, without the hooks, it behaves as the standalone `urchi/index.html`, and README (`:86-93`) asks for standalone changes to be mirrored into the site. So:
- add a *new* `lifelike?: boolean` to `UrchiOptions` and to the `Urchi` class's options;
- pass it through at `Urchi.ts:166`, and set it only in `RoomScene.ts:178`;
- leave About, the favicon, `/dev/suit` and the standalone page unchanged.

About's mark can opt in later, once it has been seen on Space.

*Ruled in the summary: Urchi also appears in the lights-off view, the 404 (later) and the GitHub profile image (`/api/urchi.png`), and never on the Desk, in its games, tools or papers. `src/engine/space/Space.ts` is extracted from `CreativeSpacePanel.tsx`'s effect in week 3, before finds, so every hook below cited in `CreativeSpacePanel.tsx` moves into `Space.ts` with it. The line numbers are from `9b8c07c`.*

**0.3 Where time runs.** Visited tabs stay mounted and paused while hidden (`RoomScene.ts:183`, `if (!this.paused) this.frame(...)`).
- Everything *within* a visit runs on the room's clock (`Attention.t`, the character's `S.t`): drives, habituation, dream bouts, trust per minute. It therefore stops while the tab is hidden.
- Only memory *across* visits (section 12) uses `Date.now()`.

**0.4 Reduced motion, `?still`, sound off.**
- Reduced motion keeps what the site already allows under it: lids and face shapes (`SOFT.lidReduced`, `attention.ts:107`), and pupils that jump without easing (`gaze.instant`, `character.ts:934`).
  - New *shape* changes (pupil size, lazy lid, the lid following the eye) are allowed under reduced motion but swap in during a blink, the way faces do (`setFace`).
  - New *motion* (head, ears, bristle, body) does not run.
- Under `?still` (`character.ts:716`) and the forced knobs (`FORCED`, `FORCED_BLINK`), every new random process is off, so screenshots stay stable.
- Sound off is the default, so nothing below *depends* on sound. Sound only adds.

**0.5 Voice.**
- Captions are the owner's voice about the creature, at most 48 characters, with no exclamation marks (`site.ts:53-56`).
- Numbers up to ninety-nine are words.
- Every package that ships gets a one-line site log in Notes (the grotesk "site" lines), for example: *"Urchi looks now, a moment after it sees."*

---

#### 1. Foundations

**F0.1 "Urchi: a little toolkit for being alive"**

A small file of distributions and noise that everything below uses.

- *New* `src/engine/urchi/life.ts`, about 120 lines:
  - `gauss(r)` (Box-Muller); `logNormal(median, σ, r) = median · e^{σ·N(0,1)}`; `gamma(k, θ, r) = −θ Σ_{i≤k} ln U_i` (an integer k is enough); `expo(λ)`.
  - A Poisson process with a refractory period: `gap = refractory + Exp(λ)`.
  - Ornstein-Uhlenbeck, updated exactly at any dt: `x ← μ + (x−μ)e^{−θΔt} + σ·√((1−e^{−2θΔt})/2θ)·N(0,1)`. Its stationary SD is σ/√(2θ).
  - `noise1(t)`: 1D gradient noise with 2-3 octaves (about 25 lines), for slow wanders where OU is too jittery.
  - `minJerk(u) = 10u³−15u⁴+6u⁵`, moved here from `limbs.ts:195` (`mj`).
- *New* `src/lib/random.ts`: move `hashSeed`, `subSeed`, `unitOf` and `rng` there from `src/engine/space/sky/tune.ts:58-100`, and have the sky import them back. Urchi must not import from `engine/space`, because Space imports Urchi. Moment-to-moment randomness can stay `Math.random`: the tell is the *shape* of the distributions, not the generator. *Ruled in the summary: `random.ts`, not `src/lib/seed.ts`, because `sky/seed.ts` already means visit and URL seeds. It is the one shared PRNG and hash, and its first outputs are frozen by a Vitest golden test.*
- *New* `src/engine/urchi/lifelike.ts` (not `tune.ts`, which in the sky means seeded ranges): every number in this plan in one object, the way `sky/defaults.ts` holds the sky's, so the debug panel can edit it live and "Copy config" can write it out.
- *New* option `lifelike` (0.2). Without it the character behaves exactly as today.
- Payoff 0 on its own. Effort S. Risk: none.

**F0.2 "Space: Urchi's hooks, all of them"**

New getters next to `breath` and `shut` (`character.ts:2410-2415`):
- `head` (yaw, pitch and roll in radians, including tilt, pose, glance and nod);
- `gazeNow` (the pupil offsets in units);
- `nextBlink` (seconds);
- `pupil` (the scale, once P1 exists).

While there, update README's list of site hooks (`:90-92`), which omits `attend`, `eyesTo`, `setDarts`, `dip`, `setBreathDepth`, `setBlinkHold`, `setTilts`, `sway`, `pose`, `kick`, `doubleBlink`, `setFace`, `slowBlink`, `glance`, `blink` and `deepBreath` (all at `character.ts:2209-2415`). Effort S.

**D1 "Space: `?debug=urchi`, first cut"** (phase 1 of Part 5; the rest is in 16.4)

- *Where:* *new* `src/engine/urchi/debug/panel.ts` and `schema.ts`, mounted from `CreativeSpacePanel.tsx:203-210` beside the sky's panel. It uses the same development-only dynamic import behind `params.get("debug") === "urchi"`, so production never follows it. *Ruled in the summary: the panel waits for `Space.ts`, so it lands in week 3 and mounts from there, where the sky's panel mount moves too.*
  - Factor the sky panel's element helpers and row renderer (`sky/debug/panel.ts`, `mountSkyPanel` at `:139`; `schema.ts`'s rows and groups) into *new* `src/engine/common/debugPanel.ts`, so both panels share them.
- *Phase 1 contents* (enough to tune the lids and blinks in week 3 and the saccades in week 4):
  - **Sliders** for every number in `lifelike.ts`, grouped as Eyes, Blinks, Head, Breath and Pupils.
  - A **switch** for `lifelike` itself (A/B in place).
  - **Rasters** over the last 20 s: a blink raster (tick height = closure; colour for spontaneous, gaze-evoked, burst or cued), a saccade raster (amplitude), and traces for the breath, head yaw and eye-in-head.
  - **Time scale** ×1, ×0.5, ×0.25 and ×0.1, plus Freeze and Step one frame. Implement it by scaling `dt` in `RoomScene.frame` (`:470-474`) before the hooks and `urchi.update`, so a saccade can be watched at a tenth of the speed.
  - **Inject** buttons: Startle, Mote here, Sound on, Rhythm matched, Hour: day / late / night (sets `?hour=`, `hours.ts`).
  - **Overlays** on a 2D canvas over the stage: the gaze target (a crosshair), the head's aim (a ring), and the eye-in-head vector.
- Effort M (half of it is the shared panel code the sky already has). Risk: none. It is development-only.

**Shows:** he treats a mascot as an engineered system, with shared foundations, tunables and a debug path, not a pile of tweens.

---

#### 2. "Space: Urchi looks, a moment after it sees" (the core package)

This is what every visitor meets in the first five seconds: the head following the cursor. Today that is tracking, the opposite of the site's own words ("Attention, not tracking"). These four items turn it into looking. None of them needs E1: they work on today's pupil spring.

**2.1 E5 "Space: it sees you a moment later"**: perceptual latency.

- *Model.* A new thing to look at is acted on after a latency **L = `gamma(4, 0.04)` s** (mean 160 ms, clamped 90-350 ms). A new thing means:
  - a switch of `this.current` in `choose`;
  - the pointer starting to move after resting for more than `POINTER.rest` (0.35 s);
  - a pill hovered;
  - a mote released.
- *Scaling of L:*
  - ×0.8 when aroused (arousal ≥ 0.3 on today's 0-0.45 scale);
  - ×1.4 when drowsy (alertness < 0.3);
  - ×1.8 while dozing;
  - ×0.7 for startle-worthy events (`spike(..., startle = true)`);
  - an express 90-110 ms when the new point is within 5° of the current look.
- Steady pursuit of a moving target is not delayed; it is predicted (3.1).
- *Hook.* `Attention.update` (`attention.ts:593-616`).
  - When the chosen target's identity changes, or the pointer resumes, set `pending = { at: t + L }` and keep calling `aim` with the *previous* point until `t ≥ pending.at`.
  - This is simpler than a ring buffer and does the same thing.
  - The gaze-evoked blink check in `aim` (`:767-772`) then fires on the real turn.
- *Exempt:*
  - acts that ask for `"snap"` or `"quick"` (`look(where, how)`, `attention.ts:383`);
  - `heed` and `held` (`acts.ts:367`, `:553`), the drag, and Call's listening;
  - the first look after arrival (`BORED.grace`, `:74`).
- *Reads as:* you move, and a heartbeat later it notices. It perceives rather than tracks.
- *Edges:*
  - Reduced motion: keep it, since a delay is not motion.
  - Phone: applies to motes and to "you" after a tap.
  - Night: a drowsy latency adds to the sleepiness for free.
- Payoff 5. Effort S. **Risk:** it must never feel laggy in play; the exemptions cover the deliberate interactions.

**2.2 H1 "Space: small looks take a moment, big ones take longer"**: head speed by amplitude.

- *Model.* Keep the springs, which already handle retargeting mid-move smoothly, but choose ω per move: **ω = clamp(9·(20/A)^0.35, 5.5, 16)**, with A the head's amplitude in degrees.
  - That gives about 0.35 s at 5°, 0.55 s at 20° and 0.75 s at 45°.
  - Multiply by the persona's speed (0.85-1.15, section 12), ×1.2 when aroused and ×0.8 when drowsy.
  - ζ comes from the persona, 0.6-0.8, for 1-5% overshoot and settle (follow-through). The eyes cancel it (2.3).
- *Hook.* `lookAt` (`character.ts:2231-2246`) stores `look.omega` when it sets `headAt`. `frame` (`:2099-2100`) uses it instead of `HEAD.omega`. `HEAD.quick` (ω 16) still wins during a quick turn.
- *Reads as:* a glance is a glance and a turn is a turn.
- *Edges:* reduced motion keeps the head front (`:2094`), so nothing changes there.
- Payoff 4. Effort S. Risk: none.

**2.3 E6 "Space: eyes first, then the head, then the eyes come home"**: head-eye coordination, corrected.

- *Model.* In look-space units (1 = the full turn):
  - `g(t)` is the gaze direction: `look.nx, look.ny`, delayed by 2.1.
  - `h(t)` is the head's actual direction now: `(S.yaw.v + tilt.yaw.v + pose.yaw.v + away.turn.v) / LOOK.yaw`. Pitch is the same, including the breath's `nod`, over `LOOK.pitchUp` or `LOOK.pitchDown`.
  - The pupil target is **P = clamp(R·GAZE.x·g + K·(g − h), ±EYES_REACH.x)**, with:
    - **R, the rest share**, *new*, default 0.85 (tunable 0.5-1; 1 is today's look). This is what fixes the pinned-eccentric pupils after a big turn: at rest and at full turn the pupils sit at 8.5 units (about 4 px) instead of 10, still pointing the way it looks. *Decided: 0.85 moves the pupils most of the way off the rim while the face he drew stays recognisable. If the before-and-after against the probe still shows pinned pupils at 0.85, it becomes 0.75 (decisions.md, item 6).*
    - **K ≈ 12 units per look unit** (vertically `GAZE.y` and about 10, clamped ±16). That is a stylised VOR gain of about 0.45. A physical gain of 1 would pin the pupils at the eye's limit in every big turn.
  - During a turn the eyes lead by up to 12 more units (6 px, clearly visible) and **roll back as the head arrives**.
  - Head overshoot (H1's ζ), H5's sway and the breath's nod are cancelled too.
    - The nod's share is about 2 units, roughly 1 px: correct, free, and not something to promise.
    - The owl's bob is roll plus a sideways shift, and this formula does not touch it. An *optional* translational term, pupils −0.3·`shift` (up to 3 units, 1.5 px), gives the bob a hint of a fixed gaze. Try it in the panel.
- *Head dead zone*, for discrete shifts only:
  - A new target, or the pointer's re-aim after it has stopped, under 0.15 look units (about 6°) moves the eyes only.
  - The head follows lazily, after `logNormal(0.5 s, 0.4)`, only if the eye-in-head offset stays over 60% of `EYES_REACH` for that long.
  - While the target is *moving* (pursuit, 3.1, or the pointer in motion for more than 0.2 s), the head follows as today.
  - Without that distinction the head would move in steps behind a slowly moving cursor.
- *Hook.*
  - The P formula goes in `stepGaze` (`character.ts:927-929`).
  - The dead zone goes in `frame` (`:2094-2096`): gate `look.hx = look.nx` on the three conditions above.
  - Apply only with `lifelike`, and not under `selfAim` (looking at its own hand already solves the head, `:2091-2093`).
  - Afloat, attention's `origin` (`attention.ts:66`) already works in the figure's own frame, so the same maths holds. F1 adds the body's turn to h.
- *Reads as:* the "eyes, head, settle" of every great animated character, from physiology rather than keyframes. At home it is visible: the pupils swing out, then drift home as the head arrives.
- *Edges:*
  - Reduced motion keeps the head front, so `h = 0`, and the pupils sit at `R·GAZE.x·g + K·g` clamped. Set K = 0 under reduced motion so the look stays the same as today.
  - Phone: works.
- Payoff 5. Effort S. **Risk:** the dead zone changes the "it follows my cursor" feel that visitors may already love. Ship it behind `lifelike` and record a before and after against the probe. *Ruled in the summary: package one ships in week 2, before the panel exists (week 3), so the A/B is the `lifelike` flag and the probe's recording; the panel's switch takes over once it lands.*

**2.4 A4 + N2 "Space: it looks away a little, not across the room"**: aversion before boredom.

- *What exists:* with the pointer resting, salience decays under 0.45 and, 1.5 s later, `wander` looks at one of four corners (`(16%,14%) (84%,14%) (18%,86%) (82%,86%)`, or the bottom centre on a phone) and checks back on you for 0.9 s with 80% probability every 3-6 s (`attention.ts:721-746`). The probe saw 51.5° three times in a minute.
- *Model.*
  - **Mutual-gaze clock.** While it is looking at "you" (the pointer at rest, or straight out on a phone, `you()` at `:326`) and nothing else pulls:
    - hold for `logNormal(m, 0.5)`, with m = 2.2 + 2.6·boldness seconds (2.6-4.2 s over the persona's range, section 12);
    - then **avert** by 8-18° of gaze (0.2-0.44 look units horizontally at 41.25° per unit), 60% down and to the side, 40% to the side;
    - hold the aversion `logNormal(0.7 s, 0.4)`;
    - come back, with a blink 30% of the time.
    - With trust T > 0.5, 30% of aversions become the **slow blink** instead: the cat's way of breaking a stare without leaving.
  - **Escalation.** After 2-4 of these cycles, boredom takes over as today, but its destinations become a small field instead of four corners:
    - the tab pills (weight 0.3), the sound chip (0.1), the caption band (0.15);
    - 2-3 "nothing" points drawn per boredom episode inside the room, at least 20% of the width from the last look (0.45 together).
    - *Ruled in the summary: the Desk pill is never in this field, because a look at it is kept for a new game, tool or paper and Urchi never points at the Desk for the daily. The sound chip moves into the nav (Style R4), so its point moves with it; the finds' pocket takes the top-right corner the chip leaves.*
    - Check-backs keep today's 80% but last `logNormal(0.8 s, 0.4)`, and the gaps become `logNormal(0.9 s × 3.5, 0.5)` instead of `rand(3, 6)` (`:743`).
  - Late at night aversions become lid-lowerings (rest lid +0.1 for the hold), not looks.
  - Everything is suppressed during acts, `heed`, reading (`steady`) and pointer motion.
- *Hook.* In `choose` (`:677-718`), keep a mutual-gaze clock while `current.kind === "pointer"` and the pointer has been still for more than 0.5 s. Return an averted point near you before the boredom branch at `:710`. `wander` (`:721-746`) gets the field.
- *Reads as:* the difference between being watched by a sensor and being looked at by someone. Look-aways near you are about you; look-aways to the corners are about nothing.
- *Edges:*
  - Phone: "you" is straight out, and it averts from the camera, which works as well.
  - Reduced motion: pupils only (the head stays front anyway).
- Payoff 5. Effort S. **Risk:** too much aversion reads as shy or rude. The persona and trust scale it, and the first 20 s of a visit hold the stare longer (×1.3).

**Shows (package):** he knows the difference between tracking and attention and can build it. The perceptual psychology is the argument, and the result is felt without being explained.

---

#### 3. "Space: its eyes jump, and ride along"

**3.1 E1 + E4 "Space: Urchi's eyes get there first"**: saccades and pursuit, shipped together.

- *Mapping.* Treat the drawn eye as a ball about 40 units in radius, so **1 unit of pupil travel ≈ 1.5° of eye rotation** and `EYES_REACH` (±20) is ±30°.
- *Control law* per frame in `stepGaze`, with e = pupil target − pupil now (units) and v = the target's velocity in look units per second (*new* optional argument `lookAt(nx, ny, how, vel?)`):
  1. **Pursuit** while 0.05 < |v| < 2.2 look units/s (roughly 2-90°/s). The pupil velocity is `g·v·GAZE.x + 4·e`, with g = 0.95 under 20°/s falling linearly to 0.6 at 60°/s. This follows 100 ms behind the start of motion (E5 exempts it; the delay is the pursuit onset). While pursuing, the head follows as today (2.3).
  2. **Catch-up saccade** when |e| > 1.5 units, or when the error predicted 150 ms ahead exceeds 2.5 units. It lands on `target + v·D` (predictive).
  3. **Saccade** for a discrete jump when |e| > 1.2 units and the target is not moving. It follows minimum jerk over **D = 21 + 2.2·A ms**, with A = |e|·1.5°, clamped to 25-150 ms: 54 ms for a 10-unit look, 87 ms for a 20-unit one. Nothing moves between saccades except the flicks of 3.2.
  4. Above about 90°/s (a flicked pointer; `POINTER.fast` 700 px/s, `attention.ts:78`) there is no pursuit, only saccades every `gamma(3, 0.07)` s.
  5. On a sudden stop, pursuit coasts 80-120 ms, then a small back-saccade.
- *Cut:* the glissade and the undershoot with its corrective saccade (under 1 px at home).
- *Keep:* the springs for `darts === "drift"` (listening wanders slowly, `DRIFT` ω 6) and for `gaze.instant` (reduced motion already jumps, `:934-936`).
- `eyesTo` (reading, `acts.ts:113-117`) goes through saccades too, so its 200-260 ms jumps become snaps with fixations between them: exactly how reading looks.
- *Velocity source:* attention already measures the pointer's (`attention.ts:509-518`, low-passed at 0.35), and `Motes` knows each mote's heading and speed.
- *Reads as:* the eyes stop floating. A 10-unit look at 60 fps is two in-between frames, then stillness. Move the mouse slowly and the pupils ride along with an occasional hop; stop suddenly and they overshoot a hair and come back.
- *Edges:*
  - Phone: pursuit mostly follows motes, "you" does not move.
  - Afloat: runs, but is invisible below zoom 1.5 (0.1).
  - Asleep: pupils hidden.
- Payoff 4 (5 together with 2.3). Effort M. **Risk:** too snappy on the smallest pupils. Floor D at 25 ms and interpolate across frames.

**3.2 E3 "Space: its eyes are never quite still"**: flicks with a purpose (slimmed).

- *Now:* ±3 units uniform in x and y, independently, every U(0.2, 0.8) s; ±2 every U(0.6, 1.4) s when fixated (`character.ts:912-914`, `:920`).
- *Model.* Keep the visible amplitude and change the shape:
  - amplitude `logNormal(2.4 units, 0.35)`, clamped 1.5-4 (fixated: median 1.8, clamped 1.2-3);
  - direction: 70% corrective (new offset = −0.3 × the old one plus a little noise, a return that slightly overshoots), 30% a fresh random angle;
  - timing: a Poisson process at 1.6/s free and 0.9/s fixated with interest (interest suppresses them), with a 150 ms refractory period;
  - each flick runs as a 25-30 ms saccade (3.1).
- *Cut:* OU drift (0.45 px) and tremor (below a device pixel).
- *Hook:* `stepGaze` (`:912-914`, `:920`) and `fixate` (`:2327-2331`).
- *Reads as:* the stare of something holding on, not a jittering picture of eyes.
- *Edges:* skipped afloat below zoom 1.5. Reduced motion: none (the target is held).
- Payoff 3. Effort S. Risk: busy above 4 units; tune in the panel.

**3.3 E7 "Space: it crosses its eyes a little for close things"**

- *Model.* Vergence = `clamp((R_near − d)/R_near, 0, 1)^1.5`, where:
  - d is the target's distance on screen from the midpoint of the eyes (client px, `room.eyes()`);
  - R_near = 0.6 × the head's reach (`this.o.reach()`).
- *Caps:* the pointer over its own face up to **0.4** (6.4 units, about 3 px per pupil toward the nose); a mote up to 0.9; its own glove (the `inspect` quirk) 0.5.
- The existing `gaze.conv` spring (ω 6, ζ 0.9, `:939`) has about the right dynamics; vergence is about five times slower than a saccade.
- **Near triad:** the resting lid +0.04 and the pupil −5% (once P1 exists) at vergence 1.
- *Hook:* `Attention.aim` computes d and calls `ch.converge(v)`. `closeBy` (`acts.ts:319`) keeps its explicit 1.
- *Reads as:* hover over its nose and it goes gently cross-eyed at your cursor.
- Payoff 3. Effort S. Risk: comic if overdone, hence the pointer's cap.

---

#### 4. "Space: its lids live"

**4.1 E8 "Space: its lids follow its eyes"**

- *Model.* Upper-lid descent = `k_down·max(0, e_y) + k_up·min(0, e_y)`, where:
  - e_y is the vertical eye-in-head offset, normalised by `EYES_REACH.y` to −1..1;
  - k_down = 0.28 (looking fully down covers about a quarter of the eye) and k_up = −0.06 (the lid lifts a little: slightly wider);
  - a face tipped down (breath, `pose`) adds `0.1·max(0, pitch/15°)`.
- *Dynamics:* the lid trails the eye by 20-40 ms, on a spring of ω 30 and ζ 1, so in a downward saccade you see the lid follow.
- *Hook:*
  - In `ownEye` (`character.ts:1022-1026`), `open = (1 − b)·(1 − lidFollow)` before the squash. `lidFollow` is a *new* spring stepped in `frame`.
  - Push `lidFollow` into `paint`'s change list (`:2077`), or the canvas will not repaint when it alone moves.
  - Apply the same term to the angry lid line (`:996-999`): a glare looking down gets heavier.
  - It multiplies `open`; it does not feed `lidOf`. So `ch.shut`, `SHUT` and the Zs' `shut > 0.9` (`Faces.ts:148`) are unaffected.
  - Note that with a heavy resting lid of 0.7 plus a full down-look, open drops under 0.22 and the eye becomes the closed arc (`:1022`). Clamp `lidFollow` so `(1−b)(1−lidFollow)` stays at or above 0.24 unless b alone is above 0.78.
- *Reads as:* the most visible cheap realism on the list. When it reads his caption under it (`read`, `acts.ts:113`, eyes at 0.85 down), its lids come down like someone reading. Looking up at a pill, its eyes open a touch.
- *Edges:* reduced motion allowed (a shape, swapped at blinks). Asleep: no change.
- Payoff 4. Effort S. Risk: none.

**4.2 B1 "Space: blinks come when they come"**: log-normal intervals.

- *Model.* The interval between blinks is `logNormal(m, σ = 0.65)`, truncated to 0.4-20 s, with median **m = 3.0 s × (1 + 0.8·focus) × (1 + 0.25·calm) / (1 + 0.5·a)**:
  - focus = 1 while fixating something interesting (a mote, reading, `heed`), since attention to a visual target suppresses blinking;
  - a = arousal (0-1);
  - calm = 1 − the persona's liveliness.
- The mean is about 3.7-5 s (12-16 a minute), with a heavy tail: now and then an 8-10 s stare (about 3% of intervals exceed 10 s at median 3).
- Doubles become a burst process: after any blink, P(another within 0.15-0.35 s) = 0.12, then 0.04, capped at three.
- *Hook:*
  - `stepBlink` (`character.ts:1049-1051`).
  - *New* `setBlinkRate(median, sigma)` next to `setBlinkGap` (`:2353`).
  - Keep `setBlinkGap(min, max)` as a wrapper that sets `median = (min + max)/2 ÷ e^{σ²/2}` (÷1.235 at σ 0.65), so the mean stays where `Attention.apply` (`attention.ts:820`) asks.
- Payoff 4. Effort S. Risk: none.

**4.3 B2 "Space: a blink to cover a turn, sometimes"**

- *Model.* P(blink | gaze shift of A°) = `1/(1 + e^{−(A−30)/6})`: 0.16 at 20°, 0.5 at 30°, 0.92 at 45°. It starts *with* the turn (0-40 ms after), not 140 ms after, because the lid and the turn share a command.
- *Hook:* `attention.ts:767-772`. Replace the fixed `TURN.after = 0.14` with the probability and an onset of U(0, 0.04) s. Keep `TURN.gap` (1.6 s) and the `blinksHeld` guard.
- Payoff 3. Effort S. Risk: none.

**4.4 B3 "Space: not every blink closes"**

- *Model.* 25% of *spontaneous* blinks reach only 0.55-0.75 closure, short of the closed-arc swap at 0.78 (`:1022`), so they stay a squash. Drowsy (alertness < 0.35): 40%.
- *Guard (new):* a blink is always full when:
  - it is cued (`blink.cued`, `setFace`'s blink, `doubleBlink`, `slowBlink`);
  - a face is pending (`faces.next`);
  - it follows a startle (B5).

  If a face is requested while an incomplete blink is under way, raise that blink's amplitude to 1 on the spot, which is still invisible because it is mid-close.
- *Hook:* `stepBlink` returns `amount × amp`, with `amp` drawn per blink.
- Payoff 3. Effort S. Risk: none, with the guard.

**4.5 B4 "Space: a quick blink, and a slow opening"** (decided: it goes in)

- *Now:* a "calm, deliberate blink" (`:1034`): 90 ms close, 150 ms shut, 140 ms open. That is about twice a human blink.
- *The middle, decided:* close `75 ± 10` ms with an ease-in (a blink is ballistic); shut `logNormal(60 ms, 0.4)`, clamped 35-120; open `170 ± 30` ms with a long ease-out (the last 20% takes 40% of the time).
  - Decided: these middle values go in, not the further 40 ms shut, so the blink quickens without losing the calm he drew. If the new blink reads as a twitch at a phone's 30 fps, the close stays at 90 ms (decisions.md, item 6).
- *Drowsy:* close 150-250 ms, shut 200-600 ms, open 300-500 ms. The opening **stops at 0.25-0.35** and drifts up over about 1 s: the heavy lid.
- The slow blink (`SLOW_BLINK`) keeps its deliberate curve. The contrast between a quick reflex and a slow blink is what makes the slow blink mean something.
- *Hook:* `BLINK` (`:1037`) becomes per-blink timing drawn in `stepBlink`. `setBlinkHold` (`:2357`) scales the drawn hold instead of changing the shared object. Call's own `BLINK` (`Call.ts:49`) is separate and unaffected.
- *Edges:* on a 30 fps phone floor the shut at one frame.
- Payoff 3. Effort S. Risk: a style change to a deliberate choice, decided in favour and bounded by the 30 fps check above.

**4.6 B5 "Space: a stare, then a flurry"**

- *Model.* A startle suppresses blinks for 0.3-0.5 s (the stare, eyes wide), then comes a burst of 2-3 blinks at 0.25-0.4 s intervals. The *second* is incomplete, the others full. After a hard fright (the line snapped, woken at night): three blinks and a double.
- *Hook:* `Attention.startle` (`attention.ts:395-402`) calls `holdBlinks(0.4)` (`:419`), then schedules the burst through a *new* `ch.blinkBurst(n)`. The burst must not start while `t < blinksHeld`.
- Payoff 3. Effort S. Risk: none.

**4.7 B6 "Space: it fights to keep its eyes open"**: microsleeps.

- *When:* late hours (23:00-00:59), or alertness < 0.35 with stillness between 45 s and 90 s. That is today's "heavy" band (`IDLE.heavy` 45, `IDLE.doze` 90, `attention.ts:99`), so this fills an existing gap. The hazard is 1 per 25 s.
- *A microsleep:*
  1. The lids close over 0.6-1.2 s while the head sinks 6-10° in pitch (`pose`).
  2. Shut for `logNormal(1.6 s, 0.4)`.
  3. A **jerk awake**: a kick of −60°/s in pitch (`kick`, `:2389`), widen 0.08, a double blink, and a glance at you (embarrassed, via `Faces.react`, if the pointer is within the head's reach; it respects the 20 s refractory).
- At most three before `doze` takes it.
- *Hook:* a *new* act `nodOff` in `acts.ts`, played from `Attention.moodStep` (`:781-805`) at priority 2. Not while listening, and not during any act.
- *Reads as:* the most relatable thing a creature can do at half past midnight.
- *Edges:* reduced motion: lids only. Phone: identical.
- Payoff 5. Effort S. Risk: none.

---

#### 5. NEW "Space: it leans into a hand" and "Space: it blinks at what comes at it"

**5.1 "Space: it leans into a hand"**: stroking, a purr, and a limit. *(New.)*

- *Pitch.* Stroke Urchi's head slowly and it pushes into your hand, half-closes its eyes and, with sound on, purrs. Keep going too long and it lets you know.
- *Detection* (*new* `src/engine/space/Stroke.ts`, fed where `faces.pointer` is fed, `CreativeSpacePanel.tsx:613`). At home, awake, not during an act of priority 3 or more:
  - the pointer is over Urchi (`room.urchiHit`) in the upper 60% of the head's box (brow and ears; `RoomScene.homeBox`, `:336`);
  - a **stroke** is a run of at least 0.2 × the head's box width (about 90 px on a desktop, 50 px on a phone) at a mean of 60-700 px/s, with at most one direction change per 0.6 s;
  - **stroking** is two strokes within 2.5 s. It ends after 2 s without one;
  - a shake (four turns of 14 px or more within 1.2 s, `Faces.ts:26`) is not stroking and still goes to the glare, as today.
- *Response, in stages:*
  1. **First stroke:** ears perk toward the hand (S1), eyes up to it (E8 lifts the lid). The head does not move.
  2. **Stroking:** the head **bunts into the stroke**: `pose(0, −3, ±5 toward the stroke's direction, speed 4)`, following each stroke 150 ms late. The lids ease to 0.4 (`setRestLid`: content, not sleepy). The ears rotate out 6°. The breath goes to 5.2 s at depth 1.2. The blink median ×1.6. Each stroke adds valence +0.05 (capped at +0.4) and trust +0.02 (capped at +0.1 a visit).
  3. **After four strokes:** a slow blink about every 6 s (M3's rule). With sound on, a **purr**: a *new* `sfx.purr(level)` voice.
     - Band-passed noise (about 150 Hz, Q 1), amplitude-modulated at 26 Hz.
     - Its level follows the breath, both in and out, with a 0.15 s gap at the turn.
     - Very quiet (about −30 dB under the pats), in over 1.5 s, out over 0.8 s once the strokes stop.
     - *Decided: the purr joins `src/audio/sfx.ts` and ships with stroking (week 5). With sound off it never plays, and its visible counterpart is the half-closed lids and the head leaning into the hand. It joins Urchi's own four sounds under the rule that Urchi's sounds stay Urchi's. If it cannot be heard on phone speakers (a purr lives around 25-150 Hz, and they roll off far above that), it gains a soft upper harmonic rather than more volume (decisions.md, By section, Urchi 5).*
  4. **Enough.** After N strokes in one bout (N = `logNormal(12, 0.3) × (0.8 + 0.4·(1 − boldness))`, clamped 6-24):
     - the ears flatten 15° (the warning);
     - the head pulls away 8° in yaw over 0.3 s;
     - a quick look at the hand.

     Three more strokes within 4 s bring the glare (`Faces.react("angry")`, which keeps its 45 s refractory). Otherwise it accepts stroking again 20 s later. This is a cat's petting-induced irritation, and it gives Urchi a boundary.
- *Asleep for the night:* a stroke is not a click, so it does not wake it.
  - The sleep deepens: breath depth 1.6, and a pillow settle toward the hand's side (M10).
  - The `peek` (`acts.ts:208`) is held back while it is being stroked.
  - If it was woken last night (section 12) it turns its face away instead.
- *Where:* Space at home. Not afloat, where pressing holds it.
- *Copy:* no caption. Cursor label unchanged ("Take with you"). Notes site line: *"Urchi can be stroked now. It will say when."*
- *Data:* none beyond trust (section 12), which lives once, in `eigengrau:urchi`.
- *Edges:*
  - **Phone:** a finger drag over the head. `.space-urchi` has `touch-action: manipulation` at home (`globals.css:422`), which lets the browser claim a drag, so set `touch-action: none` at home as well as afloat (`:427`). A stroke is longer than `CLICK.slop` (6 px), so it never counts as the tap that takes it with you.
  - **Reduced motion:** lids, ear poses and the purr; no head bunt.
  - **Sound off:** no purr. Everything else as above.
  - **Hover caption:** stroking cancels `read` (`att.cancel("read")`, as other slots do at `CreativeSpacePanel.tsx:323`).
- *Implementation:* `Stroke.ts` (S), a `stroked` act in `acts.ts` (S), `sfx.purr` (S), tuning (S).
- Effort M. Payoff 5. **Shows:** interaction design with a creature's boundaries. It notices *how* it is touched, not only where the pointer is. **Risk:** accidental stroking on the way to the tabs, which the two-stroke rule and the upper-60% zone prevent.

**5.2 "Space: it blinks at what comes at it"**: the blink reflex. *(New.)*

- *Trigger* (mouse or pen only, awake, at home or afloat): all of these at once:
  - pointer speed ≥ 1400 px/s;
  - its velocity within 25° of the line to the nearer eye (`room.eyes()`);
  - distance to that eye under 1.2 × the head's reach;
  - time to contact under 120 ms.
- *Response:*
  - a full, cued blink at once (`ch.blink()`, never incomplete);
  - a kick of `kick(0, −50, 0)`, so the face tips up and back;
  - after the blink, `widen(0.06, 0.6)` and a quick look at the pointer;
  - the ears flatten 10° for 0.5 s (S1) and a bristle of 0.3 (S2).
- *Habituation* (A3, kind "flinch"): the response is scaled ×0.6 each time and recovers over 60 s. Under 0.3, a blink only; under 0.15, nothing. Wave at it and it stops flinching.
- *Hook:* `Attention.sense` (`attention.ts:630-660`) already has the pointer's velocity and `this.o.head()`/`this.o.reach()`. A *new* private `threat()` check.
- *Edges:*
  - Touch has no approach, so phones are skipped.
  - Reduced motion: the blink only.
  - Asleep: none (the lids are already shut).
- Effort S. Payoff 4. **Shows:** the one reflex everyone knows from their own body. **Risk:** none, with habituation.

---

#### 6. "Space: it rests more than it performs"

**6.1 F8 "Space: it rests more than it performs"** (afloat)

- *Now:* an idle quirk about every 10 s from eleven that play the same every time (`IDLE`/`PACE`, `limbs.ts:405-422`). In three minutes a visitor sees "inspect" and "swing" three times each.
- *Model.*
  - Halve the idle quirk rate.
  - Add **"nothing"** as an idle choice with weight 3: 20-40 s of pure floating life (the `IDLE_LIFE` noise, the breath, the eyes) between quirks.
- *Hook:* `IDLE` and `PACE` (`limbs.ts:405-422`), and the pick at `:631-637`.
- Payoff 4. Effort S. The most important change afloat, and the smallest.

**6.2 N1 "Space: waiting, the way animals wait"**: every uniform interval replaced, E2 folded in.

| Today (uniform) | Where | Replace with |
|---|---|---|
| blink gap U(2.5, 6) | `character.ts:1051` | log-normal (4.2) |
| flick gap U(0.2, 0.8) / U(0.6, 1.4) | `:920` | Poisson with refractory (3.2) |
| free darting (no target) | `:916-918` | `gamma(3, 0.10)` s: mean 300 ms, mode 200 ms, clamped 0.12-1.2 |
| fixated with interest | `:920` | `gamma(4, 0.20)`: mean 0.8 s |
| tilt gap U(4, 9) | `:881` | Poisson with refractory and appraisal (6.4) |
| bored check U(3, 6), 80% | `attention.ts:743`, `:726` | log-normal (2.4) |
| quirk gap U(3.2, 7.5) | `limbs.ts:545` | `2.5 + Exp(mean 9 s × persona)`: more rest, occasional bursts |
| swim every U(7, 15) | `Float.ts:788` | `logNormal(12 s, 0.5) × (1 + 2·fatigue)` |
| listening shut U(10, 20) / open U(6, 12) | `Faces.ts:19` | log-normal medians 13 s and 8 s, σ 0.4 |
| favicon blink gap | `LiveIcon.tsx:186` (`rand(...BLINK.gap)`) | `logNormal(3.2 s, 0.6)`, clamped 0.8-16 (*new*, 16.3) |

The principle: **do not replace `Math.random`; replace the shapes.** The tells are uniform distributions, fixed points and fixed phases, not the generator. Payoff 3. Effort S.

**6.3 N3 "Space: the body drifts its own way each time"**

Randomise `SUIT_BODY.drift`'s periods (±20%) and its phases (today 0, 1.3 and 0.6) at creation (`character.ts:1463`, `:2136-2139`), and swap its sines for `noise1` with two octaves. Payoff 1. Effort S (ten minutes).

**6.4 H3 "Space: it tilts when something puzzles it"**: tilts as responses.

- *Model.*
  - Spontaneous tilts become a Poisson process from λ = 1/22 s (bored) up to 1/7 s (curious; curiosity = the top target's novelty), with a 2 s refractory period.
  - **Appraised tilts:** on a novelty spike of more than 0.5 (a new mote, a sound, you coming back), P(tilt) = 0.2 + 0.5·curiosity, toward the stimulus.
  - The hold is `logNormal(1.8 s, 0.45)`. The return is fully level 55% of the time; otherwise a partial settle at 30-50% of the angle.
  - Amplitude `8 + 7·curiosity` degrees (±25%).
  - The first 20 s of a visit keep today's rate, since fewer tilts can read as less cute at first.
- *Hook:*
  - `stepTilt` (`character.ts:862-884`), with the rate sent through `setTilts` from `Attention.apply` (`attention.ts:836`);
  - `tiltToward` (`character.ts:2175`) from `Attention.spike` (`:289-300`).
- *Reads as:* the tilt means "what was that", and when nothing is happening it mostly holds still.
- Payoff 4. Effort S. Risk: noted above.

**6.5 N4 + F7 "Space: never the same wave twice"**

- Per-play parameter jitter:
  - wave at 1.6 ± 0.25 Hz with 2-4 swings;
  - taps 2-5 at 2.4 ± 0.4 Hz;
  - inspect turns the glove 1-3 times;
  - stroke timing ±8%, reach ±10%, and glide 0.12-0.3 of the cycle;
  - an occasional lazy stroke (60% amplitude) near the end of a swim.
- A shuffle bag, so each quirk plays at most once in six picks.
- *Hook:* `QUIRKS[name].pose` (`limbs.ts:242-375`) takes a per-play `jit` object drawn in `play` (`:536-547`). `STROKE` (`:384-392`) takes a per-stroke scale.
- Payoff 3. Effort S.

---

#### 7. Breath

**7.1 Br1 "Space: no two breaths alike"**

- *Model.* Draw each cycle's parameters at the bottom of the out-breath:
  - period `T_n = T̄·e^{ε_n}`, with `ε_n = 0.5·ε_{n−1} + √(1−0.25)·σ_T·N(0,1)`, and σ_T = 0.08 awake, 0.04 in deep sleep, 0.16 in a dream (10.1);
  - depth `D_n = D̄·e^{0.1·N}`.
- *Shape of a cycle:*
  - the in-breath takes 40% of T with a cosine ease: `w = −1 + (1 − cos(π·u))`;
  - the out-breath takes 45%, a passive recoil: `w = −1 + 2·(e^{−3u} − e^{−3})/(1 − e^{−3})`;
  - a pause at the bottom takes 15% (25% asleep, 0 when excited), with a tiny OU wobble of 0.02.
- Keep `w` in −1..1: `Motes.ts:240` lifts resting motes off at the top of a breath, and `limbs.breathe` reads it (`character.ts:2143`).
- *Hook:* `breathe` (`character.ts:805-826`): replace `sin(phase)` with the piecewise waveform and a draw per cycle. `deepBreath` hands back "from the bottom of the out-breath" (`:818`), which maps onto the pause.
- *Edges:* reduced motion: `w = 0` as today.
- Payoff 4. Effort S. Risk: none.

**7.2 Br2 "Space: now and then, a sigh"**

- *Model.*
  - Spontaneous sighs: a Poisson process at 1/150 s awake, so a two-minute visit has about a 55% chance of one.
  - Evoked sighs, with probability: after `read` or `answer` ends (0.35 / 0.6), after being let go (`held` ends, 0.5), after `trust` (1.0), after coming home from a snap (1.0, a shaky one), and after a stroking bout ends (0.7).
- A sigh is `deepBreath(inhale 1.1-1.4, exhale 2.2-2.8, depth 1.9-2.3)`, plus the resting lid +0.10 during the out-breath, the ears relaxing 5° out and the spikes settling. **Then a pause of 1-2 s after the sigh** and a shallower next breath (0.7).
- *Hook:* a *new* act `sigh` in `acts.ts` (priority 1, `queue: 3`), scheduled from `Attention.sense` (`:630`) and from the acts' `finally` blocks.
- *Reads as:* relief, or contentment after you tapped its rhythm back.
- Payoff 4. Effort S. Risk: none.

**7.3 Br3 "Space: it holds its breath while it listens"**

During `heed` (`acts.ts:367-385`), depth 0.35 and period ×1.4 (shallow and slow). The answer's beats already pause the breath (`:432`). After `answer`, a release sigh (Br2). During `read`, depth 0.6. *Hook:* `setBreathDepth` (`character.ts:2350`) in `heed`'s body and its `finally`. Payoff 3. Effort S.

**7.4 Br4 "Space: its breath quickens"**

- *Model.* `T̄ = (3.6 + 3.4·(1 − alert)^1.6)·(1 − 0.35·a)` and `D̄ = 1 + 0.3·a`.
  - After a snap or three rough jolts, a = 1 gives breaths of about 2.8 s, decaying back with τ 25 s.
  - After a long swim (F6), 3.0 s for about 8 s.
- **Order in `apply`:** compute the arousal term first, then apply the existing floors: 5.8 s late at night, 5.2 s with sound on (`attention.ts:816-817`). A fright can still quicken the breath for its first seconds while sound is on, by applying the floor to T̄ once a < 0.3.
- Payoff 3. Effort S.

---

#### 8. Ears and spikes

The mesh makes this cheap. The ear tips are single vertices, 0 at `(395.5, −436, 17.4)` and 28 its mirror. The spikes are 11, 19 and 22 on one side and 36, 44 and 47 on the other (verified against `suit.json`'s `tuck`). Moving one vertex re-shades the planes around it (normals are summed each frame, `character.ts:1193-1207`) and moves the white rim, which is the silhouette's outline. A 10° swivel of a roughly 280-unit ear moves the tip about 45 units, around 22 px on a desktop.

**8.1 S1 "Space: its ears have opinions"**

- *Model.* Per ear, three spring angles about the ear's base (the centroid of the tip's neighbours in `MESH.f`):
  - **perk** χ (forward tilt), **swivel** ψ (about the vertical), and a **twitch** impulse.
- *Targets:*
  - interest: χ +6°, ψ −4° (toward the front);
  - anger or fear: χ −20°, ψ +25° (airplane ears, flattened out and back);
  - drowsy χ −8°; asleep χ −5°;
  - stroked: ψ +6° out (5.1).
- *Springs:* ω 14, ζ 0.7. A twitch is ψ +10° over 50 ms, then a spring of ω 32 and ζ 0.3, which gives a cat's flick-flick (2-3 decaying swings in about 250 ms).
- *Spontaneous twitches:* Poisson at 1/25 s awake and 1/45 s asleep (cats' ears move in their sleep); 60% one ear, 40% both, offset by 30-60 ms.
- **"It hears you click"** *(new)*: the visitor's own clicks and keys are real sounds in their room, whatever the site's sound setting.
  - Any pointerdown on the page away from Urchi (a pill, the room, the sound chip): the ear nearer the click swivels 12° toward it within 60 ms (the twitch spring) and comes back over 1.5 s. The eyes follow only if attention finds it salient; a tap in the room already releases a mote and startles.
  - Any key (not modifiers): both ears flick once toward the bottom of the screen, where the keyboard is. After three in 2 s it is habituated (A3) and nothing happens.
  - With the site's sound on, the synthesised cues add to this through a *new* `sfx.onCue((name, pan) => …)` event on the `sfx` object (`sfx.ts:1243`). A preview sounding "through the wall" (`Preview.sounding`, `sfx.ts:375`) turns the ear on the Music side, pill 5, toward it for the song's length (*ruled in the summary: Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6*). The ears reach the sound chip before the eyes do when sound comes on (the one line kept from S3, added to `soundOn`, `acts.ts:181`).
- *Hook:*
  - In `render` (`character.ts:1182-1191`), project from a copy of `V` with those 8 entries replaced: a `Float64Array(8·3)` filled in `frame`.
  - **Only while `suit === 0`**. `headFor` (`:2045`) blends to the tucked positions from `V`, so the offsets must be zero before the suit starts.
  - Add the ear and spike state to `paint`'s change check (`:2077`).
  - `URCHI_EARS` (`character.ts:336`), which the Zs and notes rise from (`RoomScene.ts:372`), stays at rest, which is fine.
- *Reads as:* cats are read by their ears. This is the second channel of emotion after the eyes, and it shows at phone size.
- *Edges:*
  - Reduced motion: poses only (flattened, perked), eased at once, no twitches.
  - Afloat: none (tucked).
  - Asleep: twitches.
- Payoff 4. Effort M. **Risk:** a swivel re-shades the ear's planes. Check that no plane flips its winding (the `tarea` sign, `:1205`) at ±25°. The panel shows it.

**8.2 S2 "Space: it bristles"**: piloerection. Urchi is an urchin.

- *Model.* Bristle b in 0..1 moves each spike tip to `base + (1 + 0.14·b)·(tip − base)`, with a per-spike OU quiver of 1.2° SD when b > 0.3.
  - A startle gives b → 0.8 in 80 ms, decaying with τ 1.4 s, scaled by habituation (A3).
  - A glare holds b = 0.55 for its length.
  - Content or asleep: b = −0.04 (the spikes a hair softer).
  - After a bristle, the spikes settle with a slight overshoot (a spring of ζ 0.4).
- *Hook:* the same vertex mechanism as S1 (indices 11/19/22/36/44/47), home only.
- *Reads as:* the silhouette, the strongest read at any size including a phone, puffs up when it is startled. The most on-brand realism item in the list.
- Payoff 4. Effort S once S1 exists. **Risk:** the wider silhouette must clear the caption band. The spikes are on the sides and the chin does not move. The canvas frame (x ±701, `character.ts:729-730`) has room.

---

#### 9. Moods

**9.1 A1 "Space: Urchi has moods, not only faces"** (slimmed, built on what exists)

- *State*, extending `Attention` rather than adding a second model:
  - **valence** v in [−1, 1]: *new*;
  - **arousal** a in [0, 1]: the existing private `arousal` (`attention.ts:163`), widened from its 0.45 cap under `lifelike`;
  - **curiosity**: the existing novelty (the top target's `novelty`);
  - **boredom**: the existing `boredFor`;
  - **fatigue** f in 0..1: *new*, mostly afloat;
  - **trust** T in 0..1: *new*, persisted (section 12), the one trust value on the site (*ruled in the summary: it lives once, in `eigengrau:urchi`, and the finds' events feed it*).
- *Dynamics*, per frame on the room's clock (0.3):
  - `v += (v₀ − v)·dt/25`, with v₀ = 0.1 + 0.3·T (a trusting Urchi rests happier);
  - arousal decays as today (`ALERT.tau` 10 s, `:97`);
  - `df/dt = +1/600` awake, +0.03 per swim stroke, +0.1 per fling, −1/300 at rest.
- *Appraisals* (Δv, Δa, scaled by A3):

  | Event | Δv | Δa | Other |
  |---|---|---|---|
  | You come back after more than 4 s away | +0.1 (+0.2 more when T > 0.4) | +0.2 | |
  | Pointer shaken over its face | −0.15 | +0.2 | |
  | Mote released | 0 | +0.15 | |
  | Mote close by | +0.05 | 0 | |
  | Sound on | 0 | +0.25 | |
  | Rhythm answered | +0.15 | +0.1 | |
  | Its own beat tapped back | +0.4 | | T +0.15 |
  | Stroked (per stroke) | +0.05 (cap +0.4) | | T +0.02 |
  | Grabbed afloat | −0.05 (+0.05 when T > 0.5) | +0.3 | |
  | Flung | −0.1 | +0.4 | |
  | Line snapped | −0.5 | +0.5 | |
  | Woken at night | −0.4 | +0.5 | |

  The proposal's "ignored, −0.05 a minute" row is cut. Stillness already makes it drowsy, and someone reading the caption is not ignoring it.
- *Expression*, continuous. `Attention.apply` (`attention.ts:808-852`) keeps its "send only what changed" key, with continuous values rounded to 0.05 so `setRestLid`'s 1.2 s ease (`character.ts:2360`) is not restarted every frame:
  - resting lid = max(today's, 0.12·f, 0.08·max(0, −v)·a);
  - pupils (11.1);
  - blink median (4.2);
  - breath period and depth (7.4);
  - tilt rate (6.4) and quirk rate afloat ∝ (0.4 + boredom)·liveliness;
  - ears: perk = curiosity·(1 − f), flatten = max(0, −v)·a;
  - bristle: startle, plus 0.55 in a glare;
  - head speed ×(0.8 + 0.4·(1 − a)).
- **Faces keep their explicit triggers**:
  - the glare: woken at night, a shake, three jolts, home after a snap;
  - the fluster: caught, or a hard bump;
  - happy: listening, which means he is playing music.

  Affect shapes their onsets and afterglow (A2). It does not trigger them. A threshold on a hidden state is a tuning trap, and it would blur what happy means.
- Payoff 4. Effort M. **Risk:** hidden state is hard to tune. The panel's valence-arousal square (16.4) is built with it.

**9.2 A2 "Space: a glare builds, and lingers"**

- *Angry.*
  - First 150-250 ms of pre-phase: the lids come to 0.2 with the slant (a squint, `setLids`) while the spikes bristle (S2) and the ears flatten (S1).
  - If it was a fright (the line snapped, woken at night), the pupils first go big and round for up to 2 s (P1's cap, 1.12). This is the half of P4 worth keeping.
  - Then the glare face, swapped in its blink as now.
  - On the way out the face goes neutral, but **the resting lid stays 0.08 lower for 4-6 s** and the ears come back over 2 s: still a little cross.
- *Embarrassed:* after "><", 1-2 s of looking away down and to the side (2.4's aversion point), then a double blink before it looks back at you.
- *Hook:* `Faces.react` (`Faces.ts:70-79`) and `frame` (`:125-149`), with a *new* rest-lid override and the ears (S1).
- Payoff 4. Effort S. Risk: none.

**9.3 A3 "Space: it gets used to you"**: habituation by kind.

- *Model.* A sensitivity h_k in 0..1 for each kind of stimulus: startle, shake, mote release, sound toggle, grab, tug, the news tug, flinch (5.2), click (8.1).
  - Response = h_k × base. After each response, h_k ×= 0.65, recovering by `h_k += (1 − h_k)·dt/60` (about a minute).
  - **Dishabituation:** a stimulus of a new kind restores half of the others.
- *Applied to:*
  - the startle's widen, pause and bristle (`attention.ts:395-402`), which today are identical every time and only rate-limited;
  - the wind-up (the third release in a minute gets a look, not `windUp`, `Motes.ts:127`);
  - the glare's probability;
  - `soundOn` (toggle the chip five times: an ear flick, then nothing).
- *Hook:* a *new* map next to `spike`'s novelty (`attention.ts:289-300`), which already habituates novelty by `1 + 0.45 × recent spikes`.
- *Reads as:* it cannot be wound up like a toy, which the attention header already aims for (`:13-15`).
- Payoff 4. Effort S. Risk: none.

---

#### 10. Sleep life (promoted)

`TIME_ZONE` is decided as `"Australia/Melbourne"` (decisions.md, item 1), so everyone who arrives in his 01:00-06:59 meets Urchi asleep on arrival (`attention.ts:208-223`). From Sunday 4 October that is New York's 10:00-15:59 (09:00-14:59 after 1 November) and London's afternoon and early evening, and a US-morning launch in the week of 23 November lands at his 01:00. For them sleep is the whole visit, so it should be as alive as waking.

**The softer first wake** (*decided, and moved into package one, week 2*). Today a click that wakes it at night brings the glare (`CreativeSpacePanel.tsx:195`, `if (woke && night) faces.react("angry", { hold: 2.8 })`). The night's first wake in a browser becomes a groggy one instead: heavy lids and a slow blink. The glare stays for a second wake the same night, and the yawn (M1) joins the first wake once it exists. A stranger's first touch at 01:00 should not be told off. "First" is read from `wokeAt` in `eigengrau:urchi` (12.1), written through `store.ts`: that one field lands in week 2, ahead of the rest of the record in week 9. It is one line of `CreativeSpacePanel.tsx`, a hot-spot file, so the branch names it in its first commit (decisions.md, item 6, and fact 5: the launch audience arrives at his night).

**10.1 6.3 "Space: it dreams"**

- *Pitch.* Stay with it at night and you see it dream.
- *When:* `mood === "asleep"`, **not while he is playing something** (it listens instead, README), and watched for more than 90 s on the room's clock (it stops while the tab is hidden). A dream bout starts every `logNormal(100 s, 0.3)` and lasts 12-20 s. Cats alternate slow-wave and REM sleep; this is the compressed version.
- *During a bout:*
  - the breath becomes irregular (σ_T 0.16, Br1) and quicker (4.5 s);
  - **the lids flutter**: brief cracks to **0.74-0.77 shut**, just under the closed-arc swap at 0.78 (`ownEye`, `character.ts:1022`), so a sliver of iris colour flickers between closed arcs, in irregular bursts at 4-6 Hz, per eye through `setLids`;
  - the ears twitch every 1-3 s (S1);
  - the spikes quiver (bristle OU, SD 0.1);
  - small head twitches (kicks of ±15°/s);
  - the Zs pause (`Faces.ts:148`): it is not snoring now, it is somewhere else.
- One bout in three is a **dream chase**: the flutter comes in quick runs, and one ear flattens as if it were running.
- The bout ends with a long out-breath (`deepBreath`), a settle on the pillow (10.2) and the Zs again.
- Tap a rhythm during a dream and `murmur` (`acts.ts:482`) gets richer: it half-wakes, one eye opens (0.64, as today), it blinks the first two beats back **very slowly**, and it drops back.
- *Copy:* after the first bout has been *seen*, the state caption changes from `URCHI_STATES.asleep` to a *new* `URCHI_STATES.dreaming`: *"It is {time} here. It is dreaming."* (32 characters with "3:12").
- *Where:* Space at night (`?hour=3` shows it).
- *Data:* none. The bouts are seeded per visit.
- *Edges:*
  - Reduced motion: the flutter becomes three still states (shut, crack, shut) at the bout's start and end, no twitches, and the caption still comes.
  - Sound off: silent (nothing to add).
  - Phone: identical.
  - Afloat at night it dozes where it floats (README): the head twitches and the limbs' idle life twitch, and the eyes are too small to flutter visibly.
- *Implementation:* a `dream` act (M) using Br1, S1, S2 and 10.2.
- Payoff 5, now that the zone is Melbourne's. Effort M. **Shows:** that the owner cares what happens when nobody is watching, which the caught-in-the-act mechanic already says; this completes it. **Risk:** a flutter that looks like a rendering glitch. Keep the cracks thin, short and irregular.

**10.2 M10 "Space: it settles on its pillow"**

- Asleep, every 60-150 s: a small shift of position, pose roll ±2°, a deep breath out and one ear twitch.
- Every 4-8 minutes, a **side swap**: it turns its head to the other side over 2 s (the sign of `SLEEP_ROLL`, `attention.ts:34`), and the Zs switch ears (`Faces.ts:147-148`).
- *Hook:* `sleepSide` is `readonly` today (`attention.ts:141`); make it settable, and have `restPose` (`:427-430`) and `Faces` read it live.
- Payoff 3. Effort S.

---

#### 11. Pupils and the near response

**11.1 P1 "Space: its pupils have a size of their own"** (slimmed)

- *Why slimmed:* the pupil is clipped to the eye's shape (`character.ts:1283`, `:1368`), and at `prx 57` it is already 57% of the eye's width. At 1.29× a dark pupil nearly fills the eye, and Urchi's big coloured eyes turn black. Slits would change its face on the one occasion they could trigger (a shooting star, one visit in fifty, afloat where the eyes are 30 px).
- *Model.* One scale s multiplies both `EYE.prx` and `EYE.pry` (s_x = s_y), clamped **0.88-1.12**:
  - **interest and arousal** (the task-evoked response), the main driver: `+0.08·a + 0.05·curiosity`, lagging 0.4 s behind the event, peaking about 1.2 s after it and returning with τ 1.5 s;
  - **near:** `−0.05·vergence` (E7);
  - **fatigue:** `−0.03·f`;
  - **hours:** late or night +0.04;
  - **recognition:** +0.10 for about 1 s (section 12);
  - **out into the dark:** +0.06 over 2-3 s after the float-in, back in 0.4 s at home. This is the one line kept from P2; it only shows zoomed in.
- *Pale pupils* (40 colourways, `pupilDark` false, `:970`): the inner oval reads as the eye's gleam, so apply half the gain. A slightly bigger gleam when interested reads as brighter eyes, which is right.
- *Hook:*
  - *new* `setPupil(s, tau)` (or state fed from `Attention.apply`);
  - `ownEye` (`:1021`) and the angry face's `big` (`:997`) multiply by it;
  - add it to `paint`'s change list (`:2077`).
- *Edges:*
  - Reduced motion: the size swaps during blinks.
  - Afloat: runs, but is only visible zoomed in.
- Payoff 3. Effort S. **Risk:** style. Test with `?col=whale`, `?col=pool` and `?col=marmalade` and a dark-pupil colourway.

---

#### 12. Memory and persona

**12.1 Mem "Space: it remembers you"**

- *Data* (*new* `src/engine/urchi/memory.ts`): `localStorage["eigengrau:urchi"]`, about 200 bytes, every access guarded as the site does (`sky/seed.ts:39-58`). Private mode keeps it for the page only. *Ruled in the summary: storage goes through `src/lib/store.ts`'s `keep()` (versioned, guarded, and kept in step across browser tabs), so `memory.ts` reads and writes through it rather than touching `localStorage` itself.*

  ```
  { "v": 1,
    "seed": "k3x9q2",                 // persona (12.2), set on the first visit that reaches Space;
                                      // the browser's one seed, and the finds' code salt comes from it
    "visits": 7,                      // visits that reached Space
    "visit": "1790500000000",         // the visit last counted, named as sky/seed.ts names one:
                                      // String(lastVisit() ?? "first"), the eigengrau:told pattern
    "trust": 0.42,
    "rhythm": [310, 305, 620],        // its own version, as last tapped back (Call's `version.gaps`), or null
    "rhythmAt": 1790400000000,        // or null
    "wokeAt": 1790300000000 }         // last woken from the night's sleep (ms), or null
  ```

  - When the last visit ended comes from the existing `eigengrau:visits` (`lastVisit()`, `visits.ts`). Do not store it twice.
  - Write it on `pagehide` or when the page goes hidden, as `visits.ts:87-88` does.
  - Add the key to README's list of what the site keeps (`README.md:106-113`) and to `/kept`, which lists it with what it holds and a "Forget me" button that clears every `eigengrau:` key (decided, decisions.md, item 6).
- *Trust dynamics:*
  - up: +0.15 for its own beat tapped back (the `trust` act, `Call.ts:268`); +0.02 per stroke (at most +0.1 a visit); +0.03 per minute of calm company (pointer near, no shaking; at most +0.1 a visit); +0.05 when a slow blink is met with stillness (M3);
  - down: −0.1 per line snapped, −0.15 per night waking;
  - from the finds (*ruled in the summary: trust lives once, here, on this model, and the finds keep no second store*): the keeps trade's match plays the same `trust` act, so it counts as its own beat tapped back (+0.15); giving a find back afloat +0.05; taking a reverent find +0.05; a line snapped by a throw is the −0.1 above. The finds' thresholds (once types at 0.5, `giveKept` at 0.6, the eye-coloured gem at 0.8) read this value;
  - between visits it decays toward 0.2: `T ← 0.2 + (T − 0.2)·e^{−days/30}`.
- *Behaviours.* The default is silence, so people who notice find it.
  - **First visit:** cautious. The mutual-gaze hold is ×0.6, the first quirk and swim come 10 s later afloat, and the first look at the pointer when it moves has latency ×1.2, as for a new thing.
  - **Back within 30 days, T > 0.3, by day:** recognition. After its eyes open (the intro's end or on arrival) and a 1.5-2.5 s look out at you, the pupils dilate 10% over about 1 s (P1), then a slow blink and the ears perk. When the pointer first moves in the next 10 s, a double-take at it (M4) at latency ×0.8: familiar, not new. (Not "where your pointer was last seen": `pointerSeen`, `visits.ts:121`, is session memory.) Optional caption, once, in the `auto` slot: *"It has seen you before."*
  - **Woken last night, and it is night again** (`wokeAt` within the last 20 h and at his night hours): asleep, it turns its face 10° away from the pointer's side, and the peek is 40% shorter. Once a visit, the state caption reads *"It is {time} here. It remembers last night."* (41 characters with "3:12").
  - **A rhythm kept:** see 12.3.
  - *Cut:* "ignored last time, so cool for 20-40 s". Most first visits end without touching Urchi (people come to read Projects), so this would give a cold shoulder to exactly the visitors the site is for.
- *Arrival budget* (*new*): at most one arrival act a visit, in this order:
  1. a gift parcel (a find arriving by `/?find=<code>`, Space finds) (*ruled in the summary: it comes first*);
  2. the news look (`URCHI_NEWS`, once per visit, `visits.ts:140-155`). It looks at the Desk pill only when `UPDATED.desk` moves for a new game, tool or paper, never for the daily puzzle (*ruled in the summary*);
  3. the rhythm greeting (12.3);
  4. recognition.

  Only the first in this order that applies plays; the others wait for another visit. It is dropped if the visitor has started doing something. *Ruled in the summary: at most one arrival act a visit, so the first draft's rule that a later one waits at least 8 s after the one before goes.*
- *Edges:*
  - Reduced motion: expressed through lids and pupils only.
  - Phone: identical.
- Payoff 4. Effort M. **Risk:** privacy perception. It is local-only, holds nothing personal, and the key is documented. *Decided:* About says so as the caption and accessible name of its mark, *"It remembers you. Only in this browser."*, not in the status line, so About's foot stays at two lines; `/kept` explains the key and offers "Forget me" (decisions.md, item 6).
- Note the stance in `Call.ts`'s header: *"The only thing it counts is answers in this visit, in memory."* This changes that on purpose, and *decided:* `Call.ts:14` is rewritten to match in the same commit (decisions.md, item 6).

**12.2 Per "Space: every visitor's Urchi is a little different"**

- *Model.* The seed is stored in `eigengrau:urchi.seed` on the first visit, so it is the same Urchi for that visitor every time, unlike the sky, which is drawn per visit. Traits come from `rng(subSeed(hashSeed(seed), "persona"))` (moved to `src/lib/random.ts`, 1), each drawn from Beta(2, 2) (mostly moderate, rarely extreme) and mapped inside **narrow** ranges:

  | Trait | Scales |
  |---|---|
  | boldness | mutual gaze 2.6-4.2 s (2.4); head duration ×(1.1 − 0.2·bold) (2.2); startle magnitude ×(1.2 − 0.4·bold); drift toward what it watches afloat, `DRIFT.pull` ×(0.7 + 0.6·bold) (`Float.ts:85`); stroking limit (5.1) |
  | liveliness | quirk gap ×(1.4 − 0.8·lively) (`limbs.ts:422`); tilt rate ×(0.8 + 0.4·lively); head ζ 0.8 − 0.2·lively; flick rate ×(0.85 + 0.3·lively); breath T̄ ×(1.06 − 0.12·lively) |
  | curiosity | novelty gain ×(0.85 + 0.3·c); tilt amplitude +3°·c; how likely it reaches afloat |
  | sleepiness | doze after `IDLE.doze` ×(0.8 + 0.4·(1 − sleepy)) (`attention.ts:99`); microsleep hazard ×(0.7 + 0.6·sleepy) |
  | handedness | which arm waves or reaches first (65/35); which ear twitches more; bias of `sleepSide` (`attention.ts:141`) |
  | asymmetry | lazy-lid side and amount (16.1) |

- `?urchi=<seed>` forces a persona, as `?sky=` does (`sky/seed.ts:30-36`), to share or debug one.
- *Decided: the persona fixes temperament only. The eyes' colourway stays drawn per page load, because the eye accent (Style R15), the colophon's hundred eyes and the finds' labels ("Its eyes were denim.") all draw from it. It would change only if those three were dropped (decisions.md, item 6; summary reconciliation 6).*
- *Reads as:* two friends comparing notes find that one Urchi stares and the other looks away. That is a conversation about the site, which is the point of a portfolio.
- Payoff 3 (4 with memory). Effort S. **Risk:** an extreme draw that feels wrong. Beta(2, 2) and the narrowed ranges keep every draw recognisably Urchi, and the panel's persona sliders check the corners.

**12.3 6.2 "Space: it knows your rhythm"**

- *Pitch.* Tap Urchi's own version of a rhythm back once, and next time it greets you with it.
1. When the `trust` act fires (`Call.ts:268`), memory stores the version's gaps (Call's `version.gaps`, which include its own beat) and the date.
2. On the next visit within 30 days, by day, as the third item of the arrival budget (after a gift parcel and the news look, 12.1): after its eyes open and a 1.5-2.5 s look at you (pupils dilating), it leans in (`leanUrchi`, `RoomScene.ts:423`) and **blinks your rhythm once**, slowly. With sound on, each beat has the soft low pat (`sfx`'s `pat`, `sfx.ts:896`). This is `answer` (`acts.ts:414`) with `plan(gaps, start, reduced, true)` (`Call.ts:69`).
3. It waits 4 s with soft eyes (`SOFT`) and its ears perked.
4. If you tap it back within 15 s (`MATCH.within`, `Call.ts:34`), it plays the trust act at once: trust +0.1, 60 s of soft eyes instead of 20, and a sigh. If you do not, it looks at you a moment, tilts, and carries on. No sulk, since you may not remember.
- *Copy:* optional caption after a match: *"It kept your rhythm."*
- *Where:* Space, at home.
- *Data:* `eigengrau:urchi.rhythm` and `rhythmAt`.
- *Edges:*
  - Sound off: blinks only, which are still recognisable.
  - Reduced motion: the lids shut and open on the beats, as `answer` already does.
  - Night: it murmurs the rhythm in its sleep instead. One eye cracks (0.64) on each beat, and there are no pats.
  - Phone: works (taps).
- *Implementation:* memory (M), plus a `greet` act reusing `answer` (S).
- **Shows:** the site keeps its promise to reward people who notice. It remembers not only that you came but what you did. **Risk:** on a shared computer a stranger gets greeted, which is harmless and charming.

---

#### 13. Afloat: the body carries it

**13.1 F1 "Space: its head stays level when it tumbles"**

- *Model.* Head roll relative to the body = `−0.4·wrap(b.a)`, clamped **±10°**. It lags the body on a spring of ω 7 and ζ 0.6, so it is late on a fast spin and then catches up. Yaw likewise when the body spins faster than 1 rad/s. The eyes' VOR (2.3) adds the rest when zoomed in.
- *Hook:*
  - `Float` already gives attention the figure's angle (`lookFrom`, `Float.ts:477`). Pass the body angle and spin to the character through a *new* `ch.bodyTurn(angle, spin)`, and add the term to the roll in `frame` (`character.ts:2134`).
  - The body "follows the head's turn and tilt part of the way" (`character.ts:34-36`), so **leave this term out of what the body follows**, or the suit cancels it.
  - The whole figure turns as a plane (`RoomScene.ts:495`, `m.rotation.z`), and this term is painted inside it.
- Payoff 4. Effort M. **Risk:** the helmet-to-neck join at ±10°. Test on `/dev/suit`.

**13.2 F2 "Space: it looks, then it turns, then it swims"**

When a swim starts: the head goes after 120-180 ms, the body's turn (`SWIM.turn`) after 300-450 ms, and the first stroke once the heading is within 0.5 rad (today the thrust is scaled by `turned`, `Float.ts:893`). The legs trail through the limbs' springs, as they already do. *Hook:* in `swimStep` (`Float.ts:764-781`), delay `swim.t0` by 0.35 s after `att.play("swimTo")`. Payoff 3. Effort S.

**13.3 F3 "Space: it watches its hands"**

- Extend the look at its own hand beyond `inspect` (`limbs.ts:256`) to reaches (`REACH_FOR`) and braces. **The head leads**: the look (`handAim`, `character.ts:2154`) starts 150-250 ms before the hand moves, since the pupils are invisible at this size.
- *Hook:* `reachOut` (`Float.ts:740-758`) starts the look, and `L.reachFor` waits `gamma(3, 0.06)` s.
- Payoff 3. Effort S.

**13.4 F5 "Space: spun, it is dizzy"**

- *Trigger:* after |w| > 4 rad/s for more than 0.8 s (a hard spin or fling), once the spin drops below 1 rad/s.
- *Head-led:*
  - 1.5-2.5 s of head wobble (OU, 3° SD, on the pose's roll and yaw);
  - lids 0.2;
  - then a head shake (roll ±4° at 5 Hz for 0.3 s, M9) and a blink.
- *The eyes, for the zoomed-in:* nystagmus at **full reach** (a slow drift of 20 units the way it spun, a fast reset, about 2.5 Hz, decaying). That is about 3 px at 2× zoom and physiologically shaped. A true-to-scale version would be invisible.
- *Hook:* a *new* act `dizzy`, played from `Float.frame` (`Float.ts:681-701`) using `b.w`.
- *Reads as:* comic and physiologically right, and it rewards people who fling it.
- *Edges:* reduced motion: never (there is no fling).
- Payoff 4. Effort M.

**13.5 F6 "Space: swimming tires it"**

- Each stroke adds +0.03 fatigue.
- Stroke time `2.6·(1 + 0.5·f)` s and thrust ×(1 − 0.3·f); swims come further apart (N1).
- After a swim, breaths at 3.0 s for about 8 s (Br4).
- With f > 0.5, a rest pose: the FLOAT posture (`limbs.ts:238`) with the arms 20° wider and the head tipped back 6°.
- *Hook:* `SWIM` (`Float.ts:143`) and `strokePhase` (`:819-821`).
- Payoff 3. Effort S.

---

#### 14. A library of micro-acts

These are new generators in `acts.ts`, and quirks in `limbs.ts` where the body is involved. Each is rare, habituated (A3) and never twice in a row, and each respects `blinksHeld` and the act priorities (`Attention.play`, `attention.ts:349`). Frequencies assume a visitor stays about three minutes.

**M1 "Space: Urchi yawns"** (late hours only; at most one in three minutes)

It has no mouth, so build on the stretch that already exists (`stretch`, `character.ts:2185`, `STRETCH` at `:1099`):
1. Over 1.0-1.3 s, an in-breath (`deepBreath`, depth 2.2) while the stretch's hump tips the head back 12°.
2. The eyes squeeze shut into the closed arc, the ears flatten back 20° and the spikes relax.
3. Hold 0.8 s.
4. A shiver: roll ±2° at 3 Hz for 0.4 s.
5. A long out-breath, then the eyes open to a heavy lid (+0.12 for 5 s) and a slow blink.

Afloat, the `stretch` quirk's arms join in. At home in the day, `wake`'s stretch stays as it is. *Edges:* reduced motion: lids only. Payoff 3. Effort S.

**M2 "Space: Urchi sneezes"** (a mote drifting into its face, one `closeBy` in five; at most once a visit)

1. *Ah-:* two or three quick catches of breath, 0.25 s each (`pauseBreath` plus `kick`); the head tips back 4°, 7° and 10°; the lids half-close (0.4, then 0.6); the pupils converge on the mote.
2. *Choo:* a pitch kick of +140°/s (the face snaps down), the "><" face for 0.3 s (`setFace("embarrassed")`, which exists), a bristle of 1.0, and the mote blown off at 60 px/s away from the face (a *new* `Motes.blow(m, vx, vy)`).
3. A head shake (M9), a blink, then a glance at you, a little embarrassed (A2).

With sound on, a *new* tiny `sfx` cue: a 60 ms noise burst, band-passed at 3 kHz, soft. *Decided: the sneeze joins `src/audio/sfx.ts` and ships with the micro-acts in December; with sound off it is silent, and the jolt of the head is its visible counterpart (decisions.md, By section, Urchi 5).* *Edges:* reduced motion: the "><" face and the mote vanishing only. Payoff 5. Effort M.

**M3 "Space: Urchi slow-blinks at you"** (the cat's trust signal, now unprompted)

- *When:* v > 0.4, T > 0.3, the pointer still for more than 6 s, and it is looking at you: 20% per 10 s.
- *What:* a slow blink held 0.5 s, the head dipping 3°, then a soft lid for 5 s.
- If the visitor stays still for 3 s more, trust +0.05 ("it asked, you did not move").
- *Edges:* reduced motion: fine (lids). Payoff 4. Effort S.

**M4 "Space: Urchi does a double-take"** (something new appears while it is looking elsewhere: the news pill, a far mote released, you back after more than 20 s, recognition)

1. A quick glance at it (a saccade and 30% of a head turn).
2. Back to where it was for 250-350 ms.
3. A 150 ms freeze with the breath held.
4. A fast, full turn (`"quick"`), widen 0.08, ears perked, bristle 0.3.

*Hook:* `tug` (`acts.ts:29`) and `comeBack` (`:54`) can open with it. Payoff 4. Effort S.

**M5 "Space: Urchi peers"** (something faint or far: the faintest mote, a pill it has not looked at before)

Lids to 0.3 (a squint), a 2% lean (`RoomScene.leanUrchi`, `:423`), vergence 0.2, ears perked forward, held `logNormal(1.1 s, 0.3)`, then the eyes open with a small widen when it "gets it". Payoff 3. Effort S.

**M6 "Space: it loses the mote"** (a watched mote fades out; `Motes.ts:210` and `:214` remove it)

The pursuit **coasts** 250-400 ms past where the mote vanished (predictive pursuit carries on into the dark), then a search: 2-3 saccades within ±8° of the last position, a tilt and a blink. Then back to you. *Hook:* a *new* `att.lostSight(id, lastAt, velocity)` from Motes' remove path. Payoff 4. Effort S. A brain predicting is more visible here than anywhere else.

**M7 "Space: Urchi stares at nothing"** (once a visit, after 30 s of calm; cats do this)

It fixes on an empty spot in the room for 3-6 s, ears perked, with a slow tilt, then **smoothly pursues nothing** for 10-15° (the head drifting, the eyes riding with catch-up hops, as if something moved), then looks at you, then back at the spot. No caption. People who notice will wonder whether a mote was there. It was not. Needs 3.1's pursuit. Payoff 5. Effort S.

**M9 "Space: a shake of the head"** (after a sneeze, a fling, or coming home through the dither after a snap)

A roll oscillation of ±5°, decaying at 4.5 Hz over 0.5 s. The ears flop with it: the S1 springs follow the head's roll acceleration. Payoff 3. Effort S.

**M11 "Space: the walls moved"** *(new)*

- *When:* desktop only; the window resized by more than 40 px within 0.3 s (someone dragging an edge; the room rescales Urchi with it).
- *What:* a startle toward the edge that moved (left if `screenX` changed, otherwise right or bottom), ears perked, a 1-2 s look along it, then back at you. A second resize within 30 s gets only an ear flick (A3).
- *Hook:* a `resize` listener in `CreativeSpacePanel.tsx`, feeding `att.startle(point)` (`attention.ts:395`).
- Payoff 2. Effort S. For people who notice.

*Cut:* M8, hiccups. A jolt with no cause, no mouth and no body at home reads as a dropped frame.

---

#### 15. 6.1 "Space: it saw it too"

- *Pitch.* A shooting star crosses the sky behind Urchi afloat. Urchi watches it go, then turns to see whether you did.
1. The star appears (`Stars.shoot`, `Stars.ts:430-455`). This only happens in the "very rare" sky (one visit in fifty, or any `?sky=` seed that draws it), where stars come every 16-32 s for 1.8-2.6 s each.
   - A *new* `Stars.onShot(cb)` passes the start, heading and duration.
   - A *new* `Sky.clientOf(x, y, layer)` maps the star's sky coordinates to client px, using the view, zoom and parallax the sky already applies per layer.
   - *Ruled in the summary: this is the site's one shooting-star event. The same crossing from `Stars`, through `onShot`, also serves the finds' "star that fell" (Space finds §4) and the sky calendar's meteor showers (Strategy §10), with this one `witness` act. On shower nights stars cross every 5-11 s, so the repeats rule below is essential, not optional.*
2. After a 120-160 ms latency (E5), with arousal +0.3: **the head turns** to the star's head, tilts 0.3 toward it, the body drifts a little toward it (`DRIFT`), and the arm on that side reaches after it (`REACH_FOR`, `Float.ts:740-758`, with the star passed as a "thing").
3. Pursuit along its path (3.1): head and body at this size, the eyes too when zoomed in.
4. As it fades, the look **coasts** 300 ms past its end (M6), then holds the spot for 1 s.
5. Then it **turns to you**, head and eyes (`look("you")`), with a widen of 0.08, holds 0.8 s, and gives a slow blink. The look from the thing to you and back is referential gaze, the hallmark of a social mind.
6. Back to the spot once more, then free.
- *Repeats:*
  - the first star in a visit gets the whole scene;
  - the second and third get steps 2 and 5 only;
  - after that, a look only if it is already facing that way (A3, kind "shot").
- *Sound:* nothing new. *Decided: no shimmer cue, because the house rule is to use the existing cues first, and on a shower night a new cue would sound every 5-11 s.*
- *Copy:* no caption. For screen readers, add to the panel's live region (`SAID`, `CreativeSpacePanel.tsx:32`) once a visit: *"A shooting star crossed. Urchi watched it go."*
- *Where:* Space, afloat only (the sky is only there afloat).
- *Data:* none. The sky's seed decides, or on shower nights the sky calendar.
- *Edges:*
  - Reduced motion: the sky draws no shooting star (`Stars.ts:432`), so it never happens.
  - Phone: works; the head turn and reach read at 40% size.
  - Night: afloat it dozes, so it does not see it, which is right.
- *Implementation:* `onShot` plus `clientOf` (S), a `witness` act (S), and 2.1, 3.1 and 2.3 underneath.
- Effort S on top of sections 2-3. **Shows:** shared attention, the thing developmental psychologists look for in infants, done by a portfolio's mascot. **Risk:** rarity, except on shower nights (the Orionids around 21 October, the Leonids around 17 November, the Geminids around 14 December). The debug panel injects it for the owner's demo reel through a *new* `sky.shootNow()`.

---

#### 16. Finishing and showing it

**16.1 E9 "Space: its eyes are a pair, not twins"** (slimmed to what can be seen)

- **Lazy lid:** one eye's resting lid is 0.03-0.05 lower, on the persona's side (12.2). That is 6-10 units, 3-5 px.
- **Expressive asymmetry:** during a puzzled tilt (H3, or the `puzzled` reaction in `site.ts:50`), the lid on the high side of the tilt drops 0.1: a sceptical eye.
- **The glare:** the slant on the side toward its target is 10% steeper.
- *Cut:* the 8-16 ms blink onsets (under a frame), the 0-3% anisocoria and the 0.5-unit vergence bias (under a pixel).
- *Hook:* `lidOf(i)` (`character.ts:2065-2067`) takes a per-eye offset. The angry face (`:996-999`) takes a per-side slope.
- Payoff 2. Effort S. **Risk:** over about 5% it reads as an injury.

**16.2 E10 "Space: a glint that stays with the light"** (an experiment, behind the `catchlight` flag)

- One small ink-coloured facet (#e9e9e2, a low-poly quad about 14×10 units, about 7×5 px at home) per eye, placed where `LIGHT` (`character.ts:754`) would reflect off a sphere under the eye plane.
- It stays fixed relative to the light while the pupil moves beneath it, and it is hidden under the lid. The visor already has a glint (`VISOR.glint`, `:1459`), so there is precedent.
- **Dark-pupil colourways only.** On pale ones the inner oval already reads as a gleam.
- *Reads as:* wet, living eyes. A pupil that moves under a glint that does not is one of the strongest "alive" cues in character design.
- Payoff 4 if it survives the side-by-side. Effort S. **Risk:** it changes a face the owner designed and adds a third tone to the eye. *Decided: it stays a flagged experiment, `catchlight: false` in `lifelike.ts`, off in production and switchable only in `/dev/urchi` (a development route, never shipped), where the side-by-side screenshots live. It would change only if that side-by-side reads as wet eyes and not a third tone on every dark-pupil colourway (decisions.md, item 6).*

**16.3 H2, H4, H5 and the favicon**

- **H2 "Space: it winds up before a big turn"**
  - *When:* a target *identity* change that turns the head more than 35°, not "quick", 60% of the time. Never the pointer, never pursuit.
  - *What:* 80-120 ms of counter-movement at 10-15% of the amplitude the other way, plus a 1-2° pitch dip. Then the turn, with the B2 blink.
  - `windUp` (`acts.ts:292-311`) is the hand-made version for motes; this makes it the default grammar.
  - *Hook:* in `frame` (`:2094-2100`), on a new far `look.hx`, `kick` the pose (`:2389`) the other way first.
  - Payoff 3. Effort S.
- **H4 "Space: its head swings on a neck"**
  - A yaw pivot **40-50 units** behind the head's middle: `shift += 45·sin(yaw)` (about 16 px at a full turn). For pitch, `rise += 30·sin(pitch)`, plus a scale of `1 + 0.015·sin(pitch)`.
  - *Hook:* `frame` sets `shift = 0` (`:2119`) and adds the bob's shift; add the arc there. `render`'s `toCanvas` (`:1250`) already applies `shift` and `rise`.
  - Check against the caption band and "placed by its eyes" (README). Hit testing follows automatically (`alphaAt` uses `lastToCanvas`).
  - Payoff 2. Effort S.
- **H5 "Space: its head is never quite still"**
  - OU on yaw, pitch and roll with SDs of 0.35°, 0.25° and 0.45°, θ 0.7/s. Asleep: roll SD 0.2° with θ 0.2. The eyes cancel the yaw and pitch (2.3).
  - *Hook:* `frame`'s `extra` (`:2133`), which is already skipped under reduced motion.
  - Payoff 2. Effort S.
- **"Urchi: the favicon waits the same way"** *(new)*
  - `LiveIcon.tsx:186` schedules blinks with `rand(...BLINK.gap)`. Draw from `logNormal(3.2 s, 0.6)` clamped to 0.8-16 s instead, and keep its double-blink chance.
  - Payoff 1. Effort S (fifteen minutes).

**16.4 D2 "Space: `?debug=urchi`, the recorder"** (phase 2 of the panel)

- **More groups:**
  - Ears and spikes: perk, swivel and flatten targets; twitch rate and spring; bristle size and τ.
  - Affect: time constants; the appraisal table as editable rows.
  - Persona: six sliders, Reroll, "Copy seed".
  - Memory: the stored JSON, "Forget me", and "Pretend a return after N days".
- **Live readouts:**
  - a valence-arousal square with a 10 s trail;
  - bars for curiosity, boredom, fatigue and trust;
  - the mood, the face and the running act;
  - the top four targets with salience bars and the hysteresis line.
- **The recorder:** "Record two minutes" gives histograms of blink intervals, fixation durations and breath periods, with their CVs written out ("Blinks: fifteen a minute, CV 0.71. Breaths: CV 0.09."). It also draws a **main-sequence scatter**: amplitude against duration, with the 21 + 2.2A line drawn in.
- **More injections:** Thrown, Line snapped, Shooting star now (`sky.shootNow()`), Sigh, Yawn, Sneeze, Double-take, Stare at nothing, Microsleep, Dream, Stroke, Flinch.
- **More overlays:** the averted point, boredom's candidates, the exit.
- **Headless QA:** the recorder's numbers come from functions a Playwright script can call through `stageEl.__att` (`CreativeSpacePanel.tsx:284`). *New* assertions, over 120 s with the pointer still:
  - the blink CV is between 0.5 and 0.95;
  - no two intervals are equal to the millisecond;
  - the breath period's CV is between 0.05 and 0.15;
  - saccade durations fit `21 + 2.2A ± 20%`.

  The probe in the proposal's Part 1.1 (`scratchpad/urchi-sample.mjs`, `urchi-frames/samples.json`) is the "before" column: seventeen blinks a minute, intervals of 3.2-6.6 s apart from doubles, a breath with no variation from cycle to cycle, and four 51.5-52.8° boredom jumps in a minute.
- Effort M. **Shows:** the site already has the sky's panel. A second one that measures a creature against the literature is what a technical interviewer would ask to see. It is development-only, so for visitors it lives on in the case page below.

**16.5 "Urchi: a project of its own"** (the proposal's last note, kept)

- Urchi is already the best thing on the site, and it belongs on the Projects ball beside the real projects. The GitHub-projects branch has merged (`0d9641d` on `origin/main`, decisions.md, fact 1), and the summary puts Urchi and eigengrau on the thread as projects of their own, so add it as one: *"Urchi. A mascot that notices. Alive since 2026."* Its best piece row is **"Five visors"** (summary, bet two), and its case page lands in week 4.
- The case page (`/projects/[slug]`) carries:
  - the main-sequence scatter and the blink histogram exported from the recorder;
  - the probe's before and after;
  - a short screen recording of 2.3's eyes swinging out and coming home.
- A note in Notes (category tech or psychology): *"It blinks about fifteen times a minute. Not on a timer."*
- Each package also gets its site log line, for example:
  - *"Urchi looks now, a moment after it sees."*
  - *"Its lids follow its eyes."*
  - *"Urchi can be stroked now. It will say when."*
  - *"It dreams, if you stay up with it."*

---

#### 17. The revised top ten and the order of work

| # | Change | Items | Payoff | Effort | Risk | Why here |
|---|---|---|---|---|---|---|
| 1 | It looks, a moment after it sees | 2.1 E5, 2.2 H1, 2.3 E6, 2.4 A4+N2 | 5 | S-M | the follow feel (A/B it) | every visitor meets it in five seconds; fixes the tells that every turn takes the same time, that it sees with no delay, that it looks to the corners, and that the pupils stay pinned |
| 2 | Its lids live | 4.1 E8, 4.2-4.4 B1-B3, 4.7 B6 | 4 | S | none (with the SHUT guard) | the metronome and the reading face; the microsleep is the most relatable thing it can do |
| 3 | It leans into a hand, and blinks at what comes at it | 5.1, 5.2 | 5 | M | stroking by accident | the most natural thing people try, answered for the first time |
| 4 | It rests more than it performs | 6.1 F8, 6.2 N1, 6.4 H3, 6.5 N4 | 4 | S | cuteness in the first minute | removes the demo-loop feeling afloat and at home |
| 5 | Eyes that jump and ride along | 3.1 E1+E4, 3.2 E3 | 4 | M | too snappy | the timing of the eyes, at a size where it shows |
| 6 | No two breaths alike, and sighs | 7.1-7.4 | 4 | S | none | the breath is always on screen |
| 7 | Ears with opinions, and a bristle | 8.1, 8.2 | 4 | M | winding flips | a second emotional channel, on the silhouette, visible on a phone |
| 8 | Moods that colour everything, and wear off | 9.1-9.3 | 4 | M | tuning | makes the rest cohere and stops identical reactions |
| 9 | It dreams | 10.1, 10.2 | 5* | M | looks like a glitch | *with `TIME_ZONE` set to Melbourne, sleep is the whole visit for anyone arriving in an American working day, the launch audience included |
| 10 | It remembers you, and is someone in particular | 12.1-12.3 | 4 | M | privacy perception | turns a visit into a relationship |

Close behind: M7 (stares at nothing), M2 (sneeze), F5 (dizzy), F1 (level head), 6.1 (it saw it too), P1 (pupils).

**Order of work** (at the pace this repo has kept, with parallel branches). *Ruled in the summary: package one ships in week 2, on its own branch; the rest follows the summary's Roadmap weeks, and the `?debug=urchi` panel waits for `Space.ts`. Items the Roadmap does not name sit beside what they depend on. The first draft's four weeks (week 1: F0.1, F0.2, D1, 2.1-2.4, 4.1-4.4 and 5.2; week 2: 3.1-3.3, 4.5-4.7, 6.1-6.5, 7.1-7.4 and the favicon; week 3: 8.1-8.2, 9.1-9.3, 5.1 and 11.1; week 4: everything else) are spread over the Roadmap's weeks below, and nothing is dropped.*
- **Week 2, 5-11 October (package one, its own branch):** F0.1 (`life.ts`, `lifelike.ts`, with `random.ts` from the week's foundations), F0.2, 2.1-2.4, the softer first wake (10, decided), and 16.3's favicon. It touches `attention.ts`, `character.ts` and `Urchi.ts`, one line of `RoomScene.ts` for the flag, and one line of `CreativeSpacePanel.tsx` (`:195`) for the wake, which its first commit names. Ship behind `lifelike`, record the before and after against the probe, and write the first Notes log line.
- **Week 3, 12-18 October:** `Space.ts` is extracted, then D1 (the panel's first cut) mounts from it. Then 4.1-4.6 with the SHUT guard (lids that follow the eyes; log-normal, gaze-evoked and incomplete blinks; the decided blink timing; the stare and flurry) and 5.2, the blink reflex.
- **Week 4, 19-25 October:** 3.1-3.3 first, because the witness act rides on their pursuit; then the shared shooting-star event and 15, "It saw it too". The Urchi case page with "Five visors" lands in the same week (16.5).
- **Week 5, 26 October-1 November:** 5.1 (stroking and the purr) and 8.1-8.2 (ears and the bristle).
- **Week 6, 2-8 November:** 7.1-7.4 (breath and sighs); 6.1-6.5 (it rests more than it performs afloat, the waits, the drift, the tilts, the waves) with 13.2 and 13.3; and D2, the recorder, once saccades exist to measure, so its scatter and blink histogram join the case page before the launch.
- **Week 7, 9-15 November:** 9.1-9.3 (moods, the glare that lingers, habituation), 4.7 (microsleeps) and 13.5 (swimming tires it, which needs 9.1's fatigue).
- **Week 8, 16-22 November, the week before launch:** 10.1-10.2 (dreams and the pillow), so they are in place when the launch audience arrives at his 01:00.
- **Week 9, 23-29 November:** 12.1-12.3 (memory, recognition with its double-take, "it knows your rhythm") and the arrival budget.
- **December onwards:** the micro-acts (M2 with the sneeze's cue, M7, M4's other triggers, M1, M3, M5, M6, M9, M11), 13.4 (dizzy after a spin), 13.1 (a level head while tumbling), 11.1 (pupils with a size of their own), 16.1 (the lazy lid, once the persona exists), H2/H4/H5, and 16.2 as the catchlight experiment in `/dev/urchi` only.

---

### Decisions

*The owner is asked nothing. Each line gives the decision, its reason, and what would change it; the merged ones point to `decisions.md` (the eight, and "By section: Urchi"), which wins where this section disagrees.*

1. **The face: pupils.** The rest share is 0.85, so at rest after a big turn the pupils sit at 8.5 units instead of 10 (2.3). *Why:* it moves them most of the way off the rim while the face he drew stays recognisable. *Changes if:* the before-and-after against the probe still shows pinned pupils, then 0.75. (decisions.md, item 6; By section, Urchi 1.)
2. **The face: the blink.** 4.5's middle values go in: a close of about 75 ms, a shut of about 60 ms, a 170 ms opening; `SLOW_BLINK` (`character.ts:1039`) keeps its curve. *Why:* a quick reflex beside a slow deliberate blink is what makes the slow blink mean something. *Changes if:* it reads as a twitch at a phone's 30 fps, then the close stays at 90 ms. (decisions.md, item 6.)
3. **The face: the catchlight.** A flagged experiment only: `catchlight: false` in `lifelike.ts`, off in production, switchable in `/dev/urchi` (16.2). *Why:* it adds a third tone to a face he designed. *Changes if:* the side-by-side reads as wet eyes on every dark-pupil colourway. (decisions.md, item 6.)
4. **The face: the glare.** It keeps its grown pupil (`angry: { pupil: 1.35 }`, `character.ts:961`), and P4's slits stay cut. *Why:* the current glare reads well, and slits change the face's identity. *Changes if:* P1's scale, which multiplies the glare's `big` (11.1), pushes a dark pupil past the eye it is clipped to; then P1 is held at 1 during a glare, and the glare keeps its 1.35. (decisions.md, item 6.)
5. **Memory across visits.** Yes, in `eigengrau:urchi`, in the visitor's browser only, as 12.1 specifies, including the grudge about last night. `Call.ts:14` is rewritten to match, About says so as the caption and accessible name of its mark ("It remembers you. Only in this browser."), About's foot stays at two lines, and `/kept` lists the key with a "Forget me" button that clears every `eigengrau:` key. *Why:* it turns a visit into a relationship, holds nothing personal, and is said where a visitor can read it. *Changes if:* anyone writes that it feels like being watched; then the grudge about last night, the one memory that acts against a visitor, goes first. (decisions.md, item 6; By section, Urchi 2.)
6. **Persona and colourway.** The persona fixes temperament only; the colourway stays drawn per page load (12.2). *Why:* the eye accent (Style R15), the colophon's hundred eyes and the finds' labels ("Its eyes were denim.") all draw from the per-load colourway. *Changes if:* those three are dropped. (decisions.md, item 6; By section, Urchi 3; summary reconciliation 6.)
7. **The time zone, and where sleep life goes.** `TIME_ZONE = "Australia/Melbourne"` and a new `HEMISPHERE = "south"` (`site.ts:16` and the line after). The order stays the summary's, with one move: the softer first wake joins package one in week 2, and dreams and the pillow stay in week 8, the week before launch. *Why:* his commits carry +10:00 and his public coursework is a Swinburne unit; every visitor sees the look by day, and only night visitors see sleep, but the launch audience arrives at his 01:00. *Changes if:* he moves city (the zone), or the launch moves (sleep life stays in the week before it). (decisions.md, item 1 and item 6; By section, Urchi 4.)
8. **The softer first wake.** The night's first wake in a browser is groggy, heavy lids and a slow blink, and the glare stays for a second wake the same night (`CreativeSpacePanel.tsx:195`, 10). *Why:* a stranger's first touch at 01:00 should not be told off. *Changes if:* nothing expected, since it is one line; the yawn (M1) joins it in December. (decisions.md, item 6.)
9. **A purr and a sneeze.** Both join `src/audio/sfx.ts`: the purr with stroking in week 5, the sneeze with the micro-acts in December. Neither sounds with sound off, and each has a visible counterpart (half-closed lids and the head leaning into the hand; a jolt of the head). *Why:* stroking is the first thing anyone does to a cat, and nothing answers it today. *Changes if:* the purr cannot be heard on phone speakers, then it gains a soft upper harmonic rather than more volume. (decisions.md, By section, Urchi 5.)
10. **One trust, one seed.** Trust lives once, in `eigengrau:urchi`, on 12.1's model; the finds' events feed it, and the finds' code salt comes from this record's seed. *Why:* two trust values would disagree about the same visitor. *Changes if:* nothing; it is a summary ruling (reconciliation 5).
11. **The order of work.** Package one in week 2 on its own branch; the rest on the summary's Roadmap weeks (17). *Why:* it is the first five seconds of every visit and touches files no other early work touches. *Changes if:* another branch is already in `CreativeSpacePanel.tsx` in week 2, in which case the one-line wake waits for it and the rest of package one goes ahead. (Summary, "Where the specialists disagreed".)
12. **Urchi and the Desk.** Urchi is never on the Desk, never announces the daily puzzle, and looks at the Desk pill only when `UPDATED.desk` moves for a new game, tool or paper (2.4, 12.1). *Why:* a daily look would mean nothing, and the games stay Urchi-free. *Changes if:* nothing; it is a summary ruling (reconciliation 4).

### If you only do one thing here

Make it look instead of follow. Put `lifelike` on Space's Urchi and ship four small changes together.
- **A latency:** a new thing is acted on 90-350 ms later, about 160 ms on average. Only the deliberate interactions are exempt: the drag, the rhythm, and acts that ask for a quick turn.
- **Head speed by amplitude:** a 5° glance settles in 0.35 s and a 45° turn in 0.75 s.
- **Eyes first, then the head:** eyes-only for shifts under 6°, pupils that swing out ahead of a turn and come home as the head arrives, with a rest share of 0.85 (decided).
- **Small aversions near you:** it holds your look for three or four seconds and glances aside before it ever looks off to a corner.

All four hook into code that already exists: `Attention.update` and `choose`, `lookAt`, `frame`, `stepGaze`. None needs the saccade model. Together they are two or three days' work, with a before-and-after recording against the probe. *Decided since: the same week-2 branch also carries the softer first wake (10) and the favicon's log-normal blinks (16.3), each a line or two.* This is what every visitor meets in the first five seconds: it turns the site's own claim, "attention, not tracking", from a line in the README into something people feel before they can name it.
