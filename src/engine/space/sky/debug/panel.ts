import type { Sky, SkyLayers } from "../Sky";
import { isRange, type Range } from "../tune";
import { configFile } from "./copy";
import { starsGroups, type Group, type Path, type Row } from "./schema";
import { SKY, STARS } from "../defaults";

/**
 * The sky's tuning panel: Space with ?debug=1, in development only (CreativeSpacePanel imports it
 * behind NODE_ENV, so a production build never follows the import). A row for every value, grouped
 * per layer, each live: its slider or picker, a die that makes it a range the seed picks within
 * (its ends beside it), a lock that holds it at what it is while the rest are rerolled, and a
 * diamond that makes it this variant's own. Above them: the seed, the variant and their odds,
 * Randomise, a preview at home, and Copy config, which copies the whole defaults file (ranges,
 * locks, variants and weights) to paste over defaults.ts.
 */

const CSS = `
.sky-debug { position: absolute; z-index: 20; top: 64px; right: 60px; width: 360px; max-height: calc(100% - 84px); overflow: auto;
  background: rgba(20, 20, 27, 0.94); color: #e9e9e2; border: 1px solid rgba(233, 233, 226, 0.14); border-radius: 10px;
  font: 11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
  cursor: auto; user-select: none; -webkit-user-select: none; touch-action: pan-y; overscroll-behavior: contain; }
.sky-debug[data-min] { max-height: none; overflow: visible; }
.sky-debug[data-min] > :not(header) { display: none; }
.sky-debug header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  background: rgba(20, 20, 27, 0.98); border-bottom: 1px solid rgba(233, 233, 226, 0.1); }
.sky-debug header b { flex: 1; font-weight: 600; letter-spacing: 0.04em; }
.sky-debug button { font: inherit; color: inherit; background: rgba(233, 233, 226, 0.08); border: 1px solid rgba(233, 233, 226, 0.14);
  border-radius: 5px; padding: 2px 7px; cursor: pointer; }
.sky-debug button:hover { background: rgba(233, 233, 226, 0.16); }
.sky-debug button[aria-pressed="true"] { background: rgba(242, 213, 150, 0.28); border-color: rgba(242, 213, 150, 0.6); }
.sky-debug button:disabled { opacity: 0.3; cursor: default; }
.sky-debug .tool { width: 22px; padding: 1px 0; text-align: center; }
.sky-debug details { border-bottom: 1px solid rgba(233, 233, 226, 0.08); }
.sky-debug details details { border: 0; }
.sky-debug summary { padding: 6px 10px; cursor: pointer; font-weight: 600; }
.sky-debug details details summary { padding: 4px 10px 2px 18px; font-weight: 500; color: rgba(233, 233, 226, 0.7); }
.sky-debug .rows { padding: 2px 10px 6px 18px; }
.sky-debug .row { display: grid; grid-template-columns: 94px 1fr 54px 22px 22px 22px; gap: 4px; align-items: center; padding: 2px 0; }
.sky-debug .row.own label { color: #f2d596; }
.sky-debug .row label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sky-debug .row input[type=range] { width: 100%; margin: 0; accent-color: #cddbff; }
.sky-debug .row input[type=color] { width: 100%; height: 18px; padding: 0; border: 0; background: none; }
.sky-debug .row output { text-align: right; font-variant-numeric: tabular-nums; }
.sky-debug .row .ends { grid-column: 2 / 4; display: flex; gap: 4px; }
.sky-debug .row .ends input { width: 50%; min-width: 0; font: inherit; color: inherit; background: rgba(233, 233, 226, 0.06);
  border: 1px solid rgba(233, 233, 226, 0.14); border-radius: 4px; padding: 1px 4px; }
.sky-debug .row .ends input[type=color] { height: 18px; padding: 0; }
.sky-debug .row .note { grid-column: 4 / 7; color: rgba(233, 233, 226, 0.45); }
.sky-debug .row.off { opacity: 0.45; }
.sky-debug .top { padding: 8px 10px; display: grid; gap: 6px; }
.sky-debug .line { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.sky-debug .line input[type=text] { flex: 1; min-width: 0; font: inherit; color: inherit; background: rgba(233, 233, 226, 0.06);
  border: 1px solid rgba(233, 233, 226, 0.14); border-radius: 4px; padding: 3px 6px; }
.sky-debug .line select { font: inherit; color: inherit; background: #1c1c24; border: 1px solid rgba(233, 233, 226, 0.14); border-radius: 4px; }
.sky-debug .big { font-size: 13px; }
.sky-debug .big em { font-style: normal; color: #f2d596; }
.sky-debug .dim { color: rgba(233, 233, 226, 0.5); }
.sky-debug .said { color: #cddbff; }
`;

