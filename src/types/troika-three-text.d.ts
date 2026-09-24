/** Minimal typings for the parts of troika-three-text this site uses. */
declare module "troika-three-text" {
  import type { BufferGeometry, Material, Mesh, Object3DEventMap } from "three";

  export interface TextEventMap extends Object3DEventMap {
    syncstart: object;
    synccomplete: object;
  }

  export interface TextRenderInfo {
    /** [minX, minY, maxX, maxY] of the laid-out block, in local units. */
    blockBounds: [number, number, number, number];
  }

  export class Text extends Mesh<BufferGeometry, Material, TextEventMap> {
    text: string;
    font: string | null;
    fontSize: number;
    color: number | string;
    anchorX: number | string;
    anchorY: number | string;
    letterSpacing: number;
    lineHeight: number | "normal";
    maxWidth: number;
    textAlign: "left" | "right" | "center" | "justify";
    sdfGlyphSize: number | null;
    clipRect: [number, number, number, number] | null;
    material: Material & { opacity: number; transparent: boolean };
    textRenderInfo: TextRenderInfo | null;
    /** Internal, but stable: true while a sync is queued or running. */
    _needsSync: boolean;
    _isSyncing: boolean;
    sync(callback?: () => void): void;
    dispose(): void;
  }

  export function preloadFont(
    options: { font?: string; characters?: string | string[]; sdfGlyphSize?: number },
    callback: () => void,
  ): void;
}
