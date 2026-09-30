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
  "Studying how systems break,",
  "and how people",
  "do too.",
];
/** The word in STATEMENT that carries the little superscript mark (optional). */
export const STATEMENT_MARK = { line: 2, after: "too." };
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
  { label: "GitHub", href: "https://github.com/dctxv" },
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
 * What Urchi's look at a tab's pill means, said once in the caption under
 * that tab's label ("Notes", "Projects"): what changed since the visitor's
 * last visit. {count} is a number word, {date} that visit's day ("12 September").
 */
export const URCHI_NEWS = {
  note: "{count} new note since {date}.",
  notes: "{count} new notes since {date}.",
  changed: "Changed since {date}.",
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
export const UPDATED = { projects: "2026-09-29", about: "2026-09-25" };

export type Media =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster: string };

export type Status = "alive" | "paused" | "dead" | "shipped";

export type Project = {
  /** Its case page, /projects/<slug>, and its #slug on the thread. Its pieces in SPACE_ITEMS name it as `project`. */
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
    slug: "vector",
    title: "VECTOR",
    status: "shipped",
    year: 2026,
    why: "Thirty security lessons you learn by breaking things yourself.",
    cover: "/work/vector.webp",
    hover: { kind: "image", src: "/work/vector-alt.webp" },
    summary:
      "A cybersecurity atlas: thirty hand-built simulations that run in the browser. Break a login with SQL injection, factor an RSA key with Shor's algorithm, sit in the man-in-the-middle seat. Live on GitHub Pages.",
  },
  {
    slug: "career-hub",
    title: "Digital Career Hub",
    status: "alive",
    year: 2026,
    why: "Our capstone, still moving. I lead the AI side of a team of six.",
    cover: "/work/career-hub.webp",
    hover: { kind: "image", src: "/work/career-hub-alt.webp" },
    summary:
      "A career platform for Bangladeshi graduates: an AI resume review tuned to how hiring works there, career paths with local salaries, a chatbot in English and Bangla, and mock interviews. Swinburne ICT30017, built with Ian Rashmika, Sineth Munasinghe, Shalitha Senadeerage, Pubuditha Hettiarachchi and Manuth Mindiya Gamage.",
  },
  {
    slug: "nextbranch",
    title: "NextBranch",
    status: "shipped",
    year: 2026,
    why: "Built in three days. It reads a repo and finds the product in it.",
    cover: "/work/nextbranch.webp",
    hover: { kind: "image", src: "/work/nextbranch-alt.webp" },
    summary:
      "Turns a public GitHub repository into a map of what it could become: evidence-backed product surfaces, bounded experiment plans and code candidates to review, without ever running the code it imports.",
  },
  {
    slug: "atelier",
    title: "Atelier",
    status: "shipped",
    year: 2026,
    why: "My own workshop for talking to any model, on my own machine.",
    cover: "/work/atelier.webp",
    hover: { kind: "image", src: "/work/atelier-alt.webp" },
    summary:
      "A personal AI workspace that runs locally: any model I already have (OpenRouter, Ollama, LM Studio, llama.cpp) without someone else's product in between. One SQLite file, no cloud, no build step.",
  },
];

