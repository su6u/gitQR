import type { StyledQrGrid, StyledQrModule } from "@/lib/qr-map";

export const FINDER_MODULE_SIZE = 7;
const FINDER_MID_MODULES = 5;
const FINDER_INNER_MODULES = 3;

export type FinderCorner = "topLeft" | "topRight" | "bottomLeft";

export const FINDER_CORNERS: FinderCorner[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
];

export function isFinderModule(
  row: number,
  col: number,
  size: number,
): boolean {
  const inTop = row < FINDER_MODULE_SIZE;
  const inBottom = row >= size - FINDER_MODULE_SIZE;
  const inLeft = col < FINDER_MODULE_SIZE;
  const inRight = col >= size - FINDER_MODULE_SIZE;
  return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
}

/** Local 0–6 coords within a finder corner zone. */
export function finderLocalCoords(
  row: number,
  col: number,
  size: number,
): { localRow: number; localCol: number } | null {
  if (!isFinderModule(row, col, size)) return null;

  const inTop = row < FINDER_MODULE_SIZE;
  const inBottom = row >= size - FINDER_MODULE_SIZE;
  const inLeft = col < FINDER_MODULE_SIZE;

  if (inTop && inLeft) {
    return { localRow: row, localCol: col };
  }
  if (inTop && !inLeft) {
    return {
      localRow: row,
      localCol: col - (size - FINDER_MODULE_SIZE),
    };
  }
  if (inBottom && inLeft) {
    return {
      localRow: row - (size - FINDER_MODULE_SIZE),
      localCol: col,
    };
  }

  return null;
}

/** Whether a finder module cell intersects the circular finder boundary. */
export function isFinderLocalModuleInCircle(
  localRow: number,
  localCol: number,
): boolean {
  const center = FINDER_MODULE_SIZE / 2;
  const radius = FINDER_MODULE_SIZE / 2;
  const closestX = Math.max(localCol, Math.min(center, localCol + 1));
  const closestY = Math.max(localRow, Math.min(center, localRow + 1));
  const dx = closestX - center;
  const dy = closestY - center;
  return dx * dx + dy * dy <= radius * radius;
}

export function isFinderModuleInCircle(
  row: number,
  col: number,
  size: number,
): boolean {
  const local = finderLocalCoords(row, col, size);
  if (!local) return false;
  return isFinderLocalModuleInCircle(local.localRow, local.localCol);
}

export function finderOrigin(
  corner: FinderCorner,
  size: number,
): { row: number; col: number } {
  switch (corner) {
    case "topLeft":
      return { row: 0, col: 0 };
    case "topRight":
      return { row: 0, col: size - FINDER_MODULE_SIZE };
    case "bottomLeft":
      return { row: size - FINDER_MODULE_SIZE, col: 0 };
  }
}

/** Outer pixel span of a 7×7 finder aligned to the styled module grid. */
export function finderOuterPx(modulePx: number, gap: number): number {
  return FINDER_MODULE_SIZE * modulePx + (FINDER_MODULE_SIZE - 1) * gap;
}

export interface FinderDrawLayout {
  offsetX: number;
  offsetY: number;
  modulePx: number;
  gap: number;
  background: string;
  fillForModule: (mod: StyledQrModule) => string;
  pixelAlign?: boolean;
}

export interface SolidFinderMetrics {
  outerPx: number;
  midPx: number;
  innerPx: number;
}

export interface SolidFinderFills {
  outer: string;
  inner: string;
}

function moduleAt(
  grid: StyledQrGrid,
  row: number,
  col: number,
): StyledQrModule {
  return grid.modules[row * grid.size + col] as StyledQrModule;
}

