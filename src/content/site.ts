/**
 * Everything that is identity or content lives here. Replace the placeholders
 * with your own name, work and words; the rest of the site is the system.
 */

export const MONOGRAM = "C . E";
export const NAME = "Clay Eigengrau";
export const ROLE = "Creative Developer";
export const TAGLINE = "Interfaces, motion and small tools, built with care.";
export const SITE_URL = "https://eigengrau.example";
export const YEAR = 2026;

/** About page. Three lines, about twelve words. */
export const STATEMENT = [
  "Quiet interfaces for",
  "people who notice",
  "the small things.",
];
/** The word in STATEMENT that carries the little superscript mark (optional). */
export const STATEMENT_MARK = { line: 2, after: "things." };
export const CURRENT = "Currently at Studio Eigengrau, Berlin";

export const TABS = [
  { href: "/", label: "Creative Space", n: 1 },
  { href: "/projects", label: "Projects", n: 2 },
  { href: "/about", label: "About", n: 3 },
] as const;

export type TabHref = (typeof TABS)[number]["href"];

/** Projects page heading: grotesk lead-in, then a serif noun phrase. */
export const PROJECTS_HEADING = { lead: "Selected", tail: "work in interface and motion" };

export type Media =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster: string };

export type Project = {
  slug: string;
  title: string;
  categories: string[];
  cover: string;
  hover: Media;
  comingSoon?: boolean;
  summary: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "meridian",
    title: "Meridian",
    categories: ["Art Direction", "Web Design"],
    cover: "/work/p01.webp",
    hover: { kind: "image", src: "/work/p01-alt.webp" },
    summary: "A reading app that gets out of the way. Typography first, chrome last.",
  },
  {
    slug: "nocturne",
    title: "Nocturne",
    categories: ["Identity", "Motion"],
    cover: "/work/p02.webp",
    hover: { kind: "video", src: "/work/p02-alt.webm", poster: "/work/p02-alt.webp" },
    summary: "Identity system for a late-night radio programme, built around a single moving dot.",
  },
  {
    slug: "halo",
    title: "Halo",
    categories: ["Web Design", "Development"],
    cover: "/work/p03.webp",
    hover: { kind: "image", src: "/work/p03-alt.webp" },
    summary: "Product site for a pair of headphones. One long scroll, one object, nothing else.",
  },
  {
    slug: "sundial",
    title: "Sundial",
    categories: ["Interaction", "Prototyping"],
    cover: "/work/p04.webp",
    hover: { kind: "video", src: "/work/p04-alt.webm", poster: "/work/p04-alt.webp" },
    comingSoon: true,
    summary: "A clock that tells time with light. Prototype for a small hardware studio.",
  },
  {
    slug: "atlas",
    title: "Atlas",
    categories: ["Editorial", "Web Design"],
    cover: "/work/p05.webp",
    hover: { kind: "image", src: "/work/p05-alt.webp" },
    summary: "Editorial platform for a travel journal. Slow pages, big photographs.",
  },
  {
    slug: "lattice",
    title: "Lattice",
    categories: ["Tooling", "Development"],
    cover: "/work/p06.webp",
    hover: { kind: "video", src: "/work/p06-alt.webm", poster: "/work/p06-alt.webp" },
    comingSoon: true,
    summary: "An internal grid and type tool for a design team.",
  },
];

export type SpaceItem = {
  id: string;
  title: string;
  category: string;
  /** width / height */
  aspect: number;
  media: Media;
  /** Description revealed by "Overview": one entry per line. */
  description: string[];
};

const desc = (a: string, b: string, c: string) => [a, b, c];

