/**
 * Colour tokens (spec 3). The page sits on eigengrau, the grey the eye sees in
 * total darkness. Ink is its exact inverse, so the white exclusion and
 * difference labels (monogram, cursor words) resolve to ink over the page.
 * Surfaces are eigengrau lifted by the same step the light theme sank white.
 * Keep in step with --bg, --ink, --glass-bg and --tag-bg in globals.css.
 */
export const COLOR = {
  bg: "#16161d",
  ink: "#e9e9e2",
  glass: "#28282f",
  tag: "#25252c",
} as const;
