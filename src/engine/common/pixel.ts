/**
 * The site's pixel levels: each level's cell, CSS px (where it is drawn, rounded to whole device
 * pixels). Level 1 is the new zero: in Space the suit, its line, the sky (its stars, the Milky Way,
 * its planets) and the items are never drawn smoother than it, however close the zoom comes, and
 * zooming far out coarsens them from it.
 */
export const PIXEL_LEVELS = [0, 2, 3, 4] as const;

/** The least level anything in Space is drawn at. */
export const PIXEL_LEAST = 1;

/** A level's cell, whole device px, at `ratio` device px per CSS px (0 for level 0, smooth). */
export function levelCell(level: number, ratio: number) {
  const css = PIXEL_LEVELS[level] ?? 0;
  return css > 0 ? Math.max(1, Math.round(css * ratio)) : 0;
}
