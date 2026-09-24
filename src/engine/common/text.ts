import type * as THREE from "three";
import { Text, preloadFont } from "troika-three-text";
import { GL } from "@/engine/common/color";

export const FONT = {
  grotesk: "/fonts/grotesk-500.woff",
  serif: "/fonts/serif-400.woff",
  serifLight: "/fonts/serif-300.woff",
} as const;

export function preloadFonts(chars: string): Promise<void> {
  return new Promise((resolve) => {
    let n = 0;
    const done = () => ++n === 2 && resolve();
    preloadFont({ font: FONT.grotesk, characters: chars }, done);
    preloadFont({ font: FONT.serif, characters: chars }, done);
  });
}

export type TextOpts = {
  font: string;
  size: number;
  /** A raw colour (see rawColor); defaults to the ink token. */
  color?: THREE.Color;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom" | "top-baseline" | "bottom-baseline";
  letterSpacing?: number;
  lineHeight?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
};

/** A troika Text with the site defaults: ink colour, no anti-aliasing surprises. */
export function makeText(content: string, o: TextOpts): Text {
  const t = new Text();
  t.text = content;
  t.font = o.font;
  t.fontSize = o.size;
  t.color = o.color ?? GL.ink;
  t.anchorX = o.anchorX ?? "left";
  t.anchorY = o.anchorY ?? "top";
  t.letterSpacing = o.letterSpacing ?? 0;
  t.lineHeight = o.lineHeight ?? "normal";
  if (o.maxWidth) t.maxWidth = o.maxWidth;
  t.textAlign = o.align ?? "left";
  t.sdfGlyphSize = 64;
  return t;
}

/**
 * Resolves with the laid-out width and height once troika has synced.
 * Listens for the synccomplete event rather than passing a callback, because
 * troika drops the callback when a sync (for example one started by the
 * render loop's onBeforeRender) is already in flight.
 */
export function syncText(t: Text): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const finish = () => {
      const b = t.textRenderInfo?.blockBounds ?? [0, 0, 0, 0];
      resolve({ width: b[2] - b[0], height: b[3] - b[1] });
    };
    if (t.textRenderInfo && !t._needsSync && !t._isSyncing) {
      finish();
      return;
    }
    const onDone = () => {
      t.removeEventListener("synccomplete", onDone);
      finish();
    };
    t.addEventListener("synccomplete", onDone);
    t.sync();
  });
}
