import type { Item } from "./look";

/**
 * Each item's maker, by its id in site.ts's ITEMS, loaded when it is first wanted (an item's code
 * is its own chunk). An item in ITEMS with no maker here is not made yet.
 */
export const ITEM_MAKERS: Record<string, () => Promise<() => Item>> = {
  "lost-glove": () => import("./glove").then((m) => m.makeGlove),
  micrometeorite: () => import("./micrometeorite").then((m) => m.makeMicrometeorite),
  "frozen-lightning": () => import("./lightning").then((m) => m.makeLightning),
  "magnet-stone": () => import("./magnet").then((m) => m.makeMagnet),
  "comet-minnows": () => import("./minnows").then((m) => m.makeMinnows),
  "phase-shard": () => import("./phase").then((m) => m.makePhaseShard),
  "dark-matter": () => import("./darkmatter").then((m) => m.makeDarkMatter),
  "time-crystal": () => import("./timecrystal").then((m) => m.makeTimeCrystal),
  "fallen-star": () => import("./fallenstar").then((m) => m.makeFallenStar),
};

export type { Item } from "./look";