function parseHex(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.min(255, Math.max(0, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function averageDarkFill(
  modules: StyledQrModule[],
  layout: FinderDrawLayout,
): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const mod of modules) {
    if (!mod.isDark) continue;
    const fill = layout.fillForModule(mod);
    if (fill.toLowerCase() === layout.background.toLowerCase()) continue;
    const [rr, gg, bb] = parseHex(fill);
    r += rr;
    g += gg;
    b += bb;
    count++;
  }

  if (count === 0) {
    return layout.fillForModule(modules[0] as StyledQrModule);
  }

  return rgbToHex(r / count, g / count, b / count);
}

function outerFrameModules(
  grid: StyledQrGrid,
  startRow: number,
  startCol: number,
): StyledQrModule[] {
  const modules: StyledQrModule[] = [];
  const inset = (FINDER_MODULE_SIZE - FINDER_MID_MODULES) / 2;

  for (let r = 0; r < FINDER_MODULE_SIZE; r++) {
    for (let c = 0; c < FINDER_MODULE_SIZE; c++) {
      const inMid =
        r >= inset &&
        r < inset + FINDER_MID_MODULES &&
        c >= inset &&
        c < inset + FINDER_MID_MODULES;
      if (inMid) continue;
      modules.push(moduleAt(grid, startRow + r, startCol + c));
    }
  }

  return modules;
}

function innerCoreModules(
  grid: StyledQrGrid,
  startRow: number,
  startCol: number,
): StyledQrModule[] {
  const modules: StyledQrModule[] = [];
  const inset = (FINDER_MODULE_SIZE - FINDER_INNER_MODULES) / 2;

  for (let r = inset; r < inset + FINDER_INNER_MODULES; r++) {
    for (let c = inset; c < inset + FINDER_INNER_MODULES; c++) {
      modules.push(moduleAt(grid, startRow + r, startCol + c));
    }
  }

  return modules;
}

export function solidFinderMetrics(outerPx: number): SolidFinderMetrics {
  const cell = outerPx / FINDER_MODULE_SIZE;
  return {
    outerPx,
    midPx: cell * FINDER_MID_MODULES,
    innerPx: cell * FINDER_INNER_MODULES,
  };
}

export function solidFinderFills(
  grid: StyledQrGrid,
  corner: FinderCorner,
  layout: FinderDrawLayout,
): SolidFinderFills {
  const { row, col } = finderOrigin(corner, grid.size);
  return {
    outer: averageDarkFill(outerFrameModules(grid, row, col), layout),
    inner: averageDarkFill(innerCoreModules(grid, row, col), layout),
  };
}

function finderTopLeftPx(
  corner: FinderCorner,
  grid: StyledQrGrid,
  layout: FinderDrawLayout,
): { x: number; y: number } {
  const { row, col } = finderOrigin(corner, grid.size);
  const span = layout.modulePx + layout.gap;
  return {
    x: layout.offsetX + col * span,
    y: layout.offsetY + row * span,
  };
}

function snap(value: number, pixelAlign?: boolean) {
  return pixelAlign ? Math.round(value) : value;
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  if (radius <= 0) return;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

/** Nested circles — outer ring, background band, inner dot. */
export function drawSolidFinders(
  ctx: CanvasRenderingContext2D,
  grid: StyledQrGrid,
  layout: FinderDrawLayout,
): void {
  for (const corner of FINDER_CORNERS) {
    const { x, y } = finderTopLeftPx(corner, grid, layout);
    const fills = solidFinderFills(grid, corner, layout);
    const { outerPx, midPx, innerPx } = solidFinderMetrics(
      finderOuterPx(layout.modulePx, layout.gap),
    );
    const cx = snap(x + outerPx / 2, layout.pixelAlign);
    const cy = snap(y + outerPx / 2, layout.pixelAlign);

    ctx.fillStyle = fills.outer;
    fillCircle(ctx, cx, cy, snap(outerPx / 2, layout.pixelAlign));

    ctx.fillStyle = layout.background;
    fillCircle(ctx, cx, cy, snap(midPx / 2, layout.pixelAlign));

    ctx.fillStyle = fills.inner;
    fillCircle(ctx, cx, cy, snap(innerPx / 2, layout.pixelAlign));
  }
}

export function solidFinderSvgCircles(
  grid: StyledQrGrid,
  layout: FinderDrawLayout,
): string {
  const outerPx = finderOuterPx(layout.modulePx, layout.gap);
  const { midPx, innerPx } = solidFinderMetrics(outerPx);
  const parts: string[] = [];

  for (const corner of FINDER_CORNERS) {
    const { x, y } = finderTopLeftPx(corner, grid, layout);
    const fills = solidFinderFills(grid, corner, layout);
    const cx = x + outerPx / 2;
    const cy = y + outerPx / 2;

    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${outerPx / 2}" fill="${fills.outer}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${midPx / 2}" fill="${layout.background}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${innerPx / 2}" fill="${fills.inner}"/>`,
    );
  }

  return parts.join("");
}
