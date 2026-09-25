/**
 * Everything that is identity or content lives here. Replace the placeholders
 * with your own name, work and words; the rest of the site is the system.
 */

export const MONOGRAM = "D . T";
export const NAME = "Darius Tan";
export const ROLE = "Basic Human";
export const TAGLINE = "Interfaces, motion and small tools, built with care.";
export const SITE_URL = "https://eigengrau.example";
export const YEAR = 2026;
/**
 * Where he lives, as an IANA time zone ("Europe/London"). Urchi keeps these hours (asleep at night)
 * and Music reads the week's listening in them. null keeps the visitor's own hours until it is set.
 */
export const TIME_ZONE: string | null = null; // TODO(darius): set your zone

/** About page. Three lines, about twelve words. */
export const STATEMENT = [
  "Quiet interfaces for",
  "people who notice",
  "the small things.",
];
/** The word in STATEMENT that carries the little superscript mark (optional). */
export const STATEMENT_MARK = { line: 2, after: "things." };
/** One line about now, under the statement. Change it whenever. */
export const STATUS = "Busy putting a hole in spacetime";

export const TABS = [
  { href: "/", label: "Space", n: 1 },
  { href: "/projects", label: "Projects", n: 2 },
  { href: "/notes", label: "Notes", n: 3 },
  { href: "/music", label: "Music", n: 4 },
  { href: "/about", label: "About", n: 5 },
] as const;

export type TabHref = (typeof TABS)[number]["href"];

/** Elsewhere: three words under the statement on About. Email copies, the others open. */
export const ELSEWHERE = [
  { label: "GitHub", href: "https://github.com/dctxv" }, // TODO(darius): confirm
  { label: "Instagram", href: "https://www.instagram.com/dctxv/" },
  { label: "Email", href: "mailto:dctxvv@gmail.com", copy: "dctxvv@gmail.com" }, // TODO(darius): confirm
] as const;

/**
 * How Urchi takes a line once it has read it: a slow blink, a puzzled tilt,
 * a glance away, a slow look round the room, or a long, patient blink.
 */
export type UrchiReaction = "slowBlink" | "puzzled" | "glanceAway" | "lookAround" | "longBlink";

/**
 * The owner's lines about Urchi, shown under its name as the hover caption on
 * Space. His voice, never the creature's; no exclamation marks; at most 48
 * characters. One is chosen per visit. Urchi reads the line when it rises and
 * then reacts to it, each line in its own way.
 */
export const URCHI_LINES: { text: string; reaction: UrchiReaction }[] = [
  { text: "It keeps the place while I am out.", reaction: "lookAround" },
  { text: "It has never asked for anything.", reaction: "slowBlink" },
  { text: "It watches the pointer. So do I.", reaction: "glanceAway" },
  { text: "Spikes, two eyes, and a lot of patience.", reaction: "longBlink" },
  { text: "It does not know it is the mascot.", reaction: "puzzled" },
];

/**
 * The captions that replace his line while their state holds (Urchi does not
 * read these: it is asleep, or busy listening). {time} is his time, h:mm;
 * {title} is the song. A listening line longer than 48 characters falls back
 * to `listeningLong`.
 */
export const URCHI_STATES = {
  asleep: "It is {time} here. It is asleep.",
  listening: "He is playing {title}. It is listening.",
  listeningLong: "He is listening to something. So is it.",
};

/**
 * What Urchi's look at a tab's pill means, said once in the caption: what
 * changed since the visitor's last visit. {count} is a number word, {date}
 * that visit's day ("12 September"), {tab} the tab's label.
 */
export const URCHI_NEWS = {
  note: "{count} new note since {date}.",
  notes: "{count} new notes since {date}.",
  changed: "{tab} has changed since {date}.",
};

/** A caption template with its {placeholders} filled. */
export function fillLine(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}

/**
 * When Projects and About last changed, YYYY-MM-DD. Bump these whenever you
 * change those tabs: Urchi looks up at the pill of a tab that is newer than a
 * returning visitor's last visit. (Notes date themselves from the newest note.)
 */
export const UPDATED = { projects: "2026-09-25", about: "2026-09-25" };

export type Media =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster: string };

export type Status = "alive" | "paused" | "dead" | "shipped";

