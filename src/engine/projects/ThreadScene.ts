import * as THREE from "three";
import gsap from "gsap";
import type { Text, TextRenderInfo } from "troika-three-text";
import { AIR_OPEN, sfx } from "@/audio/sfx";
import { statusWord, type Media, type Project, type SpaceItem } from "@/content/site";
import { GL } from "@/engine/common/color";
import { loadImage, loadMedia, makeRenderer, upload, type Loaded } from "@/engine/common/loader";
import { FONT, makeText, syncText } from "@/engine/common/text";
import { EdgeGlass } from "./edgeGlass";

/** What the pointer rests on: a project's mark or one of its pieces, or a study. */
export type ThreadTarget = { kind: "project"; project: Project } | { kind: "study"; piece: SpaceItem };

export type ThreadOptions = {
  heading: { lead: string; tail: string };
  reducedMotion?: boolean;
  /** What is chosen, and whether the pointer chose it (the keys and taps choose too). */
  onHover(target: ThreadTarget | null, byPointer: boolean): void;
  /** A project unspooled (its slug belongs in the URL), or the thread wound back in (null). */
  onOpen(project: Project | null): void;
  /**
   * Whether this page is the one on screen, at rest. A horizon that comes
   * taut after the visitor has left for another tab is not plucked.
   */
  isCurrent?(): boolean;
  /**
   * The line the page sets under the heading (Work's link to Skills): where it goes, the
   * heading's centre and the foot of its words (px), and how much ink it has, told whenever
   * either changes. It rises with the heading's words and yields whenever the heading does, and
   * to the whole supernova, whose covers come out just under it.
   */
  onHeading?(foot: { x: number; y: number }, ink: number): void;
};

/** A text and the box it rises out of: the site's masked entrance, done in troika. */
type Masked = {
  t: Text;
  box: [number, number, number, number];
  base: THREE.Vector2;
  /** -1: rises from below. 1: falls from above (a dead project's verdict). */
  dir: 1 | -1;
  offset: number;
  /** The offset that hides the text completely. */
  span: number;
};

type Piece = {
  bead: Bead;
  /** 0 is the cover; the rest are the project's pieces in file order. */
  index: number;
  aspect: number;
  /** Height on the ball, px at R_REF: the cover largest. */
  h: number;
  /** The piece's centre along the thread from its mark, and above the thread, px at R_REF. */
  along: number;
  up: number;
  /** Past MANY projects a mark hangs only its cover and two pieces; the rest wait for the unspool. */
  onBall: boolean;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  still: Loaded;
  /** A video piece's video, or the cover's hover media, fetched when the project opens. */
  moving: Promise<Loaded | null> | null;
  movingMedia: Media | null;
  /** It has reached its frame in this unspool: it ticked as it landed. */
  landed: boolean;
  /** Last frame's rect on screen (centre and size), its depth and ink: the hit test reads these. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  sz: number;
  ink: number;
  /** Its longitude on the ball, radians, while the whirr needs it: it crosses the front where angle + lon is a whole turn. */
  lon: number;
  /** In the supernova's field: its centre from its cover's (unturned) and its size, px. Null: it stays in the knot. */
  field: { x: number; y: number; w: number; h: number } | null;
};

type Bead = {
  project: Project | null;
  study: SpaceItem | null;
  year: number;
  /** 1: its work hangs outward and its tick stands north. -1: dead, hung inward, the tick hanging south. */
  side: 1 | -1;
  /** The mark, as a (fractional) sample index along the thread. */
  i: number;
  /** Its stretch of thread: its share of its year, in sample indices. */
  i0: number;
  i1: number;
  pieces: Piece[];
  /** 0 → 1 as the thread reaches it in the reveal. */
  pop: number;
  popped: boolean;
  /** 0 → 1 while it is the one hovered: its stretch goes to full ink. */
  hl: number;
  dot: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | null;
  cap: { name: Masked; status: Masked; why: Masked };
  /** How far its caption has stepped down, px, to clear its own pieces hanging low on the ball. */
  capDy: number;
  open: { name: Masked; status: Masked; why: Masked; summary: Masked; link: Masked } | null;
  /** The mark on screen last frame, and its depth. */
  mx: number;
  my: number;
  mz: number;
  crossed: number;
  /** In a supernova's return: how late in the pull it sets off for home (see NOVA_PULL_LAG), and whether it has docked. */
  lag: number;
  docked: boolean;
};

/**
 * A project's place in the supernova's field: its cover's slot (centre, px),
 * the seeded way it lies there and drifts, the way its pieces fly out of the
 * knot, its knot's bounds round the cover's centre (px, unturned), and where
 * its hover caption stands.
 */
type Slot = {
  x: number;
  y: number;
  jx: number;
  jy: number;
  rot: number;
  amp: number;
  w1: number;
  w2: number;
  p1: number;
  p2: number;
  dirX: number;
  dirY: number;
  reach: number;
  tumble: number;
  box: [number, number, number, number];
  /**
   * Its hover caption: set after its knot (read from the left), before it
   * (from the right), or centred under or over it; where it stands (its
   * block's top, and its left, right or middle), px from the cover's centre as
   * it drifts, or on the screen where it is `fixed` (in the room kept for it
   * under the sheet); and how wide its line may run.
   */
  cap: "after" | "before" | "under" | "over";
  capX: number;
  capY: number;
  fixed: boolean;
  capW: number;
  /** Its year's numeral, if it is that year's first project. */
  year: Masked | null;
  /** Its place in date order: later work lies on top. */
  rank: number;
};

/** A piece's place in the supernova's field this frame: centre, size and turn (px, radians), ink, and its project's rank. */
type Pose = { x: number; y: number; w: number; h: number; rot: number; ink: number; rank: number };

/** A cover's knot in the field at R_REF: its members' centres from its cover's, its bounds round that centre, its cover's height, and whether its year starts there. */
type Knot = { b: Bead; parts: { pc: Piece; x: number; y: number; w: number; h: number }[]; box: [number, number, number, number]; coverH: number; year: boolean };

/**
 * A contact sheet: its rows in reading order, each knot (by its place in date
 * order) at its x along its row, to its left edge; each row's reach over and
 * under its covers' centres; its size, gap and scale.
 */
type Sheet = { lines: { i: number; x: number }[][]; up: number[]; down: number[]; w: number; h: number; gap: number; scale: number };

/** The field chosen for a screen: its sheet, the height it was fitted into, and whether the caption's room is kept under it. */
type FieldChoice = { sheet: Sheet; bh: number; foot: boolean };

/** Where an opened project lies: along is x on a wide screen, y on a phone. */
type Layout = {
  vertical: boolean;
  /** The line's y (wide) or x (phone), px. */
  line: number;
  mark: number;
  /** Where the stretch's two ends land, off screen. */
  start: number;
  end: number;
  /** Frame centres (along, across) and sizes, px; across is the absolute other coordinate. */
  frames: { along: number; across: number; w: number; h: number }[];
  /** How far the content runs along the line, px; past the viewport it scrolls. */
  length: number;
};

/** The heading's line on a phone, where the horizon had it and where Notes and Music set theirs. */
const HEADING_Y = 206;
/**
 * Below this height a phone's heading climbs toward the tab bar, about half
 * a pixel for each pixel lost, so a short one still has room for the ball
 * and its caption under it.
 */
const SHORT = 600;
const SHORT_CLIMB = 0.55;
const HEADING_MIN = 80;
const HEADING_CLEAR = 24;
/**
 * The tab pills' foot (the bar sits 8px down and its pills are 27px tall).
 * On a wide screen the heading and the ball stand together between it and
 * the page's foot, with as much room over the heading as under the ball.
 */
const NAV_FOOT = 35;
/** The tab bar's foot, with a little air: nothing of an opened project rises past it. */
const NAV_CLEAR = 56;
/** What an opened project leaves free at the bottom edge. */
const OPEN_BOTTOM = 24;
/** The smallest ball, when even the heading's climb leaves too little room. */
const D_MIN = 96;
/**
 * A wide screen whose caption-under ball would come out smaller than this
 * sets the caption beside the ball instead, left-aligned, as long as it can
 * be at least SIDE_MIN_W wide with SIDE_EDGE to spare.
 */
const SIDE_FROM = 160;
const SIDE_MIN_W = 160;
const SIDE_EDGE = 24;
const SIDE_BOTTOM = 24;
/**
 * Room kept over the ball for the loose end and the pieces near the top, at
 * R_REF. The loose end holds still now, so a wide screen needs less of it; a
 * phone keeps the room it always had.
 */
const TOP_ROOM = 48;
const PHONE_TOP_ROOM = 64;
/** The radius every px size on the ball is drawn at; the ball scales them with it. */
const R_REF = 210;
/** A wide screen's ball wants this share of its short side, up to D_MAX, before the fit. */
const D_SHARE = 0.62;
const D_MAX = 720;
/** A ball with room to spare stands centred this share of the way down the screen. */
const SIT = 0.54;
const PHONE = 640;
const PHONE_D = 0.88;
/**
 * On a wide screen the ball may reach down into the caption's slot, which is
 * empty most of the time: the fit counts only this share of the caption's
 * height, and the veil thins the rings under a caption when one shows.
 */
const CAP_FIT = 0.25;
/** A bigger ball keeps its pieces, ticks and curves in proportion only so far: pieces to 1.35 times, ticks to 30px. */
const PIECE_MAX = 1.35;
const TICK_MAX = 30;
/** Past this radius the thread is sampled twice as finely, so its tight turns near the poles stay round. */
const FINE_FROM = 300;
const GROWTH_MAX = 1.4;
const TURNS_PER_YEAR = 1.5;
/** However short the history, the thread is wound at least this many turns, so a year or two of work is still a ball. */
const TURNS_LEAST = 9;
/** Each turn's lean, radians at the equator, and how fast the lean walks round (cycles per turn). */
const WOBBLE = 0.16;
const WOBBLE_RATE = 0.618;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** The axis leans toward you, so the top turns read as rings and the ball as a ball. */
const TILT = THREE.MathUtils.degToRad(15);
const IDLE = THREE.MathUtils.degToRad(6); // rad/s
/** The camera's distance in radii: a little perspective, so the near side swells. */
const FOCAL = 6;
const NORM = Math.sqrt(FOCAL * FOCAL - 1) / FOCAL;
/** Arc between thread samples on the unit sphere: about 3px at R_REF. */
const STEP = 0.014;
const BACK_INK = 0.25;
const DIM = 0.35;
const TICK = 24;
const BREATHE = 4; // the alive tick reaches 28
const BREATHE_PERIOD = 2.4;
const LOOSE = 40;
const COVER_H = 56;
const PIECE_H = [40, 36, 38, 36, 40, 36];
const STUDY_H = 38;
/** Between the thread and a piece's near edge, and how far out (in, for dead work) it hangs. */
const HANG_GAP = 8;
const HANG_OUT = 14;
const ROW_LEAD = 12;
const ROW_GAP = 8;
const MARK_GAP = 40;
const CAP_GAP = 32;
const NAME_SIZE = 22;
const STATUS_SIZE = 11;
const WHY_SIZE = 14;
const WHY_MAX = 450;
const DEAD_INK = 0.7;
// The unspooled line: the horizon again.
const LINE_Y = 0.58;
const LINE_X = 0.38;
const FRAME_H = 240;
const FRAME_MIN = 132;
const FRAME_GAP = 24;
const FRAME_OFF = 40;
const MARGIN = 96;
const PHONE_TEXT_INSET = 36;
const PHONE_FRAME_W = 168;
const MARK_LEAD = 40;
const OPEN_DUR = 2.1;
const CLOSE_DUR = 0.9;
/** A click this soon after opening is the rest of a double click, ms. */
const DOUBLE_CLICK = 400;
/**
 * The horizon is plucked as it comes taut. Its note is how long the project
 * ran, in whole years, on the bed's F G A C D, a longer run a lower note:
 * under a year D4, one year C4, two A3, three G3, four or more F3. The data
 * holds one year a project: living work has run from it to now; closed work
 * (paused, shipped, dead) ran from its earliest dated piece to that year,
 * which is one year unless its pieces are dated earlier.
 */
const PLUCK_HZ = [293.66, 261.63, 220, 196, 174.61];
/**
 * Living work (all but dead, which hangs inward) rings for PLUCK_RING
 * seconds with a standing wave of PLUCK_WAVE px, its nodes at the mark and
 * the far end. Its half wave is PLUCK_HALF px at D4, longer as the note
 * falls, and it sways at the note's frequency over PLUCK_SLOW. Dead work
 * thuds: one twitch toward its hanging frames, PLUCK_TWITCH seconds long.
 */
const PLUCK_RING = 2.4;
const PLUCK_WAVE = 1;
const PLUCK_HALF = 180;
const PLUCK_SLOW = 32;
const PLUCK_TWITCH = 0.14;
/** Wound back in, the line goes slack and its ring stops over this long, seconds. */
const PLUCK_SLACK = 0.2;
/**
 * How much later the ends of the stretch leave the ball than its mark: at
 * 2.6 about a third of the stretch is in the air at once, so the peel has a
 * tip that travels, and what is behind it lies straight.
 */
const SPREAD = 2.6;
/** A riding piece reaches its frame once the thread there is this far off the ball (0..1): on the straight. */
const RIDE_LIFT = 0.92;
/** The shortest ride, in unspool progress, so the cover grows into its frame rather than snapping. */
const RIDE_MIN = 0.2;
const RECEDE_INK = 0.15;
const RECEDE_PIECE_INK = 0.07;
/** Behind an opened project the ball goes back to 86%, and never larger than the 361px it always receded to, so the words keep their room. */
const RECEDE_SCALE = 0.86;
const RECEDE_D = 361;
/**
 * Under an opened project's words the receded ball thins to this share of
 * its ink, over a soft edge, so the words are read on the dark and not
 * through the rings.
 */
const VEIL_INK = 0.2;
const VEIL_PAD = 14;
const VEIL_FEATHER = 44;
/**
 * Under a hover caption the same veil, closer and shorter, so that where the
 * ball reaches into the caption's slot the words sit on the dark. The chosen
 * project's own pieces are what the words are about, so the veil takes less
 * of them: only what lies under each line of words, within CAP_LINE_PAD.
 * There it takes as much as it takes of anything else: at half its ink a
 * bright cover still swallowed the 11px status line.
 */
const CAP_VEIL_PAD = 12;
const CAP_VEIL_FEATHER = 20;
const CAP_LINE_PAD = 4;
const CAP_LINE_FEATHER = 12;
/** A caption steps down to clear its own pieces by this much, while it stays this far off the bottom edge. */
const CAP_CLEAR = 12;
const CAP_FOOT = 24;
/**
 * The way from a mark down to its caption crosses bare rings, where nothing
 * is chosen, and on a crowded ball other marks. A pointer heading for the
 * caption keeps the choice this long, ms, so the caption is still there to be
 * clicked, and a click on the way is a click on it. Heading for it: it moved
 * within CAPTION_AIM_MS, and the line from where it left the mark (once it is
 * CAPTION_AIM_MIN px long) passes within CAPTION_CONE of the words, padded by
 * CAPTION_AIM px. Over another mark it holds only while the pointer is still
 * in flight, its moves over the last CAPTION_AIM_TAU ms or so (or its last
 * move, while it gathers pace) faster than CAPTION_FLING px/ms, since one
 * slowing there has chosen that mark; or while it has not yet gone
 * CAPTION_AIM_MIN px from where it left.
 */
const CAPTION_GRACE = 350;
const CAPTION_AIM = 24;
const CAPTION_AIM_MIN = 6;
const CAPTION_AIM_MS = 120;
const CAPTION_AIM_TAU = 50;
const CAPTION_CONE = Math.PI / 6;
const CAPTION_FLING = 0.25;
/** A piece on the ball fades out before it crosses this margin at the screen's sides: a phone's ball nearly fills the width. */
const SIDE_MARGIN = 16;
/** Past this many projects a mark hangs only its cover and two pieces. */
const MANY = 24;
/** From this many, only marks on the front half hang pieces at all. */
const CROWD = 40;
/** Past this many projects the hung pieces start to shrink. */
const CROWD_FROM = 12;

// The supernova's charge (milestone A): spin the ball hard enough, for long enough, and it pulls in.
/**
 * The threshold is a surface speed, |ω|·R, px/s, so a bigger ball is no
 * harder: 3.33 rad/s at R_REF, within 5% of 33⅓ rpm.
 */
const NOVA_S0 = 700;
/**
 * Only the hand counts, never the ball coasting: a drag that moved within
 * NOVA_DRAG_MS, a wheel over the ball within NOVA_WHEEL_MS (not trackpad
 * momentum), or an arrow held past NOVA_KEY_MS, which then spins the ball
 * freely, NOVA_KEY_ACCEL rad/s² up to NOVA_KEY_MAX rad/s.
 */
const NOVA_DRAG_MS = 120;
/**
 * A finger's flick is over in a tenth of a second, where a mouse's drag
 * lasts: on touch the drag counts for this long after it last moved, so
 * three to five hard flicks set it off on a phone (three at an easy pace,
 * more in a rush or far apart), and one is a near miss.
 */
const NOVA_FLICK_MS = 220;
const NOVA_WHEEL_MS = 150;
const NOVA_KEY_MS = 800;
const NOVA_KEY_ACCEL = 2.5;
const NOVA_KEY_MAX = 6.5;
/**
 * Each px of wheel turns the ball WHEEL_TURN rad/s faster, to WHEEL_MAX, as
 * ever; over the ball the most is lifted to NOVA_WHEEL_MAX·S0 (never below
 * WHEEL_MAX, so a big ball's wheel is the one it always was). A notched
 * mouse wheel can still spin it past S0, so it is known by its steps rather
 * than held back by its speed: see byHand.
 */
const NOVA_WHEEL_MAX = 1.6;
const WHEEL_TURN = 0.0025;
const WHEEL_MAX = 4;
/**
 * A wheel's run: steps of one sign, each within NOVA_RUN_GAP ms of the last.
 * Trackpad momentum only ever falls or holds (whole pixels come in pairs),
 * where a finger's steps, steady or gathering pace, grow on the one before
 * now and then. Two ways a step is the hand. A push: it plainly grows past
 * the lowest since the last push, by NOVA_RISE_BY and NOVA_RISE_PX, in size
 * and in pace (px/ms, so a few steps a busy page sums into one, a frame
 * late, keep their pace) alike; each swipe's first steps count so, straight
 * out of the last one's momentum. And a stream: a step grows when it is
 * bigger than the last and quicker, and the step after it keeps
 * NOVA_RUN_HOLD of it or more (after a sum that came early the steps fall
 * straight back); NOVA_RUN_PROOF of those make the run the hand, and every
 * step of it counts, so a finger held steady keeps counting. Either lasts
 * until NOVA_RUN_FALLS have fallen with none grown between: momentum, the
 * ball coasting.
 */
const NOVA_RUN_GAP = 120;
const NOVA_RISE_BY = 1.1;
const NOVA_RISE_PX = 2;
const NOVA_RUN_HOLD = 0.75;
const NOVA_RUN_PROOF = 2;
const NOVA_RUN_FALLS = 4;
/**
 * A trackpad sends its steps as a stream, one a frame; a notched wheel, a
 * step a notch, however hard it is spun: a run counts only while its steps
 * come NOVA_STREAM_MS apart or closer, on average.
 */
const NOVA_STREAM_MS = 22;
/**
 * A wheel step this big (px) that comes the same size as the last, or a
 * whole multiple of it, is a notch; so is one that shares a notch this big
 * with the last (see notched).
 */
const NOVA_NOTCH = 40;
/**
 * The charge c (0..1) rises at NOVA_RISE + NOVA_RISE_MORE·min(1, (S − S0)/S0)
 * a second while driven at S0 or more, and drains at NOVA_DRAIN otherwise.
 * Between strokes, the ball still turning at S0 or more within
 * NOVA_BETWEEN_MS of the hand leaving it, it neither rises nor drains, so
 * flicks in a row add up (three to five hard ones on a phone) while one
 * flick, or a trackpad's momentum, only ever lets go.
 */
const NOVA_RISE = 0.35;
const NOVA_RISE_MORE = 0.65;
const NOVA_DRAIN = 0.6;
const NOVA_BETWEEN_MS = 400;
/** The point of no return: from here it finishes by itself, spinning at S0 at least. */
const NOVA_COMMIT = 0.8;
/**
 * A skater pulling her arms in: R_eff = R·(1 − NOVA_PULL·c), and the spin
 * drawn is ω·(R/R_eff)², to NOVA_SPIN_MAX times.
 */
const NOVA_PULL = 0.45;
const NOVA_SPIN_MAX = 3.3;
/** At full charge: the far side's ink, the pieces' size and ink, and the heading's ink. */
const NOVA_BACK_INK = 0.5;
const NOVA_PIECE_SCALE = 0.6;
const NOVA_PIECE_INK = 0.6;
const NOVA_HEADING = 0.5;
/** The tick's playbackRate at full charge: faster and higher, never louder. */
const NOVA_RATE = 1.25;
/** The tick as a project's mark crosses the front, at rest and in the whirr alike. */
const MARK_TICK = 0.6;
/**
 * From NOVA_WHIRR_FROM the marks' own ticks move onto the audio clock, and a
 * train adds a tick as each piece, and each turn of the thread, crosses the
 * front. Marks and all, it is thinned to about NOVA_WHIRR_MAX a second at
 * full charge whatever the ball holds, no two ticks nearer than
 * NOVA_WHIRR_APART s (the tick has died away by then; nearer, two would sum
 * to a louder one), and placed NOVA_WHIRR_AHEAD s ahead of the ball at a time.
 */
const NOVA_WHIRR_FROM = 0.5;
const NOVA_WHIRR_MAX = 40;
const NOVA_WHIRR_APART = 0.01;
const NOVA_WHIRR_AHEAD = 0.06;
const NOVA_WHIRR_GAIN = [0.2, 0.35] as const;
/** After the ball is back (or a charge is cut off past the point of no return) the charge is capped at NOVA_COOL_CAP for NOVA_COOL ms: it tightens a little and lets go. */
const NOVA_COOL = 25000;
const NOVA_COOL_CAP = 0.35;
/**
 * When the cooldown ends (performance.now() ms). It outlives the scene: the
 * panel is built afresh after every slide, and a trip to About and back is
 * not 25 seconds.
 */
let novaCoolUntil = 0;
/**
 * Let go short of the point of no return, the ball opens again and over,
 * to 1 + NOVA_SIGH of its size, and settles: a sigh. A near miss
 * (NOVA_SIGH_FULL, one hard flick) sighs in full; a smaller charge less.
 */
const NOVA_SIGH = 0.03;
const NOVA_SIGH_FULL = 0.15;
const NOVA_SIGH_BACK = 0.7;
/**
 * Pulled in this far (the most the cooldown allows), or past the point of no
 * return, the ball chooses nothing: it is the one thing happening. Below it,
 * a tap just after a flick chooses as ever.
 */
const NOVA_QUIET = 0.35;

// The supernova's collapse, burst, float and return (milestone B).
/**
 * The supernova tells the page where it has got to: a window CustomEvent
 * named NOVA_EVENT, its detail `{ phase }`, once as each phase begins.
 * "charge": the ball starts to pull in. "collapse": full charge, the ball
 * drops to a knot. "burst": the ring, the bloom, the pieces flying out.
 * "float": the covers have settled into their field. "return": the pull
 * home begins (or a cover was chosen and everything gathers). "idle": at rest
 * again, after a sigh or a return. Made for the spacesuit companion, which
 * squints as the ball charges, holds its breath at the collapse and watches
 * the covers.
 */
export const NOVA_EVENT = "eigengrau:nova";
export type NovaPhase = "idle" | "charge" | "collapse" | "burst" | "float" | "return";
/** At full charge the ball drops to a knot NOVA_KNOT px across over NOVA_DROP s (power4.in), and the ticks stop dead. */
const NOVA_KNOT = 8;
const NOVA_DROP = 0.3;
/** Then NOVA_STILL s of stillness and silence, the knot trembling by NOVA_TREMBLE px: a moving hold, not a freeze. */
const NOVA_STILL = 0.25;
const NOVA_TREMBLE = 1;
/** The burst comes this long after the collapse, s. */
const NOVA_BURST = NOVA_DROP + NOVA_STILL;
/** From the collapse nothing the visitor does counts for this long, s. */
const NOVA_DEAF = 1.2;
/**
 * One 1px ink ring out of the knot, past 0.75 of the screen's diagonal (to
 * NOVA_RING_REACH of it) over NOVA_RING_DUR s, outCubic, its ink falling from
 * NOVA_RING_INK to nothing. No flash, particles, glow or shake: it rhymes
 * with the ring that opens the site.
 */
const NOVA_RING_REACH = 0.8;
const NOVA_RING_DUR = 1.2;
const NOVA_RING_INK = 0.5;
const NOVA_RING_POINTS = 256;
/**
 * The thread survives as one ribbon. Each sample flies out along the way it
 * faced at the collapse plus NOVA_SWIRL of its spin's tangent, scaled by low
 * frequency noise along the thread (fbm of i·NOVA_GRAIN), so neighbours move
 * together and the turns crumple into filaments, each also bent up to
 * NOVA_CRUMPLE radians off its way. How far: the blast wave's r ∝ t^0.4
 * (eased to a stop over NOVA_BLAST_T), out to NOVA_BLAST of the screen's
 * long side.
 */
const NOVA_SWIRL = 0.6;
const NOVA_GRAIN = 0.004;
const NOVA_CRUMPLE = 1;
const NOVA_BLAST = 0.55;
const NOVA_BLAST_T = 0.5;
/** As they settle the filaments fade to NOVA_FILAMENT of the ink and keep on expanding, by NOVA_CREEP over NOVA_CREEP_T s or so, turning a few degrees. */
const NOVA_FILAMENT = 0.3;
const NOVA_CREEP = 0.03;
const NOVA_CREEP_T = 6;
const NOVA_DRIFT_TURN = 0.05;
/**
 * The filaments and the ring reach past the top edge, and the tab bar must
 * not change: their ink is gone at the pills' foot (NAV_FOOT) and back in
 * full NAV_FADE px under it, so no line runs between the pills.
 */
const NAV_FADE = 44;
/** The pieces fly out along their beads' ways and settle into the field over NOVA_SETTLE s, grown to size by NOVA_GROW s. */
const NOVA_SETTLE = 1.5;
const NOVA_GROW = 0.45;
/**
 * The field: a loose contact sheet in reading order by date, oldest top
 * left. Below the heading (FIELD_TOP under its foot: y = 240 under a
 * one-line heading at 206, wherever the page's balance puts it), FIELD_EDGE
 * inside the viewport's edges (FIELD_PHONE_EDGE on a phone, its gutters),
 * and no more than FIELD_AREA of the viewport.
 */
const FIELD_TOP = 23;
const FIELD_EDGE = 48;
const FIELD_PHONE_EDGE = 16;
const FIELD_AREA = 0.45;
/**
 * Covers show at FIELD_SCALE of their size on the ball, each with its pieces
 * as they hung beside it. Past MANY projects only the covers fly (the rest
 * go into the knot and wait for the return); past FIELD_ROWS_FROM, and on a
 * phone, covers show at 1.0x, and past FIELD_ROWS_FROM they lie in year
 * rows: each year starts a row of its own while the room holds that many,
 * and past it the years run on in reading order, a new one starting on the
 * row the last ended in when all of it fits there, FIELD_YEAR_GAP gaps along.
 * Either way a year longer than a row runs on to the next.
 */
const FIELD_SCALE = 1.3;
const FIELD_ROWS_FROM = 30;
const FIELD_YEAR_GAP = 2;
/** The sheet's shape: the room's, this much wider, since it is read across in rows. */
const FIELD_WIDE = 1.25;
/** Between slots: FIELD_GAP of the cover's height plus FIELD_GAP_PX, and never less than FIELD_GAP_MIN. */
const FIELD_GAP = 0.6;
const FIELD_GAP_PX = 24;
const FIELD_GAP_MIN = 12;
/**
 * A contact sheet left on a table, not a grid: each cover lies within
 * FIELD_JITTER px and FIELD_TURN of its slot (seeded by its slug, so it lies
 * the same way every time) and drifts FIELD_DRIFT_SPEED px/s within
 * FIELD_DRIFT px of there. On a tight sheet all three come down with the gap.
 */
const FIELD_JITTER = 16;
const FIELD_TURN = THREE.MathUtils.degToRad(5);
const FIELD_DRIFT = 8;
const FIELD_DRIFT_SPEED = [3, 6] as const;
/** The tumble a piece has left as it leaves the knot, radians, gone by the time it settles. */
const FIELD_TUMBLE = 0.5;
/**
 * Choosing the sheet tries every layout, which with a lot of work is too
 * slow for the collapse's first frames: so it is worked out ahead, at most
 * FIELD_SLICE ms a frame while the ball is itself (see planAhead), and kept
 * for each screen (its size, the work's count, the layout they give and
 * each cover's knot, as the pictures that loaded make it), up to FIELD_KEEP
 * of them, past the scene, which is built afresh after every slide. Where
 * the captions stand is worked out the same way, over the frames after the
 * collapse (see placeCaptions).
 */