type Layer = keyof SkyLayers;

// ---------------------------------------------------------------- paths

function getAt(o: unknown, path: Path): unknown {
  let v = o;
  for (const k of path) v = v == null ? undefined : (v as Record<string | number, unknown>)[k];
  return v;
}

function hasAt(o: unknown, path: Path): boolean {
  let v = o;
  for (const k of path) {
    if (v == null || typeof v !== "object" || !(k in (v as object))) return false;
    v = (v as Record<string | number, unknown>)[k];
  }
  return true;
}

/** Set a value at a path, making the objects on the way. */
function setAt(o: Record<string | number, unknown>, path: Path, value: unknown) {
  let v = o;
  path.slice(0, -1).forEach((k) => {
    if (v[k] == null || typeof v[k] !== "object") v[k] = {};
    v = v[k] as Record<string | number, unknown>;
  });
  v[path[path.length - 1]] = value;
}

/** Remove a path, and every object on the way that it leaves empty. */
function deleteAt(o: Record<string | number, unknown>, path: Path) {
  const chain: Record<string | number, unknown>[] = [o];
  for (const k of path.slice(0, -1)) {
    const next = chain[chain.length - 1][k];
    if (next == null || typeof next !== "object") return;
    chain.push(next as Record<string | number, unknown>);
  }
  delete chain[chain.length - 1][path[path.length - 1]];
  for (let i = chain.length - 1; i > 0; i--) {
    if (Object.keys(chain[i]).length) break;
    delete chain[i - 1][path[i - 1]];
  }
}

/** Where a value is overridden as a whole: a list is a variant's own all at once (a palette entry takes the palette). */
const ownPath = (path: Path) => {
  const i = path.findIndex((k) => typeof k === "number");
  return i < 0 ? path : path.slice(0, i);
};

const round = (v: number, step: number) => Number((Math.round(v / step) * step).toFixed(6));
const show = (v: number, whole?: boolean) => (whole ? String(Math.round(v)) : String(Number(v.toFixed(3))));

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.append(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...kids);
  return e;
}

// ---------------------------------------------------------------- the panel

