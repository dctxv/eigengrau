## Space: Urchi's finds

### Review verdicts

Both proposals are good, and they barely overlap in what they are good at. **A (systems)** has the right *mechanism*. Urchi swims away into the sky, drawn smaller and pixelated by the room's own zoom rule. Finds come from seeded codes, so they need no server. Its pacing never punishes anyone. **B (story)** has the right *soul*. Urchi has taste, there are nine distinct ways it hands things over, its captions are in his voice, labels read like museum tombstones, and it finds the lines you snapped. Built alone, A would be a well-engineered loot system with a mascot attached, and B would be a lovely script with nothing under it to run. The merge is B's name and character layer running on A's outing and engine. A's Survey, B's star chart, B's second Urchi and everything that needs new world art before the core exists are cut.

#### What the repo says (claims checked)

Most citations are accurate to the line: `Float` :199, `swimStep` :764, `pickSwim` :793, `busy` :267, `length` :313, `release` :443, `snap` :571, `reachOut` :740, `linePull` :982; `RoomScene` `ZOOM` :104, `floatUnit` :270, `cellFor` :314, `onFigure` :382, frame :476-484; `Tether` :228, `Ribbon.draw` :101, `Cells` :138, `snap` :307, `LINE_LOOK` :31, `lobe` :34; `acts.ts` `tug` :29, `read` :101, `closeBy` :314, `restOn` :335, `trust` :455, `held` :553, `caught` :655; `QUIRKS` :242, `inspect` :255, `STROKE` :384, `limbs.swim` :774; `Faces.react` :70; `Call.plan` :69, `matches` :93; `sfx.train/tug/air/play/pluck` :1326/:1343/:1371/:1393/:1440; `LINE_MAX` :81; `urchiWord` :219; commit `abc5315` ("Urchi takes the old mascot's place") is real. The problems:

1. **`LIGHT` is not exported.** `character.ts:754` is a `const` inside `createUrchi`. `SUIT_COLOUR` (:123) is module-private, and so is `amberTurn` (`tone.ts:377`). Hoisting and exporting them is trivial, but it is new work, not an existing API.
2. **`limbs.transforms` does not exist.** `createRig` returns `{ transforms, update, segments }` internally (`limbs.ts` about :126), and `createLimbs` never exposes it. B's new `character.handAt(side)` is the right hook. It would be a public version of the glove-centroid code that `handAim` already runs (`character.ts:2154-2162`), returning mesh units for `room.onFigure`.
3. **Making the outing "busy" breaks two things** (A). `zoomTo` returns early unless `fl.afloat` (`CreativeSpacePanel.tsx` about :247), so the visitor could not zoom while it is out. `urchiWord` returns `null` when `fl.busy` (:219), so "Call it back" could never show. The fix is a separate `Float.out` flag, with the state staying `"floating"`.
4. **"A near band of stars draws in front of it"** (A). `Stars` is one instanced mesh for all three bands, drawn at a single `renderOrder` (`Sky.ts:43`, `ORDER = -100`, behind everything). Doing this means splitting `Stars` into two draws. Deferred.
5. **The pocket's phone placement** (A). A puts it "where the chrome's chips live on a phone", but `.sound-chip` is `display: none` at 1024 px and below (`globals.css` about :237), so on a phone no chip lives anywhere. It needs a new place.
   *Ruled in the summary: the sound chip moves into the nav on every screen (Style R4, `Shell.tsx:199` to `Nav.tsx`), and the pocket takes the top-right corner it gives up, on every screen size (section 2.6).*
6. **Porting the hull code** (A). `polygons()` merges only exactly coplanar faces (tolerance 1e-9, `build-suit.mjs:210`), and `hull3()` calls `fail()` on flat input (:175). The runtime port needs an angle tolerance (A's 4°) and a fallback that does not throw (for example, re-jitter and retry).
7. **`/drawer` and a D key** (B). A sixth route in a five-panel app (`routes.ts` `TAB_ORDER`, `sfx.ts:497` `tabOf`) buys nothing that a dialog does not. D is also risky: Notes takes type-anywhere letters (`NotesPanel.tsx:1028`).
   *Ruled in the summary: the app gains a sixth pill, the Desk, third (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6), and sfx's `tabOf` becomes `pillOf` in `src/lib/routes.ts`. The drawer still stays a dialog, with no route and no D key.*
8. **Paused versus wall time** (B). B says "Space pauses when hidden, so an outing pauses." That is true (`room.paused`, :772), but it throws away A's better moment: coming back to find it already home, turning the find over (the `caught` pattern, :550). Outings run in wall time and are rebuilt on return.
9. **New sky layers are not plug-in yet** (B). `Sky.add` is typed `SkyLayer<StarsConfig>`, and `SkyLayers = { stars }` (`Sky.ts:12`, :189). Both must widen before a `Wreck`, `Landing` or `Drift` layer exists. The README also says the sky is "never pixelated". Finds and wrecks are signal and may pixelate; stars still never do.
10. **About's statement is WebGL, not DOM** (B's "it becomes the full stop"). It is troika-three-text in `AboutScene.ts`. The stop has to be split out of the last line's `Text` and a textured plane placed at its caret box, next to the code that places the mark (`MARK`, :23). It is feasible, but it is not a CSS swap.
11. **The eyes' colourway is drawn per page load** (`character.ts:485-500`), not per visit. A's "The colour of its eyes, this visit." is wrong. The label must record the colourway at the moment of the find.
12. **`happy` is eyes shut and arched** (`character.ts:694-698`). A's "happy face while it turns it" means it cannot see the gem. Happy (as B's "pleased") comes after the looking and lasts at most 1.2 s.
13. **Hands never go in front of the helmet** (`limbs.ts:217-226`: "never in front of its helmet, so two hands never meet in front of it"). A's frozen drop brought "close to the visor", and its eye-gem held "beside its visor", must be at chest height or at the cheek (the `cheeks` quirk's place, `reach(rig, 525, 420, 175)`), never in front of the visor.
14. **The shooting-star sky versus a star that actually fell.** Under reduced motion no shooting star is drawn (`Stars.ts` `shoot()`: `B.z = 0` when `f.reducedMotion`), but `sky.variant` is still `"very rare"`. "A piece of a shooting star" must require a crossing that happened, via a new event from `Stars`, not the variant alone.
   *Ruled in the summary: there is one crossing event, Urchi §15's `Stars.onShot`, shared by Urchi's "It saw it too", this section's star that fell (section 4) and the sky calendar's meteor showers.*
15. **The live-region wording collides.** `SAID.out` is "Urchi is out on its line." (`CreativeSpacePanel.tsx:32`) and already means *afloat*. A's "has gone out along its line" and B's "went out along its line" would read as the same event. New wording is below.
16. **`sfx.air` is shared.** The supernova shuts the bed to 700 Hz while its covers are out (README), and a Music preview ducks the bed. A's "the room goes quiet, then `AIR_OPEN`" must save and restore the previous air, never force it open.
17. **Call already works afloat.** A tap on the empty sky afloat reaches `call.tap` (the `onUp` branch, about :690), so A's rhythm trade needs only a new `Call.expect(gaps, onMatch)` that reuses the third-answer `version` mechanism. It does not need new input code. A is right here.
18. **`NOVA_EVENT` has no listener** (grep: dispatched at `ThreadScene.ts:3422`, heard nowhere). B's "charm flung into the contact sheet" needs `ThreadScene` internals, which means surgery on a 5.3k-line file. That goes to v3.
19. **Voice.** Captions are his first-person lines ("It keeps the place while I am out.", `site.ts:59`). Labels and states are the site's third-person log ("He is playing {title}."). B's owner-left caption "He left it here" mixes the two. The fix: "A ticket stub. I left it out here."
20. **`TIME_ZONE` is `null`** (`site.ts:16`), so "his night" is currently the visitor's night. This is a prerequisite, not a question. *Decided: `TIME_ZONE = "Australia/Melbourne"`, with a new `HEMISPHERE = "south"` on the line after it (decisions, item 1). Melbourne moves to +11:00 on Sunday 4 October 2026.*
21. **`sfx.pluck` damps whatever pluck is ringing** (the shared `ringing`) and builds its buffer lazily. Call `sfx.primePluck` when a find is decided, not when it is presented.
22. **Sanity checks.** Typecheck passes on the current tree. There is no test runner (`package.json` scripts). A's "unit script" becomes Vitest golden tests (the tier odds over 100k draws, code round-trips), with scripts under `tsx`; `/dev/finds` stays as the visual grid. *Ruled in the summary: one runner, Vitest, replaces the `?check=1` page check this note first proposed.*

#### Verdicts