const FIELD_SLICE = 2;
const FIELD_KEEP = 16;
const fieldChoices = new Map<string, FieldChoice>();
/** A faint grotesk year numeral at each year's first project, YEAR_GAP px over its cover. */
const YEAR_SIZE = 11;
const YEAR_INK = 0.4;
const YEAR_GAP = 6;
/**
 * The hover caption stands CAP_BESIDE px clear of its cover's knot, and of
 * every other knot and numeral: beside it where it has CAP_BESIDE_MIN px
 * (its line wrapping to fit), else under or over it (see fieldCaptions).
 */
const CAP_BESIDE = 16;
const CAP_BESIDE_MIN = 200;
/** The heading's tail while the covers are out. */
const NOVA_WAIT = "Give them a minute.";
/**
 * The float ends by itself after NOVA_STILLNESS s with nothing moving on the
 * stage (NOVA_PHONE_FLOAT on a phone), and after NOVA_FLOAT_MAX s at most,
 * unless the pointer or the keys have chosen a cover: then it waits, and goes
 * NOVA_FLOAT_GRACE s after the choice is let go. A finger's choice is never
 * let go, so it waits for nothing: the phone's float is NOVA_PHONE_FLOAT s
 * from the last touch.
 */
const NOVA_STILLNESS = 6;
const NOVA_PHONE_FLOAT = 5;
const NOVA_FLOAT_MAX = 12;
const NOVA_FLOAT_GRACE = 1.5;
/** While the covers are out the bed goes through the wall: a NOVA_AIR Hz lowpass, closing over NOVA_AIR_IN s. */
const NOVA_AIR = 700;
const NOVA_AIR_IN = 1.2;
/**
 * The slow return, as a magnet draws filings in: everything out in the field
 * (the thread's filaments, the covers and their pieces) is pulled back toward
 * the ball at once, over NOVA_WIND s, nothing wound. Each is slow to leave
 * and gathers speed as it closes (magnet, below), and what lies nearest the
 * centre sets off first: the furthest out waits NOVA_PULL_LAG of the pull,
 * the rest in proportion, and each takes the rest of it (1 - NOVA_PULL_LAG)
 * to come home. A project docks with its tick at NOVA_DOCK_TICK as its cover
 * lands. Then the ball swells to 1 + NOVA_OVER of its size and settles over
 * NOVA_OVER_BACK.
 */
const NOVA_WIND = 3.4;
const NOVA_PULL_LAG = 0.25;
const NOVA_DOCK_TICK = 0.35;
/**
 * Two projects of one year can dock within a frame of each other, and
 * play() drops a tick within 40ms of the last: so each dock tick is placed
 * on the audio clock at least NOVA_DOCK_APART s after the one before, and
 * every project is heard.
 */
const NOVA_DOCK_APART = 0.05;
const NOVA_OVER = 0.04;
const NOVA_OVER_BACK = 0.8;
/** A cover chosen in the field gathers everything in NOVA_GATHER s (the same pull, quicker), then opens. */
const NOVA_GATHER = 1.2;
/** A new drag during the return hurries what is left of it into NOVA_HURRY s. */
const NOVA_HURRY = 0.6;
/** A wheel counts in the field only after a pause this long, ms: the stream that spun the ball, and its momentum, never ends the float. */
const NOVA_WHEEL_FRESH = 250;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const outCubic = (t: number) => 1 - (1 - t) ** 3;
/** A magnet's pull over its time, 0..1: it drifts off gently, gathers speed as it closes (fastest past halfway) and lands softly. */
const magnet = (t: number) => t * t * (2 - t * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** The share of the supernova's ink kept at a height, px: none under the tab bar (see NAV_FADE). */
const navFade = (y: number) => smooth(clamp01((y - NAV_FOOT) / NAV_FADE));
/** The far side of the thread falls to a quarter of the ink: a wire ball, not a disc. A charging ball's far side brightens. */
const depthInk = (z: number, back = BACK_INK) => back + (1 - back) * smooth(clamp01((z + 0.85) / 1.7));
const blockBounds = (t: Text): [number, number, number, number] => t.textRenderInfo?.blockBounds ?? [0, 0, 0, 0];
/**
 * Which scene last took each canvas, by number (a canvas has only the one
 * context to give; see dispose). A number, so a canvas kept alive never keeps
 * a whole scene alive with it.
 */
const owners = new WeakMap<HTMLCanvasElement, number>();
let scenes = 0;

/** The year as a number with its fraction: 25 September 2026 is about 2026.73. */
function fractionalYear(d: Date) {
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  return y + (d.getTime() - start) / (end - start);
}

/**
 * Whether two wheel steps in a row are a notched wheel's: one a whole
 * multiple of the other, or both whole multiples of one step NOVA_NOTCH px
 * or bigger. A page busy drawing sums the steps of a wheel spun free into
 * one a frame, two notches and then three, and the two need not divide.
 */
function notched(m: number, last: number) {
  if (Math.abs(m / last - Math.round(m / last)) < 1e-3) return true;
  let x = Math.max(m, last);
  let y = Math.min(m, last);
  while (y >= NOVA_NOTCH) {
    const rest = x % y;
    if (Math.min(rest, y - rest) < y * 1e-3) return true;
    x = y;
    y = rest;
  }
  return false;
}

/** Smooth value noise on a line, 0..1. */
function noise1(x: number) {
  const hash = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i), hash(i + 1), f * f * (3 - 2 * f));
}

/** Four octaves of it, 0..1: low frequency noise with some grain, so neighbours along the thread move together. */
function fbm(x: number) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += amp * noise1(x);
    norm += amp;
    x *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}

/** A repeatable random sequence, 0..1, seeded by a string: a project lies the same way in the field every time. */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- the thread's ink

const lineVert = /* glsl */ `
attribute float aEdge;
attribute float aInk;
varying float vEdge;
varying float vInk;
void main() {
  vEdge = aEdge;
  vInk = aInk;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** A 1 CSS px line with a one device pixel ramp each side, whatever the pixel ratio. */
const lineFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uHalf;
uniform float uDpr;
varying float vEdge;
varying float vInk;
void main() {
  float d = abs(vEdge) * uHalf * uDpr;
  float cover = clamp(0.5 * uDpr + 0.5 - d, 0.0, 1.0);
  gl_FragColor = vec4(uColor, vInk * cover);
}`;

/**
 * Screen-space ribbons: every polyline handed in becomes a strip 1px wide,
 * rebuilt each frame from points the CPU already projected. WebGL lines are
 * one device pixel, which is half a CSS pixel on a retina screen: too thin
 * to read as thread.
 */
class Ribbons {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private pos: Float32Array;
  private edge: Float32Array;
  private ink: Float32Array;
  private index: Uint32Array;
  private nv = 0;
  private ni = 0;
  private half = 1;