export type Project = {
  slug: string;
  title: string;
  status: Status;
  /** The one year the status word needs: since when for alive and paused, when for dead and shipped. */
  year: number;
  /** The one honest line under the title, in place of categories. About 70 characters at most. */
  why: string;
  cover: string;
  hover: Media;
  summary: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "meridian",
    title: "Meridian",
    status: "shipped",
    year: 2023,
    why: "Shipped and handed over. There is nothing left for me to do.",
    cover: "/work/p01.webp",
    hover: { kind: "image", src: "/work/p01-alt.webp" },
    summary: "A reading app that gets out of the way. Typography first, chrome last.",
  },
  {
    slug: "nocturne",
    title: "Nocturne",
    status: "alive",
    year: 2024,
    why: "Still on air, so the dot still moves.",
    cover: "/work/p02.webp",
    hover: { kind: "video", src: "/work/p02-alt.webm", poster: "/work/p02-alt.webp" },
    summary: "Identity system for a late-night radio programme, built around a single moving dot.",
  },
  {
    slug: "halo",
    title: "Halo",
    status: "shipped",
    year: 2021,
    why: "One page, one object. It did what it was for.",
    cover: "/work/p03.webp",
    hover: { kind: "image", src: "/work/p03-alt.webp" },
    summary: "Product site for a pair of headphones. One long scroll, one object, nothing else.",
  },
  {
    slug: "sundial",
    title: "Sundial",
    status: "paused",
    year: 2025,
    why: "Waiting on hardware that may not get made.",
    cover: "/work/p04.webp",
    hover: { kind: "video", src: "/work/p04-alt.webm", poster: "/work/p04-alt.webp" },
    summary: "A clock that tells time with light. Prototype for a small hardware studio.",
  },
  {
    slug: "atlas",
    title: "Atlas",
    status: "dead",
    year: 2023,
    why: "Died because nobody, including me, opened it twice.",
    cover: "/work/p05.webp",
    hover: { kind: "image", src: "/work/p05-alt.webp" },
    summary: "Editorial platform for a travel journal. Slow pages, big photographs.",
  },
  {
    slug: "lattice",
    title: "Lattice",
    status: "alive",
    year: 2025,
    why: "Used by four people every day. That is the whole audience.",
    cover: "/work/p06.webp",
    hover: { kind: "video", src: "/work/p06-alt.webm", poster: "/work/p06-alt.webp" },
    summary: "An internal grid and type tool for a design team.",
  },
];

/** The status word with its one year: "alive since 2025", "dead 2023". */
export function statusWord(p: Pick<Project, "status" | "year">): string {
  return p.status === "alive" || p.status === "paused" ? `${p.status} since ${p.year}` : `${p.status} ${p.year}`;
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** A count as the site writes it: "No", "One" … "Twelve", then digits. */
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

/** The bottom line on Projects, derived from the data so it is never stale: "Six projects since 2021. Two alive." */
export function projectsLine(projects: readonly Project[] = PROJECTS): string {
  const since = Math.min(...projects.map((p) => p.year));
  const alive = projects.filter((p) => p.status === "alive").length;
  return `${numberWord(projects.length)} projects since ${since}. ${numberWord(alive)} alive.`;
}

export type Note = {
  /** The date plus a short slug, so two entries on one day stay distinct. */
  id: string;
  /** YYYY-MM-DD. Also the entry's hash anchor on /notes. */
  date: string;
  /** note: his, set in serif. log: the site's own line, set in grotesk. */
  kind: "note" | "log";
  tags: string[];
  body: string;
};

/** The notes column, any order; the page sorts newest first. Log lines carry the tag "site". */
export const NOTES: Note[] = [
  { id: "2026-09-24-eigengrau", date: "2026-09-24", kind: "log", tags: ["site"], body: "Eigengrau replaces white. Sound arrives." },
  { id: "2026-09-21-cache", date: "2026-09-21", kind: "note", tags: ["psychology", "ai"], body: "Most of what people call intuition is a cached decision. The interesting part is not that the cache exists but how rarely anyone invalidates it. Models do the same thing; they are only more honest about it." },
  { id: "2026-09-14-kettle", date: "2026-09-14", kind: "note", tags: ["random"], body: "Bought a kettle with one button. It boils. I have not thought about it since, which is the highest praise I have for an object." },
  { id: "2026-09-10-nav", date: "2026-09-10", kind: "log", tags: ["site"], body: "Four tabs. The nav shows only the current label; pages slide between routes." },
  { id: "2026-09-06-unsure", date: "2026-09-06", kind: "note", tags: ["ai"], body: "A model that says it does not know costs its maker nothing and saves its user an afternoon. That so few of them say it tells you who the product is for." },
  { id: "2026-08-29-threshold", date: "2026-08-29", kind: "note", tags: ["psychology"], body: "The threshold for noticing a thing is lower than the threshold for saying so. Most rooms are full of people who have already noticed." },
  { id: "2026-08-22-rebuild", date: "2026-08-22", kind: "log", tags: ["site"], body: "Rebuilt as one canvas per tab. The intro plays once, on a hard load of the front page." },
  { id: "2026-08-17-door", date: "2026-08-17", kind: "note", tags: ["random", "psychology"], body: "Walked the same route for a year before I saw the second door. Attention is not a resource. It is a habit, and habits have edges." },
  { id: "2026-08-03-confidence", date: "2026-08-03", kind: "note", tags: ["ai", "random"], body: "Asked three assistants the same question and got three confident answers, none of them the same. Confidence is a tone, not a signal." },
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
