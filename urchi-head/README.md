# Urchi's head (portable)

Just the head, lifted out of the Eigengrau site: every head movement, the blinks, the pupils, and the
random eye colourway. **Left out on purpose:** the spacesuit and limbs, the angry and happy faces, and
everything that reacts to music (the sound-on startle, the listening sway/drift mode, the happy-eyes + notes).

## Files

| File | What it is |
|---|---|
| `character.ts` | The head itself. `createUrchi()` returns a character that paints into a `<canvas>`. No dependencies. |
| `mesh.json` | The baked head mesh (84 vertices, 164 triangles, eye placement). Must sit beside `character.ts`. |
| `Urchi.ts` | Optional three.js host: puts the canvas on a plane, handles resolution, rim, dither/fade in and out. Needs `three` and `gsap`. |
| `moods.ts` | Optional sleep / wake / doze / startle / peek, with the site's own timings. No dependencies. |
| `demo/` | `index.html` (bare canvas, a button for every move) and `three.html` (three.js plane). |

Copy the folder into the other project; `tsconfig` needs `"resolveJsonModule": true`. Use `character.ts`
alone for a plain canvas, add `Urchi.ts` for three.js.

## Use

```ts
// plain canvas
import { createUrchi } from "./urchi-head/character";
const urchi = createUrchi({ smooth: true });
urchi.setResolution(720);                 // smooth: canvas width in pixels (follow the size you show it at)
urchi.openEyes(0.6);                      // it starts with eyes open; closeEyes() first for a waking intro
document.body.appendChild(urchi.canvas);
let last = performance.now();
requestAnimationFrame(function tick(now) { urchi.update((now - last) / 1000); last = now; requestAnimationFrame(tick); });

// three.js
import { Urchi } from "./urchi-head/Urchi";
const u = new Urchi();
u.width = 500; u.pixelRatio = devicePixelRatio;   // box width in scene units
scene.add(u.mesh);                                // origin is the head's centre
renderer.setAnimationLoop(() => u.update(dt));    // dt in seconds. u.scaleIn(1.2) / u.fadeIn(1) / u.dither(0.5, 1)
```

`createUrchi` touches `window`/`document` (pointer follow, `matchMedia`), so it is client-side only: in
Next.js, import it from a `"use client"` module or inside an effect. Under `prefers-reduced-motion` the head
stays front, the breath still and the blinks off, until a host calls `attend()`, which brings back blinks and
pupil jumps (still no head movement). `createUrchi({ input: false })` stops it following the pointer.

## Eye colour

One colourway is drawn at random per page load from 100 (weights in the file), then shared by every Urchi on
the page. Iris fills the eye; each pupil has its own colour, so the odd-eyed band has two.

- `?col=denim` in the URL forces one by name (`marmalade`, `laser`, `pinball`, `neapolitan`...).
- `drawnColourway()` returns `{ name, iris, pupilLeft, pupilRight }` (null before any Urchi exists), for matching UI to its eyes.
- `document.documentElement.dataset.eyes` is set to the name, for CSS.

To pin one in code, edit `colourwayFor` in `character.ts`.

## Movements

**On its own** (nothing to call): follows the pointer (yaw ±41°, pitch +15°/−17.5°), eyes first and head about
80 ms later; breathes (4.29 s per breath, a 3.15° nod); curious tilts every 4–9 s (6–15° roll, never more than two
the same side in a row); pupil darts every 0.2–0.8 s with occasional dips; blinks 2.5–6 s apart (log-normal),
about one in five doubled.

**On cue**, all on the character:

| Call | Does |
|---|---|
| `blink()` / `doubleBlink()` / `slowBlink(hold?)` | One blink, two, a cat's slow one |
| `glance()` | Look away for 0.6 s, head and pupils |
| `lookAt(nx, ny, how?)` / `lookAt(null)` | Look at a point (-1..1, y down); `"snap"` or `"quick"`; null hands back to the pointer |
| `eyesTo(ex, ey)` / `eyesTo(null)` | Pupils only (reading) |
| `tiltToward(dir, degrees?)` | The curious tilt, now |
| `setTilts([min, max] \| null)` | Gap between random tilts, or none |
| `bob()` | An owl's bob: three side-to-side swings at 2 Hz |
| `sway(degrees, period?)` | A slow roll sway, 0 stops it |
| `stretch()` | Face tips up 9.5° and head rises, 1.2 s |
| `pose(yaw, pitch, roll, speed?)` / `kick(yaw, pitch, roll)` | Hold the head off its aim; jolt it |
| `deepBreath(inhale, exhale, depth)` | One big breath |
| `setBreathPeriod(s)` / `setBreathDepth(d)` / `pauseBreath(s)` | Pace, depth, freeze |
| `widen(amount, seconds)` / `dip()` | Eyes open wider; quick pupil flinch |
| `converge(0..1)` | Cross-eyed toward the nose |
| `fixate(true)` / `setDarts("dart" \| "drift" \| "still")` | Interest as stillness; how the pupils wander |
| `setRestLid(0..0.5)` / `setLids(left, right, seconds?)` | Drowsy lid; each eye's own lid (one eye can open alone) |
| `setBlinkGap(min, max)` / `setBlinkHold(s)` | Blink rhythm |
| `setFace("neutral" \| "embarrassed")` | Swaps in during a blink; embarrassed is the `><` chevrons |
| `closeEyes()` / `openEyes(seconds)` | Start shut, open with the blink's own curve |
| `setReveal(0..1)` | The intro: eyes alone first, then the head builds outward from them, then the rim |
| `attend()` | Marks a host as paying attention: turns get speed-by-distance, reduced motion keeps blinks and pupil jumps |
| `alphaAt(u, v)` | Hit test: is this canvas point on the head or rim |

Read-only: `face`, `breath` (-1..1), `shut` (0..1).

`moods.ts` sits on top of these: `dozeOff()`, `doze()`, `wake()`, `wakeGroggy()`, `stir(startled?)`, `startle(dir?)`,
`peek(eye)`. Call `moods.update(dt)` each frame.

## Query-string debug knobs

`?still` freezes breath and follow, `?look=0.6,-0.3` fixes the gaze, `?yaw=90&pitch=0` fixes the angles,
`?roll=12` fixes the tilt, `?blink=0.5` fixes the lids, `?ortho` turns perspective off.

## Not carried over

`attention.ts` (what it chooses to look at: tab pills, motes, boredom, the hours of the night), `acts.ts`
(scripted beats tied to the Space page), `hours.ts`, `limbs.ts` and the suit. They all drive the same
character API above, so any of them can be rebuilt on top of it for a new page.

The mesh is baked by `urchi/tools/build-mascot.mjs` in the Eigengrau repo; `mesh.json` here is that output.
