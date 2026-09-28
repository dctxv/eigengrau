/**
 * Adds a note to the Notes column from the terminal: asks for the category, the date and the
 * text, then writes the entry into NOTES in src/content/site.ts, the whole list newest first,
 * commits that one file on main and pushes it.
 *
 *   npm run note
 *   npm run note -- --local     (write the note, leave git alone)
 *
 * A note tagged "site" is the site's own log line; anything else is a note of his.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "site.ts");
const OPEN = "export const NOTES: Note[] = [";

const source = readFileSync(FILE, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";
const start = source.indexOf(OPEN);
if (start < 0) fail(`Could not find "${OPEN}" in ${FILE}.`);
const bodyStart = start + OPEN.length;
const bodyEnd = source.indexOf(`${eol}];`, bodyStart);
if (bodyEnd < 0) fail("Could not find the end of the NOTES array.");

// Every entry sits on one line; anything else means the array was edited by hand into a shape
// this script should not guess at.
const ENTRY = /^\s*\{\s*id:\s*"([^"]+)",\s*date:\s*"(\d{4}-\d{2}-\d{2})",.*\},?\s*$/;
const lines = source.slice(bodyStart, bodyEnd).split(eol).filter((l) => l.trim() !== "");
const entries = lines.map((line) => {
  const m = line.match(ENTRY);
  if (!m) fail(`This line in NOTES is not a one-line entry, so nothing was changed:\n  ${line.trim()}`);
  return { id: m[1], date: m[2], line: line.trim().replace(/,?$/, ",") };
});

// The fixed categories, from NOTE_CATEGORIES in the same file.
const list = source.match(/export const NOTE_CATEGORIES = \[([^\]]*)\]/)?.[1];
if (!list) fail("Could not find NOTE_CATEGORIES in site.ts.");
const known = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const rl = createInterface({ input: stdin, output: stdout });
rl.on("SIGINT", () => {
  stdout.write("\nNothing added.\n");
  process.exit(130);
});
// Lines are queued as they come, so pasted or piped input is not lost between questions.
const queued = [];
const waiting = [];
rl.on("line", (l) => (waiting.length ? waiting.shift()(l) : queued.push(l)));
rl.on("close", () => waiting.splice(0).forEach((r) => r(null)));
async function ask(prompt) {
  stdout.write(prompt);
  const line = queued.length ? queued.shift() : await new Promise((r) => waiting.push(r));
  if (line === null) fail("\nInput ended. Nothing added.");
  return line;
}

try {
  stdout.write("\nNew note\n\n");

  // Category
  known.forEach((t, i) => stdout.write(`  ${i + 1}. ${t}${t === "site" ? "  (the site's own log)" : ""}\n`));
  let tags;
  // Names not in the list yet, each confirmed so a typo does not become a category.
  let created;
  pick: for (;;) {
    const raw = await ask("\nCategory (number or name, several with commas, a new name creates one): ");
    const picked = raw.split(",").map((s) => s.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean);
    if (!picked.length) {
      stdout.write("  Pick at least one, by its number or its name.\n");
      continue;
    }
    const outOfRange = picked.filter((s) => /^\d+$/.test(s) && !known[+s - 1]);
    if (outOfRange.length) {
      stdout.write(`  No category numbered ${outOfRange.join(", ")}.\n`);
      continue;
    }
    tags = [...new Set(picked.map((s) => (/^\d+$/.test(s) ? known[+s - 1] : s)))];
    created = tags.filter((t) => !known.includes(t));
    for (const t of created) {
      if (!/^[a-z][a-z0-9-]*$/.test(t)) {
        stdout.write(`  "${t}" can't be a category: use letters, digits and dashes, starting with a letter.\n`);
        continue pick;
      }
      const yes = (await ask(`  "${t}" is not a category yet. Create it? [y/N] `)).trim().toLowerCase();
      if (yes !== "y" && yes !== "yes") continue pick;
    }
    break;
  }

  // Date
  const today = localDay(new Date());
  let date;
  for (;;) {
    const raw = (await ask(`Date (YYYY-MM-DD, "today" or "yesterday") [${today}]: `)).trim().toLowerCase();
    date = parseDay(raw || today);
    if (date) break;
    stdout.write("  Not a date. Try something like 2026-09-28.\n");
  }

  // Text
  let body;
  for (;;) {
    body = (await ask("Note: ")).trim().replace(/\s+/g, " ");
    if (body) break;
    stdout.write("  The note is empty.\n");
  }

  const id = uniqueId(`${date}-${slug(body)}`);
  const kind = tags.includes("site") ? "log" : "note";
  const q = (s) => JSON.stringify(s);
  const entry = { id, date, line: `{ id: ${q(id)}, date: ${q(date)}, kind: ${q(kind)}, tags: [${tags.map(q).join(", ")}], body: ${q(body)} },` };

  stdout.write(`\n  ${date}  [${tags.join(", ")}]  ${kind}\n  ${body}\n`);
  if (created.length) stdout.write(`  New ${created.length === 1 ? "category" : "categories"}: ${created.join(", ")}\n`);
  stdout.write("\n");
  const ok = (await ask("Add it? [Y/n] ")).trim().toLowerCase();
  if (ok && ok !== "y" && ok !== "yes") {
    stdout.write("Nothing added.\n");
    process.exit(0);
  }

  // Newest first. The new note leads its day; the rest keep the order they had.
  const all = [entry, ...entries].map((e, i) => ({ ...e, i })).sort((a, b) => b.date.localeCompare(a.date) || a.i - b.i);
  const block = all.map((e) => `  ${e.line}`).join(eol);
  // Asked before writing: once the note is in, site.ts is dirty either way.
  const publish = !process.argv.includes("--local") && canPublish();
  let next = source.slice(0, bodyStart) + eol + block + source.slice(bodyEnd);
  if (created.length) next = addCategories(next, created);
  writeFileSync(FILE, next);
  if (created.length) stdout.write(`Created ${created.join(", ")} in NOTE_CATEGORIES.\n`);
  stdout.write(`Added ${id} to src/content/site.ts.\n`);
  if (publish) commitAndPush(`Notes: ${date}, ${body.length > 60 ? `${body.slice(0, 57).trimEnd()}...` : body}`);
} finally {
  rl.close();
}

/** Adds names to NOTE_CATEGORIES, one per line, just before "site" so the site's log stays last. */
function addCategories(text, names) {
  return text.replace(/(export const NOTE_CATEGORIES = \[)([^\]]*)(\])/, (_, open, inner, close) => {
    const cats = [...inner.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const at = cats.includes("site") ? cats.indexOf("site") : cats.length;
    cats.splice(at, 0, ...names);
    return `${open}${eol}${cats.map((c) => `  ${JSON.stringify(c)},`).join(eol)}${eol}${close}`;
  });
}

