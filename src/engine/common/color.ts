import * as THREE from "three";
import { COLOR } from "@/lib/color";

/**
 * A colour stored as-is, with no sRGB decode. The renderers output raw (see
 * makeRenderer), so the hex in the token file is exactly the pixel on screen.
 */
export function rawColor(css: string) {
  return new THREE.Color().setStyle(css, THREE.LinearSRGBColorSpace);
}

export const GL = {
  bg: rawColor(COLOR.bg),
  ink: rawColor(COLOR.ink),
  tag: rawColor(COLOR.tag),
} as const;
