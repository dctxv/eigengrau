# Review and ideas

A review of eigengrau as it stood at `9b8c07c` (29 September 2026), with ideas for where it goes next. It is long by design: the short part is for reading, and the long parts are specs to hand to a branch when that work starts.

**How it was made.** Ten specialists worked in parallel: Urchi's realism, style and UX, engineering, Urchi's finds (two designers), daily games (two designers), tools, security and strategy. Each area then went to a reviewer, who checked every claim against the code and marked each idea kept, changed or cut. A lead wrote the summary and settled the disagreements. A critic then looked for gaps, and the gaps were filled. Every question the report would have put to you is decided in `01-decisions.md`. Nothing outside `docs/` was changed.

**How to read it.**

1. `00-summary.md`, about forty minutes. What matters, the state of the project, the five bets, where new things live, the priorities, the roadmap, and the rules for every new thing.
2. `01-decisions.md`, when a decision surprises you. Each one says why, and which line reverses it.
3. The rest only when its work starts. Paste the relevant section, or the part of it, into the branch doing the work.

**Two rules for using it.**

- Where a section and the summary disagree, the summary wins, then the decisions. The sections have been edited to agree, but the summary is the tiebreaker.
- Line numbers refer to `9b8c07c`. `main` has since moved (the GitHub projects landed as `0d9641d`), so check a line before you trust it.

| File | What it is | Words |
|---|---|---|
| `00-summary.md` | The lead's summary: the short version, state of the project, the five bets, the IA decision (a sixth pill, Desk, third), priorities, the roadmap to a public launch in the week of 23 November, and house rules | 10k |
| `01-decisions.md` | Every open question, decided: Melbourne time, the domain, `WORK_LINE`, private repos, counts, Urchi's memory, and the rest | 6k |
| `02-urchi-alive.md` | Urchi's realism: what it does today (with line refs), what gives it away, and the plan (latency, saccades, eyes before head, lids, blinks, pupils, breath, ears, moods, memory, micro-acts, a `?debug=urchi` panel) | 19k |
| `03-space-finds.md` | Urchi goes out on its line and brings things back: the outing, the catalogue, how it presents a find, carrying across tabs, the drawer, gifts, stories over weeks | 24k |
| `04-where-it-goes.md` | Your "could be planets", answered: one small seeded rock a week, not a planet | 7k |
| `05-daily-games.md` | Daily games with no Urchi in them: Same Grey, Stet, Plaintext, Plate, Last login, and the shared frame (your midnight, frozen puzzles, plain-text shares) | 22k |
| `06-tools.md` | Free tools built from the site's own engines: Sky, Grain, Cues, Tone and others, with the frame they share | 19k |
| `07-security.md` | Cybersecurity: the audit of the site's own proxies, the headers and CSP, `/kept`, the Security drawer, three papers, the tools to check with, and Phosphenes | 27k |
| `08-style-ux.md` | Style and UX: what to keep, issues ranked with evidence, fixes with exact values, three bolder directions, a colophon | 16k |
| `09-music-about-notes.md` | Feature improvements for the three quieter tabs | 9k |
| `10-strategy-and-github.md` | Readers and their thirty seconds, where everything lives, real GitHub projects on the thread, more features, what to push on and what to stop | 22k |
| `11-engineering.md` | State of the code: lights-off without WebGL, the proxies, headers, performance, tests and CI, the runway for new features, a launch checklist | 18k |
| `12-only-you.md` | The hours only you can spend, week by week; the lean line on six hours a week; what Claude may draft; note prompts for every category | 10k |

The security section describes two proxy issues that are not fixed yet, in a public repository. They are rated Medium at worst, and the source they describe is already public. Still, the plan fixes them in week 1, before anything else in security.
