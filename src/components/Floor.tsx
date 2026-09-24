/**
 * A checkerboard floor in one-point perspective, fixed to the bottom of the
 * viewport. Rows converge on a horizon at the top edge of the container and a
 * mask fades the whole plane out well before it gets there.
 */
const VIEW_W = 2400;
const VIEW_H = 400;
const ROWS = 10;
/** Depth of one tile as a fraction of the distance to the nearest row. */
const TILE_DEPTH = 0.3;
/** Width of a tile on the nearest row, in viewBox units. */
const NEAR_TILE_WIDTH = 160;
const CENTER = VIEW_W / 2;

const MASK = "linear-gradient(to top, black, transparent 74%)";

const round = (n: number) => Number(n.toFixed(1));

/** Screen y of row boundary i. Boundaries pile up toward the horizon at y = 0. */
const boundaryY = (i: number) => VIEW_H / (1 + i * TILE_DEPTH);
/** Projected tile width along row boundary i. */
const boundaryTileWidth = (i: number) => NEAR_TILE_WIDTH / (1 + i * TILE_DEPTH);

/** One path holding every light tile. The dark tiles are the background showing through. */
function lightTiles(): string {
  const quads: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    const yNear = round(boundaryY(row));
    const yFar = round(boundaryY(row + 1));
    const wNear = boundaryTileWidth(row);
    const wFar = boundaryTileWidth(row + 1);
    // Enough columns that the narrower far edge still spans the full width.
    const half = Math.ceil(CENTER / wFar);
    for (let col = -half; col < half; col++) {
      if ((row + col) % 2 !== 0) continue;
      const nearL = round(CENTER + col * wNear);
      const nearR = round(CENTER + (col + 1) * wNear);
      const farR = round(CENTER + (col + 1) * wFar);
      const farL = round(CENTER + col * wFar);
      quads.push(`M${nearL} ${yNear}H${nearR}L${farR} ${yFar}H${farL}Z`);
    }
  }
  return quads.join("");
}

const LIGHT_TILES = lightTiles();

export function Floor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[clamp(200px,42vh,55vh)] overflow-hidden"
      style={{ WebkitMaskImage: MASK, maskImage: MASK }}
    >
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMin slice"
      >
        <path d={LIGHT_TILES} className="fill-surface-2 opacity-40" />
      </svg>
    </div>
  );
}