function git(...args) {
  return execFileSync("git", args, { cwd: dirname(FILE), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Only on main, and only when site.ts holds nothing uncommitted that the commit would sweep in. */
function canPublish() {
  try {
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    if (branch !== "main") {
      stdout.write(`On branch ${branch}, not main: the note is written but not committed.\n`);
      return false;
    }
    if (git("status", "--porcelain", "--", FILE)) {
      stdout.write("site.ts already has uncommitted changes, so the note is written but not committed; commit it by hand.\n");
      return false;
    }
    return true;
  } catch (e) {
    stdout.write(`git is not answering (${e.message.split("\n")[0]}): the note is written but not committed.\n`);
    return false;
  }
}

/** Commits site.ts alone, whatever else is staged or changed, then pushes; one rebase if main moved. */
function commitAndPush(message) {
  try {
    git("commit", "-m", message, "--", FILE);
    stdout.write(`Committed: ${message}\n`);
  } catch (e) {
    stdout.write(`The commit failed, so the note is only written:\n${e.stderr || e.message}\n`);
    return;
  }
  try {
    git("push", "origin", "main");
  } catch {
    try {
      stdout.write("main moved on GitHub; rebasing onto it and pushing again.\n");
      git("pull", "--rebase", "--autostash", "origin", "main");
      git("push", "origin", "main");
    } catch (e) {
      stdout.write(`The push failed; the commit is kept locally, push it with "git push":\n${e.stderr || e.message}\n`);
      return;
    }
  }
  stdout.write("Pushed to origin/main.\n");
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function localDay(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** A real calendar day as YYYY-MM-DD, or null. */
function parseDay(s) {
  if (s === "today") return localDay(new Date());
  if (s === "yesterday") return localDay(new Date(Date.now() - 864e5));
  const m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return localDay(d);
}

/** One word from the note for its id, the way the hand-written ones read: "kettle", "cache". */
function slug(text) {
  const SKIP = new Set("about after again also been being could does from have into just like made make more most much only over same some than that their them then there these they this those very were what when which with would your".split(" "));
  const words = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]+/g) ?? [];
  return words.find((w) => w.length >= 4 && !SKIP.has(w)) ?? words[0] ?? "note";
}

function uniqueId(base) {
  const ids = new Set(entries.map((e) => e.id));
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
  return id;
}