/** The status word with its one year: "alive since 2025", "dead 2023". */
export function statusWord(p: Pick<Project, "status" | "year">): string {
  return p.status === "alive" || p.status === "paused" ? `${p.status} since ${p.year}` : `${p.status} ${p.year}`;
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** A count as the site writes it: "No", "One" … "Twelve", then digits. */
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

const TEENS = ["Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/**
 * numberWord, carried on to ninety-nine, for counts that run past twelve (a
 * week of plays, a year of notes): "Sixty-two plays", "Eighty-one notes".
 * Digits after that. One copy, so Space, Notes and Music never disagree.
 */
export function countWord(n: number): string {
  if (n <= 12) return numberWord(n);
  if (n < 20) return TEENS[n - 13];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${numberWord(n % 10).toLowerCase()}` : "");
  return String(n);
}

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
  tags: NoteCategory[];
  body: string;
};

/**
 * The categories a note can carry, and the ones `npm run note` offers; typing a new name there
 * adds it here, or add one by hand. "site" is the site's own log line and stays last.
 */
export const NOTE_CATEGORIES = [
  "random",
  "music",
  "tech",
  "ai",
  "cybersec",
  "existential",
  "psychology",
  "sport",
  "site",
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

/**
 * Past this many notes the column settles into sediment: the last sixty days stay in full, each
 * older month folds into one line, and the months older than a year into one line per year.
 */
export const NOTES_FOLD_AFTER = 100;

/** The notes column, any order; the page sorts newest first. Log lines carry the tag "site". */
export const NOTES: Note[] = [
  { id: "2026-09-28-free", date: "2026-09-28", kind: "note", tags: ["random"], body: "i got a free burrito heh" },
  { id: "2026-09-28-hi", date: "2026-09-28", kind: "note", tags: ["random"], body: "hi" },
];

export type SpaceItem = {
  id: string;
  title: string;
  category: string;
  /** width / height */
  aspect: number;
  media: Media;
  /** Three short lines about the piece, one entry per line. */
  description: string[];
  /** The year it was made. A project's pieces take the project's year. */
  year: number;
  /** The slug of the project it belongs to. Without one it is a study: a bead of its own on the thread. */
  project?: string;
};

const desc = (a: string, b: string, c: string) => [a, b, c];

export const SPACE_ITEMS: SpaceItem[] = [
  { id: "vector-keys", year: 2026, project: "vector", title: "Two keys", category: "Simulation", aspect: 0.75, media: { kind: "image", src: "/work/vector-keys.webp" }, description: desc("The public-key module.", "The key that snaps the padlock shut", "cannot open it again.") },
  { id: "career-hub-paths", year: 2026, project: "career-hub", title: "Career paths", category: "Product", aspect: 1.333, media: { kind: "image", src: "/work/career-hub-paths.webp" }, description: desc("Paths across every industry,", "from entry level to the senior roles,", "with local salaries in taka.") },
  { id: "nextbranch-map", year: 2026, project: "nextbranch", title: "Mapping VECTOR", category: "Tooling", aspect: 1.333, media: { kind: "image", src: "/work/nextbranch-map.webp" }, description: desc("NextBranch run on VECTOR.", "Every surface it found in the code,", "each one a product it could become.") },
  { id: "atelier-palette", year: 2026, project: "atelier", title: "Command palette", category: "Interface", aspect: 0.8, media: { kind: "image", src: "/work/atelier-palette.webp" }, description: desc("Type a slash and every action is there.", "Adding a new one", "is one object in an array.") },
  { id: "vector-grinder", year: 2026, project: "vector", title: "The grinder", category: "Simulation", aspect: 0.75, media: { kind: "image", src: "/work/vector-grinder.webp" }, description: desc("Hashing, as a meat-grinder for data.", "Feed it a word or a whole book;", "one fixed-size fingerprint comes out.") },
  { id: "career-hub-review", year: 2026, project: "career-hub", title: "Sample review", category: "Product", aspect: 1, media: { kind: "image", src: "/work/career-hub-review.webp" }, description: desc("The resume review, on its sample.", "A score out of a hundred,", "then the changes that matter first.") },
  { id: "nextbranch-ranked", year: 2026, project: "nextbranch", title: "Ranked surfaces", category: "Tooling", aspect: 1.333, media: { kind: "image", src: "/work/nextbranch-ranked.webp" }, description: desc("The same map, as a table.", "Its scores are signals,", "not measured defects.") },
  { id: "vector-seat", year: 2026, project: "vector", title: "Intercept seat", category: "Simulation", aspect: 0.75, media: { kind: "image", src: "/work/vector-seat.webp" }, description: desc("The man-in-the-middle module.", "You sit between two people", "and watch encryption blind you.") },
  { id: "atelier-connect", year: 2026, project: "atelier", title: "Connect your AI", category: "Interface", aspect: 1, media: { kind: "image", src: "/work/atelier-connect.webp" }, description: desc("The setup, at night.", "Any endpoint that speaks OpenAI:", "OpenRouter, Ollama, LM Studio.") },
  { id: "career-hub-resources", year: 2026, project: "career-hub", title: "Resources", category: "Product", aspect: 1.5, media: { kind: "image", src: "/work/career-hub-resources.webp" }, description: desc("Guides and articles", "for graduates in Bangladesh,", "in English and in Bangla.") },
  { id: "vector-fake", year: 2026, project: "vector", title: "Spot the fake", category: "Simulation", aspect: 0.75, media: { kind: "image", src: "/work/vector-fake.webp" }, description: desc("The phishing module.", "Sort the real messages from the fakes", "before the clock starts running.") },
  { id: "nextbranch-building", year: 2026, project: "nextbranch", title: "Importing", category: "Tooling", aspect: 1.778, media: { kind: "image", src: "/work/nextbranch-building.webp" }, description: desc("An import under way.", "Public repositories only;", "imported code is never run.") },
  { id: "vector-atlas", year: 2026, project: "vector", title: "The atlas", category: "Navigation", aspect: 1.5, media: { kind: "image", src: "/work/vector-atlas.webp" }, description: desc("Thirty modules in four phases,", "from bits and bytes", "to governing the whole system.") },
];

/**
 * Space's items, by tier, rarest last. Each is a small 3D object (src/engine/items/, one file per
 * item, by its id) with its name and a one-line caption in his voice (no exclamation marks). Add
 * an item to any tier by adding its line here and its file there.
 */
export type ItemTier = "common" | "uncommon" | "rare" | "top";
export type ItemText = { id: string; name: string; caption: string };
export const ITEMS: Record<ItemTier, ItemText[]> = {
  common: [
    { id: "lost-glove", name: "Lost glove", caption: "Someone out here is waving with one hand." },
    { id: "micrometeorite", name: "Micrometeorite", caption: "You'll have to take Urchi's word for it." },
  ],
  uncommon: [
    { id: "frozen-lightning", name: "Frozen lightning", caption: "It struck once and decided to stay." },
    { id: "magnet-stone", name: "Magnet stone", caption: "It likes you. It likes everything, a little." },
    { id: "comet-minnows", name: "Comet minnows", caption: "They go wherever the first one goes." },
  ],
  rare: [
    { id: "phase-shard", name: "Phase shard", caption: "Only all there while you look at it." },
    { id: "dark-matter", name: "Dark matter", caption: "There is definitely something here." },
    { id: "time-crystal", name: "Time crystal", caption: "It keeps better time than he does." },
  ],
  top: [
    { id: "fallen-star", name: "Fallen star", caption: "Still warm." },
    { id: "star-whale-calf", name: "Star whale calf", caption: "Its mother is probably nearby." },
    { id: "pocket-universe", name: "Pocket universe", caption: "Somewhere in there, someone is holding a planet." },
  ],
};

/** The hidden note each top-tier item unlocks, by the item's id. Placeholders: his to write. */
export const ITEM_NOTES: Record<string, string> = {
  "fallen-star": "TODO: the note the fallen star unlocks.",
  "star-whale-calf": "TODO: the note the star whale calf unlocks.",
  "pocket-universe": "TODO: the note the pocket universe unlocks.",
};