export const SPACE_ITEMS: SpaceItem[] = [
  { id: "s01", title: "Meridian, cover", category: "Art Direction", aspect: 0.75, media: { kind: "image", src: "/work/s01.webp" }, description: desc("The first spread of the Meridian reading app.", "A single column, a single weight,", "and a lot of room to breathe.") },
  { id: "s02", title: "Stripe study", category: "Motion", aspect: 1.5, media: { kind: "image", src: "/work/s02.webp" }, description: desc("A stripe field used as the loading state", "for the Nocturne identity.", "It rotates by one degree every second.") },
  { id: "s03", title: "Nocturne, poster", category: "Identity", aspect: 1, media: { kind: "image", src: "/work/s03.webp" }, description: desc("Poster series for the radio programme.", "Every poster is the same three blobs", "photographed at a different hour.") },
  { id: "s04", title: "Orbit", category: "Motion", aspect: 0.8, media: { kind: "video", src: "/work/s04.webm", poster: "/work/s04.webp" }, description: desc("Six dots on six orbits.", "A loop that never quite repeats,", "made for a lock screen.") },
  { id: "s05", title: "Halo, arcs", category: "Web Design", aspect: 1.333, media: { kind: "image", src: "/work/s05.webp" }, description: desc("The arc language of the Halo site.", "Every section is a quarter turn", "of the same circle.") },
  { id: "s06", title: "Letterform K", category: "Type", aspect: 0.75, media: { kind: "image", src: "/work/s06.webp" }, description: desc("A single letter cut for a wordmark.", "Heavy, close, and slightly off centre", "on purpose.") },
  { id: "s07", title: "Atlas, horizon", category: "Editorial", aspect: 1.778, media: { kind: "image", src: "/work/s07.webp" }, description: desc("Opening image for an Atlas story.", "The horizon sits at the golden section", "and the type sits below it.") },
  { id: "s08", title: "Scan", category: "Motion", aspect: 1, media: { kind: "video", src: "/work/s08.webm", poster: "/work/s08.webp" }, description: desc("A scanning bar over a still circle.", "Used as the progress indicator", "in the Sundial prototype.") },
  { id: "s09", title: "Nocturne, dusk", category: "Identity", aspect: 0.75, media: { kind: "image", src: "/work/s09.webp" }, description: desc("The dusk variant of the poster.", "Same blobs, warmer light,", "printed on uncoated stock.") },
  { id: "s10", title: "Field, red", category: "Art Direction", aspect: 1.333, media: { kind: "image", src: "/work/s10.webp" }, description: desc("A colour field with one circle.", "The whole Meridian palette", "started from this frame.") },
  { id: "s11", title: "Halo, rings", category: "Web Design", aspect: 0.8, media: { kind: "image", src: "/work/s11.webp" }, description: desc("Concentric rings for the Halo hero.", "They rotate with the scroll", "and stop on the product.") },
  { id: "s12", title: "Letterform R", category: "Type", aspect: 1.5, media: { kind: "image", src: "/work/s12.webp" }, description: desc("A wide letter for a wide wordmark.", "Drawn in an afternoon,", "kerned over a week.") },
  { id: "s13", title: "Pulse", category: "Motion", aspect: 1, media: { kind: "video", src: "/work/s13.webm", poster: "/work/s13.webp" }, description: desc("A breathing shape.", "It slows down when nobody moves the mouse", "and speeds up when somebody does.") },
  { id: "s14", title: "Atlas, coast", category: "Editorial", aspect: 0.75, media: { kind: "image", src: "/work/s14.webp" }, description: desc("Portrait crop of the coast story.", "The sun is a hole in the page,", "not a shape on it.") },
  { id: "s15", title: "Lattice, grid", category: "Tooling", aspect: 1.333, media: { kind: "image", src: "/work/s15.webp" }, description: desc("The dot grid from the Lattice tool.", "One dot is missing", "wherever the cursor last rested.") },
  { id: "s16", title: "Grain", category: "Art Direction", aspect: 0.75, media: { kind: "image", src: "/work/s16.webp" }, description: desc("Film grain over a two-colour gradient.", "A texture study that became", "the Nocturne loading screen.") },
  { id: "s17", title: "Field, square", category: "Art Direction", aspect: 1, media: { kind: "image", src: "/work/s17.webp" }, description: desc("The square version of the field.", "Made for the app icon,", "kept for the wall.") },
  { id: "s18", title: "Wave", category: "Motion", aspect: 1.778, media: { kind: "video", src: "/work/s18.webm", poster: "/work/s18.webp" }, description: desc("Seven lines, one of them coloured.", "A waveform for a sound", "that does not exist yet.") },
  { id: "s19", title: "Stripe, tall", category: "Identity", aspect: 0.8, media: { kind: "image", src: "/work/s19.webp" }, description: desc("Tall stripe field for a banner.", "Printed at four metres", "and hung upside down by mistake.") },
  { id: "s20", title: "Halo, wide", category: "Web Design", aspect: 1.5, media: { kind: "image", src: "/work/s20.webp" }, description: desc("The wide arcs from the Halo footer.", "This is where the page ends", "and the circle closes.") },
];
