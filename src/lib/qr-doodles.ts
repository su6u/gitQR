import { PANEL_WIDTH_RATIO, qrRegionCells } from "@/lib/qr-layout";

/** null = transparent; hex = painted square */
export interface DoodleSprite {
  id: string;
  cells: (string | null)[][];
  /** Extra rows down when placed in a side gutter. */
  rowOffset?: number;
  /** Extra cols right when placed in a side gutter. */
  colOffset?: number;
}

const HEART = "#F28482";
const HEART_LIGHT = "#E5989B";

const CAT = "#FFB86C";
const CAT_EAR = "#F4A261";
const CAT_EYE = "#000000";
const CAT_NOSE = "#E5989B";

const CLAUDE_BODY = "#DA7758";
const CLAUDE_EYE = "#000000";

const CLAUDE: DoodleSprite = {
  id: "claude",
  cells: [
    [null, CLAUDE_BODY, CLAUDE_BODY, CLAUDE_BODY, null],
    [CLAUDE_BODY, CLAUDE_EYE, CLAUDE_BODY, CLAUDE_EYE, CLAUDE_BODY],
    [null, CLAUDE_BODY, CLAUDE_BODY, CLAUDE_BODY, null],
    [CLAUDE_BODY, null, CLAUDE_BODY, null, CLAUDE_BODY],
  ],
};

const SIDE_DOODLES: DoodleSprite[] = [
  {
    id: "heart",
    rowOffset: 9,
    colOffset: 1,
    cells: [
      [null, HEART, null, HEART, null],
      [HEART, HEART_LIGHT, HEART_LIGHT, HEART_LIGHT, HEART],
      [HEART, HEART_LIGHT, HEART_LIGHT, HEART_LIGHT, HEART],
      [null, HEART, HEART_LIGHT, HEART, null],
      [null, null, HEART, null, null],
    ],
  },
  {
    id: "cat",
    cells: [
      [CAT_EAR, null, null, null, CAT_EAR],
      [CAT_EAR, CAT, CAT, CAT, CAT_EAR],
      [CAT, CAT_EYE, CAT, CAT_EYE, CAT],
      [CAT, CAT, CAT_NOSE, CAT, CAT],
      [null, CAT, CAT, CAT, null],
    ],
  },
];

const SPARK_COLOR = "#FFD166";
const SPARK_BRIGHT = "#FFF0A8";

const SPARK: DoodleSprite = {
  id: "spark",
  cells: [
    [null, SPARK_COLOR, null],
    [SPARK_COLOR, SPARK_BRIGHT, SPARK_COLOR],
    [null, SPARK_COLOR, null],
  ],
};

type MicroZone =
  | "left-high"
  | "below-cat"
  | "bottom-left"
  | "bottom-right";

const MICRO_DOODLES: Array<{ sprite: DoodleSprite; zone: MicroZone }> = [
  { sprite: SPARK, zone: "left-high" },
  { sprite: SPARK, zone: "below-cat" },
  { sprite: SPARK, zone: "bottom-left" },
  { sprite: SPARK, zone: "bottom-right" },
];

const QR_CLEARANCE = 1;
const PLACE_ATTEMPTS = 48;
const SIDE_GUTTER_CELLS = 7;
/** Nudge claude slightly right of QR center. */
const CLAUDE_COL_OFFSET = 12;
const CLAUDE_ROW_OFFSET = 1;

type SideZone = "left" | "right";

function clampCol(col: number, width: number, cols: number) {
  const colLimit = visibleColMax(cols, width);
  return Math.max(0, Math.min(col, colLimit));
}