  constructor(
    material: THREE.ShaderMaterial,
    readonly capacity: number,
  ) {
    this.pos = new Float32Array(capacity * 2 * 3);
    this.edge = new Float32Array(capacity * 2);
    this.ink = new Float32Array(capacity * 2);
    this.index = new Uint32Array(capacity * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aEdge", new THREE.BufferAttribute(this.edge, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aInk", new THREE.BufferAttribute(this.ink, 1).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(this.index, 1).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.frustumCulled = false;
  }

  begin(half: number) {
    this.nv = 0;
    this.ni = 0;
    this.half = half;
  }

  /** Points from..to (inclusive) of arrays that already hold each point's unit normal. */
  strip(xs: Float32Array, ys: Float32Array, ink: Float32Array, nx: Float32Array, ny: Float32Array, from: number, to: number) {
    const count = to - from + 1;
    if (count < 2 || this.nv + count > this.capacity) return;
    const h = this.half;
    const v0 = this.nv;
    const pos = this.pos;
    for (let k = from; k <= to; k++) {
      const v = this.nv++;
      const x = xs[k];
      const y = -ys[k];
      const ox = nx[k] * h;
      const oy = -ny[k] * h;
      const o = v * 6;
      pos[o] = x + ox;
      pos[o + 1] = y + oy;
      pos[o + 2] = 0;
      pos[o + 3] = x - ox;
      pos[o + 4] = y - oy;
      pos[o + 5] = 0;
      this.edge[v * 2] = 1;
      this.edge[v * 2 + 1] = -1;
      this.ink[v * 2] = ink[k];
      this.ink[v * 2 + 1] = ink[k];
    }
    const idx = this.index;
    for (let s = 0; s < count - 1; s++) {
      const a = (v0 + s) * 2;
      const n = this.ni;
      idx[n] = a;
      idx[n + 1] = a + 1;
      idx[n + 2] = a + 2;
      idx[n + 3] = a + 1;
      idx[n + 4] = a + 3;
      idx[n + 5] = a + 2;
      this.ni += 6;
    }
  }

  end() {
    const g = this.mesh.geometry;
    (["position", "aEdge", "aInk"] as const).forEach((n) => {
      const attr = g.getAttribute(n) as THREE.BufferAttribute;
      attr.clearUpdateRanges();
      attr.addUpdateRange(0, this.nv * 2 * attr.itemSize);
      attr.needsUpdate = true;
    });
    const idx = g.getIndex()!;
    idx.clearUpdateRanges();
    idx.addUpdateRange(0, this.ni);
    idx.needsUpdate = true;
    g.setDrawRange(0, this.ni);
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}

/** Small polylines (ticks, rings, the loose end, connectors): their own scratch arrays and normals. */
class Scratch {
  x: Float32Array;
  y: Float32Array;
  a: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
  n = 0;
  constructor(readonly capacity = 64) {
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.a = new Float32Array(capacity);
    this.nx = new Float32Array(capacity);
    this.ny = new Float32Array(capacity);
  }
  reset() {
    this.n = 0;
  }
  push(x: number, y: number, a: number) {
    if (this.n >= this.capacity) return;
    this.x[this.n] = x;
    this.y[this.n] = y;
    this.a[this.n] = a;
    this.n++;
  }
  normals(closed = false) {
    fillNormals(this.x, this.y, this.nx, this.ny, this.n, closed);
  }
}

function fillNormals(xs: Float32Array, ys: Float32Array, nx: Float32Array, ny: Float32Array, n: number, closed = false) {
  let px = 0;
  let py = -1;
  for (let k = 0; k < n; k++) {
    const a = closed ? (k - 1 + n) % n : Math.max(0, k - 1);
    const b = closed ? (k + 1) % n : Math.min(n - 1, k + 1);
    const dx = xs[b] - xs[a];
    const dy = ys[b] - ys[a];
    const l = Math.hypot(dx, dy);
    if (l > 1e-6) {
      px = -dy / l;
      py = dx / l;
    }
    nx[k] = px;
    ny[k] = py;
  }
}

// ---------------------------------------------------------------- the pieces

const pieceVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * A billboard: the still, crossfaded by uMix to the moving media once a
 * project opens; faded by depth, and softly blurred when it hangs inside.
 * Under a hover caption it thins by uVeilK, only where it lies within
 * uVeilPad of the words (uVeil, CSS px) and over a uVeilSoft edge, so a big
 * cover half under a caption keeps its other half. The chosen project's own
 * pieces thin by uLineK instead, and only under the words themselves, line
 * by line, so a cover beside a short name keeps its colour.
 */
const pieceFrag = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uAlt;
uniform float uMix;
uniform float uMapAspect;
uniform float uAltAspect;
uniform float uPlaneAspect;
uniform float uFade;
uniform float uBlur;
uniform vec4 uVeil;
uniform vec4 uLineName;
uniform vec4 uLineStatus;
uniform vec4 uLineWhy;
uniform float uVeilK;
uniform float uLineK;
uniform float uVeilPad;
uniform float uVeilSoft;
uniform float uLinePad;
uniform float uLineSoft;
uniform float uDpr;
uniform float uViewH;
varying vec2 vUv;
float near(vec4 r, vec2 p, float pad, float soft) {
  vec2 d = max(max(r.xy - pad - p, 0.0), p - r.zw - pad);
  return 1.0 - smoothstep(0.0, soft, length(d));
}
float veil() {
  if (uVeilK + uLineK < 0.001) return 1.0;
  vec2 p = vec2(gl_FragCoord.x / uDpr, uViewH - gl_FragCoord.y / uDpr);
  float line = max(near(uLineName, p, uLinePad, uLineSoft), max(near(uLineStatus, p, uLinePad, uLineSoft), near(uLineWhy, p, uLinePad, uLineSoft)));
  // The two shares hand over as one (they always add up to the whole veil), so the words'
  // ground never brightens while a piece changes from one to the other.
  return 1.0 - uVeilK * near(uVeil, p, uVeilPad, uVeilSoft) - uLineK * line;
}
vec2 fit(vec2 uv, float img, float plane) {
  vec2 s = vec2(1.0);
  if (img > plane) s.x = plane / img; else s.y = img / plane;
  return (uv - 0.5) * s + 0.5;
}
vec3 tap(vec2 uv) {
  vec3 a = texture2D(uMap, fit(uv, uMapAspect, uPlaneAspect)).rgb;
  if (uMix < 0.001) return a;
  return mix(a, texture2D(uAlt, fit(uv, uAltAspect, uPlaneAspect)).rgb, uMix);
}
void main() {
  vec3 c;
  if (uBlur < 0.001) {
    c = tap(vUv);
  } else {
    float r = uBlur * 0.05;
    float d = r * 0.7071;
    c = tap(vUv) * 0.2
      + (tap(vUv + vec2(r, 0.0)) + tap(vUv - vec2(r, 0.0)) + tap(vUv + vec2(0.0, r)) + tap(vUv - vec2(0.0, r))) * 0.1
      + (tap(vUv + vec2(d, d)) + tap(vUv - vec2(d, d)) + tap(vUv + vec2(d, -d)) + tap(vUv - vec2(d, -d))) * 0.1;
  }
  gl_FragColor = vec4(c, uFade * veil());
}`;

/** The still a piece shows on the ball: an image, or a video's poster. */
const stillOf = (m: Media) => (m.kind === "video" ? m.poster : m.src);

/**
 * Projects (tab 2): the wound horizon. The horizon's one ink line, wound
 * into a small ball of thread: a spherical spiral from his first year at the
 * bottom pole to now at the top, arc length in proportion to time, so an
 * empty year is bare thread and a busy one is knotted with work. Each
 * project is a mark on the thread at its year, in the horizon's grammar,
 * with its pieces hanging off it; opening one unspools its stretch of thread
 * back into a horizon for that project alone.
 *
 * Everything is projected on the CPU into CSS px and drawn with an
 * orthographic camera (world y = -px), so the ball and the straight line are
 * the same points in two places, and the unspool is a blend between them.
 */
export class ThreadScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
  /** The opened project's texts: they travel with the line when it scrolls. */
  private openGroup = new THREE.Group();
  private beads: Bead[] = [];
  private order: Bead[] = [];
  private pieces: Piece[] = [];
  /** The heading: its lead, its tail, and the tail that stands in while the supernova's covers are out. */
  private heading: { lead: Masked; tail: Masked; wait: Masked } | null = null;
  /** The stand-in tail is showing, or rising. */
  private waitShown = false;
  private headingTwoLines = false;
  private headingDimmed = false;
  private lineMat: THREE.ShaderMaterial;
  private back: Ribbons | null = null;
  private front: Ribbons | null = null;
  private scratch = new Scratch();
  /** The supernova's ring: round at any size. */
  private ringScratch = new Scratch(NOVA_RING_POINTS + 1);
  /** The glass rims: the standing line on a phone scrolls through them, as the old horizon did. */
  private glass: EdgeGlass;
  private lastScroll = 0;
  private dotGeo = new THREE.CircleGeometry(1, 20);
  private planeGeo = new THREE.PlaneGeometry(1, 1);
  /** Scratch for blending a sample toward the unleaning thread, and for the whirr's marks. */
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();

  // The thread: M samples on the unit sphere, evenly spaced along it, and their tangents.
  /** The arc between samples: STEP, or half of it on a big ball. */
  private arcStep = STEP;
  private M = 0;
  private P = new Float32Array(0);
  private TG = new Float32Array(0);
  /**
   * The same thread wound with no lean (WOBBLE 0), sample for sample, and its
   * tangents: a charging ball's thread blends toward it by `bend`, so its
   * rings come true and parallel.
   */
  private P0 = new Float32Array(0);
  private TG0 = new Float32Array(0);
  private bend = 0;
  /** How many turns the thread makes, pole to pole: each one ticks in the whirr. */
  private turns = 1;
  private T0 = 0;
  private T1 = 1;
  // This frame, per sample: screen position, depth, ink, normal; and which bead's stretch it is.
  private SX = new Float32Array(0);
  private SY = new Float32Array(0);
  private SZ = new Float32Array(0);
  private SA = new Float32Array(0);
  private NX = new Float32Array(0);
  private NY = new Float32Array(0);
  private lifted = new Float32Array(0);
  private owner = new Int16Array(0);
  /** Each sample's way out of the supernova's knot, px per px of blast radius (see novaWays). */
  private BX = new Float32Array(0);
  /** In a supernova's return: how late in the pull each sample sets off (see pullLags). */
  private lags = new Float32Array(0);
  private BY = new Float32Array(0);
  /** Its share of the blast and the bend off its way, from noise along the thread: fixed for a thread, so worked out as it is wound. */
  private BS = new Float32Array(0);
  private BB = new Float32Array(0);
  /** The supernova's field: each project's slot, and the year numerals that head each year's first. */
  private field = new Map<Bead, Slot>();
  private fieldGen = 0;
  /** The field's bounds, px: no knot lies or drifts past them. */
  private fieldBox = { x0: 0, y0: 0, x1: 1, y1: 1 };
  /** The tallest cover caption at the width the field sets them (see layout), which the sheet keeps room for. */
  private fieldCapH = 0;
  /** The sheet being worked out ahead, for the screen `key` names (see planAhead); and the layout it was last done for. */
  private fieldSearch: { key: string; run: Generator<void, FieldChoice> } | null = null;
  private planned = 0;
  /** Where the captions stand in the field, still being worked out (see placeCaptions). */
  private captionsRun: Generator<void, void> | null = null;
  private years: { year: number; m: Masked }[] = [];
  /** A piece's place in the field this frame (see fieldPose): scratch. */
  private pose: Pose = { x: 0, y: 0, w: 0, h: 0, rot: 0, ink: 0, rank: 0 };
  /** The knot's tremble, px, added to every point projected off the ball. */
  private shake = { x: 0, y: 0 };

  // Layout, CSS px.
  private width = 1;
  private height = 1;
  private R = 200;
  private cx = 0;
  private cy = 0;
  private capY = 0;
  /** The heading's line, as the last layout set it. */
  private headY = HEADING_Y;
  /** The caption stands beside the ball (a wide, short screen) from this x, rather than under it. */
  private capSide = false;
  private capX = 0;
  /** A resize can start a layout while the last one waits on its texts: only the newest places anything. */
  private layoutGen = 0;
  /** The last layout to finish placing everything. */
  private laidOut = 0;

  // Motion.
  private angle = 0;
  private yaw = 0;
  private targetYaw = 0;
  private vel = 0;
  /** The idle spin's share: 1 turns at IDLE. Reduced motion starts (and stays) at 0. */
  private idleK: number;
  /** A press: where and when it last moved, whether it has become a drag, when it began (ms), and whether it set the supernova's return going. */
  private drag: { x: number; y: number; t: number; moved: boolean; at: number; own: boolean } | null = null;
  private turning: gsap.core.Tween | null = null;
  private clock = 0;
  private draw = { value: 0 };
  private cursorOn = false;
  private rot = { ca: 1, sa: 0, ct: Math.cos(TILT), st: Math.sin(TILT) };

  // Hover and the open project.
  private hovered: Bead | null = null;
  private dim = 0;
  private pointerAt: { x: number; y: number } | null = null;
  /**
   * The pointer's way, px/ms, averaged over its last moves (see
   * CAPTION_AIM_TAU); the speed of its last move alone, which the average
   * trails while it gathers pace; and when it last moved, ms.
   */
  private aim = { vx: 0, vy: 0, last: 0, t: -Infinity };
  /** Where the pointer was last seen on the chosen mark: the way to the caption is measured from there. */
  private leftFrom: { x: number; y: number } | null = null;
  /** Off its mark and on its way to the caption, a choice holds until this time, ms (0: no grace running). */
  private graceUntil = 0;
  /** The keys chose something: it holds until the pointer next moves. */
  private keyHold = false;
  private opened: Bead | null = null;
  private layoutO: Layout | null = null;
  private unspool = { p: 0 };
  /** Reduced motion: the open state crossfades in over 0.3s instead of unspooling. */
  private fadeIn = { value: 0 };
  private openTl: gsap.core.Timeline | null = null;
  private afterClose: (() => void) | null = null;
  /** Winding back in: a second click on the same project turns it round. */
  private closing = false;
  /** When the open project began to unspool, ms. */
  private openedAt = -Infinity;
  /** The opened horizon's pluck: when (on the scene's clock), its note, and whether it only thuds. */
  private plucked: { at: number; hz: number; dead: boolean } | null = null;
  /** Stops the pluck's sound while it still rings (null: none rings, or sound is off). */
  private ring: ((over?: number) => void) | null = null;
  private scroll = { cur: 0, target: 0, max: 0 };
  private caseHot = false;
  private caseLift = { v: 0 };
  private coverHot: Piece | null = null;
  /** The opened project's words on screen, padded, and how far the ball has thinned under them (0..1). */
  private veil = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };
  /** The same for the hover caption's words (not padded), eased so that a caption giving way to another never jumps. */
  private capVeil = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };
  /** And the heading's, while the supernova's filaments reach across it. */
  private headVeil = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };
  /** How far the filaments have gone from under the tab bar (0..1): see NAV_FADE. */
  private navVeil = { k: 0 };
  /** The caption veil as the pieces' shader reads it: the uniforms every piece shares, the lines eased as the box is. */
  private pieceVeil = {
    uVeil: { value: new THREE.Vector4() },
    uLineName: { value: new THREE.Vector4() },
    uLineStatus: { value: new THREE.Vector4() },
    uLineWhy: { value: new THREE.Vector4() },
    uVeilPad: { value: CAP_VEIL_PAD },
    uVeilSoft: { value: CAP_VEIL_FEATHER },
    uLinePad: { value: CAP_LINE_PAD },
    uLineSoft: { value: CAP_LINE_FEATHER },
    uDpr: { value: 1 },
    uViewH: { value: 1 },
  };

  /**
   * The supernova: its charge (see NOVA_S0 on), then its collapse, burst,
   * float and return (see NOVA_EVENT on). `c` is the charge; `peak` the most
   * it reached since it last sighed; `committed` past the point of no
   * return; `coolUntil` when the cooldown ends. When the hand last drove it at S0 or
   * more, last dragged it (and whether with a finger) and last wheeled it
   * over the ball (ms); the way it last turned. The held arrow: which, since
   * when (ms), its free spin's speed and whether it has begun. The wheel's run
   * (see byHand): its last step, when, and at what pace (px/ms), falls since
   * one grew, whether it is a proven stream (not yet, or coasting), its
   * steps' spacing (ms, eased), the last step if it grew, how many growths
   * have held, and the lowest step since the last push, with its pace. The
   * sigh's swell: its size now, how far
   * into it (s, -1: none), how big and how long it takes to go out. The
   * whirr: whether it has the marks' ticks, the angle its ticks are placed
   * up to and the way, the ball's drawn spin (rad/s, eased), the trains still
   * to sound with when they end, when every tick lately placed or played
   * sounds (s, on the audio clock), and until when (ms) the marks' ticks
   * are its own. Then the phase, and the seconds since the collapse on the
   * supernova's own clock; the ball's angle and lean at the collapse, which
   * it comes back to, and the way it was spinning; the ball's size beyond
   * the charge (the knot, the return's swell); how far the charge has the
   * heading dimmed; whether the burst has happened, and the numerals risen;
   * when the stage was last touched, the float began and a cover was last
   * chosen (s); the pull home; a project chosen too early to gather to yet; the
   * bloom still to sound; whether the bed is through the wall; when the last
   * dock tick sounds (s, on the audio clock); when the wheel last turned (ms, so a new stream is known) and when the ball
   * collapsed (ms: a press from before it is the hand that spun it).
   */
  private nova = {
    c: 0,
    peak: 0,
    committed: false,
    /** When the cooldown ends (ms): novaCoolUntil, which outlives the scene. */
    get coolUntil() {
      return novaCoolUntil;
    },
    set coolUntil(t: number) {
      novaCoolUntil = t;
    },
    drove: -Infinity,
    dragAt: -Infinity,
    finger: false,
    wheelAt: -Infinity,
    sign: 1,
    key: { dir: 0, at: 0, spin: 0, free: false },
    run: { t: -Infinity, d: 0, pace: 0, falls: 0, hand: false, gap: 0, grew: 0, proved: 0, floor: 0, floorPace: 0 },
    swell: { v: 0, t: -1, amount: 0, out: 0 },
    whirring: false,
    placed: null as number | null,
    placedDir: 0,
    lastA: 0,
    whirl: 0,
    trains: [] as { cancel: () => void; until: number }[],
    heard: [] as number[],
    marksUntil: 0,
    phase: "idle" as NovaPhase,
    t: 0,
    a0: 0,
    y0: 0,
    spin: 1,
    shape: 1,
    head: 0,
    burst: false,
    yearsUp: false,
    touched: 0,
    floatAt: 0,
    chosenAt: -Infinity,
    /**
     * Whether the pointer has moved since the covers came out and the deaf
     * moment passed. A pointer left where the spin ended would otherwise
     * choose whichever cover settled under it, and a chosen cover holds the
     * float, so the stillness would never run out: until it moves, it
     * chooses nothing. The arrows and a tap choose as ever.
     */
    pointed: false,
    wind: { at: 0, span: NOVA_WIND, over: true, u: 0, to: null as Bead | null, hurried: false },
    pendingTo: null as Bead | null,
    bloom: null as (() => void) | null,
    airShut: false,
    dockAt: 0,
    lastWheel: -Infinity,
    collapsedAt: Infinity,
    /** The thread's lean at the collapse (see bend): a thread sampled afresh mid-supernova finds its ways out from it. */
    bend0: 1,
    /** Until when the bed's wall is still opening, on the supernova's clock (s): a hurried return opens it sooner. */
    airUntil: -Infinity,
  };
  /** The heading's ink as an opened project leaves it (see dimHeading); a charge takes it down further. */
  private headInk = { v: 1 };
  private headInkSet = 1;
  /** The line under the heading: its ink, yielding or back (see onHeading), and what it was last told. */
  private underInk = 1;
  private underTold = "";

  private ready = false;
  private disposed = false;
  private serial = ++scenes;
  private pendingOpen: string | null = null;
  private intro: gsap.core.Timeline | null = null;
  private ctx = gsap.context(() => undefined);
  private ticker: (t: number, dt: number) => void;
  /** Off screen (its tab kept but not shown): no frames at all, so it picks up where it was when shown again. */
  paused = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private projects: Project[],
    private items: SpaceItem[],
    private opts: ThreadOptions,
  ) {
    this.renderer = makeRenderer(canvas);
    owners.set(canvas, this.serial);
    this.idleK = opts.reducedMotion ? 0 : 1;
    this.camera.position.z = 10;
    this.lineMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: GL.ink }, uHalf: { value: 1 }, uDpr: { value: 1 } },
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // A strip's winding follows the thread's direction on screen, so either face may show.
      side: THREE.DoubleSide,
    });
    this.scene.add(this.openGroup);
    this.glass = new EdgeGlass(this.renderer, 60, 60, "y");
    this.measure();
    this.ticker = (_t, dtMs) => {
      if (!this.paused) this.frame(Math.min(dtMs, 64) / 1000);
    };
    gsap.ticker.add(this.ticker);
  }

  private get vertical() {
    return this.width < PHONE;
  }

  private dur(s: number) {
    return this.opts.reducedMotion ? 0 : s;
  }

  private measure() {
    this.width = this.canvas.clientWidth || 1;
    this.height = this.canvas.clientHeight || 1;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.left = 0;
    this.camera.right = this.width;
    this.camera.top = 0;
    this.camera.bottom = -this.height;
    this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.lineMat.uniforms.uDpr.value = dpr;
    this.lineMat.uniforms.uHalf.value = 0.5 + 0.75 / dpr;
    // The drawing buffer's own height, which gl_FragCoord counts in, back in CSS px.
    this.pieceVeil.uDpr.value = dpr;
    this.pieceVeil.uViewH.value = this.renderer.getDrawingBufferSize(new THREE.Vector2()).y / dpr;
    this.glass.resize();
    this.glass.setAxis("y");
  }

  /**
   * Only a phone's standing line scrolls through the rims. On a wide screen
   * they would only pull the end frames into the edges, and round a closed
   * ball they would only smear a short phone's caption.
   */
  private get glassOn() {
    return !this.opts.reducedMotion && this.vertical && !!this.opened;
  }

  // ---------------------------------------------------------------- build

  async load(): Promise<void> {
    // A picture that fails to load leaves its mark bare rather than the page blank.
    const stills = await Promise.all([
      ...this.projects.map((p) => loadImage(p.cover).catch(() => null)),
      ...this.items.map((it) => loadImage(stillOf(it.media)).catch(() => null)),
    ]);
    if (this.disposed) {
      stills.forEach((s) => s?.dispose());
      return;
    }
    const covers = stills.slice(0, this.projects.length);
    const itemStills = stills.slice(this.projects.length);
    upload(this.renderer, stills.filter((s): s is Loaded => !!s));

    const lead = makeText(this.opts.heading.lead, { font: FONT.grotesk, size: 16, anchorY: "middle", letterSpacing: -0.02 });
    const tail = makeText(this.opts.heading.tail, { font: FONT.serif, size: 16, anchorY: "middle" });
    const wait = makeText(NOVA_WAIT, { font: FONT.serif, size: 16, anchorY: "middle" });
    [lead, tail, wait].forEach((t) => {
      t.material.transparent = true;
      t.renderOrder = 900;
      this.scene.add(t);
    });
    this.heading = { lead: this.masked(lead), tail: this.masked(tail), wait: this.masked(wait) };
    // The field's year numerals, one for each year he has a project in; out of sight until then.
    this.years = [...new Set(this.projects.map((p) => p.year))].map((year) => {
      const t = makeText(String(year), { font: FONT.grotesk, size: YEAR_SIZE });
      t.material.transparent = true;
      t.material.opacity = YEAR_INK;
      t.renderOrder = 900;
      t.visible = false;
      this.scene.add(t);
      return { year, m: this.masked(t) };
    });

    const many = this.projects.length > MANY;
    this.projects.forEach((project, k) => {
      const own = this.items.map((it, j) => ({ it, still: itemStills[j] })).filter(({ it, still }) => it.project === project.slug && still);
      const bead = this.makeBead(project, null, project.year, project.status === "dead" ? -1 : 1);
      const cover = covers[k];
      if (cover) this.addPiece(bead, cover, cover.aspect || 0.75, project.hover, true);
      own.forEach(({ it, still }) => this.addPiece(bead, still!, it.aspect || still!.aspect, it.media.kind === "video" ? it.media : null, !many || bead.pieces.length < 3));
    });
    this.items.forEach((it, j) => {
      if (it.project && this.projects.some((p) => p.slug === it.project)) return;
      const still = itemStills[j];
      if (!still) return;
      const bead = this.makeBead(null, it, it.year, 1);
      this.addPiece(bead, still, it.aspect || still.aspect, it.media.kind === "video" ? it.media : null, true);
    });

    // The layout winds the thread, once it knows how big the ball is.
    await this.layout();
    if (this.disposed) return;
    this.ready = true;
    this.rest();
    const slug = this.pendingOpen;
    this.pendingOpen = null;
    const deep = slug ? this.beads.find((b) => b.project?.slug === slug) : undefined;
    this.reveal(!!deep);
    if (deep) this.openBead(deep, { immediate: true });
  }

  private makeBead(project: Project | null, study: SpaceItem | null, year: number, side: 1 | -1): Bead {
    const title = project?.title ?? study?.title ?? "";
    const dead = project?.status === "dead";
    const light = dead || project?.status === "paused";
    const name = makeText(title, { font: light ? FONT.serifLight : FONT.serif, size: NAME_SIZE, anchorX: "center" });
    const status = makeText(project ? statusWord(project) : `study ${year}`, { font: FONT.grotesk, size: STATUS_SIZE, anchorX: "center" });
    const whyText = project?.why ?? study?.description.join(" ") ?? "";
    const why = makeText(whyText, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX, align: "center", anchorX: "center" });
    [name, status, why].forEach((t) => {
      t.material.transparent = true;
      t.renderOrder = 900;
      this.scene.add(t);
    });
    if (dead) name.material.opacity = DEAD_INK;

    let open: Bead["open"] = null;
    if (project) {
      const oName = makeText(title, { font: light ? FONT.serifLight : FONT.serif, size: NAME_SIZE });
      const oStatus = makeText(statusWord(project), { font: FONT.grotesk, size: STATUS_SIZE });
      const oWhy = makeText(project.why, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX });
      const oSummary = makeText(project.summary, { font: FONT.serif, size: WHY_SIZE, lineHeight: 1.3, maxWidth: WHY_MAX });
      const oLink = makeText("Case", { font: FONT.grotesk, size: 12 });
      [oName, oStatus, oWhy, oSummary, oLink].forEach((t) => {
        t.material.transparent = true;
        t.renderOrder = 950;
        t.visible = false; // until its project opens
        this.openGroup.add(t);
      });
      if (dead) oName.material.opacity = DEAD_INK;
      open = { name: this.masked(oName), status: this.masked(oStatus), why: this.masked(oWhy), summary: this.masked(oSummary), link: this.masked(oLink) };
    }

    let dot: Bead["dot"] = null;
    // A shipped project wears the horizon's dot on its tick; a study is a bead on the thread itself.
    if (!project || project.status === "shipped") {
      dot = new THREE.Mesh(this.dotGeo, new THREE.MeshBasicMaterial({ color: GL.ink, transparent: true, depthTest: false, depthWrite: false }));
      this.scene.add(dot);
    }
    const bead: Bead = {
      project,
      study,
      year,
      side,
      i: 0,
      i0: 0,
      i1: 0,
      pieces: [],
      pop: 0,
      popped: false,
      hl: 0,
      dot,
      cap: { name: this.masked(name), status: this.masked(status), why: this.masked(why) },
      capDy: 0,
      open,
      mx: 0,
      my: 0,
      mz: -1,
      crossed: 0,
      lag: 0,
      docked: true,
    };
    this.beads.push(bead);
    return bead;
  }

  private addPiece(bead: Bead, still: Loaded, aspect: number, moving: Media | null, onBall: boolean) {
    const index = bead.pieces.length;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: still.texture },
        uAlt: { value: still.texture },
        uMix: { value: 0 },
        uMapAspect: { value: still.aspect || aspect },
        uAltAspect: { value: still.aspect || aspect },
        uPlaneAspect: { value: aspect },
        uFade: { value: 0 },
        uBlur: { value: 0 },
        uVeilK: { value: 0 },
        uLineK: { value: 0 },
        ...this.pieceVeil,
      },
      vertexShader: pieceVert,
      fragmentShader: pieceFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.planeGeo, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    const piece: Piece = {
      bead,
      index,
      aspect,
      h: (bead.study ? STUDY_H : index === 0 ? COVER_H : PIECE_H[(index - 1) % PIECE_H.length]) * this.crowdScale,
      along: 0,
      up: 0,
      onBall,
      mesh,
      still,
      moving: null,
      movingMedia: moving,
      landed: false,
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
      sz: -1,
      ink: 0,
      lon: 0,
      field: null,
    };
    bead.pieces.push(piece);
    this.pieces.push(piece);
  }

  /** More work hangs smaller, so the thread stays the thing you see: full size up to a dozen projects, half at about fifty. */
  private get crowdScale() {
    return Math.max(0.5, Math.min(1, Math.sqrt(CROWD_FROM / Math.max(1, this.projects.length))));
  }

  private masked(t: Text): Masked {
    return { t, box: [0, 0, 0, 0], base: new THREE.Vector2(), dir: -1, offset: 0, span: 0 };
  }

  /**
   * A big ball's thread is sampled twice as finely, or its tight turns near
   * the poles would show their corners. The thread winds again when that
   * changes (and on the first layout); the samples hold the same places, so
   * nothing on it moves.
   */
  private fitStep() {
    const step = this.R > FINE_FROM ? STEP / 2 : STEP;
    if (this.M && step === this.arcStep) return;
    this.arcStep = step;
    this.wind();
    // Out of the knot, or winding back into it (a window maximised, a tablet turned): the thread is
    // sampled afresh, so each sample's way out is worked out again, from the ball as it collapsed.
    if (this.novaActive) this.novaWays(this.nova.bend0);
    // The thread, the marks, the loose end and the joins; and the supernova's ring.
    const need = this.M + 256 + this.beads.length * 64 + NOVA_RING_POINTS + 8;
    if (this.back && this.front && this.back.capacity >= need) return;
    [this.back, this.front].forEach((r) => {
      if (!r) return;
      this.scene.remove(r.mesh);
      r.dispose();
    });
    this.back = new Ribbons(this.lineMat, need);
    this.front = new Ribbons(this.lineMat, need);
    this.back.mesh.renderOrder = 200;
    this.front.mesh.renderOrder = 400;
    this.scene.add(this.back.mesh, this.front.mesh);
  }

  /**
   * Winds the thread: a spherical spiral with its turns evenly spaced in
   * latitude, resampled evenly along its length so that sample index is
   * time. Then each bead is tied on at its year: a year's beads sit together
   * around the middle of that year (the data knows years, not months), and
   * each owns its share of the year's thread.
   */
  private wind() {
    const now = fractionalYear(new Date());
    // With nothing tied on yet, the thread is this year so far.
    const years = this.beads.length ? this.beads.map((b) => b.year) : [Math.floor(now)];
    this.T0 = Math.min(...years);
    this.T1 = Math.max(now, Math.max(...years) + 0.25);
    const turns = Math.max(TURNS_LEAST, TURNS_PER_YEAR * (this.T1 - this.T0));

    // A dense table first, then even steps along its arc. Each turn leans a little, and the lean
    // walks round from turn to turn, so neighbouring turns cross the way wound thread does instead
    // of stacking like a spring. The lean fades out at the poles.
    const K = Math.ceil(turns * 1440);
    const at = (s: number, out: THREE.Vector3, wobble = WOBBLE) => {
      const lat0 = -Math.PI / 2 + Math.PI * s;
      const lon = Math.PI * 2 * turns * s;
      const lat = lat0 + wobble * Math.cos(lat0) * Math.sin(lon * WOBBLE_RATE);
      return out.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
    };
    const arc = new Float64Array(K + 1);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    at(0, a);
    for (let k = 1; k <= K; k++) {
      at(k / K, b);
      arc[k] = arc[k - 1] + a.distanceTo(b);
      a.copy(b);
    }
    const total = arc[K];
    const M = Math.max(2, Math.ceil(total / this.arcStep) + 1);
    const P = new Float32Array(M * 3);
    // The same places along the spiral wound with no lean: same longitudes, true latitudes.
    const P0 = new Float32Array(M * 3);
    let k = 0;
    for (let i = 0; i < M; i++) {
      const target = (total * i) / (M - 1);
      while (k < K - 1 && arc[k + 1] < target) k++;
      const f = (target - arc[k]) / Math.max(1e-9, arc[k + 1] - arc[k]);
      at((k + clamp01(f)) / K, a);
      P.set([a.x, a.y, a.z], i * 3);
      at((k + clamp01(f)) / K, b, 0);
      P0.set([b.x, b.y, b.z], i * 3);
    }
    const tangents = (src: Float32Array) => {
      const out = new Float32Array(M * 3);
      for (let i = 0; i < M; i++) {
        const p = Math.max(0, i - 1) * 3;
        const q = Math.min(M - 1, i + 1) * 3;
        a.set(src[q] - src[p], src[q + 1] - src[p + 1], src[q + 2] - src[p + 2]).normalize();
        out.set([a.x, a.y, a.z], i * 3);
      }
      return out;
    };
    this.M = M;
    this.P = P;
    this.TG = tangents(P);
    this.P0 = P0;
    this.TG0 = tangents(P0);
    this.turns = turns;
    this.SX = new Float32Array(M);
    this.SY = new Float32Array(M);
    this.SZ = new Float32Array(M);
    this.SA = new Float32Array(M);
    this.NX = new Float32Array(M);
    this.NY = new Float32Array(M);
    this.lifted = new Float32Array(M);
    this.owner = new Int16Array(M).fill(-1);
    // The supernova's grain along the thread (see NOVA_GRAIN): here, so the collapse has nothing to work out.
    this.BS = new Float32Array(M);
    this.BB = new Float32Array(M);
    const grain = NOVA_GRAIN * (this.arcStep / STEP);
    for (let i = 0; i < M; i++) {
      this.BS[i] = 0.3 + 0.75 * fbm(i * grain);
      this.BB[i] = (fbm(i * grain + 17.31) - 0.5) * 2 * NOVA_CRUMPLE;
    }

    // Tie the beads on, a year at a time.
    const pxToIdx = 1 / (this.arcStep * R_REF);
    const idxOf = (t: number) => ((t - this.T0) / (this.T1 - this.T0)) * (M - 1);
    // A project's pieces sit together just past its mark, a knot of work: the cover standing on
    // the thread, the rest in two short rows beside it, the upper one set a little in, as if hung
    // by hand. They string out into one row only when the project unspools.
    const rowLen = (bead: Bead) => {
      const [first, ...rest] = bead.pieces.filter((pc) => pc.onBall);
      if (!first) return ROW_LEAD;
      const coverW = first.h * first.aspect;
      first.along = ROW_LEAD + coverW / 2;
      first.up = HANG_GAP + first.h / 2;
      const x0 = ROW_LEAD + coverW + ROW_GAP;
      const low = rest.slice(0, Math.ceil(rest.length / 2));
      const high = rest.slice(low.length);
      let end = ROW_LEAD + coverW;
      let lowH = 0;
      [low, high].forEach((row, r) => {
        let x = x0 + (r ? ROW_GAP * 1.5 : 0);
        row.forEach((pc) => {
          const w = pc.h * pc.aspect;
          pc.along = x + w / 2;
          pc.up = HANG_GAP + (r ? lowH + ROW_GAP / 2 : 0) + pc.h / 2;
          x += w + ROW_GAP;
          if (!r) lowH = Math.max(lowH, pc.h);
        });
        end = Math.max(end, x - ROW_GAP);
      });
      return end;
    };
    const byYear = new Map<number, Bead[]>();
    this.beads.forEach((bd) => byYear.set(bd.year, [...(byYear.get(bd.year) ?? []), bd]));
    const lonAt = (i: number) => {
      const k = Math.max(0, Math.min(M - 1, Math.round(i))) * 3;
      return Math.atan2(P[k], P[k + 2]);
    };
    let lastLon: number | null = null;
    [...byYear.keys()]
      .sort((x, y) => x - y)
      .forEach((year) => {
        const list = byYear.get(year)!;
        const lo = idxOf(year);
        const hi = idxOf(Math.min(year + 1, this.T1));
        const lens = list.map((bd) => rowLen(bd) * pxToIdx);
        const gap = MARK_GAP * pxToIdx;
        let span = lens.reduce((s, l) => s + l, 0) + gap * (list.length - 1);
        // A crowded year squeezes its gaps, then its rows, to stay inside the year.
        const squeeze = Math.min(1, (hi - lo) / Math.max(1e-6, span));
        span *= squeeze;
        // The data knows years, not months, so where in its year a knot sits is free: each one
        // steps round the ball from the last by the golden angle, never near the year's edges.
        let x = (lo + hi) / 2 - span / 2;
        const edge = (hi - lo) * 0.12;
        const from = lo + edge;
        const to = hi - edge - span;
        if (lastLon !== null && to > from) {
          const want = lastLon + GOLDEN;
          let best = Infinity;
          for (let c = 0; c <= 96; c++) {
            const at = lerp(from, to, c / 96);
            const d = Math.abs(Math.atan2(Math.sin(lonAt(at + span / 2) - want), Math.cos(lonAt(at + span / 2) - want)));
            if (d < best) {
              best = d;
              x = at;
            }
          }
        }
        lastLon = lonAt(x + span / 2);
        list.forEach((bd, j) => {
          bd.i = x;
          x += (lens[j] + gap) * squeeze;
          if (squeeze < 1) bd.pieces.forEach((pc) => (pc.along *= squeeze));
        });
        // Each bead's stretch: to the midpoints between neighbours, and to the year's ends.
        list.forEach((bd, j) => {
          const end = bd.i + lens[j] * squeeze;
          bd.i0 = j === 0 ? lo : (bd.i + (list[j - 1].i + lens[j - 1] * squeeze)) / 2;
          bd.i1 = j === list.length - 1 ? hi : (end + list[j + 1].i) / 2;
        });
      });
    this.order = [...this.beads].sort((x, y) => x.i - y.i);
    this.order.forEach((bd) => {
      const bi = this.beads.indexOf(bd);
      for (let i = Math.max(0, Math.ceil(bd.i0)); i <= Math.min(M - 1, Math.floor(bd.i1)); i++) this.owner[i] = bi;
    });
  }

  // ---------------------------------------------------------------- layout

  /** The heading's line, as the last layout set it. */
  private get headingY() {
    return this.headY;
  }

  /**
   * The heading's old line at this height: 206, as on the other tabs, higher
   * on a short screen. A phone keeps it; a wide screen balances from it.
   */
  private get lineHeadingY() {
    const H = this.height;
    return H >= SHORT ? HEADING_Y : Math.round(Math.max(HEADING_MIN, HEADING_Y - (SHORT - H) * SHORT_CLIMB));
  }

  private get headingHalf() {
    return this.headingTwoLines ? 22 : 11;
  }

  /** Where the heading's ink starts, px, as its words were last set. */
  private headingInkTop() {
    if (!this.heading) return this.headY - this.headingHalf;
    return Math.min(
      ...[this.heading.lead, this.heading.tail].map((m) => {
        const info = m.t.textRenderInfo as (TextRenderInfo & { visibleBounds?: [number, number, number, number] }) | null;
        const b = info?.visibleBounds ?? blockBounds(m.t);
        return -m.base.y - b[3];
      }),
    );
  }

  /** Sets the heading's words on its line: one line centred, or two where the screen is too narrow. */
  private placeHeading(hy: number) {
    if (!this.heading) return;
    const W = this.width;
    const { lead, tail } = this.heading;
    const lw = blockBounds(lead.t)[2] - blockBounds(lead.t)[0];
    const tw = blockBounds(tail.t)[2] - blockBounds(tail.t)[0];
    const ww = blockBounds(this.heading.wait.t)[2] - blockBounds(this.heading.wait.t)[0];
    const space = 16 * 0.28;
    const total = lw + space + tw;
    this.headingTwoLines = total > W - 40;
    // The supernova's stand-in tail takes the tail's place: where it starts, or centred on its line.
    const { wait } = this.heading;
    if (!this.headingTwoLines) {
      const x0 = (W - total) / 2;
      this.setBase(lead, x0, hy);
      this.setBase(tail, x0 + lw + space, hy);
      this.setBase(wait, x0 + lw + space, hy);
    } else {
      this.setBase(lead, (W - lw) / 2, hy - 11);
      this.setBase(tail, (W - tw) / 2, hy + 11);
      this.setBase(wait, (W - ww) / 2, hy + 11);
    }
    if (!this.waitShown) {
      gsap.killTweensOf(wait);
      wait.offset = wait.span;
      this.applyMask(wait);
    }
  }

  /** The hover captions' set: centred under the ball, or left-aligned beside it. */
  private captionsAt(side: boolean, width: number) {
    this.beads.forEach((b) => {
      [b.cap.name, b.cap.status, b.cap.why].forEach((m) => {
        m.t.anchorX = side ? "left" : "center";
      });
      b.cap.why.t.textAlign = side ? "left" : "center";
      b.cap.why.t.maxWidth = width;
    });
  }

  /** Sizes and places the ball, the heading and the captions; the texts measure first. */
  private async layout() {
    const gen = ++this.layoutGen;
    const W = this.width;
    const H = this.height;
    const v = this.vertical;
    const capMax = v ? Math.min(WHY_MAX, W - 48) : WHY_MAX;
    this.captionsAt(false, capMax);
    this.beads.forEach((b) => {
      if (b.open) {
        const w = v ? Math.max(160, W - Math.round(W * LINE_X) - PHONE_TEXT_INSET - 16) : WHY_MAX;
        b.open.why.t.maxWidth = w;
        b.open.summary.t.maxWidth = w;
      }
    });
    await Promise.all(this.texts.map((t) => syncText(t)));
    if (this.disposed || gen !== this.layoutGen) return;
    // The covers' captions as the supernova's field sets them, before a screen that stands them
    // beside the ball narrows them: the sheet is worked out ahead of the collapse (see planAhead).
    this.fieldCapH = Math.max(0, ...this.beads.filter((b) => b.project && b.pieces.length).map((b) => 50 + this.textHeight(b.cap.why)));

    // The heading: on a phone where the horizon had it (higher on a short screen). A wide screen
    // sets it once to measure its ink, then again where the balance below puts it.
    let hy = v ? this.lineHeadingY : HEADING_Y;
    this.placeHeading(hy);
    const above = hy - this.headingInkTop();

    // The ball: on a wide screen 62% of the short side up to 720px, a little larger with more work,
    // then whatever fits between the heading and the caption. A phone's is 88% of its width.
    const n = this.projects.length;
    // It grows with the square root of the work: six projects is today's size, sixty is 1.4 times it.
    // Once the fit holds it, more work only winds the turns closer.
    const growth = 1 + (GROWTH_MAX - 1) * clamp01((Math.sqrt(n) - Math.sqrt(6)) / (Math.sqrt(60) - Math.sqrt(6)));
    const want = v ? W * PHONE_D : Math.min(D_MAX, D_SHARE * Math.min(W, H)) * growth;
    const capH = this.captionHeight();
    const gap = CAP_GAP;
    // A wide screen's ball may reach into the caption's slot: only a quarter of the caption counts.
    const capFit = v ? capH : capH * CAP_FIT;
    // The room over the ball grows with it, so each fit solves for both.
    const room = v ? PHONE_TOP_ROOM : TOP_ROOM;
    const lift = 1 + room / (2 * R_REF);
    // What the ball may take: on a phone everything under the heading, less what must stay under
    // the ball. A wide screen balances the pair, the room over the heading (from the tab pills'
    // foot) matching the room under the ball, so whatever stays under the ball is kept twice.
    const budget = H - NAV_FOOT - above - this.headingHalf - HEADING_CLEAR;
    const fit = (keep: number) => (v ? H - (hy + this.headingHalf) - HEADING_CLEAR - keep : budget - 2 * keep) / lift;
    const under = Math.min(want, fit(gap + capFit + 16));
    // A wide screen too short for a fair ball with the whole caption under it (a phone held
    // sideways) sets the caption beside the ball instead, and the ball takes the height, unless
    // reaching into the caption's slot gives it more. Which screens those are is judged with the
    // heading on its old line, so balancing the page moves the pair and not that threshold.
    const sideW = W - 2 * (CAP_GAP + SIDE_MIN_W + SIDE_EDGE);
    const fit0 = (keep: number) => Math.min(want, (H - (this.lineHeadingY + this.headingHalf) - HEADING_CLEAR - keep) / lift);
    const side = !v && fit0(gap + capH + 16) < SIDE_FROM && Math.min(fit0(SIDE_BOTTOM), sideW) > fit0(gap + capFit + 16);
    const beside = Math.min(want, fit(SIDE_BOTTOM), sideW);
    const D = Math.max(D_MIN, side ? beside : under);
    this.R = D / 2;
    this.fitStep();
    const keep = side ? SIDE_BOTTOM : gap + capFit + 16;
    // Where the fit does not hold a wide screen's ball (a big one, where it stops at D_MAX), it
    // stood lower than right under the heading, centred SIT of the way down under a heading at
    // HEADING_Y: the heading keeps that gap to it, and the pair is balanced as one.
    let slack = 0;
    if (!v) {
      const top0 = HEADING_Y + this.headingHalf + HEADING_CLEAR + room * (D / (2 * R_REF)) + this.R;
      slack = Math.max(0, Math.min(H * SIT, H - keep - this.R) - top0);
      // Equal room over the heading and under the ball.
      const g = Math.max(HEADING_CLEAR, (budget - slack - D * lift) / 2);
      hy = Math.round(NAV_FOOT + g + above);
      this.placeHeading(hy);
    }
    this.headY = hy;
    const headBottom = hy + this.headingHalf;
    const top = headBottom + HEADING_CLEAR + slack + room * (D / (2 * R_REF)) + this.R;
    const bottom = H - keep - this.R;
    this.cx = W / 2;
    this.cy = v ? Math.max(top, Math.min(H * SIT, bottom)) : top;
    // Under the ball, and never past the bottom edge: over the ball's foot, where it reaches that far.
    this.capY = Math.min(this.cy + this.R + gap, H - capH - 16);
    this.capSide = side;
    this.capX = Math.round(this.cx + this.R + CAP_GAP);
    if (side) {
      this.captionsAt(true, Math.min(WHY_MAX, W - this.capX - SIDE_EDGE));
      await Promise.all(this.beads.flatMap((b) => [b.cap.name.t, b.cap.status.t, b.cap.why.t]).map((t) => syncText(t)));
      if (this.disposed || gen !== this.layoutGen) return;
    }
    this.beads.forEach((b) => {
      b.capDy = 0;
      if (side) {
        // Each caption centred on the ball's height, inside the screen.
        const h = 50 + this.textHeight(b.cap.why);
        const y = Math.round(Math.max(headBottom + 16, Math.min(this.cy - h / 2, H - 16 - h)));
        this.setBase(b.cap.name, this.capX, y);
        this.setBase(b.cap.status, this.capX, y + 30);
        this.setBase(b.cap.why, this.capX, y + 50);
      } else this.placeCaption(b);
      if (b !== this.hovered) {
        [b.cap.name, b.cap.status, b.cap.why].forEach((m) => {
          gsap.killTweensOf(m);
          m.offset = m.span;
          this.applyMask(m);
        });
      }
    });
    if (this.opened) this.layoutOpen(this.opened);
    this.laidOut = gen;
    // The supernova's covers, out on the table, find their places again on the new screen.
    if (this.fieldOn || this.nova.phase === "collapse") void this.layoutField();
  }

  private captionHeight() {
    let h = 0;
    this.beads.forEach((b) => {
      const wb = blockBounds(b.cap.why.t);
      h = Math.max(h, 50 + (wb[3] - wb[1]));
    });
    return h || 70;
  }

  /** A caption under the ball: centred, at the slot's top, stepped down by its own capDy. */
  private placeCaption(b: Bead) {
    const y = this.capY + b.capDy;
    this.setBase(b.cap.name, this.cx, y);
    this.setBase(b.cap.status, this.cx, y + 30);
    this.setBase(b.cap.why, this.cx, y + 50);
  }

  /** One of a caption's lines at rest on screen, px: x0, y0, x1, y1. */
  private lineBox(m: Masked): [number, number, number, number] {
    const bb = blockBounds(m.t);
    const y = -m.base.y;
    return [m.base.x + bb[0], y - bb[3], m.base.x + bb[2], y - bb[1]];
  }

  /** A caption's words at rest on screen, px: x0, y0, x1, y1. */
  private captionBox(b: Bead): [number, number, number, number] {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    [b.cap.name, b.cap.status, b.cap.why].forEach((m) => {
      const [a, c, d, e] = this.lineBox(m);
      x0 = Math.min(x0, a);
      y0 = Math.min(y0, c);
      x1 = Math.max(x1, d);
      y1 = Math.max(y1, e);
    });
    return [x0, y0, x1, y1];
  }

  /**
   * Where a caption under the ball would land on its own project's pieces,
   * hanging low on the ball: how far it steps down to clear them by
   * CAP_CLEAR, never nearer the bottom edge than CAP_FOOT. Where the ball
   * already reaches into the caption's slot that is only a few px, so what it
   * cannot clear the veil dims under each line (see CAP_LINE_PAD).
   */
  private captionClear(b: Bead) {
    if (this.capSide) return 0;
    const [x0, , x1] = this.captionBox(b);
    const top = this.capY;
    let low = -Infinity;
    b.pieces.forEach((pc) => {
      // Only what can be seen there: a piece round the back is a shape through the thread.
      if (!pc.onBall || !pc.mesh.visible || (b.side > 0 && pc.sz < -0.3)) return;
      if (pc.sx + pc.sw / 2 < x0 - CAP_VEIL_PAD || pc.sx - pc.sw / 2 > x1 + CAP_VEIL_PAD) return;
      const bottom = pc.sy + pc.sh / 2;
      if (bottom + CAP_CLEAR > top) low = Math.max(low, bottom);
    });
    if (low === -Infinity) return 0;
    const h = 50 + this.textHeight(b.cap.why);
    return Math.max(0, Math.min(low + CAP_CLEAR, this.height - h - CAP_FOOT) - top);
  }

  private get texts(): Text[] {
    const h = this.heading ? [this.heading.lead.t, this.heading.tail.t, this.heading.wait.t] : [];
    return [
      ...h,
      ...this.years.map((y) => y.m.t),
      ...this.beads.flatMap((b) => [b.cap.name.t, b.cap.status.t, b.cap.why.t, ...(b.open ? [b.open.name.t, b.open.status.t, b.open.why.t, b.open.summary.t, b.open.link.t] : [])]),
    ];
  }

  /** Sets a text's resting place and reads its box; the current offset is kept. */
  private setBase(m: Masked, x: number, y: number) {
    const b = blockBounds(m.t);
    const pad = Math.max(3, m.t.fontSize * 0.2);
    m.box = [b[0] - 4, b[1] - pad, b[2] + 4, b[3] + pad];
    m.span = b[3] - b[1] + pad * 2;
    m.base.set(x, -y);
    this.applyMask(m);
  }

  private applyMask(m: Masked) {
    const { box, dir, offset } = m;
    m.t.position.set(m.base.x, m.base.y + dir * offset, 1);
    m.t.clipRect = [box[0], box[1] - dir * offset, box[2], box[3] - dir * offset];
  }

  private textHeight(m: Masked) {
    const b = blockBounds(m.t);
    return b[3] - b[1];
  }

  /**
   * The opened project as a horizon of its own: the line at 58% of the
   * height (on a phone, standing at 38% of the width), the mark near its
   * start, the pieces as frames above it (below, for dead work) and the
   * texts on the other side. Only the along axis scrolls.
   */
  private layoutOpen(bead: Bead) {
    const W = this.width;
    const H = this.height;
    const v = this.vertical;
    const dead = bead.side < 0;
    const o = bead.open!;
    const frames: Layout["frames"] = [];
    const heads = [o.name, o.status, o.why, o.summary, o.link];
    const gapsAfter = [6, 14, 8, 18, 0];
    // A relayout puts the Case word back at rest.
    gsap.killTweensOf(this.caseLift);
    this.caseLift.v = 0;
    this.caseHot = false;
    this.canvas.style.cursor = "";
    const blockH = heads.reduce((s, m, k) => s + this.textHeight(m) + gapsAfter[k], 0);
    let layout: Layout;
    if (!v) {
      // The horizon's 58%, unless a short screen needs the line higher, for the words under it,
      // or lower, for a dead project's words over it and under the tab bar.
      let line = Math.round(H * LINE_Y);
      if (dead) line = Math.max(NAV_CLEAR + blockH + 20, Math.min(line, H - OPEN_BOTTOM - FRAME_OFF - FRAME_MIN));
      else line = Math.min(line, H - OPEN_BOTTOM - 20 - blockH);
      line = Math.round(line);
      const headBottom = this.headingY + this.headingHalf;
      // The frames keep clear of the heading while there is room; past that they cross its line
      // and it yields (see dimHeading), but they never reach the tab bar or leave the screen.
      const room = dead ? H - OPEN_BOTTOM - (line + FRAME_OFF) : line - FRAME_OFF - (headBottom + 16);
      const most = dead ? room : line - FRAME_OFF - NAV_CLEAR;
      let h = Math.max(24, Math.min(Math.max(FRAME_MIN, Math.min(FRAME_H, room)), most));
      const widths = (hh: number) => bead.pieces.map((pc) => hh * pc.aspect);
      const rowW = (hh: number) => widths(hh).reduce((s, w) => s + w, 0) + FRAME_GAP * (bead.pieces.length - 1);
      const maxRow = W - 2 * MARGIN - MARK_LEAD;
      // A long row shrinks toward the viewport's width (and scrolls past it), but never grows.
      if (rowW(h) > maxRow) h = Math.min(h, Math.max(FRAME_MIN * 0.75, h * (maxRow / rowW(h))));
      const total = MARK_LEAD + rowW(h);
      const x0 = Math.max(MARGIN, Math.round((W - total) / 2));
      let x = x0 + MARK_LEAD;
      widths(h).forEach((w) => {
        frames.push({ along: x + w / 2, across: dead ? line + FRAME_OFF + h / 2 : line - FRAME_OFF - h / 2, w, h });
        x += w + FRAME_GAP;
      });
      const length = Math.max(W, x - FRAME_GAP + MARGIN);
      layout = { vertical: false, line, mark: x0, start: -60, end: length + 60, frames, length };
      // Texts under the line (over it, for dead work), flush with the mark.
      let y = dead ? line - 20 - blockH : line + 20;
      heads.forEach((m, k) => {
        this.setBase(m, x0 - 1, y);
        y += this.textHeight(m) + gapsAfter[k];
      });
    } else {
      // The words stand clear of the tick, as the old phone horizon's did; the frames follow them down.
      const line = Math.round(W * LINE_X);
      const tx = line + PHONE_TEXT_INSET;
      let y = 104;
      heads.forEach((m, k) => {
        this.setBase(m, tx, y);
        y += this.textHeight(m) + gapsAfter[k];
      });
      const mark = 104 + this.textHeight(o.name) / 2;
      const w = dead ? line - 32 : Math.min(W - line - 32, PHONE_FRAME_W);
      let at = y + 32;
      bead.pieces.forEach((pc) => {
        const h = Math.min(w / pc.aspect, w * 1.4);
        const fw = h * pc.aspect;
        frames.push({ along: at + h / 2, across: dead ? line - 16 - fw / 2 : line + 16 + fw / 2, w: fw, h });
        at += h + 16;
      });
      const length = Math.max(H, at + 48);
      layout = { vertical: true, line, mark, start: -60, end: length + 60, frames, length };
    }
    heads.forEach((m) => {
      m.dir = dead && m === o.why && !v ? 1 : -1;
      this.applyMask(m);
    });
    this.layoutO = layout;
    this.scroll.max = Math.max(0, layout.length - (v ? H : W));
    this.scroll.target = Math.min(this.scroll.target, this.scroll.max);
    this.scroll.cur = Math.min(this.scroll.cur, this.scroll.max);
  }

  // ---------------------------------------------------------------- reveal

  /** Reduced motion: the newest year faces you. Otherwise the ball starts with the newest year just past the front. */
  private rest() {
    const last = this.order[this.order.length - 1];
    if (!last) return;
    const p = this.samplePos(last.i, new THREE.Vector3());
    this.angle = Math.atan2(-p.x, p.z) + (this.opts.reducedMotion ? 0 : 0.5);
  }

  /** The thread winds itself from his first year to now; each mark and its pieces arrive as it passes. */
  private reveal(quick: boolean) {
    const items = this.heading ? [this.heading.lead, this.heading.tail] : [];
    if (this.opts.reducedMotion || quick) {
      this.draw.value = 1;
      items.forEach((it) => this.applyMask(it));
      this.beads.forEach((b) => {
        b.pop = 1;
        b.popped = true;
      });
      this.cursorOn = true;
      return;
    }
    items.forEach((it) => {
      it.offset = it.span;
      this.applyMask(it);
    });
    const tl = gsap.timeline();
    const rise = (it: Masked, at: number) => tl.to(it, { offset: 0, duration: 0.9, ease: "power4.out", onUpdate: () => this.applyMask(it) }, at);
    if (this.heading) {
      rise(this.heading.lead, 0.1);
      rise(this.heading.tail, 0.18);
    }
    tl.to(this.draw, { value: 1, duration: 1.7, ease: "power1.inOut" }, 0.15);
    tl.call(
      () => {
        this.cursorOn = true;
      },
      undefined,
      1.85,
    );
    this.intro = tl;
  }

  resize() {
    this.measure();
    if (!this.ready) return;
    this.intro?.progress(1);
    void this.layout();
  }

  // ---------------------------------------------------------------- geometry

  /** The thread's unit position at a fractional sample index. */
  private samplePos(i: number, out: THREE.Vector3) {
    const M = this.M;
    const c = Math.max(0, Math.min(M - 1, i));
    const a = Math.floor(c);
    const b = Math.min(M - 1, a + 1);
    const f = c - a;
    const P = this.P;
    out.set(lerp(P[a * 3], P[b * 3], f), lerp(P[a * 3 + 1], P[b * 3 + 1], f), lerp(P[a * 3 + 2], P[b * 3 + 2], f));
    const w = this.bend;
    if (w <= 0) return out;
    const Q = this.P0;
    return out.lerp(this.tmp.set(lerp(Q[a * 3], Q[b * 3], f), lerp(Q[a * 3 + 1], Q[b * 3 + 1], f), lerp(Q[a * 3 + 2], Q[b * 3 + 2], f)), w).normalize();
  }

  private sampleTan(i: number, out: THREE.Vector3) {
    const k = Math.max(0, Math.min(this.M - 1, Math.round(i))) * 3;
    out.set(this.TG[k], this.TG[k + 1], this.TG[k + 2]);
    const w = this.bend;
    if (w <= 0) return out;
    return out.lerp(this.tmp.set(this.TG0[k], this.TG0[k + 1], this.TG0[k + 2]), w).normalize();
  }

  /** Spin about the ball's own axis, then the tilt toward you. */
  private rotate(x: number, y: number, z: number, out: THREE.Vector3) {
    const { ca, sa, ct, st } = this.rot;
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return out.set(x1, y * ct - z1 * st, y * st + z1 * ct);
  }

  /** A rotated unit point to screen px; returns the perspective scale. */
  private toScreen(q: THREE.Vector3, radius: number, out: { x: number; y: number }) {
    const k = (FOCAL / (FOCAL - q.z)) * NORM;
    out.x = this.cx + this.shake.x + q.x * radius * k;
    out.y = this.cy + this.shake.y - q.y * radius * k;
    return k;
  }

  /** A fractional sample's position this frame, wherever the unspool has put it. */
  private screenAt(i: number, out: { x: number; y: number }) {
    const c = Math.max(0, Math.min(this.M - 1, i));
    const a = Math.floor(c);
    const b = Math.min(this.M - 1, a + 1);
    const f = c - a;
    out.x = lerp(this.SX[a], this.SX[b], f);
    out.y = lerp(this.SY[a], this.SY[b], f);
    return out;
  }

  /** Along the opened line: the stretch's start and end land off screen, its mark at the layout's mark. */
  private alongOf(bead: Bead, L: Layout, i: number) {
    if (i <= bead.i) return lerp(L.start, L.mark, (i - bead.i0) / Math.max(1e-6, bead.i - bead.i0));
    return lerp(L.mark, L.end, (i - bead.i) / Math.max(1e-6, bead.i1 - bead.i));
  }

  private indexOfAlong(bead: Bead, L: Layout, along: number) {
    if (along <= L.mark) return lerp(bead.i0, bead.i, (along - L.start) / Math.max(1e-6, L.mark - L.start));
    return lerp(bead.i, bead.i1, (along - L.mark) / Math.max(1e-6, L.end - L.mark));
  }

  private lineAt(L: Layout, along: number, out: { x: number; y: number }) {
    const a = along - this.scroll.cur;
    if (L.vertical) {
      out.x = L.line;
      out.y = a;
    } else {
      out.x = a;
      out.y = L.line;
    }
    return out;
  }

  /**
   * Where sample i waits in the peel (0 leaves first, 1 last): the mark first,
   * then the thread after it, out to the stretch's end. The short run before
   * the mark only lays the line's start off the left edge, so it goes with
   * the mark rather than sweeping across on its own.
   */
  private peelOrder(bead: Bead, i: number) {
    if (i < bead.i) return ((bead.i - i) / Math.max(1e-6, bead.i - bead.i0)) * 0.3;
    return (i - bead.i) / Math.max(1e-6, bead.i1 - bead.i);
  }

  /** How far sample i has come off the ball. */
  private liftOf(bead: Bead, i: number) {
    if (this.opts.reducedMotion) return this.unspool.p;
    return inOut(clamp01(this.unspool.p * (1 + SPREAD) - SPREAD * this.peelOrder(bead, i)));
  }

  /**
   * A piece's ride: the knot leaves the ball with its mark, and each piece
   * sets off along the thread a beat after the one before, carried wherever
   * the thread is, and gets off at its frame as the laid line reaches it.
   * The cover, nearest the mark, gets off first; the rest are dealt out along
   * the line as it lays itself down. Returns the sample index it rides at and
   * how far it has grown into its frame.
   */
  private rideOf(pc: Piece, from: number, to: number) {
    const b = pc.bead;
    // The unspool progress at which the laid thread (lifted to RIDE_LIFT) reaches sample i.
    const reach = (i: number) => (this.peelOrder(b, i) * SPREAD + RIDE_LIFT) / (1 + SPREAD);
    const n = Math.max(1, b.pieces.length - 1);
    const p0 = Math.min(1 - RIDE_MIN, reach(b.i) * 0.55 + (0.3 * pc.index) / n);
    const p1 = Math.min(1, Math.max(p0 + RIDE_MIN, reach(to) + 0.04));
    const t = clamp01((this.unspool.p - p0) / Math.max(1e-6, p1 - p0));
    return { at: lerp(from, to, inOut(t)), grow: inOut(t) };
  }

  // ---------------------------------------------------------------- travel

  /** The wheel, in px (the panel normalises its deltaMode), and where the pointer is: over the ball it may drive the charge. */
  wheel(deltaX: number, deltaY: number, clientX?: number, clientY?: number) {
    if (!this.ready) return;
    const now = performance.now();
    const fresh = now - this.nova.lastWheel > NOVA_WHEEL_FRESH;
    this.nova.lastWheel = now;
    // The covers out: a new turn of the wheel sends them home (see novaInput).
    if (this.novaActive) {
      if (fresh) this.novaInput("wheel");
      return;
    }
    const d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    if (this.opened) {
      this.scroll.target = THREE.MathUtils.clamp(this.scroll.target + d, 0, this.scroll.max);
      return;
    }
    this.stopTurn();
    if (this.opts.reducedMotion) {
      this.angle += d * 0.002;
      return;
    }
    const over = clientX !== undefined && clientY !== undefined && this.overBall(clientX, clientY);
    const most = over ? Math.max(WHEEL_MAX, (NOVA_WHEEL_MAX * NOVA_S0) / this.R) : WHEEL_MAX;
    this.vel = THREE.MathUtils.clamp(this.vel + d * WHEEL_TURN, -most, most);
    if (this.byHand(d) && over) this.nova.wheelAt = performance.now();
  }

  /** Over the ball as it stands at rest, and the room its pieces hang in: a tightening ball does not slip out from under a still pointer. */
  private overBall(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    return Math.hypot(clientX - rect.left - this.cx, clientY - rect.top - this.cy) <= this.R + 24;
  }

  /**
   * Whether this wheel step is the hand driving the ball: a trackpad under a
   * moving finger, pushing or held steady. Not its momentum, which only
   * falls or holds: a step counts when it plainly grows past the lowest
   * since the last push (NOVA_RISE_BY and NOVA_RISE_PX), in pace as well as
   * size, so a few steps summed into one by a busy page are not a push; and
   * so does every step of a run that has grown, and held it, twice (see
   * NOVA_RUN_GAP), until NOVA_RUN_FALLS falls with none grown between: the
   * ball coasting, which unmarks the steps before it until a finger pushes
   * again. Nor a notched wheel, which steps rather than streams
   * (NOVA_STREAM_MS), and whose steps come the same size again (or a few at
   * once, whole multiples of it) and big (see notched): it turns the ball as
   * it always did, and never charges it however fast it is spun.
   */
  private byHand(d: number) {
    const r = this.nova.run;
    const now = performance.now();
    const m = Math.abs(d);
    const last = Math.abs(r.d);
    const gap = now - r.t;
    const fresh = gap > NOVA_RUN_GAP || Math.sign(d) !== Math.sign(r.d) || !last;
    // px per ms, so that two steps summed into one, a frame late, keep their pace.
    const pace = m / THREE.MathUtils.clamp(fresh ? 16 : gap, 4, 50);
    const notch = !fresh && m >= NOVA_NOTCH && notched(m, last);
    let push = false;
    if (fresh) {
      // A run starts unproven: sparse until its steps come as a stream, and not the hand until it grows.
      r.gap = NOVA_STREAM_MS * 2;
      r.falls = 0;
      r.hand = false;
      r.grew = 0;
      r.proved = 0;
      r.floor = m;
      r.floorPace = pace;
    } else {
      r.gap += (gap - r.gap) * 0.35;
      if (m > r.floor * NOVA_RISE_BY + NOVA_RISE_PX && pace > r.floorPace * NOVA_RISE_BY) {
        push = true;
        r.falls = 0;
        r.floor = m;
        r.floorPace = pace;
      } else if (m <= r.floor) {
        r.floor = m;
        r.floorPace = pace;
      }
      // The last step grew and this one held it: a push, not a sum that came early.
      if (r.grew && m >= r.grew * NOVA_RUN_HOLD) {
        r.falls = 0;
        if (++r.proved >= NOVA_RUN_PROOF) r.hand = true;
      }
      r.grew = m > last && pace > r.pace && !notch ? m : 0;
      // A step the same size as the last is neither: momentum's whole pixels come in pairs.
      if (!push && m < last && ++r.falls === NOVA_RUN_FALLS) {
        this.nova.wheelAt = -Infinity;
        r.hand = false;
        r.proved = 0;
      }
    }
    r.t = now;
    r.d = d;
    r.pace = pace;
    return (push || r.hand) && !notch && r.gap <= NOVA_STREAM_MS;
  }

  /** A press on the stage: a drag spins the ball (or scrolls the opened line); a still press is a tap. `touch`: a finger. */
  press(x: number, y: number, touch = false) {
    const now = performance.now();
    this.drag = { x, y, t: now, moved: false, at: now, own: false };
    this.nova.finger = touch;
    this.novaTouch();
  }

  /** Returns true while the press has become a drag. */
  move(x: number, y: number): boolean {
    const d = this.drag;
    if (!d || !this.ready) return false;
    const dx = x - d.x;
    const dy = y - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return false;
    if (!d.moved) {
      d.moved = true;
      this.stopTurn();
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.t) / 1000;
    if (this.novaActive) {
      // The covers out: a new drag sends them home, or hurries them (see novaInput). The hand
      // that spun the ball up is still on it, and does neither.
      this.novaTouch();
      if (d.at > this.nova.collapsedAt && !d.own && !this.novaDeaf) {
        d.own = true;
        this.novaInput("drag");
      }
      d.x = x;
      d.y = y;
      d.t = now;
      return true;
    }
    if (this.opened) {
      const along = this.vertical ? dy : dx;
      this.scroll.target = THREE.MathUtils.clamp(this.scroll.target - along, 0, this.scroll.max);
      this.scroll.cur = THREE.MathUtils.clamp(this.scroll.cur - along, 0, this.scroll.max);
    } else {
      const turn = dx / Math.max(60, this.R);
      if (this.novaBound) {
        // Past the point of no return the hand has lost its grip: the ball spins on by itself, and
        // a hand going its way can only spin it faster.
        const v = turn / dt;
        if (Math.sign(v) === this.nova.sign && Math.abs(v) > Math.abs(this.vel)) this.vel = lerp(this.vel, v, 0.5);
      } else {
        // The hand turns the ball true to its surface; a charged ball, pulled in, spins faster than the hand.
        this.angle += turn * this.spinK;
        this.vel = this.opts.reducedMotion ? 0 : lerp(this.vel, turn / dt, 0.5);
      }
      if (dx) this.nova.dragAt = now;
    }
    d.x = x;
    d.y = y;
    d.t = now;
    return true;
  }

  /** Ends a press; true if it was a tap. */
  release(): boolean {
    const d = this.drag;
    this.drag = null;
    if (!d) return false;
    // A drag never moves the pointer the scene knows (see pointer): with the covers out, where the
    // hand let go is where it now rests, so letting go without moving is not a move onto a cover.
    // A finger has no pointer to rest.
    if (d.moved && this.novaActive && !this.nova.finger) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerAt = { x: d.x - rect.left, y: d.y - rect.top };
    }
    if (d.moved && performance.now() - d.t > 90 && !this.novaBound) this.vel = 0; // held still before letting go
    return !d.moved;
  }

  private stopTurn() {
    this.turning?.kill();
    this.turning = null;
  }

  /** Turns the ball (about its own axis) until the bead's mark faces you. */
  private turnTo(bead: Bead, duration: number) {
    const p = this.samplePos(bead.i, new THREE.Vector3());
    let target = Math.atan2(-p.x, p.z) - this.yaw;
    const TAU = Math.PI * 2;
    target = this.angle + ((((target - this.angle) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
    this.stopTurn();
    this.vel = 0;
    if (duration <= 0) {
      this.angle = target;
      return;
    }
    this.turning = gsap.to(this, {
      angle: target,
      duration,
      ease: "power3.inOut",
      onComplete: () => {
        this.turning = null;
      },
    });
  }

  /**
   * Arrow keys: the next project along the thread, turned to the front;
   * opened, if one was open. On the ball a held arrow steps once, and past
   * NOVA_KEY_MS winds it instead (see novaStep), so its repeats step no
   * further; with reduced motion, or a project open, they step on as ever.
   */
  step(dir: 1 | -1, repeat = false) {
    if (!this.ready) return;
    // The covers out: the arrows step through them in date order, a press at a time (an arrow
    // still held from winding the ball up only repeats).
    if (this.novaActive) {
      this.novaTouch();
      if (!repeat && this.fieldOn && !this.novaDeaf) this.fieldStep(dir);
      return;
    }
    if (this.novaBound) return;
    if (!this.opts.reducedMotion && !this.opened) {
      if (repeat) return;
      this.nova.key = { dir, at: performance.now(), spin: 0, free: false };
      // Still pulled in from a charge: the arrow only winds it again, it does not choose.
      if (this.novaQuiet) return;
    }
    const list = this.order.filter((b) => b.project);
    if (!list.length) return;
    const from = this.opened ?? (this.hovered?.project ? this.hovered : null);
    let i: number;
    if (from) i = THREE.MathUtils.clamp(list.indexOf(from) + dir, 0, list.length - 1);
    else i = list.reduce((best, b, k) => (b.mz > list[best].mz ? k : best), 0);
    const b = list[i];
    if (this.opened) {
      if (b !== this.opened) this.openBead(b);
      return;
    }
    this.keyHold = true;
    this.turnTo(b, this.dur(0.8));
    if (b !== this.hovered) this.setHover(b);
  }

  /** In the supernova's field the arrows step through the covers in date order: from the chosen one, or from the first (the last, going back). */
  private fieldStep(dir: 1 | -1) {
    const list = this.order.filter((b) => this.field.has(b));
    if (!list.length) return;
    const from = this.hovered ? list.indexOf(this.hovered) : -1;
    const i = from < 0 ? (dir > 0 ? 0 : list.length - 1) : THREE.MathUtils.clamp(from + dir, 0, list.length - 1);
    this.keyHold = true;
    if (list[i] !== this.hovered) this.setHover(list[i]);
  }

  /** An arrow let go (or any, with no `dir`: the window lost the keys): its free spin ends, and the ball coasts. */
  keyUp(dir?: 1 | -1) {
    const k = this.nova.key;
    if (!k.dir || (dir && dir !== k.dir)) return;
    this.nova.key = { dir: 0, at: 0, spin: 0, free: false };
  }

  // ---------------------------------------------------------------- hover

  pointer(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const moved = !this.pointerAt || Math.hypot(x - this.pointerAt.x, y - this.pointerAt.y) >= 1;
    if (!moved && this.keyHold) return;
    if (this.pointerAt && moved) this.steer(x - this.pointerAt.x, y - this.pointerAt.y);
    this.pointerAt = { x, y };
    this.keyHold = false;
    if (moved) {
      this.novaTouch();
      if (this.fieldOn && !this.novaDeaf) this.nova.pointed = true;
    }
    if (!this.ready || this.drag?.moved) return;
    // The ball leans after the pointer, except while the supernova has it: it comes back as it went.
    if (!this.opened && !this.novaActive) this.targetYaw = this.opts.reducedMotion ? 0 : (this.pointerAt.x / this.width - 0.5) * 0.45;
    this.hoverAtPointer();
  }

  leave() {
    this.pointerAt = null;
    this.targetYaw = 0;
    if (this.caseHot) this.setCaseHot(false);
    this.setCoverHot(null);
    if (this.hovered && !this.opened) this.setHover(null);
  }

  private hoverAtPointer() {
    const at = this.pointerAt;
    if (!at) return;
    if (this.opened) {
      this.setCaseHot(this.onCase(at.x, at.y));
      const pc = this.frameAt(at.x, at.y);
      this.setCoverHot(pc && pc.index === 0 ? pc : null);
      return;
    }
    // The covers out: the ball's grammar, on the table. Over its caption a choice holds. A pointer
    // that has not moved since they came out chooses nothing (see nova.pointed).
    if (this.novaActive) {
      if (!this.fieldOn || this.novaDeaf || !this.nova.pointed) return;
      const b = this.onCaption(at.x, at.y) ? this.hovered : this.beadAt(at.x, at.y);
      if (b !== this.hovered) this.setHover(b?.project ? b : null, true);
      return;
    }
    // A ball pulled tight chooses nothing: it is the one thing happening.
    if (this.novaQuiet) return;
    // Over the chosen project's caption the choice holds: where the ball reaches under the
    // words, its thinned rings are not there to be chosen.
    if (this.onCaption(at.x, at.y)) {
      this.graceUntil = 0;
      return;
    }
    const b = this.beadAt(at.x, at.y);
    if (b === this.hovered) {
      this.graceUntil = 0;
      this.leftFrom = { x: at.x, y: at.y };
      return;
    }
    // Between a mark and its caption lie bare rings, and on a crowded ball other marks: a pointer
    // on its way to the caption keeps the choice a moment, so it can still be clicked there. Only
    // while it keeps heading that way, and only for the one grace.
    if (this.onTheWay(at.x, at.y, b)) {
      const now = performance.now();
      if (!this.graceUntil) this.graceUntil = now + CAPTION_GRACE;
      if (now < this.graceUntil) return;
    }
    this.graceUntil = 0;
    this.setHover(b, true);
  }

  /** Folds a move of the pointer into its averaged way (see CAPTION_AIM_TAU). */
  private steer(dx: number, dy: number) {
    const now = performance.now();
    const since = now - this.aim.t;
    // The share the new move takes: all of it after a pause, a little of each when they come fast.
    const k = 1 - Math.exp(-Math.max(1, since) / CAPTION_AIM_TAU);
    const dt = THREE.MathUtils.clamp(since, 1, 50);
    this.aim.vx += (dx / dt - this.aim.vx) * k;
    this.aim.vy += (dy / dt - this.aim.vy) * k;
    this.aim.last = Math.hypot(dx, dy) / dt;
    this.aim.t = now;
  }

  /**
   * The pointer, over `under` (a mark other than the chosen one, or nothing),
   * is on its way to the chosen caption: see CAPTION_GRACE.
   */
  private onTheWay(x: number, y: number, under: Bead | null) {
    if (!this.hovered || !this.towardCaption(x, y)) return false;
    if (!under) return true;
    // A crowded ball's next mark can lie a pixel or two off the chosen one: too near to tell yet.
    const from = this.leftFrom;
    const { vx, vy, last } = this.aim;
    return (!!from && Math.hypot(x - from.x, y - from.y) < CAPTION_AIM_MIN) || Math.max(Math.hypot(vx, vy), last) >= CAPTION_FLING;
  }

  /**
   * The pointer, still moving, points at the chosen caption, within
   * CAPTION_CONE of its padded words. Its way is the line from where it left
   * the mark, which neither a bowed path nor a pixel of jitter turns far, nor
   * the way it came onto the mark; too short to tell yet, it is given the
   * benefit of the doubt. Chosen by the keys, it has only its averaged moves.
   */
  private towardCaption(x: number, y: number) {
    const b = this.hovered;
    const { vx, vy, t } = this.aim;
    if (!b || performance.now() - t > CAPTION_AIM_MS) return false;
    const from = this.leftFrom;
    const wx = from ? x - from.x : vx;
    const wy = from ? y - from.y : vy;
    const len = Math.hypot(wx, wy);
    if (from && len < CAPTION_AIM_MIN) return true;
    if (len < 1e-3) return false;
    const [x0, y0, x1, y1] = this.captionBox(b).map((c, i) => c + (i < 2 ? -CAPTION_AIM : CAPTION_AIM));
    if (x > x0 && x < x1 && y > y0 && y < y1) return true;
    // The padded words as seen from the pointer: each corner's angle off its way. Seen from
    // outside, a box spans less than half a turn, so corners on both sides of the way, not
    // wrapping round behind, mean the way runs into it.
    const way = Math.atan2(wy, wx);
    const off = [
      [x0, y0],
      [x1, y0],
      [x0, y1],
      [x1, y1],
    ].map(([cx, cy]) => {
      const a = Math.atan2(cy - y, cx - x) - way;
      return Math.atan2(Math.sin(a), Math.cos(a));
    });
    const lo = Math.min(...off);
    const hi = Math.max(...off);
    if (lo <= 0 && hi >= 0 && hi - lo < Math.PI) return true;
    return Math.min(...off.map(Math.abs)) <= CAPTION_CONE;
  }

  /** Esc: an opened project winds back in and stays chosen; otherwise the choice is let go. */
  escape() {
    if (this.novaActive) {
      this.novaTouch();
      this.novaInput("key");
      return;
    }
    if (this.opened && !this.closing) {
      this.keyHold = true;
      this.close();
      return;
    }
    this.keyHold = false;
    if (this.hovered && !this.opened) this.setHover(null);
  }

  /** A tap or click. Returns what to do with it; the panel owns routing and sound. */
  tap(clientX: number, clientY: number, touch: boolean): "case" | "open" | "select" | "close" | "none" {
    if (!this.ready) return "none";
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // The covers out: a cover (or its caption) gathers everything and opens it, a finger's first
    // tap only chooses it, and empty space sends them home.
    if (this.novaActive) {
      this.novaTouch();
      if (!this.fieldOn || this.novaDeaf) return "none";
      const b = (this.onCaption(x, y) ? this.hovered : null) ?? this.beadAt(x, y);
      if (!b?.project) {
        if (this.hovered) this.setHover(null);
        this.novaInput("tap");
        return "none";
      }
      if (touch && b !== this.hovered) {
        this.setHover(b);
        return "select";
      }
      this.novaReturn({ to: b });
      return "open";
    }
    if (this.opened && this.closing) {
      // Caught on its way back in: the project, or another, opens from here.
      const again = this.beadAt(x, y);
      if (!again?.project) return "none";
      this.openBead(again);
      return "open";
    }
    // A ball pulled tight chooses nothing, and opens nothing.
    if (!this.opened && this.novaQuiet) return "none";
    if (this.opened) {
      // The second half of the double click that opened it is not a click on empty space. After
      // that, empty space winds it back from wherever the unspool has got to.
      if (performance.now() - this.openedAt < DOUBLE_CLICK) return "none";
      // The Case word answers once it has risen; on its way up it is not empty space either.
      if (this.onCase(x, y, true)) return this.unspool.p < 0.98 ? "none" : "case";
      if (this.frameAt(x, y)) return "none";
      this.close();
      return "close";
    }
    // The chosen project's caption answers for it where the veil has thinned the ball under its
    // words, and so does a click on the way down to it, while the grace holds the choice (the
    // label still says Open). Anywhere else a piece answers first, and a finger that finds none
    // still finds the caption's slot.
    const under = this.beadAt(x, y);
    const held = !touch && performance.now() < this.graceUntil && this.onTheWay(x, y, under === this.hovered ? null : under);
    const b = (this.onCaption(x, y) || held ? this.hovered : null) ?? under ?? (touch && this.onCaption(x, y, true) ? this.hovered : null);
    if (!b) {
      if (this.hovered) this.setHover(null);
      return "none";
    }
    // Touch has no hover: the first tap raises the caption, the second opens.
    if (touch && b !== this.hovered) {
      this.setHover(b);
      return "select";
    }
    if (!b.project) {
      if (b !== this.hovered) this.setHover(b);
      return "none";
    }
    this.openBead(b);
    return "open";
  }

  /** The bead whose piece is under the point (the nearest one in front), else the mark nearest it. */
  private beadAt(x: number, y: number): Bead | null {
    let best: Piece | null = null;
    const pad = 3;
    this.pieces.forEach((pc) => {
      if (pc.ink < 0.12 || !pc.mesh.visible) return;
      const keep = pc.bead === this.hovered ? 8 : 0;
      if (Math.abs(x - pc.sx) > pc.sw / 2 + pad + keep || Math.abs(y - pc.sy) > pc.sh / 2 + pad + keep) return;
      if (!best || pc.sz > best.sz || (pc.bead === this.hovered && best.bead !== this.hovered)) best = pc;
    });
    if (best) return (best as Piece).bead;
    // Out of the knot there are only the covers and their pieces.
    if (this.novaActive) return null;
    let mark: Bead | null = null;
    let bestD = Infinity;
    this.beads.forEach((b) => {
      if (b.pop < 0.5) return;
      const reach = (b === this.hovered ? 30 : 22) * (b.mz < -0.2 ? 0.6 : 1);
      const d = Math.hypot(x - b.mx, y - b.my) - (b.mz > 0 ? 4 : 0);
      if (d < reach && d < bestD) {
        bestD = d;
        mark = b;
      }
    });
    return mark;
  }

  /**
   * On the chosen project's caption: its words and the veil's pad round them;
   * for a finger that missed everything else, a little more, and the slot's
   * whole width under the ball.
   */
  private onCaption(x: number, y: number, touch = false) {
    const b = this.hovered;
    if (!b || this.opened) return false;
    const [x0, y0, x1, y1] = this.captionBox(b);
    if (touch && !this.capSide) {
      const half = Math.min(this.width / 2, Math.max((x1 - x0) / 2, WHY_MAX / 2) + 16);
      return y > y0 - 8 && y < y1 + 8 && Math.abs(x - this.cx) < half;
    }
    const pad = touch ? 16 : CAP_VEIL_PAD;
    return x > x0 - pad && x < x1 + pad && y > y0 - pad && y < y1 + pad;
  }

  private frameAt(x: number, y: number): Piece | null {
    if (!this.opened) return null;
    return this.opened.pieces.find((pc) => Math.abs(x - pc.sx) <= pc.sw / 2 && Math.abs(y - pc.sy) <= pc.sh / 2) ?? null;
  }

  private onCase(x: number, y: number, early = false) {
    const o = this.opened?.open;
    if (!o || (this.unspool.p < 0.98 && !early)) return false;
    const m = o.link;
    const b = blockBounds(m.t);
    const ox = m.base.x + this.openGroup.position.x;
    const oy = -(m.base.y + this.openGroup.position.y);
    return x >= ox + b[0] - 8 && x <= ox + b[2] + 8 && y >= oy - b[3] - 8 && y <= oy - b[1] + 8;
  }

  /** Under the pointer the Case word takes the pointer cursor and lifts 1px, as the links on About do. */
  private setCaseHot(on: boolean) {
    if (on === this.caseHot) return;
    this.caseHot = on;
    this.canvas.style.cursor = on ? "pointer" : "";
    const link = this.opened?.open?.link;
    if (!link) return;
    const rest = link.base.y - this.caseLift.v;
    gsap.to(this.caseLift, {
      v: on ? 1 : 0,
      duration: 0.15,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => {
        link.base.y = rest + this.caseLift.v;
        this.applyMask(link);
      },
    });
  }

  /** The cover frame of an opened project turns to its hover media, 400ms after the pointer arrives, as the grid did. */
  private setCoverHot(pc: Piece | null) {
    if (pc === this.coverHot) return;
    const prev = this.coverHot;
    this.coverHot = pc;
    if (prev) this.showMoving(prev, false);
    if (pc) this.showMoving(pc, true, 0.4);
  }

  get focused(): Project | null {
    return this.opened?.project ?? this.hovered?.project ?? null;
  }

  /** A project is out on its line, and not on its way back in. */
  get isOpen() {
    return !!this.opened && !this.closing;
  }

  private setHover(b: Bead | null, byPointer = false) {
    const prev = this.hovered;
    this.hovered = b;
    this.graceUntil = 0;
    this.leftFrom = byPointer && b && this.pointerAt ? { ...this.pointerAt } : null;
    if (prev && prev !== this.opened) this.captionOff(prev);
    if (b && b !== this.opened) this.captionOn(b);
    // A chosen project is a click from being opened: its pluck is built while the page is idle.
    if (b?.project) this.primePluck(b);
    this.opts.onHover(b ? (b.project ? { kind: "project", project: b.project } : { kind: "study", piece: b.study! }) : null, byPointer);
  }

  private captionOn(b: Bead) {
    const { name, status, why } = b.cap;
    // In the supernova's field it stands beside its cover's knot; under the ball, where it would
    // land on its own pieces, it rises already stepped down.
    if (this.fieldOn) this.placeFieldCaption(b);
    else if (!this.capSide) {
      b.capDy = this.captionClear(b);
      this.placeCaption(b);
    }
    this.ctx.add(() => {
      [name, status, why].forEach((m, k) => {
        gsap.to(m, { offset: 0, duration: this.dur(0.6), delay: this.dur(0.04 * k), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m) });
      });
    });
  }

  private captionOff(b: Bead) {
    const { name, status, why } = b.cap;
    this.ctx.add(() => {
      [name, status, why].forEach((m) => {
        gsap.to(m, { offset: m.span, duration: this.dur(0.35), ease: "power3.out", overwrite: true, onUpdate: () => this.applyMask(m) });
      });
    });
  }

  // ---------------------------------------------------------------- open

  /** Opens a project by slug: the deep link, or the URL's hash changing. */
  openSlug(slug: string) {
    if (!this.ready) {
      this.pendingOpen = slug;
      return;
    }
    const b = this.beads.find((k) => k.project?.slug === slug);
    if (b) this.openBead(b);
  }

  /**
   * The unspool: the project's stretch of thread peels off the ball, its
   * mark first and its ends last, and straightens into a horizon across the
   * viewport while the ball recedes behind it; the pieces ride the thread out
   * to their places and grow into frames; then the words rise. `immediate`:
   * a deep link arriving, which nobody chose just now, so it has no focus cue.
   */
  openBead(b: Bead, o: { immediate?: boolean } = {}) {
    if (!b.project || !b.open) return;
    // The covers out: everything gathers first, then it opens (see novaGather).
    if (this.novaActive) {
      this.novaGather(b);
      return;
    }
    if (this.opened === b && !this.closing) return;
    if (this.opened && this.opened !== b) {
      this.close(() => this.openBead(b));
      return;
    }
    this.openTl?.kill();
    this.afterClose = null;
    this.closing = false;
    // Opening mid-reveal: the thread is wound at once.
    if (this.intro?.isActive()) this.intro.progress(1);
    if (this.draw.value < 1) this.draw.value = 1;
    this.cursorOn = true;
    if (this.hovered && this.hovered !== b) this.captionOff(this.hovered);
    if (this.hovered === b) this.captionOff(b);
    this.hovered = b;
    this.graceUntil = 0;
    this.leftFrom = null;
    this.opened = b;
    this.openedAt = performance.now();
    this.plucked = null;
    this.scroll.cur = this.scroll.target = 0;
    this.layoutO = null;
    this.layoutOpen(b);
    this.targetYaw = 0;
    this.opts.onOpen(b.project);
    this.opts.onHover(null, false);
    if (!o.immediate) sfx.play("focus");
    this.primePluck(b);
    b.pieces.forEach((pc) => {
      this.fetchMoving(pc);
      pc.landed = false;
    });

    const rm = !!this.opts.reducedMotion;
    this.turnTo(b, rm ? 0 : 0.9);
    const tl = gsap.timeline();
    if (rm) {
      this.unspool.p = 1;
      this.fadeIn.value = 0;
      tl.to(this.fadeIn, { value: 1, duration: 0.3, ease: "power2.inOut" }, 0);
    } else {
      this.fadeIn.value = 1;
      // From wherever it is: a project caught winding back unspools again from there.
      tl.to(this.unspool, { p: 1, duration: OPEN_DUR * (1 - this.unspool.p), ease: "none" }, 0);
    }
    const o2 = b.open;
    const words = [o2.name, o2.status, o2.why, o2.summary, o2.link];
    words.forEach((m) => {
      gsap.killTweensOf(m);
      m.offset = m.span;
      m.t.visible = true;
      this.applyMask(m);
    });
    // Reduced motion: the words are simply there at the crossfade's midpoint.
    const at = rm ? 0.15 : Math.max(0, OPEN_DUR * (0.72 - this.unspool.p));
    words.forEach((m, k) => {
      tl.to(m, { offset: 0, duration: rm ? 0 : 0.9, ease: "power4.out", onUpdate: () => this.applyMask(m) }, at + (rm ? 0 : k * 0.07));
    });
    tl.call(() => b.pieces.forEach((pc) => pc.index > 0 && this.showMoving(pc, true)), undefined, rm ? 0.3 : OPEN_DUR * (1 - this.unspool.p));
    // Taut: the horizon is plucked, a deep link's too, since it unspools on screen like any other.
    tl.call(() => this.pluck(b), undefined, rm ? 0.3 : OPEN_DUR * (1 - this.unspool.p));
    this.openTl = tl;
  }

  /** How long a project ran, in whole years, from what the data holds (see PLUCK_HZ). */
  private runOf(p: Project) {
    const end = p.status === "alive" ? Math.floor(fractionalYear(new Date())) : p.year;
    const start = Math.min(p.year, ...this.items.filter((it) => it.project === p.slug).map((it) => it.year));
    return Math.max(0, end - start);
  }

  /** A project's pluck: its note, from how long it ran, and whether it only thuds (dead work, which hangs inward). */
  private noteOf(p: Project, b: Bead) {
    return { hz: PLUCK_HZ[Math.min(PLUCK_HZ.length - 1, this.runOf(p))], dead: b.side < 0 };
  }

  /** Builds a project's pluck ahead of its taut frame (with sound on; nothing otherwise). */
  private primePluck(b: Bead) {
    if (!b.project) return;
    const { hz, dead } = this.noteOf(b.project, b);
    sfx.primePluck(hz, dead ? "thud" : "ring");
  }

  /**
   * The horizon comes taut and is plucked: heard with sound on, seen either
   * way, never moved under reduced motion. Not once the visitor has left for
   * another tab, where it would ring on after them.
   */
  private pluck(b: Bead) {
    if (!b.project || this.opened !== b || this.closing) return;
    if (this.opts.isCurrent && !this.opts.isCurrent()) return;
    const { hz, dead } = this.noteOf(b.project, b);
    this.ring = sfx.pluck(hz, dead ? "thud" : "ring");
    this.plucked = this.opts.reducedMotion ? null : { at: this.clock, hz, dead };
  }

  /** Stops the pluck's sound, if it still rings, over `over` seconds. */
  private unpluck(over?: number) {
    this.ring?.(over);
    this.ring = null;
    this.plucked = null;
  }

  /**
   * How far the plucked horizon stands off its line at `along`, px, this
   * frame: the standing wave's nodes at the mark and the stretch's far end.
   */
  private pluckAt(L: Layout, along: number, amp: number, n: number) {
    const u = (along - L.mark) / Math.max(1, L.end - L.mark);
    if (u <= 0 || u >= 1) return 0;
    return amp * Math.sin(n * Math.PI * u);
  }

  /** Esc, or a click on empty space: the line winds back into the ball in 0.9s. */
  close(then?: () => void) {
    const b = this.opened;
    if (!b || !b.open) return;
    if (this.afterClose && then) {
      this.afterClose = then;
      return;
    }
    this.afterClose = then ?? null;
    this.closing = true;
    this.openTl?.kill();
    // The line goes slack: its ring and its wave stop.
    this.unpluck(PLUCK_SLACK);
    this.setCaseHot(false);
    this.setCoverHot(null);
    if (!then) sfx.play("close");
    const o = b.open;
    const rm = !!this.opts.reducedMotion;
    const tl = gsap.timeline({
      onComplete: () => {
        this.closing = false;
        this.opened = null;
        this.layoutO = null;
        this.openTl = null;
        this.plucked = null;
        this.fadeIn.value = 0;
        this.unspool.p = 0;
        b.pieces.forEach((pc) => this.showMoving(pc, false));
        [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
          m.t.visible = false;
        });
        const next = this.afterClose;
        this.afterClose = null;
        if (next) {
          next();
          return;
        }
        this.opts.onOpen(null);
        // The one that was open stays chosen, so Enter opens it again; the pointer decides otherwise.
        this.hovered = null;
        if (this.pointerAt && !this.keyHold) this.hoverAtPointer();
        else this.setHover(b);
      },
    });
    [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
      tl.to(m, { offset: m.span, duration: rm ? 0 : 0.3, ease: "power3.in", onUpdate: () => this.applyMask(m) }, rm ? 0.15 : 0);
    });
    if (rm) tl.to(this.fadeIn, { value: 0, duration: 0.3, ease: "power2.inOut" }, 0);
    else {
      tl.to(this.unspool, { p: 0, duration: CLOSE_DUR, ease: "power1.inOut" }, 0.1);
      tl.to(this.scroll, { cur: 0, target: 0, duration: CLOSE_DUR * 0.6, ease: "power2.inOut" }, 0);
    }
    this.openTl = tl;
  }

  /** Video pieces, and the cover's hover media, load when their project first opens. */
  private fetchMoving(pc: Piece) {
    if (pc.moving || !pc.movingMedia) return;
    pc.moving = loadMedia(pc.movingMedia)
      .then((l) => {
        if (this.disposed) {
          l.dispose();
          return null;
        }
        const u = pc.mesh.material.uniforms;
        u.uAlt.value = l.texture;
        u.uAltAspect.value = l.aspect || pc.aspect;
        return l;
      })
      .catch(() => null);
  }

  private showMoving(pc: Piece, on: boolean, delay = 0) {
    if (!pc.moving) return;
    const u = pc.mesh.material.uniforms;
    void pc.moving.then((l) => {
      if (!l || this.disposed) return;
      if (on && this.opened !== pc.bead) return;
      if (on) void l.video?.play().catch(() => undefined);
      gsap.to(u.uMix, {
        value: on ? 1 : 0,
        duration: this.dur(on ? 0.35 : 0.25),
        delay: this.dur(delay),
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => {
          if (!on) l.video?.pause();
        },
      });
    });
  }

  // ---------------------------------------------------------------- the supernova's charge

  /**
   * Whether the ball can charge at all: not with reduced motion (it has no
   * free spin there), not before the thread has wound itself, not while a
   * project is out or winding back, and not during a slide or on another tab.
   */
  private get novaOn() {
    if (this.opts.reducedMotion || !this.ready || !this.cursorOn || this.draw.value < 1 || this.opened || this.novaActive) return false;
    return !this.opts.isCurrent || this.opts.isCurrent();
  }

  /** Past the point of no return, or gone: the charge finishes whatever the hand does. */
  private get novaBound() {
    return this.nova.committed || this.novaActive;
  }

  /** Pulled in far enough that nothing is chosen or opened (see NOVA_QUIET). */
  private get novaQuiet() {
    return this.nova.c >= NOVA_QUIET || this.novaBound;
  }

  /** How much faster the ball is drawn spinning than it is turned: (R/R_eff)², to NOVA_SPIN_MAX. 1 at rest. */
  private get spinK() {
    const c = this.nova.c;
    return c > 0 ? Math.min(NOVA_SPIN_MAX, 1 / (1 - NOVA_PULL * c) ** 2) : 1;
  }

  /** R_eff/R, with the sigh's swell. 1 at rest. */
  private get novaScale() {
    return (1 - NOVA_PULL * this.nova.c) * (1 + this.nova.swell.v);
  }

  /** The far side's ink: BACK_INK at rest, brighter as the ball pulls in. */
  private get backInk() {
    return lerp(BACK_INK, NOVA_BACK_INK, this.nova.c);
  }

  /** The tick's playbackRate: exactly 1 at rest, to NOVA_RATE at full charge. */
  private get tickRate() {
    const c = this.nova.c;
    return c > 0 ? lerp(1, NOVA_RATE, c) : 1;
  }

  /**
   * One frame of the charge. The hand drives it (a drag, the wheel over the
   * ball, a held arrow's free spin) and the ball's surface speed, |ω|·R, sets
   * how fast it rises past NOVA_S0; anything else lets it drain, except the
   * moment between two strokes. Past NOVA_COMMIT it finishes by itself, and
   * at full charge the ball collapses (see novaCollapse). Once it has, the
   * charge sleeps and the supernova runs its course (see novaRun).
   */
  private novaStep(dt: number) {
    const n = this.nova;
    if (this.novaActive) {
      this.novaRun(dt);
      // The heading: at half its ink through the collapse, then back to full for the covers.
      n.head += ((n.phase === "collapse" ? 1 : 0) - n.head) * (1 - Math.exp(-dt / 0.3));
      return;
    }
    const now = performance.now();
    const on = this.novaOn;
    // A held arrow, past NOVA_KEY_MS: the choice is let go and the ball spins freely, gathering pace.
    const key = n.key;
    if (key.dir && !on) this.keyUp();
    else if (key.dir && now - key.at >= NOVA_KEY_MS) {
      if (!key.free) {
        key.free = true;
        this.stopTurn();
        key.spin = Math.max(0, key.dir * this.vel);
        // The arrow is winding now, not choosing.
        if (this.hovered && !this.opened) this.setHover(null);
      }
      key.spin = Math.min(NOVA_KEY_MAX, key.spin + NOVA_KEY_ACCEL * dt);
      this.vel = key.dir * key.spin;
    }
    const R = this.R;
    // Past the point of no return, and holding, the ball keeps spinning at S0 at least.
    if (Math.abs(this.vel) > 0.05) n.sign = Math.sign(this.vel);
    if (on && this.novaBound && Math.abs(this.vel) * R < NOVA_S0) this.vel = (n.sign * NOVA_S0) / R;
    const S = Math.abs(this.vel) * R;
    const driven = on && (key.free || now - n.dragAt < (n.finger ? NOVA_FLICK_MS : NOVA_DRAG_MS) || now - n.wheelAt < NOVA_WHEEL_MS);
    const fast = S >= NOVA_S0;
    const rise = NOVA_RISE + NOVA_RISE_MORE * Math.min(1, (S - NOVA_S0) / NOVA_S0);
    if (driven && fast) n.drove = now;
    const cap = now < n.coolUntil ? NOVA_COOL_CAP : 1;
    const was = n.c;
    let c = was;
    if (!on) {
      // Off (a project opening, a slide, another tab): it lets go, quickly if a project is out. A
      // charge cut off past the point of no return has had its go all the same.
      c -= (this.opened ? 3 : 1) * NOVA_DRAIN * dt;
      if (this.novaBound) n.coolUntil = now + NOVA_COOL;
      n.committed = false;
    } else if (n.committed) {
      c += Math.max(NOVA_RISE, driven && fast ? rise : 0) * dt;
      if (c >= 1) {
        // Full charge: the ball collapses.
        n.c = 1;
        n.head = 1;
        this.bend = 1;
        this.novaCollapse();
        return;
      }
    } else if (c > cap) c = Math.max(cap, c - NOVA_DRAIN * dt);
    else if (driven && fast) {
      c = Math.min(cap, c + rise * dt);
      if (c >= NOVA_COMMIT && cap >= 1) n.committed = true;
    } else if (!(fast && now - n.drove < NOVA_BETWEEN_MS)) c -= NOVA_DRAIN * dt;
    c = clamp01(c);
    n.c = c;
    this.bend = c;
    if (c > was) {
      n.peak = Math.max(n.peak, c);
      // Wound up again mid-sigh: the swell gives way, quickly.
      n.swell.t = -1;
    } else if (c === 0 && was > 0) {
      // Only a ball left to itself sighs: one that let go because a project opened just lets go.
      if (on) this.sigh();
      else n.peak = 0;
    }
    this.swell(dt);
    n.head = c;
    // Pulled tight, it chooses nothing.
    if (this.novaQuiet && this.hovered && !this.opened) this.setHover(null);
    this.setPhase(c > 0 ? "charge" : "idle");
  }

  /**
   * Let go, the ball has opened all the way: it goes on a little over,
   * NOVA_SIGH of its size after a near miss or more and less after a small
   * charge, at the pace it was opening, and settles back (see swell).
   */
  private sigh() {
    const n = this.nova;
    const sw = n.swell;
    sw.amount = NOVA_SIGH * Math.min(1, n.peak / NOVA_SIGH_FULL);
    n.peak = 0;
    if (sw.amount < 0.002) return;
    // Out at the pace it was opening (R grows at NOVA_PULL·NOVA_DRAIN a second), so the turn is smooth.
    sw.out = Math.max(0.06, (sw.amount * Math.PI) / 2 / (NOVA_PULL * NOVA_DRAIN));
    sw.t = 0;
  }

  /** The sigh's swell this frame: out on a quarter sine, back over NOVA_SIGH_BACK on a half cosine; cut short, it fades in 50ms. */
  private swell(dt: number) {
    const sw = this.nova.swell;
    if (sw.t < 0) {
      sw.v = sw.v < 1e-4 ? 0 : sw.v * Math.exp(-dt / 0.05);
      return;
    }
    sw.t += dt;
    const { t, out, amount } = sw;
    if (t < out) sw.v = amount * Math.sin(((Math.PI / 2) * t) / out);
    else if (t < out + NOVA_SIGH_BACK) sw.v = amount * (0.5 + 0.5 * Math.cos((Math.PI * (t - out)) / NOVA_SIGH_BACK));
    else {
      sw.v = 0;
      sw.t = -1;
    }
  }

  /**
   * The whirr: from NOVA_WHIRR_FROM, the marks' ticks and a tick as each
   * piece on the ball, and each turn of the thread, crosses the front, placed
   * on the audio clock NOVA_WHIRR_AHEAD seconds ahead of the ball as it spins,
   * so none is lost to the tick's throttle and none lands late. A mark ticks
   * where crossings() hears it, at the front and as it comes round the limb,
   * at its own level; a turn of the thread has no one place, so each ticks
   * where its lean walked to, a golden angle round from the last. The marks
   * keep what they would have had (thinned only past NOVA_WHIRR_MAX a second
   * on their own), the rest share what is left of it and come in thin: each
   * tick has its place in the thinning, so a rising charge only adds to the
   * ones already heard. No tick lands within NOVA_WHIRR_APART of another, a
   * mark's before the rest. Heard with sound on; placed only while the ball
   * is on screen and at rest.
   */
  private whirr(dt: number) {
    const n = this.nova;
    const a = this.angle + this.yaw;
    const w = (a - n.lastA) / Math.max(dt, 1e-3);
    n.lastA = a;
    n.whirl += (w - n.whirl) * (1 - Math.exp(-dt / 0.05));
    const now = performance.now();
    n.trains = n.trains.filter((t) => t.until > now);
    const clock = sfx.clock;
    n.heard = n.heard.filter((t) => t > clock - NOVA_WHIRR_APART);
    const on = this.novaOn;
    const ramp = smooth(clamp01((n.c - NOVA_WHIRR_FROM) / (1 - NOVA_WHIRR_FROM)));
    const spin = n.whirl;
    n.whirring = on && sfx.awake && ramp > 0 && Math.abs(spin) >= 0.5;
    if (!n.whirring) {
      n.placed = null;
      // Off: what is still to sound goes with it.
      if (!on) this.hushWhirr();
      return;
    }
    const dir = Math.sign(spin);
    const ahead = a + spin * NOVA_WHIRR_AHEAD;
    // From where the last frame placed up to, never behind the ball (a late tick is a wrong one).
    let from = n.placed !== null && n.placedDir === dir ? n.placed : a;
    from = dir > 0 ? Math.max(from, a) : Math.min(from, a);
    n.placedDir = dir;
    // The marks are the whirr's as far ahead as it places them: crossings() leaves them be.
    n.marksUntil = now + NOVA_WHIRR_AHEAD * 1000 + 1000 * NOVA_WHIRR_APART;
    // Already placed this far ahead (the spin eased off): nothing new, and nothing placed twice.
    if ((ahead - from) * dir <= 1e-6) {
      n.placed = from;
      return;
    }
    n.placed = ahead;
    const lo = Math.min(from, ahead);
    const hi = Math.max(from, ahead);
    const TAU = Math.PI * 2;
    const drawn = this.draw.value * (this.M - 1);
    // The marks: at the front, and coming round the limb a quarter turn before it.
    const marks: number[] = [];
    const p = this.tmp2;
    this.beads.forEach((b) => {
      if (!b.project || b.pop <= 0.5 || b.i > drawn) return;
      this.samplePos(b.i, p);
      const lon = Math.atan2(p.x, p.z);
      marks.push(lon, lon + (dir * Math.PI) / 2);
    });
    // The rest: the pieces on the ball, then the turns.
    const rest: number[] = [];
    this.pieces.forEach((pc) => {
      if (pc.onBall && pc.bead.pop > 0.5 && pc.bead.i <= drawn) rest.push(pc.lon);
    });
    const turns = Math.max(1, Math.round(this.turns));
    for (let k = 0; k < turns; k++) rest.push(-k * GOLDEN);
    // Thinned by the faster of the eased spin and this frame's, so a hand speeding up never overfills it.
    const perTurn = Math.max(Math.abs(spin), Math.abs(w)) / TAU;
    // The spacing below takes back some of what it is given (at 40 a second, about a third), so
    // the thinning aims that much higher to be left with NOVA_WHIRR_MAX.
    const most = NOVA_WHIRR_MAX / (1 - NOVA_WHIRR_MAX * NOVA_WHIRR_APART);
    const markShare = Math.min(1, most / Math.max(1e-6, marks.length * perTurn));
    const left = Math.max(0, most - marks.length * perTurn * markShare);
    const restShare = Math.min(ramp, left / Math.max(1e-6, rest.length * perTurn));
    // When (s from now) each crosses the front in this frame's stretch: where angle + lon is a whole turn.
    const cross = (lons: number[], share: number) => {
      const out: number[] = [];
      lons.forEach((lon, j) => {
        // Each has its place in the thinning: a golden-ratio sequence, so any share is spread evenly.
        if ((j * 0.6180339887) % 1 >= share) return;
        for (let t = Math.ceil((lo + lon) / TAU) * TAU - lon; t <= hi; t += TAU) {
          if (t > lo || (t === lo && from === a)) out.push(Math.max(0, (t - a) / spin));
        }
      });
      return out.sort((x, y) => x - y);
    };
    // Spaced on the audio clock: none within NOVA_WHIRR_APART of a tick already placed or played, the marks first.
    const apart = (offsets: number[]) =>
      offsets.filter((o) => {
        const t = clock + o;
        if (n.heard.some((h) => Math.abs(h - t) < NOVA_WHIRR_APART)) return false;
        n.heard.push(t);
        return true;
      });
    const onMarks = apart(cross(marks, markShare));
    const onRest = apart(cross(rest, restShare));
    const rate = this.tickRate;
    const place = (offsets: number[], gain: number) => {
      if (!offsets.length) return;
      const cancel = sfx.train(offsets, { gain, rate });
      n.trains.push({ cancel, until: now + (offsets[offsets.length - 1] + 0.05) * 1000 });
    };
    place(onMarks, MARK_TICK);
    place(onRest, lerp(NOVA_WHIRR_GAIN[0], NOVA_WHIRR_GAIN[1], ramp));
  }

  /** Stops the whirr's ticks still to sound. */
  private hushWhirr() {
    this.nova.trains.forEach((t) => t.cancel());
    this.nova.trains = [];
  }

  // ---------------------------------------------------------------- the supernova: collapse, burst, float, return

  /** Collapsing, burst, floating or coming back: the ball is not itself, and the charge sleeps. */
  private get novaActive() {
    const p = this.nova.phase;
    return p === "collapse" || p === "burst" || p === "float" || p === "return";
  }

  /** The covers are out of the knot and not on their way home: the field's grammar holds. */
  private get fieldOn() {
    const p = this.nova.phase;
    return p === "burst" || p === "float";
  }

  /** Too soon after the collapse for anything the visitor does to count (see NOVA_DEAF). */
  private get novaDeaf() {
    return this.novaActive && this.nova.phase !== "return" && this.nova.t < NOVA_DEAF;
  }

  /** Seconds since the burst, negative before it: the filaments' and the covers' clock, which runs on through the return. */
  private get burstT() {
    return this.nova.t - NOVA_BURST;
  }

  /** Enters a phase and tells the page (see NOVA_EVENT). */
  private setPhase(p: NovaPhase) {
    if (this.nova.phase === p) return;
    this.nova.phase = p;
    window.dispatchEvent(new CustomEvent(NOVA_EVENT, { detail: { phase: p } }));
  }

  /** Something moved on the stage: the float's stillness starts again. */
  private novaTouch() {
    if (this.novaActive) this.nova.touched = this.nova.t;
  }

  /**
   * Full charge: the ball drops to a knot and the ticks stop dead, and for
   * NOVA_DEAF nothing the visitor does counts. What the burst needs is worked
   * out now, from the ball as it stands: each sample's way out, each
   * project's, and the field the covers will settle into. The bloom is placed
   * on the audio clock to land with the ring.
   */
  private novaCollapse() {
    const n = this.nova;
    // A charge always comes first, however quickly it went.
    this.setPhase("charge");
    n.t = 0;
    n.a0 = this.angle;
    n.y0 = this.yaw;
    n.committed = false;
    n.burst = false;
    n.yearsUp = false;
    n.shape = 1;
    n.pendingTo = null;
    // The float's clocks run on the supernova's own, which starts again now.
    n.touched = 0;
    n.floatAt = 0;
    n.chosenAt = -Infinity;
    n.pointed = false;
    n.airUntil = -Infinity;
    n.collapsedAt = performance.now();
    // The way it was spinning: its momentum goes out with the thread, as a swirl.
    n.spin = Math.sign(IDLE * this.idleK + this.vel) || n.sign;
    this.hushWhirr();
    n.placed = null;
    n.whirring = false;
    this.stopTurn();
    this.keyUp();
    if (this.hovered) this.setHover(null);
    // No charge while it plays out; the cooldown proper starts when the ball is back (novaFinish).
    n.coolUntil = Infinity;
    n.bend0 = this.bend;
    this.novaWays();
    this.beads.forEach((b) => {
      b.lag = 0;
      b.docked = false;
    });
    this.setPhase("collapse");
    void this.layoutField();
    n.bloom = sfx.bloom(NOVA_BURST);
  }

  /** The ball has gone into the knot: the charge that pulled it in is spent, and it will come back as it was. */
  private novaGone() {
    const n = this.nova;
    n.c = 0;
    n.peak = 0;
    this.bend = 0;
    n.swell.v = 0;
    n.swell.t = -1;
    this.angle = n.a0;
    this.yaw = n.y0;
    this.vel = 0;
    this.idleK = 0;
    this.shake.x = 0;
    this.shake.y = 0;
  }

  /**
   * The burst: one ring, the bloom (already on its way), the thread and the
   * covers flying out, and the bed going through the wall. The heading's
   * tail gives way to NOVA_WAIT.
   */
  private novaBurst() {
    const n = this.nova;
    this.novaGone();
    n.burst = true;
    // Sounding now: from here it plays out whatever happens.
    n.bloom = null;
    if (!this.opts.isCurrent || this.opts.isCurrent()) {
      sfx.air(NOVA_AIR, NOVA_AIR_IN);
      n.airShut = true;
    }
    this.swapTail(true);
    this.setPhase("burst");
  }

  /**
   * One frame of the supernova after the collapse. The knot drops and holds
   * its breath; the burst comes at NOVA_BURST; the covers settle, float, and
   * go home by themselves (see NOVA_STILLNESS) unless something sends them
   * sooner. A page that stops being the one on screen (a slide away)
   * gathers everything quickly and opens nothing.
   */
  private novaRun(dt: number) {
    const n = this.nova;
    n.t += dt;
    const t = n.t;
    if (this.opts.isCurrent && !this.opts.isCurrent()) {
      if (n.phase !== "return") this.novaReturn({ quick: true });
      else this.novaHurry();
    }
    if (n.phase === "collapse") {
      // Down to a knot NOVA_KNOT across, power4.in, still spinning as it goes.
      const r0 = this.R * this.novaScale;
      n.shape = lerp(1, NOVA_KNOT / 2 / Math.max(1, r0), clamp01(t / NOVA_DROP) ** 4);
      if (t >= NOVA_DROP) {
        // The held breath: stillness and silence, the knot trembling by a pixel.
        this.vel = 0;
        const w = t * Math.PI * 2;
        this.shake.x = NOVA_TREMBLE * (0.7 * Math.sin(w * 11) + 0.3 * Math.sin(w * 23 + 1.3));
        this.shake.y = NOVA_TREMBLE * (0.7 * Math.sin(w * 13 + 0.7) + 0.3 * Math.sin(w * 19 + 2.1));
      }
      if (t >= NOVA_BURST) this.novaBurst();
      return;
    }
    if (n.phase === "return") {
      this.windStep();
      return;
    }
    // Out on the table.
    const tau = this.burstT;
    if (!n.yearsUp && tau >= NOVA_SETTLE * 0.6) {
      n.yearsUp = true;
      this.yearsRise(true);
    }
    if (n.phase === "burst" && tau >= NOVA_SETTLE) {
      n.floatAt = t;
      n.touched = Math.max(n.touched, t);
      this.setPhase("float");
    }
    if (this.novaDeaf) return;
    // A project asked for too soon (a hash, Enter, a click in the deaf moment): now it gathers.
    if (n.pendingTo) {
      const to = n.pendingTo;
      n.pendingTo = null;
      this.novaReturn({ to });
      return;
    }
    if (n.phase !== "float") return;
    const still = this.vertical || n.finger ? NOVA_PHONE_FLOAT : NOVA_STILLNESS;
    const quiet = t - n.touched >= still;
    // A pointer resting on a cover holds them all out. A finger's choice has no hover to end, so it
    // holds nothing: the float goes on NOVA_PHONE_FLOAT from the last touch, chosen or not.
    const held = !!this.hovered && !n.finger;
    if (held) n.chosenAt = t;
    const long = t - n.floatAt >= NOVA_FLOAT_MAX && t - n.chosenAt >= NOVA_FLOAT_GRACE;
    if (this.hovered ? !held && quiet : quiet || long) this.novaReturn();
  }

  /**
   * A drag, a wheel, Escape or a tap on empty space while the covers are
   * out: they go home at once. During the return a new drag hurries it.
   * Nothing counts until NOVA_DEAF has passed.
   */
  private novaInput(kind: "drag" | "wheel" | "key" | "tap") {
    if (this.novaDeaf) return;
    if (this.fieldOn) this.novaReturn();
    else if (this.nova.phase === "return" && kind === "drag") this.novaHurry();
  }

  /** A project asked for while the covers are out: everything gathers, then it opens; asked too soon, as soon as it can. */
  private novaGather(b: Bead) {
    const n = this.nova;
    if (n.phase === "return") n.wind.to = b;
    else if (n.phase === "collapse" || this.novaDeaf) n.pendingTo = b;
    else this.novaReturn({ to: b });
  }

  /**
   * The covers go home. By itself, or at a drag, a wheel, Escape or a tap on
   * empty space: the slow return. `to`: a cover was chosen, so everything
   * gathers in NOVA_GATHER and that project opens. `quick`: the page is
   * leaving, so it gathers as quickly and opens nothing. The heading's tail
   * comes back, the numerals go, and the bed's wall opens over the same span.
   */
  private novaReturn(o: { to?: Bead; quick?: boolean } = {}) {
    const n = this.nova;
    if (n.phase === "return") {
      if (o.to) n.wind.to = o.to;
      return;
    }
    const quick = !!o.to || !!o.quick;
    // Sent home before the burst (only a slide away does that): the bloom never sounds, and the
    // ball comes straight back out of the knot.
    if (n.phase === "collapse") {
      n.bloom?.();
      n.bloom = null;
      this.novaGone();
    }
    n.wind = { at: n.t, span: quick ? NOVA_GATHER : NOVA_WIND, over: !quick, u: 0, to: o.to ?? null, hurried: !!o.quick };
    this.pullLags();
    n.pendingTo = null;
    if (this.hovered) this.setHover(null);
    this.swapTail(false);
    this.yearsRise(false);
    if (n.airShut) {
      const over = quick ? NOVA_GATHER : NOVA_WIND + NOVA_OVER_BACK;
      sfx.air(AIR_OPEN, over);
      n.airShut = false;
      n.airUntil = n.t + over;
    }
    this.setPhase("return");
  }

  /**
   * A new hand on the ball as it comes back: what is left of the pull is
   * done in NOVA_HURRY, and the swell is left out, so the ball is there to be
   * turned.
   */
  private novaHurry() {
    const n = this.nova;
    const w = n.wind;
    if (n.phase !== "return" || w.hurried) return;
    w.hurried = true;
    const u = clamp01((n.t - w.at) / w.span);
    // The same point in the pull (everything is a function of u), reached sooner: nothing jumps.
    const left = Math.max(0.05, 1 - u);
    w.span = NOVA_HURRY / left;
    w.at = n.t - u * w.span;
    w.over = false;
    // The bed's wall opens with the ball, not on the slow return's clock.
    if (n.airUntil > n.t + NOVA_HURRY) {
      sfx.air(AIR_OPEN, NOVA_HURRY);
      n.airUntil = n.t + NOVA_HURRY;
    }
  }

  /**
   * How late in the pull each thing sets off (0..NOVA_PULL_LAG of it), by how
   * far out it lies: each sample of the thread by where the burst threw it,
   * each project by its cover's place in the field (or its sample's, if it
   * stayed in the knot). Worked out once as the return begins.
   */
  private pullLags() {
    const M = this.M;
    if (this.lags.length !== M) this.lags = new Float32Array(M);
    let far = 0;
    for (let i = 0; i < M; i++) far = Math.max(far, Math.hypot(this.BX[i] ?? 0, this.BY[i] ?? 0));
    for (let i = 0; i < M; i++) this.lags[i] = far > 0 ? (NOVA_PULL_LAG * Math.hypot(this.BX[i] ?? 0, this.BY[i] ?? 0)) / far : 0;
    const out = this.beads.map((b) => {
      const f = this.field.get(b);
      return f ? Math.hypot(f.x - this.cx, f.y - this.cy) : -1;
    });
    const farCover = Math.max(0, ...out);
    this.beads.forEach((b, k) => (b.lag = out[k] >= 0 && farCover > 0 ? (NOVA_PULL_LAG * out[k]) / farCover : (this.lags[b.i] ?? 0)));
  }

  /** How far a thing that sets off `lag` into the pull has come home (0..1), `u` of the way through it. */
  private pulled(lag: number, u = this.nova.wind.u) {
    return magnet(clamp01((u - lag) / (1 - NOVA_PULL_LAG)));
  }

  /** How far sample i has come home onto the ball (0..1). */
  private kAt(i: number) {
    return this.pulled(this.lags[i] ?? 0);
  }

  /**
   * One frame of the return: the pull runs on (everything's place is a
   * function of how far through it is, u), each project docks with its tick
   * as its cover lands, and as it finishes the ball swells to 1 + NOVA_OVER
   * and settles.
   */
  private windStep() {
    const n = this.nova;
    const w = n.wind;
    const rt = n.t - w.at;
    w.u = clamp01(rt / w.span);
    if (this.lags.length !== this.M) this.pullLags();
    const here = !this.opts.isCurrent || this.opts.isCurrent();
    this.order.forEach((b) => {
      if (!b.docked && this.pulled(b.lag) >= 1) {
        b.docked = true;
        if (b.project && here) this.dockTick();
      }
    });
    let over = 0;
    if (w.over) {
      const lead = 0.6;
      if (rt < w.span) over = NOVA_OVER * Math.sin((Math.PI / 2) * clamp01((rt - (w.span - lead)) / lead));
      else over = NOVA_OVER * (0.5 + 0.5 * Math.cos(Math.PI * clamp01((rt - w.span) / NOVA_OVER_BACK)));
    }
    n.shape = 1 + over;
    if (rt >= w.span + (w.over ? NOVA_OVER_BACK : 0) && this.beads.every((b) => b.docked)) this.novaFinish();
  }

  /** A project docks: its tick, the Projects tick at NOVA_DOCK_TICK, never lost to the one before (see NOVA_DOCK_APART). */
  private dockTick() {
    const n = this.nova;
    if (!sfx.awake) {
      sfx.play("tick", NOVA_DOCK_TICK);
      return;
    }
    const now = sfx.clock;
    const at = Math.max(now, n.dockAt + NOVA_DOCK_APART);
    n.dockAt = at;
    sfx.train([at - now], { gain: NOVA_DOCK_TICK });
  }

  /** The ball is itself again: the cooldown starts, the captions go back under the ball, and a chosen project opens. */
  private novaFinish() {
    const n = this.nova;
    const to = n.wind.to;
    n.wind.to = null;
    n.shape = 1;
    n.burst = false;
    n.yearsUp = false;
    n.collapsedAt = Infinity;
    n.coolUntil = performance.now() + NOVA_COOL;
    this.field.clear();
    this.captionsRun = null;
    this.pieces.forEach((pc) => (pc.field = null));
    this.years.forEach(({ m }) => {
      gsap.killTweensOf(m);
      m.t.visible = false;
    });
    this.beads.forEach((b) => {
      b.lag = 0;
      b.docked = true;
    });
    this.setPhase("idle");
    // The captions go back to their places under the ball.
    void this.layout();
    if (to) this.openBead(to);
  }

  /** The heading's tail gives way to NOVA_WAIT while the covers are out (`wait`), and comes back as they go home. */
  private swapTail(wait: boolean) {
    const h = this.heading;
    if (!h || this.waitShown === wait) return;
    this.waitShown = wait;
    const [off, on] = wait ? [h.tail, h.wait] : [h.wait, h.tail];
    this.ctx.add(() => {
      gsap.to(off, { offset: off.span, duration: 0.35, ease: "power3.in", overwrite: true, onUpdate: () => this.applyMask(off) });
      gsap.to(on, { offset: 0, duration: 0.9, delay: 0.3, ease: "power4.out", overwrite: true, onUpdate: () => this.applyMask(on) });
    });
  }

  /** The year numerals rise over their covers as they settle, and go as the covers leave. */
  private yearsRise(on: boolean) {
    this.ctx.add(() => {
      this.years.forEach(({ m }, k) => {
        gsap.to(m, {
          offset: on ? 0 : m.span,
          duration: on ? 0.9 : 0.35,
          delay: on ? 0.05 * k : 0,
          ease: on ? "power4.out" : "power3.in",
          overwrite: true,
          onUpdate: () => this.applyMask(m),
        });
      });
    });
  }

  /**
   * Each sample's way out of the knot: the way it faced at the collapse,
   * plus NOVA_SWIRL of its spin's tangent, bent up to NOVA_CRUMPLE and scaled
   * by noise along the thread, so the turns crumple into filaments while
   * neighbours stay together. Screen px for each px of blast radius.
   */
  private novaWays(w = this.bend) {
    const M = this.M;
    if (this.BX.length !== M) {
      this.BX = new Float32Array(M);
      this.BY = new Float32Array(M);
    }
    const n = this.nova;
    const a = n.a0 + n.y0;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const { ct, st } = this.rot;
    const P = this.P;
    const Q = this.P0;
    const swirl = NOVA_SWIRL * n.spin;
    for (let i = 0; i < M; i++) {
      const o = i * 3;
      let x = lerp(P[o], Q[o], w);
      let y = lerp(P[o + 1], Q[o + 1], w);
      let z = lerp(P[o + 2], Q[o + 2], w);
      const l = 1 / Math.hypot(x, y, z);
      x *= l;
      y *= l;
      z *= l;
      // Where it faced (spun, then tilted), and the way the spin was carrying it.
      const x1 = x * ca + z * sa;
      const z1 = -x * sa + z * ca;
      let vx = x1 + swirl * z1;
      let vy = y * ct - z1 * st + swirl * x1 * st;
      const vz = y * st + z1 * ct - swirl * x1 * ct;
      const len = Math.hypot(vx, vy, vz) || 1;
      vx /= len;
      vy /= -len; // screen y runs down
      const cb = Math.cos(this.BB[i]);
      const sb = Math.sin(this.BB[i]);
      const scale = this.BS[i];
      this.BX[i] = (vx * cb - vy * sb) * scale;
      this.BY[i] = (vx * sb + vy * cb) * scale;
    }
  }

  /** The filaments this frame: the blast radius, their drift's turn, and their ink. */
  private filaments(tau: number) {
    const t = Math.max(0, tau);
    const r = NOVA_BLAST * Math.max(this.width, this.height) * (1 - Math.exp(-t / NOVA_BLAST_T)) ** 0.4 * (1 + NOVA_CREEP * (1 - Math.exp(-t / NOVA_CREEP_T)));
    const turn = this.nova.spin * NOVA_DRIFT_TURN * (1 - Math.exp(-t / NOVA_CREEP_T));
    const ink = lerp(0.85, NOVA_FILAMENT, smooth(clamp01(t / NOVA_SETTLE))) * lerp(1, DIM, this.dim);
    return { r, c: Math.cos(turn), s: Math.sin(turn), ink };
  }

  /** Each cover's knot at R_REF, in date order: the cover with its pieces as they hung beside it on the ball (past MANY projects, the cover alone). */
  private fieldKnots(): Knot[] {
    const beads = this.order.filter((b) => b.project && b.pieces.length);
    const onlyCovers = this.projects.length > MANY;
    return beads.map((b, i) => {
      const cover = b.pieces[0];
      const members = onlyCovers ? [cover] : b.pieces.filter((pc) => pc.onBall);
      const parts = members.map((pc) => ({ pc, x: pc.along - cover.along, y: -(pc.up - cover.up), w: pc.h * pc.aspect, h: pc.h }));
      const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
      parts.forEach((q) => {
        box[0] = Math.min(box[0], q.x - q.w / 2);
        box[1] = Math.min(box[1], q.y - q.h / 2);
        box[2] = Math.max(box[2], q.x + q.w / 2);
        box[3] = Math.max(box[3], q.y + q.h / 2);
      });
      return { b, parts, box, coverH: cover.h, year: i === 0 || beads[i - 1].year !== b.year };
    });
  }

  /**
   * What the sheet depends on: the screen, the work's count, the layout they
   * give it, and each cover's knot (see fieldChoices). A picture that failed
   * to load in one scene and not the next makes another knot, or none.
   */
  private get fieldKey() {
    const knots = this.fieldKnots().map((k) => `${k.box.map((v) => v.toFixed(1)).join(",")},${k.coverH.toFixed(1)}${k.year ? "y" : ""}`);
    return [this.width, this.height, this.projects.length, this.headY, this.headingHalf, this.R, this.cy, this.fieldCapH, ...knots].join(" ");
  }

  /**
   * Where the covers settle: a loose contact sheet in reading order by date,
   * oldest at the top left. Up to FIELD_ROWS_FROM projects, a grid whose
   * columns are as wide as their widest knot; past it, year rows (see
   * FIELD_ROWS_FROM). As many to a row as best give the room's shape, a
   * little wider, inside the bounds and the area budget; rows keep room for
   * a year numeral where a year starts. What does not fit closes its gaps,
   * then shrinks. A phone keeps room under the sheet for the hover caption,
   * and so does a screen too full to leave it anywhere else. It tries every
   * sheet, pausing after each, so it can be worked out a slice at a time
   * (see planAhead); layoutField deals the covers into what it chooses.
   */
  private *searchField(): Generator<void, FieldChoice> {
    const knots = this.fieldKnots();
    const W = this.width;
    const H = this.height;
    const v = this.vertical;
    const rows = this.projects.length > FIELD_ROWS_FROM;
    const edge = v ? FIELD_PHONE_EDGE : FIELD_EDGE;
    const top = this.headY + this.headingHalf + FIELD_TOP;
    const capH = this.fieldCapH;
    const cy = this.cy;
    const bw = W - 2 * edge;
    const budget = FIELD_AREA * W * H;
    const numH = YEAR_SIZE + YEAR_GAP + 3;
    const coverMax = Math.max(...knots.map((k) => k.coverH));
    // The knots of each year, in order.
    const years: number[][] = [];
    knots.forEach((k, i) => {
      if (k.year || !years.length) years.push([i]);
      else years[years.length - 1].push(i);
    });
    const widthOf = (i: number, scale: number) => (knots[i].box[2] - knots[i].box[0]) * scale;
    // Rows in reading order, each knot at its x along its row (to its left edge), and each row's reach
    // over and under its covers' centres.
    const sheet = (lines: { i: number; x: number }[][], scale: number, gap: number): Sheet => {
      const up: number[] = [];
      const down: number[] = [];
      let w = 0;
      lines.forEach((line, r) => {
        up[r] = 0;
        down[r] = 0;
        line.forEach(({ i, x }) => {
          const k = knots[i];
          up[r] = Math.max(up[r], -k.box[1] * scale, k.year ? (k.coverH * scale) / 2 + numH : 0);
          down[r] = Math.max(down[r], k.box[3] * scale);
          w = Math.max(w, x + widthOf(i, scale));
        });
      });
      const h = up.reduce((s, u, r) => s + u + down[r], 0) + (lines.length - 1) * gap;
      return { lines, up, down, w, h, gap, scale };
    };
    // A grid, `n` to a row, each column as wide as its widest knot, so the covers line up down it.
    const grid = (scale: number, n: number, gap: number) => {
      const list: number[][] = [];
      for (let i = 0; i < knots.length; i += n) list.push(knots.slice(i, i + n).map((_, j) => i + j));
      const colW: number[] = [];
      list.forEach((r) => r.forEach((i, c) => (colW[c] = Math.max(colW[c] ?? 0, widthOf(i, scale)))));
      const lines = list.map((r) => {
        let x = 0;
        return r.map((i, c) => {
          const at = x;
          x += colW[c] + gap;
          return { i, x: at };
        });
      });
      return sheet(lines, scale, gap);
    };
    // Year rows about `n` knots long (see FIELD_ROWS_FROM). `share`: a year may start on the row the
    // last one ended in, if all of it fits there.
    const unit = knots.reduce((s, _, i) => s + widthOf(i, 1), 0) / knots.length;
    const yearRows = (share: boolean) => (scale: number, n: number, gap: number) => {
      const most = Math.min(bw, n * (unit * scale + gap) - gap);
      const apart = gap * FIELD_YEAR_GAP;
      const lines: { i: number; x: number }[][] = [];
      let line: { i: number; x: number }[] = [];
      let x = 0;
      const next = () => {
        if (line.length) lines.push(line);
        line = [];
        x = 0;
      };
      years.forEach((g) => {
        const run = g.reduce((s, i) => s + widthOf(i, scale), 0) + (g.length - 1) * gap;
        if (line.length && (!share || x + apart + run > most)) next();
        g.forEach((i, j) => {
          const w = widthOf(i, scale);
          let lead = line.length ? (j ? gap : apart) : 0;
          // A year longer than a row runs on to the next.
          if (line.length && x + lead + w > most) {
            next();
            lead = 0;
          }
          line.push({ i, x: x + lead });
          x += lead + w;
        });
      });
      next();
      return sheet(lines, scale, gap);
    };
    // Year rows of their own first, while the room holds that many; then years sharing rows.
    const modes = rows ? [yearRows(false), yearRows(true)] : [grid];
    const base = (v || rows ? 1 : FIELD_SCALE) * Math.min(this.R / R_REF, PIECE_MAX);
    // Where the knots round a cover leave its caption nowhere, it goes past them (see fieldCaptions):
    // so a sheet that leaves a margin at its sides, or room over or under it, is chosen over one
    // that fills the room. With the caption's room kept under the sheet (`foot`), any will do.
    const loose = CAP_BESIDE + CAP_CLEAR + FIELD_DRIFT + FIELD_JITTER;
    type Got = FieldChoice & { pass: number; clear: boolean };
    const pick = function* (bh: number, foot: boolean, passes = 12): Generator<void, Got | null> {
      const fits = (f: Sheet) => f.w <= bw && f.h <= bh && f.w * f.h <= budget;
      // The sheet takes the room's shape, a little wider: it is read across, in rows.
      const shape = (FIELD_WIDE * bw) / Math.max(1, bh);
      const score = (f: Sheet) => Math.abs(Math.log(f.w / f.h / shape));
      const legible = (f: Sheet) => {
        if (foot) return true;
        const y0 = THREE.MathUtils.clamp(cy - f.h / 2, top, Math.max(top, top + bh - f.h));
        return (bw - f.w) / 2 >= CAP_BESIDE_MIN + loose || Math.max(y0 - top, H - FIELD_PHONE_EDGE - (y0 + f.h)) >= capH + loose;
      };
      let scale = base;
      for (let pass = 0; pass < passes; pass++, scale *= 0.9) {
        const gap0 = Math.max(FIELD_GAP_MIN, FIELD_GAP * coverMax * scale + FIELD_GAP_PX);
        // Each layout at each gap, the widest first, and the sheets it makes that fit.
        const tries: Sheet[][] = [];
        for (const mode of modes) {
          for (const share of [1, 0.75, 0.5, 0.25]) {
            const out: Sheet[] = [];
            for (let n = 1; n <= knots.length; n++) {
              const f = mode(scale, n, Math.max(FIELD_GAP_MIN, gap0 * share));
              if (fits(f)) out.push(f);
              yield;
            }
            tries.push(out);
          }
        }
        // The first that makes a sheet leaving its captions somewhere to go, else the first that
        // fits at all; of its sheets, the one nearest the room's shape.
        for (const strict of [true, false]) {
          for (const list of tries) {
            const ok = strict ? list.filter(legible) : list;
            if (ok.length) {
              const sheet = ok.reduce((a, c) => (score(c) < score(a) ? c : a));
              return { sheet, bh, foot, pass, clear: legible(sheet) };
            }
          }
        }
      }
      return null;
    };
    // A phone's caption stands under the sheet, as it stands under the ball, and the room for it is
    // kept; so is it on a screen where no sheet leaves its captions anywhere else, if the sheet
    // still fits as large.
    const kept = H - FIELD_PHONE_EDGE - top - CAP_BESIDE - capH;
    let got: Got | null;
    if (v) got = yield* pick(kept, true);
    else got = yield* pick(H - edge - top, false);
    if (got && !got.clear) got = (yield* pick(kept, true, got.pass + 1)) ?? got;
    // Nothing fits (a screen too small for anything): a sheet as small as it gets, as wide as the room.
    if (!got) {
      const scale = base * 0.9 ** 12;
      const cellW = Math.max(...knots.map((kn) => kn.box[2] - kn.box[0])) * scale;
      const n = Math.max(1, Math.floor((bw + FIELD_GAP_MIN) / (cellW + FIELD_GAP_MIN)));
      const sheet = rows ? yearRows(true)(scale, n, FIELD_GAP_MIN) : grid(scale, n, FIELD_GAP_MIN);
      got = { sheet, bh: v ? kept : H - edge - top, foot: v, pass: 12, clear: false };
    }
    return { sheet: got.sheet, bh: got.bh, foot: got.foot };
  }

  /** The sheet for the screen as it is: kept from before, or the search worked out ahead finished now (see planAhead). */
  private fieldChoice(): FieldChoice {
    const key = this.fieldKey;
    const kept = fieldChoices.get(key);
    if (kept) return kept;
    const run = this.fieldSearch?.key === key ? this.fieldSearch.run : this.searchField();
    this.fieldSearch = null;
    let r = run.next();
    while (!r.done) r = run.next();
    return this.keepChoice(key, r.value);
  }

  private keepChoice(key: string, choice: FieldChoice) {
    fieldChoices.set(key, choice);
    const oldest = fieldChoices.keys().next();
    if (fieldChoices.size > FIELD_KEEP && !oldest.done) fieldChoices.delete(oldest.value);
    return choice;
  }

  /**
   * The sheet worked out ahead of the collapse, FIELD_SLICE ms a frame at
   * most, once each layout has placed everything: at the collapse there is
   * then only the dealing to do (see layoutField). Not with reduced motion,
   * where the ball never charges, nor while the covers are out.
   */
  private planAhead() {
    if (this.planned === this.laidOut || this.opts.reducedMotion || this.novaActive) return;
    const key = this.fieldKey;
    if (!fieldChoices.has(key)) {
      if (this.fieldSearch?.key !== key) this.fieldSearch = { key, run: this.searchField() };
      const run = this.fieldSearch.run;
      const until = performance.now() + FIELD_SLICE;
      let r = run.next();
      while (!r.done && performance.now() < until) r = run.next();
      if (!r.done) return;
      this.keepChoice(key, r.value);
    }
    this.fieldSearch = null;
    this.planned = this.laidOut;
  }

  /**
   * Deals the covers into their sheet (see searchField), each with its
   * pieces as they hung beside it, lying a little off its slot: at the
   * collapse, and again on a resize while the covers are out. The sheet was
   * worked out ahead for the screen; where each hover caption stands follows
   * once its words are measured (see fieldCaptions).
   */
  private async layoutField() {
    const gen = ++this.fieldGen;
    const beads = this.order.filter((b) => b.project && b.pieces.length);
    if (!beads.length) return;
    const laying = () => !this.disposed && gen === this.fieldGen && (this.fieldOn || this.nova.phase === "collapse");
    // The captions are measured at the width they are set from: as the layout left them, unless a
    // field before this one, on another screen, narrowed some.
    const natW = this.vertical ? Math.min(WHY_MAX, this.width - 48) : WHY_MAX;
    const stale = beads.filter((b) => b.cap.why.t.maxWidth !== natW);
    if (stale.length) {
      stale.forEach((b) => (b.cap.why.t.maxWidth = natW));
      await Promise.all(stale.map((b) => syncText(b.cap.why.t)));
      if (!laying()) return;
    }
    // Each sample's way out, worked out for the thread as it is wound now (see fitStep).
    if (this.BX.length !== this.M) return;
    const W = this.width;
    const H = this.height;
    const edge = this.vertical ? FIELD_PHONE_EDGE : FIELD_EDGE;
    const top = this.headY + this.headingHalf + FIELD_TOP;
    const knots = this.fieldKnots();
    const { sheet: chosen, bh, foot } = this.fieldChoice();
    this.fieldBox = { x0: edge, y0: top, x1: W - edge, y1: Math.max(top, top + bh) };
    const { lines, up, down, w, h, gap } = chosen;
    const k = chosen.scale;
    const x0 = (W - w) / 2;
    let y = THREE.MathUtils.clamp(this.cy - h / 2, top, Math.max(top, top + bh - h));
    // A tight sheet lies straighter and drifts less: its covers would only cover each other.
    const room = Math.min(1, gap / 48);
    const jitter = Math.min(FIELD_JITTER, gap * 0.25);
    const amp = Math.min(FIELD_DRIFT, Math.max(2, gap * 0.12));
    this.field.clear();
    this.pieces.forEach((pc) => (pc.field = null));
    lines.forEach((line, r) => {
      const cy = y + up[r];
      line.forEach(({ i, x: along }) => {
        const kn = knots[i];
        const b = kn.b;
        const rnd = seeded(b.project!.slug);
        const x = x0 + along - kn.box[0] * k;
        // Its way out: its mark's sample's, so its pieces leave with their stretch of thread.
        const m = Math.max(0, Math.min(this.M - 1, Math.round(b.i)));
        const dl = Math.hypot(this.BX[m], this.BY[m]) || 1;
        // A drift of so many px/s: a Lissajous figure's mean speed is about 0.9·amp·ω.
        const speed = lerp(FIELD_DRIFT_SPEED[0], FIELD_DRIFT_SPEED[1], rnd()) * (amp / FIELD_DRIFT);
        const om = speed / (0.9 * amp);
        const box: [number, number, number, number] = [kn.box[0] * k, kn.box[1] * k, kn.box[2] * k, kn.box[3] * k];
        const slot: Slot = {
          x,
          y: cy,
          jx: (rnd() * 2 - 1) * jitter,
          jy: (rnd() * 2 - 1) * jitter,
          rot: (rnd() * 2 - 1) * FIELD_TURN * room,
          amp,
          w1: om * lerp(0.85, 1.15, rnd()),
          w2: om * lerp(0.85, 1.15, rnd()),
          p1: rnd() * Math.PI * 2,
          p2: rnd() * Math.PI * 2,
          dirX: this.BX[m] / dl,
          dirY: this.BY[m] / dl,
          reach: 0.5 * Math.hypot(x - this.cx, cy - this.cy) + 0.2 * Math.min(W, H),
          tumble: this.nova.spin * FIELD_TUMBLE * lerp(0.7, 1.3, rnd()),
          box,
          // Where its caption stands is fieldCaptions' to say, once every knot has its place.
          cap: "under",
          capX: (box[0] + box[2]) / 2,
          capY: box[3] + CAP_BESIDE,
          fixed: false,
          capW: natW,
          year: kn.year ? (this.years.find((yr) => yr.year === b.year)?.m ?? null) : null,
          rank: i,
        };
        this.field.set(b, slot);
        kn.parts.forEach((q) => (q.pc.field = { x: q.x * k, y: q.y * k, w: q.w * k, h: q.h * k }));
      });
      y += up[r] + down[r] + gap;
    });
    // The numerals start out of sight, to rise as the covers settle.
    this.field.forEach((slot) => {
      if (!slot.year || slot.year.t.visible) return;
      slot.year.t.visible = true;
      slot.year.offset = this.nova.yearsUp ? 0 : 1e3;
    });
    // The caption in its kept room stands under the sheet's last row (y has gone a gap past it).
    this.captionsRun = this.fieldCaptions(natW, foot ? y - gap + amp + CAP_BESIDE : null);
    // At the collapse nothing can be chosen until the deaf moment has passed: the captions find
    // their places over the frames of the drop, a slice at a time (see frame). On a resize, at once.
    if (this.nova.phase !== "collapse") this.placeCaptions();
  }

  /**
   * Works on where the captions stand (see fieldCaptions), for `budget` ms
   * at most, or to the end; once they all have their places, their words are
   * set again and the chosen one's follows its cover.
   */
  private placeCaptions(budget = Infinity) {
    const run = this.captionsRun;
    if (!run) return;
    const until = performance.now() + budget;
    let r = run.next();
    while (!r.done && performance.now() < until) r = run.next();
    if (!r.done) return;
    this.captionsRun = null;
    const gen = this.fieldGen;
    const texts = [...this.field.keys()].flatMap((b) => [b.cap.name.t, b.cap.status.t, b.cap.why.t]);
    void Promise.all(texts.map((t) => syncText(t))).then(() => {
      if (this.disposed || gen !== this.fieldGen || !this.fieldOn) return;
      if (this.hovered) this.placeFieldCaption(this.hovered);
    });
  }

  /** A knot as it lies in the field at rest, turned and jittered, padded by `pad` px: x0, y0, x1, y1 on the screen. */
  private knotRect(f: Slot, pad: number): [number, number, number, number] {
    const c = Math.cos(f.rot);
    const s = Math.sin(f.rot);
    const [a, b, d, e] = f.box;
    const xs = [a * c - b * s, d * c - b * s, a * c - e * s, d * c - e * s];
    const ys = [a * s + b * c, d * s + b * c, a * s + e * c, d * s + e * c];
    const x = f.x + f.jx;
    const y = f.y + f.jy;
    return [x + Math.min(...xs) - pad, y + Math.min(...ys) - pad, x + Math.max(...xs) + pad, y + Math.max(...ys) + pad];
  }

  /**
   * Where each cover's hover caption stands, from its words as measured at
   * `natW` and the knots as they lie (turned, jittered, with room for their
   * drift): beside its knot, after it or else before it, where it has
   * CAP_BESIDE_MIN px clear of every other knot and numeral, its line
   * wrapping to fit; else under or over it; else past the other knots on its
   * row, or under or over the whole sheet, whichever is nearest; and where
   * nothing is clear (a crowded sheet on a small screen), under or over it
   * where it covers least, which the veil then thins. Where room was kept for
   * it under the sheet (see layoutField), it stands there, at `foot`. It
   * pauses after each, so it can be worked out a slice at a time (see
   * placeCaptions).
   */
  private *fieldCaptions(natW: number, foot: number | null): Generator<void, void> {
    type Rect = [number, number, number, number];
    type Try = { cap: Slot["cap"]; r: Rect; w: number; ok: boolean };
    const W = this.width;
    const edge = this.vertical ? FIELD_PHONE_EDGE : FIELD_EDGE;
    const top = this.fieldBox.y0;
    const bottom = this.height - FIELD_PHONE_EDGE;
    const widthOf = (m: Masked) => blockBounds(m.t)[2] - blockBounds(m.t)[0];
    // Every knot, with room for its drift and a little air, and every year's numeral over its first cover.
    const blocks: { b: Bead; knot: boolean; r: Rect }[] = [];
    this.field.forEach((f, b) => {
      blocks.push({ b, knot: true, r: this.knotRect(f, f.amp + CAP_CLEAR) });
      const cover = b.pieces[0]?.field;
      if (!f.year || !cover) return;
      const x = f.x + f.jx - cover.w / 2;
      const y = f.y + f.jy - cover.h / 2 - YEAR_GAP;
      const pad = f.amp + CAP_CLEAR / 2;
      blocks.push({ b, knot: false, r: [x - pad, y - this.textHeight(f.year) - pad, x + widthOf(f.year) + pad, y + pad] });
    });
    const overlap = (r: Rect, o: Rect) => Math.max(0, Math.min(r[2], o[2]) - Math.max(r[0], o[0])) * Math.max(0, Math.min(r[3], o[3]) - Math.max(r[1], o[1]));
    for (const [b, f] of this.field) {
      const { name, status, why } = b.cap;
      const anchor = (to: "left" | "right" | "center") => {
        [name, status, why].forEach((m) => (m.t.anchorX = to));
        why.t.textAlign = to;
      };
      if (foot !== null) {
        // In its room, centred under the sheet.
        Object.assign(f, { cap: "under", capX: W / 2, capY: foot, fixed: true, capW: natW });
        anchor("center");
        why.t.maxWidth = natW;
        continue;
      }
      const whyW = widthOf(why);
      const whyH = this.textHeight(why);
      const lineH = WHY_SIZE * 1.3;
      const lines = Math.max(1, Math.round(whyH / lineH));
      const heads = Math.max(widthOf(name), widthOf(status));
      const natural = Math.max(heads, whyW);
      // Its size set `w` wide: narrower than it was measured, its line wraps into about as many more.
      const size = (w: number) => {
        const n = whyW <= w + 0.5 ? lines : Math.max(lines + 1, Math.ceil((whyW * lines) / (0.9 * w)));
        return { w: Math.max(heads, Math.min(w, whyW)), h: 50 + (n === lines ? whyH : n * lineH) };
      };
      const K = this.knotRect(f, f.amp);
      const cx = f.x + f.jx;
      const cy = f.y + f.jy;
      const others = blocks.filter((o) => !(o.b === b && o.knot));
      const covers = (r: Rect, all = false) => (all ? blocks : others).reduce((s, o) => s + overlap(r, o.r), 0);
      const inside = (r: Rect) => r[1] >= top && r[3] <= bottom;
      // Beside it, after (1) or before (-1): up to whatever is in the way, or past all of it on its row (`far`).
      const beside = (dir: 1 | -1, far: boolean): Try => {
        let w = natural;
        let r: Rect = [0, 0, 0, 0];
        for (let pass = 0; pass < 3; pass++) {
          const s = size(w);
          const y0 = Math.max(top, Math.min(K[1], bottom - s.h));
          const row = others.filter((o) => o.r[3] > y0 && o.r[1] < y0 + s.h);
          let from = dir > 0 ? K[2] + CAP_BESIDE : K[0] - CAP_BESIDE;
          if (far) row.forEach((o) => (from = dir > 0 ? Math.max(from, o.r[2] + CAP_BESIDE) : Math.min(from, o.r[0] - CAP_BESIDE)));
          let to = dir > 0 ? W - edge : edge;
          row.forEach((o) => {
            if (dir > 0 && o.r[2] > from) to = Math.min(to, o.r[0]);
            if (dir < 0 && o.r[0] < from) to = Math.max(to, o.r[2]);
          });
          const fit = Math.min(w, (to - from) * dir);
          const t = size(Math.max(1, fit));
          r = dir > 0 ? [from, y0, from + t.w, y0 + t.h] : [from - t.w, y0, from, y0 + t.h];
          const done = fit >= w - 0.5;
          w = fit;
          if (done) break;
        }
        return { cap: dir > 0 ? "after" : "before", r, w, ok: w >= Math.min(CAP_BESIDE_MIN, natural) && inside(r) && covers(r) === 0 };
      };
      // Under (1) or over (-1) it, centred on it and kept inside the edges: right by it, or past all of it (`far`).
      const stack = (dir: 1 | -1, far: boolean): Try => {
        const s = size(natural);
        const mid = THREE.MathUtils.clamp((K[0] + K[2]) / 2, edge + s.w / 2, Math.max(edge + s.w / 2, W - edge - s.w / 2));
        const x0 = mid - s.w / 2;
        const x1 = mid + s.w / 2;
        let from = dir > 0 ? K[3] + CAP_BESIDE : K[1] - CAP_BESIDE;
        if (far) {
          others.forEach((o) => {
            if (o.r[2] > x0 && o.r[0] < x1) from = dir > 0 ? Math.max(from, o.r[3] + CAP_BESIDE) : Math.min(from, o.r[1] - CAP_BESIDE);
          });
        }
        const r: Rect = dir > 0 ? [x0, from, x1, from + s.h] : [x0, from - s.h, x1, from];
        return { cap: dir > 0 ? "under" : "over", r, w: natW, ok: inside(r) && covers(r) === 0 };
      };
      const away = (r: Rect) => Math.hypot(Math.max(r[0] - cx, 0, cx - r[2]), Math.max(r[1] - cy, 0, cy - r[3]));
      let pick = [beside(1, false), beside(-1, false), stack(1, false), stack(-1, false)].find((t) => t.ok);
      pick ??= [beside(1, true), beside(-1, true), stack(1, true), stack(-1, true)].filter((t) => t.ok).sort((p, q) => away(p.r) - away(q.r))[0];
      if (!pick) {
        // Nowhere clear: under or over it, kept on the screen, wherever it covers least.
        const kept = [stack(1, false), stack(-1, false)].map((t) => {
          const dy = t.r[3] > bottom ? bottom - t.r[3] : t.r[1] < top ? top - t.r[1] : 0;
          return { ...t, r: [t.r[0], t.r[1] + dy, t.r[2], t.r[3] + dy] as Rect };
        });
        pick = kept.sort((p, q) => covers(p.r, true) - covers(q.r, true))[0];
      }
      const beside1 = pick.cap === "after" || pick.cap === "before";
      const at = pick.cap === "after" ? pick.r[0] : pick.cap === "before" ? pick.r[2] : (pick.r[0] + pick.r[2]) / 2;
      Object.assign(f, { cap: pick.cap, capX: at - cx, capY: pick.r[1] - cy, fixed: false, capW: beside1 && pick.w < whyW - 0.5 ? Math.max(1, pick.w) : natW });
      anchor(pick.cap === "after" ? "left" : pick.cap === "before" ? "right" : "center");
      why.t.maxWidth = f.capW;
      yield;
    }
  }

  /**
   * A piece in the field this frame, into `out`: out of the knot along its
   * bead's way, curving round into its cover's slot as it settles
   * (NOVA_SETTLE), then drifting there; grown to size by NOVA_GROW, and
   * turned with its cover. False if it does not come out of the knot.
   */
  private fieldPose(pc: Piece, tau: number, out: Pose) {
    const b = pc.bead;
    const f = this.field.get(b);
    const pf = pc.field;
    if (!f || !pf) return false;
    const t = Math.max(0, tau);
    // Where its cover lies now: its slot, as it fell there, drifting; never past the field's bounds.
    const fb = this.fieldBox;
    const [bx0, by0, bx1, by1] = f.box;
    const sx = THREE.MathUtils.clamp(f.x + f.jx + f.amp * Math.sin(f.w1 * t + f.p1), fb.x0 - bx0, Math.max(fb.x0 - bx0, fb.x1 - bx1));
    const sy = THREE.MathUtils.clamp(f.y + f.jy + f.amp * Math.sin(f.w2 * t + f.p2), fb.y0 - by0, Math.max(fb.y0 - by0, fb.y1 - by1));
    // Out along its way, then round into its slot: a curve whose first leg is its way out.
    const u = outCubic(clamp01(t / NOVA_SETTLE));
    const a = (1 - u) * (1 - u);
    const m = 2 * u * (1 - u);
    const c = u * u;
    const x = a * this.cx + m * (this.cx + f.dirX * f.reach) + c * sx;
    const y = a * this.cy + m * (this.cy + f.dirY * f.reach) + c * sy;
    const grow = outCubic(clamp01(t / NOVA_GROW));
    const rot = f.rot + f.tumble * (1 - u) * (1 - u);
    const cs = Math.cos(rot);
    const sn = Math.sin(rot);
    const ox = pf.x * grow;
    const oy = pf.y * grow;
    out.x = x + ox * cs - oy * sn;
    out.y = y + ox * sn + oy * cs;
    out.w = pf.w * grow;
    out.h = pf.h * grow;
    out.rot = rot;
    // The ball's grammar: the chosen at full ink, the rest at 35%. Dead work a little under.
    out.ink = (b.side < 0 ? DEAD_INK : 1) * lerp(lerp(1, DIM, this.dim), 1, b.hl) * clamp01(t / 0.12);
    out.rank = f.rank;
    return true;
  }

  /** The chosen project's caption where fieldCaptions set it, following its cover as it drifts; in its kept room it stays put. */
  private placeFieldCaption(b: Bead) {
    // Chosen before every caption had its place (only a slow frame lets that happen): the rest now.
    this.placeCaptions();
    const f = this.field.get(b);
    const cover = b.pieces[0];
    if (!f || !cover || !this.fieldPose(cover, this.burstT, this.pose)) return;
    const { name, status, why } = b.cap;
    const h = 50 + this.textHeight(why);
    const top = this.fieldBox.y0;
    const x = f.fixed ? f.capX : this.pose.x + f.capX;
    const y = THREE.MathUtils.clamp(f.fixed ? f.capY : this.pose.y + f.capY, top, Math.max(top, this.height - FIELD_PHONE_EDGE - h));
    this.setBase(name, x, y);
    this.setBase(status, x, y + 30);
    this.setBase(why, x, y + 50);
  }

  /** Each year's numeral over its first project's cover, drifting with it. */
  private placeYears() {
    const tau = this.burstT;
    const ink = YEAR_INK * lerp(1, DIM, this.dim);
    this.field.forEach((f, b) => {
      const m = f.year;
      const cover = b.pieces[0];
      if (!m || !cover?.field || !this.fieldPose(cover, tau, this.pose)) return;
      const { x, y, w, h } = this.pose;
      // Placed for the first time: out of sight under its mask, until it rises.
      const fresh = m.offset >= 1e3;
      this.setBase(m, x - w / 2, y - h / 2 - YEAR_GAP - this.textHeight(m));
      if (fresh) {
        m.offset = m.span;
        this.applyMask(m);
      }
      // Under a caption it thins as the covers do.
      const bb = blockBounds(m.t);
      m.t.material.opacity = ink * this.veilOf(this.capVeil, CAP_VEIL_PAD, CAP_VEIL_FEATHER, m.base.x + (bb[0] + bb[2]) / 2, -m.base.y - (bb[1] + bb[3]) / 2);
    });
  }

  // ---------------------------------------------------------------- frame

  private frame(dt: number) {
    if (this.disposed) return;
    const rm = !!this.opts.reducedMotion;
    this.clock += rm ? 0 : dt;
    // Nothing is drawn until the layout has placed it: the texts wait at the origin until their fonts are in.
    if (!this.ready) return;

    // The charge first: it can hold the spin up, and a held arrow spins the ball freely. Past full
    // charge, the supernova.
    this.novaStep(dt);
    const active = this.novaActive;

    // Spin: slow on its own, slower still while something is held, still while a project is open.
    // Gone into the knot, the ball holds the angle and lean it had, to come back to them.
    const idleTarget = rm || this.opened || active ? 0 : this.hovered ? 0.1 : 1;
    this.idleK += (idleTarget - this.idleK) * (1 - Math.pow(0.02, dt));
    if (active && this.nova.phase !== "collapse") {
      this.angle = this.nova.a0;
      this.yaw = this.nova.y0;
      this.vel = 0;
    } else {
      // A ball past the point of no return spins on under a hand held still on it.
      if ((!this.drag?.moved || this.novaBound) && !this.turning) this.angle += (IDLE * this.idleK + this.vel) * dt * this.spinK;
      this.vel *= Math.pow(0.15, dt);
      if (Math.abs(this.vel) < 1e-4) this.vel = 0;
      if (!active) this.yaw += (this.targetYaw - this.yaw) * (1 - Math.pow(0.03, dt));
    }

    this.scroll.cur += (this.scroll.target - this.scroll.cur) * (1 - Math.pow(0.9, dt * 60));
    this.openGroup.position.set(this.layoutO ? (this.layoutO.vertical ? 0 : -this.scroll.cur) : 0, this.layoutO?.vertical ? this.scroll.cur : 0, 0);

    // Hover: the chosen stretch to full ink, everything else down to 35%.
    const k = rm ? 1 : 1 - Math.pow(0.0005, dt);
    this.beads.forEach((b) => {
      b.hl += ((b === this.hovered || b === this.opened ? 1 : 0) - b.hl) * k;
    });
    this.dim += ((this.hovered || this.opened ? 1 : 0) - this.dim) * k;

    const a = this.angle + this.yaw;
    this.rot.ca = Math.cos(a);
    this.rot.sa = Math.sin(a);

    // The reveal: each mark and its pieces arrive as the winding thread reaches them.
    const reached = this.draw.value * (this.M - 1);
    this.beads.forEach((b) => {
      if (b.popped || reached < b.i) return;
      b.popped = true;
      this.ctx.add(() => gsap.to(b, { pop: 1, duration: 0.7, ease: "power3.out" }));
    });

    if (this.pointerAt && !this.keyHold && !this.drag?.moved && !this.opened) this.hoverAtPointer();
    this.placeVeil(dt);
    this.project();
    this.drawThread();
    this.hang();
    if (this.field.size) {
      if (this.fieldOn && this.hovered) this.placeFieldCaption(this.hovered);
      this.placeYears();
    }
    this.clearCaption(dt);
    this.crossings();
    this.whirr(dt);
    this.dimHeading();
    this.tellHeading(dt);
    this.glass.setVelocity(Math.abs(this.scroll.cur - this.lastScroll) / Math.max(dt, 1e-3) / 1500);
    this.lastScroll = this.scroll.cur;
    this.glass.enabled = this.glassOn;
    this.glass.render(this.scene, this.camera);
    // What is left of the frame goes on working out the supernova's field, ahead of any collapse,
    // and where its captions stand, from the frame after one.
    this.planAhead();
    if (this.captionsRun && (this.fieldOn || (this.nova.phase === "collapse" && this.nova.t > 0))) this.placeCaptions(FIELD_SLICE);
  }

  /** How far the ball has gone back behind an opened line. */
  private get recede() {
    if (!this.opened) return 0;
    return this.opts.reducedMotion ? this.fadeIn.value : inOut(clamp01(this.unspool.p * 1.5));
  }

  /**
   * The ball's radius this frame: smaller as it recedes, to 86%, and never
   * larger than it always receded to; pulled in by a charge (R_eff), and a
   * little over at the end of a sigh; down to a knot at the collapse, and a
   * little over again at the end of the supernova's return.
   */
  private radiusAt(recede: number) {
    return this.R * lerp(1, Math.min(RECEDE_SCALE, RECEDE_D / (2 * this.R)), recede) * this.novaScale * this.nova.shape;
  }

  /** The chosen caption steps down, if it must, to clear its own pieces; within one hover it only ever steps further. */
  private clearCaption(dt: number) {
    const b = this.hovered;
    if (!b || this.opened || this.capSide || this.novaActive) return;
    const want = this.captionClear(b);
    if (want <= b.capDy + 0.25) return;
    const k = this.opts.reducedMotion ? 1 : 1 - Math.pow(0.001, dt);
    b.capDy = want - b.capDy < 0.5 ? want : b.capDy + (want - b.capDy) * k;
    this.placeCaption(b);
  }

  /**
   * Where the words the ball thins under rest this frame: the chosen
   * project's caption, where the ball reaches under it, and an opened
   * project's words (they scroll with the line).
   */
  private placeVeil(dt: number) {
    const cv = this.capVeil;
    const b = this.hovered;
    const on = !!b && !this.opened;
    const k = this.opts.reducedMotion ? 1 : 1 - Math.pow(0.0005, dt);
    if (b && on) {
      const [x0, y0, x1, y1] = this.captionBox(b);
      // A caption arriving on bare rings takes its place at once; one giving way to another moves over.
      const f = cv.k < 0.01 ? 1 : k;
      cv.x0 += (x0 - cv.x0) * f;
      cv.y0 += (y0 - cv.y0) * f;
      cv.x1 += (x1 - cv.x1) * f;
      cv.y1 += (y1 - cv.y1) * f;
      const u = this.pieceVeil;
      u.uVeil.value.set(cv.x0, cv.y0, cv.x1, cv.y1);
      const lines: [THREE.Vector4, Masked][] = [
        [u.uLineName.value, b.cap.name],
        [u.uLineStatus.value, b.cap.status],
        [u.uLineWhy.value, b.cap.why],
      ];
      lines.forEach(([r, m]) => {
        const [a, c, d, e] = this.lineBox(m);
        r.set(r.x + (a - r.x) * f, r.y + (c - r.y) * f, r.z + (d - r.z) * f, r.w + (e - r.w) * f);
      });
    }
    cv.k += ((on ? 1 : 0) - cv.k) * k;
    if (cv.k < 0.001) cv.k = 0;

    // The supernova's filaments reach across the heading: they thin under its words.
    const hv = this.headVeil;
    const h = this.heading;
    const out = !!h && (this.fieldOn || this.nova.phase === "return");
    if (out && h) {
      const words = [h.lead, this.waitShown ? h.wait : h.tail];
      hv.x0 = Math.min(...words.map((m) => m.base.x + blockBounds(m.t)[0]));
      hv.x1 = Math.max(...words.map((m) => m.base.x + blockBounds(m.t)[2]));
      hv.y0 = this.headY - this.headingHalf;
      hv.y1 = this.headY + this.headingHalf;
    }
    hv.k += ((out ? 1 : 0) - hv.k) * k;
    if (hv.k < 0.001) hv.k = 0;
    // And they keep out from under the tab bar, which stays as it is.
    const nv = this.navVeil;
    nv.k += ((this.fieldOn || this.nova.phase === "return" ? 1 : 0) - nv.k) * k;
    if (nv.k < 0.001) nv.k = 0;

    const v = this.veil;
    const o = this.opened?.open;
    v.k = o && this.layoutO ? this.recede : 0;
    if (!o || v.k <= 0) return;
    const g = this.openGroup.position;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    [o.name, o.status, o.why, o.summary, o.link].forEach((m) => {
      const bb = blockBounds(m.t);
      const x = m.base.x + g.x;
      const y = -(m.base.y + g.y);
      x0 = Math.min(x0, x + bb[0]);
      x1 = Math.max(x1, x + bb[2]);
      y0 = Math.min(y0, y - bb[3]);
      y1 = Math.max(y1, y - bb[1]);
    });
    v.x0 = x0 - VEIL_PAD;
    v.y0 = y0 - VEIL_PAD;
    v.x1 = x1 + VEIL_PAD;
    v.y1 = y1 + VEIL_PAD;
  }

  /**
   * The share of its ink the ball keeps at a point: all of it, except under a
   * caption, the opened project's words, or the heading while the
   * supernova's filaments cross it; and none under the tab bar while they
   * reach up there.
   */
  private veilAt(x: number, y: number) {
    const nav = this.navVeil.k > 0 ? 1 - this.navVeil.k * (1 - navFade(y)) : 1;
    return (
      nav *
      this.veilOf(this.veil, 0, VEIL_FEATHER, x, y) *
      this.veilOf(this.capVeil, CAP_VEIL_PAD, CAP_VEIL_FEATHER, x, y) *
      this.veilOf(this.headVeil, CAP_VEIL_PAD, CAP_VEIL_FEATHER, x, y)
    );
  }

  private veilOf(v: { x0: number; y0: number; x1: number; y1: number; k: number }, pad: number, feather: number, x: number, y: number) {
    if (v.k <= 0) return 1;
    const dx = Math.max(v.x0 - pad - x, 0, x - v.x1 - pad);
    const dy = Math.max(v.y0 - pad - y, 0, y - v.y1 - pad);
    const near = 1 - smooth(clamp01(Math.hypot(dx, dy) / feather));
    return 1 - v.k * (1 - VEIL_INK) * near;
  }

  /**
   * The supernova's thread, out of the knot: one ribbon, each sample on its
   * way (see novaWays) at the blast's radius, fading to NOVA_FILAMENT. A
   * chosen cover's own stretch does not come up with it: it lies wherever
   * its samples flew, far from the cover's slot, and would only be a bright
   * line running across the others. The cover's ink and caption answer.
   */
  private projectFilaments() {
    const M = this.M;
    const f = this.filaments(this.burstT);
    const { cx, cy, BX, BY } = this;
    for (let i = 0; i < M; i++) {
      const bx = BX[i];
      const by = BY[i];
      const x = cx + (bx * f.c - by * f.s) * f.r;
      const y = cy + (bx * f.s + by * f.c) * f.r;
      this.SX[i] = x;
      this.SY[i] = y;
      this.SZ[i] = 1;
      this.SA[i] = f.ink * this.veilAt(x, y);
      this.lifted[i] = 0;
    }
    fillNormals(this.SX, this.SY, this.NX, this.NY, M);
  }

  /** Every sample to the screen: on the ball, on the line, or on its way between; out of the knot, or wound back into it. */
  private project() {
    if (this.fieldOn) {
      this.projectFilaments();
      return;
    }
    const M = this.M;
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const l = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.radiusAt(recede);
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    const drawn = this.draw.value * (M - 1);
    const open = this.opened;
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    const P = this.P;
    // The plucked horizon: how far its antinodes stand off the line this frame, and how many half
    // waves it holds. It starts from the straight line, so its first frame does not jump.
    let swing = 0;
    let halves = 1;
    const pl = this.plucked;
    if (pl && open && L && !rm) {
      const t = this.clock - pl.at;
      if (pl.dead) {
        if (t < PLUCK_TWITCH) swing = PLUCK_WAVE * Math.sin((Math.PI * t) / PLUCK_TWITCH);
      } else if (t < PLUCK_RING) {
        swing = PLUCK_WAVE * (1 - t / PLUCK_RING) ** 2 * Math.sin(2 * Math.PI * (pl.hz / PLUCK_SLOW) * t);
        halves = Math.max(1, Math.round((L.end - L.mark) / (PLUCK_HALF * (PLUCK_HZ[0] / pl.hz))));
      }
      if (t >= (pl.dead ? PLUCK_TWITCH : PLUCK_RING)) this.plucked = null;
    }
    // A charging ball: the thread leans less (toward P0) and its far side brightens.
    const bend = this.bend;
    const Q = this.P0;
    const back = this.backInk;
    // Coming back from the supernova: each sample is pulled from its filament onto the ball.
    const winding = this.nova.phase === "return";
    const fil = winding ? this.filaments(this.burstT) : null;
    for (let i = 0; i < M; i++) {
      if (bend > 0) {
        const o = i * 3;
        let x = lerp(P[o], Q[o], bend);
        let y = lerp(P[o + 1], Q[o + 1], bend);
        let z = lerp(P[o + 2], Q[o + 2], bend);
        const n = 1 / Math.hypot(x, y, z);
        x *= n;
        y *= n;
        z *= n;
        this.rotate(x, y, z, q);
      } else this.rotate(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], q);
      this.toScreen(q, radius, s);
      const d = depthInk(q.z, back);
      const o = this.owner[i];
      const hl = o >= 0 ? this.beads[o].hl : 0;
      let ink = lerp(d * base, 0.55 + 0.45 * smooth(clamp01((q.z + 0.85) / 1.7)), hl);
      ink *= this.veilAt(s.x, s.y);
      let lift = 0;
      if (open && L && i >= open.i0 && i <= open.i1) {
        lift = this.liftOf(open, i);
        const along = this.alongOf(open, L, i);
        this.lineAt(L, along, l);
        if (swing) {
          // Off the line, and for dead work toward where its frames hang: under it, or on a phone to its left.
          const off = this.pluckAt(L, along, swing, halves);
          if (L.vertical) l.x -= off;
          else l.y += off;
        }
        if (rm) {
          // Reduced motion draws the line on its own; the stretch fades out of the ball.
          ink *= 1 - this.fadeIn.value;
          lift = 0;
        } else {
          s.x = lerp(s.x, l.x, lift);
          s.y = lerp(s.y, l.y, lift);
          ink = lerp(ink, 1, lift);
        }
      }
      let z = lift > 0.3 ? 2 : q.z;
      if (fil) {
        const k = this.kAt(i);
        if (k < 1) {
          const bx = this.BX[i];
          const by = this.BY[i];
          const fx = this.cx + (bx * fil.c - by * fil.s) * fil.r;
          const fy = this.cy + (bx * fil.s + by * fil.c) * fil.r;
          s.x = lerp(fx, s.x, k);
          s.y = lerp(fy, s.y, k);
          ink = lerp(fil.ink * this.veilAt(fx, fy), ink, k);
          if (k < 0.5) z = 1;
        }
      }
      if (i > drawn) ink = 0;
      this.SX[i] = s.x;
      this.SY[i] = s.y;
      this.SZ[i] = z;
      this.SA[i] = ink;
      this.lifted[i] = lift;
    }
    fillNormals(this.SX, this.SY, this.NX, this.NY, M);
  }

  /** The thread in two layers, behind and in front of the ball's centre, so the pieces sort between them. */
  private drawThread() {
    const back = this.back!;
    const front = this.front!;
    const half = this.lineMat.uniforms.uHalf.value as number;
    back.begin(half);
    front.begin(half);
    const M = this.M;
    const drawn = Math.min(M - 1, Math.floor(this.draw.value * (M - 1)));
    const open = this.opened;
    const cut0 = open ? Math.max(0, Math.ceil(open.i0)) : -1;
    const cut1 = open ? Math.min(M - 1, Math.floor(open.i1)) : -1;
    const rm = !!this.opts.reducedMotion;
    let start = 0;
    let layer: Ribbons | null = null;
    const flush = (end: number) => {
      if (layer && end > start) layer.strip(this.SX, this.SY, this.SA, this.NX, this.NY, start, end);
    };
    for (let i = 0; i < drawn; i++) {
      // The stretch leaves the ball at its two ends: those joins are drawn apart, below.
      const cut = open && !rm && (i === cut0 - 1 || i === cut1);
      if (cut || (this.SA[i] < 0.004 && this.SA[i + 1] < 0.004)) {
        flush(i);
        layer = null;
        continue;
      }
      const seg = this.SZ[i] + this.SZ[i + 1] >= 0 ? front : back;
      if (seg !== layer) {
        flush(i);
        layer = seg;
        start = i;
      }
    }
    flush(drawn);

    const sc = this.scratch;
    // Where the stretch leaves the ball: a join that thins out as its end flies off.
    if (open && !rm) {
      [
        [cut0 - 1, cut0],
        [cut1, cut1 + 1],
      ].forEach(([i, j]) => {
        if (i < 0 || j > drawn) return;
        const lift = Math.max(this.lifted[i], this.lifted[j]);
        const fade = (1 - lift) ** 2;
        if (fade < 0.01) return;
        sc.reset();
        sc.push(this.SX[i], this.SY[i], this.SA[i] * fade);
        sc.push(this.SX[j], this.SY[j], this.SA[j] * fade);
        sc.normals();
        front.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, 1);
      });
    }
    // Reduced motion: the opened stretch, drawn straight on the line and faded in.
    if (open && rm && this.layoutO && this.fadeIn.value > 0) {
      const L = this.layoutO;
      const p = { x: 0, y: 0 };
      sc.reset();
      const n = 48;
      for (let k = 0; k <= n; k++) {
        this.lineAt(L, lerp(L.start, L.end, k / n), p);
        sc.push(p.x, p.y, this.fadeIn.value);
      }
      sc.normals();
      front.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
    }

    this.drawMarks(back, front);
    this.drawLooseEnd(back, front, drawn);
    this.drawRing(front);
    back.end();
    front.end();
  }

  /** The supernova's one ring: out of the knot, past the corners, fading as it goes. */
  private drawRing(front: Ribbons) {
    const n = this.nova;
    const rt = this.burstT;
    if (!n.burst || rt < 0 || rt >= NOVA_RING_DUR) return;
    const u = rt / NOVA_RING_DUR;
    const r0 = NOVA_KNOT / 2;
    const r = r0 + (NOVA_RING_REACH * Math.hypot(this.width, this.height) - r0) * outCubic(u);
    const ink = NOVA_RING_INK * (1 - u);
    const sc = this.ringScratch;
    sc.reset();
    for (let k = 0; k <= NOVA_RING_POINTS; k++) {
      const a = (k / NOVA_RING_POINTS) * Math.PI * 2;
      const y = this.cy + Math.sin(a) * r;
      // Past the corners, but never through the tab bar.
      sc.push(this.cx + Math.cos(a) * r, y, ink * navFade(y));
    }
    sc.normals(true);
    front.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
  }

  /** Ticks in the horizon's grammar: alive breathes, paused wears a ring, shipped a dot, dead hangs down. */
  private drawMarks(back: Ribbons, front: Ribbons) {
    const q = new THREE.Vector3();
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const bn = new THREE.Vector3();
    const s0 = { x: 0, y: 0 };
    const s1 = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.radiusAt(recede);
    // A tick grows with the ball to TICK_MAX, then only the ball grows.
    const scale = Math.min(radius / R_REF, TICK_MAX / TICK);
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    // Out of the knot the marks are nowhere: each comes back with its stretch of thread.
    if (this.fieldOn) {
      this.beads.forEach((b) => {
        if (b.dot) b.dot.visible = false;
      });
      return;
    }
    const winding = this.nova.phase === "return";
    const at = { x: 0, y: 0 };
    this.beads.forEach((b) => {
      const opened = b === this.opened;
      // The mark on the ball.
      this.samplePos(b.i, p);
      this.rotate(p.x, p.y, p.z, q);
      const k = this.toScreen(q, radius, s0);
      const dz = depthInk(q.z, this.backInk);
      let ink = lerp(dz * base, 0.55 + 0.45 * dz, b.hl) * b.pop * this.veilAt(s0.x, s0.y);
      if (b.i > this.draw.value * (this.M - 1)) ink = 0;
      b.mz = q.z;
      // Its tick: along the surface, perpendicular to the thread; north, or south for dead work.
      this.sampleTan(b.i, t);
      bn.copy(p).cross(t).normalize().multiplyScalar(b.side);
      const breathe = b.project?.status === "alive" && !rm ? (BREATHE / 2) * (1 + Math.sin((this.clock / BREATHE_PERIOD) * Math.PI * 2)) : 0;
      const tick = (TICK + breathe) * b.pop;
      this.rotate(p.x + bn.x * 0.12, p.y + bn.y * 0.12, p.z + bn.z * 0.12, q);
      this.toScreen(q, radius, s1);
      let dx = s1.x - s0.x;
      let dy = s1.y - s0.y;
      let len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // Foreshortened as the surface turns away.
      len = tick * scale * k * Math.min(1, (len / (0.12 * radius * k)) * 1.05);
      let mx = s0.x;
      let my = s0.y;
      let front1 = b.mz >= 0;
      if (winding) {
        // Where its thread has got to, as it is pulled back; drawn as it comes home.
        this.screenAt(b.i, at);
        mx = at.x;
        my = at.y;
        const kb = this.kAt(b.i);
        ink *= kb;
        len *= kb;
      }
      if (opened && L) {
        const lift = rm ? 0 : this.liftOf(b, b.i);
        const l = this.lineAt(L, L.mark, { x: 0, y: 0 });
        mx = lerp(s0.x, l.x, lift);
        my = lerp(s0.y, l.y, lift);
        const ux = L.vertical ? b.side : 0;
        const uy = L.vertical ? 0 : -b.side;
        dx = lerp(dx, ux, lift);
        dy = lerp(dy, uy, lift);
        const n = Math.hypot(dx, dy) || 1;
        dx /= n;
        dy /= n;
        len = lerp(len, TICK + breathe, lift);
        ink = lerp(ink, 1, lift);
        if (lift > 0.3) front1 = true;
        if (rm && this.fadeIn.value > 0) {
          // Drawn a second time on the line, fading in.
          this.markShape(b, l.x, l.y, ux, uy, TICK, this.fadeIn.value, front);
          ink *= 1 - this.fadeIn.value;
        }
      }
      b.mx = mx;
      b.my = my;
      this.markShape(b, mx, my, dx, dy, len, ink, front1 ? front : back);
    });
  }

  private markShape(b: Bead, x: number, y: number, dx: number, dy: number, len: number, ink: number, layer: Ribbons) {
    const sc = this.scratch;
    const status = b.project?.status;
    if (b.project && status !== "paused" && ink > 0.004) {
      sc.reset();
      sc.push(x, y, ink);
      sc.push(x + dx * len, y + dy * len, ink);
      sc.normals();
      layer.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, 1);
    }
    if (status === "paused" && ink > 0.004) {
      // The horizon's ring: 1px at 3.5px, round on screen whatever the surface does.
      sc.reset();
      for (let k = 0; k <= 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        sc.push(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, ink);
      }
      sc.normals(true);
      layer.strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
    }
    if (b.dot) {
      const tip = status === "shipped";
      const r = tip ? 2 : 2.5;
      b.dot.position.set(tip ? x + dx * len : x, -(tip ? y + dy * len : y), 0);
      b.dot.scale.setScalar(r * Math.max(0.001, b.pop));
      b.dot.material.opacity = ink;
      b.dot.visible = ink > 0.004;
      b.dot.renderOrder = layer === this.front ? 410 : 210;
    }
  }

  /** Now: 40px of thread past the last turn at the top, held still: it turns with the ball and nothing else. */
  private drawLooseEnd(back: Ribbons, front: Ribbons, drawn: number) {
    if (!this.cursorOn || drawn < this.M - 1 || this.fieldOn) return;
    // Home last of all, out of the supernova.
    const wound = this.nova.phase === "return" ? this.kAt(this.M - 1) ** 2 : 1;
    if (wound <= 0) return;
    const sc = this.scratch;
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.radiusAt(recede);
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_INK, recede);
    this.samplePos(this.M - 1, p);
    this.sampleTan(this.M - 1, t);
    const len = (LOOSE / R_REF) * (this.R / R_REF) ** 0.3;
    sc.reset();
    let z = 0;
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      // On in the direction it was winding, then lifting off the ball in a soft arc.
      const lift = 1 + u * u * len * 0.85;
      const x = p.x * lift + t.x * u * len * 0.75;
      const y = p.y * lift + t.y * u * len * 0.75;
      const zz = p.z * lift + t.z * u * len * 0.75;
      this.rotate(x, y, zz, q);
      this.toScreen(q, radius, s);
      if (k === 0) z = q.z;
      sc.push(s.x, s.y, depthInk(q.z, this.backInk) * base * this.veilAt(s.x, s.y) * wound);
    }
    sc.normals();
    (z >= 0 ? front : back).strip(sc.x, sc.y, sc.a, sc.nx, sc.ny, 0, sc.n - 1);
  }

  /** The pieces: hung off their marks on the ball, riding the thread out when their project opens. */
  private hang() {
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const bn = new THREE.Vector3();
    const c = new THREE.Vector3();
    const q = new THREE.Vector3();
    const s = { x: 0, y: 0 };
    const a = { x: 0, y: 0 };
    const l = { x: 0, y: 0 };
    const recede = this.recede;
    const radius = this.radiusAt(recede);
    // The pieces grow with the ball to PIECE_MAX, and each knot's layout with them, so a big
    // ball's knots sit as close to their marks as a small one's: past that, only the ball grows.
    // A charge pulls them in to NOVA_PIECE_SCALE of that, flat on the thread, and takes their ink.
    const nc = this.nova.c;
    const scale = Math.min(radius / this.novaScale / R_REF, PIECE_MAX) * lerp(1, NOVA_PIECE_SCALE, nc);
    const fit = scale / (radius / R_REF);
    const hangOut = lerp(HANG_OUT, 0, nc);
    const pull = lerp(1, NOVA_PIECE_INK, nc);
    const whirring = nc > NOVA_WHIRR_FROM;
    // Behind an opened line the ball's pieces go further back than its thread: colour carries further than ink.
    const base = lerp(lerp(1, DIM, this.dim), RECEDE_PIECE_INK, recede);
    const pxToIdx = 1 / (this.arcStep * R_REF);
    const cv = this.capVeil.k;
    const crowd = this.projects.length >= CROWD;
    const L = this.layoutO;
    const rm = !!this.opts.reducedMotion;
    const drawn = this.draw.value * (this.M - 1);
    // The supernova: the covers (and their pieces) out in the field, or flying home in the return.
    const tabled = this.fieldOn || this.nova.phase === "return";
    const winding = this.nova.phase === "return";
    const tau = this.burstT;
    const fp = this.pose;
    const sorted: { pc: Piece; z: number; layer: number }[] = [];
    this.pieces.forEach((pc) => {
      const b = pc.bead;
      const opened = b === this.opened && L;
      const u = pc.mesh.material.uniforms;
      if (!pc.onBall && !opened) {
        pc.mesh.visible = false;
        pc.ink = 0;
        return;
      }
      // On the ball: the row runs along the thread from the mark, lifted off it and hung out (or in).
      const idx = b.i + pc.along * fit * pxToIdx;
      this.samplePos(idx, p);
      this.sampleTan(idx, t);
      // The thread under the piece, on the ball: a ride measures its offset from here.
      this.rotate(p.x, p.y, p.z, q);
      this.toScreen(q, radius, a);
      bn.copy(p).cross(t).normalize();
      const up = (pc.up * fit) / R_REF;
      const out = (hangOut * fit) / R_REF;
      c.copy(p)
        .addScaledVector(bn, b.side * up)
        .addScaledVector(p, b.side * out);
      if (whirring) pc.lon = Math.atan2(c.x, c.z);
      this.rotate(c.x, c.y, c.z, q);
      const k = this.toScreen(q, radius, s);
      const dz = depthInk(q.z);
      let h = pc.h * scale * k * outCubic(b.pop);
      let w = h * pc.aspect;
      // Behind the ball a piece is only a shape through the thread; inside it, half ink and soft.
      let ink = b.side > 0 ? 0.1 + 0.9 * smooth(clamp01((q.z + 0.3) / 0.8)) : 0.5 * (0.7 + 0.3 * dz);
      ink *= lerp(base, 1, b.hl) * b.pop * pull;
      if (crowd) ink *= smooth(clamp01((b.mz + 0.1) / 0.25));
      // Near the limb a knot hangs out past the ball: rather than be cut by the screen's edge, it
      // fades out as it crosses the side margin, gone by the time it would touch the edge.
      const over = Math.max(SIDE_MARGIN - (s.x - w / 2), s.x + w / 2 - (this.width - SIDE_MARGIN));
      if (over > 0) ink *= 1 - smooth(clamp01(over / SIDE_MARGIN));
      // Under an opened project's words the veil takes the whole piece; under a caption, the
      // shader takes only what lies under the words. The chosen project's own pieces thin only
      // under the words themselves; they change over as its stretch comes to full ink.
      ink *= this.veilOf(this.veil, 0, VEIL_FEATHER, s.x, s.y);
      const own = opened ? 0 : cv * b.hl;
      u.uVeilK.value = opened ? 0 : (cv - own) * (1 - VEIL_INK);
      u.uLineK.value = own * (1 - VEIL_INK);
      if (!pc.onBall) ink = 0;
      if (b.i > drawn) ink = 0;
      let blur = b.side < 0 ? 0.45 : 0;
      let x = s.x;
      let y = s.y;
      let z = q.z;
      let layer = b.side < 0 ? 1 : q.z >= 0 ? 2 : 0;
      let rot = 0;
      if (tabled) {
        // How far home it has been pulled, in the return (0: still out).
        const home = winding ? this.pulled(b.lag) : 0;
        if (this.fieldPose(pc, tau, fp)) {
          x = lerp(fp.x, x, home);
          y = lerp(fp.y, y, home);
          w = lerp(fp.w, w, home);
          h = lerp(fp.h, h, home);
          ink = lerp(fp.ink, ink, home);
          rot = fp.rot * (1 - home);
          blur *= home;
          // Over everything until it lands; later work on top.
          if (home < 1) {
            layer = 3;
            z = 1 + fp.rank * 0.001 + (b.pieces.length - pc.index) * 0.00001;
          }
          // Its tick sounds as its cover docks (see windStep).
        } else {
          // It stayed in the knot: it comes back with its project, a study with its stretch of thread.
          ink *= winding ? (b.project ? home : this.kAt(idx)) : 0;
        }
      }
      if (opened) {
        const f = L.frames[pc.index];
        const lineIdx = this.indexOfAlong(b, L, f.along);
        if (rm) {
          // A crossfade: out of the ball, then into its frame.
          const v = this.fadeIn.value;
          if (v >= 0.5) {
            this.lineAt(L, f.along, l);
            x = L.vertical ? f.across : l.x;
            y = L.vertical ? l.y : f.across;
            w = f.w;
            h = f.h;
            blur = 0;
            ink = (v - 0.5) * 2;
          } else ink *= 1 - v * 2;
          layer = 3;
        } else {
          const ride = this.rideOf(pc, idx, lineIdx);
          const e = ride.grow;
          // Dealt out: a quiet tick as each frame lands on the line.
          if (e >= 0.999 && !pc.landed && !this.closing) {
            pc.landed = true;
            sfx.play("tick", 0.35);
          }
          const offX = s.x - a.x;
          const offY = s.y - a.y;
          this.screenAt(ride.at, a);
          w = lerp(w, f.w, e);
          h = lerp(h, f.h, e);
          // Off the line by the frame's own gap, whatever size it has grown to.
          const sideX = L.vertical ? (f.across > L.line ? 1 : -1) : 0;
          const sideY = L.vertical ? 0 : f.across > L.line ? 1 : -1;
          x = a.x + lerp(offX, sideX * (16 * e + w / 2), e);
          y = a.y + lerp(offY, sideY * (FRAME_OFF * e + h / 2), e);
          ink = lerp(pc.onBall ? ink : 0, 1, pc.onBall ? e : clamp01(e * 1.6));
          blur *= 1 - e;
          if (ride.at > idx + 0.5 || e > 0.01) {
            layer = 3;
            z = 1 + (b.pieces.length - pc.index) * 0.01;
          }
        }
      }
      pc.sx = x;
      pc.sy = y;
      pc.sw = w;
      pc.sh = h;
      pc.sz = z;
      pc.ink = ink;
      pc.mesh.visible = ink > 0.004 && w > 0.5;
      if (!pc.mesh.visible) return;
      pc.mesh.position.set(x, -y, 0);
      pc.mesh.scale.set(w, h, 1);
      // Turned on the table: clockwise on screen is the other way in the scene, whose y runs up.
      pc.mesh.rotation.z = -rot;
      u.uFade.value = ink;
      u.uBlur.value = blur;
      sorted.push({ pc, z, layer });
    });
    // Behind the back thread, between the layers, in front; the opened project's frames over all.
    const bases = [100, 300, 500, 800];
    sorted.sort((m, n) => m.z - n.z);
    sorted.forEach(({ pc, layer }, r) => {
      pc.mesh.renderOrder = bases[layer] + r * 0.1;
    });
  }

  /**
   * A quiet tick as each project's mark crosses the front, only while the
   * ball is being turned. The same tick at the same level, faster and higher
   * as a charge pulls the ball in (1 at rest, exactly as it always was); in
   * the whirr the marks tick on the audio clock instead (see whirr).
   */
  private crossings() {
    const turning = Math.abs(this.vel) > 0.2 || !!this.turning;
    const rate = this.tickRate;
    const now = performance.now();
    const whirr = this.nova.whirring || now < this.nova.marksUntil;
    // From the collapse the ticks stop dead; the return has its own (see windStep).
    const gone = this.novaActive;
    this.beads.forEach((b) => {
      if (!b.project) return;
      const s = b.mz > 0 ? Math.sign(b.mx - this.cx) || 1 : 0;
      if (s && b.crossed && s !== b.crossed && turning && !whirr && !gone) {
        sfx.play("tick", MARK_TICK, rate);
        // Charging, the whirr about to start keeps its ticks clear of this one.
        if (this.nova.c > 0) this.nova.heard.push(sfx.clock);
      }
      if (s) b.crossed = s;
    });
  }

  /**
   * The heading yields when an opened project's frames reach it, or when its
   * words or settled frames share the heading's line, even off to one side:
   * two sentences on one line read as one. On a phone the standing line
   * always takes it.
   */
  private dimHeading() {
    if (!this.heading) return;
    let on = false;
    const b = this.opened;
    const L = this.layoutO;
    if (b && L?.vertical && this.unspool.p > 0.02) on = true;
    else if (b && L && b.open) {
      const { lead, tail } = this.heading;
      const hx0 = lead.base.x + lead.box[0];
      const hx1 = tail.base.x + tail.box[2];
      const hy0 = this.headingY - this.headingHalf - 6;
      const hy1 = this.headingY + this.headingHalf + 6;
      const shares = (y0: number, y1: number) => y1 > hy0 && y0 < hy1;
      const hit = (x0: number, y0: number, x1: number, y1: number) => x1 > hx0 && x0 < hx1 && shares(y0, y1);
      b.pieces.forEach((pc) => {
        if (pc.ink <= 0.3) return;
        const [x0, y0, x1, y1] = [pc.sx - pc.sw / 2, pc.sy - pc.sh / 2, pc.sx + pc.sw / 2, pc.sy + pc.sh / 2];
        // A piece still riding out counts only where it crosses the heading; a landed frame, by its line.
        if (pc.landed ? shares(y0, y1) : hit(x0, y0, x1, y1)) on = true;
      });
      const g = this.openGroup.position;
      [b.open.name, b.open.status, b.open.why, b.open.summary, b.open.link].forEach((m) => {
        const bb = blockBounds(m.t);
        const y = -(m.base.y + g.y);
        if (m.offset < m.span * 0.9 && shares(y - bb[3], y - bb[1])) on = true;
      });
    }
    if (on !== this.headingDimmed) {
      this.headingDimmed = on;
      this.ctx.add(() => {
        gsap.to(this.headInk, { v: on ? 0 : 1, duration: this.dur(0.3), ease: "power2.inOut", overwrite: true });
      });
    }
    // A charging ball takes the heading down to half its ink; the covers out, it comes back.
    const ink = this.headInk.v * lerp(1, NOVA_HEADING, this.nova.head);
    if (ink === this.headInkSet) return;
    this.headInkSet = ink;
    this.heading.lead.t.material.opacity = ink;
    this.heading.tail.t.material.opacity = ink;
  }

  /** Tells the page where the line under the heading goes and how much ink it has, when either changes (see onHeading). */
  private tellHeading(dt: number) {
    const h = this.heading;
    const tell = this.opts.onHeading;
    if (!h || !tell) return;
    const away = this.headingDimmed || this.novaActive ? 0 : 1;
    this.underInk = this.opts.reducedMotion ? away : this.underInk + (away - this.underInk) * (1 - Math.exp(-dt / 0.1));
    const risen = h.tail.span > 0 ? clamp01(1 - h.tail.offset / h.tail.span) : 1;
    const ink = Math.round(this.underInk * risen * 100) / 100;
    const x = Math.round(this.width / 2);
    const y = Math.round(this.headY + this.headingHalf);
    const told = `${x} ${y} ${ink}`;
    if (told === this.underTold) return;
    this.underTold = told;
    tell({ x, y }, ink);
  }

  setVisible(on: boolean) {
    this.pieces.forEach((pc) => {
      void pc.moving?.then((l) => {
        const v = l?.video;
        if (!v) return;
        if (on && this.opened === pc.bead && (pc.index > 0 || this.coverHot === pc)) void v.play().catch(() => undefined);
        else v.pause();
      });
    });
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.ticker);
    // Gone mid-supernova (a slide away drops the panel): the bloom still to come never sounds, the
    // bed comes back through the wall, the cooldown runs from now, and the page hears it is over.
    const n = this.nova;
    if (this.novaActive) {
      n.bloom?.();
      n.bloom = null;
      if (n.airShut) sfx.air(AIR_OPEN, 0.6);
      n.airShut = false;
      n.coolUntil = performance.now() + NOVA_COOL;
      this.setPhase("idle");
    }
    this.intro?.kill();
    this.openTl?.kill();
    this.unpluck();
    this.hushWhirr();
    this.stopTurn();
    this.ctx.kill();
    gsap.killTweensOf([this, this.unspool, this.fadeIn, this.draw, this.scroll, this.caseLift, this.headInk]);
    if (this.heading) gsap.killTweensOf([this.heading.lead, this.heading.tail, this.heading.wait]);
    gsap.killTweensOf(this.years.map((y) => y.m));
    this.pieces.forEach((pc) => {
      gsap.killTweensOf(pc.mesh.material.uniforms.uMix);
      pc.mesh.material.dispose();
      pc.still.dispose();
      void pc.moving?.then((l) => l?.dispose());
    });
    this.beads.forEach((b) => {
      b.dot?.material.dispose();
      const words = [b.cap.name, b.cap.status, b.cap.why, ...(b.open ? [b.open.name, b.open.status, b.open.why, b.open.summary, b.open.link] : [])];
      gsap.killTweensOf(words);
    });
    this.texts.forEach((t) => t.dispose());
    this.back?.dispose();
    this.front?.dispose();
    this.lineMat.dispose();
    this.dotGeo.dispose();
    this.planeGeo.dispose();
    this.glass.dispose();
    this.renderer.dispose();
    // troika's glyph atlas is shared by every text on the site, and a renderer that drew it stays
    // reachable through it, context and all, so each visit would leave a live context behind
    // until the browser starts losing the oldest. Lose this one on purpose. A tick later, and only
    // if no new scene has taken the canvas: in development React mounts the panel twice on the
    // same element, and the second scene gets this very context back.
    const { canvas, renderer, serial } = this;
    setTimeout(() => {
      if (owners.get(canvas) === serial) renderer.forceContextLoss();
    }, 0);
  }
}