| Idea | Verdict | Why |
|---|---|---|
| (A) **Spacewalk**: it swims away into the sky, smaller and pixelated by the zoom rule | **KEEP WITH CHANGES** | The best mechanism in either document: no new world art, and distance is drawn with the site's own rule. Fixes: an `out` flag rather than `busy`; the far depth clamped to the room's zoom; B's acting layered on top. |
| (A) The shared core: seeded find codes, `findOf(code)`, no server | **KEEP WITH CHANGES** | This is what makes shares, reloads and fairness free. Changes: types are hand-written in a content file (B), with seeded variation (A); the code also carries the colourway and a checksum. |
| (A) Tiers, rummage time as suspense, pity | **KEEP** | Internal only, never shown. A long wait meaning something good is suspense with no numbers. |
| (A) Context modifiers (sky, song, hours, weekday, days known) | **KEEP WITH CHANGES** | Charming and cheap. The song rule is reworked (no outings while he plays), the eyes are per page load, and the shooting star must have actually crossed. |
| (A) Catalogue of thirty; (B) forty-eight captions | **KEEP WITH CHANGES** | Merged into one catalogue: A's specimen names and business, B's captions and handovers. Duplicates removed (A's "mote, caught" is B's mote in amber; A's gold record is B's gold disc). |
| (B) **Urchi's taste** (a bolt over gold, likes no corners, jealous of spikier things) | **KEEP** | This is the feature. Consistent taste is what makes a creature feel alive rather than random. |
| (B) The departure act `setOff` (a look out, the owl's bob, looking at you to ask) | **KEEP** | It turns a timer into a decision you can see, and you can stop it. |
| (B) Swimming home one-armed; slower strokes when it holds something precious | **KEEP** | Most of the realism for one limbs change. |
| (B) The glint at the glove, sharp even when the figure is pixels | **KEEP** | The key image: you can tell from across the sky that it has something. |
| (A) The line's twitch when it finds something | **KEEP** | A float bobbing. It carries the moment with sound off. |
| (A) The presentation beat table | **KEEP WITH CHANGES** | Becomes the common frame that B's handovers fill in. |
| (B) **Nine handovers** (proud, sincere, hidden, keeps, wary, reverent, puzzled, empty, asleep) | **KEEP WITH CHANGES** | Animation direction from existing hooks. Staged: six in phase 1, three in phase 2. |
| (A) "It wants to keep it": a rhythm trade using `Call` | **KEEP WITH CHANGES** | Merged into B's *keeps*: "Ask" makes it blink its own short rhythm, and tapping it back gets the thing. It reuses the call and response the site already teaches. |
| (A) "Take anyway" (hold 1.2 s, it glares, trust drops) | **CUT** | A third gesture on a small target, and it makes the relationship adversarial. The later gift covers "never locked out". |
| (A) Trust, hidden, persistent | **KEEP WITH CHANGES** | Also raised by the *existing* trust act (Call's own beat tapped back), so two systems become one. *Ruled in the summary: that one value lives in `eigengrau:urchi` with Urchi §12.1's model; the finds' events feed it and keep no second store (2.11).* |
| (B) Rule: most outings bring nothing (two in three) | **KEEP WITH CHANGES** | Too stingy on top of three a day. The day's first always brings something; after that it is one in three, never twice running. |
| (B) Rule: no outing in the first two minutes | **CUT** | Most portfolio visits are shorter than that. A's shortened first outing (20 s afloat, 8 s still) wins. |
| (A) Carrying: a pointer layer across tabs; a pocket chip that exists only after your first take | **KEEP WITH CHANGES** | B's short ink thread instead of a spring, because it rhymes with the tether. The phone pocket is placed where it can actually go. *Ruled in the summary: the pocket takes the top-right corner on every screen, once the sound chip moves into the nav; on the Desk a carried find goes into the pocket at once.* |
| (B) Hanging from the active pill on a phone | **KEEP** | Solves carrying on a phone with a gesture the site already has. |
| (A) Cabinet (one row of twelve) versus (B) the drawer (4 x 3, museum labels, a heading sentence) | **KEEP WITH CHANGES** | B's drawer layout and label grammar, with A's actions (Carry, Give, Let go). Opened from the pocket, with no route and no D key. |
| (A) Pending finds on its spikes while you are away | **KEEP** | The return hook, visible at home and physical (hedgehogs and apples). Needs new spike-tip anchors. |
| (A) Setting down per tab / (B) what each tab does with a carried find | **KEEP WITH CHANGES** | Phase 1: About's full stop, on its spikes, back to Urchi afloat. Phase 2: 404 and Notes. v2: Music. v3: Projects (the `ThreadScene` surgery). |
| (A) `/f/<code>` share links with metadata; (B) "Another Urchi" gifting | **KEEP WITH CHANGES** | A's route, B's gift framing ("It is a copy. Most gifts are."). The gift arrives as a parcel drifting in like a mote, with no second Urchi. |
| (B) Another Urchi, a second figure meeting glove to glove | **CUT** | Two suited painters at once for a moment a parcel delivers just as well. |
| (A) Share image (`opengraph-image.tsx`) | **KEEP** | Moved up to v1.5. It is the part of this feature that travels. |
| (A) Salvage: the day's wreck, the same for everyone | **KEEP WITH CHANGES** | Becomes v2 "wreck days", merged with B's *his finished projects drift out here*. The pieces are relics. *Decided: wreck days wait until one of his public repositories is archived or finished, with no fictional derelicts meanwhile (section 5; decisions, Space finds 4).* |
| (A) Survey: a weekly world, cores, triangulation | **CUT** | The most game-like, L+ in effort, and it needs a new UI surface. Only the geode is grafted. |
| (A) Geodes and crusts that open tomorrow | **KEEP WITH CHANGES** | One idea, not two: a geode takes one knock a day and opens on the third. |
| (A) Dream finds | **CUT** | Replaced by B's asleep handover, which is better: you can take it without waking it. |
| (A) / (B) Relics of his real projects | **KEEP** | The toy sends people to the work. Redesigned around the GitHub data he is importing now. |
| (B) Past the line: drift, wrecks, moon, landing, revealed by stage | **KEEP WITH CHANGES** | The landing in v1.5; wrecks via wreck days in v2; the drift and the moon in v3. The sky types must widen first. |
| (B) Urchi follows a shooting star with its whole head | **KEEP** | S effort, independent of finds, and pure aliveness. *Ruled in the summary: built once, as Urchi §15's crossing event and `witness` act with its habituation; the finds add only where it came down (section 4).* |
| (B) The lines you snapped, and knots | **KEEP** | Consequence and memory, answered with care, in two days. v1.5. |
| (B) A letter in seven pieces | **KEEP** | Cheap writing that talks to returning visitors. v2. |
| (B) The probe that blinks the monogram's rhythm | **KEEP WITH CHANGES** | v3, with a hint planted in Notes. Otherwise only its author will ever solve it. |
| (B) A star chart of your own sky | **CUT** | It overlaps the constellations, and the effort is M-L for a fourth story. |
| (B) The one before (chrome set, reflection) | **CUT** (the set) | No visitor ever saw the chrome mascot, which was replaced five days into the build. It survives as a single "once" find with one label. |
| (B) Things that change while you are away (ice, ember, seed, moth) | **KEEP** | Aliveness without a timer. |
| (B) Colour allowed only where light is; the materials table | **KEEP** | The right answer for a two-colour site. |
| (B) Finds dither out from the hand | **KEEP** | House style ("things build out from where they are anchored"). One new uniform. |
| (A) Sound mapped to existing cues / (B) sixteen new synthesised cues | **KEEP WITH CHANGES** | Phase 1 uses A's mapping (no new synthesis). B's recipes come in phase 2. |
| (A) Let go, and it becomes a named star | **KEEP WITH CHANGES** | v3. In v1 a let-go find goes back out and may be found again (B). |
| (A) Painting the find into Urchi's own canvas | **KEEP** | As v3 tech debt, noted once. |
| (B) `npm run leave` (he leaves finds himself) | **KEEP** | A second, lighter channel for his own life, next to Notes. |
| (B) The burrito on 28 September | **KEEP** | One date-keyed find from his real note. Costs nothing. |
| (B) Constellations drawn with its eyes (11A) | **KEEP WITH CHANGES** | Strong, but it is about Urchi being alive, not about finds. Handed to that area with its spec intact (section 10). |
| (B) Postcards after three days away (11B) | **KEEP WITH CHANGES** | Folded into pending finds as text ("Brought back on Tuesday, while you were out."). No offscreen render. |
| (B) It names the planets | **CUT** | B cut it too, and rightly: naming is his job, not Urchi's. |
| (A) "A tag, shifted" (a cipher find) | **KEEP WITH CHANGES** | Handed to the cybersecurity area, together with a code checksum ("A forgery. It can tell."). *Ruled in the summary: it stays a find, and its label links to Plaintext's Thursday strips once Plaintext exists; no cipher tool appears in Tools. The checksum stays a quiet check that nothing invites anyone to test (section 10).* |

---

### Refined proposal

## What it brings back

*Left alone afloat, Urchi lets its line out and swims off into the far sky. It comes back with something, and it has an opinion about it.*

### 0. The direction, and what came from where

| Part | From A | From B | Changed in review |
|---|---|---|---|
| Name, pitch, rules | "Nothing sends it out"; rewards for waiting; one thing in your hand; twelve slots | "Rarity is acted"; Urchi has taste; he narrates, it never speaks; colour only where light is | Merged into ten rules (section 1) |
| The outing | Spacewalk: depth, pixelation, the line paying out, the twitch, the rummage times | `setOff` (look out, bob, ask), looking back halfway, the one-armed stroke home, the crisp glint | Not `busy`; depth clamped; no outings while he plays; wall time |
| Making finds | Codes, tiers, context, the shape generators, the painter, sizes and weights | The content file, the materials table, the colour rules, dither from the hand | Hand-written types with seeded variation; colourway and checksum in the code |
| The catalogue | Thirty specimen types and their business | Forty-eight captions, repeats, the label grammar | One table (2.5); duplicates removed; first-person fixes |
| Presenting | The beat table, the rhythm trade, trust | Nine handovers, `wink`, `pleased` | "Take anyway" cut; trust also fed by the existing trust act |
| Keeping and carrying | The pocket chip, spikes, the actions, sets, codes | The drawer, the thread, the phone pill, the per-tab table | No `/drawer` route; the pocket placed properly (top right on every screen, as the summary rules) |
| Sharing | `/f/<code>`, metadata, the share image | The gift framing | A parcel drifts in like a mote; checksum |
| Later | Salvage, geodes, relics, let go as stars | Snapped lines, the letter, the probe, the landing, things that change, `npm run leave` | Staged into v1.5, v2 and v3 |

**Prerequisite, before any of it:** set `TIME_ZONE = "Australia/Melbourne"` in `src/content/site.ts:16`, with a new `HEMISPHERE = "south"` on the line after it (decisions, item 1: his commits carry +10:00, and his public coursework is a Swinburne unit). Otherwise Urchi's night is the visitor's night, and "Found by Urchi at 02:13, asleep afloat" is a lie about his time. Every day in this section is his day, from new `src/lib/day.ts` (`today()`, falling back to UTC, never to the visitor's day).

### 1. The rules

If a later feature breaks one of these, the feature is wrong.

1. **Nothing sends it out.** No button and no click makes it go. It goes when it is bored and you have left it alone. The only lever is indirect: zooming out past 40% "gives it room".
2. **Rewards come for waiting, never for clicking.** The random element is time left alone, like a float on water, and never presses, like a slot machine. Calling it back early costs a little: it may come back with nothing.
3. **Rarity is acted, never labelled.** No tiers, rarity colours, values or numbers appear on screen. A rare find is one it swims home slowly with, cradles, and blinks at before it lets you have it.
4. **It has taste, and its taste is not yours.** It prefers a bolt to gold. The taste is consistent enough to learn.
5. **He narrates; it never speaks.** Captions are his first-person lines, at most 48 characters, with no exclamation marks. Labels are the site's third-person log. Urchi answers only with its face and hands.
6. **Colour only where light is.** Eigengrau and ink stay the ground. Saturation lives in the eyes, the suit's two amber lights and a gem's lit facets.
7. **Scarce by day, not by effort.** Three outings a day, ten minutes apart. Missing a week makes things better: up to three finds wait on its spikes. Nothing counts down.
8. **One thing in your hand, twelve in the drawer** (the intro's ring of twelve). Choosing what to let go is the long game. *The ring may change size with real images (the summary's first point); the drawer keeps twelve either way, because twelve is the drawer's own number and the rhyme is a bonus.*
9. **Every find can be rebuilt from its code.** The same code always makes the same object, so a link *is* the find.
10. **Reduced motion, sound off, a phone and his night all get the whole loop**, sometimes in another form, never less of it.

---

### 2. Phases 1 and 2: the loop

#### 2.1 The outing, step by step

**Eligible.** Checked in `Outing.frame`, registered with `room.onFrame`. All of these must hold:
- `fl.state === "floating"` and a new `Float.free` getter is true. `free` exposes the expression `swimStep` already computes at `Float.ts:766`: not held, not sending, not taut, awake, full of life, calm, and not reaching.
- It is not swimming (`limbs.swimming` is false).
- `att.mood === "awake"`, `!att.listening`, and `clock().hours !== "night"`.
- The document is visible, `!getFlags().transitioning`, and the page has begun (`begun >= 0`).
- The page is not under `?still` (the house rule: every new random process is off there, so screenshots stay stable). `?outing=now` still sends it in development.
- `today.n < 3` (two on a Sunday), and `Date.now() >= today.next`.
- At least 40 s since the float-in settled (20 s for this browser's first outing ever).
- No `setOff` has been postponed in the last two minutes.

**Trigger.**
- `att.stillFor ≥ 25 s`, or 8 s for the first outing ever. This halves while `room.zoomLevel < ZOOM.pixelFrom` (0.4): zooming out gives it room.
- Then the **second** boredom lapse since the stillness began, read from a new public `bored` getter on `Attention`, because `boredFor` at `attention.ts:148` is private.
- Then a 60% chance at that lapse, so it is not clockwork.
- The tell a watcher can learn: *it looks off into the corner again, and this time it goes.*

**1. It asks** (new act `setOff`, priority 3, about 2.6 s; from B):
- **0.0.** It chooses the far point. On a desktop, x is 55-80% of the room's width and y is 25-45% of its height. On a phone, x is 50-70% and y is 18-30%. The point is at least 30% of the width from the line's root and never within 64 px of the zoom slider. It is stored as shares of the room, as swims are (`Float.ts:239`). A new target kind `"far"` pulls the gaze there, and `ch.fixate(true)`.
- **0.6.** `ch.bob()`: the owl's bob, which the code already describes as "judging a distance" (`character.ts:668-670`).
- **1.8.** `att.look("you")`, `att.holdBlinks(0.7)`, `ch.tiltToward(sideOfFar, 6)`. It is asking.
- **You can keep it.** If the pointer moves 40 px or more toward it between 1.8 s and 2.5 s, or you press on it, it stays. The act ends with a glance at the pointer. The outing is put off for two minutes and not counted. *You looked as if you wanted something.*
- **2.5.** It commits. `snapshot()` reads the context, `encode()` makes the code, and `store.out` is written **before** it moves, so a reload can never reroll the find.

**2. Going out** (9 s; from A):
- `Float.drive(p)` (new) moves its middle to the far point on a sine ease. While it is driven, `step()` (`Float.ts:836`) skips the wander, swim, drift, walls and `linePull`, and runs a critically damped spring toward `p`.
- **Depth.** `room.figureDepth` (new, default 1) eases on the logarithm from 1 to `depthFar = min(1, 0.08 / room.zoom)`. It multiplies into `floatUnit` (`RoomScene.ts:270`), `urchi.zoom` (:483) and `cellFor(lens.v * depth)` (:481); the sky keeps `room.zoom`. **The clamp is new.** Without it, a visitor already at 10% zoom would send it to 0.8%, which is sub-pixel. With it, the far figure is always drawn at an effective 0.08: about seven cells tall, pixelated by the room's own rule ("its signal weakens").
- **Limbs.** The breaststroke (`limbs.swim`), still facing you, which reads as swimming *away*.
- **Looking back** (B). Halfway, at 4.5 s, `att.look("you")` for 0.8 s while the body keeps swimming.
- **The line pays out.** A new `Float.lengthExtra` sets the length (`Float.ts:313`) to the root-to-clip distance × 1.15, so the line lies in a long, gentle S. `Ribbon.draw` (`Tether.ts:101`) takes a per-sample width, tapering from 1.5 px at the root to 0.6 px at the far end. While the effective zoom is under 0.4, only the far half goes to `Cells` (:138), so the near end stays smooth.
- **Sound** (on): the reel. `sfx.train` of fourteen ticks, gaps widening from 40 to 110 ms, `rate` 0.9 falling to 0.7, gain 0.3: a fishing reel heard from the next room.

**3. Out there: the rummage.** How long depends on the tier:

| Tier (internal) | Base odds | Rummage |
|---|---|---|
| common | 60% | 15-30 s |
| uncommon | 26% | 20-40 s |
| rare | 10% | 30-55 s |
| very rare | 3.5% | 45-70 s |
| once | 0.5% | 60-90 s |
| (empty) | see pacing | 10-20 s |
| first outing ever | always the bolt | 8-12 s |

- The ranges overlap on purpose, so the wait feels like suspense but can never be read like a gauge.
- The figure drifts ±12 px and turns ±0.3 rad. Every 1.5-3 s it makes a small searching turn of the head to a random far point (B). The `fidget` and `inspect` quirks still run, so its few pixels shift like something busy.
- **Hovering the far figure.** Its hit area is a circle of at least 44 × 44 px round the speck. The cursor word is **"Call it back"**, and the caption reads **"Urchi / It is at the end of its line. Give it a minute."**
- **Calling it back.** A click, or Enter on the control (now named "Call Urchi back"), brings it home. If the twitch has already come, it brings the find. If not, it comes home empty: **"It came back with nothing. It had not finished."**

**4. The find.**
- **The twitch.** Two impulses travel down the line from the far end to the root, 0.3 s apart. This is a new `Tether.twitch(strength)`: a velocity kick at the last node's neighbours, which the verlet step (`Tether.ts:373`) carries along.
- **The glint** (B). A four-point glint flashes at the glove, drawn at the screen's own resolution and never pixelated, in the sky's own arm shape (`Stars.ts:172` `arm()`, lifted into a shared GLSL chunk, new `src/engine/space/glint.ts`). It is the one sign you can see from across the sky.
- **Sound:** two tugs, `sfx.tug(0.2)`, on the line's own D2.
- `store.out.found = Date.now()`. It holds still for 1.5 s, looking at it. The `inspect` quirk's `look` turns its head to its own hand.

**5. Coming back.** How it swims depends on what it holds (B):
- **Most things:** 7 s. A one-armed breaststroke, quicker than usual (2.1 s strokes rather than `SWIM.stroke` 2.6), with the full hand held to its chest. `limbs.swim(phase, hold?)` gains a `hold` side that blends toward a new `cradle` pose on that side while the other side strokes. A creature with one hand full swims lopsided, and that is most of the realism.
- **Something it is hiding:** the hand is already behind its back as it turns for home (new quirk `behind`).
- **Something precious** (rare and above): 9 s, with slower strokes (3.2 s) and a look down at its chest between strokes (`att.eyes(0, 0.8)`).
- **Nothing:** 6 s, both arms, ordinary speed. It does not look at you until it has stopped.
- On the way back, the depth eases to 1, the reel runs quicker (rate 0.9), the line reels in to its usual reach, and the figure un-pixelates as it comes.

**6. It presents** (2.3), and you take it or you don't (2.6).

**7. Cooldown.** `today.n++` and `today.next = now + 10 min`. It swims about as usual (`SWIM`).

**Pacing.**
- Three outings a day (two on Sundays), at least ten minutes apart.
- "A day" is his day, `today()` from new `src/lib/day.ts` (Australia/Melbourne, falling back to UTC), so the count turns over at his midnight for everyone, and a label's date agrees with its time. "Night" is his too, from `hours.ts`. *Ruled in the summary and decided (decisions, item 1): everything that has a day uses his day; `visitorDay()` answers only "new since your last visit".*
- The day's first outing always brings something, and so do a browser's first two.
- After that, one in three comes back empty, never twice running.
- **Late** (his 23:00-00:59): empty returns are one in two.
- **Pity:** after seven finds in a row below rare, rare's weight triples until a rare lands.
- **Full use** gives about 2.3 finds a day, and a once-a-week visitor gets three waiting on the spikes.
- **Resting.** On a day with no outings left, zooming out past 40% raises the caption once: **"Three times today. It is resting."**
- **Decided: this pacing ships as designed**, and is revisited once, on Monday 23 November, after four weeks of `find_taken` counts (decisions, Space finds 5). If the counts show almost nothing taken after each browser's first find, people are not waiting long enough: the second outing then comes sooner, and the rates do not go up.

**While he plays something.** It does not set out: it is listening, and listening comes first (B). If a song starts while it is out, it cuts the rummage short and swims back, with the find if the twitch has come and empty-handed if not. The status line is **"It came back for the song."** A find whose departure came within ten minutes of a song he played carries that song: its hue (below) and a label clause "just after he played Holocene." That uses `lastNow` and `hear()` (`CreativeSpacePanel.tsx:98`, :469).

**Reduced motion.**
- **Asking:** only lids and pupils. The pupils go to the far point, then to you, then it goes.
- **Going:** no depth and no swim. It dithers away where it floats (`room.urchi.dither(1, TAKE.ditherFor)`), and the line stays at 20% opacity.
- **The twitch** is the line brightening once to 35%.
- **Coming back:** after the rummage it dithers back in, holding the find.
- There is no far figure to click. The control is named "Call Urchi back".

**Live region** (new wording, distinct from `SAID.out`):
- "Urchi has swum off to look for something."
- "Urchi is back. It is holding a bolt." / "Urchi came back with nothing."

#### 2.2 Urchi's taste (from B, kept whole)

Each rule is a weight on which find an outing returns and sets how Urchi hands it over.

| It... | Because | In code | What you see |
|---|---|---|---|
| **prefers a bolt to gold** | it does not know what gold is for | gold always gets the `sincere` handover; steel gets `proud` | a bolt held up high; gold held out as you might hand over a receipt |
| **likes things with no corners** | it has a great many corners | rounded hulls (pebble, marble, stone) get `proud`; afterwards a round thing you carry is a look target of weight 1.4 rather than 1 (new `TargetKind` `"carried"`) | it keeps glancing at the pebble in your hand |
| **is jealous of anything spikier than itself** | it is the spiky one | spiky hulls get `wary` | held at arm's length; a glare at the thing, not at you |
| **loves anything the colour of its eyes** | it has only seen its own eyes in the visor | one gem type is always tinted the iris of this page load (`drawnColourway().iris`, `character.ts:503`); that gem gets `keeps` | it winks and puts it in its backpack |
| **thinks rocks are its relatives** | basalt is black and faceted with a white rim, as it is | rocks are painted in its own head's material | it looks from the rock to you, then slow-blinks at the rock |
| **cannot keep a secret** | it has no mouth, and all eyes | `hide` always gives itself away by glancing at you | an arm behind its back, and eyes that will not meet yours |
| **finds the mote the most beautiful thing out there** | motes are what it watches at home (`Motes.ts`) | the mote in amber is its keep of keeps | the one find it gives as a gift rather than an offer |
| **is sleepier with warm things** | an ember is warm | holding the ember, its breath slows (`setBreathPeriod(6)`) and its blinks lengthen (`setBlinkHold(0.3)`) | it dozes off holding a piece of a shooting star |

#### 2.3 How it hands things over

**The common frame.** Times are seconds from when it comes to rest; each handover fills it in differently.
- **0.0** It glides to rest. `att.holdBlinks(1)`. The find is already in its glove, drawn small against the mitten.
- **0.3-2.6** The handover's own opening: its pose, where it looks, its face (table below).
- **2.6** The **caption rises** in a new slot `find` in `RANK` (`CreativeSpacePanel.tsx:113`), ranked with `news` (2). It shows "Urchi" over his line. Urchi **reads it** (`read()`, `acts.ts:101`) and then makes the catalogue's reaction for it. The reactions are the five in `UrchiReaction` (`site.ts:50`) plus a new `wink` and `doubleBlink` (which the character already has).
- **3.2** The category cue plays (2.10).
- **After the reading** The glove is held toward you. The cursor word over the find is **"Take"**, and the control is named **"Take the bolt from Urchi"**. Every 5 s it glances from the thing to you and back: *look what I found.*
- **20 s untaken (30 s on a phone)** The handover's own ending.

**The nine handovers.** Under reduced motion only lids, pupils and faces play; the head stays front and the limbs hold still (`Float.limbs` is `null`, `Float.ts:282`). The find then floats in front of the hanging glove at chest height.

**1. Proud** *(phase 1)* (a bolt, a washer, a stone with no corners, foil, a bottle cap, pyrite, quartz)
- **0.0** New quirk `offer`: the glove on your side comes up at the chest, palm up. `reach(rig, 360, 640, 420)`, `wrTwist` 80. Chest height is as high as the rig allows.
- **0.3** It looks at its own glove (the quirk's `look`, so `handAim` drives the head) and converges a little (`converge(0.25)`).
- **1.0** `att.look("you", "quick")`, `widen(0.06, 1.2)`, `holdBlinks(1.5)`.
- **1.8** Back to the glove for 0.5 s, then to you. This is the `tug` rhythm (`acts.ts:29`): a child tugging a sleeve.
- **2.6** The caption. It reads it and reacts.
- **Taken:** the new reaction `pleased` (the `happy` face, held 1.2 s, not again for 10 s), then the `pat` quirk, three pats on its sides. *Ruled in the summary: `pleased` is allowed only as a brief event, at most 1.2 s, with no notes rising and never from a hidden mood, so the rising notes keep meaning "he is playing music".*
- **Not taken:** it runs `inspect` with the find, turning it over and looking at it, then `stow`s it (new quirk: the hand goes back to the pack by the line's clip, `PACK`, `Float.ts:53`). The find goes into the drawer anyway, with the label clause "It put it in its pack." On the next hover the caption reads **"It will show you again later."**

**2. Sincere** *(phase 1)* (nothing, gold, a pebble, a battery, a spoon, basalt, comet ice)
- It holds the thing further out than proud (`z` 460), and nothing else moves. `att.steady(true)`, `ch.setTilts(null)`, `holdBlinks(3.2)`, pupils dead centre (`att.eyes(0, 0)`), the head level. The joke is the stillness.
- It reads the caption and gives one slow blink.
- **Taken:** a slow blink, then `pleased`.
- **Not taken:** it holds the thing out for the full 20 s, lowers it over 1.2 s, looks at it, looks at you, gives one slow blink and puts it away. It is not hurt, only patient.

**3. Hidden** *(phase 1)* (a crisp packet, a sock)
- It comes to rest facing a corner (a boredom look, `BORED`, `attention.ts:76`) and glances at you every 2-3 s, then away (`ch.glance()`).
- Hover caption: **"Urchi / It has something behind its back."** Cursor word: **"Ask"**. Control: "Ask Urchi what it is hiding".
- **Asked:** `faces.react("embarrassed", { hold: 1.4 })`, the "><". The arm comes round slowly (`offer`), and the caption becomes the find's line: "A crisp packet. It was hoping you would not ask." It reads this and glances away.
- **Taken:** a long blink of relief.
- **Not asked in 30 s:** it lets go of the thing behind itself. The packet tumbles slowly toward the far wall and dithers out. Urchi watches it go for one second. No caption appears, so only people who were watching see it. The find is not kept (it was rubbish).

**4. Keeps** *(phase 1)* (the mote in amber, the gem the colour of its eyes, a star sapphire, the seed)

*B's version, with A's trade grafted in:*
- `offer`, then a long look at the glove (1.6 s) with `converge(0.6)`, and a slow blink at the object. A cat's slow blink is affection.
- It looks at you and **winks**: a new reaction that is `setLids(1, 0, 0.12)` on the eye nearer the object, held 0.35 s, opened over 0.2 s. `peek` already opens one eye alone (`acts.ts:208`), so this is the same hook run the other way.
- `stow`, then `pat`. Caption: **"A mote, in amber. It is keeping this one."** Cursor word over its chest: **"Ask"**. Control: "Ask Urchi for the mote".
- **Asked** (a click, or Enter). It looks at you and blinks **a short rhythm of its own**:
  - Three or four beats, gaps 250-700 ms seeded by the code, built with `plan(gaps, start, reduced, true)` (`Call.ts:69`), with soft pats if sound is on.
  - Tap it back on the empty sky within 15 s. Afloat, those taps already reach `call.tap`. A new `Call.expect(gaps, onMatch)` sets the version to compare, the way the third answer's own beat does, and `matches()` (`Call.ts:93`) judges it: each gap within 25% or 90 ms.
  - **A match** plays the `trust` act (`acts.ts:455`). It takes the thing out again and offers it the sincere way, and trust rises by the trust act's own +0.15 (Urchi §12.1), written once to `eigengrau:urchi`, not a second +0.1 of the finds' own.
  - **No match, or no try:** nothing happens. It stays in its pack (`store.urchi`).
- **Later** (new act `giveKept`). Once persistent trust (the one value in `eigengrau:urchi`) is at least 0.6, at most once a week, on the day's first float-in, it reaches back to its pack, takes the thing out and offers it the sincere way. Caption: **"It has decided you can have it."** Label opinion: *"It kept it for itself, and then it did not."*
- You are never locked out, only delayed. There is no "Take anyway".

**5. Wary** *(phase 1)* (a spring, something spikier than itself)
- New quirk `armsLength`: `reach(rig, 640, 640, 120)`, out to the side and as far away as the arm goes. The head leans away (`ch.pose(8 × away, −4, 6 × away)`).
- `att.look(find)` and `faces.react("angry", { hold: 1.2 })`: a glare at the thing, not at you. Then it looks at you with widened eyes.
- **Taken:** a long breath out (`deepBreath(0.6, 1.6, 1.3)`), then a look at you: better you than me.
- **Not taken:** it pushes the thing off, and it drifts away tumbling. Not kept.

**6. Empty-handed** *(phase 1)*
- For the first 2 s it looks down and to one side. Then it runs the `fidget` quirk (hands in front of it, which exists), then looks at you.
- There is no caption unless you hover: **"Nothing today. It looked."**

**7. Reverent** *(phase 2)* (a meteorite, pallasite, etched iron, a crystal, a piece of a shooting star, a letter fragment, a relic)
- It comes to rest holding the thing against its chest in both gloves (`cradle` on both sides). The rig's hands reach the air in front of the chest only out past the middle, so a reverent find is sized to span the gap: 350-450 mesh units, about 40% of the helmet's width.
- Its breath slows (`setBreathPeriod(6.2)`). It looks down at the thing (`att.eyes(0, 0.8)`) and gives two long slow blinks (`slowBlink(0.9)`) 2 s apart. The find's glint pulses at the top of each breath (`ch.breath`, `character.ts:688`).
- Only then does it look up at you, give one long blink and offer the thing with one glove. The caption rises only once it has looked up.
- **Taken:** `att.soften(20)`, soft eyes (`attention.ts:262`), plus persistent trust +0.05. Giving you something precious makes it trust you.

**8. Puzzled** *(phase 2)* (a key, a feather, a button, a die with no spots, a watch, a patch)
- The `inspect` quirk plus `converge(0.8)` (cross-eyed at it), then `bob()`, then `tiltToward(±1, 13)`.
- It offers the thing with the tilt still on: *you tell me.*
- It reads the caption and reacts `puzzled` or `lookAround`.

**9. Asleep** *(phase 2; his night, 01:00-06:59)*
- There are no outings at night; it dozes afloat (`Float.ts:853`).
- **Once a night per browser**, after 90 s of watching it doze afloat with the tab visible, a small thing drifts in from the edge of the room at mote speed (4-12 px/s, `Motes.ts`).
- Its sleeping glove closes round it over 3 s. This is `reachFor` with a slow ramp, and `limbs.setAsleep` already slows everything.
- **You can take it without waking Urchi.** A click on the glove (hit-tested before the head) takes the find. A click on the head wakes it (`wake`, `CreativeSpacePanel.tsx:192`). The night's first wake in a browser is the softer one decided for package one: heavy lids and a slow blink, not the glare at `CreativeSpacePanel.tsx:195`. It glares only at a second wake the same night. *Ruled in the summary (bet one) and decided (decisions, item 6).*
- **Captions.** Over the head, it is still "It is 2:13 here. It is asleep." (`URCHI_STATES.asleep`). Over the glove: **"It found this in its sleep."** If you take it after it wakes: **"A dream, probably. It woke up holding it."**
- **Label:** "Found by Urchi at 02:13, asleep afloat."
- **Reduced motion:** no reach; the thing appears in the glove through the dither.

**Per-type business.** These are small pieces of acting from A that ride on top of a handover. They are in the catalogue's last column, and each uses only existing hooks:
- **Iron:** the glove dips with the weight (`wrBend` +12°).
- **Ice:** handed over fast, as you would something cold, with the `wiggle` feet; one mote-sized drop falls off it.
- **Gems:** the visor's sheen tints toward the gem's hue for the beat (`sheen`, `character.ts:1815`, which takes a tint).
- **Messages:** the `read` act with word points along the tag.
- **The key:** it looks at each tab pill in turn for a lock (`glanceAt(pillAt(href))` × 5), every pill but the Desk's. *Decided: a look at the Desk pill keeps its one meaning, that a new game, tool or paper has landed there (summary, reconciliation 4). This changes if that look is ever dropped.*
- **The glove:** it holds the glove against its own (new quirk `compare`).
- **The small diamond:** it squints (`setRestLid(0.4)` for 2 s).
- **The watch:** a `tap` on it, then held by the side of the helmet at the `cheeks` quirk's place, as if to listen.
- **The magnet:** when taken, it sticks to the glove for 0.3 s and comes away with a small tug (an impulse on the float).

#### 2.4 How a find is made

**One pure function:** `findOf(code) → Find`, in new `src/engine/finds/make.ts`. Its tables are frozen per code version. v1 tables are never edited, only superseded by a new version character.

**The content.** New `src/content/finds.ts`, beside `site.ts`: all the copy and all the types, in one place he edits.

```ts
export type Handover = "proud" | "sincere" | "hidden" | "keeps" | "wary" | "reverent" | "puzzled";
export type Category = "rubbish" | "stones" | "gems" | "ice" | "gold" | "relics" | "messages" | "living" | "nothing" | "rare";
export type Tier = "common" | "uncommon" | "rare" | "very rare" | "once";
export type FindType = {
  id: string;                       // "bolt"
  name: string;                     // the label's first line, serif: "A bolt." / "Quartz, smoky." (qualifier drawn per find)
  caption: string | string[];       // his line, ≤ 48; an array is the repeats (1st, 2nd, 3rd, after)
  reaction: UrchiReaction;          // what it does once it has read the caption
  handover: Handover;
  business?: string;                // a key into acts.ts's per-type extras (2.3)
  medium: string;                   // "Steel, M6."
  opinion: string;                  // the label's last line, serif 300, his: "It thinks it is gold."
  recipe: Recipe;                   // shape (below)
  material: Material;               // ramp (2.4, materials)
  category: Category; tier: Tier;
  qualifiers?: string[];            // "smoky", "twinned", "water-clear", "pitted", "fusion-crusted", "sun-bleached"
  when?: { first?: true; sky?: "uncommon" | "rare" | "very rare" | "fell"; hours?: "late" | "night";
           date?: string; drawerHas?: string; after?: string; weekday?: number };
  flags?: { melts?: true; cools?: true; grows?: number; once?: true; set?: string; links?: string };
};
```

**Codes.** A code is 18 characters: a version (1), a seed (7 base-36 characters, 32 bits), the context (8 base-36 characters, 37 bits) and a check (2 base-36 characters).

- **The context bits:**

  | Field | Bits | What |
  |---|---|---|
  | day | 13 | the day index since 2026-01-01, in his day (`day.ts`) |
  | hour | 5 | his hour |
  | sky | 2 | the sky variant |
  | song | 5 | the song's hue bin: 0 for none, 1-24 the 24 hue bins `tone.ts` reads covers into (`BINS`, :102) |
  | origin | 3 | outing, away, first, asleep, wreck, gift, his, snapped |
  | variant | 2 | reserved |
  | colourway | 7 | the index into `COLOURWAYS`, 100 of them (`character.ts:379`) |

- **The seed** is `subSeed(hashSeed(salt), "${day}:${n}")` (today in `sky/tune.ts:58`, :78; both move to new `src/lib/random.ts`, the one PRNG and hash frozen by a golden test, and `tune.ts` re-exports them): unique to this browser, this day and this outing. Pending finds use `"${day}:away:${k}"`.
- **The salt** is derived from the browser's one seed in `eigengrau:urchi` (`subSeed(hashSeed(seed), "finds")`), not rolled and stored a second time. *Ruled in the summary: one trust, one seed, both in `eigengrau:urchi`; `random.ts`, not `src/lib/seed.ts`, because `sky/seed.ts` already means visit seeds.*
- **The check** is `hashSeed(rest) % 1296`. It detects a typo'd or hand-made code. It is honest integrity, not authenticity: anyone can compute it, and the copy never pretends otherwise (2.9).
- **The song's title is not in the code.** The owner's drawer keeps it in `Kept.song`. A shared find's label falls back to "just after he played something."

**How a pick works** (A). Draw the tier: base odds, context modifiers applied, then renormalised. Then the category, from those with types at that tier. Then a type by weight. Then its parameters from the seed. The tier comes first, so the tier odds hold whatever the categories do.
- **Category weights:** rubbish 28, stones 22, gems 12, ice 9, gold 8, relics 7, messages 6, living 4, nothing 3, the rare 1.
- **Conditions:** types with a `when` are eligible only when it holds.
- **Once types** need all of: at least three days known, trust of at least 0.5, and not already found in this browser.

**Context** is read at departure and baked into the code (A):

| Context | Source | Effect | Label clause it can add |
|---|---|---|---|
| Warm sky (1 in 12) | `sky.variant === "rare"` (`Sky.ts:64`) | gold ×2.5 | "under a warm sky." |
| Milky Way (1 in 5) | `"uncommon"` | ice ×1.5, the rare ×2 | "under the Milky Way." |
| A star fell (1 in 50 skies, and it actually crossed) | the one shared crossing event, new `Stars.onShot` (Urchi §15) | makes *a piece of a shooting star* possible; very rare ×2 | "where a star came down." |
| He played something in the last ten minutes | `lastNow`, `playing` | gems ×1.3; a gem's hue is the record's (`toneNow(coverId)`, `tone.ts:293`) | "just after he played Holocene." (a title over 24 characters becomes "just after he played something.") |
| Late (his 23:00-00:59) | `clock().hours === "late"` | ice ×1.4, messages ×1.5, living ×1.5; empty returns one in two | "late, for him." |
| Monday (his, from `day.ts`) | | rubbish ×1.6 | "Monday. Mostly rubbish." |
| Friday | | gold ×1.3 | none |
| Sunday | | rare ×1.2; two outings | none |
| Days known | `store.days.length` | very rare ×(1 + 0.05 × days), at most ×2 | none |
| First find ever | store empty | fixed: the bolt | opinion: "The first thing it brought you. It is a start." |
| Its eyes | `drawnColourway()` | the eye gem takes the iris | always ends the provenance: "Its eyes were denim." |

**Shapes** (A; new `src/engine/finds/shape.ts`). This ports `hull3` and `polygons` from `urchi/tools/build-suit.mjs:175`, :210 to TypeScript, with a 4° coplanar tolerance and no `fail()` (flat input is re-jittered once and otherwise drawn as a two-sided plate). The build tool stays as it is.
- **rock:** 10-16 points on an ellipsoid (axes 1 : 0.6-0.9 : 0.4-0.75), each radius ×(1 ± `rough` 0.1-0.3). This merges to 8-14 planes: a knapped stone. A chondrite gets one pale cut face with round decals. Iron gets one flat face crosshatched in three line families at 60° (the Widmanstätten pattern), and regmaglypt dents as inset planes.
- **crystal:** `prism6` for quartz and moissanite (a hexagonal prism 1.4-3× as long as wide, pointed at one or both ends, vertices jittered 3-6%); `octa` for diamond, spinel and magnetite; `cube` for pyrite (striation decals); `dodeca` for garnet; `cab` for star sapphire; `tabular` for a pallasite slice. A cut gem is a low-poly brilliant with eightfold symmetry.
- **nugget:** 18-24 points, low roughness, the radius modulated by two or three slow sines, so it reads as poured rather than knapped.
- **shard:** 5-8 points with one axis flattened to 0.15-0.3, for foil, glass and solar-cell pieces. Foil gets two or three extra crumple points.
- **parts:** two to four convex parts from a small kit (hex prism, octagonal cylinder, box, wedge), exactly as the suit is built from `hullPart`s (`build-suit.mjs:264`).
  - bolt: a hex head and an octagonal shaft, with thread decals and "M6" engraved, visible at 1.5× zoom
  - lens cap
  - key: a bow of eight boxes, a blade, three teeth
  - watch: a disc, strap stubs, and hands at a seeded time
  - capsule: an octagonal cylinder with two domes
  - glove: its own mitten from `suit.json`'s `glove.R`/`thumb.R`, scaled 0.8 and bleached
  - coin: a 12-sided disc
  - disc: concentric groove lines
- **line** (B): thin-line drawings in `LINE_LOOK` with `Marks`' geometry (`Marks.ts`) for living things. A feather is nine strokes; a moth is two loops and a body; they sway with its breath. New `Sketch.ts`. Line-drawn things have no rim, and that absence is part of the taxonomy.
- **none:** nothing.
- **Budget:** at most 40 planes (gems ≤ 28, rocks ≤ 16, parts ≤ 60 triangles).

**The painter** (new `src/engine/finds/paint.ts`, Canvas 2D, at most 128 px square, or 256 px at 2× density and above):
- **One light.** `LIGHT` is hoisted out of `createUrchi` and exported. Each plane's shade runs from the material's `dark` to its `lit` by `max(0, n·L)^1.2`, the head's own curve (`character.ts:1219`). A find in its glove is lit exactly as the glove is.
- **Urchi's white rim** goes round every faceted silhouette, 2-3.5 screen px (`RoomScene.ts:177`). They are of its world.
- **The glint** goes on the single most-lit vertex, in the sky's sparkle shape. It stays sharp even when the find is pixelated.
- **It repaints only on a pose change of more than half a degree**, which is the character's own rule ("A frame that would draw what is already there is not painted again").

**Colour** (B):
- **Gems are saturated only on lit facets.** Facets turned from the light are near eigengrau, tinted by the hue at chroma ≤ 0.03. Facets square to the light reach the gem's chroma, capped at 0.12 in OKLab so they sit with the eyes, not above them. The single most-lit facet is nearly white. *Decided: the cap is new `GEM_CHROMA = 0.12` in `src/engine/finds/`, and gold keeps to it too. It drops to 0.09 if, at 10% zoom, dithered and pixelated, a gem reads as an interface accent (decisions, Space finds 1).*
- **Gold is the sky's gold.** Its ramp runs `[96,74,40]` to `[242,214,150]` (the sky's `#f2d596`, sparkle tint `#f6d48f`, `sky/defaults.ts`). In shade it turns toward amber, never olive, via `amberTurn` (`tone.ts:377`, exported). Never `#FFD700`.
- **Rubbish may have one faded colour** at chroma ≤ 0.03 (`CAPS.preview.C`, `tone.ts:341`): the colour of a crisp packet left in the sun for a year.
- **The eye gem's hue is `hue(labOf(iris))`** (`tone.ts:79`, :48): the one saturated find matches the one saturated thing always on screen.
- **A piece of eigengrau** is filled with exactly `#16161d`. Only its rim shows.

**Materials** (B's table, with A's ramps):

| Class | Ramp (dark to lit) | Rim | Glint | Special |
|---|---|---|---|---|
| steel | the suit's `grey`, `[92,92,90]` to `[172,171,166]`, `[214,214,208]` on the most-lit facet | yes | white, 10 px arms | engravings at 1.5× zoom |
| gold | `[96,74,40]` to `[242,214,150]` | yes | `#f6d48f`, 14-22 px | a disc gets groove lines |
| rubbish (foil, packet, cap, sock) | the suit's `fabric` and `pack` | yes | foil only: several tiny glints | one faded print colour |
| rock | **Urchi's own head**, planes `#040404` to `#1C1C1C` (`LiveIcon.tsx:23`) | white, so it looks like a relative | iron only | a meteorite has an amber edge (`accent` at 20%) where it burned |
| gem / crystal | hue at low chroma, to the capped chroma, to near white | yes | white, 22 px | the visor's sheen |
| ice | the sky's pale blue `#cddbff` family at 75% alpha, so stars show through afloat | thin | pale blue | shrinks (2.12) |
| paper | `fabric` | thin | none | serif text at 1.5× zoom |
| living | ink lines only | none | none | sways with its breath |
| line (a snapped line) | `LINE_LOOK` | none | none | a loose S from `lobe` (`Tether.ts:34`) |
| relic | a plate with the project's cover on its face, its edge in the cover's tone (`toneOf`, `tone.ts:281`) | yes | none | the only photograph on Space |
| ember | the suit's `accent`, `[176,104,40]` to `[246,172,76]`, warm in shade | yes | amber | pulses with its breath; cools over twenty minutes |

**Size and weight** (A):
- `mm` comes from the type's range on a log-normal.
- `grams` is the hull volume × density (iron 7.8, gold 19.3, quartz 2.65, olivine 3.3, ice 0.92, aluminium 2.7).
- Both are said in words, with ordinary comparisons, on the medium line: "Nine grams. About a thumbnail across."
- In its glove a find is 25-45% of the helmet's width (a reverent one spans both gloves). Carried, it is at most 40 CSS px. In the drawer, at most 55% of its compartment.

**Appearing and going** (B). The find uses Urchi's own 8 × 8 Bayer dither (`Urchi.ts:17-22`) on the same grid. A new uniform pair, `uFrom` (the glove in device px) and `uSpread`, offsets the threshold by distance from the glove, so a find **builds out from the hand that holds it** and goes back into it. That is the house style: the intro builds the head out from its eyes (`setReveal`), and the suit builds from the neck ring (`SUIT_BUILD`). In 2D canvases (the drawer, carrying) the same matrix is applied per pixel in JS.

**At night.** Finds brought at night are drawn 15% darker and 10% toward `#cddbff` while it is night, with a dimmer glint.

#### 2.5 The catalogue

The name is set in serif and the caption in his voice. Every caption has been checked at 48 characters or fewer, with no exclamation marks. "Then" is the reaction after reading. Phase: **1** is the first slice, **2** the rest of the loop, **L** later with its feature.

| # | Name | Caption | Then | Handover | Business / note | Made as | Tier | When | Ph |
|---|---|---|---|---|---|---|---|---|---|
| 1 | A bolt. | A bolt. It thinks it is gold. | glanceAway | proud | held high; first-ever opinion "The first thing it brought you. It is a start." | parts, steel | common | always the first | 1 |
| 2 | A washer. | A washer. It put its thumb through it. | slowBlink | proud | | parts, steel | common | | 1 |
| 3 | Gold. | Gold. It does not know what gold is for. | puzzled | sincere | wrist dips with the weight | nugget, gold | rare | | 1 |
| 4 | Foil. | Foil. It is very pleased with the noise. | slowBlink | proud | `fidget` while holding it; crinkle on each squeeze (phase 2 cue) | shard, foil | common | | 1 |
| 5 | A crisp packet. | A crisp packet. It was hoping you would not ask. | glanceAway | hidden | | shard, rubbish | common | | 1 |
| 6 | A stone. | A stone with no corners. It likes those. | slowBlink | proud | glances at it in your hand afterwards | rock (low rough), head material | common | | 1 |
| 7 | Something spiky. | Something spikier than it is. It will not look. | glanceAway | wary | | crystal cluster, iron | uncommon | | 1 |
| 8 | Quartz, smoky. | Quartz. It has been looking at itself in it. | glanceAway | proud | turns it until a facet flares | prism6, smoke-brown | uncommon | | 1 |
| 9 | A mote, in amber. | A mote, in amber. It is keeping this one. | wink | keeps | the keep of keeps | cab, amber with one art pixel | rare | | 1 |
| 10 | Nothing. | Nothing. It is holding it very carefully. | slowBlink | sincere | glove held out as if something were in it; label "Nothing. Dimensions variable." | none | common | | 1 |
| 11 | A gem. | A gem. The colour of its eyes today. | wink | keeps | held by its cheek, then the other, *does it match?* (never in front of the visor) | prism, the iris | rare | | 2 |
| 12 | Basalt, vesicular. | Basalt. Older than the site, and quieter. | longBlink | sincere | a slow blink at it: a relative | rock, head material, pits as dots | common | | 2 |
| 13 | A rock. | A rock. It thinks the rock is a relative. | slowBlink | proud | looks from the rock to you, then slow-blinks at the rock | rock, head material | common | | 2 |
| 14 | A pebble. | A pebble. Round, which it is not. | glanceAway | sincere | | rock, 20 facets | common | | 2 |
| 15 | A bottle cap. | A bottle cap. It has started a collection. | slowBlink | proud | | parts | common | | 2 |
| 16 | A battery. | A battery. Flat. It checked. | longBlink | sincere | | parts | common | | 2 |
| 17 | A cable tie. | A cable tie, done up round nothing. | puzzled | puzzled | | bent box | common | Mondays ×1.6 | 2 |
| 18 | A sock. | A sock. So this is where they go. | lookAround | hidden | | shard (soft), rubbish | common | | 2 |
| 19 | Comet ice. | Ice. It will not keep, and it knows. | longBlink | sincere | handed over fast; a drop falls | rock, ice, sheen 0.5 | common | melts | 2 |
| 20 | A spoon. | A spoon. It has no mouth, as far as I know. | puzzled | sincere | | parts, steel | uncommon | | 2 |
| 21 | A spring. | A spring. It went off on the way back. | glanceAway | wary | | parts (coil as rings), steel | uncommon | | 2 |
| 22 | A button. | A button. It pressed it. Nothing happened. | puzzled | puzzled | | parts | uncommon | | 2 |
| 23 | A die. | A die with no spots. It keeps rolling it. | puzzled | puzzled | | cube | uncommon | | 2 |
| 24 | Scissors, half. | Half of some scissors. It is not sure which. | lookAround | puzzled | | parts | uncommon | | 2 |
| 25 | A magnet. | A magnet. It keeps finding its way back. | glanceAway | proud | sticks to the glove 0.3 s when taken | parts | uncommon | | 2 |
| 26 | A thread, wound. | A thread, wound into a ball. Familiar. | a glance up at the "2" | proud | `glanceAt(pillAt("/projects"))` | line-drawn ball | uncommon | | 2 |
| 27 | A gold coin. | A gold coin, the same on both sides. | glanceAway | puzzled | | coin, gold | uncommon | | 2 |
| 28 | Foil, gold. | Foil, off a satellite. Gold, technically. | puzzled | proud | proud because it is foil, not because it is gold | shard, gold foil | uncommon | | 2 |
| 29 | An umbrella. | An umbrella. It has not rained since. | lookAround | proud | | parts | uncommon | | 2 |
| 30 | A glove. | A glove. Someone else's. It tried it on. | glanceAway | puzzled | `compare`, glove against glove | its mitten, bleached | uncommon | | 2 |
| 31 | Iron, pitted. | Iron. Heavier than it looks, and it knows. | longBlink | sincere | wrist dip +12° | rock, regmaglypts | uncommon | | 2 |
| 32 | Pyrite, cubic. | Pyrite. It is prouder of this than the gold. | glanceAway | proud | `pat`, `inspect`, then "><" | cube, gold-ish | uncommon | | 2 |
| 33 | Olivine. | Olivine. Green, the way bottles are green. | slowBlink | proud | | rounded prism, green or the record's hue | uncommon | | 2 |
| 34 | Garnet. | A garnet. Dark red until the light finds it. | longBlink | proud | eyes widen as the lit facet comes round | dodeca | uncommon | | 2 |
| 35 | A frozen drop. | A frozen drop. Nobody made it that round. | slowBlink | proud | cross-eyed at chest height (`converge(1)`) | near-sphere, 20 pts | uncommon | | 2 |
| 36 | A feather. | A feather. There are no birds. It checked. | lookAround | puzzled | | line-drawn | uncommon | | 2 |
| 37 | A mission patch. | A patch from a mission nobody remembers. | lookAround | puzzled | looks at you as if you might | disc, decal ring | uncommon | | 2 |
| 38 | A capsule, sealed. | A capsule. There is a line inside. | longBlink | reverent | reads the line inside (`read` over the text), then shows you; the line is one of his five `URCHI_LINES` (`site.ts:58-64`) not shown this visit, until new `CAPSULE_LINES` holds lines he writes (decided) | parts capsule | uncommon | messages | 2 |
| 39 | A meteorite. | A meteorite. It came a long way to be held. | longBlink | reverent | medium "Chondrite, fusion-crusted."; opinion "Older than the Earth, give or take." | rock, crust, cut face | rare | | 2 |
| 40 | Iron, etched. | Iron, etched. It is tracing the lines. | slowBlink | reverent | small pupil flicks along the crosshatch; opinion "The lines took a million years to cool." | rock, crosshatch | rare | | 2 |
| 41 | Pallasite, sliced. | Pallasite. From the middle of something. | longBlink | reverent | | tabular, olivine in metal | rare | | 2 |
| 42 | A crystal. | A crystal. It hums if you hold it still. | longBlink | reverent | with sound on it does hum (glass ring loop at 5%) | prism cluster | rare | | 2 |
| 43 | Clathrate. | Clathrate. Ice, with some old air in it. | slowBlink | sincere | held by the side of its helmet, to listen | rock, ice, bubble decals | rare | melts | 2 |
| 44 | Moissanite. | Moissanite. It came inside a meteorite. | slowBlink | proud | `cheeks` | hex plate, water-clear | rare | | 2 |
| 45 | A watch, stopped. | A watch. Stopped at 4:17. It is listening. | puzzled | puzzled | `tap`, then by the side of the helmet; the time is seeded | parts watch | rare | | 2 |
| 46 | A seed. | A seed. Nothing grows out here. It is trying. | slowBlink | keeps | | line-drawn | rare | grows (2.12) | 2 |
| 47 | A moth, asleep. | A moth, asleep. It is being very quiet. | slowBlink | reverent | breath held long (`holdBlinks(4)`) | line-drawn | rare | late or night | 2 |
| 48 | A key. | A key. There is no door out here. | lookAround | puzzled | looks at each pill in turn for a lock, all but the Desk's | parts key | very rare | | 2 |
| 49 | Sapphire, star. | A sapphire. It has a star in it, like yours. | wink | keeps | | cab, blue, a six-point glint in the sky's style | very rare | | 2 |
| 50 | A diamond, very small. | A diamond, very small. It is squinting. | puzzled | puzzled | lids to 0.4 | octa, 2 mm | very rare | | 2 |
| 51 | A tag, shifted. | A tag, the letters shifted. I would know. | puzzled | puzzled | reads it; handed to the cybersecurity area (section 10) | flat tag, glyph decals | very rare | | L |
| 52 | Gems, when a bolt is kept | A gem. It would rather have had the bolt. | glanceAway | sincere | | as the gem | uncommon | drawer has a bolt | 2 |
| 53 | A piece of eigengrau. | A piece of eigengrau. It is very still. | longBlink | keeps | opinion "The grey you see with your eyes shut."; with sound on, the room goes quiet (2.10) | hull in `#16161d`, only its rim | once | | 2 |
| 54 | The other glove. | The other glove. Now it has a pair. | slowBlink | proud | joins #30 as one entry | its mitten, other hand | once | after #30 | 2 |
| 55 | A USB stick. | A USB stick. My first project is on it. | puzzled | reverent | the label links to that project's case page; "my first project" is computed, the public project with the earliest `start` (decided), never a private one | parts | once | | L |
| 56 | A pencil. | A pencil. It writes upside down. | puzzled | puzzled | | parts | once | | 2 |
| 57 | Chrome. | Chrome, from whatever lived here before it. | slowBlink | reverent | label "It lived here until 24 September. Urchi never met it." | faceted drop, banded sky/floor ramp | once | | 2 |
| 58 | A burrito. | A burrito. It was free. | slowBlink | proud | label medium "Tortilla, mostly." | line-drawn | (fixed) | 28 September, once a year | 2 |
| 59 | A piece of a shooting star. | A piece of a shooting star. Still warm. | longBlink | reverent | its breath slows; dozes off holding it | ember | very rare | a star fell (4) | L |
| 60 | The line. | The line you snapped on 14 September. | longBlink | sincere | (3) | line | (fixed) | a snap on record | L |
| 61 | A piece of {title}. | A piece of Halo. Shipped 2021. | longBlink | reverent | (5) | relic plate | (event) | wreck days | L |
| 62 | Part of a letter. | Part of a letter. It has read it twice. | longBlink | reverent | (6) | paper strip | (story) | | L |

**Repeats** (B; `caption` arrays, selected by `store.seen[type]`):

| Find | 1st | 2nd | 3rd | after that |
|---|---|---|---|---|
| bolt | A bolt. It thinks it is gold. | Another bolt. It has a type. | A third bolt. I have stopped asking. | A bolt. Of course. |
| nothing | Nothing. It is holding it very carefully. | Nothing again. It is getting better at it. | Nothing. Its best yet. | Nothing. |
| gold | Gold. It does not know what gold is for. | More gold. It would still rather the bolt. | Gold. It is using it as a paperweight. | (1st again) |
| crisp packet | A crisp packet. It was hoping you would not ask. | Another packet. It has stopped hiding them. | | |
| ice | Ice. It will not keep, and it knows. | Ice again. It is not learning. | | |

The packet's second line changes its handover from `hidden` to `sincere`: *it has stopped hiding them.*

**One small thing for people who notice.** Seven colourway names are also find names: pebble, moth, umbrella, socks, marble, ember and postcard (`character.ts:379`). When they coincide, the provenance ends "Its eyes were pebble, as it happens."

#### 2.6 Taking and carrying

**Taking.** Click or tap the offered find, or press Enter on the control.
- It leaves the glove: the hand opens (`wrBend` −20) and the find keeps the hand's velocity for a frame.
- With sound on, `sfx.pat` plays at 0.6, its own blink-beat, like a handshake.
- `store.held` is set. The live region says "You are carrying the bolt."
- One named event is counted, `find_taken { tier }`, through new `src/lib/count.ts` (Umami, cookieless, proxied same-origin under `/u/`, nothing sent under Do Not Track or Global Privacy Control), and `/kept` prints it exactly as sent. The tier travels only in that event; it never reaches the screen, so rule 3 holds. *Decided (decisions, item 7): it is what the pacing review on 23 November reads.*
- Urchi watches it go. A new target kind `"carried"` (weight 1.1, or 1.4 for round things) holds for a minute, with its novelty spiking whenever you move it. It checks that you still have it, the way a cat checks a toy it dropped at your feet.

**On a desktop: a short thread** (B).
- The find hangs 36 px below the pointer on a thread in `LINE_LOOK`'s ink and width. It is a damped pendulum: length 36 px, gravity 900 px/s², damping 1.8/s. Moving fast swings it, and stopping lets it settle.
- Over a link or button, it lifts 12 px so it never covers the thing you are about to click.
- **It never pesters** (A). After 6 s of stillness, or when the pointer leaves the window, it goes to the pocket over 0.6 s.
- New `src/components/chrome/Carried.tsx`: one fixed 2D canvas of at most 64 CSS px, above the page row and under the chrome (`z-index` 9000; the chrome is at 9999). It listens to `pointermove` on the window, is painted by `paint.ts`, and repaints only when the find's turn changes.
- **It stays under the pointer while the pages slide beneath it.** Press "6" while carrying and it travels with you to About. *Ruled in the summary: with the Desk third, About's key is 6, not 5; the digits come from `src/lib/keys.ts`.*
- **On the Desk it goes into the pocket at once** (over the same 0.6 s), and never hangs under the pointer there, on any screen. The boards own the pointer, and Same Grey is literally a test of what sits beside a grey. It plays no arrival cue there. On the Desk a click on the pocket opens the drawer rather than taking the find out; off the Desk, the pocket hands it back as usual. *Ruled in the summary (reconciliation 3).*

**On a phone: from the active pill** (B).
- There is no pointer, so a tapped find hangs on the same thread from the active tab's pill (`pillAt(href)`, `attention.ts:118`). When the tabs slide, the pill moves and the find swings. The pill is the lit one, `pillOf(path)` in new `src/lib/routes.ts`, so on a case page it hangs from Projects. Arriving on the Desk, it goes into the pocket instead (above).
- Tapping the hanging find puts it in the pocket.

**The pocket** (A, with the placement fixed).
- A 28 × 24 glass chip, the size the sound chip is today (`.sound-chip`, `globals.css:201`), with the site's one glass and one radius.
- **It does not exist until the first time you take something.** That is a hidden behaviour of its own.
- **Where it sits.** `top: 8px; right: 8px` on every screen: the top-right corner the sound chip gives up when it moves into the nav (Style R4). *Ruled in the summary: this replaces the first plan (on a desktop `right: 44px`, left of the sound chip; at 1024 px and below, the hidden chip's empty place).*
- It shows the held find's silhouette at 12 px with its rim, or a 1 px ink hairline square at 40% when your hand is empty. A second dot appears when a thirteenth find is waiting.
- **A click** takes the find back out to your hand. With nothing held, it opens the drawer.
- `aria-label`: "Carrying the bolt. Open the drawer." or "Open the drawer."
- New `src/components/chrome/Pocket.tsx`, mounted in `Shell.tsx` where `SoundChip` is today (:199), once the chip has moved into `Nav.tsx`.

**Putting it down:** click the find once on any tab (it dithers into the drawer), use the drawer's "Put back", or set it down at a place (2.8).

**Keyboard:** the drawer's buttons ("Carry the bolt", "Put back"). The pocket is a real button.

**Screen reader:** "You are carrying the bolt." / "The bolt is in the drawer."

#### 2.7 The drawer

**Pitch.** A specimen drawer of twelve compartments, one for each piece of the intro's ring, where finds lie on eigengrau with museum labels.

**How it opens.** From the pocket, on any tab. It is a `role="dialog"` with `aria-modal`, a focus trap, and Esc to close. Esc is stopped there, so Notes' clear and Projects' wind-back do not also fire while it is open. The drawer claims Esc and the digits through new `src/lib/keys.ts`'s claim stack (the summary's one capture-phase listener), so on the Desk its Esc closes the drawer before it takes the Desk up a level.
- It slides down from the pocket's corner on the one grey glass (`rgba(40,40,47,.5)`, 40 px blur, 4 px radius), over 420 ms on `--ease-inout`.
- On a phone it is a full-height sheet.
- On Space, Urchi at home keeps watching over its lower edge. Opened on the Desk, it is only the drawer: Urchi never comes to the Desk.

**The layout.**
- Twelve compartments: 4 × 3 on a desktop (132 px each, about 560 px wide), 2 × 6 on a phone.
- They are separated by hairlines (1 px ink at 12%), with no boxes and no shadows.
- Each find lies at the centre of its compartment, turning very slowly about its vertical axis (one turn in 40 s), with its label in the lower third.
- All twelve are painted on one shared canvas, repainted only while something turns or is hovered.

**Hover or focus a compartment:** the find turns its best facet to the light and its glint catches once. The opinion line rises through the site's text mask (`MaskedWords`, as captions do).

**The label** (B's tombstone, with A's weight in words):

```
A bolt.                                        Serif 400: the name
Steel, M6. Nine grams.                         Grotesk 500, 11px: the medium, and its weight in words
Found by Urchi at 14:02, 29 September,         Grotesk 500, 11px: provenance, his time (clock())
out on its line. Its eyes were denim.
It thinks it is gold.                          Serif 300: his opinion
```

- **The medium line, by material:** "Steel, M6." "Gold, probably." "Aluminium foil." "Basalt, vesicular." "Amber, and a mote." "Paper, torn." "Ice, for now." "Rope, the site's own." And for nothing: "Nothing. Dimensions variable." (Galleries write "dimensions variable" for installations. Here it describes nothing.)
- **Provenance clauses.** The first that applies is used, and the colourway always ends it:
  - "out on its line." (the default)
  - "asleep afloat."
  - "just after he played {title}."
  - "at the wreck of {project}."
  - "after you threw it too hard." (a visit where the line snapped)
  - "under the Milky Way." / "under a warm sky." / "where a star came down."
  - "late, for him."
  - "Monday. Mostly rubbish."
  - "brought back on Tuesday, while you were out." (pending finds; this is where B's postcards went)
  - "given by someone. It is a copy. Most gifts are." (gifts)

**Actions per compartment:**
- **Carry** takes it to your hand. The compartment keeps an outline and the label in grey: "Out with you."
- **Give** copies `/f/<code>` (2.9). A hairline appears under the label: "Given, 29 September."
- **Let go** is a press and hold of 1.2 s. The find drifts up out of the drawer and fades. It goes back out into the sky, where a later outing has one chance in ten of bringing it back: **"It found this again."** (v3: it also becomes a faint named star.)

**The heading.** One grotesk word and one serif sentence, the site's own pattern ("Work Six projects since 2021. Two alive."). Counts use `countWord` (`site.ts:201`).
- **Drawer** Nothing yet. Leave it alone a while.
- **Drawer** One thing since 29 September. A bolt.
- **Drawer** Four things since 29 September. It thinks one of them is gold. *(when a bolt is in)*
- **Drawer** Seven things since 12 September, and most of a letter. *(v2)*
- **Drawer** Five things, and where some ice was.
- **Drawer** Twelve things. It will not choose for you.

**Full.** The thirteenth find waits in its pack, and the pocket shows a second dot. It does not open the drawer by itself. When you open it, the new find waits outside the grid: "The drawer is full. It will not choose for you." You let one go, and it moves in. Story compartments (the letter) never count against the twelve.

**Pairs.** The glove and the other glove sit as one entry. Relic sets come in v2.

**Reduced motion:** the drawer appears without sliding, finds do not turn, and a glint still catches (it is light, not motion).

New `src/components/chrome/Drawer.tsx`. It is DOM for the labels and buttons: every find is a `<figure>` with a `<figcaption>`, and every compartment's action is a real button.

#### 2.8 Setting it down

While you carry something, the places that accept it show a thin ring on a phone. On a desktop, the cursor word names the gesture.

| Where | Cursor word | What happens | Kept as | Phase |
|---|---|---|---|---|
| **About**, after "things." | "Leave it here" | **It becomes the full stop** (B): "the small things" and then a bolt, at the stop's size and baseline. The Urchi mark after it glances at it now and then (`AboutScene`'s `GAZE`, :31). Feasibility: the stop is split out of the last line's troika `Text`, and a plane textured by `paint.ts` sits at its caret box, placed by the same code that places the mark (`MARK`, :23). The screen-reader text becomes "the small things, and a bolt." Setting another there swaps the old one into the drawer. Once Sky ships (week 4), "the small things" is a link to the Tools drawer; the full stop stays the finds', outside the link (decisions, Music, About and Notes 4). About's foot stays at two lines. | `placed.about` | 1 |
| **Space, at home**, on a spike | "Give it back" | It rests on one of three side spikes, as a mote rests (`Motes.ts:312-318`, `restOn`), and Urchi blinks at it twice. It looks up at it after each breath for a while. Needs new `URCHI_SPIKES` (three side-spike tips, taken from the head mesh's protrusion vertices, as `build-suit.mjs` finds them) and a new `room.onHead(mx, my)` mapping for the pose at home (`RoomScene.ts:355-366`). **Taking Urchi with you folds its spikes** (`tuck`, `SUIT_BUILD`), so anything perched goes into its pack, and the drawer notes: "It put them in its pack." | `spikes` (why "placed") | 1 |
| **Space, afloat**, near Urchi | "Give it back" | It reaches for it (`reachOut`, `Float.ts:740`, as it reaches for a still pointer) and takes it in its glove. Gems get `pleased`; rubbish gets "><" (*you brought that back?*). If it is the thing it once kept for itself: **"It wanted to hold it again."** It stows it as *its own*. Trust +0.05. | `urchi` | 1 |
| **The Desk** (`/desk`, `/today`, `/tools`, `/security`) | none | Nothing is set down here. The find goes into the pocket at once and never hangs under the pointer (2.6). *Ruled in the summary (reconciliation 3).* | none | 1 |
| **404** | none | "Nothing here." becomes "Nothing here. Except a bolt." A tiny client child in `not-found.tsx` reads `store.held`. It sits in Style R8's 404 (the sanitised path, the six tabs as words plus "Colophon"), as the summary's reconciliation 9 has it. | none | 2 |
| **Notes** | "Set it down" | It settles at the foot of the column like a paperweight, and the heading gains a clause: "Two since September: two random. And a bolt." The client side appends to `indexSentence` (`notes.ts:113`). A letter strip set down here reads as one of the notes, dated the day it was found. | `placed.notes` | 2 |
| **Music** | "Leave it in the room" | It takes the room's colour: a gem's lit facets bend to the record's tone (`bend`, `tone.ts:392`). With no record on, a gem lends the room its own colour at preview strength (`CAPS.preview`). Copy: "No record on. The room takes the gem's colour." Under an open door, a crystal's glass ring loops at 5%. | `placed.music` | v2 |
| **Projects** | "Tie it on" | It clips to the loose end at the top (now) as a bead that sways with the ball. A relic hung on its own project's mark settles there with that project's pluck. This needs `ThreadScene` internals (`NOVA_EVENT` has no listener to lean on). | `placed.projects` | v3 |

#### 2.9 Gifts

**Pitch.** Any find can be given as a link. Whoever opens it gets a copy, delivered by their own Urchi's room. *Decided: gifts are copies ("It is a copy. Most gifts are."), not look-but-don't-keep, because copies travel better (decisions, Space finds 3; new `GIFT = "copy"` in `finds.ts`).*

**How it works.**
1. In the drawer, **Give** copies `https://<site>/f/<code>`, where `<site>` is `SITE_URL`, read from `NEXT_PUBLIC_SITE_URL` (the Vercel production URL until the domain is bought; a production build fails while it is unset or still `.example`).
2. New route `src/app/f/[code]/page.tsx`:
   - `generateMetadata` decodes the code (pure `findOf`, no server data). The title is the find's name ("Quartz, smoky.") and the description its opinion line, so a link unfurls as the thing itself.
   - The page then runs `location.replace("/?find=<code>")` in the browser. A server redirect would make unfurlers read `/`'s metadata instead.
   - Putting `generateMetadata` on `/` itself would make the home page dynamic, which is why this is a route of its own. *Once the CSP moves to nonces every page renders dynamically anyway (summary, "The CSP's first form"). The route still earns its place: `opengraph-image.tsx` receives `params`, never `searchParams`, so a find's own card needs a path, and canonicals are set per route, never on the root layout.*
3. On `/?find=`, after the eyes open plus 2 s. The parcel is that visit's one arrival act: it comes first in the summary's order (a gift parcel, the news look, the rhythm greeting, recognition), and the others wait for another visit.
   - **At home:** a small parcel (the find in a paper wrap, faceted in `fabric`) drifts in from the right edge at mote speed and comes to rest on a spike. The mote physics and `restOn` do this already. Urchi blinks at it twice. Caption: **"Urchi / Someone sent you this."** Cursor word: "Take". Taken, the wrap dithers off and the find is presented the sincere way.
   - **Afloat:** the parcel comes along a second thin line from the right edge into its glove. The line is a plain `Ribbon` with no physics beyond a sag.
4. The gift goes into the drawer with `origin: gift`. Label: "Given, 29 September. It is a copy. Most gifts are."
5. A browser opens the same link once (`store.gifts`); a second open shows the parcel's caption as "You have this one."
6. Gifts never count toward once types, so gifting cannot be used to farm them.

**A bad check** (a typo, or someone minting a piece of eigengrau by hand): the parcel arrives, Urchi looks at it and glares at *it* (`react("angry")` aimed at the parcel, not at you), and it dithers away. Caption: **"A forgery. It can tell."** The check is a 1-in-1296 integrity check, not a signature. *Decided: it stays a quiet check. Nothing on the site invites anyone to try it, and no light, game or paper asks for a forged code, because security here is defensive only (decisions, Space finds 3; section 10).*

**Phone:** the same, with the parcel on a spike. **Reduced motion:** the parcel dithers in on the spike. **Night:** the parcel still comes, and the glove variant applies ("It found this in its sleep.").

**v1.5, the share image:** `src/app/f/[code]/opengraph-image.tsx` with `next/og`. A `polygonsOf(find, pose)` backend of the painter emits SVG paths, so the unfurl shows the actual object on eigengrau with its rim, its name in Newsreader and its opinion in Inter Tight. It runs at the edge, is cached forever (a code never changes what it builds), and needs no database. **This is the part of the feature that travels. It is how a piece of eigengrau advertises the portfolio in a group chat.**

#### 2.10 Sound

Off by default. All synthesised, in the bed's F G A C D. With sound off nothing is made and nothing is fetched.

**Phase 1** maps finds to the existing cues through a new `sfx.find(kind)` helper (A):

| Moment | Cue |
|---|---|
| the line paying out | `sfx.train` of 14 ticks, gaps 40 to 110 ms, rate 0.9 to 0.7, gain 0.3 (the reel) |
| it finds something | two `sfx.tug(0.2)`, 0.3 s apart (D2) |
| reeling back | the train at rate 0.9, quicker |
| gems, as it turns them | `sfx.pluck(880, "ring")` (A5); very rare `sfx.pluck(1174.66, "ring")` (D6). `primePluck` at departure |
| gold | the counter's D/A chime, `sfx.play("done", 0.7)` |
| rubbish, stones | `sfx.pluck(110, "thud")` (A2), the dead-work thud |
| taking it | `sfx.pat` at 0.6 |
| drawer open / close | `"focus"` / `"close"` |
| a piece of eigengrau | **the room goes quiet**: `sfx.air(700, 0.6)`, then back over 4 s **to whatever the air was** (never forced open while the supernova or a preview has it) |

**Phase 2** adds B's recipes as new `Synth` names in `synth()` (`sfx.ts:118-131`, and the `Name` union at :15):

| Cue | For | Recipe | Pitch | Length | Level |
|---|---|---|---|---|---|
| clink | steel | sines at G5 783.99 and 2.76× (2163.8), decays 0.12 s and 0.05 s, plus a 3 ms noise tick | G5 | 0.25 s | 0.18 |
| small bell | gold | C6 1046.5, 2× at half level, 3× at a quarter; decays 0.6, 0.35 and 0.2 s | C6 | 0.9 s | 0.14 |
| glass ring | gems ("it hums") | A5 880 with D6 1174.66, 20 ms attack, 1.6 s decay, each doubled 0.3% sharp | A5, D6 | 1.8 s | 0.1 |
| crackle | ice | 5 ticks at random 12-40 ms gaps (`rate` 1.4), then D7 2349.3 for 0.25 s | D7 | 0.5 s | 0.08 |
| knock | rock | F3 174.61 with a 50 ms noise burst; a big rock knocks twice, 90 ms apart | F3 | 0.15 s | 0.25 |
| crinkle | rubbish, each squeeze of foil | 10 noise grains at 8-30 ms | none | 0.3 s | 0.2 |
| rustle | paper | noise, 40 ms attack, band-passed 2-4 kHz | none | 0.25 s | 0.12 |
| tok | living | F4 349.23 with its third harmonic, 50 ms decay | F4 | 0.1 s | 0.18 |
| glow | ember | a low crackle (lowpass 800 Hz) over a G2 98 hum fading over a second | G2 | 1.2 s | 0.1 |
| drawer | opening | noise, lowpass sweeping 300 to 1200 Hz over 0.14 s, with the pat at half level | A2 | 0.3 s | 0.15 |

- At his night every cue plays at 60%.
- A carried find plays its cue once, at 40%, as you arrive on a tab.
- Every sound has a visible counterpart (the twitch, the glint, the "><"), so nothing is lost with sound off.

#### 2.11 Trust (hidden, from A, fed by the existing call)

*Ruled in the summary (reconciliation 5): trust lives once, in `eigengrau:urchi` (new `src/engine/urchi/memory.ts`), with the model in Urchi §12.1. The finds keep no trust of their own. Their events (the keeps trade, giving a find back, taking a reverent one, a snapped line) feed that one value, and the thresholds below read it.*

- **Range:** 0 to 1, starting at 0.2, and decaying toward 0.2 between visits (`T ← 0.2 + (T − 0.2)·e^{−days/30}`, Urchi §12.1). It is never shown. Affinity is felt, not read.
- **Goes up:**
  - Days known no longer add trust directly (the first draft had +0.05 per day known). Coming back is rewarded by §12.1's own sources: strokes, calm company and a slow blink met with stillness.
  - +0.15, §12.1's figure, when its own rhythm is tapped back, whether in the keeps trade or **the existing Call's third answer** (the `trust` act, `acts.ts:455`). One line in `Call` writes it, once.
  - +0.05 when you give something back afloat
  - +0.05 when you take a reverent find
- **Goes down:** −0.1 per line snapped, §12.1's figure, written once (the first draft had −0.05 when a throw snaps its line, `fl.thrown`, `Float.ts:272`). A night waking costs §12.1's −0.15, not the finds'.
- **It governs:**
  - once types (≥ 0.5)
  - `giveKept` (≥ 0.6, weekly)
  - the gem the colour of its eyes, which becomes a keeps you are offered first, not a keeps you must ask for, at ≥ 0.8

#### 2.12 Things that change while you are away (phase 2; B's, with A's timings merged)

- **Ice** shrinks from 1 to 0.85 over twenty minutes of the visit, and is gone by the next day. The compartment keeps its label: **"Gone. It was ice on 29 September."**
- **The seed** comes up on the seventh day known after it was found. A thin-line shoot grows out of it in the drawer. Label: **"A seed. It came up on 6 October."** This contradicts its own caption ("Nothing grows out here"), and that is the best surprise in the set.
- **The moth**, if the drawer is opened during his night, is gone the next time. Label: **"It left on 3 October. The drawer was open."**
- **The ember** (v1.5) cools from amber to rock over twenty minutes. The next visit: **"Cold now. It was warm on 29 September."**

#### 2.13 Persistence

One key, versioned, with every access guarded in the pattern of `along.ts` and `sky/seed.ts`. Private mode keeps it in memory for the page's life. New `src/engine/finds/store.ts`, built on the shared `keep("finds", …)` from new `src/lib/store.ts` (versioned, guarded, kept in step across browser tabs), not on its own storage code. A second tab sees `out` through the `storage` event (which `keep()` already listens to) and shows the same outing rather than starting one. *Ruled in the summary: storage goes through `store.ts`; the key goes into the README's list and onto `/kept`; trust and the seed live in `eigengrau:urchi`, not here.*

```ts
// localStorage["eigengrau:finds"]
type Kept = { code: string; at: number; eyes: string; song?: string; pack?: true; gone?: number; given?: number };
type FindsV1 = {
  v: 1;
  // no salt here: it is derived from eigengrau:urchi's seed, subSeed(hashSeed(seed), "finds") (2.4)
  first: number;                       // first visit, ms (the letter's date, v2)
  days: string[];                      // YYYY-MM-DD in his day (day.ts) this browser was here (last 60): "days known"
  // no trust here: it lives once, in eigengrau:urchi (2.11)
  dry: number;                         // finds since the last rare or better (pity)
  today: { day: string; n: number; next: number; lastEmpty: boolean };
  out: { code: string; left: number; found: number | null; back: number; far: [number, number] } | null; // wall ms
  spikes: { code: string; why: "away" | "placed" | "gift" }[];  // three at most
  held: string | null;
  drawer: Kept[];                      // twelve at most
  waiting: string | null;              // the thirteenth
  urchi: string[];                     // what it keeps for itself
  placed: { about?: string; notes?: string; music?: string };
  seen: Record<string, number>;        // times each type was found (repeats)
  once: string[];
  lost: string[];                      // let go; may be found again (last twelve)
  gifts: string[];                     // gift codes opened here
  // added by later features, all optional so v1 needs no migration
  snaps?: { at: number; thrown: boolean }[];  knots?: number;
  arcs?: Partial<Record<"letter" | "probe", number[]>>;
  geodes?: Record<string, { knocks: number; last: string }>;
  stage?: number;
};
```

Under 3 KB even when full. `migrate(raw)` upgrades older shapes (it is the `read(data, from)` that `keep()` takes), and anything unreadable starts fresh.

**Wall time, not the panel's clock.** `out` stores wall times. `outing.resume()` runs on mount and when the tab comes back (`onVisibility`, `CreativeSpacePanel.tsx` about :540):
- **Still out:** it is placed at the right depth for the time elapsed.
- **Should be back:** it is back, and you **catch it turning the find over** before it notices you. This reuses the `caught` pattern: a startle, then `faces.react("embarrassed", { delay: 0.6 })`, then it presents.
- **A new visit** (the `along` 30-minute rule has expired, so Urchi is at home): the find becomes a pending one on a spike. **"It kept these for you."**
- **Sent home or snapped mid-outing:** it is far away and cannot fly off the page. It dithers home, and the find (if the twitch had come) goes onto a spike.

**Pending while away.** On a visit's first load, for each whole day since the last visit (`lastVisit()`, `visits.ts:110`), up to three, it makes a find with origin `away` and puts it on a spike. Hover a spike: "Urchi / It kept these for you." Label: "brought back on Tuesday, while you were out."

**Cheating** (clearing storage, changing the clock) just starts a new drawer or skips a wait. There is nothing to win, no leaderboard and no shared scarcity. The design only makes sure the honest path is the pleasant one.

**Forgetting.** `/kept` lists `eigengrau:finds` and what it holds, beside `eigengrau:urchi`, and its "Forget me" button clears every `eigengrau:` key, the drawer included (decisions, item 6).

#### 2.14 Rendering and budget

- **On Space:** new `src/engine/finds/FindSprite.ts`. It is one plane in the room's scene with a `CanvasTexture` painted by `paint.ts`, using **Urchi's own smooth fragment shader** (exported from `Urchi.ts`), so it dithers with `uDither` and pixelates with `uPix = room.pixelCell`. It adds the `uFrom`/`uSpread` pair.
- **Placement.** It is placed every frame in `room.afterUrchi` (`RoomScene.ts:244`), at `room.onFigure(...)` (:382) of the glove's middle from the new `character.handAt(side)`. At home it uses the new `room.onHead`.
- **Order.** `renderOrder` 0.5 (over the figure) while the hand is forward (view z > 200), and −0.25 (behind) when lowered or stowed. Fingers cannot wrap round it, so v3 paints the find into Urchi's own canvas as a part carried by the glove segment.
- **Elsewhere:** carrying, the pocket, the drawer and About are plain 2D canvases, except About's plane, which lives in `AboutScene`'s existing renderer. There is no second WebGL context.

| Item | Budget |
|---|---|
| Paint per pose change | ≤ 40 planes: about 0.1-0.2 ms on a desktop, ≤ 1 ms on a mid-range phone; at most 30 paints a second while turning, none while still |
| Draw calls on Space | +1 (the sprite). The outing itself adds none: it reuses Urchi's plane and the line |
| Memory | one 256² texture; the drawer's one canvas while open |
| Bundle | `src/engine/finds/*` and `content/finds.ts` at about 12-16 KB gzipped, **loaded on demand** the first time an outing starts, the pocket exists or a `?find=` arrives, as the suit is fetched only once it is worn (`warmSuitIdle`, `character.ts:217`) |
| Storage writes | one per state change |
| Frame work while out | a few multiplies (the depth ease, the far point's drift); the rope already runs |

#### 2.15 Edge cases

| Case | What happens |
|---|---|
| **First visit** | The first outing waits only 20 s afloat and 8 s of stillness, rummages for 8-12 s and always brings the bolt: "A bolt. It thinks it is gold." Most first-timers who take Urchi afloat and leave it for a minute and a half see a whole outing |
| **Phone** | The far point is upper middle; the far figure's hit area is at least 44 × 44 px; captions rise by themselves as `PHONE_CAPTION` does (:58); taking is a tap with a 24 px margin round the find; the find hangs from the lit pill (`pillOf`); the pocket is top right, as on every screen; the drawer is a full-height sheet; far zoom is a pinch, which already works; checked at 390 px and at 320 px, where the six pills leave the pocket its corner |
| **Reduced motion** | Outings are a dither out and back where it floats (the float-in already is, `Float.ts:534`); handovers use lids, pupils and faces only; the find sits at the hanging glove; nothing swings, the drawer does not slide, finds do not turn; the dither still runs (a dither is not motion); all of it is still there. `Carried`, `Pocket` and `Drawer` watch `prefers-reduced-motion` live, as the house rules ask of DOM features |
| **Sound off** | Silent. The twitch and the glint carry the moment |
| **His night** | No outings. An outing under way when night starts finishes, and it comes back and dozes where it floats, holding the find; the presentation waits until you wake it. The night's first wake in a browser is the softer one (heavy lids, a slow blink; decisions, item 6), and only a second wake the same night glares; either way it then remembers it has something for you. The asleep handover (2.3, #9) happens once a night |
| **Late (23:00-00:59)** | More empty returns; ice, messages and the moth lean up |
| **While he plays something** | No outings; one under way comes back early: "It came back for the song." |
| **Tab hidden, another tab, a reload** | Wall time; resume; "caught" if it is already back |
| **Returning visitor** | Up to three finds on the spikes; the drawer as they left it, with changes (ice gone, the seed up); once types become possible |
| **Two browser tabs** | The `storage` event, through `keep()`; one outing shows in both |
| **On the Desk** | Urchi is never there. A carried find goes into the pocket at once and never hangs under the pointer; the pocket opens the drawer; nothing is set down (2.6, 2.8) |
| **`?still`** | No outing starts, the rummage's searching turns stop, and carried finds do not swing, so screenshots stay stable (the house rule for every new random process) |
| **Private mode** | Everything works for the page's life. Nothing is promised past it, and nothing says so |
| **Zoomed when it leaves** | The depth is computed against the zoom, so the far figure is the same size whatever the zoom; zooming while it is out works (it is still "floating") |
| **Window resized mid-outing** | The far point is stored as shares of the room |
| **Screen reader** | Live lines in the existing region (:882): "Urchi has swum off to look for something." / "Urchi is back. It is holding a bolt." / "Urchi came back with nothing." / "You are carrying the bolt." / "Urchi is keeping it." / "The bolt is in the drawer." The control's name follows the state: "Call Urchi back", "Take the bolt from Urchi", "Ask Urchi what it is hiding", "Ask Urchi for the mote" |
| **Debug (development only)** | `?outing=now` sends it at once; `?find=<code>` shows that find presented; `/dev/finds` (left out of production like `/dev/suit`) shows a grid of sixty-four seeds (`?cat=`, `?tier=`, `?seed=`, `?turn=`), and the checks that were `?check=1` (100k draws with tier odds within 1%, and code round-trips) are Vitest golden tests beside `make.ts` and `code.ts`, with scripts under `tsx` (*ruled in the summary: one runner*); `__outing` is exposed on the stage element beside `__float` (:284) |

#### 2.16 Implementation sketch

**New:**
- `src/content/finds.ts`: types, captions, repeats, labels (2.4-2.5).
- `src/engine/finds/`:
  - `code.ts`: encode, decode, check.
  - `make.ts`: `findOf`, the pick, pity.
  - `shape.ts`: the ported hull and polygons, and the recipes.
  - `paint.ts`: the Canvas 2D painter, ramps, rim, glint, and the JS Bayer.
  - `store.ts`: `eigengrau:finds`, on `keep()` from `src/lib/store.ts`.
  - `context.ts`: `snapshot()`, reading the clock, sky variant, song and hue bin, weekday, days and colourway.
  - `FindSprite.ts`.
  - Only relative imports inside this folder, so `/dev/finds` can load it without aliases. *With Vitest as the one runner the alias works everywhere, so this is discipline, not necessity (summary, "Test runner"); the pure modules still import `random.ts` and `day.ts` from `src/lib/`.*
  - `make.test.ts` and `code.test.ts` (Vitest): the golden draws and round-trips (2.15, Debug).
- `src/engine/space/Outing.ts`:

  ```ts
  export class Outing {
    phase: "idle" | "asking" | "leaving" | "out" | "found" | "back" | "present" | "offer" = "idle";
    constructor(o: { room: RoomScene; float: Float; tether: Tether; att: Attention; faces: Faces; call: Call; sky: Sky;
                     store: FindStore; reducedMotion: boolean; say(t: string, l: string): void; live(s: string): void });
    frame(dt: number): void;      // room.onFrame: eligibility, the drive, the twitch, the return
    hit(x: number, y: number): "far" | "find" | null; // checked before room.urchiHit in onDown/onUp
    callBack(): void;             // the far figure clicked, or Enter
    take(): Find | null;          // the offered find clicked
    ask(): void;                  // hidden and keeps
    resume(): void;               // mount or tab return: rebuild from store.out by wall time
    dispose(): void;
  }
  ```

- `src/engine/space/glint.ts`: the arm GLSL, shared with `Stars.ts`.
- `src/engine/space/Sketch.ts`: line-drawn finds, using `Marks`' geometry.
- `src/components/chrome/{Pocket,Carried,Drawer}.tsx`.
- `src/app/f/[code]/page.tsx`; `src/app/dev/finds/page.tsx`.
- Shared, from the summary's foundations (built once, before finds): `src/lib/random.ts` (`hashSeed`, `subSeed`, `rng`, `seeded`), `src/lib/day.ts` (`today()`), `src/lib/store.ts` (`keep()`), `src/lib/keys.ts`, `src/lib/routes.ts` (`pillOf`), `src/lib/count.ts` (`find_taken`), and `src/engine/urchi/memory.ts` (`eigengrau:urchi`: trust and the seed).

**Changed:**
- `RoomScene.ts`: public `figureDepth = 1`, multiplied into `floatUnit` (:270), `urchi.zoom` (:483) and `cellFor` (:481); new `onHead(mx, my)` for the pose at home.
- `Float.ts`:
  - `drive(p | null)` and `out` (not `busy`)
  - `free` (the `swimStep` expression, :766)
  - `lengthExtra` added to `length` (:313)
  - the far figure's click routed to `Outing.callBack`
- `Tether.ts`: `twitch(strength)`; a width taper in `Ribbon.draw` (:101); the pixelated split (far half to `Cells`).
- `attention.ts`: `TargetKind` gains `"far" | "find" | "carried"` (and, in v1.5, Urchi §15's `"shot"`, which the shared `witness` act already brings; the finds add no `"shooting"` kind of their own), with `FLOOR` entries (:70) `far: 0.7, find: 0.5, carried: 0.4`; a public `bored` getter.
- `acts.ts`: `setOff`, `present(handover)`, `hide`, `keep`, `giveKept`, `wary`, `revere`, `puzzle`, `emptyHanded`, `stow`, written like the others (a generator, with a `finally` that puts back whatever it changed).
- `limbs.ts`:
  - quirks `offer`, `behind`, `stow`, `cradle`, `armsLength`, `compare`, each checked on the rig at `/dev/suit?view=quirks&only=offer,stow`, as the others were
  - `swim(phase, hold?)`
- `character.ts`: export `LIGHT` (hoisted) and `SUIT_COLOUR`; new `handAt(side)`.
- `Faces.ts`: `Reaction` gains `"pleased"` (the `happy` face, hold 1.2 s, again 10 s; no notes rising, and never from a hidden mood, as the summary rules).
- `site.ts`:
  - `UrchiReaction` gains `"wink" | "doubleBlink"`
  - set `TIME_ZONE = "Australia/Melbourne"` and add `HEMISPHERE = "south"` (decided)
  - a new `URCHI_LINES` entry once this ships: "It brings things back. Mostly bolts." (36 characters, reaction `glanceAway`)
- `Call.ts`: `expect(gaps, onMatch)`, and one line in the trust path that raises persistent trust in `eigengrau:urchi` (its header, `Call.ts:14`, is rewritten to match, as decided).
- `CreativeSpacePanel.tsx` (*ruled in the summary: `src/engine/space/Space.ts` is extracted from this panel's effect first, in week 3, so the effect-side items below land in `Space.ts`, and only `RANK`, `SAID` and the React state stay in the panel*):
  - the `find` slot in `RANK` (:113)
  - `urchiWord` and `controlName` (:219), which check the outing first
  - hit-testing the find, the far figure and the spikes before Urchi in `onDown`/`onUp` (about :622, :664)
  - `outing.resume()` in `begin` and in `onVisibility`
  - `?find=`
  - the new `SAID` lines
- `AboutScene.ts`: the full stop.
- `sfx.ts`: `find(kind)`; phase 2 synths.
- `Shell.tsx`: mount `Pocket`, `Carried`, `Drawer` (:197-200); `Pocket` takes `SoundChip`'s place at :199 once Style R4 moves the chip into `Nav.tsx`.
- `globals.css`: `.pocket-chip`.
- `README.md`: a sentence in the Space row, and `eigengrau:finds` in the storage list (:106-113).
- `/kept`: `eigengrau:finds` and what it holds, and the `find_taken` event exactly as sent.

#### 2.17 Build plan

**Phase 1: "It went and got something"** (about six working days)

*Scheduled in the summary: the foundations (`random.ts`, `day.ts`, `store.ts`, `keys.ts`, `pillOf`) land in week 2, `Space.ts` is extracted in week 3, the spine (the outing, the bolt, carrying, About's full stop) lands in week 4 (19-25 October), and phase 2 begins in week 6 (2-8 November). Finds depend on Urchi's package one and the foundations (priorities 8 and 12).*

| Day | Work | Done when |
|---|---|---|
| 1 | `finds.ts` (ten phase-1 types), `code.ts`, `make.ts`, `shape.ts`, `paint.ts`; `/dev/finds` | Sixty-four seeds look like one family, with the helmet's facets and Urchi's rim; each paint ≤ 0.3 ms; the Vitest golden tests pass (tier odds within 1% over 100k draws, code round-trips) |
| 2 | `store.ts`, `context.ts`; `figureDepth`, `Float.drive`, `out`, `lengthExtra`; `Tether` twitch, taper and split | Playwright with `?outing=now`: shots at depths 1, 0.3 and 0.08 show it smaller, pixelated, and the line tapering to it; zoom still works while it is out |
| 3 | `Outing.ts` (asking, leaving, out, found, back; resume by wall time; call back); `setOff`; the one-armed stroke; the glint | A reload mid-outing resumes; a tab return shows "caught" |
| 4 | `FindSprite` with the dither from the hand; the handovers proud, sincere, hidden, keeps (with the trade), wary and empty; quirks `offer`, `behind`, `stow`, `armsLength`, `cradle`; `pleased`, `wink`; the caption slot, cursor words and control names | Each handover plays for each phase-1 type; reduced motion shows the find before the glove |
| 5 | `Carried.tsx`, `Pocket.tsx`, `Drawer.tsx`; About's full stop; spikes (placed and pending) | Carry a find from Space to About with "6", set it down, and it is still there after a reload; on the Desk it goes straight into the pocket |
| 6 | Phone paths, the sound mapping, the night rules, the live lines; `find_taken`; lint, typecheck, screenshots of every state on desktop and phone (390 px and 320 px); the README row and `/kept`'s line; one Notes log line ("Urchi goes out now, if you leave it alone.") | Every row of 2.15 is checked |

**Phase 2: the rest of the loop** (about four days):
- the reverent, puzzled and asleep handovers
- the rest of the catalogue (#11-58)
- repeats
- gifts (`/f/`)
- trust wiring into `Call`, and the finds' events into `eigengrau:urchi`
- things that change
- 404 and Notes places
- B's synth cues

**Effort:** phase 1 is **L-** (six days) and phase 2 is **M** (four days), about two weeks in all.

**What it shows about Darius:**
- **Character direction.** Nine temperaments from existing hooks (lids, pupils, tilts, the owl's bob, quirks) without a single new face.
- **Writing.** Sixty captions, repeats and labels in one consistent voice, which "Basic Human" undersells.
- **Systems restraint.** Seeded, deterministic items with no server and no counters on screen (the one cookieless event, `find_taken`, is disclosed on `/kept`), and a reward that is a performance rather than a stat.
- **Craft continuity.** One light, one rim, one dither and one glint shared by the head, the suit, the sky and now the finds.
- **Accessibility as design.** Every beat has a reduced-motion form, a keyboard path and a spoken line.
- **Curiosity.** He knows what a pallasite is.

**Risks, and what keeps them small:**
1. **It becomes a loot box.** Rules 2, 3 and 7 prevent it: rarity is acted, nothing counts down, and some outings bring nothing.
2. **Few visitors ever see it.** It needs Urchi afloat and left alone. The short first outing, the spikes visible at home, and gift links travelling soften this. It is also exactly "for people who notice".
3. **Urchi leaves the centre of attention for a minute.** The line and the speck keep it present, and it only happens after you have been still.
4. **Scope creep in the catalogue.** Phase 1 ships ten types. The rest is content.
5. **Something following the pointer can annoy.** It is small (at most 40 px), it lifts over links, it goes to the pocket after 6 s still, and nothing is ever carried by default.
6. **Performance on phones.** One sprite, paints only on change, and code loaded on demand.
7. **Copy fatigue.** The repeats, rotating captions, and later `npm run leave` (8).

---

### 3. v1.5: The lines you snapped (from B; S-M, two days)

**Pitch.** Every line you have ever snapped is still out there, and Urchi finds them.

**How it works.**
1. When the line snaps (`Float.snap`, `Float.ts:571`, and the reduced-motion send-home at :383, which snaps it too), record `{ at, thrown }` (`this.thrown`) in `store.snaps`, twelve at most.
2. From the second day after a snap, an outing can bring one back (origin `snapped`), at most one a day, and never as the day's first find. It is drawn as a short piece of the line itself, in `LINE_LOOK`'s ink and width, lying in its glove in a loose S (`lobe`, `Tether.ts:34`).
3. **Caption:** "The line you snapped on 14 September." If it was sent home from the keyboard: "The line from 14 September." The handover is sincere, with a long blink.
4. **The knot.** The next time you take Urchi with you after it has found one, it floats in with the old line tied on.
   - The tether shows a knot: a 3-device-px ink bead at 70% of the way from the root.
   - The line's reach grows by 3% (`REACH.wide` 0.6 → 0.618, `Float.ts:48`), up to three knots and +9%.
   - On the first float-in with a new knot: **"It tied the old line on. It reaches further."**
5. **Snapped again**, a knotted line breaks at a knot rather than at the clip (a new `Tether.snap(at)` parameter). Caption on the way home: **"It broke at the knot."** The knot drifts off, to be found again one day.

**Look, sound, copy.** Line-drawn, with no rim. Sound: `sfx.tug(0.2)`, the line's own note (D2). Drawer label:
- "A piece of line."
- "Rope, the site's own."
- "Found by Urchi at 17:22, 3 October, out on its line. Its eyes were whale."
- *"You threw it too hard on 14 September. It went and got it."*

**Where.** Space afloat; the drawer.

**Data.** `snaps`, `knots` (0-3).

**Implementation:**
- one write in `Float.snap`
- a `knots` option on `Tether` (a bead in the ribbon and, when pixelated, in the cells)
- `Float.length` × (1 + 0.03 × knots)
- the snap point moved to the knot

**Edge cases.**
- Under reduced motion there is no fling, but send-home still snaps and is recorded, so those visitors get the story too.
- Phone: the same.
- At night it does not go out.
- Private mode keeps no snaps.

**Shows:** consequence and memory. The site remembers what you did to it and answers with care rather than a penalty.

**Risks:** it could reward throwing. It does not: a snap is remembered, never scored, knots stop at three, and trust dips by Urchi §12.1's 0.1 per line snapped, in the one value in `eigengrau:urchi`.

### 4. v1.5: The star that fell (from B's landing and A's fallen star; S-M, two to three days)

**Pitch.** On the rare nights a star crosses its sky, Urchi follows it with its whole head, looks where it came down, and goes there next.

*Ruled in the summary (reconciliation 7): there is one crossing event and one `witness` act, Urchi §15's ("It saw it too"), with that section's habituation; the sky calendar's meteor showers use the same event. This section adds only the landing and the outing to it. Step 1 below is therefore §15's, not a second follower.*

**How it works.**
1. **Following it** (useful on its own, S). `Stars.shoot()` (`Stars.ts:429`) already computes the head's path into `uShootB`. The first draft added a getter, `shootingAt(): Point | null`, and a `TargetKind` `"shooting"` with a high floor (0.9). Instead it is Urchi §15's new `Stars.onShot(cb)` (start, heading, duration) with `Sky.clientOf(x, y, layer)`, and §15's `witness` act (kind `"shot"`) turns its whole head to follow the star across the sky, afloat (the sky is only there afloat). Its repeats are §15's: the first star in a visit gets the whole scene, the second and third a turn and a look to you, and after that a look only if it is already facing that way.
2. **Where it came down.** When the star leaves the frame, Urchi looks at the spot a beat longer (1.2 s). A new `sky/Landing.ts` layer (one point; the sparkle's arm in the suit's `accent` amber; fading over the visit) marks it. **Caption, once:** "Where it came down. It is still warm."
3. **Going there.** Its next outing's far point is the landing. It brings back **"A piece of a shooting star. Still warm."** with the reverent handover. Its breath slows, its blinks lengthen, and if you leave it be, it dozes off holding it.
4. **The ember cools** from amber to rock over twenty minutes in the drawer. The next visit: "Cold now. It was warm on 29 September."
5. **Sound** (on): the room goes quiet for four seconds (`sfx.air`, saved and restored as in 2.10). Then the glow.

**Conditions.** A star must actually cross: this uses the shared `onShot` event from `Stars`, not `sky.variant`. **Reduced motion:** no star is drawn, so none of this happens. That is honest, and it is the one place a reduced-motion visitor misses something, because nothing crossed their sky.

**Implementation:**
- `Stars.onShot` and `Sky.clientOf`, built once for Urchi §15 (the finds only subscribe)
- the widened sky types (`SkyLayers`, `Sky.add`, `Sky.ts:12`, :189)
- `Landing.ts` with defaults in `sky/defaults.ts`, which then appears in `?debug=1` for free
- `Outing` takes a far point override

**Shows:** a character whose attention is driven by the world, not by a script.

**Risks:** with shooting stars every 16-32 s (`STARS.shooting.every`), and every 5-11 s on meteor-shower nights (the sky calendar, Strategy §10), following each one could become a tic. §15's habituation keeps it from one (the first draft's own limit was one a minute), and only the first star of a visit lands.

### 5. v2: The real work drifts past (relics and wreck days, from A's Salvage and relics and B's wrecks and 5.6; L)

**Pitch.** Twice a week one of his finished projects drifts through the sky as a small wreck. Urchi goes out to it and brings back pieces labelled in his own words, and the pieces send you to the case page.

**Designed for the real GitHub projects he is importing now.** *That branch has since merged (`0d9641d`, decisions fact 1) with four public projects and their covers.* The import should write these fields per project into `site.ts`. *Decided: the daily sync (new `scripts/sync-github.mjs`, week 3) writes them, for public repositories only, into new `src/content/github.json`, not `site.ts`; private repositories appear only as closed marks and are never named, so they never drift out here (decisions, item 5 and Space finds 4):*
- `repo`
- `language`
- `archived`
- `pushedAt`
- `release?`
- `lastCommit: { date, message }`
- `cover?`

Status then follows from the data (for wreck days only; it does not replace the hand-set status word, and VECTOR, NextBranch and Atelier read "shipped" on `main` without meeting this rule):
- archived → `dead`
- no push in six months and a release → `shipped`
- no push in six months and no release → `paused`
- otherwise `alive`

**Alive work is never found out here.** Only dead, shipped and paused work drifts. Paused work drifts nearer, with one amber light blinking.

**Decided: wreck days are parked until the rule is met.** They begin when the first public repository is archived, or has had no push for six months and has a release (decisions, Space finds 4). All fifteen repositories were created in 2026, none is archived, and VECTOR is live and in use, so none qualifies today. When one does, the sync prints its name and the L-sized build is scheduled then. After that, paused work may drift too. This changes the day he archives a repository.

**How it works.**
1. **The day.** Wreck days are two days a week, chosen by `hashSeed(isoWeek)` in his zone. They are the same for every visitor, so the world is shared and needs no server. The wreck is one finished project, chosen by the same seed. The first draft filled the gap with a fictional derelict from A's four starter archetypes (a weather satellite, a tool bag after the one lost from the ISS in 2008, a solar array and a capsule hatch, each with a name plate like `KESTREL-4, 1987`). *Decided: there are no fictional derelicts; with no finished work there are no wreck days (above).* The day comes from `hashSeed` in `src/lib/random.ts` and the ISO week from `day.ts`, in his zone.
2. **The pass** (a new `sky/Wreck.ts` SkyLayer, uniforms only per frame).
   - While you are afloat, it comes in from depth at the right, small and pixelated (the layer finally reads `pixelSize`, `layer.ts:23`).
   - It grows to the room's plane in the right-middle third, within the line's reach (60% of the width, 85% on a phone), slows for about three minutes, then recedes.
   - The cycle is twelve minutes, while this visitor has pieces left today.
   - A project wreck is a 6-10 facet hull painted by `paint.ts`, its colour from the cover's tone (`toneOf`) or, failing that, its language colour capped at chroma 0.06.
3. **Caption on first sight each day** (the `news` slot rules): **"Halo, shipped 2021. It is passing today."** A fictional wreck would have read "KESTREL-4, 1987. It comes by today.", and is cut (above). Nothing more. *Halo, here and below, is one of the placeholder projects at `9b8c07c` (`site.ts:144`), kept as the worked example; a real wreck will be a public repository that meets the rule.*
4. **Urchi notices.** A new target kind `"wreck"` (weight 1.2) spikes as it arrives: a startle (`STARTLE`), eyes wide. Afloat, it points (`reachFor`).
5. **Getting there.** On a wreck day, an outing's far point is the wreck's anchor. **Or help it** (A's one active verb): hold it and fling it at the wreck.
   - A release heading within 25° of the wreck, faster than 0.3 of the snap speed (`Float.release`, :443), is aimed.
   - Within 0.4 of its height it **catches hold**: the `brace` quirk, then it rides the anchor, like `hold` but with a moving target.
   - A miss is just a fling. Nobody fails loudly.
6. **Prising.** 6-10 s of the `tap` quirk aimed at the surface (`reachFor` the anchor), with small metallic ticks on sound. The piece comes off with a jolt (`jolt(att, 0.4)`), and it pushes off. If the wreck drifts out of reach while it holds on, the line pulls it off (`linePull`, `Float.ts:982`): **"It let go."**
7. **Relics.** A piece is a thin plate, the only photograph on Space: the piece's image from `SPACE_ITEMS` (`site.ts:273`, the ones with `project: slug`) or the cover, lit flat by the same light, with a rim. Its edge is in the cover's tone. If there is no image, it is ink-grey with the title engraved.
   - **Caption:** "A piece of {title}. {statusWord}." (`statusWord`, `site.ts:185`), for example "A piece of Halo. Shipped 2021." A title over 24 characters gives "A piece of something I made."
   - **The handover is reverent.**
   - **The drawer label is his own case-page lines** (`description`, three lines), then the last commit in grotesk, then a **Case** link:

   ```
   Halo, arcs.
   Web design. A piece of Halo, shipped 2021.
   Found by Urchi at 20:40, 5 October, at the wreck of Halo. Its eyes were pool.
   The arc language of the Halo site.
   Every section is a quarter turn
   of the same circle.
   Last commit, 3 March 2024: "fix the thing, finally".
   Case
   ```

8. **Limits and sets.** Two pieces per pass and three per day. Three pieces of the same project, from any of its days, assemble in the drawer: they slide together with a soft tick and one ring. **"Most of Halo."** The case page then gets a quiet local line (a tiny client component reading the store): **"You brought a piece of this back, 5 October."**

**Edge cases.**
- **Reduced motion:** the wreck sits still at the room's plane in the right third all day, with no pass. Urchi dithers to it and back. Prising is a timed pause with its eyes on the wreck. There is no fling (a drag moves without one already).
- **Phone:** the wreck sits nearer the middle.
- **Night:** it passes, and Urchi sleeps. It goes by and nobody takes anything.
- **Returning:** a pending find can be a piece of a wreck you missed. "It went out to it without you."

**Effort:** L (one to two weeks: the layer, the hull, the fling assist, the plates and the sets).

**Shows:** the portfolio doing its work through the toy. His dead projects get an afterlife that is honest and rare in portfolios. It is also a shared world from a date seed, with no server.

**Risks:**
- A second large object in a quiet sky: it is small, slow and absent five days in seven.
- The fling becoming the game: it also goes alone.
- Competing with Projects: a relic always links out.

### 6. v2: A letter, in seven pieces (from B; M, two to three days)

**Pitch.** Torn strips of paper, each with one line in serif, add up to a letter he left for whoever finds it. It is dated the day you first came.

**The letter** (his to rewrite at any time in `finds.ts`; *decided: it ships as written here, and his rewrite replaces it without code*):

> Whoever finds this: it found you first.
> It will bring you things. Mostly bolts.
> It does not know what anything is worth,
> and it has never been wrong about that.
> Keep what it gives you. Give some back.
> It keeps the place while I am out.
> D.

Line six is his existing `URCHI_LINES` line (`site.ts:59`), so a visitor who has hovered Urchi recognises it.

**How it works.**
1. Pieces come from outings, at most one a day, only after a browser's third find, and never two story pieces in a row.
2. Each piece is a thin paper strip with a torn edge. At 1.5× zoom or more you can read its line on the strip in Space itself, which rewards zooming in.
3. In the drawer the letter has its own long compartment, which does not count against the twelve.
   - Found lines are set in Serif 400.
   - Missing lines are **hairlines drawn to the length of the missing line**. This is the device Notes uses for filtered-out notes ("hairlines as long as they were", `NotesPanel.tsx:685-692`), so the gaps show how much is missing.
4. When all seven are found, the compartment opens up, and **the date appears at the top right** like a letter's date: `store.first`, your first visit. Nothing says it is your first visit's date. Some people will notice.

**Caption:** "Part of a letter. It has read it twice." The handover is reverent. Sound: the rustle.

**Carried** to Notes, a strip sits in the column like one of his notes, dated the day it was found.

**Edge cases.**
- A phone gets the same compartment at full width.
- Reduced motion: the letter appears whole, with no opening.
- Private mode starts it again, which is fine.

**Shows:** writing, and a portfolio that talks to a returning visitor as a person.

**Risks:** sentimentality. "Mostly bolts." keeps it dry.

### 7. v2: The geode (from A's Survey, which is otherwise cut; S)

**Pitch.** Some rare finds come back as a plain rough stone that will not open yet.

- **Caption:** "A geode. It will not open yet." (30). The handover is puzzled, and it knocks on it with the `tap` quirk.
- **Knocking.** In the drawer, each tap knocks once, on at most one day each. A hairline crack decal is added, with the rock knock.
- **Opening.** The third knock, on a third day, splits it along a seeded plane: two hulls cut by the plane, with a crystal cluster inside (a small hull of prisms). The find inside is named then.
- **Label:** "Knocked on 3, 5 and 9 October."

**Data:** `geodes[code] = { knocks, last }`.

**Shows:** delayed reward done kindly.

**Risks:** none worth the name.

### 8. v2: Things he leaves out there (from B; S, one day)

- A new `npm run leave` (`scripts/leave-find.mjs`, modelled on `scripts/add-note.mjs`) lets him leave a find himself. He chooses a recipe (a stub, a card, a key, a stone), writes a caption (≤ 48 characters, first person) and gives a date. It writes to a `LEFT` list in `finds.ts`.
- After that date, any visitor's outing has one chance in four of bringing it back, once per browser.
- **Caption:** "A ticket stub. I left it out here." Label provenance: "Left out here by him on 3 October."
- Finds become a second, lighter channel for his life next to Notes, and the site stays alive between projects.
- **The burrito** (#58) is the first of these, keyed to his real note of 28 September.
- *Decided: `npm run leave` is built and optional, and nothing waits on it (decisions, Space finds 2).*

### 9. v3 and later

- **The probe that is still listening** (B), M.
  - **The pieces**, one a day at most, in any order:
    - dish: "Part of a probe. It is still listening."
    - boom: "An arm off something. It waved it at you."
    - panel: "A solar panel. It holds it up to the stars."
    - lens: "A lens. It has been watching you through it."
    - cell: "A cell, flat. It gave it a shake."
    - the gold disc: "A gold disc, with grooves. It is listening."
  - **The drawer** shows the whole probe as a dashed hairline outline, with found pieces placed in it: "The rest is drawn from the pieces."
  - **Assembled**, it builds outward from the dish, as the suit grows from the neck (`SUIT_BUILD`). An amber light blinks five beats with gaps of 600, 200, 200 and 600 ms: D, dot, T. It is the monogram as a rhythm, with the counter's chime heard very small, the last beat on the A. Label: "It has been saying the same five beats since before the site."
  - **The payoff:** tap those five beats to Urchi at home. `Call` checks a new `PROBE_GAPS` before answering, and instead of blinking them back, Urchi looks up at the monogram and **the dot in "D . T" blinks once** (a 120 ms opacity dip on the middle character in `FloatingLogo`). "It knows that one."
  - **At night** the probe still blinks in the drawer, but asleep, Urchi only murmurs (`murmur`, `acts.ts:482`).
  - **Plant a hint in Notes** one day, or only its author will ever solve it.
- **The drift and the moon** (B), S-M. These are far-zoom layers revealed by `stage`:
  - **The drift**, after the third find: a faint ring of one-pixel debris, levels 5-10 above eigengrau, turning once an hour, closing into an ellipse at `ZOOM.min`. "Out past the line, the things it brings back." Rubbish, rocks and ice then come "from the drift".
  - **The moon**, two weeks after the first find: a 42-vertex icosphere in its real phase where he lives. He lives in Melbourne (`HEMISPHERE = "south"`), so the disc is drawn as the southern sky shows it: mirrored left to right from the northern view, lit on the left while it waxes. The age is ((now − 2000-01-06 18:14 UTC) / 86 400 000) mod 29.530588853 days; the lit fraction is (1 − cos(2π · age / 29.53)) / 2. Captions: "The moon, as it is where he is.", "The moon is full where he is." It brings "Moon dust. It has been blinking since." (`doubleBlink`).
  - At his night the drift is 30% fainter and the moon brighter. Under reduced motion both are still.
- **Let go, and it becomes a star** (A). `sky/Kept.ts` places a faint named star for each let-go find at a seeded place. Hover it: "Quartz, smoky. Let go 3 October."
- **Projects and Music places** (2.8).
- **Painting finds into Urchi's own canvas** (A), so fingers wrap round them. This touches `character.ts`'s painter, which the standalone `urchi/index.html` mirrors.
- **Stars in front of a far Urchi** (A): split `Stars` into two draws so the near band can pass in front of the speck.

### 10. Handed to other areas

- **To "Urchi feels alive": its own constellations** (B 11A, M, three to four days). The spec is intact:
  - **When.** Afloat, awake, left alone and bored (`boredFor`), at most once a visit.
  - **The figure.** It picks four to seven bright stars near each other from `Stars`' laid-out array (`Star`, `Stars.ts:217`, via a new getter).
  - **Drawing.** It looks from star to star in saccades 400-700 ms apart: the same system that reads captions (`read()` jumps across words every 200-260 ms, `acts.ts:101`), slowed down as if deciding. A thin ink line (`LINE_LOOK` at 35%) draws itself from the last star to the new one as its gaze lands, over 150 ms per segment, with a tick (the Projects tick at `rate` 1.2) for each.
  - **Done.** It looks at the whole figure, slow-blinks, then looks at you.
  - **Naming.** If the figure's shape matches a find in your drawer (the find's silhouette hull snapped to the nearest stars), the caption is "The Bolt. Its own." Otherwise it names it from the site's words: "Two Eyes. It drew itself.", "The Burrito. It was free.", "Nocturne, in stars." Names from notes come only from notes tagged `random`, `music` or `site`.
  - **After.** The lines fade over a minute, or stay faint at far zoom for the visit. The drawer gets a label with no object: "The Bolt, in stars. Drawn by Urchi on 29 September." It is shareable as `/?sky=<seed>&v=1&drawn=<figure>`. *Decided: skies are frozen as version one (`sky/versions.ts`) before the first shared link, and a shared sky link carries its version (decisions, Tools 3).*
  - **Implementation:** a new `sky/Lines.ts` layer and a `joinStars` act.
  - **Edge cases:** a phone uses figures of four. Under reduced motion the pupils jump and the lines appear whole. It does not draw asleep.
  - **Risk:** scribbles. Prefer shapes the eye completes: triangles, a kite.
- **To the cybersecurity area:**
  - **"A tag, the letters shifted. I would know."** (#51). A very rare find whose tag carries one of his lines under a Vigenère shift keyed to the colourway name at the moment it was found (the label shows that name, so the key is on the label for anyone who reads carefully). In the drawer: "Copy the letters". *Ruled in the summary (reconciliation 1): it stays a find, and there is no cipher tool in Tools. Once Plaintext exists (from Monday 7 December, as decided), the label also links to that week's Thursday strips, the Vigenère day, at its path `/today/plaintext/<n>`. Plaintext is the one cipher game.*
  - **The gift checksum and "A forgery. It can tell."** (2.9). The honest version, integrity and not authenticity, is itself a small demonstration of knowing the difference. A signed version would need a secret the browser cannot hold, which means a server, which this design refuses on purpose. *Decided: it stays a quiet check. No Phosphenes light, game or paper invites anyone to forge a code, because security on this site is defensive only.*

---

### Decisions

*The owner is asked nothing. The five questions this section first put to him are decided in `decisions.md` ("By section", Space finds 1-5); what else it depended on is decided there under "The eight". Each line gives the decision and its reason, and, where one exists, what would change it.*

1. **How much colour.** Gems reach at most OKLab chroma 0.12, on lit facets only, and stay ink-glass in shadow; gold keeps to the same cap, and the eye-matching gem (#11) stays. *Why:* colour only where light falls keeps "colour comes from something". *Changes if:* at 10% zoom, dithered and pixelated, a 0.12 gem reads as an interface accent; then 0.09. New `GEM_CHROMA = 0.12` (decisions, Space finds 1).
2. **The words.** They ship as written here: the captions and repeats, the once list (#53-57), the letter (§6) and the burrito (#58). The capsule (#38) carries one of his five `URCHI_LINES` not shown this visit until new `CAPSULE_LINES` has his own; the USB stick's "first project" is the public project with the earliest `start`; `npm run leave` is optional. *Why:* his hours go to `WORK_LINE`, the `why`/`did` lines and notes, and these lines are already in the voice. *Changes if:* he writes his own, which replace these without code (decisions, Space finds 2).
3. **Gifts.** They are copies: "It is a copy. Most gifts are." Forgery detection stays a quiet check, and nothing invites anyone to try it. *Why:* copies travel better, and security here is defensive only. New `GIFT = "copy"` in `finds.ts` (decisions, Space finds 3).
4. **The GitHub import, and wrecks.** The sync (week 3) writes `archived`, `pushedAt`, `release`, `language` and `lastCommit` for public repositories only, into `src/content/github.json`; the four covers already exist. Wreck days stay parked until a public repository is archived, or has had no push for six months and has a release, and there are no fictional derelicts meanwhile. *Why:* none of the fifteen qualifies today (all were created in 2026, and VECTOR is live), and private repositories are never named. *Changes if:* he archives a repository (decisions, Space finds 4; item 5).
5. **Pacing.** As designed: three outings a day (two on Sundays), the first always fruitful, one in three empty after that. *Why:* there are no counts yet to tune against. It is revisited on Monday 23 November after four weeks of `find_taken`; if almost nothing is taken after a browser's first find, the second outing comes sooner, and the rates never go up (decisions, Space finds 5).
6. **Where he is.** `TIME_ZONE = "Australia/Melbourne"`, `HEMISPHERE = "south"`: his night, his day for the outing count and the code's day, and the moon as the southern sky shows it. *Why:* his commits carry +10:00 and his public coursework is a Swinburne unit. *Changes if:* he moves city (decisions, item 1).
7. **Trust and memory.** One trust and one seed, in `eigengrau:urchi` with Urchi §12.1's model; the finds feed it and derive their salt from it. The night's first wake is groggy, not a glare. *Why:* the summary's reconciliation 5, and a stranger's first touch at 01:00 should not be told off (decisions, item 6).
8. **Counts.** One named event, `find_taken { tier }`, through Umami, cookieless and proxied same-origin, disclosed on `/kept`; no number ever reaches the screen. *Why:* it is the only way to know whether anyone waits long enough to see an outing (decisions, item 7).
9. **The Desk.** Pill three (Space 1, Projects 2, Desk 3, Notes 4, Music 5, About 6): About's key is 6; on the Desk a carried find goes into the pocket at once; Urchi never comes there, and the key (#48) looks for a lock in every pill but the Desk's. *Why:* renumbering is free only until the digits work (decisions, item 4).
10. **The pocket.** Top right on every screen, once the sound chip moves into the nav. *Why:* the summary's ruling on "The pocket's place", which removes the desktop and phone split.

### If you only do one thing here

Build phase 1's spine and nothing else:
- Afloat and left alone, Urchi looks off into the corner, bobs to judge the distance and looks at you as if asking. Then it swims away into the sky on a paying-out line, shrinking into the room's own pixelation until it is a speck.
- The line twitches twice and a glint catches at its glove.
- It swims home one-armed, holding the thing to its chest, and holds up **a bolt** as though it were a crown, while the caption says "A bolt. It thinks it is gold."
- You take it. It hangs on a short thread under your pointer, and you carry it to About, where it becomes the full stop after "the small things".

That is `Outing.ts`, `figureDepth`, `Float.drive`, `Tether.twitch`, `setOff`, the proud handover, one type in `finds.ts`, the painter, `FindSprite`, `Carried.tsx` and About's stop: about three to four days. It proves every hard part (depth, the line, the glove anchor, the painter, carrying across mounted tabs) on the single find with the most character. Every later type, handover and story is then content poured into a mould that already works.

*Scheduled in the summary for week 4 (19-25 October), after Urchi's package one (week 2) and the extraction of `Space.ts` (week 3), and before the launch gate in the week of 23 November, which needs "the finds spine live".*