function claudeCandidates(
  rows: number,
  cols: number,
): Array<{ row: number; col: number }> {
  const region = qrRegionCells(rows, cols);
  if (!region) return [];

  const { width, height } = spriteSize(CLAUDE);
  const { startRow, startCol, size } = region;
  const qrEndRow = startRow + size - 1;
  const qrEndCol = startCol + size - 1;
  const hCenter = startCol + Math.floor(size / 2) - Math.floor(width / 2);
  const hAnchor = clampCol(hCenter + CLAUDE_COL_OFFSET, width, cols);

  const leftCol = startCol - QR_CLEARANCE - width;
  const rightCol = qrEndCol + QR_CLEARANCE + 1;
  const belowRow = qrEndRow + QR_CLEARANCE + 1 + CLAUDE_ROW_OFFSET;
  const bottomRow = rows - height;

  const candidates: Array<{ row: number; col: number }> = [
    { row: belowRow, col: hAnchor },
    { row: bottomRow, col: hAnchor },
    { row: bottomRow, col: clampCol(rightCol, width, cols) },
    { row: belowRow, col: clampCol(rightCol, width, cols) },
    { row: bottomRow, col: clampCol(leftCol, width, cols) },
    { row: belowRow, col: clampCol(leftCol, width, cols) },
    {
      row: Math.max(0, startRow - QR_CLEARANCE - height),
      col: hAnchor,
    },
  ];

  return candidates.filter(
    (c) =>
      c.row >= 0 &&
      c.row + height <= rows &&
      c.col >= 0 &&
      c.col + width <= cols,
  );
}

function placeClaude(
  fills: Map<number, string>,
  occupied: Set<number>,
  rows: number,
  cols: number,
): boolean {
  for (const pos of claudeCandidates(rows, cols)) {
    if (stampSprite(fills, occupied, cols, pos.row, pos.col, CLAUDE)) {
      return true;
    }
  }
  return false;
}

function visibleColMax(cols: number, spriteWidth: number) {
  const panelStartCol = Math.floor(cols * (1 - PANEL_WIDTH_RATIO));
  return panelStartCol - spriteWidth - 1;
}

function spriteSize(sprite: DoodleSprite) {
  const height = sprite.cells.length;
  const width = Math.max(...sprite.cells.map((row) => row.length));
  return { width, height };
}

function qrOccupied(rows: number, cols: number): Set<number> {
  const region = qrRegionCells(rows, cols);
  if (!region) return new Set();

  const occupied = new Set<number>();
  for (let r = -QR_CLEARANCE; r < region.size + QR_CLEARANCE; r++) {
    for (let c = -QR_CLEARANCE; c < region.size + QR_CLEARANCE; c++) {
      const row = region.startRow + r;
      const col = region.startCol + c;
      if (row < 0 || col < 0 || row >= rows || col >= cols) continue;
      occupied.add(row * cols + col);
    }
  }
  return occupied;
}

function sideZoneBounds(
  zone: SideZone,
  rows: number,
  cols: number,
  width: number,
  height: number,
  rowOffset = 0,
): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
  const region = qrRegionCells(rows, cols);
  if (!region) return null;

  const { startRow, startCol, size } = region;
  const qrEndCol = startCol + size - 1;
  const vAnchor =
    startRow + Math.floor(size / 3) - Math.floor(height / 2) + rowOffset;
  const colLimit = visibleColMax(cols, width);

  if (zone === "left") {
    const maxCol = startCol - QR_CLEARANCE - width;
    const minCol = Math.max(0, maxCol - SIDE_GUTTER_CELLS + 1);
    return {
      minRow: Math.max(0, vAnchor - 1),
      maxRow: Math.min(rows - height, vAnchor + 1),
      minCol,
      maxCol,
    };
  }

  const minCol = qrEndCol + QR_CLEARANCE + 1;
  const maxCol = Math.min(colLimit, minCol + SIDE_GUTTER_CELLS - 1);
  return {
    minRow: Math.max(0, vAnchor - 1),
    maxRow: Math.min(rows - height, vAnchor + 1),
    minCol,
    maxCol,
  };
}

function boundsValid(
  bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number } | null,
): bounds is { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  if (!bounds) return false;
  return bounds.maxRow >= bounds.minRow && bounds.maxCol >= bounds.minCol;
}