/** The panel over the room (inside `host`, so it hides with its tab); returns the way to take it down. */
export function mountSkyPanel(sky: Sky, host: HTMLElement): () => void {
  const root = el("section", { className: "sky-debug", ariaLabel: "Sky tuning" });
  root.append(el("style", {}, CSS));
  // its presses, wheels and keys are its own: not taps on the room, holds, zooms or rhythms
  const own = (e: Event) => e.stopPropagation();
  const OWN = ["pointerdown", "pointermove", "pointerup", "pointercancel", "wheel", "gesturestart", "gesturechange", "keydown"];
  OWN.forEach((t) => root.addEventListener(t, own));

  const said = el("span", { className: "said" });
  let saidTimer = 0;
  const say = (text: string) => {
    said.textContent = text;
    window.clearTimeout(saidTimer);
    saidTimer = window.setTimeout(() => (said.textContent = ""), 2400);
  };

  const minimise = el("button", { type: "button", textContent: "–", title: "Fold the panel away" });
  minimise.onclick = () => {
    const on = !root.hasAttribute("data-min");
    root.toggleAttribute("data-min", on);
    minimise.textContent = on ? "+" : "–";
  };
  root.append(el("header", {}, el("b", {}, "SKY"), said, minimise));

  const body = el("div");
  root.append(body);
  host.append(root);

  /** Which groups are open, by title, across rebuilds. */
  const open = new Set(["Sky", "Stars"]);
  /** Each row's way of showing what is drawn now. */
  let updates: (() => void)[] = [];
  /** What the rows were built for: a new variant or a longer palette builds them again. */
  let shape = "";
  const shapeNow = () => {
    const c = sky.resolved("stars");
    return `${sky.variant} ${c?.palette.length} ${c?.bands.length}`;
  };

  /**
   * Drawn again from its config, and every row shows it. A change that draws another variant (a
   * weight dragged past another's) builds the rows again, but only once the slider is let go.
   */
  let rebuild = false;
  const changed = () => {
    sky.apply();
    const dragging = document.activeElement instanceof HTMLInputElement && document.activeElement.type === "range" && root.contains(document.activeElement);
    if (shapeNow() === shape) updates.forEach((u) => u());
    else if (dragging) {
      rebuild = true;
      updates.forEach((u) => u());
    } else build();
  };
  root.addEventListener("change", () => {
    if (!rebuild) return;
    rebuild = false;
    build();
  });

  // ---- one layer's row
  const layerRow = (layer: Layer, row: Row): HTMLElement => {
    /**
     * Where the value lives: the variant's own changes when they have it, or the layer's config
     * (always, while it is locked there: its lock holds over the variant's).
     */
    const home = () => {
      const patch = sky.config.variants[sky.variant]?.layers[layer], base = sky.layers[layer], mine = getAt(base, row.path);
      const inVariant = hasAt(patch, row.path) && !(isRange(mine) && mine.lock !== undefined);
      return { root: (inVariant ? patch : base) as Record<string | number, unknown>, inVariant };
    };
    const raw = () => getAt(home().root, row.path);
    const drawn = () => getAt(sky.resolved(layer), row.path);
    const set = (v: unknown) => {
      const r = raw();
      if (isRange(r)) (r as Range<unknown>).lock = v;
      else setAt(home().root, row.path, v);
      changed();
    };

    const line = el("div", { className: "row" });
    const label = el("label", { textContent: row.label, title: row.path.join(".") });
    line.append(label);

    if (row.kind === "bool") {
      const box = el("input", { type: "checkbox" });
      box.onchange = () => set(box.checked);
      line.append(el("span", {}, box));
      const variant = variantButton();
      line.append(el("span"), el("span"), el("span"), variant);
      updates.push(() => {
        box.checked = raw() === true;
        paintVariant(variant);
      });
      return line;
    }

    // the value: a slider or a colour
    const input =
      row.kind === "num"
        ? el("input", { type: "range", min: String(row.min), max: String(row.max), step: String(row.step), disabled: !!row.off })
        : el("input", { type: "color" });
    const out = el("output");
    input.oninput = () => set(row.kind === "num" ? round(Number(input.value), row.kind === "num" && row.whole ? 1 : row.step) : input.value);
    line.append(input, out);

    // the die: fixed, or a range the seed picks within
    const die = el("button", { type: "button", className: "tool", textContent: "⚄", title: "A range: each sky's seed picks within its ends" });
    const lock = el("button", { type: "button", className: "tool", textContent: "🔒", title: "Lock: keep this value when rerolling" });
    const variant = variantButton();
    const fixed = row.kind === "num" && (row.fixed || row.off);
    die.disabled = !!fixed;
    line.append(die, lock, variant);

    const lo = el("input", row.kind === "num" ? { type: "number", step: String(row.step), title: "lowest" } : { type: "color", title: "one end" });
    const hi = el("input", row.kind === "num" ? { type: "number", step: String(row.step), title: "highest" } : { type: "color", title: "the other end" });
    const ends = el("span", { className: "ends" }, lo, hi);
    const endChanged = (i: 0 | 1, input: HTMLInputElement) => () => {
      const r = raw();
      if (!isRange(r)) return;
      const v = row.kind === "num" ? Number(input.value) : input.value;
      if (row.kind === "num" && !Number.isFinite(v)) return;
      (r as Range<unknown>).range[i] = v;
      changed();
    };
    lo.onchange = endChanged(0, lo);
    hi.onchange = endChanged(1, hi);
    const note = el("span", { className: "note", textContent: row.kind === "num" ? (row.note ?? "") : "" });
    line.append(ends, note);

    die.onclick = () => {
      const r = raw(), v = drawn();
      if (isRange(r)) setAt(home().root, row.path, v);
      else if (row.kind === "num") {
        const span = (row.max - row.min) * 0.1, n = Number(v);
        setAt(home().root, row.path, { range: [round(Math.max(row.min, n - span), row.step), round(Math.min(row.max, n + span), row.step)] });
      } else setAt(home().root, row.path, { range: [v, v] });
      changed();
    };
    lock.onclick = () => {
      const r = raw();
      if (!isRange(r)) return;
      if (r.lock !== undefined) delete r.lock;
      else (r as Range<unknown>).lock = drawn();
      changed();
    };

    updates.push(() => {
      const r = raw(), v = drawn(), ranged = isRange(r);
      if (row.kind === "num") {
        input.value = String(v);
        out.textContent = show(Number(v), row.whole);
      } else {
        input.value = String(v);
        out.textContent = String(v);
      }
      die.setAttribute("aria-pressed", String(ranged));
      lock.disabled = !ranged;
      lock.setAttribute("aria-pressed", String(ranged && r.lock !== undefined));
      lock.textContent = ranged && r.lock !== undefined ? "🔒" : "🔓";
      ends.style.display = ranged ? "" : "none";
      note.style.display = ranged ? "none" : "";
      if (ranged) {
        if (document.activeElement !== lo) lo.value = String(r.range[0]);
        if (document.activeElement !== hi) hi.value = String(r.range[1]);
      }
      line.classList.toggle("off", row.kind === "num" && !!row.off);
      paintVariant(variant);
    });
    return line;

    /** The diamond: this value this variant's own (its whole list, for one in a list), or the layer's. */
    function variantButton() {
      const b = el("button", { type: "button", className: "tool", textContent: "◆" });
      b.onclick = () => {
        const v = sky.config.variants[sky.variant];
        if (!v) return;
        const at = ownPath(row.path), patch = (v.layers[layer] ??= {}) as Record<string | number, unknown>;
        if (hasAt(patch, at)) deleteAt(patch, at);
        else setAt(patch, at, structuredClone(getAt(sky.layers[layer], at)));
        if (!Object.keys(patch).length) delete v.layers[layer];
        changed();
      };
      return b;
    }
    function paintVariant(b: HTMLButtonElement) {
      const own = hasAt(sky.config.variants[sky.variant]?.layers[layer], row.path), drawn = home().inVariant;
      b.setAttribute("aria-pressed", String(own));
      b.title = !own
        ? `Make this "${sky.variant}"'s own value`
        : drawn
          ? `Only in "${sky.variant}": press to use the layer's own value again`
          : `"${sky.variant}" has its own value, but the layer's lock holds over it: press to drop the variant's`;
      line.classList.toggle("own", drawn);
    }
  };

  // ---- a group of rows, folding
  const group = (title: string, rows: HTMLElement[], nested = false) => {
    const d = el("details", { open: open.has(title) });
    d.ontoggle = () => (d.open ? open.add(title) : open.delete(title));
    d.append(el("summary", {}, title), el("div", { className: nested ? "rows" : "" }, ...rows));
    return d;
  };

  // ---- the sky's own: seed, variant, odds, and the buttons
  const skyGroup = () => {
    const seed = el("input", { type: "text", value: sky.seed, spellcheck: false, title: "The seed: type one and press Enter" });
    const reroll = (to?: string) => {
      const held = sky.reroll(to);
      build();
      if (held) say(`Holding "${sky.variant}": values are locked in it`);
    };
    seed.onkeydown = (e) => {
      if (e.key === "Enter" && seed.value.trim()) reroll(seed.value.trim());
    };
    const roll = el("button", { type: "button", textContent: "Randomise", title: "A new seed: every unlocked value is picked again" });
    roll.onclick = () => reroll();
    const link = el("button", { type: "button", textContent: "Link", title: "Copy a link to this sky (?sky=)" });
    link.onclick = async () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("debug");
      url.searchParams.set("sky", sky.seed);
      say((await copyText(url.toString())) ? "Link copied" : "Could not copy");
    };

    const pick = el("select", { title: "Hold a variant while rerolling, or let the seed draw it" });
    pick.append(el("option", { value: "", textContent: "by seed" }), ...Object.keys(sky.config.variants).map((k) => el("option", { value: k, textContent: k })));
    pick.value = sky.forced ?? "";
    pick.onchange = () => {
      sky.forced = pick.value || null;
      sky.apply();
      build();
    };

    const pin = el("input", { type: "checkbox", checked: sky.config.seed !== null, title: "Keep this seed in the config: the same sky every visit" });
    pin.onchange = () => {
      sky.config.seed = pin.checked ? sky.seed : null;
      build();
    };
    const preview = el("input", { type: "checkbox", checked: sky.preview, title: "Show the sky at home too, without taking Urchi out" });
    preview.onchange = () => (sky.preview = preview.checked);

    const copy = el("button", { type: "button", textContent: "Copy config", title: "Copy defaults.ts as tuned: ranges, locks, variants and weights" });
    copy.onclick = async () => {
      const text = configFile(sky.config, sky.layers);
      console.info(text);
      say((await copyText(text)) ? "Config copied: paste over defaults.ts" : "Could not copy: it is in the console");
    };
    const reset = el("button", { type: "button", textContent: "Reset", title: "Back to defaults.ts (the seed stays)" });
    reset.onclick = () => {
      Object.assign(sky.config, structuredClone(SKY));
      Object.assign(sky.layers, { stars: structuredClone(STARS) });
      sky.apply();
      build();
      say("Back to the defaults");
    };

    const weights = Object.keys(sky.config.variants).map((name) => {
      const line = el("div", { className: "row" + (name === sky.variant ? " own" : "") });
      const input = el("input", { type: "range", min: "0", max: "100", step: "0.5" });
      const out = el("output");
      const odds = el("span", { className: "note" });
      const paint = () => {
        const w = sky.config.variants[name].weight, total = Object.values(sky.config.variants).reduce((s, v) => s + Math.max(0, v.weight), 0) || 1;
        input.value = String(w);
        out.textContent = show(w);
        odds.textContent = `${show((100 * Math.max(0, w)) / total)}%`;
      };
      input.oninput = () => {
        sky.config.variants[name].weight = Number(input.value);
        changed();
      };
      updates.push(paint);
      line.append(el("label", { textContent: name, title: `variants["${name}"].weight` }), input, out, odds);
      return line;
    });

    const where = { url: "from the address (?sky=)", config: "pinned in the config", visit: "rolled for this visit" }[sky.source];
    return group("Sky", [
      el(
        "div",
        { className: "top" },
        el("div", { className: "big" }, "seed ", el("em", {}, sky.seed), " · variant ", el("em", {}, sky.variant)),
        el("div", { className: "dim" }, where),
        el("div", { className: "line" }, seed, roll, link),
        el("div", { className: "line" }, el("span", { className: "dim" }, "variant"), pick),
        el("label", { className: "line" }, pin, "pin this seed in the config"),
        el("label", { className: "line" }, preview, "show at home (preview)"),
        el("div", { className: "line" }, copy, reset),
      ),
      group("Variant weights", weights, true),
    ]);
  };

  const layerGroup = (layer: Layer, title: string, groups: Group[]) =>
    group(
      title,
      groups.map((g) => group(`${title}: ${g.title}`, g.rows.map((r) => layerRow(layer, r)), true)),
    );

  function build() {
    updates = [];
    shape = shapeNow();
    const stars = sky.resolved("stars");
    body.replaceChildren(skyGroup(), ...(stars ? [layerGroup("stars", "Stars", starsGroups(stars))] : []));
    // (a nested group's summary reads as its own title, without the layer's)
    body.querySelectorAll("details details summary").forEach((s) => (s.textContent = (s.textContent ?? "").replace(/^[^:]+: /, "")));
    updates.forEach((u) => u());
  }
  build();

  return () => {
    window.clearTimeout(saidTimer);
    OWN.forEach((t) => root.removeEventListener(t, own));
    root.remove();
  };
}
