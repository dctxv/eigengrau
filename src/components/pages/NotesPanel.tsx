"use client";

import { Fragment, memo, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import type { Note } from "@/content/site";
import { CursorLabel } from "@/components/CursorLabel";
import { getFlags, setFlag } from "@/lib/flags";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import {
  ANCHORS,
  CATEGORIES,
  ENTRIES,
  byAnchor,
  dot,
  findSentence,
  groupsOf,
  indexSentence,
  lastVisitDay,
  localDay,
  matcher,
  plain,
  runLabel,
  settle,
  summary,
  tagSentence,
  type Piece,
} from "@/lib/notes";

/** A hash link lands with its entry on the line the heading sits on. */
const FIRST_Y = 206;
/** Between two notes, as before. */
const GAP = 56;
/** A folded note is a 1px rule on a row this tall; past THIN_AFTER in one run the rows halve. */
const ROW = 6;
const THIN_ROW = 3;
const THIN_AFTER = 20;
const FOLD = 0.5;
const ENTER_COUNT = 8;
const STAGGER = 0.08;

const BY_ID = new Map(ENTRIES.map((n) => [n.id, n]));
const EMPTY: ReadonlySet<string> = new Set();
/** The rule is as long as the note was, to scale: 20px for a line, the column for an essay. */
const ruleWidth = (n: Note) => Math.round(Math.min(450, Math.max(20, n.body.length * 1.6)));
const spansOf = (el: Element) => Array.from(el.querySelectorAll<HTMLElement>(".mask > span, .note-new"));

function readTag(): string | null {
  const t = new URLSearchParams(window.location.search).get("tag");
  return t && CATEGORIES.some((c) => c.tag === t) ? t : null;
}

/** ?tag= so a category can be linked; never a route change, and the hash stays. */
function writeTag(tag: string | null) {
  if (window.location.pathname !== "/notes") return;
  const url = `/notes${tag ? `?tag=${encodeURIComponent(tag)}` : ""}${window.location.hash}`;
  try {
    window.history.replaceState(window.history.state, "", url);
  } catch {
    /* a sandboxed frame */
  }
}

type Shape = { folded: boolean; margin: number; thin: boolean };
type Item = { id: string; el: HTMLElement; full: HTMLElement; row: HTMLElement; rule: HTMLElement; c: string };
type Group = { id: string; line: HTMLElement; body: HTMLElement; parent: string | null };

/**
 * The column's folds, done by hand so they can move: notes folding into rules and back, and the
 * sediment's months and years opening under their lines. React draws every note once; this keeps
 * each one's shape. Only what can be seen moves; anything hidden is set when its group opens.
 * Folded text is hidden="until-found", so the browser's own find still reaches it.
 */
class Folds {
  private items = new Map<string, Item>();
  /** Each container's notes in order: "recent", or a month's id. Runs never cross a container. */
  private lists = new Map<string, string[]>();
  private groups = new Map<string, Group>();
  private shape = new Map<string, Shape>();
  private open: ReadonlySet<string> = EMPTY;
  private hotRun: string[] = [];

  constructor(column: HTMLElement) {
    column.querySelectorAll<HTMLElement>(".note").forEach((el) => {
      const id = el.dataset.id!;
      const c = el.dataset.c!;
      const item = { id, el, c, full: el.querySelector<HTMLElement>(".note-full")!, row: el.querySelector<HTMLElement>(".note-row")!, rule: el.querySelector<HTMLElement>(".note-rule")! };
      this.items.set(id, item);
      if (!this.lists.has(c)) this.lists.set(c, []);
      this.lists.get(c)!.push(id);
    });
    column.querySelectorAll<HTMLElement>(".notes-group").forEach((el) => {
      const id = el.dataset.g!;
      this.groups.set(id, { id, line: el.querySelector<HTMLElement>(":scope > .notes-line")!, body: el.querySelector<HTMLElement>(":scope > .notes-body")!, parent: el.dataset.parent ?? null });
    });
  }

  private shown(open: ReadonlySet<string>, g: string | null): boolean {
    return g === null || (open.has(g) && this.shown(open, this.groups.get(g)!.parent));
  }

  private shapes(folded: ReadonlySet<string>) {
    const next = new Map<string, Shape>();
    for (const ids of this.lists.values()) {
      let run = 0;
      ids.forEach((id, i) => {
        const f = folded.has(id);
        run = f ? run + 1 : 0;
        // Rules in one run sit on consecutive rows; a note and a run keep the usual gap.
        next.set(id, { folded: f, margin: i === 0 || run > 1 ? 0 : GAP, thin: run > THIN_AFTER });
      });
    }
    return next;
  }

  init(folded: ReadonlySet<string>, open: ReadonlySet<string>) {
    this.shape = this.shapes(folded);
    this.open = open;
    this.lists.get("recent")?.forEach((id) => this.put(id));
    for (const g of this.groups.values()) if (g.parent === null) this.sync(g.id);
    this.mark();
  }

  apply(folded: ReadonlySet<string>, open: ReadonlySet<string>, animate: boolean) {
    const before = this.open;
    const was = this.shape;
    this.shape = this.shapes(folded);
    this.open = open;
    const moves: (() => void)[] = [];

    // Groups, outermost first. Those in sight open and close; the rest are set as they come into sight.
    for (const g of this.groups.values()) {
      const want = open.has(g.id);
      if (want === before.has(g.id) || !this.shown(open, g.parent)) continue;
      if (animate && this.shown(before, g.parent)) moves.push(() => (want ? this.expand(g) : this.collapse(g)));
      else this.sync(g.id);
    }

    // Notes that were and stay in sight fold and unfold. Unfolding ones rise one after another.
    let k = 0;
    for (const [c, ids] of this.lists) {
      const inSight = (o: ReadonlySet<string>) => c === "recent" || this.shown(o, c);
      if (!inSight(open) || !inSight(before)) continue;
      for (const id of ids) {
        const a = was.get(id)!;
        const b = this.shape.get(id)!;
        if (a.folded === b.folded && a.margin === b.margin && a.thin === b.thin) continue;
        if (!animate) this.put(id);
        else if (a.folded === b.folded) moves.push(() => this.reshape(id));
        else if (b.folded) moves.push(() => this.fold(id));
        else {
          const delay = Math.min(k++, ENTER_COUNT) * STAGGER;
          moves.push(() => this.unfold(id, delay));
        }
      }
    }
    moves.forEach((m) => m());
    this.mark();
  }

  /** A note at its shape, now. */
  private put(id: string) {
    const it = this.items.get(id)!;
    const s = this.shape.get(id)!;
    const spans = spansOf(it.full);
    gsap.killTweensOf([it.el, it.rule, ...spans]);
    gsap.set(it.el, { clearProps: "height", marginTop: s.margin });
    gsap.set([it.rule, ...spans], { clearProps: "transform,opacity" });
    it.el.removeAttribute("data-moving");
    it.el.toggleAttribute("data-folded", s.folded);
    it.el.toggleAttribute("data-thin", s.thin);
    if (s.folded) it.full.setAttribute("hidden", "until-found");
    else it.full.removeAttribute("hidden");
  }

  /** A group at its state, now, and everything inside it that can be seen. */
  private sync(id: string) {
    const g = this.groups.get(id)!;
    gsap.killTweensOf(g.body);
    gsap.set(g.body, { clearProps: "height" });
    g.body.removeAttribute("data-moving");
    if (!this.open.has(id)) {
      g.body.setAttribute("hidden", "until-found");
      return;
    }
    g.body.removeAttribute("hidden");
    this.lists.get(id)?.forEach((i) => this.put(i));
    for (const child of this.groups.values()) {
      if (child.parent !== id) continue;
      gsap.set(spansOf(child.line), { clearProps: "transform,opacity" });
      this.sync(child.id);
    }
  }

  /** The text drops through its mask while the note closes to its row, and the rule draws in. */
  private fold(id: string) {
    const it = this.items.get(id)!;
    const s = this.shape.get(id)!;
    const spans = spansOf(it.full);
    gsap.killTweensOf([it.el, it.rule, ...spans]);
    const from = it.el.getBoundingClientRect().height;
    it.el.setAttribute("data-moving", "");
    it.el.toggleAttribute("data-thin", s.thin);
    gsap.set(it.el, { height: from });
    gsap.to(spans, { yPercent: 100, opacity: 0, duration: 0.28, ease: "power2.in", stagger: 0.015 });
    gsap.fromTo(it.rule, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.36, ease: EASE.tab, delay: 0.2 });
    gsap.to(it.el, {
      height: s.thin ? THIN_ROW : ROW,
      marginTop: s.margin,
      duration: FOLD,
      ease: EASE.inout,
      delay: 0.06,
      onComplete: () => {
        it.full.setAttribute("hidden", "until-found");
        it.el.removeAttribute("data-moving");
        it.el.setAttribute("data-folded", "");
        gsap.set(it.el, { clearProps: "height" });
      },
    });
  }

  /** The rule fades, the row opens to the note's height and its text rises back. */
  private unfold(id: string, delay: number) {
    const it = this.items.get(id)!;
    const s = this.shape.get(id)!;
    const spans = spansOf(it.full);
    gsap.killTweensOf([it.el, it.rule, ...spans]);
    const from = it.el.getBoundingClientRect().height;
    const atRest = it.el.hasAttribute("data-folded");
    it.full.removeAttribute("hidden");
    it.el.removeAttribute("data-folded");
    it.el.setAttribute("data-moving", "");
    gsap.set(it.el, { height: "auto" });
    const to = it.el.getBoundingClientRect().height;
    gsap.set(it.el, { height: from });
    if (atRest) gsap.set(spans, { yPercent: 100, opacity: 0 });
    gsap.to(it.rule, { opacity: 0, duration: 0.15 });
    gsap.to(it.el, {
      height: to,
      marginTop: s.margin,
      duration: FOLD,
      ease: EASE.inout,
      delay,
      onComplete: () => {
        it.el.removeAttribute("data-moving");
        it.el.removeAttribute("data-thin");
        gsap.set(it.el, { clearProps: "height" });
      },
    });
    gsap.to(spans, { yPercent: 0, opacity: 1, duration: DUR.reveal, ease: EASE.reveal, delay: delay + 0.12, stagger: 0.04 });
  }

  /** Still folded (or still open), only its place in a run changed. */
  private reshape(id: string) {
    const it = this.items.get(id)!;
    const s = this.shape.get(id)!;
    it.el.toggleAttribute("data-thin", s.thin);
    gsap.to(it.el, { marginTop: s.margin, duration: FOLD, ease: EASE.inout, overwrite: "auto" });
  }

  /** The line stays as the header; its notes, or its months, rise under it one after another. */
  private expand(g: Group) {
    this.sync(g.id);
    const body = g.body;
    const to = body.getBoundingClientRect().height;
    body.setAttribute("data-moving", "");
    gsap.fromTo(body, { height: 0 }, {
      height: to,
      duration: FOLD,
      ease: EASE.inout,
      onComplete: () => {
        body.removeAttribute("data-moving");
        gsap.set(body, { clearProps: "height" });
      },
    });
    this.kids(g.id).forEach((el, i) => this.rise(el, 0.1 + Math.min(i, 10) * STAGGER));
  }

  private collapse(g: Group) {
    const body = g.body;
    gsap.killTweensOf(body);
    const spans = spansOf(body);
    body.setAttribute("data-moving", "");
    gsap.to(spans, { yPercent: 100, opacity: 0, duration: 0.25, ease: "power2.in", overwrite: "auto" });
    gsap.fromTo(body, { height: body.getBoundingClientRect().height }, {
      height: 0,
      duration: 0.45,
      ease: EASE.inout,
      delay: 0.08,
      onComplete: () => {
        body.setAttribute("hidden", "until-found");
        body.removeAttribute("data-moving");
        gsap.set(body, { clearProps: "height" });
        gsap.set(spans, { clearProps: "transform,opacity" });
      },
    });
  }

  private kids(id: string): HTMLElement[] {
    const notes = (this.lists.get(id) ?? []).map((i) => this.items.get(i)!.el);
    const lines = [...this.groups.values()].filter((c) => c.parent === id).map((c) => c.line);
    return [...notes, ...lines];
  }

  /** One note or line rising through its masks; a folded note draws its rule instead. */
  private rise(el: HTMLElement, delay: number) {
    if (el.hasAttribute("data-folded")) {
      gsap.fromTo(el.querySelector(".note-rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: EASE.tab, delay });
      return;
    }
    gsap.fromTo(spansOf(el), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: DUR.reveal, ease: EASE.reveal, delay, stagger: 0.04 });
  }

  /** The entrance: whatever is in view rises, top down, as the column always has. */
  enter(view: DOMRect) {
    const inView = [...this.items.values()]
      .map((it) => it.el)
      .concat([...this.groups.values()].map((g) => g.line))
      .filter((el) => {
        if (el.closest("[hidden]")) return false;
        const r = el.getBoundingClientRect();
        return r.bottom > view.top && r.top < view.bottom;
      })
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .slice(0, ENTER_COUNT);
    inView.forEach((el, i) => this.rise(el, 0.15 + i * STAGGER));
  }

  /** The run of folded notes a note belongs to, in order. */
  run(id: string): string[] {
    const it = this.items.get(id);
    if (!it || !this.shape.get(id)?.folded) return [];
    const ids = this.lists.get(it.c)!;
    let a = ids.indexOf(id);
    let b = a;
    while (a > 0 && this.shape.get(ids[a - 1])!.folded) a--;
    while (b < ids.length - 1 && this.shape.get(ids[b + 1])!.folded) b++;
    return ids.slice(a, b + 1);
  }

  /** Lifts a run's rules while the pointer is on it. */
  hot(ids: string[]) {
    this.hotRun.forEach((id) => this.items.get(id)?.el.removeAttribute("data-hot"));
    ids.forEach((id) => this.items.get(id)?.el.setAttribute("data-hot", ""));
    this.hotRun = ids;
  }

  /** One stop per run for the keyboard, named for what it holds. */
  private mark() {
    for (const ids of this.lists.values()) {
      ids.forEach((id, i) => {
        const row = this.items.get(id)!.row;
        const lead = this.shape.get(id)!.folded && (i === 0 || !this.shape.get(ids[i - 1])!.folded);
        row.tabIndex = lead ? 0 : -1;
        if (lead) {
          const said = runLabel(this.run(id).map((r) => BY_ID.get(r)!));
          row.removeAttribute("aria-hidden");
          row.setAttribute("aria-label", `Unfold ${said.charAt(0).toLowerCase()}${said.slice(1)}`);
        } else {
          row.setAttribute("aria-hidden", "true");
          row.removeAttribute("aria-label");
        }
      });
    }
  }

  destroy() {
    for (const it of this.items.values()) gsap.killTweensOf([it.el, it.rule, ...spansOf(it.full)]);
    for (const g of this.groups.values()) gsap.killTweensOf([g.body, ...spansOf(g.line)]);
  }
}

/** A sentence's pieces as inline text, its tags as buttons: for the sediment's lines. */
function Inline({ pieces }: { pieces: readonly Piece[] }) {
  return pieces.map((p, i) => (
    <Fragment key={p.key}>
      {i > 0 && !p.glue ? " " : ""}
      {p.kind === "tag" ? (
        <button type="button" className="notes-tag" data-tag={p.tag}>
          {p.tag}
        </button>
      ) : p.kind === "word" ? (
        p.text
      ) : null}
    </Fragment>
  ));
}

const NewDot = () => (
  <>
    <i className="note-new" aria-hidden="true" />
    <span className="sr-only">New since your last visit. </span>
  </>
);

type EntryProps = { n: Note; c: string; fresh: boolean; pressed: string | null };

/** One note (or log line), and the row it folds into. Drawn once; Folds keeps its shape. */
const Entry = memo(function Entry({ n, c, fresh, pressed }: EntryProps) {
  const tags = n.tags.map((t, i) => (
    <Fragment key={t}>
      {i > 0 ? "  " : ""}
      <button type="button" className="note-tag" data-tag={t} aria-pressed={pressed === t}>
        {t}
      </button>
    </Fragment>
  ));
  return (
    <article id={ANCHORS.get(n.id)} data-id={n.id} data-c={c} className={n.kind === "log" ? "note note-log" : "note"}>
      <div className="note-full">
        {fresh && <NewDot />}
        {n.kind === "log" ? (
          <p className="mask">
            <span>
              <time dateTime={n.date}>{dot(n.date)}</time>
              {"  "}
              {tags}
              {"  "}
              {n.body}
            </span>
          </p>
        ) : (
          <>
            <div className="mask note-meta-mask">
              <span className="note-meta">
                <time dateTime={n.date} className="note-date">
                  {dot(n.date)}
                </time>
                <span className="note-tags">{tags}</span>
              </span>
            </div>
            <p className="mask note-body">
              <span>{n.body}</span>
            </p>
          </>
        )}
      </div>
      <button type="button" className="note-row" tabIndex={-1} aria-hidden="true">
        <i className="note-rule" style={{ "--w": `${ruleWidth(n)}px` } as CSSProperties} />
      </button>
    </article>
  );
});

type GroupProps = {
  id: string;
  parent: string | null;
  kind: "month" | "year";
  label: string;
  open: boolean;
  fresh: boolean;
  pieces: Piece[];
  none: boolean;
  children: ReactNode;
};

/** A folded month or year: its line in the log's voice, and the body it opens into. */
function Group({ id, parent, kind, label, open, fresh, pieces, none, children }: GroupProps) {
  const cut = pieces.findIndex((p) => p.kind === "tag");
  const words = cut < 0 ? pieces : pieces.slice(0, cut);
  const rest = cut < 0 ? [] : pieces.slice(cut);
  return (
    <div className="notes-group" data-g={id} data-parent={parent ?? undefined} data-kind={kind}>
      <div className="notes-line" data-toggle={id} data-none={none ? "" : undefined}>
        {fresh && <NewDot />}
        <span className="mask">
          <span>
            <button type="button" className="notes-fold" aria-expanded={open}>
              {label}
              {"  "}
              <span className="notes-count">
                <Inline pieces={words} />
              </span>
            </button>
            {rest.length > 0 && " "}
            <Inline pieces={rest} />
          </span>
        </span>
      </div>
      <div className="notes-body">
        <div className="notes-inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * Notes: plain DOM inside the sliding panel, not a canvas, so the text can be
 * selected, searched and linked. One centred column in a scroll container;
 * two glass rims at the top and bottom dissolve text as it leaves.
 *
 * The head is the index, one sentence written from the tags; each tag word
 * filters, and typing anywhere finds. Notes that do not match fold into
 * hairlines as long as they were, so the gaps between his psychology notes
 * are drawn to scale. Past NOTES_FOLD_AFTER, older months and years settle
 * into one line each.
 */
export function NotesPanel() {
  const stage = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const folds = useRef<Folds | null>(null);
  const cursor = useRef<CursorLabel | null>(null);
  /** The next apply is set, not moved: the browser's find already opened it. */
  const instant = useRef(false);

  const [today] = useState(() => localDay(Date.now()));
  const [settled] = useState(() => settle(new Date()));
  const [lastVisit] = useState(() => lastVisitDay(Date.now()));
  const [landing] = useState(() => byAnchor(decodeURIComponent(window.location.hash.slice(1))));
  const [tag, setTag] = useState(readTag);
  const [query, setQuery] = useState("");
  const [field, setField] = useState(false);
  const [more, setMore] = useState(false);
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(() => (landing ? new Set([landing.id]) : EMPTY));
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(landing ? groupsOf(landing, settled) : []));
  /** Groups closed by hand while finding, which finding would otherwise hold open. */
  const [shut, setShut] = useState<ReadonlySet<string>>(EMPTY);

  const finding = query.trim() !== "";
  const match = useMemo(() => matcher(tag, query), [tag, query]);
  const count = useMemo(() => ENTRIES.filter(match).length, [match]);
  const folded = useMemo(
    () => (tag || finding ? new Set(ENTRIES.filter((n) => !match(n) && !unfolded.has(n.id)).map((n) => n.id)) : EMPTY),
    [tag, finding, match, unfolded],
  );
  const months = useMemo(() => [...settled.months, ...settled.years.flatMap((y) => y.months)], [settled]);
  // While finding, the months that hold a match open by themselves.
  const shown = useMemo(() => {
    if (!finding) return open;
    const s = new Set(open);
    for (const m of months) {
      if (!m.entries.some(match)) continue;
      if (!shut.has(m.id)) s.add(m.id);
      if (m.year && !shut.has(m.year)) s.add(m.year);
    }
    return s;
  }, [finding, open, shut, months, match]);

  const mode = field || finding ? "find" : tag ? "tag" : "index";
  const pieces = mode === "find" ? findSentence(query, count, tag) : mode === "tag" ? tagSentence(tag!, count) : indexSentence(today, more);

  // The column is drawn; set every fold, land on the hash, and rise what is in view.
  useLayoutEffect(() => {
    const scrollEl = scroll.current!;
    const columnEl = column.current!;
    setFlag("pageReady", true);
    const f = new Folds(columnEl);
    folds.current = f;
    f.init(folded, shown);
    if (landing) {
      const el = document.getElementById(ANCHORS.get(landing.id)!);
      if (el) scrollEl.scrollTop = Math.max(0, el.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top - FIRST_Y);
    }
    if (!prefersReducedMotion()) f.enter(scrollEl.getBoundingClientRect());
    return () => {
      f.destroy();
      folds.current = null;
    };
    // The first state only; later changes go through apply below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    folds.current?.apply(folded, shown, !instant.current && !prefersReducedMotion());
    instant.current = false;
  }, [folded, shown]);

  /** Keeps `el` where it is on screen while the column folds around it. */
  const hold = (el: HTMLElement | null) => {
    const s = scroll.current;
    if (!el || !s) return;
    const top = el.getBoundingClientRect().top;
    const tick = () => {
      const d = el.getBoundingClientRect().top - top;
      if (Math.abs(d) >= 1) s.scrollTop += d;
    };
    gsap.ticker.add(tick);
    gsap.delayedCall(FOLD + 0.8, () => gsap.ticker.remove(tick));
  };

  const toTop = () => {
    const s = scroll.current;
    if (!s || s.scrollTop < 1) return;
    if (prefersReducedMotion()) s.scrollTop = 0;
    else gsap.to(s, { scrollTop: 0, duration: 0.7, ease: EASE.inout, overwrite: true });
  };

  const filter = (next: string | null, keep: HTMLElement | null = null) => {
    hold(keep);
    setTag(next);
    setUnfolded(EMPTY);
    writeTag(next);
  };

  const find = (q: string) => {
    if (!finding && q.trim()) toTop();
    setQuery(q);
    setUnfolded(EMPTY);
    setShut(EMPTY);
  };

  /** Letters typed anywhere land in the sentence's field, which then takes the rest itself. */
  const type = (q: string) => {
    flushSync(() => {
      setField(true);
      find(q);
    });
    const el = input.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(q.length, q.length);
  };

  const stopFinding = () => {
    setQuery("");
    setField(false);
    setUnfolded(EMPTY);
    setShut(EMPTY);
    input.current?.blur();
  };

  const clearAll = () => {
    stopFinding();
    filter(null);
  };

  /** The lead word opens the field; on a phone this is the way in, with the keyboard. */
  const openField = () => {
    flushSync(() => setField(true));
    input.current?.focus({ preventScroll: true });
  };

  const toggle = (id: string) => {
    const close = shown.has(id);
    setOpen((prev) => {
      const s = new Set(prev);
      if (close) s.delete(id);
      else s.add(id);
      return s;
    });
    setShut((prev) => {
      const s = new Set(prev);
      if (close) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  const unfoldRun = (id: string) => {
    const run = folds.current?.run(id) ?? [];
    folds.current?.hot([]);
    cursor.current?.set(null);
    setUnfolded((prev) => new Set([...prev, ...run]));
  };

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const tagEl = t.closest<HTMLElement>("[data-tag]");
    if (tagEl) {
      const next = tagEl.dataset.tag!;
      filter(tag === next ? null : next, tagEl.closest<HTMLElement>(".note, .notes-line"));
      return;
    }
    const row = t.closest<HTMLElement>(".note-row");
    if (row) {
      unfoldRun(row.closest<HTMLElement>(".note")!.dataset.id!);
      return;
    }
    const line = t.closest<HTMLElement>("[data-toggle]");
    if (line) toggle(line.dataset.toggle!);
  };

  // Hovering a run names it in the cursor label; the lead word says it can be typed into.
  const onOver = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const t = e.target as HTMLElement;
    const row = t.closest<HTMLElement>(".note-row");
    if (row) {
      const run = folds.current?.run(row.closest<HTMLElement>(".note")!.dataset.id!) ?? [];
      folds.current?.hot(run);
      cursor.current?.set(run.length ? runLabel(run.map((id) => BY_ID.get(id)!)) : null);
      return;
    }
    folds.current?.hot([]);
    cursor.current?.set(t.closest(".notes-lead") && !field ? "Type to find" : null);
  };
  const onLeave = () => {
    folds.current?.hot([]);
    cursor.current?.set(null);
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (window.location.pathname !== "/notes" || getFlags().transitioning) return;
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (t?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
    if (e.key === "Escape") {
      if (field || query) stopFinding();
      else if (tag) filter(null);
      return;
    }
    if (e.key === "Backspace") {
      if (!query) return;
      e.preventDefault();
      type(query.slice(0, -1));
      return;
    }
    if (e.key.length !== 1) return;
    // The page keeps its space bar, and Firefox its quick find, until something is being typed.
    if (!query && (e.key === " " || e.key === "/" || e.key === "'")) return;
    if (e.key === " " && t?.closest("button, a")) return;
    e.preventDefault();
    type(query + e.key);
  });

  const onHash = useEffectEvent(() => {
    const n = byAnchor(decodeURIComponent(window.location.hash.slice(1)));
    if (!n) return;
    instant.current = true;
    flushSync(() => {
      setOpen((prev) => new Set([...prev, ...groupsOf(n, settled)]));
      setShut(EMPTY);
      if (folded.has(n.id)) setUnfolded((prev) => new Set([...prev, n.id]));
    });
    const s = scroll.current;
    const el = document.getElementById(ANCHORS.get(n.id)!);
    if (!s || !el) return;
    const to = Math.max(0, s.scrollTop + el.getBoundingClientRect().top - s.getBoundingClientRect().top - FIRST_Y);
    if (prefersReducedMotion()) s.scrollTop = to;
    else gsap.to(s, { scrollTop: to, duration: 0.8, ease: EASE.inout, overwrite: true });
  });

  // The browser's find reached folded text: open what holds it, at once, before it scrolls there.
  const onFound = useEffectEvent((e: Event) => {
    const t = e.target as HTMLElement;
    const note = t.classList.contains("note-full") ? t.closest<HTMLElement>(".note") : null;
    const group = t.classList.contains("notes-body") ? t.closest<HTMLElement>(".notes-group") : null;
    if (!note && !group) return;
    instant.current = true;
    flushSync(() => {
      if (note) setUnfolded((prev) => new Set([...prev, note.dataset.id!]));
      if (group) {
        setOpen((prev) => new Set([...prev, group.dataset.g!]));
        setShut((prev) => {
          const s = new Set(prev);
          s.delete(group.dataset.g!);
          return s;
        });
      }
    });
  });

  useEffect(() => {
    const columnEl = column.current!;
    cursor.current = new CursorLabel(label.current!, stage.current!);
    const key = (e: KeyboardEvent) => onKey(e);
    const hash = () => onHash();
    const found = (e: Event) => onFound(e);
    window.addEventListener("keydown", key);
    window.addEventListener("hashchange", hash);
    columnEl.addEventListener("beforematch", found, true);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("hashchange", hash);
      columnEl.removeEventListener("beforematch", found, true);
      cursor.current?.destroy();
      cursor.current = null;
    };
  }, []);

  const fresh = (n: Note) => lastVisit !== null && n.date > lastVisit;
  const entry = (n: Note, c: string) => <Entry key={n.id} n={n} c={c} fresh={fresh(n)} pressed={tag && n.tags.includes(tag) ? tag : null} />;
  const group = (g: { id: string; label: string; entries: Note[] }, kind: "month" | "year", parent: string | null, children: ReactNode) => {
    const s = summary(g.entries, tag, query, match);
    return (
      <Group key={g.id} id={g.id} parent={parent} kind={kind} label={g.label} open={shown.has(g.id)} fresh={fresh(g.entries[0])} pieces={s.pieces} none={s.none}>
        {children}
      </Group>
    );
  };
  const month = (m: (typeof months)[number], parent: string | null) => group(m, "month", parent, m.entries.map((n) => entry(n, m.id)));

  return (
    <section ref={stage} className="stage stage-notes">
      <div ref={scroll} className="notes-scroll">
        <div ref={column} className="notes-column" onClick={onClick} onPointerOver={onOver} onPointerLeave={onLeave}>
          <p className="notes-head">
            <button type="button" className="notes-lead" onClick={openField}>
              <span className="mask">
                <span>Notes</span>
              </span>
              <span className="sr-only"> (find)</span>
            </button>
            {pieces.map((p, i) => {
              const k = `${mode}/${p.key}`;
              const d = { "--d": `${mode === "find" ? 0 : Math.min(i, 8) * 0.03}s` } as CSSProperties;
              const gap = i > 0 && !p.glue ? " " : "";
              if (p.kind === "word")
                return (
                  <Fragment key={k}>
                    {gap}
                    <span className="mask">
                      <span style={d}>{p.text}</span>
                    </span>
                  </Fragment>
                );
              if (p.kind === "field")
                return (
                  <Fragment key={k}>
                    {gap}
                    <span className="mask notes-field">
                      <span style={d}>
                        ‘
                        <span className="notes-q" data-v={query}>
                          <input
                            ref={input}
                            value={query}
                            size={1}
                            aria-label="Find in notes"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            enterKeyHint="search"
                            onChange={(e) => find(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") stopFinding();
                              else if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            onBlur={(e) => {
                              if (!e.currentTarget.value.trim()) stopFinding();
                            }}
                          />
                        </span>
                        {p.end}
                      </span>
                    </span>
                  </Fragment>
                );
              const text = p.kind === "tag" ? p.tag : p.kind === "more" ? p.text : "All notes.";
              const onPress = p.kind === "more" ? () => setMore(true) : p.kind === "all" ? clearAll : undefined;
              return (
                <Fragment key={k}>
                  {gap}
                  <button type="button" className="notes-tag" data-tag={p.kind === "tag" ? p.tag : undefined} onClick={onPress}>
                    <span className="mask">
                      <span style={d}>{text}</span>
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </p>

          <div className="notes-list">{settled.recent.map((n) => entry(n, "recent"))}</div>

          {(settled.months.length > 0 || settled.years.length > 0) && (
            <div className="notes-sediment">
              {settled.months.map((m) => month(m, null))}
              {settled.years.map((y) => group(y, "year", null, y.months.map((m) => month(m, y.id))))}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {mode === "index" ? "" : plain(pieces, query)}
      </p>
      <div className="notes-rim notes-rim-top" aria-hidden="true" />
      <div className="notes-rim notes-rim-bottom" aria-hidden="true" />
      <div ref={label} className="cursor-label" />
    </section>
  );
}