function stampSprite(
  fills: Map<number, string>,
  occupied: Set<number>,
  cols: number,
  anchorRow: number,
  anchorCol: number,
  sprite: DoodleSprite,
): boolean {
  const pending: Array<{ index: number; color: string }> = [];

  for (let r = 0; r < sprite.cells.length; r++) {
    for (let c = 0; c < sprite.cells[r].length; c++) {
      const color = sprite.cells[r][c];
      if (!color) continue;

      const row = anchorRow + r;
      const col = anchorCol + c;
      const index = row * cols + col;

      if (occupied.has(index) || fills.has(index)) return false;
      pending.push({ index, color });
    }
  }

  for (const { index, color } of pending) {
    fills.set(index, color);
    occupied.add(index);
  }
  return true;
}

function pickSideAnchor(
  bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number },
  seed: number,
  colOffset = 0,
): { row: number; col: number } {
  const row = Math.floor((bounds.minRow + bounds.maxRow) / 2);
  const span = bounds.maxCol - bounds.minCol + 1;
  const col = Math.min(
    bounds.maxCol,
    bounds.minCol + (seed % span) + colOffset,
  );
  return { row, col };
}

function microZoneAnchor(
  zone: MicroZone,
  rows: number,
  cols: number,
  width: number,
  height: number,
): { row: number; col: number } | null {
  const region = qrRegionCells(rows, cols);
  if (!region) return null;

  const { startRow, startCol, size } = region;
  const qrEndRow = startRow + size - 1;
  const qrEndCol = startCol + size - 1;
  const colLimit = visibleColMax(cols, width);

  switch (zone) {
    case "left-high": {
      const row = startRow + Math.floor(size / 5);
      const col = Math.max(0, startCol - QR_CLEARANCE - width - 1);
      if (row + height > rows) return null;
      return { row, col };
    }
    case "below-cat": {
      const row = startRow + Math.floor(size / 3) + 13;
      const col = Math.min(colLimit, qrEndCol + QR_CLEARANCE + 2);
      if (row + height > rows || col + width > cols) return null;
      return { row, col };
    }
    case "bottom-left": {
      const row = Math.min(rows - height, qrEndRow + QR_CLEARANCE + 1);
      const col = startCol + 2;
      if (col + width > cols) return null;
      return { row, col };
    }
    case "bottom-right": {
      const row = Math.min(rows - height, qrEndRow + QR_CLEARANCE + 2);
      const col = clampCol(startCol + size - width - 4, width, cols);
      if (row < 0) return null;
      return { row, col };
    }
  }
}

function placeMicroDoodles(
  fills: Map<number, string>,
  occupied: Set<number>,
  rows: number,
  cols: number,
) {
  for (const { sprite, zone } of MICRO_DOODLES) {
    const { width, height } = spriteSize(sprite);
    const anchor = microZoneAnchor(zone, rows, cols, width, height);
    if (!anchor) continue;
    stampSprite(fills, occupied, cols, anchor.row, anchor.col, sprite);
  }
}

/** heart, cat side doodles + claude below the QR + spark accents. */
export function placeBoardDoodles(rows: number, cols: number): Map<number, string> {
  if (rows === 0 || cols === 0) return new Map();

  const fills = new Map<number, string>();
  const occupied = qrOccupied(rows, cols);

  placeClaude(fills, occupied, rows, cols);

  const sideZones: SideZone[] = ["left", "right"];
  for (let i = 0; i < SIDE_DOODLES.length; i++) {
    const sprite = SIDE_DOODLES[i];
    const { width, height } = spriteSize(sprite);
    const bounds = sideZoneBounds(
      sideZones[i],
      rows,
      cols,
      width,
      height,
      sprite.rowOffset ?? 0,
    );
    if (!boundsValid(bounds)) continue;

    let placed = false;
    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt++) {
      const { row, col } = pickSideAnchor(
        bounds,
        i * 17 + attempt * 7,
        sprite.colOffset ?? 0,
      );
      if (stampSprite(fills, occupied, cols, row, col, sprite)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      const { row, col } = pickSideAnchor(bounds, i, sprite.colOffset ?? 0);
      stampSprite(fills, occupied, cols, row, col, sprite);
    }
  }

  placeMicroDoodles(fills, occupied, rows, cols);

  return fills;
}
