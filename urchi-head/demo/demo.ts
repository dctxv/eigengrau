// A bare-canvas demo of the head: no three.js, no framework. Build and open it:
//   npx esbuild urchi-head/demo/demo.ts --bundle --outfile=urchi-head/demo/demo.js
import { createUrchi, drawnColourway } from "../character";
import { createMoods } from "../moods";

const urchi = createUrchi({ smooth: true });
urchi.setResolution(720);   // smooth: the box's width in canvas pixels
urchi.openEyes(0.6);
const moods = createMoods(urchi);

const stage = document.getElementById("stage")!;
urchi.canvas.style.cssText = "width:min(90vw,520px);height:auto;display:block";
stage.appendChild(urchi.canvas);

let last = performance.now();
(function tick(now: number) {
  const dt = (now - last) / 1000;
  urchi.update(dt);
  moods.update(dt);
  last = now;
  requestAnimationFrame(tick);
})(last);

const colour = drawnColourway();
document.getElementById("eyes")!.textContent = colour ? `${colour.name}  iris ${colour.iris}  pupils ${colour.pupilLeft} / ${colour.pupilRight}` : "";

const moves: Record<string, () => void> = {
  blink: () => urchi.blink(),
  "double blink": () => urchi.doubleBlink(),
  "slow blink": () => urchi.slowBlink(),
  glance: () => urchi.glance(),
  "tilt left": () => urchi.tiltToward(-1, 12),
  "tilt right": () => urchi.tiltToward(1, 12),
  bob: () => void urchi.bob(),
  stretch: () => urchi.stretch(),
  "deep breath": () => urchi.deepBreath(1.4, 2, 2),
  widen: () => urchi.widen(0.08, 1.2),
  startle: () => { urchi.kick(0, -55, 0); urchi.dip(); urchi.widen(0.06, 0.7); },
  nod: () => { urchi.pose(0, 4, 0, 14); setTimeout(() => urchi.pose(0, 0, 0, 9), 200); },
  "cross-eyed": () => { urchi.converge(1); setTimeout(() => urchi.converge(0), 1600); },
  embarrassed: () => { urchi.setFace("embarrassed"); setTimeout(() => urchi.setFace("neutral"), 1800); },
  "look up-left": () => { urchi.lookAt(-0.8, -0.6); setTimeout(() => urchi.lookAt(null), 1500); },
  "fall asleep": () => moods.dozeOff(),
  "peek (asleep)": () => moods.peek(1),
  "wake (stretch)": () => moods.wake(),
  "groggy wake": () => moods.wakeGroggy(),
  "startled wake": () => moods.stir(true),
};
const bar = document.getElementById("moves")!;
for (const [name, fn] of Object.entries(moves)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.onclick = fn;
  bar.appendChild(b);
}
(window as unknown as { urchi: typeof urchi }).urchi = urchi;
